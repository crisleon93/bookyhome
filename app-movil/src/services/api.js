import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.2.7:8000', 
  timeout: 10000,
});

export const login = (credentials) => api.post('/login', credentials);
export const register = (data) => api.post('/register', data);
export const forgotPassword = (data) => api.post('/forgot-password', data);
export const getCart = () => api.get('/carrito');
export const checkoutCarrito = () => api.post('/carrito/checkout');
export const getOrderDetails = (orderId) => api.get(`/api/v1/orders/${orderId}`);
export const processPayment = (payload) => api.post('/api/v1/payments', payload);
export const getBooks = () => api.get('/api/stored/libros');
export const getBookAvailability = (id, cantidad) => api.get(`/libros/${id}/disponibilidad`, { params: { cantidad } });
export const getBookOffer = (id) => api.get(`/ofertas/libro/${id}/activa`);
export const registerLibrary = (data) => api.post('/libreria', data);

// ===== Perfil =====
export const getProfile = () => api.get('/perfil/mi-perfil');
export const updateProfile = (payload) => api.put('/perfil/actualizar', payload);
export const updatePreferences = (payload) => api.put('/perfil/preferencias', payload);
export const getPurchaseHistory = () => api.get('/perfil/historial/compras');

// ===== Notificaciones =====
export const getNotifications = (soloNoLeidas = false, limit = 50, offset = 0) =>
  api.get('/notificaciones', { params: { solo_no_leidas: soloNoLeidas, limit, offset } });
export const markNotificationRead = (id) => api.put(`/notificaciones/${id}/leer`);
export const markAllNotificationsRead = () => api.put('/notificaciones/marcar-todas-leidas');
export const deleteNotification = (id) => api.delete(`/notificaciones/${id}`);

// ===== Reseñas =====
export const getReviewsForBook = (id) => api.get(`/resenas/libro/${id}`);
export const createReview = (payload) => api.post('/resenas/crear', payload);
export const updateReview = (id, payload) => api.put(`/resenas/${id}`, payload);
export const deleteReview = (id) => api.delete(`/resenas/${id}`);
export default api;
