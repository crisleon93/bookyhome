import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import FiltrosCatalogo from '../../components/FiltrosCatalogo'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../services/api', () => ({ default: { get: mocks.get } }))

const filterOptions = {
  categorias: [{ id_categoria: 4, nombre_categoria: 'Historia', cantidad_libros: 12 }],
  precio_min: 1000,
  precio_max: 200000,
  opciones_ordenamiento: [
    { value: 'relevancia', label: 'Relevancia' },
    { value: 'precio_asc', label: 'Precio: menor a mayor' },
  ],
}

describe('FiltrosCatalogo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.get.mockResolvedValue({ data: filterOptions })
  })

  it('carga opciones y emite los filtros elegidos, incluyendo el reinicio', async () => {
    const onFiltrosChange = vi.fn()
    const { container } = render(<FiltrosCatalogo onFiltrosChange={onFiltrosChange} />)

    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/catalogo/filtros-disponibles'))
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))

    fireEvent.change(screen.getByPlaceholderText('Título, autor...'), {
      target: { value: 'Cien años' },
    })
    expect(onFiltrosChange).toHaveBeenLastCalledWith(expect.objectContaining({ busqueda: 'Cien años' }))

    const selects = container.querySelectorAll('select')
    fireEvent.change(selects[0], { target: { value: '4' } })
    expect(onFiltrosChange).toHaveBeenLastCalledWith(expect.objectContaining({ categoria_id: 4 }))

    fireEvent.change(container.querySelector('input[type="number"]'), { target: { value: '30000' } })
    fireEvent.click(screen.getByTitle('4+ estrellas'))
    fireEvent.click(screen.getByRole('checkbox', { name: /Solo libros en stock/ }))
    fireEvent.change(selects[1], { target: { value: 'precio_asc' } })
    expect(onFiltrosChange).toHaveBeenLastCalledWith(expect.objectContaining({
      calificacion_min: 4,
      disponible: false,
      ordenar_por: 'precio_asc',
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(onFiltrosChange).toHaveBeenLastCalledWith({
      busqueda: '',
      categoria_id: null,
      precio_min: 0,
      precio_max: 200000,
      calificacion_min: 0,
      disponible: true,
      ordenar_por: 'relevancia',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(container.querySelector('.filtros-panel')).not.toBeInTheDocument()
  })

  it('mantiene disponible la interfaz si falla la carga de opciones', async () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.get.mockRejectedValueOnce(new Error('offline'))
    render(<FiltrosCatalogo onFiltrosChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    expect(await screen.findByPlaceholderText('Título, autor...')).toBeInTheDocument()
    expect(logError).toHaveBeenCalledWith('Error cargando filtros:', expect.any(Error))
  })
})
