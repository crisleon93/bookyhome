import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SeccionCarrito from '../../components/dashboard/SeccionCarrito'
import SeccionMisCompras from '../../components/dashboard/SeccionMisCompras'
import SeccionNotificaciones from '../../components/dashboard/SeccionNotificaciones'
import api, { cancelarMisPendientes, checkoutCarrito, getCarrito, getDevoluciones, getDirecciones, getOrden, getOrdenes, removeFromCart } from '../../services/api'
import { notificacionesService } from '../../services/notificaciones'
import { notify } from '../../components/ToastProvider'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  location: { search: '', state: null },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => mocks.location,
}))
vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  aplicarCupon: vi.fn(),
  cancelarMisPendientes: vi.fn(),
  cancelOrder: vi.fn(),
  checkoutCarrito: vi.fn(),
  checkoutDirecto: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  getCarrito: vi.fn(),
  getDatosTransferenciaVendedor: vi.fn(),
  getDevoluciones: vi.fn(),
  getDirecciones: vi.fn(),
  getOrden: vi.fn(),
  getOrdenes: vi.fn(),
  notificarLlegadaTienda: vi.fn(),
  postPayment: vi.fn(),
  reservarRetiroEnTienda: vi.fn(),
  removeFromCart: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  actualizarCostoEnvio: vi.fn(),
}))
vi.mock('../../services/notificaciones', () => ({
  notificacionesService: {
    obtener: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodasLeidas: vi.fn(),
    eliminar: vi.fn(),
    eliminarVarias: vi.fn(),
  },
}))
vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconBook: Icon,
    IconCheck: Icon,
    IconCreditCard: Icon,
    IconGift: Icon,
    IconInfo: Icon,
    IconLock: Icon,
    IconMessage: Icon,
    IconPackage: Icon,
    IconShoppingBag: Icon,
    IconStar: Icon,
    IconTruck: Icon,
    IconCart: Icon,
  }
})

describe('secciones de compras y notificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.location.search = ''
    mocks.location.state = null
    api.get.mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
    getCarrito.mockResolvedValue({ data: [] })
    getOrdenes.mockResolvedValue({ data: [] })
    getDevoluciones.mockResolvedValue({ data: [] })
    getDirecciones.mockResolvedValue({ data: [] })
    getOrden.mockResolvedValue({ data: { id_orden: 1 } })
    removeFromCart.mockResolvedValue({})
    cancelarMisPendientes.mockResolvedValue({ data: { canceladas: 1 } })
    notificacionesService.obtener.mockResolvedValue({ notificaciones: [] })
  })

  afterEach(cleanup)

  it('navega al catálogo desde el carrito vacío', async () => {
    render(<SeccionCarrito userId={7} />)
    expect(await screen.findByText('Tu carrito está vacío')).toBeTruthy()
    fireEvent.click(screen.getByText('Ir al catálogo'))
    expect(mocks.navigate).toHaveBeenCalledWith('/?seccion=Catálogo')
  })

  it('elimina un libro del carrito y vuelve a cargar sus datos', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro del carrito', autor_libro: 'Autora', precio_libro: 14000, cantidad: 1,
    }] })
    render(<SeccionCarrito userId={7} />)
    expect((await screen.findAllByText('Libro del carrito')).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByTitle('Eliminar del carrito'))

    await waitFor(() => expect(removeFromCart).toHaveBeenCalledWith(33))
    expect(notify).toHaveBeenCalledWith('Libro eliminado del carrito', 'info')
  })

  it('crea una orden antes de pasar al paso de entrega y pago', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro para pagar', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: {
        ok: true,
        order: { id_orden: 77, estado: 'pendiente', tipo_entrega: 'domicilio', total: 14000 },
      },
    })
    getOrden.mockResolvedValue({
      data: { id_orden: 77, estado: 'pendiente', tipo_entrega: 'domicilio', total: 14000 },
    })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro para pagar')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))

    expect(await screen.findByText('2. Entrega y Pago')).toBeTruthy()
    expect(checkoutCarrito).toHaveBeenCalledWith({
      id_direccion: null,
      tipo_entrega: 'domicilio',
    })
    expect(getOrden).toHaveBeenCalledWith(77)
  })

  it('muestra el error de la API cuando no se puede iniciar el checkout', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro temporal', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockRejectedValue({
      response: { data: { detail: 'No se pudo reservar el inventario' } },
    })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro temporal')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))

    expect(await screen.findByText(/No se pudo reservar el inventario/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Continuar con el pago/ })).toBeEnabled()
  })

  it('muestra el mensaje alternativo si el checkout responde sin crear la orden', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro sin reserva', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({ data: { ok: false } })
    render(<SeccionCarrito userId={7} />)

    await screen.findAllByText('Libro sin reserva')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))

    await waitFor(() => expect(checkoutCarrito).toHaveBeenCalledOnce())
    expect(getOrden).not.toHaveBeenCalled()
  })

  it('filtra compras por libro y abre el detalle actualizado de una orden', async () => {
    const order = {
      id_orden: 22,
      estado: 'entregada',
      tipo_entrega: 'retiro_tienda',
      total: 24000,
      fecha: '2025-01-02T12:00:00',
      items: [{ titulo: 'Libro entregado', cantidad: 1, precio_libro: 24000 }],
    }
    getOrdenes.mockResolvedValue({ data: [order] })
    getOrden.mockResolvedValue({ data: { ...order, tienda_retiro: { nombre_tienda: 'Librería Central' } } })
    render(<SeccionMisCompras userId={7} />)
    expect(await screen.findByText('Orden #22')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Buscar por # orden, libro o fecha...'), {
      target: { value: 'no existe' },
    })
    expect(screen.getByText('No se encontraron compras')).toBeTruthy()
    fireEvent.click(screen.getByText('Mostrar todas las compras'))
    fireEvent.click(await screen.findByText('Ver Detalles'))
    expect(await screen.findByText('Librería Central')).toBeTruthy()
    expect(getOrden).toHaveBeenCalledWith(22)
  })

  it('permite limpiar órdenes pendientes y notifica el resultado', async () => {
    getOrdenes.mockResolvedValue({
      data: [{ id_orden: 23, estado: 'pendiente', total: 14000, items: [] }],
    })
    render(<SeccionMisCompras userId={7} />)

    fireEvent.click(await screen.findByTitle('Cancela las órdenes que quedaron pendientes de pago sin completar'))

    await waitFor(() => expect(cancelarMisPendientes).toHaveBeenCalledOnce())
    expect(notify).toHaveBeenCalledWith('1 orden pendiente cancelada.', 'success')
  })

  it('combina notificaciones automáticas de órdenes y navega al leer un mensaje', async () => {
    getOrdenes.mockResolvedValue({ data: [{ id_orden: 90, estado: 'pendiente', total: 18000 }] })
    notificacionesService.obtener.mockResolvedValue({
      notificaciones: [{
        id_notificacion: 4, tipo: 'mensaje', titulo: 'Mensaje del vendedor', descripcion: 'Tu pedido está listo',
        fecha_creacion: '2025-01-02T12:00:00', leida: false, referencia_id: 15,
      }],
    })
    render(<SeccionNotificaciones />)
    expect(await screen.findByText('Pago Pendiente')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir notificación: Mensaje del vendedor' }))

    await waitFor(() => expect(notificacionesService.marcarLeida).toHaveBeenCalledWith(4))
    expect(mocks.navigate).toHaveBeenCalledWith('/?seccion=Mensajes&sala=15')
    fireEvent.click(screen.getByRole('button', { name: /Eliminar mensajes/ }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByText('Cancelar'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
