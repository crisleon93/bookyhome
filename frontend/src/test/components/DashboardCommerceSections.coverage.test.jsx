import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SeccionCarrito from '../../components/dashboard/SeccionCarrito'
import SeccionMisCompras from '../../components/dashboard/SeccionMisCompras'
import SeccionNotificaciones from '../../components/dashboard/SeccionNotificaciones'
import api, { actualizarCostoEnvio, aplicarCupon, cancelarMisPendientes, cancelOrder, checkoutCarrito, checkoutDirecto, getCarrito, getDatosTransferenciaVendedor, getDevoluciones, getDirecciones, getOrden, getOrdenes, notificarLlegadaTienda, postPayment, removeFromCart, reservarRetiroEnTienda, sendConfirmationEmail, updateCartQuantity } from '../../services/api'
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
vi.mock('../../services/api', async (importOriginal) => ({
  ...await importOriginal(),
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
  updateCartQuantity: vi.fn(() => Promise.resolve({ data: {} })),
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
    cancelOrder.mockResolvedValue({})
    checkoutDirecto.mockResolvedValue({ data: { ok: false } })
    getDatosTransferenciaVendedor.mockResolvedValue({ data: { ok: false, vendedores: [] } })
    getOrdenes.mockResolvedValue({ data: [] })
    getDevoluciones.mockResolvedValue({ data: [] })
    getDirecciones.mockResolvedValue({ data: [] })
    getOrden.mockResolvedValue({ data: { id_orden: 1 } })
    removeFromCart.mockResolvedValue({})
    cancelarMisPendientes.mockResolvedValue({ data: { canceladas: 1 } })
    actualizarCostoEnvio.mockResolvedValue({ data: { ok: true, total: 14000, costo_envio: 0 } })
    reservarRetiroEnTienda.mockResolvedValue({
      data: {
        ok: true,
        pin_retiro: '4821',
        estado_retiro: 'reservado',
        tienda: { nombre_tienda: 'Librería Central', direccion: 'Calle 10' },
      },
    })
    notificarLlegadaTienda.mockResolvedValue({ data: { ok: true } })
    postPayment.mockResolvedValue({ data: { ok: true } })
    sendConfirmationEmail.mockResolvedValue({})
    notificacionesService.obtener.mockResolvedValue({ notificaciones: [] })
  })

  afterEach(cleanup)

  it('navega al catálogo desde el carrito vacío', async () => {
    render(<SeccionCarrito userId={7} />)
    expect(await screen.findByText('Tu carrito está vacío')).toBeTruthy()
    fireEvent.click(screen.getByText('Ir al catálogo'))
    expect(mocks.navigate).toHaveBeenCalledWith('/?seccion=Catálogo')
  })

  it('limpia el param pagarOrden en la URL al volver al carrito desde checkout', async () => {
    mocks.location = { search: '?pagarOrden=101', state: null }
    getCarrito.mockResolvedValue({ data: [] })
    getDirecciones.mockResolvedValue({ data: [] })
    getOrden.mockResolvedValue({
      data: {
        id_orden: 101,
        estado: 'pendiente',
        total: 10000,
        tipo_entrega: 'domicilio',
        items: [{ id_libro: 1, titulo: 'Libro Orden', precio_libro: 10000, cantidad: 1 }],
      },
    })
    render(<SeccionCarrito userId={7} />)
    const volverBtn = await screen.findByRole('button', { name: /Volver al carrito/i })
    fireEvent.click(volverBtn)
    expect(mocks.navigate).toHaveBeenCalledWith('/?seccion=Carrito', { replace: true, state: {} })
    mocks.location = { search: '', state: null }
  })

  it('elimina un libro del carrito y vuelve a cargar sus datos', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro del carrito', autor_libro: 'Autora', precio_libro: 14000, cantidad: 1,
    }] })
    render(<SeccionCarrito userId={7} />)
    expect((await screen.findAllByText('Libro del carrito')).length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByTitle('Eliminar del carrito')[0])

    await waitFor(() => expect(removeFromCart).toHaveBeenCalledWith(33))
    expect(notify).toHaveBeenCalledWith('Libro eliminado del carrito', 'info')
  })

  it('incrementa y decrementa cantidad en el carrito con los botones dedicados', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro cantidad', autor_libro: 'Autora', precio_libro: 14000, cantidad: 2, stock: 10,
    }] })
    updateCartQuantity.mockResolvedValue({ data: { ok: true } })
    render(<SeccionCarrito userId={7} />)
    expect((await screen.findAllByText('Libro cantidad')).length).toBeGreaterThan(0)
    const incBtn = screen.getByTitle('Aumentar cantidad')
    fireEvent.click(incBtn)
    await waitFor(() => expect(updateCartQuantity).toHaveBeenCalledWith(33, 3))

    const decBtn = screen.getByTitle('Reducir cantidad')
    fireEvent.click(decBtn)
    await waitFor(() => expect(updateCartQuantity).toHaveBeenCalledWith(33, 1))
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

  it('valida campos de tarjeta antes de intentar cobrar y muestra errores de cupón', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro con pago seguro', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 79, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 79, estado: 'pendiente', total: 14000 } })
    api.post.mockImplementation((path) => path === '/cupones/validar'
      ? Promise.resolve({ data: { valido: false } })
      : Promise.resolve({ data: {} }))
    render(<SeccionCarrito userId={7} />)

    await screen.findAllByText('Libro con pago seguro')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.change(screen.getByPlaceholderText('Código de cupón'), {
      target: { value: 'NO-EXISTE' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText('El cupón ingresado no es válido.')).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith('/cupones/validar', {
      codigo: 'NO-EXISTE',
      order_id: 79,
      total: 14000,
    })

    fireEvent.submit(document.querySelector('.checkout-payment-form'))
    expect(await screen.findByText(/Número de tarjeta inválido/)).toBeTruthy()
    expect(screen.getByText(/Nombre completo es requerido/)).toBeTruthy()
    expect(screen.getByText(/Fecha inválida/)).toBeTruthy()
    expect(screen.getByText(/CVV inválido/)).toBeTruthy()
    expect(postPayment).not.toHaveBeenCalled()
  })

  it('valida las credenciales de PayPal y crea el recibo de Efecty', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro para pagos alternativos', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 80, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 80, estado: 'pendiente', total: 14000 } })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro para pagos alternativos')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')

    fireEvent.click(screen.getByRole('button', { name: /PayPal/ }))
    expect(screen.getByText('PayPal Checkout')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /— Pagar/ }))
    fireEvent.submit(screen.getByLabelText('Correo electrónico de PayPal').closest('form'))
    expect(await screen.findByText('Ingresa tu correo y contraseña')).toBeTruthy()
    expect(postPayment).not.toHaveBeenCalled()

    const fillDemo = screen.getByRole('button', { name: /Llenar datos de prueba/ })
    fireEvent.mouseEnter(fillDemo)
    expect(fillDemo.style.background).toBe('rgb(240, 247, 255)')
    fireEvent.mouseLeave(fillDemo)
    fireEvent.click(fillDemo)
    const demoEmail = screen.getByLabelText('Correo electrónico de PayPal')
    const demoPassword = screen.getByLabelText('Contraseña Sandbox')
    fireEvent.focus(demoEmail)
    fireEvent.blur(demoEmail)
    fireEvent.focus(demoPassword)
    fireEvent.blur(demoPassword)
    const paypalSubmit = document.querySelector('.paypal-modal-submit')
    fireEvent.mouseEnter(paypalSubmit)
    fireEvent.mouseLeave(paypalSubmit)
    const paypalCancel = screen.getByRole('button', { name: 'Cancelar y regresar al carrito' })
    fireEvent.mouseEnter(paypalCancel)
    fireEvent.mouseLeave(paypalCancel)
    fireEvent.click(paypalCancel)
    fireEvent.click(screen.getByRole('button', { name: /— Pagar/ }))
    const paypalClose = document.querySelector('.paypal-modal-header button')
    fireEvent.mouseEnter(paypalClose)
    fireEvent.mouseLeave(paypalClose)
    fireEvent.click(paypalClose)

    fireEvent.click(screen.getByRole('button', { name: /Punto Efecty/ }))
    expect(screen.getByText('Puntos de Pago Efecty')).toBeTruthy()
    const efectyButton = screen.getByRole('button', { name: 'Generar Código de Pago Efecty' })
    fireEvent.mouseEnter(efectyButton)
    fireEvent.mouseLeave(efectyButton)
    fireEvent.click(efectyButton)
    expect(await screen.findByText('CUPÓN DE PAGO OFICIAL')).toBeTruthy()
    expect(screen.getByText('110954')).toBeTruthy()
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Ya realicé el pago en el punto' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(1200) })
    vi.useRealTimers()
    expect(await screen.findByText('¡Pago Realizado Exitosamente!')).toBeTruthy()
    expect(postPayment).toHaveBeenCalledWith(expect.objectContaining({
      payment_method: 'Pago en Efecty',
    }))
  })

  it('reserva el retiro en tienda, muestra el PIN y notifica la llegada', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, id_tienda: 8, nombre_tienda: 'Librería Central',
      titulo: 'Libro para recoger', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 81, estado: 'pendiente', total: 14000, items: [] } },
    })
    getOrden.mockResolvedValue({
      data: { id_orden: 81, estado: 'pendiente', total: 14000, tipo_entrega: 'domicilio' },
    })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro para recoger')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /Retiro en Tienda/ }))
    expect(screen.getByText('Costo de envío: $0')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Nequi \/ Daviplata/ }))
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Reserva con Nequi/ }))

    expect(await screen.findByText('¡Reserva Confirmada con Éxito!')).toBeTruthy()
    expect(screen.getByText('4821')).toBeTruthy()
    expect(screen.getByText('Librería Central')).toBeTruthy()
    expect(reservarRetiroEnTienda).toHaveBeenCalledWith(81, 'Nequi')
    fireEvent.click(screen.getByRole('button', { name: /Ya llegué a la librería/ }))
    await waitFor(() => {
      expect(notificarLlegadaTienda).toHaveBeenCalledWith(81)
      expect(notify).toHaveBeenCalledWith(
        '¡Se notificó tu llegada a la librería con éxito!',
        'success',
      )
    })
    expect(screen.getByText('¡Llegada Notificada al Vendedor!')).toBeTruthy()
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

  it('abre detalles de una orden pendiente, recupera una portada rota y permite continuar al pago', async () => {
    getOrdenes.mockResolvedValue({ data: [{
      id_orden: 83,
      estado: 'pendiente',
      total: 25000,
      items: [
        { id_libro: 1, titulo: 'Portada rota', autor_libro: 'Autora', imagen: '/broken.jpg', cantidad: 1, precio_libro: 12000 },
        { id_libro: 2, titulo: 'Portada alternativa', cantidad: 1, precio_libro: 13000 },
      ],
    }] })

    render(<SeccionCarrito userId={7} />)
    fireEvent.click(await screen.findByRole('button', { name: /Ver detalles/ }))

    const details = screen.getByRole('dialog', { name: 'Detalles de orden pendiente' })
    expect(within(details).getByText('Orden #83')).toBeTruthy()
    fireEvent.error(within(details).getByAltText('Portada rota'))
    expect(within(details).getAllByText('P').length).toBeGreaterThan(0)
    fireEvent.click(within(details).getByRole('button', { name: 'Continuar al Pago' }))
    expect(await screen.findByText('2. Entrega y Pago')).toBeTruthy()
    expect(getOrden).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTitle('Regresar al carrito'))
    await screen.findAllByText('Orden #83')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar', exact: true }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sí, cancelar' }))
    await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(83, 'Cancelación de orden pendiente'))
  })

  it('maneja una compra directa después de completar los datos de tarjeta', async () => {
    mocks.location.state = {
      buyNow: {
        id_libro: 34,
        titulo: 'Compra inmediata',
        precio_libro: 14000,
        cantidad: 1,
        tipo_entrega: 'domicilio',
      },
    }
    checkoutDirecto.mockResolvedValue({
      data: { ok: true, order: { id_orden: 84, estado: 'pendiente', total: 14000 } },
    })
    render(<SeccionCarrito userId={7} />)

    expect(await screen.findByText('2. Entrega y Pago')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), {
      target: { value: '4111 1111 1111 1111' },
    })
    fireEvent.change(screen.getByLabelText('Vencimiento (MM/AA)'), { target: { value: '1228' } })
    fireEvent.change(screen.getByLabelText('Código CVV'), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/Nombre del Titular/), { target: { value: 'Ana Compradora' } })
    for (const field of [
      screen.getByPlaceholderText('0000 0000 0000 0000'),
      screen.getByLabelText('Vencimiento (MM/AA)'),
      screen.getByLabelText('Código CVV'),
      screen.getByLabelText(/Nombre del Titular/),
    ]) {
      fireEvent.focus(field)
      expect(field.style.background).toBe('rgb(255, 255, 255)')
      fireEvent.blur(field)
      expect(field.style.boxShadow).toBe('none')
    }
    const payButton = document.querySelector('.checkout-payment-form button[type="submit"]')
    fireEvent.mouseEnter(payButton)
    expect(payButton.style.filter).toBe('brightness(1.08)')
    fireEvent.mouseLeave(payButton)

    vi.useFakeTimers()
    fireEvent.submit(document.querySelector('.checkout-payment-form'))
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    vi.useRealTimers()

    await waitFor(() => {
      expect(checkoutDirecto).toHaveBeenCalledWith(expect.objectContaining({
        id_libro: 34,
        tipo_entrega: 'domicilio',
      }))
      expect(postPayment).toHaveBeenCalledWith(expect.objectContaining({
        order_id: 84,
        payment_method: 'Tarjeta de Crédito',
      }))
    })
    expect(await screen.findByText('¡Pago Realizado Exitosamente!')).toBeTruthy()
  })

  it('muestra el error cuando no se puede crear una orden de compra directa', async () => {
    mocks.location.state = {
      buyNow: { id_libro: 42, titulo: 'Libro sin stock', precio_libro: 14000, cantidad: 1 },
    }
    checkoutDirecto.mockResolvedValue({
      data: { ok: false, error: 'El libro ya no está disponible.' },
    })
    render(<SeccionCarrito userId={7} />)

    await screen.findByText('2. Entrega y Pago')
    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), {
      target: { value: '4111 1111 1111 1111' },
    })
    fireEvent.change(screen.getByLabelText('Vencimiento (MM/AA)'), { target: { value: '1228' } })
    fireEvent.change(screen.getByLabelText('Código CVV'), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/Nombre del Titular/), { target: { value: 'Ana Compradora' } })
    vi.useFakeTimers()
    fireEvent.submit(document.querySelector('.checkout-payment-form'))
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    vi.useRealTimers()

    await waitFor(() => expect(checkoutDirecto).toHaveBeenCalledWith(expect.objectContaining({
      id_libro: 42,
    })))
    expect(postPayment).not.toHaveBeenCalled()
  })

  it('carga y muestra los datos bancarios del vendedor al elegir transferencia', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 35, titulo: 'Libro para transferir', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 85, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 85, estado: 'pendiente', total: 14000 } })
    getDatosTransferenciaVendedor.mockResolvedValue({
      data: {
        ok: true,
        vendedores: [{
          id_tienda: 8,
          nombre_tienda: 'Librería Central',
          vendedor_nombre: 'Ana',
          tiene_cuenta: true,
          cuenta: {
            banco: 'Bancolombia',
            tipo_cuenta: 'Ahorros',
            numero_cuenta: '123456789',
            nombre_titular: 'Ana Vendedora',
            cedula_titular: '10203040',
          },
        }, {
          id_tienda: 9,
          nombre_tienda: 'Librería en actualización',
          vendedor_nombre: 'Luis',
          tiene_cuenta: false,
        }],
      },
    })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro para transferir')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /Transferencia/ }))

    expect(await screen.findByText('Librería Central')).toBeTruthy()
    expect(screen.getByText('123456789')).toBeTruthy()
    expect(screen.getByText('Ana Vendedora')).toBeTruthy()
    expect(screen.getByText(/está actualizando sus datos de cuenta/)).toBeTruthy()
    fireEvent.click(screen.getByTitle('Copiar cédula'))
    for (const copyButton of screen.getAllByRole('button', { name: 'Copiar' })) {
      fireEvent.click(copyButton)
    }
    fireEvent.click(screen.getByRole('button', { name: 'Copiar número' }))
    expect(notify).toHaveBeenCalledWith('No se pudo copiar automáticamente', 'error')
  })

  it('ofrece la cuenta oficial cuando la tienda no devuelve datos bancarios', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 44, titulo: 'Libro para transferencia alternativa', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 93, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 93, estado: 'pendiente', total: 14000 } })
    getDatosTransferenciaVendedor.mockResolvedValue({ data: { ok: false, vendedores: [] } })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro para transferencia alternativa')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /Transferencia/ }))

    expect(await screen.findByText('Cuenta Oficial de Recaudo')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(notify).toHaveBeenCalledWith('No se pudo copiar automáticamente', 'error')
    const confirmTransfer = screen.getByRole('button', { name: 'Confirmar Transferencia Realizada' })
    fireEvent.mouseEnter(confirmTransfer)
    fireEvent.mouseLeave(confirmTransfer)
    fireEvent.click(confirmTransfer)
    expect(await screen.findByText('¡Pago Realizado Exitosamente!')).toBeTruthy()
  })

  it('reanuda una orden pendiente de retiro y procesa el pago en efectivo en tienda', async () => {
    const order = {
      id_orden: 86,
      estado: 'pendiente',
      estado_retiro: 'habilitado_pago',
      tipo_entrega: 'retiro_tienda',
      total: 14000,
      items: [{ id_libro: 36, titulo: 'Libro para pagar en tienda', cantidad: 1, precio_libro: 14000 }],
    }
    mocks.location.search = '?pagarOrden=86&metodo=Efectivo%20en%20Tienda&entrega=retiro_tienda'
    getOrden.mockResolvedValue({ data: order })
    render(<SeccionCarrito userId={7} />)

    const payButton = await screen.findByRole('button', { name: /Pagar en Efectivo en Tienda/ })
    fireEvent.mouseEnter(payButton)
    fireEvent.mouseLeave(payButton)
    fireEvent.click(payButton)
    await waitFor(() => expect(postPayment).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 86,
      payment_method: 'Efectivo en Tienda',
      tipo_entrega: 'retiro_tienda',
    })))
    expect(await screen.findByText('¡Pago Realizado Exitosamente!')).toBeTruthy()
  })

  it('muestra las dos billeteras de retiro y conserva el flujo si la reserva falla', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 43, titulo: 'Libro para billetera', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 92, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 92, estado: 'pendiente', total: 14000 } })
    reservarRetiroEnTienda.mockResolvedValue({ data: { ok: false, error: 'No se pudo reservar.' } })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro para billetera')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /Retiro en Tienda/ }))
    fireEvent.click(screen.getByRole('button', { name: /Nequi \/ Daviplata/ }))
    expect(screen.getByText('By Davivienda')).toBeTruthy()

    const nequiButton = screen.getByRole('button', { name: /Confirmar Reserva con Nequi/ })
    fireEvent.mouseEnter(nequiButton)
    fireEvent.mouseLeave(nequiButton)
    fireEvent.click(nequiButton)
    await waitFor(() => expect(reservarRetiroEnTienda).toHaveBeenCalledWith(92, 'Nequi'))
    const daviplataButton = screen.getByRole('button', { name: /Confirmar Reserva con Daviplata/ })
    fireEvent.mouseEnter(daviplataButton)
    fireEvent.mouseLeave(daviplataButton)
    fireEvent.click(daviplataButton)
    await waitFor(() => expect(reservarRetiroEnTienda).toHaveBeenCalledWith(92, 'Daviplata'))
    expect(screen.getByText('By Davivienda')).toBeTruthy()
  })

  it('aplica un cupón válido al pagar con tarjeta y envía el descuento a la orden', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 37, titulo: 'Libro con descuento', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 87, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 87, estado: 'pendiente', total: 14000 } })
    api.post.mockImplementation((path) => path === '/cupones/validar'
      ? Promise.resolve({ data: { valido: true, descuento: 2000, mensaje: 'Descuento aplicado' } })
      : Promise.resolve({ data: {} }))

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro con descuento')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.change(screen.getByPlaceholderText('Código de cupón'), { target: { value: 'LECTURA' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText('Descuento aplicado')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), {
      target: { value: '3782822463100050' },
    })
    fireEvent.change(screen.getByLabelText('Vencimiento (MM/AA)'), { target: { value: '1228' } })
    fireEvent.change(screen.getByLabelText('Código CVV'), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/Nombre del Titular/), { target: { value: 'Ana Compradora' } })

    vi.useFakeTimers()
    fireEvent.submit(document.querySelector('.checkout-payment-form'))
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    vi.useRealTimers()

    await waitFor(() => expect(postPayment).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 87,
      amount: 12000,
      coupon_code: 'LECTURA',
    })))
    expect(aplicarCupon).toHaveBeenCalledWith({
      codigo: 'LECTURA',
      id_orden: 87,
      total: 14000,
    })
  })

  it('completa el pago sandbox con PayPal después de validar las credenciales', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 38, titulo: 'Libro para PayPal', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 88, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 88, estado: 'pendiente', total: 14000 } })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro para PayPal')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /PayPal/ }))
    const paypalPay = screen.getByRole('button', { name: /— Pagar/ })
    fireEvent.mouseEnter(paypalPay)
    fireEvent.mouseLeave(paypalPay)
    fireEvent.click(paypalPay)
    const paypalEmail = document.getElementById('paypal-email')
    fireEvent.change(paypalEmail, {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(document.getElementById('paypal-password'), {
      target: { value: 'sandbox-pass' },
    })

    vi.useFakeTimers()
    fireEvent.submit(paypalEmail.closest('form'))
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    vi.useRealTimers()

    await waitFor(() => expect(postPayment).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 88,
      payment_method: 'PayPal',
    })))
    expect(await screen.findByText('¡Pago Realizado Exitosamente!')).toBeTruthy()
  })

  it('muestra el rechazo de la pasarela y permite reintentar sin bloquear el formulario', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 41, titulo: 'Libro para reintentar', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 91, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 91, estado: 'pendiente', total: 14000 } })
    postPayment
      .mockResolvedValueOnce({ data: { ok: false } })
      .mockResolvedValueOnce({ data: { ok: true } })
    actualizarCostoEnvio.mockRejectedValueOnce(new Error('shipping unavailable'))
    sendConfirmationEmail.mockRejectedValueOnce(new Error('email unavailable'))
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro para reintentar')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /PayPal/ }))
    fireEvent.click(screen.getByRole('button', { name: /— Pagar/ }))
    const paypalEmail = document.getElementById('paypal-email')
    fireEvent.change(paypalEmail, { target: { value: 'ana@example.com' } })
    fireEvent.change(document.getElementById('paypal-password'), { target: { value: 'sandbox-pass' } })

    vi.useFakeTimers()
    fireEvent.submit(paypalEmail.closest('form'))
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    vi.useRealTimers()
    await waitFor(() => expect(postPayment).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /— Pagar/ }))
    const retryEmail = document.getElementById('paypal-email')
    fireEvent.change(retryEmail, { target: { value: 'ana@example.com' } })
    fireEvent.change(document.getElementById('paypal-password'), { target: { value: 'sandbox-pass' } })
    vi.useFakeTimers()
    fireEvent.submit(retryEmail.closest('form'))
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    vi.useRealTimers()
    expect(await screen.findByText('¡Pago Realizado Exitosamente!')).toBeTruthy()
    expect(consoleWarn).toHaveBeenCalled()
    consoleWarn.mockRestore()
  })

  it('impide retirar desde varias librerías y evita cobrar una orden ya entregada', async () => {
    getCarrito.mockResolvedValue({ data: [
      { id_libro: 39, id_tienda: 1, titulo: 'Libro de tienda uno', precio_libro: 9000, cantidad: 1 },
      { id_libro: 40, id_tienda: 2, titulo: 'Libro de tienda dos', precio_libro: 11000, cantidad: 1 },
    ] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 89, estado: 'pendiente', total: 20000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 89, estado: 'pendiente', total: 20000 } })

    const { unmount } = render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro de tienda uno')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    expect(screen.getByText('No disponible')).toBeTruthy()
    unmount()

    const completedOrder = {
      id_orden: 90,
      estado: 'entregada',
      estado_retiro: 'habilitado_pago',
      tipo_entrega: 'retiro_tienda',
      total: 14000,
      metodo_pago: 'Efectivo en Tienda',
    }
    mocks.location.state = {
      autoPayOrderId: 90,
      autoPayMethod: 'Efectivo en Tienda',
      autoPayEntrega: 'retiro_tienda',
      ordenObj: completedOrder,
    }
    getOrden.mockResolvedValue({ data: completedOrder })
    render(<SeccionCarrito userId={7} />)
    fireEvent.click(await screen.findByRole('button', { name: /Pagar en Efectivo en Tienda/ }))

    expect(await screen.findByText(/Esta orden ya no está pendiente de pago/)).toBeTruthy()
    expect(postPayment).not.toHaveBeenCalled()
  })

  it('valida el correo antes de continuar con el simulador PSE', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro PSE', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 77, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 77, estado: 'pendiente', total: 14000 } })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro PSE')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    expect(await screen.findByText('2. Entrega y Pago')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /PSE/ }))
    fireEvent.click(screen.getByRole('button', { name: /Abrir Simulador PSE/ }))
    fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ir a la Banca Virtual/ }))

    expect(await screen.findByText('Ingresa un correo electrónico registrado en PSE.')).toBeTruthy()
    expect(screen.getByText('1. Identificación PSE')).toBeTruthy()
  })

  it('completa un pago PSE y confirma la orden', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro PSE aprobado', precio_libro: 14000, cantidad: 1,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 78, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 78, estado: 'pendiente', total: 14000 } })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro PSE aprobado')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /PSE/ }))
    const frequentBank = document.querySelectorAll('.pse-bank-option')[1]
    fireEvent.mouseEnter(frequentBank)
    fireEvent.mouseLeave(frequentBank)
    fireEvent.click(frequentBank)
    const openPseSimulator = screen.getByRole('button', { name: /Abrir Simulador PSE/ })
    fireEvent.mouseEnter(openPseSimulator)
    fireEvent.mouseLeave(openPseSimulator)
    fireEvent.click(openPseSimulator)
    fireEvent.click(screen.getByRole('button', { name: /Ir a la Banca Virtual/ }))
    expect(await screen.findByText(/2. Banca Virtual/)).toBeTruthy()

    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: /Aprobar Débito Bancario/ }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    vi.useRealTimers()

    await waitFor(() => {
      expect(postPayment).toHaveBeenCalledWith({
        order_id: 78,
        amount: 14000,
        payment_method: 'PSE',
        tipo_entrega: 'domicilio',
      })
    })
    expect(sendConfirmationEmail).toHaveBeenCalledWith(78)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('cobra la tarjeta con la dirección guardada y presenta el comprobante de compra', async () => {
    getCarrito.mockResolvedValue({ data: [{
      id_libro: 33, titulo: 'Libro con dirección guardada', precio_libro: 14000, cantidad: 1,
    }] })
    getDirecciones.mockResolvedValue({ data: [{
      id_direccion: 12,
      alias_direccion: 'Casa',
      direccion_completa: 'Calle 20 # 10-15',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      telefono_contacto: '3001234567',
      es_principal: true,
    }] })
    checkoutCarrito.mockResolvedValue({
      data: { ok: true, order: { id_orden: 82, estado: 'pendiente', total: 14000 } },
    })
    getOrden.mockResolvedValue({ data: { id_orden: 82, estado: 'pendiente', total: 14000 } })
    actualizarCostoEnvio.mockResolvedValue({
      data: { ok: true, total: 15000, costo_envio: 1000 },
    })

    render(<SeccionCarrito userId={7} />)
    await screen.findAllByText('Libro con dirección guardada')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con el pago/ }))
    await screen.findByText('2. Entrega y Pago')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '12' } })
    expect(screen.getByText('Calle 20 # 10-15 • Bogotá, Cundinamarca • 📞 3001234567')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Tarjeta$/ }))
    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), {
      target: { value: '4111 1111 1111 1111' },
    })
    fireEvent.change(screen.getByLabelText('Vencimiento (MM/AA)'), { target: { value: '1228' } })
    fireEvent.change(screen.getByLabelText('Código CVV'), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/Nombre del Titular/), { target: { value: 'Ana Compradora' } })

    vi.useFakeTimers()
    fireEvent.submit(document.querySelector('.checkout-payment-form'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    vi.useRealTimers()

    await waitFor(() => {
      expect(postPayment).toHaveBeenCalledWith({
        order_id: 82,
        amount: 15000,
        payment_method: 'Tarjeta de Crédito',
        tipo_entrega: 'domicilio',
        id_direccion: 12,
      })
    })
    expect(sendConfirmationEmail).toHaveBeenCalledWith(82)
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

  it('filtra órdenes por estado y permite ordenar por valor', async () => {
    getOrdenes.mockResolvedValue({
      data: [
        { id_orden: 41, estado: 'entregada', total: 12000, fecha: '2026-03-01', items: [] },
        { id_orden: 42, estado: 'enviado', total: 45000, fecha: '2026-03-02', items: [] },
        { id_orden: 43, estado: 'pendiente', total: 30000, fecha: '2026-03-03', items: [] },
        { id_orden: 44, estado: 'cancelada', total: 8000, fecha: '2026-03-04', items: [] },
      ],
    })
    render(<SeccionMisCompras userId={7} />)

    await screen.findByText('Orden #41')
    fireEvent.click(screen.getAllByRole('button', { name: /Canceladas/ })[0])
    expect(screen.getByText('Orden #44')).toBeTruthy()
    expect(screen.queryByText('Orden #41')).toBeNull()

    fireEvent.click(screen.getAllByRole('button', { name: /Entregadas/ })[0])
    expect(screen.getByText('Orden #41')).toBeTruthy()
    expect(screen.queryByText('Orden #44')).toBeNull()
    fireEvent.change(screen.getByDisplayValue('📅 Más recientes'), {
      target: { value: 'mayor_precio' },
    })
    expect(screen.getByDisplayValue('💰 Mayor valor')).toBeTruthy()
  })

  it('abre el comprobante y muestra un error si no logra enviarlo por correo', async () => {
    const paidOrder = {
      id_orden: 52,
      estado: 'pagado',
      tipo_entrega: 'domicilio',
      total: 30000,
      total_con_descuento: 27000,
      costo_envio: 5000,
      cupon_aplicado: 'LECTURA10',
      items: [{ id_libro: 5, titulo: 'Libro comprado', autor_libro: 'Autora', cantidad: 1, precio_libro: 25000 }],
    }
    getOrdenes.mockResolvedValue({ data: [paidOrder] })
    getOrden.mockResolvedValue({ data: paidOrder })
    sendConfirmationEmail.mockRejectedValue(new Error('mail unavailable'))
    render(<SeccionMisCompras userId={7} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Ver Baucher' }))
    expect(await screen.findByRole('dialog', { name: '¡Compra Exitosa!' })).toBeTruthy()
    expect(screen.getByText('LECTURA10')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar por correo' }))

    await waitFor(() => expect(sendConfirmationEmail).toHaveBeenCalledWith(52))
    expect(notify).toHaveBeenCalledWith('No se pudo enviar el comprobante al correo', 'error')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar comprobante' }))
    expect(screen.queryByRole('dialog', { name: '¡Compra Exitosa!' })).toBeNull()
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

  it('navega a Mis Compras y Quejas y reclamos al hacer clic en notificaciones de pedido y sistema', async () => {
    getOrdenes.mockResolvedValue({ data: [] })
    notificacionesService.obtener.mockResolvedValue({
      notificaciones: [
        {
          id_notificacion: 21, tipo: 'pedido', titulo: 'Pedido confirmado',
          descripcion: 'Orden en camino', fecha_creacion: '2025-01-05T12:00:00', leida: true,
        },
        {
          id_notificacion: 22, tipo: 'sistema', titulo: 'Alerta del sistema',
          descripcion: 'Revisa tu reclamo', fecha_creacion: '2025-01-05T13:00:00', leida: true,
        },
      ],
    })
    render(<SeccionNotificaciones />)
    expect(await screen.findByText('Pedido confirmado')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir notificación: Pedido confirmado' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/?seccion=Mis%20Compras')

    fireEvent.click(screen.getByRole('button', { name: 'Abrir notificación: Alerta del sistema' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/?seccion=Quejas%20y%20reclamos')
  })

  it('filtra, ordena y marca como leídas las notificaciones automáticas', async () => {
    getOrdenes.mockResolvedValue({
      data: [
        { id_orden: 101, estado: 'entregada', total: 24000, fecha: '2025-01-03T12:00:00' },
        { id_orden: 102, estado: 'enviado', total: 18000, fecha: '2025-01-01T12:00:00' },
        { id_orden: 103, estado: 'pagado', total: 9000, fecha: '2025-01-02T12:00:00' },
        { id_orden: 104, estado: 'cancelada', total: 1000 },
      ],
    })
    notificacionesService.obtener.mockResolvedValue({
      notificaciones: [{
        id_notificacion: 9, tipo: 'sistema', titulo: 'Reclamo actualizado',
        descripcion: 'Revisa tu caso', fecha_creacion: '2025-01-04T12:00:00', leida: true,
      }],
    })
    render(<SeccionNotificaciones />)

    expect(await screen.findByText('Compra entregada')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Pedidos y envíos/ }))
    expect(screen.getByText('Compra en camino')).toBeTruthy()
    expect(screen.queryByText('Reclamo actualizado')).toBeNull()
    fireEvent.change(screen.getByLabelText('Ordenar notificaciones'), { target: { value: 'antiguas' } })
    fireEvent.click(screen.getByRole('button', { name: /No leídas/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Marcar todas como leídas' }))

    await waitFor(() => expect(notificacionesService.marcarTodasLeidas).toHaveBeenCalledOnce())
    expect(notificacionesService.obtener).toHaveBeenCalled()
    expect(screen.getByText('Compra entregada')).toBeTruthy()
  })

  it('elimina una notificación automática y elimina masivamente las restantes', async () => {
    getOrdenes.mockResolvedValue({
      data: [
        { id_orden: 111, estado: 'pendiente', total: 12000 },
        { id_orden: 112, estado: 'pagado', total: 25000 },
      ],
    })
    render(<SeccionNotificaciones />)
    expect(await screen.findByText('Pago Pendiente')).toBeTruthy()
    fireEvent.click(screen.getAllByTitle('Eliminar')[0])
    await waitFor(() => expect(screen.queryByText('Pago Pendiente')).toBeNull())

    fireEvent.click(screen.getByRole('button', { name: /Eliminar mensajes/ }))
    fireEvent.click(screen.getByLabelText('Todas las notificaciones'))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar', exact: true }))
    await waitFor(() => expect(notificacionesService.eliminarVarias).toHaveBeenCalledWith('todas'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
