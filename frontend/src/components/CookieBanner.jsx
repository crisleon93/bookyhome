import { useState } from 'react'

const COOKIE_KEY = 'bookyhome_cookie_consent'

const getCookieConsent = () => {
  try {
    return window.localStorage.getItem(COOKIE_KEY)
  } catch {
    return 'accepted'
  }
}

const setCookieConsent = () => {
  try {
    window.localStorage.setItem(COOKIE_KEY, 'accepted')
  } catch {
    // Si el navegador bloquea localStorage, igual ocultamos el aviso en esta sesión.
  }
}

function CookieBanner() {
  const [visible, setVisible] = useState(() => getCookieConsent() !== 'accepted')

  const acceptCookies = () => {
    setCookieConsent()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de cookies">
      <div>
        <strong>Usamos cookies</strong>
        <p>Guardamos preferencias y datos de sesión para mejorar tu experiencia en BookyHome.</p>
      </div>
      <button className="btn btn-vinotinto cookie-banner__button" onClick={acceptCookies}>
        Aceptar
      </button>
    </div>
  )
}

export default CookieBanner
