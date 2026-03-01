import api from './axios.js'

export const listProjects = async (params = {}) => {
  const { data } = await api.get('/projects/', { params })
  return data
}

export const getProject = async (pk) => {
  const { data } = await api.get(`/projects/${pk}/`)
  return data
}

export const createProject = async (payload) => {
  const { data } = await api.post('/projects/', payload)
  return data
}

export const updateProject = async (pk, payload) => {
  const { data } = await api.patch(`/projects/${pk}/`, payload)
  return data
}

export const deleteProject = async (pk) => {
  await api.delete(`/projects/${pk}/`)
}

export const getDashboardStats = async () => {
  const { data } = await api.get('/projects/stats/')
  return data
}

export const exportProjects = async (params = {}) => {
  const response = await api.get('/projects/export/', {
    params,
    responseType: 'blob',
  })
  return response
}

export const getOverdueProjects = async (params = {}) => {
  const { data } = await api.get('/projects/overdue/', { params })
  return data
}

export const getHandingOverProjects = async (params = {}) => {
  const { data } = await api.get('/projects/handing-over/', { params })
  return data
}

export const updateHandingOver = async (pk, payload) => {
  const { data } = await api.patch(`/projects/${pk}/update_handing_over/`, payload)
  return data
}
