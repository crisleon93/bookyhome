import api from './api'

export const chatAsistente = (payload) => api.post('/asistente/chat', payload)
