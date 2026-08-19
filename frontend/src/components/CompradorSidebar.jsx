import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconStoreAlt as IconHome,
  IconBookOpen,
  IconShoppingBag,
  IconAlertTriangle,
  IconTool,
  IconSettings,
  IconChevronLeft,
  IconMenu,
  IconLogOut,
  IconMapPin as IconLocation
} from "./Icons";

const VINOTINTO = '#7A1E3A';
const WHITE = '#FFFFFF';


const ICONS = {
  "Inicio": <IconHome width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Catálogo": <IconBookOpen width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Mis Compras": <IconShoppingBag width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Quejas y reclamos": <IconAlertTriangle width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Soporte técnico": <IconTool width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Mis Direcciones": <IconLocation width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Configuración": <IconSettings width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
};

const MENU_LINKS = [
  { name: "Inicio", label: "Inicio" },
  { name: "Catálogo", label: "Catálogo" },
  { name: "Mis Compras", label: "Mis compras" },
  { name: "Quejas y reclamos", label: "Quejas y reclamos" },
  { name: "Soporte técnico", label: "Soporte técnico" },
  { name: "Mis Direcciones", label: "Direcciones" },
  { name: "Configuración", label: "Configuración" },
];

function SidebarIcon(props) {
  const IconComp = props.Icon;
  return (
    <IconComp className="" width={props.size || 20} height={props.size || 20} strokeWidth={2} style={{ color: WHITE, display: 'block' }} />
  );
}

export default function CompradorSidebar({ userName, userEmail, profilePhotoUrl, bannerUrl, bannerColor, activeSide, onSelect }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const avatarSrc = profilePhotoUrl || null;
  const avatarAlt = `${userName || 'Usuario'} avatar`;

  useEffect(() => {
    document.documentElement.style.setProperty('--dashboard-sidebar-width', sidebarOpen ? '250px' : '76px');
    return () => {
      document.documentElement.style.setProperty('--dashboard-sidebar-width', '0px');
    };
  }, [sidebarOpen]);

  return (
    <aside className={`dashboard-sidebar ${sidebarOpen ? '' : 'collapsed'}`} style={{
      width: sidebarOpen ? '250px' : '76px',
      position: 'fixed', top: '0px', left: 0, zIndex: 60,
      height: '100vh',
      background: VINOTINTO, color: WHITE,
      padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '4px',
      transition: 'width 0.25s ease', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      {sidebarOpen ? (
        /* ── Sidebar ABIERTO: banner como fondo, avatar + info encima ── */
        <div style={{
          marginBottom: '10px', flexShrink: 0,
          margin: '-16px -14px 10px -14px',
          borderRadius: '0',
          background: bannerUrl
            ? `url(${bannerUrl}) center/cover no-repeat`
            : (bannerColor || '#5a1528'),
          padding: '10px 14px 10px 28px',
          position: 'relative',
        }}>
          {/* Contenido encima del overlay */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Fila: avatar a la izq, botón < a la der */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt={avatarAlt} style={{
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
                  {(userName || 'U').charAt(0)}
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
            {/* Nombre y email debajo */}
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: WHITE, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{userName || 'Usuario'}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{userEmail || ''}</div>
          </div>
        </div>
      ) : (
        /* ── Sidebar CERRADO: banner de fondo + hamburguesa + avatar ── */
        <div style={{
          position: 'relative',
          margin: '-16px -14px 20px -14px',
          background: bannerUrl
            ? `url(${bannerUrl}) center/cover no-repeat`
            : (bannerColor || '#5a1528'),
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
          {avatarSrc ? (
            <img src={avatarSrc} alt={avatarAlt} style={{
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
              {(userName || 'U').charAt(0)}
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
                if (onSelect) {
                  onSelect(item.name);
                  return;
                }
                if (item.path) {
                  navigate(item.path);
                  return;
                }
                if (item.name === "Catálogo") {
                  navigate("/catalogo");
                }
              }}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                border: 'none', color: WHITE,
                padding: sidebarOpen ? '12px 14px' : '12px',
                borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                fontWeight: active ? 700 : 600, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                gap: sidebarOpen ? '12px' : '0',
                fontFamily: "'Montserrat', sans-serif",
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => !active && (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ display: 'flex', flexShrink: 0, alignItems: 'center', width: '24px', height: '24px', justifyContent: 'center' }}>
                {ICONS[item.name]}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.removeItem('token');
          window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } }));
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
          gap: sidebarOpen ? '10px' : '0', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      >
        <span style={{ display: 'flex', flexShrink: 0, alignItems: 'center', width: '24px', height: '24px', justifyContent: 'center' }}>
          <SidebarIcon Icon={IconLogOut} size={18} />
        </span>
        {sidebarOpen && <span>Cerrar sesión</span>}
      </button>
    </aside>
  );
}
