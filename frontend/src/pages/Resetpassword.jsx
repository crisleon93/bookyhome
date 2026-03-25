import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import axios from 'axios'

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

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

function ResetPassword() {
  const [password,    setPassword]    = useState('')
  const [confirmar,   setConfirmar]   = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [exito,       setExito]       = useState(false)
  const [error,       setError]       = useState('')
  const [tokenError,  setTokenError]  = useState(false)
  const [errors,      setErrors]      = useState({ password: '', confirmar: '' })
  const [countdown,   setCountdown]   = useState(5)

  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  // Verificar que hay token en la URL
  useEffect(() => {
    if (!token) setTokenError(true)
  }, [token])

  // Countdown para redirigir al login tras éxito
  useEffect(() => {
    if (!exito) return
    if (countdown === 0) { navigate('/login'); return }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [exito, countdown, navigate])

  const validate = () => {
    const newErrors = { password: '', confirmar: '' }
    let valid = true

    if (!password.trim()) {
      newErrors.password = 'Este campo es obligatorio'; valid = false
    } else if (password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres'; valid = false
    }
    if (!confirmar.trim()) {
      newErrors.confirmar = 'Este campo es obligatorio'; valid = false
    } else if (password !== confirmar) {
      newErrors.confirmar = 'Las contraseñas no coinciden'; valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      await axios.post('http://127.0.0.1:8000/reset-password', { token, password })
      setExito(true)
      setCountdown(5)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  // Token inválido o no existe
  if (tokenError) {
    return (
      <>
      <Header variant="simple" />
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-icon-top">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="auth-title">Enlace inválido</h1>
          <p className="auth-subtitle">Este enlace no es válido o ha expirado. Solicita uno nuevo.</p>
          <div className="auth-footer-links">
            <p><Link to="/forgot-password">Solicitar nuevo enlace</Link></p>
            <p><Link to="/login">← Volver al login</Link></p>
          </div>
        </div>
      </main>
    )
  

  return (
    <main className="auth-main">
      <div className="auth-card">

        <div className="auth-icon-top">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 10.5V7.125A4.125 4.125 0 008.25 7.125V10.5M6 10.5h12a1.5 1.5 0 011.5 1.5v7.5A1.5 1.5 0 0118 21H6a1.5 1.5 0 01-1.5-1.5V12A1.5 1.5 0 016 10.5z" />
          </svg>
        </div>

        <h1 className="auth-title">Nueva contraseña</h1>
        <p className="auth-subtitle">Escribe tu nueva contraseña</p>

        {/* Éxito con countdown */}
        {exito && (
          <div className="flash flash--success" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconCheck />
              <span>¡Contraseña actualizada! Serás redirigido al login en <strong>{countdown}</strong> segundos...</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: '#a5d6a7', borderRadius: '2px' }}>
              <div style={{
                height: '100%', background: '#2e7d32', borderRadius: '2px',
                width: `${(countdown / 5) * 100}%`, transition: 'width 1s linear'
              }} />
            </div>
            <button onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: '#2e7d32', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline' }}>
              Ir al login ahora →
            </button>
          </div>
        )}

        {error && (
          <span className="error-msg" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
            {error}
          </span>
        )}

        {!exito && (
          <form onSubmit={handleSubmit} noValidate>

            {/* Nueva contraseña */}
            <div className="auth-field">
              <label htmlFor="password">Nueva contraseña</label>
              <div className="auth-input-wrapper">
                <IconLock />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                  className={errors.password ? 'input-error' : ''}
                />
                <button type="button" className="btn-eye"
                  aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                  onClick={() => setShowPass(v => !v)}>
                  {showPass ? <IconEyeClosed /> : <IconEyeOpen />}
                </button>
              </div>
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            {/* Confirmar contraseña */}
            <div className="auth-field">
              <label htmlFor="confirmar">Confirmar contraseña</label>
              <div className="auth-input-wrapper">
                <IconLock />
                <input
                  id="confirmar"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={confirmar}
                  onChange={e => { setConfirmar(e.target.value); setErrors(p => ({ ...p, confirmar: '' })) }}
                  className={errors.confirmar ? 'input-error' : ''}
                />
                <button type="button" className="btn-eye"
                  aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                  onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <IconEyeClosed /> : <IconEyeOpen />}
                </button>
              </div>
              {errors.confirmar && <span className="error-msg">{errors.confirmar}</span>}
            </div>

            <button type="submit" className="btn btn-vinotinto" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>

          </form>
        )}

        <div className="auth-footer-links">
          <p><Link to="/login">← Volver al inicio de sesión</Link></p>
        </div>

      </div>
    </main>
    </>
  )
}
}

export default ResetPassword