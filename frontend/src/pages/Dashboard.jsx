import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getDashboardStats } from '../api/projects.js'
import { formatCurrency } from '../utils/formatters.js'
import { CHART_COLORS } from '../utils/constants.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'

function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  }
  return (
    <div className={`card border ${colors[color]} flex items-start gap-4`}>
      {icon && <span className="text-3xl">{icon}</span>}
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm font-medium mt-0.5">{label}</div>
        {sub && <div className="text-xs mt-1 opacity-70">{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  if (error) return <ErrorMessage message={error.message} onRetry={refetch} />

  const projectsByYear = stats?.projects_by_year || []
  const projectsByPM = stats?.projects_by_pm || []
  const paymentStatus = stats?.payment_status || []
  const recentProjects = stats?.recent_projects || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={stats?.total_projects || 0}
          icon="📋"
          color="blue"
        />
        <StatCard
          label="Active Projects"
          value={stats?.active_projects || 0}
          icon="🔄"
          color="green"
        />
        <StatCard
          label="Completed Projects"
          value={stats?.completed_projects || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          label="Total Contract Value"
          value={formatCurrency(stats?.total_contract_value)}
          icon="💰"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Pending Payments"
          value={stats?.pending_payments_count || 0}
          icon="💳"
          color="yellow"
        />
        <StatCard
          label="Overdue Projects"
          value={stats?.overdue_count || 0}
          icon="⚠️"
          color="red"
          sub={stats?.overdue_count > 0 ? 'Requires attention' : 'None overdue'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Year */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Projects by Year</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projectsByYear} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projects by PM */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Projects by Manager</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={projectsByPM}
                cx="50%"
                cy="50%"
                outerRadius={85}
                dataKey="count"
                nameKey="pm"
                label={({ pm, percent }) => `${pm ? pm.split(' ').slice(-1)[0] : 'N/A'} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {projectsByPM.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n, p) => [v, p.payload.pm || 'N/A']} />
              <Legend formatter={(v, e) => e.payload.pm || 'N/A'} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Status Chart */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Payment Certification Status</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={paymentStatus} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="status" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {paymentStatus.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.status === 'Certified' ? '#16a34a' : '#dc2626'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-blue-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Project #</th>
                <th className="table-th">Name</th>
                <th className="table-th">Client</th>
                <th className="table-th">PM</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentProjects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <Link to={`/projects/${p.id}`} className="text-blue-700 hover:underline font-medium">
                      {p.Project_number}
                    </Link>
                  </td>
                  <td className="table-td">{p.Project_name || '-'}</td>
                  <td className="table-td">{p.Client || '-'}</td>
                  <td className="table-td">{p.Project_Manager || '-'}</td>
                  <td className="table-td">
                    {p.Project_Finished === 'Yes' ? (
                      <span className="badge-green">Completed</span>
                    ) : (
                      <span className="badge-blue">Active</span>
                    )}
                  </td>
                </tr>
              ))}
              {recentProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-td text-center text-gray-400 py-6">
                    No projects yet
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
