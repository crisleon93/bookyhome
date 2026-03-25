import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import axios from 'axios'

// ── Íconos ────────────────────────────────────────────────────────────────────

const IconUser = () => (
  <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
  </svg>
)

const IconStore = () => (
  <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25h-1.5A2.25 2.25 0 007.5 13.5V21m6 0H7.5m6 0h3.75A2.25 2.25 0 0019.5 18.75V9.375a2.25 2.25 0 00-.659-1.591l-4.5-4.5A2.25 2.25 0 0012.75 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21H7.5" />
  </svg>
)

const IconLocation = () => (
  <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
)

const IconMail = () => (
  <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
  </svg>
)

const IconLock = () => (
  <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 10.5V7.125A4.125 4.125 0 008.25 7.125V10.5M6 10.5h12a1.5 1.5 0 011.5 1.5v7.5A1.5 1.5 0 0118 21H6a1.5 1.5 0 01-1.5-1.5V12A1.5 1.5 0 016 10.5z" />
  </svg>
)

const IconEyeOpen = () => (
  <svg className="eye-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconEyeClosed = () => (
  <svg className="eye-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

// ── Componente ────────────────────────────────────────────────────────────────

function Libreria() {
  const [nombre,    setNombre]    = useState('')
  const [libreria,  setLibreria]  = useState('')
  const [direccion, setDireccion] = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [exito,     setExito]     = useState('')
  const [error,     setError]     = useState('')
  const [errors,    setErrors]    = useState({
    nombre: '', libreria: '', direccion: '', email: '', password: ''
  })

  const navigate = useNavigate()

  const validate = () => {
    const e = { nombre: '', libreria: '', direccion: '', email: '', password: '' }
    let valid = true

    if (!nombre.trim())    { e.nombre    = 'Este campo es obligatorio'; valid = false }
    if (!libreria.trim())  { e.libreria  = 'Este campo es obligatorio'; valid = false }
    if (!direccion.trim()) { e.direccion = 'Este campo es obligatorio'; valid = false }
    if (!email.trim()) {
      e.email = 'Este campo es obligatorio'; valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Ingresa un email válido'; valid = false
    }
    if (!password.trim()) {
      e.password = 'Este campo es obligatorio'; valid = false
    } else if (password.length < 8) {
      e.password = 'Mínimo 8 caracteres'; valid = false
    }

    setErrors(e)
    return valid
  }

  const clearField = (field) => setErrors(p => ({ ...p, [field]: '' }))

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      await axios.post('http://127.0.0.1:8000/libreria', {
        nombre, libreria, direccion, email, password
      })
      setExito('¡Librería registrada exitosamente! Ya puedes iniciar sesión.')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar la librería')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Header variant="simple" />
    <main className="auth-main">
      <div className="auth-card auth-card--wide">

        <h1 className="auth-title">Registrar Librería</h1>
        <p className="auth-subtitle">Vende tus libros en BookyHome</p>

        {exito && (
          <div className="flash flash--success">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {exito}
          </div>
        )}

        {error && (
          <span className="error-msg" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
            {error}
          </span>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-grid">

            {/* Nombre del dueño */}
            <div className="auth-field">
              <label htmlFor="nombre">Nombre</label>
              <div className="auth-input-wrapper">
                <IconUser />
                <input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={e => { setNombre(e.target.value); clearField('nombre') }}
                  className={errors.nombre ? 'input-error' : ''}
                />
              </div>
              {errors.nombre && <span className="error-msg">{errors.nombre}</span>}
            </div>

            {/* Nombre librería */}
            <div className="auth-field">
              <label htmlFor="libreria">Nombre de la librería</label>
              <div className="auth-input-wrapper">
                <IconStore />
                <input
                  id="libreria"
                  type="text"
                  placeholder="Mi Librería"
                  value={libreria}
                  onChange={e => { setLibreria(e.target.value); clearField('libreria') }}
                  className={errors.libreria ? 'input-error' : ''}
                />
              </div>
              {errors.libreria && <span className="error-msg">{errors.libreria}</span>}
            </div>

            {/* Dirección — full width */}
            <div className="auth-field auth-field--full">
              <label htmlFor="direccion">Dirección</label>
              <div className="auth-input-wrapper">
                <IconLocation />
                <input
                  id="direccion"
                  type="text"
                  placeholder="Calle Principal 123"
                  value={direccion}
                  onChange={e => { setDireccion(e.target.value); clearField('direccion') }}
                  className={errors.direccion ? 'input-error' : ''}
                />
              </div>
              {errors.direccion && <span className="error-msg">{errors.direccion}</span>}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrapper">
                <IconMail />
                <input
                  id="email"
                  type="email"
                  placeholder="@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearField('email') }}
                  className={errors.email ? 'input-error' : ''}
                />
              </div>
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>

            {/* Contraseña + ojito */}
            <div className="auth-field">
              <label htmlFor="password">Contraseña</label>
              <div className="auth-input-wrapper">
                <IconLock />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearField('password') }}
                  className={errors.password ? 'input-error' : ''}
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
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

          </div>{/* /auth-grid */}

          <button type="submit" className="btn btn-vinotinto" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Librería'}
          </button>

        </form>

        <div className="auth-footer-links">
          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>

      </div>
    </main>
    </>
  )
}

export default Libreria