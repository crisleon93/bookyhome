import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Historial from '../../pages/Historial'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getToken: vi.fn(),
  obtener: vi.fn(),
  obtenerEstadisticas: vi.fn(),
  eliminar: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate }
})

vi.mock('../../hooks/useAuth', () => ({ getToken: mocks.getToken }))
vi.mock('../../services/historial', () => ({
  historialService: {
    obtener: mocks.obtener,
    obtenerEstadisticas: mocks.obtenerEstadisticas,
    eliminar: mocks.eliminar,
  },
}))

const interactions = [
  {
    id_interaccion: 1,
    id_libro: 5,
    tipo: 'visualizacion',
    nombre_libro: 'La casa de los espíritus',
    nombre_tienda: 'Librería Central',
    descripcion: 'Libro revisado',
    fecha_interaccion: '2026-11-14T12:00:00Z',
  },
  { id_interaccion: 2, tipo: 'compra', fecha_interaccion: '2026-11-13T12:00:00Z' },
  { id_interaccion: 3, tipo: 'resena', fecha_interaccion: '2026-11-12T12:00:00Z' },
  { id_interaccion: 4, tipo: 'mensaje', fecha_interaccion: '2026-11-11T12:00:00Z' },
  { id_interaccion: 5, tipo: 'favorito', fecha_interaccion: '2026-11-10T12:00:00Z' },
  { id_interaccion: 6, tipo: 'carrito', fecha_interaccion: '2026-11-09T12:00:00Z' },
  { id_interaccion: 7, tipo: 'tipo_nuevo', fecha_interaccion: '2026-11-08T12:00:00Z' },
]

const statistics = {
  total: 7,
  por_tipo: [
    { tipo: 'visualizacion', total: 2 },
    { tipo: 'compra', total: 1 },
    { tipo: 'resena', total: 1 },
    { tipo: 'mensaje', total: 1 },
    { tipo: 'favorito', total: 1 },
  ],
}

describe('Historial web', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getToken.mockReturnValue('session-token')
    mocks.obtener.mockResolvedValue({ historial: interactions })
    mocks.obtenerEstadisticas.mockResolvedValue(statistics)
    mocks.eliminar.mockResolvedValue({})
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('redirige al login cuando falta la sesión y no solicita datos', () => {
    mocks.getToken.mockReturnValue(null)
    render(<Historial />)

    expect(mocks.navigate).toHaveBeenCalledWith('/login')
    expect(mocks.obtener).not.toHaveBeenCalled()
    expect(mocks.obtenerEstadisticas).not.toHaveBeenCalled()
  })

  it('carga interacciones, estadísticas, iconos y navega al libro', async () => {
    render(<Historial />)

    expect(await screen.findByText('La casa de los espíritus')).toBeTruthy()
    expect(screen.getByText('Total Interacciones')).toBeTruthy()
    expect(screen.getAllByText('Visto')).toHaveLength(2)
    expect(screen.getByText('En carrito')).toBeTruthy()
    expect(screen.getByText('tipo_nuevo')).toBeTruthy()
    expect(mocks.obtener).toHaveBeenCalledWith(null, 100, 0)

    fireEvent.click(screen.getByText('La casa de los espíritus').closest('.hist-item'))
    expect(mocks.navigate).toHaveBeenCalledWith('/catalogo')
  })

  it('actualiza el filtro y elimina una interacción con confirmación', async () => {
    render(<Historial />)
    await screen.findByText('La casa de los espíritus')

    fireEvent.click(screen.getByRole('button', { name: 'Compras' }))
    await waitFor(() => expect(mocks.obtener).toHaveBeenLastCalledWith('compra', 100, 0))

    fireEvent.click(screen.getByText('La casa de los espíritus').closest('.hist-item').querySelector('.btn-eliminar'))
    await waitFor(() => expect(mocks.eliminar).toHaveBeenCalledWith(1))
    expect(confirm).toHaveBeenCalledWith('¿Eliminar del historial?')
  })

  it('mantiene la lista y muestra el estado vacío cuando no hay interacciones', async () => {
    mocks.obtener.mockResolvedValue({ historial: [] })
    render(<Historial />)

    expect(await screen.findByText('No hay interacciones registradas')).toBeTruthy()
  })

  it('presenta un error legible si falla la carga del historial', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.obtener.mockRejectedValue(new Error('offline'))
    render(<Historial />)

    expect(await screen.findByText('Error cargando historial')).toBeTruthy()
    consoleError.mockRestore()
  })
})
