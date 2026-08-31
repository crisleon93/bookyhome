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
import LeafletAddressPickerModal from '../components/LeafletAddressPickerModal'

function Libreria({ isModal = false, onSuccess }) {
  // ========================
  // Estado del formulario
  // ========================
  const [nombre,    setNombre]    = useState('')
  const [libreria,  setLibreria]  = useState('')
  const [ciudad,    setCiudad]    = useState('')
  const [direccion, setDireccion] = useState('')
  const [complemento, setComplemento] = useState('')
  const [mapaOpen,  setMapaOpen]  = useState(false)
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
  const direccionCompleta = [ciudad, direccion.trim(), complemento.trim()]
    .filter(Boolean)
    .join(', ')

  const terminosCompletos = aceptoTerminos && aceptoPrivacidad

  const passwordScore = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length
  const passwordStrength = password.length === 0
    ? { label: 'Completa la contraseña', width: '0%', color: '#ddd' }
    : passwordScore <= 2
      ? { label: 'Contraseña débil', width: '33%', color: '#dc2626' }
      : passwordScore === 3
        ? { label: 'Contraseña media', width: '66%', color: '#ca8a04' }
        : { label: 'Contraseña fuerte', width: '100%', color: '#15803d' }

  const formReady =
    nombre.trim() &&
    libreria.trim() &&
    ciudad &&
    direccion.trim() &&
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
    if (!ciudad || !direccion.trim()) {
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
                placeholder="Juan Pérez"
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

          {/* Ciudad + Teléfono */}
          <div className="auth-field">
            <label htmlFor="ciudad">Ciudad</label>
            <div className="auth-input-wrapper">
              <IconLocation />
              <select
                id="ciudad"
                className="auth-select"
                value={ciudad}
                onChange={e => { setCiudad(e.target.value); setError('') }}
              >
                <option value="">Selecciona tu ciudad</option>
                <option value="Bogota">Bogotá</option>
                <option value="Medellin">Medellín</option>
                <option value="Cali">Cali</option>
                <option value="Barranquilla">Barranquilla</option>
                <option value="Cartagena">Cartagena</option>
                <option value="Santa Marta">Santa Marta</option>
                <option value="Bucaramanga">Bucaramanga</option>
                <option value="Pereira">Pereira</option>
                <option value="Manizales">Manizales</option>
                <option value="Armenia">Armenia</option>
                <option value="Ibague">Ibagué</option>
                <option value="Neiva">Neiva</option>
                <option value="Villavicencio">Villavicencio</option>
                <option value="Pasto">Pasto</option>
              </select>
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
                placeholder="3001234567"
                value={telefono}
                onChange={e => { setTelefono(e.target.value); setError('') }}
              />
            </div>
          </div>

          {/* Dirección + botón mapa — misma fila del grid */}
          <div className="auth-field">
            <label htmlFor="direccion">Dirección de la tienda</label>
            <div className="auth-input-wrapper">
              <IconLocation />
              <input
                id="direccion"
                type="text"
                placeholder="Ej: Calle 45 # 12-30"
                value={direccion}
                onChange={e => { setDireccion(e.target.value); setError('') }}
              />
            </div>
          </div>

          <div className="auth-field">
            <label>&nbsp;</label>
            <button
              type="button"
              onClick={() => setMapaOpen(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0.56rem 1rem',
                border: '1.5px solid var(--vinotinto)',
                borderRadius: '8px',
                background: '#fff',
                color: 'var(--vinotinto)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Elegir en mapa
            </button>
          </div>

          {/* Complemento — columna izquierda */}
          <div className="auth-field">
            <label htmlFor="complemento">Complemento <span style={{ fontWeight: 400, color: '#aaa', fontSize: '0.8rem' }}>(opcional)</span></label>
            <div className="auth-input-wrapper">
              <IconLocation />
              <input
                id="complemento"
                type="text"
                placeholder="Local, piso, barrio, referencia"
                value={complemento}
                onChange={e => setComplemento(e.target.value)}
              />
            </div>
          </div>

          {/* Email — columna derecha */}
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="auth-input-wrapper">
              <IconMail />
              <input
                id="email"
                type="email"
                placeholder="ejemplo@gmail.com"
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
            <div
              className="password-strength"
              style={{ '--strength-width': passwordStrength.width, '--strength-color': passwordStrength.color }}
            >
              <div className="password-strength__bar"><span /></div>
              <span className="password-strength__label">{passwordStrength.label}</span>
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
                placeholder="Repite la contraseña"
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
              onChange={e => {
                setAceptoTerminos(e.target.checked)
                setAceptoPrivacidad(e.target.checked)
              }}
            />
            <span>
              Acepto los{' '}
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

      {mapaOpen && (
        <LeafletAddressPickerModal
          isOpen={mapaOpen}
          onClose={() => setMapaOpen(false)}
          initialCity={ciudad}
          onGpsCity={(ciudadResuelta) => {
            setCiudad(ciudadResuelta);
          }}
          onSelect={(data) => {
            if (data.direccion)     setDireccion(data.direccion)
            if (data.ciudadResuelta) setCiudad(data.ciudadResuelta)
            setMapaOpen(false)
          }}
        />
      )}
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
