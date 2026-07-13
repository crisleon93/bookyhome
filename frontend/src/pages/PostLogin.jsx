import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getUsuarios, getCarrito, checkoutCarrito, getOrdenes, getOrden, postPayment, sendConfirmationEmail, cancelOrder, uploadProfilePhoto, getListasDeseos, crearListaDeseos, eliminarListaDeseos, getLibrosListaDeseos, eliminarLibroListaDeseos, aplicarCupon } from "../services/api";
import api from "../services/api";
import { notificacionesService } from "../services/notificaciones";
import CompradorSidebar from "../components/CompradorSidebar";
import FiltrosCatalogo from "../components/FiltrosCatalogo";
import LibroCard from "../components/LibroCard";
import { notify } from "../components/ToastProvider";
import {
  IconChartBar,
  IconBookOpen,
  IconBook,
  IconStar,
  IconSettings,
  IconFavorites,
  IconLocation,
  IconCart,
  IconPackage,
  IconShoppingBag,
  IconUser,
  IconCheck,
  IconLock,
  IconMessage,
  IconCreditCard,
  IconTruck,
  IconGift,
  IconInfo
} from "../components/Icons";

import Catalogo from './Catalogo';
import Chat from './Chat';
import ListaDeseos from './ListaDeseos';
import CouponsList from '../components/CouponsList';
import LeafletAddressPickerModal from '../components/LeafletAddressPickerModal';

