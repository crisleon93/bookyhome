import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IconPackage, IconCheck, IconLock } from "../Icons";
import { getDevoluciones, getOrdenes, getOrden, sendConfirmationEmail, notificarLlegadaTienda, cancelarMisPendientes } from "../../services/api";
import { notify } from "../ToastProvider";

const idVisible = (orden) => orden?.id_orden_db || orden?.id_orden;

const estiloEstadoOrden = (estado) => {
  const estadoNormalizado = String(estado || '').toLowerCase();
  if (estadoNormalizado.includes('entreg')) {
    return { etiqueta: '✓ Entregada', fondo: '#ECFDF5', color: '#047857', borde: '#A7F3D0' };
  }
  if (estadoNormalizado.includes('enviad') || estadoNormalizado.includes('transit')) {
    return { etiqueta: '🚚 En tránsito', fondo: '#EFF6FF', color: '#1D4ED8', borde: '#BFDBFE' };
  }
  if (estadoNormalizado.includes('pagad') || estadoNormalizado.includes('aprob')) {
    return { etiqueta: '✓ Pagado', fondo: '#DCFCE7', color: '#166534', borde: '#86EFAC' };
  }
  if (estadoNormalizado.includes('cancel')) {
    return { etiqueta: '✕ Cancelada', fondo: '#FEF2F2', color: '#B91C1C', borde: '#FECACA' };
  }
  return { etiqueta: 'Pendiente de pago', fondo: '#FEF3C7', color: '#92400E', borde: '#FDE68A' };
};

