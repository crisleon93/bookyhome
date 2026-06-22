import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ArrowRightIcon } from 'flowbite-react/icons';
import { 
  IconHome, 
  IconBook, 
  IconFavoritesAlt as IconFavorites, 
  IconCartAlt as IconCart, 
  IconPackage, 
  IconUser 
} from "./Icons";

const ICONS = {
  "Inicio": <IconHome strokeWidth={2.2} />,
  "Catálogo": <IconBook strokeWidth={2.2} />,
  "Favoritos": <IconFavorites strokeWidth={2.2} />,
  "Carrito": <IconCart strokeWidth={2.2} />,
  "Mis Compras": <IconPackage strokeWidth={2.2} />,
  "Mi Perfil": <IconUser strokeWidth={2.2} />,
};

// Mapeamos el orden exacto del menú que necesitas
const MENU_LINKS = [
  { name: "Inicio", label: "Inicio" },
  { name: "Catálogo", label: "Catálogo" },
  { name: "Favoritos", label: "Favoritos" },
  { name: "Carrito", label: "Carrito" },
  { name: "Mis Compras", label: "Mis compras" },
  { name: "Mi Perfil", label: "Perfil" },
];

export default function DashboardSidebar({ userName, userEmail, activeSide, onSelect }) {
  // ========================
  // Estado local
  // ========================
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // ========================
  // Handlers
  // ========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((state) => !state)}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        >
          {collapsed ? <ArrowRightIcon className="h-4 w-4" /> : <ArrowLeftIcon className="h-4 w-4" />}
        </button>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar-big">{userName ? userName.slice(0, 2).toUpperCase() : "US"}</div>
        <div className="sidebar-user-info">
          <p className="user-name">{userName || "Usuario"}</p>
          <p className="user-email">{userEmail || "correo@ejemplo.com"}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {MENU_LINKS.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => {
              if (item.name === "Catálogo") {
                navigate("/catalogo");
              } else {
                onSelect(item.name);
              }
            }}
            className={`sidebar-item ${activeSide === item.name ? "active" : ""}`}
            data-tooltip={item.label}
          >
            <span className="sidebar-icon">{ICONS[item.name]}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button type="button" onClick={handleLogout} className="sidebar-logout">
        Cerrar sesión
      </button>
    </aside>
  );
}