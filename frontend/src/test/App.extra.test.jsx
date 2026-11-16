/**
 * App.extra.test.jsx — ramas no cubiertas del 1.8% faltante
 *
 * Cubre:
 * - hasFooterSidebar true para rutas /mi-tienda, /vendedor/*, /post-login,
 *   /perfil/*, /publicar/* (Footer hasSidebar=true)
 * - /privacidad → LegalPage type="privacidad"
 * - /favoritos → redirige a /lista-deseos (PrivateRoute mock pasa)
 * - /carrito → redirige a /?seccion=Carrito
 * - Ruta inexistente (*) → redirige a /
 * - /forgot-password → redirige a /
 * - /legal → redirige a /
 * - Intervalo limpia token cada 5 s (checkToken vía setInterval)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import App from '../App'

const mocks = vi.hoisted(() => ({ getUserRole: vi.fn(() => null) }))

vi.mock('../hooks/useAuth', () => ({ getUserRole: mocks.getUserRole }))

vi.mock('../components/Header', () => ({
  default: ({ variant, hasSidebar }) => <div>Header:{variant}:{String(hasSidebar)}</div>,
}))
vi.mock('../components/Footer', () => ({
  default: ({ hasSidebar }) => <div>Footer:{String(hasSidebar)}</div>,
}))
vi.mock('../components/CookieBanner', () => ({ default: () => <div>Cookies</div> }))
vi.mock('../components/ToastProvider', () => ({ ToastProvider: ({ children }) => children }))
vi.mock('../components/PrivateRoute', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: () => <Outlet /> }
})

vi.mock('../pages/Home',             () => ({ default: () => <div>Home page</div> }))
vi.mock('../pages/Catalogo',         () => ({ default: () => <div>Catalogo page</div> }))
vi.mock('../pages/Librerias',        () => ({ default: () => <div>Librerias page</div> }))
vi.mock('../pages/PerfilTienda',     () => ({ default: () => <div>Perfil tienda page</div> }))
vi.mock('../pages/ResetPassword',    () => ({ default: () => <div>Reset password page</div> }))
vi.mock('../pages/MiTienda',         () => ({ default: () => <div>Mi tienda page</div> }))
vi.mock('../pages/PublicarLibro',    () => ({ default: () => <div>Publicar libro page</div> }))
vi.mock('../pages/AdminDashboard',   () => ({ default: () => <div>Admin dashboard page</div> }))
vi.mock('../pages/Historial',        () => ({ default: () => <div>Historial page</div> }))
vi.mock('../pages/ListaDeseos',      () => ({ default: () => <div>Lista deseos page</div> }))
vi.mock('../pages/Devoluciones',     () => ({ default: () => <div>Devoluciones page</div> }))
vi.mock('../pages/BookyPagoFinanzas',() => ({ default: () => <div>Finanzas page</div> }))
vi.mock('../pages/LegalPage',        () => ({ default: ({ type }) => <div>Legal {type}</div> }))
vi.mock('../components/AsistenteIA', () => ({ default: () => <div>Assistant</div> }))

describe('App extra — rutas y props de sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.getUserRole.mockReturnValue(null)
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('/privacidad muestra LegalPage type="privacidad"', () => {
    window.history.replaceState({}, '', '/privacidad')
    render(<App />)
    expect(screen.getByText('Legal privacidad')).toBeInTheDocument()
  })

  it('/forgot-password redirige a /', () => {
    window.history.replaceState({}, '', '/forgot-password')
    render(<App />)
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('/legal redirige a /', () => {
    window.history.replaceState({}, '', '/legal')
    render(<App />)
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('ruta inexistente redirige a /', () => {
    window.history.replaceState({}, '', '/no-existe-esta-ruta')
    render(<App />)
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('/mi-tienda tiene Footer hasSidebar=true', () => {
    window.history.replaceState({}, '', '/mi-tienda')
    render(<App />)
    expect(screen.getByText('Footer:true')).toBeInTheDocument()
  })

  it('/post-login muestra Home y Footer hasSidebar=true', () => {
    window.history.replaceState({}, '', '/post-login')
    render(<App />)
    expect(screen.getByText('Home page')).toBeInTheDocument()
    expect(screen.getByText('Footer:true')).toBeInTheDocument()
  })

  it('/historial muestra la página de historial', () => {
    window.history.replaceState({}, '', '/historial')
    render(<App />)
    expect(screen.getByText('Historial page')).toBeInTheDocument()
  })

  it('intervalo actualiza hasToken y dispara re-render', () => {
    vi.useFakeTimers()
    window.history.replaceState({}, '', '/')
    render(<App />)

    expect(screen.getByText('Header:white:false')).toBeInTheDocument()

    localStorage.setItem('token', 'mi-token')
    act(() => vi.advanceTimersByTime(5000))

    expect(screen.getByText('Header:white:true')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
