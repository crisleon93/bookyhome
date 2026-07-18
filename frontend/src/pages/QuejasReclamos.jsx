import { useCallback, useEffect, useState } from 'react';
import { crearQueja, getOrdenes, getQuejas, getApiBaseUrl } from '../services/api';
import { IconCheck, IconAlertTriangle, IconEye, IconPackage } from '../components/Icons';

const MOTIVOS = [
  'Libro dañado o defectuoso',
  'Producto incorrecto',
  'No coincide con la descripción',
  'Problema con la entrega',
  'Otro',
];

export default function QuejasReclamos() {
  const [ordenes, setOrdenes] = useState([]);
  const [quejas, setQuejas] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState('');
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [evidencia, setEvidencia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [vistaEvidencia, setVistaEvidencia] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [ordenesRes, quejasRes] = await Promise.all([getOrdenes(), getQuejas()]);
      const solicitudes = quejasRes.data || [];
      const ordenesConSolicitudActiva = new Set(solicitudes
        .filter((item) => ['Abierto', 'En revisión'].includes(item.estado))
        .map((item) => Number(item.id_orden)));
      setOrdenes((ordenesRes.data || []).filter((orden) =>
        orden.estado === 'pagado' && !ordenesConSolicitudActiva.has(Number(orden.id_orden))
      ));
      setQuejas(solicitudes);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar tus compras y reclamos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const enviar = async (event) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    if (!ordenSeleccionada || !motivo) {
      setError('Selecciona una compra y un motivo.');
      return;
    }
    const data = new FormData();
    data.append('id_orden', ordenSeleccionada);
    data.append('motivo', motivo);
    data.append('descripcion', descripcion.trim() || motivo);
    if (evidencia) data.append('evidencia', evidencia);
    setEnviando(true);
    try {
      await crearQueja(data);
      setOrdenSeleccionada('');
      setMotivo('');
      setDescripcion('');
      setEvidencia(null);
      setMensaje('Solicitud enviada. El administrador revisará tu caso.');
      await cargar();
      window.dispatchEvent(new Event('bookyhome-complaint-updated'));
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 2rem 2.5rem' }}>
      <section className="pl-card" style={{ padding: '2.5rem 2rem', marginBottom: 24, borderRadius: 20, background: 'linear-gradient(135deg, #fff 0%, #faf8f6 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #f7e9ee 0%, #f0e0e6 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 20px rgba(122, 30, 58, 0.15)' }}>
            <IconAlertTriangle width={38} height={38} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />
          </span>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#7A1E3A', letterSpacing: '-0.5px' }}>Quejas y reclamos</h1>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1rem', lineHeight: 1.5 }}>Reporta un problema de una compra pagada y adjunta evidencia si la tienes.</p>
          </div>
        </div>
      </section>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 12, padding: '18px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.95rem', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)' }}>{error}</div>}
      {mensaje && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: 12, padding: '18px 24px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.1)' }}><IconCheck width={24} />{mensaje}</div>}

      <form onSubmit={enviar} className="pl-card" style={{ padding: '2.5rem 2rem', display: 'grid', gap: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: 20, marginBottom: 8 }}>
          <h2 style={{ margin: 0, color: '#7A1E3A', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px' }}>Nueva queja o reclamo</h2>
          <p style={{ color: '#666', marginBottom: 0, marginTop: 8, fontSize: '1rem', lineHeight: 1.6 }}>Solo aparecen compras pagadas de tu cuenta.</p>
        </div>
        {cargando ? (
          <p style={{ color: '#777', padding: 32, textAlign: 'center', fontSize: '1rem' }}>Cargando compras...</p>
        ) : ordenes.length === 0 ? (
          <div style={{ padding: 48, background: 'linear-gradient(135deg, #faf8f6 0%, #f5f0e8 100%)', borderRadius: 16, textAlign: 'center', border: '1px solid #f0ebe4', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <IconAlertTriangle width={48} height={48} strokeWidth={1.5} style={{ color: '#7A1E3A', marginBottom: 16 }} />
            <p style={{ marginBottom: 0, marginTop: 12, color: '#666', fontSize: '1.1rem', fontWeight: 500 }}>No tienes compras pagadas disponibles para una nueva solicitud.</p>
          </div>
        ) : (
          <>
            <label style={{ display: 'grid', gap: 10, fontWeight: 700, fontSize: '1rem' }}>
              Selecciona una compra pagada
              <select value={ordenSeleccionada} onChange={(e) => setOrdenSeleccionada(e.target.value)} required style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #ddd', fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}>
                <option value="">Selecciona una compra pagada</option>
                {ordenes.map((orden) => <option key={orden.id_orden} value={orden.id_orden}>Orden #{orden.id_orden} · ${Number(orden.total || 0).toLocaleString('es-CO')}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 10, fontWeight: 700, fontSize: '1rem' }}>
              Motivo del reclamo
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} required style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #ddd', fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}>
                <option value="">Selecciona un motivo</option>
                {MOTIVOS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 10, fontWeight: 700, fontSize: '1rem' }}>
              Evidencia (opcional)
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setEvidencia(e.target.files?.[0] || null)} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #ddd', fontSize: '0.95rem' }} />
            </label>
            <label style={{ display: 'grid', gap: 10, fontWeight: 700, fontSize: '1rem' }}>
              Descripción del problema (opcional)
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={6} placeholder="Describe el problema con más detalle..." style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #ddd', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', lineHeight: 1.6, resize: 'vertical' }} />
            </label>
            <button disabled={enviando} className="btn btn-vinotinto" style={{ width: 'fit-content', padding: '16px 32px', borderRadius: 12, fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(122, 30, 58, 0.2)', transition: 'all 0.2s' }}>{enviando ? 'Enviando...' : 'Enviar solicitud'}</button>
          </>
        )}
      </form>

      <section className="pl-card" style={{ padding: '2.5rem 2rem', marginTop: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <h2 style={{ marginTop: 0, color: '#7A1E3A', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 24 }}>Mis quejas y reclamos</h2>
        {quejas.length === 0 ? (
          <p style={{ color: '#777', textAlign: 'center', padding: 48, fontSize: '1rem' }}>No tienes solicitudes previas.</p>
        ) : (
          quejas.map((queja) => (
            <article key={queja.id_solicitud} style={{ borderTop: '1px solid #eee', padding: '24px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <strong style={{ fontSize: '1.15rem', color: '#333', fontWeight: 700 }}>Orden #{queja.id_orden} · {queja.asunto}</strong>
                </div>
                <span style={{ background: queja.estado === 'Resuelto' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : queja.estado === 'En revisión' ? 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', color: '#333', padding: '6px 14px', borderRadius: 14, fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>{queja.estado}</span>
              </div>
              <p style={{ margin: '12px 0', color: '#666', lineHeight: 1.6, fontSize: '1rem' }}>{queja.descripcion}</p>
              {queja.evidencia_url && (
                <button type="button" onClick={() => setVistaEvidencia(`${getApiBaseUrl()}${queja.evidencia_url}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, border: 0, background: 'linear-gradient(135deg, #f7e9ee 0%, #f0e0e6 100%)', padding: '10px 18px', color: '#7A1E3A', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', borderRadius: 10, boxShadow: '0 2px 8px rgba(122, 30, 58, 0.1)', transition: 'all 0.2s' }}>
                  <IconEye width={18} height={18} strokeWidth={1.5} style={{ color: '#7A1E3A' }} /> Ver evidencia
                </button>
              )}
              {queja.respuesta && (
                <div style={{ margin: '16px 0 0', padding: 18, background: 'linear-gradient(135deg, #faf8f6 0%, #f5f0e8 100%)', borderRadius: 12, borderLeft: '4px solid #7A1E3A', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <strong style={{ color: '#7A1E3A', display: 'block', marginBottom: 6, fontSize: '0.95rem', fontWeight: 700 }}>Respuesta del administrador:</strong>
                  <p style={{ margin: 0, color: '#555', lineHeight: 1.6, fontSize: '1rem' }}>{queja.respuesta}</p>
                </div>
              )}
            </article>
          ))
        )}
      </section>
      {vistaEvidencia && <div onClick={() => setVistaEvidencia(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.8)', display: 'grid', placeItems: 'center', padding: 32 }}><img onClick={(e) => e.stopPropagation()} src={vistaEvidencia} alt="Evidencia" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} /></div>}
    </div>
  );
}
