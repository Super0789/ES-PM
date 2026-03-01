import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listPayments, certifyPayment, deletePayment, updatePayment } from '../api/payments.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'
import { useAuth } from '../hooks/useAuth.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'

export default function TrackPayments() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  const [hideCertified, setHideCertified] = useState(false)
  const [clientFilter, setClientFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [editPayment, setEditPayment] = useState(null)
  const [editForm, setEditForm] = useState({})

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payments-all'],
    queryFn: () => listPayments({ page_size: 500 }),
  })

  const certifyMutation = useMutation({
    mutationFn: (id) => certifyPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments-all'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments-all'] }); setDeleteId(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePayment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments-all'] }); setEditPayment(null) },
  })

  const allPayments = Array.isArray(data) ? data : data?.results || []

  // Collect unique clients from payments
  const clients = [...new Set(allPayments.map((p) => p.project_client).filter(Boolean))]

  let filtered = allPayments
  if (hideCertified) filtered = filtered.filter((p) => p.Status !== 'Certified')
  if (clientFilter) filtered = filtered.filter((p) => p.project_client === clientFilter)

  const totalPending = filtered
    .filter((p) => p.Status !== 'Certified')
    .reduce((s, p) => s + Number(p.Payment_Value || 0), 0)

  const openEdit = (pay) => {
    setEditPayment(pay)
    setEditForm({
      Payment_Value: pay.Payment_Value,
      Date_Submitted: pay.Date_Submitted || '',
      Date_Certified: pay.Date_Certified || '',
      Payment_Slot: pay.Payment_Slot || '',
      Status: pay.Status || 'Pending',
    })
  }

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  if (error) return <ErrorMessage message={error.message} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Track Payments</h1>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card border border-blue-200 bg-blue-50">
          <div className="text-2xl font-bold text-blue-800">{allPayments.length}</div>
          <div className="text-sm text-blue-700 mt-1">Total Payments</div>
        </div>
        <div className="card border border-yellow-200 bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-800">
            {allPayments.filter((p) => p.Status !== 'Certified').length}
          </div>
          <div className="text-sm text-yellow-700 mt-1">Pending Payments</div>
        </div>
        <div className="card border border-yellow-200 bg-yellow-50">
          <div className="text-lg font-bold text-yellow-800">{formatCurrency(totalPending)}</div>
          <div className="text-sm text-yellow-700 mt-1">Total Pending Amount</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hideCertified}
            onChange={(e) => setHideCertified(e.target.checked)}
            className="rounded text-blue-800"
          />
          Hide Certified
        </label>
        <select
          className="input w-48"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
        >
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-th">Project #</th>
                <th className="table-th">Project Name</th>
                <th className="table-th">Slot</th>
                <th className="table-th text-right">Value (AED)</th>
                <th className="table-th">Submitted</th>
                <th className="table-th">Status</th>
                <th className="table-th">Certified Date</th>
                {canEdit && <th className="table-th">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((pay) => (
                <tr key={pay.id} className={pay.Status === 'Certified' ? 'bg-green-50' : ''}>
                  <td className="table-td">
                    <Link to={`/projects/${pay.project}`} className="text-blue-700 hover:underline font-medium">
                      {pay.project_number || pay.project}
                    </Link>
                  </td>
                  <td className="table-td max-w-[160px] truncate">{pay.project_name || '-'}</td>
                  <td className="table-td">{pay.Payment_Slot || '-'}</td>
                  <td className="table-td font-mono text-right">{formatCurrency(pay.Payment_Value)}</td>
                  <td className="table-td">{formatDate(pay.Date_Submitted)}</td>
                  <td className="table-td">
                    {pay.Status === 'Certified' ? (
                      <span className="badge-green">Certified</span>
                    ) : (
                      <span className="badge-yellow">Pending</span>
                    )}
                  </td>
                  <td className="table-td">{formatDate(pay.Date_Certified)}</td>
                  {canEdit && (
                    <td className="table-td">
                      <div className="flex gap-1">
                        {pay.Status !== 'Certified' && (
                          <button
                            onClick={() => certifyMutation.mutate(pay.id)}
                            disabled={certifyMutation.isPending}
                            className="btn btn-success btn-sm"
                          >
                            Certify
                          </button>
                        )}
                        <button onClick={() => openEdit(pay)} className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={() => setDeleteId(pay.id)} className="btn btn-danger btn-sm">Del</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="table-td text-center text-gray-400 py-10">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editPayment} onClose={() => setEditPayment(null)} title="Edit Payment" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Payment Value (AED)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={editForm.Payment_Value || ''}
              onChange={(e) => setEditForm({ ...editForm, Payment_Value: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date Submitted</label>
            <input
              type="date"
              className="input"
              value={editForm.Date_Submitted || ''}
              onChange={(e) => setEditForm({ ...editForm, Date_Submitted: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={editForm.Status}
              onChange={(e) => setEditForm({ ...editForm, Status: e.target.value })}
            >
              <option value="Pending">Pending</option>
              <option value="Certified">Certified</option>
            </select>
          </div>
          {editForm.Status === 'Certified' && (
            <div>
              <label className="label">Date Certified</label>
              <input
                type="date"
                className="input"
                value={editForm.Date_Certified || ''}
                onChange={(e) => setEditForm({ ...editForm, Date_Certified: e.target.value })}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditPayment(null)} className="btn btn-secondary">Cancel</button>
            <button
              onClick={() => updateMutation.mutate({ id: editPayment.id, data: editForm })}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Payment"
        message="Are you sure you want to delete this payment?"
      />
    </div>
  )
}
