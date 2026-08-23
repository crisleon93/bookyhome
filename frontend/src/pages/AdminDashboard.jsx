import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../hooks/useAuth';
import api, { getApiBaseUrl } from '../services/api';
import { notify } from '../components/ToastProvider';
import BookyPagoFinanzas from './BookyPagoFinanzas';
import {
  IconLayoutDashboard, IconTrendingUp, IconUser, IconBook, IconStore, IconPackage,
  IconSettings, IconChevronLeft, IconMenu, IconLogOut, IconLock, IconUnlock,
  IconCheck, IconBan, IconEye, IconTrash, IconDollar, IconCart, IconTool, IconAlertTriangle, IconWallet,
  IconInfo, IconTruck, IconMessage, IconStoreAlt, IconSearch, IconClose, IconPhone, IconMail,
} from '../components/Icons';

const ESTADO_CONFIG_ADMIN = {
  'Resuelto':      { bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#16a34a' },
  'En revision':   { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  'En revisión':   { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  'Abierto':       { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', dot: '#3b82f6' },
  'Cerrado':       { bg: '#f3f4f6', color: '#374151', border: '#d1d5db', dot: '#6b7280' },
  'Rechazado':     { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444' },
};

const MOTIVO_ICON_MAP_ADMIN = {
  'Libro danado o defectuoso': <IconBook width={14} height={14} />,
  'Producto incorrecto':       <IconPackage width={14} height={14} />,
  'No coincide con la descripcion': <IconInfo width={14} height={14} />,
  'Problema con la entrega':   <IconTruck width={14} height={14} />,
  'Otro':                      <IconMessage width={14} height={14} />,
};

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
  { id: 'finanzas',  label: 'Finanzas',  Icon: IconWallet },
  { id: 'reclamos',  label: 'Quejas y reclamos', Icon: IconAlertTriangle },
  { id: 'soporte',   label: 'Soporte técnico', Icon: IconTool },
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
  const [reclamos, setReclamos] = useState([]);
  const [soporte, setSoporte] = useState([]);
  const [vistaSoporte, setVistaSoporte] = useState('compradores');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReclamo, setModalReclamo] = useState(null);
  const [modalRespuesta, setModalRespuesta] = useState('');
  const [evidenciaPreview, setEvidenciaPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [paginaLibros, setPaginaLibros] = useState(1);
  const [paginaTiendas, setPaginaTiendas] = useState(1);
  const [filtroEstadoReclamos, setFiltroEstadoReclamos] = useState('Todos');
  const [busquedaReclamos, setBusquedaReclamos] = useState('');
  const [chatModalReclamo, setChatModalReclamo] = useState(null);
  const [chatMensajes, setChatMensajes] = useState([]);
  const [chatNuevoMensaje, setChatNuevoMensaje] = useState('');
  const [cargandoChat, setCargandoChat] = useState(false);
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  const abrirChatReclamo = async (reclamo) => {
    setChatModalReclamo(reclamo);
    setCargandoChat(true);
    try {
      const res = await api.get(`/quejas/${reclamo.id_solicitud}/mensajes`);
      setChatMensajes(res.data || []);
    } catch (err) {
      setChatMensajes([]);
    } finally {
      setCargandoChat(false);
    }
  };

  const enviarMensajeChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatNuevoMensaje.trim() || !chatModalReclamo) return;
    setEnviandoMensaje(true);
    try {
      await api.post(`/quejas/${chatModalReclamo.id_solicitud}/mensajes`, { mensaje: chatNuevoMensaje.trim() });
      setChatNuevoMensaje('');
      const res = await api.get(`/quejas/${chatModalReclamo.id_solicitud}/mensajes`);
      setChatMensajes(res.data || []);
      notify('Mensaje enviado a la tienda y comprador', 'success');
      cargarReclamos();
    } catch (err) {
      notify(err.response?.data?.detail || 'No se pudo enviar el mensaje', 'error');
    } finally {
      setEnviandoMensaje(false);
    }
  };

  function tiempoTranscurridoAdmin(fechaStr) {
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

  const registrosPorPagina = 10;

  const cargarReclamos = async () => {
    try {
      const res = await api.get('/quejas/admin/todas');
      setReclamos(res.data || []);
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudieron cargar los reclamos', 'error');
    }
  };

  const cargarSoporte = async () => {
    try {
      const res = await api.get('/quejas/admin/todas');
      setSoporte(res.data || []);
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudieron cargar los tickets de soporte', 'error');
    }
  };

  useEffect(() => {
    if (activeSection === 'reclamos') cargarReclamos();
    if (activeSection === 'soporte') cargarSoporte();
  }, [activeSection]);

  useEffect(() => {
    const refrescar = () => {
      if (activeSection === 'reclamos') cargarReclamos();
      if (activeSection === 'soporte') cargarSoporte();
    };
    window.addEventListener('bookyhome-complaint-updated', refrescar);
    const intervalId = window.setInterval(refrescar, 10000);
    return () => {
      window.removeEventListener('bookyhome-complaint-updated', refrescar);
      window.clearInterval(intervalId);
    };
  }, [activeSection]);

  const abrirModal = (reclamo, estado) => {
    setModalReclamo({ ...reclamo, estado });
    setModalRespuesta(reclamo.respuesta || '');
    setModalOpen(true);
  };

  const resolverReclamo = async () => {
    if (!modalRespuesta?.trim()) {
      notify('Por favor ingresa una respuesta', 'error');
      return;
    }
    try {
      await api.patch(`/quejas/admin/${modalReclamo.id_solicitud}`, { estado: modalReclamo.estado, respuesta: modalRespuesta.trim() });
      notify('Solicitud actualizada y usuario notificado', 'success');
      setModalOpen(false);
      if (activeSection === 'reclamos') cargarReclamos();
      if (activeSection === 'soporte') cargarSoporte();
    } catch (error) {
      notify(error.response?.data?.detail || 'No se pudo resolver la solicitud', 'error');
    }
  };

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'admin') {
      navigate('/');
      return;
    }

    const cargarDatos = async () => {
      try {
        const [usuariosRes, librosRes, ordenesRes, tiendasRes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/api/stored/libros'),
          api.get('/api/v1/admin/orders'),
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
        notify('Error cargando datos del panel. Verifica la consola.', 'error');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [navigate]);

  const ocultarLibro = async (idLibro, estadoOcultoActual) => {
    try {
      const token = localStorage.getItem('token');
      const nuevoEstadoBooleano = estadoOcultoActual === 1 ? false : true;

      await api.patch(`/libros/${idLibro}/ocultar`,
        { oculto: nuevoEstadoBooleano },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLibros((librosActuales) =>
        librosActuales.map((l) =>
          l.id_libro === idLibro ? { ...l, oculto: nuevoEstadoBooleano ? 1 : 0 } : l
        )
      );

      notify('Visibilidad del libro actualizada', 'success');
    } catch (error) {
      console.error("Error en ocultar:", error);
      notify('Error al cambiar la visibilidad del libro', 'error');
    }
  };

  const eliminarLibro = async (id_libro) => {
    if (!window.confirm('¿Seguro que quieres eliminar este libro?')) return;
    try {
      const token = localStorage.getItem('token');

      const res = await api.delete(`/libros/${id_libro}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.modo === 'ocultado') {
        setLibros(libros.map((l) =>
          l.id_libro === id_libro ? { ...l, oculto: 1 } : l
        ));
        notify(res.data.mensaje || 'El libro tiene compras registradas, se ocultó en vez de eliminarse', 'info');
      } else {
        setLibros(libros.filter((l) => l.id_libro !== id_libro));
        setStats((prev) => ({ ...prev, libros: prev.libros - 1 }));
        notify('Libro eliminado con éxito', 'success');
      }
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
    finanzas: 'BookyPago Finanzas',
    reclamos: 'Quejas y Reclamos',
    soporte: 'Soporte Técnico',
  };
  const ActiveIcon = NAV_ITEMS.find((i) => i.id === activeSection)?.Icon;
  const reclamosClientes = reclamos.filter((item) => item.tipo_solicitud === 'reclamo');
  const soporteCompradores = soporte.filter((item) => item.tipo_solicitud === 'soporte' && (item.rol_usuario || '').toLowerCase() === 'comprador');
  const soporteVendedores = soporte.filter((item) => item.tipo_solicitud === 'soporte' && (item.rol_usuario || '').toLowerCase() === 'vendedor');
  const soporteMostrado = vistaSoporte === 'compradores' ? soporteCompradores : soporteVendedores;

  // USUARIOS
  const usuariosFiltrados = usuarios.filter(
    u => filtroRol === 'todos' || u.rol === filtroRol
  );

  const totalPaginasUsuarios = Math.ceil(
    usuariosFiltrados.length / registrosPorPagina
  );

  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaUsuarios - 1) * registrosPorPagina,
    paginaUsuarios * registrosPorPagina
  );

  // LIBROS
  const librosFiltrados = libros.filter(
    l => filtroCategoria === 'todas' || l.nombre_categoria === filtroCategoria
  );

  const totalPaginasLibros = Math.ceil(
    librosFiltrados.length / registrosPorPagina
  );

  const librosPaginados = librosFiltrados.slice(
    (paginaLibros - 1) * registrosPorPagina,
    paginaLibros * registrosPorPagina
  );

  // TIENDAS
  const totalPaginasTiendas = Math.ceil(
    tiendas.length / registrosPorPagina
  );

  const tiendasPaginadas = tiendas.slice(
    (paginaTiendas - 1) * registrosPorPagina,
    paginaTiendas * registrosPorPagina
  );

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
          onClick={() => {
            localStorage.removeItem('token');
            navigate('/');
          }}
          title={!sidebarOpen ? 'Cerrar sesión' : undefined}
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
          {sidebarOpen && <span>Cerrar sesión</span>}
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
                { label: 'Órdenes hoy',     value: ordenesHoy,                               Icon: IconCart,   color: '#2980b9' },
                { label: 'Libros activos',  value: stats.libros,                              Icon: IconBook,   color: '#8e44ad' },
                { label: 'Tiendas activas', value: tiendas.filter(t => t.estado_tienda === 'activa').length, Icon: IconStore, color: GREEN },
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
              {/* Usuarios por rol */}
              <div style={{ background: WHITE, borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
                <h3 style={{ margin: '0 0 20px', color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IconUser className="" width={20} height={20} style={{ color: VINOTINTO }} /> Usuarios por rol
                </h3>
                {Object.entries(roleCount).map(([rol, count], idx) => (
                  <BarraProgreso
                    key={`rol-${rol}-${idx}`} label={rol} value={count}
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
                {Object.entries(categoriaCount).slice(0, 6).map(([cat, count], idx) => (
                  <BarraProgreso
                    key={`categoria-${cat}-${idx}`} label={cat} value={count}
                    max={stats.libros} color={VINOTINTO}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
              {/* Tiendas por estado */}
              <div style={{ background: WHITE, borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
                <h3 style={{ margin: '0 0 20px', color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IconStore className="" width={20} height={20} style={{ color: VINOTINTO }} /> Tiendas por estado
                </h3>
                {(() => {
                  const tiendaEstadoCount = tiendas.reduce((acc, t) => {
                    const estado = t.estado_tienda || 'desconocido';
                    acc[estado] = (acc[estado] || 0) + 1;
                    return acc;
                  }, {});
                  return Object.entries(tiendaEstadoCount).map(([estado, count], idx) => (
                    <BarraProgreso
                      key={`tienda-estado-${estado}-${idx}`} label={estado} value={count}
                      max={stats.tiendas}
                      color={estado === 'activa' ? GREEN : estado === 'pendiente' ? ORANGE : RED}
                    />
                  ));
                })()}
              </div>

              {/* Órdenes por estado */}
              <div style={{ background: WHITE, borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}` }}>
                <h3 style={{ margin: '0 0 20px', color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IconPackage className="" width={20} height={20} style={{ color: VINOTINTO }} /> Órdenes por estado
                </h3>
                {(() => {
                  const ordenEstadoCount = ordenes.reduce((acc, o) => {
                    const estado = o.estado || 'desconocido';
                    acc[estado] = (acc[estado] || 0) + 1;
                    return acc;
                  }, {});
                  return Object.entries(ordenEstadoCount).map(([estado, count], idx) => (
                    <BarraProgreso
                      key={`orden-estado-${estado}-${idx}`} label={estado} value={count}
                      max={stats.ordenes}
                      color={estado === 'completada' ? GREEN : estado === 'pendiente' ? ORANGE : RED}
                    />
                  ));
                })()}
              </div>
            </div>
          </>
        )}

        {/* USUARIOS */}
        {activeSection === 'usuarios' && (
          <div style={{ background: WHITE, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`, padding: '16px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <label style={{ marginRight: '10px', fontWeight: 600, alignSelf: 'center' }}>Filtrar por Rol:</label>
              <select
                value={filtroRol}
                onChange={(e) => {
                  setFiltroRol(e.target.value);
                  setPaginaUsuarios(1);
                }}
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
                {usuariosPaginados.map((u, i) => (
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

            {usuariosFiltrados.length > registrosPorPagina && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px'
                }}
              >
                <span>
                  Mostrando {(paginaUsuarios - 1) * registrosPorPagina + 1}-{Math.min(paginaUsuarios * registrosPorPagina, usuariosFiltrados.length)} de {usuariosFiltrados.length} usuarios
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPaginaUsuarios(paginaUsuarios - 1)}
                    disabled={paginaUsuarios === 1}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: paginaUsuarios === 1 ? '#ccc' : VINOTINTO,
                      color: WHITE,
                      cursor: 'pointer'
                    }}
                  >
                    Anterior
                  </button>

                  <span style={{ padding: '8px 12px', fontWeight: 600 }}>
                    {paginaUsuarios} / {totalPaginasUsuarios}
                  </span>

                  <button
                    onClick={() => setPaginaUsuarios(paginaUsuarios + 1)}
                    disabled={paginaUsuarios === totalPaginasUsuarios}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background:
                        paginaUsuarios === totalPaginasUsuarios
                          ? '#ccc'
                          : VINOTINTO,
                      color: WHITE,
                      cursor: 'pointer'
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIBROS */}
        {activeSection === 'libros' && (
          <div style={{ background: WHITE, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`, padding: '16px' }}>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555' }}>Filtrar por Categoría:</label>
              <select
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value);
                  setPaginaLibros(1);
                }}
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
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Tienda</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Precio</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Categoría</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {librosPaginados.map((l, i) => (
                  <tr key={l.id_libro} style={{
                    background: l.oculto ? '#fff3f3' : i % 2 === 0 ? '#fafafa' : WHITE,
                    opacity: l.oculto ? 0.7 : 1,
                    borderBottom: '1px solid #FAF8F5'
                  }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{l.titulo}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{l.autor_libro}</td>
                    <td style={{ padding: '12px 16px', color: '#7A1E3A', fontWeight: 600 }}>{l.nombre_tienda || '—'}</td>
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
                      <button
                        onClick={() => ocultarLibro(l.id_libro, l.oculto)}
                        style={{
                          background: (l.oculto === 1 || l.oculto === true || l.oculto == "1") ? '#6c757d' : VINOTINTO,
                          color: WHITE,
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          opacity: (l.oculto === 1 || l.oculto === true || l.oculto == "1") ? 0.6 : 1
                        }}
                      >
                        {(l.oculto === 1 || l.oculto === true || l.oculto == "1") ? 'Mostrar' : 'Ocultar'}
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

            {librosFiltrados.length > registrosPorPagina && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px'
                }}
              >
                <span>
                  Mostrando {(paginaLibros - 1) * registrosPorPagina + 1}-{Math.min(paginaLibros * registrosPorPagina, librosFiltrados.length)} de {librosFiltrados.length} libros
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPaginaLibros(paginaLibros - 1)}
                    disabled={paginaLibros === 1}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: paginaLibros === 1 ? '#ccc' : VINOTINTO,
                      color: WHITE,
                      cursor: 'pointer'
                    }}
                  >
                    Anterior
                  </button>

                  <span style={{ padding: '8px 12px', fontWeight: 600 }}>
                    {paginaLibros} / {totalPaginasLibros}
                  </span>

                  <button
                    onClick={() => setPaginaLibros(paginaLibros + 1)}
                    disabled={paginaLibros === totalPaginasLibros}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background:
                        paginaLibros === totalPaginasLibros
                          ? '#ccc'
                          : VINOTINTO,
                      color: WHITE,
                      cursor: 'pointer'
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
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
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Fecha Registro</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tiendasPaginadas.map((t, i) => (
                  <tr key={t.id_tienda} style={{ borderBottom: '1px solid #FAF8F5', background: i % 2 === 0 ? '#fafafa' : WHITE }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.id_tienda}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.nombre_tienda}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{t.direccion}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{t.telefono}</td>
                    <td style={{ padding: '12px 16px', color: '#777', fontSize: '0.9rem' }}>{t.fecha_creacion}</td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: t.estado_tienda?.toLowerCase() === 'suspendida' ? RED : GREEN,
                        color: WHITE, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                      }}>
                        {t.estado_tienda?.toLowerCase() === 'suspendida' ? 'Suspendida' : 'Activa'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {t.estado_tienda?.toLowerCase() === 'suspendida' ? (
                        <button
                          onClick={() => manejarEstadoTienda(t.id_tienda, 'Activa')}
                          style={{ background: GREEN, color: WHITE, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          Reactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => manejarEstadoTienda(t.id_tienda, 'Suspendida')}
                          style={{ background: ORANGE, color: WHITE, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          Suspender
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {tiendas.length > registrosPorPagina && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px'
                }}
              >
                <span>
                  Mostrando {(paginaTiendas - 1) * registrosPorPagina + 1}-{Math.min(paginaTiendas * registrosPorPagina, tiendas.length)} de {tiendas.length} tiendas
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPaginaTiendas(paginaTiendas - 1)}
                    disabled={paginaTiendas === 1}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: paginaTiendas === 1 ? '#ccc' : VINOTINTO,
                      color: WHITE,
                      cursor: 'pointer'
                    }}
                  >
                    Anterior
                  </button>

                  <span style={{ padding: '8px 12px', fontWeight: 600 }}>
                    {paginaTiendas} / {totalPaginasTiendas}
                  </span>

                  <button
                    onClick={() => setPaginaTiendas(paginaTiendas + 1)}
                    disabled={paginaTiendas === totalPaginasTiendas}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background:
                        paginaTiendas === totalPaginasTiendas
                          ? '#ccc'
                          : VINOTINTO,
                      color: WHITE,
                      cursor: 'pointer'
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUEJAS Y RECLAMOS */}
        {activeSection === 'reclamos' && (() => {
          const reclamosFiltrados = reclamosClientes.filter((r) => {
            const matchEstado = filtroEstadoReclamos === 'Todos' || r.estado === filtroEstadoReclamos;
            const q = busquedaReclamos.toLowerCase().trim();
            if (!q) return matchEstado;
            const matchTexto =
              (r.comprador || '').toLowerCase().includes(q) ||
              (r.nombre_tienda || '').toLowerCase().includes(q) ||
              (r.asunto || '').toLowerCase().includes(q) ||
              (r.descripcion || '').toLowerCase().includes(q) ||
              String(r.id_solicitud || '').includes(q) ||
              String(r.id_orden || '').includes(q) ||
              (r.titulo_libro || '').toLowerCase().includes(q);
            return matchEstado && matchTexto;
          });

          const totalAbiertos = reclamosClientes.filter(r => r.estado === 'Abierto').length;
          const totalEnRevision = reclamosClientes.filter(r => r.estado === 'En revisión' || r.estado === 'En revision').length;
          const totalResueltos = reclamosClientes.filter(r => r.estado === 'Resuelto').length;
          const totalRechazados = reclamosClientes.filter(r => r.estado === 'Rechazado' || r.estado === 'Cerrado').length;

          return (
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* STATS HEADER CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fdf2f4', display: 'grid', placeItems: 'center', color: VINOTINTO }}>
                    <IconAlertTriangle width={24} height={24} strokeWidth={2} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Reclamos</p>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: CARBON }}>{reclamosClientes.length}</h3>
                  </div>
                </div>

                <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: totalAbiertos > 0 ? '1.5px solid #93c5fd' : `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', display: 'grid', placeItems: 'center', color: '#1e40af' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>!</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abiertos (Pendientes)</p>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: '#1e40af' }}>{totalAbiertos}</h3>
                  </div>
                </div>

                <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff7ed', display: 'grid', placeItems: 'center', color: '#ea580c' }}>
                    <IconTool width={24} height={24} strokeWidth={2} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#ea580c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En Revisión</p>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: '#ea580c' }}>{totalEnRevision}</h3>
                  </div>
                </div>

                <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#dcfce7', display: 'grid', placeItems: 'center', color: '#16a34a' }}>
                    <IconCheck width={24} height={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resueltos</p>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: '#166534' }}>{totalResueltos}</h3>
                  </div>
                </div>
              </div>

              {/* SEARCH & FILTERS BAR */}
              <div style={{ background: WHITE, borderRadius: 16, padding: '16px 20px', border: `1px solid ${BORDER}`, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, background: '#fafafa', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px' }}>
                  <IconSearch width={18} height={18} style={{ color: GRAY }} />
                  <input
                    type="text"
                    value={busquedaReclamos}
                    onChange={(e) => setBusquedaReclamos(e.target.value)}
                    placeholder="Buscar por comprador, tienda, orden o ID..."
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit', color: CARBON }}
                  />
                  {busquedaReclamos && (
                    <button onClick={() => setBusquedaReclamos('')} style={{ border: 0, background: 'none', cursor: 'pointer', color: GRAY, padding: 0 }}>
                      <IconClose width={16} height={16} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { id: 'Todos', label: 'Todos', activeBg: VINOTINTO, activeBorder: VINOTINTO, inactiveBg: '#fdf8f9', inactiveBorder: '#f0dde4', inactiveColor: VINOTINTO, dot: VINOTINTO },
                    { id: 'Abierto', label: 'Abierto', activeBg: '#2563eb', activeBorder: '#2563eb', inactiveBg: '#eff6ff', inactiveBorder: '#bfdbfe', inactiveColor: '#1e40af', dot: '#3b82f6' },
                    { id: 'En revisión', label: 'En revisión', activeBg: '#ea580c', activeBorder: '#ea580c', inactiveBg: '#fff7ed', inactiveBorder: '#fed7aa', inactiveColor: '#c2410c', dot: '#ea580c' },
                    { id: 'Resuelto', label: 'Resuelto', activeBg: '#16a34a', activeBorder: '#16a34a', inactiveBg: '#f0fdf4', inactiveBorder: '#bbf7d0', inactiveColor: '#15803d', dot: '#16a34a' },
                    { id: 'Rechazado', label: 'Rechazado', activeBg: '#dc2626', activeBorder: '#dc2626', inactiveBg: '#fef2f2', inactiveBorder: '#fecaca', inactiveColor: '#b91c1c', dot: '#ef4444' },
                  ].map((p) => {
                    const activo = filtroEstadoReclamos === p.id;
                    const count = p.id === 'Todos' ? reclamosClientes.length : reclamosClientes.filter(r => r.estado === p.id || (p.id === 'En revisión' && r.estado === 'En revision')).length;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setFiltroEstadoReclamos(p.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 20,
                          border: `1.5px solid ${activo ? p.activeBorder : p.inactiveBorder}`,
                          background: activo ? p.activeBg : p.inactiveBg,
                          color: activo ? WHITE : p.inactiveColor,
                          fontWeight: 700,
                          fontSize: '0.83rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          boxShadow: activo ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: activo ? WHITE : p.dot,
                          display: 'inline-block',
                        }} />
                        {p.label}
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: 10,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: activo ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                          color: activo ? WHITE : p.inactiveColor,
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIST OF COMPLAINTS */}
              {reclamosFiltrados.length === 0 ? (
                <div style={{ background: WHITE, borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: GRAY, border: `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: CARBON }}>No hay quejas ni reclamos que coincidan con la búsqueda.</p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: GRAY }}>Prueba cambiando el filtro o término de búsqueda.</p>
                </div>
              ) : (
                reclamosFiltrados.map((reclamo) => {
                  const cfg = ESTADO_CONFIG_ADMIN[reclamo.estado] || ESTADO_CONFIG_ADMIN['Cerrado'];
                  const motivoIcon = MOTIVO_ICON_MAP_ADMIN[reclamo.asunto] || MOTIVO_ICON_MAP_ADMIN['Otro'];
                  const fechaStr = reclamo.fecha_creacion
                    ? new Date(reclamo.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                    : null;
                  const tiempoStr = tiempoTranscurridoAdmin(reclamo.fecha_creacion);
                  const imgSrc = reclamo.imagen_libro
                    ? (reclamo.imagen_libro.startsWith('http') ? reclamo.imagen_libro : `${getApiBaseUrl()}${reclamo.imagen_libro}`)
                    : null;

                  return (
                    <article
                      key={reclamo.id_solicitud}
                      style={{
                        background: WHITE,
                        border: `1.5px solid ${BORDER}`,
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 3px 14px rgba(0,0,0,0.04)',
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      {/* HEADER BANNER */}
                      <div style={{
                        background: 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
                        padding: '16px 20px',
                        borderBottom: `1.5px solid ${BORDER}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {/* Image or ID Box */}
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt="Libro"
                              style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #f0dde4', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                            />
                          ) : (
                            <div style={{
                              width: 50, height: 50, borderRadius: 10, flexShrink: 0,
                              background: VINOTINTO, color: WHITE,
                              display: 'grid', placeItems: 'center',
                              fontSize: '0.78rem', fontWeight: 800,
                              boxShadow: '0 2px 8px rgba(122,30,58,0.2)',
                            }}>
                              #{reclamo.id_solicitud}
                            </div>
                          )}

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                              <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Reclamo #{reclamo.id_solicitud}
                              </span>
                              {reclamo.id_orden && (
                                <span style={{ background: '#f7e9ee', color: VINOTINTO, padding: '2px 8px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700 }}>
                                  Orden #{reclamo.id_orden}
                                </span>
                              )}
                            </div>
                            <strong style={{ fontSize: '1rem', color: CARBON, display: 'block' }}>
                              {reclamo.titulo_libro || `Orden #${reclamo.id_orden || reclamo.id_solicitud}`}
                              {reclamo.total_items > 1 && (
                                <span style={{ fontWeight: 500, color: GRAY, fontSize: '0.85rem' }}> +{reclamo.total_items - 1} más</span>
                              )}
                            </strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: GRAY }}>
                              Comprador: <strong style={{ color: CARBON }}>{reclamo.comprador}</strong>
                              {reclamo.correo_comprador ? ` (${reclamo.correo_comprador})` : ''} · Tienda: <strong style={{ color: VINOTINTO }}>{reclamo.nombre_tienda || 'BookyHome'}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: cfg.bg, color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          padding: '6px 14px', borderRadius: 20,
                          fontSize: '0.82rem', fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                          {reclamo.estado}
                        </div>
                      </div>

                      {/* BODY CONTENT */}
                      <div style={{ padding: '20px', display: 'grid', gap: 16 }}>
                        {/* Metadata Tags Row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            {/* Motivo Chip */}
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: '#fdf2f4', border: '1px solid #f0dde4',
                              borderRadius: 20, padding: '5px 12px',
                              color: VINOTINTO, fontSize: '0.82rem', fontWeight: 700,
                            }}>
                              {motivoIcon}
                              {reclamo.asunto}
                            </div>

                            {/* Tienda Chip */}
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: '#f0f9ff', border: '1px solid #bae6fd',
                              borderRadius: 20, padding: '5px 12px',
                              color: '#0369a1', fontSize: '0.82rem', fontWeight: 700,
                            }}>
                              <IconStoreAlt width={14} height={14} strokeWidth={1.5} />
                              {reclamo.nombre_tienda || 'BookyHome'}
                            </div>

                            {/* Total Orden (if exists) */}
                            {reclamo.total_orden && (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: 20, padding: '5px 12px',
                                color: '#166534', fontSize: '0.82rem', fontWeight: 700,
                              }}>
                                <IconDollar width={13} height={13} strokeWidth={2} />
                                ${Number(reclamo.total_orden).toLocaleString('es-CO')}
                              </div>
                            )}

                            {/* Fecha */}
                            {fechaStr && (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: '#fafafa', border: `1px solid ${BORDER}`,
                                borderRadius: 20, padding: '5px 12px',
                                color: GRAY, fontSize: '0.8rem', fontWeight: 600,
                              }}>
                                📅 {fechaStr}
                              </div>
                            )}
                          </div>

                          {/* Relative Time */}
                          {tiempoStr && (
                            <span style={{ fontSize: '0.78rem', color: '#999', fontWeight: 600 }}>
                              {tiempoStr}
                            </span>
                          )}
                        </div>

                        {/* Customer Description */}
                        {reclamo.descripcion && (
                          <div style={{ background: '#fafafa', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '0.78rem', fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Detalle del reclamo por el cliente:
                            </p>
                            <p style={{ margin: 0, color: CARBON, fontSize: '0.94rem', lineHeight: 1.6 }}>
                              {reclamo.descripcion}
                            </p>
                          </div>
                        )}

                        {/* Evidencia Adjunta */}
                        {reclamo.evidencia_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fdf8f9', border: '1px solid #f0dde4', borderRadius: 12, padding: '12px 16px' }}>
                            <img
                              src={`${getApiBaseUrl()}${reclamo.evidencia_url}`}
                              alt="Evidencia thumbnail"
                              onClick={() => setEvidenciaPreview(`${getApiBaseUrl()}${reclamo.evidencia_url}`)}
                              style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: '1px solid #f0dde4', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                            />
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '0.88rem', color: VINOTINTO, display: 'block' }}>Evidencia gráfica adjunta</strong>
                              <span style={{ fontSize: '0.8rem', color: GRAY }}>Haz clic para ampliar la imagen adjunta por el usuario.</span>
                            </div>
                            <button
                              onClick={() => setEvidenciaPreview(`${getApiBaseUrl()}${reclamo.evidencia_url}`)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: WHITE, border: '1.5px solid #f0dde4',
                                color: VINOTINTO, padding: '7px 14px', borderRadius: 8,
                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#fdf2f4'; e.currentTarget.style.borderColor = VINOTINTO; }}
                              onMouseLeave={e => { e.currentTarget.style.background = WHITE; e.currentTarget.style.borderColor = '#f0dde4'; }}
                            >
                              <IconEye width={15} height={15} /> Ver evidencia
                            </button>
                          </div>
                        )}

                        {/* Admin Previous Response (if exists) */}
                        {reclamo.respuesta && (
                          <div style={{
                            padding: '14px 18px',
                            background: 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
                            borderRadius: 12,
                            borderLeft: `4px solid ${VINOTINTO}`,
                            borderTop: '1px solid #f0dde4',
                            borderRight: '1px solid #f0dde4',
                            borderBottom: '1px solid #f0dde4',
                          }}>
                            <strong style={{ color: VINOTINTO, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                              <IconMessage width={15} height={15} /> Respuesta actual del administrador:
                            </strong>
                            <p style={{ margin: 0, color: '#444', lineHeight: 1.6, fontSize: '0.92rem' }}>
                              {reclamo.respuesta}
                            </p>
                          </div>
                        )}

                        {/* ACTION FOOTER BUTTONS */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 10,
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: 16,
                          borderTop: `1px solid ${BORDER}`,
                        }}>
                          {/* Botón de Contacto / Chat con la tienda */}
                          <button
                            onClick={() => abrirChatReclamo(reclamo)}
                            style={{
                              border: '1.5px solid #7A1E3A',
                              background: '#fdf8f9',
                              color: VINOTINTO,
                              borderRadius: 10,
                              padding: '10px 18px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: '0 2px 8px rgba(122,30,58,0.06)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f7e9ee'; e.currentTarget.style.borderColor = VINOTINTO_DARK; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fdf8f9'; e.currentTarget.style.borderColor = VINOTINTO; }}
                          >
                            <IconStoreAlt width={17} height={17} strokeWidth={1.8} />
                            Contactar / Chat con la tienda
                          </button>

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => abrirModal(reclamo, 'En revisión')}
                            style={{
                              border: '1.5px solid #fdba74',
                              background: '#fff7ed',
                              color: '#ea580c',
                              borderRadius: 10,
                              padding: '10px 18px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ffedd5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed'; }}
                          >
                            <IconTool width={16} height={16} />
                            Marcar En revisión
                          </button>

                          <button
                            onClick={() => abrirModal(reclamo, 'Rechazado')}
                            style={{
                              border: '1.5px solid #fca5a5',
                              background: '#fef2f2',
                              color: '#dc2626',
                              borderRadius: 10,
                              padding: '10px 18px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                          >
                            <IconBan width={16} height={16} />
                            Rechazar reclamo
                          </button>

                          <button
                            onClick={() => abrirModal(reclamo, 'Resuelto')}
                            style={{
                              border: 'none',
                              background: VINOTINTO,
                              color: WHITE,
                              borderRadius: 10,
                              padding: '10px 22px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              boxShadow: '0 4px 14px rgba(122,30,58,0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = VINOTINTO_DARK; }}
                            onMouseLeave={e => { e.currentTarget.style.background = VINOTINTO; }}
                          >
                            <IconCheck width={16} height={16} strokeWidth={2.5} />
                            Resolver y notificar
                          </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          );
        })()}

        {/* SOPORTE TÉCNICO */}
        {activeSection === 'soporte' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <button onClick={() => setVistaSoporte('compradores')} style={{ border: vistaSoporte === 'compradores' ? `2px solid ${VINOTINTO}` : `1px solid ${BORDER}`, background: vistaSoporte === 'compradores' ? VINOTINTO : WHITE, color: vistaSoporte === 'compradores' ? WHITE : VINOTINTO, borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s' }}>Soporte · Compradores</button>
              <button onClick={() => setVistaSoporte('vendedores')} style={{ border: vistaSoporte === 'vendedores' ? `2px solid ${VINOTINTO}` : `1px solid ${BORDER}`, background: vistaSoporte === 'vendedores' ? VINOTINTO : WHITE, color: vistaSoporte === 'vendedores' ? WHITE : VINOTINTO, borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s' }}>Soporte · Vendedores</button>
            </div>
            {soporteMostrado.length === 0 ? (
              <div style={{ background: WHITE, borderRadius: 14, padding: 40, textAlign: 'center', color: GRAY, border: `1px solid ${BORDER}` }}>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>No hay tickets de soporte pendientes para {vistaSoporte === 'compradores' ? 'compradores' : 'vendedores'}.</p>
              </div>
            ) : (
              soporteMostrado.map((ticket) => (
                <article key={ticket.id_solicitud} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <strong style={{ fontSize: '1.1rem', color: VINOTINTO }}>Soporte #{ticket.id_solicitud}</strong>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 600 }}>{(ticket.rol_usuario || '').toLowerCase() === 'vendedor' ? 'Vendedor' : 'Comprador'}</span>
                      </div>
                      <p style={{ margin: '4px 0', color: GRAY, fontSize: '0.95rem' }}>{ticket.comprador}</p>
                    </div>
                    <span style={{ background: ticket.estado === 'Resuelto' ? '#dcfce7' : ticket.estado === 'En revisión' ? '#fff7ed' : '#f3f4f6', color: CARBON, padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{ticket.estado}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '1rem', color: CARBON }}>{ticket.asunto}</p>
                  <p style={{ margin: '0 0 12px', color: '#555', lineHeight: 1.5 }}>{ticket.descripcion}</p>
                  {ticket.respuesta && (
                    <div style={{ margin: '12px 0', padding: 14, background: BEIGE, borderRadius: 10, borderLeft: `4px solid ${VINOTINTO}` }}>
                      <strong style={{ color: VINOTINTO, display: 'block', marginBottom: 4 }}>Respuesta del administrador:</strong>
                      <p style={{ margin: 0, color: '#555', lineHeight: 1.5 }}>{ticket.respuesta}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                    <button onClick={() => abrirModal(ticket, 'En revisión')} style={{ border: `1px solid ${VINOTINTO}`, background: WHITE, color: VINOTINTO, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}>En revisión</button>
                    <button onClick={() => abrirModal(ticket, 'Resuelto')} style={{ border: 0, background: VINOTINTO, color: WHITE, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}>Resolver y notificar</button>
                  </div>
                </article>
              ))
            )}
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

        {evidenciaPreview && (
          <div onClick={() => setEvidenciaPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 3000, display: 'grid', placeItems: 'center', padding: 24 }}>
            <img onClick={(e) => e.stopPropagation()} src={evidenciaPreview} alt="Evidencia del reclamo" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 10, background: WHITE }} />
          </div>
        )}

        {/* Modal para respuesta */}
        {modalOpen && (
          <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'grid', placeItems: 'center', padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: WHITE, borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ margin: 0, color: modalReclamo?.estado === 'Rechazado' ? '#dc2626' : modalReclamo?.estado === 'En revisión' ? '#ea580c' : VINOTINTO, fontSize: '1.35rem', fontWeight: 800 }}>
                  {modalReclamo?.estado === 'En revisión'
                    ? 'Marcar como En revisión'
                    : modalReclamo?.estado === 'Rechazado'
                    ? 'Rechazar solicitud'
                    : 'Resolver y notificar al usuario'}
                </h2>
                <button onClick={() => setModalOpen(false)} style={{ border: 0, background: '#f5f5f5', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: GRAY, display: 'grid', placeItems: 'center' }}>
                  <IconClose width={16} height={16} />
                </button>
              </div>

              <div style={{ background: '#fafafa', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ margin: 0, color: CARBON, fontSize: '0.88rem', fontWeight: 600 }}>
                  {modalReclamo?.tipo_solicitud === 'soporte' ? 'Ticket de Soporte' : 'Reclamo'} #{modalReclamo?.id_solicitud}
                  {modalReclamo?.id_orden ? ` · Orden #${modalReclamo.id_orden}` : ''}
                </p>
                <p style={{ margin: '2px 0 0', color: GRAY, fontSize: '0.82rem' }}>
                  Usuario: <strong style={{ color: CARBON }}>{modalReclamo?.comprador}</strong>
                </p>
              </div>

              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: CARBON, fontSize: '0.9rem' }}>
                Respuesta o resolución para el usuario:
              </label>
              <textarea
                value={modalRespuesta}
                onChange={(e) => setModalRespuesta(e.target.value)}
                placeholder="Escribe aquí la respuesta o solución que recibirá el usuario por correo y en su panel..."
                rows={5}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 10,
                  border: `1.5px solid ${BORDER}`,
                  fontSize: '0.95rem',
                  fontFamily: "'Montserrat', sans-serif",
                  resize: 'vertical',
                  marginBottom: 20,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = VINOTINTO}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '11px 22px',
                    borderRadius: 10,
                    border: `1px solid ${BORDER}`,
                    background: WHITE,
                    color: GRAY,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    transition: 'all 0.2s',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={resolverReclamo}
                  style={{
                    padding: '11px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: modalReclamo?.estado === 'Rechazado' ? '#dc2626' : modalReclamo?.estado === 'En revisión' ? '#ea580c' : VINOTINTO,
                    color: WHITE,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s',
                  }}
                >
                  {modalReclamo?.estado === 'En revisión'
                    ? 'Confirmar En revisión'
                    : modalReclamo?.estado === 'Rechazado'
                    ? 'Confirmar Rechazo'
                    : 'Resolver y notificar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FINANZAS - BOOKYPAGO */}
        {activeSection === 'finanzas' && (
          <BookyPagoFinanzas />
        )}

        {/* MODAL DE CHAT Y CONTACTO CON LA TIENDA */}
        {chatModalReclamo && (
          <div onClick={() => setChatModalReclamo(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 4500, display: 'grid', placeItems: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: WHITE, borderRadius: 20, width: '100%', maxWidth: 650, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
              {/* MODAL HEADER */}
              <div style={{ background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)', padding: '18px 24px', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
                    <IconStoreAlt width={24} height={24} style={{ color: WHITE }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: WHITE }}>
                      {chatModalReclamo.nombre_tienda || 'Tienda / Librería'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
                      Reclamo #{chatModalReclamo.id_solicitud} · Orden #{chatModalReclamo.id_orden}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setChatModalReclamo(null)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: WHITE, width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '1rem', fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>

              {/* INFO DE CONTACTO DIRECTO */}
              <div style={{ padding: '14px 24px', background: '#fdf8f9', borderBottom: `1px solid ${BORDER}`, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.84rem' }}>
                  {chatModalReclamo.nombre_vendedor && (
                    <span style={{ color: CARBON }}>
                      Vendedor: <strong style={{ color: VINOTINTO }}>{chatModalReclamo.nombre_vendedor}</strong>
                    </span>
                  )}
                  {chatModalReclamo.correo_vendedor && (
                    <a
                      href={`mailto:${chatModalReclamo.correo_vendedor}?subject=Consulta Reclamo #${chatModalReclamo.id_solicitud} - BookyHome`}
                      style={{ color: '#0369a1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600 }}
                    >
                      <IconMail width={15} height={15} />
                      {chatModalReclamo.correo_vendedor}
                    </a>
                  )}
                  {chatModalReclamo.telefono_tienda && (
                    <a
                      href={`https://wa.me/${chatModalReclamo.telefono_tienda.replace(/\D/g, '')}?text=Hola,%20te%20escribo%20desde%20la%20administracion%20de%20BookyHome%20respecto%20al%20reclamo%20%23${chatModalReclamo.id_solicitud}%20de%20la%20orden%20%23${chatModalReclamo.id_orden}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
                    >
                      <IconPhone width={15} height={15} />
                      {chatModalReclamo.telefono_tienda} (WhatsApp)
                    </a>
                  )}
                </div>
              </div>

              {/* DETALLE DEL CASO */}
              <div style={{ padding: '12px 24px', background: '#fafafa', borderBottom: `1px solid ${BORDER}`, fontSize: '0.85rem' }}>
                <strong style={{ color: GRAY, textTransform: 'uppercase', fontSize: '0.74rem', letterSpacing: '0.05em' }}>Motivo reclamado por {chatModalReclamo.comprador}:</strong>
                <p style={{ margin: '4px 0 0', color: CARBON, fontWeight: 600 }}>
                  "{chatModalReclamo.asunto}" — <span style={{ fontWeight: 400, color: '#555' }}>{chatModalReclamo.descripcion}</span>
                </p>
              </div>

              {/* TIMELINE DE MENSAJES */}
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 220, maxHeight: 320, background: '#fcfcfc' }}>
                {cargandoChat ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: GRAY }}>Cargando conversación...</div>
                ) : chatMensajes.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: GRAY }}>
                    <div style={{ fontSize: '2rem', marginBottom: 6 }}>💬</div>
                    <p style={{ margin: 0, fontWeight: 600, color: CARBON, fontSize: '0.92rem' }}>Aún no hay mensajes en este reclamo.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Escribe un mensaje abajo para comunicarte con la tienda y el comprador.</p>
                  </div>
                ) : (
                  chatMensajes.map((m) => {
                    const esAdmin = (m.rol || '').toLowerCase() === 'admin' || (m.rol || '').toLowerCase() === 'administrador';
                    const esVendedor = (m.rol || '').toLowerCase() === 'vendedor';

                    return (
                      <div
                        key={m.id_mensaje}
                        style={{
                          alignSelf: esAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          background: esAdmin ? '#fdf2f4' : esVendedor ? '#fff7ed' : '#ffffff',
                          border: `1.5px solid ${esAdmin ? '#f0dde4' : esVendedor ? '#fed7aa' : '#e5e7eb'}`,
                          borderRadius: 14,
                          padding: '10px 14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <strong style={{ fontSize: '0.84rem', color: esAdmin ? VINOTINTO : esVendedor ? '#ea580c' : '#2563eb' }}>
                            {m.nombre_usuario}
                          </strong>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: 10,
                            background: esAdmin ? VINOTINTO : esVendedor ? '#ea580c' : '#2563eb',
                            color: WHITE,
                            fontWeight: 700,
                          }}>
                            {esAdmin ? 'Administrador' : esVendedor ? 'Librería' : 'Comprador'}
                          </span>
                          {m.fecha_creacion && (
                            <span style={{ fontSize: '0.72rem', color: '#aaa', marginLeft: 'auto' }}>
                              {new Date(m.fecha_creacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: CARBON, fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {m.mensaje}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* INPUT FORM PARA ENVIAR MENSAJE */}
              <form onSubmit={enviarMensajeChat} style={{ padding: '16px 24px', background: WHITE, borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={chatNuevoMensaje}
                  onChange={(e) => setChatNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje o indicación para la tienda y el cliente..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${BORDER}`,
                    outline: 'none',
                    fontSize: '0.92rem',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = VINOTINTO}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
                <button
                  type="submit"
                  disabled={enviandoMensaje || !chatNuevoMensaje.trim()}
                  style={{
                    background: VINOTINTO,
                    color: WHITE,
                    border: 'none',
                    borderRadius: 10,
                    padding: '0 20px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: enviandoMensaje || !chatNuevoMensaje.trim() ? 'not-allowed' : 'pointer',
                    opacity: enviandoMensaje || !chatNuevoMensaje.trim() ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <IconMessage width={16} height={16} />
                  {enviandoMensaje ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
