/**
 * PrivateRoute.extra.test.jsx — ramas no cubiertas del 5.1% faltante
 *
 * Cubre:
 * - document.documentElement classList.remove('dark') al invalidar token
 * - payload.role (en lugar de payload.rol) como campo de rol
 * - admin redirige a /post-login cuando la ruta es de vendedor
 * - token válido sin allowedRoles → no llama a jwtDecode (rama no decorada)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '../../components/PrivateRoute'

vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }))
import { jwtDecode } from 'jwt-decode'

const renderWithRoutes = (allowedRoles) =>
  render(
    <MemoryRouter initialEntries={['/protegida']}>
      <Routes>
        <Route element={<PrivateRoute allowedRoles={allowedRoles} />}>
          <Route path="/protegida" element={<div>Contenido protegido</div>} />
        </Route>
        <Route path="/"            element={<div>Inicio (público)</div>} />
        <Route path="/post-login"  element={<div>Post-login</div>} />
        <Route path="/mi-tienda"   element={<div>Mi Tienda</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('PrivateRoute — ramas extra', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })
  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('elimina la clase dark al invalidar el token', () => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('token', 'token.malformado')
    jwtDecode.mockImplementationOnce(() => { throw new Error('Invalid token') })

    renderWithRoutes(['comprador'])

    expect(screen.getByText(/inicio \(público\)/i)).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('lee payload.role cuando payload.rol no está definido', () => {
    localStorage.setItem('token', 'fake.token.role')
    jwtDecode.mockReturnValue({ role: 'comprador', sub: '99' })

    renderWithRoutes(['comprador'])
    expect(screen.getByText(/contenido protegido/i)).toBeInTheDocument()
  })

  it('redirige admin a /post-login cuando la ruta requiere solo vendedor', () => {
    localStorage.setItem('token', 'fake.token.admin')
    jwtDecode.mockReturnValue({ rol: 'admin', sub: '10' })

    renderWithRoutes(['vendedor'])
    expect(screen.getByText(/post-login/i)).toBeInTheDocument()
    expect(screen.queryByText(/contenido protegido/i)).toBeNull()
  })

  it('redirige vendedor a /mi-tienda cuando la ruta requiere admin; payload.role funciona', () => {
    localStorage.setItem('token', 'fake.token.vendedor2')
    // Primero llama para verificar si está incluido, luego para redirigir
    jwtDecode.mockReturnValue({ role: 'vendedor', sub: '11' })

    renderWithRoutes(['admin'])
    expect(screen.getByText(/mi tienda/i)).toBeInTheDocument()
  })
})
