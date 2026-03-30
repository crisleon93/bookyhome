import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const IconUser = () => (
  <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
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

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
)

// ── Modal Legal ───────────────────────────────────────────────────────────────
function LegalModal({ open, onClose, onAccept, title, accepted, children }) {
  if (!open) return null
  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <button className="modal-close" aria-label="Cerrar" onClick={onClose}><IconClose /></button>
        <h2 className="modal-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{title}</h2>

        {accepted && (
          <div className="flash flash--success" style={{ marginBottom: '0.8rem', padding: '0.5rem 0.8rem' }}>
            <IconCheck /> Ya aceptaste este documento
          </div>
        )}

        <div style={{ fontSize: '0.85rem', color: '#444', lineHeight: '1.7', textAlign: 'left', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
          {children}
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
          {!accepted ? (
            <>
              <button className="btn btn-vinotinto" style={{ flex: 1 }} onClick={onAccept}>
                ✓ Acepto
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '6px', border: '1.5px solid #ccc', background: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '600', color: '#666' }}>
                Denegar
              </button>
            </>
          ) : (
            <button onClick={onClose}
              style={{ flex: 1, padding: '0.85rem', borderRadius: '6px', border: '1.5px solid #ccc', background: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '600', color: '#666' }}>
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Contenido legal ───────────────────────────────────────────────────────────
const Terminos = () => (
  <>
    <p><strong>Última actualización: 21 de Marzo de 2026</strong></p>
    <h3>1. Aceptación de los Términos</h3>
    <p>Al registrarte en BookyHome, declaras que tienes al menos 18 años o cuentas con autorización de un tutor legal, y aceptas cumplir estos términos en su totalidad.</p>
    <h3>2. Descripción del Servicio</h3>
    <p>BookyHome es una plataforma de comercio electrónico especializada en libros que conecta compradores con librerías y vendedores independientes. Actuamos como intermediarios y no somos propietarios de los libros listados.</p>
    <h3>3. Registro y Cuenta de Usuario</h3>
    <p>Debes proporcionar información verídica al registrarte. Eres el único responsable de mantener la confidencialidad de tu contraseña. BookyHome se reserva el derecho de suspender cuentas que violen estos términos.</p>
    <h3>4. Compras y Pagos</h3>
    <p>Los precios son establecidos por cada vendedor. Las transacciones están protegidas por nuestro sistema de Compra Protegida. BookyHome no garantiza la disponibilidad permanente de ningún producto.</p>
    <h3>5. Envíos y Entregas</h3>
    <p>Los tiempos de entrega varían según el vendedor y la ubicación. BookyHome no se responsabiliza por retrasos causados por empresas de mensajería o circunstancias externas.</p>
    <h3>6. Devoluciones y Reembolsos</h3>
    <p>Tienes hasta 15 días calendario desde la recepción del producto para solicitar una devolución. Los reembolsos se procesan en 5 a 10 días hábiles.</p>
    <h3>7. Conducta del Usuario</h3>
    <p>Está prohibido publicar información falsa, usar la plataforma para actividades ilegales, copiar contenido protegido o intentar acceder a cuentas ajenas.</p>
    <h3>8. Propiedad Intelectual</h3>
    <p>El nombre BookyHome, logo, diseño y contenido son propiedad exclusiva de BookyHome. Queda prohibida su reproducción sin autorización expresa.</p>
    <h3>9. Modificaciones</h3>
    <p>BookyHome puede actualizar estos términos en cualquier momento. Los cambios entran en vigor 30 días después de su publicación.</p>
  </>
)

const Privacidad = () => (
  <>
    <p><strong>Última actualización: 21 de Marzo de 2026</strong></p>
    <h3>1. Información que Recopilamos</h3>
    <p>Recopilamos nombre completo, email, contraseña encriptada, dirección de envío, historial de pedidos y datos de navegación.</p>
    <h3>2. Cómo Usamos tu Información</h3>
    <p>Usamos tus datos para gestionar tu cuenta, procesar pedidos, enviarte confirmaciones y mejorar nuestros servicios.</p>
    <h3>3. Compartir tu Información</h3>
    <p>No vendemos tu información a terceros. Solo la compartimos con vendedores para procesar pedidos, empresas de mensajería y autoridades cuando la ley lo exija.</p>
    <h3>4. Seguridad de tus Datos</h3>
    <p>Tu contraseña se almacena encriptada con bcrypt. Usamos HTTPS para todas las transacciones y realizamos auditorías periódicas de seguridad.</p>
    <h3>5. Cookies</h3>
    <p>Usamos cookies para mantener tu sesión, recordar tus preferencias y analizar el tráfico. Puedes desactivarlas desde tu navegador.</p>
    <h3>6. Tus Derechos</h3>
    <p>Tienes derecho a acceder, rectificar y eliminar tus datos. Contáctanos en privacidad@bookyhome.com</p>
    <h3>7. Retención de Datos</h3>
    <p>Conservamos tus datos mientras tu cuenta esté activa. Si la eliminas, borramos tus datos en máximo 30 días.</p>
    <h3>8. Menores de Edad</h3>
    <p>BookyHome no está dirigida a menores de 18 años. Si eres tutor y crees que tu hijo proporcionó datos, contáctanos para eliminarlos.</p>
  </>
)

// ── Componente principal ───────────────────────────────────────────────────────
function Register() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [aceptoTerminos, setAceptoTerminos] = useState(false)
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false)

  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [loading, setLoading] = useState(false)

  const [showTerminos, setShowTerminos] = useState(false)
  const [showPrivacidad, setShowPrivacidad] = useState(false)

  const navigate = useNavigate()

  const terminosCompletos = aceptoTerminos && aceptoPrivacidad

  const validate = () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return false
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un email válido')
      return false
    }
    if (!password.trim() || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return false
    }
    if (!terminosCompletos) {
      setError('Debes aceptar tanto los Términos y Condiciones como la Política de Privacidad')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)
    try {
      // Siempre registramos como "comprador" (o el rol que prefieras por defecto)
      await axios.post('http://127.0.0.1:8000/register', {
        nombre,
        email,
        password,
        rol: "comprador"   // ← Aquí lo fijamos
      })

      setExito(true)
      setCountdown(5)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!exito) return
    if (countdown === 0) {
      navigate('/login')
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [exito, countdown, navigate])

  return (
    <>
      <main className="auth-main">
        <div className="auth-card">

          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Únete y accede a miles de libros</p>

          {exito && (
            <div className="flash flash--success" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck />
                <span>¡Cuenta creada exitosamente! Serás redirigido al login en <strong>{countdown}</strong> segundos...</span>
              </div>
              <button 
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: '#2e7d32', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Ir al login ahora →
              </button>
            </div>
          )}

          {error && (
            <span className="error-msg" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
              {error}
            </span>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className="auth-field">
              <label htmlFor="nombre">Nombre completo</label>
              <div className="auth-input-wrapper">
                <IconUser />
                <input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrapper">
                <IconMail />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Contraseña</label>
              <div className="auth-input-wrapper">
                <IconLock />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="btn-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <IconEyeClosed /> : <IconEyeOpen />}
                </button>
              </div>
            </div>

            {/* Checkbox de términos y privacidad */}
            <div className="auth-remember" style={{ marginBottom: '1.5rem' }}>
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={terminosCompletos}
                  readOnly
                />
                <span>
                  He leído y acepto los{' '}
                  <button 
                    type="button" 
                    onClick={() => setShowTerminos(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--vinotinto)', textDecoration: 'underline', fontWeight: '600' }}
                  >
                    términos y condiciones
                  </button>
                  {aceptoTerminos && ' ✓'} y la{' '}
                  <button 
                    type="button" 
                    onClick={() => setShowPrivacidad(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--vinotinto)', textDecoration: 'underline', fontWeight: '600' }}
                  >
                    política de privacidad
                  </button>
                  {aceptoPrivacidad && ' ✓'}
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn-vinotinto" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="auth-footer-links">
            <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
            <p>¿Quieres vender libros? <Link to="/libreria">Registra tu librería</Link></p>
          </div>
        </div>

        {/* Modales de Términos y Privacidad */}
        <LegalModal
          open={showTerminos}
          onClose={() => setShowTerminos(false)}
          onAccept={() => setAceptoTerminos(true)}
          accepted={aceptoTerminos}
          title="Términos y Condiciones de Uso — BookyHome"
        >
          <Terminos />
        </LegalModal>

        <LegalModal
          open={showPrivacidad}
          onClose={() => setShowPrivacidad(false)}
          onAccept={() => setAceptoPrivacidad(true)}
          accepted={aceptoPrivacidad}
          title="Política de Privacidad — BookyHome"
        >
          <Privacidad />
        </LegalModal>

      </main>
    </>
  )
}

export default Register