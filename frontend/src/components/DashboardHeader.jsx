// src/components/DashboardHeader.jsx
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { IconSearch } from './Icons';

function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-container">
        
        {/* Logo */}
        <Link to="/" className="logo-link">
          <img src={logo} alt="BookyHome" className="logo-img" />
        </Link>

        {/* Barra de búsqueda */}
        <div className="search-wrapper">
          <input 
            type="text" 
            placeholder="Buscar libros..." 
            className="search-bar" 
          />
          <button className="search-btn">
            <IconSearch />
          </button>
        </div>

        {/* Lado derecho en blanco (como pediste) */}
        <div className="dashboard-right-space"></div>
      </div>
    </header>
  );
}

export default DashboardHeader;