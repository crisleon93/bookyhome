import { useState, useEffect, startTransition } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import Header from '../components/Header'
import { IconUsers } from '../components/Icons'
import SeccionInicio from '../components/dashboard/SeccionInicio'
import CompradorSidebar from '../components/CompradorSidebar'
import { getUsuarios } from '../services/api'
import api from '../services/api'
import SeccionCarrito from '../components/dashboard/SeccionCarrito'
import SeccionMisCompras from '../components/dashboard/SeccionMisCompras'
import SeccionSeguimiento from '../components/dashboard/SeccionSeguimiento'
import SeccionFavoritos from '../components/dashboard/SeccionFavoritos'
import SeccionConfiguracion from '../components/dashboard/SeccionConfiguracion'
import SeccionMiPerfil from '../components/dashboard/SeccionMiPerfil'
import SeccionMisDirecciones from '../components/dashboard/SeccionMisDirecciones'
import SeccionNotificaciones from '../components/dashboard/SeccionNotificaciones'
import Catalogo from './Catalogo'
import Chat from './Chat'
import ListaDeseos from './ListaDeseos'
import QuejasReclamos from './QuejasReclamos'
import Soporte from './Soporte'

import ficcion from '../assets/ficcion.png'
import romance from '../assets/romance.png'
import historia from '../assets/historia.png'
import ciencia from '../assets/ciencia.png' 
import poesia from '../assets/poesia.png'
import filosofia from '../assets/filosofia.png'
import arte from '../assets/arte.png'
import biografia from '../assets/biografia.png'
import infantil from '../assets/infantil.png'
import tecnologia from '../assets/tecnologia.png'

