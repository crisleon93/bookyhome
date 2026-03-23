import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const IconMail = () => (
  <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

function ForgotPassword() {
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [exito,    setExito]    = useState('')
  const [error,    setError]    = useState('')
  const [emailErr, setEmailErr] = useState('')

  const validate = () => {
    if (!email.trim()) { setEmailErr('Este campo es obligatorio'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr('Ingresa un email válido'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      await axios.post('http://127.0.0.1:8000/forgot-password', { email })
      setExito('Si el email está registrado, recibirás un enlace en tu correo en unos minutos.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar el enlace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-main">
      <div className="auth-card">

        {/* Icono candado */}
        <div className="auth-icon-top">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 10.5V7.125A4.125 4.125 0 008.25 7.125V10.5M6 10.5h12a1.5 1.5 0 011.5 1.5v7.5A1.5 1.5 0 0118 21H6a1.5 1.5 0 01-1.5-1.5V12A1.5 1.5 0 016 10.5z" />
          </svg>
        </div>

        <h1 className="auth-title">¿Olvidaste tu contraseña?</h1>
        <p className="auth-subtitle">Ingresa tu email y te enviaremos un enlace para restablecerla</p>

        {exito && (
          <div className="flash flash--success">
            <IconCheck />
            {exito}
          </div>
        )}

        {error && (
          <span className="error-msg" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
            {error}
          </span>
        )}

        {!exito && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrapper">
                <IconMail />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                  className={emailErr ? 'input-error' : ''}
                />
              </div>
              {emailErr && <span className="error-msg">{emailErr}</span>}
            </div>

            <button type="submit" className="btn btn-vinotinto" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <div className="auth-footer-links">
          <p><Link to="/login">← Volver al inicio de sesión</Link></p>
        </div>

      </div>
    </main>
  )
}

export default ForgotPassword