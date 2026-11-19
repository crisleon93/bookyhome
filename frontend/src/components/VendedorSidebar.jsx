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
  IconMenu,
  IconLogOut,
  IconStar,
  IconTruck
} from './Icons';
import SidebarExpandedHeader from './SidebarExpandedHeader';
import SidebarIcon from './SidebarIcon';

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
  { name: 'Calificaciones' },
  { name: 'Quejas y reclamos' },
  { name: 'Soporte técnico' },
  { name: 'Notificaciones' },
  { name: 'Mensajes' },
  { name: 'Perfil' },
  { name: 'Configuración' },
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
  Calificaciones: <IconStar width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  'Quejas y reclamos': <IconAlertTriangle width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  'Soporte técnico': <IconTool width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Notificaciones: <IconBell className="" width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Mensajes: <IconMail className="" width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Perfil: <IconUser width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  Configuración: <IconSettings width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
};

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

  const avatarSrc = profileImage || userPhotoUrl || null;
  const avatarAlt = `${userName || 'Vendedor'} avatar`;

  useEffect(() => {
    document.documentElement.style.setProperty('--dashboard-sidebar-width', sidebarOpen ? '250px' : '76px');
    return () => {
      document.documentElement.style.setProperty('--dashboard-sidebar-width', '0px');
    };
  }, [sidebarOpen]);

  const onLogout = handleLogout || (() => {
    localStorage.removeItem('token');
    document.documentElement.classList.remove('dark');
    void navigate('/');
  });

  return (
    <aside className={`dashboard-sidebar ${sidebarOpen ? '' : 'collapsed'}`} style={{
      width: sidebarOpen ? '250px' : '76px',
      position: 'fixed', top: 0, left: 0, zIndex: 60,
      height: '100vh',
      boxSizing: 'border-box',
      background: VINOTINTO, color: WHITE,
      padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '4px',
      transition: 'width 0.25s ease', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Header con banner de fondo */}
      {sidebarOpen ? (
        /* ── Sidebar ABIERTO: banner como fondo, avatar + info encima ── */
        <SidebarExpandedHeader
          bannerUrl={bannerUrl}
          backgroundFallback={VINOTINTO}
          showBannerOverlay
          avatarSrc={avatarSrc}
          avatarAlt={avatarAlt}
          userName={userName}
          nameFallback="Vendedor"
          avatarFallback="V"
          subtitle="Panel de ventas"
          onCollapse={handleToggleSidebar}
        />
      ) : (
        /* ── Sidebar CERRADO: banner de fondo + hamburguesa + avatar ── */
        <div style={{
          position: 'relative',
          margin: '-16px -14px 20px -14px',
          background: bannerUrl
            ? `url(${bannerUrl}) center/cover no-repeat`
            : VINOTINTO,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: 'calc(100% + 28px)',
          padding: '12px 0',
          gap: '8px',
        }}>
          {bannerUrl && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
          )}
          <button
            onClick={handleToggleSidebar}
            style={{
              position: 'relative', zIndex: 1,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.2)',
              color: WHITE, width: '34px', height: '34px', borderRadius: '8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
            title="Expandir menú"
          >
            <SidebarIcon Icon={IconMenu} size={20} />
          </button>
          {avatarSrc ? (
            <img src={avatarSrc} alt={avatarAlt} style={{
              position: 'relative', zIndex: 1,
              width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover',
              border: '2px solid rgba(255,255,255,0.35)',
            }} />
          ) : (
            <div style={{
              position: 'relative', zIndex: 1,
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: WHITE, textTransform: 'uppercase', fontSize: '1rem',
            }}>
              {(userName || 'V').charAt(0)}
            </div>
          )}
        </div>
      )}

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
                void navigate(item.path);
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
