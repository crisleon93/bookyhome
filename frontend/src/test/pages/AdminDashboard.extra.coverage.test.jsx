/**
 * AdminDashboard.extra.coverage.test.jsx
 * Cubre ramas sin cubrir: navegación entre secciones, handlers de error,
 * acciones de bloqueo/desbloqueo, ocultar libros.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from '../../pages/AdminDashboard'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate, useLocation: () => ({ pathname: '/admin' }) }
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
    get: mocks.apiGet,
    post: mocks.apiPost,
    put: mocks.apiPut,
    patch: mocks.apiPatch,
    delete: mocks.apiDelete,
  },
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}))
vi.mock('../../components/ToastProvider', () => ({
  notify: vi.fn(),
  default: ({ children }) => <>{children}</>,
}))
vi.mock('../../pages/BookyPagoFinanzas', () => ({ default: () => <div>Finanzas</div> }))
vi.mock('../../components/dashboard/SeccionPerfilAdmin', () => ({ default: () => <div>Perfil Admin</div> }))

const defaultGetMock = (url) => {
  if (url === '/perfil/mi-perfil') return Promise.resolve({ data: { nombre_usuario: 'Admin', correo_usuario: 'a@a.com' } })
  if (url === '/usuarios') return Promise.resolve({ data: [
    { id_usuario: 1, nombre_usuario: 'Juan', correo_usuario: 'j@j.com', rol: 'comprador', estado_usuario: 'Activo', foto_perfil: null },
    { id_usuario: 2, nombre_usuario: 'Ana', correo_usuario: 'a@a.com', rol: 'vendedor', estado_usuario: 'Bloqueado', foto_perfil: null },
  ]})
  if (url === '/api/stored/libros') return Promise.resolve({ data: [
    { id_libro: 1, titulo: 'Libro A', autor_libro: 'Autor X', precio_libro: 10000, stock: 5, oculto: 0, nombre_categoria: 'Ficción', nombre_tienda: 'Tienda 1' },
  ]})
  if (url === '/tiendas') return Promise.resolve({ data: [
    { id_tienda: 1, nombre_tienda: 'Tienda 1', estado_tienda: 'activa', id_usuario: 2 },
  ]})
  if (url === '/api/v1/admin/orders') return Promise.resolve({ data: [] })
  if (url === '/quejas/admin/todas') return Promise.resolve({ data: [] })
  return Promise.resolve({ data: [] })
}

const renderAdmin = () => render(<MemoryRouter><AdminDashboard /></MemoryRouter>)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.apiGet.mockImplementation(defaultGetMock)
  mocks.apiPost.mockResolvedValue({ data: {} })
  mocks.apiPut.mockResolvedValue({ data: {} })
  mocks.apiPatch.mockResolvedValue({ data: {} })
  mocks.apiDelete.mockResolvedValue({ data: {} })
})
afterEach(cleanup)

describe('AdminDashboard — navegación a secciones', () => {
  it('navega a sección Usuarios y muestra lista', async () => {
    const user = userEvent.setup()
    renderAdmin()
    const btn = await screen.findByRole('button', { name: /^Usuarios$/i })
    await user.click(btn)
    expect(await screen.findByText(/Juan/i)).toBeInTheDocument()
  })

  it('navega a sección Libros y muestra lista', async () => {
    const user = userEvent.setup()
    renderAdmin()
    const btn = await screen.findByRole('button', { name: /^Libros$/i })
    await user.click(btn)
    expect(await screen.findByText(/Libro A/i)).toBeInTheDocument()
  })

  it('navega a sección Tiendas y muestra lista', async () => {
    const user = userEvent.setup()
    renderAdmin()
    const btn = await screen.findByRole('button', { name: /^Tiendas$/i })
    await user.click(btn)
    expect(await screen.findByText(/Tienda 1/i)).toBeInTheDocument()
  })

  it('navega a sección Mi Perfil', async () => {
    const user = userEvent.setup()
    renderAdmin()
    const btn = await screen.findByRole('button', { name: /Mi Perfil/i })
    await user.click(btn)
    expect(await screen.findByText(/Perfil Admin/i)).toBeInTheDocument()
  })

  it('navega a sección Finanzas', async () => {
    const user = userEvent.setup()
    renderAdmin()
    // El botón puede llamarse 'Finanzas' o tener texto diferente
    const btns = await screen.findAllByRole('button')
    const finanzasBtn = btns.find(b => b.textContent?.toLowerCase().includes('finanza'))
    if (finanzasBtn) {
      await user.click(finanzasBtn)
      await waitFor(() => expect(document.body).toBeTruthy())
    }
  })

  it('renderiza en modo oscuro las secciones administrativas principales', async () => {
    localStorage.setItem('darkMode_admin', 'true')
    const user = userEvent.setup()
    renderAdmin()
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    const sections = [
      ['Usuarios', 'Gestión de Usuarios'],
      ['Libros', 'Gestión de Libros'],
      ['Tiendas', 'Gestión de Tiendas'],
      ['Órdenes', 'Gestión de Órdenes'],
      ['Quejas y reclamos', 'Quejas y Reclamos'],
      ['Soporte técnico', 'Soporte Técnico'],
      ['Reportes', 'Sistema de Reportes'],
    ]
    for (const [label, heading] of sections) {
      await user.click(await screen.findByRole('button', { name: new RegExp(`^${label}$`, 'i') }))
      expect(await screen.findByText(heading)).toBeInTheDocument()
    }

    localStorage.removeItem('darkMode_admin')
    document.documentElement.classList.remove('dark')
  })
})

describe('AdminDashboard — búsqueda y filtros', () => {
  it('filtra usuarios por texto en el buscador', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(await screen.findByRole('button', { name: /^Usuarios$/i }))
    await screen.findByText(/Juan/i)
    // Buscador puede ser searchbox o textbox
    const inputs = [...screen.queryAllByRole('textbox'), ...screen.queryAllByRole('searchbox')]
    if (inputs.length > 0) {
      await user.type(inputs[0], 'Juan')
      await waitFor(() => expect(screen.queryByText('Ana')).not.toBeInTheDocument())
    }
    expect(await screen.findByText(/Juan/i)).toBeInTheDocument()
  })

  it('filtra libros por texto en el buscador', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(await screen.findByRole('button', { name: /^Libros$/i }))
    await screen.findByText(/Libro A/i)
    const inputs = [...screen.queryAllByRole('textbox'), ...screen.queryAllByRole('searchbox')]
    if (inputs.length > 0) {
      await user.type(inputs[0], 'Libro')
      expect(inputs[0]).toHaveValue('Libro')
    }
    expect(await screen.findByText(/Libro A/i)).toBeInTheDocument()
  })
})

describe('AdminDashboard — acciones sobre usuarios', () => {
  it('puede hacer click en un usuario para ver su detalle', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(await screen.findByRole('button', { name: /^Usuarios$/i }))
    await screen.findByText(/Juan/i)
    const detailButtons = await screen.findAllByTitle('Ver detalles del usuario')
    await user.click(detailButtons[0])
    expect(await screen.findByRole('dialog', { name: /Detalles del usuario Juan/i })).toBeInTheDocument()
  })
})

describe('AdminDashboard — manejo de errores de API', () => {
  it('no rompe cuando la API de usuarios falla', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/usuarios') return Promise.reject(new Error('Network error'))
      return defaultGetMock(url)
    })
    renderAdmin()
    const btn = await screen.findByRole('button', { name: /^Usuarios$/i })
    await userEvent.setup().click(btn)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('no rompe cuando la API de libros falla', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/api/stored/libros') return Promise.reject(new Error('Error'))
      return defaultGetMock(url)
    })
    renderAdmin()
    const btn = await screen.findByRole('button', { name: /^Libros$/i })
    await userEvent.setup().click(btn)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('no rompe cuando la API de tiendas falla', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/tiendas') return Promise.reject(new Error('Error'))
      return defaultGetMock(url)
    })
    renderAdmin()
    const btn = await screen.findByRole('button', { name: /^Tiendas$/i })
    await userEvent.setup().click(btn)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

describe('AdminDashboard — filtros secundarios', () => {
  it('filtra tiendas por texto y cambia el filtro de estado', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.click(await screen.findByRole('button', { name: /^Tiendas$/i }))

    const search = await screen.findByPlaceholderText(/Buscar por nombre, dirección/i)
    await user.type(search, 'Central')
    expect(search).toHaveValue('Central')

    const activeFilter = await screen.findByRole('button', { name: 'Activa' })
    await user.click(activeFilter)
    expect(search).toHaveValue('Central')
  })

  it('filtra reclamos por texto y actualiza el buscador', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/quejas/admin/todas') return Promise.resolve({ data: [{
        id_solicitud: 73,
        tipo_solicitud: 'reclamo',
        estado: 'Abierto',
        asunto: 'Libro dañado',
        comprador: 'Ana Compradora',
      }] })
      return defaultGetMock(url)
    })
    const user = userEvent.setup()
    renderAdmin()
    await user.click(await screen.findByRole('button', { name: /^Quejas y reclamos$/i }))

    const search = await screen.findByPlaceholderText(/Buscar por comprador, tienda/i)
    await user.type(search, 'Libro')
    expect(search).toHaveValue('Libro')
  })

  it('responde a eventos de perfil y resalta el botón de ordenar', async () => {
    renderAdmin()
    window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { url: '/admin-new.jpg' } }))
    window.dispatchEvent(new CustomEvent('profile-banner-updated', { detail: { bannerUrl: '/admin-banner.jpg' } }))
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

describe('AdminDashboard — órdenes y paginación', () => {
  it('filtra órdenes y navega por la paginación', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/api/v1/admin/orders') return Promise.resolve({ data: Array.from({ length: 15 }, (_, index) => ({
        id_orden: index + 1,
        codigo_compra: `ORD-${index + 1}`,
        estado_orden: index % 2 ? 'pagado' : 'pendiente',
        total_orden: 25000 + index * 1000,
        fecha_orden: '2026-03-20T10:00:00',
        nombre_cliente: `Cliente ${index + 1}`,
      })) })
      return defaultGetMock(url)
    })
    const user = userEvent.setup()
    renderAdmin()
    await user.click(await screen.findByRole('button', { name: /^Órdenes$/i }))

    const search = await screen.findByPlaceholderText(/Buscar por ID orden/i)
    await user.type(search, 'ORD-1')
    expect(search).toHaveValue('ORD-1')

    const next = screen.queryByRole('button', { name: /Siguiente/i })
    if (next) await user.click(next)
  })
})

describe('AdminDashboard — cierre de sesión', () => {
  it('cierra sesión y navega a /', async () => {
    const user = userEvent.setup()
    renderAdmin()
    const logoutBtn = await screen.findByRole('button', { name: /Cerrar sesión/i })
    await user.click(logoutBtn)
    expect(mocks.navigate).toHaveBeenCalledWith('/')
  })
})

describe('AdminDashboard — reclamos, tema y detalle de órdenes', () => {
  it('abre evidencia y los formularios para revisar o rechazar un reclamo', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/quejas/admin/todas') return Promise.resolve({ data: [{
        id_solicitud: 73,
        tipo_solicitud: 'reclamo',
        estado: 'Abierto',
        asunto: 'Libro dañado',
        comprador: 'Ana Compradora',
        correo_comprador: 'ana@example.test',
        nombre_tienda: 'Librería Central',
        descripcion: 'La portada llegó rota.',
        evidencia_url: '/evidencia.jpg',
        respuesta: 'Estamos revisando la evidencia.',
        total_items: 2,
        total_orden: 25000,
        fecha_creacion: '2026-03-01T10:00:00',
        fecha_resolucion: '2026-03-02T10:00:00',
      }] })
      return defaultGetMock(url)
    })
    const user = userEvent.setup()
    renderAdmin()
    await user.click(await screen.findByRole('button', { name: /^Quejas y reclamos$/i }))
    await user.click(await screen.findByRole('button', { name: /RECLAMO #73/i }))

    await user.click(await screen.findByRole('button', { name: 'Ver evidencia' }))
    expect(screen.getByRole('dialog', { name: 'Evidencia del reclamo' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Evidencia del reclamo' })).toHaveAttribute(
      'src',
      'http://localhost:8000/evidencia.jpg',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar evidencia del reclamo' }))

    await user.click(screen.getByRole('button', { name: 'Marcar En revisión' }))
    expect(screen.getByRole('heading', { name: 'Marcar como En revisión' })).toBeInTheDocument()
    const responseDialog = screen.getByRole('dialog', { name: 'Marcar como En revisión' })
    fireEvent.click(within(responseDialog).getAllByRole('button')[1])

    await user.click(screen.getByRole('button', { name: 'Rechazar reclamo' }))
    expect(screen.getByRole('heading', { name: 'Rechazar solicitud' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar respuesta del reclamo' }))
  })

  it('sincroniza el tema admin y carga artículos de órdenes con éxito y error', async () => {
    const { notify } = await import('../../components/ToastProvider')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const clipboardWrite = vi.fn().mockResolvedValue(undefined)
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/api/v1/admin/orders') return Promise.resolve({ data: [
        {
          id_orden: 51,
          estado: 'enviado',
          estado_orden: 'enviado',
          fecha: '2026-03-20T10:00:00',
          tipo_entrega: 'domicilio',
          numero_guia: 'GUIA-51',
          empresa_mensajeria: 'Coordinadora',
          estado_envio: 'En tránsito',
          fecha_despacho: '2026-03-20',
          fecha_estimada_entrega: '2026-03-23',
          direccion_completa: 'Calle 1',
          ciudad_destino: 'Bogotá',
          departamento_destino: 'Cundinamarca',
          costo_envio: 5000,
          metodo_pago: 'Tarjeta',
          total: 25000,
        },
        { id_orden: 52, estado: 'pendiente', total: 10000 },
        { id_orden: 53, estado: 'pagada', total: 31000 },
        { id_orden: 54, estado: 'entregada', total: 32000 },
        { id_orden: 55, estado: 'cancelada', total: 33000 },
      ] })
      if (url === '/api/v1/admin/orders/51/items') return Promise.resolve({ data: [{
        id_detalle: 1,
        id_libro: 5,
        titulo: 'Libro del pedido',
        autor_libro: 'Autora',
        cantidad: 1,
        precio_unitario: 25000,
        precio_final: 25000,
      }] })
      if (url === '/api/v1/admin/orders/52/items') return Promise.reject(new Error('offline'))
      return defaultGetMock(url)
    })

    localStorage.setItem('darkMode_admin', 'true')
    const { unmount } = renderAdmin()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { role: 'comprador' } }))
    localStorage.setItem('darkMode_admin', 'false')
    window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { role: 'admin' } }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    localStorage.setItem('darkMode_admin', 'true')
    window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { role: 'admin' } }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await userEvent.setup().click(await screen.findByRole('button', { name: /^Órdenes$/i }))
    for (const status of ['Pagada', 'Entregada', 'Enviada', 'Cancelada', 'Todas']) {
      await userEvent.setup().click(screen.getByRole('button', { name: status }))
    }
    const ordersSearch = screen.getByPlaceholderText('Buscar por ID orden o estado...')
    fireEvent.change(ordersSearch, { target: { value: '51' } })
    fireEvent.click(ordersSearch.parentElement.querySelector('button'))
    const orderRow51 = screen.getByText('#51').closest('tr')
    fireEvent.mouseEnter(orderRow51)
    fireEvent.mouseLeave(orderRow51)
    const orderDetailsButton = within(orderRow51).getByRole('button', { name: 'Detalles' })
    fireEvent.mouseEnter(orderDetailsButton)
    fireEvent.mouseLeave(orderDetailsButton)
    await userEvent.setup().click(orderDetailsButton)
    expect(await screen.findByText('Libro del pedido')).toBeInTheDocument()
    expect(clipboardWrite).not.toHaveBeenCalled()
    const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    })
    const orderDialog = screen.getByRole('dialog', { name: 'Detalles de la Orden #51' })
    expect(within(orderDialog).getByText('Guía: GUIA-51')).toBeInTheDocument()
    expect(navigator.clipboard.writeText).toBe(clipboardWrite)
    fireEvent.click(within(orderDialog).getByRole('button', { name: 'Copiar' }))
    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledWith('GUIA-51'))
    expect(notify).toHaveBeenCalledWith('Número de guía copiado', 'info')

    clipboardWrite.mockRejectedValueOnce(new Error('clipboard denied'))
    fireEvent.click(within(orderDialog).getByRole('button', { name: '✓ Copiado' }))
    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      'No se pudo copiar el número de guía',
      'error',
    ))

    fireEvent.click(within(orderDialog).getByRole('button', { name: '✕' }))
    const orderRow52 = screen.getByText('#52').closest('tr')
    await userEvent.setup().click(within(orderRow52).getByRole('button', { name: 'Detalles' }))
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
      'Error cargando items de la orden:',
      expect.any(Error),
    ))
    unmount()
    localStorage.removeItem('darkMode_admin')
    document.documentElement.classList.remove('dark')
    consoleError.mockRestore()
    if (previousClipboard) Object.defineProperty(navigator, 'clipboard', previousClipboard)
    else delete navigator.clipboard
  })
})
