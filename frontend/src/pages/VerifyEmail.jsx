import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { IconCheck, IconLock } from '../components/Icons'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [status, setStatus] = useState(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? '' : 'Token de verificación no encontrado')
  const verificationStarted = useRef(false)

  useEffect(() => {
    if (!token || verificationStarted.current) return
    verificationStarted.current = true

    const verifyEmail = async () => {
      try {
        console.log('Verificando email con token:', token)
        const res = await api.get(`/verify-email?token=${token}`)
        console.log('Respuesta del backend:', res.data)
        if (res.data) {
          setStatus('success')
          setMessage(res.data.mensaje || 'Correo verificado exitosamente')
        }
      } catch (err) {
        console.error('Error verificando email:', err)
        console.error('Error response:', err.response)
        console.error('Error status:', err.response?.status)
        console.error('Error data:', err.response?.data)
        
        let errorMsg = 'Error al verificar el correo'
        if (err.response?.data?.detail) {
          errorMsg = err.response.data.detail
        } else if (err.response?.status === 404) {
          errorMsg = 'El endpoint de verificación no existe. Contacta al administrador.'
        } else if (err.message) {
          errorMsg = err.message
        }
        
        setStatus('error')
        setMessage(errorMsg)
      }
    }

    verifyEmail()
  }, [token])

  const handleGoToLogin = () => {
    navigate('/login')
  }

  return (
    <main className="auth-main">
      <div className="auth-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
        
        {status === 'loading' && (
          <>
            <div style={{ color: '#7A1E3A', marginBottom: '20px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                border: '4px solid #f3f3f3', 
                borderTop: '4px solid #7A1E3A', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <h2 className="auth-title" style={{ marginBottom: '10px' }}>Verificando tu correo...</h2>
              <p className="auth-subtitle">Por favor espera un momento</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ color: '#15803d', marginBottom: '20px' }}>
              <IconCheck width={64} height={64} strokeWidth={1.5} style={{ margin: '0 auto 20px', display: 'block' }} />
              <h2 className="auth-title" style={{ marginBottom: '10px' }}>¡Correo verificado!</h2>
              <p className="auth-subtitle">Tu cuenta ha sido confirmada exitosamente</p>
            </div>
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #86efac', 
              borderRadius: '8px', 
              padding: '20px', 
              marginBottom: '20px' 
            }}>
              <p style={{ color: '#166534', margin: 0 }}>
                {message}
              </p>
            </div>
            <button className="btn btn-vinotinto" onClick={handleGoToLogin}>
              Iniciar Sesión
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ color: '#dc2626', marginBottom: '20px' }}>
              <IconLock width={64} height={64} strokeWidth={1.5} style={{ margin: '0 auto 20px', display: 'block' }} />
              <h2 className="auth-title" style={{ marginBottom: '10px' }}>Error de verificación</h2>
              <p className="auth-subtitle">No pudimos verificar tu correo</p>
            </div>
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fca5a5', 
              borderRadius: '8px', 
              padding: '20px', 
              marginBottom: '20px' 
            }}>
              <p style={{ color: '#991b1b', margin: 0 }}>
                {message}
              </p>
              <p style={{ color: '#991b1b', margin: '10px 0 0', fontSize: '0.9em' }}>
                Si tu correo ya está verificado, puedes iniciar sesión directamente.
              </p>
            </div>
            <button className="btn btn-vinotinto" onClick={handleGoToLogin}>
              Ir al inicio de sesión
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}

export default VerifyEmail
