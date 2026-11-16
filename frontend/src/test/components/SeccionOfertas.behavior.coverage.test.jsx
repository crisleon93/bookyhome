import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  it('muestra las ofertas activas y conserva el diálogo si la eliminación falla', async () => {
    const oferta = {
      id_oferta: 19,
      nombre_oferta: 'Lecturas de temporada',
      estado: 'activa',
      tipo_descuento: 'porcentaje',
      valor_descuento: 15,
      fecha_inicio: '2026-01-01T10:00:00',
      fecha_fin: '2026-12-31T23:59:00',
      libros: books,
    }
    api.get.mockImplementation((path) => Promise.resolve({
      data: path === '/ofertas' ? [oferta] : books,
    }))
    api.delete.mockRejectedValueOnce({ response: { data: { detail: 'La oferta está en uso' } } })
    render(<SeccionOfertas />)

    expect(await screen.findByText('Lecturas de temporada')).toBeTruthy()
    expect(screen.getByText('1 activa ahora · 1 en total')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Eliminar/ }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    expect(await screen.findByText('La oferta está en uso')).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Lecturas de temporada')).toBeTruthy()
  })

  it('agrupa estados de promoción, maneja error al editar y confirma una eliminación', async () => {
    const offers = [
      { id_oferta: 21, nombre_oferta: 'Activa', estado: 'activa', tipo_descuento: 'porcentaje', valor_descuento: 10, libros: books },
      { id_oferta: 22, nombre_oferta: 'Próxima', estado: 'proxima', tipo_descuento: 'porcentaje', valor_descuento: 15, libros: books },
      { id_oferta: 23, nombre_oferta: 'Vencida', estado: 'vencida', tipo_descuento: 'fijo', valor_descuento: 5000, libros: books },
    ]
    api.get.mockImplementation((path) => {
      if (path === '/ofertas/21') return Promise.reject(new Error('offline'))
      return Promise.resolve({ data: path === '/ofertas' ? offers : books })
    })
    api.delete.mockResolvedValueOnce({ data: { ok: true } })
    render(<SeccionOfertas />)

    expect(await screen.findByText('Activa')).toBeTruthy()
    expect(screen.getByText('Próxima')).toBeTruthy()
    expect(screen.getByText('Vencida')).toBeTruthy()
    expect(screen.getAllByText('Próximas')).toHaveLength(2)
    expect(screen.getAllByText('Vencidas')).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Error al cargar la oferta para edición', 'error')
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/ofertas/21'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('valida descuentos y libros, y muestra los mensajes de validación del servidor', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { detail: [{ msg: 'El descuento supera el máximo' }, { msg: 'Revise las fechas' }] } },
    })
    render(<SeccionOfertas />)
    fireEvent.click(await screen.findByRole('button', { name: '+ Crear primera oferta' }))
    fireEvent.change(screen.getByLabelText('Nombre de la oferta *'), {
      target: { value: 'Fin de semana lector' },
    })
    fireEvent.change(screen.getByLabelText('Porcentaje de descuento (%) *'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Fecha y hora de inicio *' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Mañana' }))
    fireEvent.mouseDown(document.body)
    fireEvent.click(screen.getByText('Seleccionar fin...').closest('button'))
    fireEvent.click(screen.getByRole('button', { name: '+7d' }))
    fireEvent.click(screen.getByRole('button', { name: /Crear oferta/ }))
    expect(await screen.findByText('El valor del descuento debe ser mayor a 0')).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Porcentaje de descuento (%) *'), {
      target: { value: '20' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Crear oferta/ }))
    expect(await screen.findByText('Selecciona al menos un libro para la oferta')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Desplegar libros ▼' }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Crear oferta/ }))
    expect(await screen.findByText('El descuento supera el máximo, Revise las fechas')).toBeTruthy()
    expect(api.post).toHaveBeenCalledOnce()
  })

  it('permite escoger día, hora y formato AM/PM en el calendario', async () => {
    render(<SeccionOfertas />)
    fireEvent.click(await screen.findByRole('button', { name: '+ Crear primera oferta' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Fecha y hora de inicio *' })[0])

    const calendar = screen.getByRole('dialog', { name: 'Seleccionar fecha y hora' })
    fireEvent.click(within(calendar).getByRole('button', { name: '⟩' }))
    const futureDay = within(calendar).getByRole('button', { name: /^1 de / })
    fireEvent.click(futureDay)
    const [hour, minute] = within(calendar).getAllByRole('combobox')
    fireEvent.change(hour, { target: { value: '09' } })
    fireEvent.change(minute, { target: { value: '30' } })
    fireEvent.click(within(calendar).getByRole('button', { name: 'AM' }))
    expect(screen.getAllByRole('button', { name: 'Fecha y hora de inicio *' })[0].textContent)
      .toMatch(/09:30/)
    fireEvent.click(within(calendar).getByRole('button', { name: 'Aceptar ✓' }))
    expect(screen.queryByRole('dialog', { name: 'Seleccionar fecha y hora' })).toBeNull()
  })
})
