import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import QuejasReclamos from '../../pages/QuejasReclamos'
import QuejasVendedor from '../../pages/QuejasVendedor'

const mocks = vi.hoisted(() => ({
  getApiBaseUrl: vi.fn(),
  getOrdenes: vi.fn(),
  getQuejas: vi.fn(),
  crearQueja: vi.fn(),
  cancelarQueja: vi.fn(),
  getMensajesReclamo: vi.fn(),
  enviarMensajeReclamo: vi.fn(),
  getQuejasVendedor: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getApiBaseUrl: mocks.getApiBaseUrl,
  getOrdenes: mocks.getOrdenes,
  getQuejas: mocks.getQuejas,
  crearQueja: mocks.crearQueja,
  cancelarQueja: mocks.cancelarQueja,
  getMensajesReclamo: mocks.getMensajesReclamo,
  enviarMensajeReclamo: mocks.enviarMensajeReclamo,
  getQuejasVendedor: mocks.getQuejasVendedor,
}))

vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconBook: Icon,
    IconCheck: Icon,
    IconEye: Icon,
    IconInfo: Icon,
    IconMessage: Icon,
    IconPackage: Icon,
    IconSearch: Icon,
    IconRefresh: Icon,
    IconStore: Icon,
    IconStoreAlt: Icon,
    IconTruck: Icon,
  }
})

const order = {
  id_orden: 21,
  estado: 'pagado',
  total: 85000,
  fecha: '2026-03-20T12:00:00',
  items: [{ titulo: 'Libro comprado', nombre_tienda: 'Librería Norte' }],
}

const buyerComplaints = [
  {
    id_solicitud: 101,
    id_orden: 21,
    estado: 'Abierto',
    asunto: 'Libro dañado o defectuoso',
    titulo_libro: 'Libro comprado',
    descripcion: 'La portada llegó doblada.',
    fecha_solicitud: '2026-03-20T12:00:00',
    nombre_tienda: 'Librería Norte',
  },
  {
    id_solicitud: 102,
    id_orden: 22,
    estado: 'Resuelto',
    asunto: 'Producto incorrecto',
    titulo_libro: 'Otro libro',
    descripcion: 'Recibí otro título.',
    fecha_solicitud: '2026-03-19T12:00:00',
  },
]

const sellerComplaints = [
  {
    id_solicitud: 201,
    id_orden: 81,
    estado: 'Abierto',
    asunto: 'Libro dañado o defectuoso',
    titulo_libro: 'Libro maltratado',
    descripcion: 'El comprador reporta daños.',
    comprador: 'Ana Compradora',
    fecha_creacion: '2026-03-20T12:00:00',
  },
  {
    id_solicitud: 202,
    id_orden: 82,
    estado: 'Resuelto',
    asunto: 'Demora excesiva en la entrega',
    titulo_libro: 'Lecturas pendientes',
    descripcion: 'El envío llegó tarde.',
    comprador: 'Luis Lector',
    fecha_creacion: '2026-03-19T12:00:00',
  },
]

