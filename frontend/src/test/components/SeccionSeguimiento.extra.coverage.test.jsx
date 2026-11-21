/**
 * SeccionSeguimiento.extra.coverage.test.jsx
 * Covers uncovered branches in SeccionSeguimiento.jsx (72.6%)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SeccionSeguimiento from '../../components/dashboard/SeccionSeguimiento'

vi.mock('../../components/Icons', () => ({ IconTruck: () => null }))
vi.mock('../../services/api', () => ({
  getOrdenes: vi.fn(),
  confirmarEntrega: vi.fn(),
  cancelOrder: vi.fn(),
}))

const makeOrden = (overrides = {}) => ({
  id_orden: 1,
  id_orden_db: 1,
  estado: 'pagado',
  fecha: '2024-01-01T10:00:00',
  items: [{ titulo: 'Libro Test', nombre_tienda: 'Librería Test' }],
  envio: null,
  ...overrides,
})

const ordenCamino = makeOrden({
  id_orden: 2,
  id_orden_db: 2,
  estado: 'enviado',
  envio: { empresa_mensajeria: 'Interrapidísimo', numero_guia: 'ABC123', url_rastreo: 'https://track.test' },
})

const ordenEntregado = makeOrden({
  id_orden: 3,
  id_orden_db: 3,
  estado: 'entregado',
  fecha_entrega_confirmada: '2024-01-10T15:00:00',
  envio: { empresa_mensajeria: 'Coordinadora', numero_guia: 'XYZ', fecha_despacho: '2024-01-05' },
})

beforeEach(() => vi.clearAllMocks())
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('SeccionSeguimiento — loading and tabs', () => {
  it('shows loading state initially', () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockReturnValue(new Promise(() => {}))
    render(<SeccionSeguimiento userId={1} />)
    expect(screen.getByText(/cargando seguimientos/i)).toBeInTheDocument()
  })

  it('renders esperando tab with count', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [makeOrden()] })
    render(<SeccionSeguimiento userId={1} />)
    await screen.findByText(/esperando envío/i)
    expect(screen.getByText(/esperando envío \(1\)/i)).toBeInTheDocument()
  })

  it('renders camino and entregado tabs empty', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando seguimientos/i)).toBeNull())
    expect(screen.getByText(/esperando envío \(0\)/i)).toBeInTheDocument()
  })

  it('switches to camino tab', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    expect(screen.getByText(/pedido #2/i)).toBeInTheDocument()
  })

  it('switches to entregado tab', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenEntregado] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/entregado/i))
    expect(screen.getByText(/pedido #3/i)).toBeInTheDocument()
  })

  it('shows empty state when vista has no orders', async () => {
    const { getOrdenes } = require('../../services/api')
    gOrdenes.mockResolvedValue({ data: [makeOrden()] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino \(0\)/i))
    expect(screen.getByText(/no tienes pedidos en/i)).toBeInTheDocument()
  })

  it('does not load when userId is falsy', () => {
    const { getOrdenes } = require('../../services/api')
    render(<SeccionSeguimiento userId={null} />)
    expect(getOrdenes).not.toHaveBeenCalled()
  })
})

describe('SeccionSeguimiento — confirmar recepción', () => {
  it('opens confirmation dialog when clicking Confirmar', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/confirmar que recibí/i))
    expect(await screen.findByText(/¿recibiste tu pedido\?/i)).toBeInTheDocument()
  })

  it('cancels confirmation dialog', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/confirmar que recibí/i))
    await screen.findByText(/¿recibiste tu pedido\?/i)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByText(/¿recibiste tu pedido\?/i)).toBeNull())
  })

  it('confirms delivery successfully', async () => {
    const { getOrdenes, confirmarEntrega } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    confirmarEntrega.mockResolvedValue({ data: { ok: true } })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/confirmar que recibí/i))
    await screen.findByText(/¿recibiste tu pedido\?/i)
    fireEvent.click(screen.getByRole('button', { name: /sí, confirmar/i }))
    await screen.findByText(/confirmaste la entrega/i)
  })

  it('shows error when confirm fails', async () => {
    const { getOrdenes, confirmarEntrega } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    confirmarEntrega.mockRejectedValue({ response: { data: { detail: 'Error al confirmar' } } })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/confirmar que recibí/i))
    await screen.findByText(/¿recibiste tu pedido\?/i)
    fireEvent.click(screen.getByRole('button', { name: /sí, confirmar/i }))
    await screen.findByText(/error al confirmar/i)
  })
})

describe('SeccionSeguimiento — cancelar pedido', () => {
  it('opens cancel dialog', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/cancelar pedido/i))
    expect(await screen.findByText(/cancelar pedido #/i)).toBeInTheDocument()
  })

  it('submit disabled when motivo < 5 chars', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/cancelar pedido/i))
    await screen.findByLabelText(/motivo/i)
    expect(screen.getByRole('button', { name: /confirmar cancelación/i })).toBeDisabled()
  })

  it('cancels pedido with valid motivo', async () => {
    const { getOrdenes, cancelOrder } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    cancelOrder.mockResolvedValue({ data: { ok: true } })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/cancelar pedido/i))
    await screen.findByLabelText(/motivo/i)
    fireEvent.change(screen.getByLabelText(/motivo/i), { target: { value: 'No quiero el pedido' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar cancelación/i }))
    await screen.findByText(/fue cancelado/i)
  })

  it('closes cancel dialog with Volver', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/cancelar pedido/i))
    await screen.findByRole('button', { name: 'Volver' })
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    await waitFor(() => expect(screen.queryByText(/cancelar pedido #/i)).toBeNull())
  })
})

describe('SeccionSeguimiento — detalle envío', () => {
  it('opens and closes detalle for camino order', async () => {
    const { getOrdenes } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/información del envío/i))
    expect(await screen.findByText(/detalle del envío/i)).toBeInTheDocument()
    // Close with × button in header
    const closeBtn = screen.getByRole('button', { name: 'Cerrar' })
    fireEvent.click(closeBtn)
    await waitFor(() => expect(screen.queryByText(/detalle del envío/i)).toBeNull())
  })

  it('opens detalle for entregado order and shows travel time', async () => {
    const { getOrdenes } = require('../../services/api')
    gOrdenes.mockResolvedValue({ data: [ordenEntregado] })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/entregado \(1\)/i))
    await screen.findByText(/pedido #3/i)
    fireEvent.click(screen.getByText(/información de entrega/i))
    expect(await screen.findByText(/comprobante de entrega/i)).toBeInTheDocument()
    expect(screen.getByText(/tiempo total de entrega/i)).toBeInTheDocument()
  })
})

describe('SeccionSeguimiento — pagination', () => {
  it('renders pagination when items exceed page size', async () => {
    const { getOrdenes } = require('../../services/api')
    const muchasOrdenes = Array.from({ length: 10 }, (_, i) =>
      makeOrden({ id_orden: i + 10, id_orden_db: i + 10, estado: 'pagado' })
    )
    getOrdenes.mockResolvedValue({ data: muchasOrdenes })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    // Pagination bar should appear
    expect(screen.getByText(/siguiente/i)).toBeInTheDocument()
  })

  it('changes items per page', async () => {
    const { getOrdenes } = require('../../services/api')
    const muchasOrdenes = Array.from({ length: 15 }, (_, i) =>
      makeOrden({ id_orden: i + 20, id_orden_db: i + 20, estado: 'pagado' })
    )
    getOrdenes.mockResolvedValue({ data: muchasOrdenes })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '12' } })
    expect(select.value).toBe('12')
  })
})

describe('SeccionSeguimiento — aviso dialog', () => {
  it('closes aviso with Entendido', async () => {
    const { getOrdenes, confirmarEntrega } = require('../../services/api')
    getOrdenes.mockResolvedValue({ data: [ordenCamino] })
    confirmarEntrega.mockResolvedValue({ data: { ok: true } })
    render(<SeccionSeguimiento userId={1} />)
    await waitFor(() => expect(screen.queryByText(/cargando/i)).toBeNull())
    fireEvent.click(screen.getByText(/en camino/i))
    await screen.findByText(/pedido #2/i)
    fireEvent.click(screen.getByText(/confirmar que recibí/i))
    await screen.findByText(/sí, confirmar/i)
    fireEvent.click(screen.getByRole('button', { name: /sí, confirmar/i }))
    await screen.findByRole('button', { name: 'Entendido' })
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Entendido' })).toBeNull())
  })
})
