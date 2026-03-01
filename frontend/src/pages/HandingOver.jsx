import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getHandingOverProjects, updateHandingOver } from '../api/projects.js'
import { formatDate } from '../utils/formatters.js'
import { HANDING_OVER_STATUS } from '../utils/constants.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'

function InlineEdit({ value, options, onSave, type = 'select' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-gray-700 hover:text-blue-700 underline decoration-dashed"
        title="Click to edit"
      >
        {value || <span className="text-gray-400 italic">click to edit</span>}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {type === 'select' ? (
        <select
          className="input py-1 text-xs w-32"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
        >
          <option value="">—</option>
          {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className="input py-1 text-xs w-36"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
        />
      )}
      <button
        onClick={() => { onSave(val); setEditing(false) }}
        className="btn btn-primary btn-sm"
      >✓</button>
      <button onClick={() => setEditing(false)} className="btn btn-secondary btn-sm">✕</button>
    </div>
  )
}

function ProjectRow({ project, onUpdate }) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload) => updateHandingOver(project.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['handing-over'] }),
  })

  return (
    <tr className="hover:bg-gray-50">
      <td className="table-td">
        <Link to={`/projects/${project.id}`} className="text-blue-700 hover:underline font-medium">
          {project.Project_number}
        </Link>
      </td>
      <td className="table-td max-w-[150px] truncate">{project.Project_name || '-'}</td>
      <td className="table-td">{project.Client || '-'}</td>
      <td className="table-td">
        <InlineEdit
          value={project.Initial_Handing_Over_Status}
          options={HANDING_OVER_STATUS}
          onSave={(v) => mutation.mutate({ Initial_Handing_Over_Status: v })}
        />
      </td>
      <td className="table-td">
        <InlineEdit
          value={project.Initial_Handing_Over_Letter_Date}
          type="date"
          onSave={(v) => mutation.mutate({ Initial_Handing_Over_Letter_Date: v || null })}
        />
      </td>
      <td className="table-td">
        <InlineEdit
          value={project.Final_Handing_Over_Status}
          options={HANDING_OVER_STATUS}
          onSave={(v) => mutation.mutate({ Final_Handing_Over_Status: v })}
        />
      </td>
      <td className="table-td">
        <InlineEdit
          value={project.Final_Handing_Over_Letter_Date}
          type="date"
          onSave={(v) => mutation.mutate({ Final_Handing_Over_Letter_Date: v || null })}
        />
      </td>
      <td className="table-td max-w-[160px]">
        <InlineEdit
          value={project.Initial_Handing_Over_Comments}
          type="text"
          onSave={(v) => mutation.mutate({ Initial_Handing_Over_Comments: v })}
        />
      </td>
    </tr>
  )
}

export default function HandingOver() {
  const [clientFilter, setClientFilter] = useState('')
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['handing-over'],
    queryFn: getHandingOverProjects,
  })

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  if (error) return <ErrorMessage message={error.message} onRetry={refetch} />

  const all = Array.isArray(data) ? data : data?.results || []
  const clients = [...new Set(all.map((p) => p.Client).filter(Boolean))]

  const filtered = clientFilter ? all.filter((p) => p.Client === clientFilter) : all

  const initialPending = filtered.filter(
    (p) => !p.Initial_Handing_Over_Status || p.Initial_Handing_Over_Status === 'Pending'
  )
  const finalPending = filtered.filter(
    (p) => !p.Final_Handing_Over_Status || p.Final_Handing_Over_Status === 'Pending'
  )
  const overdueHO = filtered.filter((p) => {
    if (p.Initial_Handing_Over_Status !== 'Done') return false
    if (p.Final_Handing_Over_Status === 'Done') return false
    const date = p.Initial_Handing_Over_Letter_Date
    if (!date) return false
    const diff = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24 * 365)
    return diff > 1
  })

  const renderTable = (projects, emptyMsg) => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="table-th">Project #</th>
            <th className="table-th">Name</th>
            <th className="table-th">Client</th>
            <th className="table-th">Initial HO Status</th>
            <th className="table-th">Initial HO Date</th>
            <th className="table-th">Final HO Status</th>
            <th className="table-th">Final HO Date</th>
            <th className="table-th">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={8} className="table-td text-center text-gray-400 py-8">
                {emptyMsg}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Handing Over Tracking</h1>
        <select
          className="input w-48"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
        >
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card border border-red-200 bg-red-50">
          <div className="text-2xl font-bold text-red-700">{initialPending.length}</div>
          <div className="text-sm text-red-600 mt-1">Initial HO Pending</div>
        </div>
        <div className="card border border-red-200 bg-red-50">
          <div className="text-2xl font-bold text-red-700">{finalPending.length}</div>
          <div className="text-sm text-red-600 mt-1">Final HO Pending</div>
        </div>
        <div className="card border border-orange-200 bg-orange-50">
          <div className="text-2xl font-bold text-orange-700">{overdueHO.length}</div>
          <div className="text-sm text-orange-600 mt-1">Overdue HO (&gt;1 year)</div>
        </div>
      </div>

      {/* Section 1: Initial HO Pending */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 bg-red-50 border-b border-red-200">
          <h2 className="text-base font-semibold text-red-700">
            🔴 Initial HO Pending ({initialPending.length})
          </h2>
        </div>
        {renderTable(initialPending, 'No projects with Initial HO pending')}
      </div>

      {/* Section 2: Final HO Pending */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 bg-red-50 border-b border-red-200">
          <h2 className="text-base font-semibold text-red-700">
            🔴 Final HO Pending ({finalPending.length})
          </h2>
        </div>
        {renderTable(finalPending, 'No projects with Final HO pending')}
      </div>

      {/* Section 3: Overdue HO */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 bg-orange-50 border-b border-orange-200">
          <h2 className="text-base font-semibold text-orange-700">
            🟠 Overdue HO – Initial Done but &gt;1 year, Final Not Complete ({overdueHO.length})
          </h2>
        </div>
        {renderTable(overdueHO, 'No overdue handing over projects')}
      </div>
    </div>
  )
}
