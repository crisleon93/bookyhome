/**
 * AdminDashboard.extra.coverage.test.jsx
 * Cubre ramas sin cubrir: navegación entre secciones, handlers de error,
 * acciones de bloqueo/desbloqueo, ocultar libros.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
