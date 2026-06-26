import axios from 'axios'

// Obtener la URL base de la API
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
export const getCarrito = () => api.get('/carrito')
export const addToCart = (payload) => api.post('/carrito', payload)
export const checkoutCarrito = () => api.post('/carrito/checkout')
export const postPayment = (payload) => api.post('/api/v1/payments', payload)
export const getOrden = (orderId) => api.get(`/api/v1/orders/${orderId}`)
export const getOrdenes = () => api.get('/api/v1/orders')
export const getStoredLibros = () => api.get('/api/stored/libros')
export const getLibroById = (id) => api.get(`/api/stored/libros/${id}`)
export const getUsuarios = () => api.get('/usuarios')
export const sendConfirmationEmail = (orderId) => api.post(`/api/v1/orders/${orderId}/send-confirmation`)
export const actualizarEstadoTienda = (idTienda, estado) => api.patch(`/tiendas/${idTienda}/estado`, { estado })

export default api