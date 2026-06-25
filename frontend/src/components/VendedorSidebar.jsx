import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconStoreAlt as IconHome,
  IconBook,
  IconPlus,
  IconCartAlt as IconCart,
  IconPackage,
  IconSettings,
  IconTag,
  IconChevronLeft,
  IconMenu,
  IconLogOut
} from './Icons';

const VINOTINTO = '#7A1E3A';
const WHITE = '#FFFFFF';

const MENU_LINKS = [
  { name: 'Inicio' },
  { name: 'Mis Libros' },
  { name: 'Publicar Libro', path: '/vendedor/publicar' },
  { name: 'Promociones' },
  { name: 'Ventas' },
  { name: 'Pedidos' },
  { name: 'Perfil' },
];

const ICONS = {
  Inicio: <IconHome strokeWidth={2.2} style={{ color: WHITE }} />,
  'Mis Libros': <IconBook strokeWidth={2.2} style={{ color: WHITE }} />,
  'Publicar Libro': <IconPlus strokeWidth={2.2} style={{ color: WHITE }} />,
  Promociones: <IconTag strokeWidth={2.2} style={{ color: WHITE }} />,
  Ventas: <IconCart strokeWidth={2.2} style={{ color: WHITE }} />,
  Pedidos: <IconPackage strokeWidth={2.2} style={{ color: WHITE }} />,
  Perfil: <IconSettings strokeWidth={2.2} style={{ color: WHITE }} />,
};

function SidebarIcon(props) {
  const IconComp = props.Icon;
  return (
    <IconComp className="" width={props.size || 20} height={props.size || 20} strokeWidth={2} style={{ color: WHITE, display: 'block' }} />
  );
}

export default function VendedorSidebar({ userName = 'Vendedor', activeSide = 'Inicio', setActiveSide, handleLogout }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
    <aside className={`dashboard-sidebar ${sidebarOpen ? '' : 'collapsed'}`} style={{
      width: sidebarOpen ? '250px' : '76px',
      position: 'fixed', top: '1px', left: 0, zIndex: 60,
      height: 'calc(100vh - 1px)',
      background: VINOTINTO, color: WHITE,
      padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: '6px',
      transition: 'width 0.25s ease', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: sidebarOpen ? 'space-between' : 'center',
        marginBottom: '26px', paddingLeft: sidebarOpen ? '10px' : 0,
      }}>
        {sidebarOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>Vendedor</span>
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

      {/* User Info */}
      {sidebarOpen && (
        <div style={{
          padding: '16px 12px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{userName}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Panel de ventas</div>
        </div>
      )}

      {/* Navigation */}
      {MENU_LINKS.map((item) => {
        const active = activeSide === item.name;
        return (
          <button
            key={item.name}
            onClick={() => {
              if (item.path) {
                navigate(item.path);
                return;
              }
              if (setActiveSide) setActiveSide(item.name);
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
