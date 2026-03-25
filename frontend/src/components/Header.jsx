import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { IconSearch, IconUser, IconUserPlus } from './Icons'

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

function Header({ variant }) {
  const [modalOpen, setModalOpen] = useState(false)

  const isSimple = variant === "simple"
  const isWhite  = variant === "white"

  return (
    <>
      <header
        id="main-header"
        className={`${isSimple ? "header-center" : ""} ${isWhite ? "header-white" : "header-vinotinto"}`}
      >
        <Link to="/" className="logo-link">
          <img src={logo} alt="BookyHome" className="logo-img" />
        </Link>

        {!isSimple && (
          <>
            <div className="search-wrapper">
              <input type="text" placeholder="Buscar libros..." className="search-bar" />
              <button className="search-btn"><IconSearch /></button>
            </div>

            <div className="header-actions">
              <Link to="/login" className="user-access">
                <IconUser />
                <span>Ingresa</span>
              </Link>

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
    </>
  )
}

export default Header