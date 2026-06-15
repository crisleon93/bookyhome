import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../hooks/useAuth';
import api from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    usuarios: 0,
    libros: 0,
    ordenes: 0,
    tiendas: 0,
  });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando panel admin...</div>;

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
          { id: 'usuarios', label: '👤 Usuarios' },
          { id: 'libros', label: '📚 Libros' },
          { id: 'tiendas', label: '🏪 Tiendas' },
          { id: 'ordenes', label: '📦 Órdenes' },
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
                { label: 'Total Libros', value: stats.libros, emoji: '📚' },
                { label: 'Total Tiendas', value: stats.tiendas, emoji: '🏪' },
                { label: 'Total Órdenes', value: stats.ordenes, emoji: '📦' },
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
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr key={u.id_usuario} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
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
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {libros.map((l, i) => (
                    <tr key={l.id_libro} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                      <td style={{ padding: '12px 16px' }}>{l.titulo}</td>
                      <td style={{ padding: '12px 16px' }}>{l.autor_libro}</td>
                      <td style={{ padding: '12px 16px' }}>${Number(l.precio_libro).toLocaleString('es-CO')}</td>
                      <td style={{ padding: '12px 16px' }}>
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
    <h1 style={{ marginBottom: '30px', color: '#6b1a2a' }}>
      🏪 Gestión de Tiendas
    </h1>

    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
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
            <tr
              key={t.id_tienda}
              style={{
                background: i % 2 === 0 ? '#fafafa' : 'white',
              }}
            >
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
                        <td style={{ padding: '12px 16px' }}>
                          ${Number(o.total || 0).toLocaleString('es-CO')}
                        </td>
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