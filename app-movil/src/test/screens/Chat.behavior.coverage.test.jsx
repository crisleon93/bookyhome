// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  audioPlayer: {
    replace: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
  },
  audioRecorder: {
    prepareToRecordAsync: vi.fn().mockResolvedValue(undefined),
    record: vi.fn(function () {
      this.isRecording = true
    }),
    stop: vi.fn().mockResolvedValue(undefined),
    isRecording: false,
    uri: 'file:///recording.m4a',
  },
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onLongPress,
    onPressIn,
    onPressOut,
    onChangeText,
    value,
    placeholder,
    accessibilityLabel,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: (event) => {
          event.stopPropagation()
          onPress?.()
        },
        onMouseDown: onPressIn,
        onMouseUp: onPressOut,
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
    SectionList: ({ sections = [], renderItem, renderSectionHeader }) => (
      ReactModule.createElement('div', null, sections.map((section) => ReactModule.createElement(
        ReactModule.Fragment,
        { key: section.id },
        renderSectionHeader?.({ section }),
        section.data.map((item, index) => renderItem({ item, index, section })),
      )))
    ),
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
  Audio: {
    Recording: class {},
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
    requestPermissionsAsync: vi.fn(),
    setAudioModeAsync: vi.fn(),
    Sound: { createAsync: vi.fn() },
  },
}))
vi.mock('expo-audio', () => ({
  AudioModule: {
    requestRecordingPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  },
  RecordingPresets: { HIGH_QUALITY: {} },
  setAudioModeAsync: vi.fn(),
  useAudioPlayer: vi.fn(() => mocks.audioPlayer),
  useAudioPlayerStatus: vi.fn(() => ({ playing: false })),
  useAudioRecorder: vi.fn(() => mocks.audioRecorder),
}))
vi.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  documentDirectory: '/docs/',
  downloadAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
}))
vi.mock('expo-image-picker', () => ({
  launchCameraAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  requestCameraPermissionsAsync: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
}))
vi.mock('expo-document-picker', () => ({ getDocumentAsync: vi.fn() }))
vi.mock('expo-clipboard', () => ({ setStringAsync: vi.fn() }))
vi.mock('react-native-svg', () => {
  const Shape = () => null
  const SvgUri = ({ uri }) => React.createElement('span', null, uri?.split('/').pop())
  return { default: Shape, Path: Shape, Circle: Shape, Rect: Shape, Polygon: Shape, SvgUri }
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
  EMOJI_CATEGORIES: [{ id: 'smileys', name: 'Caritas', icon: '😄', emojis: ['😀', '❤️'] }],
  GIF_OPTIONS: [{ id: 'gif-1', title: 'Celebration', url: 'https://example.test/celebration.gif' }],
  STICKER_OPTIONS: [{ id: 'sticker-1', label: 'Thumbs up', emoji: '👍', url: 'https://example.test/thumb.svg' }],
}))

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.audioRecorder.isRecording = false
  mocks.audioRecorder.uri = 'file:///recording.m4a'
  mocks.audioRecorder.prepareToRecordAsync.mockResolvedValue(undefined)
  mocks.audioRecorder.stop.mockResolvedValue(undefined)
  mocks.audioRecorder.record.mockImplementation(() => {
    mocks.audioRecorder.isRecording = true
  })
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
    await waitFor(() => expect(mocks.subscribe).toBeTypeOf('function'))
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

  it('agrega una sola vez los mensajes entrantes de la sala desde el socket', async () => {
    render(withAuth(<Chat />))
    expect(await screen.findByText('Tu pedido está listo')).toBeTruthy()
    const incoming = {
      tipo: 'nuevo_mensaje',
      mensaje: {
        id_sala: 12,
        id_mensaje: 3,
        id_remitente: 3,
        nombre_remitente: 'Librería Sol',
        mensaje: 'Actualización del pedido',
        enviado_en: '2026-03-20T12:02:00',
      },
    }

    act(() => {
      mocks.subscribe(incoming)
      mocks.subscribe(incoming)
    })

    await waitFor(() => expect(screen.getAllByText('Actualización del pedido')).toHaveLength(1))
    expect(mocks.markLocalRead).toHaveBeenCalledWith(12)
  })

  it('informa si falla la operación de vaciar el historial', async () => {
    mocks.clearChat.mockRejectedValue(new Error('offline'))
    render(withAuth(<Chat />))
    expect(await screen.findByText('Tu pedido está listo')).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button')[4])
    fireEvent.click(screen.getByText('Vaciar chat'))

    await waitFor(() => expect(mocks.clearChat).toHaveBeenCalledWith(12))
    expect(mocks.alert).toHaveBeenCalledWith('No se pudo vaciar', 'Inténtalo de nuevo.')
    expect(screen.getByText('Tu pedido está listo')).toBeTruthy()
  })

  it('reacciona, copia, responde y elimina un mensaje propio', async () => {
    mocks.getHistory.mockResolvedValue({
      data: {
        mensajes: [{
          id_mensaje: 41,
          id_remitente: 11,
          mensaje: 'Mensaje propio',
          enviado_en: '2026-03-20T12:00:00',
        }],
      },
    })
    const { setStringAsync } = await import('expo-clipboard')
    render(withAuth(<Chat />))
    await screen.findByText('Mensaje propio')

    fireEvent.click(screen.getByLabelText('Reaccionar al mensaje'))
    fireEvent.click(screen.getByText('❤️'))
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'chat_reacciones_12',
        JSON.stringify({ 41: ['❤️'] }),
      )
    })

    fireEvent.click(screen.getByLabelText('Reaccionar al mensaje'))
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(setStringAsync).toHaveBeenCalledWith('Mensaje propio')

    fireEvent.click(screen.getByLabelText('Reaccionar al mensaje'))
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))
    expect(screen.getByPlaceholderText('Escribe un mensaje').value).toBe('Mensaje propio')

    fireEvent.click(screen.getByLabelText('Reaccionar al mensaje'))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar para mí' }))
    expect(screen.queryByText('Mensaje propio')).toBeNull()
  })

  it('persiste el bloqueo y comunica las opciones de adjuntos no compatibles', async () => {
    const imagePicker = await import('expo-image-picker')
    imagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false })
    render(withAuth(<Chat />))
    await screen.findByText('Tu pedido está listo')

    fireEvent.click(screen.getAllByRole('button')[4])
    fireEvent.click(screen.getByText('Bloquear'))
    const confirm = mocks.alert.mock.lastCall[2].find((option) => option.text === 'Confirmar')
    await act(async () => confirm.onPress())
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('chat_bloqueado_12', '1')

    const composer = screen.getByPlaceholderText('Escribe un mensaje')
    fireEvent.click(composer.parentElement.querySelectorAll('button')[0])
    fireEvent.click(screen.getByText('Contacto'))
    expect(mocks.alert).toHaveBeenCalledWith('Contacto', 'Tarjeta de contacto compartida.')

    fireEvent.click(composer.parentElement.querySelectorAll('button')[0])
    fireEvent.click(screen.getByText('Fotos y videos'))
    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith(
        'Permiso de galería',
        'Activa el acceso a tus fotos para adjuntar una imagen.',
      )
    })
  })

  it('reproduce, pausa y maneja el fin de una nota de voz', async () => {
    mocks.audioPlayer.replace.mockReset()
    mocks.audioPlayer.play.mockReset()
    mocks.audioPlayer.pause.mockReset()
    mocks.getHistory.mockResolvedValue({
      data: {
        mensajes: [{
          id_mensaje: 51,
          id_remitente: 3,
          nombre_remitente: 'Librería Sol',
          mensaje: `[AUDIO]${JSON.stringify({ url: 'https://example.test/audio.mp4', duracion: '0:07' })}`,
          enviado_en: '2026-03-20T12:00:00',
        }],
      },
    })
    render(withAuth(<Chat />))
    const duration = await screen.findByText('0:07')

    fireEvent.click(duration)
    await waitFor(() => expect(mocks.audioPlayer.replace).toHaveBeenCalledWith({
      uri: 'https://example.test/audio.mp4',
    }))
    expect(mocks.audioPlayer.play).toHaveBeenCalled()
    fireEvent.click(screen.getByText('0:07'))
    await waitFor(() => expect(mocks.audioPlayer.pause).toHaveBeenCalledOnce())
  })

  it('filtra emojis, GIF y stickers y envía el medio seleccionado', async () => {
    render(withAuth(<Chat />))
    await screen.findByText('Tu pedido está listo')
    const composer = screen.getByPlaceholderText('Escribe un mensaje')
    const buttons = composer.parentElement.querySelectorAll('button')

    fireEvent.click(buttons[1])
    fireEvent.change(screen.getByPlaceholderText('Buscar emoji'), { target: { value: '😀' } })
    expect(screen.getByText('1f600.svg')).toBeTruthy()
    fireEvent.click(screen.getByText('GIF'))
    fireEvent.change(screen.getByPlaceholderText('Buscar GIF...'), { target: { value: 'no existe' } })
    expect(screen.queryByText('Celebration')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('Buscar GIF...'), { target: { value: '' } })
    fireEvent.click(screen.getByText('Celebration'))
    await waitFor(() => expect(mocks.sendMessage).toHaveBeenCalledWith({
      id_sala: 12,
      mensaje: expect.stringContaining('"nombre":"Celebration"'),
    }))

    fireEvent.click(buttons[1])
    fireEvent.click(screen.getByLabelText('Stickers'))
    fireEvent.click(screen.getByText('Thumbs up'))
    await waitFor(() => expect(mocks.sendMessage).toHaveBeenLastCalledWith({
      id_sala: 12,
      mensaje: expect.stringContaining('"tipo":"image/svg+xml"'),
    }))
  })

  it('adjunta documentos, audio, imágenes y fotos tomadas con cámara', async () => {
    const picker = await import('expo-image-picker')
    const documents = await import('expo-document-picker')
    const fileSystem = await import('expo-file-system/legacy')
    documents.getDocumentAsync
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///manual.pdf', name: 'manual.pdf', mimeType: 'application/pdf' }],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///voice.mp3', name: 'voice.mp3', mimeType: 'audio/mpeg' }],
      })
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true })
    picker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cover.png', fileName: 'cover.png', mimeType: 'image/png', base64: 'cG5n' }],
    })
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true })
    picker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///camera.jpg', mimeType: 'image/jpeg', base64: 'anBn' }],
    })
    fileSystem.readAsStringAsync.mockResolvedValue('YmluYXJ5')
    render(withAuth(<Chat />))
    await screen.findByText('Tu pedido está listo')
    const composer = screen.getByPlaceholderText('Escribe un mensaje')
    const openAttachments = () => fireEvent.click(composer.parentElement.querySelectorAll('button')[0])

    openAttachments()
    fireEvent.click(screen.getByText('Documento'))
    await waitFor(() => expect(mocks.sendMessage).toHaveBeenLastCalledWith({
      id_sala: 12,
      mensaje: expect.stringContaining('"nombre":"manual.pdf"'),
    }))

    openAttachments()
    fireEvent.click(screen.getByText('Audio'))
    await waitFor(() => expect(mocks.sendMessage).toHaveBeenLastCalledWith({
      id_sala: 12,
      mensaje: expect.stringContaining('"duracion":"Audio adjunto"'),
    }))

    openAttachments()
    fireEvent.click(screen.getByText('Fotos y videos'))
    await waitFor(() => expect(mocks.sendMessage).toHaveBeenLastCalledWith({
      id_sala: 12,
      mensaje: expect.stringContaining('"url":"data:image/png;base64,cG5n"'),
    }))

    openAttachments()
    fireEvent.click(screen.getByText('Cámara'))
    await waitFor(() => expect(mocks.sendMessage).toHaveBeenLastCalledWith({
      id_sala: 12,
      mensaje: expect.stringContaining('"nombre":"foto.jpg"'),
    }))
  })

  it('graba una nota de voz y la envía como contenido codificado', async () => {
    const fileSystem = await import('expo-file-system/legacy')
    fileSystem.readAsStringAsync.mockResolvedValue('YXVkaW8=')
    render(withAuth(<Chat />))
    await screen.findByText('Tu pedido está listo')
    const microphone = screen.getByPlaceholderText('Escribe un mensaje').parentElement.querySelectorAll('button')[2]

    fireEvent.mouseDown(microphone)
    await waitFor(() => expect(mocks.audioRecorder.record).toHaveBeenCalledOnce())
    fireEvent.mouseUp(microphone)

    await waitFor(() => expect(mocks.sendMessage).toHaveBeenCalledWith({
      id_sala: 12,
      mensaje: expect.stringContaining('"duracion":"0:01"'),
    }))
    expect(fileSystem.readAsStringAsync).toHaveBeenCalledWith(
      'file:///recording.m4a',
      { encoding: 'base64' },
    )
  })

  it('permite administrar favoritos, exportar y eliminar la conversación', async () => {
    const { Linking, Share } = await import('react-native')
    render(withAuth(<Chat />))
    await screen.findByText('Tu pedido está listo')

    fireEvent.click(screen.getAllByRole('button')[1])
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('videollamada') }))
    fireEvent.click(screen.getAllByRole('button')[2])
    expect(Linking.openURL).toHaveBeenCalledWith('tel:3001234567')

    const openMenu = async (itemText) => {
      fireEvent.click(screen.getAllByRole('button')[4])
      await screen.findByText(itemText)
    }
    await openMenu('Añadir a Favoritos')
    fireEvent.click(screen.getByText('Añadir a Favoritos'))
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('chat_favorito_12', '1'))
    await waitFor(() => expect(screen.queryByText('Añadir a Favoritos')).toBeNull())
    await openMenu('Añadir a la lista')
    fireEvent.click(screen.getByText('Añadir a la lista'))
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('chat_lista_12', '1'))
    await waitFor(() => expect(screen.queryByText('Añadir a la lista')).toBeNull())
    await openMenu('Exportar chat')
    fireEvent.click(screen.getByText('Exportar chat'))
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Hola Ana') }))

    await openMenu('Eliminar chat')
    fireEvent.click(screen.getByText('Eliminar chat'))
    const confirmation = mocks.alert.mock.lastCall[2].find((option) => option.text === 'Eliminar')
    await act(async () => confirmation.onPress())
    expect(mocks.deleteChat).toHaveBeenCalledWith(12)
    expect(mocks.navigation.goBack).toHaveBeenCalledOnce()
  })
})
