import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  IconEyeClosed,
  IconBell,
  IconTruck,
  IconMessage,
  IconLogOut
} from './Icons';
import { login } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { notify } from './ToastProvider';
import Register from '../pages/Register';
import Libreria from '../pages/Libreria';
import { notificacionesService } from '../services/notificaciones';
import { chatService } from '../services/chat';

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

function Header({ variant, hasSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(localStorage.getItem('bookyhome_location') || 'Todo el país (Colombia)');
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
  const [noLeidosNotif, setNoLeidosNotif] = useState(0);
  const [noLeidosMensajes, setNoLeidosMensajes] = useState(0);

  const isHome = location.pathname === '/';
  const isDashboardPage = hasSidebar ||
    location.pathname === '/post-login' ||
    location.pathname.startsWith('/mi-tienda') ||
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

  const [authState, setAuthState] = useState(() => {
    const t = localStorage.getItem("token");
    if (!t) return { isLoggedIn: false, userRole: null };
    try {
      const decoded = jwtDecode(t);
      return { isLoggedIn: true, userRole: decoded.rol };
    } catch {
      return { isLoggedIn: false, userRole: null };
    }
  });

  const { isLoggedIn, userRole } = authState;

  useEffect(() => {
    const syncAuth = () => {
      const t = localStorage.getItem("token");
      if (!t) {
        setAuthState({ isLoggedIn: false, userRole: null });
        return;
      }
      try {
        const decoded = jwtDecode(t);
        setAuthState({ isLoggedIn: true, userRole: decoded.rol });
      } catch {
        setAuthState({ isLoggedIn: false, userRole: null });
      }
    };
    window.addEventListener('auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = () => setDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [dropdownOpen]);

  // Cargar contadores de notificaciones y mensajes
  useEffect(() => {
    if (!isLoggedIn) return;
    
    let mounted = true;
    const cargarContadores = async () => {
      try {
        const notifData = await notificacionesService.obtener(false, 1, 0);
        if (mounted) setNoLeidosNotif(notifData.no_leidas || 0);

        const salasData = await chatService.getSalas();
        const totalNo = (salasData.salas || []).reduce((acc, s) => acc + (s.no_leidos || 0), 0);
        if (mounted) setNoLeidosMensajes(totalNo);
      } catch (err) {
        console.error('Error contadores header:', err);
      }
    };
    
    cargarContadores();
    const iv = setInterval(cargarContadores, 10000);
    return () => { mounted = false; clearInterval(iv); };
  }, [isLoggedIn]);

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
      // Disparar evento para que App.jsx detecte el cambio
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: true } }));
      if (decoded.rol === 'vendedor') {
        navigate('/mi-tienda');
      } else if (decoded.rol === 'admin' || decoded.rol === 'administrador') {
        navigate('/admin');
      } else {
        navigate('/'); // Comprador va al Home con sidebar
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
            <div className="layout-container" style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
              <div className="location" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={(e) => { e.stopPropagation(); setLocationOpen(prev => !prev); }}>
                <IconLocation />
                <span>Enviar a: {selectedLocation}</span>
                <span style={{ fontSize: '10px', marginLeft: '6px' }}>▼</span>
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
                <>
                  {/* Accesos rápidos para usuarios logueados */}
                  <div className="quick-access">
                    <Link 
                      to="/?seccion=Carrito" 
                      className="quick-access-item"
                      title="Carrito de compras"
                    >
                      <IconCart />
                      <span className="quick-access-label">Carrito</span>
                    </Link>
                    
                    <Link 
                      to="/?seccion=Notificaciones" 
                      className="quick-access-item"
                      title="Notificaciones"
                    >
                      <IconBell />
                      {noLeidosNotif > 0 && (
                        <span className="notification-badge">{noLeidosNotif}</span>
                      )}
                      <span className="quick-access-label">Notificaciones</span>
                    </Link>
                    
                    <Link 
                      to="/?seccion=Mensajes" 
                      className="quick-access-item"
                      title="Mensajes y Chat"
                    >
                      <IconMessage />
                      {noLeidosMensajes > 0 && (
                        <span className="notification-badge">{noLeidosMensajes}</span>
                      )}
                      <span className="quick-access-label">Chat</span>
                    </Link>
                    
                    <Link 
                      to="/?seccion=Seguimiento" 
                      className="quick-access-item"
                      title="Seguimiento de pedidos"
                    >
                      <IconTruck />
                      <span className="quick-access-label">Pedidos</span>
                    </Link>
                    
                    <Link 
                      to="/?seccion=Lista%20de%20Deseos" 
                      className="quick-access-item"
                      title="Lista de deseos"
                    >
                      <IconFavorites />
                      <span className="quick-access-label">Favoritos</span>
                    </Link>
                    
                    <div className="user-dropdown-wrapper">
                      <button
                        type="button"
                        className="quick-access-item user-dropdown-btn"
                        title="Mi cuenta"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(!dropdownOpen);
                        }}
                      >
                        <IconUser />
                        <span className="quick-access-label">Perfil</span>
                      </button>
                      <div className={`user-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                        <Link
                          to="/?seccion=Mi%20Perfil"
                          className="user-dropdown-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <IconUser width={16} height={16} />
                          <span>Mi Perfil</span>
                        </Link>
                        <div className="user-dropdown-divider" />
                        <button
                          type="button"
                          className="user-dropdown-item"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            setDropdownOpen(false);
                            localStorage.removeItem("token");
                            setAuthState({ isLoggedIn: false, userRole: null });
                            window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } }));
                            notify("Sesión cerrada", "info");
                            navigate("/");
                          }}
                        >
                          <IconLogOut width={16} height={16} />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
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
                  <IconMail className="auth-input-icon" />
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
                  <IconLock className="auth-input-icon" />
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
      {ReactDOM.createPortal(
        locationOpen ? (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
            onMouseDown={() => setLocationOpen(false)}
          >
            <div
              style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '380px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', margin: '0 20px' }}
              onMouseDown={e => e.stopPropagation()}
            >
              <button
                onMouseDown={() => setLocationOpen(false)}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#aaa', lineHeight: 1 }}
              >✕</button>
              <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.3rem', fontWeight: 800, color: '#2A2A2A', textAlign: 'center' }}>Elige tu ubicación</h2>
              <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Selecciona dónde quieres recibir tus compras.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Todo el país (Colombia)', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'].map((city) => (
                  <button
                    key={city}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedLocation(city);
                      setLocationOpen(false);
                      localStorage.setItem('bookyhome_location', city);
                      notify(`Ubicación actualizada a ${city}`, 'success');
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      background: selectedLocation === city ? '#F4EDE2' : '#fff',
                      border: selectedLocation === city ? '2px solid #7A1E3A' : '1.5px solid #e5e0d8',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '15px',
                      fontWeight: selectedLocation === city ? 700 : 400,
                      color: '#2A2A2A',
                    }}
                  >
                    {selectedLocation === city && <span style={{ color: '#7A1E3A', marginRight: '8px' }}>✓</span>}
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}
    </>
  );
}

export default Header;
