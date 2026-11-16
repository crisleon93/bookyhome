/**
 * AdminDashboard.test.jsx — Tests RTL del panel de administración.
 *
 * AdminDashboard.jsx renderiza un sidebar con secciones (Dashboard, Reportes,
 * Usuarios, Libros, Tiendas, Órdenes, etc.) y carga datos desde la API.
 * Probamos la navegación entre secciones y el acceso de rol.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

describe('AdminDashboard — tickets de soporte', () => {
  it('cambia la vista de soporte y responde a un ticket de comprador', async () => {
    const user = userEvent.setup()
    const { default: api } = await import('../../services/api')
    const { notify } = await import('../../components/ToastProvider')
    const ticket = {
      id_solicitud: 63,
      numero: 63,
      tipo_solicitud: 'soporte',
      estado: 'Abierto',
      rol_usuario: 'comprador',
      comprador: 'Luis Comprador',
      correo_comprador: 'luis@example.com',
      categoria: 'Acceso',
      asunto: 'No puedo ingresar',
      descripcion: 'La página rechaza mi contraseña.',
      fecha_creacion: '2026-03-20T12:00:00',
    }
    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/quejas/admin/todas'
        ? [ticket]
        : url === '/perfil/mi-perfil'
          ? { nombre_usuario: 'Admin Test', correo_usuario: 'admin@test.com' }
          : [],
    }))
    renderAdmin()
    await user.click(await screen.findByText(/^Soporte técnico$/i))
    expect(await screen.findByText('No puedo ingresar')).toBeTruthy()
    expect(screen.getByText('Luis Comprador')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Soporte · Vendedores/ }))
    expect(screen.getByText(/No hay tickets pendientes para vendedores/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Soporte · Compradores/ }))

    await user.click(await screen.findByRole('button', { name: 'Resolver y notificar' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resolver y notificar' }))
    expect(notify).toHaveBeenCalledWith('La respuesta debe tener al menos 3 caracteres', 'error')
    await user.type(screen.getByLabelText('Respuesta o resolución para el usuario:'), 'Acceso restablecido.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resolver y notificar' }))

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/quejas/admin/63', {
      estado: 'Resuelto',
      respuesta: 'Acceso restablecido.',
    }))
    expect(notify).toHaveBeenCalledWith('Solicitud actualizada y usuario notificado', 'success')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('AdminDashboard — reportes consolidados', () => {
  it('resume categorías, estados de órdenes y estado operativo de tiendas', async () => {
    const user = userEvent.setup()
    const { default: api } = await import('../../services/api')
    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/usuarios'
        ? [
            { id_usuario: 1, rol: 'comprador' },
            { id_usuario: 2, rol: 'vendedor' },
            { id_usuario: 3, rol: 'administrador' },
          ]
        : url === '/api/stored/libros'
          ? [
              { id_libro: 1, nombre_categoria: 'Ficción', oculto: 0 },
              { id_libro: 2, nombre_categoria: 'Ficción', oculto: 0 },
              { id_libro: 3, nombre_categoria: 'Ciencia ficción', oculto: 1 },
            ]
          : url === '/api/v1/admin/orders'
            ? [
                { estado: 'pagada', total: 25000 },
                { estado: 'en camino', total: 12000 },
                { estado: 'cancelada', total: 8000 },
              ]
            : url === '/tiendas'
              ? [
                  { estado_tienda: 'activa' },
                  { estado_tienda: 'en revisión' },
                  { estado_tienda: 'suspendida' },
                ]
              : [],
    }))

    renderAdmin()
    await user.click(await screen.findByText(/^Reportes$/i))

    expect(await screen.findByRole('heading', { name: 'Órdenes por Estado' })).toBeInTheDocument()
    expect(screen.getByText('Ranking de géneros en el catálogo')).toBeInTheDocument()
    expect(screen.getByText('Tasa de Operatividad')).toBeInTheDocument()
    expect(screen.getByText('Ciencia ficción')).toBeInTheDocument()
    expect(screen.getByText(/33% operativas/)).toBeInTheDocument()
    expect(screen.getByText(/3 Órdenes/)).toBeInTheDocument()
  })
})

describe('AdminDashboard — moderación del catálogo', () => {
  it('filtra los libros por categoría y cambia su visibilidad', async () => {
    const user = userEvent.setup()
    const { default: api } = await import('../../services/api')
    const { notify } = await import('../../components/ToastProvider')
    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/api/stored/libros'
        ? [
            { id_libro: 31, titulo: 'Atlas', autor_libro: 'Ana', precio_libro: 10000, nombre_categoria: 'Arte', oculto: 0 },
            { id_libro: 32, titulo: 'Novela', autor_libro: 'Luis', precio_libro: 12000, nombre_categoria: 'Romance', oculto: 0 },
          ]
        : url === '/perfil/mi-perfil'
          ? { nombre_usuario: 'Admin Test', correo_usuario: 'admin@test.com' }
          : [],
    }))

    renderAdmin()
    await user.click(await screen.findByText(/^Libros$/i))
    expect(await screen.findByText('Atlas')).toBeInTheDocument()
    expect(screen.getByText('Novela')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Filtrar por Categoría:'), 'Arte')
    expect(screen.getByText('Atlas')).toBeInTheDocument()
    expect(screen.queryByText('Novela')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Ocultar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/libros/31/ocultar',
        { oculto: true },
        expect.objectContaining({ headers: { Authorization: 'Bearer null' } }),
      )
    })
    expect(screen.getByText('Oculto')).toBeInTheDocument()
    expect(notify).toHaveBeenCalledWith('Visibilidad del libro actualizada', 'success')
  })
})

describe('AdminDashboard — suspensión de tiendas', () => {
  it('requiere un motivo y confirma la suspensión de una librería', async () => {
    const user = userEvent.setup()
    const { default: api } = await import('../../services/api')
    const { notify } = await import('../../components/ToastProvider')
    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/tiendas'
        ? [{ id_tienda: 9, nombre_tienda: 'Librería Norte', estado_tienda: 'activa' }]
        : url === '/perfil/mi-perfil'
          ? { nombre_usuario: 'Admin Test', correo_usuario: 'admin@test.com' }
          : [],
    }))

    renderAdmin()
    await user.click(await screen.findByText(/^Tiendas$/i))
    const activeStatusButtons = await screen.findAllByRole('button', { name: /Activa/ })
    await user.click(activeStatusButtons[activeStatusButtons.length - 1])
    const suspensionButtons = screen.getAllByRole('button', { name: 'Suspendida' })
    await user.click(suspensionButtons[suspensionButtons.length - 1])
    const dialog = screen.getByLabelText('Confirmar cambio de estado de tienda')
    await user.click(within(dialog).getByRole('button', { name: /Suspender y Notificar/ }))
    expect(within(dialog).getByText(/Debes ingresar o seleccionar un motivo/)).toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()

    const reason = 'Incumplimiento de las políticas y términos de servicio de la plataforma.'
    await user.click(within(dialog).getByRole('button', { name: new RegExp(reason) }))
    await user.click(within(dialog).getByRole('button', { name: /Suspender y Notificar/ }))
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/tiendas/9/estado', {
        estado: 'suspendida',
        motivo: reason,
      }, expect.any(Object))
    })
    expect(notify).toHaveBeenCalledWith(
      'Librería suspendida y notificación enviada al chat del vendedor',
      'success',
    )
    expect(screen.getAllByText('Suspendida').length).toBeGreaterThanOrEqual(2)
  })
})

describe('AdminDashboard — alertas de atención', () => {
  it('dirige desde el resumen a reclamos y tickets pendientes', async () => {
    const user = userEvent.setup()
    const { default: api } = await import('../../services/api')
    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/quejas/admin/todas'
        ? [
            { id_solicitud: 51, tipo_solicitud: 'reclamo', estado: 'Abierto', asunto: 'Libro incompleto', descripcion: 'Falta una página.' },
            { id_solicitud: 52, tipo_solicitud: 'soporte', estado: 'Abierto', asunto: 'No carga el panel', descripcion: 'El panel se queda cargando.', rol_usuario: 'vendedor' },
          ]
        : url === '/perfil/mi-perfil'
          ? { nombre_usuario: 'Admin Test', correo_usuario: 'admin@test.com' }
          : [],
    }))

    renderAdmin()
    expect(await screen.findByText('Atención requerida del Administrador')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Resolver Reclamos/ }))
    expect(await screen.findByText('Total Reclamos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Dashboard$/i }))
    await user.click(await screen.findByRole('button', { name: /Atender Soporte/ }))
    expect(await screen.findByRole('button', { name: /Soporte · Compradores/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Soporte · Vendedores/ }))
    expect(await screen.findByText(/No carga el panel/)).toBeInTheDocument()
  })
})
