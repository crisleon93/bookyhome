import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../hooks/useAuth';
import api from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ usuarios: 0, libros: 0, ordenes: 0, tiendas: 0 });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'admin') { navigate('/login'); return; }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [usuariosRes, librosRes, ordenesRes, tiendasRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/api/stored/libros'),
        api.get('/api/v1/orders'),
        api.get('/tiendas'),
      ]);
      setUsuarios(usuariosRes.data);
      setLibros(librosRes.data);
      setOrdenes(ordenesRes.data);
      setTiendas(tiendasRes.data);
      setStats({
        usuarios: usuariosRes.data.length,
        libros: librosRes.data.length,
        ordenes: ordenesRes.data.length,
        tiendas: tiendasRes.data.length,
      });
    } catch (error) {
      console.error('Error cargando datos admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarLibro = async (id_libro) => {
    if (!window.confirm('¿Seguro que quieres eliminar este libro?')) return;
    try {
      await api.delete(`/libros/${id_libro}`);
      setLibros(libros.filter((l) => l.id_libro !== id_libro));
      setStats((prev) => ({ ...prev, libros: prev.libros - 1 }));
    } catch (error) {
      alert('Error al eliminar el libro');
    }
  };

  const ocultarLibro = async (id_libro, oculto_actual) => {
  try {
    await api.patch(`/libros/${id_libro}/ocultar`, { oculto: !oculto_actual });
    setLibros(libros.map((l) =>
      l.id_libro === id_libro ? { ...l, oculto: !oculto_actual } : l
    ));
  } catch (error) {
    alert('Error al ocultar el libro');
  }
};

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando panel admin...</div>;

  // Datos para reportes
  const roleCount = usuarios.reduce((acc, u) => {
    acc[u.rol] = (acc[u.rol] || 0) + 1;
    return acc;
  }, {});

  const categoriaCount = libros.reduce((acc, l) => {
    const cat = l.nombre_categoria || 'Sin categoría';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const totalVentas = ordenes.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const ordenesHoy = ordenes.filter((o) => {
    if (!o.fecha) return false;
    const hoy = new Date().toLocaleDateString('es-CO');
    return new Date(o.fecha).toLocaleDateString('es-CO') === hoy;
  }).length;

  const BarraProgreso = ({ label, value, max, color }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#444' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ background: '#f0f0f0', borderRadius: '20px', height: '10px' }}>
        <div style={{
          background: color, borderRadius: '20px', height: '10px',
          width: `${max > 0 ? (value / max) * 100 : 0}%`, transition: 'width 0.4s ease'
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px', background: '#6b1a2a', color: 'white',
        padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        <h2 style={{ margin: '0 0 30px 0', fontSize: '1.2rem' }}>⚙️ Admin Panel</h2>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'reportes',  label: '📈 Reportes' },
          { id: 'usuarios',  label: '👤 Usuarios' },
          { id: 'libros',    label: '📚 Libros' },
          { id: 'tiendas',   label: '🏪 Tiendas' },
          { id: 'ordenes',   label: '📦 Órdenes' },
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveSection(item.id)} style={{
            background: activeSection === item.id ? 'rgba(255,255,255,0.2)' : 'none',
            border: 'none', color: 'white', padding: '12px 16px', borderRadius: '8px',
            cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.9rem'
          }}>
            {item.label}
          </button>
        ))}
        <button onClick={() => navigate('/')} style={{
          marginTop: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.4)',
          color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
        }}>
          ← Volver al inicio
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '40px', background: '#f9f6f4' }}>

        {/* DASHBOARD */}
        {activeSection === 'dashboard' && (
          <>
            <h1 style={{ marginBottom: '30px', color: '#6b1a2a' }}>📊 Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {[
                { label: 'Total Usuarios', value: stats.usuarios, emoji: '👤' },
                { label: 'Total Libros',   value: stats.libros,   emoji: '📚' },
                { label: 'Total Tiendas',  value: stats.tiendas,  emoji: '🏪' },
                { label: 'Total Órdenes',  value: stats.ordenes,  emoji: '📦' },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: 'white', borderRadius: '12px', padding: '30px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem' }}>{stat.emoji}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6b1a2a', margin: '10px 0' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#666', fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REPORTES */}
        {activeSection === 'reportes' && (
          <>
            <h1 style={{ marginBottom: '30px', color: '#6b1a2a' }}>📈 Sistema de Reportes</h1>

            {/* Tarjetas resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              {[
                { label: 'Total en ventas', value: `$${totalVentas.toLocaleString('es-CO')}`, emoji: '💰', color: '#27ae60' },
                { label: 'Órdenes hoy',     value: ordenesHoy,                                emoji: '🛒', color: '#2980b9' },
                { label: 'Libros activos',  value: stats.libros,                              emoji: '📚', color: '#8e44ad' },
              ].map((s) => (
                <div key={s.label} style={{
                  background: 'white', borderRadius: '12px', padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                  <div style={{ fontSize: '2rem' }}>{s.emoji}</div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

              {/* Usuarios por rol */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 20px', color: '#6b1a2a' }}>👤 Usuarios por rol</h3>
                {Object.entries(roleCount).map(([rol, count]) => (
                  <BarraProgreso
                    key={rol} label={rol} value={count}
                    max={stats.usuarios}
                    color={rol === 'admin' ? '#6b1a2a' : rol === 'vendedor' ? '#e67e22' : '#27ae60'}
                  />
                ))}
              </div>

              {/* Libros por categoría */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 20px', color: '#6b1a2a' }}>📚 Libros por categoría</h3>
                {Object.entries(categoriaCount).slice(0, 6).map(([cat, count]) => (
                  <BarraProgreso
                    key={cat} label={cat} value={count}
                    max={stats.libros} color="#6b1a2a"
                  />
                ))}
              </div>

              {/* Resumen de tiendas */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 20px', color: '#6b1a2a' }}>🏪 Tiendas registradas</h3>
                {tiendas.map((t) => (
                  <div key={t.id_tienda} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.nombre_tienda}</span>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>{t.fecha_creacion}</span>
                  </div>
                ))}
              </div>

              {/* Estado de órdenes */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 20px', color: '#6b1a2a' }}>📦 Estado de órdenes</h3>
                {ordenes.length === 0 ? (
                  <p style={{ color: '#888' }}>No hay órdenes registradas.</p>
                ) : (
                  (() => {
                    const estadoCount = ordenes.reduce((acc, o) => {
                      acc[o.estado] = (acc[o.estado] || 0) + 1;
                      return acc;
                    }, {});
                    return Object.entries(estadoCount).map(([estado, count]) => (
                      <BarraProgreso
                        key={estado} label={estado} value={count}
                        max={stats.ordenes}
                        color={estado === 'pagado' ? '#27ae60' : '#e67e22'}
                      />
                    ));
                  })()
                )}
              </div>

            </div>
          </>
        )}

        {/* USUARIOS */}
{activeSection === 'usuarios' && (
  <>
    <h1 style={{ marginBottom: '30px', color: '#6b1a2a' }}>👤 Gestión de Usuarios</h1>
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#6b1a2a', color: 'white' }}>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Nombre</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Correo</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Rol</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, i) => (
            <tr key={u.id_usuario} style={{
              background: u.estado_usuario === 'Bloqueado' ? '#fff3f3' : i % 2 === 0 ? '#fafafa' : 'white',
              opacity: u.estado_usuario === 'Bloqueado' ? 0.7 : 1
            }}>
              <td style={{ padding: '12px 16px' }}>{u.id_usuario}</td>
              <td style={{ padding: '12px 16px' }}>{u.nombre_usuario}</td>
              <td style={{ padding: '12px 16px' }}>{u.correo_usuario}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  background: u.rol === 'admin' ? '#6b1a2a' : u.rol === 'vendedor' ? '#e67e22' : '#27ae60',
                  color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                }}>
                  {u.rol}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  background: u.estado_usuario === 'Bloqueado' ? '#e74c3c' : '#27ae60',
                  color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                }}>
                  {u.estado_usuario === 'Bloqueado' ? '🔒 Bloqueado' : '✅ Activo'}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <button onClick={async () => {
                  const bloqueado = u.estado_usuario !== 'Bloqueado';
                  try {
                    await api.patch(`/usuarios/${u.id_usuario}/bloquear`, { bloqueado });
                    setUsuarios(usuarios.map(us =>
                      us.id_usuario === u.id_usuario
                        ? { ...us, estado_usuario: bloqueado ? 'Bloqueado' : 'Activo' }
                        : us
                    ));
                  } catch {
                    alert('Error al cambiar estado del usuario');
                  }
                }} style={{
                  background: u.estado_usuario === 'Bloqueado' ? '#27ae60' : '#e74c3c',
                  color: 'white', border: 'none', padding: '6px 12px',
                  borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                }}>
                  {u.estado_usuario === 'Bloqueado' ? '🔓 Desbloquear' : '🔒 Bloquear'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)}

        {/* LIBROS */}
{activeSection === 'libros' && (
  <>
    <h1 style={{ marginBottom: '30px', color: '#6b1a2a' }}>📚 Gestión de Libros</h1>
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#6b1a2a', color: 'white' }}>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Título</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Autor</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Precio</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
            <th style={{ padding: '14px 16px', textAlign: 'left' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {libros.map((l, i) => (
            <tr key={l.id_libro} style={{
              background: l.oculto ? '#fff3f3' : i % 2 === 0 ? '#fafafa' : 'white',
              opacity: l.oculto ? 0.7 : 1
            }}>
              <td style={{ padding: '12px 16px' }}>{l.titulo}</td>
              <td style={{ padding: '12px 16px' }}>{l.autor_libro}</td>
              <td style={{ padding: '12px 16px' }}>${Number(l.precio_libro).toLocaleString('es-CO')}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{
                  background: l.oculto ? '#e74c3c' : '#27ae60',
                  color: 'white', padding: '4px 10px', borderRadius: '20px',
                  fontSize: '0.8rem', fontWeight: 600
                }}>
                  {l.oculto ? '🚫 Oculto' : '✅ Visible'}
                </span>
              </td>
              <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                <button onClick={() => ocultarLibro(l.id_libro, l.oculto)} style={{
                  background: l.oculto ? '#27ae60' : '#e67e22', color: 'white', border: 'none',
                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                }}>
                  {l.oculto ? '👁 Mostrar' : '🚫 Ocultar'}
                </button>
                <button onClick={() => eliminarLibro(l.id_libro)} style={{
                  background: '#e74c3c', color: 'white', border: 'none',
                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                }}>
                  🗑 Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)}

        {/* TIENDAS */}
        {activeSection === 'tiendas' && (
          <>
            <h1 style={{ marginBottom: '30px', color: '#6b1a2a' }}>🏪 Gestión de Tiendas</h1>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#6b1a2a', color: 'white' }}>
                    <th style={{ padding: '14px' }}>ID</th>
                    <th style={{ padding: '14px' }}>Nombre</th>
                    <th style={{ padding: '14px' }}>Dirección</th>
                    <th style={{ padding: '14px' }}>Teléfono</th>
                    <th style={{ padding: '14px' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {tiendas.map((t, i) => (
                    <tr key={t.id_tienda} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                      <td style={{ padding: '12px' }}>{t.id_tienda}</td>
                      <td style={{ padding: '12px' }}>{t.nombre_tienda}</td>
                      <td style={{ padding: '12px' }}>{t.direccion}</td>
                      <td style={{ padding: '12px' }}>{t.telefono}</td>
                      <td style={{ padding: '12px' }}>{t.fecha_creacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ÓRDENES */}
        {activeSection === 'ordenes' && (
          <>
            <h1 style={{ marginBottom: '30px', color: '#6b1a2a' }}>📦 Gestión de Órdenes</h1>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {ordenes.length === 0 ? (
                <p style={{ padding: '30px', color: '#666' }}>No hay órdenes registradas.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#6b1a2a', color: 'white' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>ID Orden</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>Total</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o, i) => (
                      <tr key={o.id_orden} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ padding: '12px 16px' }}>#{o.id_orden}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: o.estado === 'pagado' ? '#27ae60' : '#e67e22',
                            color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                          }}>
                            {o.estado}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>${Number(o.total || 0).toLocaleString('es-CO')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {o.fecha ? new Date(o.fecha).toLocaleDateString('es-CO') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}