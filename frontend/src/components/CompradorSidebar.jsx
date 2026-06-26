import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  IconStoreAlt as IconHome, 
  IconBooks as IconBook, 
  IconStar as IconFavorites, 
  IconCart, 
  IconPackage, 
  IconSettings as IconUser,
  IconChevronLeft,
  IconMenu,
  IconLogOut,
  IconMapPin,
  IconMail,
  IconPhone
} from "./Icons";
import { notificacionesService } from '../services/notificaciones';
import { chatService } from '../services/chat';

const VINOTINTO = '#7A1E3A';
const WHITE = '#FFFFFF';

const ICONS = {
  Inicio: IconHome,
  Catálogo: IconBook,
  Favoritos: IconFavorites,
  Carrito: IconCart,
  'Mis Compras': IconPackage,
  'Mi Perfil': IconUser,
  Direcciones: IconMapPin,
  Mensajes: IconMail,
  Notificaciones: IconPhone,
};

const MENU_LINKS = [
  { name: "Inicio", label: "Inicio" },
  { name: "Catálogo", label: "Catálogo" },
  { name: "Favoritos", label: "Favoritos" },
  { name: "Carrito", label: "Carrito" },
  { name: "Mis Compras", label: "Mis compras" },
  { name: "Direcciones", label: "Direcciones" },
  { name: "Mensajes", label: "Mensajes" },
  { name: "Notificaciones", label: "Notificaciones" },
  { name: "Mi Perfil", label: "Perfil" },
];

function SidebarIcon(props) {
  const IconComp = props.Icon;
  return (
    <IconComp className="" width={props.size || 20} height={props.size || 20} strokeWidth={2} style={{ color: WHITE, display: 'block' }} />
  );
}

export default function CompradorSidebar({ userName, userEmail, activeSide, onSelect }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [noLeidosNotif, setNoLeidosNotif] = useState(0);
  const [noLeidosMensajes, setNoLeidosMensajes] = useState(0);

  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      try {
        const notifData = await notificacionesService.obtener(false, 1, 0);
        if (!mounted) return;
        setNoLeidosNotif(notifData.no_leidas || 0);

        const salasData = await chatService.getSalas();
        const totalNo = (salasData.salas || []).reduce((acc, s) => acc + (s.no_leidos || 0), 0);
        setNoLeidosMensajes(totalNo);
      } catch (err) {
        console.error('Error contadores sidebar comprador', err);
      }
    };
    cargar();
    const iv = setInterval(cargar, 10000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

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
            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>Panel</span>
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
          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{userName || "Usuario"}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{userEmail || "correo@ejemplo.com"}</div>
        </div>
      )}

      {/* Navigation */}
      {MENU_LINKS.map((item) => {
        const active = activeSide === item.name;
        return (
          <button
            key={item.name}
            onClick={() => {
              // Preferir onSelect cuando el dashboard controla la selección (evita salto de página)
              if (onSelect) {
                onSelect(item.name);
                return;
              }
              // Fallback: navegar a rutas externas
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
            <span style={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
              <SidebarIcon Icon={ICONS[item.name]} size={20} />
            </span>
            {sidebarOpen && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {item.name === 'Notificaciones' && noLeidosNotif > 0 && (
                    <span style={{ background: '#FFC107', color: '#000', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{noLeidosNotif}</span>
                  )}
                  {item.name === 'Mensajes' && noLeidosMensajes > 0 && (
                    <span style={{ background: '#F87171', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{noLeidosMensajes}</span>
                  )}
                </span>
              </span>
            )}
          </button>
        );
      })}

      {/* Logout */}
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
  );
}