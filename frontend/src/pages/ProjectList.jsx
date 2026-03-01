import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listProjects, deleteProject, exportProjects } from '../api/projects.js'
import { formatCurrency, formatPercent } from '../utils/formatters.js'
import { PROJECT_MANAGERS } from '../utils/constants.js'
import { useAuth } from '../hooks/useAuth.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Pagination from '../components/Pagination.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

const PAGE_SIZE = 20

export default function ProjectList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    client: '',
    pm: '',
    year: '',
    remaining_10: false,
    initial_ho_pending: false,
    final_ho_pending: false,
    payment_pending: false,
    discrepancy_6: false,
    show_completed: false,
  })
  const [deleteId, setDeleteId] = useState(null)

  const queryParams = {
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    client: filters.client || undefined,
    pm: filters.pm || undefined,
    year: filters.year || undefined,
    remaining_10: filters.remaining_10 || undefined,
    initial_ho_pending: filters.initial_ho_pending || undefined,
    final_ho_pending: filters.final_ho_pending || undefined,
    payment_pending: filters.payment_pending || undefined,
    discrepancy_6: filters.discrepancy_6 || undefined,
    show_completed: filters.show_completed || undefined,
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', queryParams],
    queryFn: () => listProjects(queryParams),
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setDeleteId(null)
    },
  })

  const handleExport = async () => {
    try {
      const response = await exportProjects(queryParams)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'projects_export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed', e)
    }
  }

  const setFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }, [])

  const projects = data?.results || data || []
  const total = data?.count || projects.length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const rowClass = (p) => {
    if (p.Project_Finished === 'Yes') return 'bg-green-50 hover:bg-green-100'
    if (p.is_overdue) return 'bg-red-50 hover:bg-red-100'
    return 'hover:bg-gray-50'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn btn-secondary btn-sm">
            ⬇ Export CSV
          </button>
          {canEdit && (
            <Link to="/projects/new" className="btn btn-primary btn-sm">
              + New Project
            </Link>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search project #, name, client, contract..."
            className="input flex-1 min-w-[220px]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <select
            className="input w-40"
            value={filters.pm}
            onChange={(e) => setFilter('pm', e.target.value)}
          >
            <option value="">All PMs</option>
            {PROJECT_MANAGERS.map((pm) => (
              <option key={pm} value={pm}>{pm}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Year"
            className="input w-24"
            value={filters.year}
            onChange={(e) => setFilter('year', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            ['remaining_10', 'Remaining 10%'],
            ['initial_ho_pending', 'Initial HO Pending'],
            ['final_ho_pending', 'Final HO Pending'],
            ['payment_pending', 'Payment Pending'],
            ['discrepancy_6', 'Discrepancy ≥6%'],
            ['show_completed', 'Show Completed'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => setFilter(key, e.target.checked)}
                className="rounded text-blue-800"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner className="mt-10" />
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={refetch} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-th">Project #</th>
                  <th className="table-th">Project Name</th>
                  <th className="table-th">Client</th>
                  <th className="table-th">PM</th>
                  <th className="table-th">Contract Value</th>
                  <th className="table-th">Project Value</th>
                  <th className="table-th">% Physical</th>
                  <th className="table-th">% Financial</th>
                  <th className="table-th">Status</th>
                  {canEdit && <th className="table-th">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p.Project_number} className={rowClass(p)}>
                    <td className="table-td">
                      <Link
                        to={`/projects/${p.Project_number}`}
                        className="text-blue-700 hover:underline font-medium"
                      >
                        {p.Project_number}
                      </Link>
                    </td>
                    <td className="table-td max-w-[180px] truncate">{p.Project_Name || '-'}</td>
                    <td className="table-td max-w-[140px] truncate">{p.Client || '-'}</td>
                    <td className="table-td">{p.Project_Manager || '-'}</td>
                    <td className="table-td font-mono text-right">{formatCurrency(p.Main_Contract_Value)}</td>
                    <td className="table-td font-mono text-right">{formatCurrency(p.overall_project_value)}</td>
                    <td className="table-td">{formatPercent(p.percent_Physical_Completed)}</td>
                    <td className="table-td">{formatPercent(p.financial_percent_completed)}</td>
                    <td className="table-td">
                      {p.Project_Finished === 'Yes' ? (
                        <span className="badge-green">Completed</span>
                      ) : p.is_overdue ? (
                        <span className="badge-red">Overdue</span>
                      ) : (
                        <span className="badge-blue">Active</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="table-td">
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/projects/${p.Project_number}/edit`)}
                            className="btn btn-secondary btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(p.Project_number)}
                            className="btn btn-danger btn-sm"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 10 : 9} className="table-td text-center text-gray-400 py-10">
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {projects.length} of {total} projects</span>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
      />
    </div>
  )
}
