// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Seguimiento from '../../screens/Seguimiento'
import SoporteTecnico from '../../screens/SoporteTecnico'
import SuscripcionesVendedor from '../../screens/SuscripcionesVendedor'
import VendedorHome from '../../screens/VendedorHome'
import { AuthContext } from '../../context/AuthContext'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  cancelOrder: vi.fn(),
  cancelarSuscripcionHerramientas: vi.fn(),
  confirmarEntrega: vi.fn(),
  crearSoporte: vi.fn(),
  getAlertasStock: vi.fn(),
  getMiSuscripcionHerramientas: vi.fn(),
  getMisLibros: vi.fn(),
  getMisPedidos: vi.fn(),
  getOrdenes: vi.fn(),
  getPlanesHerramientas: vi.fn(),
  getSoporte: vi.fn(),
  getStatsVendedor: vi.fn(),
  getTopVendidos: vi.fn(),
  linkingOpenURL: vi.fn(),
  navigate: vi.fn(),
  recargarSalas: vi.fn(),
  signOut: vi.fn(),
  suscribirPlanHerramientas: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const nativeElement = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    disabled,
    value,
    placeholder,
    multiline,
    onRefresh,
    refreshControl,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        'aria-pressed': accessibilityState?.selected,
        'aria-expanded': accessibilityState?.expanded,
        role: accessibilityRole || 'button',
      }, children)
    }
    if (tag === 'input' || tag === 'textarea') {
      return ReactModule.createElement(tag, {
        value: value ?? '',
        placeholder,
        disabled: disabled || props.editable === false,
        'aria-label': accessibilityLabel,
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    if (tag === 'div' && (refreshControl || onRefresh)) {
      return ReactModule.createElement('div', { 'data-testid': props.testID },
        children,
        refreshControl || ReactModule.createElement('button', { type: 'button', onClick: onRefresh }, 'Actualizar'),
      )
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  return {
    ActivityIndicator: nativeElement('span'),
    Alert: { alert: mocks.alert },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Linking: { openURL: mocks.linkingOpenURL },
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' }, children)
      : null,
    Platform: { OS: 'web' },
    RefreshControl: ({ onRefresh }) => ReactModule.createElement('button', {
      type: 'button',
      onClick: onRefresh,
    }, 'Actualizar'),
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (styles) => styles, flatten: (style) => style },
    Text: nativeElement('span'),
    TextInput: ({ multiline, ...props }) => ReactModule.createElement(
      multiline ? 'textarea' : 'input',
      {
        value: props.value ?? '',
        placeholder: props.placeholder,
        disabled: props.editable === false,
        onChange: (event) => props.onChangeText?.(event.target.value),
      },
    ),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  }
})

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}))
vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div>{children}</div>,
}))
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div>{children}</div>,
}))
vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]),
    useNavigation: () => ({ navigate: mocks.navigate }),
  }
})
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { AuthContext: ReactModule.createContext({ user: null, signOut: mocks.signOut }) }
})
vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: (styles) => styles,
}))
vi.mock('../../context/ChatSocketContext', () => ({
  useChatSocket: () => ({ salas: [{ no_leidos: 2 }], loadingSalas: false, recargarSalas: mocks.recargarSalas }),
}))
vi.mock('../../components/SidebarVendedor', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconBell: Icon,
    IconBook: Icon,
    IconCheck: Icon,
    IconChevronRight: Icon,
    IconClose: Icon,
    IconCreditCard: Icon,
    IconLock: Icon,
    IconMail: Icon,
    IconMessage: Icon,
    IconPackage: Icon,
    IconPhone: Icon,
    IconRefresh: Icon,
    IconSearch: Icon,
    IconSettings: Icon,
    IconShoppingBag: Icon,
    IconStar: Icon,
    IconStore: Icon,
    IconTool: Icon,
    IconTruck: Icon,
    IconUser: Icon,
    IconUsers: Icon,
  }
})
vi.mock('../../services/api', () => ({
  cancelOrder: mocks.cancelOrder,
  cancelarSuscripcionHerramientas: mocks.cancelarSuscripcionHerramientas,
  confirmarEntrega: mocks.confirmarEntrega,
  crearSoporte: mocks.crearSoporte,
  getAlertasStock: mocks.getAlertasStock,
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  getMiSuscripcionHerramientas: mocks.getMiSuscripcionHerramientas,
  getMisLibros: mocks.getMisLibros,
  getMisPedidos: mocks.getMisPedidos,
  getOrdenes: mocks.getOrdenes,
  getPlanesHerramientas: mocks.getPlanesHerramientas,
  getSoporte: mocks.getSoporte,
  getStatsVendedor: mocks.getStatsVendedor,
  getTopVendidos: mocks.getTopVendidos,
  suscribirPlanHerramientas: mocks.suscribirPlanHerramientas,
}))

