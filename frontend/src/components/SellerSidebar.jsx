import { useNavigate } from "react-router-dom";
import {
  IconStoreAlt as IconHome,
  IconBook,
  IconPlus,
  IconCartAlt as IconCart,
  IconPackage,
  IconSettings,
  IconTag,
} from "./Icons";

const ICONS = {
  Inicio: <IconHome strokeWidth={2.2} />,
  "Mis Libros": <IconBook strokeWidth={2.2} />,
  "Publicar Libro": <IconPlus strokeWidth={2.2} />,
  Promociones: <IconTag strokeWidth={2.2} />,
  Ventas: <IconCart strokeWidth={2.2} />,
  Pedidos: <IconPackage strokeWidth={2.2} />,
  Perfil: <IconSettings strokeWidth={2.2} />,
};

const MENU_LINKS = [
  { name: "Inicio" },
  { name: "Mis Libros" },
  { name: "Publicar Libro", path: "/vendedor/publicar" },
  { name: "Promociones" },
  { name: "Ventas" },
  { name: "Pedidos" },
  { name: "Perfil" },
];

export default function SellerSidebar({ userName, activeSide, setActiveSide, handleLogout }) {
  const navigate = useNavigate();

  const onLogout = handleLogout || (() => {
    localStorage.removeItem("token");
    navigate("/login");
  });

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-user">
        <div className="user-avatar-big">
          {userName ? userName.slice(0, 2).toUpperCase() : "VE"}
        </div>
        <div className="user-info">
          <p className="user-name">{userName || "Vendedor"}</p>
          <p className="user-email">Panel del vendedor</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {MENU_LINKS.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => {
              if (item.path) {
                navigate(item.path);
                return;
              }
              if (setActiveSide) setActiveSide(item.name);
            }}
            className={`sidebar-item ${activeSide === item.name ? "active" : ""}`}
          >
            <span className="sidebar-icon">{ICONS[item.name]}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <button type="button" onClick={onLogout} className="sidebar-logout">
        Cerrar sesión
      </button>
    </aside>
  );
}
