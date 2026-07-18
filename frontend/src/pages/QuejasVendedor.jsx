import { useEffect, useState } from 'react';
import { enviarMensajeReclamo, getApiBaseUrl, getMensajesReclamo, getQuejasVendedor } from '../services/api';
import { IconAlertTriangle, IconMessage, IconEye } from '../components/Icons';

export default function QuejasVendedor() {
  const [quejas, setQuejas] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    try { const res = await getQuejasVendedor(); setQuejas(res.data || []); } catch (err) { setError(err.response?.data?.detail || 'No se pudieron cargar los reclamos.'); }
  };
  useEffect(() => { cargar(); }, []);
  useEffect(() => {
    const refrescar = () => cargar();
    window.addEventListener('bookyhome-complaint-updated', refrescar);
    const intervalId = window.setInterval(refrescar, 10000);
    return () => {
      window.removeEventListener('bookyhome-complaint-updated', refrescar);
      window.clearInterval(intervalId);
    };
  }, []);
  useEffect(() => {
    if (!seleccionada) return;
    getMensajesReclamo(seleccionada.id_solicitud).then((res) => setMensajes(res.data || [])).catch(() => setMensajes([]));
  }, [seleccionada]);
  const responder = async (event) => {
    event.preventDefault();
    if (!mensaje.trim() || !seleccionada) return;
    try { await enviarMensajeReclamo(seleccionada.id_solicitud, mensaje.trim()); setMensaje(''); await cargar(); const res = await getMensajesReclamo(seleccionada.id_solicitud); setMensajes(res.data || []); } catch (err) { setError(err.response?.data?.detail || 'No se pudo enviar la respuesta.'); }
  };

  return <div style={{ width: '100%', padding: '0 2rem 2.5rem', boxSizing: 'border-box', maxWidth: 1400, margin: '0 auto' }}>
    <div className="pl-card" style={{ padding: '2.5rem 2rem', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap', borderRadius: 20, background: 'linear-gradient(135deg, #fff 0%, #faf8f6 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #f7e9ee 0%, #f0e0e6 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 20px rgba(122, 30, 58, 0.15)' }}>
          <IconAlertTriangle width={38} height={38} style={{ color: '#7A1E3A' }} />
        </span>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#7A1E3A', letterSpacing: '-0.5px' }}>Quejas y reclamos</h1>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1rem', lineHeight: 1.5 }}>Atiende los reclamos de clientes que compraron en tu librería.</p>
        </div>
      </div>
      <span style={{ background: 'linear-gradient(135deg, #f7e9ee 0%, #f0e0e6 100%)', color: '#7A1E3A', padding: '12px 20px', borderRadius: 28, fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 2px 10px rgba(122, 30, 58, 0.1)' }}>Atención a clientes</span>
    </div>
    {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '18px 24px', borderRadius: 12, marginBottom: 24, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.95rem', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)' }}>{error}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)', gap: 32, alignItems: 'stretch' }}>
      <div className="pl-card" style={{ padding: '2.5rem 2rem', minHeight: seleccionada ? 600 : 350, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: 20, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, color: '#7A1E3A', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px' }}>Solicitudes recibidas</h2>
          <p style={{ color: '#666', marginBottom: 0, marginTop: 8, fontSize: '1rem', lineHeight: 1.6 }}>Selecciona un reclamo para revisar el caso y responder al comprador.</p>
        </div>
        {quejas.length === 0 ? (
          <div style={{ padding: 48, background: 'linear-gradient(135deg, #faf8f6 0%, #f5f0e8 100%)', borderRadius: 16, color: '#777', textAlign: 'center', border: '1px solid #f0ebe4', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <IconAlertTriangle width={48} height={48} style={{ color: '#7A1E3A', marginBottom: 16 }} />
            <p style={{ marginBottom: 0, fontSize: '1.1rem', fontWeight: 500 }}>No tienes reclamos de clientes.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {quejas.map((queja) => (
              <button key={queja.id_solicitud} onClick={() => setSeleccionada(queja)} style={{ width: '100%', textAlign: 'left', padding: 24, border: seleccionada?.id_solicitud === queja.id_solicitud ? '2px solid #7A1E3A' : '1px solid #e8dfd9', borderRadius: 16, background: seleccionada?.id_solicitud === queja.id_solicitud ? 'linear-gradient(135deg, #fcf4f7 0%, #f7e9ee 100%)' : '#fff', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: seleccionada?.id_solicitud === queja.id_solicitud ? '0 4px 16px rgba(122, 30, 58, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.15rem', color: '#333', fontWeight: 700 }}>Orden #{queja.id_orden}</strong>
                  <span style={{ background: queja.estado === 'Resuelto' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : queja.estado === 'En revisión' ? 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', color: '#333', padding: '6px 14px', borderRadius: 14, fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>{queja.estado}</span>
                </div>
                <p style={{ margin: '12px 0 0', color: '#666', fontSize: '1rem', lineHeight: 1.5 }}>{queja.comprador}</p>
                <span style={{ display: 'block', marginTop: 8, color: '#777', fontSize: '0.95rem', fontWeight: 500 }}>{queja.asunto}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pl-card" style={{ padding: '2.5rem 2rem', minHeight: seleccionada ? 600 : 350, display: 'flex', flexDirection: 'column', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        {!seleccionada ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: '#777', padding: 48 }}>
            <IconMessage width={56} height={56} style={{ color: '#7A1E3A', marginBottom: 20 }} />
            <p style={{ marginTop: 0, fontSize: '1.15rem', fontWeight: 500 }}>Selecciona un reclamo para atenderlo.</p>
          </div>
        ) : (
          <>
            <div style={{ paddingBottom: 20, borderBottom: '1px solid #eee' }}>
              <h2 style={{ margin: 0, color: '#7A1E3A', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px' }}>Conversación · Orden #{seleccionada.id_orden}</h2>
              <p style={{ margin: '12px 0 0', color: '#666', fontSize: '1rem', lineHeight: 1.6 }}>
                <strong>{seleccionada.comprador}:</strong> {seleccionada.descripcion}
              </p>
              {seleccionada.evidencia_url && (
                <button onClick={() => window.open(`${getApiBaseUrl()}${seleccionada.evidencia_url}`, '_blank', 'noopener,noreferrer')} style={{ marginTop: 16, border: 0, background: 'linear-gradient(135deg, #f7e9ee 0%, #f0e0e6 100%)', padding: '10px 18px', color: '#7A1E3A', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', borderRadius: 10, boxShadow: '0 2px 8px rgba(122, 30, 58, 0.1)', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <IconEye width={18} height={18} strokeWidth={1.5} style={{ color: '#7A1E3A' }} /> Ver evidencia adjunta
                </button>
              )}
            </div>
            <div style={{ marginTop: 24, display: 'grid', gap: 16, flex: 1, overflowY: 'auto', minHeight: 200, maxHeight: 400, padding: '0 4px' }}>
              {mensajes.length === 0 && <p style={{ color: '#777', textAlign: 'center', padding: 32, fontSize: '1rem' }}>Aún no hay mensajes. Responde al comprador para iniciar la atención.</p>}
              {mensajes.map((item) => (
                <div key={item.id_mensaje} style={{ padding: 18, borderRadius: 14, background: item.rol === 'vendedor' ? 'linear-gradient(135deg, #f7e9ee 0%, #f0e0e6 100%)' : 'linear-gradient(135deg, #faf8f6 0%, #f5f0e8 100%)', border: item.rol === 'vendedor' ? '1px solid #f0e0e6' : '1px solid #f0ebe4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#333', fontWeight: 700 }}>{item.nombre_usuario}</strong>
                  <p style={{ margin: '8px 0 0', fontSize: '1rem', lineHeight: 1.6 }}>{item.mensaje}</p>
                </div>
              ))}
            </div>
            <form onSubmit={responder} style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <input value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe una respuesta para el comprador" style={{ flex: 1, padding: '16px 20px', border: '1px solid #ddd', borderRadius: 12, fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }} />
              <button className="btn btn-vinotinto" style={{ height: 56, padding: '0 32px', borderRadius: 12, fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 12px rgba(122, 30, 58, 0.2)', transition: 'all 0.2s' }}>Enviar</button>
            </form>
          </>
        )}
      </div>
    </div>
  </div>;
}
