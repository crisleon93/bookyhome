import { useEffect, useState } from 'react'

const COOKIE_KEY = 'bookyhome_cookie_consent'

function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem(COOKIE_KEY) !== 'accepted')
  }, [])

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de cookies">
      <div>
        <strong>Usamos cookies</strong>
        <p>Guardamos preferencias y datos de sesion para mejorar tu experiencia en BookyHome.</p>
      </div>
      <button className="btn btn-vinotinto cookie-banner__button" onClick={acceptCookies}>
        Aceptar
      </button>
    </div>
  )
}

export default CookieBanner