// Componente especializado con el SVG profesional para carrito vacío
const CartEmptyState = ({ onGoToCatalog }) => (
  <div className="cart-empty-state" style={{ textAlign: "center", padding: "50px 0" }}>
    <div className="cart-empty-icon" style={{ marginBottom: "20px", color: "var(--vinotinto)" }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ margin: "0 auto" }}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    </div>
    <h2 style={{ fontWeight: 700, color: "var(--gris-carbon)" }}>Tu carrito está vacío</h2>
    <p style={{ color: "#666", marginBottom: "20px" }}>Explora el catálogo y encuentra tu próxima lectura favorita.</p>
    <button className="btn btn-vinotinto" onClick={onGoToCatalog} style={{ width: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      Ir al catálogo
    </button>
  </div>
);

function ModalCancelarOrden({ orden, onClose, onCancelado }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const totalFormatted = Number(orden.total).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  });

  const confirmar = async () => {
    setCargando(true);
    setError("");
    try {
      await cancelOrder(orden.id_orden);
      onCancelado(orden.id_orden);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo cancelar la orden");
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box modal-box--confirm" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          disabled={cargando}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="modal-cancel-compra__header">
          <div className="modal-cancel-compra__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="modal-cancel-compra__title">Cancelar compra</h2>
          <p className="modal-cancel-compra__subtitle">
            ¿Estás seguro de que deseas cancelar esta orden?
          </p>
        </div>

        <div className="modal-cancel-compra__body">
          <div className="modal-cancel-compra__summary">
            <div>
              <p className="modal-cancel-compra__summary-label">Orden</p>
              <p className="modal-cancel-compra__summary-order">#{orden.id_orden}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="modal-cancel-compra__summary-label">Total</p>
              <p className="modal-cancel-compra__summary-total">{totalFormatted}</p>
            </div>
          </div>
          <p className="modal-cancel-compra__warning">Esta acción no se puede deshacer.</p>
        </div>

        {error && (
          <div className="modal-cancel-compra__error">
            <IconLock width={16} height={16} strokeWidth={2} />
            {error}
          </div>
        )}

        <div className="modal-cancel-compra__actions">
          <button
            type="button"
            className="modal-cancel-compra__btn-back"
            onClick={onClose}
            disabled={cargando}
          >
            No, volver
          </button>
          <button
            type="button"
            className="modal-cancel-compra__btn-confirm"
            onClick={confirmar}
            disabled={cargando}
          >
            {cargando ? "Cancelando…" : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostLogin() {
  // ========================
  // Estado local
  // ========================
  const [userName, setUserName]     = useState("");
  const [userEmail, setUserEmail]   = useState("");
  const [userId, setUserId]         = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [activeSide, setActiveSide] = useState("Inicio");

  const [carrito, setCarrito]                 = useState([]);
  const [cartLoading, setCartLoading]         = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError]     = useState(null);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [orderId, setOrderId]                 = useState(null);
  const [paymentMethod, setPaymentMethod]     = useState("tarjeta");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess]   = useState(false);
  const [order, setOrder]                     = useState(null);

  const [ordenes, setOrdenes]               = useState([]);
  const [ordenesLoading, setOrdenesLoading] = useState(false);
  const [ordenACancelar, setOrdenACancelar] = useState(null);
  const [mostrarBaucher, setMostrarBaucher] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [baucherLoading, setBaucherLoading] = useState(false);

  const [estadisticas, setEstadisticas] = useState(null);
  const [categoriasFavoritas, setCategoriasFavoritas] = useState([]);
  const [nivelFidelizacion, setNivelFidelizacion] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [mostrarModalDireccion, setMostrarModalDireccion] = useState(false);
  const [direccionEditingId, setDireccionEditingId] = useState(null);
  const [direccionLoading, setDireccionLoading] = useState(false);
  const [direccionError, setDireccionError] = useState('');
  const [direccionForm, setDireccionForm] = useState({
    alias_direccion: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    es_principal: false
  });

  const [listasDeseos, setListasDeseos] = useState([]);
  const [listaDeseosLoading, setListaDeseosLoading] = useState(false);
  const [listaSeleccionadaId, setListaSeleccionadaId] = useState(null);
  const [librosListaDeseos, setLibrosListaDeseos] = useState([]);
  const [librosListaLoading, setLibrosListaLoading] = useState(false);
  const [nuevaListaNombre, setNuevaListaNombre] = useState('');
  const [mostrarFormNuevaLista, setMostrarFormNuevaLista] = useState(false);
  const [listaDeseosError, setListaDeseosError] = useState('');
  const [catalogoLibroInicial, setCatalogoLibroInicial] = useState(null);
  const [librosRecomendados, setLibrosRecomendados] = useState([]);

  // Estados de notificaciones
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const [notificacionesFilter, setNotificacionesFilter] = useState("todas");
  const [notificacionesLeidasAutomaticas, setNotificacionesLeidasAutomaticas] = useState(new Set());
  const [notificacionesEliminadasAutomaticas, setNotificacionesEliminadasAutomaticas] = useState(new Set());
  const [notificacionAEliminar, setNotificacionAEliminar] = useState(null);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);

  // Estado para el chat embebido
  const [selectedSalaInChat, setSelectedSalaInChat] = useState(null);

  // Payment form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");
  const [paypalError, setPaypalError] = useState("");
  const [paypalProcessing, setPaypalProcessing] = useState(false);

  // Cupón
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  const baseTotal = order ? Number(order.total || 0) : 0;
  const totalToPay = Math.max(0, baseTotal - discountAmount);

  // Estados para nuevos métodos de pago
  const [sucursalCodigo, setSucursalCodigo] = useState("");
  const [sucursalPuntos, setSucursalPuntos] = useState([]);
  const [sucursalPagoConfirmado, setSucursalPagoConfirmado] = useState(false);
  const [sucursalEsperandoConfirmacion, setSucursalEsperandoConfirmacion] = useState(false);
  const nequiSelected = false;
  const [pseBanco, setPseBanco] = useState("");
  const [pseRedirecting, setPseRedirecting] = useState(false);

  // Estado del catálogo
  const [catalogoPagina] = useState(1);
  const [catalogoFiltros] = useState({
    q: '',
    categoria_id: null,
    precio_min: 0,
    precio_max: 1000000,
    calificacion_min: 0,
    disponible: true,
    ordenar_por: 'relevancia'
  });

  // ========================
  // Hooks de navegación y ubicación
  // ========================
  const navigate = useNavigate();
  const location = useLocation();

  // ========================
  // Efectos de inicialización
  // ========================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const seccion = params.get("seccion");
    if (seccion) setActiveSide(seccion === "Direcciones" ? "Mi Perfil" : seccion);
  }, [location]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    try {
      const payload = jwtDecode(token);
      setUserName(payload.nombre || "Usuario");
      const id = parseInt(payload.sub);
      setUserId(id);

      getUsuarios()
        .then((res) => {
          const usuario = res.data.find((u) => u.id_usuario === id);
          if (usuario) setUserEmail(usuario.correo_usuario);
        })
        .catch((err) => console.error(err));
    } catch (error) {
      console.error("Error al decodificar token:", error);
      setUserName("Usuario");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (activeSide === "Carrito" && userId) {
      setCartLoading(true);
      setCheckoutError(null);
      Promise.all([getCarrito(), getOrdenes()])
        .then(([carritoRes, ordenesRes]) => {
          setCarrito(carritoRes.data);
          setOrdenes(ordenesRes.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setCartLoading(false));
    }
  }, [activeSide, userId]);

  useEffect(() => {
    if (activeSide === "Mis Compras" || activeSide === "Configuración") {
      setOrdenesLoading(true);
      getOrdenes()
        .then((res) => setOrdenes(res.data))
        .catch((err) => console.error(err))
        .finally(() => setOrdenesLoading(false));
    }
  }, [activeSide]);

  const cargarDirecciones = useCallback(async () => {
    try {
      const res = await api.get('/perfil/direcciones');
      setDirecciones(res.data || []);
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      setDirecciones([]);
    }
  }, []);

  const cargarListasDeseos = useCallback(async () => {
    setListaDeseosLoading(true);
    setListaDeseosError('');
    try {
      const res = await getListasDeseos();
      const listas = res.data || [];
      setListasDeseos(listas);
      if (listas.length > 0 && !listaSeleccionadaId) {
        setListaSeleccionadaId(listas[0].id_lista);
      }
      if (listas.length === 0) {
        setListaSeleccionadaId(null);
        setLibrosListaDeseos([]);
      }
    } catch (error) {
      console.error('Error cargando listas de deseos:', error);
      setListaDeseosError(error.response?.data?.detail || 'No se pudieron cargar las listas');
      setListasDeseos([]);
    } finally {
      setListaDeseosLoading(false);
    }
  }, [listaSeleccionadaId]);

  const cargarLibrosLista = useCallback(async (idLista) => {
    if (!idLista) {
      setLibrosListaDeseos([]);
      return;
    }
    setLibrosListaLoading(true);
    try {
      const res = await getLibrosListaDeseos(idLista);
      setLibrosListaDeseos(res.data || []);
    } catch (error) {
      console.error('Error cargando libros de la lista:', error);
      setLibrosListaDeseos([]);
    } finally {
      setLibrosListaLoading(false);
    }
  }, []);

  const cargarRecomendacionesDeseos = useCallback(async () => {
    try {
      const res = await getListasDeseos();
      const listas = res.data || [];
      if (listas.length === 0) {
        setLibrosRecomendados([]);
        return;
      }
      const librosAcumulados = [];
      for (const lista of listas.slice(0, 3)) {
        const librosRes = await getLibrosListaDeseos(lista.id_lista);
        librosAcumulados.push(...(librosRes.data || []));
      }
      const unicos = [];
      const vistos = new Set();
      for (const libro of librosAcumulados) {
        if (!vistos.has(libro.id_libro)) {
          vistos.add(libro.id_libro);
          unicos.push(libro);
        }
      }
      setLibrosRecomendados(unicos.slice(0, 5));
    } catch {
      setLibrosRecomendados([]);
    }
  }, []);

  const cargarDatosPerfil = useCallback(async () => {
    try {
      // Cargar estadísticas
      try {
        const resEstadisticas = await getUsuarios();
        const usuario = resEstadisticas.data.find((u) => u.id_usuario === userId);
        if (usuario) {
          setEstadisticas({ total_gastado: 0, num_compras: 0, libro_mas_comprado: null });
        }
      } catch {
        setEstadisticas({ total_gastado: 0, num_compras: 0, libro_mas_comprado: null });
      }

      // Cargar categorías favoritas (simulado)
      setCategoriasFavoritas([]);

      // Cargar nivel de fidelización (simulado)
      setNivelFidelizacion({ nivel: 'Bronce', puntos: 0, siguiente_nivel: 'Plata', puntos_para_siguiente: 5 });

      await cargarDirecciones();
    } catch (error) {
      console.error('Error cargando datos del perfil:', error);
    }
  }, [userId, cargarDirecciones]);

  const resolveImageUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    if (!path) return null;
    return `${baseUrl}/${path.replace(/^\//, '')}`;
  };

  const cargarPerfil = useCallback(async () => {
    try {
      const res = await api.get('/perfil/mi-perfil');
      if (res.data?.foto_perfil) {
        setProfilePhotoUrl(resolveImageUrl(res.data.foto_perfil));
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  }, []);

  useEffect(() => {
    if (activeSide === "Mi Perfil" || activeSide === "Mis Direcciones") {
      cargarDatosPerfil();
      cargarPerfil();
    }
  }, [activeSide, cargarDatosPerfil, cargarPerfil]);

  useEffect(() => {
    if (activeSide === "Lista de Deseos") {
      cargarListasDeseos();
    }
  }, [activeSide, cargarListasDeseos]);

  useEffect(() => {
    if (activeSide === "Lista de Deseos" && listaSeleccionadaId) {
      cargarLibrosLista(listaSeleccionadaId);
    }
  }, [activeSide, listaSeleccionadaId, cargarLibrosLista]);

  useEffect(() => {
    if (activeSide === "Inicio") {
      cargarRecomendacionesDeseos();
    }
  }, [activeSide, cargarRecomendacionesDeseos]);

  useEffect(() => {
    const handler = () => {
      if (activeSide === "Lista de Deseos") {
        cargarListasDeseos();
        if (listaSeleccionadaId) cargarLibrosLista(listaSeleccionadaId);
      }
      if (activeSide === "Inicio") cargarRecomendacionesDeseos();
    };
    window.addEventListener('wishlist-updated', handler);
    return () => window.removeEventListener('wishlist-updated', handler);
  }, [activeSide, listaSeleccionadaId, cargarListasDeseos, cargarLibrosLista, cargarRecomendacionesDeseos]);

  const resetDireccionForm = () => {
    setMostrarFormDireccion(false);
    setDireccionEditingId(null);
    setDireccionError('');
    setDireccionForm({ alias_direccion: '', direccion: '', ciudad: '', departamento: '', codigo_postal: '', es_principal: false });
  };

  const openNewDireccionForm = () => {
    resetDireccionForm();
    setMostrarModalDireccion(true);
  };

  const handleAddressSelected = (data) => {
    setDireccionForm((prev) => ({
      ...prev,
      direccion: data.direccion || prev.direccion,
      ciudad: data.ciudad || prev.ciudad,
      departamento: data.departamento || prev.departamento,
      codigo_postal: data.codigo_postal || prev.codigo_postal,
    }));
    setMostrarFormDireccion(true);
  };

  const openEditDireccionForm = (direccion) => {
    setDireccionEditingId(direccion.id_direccion);
    setDireccionForm({
      alias_direccion: direccion.alias_direccion || '',
      direccion: direccion.direccion || '',
      ciudad: direccion.ciudad || '',
      departamento: direccion.departamento || '',
      codigo_postal: direccion.codigo_postal || '',
      es_principal: Boolean(direccion.es_principal)
    });
    setDireccionError('');
    setMostrarFormDireccion(true);
  };

  const handleSaveDireccion = async () => {
    if (!direccionForm.direccion?.trim()) {
      setDireccionError('La dirección es obligatoria');
      return;
    }

    setDireccionLoading(true);
    setDireccionError('');
    try {
      const payload = {
        alias_direccion: direccionForm.alias_direccion?.trim() || 'Dirección',
        direccion: direccionForm.direccion.trim(),
        ciudad: direccionForm.ciudad?.trim() || '',
        codigo_postal: direccionForm.codigo_postal?.trim() || '',
        departamento: direccionForm.departamento?.trim() || '',
        es_principal: direccionForm.es_principal
      };

      if (direccionEditingId) {
        await api.put(`/perfil/direcciones/${direccionEditingId}`, payload);
        notify('Dirección actualizada', 'success');
      } else {
        await api.post('/perfil/direcciones', payload);
        notify('Dirección guardada', 'success');
      }

      await cargarDirecciones();
      resetDireccionForm();
    } catch (error) {
      setDireccionError(error.response?.data?.detail || 'No se pudo guardar la dirección');
    } finally {
      setDireccionLoading(false);
    }
  };

  const handleSetPrincipalDireccion = async (id) => {
    try {
      await api.put(`/perfil/direcciones/${id}`, { es_principal: true });
      await cargarDirecciones();
      notify('Dirección marcada como principal', 'success');
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudo actualizar la dirección', 'error');
    }
  };

  const handleDeleteDireccion = async (id) => {
    try {
      await api.delete(`/perfil/direcciones/${id}`);
      await cargarDirecciones();
      notify('Dirección eliminada', 'success');
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudo eliminar la dirección', 'error');
    }
  };

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setPhotoUploading(true);
    try {
      const res = await uploadProfilePhoto(formData);
      if (res.data?.url) {
        setProfilePhotoUrl(resolveImageUrl(res.data.url));
        notify('Foto de perfil actualizada', 'success');
      }
    } catch (error) {
      console.error('Error subiendo foto de perfil:', error);
      notify('No se pudo subir la foto', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const cargarCatalogo = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      if (catalogoFiltros.q) params.append('q', catalogoFiltros.q);
      if (catalogoFiltros.categoria_id) params.append('categoria_id', catalogoFiltros.categoria_id);
      if (catalogoFiltros.precio_min) params.append('precio_min', catalogoFiltros.precio_min);
      if (catalogoFiltros.precio_max) params.append('precio_max', catalogoFiltros.precio_max);
      if (catalogoFiltros.calificacion_min) params.append('calificacion_min', catalogoFiltros.calificacion_min);
      if (catalogoFiltros.disponible) params.append('disponible', 'true');
      params.append('ordenar_por', catalogoFiltros.ordenar_por);
      params.append('pagina', catalogoPagina);
      params.append('limite', 20);

      await api.get(`/catalogo/busqueda-avanzada?${params}`);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    }
  }, [catalogoFiltros, catalogoPagina]);

  // Cargar catálogo cuando se selecciona esa sección
  useEffect(() => {
    if (activeSide === "Catálogo") {
      cargarCatalogo();
    }
  }, [activeSide, cargarCatalogo]);

  const handleCheckout = () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    // Limpiar estados de métodos de pago anteriores
    setSucursalCodigo("");
    setSucursalPuntos([]);
    setSucursalPagoConfirmado(false);
    setSucursalEsperandoConfirmacion(false);
    setPseBanco("");
    setPseRedirecting(false);
    setPaymentMethod("tarjeta");
    checkoutCarrito()
      .then((res) => {
        if (res.data?.ok) {
          setOrderId(res.data.order.id_orden);
          setOrder(res.data.order);
          setMostrarCheckout(true);
          // Load order details
          getOrden(res.data.order.id_orden)
            .then((orderRes) => {
              setOrder(orderRes.data);
            })
            .catch((err) => console.error(err));
        } else {
          setCheckoutError("No se pudo procesar el pago. Intenta de nuevo.");
        }
      })
      .catch((err) => {
        console.error(err);
        setCheckoutError(err.response?.data?.detail || "Error al realizar el checkout. Intenta de nuevo.");
      })
      .finally(() => setCheckoutLoading(false));
  };

  const handleVolverCarrito = () => {
    setMostrarCheckout(false);
    setOrderId(null);
    setOrder(null);
    setPaymentSuccess(false);
    // Reset form
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setFormErrors({});
    // Limpiar estados de métodos de pago
    setSucursalCodigo("");
    setSucursalPuntos([]);
    setSucursalPagoConfirmado(false);
    setSucursalEsperandoConfirmacion(false);
    setPseBanco("");
    setPseRedirecting(false);
    // Recargar carrito y órdenes para detectar pendientes
    Promise.all([getCarrito(), getOrdenes()])
      .then(([carritoRes, ordenesRes]) => {
        setCarrito(carritoRes.data);
        setOrdenes(ordenesRes.data);
      })
      .catch((err) => console.error(err));
  };

  const handleVerBaucher = async (orden) => {
    setBaucherLoading(true);
    setOrdenSeleccionada(orden);
    setMostrarBaucher(true);
    try {
      const res = await getOrden(orden.id_orden);
      setOrdenSeleccionada(res.data);
    } catch (err) {
      console.error('Error al cargar detalles de orden:', err);
      notify('No se pudo cargar los detalles de la orden', 'error');
    } finally {
      setBaucherLoading(false);
    }
  };

  const handleCerrarBaucher = () => {
    setMostrarBaucher(false);
    setOrdenSeleccionada(null);
  };

  // Función para generar código de pago para Efecty
  const generarCodigoPago = () => {
    const codigo = Math.random().toString(36).substring(2, 12).toUpperCase();
    setSucursalCodigo(codigo);
  };

  // Función para obtener puntos Efecty cercanos (simulado)
  const obtenerPuntosEfecty = () => {
    const puntosSimulados = [
      { id: 1, nombre: "Efecty Centro", direccion: "Calle 10 #5-20", ciudad: "Bogotá" },
      { id: 2, nombre: "Efecty Norte", direccion: "Carrera 15 #20-30", ciudad: "Bogotá" },
      { id: 3, nombre: "Efecty Sur", direccion: "Avenida 1 #30-40", ciudad: "Bogotá" },
      { id: 4, nombre: "Efecty Plaza", direccion: "Calle 50 #15-25", ciudad: "Medellín" },
      { id: 5, nombre: "Efecty Centro", direccion: "Carrera 10 #20-30", ciudad: "Medellín" },
    ];
    setSucursalPuntos(puntosSimulados);
  };

  // Redirigir a Nequi
  const handleNequiRedirect = () => {
    const nequiUrl = `nequi://pagar?valor=${order.total}&referencia=${order.id_orden}`;
    window.location.href = nequiUrl;
    // Fallback si no está instalado
    setTimeout(() => {
      if (!nequiSelected) {
        window.open('https://www.nequi.com.co', '_blank');
      }
    }, 2000);
  };

  // Redirigir a Daviplata
  const handleDaviplataRedirect = () => {
    const daviplataUrl = `daviplata://pagar?valor=${order.total}&referencia=${order.id_orden}`;
    window.location.href = daviplataUrl;
    // Fallback si no está instalado
    setTimeout(() => {
      if (!nequiSelected) {
        window.open('https://www.daviplata.com', '_blank');
      }
    }, 2000);
  };

  // Iniciar proceso de pago en sucursal
  const handleSucursalPago = () => {
    generarCodigoPago();
    obtenerPuntosEfecty();
    setSucursalEsperandoConfirmacion(true);
    // Simular confirmación automática del pago
    verificarPagoEfecty();
  };

  // Simular confirmación de pago desde Efecty (en producción esto sería un webhook)
  const verificarPagoEfecty = () => {
    // Simulación: después de 0.5 segundos, Efecty confirma el pago
    setTimeout(() => {
      setSucursalPagoConfirmado(true);
      setSucursalEsperandoConfirmacion(false);
      processPaymentApi("Pago en Efecty");
    }, 500);
  };

  // Lista de bancos para PSE
  const bancosPSE = [
    { codigo: "001", nombre: "Bancolombia" },
    { codigo: "002", nombre: "Banco de Bogotá" },
    { codigo: "003", nombre: "Banco Popular" },
    { codigo: "004", nombre: "BBVA Colombia" },
    { codigo: "005", nombre: "Davivienda" },
    { codigo: "006", nombre: "Banco de Occidente" },
    { codigo: "007", nombre: "Scotiabank Colpatria" },
    { codigo: "008", nombre: "Banco AV Villas" },
    { codigo: "009", nombre: "Banco Caja Social" },
    { codigo: "010", nombre: "Banco Falabella" },
  ];

  // Redirigir a PSE
  const handlePseRedirect = () => {
    if (!pseBanco) {
      notify("Por favor selecciona un banco", "error");
      return;
    }
    setPseRedirecting(true);
    // Simular redirección a PSE
    const pseUrl = `https://www.pse.com.co/portal/pagos?banco=${pseBanco}&valor=${order.total}&referencia=${order.id_orden}`;
    window.open(pseUrl, '_blank');
    // Simular confirmación después de redirección
    setTimeout(() => {
      setPseRedirecting(false);
      processPaymentApi("PSE");
    }, 5000);
  };

  // Payment form handlers
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    let formatted = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted);
    setFormErrors((prev) => ({ ...prev, cardNumber: "" }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
    setFormErrors((prev) => ({ ...prev, cardExpiry: "" }));
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
    setFormErrors((prev) => ({ ...prev, cardCvv: "" }));
  };

  const validateCardForm = () => {
    const errors = {};
    const rawCardNumber = cardNumber.replace(/\s/g, "");
    if (rawCardNumber.length !== 16) {
      errors.cardNumber = "Número de tarjeta inválido (deben ser 16 dígitos)";
    }
    if (!cardName.trim()) {
      errors.cardName = "Nombre completo es requerido";
    }
    if (cardExpiry.length !== 5) {
      errors.cardExpiry = "Fecha inválida (MM/AA)";
    } else {
      const [month] = cardExpiry.split("/");
      const m = parseInt(month, 10);
      if (m < 1 || m > 12) {
        errors.cardExpiry = "Mes inválido";
      }
    }
    if (cardCvv.length !== 3) {
      errors.cardCvv = "CVV inválido (3 dígitos)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleValidateCoupon = async (e) => {
    e?.preventDefault();
    const code = couponCode.trim();

    if (!code) {
      setCouponError("Ingresa un código de cupón.");
      setCouponSuccess("");
      setDiscountAmount(0);
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const res = await api.post("/cupones/validar", {
        codigo: code,
        order_id: Number(orderId),
        total: baseTotal
      });

      const payload = res.data?.data || res.data || {};
      const serverMessage = payload?.mensaje || payload?.message || "";
      const discountValue = Number(payload?.descuento ?? payload?.discount_amount ?? payload?.valor_descuento ?? payload?.value ?? 0);

      if (payload?.valido === false || payload?.valid === false || payload?.ok === false) {
        const message = String(serverMessage || payload?.detail || "El cupón ingresado no es válido.");
        const normalized = message.toLowerCase();
        let friendly = "El cupón ingresado no es válido.";
        if (/expir|caduc|vigenc/i.test(normalized)) friendly = "El cupón ha expirado.";
        else if (/usad|reutil|ya/i.test(normalized)) friendly = "Este cupón ya fue usado.";
        else if (/inválid|incorrect|no existe|no encontrado/i.test(normalized)) friendly = "El cupón ingresado no es válido.";
        setDiscountAmount(0);
        setCouponError(friendly);
        return;
      }

      setDiscountAmount(Math.max(0, discountValue));
      setCouponSuccess(serverMessage || "Cupón aplicado correctamente.");
    } catch (err) {
      const message = err?.response?.data?.detail || err?.response?.data?.message || err?.response?.data?.error || err?.message || "El cupón ingresado no es válido.";
      const normalized = String(message).toLowerCase();
      let friendly = "El cupón ingresado no es válido.";
      if (/expir|caduc|vigenc/i.test(normalized)) friendly = "El cupón ha expirado.";
      else if (/usad|reutil|ya/i.test(normalized)) friendly = "Este cupón ya fue usado.";
      else if (/inválid|incorrect|no existe|no encontrado/i.test(normalized)) friendly = "El cupón ingresado no es válido.";
      setDiscountAmount(0);
      setCouponError(friendly);
    } finally {
      setCouponLoading(false);
    }
  };

  const processPaymentApi = async (method) => {
    setPaymentProcessing(true);
    setCheckoutError("");

    try {
      const amountToCharge = Math.max(0, Number(baseTotal || 0) - Number(discountAmount || 0));
      const payload = {
        order_id: parseInt(orderId),
        amount: parseFloat(amountToCharge),
        payment_method: method,
        ...(couponCode.trim() ? { coupon_code: couponCode.trim() } : {})
      };

      const res = await postPayment(payload);
      if (res.data && res.data.ok) {
        // --- Registrar uso del cupón si se aplicó uno ---
        if (couponCode.trim() && discountAmount > 0) {
          try {
            await aplicarCupon({
              codigo: couponCode.trim(),
              id_orden: parseInt(orderId),
              total: parseFloat(baseTotal)
            });
          } catch (couponErr) {
            // No bloquear el flujo si el registro del cupón falla
            console.warn("No se pudo registrar el uso del cupón:", couponErr);
          }
        }

        try {
          await sendConfirmationEmail(orderId);
        } catch (emailErr) {
          console.warn("Correo no enviado:", emailErr);
        }
        // Recargar órdenes para actualizar el estado
        getOrdenes()
          .then((res) => setOrdenes(res.data))
          .catch((err) => console.error(err));
        // Recargar carrito para vaciarlo después del pago
        getCarrito()
          .then((res) => setCarrito(res.data))
          .catch((err) => console.error(err));
        // Recargar notificaciones para mostrar la compra realizada
        if (activeSide === "Notificaciones") {
          cargarNotificaciones(true);
        }
        // Ocultar checkout y mostrar pantalla de compra realizada
        setMostrarCheckout(false);
        setPaymentSuccess(true);
      } else {
        setCheckoutError("El pago fue rechazado por la pasarela de pagos.");
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err.response?.data?.detail || "Ocurrió un error inesperado al procesar tu pago.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!validateCardForm()) return;
    
    setPaymentProcessing(true);
    setTimeout(() => {
      processPaymentApi("Tarjeta de Crédito");
    }, 2000);
  };

  const handlePaypalSubmit = (e) => {
    e.preventDefault();
    if (!paypalEmail || !paypalPassword) {
      setPaypalError("Ingresa tu correo y contraseña");
      return;
    }
    setPaypalError("");
    setPaypalProcessing(true);
    
    setTimeout(() => {
      setPaypalProcessing(false);
      setShowPaypalModal(false);
      processPaymentApi("PayPal");
    }, 2000);
  };

  const handleGoToCatalog = () => handleSelectSection("Catálogo");

  const handleVerDetalleLibro = (libro) => {
    setCatalogoLibroInicial(libro);
    handleSelectSection("Catálogo");
  };

  const handleCrearListaDeseos = async () => {
    const nombre = nuevaListaNombre.trim();
    if (!nombre) {
      setListaDeseosError('El nombre de la lista es obligatorio');
      return;
    }
    setListaDeseosLoading(true);
    setListaDeseosError('');
    try {
      const res = await crearListaDeseos({ nombre_lista: nombre, publica: false });
      setNuevaListaNombre('');
      setMostrarFormNuevaLista(false);
      await cargarListasDeseos();
      if (res.data?.id_lista) setListaSeleccionadaId(res.data.id_lista);
      notify('Lista creada', 'success');
    } catch (error) {
      setListaDeseosError(error.response?.data?.detail || 'No se pudo crear la lista');
    } finally {
      setListaDeseosLoading(false);
    }
  };

  const handleEliminarListaDeseos = async (idLista) => {
    if (!window.confirm('¿Eliminar esta lista de deseos?')) return;
    setListaDeseosLoading(true);
    try {
      await eliminarListaDeseos(idLista);
      if (listaSeleccionadaId === idLista) {
        setListaSeleccionadaId(null);
        setLibrosListaDeseos([]);
      }
      await cargarListasDeseos();
      notify('Lista eliminada', 'success');
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudo eliminar la lista', 'error');
    } finally {
      setListaDeseosLoading(false);
    }
  };

  const handleEliminarLibroLista = async (idLibro) => {
    if (!listaSeleccionadaId) return;
    try {
      await eliminarLibroListaDeseos(listaSeleccionadaId, idLibro);
      await cargarLibrosLista(listaSeleccionadaId);
      await cargarListasDeseos();
      notify('Libro eliminado de la lista', 'success');
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudo eliminar el libro', 'error');
    }
  };

  const handleSelectSection = (seccion) => {
    setActiveSide(seccion);
    navigate(`/post-login?seccion=${encodeURIComponent(seccion)}`, { replace: true });
  };

  // ============= FUNCIONES DE NOTIFICACIONES =============
  const generarNotificacionesOrdenes = useCallback(() => {
    const notificacionesGeneradas = [];
    
    ordenes.forEach((orden) => {
      if (orden.estado === 'pendiente') {
        const idNotif = `orden-pendiente-${orden.id_orden}`;
        // No generar si fue eliminada por el usuario
        if (notificacionesEliminadasAutomaticas.has(idNotif)) return;
        
        const estaLeida = notificacionesLeidasAutomaticas.has(idNotif);
        notificacionesGeneradas.push({
          id_notificacion: idNotif,
          tipo: 'pago',
          titulo: 'Pago Pendiente',
          descripcion: `Tienes un pago pendiente de ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} para la orden #${orden.id_orden}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: estaLeida,
          referencia_id: orden.id_orden,
          es_automatica: true
        });
      } else if (orden.estado === 'completada' || orden.estado === 'pagada' || orden.estado === 'pagado') {
        const idNotif = `orden-completada-${orden.id_orden}`;
        // No generar si fue eliminada por el usuario
        if (notificacionesEliminadasAutomaticas.has(idNotif)) return;
        
        const estaLeida = notificacionesLeidasAutomaticas.has(idNotif);
        notificacionesGeneradas.push({
          id_notificacion: idNotif,
          tipo: 'pedido',
          titulo: 'Compra Realizada',
          descripcion: `Tu compra #${orden.id_orden} ha sido completada exitosamente por ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: estaLeida,
          referencia_id: orden.id_orden,
          es_automatica: true
        });
      }
    });
    
    return notificacionesGeneradas;
  }, [ordenes, notificacionesLeidasAutomaticas, notificacionesEliminadasAutomaticas]);

  const cargarNotificaciones = useCallback(async (silent = false) => {
    try {
      if (!silent) setNotificacionesLoading(true);
      const data = await notificacionesService.obtener(false, 50, 0);
      const notificacionesAPI = data.notificaciones || [];
      
      const notificacionesOrdenes = generarNotificacionesOrdenes();
      const todasNotificaciones = [...notificacionesOrdenes, ...notificacionesAPI];
      
      if (notificacionesFilter === "no_leidas") {
        setNotificaciones(todasNotificaciones.filter(n => !n.leida));
      } else {
        setNotificaciones(todasNotificaciones);
      }
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
      const notificacionesOrdenes = generarNotificacionesOrdenes();
      if (notificacionesFilter === "no_leidas") {
        setNotificaciones(notificacionesOrdenes.filter(n => !n.leida));
      } else {
        setNotificaciones(notificacionesOrdenes);
      }
    } finally {
      if (!silent) setNotificacionesLoading(false);
    }
  }, [notificacionesFilter, generarNotificacionesOrdenes]);

  const handleMarcarLeida = async (id_notificacion) => {
    try {
      const notif = notificaciones.find(n => n.id_notificacion === id_notificacion);
      if (notif?.es_automatica) {
        setNotificacionesLeidasAutomaticas(prev => new Set([...prev, id_notificacion]));
        setNotificaciones(prev => prev.map(n => 
          n.id_notificacion === id_notificacion ? { ...n, leida: true } : n
        ));
      } else {
        await notificacionesService.marcarLeida(id_notificacion);
        await cargarNotificaciones(true);
      }
    } catch (err) {
      console.error("Error marcando como leída:", err);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      const automaticasIds = notificaciones.filter(n => n.es_automatica).map(n => n.id_notificacion);
      setNotificacionesLeidasAutomaticas(prev => new Set([...prev, ...automaticasIds]));
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      await notificacionesService.marcarTodasLeidas();
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error marcando todas como leídas:", err);
    }
  };

  const handleEliminar = async (id_notificacion) => {
    setNotificacionAEliminar(id_notificacion);
    setMostrarModalEliminar(true);
  };

  const confirmarEliminar = async () => {
    if (!notificacionAEliminar) return;
    
    try {
      const notif = notificaciones.find(n => n.id_notificacion === notificacionAEliminar);
      if (notif?.es_automatica) {
        // Agregar al Set de eliminadas para que no se vuelva a generar
        setNotificacionesEliminadasAutomaticas(prev => new Set([...prev, notificacionAEliminar]));
        setNotificacionesLeidasAutomaticas(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificacionAEliminar);
          return newSet;
        });
        setNotificaciones(prev => prev.filter(n => n.id_notificacion !== notificacionAEliminar));
      } else {
        await notificacionesService.eliminar(notificacionAEliminar);
        await cargarNotificaciones(true);
      }
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    } finally {
      setMostrarModalEliminar(false);
      setNotificacionAEliminar(null);
    }
  };

  const cancelarEliminar = () => {
    setMostrarModalEliminar(false);
    setNotificacionAEliminar(null);
  };

  const handleClickNotificacion = (notif) => {
    if (notif.es_automatica) {
      if (notif.tipo === 'pago') {
        handleSelectSection('Carrito');
      } else if (notif.tipo === 'pedido') {
        handleSelectSection('Mis Compras');
      }
    } else {
      switch (notif.tipo) {
        case "mensaje":
          handleSelectSection('Mensajes');
          break;
        case "resena":
          handleSelectSection('Catálogo');
          break;
        case "oferta":
          handleSelectSection('Catálogo');
          break;
        case "pedido":
        case "entrega":
        case "pago":
          handleSelectSection('Mis Compras');
          break;
        default:
          break;
      }
    }
    handleMarcarLeida(notif.id_notificacion);
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      mensaje: <IconMessage width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      resena: <IconStar width={24} height={24} strokeWidth={1.5} style={{ color: '#FFA500' }} />,
      oferta: <IconGift width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      pedido: <IconShoppingBag width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      entrega: <IconTruck width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      pago: <IconCreditCard width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      sistema: <IconInfo width={24} height={24} strokeWidth={1.5} style={{ color: '#666' }} />,
    };
    return iconos[tipo] || <IconShoppingBag width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />;
  };

  // Cargar notificaciones cuando se selecciona esa sección
  useEffect(() => {
    if (activeSide === "Notificaciones" && userId) {
      cargarNotificaciones(false);
    }
  }, [activeSide, userId, cargarNotificaciones]);

  const totalCarrito = carrito.reduce(
    (acc, item) => acc + Number(item.precio_libro || 0) * Number(item.cantidad || 1),
    0
  );

  if (loading) return <div className="auth-main">Cargando dashboard...</div>;

  return (
    <div className="dashboard-container">
      <CompradorSidebar
        userName={userName}
        userEmail={userEmail}
        profilePhotoUrl={profilePhotoUrl}
        activeSide={activeSide}
        onSelect={handleSelectSection}
      />

      <main className="dashboard-main">

        {/* ── INICIO ── */}
        {activeSide === "Inicio" && (
          <>
            <div className="welcome-card">
              <h1>Bienvenido de nuevo, {userName.split(" ")[0]}</h1>
              <p>Esta es tu área personal de BookyHome.</p>
            </div>

            {/* RECOMENDACIONES PERSONALIZADAS */}
            {librosRecomendados.length === 0 ? (
              <div className="empty-state">
                <p>Agrega libros a tu lista de deseos para recibir recomendaciones personalizadas</p>
                <button className="btn btn-vinotinto btn-catalog" onClick={() => handleSelectSection('Lista de Deseos')} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                  Ir a lista de deseos
                </button>
              </div>
            ) : (
              <div className="pl-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <IconStar width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                  <div>
                    <h2 style={{ margin: 0 }}>Recomendados para ti</h2>
                    <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
                      Basado en tus listas de deseos
                    </p>
                  </div>
                </div>

                {librosRecomendados.map((libro) => (
                  <div key={libro.id_libro} className="pl-order-row" style={{ cursor: 'pointer' }}
                    onClick={() => handleVerDetalleLibro(libro)}>
                    <div className="pl-order-left">
                      <span className="pl-order-emoji" style={{ display: 'flex', alignItems: 'center' }}>
                        <IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                      </span>
                      <div>
                        <p className="pl-order-title">{libro.titulo}</p>
                        <p className="pl-order-meta">
                          {libro.autor_libro || libro.autor} · {libro.nombre_categoria}
                        </p>
                      </div>
                    </div>
                    <div className="pl-order-right">
                      <span className="pl-order-price">
                        ${Number(libro.precio_libro ?? libro.precio ?? 0).toLocaleString('es-CO')}
                      </span>
                      <span style={{
                        background: '#6b1a2a', color: 'white', padding: '4px 10px',
                        borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <IconFavorites width={12} height={12} strokeWidth={2} style={{ color: 'white' }} />
                        Lista de deseos
                      </span>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button className="btn btn-vinotinto btn-catalog" onClick={handleGoToCatalog} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                    Ver más libros
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE CUPONES DISPONIBLES */}
            <CouponsList />
          </>
        )}

        {/* ── CATÁLOGO EN DASHBOARD (sin salto de página) ── */}
        {activeSide === "Catálogo" && (
          <Catalogo
            libroInicial={catalogoLibroInicial}
            onLibroInicialConsumido={() => setCatalogoLibroInicial(null)}
          />
        )}

        {/* ── MENSAJES EN DASHBOARD (sin salto de página) ── */}
        {activeSide === "Mensajes" && (
          <Chat embedded={true} selectedSalaProp={selectedSalaInChat} onSelectSala={(id) => setSelectedSalaInChat(id)} />
        )}

        {/* ── NOTIFICACIONES EN DASHBOARD (sin salto de página) ── */}
        {activeSide === "Notificaciones" && (
          <div className="pl-card" style={{ padding: "2.5rem 2rem", background: "linear-gradient(135deg, #faf8f6 0%, #f5f0eb 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", background: "linear-gradient(135deg, #fff 0%, #faf8f6 100%)", border: "2px solid #e8e4df", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)" }}>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "12px", fontSize: "1.8rem", fontWeight: 800, color: "#7A1E3A", letterSpacing: "-0.5px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #7A1E3A 0%, #9C2F4A 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <IconPackage width={24} height={24} strokeWidth={2} style={{ color: 'white' }} />
                </div>
                Notificaciones
              </h2>
              {notificaciones.some((n) => !n.leida) && (
                <button
                  onClick={handleMarcarTodasLeidas}
                  style={{
                    background: "linear-gradient(135deg, #7A1E3A 0%, #5e1629 100%)",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(122, 30, 58, 0.2)",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(122, 30, 58, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 12px rgba(122, 30, 58, 0.2)";
                  }}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "2rem" }}>
              <button
                onClick={() => setNotificacionesFilter("todas")}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: "30px",
                  border: "2px solid #e0dbd4",
                  background: notificacionesFilter === "todas" ? "linear-gradient(135deg, #7A1E3A 0%, #5e1629 100%)" : "white",
                  color: notificacionesFilter === "todas" ? "white" : "#555",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: notificacionesFilter === "todas" ? "0 4px 12px rgba(122, 30, 58, 0.25)" : "0 2px 8px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  if (notificacionesFilter !== "todas") {
                    e.target.style.borderColor = "#7A1E3A";
                    e.target.style.color = "#7A1E3A";
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(122, 30, 58, 0.15)";
                  }
                }}
                onMouseOut={(e) => {
                  if (notificacionesFilter !== "todas") {
                    e.target.style.borderColor = "#e0dbd4";
                    e.target.style.color = "#555";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                  }
                }}
              >
                Todas
              </button>
              <button
                onClick={() => setNotificacionesFilter("no_leidas")}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: "30px",
                  border: "2px solid #e0dbd4",
                  background: notificacionesFilter === "no_leidas" ? "linear-gradient(135deg, #7A1E3A 0%, #5e1629 100%)" : "white",
                  color: notificacionesFilter === "no_leidas" ? "white" : "#555",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: notificacionesFilter === "no_leidas" ? "0 4px 12px rgba(122, 30, 58, 0.25)" : "0 2px 8px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  if (notificacionesFilter !== "no_leidas") {
                    e.target.style.borderColor = "#7A1E3A";
                    e.target.style.color = "#7A1E3A";
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(122, 30, 58, 0.15)";
                  }
                }}
                onMouseOut={(e) => {
                  if (notificacionesFilter !== "no_leidas") {
                    e.target.style.borderColor = "#e0dbd4";
                    e.target.style.color = "#555";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                  }
                }}
              >
                No leídas
              </button>
            </div>

            <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "8px", scrollbarWidth: "none", msOverflowStyle: "none", WebkitScrollbar: "none" }} className="notificaciones-scroll-container">
              {notificacionesLoading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    border: "3px solid #e0dbd4",
                    borderTop: "3px solid #7A1E3A",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px"
                  }} />
                  <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>Cargando notificaciones...</p>
                </div>
              ) : notificaciones.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 40px", color: "#888", background: "white", borderRadius: "20px", border: "2px dashed #e0dbd4", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #faf8f6 0%, #f5f0eb 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    border: "2px solid #e8e4df"
                  }}>
                    <IconPackage width={40} height={40} strokeWidth={1.5} style={{ color: '#ccc' }} />
                  </div>
                  <p style={{ fontSize: "1.1rem", fontWeight: 500, color: "#666" }}>
                    {notificacionesFilter === "no_leidas"
                      ? "No tienes notificaciones sin leer"
                      : "No tienes notificaciones"}
                  </p>
                </div>
              ) : (
                notificaciones.map((notif) => (
                  <div
                    key={notif.id_notificacion}
                    onClick={() => handleClickNotificacion(notif)}
                    style={{
                      padding: "24px",
                      borderRadius: "16px",
                      background: notif.leida ? "white" : "linear-gradient(135deg, #fff8f5 0%, #fff 100%)",
                      border: notif.leida ? "1px solid #e8e4df" : "2px solid #e8e4df",
                      marginBottom: "16px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      gap: "18px",
                      alignItems: "flex-start",
                      boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
                      position: "relative",
                      borderLeft: notif.leida ? "5px solid transparent" : "5px solid #7A1E3A"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = "translateY(-3px)";
                      e.target.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
                      e.target.style.borderColor = "#d4a574";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.06)";
                      e.target.style.borderColor = notif.leida ? "#e8e4df" : "#e8e4df";
                    }}
                  >
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, #faf8f6 0%, #f5f0eb 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "2px solid #e8e4df",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = "scale(1.05)";
                      e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.12)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = "scale(1)";
                      e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
                    }}>
                      {getIconoTipo(notif.tipo)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        margin: "0 0 8px 0",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "#2c2c2c",
                        letterSpacing: "-0.3px"
                      }}>
                        {notif.titulo}
                      </h4>
                      <p style={{
                        margin: "0 0 10px 0",
                        fontSize: "0.95rem",
                        color: "#555",
                        lineHeight: "1.5"
                      }}>
                        {notif.descripcion}
                      </p>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.85rem",
                        color: "#999",
                        fontWeight: 500
                      }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {new Date(notif.fecha_creacion).toLocaleString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  {!notif.leida && (
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#7A1E3A",
                      flexShrink: 0
                    }} />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(notif.id_notificacion);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                      color: "#dc2626",
                      border: "2px solid #fecaca",
                      padding: "8px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "10px",
                      width: "38px",
                      height: "38px"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
                      e.target.style.color = "white";
                      e.target.style.borderColor = "#dc2626";
                      e.target.style.transform = "scale(1.1)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)";
                      e.target.style.color = "#dc2626";
                      e.target.style.borderColor = "#fecaca";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de confirmación para eliminar notificación */}
        {mostrarModalEliminar && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 3000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <div style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "420px",
              width: "100%",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              animation: "slideUp 0.3s ease-out"
            }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px"
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "1.5rem", fontWeight: 700, color: "#2c2c2c" }}>
                  Eliminar notificación
                </h3>
                <p style={{ margin: 0, fontSize: "1rem", color: "#666", lineHeight: "1.6" }}>
                  ¿Estás seguro de que deseas eliminar esta notificación? Esta acción no se puede deshacer.
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={cancelarEliminar}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: "10px",
                    border: "2px solid #e0dbd4",
                    background: "white",
                    color: "#666",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#f5f5f5";
                    e.target.style.borderColor = "#ccc";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "white";
                    e.target.style.borderColor = "#e0dbd4";
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminar}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

        {/* ── CARRITO (FUSIONADO Y OPTIMIZADO) ── */}
        {activeSide === "Carrito" && (
          <>
            <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconCart width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                <h2 style={{ margin: 0 }}>Mi Carrito</h2>
              </div>
            </div>

            {cartLoading ? (
              <div className="empty-state"><p>Cargando carrito...</p></div>
            ) : paymentSuccess && !mostrarCheckout ? (
              /* COMPRA REALIZADA */
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                <div style={{ marginTop: "0" }}>
                  <button
                    onClick={handleVolverCarrito}
                    style={{
                      background: 'var(--vinotinto)',
                      color: 'white',
                      border: 'none',
                      padding: '0.7rem 1.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Volver al carrito
                  </button>

                  <div style={{
                    background: "var(--blanco)",
                    padding: "40px",
                    borderRadius: "16px",
                    boxShadow: "var(--sombra-suave)",
                    border: "1px solid #e0dbd4",
                    textAlign: "center"
                  }}>
                    <div style={{
                      width: 80, height: 80,
                      borderRadius: "50%",
                      background: "#fdf0f2",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 20px"
                    }}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h1 style={{ fontWeight: 800, color: "var(--vinotinto)", margin: "0 0 8px", fontSize: "1.8rem" }}>
                      ¡Compra Confirmada!
                    </h1>
                    <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "28px" }}>
                      Tu pago fue procesado exitosamente. Te enviamos un correo con los detalles de tu pedido.
                    </p>
                    <div style={{
                      background: "#fcfaf7",
                      padding: "20px",
                      borderRadius: "10px",
                      border: "1px solid #e0dbd4",
                      textAlign: "left",
                      marginBottom: "16px"
                    }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Resumen de tu orden
                      </p>
                      <div style={{ margin: "12px 0", display: "grid", gap: "8px" }}>
                        {order.items?.map((item) => (
                          <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                            <span>{item.titulo} x{item.cantidad}</span>
                            <span>{Number(item.precio_libro * item.cantidad).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "2px solid #e0dbd4", display: "grid", gap: "8px" }}>
                        {discountAmount > 0 && (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                              <span style={{ color: "#666" }}>Subtotal</span>
                              <span style={{ fontWeight: 600 }}>{formatCurrency(baseTotal)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", background: "#f0faf0", padding: "6px 10px", borderRadius: "6px", border: "1px solid #c8e6c9" }}>
                              <span style={{ color: "#2e7d32" }}>🏷️ Cupón {couponCode}</span>
                              <span style={{ color: "#2e7d32", fontWeight: 700 }}>-{formatCurrency(discountAmount)}</span>
                            </div>
                          </>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem" }}>
                          <span>Total pagado</span>
                          <span style={{ color: "var(--vinotinto)" }}>{formatCurrency(totalToPay)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : carrito.length === 0 && ordenes.filter(o => o.estado === 'pendiente').length === 0 ? (
              <div className="pl-card" style={{ padding: "40px" }}>
                <CartEmptyState onGoToCatalog={handleGoToCatalog} />
              </div>
            ) : mostrarCheckout ? (
              /* CHECKOUT VIEW */
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                {order && (
                  <div style={{ marginTop: "0" }}>
                    <button
                      onClick={handleVolverCarrito}
                      style={{
                        background: 'var(--vinotinto)',
                        color: 'white',
                        border: 'none',
                        padding: '0.7rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                      Volver al carrito
                    </button>

                    {paymentSuccess ? (
                      <div style={{
                        background: "var(--blanco)",
                        padding: "40px",
                        borderRadius: "16px",
                        boxShadow: "var(--sombra-suave)",
                        border: "1px solid #e0dbd4",
                        textAlign: "center"
                      }}>
                        <div style={{
                          width: 80, height: 80,
                          borderRadius: "50%",
                          background: "#fdf0f2",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          margin: "0 auto 20px"
                        }}>
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </div>
                        <h1 style={{ fontWeight: 800, color: "var(--vinotinto)", margin: "0 0 8px", fontSize: "1.8rem" }}>
                          ¡Compra Confirmada!
                        </h1>
                        <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "28px" }}>
                          Tu pago fue procesado exitosamente. Te enviamos un correo con los detalles de tu pedido.
                        </p>
                        <div style={{
                          background: "#fcfaf7",
                          padding: "20px",
                          borderRadius: "10px",
                          border: "1px solid #e0dbd4",
                          textAlign: "left",
                          marginBottom: "16px"
                        }}>
                          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Resumen de tu orden
                          </p>
                          <div style={{ margin: "12px 0", display: "grid", gap: "8px" }}>
                            {order.items?.map((item) => (
                              <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                                <span style={{ color: "#444" }}>📖 {item.titulo} <span style={{ color: "#999" }}>x{item.cantidad}</span></span>
                                <span style={{ fontWeight: 600 }}>
                                  {Number(item.precio_libro * item.cantidad).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div style={{ borderTop: "1px solid #e0dbd4", paddingTop: "12px", marginTop: "4px", display: "grid", gap: "8px", fontSize: "0.9rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#666" }}>ID Orden</span>
                              <span style={{ fontWeight: 600 }}>#{order.id_orden}</span>
                            </div>
                            {discountAmount > 0 && (
                              <>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "#666" }}>Subtotal</span>
                                  <span style={{ fontWeight: 600 }}>{formatCurrency(baseTotal)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", background: "#f0faf0", padding: "6px 10px", borderRadius: "6px", border: "1px solid #c8e6c9" }}>
                                  <span style={{ color: "#2e7d32" }}>🏷️ Cupón {couponCode}</span>
                                  <span style={{ color: "#2e7d32", fontWeight: 700 }}>-{formatCurrency(discountAmount)}</span>
                                </div>
                              </>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0dbd4", paddingTop: "10px", marginTop: "4px" }}>
                              <span style={{ fontWeight: 700 }}>Total pagado</span>
                              <span style={{ fontWeight: 800, color: "var(--rojo-suave)", fontSize: "1.05rem" }}>
                                {formatCurrency(totalToPay)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="btn btn-vinotinto" onClick={() => setActiveSide("Mis Compras")} style={{ width: "100%" }}>
                          Ir a Mis Compras
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "30px", alignItems: "start" }}>
                        {/* LEFT COLUMN: Payment details */}
                        <div style={{
                          background: "var(--blanco)",
                          padding: "30px",
                          borderRadius: "12px",
                          boxShadow: "var(--sombra-suave)",
                          border: "1px solid #e0dbd4"
                        }}>
                          <h2 style={{ fontWeight: 700, margin: "0 0 20px 0", fontSize: "1.3rem" }}>Método de Pago</h2>

                          <div style={{ marginBottom: "20px", padding: "14px", borderRadius: "8px", border: "1px solid #e8e0d3", background: "#fcfaf7" }}>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                              <input
                                type="text"
                                placeholder="Código de cupón"
                                value={couponCode}
                                onChange={(e) => {
                                  setCouponCode(e.target.value.toUpperCase());
                                  setCouponError("");
                                  setCouponSuccess("");
                                  setDiscountAmount(0);
                                }}
                                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1.5px solid #e0dbd4", outline: "none", fontFamily: "'Montserrat', sans-serif" }}
                              />
                              <button type="button" onClick={handleValidateCoupon} disabled={couponLoading} style={{ padding: "10px 14px", borderRadius: "6px", border: "none", background: "var(--vinotinto)", color: "#fff", fontWeight: 700, cursor: couponLoading ? "not-allowed" : "pointer", opacity: couponLoading ? 0.7 : 1 }}>
                                {couponLoading ? "Validando..." : "Aplicar"}
                              </button>
                            </div>
                            {couponError ? <p style={{ margin: "0 0 8px", color: "#b42318", fontSize: "0.82rem", fontWeight: 600 }}>{couponError}</p> : null}
                            {couponSuccess ? <p style={{ margin: "0", color: "#057a55", fontSize: "0.82rem", fontWeight: 600 }}>{couponSuccess}</p> : null}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "30px" }}>
                            <button
                              onClick={() => setPaymentMethod("tarjeta")}
                              style={{
                                padding: "15px",
                                borderRadius: "8px",
                                border: paymentMethod === "tarjeta" ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4",
                                background: paymentMethod === "tarjeta" ? "#fbf7f8" : "var(--blanco)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 600,
                                color: paymentMethod === "tarjeta" ? "var(--vinotinto)" : "var(--gris-carbon)",
                                transition: "var(--transition)",
                                fontSize: "0.85rem"
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                              </svg>
                              Tarjeta
                            </button>

                            <button
                              onClick={() => setPaymentMethod("paypal")}
                              style={{
                                padding: "15px",
                                borderRadius: "8px",
                                border: paymentMethod === "paypal" ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4",
                                background: paymentMethod === "paypal" ? "#fbf7f8" : "var(--blanco)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 600,
                                color: paymentMethod === "paypal" ? "var(--vinotinto)" : "var(--gris-carbon)",
                                transition: "var(--transition)",
                                fontSize: "0.85rem"
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2H7.5a2.5 2.5 0 0 0-2.5 2.5v13a1.5 1.5 0 0 0 1.5 1.5h3.5a1.5 1.5 0 0 0 1.5-1.5v-3.5h2.5a4.5 4.5 0 0 0 4.5-4.5V6.5A4.5 4.5 0 0 0 12 2z"></path>
                              </svg>
                              PayPal
                            </button>

                            <button
                              onClick={() => setPaymentMethod("sucursal")}
                              style={{
                                padding: "15px",
                                borderRadius: "8px",
                                border: paymentMethod === "sucursal" ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4",
                                background: paymentMethod === "sucursal" ? "#fbf7f8" : "var(--blanco)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 600,
                                color: paymentMethod === "sucursal" ? "var(--vinotinto)" : "var(--gris-carbon)",
                                transition: "var(--transition)",
                                fontSize: "0.85rem"
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21h18"></path>
                                <path d="M5 21V7l8-4 8 4v14"></path>
                                <path d="M17 21v-8.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5V21"></path>
                              </svg>
                              En Sucursal
                            </button>

                            <button
                              onClick={() => setPaymentMethod("pse")}
                              style={{
                                padding: "15px",
                                borderRadius: "8px",
                                border: paymentMethod === "pse" ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4",
                                background: paymentMethod === "pse" ? "#fbf7f8" : "var(--blanco)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 600,
                                color: paymentMethod === "pse" ? "var(--vinotinto)" : "var(--gris-carbon)",
                                transition: "var(--transition)",
                                fontSize: "0.85rem"
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                <line x1="2" y1="10" x2="22" y2="10"></line>
                              </svg>
                              PSE
                            </button>

                            <button
                              onClick={() => setPaymentMethod("nequi")}
                              style={{
                                padding: "15px",
                                borderRadius: "8px",
                                border: paymentMethod === "nequi" ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4",
                                background: paymentMethod === "nequi" ? "#fbf7f8" : "var(--blanco)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 600,
                                color: paymentMethod === "nequi" ? "var(--vinotinto)" : "var(--gris-carbon)",
                                transition: "var(--transition)",
                                fontSize: "0.85rem"
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                              </svg>
                              Nequi/Daviplata
                            </button>

                            <button
                              onClick={() => setPaymentMethod("transferencia")}
                              style={{
                                padding: "15px",
                                borderRadius: "8px",
                                border: paymentMethod === "transferencia" ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4",
                                background: paymentMethod === "transferencia" ? "#fbf7f8" : "var(--blanco)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 600,
                                color: paymentMethod === "transferencia" ? "var(--vinotinto)" : "var(--gris-carbon)",
                                transition: "var(--transition)",
                                fontSize: "0.85rem"
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                              Transferencia
                            </button>
                          </div>

                          {paymentMethod === "tarjeta" ? (
                            <form onSubmit={handleCardSubmit}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "15px" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Nombre del Titular</label>
                                  <input
                                    type="text"
                                    placeholder="Juan Pérez"
                                    value={cardName}
                                    onChange={(e) => { setCardName(e.target.value); setFormErrors(p => ({ ...p, cardName: "" })); }}
                                    style={{
                                      width: "100%", padding: "10px", borderRadius: "6px", border: formErrors.cardName ? "1.5px solid red" : "1.5px solid #e0dbd4", outline: "none", fontFamily: "'Montserrat', sans-serif"
                                    }}
                                  />
                                  {formErrors.cardName && <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.cardName}</span>}
                                </div>

                                <div>
                                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Número de Tarjeta</label>
                                  <input
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    value={cardNumber}
                                    onChange={handleCardNumberChange}
                                    style={{
                                      width: "100%", padding: "10px", borderRadius: "6px", border: formErrors.cardNumber ? "1.5px solid red" : "1.5px solid #e0dbd4", outline: "none", fontFamily: "'Montserrat', sans-serif"
                                    }}
                                  />
                                  {formErrors.cardNumber && <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.cardNumber}</span>}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                                  <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Vencimiento</label>
                                    <input
                                      type="text"
                                      placeholder="MM/AA"
                                      value={cardExpiry}
                                      onChange={handleExpiryChange}
                                      maxLength={5}
                                      style={{
                                        width: "100%", padding: "10px", borderRadius: "6px", 
                                        border: formErrors.cardExpiry ? "1.5px solid red" : "1.5px solid #e0dbd4", 
                                        outline: "none", fontFamily: "'Montserrat', sans-serif"
                                      }}
                                    />
                                    {formErrors.cardExpiry && <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.cardExpiry}</span>}
                                  </div>

                                  <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Cvv (Seguridad)</label>
                                    <input
                                      type="password"
                                      placeholder="123"
                                      value={cardCvv}
                                      onChange={handleCvvChange}
                                      style={{
                                        width: "100%", padding: "10px", borderRadius: "6px", border: formErrors.cardCvv ? "1.5px solid red" : "1.5px solid #e0dbd4", outline: "none", fontFamily: "'Montserrat', sans-serif"
                                      }}
                                    />
                                    {formErrors.cardCvv && <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.cardCvv}</span>}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "25px 0", color: "#666", fontSize: "0.85rem" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <span>Sus datos bancarios están encriptados y procesados de manera segura.</span>
                              </div>

                              <button type="submit" className="btn btn-vinotinto" style={{ width: "100%", marginTop: "10px" }}>
                                Pagar {Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                              </button>
                            </form>
                          ) : paymentMethod === "paypal" ? (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                              <p style={{ color: "#666", marginBottom: "25px", fontSize: "0.95rem" }}>
                                Al dar click al botón, abriremos un simulador de pago seguro para que apruebes la transacción desde tu cuenta de PayPal.
                              </p>
                              <button
                                onClick={() => setShowPaypalModal(true)}
                                className="btn btn-primary"
                                style={{
                                  background: "#FFC439",
                                  borderColor: "#FFC439",
                                  color: "#111",
                                  width: "100%",
                                  maxWidth: "350px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "10px",
                                  fontWeight: 700
                                }}
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 2H7.5a2.5 2.5 0 0 0-2.5 2.5v13a1.5 1.5 0 0 0 1.5 1.5h3.5a1.5 1.5 0 0 0 1.5-1.5v-3.5h2.5a4.5 4.5 0 0 0 4.5-4.5V6.5A4.5 4.5 0 0 0 12 2z"></path>
                                </svg>
                                Pagar con PayPal
                              </button>
                            </div>
                          ) : paymentMethod === "sucursal" ? (
                            <div style={{ padding: "20px 0" }}>
                              {!sucursalCodigo ? (
                                <>
                                  <div style={{
                                    background: "#fcfaf7",
                                    padding: "20px",
                                    borderRadius: "8px",
                                    marginBottom: "20px",
                                    border: "1px solid #e0dbd4"
                                  }}>
                                    <h3 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1.1rem" }}>
                                      Pago en Efecty
                                    </h3>
                                    <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "15px" }}>
                                      Generaremos un código de pago único para que puedas pagar en cualquier punto Efecty cercano.
                                    </p>
                                    <div style={{ display: "grid", gap: "10px", fontSize: "0.9rem" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#666" }}>Número de Orden:</span>
                                        <span style={{ fontWeight: 700 }}>#{order.id_orden}</span>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#666" }}>Total a pagar:</span>
                                        <span style={{ fontWeight: 700, color: "var(--vinotinto)" }}>
                                          {formatCurrency(totalToPay)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={handleSucursalPago}
                                    className="btn btn-vinotinto"
                                    style={{ width: "100%" }}
                                  >
                                    Generar Código de Pago
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div style={{
                                    background: sucursalPagoConfirmado ? "#e8f5e9" : "#e3f2fd",
                                    padding: "25px",
                                    borderRadius: "8px",
                                    marginBottom: "20px",
                                    border: `2px solid ${sucursalPagoConfirmado ? "#4caf50" : "#2196f3"}`,
                                    textAlign: "center"
                                  }}>
                                    {sucursalPagoConfirmado ? (
                                      <>
                                        <h3 style={{ margin: "0 0 10px", color: "#2e7d32", fontSize: "1.2rem" }}>
                                          ¡Pago Confirmado!
                                        </h3>
                                        <div style={{
                                          background: "#fff",
                                          padding: "20px",
                                          borderRadius: "8px",
                                          marginBottom: "15px"
                                        }}>
                                          <p style={{ margin: "0 0 10px", color: "#666", fontSize: "0.9rem" }}>
                                            Efecty ha confirmado tu pago exitosamente.
                                          </p>
                                          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                          </div>
                                        </div>
                                      </>
                                    ) : sucursalEsperandoConfirmacion ? (
                                      <>
                                        <h3 style={{ margin: "0 0 10px", color: "#1976d2", fontSize: "1.2rem" }}>
                                          Esperando Confirmación de Efecty
                                        </h3>
                                        <div style={{
                                          background: "#fff",
                                          padding: "20px",
                                          borderRadius: "8px",
                                          marginBottom: "15px",
                                          border: "2px dashed #2196f3"
                                        }}>
                                          <p style={{ margin: "0 0 10px", color: "#666", fontSize: "0.9rem" }}>
                                            Presenta este código en cualquier punto Efecty:
                                          </p>
                                          <p style={{
                                            margin: "0",
                                            fontSize: "2rem",
                                            fontWeight: 800,
                                            color: "#1976d2",
                                            letterSpacing: "4px",
                                            fontFamily: "monospace"
                                          }}>
                                            {sucursalCodigo}
                                          </p>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                          <div style={{
                                            border: "4px solid #f3f3f3",
                                            borderTop: "4px solid #2196f3",
                                            borderRadius: "50%",
                                            width: "30px",
                                            height: "30px",
                                            animation: "spin 1s linear infinite"
                                          }}></div>
                                          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                                            Esperando confirmación de pago...
                                          </p>
                                        </div>
                                        <button
                                          onClick={verificarPagoEfecty}
                                          style={{
                                            marginTop: "15px",
                                            padding: "10px 20px",
                                            borderRadius: "6px",
                                            border: "1px solid #2196f3",
                                            background: "#fff",
                                            color: "#2196f3",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            fontSize: "0.85rem"
                                          }}
                                        >
                                          Simular Confirmación (Demo)
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <h3 style={{ margin: "0 0 10px", color: "#2e7d32", fontSize: "1.2rem" }}>
                                          ¡Código Generado!
                                        </h3>
                                        <div style={{
                                          background: "#fff",
                                          padding: "20px",
                                          borderRadius: "8px",
                                          marginBottom: "15px",
                                          border: "2px dashed #4caf50"
                                        }}>
                                          <p style={{ margin: "0 0 10px", color: "#666", fontSize: "0.9rem" }}>
                                            Presenta este código en cualquier punto Efecty:
                                          </p>
                                          <p style={{
                                            margin: "0",
                                            fontSize: "2rem",
                                            fontWeight: 800,
                                            color: "#2e7d32",
                                            letterSpacing: "4px",
                                            fontFamily: "monospace"
                                          }}>
                                            {sucursalCodigo}
                                          </p>
                                        </div>
                                        <div style={{ display: "grid", gap: "10px", fontSize: "0.85rem", textAlign: "left" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#666" }}>Orden:</span>
                                            <span style={{ fontWeight: 700 }}>#{order.id_orden}</span>
                                          </div>
                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#666" }}>Valor:</span>
                                            <span style={{ fontWeight: 700, color: "#2e7d32" }}>
                                              {formatCurrency(totalToPay)}
                                            </span>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  <div style={{
                                    background: "#fcfaf7",
                                    padding: "20px",
                                    borderRadius: "8px",
                                    marginBottom: "20px",
                                    border: "1px solid #e0dbd4"
                                  }}>
                                    <h4 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1rem" }}>
                                      Puntos Efecty Cercanos
                                    </h4>
                                    <div style={{ display: "grid", gap: "10px", maxHeight: "200px", overflowY: "auto" }}>
                                      {sucursalPuntos.map((punto) => (
                                        <div key={punto.id} style={{
                                          padding: "12px",
                                          background: "#fff",
                                          borderRadius: "6px",
                                          border: "1px solid #e0dbd4"
                                        }}>
                                          <p style={{ margin: "0 0 5px", fontWeight: 700, color: "var(--gris-carbon)" }}>
                                            {punto.nombre}
                                          </p>
                                          <p style={{ margin: "0 0 3px", color: "#666", fontSize: "0.85rem" }}>
                                            {punto.direccion}
                                          </p>
                                          <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                                            {punto.ciudad}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {!sucursalPagoConfirmado && (
                                    <button
                                      onClick={() => {
                                        setSucursalCodigo("");
                                        setSucursalPuntos([]);
                                        setSucursalEsperandoConfirmacion(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        padding: "14px",
                                        borderRadius: "8px",
                                        border: "2px solid var(--vinotinto)",
                                        background: "var(--blanco)",
                                        color: "var(--vinotinto)",
                                        fontWeight: 700,
                                        cursor: "pointer"
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          ) : paymentMethod === "pse" ? (
                            <div style={{ padding: "20px 0" }}>
                              <div style={{
                                background: "#fcfaf7",
                                padding: "20px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                                border: "1px solid #e0dbd4"
                              }}>
                                <h3 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1.1rem" }}>
                                  Pago con PSE
                                </h3>
                                <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "15px" }}>
                                  Selecciona tu banco para ser redirigido a la plataforma de PSE:
                                </p>
                                <div style={{ display: "grid", gap: "10px", fontSize: "0.9rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#666" }}>Número de Orden:</span>
                                    <span style={{ fontWeight: 700 }}>#{order.id_orden}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#666" }}>Total a pagar:</span>
                                    <span style={{ fontWeight: 700, color: "var(--vinotinto)" }}>
                                      {formatCurrency(totalToPay)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>
                                  Selecciona tu banco:
                                </label>
                                <select
                                  value={pseBanco}
                                  onChange={(e) => setPseBanco(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1.5px solid #e0dbd4",
                                    outline: "none",
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: "0.95rem"
                                  }}
                                >
                                  <option value="">-- Selecciona un banco --</option>
                                  {bancosPSE.map((banco) => (
                                    <option key={banco.codigo} value={banco.codigo}>
                                      {banco.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                onClick={handlePseRedirect}
                                disabled={pseRedirecting || !pseBanco}
                                className="btn btn-vinotinto"
                                style={{
                                  width: "100%",
                                  opacity: pseRedirecting || !pseBanco ? 0.7 : 1,
                                  cursor: pseRedirecting || !pseBanco ? "not-allowed" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "10px"
                                }}
                              >
                                {pseRedirecting ? (
                                  <>
                                    <div style={{
                                      border: "3px solid #f3f3f3",
                                      borderTop: "3px solid #fff",
                                      borderRadius: "50%",
                                      width: "20px",
                                      height: "20px",
                                      animation: "spin 1s linear infinite"
                                    }}></div>
                                    Redirigiendo a PSE...
                                  </>
                                ) : (
                                  <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                      <line x1="2" y1="10" x2="22" y2="10"></line>
                                    </svg>
                                    Continuar a PSE
                                  </>
                                )}
                              </button>

                              <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "15px", textAlign: "center" }}>
                                Serás redirigido a la plataforma segura de PSE para completar el pago.
                              </p>
                            </div>
                          ) : paymentMethod === "nequi" ? (
                            <div style={{ padding: "20px 0" }}>
                              <div style={{
                                background: "#fcfaf7",
                                padding: "20px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                                border: "1px solid #e0dbd4"
                              }}>
                                <h3 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1.1rem" }}>
                                  Pago con Nequi/Daviplata
                                </h3>
                                <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "15px" }}>
                                  Selecciona tu billetera digital para ser redirigido a la aplicación:
                                </p>
                                <div style={{ display: "grid", gap: "10px", fontSize: "0.9rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#666" }}>Número de Orden:</span>
                                    <span style={{ fontWeight: 700 }}>#{order.id_orden}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#666" }}>Total a pagar:</span>
                                    <span style={{ fontWeight: 700, color: "var(--vinotinto)" }}>
                                      {formatCurrency(totalToPay)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "grid", gap: "12px" }}>
                                <button
                                  onClick={handleNequiRedirect}
                                  style={{
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: "2px solid #2d7d3a",
                                    background: "#fff",
                                    color: "#2d7d3a",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseEnter={(e) => { e.target.style.background = "#f0f9f2"; }}
                                  onMouseLeave={(e) => { e.target.style.background = "#fff"; }}
                                >
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d7d3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                  </svg>
                                  Pagar con Nequi
                                </button>
                                <button
                                  onClick={handleDaviplataRedirect}
                                  style={{
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: "2px solid #e65100",
                                    background: "#fff",
                                    color: "#e65100",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseEnter={(e) => { e.target.style.background = "#fff8f0"; }}
                                  onMouseLeave={(e) => { e.target.style.background = "#fff"; }}
                                >
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                  </svg>
                                  Pagar con Daviplata
                                </button>
                              </div>
                              <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "15px", textAlign: "center" }}>
                                Si no tienes la aplicación instalada, se abrirá la página web correspondiente.
                              </p>
                            </div>
                          ) : paymentMethod === "transferencia" ? (
                            <div style={{ padding: "20px 0" }}>
                              <div style={{
                                background: "#fcfaf7",
                                padding: "20px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                                border: "1px solid #e0dbd4"
                              }}>
                                <h3 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1.1rem" }}>
                                  Transferencia Bancaria
                                </h3>
                                <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "15px" }}>
                                  Realiza una transferencia bancaria a la siguiente cuenta:
                                </p>
                                <div style={{ display: "grid", gap: "10px", fontSize: "0.9rem", background: "#fff", padding: "15px", borderRadius: "6px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#666" }}>Banco:</span>
                                    <span style={{ fontWeight: 700 }}>Bancolombia</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#666" }}>Tipo de cuenta:</span>
                                    <span style={{ fontWeight: 700 }}>Ahorros</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#666" }}>Número de cuenta:</span>
                                    <span style={{ fontWeight: 700 }}>123-456789-0</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#666" }}>Titular:</span>
                                    <span style={{ fontWeight: 700 }}>BookyHome S.A.S</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0dbd4", paddingTop: "10px", marginTop: "5px" }}>
                                    <span style={{ color: "#666" }}>Total a pagar:</span>
                                    <span style={{ fontWeight: 700, color: "var(--vinotinto)" }}>
                                      {formatCurrency(totalToPay)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => processPaymentApi("Transferencia Bancaria")}
                                className="btn btn-vinotinto"
                                style={{ width: "100%" }}
                              >
                                Confirmar Transferencia
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {/* RIGHT COLUMN: Order summary */}
                        <div style={{
                          background: "var(--beige)",
                          padding: "30px",
                          borderRadius: "12px",
                          border: "1px solid #e0dbd4"
                        }}>
                          <h2 style={{ fontWeight: 700, margin: "0 0 20px 0", fontSize: "1.3rem", color: "var(--gris-carbon)" }}>Resumen de Orden</h2>

                          <div style={{ maxHeight: "300px", overflowY: "auto", display: "grid", gap: "15px", marginBottom: "20px" }}>
                            {order.items?.map((item) => (
                              <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                                <div style={{ maxWidth: "70%" }}>
                                  <p style={{ margin: "0", fontWeight: 600 }}>{item.titulo}</p>
                                  <p style={{ margin: "2px 0 0 0", color: "#666", fontSize: "0.8rem" }}>Cant: {item.cantidad}</p>
                                </div>
                                <div>
                                  <span style={{ fontWeight: 700 }}>
                                    {Number(item.precio_libro * item.cantidad).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ borderTop: "1.5px solid #e0dbd4", paddingTop: "20px", display: "grid", gap: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                              <span>Subtotal</span>
                              <span>{Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                              <span>Envío</span>
                              <span style={{ color: "green", fontWeight: 600 }}>Gratis</span>
                            </div>
                            {discountAmount > 0 ? (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                                <span>Descuento</span>
                                <span style={{ color: "#057a55", fontWeight: 700 }}>-{formatCurrency(discountAmount)}</span>
                              </div>
                            ) : null}
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, marginTop: "10px", borderTop: "1px solid #e0dbd4", paddingTop: "15px" }}>
                              <span>Total</span>
                              <span style={{ color: "var(--rojo-suave)" }}>
                                {formatCurrency(totalToPay)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PAYPAL SIMULATOR MODAL */}
                    {showPaypalModal && (
                      <div style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 1100,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "15px"
                      }}>
                        <div style={{
                          background: "#fff",
                          maxWidth: "450px",
                          width: "100%",
                          borderRadius: "12px",
                          padding: "30px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1.5px solid #f0f0f0", paddingBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2H7.5a2.5 2.5 0 0 0-2.5 2.5v13a1.5 1.5 0 0 0 1.5 1.5h3.5a1.5 1.5 0 0 0 1.5-1.5v-3.5h2.5a4.5 4.5 0 0 0 4.5-4.5V6.5A4.5 4.5 0 0 0 12 2z"></path>
                              </svg>
                              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#003087" }}>PayPal Sandbox</span>
                            </div>
                            <button
                              onClick={() => setShowPaypalModal(false)}
                              style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", fontWeight: 800, color: "#666" }}
                            >
                              &times;
                            </button>
                          </div>

                          {paypalError && (
                            <p style={{ color: "red", fontSize: "0.85rem", marginBottom: "15px", fontWeight: 600 }}>{paypalError}</p>
                          )}

                          <form onSubmit={handlePaypalSubmit}>
                            <div style={{ display: "grid", gap: "15px", marginBottom: "25px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Correo electrónico PayPal</label>
                                <input
                                  type="email"
                                  placeholder="comprador-sandbox@example.com"
                                  value={paypalEmail}
                                  onChange={(e) => setPaypalEmail(e.target.value)}
                                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1.5px solid #e0dbd4", outline: "none" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Contraseña Sandbox</label>
                                <input
                                  type="password"
                                  placeholder="••••••••"
                                  value={paypalPassword}
                                  onChange={(e) => setPaypalPassword(e.target.value)}
                                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1.5px solid #e0dbd4", outline: "none" }}
                                />
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                type="button"
                                onClick={() => setShowPaypalModal(false)}
                                style={{ flex: 1, padding: "12px", background: "#f0f0f0", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={paypalProcessing}
                                style={{
                                  flex: 1,
                                  padding: "12px",
                                  background: "#0070ba",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontWeight: 700,
                                  cursor: paypalProcessing ? "not-allowed" : "pointer",
                                  opacity: paypalProcessing ? 0.7 : 1
                                }}
                              >
                                {paypalProcessing ? "Validando..." : `Pagar ${Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Payment processing overlay */}
                    {paymentProcessing && (
                      <div style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(255,255,255,0.9)",
                        zIndex: 1000,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        <div style={{
                          border: "4px solid #f4ede2",
                          borderTop: "4px solid var(--vinotinto)",
                          borderRadius: "50%",
                          width: "50px",
                          height: "50px",
                          animation: "spin 1s linear infinite"
                        }}></div>
                        <h2 style={{ fontWeight: 800, marginTop: "20px", color: "var(--gris-carbon)" }}>Procesando Pago de forma segura</h2>
                        <p style={{ color: "#666" }}>Conectando con la pasarela de pago bancaria...</p>
                      </div>
                    )}

                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                )}
              </div>
            ) : (
              /* CART ITEMS VIEW */
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                {ordenes.filter(o => o.estado === 'pendiente').map((orden) => (
                  <div key={orden.id_orden} style={{
                    background: "#fff3e0",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid #ff9800",
                    marginBottom: "15px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <div>
                        <p style={{ margin: "0 0 5px", fontWeight: 700, color: "#ff9800", fontSize: "0.9rem" }}>
                          Orden pendiente de pago
                        </p>
                        <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                          Orden #{orden.id_orden} - {Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => {
                            setOrderId(orden.id_orden);
                            setOrder(orden);
                            setMostrarCheckout(true);
                          }}
                          className="btn btn-vinotinto"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "auto",
                            marginTop: 0,
                            padding: "10px 16px",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            minHeight: "40px",
                            minWidth: "150px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Continuar Pago
                        </button>
                        <button
                          onClick={() => setOrdenACancelar(orden)}
                          className="btn btn-rojo"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "auto",
                            marginTop: 0,
                            padding: "10px 16px",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            minHeight: "40px",
                            minWidth: "150px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Cancelar compra
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {carrito.length > 0 && carrito.map((item) => (
                  <div
                    key={item.id_libro}
                    style={{
                      background: "var(--blanco)",
                      border: "1px solid #e0dbd4",
                      borderRadius: "8px",
                      padding: "20px",
                      boxShadow: "var(--sombra-suave)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "15px"
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 5px 0", fontWeight: 700, color: "var(--vinotinto)" }}>{item.titulo}</h3>
                      <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "0.9rem" }}>Autor: {item.autor_libro}</p>
                      <p style={{ margin: "0", fontWeight: 600, fontSize: "0.95rem" }}>Cantidad: {item.cantidad}</p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 5px 0", color: "#777", fontSize: "0.9rem" }}>
                        Unitario: {Number(item.precio_libro).toLocaleString("es-CO", {
                          style: "currency", currency: "COP", maximumFractionDigits: 0
                        })}
                      </p>
                      <p style={{ margin: "0", fontWeight: 700, color: "var(--gris-carbon)", fontSize: "1.1rem" }}>
                        Total: {Number((item.precio_libro || 0) * (item.cantidad || 1)).toLocaleString("es-CO", {
                          style: "currency", currency: "COP", maximumFractionDigits: 0
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Bloque de Cierre de Caja y Botones de Acción - solo para carrito normal */}
                {carrito.length > 0 && (
                <div style={{
                  marginTop: "30px",
                  borderTop: "2px solid #e0dbd4",
                  paddingTop: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "16px"
                }}>
                  <h2 style={{ fontWeight: 800, margin: 0 }}>
                    Total a pagar:{" "}
                    <span style={{ color: "var(--rojo-suave)" }}>
                      {totalCarrito.toLocaleString("es-CO", {
                        style: "currency", currency: "COP", maximumFractionDigits: 0,
                      })}
                    </span>
                  </h2>

                  {checkoutError && (
                    <p style={{ color: "var(--rojo-suave)", fontSize: 14, margin: 0, textAlign: "right" }}>
                      {checkoutError}
                    </p>
                  )}

                  <button
                    className="btn btn-vinotinto"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    style={{ width: "auto", minWidth: 250, cursor: checkoutLoading ? "not-allowed" : "pointer", opacity: checkoutLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                  >
                    {checkoutLoading ? "Procesando..." : <><IconCart width={18} height={18} strokeWidth={2} style={{ color: 'white' }} /> Proceder al Pago</>}
                  </button>

                  <button
                    onClick={handleGoToCatalog}
                    style={{
                      background: "none", border: "1.5px solid var(--vinotinto)",
                      color: "var(--vinotinto)", borderRadius: "8px", padding: "10px 20px",
                      fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                      fontFamily: "'Montserrat', sans-serif", transition: "all 0.2s",
                      width: "auto", minWidth: 250, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = "#f5eaed"; }}
                    onMouseLeave={(e) => { e.target.style.background = "none"; }}
                  >
                    <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                    Seguir comprando
                  </button>
                </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── MIS COMPRAS ── */}
        {activeSide === "Mis Compras" && (
          <>
            <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconPackage width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                <h2 style={{ margin: 0 }}>Mis Compras</h2>
              </div>
            </div>

            {ordenesLoading ? (
              <div className="empty-state"><p>Cargando tus compras...</p></div>
            ) : ordenes.length === 0 ? (
              <div className="empty-state"><p>Aún no tienes compras realizadas</p></div>
            ) : (
              <div className="pl-card">
                {ordenes.map((orden) => (
                  <div key={orden.id_orden} className="pl-order-row">
                    <div className="pl-order-left">
                      <span className="pl-order-emoji" style={{ display: 'flex', alignItems: 'center' }}>
                        {orden.estado === "pagado" ? <IconCheck width={20} height={20} strokeWidth={2} style={{ color: 'green' }} /> : <IconLock width={20} height={20} strokeWidth={2} style={{ color: '#7A1E3A' }} />}
                      </span>
                      <div>
                        <p className="pl-order-title">Orden #{orden.id_orden}</p>
                        <p className="pl-order-meta">
                          {orden.fecha ? new Date(orden.fecha).toLocaleDateString("es-CO") : ""}
                          {" · "}{orden.items?.length || 0} producto{orden.items?.length === 1 ? "" : "s"}
                          {" · "}
                          <span className={`pl-badge pl-badge--${orden.estado === "pagado" ? "entregado" : "procesando"}`}>
                            {orden.estado}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="pl-order-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="pl-order-price">
                        {Number(orden.total || 0).toLocaleString("es-CO", {
                          style: "currency", currency: "COP", maximumFractionDigits: 0,
                        })}
                      </span>
                      {orden.estado === "pagado" && (
                        <button
                          onClick={() => handleVerBaucher(orden)}
                          className="btn btn-vinotinto"
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.8rem",
                            borderRadius: "6px",
                            background: "var(--vinotinto)",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          Ver Baucher
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── LISTA DE DESEOS ── */}
        {activeSide === "Lista de Deseos" && (
          <ListaDeseos embedded onVerLibro={handleVerDetalleLibro} />
        )}

        {/* ── FAVORITOS ── */}
        {activeSide === "Favoritos" && (
          <>
            <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconFavorites width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                <h2 style={{ margin: 0 }}>Mis Favoritos</h2>
              </div>
            </div>

            {(() => {
              const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
              
              const IMAGENES_CATEGORIA = {
                'Fantasía':    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80',
                'Romance':     'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80',
                'Ciencia':     'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80',
                'Tecnología':  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80',
                'Historia':    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80',
                'Infantil':    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
                'Aventura':    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80',
                'Terror':      'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&q=80',
                'Biografía':   'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',
                'Educación':   'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80',
                'Arte':        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
                'Comedia':     'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80',
              };
              const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

              const obtenerImagen = (libro) => {
                if (libro?.imagen_url) return libro.imagen_url;
                if (libro?.imagen_principal) return libro.imagen_principal;
                if (libro?.imagenes?.[0]) return libro.imagenes[0];
                return IMAGENES_CATEGORIA[libro?.nombre_categoria] || IMG_DEFAULT;
              };

              const handleEliminarFavorito = (id_libro) => {
                const nuevos = favoritos.filter((f) => f.id_libro !== id_libro);
                localStorage.setItem('favoritos', JSON.stringify(nuevos));
                window.location.reload();
              };

              return favoritos.length === 0 ? (
                <div className="empty-state">
                  <p>No tienes libros en favoritos. ¡Agrega algunos desde el catálogo!</p>
                  <button className="btn btn-vinotinto btn-catalog" onClick={handleGoToCatalog} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                    Ir al catálogo
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {favoritos.map((libro) => (
                    <div 
                      key={libro.id_libro}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '200px 1fr',
                        gap: '24px',
                        padding: '24px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e0dbd4',
                        boxShadow: 'var(--sombra-suave)'
                      }}
                    >
                      {/* Foto del libro */}
                      <div>
                        <img
                          src={obtenerImagen(libro)}
                          alt={libro.titulo}
                          style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            objectFit: 'cover'
                          }}
                        />
                      </div>

                      {/* Detalles del libro */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {libro.nombre_categoria && (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: '#fce4ec',
                            color: '#8b0000',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            marginBottom: '8px',
                            width: 'fit-content'
                          }}>
                            {libro.nombre_categoria}
                          </span>
                        )}
                        
                        <h2 style={{
                          fontSize: '1.4rem',
                          fontWeight: '700',
                          margin: '0 0 4px 0',
                          lineHeight: '1.2',
                          color: '#2c2c2c'
                        }}>
                          {libro.titulo}
                        </h2>
                        
                        <p style={{
                          fontSize: '1rem',
                          color: '#666',
                          fontWeight: '600',
                          margin: '0 0 12px 0'
                        }}>
                          {libro.autor_libro || libro.autor || 'Autor no disponible'}
                        </p>

                        {/* Detalles adicionales */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ padding: '12px', background: '#faf8f6', borderRadius: '8px', border: '1px solid #e0dbd4' }}>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 4px 0' }}>Precio</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#8b0000', margin: 0 }}>
                              ${Number(libro.precio_libro || libro.precio || 0).toLocaleString('es-CO')}
                            </p>
                          </div>
                          <div style={{ padding: '12px', background: '#faf8f6', borderRadius: '8px', border: '1px solid #e0dbd4' }}>
                            <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 4px 0' }}>Stock</p>
                            <p style={{ 
                              fontSize: '1rem', 
                              fontWeight: '600', 
                              color: libro.stock > 0 ? '#4caf50' : '#e53935', 
                              margin: 0 
                            }}>
                              {libro.stock > 0 ? `${libro.stock} disponibles` : 'Agotado'}
                            </p>
                          </div>
                          {libro.nombre_tienda && (
                            <div style={{ padding: '12px', background: '#faf8f6', borderRadius: '8px', border: '1px solid #e0dbd4' }}>
                              <p style={{ fontSize: '0.75rem', color: '#999', margin: '0 0 4px 0' }}>Tienda</p>
                              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>
                                {libro.nombre_tienda}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Descripción */}
                        <div style={{ marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 8px 0', color: '#2c2c2c' }}>
                            Descripción
                          </h3>
                          <p style={{
                            fontSize: '0.9rem',
                            color: '#555',
                            lineHeight: '1.6',
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {libro.descripcion_libro || 'Este libro es una excelente adición a tu colección. Escrito por un autor reconocido, ofrece una narrativa cautivadora que te mantendrá enganchado desde la primera página hasta la última.'}
                          </p>
                        </div>

                        {/* Botones */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setActiveSide('Catálogo')}
                            className="btn btn-vinotinto"
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              padding: '12px 24px',
                              fontSize: '0.95rem',
                              fontWeight: '600'
                            }}
                          >
                            Ver en catálogo
                          </button>
                          <button
                            onClick={() => handleEliminarFavorito(libro.id_libro)}
                            style={{
                              minWidth: '140px',
                              background: 'white',
                              color: '#e53935',
                              border: '2px solid #e53935',
                              padding: '12px 24px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Quitar de favoritos
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}

        {/* ── MI PERFIL ── */}
        {activeSide === "Mi Perfil" && (
          <>
            <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconUser width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                <h2 style={{ margin: 0 }}>Mi Perfil</h2>
              </div>
            </div>

            {/* Estadísticas de Compras */}
            <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconChartBar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                Estadísticas de Compras
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div style={{ background: "#faf8f6", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e0dbd4" }}>
                  <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>Total Gastado</p>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
                    ${estadisticas?.total_gastado?.toLocaleString('es-CO') || '0'} COP
                  </p>
                </div>
                <div style={{ background: "#faf8f6", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e0dbd4" }}>
                  <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>Número de Compras</p>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--vinotinto)" }}>
                    {estadisticas?.num_compras || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Categorías Favoritas */}
            <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconBookOpen width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                Categorías Favoritas
              </h3>
              <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>Basado en tu historial de compras</p>
              {categoriasFavoritas.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                  {categoriasFavoritas.map((cat, index) => (
                    <div key={index} style={{ background: "#faf8f6", padding: "1rem", borderRadius: "8px", border: "1px solid #e0dbd4", textAlign: "center" }}>
                      <span style={{ fontSize: "1.5rem", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                      </span>
                      <p style={{ margin: "0.5rem 0 0 0", fontWeight: 600 }}>{cat.nombre}</p>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>{cat.conteo} compra{cat.conteo > 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                  <p>Aún no tienes categorías favoritas. Compra libros para ver tus preferencias aquí.</p>
                </div>
              )}
            </div>

            {/* Nivel de Fidelización */}
            <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconStar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                Nivel de Fidelización
              </h3>
              <div style={{ background: "linear-gradient(135deg, #faf8f6 0%, #f5f0eb 100%)", border: "1px solid #e0dbd4", borderRadius: "12px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div style={{ padding: "0.5rem 1.2rem", borderRadius: "20px", fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", background: "linear-gradient(135deg, #cd7f32 0%, #b87333 100%)", color: "white", boxShadow: "0 4px 12px rgba(205, 127, 50, 0.3)" }}>
                    {nivelFidelizacion?.nivel || 'Bronce'}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "var(--vinotinto)" }}>{nivelFidelizacion?.puntos || 0} puntos</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>Puntos acumulados</p>
                  </div>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>
                    {nivelFidelizacion?.puntos_para_siguiente > 0
                      ? `${nivelFidelizacion.puntos_para_siguiente} puntos para ${nivelFidelizacion.siguiente_nivel}`
                      : "5 puntos para Plata"}
                  </p>
                  <div style={{ height: "8px", background: "#e0dbd4", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg, var(--vinotinto) 0%, #9a2a4a 100%)", borderRadius: "4px", width: "0%" }} />
                  </div>
                </div>
                <div style={{ paddingTop: "1rem", borderTop: "1px solid #e0dbd4" }}>
                  <p style={{ fontSize: "0.85rem", color: "#666", margin: 0 }}>Sigue comprando para desbloquear beneficios exclusivos</p>
                </div>
              </div>
            </div>

            {/* Información Personal */}
            <div className="pl-card" style={{ padding: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>Información Personal</h3>
              
              {/* Foto de Perfil */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0dbd4' }}>
                <div style={{ flexShrink: 0 }}>
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Foto de perfil"
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #7A1E3A'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      background: '#e0dbd4', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '2rem',
                      color: '#7A1E3A',
                      fontWeight: 'bold',
                      border: '3px solid #7A1E3A'
                    }}>
                      {userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Foto de Perfil</h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
                    Sube una foto para personalizar tu perfil
                  </p>
                  <input 
                    type="file" 
                    id="foto-perfil-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleProfilePhotoChange}
                  />
                  <label 
                    htmlFor="foto-perfil-input"
                    style={{
                      background: 'var(--vinotinto)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    {photoUploading ? 'Subiendo...' : 'Cambiar Foto'}
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
                <div>
                  <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Nombre</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: "8px",
                      border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Correo electrónico</label>
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: "8px",
                      border: "1px solid #ddd", fontSize: "0.95rem", background: "#f5f5f5",
                      fontFamily: "Montserrat, sans-serif", color: "#888"
                    }}
                  />
                </div>

                <button
                  style={{
                    background: "var(--vinotinto)", color: "white", border: "none",
                    padding: "12px 24px", borderRadius: "8px", fontWeight: 700,
                    fontSize: "0.95rem", cursor: "pointer", marginTop: "8px",
                    fontFamily: "Montserrat, sans-serif"
                  }}
                  onClick={() => notify("Perfil actualizado", "success")}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── MIS DIRECCIONES ── */}
        {activeSide === "Mis Direcciones" && (
          <>
            {/* Dirección de envío */}
            <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconLocation width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                <h2 style={{ margin: 0 }}>Mis Direcciones de Envío</h2>
              </div>
            </div>

            <div className="pl-card" style={{ padding: "2rem" }}>
              {mostrarModalDireccion && (
                <LeafletAddressPickerModal
                  isOpen={mostrarModalDireccion}
                  onClose={() => setMostrarModalDireccion(false)}
                  onSelect={handleAddressSelected}
                />
              )}

              {mostrarFormDireccion ? (
                <div style={{ marginTop: "8px" }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "#444", fontSize: "1rem" }}>{direccionEditingId ? 'Editar dirección' : 'Agregar nueva dirección'}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
                    <div>
                      <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Alias</label>
                      <input
                        type="text"
                        value={direccionForm.alias_direccion}
                        onChange={(e) => setDireccionForm({ ...direccionForm, alias_direccion: e.target.value })}
                        placeholder="Ej. Casa, Oficina"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Dirección</label>
                      <input
                        type="text"
                        value={direccionForm.direccion}
                        onChange={(e) => setDireccionForm({ ...direccionForm, direccion: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Ciudad</label>
                      <input
                        type="text"
                        value={direccionForm.ciudad}
                        onChange={(e) => setDireccionForm({ ...direccionForm, ciudad: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Departamento</label>
                      <input
                        type="text"
                        value={direccionForm.departamento}
                        onChange={(e) => setDireccionForm({ ...direccionForm, departamento: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Código postal</label>
                      <input
                        type="text"
                        value={direccionForm.codigo_postal}
                        onChange={(e) => setDireccionForm({ ...direccionForm, codigo_postal: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        checked={direccionForm.es_principal}
                        onChange={(e) => setDireccionForm({ ...direccionForm, es_principal: e.target.checked })}
                      />
                      <label style={{ fontWeight: 600, color: "#444", margin: 0 }}>Marcar como dirección principal</label>
                    </div>
                    {direccionError ? <p style={{ color: '#b42318', margin: 0 }}>{direccionError}</p> : null}
                    <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                      <button
                        style={{ background: "var(--vinotinto)", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: direccionLoading ? 'not-allowed' : 'pointer', opacity: direccionLoading ? 0.7 : 1, fontFamily: "Montserrat, sans-serif" }}
                        onClick={handleSaveDireccion}
                        disabled={direccionLoading}
                      >
                        {direccionLoading ? 'Guardando...' : direccionEditingId ? 'Actualizar dirección' : 'Guardar dirección'}
                      </button>
                      <button
                        style={{ background: "none", border: "1.5px solid var(--vinotinto)", color: "var(--vinotinto)", borderRadius: "8px", padding: "12px 24px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                        onClick={() => {
                          setMostrarModalDireccion(true);
                          setDireccionError('');
                        }}
                      >
                        Elegir otra dirección
                      </button>
                      <button
                        style={{ background: "none", border: "1.5px solid var(--vinotinto)", color: "var(--vinotinto)", borderRadius: "8px", padding: "12px 24px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                        onClick={resetDireccionForm}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  style={{ background: "var(--vinotinto)", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", marginBottom: 20, fontFamily: "Montserrat, sans-serif" }}
                  onClick={openNewDireccionForm}
                >
                  + Agregar dirección
                </button>
              )}

              {direcciones.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", background: "#faf8f6", borderRadius: "8px", border: "1px solid #e0dbd4" }}>
                  <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>No tienes direcciones guardadas</p>
                  <p style={{ fontSize: "0.85rem", color: "#888", margin: 0 }}>Agrega una dirección para envíos más rápidos</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {direcciones.map((dir) => (
                    <div key={dir.id_direccion} className="pl-card" style={{ padding: "1.5rem", border: dir.es_principal ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <div>
                          {dir.es_principal && (
                            <span style={{ background: "var(--vinotinto)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, display: "inline-block", marginBottom: "8px" }}>
                              Principal
                            </span>
                          )}
                          {dir.alias_direccion ? <p style={{ margin: "4px 0", fontWeight: 700 }}>{dir.alias_direccion}</p> : null}
                          <p style={{ margin: "4px 0", fontWeight: 600 }}>{dir.direccion}</p>
                          <p style={{ margin: "2px 0", color: "#666" }}>
                            {[
                              dir.ciudad && dir.ciudad !== dir.direccion ? dir.ciudad : null,
                              dir.departamento && dir.departamento !== dir.direccion ? dir.departamento : null,
                            ].filter(Boolean).join(', ')}
                          </p>
                          {dir.codigo_postal && <p style={{ margin: "2px 0", color: "#888", fontSize: "0.85rem" }}>CP: {dir.codigo_postal}</p>}
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {!dir.es_principal && (
                            <button
                              style={{ background: "var(--vinotinto)", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                              onClick={() => handleSetPrincipalDireccion(dir.id_direccion)}
                            >
                              Hacer principal
                            </button>
                          )}
                          <button
                            style={{ background: "#8b5a2b", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                            onClick={() => openEditDireccionForm(dir)}
                          >
                            Editar
                          </button>
                          <button
                            style={{ background: "#dc2626", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}
                            onClick={() => handleDeleteDireccion(dir.id_direccion)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CONFIGURACIÓN ── */}
        {activeSide === "Configuración" && (
          <>
            <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconSettings width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                <h2 style={{ margin: 0 }}>Configuración de Cuenta</h2>
              </div>
            </div>

            {/* Preferencias de Notificaciones */}
            <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>Preferencias de Notificaciones</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: "#faf8f6", borderRadius: "8px", borderLeft: "4px solid var(--vinotinto)" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 0.3rem 0", color: "#2a2a2a", fontSize: "1rem" }}>Promociones y Ofertas</h4>
                    <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>Recibe notificaciones sobre descuentos especiales y promociones</p>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px", flexShrink: 0 }}>
                    <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--vinotinto)", transition: "0.3s", borderRadius: "26px" }}></span>
                    <span style={{ position: "absolute", content: "", height: "20px", width: "20px", left: "3px", bottom: "3px", backgroundColor: "white", transition: "0.3s", borderRadius: "50%", transform: "translateX(24px)" }}></span>
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: "#faf8f6", borderRadius: "8px", borderLeft: "4px solid var(--vinotinto)" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 0.3rem 0", color: "#2a2a2a", fontSize: "1rem" }}>Actualizaciones de Pedidos</h4>
                    <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>Notificaciones sobre el estado de tus compras y envíos</p>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px", flexShrink: 0 }}>
                    <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--vinotinto)", transition: "0.3s", borderRadius: "26px" }}></span>
                    <span style={{ position: "absolute", content: "", height: "20px", width: "20px", left: "3px", bottom: "3px", backgroundColor: "white", transition: "0.3s", borderRadius: "50%", transform: "translateX(24px)" }}></span>
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: "#faf8f6", borderRadius: "8px", borderLeft: "4px solid var(--vinotinto)" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 0.3rem 0", color: "#2a2a2a", fontSize: "1rem" }}>Novedades y Libros</h4>
                    <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>Recibe recomendaciones basadas en tus intereses</p>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px", flexShrink: 0 }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#ccc", transition: "0.3s", borderRadius: "26px" }}></span>
                    <span style={{ position: "absolute", content: "", height: "20px", width: "20px", left: "3px", bottom: "3px", backgroundColor: "white", transition: "0.3s", borderRadius: "50%" }}></span>
                  </label>
                </div>

                <button
                  style={{
                    background: "var(--vinotinto)", color: "white", border: "none",
                    padding: "12px 24px", borderRadius: "8px", fontWeight: 700,
                    fontSize: "0.95rem", cursor: "pointer", marginTop: "8px",
                    fontFamily: "Montserrat, sans-serif"
                  }}
                  onClick={() => notify("Preferencias guardadas", "success")}
                >
                  Guardar cambios
                </button>
              </div>
            </div>

            {/* Información de la Cuenta */}
            <div className="pl-card" style={{ padding: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>Información de la Cuenta</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "#faf8f6", borderRadius: "8px" }}>
                  <label style={{ fontWeight: 600, color: "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rol</label>
                  <p style={{ margin: 0, color: "#2a2a2a", fontSize: "1rem" }}>Usuario</p>
                </div>
                <div style={{ padding: "1rem", background: "#faf8f6", borderRadius: "8px" }}>
                  <label style={{ fontWeight: 600, color: "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Estado</label>
                  <p style={{ margin: 0, color: "#2a2a2a", fontSize: "1rem" }}>Activo</p>
                </div>
                <div style={{ padding: "1rem", background: "#faf8f6", borderRadius: "8px" }}>
                  <label style={{ fontWeight: 600, color: "var(--vinotinto)", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>ID de Usuario</label>
                  <p style={{ margin: 0, color: "#2a2a2a", fontSize: "1rem" }}>#{userId || 'N/A'}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── OTRAS SECCIONES ── */}
        {!["Inicio", "Catálogo", "Carrito", "Mis Compras", "Lista de Deseos", "Favoritos", "Mi Perfil", "Mis Direcciones", "Configuración", "Notificaciones", "Mensajes"].includes(activeSide) && (
          <div className="welcome-card">
            <h1>{activeSide}</h1>
            <p>Esta sección estará disponible próximamente.</p>
          </div>
        )}

        {/* ── MODAL BAUCHER DE COMPRA ── */}
        {mostrarBaucher && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 2000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px"
          }}>
            <div className="baucher-modal" style={{
              background: "var(--blanco)",
              maxWidth: "600px",
              width: "100%",
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxHeight: "90vh",
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}>
              {baucherLoading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid var(--vinotinto)",
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 20px"
                  }}></div>
                  <p style={{ color: "#666" }}>Cargando baucher...</p>
                </div>
              ) : ordenSeleccionada ? (
                <>
                  {/* Header del baucher */}
                  <div style={{
                    borderBottom: "2px solid #e0dbd4",
                    paddingBottom: "20px",
                    marginBottom: "20px",
                    textAlign: "center"
                  }}>
                    <div style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "50%",
                      background: "#fdf0f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 15px"
                    }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h2 style={{
                      fontWeight: 800,
                      color: "var(--vinotinto)",
                      margin: "0 0 8px",
                      fontSize: "1.6rem"
                    }}>
                      ¡Compra Exitosa!
                    </h2>
                    <p style={{ color: "#666", margin: 0, fontSize: "0.95rem" }}>
                      Gracias por tu compra en BookyHome
                    </p>
                  </div>

                  {/* Información de la orden */}
                  <div style={{
                    background: "#fcfaf7",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    border: "1px solid #e0dbd4"
                  }}>
                    <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666", fontSize: "0.9rem" }}>Número de Orden</span>
                        <span style={{ fontWeight: 700, color: "var(--gris-carbon)" }}>#{ordenSeleccionada.id_orden}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666", fontSize: "0.9rem" }}>Fecha</span>
                        <span style={{ fontWeight: 600, color: "var(--gris-carbon)" }}>
                          {ordenSeleccionada.fecha ? new Date(ordenSeleccionada.fecha).toLocaleDateString("es-CO", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666", fontSize: "0.9rem" }}>Método de Pago</span>
                        <span style={{ fontWeight: 600, color: "var(--gris-carbon)" }}>
                          {ordenSeleccionada.metodo_pago || "Tarjeta de Crédito"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666", fontSize: "0.9rem" }}>Estado</span>
                        <span style={{
                          fontWeight: 700,
                          color: "green",
                          background: "#e8f5e9",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "0.85rem"
                        }}>
                          {ordenSeleccionada.estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de productos */}
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{
                      fontWeight: 700,
                      color: "var(--gris-carbon)",
                      margin: "0 0 15px",
                      fontSize: "1.1rem"
                    }}>
                      Productos Comprados
                    </h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {ordenSeleccionada.items?.map((item) => (
                        <div key={item.id_libro} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          background: "#faf8f6",
                          borderRadius: "8px",
                          border: "1px solid #e0dbd4"
                        }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--gris-carbon)" }}>
                              {item.titulo}
                            </p>
                            <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                              {item.autor_libro} · Cantidad: {item.cantidad}
                            </p>
                          </div>
                          <span style={{
                            fontWeight: 700,
                            color: "var(--vinotinto)",
                            fontSize: "1rem"
                          }}>
                            {Number(item.precio_libro * item.cantidad).toLocaleString("es-CO", {
                              style: "currency",
                              currency: "COP",
                              maximumFractionDigits: 0
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{
                    borderTop: "2px solid #e0dbd4",
                    paddingTop: "20px",
                    marginTop: "20px",
                    display: "grid",
                    gap: "10px"
                  }}>
                    {/* Subtotal */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                      <span style={{ color: "#666" }}>Subtotal</span>
                      <span style={{ fontWeight: 600 }}>
                        {Number(ordenSeleccionada.total).toLocaleString("es-CO", {
                          style: "currency", currency: "COP", maximumFractionDigits: 0
                        })}
                      </span>
                    </div>

                    {/* Descuento aplicado */}
                    {ordenSeleccionada.cupon_aplicado && ordenSeleccionada.total_con_descuento != null && (
                      <div style={{
                        display: "flex", justifyContent: "space-between", fontSize: "0.95rem",
                        background: "#f0faf0", padding: "8px 12px", borderRadius: "8px",
                        border: "1px solid #c8e6c9"
                      }}>
                        <span style={{ color: "#2e7d32", display: "flex", alignItems: "center", gap: "6px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 5v2"/><path d="M15 11v2"/><path d="M15 17v2"/>
                            <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/>
                          </svg>
                          Cupón <strong>{ordenSeleccionada.cupon_aplicado}</strong>
                        </span>
                        <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                          -{Number(ordenSeleccionada.total - ordenSeleccionada.total_con_descuento).toLocaleString("es-CO", {
                            style: "currency", currency: "COP", maximumFractionDigits: 0
                          })}
                        </span>
                      </div>
                    )}

                    {/* Total final pagado */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: "1.3rem", fontWeight: 800
                    }}>
                      <span style={{ color: "var(--gris-carbon)" }}>Total Pagado</span>
                      <span style={{ color: "var(--rojo-suave)", fontSize: "1.5rem" }}>
                        {Number(
                          ordenSeleccionada.total_con_descuento ?? ordenSeleccionada.total
                        ).toLocaleString("es-CO", {
                          style: "currency", currency: "COP", maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "30px"
                  }}>
                    <button
                      onClick={handleCerrarBaucher}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "8px",
                        border: "2px solid var(--vinotinto)",
                        background: "var(--blanco)",
                        color: "var(--vinotinto)",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => { e.target.style.background = "#f5eaed"; }}
                      onMouseLeave={(e) => { e.target.style.background = "var(--blanco)"; }}
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "8px",
                        border: "none",
                        background: "var(--vinotinto)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                      </svg>
                      Imprimir
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        <style>{`
          .baucher-modal::-webkit-scrollbar {
            display: none;
          }
          .baucher-modal {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {ordenACancelar && (
          <ModalCancelarOrden
            orden={ordenACancelar}
            onClose={() => setOrdenACancelar(null)}
            onCancelado={(id) => {
              setOrdenes(ordenes.filter(o => o.id_orden !== id));
              setOrdenACancelar(null);
              notify("Orden cancelada exitosamente", "success");
            }}
          />
        )}

      </main>
    </div>
  );
}