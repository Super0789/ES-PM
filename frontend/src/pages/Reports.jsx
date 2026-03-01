import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, exportProjects } from '../api/projects.js'
import { formatCurrency } from '../utils/formatters.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'

export default function Reports() {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const response = await exportProjects()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `projects_export_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setExportError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  if (error) return <ErrorMessage message={error.message} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Export Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Export Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          Download all project data as a CSV file for further analysis in Excel or other tools.
        </p>
        {exportError && (
          <div className="mb-3 text-sm text-red-600">{exportError}</div>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn btn-primary disabled:opacity-60"
        >
          {exporting ? 'Exporting…' : '⬇ Export All Projects to CSV'}
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatItem label="Total Projects" value={stats?.total_projects || 0} />
          <StatItem label="Active Projects" value={stats?.active_projects || 0} />
          <StatItem label="Completed Projects" value={stats?.completed_projects || 0} />
          <StatItem label="Total Contract Value" value={formatCurrency(stats?.total_contract_value)} />
          <StatItem label="Total Project Value" value={formatCurrency(stats?.total_project_value)} />
          <StatItem label="Pending Payments" value={stats?.pending_payments_count || 0} />
          <StatItem label="Overdue Projects" value={stats?.overdue_count || 0} />
          <StatItem label="Initial HO Pending" value={stats?.initial_ho_pending || 0} />
          <StatItem label="Final HO Pending" value={stats?.final_ho_pending || 0} />
        </div>
      </div>

      {/* Projects by Year */}
      {stats?.projects_by_year?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Projects by Year</h2>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Year</th>
                <th className="table-th text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.projects_by_year.map((row) => (
                <tr key={row.year}>
                  <td className="table-td">{row.year}</td>
                  <td className="table-td text-right">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Projects by PM */}
      {stats?.projects_by_pm?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Projects by Project Manager</h2>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Project Manager</th>
                <th className="table-th text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.projects_by_pm.map((row, i) => (
                <tr key={i}>
                  <td className="table-td">{row.pm || 'Unassigned'}</td>
                  <td className="table-td text-right">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}
