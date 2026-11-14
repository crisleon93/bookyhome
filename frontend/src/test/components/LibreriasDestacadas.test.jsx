import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LibreriasDestacadas from '../../components/LibreriasDestacadas'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate }
})

vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet },
}))

const store = {
  id_tienda: 8,
  nombre_tienda: 'Lecturas del Centro',
  ciudad_origen: 'Bogota',
  direccion: 'Calle 4, Bogotá',
  descripcion: 'Novedades para lectores',
  logo_url: '/logo.png',
  total_libros: '3',
  calificacion: '4.8',
  total_opiniones: '2',
  id_usuario: '5',
}

describe('LibreriasDestacadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.requestAnimationFrame = vi.fn(() => 1)
    window.cancelAnimationFrame = vi.fn()
    mocks.apiGet.mockResolvedValue({ data: [store] })
  })

  it('carga y guarda tiendas sanitizadas, y navega a una tienda o al listado', async () => {
    render(<LibreriasDestacadas />)
    const cards = await screen.findAllByRole('button', { name: /Lecturas del Centro/i })

    expect(cards).toHaveLength(2)
    expect(sessionStorage.getItem('bookyhome:librerias-destacadas:v1')).toContain('"id_tienda":8')

    fireEvent.click(screen.getByRole('button', { name: 'Ver todas →' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/librerias')

    fireEvent.click(cards[0])
    expect(mocks.navigate).toHaveBeenCalledWith('/tienda/8')
  })

  it('usa la caché en la carga inicial y cae a iniciales si falla el logo', async () => {
    sessionStorage.setItem('bookyhome:librerias-destacadas:v1', JSON.stringify({
      guardadoEn: Date.now(),
      tiendas: [store],
    }))
    render(<LibreriasDestacadas />)

    const image = await screen.findAllByRole('img', { name: 'Lecturas del Centro' })
    fireEvent.error(image[0])
    expect(screen.getAllByText('LD')).toHaveLength(1)
    expect(mocks.apiGet).toHaveBeenCalledWith('/tiendas/destacadas')
  })

  it('no renderiza la sección cuando la carga termina sin tiendas', async () => {
    mocks.apiGet.mockRejectedValueOnce(new Error('offline'))
    const { container } = render(<LibreriasDestacadas />)
    await waitFor(() => expect(container.querySelector('section')).toBeNull())
  })
})
