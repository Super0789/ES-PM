import api from './axios.js'

export const listAttachments = async (projectPk) => {
  const { data } = await api.get('/attachments/', { params: { project: projectPk } })
  return data
}

export const uploadAttachment = async (projectPk, fieldName, file) => {
  const formData = new FormData()
  formData.append('project', projectPk)
  formData.append('field_name', fieldName)
  formData.append('file', file)
  const { data } = await api.post('/attachments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const deleteAttachment = async (pk) => {
  await api.delete(`/attachments/${pk}/`)
}

export const downloadAttachment = async (pk) => {
  const response = await api.get(`/attachments/${pk}/download/`, {
    responseType: 'blob',
  })
  return response
}
