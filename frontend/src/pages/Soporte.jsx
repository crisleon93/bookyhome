import { useEffect, useState } from 'react';
import { crearSoporte, getSoporte } from '../services/api';
import { IconCheck, IconTool, IconLock, IconCreditCard, IconShoppingBag, IconMessage, IconRefresh } from '../components/Icons';

const CATEGORIAS = [
  { label: 'La página no carga', icon: <IconRefresh width={18} height={18} /> },
  { label: 'Error al iniciar sesión', icon: <IconLock width={18} height={18} /> },
  { label: 'Problema al pagar', icon: <IconCreditCard width={18} height={18} /> },
  { label: 'Error al publicar o comprar', icon: <IconShoppingBag width={18} height={18} /> },
  { label: 'Otro problema técnico', icon: <IconMessage width={18} height={18} /> },
];

const ESTADO_CONFIG = {
  Resuelto:      { bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#16a34a' },
  'En revisión': { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  'En revision': { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  Abierto:       { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', dot: '#3b82f6' },
  Pendiente:     { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', dot: '#3b82f6' },
  Cerrado:       { bg: '#f3f4f6', color: '#374151', border: '#d1d5db', dot: '#6b7280' },
  Rechazado:     { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444' },
};

// Versión más viva para modo oscuro
const ESTADO_CONFIG_DARK = {
  Resuelto:      { bg: '#0f2e1a', color: '#4ade80', border: '#16a34a', dot: '#4ade80' },
  'En revisión': { bg: '#2e1a08', color: '#fb923c', border: '#ea580c', dot: '#fb923c' },
  'En revision': { bg: '#2e1a08', color: '#fb923c', border: '#ea580c', dot: '#fb923c' },
  Abierto:       { bg: '#0d1f3c', color: '#60a5fa', border: '#3b82f6', dot: '#60a5fa' },
  Pendiente:     { bg: '#0d1f3c', color: '#60a5fa', border: '#3b82f6', dot: '#60a5fa' },
  Cerrado:       { bg: '#1e1e1e', color: '#9ca3af', border: '#4b5563', dot: '#9ca3af' },
  Rechazado:     { bg: '#2e0d0d', color: '#f87171', border: '#ef4444', dot: '#f87171' },
};

function EstadoBadge({ estado, darkMode }) {
  const configs = darkMode ? ESTADO_CONFIG_DARK : ESTADO_CONFIG;
  const cfg = configs[estado] || configs.Abierto;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: '5px 12px', borderRadius: 20,
      fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {estado}
    </span>
  );
}

const fieldStyle = {
  padding: '13px 16px',
  borderRadius: 10,
  border: '1.5px solid #e5e7eb',
  fontSize: '0.95rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  color: '#1a1a1a',
  background: '#fff',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function tiempoTranscurrido(fechaStr) {
  if (!fechaStr) return null;
  const diff = Date.now() - new Date(fechaStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? 'es' : ''}`;
}

export default function Soporte() {
  const [tickets, setTickets] = useState([]);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0].label);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [filtroEstadoTickets, setFiltroEstadoTickets] = useState('Todos');
  const [paginaTickets, setPaginaTickets] = useState(1);
  const [ticketColapsado, setTicketColapsado] = useState({});
  const [vistaPrincipal, setVistaPrincipal] = useState('nueva'); // "nueva" o "historial"

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener('darkModeChange', handler); window.removeEventListener('storage', handler); };
  }, []);

  // Paleta de colores según modo
  const t = {
    cardBg:           darkMode ? '#1e1e1e' : '#fff',
    subCardBg:        darkMode ? '#303030' : '#fafafa',
    subCardBorder:    darkMode ? '1px solid #3a3a3a' : '1px solid #e5e7eb',
    inputBg:          darkMode ? '#2a2a2a' : '#fff',
    inputBorder:      darkMode ? '#3a3a3a' : '#e5e7eb',
    inputColor:       darkMode ? '#ececec' : '#1a1a1a',
    textPrimary:      darkMode ? '#ececec' : '#111',
    textSecondary:    darkMode ? '#c8c8c8' : '#374151',
    textMuted:        darkMode ? '#999' : '#6b7280',
    tabsBg:           darkMode ? '#2a2a2a' : '#f3f4f6',
    tabActiveBg:      darkMode ? '#3a3a3a' : '#fff',
    tabActiveColor:   darkMode ? '#e05a7a' : '#7A1E3A',
    tabInactiveColor: darkMode ? '#aaa' : '#6b7280',
    divider:          darkMode ? '#333' : '#f0f0f0',
    catBtnBg:         darkMode ? '#2a2a2a' : '#fff',
    catBtnBorder:     darkMode ? '#3a3a3a' : '#e5e7eb',
    catBtnIconBg:     darkMode ? '#2a2a2a' : '#f7e9ee',
    ticketCardBg:     darkMode ? '#252525' : '#fff',
    ticketHeaderBg:   darkMode ? '#2a2a2a' : '#fdf8f9',
    ticketHeaderBorder:darkMode ? '#383838' : '#f0e8ec',
    paginaBtnBg:      darkMode ? '#2a2a2a' : '#fff',
    paginaBtnBorder:  darkMode ? '#3a3a3a' : '#e5e7eb',
    paginaBtnColor:   darkMode ? '#c8c8c8' : '#374151',
    selectBg:         darkMode ? '#2a2a2a' : '#fff',
  };

  const cargar = async () => {
    try { const res = await getSoporte(); setTickets(res.data || []); } catch { setError('No se pudieron cargar los tickets de soporte.'); }
  };
  useEffect(() => { cargar(); }, []);

  const enviar = async (event) => {
    event.preventDefault(); setError(''); setMensaje('');
    setEnviando(true);
    try {
      await crearSoporte({ asunto, descripcion, categoria });
      setAsunto(''); setDescripcion(''); setMensaje('Ticket enviado al soporte técnico.'); cargar();
      window.dispatchEvent(new Event('bookyhome-complaint-updated'));
    } catch (err) { setError(err.response?.data?.detail || 'No se pudo crear el ticket.'); }
    finally { setEnviando(false); }
  };

  const TICKETS_POR_PAGINA = 5;
  const ticketsFiltrados = tickets.filter((t) => filtroEstadoTickets === 'Todos' || t.estado === filtroEstadoTickets);
  const totalPaginasTickets = Math.max(1, Math.ceil(ticketsFiltrados.length / TICKETS_POR_PAGINA));
  const paginaActualTickets = Math.min(paginaTickets, totalPaginasTickets);
  const ticketsVisibles = ticketsFiltrados.slice((paginaActualTickets - 1) * TICKETS_POR_PAGINA, paginaActualTickets * TICKETS_POR_PAGINA);

  return (
    <div style={{ width: '100%', margin: 0, padding: '0 0 2.5rem', background: t.bg }}>

      {/* HERO HEADER */}
      <section style={{
        padding: '2rem',
        marginBottom: 24,
        borderRadius: 20,
        background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)',
        boxShadow: '0 8px 32px rgba(122,30,58,0.2)',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <span style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(255,255,255,0.15)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.25)',
        }}>
          <IconTool width={32} height={32} strokeWidth={1.5} style={{ color: '#fff' }} />
        </span>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Soporte técnico
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Reporta fallas de la plataforma. Este canal no es para pedidos o devoluciones.
          </p>
        </div>
      </section>

      {/* TABS DE NAVEGACIÓN */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4, background: t.tabsBg, padding: 4, borderRadius: 12 }}>
          <button
            type="button"
            onClick={() => setVistaPrincipal('nueva')}
            style={{
              flex: 1, padding: '12px 20px', border: 'none',
              background: vistaPrincipal === 'nueva' ? t.tabActiveBg : 'transparent',
              color: vistaPrincipal === 'nueva' ? t.tabActiveColor : t.tabInactiveColor,
              fontSize: '0.95rem', fontWeight: vistaPrincipal === 'nueva' ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', borderRadius: 8,
              boxShadow: vistaPrincipal === 'nueva' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Nuevo ticket
          </button>
          <button
            type="button"
            onClick={() => setVistaPrincipal('historial')}
            style={{
              flex: 1, padding: '12px 20px', border: 'none',
              background: vistaPrincipal === 'historial' ? t.tabActiveBg : 'transparent',
              color: vistaPrincipal === 'historial' ? t.tabActiveColor : t.tabInactiveColor,
              fontSize: '0.95rem', fontWeight: vistaPrincipal === 'historial' ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', borderRadius: 8,
              boxShadow: vistaPrincipal === 'historial' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Mis tickets
          </button>
        </div>
      </div>

      {/* ALERTAS */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.92rem',
          boxShadow: '0 2px 8px rgba(220,38,38,0.08)',
        }}>
          {error}
        </div>
      )}
      {mensaje && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', color: '#166534',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.92rem',
          boxShadow: '0 2px 8px rgba(22,163,74,0.08)',
        }}>
          <IconCheck width={20} /> {mensaje}
        </div>
      )}

      {/* FORMULARIO - Solo muestra cuando vistaPrincipal es "nueva" */}
      {vistaPrincipal === 'nueva' && (
      <form onSubmit={enviar} className="pl-card" style={{
        padding: '1.5rem', borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        background: t.cardBg, marginBottom: 24,
      }}>
        <div style={{ display: 'grid', gap: 8 }}>

          <div style={{ display: 'grid', gap: 12, padding: '12px', background: t.subCardBg, borderRadius: 8, border: t.subCardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1rem' }}>🔧</span>
              <strong style={{ color: t.textSecondary, fontSize: '0.8rem' }}>Tipo de problema</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {CATEGORIAS.map((cat) => {
                const activo = categoria === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategoria(cat.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 6,
                      border: activo ? '2px solid #7A1E3A' : `1px solid ${t.catBtnBorder}`,
                      background: activo ? (darkMode ? '#303030' : '#fdf8f9') : t.catBtnBg,
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      boxShadow: activo ? '0 0 0 2px rgba(122,30,58,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!activo) { e.currentTarget.style.borderColor = '#c0587a'; e.currentTarget.style.background = darkMode ? '#2d1520' : '#fdf8f9'; } }}
                    onMouseLeave={(e) => { if (!activo) { e.currentTarget.style.borderColor = t.catBtnBorder; e.currentTarget.style.background = t.catBtnBg; } }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      background: activo ? '#7A1E3A' : t.catBtnIconBg,
                      color: activo ? '#fff' : '#e05a7a',
                      display: 'grid', placeItems: 'center', fontSize: '0.9rem',
                      transition: 'background 0.15s, color 0.15s',
                    }}>
                      {cat.icon}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: activo ? 700 : 500, color: activo ? (darkMode ? '#e05a7a' : '#7A1E3A') : t.textSecondary, lineHeight: 1.2 }}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', color: t.textSecondary, marginBottom: 4 }}>
              Asunto
            </label>
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: No puedo pagar"
              required
              maxLength={150}
              style={{ ...fieldStyle, padding: '10px 12px', fontSize: '0.85rem', background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.inputColor }}
              onFocus={(e) => { e.target.style.borderColor = '#7A1E3A'; e.target.style.boxShadow = '0 0 0 2px rgba(122,30,58,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', color: t.textSecondary, marginBottom: 4 }}>
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el problema..."
              required
              minLength={5}
              rows={3}
              style={{ ...fieldStyle, padding: '10px 12px', fontSize: '0.85rem', lineHeight: 1.4, resize: 'vertical', background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.inputColor }}
              onFocus={(e) => { e.target.style.borderColor = '#7A1E3A'; e.target.style.boxShadow = '0 0 0 2px rgba(122,30,58,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
            <button
              disabled={enviando}
              className="btn btn-vinotinto"
              style={{ padding: '10px 24px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(122,30,58,0.2)', opacity: enviando ? 0.7 : 1, transition: 'all 0.2s' }}
            >
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </form>
      )}

      {/* MIS TICKETS - Solo muestra cuando vistaPrincipal es "historial" */}
      {vistaPrincipal === 'historial' && (
      <section className="pl-card" style={{ padding: '1.5rem', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: t.cardBg }}>
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${t.divider}` }}>
          {/* Filtros */}
          {tickets.length > 0 && (() => {
            const counts = tickets.reduce((acc, t) => {
              const k = t.estado || 'Abierto';
              acc[k] = (acc[k] || 0) + 1;
              return acc;
            }, {});
            return (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['Todos', 'Abierto', 'En revisión', 'Resuelto', 'Rechazado'].map(f => {
                  const cfg = f === 'Todos'
                    ? { dot: darkMode ? '#e05a7a' : '#7A1E3A', border: darkMode ? '#e05a7a' : '#7A1E3A', color: darkMode ? '#e05a7a' : '#7A1E3A', bg: darkMode ? '#2a2a2a' : '#fdf2f4' }
                    : ((darkMode ? ESTADO_CONFIG_DARK : ESTADO_CONFIG)[f] || (darkMode ? ESTADO_CONFIG_DARK : ESTADO_CONFIG).Abierto);
                  const activo = filtroEstadoTickets === f;
                  const count = f === 'Todos' ? tickets.length : (counts[f] || 0);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => { setFiltroEstadoTickets(f); setPaginaTickets(1); }}
                      style={{
                        padding: '4px 12px',
                        border: 'none',
                        background: activo ? cfg.dot : 'transparent',
                        color: activo ? '#fff' : cfg.color,
                        fontSize: '0.85rem', fontWeight: activo ? 600 : 400, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.15s',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = cfg.bg; }}
                      onMouseLeave={(e) => { if (!activo) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {f} {count > 0 && <span style={{ opacity: 0.7, marginLeft: 2 }}>({count})</span>}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {tickets.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔧</div>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>No hay tickets</p>
          </div>
        ) : ticketsFiltrados.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>No hay tickets con este estado</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 16 }}>
            {ticketsVisibles.map((ticket) => {
              const STEPS = ['Abierto', 'En revisión', 'Resuelto'];
              const estadoNormalizado = ticket.estado === 'Pendiente' ? 'Abierto' : ticket.estado;
              const stepIdx = STEPS.indexOf(estadoNormalizado);
              const progreso = stepIdx === -1 ? 0 : stepIdx;
              const estadoCfg = (darkMode ? ESTADO_CONFIG_DARK : ESTADO_CONFIG)[ticket.estado] || (darkMode ? ESTADO_CONFIG_DARK : ESTADO_CONFIG).Abierto;
              const fechaStr = ticket.fecha_creacion
                ? new Date(ticket.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                : null;
              const tiempoStr = tiempoTranscurrido(ticket.fecha_creacion);
              return (
                <article key={ticket.id_solicitud} style={{
                  borderRadius: 16,
                  border: `1px solid ${estadoCfg.border}33`,
                  borderLeft: `4px solid ${estadoCfg.dot}`,
                  overflow: 'hidden',
                  background: t.ticketCardBg,
                  boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = darkMode ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Header de la card */}
                  <div style={{
                    background: t.ticketHeaderBg,
                    padding: ticketColapsado[ticket.id_solicitud] ? '10px 16px' : '12px 16px',
                    borderBottom: ticketColapsado[ticket.id_solicitud] ? 'none' : `1px solid ${t.ticketHeaderBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    cursor: 'pointer',
                  }}
                    onClick={() => setTicketColapsado(prev => ({ ...prev, [ticket.id_solicitud]: !prev[ticket.id_solicitud] }))}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 6, flexShrink: 0,
                        background: '#7A1E3A', color: '#fff',
                        display: 'grid', placeItems: 'center',
                        fontSize: '0.7rem', fontWeight: 800, letterSpacing: '-0.5px',
                        boxShadow: '0 2px 8px rgba(122,30,58,0.2)',
                      }}>
                        #{ticket.numero || ticket.id_solicitud}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{
                          background: '#7A1E3A', color: '#fff',
                          borderRadius: 4, padding: '2px 6px',
                          fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                        }}>
                          #{ticket.numero || ticket.id_solicitud}
                        </span>
                        <strong style={{ fontSize: '0.9rem', color: t.textPrimary, fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
                          {ticket.asunto}
                        </strong>
                        {ticketColapsado[ticket.id_solicitud] && (
                          <div style={{ fontSize: '0.7rem', color: t.textMuted, marginTop: 2 }}>
                            {ticket.categoria || 'Soporte'}
                            {tiempoStr && <span style={{ color: t.textMuted, marginLeft: 4 }}>· {tiempoStr}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <EstadoBadge estado={ticket.estado} darkMode={darkMode} />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setTicketColapsado(prev => ({ ...prev, [ticket.id_solicitud]: !prev[ticket.id_solicitud] })); }}
                        style={{
                          background: 'transparent', border: 'none',
                          color: darkMode ? '#e05a7a' : '#7A1E3A',
                          cursor: 'pointer', padding: 2, borderRadius: 4, transition: 'transform 0.2s',
                          transform: ticketColapsado[ticket.id_solicitud] ? 'rotate(-90deg)' : 'rotate(0deg)',
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo */}
                  {!ticketColapsado[ticket.id_solicitud] && (
                    <div style={{ padding: '12px 16px', display: 'grid', gap: 10 }}>

                      {/* Barra de progreso compacta */}
                      {ticket.estado !== 'Rechazado' && ticket.estado !== 'Cerrado' && (
                        <div style={{ padding: '8px 12px', background: t.subCardBg, borderRadius: 6, border: t.subCardBorder, width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            {STEPS.map((step, i) => {
                              const done = progreso >= i;
                              const current = progreso === i;
                              return (
                                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
                                  <div style={{
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: done ? estadoCfg.dot : (darkMode ? '#444' : '#e5e7eb'),
                                    border: current ? `2px solid ${estadoCfg.dot}` : 'none',
                                    display: 'grid', placeItems: 'center', transition: 'all 0.3s', flexShrink: 0,
                                  }}>
                                    {done && <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 900 }}>✓</span>}
                                  </div>
                                  <span style={{ fontSize: '0.7rem', color: done ? estadoCfg.color : t.textMuted, fontWeight: done ? 600 : 400 }}>{step}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ height: 3, borderRadius: 2, background: darkMode ? '#444' : '#e5e7eb', position: 'relative' }}>
                            <div style={{
                              position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2,
                              background: estadoCfg.dot, boxShadow: `0 0 4px ${estadoCfg.dot}66`,
                              width: progreso === 0 ? '0%' : progreso === 1 ? '50%' : '100%',
                              transition: 'width 0.5s ease, background 0.5s ease',
                            }} />
                          </div>
                        </div>
                      )}

                      {/* Metadata compacta */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: '0.75rem' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: darkMode ? '#2a2a2a' : '#fdf2f4', border: `1px solid ${darkMode ? '#444' : '#f0dde4'}`,
                          borderRadius: 4, padding: '3px 8px',
                          color: darkMode ? '#e05a7a' : '#7A1E3A', fontSize: '0.7rem', fontWeight: 600,
                        }}>
                          {ticket.categoria || 'Soporte'}
                        </div>
                        {fechaStr && <span style={{ color: t.textMuted, fontSize: '0.7rem' }}>{fechaStr}</span>}
                        {tiempoStr && <span style={{ color: t.textMuted, fontSize: '0.65rem', marginLeft: 'auto' }}>{tiempoStr}</span>}
                      </div>

                      {/* Descripción */}
                      {ticket.descripcion && (
                        <div style={{ padding: '8px 10px', background: t.subCardBg, borderRadius: 6, border: t.subCardBorder }}>
                          <p style={{ margin: 0, color: t.textSecondary, lineHeight: 1.4, fontSize: '0.85rem' }}>
                            {ticket.descripcion}
                          </p>
                        </div>
                      )}

                      {/* Respuesta */}
                      {ticket.respuesta && (
                        <div style={{
                          padding: '8px 10px', background: darkMode ? '#2a2a2a' : '#fdf8f9',
                          borderRadius: 6, borderLeft: '2px solid #7A1E3A',
                        }}>
                          <p style={{ margin: 0, color: t.textSecondary, lineHeight: 1.4, fontSize: '0.8rem' }}>
                            <span style={{ color: darkMode ? '#e05a7a' : '#7A1E3A', fontWeight: 700, fontSize: '0.7rem' }}>Soporte: </span>
                            {ticket.respuesta}
                          </p>
                        </div>
                      )}

                    </div>
                    )}
                  </article>
                );
              })}
            </div>

            {ticketsFiltrados.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${t.divider}`, flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: '0.75rem', color: t.textMuted, fontWeight: 500 }}>
                  {(paginaActualTickets - 1) * TICKETS_POR_PAGINA + 1}-{Math.min(paginaActualTickets * TICKETS_POR_PAGINA, ticketsFiltrados.length)} de {ticketsFiltrados.length}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    disabled={paginaActualTickets === 1}
                    onClick={() => setPaginaTickets(paginaActualTickets - 1)}
                    style={{
                      padding: '4px 8px', borderRadius: 4, border: `1px solid ${t.paginaBtnBorder}`,
                      background: t.paginaBtnBg,
                      color: paginaActualTickets === 1 ? t.textMuted : t.paginaBtnColor,
                      fontSize: '0.75rem', fontWeight: 600, cursor: paginaActualTickets === 1 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.18s',
                    }}
                  >
                    ‹
                  </button>

                  {(() => {
                    const maxVisible = 5;
                    let startPage = Math.max(1, paginaActualTickets - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPaginasTickets, startPage + maxVisible - 1);
                    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) pages.push(i);
                    return pages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setPaginaTickets(page)}
                        style={{
                          padding: '4px 8px', borderRadius: 4, border: '1px solid',
                          borderColor: paginaActualTickets === page ? '#7A1E3A' : t.paginaBtnBorder,
                          background: paginaActualTickets === page ? '#7A1E3A' : t.paginaBtnBg,
                          color: paginaActualTickets === page ? '#fff' : t.paginaBtnColor,
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.18s',
                        }}
                      >
                        {page}
                      </button>
                    ));
                  })()}

                  <button
                    type="button"
                    disabled={paginaActualTickets === totalPaginasTickets}
                    onClick={() => setPaginaTickets(paginaActualTickets + 1)}
                    style={{
                      padding: '4px 8px', borderRadius: 4, border: `1px solid ${t.paginaBtnBorder}`,
                      background: t.paginaBtnBg,
                      color: paginaActualTickets === totalPaginasTickets ? t.textMuted : t.paginaBtnColor,
                      fontSize: '0.75rem', fontWeight: 600, cursor: paginaActualTickets === totalPaginasTickets ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.18s',
                    }}
                  >
                    ›
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <select
                    value={TICKETS_POR_PAGINA}
                    onChange={() => { setPaginaTickets(1); }}
                    disabled
                    style={{
                      padding: '4px 8px', borderRadius: 4, border: `1px solid ${t.paginaBtnBorder}`,
                      background: t.selectBg, color: t.paginaBtnColor,
                      fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                    }}
                  >
                    <option value={5}>5</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </section>
      )}

    </div>
  );
}
