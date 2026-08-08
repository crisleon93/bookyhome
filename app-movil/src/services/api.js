import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.0.5:8000',
  timeout: 10000,
});

// ===== Auth =====
export const login = (credentials) => api.post('/login', credentials);
export const register = (data) => api.post('/register', data);
export const forgotPassword = (data) => api.post('/forgot-password', data);
export const resetPassword = (data) => api.post('/reset-password', data);
export const verifyEmail = ({ token }) => api.get('/verify-email', { params: { token } });

// ===== Catálogo =====
export const getBooks = (params) => api.get('/stored/api/stored/libros', { params });
export const getBookById = (id) => api.get(`/stored/api/stored/libros/${id}`);
export const getBookAvailability = (id, cantidad) => api.get(`/libros/${id}/disponibilidad`, { params: { cantidad } });
export const getBookOffer = (id) => api.get(`/ofertas/libro/${id}/activa`);
export const getCategorias = () => api.get('/catalogo/categorias');

// ===== Carrito =====
export const getCart = () => api.get('/carrito');
export const checkoutCarrito = () => api.post('/carrito/checkout');

// ===== Pagos / Pedidos =====
export const getOrderDetails = (orderId) => api.get(`/api/v1/orders/${orderId}`);
export const processPayment = (payload) => api.post('/api/v1/payments', payload);

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
export const getReviewsForBook = (id) => api.get(`/resenas/resenas/libro/${id}`);
export const createReview = (payload) => api.post('/resenas/resenas/crear', payload);
export const updateReview = (id, payload) => api.put(`/resenas/resenas/${id}`, payload);
export const deleteReview = (id) => api.delete(`/resenas/resenas/${id}`);

// ===== Lista de Deseos =====
export const getListaDeseos = () => api.get('/lista-deseos');
export const addToListaDeseos = (id_libro, id_lista) => api.post(`/lista-deseos/${id_lista}/libros`, { id_libro });
export const removeFromListaDeseos = (id_libro, id_lista) => api.delete(`/lista-deseos/${id_lista}/libros/${id_libro}`);
export const isEnListaDeseos = (id_lista, id_libro) => api.get(`/lista-deseos/${id_lista}/libros`);

// ===== Direcciones =====
export const getDirecciones = () => api.get('/direcciones');
export const createDireccion = (data) => api.post('/direcciones', data);
export const updateDireccion = (id, data) => api.put(`/direcciones/${id}`, data);
export const deleteDireccion = (id) => api.delete(`/direcciones/${id}`);
export const setPrincipalDireccion = (id) => api.patch(`/direcciones/${id}/default`);

// ===== Cupones =====
export const validarCupon = (codigo) => api.get(`/cupones/validar`, { params: { codigo } });
export const aplicarCupon = (data) => api.post('/cupones/aplicar', data);

// ===== Librería (Vendedor) =====
export const getLibreria = () => api.get('/libreria/mi-libreria');
export const registerLibrary = (data) => api.post('/libreria', data);
export const updateLibreria = (data) => api.put('/libreria/actualizar', data);
export const uploadLibreriaLogo = (formData) =>
  api.post('/libreria/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getConfigLibreria = () => api.get('/libreria/configuracion');
export const updateConfigLibreria = (data) => api.put('/libreria/configuracion', data);
export const getMetricasTienda = () => api.get('/libreria/metricas');

// ===== Libros del vendedor =====
export const getMisLibros = () => api.get('/libros/mis-libros');
export const publicarLibro = (formData) =>
  api.post('/libros/publicar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateLibro = (id, data) => api.put(`/libros/${id}`, data);
export const deleteLibro = (id) => api.delete(`/libros/${id}`);

// ===== Pedidos del vendedor =====
export const getPedidosRecientes = () => api.get('/libros/mis-ventas?limit=5');

// ===== Chat =====
export const crearSalaChat = (id_tienda) => api.post('/chat/salas', { id_tienda });
export const getChatHistory = (id_sala, params = { limit: 50, offset: 0 }) =>
  api.get(`/chat/salas/${id_sala}/mensajes`, { params });
export const marcarSalaLeida = (id_sala) => api.put(`/chat/salas/${id_sala}/marcar-leidos`);
export const enviarMensajeChat = (payload) => api.post('/chat/mensajes', payload);
export const getSalasUsuario = () => api.get('/chat/salas');

export default api;
