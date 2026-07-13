import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDevoluciones, getPedidosElegiblesDevolucion, solicitarDevolucion } from '../services/api';
import { IconPackage, IconCheck, IconInfo } from '../components/Icons';

const MOTIVOS = [
  'Producto dañado o defectuoso',
  'Producto incorrecto',
  'No coincide con la descripción',
  'Llegó tarde',
  'Ya no lo necesito',
  'Otro',
];

const ESTADO_STYLES = {
  Solicitada: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
  'En Revision': { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  Aprobada: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  Reembolsada: { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
  Rechazada: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function Devoluciones() {
  const navigate = useNavigate();
  const [elegibles, setElegibles] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState('');
  const [motivo, setMotivo] = useState('');
  const [comentarios, setComentarios] = useState('');

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [elegiblesRes, devolucionesRes] = await Promise.all([
        getPedidosElegiblesDevolucion(),
        getDevoluciones(),
      ]);
      setElegibles(elegiblesRes.data || []);
      setDevoluciones(devolucionesRes.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.response?.data?.detail || 'No se pudieron cargar los datos de devoluciones');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    cargarDatos();
  }, [cargarDatos, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!ordenSeleccionada) {
      setError('Selecciona un pedido');
      return;
    }
    if (!motivo) {
      setError('Selecciona un motivo');
      return;
    }

    setEnviando(true);
    try {
      await solicitarDevolucion({
        id_orden: Number(ordenSeleccionada),
        motivo,
        comentarios: comentarios.trim() || undefined,
      });
      setOrdenSeleccionada('');
      setMotivo('');
      setComentarios('');
      setExito('Solicitud de devolución enviada correctamente');
      await cargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const getEstadoStyle = (estado) =>
    ESTADO_STYLES[estado] || { bg: '#f9fafb', color: '#374151', border: '#d1d5db' };

  return (
    <main className="auth-main" style={{ alignItems: 'flex-start', paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
        <div className="pl-card" style={{ padding: '2.5rem 2rem', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconPackage width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Devoluciones</h1>
              <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.9rem' }}>
                Solicita devoluciones de pedidos entregados o en tránsito
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="pl-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#888' }}>Cargando información...</p>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16, marginBottom: 20, color: '#991b1b' }}>
                {error}
              </div>
            )}
            {exito && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 16, marginBottom: 20, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconCheck width={18} height={18} strokeWidth={2} />
                {exito}
              </div>
            )}

            <div className="pl-card" style={{ padding: '2rem', marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 8px', color: 'var(--vinotinto)' }}>Nueva solicitud</h2>
              <p style={{ margin: '0 0 20px', color: '#666', fontSize: '0.9rem' }}>
                Solo puedes solicitar devolución en pedidos entregados, pagados o enviados sin solicitud activa.
              </p>

              {elegibles.length === 0 ? (
                <div style={{ background: '#faf8f6', borderRadius: 8, padding: 20, textAlign: 'center' }}>
                  <IconInfo width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A', marginBottom: 8 }} />
                  <p style={{ margin: 0, color: '#666' }}>No tienes pedidos elegibles para devolución en este momento.</p>
                  {!localStorage.getItem('token') && (
                    <p style={{ margin: '10px 0 0' }}>
                      <Link to="/login">Inicia sesión</Link> para ver tus pedidos.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#444' }}>Pedido</label>
                    <select
                      value={ordenSeleccionada}
                      onChange={(e) => setOrdenSeleccionada(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <option value="">Selecciona un pedido</option>
                      {elegibles.map((orden) => (
                        <option key={orden.id_orden} value={orden.id_orden}>
                          Orden #{orden.id_orden} — {formatCurrency(orden.total)} — {orden.estado_orden} ({formatFecha(orden.fecha_orden)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#444' }}>Motivo</label>
                    <select
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <option value="">Selecciona un motivo</option>
                      {MOTIVOS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#444' }}>Comentarios (opcional)</label>
                    <textarea
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                      rows={4}
                      placeholder="Describe el problema con más detalle..."
                      style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Montserrat, sans-serif', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-vinotinto"
                    disabled={enviando}
                    style={{ width: 'auto', alignSelf: 'flex-start' }}
                  >
                    {enviando ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </form>
              )}
            </div>

            <div className="pl-card" style={{ padding: '2rem' }}>
              <h2 style={{ margin: '0 0 20px', color: 'var(--vinotinto)' }}>Mis devoluciones</h2>

              {devoluciones.length === 0 ? (
                <p style={{ color: '#888' }}>No tienes solicitudes de devolución previas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {devoluciones.map((dev) => {
                    const estilo = getEstadoStyle(dev.estado_devolucion);
                    return (
                      <div
                        key={dev.id_devolucion}
                        style={{
                          padding: 20,
                          border: `1px solid ${estilo.border}`,
                          borderRadius: 10,
                          background: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ margin: '0 0 4px', fontWeight: 700 }}>Orden #{dev.id_orden}</p>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                              Solicitada el {formatFecha(dev.fecha_solicitud)}
                            </p>
                          </div>
                          <span
                            style={{
                              background: estilo.bg,
                              color: estilo.color,
                              border: `1px solid ${estilo.border}`,
                              padding: '4px 12px',
                              borderRadius: 20,
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {dev.estado_devolucion}
                          </span>
                        </div>

                        <p style={{ margin: '12px 0 4px', color: '#444' }}>
                          <strong>Motivo:</strong> {dev.motivo}
                        </p>
                        <p style={{ margin: '4px 0', color: '#666', fontSize: '0.9rem' }}>
                          Total del pedido: {formatCurrency(dev.total_orden)}
                        </p>

                        {dev.tipo_resolucion && (
                          <p style={{ margin: '4px 0', color: '#666', fontSize: '0.9rem' }}>
                            Resolución: {dev.tipo_resolucion}
                            {dev.monto_reembolso ? ` — ${formatCurrency(dev.monto_reembolso)}` : ''}
                          </p>
                        )}
                        {dev.fecha_resolucion && (
                          <p style={{ margin: '4px 0', color: '#888', fontSize: '0.85rem' }}>
                            Resuelta el {formatFecha(dev.fecha_resolucion)}
                          </p>
                        )}
                        {dev.notas_vendedor && (
                          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            Nota del vendedor: {dev.notas_vendedor}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
