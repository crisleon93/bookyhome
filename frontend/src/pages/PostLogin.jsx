import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getUsuarios, getCarrito, checkoutCarrito, getOrdenes, addToCart, getOrden, postPayment, sendConfirmationEmail, cancelOrder } from "../services/api";
import CompradorSidebar from "../components/CompradorSidebar";
import FiltrosCatalogo from "../components/FiltrosCatalogo";
import LibroCard from "../components/LibroCard";
import { getUserRole } from "../hooks/useAuth";
import { notify } from "../components/ToastProvider";
import {
  IconChartBar,
  IconBooks,
  IconBook,
  IconStar,
  IconSettings,
  IconFavorites,
  IconLocation,
  IconCart,
  IconPackage,
  IconUser,
  IconCheck,
  IconLock
} from "../components/Icons";

import Catalogo from './Catalogo';
import Chat from './Chat';
import Notificaciones from './Notificaciones';

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
    <button className="btn btn-vinotinto" onClick={onGoToCatalog} style={{ display: "inline-block", width: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      Ir al catálogo
    </button>
  </div>
);

export default function PostLogin() {
  // ========================
  // Estado local
  // ========================
  const [userName, setUserName]     = useState("");
  const [userEmail, setUserEmail]   = useState("");
  const [userId, setUserId]         = useState(null);
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

  const [estadisticas, setEstadisticas] = useState(null);
  const [categoriasFavoritas, setCategoriasFavoritas] = useState([]);
  const [nivelFidelizacion, setNivelFidelizacion] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [direccionForm, setDireccionForm] = useState({
    direccion: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    es_principal: false
  });
  const [guardando, setGuardando] = useState(false);

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

  // Estado del catálogo
  const [libros, setLibros] = useState([]);
  const [catalogoLoading, setCatalogoLoading] = useState(true);
  const [catalogoPagina, setCatalogoPagina] = useState(1);
  const [catalogoTotalPaginas, setCatalogoTotalPaginas] = useState(1);
  const [catalogoAddingId, setCatalogoAddingId] = useState(null);
  const [catalogoFiltros, setCatalogoFiltros] = useState({
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
    if (seccion) setActiveSide(seccion);
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

  const cargarDatosPerfil = async () => {
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

      // Cargar direcciones (simulado)
      setDirecciones([]);
    } catch (error) {
      console.error('Error cargando datos del perfil:', error);
    }
  };

  useEffect(() => {
    if (activeSide === "Mi Perfil" || activeSide === "Direcciones") {
      cargarDatosPerfil();
    }
  }, [activeSide, userId]);

  // Cargar catálogo cuando se selecciona esa sección
  useEffect(() => {
    if (activeSide === "Catálogo") {
      cargarCatalogo();
    }
  }, [activeSide, catalogoFiltros, catalogoPagina]);

  const cargarCatalogo = async () => {
    setCatalogoLoading(true);
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

      const response = await api.get(`/catalogo/busqueda-avanzada?${params}`);
      setLibros(response.data.libros || []);
      setCatalogoTotalPaginas(response.data.total_paginas || 1);
      setCatalogoPagina(response.data.pagina || 1);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
      notify('Error al cargar el catálogo', 'error');
    } finally {
      setCatalogoLoading(false);
    }
  };

  const handleCatalogoFiltrosChange = (nuevosFiltros) => {
    setCatalogoFiltros(nuevosFiltros);
    setCatalogoPagina(1);
  };

  const handleCatalogoAddToCart = async (libro) => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('Debes iniciar sesión para agregar al carrito', 'error');
      return;
    }
    setCatalogoAddingId(libro.id_libro);
    try {
      await addToCart({
        id_libro: libro.id_libro,
        cantidad: 1,
        titulo: libro.titulo,
        autor_libro: libro.autor_libro,
        precio_libro: libro.precio_libro,
        imagen: libro.imagen_url || null,
      });
      notify(`"${libro.titulo}" agregado al carrito ✓`, 'success');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo agregar al carrito';
      notify(msg, 'error');
    } finally {
      setCatalogoAddingId(null);
    }
  };

  // ========================
  // Manejadores de acciones
  // ========================
  const handleCheckout = () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
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

  const processPaymentApi = async (method) => {
    setPaymentProcessing(true);
    setCheckoutError("");

    try {
      const payload = {
        order_id: parseInt(orderId),
        amount: parseFloat(order.total),
        payment_method: method
      };

      const res = await postPayment(payload);
      if (res.data && res.data.ok) {
        try {
          await sendConfirmationEmail(orderId);
        } catch (emailErr) {
          console.warn("Correo no enviado:", emailErr);
        }
        // Recargar órdenes para actualizar el estado
        getOrdenes()
          .then((res) => setOrdenes(res.data))
          .catch((err) => console.error(err));
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

  const handleSelectSection = (seccion) => {
    setActiveSide(seccion);
    navigate(`/post-login?seccion=${encodeURIComponent(seccion)}`, { replace: true });
  };

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
            {(() => {
              const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
              const categoriasVistas = [...new Set(favoritos.map(f => f.nombre_categoria).filter(Boolean))];

              if (favoritos.length === 0) {
                return (
                  <div className="empty-state">
                    <p>Agrega libros a favoritos para recibir recomendaciones personalizadas</p>
                    <button className="btn btn-vinotinto btn-catalog" onClick={() => setActiveSide('Catálogo')} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <IconBooks width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                      Explorar catálogo
                    </button>
                  </div>
                );
              }

              return (
                <div className="pl-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <IconStar width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                    <div>
                      <h2 style={{ margin: 0 }}>Recomendados para ti</h2>
                      <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
                        Basado en tus categorías favoritas: {categoriasVistas.join(', ')}
                      </p>
                    </div>
                  </div>

                  {favoritos.slice(0, 5).map((libro) => (
                    <div key={libro.id_libro} className="pl-order-row" style={{ cursor: 'pointer' }}
                      onClick={() => setActiveSide('Catálogo')}>
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
                          Favorito
                        </span>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <button className="btn btn-vinotinto btn-catalog" onClick={() => setActiveSide('Catálogo')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <IconBooks width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                      Ver más libros
                    </button>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ── CATÁLOGO EN DASHBOARD (sin salto de página) ── */}
        {activeSide === "Catálogo" && (
          <Catalogo />
        )}

        {/* ── MENSAJES EN DASHBOARD (sin salto de página) ── */}
        {activeSide === "Mensajes" && (
          <Chat />
        )}

        {/* ── NOTIFICACIONES EN DASHBOARD (sin salto de página) ── */}
        {activeSide === "Notificaciones" && (
          <Notificaciones />
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
                          <div style={{ borderTop: "1px solid #e0dbd4", paddingTop: "12px", marginTop: "4px", display: "grid", gap: "6px", fontSize: "0.9rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#666" }}>ID Orden</span>
                              <span style={{ fontWeight: 600 }}>#{order.id_orden}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0dbd4", paddingTop: "10px", marginTop: "4px" }}>
                              <span style={{ fontWeight: 700 }}>Total pagado</span>
                              <span style={{ fontWeight: 800, color: "var(--rojo-suave)", fontSize: "1.05rem" }}>
                                {Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
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

                          <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
                            <button
                              onClick={() => setPaymentMethod("tarjeta")}
                              style={{
                                flex: 1,
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
                                transition: "var(--transition)"
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                              </svg>
                              Tarjeta Crédito/Débito
                            </button>

                            <button
                              onClick={() => setPaymentMethod("paypal")}
                              style={{
                                flex: 1,
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
                                transition: "var(--transition)"
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2H7.5a2.5 2.5 0 0 0-2.5 2.5v13a1.5 1.5 0 0 0 1.5 1.5h3.5a1.5 1.5 0 0 0 1.5-1.5v-3.5h2.5a4.5 4.5 0 0 0 4.5-4.5V6.5A4.5 4.5 0 0 0 12 2z"></path>
                              </svg>
                              PayPal
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
                          ) : (
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
                          )}
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
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, marginTop: "10px", borderTop: "1px solid #e0dbd4", paddingTop: "15px" }}>
                              <span>Total</span>
                              <span style={{ color: "var(--rojo-suave)" }}>
                                {Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
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
                {carrito.length > 0 ? (
                  carrito.map((item) => (
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
                ))
                ) : (
                  /* Show pending orders when cart is empty */
                  ordenes.filter(o => o.estado === 'pendiente').map((orden) => (
                    <div
                      key={orden.id_orden}
                      style={{
                        background: "#fff5f7",
                        border: "2px solid var(--vinotinto)",
                        borderRadius: "8px",
                        padding: "20px",
                        boxShadow: "var(--sombra-suave)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 5px 0", fontWeight: 700, color: "var(--vinotinto)" }}>Orden #{orden.id_orden}</h3>
                          <p style={{ margin: "0", color: "#666", fontSize: "0.9rem" }}>
                            {orden.fecha ? new Date(orden.fecha).toLocaleDateString("es-CO") : ""}
                          </p>
                        </div>
                        <span style={{
                          background: "var(--vinotinto)",
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: 700
                        }}>
                          Pendiente de pago
                        </span>
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        {orden.items?.map((item) => (
                          <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e0dbd4" }}>
                            <span>{item.titulo} x{item.cantidad}</span>
                            <span style={{ fontWeight: 600 }}>
                              {Number(item.precio_libro * item.cantidad).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => {
                            setOrderId(orden.id_orden);
                            setOrder(orden);
                            setMostrarCheckout(true);
                          }}
                          className="btn btn-vinotinto"
                          style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        >
                          Continuar con el pago
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('¿Estás seguro de que deseas cancelar esta orden?')) {
                              try {
                                await cancelOrder(orden.id_orden);
                                setOrdenes(ordenes.filter(o => o.id_orden !== orden.id_orden));
                                notify('Orden cancelada exitosamente', 'success');
                              } catch (err) {
                                const msg = err.response?.data?.detail || 'No se pudo cancelar la orden';
                                notify(msg, 'error');
                              }
                            }
                          }}
                          style={{
                            background: "none",
                            border: "1.5px solid #e53935",
                            color: "#e53935",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer"
                          }}
                        >
                          Cancelar orden
                        </button>
                      </div>
                    </div>
                  ))
                )}

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
                    <IconBooks width={18} height={18} strokeWidth={2} style={{ color: '#7A1E3A' }} />
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
                    <div className="pl-order-right">
                      <span className="pl-order-price">
                        {Number(orden.total || 0).toLocaleString("es-CO", {
                          style: "currency", currency: "COP", maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
                    <IconBooks width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
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
                <IconBooks width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
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
                    Cambiar Foto
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

        {/* ── DIRECCIONES ── */}
        {activeSide === "Direcciones" && (
          <>
            <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconLocation width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                <h2 style={{ margin: 0 }}>Direcciones de Envío</h2>
              </div>
            </div>

            {mostrarFormDireccion ? (
              <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "var(--vinotinto)", fontSize: "1.2rem" }}>Agregar Nueva Dirección</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
                  <div>
                    <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Dirección</label>
                    <input
                      type="text"
                      value={direccionForm.direccion}
                      onChange={(e) => setDireccionForm({...direccionForm, direccion: e.target.value})}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "8px",
                        border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Ciudad</label>
                    <input
                      type="text"
                      value={direccionForm.ciudad}
                      onChange={(e) => setDireccionForm({...direccionForm, ciudad: e.target.value})}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "8px",
                        border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Departamento</label>
                    <input
                      type="text"
                      value={direccionForm.departamento}
                      onChange={(e) => setDireccionForm({...direccionForm, departamento: e.target.value})}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "8px",
                        border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Código Postal</label>
                    <input
                      type="text"
                      value={direccionForm.codigo_postal}
                      onChange={(e) => setDireccionForm({...direccionForm, codigo_postal: e.target.value})}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "8px",
                        border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      checked={direccionForm.es_principal}
                      onChange={(e) => setDireccionForm({...direccionForm, es_principal: e.target.checked})}
                    />
                    <label style={{ fontWeight: 600, color: "#444", margin: 0 }}>Marcar como dirección principal</label>
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                    <button
                      style={{
                        background: "var(--vinotinto)", color: "white", border: "none",
                        padding: "12px 24px", borderRadius: "8px", fontWeight: 700,
                        fontSize: "0.95rem", cursor: "pointer",
                        fontFamily: "Montserrat, sans-serif"
                      }}
                      onClick={() => {
                        notify("Dirección agregada (simulado)", "success");
                        setMostrarFormDireccion(false);
                        setDireccionForm({ direccion: '', ciudad: '', departamento: '', codigo_postal: '', es_principal: false });
                      }}
                    >
                      Guardar Dirección
                    </button>
                    <button
                      style={{
                        background: "none", border: "1.5px solid var(--vinotinto)",
                        color: "var(--vinotinto)", borderRadius: "8px", padding: "12px 24px",
                        fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                        fontFamily: "Montserrat, sans-serif"
                      }}
                      onClick={() => {
                        setMostrarFormDireccion(false);
                        setDireccionForm({ direccion: '', ciudad: '', departamento: '', codigo_postal: '', es_principal: false });
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                style={{
                  background: "var(--vinotinto)", color: "white", border: "none",
                  padding: "12px 24px", borderRadius: "8px", fontWeight: 700,
                  fontSize: "0.95rem", cursor: "pointer", marginBottom: 20,
                  fontFamily: "Montserrat, sans-serif"
                }}
                onClick={() => setMostrarFormDireccion(true)}
              >
                + Agregar Nueva Dirección
              </button>
            )}

            {direcciones.length === 0 ? (
              <div className="pl-card" style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>No tienes direcciones guardadas</p>
                <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "12px" }}>Agrega una dirección para envíos más rápidos</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {direcciones.map((dir) => (
                  <div key={dir.id_direccion} className="pl-card" style={{ padding: "1.5rem", border: dir.es_principal ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        {dir.es_principal && <span style={{ background: "var(--vinotinto)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, display: "inline-block", marginBottom: "8px" }}>Principal</span>}
                        <p style={{ margin: "4px 0", fontWeight: 600 }}>{dir.direccion}</p>
                        <p style={{ margin: "2px 0", color: "#666" }}>{dir.ciudad}{dir.departamento ? `, ${dir.departamento}` : ''}</p>
                        {dir.codigo_postal && <p style={{ margin: "2px 0", color: "#888", fontSize: "0.85rem" }}>CP: {dir.codigo_postal}</p>}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {!dir.es_principal && (
                          <button
                            style={{
                              background: "var(--vinotinto)", color: "white", border: "none",
                              padding: "8px 16px", borderRadius: "6px", fontWeight: 600,
                              fontSize: "0.85rem", cursor: "pointer",
                              fontFamily: "Montserrat, sans-serif"
                            }}
                            onClick={() => notify("Dirección principal actualizada (simulado)", "success")}
                          >
                            Hacer Principal
                          </button>
                        )}
                        <button
                          style={{
                            background: "#dc2626", color: "white", border: "none",
                            padding: "8px 16px", borderRadius: "6px", fontWeight: 600,
                            fontSize: "0.85rem", cursor: "pointer",
                            fontFamily: "Montserrat, sans-serif"
                          }}
                          onClick={() => notify("Dirección eliminada (simulado)", "success")}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        {!["Inicio", "Catálogo", "Carrito", "Mis Compras", "Favoritos", "Mi Perfil", "Direcciones", "Configuración"].includes(activeSide) && (
          <div className="welcome-card">
            <h1>{activeSide}</h1>
            <p>Esta sección estará disponible próximamente.</p>
          </div>
        )}

      </main>
    </div>
  );
}