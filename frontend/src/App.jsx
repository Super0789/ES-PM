import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProjectList from './pages/ProjectList.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import ProjectForm from './pages/ProjectForm.jsx'
import TrackPayments from './pages/TrackPayments.jsx'
import HandingOver from './pages/HandingOver.jsx'
import OverdueProjects from './pages/OverdueProjects.jsx'
import Reports from './pages/Reports.jsx'
import UserManagement from './pages/UserManagement.jsx'
import { useAuth } from './hooks/useAuth.js'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectForm />} />
        <Route path="projects/:pk" element={<ProjectDetail />} />
        <Route path="projects/:pk/edit" element={<ProjectForm />} />
        <Route path="payments" element={<TrackPayments />} />
        <Route path="handing-over" element={<HandingOver />} />
        <Route path="overdue" element={<OverdueProjects />} />
        <Route path="reports" element={<Reports />} />
        <Route
          path="users"
          element={
            user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" replace />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
