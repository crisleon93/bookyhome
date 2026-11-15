import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SeccionOfertas from '../../components/SeccionOfertas'
import api from '../../services/api'
import { notify } from '../../components/ToastProvider'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
}))

vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconBookOpen: Icon,
    IconCalendar: Icon,
    IconCheck: Icon,
    IconLock: Icon,
    IconPlus: Icon,
    IconTag: Icon,
    IconTrash: Icon,
    IconEdit: Icon,
  }
})

const books = [{
  id_libro: 5,
  titulo: 'Libro de prueba',
  autor_libro: 'Autora',
  precio_libro: 25000,
  stock: 3,
}]

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  api.get.mockImplementation((path) => Promise.resolve({
    data: path === '/ofertas' ? [] : books,
  }))
  api.post.mockResolvedValue({ data: { ok: true } })
})

afterEach(cleanup)

describe('SeccionOfertas', () => {
  it('valida campos requeridos al iniciar una oferta', async () => {
    render(<SeccionOfertas />)
    fireEvent.click(await screen.findByRole('button', { name: '+ Crear primera oferta' }))

    fireEvent.click(screen.getByRole('button', { name: /Crear oferta/ }))
    expect(await screen.findByText('El nombre es obligatorio')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Nombre de la oferta *'), {
      target: { value: 'Oferta de prueba' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Crear oferta/ }))
    expect(await screen.findByText('La fecha de inicio es obligatoria')).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('crea una oferta con fechas válidas y libros seleccionados', async () => {
    render(<SeccionOfertas />)
    fireEvent.click(await screen.findByRole('button', { name: '+ Crear primera oferta' }))
    fireEvent.change(screen.getByLabelText('Nombre de la oferta *'), {
      target: { value: 'Oferta de prueba' },
    })
    fireEvent.change(screen.getByLabelText('Porcentaje de descuento (%) *'), {
      target: { value: '20' },
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Fecha y hora de inicio *' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Mañana' }))
    fireEvent.mouseDown(document.body)
    fireEvent.click(screen.getByText('Seleccionar fin...').closest('button'))
    fireEvent.click(screen.getByRole('button', { name: '+7d' }))

    fireEvent.click(screen.getByRole('button', { name: 'Desplegar libros ▼' }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Crear oferta/ }))

    await waitFor(() => expect(api.post).toHaveBeenCalledOnce())
    const [url, formData, options] = api.post.mock.calls[0]
    expect(url).toBe('/ofertas')
    expect(formData.get('nombre_oferta')).toBe('Oferta de prueba')
    expect(formData.get('valor_descuento')).toBe('20')
    expect(formData.get('ids_libros')).toBe('5')
    expect(options.headers['Content-Type']).toBe('multipart/form-data')
    expect(notify).not.toHaveBeenCalled()
  })
})
