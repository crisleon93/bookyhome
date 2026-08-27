import axios from 'axios';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.218:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ===== Auth =====
export const login = (credentials) => api.post('/login', credentials);
export const register = (data) => api.post('/register', data);
export const forgotPassword = (data) => api.post('/forgot-password', data);
export const verifyEmail = ({ token }) => api.get('/verify-email', { params: { token } });

// ===== Catálogo =====
export const getBooks = (params) => api.get('/api/stored/libros', { params });
export const getBookById = (id) => api.get(`/api/stored/libros/${id}`);
export const getVariantes = (id_libro) => api.get(`/libros/${id_libro}/variantes`);
export const crearVariante = (id_libro, data) => api.post(`/libros/${id_libro}/variantes`, data);
export const getBookAvailability = (id, cantidad) => api.get(`/libros/${id}/disponibilidad`, { params: { cantidad } });
export const getBookOffer = (id) => api.get(`/ofertas/libro/${id}/activa`);
export const getCategorias = () => api.get('/catalogo/categorias');
export const searchByISBN = (isbn) => api.get(`/catalogo/buscar-por-isbn/${isbn}`);

// ===== Carrito =====
export const getCart = () => api.get('/carrito');
export const checkoutCarrito = (payload = {}) => api.post('/carrito/checkout', payload);

// ===== Pagos / Pedidos =====
export const getOrderDetails = (orderId) => api.get(`/api/v1/orders/${orderId}`);
export const cancelOrder = (orderId) => api.delete(`/api/v1/orders/${orderId}`);
export const processPayment = (payload) => api.post('/api/v1/payments', payload);
export const sendConfirmationEmail = (orderId) => api.post(`/api/v1/orders/${orderId}/send-confirmation`);

// ===== Perfil =====
export const getProfile = () => api.get('/perfil/mi-perfil');
export const updateProfile = (payload) => api.put('/perfil/actualizar', payload);
export const updatePreferences = (payload) => api.put('/perfil/preferencias', payload);
export const uploadProfilePhoto = (formData) =>
  api.post('/perfil/foto-perfil', formData);
export const uploadBannerPhoto = (formData) =>
  api.post('/perfil/banner', formData);
export const saveBannerColor = (bannerColor) => api.patch('/perfil/banner-color', { banner_color: bannerColor });
export const getEstadisticasUsuario = () => api.get('/perfil/estadisticas/usuario');
export const getPurchaseHistory = () => api.get('/perfil/historial/compras');
export const getDevoluciones = () => api.get('/devoluciones');

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
export const getCalificacionesVendedor = (id_tienda) => api.get(`/perfil/calificaciones-tienda/${id_tienda}`);

// ===== Lista de Deseos =====
// Favoritos es la lista predeterminada y compartida con la versión web.
export const getFavoritos = () => api.get('/favoritos');
export const addFavorito = (id_libro) => api.post(`/favoritos/${id_libro}`);
export const removeFavorito = (id_libro) => api.delete(`/favoritos/${id_libro}`);

// Las listas personalizadas se mantienen como una función independiente.
export const getListaDeseos = () => api.get('/lista-deseos');
export const createListaDeseos = (data) => api.post('/lista-deseos', data);
export const getLibrosListaDeseos = (id_lista) => api.get(`/lista-deseos/${id_lista}/libros`);
export const addToListaDeseos = (id_libro, id_lista) => api.post(`/lista-deseos/${id_lista}/libros`, { id_libro });
export const removeFromListaDeseos = (id_libro, id_lista) => api.delete(`/lista-deseos/${id_lista}/libros/${id_libro}`);
export const isEnListaDeseos = (id_lista, id_libro) => api.get(`/lista-deseos/${id_lista}/libros`);

// ===== Direcciones =====
export const getDirecciones = () => api.get('/perfil/direcciones');
export const createDireccion = (data) => api.post('/perfil/direcciones', data);
export const updateDireccion = (id, data) => api.put(`/perfil/direcciones/${id}`, data);
export const deleteDireccion = (id) => api.delete(`/perfil/direcciones/${id}`);
export const setPrincipalDireccion = (id) => api.put(`/perfil/direcciones/${id}`, { es_principal: true });

// ===== Cupones (comprador) =====
export const validarCupon = (data) => api.post('/cupones/validar', data);
export const aplicarCupon = (data) => api.post('/cupones/aplicar', data);

// ===== Cupones (vendedor — gestión CRUD) =====
export const getCuponesVendedor    = (id_tienda) => api.get(`/cupones/tienda/${id_tienda}`);
export const crearCupon            = (data)       => api.post('/cupones', data);
export const actualizarCupon       = (id, data)   => api.patch(`/cupones/${id}`, data);
export const eliminarCupon         = (id)         => api.delete(`/cupones/${id}`);

