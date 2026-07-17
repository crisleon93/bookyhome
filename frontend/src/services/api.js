import axios from 'axios'

// Obtener la URL base de la API
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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
export const removeFromCart = (id_libro) => api.delete(`/carrito/${id_libro}`)
export const checkoutCarrito = () => api.post('/carrito/checkout')
export const postPayment = (payload) => api.post('/api/v1/payments', payload)
export const getOrden = (orderId) => api.get(`/api/v1/orders/${orderId}`)
export const getOrdenes = () => api.get('/api/v1/orders')
export const cancelOrder = (orderId) => api.delete(`/api/v1/orders/${orderId}`)
export const getStoredLibros = () => api.get('/api/stored/libros')
export const getLibroById = (id) => api.get(`/api/stored/libros/${id}`)
export const getUsuarios = () => api.get('/usuarios')
export const uploadProfilePhoto = (formData) => api.post('/perfil/foto-perfil', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})
export const sendConfirmationEmail = (orderId) => api.post(`/api/v1/orders/${orderId}/send-confirmation`)
export const actualizarEstadoTienda = (idTienda, estado) => api.patch(`/tiendas/${idTienda}/estado`, { estado })
export const checkEmailVerification = (email) => api.get('/check-email-verification', { params: { email } })

export const getListasDeseos = () => api.get('/lista-deseos')
export const crearListaDeseos = (payload) => api.post('/lista-deseos', payload)
export const eliminarListaDeseos = (idLista) => api.delete(`/lista-deseos/${idLista}`)
export const getLibrosListaDeseos = (idLista) => api.get(`/lista-deseos/${idLista}/libros`)
export const agregarLibroListaDeseos = (idLista, payload) => api.post(`/lista-deseos/${idLista}/libros`, payload)
export const eliminarLibroListaDeseos = (idLista, idLibro) => api.delete(`/lista-deseos/${idLista}/libros/${idLibro}`)

export const getDevoluciones = () => api.get('/devoluciones')
export const getPedidosElegiblesDevolucion = () => api.get('/devoluciones/elegibles')
export const solicitarDevolucion = (payload) => api.post('/devoluciones', payload)

// Cupones
export const getCuponesDisponibles = () => api.get('/cupones/disponibles')
export const validarCupon = (payload) => api.post('/cupones/validar', payload)
export const aplicarCupon = (payload) => api.post('/cupones/aplicar', payload)
export const getCuponesTienda = (idTienda) => api.get(`/cupones/tienda/${idTienda}`)
export const crearCupon = (payload) => api.post('/cupones', payload)
export const editarCupon = (idCupon, payload) => api.patch(`/cupones/${idCupon}`, payload)
export const eliminarCupon = (idCupon) => api.delete(`/cupones/${idCupon}`)

// Direcciones de envío
export const getDirecciones = () => api.get('/direcciones')
export const crearDireccion = (payload) => api.post('/direcciones', payload)
export const actualizarDireccion = (id, payload) => api.put(`/direcciones/${id}`, payload)
export const eliminarDireccion = (id) => api.delete(`/direcciones/${id}`)
export const marcarDireccionPredeterminada = (id) => api.patch(`/direcciones/${id}/default`)

// Envíos y tracking manual
export const getEmpresasMensajeria = () => api.get('/envios/empresas')
export const registrarEnvio = (idOrden, payload) => api.put(`/envios/orden/${idOrden}`, payload)

// Suscripciones de tienda
export const getMiSuscripcion = () => api.get('/suscripciones/mi-suscripcion')
export const getSuscripcionVigente = () => api.get('/suscripciones/vigente')
export const getHistorialSuscripciones = () => api.get('/suscripciones/historial')
export const crearSuscripcion = (payload) => api.post('/suscripciones', payload)
export const cancelarSuscripcion = (id) => api.delete(`/suscripciones/${id}`)

export default api
