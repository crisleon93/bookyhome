import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconStoreAlt as IconHome,
  IconBookOpen,
  IconPlus,
  IconCartAlt as IconCart,
  IconShoppingBag,
  IconAlertTriangle,
  IconTool,
  IconUser,
  IconSettings,
  IconMail,
  IconBell,
  IconTag,
  IconChevronLeft,
  IconMenu,
  IconLogOut,
  IconStar,
  IconTruck
} from './Icons';

const VINOTINTO = '#7A1E3A';
const WHITE = '#FFFFFF';

const MENU_LINKS = [
  { name: 'Inicio' },
  { name: 'Mis Libros' },
  { name: 'Publicar Libro', path: '/vendedor/publicar' },
  { name: 'Promociones' },
  { name: 'Cupones' },
  { name: 'Ventas' },
  { name: 'Pedidos' },
  { name: 'Envíos' },
  { name: 'Nómina' },
  { name: 'Calificaciones' },
  { name: 'Quejas y reclamos' },
  { name: 'Soporte técnico' },
  { name: 'Notificaciones' },
  { name: 'Mensajes' },
  { name: 'Perfil' },
  { name: 'Configuración' },
  { name: 'Suscripciones' },
  { name: 'Impulsos' },
];

const ICONS = {
  Inicio: <IconHome width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  'Mis Libros': <IconBookOpen width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  'Publicar Libro': <IconPlus width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Promociones: <IconTag width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Cupones: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5v2"></path>
      <path d="M15 11v2"></path>
      <path d="M15 17v2"></path>
      <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"></path>
    </svg>
  ),
  Ventas: <IconCart width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Pedidos: <IconShoppingBag width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  'Envíos': <IconTruck width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Nómina: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
      <line x1="12" y1="19" x2="12" y2="19"></line>
      <line x1="12" y1="10" x2="12" y2="15"></line>
    </svg>
  ),
  Calificaciones: <IconStar width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  'Quejas y reclamos': <IconAlertTriangle width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  'Soporte técnico': <IconTool width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Notificaciones: <IconBell className="" width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Mensajes: <IconMail className="" width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Perfil: <IconUser width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Configuración: <IconSettings width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Suscripciones: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
  ),
  Impulsos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
    </svg>
  ),
};

function SidebarIcon(props) {
  const IconComp = props.Icon;
  return (
    <IconComp className="" width={props.size || 20} height={props.size || 20} strokeWidth={2} style={{ color: WHITE, display: 'block' }} />
  );
}

