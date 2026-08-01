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

  return <>
    <div className="welcome-card">
      <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ToolIcon size={24} />
        Soporte técnico
      </h1>
      <p style={{ margin: 0 }}>Reporta fallas de BookyHome. Este canal no es para pedidos o devoluciones.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(380px, 1fr)', gap: 32, alignItems: 'start' }}>
      <form onSubmit={enviar} className="pl-card" style={{ padding: '2rem', display: 'grid', gap: 24 }}>
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: 20, marginBottom: 8 }}>
          <h2 style={{ margin: 0, color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 700 }}>Crear ticket de soporte</h2>
          <p style={{ color: '#666', marginBottom: 0, marginTop: 8, fontSize: '0.95rem', lineHeight: 1.6 }}>Cuéntanos qué falló y qué estabas intentando hacer.</p>
        </div>
        <label style={{ display: 'grid', gap: 10, fontWeight: 600, fontSize: '0.95rem' }}>
          Tipo de problema
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #ddd', fontWeight: 400, fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s' }}>
            {CATEGORIAS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 10, fontWeight: 600, fontSize: '0.95rem' }}>
          Asunto
          <input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Ej.: No puedo finalizar el pago" required maxLength={150} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #ddd', fontWeight: 400, fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s' }} />
        </label>
        <label style={{ display: 'grid', gap: 10, fontWeight: 600, fontSize: '0.95rem' }}>
          Descripción
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe qué pasó y qué estabas intentando hacer..." required minLength={5} rows={7} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #ddd', resize: 'vertical', fontWeight: 400, fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', lineHeight: 1.6 }} />
        </label>
        {error && <p style={{ color: '#b91c1c', margin: 0, padding: '12px 16px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: '0.9rem' }}>{error}</p>}
        {mensaje && <p style={{ color: '#15803d', margin: 0, display: 'flex', gap: 10, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', alignItems: 'center', fontSize: '0.9rem' }}><IconCheck width={20} />{mensaje}</p>}
        <button className="btn btn-vinotinto" style={{ width: 'fit-content', padding: '12px 24px', borderRadius: 8, fontSize: '0.95rem', fontWeight: 700 }}>Enviar ticket</button>
      </form>
      <div style={{ display: 'grid', gap: 32 }}>
        <div className="pl-card" style={{ padding: '2rem' }}>
          <h2 style={{ marginTop: 0, color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>¿Qué puedes reportar?</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {CATEGORIAS.slice(0, 4).map((item) => (
              <div key={item} style={{ padding: 16, background: '#fafafa', borderRadius: 8, color: '#555', fontSize: '0.95rem', border: '1px solid #eee' }}>{item}</div>
            ))}
          </div>
        </div>
        <div className="pl-card" style={{ padding: '2rem', maxHeight: 500, overflowY: 'auto' }}>
          <h2 style={{ marginTop: 0, color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>Mis tickets técnicos</h2>
          {tickets.length === 0 ? (
            <p style={{ color: '#777', marginBottom: 0, textAlign: 'center', padding: 48, fontSize: '0.95rem' }}>No tienes tickets técnicos previos.</p>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id_solicitud} style={{ borderTop: '1px solid #eee', padding: '24px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <strong style={{ fontSize: '1rem', color: '#333', fontWeight: 700 }}>{ticket.asunto}</strong>
                  <span style={{ background: ticket.estado === 'Resuelto' ? '#dcfce7' : ticket.estado === 'En revisión' ? '#fff7ed' : '#f3f4f6', color: '#333', padding: '4px 12px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700 }}>{ticket.estado}</span>
                </div>
                <p style={{ margin: '12px 0', color: '#666', lineHeight: 1.6, fontSize: '0.95rem' }}>{ticket.descripcion}</p>
                {ticket.respuesta && (
                  <div style={{ margin: '16px 0 0', padding: 16, background: '#fafafa', borderRadius: 8, borderLeft: '4px solid #7A1E3A' }}>
                    <strong style={{ color: '#7A1E3A', display: 'block', marginBottom: 6, fontSize: '0.9rem', fontWeight: 700 }}>Respuesta:</strong>
                    <p style={{ margin: 0, color: '#555', fontSize: '0.95rem', lineHeight: 1.6 }}>{ticket.respuesta}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </>;
}
