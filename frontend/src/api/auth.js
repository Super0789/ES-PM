import api from './axios.js'

export const login = async (credentials) => {
  const { data } = await api.post('/auth/login/', credentials)
  return data
}

export const refreshToken = async (refresh) => {
  const { data } = await api.post('/auth/token/refresh/', { refresh })
  return data
}

export const getMe = async () => {
  const { data } = await api.get('/auth/me/')
  return data
}

export const listUsers = async () => {
  const { data } = await api.get('/auth/users/')
  return data
}

export const createUser = async (payload) => {
  const { data } = await api.post('/auth/users/', payload)
  return data
}

export const updateUser = async (id, payload) => {
  const { data } = await api.patch(`/auth/users/${id}/`, payload)
  return data
}

export const deleteUser = async (id) => {
  await api.delete(`/auth/users/${id}/`)
}
