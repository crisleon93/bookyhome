import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { IconSearch, IconUser, IconUserPlus } from './Icons';
import { login } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { notify } from './ToastProvider';

const IconLocation = () => (
  <svg className="icon-top-bar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);

const IconArrow = () => (
  <svg className="modal-arrow" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
  </svg>
);

const IconBooks = () => (
  <svg className="header-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);

const IconFavorites = () => (
  <svg className="header-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
);

const IconCart = () => (
  <svg className="header-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="9" cy="20" r="1" />
    <circle cx="17" cy="20" r="1" />
    <path d="M3 3h2l2.68 13.39A2 2 0 0 0 9.66 18H18a2 2 0 0 0 2-1.6L22 6H6" />
  </svg>
);

function ModalOption({ to, iconPath, title, desc, onClose }) {
  return (
    <Link to={to} className="modal-option" onClick={onClose}>
      <div className="modal-option-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/>
        </svg>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
      <IconArrow />
    </Link>
  );
}

function Header({ variant }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isHome = location.pathname === '/';
  const isSimple = variant === "simple";
  const isWhite = variant === "white" || !variant;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/catalogo');
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setLoginError('Completa correo y contrasena');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await login(loginForm);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      notify('Inicio de sesion correcto', 'success');
      setLoginOpen(false);
      navigate(decoded.rol === 'vendedor' ? '/mi-tienda' : '/post-login');
    } catch (err) {
      const message = err.response?.data?.detail || 'Email o contrasena incorrectos';
      setLoginError(message);
      notify(message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      {isHome && (
        <div className="top-bar">
          <div className="top-bar-container">
            <div className="location">
              <IconLocation />
              Envíos a todo el país
            </div>
          </div>
        </div>
      )}

      <header
        id="main-header"
        className={`${isSimple ? "header-center" : ""} ${isWhite ? "header-white" : "header-vinotinto"}`}
      >
        <Link to="/" className="logo-link">
          <img src={logo} alt="BookyHome" className="logo-img" />
        </Link>

        {/* Navegación siempre visible */}
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/catalogo" style={{
            color: isSimple ? 'var(--vinotinto)' : 'white',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconBooks />
              Catálogo
            </span>
          </Link>
          <Link to="/favoritos" style={{
            color: isSimple ? 'var(--vinotinto)' : 'white',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconFavorites />
              Favoritos
            </span>
          </Link>
          <Link to="/carrito" style={{
            color: isSimple ? 'var(--vinotinto)' : 'white',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconCart />
              Carrito
            </span>
          </Link>
        </nav>

        {!isSimple && (
          <>
            <form className="search-wrapper" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Buscar libros..."
                className="search-bar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn"><IconSearch /></button>
            </form>

            <div className="header-actions">
              <button
                type="button"
                className="user-access"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => setLoginOpen(true)}
              >
                <IconUser />
                <span>Ingresa</span>
              </button>

              <button
                className="user-access"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => setModalOpen(true)}
              >
                <IconUserPlus />
                <span>Crea tu cuenta</span>
              </button>
            </div>
          </>
        )}
      </header>

      {modalOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal-card">
            <button className="modal-close" aria-label="Cerrar" onClick={() => setModalOpen(false)}>
              <IconClose />
            </button>
            <h2 className="modal-title">Crear cuenta</h2>
            <p className="modal-subtitle">¿Cómo quieres unirte a BookyHome?</p>
            <div className="modal-options">
              <ModalOption
                to="/register"
                onClose={() => setModalOpen(false)}
                iconPath="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
                title="Soy comprador"
                desc="Quiero explorar y comprar libros"
              />
              <ModalOption
                to="/libreria"
                onClose={() => setModalOpen(false)}
                iconPath="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25h-1.5A2.25 2.25 0 007.5 13.5V21m6 0H7.5m6 0h3.75A2.25 2.25 0 0019.5 18.75V9.375a2.25 2.25 0 00-.659-1.591l-4.5-4.5A2.25 2.25 0 0012.75 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21H7.5"
                title="Tengo una librería"
                desc="Quiero vender mis libros en BookyHome"
              />
            </div>
          </div>
        </div>
      )}

      {loginOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false) }}>
          <div className="modal-card">
            <button className="modal-close" aria-label="Cerrar" onClick={() => setLoginOpen(false)}>
              <IconClose />
            </button>
            <h2 className="modal-title">Iniciar sesion</h2>
            <p className="modal-subtitle">Ingresa con tu cuenta de BookyHome</p>
            {loginError && <span className="error-msg" style={{ textAlign: 'center', marginBottom: '1rem' }}>{loginError}</span>}
            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="modal-login-email">Email</label>
                <input
                  id="modal-login-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="modal-login-password">Contrasena</label>
                <input
                  id="modal-login-password"
                  type="password"
                  placeholder="Tu contrasena"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-vinotinto" disabled={loginLoading}>
                {loginLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
            <div className="auth-footer-links">
              <p><Link to="/forgot-password" onClick={() => setLoginOpen(false)}>Olvide mi contrasena</Link></p>
              <p><Link to="/register" onClick={() => setLoginOpen(false)}>Crear cuenta</Link></p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
