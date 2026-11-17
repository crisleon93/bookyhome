import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CarruselPublico from '../../components/CarruselPublico'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('../../services/api', () => ({ default: { get: mocks.get } }))
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))

const libro = {
  id_libro: 12,
  titulo: 'Libro destacado',
  autor_libro: 'Autora de prueba',
  nombre_categoria: 'Ciencia',
  precio_libro: 32000,
  stock: 2,
  calificacion_tienda: 4.5,
  imagen_url: '/portada.jpg',
}

describe('CarruselPublico', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
    mocks.get.mockImplementation(async (_url, { params }) => ({
      data: { libros: [{ ...libro, ordenar_por: params.ordenar_por }] },
    }))
  })

  it('carga las cuatro secciones y deja abrir el detalle desde una tarjeta', async () => {
    const onVerDetalles = vi.fn()
    const { container } = render(<CarruselPublico onVerDetalles={onVerDetalles} />)

    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(4))
    expect(await screen.findAllByText('Libro destacado')).toHaveLength(8)
    expect(mocks.get).toHaveBeenCalledWith('/catalogo/busqueda-avanzada', {
      params: expect.objectContaining({ limite: 12, ordenar_por: 'recientes', pagina: 1 }),
    })

    fireEvent.click(container.querySelector('.bkh-pubcard[role="button"]'))
    expect(onVerDetalles).toHaveBeenCalledWith(expect.objectContaining({ id_libro: 12 }))
  })

  it('permite ir a cada listado desde el encabezado de sección', async () => {
    render(<CarruselPublico />)
    await screen.findAllByText('Libro destacado')

    fireEvent.click(screen.getAllByRole('button', { name: 'Ver todos →' })[2])
    expect(mocks.navigate).toHaveBeenCalledWith('/catalogo?ordenar_por=calificacion')
  })

  it('desplaza el carrusel en ambos sentidos y vuelve al inicio al cerrar el ciclo', async () => {
    const { container } = render(<CarruselPublico />)
    await screen.findAllByText('Libro destacado')

    const track = container.querySelector('.bkh-carrusel__inner')
    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 400 })
    track.firstElementChild.getBoundingClientRect = () => ({ width: 100 })

    fireEvent.click(screen.getAllByRole('button', { name: 'Anterior' })[0])
    expect(track.style.transform).toBe('translate3d(-86px, 0, 0)')
    fireEvent.click(screen.getAllByRole('button', { name: 'Siguiente' })[0])
    expect(track.style.transform).toBe('translate3d(0px, 0, 0)')
  })

  it('usa la ruta de búsqueda al abrir un libro sin callback y muestra fallback si la portada falla', async () => {
    const { container } = render(<CarruselPublico />)
    const image = await screen.findAllByAltText('Libro destacado').then(images => images[0])

    fireEvent.error(image)
    const fallbackImage = container.querySelector('.bkh-pubcard img')
    fireEvent.error(fallbackImage)
    expect(container.querySelector('.bkh-pubcard__img-fallback')).toBeTruthy()

    fireEvent.click(container.querySelector('.bkh-pubcard[role="button"]'))
    expect(mocks.navigate).toHaveBeenCalledWith('/catalogo?q=Libro%20destacado')
  })

  it('muestra la sección guardada en caché mientras vuelve a consultar el catálogo', async () => {
    const cachedSections = {
      recientes: { libros: [{ ...libro, titulo: 'Libro en caché' }], loading: false },
      populares: { libros: [], loading: false },
      calificados: { libros: [], loading: false },
      economicos: { libros: [], loading: false },
    }
    sessionStorage.setItem('bookyhome:portada-carruseles:v1', JSON.stringify({
      guardadoEn: Date.now(),
      secciones: cachedSections,
    }))

    render(<CarruselPublico />)

    expect(await screen.findAllByText('Libro en caché')).toHaveLength(2)
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(4))
  })
})
