import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CookieBanner from '../../components/CookieBanner'

const COOKIE_KEY = 'bookyhome_cookie_consent'

function renderBanner() {
  return render(
    <MemoryRouter>
      <CookieBanner />
    </MemoryRouter>,
  )
}

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it.each([
    ['accepted', 'Aceptar cookies'],
    ['rejected', 'Rechazar'],
    ['{"analiticas":false}', 'Configurar'],
  ])('no aparece si ya existe un consentimiento guardado (%s)', (consent) => {
    localStorage.setItem(COOKIE_KEY, consent)
    renderBanner()
    expect(screen.queryByRole('dialog', { name: 'Aviso de cookies' })).not.toBeInTheDocument()
  })

  it('guarda el consentimiento de aceptación o rechazo', () => {
    const { unmount } = renderBanner()
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar cookies' }))
    expect(localStorage.getItem(COOKIE_KEY)).toBe('accepted')
    expect(screen.queryByRole('dialog', { name: 'Aviso de cookies' })).not.toBeInTheDocument()

    unmount()
    localStorage.removeItem(COOKIE_KEY)
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    expect(localStorage.getItem(COOKIE_KEY)).toBe('rejected')
  })

  it('permite configurar categorías opcionales y guardar preferencias', () => {
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: 'Configurar' }))

    expect(screen.getByText('Esenciales')).toBeInTheDocument()
    fireEvent.click(document.getElementById('cookie-pref-analiticas'))
    fireEvent.click(document.getElementById('cookie-pref-marketing'))
    fireEvent.click(document.getElementById('cookie-pref-funcionales'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar preferencias' }))

    expect(JSON.parse(localStorage.getItem(COOKIE_KEY))).toEqual({
      analiticas: false,
      marketing: true,
      funcionales: false,
    })
    expect(screen.queryByRole('dialog', { name: 'Aviso de cookies' })).not.toBeInTheDocument()
  })

  it('mantiene visible el aviso si localStorage no está disponible', () => {
    const error = new Error('storage disabled')
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw error
    })

    renderBanner()

    expect(screen.getByRole('dialog', { name: 'Aviso de cookies' })).toBeInTheDocument()
    expect(logError).toHaveBeenCalledWith('LocalStorage is not available:', error)
  })
})
