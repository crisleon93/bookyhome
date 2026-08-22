import { useState, useEffect } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { register, checkEmailVerification } from '../services/api'

import { notify } from '../components/ToastProvider'

import { IconUser, IconMail, IconPhone, IconLock, IconEyeOpen, IconEyeClosed, IconCheck } from '../components/Icons'

import { LegalModal, Terminos, Privacidad } from '../components/Legal'



function Register({ isModal = false, onSuccess }) {

  const [nombre, setNombre] = useState('')

  const [apellidos, setApellidos] = useState('')

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [confirmPassword, setConfirmPassword] = useState('')

  const [telefono, setTelefono] = useState('')

  const [showPass, setShowPass] = useState(false)



  const [aceptoTerminos, setAceptoTerminos] = useState(false)

  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false)



  const [error, setError] = useState('')

  const [exito, setExito] = useState(false)

  const [loading, setLoading] = useState(false)

  const [polling, setPolling] = useState(false)



  const [showTerminos, setShowTerminos] = useState(false)

  const [showPrivacidad, setShowPrivacidad] = useState(false)



  const navigate = useNavigate()



  const terminosCompletos = aceptoTerminos && aceptoPrivacidad

  const passwordScore = [

    password.length >= 8,

    /[A-Z]/.test(password),

    /[0-9]/.test(password),

    /[^A-Za-z0-9]/.test(password)

  ].filter(Boolean).length

  const passwordStrength = password.length === 0

    ? { label: 'Completa tu contraseña', width: '0%', color: '#ddd' }

    : passwordScore <= 2

      ? { label: 'Contraseña débil', width: '33%', color: '#dc2626' }

      : passwordScore === 3

        ? { label: 'Contraseña media', width: '66%', color: '#ca8a04' }

        : { label: 'Contraseña fuerte', width: '100%', color: '#15803d' }

  const formReady =

    nombre.trim() &&

    apellidos.trim() &&

    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&

    /^\d{7,15}$/.test(telefono.trim()) &&

    password.length >= 8 &&

    password === confirmPassword &&

    terminosCompletos



  const blockClipboard = (event) => {

    event.preventDefault()

    notify('Por seguridad, escribe este campo manualmente.', 'info')

  }



  const validate = () => {

    if (!nombre.trim()) {

      setError('El nombre es obligatorio')

      return false

    }

    if (!apellidos.trim()) {

      setError('Los apellidos son obligatorios')

      return false

    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

      setError('Ingresa un email válido')

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



  const handleSubmit = async (e) => {

    e.preventDefault()

    setError('')
    setExito(false)



    if (!validate()) return



    setLoading(true)

    try {

      await register({

        nombre: `${nombre.trim()} ${apellidos.trim()}`,

        email,

        password,

        telefono,

        rol: "comprador"

      })



      setExito(true)
      setPolling(true)
      notify('Cuenta creada exitosamente. Por favor verifica tu correo electrónico.', 'success')

    } catch (err) {

      const message = err.response?.data?.detail || 'Error al crear la cuenta'

      setError(message)

      notify(message, 'error')

    } finally {

      setLoading(false)

    }

  }

  // Polling para verificar si el correo fue confirmado
  useEffect(() => {
    if (!polling || !email) return

    const checkVerification = async () => {
      try {
        const response = await checkEmailVerification(email)
        if (response.data.verificado) {
          setPolling(false)
          setExito(false)
          // Cerrar modal de registro si es modal
          if (isModal && onSuccess) onSuccess()
          // Abrir modal de login
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('bookyhome:open-login'))
          }, 100)
          notify('¡Correo verificado! Ahora puedes iniciar sesión.', 'success')
        }
      } catch (err) {
        console.error('Error verificando correo:', err)
      }
    }

    // Verificar inmediatamente
    checkVerification()

    // Luego verificar cada 3 segundos
    const interval = setInterval(checkVerification, 3000)

    return () => clearInterval(interval)
  }, [polling, email, isModal, onSuccess])



  const formContent = (

    <div className={isModal ? "" : "auth-card auth-card--wide auth-card--compact"}>

      <h1 className="auth-title">Crear Cuenta</h1>

      <p className="auth-subtitle">Únete y accede a miles de libros</p>



      {exito && (

        <div className="flash flash--success" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            <IconCheck />

            <span>¡Cuenta creada exitosamente! Revisa tu correo y haz clic en el enlace de confirmación. El modal de inicio de sesión se abrirá automáticamente cuando confirmes tu correo.</span>

          </div>

        </div>

      )}



      {error && (

        <span className="error-msg" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>

          {error}

        </span>

      )}



      <form onSubmit={handleSubmit} noValidate>

        <div className="auth-grid">

          <div className="auth-field">

            <label htmlFor="nombre">Nombre</label>

            <div className="auth-input-wrapper">

              <IconUser className="auth-input-icon" />

              <input

                id="nombre"

                type="text"

                placeholder="Juan Pérez"

                value={nombre}

                onChange={e => setNombre(e.target.value)}

              />

            </div>

          </div>



          <div className="auth-field">

            <label htmlFor="apellidos">Apellidos</label>

            <div className="auth-input-wrapper">

              <IconUser className="auth-input-icon" />

              <input

                id="apellidos"

                type="text"

                placeholder="Pérez García"

                value={apellidos}

                onChange={e => setApellidos(e.target.value)}

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

                placeholder="ejemplo@gmail.com"

                value={email}

                onChange={e => setEmail(e.target.value)}

                onPaste={blockClipboard}

                onCopy={blockClipboard}

              />

            </div>

          </div>



          <div className="auth-field">

            <label htmlFor="telefono">Teléfono / Celular</label>

            <div className="auth-input-wrapper">

              <IconPhone />

              <input

                id="telefono"

                type="tel"

                placeholder="3001234567"

                value={telefono}

                onChange={e => setTelefono(e.target.value)}

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

                onPaste={blockClipboard}

                onCopy={blockClipboard}

              />

              <button type="button" className="btn-eye" onClick={() => setShowPass(!showPass)}>

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



          <div className="auth-field">

            <label htmlFor="confirmPassword">Confirmar contraseña</label>

            <div className="auth-input-wrapper">

              <IconLock />

              <input

                id="confirmPassword"

                type={showPass ? 'text' : 'password'}

                placeholder="Repite la contraseña"

                value={confirmPassword}

                onChange={e => setConfirmPassword(e.target.value)}

                onPaste={blockClipboard}

                onCopy={blockClipboard}

              />

            </div>

          </div>

        </div>



        {/* Checkbox de términos y privacidad */}

        <div className="auth-remember" style={{ marginBottom: '1.5rem' }}>

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

          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}

        </button>

      </form>



      {!isModal && (

        <div className="auth-footer-links">

          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>

          <p>¿Quieres vender libros? <Link to="/libreria">Registra tu librería</Link></p>

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



  if (isModal) {

    return formContent;

  }



  return (

    <main className="auth-main auth-main--compact">

      {formContent}

    </main>

  )

}



export default Register

