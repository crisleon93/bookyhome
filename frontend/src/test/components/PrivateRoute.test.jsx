/**
 * PrivateRoute.test.jsx — Tests RTL del componente de rutas protegidas.
 *
 * PrivateRoute controla el acceso basado en token JWT y roles.
 * Probamos: sin token → redirige a /, token inválido → redirige a /,
 * rol no permitido → redirige por tipo de rol, rol permitido → muestra contenido.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '../../components/PrivateRoute'

// ── Mock jwt-decode ───────────────────────────────────────────────────────────

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}))

import { jwtDecode } from 'jwt-decode'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renderiza PrivateRoute dentro de un MemoryRouter con rutas de destino
 * para capturar las redirecciones.
 */
const renderWithRoutes = (allowedRoles) =>
  render(
    <MemoryRouter initialEntries={['/protegida']}>
      <Routes>
        <Route element={<PrivateRoute allowedRoles={allowedRoles} />}>
          <Route path="/protegida" element={<div>Contenido protegido</div>} />
        </Route>
        <Route path="/"           element={<div>Inicio (público)</div>} />
        <Route path="/post-login" element={<div>Post-login</div>} />
        <Route path="/mi-tienda"  element={<div>Mi Tienda</div>} />
      </Routes>
    </MemoryRouter>
  )

// ── Tests: sin token ──────────────────────────────────────────────────────────

describe('PrivateRoute — sin token', () => {
  beforeEach(() => localStorage.clear())
  afterEach(()  => localStorage.clear())

  it('redirige a / cuando no hay token en localStorage', () => {
    renderWithRoutes(['comprador'])
    expect(screen.getByText(/inicio \(público\)/i)).toBeInTheDocument()
    expect(screen.queryByText(/contenido protegido/i)).toBeNull()
  })

  it('redirige a / incluso sin allowedRoles definidos', () => {
    renderWithRoutes(undefined)
    expect(screen.getByText(/inicio \(público\)/i)).toBeInTheDocument()
  })
})

// ── Tests: token inválido ─────────────────────────────────────────────────────

describe('PrivateRoute — token inválido o expirado', () => {
  beforeEach(() => localStorage.clear())
  afterEach(()  => localStorage.clear())

  it('redirige a / y elimina el token cuando jwtDecode lanza error', () => {
    localStorage.setItem('token', 'token.malformado')
    jwtDecode.mockImplementationOnce(() => { throw new Error('Invalid token') })

    renderWithRoutes(['comprador'])
    expect(screen.getByText(/inicio \(público\)/i)).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })
})

// ── Tests: rol no permitido ───────────────────────────────────────────────────

describe('PrivateRoute — rol no permitido', () => {
  beforeEach(() => localStorage.clear())
  afterEach(()  => localStorage.clear())

  it('redirige a /mi-tienda cuando el usuario es vendedor pero la ruta es solo comprador', () => {
    localStorage.setItem('token', 'fake.token.vendedor')
    jwtDecode.mockReturnValue({ rol: 'vendedor', sub: '1' })

    renderWithRoutes(['comprador'])
    expect(screen.getByText(/mi tienda/i)).toBeInTheDocument()
    expect(screen.queryByText(/contenido protegido/i)).toBeNull()
  })

  it('redirige a /post-login cuando el usuario es comprador pero la ruta es solo admin', () => {
    localStorage.setItem('token', 'fake.token.comprador')
    jwtDecode.mockReturnValue({ rol: 'comprador', sub: '2' })

    renderWithRoutes(['admin'])
    expect(screen.getByText(/post-login/i)).toBeInTheDocument()
    expect(screen.queryByText(/contenido protegido/i)).toBeNull()
  })

  it('redirige a /post-login cuando el usuario es comprador pero la ruta es solo vendedor', () => {
    localStorage.setItem('token', 'fake.token.comprador')
    jwtDecode.mockReturnValue({ rol: 'comprador', sub: '3' })

    renderWithRoutes(['vendedor'])
    expect(screen.getByText(/post-login/i)).toBeInTheDocument()
  })
})

// ── Tests: acceso permitido ───────────────────────────────────────────────────

describe('PrivateRoute — acceso permitido', () => {
  beforeEach(() => localStorage.clear())
  afterEach(()  => localStorage.clear())

  it('muestra el contenido protegido cuando el rol está en allowedRoles', () => {
    localStorage.setItem('token', 'fake.token.comprador')
    jwtDecode.mockReturnValue({ rol: 'comprador', sub: '4' })

    renderWithRoutes(['comprador'])
    expect(screen.getByText(/contenido protegido/i)).toBeInTheDocument()
  })

  it('permite acceso con rol "vendedor" en ruta de vendedores', () => {
    localStorage.setItem('token', 'fake.token.vendedor')
    jwtDecode.mockReturnValue({ rol: 'vendedor', sub: '5' })

    renderWithRoutes(['vendedor'])
    expect(screen.getByText(/contenido protegido/i)).toBeInTheDocument()
  })

  it('permite acceso con rol "admin" en ruta de admins', () => {
    localStorage.setItem('token', 'fake.token.admin')
    jwtDecode.mockReturnValue({ rol: 'admin', sub: '6' })

    renderWithRoutes(['admin'])
    expect(screen.getByText(/contenido protegido/i)).toBeInTheDocument()
  })

  it('permite acceso cuando el rol está entre múltiples roles permitidos', () => {
    localStorage.setItem('token', 'fake.token.vendedor')
    jwtDecode.mockReturnValue({ rol: 'vendedor', sub: '7' })

    renderWithRoutes(['comprador', 'vendedor', 'admin'])
    expect(screen.getByText(/contenido protegido/i)).toBeInTheDocument()
  })

  it('muestra contenido cuando no se pasan allowedRoles y hay token válido', () => {
    localStorage.setItem('token', 'fake.token.cualquiera')
    // Sin allowedRoles no llama a jwtDecode, no necesita mock

    renderWithRoutes(undefined)
    expect(screen.getByText(/contenido protegido/i)).toBeInTheDocument()
  })
})
