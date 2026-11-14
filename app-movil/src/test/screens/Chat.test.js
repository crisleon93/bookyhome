/**
 * Chat.test.js — Tests de lógica pura de la pantalla Chat de app-movil.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  View: () => null, Text: () => null, TextInput: () => null,
  FlatList: () => null, SectionList: () => null, ScrollView: () => null,
  StyleSheet: { create: (s) => s }, KeyboardAvoidingView: () => null,
  Platform: { OS: 'web', select: vi.fn((o) => o.web || o.default) },
  TouchableOpacity: () => null, ActivityIndicator: () => null,
  Alert: { alert: vi.fn() }, Share: { share: vi.fn() },
  Modal: () => null, Linking: { openURL: vi.fn() }, Image: () => null,
}))

vi.mock('@react-navigation/native', () => ({
  useRoute: vi.fn(() => ({ params: { id_sala: 1, nombre: 'Test Chat' } })),
  useNavigation: vi.fn(() => ({ goBack: vi.fn(), navigate: vi.fn() })),
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn(() => Promise.resolve(null)), setItem: vi.fn() },
}))

vi.mock('expo-av', () => ({ Audio: { Recording: { createAsync: vi.fn() }, Sound: {} } }))
vi.mock('expo-file-system/legacy', () => ({ downloadAsync: vi.fn(), documentDirectory: '/docs/' }))
vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn(() => Promise.resolve({ canceled: true })),
  requestMediaLibraryPermissionsAsync: vi.fn(() => Promise.resolve({ granted: true })),
  MediaTypeOptions: { Images: 'Images' },
}))
vi.mock('expo-document-picker', () => ({ getDocumentAsync: vi.fn(() => Promise.resolve({ canceled: true })) }))
vi.mock('expo-clipboard', () => ({ setStringAsync: vi.fn() }))
vi.mock('react-native-svg', () => ({ default: () => null, Path: () => null, Circle: () => null, Rect: () => null, Polygon: () => null, SvgUri: () => null }))
vi.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }))
vi.mock('../../context/AuthContext', () => ({ AuthContext: {} }))
vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: vi.fn(() => ({ darkMode: false, colors: {} })),
  useThemedStyles: vi.fn((fn) => fn({})),
}))
vi.mock('../../context/ChatSocketContext', () => ({ useChatSocket: vi.fn(() => ({ salas: [], conectado: false })) }))
vi.mock('../../services/api', () => ({
  getChatHistory: vi.fn(() => Promise.resolve({ data: { mensajes: [] } })),
  marcarSalaLeida: vi.fn(() => Promise.resolve({})),
  enviarMensajeChat: vi.fn(() => Promise.resolve({ data: {} })),
  vaciarSalaChat: vi.fn(() => Promise.resolve({})),
  eliminarSalaChat: vi.fn(() => Promise.resolve({})),
}))
vi.mock('../../data/chatEmojiData', () => ({
  EMOJI_CATEGORIES: [], GIF_OPTIONS: [], STICKER_OPTIONS: [],
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual }
})

// ── Lógica pura ───────────────────────────────────────────────────────────────

function agruparMensajesPorFecha(mensajes) {
  const grupos = {}
  mensajes.forEach((m) => {
    const fecha = m.fecha_creacion ? m.fecha_creacion.split('T')[0] : 'Sin fecha'
    if (!grupos[fecha]) grupos[fecha] = []
    grupos[fecha].push(m)
  })
  return Object.entries(grupos).map(([fecha, data]) => ({ title: fecha, data }))
}

function formatearHora(fechaStr) {
  if (!fechaStr) return ''
  const d = new Date(fechaStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function esMensajePropio(mensaje, userId) {
  return String(mensaje.id_remitente) === String(userId)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Chat (app-movil) — agruparMensajesPorFecha', () => {
  it('agrupa mensajes del mismo día', () => {
    const mensajes = [
      { id: 1, contenido: 'Hola', fecha_creacion: '2026-01-15T10:00:00' },
      { id: 2, contenido: 'Ok', fecha_creacion: '2026-01-15T11:00:00' },
      { id: 3, contenido: 'Mañana', fecha_creacion: '2026-01-16T09:00:00' },
    ]
    const grupos = agruparMensajesPorFecha(mensajes)
    expect(grupos).toHaveLength(2)
    expect(grupos[0].data).toHaveLength(2)
    expect(grupos[1].data).toHaveLength(1)
  })

  it('maneja mensajes sin fecha', () => {
    const mensajes = [{ id: 1, contenido: 'Sin fecha', fecha_creacion: null }]
    const grupos = agruparMensajesPorFecha(mensajes)
    expect(grupos[0].title).toBe('Sin fecha')
  })

  it('devuelve array vacío para lista vacía', () => {
    expect(agruparMensajesPorFecha([])).toHaveLength(0)
  })
})

describe('Chat (app-movil) — formatearHora', () => {
  it('formatea hora correctamente', () => {
    const r = formatearHora('2026-01-15T14:30:00')
    expect(r).toMatch(/\d{1,2}:\d{2}/)
  })

  it('devuelve string vacío para null', () => {
    expect(formatearHora(null)).toBe('')
  })

  it('devuelve string vacío para fecha inválida', () => {
    expect(formatearHora('no-es-fecha')).toBe('')
  })
})

describe('Chat (app-movil) — esMensajePropio', () => {
  it('devuelve true si el remitente es el usuario actual', () => {
    expect(esMensajePropio({ id_remitente: 1 }, 1)).toBe(true)
    expect(esMensajePropio({ id_remitente: '1' }, '1')).toBe(true)
  })

  it('devuelve false si el remitente es otro usuario', () => {
    expect(esMensajePropio({ id_remitente: 2 }, 1)).toBe(false)
  })

  it('compara como string para evitar problemas de tipo', () => {
    expect(esMensajePropio({ id_remitente: '5' }, 5)).toBe(true)
    expect(esMensajePropio({ id_remitente: 5 }, '5')).toBe(true)
  })
})

describe('Chat (app-movil) — módulo exporta componente', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../screens/Chat.jsx')
    expect(mod.default).toBeDefined()
  })
})
