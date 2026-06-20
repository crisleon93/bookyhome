import { useState } from 'react'
import { Link } from 'react-router-dom'

const COOKIE_KEY = 'bookyhome_cookie_consent'

function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    try {
      const val = window.localStorage.getItem(COOKIE_KEY)
      const yaDecidio = val === 'accepted' || val === 'rejected' || (val && val.startsWith('{'))
      return !yaDecidio
    } catch (err) {
      console.error('LocalStorage is not available:', err)
      return true
    }
  })

  const [showConfig, setShowConfig] = useState(false)
  const [prefs, setPrefs] = useState({
    analiticas: true,
    marketing: false,
    funcionales: true,
  })

  const aceptar = () => {
    try {
      window.localStorage.setItem(COOKIE_KEY, 'accepted')
    } catch (err) {
      console.error('Failed to save cookie consent:', err)
    }
    setVisible(false)
  }

  const rechazar = () => {
    try {
      window.localStorage.setItem(COOKIE_KEY, 'rejected')
    } catch (err) {
      console.error('Failed to save cookie consent:', err)
    }
    setVisible(false)
  }

  const guardarConfig = () => {
    try {
      window.localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs))
    } catch (err) {
      console.error('Failed to save cookie preferences:', err)
    }
    setVisible(false)
    setShowConfig(false)
  }

  const cerrarModal = () => setShowConfig(false)

  if (!visible) return null

  return (
    <>
      {/* ── Barra principal ── */}
      <div className="cookie-bar" role="dialog" aria-label="Aviso de cookies">
        <p className="cookie-bar__text">
          Usamos cookies para mejorar tu experiencia en BookyHome.{' '}
          <Link to="/legal" className="cookie-bar__link">
            Política de Privacidad
          </Link>
          .
        </p>
        <div className="cookie-bar__actions">
          <button
            className="cookie-bar__btn cookie-bar__btn--ghost"
            onClick={rechazar}
          >
            Rechazar
          </button>
          <button
            className="cookie-bar__btn cookie-bar__btn--outline"
            onClick={() => setShowConfig(true)}
          >
            Configurar
          </button>
          <button
            className="cookie-bar__btn cookie-bar__btn--solid"
            onClick={aceptar}
          >
            Aceptar cookies
          </button>
        </div>
      </div>

      {/* ── Modal de configuración ── */}
      {showConfig && (
        <div className="cookie-modal-overlay" onClick={cerrarModal}>
          <div className="cookie-modal" onClick={e => e.stopPropagation()}>
            <h2 className="cookie-modal__title">🍪 Configurar cookies</h2>
            <p className="cookie-modal__subtitle">
              Elige qué tipos de cookies deseas permitir. Las esenciales siempre están activas.
            </p>

            {/* Esenciales — siempre ON */}
            <div className="cookie-option">
              <div className="cookie-option__info">
                <span className="cookie-option__name">Esenciales</span>
                <span className="cookie-option__desc">Sesión, carrito y seguridad del sitio.</span>
              </div>
              <div className="cookie-toggle cookie-toggle--always">Siempre activas</div>
            </div>

            {/* Analíticas */}
            <div className="cookie-option">
              <div className="cookie-option__info">
                <span className="cookie-option__name">Analíticas</span>
                <span className="cookie-option__desc">Nos ayudan a entender cómo usas el sitio.</span>
              </div>
              <label className="cookie-switch" htmlFor="cookie-pref-analiticas">
                <input
                  id="cookie-pref-analiticas"
                  name="cookie_pref_analiticas"
                  type="checkbox"
                  checked={prefs.analiticas}
                  onChange={e => setPrefs({ ...prefs, analiticas: e.target.checked })}
                />
                <span className="cookie-switch__slider" />
              </label>
            </div>

            {/* Funcionales */}
            <div className="cookie-option">
              <div className="cookie-option__info">
                <span className="cookie-option__name">Funcionales</span>
                <span className="cookie-option__desc">Recuerdan tus preferencias y filtros.</span>
              </div>
              <label className="cookie-switch" htmlFor="cookie-pref-funcionales">
                <input
                  id="cookie-pref-funcionales"
                  name="cookie_pref_funcionales"
                  type="checkbox"
                  checked={prefs.funcionales}
                  onChange={e => setPrefs({ ...prefs, funcionales: e.target.checked })}
                />
                <span className="cookie-switch__slider" />
              </label>
            </div>

            {/* Marketing */}
            <div className="cookie-option">
              <div className="cookie-option__info">
                <span className="cookie-option__name">Marketing</span>
                <span className="cookie-option__desc">Contenido y anuncios personalizados.</span>
              </div>
              <label className="cookie-switch" htmlFor="cookie-pref-marketing">
                <input
                  id="cookie-pref-marketing"
                  name="cookie_pref_marketing"
                  type="checkbox"
                  checked={prefs.marketing}
                  onChange={e => setPrefs({ ...prefs, marketing: e.target.checked })}
                />
                <span className="cookie-switch__slider" />
              </label>
            </div>

            <div className="cookie-modal__footer">
              <button className="cookie-bar__btn cookie-bar__btn--ghost" onClick={rechazar}>
                Rechazar todas
              </button>
              <button className="cookie-bar__btn cookie-bar__btn--solid" onClick={guardarConfig}>
                Guardar preferencias
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CookieBanner
