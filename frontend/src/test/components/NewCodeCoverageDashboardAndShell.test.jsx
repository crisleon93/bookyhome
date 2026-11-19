import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import SeccionCarrito from '../../components/dashboard/SeccionCarrito'
import Header from '../../components/Header'
import FiltrosCatalogo from '../../components/FiltrosCatalogo'
import Home from '../../pages/Home'
import api, {
  getCarrito,
  getDirecciones,
  getOrdenes,
} from '../../services/api'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  notificaciones: vi.fn(),
  salas: vi.fn(),
  removeFromCart: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  login: mocks.login,
  getOrdenes: vi.fn(),
  getCarrito: vi.fn(),
  getDirecciones: vi.fn(),
  removeFromCart: mocks.removeFromCart,
  checkoutCarrito: vi.fn(),
  checkoutDirecto: vi.fn(),
  getOrden: vi.fn(),
  getDatosTransferenciaVendedor: vi.fn(),
  postPayment: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  cancelOrder: vi.fn(),
  aplicarCupon: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  reservarRetiroEnTienda: vi.fn(),
  notificarLlegadaTienda: vi.fn(),
  actualizarCostoEnvio: vi.fn(),
  getApiErrorMessage: vi.fn((error, fallback) => error?.message || fallback),
  normalizarMetodoPagoApi: vi.fn((method) => method),
}))

vi.mock('../../services/notificaciones', () => ({
  notificacionesService: { obtener: mocks.notificaciones },
}))

vi.mock('../../services/chat', () => ({
  chatService: { getSalas: mocks.salas },
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({ rol: 'comprador', sub: '7', nombre: 'Lectora' })),
}))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function renderInRouter(ui, initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      {ui}
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('dashboard and shell coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.get.mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: {} })
    getCarrito.mockResolvedValue({ data: [] })
    getOrdenes.mockResolvedValue({ data: [] })
    getDirecciones.mockResolvedValue({ data: [] })
    mocks.notificaciones.mockResolvedValue({ no_leidas: 0 })
    mocks.salas.mockResolvedValue({ salas: [] })
    mocks.removeFromCart.mockResolvedValue({})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('lets a reader leave an empty cart for the catalog', async () => {
    renderInRouter(<SeccionCarrito userId={7} />)

    expect(await screen.findByText('Tu carrito está vacío')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ir al catálogo/i }))

    expect(screen.getByTestId('location')).toHaveTextContent('/?seccion=Catálogo')
  })

  it('opens and closes the mobile navigation and responds to the login event', async () => {
    renderInRouter(<Header />)

    const menuButton = screen.getByRole('button', { name: 'Abrir menú' })
    fireEvent.click(menuButton)
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false')

    fireEvent(window, new CustomEvent('bookyhome:open-login'))
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('keeps an invalid price range and stock changes consistent in catalog filters', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        categorias: [{ id_categoria: 3, nombre_categoria: 'Historia', cantidad_libros: 5 }],
        precio_min: 0,
        precio_max: 90000,
        opciones_ordenamiento: [{ value: 'relevancia', label: 'Relevancia' }],
      },
    })
    const onFiltrosChange = vi.fn()
    render(<FiltrosCatalogo onFiltrosChange={onFiltrosChange} />)
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/catalogo/filtros-disponibles'))
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    const [minimum, maximum] = screen.getAllByRole('spinbutton')
    fireEvent.change(minimum, { target: { value: '80000' } })
    fireEvent.change(maximum, { target: { value: '70000' } })
    expect(minimum).toHaveValue(80000)
    expect(maximum).toHaveValue(90000)

    fireEvent.click(screen.getByRole('checkbox', { name: /solo libros en stock/i }))
    expect(onFiltrosChange).toHaveBeenLastCalledWith(expect.objectContaining({
      precio_min: 80000,
      precio_max: 90000,
      disponible: false,
    }))
  })

  it('lets visitors browse the public home carousel and dismiss the join dialog', async () => {
    renderInRouter(<Home />)

    const heroImage = screen.getByRole('img', { name: /libros/i })
    const firstAlt = heroImage.getAttribute('alt')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente imagen' }))
    expect(screen.getByRole('img', { name: /libros/i }).getAttribute('alt')).not.toBe(firstAlt)

    fireEvent.click(screen.getByRole('button', { name: 'Comenzar a comprar' }))
    expect(screen.getByRole('heading', { name: '¡Bienvenido a BookyHome!' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: '¡Bienvenido a BookyHome!' })).not.toBeInTheDocument())
  })
})
