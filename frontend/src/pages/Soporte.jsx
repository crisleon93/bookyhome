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
  Resuelto: { bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#16a34a' },
  'En revisión': { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  'En revision': { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  Abierto: { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', dot: '#3b82f6' },
  Pendiente: { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', dot: '#3b82f6' },
  Cerrado: { bg: '#f3f4f6', color: '#374151', border: '#d1d5db', dot: '#6b7280' },
  Rechazado: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444' },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.Abierto;
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
    <div style={{ width: '100%', margin: 0, padding: '0 0 2.5rem' }}>

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

      {/* FORMULARIO */}
      <form onSubmit={enviar} className="pl-card" style={{
        padding: '2rem', borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        background: '#fff', marginBottom: 24,
      }}>
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
            Nuevo ticket de soporte
          </h2>
          <p style={{ color: '#888', marginBottom: 0, marginTop: 6, fontSize: '0.88rem' }}>
            Cuéntanos qué falló y qué estabas intentando hacer.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 22 }}>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#374151', marginBottom: 10, letterSpacing: '0.01em' }}>
              TIPO DE PROBLEMA
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
              {CATEGORIAS.map((cat) => {
                const activo = categoria === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategoria(cat.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: activo ? '2px solid #7A1E3A' : '1.5px solid #e5e7eb',
                      background: activo ? 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)' : '#fafafa',
                      cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'left',
                      boxShadow: activo ? '0 0 0 3px rgba(122,30,58,0.08)' : 'none',
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={(e) => { if (!activo) { e.currentTarget.style.borderColor = '#c0587a'; e.currentTarget.style.background = '#fdf8f9'; } }}
                    onMouseLeave={(e) => { if (!activo) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; } }}
                  >
                    <span style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: activo ? '#7A1E3A' : '#f7e9ee',
                      color: activo ? '#fff' : '#7A1E3A',
                      display: 'grid', placeItems: 'center', fontSize: '1rem',
                      transition: 'background 0.18s, color 0.18s',
                    }}>
                      {cat.icon}
                    </span>
                    <span style={{ fontSize: '0.83rem', fontWeight: activo ? 700 : 500, color: activo ? '#7A1E3A' : '#374151', lineHeight: 1.3 }}>
                      {cat.label}
                    </span>
                    <span style={{
                      marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%',
                      background: activo ? '#7A1E3A' : 'transparent',
                      display: 'grid', placeItems: 'center', flexShrink: 0,
                      transition: 'background 0.18s',
                    }}>
                      <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 900, opacity: activo ? 1 : 0, transition: 'opacity 0.18s' }}>✓</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#374151', marginBottom: 8, letterSpacing: '0.01em' }}>
              ASUNTO
            </label>
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej.: No puedo finalizar el pago"
              required
              maxLength={150}
              style={fieldStyle}
              onFocus={(e) => { e.target.style.borderColor = '#7A1E3A'; e.target.style.boxShadow = '0 0 0 3px rgba(122,30,58,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#374151', marginBottom: 8, letterSpacing: '0.01em' }}>
              DESCRIPCIÓN DEL PROBLEMA
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe qué pasó, qué estabas haciendo y si apareció algún mensaje de error..."
              required
              minLength={5}
              rows={5}
              style={{ ...fieldStyle, lineHeight: 1.6, resize: 'vertical' }}
              onFocus={(e) => { e.target.style.borderColor = '#7A1E3A'; e.target.style.boxShadow = '0 0 0 3px rgba(122,30,58,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              disabled={enviando}
              className="btn btn-vinotinto"
              style={{ padding: '13px 32px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, boxShadow: '0 4px 14px rgba(122,30,58,0.25)', opacity: enviando ? 0.7 : 1, transition: 'all 0.2s' }}
            >
              {enviando ? 'Enviando...' : 'Enviar ticket'}
            </button>
          </div>
        </div>
      </form>

      {/* MIS TICKETS */}
      <section className="pl-card" style={{ padding: '2rem', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', background: '#fff' }}>
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
              Mis tickets técnicos
            </h2>
            {tickets.length > 0 && (
              <span style={{ background: '#fdf2f4', color: '#7A1E3A', border: '1px solid #f0dde4', borderRadius: 20, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                {tickets.length} ticket{tickets.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Stats chips */}
          {tickets.length > 0 && (() => {
            const counts = tickets.reduce((acc, t) => {
              const k = t.estado || 'Abierto';
              acc[k] = (acc[k] || 0) + 1;
              return acc;
            }, {});
            return (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(counts).map(([estado, n]) => {
                  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.Abierto;
                  return (
                    <div key={estado} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      color: cfg.color, fontSize: '0.78rem', fontWeight: 700,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                      {n} {estado}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Filtros */}
          {tickets.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {['Todos', 'Abierto', 'En revisión', 'Resuelto', 'Rechazado'].map(f => {
                const cfg = f === 'Todos'
                  ? { dot: '#7A1E3A', border: '#7A1E3A', color: '#7A1E3A' }
                  : (ESTADO_CONFIG[f] || ESTADO_CONFIG.Abierto);
                const activo = filtroEstadoTickets === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setFiltroEstadoTickets(f); setPaginaTickets(1); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 14px', borderRadius: 20,
                      border: `1.5px solid ${activo ? cfg.dot : cfg.border}`,
                      background: activo ? cfg.dot : '#fff',
                      color: activo ? '#fff' : cfg.color,
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.18s',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: activo ? '#fff' : cfg.dot, display: 'inline-block' }} />
                    {f}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {tickets.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '0.95rem', margin: 0 }}>No tienes tickets técnicos previos.</p>
          </div>
        ) : ticketsFiltrados.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '0.95rem', margin: 0 }}>No tienes tickets con el estado seleccionado.</p>
          </div>
        ) : (
          <>
          <div style={{ display: 'grid', gap: 22 }}>
            {ticketsVisibles.map((ticket) => {
              const STEPS = ['Abierto', 'En revisión', 'Resuelto'];
              const estadoNormalizado = ticket.estado === 'Pendiente' ? 'Abierto' : ticket.estado;
              const stepIdx = STEPS.indexOf(estadoNormalizado);
              const progreso = stepIdx === -1 ? 0 : stepIdx;
              const estadoCfg = ESTADO_CONFIG[ticket.estado] || ESTADO_CONFIG.Abierto;
              const fechaStr = ticket.fecha_creacion
                ? new Date(ticket.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                : null;
              const tiempoStr = tiempoTranscurrido(ticket.fecha_creacion);
              return (
                <article key={ticket.id_solicitud} style={{
                  borderRadius: 16,
                  border: '1.5px solid #eee3e9',
                  borderLeft: `6px solid ${estadoCfg.dot}`,
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 3px 14px rgba(122,30,58,0.09)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 10px 30px rgba(122,30,58,0.16)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 3px 14px rgba(122,30,58,0.09)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Header de la card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
                    padding: '16px 20px',
                    borderBottom: '1.5px solid #f0e8ec',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                      <div style={{
                        width: 54, height: 54, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)', color: '#fff',
                        display: 'grid', placeItems: 'center',
                        fontSize: '0.78rem', fontWeight: 800,
                        letterSpacing: '-0.5px',
                        boxShadow: '0 4px 12px rgba(122,30,58,0.28)',
                      }}>
                        #{ticket.numero || ticket.id_solicitud}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{
                          display: 'inline-flex',
                          background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)', color: '#fff',
                          borderRadius: 7, padding: '3px 11px',
                          fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.04em',
                          boxShadow: '0 2px 8px rgba(122,30,58,0.3)',
                          whiteSpace: 'nowrap',
                          marginBottom: 6,
                        }}>
                          TICKET #{ticket.numero || ticket.id_solicitud}
                        </span>
                        <strong style={{ fontSize: '1.02rem', color: '#111', fontWeight: 800, display: 'block', lineHeight: 1.35 }}>
                          {ticket.asunto}
                        </strong>
                      </div>
                    </div>
                    <EstadoBadge estado={ticket.estado} />
                  </div>

                  {/* Cuerpo */}
                  <div style={{ padding: '16px 20px', display: 'grid', gap: 14 }}>

                    {/* Barra de progreso */}
                    {ticket.estado !== 'Rechazado' && ticket.estado !== 'Cerrado' && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          {STEPS.map((step, i) => {
                            const done = progreso >= i;
                            const current = progreso === i;
                            return (
                              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <div style={{
                                  width: 24, height: 24, borderRadius: '50%',
                                  background: done ? estadoCfg.dot : '#f0e8ec',
                                  border: current ? `2px solid ${estadoCfg.dot}` : 'none',
                                  display: 'grid', placeItems: 'center',
                                  transition: 'all 0.3s',
                                }}>
                                  {done && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                                </div>
                                <span style={{ fontSize: '0.7rem', marginTop: 4, color: done ? estadoCfg.color : '#aaa', fontWeight: done ? 700 : 500 }}>{step}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height: 5, borderRadius: 4, background: '#f0e8ec', position: 'relative' }}>
                          <div style={{
                            position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 4,
                            background: `linear-gradient(90deg, ${estadoCfg.dot}, ${estadoCfg.border})`,
                            boxShadow: `0 0 8px ${estadoCfg.dot}66`,
                            width: progreso === 0 ? '10%' : progreso === 1 ? '55%' : '100%',
                            transition: 'width 0.5s ease, background 0.5s ease',
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Fila de metadata */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {/* Categoría */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: '#fdf2f4', border: '1px solid #f0dde4',
                          borderRadius: 20, padding: '5px 12px',
                          color: '#7A1E3A', fontSize: '0.8rem', fontWeight: 700,
                        }}>
                          {ticket.categoria || 'Soporte'}
                        </div>

                        {/* Fecha */}
                        {fechaStr && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#f9fafb', border: '1px solid #e5e7eb',
                            borderRadius: 20, padding: '5px 12px',
                            color: '#6b7280', fontSize: '0.78rem', fontWeight: 600,
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {fechaStr}
                          </div>
                        )}
                      </div>

                      {/* Tiempo transcurrido */}
                      {tiempoStr && (
                        <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 500, flexShrink: 0 }}>
                          {tiempoStr}
                        </span>
                      )}
                    </div>

                    {/* Descripción */}
                    {ticket.descripcion && (
                      <div style={{ padding: '12px 14px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                        <p style={{ margin: 0, color: '#555', lineHeight: 1.65, fontSize: '0.92rem' }}>
                          <span style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción</span>
                          {ticket.descripcion}
                        </p>
                      </div>
                    )}

                    {/* Respuesta del admin */}
                    {ticket.respuesta && (
                      <div style={{
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
                        borderRadius: 12, borderLeft: '4px solid #7A1E3A',
                      }}>
                        <p style={{ margin: '0 0 6px', color: '#7A1E3A', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                          Respuesta del soporte
                        </p>
                        <p style={{ margin: 0, color: '#444', lineHeight: 1.65, fontSize: '0.92rem' }}>{ticket.respuesta}</p>
                        {ticket.fecha_resolucion && (
                          <span style={{ display: 'block', marginTop: 8, color: '#aaa', fontSize: '0.75rem', fontWeight: 500 }}>
                            Atendido el {new Date(ticket.fecha_resolucion).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    )}

                  </div>
                </article>
              );
            })}
          </div>

          {totalPaginasTickets > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={paginaActualTickets === 1}
                onClick={() => setPaginaTickets(paginaActualTickets - 1)}
                style={{
                  padding: '8px 18px', borderRadius: 20, border: '1.5px solid',
                  borderColor: paginaActualTickets === 1 ? '#e5e7eb' : '#7A1E3A',
                  background: '#fff',
                  color: paginaActualTickets === 1 ? '#bbb' : '#7A1E3A',
                  fontSize: '0.82rem', fontWeight: 700, cursor: paginaActualTickets === 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.18s',
                }}
              >
                ← Anterior
              </button>

              <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                Página {paginaActualTickets} de {totalPaginasTickets}
                <span style={{ color: '#aaa', fontWeight: 500 }}> · {ticketsFiltrados.length} ticket{ticketsFiltrados.length > 1 ? 's' : ''}</span>
              </span>

              <button
                type="button"
                disabled={paginaActualTickets === totalPaginasTickets}
                onClick={() => setPaginaTickets(paginaActualTickets + 1)}
                style={{
                  padding: '8px 18px', borderRadius: 20, border: '1.5px solid',
                  borderColor: paginaActualTickets === totalPaginasTickets ? '#e5e7eb' : '#7A1E3A',
                  background: '#fff',
                  color: paginaActualTickets === totalPaginasTickets ? '#bbb' : '#7A1E3A',
                  fontSize: '0.82rem', fontWeight: 700, cursor: paginaActualTickets === totalPaginasTickets ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.18s',
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
          </>
        )}
      </section>

    </div>
  );
}
