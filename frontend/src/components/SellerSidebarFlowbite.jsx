import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon } from 'flowbite-react/icons';
import {
  IconStoreAlt as IconHome,
  IconBook,
  IconPlus,
  IconCartAlt as IconCart,
  IconPackage,
  IconSettings,
  IconTag,
} from './Icons';

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
  Inicio: <IconHome strokeWidth={2.2} />,
  'Mis Libros': <IconBook strokeWidth={2.2} />,
  'Publicar Libro': <IconPlus strokeWidth={2.2} />,
  Promociones: <IconTag strokeWidth={2.2} />,
  Ventas: <IconCart strokeWidth={2.2} />,
  Pedidos: <IconPackage strokeWidth={2.2} />,
  Perfil: <IconSettings strokeWidth={2.2} />,
};

export default function SellerSidebarFlowbite({ userName = 'Vendedor', activeSide = 'Inicio', setActiveSide, handleLogout }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const onLogout = handleLogout || (() => {
    localStorage.removeItem('token');
    navigate('/login');
  });

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
        <div className="user-avatar-big">{userName.slice(0, 2).toUpperCase()}</div>
        <div className="sidebar-user-info">
          <p className="user-name">{userName}</p>
          <p className="user-email">Panel del vendedor</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {MENU_LINKS.map((item) => (
          <button
            key={item.name}
            type="button"
            className={`sidebar-item ${activeSide === item.name ? 'active' : ''}`}
            onClick={() => {
              if (item.path) {
                navigate(item.path);
                return;
              }
              if (setActiveSide) setActiveSide(item.name);
            }}
            data-tooltip={item.name}
          >
            <span className="sidebar-icon">{ICONS[item.name]}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      <button type="button" onClick={onLogout} className="sidebar-logout">
        Cerrar sesión
      </button>
    </aside>
  );
}
