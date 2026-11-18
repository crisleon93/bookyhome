/**
 * CookieBanner.extra.test.jsx
 * Cubre las ramas faltantes de CookieBanner.jsx (7% restante)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CookieBanner from '../../components/CookieBanner'

const COOKIE_KEY = 'bookyhome_cookie_consent'

function renderBanner() {
  return render(<MemoryRouter><CookieBanner /></MemoryRouter>)
}

describe('CookieBanner — ramas extra', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('cierra el modal de configuración al hacer clic en el overlay', () => {
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: 'Configurar' }))
    expect(screen.getByText('Esenciales')).toBeInTheDocument()
    // Clic en el overlay (cookie-modal-overlay) debe cerrar el modal
    const overlay = document.querySelector('.cookie-modal-overlay')
    fireEvent.click(overlay)
    expect(screen.queryByText('Esenciales')).toBeNull()
    // El banner sigue visible
    expect(screen.getByRole('dialog', { name: 'Aviso de cookies' })).toBeInTheDocument()
  })

  it('rechazar desde el modal guarda rejected y cierra todo', () => {
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: 'Configurar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar todas' }))
    expect(localStorage.getItem(COOKIE_KEY)).toBe('rejected')
    expect(screen.queryByRole('dialog', { name: 'Aviso de cookies' })).toBeNull()
  })

  it('no falla si localStorage lanza en aceptar', () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar cookies' }))
    expect(logError).toHaveBeenCalled()
  })

  it('no falla si localStorage lanza en rechazar', () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    expect(logError).toHaveBeenCalled()
  })

  it('no falla si localStorage lanza en guardar preferencias', () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: 'Configurar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar preferencias' }))
    expect(logError).toHaveBeenCalled()
  })
})
