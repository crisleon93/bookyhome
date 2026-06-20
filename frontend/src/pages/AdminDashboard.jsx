import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../hooks/useAuth';
import api from '../services/api';
import { notify } from '../components/ToastProvider';
import {
  IconLayoutDashboard, IconTrendingUp, IconUser, IconBook, IconStore, IconPackage,
  IconSettings, IconChevronLeft, IconMenu, IconLogOut, IconLock, IconUnlock,
  IconCheck, IconBan, IconEye, IconTrash, IconDollar, IconCart,
} from '../components/Icons';

const VINOTINTO = '#7A1E3A';
const VINOTINTO_DARK = '#5e1629';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#666';
const WHITE = '#FFFFFF';
const BORDER = '#E0DBD4';
const GREEN = '#2e7d32';
const ORANGE = '#e67e22';
const RED = '#c62828';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconLayoutDashboard },
  { id: 'reportes',  label: 'Reportes',  Icon: IconTrendingUp },
  { id: 'usuarios',  label: 'Usuarios',  Icon: IconUser },
  { id: 'libros',    label: 'Libros',    Icon: IconBook },
  { id: 'tiendas',   label: 'Tiendas',   Icon: IconStore },
  { id: 'ordenes',   label: 'Órdenes',   Icon: IconPackage },
];

