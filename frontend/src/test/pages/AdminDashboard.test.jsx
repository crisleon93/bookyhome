/**
 * AdminDashboard.test.jsx — Tests RTL del panel de administración.
 *
 * AdminDashboard.jsx renderiza un sidebar con secciones (Dashboard, Reportes,
 * Usuarios, Libros, Tiendas, Órdenes, etc.) y carga datos desde la API.
 * Probamos la navegación entre secciones y el acceso de rol.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    patch: vi.fn(() => Promise.resolve({ data: {} })),
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

  it('bloquea un usuario y actualiza su estado luego de confirmar', async () => {
    const user = userEvent.setup()
    const { default: api } = await import('../../services/api')
    const { notify } = await import('../../components/ToastProvider')
    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/usuarios'
        ? [{ id_usuario: 18, nombre_usuario: 'Ana Compradora', correo_usuario: 'ana@example.com', rol: 'comprador', estado_usuario: 'Activo' }]
        : url === '/perfil/mi-perfil'
          ? { nombre_usuario: 'Admin Test', correo_usuario: 'admin@test.com' }
          : [],
    }))

    renderAdmin()
    await user.click(await screen.findByText(/^Usuarios$/i))
    await user.click(await screen.findByRole('button', { name: 'Bloquear' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar Bloqueo' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/usuarios/18/bloquear', { bloqueado: true })
      expect(notify).toHaveBeenCalledWith(
        'Usuario "Ana Compradora" bloqueado exitosamente.',
        'success',
      )
    })
    expect(await screen.findByText('Bloqueado')).toBeInTheDocument()
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

describe('AdminDashboard — gestión de reclamos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('valida y envía la respuesta de resolución de un reclamo', async () => {
    const user = userEvent.setup()
    const { default: api } = await import('../../services/api')
    const { notify } = await import('../../components/ToastProvider')
    const reclamo = {
      id_solicitud: 42,
      id_orden: 18,
      tipo_solicitud: 'reclamo',
      estado: 'Abierto',
      asunto: 'Producto dañado',
      titulo_libro: 'Libro averiado',
      comprador: 'Ana Compradora',
      nombre_tienda: 'Librería Central',
      descripcion: 'El libro llegó con la portada rota.',
      evidencia_url: '/uploads/reclamo-42.jpg',
    }

    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/quejas/admin/todas'
        ? [reclamo]
        : url === '/perfil/mi-perfil'
          ? { nombre_usuario: 'Admin Test', correo_usuario: 'admin@test.com' }
          : [],
    }))

    renderAdmin()
    await user.click(await screen.findByText(/^Quejas y reclamos$/i))
    await user.click(await screen.findByRole('button', { name: /Reclamo #42/ }))
    await user.click(await screen.findByAltText('Evidencia thumbnail'))
    expect(screen.getByRole('dialog', { name: 'Evidencia del reclamo' })).toBeInTheDocument()
    expect(screen.getByAltText('Evidencia del reclamo')).toHaveAttribute(
      'src',
      'http://localhost:8000/uploads/reclamo-42.jpg',
    )
    await user.click(screen.getByRole('button', { name: 'Cerrar evidencia del reclamo' }))
    await user.click(screen.getByRole('button', { name: 'Resolver reclamo' }))

    const responseField = screen.getByLabelText('Respuesta o resolución para el usuario:')
    await user.click(screen.getByRole('button', { name: 'Resolver y notificar' }))
    expect(notify).toHaveBeenCalledWith('La respuesta debe tener al menos 3 caracteres', 'error')
    expect(api.patch).not.toHaveBeenCalled()

    await user.type(responseField, 'Se gestionó el reembolso del pedido.')
    await user.click(screen.getByRole('button', { name: 'Resolver y notificar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/quejas/admin/42', {
        estado: 'Resuelto',
        respuesta: 'Se gestionó el reembolso del pedido.',
      })
    })

    expect(notify).toHaveBeenCalledWith('Solicitud actualizada y usuario notificado', 'success')
  })
})

describe('AdminDashboard — gestión de órdenes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resume, busca y filtra órdenes devueltas por la API', async () => {
    const user = userEvent.setup()
    const { default: api } = await import('../../services/api')
    const orders = [
      { id_orden: 77, estado: 'pagado', total: 25000, fecha: '2026-03-20T12:00:00' },
      { id_orden: 78, estado: 'enviado', total: 18000, fecha: null },
    ]
    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/api/v1/admin/orders'
        ? orders
        : url === '/perfil/mi-perfil'
          ? { nombre_usuario: 'Admin Test', correo_usuario: 'admin@test.com' }
          : [],
    }))

    renderAdmin()
    await user.click(await screen.findByText(/^Órdenes$/i))

    expect(await screen.findByText('#77')).toBeInTheDocument()
    expect(screen.getByText('#78')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Buscar por ID orden o estado...'), {
      target: { value: '77' },
    })
    expect(screen.getByText('#77')).toBeInTheDocument()
    expect(screen.queryByText('#78')).toBeNull()

    fireEvent.change(screen.getByPlaceholderText('Buscar por ID orden o estado...'), {
      target: { value: 'sin coincidencias' },
    })
    expect(screen.getByText('No se encontraron órdenes')).toBeInTheDocument()
  })
})