// ===== Librería (Vendedor) =====
export const getLibreria = () => api.get('/tiendas/mi-tienda');
export const registerLibrary = (data) => api.post('/libreria', data);
export const updateLibreria = (data) => api.put('/libreria/actualizar', data);
export const uploadLibreriaLogo = (formData) =>
  api.post('/libreria/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getConfigLibreria = () => api.get('/configuracion');
export const updateConfigLibreria = (data) => api.put('/configuracion', data);
export const uploadTiendaImage = (formData) =>
  api.post('/configuracion/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getPerfilTiendaPublico = (id_tienda) => api.get(`/configuracion/${id_tienda}`);
export const getMetricasTienda = () => api.get('/libreria/metricas');

// ===== Libros del vendedor =====
export const getMisLibros = () => api.get('/libros/mis-libros');
export const publicarLibro = (formData) =>
  api.post('/libros/publicar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateLibro = (id, data) => api.put(`/libros/${id}`, data);
export const updateStockLibro = (id, stock) => { const f = new FormData(); f.append('stock', stock); return api.patch(`/libros/${id}/stock`, f, { headers: { 'Content-Type': 'multipart/form-data' } }); };
export const deleteLibro = (id) => api.delete(`/libros/${id}`);
export const getStatsVendedor = () => api.get('/libros/stats');
export const getTopVendidos = () => api.get('/libros/top-vendidos');
export const getAlertasStock = (umbral = 3) => api.get(`/libros/alertas-stock?umbral=${umbral}`);

// ===== Herramientas y suscripciones del vendedor =====
export const getPlanesHerramientas = () => api.get('/herramientas/planes');
export const getMiSuscripcionHerramientas = () => api.get('/herramientas/mi-suscripcion');
export const suscribirPlanHerramientas = (data) => api.post('/herramientas/suscribir', data);
export const cancelarSuscripcionHerramientas = () => api.delete('/herramientas/cancelar');

// ===== Impulsos publicitarios del vendedor =====
export const getTiposImpulso = () => api.get('/impulsos/tipos');
export const getMisImpulsos = () => api.get('/impulsos/mis-impulsos');
export const contratarImpulso = (data) => api.post('/impulsos/contratar', data);
export const cancelarImpulso = (id_impulso) => api.delete(`/impulsos/${id_impulso}`);

// ===== Ofertas y Promociones del vendedor =====
export const getOfertas = () => api.get('/ofertas');
export const getOfertaById = (id) => api.get(`/ofertas/${id}`);
export const crearOferta = (formData) =>
  api.post('/ofertas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateOferta = (id, formData) =>
  api.put(`/ofertas/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteOferta = (id) => api.delete(`/ofertas/${id}`);

// ===== Pedidos del vendedor =====
export const getMisVentas = () => api.get('/libros/mis-ventas');
export const getMisPedidos = () => api.get('/libros/mis-pedidos');
export const actualizarEstadoOrden = (id_orden, estado) =>
  api.put(`/perfil/ordenes/${id_orden}/estado`, { estado });
export const registrarGuia = (id_orden, data) =>
  api.put(`/envios/orden/${id_orden}`, data);
export const getEmpresasMensajeria = () => api.get('/envios/empresas');

// ===== Chat =====
export const crearSalaChat = (id_tienda) => api.post('/chat/salas', { id_tienda });
export const getChatHistory = (id_sala, params = { limit: 50, offset: 0 }) =>
  api.get(`/chat/salas/${id_sala}/mensajes`, { params });
export const marcarSalaLeida = (id_sala) => api.put(`/chat/salas/${id_sala}/marcar-leidos`);
export const enviarMensajeChat = (payload) => api.post('/chat/mensajes', payload);
export const getSalasUsuario = () => api.get('/chat/salas');

// ===== Quejas y Reclamos =====
export const getApiBaseUrl = () => api.defaults.baseURL;
export const getOrdenes = () => api.get('/api/v1/orders');
export const getQuejas = () => api.get('/quejas');
export const crearQueja = (formData) => api.post('/quejas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===== Administración =====
// El panel conserva las mismas fuentes de datos que el dashboard web.
export const getAdminUsuarios = () => api.get('/usuarios');
export const getAdminLibros = () => api.get('/api/stored/libros');
export const getAdminOrdenes = () => api.get('/api/v1/admin/orders');
export const getAdminTiendas = () => api.get('/tiendas');
export const getAdminSolicitudes = () => api.get('/quejas/admin/todas');

// Mutaciones admin — equivalentes a las acciones del dashboard web
export const bloquearUsuario = (id, bloqueado) =>
  api.patch(`/usuarios/${id}/bloquear`, { bloqueado });
export const ocultarLibroAdmin = (id, oculto) =>
  api.patch(`/libros/${id}/ocultar`, { oculto });
export const eliminarLibroAdmin = (id) =>
  api.delete(`/libros/${id}`);
export const cambiarEstadoTienda = (id, estado) =>
  api.patch(`/tiendas/${id}/estado`, { estado });

export default api;
