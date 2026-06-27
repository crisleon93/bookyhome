import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getUsuarios, getCarrito, checkoutCarrito, getOrdenes, addToCart } from "../services/api";
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
    <button className="btn btn-vinotinto" onClick={onGoToCatalog} style={{ display: "inline-block", width: "auto" }}>
      📚 Ir al catálogo
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
      getCarrito()
        .then((res) => setCarrito(res.data))
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
          navigate(`/checkout/${res.data.order.id_orden}`);
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
                      onClick={() => navigate(`/catalogo/${libro.id_libro}`)}>
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
            ) : carrito.length === 0 ? (
              <div className="pl-card" style={{ padding: "40px" }}>
                <CartEmptyState onGoToCatalog={handleGoToCatalog} />
              </div>
            ) : (
              /* Cuadrícula organizada con las tarjetas visuales estilizadas del compañero */
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                {carrito.map((item) => (
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

                {/* Bloque de Cierre de Caja y Botones de Acción */}
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
              return favoritos.length === 0 ? (
                <div className="empty-state">
                  <p>No tienes libros en favoritos. ¡Agrega algunos desde el catálogo!</p>
                  <button className="btn btn-vinotinto btn-catalog" onClick={handleGoToCatalog} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <IconBooks width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                    Ir al catálogo
                  </button>
                </div>
              ) : (
                <div className="pl-card">
                  {favoritos.map((libro) => (
                    <div key={libro.id_libro} className="pl-order-row">
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