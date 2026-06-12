import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.9:8000',
  timeout: 10000,
});

export const login = (credentials) => api.post('/login', credentials);
export const register = (data) => api.post('/register', data);
export const forgotPassword = (data) => api.post('/forgot-password', data);
export const getCart = (userId) => api.get(`/carrito/${userId}`);
export const checkoutCarrito = () => api.post('/carrito/checkout');
export const getOrderDetails = (orderId) => api.get(`/api/v1/orders/${orderId}`);
export const processPayment = (payload) => api.post('/api/v1/payments', payload);
export const getBooks = () => api.get('/api/stored/libros');
export const getBookAvailability = (id, cantidad) => api.get(`/libros/${id}/disponibilidad`, { params: { cantidad } });
export const getBookOffer = (id) => api.get(`/ofertas/libro/${id}/activa`);
export const registerLibrary = (data) => api.post('/libreria', data);

export default api;
