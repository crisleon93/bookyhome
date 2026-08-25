import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../hooks/useAuth';
import api, { getApiBaseUrl } from '../services/api';
import { notify } from '../components/ToastProvider';
import BookyPagoFinanzas from './BookyPagoFinanzas';
import SeccionPerfilAdmin from '../components/dashboard/SeccionPerfilAdmin';
import {
  IconLayoutDashboard, IconTrendingUp, IconUser, IconUsers, IconBook, IconStore, IconPackage,
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
  { id: 'perfil',    label: 'Mi Perfil', Icon: IconSettings },
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
  const [perfilSidebar, setPerfilSidebar] = useState({ nombre: '', correo: '', foto: null, bannerUrl: null, bannerColor: '#7A1E3A' });

  useEffect(() => {
    const cargarPerfilSidebar = async () => {
      try {
        const res = await api.get('/perfil/mi-perfil');
        if (!res.data) return;
        const base = getApiBaseUrl();
        setPerfilSidebar({
          nombre: res.data.nombre_usuario || 'Administrador',
          correo: res.data.correo_usuario || '',
          foto: res.data.foto_perfil ? `${base}/${res.data.foto_perfil.replace(/^\//, '')}` : null,
          bannerUrl: res.data.banner_perfil ? `${base}/${res.data.banner_perfil.replace(/^\//, '')}` : null,
          bannerColor: res.data.banner_perfil ? null : (res.data.banner_color || '#7A1E3A'),
        });
      } catch (error) {
        console.error('Error cargando perfil del sidebar:', error);
      }
    };
    cargarPerfilSidebar();

    const handlePhotoUpdate = (e) => {
      if (e.detail?.url) setPerfilSidebar(p => ({ ...p, foto: e.detail.url }));
    };
    const handleBannerUpdate = (e) => {
      if (e.detail?.bannerUrl) setPerfilSidebar(p => ({ ...p, bannerUrl: e.detail.bannerUrl, bannerColor: null }));
      else if (e.detail?.bannerColor) setPerfilSidebar(p => ({ ...p, bannerColor: e.detail.bannerColor, bannerUrl: null }));
    };
    window.addEventListener('profile-photo-updated', handlePhotoUpdate);
    window.addEventListener('profile-banner-updated', handleBannerUpdate);
    return () => {
      window.removeEventListener('profile-photo-updated', handlePhotoUpdate);
      window.removeEventListener('profile-banner-updated', handleBannerUpdate);
    };
  }, []);

  const abrirChatReclamo = async (reclamo) => {
    setChatModalReclamo(reclamo);
    setCargandoChat(true);
    try {
      const res = await api.get(`/quejas/${reclamo.id_solicitud}/mensajes`);
      setChatMensajes(res.data || []);
    } catch {
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
    if (activeSection === 'dashboard') { cargarReclamos(); cargarSoporte(); }
  }, [activeSection]);

  useEffect(() => {
    const refrescar = () => {
      if (activeSection === 'reclamos') cargarReclamos();
      if (activeSection === 'soporte') cargarSoporte();
      if (activeSection === 'dashboard') { cargarReclamos(); cargarSoporte(); }
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

  const compradoresCount = usuarios.filter(u => (u.rol || '').toLowerCase() === 'comprador').length;
  const vendedoresCount = usuarios.filter(u => (u.rol || '').toLowerCase() === 'vendedor').length;
  const adminsCount = usuarios.filter(u => (u.rol || '').toLowerCase() === 'admin' || (u.rol || '').toLowerCase() === 'administrador').length;

  const tiendasActivasCount = tiendas.filter(t => ['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes((t.estado_tienda || '').toLowerCase().trim())).length;
  const tiendasPendientesCount = tiendas.filter(t => ['pendiente', 'en revision', 'en revisión', 'por revisar'].includes((t.estado_tienda || '').toLowerCase().trim())).length;
  const tiendasSuspendidasCount = tiendas.filter(t => ['suspendida', 'suspendido', 'inactiva', 'inactivo', 'pausada', 'pausado'].includes((t.estado_tienda || '').toLowerCase().trim())).length;

  const librosActivosCount = libros.filter(l => !l.oculto).length;
  const totalCategorias = Object.keys(categoriaCount).length;

  const estaPendienteSolicitud = (estado) => ['abierto', 'en revision', 'en revisión'].includes((estado || '').toLowerCase().trim());
  const esReclamoTipo = (tipo) => ['reclamo', 'queja', 'quejas'].includes((tipo || '').toLowerCase().trim());
  const reclamosPendientes = reclamos.filter(r => esReclamoTipo(r.tipo_solicitud) && estaPendienteSolicitud(r.estado));
  const reclamosPendientesCount = reclamosPendientes.length;
  const soportePendientesCountDash = reclamos.filter(r => !esReclamoTipo(r.tipo_solicitud) && estaPendienteSolicitud(r.estado)).length;

  const ordenesCompletadas = ordenes.filter(o => ['completada', 'entregado', 'finalizada'].includes((o.estado || '').toLowerCase())).length;

  const getIniciales = (nombre) => {
    if (!nombre) return 'US';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  };

  const getRolBadgeProps = (rol) => {
    const r = (rol || '').toLowerCase();
    if (r === 'admin' || r === 'administrador') {
      return {
        bg: '#FDF2F4',
        color: VINOTINTO,
        border: '#F8D2DA',
        label: 'Administrador',
        avatarGradient: 'linear-gradient(135deg, #7A1E3A 0%, #a32d52 100%)',
      };
    }
    if (r === 'vendedor') {
      return {
        bg: '#FFFBEB',
        color: '#B45309',
        border: '#FDE68A',
        label: 'Vendedor',
        avatarGradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
      };
    }
    return {
      bg: '#ECFDF5',
      color: '#047857',
      border: '#A7F3D0',
      label: 'Comprador',
      avatarGradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    };
  };

  const getEstadoTiendaBadgeProps = (estado) => {
    const e = (estado || '').toLowerCase().trim();
    if (['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes(e)) {
      return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981', label: 'Activa' };
    }
    if (['pendiente', 'en revision', 'en revisión', 'por revisar'].includes(e)) {
      return { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B', label: 'Pendiente' };
    }
    if (['pausada', 'pausado', 'vacaciones', 'en vacaciones'].includes(e)) {
      return { bg: '#FFF7ED', color: '#C2410C', border: '#FDBA74', dot: '#EA580C', label: 'En Vacaciones' };
    }
    if (['suspendida', 'suspendido'].includes(e)) {
      return { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444', label: 'Suspendida' };
    }
    return { bg: '#FDF2F4', color: '#7A1E3A', border: '#F8D2DA', dot: '#9B2C4E', label: 'Inactiva' };
  };

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
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
      }}>
        {sidebarOpen ? (
          /* ── Sidebar ABIERTO: banner como fondo, avatar + info encima ── */
          <div style={{
            margin: '-24px -14px 16px -14px',
            background: perfilSidebar.bannerUrl
              ? `url(${perfilSidebar.bannerUrl}) center/cover no-repeat`
              : (perfilSidebar.bannerColor || '#7A1E3A'),
            padding: '12px 14px 12px 24px',
            position: 'relative',
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                {perfilSidebar.foto ? (
                  <img src={perfilSidebar.foto} alt="Foto de perfil" style={{
                    width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: WHITE, textTransform: 'uppercase', fontSize: '1rem',
                  }}>
                    {(perfilSidebar.nombre || 'A').charAt(0)}
                  </div>
                )}
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                    color: WHITE, width: '26px', height: '26px', borderRadius: '6px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Contraer menú"
                >
                  <SidebarIcon Icon={IconChevronLeft} size={15} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <SidebarIcon Icon={IconSettings} size={12} />
                <span style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '1.2px', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>Admin Panel</span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: WHITE, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{perfilSidebar.nombre || 'Administrador'}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfilSidebar.correo}</div>
            </div>
          </div>
        ) : (
          /* ── Sidebar CERRADO: banner de fondo + hamburguesa + avatar ── */
          <div style={{
            margin: '-24px -14px 20px -14px',
            background: perfilSidebar.bannerUrl
              ? `url(${perfilSidebar.bannerUrl}) center/cover no-repeat`
              : (perfilSidebar.bannerColor || '#7A1E3A'),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: 'calc(100% + 28px)',
            padding: '12px 0',
            gap: '8px',
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.2)',
                color: WHITE, width: '34px', height: '34px', borderRadius: '8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
              title="Expandir menú"
            >
              <SidebarIcon Icon={IconMenu} size={20} />
            </button>
            {perfilSidebar.foto ? (
              <img src={perfilSidebar.foto} alt="Foto de perfil" style={{
                width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.35)',
              }} />
            ) : (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: WHITE, textTransform: 'uppercase', fontSize: '1rem',
              }}>
                {(perfilSidebar.nombre || 'A').charAt(0)}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="sidebar-nav-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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
                  fontWeight: 600, fontSize: '0.9rem', flexShrink: 0,
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
        </div>

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

        {/* ESTILOS SCOPED PARA EL DASHBOARD */}
        <style>{`
          .admin-kpi-card {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .admin-kpi-card:hover {
            transform: translateY(-4px) !important;
            box-shadow: 0 16px 32px rgba(122, 30, 58, 0.08), 0 4px 12px rgba(0,0,0,0.04) !important;
            border-color: #D4C3BA !important;
          }
          .admin-hero-btn {
            transition: all 0.2s ease !important;
          }
          .admin-hero-btn:hover {
            transform: translateY(-2px) !important;
            filter: brightness(1.06) !important;
            box-shadow: 0 6px 16px rgba(0,0,0,0.18) !important;
          }
          .admin-table-row {
            transition: background-color 0.15s ease !important;
          }
          .admin-table-row:hover {
            background-color: #FAF5EE !important;
          }
        `}</style>

        {/* DASHBOARD REESTRUCTURADO Y PREMIUM */}
        {activeSection === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ALERTA DE ATENCIÓN PRIORITARIA */}
            {(reclamosPendientesCount > 0 || soportePendientesCountDash > 0 || tiendasPendientesCount > 0) && (
              <div style={{
                background: '#FFFBEB',
                border: '1.5px solid #FCD34D',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: '#FEF3C7', color: '#D97706',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <IconAlertTriangle width={22} height={22} style={{ color: '#D97706' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.96rem' }}>
                      Atención requerida del Administrador
                    </div>
                    <div style={{ color: '#B45309', fontSize: '0.86rem', marginTop: '2px' }}>
                      {reclamosPendientesCount > 0 && `Tienes ${reclamosPendientesCount} queja(s) o reclamo(s) abierta(s) para responder. `}
                      {soportePendientesCountDash > 0 && `Hay ${soportePendientesCountDash} ticket(s) de soporte técnico sin resolver. `}
                      {tiendasPendientesCount > 0 && `Hay ${tiendasPendientesCount} librería(s) pendiente(s) de revisión y aprobación.`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {reclamosPendientesCount > 0 && (
                    <button
                      onClick={() => setActiveSection('reclamos')}
                      style={{
                        background: '#D97706', color: WHITE, border: 'none',
                        padding: '8px 16px', borderRadius: '8px', fontWeight: 700,
                        fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      Resolver Reclamos →
                    </button>
                  )}
                  {tiendasPendientesCount > 0 && (
                    <button
                      onClick={() => setActiveSection('tiendas')}
                      style={{
                        background: '#047857', color: WHITE, border: 'none',
                        padding: '8px 16px', borderRadius: '8px', fontWeight: 700,
                        fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      Revisar Tiendas →
                    </button>
                  )}
                  {soportePendientesCountDash > 0 && (
                    <button
                      onClick={() => setActiveSection('soporte')}
                      style={{
                        background: '#2563eb', color: WHITE, border: 'none',
                        padding: '8px 16px', borderRadius: '8px', fontWeight: 700,
                        fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      Atender Soporte →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. GRID DE 4 TARJETAS KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>

              {/* KPI 1: USUARIOS */}
              <div
                onClick={() => setActiveSection('usuarios')}
                className="admin-kpi-card"
                style={{
                  background: WHITE,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  border: `1px solid ${BORDER}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: '#FDF2F4', color: VINOTINTO,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(122, 30, 58, 0.1)'
                  }}>
                    <IconUsers width={24} height={24} style={{ color: VINOTINTO }} />
                  </div>
                  <span style={{
                    background: '#FDF2F4', color: VINOTINTO,
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700, border: '1px solid #F8D2DA'
                  }}>
                    Ecosistema
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: VINOTINTO, lineHeight: 1 }}>
                    {stats.usuarios}
                  </div>
                  <div style={{ color: CARBON, fontWeight: 700, fontSize: '0.95rem', marginTop: '6px' }}>
                    Usuarios Totales
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F4EDE2', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {compradoresCount} compradores
                  </span>
                  <span style={{ background: '#FFFBEB', color: '#B45309', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {vendedoresCount} vendedores
                  </span>
                </div>
              </div>

              {/* KPI 2: LIBROS */}
              <div
                onClick={() => setActiveSection('libros')}
                className="admin-kpi-card"
                style={{
                  background: WHITE,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  border: `1px solid ${BORDER}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: '#F3E8FF', color: '#7E22CE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(126, 34, 206, 0.1)'
                  }}>
                    <IconBook width={24} height={24} style={{ color: '#7E22CE' }} />
                  </div>
                  <span style={{
                    background: '#F3E8FF', color: '#7E22CE',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700, border: '1px solid #E9D5FF'
                  }}>
                    Catálogo
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#581C87', lineHeight: 1 }}>
                    {stats.libros}
                  </div>
                  <div style={{ color: CARBON, fontWeight: 700, fontSize: '0.95rem', marginTop: '6px' }}>
                    Libros Publicados
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F4EDE2', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#FAF5FF', color: '#6B21A8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {librosActivosCount} disponibles
                  </span>
                  <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {totalCategorias} categorías
                  </span>
                </div>
              </div>

              {/* KPI 3: TIENDAS */}
              <div
                onClick={() => setActiveSection('tiendas')}
                className="admin-kpi-card"
                style={{
                  background: WHITE,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  border: `1px solid ${BORDER}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: '#ECFDF5', color: '#047857',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(4, 120, 87, 0.1)'
                  }}>
                    <IconStore width={24} height={24} style={{ color: '#047857' }} />
                  </div>
                  <span style={{
                    background: '#ECFDF5', color: '#047857',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700, border: '1px solid #A7F3D0'
                  }}>
                    {tiendasActivasCount} Activas
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#064E3B', lineHeight: 1 }}>
                    {stats.tiendas}
                  </div>
                  <div style={{ color: CARBON, fontWeight: 700, fontSize: '0.95rem', marginTop: '6px' }}>
                    Librerías & Tiendas
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F4EDE2', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {tiendasActivasCount} verificadas
                  </span>
                  {tiendasPendientesCount > 0 ? (
                    <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {tiendasPendientesCount} pendientes
                    </span>
                  ) : (
                    <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Al día
                    </span>
                  )}
                </div>
              </div>

              {/* KPI 4: ÓRDENES & TRANSACCIONES */}
              <div
                onClick={() => setActiveSection('ordenes')}
                className="admin-kpi-card"
                style={{
                  background: WHITE,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  border: `1px solid ${BORDER}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: '#EFF6FF', color: '#1D4ED8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.1)'
                  }}>
                    <IconPackage width={24} height={24} style={{ color: '#1D4ED8' }} />
                  </div>
                  <span style={{
                    background: '#EFF6FF', color: '#1D4ED8',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700, border: '1px solid #BFDBFE'
                  }}>
                    Transacciones
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#1E3A8A', lineHeight: 1 }}>
                    {stats.ordenes}
                  </div>
                  <div style={{ color: CARBON, fontWeight: 700, fontSize: '0.95rem', marginTop: '6px' }}>
                    Órdenes Procesadas
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F4EDE2', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {ordenesHoy} creadas hoy
                  </span>
                  <span style={{ background: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {ordenesCompletadas} entregadas
                  </span>
                </div>
              </div>

            </div>

            {/* 3. RESUMEN ANALÍTICO Y DISTRIBUCIÓN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

              {/* Distribución de la Comunidad */}
              <div style={{
                background: WHITE,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${BORDER}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: 800 }}>
                    <IconUsers width={20} height={20} style={{ color: VINOTINTO }} />
                    Distribución de la Comunidad
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: GRAY, fontWeight: 600 }}>
                    {stats.usuarios} miembros en total
                  </span>
                </div>

                {/* Roles Progress and percentages */}
                {[
                  { label: 'Compradores', count: compradoresCount, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
                  { label: 'Vendedores / Librerías', count: vendedoresCount, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
                  { label: 'Administradores', count: adminsCount, color: VINOTINTO, bg: '#FDF2F4', border: '#F8D2DA' },
                ].map((item) => {
                  const pct = stats.usuarios > 0 ? Math.round((item.count / stats.usuarios) * 100) : 0;
                  return (
                    <div key={item.label} style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: CARBON }}>{item.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.82rem', color: GRAY, fontWeight: 600 }}>{item.count} usuarios</span>
                          <span style={{ background: item.bg, color: item.color, border: `1px solid ${item.border}`, padding: '2px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div style={{ background: '#F3F4F6', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                          background: item.color,
                          height: '100%',
                          borderRadius: '10px',
                          width: `${pct}%`,
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Categorías Principales y Salud Operativa */}
              <div style={{
                background: WHITE,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${BORDER}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: 800 }}>
                      <IconBook width={20} height={20} style={{ color: VINOTINTO }} />
                      Categorías más Populares
                    </h3>
                    <button
                      onClick={() => setActiveSection('libros')}
                      style={{ background: 'none', border: 'none', color: VINOTINTO, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Explorar catálogo →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {Object.entries(categoriaCount).slice(0, 6).map(([cat, count]) => (
                      <div
                        key={cat}
                        style={{
                          background: '#F9F6F0',
                          border: '1px solid #EAE4D9',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.82rem',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: CARBON }}>{cat}</span>
                        <span style={{ background: VINOTINTO, color: WHITE, padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                          {count}
                        </span>
                      </div>
                    ))}
                    {Object.keys(categoriaCount).length === 0 && (
                      <div style={{ color: GRAY, fontSize: '0.85rem' }}>No hay libros categorizados aún.</div>
                    )}
                  </div>
                </div>

                {/* Estado Operativo de Tiendas */}
                <div style={{ background: '#FAF8F5', borderRadius: '12px', padding: '14px 18px', border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: CARBON, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estado Operativo de Librerías</span>
                    <span style={{ color: GREEN, fontWeight: 800 }}>{tiendasActivasCount} de {stats.tiendas} operando</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                      {tiendasActivasCount} Activas
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#9a3412', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c' }} />
                      {tiendasPendientesCount} Pendientes
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#991b1b', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                      {tiendasSuspendidasCount} Suspendidas
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 4. GRID DE TABLAS DE MONITOREO DIRECTO CON AVATARES Y ACCIONES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>

              {/* Card Tabla: Últimos Usuarios */}
              <div style={{
                background: WHITE,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${BORDER}`,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FDF2F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconUser width={18} height={18} style={{ color: VINOTINTO }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: VINOTINTO, fontSize: '1.05rem', fontWeight: 800 }}>
                        Últimos Usuarios Registrados
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: GRAY, fontWeight: 500 }}>Nuevos registros en la plataforma</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('usuarios')}
                    style={{
                      background: '#FAF5EE',
                      border: `1px solid ${BORDER}`,
                      color: VINOTINTO,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Ver todos ({stats.usuarios}) →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid #F4EDE2`, color: GRAY, textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '10px 8px' }}>Usuario</th>
                        <th style={{ padding: '10px 8px' }}>Correo</th>
                        <th style={{ padding: '10px 8px' }}>Rol</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...usuarios].reverse().slice(0, 5).map((u) => {
                        const rolProps = getRolBadgeProps(u.rol);
                        const isBloqueado = u.estado_usuario === 'Bloqueado';
                        return (
                          <tr key={u.id_usuario} className="admin-table-row" style={{ borderBottom: '1px solid #FAF7F2' }}>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '50%',
                                  background: rolProps.avatarGradient,
                                  color: WHITE,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                }}>
                                  {getIniciales(u.nombre_usuario)}
                                </div>
                                <span style={{ fontWeight: 700, color: CARBON }}>
                                  {u.nombre_usuario}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', color: '#555', fontSize: '0.82rem' }}>
                              {u.correo_usuario}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{
                                background: rolProps.bg,
                                color: rolProps.color,
                                border: `1px solid ${rolProps.border}`,
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'capitalize'
                              }}>
                                {u.rol}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: isBloqueado ? RED : GREEN,
                                background: isBloqueado ? '#FEF2F2' : '#ECFDF5',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                border: `1px solid ${isBloqueado ? '#FECACA' : '#A7F3D0'}`
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isBloqueado ? RED : GREEN }} />
                                {isBloqueado ? 'Bloqueado' : 'Activo'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {usuarios.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: GRAY }}>No hay usuarios registrados aún.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Tabla: Últimas Tiendas */}
              <div style={{
                background: WHITE,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${BORDER}`,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconStore width={18} height={18} style={{ color: '#047857' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: VINOTINTO, fontSize: '1.05rem', fontWeight: 800 }}>
                        Últimas Tiendas Creadas
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: GRAY, fontWeight: 500 }}>Librerías y vendedores asociados</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('tiendas')}
                    style={{
                      background: '#FAF5EE',
                      border: `1px solid ${BORDER}`,
                      color: VINOTINTO,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Gestionar todas ({stats.tiendas}) →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid #F4EDE2`, color: GRAY, textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '10px 8px' }}>Librería</th>
                        <th style={{ padding: '10px 8px' }}>Teléfono</th>
                        <th style={{ padding: '10px 8px' }}>Registro</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tiendas].reverse().slice(0, 5).map((t) => {
                        const badgeProps = getEstadoTiendaBadgeProps(t.estado_tienda);
                        return (
                          <tr key={t.id_tienda} className="admin-table-row" style={{ borderBottom: '1px solid #FAF7F2' }}>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '8px',
                                  background: '#FDF2F4', color: VINOTINTO,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
                                }}>
                                  <IconStore width={16} height={16} style={{ color: VINOTINTO }} />
                                </div>
                                <span style={{ fontWeight: 700, color: VINOTINTO }}>
                                  {t.nombre_tienda}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', color: '#555', fontSize: '0.82rem' }}>
                              {t.telefono ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <IconPhone width={13} height={13} style={{ color: GRAY }} />
                                  {t.telefono}
                                </span>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', color: GRAY, fontSize: '0.82rem' }}>
                              {t.fecha_creacion
                                ? new Date(t.fecha_creacion).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <span style={{
                                background: badgeProps.bg,
                                color: badgeProps.color,
                                border: `1px solid ${badgeProps.border}`,
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeProps.dot }} />
                                {badgeProps.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {tiendas.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: GRAY }}>No hay tiendas registradas aún.</td>
                        </tr>
                      )}
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
                              #{reclamo.numero || reclamo.id_solicitud}
                            </div>
                          )}

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                              <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Reclamo #{reclamo.numero || reclamo.id_solicitud}
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
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              {[
                { id: 'compradores', label: 'Soporte · Compradores', count: soporteCompradores.length },
                { id: 'vendedores', label: 'Soporte · Vendedores', count: soporteVendedores.length },
              ].map((v) => {
                const activo = vistaSoporte === v.id;
                return (
                  <button key={v.id} onClick={() => setVistaSoporte(v.id)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    border: activo ? `2px solid ${VINOTINTO}` : `1.5px solid ${BORDER}`,
                    background: activo ? `linear-gradient(135deg, ${VINOTINTO} 0%, #9b2c4e 100%)` : WHITE,
                    color: activo ? WHITE : VINOTINTO,
                    borderRadius: 999, padding: '10px 20px', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
                    boxShadow: activo ? '0 4px 14px rgba(122,30,58,0.25)' : 'none',
                  }}>
                    <IconTool width={16} height={16} strokeWidth={2} />
                    {v.label}
                    <span style={{ background: activo ? 'rgba(255,255,255,0.25)' : '#f7e9ee', borderRadius: 999, padding: '1px 9px', fontSize: '0.78rem', fontWeight: 800 }}>
                      {v.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {soporteMostrado.length === 0 ? (
              <div style={{ background: WHITE, borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1.5px dashed #eee3e9' }}>
                <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%', background: '#fdf2f4', display: 'grid', placeItems: 'center' }}>
                  <IconTool width={26} height={26} style={{ color: VINOTINTO }} />
                </div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: CARBON }}>No hay tickets de soporte</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: GRAY }}>
                  No hay tickets pendientes para {vistaSoporte === 'compradores' ? 'compradores' : 'vendedores'}.
                </p>
              </div>
            ) : (
              soporteMostrado.map((ticket) => {
                const estadoCfg = ESTADO_CONFIG_ADMIN[ticket.estado] || ESTADO_CONFIG_ADMIN['Cerrado'];
                const fechaStr = ticket.fecha_creacion
                  ? new Date(ticket.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                  : null;
                return (
                <article key={ticket.id_solicitud} style={{
                  borderRadius: 16,
                  border: '1.5px solid #eee3e9',
                  borderLeft: `6px solid ${estadoCfg.dot}`,
                  overflow: 'hidden',
                  background: WHITE,
                  boxShadow: '0 3px 14px rgba(122,30,58,0.09)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 10px 30px rgba(122,30,58,0.16)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 3px 14px rgba(122,30,58,0.09)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Header de la card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
                    padding: '16px 20px',
                    borderBottom: '1.5px solid #f0e8ec',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                      <div style={{
                        position: 'relative',
                        width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)', color: WHITE,
                        display: 'grid', placeItems: 'center',
                        fontSize: '0.85rem', fontWeight: 800,
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 1.5px #ecdce3, 0 4px 12px rgba(122,30,58,0.22)',
                      }}>
                        {(ticket.comprador || '?').charAt(0).toUpperCase()}
                        {ticket.foto_comprador && (
                          <img
                            src={ticket.foto_comprador.startsWith('http') ? ticket.foto_comprador : `${getApiBaseUrl()}/${ticket.foto_comprador.replace(/^\//, '')}`}
                            alt={ticket.comprador || 'Usuario'}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)', color: WHITE,
                            borderRadius: 7, padding: '3px 11px',
                            fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.04em',
                            boxShadow: '0 2px 8px rgba(122,30,58,0.3)',
                            whiteSpace: 'nowrap',
                          }}>
                            TICKET #{ticket.numero || ticket.id_solicitud}
                          </span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: WHITE, border: '1.5px solid #ecdce3', color: VINOTINTO,
                            borderRadius: 7, padding: '2px 10px',
                            fontSize: '0.73rem', fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}>
                            <IconUser width={12} height={12} strokeWidth={2} />
                            {(ticket.rol_usuario || '').toLowerCase() === 'vendedor' ? 'Vendedor' : 'Comprador'}
                          </span>
                        </div>
                        <strong style={{ fontSize: '1.02rem', color: CARBON, fontWeight: 800, display: 'block', lineHeight: 1.35 }}>
                          {ticket.comprador}
                        </strong>
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: estadoCfg.bg, color: estadoCfg.color,
                      border: `1px solid ${estadoCfg.border}`,
                      padding: '5px 12px', borderRadius: 20,
                      fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: estadoCfg.dot, display: 'inline-block' }} />
                      {ticket.estado}
                    </span>
                  </div>

                  {/* Cuerpo */}
                  <div style={{ padding: '16px 20px', display: 'grid', gap: 14 }}>
                    {/* Metadata */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#fdf2f4', border: '1px solid #f0dde4',
                        borderRadius: 20, padding: '5px 12px',
                        color: VINOTINTO, fontSize: '0.8rem', fontWeight: 700,
                      }}>
                        <IconTool width={13} height={13} />
                        {ticket.categoria || 'Soporte'}
                      </div>
                      {ticket.correo_comprador && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#f0f9ff', border: '1px solid #bae6fd',
                          borderRadius: 20, padding: '5px 12px',
                          color: '#0369a1', fontSize: '0.78rem', fontWeight: 600,
                        }}>
                          <IconMail width={13} height={13} />
                          {ticket.correo_comprador}
                        </div>
                      )}
                      {fechaStr && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#f9fafb', border: '1px solid #e5e7eb',
                          borderRadius: 20, padding: '5px 12px',
                          color: '#6b7280', fontSize: '0.78rem', fontWeight: 600,
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {fechaStr}
                        </div>
                      )}
                    </div>

                    {/* Asunto y descripción */}
                    <div style={{ padding: '12px 14px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                      <p style={{ margin: 0, color: '#555', lineHeight: 1.65, fontSize: '0.92rem' }}>
                        <span style={{ fontWeight: 700, color: CARBON, display: 'block', marginBottom: 4, fontSize: '0.82rem' }}>
                          {ticket.asunto}
                        </span>
                        {ticket.descripcion}
                      </p>
                    </div>

                    {/* Respuesta del admin */}
                    {ticket.respuesta && (
                      <div style={{
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
                        borderRadius: 12, borderLeft: '4px solid #7A1E3A',
                      }}>
                        <p style={{ margin: '0 0 6px', color: VINOTINTO, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <IconMessage width={14} height={14} />
                          Respuesta del administrador
                        </p>
                        <p style={{ margin: 0, color: '#444', lineHeight: 1.65, fontSize: '0.92rem' }}>{ticket.respuesta}</p>
                      </div>
                    )}

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
                      <button
                        onClick={() => abrirModal(ticket, 'En revisión')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          border: '1.5px solid #fdba74', background: WHITE, color: '#c2410c',
                          borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
                          fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = '#ea580c'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.borderColor = '#fdba74'; }}
                      >
                        <IconEye width={15} height={15} />
                        Marcar en revisión
                      </button>
                      <button
                        onClick={() => abrirModal(ticket, 'Rechazado')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626',
                          borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
                          fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                      >
                        <IconBan width={15} height={15} />
                        Rechazar ticket
                      </button>
                      <button
                        onClick={() => abrirModal(ticket, 'Resuelto')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          border: 'none',
                          background: `linear-gradient(135deg, ${VINOTINTO} 0%, #9b2c4e 100%)`,
                          color: WHITE, borderRadius: 8, padding: '10px 22px', cursor: 'pointer',
                          fontWeight: 700, fontSize: '0.88rem',
                          boxShadow: '0 4px 14px rgba(122,30,58,0.25)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = VINOTINTO_DARK; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${VINOTINTO} 0%, #9b2c4e 100%)`; }}
                      >
                        <IconCheck width={15} height={15} strokeWidth={2.5} />
                        Resolver y notificar
                      </button>
                    </div>
                  </div>
                </article>
                );
              })
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
                  {modalReclamo?.tipo_solicitud === 'soporte' ? 'Ticket de Soporte' : 'Reclamo'} #{modalReclamo?.numero || modalReclamo?.id_solicitud}
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

        {activeSection === 'perfil' && (
          <SeccionPerfilAdmin stats={stats} />
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
