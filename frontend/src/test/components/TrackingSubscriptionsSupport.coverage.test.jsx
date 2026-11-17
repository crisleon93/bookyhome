import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SeccionSeguimiento from '../../components/dashboard/SeccionSeguimiento'
import SeccionSuscripciones from '../../components/SeccionSuscripciones'
import { SIDE_LINKS } from '../../components/sideLinks'
import Soporte from '../../pages/Soporte'
import api, { cancelOrder, confirmarEntrega, crearSoporte, getOrdenes, getSoporte } from '../../services/api'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  cancelOrder: vi.fn(),
  confirmarEntrega: vi.fn(),
  crearSoporte: vi.fn(),
  getOrdenes: vi.fn(),
  getSoporte: vi.fn(),
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconCheck: Icon,
    IconCreditCard: Icon,
    IconLock: Icon,
    IconMessage: Icon,
    IconRefresh: Icon,
    IconShoppingBag: Icon,
    IconTool: Icon,
    IconTruck: Icon,
  }
})

const orders = [
  { id_orden: 11, estado: 'pagado', fecha: '2026-10-01', items: [{ titulo: 'Libro esperando' }] },
  {
    id_orden: 12,
    estado: 'enviado',
    fecha: '2026-10-02',
    envio: { empresa_mensajeria: 'Interrapidísimo', numero_guia: 'GUIA-12', fecha_despacho: '2026-10-01' },
    items: [{ titulo: 'Libro en camino', nombre_tienda: 'Librería Central' }],
  },
  {
    id_orden: 13,
    estado: 'entregada',
    fecha: '2026-10-03',
    fecha_entrega_confirmada: '2026-10-05',
    envio: { empresa_mensajeria: 'Mensajería', numero_guia: 'GUIA-13', fecha_despacho: '2026-10-01' },
  },
]

const plans = [
  { id_plan: 1, nombre_plan: 'Gratuito', descripcion: 'Plan inicial', precio_mensual: '0', historial_meses: 1 },
  {
    id_plan: 2,
    nombre_plan: 'Profesional',
    descripcion: 'Herramientas avanzadas',
    precio_mensual: '29000',
    historial_meses: 12,
    estadisticas_basicas: true,
    estadisticas_avanzadas: true,
    exportar_reportes: true,
    soporte_prioritario: true,
    impulsos_con_descuento: '10',
  },
]

const supportTickets = [
  {
    id_solicitud: 101,
    numero: 101,
    asunto: 'Error al pagar',
    descripcion: 'La pantalla de pago no carga.',
    categoria: 'Problema al pagar',
    estado: 'Abierto',
    fecha_creacion: '2026-11-13T10:00:00',
    respuesta: 'Estamos revisando el caso.',
  },
  {
    id_solicitud: 102,
    asunto: 'Consulta resuelta',
    descripcion: 'Pregunta sobre mi cuenta.',
    categoria: 'Otro problema técnico',
    estado: 'Resuelto',
    fecha_creacion: '2026-11-12T10:00:00',
  },
]