// Ícono de sidebar: tamaño y color fijos, ignora className/defaults de cada ícono
function SidebarIcon(props) {
  const IconComp = props.Icon;
  return (
    <IconComp className="" width={props.size || 20} height={props.size || 20} strokeWidth={2} style={{ color: '#FFFFFF', display: 'block' }} />
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ usuarios: 0, libros: 0, ordenes: 0, tiendas: 0 });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'admin') {
      navigate('/login');
      return;
    }

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

    cargarDatos();
  }, [navigate]);

  const ocultarLibro = async (id_libro, oculto_actual) => {
    try {
      await api.patch(`/libros/${id_libro}/ocultar`, { oculto: !oculto_actual });

      setLibros(libros.map((l) =>
        l.id_libro === id_libro ? { ...l, oculto: !oculto_actual } : l
      ));
      notify('Estado del libro actualizado', 'success');
    } catch (error) {
      console.error("Error en ocultar:", error);
      notify('Error al ocultar el libro', 'error');
    }
  };

  const eliminarLibro = async (id_libro) => {
    if (!window.confirm('¿Seguro que quieres eliminar este libro?')) return;
    try {
      const token = localStorage.getItem('token');

      await api.delete(`/libros/${id_libro}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setLibros(libros.filter((l) => l.id_libro !== id_libro));
      setStats((prev) => ({ ...prev, libros: prev.libros - 1 }));
      notify('Libro eliminado con éxito', 'success');
    } catch (error) {
      console.error("Error en eliminar:", error);
      const mensajeError = error.response?.data?.detail || 'Error al eliminar el libro';
      notify(mensajeError, 'error');
    }
  };

  const manejarEstadoTienda = async (idTienda, nuevoEstado) => {
    const mensajeConfirmacion = nuevoEstado === 'Activa'
      ? '¿Deseas aprobar y activar esta librería?'
      : '¿Seguro que deseas suspender esta librería?';

    if (!window.confirm(mensajeConfirmacion)) return;

    try {
      const token = localStorage.getItem('token');

      await api.patch(`/tiendas/${idTienda}/estado`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTiendas((tiendasActuales) =>
        tiendasActuales.map((t) =>
          t.id_tienda === idTienda
            ? { ...t, estado_tienda: nuevoEstado.toLowerCase() }
            : t
        )
      );

      notify(`Librería actualizada a: ${nuevoEstado}`, 'success');
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      const mensajeError = error.response?.data?.detail || 'Error al cambiar el estado';
      notify(mensajeError, 'error');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Montserrat', sans-serif" }}>Cargando panel admin...</div>;

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
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#444', textTransform: 'capitalize' }}>{label}</span>
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

  const sectionTitles = {
    dashboard: 'Dashboard Global',
    reportes: 'Sistema de Reportes',
    usuarios: 'Gestión de Usuarios',
    libros: 'Gestión de Libros',
    tiendas: 'Gestión de Tiendas',
    ordenes: 'Gestión de Órdenes',
  };
  const ActiveIcon = NAV_ITEMS.find((i) => i.id === activeSection)?.Icon;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", background: BEIGE }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '250px' : '76px',
        background: VINOTINTO, color: WHITE,
        padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: '6px',
        transition: 'width 0.25s ease', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          marginBottom: '26px', paddingLeft: sidebarOpen ? '10px' : 0,
        }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SidebarIcon Icon={IconSettings} size={22} />
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', color: WHITE,
              width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
            title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
          >
            {sidebarOpen
              ? <SidebarIcon Icon={IconChevronLeft} size={20} />
              : <SidebarIcon Icon={IconMenu} size={20} />}
          </button>
        </div>

        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                background: active ? 'rgba(255,255,255,0.18)' : 'none',
                border: 'none', color: '#FFFFFF',
                padding: sidebarOpen ? '12px 14px' : '12px',
                borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                fontWeight: 600, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                gap: '12px', fontFamily: "'Montserrat', sans-serif",
                transition: 'background 0.15s ease',
              }}
            >
              <span style={{ display: 'flex', flexShrink: 0 }}>
                <SidebarIcon Icon={item.Icon} size={20} />
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}

        <button
          onClick={() => navigate('/')}
          title={!sidebarOpen ? 'Volver al inicio' : undefined}
          style={{
            marginTop: 'auto', background: 'none',
            border: '1.5px solid rgba(255,255,255,0.35)', color: WHITE,
            padding: sidebarOpen ? '11px 14px' : '11px',
            borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
            display: 'flex', alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            gap: '10px', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem',
          }}
        >
          <SidebarIcon Icon={IconLogOut} size={18} />
          {sidebarOpen && <span>Volver al inicio</span>}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '40px', background: BEIGE, overflowX: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
          {ActiveIcon && (
            <div style={{
              width: '46px', height: '46px', borderRadius: '12px',
              background: '#F5EAED', color: VINOTINTO,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ActiveIcon className="" width={24} height={24} style={{ color: VINOTINTO }} />
            </div>
          )}
          <h1 style={{ margin: 0, color: VINOTINTO, fontSize: '1.7rem', fontWeight: 800 }}>
            {sectionTitles[activeSection]}
          </h1>
        </div>

        {/* DASHBOARD REESTRUCTURADO */}
        {activeSection === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Grid de 3 Tarjetas Operacionales Limpias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[
                { label: 'Total Usuarios', value: stats.usuarios, Icon: IconUser },
                { label: 'Total Libros',   value: stats.libros,  Icon: IconBook },
                { label: 'Total Tiendas',  value: stats.tiendas, Icon: IconStore },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: WHITE, borderRadius: '14px', padding: '28px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)', textAlign: 'center',
                  border: `1px solid ${BORDER}`,
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '26px',
                    background: '#F5EAED', color: VINOTINTO,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
                  }}>
                    <stat.Icon className="" width={24} height={24} style={{ color: VINOTINTO }} />
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: VINOTINTO, margin: '14px 0 4px' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: GRAY, fontWeight: 600, fontSize: '0.9rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Grid de Tablas de Monitoreo Directo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

              {/* Tabla: Últimos Usuarios */}
              <div style={{ background: WHITE, borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1px solid ${BORDER}` }}>
                <h3 style={{ margin: '0 0 16px', color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}>
                  <IconUser className="" width={20} height={20} style={{ color: VINOTINTO }} />
                  Últimos Usuarios Registrados
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${BEIGE}`, color: GRAY, textAlign: 'left' }}>
                        <th style={{ padding: '10px 8px' }}>Nombre</th>
                        <th style={{ padding: '10px 8px' }}>Correo</th>
                        <th style={{ padding: '10px 8px' }}>Rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...usuarios].reverse().slice(0, 5).map((u) => (
                        <tr key={u.id_usuario} style={{ borderBottom: '1px solid #FAF8F5' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>{u.nombre_usuario}</td>
                          <td style={{ padding: '10px 8px', color: '#555' }}>{u.correo_usuario}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              background: u.rol === 'admin' ? VINOTINTO : u.rol === 'vendedor' ? ORANGE : GREEN,
                              color: WHITE, padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                            }}>
                              {u.rol}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla: Últimas Tiendas */}
              <div style={{ background: WHITE, borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1px solid ${BORDER}` }}>
                <h3 style={{ margin: '0 0 16px', color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}>
                  <IconStore className="" width={20} height={20} style={{ color: VINOTINTO }} />
                  Últimas Tiendas Creadas
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${BEIGE}`, color: GRAY, textAlign: 'left' }}>
                        <th style={{ padding: '10px 8px' }}>Tienda</th>
                        <th style={{ padding: '10px 8px' }}>Teléfono</th>
                        <th style={{ padding: '10px 8px' }}>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tiendas].reverse().slice(0, 5).map((t) => (
                        <tr key={t.id_tienda} style={{ borderBottom: '1px solid #FAF8F5' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600, color: VINOTINTO }}>{t.nombre_tienda}</td>
                          <td style={{ padding: '10px 8px', color: '#555' }}>{t.telefono || '-'}</td>
                          <td style={{ padding: '10px 8px', color: GRAY }}>
                            {t.fecha_creacion
                              ? new Date(t.fecha_creacion).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* REPORTES */}
        {activeSection === 'reportes' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              {[
                { label: 'Total en ventas', value: `$${totalVentas.toLocaleString('es-CO')}`, Icon: IconDollar, color: GREEN },
                { label: 'Órdenes hoy',     value: ordenesHoy,                               Icon: IconCart,   color: '#2980b9' },
                { label: 'Libros activos',  value: stats.libros,                              Icon: IconBook,   color: '#8e44ad' },
              ].map((s) => (
                <div key={s.label} style={{
                  background: WHITE, borderRadius: '14px', padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px',
                  border: `1px solid ${BORDER}`,
                }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '23px',
                    background: '#F5EAED', color: s.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <s.Icon className="" width={22} height={22} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Usuarios por rol unificados */}
              <div style={{ background: WHITE, borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
                <h3 style={{ margin: '0 0 20px', color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IconUser className="" width={20} height={20} style={{ color: VINOTINTO }} /> Usuarios por rol
                </h3>
                {Object.entries(roleCount).map(([rol, count]) => (
                  <BarraProgreso
                    key={rol} label={rol} value={count}
                    max={stats.usuarios}
                    color={rol === 'admin' ? VINOTINTO : rol === 'vendedor' ? ORANGE : GREEN}
                  />
                ))}
              </div>

              {/* Libros por categoría */}
              <div style={{ background: WHITE, borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
                <h3 style={{ margin: '0 0 20px', color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IconBook className="" width={20} height={20} style={{ color: VINOTINTO }} /> Libros por categoría
                </h3>
                {Object.entries(categoriaCount).slice(0, 6).map(([cat, count]) => (
                  <BarraProgreso
                    key={cat} label={cat} value={count}
                    max={stats.libros} color={VINOTINTO}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* USUARIOS */}
        {activeSection === 'usuarios' && (
          <div style={{ background: WHITE, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <label style={{ marginRight: '10px', fontWeight: 600, alignSelf: 'center' }}>Filtrar por Rol:</label>
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`,
                  background: WHITE,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="todos">Todos los Usuarios</option>
                <option value="comprador">Compradores</option>
                <option value="vendedor">Vendedores</option>
                <option value="admin">Administradores</option>
              </select>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: VINOTINTO, color: WHITE }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Nombre</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Correo</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Rol</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.filter(u => filtroRol === 'todos' || u.rol === filtroRol).map((u, i) => (
                  <tr key={u.id_usuario} style={{
                    background: u.estado_usuario === 'Bloqueado' ? '#fff3f3' : i % 2 === 0 ? '#fafafa' : WHITE,
                    opacity: u.estado_usuario === 'Bloqueado' ? 0.7 : 1
                  }}>
                    <td style={{ padding: '12px 16px' }}>{u.id_usuario}</td>
                    <td style={{ padding: '12px 16px' }}>{u.nombre_usuario}</td>
                    <td style={{ padding: '12px 16px' }}>{u.correo_usuario}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: u.rol === 'admin' ? VINOTINTO : u.rol === 'vendedor' ? ORANGE : GREEN,
                        color: WHITE, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: u.estado_usuario === 'Bloqueado' ? RED : GREEN,
                        color: WHITE, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                      }}>
                        {u.estado_usuario === 'Bloqueado'
                          ? <IconLock className="" width={14} height={14} style={{ color: WHITE }} />
                          : <IconCheck className="" width={14} height={14} style={{ color: WHITE }} />}
                        {u.estado_usuario === 'Bloqueado' ? 'Bloqueado' : 'Activo'}
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
                          notify('Error al cambiar estado del usuario', 'error');
                        }
                      }} style={{
                        background: u.estado_usuario === 'Bloqueado' ? GREEN : RED,
                        color: WHITE, border: 'none', padding: '6px 12px',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                      }}>
                        {u.estado_usuario === 'Bloqueado'
                          ? <IconUnlock className="" width={14} height={14} style={{ color: WHITE }} />
                          : <IconLock className="" width={14} height={14} style={{ color: WHITE }} />}
                        {u.estado_usuario === 'Bloqueado' ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LIBROS */}
        {activeSection === 'libros' && (
          <div style={{ background: WHITE, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`, padding: '16px' }}>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555' }}>Filtrar por Categoría:</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #FAF8F5', background: WHITE, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
              >
                <option value="todas">Todas las Categorías</option>
                {[
                  "Arte", "Aventura", "Biografia", "Ciencia", "Comedia",
                  "Educacion", "Fantasia", "Ficcion", "Historia", "Infantil",
                  "Ingenieria", "Juvenil", "Romance", "Tecnologia", "Terror"
                ].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: VINOTINTO, color: WHITE }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Título</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Autor</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Precio</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Categoría</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {libros
                  .filter((l) => filtroCategoria === 'todas' || l.nombre_categoria === filtroCategoria)
                  .map((l, i) => (
                    <tr key={l.id_libro} style={{
                      background: l.oculto ? '#fff3f3' : i % 2 === 0 ? '#fafafa' : WHITE,
                      opacity: l.oculto ? 0.7 : 1,
                      borderBottom: '1px solid #FAF8F5'
                    }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{l.titulo}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{l.autor_libro}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>${Number(l.precio_libro).toLocaleString('es-CO')}</td>

                      <td style={{ padding: '12px 16px', color: '#666', fontSize: '0.85rem', fontWeight: 500 }}>
                        {l.nombre_categoria || 'Sin categoría'}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: l.oculto ? RED : GREEN,
                          color: WHITE, padding: '4px 10px', borderRadius: '20px',
                          fontSize: '0.8rem', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                        }}>
                          {l.oculto
                            ? <IconBan className="" width={14} height={14} style={{ color: WHITE }} />
                            : <IconCheck className="" width={14} height={14} style={{ color: WHITE }} />}
                          {l.oculto ? 'Oculto' : 'Visible'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => ocultarLibro(l.id_libro, l.oculto)} style={{
                          background: l.oculto ? GREEN : ORANGE, color: WHITE, border: 'none',
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                        }}>
                          {l.oculto
                            ? <IconEye className="" width={14} height={14} style={{ color: WHITE }} />
                            : <IconBan className="" width={14} height={14} style={{ color: WHITE }} />}
                          {l.oculto ? 'Mostrar' : 'Ocultar'}
                        </button>
                        <button onClick={() => eliminarLibro(l.id_libro)} style={{
                          background: RED, color: WHITE, border: 'none',
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                        }}>
                          <IconTrash className="" width={14} height={14} style={{ color: WHITE }} /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TIENDAS */}
        {activeSection === 'tiendas' && (
          <div style={{ background: WHITE, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`, padding: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: VINOTINTO, color: WHITE }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Nombre</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Dirección</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Teléfono</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tiendas.map((t, i) => (
                  <tr key={t.id_tienda} style={{ borderBottom: '1px solid #FAF8F5', background: i % 2 === 0 ? '#fafafa' : WHITE }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.id_tienda}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.nombre_tienda}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{t.direccion}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{t.telefono}</td>
                    <td style={{ padding: '12px 16px', color: '#777', fontSize: '0.9rem' }}>{t.fecha_creacion}</td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: t.estado_tienda?.toLowerCase() === 'activa' ? GREEN : t.estado_tienda?.toLowerCase() === 'suspendida' ? RED : ORANGE,
                        color: WHITE, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                      }}>
                        {t.estado_tienda || 'Pendiente'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {(t.estado_tienda?.toLowerCase() === 'pendiente' || !t.estado_tienda) && (
                        <button
                          onClick={() => manejarEstadoTienda(t.id_tienda, 'Activa')}
                          style={{ background: GREEN, color: WHITE, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          Aprobar
                        </button>
                      )}

                      {t.estado_tienda?.toLowerCase() === 'activa' && (
                        <button
                          onClick={() => manejarEstadoTienda(t.id_tienda, 'Suspendida')}
                          style={{ background: ORANGE, color: WHITE, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          Suspender
                        </button>
                      )}

                      {t.estado_tienda?.toLowerCase() === 'suspendida' && (
                        <button
                          onClick={() => manejarEstadoTienda(t.id_tienda, 'Activa')}
                          style={{ background: GREEN, color: WHITE, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ÓRDENES */}
        {activeSection === 'ordenes' && (
          <div style={{ background: WHITE, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
            {ordenes.length === 0 ? (
              <p style={{ padding: '30px', color: GRAY }}>No hay órdenes registradas.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: VINOTINTO, color: WHITE }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>ID Orden</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Total</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((o, i) => (
                    <tr key={o.id_orden} style={{ background: i % 2 === 0 ? '#fafafa' : WHITE }}>
                      <td style={{ padding: '12px 16px' }}>#{o.id_orden}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: o.estado === 'pagado' ? GREEN : ORANGE,
                          color: WHITE, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
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
        )}

      </main>
    </div>
  );
}