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
  const [projectFilter, setProjectFilter] = useState('')
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

  // Collect unique project names from payments
  const projectNames = [...new Set(allPayments.map((p) => p.project_name).filter(Boolean))]

  let filtered = allPayments
  if (hideCertified) filtered = filtered.filter((p) => !p.Certified)
  if (projectFilter) filtered = filtered.filter((p) => p.project_name === projectFilter)

  const totalPending = filtered
    .filter((p) => !p.Certified)
    .reduce((s, p) => s + Number(p.Payment_value || 0), 0)

  const openEdit = (pay) => {
    setEditPayment(pay)
    setEditForm({
      Payment_value: pay.Payment_value,
      Date_of_submission: pay.Date_of_submission || '',
      Date_of_certification: pay.Date_of_certification || '',
      Payment_Slot: pay.Payment_Slot || '',
      Certified: pay.Certified || false,
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
            {allPayments.filter((p) => !p.Certified).length}
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
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All Projects</option>
          {projectNames.map((n) => <option key={n} value={n}>{n}</option>)}
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
                <tr key={pay.Payment_ID} className={pay.Certified ? 'bg-green-50' : ''}>
                  <td className="table-td">
                    <Link to={`/projects/${pay.Project_number}`} className="text-blue-700 hover:underline font-medium">
                      {pay.Project_number}
                    </Link>
                  </td>
                  <td className="table-td max-w-[160px] truncate">{pay.project_name || '-'}</td>
                  <td className="table-td">{pay.Payment_Slot || '-'}</td>
                  <td className="table-td font-mono text-right">{formatCurrency(pay.Payment_value)}</td>
                  <td className="table-td">{formatDate(pay.Date_of_submission)}</td>
                  <td className="table-td">
                    {pay.Certified ? (
                      <span className="badge-green">Certified</span>
                    ) : (
                      <span className="badge-yellow">Pending</span>
                    )}
                  </td>
                  <td className="table-td">{formatDate(pay.Date_of_certification)}</td>
                  {canEdit && (
                    <td className="table-td">
                      <div className="flex gap-1">
                        {!pay.Certified && (
                          <button
                            onClick={() => certifyMutation.mutate(pay.Payment_ID)}
                            disabled={certifyMutation.isPending}
                            className="btn btn-success btn-sm"
                          >
                            Certify
                          </button>
                        )}
                        <button onClick={() => openEdit(pay)} className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={() => setDeleteId(pay.Payment_ID)} className="btn btn-danger btn-sm">Del</button>
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
              value={editForm.Payment_value || ''}
              onChange={(e) => setEditForm({ ...editForm, Payment_value: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date Submitted</label>
            <input
              type="date"
              className="input"
              value={editForm.Date_of_submission || ''}
              onChange={(e) => setEditForm({ ...editForm, Date_of_submission: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={editForm.Certified ? 'Certified' : 'Pending'}
              onChange={(e) => setEditForm({ ...editForm, Certified: e.target.value === 'Certified' })}
            >
              <option value="Pending">Pending</option>
              <option value="Certified">Certified</option>
            </select>
          </div>
          {editForm.Certified && (
            <div>
              <label className="label">Date Certified</label>
              <input
                type="date"
                className="input"
                value={editForm.Date_of_certification || ''}
                onChange={(e) => setEditForm({ ...editForm, Date_of_certification: e.target.value })}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditPayment(null)} className="btn btn-secondary">Cancel</button>
            <button
              onClick={() => updateMutation.mutate({ id: editPayment.Payment_ID, data: editForm })}
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
