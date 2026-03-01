import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers, createUser, updateUser, deleteUser } from '../api/auth.js'
import { ROLES } from '../utils/constants.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

const EMPTY_FORM = { username: '', email: '', first_name: '', last_name: '', role: 'viewer', password: '' }

export default function UserManagement() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState(null)
  const [serverError, setServerError] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal() },
    onError: (e) => setServerError(e.response?.data ? JSON.stringify(e.response.data) : e.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal() },
    onError: (e) => setServerError(e.response?.data ? JSON.stringify(e.response.data) : e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeleteId(null) },
  })

  const openNew = () => {
    setEditUser(null)
    setForm(EMPTY_FORM)
    setServerError('')
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ username: u.username, email: u.email || '', first_name: u.first_name || '', last_name: u.last_name || '', role: u.role || 'viewer', password: '' })
    setServerError('')
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditUser(null) }

  const handleSubmit = (e) => {
    e.preventDefault()
    setServerError('')
    const payload = { ...form }
    if (!payload.password) delete payload.password
    if (editUser) {
      updateMutation.mutate({ id: editUser.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const users = Array.isArray(data) ? data : data?.results || []

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  if (error) return <ErrorMessage message={error.message} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button onClick={openNew} className="btn btn-primary btn-sm">+ Add User</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="table-th">Username</th>
              <th className="table-th">Name</th>
              <th className="table-th">Email</th>
              <th className="table-th">Role</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{u.username}</td>
                <td className="table-td">{[u.first_name, u.last_name].filter(Boolean).join(' ') || '-'}</td>
                <td className="table-td">{u.email || '-'}</td>
                <td className="table-td">
                  <span className={`badge ${
                    u.role === 'admin' ? 'badge-red' :
                    u.role === 'editor' ? 'badge-blue' : 'badge-gray'
                  }`}>
                    {u.role || 'viewer'}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="btn btn-secondary btn-sm">Edit</button>
                    <button onClick={() => setDeleteId(u.id)} className="btn btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="table-td text-center text-gray-400 py-8">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editUser ? 'Edit User' : 'Add User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {serverError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input
                className="input"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                className="input"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Username *</label>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Role *</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editUser}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary disabled:opacity-60"
            >
              {editUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete User"
        message="Are you sure you want to delete this user?"
      />
    </div>
  )
}
