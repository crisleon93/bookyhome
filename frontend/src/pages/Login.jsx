import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

// ── Íconos ────────────────────────────────────────────────────────────────────

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

const IconGoogle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

// ── Componente ────────────────────────────────────────────────────────────────

function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [errors, setErrors]     = useState({ email: '', password: '' })

  const navigate = useNavigate()

  const validate = () => {
    const newErrors = { email: '', password: '' }
    let valid = true

    if (!email.trim()) {
      newErrors.email = 'Este campo es obligatorio'
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresa un email válido'
      valid = false
    }
    if (!password.trim()) {
      newErrors.password = 'Este campo es obligatorio'
      valid = false
    } else if (password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres'
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  // ==================== HANDLE SUBMIT CORREGIDO ====================
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)

    try {
      const res = await axios.post('http://127.0.0.1:8000/login', { email, password })
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }
  // =================================================================

  return (
    <>
      <main className="auth-main">
        <div className="auth-card">

          <h1 className="auth-title">Iniciar Sesión</h1>
          <p className="auth-subtitle">Ingresa a tu cuenta de BookyHome</p>

          {/* Error del servidor */}
          {error && (
            <p className="error-msg" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrapper">
                <IconMail />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
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
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
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

            {/* Olvidé contraseña */}
            <div className="auth-forgot">
              <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </div>

            {/* Recordarme */}
            <div className="auth-remember">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span>Recordarme</span>
              </label>
            </div>

            <button type="submit" className="btn btn-vinotinto" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

          </form>

          {/* Separador Google */}
          <div className="auth-divider"><span>o continúa con</span></div>

          <button className="btn btn-google">
            <IconGoogle />
            Continuar con Google
          </button>

          <div className="auth-footer-links">
            <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
          </div>

        </div>
      </main>
    </>
  )
}

export default Login