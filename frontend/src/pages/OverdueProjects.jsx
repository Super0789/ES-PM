import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getOverdueProjects } from '../api/projects.js'
import { formatDate } from '../utils/formatters.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'

export default function OverdueProjects() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['overdue-projects'],
    queryFn: getOverdueProjects,
  })

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  if (error) return <ErrorMessage message={error.message} onRetry={refetch} />

  const projects = Array.isArray(data) ? data : data?.results || []

  const getDaysOverdue = (endDate) => {
    if (!endDate) return null
    const diff = new Date() - new Date(endDate)
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Overdue Projects</h1>
        <div className="badge-red text-sm px-3 py-1">
          {projects.length} overdue
        </div>
      </div>

      {projects.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span>
            <strong>{projects.length} project{projects.length !== 1 ? 's' : ''}</strong> have passed
            their planned end date and are not yet completed.
          </span>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-th">Project #</th>
                <th className="table-th">Project Name</th>
                <th className="table-th">Client</th>
                <th className="table-th">Project Manager</th>
                <th className="table-th">Planned End Date</th>
                <th className="table-th">Days Overdue</th>
                <th className="table-th">Physical %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => {
                const days = getDaysOverdue(p.Project_End_date)
                return (
                  <tr key={p.Project_number} className="bg-red-50 hover:bg-red-100">
                    <td className="table-td">
                      <Link
                        to={`/projects/${p.Project_number}`}
                        className="text-blue-700 hover:underline font-medium"
                      >
                        {p.Project_number}
                      </Link>
                    </td>
                    <td className="table-td max-w-[180px] truncate">{p.Project_Name || '-'}</td>
                    <td className="table-td">{p.Client || '-'}</td>
                    <td className="table-td">{p.Project_Manager || '-'}</td>
                    <td className="table-td text-red-600 font-medium">
                      {formatDate(p.Project_End_date)}
                    </td>
                    <td className="table-td">
                      {days != null ? (
                        <span className="badge-red">{days} days</span>
                      ) : '-'}
                    </td>
                    <td className="table-td">
                      {p.percent_Physical_Completed != null
                        ? `${(p.percent_Physical_Completed * 100).toFixed(1)}%`
                        : '-'}
                    </td>
                  </tr>
                )
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                    🎉 No overdue projects!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
