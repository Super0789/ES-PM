import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProject } from '../api/projects.js'
import { listPayments, deletePayment, certifyPayment } from '../api/payments.js'
import { listBOQ, createBOQItem, updateBOQItem, deleteBOQItem } from '../api/boq.js'
import { listAttachments, uploadAttachment, deleteAttachment, downloadAttachment } from '../api/attachments.js'
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters.js'
import { VARIATION_FIELDS, ATTACHMENT_FIELDS } from '../utils/constants.js'
import { useAuth } from '../hooks/useAuth.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import FileUpload from '../components/FileUpload.jsx'

const TABS = ['General Info', 'Work Orders', 'Payments', 'Handing Over', 'BOQ', 'Attachments']

function Field({ label, value, mono }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '-'}</dd>
    </div>
  )
}

export default function ProjectDetail() {
  const { pk } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const canEdit = user?.role === 'editor' || user?.role === 'admin'
  const [tab, setTab] = useState(0)
  const [deletePaymentId, setDeletePaymentId] = useState(null)
  const [boqEdit, setBoqEdit] = useState(null)
  const [boqForm, setBoqForm] = useState({ description: '', quantity: '', unit: '', unit_price: '' })
  const [boqModalOpen, setBoqModalOpen] = useState(false)
  const [uploadField, setUploadField] = useState(null)
  const [deleteAttachId, setDeleteAttachId] = useState(null)

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', pk],
    queryFn: () => getProject(pk),
  })

  const { data: payments } = useQuery({
    queryKey: ['payments', pk],
    queryFn: () => listPayments({ project: pk }),
    enabled: tab === 2,
  })

  const { data: boqItems } = useQuery({
    queryKey: ['boq', pk],
    queryFn: () => listBOQ(pk),
    enabled: tab === 4,
  })

  const { data: attachments } = useQuery({
    queryKey: ['attachments', pk],
    queryFn: () => listAttachments(pk),
    enabled: tab === 5,
  })

  const certifyMutation = useMutation({
    mutationFn: (id) => certifyPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments', pk] }),
  })

  const deletePaymentMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments', pk] }),
  })

  const boqCreateMutation = useMutation({
    mutationFn: (data) => createBOQItem({ ...data, project: pk }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boq', pk] }); setBoqModalOpen(false) },
  })

  const boqUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => updateBOQItem(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boq', pk] }); setBoqModalOpen(false) },
  })

  const boqDeleteMutation = useMutation({
    mutationFn: deleteBOQItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boq', pk] }),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ field, file }) => uploadAttachment(pk, field, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attachments', pk] }); setUploadField(null) },
  })

  const deleteAttachMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', pk] }),
  })

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  if (error) return <ErrorMessage message={error.message} />

  const p = project

  const openBoqEdit = (item) => {
    setBoqEdit(item)
    setBoqForm({ description: item.description, quantity: item.quantity, unit: item.unit, unit_price: item.unit_price })
    setBoqModalOpen(true)
  }

  const openBoqNew = () => {
    setBoqEdit(null)
    setBoqForm({ description: '', quantity: '', unit: '', unit_price: '' })
    setBoqModalOpen(true)
  }

  const submitBoq = () => {
    if (boqEdit) {
      boqUpdateMutation.mutate({ id: boqEdit.id, data: boqForm })
    } else {
      boqCreateMutation.mutate(boqForm)
    }
  }

  const handleDownload = async (attach) => {
    try {
      const response = await downloadAttachment(attach.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = attach.file_name || 'attachment'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed', e)
    }
  }

  const paymentsList = Array.isArray(payments) ? payments : payments?.results || []
  const totalPaid = paymentsList.reduce((s, pay) => s + Number(pay.Payment_value || 0), 0)
  const boqList = Array.isArray(boqItems) ? boqItems : boqItems?.results || []
  const attachList = Array.isArray(attachments) ? attachments : attachments?.results || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/projects" className="hover:text-blue-700">Projects</Link>
            <span>/</span>
            <span>{p.Project_number}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{p.Project_number} – {p.Project_name || ''}</h1>
          <div className="flex items-center gap-2 mt-1">
            {p.Project_Finished === 'Yes' ? (
              <span className="badge-green">Completed</span>
            ) : (
              <span className="badge-blue">Active</span>
            )}
            {p.is_overdue && <span className="badge-red">Overdue</span>}
            {p.Client && <span className="text-sm text-gray-500">{p.Client}</span>}
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => navigate(`/projects/${pk}/edit`)}
            className="btn btn-primary btn-sm"
          >
            Edit Project
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === i
                  ? 'border-blue-800 text-blue-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {tab === 0 && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <Field label="Project Number" value={p.Project_number} />
            <Field label="Project Name" value={p.Project_name} />
            <Field label="Client" value={p.Client} />
            <Field label="Project Manager" value={p.Project_Manager} />
            <Field label="Contract Number" value={p.Contract_Number} />
            <Field label="Contract Value (AED)" value={formatCurrency(p.Contract_Value)} mono />
            <Field label="Project Value (AED)" value={formatCurrency(p.Project_Value)} mono />
            <Field label="Physical Completion" value={formatPercent(p.Physical_Completion)} />
            <Field label="Financial Completion" value={formatPercent(p.Financial_Completion)} />
            <Field label="Start Date" value={formatDate(p.Start_Date)} />
            <Field label="End Date" value={formatDate(p.End_Date)} />
            <Field label="Actual End Date" value={formatDate(p.Actual_End_Date)} />
            <Field label="Project Finished" value={p.Project_Finished} />
            <Field label="Remaining 10%" value={p.Remaining_10_Percent} />
            <Field label="Discrepancy %" value={p.Discrepancy_Percentage != null ? `${p.Discrepancy_Percentage}%` : '-'} />
            <Field label="Year" value={p.Year} />
            <Field label="Notes" value={p.Notes} />
          </dl>
        )}

        {tab === 1 && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">Work Order</th>
                  <th className="table-th text-right">Value (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {VARIATION_FIELDS.map(({ key, label }) => {
                  const val = p[key]
                  if (val == null || val === '' || val === 0) return null
                  return (
                    <tr key={key}>
                      <td className="table-td">{label}</td>
                      <td className="table-td text-right font-mono">{formatCurrency(val)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="table-td">Total</td>
                  <td className="table-td text-right font-mono">{formatCurrency(p.Project_Value)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-th">Slot</th>
                    <th className="table-th">Value (AED)</th>
                    <th className="table-th">Submitted</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Certified Date</th>
                    {canEdit && <th className="table-th">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentsList.map((pay) => (
                    <tr key={pay.Payment_ID}>
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
                                className="btn btn-success btn-sm"
                              >
                                Certify
                              </button>
                            )}
                            <button
                              onClick={() => setDeletePaymentId(pay.Payment_ID)}
                              className="btn btn-danger btn-sm"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {paymentsList.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="table-td text-center text-gray-400 py-6">
                        No payments recorded
                      </td>
                    </tr>
                  )}
                </tbody>
                {paymentsList.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="table-td">Total Paid</td>
                      <td className="table-td font-mono text-right">{formatCurrency(totalPaid)}</td>
                      <td colSpan={canEdit ? 4 : 3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4">Initial Handing Over</h3>
              <dl className="space-y-4">
                <Field label="HO Letter No." value={p.Initial_Handing_Over_Letter_No} />
                <Field label="HO Letter Date" value={formatDate(p.Initial_Handing_Over_Letter_Date)} />
                <Field label="Status" value={p.Initial_Handing_Over_Status} />
                <Field label="Comments" value={p.Initial_Handing_Over_Comments} />
              </dl>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4">Final Handing Over</h3>
              <dl className="space-y-4">
                <Field label="HO Letter No." value={p.Final_Handing_Over_Letter_No} />
                <Field label="HO Letter Date" value={formatDate(p.Final_Handing_Over_Letter_Date)} />
                <Field label="Status" value={p.Final_Handing_Over_Status} />
                <Field label="Comments" value={p.Final_Handing_Over_Comments} />
              </dl>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div>
            {canEdit && (
              <div className="mb-4">
                <button onClick={openBoqNew} className="btn btn-primary btn-sm">+ Add BOQ Item</button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-th">Description</th>
                    <th className="table-th">Quantity</th>
                    <th className="table-th">Unit</th>
                    <th className="table-th">Unit Price (AED)</th>
                    <th className="table-th">Total (AED)</th>
                    {canEdit && <th className="table-th">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {boqList.map((item) => (
                    <tr key={item.id}>
                      <td className="table-td">{item.description}</td>
                      <td className="table-td">{item.quantity}</td>
                      <td className="table-td">{item.unit}</td>
                      <td className="table-td font-mono text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="table-td font-mono text-right">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                      {canEdit && (
                        <td className="table-td">
                          <div className="flex gap-1">
                            <button onClick={() => openBoqEdit(item)} className="btn btn-secondary btn-sm">Edit</button>
                            <button onClick={() => boqDeleteMutation.mutate(item.id)} className="btn btn-danger btn-sm">Del</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {boqList.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="table-td text-center text-gray-400 py-6">
                        No BOQ items
                      </td>
                    </tr>
                  )}
                </tbody>
                {boqList.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="table-td" colSpan={4}>Total</td>
                      <td className="table-td font-mono text-right">
                        {formatCurrency(boqList.reduce((s, i) => s + i.quantity * i.unit_price, 0))}
                      </td>
                      {canEdit && <td />}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div className="space-y-6">
            {ATTACHMENT_FIELDS.map((field) => {
              const fieldAttachments = attachList.filter((a) => a.field_name === field)
              return (
                <div key={field}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">{field}</h3>
                    {canEdit && (
                      <FileUpload
                        label="Upload"
                        onFileSelect={(file) => uploadMutation.mutate({ field, file })}
                      />
                    )}
                  </div>
                  {fieldAttachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {fieldAttachments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-400">📄</span>
                            <span className="text-sm text-gray-700 truncate">{a.file_name || a.original_filename || 'File'}</span>
                          </div>
                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            <button
                              onClick={() => handleDownload(a)}
                              className="btn btn-secondary btn-sm"
                            >
                              ⬇
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => setDeleteAttachId(a.id)}
                                className="btn btn-danger btn-sm"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No files uploaded</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* BOQ Modal */}
      <Modal
        isOpen={boqModalOpen}
        onClose={() => setBoqModalOpen(false)}
        title={boqEdit ? 'Edit BOQ Item' : 'Add BOQ Item'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={boqForm.description}
              onChange={(e) => setBoqForm({ ...boqForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                className="input"
                value={boqForm.quantity}
                onChange={(e) => setBoqForm({ ...boqForm, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <input
                className="input"
                value={boqForm.unit}
                onChange={(e) => setBoqForm({ ...boqForm, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Unit Price</label>
              <input
                type="number"
                className="input"
                value={boqForm.unit_price}
                onChange={(e) => setBoqForm({ ...boqForm, unit_price: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setBoqModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={submitBoq} className="btn btn-primary">
              {boqEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletePaymentId}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={() => deletePaymentMutation.mutate(deletePaymentId)}
        title="Delete Payment"
        message="Are you sure you want to delete this payment?"
      />

      <ConfirmDialog
        isOpen={!!deleteAttachId}
        onClose={() => setDeleteAttachId(null)}
        onConfirm={() => deleteAttachMutation.mutate(deleteAttachId)}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment?"
      />
    </div>
  )
}
