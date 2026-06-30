import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import logo2 from '../assets/logo2.png';
import {
  IconSearch,
  IconUser,
  IconUserPlus,
  IconLocationTopBar as IconLocation,
  IconClose,
  IconArrow,
  IconBookOpen,
  IconFavorites,
  IconCart,
  IconMenu,
  IconMail,
  IconLock,
  IconEyeOpen,
  IconEyeClosed
} from './Icons';
import { login } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { notify } from './ToastProvider';
import Register from '../pages/Register';
import Libreria from '../pages/Libreria';

function ModalOption({ to, onClick, iconPath, title, desc, onClose }) {
  const content = (
    <>
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
    </>
  );

  if (onClick) {
    return (
      <button 
        type="button" 
        className="modal-option" 
        onClick={() => { onClick(); if (onClose) onClose(); }}
        style={{ background: 'none', border: '1.5px solid #e5e0d8', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className="modal-option" onClick={onClose}>
      {content}
    </Link>
  );
}

function Header({ variant }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [libreriaOpen, setLibreriaOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isHome = location.pathname === '/';
  const isDashboardPage = location.pathname.startsWith('/mi-tienda') ||
    location.pathname.startsWith('/post-login') ||
    location.pathname.startsWith('/vendedor') ||
    location.pathname.startsWith('/perfil') ||
    location.pathname.startsWith('/publicar');

  useEffect(() => {
    if (!loginOpen) {
      setShowPass(false);
    }
  }, [loginOpen]);
  const isSimple = variant === "simple";
  const isWhite = variant === "white" || !variant;

  const token = localStorage.getItem("token");
  let isLoggedIn = false;
  let userRole = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isLoggedIn = true;
      userRole = decoded.rol;
    } catch {
      isLoggedIn = false;
    }
  }

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = () => setDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [dropdownOpen]);

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
      setLoginError('Completa correo y contraseña');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await login(loginForm);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      notify('Inicio de sesión correcto', 'success');
      setLoginOpen(false);
      if (decoded.rol === 'vendedor') {
        navigate('/mi-tienda');
      } else if (decoded.rol === 'admin' || decoded.rol === 'administrador') {
        navigate('/admin');
      } else {
        navigate('/post-login');
      }
    } catch (err) {
      const message = err.response?.data?.detail || 'Email o contraseña incorrectos';
      setLoginError(message);
      notify(message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      <header
        id="main-header"
        className={`${isSimple ? "header-center" : ""} ${isHome ? "header-vinotinto" : isWhite ? "header-white" : "header-vinotinto"} ${mobileMenuOpen ? "header-menu-open" : ""}`}
        style={{
          position: isDashboardPage ? 'fixed' : undefined,
          left: isDashboardPage ? 'var(--dashboard-sidebar-width, 250px)' : undefined,
          width: isDashboardPage ? 'calc(100% - var(--dashboard-sidebar-width, 250px))' : undefined,
          zIndex: isDashboardPage ? 1000 : undefined
        }}
      >
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
        <div className="layout-container header-container">
          <Link to="/" className="logo-link">
          <img src={isHome ? logo2 : isWhite ? logo : logo2} alt="BookyHome" className="logo-img" />
        </Link>

        <button
          type="button"
          className="header-menu-toggle"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <IconMenu />
        </button>

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
              {isLoggedIn ? (
                <div className="user-dropdown-wrapper">
                  <button
                    type="button"
                    className="user-access"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(!dropdownOpen);
                    }}
                  >
                    <IconUser />
                    <span>Mi Cuenta</span>
                  </button>
                  <div className={`user-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                    <Link 
                      to={userRole === 'vendedor' ? '/mi-tienda' : userRole === 'admin' ? '/admin' : '/post-login'} 
                      className="user-dropdown-item" 
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link to="/favoritos" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      Favoritos
                    </Link>
                    <Link to="/carrito" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      Carrito
                    </Link>
                    <div className="user-dropdown-divider" />
                    <button
                      type="button"
                      className="user-dropdown-item"
                      style={{ color: '#dc2626' }}
                      onClick={() => {
                        setDropdownOpen(false);
                        localStorage.removeItem("token");
                        notify("Sesión cerrada", "info");
                        navigate("/");
                      }}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </>
        )}
        </div>
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
                onClick={() => { setModalOpen(false); setRegisterOpen(true); }}
                iconPath="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
                title="Soy comprador"
                desc="Quiero explorar y comprar libros"
              />
              <ModalOption
                onClick={() => { setModalOpen(false); setLibreriaOpen(true); }}
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
            <h2 className="modal-title">Iniciar sesión</h2>
            <p className="modal-subtitle">Ingresa con tu cuenta de BookyHome</p>
            {loginError && <span className="error-msg" style={{ textAlign: 'center', marginBottom: '1rem' }}>{loginError}</span>}
            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="modal-login-email">Email</label>
                <div className="auth-input-wrapper">
                  <IconMail />
                  <input
                    id="modal-login-email"
                    type="email"
                    placeholder="ejemplo@gmail.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="modal-login-password">Contraseña</label>
                <div className="auth-input-wrapper">
                  <IconLock />
                  <input
                    id="modal-login-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-eye"
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <IconEyeClosed /> : <IconEyeOpen />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-vinotinto" disabled={loginLoading}>
                {loginLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
            <div className="auth-footer-links">
              <p><Link to="/forgot-password" onClick={() => setLoginOpen(false)}>Olvidé mi contraseña</Link></p>
              <p>
                ¿No tienes cuenta?{' '}
                <button 
                  type="button" 
                  onClick={() => { setLoginOpen(false); setRegisterOpen(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--vinotinto)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  Crear cuenta
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {registerOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setRegisterOpen(false) }}>
          <div className="modal-box" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setRegisterOpen(false)}>
              <IconClose />
            </button>
            <Register 
              isModal={true} 
              onClose={() => setRegisterOpen(false)} 
              onSuccess={() => {
                setRegisterOpen(false);
                setLoginOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {libreriaOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setLibreriaOpen(false) }}>
          <div className="modal-box" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setLibreriaOpen(false)}>
              <IconClose />
            </button>
            <Libreria 
              isModal={true} 
              onClose={() => setLibreriaOpen(false)} 
              onSuccess={() => {
                setLibreriaOpen(false);
                setLoginOpen(true);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
