// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Chat from '../../screens/Chat'
import { AuthContext } from '../../context/AuthContext'
import {
  enviarMensajeChat,
  getChatHistory,
  marcarSalaLeida,
} from '../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  multiGet: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn(),
  route: { params: { id_sala: 12, nombre_comprador: 'Ana', telefono_contacto: '3001234567' } },
  navigation: { goBack: vi.fn(), navigate: vi.fn(), setOptions: vi.fn() },
  subscribe: null,
  sendBySocket: vi.fn(),
  markLocalRead: vi.fn(),
  getHistory: vi.fn(),
  markRead: vi.fn(),
  sendMessage: vi.fn(),
  clearChat: vi.fn(),
  deleteChat: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onLongPress,
    onChangeText,
    value,
    placeholder,
    accessibilityLabel,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        onContextMenu: onLongPress,
        'aria-label': accessibilityLabel,
      }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  const renderPart = (part) => ReactModule.isValidElement(part)
    ? part
    : typeof part === 'function' ? ReactModule.createElement(part) : part
  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Cargando'),
    Alert: { alert: mocks.alert },
    FlatList: ReactModule.forwardRef(({ data = [], renderItem, ListEmptyComponent }, ref) => (
      ReactModule.createElement('div', {
        ref: (node) => {
          if (node) {
            node.scrollToEnd = vi.fn()
            node.scrollToIndex = vi.fn()
          }
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        },
      }, data.length
        ? data.map((item, index) => ReactModule.createElement(
          ReactModule.Fragment,
          { key: index },
          renderItem({ item, index }),
        ))
        : renderPart(ListEmptyComponent))
    )),
    Image: element('img'),
    KeyboardAvoidingView: element('div'),
    Linking: { openURL: vi.fn() },
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' }, children)
      : null,
    Platform: { OS: 'web', select: (options) => options.web || options.default },
    ScrollView: element('div'),
    SectionList: () => null,
    Share: { share: vi.fn().mockResolvedValue({}) },
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})
vi.mock('@react-navigation/native', () => ({
  useRoute: () => mocks.route,
  useNavigation: () => mocks.navigation,
}))
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    multiGet: mocks.multiGet,
    getItem: mocks.getItem,
    setItem: mocks.setItem,
  },
}))
vi.mock('expo-av', () => ({
  Audio: { Recording: class {}, Sound: { createAsync: vi.fn() } },
}))
vi.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  documentDirectory: '/docs/',
  downloadAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
}))
vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn(),
  requestCameraPermissionsAsync: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
}))
vi.mock('expo-document-picker', () => ({ getDocumentAsync: vi.fn() }))
vi.mock('expo-clipboard', () => ({ setStringAsync: vi.fn() }))
vi.mock('react-native-svg', () => {
  const Shape = () => null
  return { default: Shape, Path: Shape, Circle: Shape, Rect: Shape, Polygon: Shape, SvgUri: Shape }
})
vi.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }) => <div>{children}</div> }))
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { AuthContext: ReactModule.createContext({}) }
})
vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({ darkMode: false, colors: { page: '#fff' } }),
  useThemedStyles: (styles) => styles,
}))
vi.mock('../../context/ChatSocketContext', () => ({
  useChatSocket: () => ({
    conectado: false,
    suscribirseAMensajes: (callback) => {
      mocks.subscribe = callback
      return vi.fn()
    },
    enviarPorSocket: mocks.sendBySocket,
    marcarSalaLeidaLocal: mocks.markLocalRead,
  }),
}))
vi.mock('../../services/api', () => ({
  getChatHistory: mocks.getHistory,
  marcarSalaLeida: mocks.markRead,
  enviarMensajeChat: mocks.sendMessage,
  vaciarSalaChat: mocks.clearChat,
  eliminarSalaChat: mocks.deleteChat,
}))
vi.mock('../../data/chatEmojiData', () => ({
  EMOJI_CATEGORIES: [{ id: 'smileys', name: 'Caritas', emojis: ['😀', '❤️'] }],
  GIF_OPTIONS: [],
  STICKER_OPTIONS: [],
}))

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.multiGet.mockResolvedValue([[null, null], [null, null]])
  mocks.getItem.mockResolvedValue(null)
  mocks.setItem.mockResolvedValue(undefined)
  mocks.getHistory.mockResolvedValue({
    data: {
      mensajes: [
        { id_mensaje: 1, id_remitente: 3, nombre_remitente: 'Librería Sol', mensaje: 'Hola Ana', enviado_en: '2026-03-20T12:00:00' },
        { id_mensaje: 2, id_remitente: 3, nombre_remitente: 'Librería Sol', mensaje: 'Tu pedido está listo', enviado_en: '2026-03-20T12:01:00' },
      ],
    },
  })
  mocks.markRead.mockResolvedValue({})
  mocks.sendMessage.mockResolvedValue({ data: {} })
  mocks.sendBySocket.mockReturnValue(true)
})

const withAuth = (ui) => (
  <AuthContext.Provider value={{ user: { sub: '11', rol: 'comprador' } }}>{ui}</AuthContext.Provider>
)

describe('Chat móvil', () => {
  it('carga historial, busca mensajes y envía por socket', async () => {
    render(withAuth(<Chat />))
    expect(await screen.findByText('Tu pedido está listo')).toBeTruthy()
    expect(mocks.getHistory).toHaveBeenCalledWith(12)
    expect(mocks.markLocalRead).toHaveBeenCalledWith(12)
    expect(mocks.markRead).toHaveBeenCalledWith(12)

    fireEvent.click(screen.getAllByRole('button')[3])
    fireEvent.change(screen.getByPlaceholderText('Buscar en esta conversación...'), {
      target: { value: 'pedido' },
    })
    expect(screen.getByText('Encontrado')).toBeTruthy()

    const composer = screen.getByPlaceholderText('Escribe un mensaje')
    fireEvent.change(composer, { target: { value: '  Gracias ' } })
    fireEvent.click(composer.parentElement.querySelectorAll('button')[2])
    expect(mocks.sendBySocket).toHaveBeenCalledWith(12, 'Gracias')
    expect(enviarMensajeChat).not.toHaveBeenCalled()
  })

  it('usa la API si el socket falla y persiste las preferencias del chat', async () => {
    mocks.sendBySocket.mockReturnValue(false)
    render(withAuth(<Chat />))
    expect(await screen.findByText('Hola Ana')).toBeTruthy()

    const composer = screen.getByPlaceholderText('Escribe un mensaje')
    fireEvent.change(composer, { target: { value: 'Mensaje REST' } })
    fireEvent.click(composer.parentElement.querySelectorAll('button')[2])
    await waitFor(() => expect(enviarMensajeChat).toHaveBeenCalledWith({
      id_sala: 12,
      mensaje: 'Mensaje REST',
    }))

    fireEvent.click(screen.getAllByRole('button')[4])
    fireEvent.click(screen.getByText('Silenciar notificaciones'))
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('chat_silenciado_12', '1'))
    fireEvent.click(screen.getAllByRole('button')[4])
    fireEvent.click(screen.getByText('Mensajes temporales'))
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('chat_temporales_12', '1'))
  })
})