const orders = [
  { id_orden: 1, estado: 'pagado', fecha: '2026-11-01' },
  {
    id_orden_db: 2,
    id_orden: 20,
    estado: 'enviado',
    fecha: '2026-11-02',
    envio: { empresa_mensajeria: 'Interrapidísimo', numero_guia: 'GUIA-2', fecha_despacho: '2026-11-01' },
    items: [{ nombre_tienda: 'Librería Central' }],
  },
  { id_orden: 3, estado: 'entregada', fecha: '2026-11-03' },
]
const supportTickets = [
  { id_solicitud: 30, asunto: 'Pago sin respuesta', descripcion: 'No carga el pago', categoria: 'Problema al pagar', estado: 'Abierto', fecha_creacion: '2026-11-13T10:00:00' },
  { id_solicitud: 31, asunto: 'Cuenta recuperada', descripcion: 'Se resolvió el acceso', categoria: 'Error al iniciar sesión', estado: 'Resuelto', fecha_creacion: '2026-11-12T10:00:00' },
]
const plans = [
  { id_plan: 1, nombre_plan: 'Gratuito', descripcion: 'Plan básico', precio_mensual: 0, historial_meses: 1 },
  {
    id_plan: 2,
    nombre_plan: 'Profesional',
    descripcion: 'Estadísticas avanzadas',
    precio_mensual: 29000,
    historial_meses: 12,
    estadisticas_basicas: true,
    estadisticas_avanzadas: true,
    exportar_reportes: true,
    soporte_prioritario: true,
    impulsos_con_descuento: 10,
  },
]

const authValue = {
  user: { id_usuario: 42, id_tienda: 8, rol: 'vendedor', nombre: 'Librería Central', nombre_tienda: 'Librería Central' },
  signOut: mocks.signOut,
}

