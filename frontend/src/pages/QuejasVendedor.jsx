import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { enviarMensajeReclamo, getApiBaseUrl, getMensajesReclamo, getQuejasVendedor } from '../services/api';
import {
  IconAlertTriangle,
  IconMessage,
  IconEye,
  IconSearch,
  IconRefresh,
} from '../components/Icons';

// ==================== PALETA DE COLOR BOOKYHOME ====================
const VINOTINTO = '#7A1E3A';
const VINOTINTO_LIGHT = '#fbf0f4';
const VINOTINTO_HOVER = '#932747';
const CARBON = '#1e1e1e';
const GRAY = '#64748b';
const BORDER = '#e2e8f0';
const WHITE = '#ffffff';

// ==================== CONFIGURACIÓN DE ESTADOS ====================
const ESTADO_CONFIG = {
  'Abierto': { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Abierto', dot: '#ef4444' },
  'En revisión': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', label: 'En revisión', dot: '#f97316' },
  'En revision': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', label: 'En revisión', dot: '#f97316' },
  'Resuelto': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Resuelto', dot: '#22c55e' },
  'Rechazado': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: 'Rechazado', dot: '#dc2626' },
  'Cerrado': { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: 'Cerrado', dot: '#94a3b8' },
};

// ==================== ICONOS AUXILIARES ====================
function IconBookSvg({ width = 16, height = 16, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconPackageSvg({ width = 16, height = 16, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function IconTruckSvg({ width = 16, height = 16, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
      <circle cx="17" cy="18.5" r="2.5" />
      <circle cx="7" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconInfoSvg({ width = 16, height = 16, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconSendSvg({ width = 16, height = 16, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconCheckCircleSvg({ width = 16, height = 16, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconShieldSvg({ width = 16, height = 16, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconSidebarToggle({ width = 16, height = 16, contraido = false }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      {contraido ? (
        <polyline points="14 9 17 12 14 15" />
      ) : (
        <polyline points="15 9 12 12 15 15" />
      )}
    </svg>
  );
}

const MOTIVO_ICON_MAP = {
  'Libro dañado o defectuoso': <IconBookSvg width={14} height={14} />,
  'Pedido incompleto o incorrecto': <IconPackageSvg width={14} height={14} />,
  'Demora excesiva en la entrega': <IconTruckSvg width={14} height={14} />,
  'Información incorrecta o engañosa': <IconInfoSvg width={14} height={14} />,
  'Otro': <IconMessage width={14} height={14} />,
};

// ==================== COMPONENTE PRINCIPAL ====================
export default function QuejasVendedor() {
  const [quejas, setQuejas] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [cargandoChat, setCargandoChat] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [evidenciaModalUrl, setEvidenciaModalUrl] = useState(null);
  const [panelContraido, setPanelContraido] = useState(false);

  const chatEndRef = useRef(null);

  // Helper para tiempo transcurrido
  const tiempoTranscurrido = (fechaStr) => {
    if (!fechaStr) return null;
    const diff = Date.now() - new Date(fechaStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  };

  // Cargar reclamos
  const cargar = useCallback(async (mostrarLoader = false) => {
    if (mostrarLoader) setCargando(true);
    setError('');
    try {
      const res = await getQuejasVendedor();
      const items = res.data || [];
      setQuejas(items);
      setSeleccionada((prev) => {
        if (!prev) return items.length > 0 ? items[0] : null;
        const actualizada = items.find((q) => q.id_solicitud === prev.id_solicitud);
        return actualizada || (items.length > 0 ? items[0] : null);
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar los reclamos de tu librería.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(true);
  }, [cargar]);

  // Polling suave y eventos
  useEffect(() => {
    const refrescar = () => cargar(false);
    window.addEventListener('bookyhome-complaint-updated', refrescar);
    const intervalId = window.setInterval(refrescar, 12000);
    return () => {
      window.removeEventListener('bookyhome-complaint-updated', refrescar);
      window.clearInterval(intervalId);
    };
  }, [cargar]);

  // Cargar mensajes del chat al seleccionar
  useEffect(() => {
    if (!seleccionada) {
      setMensajes([]);
      return;
    }
    setCargandoChat(true);
    getMensajesReclamo(seleccionada.id_solicitud)
      .then((res) => setMensajes(res.data || []))
      .catch(() => setMensajes([]))
      .finally(() => setCargandoChat(false));
  }, [seleccionada?.id_solicitud]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Responder
  const responder = async (event) => {
    if (event) event.preventDefault();
    if (!mensaje.trim() || !seleccionada || enviando) return;

    setEnviando(true);
    setError('');
    try {
      await enviarMensajeReclamo(seleccionada.id_solicitud, mensaje.trim());
      setMensaje('');
      const res = await getMensajesReclamo(seleccionada.id_solicitud);
      setMensajes(res.data || []);
      await cargar(false);
      window.dispatchEvent(new Event('bookyhome-complaint-updated'));
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar la respuesta.');
    } finally {
      setEnviando(false);
    }
  };

  // KPIs
  const conteos = useMemo(() => {
    const total = quejas.length;
    const abiertos = quejas.filter((q) => q.estado === 'Abierto').length;
    const enRevision = quejas.filter((q) => q.estado === 'En revisión' || q.estado === 'En revision').length;
    const resueltos = quejas.filter((q) => q.estado === 'Resuelto').length;
    return { total, abiertos, enRevision, resueltos };
  }, [quejas]);

  // Filtros
  const quejasFiltradas = useMemo(() => {
    return quejas.filter((q) => {
      if (filtroEstado !== 'todos') {
        const est = (q.estado || '').toLowerCase();
        if (filtroEstado === 'abierto' && est !== 'abierto') return false;
        if (filtroEstado === 'en revision' && !est.includes('revisi')) return false;
        if (filtroEstado === 'resuelto' && est !== 'resuelto') return false;
        if (filtroEstado === 'rechazado' && est !== 'rechazado' && est !== 'cerrado') return false;
      }
      if (busqueda.trim()) {
        const term = busqueda.toLowerCase().trim();
        const enOrden = String(q.id_orden || '').includes(term);
        const enId = String(q.id_solicitud || '').includes(term);
        const enComprador = (q.comprador || '').toLowerCase().includes(term);
        const enAsunto = (q.asunto || '').toLowerCase().includes(term);
        const enLibro = (q.titulo_libro || '').toLowerCase().includes(term);
        const enDesc = (q.descripcion || '').toLowerCase().includes(term);
        if (!enOrden && !enId && !enComprador && !enAsunto && !enLibro && !enDesc) return false;
      }
      return true;
    });
  }, [quejas, filtroEstado, busqueda]);

  const plantillasRapidas = [
    'Hola, lamentamos el inconveniente. Estamos revisando lo sucedido con tu pedido.',
    'Ya hemos contactado a la transportadora para agilizar la entrega de tu paquete.',
    'Te enviaremos un ejemplar de reemplazo sin costo adicional. ¡Disculpa las molestias!',
    '¿Podrías enviarnos una foto adicional para verificar el estado del libro?',
  ];

  return (
    <div style={{ width: '100%', margin: 0, paddingBottom: 40, fontFamily: "'Montserrat', sans-serif" }}>

      {/* ==================== STATS / KPI CARDS ==================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div style={{ background: WHITE, borderRadius: 14, padding: '14px 18px', border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: VINOTINTO_LIGHT, color: VINOTINTO, display: 'grid', placeItems: 'center' }}>
            <IconAlertTriangle width={18} height={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Reclamos</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: CARBON, marginTop: 1 }}>{conteos.total}</div>
          </div>
        </div>

        <div style={{ background: WHITE, borderRadius: 14, padding: '14px 18px', border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef2f2', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
            <IconAlertTriangle width={18} height={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Abiertos / Nuevos</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: 1 }}>{conteos.abiertos}</div>
          </div>
        </div>

        <div style={{ background: WHITE, borderRadius: 14, padding: '14px 18px', border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff7ed', color: '#ea580c', display: 'grid', placeItems: 'center' }}>
            <IconEye width={18} height={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>En Revisión</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ea580c', marginTop: 1 }}>{conteos.enRevision}</div>
          </div>
        </div>

        <div style={{ background: WHITE, borderRadius: 14, padding: '14px 18px', border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdf4', color: '#16a34a', display: 'grid', placeItems: 'center' }}>
            <IconCheckCircleSvg width={18} height={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resueltos</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', marginTop: 1 }}>{conteos.resueltos}</div>
          </div>
        </div>
      </div>

      {/* ==================== FILTROS Y BUSCADOR ==================== */}
      <div
        style={{
          background: WHITE,
          borderRadius: 14,
          padding: '12px 18px',
          border: `1px solid ${BORDER}`,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {[
            { id: 'todos', label: 'Todos', count: conteos.total, color: VINOTINTO },
            { id: 'abierto', label: 'Abiertos', count: conteos.abiertos, color: '#dc2626' },
            { id: 'en revision', label: 'En revisión', count: conteos.enRevision, color: '#ea580c' },
            { id: 'resuelto', label: 'Resueltos', count: conteos.resueltos, color: '#16a34a' },
          ].map((pill) => {
            const activo = filtroEstado === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setFiltroEstado(pill.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 18,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activo ? `1.5px solid ${pill.color}` : `1px solid ${BORDER}`,
                  background: activo ? (pill.id === 'todos' ? VINOTINTO : pill.color) : '#f8fafc',
                  color: activo ? WHITE : CARBON,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <span>{pill.label}</span>
                <span
                  style={{
                    background: activo ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: activo ? WHITE : GRAY,
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontWeight: 800,
                  }}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', minWidth: 240, flex: '1 1 240px', maxWidth: 340 }}>
          <IconSearch
            width={15}
            height={15}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: GRAY,
            }}
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por comprador, orden..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 10,
              border: `1.5px solid ${BORDER}`,
              fontSize: '0.84rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.target.style.borderColor = VINOTINTO)}
            onBlur={(e) => (e.target.style.borderColor = BORDER)}
          />
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 20,
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          <IconAlertTriangle width={18} height={18} style={{ color: '#dc2626' }} />
          <span>{error}</span>
        </div>
      )}

      {/* ==================== CONTENEDOR FLEX / GRID CON PANEL COLAPSABLE ==================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: panelContraido ? '64px minmax(0, 1fr)' : '285px minmax(0, 1fr)',
          gap: 18,
          alignItems: 'start',
          transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ==================== COLUMNA IZQUIERDA: LISTA DE RECLAMOS ==================== */}
        <div
          style={{
            background: WHITE,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            padding: panelContraido ? '14px 8px' : 16,
            maxHeight: 'calc(100vh - 180px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Header de la lista con botón de contraer */}
          <div
            style={{
              display: 'flex',
              justifyContent: panelContraido ? 'center' : 'space-between',
              alignItems: 'center',
              paddingBottom: 12,
              borderBottom: `1px solid ${BORDER}`,
              marginBottom: 12,
            }}
          >
            {!panelContraido && (
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: CARBON }}>
                  Solicitudes
                </h3>
                <span style={{ fontSize: '0.74rem', color: GRAY, fontWeight: 600 }}>
                  {quejasFiltradas.length} recibidas
                </span>
              </div>
            )}

            <button
              onClick={() => setPanelContraido(!panelContraido)}
              title={panelContraido ? 'Expandir lista de solicitudes' : 'Contraer lista para ampliar el chat'}
              style={{
                background: panelContraido ? VINOTINTO_LIGHT : '#f8fafc',
                border: `1px solid ${panelContraido ? '#f3d1dc' : BORDER}`,
                color: panelContraido ? VINOTINTO : GRAY,
                borderRadius: 8,
                padding: '6px',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = VINOTINTO)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = panelContraido ? '#f3d1dc' : BORDER)}
            >
              <IconSidebarToggle width={16} height={16} contraido={panelContraido} />
            </button>
          </div>

          {/* Estado Cargando */}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: GRAY, fontSize: '0.82rem' }}>
              {!panelContraido && 'Cargando...'}
            </div>
          ) : quejasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: GRAY }}>
              <IconAlertTriangle width={20} height={20} style={{ color: GRAY, margin: '0 auto 6px' }} />
              {!panelContraido && <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>Sin reclamos</p>}
            </div>
          ) : (
            /* Items de la lista */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quejasFiltradas.map((queja) => {
                const esActivo = seleccionada?.id_solicitud === queja.id_solicitud;
                const estConfig = ESTADO_CONFIG[queja.estado] || ESTADO_CONFIG['Abierto'];

                if (panelContraido) {
                  // MODO CONTRAÍDO (Iconos compactos)
                  return (
                    <button
                      key={queja.id_solicitud}
                      onClick={() => setSeleccionada(queja)}
                      title={`Orden #${queja.id_orden} · ${queja.comprador} (${queja.estado})`}
                      style={{
                        width: 44,
                        height: 48,
                        margin: '0 auto',
                        borderRadius: 10,
                        border: esActivo ? `2px solid ${VINOTINTO}` : `1px solid ${BORDER}`,
                        background: esActivo ? VINOTINTO_LIGHT : WHITE,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        position: 'relative',
                        padding: 0,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: estConfig.dot,
                          position: 'absolute',
                          top: 4,
                          right: 4,
                        }}
                      />
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: esActivo ? VINOTINTO : CARBON }}>
                        #{queja.id_orden}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: GRAY, textTransform: 'uppercase' }}>
                        {(queja.comprador || 'C').substring(0, 2)}
                      </span>
                    </button>
                  );
                }

                // MODO EXPANDIDO (Tarjeta compacta y elegante)
                return (
                  <div
                    key={queja.id_solicitud}
                    onClick={() => setSeleccionada(queja)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: esActivo ? `1.5px solid ${VINOTINTO}` : `1px solid ${BORDER}`,
                      background: esActivo ? VINOTINTO_LIGHT : WHITE,
                      boxShadow: esActivo ? '0 3px 12px rgba(122,30,58,0.08)' : '0 1px 4px rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderLeft: esActivo ? `4px solid ${VINOTINTO}` : `1px solid ${BORDER}`,
                    }}
                  >
                    {/* Header: Orden y Estado */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span
                        style={{
                          background: esActivo ? VINOTINTO : '#f1f5f9',
                          color: esActivo ? WHITE : CARBON,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        Orden #{queja.id_orden}
                      </span>

                      <span
                        style={{
                          background: estConfig.bg,
                          color: estConfig.text,
                          border: `1px solid ${estConfig.border}`,
                          padding: '1px 6px',
                          borderRadius: 10,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: estConfig.dot }} />
                        {estConfig.label}
                      </span>
                    </div>

                    {/* Comprador y Tiempo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: '0.82rem', color: CARBON, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        {queja.comprador || 'Comprador'}
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: GRAY }}>
                        {tiempoTranscurrido(queja.fecha_creacion)}
                      </span>
                    </div>

                    {/* Motivo */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: VINOTINTO,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {MOTIVO_ICON_MAP[queja.asunto] || <IconAlertTriangle width={11} height={11} />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{queja.asunto}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================== COLUMNA DERECHA: CONVERSACIÓN Y DETALLE (MAXIMIZADO) ==================== */}
        <div
          style={{
            background: WHITE,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 640,
          }}
        >
          {!seleccionada ? (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '60px 24px', color: GRAY, maxWidth: 360 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: VINOTINTO_LIGHT, color: VINOTINTO, display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                <IconMessage width={28} height={28} />
              </div>
              <h3 style={{ margin: '0 0 6px', color: CARBON, fontSize: '1.1rem', fontWeight: 800 }}>
                Selecciona un reclamo
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: GRAY, lineHeight: 1.5 }}>
                Elige una solicitud para revisar los detalles del caso, evidencias y dialogar en tiempo real con el comprador.
              </p>
            </div>
          ) : (
            <>
              {/* HEADER DEL CASO */}
              <div
                style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {/* Botón rápido para expandir lista si está contraída */}
                    {panelContraido && (
                      <button
                        onClick={() => setPanelContraido(false)}
                        title="Expandir lista de solicitudes"
                        style={{
                          background: VINOTINTO_LIGHT,
                          border: `1px solid #f3d1dc`,
                          color: VINOTINTO,
                          padding: '6px 10px',
                          borderRadius: 8,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <IconSidebarToggle width={14} height={14} contraido={true} />
                        Lista
                      </button>
                    )}

                    <div
                      style={{
                        width: 44,
                        height: 56,
                        borderRadius: 6,
                        background: '#f8fafc',
                        border: `1px solid ${BORDER}`,
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {seleccionada.imagen_libro ? (
                        <img
                          src={seleccionada.imagen_libro.startsWith('http') ? seleccionada.imagen_libro : `${getApiBaseUrl()}${seleccionada.imagen_libro}`}
                          alt="Portada"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <IconBookSvg width={20} height={20} style={{ color: GRAY }} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ background: VINOTINTO, color: WHITE, fontSize: '0.74rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>
                          Orden #{seleccionada.id_orden}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: GRAY, fontWeight: 600 }}>
                          Caso #{seleccionada.id_solicitud}
                        </span>
                      </div>
                      <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: CARBON }}>
                        {seleccionada.titulo_libro || `Reclamo de ${seleccionada.comprador}`}
                      </h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2, fontSize: '0.78rem', color: GRAY }}>
                        <span>Comprador: <strong style={{ color: CARBON }}>{seleccionada.comprador}</strong></span>
                        {seleccionada.correo_comprador && (
                          <a href={`mailto:${seleccionada.correo_comprador}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                            {seleccionada.correo_comprador}
                          </a>
                        )}
                        {seleccionada.total_orden && (
                          <span>Total: <strong style={{ color: VINOTINTO }}>${Number(seleccionada.total_orden).toLocaleString('es-CO')}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Estado y Acción de Colapsar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {(() => {
                      const est = ESTADO_CONFIG[seleccionada.estado] || ESTADO_CONFIG['Abierto'];
                      return (
                        <span
                          style={{
                            background: est.bg,
                            color: est.text,
                            border: `1px solid ${est.border}`,
                            padding: '4px 12px',
                            borderRadius: 16,
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: est.dot }} />
                          {est.label}
                        </span>
                      );
                    })()}

                    <button
                      onClick={() => setPanelContraido(!panelContraido)}
                      title={panelContraido ? 'Mostrar lista completa' : 'Maximizar espacio del chat'}
                      style={{
                        background: '#f8fafc',
                        border: `1px solid ${BORDER}`,
                        color: GRAY,
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = VINOTINTO)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
                    >
                      <IconSidebarToggle width={14} height={14} contraido={panelContraido} />
                      <span>{panelContraido ? 'Restaurar panel' : 'Maximizar chat'}</span>
                    </button>
                  </div>
                </div>

                {/* CAJA DEL RECLAMO INICIAL */}
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991b1b', fontWeight: 700, fontSize: '0.82rem' }}>
                      <IconAlertTriangle width={14} height={14} style={{ color: '#dc2626' }} />
                      Motivo: {seleccionada.asunto}
                    </div>
                    {seleccionada.evidencia_url && (
                      <button
                        onClick={() => setEvidenciaModalUrl(`${getApiBaseUrl()}${seleccionada.evidencia_url}`)}
                        style={{
                          background: WHITE,
                          border: '1px solid #fca5a5',
                          color: '#991b1b',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <IconEye width={12} height={12} />
                        Ver evidencia
                      </button>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#450a0a', lineHeight: 1.45, background: 'rgba(255,255,255,0.75)', padding: '8px 10px', borderRadius: 6 }}>
                    "{seleccionada.descripcion}"
                  </p>
                </div>
              </div>

              {/* TIMELINE DE MENSAJES Y CHAT (ESPACIOSO) */}
              <div
                style={{
                  flex: 1,
                  padding: '20px 24px',
                  overflowY: 'auto',
                  minHeight: 340,
                  maxHeight: 520,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: '#fcfcfc',
                }}
              >
                {cargandoChat ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: GRAY, fontSize: '0.85rem' }}>
                    Cargando mensajes...
                  </div>
                ) : mensajes.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', padding: '30px 20px', color: GRAY }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'grid', placeItems: 'center', margin: '0 auto 8px' }}>
                      <IconMessage width={20} height={20} style={{ color: GRAY }} />
                    </div>
                    <p style={{ margin: 0, fontWeight: 700, color: CARBON, fontSize: '0.9rem' }}>
                      Aún no hay respuestas en este reclamo
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem' }}>
                      Envía un mensaje abajo para dialogar con el comprador y resolver el caso.
                    </p>
                  </div>
                ) : (
                  mensajes.map((item) => {
                    const rolStr = (item.rol || '').toLowerCase();
                    const esVendedor = rolStr === 'vendedor';
                    const esAdmin = rolStr === 'admin' || rolStr === 'administrador';

                    return (
                      <div
                        key={item.id_mensaje}
                        style={{
                          alignSelf: esVendedor ? 'flex-end' : 'flex-start',
                          maxWidth: '78%',
                          background: esVendedor ? VINOTINTO_LIGHT : esAdmin ? '#fffbeb' : WHITE,
                          border: esVendedor ? `1.5px solid #f3d1dc` : esAdmin ? `1.5px solid #fef3c7` : `1px solid ${BORDER}`,
                          borderRadius: 12,
                          padding: '10px 14px',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <strong
                            style={{
                              fontSize: '0.82rem',
                              color: esVendedor ? VINOTINTO : esAdmin ? '#b45309' : '#1e40af',
                            }}
                          >
                            {item.nombre_usuario}
                          </strong>

                          <span
                            style={{
                              fontSize: '0.66rem',
                              padding: '1px 6px',
                              borderRadius: 8,
                              fontWeight: 800,
                              background: esVendedor ? VINOTINTO : esAdmin ? '#b45309' : '#1e40af',
                              color: WHITE,
                            }}
                          >
                            {esVendedor ? 'Tu Librería' : esAdmin ? 'Administración BookyHome' : 'Comprador'}
                          </span>

                          {item.fecha_creacion && (
                            <span style={{ fontSize: '0.7rem', color: GRAY, marginLeft: 'auto' }}>
                              {new Date(item.fecha_creacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <p style={{ margin: 0, color: CARBON, fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {item.mensaje}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* PLANTILLAS RÁPIDAS */}
              <div style={{ padding: '7px 20px', background: '#fafafa', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: GRAY, textTransform: 'uppercase', flexShrink: 0 }}>
                  Respuestas rápidas:
                </span>
                {plantillasRapidas.map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMensaje(txt)}
                    style={{
                      background: WHITE,
                      border: `1px solid ${BORDER}`,
                      padding: '3px 9px',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      color: CARBON,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = VINOTINTO)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    {txt.substring(0, 36)}...
                  </button>
                ))}
              </div>

              {/* FORMULARIO DE RESPUESTA */}
              <form
                onSubmit={responder}
                style={{
                  padding: '14px 20px 16px',
                  background: WHITE,
                  borderTop: `1px solid ${BORDER}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        responder();
                      }
                    }}
                    placeholder="Escribe tu mensaje o solución para el cliente y el administrador (Presiona Enter para enviar)..."
                    rows={2}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1.5px solid ${BORDER}`,
                      fontSize: '0.88rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      lineHeight: 1.45,
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = VINOTINTO)}
                    onBlur={(e) => (e.target.style.borderColor = BORDER)}
                  />

                  <button
                    type="submit"
                    disabled={enviando || !mensaje.trim()}
                    style={{
                      background: VINOTINTO,
                      color: WHITE,
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 20px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: enviando || !mensaje.trim() ? 'not-allowed' : 'pointer',
                      opacity: enviando || !mensaje.trim() ? 0.6 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 3px 10px rgba(122,30,58,0.2)',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!enviando && mensaje.trim()) e.currentTarget.style.background = VINOTINTO_HOVER;
                    }}
                    onMouseLeave={(e) => {
                      if (!enviando && mensaje.trim()) e.currentTarget.style.background = VINOTINTO;
                    }}
                  >
                    <IconSendSvg width={15} height={15} />
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: GRAY }}>
                  <span>El comprador y el equipo de soporte de BookyHome recibirán tu mensaje.</span>
                  <span>Enter para enviar · Shift + Enter para salto de línea</span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ==================== MODAL LIGHTBOX DE EVIDENCIA ==================== */}
      {evidenciaModalUrl && (
        <div
          onClick={() => setEvidenciaModalUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: WHITE,
              borderRadius: 16,
              maxWidth: 700,
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                background: VINOTINTO,
                color: WHITE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong style={{ fontSize: '0.95rem' }}>Evidencia fotográfica adjunta</strong>
              <button
                onClick={() => setEvidenciaModalUrl(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: WHITE,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 16, textAlign: 'center', overflowY: 'auto' }}>
              <img
                src={evidenciaModalUrl}
                alt="Evidencia"
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}