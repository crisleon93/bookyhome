// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import QuejasReclamos from '../../screens/QuejasReclamos'
import { AuthContext } from '../../context/AuthContext'
import * as ImagePicker from 'expo-image-picker'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  cancelarQueja: vi.fn(),
  crearQueja: vi.fn(),
  enviarMensajeReclamo: vi.fn(),
  getMensajesReclamo: vi.fn(),
  getOrdenes: vi.fn(),
  getQuejas: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
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
  requestMediaLibraryPermissionsAsync: mocks.requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync: mocks.launchImageLibraryAsync,
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
  mocks.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true })
  mocks.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] })
})

afterEach(cleanup)

describe('Quejas y reclamos móvil', () => {
  it('valida la compra y el motivo antes de enviar una queja', async () => {
    renderScreen()
    await screen.findByText('Selecciona una compra...')

    fireEvent.click(screen.getByText('Selecciona una compra...'))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Cancelar'))
    fireEvent.click(screen.getByText('Selecciona un motivo'))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Cancelar'))
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
    mocks.getMensajesReclamo.mockResolvedValueOnce({ data: [
      { id_mensaje: 1, rol: 'comprador', mensaje: 'Hola', fecha_creacion: new Date().toISOString() },
      { id_mensaje: 2, rol: 'admin', mensaje: 'Te ayudaremos', creado_en: new Date().toISOString() },
      { id_mensaje: 3, rol: 'vendedor', mensaje: 'Gracias' },
    ] })
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
    expect(await screen.findByText('Te ayudaremos')).toBeTruthy()
    expect(screen.getByText('Gracias')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Escribe...'), {
      target: { value: '  Hola, ¿hay novedades?  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    await waitFor(() => expect(mocks.enviarMensajeReclamo).toHaveBeenCalledWith(
      20, 'Hola, ¿hay novedades?',
    ))
    fireEvent.click(screen.getByText('Ocultar chat'))
  })

  it('adjunta evidencia, valida permisos y presenta fallos al enviar un reclamo', async () => {
    renderScreen()
    await screen.findByText('Selecciona una compra...')
    mocks.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false })
    fireEvent.click(screen.getByText('Elegir'))
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith(
      'Permiso requerido',
      'Se necesita acceso a tus fotos para adjuntar evidencia.',
    ))

    mocks.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://foto.jpg', fileName: 'evidencia.jpg', mimeType: 'image/jpeg' }],
    })
    fireEvent.click(screen.getByText('Elegir'))
    await screen.findByText('evidencia.jpg')
    fireEvent.click(screen.getByText('Selecciona una compra...'))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Libro comprado'))
    fireEvent.click(screen.getByText('Selecciona un motivo'))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Libro dañado o defectuoso'))
    mocks.crearQueja.mockRejectedValueOnce({ response: { data: { detail: 'No se pudo enviar' } } })
    fireEvent.click(screen.getByText('Enviar'))
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo enviar'))
    expect(screen.getByText('No se pudo enviar')).toBeTruthy()
    expect(mocks.crearQueja).toHaveBeenCalledOnce()
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({
      allowsEditing: true,
      quality: 0.8,
    }))
  })

  it('recupera errores de carga, conversación y cancelación de reclamo', async () => {
    mocks.getOrdenes.mockRejectedValueOnce({ response: { data: { detail: 'Compras sin conexión' } } })
    renderScreen()
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'Compras sin conexión'))
    cleanup()

    mocks.getQuejas.mockResolvedValueOnce({ data: [complaint] })
    mocks.getMensajesReclamo.mockRejectedValueOnce({ response: { data: { detail: 'Chat no disponible' } } })
    mocks.enviarMensajeReclamo.mockRejectedValueOnce({ response: { data: { detail: 'Mensaje rechazado' } } })
    renderScreen()
    fireEvent.click(await screen.findByRole('tab', { name: 'Mis quejas y reclamos' }))
    fireEvent.click(await screen.findByText('Chat'))
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'Chat no disponible'))
    fireEvent.change(screen.getByPlaceholderText('Escribe...'), { target: { value: 'Hola' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'Mensaje rechazado'))

    fireEvent.click(screen.getAllByText(/Cancelar/)[0])
    const cancelAction = mocks.alert.mock.calls[mocks.alert.mock.calls.length - 1][2][1]
    mocks.cancelarQueja.mockRejectedValueOnce({ response: { data: { detail: 'No se pudo cancelar' } } })
    await act(async () => cancelAction.onPress())
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo cancelar'))
  })

  it('pagina reclamos, ajusta el tamaño de página, abre evidencia y cancela una solicitud', async () => {
    const complaints = Array.from({ length: 6 }, (_, index) => ({
      ...complaint,
      id_solicitud: 20 + index,
      numero: 20 + index,
      asunto: `Queja ${index + 1}`,
      fecha_solicitud: index === 0
        ? new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
        : complaint.fecha_solicitud,
      evidencia_url: index === 0 ? '/evidencia.jpg' : undefined,
    }))
    mocks.getQuejas.mockResolvedValue({ data: complaints })
    renderScreen()
    fireEvent.click(await screen.findByRole('tab', { name: 'Mis quejas y reclamos' }))
    expect(await screen.findByText('Queja 1')).toBeTruthy()
    expect(screen.getByText(/hace 1 mes/)).toBeTruthy()
    expect(screen.queryByText('Queja 6')).toBeNull()

    fireEvent.click(screen.getByText('›'))
    expect(await screen.findByText('Queja 6')).toBeTruthy()
    fireEvent.click(screen.getByText('‹'))
    expect(await screen.findByText('Queja 1')).toBeTruthy()
    fireEvent.click(screen.getByText('›'))
    fireEvent.click(screen.getByRole('button', { name: 'Solicitudes por página: 5' }))
    fireEvent.click(screen.getByText('10'))
    expect(screen.getByText('Queja 1')).toBeTruthy()
    expect(screen.getByText('Queja 6')).toBeTruthy()

    fireEvent.click(screen.getByText('Ver evidencia'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button')[0])
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByText('Ver evidencia'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByText('Cerrar'))
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getAllByText(/Cancelar/)[0])
    const cancelAction = mocks.alert.mock.calls[mocks.alert.mock.calls.length - 1][2][1]
    await act(async () => cancelAction.onPress())
    await waitFor(() => expect(mocks.cancelarQueja).toHaveBeenCalledWith(20))
  })
})
