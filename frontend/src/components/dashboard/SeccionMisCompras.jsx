import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IconPackage, IconCheck, IconLock } from "../Icons";
import { getDevoluciones, getOrdenes, getOrden, sendConfirmationEmail } from "../../services/api";
import { notify } from "../ToastProvider";

export default function SeccionMisCompras({ userId }) {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [ordenesLoading, setOrdenesLoading] = useState(false);

  // Filtros y Búsqueda
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('recientes');

  // Baucher states
  const [mostrarBaucher, setMostrarBaucher] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [baucherLoading, setBaucherLoading] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const cargarOrdenes = useCallback(async () => {
    if (!userId) return;
    setOrdenesLoading(true);
    try {
      const [ordenesRes, devolucionesRes] = await Promise.all([getOrdenes(), getDevoluciones()]);
      setOrdenes(ordenesRes.data || []);
      setDevoluciones(devolucionesRes.data || []);
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setOrdenesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);

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

  const handleEnviarEmail = async () => {
    if (!ordenSeleccionada) return;
    setEnviandoEmail(true);
    try {
      await sendConfirmationEmail(ordenSeleccionada.id_orden);
      notify('Comprobante de compra enviado al correo', 'success');
    } catch {
      notify('No se pudo enviar el comprobante al correo', 'error');
    } finally {
      setEnviandoEmail(false);
    }
  };

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      maximumFractionDigits: 0
    });

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      style: "currency", currency: "COP", maximumFractionDigits: 0
    });

  const obtenerEstadoVisible = (orden) => {
    const devolucion = devoluciones.find((item) => Number(item.id_orden) === Number(orden.id_orden));
    const estadoDevolucion = String(devolucion?.estado_devolucion || '').toLowerCase();
    const devolucionCompletada = ['completada', 'resuelta', 'reembolsada', 'devuelta'].includes(estadoDevolucion);
    if (devolucionCompletada) {
      return { pago: 'Reembolsado', entrega: 'Devolución', pagoClase: 'devolucion', entregaClase: 'devolucion', completada: false };
    }

    const estado = String(orden.estado || orden.estado_orden || '').toLowerCase();
    const estadoEnvio = String(orden.envio?.estado_envio || '').toLowerCase();

    if (estado.includes('cancelad') || estadoEnvio.includes('cancelad')) {
      return { pago: 'Cancelada', entrega: null, pagoClase: 'cancelado', entregaClase: null, completada: false, esCancelada: true };
    }

    const entregada = estado.includes('entregad') || estadoEnvio.includes('entregad');
    const enCamino = estado.includes('enviad') || estadoEnvio.includes('transito') || estadoEnvio.includes('camino');

    if (entregada) return { pago: 'Pagado', entrega: 'Entregado', pagoClase: 'entregado', entregaClase: 'entregado', completada: true };
    if (enCamino) return { pago: 'Pagado', entrega: 'En camino', pagoClase: 'entregado', entregaClase: 'camino', completada: false };
    if (estado === 'pagado') return { pago: 'Pagado', entrega: 'Preparando envío', pagoClase: 'entregado', entregaClase: 'procesando', completada: false };
    return { pago: 'Pendiente de pago', entrega: null, pagoClase: 'procesando', entregaClase: 'procesando', completada: false };
  };

  // Contadores para métricas y tabs de filtro
  const totalCompras = ordenes.length;
  const totalEntregadas = ordenes.filter(o => {
    const est = obtenerEstadoVisible(o);
    return est.completada || est.entrega === 'Entregado';
  }).length;
  const totalEnCamino = ordenes.filter(o => {
    const est = obtenerEstadoVisible(o);
    return ['En camino', 'Preparando envío'].includes(est.entrega);
  }).length;
  const totalPendientes = ordenes.filter(o => {
    const est = obtenerEstadoVisible(o);
    return est.pago === 'Pendiente de pago';
  }).length;
  const totalCanceladas = ordenes.filter(o => {
    const est = obtenerEstadoVisible(o);
    return est.esCancelada || est.pago === 'Cancelada';
  }).length;

  // Filtrado y Ordenamiento
  const ordenesFiltradas = ordenes
    .filter((orden) => {
      const estadoVisible = obtenerEstadoVisible(orden);

      // Filtro de Estado
      if (filtroEstado === 'entregado' && !(estadoVisible.completada || estadoVisible.entrega === 'Entregado')) {
        return false;
      }
      if (filtroEstado === 'camino' && !['En camino', 'Preparando envío'].includes(estadoVisible.entrega)) {
        return false;
      }
      if (filtroEstado === 'pendiente' && estadoVisible.pago !== 'Pendiente de pago') {
        return false;
      }
      if (filtroEstado === 'cancelado' && !(estadoVisible.esCancelada || estadoVisible.pago === 'Cancelada')) {
        return false;
      }

      // Buscador
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const qClean = q.replace(/^#/, '');
        const idMatch = String(orden.id_orden).includes(qClean);
        const fechaMatch = orden.fecha && new Date(orden.fecha).toLocaleDateString('es-CO').toLowerCase().includes(q);
        const itemsMatch = Array.isArray(orden.items) && orden.items.some(item =>
          (item.titulo || item.nombre_libro || '').toLowerCase().includes(q) ||
          (item.autor_libro || item.autor || '').toLowerCase().includes(q)
        );
        const estadoMatch =
          (estadoVisible.pago || '').toLowerCase().includes(q) ||
          (estadoVisible.entrega || '').toLowerCase().includes(q);

        return idMatch || fechaMatch || itemsMatch || estadoMatch;
      }

      return true;
    })
    .sort((a, b) => {
      if (ordenarPor === 'recientes') {
        return (new Date(b.fecha || 0) - new Date(a.fecha || 0)) || (Number(b.id_orden) - Number(a.id_orden));
      }
      if (ordenarPor === 'antiguas') {
        return (new Date(a.fecha || 0) - new Date(b.fecha || 0)) || (Number(a.id_orden) - Number(b.id_orden));
      }
      if (ordenarPor === 'mayor_precio') {
        return Number(b.total || 0) - Number(a.total || 0);
      }
      if (ordenarPor === 'menor_precio') {
        return Number(a.total || 0) - Number(b.total || 0);
      }
      return 0;
    });

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setBusqueda('');
    setOrdenarPor('recientes');
  };

  return (
    <>
      {/* ── HEADER CARD & METRICS ── */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "linear-gradient(135deg, #7A1E3A 0%, #9B2C4E 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(122,30,58,0.25)"
            }}>
              <IconPackage width={24} height={24} strokeWidth={2.2} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#1F2937" }}>Mis Compras</h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.86rem", color: "#6B7280" }}>
                Historial, estado de entrega y comprobantes de pago de tus pedidos
              </p>
            </div>
          </div>
          <span style={{
            background: "#FDF2F4",
            color: "#7A1E3A",
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: "0.85rem",
            fontWeight: 800,
            border: "1px solid #F8D2DA"
          }}>
            {totalCompras} {totalCompras === 1 ? 'Compra registrada' : 'Compras registradas'}
          </span>
        </div>

        {/* Mini KPIs de Resumen */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "12px",
          borderTop: "1px solid #F3F4F6",
          paddingTop: "16px"
        }}>
          {/* Total */}
          <div
            onClick={() => setFiltroEstado('todos')}
            style={{
              background: filtroEstado === 'todos' ? '#FDF2F4' : '#FAFAF9',
              border: `1.5px solid ${filtroEstado === 'todos' ? '#7A1E3A' : '#E5E7EB'}`,
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: "0.74rem", color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Total</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1F2937", marginTop: 2 }}>{totalCompras}</div>
          </div>

          {/* Entregadas */}
          <div
            onClick={() => setFiltroEstado('entregado')}
            style={{
              background: filtroEstado === 'entregado' ? '#ECFDF5' : '#FAFAF9',
              border: `1.5px solid ${filtroEstado === 'entregado' ? '#047857' : '#E5E7EB'}`,
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: "0.74rem", color: "#047857", fontWeight: 700, textTransform: "uppercase" }}>✓ Entregadas</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#047857", marginTop: 2 }}>{totalEntregadas}</div>
          </div>

          {/* En camino */}
          <div
            onClick={() => setFiltroEstado('camino')}
            style={{
              background: filtroEstado === 'camino' ? '#EFF6FF' : '#FAFAF9',
              border: `1.5px solid ${filtroEstado === 'camino' ? '#2563EB' : '#E5E7EB'}`,
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: "0.74rem", color: "#2563EB", fontWeight: 700, textTransform: "uppercase" }}>🚚 En camino</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563EB", marginTop: 2 }}>{totalEnCamino}</div>
          </div>

          {/* Pendientes */}
          <div
            onClick={() => setFiltroEstado('pendiente')}
            style={{
              background: filtroEstado === 'pendiente' ? '#FFFBEB' : '#FAFAF9',
              border: `1.5px solid ${filtroEstado === 'pendiente' ? '#D97706' : '#E5E7EB'}`,
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: "0.74rem", color: "#B45309", fontWeight: 700, textTransform: "uppercase" }}>⏱️ Por Pagar</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#B45309", marginTop: 2 }}>{totalPendientes}</div>
          </div>

          {/* Canceladas */}
          <div
            onClick={() => setFiltroEstado('cancelado')}
            style={{
              background: filtroEstado === 'cancelado' ? '#FEF2F2' : '#FAFAF9',
              border: `1.5px solid ${filtroEstado === 'cancelado' ? '#DC2626' : '#E5E7EB'}`,
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: "0.74rem", color: "#DC2626", fontWeight: 700, textTransform: "uppercase" }}>❌ Canceladas</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#DC2626", marginTop: 2 }}>{totalCanceladas}</div>
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="pl-card" style={{ padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          {/* Buscador */}
          <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por # orden, libro o fecha..."
              style={{
                width: "100%",
                padding: "10px 36px 10px 38px",
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                fontSize: "0.88rem",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "#FAFAF9",
                color: "#1F2937",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = '#7A1E3A'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
            {/* Icono Lupa */}
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", display: "flex", pointerEvents: "none" }}>
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            {/* Botón Borrar */}
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#9CA3AF",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  padding: 4
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de Ordenamiento */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.82rem", color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>Ordenar:</span>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                background: "#fff",
                fontSize: "0.84rem",
                fontWeight: 700,
                color: "#374151",
                outline: "none",
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              <option value="recientes">📅 Más recientes</option>
              <option value="antiguas">📅 Más antiguas</option>
              <option value="mayor_precio">💰 Mayor valor</option>
              <option value="menor_precio">💵 Menor valor</option>
            </select>
          </div>
        </div>

        {/* Tabs de Filtro de Estado con Chips */}
        <div style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginTop: "14px",
          paddingTop: "14px",
          borderTop: "1px solid #F3F4F6"
        }}>
          {[
            { id: 'todos', label: 'Todos', count: totalCompras, icon: null },
            { id: 'entregado', label: 'Entregadas', count: totalEntregadas, icon: '✓', color: '#047857', bg: '#ECFDF5' },
            { id: 'camino', label: 'En camino', count: totalEnCamino, icon: '🚚', color: '#2563EB', bg: '#EFF6FF' },
            { id: 'pendiente', label: 'Pendientes de pago', count: totalPendientes, icon: '⏱️', color: '#B45309', bg: '#FFFBEB' },
            { id: 'cancelado', label: 'Canceladas', count: totalCanceladas, icon: '❌', color: '#DC2626', bg: '#FEF2F2' },
          ].map((tab) => {
            const activo = filtroEstado === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFiltroEstado(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: activo ? "1.5px solid #7A1E3A" : "1.5px solid #E5E7EB",
                  background: activo ? "#7A1E3A" : "#FFFFFF",
                  color: activo ? "#FFFFFF" : "#4B5563",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: activo ? "0 2px 8px rgba(122,30,58,0.25)" : "none"
                }}
              >
                {tab.icon && <span>{tab.icon}</span>}
                <span>{tab.label}</span>
                <span style={{
                  padding: "1px 7px",
                  borderRadius: "10px",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  background: activo ? "rgba(255,255,255,0.28)" : "#F3F4F6",
                  color: activo ? "#FFFFFF" : "#6B7280"
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}

          {(filtroEstado !== 'todos' || busqueda.trim()) && (
            <button
              onClick={limpiarFiltros}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#7A1E3A",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
                padding: "6px 4px"
              }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* ── LISTA DE COMPRAS ── */}
      {ordenesLoading ? (
        <div className="empty-state"><p>Cargando tus compras...</p></div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="pl-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📦</div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1F2937" }}>
            No se encontraron compras
          </h3>
          <p style={{ margin: "6px 0 18px", fontSize: "0.88rem", color: "#6B7280" }}>
            {busqueda || filtroEstado !== 'todos'
              ? 'No hay órdenes que coincidan con los criterios de búsqueda o filtros seleccionados.'
              : 'Aún no has realizado ninguna compra en BookyHome.'}
          </p>
          {(busqueda || filtroEstado !== 'todos') && (
            <button
              onClick={limpiarFiltros}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                background: "#7A1E3A",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(122,30,58,0.25)"
              }}
            >
              Mostrar todas las compras
            </button>
          )}
        </div>
      ) : (
        <div className="pl-card">
          {ordenesFiltradas.map((orden) => (
            <div key={orden.id_orden} className="pl-order-row">
              {(() => {
                const estadoVisible = obtenerEstadoVisible(orden);
                return (
                  <>
                    <div className="pl-order-left">
                      <span className="pl-order-emoji">
                        {estadoVisible.completada ? (
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        ) : estadoVisible.esCancelada ? (
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        ) : estadoVisible.pago === "Pendiente de pago" ? (
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ) : (
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" />
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                          </svg>
                        )}
                      </span>
                      <div>
                        <p className="pl-order-title">Orden #{orden.id_orden}</p>
                        <div className="pl-order-meta">
                          <span className="pl-order-meta-fecha">
                            {orden.fecha ? new Date(orden.fecha).toLocaleDateString("es-CO") : ""}
                          </span>
                          <span className="pl-order-meta-divider">·</span>
                          <span className="pl-order-meta-items">
                            {orden.items?.length || 0} producto{orden.items?.length === 1 ? "" : "s"}
                          </span>
                          <span className="pl-order-meta-divider">·</span>
                          <div className="pl-order-meta-badges">
                            <span className={`pl-badge pl-badge--${estadoVisible.pagoClase}`}>
                              {estadoVisible.pago}
                            </span>
                            {estadoVisible.entrega && (
                              <span className={`pl-badge pl-badge--${estadoVisible.entregaClase}`}>
                                {estadoVisible.entrega}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pl-order-right">
                      <div className="pl-order-price">
                        <span className="pl-order-currency">$</span>
                        <span className="pl-order-amount">{formatNumber(orden.total)}</span>
                      </div>
                      <div className="pl-order-action">
                        {estadoVisible.pago === "Pendiente de pago" && (
                          <button
                            onClick={() => navigate('/?seccion=Carrito')}
                            className="btn btn-vinotinto"
                            style={{
                              padding: "6px 14px",
                              fontSize: "0.8rem",
                              borderRadius: "6px",
                              background: "var(--vinotinto)",
                              color: "white",
                              border: "none",
                              cursor: "pointer",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Pagar orden
                          </button>
                        )}
                        {estadoVisible.pago === "Pagado" && (
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
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL BAUCHER ── */}
      {mostrarBaucher && (
        <div
          className="baucher-print-overlay"
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)", zIndex: 2000,
            display: "flex", justifyContent: "center", alignItems: "center",
            padding: "20px"
          }}
          onClick={handleCerrarBaucher}
        >
          <div
            className="baucher-modal"
            style={{
              background: "var(--blanco, #fff)",
              maxWidth: "600px", width: "100%",
              borderRadius: "16px", padding: "40px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxHeight: "90vh", overflowY: "auto",
              scrollbarWidth: "none", msOverflowStyle: "none"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {baucherLoading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid #7A1E3A",
                  borderRadius: "50%", width: "50px", height: "50px",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 20px"
                }} />
                <p style={{ color: "#666" }}>Cargando baucher...</p>
              </div>
            ) : ordenSeleccionada ? (
              <>
                {/* Header */}
                <div style={{ borderBottom: "2px solid #e0dbd4", paddingBottom: "20px", marginBottom: "20px", textAlign: "center" }}>
                  <div style={{
                    width: "70px", height: "70px", borderRadius: "50%",
                    background: "#fdf0f2", display: "flex",
                    alignItems: "center", justifyContent: "center", margin: "0 auto 15px"
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h2 style={{ fontWeight: 800, color: "#7A1E3A", margin: "0 0 8px", fontSize: "1.6rem" }}>
                    ¡Compra Exitosa!
                  </h2>
                  <p style={{ color: "#666", margin: 0, fontSize: "0.95rem" }}>
                    Gracias por tu compra en BookyHome
                  </p>
                </div>

                {/* Info de la orden */}
                <div style={{ background: "#fcfaf7", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #e0dbd4" }}>
                  <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Número de Orden</span>
                      <span style={{ fontWeight: 700 }}>#{ordenSeleccionada.id_orden}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Fecha</span>
                      <span style={{ fontWeight: 600 }}>
                        {ordenSeleccionada.fecha
                          ? new Date(ordenSeleccionada.fecha).toLocaleDateString("es-CO", {
                              year: 'numeric', month: 'long', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })
                          : '—'}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Método de Pago</span>
                      <span style={{ fontWeight: 600 }}>
                        {ordenSeleccionada.metodo_pago || "Tarjeta de Crédito"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Estado</span>
                      <span style={{
                        fontWeight: 700, color: "green",
                        background: "#e8f5e9", padding: "4px 12px",
                        borderRadius: "20px", fontSize: "0.85rem"
                      }}>
                        {ordenSeleccionada.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontWeight: 700, color: "#2a2a2a", margin: "0 0 15px", fontSize: "1.1rem" }}>
                    Productos Comprados
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {ordenSeleccionada.items?.length > 0 ? (
                      ordenSeleccionada.items.map((item) => (
                        <div key={item.id_libro} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "12px", background: "#faf8f6",
                          borderRadius: "8px", border: "1px solid #e0dbd4"
                        }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{item.titulo}</p>
                            <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                              {item.autor_libro} · Cantidad: {item.cantidad}
                            </p>
                          </div>
                          <span style={{ fontWeight: 700, color: "#7A1E3A", fontSize: "1rem" }}>
                            {formatCurrency(item.precio_libro * item.cantidad)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#888", fontSize: "0.9rem" }}>No hay detalle de productos disponible.</p>
                    )}
                  </div>
                </div>

                {/* Totales */}
                <div style={{ borderTop: "2px solid #e0dbd4", paddingTop: "20px", marginTop: "20px", display: "grid", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                    <span style={{ color: "#666" }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(ordenSeleccionada.total)}</span>
                  </div>
                  {ordenSeleccionada.cupon_aplicado && ordenSeleccionada.total_con_descuento != null && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", fontSize: "0.95rem",
                      background: "#f0faf0", padding: "8px 12px", borderRadius: "8px",
                      border: "1px solid #c8e6c9"
                    }}>
                      <span style={{ color: "#2e7d32", display: "flex", alignItems: "center", gap: "6px" }}>
                        🏷️ Cupón <strong>{ordenSeleccionada.cupon_aplicado}</strong>
                      </span>
                      <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                        -{formatCurrency(ordenSeleccionada.total - ordenSeleccionada.total_con_descuento)}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.3rem", fontWeight: 800 }}>
                    <span style={{ color: "#2a2a2a" }}>Total Pagado</span>
                    <span style={{ color: "#C5425A", fontSize: "1.5rem" }}>
                      {formatCurrency(ordenSeleccionada.total_con_descuento ?? ordenSeleccionada.total)}
                    </span>
                  </div>
                </div>

                {/* Botones */}
                <div className="baucher-actions" style={{ display: "flex", gap: "12px", marginTop: "30px", flexWrap: "wrap" }}>
                  <button
                    onClick={handleCerrarBaucher}
                    style={{
                      flex: 1, minWidth: "120px", padding: "14px", borderRadius: "8px",
                      border: "2px solid #7A1E3A", background: "#fff",
                      color: "#7A1E3A", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer"
                    }}
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={handleEnviarEmail}
                    disabled={enviandoEmail}
                    style={{
                      flex: 1, minWidth: "120px", padding: "14px", borderRadius: "8px",
                      border: "none", background: "#2e7d32",
                      color: "white", fontWeight: 700, fontSize: "0.95rem",
                      cursor: enviandoEmail ? "not-allowed" : "pointer",
                      opacity: enviandoEmail ? 0.7 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {enviandoEmail ? "Enviando..." : "Enviar por correo"}
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{
                      flex: 1, minWidth: "120px", padding: "14px", borderRadius: "8px",
                      border: "none", background: "#7A1E3A",
                      color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
        .baucher-modal::-webkit-scrollbar { display: none; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media print {
          @page { margin: 14mm; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .baucher-print-overlay, .baucher-print-overlay * { visibility: visible !important; }
          .baucher-print-overlay {
            position: absolute !important;
            inset: 0 !important;
            display: block !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .baucher-modal {
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          .baucher-actions { display: none !important; }
        }
      `}</style>
    </>
  );
}
