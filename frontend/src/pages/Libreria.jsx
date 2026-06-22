import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerLibrary } from '../services/api'
import { notify } from '../components/ToastProvider'
import { 
  IconUser, 
  IconStore, 
  IconLocation, 
  IconPhone, 
  IconMail, 
  IconLock, 
  IconEyeOpen, 
  IconEyeClosed,
  IconCheck
} from '../components/Icons'
import { LegalModal, Terminos, Privacidad } from '../components/Legal'

function Libreria({ isModal = false, onSuccess }) {
  // ========================
  // Estado del formulario
  // ========================
  const [nombre,    setNombre]    = useState('')
  const [libreria,  setLibreria]  = useState('')
  const [ciudad,    setCiudad]    = useState('')
  const [tipoVia,   setTipoVia]   = useState('')
  const [numeroVia, setNumeroVia] = useState('')
  const [complemento, setComplemento] = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [exito,     setExito]     = useState('')
  const [error,     setError]     = useState('')
  
  const [aceptoTerminos, setAceptoTerminos] = useState(false)
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false)

  const [showTerminos, setShowTerminos] = useState(false)
  const [showPrivacidad, setShowPrivacidad] = useState(false)

  const navigate = useNavigate()
  
  // ========================
  // Constantes derivadas
  // ========================
  const direccionCompleta = [ciudad, tipoVia && numeroVia ? `${tipoVia} ${numeroVia}` : '', complemento]
    .filter(Boolean)
    .join(', ')

  const terminosCompletos = aceptoTerminos && aceptoPrivacidad

  const formReady =
    nombre.trim() &&
    libreria.trim() &&
    ciudad &&
    tipoVia &&
    numeroVia.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    /^\d{7,15}$/.test(telefono.trim()) &&
    password.length >= 8 &&
    password === confirmPassword &&
    terminosCompletos

  // ========================
  // Funciones de validación y utilidad
  // ========================
  const blockClipboard = (event) => {
    event.preventDefault()
    notify('Por seguridad, escribe este campo manualmente.', 'info')
  }

  const validate = () => {
    setError('')
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return false
    }
    if (!libreria.trim()) {
      setError('El nombre de la librería es obligatorio')
      return false
    }
    if (!ciudad || !tipoVia || !numeroVia.trim()) {
      setError('Completa la ubicación de la tienda')
      return false
    }
    if (!telefono.trim()) { 
      setError('El teléfono es obligatorio')
      return false 
    }
    if (!/^\d{7,15}$/.test(telefono.trim())) {
      setError('Ingresa un número de teléfono válido (solo números, entre 7 y 15 dígitos)')
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
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    if (!terminosCompletos) {
      setError('Debes aceptar tanto los Términos y Condiciones como la Política de Privacidad')
      return false
    }
    return true
  }

  // ========================
  // Manejador de envío del formulario
  // ========================
  // ========================
  // Envío del formulario de librería
  // ========================
  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      await registerLibrary({ 
        nombre, 
        libreria, 
        direccion: direccionCompleta, 
        telefono,
        email, 
        password,
        rol: "vendedor"
      })
      setExito('¡Librería registrada exitosamente! Redirigiendo...')
      notify('Librería registrada exitosamente', 'success')
      setTimeout(() => {
        if (isModal && onSuccess) {
          onSuccess()
        } else {
          navigate('/login')
        }
      }, 2500)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al registrar la librería'
      setError(msg)
      notify(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ========================
  // Contenido del formulario
  // ========================
  const formContent = (
    <div className={isModal ? "" : "auth-card auth-card--wide auth-card--compact"}>

      <h1 className="auth-title">Registrar Librería</h1>
      <p className="auth-subtitle">Vende tus libros en BookyHome</p>

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

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-grid">

          {/* Nombre del dueño */}
          <div className="auth-field">
            <label htmlFor="nombre">Nombre</label>
            <div className="auth-input-wrapper">
              <IconUser className="auth-input-icon" />
              <input
                id="nombre"
                type="text"
                placeholder="Tu nombre completo"
                value={nombre}
                onChange={e => { setNombre(e.target.value); setError('') }}
              />
            </div>
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
                onChange={e => { setLibreria(e.target.value); setError('') }}
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="auth-field auth-field--full">
            <label htmlFor="ciudad">Ubicación de la tienda</label>
            <div className="address-grid">
              <div className="auth-input-wrapper">
                <IconLocation />
                <select
                  id="ciudad"
                  className="auth-select"
                  value={ciudad}
                  onChange={e => { setCiudad(e.target.value); setError('') }}
                >
                  <option value="">Ciudad</option>
                  <option value="Bogota">Bogotá</option>
                  <option value="Medellin">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Cartagena">Cartagena</option>
                </select>
              </div>
              <div className="auth-input-wrapper">
                <IconLocation />
                <select
                  className="auth-select"
                  value={tipoVia}
                  onChange={e => { setTipoVia(e.target.value); setError('') }}
                >
                  <option value="">Tipo de vía</option>
                  <option value="Calle">Calle</option>
                  <option value="Carrera">Carrera</option>
                  <option value="Avenida">Avenida</option>
                  <option value="Diagonal">Diagonal</option>
                  <option value="Transversal">Transversal</option>
                </select>
              </div>
              <div className="auth-input-wrapper">
                <IconLocation />
                <input
                  type="text"
                  placeholder="Número: 45 # 12-30"
                  value={numeroVia}
                  onChange={e => { setNumeroVia(e.target.value); setError('') }}
                />
              </div>
              <div className="auth-input-wrapper">
                <IconLocation />
                <input
                  type="text"
                  placeholder="Complemento: local, piso, barrio"
                  value={complemento}
                  onChange={e => setComplemento(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Teléfono */}
          <div className="auth-field">
            <label htmlFor="telefono">Teléfono / Celular</label>
            <div className="auth-input-wrapper">
              <IconPhone />
              <input
                id="telefono"
                type="tel"
                placeholder="Tu teléfono"
                value={telefono}
                onChange={e => { setTelefono(e.target.value); setError('') }}
              />
            </div>
          </div>

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
                onChange={e => { setEmail(e.target.value); setError('') }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="auth-field">
            <label htmlFor="password">Contraseña</label>
            <div className="auth-input-wrapper">
              <IconLock />
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onPaste={blockClipboard}
                onCopy={blockClipboard}
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

          {/* Confirmar Contraseña */}
          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <div className="auth-input-wrapper">
              <IconLock />
              <input
                id="confirmPassword"
                type={showPass ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                onPaste={blockClipboard}
                onCopy={blockClipboard}
              />
            </div>
          </div>

        </div>{/* /auth-grid */}

        {/* Checkboxes de términos y privacidad */}
        <div className="auth-remember" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
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
                style={{ background: 'none', border: 'none', color: 'var(--vinotinto)', textDecoration: 'underline', fontWeight: '600', cursor: 'pointer' }}
              >
                términos y condiciones
              </button>
              {aceptoTerminos && ' ✓'} y la{' '}
              <button 
                type="button" 
                onClick={() => setShowPrivacidad(true)}
                style={{ background: 'none', border: 'none', color: 'var(--vinotinto)', textDecoration: 'underline', fontWeight: '600', cursor: 'pointer' }}
              >
                política de privacidad
              </button>
              {aceptoPrivacidad && ' ✓'}
            </span>
          </label>
        </div>

        <button type="submit" className="btn btn-vinotinto" disabled={loading || !formReady}>
          {loading ? 'Registrando...' : 'Registrar Librería'}
        </button>

      </form>

      {!isModal && (
        <div className="auth-footer-links">
          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      )}

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
    </div>
  )

  // ========================
  // Layout final según contexto
  // ========================
  if (isModal) {
    return formContent;
  }

  return (
    <main className="auth-main auth-main--compact">
      {formContent}
    </main>
  )
}

export default Libreria
