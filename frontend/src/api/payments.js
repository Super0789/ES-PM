import api from './axios.js'

export const listPayments = async (params = {}) => {
  const { data } = await api.get('/payments/', { params })
  return data
}

export const getPayment = async (pk) => {
  const { data } = await api.get(`/payments/${pk}/`)
  return data
}

export const createPayment = async (payload) => {
  const { data } = await api.post('/payments/', payload)
  return data
}

export const updatePayment = async (pk, payload) => {
  const { data } = await api.patch(`/payments/${pk}/`, payload)
  return data
}

export const deletePayment = async (pk) => {
  await api.delete(`/payments/${pk}/`)
}

export const certifyPayment = async (pk, payload = {}) => {
  const { data } = await api.post(`/payments/${pk}/certify/`, payload)
  return data
}
