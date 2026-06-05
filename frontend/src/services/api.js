import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (payload) => api.post('/login', payload)
export const register = (payload) => api.post('/register', payload)
export const forgotPassword = (payload) => api.post('/forgot-password', payload)
export const resetPassword = (payload) => api.post('/reset-password', payload)
export const registerLibrary = (payload) => api.post('/libreria', payload)
export const getCarrito = (userId) => api.get(`/carrito/${userId}`)
export const getStoredLibros = () => api.get('/api/stored/libros')

export default api
