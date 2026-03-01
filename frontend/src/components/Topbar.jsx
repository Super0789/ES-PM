import { useAuth } from '../hooks/useAuth.js'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-gray-800">Emirates Stone PM System</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <div className="text-sm font-medium text-gray-700">{user?.first_name || user?.username}</div>
          <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