describe('QuejasReclamos web', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.getApiBaseUrl.mockReturnValue('https://api.example.test')
    mocks.getOrdenes.mockResolvedValue({ data: [order] })
    mocks.getQuejas.mockResolvedValue({ data: [] })
    mocks.crearQueja.mockResolvedValue({ data: {} })
    mocks.getMensajesReclamo.mockResolvedValue({ data: [] })
    mocks.enviarMensajeReclamo.mockResolvedValue({ data: {} })
    mocks.cancelarQueja.mockResolvedValue({ data: {} })
  })

  it('valida la selección y crea una solicitud con motivo personalizado', async () => {
    const updatedComplaints = [buyerComplaints[0]]
    mocks.getQuejas
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: updatedComplaints })
    render(<QuejasReclamos />)

    const orderSelect = await screen.findByDisplayValue('Selecciona una compra...')
    const form = orderSelect.closest('form')
    fireEvent.submit(form)
    expect(await screen.findByText('Selecciona una compra y un motivo.')).toBeTruthy()
    expect(mocks.crearQueja).not.toHaveBeenCalled()

    fireEvent.change(orderSelect, { target: { value: '21' } })
    fireEvent.click(screen.getByRole('button', { name: 'Otro' }))
    fireEvent.change(screen.getByPlaceholderText('Especifica el motivo...'), {
      target: { value: 'Empaque incompleto' },
    })
    fireEvent.change(screen.getByPlaceholderText('Describe el problema...'), {
      target: { value: 'Faltó un libro en la caja.' },
    })
    fireEvent.submit(form)

    await waitFor(() => expect(mocks.crearQueja).toHaveBeenCalledTimes(1))
    const data = mocks.crearQueja.mock.calls[0][0]
    expect(data.get('id_orden')).toBe('21')
    expect(data.get('motivo')).toBe('Empaque incompleto')
    expect(data.get('descripcion')).toBe('Faltó un libro en la caja.')
    expect(await screen.findByText('Solicitud enviada. El administrador revisara tu caso.')).toBeTruthy()
    expect(await screen.findByText('Libro comprado')).toBeTruthy()
  })

  it('filtra el historial, abre el chat y permite enviar un mensaje', async () => {
    mocks.getOrdenes.mockResolvedValue({ data: [] })
    mocks.getQuejas.mockResolvedValue({ data: buyerComplaints })
    mocks.getMensajesReclamo.mockResolvedValue({
      data: [{ id_mensaje: 1, rol: 'vendedor', mensaje: 'Estamos revisando tu caso.' }],
    })
    render(<QuejasReclamos />)
    fireEvent.click(await screen.findByRole('button', { name: 'Mis quejas y reclamos' }))
    expect(screen.getByText('Libro comprado')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^Resuelto\s*\(1\)$/ }))
    expect(screen.getByText('Otro libro')).toBeTruthy()
    expect(screen.queryByText('Libro comprado')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Todos\s*\(2\)$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chat' }))
    expect(await screen.findByText('Estamos revisando tu caso.')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Escribe...'), {
      target: { value: 'Gracias por la ayuda' },
    })
    fireEvent.click(screen.getByText('→'))
    await waitFor(() => expect(mocks.enviarMensajeReclamo).toHaveBeenCalledWith(101, 'Gracias por la ayuda'))
  })
})

describe('QuejasVendedor web', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    HTMLElement.prototype.scrollIntoView = vi.fn()
    mocks.getApiBaseUrl.mockReturnValue('https://api.example.test')
    mocks.getQuejasVendedor.mockResolvedValue({ data: sellerComplaints })
    mocks.getMensajesReclamo.mockResolvedValue({
      data: [{ id_mensaje: 3, rol: 'comprador', nombre_usuario: 'Ana Compradora', mensaje: 'Necesito ayuda con mi pedido.' }],
    })
    mocks.enviarMensajeReclamo.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('busca y filtra reclamos, contesta al comprador y limpia el polling al desmontar', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    const { unmount } = render(<QuejasVendedor />)

    expect(await screen.findByText('Libro maltratado')).toBeTruthy()
    expect(await screen.findByText('Necesito ayuda con mi pedido.')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar por comprador, orden...'), {
      target: { value: 'Luis' },
    })
    expect(screen.getByText('Luis Lector')).toBeTruthy()
    fireEvent.click(screen.getByText('Luis Lector'))
    expect(screen.getByText('Lecturas pendientes')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar por comprador, orden...'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Resueltos/ }))
    expect(screen.getByText('Lecturas pendientes')).toBeTruthy()
    expect(screen.queryByText('Ana Compradora')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Todos/ }))
    fireEvent.click(screen.getByText('Ana Compradora'))

    fireEvent.change(screen.getByPlaceholderText(/Escribe tu mensaje o solución/), {
      target: { value: 'Te enviaremos un reemplazo.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await waitFor(() => expect(mocks.enviarMensajeReclamo).toHaveBeenCalledWith(201, 'Te enviaremos un reemplazo.'))
    expect(addSpy).toHaveBeenCalledWith('bookyhome-complaint-updated', expect.any(Function))

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('bookyhome-complaint-updated', expect.any(Function))
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('opens and closes the photo evidence lightbox for the selected complaint', async () => {
    mocks.getQuejasVendedor.mockResolvedValue({
      data: [{
        ...sellerComplaints[0],
        evidencia_url: '/media/evidencia.jpg',
      }],
    })
    render(<QuejasVendedor />)

    fireEvent.click(await screen.findByText('Libro maltratado'))
    fireEvent.click(screen.getByText('Ver evidencia'))

    const dialog = screen.getByRole('dialog', { name: 'Evidencia fotográfica adjunta' })
    expect(dialog.querySelector('img')).toHaveAttribute(
      'src',
      'https://api.example.test/media/evidencia.jpg',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar evidencia' }))
    expect(screen.queryByRole('dialog', { name: 'Evidencia fotográfica adjunta' })).toBeNull()
  })
})