const HERO_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1000&q=85', alt: 'Personas explorando libros en una librería' },
  { src: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000&q=85', alt: 'Pasillo de una librería con estanterías llenas de libros' },
  { src: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1000&q=85', alt: 'Libros abiertos sobre una mesa de lectura' },
  { src: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1000&q=85', alt: 'Biblioteca con grandes estanterías de libros' },
  { src: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&q=85', alt: 'Pila de libros de diferentes colores' },
  { src: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1000&q=85', alt: 'Libro abierto junto a una taza de café' },
]
// ── Íconos ────────────────────────────────────────────────────────────────────

const IconLocation = () => (
  <svg className="icon-top-bar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)


const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
)

const IconArrow = () => (
  <svg className="modal-arrow" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
  </svg>
)

// ── Datos ─────────────────────────────────────────────────────────────────────

const STATS = [
  { icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2ZM12 6v12M8 10h4M8 14h3', color: 'icon-vinotinto', num: '+10,000', label: 'Libros disponibles' },
  { icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10', color: 'icon-rojo', num: '+150', label: 'Librerías asociadas' },
  { icon: <IconUsers />, color: 'icon-vinotinto', num: '+50,000', label: 'Usuarios activos' },
  { icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', color: 'icon-rojo', num: '4.8', label: 'Calificación promedio' },
]

const BENEFITS = [
  {
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    title: 'Compra Protegida',
    desc: 'Tu dinero está seguro. Recibe el producto que esperabas o te devolvemos tu dinero. Sistema de protección integral.',
  },
  {
    icon: 'M1 3h15v13H1zM16 8l4 0 3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    title: 'Envío a Todo el País',
    desc: 'Envío gratis en compras mayores a $30.000. Seguimiento en tiempo real y entrega garantizada.',
  },
  {
    icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2ZM12 6v12M8 10h4M8 14h3',
    title: 'Amplio Catálogo',
    desc: 'Desde clásicos hasta novedades. Encuentra libros nuevos, usados y de colección de múltiples librerías.',
  },
]

const CATEGORIES = [
  { name: 'Ficción',    img: ficcion },   // bosque misterioso
  { name: 'Romance',    img: romance },   // atardecer cálido
  { name: 'Historia',   img: historia },  // arquitectura antigua
  { name: 'Ciencia',    img: ciencia },    // tecnología/naturaleza
  { name: 'Poesía',     img: poesia },   // paisaje poético
  { name: 'Filosofía',  img: filosofia },   // minimalista
  { name: 'Arte',       img: arte },   // arquitectura artística
  { name: 'Biografía',  img: biografia },  // personas
  { name: 'Infantil',   img: infantil },  // colorido
  { name: 'Tecnología', img: tecnologia },  // tech/
 
]

const STEPS = [
  { num: '1', cls: '', title: 'Regístrate gratis', desc: 'Crea tu cuenta en minutos y accede a miles de libros de librerías verificadas' },
  { num: '2', cls: 'step-number--rojo', title: 'Busca y compara', desc: 'Encuentra tu libro ideal comparando precios, condiciones y reseñas de diferentes vendedores.' },
  { num: '3', cls: '', title: 'Compra seguro', desc: 'Paga de forma segura y recibe tu libro en la puerta de tu casa con envío protegido' },
]

// ── Modal helpers ─────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null
  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card">
        <button className="modal-close" aria-label="Cerrar" onClick={onClose}><IconClose /></button>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-subtitle">{subtitle}</p>
        <div className="modal-options">{children}</div>
      </div>
    </div>
  )
}

function ModalOption({ to, onClick, iconPath, title, desc, onClose }) {
  return (
    <Link
      to={to || '#'}
      className="modal-option"
      onClick={(event) => {
        if (onClick) {
          event.preventDefault()
          onClick()
        }
        if (onClose) onClose()
      }}
    >
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
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

function Home() {
  const [joinOpen,     setJoinOpen]     = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [heroImageIndex, setHeroImageIndex] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const carouselTimer = setInterval(() => {
      setHeroImageIndex(current => (current + 1) % HERO_IMAGES.length)
    }, 5000)

    return () => clearInterval(carouselTimer)
  }, [])
  
  // Dashboard state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
  const [bannerUrl, setBannerUrl] = useState(null)
  const [bannerColor, setBannerColor] = useState('#7A1E3A')
  const [loading, setLoading] = useState(true)
  const [activeSide, setActiveSide] = useState('Inicio')
  const [catalogoLibroInicial, setCatalogoLibroInicial] = useState(null)
  const [selectedSalaInChat, setSelectedSalaInChat] = useState(null)
  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const payload = jwtDecode(token)
          setUserName(payload.nombre || 'Usuario')
          const id = parseInt(payload.sub)
          setUserId(id)
          setIsAuthenticated(true)
          // Cargar email, foto y banner desde el endpoint de perfil propio
          api.get('/perfil/mi-perfil')
            .then((res) => {
              if (res.data) {
                setUserEmail(res.data.correo_usuario || '')
                const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
                if (res.data.foto_perfil) {
                  setProfilePhotoUrl(`${base}/${res.data.foto_perfil.replace(/^\//, '')}`)
                } else {
                  setProfilePhotoUrl(null)
                }
                if (res.data.banner_perfil) {
                  setBannerUrl(`${base}/${res.data.banner_perfil.replace(/^\//, '')}`)
                  setBannerColor(null)
                } else if (res.data.banner_color) {
                  setBannerColor(res.data.banner_color)
                  setBannerUrl(null)
                }
              }
            })
            .catch((err) => console.error(err))
        } catch (error) {
          console.error('Error al decodificar token:', error)
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
        setUserName('')
        setUserEmail('')
        setUserId(null)
        setProfilePhotoUrl(null)
      }
      setLoading(false)
    }
    
    checkAuth()
    
    // Escuchar evento personalizado de cambio de autenticación
    const handleAuthChange = (e) => {
      if (e.detail.authenticated) {
        // Login — recargar datos del usuario
        checkAuth()
      } else {
        // Logout — limpiar estado
        setIsAuthenticated(false)
        setUserName('')
        setUserEmail('')
        setUserId(null)
        setProfilePhotoUrl(null)
        setActiveSide('Inicio')
      }
    }
    
    window.addEventListener('auth-change', handleAuthChange)

    // Escuchar cuando el usuario cambia su foto de perfil
    const handlePhotoUpdate = (e) => {
      if (e.detail?.url) setProfilePhotoUrl(e.detail.url)
    }
    window.addEventListener('profile-photo-updated', handlePhotoUpdate)

    // Escuchar cuando el usuario cambia su banner
    const handleBannerUpdate = (e) => {
      if (e.detail?.bannerUrl) { setBannerUrl(e.detail.bannerUrl); setBannerColor(null) }
      else if (e.detail?.bannerColor) { setBannerColor(e.detail.bannerColor); setBannerUrl(null) }
    }
    window.addEventListener('profile-banner-updated', handleBannerUpdate)
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange)
      window.removeEventListener('profile-photo-updated', handlePhotoUpdate)
      window.removeEventListener('profile-banner-updated', handleBannerUpdate)
    }
  }, [])
  

  // Handle section selection
  const handleSelectSection = (seccion) => {
    setActiveSide(seccion)
    navigate(`/?seccion=${encodeURIComponent(seccion)}`, { replace: true })
  }
  
  // Handle URL params for section
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const seccion = params.get('seccion')
    if (seccion && isAuthenticated) {
      startTransition(() => {
        setActiveSide(seccion === 'Direcciones' ? 'Mi Perfil' : seccion)
      })
    }
  }, [location.search, isAuthenticated])
  
  // Helper functions now live in their respective section components
  
  // If loading, show loading state
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>
  }
  
  // If authenticated, show public home with sidebar
  if (isAuthenticated) {
    return (
      <div className={`dashboard-container ${activeSide === 'Inicio' ? 'home-view' : ''}`}>
        <CompradorSidebar
          userName={userName}
          userEmail={userEmail}
          profilePhotoUrl={profilePhotoUrl}
          bannerUrl={bannerUrl}
          bannerColor={bannerColor}
          activeSide={activeSide}
          onSelect={handleSelectSection}
        />
        <main className="dashboard-main">
          {activeSide === 'Inicio' && (
            <div className="dashboard-section">
              <SeccionInicio
                userName={userName}
                onGoToCatalog={() => handleSelectSection('Catálogo')}
                onSelectSeccion={handleSelectSection}
                onVerDetalleLibro={(libro) => {
                  setCatalogoLibroInicial(libro)
                  handleSelectSection('Catálogo')
                }}
              />
            </div>
          )}
          {activeSide === 'Catálogo' && (
            <div className="dashboard-section"><Catalogo
              libroInicial={catalogoLibroInicial}
              onLibroInicialConsumido={() => setCatalogoLibroInicial(null)}
            /></div>
          )}
          {activeSide === 'Mensajes' && (
            <div style={{ height: 'calc(100vh - 120px)', minHeight: 'calc(100vh - 120px)' }}>
              <Chat embedded={true} selectedSalaProp={selectedSalaInChat} onSelectSala={(id) => setSelectedSalaInChat(id)} />
            </div>
          )}
          {activeSide === 'Carrito' && (
            <div className="dashboard-section"><SeccionCarrito userId={userId} /></div>
          )}
          {activeSide === 'Mis Compras' && (
            <div className="dashboard-section"><SeccionMisCompras userId={userId} /></div>
          )}
          {activeSide === 'Seguimiento' && (
            <div className="dashboard-section"><SeccionSeguimiento userId={userId} /></div>
          )}
          {activeSide === 'Lista de Deseos' && (
            <div className="dashboard-section"><ListaDeseos
              embedded
              onIrCatalogo={() => handleSelectSection('Catálogo')}
              onVerLibro={(libro) => {
                setCatalogoLibroInicial(libro)
                handleSelectSection('Catálogo')
              }}
            /></div>
          )}
          {activeSide === 'Favoritos' && (
            <div className="dashboard-section"><SeccionFavoritos
              onGoToCatalog={() => handleSelectSection('Catálogo')}
              onSetActiveSide={handleSelectSection}
            /></div>
          )}
          {activeSide === 'Mi Perfil' && (
            <div className="dashboard-section"><SeccionMiPerfil userId={userId} /></div>
          )}
          {activeSide === 'Mis Direcciones' && (
            <div className="dashboard-section"><SeccionMisDirecciones /></div>
          )}
          {activeSide === 'Configuración' && (
            <div className="dashboard-section"><SeccionConfiguracion userId={userId} /></div>
          )}
          {activeSide === 'Notificaciones' && (
            <div className="dashboard-section"><SeccionNotificaciones /></div>
          )}
          {activeSide === 'Quejas y reclamos' && <div className="dashboard-section"><QuejasReclamos /></div>}
          {activeSide === 'Soporte técnico' && <div className="dashboard-section"><Soporte /></div>}
        </main>
      </div>
    )
  }
  
  // If not authenticated, show public home
  return (
  <>

    {/* HERO */}
    <section className="hero">
      <div className="layout-container hero-container">
        <div className="hero-text">
          <h1>El marketplace que conecta lectores con librerías</h1>
          <p>Miles de títulos de las mejores librerías independientes del país. Todo en un solo lugar.</p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => setJoinOpen(true)}>
              Comenzar a comprar
            </button>
            <button
              type="button"
              className="btn"
              id="btn-vender-libros"
              onClick={() => window.dispatchEvent(new CustomEvent('bookyhome:open-library-register'))}
            >
              Vender libros
            </button>
          </div>
        </div>
        <div className="hero-image" aria-label="Galería de libros">
          <div className="hero-carousel-frame">
            <img
              key={HERO_IMAGES[heroImageIndex].src}
              src={HERO_IMAGES[heroImageIndex].src}
              alt={HERO_IMAGES[heroImageIndex].alt}
            />
            <button
              type="button"
              className="hero-carousel-arrow hero-carousel-arrow--prev"
              aria-label="Imagen anterior"
              onClick={() => setHeroImageIndex(current => (current - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)}
            >
              ‹
            </button>
            <button
              type="button"
              className="hero-carousel-arrow hero-carousel-arrow--next"
              aria-label="Siguiente imagen"
              onClick={() => setHeroImageIndex(current => (current + 1) % HERO_IMAGES.length)}
            >
              ›
            </button>
            <div className="hero-carousel-dots" aria-label="Seleccionar imagen">
              {HERO_IMAGES.map((image, index) => (
                <button
                  type="button"
                  key={image.src}
                  className={index === heroImageIndex ? 'active' : ''}
                  aria-label={`Mostrar imagen ${index + 1}`}
                  aria-current={index === heroImageIndex ? 'true' : undefined}
                  onClick={() => setHeroImageIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* STATS */}
      <section className="stats">
        <div className="layout-container stats-container">
          {STATS.map((s, i) => (
            <div key={i} className="stat-item">
              <div className={`stat-icon ${s.color}`}>
                {typeof s.icon === 'string' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon}/>
                  </svg>
                ) : (
                  s.icon
                )}
              </div>
              <h2>{s.num}</h2>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="benefits">
        <div className="layout-container">
          <h2>¿Por qué elegir BookyHome?</h2>
          <div className="benefits-grid">
            {BENEFITS.map((b, i) => (
              <div key={i} className="benefit-card">
                <div className="benefit-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={b.icon}/>
                  </svg>
                </div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="categories">
        <div className="layout-container">
          <h2>Explora nuestras categorías</h2>
          <p>Libros para todos los gustos y momentos</p>
          <div className="category-grid">
            {CATEGORIES.map((c, i) => (
              <div
                key={i}
                className="category-card"
                style={{ backgroundImage: `url(${c.img})`, cursor: 'pointer' }}
                onClick={() => navigate(`/catalogo?categoria=${encodeURIComponent(c.name)}`)}
              >
                <h3>{c.name}</h3>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/catalogo" className="btn btn-primary">
              Ver catálogo completo
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="layout-container">
          <h2>¿Cómo funciona?</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={i} className="step">
                <span className={`step-number ${s.cls}`}>{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA LIBRERÍAS */}
      <section className="cta-libraries">
        <div className="layout-container">
          <h2>¿Tienes una librería?</h2>
          <p>Únete a nuestra red de librerías y alcanza a miles de lectores en todo el país.</p>
          <Link to="/libreria" className="btn btn-primary">Registrar mi librería</Link>
        </div>
      </section>

      {/* MODAL: Comenzar a comprar */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)}
        title="¡Bienvenido a BookyHome!" subtitle="¿Ya tienes cuenta o eres nuevo por aquí?">
        <ModalOption
          onClick={() => window.dispatchEvent(new CustomEvent('bookyhome:open-login'))}
          onClose={() => setJoinOpen(false)}
          iconPath="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
          title="Ya tengo cuenta" desc="Iniciar sesión en BookyHome" />
        <ModalOption
          onClick={() => window.dispatchEvent(new CustomEvent('bookyhome:open-register'))}
          onClose={() => setJoinOpen(false)}
          iconPath="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-4.5-1.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
          title="Soy nuevo" desc="Crear una cuenta gratis" />
      </Modal>

      {/* MODAL: Crea tu cuenta */}
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)}
        title="Crear cuenta" subtitle="¿Cómo quieres unirte a BookyHome?">
        <ModalOption to="/register" onClose={() => setRegisterOpen(false)}
          iconPath="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
          title="Soy comprador" desc="Quiero explorar y comprar libros" />
        <ModalOption to="/libreria" onClose={() => setRegisterOpen(false)}
          iconPath="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25h-1.5A2.25 2.25 0 007.5 13.5V21m6 0H7.5m6 0h3.75A2.25 2.25 0 0019.5 18.75V9.375a2.25 2.25 0 00-.659-1.591l-4.5-4.5A2.25 2.25 0 0012.75 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21H7.5"
          title="Tengo una librería" desc="Quiero vender mis libros en BookyHome" />
      </Modal>
    </>
  )
}

export default Home
