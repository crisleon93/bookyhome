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

  return <>
    <div className="welcome-card">
      <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconAlertTriangle width={24} height={24} style={{ color: '#7A1E3A' }} />
        Quejas y reclamos
      </h1>
      <p style={{ margin: 0 }}>Atiende los reclamos de clientes que compraron en tu librería.</p>
    </div>
    {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 24, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>{error}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)', gap: 32, alignItems: 'stretch' }}>
      <div className="pl-card" style={{ padding: '2rem', minHeight: seleccionada ? 600 : 350 }}>
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: 20, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 700 }}>Solicitudes recibidas</h2>
          <p style={{ color: '#666', marginBottom: 0, marginTop: 8, fontSize: '0.95rem', lineHeight: 1.6 }}>Selecciona un reclamo para revisar el caso y responder al comprador.</p>
        </div>
        {quejas.length === 0 ? (
          <div style={{ padding: 48, background: '#fafafa', borderRadius: 12, color: '#777', textAlign: 'center', border: '1px solid #eee' }}>
            <IconAlertTriangle width={48} height={48} style={{ color: '#7A1E3A', marginBottom: 16 }} />
            <p style={{ marginBottom: 0, fontSize: '1rem', fontWeight: 500 }}>No tienes reclamos de clientes.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {quejas.map((queja) => (
              <button key={queja.id_solicitud} onClick={() => setSeleccionada(queja)} style={{ width: '100%', textAlign: 'left', padding: 20, border: seleccionada?.id_solicitud === queja.id_solicitud ? '2px solid #7A1E3A' : '1px solid #ddd', borderRadius: 12, background: seleccionada?.id_solicitud === queja.id_solicitud ? '#f7e9ee' : '#fff', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                  <strong style={{ fontSize: '1rem', color: '#333', fontWeight: 700 }}>Orden #{queja.id_orden}</strong>
                  <span style={{ background: queja.estado === 'Resuelto' ? '#dcfce7' : queja.estado === 'En revisión' ? '#fff7ed' : '#f3f4f6', color: '#333', padding: '4px 12px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700 }}>{queja.estado}</span>
                </div>
                <p style={{ margin: '12px 0 0', color: '#666', fontSize: '0.95rem', lineHeight: 1.5 }}>{queja.comprador}</p>
                <span style={{ display: 'block', marginTop: 8, color: '#777', fontSize: '0.9rem', fontWeight: 500 }}>{queja.asunto}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pl-card" style={{ padding: '2rem', minHeight: seleccionada ? 600 : 350, display: 'flex', flexDirection: 'column' }}>
        {!seleccionada ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: '#777', padding: 48 }}>
            <IconMessage width={48} height={48} style={{ color: '#7A1E3A', marginBottom: 20 }} />
            <p style={{ marginTop: 0, fontSize: '1rem', fontWeight: 500 }}>Selecciona un reclamo para atenderlo.</p>
          </div>
        ) : (
          <>
            <div style={{ paddingBottom: 20, borderBottom: '1px solid #eee' }}>
              <h2 style={{ margin: 0, color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 700 }}>Conversación · Orden #{seleccionada.id_orden}</h2>
              <p style={{ margin: '12px 0 0', color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>
                <strong>{seleccionada.comprador}:</strong> {seleccionada.descripcion}
              </p>
              {seleccionada.evidencia_url && (
                <button onClick={() => window.open(`${getApiBaseUrl()}${seleccionada.evidencia_url}`, '_blank', 'noopener,noreferrer')} style={{ marginTop: 16, border: 0, background: '#f7e9ee', padding: '8px 16px', color: '#7A1E3A', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <IconEye width={16} height={16} strokeWidth={1.5} style={{ color: '#7A1E3A' }} /> Ver evidencia adjunta
                </button>
              )}
            </div>
            <div style={{ marginTop: 24, display: 'grid', gap: 16, flex: 1, overflowY: 'auto', minHeight: 200, maxHeight: 400, padding: '0 4px' }}>
              {mensajes.length === 0 && <p style={{ color: '#777', textAlign: 'center', padding: 32, fontSize: '0.95rem' }}>Aún no hay mensajes. Responde al comprador para iniciar la atención.</p>}
              {mensajes.map((item) => (
                <div key={item.id_mensaje} style={{ padding: 16, borderRadius: 12, background: item.rol === 'vendedor' ? '#f7e9ee' : '#fafafa', border: item.rol === 'vendedor' ? '1px solid #f0e0e6' : '1px solid #eee' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#333', fontWeight: 700 }}>{item.nombre_usuario}</strong>
                  <p style={{ margin: '8px 0 0', fontSize: '0.95rem', lineHeight: 1.6 }}>{item.mensaje}</p>
                </div>
              ))}
            </div>
            <form onSubmit={responder} style={{ marginTop: 24, display: 'grid', gap: 12 }}>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe tu respuesta al comprador..."
                required
                rows={4}
                style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #ddd', resize: 'vertical', fontSize: '0.95rem', lineHeight: 1.6, outline: 'none', transition: 'all 0.2s' }}
              />
              <button type="submit" className="btn btn-vinotinto" style={{ width: 'fit-content', padding: '12px 24px', borderRadius: 8, fontSize: '0.95rem', fontWeight: 700 }}>Enviar respuesta</button>
            </form>
          </>
        )}
      </div>
    </div>
  </>;
}