describe('seguimiento, suscripciones y soporte web', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getOrdenes.mockResolvedValue({ data: orders })
    confirmarEntrega.mockResolvedValue({})
    cancelOrder.mockResolvedValue({})
    getSoporte.mockResolvedValue({ data: supportTickets })
    crearSoporte.mockResolvedValue({})
    api.get.mockImplementation((path) => {
      if (path === '/herramientas/planes') return Promise.resolve({ data: plans })
      if (path === '/herramientas/mi-suscripcion') {
        return Promise.resolve({ data: { activa: true, suscripcion: { id_plan: 2, fecha_inicio: '2026-10-01', fecha_fin: '2026-11-01', metodo_pago: 'Transferencia', monto_pagado: 29000 } } })
      }
      return Promise.resolve({ data: [] })
    })
    api.post.mockResolvedValue({})
    api.delete.mockResolvedValue({})
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('muestra el detalle de envío y confirma la recepción de una orden', async () => {
    render(<SeccionSeguimiento userId={7} />)
    expect(await screen.findByText('Esperando envío (1)')).toBeTruthy()
    fireEvent.click(screen.getByText('En camino (1)'))
    expect(screen.getByText('Pedido #12')).toBeTruthy()
    fireEvent.click(screen.getByText('Información del envío'))

    const details = screen.getByRole('dialog')
    expect(within(details).getByText('GUIA-12')).toBeTruthy()
    expect(within(details).getByRole('link', { name: 'Ver rastreo' }).getAttribute('href')).toBe('https://www.interrapidisimo.com')
    fireEvent.click(within(details).getByText('Cerrar'))
    fireEvent.click(screen.getByText('Confirmar que recibí el pedido'))
    fireEvent.click(screen.getByText('Sí, confirmar entrega'))

    await waitFor(() => expect(confirmarEntrega).toHaveBeenCalledWith(12))
    expect(await screen.findByText('Entrega confirmada')).toBeTruthy()
  })

  it('valida el motivo y cancela el pedido desde seguimiento web', async () => {
    render(<SeccionSeguimiento userId={7} />)
    await screen.findByText('Esperando envío (1)')
    fireEvent.click(screen.getByText('En camino (1)'))
    fireEvent.click(screen.getByText('Cancelar pedido'))

    const dialog = screen.getByRole('dialog')
    const confirmButton = within(dialog).getByRole('button', { name: 'Confirmar cancelación' })
    expect(confirmButton.disabled).toBe(true)
    fireEvent.change(within(dialog).getByPlaceholderText('Ej. Ya no necesito el pedido'), {
      target: { value: 'Ya no necesito este pedido' },
    })
    fireEvent.click(confirmButton)

    await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(12, 'Ya no necesito este pedido'))
    expect(await screen.findByText('El pedido #12 fue cancelado.')).toBeTruthy()
  })

  it('carga planes, procesa un cambio y navega a Impulsos', async () => {
    let activePlan = null
    api.get.mockImplementation((path) => {
      if (path === '/herramientas/planes') return Promise.resolve({ data: plans })
      return Promise.resolve({ data: activePlan ? { activa: true, suscripcion: activePlan } : { activa: false } })
    })
    api.post.mockImplementation((_path, payload) => {
      activePlan = { ...payload, id_plan: 2, fecha_inicio: payload.fecha_inicio, fecha_fin: payload.fecha_fin }
      return Promise.resolve({})
    })
    const onNavegar = vi.fn()
    render(<SeccionSuscripciones tiendaId={4} onNavegar={onNavegar} />)

    expect(await screen.findByText('Gratuito')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a este Plan' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledOnce())
    expect(api.post).toHaveBeenCalledWith('/herramientas/suscribir', expect.objectContaining({
      id_plan: 2,
      monto_pagado: 29000,
    }))
    expect(api.post.mock.calls[0][1].fecha_inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(api.post.mock.calls[0][1].fecha_fin).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(await screen.findByText(/actualizada con/)).toBeTruthy()
    fireEvent.click(screen.getByText(/Ver y contratar Impulsos/))
    expect(onNavegar).toHaveBeenCalledWith('Impulsos')
    expect(screen.getByText(/Detalles de tu Suscripci/)).toBeTruthy()
  })

  it('crea un ticket y permite filtrar y contraer el historial', async () => {
    getSoporte
      .mockResolvedValueOnce({ data: supportTickets })
      .mockResolvedValueOnce({ data: [...supportTickets, { id_solicitud: 103, asunto: 'Nuevo error', estado: 'Abierto' }] })
    render(<Soporte />)
    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Problema nuevo' } })
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'La plataforma no responde.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Problema al pagar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(crearSoporte).toHaveBeenCalledWith({
      asunto: 'Problema nuevo',
      descripcion: 'La plataforma no responde.',
      categoria: 'Problema al pagar',
    }))
    expect(await screen.findByText('Ticket enviado al soporte técnico.')).toBeTruthy()

    fireEvent.click(screen.getByText('Mis tickets'))
    expect(await screen.findByText('Error al pagar')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: /Resuelto/ })[0])
    expect(screen.getByText('Consulta resuelta')).toBeTruthy()
    expect(screen.queryByText('Error al pagar')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Todos/ }))
    const ticketHeading = screen.getByRole('button', { name: /Error al pagar/ })
    fireEvent.click(ticketHeading)
    expect(ticketHeading.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('La pantalla de pago no carga.')).toBeNull()
  })

  it('mantiene los enlaces del menú comprador con sus etiquetas', () => {
    expect(SIDE_LINKS.map(({ name }) => name)).toEqual([
      'Inicio',
      'Mis Compras',
      'Mi Perfil',
      'Lista de Deseos',
      'Carrito',
      'Configuración',
    ])
  })
})