export default function SeccionMisCompras({ userId }) {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [ordenesLoading, setOrdenesLoading] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener('darkModeChange', handler); window.removeEventListener('storage', handler); };
  }, []);

  const t = {
    cardBg:         darkMode ? '#1e1e1e' : undefined,
    tableBg:        darkMode ? '#1e1e1e' : '#fff',
    tableHeadBg:    darkMode ? '#252525' : '#fbf9f6',
    tableHeadColor: darkMode ? '#aaa' : '#8c857b',
    tableHeadBorder:darkMode ? '#333' : '#ebe5dc',
    tableBorder:    darkMode ? '#2a2a2a' : '#ebe5dc',
    rowHover:       darkMode ? '#2a2a2a' : '#faf7f2',
    rowBorder:      darkMode ? '#2a2a2a' : '#f3eee8',
    textPrimary:    darkMode ? '#ececec' : '#1F2937',
    textSecondary:  darkMode ? '#c8c8c8' : '#4B5563',
    textMuted:      darkMode ? '#999' : '#6B7280',
    inputBg:        darkMode ? '#2a2a2a' : '#FAFAF9',
    inputBorder:    darkMode ? '#3a3a3a' : '#E5E7EB',
    inputColor:     darkMode ? '#ececec' : '#1F2937',
    selectBg:       darkMode ? '#2a2a2a' : '#fff',
    selectColor:    darkMode ? '#c8c8c8' : '#374151',
    filterBarBg:    darkMode ? '#1e1e1e' : undefined,
    filterBorder:   darkMode ? '#333' : '#F3F4F6',
    chipBg:         darkMode ? '#2a2a2a' : '#FFFFFF',
    chipBorder:     darkMode ? '#3a3a3a' : '#E5E7EB',
    chipColor:      darkMode ? '#c8c8c8' : '#4B5563',
    chipCountBg:    darkMode ? '#333' : '#F3F4F6',
    chipCountColor: darkMode ? '#aaa' : '#6B7280',
    kpiBg:          darkMode ? '#252525' : '#FAFAF9',
    kpiBorder:      darkMode ? '#333' : '#E5E7EB',
    kpiDivider:     darkMode ? '#333' : '#F3F4F6',
    headerBadgeBg:  darkMode ? '#2a1a24' : '#FDF2F4',
    headerBadgeBorder:darkMode ? '#5a2a3a' : '#F8D2DA',
    pendBtnBg:      darkMode ? '#2a2510' : '#FFFBEB',
    pendBtnBorder:  darkMode ? '#6b5a10' : '#FDE68A',
    pendBtnColor:   darkMode ? '#fbbf24' : '#B45309',
    detailsBtnBg:   darkMode ? '#2a2a2a' : '#F8FAFC',
    detailsBtnBorder:darkMode ? '#3a3a3a' : '#CBD5E1',
    detailsBtnColor:darkMode ? '#c8c8c8' : '#334155',
    detailsBtnHover:darkMode ? '#333' : '#E2E8F0',
    pagarBtnBg:     darkMode ? '#1e1218' : '#FDF2F4',
    pagarBtnColor:  darkMode ? '#e05a7a' : '#7A1E3A',
    pagarBtnBorder: darkMode ? '#5a2a3a' : '#F8D2DA',
    // productos badge
    prodBadgeBg:    darkMode ? '#0f2e1a' : '#ECFDF5',
    prodBadgeColor: darkMode ? '#4ade80' : '#047857',
    prodBadgeBorder:darkMode ? '#16a34a' : '#A7F3D0',
    prodBadgeDot:   darkMode ? '#4ade80' : '#059669',
    // entrega badges
    retiroBg:       darkMode ? '#0d1f3c' : '#EFF6FF',
    retiroColor:    darkMode ? '#60a5fa' : '#1E40AF',
    retiroBorder:   darkMode ? '#1e3a5f' : '#BFDBFE',
    domBg:          darkMode ? '#252525' : '#F3F4F6',
    domColor:       darkMode ? '#c8c8c8' : '#374151',
    domBorder:      darkMode ? '#3a3a3a' : '#E5E7EB',
    // estado badges (modo oscuro)
    estadoPagadoBg:   darkMode ? '#0f2e1a' : '#ECFDF5',
    estadoPagadoColor:darkMode ? '#4ade80' : '#047857',
    estadoPagadoBorder:darkMode ? '#16a34a' : '#A7F3D0',
    estadoCancelBg:   darkMode ? '#2e0d0d' : '#FEF2F2',
    estadoCancelColor:darkMode ? '#f87171' : '#DC2626',
    estadoCancelBorder:darkMode ? '#ef4444' : '#FECACA',
    estadoPendBg:     darkMode ? '#2e1a08' : '#FFFBEB',
    estadoPendColor:  darkMode ? '#fb923c' : '#B45309',
    estadoPendBorder: darkMode ? '#ea580c' : '#FDE68A',
    // KPI activo
    kpiTodosActivoBg:    darkMode ? '#2a1a24' : '#FDF2F4',
    kpiTodosActivoBorder:darkMode ? '#e05a7a' : '#7A1E3A',
    kpiEntActivoBg:      darkMode ? '#0f2e1a' : '#ECFDF5',
    kpiEntActivoBorder:  darkMode ? '#16a34a' : '#047857',
    kpiCamActivoBg:      darkMode ? '#0d1f3c' : '#EFF6FF',
    kpiCamActivoBorder:  darkMode ? '#3b82f6' : '#2563EB',
    kpiPendActivoBg:     darkMode ? '#2e1a08' : '#FFFBEB',
    kpiPendActivoBorder: darkMode ? '#ea580c' : '#D97706',
    kpiCanActivoBg:      darkMode ? '#2e0d0d' : '#FEF2F2',
    kpiCanActivoBorder:  darkMode ? '#ef4444' : '#DC2626',
  };

  // Filtros y Búsqueda
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('recientes');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenesPorPagina, setOrdenesPorPagina] = useState(8);

  // Baucher states
  const [mostrarBaucher, setMostrarBaucher] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [baucherLoading, setBaucherLoading] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [notificandoId, setNotificandoId] = useState(null);
  const [limpiandoPendientes, setLimpiandoPendientes] = useState(false);

  // Modal Detalles de Orden
  const [modalDetalleOrden, setModalDetalleOrden] = useState(null);

  const handleAbrirDetalle = async (orden) => {
    setModalDetalleOrden(orden);
    try {
      const targetId = orden.id_orden_db || orden.id_orden;
      const res = await getOrden(targetId);
      if (res.data) {
        setModalDetalleOrden(res.data);
      }
    } catch (e) {
      console.warn("No se pudo refrescar el detalle de la orden", e);
    }
  };

  const handleCerrarDetalle = () => {
    setModalDetalleOrden(null);
  };

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

  const handleLlegadaTienda = async (idOrden) => {
    try {
      setNotificandoId(idOrden);
      const res = await notificarLlegadaTienda(idOrden);
      if (res.data?.ok) {
        notify("¡Se notificó tu llegada al vendedor con éxito!", "success");
        cargarOrdenes();
      }
    } catch (e) {
      notify(e.response?.data?.detail || "No se pudo notificar tu llegada", "error");
    } finally {
      setNotificandoId(null);
    }
  };

  const handleLimpiarPendientes = async () => {
    if (limpiandoPendientes) return;
    setLimpiandoPendientes(true);
    try {
      const res = await cancelarMisPendientes();
      const n = res.data?.canceladas ?? 0;
      if (n > 0) {
        notify(`${n} orden${n === 1 ? '' : 'es'} pendiente${n === 1 ? '' : 's'} cancelada${n === 1 ? '' : 's'}.`, "success");
      } else {
        notify("No había órdenes pendientes para limpiar.", "info");
      }
      cargarOrdenes();
    } catch {
      notify("No se pudo completar la limpieza. Intenta de nuevo.", "error");
    } finally {
      setLimpiandoPendientes(false);
    }
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

    const estado = String(orden.estado || orden.estado_orden || '').toLowerCase().trim();
    const estadoEnvio = String(orden.envio?.estado_envio || '').toLowerCase();

    if (estado.includes('cancelad')) {
      return { pago: 'Cancelada', entrega: null, pagoClase: 'cancelado', entregaClase: null, completada: false, esCancelada: true };
    }

    const entregada = estado.includes('entregad') || estadoEnvio.includes('entregad');
    const enCamino = estado.includes('enviad') || estadoEnvio.includes('transito') || estadoEnvio.includes('camino')
      // pagado/pagada con guía de envío real → también está en camino
      || (estado.startsWith('pagad') && !!(orden.envio?.numero_guia));
    const esRetiro = orden.tipo_entrega === 'retiro_tienda';

    if (entregada) return { pago: 'Pagado', entrega: esRetiro ? 'Retirado en tienda' : 'Entregado', pagoClase: 'entregado', entregaClase: 'entregado', completada: true };
    if (enCamino) return { pago: 'Pagado', entrega: 'En camino', pagoClase: 'entregado', entregaClase: 'camino', completada: false };

    // Coincidencia flexible para variantes de "pagado": pagado, pagada, pagados, pago
    if (estado.startsWith('pagad') || estado === 'pago' || estado === 'aprobado') {
      return { pago: 'Pagado', entrega: esRetiro ? 'Listo para retirar' : 'Preparando envío', pagoClase: 'entregado', entregaClase: esRetiro ? 'entregado' : 'procesando', completada: false };
    }

    // "procesando" es un estado intermedio después del pago — no es pendiente
    if (estado.includes('procesand') || estado.includes('preparand') || estado.includes('en proceso')) {
      return { pago: 'Pagado', entrega: 'Preparando envío', pagoClase: 'entregado', entregaClase: 'procesando', completada: false };
    }

    // Cualquier otro estado desconocido que no sea explícitamente "pendiente" también
    // se trata como pendiente, pero solo si contiene 'pend' o si es vacío/nulo.
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
  const ordenesFiltradas = useMemo(() => ordenes
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
        const idMatch = String(orden.id_orden_db || orden.id_orden).includes(qClean);
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
    }), [ordenes, filtroEstado, busqueda, ordenarPor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Paginación derivada
  const totalOrdenesFiltradas = ordenesFiltradas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalOrdenesFiltradas / ordenesPorPagina));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const ordenesPaginadas = ordenesFiltradas.slice(
    (paginaSegura - 1) * ordenesPorPagina,
    paginaSegura * ordenesPorPagina
  );

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setBusqueda('');
    setOrdenarPor('recientes');
    setPaginaActual(1);
  };

  return (
    <>
      {/* ── HEADER CARD & METRICS ── */}
      <div className="pl-card" style={{ padding: "2rem", marginBottom: 20, background: t.cardBg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg, #7A1E3A 0%, #9B2C4E 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(122,30,58,0.25)" }}>
              <IconPackage width={24} height={24} strokeWidth={2.2} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: t.textPrimary }}>Mis Compras</h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.86rem", color: t.textMuted }}>
                Historial, estado de entrega y comprobantes de pago de tus pedidos
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ background: t.headerBadgeBg, color: darkMode ? '#e05a7a' : '#7A1E3A', padding: "6px 14px", borderRadius: 20, fontSize: "0.85rem", fontWeight: 800, border: `1px solid ${t.headerBadgeBorder}` }}>
              {totalCompras} {totalCompras === 1 ? 'Compra registrada' : 'Compras registradas'}
            </span>
            {totalPendientes > 0 && (
              <button onClick={handleLimpiarPendientes} disabled={limpiandoPendientes} title="Cancela las órdenes que quedaron pendientes de pago sin completar"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: limpiandoPendientes ? t.kpiBg : t.pendBtnBg, color: t.pendBtnColor, border: `1.5px solid ${t.pendBtnBorder}`, borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 700, cursor: limpiandoPendientes ? "not-allowed" : "pointer", opacity: limpiandoPendientes ? 0.7 : 1, transition: "all 0.2s" }}>
                {limpiandoPendientes ? "Limpiando..." : `🗑️ Limpiar ${totalPendientes} pendiente${totalPendientes === 1 ? '' : 's'}`}
              </button>
            )}
          </div>
        </div>

        {/* Mini KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", borderTop: `1px solid ${t.kpiDivider}`, paddingTop: "16px" }}>
          <div onClick={() => { setFiltroEstado('todos'); setPaginaActual(1); }} style={{ background: filtroEstado === 'todos' ? t.kpiTodosActivoBg : t.kpiBg, border: `1.5px solid ${filtroEstado === 'todos' ? t.kpiTodosActivoBorder : t.kpiBorder}`, borderRadius: 12, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s ease" }}>
            <span style={{ fontSize: "0.74rem", color: t.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Total</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: t.textPrimary, marginTop: 2 }}>{totalCompras}</div>
          </div>
          <div onClick={() => { setFiltroEstado('entregado'); setPaginaActual(1); }} style={{ background: filtroEstado === 'entregado' ? t.kpiEntActivoBg : t.kpiBg, border: `1.5px solid ${filtroEstado === 'entregado' ? t.kpiEntActivoBorder : t.kpiBorder}`, borderRadius: 12, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s ease" }}>
            <span style={{ fontSize: "0.74rem", color: darkMode ? '#4ade80' : '#047857', fontWeight: 700, textTransform: "uppercase" }}>✓ Entregadas</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: darkMode ? '#4ade80' : '#047857', marginTop: 2 }}>{totalEntregadas}</div>
          </div>
          <div onClick={() => { setFiltroEstado('camino'); setPaginaActual(1); }} style={{ background: filtroEstado === 'camino' ? t.kpiCamActivoBg : t.kpiBg, border: `1.5px solid ${filtroEstado === 'camino' ? t.kpiCamActivoBorder : t.kpiBorder}`, borderRadius: 12, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s ease" }}>
            <span style={{ fontSize: "0.74rem", color: darkMode ? '#60a5fa' : '#2563EB', fontWeight: 700, textTransform: "uppercase" }}>🚚 En camino</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: darkMode ? '#60a5fa' : '#2563EB', marginTop: 2 }}>{totalEnCamino}</div>
          </div>
          <div onClick={() => { setFiltroEstado('pendiente'); setPaginaActual(1); }} style={{ background: filtroEstado === 'pendiente' ? t.kpiPendActivoBg : t.kpiBg, border: `1.5px solid ${filtroEstado === 'pendiente' ? t.kpiPendActivoBorder : t.kpiBorder}`, borderRadius: 12, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s ease" }}>
            <span style={{ fontSize: "0.74rem", color: darkMode ? '#fb923c' : '#B45309', fontWeight: 700, textTransform: "uppercase" }}>⏱️ Por Pagar</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: darkMode ? '#fb923c' : '#B45309', marginTop: 2 }}>{totalPendientes}</div>
          </div>
          <div onClick={() => { setFiltroEstado('cancelado'); setPaginaActual(1); }} style={{ background: filtroEstado === 'cancelado' ? t.kpiCanActivoBg : t.kpiBg, border: `1.5px solid ${filtroEstado === 'cancelado' ? t.kpiCanActivoBorder : t.kpiBorder}`, borderRadius: 12, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s ease" }}>
            <span style={{ fontSize: "0.74rem", color: darkMode ? '#f87171' : '#DC2626', fontWeight: 700, textTransform: "uppercase" }}>❌ Canceladas</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: darkMode ? '#f87171' : '#DC2626', marginTop: 2 }}>{totalCanceladas}</div>
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="pl-card" style={{ padding: "16px 20px", marginBottom: 20, background: t.cardBg }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
            <input type="text" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              placeholder="Buscar por # orden, libro o fecha..."
              style={{ width: "100%", padding: "10px 36px 10px 38px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, fontSize: "0.88rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: t.inputBg, color: t.inputColor, transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = '#7A1E3A'}
              onBlur={(e) => e.target.style.borderColor = t.inputBorder}
            />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textMuted, display: "flex", pointerEvents: "none" }}>
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            {busqueda && (
              <button onClick={() => { setBusqueda(''); setPaginaActual(1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: t.textMuted, cursor: "pointer", fontWeight: 800, fontSize: "0.9rem", padding: 4 }}>✕</button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.82rem", color: t.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>Ordenar:</span>
            <select value={ordenarPor} onChange={(e) => { setOrdenarPor(e.target.value); setPaginaActual(1); }}
              style={{ padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.selectBg, fontSize: "0.84rem", fontWeight: 700, color: t.selectColor, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <option value="recientes">📅 Más recientes</option>
              <option value="antiguas">📅 Más antiguas</option>
              <option value="mayor_precio">💰 Mayor valor</option>
              <option value="menor_precio">💵 Menor valor</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${t.filterBorder}` }}>
          {[
            { id: 'todos', label: 'Todos', count: totalCompras, icon: null },
            { id: 'entregado', label: 'Entregadas', count: totalEntregadas, icon: '✓', color: darkMode ? '#4ade80' : '#047857' },
            { id: 'camino', label: 'En camino', count: totalEnCamino, icon: '🚚', color: darkMode ? '#60a5fa' : '#2563EB' },
            { id: 'pendiente', label: 'Pendientes de pago', count: totalPendientes, icon: '⏱️', color: darkMode ? '#fb923c' : '#B45309' },
            { id: 'cancelado', label: 'Canceladas', count: totalCanceladas, icon: '❌', color: darkMode ? '#f87171' : '#DC2626' },
          ].map((tab) => {
            const activo = filtroEstado === tab.id;
            return (
              <button key={tab.id} onClick={() => { setFiltroEstado(tab.id); setPaginaActual(1); }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", border: activo ? "1.5px solid #7A1E3A" : `1.5px solid ${t.chipBorder}`, background: activo ? "#7A1E3A" : t.chipBg, color: activo ? "#FFFFFF" : t.chipColor, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease", boxShadow: activo ? "0 2px 8px rgba(122,30,58,0.25)" : "none" }}>
                {tab.icon && <span>{tab.icon}</span>}
                <span>{tab.label}</span>
                <span style={{ padding: "1px 7px", borderRadius: "10px", fontSize: "0.74rem", fontWeight: 800, background: activo ? "rgba(255,255,255,0.28)" : t.chipCountBg, color: activo ? "#FFFFFF" : t.chipCountColor }}>{tab.count}</span>
              </button>
            );
          })}
          {(filtroEstado !== 'todos' || busqueda.trim()) && (
            <button onClick={limpiarFiltros} style={{ marginLeft: "auto", background: "none", border: "none", color: darkMode ? '#e05a7a' : '#7A1E3A', fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: "6px 4px" }}>Restablecer filtros</button>
          )}
        </div>
      </div>

      {/* ── LISTA DE COMPRAS ── */}
      {ordenesLoading ? (
        <div className="empty-state"><p>Cargando tus compras...</p></div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="pl-card" style={{ padding: "48px 24px", textAlign: "center", background: t.cardBg }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📦</div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: t.textPrimary }}>No se encontraron compras</h3>
          <p style={{ margin: "6px 0 18px", fontSize: "0.88rem", color: t.textMuted }}>
            {busqueda || filtroEstado !== 'todos' ? 'No hay órdenes que coincidan con los criterios de búsqueda o filtros seleccionados.' : 'Aún no has realizado ninguna compra en BookyHome.'}
          </p>
          {(busqueda || filtroEstado !== 'todos') && (
            <button onClick={limpiarFiltros} style={{ padding: "8px 18px", borderRadius: 8, background: "#7A1E3A", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 2px 8px rgba(122,30,58,0.25)" }}>Mostrar todas las compras</button>
          )}
        </div>
      ) : (
        <div className="pl-card" style={{ padding: 0, overflow: "hidden", borderRadius: "16px", border: `1.5px solid ${t.tableBorder}`, boxShadow: "0 2px 10px rgba(0,0,0,0.03)", background: t.tableBg }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: t.tableHeadBg, borderBottom: `1.5px solid ${t.tableHeadBorder}`, color: t.tableHeadColor, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "14px 18px", width: "135px" }}>Orden</th>
                  <th style={{ padding: "14px 18px", width: "115px" }}>Fecha</th>
                  <th style={{ padding: "14px 18px", minWidth: "150px" }}>Productos</th>
                  <th style={{ padding: "14px 18px", width: "155px" }}>Entrega</th>
                  <th style={{ padding: "14px 18px", textAlign: "center", width: "130px" }}>Estado</th>
                  <th style={{ padding: "14px 18px", textAlign: "right", width: "145px" }}>Precio</th>
                  <th style={{ padding: "14px 18px", textAlign: "center", width: "354px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenesPaginadas.map((orden) => {
                  const estadoVisible = obtenerEstadoVisible(orden);
                  return (
                    <tr key={orden.id_orden} style={{ borderBottom: `1px solid ${t.rowBorder}`, transition: "background 0.15s ease", verticalAlign: "middle" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = t.rowHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* 1. ORDEN */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: 36, height: 36, borderRadius: "10px", background: estadoVisible.completada ? t.estadoPagadoBg : estadoVisible.esCancelada ? t.estadoCancelBg : estadoVisible.pago === "Pendiente de pago" ? t.estadoPendBg : t.retiroBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${estadoVisible.completada ? t.estadoPagadoBorder : estadoVisible.esCancelada ? t.estadoCancelBorder : estadoVisible.pago === "Pendiente de pago" ? t.estadoPendBorder : t.retiroBorder}` }}>
                            {estadoVisible.completada ? (
                              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#4ade80' : '#059669'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            ) : estadoVisible.esCancelada ? (
                              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#f87171' : '#DC2626'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            ) : estadoVisible.pago === "Pendiente de pago" ? (
                              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#fb923c' : '#D97706'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            ) : (
                              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#60a5fa' : '#2563EB'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                            )}
                          </span>
                          <strong style={{ fontSize: "0.94rem", color: t.textPrimary }}>Orden #{idVisible(orden)}</strong>
                        </div>
                      </td>

                      {/* 2. FECHA */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap", color: t.textSecondary, fontSize: "0.86rem", fontWeight: 600 }}>
                        {orden.fecha ? new Date(orden.fecha).toLocaleDateString("es-CO") : "—"}
                      </td>

                      {/* 3. PRODUCTOS */}
                      <td style={{ padding: "16px 18px", color: t.textSecondary, fontSize: "0.86rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: t.prodBadgeBg, color: t.prodBadgeColor, border: `1px solid ${t.prodBadgeBorder}`, borderRadius: "20px", padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.prodBadgeDot }}></span>
                          {orden.items?.length || 0} {orden.items?.length === 1 ? "ud" : "uds"}
                        </span>
                        {orden.items?.[0]?.titulo && (
                          <div style={{ fontSize: "0.76rem", color: t.textMuted, marginTop: "4px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {orden.items[0].titulo}
                          </div>
                        )}
                      </td>

                      {/* 4. ENTREGA */}
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                        {orden.tipo_entrega === "retiro_tienda" ? (
                          <span style={{ display: "inline-block", background: t.retiroBg, color: t.retiroColor, border: `1px solid ${t.retiroBorder}`, borderRadius: "20px", padding: "4px 12px", fontSize: "0.78rem", fontWeight: 700 }}>🏪 Retiro en tienda</span>
                        ) : (
                          <span style={{ display: "inline-block", background: t.domBg, color: t.domColor, border: `1px solid ${t.domBorder}`, borderRadius: "20px", padding: "4px 12px", fontSize: "0.78rem", fontWeight: 700 }}>🚚 Domicilio</span>
                        )}
                      </td>

                      {/* 5. ESTADO */}
                      <td style={{ padding: "16px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 800,
                          ...(estadoVisible.pago === "Pagado" ? { background: t.estadoPagadoBg, color: t.estadoPagadoColor, border: `1px solid ${t.estadoPagadoBorder}` }
                          : estadoVisible.esCancelada ? { background: t.estadoCancelBg, color: t.estadoCancelColor, border: `1px solid ${t.estadoCancelBorder}` }
                          : { background: t.estadoPendBg, color: t.estadoPendColor, border: `1px solid ${t.estadoPendBorder}` })
                        }}>
                          {estadoVisible.pago}
                        </span>
                      </td>

                      {/* 6. PRECIO */}
                      <td style={{ padding: "16px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ color: darkMode ? '#e05a7a' : '#7A1E3A', fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                          ${formatNumber(orden.total)} COP
                        </span>
                      </td>

                      {/* 7. ACCIONES */}
                      <td style={{ padding: "16px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "90px 120px 120px", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                          <div>
                            {estadoVisible.pago === "Pendiente de pago" ? (
                              <button onClick={() => { const targetId = orden.id_orden_db || orden.id_orden; navigate(`/?seccion=Carrito&pagarOrden=${targetId}&metodo=${encodeURIComponent(orden.metodo_pago || 'nequi')}&entrega=${encodeURIComponent(orden.tipo_entrega || 'domicilio')}`, { state: { autoPayOrderId: targetId, autoPayMethod: orden.metodo_pago, autoPayEntrega: orden.tipo_entrega || 'domicilio', ordenObj: orden } }); }}
                                style={{ width: "100%", padding: "6px 0", fontSize: "0.78rem", borderRadius: "8px", background: t.pagarBtnBg, color: t.pagarBtnColor, border: `1.5px solid ${t.pagarBtnBorder}`, cursor: "pointer", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.15s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#7A1E3A"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = t.pagarBtnBg; e.currentTarget.style.color = t.pagarBtnColor; }}
                              ><span>💳</span> Pagar</button>
                            ) : null}
                          </div>
                          <div>
                            <button onClick={() => handleAbrirDetalle(orden)}
                              style={{ width: "100%", padding: "6px 0", fontSize: "0.78rem", borderRadius: "8px", background: t.detailsBtnBg, color: t.detailsBtnColor, border: `1.5px solid ${t.detailsBtnBorder}`, cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", transition: "all 0.15s ease" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = t.detailsBtnHover; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = t.detailsBtnBg; }}
                            >
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                              Ver Detalles
                            </button>
                          </div>
                          <div>
                            {estadoVisible.pago === "Pagado" ? (
                              <button onClick={() => handleVerBaucher(orden)}
                                style={{ width: "100%", padding: "6px 0", fontSize: "0.78rem", borderRadius: "8px", background: "#7A1E3A", color: "#FFFFFF", border: "1.5px solid #7A1E3A", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", boxShadow: "0 2px 6px rgba(122,30,58,0.22)", transition: "all 0.15s ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#902345"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#7A1E3A"; }}
                              >
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                Ver Baucher
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── BARRA DE PAGINACIÓN ── */}
          {totalOrdenesFiltradas > ordenesPorPagina && (
            <div className="mis-libros-pagination-bar">
              <div className="pagination-info">
                Mostrando <strong>{(paginaSegura - 1) * ordenesPorPagina + 1}–{Math.min(paginaSegura * ordenesPorPagina, totalOrdenesFiltradas)}</strong> de <strong>{totalOrdenesFiltradas}</strong> {totalOrdenesFiltradas === 1 ? 'orden' : 'órdenes'}
                {totalOrdenesFiltradas !== ordenes.length && (
                  <span className="pagination-total-note"> (filtradas de {ordenes.length} totales)</span>
                )}
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn-nav"
                  disabled={paginaSegura <= 1}
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                >
                  ‹ Anterior
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map((num) => {
                    if (num === 1 || num === totalPaginas || Math.abs(num - paginaSegura) <= 1) {
                      return (
                        <button
                          key={num}
                          type="button"
                          className={`pagination-num-btn ${num === paginaSegura ? 'active' : ''}`}
                          onClick={() => setPaginaActual(num)}
                        >
                          {num}
                        </button>
                      );
                    } else if (
                      (num === 2 && paginaSegura > 3) ||
                      (num === totalPaginas - 1 && paginaSegura < totalPaginas - 2)
                    ) {
                      return <span key={num} className="pagination-ellipsis">…</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  className="pagination-btn-nav"
                  disabled={paginaSegura >= totalPaginas}
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                >
                  Siguiente ›
                </button>
              </div>

              <div className="pagination-per-page">
                <label htmlFor="compras-per-page">Ver:</label>
                <select
                  id="compras-per-page"
                  value={ordenesPorPagina}
                  onChange={(e) => { setOrdenesPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                  className="select-per-page"
                >
                  <option value={5}>5 por pág.</option>
                  <option value={8}>8 por pág.</option>
                  <option value={10}>10 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL VER DETALLES DE LA ORDEN ── */}
      {modalDetalleOrden && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }} onClick={handleCerrarDetalle}>
          <div style={{ background: darkMode ? '#1e1e1e' : '#FFFFFF', maxWidth: "600px", width: "100%", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto", position: "relative", border: `1px solid ${darkMode ? '#333' : '#E2E8F0'}` }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${darkMode ? '#333' : '#E2E8F0'}`, paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: darkMode ? '#ececec' : '#0F172A' }}>Orden #{idVisible(modalDetalleOrden)}</h2>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, padding: "3px 12px", borderRadius: "999px", background: estiloEstadoOrden(modalDetalleOrden.estado || modalDetalleOrden.estado_orden).fondo, color: estiloEstadoOrden(modalDetalleOrden.estado || modalDetalleOrden.estado_orden).color, border: `1px solid ${estiloEstadoOrden(modalDetalleOrden.estado || modalDetalleOrden.estado_orden).borde}` }}>
                    {estiloEstadoOrden(modalDetalleOrden.estado || modalDetalleOrden.estado_orden).etiqueta}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: darkMode ? '#999' : '#64748B' }}>
                  {modalDetalleOrden.fecha ? new Date(modalDetalleOrden.fecha).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Fecha no disponible"}
                </p>
              </div>
              <button onClick={handleCerrarDetalle} style={{ background: darkMode ? '#2a2a2a' : '#F1F5F9', border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: darkMode ? '#c8c8c8' : '#64748B', fontSize: "1.1rem", fontWeight: 700 }}>✕</button>
            </div>

            {/* Entrega */}
            {modalDetalleOrden.tipo_entrega === "retiro_tienda" ? (
              <div style={{ background: darkMode ? '#0d1f3c' : 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', border: `1.5px solid ${darkMode ? '#1e3a5f' : '#BFDBFE'}`, borderRadius: "14px", padding: "20px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.3rem" }}>🏪</span>
                    <strong style={{ fontSize: "0.98rem", color: darkMode ? '#60a5fa' : '#1E3A8A' }}>Click & Collect · Retiro en Tienda</strong>
                  </div>
                  <div style={{ background: "#0F172A", color: "#FDE047", padding: "4px 14px", borderRadius: "8px", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "2px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                    PIN: {modalDetalleOrden.pin_retiro || "----"}
                  </div>
                </div>
                <div style={{ fontSize: "0.88rem", color: darkMode ? '#c8c8c8' : '#334155', lineHeight: "1.55", display: "grid", gap: "6px" }}>
                  <div><strong>Librería:</strong> {modalDetalleOrden.tienda_retiro?.nombre_tienda || "Librería Asociada"}</div>
                  {modalDetalleOrden.tienda_retiro?.direccion && <div><strong>Dirección:</strong> 📍 {modalDetalleOrden.tienda_retiro.direccion}</div>}
                  {modalDetalleOrden.tienda_retiro?.telefono && <div><strong>Teléfono:</strong> 📞 {modalDetalleOrden.tienda_retiro.telefono}</div>}
                  {modalDetalleOrden.fecha_limite_retiro && <div><strong>Plazo de retiro:</strong> Hasta el {new Date(modalDetalleOrden.fecha_limite_retiro).toLocaleDateString("es-CO", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: `1px solid ${darkMode ? '#1e3a5f' : '#DBEAFE'}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ fontSize: "0.82rem" }}>
                    {(modalDetalleOrden.estado === "pagado" || modalDetalleOrden.estado_orden === "pagado") ? (
                      <span style={{ color: darkMode ? '#4ade80' : '#15803D', fontWeight: 700 }}>✓ Pago completado. Presenta tu PIN en el mostrador para retirar tus libros.</span>
                    ) : modalDetalleOrden.estado_retiro === "habilitado_pago" ? (
                      <span style={{ color: darkMode ? '#fb923c' : '#B45309', fontWeight: 700 }}>🔔 Pago habilitado por el vendedor en la librería.</span>
                    ) : modalDetalleOrden.estado_retiro === "en_tienda" ? (
                      <span style={{ color: darkMode ? '#60a5fa' : '#1E40AF', fontWeight: 700 }}>📍 Notificaste tu llegada. El encargado te atenderá en breve.</span>
                    ) : (
                      <span style={{ color: darkMode ? '#999' : '#64748B' }}>🟡 Libros apartados en la librería física.</span>
                    )}
                  </div>
                  {modalDetalleOrden.estado_retiro === "reservado" && modalDetalleOrden.estado !== "pagado" && modalDetalleOrden.estado_orden !== "pagado" && (
                    <button onClick={async () => { await handleLlegadaTienda(modalDetalleOrden.id_orden_db || modalDetalleOrden.id_orden); handleAbrirDetalle(modalDetalleOrden); }} disabled={notificandoId === (modalDetalleOrden.id_orden_db || modalDetalleOrden.id_orden)} style={{ padding: "6px 12px", fontSize: "0.78rem", borderRadius: "6px", background: "#16A34A", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>📍 Notificar llegada</button>
                  )}
                  {modalDetalleOrden.estado_retiro === "habilitado_pago" && modalDetalleOrden.estado !== "pagado" && modalDetalleOrden.estado_orden !== "pagado" && (
                    <button onClick={() => { handleCerrarDetalle(); const targetId = modalDetalleOrden.id_orden_db || modalDetalleOrden.id_orden; navigate(`/?seccion=Carrito&pagarOrden=${targetId}&metodo=${encodeURIComponent(modalDetalleOrden.metodo_pago || 'nequi')}&entrega=retiro_tienda`, { state: { autoPayOrderId: targetId, autoPayMethod: modalDetalleOrden.metodo_pago, autoPayEntrega: 'retiro_tienda', ordenObj: modalDetalleOrden } }); }} style={{ padding: "6px 14px", fontSize: "0.8rem", borderRadius: "6px", background: "#7A1E3A", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer" }}>💳 Pagar Ahora</button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: darkMode ? '#252525' : '#F8FAFC', border: `1px solid ${darkMode ? '#333' : '#E2E8F0'}`, borderRadius: "14px", padding: "16px 20px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span>🚚</span>
                  <strong style={{ fontSize: "0.95rem", color: darkMode ? '#ececec' : '#1E293B' }}>Envío a Domicilio</strong>
                </div>
                {modalDetalleOrden.envio?.numero_guia ? (
                  <div style={{ fontSize: "0.85rem", color: darkMode ? '#c8c8c8' : '#475569' }}>
                    Guía: <strong>{modalDetalleOrden.envio.numero_guia}</strong> ({modalDetalleOrden.envio.empresa_mensajeria})<br />Estado: {modalDetalleOrden.envio.estado_envio || "En tránsito"}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.85rem", color: darkMode ? '#999' : '#64748B' }}>
                    {['entregada', 'entregado'].includes(String(modalDetalleOrden.estado || modalDetalleOrden.estado_orden || '').toLowerCase()) ? `Tu pedido fue entregado${modalDetalleOrden.envio?.empresa_mensajeria ? ` por ${modalDetalleOrden.envio.empresa_mensajeria}` : ''}.` : 'Tu pedido será despachado por la librería a tu dirección registrada.'}
                  </div>
                )}
                {modalDetalleOrden.tipo_entrega !== 'retiro_tienda' && Number(modalDetalleOrden.costo_envio || 0) > 0 && (
                  <div style={{ marginTop: "8px", fontSize: "0.85rem", color: darkMode ? '#c8c8c8' : '#475569' }}>Costo de domicilio: <strong>{formatCurrency(modalDetalleOrden.costo_envio)}</strong></div>
                )}
              </div>
            )}

            {/* Productos */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 800, color: darkMode ? '#ececec' : '#1E293B' }}>Productos ({modalDetalleOrden.items?.length || 0})</h4>
              <div style={{ display: "grid", gap: "10px" }}>
                {modalDetalleOrden.items?.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: darkMode ? '#2a2a2a' : '#F8FAFC', borderRadius: "8px", border: `1px solid ${darkMode ? '#333' : '#E2E8F0'}` }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: darkMode ? '#ececec' : '#0F172A' }}>{item.titulo}</div>
                      <div style={{ fontSize: "0.78rem", color: darkMode ? '#999' : '#64748B' }}>{item.autor_libro || "Autor"} · Cantidad: {item.cantidad}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: darkMode ? '#e05a7a' : '#7A1E3A' }}>{formatCurrency(Number(item.precio_libro || item.precio_final || 0) * Number(item.cantidad || 1))}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen financiero */}
            <div style={{ borderTop: `1px solid ${darkMode ? '#333' : '#E2E8F0'}`, paddingTop: "16px", marginBottom: "20px", display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: darkMode ? '#999' : '#64748B' }}>
                <span>Método de pago</span>
                <span style={{ fontWeight: 600, color: darkMode ? '#ececec' : '#0F172A' }}>{modalDetalleOrden.metodo_pago || "En línea"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 800, color: darkMode ? '#ececec' : '#0F172A', marginTop: "4px" }}>
                <span>Total</span>
                <span style={{ color: darkMode ? '#e05a7a' : '#7A1E3A' }}>{formatCurrency(modalDetalleOrden.total)}</span>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              {(modalDetalleOrden.estado === "pagado" || modalDetalleOrden.estado_orden === "pagado") && (
                <button onClick={() => { handleCerrarDetalle(); handleVerBaucher(modalDetalleOrden); }} className="btn btn-vinotinto" style={{ padding: "9px 16px", fontSize: "0.84rem", borderRadius: "8px", background: "#7A1E3A", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>📄 Ver Baucher</button>
              )}
              <button onClick={handleCerrarDetalle} style={{ padding: "9px 18px", fontSize: "0.84rem", borderRadius: "8px", background: darkMode ? '#2a2a2a' : '#F1F5F9', color: darkMode ? '#c8c8c8' : '#334155', border: `1px solid ${darkMode ? '#3a3a3a' : '#CBD5E1'}`, cursor: "pointer", fontWeight: 700 }}>Cerrar</button>
            </div>
          </div>
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
              background: darkMode ? '#1e1e1e' : 'var(--blanco, #fff)',
              maxWidth: "680px", width: "100%",
              borderRadius: "16px", padding: "24px 28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxHeight: "calc(100vh - 24px)", overflowY: "auto",
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
                <div style={{ borderBottom: `2px solid ${darkMode ? '#333' : '#e0dbd4'}`, paddingBottom: "12px", marginBottom: "14px", textAlign: "center" }}>
                  <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: darkMode ? '#2a1a24' : '#fdf0f2', display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h2 style={{ fontWeight: 800, color: "#7A1E3A", margin: "0 0 8px", fontSize: "1.6rem" }}>¡Compra Exitosa!</h2>
                  <p style={{ color: darkMode ? '#999' : '#666', margin: 0, fontSize: "0.95rem" }}>Gracias por tu compra en BookyHome</p>
                </div>

                {/* Info de la orden */}
                <div style={{ background: darkMode ? '#2a2a2a' : '#fcfaf7', padding: "14px 16px", borderRadius: "12px", marginBottom: "14px", border: `1px solid ${darkMode ? '#3a3a3a' : '#e0dbd4'}` }}>
                  <div style={{ display: "grid", gap: "8px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: darkMode ? '#999' : '#666', fontSize: "0.9rem" }}>Número de Orden</span>
                      <span style={{ fontWeight: 700, color: darkMode ? '#ececec' : undefined }}>#{idVisible(ordenSeleccionada)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: darkMode ? '#999' : '#666', fontSize: "0.9rem" }}>Fecha</span>
                      <span style={{ fontWeight: 600, color: darkMode ? '#ececec' : undefined }}>
                        {ordenSeleccionada.fecha ? new Date(ordenSeleccionada.fecha).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: darkMode ? '#999' : '#666', fontSize: "0.9rem" }}>Método de Pago</span>
                      <span style={{ fontWeight: 600, color: darkMode ? '#ececec' : undefined }}>{ordenSeleccionada.metodo_pago || "Tarjeta de Crédito"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: darkMode ? '#999' : '#666', fontSize: "0.9rem" }}>Forma de Entrega</span>
                      <span style={{ fontWeight: 700, color: ordenSeleccionada.tipo_entrega === 'retiro_tienda' ? (darkMode ? '#60a5fa' : '#1E40AF') : (darkMode ? '#c8c8c8' : '#374151') }}>
                        {ordenSeleccionada.tipo_entrega === 'retiro_tienda' ? '🏪 Retiro en Tienda' : '🚚 Envío a Domicilio'}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: darkMode ? '#999' : '#666', fontSize: "0.9rem" }}>Estado</span>
                      <span style={{ fontWeight: 700, color: darkMode ? '#4ade80' : 'green', background: darkMode ? '#0f2e1a' : '#e8f5e9', padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", border: darkMode ? '1px solid #16a34a' : undefined }}>
                        {ordenSeleccionada.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div style={{ marginBottom: "14px" }}>
                  <h3 style={{ fontWeight: 700, color: darkMode ? '#ececec' : '#2a2a2a', margin: "0 0 10px", fontSize: "1.1rem" }}>
                    Productos Comprados
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {ordenSeleccionada.items?.length > 0 ? (
                      ordenSeleccionada.items.map((item) => (
                        <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: darkMode ? '#2a2a2a' : '#faf8f6', borderRadius: "8px", border: `1px solid ${darkMode ? '#3a3a3a' : '#e0dbd4'}` }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 4px", fontWeight: 600, color: darkMode ? '#ececec' : undefined }}>{item.titulo}</p>
                            <p style={{ margin: 0, color: darkMode ? '#999' : '#666', fontSize: "0.85rem" }}>{item.autor_libro} · Cantidad: {item.cantidad}</p>
                          </div>
                          <span style={{ fontWeight: 700, color: darkMode ? '#e05a7a' : '#7A1E3A', fontSize: "1rem" }}>
                            {formatCurrency(item.precio_libro * item.cantidad)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: darkMode ? '#999' : '#888', fontSize: "0.9rem" }}>No hay detalle de productos disponible.</p>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: `2px solid ${darkMode ? '#333' : '#e0dbd4'}`, paddingTop: "12px", marginTop: "12px", display: "grid", gap: "7px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                    <span style={{ color: darkMode ? '#999' : '#666' }}>Subtotal</span>
                    <span style={{ fontWeight: 600, color: darkMode ? '#ececec' : undefined }}>{formatCurrency((ordenSeleccionada.items || []).reduce((sum, item) => sum + Number(item.precio_libro || 0) * Number(item.cantidad || 1), 0))}</span>
                  </div>
                  {ordenSeleccionada.tipo_entrega !== 'retiro_tienda' && Number(ordenSeleccionada.costo_envio || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                      <span style={{ color: darkMode ? '#999' : '#666' }}>Domicilio</span>
                      <span style={{ fontWeight: 600, color: darkMode ? '#ececec' : undefined }}>{formatCurrency(ordenSeleccionada.costo_envio)}</span>
                    </div>
                  )}
                  {ordenSeleccionada.cupon_aplicado && ordenSeleccionada.total_con_descuento != null && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", background: darkMode ? '#0f2e1a' : '#f0faf0', padding: "8px 12px", borderRadius: "8px", border: `1px solid ${darkMode ? '#16a34a' : '#c8e6c9'}` }}>
                      <span style={{ color: "#2e7d32", display: "flex", alignItems: "center", gap: "6px" }}>🏷️ Cupón <strong>{ordenSeleccionada.cupon_aplicado}</strong></span>
                      <span style={{ color: darkMode ? '#4ade80' : '#2e7d32', fontWeight: 700 }}>-{formatCurrency(ordenSeleccionada.total - ordenSeleccionada.total_con_descuento)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.3rem", fontWeight: 800 }}>
                    <span style={{ color: darkMode ? '#ececec' : '#2a2a2a' }}>Total Pagado</span>
                    <span style={{ color: "#C5425A", fontSize: "1.5rem" }}>{formatCurrency(ordenSeleccionada.total_con_descuento ?? ordenSeleccionada.total)}</span>
                  </div>
                </div>

                {/* Botones */}
                <div className="baucher-actions" style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
                  <button onClick={handleCerrarBaucher} style={{ flex: 1, minWidth: "120px", padding: "14px", borderRadius: "8px", border: "2px solid #7A1E3A", background: darkMode ? '#1e1e1e' : '#fff', color: "#7A1E3A", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>Cerrar</button>
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
