import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-user">
        <div className="user-avatar-big">{userName ? userName.slice(0, 2).toUpperCase() : "US"}</div>
        <div className="user-info">
          <p className="user-name">{userName || "Usuario"}</p>
          <p className="user-email">{userEmail || "correo@ejemplo.com"}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {MENU_LINKS.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              if (item.name === "Catálogo") {
                navigate("/catalogo");
              } else {
                onSelect(item.name);
              }
            }}
            className={`sidebar-item ${activeSide === item.name ? "active" : ""}`}
          >
            <span className="sidebar-icon">{ICONS[item.name]}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <button onClick={handleLogout} className="sidebar-logout">
        Cerrar sesión
      </button>
    </aside>
  );
}