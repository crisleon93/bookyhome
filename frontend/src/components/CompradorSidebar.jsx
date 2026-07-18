import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconStoreAlt as IconHome,
  IconBookOpen,
  IconFavoritesAlt as IconFavorites,
  IconCartAlt as IconCart,
  IconShoppingBag,
  IconAlertTriangle,
  IconTool,
  IconUser,
  IconSettings,
  IconChevronLeft,
  IconMenu,
  IconLogOut,
  IconMail,
  IconBell,
  IconMapPin as IconLocation
} from "./Icons";
import { notificacionesService } from '../services/notificaciones';
import { chatService } from '../services/chat';

const VINOTINTO = '#7A1E3A';
const WHITE = '#FFFFFF';


const ICONS = {
  "Inicio": <IconHome width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Catálogo": <IconBookOpen width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Lista de Deseos": <IconFavorites width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Carrito": <IconCart width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Mis Compras": <IconShoppingBag width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Quejas y reclamos": <IconAlertTriangle width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Soporte técnico": <IconTool width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Notificaciones": <IconBell className="" width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Mensajes": <IconMail className="" width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Mi Perfil": <IconUser width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Mis Direcciones": <IconLocation width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
  "Configuración": <IconSettings width={20} height={20} strokeWidth={2.2} style={{ color: WHITE }} />,
};

const MENU_LINKS = [
  { name: "Inicio", label: "Inicio" },
  { name: "Catálogo", label: "Catálogo" },
  { name: "Lista de Deseos", label: "Lista de deseos" },
  { name: "Carrito", label: "Carrito" },
  { name: "Mis Compras", label: "Mis compras" },
  { name: "Quejas y reclamos", label: "Quejas y reclamos" },
  { name: "Soporte técnico", label: "Soporte técnico" },
  { name: "Notificaciones", label: "Notificaciones" },
  { name: "Mensajes", label: "Mensajes" },
  { name: "Mi Perfil", label: "Perfil" },
  { name: "Mis Direcciones", label: "Direcciones" },
  { name: "Configuración", label: "Configuración" },
];

function SidebarIcon(props) {
  const IconComp = props.Icon;
  return (
    <IconComp className="" width={props.size || 20} height={props.size || 20} strokeWidth={2} style={{ color: WHITE, display: 'block' }} />
  );
}

export default function CompradorSidebar({ userName, userEmail, profilePhotoUrl, activeSide, onSelect }) {
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
        marginBottom: sidebarOpen ? '26px' : '20px',
        paddingLeft: sidebarOpen ? '10px' : '0',
        position: 'relative',
        minHeight: sidebarOpen ? undefined : '110px',
        paddingTop: sidebarOpen ? '0' : '50px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', width: '100%' }}>
          <div style={{
            width: sidebarOpen ? '64px' : '42px',
            height: sidebarOpen ? '64px' : '42px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: sidebarOpen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.28)',
            border: sidebarOpen ? '2px solid rgba(255,255,255,0.35)' : '2px solid rgba(255,255,255,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: WHITE,
            textTransform: 'uppercase',
            fontSize: sidebarOpen ? '1.4rem' : '1rem',
            boxShadow: sidebarOpen ? 'none' : '0 0 0 1px rgba(255,255,255,0.08)',
            marginTop: sidebarOpen ? '0' : '0'
          }}>
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={userName || 'Usuario'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              (userName || 'U').charAt(0)
            )}
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: sidebarOpen ? 'static' : 'absolute',
            right: sidebarOpen ? undefined : '8px',
            top: sidebarOpen ? undefined : '12px',
            background: sidebarOpen ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.16)',
            border: sidebarOpen ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.2)',
            color: WHITE,
            width: '34px', height: '34px', borderRadius: '10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: sidebarOpen ? 'none' : '0 4px 14px rgba(0,0,0,0.15)'
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
            <span style={{ display: 'flex', flexShrink: 0, alignItems: 'center', width: '24px', height: '24px', justifyContent: 'center' }}>
              {ICONS[item.name]}
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
