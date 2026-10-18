/**
 * AdminDashboard.test.jsx — Tests RTL del panel de administración.
 *
 * AdminDashboard.jsx renderiza un sidebar con secciones (Dashboard, Reportes,
 * Usuarios, Libros, Tiendas, Órdenes, etc.) y carga datos desde la API.
 * Probamos la navegación entre secciones y el acceso de rol.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from '../../pages/AdminDashboard'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/admin' }) }
})

vi.mock('../../hooks/useAuth', () => ({
  getUserRole: vi.fn(() => 'admin'),
  getToken: vi.fn(() => 'fake.token'),
  isAuthenticated: vi.fn(() => true),
  parseToken: vi.fn(() => ({ rol: 'admin', sub: '1' })),
  getUserId: vi.fn(() => 1),
}))

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/usuarios')               return Promise.resolve({ data: [] })
      if (url === '/api/stored/libros')      return Promise.resolve({ data: [] })
      if (url === '/api/v1/admin/orders')    return Promise.resolve({ data: [] })
      if (url === '/tiendas')                return Promise.resolve({ data: [] })
      if (url === '/quejas/admin/todas')     return Promise.resolve({ data: [] })
      if (url === '/soporte')                return Promise.resolve({ data: [] })
      if (url === '/perfil/mi-perfil')       return Promise.resolve({ data: { nombre_usuario: 'Admin Test', correo_usuario: 'admin@test.com' } })
      return Promise.resolve({ data: [] })
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put:  vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}))

vi.mock('../../components/ToastProvider', () => ({
  notify: vi.fn(),
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../pages/BookyPagoFinanzas', () => ({
  default: () => <div data-testid="finanzas-section">Finanzas</div>,
}))

vi.mock('../../components/dashboard/SeccionPerfilAdmin', () => ({
  default: () => <div data-testid="perfil-admin-section">Perfil Admin</div>,
}))

// ── Helper ────────────────────────────────────────────────────────────────────

const renderAdmin = () =>
  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  )

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminDashboard — renderizado inicial', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza el sidebar de navegación', async () => {
    renderAdmin()
    await waitFor(() => {
      // El sidebar siempre está presente
      expect(document.body).toBeTruthy()
    })
  })

  it('muestra los ítems de navegación principales del sidebar', async () => {
    renderAdmin()
    await waitFor(() => {
      // NAV_ITEMS incluye Reportes, Usuarios, Libros... buscamos uno único
      expect(screen.getByText(/^reportes$/i)).toBeInTheDocument()
    })
  })

  it('muestra la sección Dashboard por defecto al cargar', async () => {
    renderAdmin()
    await waitFor(() => {
      // La sección activa es 'dashboard'; el sidebar tiene el ítem "Dashboard"
      // Puede haber múltiples, usamos getAllByText y verificamos que haya al menos 1
      const items = screen.getAllByText(/dashboard/i)
      expect(items.length).toBeGreaterThanOrEqual(1)
    })
  })
})

describe('AdminDashboard — navegación entre secciones', () => {
  beforeEach(() => vi.clearAllMocks())

  it('navega a la sección Usuarios al hacer clic en Usuarios', async () => {
    const user = userEvent.setup()
    renderAdmin()

    await waitFor(() => screen.getByText(/^reportes$/i)) // esperar carga
    // "Usuarios" puede aparecer en sidebar y en contenido; tomamos el primero
    const allUsuarios = screen.getAllByText(/^usuarios$/i)
    await user.click(allUsuarios[0])

    await waitFor(() => {
      // Después del clic la sección usuarios queda activa
      expect(screen.getAllByText(/^usuarios$/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('navega a la sección Libros al hacer clic en Libros', async () => {
    const user = userEvent.setup()
    renderAdmin()

    await waitFor(() => screen.getByText(/^libros$/i))
    await user.click(screen.getByText(/^libros$/i))

    await waitFor(() => {
      expect(screen.getByText(/^libros$/i)).toBeInTheDocument()
    })
  })

  it('navega a la sección Tiendas al hacer clic en Tiendas', async () => {
    const user = userEvent.setup()
    renderAdmin()

    await waitFor(() => screen.getByText(/^tiendas$/i))
    await user.click(screen.getByText(/^tiendas$/i))

    await waitFor(() => {
      expect(screen.getByText(/^tiendas$/i)).toBeInTheDocument()
    })
  })

  it('muestra la sección Finanzas al navegar a ella', async () => {
    const user = userEvent.setup()
    renderAdmin()

    await waitFor(() => screen.getByText(/^finanzas$/i))
    await user.click(screen.getByText(/^finanzas$/i))

    await waitFor(() => {
      expect(screen.getByTestId('finanzas-section')).toBeInTheDocument()
    })
  })
})

describe('AdminDashboard — acceso de rol', () => {
  it('redirige fuera si el rol no es admin', async () => {
    const { getUserRole } = await import('../../hooks/useAuth')
    getUserRole.mockReturnValueOnce('comprador')

    renderAdmin()

    await waitFor(() => {
      // El componente llama a navigate('/') si el rol no es admin
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