export default function VendedorSidebar({ userName = 'Vendedor', profileImage = null, userPhotoUrl = null, bannerUrl = null, activeSide = 'Inicio', setActiveSide, handleLogout }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('vendedor_sidebar_open');
    const open = saved !== null ? saved === 'true' : true;
    // Setear la variable CSS inmediatamente para que el header tenga el ancho correcto desde el inicio
    document.documentElement.style.setProperty('--dashboard-sidebar-width', open ? '250px' : '76px');
    return open;
  });

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('vendedor_sidebar_open', String(next));
      return next;
    });
  };

  const [noLeidosNotif, setNoLeidosNotif] = useState(0);
  const [noLeidosMensajes, setNoLeidosMensajes] = useState(0);
  const avatarSrc = profileImage || userPhotoUrl || null;
  const avatarAlt = `${userName || 'Vendedor'} avatar`;

  // Cargar contadores de notificaciones y mensajes
  useEffect(() => {
    let mounted = true;
    const cargarContadores = async () => {
      try {
        const { notificacionesService } = await import('../services/notificaciones');
        const { chatService } = await import('../services/chat');

        try {
          const notifData = await notificacionesService.obtener(false, 1, 0);
          if (mounted && notifData) {
            setNoLeidosNotif(notifData.no_leidas || 0);
          }
        } catch (notifErr) {
          console.error('Error cargando notificaciones:', notifErr);
          if (mounted) setNoLeidosNotif(0);
        }

        try {
          const salasData = await chatService.getSalas();
          if (mounted && salasData && salasData.salas) {
            const totalNo = (salasData.salas || []).reduce((acc, s) => acc + (s.no_leidos || 0), 0);
            setNoLeidosMensajes(totalNo);
          }
        } catch (chatErr) {
          console.error('Error cargando chats:', chatErr);
          if (mounted) setNoLeidosMensajes(0);
        }
      } catch (err) {
        console.error('Error importando servicios:', err);
        if (mounted) {
          setNoLeidosNotif(0);
          setNoLeidosMensajes(0);
        }
      }
    };

    cargarContadores();
    const iv = setInterval(cargarContadores, 10000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--dashboard-sidebar-width', sidebarOpen ? '250px' : '76px');
    return () => {
      document.documentElement.style.setProperty('--dashboard-sidebar-width', '0px');
    };
  }, [sidebarOpen]);

  const onLogout = handleLogout || (() => {
    localStorage.removeItem('token');
    navigate('/');
  });

  const avatarSize = sidebarOpen ? 48 : 36;
  const iconSize = sidebarOpen ? 22 : 18;

  return (
    <aside className={`dashboard-sidebar ${sidebarOpen ? '' : 'collapsed'}`} style={{
      width: sidebarOpen ? '250px' : '76px',
      position: 'fixed', top: 0, left: 0, zIndex: 60,
      height: '100vh',
      background: VINOTINTO, color: WHITE,
      padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '4px',
      transition: 'width 0.25s ease', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Header con banner de fondo */}
      <div style={{
        position: 'relative',
        margin: '-16px -14px 0 -14px',
        background: bannerUrl
          ? `url(${bannerUrl}) center/cover no-repeat`
          : VINOTINTO,
        minHeight: sidebarOpen ? '100px' : '90px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: sidebarOpen ? '12px 14px 10px 14px' : '10px 0 10px 0',
        marginBottom: '6px',
      }}>
        {/* Overlay oscuro sobre el banner */}
        {bannerUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: 0 }} />
        )}

        {/* Botón toggle */}
        <button
          onClick={handleToggleSidebar}
          style={{
            position: 'absolute',
            right: sidebarOpen ? '10px' : '50%',
            top: '10px',
            transform: sidebarOpen ? 'none' : 'translateX(50%)',
            background: 'rgba(255,255,255,0.16)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: WHITE,
            width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}
          title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
        >
          {sidebarOpen
            ? <SidebarIcon Icon={IconChevronLeft} size={18} />
            : <SidebarIcon Icon={IconMenu} size={18} />}
        </button>

        {/* Avatar + info */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={avatarAlt}
              style={{
                width: sidebarOpen ? '52px' : `${avatarSize}px`,
                height: sidebarOpen ? '52px' : `${avatarSize}px`,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.6)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: sidebarOpen ? '52px' : `${avatarSize}px`,
              height: sidebarOpen ? '52px' : `${avatarSize}px`,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.35)',
              flexShrink: 0,
            }}>
              <IconUser width={sidebarOpen ? 22 : iconSize} height={sidebarOpen ? 22 : iconSize} strokeWidth={2.2} style={{ color: WHITE }} />
            </div>
          )}
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: WHITE, textShadow: '0 1px 3px rgba(0,0,0,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>Panel de ventas</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
      {MENU_LINKS.map((item) => {
        const active = activeSide === item.name;
        return (
          <button
            key={item.name}
            onClick={() => {
              if (item.path) {
                if (setActiveSide) setActiveSide(item.name);
                navigate(item.path);
                return;
              }
              if (setActiveSide) {
                setActiveSide(item.name);
                return;
              }
            }}
            title={!sidebarOpen ? item.name : undefined}
            style={{
              background: active ? 'rgba(255,255,255,0.18)' : 'none',
              border: 'none', color: WHITE,
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
              {ICONS[item.name]}
            </span>
            {sidebarOpen && <span>{item.name}</span>}
          </button>
        );
      })}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
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
  );
}
