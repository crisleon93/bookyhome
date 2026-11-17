// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import QuejasReclamos from '../../screens/QuejasReclamos'
import { AuthContext } from '../../context/AuthContext'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  cancelarQueja: vi.fn(),
  crearQueja: vi.fn(),
  enviarMensajeReclamo: vi.fn(),
  getMensajesReclamo: vi.fn(),
  getOrdenes: vi.fn(),
  getQuejas: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
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
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        'aria-selected': accessibilityState?.selected,
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
    if (tag === 'img') {
      return ReactModule.createElement('img', { src: props.source?.uri, alt: accessibilityLabel || '' })
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  return {
    ActivityIndicator: element('span'),
    Alert: { alert: mocks.alert },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Image: element('img'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' }, children)
      : null,
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles, flatten: (style) => style },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})

vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div>{children}</div>,
}))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../components/SidebarMenu', () => ({ default: () => null }))
vi.mock('../../components/SidebarVendedor', () => ({ default: () => null }))
vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: (styles) => styles,
}))
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { AuthContext: ReactModule.createContext({ user: null, signOut: vi.fn() }) }
})
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div>{children}</div>,
}))
vi.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'images' },
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconCheck: Icon,
    IconChevronRight: Icon,
    IconEye: Icon,
    IconMessage: Icon,
    IconStoreAlt: Icon,
  }
})
vi.mock('../../services/api', () => ({
  getOrdenes: mocks.getOrdenes,
  getQuejas: mocks.getQuejas,
  crearQueja: mocks.crearQueja,
  cancelarQueja: mocks.cancelarQueja,
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  getMensajesReclamo: mocks.getMensajesReclamo,
  enviarMensajeReclamo: mocks.enviarMensajeReclamo,
}))

const order = {
  id_orden: 10,
  estado: 'pagado',
  total: 25000,
  items: [{ titulo: 'Libro comprado', nombre_tienda: 'Libreria Central' }],
}

const complaint = {
  id_solicitud: 20,
  id_orden: 10,
  numero: 20,
  estado: 'Abierto',
  asunto: 'Libro dañado',
  descripcion: 'La portada llegó dañada',
  fecha_solicitud: '2026-11-10T10:00:00',
  titulo_libro: 'Libro comprado',
  nombre_tienda: 'Libreria Central',
}

const authValue = { user: { id_usuario: 3, rol: 'comprador' }, signOut: vi.fn() }
const renderScreen = () => render(
  <AuthContext.Provider value={authValue}>
    <QuejasReclamos navigation={{ navigate: vi.fn() }} />
  </AuthContext.Provider>,
)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getOrdenes.mockResolvedValue({ data: [order] })
  mocks.getQuejas.mockResolvedValue({ data: [] })
  mocks.crearQueja.mockResolvedValue({ data: { ok: true } })
  mocks.getMensajesReclamo.mockResolvedValue({ data: [] })
  mocks.enviarMensajeReclamo.mockResolvedValue({ data: { ok: true } })
  mocks.cancelarQueja.mockResolvedValue({ data: { ok: true } })
})

afterEach(cleanup)

describe('Quejas y reclamos móvil', () => {
  it('valida la compra y el motivo antes de enviar una queja', async () => {
    renderScreen()
    await screen.findByText('Selecciona una compra...')

    fireEvent.click(screen.getByText('Enviar'))
    expect(mocks.alert).toHaveBeenCalledWith('Incompleto', 'Selecciona una compra y un motivo.')

    fireEvent.click(screen.getByText('Selecciona una compra...'))
    const orderDialog = screen.getByRole('dialog')
    fireEvent.click(within(orderDialog).getByText('Libro comprado'))
    fireEvent.click(screen.getByText('Selecciona un motivo'))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Otro'))
    fireEvent.change(screen.getByPlaceholderText('Especifica el motivo...'), {
      target: { value: '  ' },
    })
    fireEvent.click(screen.getByText('Enviar'))
    expect(mocks.alert).toHaveBeenLastCalledWith(
      'Incompleto', 'Por favor especifica el motivo del reclamo.',
    )
    expect(mocks.crearQueja).not.toHaveBeenCalled()
  })

  it('envía el reclamo, carga el chat y filtra el historial', async () => {
    mocks.getQuejas
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [complaint] })
    renderScreen()
    await screen.findByText('Selecciona una compra...')

    fireEvent.click(screen.getByText('Selecciona una compra...'))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Libro comprado'))
    fireEvent.click(screen.getByText('Selecciona un motivo'))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Libro dañado o defectuoso'))
    fireEvent.change(screen.getByPlaceholderText('Describe el problema...'), {
      target: { value: '  La portada está rota.  ' },
    })
    fireEvent.click(screen.getByText('Enviar'))

    await waitFor(() => expect(mocks.crearQueja).toHaveBeenCalledOnce())
    const formData = mocks.crearQueja.mock.calls[0][0]
    expect(formData.get('id_orden')).toBe('10')
    expect(formData.get('descripcion')).toBe('La portada está rota.')
    await screen.findByText('Solicitud enviada. El administrador revisará tu caso.')

    fireEvent.click(screen.getByRole('tab', { name: 'Mis quejas y reclamos' }))
    expect(await screen.findByText('Libro dañado')).toBeTruthy()
    fireEvent.click(screen.getByText('Chat'))
    await screen.findByText('Sin mensajes aún')
    fireEvent.change(screen.getByPlaceholderText('Escribe...'), {
      target: { value: '  Hola, ¿hay novedades?  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    await waitFor(() => expect(mocks.enviarMensajeReclamo).toHaveBeenCalledWith(
      20, 'Hola, ¿hay novedades?',
    ))
  })
})