describe('seguimiento, soporte, suscripciones y panel de vendedor móvil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getOrdenes.mockResolvedValue({ data: orders })
    mocks.confirmarEntrega.mockResolvedValue({})
    mocks.cancelOrder.mockResolvedValue({})
    mocks.getSoporte.mockResolvedValue({ data: supportTickets })
    mocks.crearSoporte.mockResolvedValue({})
    mocks.getPlanesHerramientas.mockResolvedValue({ data: plans })
    mocks.getMiSuscripcionHerramientas.mockResolvedValue({ data: { activa: false } })
    mocks.suscribirPlanHerramientas.mockResolvedValue({})
    mocks.cancelarSuscripcionHerramientas.mockResolvedValue({})
    mocks.getMisLibros.mockResolvedValue({ data: [{ id_libro: 5, titulo: 'Libro destacado', autor_libro: 'Autora', precio_libro: 25000, stock: 2, nombre_categoria: 'Ficción' }] })
    mocks.getStatsVendedor.mockResolvedValue({ data: { total_mes: 50000, ordenes_mes: 2, total_hoy: 10000, ordenes_hoy: 1, total_semana: 30000 } })
    mocks.getTopVendidos.mockResolvedValue({ data: [{ id_libro: 5, titulo: 'Libro destacado', autor_libro: 'Autora', precio_libro: 25000, unidades_vendidas: 3 }] })
    mocks.getAlertasStock.mockResolvedValue({ data: [{ titulo: 'Libro destacado', stock: 2 }] })
    mocks.getMisPedidos.mockResolvedValue({ data: [{ id_orden: 18, cliente: 'Ana Compradora', fecha: '2026-11-12', total_tienda: 20000 }] })
  })

  afterEach(cleanup)

  it('muestra las categorías de pedidos y abre el rastreo y confirmación de entrega', async () => {
    render(<Seguimiento />)
    expect(await screen.findByText('Esperando envío (1)')).toBeTruthy()
    fireEvent.click(screen.getByText('En camino (1)'))
    expect(screen.getByText('Pedido #2')).toBeTruthy()
    fireEvent.click(screen.getByText('Información del envío'))

    const detail = screen.getByRole('dialog')
    expect(within(detail).getByText('GUIA-2')).toBeTruthy()
    fireEvent.click(within(detail).getByText('Ver rastreo'))
    await waitFor(() => expect(mocks.linkingOpenURL).toHaveBeenCalledWith('https://www.interrapidisimo.com'))
    fireEvent.click(within(detail).getByRole('button', { name: 'Cerrar' }))
    fireEvent.click(screen.getByText('Confirmar que recibí el pedido'))
    fireEvent.click(screen.getByText('Sí, confirmar entrega'))

    await waitFor(() => expect(mocks.confirmarEntrega).toHaveBeenCalledWith(2))
    expect(await screen.findByText('Pedido #3')).toBeTruthy()
  })

  it('requiere un motivo válido antes de cancelar una orden en camino', async () => {
    render(<Seguimiento />)
    await screen.findByText('Esperando envío (1)')
    fireEvent.click(screen.getByText('En camino (1)'))
    fireEvent.click(screen.getByText('Cancelar pedido'))

    const dialog = screen.getByRole('dialog')
    const confirmButton = within(dialog).getByRole('button', { name: 'Confirmar cancelación' })
    expect(confirmButton.disabled).toBe(true)
    fireEvent.change(within(dialog).getByPlaceholderText('Motivo de cancelación'), {
      target: { value: 'Ya no necesito este pedido' },
    })
    fireEvent.click(confirmButton)

    await waitFor(() => expect(mocks.cancelOrder).toHaveBeenCalledWith(2, 'Ya no necesito este pedido'))
    expect(await screen.findByText('Pedido #1')).toBeTruthy()
  })

  it('valida el ticket antes de crearlo y filtra el historial por estado', async () => {
    render(<SoporteTecnico />)
    await waitFor(() => expect(mocks.getSoporte).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByText('Enviar'))
    expect(mocks.alert).toHaveBeenCalledWith('Falta información', 'Escribe un asunto y una descripción para continuar.')

    fireEvent.change(screen.getByPlaceholderText('Ej: No puedo pagar'), { target: { value: 'Problema de pago' } })
    fireEvent.change(screen.getByPlaceholderText('Describe el problema...'), { target: { value: 'Falla al completar el pago.' } })
    fireEvent.click(screen.getByText('Problema al pagar'))
    fireEvent.click(screen.getByText('Enviar'))

    await waitFor(() => expect(mocks.crearSoporte).toHaveBeenCalledWith({
      asunto: 'Problema de pago',
      descripcion: 'Falla al completar el pago.',
      categoria: 'Problema al pagar',
    }))
    expect(mocks.alert).toHaveBeenCalledWith('Listo', 'Ticket enviado al soporte técnico.')
    fireEvent.click(screen.getByText('Mis tickets'))
    expect(await screen.findByText('Pago sin respuesta')).toBeTruthy()
    fireEvent.click(screen.getByText('Resuelto (1)'))
    expect(screen.getByText('Cuenta recuperada')).toBeTruthy()
    expect(screen.queryByText('Pago sin respuesta')).toBeNull()
  })

  it('confirma cambios y cancelación de plan con refresco del estado', async () => {
    let activeSubscription = null
    mocks.getMiSuscripcionHerramientas.mockImplementation(() => Promise.resolve({
      data: activeSubscription
        ? { activa: true, suscripcion: activeSubscription }
        : { activa: false },
    }))
    mocks.suscribirPlanHerramientas.mockImplementation((payload) => {
      expect(payload).toMatchObject({
        id_plan: 2,
        metodo_pago: 'Simulación de Pago',
        monto_pagado: 29000,
      })
      expect(payload.fecha_inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(payload.fecha_fin).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      activeSubscription = { ...payload, id_plan: 2, nombre_plan: 'Profesional' }
      return Promise.resolve({})
    })
    mocks.cancelarSuscripcionHerramientas.mockImplementation(() => {
      activeSubscription = null
      return Promise.resolve({})
    })
    render(
      <AuthContext.Provider value={authValue}>
        <SuscripcionesVendedor navigation={{ navigate: mocks.navigate }} />
      </AuthContext.Provider>,
    )
    expect(await screen.findByText('Profesional')).toBeTruthy()
    fireEvent.click(screen.getByText('Cambiar a este plan'))
    fireEvent.click(screen.getByText('Confirmar cambio'))
    expect(await screen.findByText('Suscripción actualizada')).toBeTruthy()
    expect(mocks.suscribirPlanHerramientas).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByText('Entendido'))
    fireEvent.click(screen.getByText('Cancelar suscripción'))
    fireEvent.click(screen.getByText('Sí, cancelar'))
    expect(await screen.findByText('Suscripción cancelada')).toBeTruthy()
    expect(mocks.cancelarSuscripcionHerramientas).toHaveBeenCalledOnce()
  })

  it('presenta ventas, alertas, productos y permite navegar a los pedidos', async () => {
    render(
      <AuthContext.Provider value={authValue}>
        <VendedorHome navigation={{ navigate: mocks.navigate }} />
      </AuthContext.Provider>,
    )
    expect(await screen.findByText('Librería Central')).toBeTruthy()
    expect(screen.getByText('Ventas del mes')).toBeTruthy()
    expect(screen.getByText('1 libro con stock bajo')).toBeTruthy()
    expect(screen.getAllByText('Libro destacado').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('Ana Compradora'))
    expect(mocks.navigate).toHaveBeenCalledWith('PedidosVendedor')
    expect(mocks.recargarSalas).toHaveBeenCalled()
  })
})
