import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
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
// ── Íconos ────────────────────────────────────────────────────────────────────

const IconLocation = () => (
  <svg className="icon-top-bar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

const IconSearch = () => (
  <svg className="icon-search" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const IconUser = () => (
  <svg className="icon-user" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconUserPlus = () => (
  <svg className="icon-user" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-4.5-1.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"/>
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
  { icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z', color: 'icon-vinotinto', num: '+10,000', label: 'Libros disponibles' },
  { icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10', color: 'icon-rojo', num: '+150', label: 'Librerías asociadas' },
  { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', color: 'icon-vinotinto', num: '+50,000', label: 'Usuarios activos' },
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
    icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
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
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

function Home() {
  const [joinOpen,     setJoinOpen]     = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)

  return (
    <>
      {/* TOP BAR */}
      <div className="top-bar">
        <div className="top-bar-container">
          <div className="location">
            <IconLocation />
            Envíos a todo el país
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header id="main-header">
        <Link to="/" className="logo-link">
          <img src={logo} alt="BookyHome" className="logo-img" />
        </Link>

        <div className="search-wrapper">
          <input type="text" placeholder="Inicia sesión para buscar libros..." className="search-bar" />
          <button className="search-btn"><IconSearch /></button>
        </div>

        <div className="header-actions">
          <Link to="/login" className="user-access">
            <IconUser />
            <span>Ingresa</span>
          </Link>
          <button className="user-access" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setRegisterOpen(true)}>
            <IconUserPlus />
            <span>Crea tu cuenta</span>
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h1>El marketplace que conecta lectores con librerías</h1>
          <p>Miles de títulos de las mejores librerías independientes del país. Todo en un solo lugar.</p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => setJoinOpen(true)}>
              Comenzar a comprar
            </button>
            <Link to="/libreria" className="btn" id="btn-vender-libros">Vender libros</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgQkxN-TFkw-qgA1RKnj0Tmp4i7tXAbuEl3A&s"
            alt="Personas explorando libros" />
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        {STATS.map((s, i) => (
          <div key={i} className="stat-item">
            <div className={`stat-icon ${s.color}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon}/>
              </svg>
            </div>
            <h2>{s.num}</h2>
            <p>{s.label}</p>
          </div>
        ))}
      </section>

      {/* BENEFITS */}
      <section className="benefits">
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
      </section>

      {/* CATEGORIES */}
      <section className="categories">
        <h2>Explora nuestras categorías</h2>
        <p>Libros para todos los gustos y momentos</p>
        <div className="category-grid">
          {CATEGORIES.map((c, i) => (
            <div key={i} className="category-card"
              style={{ backgroundImage: `url(${c.img})` }}>
              <h3>{c.name}</h3>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/login" className="btn btn-primary">
            Inicia sesión para ver el catálogo completo
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
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
      </section>

      {/* CTA LIBRERÍAS */}
      <section className="cta-libraries">
        <h2>¿Tienes una librería?</h2>
        <p>Únete a nuestra red de librerías y alcanza a miles de lectores en todo el país.</p>
        <Link to="/libreria" className="btn btn-primary">Registrar mi librería</Link>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-container">
          <div className="footer-column">
            <h3>BookyHome</h3>
            <ul>
              <li><a href="#">Catálogo de libros</a></li>
              <li><a href="#">Cómo comprar</a></li>
              <li><a href="#">Métodos de pago</a></li>
              <li><a href="#">Envíos y entregas</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Comprar</h3>
            <ul>
              <li><a href="#">Catálogo de libros</a></li>
              <li><a href="#">Cómo comprar</a></li>
              <li><a href="#">Métodos de pago</a></li>
              <li><a href="#">Envíos y entregas</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Vender</h3>
            <ul>
              <li><a href="#">Vender en BookyHome</a></li>
              <li><a href="#">Cómo funciona</a></li>
              <li><a href="#">Planes y precios</a></li>
              <li><a href="#">Centro de vendedores</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Ayuda</h3>
            <ul>
              <li><a href="#">Centro de ayuda</a></li>
              <li><a href="#">Preguntas frecuentes</a></li>
              <li><a href="#">Contacto</a></li>
              <li><a href="#">Devoluciones</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 BookyHome - Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* MODAL: Comenzar a comprar */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)}
        title="¡Bienvenido a BookyHome!" subtitle="¿Ya tienes cuenta o eres nuevo por aquí?">
        <ModalOption to="/login" onClose={() => setJoinOpen(false)}
          iconPath="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
          title="Ya tengo cuenta" desc="Iniciar sesión en BookyHome" />
        <ModalOption to="/register" onClose={() => setJoinOpen(false)}
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