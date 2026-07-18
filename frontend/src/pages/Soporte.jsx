import { useEffect, useState } from 'react';
import { crearSoporte, getSoporte } from '../services/api';
import { IconInfo, IconCheck, IconTool } from '../components/Icons';

const CATEGORIAS = ['La página no carga', 'Error al iniciar sesión', 'Problema al pagar', 'Error al publicar o comprar', 'Otro problema técnico'];

const ToolIcon = ({ size = 28, color = '#7A1E3A' }) => (
  <IconTool width={size} height={size} style={{ color }} strokeWidth={1.5} />
);

export default function Soporte() {
  const [tickets, setTickets] = useState([]);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    try { const res = await getSoporte(); setTickets(res.data || []); } catch { setError('No se pudieron cargar los tickets de soporte.'); }
  };
  useEffect(() => { cargar(); }, []);

  const enviar = async (event) => {
    event.preventDefault(); setError(''); setMensaje('');
    try {
      await crearSoporte({ asunto, descripcion, categoria });
      setAsunto(''); setDescripcion(''); setMensaje('Ticket enviado al soporte técnico.'); cargar();
      window.dispatchEvent(new Event('bookyhome-complaint-updated'));
    } catch (err) { setError(err.response?.data?.detail || 'No se pudo crear el ticket.'); }
  };

  return <div style={{ width: '100%', padding: '0 2rem 2.5rem', boxSizing: 'border-box', maxWidth: 1400, margin: '0 auto' }}>
    <div className="pl-card" style={{ padding: '2.5rem 2rem', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, borderRadius: 20, background: 'linear-gradient(135deg, #fff 0%, #faf8f6 100%)' }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <span style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #f7e9ee 0%, #f0e0e6 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 20px rgba(122, 30, 58, 0.15)' }}>
          <ToolIcon size={38} />
        </span>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#7A1E3A', letterSpacing: '-0.5px' }}>Soporte técnico</h1>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1rem', lineHeight: 1.5 }}>Reporta fallas de BookyHome. Este canal no es para pedidos o devoluciones.</p>
        </div>
      </div>
      <span style={{ color: '#7A1E3A', background: 'linear-gradient(135deg, #f7e9ee 0%, #f0e0e6 100%)', padding: '12px 20px', borderRadius: 28, fontWeight: 700, whiteSpace: 'nowrap', fontSize: '0.95rem', boxShadow: '0 2px 10px rgba(122, 30, 58, 0.1)' }}>Ayuda del sitio</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(380px, 1fr)', gap: 32, alignItems: 'start' }}>
      <form onSubmit={enviar} className="pl-card" style={{ padding: '2.5rem 2rem', display: 'grid', gap: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: 20, marginBottom: 8 }}>
          <h2 style={{ margin: 0, color: '#7A1E3A', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px' }}>Crear ticket de soporte</h2>
          <p style={{ color: '#666', marginBottom: 0, marginTop: 8, fontSize: '1rem', lineHeight: 1.6 }}>Cuéntanos qué falló y qué estabas intentando hacer.</p>
        </div>
        <label style={{ display: 'grid', gap: 10, fontWeight: 700, fontSize: '1rem' }}>
          Tipo de problema
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #ddd', fontWeight: 400, fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}>
            {CATEGORIAS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 10, fontWeight: 700, fontSize: '1rem' }}>
          Asunto
          <input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Ej.: No puedo finalizar el pago" required maxLength={150} style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #ddd', fontWeight: 400, fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }} />
        </label>
        <label style={{ display: 'grid', gap: 10, fontWeight: 700, fontSize: '1rem' }}>
          Descripción
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe qué pasó y qué estabas intentando hacer..." required minLength={5} rows={7} style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #ddd', resize: 'vertical', fontWeight: 400, fontSize: '1rem', outline: 'none', transition: 'all 0.2s', lineHeight: 1.6 }} />
        </label>
        {error && <p style={{ color: '#b91c1c', margin: 0, padding: '16px 20px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: '0.95rem', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)' }}>{error}</p>}
        {mensaje && <p style={{ color: '#15803d', margin: 0, display: 'flex', gap: 10, padding: '16px 20px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', alignItems: 'center', fontSize: '0.95rem', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.1)' }}><IconCheck width={24} />{mensaje}</p>}
        <button className="btn btn-vinotinto" style={{ width: 'fit-content', padding: '16px 32px', borderRadius: 12, fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(122, 30, 58, 0.2)', transition: 'all 0.2s' }}>Enviar ticket</button>
      </form>
      <div style={{ display: 'grid', gap: 32 }}>
        <div className="pl-card" style={{ padding: '2.5rem 2rem', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, color: '#7A1E3A', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 20 }}>¿Qué puedes reportar?</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {CATEGORIAS.slice(0, 4).map((item) => (
              <div key={item} style={{ padding: 18, background: 'linear-gradient(135deg, #faf8f6 0%, #f5f0e8 100%)', borderRadius: 12, color: '#555', fontSize: '1rem', border: '1px solid #f0ebe4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>{item}</div>
            ))}
          </div>
        </div>
        <div className="pl-card" style={{ padding: '2.5rem 2rem', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxHeight: 500, overflowY: 'auto' }}>
          <h2 style={{ marginTop: 0, color: '#7A1E3A', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 24 }}>Mis tickets técnicos</h2>
          {tickets.length === 0 ? (
            <p style={{ color: '#777', marginBottom: 0, textAlign: 'center', padding: 48, fontSize: '1rem' }}>No tienes tickets técnicos previos.</p>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id_solicitud} style={{ borderTop: '1px solid #eee', padding: '24px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <strong style={{ fontSize: '1.1rem', color: '#333', fontWeight: 700 }}>{ticket.asunto}</strong>
                  <span style={{ background: ticket.estado === 'Resuelto' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : ticket.estado === 'En revisión' ? 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', color: '#333', padding: '6px 14px', borderRadius: 14, fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>{ticket.estado}</span>
                </div>
                <p style={{ margin: '12px 0', color: '#666', lineHeight: 1.6, fontSize: '1rem' }}>{ticket.descripcion}</p>
                {ticket.respuesta && (
                  <div style={{ margin: '16px 0 0', padding: 18, background: 'linear-gradient(135deg, #faf8f6 0%, #f5f0e8 100%)', borderRadius: 12, borderLeft: '4px solid #7A1E3A', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <strong style={{ color: '#7A1E3A', display: 'block', marginBottom: 6, fontSize: '0.95rem', fontWeight: 700 }}>Respuesta:</strong>
                    <p style={{ margin: 0, color: '#555', fontSize: '1rem', lineHeight: 1.6 }}>{ticket.respuesta}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>;
}
