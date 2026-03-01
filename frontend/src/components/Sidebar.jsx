import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const NavItem = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-700 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    {label}
  </NavLink>
)

export default function Sidebar({ isOpen }) {
  const { user } = useAuth()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 flex flex-col transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-auto`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          ES
        </div>
        <div>
          <div className="text-white font-semibold text-sm">Emirates Stone</div>
          <div className="text-gray-400 text-xs">Project Manager</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/" end icon="🏠" label="Dashboard" />
        <NavItem to="/projects" icon="📋" label="Projects" />
        <NavItem to="/payments" icon="💳" label="Track Payments" />
        <NavItem to="/handing-over" icon="✅" label="Handing Over" />
        <NavItem to="/overdue" icon="⚠️" label="Overdue Projects" />
        <NavItem to="/reports" icon="📊" label="Reports" />
        {user?.role === 'admin' && (
          <NavItem to="/users" icon="👥" label="User Management" />
        )}
      </nav>

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">Logged in as</div>
        <div className="text-sm text-gray-200 font-medium truncate">{user?.username || user?.email}</div>
        <div className="text-xs text-blue-400 capitalize">{user?.role || 'viewer'}</div>
      </div>
    </aside>
  )
}
