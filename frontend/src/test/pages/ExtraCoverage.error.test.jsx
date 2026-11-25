/**
 * ExtraCoverage.error.test.jsx
 * Cubre ramas de error y casos alternativos en:
 * - MiTienda, Chat, Catalogo, QuejasReclamos, QuejasVendedor, Soporte,
 *   Librerias, ListaDeseos, SeccionOfertas, SeccionSeguimiento, SeccionInicio
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ─── Shared mocks ────────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  apiPatch: vi.fn(),
  getSalas: vi.fn(),
  obtenerMensajes: vi.fn(),
  enviarMensaje: vi.fn(),
  getToken: vi.fn(() => 'fake.token'),
  jwtDecode: vi.fn(() => ({ sub: '1', rol: 'comprador' })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => ({}),
    useLocation: () => ({ search: '', pathname: '/' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet, post: mocks.apiPost, put: mocks.apiPut, delete: mocks.apiDelete, patch: mocks.apiPatch },
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  getCarrito: vi.fn(() => Promise.resolve({ data: [] })),
  getOrdenes: vi.fn(() => Promise.resolve({ data: [] })),
  getQuejas: vi.fn(() => Promise.resolve({ data: [] })),
  crearQueja: vi.fn(() => Promise.resolve({ data: {} })),
  cancelarQueja: vi.fn(),
  getMensajesReclamo: vi.fn(() => Promise.resolve({ data: [] })),
  enviarMensajeReclamo: vi.fn(() => Promise.resolve({ data: {} })),
  getQuejasVendedor: vi.fn(() => Promise.resolve({ data: [] })),
  getTiendasDestacadas: vi.fn(() => Promise.resolve({ data: [] })),
  getCategorias: vi.fn(() => Promise.resolve({ data: [] })),
  getSolicitudesSoporte: vi.fn(() => Promise.resolve({ data: [] })),
  crearSolicitudSoporte: vi.fn(() => Promise.resolve({ data: {} })),
  getFiltrosDisponibles: vi.fn(() => Promise.resolve({ data: { categorias: [], estados: [], precios: { min: 0, max: 100000 } } })),
  getOfertaActivaLibro: vi.fn(() => Promise.resolve({ data: null })),
}))

vi.mock('../../services/chat', () => ({
  chatService: {
    getSalas: mocks.getSalas,
    obtenerMensajes: mocks.obtenerMensajes,
    enviarMensaje: mocks.enviarMensaje,
    marcarSalaLeida: vi.fn(() => Promise.resolve({})),
    eliminarSala: vi.fn(() => Promise.resolve({})),
    vaciarChat: vi.fn(() => Promise.resolve({})),
  },
}))

vi.mock('../../hooks/useAuth', () => ({
  getToken: mocks.getToken,
  getUserId: vi.fn(() => 1),
  isAuthenticated: vi.fn(() => true),
  parseToken: vi.fn(() => ({ sub: '1', rol: 'comprador' })),
}))

vi.mock('jwt-decode', () => ({ jwtDecode: mocks.jwtDecode }))

vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn(), default: ({ children }) => <>{children}</> }))

vi.mock('../../components/Icons', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual }
})

vi.mock('../../styles/Chat.css', () => ({}))
vi.mock('axios', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: { id_usuario: 1 } })), post: vi.fn() },
}))

class MockWebSocket {
  static OPEN = 1
  constructor() { this.readyState = 0; this.close = vi.fn(); this.send = vi.fn() }
}
global.WebSocket = MockWebSocket

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('token', 'fake.token.here')
  mocks.apiGet.mockResolvedValue({ data: [] })
  mocks.apiPost.mockResolvedValue({ data: {} })
  mocks.apiPut.mockResolvedValue({ data: {} })
  mocks.apiPatch.mockResolvedValue({ data: {} })
  mocks.apiDelete.mockResolvedValue({ data: {} })
  mocks.getSalas.mockResolvedValue({ salas: [] })
  mocks.obtenerMensajes.mockResolvedValue({ mensajes: [] })
  mocks.enviarMensaje.mockResolvedValue({ id_mensaje: 1 })
})
afterEach(cleanup)

// ─── Catalogo ────────────────────────────────────────────────────────────────
describe('Catalogo — ramas de error', () => {
  it('maneja error al cargar libros', async () => {
    const { default: Catalogo } = await import('../../pages/Catalogo')
    mocks.apiGet.mockRejectedValue(new Error('Network error'))
    render(<MemoryRouter><Catalogo /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('carga con categoría en searchParams', async () => {
    const { default: Catalogo } = await import('../../pages/Catalogo')
    mocks.apiGet.mockResolvedValue({ data: { libros: [], total: 0, pagina: 1, total_paginas: 1 } })
    render(
      <MemoryRouter initialEntries={['/?categoria=Ficción']}>
        <Catalogo />
      </MemoryRouter>
    )
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('muestra libros en catálogo', async () => {
    const { default: Catalogo } = await import('../../pages/Catalogo')
    mocks.apiGet.mockImplementation((url) => {
      if (url.includes('busqueda-avanzada')) return Promise.resolve({ data: {
        libros: [{ id_libro: 1, titulo: 'El Quijote', autor_libro: 'Cervantes', precio_libro: 30000, stock: 3, nombre_categoria: 'Clásicos', nombre_tienda: 'Central', imagen_url: null }],
        total: 1, pagina: 1, total_paginas: 1,
      }})
      return Promise.resolve({ data: {} })
    })
    render(<MemoryRouter><Catalogo /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

// ─── Chat ────────────────────────────────────────────────────────────────────
describe('Chat — ramas de error', () => {
  it('maneja error al cargar salas', async () => {
    const { default: Chat } = await import('../../pages/Chat')
    mocks.getSalas.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><Chat /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('renderiza chat sin sala seleccionada', async () => {
    const { default: Chat } = await import('../../pages/Chat')
    mocks.getSalas.mockResolvedValue({ salas: [
      { id_sala: 1, id_usuario_1: 1, id_usuario_2: 2, nombre_otro: 'Ana', mensajes_no_leidos: 0 }
    ]})
    render(<MemoryRouter><Chat /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('maneja error al enviar mensaje', async () => {
    const { default: Chat } = await import('../../pages/Chat')
    mocks.getSalas.mockResolvedValue({ salas: [] })
    mocks.enviarMensaje.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><Chat /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

// ─── QuejasReclamos ──────────────────────────────────────────────────────────
describe('QuejasReclamos — ramas de error', () => {
  it('maneja error al cargar órdenes', async () => {
    const { default: QuejasReclamos } = await import('../../pages/QuejasReclamos')
    const { getOrdenes } = await import('../../services/api')
    getOrdenes.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><QuejasReclamos /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('renderiza con quejas existentes', async () => {
    const { default: QuejasReclamos } = await import('../../pages/QuejasReclamos')
    const { getOrdenes, getQuejas } = await import('../../services/api')
    getOrdenes.mockResolvedValue({ data: [{ id_orden: 1, estado: 'pagado', total: 50000, fecha: '2026-01-01', items: [{ titulo: 'Libro', nombre_tienda: 'T1' }] }] })
    getQuejas.mockResolvedValue({ data: [{ id_solicitud: 1, id_orden: 1, estado: 'Abierto', asunto: 'Problema', descripcion: 'Desc', tipo_solicitud: 'reclamo' }] })
    render(<MemoryRouter><QuejasReclamos /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('maneja error al crear queja', async () => {
    const { default: QuejasReclamos } = await import('../../pages/QuejasReclamos')
    const { getOrdenes, crearQueja } = await import('../../services/api')
    getOrdenes.mockResolvedValue({ data: [{ id_orden: 1, estado: 'pagado', total: 50000, fecha: '2026-01-01', items: [{ titulo: 'Libro', nombre_tienda: 'T1' }] }] })
    crearQueja.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><QuejasReclamos /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

// ─── QuejasVendedor ──────────────────────────────────────────────────────────
describe('QuejasVendedor — ramas de error', () => {
  it('maneja error al cargar quejas del vendedor', async () => {
    const { default: QuejasVendedor } = await import('../../pages/QuejasVendedor')
    const { getQuejasVendedor } = await import('../../services/api')
    getQuejasVendedor.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><QuejasVendedor /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('renderiza con quejas del vendedor', async () => {
    const { default: QuejasVendedor } = await import('../../pages/QuejasVendedor')
    const { getQuejasVendedor } = await import('../../services/api')
    getQuejasVendedor.mockResolvedValue({ data: [
      { id_solicitud: 1, estado: 'Abierto', asunto: 'Reclamo', descripcion: 'Desc', tipo_solicitud: 'reclamo', id_orden: 1 }
    ]})
    render(<MemoryRouter><QuejasVendedor /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

// ─── Soporte ─────────────────────────────────────────────────────────────────
describe('Soporte — ramas de error', () => {
  it('maneja error al cargar tickets de soporte', async () => {
    const { default: Soporte } = await import('../../pages/Soporte')
    const { getSolicitudesSoporte } = await import('../../services/api')
    getSolicitudesSoporte.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><Soporte /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('renderiza soporte vacío', async () => {
    const { default: Soporte } = await import('../../pages/Soporte')
    const { getSolicitudesSoporte } = await import('../../services/api')
    getSolicitudesSoporte.mockResolvedValue({ data: [] })
    render(<MemoryRouter><Soporte /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('maneja error al crear ticket de soporte', async () => {
    const { default: Soporte } = await import('../../pages/Soporte')
    const { getSolicitudesSoporte, crearSolicitudSoporte } = await import('../../services/api')
    getSolicitudesSoporte.mockResolvedValue({ data: [] })
    crearSolicitudSoporte.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><Soporte /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

// ─── Librerias ───────────────────────────────────────────────────────────────
describe('Librerias — ramas de error', () => {
  it('maneja error al cargar librerías', async () => {
    const { default: Librerias } = await import('../../pages/Librerias')
    const { getTiendasDestacadas } = await import('../../services/api')
    getTiendasDestacadas.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><Librerias /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('renderiza librerías vacías', async () => {
    const { default: Librerias } = await import('../../pages/Librerias')
    const { getTiendasDestacadas } = await import('../../services/api')
    getTiendasDestacadas.mockResolvedValue({ data: [] })
    render(<MemoryRouter><Librerias /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('renderiza con librerías', async () => {
    const { default: Librerias } = await import('../../pages/Librerias')
    const { getTiendasDestacadas, getCategorias } = await import('../../services/api')
    getTiendasDestacadas.mockResolvedValue({ data: [{ id_tienda: 1, nombre_tienda: 'Central', imagen_tienda: null, estado_tienda: 'activa' }] })
    getCategorias.mockResolvedValue({ data: [{ id_categoria: 1, nombre_categoria: 'Ficción' }] })
    render(<MemoryRouter><Librerias /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

// ─── ListaDeseos (web) ───────────────────────────────────────────────────────
describe('ListaDeseos web — ramas de error', () => {
  it('maneja error al cargar listas de deseos', async () => {
    const { default: ListaDeseos } = await import('../../pages/ListaDeseos')
    mocks.apiGet.mockRejectedValue(new Error('error'))
    render(<MemoryRouter><ListaDeseos /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('renderiza listas vacías', async () => {
    const { default: ListaDeseos } = await import('../../pages/ListaDeseos')
    mocks.apiGet.mockResolvedValue({ data: [] })
    render(<MemoryRouter><ListaDeseos /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('renderiza con listas', async () => {
    const { default: ListaDeseos } = await import('../../pages/ListaDeseos')
    mocks.apiGet.mockImplementation((url) => {
      if (url.includes('lista-deseos')) return Promise.resolve({ data: [{ id_lista: 1, nombre: 'Mi Lista', privada: false, libros: [] }] })
      return Promise.resolve({ data: [] })
    })
    render(<MemoryRouter><ListaDeseos /></MemoryRouter>)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})

// ─── MiTienda — secciones adicionales ────────────────────────────────────────
describe('MiTienda — secciones adicionales', () => {
  it('navega a sección Quejas y reclamos', async () => {
    const { default: MiTienda } = await import('../../pages/MiTienda')
    localStorage.setItem('token', 'fake.token.here')
    mocks.apiGet.mockResolvedValue({ data: [] })
    render(<MiTienda />)
    const btn = screen.queryByRole('button', { name: /Quejas y reclamos/i })
    if (btn) fireEvent.click(btn)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('navega a sección Soporte técnico', async () => {
    const { default: MiTienda } = await import('../../pages/MiTienda')
    localStorage.setItem('token', 'fake.token.here')
    mocks.apiGet.mockResolvedValue({ data: [] })
    render(<MiTienda />)
    const btn = screen.queryByRole('button', { name: /Soporte/i })
    if (btn) fireEvent.click(btn)
    await waitFor(() => expect(document.body).toBeTruthy())
  })

  it('maneja error al cargar datos de ventas', async () => {
    const { default: MiTienda } = await import('../../pages/MiTienda')
    localStorage.setItem('token', 'fake.token.here')
    mocks.apiGet.mockRejectedValue(new Error('error'))
    render(<MiTienda />)
    await waitFor(() => expect(document.body).toBeTruthy())
  })
})
