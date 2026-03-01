import api from './axios.js'

export const listBOQ = async (projectPk) => {
  const { data } = await api.get('/boq/', { params: { project: projectPk } })
  return data
}

export const createBOQItem = async (payload) => {
  const { data } = await api.post('/boq/', payload)
  return data
}

export const updateBOQItem = async (pk, payload) => {
  const { data } = await api.patch(`/boq/${pk}/`, payload)
  return data
}

export const deleteBOQItem = async (pk) => {
  await api.delete(`/boq/${pk}/`)
}
