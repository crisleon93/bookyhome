import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { IconSearch, IconUser, IconUserPlus } from './Icons'

function Header({ variant }) {

  const isSimple = variant === "simple"   // solo logo
  const isWhite = variant === "white"     // header blanco

  return (
    <header
      id="main-header"
      className={`${isSimple ? "header-center" : ""} ${isWhite ? "header-white" : "header-vinotinto"}`}
    >

      {/* LOGO */}
      <Link to="/" className="logo-link">
        <img src={logo} alt="BookyHome" className="logo-img" />
      </Link>

      {/* CONTENIDO SOLO SI NO ES SIMPLE */}
      {!isSimple && (
        <>
          {/* BUSCADOR */}
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

          {/* ACCIONES */}
          <div className="header-actions">
            <Link to="/login" className="user-access">
              <IconUser />
              <span>Ingresa</span>
            </Link>

            <Link to="/register" className="user-access">
              <IconUserPlus />
              <span>Crea tu cuenta</span>
            </Link>
          </div>
        </>
      )}

    </header>
  )
}

export default Header