/**
 * Chat.test.jsx — Tests de lógica pura de Chat.jsx del frontend.
 */

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Chat from '../../pages/Chat'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id_sala: '1' }),
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../hooks/useAuth', () => ({
  getToken: vi.fn(() => 'fake.token.here'),
}))

vi.mock('../../services/chat', () => ({
  chatService: {
    getSalas: vi.fn(() => Promise.resolve({ salas: [] })),
    obtenerMensajes: vi.fn(() => Promise.resolve({ mensajes: [] })),
    enviarMensaje: vi.fn(() => Promise.resolve({ id_mensaje: 1 })),
    marcarSalaLeida: vi.fn(() => Promise.resolve({})),
    eliminarSala: vi.fn(() => Promise.resolve({})),
    vaciarChat: vi.fn(() => Promise.resolve({})),
  },
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({ sub: '1', rol: 'comprador' })),
}))

vi.mock('../../components/Icons', () => ({ IconSearch: () => null }))
vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))
vi.mock('../../styles/Chat.css', () => ({}))
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { id_usuario: 1 } })),
    post: vi.fn(),
  },
}))

class MockWebSocket {
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances = []

  constructor() {
    this.readyState = 0
    this.close = vi.fn()
    this.send = vi.fn()
    MockWebSocket.instances.push(this)
  }
}

// ── Lógica pura extraída ──────────────────────────────────────────────────────

const WS_BASE_URL = 'http://127.0.0.1:8000'.replace(/^http/, 'ws')

function esMensajePropio(msg, userId) {
  return String(msg.id_remitente) === String(userId)
}

function formatearFechaMensaje(fechaStr) {
  if (!fechaStr) return ''
  const d = new Date(fechaStr)
  if (isNaN(d.getTime())) return fechaStr
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function esLeido(msg) {
  return Boolean(msg.mensaje_leido) &&
    (msg.mensaje_leido === true || msg.mensaje_leido === 1 || msg.mensaje_leido === '1')
}

function esEntregado(msg) {
  return msg.entregado === true || msg.entregado === 1 || msg.entregado === '1'
}

function agruparMensajesPorFecha(mensajes) {
  const grupos = {}
  mensajes.forEach((m) => {
    const fecha = m.fecha_creacion ? m.fecha_creacion.split('T')[0] : 'Sin fecha'
    if (!grupos[fecha]) grupos[fecha] = []
    grupos[fecha].push(m)
  })
  return Object.entries(grupos).map(([fecha, msgs]) => ({ fecha, msgs }))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Chat (frontend) — WS_BASE_URL', () => {
  it('convierte http a ws', () => {
    expect(WS_BASE_URL).toBe('ws://127.0.0.1:8000')
  })
})

describe('Chat (frontend) — esMensajePropio', () => {
  it('devuelve true para mensaje del usuario actual', () => {
    expect(esMensajePropio({ id_remitente: 1 }, 1)).toBe(true)
  })

  it('devuelve false para mensaje de otro usuario', () => {
    expect(esMensajePropio({ id_remitente: 2 }, 1)).toBe(false)
  })

  it('compara como string', () => {
    expect(esMensajePropio({ id_remitente: '3' }, 3)).toBe(true)
  })
})

describe('Chat (frontend) — formatearFechaMensaje', () => {
  it('devuelve "Hoy" para fecha de hoy', () => {
    const hoy = new Date().toISOString()
    expect(formatearFechaMensaje(hoy)).toBe('Hoy')
  })

  it('devuelve "Ayer" para fecha de ayer', () => {
    const ayer = new Date(Date.now() - 86400000).toISOString()
    expect(formatearFechaMensaje(ayer)).toBe('Ayer')
  })

  it('devuelve string vacío para null', () => {
    expect(formatearFechaMensaje(null)).toBe('')
  })

  it('formatea fechas antiguas como fecha legible', () => {
    const r = formatearFechaMensaje('2025-06-15T10:00:00')
    expect(r).toContain('2025')
  })
})

describe('Chat (frontend) — esLeido', () => {
  it('devuelve true para mensaje_leido = true', () => {
    expect(esLeido({ mensaje_leido: true })).toBe(true)
  })

  it('devuelve true para mensaje_leido = 1', () => {
    expect(esLeido({ mensaje_leido: 1 })).toBe(true)
  })

  it('devuelve true para mensaje_leido = "1"', () => {
    expect(esLeido({ mensaje_leido: '1' })).toBe(true)
  })

  it('devuelve false para mensaje no leído', () => {
    expect(esLeido({ mensaje_leido: false })).toBe(false)
    expect(esLeido({ mensaje_leido: 0 })).toBe(false)
  })
})

describe('Chat (frontend) — esEntregado', () => {
  it('devuelve true para entregado = true', () => {
    expect(esEntregado({ entregado: true })).toBe(true)
  })

  it('devuelve true para entregado = 1', () => {
    expect(esEntregado({ entregado: 1 })).toBe(true)
  })

  it('devuelve false para no entregado', () => {
    expect(esEntregado({ entregado: false })).toBe(false)
  })
})

describe('Chat (frontend) — agruparMensajesPorFecha', () => {
  it('agrupa correctamente mensajes del mismo día', () => {
    const msgs = [
      { id: 1, fecha_creacion: '2026-01-15T10:00:00' },
      { id: 2, fecha_creacion: '2026-01-15T11:00:00' },
      { id: 3, fecha_creacion: '2026-01-16T09:00:00' },
    ]
    const grupos = agruparMensajesPorFecha(msgs)
    expect(grupos).toHaveLength(2)
  })

  it('devuelve array vacío para lista vacía', () => {
    expect(agruparMensajesPorFecha([])).toHaveLength(0)
  })
})

describe('Chat (frontend) — pantalla', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('carga el estado vacío y permite buscar conversaciones', async () => {
    render(<Chat />)

    expect(await screen.findByText('No tienes conversaciones')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Buscar un chat o iniciar uno nuevo'), {
      target: { value: 'sin coincidencia' },
    })
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    expect(screen.getByText('No se encontraron conversaciones')).toBeInTheDocument()
  })

  it('abre una sala, carga su historial y envía un mensaje por REST', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: '',
        no_leidos: 0,
      }],
    })
    chatService.obtenerMensajes.mockResolvedValueOnce({
      mensajes: [{ id_mensaje: 10, id_remitente: 2, mensaje: 'Hola', enviado_en: '2026-01-15 10:00:00' }],
    })

    render(<Chat />)
    expect(await screen.findAllByText('Librería Central')).toHaveLength(2)
    expect(await screen.findByText('Hola')).toBeInTheDocument()
    expect(chatService.marcarSalaLeida).toHaveBeenCalledWith(1)

    fireEvent.change(screen.getByPlaceholderText('Escribe un mensaje'), {
      target: { value: 'Gracias por responder' },
    })
    fireEvent.click(screen.getByTitle('Enviar mensaje'))

    await waitFor(() => {
      expect(chatService.enviarMensaje).toHaveBeenCalledWith(1, 'Gracias por responder')
    })
  })

  it('muestra un error visible si falla el envío del mensaje', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: '',
        no_leidos: 0,
      }],
    })
    chatService.enviarMensaje.mockRejectedValueOnce(new Error('offline'))

    render(<Chat />)
    await screen.findAllByText('Librería Central')
    fireEvent.change(screen.getByPlaceholderText('Escribe un mensaje'), {
      target: { value: 'Mensaje sin conexión' },
    })
    fireEvent.click(screen.getByTitle('Enviar mensaje'))

    expect(await screen.findByText('Error enviando mensaje. Revisa tu conexión a internet.')).toBeInTheDocument()
    expect(chatService.enviarMensaje).toHaveBeenCalledWith(1, 'Mensaje sin conexión')
  })

  it('actualiza conversaciones y estados recibidos mediante WebSocket', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [
        { id_sala: 1, nombre_tienda: 'Librería Central', ultimo_mensaje: '', no_leidos: 0 },
        { id_sala: 2, nombre_tienda: 'Librería Sur', ultimo_mensaje: '', no_leidos: 0 },
      ],
    })
    chatService.obtenerMensajes.mockResolvedValueOnce({ mensajes: [] })

    render(<Chat />)
    await screen.findAllByText('Librería Central')
    await screen.findByText(/No hay mensajes aún/)
    const socket = MockWebSocket.instances[0]
    socket.readyState = MockWebSocket.OPEN
    act(() => socket.onopen())

    act(() => socket.onmessage({ data: JSON.stringify({
      tipo: 'nuevo_mensaje',
      mensaje: {
        id_mensaje: 78,
        id_sala: 2,
        id_remitente: 2,
        mensaje: 'Respuesta recibida',
        enviado_en: '2026-03-20 10:01:00',
      },
    }) }))
    const otherRoom = screen.getByText('Librería Sur').closest('.sala-item')
    expect(within(otherRoom).getByText('Respuesta recibida')).toBeInTheDocument()
    expect(within(otherRoom).getByText('1', { selector: '.notificacion-badge' })).toBeInTheDocument()

    act(() => socket.onmessage({ data: JSON.stringify({
      tipo: 'nuevo_mensaje',
      mensaje: {
        id_mensaje: 79,
        id_sala: 1,
        id_remitente: 2,
        mensaje: 'Mensaje en la conversación abierta',
        enviado_en: '2026-03-20 10:02:00',
      },
    }) }))
    expect(await screen.findByText('Mensaje en la conversación abierta')).toBeInTheDocument()
    expect(chatService.marcarSalaLeida).toHaveBeenCalledWith(1)

    act(() => socket.onmessage({ data: JSON.stringify({ tipo: 'mensaje_entregado', id_mensaje: 79 }) }))
    act(() => socket.onmessage({ data: JSON.stringify({ tipo: 'mensajes_leidos', id_sala: 1 }) }))
    act(() => socket.onmessage({ data: JSON.stringify({ tipo: 'error', detalle: 'No autorizado' }) }))
    act(() => socket.onmessage({ data: '{mal json' }))
    expect(screen.getByText('Mensaje en la conversación abierta')).toBeInTheDocument()
  })

  it('ofrece las opciones de adjuntos y confirma archivos seleccionados', async () => {
    const { chatService } = await import('../../services/chat')
    const { notify } = await import('../../components/ToastProvider')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{ id_sala: 1, nombre_tienda: 'Librería Central', ultimo_mensaje: '', no_leidos: 0 }],
    })
    render(<Chat />)
    await screen.findAllByText('Librería Central')
    const fileInputs = document.querySelectorAll('input[type="file"]')
    const attachments = [
      ['Documento', 0, 'archivo.pdf', 'Documento "archivo.pdf" adjuntado'],
      ['Fotos y videos', 1, 'foto.png', 'Archivo multimedia "foto.png" adjuntado'],
      ['Cámara', 2, 'captura.jpg', 'Foto capturada: "captura.jpg"'],
      ['Audio', 3, 'nota.mp3', 'Audio "nota.mp3" adjuntado'],
    ]

    for (const [label, inputIndex, filename, message] of attachments) {
      fireEvent.click(screen.getByTitle('Adjuntar'))
      fireEvent.click(screen.getByRole('button', { name: label }))
      fireEvent.change(fileInputs[inputIndex], {
        target: { files: [new File(['test'], filename)] },
      })
      expect(notify).toHaveBeenCalledWith(message, 'success')
    }

    for (const [label, message] of [
      ['Contacto', 'Tarjeta de contacto compartida'],
      ['Encuesta', 'Crear encuesta en el chat'],
      ['Evento', 'Crear evento en calendario'],
    ]) {
      fireEvent.click(screen.getByTitle('Adjuntar'))
      fireEvent.click(screen.getByRole('button', { name: label }))
      expect(notify).toHaveBeenCalledWith(message, 'success')
    }

    fireEvent.click(screen.getByTitle('Adjuntar'))
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo sticker' }))
    fireEvent.change(fileInputs[1], {
      target: { files: [new File(['test'], 'sticker.webp')] },
    })
    expect(notify).toHaveBeenCalledWith('Archivo multimedia "sticker.webp" adjuntado', 'success')
  })

  it('informa si el navegador no soporta micrófono o se deniega el permiso', async () => {
    const { chatService } = await import('../../services/chat')
    const { notify } = await import('../../components/ToastProvider')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{ id_sala: 1, nombre_tienda: 'Librería Central', ultimo_mensaje: '', no_leidos: 0 }],
    })
    render(<Chat />)
    await screen.findAllByText('Librería Central')

    fireEvent.click(screen.getByTitle('Grabar nota de voz'))
    expect(notify).toHaveBeenCalledWith('Tu navegador no soporta grabación de audio', 'error')

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('permission denied')) },
    })
    fireEvent.click(screen.getByTitle('Grabar nota de voz'))
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(
        'No se pudo acceder al micrófono. Verifica los permisos.',
        'error',
      )
    })
  })

  it('graba y cancela una nota de voz liberando el micrófono', async () => {
    const { chatService } = await import('../../services/chat')
    const track = { stop: vi.fn() }
    const recorder = {
      state: 'inactive',
      start: vi.fn(function () { this.state = 'recording' }),
      stop: vi.fn(function () { this.state = 'inactive' }),
    }
    vi.stubGlobal('MediaRecorder', vi.fn(function () { return recorder }))
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] }) },
    })
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{ id_sala: 1, nombre_tienda: 'Librería Central', ultimo_mensaje: '', no_leidos: 0 }],
    })
    render(<Chat />)
    await screen.findAllByText('Librería Central')

    fireEvent.click(screen.getByTitle('Grabar nota de voz'))
    expect(await screen.findByTitle('Cancelar grabación')).toBeInTheDocument()
    expect(recorder.start).toHaveBeenCalledWith(100)
    fireEvent.click(screen.getByTitle('Cancelar grabación'))

    expect(recorder.stop).toHaveBeenCalled()
    expect(track.stop).toHaveBeenCalled()
    expect(screen.getByTitle('Grabar nota de voz')).toBeInTheDocument()
  })

  it('inserta emojis, GIFs y stickers desde el selector del chat', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{ id_sala: 1, nombre_tienda: 'Librería Central', ultimo_mensaje: '', no_leidos: 0 }],
    })
    render(<Chat />)
    await screen.findAllByText('Librería Central')

    const emojiToggle = () => document.querySelector('.chat-input-capsule > button[title="Emojis"]')
    fireEvent.click(emojiToggle())
    expect(screen.getByPlaceholderText('Buscar emoji')).toBeInTheDocument()
    const emoji = document.querySelector('.chat-emoji-tray-btn')
    fireEvent.click(emoji)
    expect(screen.getByPlaceholderText('Escribe un mensaje')).toHaveValue(emoji.title)
    expect(document.querySelector('.chat-emoji-tray')).toBeInTheDocument()

    fireEvent.click(emojiToggle())
    fireEvent.click(emojiToggle())
    fireEvent.click(screen.getByTitle('GIFs'))
    const gif = document.querySelector('.chat-emoji-tray-gif-card')
    const gifTitle = gif.querySelector('span').textContent
    fireEvent.click(gif)
    expect(screen.getByPlaceholderText('Escribe un mensaje').value).toMatch(/^\S+\[GIF: .+\]$/)
    expect(document.querySelector('.chat-emoji-tray')).toBeNull()
    expect(gifTitle).toBeTruthy()

    fireEvent.click(emojiToggle())
    fireEvent.click(screen.getByTitle('Stickers'))
    const sticker = document.querySelector('.chat-emoji-tray-sticker-item')
    fireEvent.click(sticker)
    expect(screen.getByPlaceholderText('Escribe un mensaje').value.length).toBeGreaterThan(1)
    expect(document.querySelector('.chat-emoji-tray')).toBeNull()
  })

  it('consulta los datos de contacto y cierra llamadas de audio y vídeo', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        correo_tienda: 'contacto@central.test',
        telefono_tienda: '3001234567',
        ultimo_mensaje: '',
        no_leidos: 0,
      }],
    })
    render(<Chat />)
    await screen.findAllByText('Librería Central')
    fireEvent.click(screen.getByTitle('Ver información del contacto'))
    expect(screen.getByRole('heading', { name: 'Info. del contacto' })).toBeInTheDocument()
    expect(screen.getAllByText('contacto@central.test').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('3001234567').length).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getByRole('button', { name: 'Llamar' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Llamada de voz de BookyHome...')
    fireEvent.click(screen.getByTitle('Finalizar llamada'))
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByTitle('Videollamada'))
    expect(screen.getByRole('dialog')).toHaveTextContent('Videollamada de BookyHome...')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar llamada' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByTitle('Cerrar información'))
    expect(screen.queryByRole('heading', { name: 'Info. del contacto' })).toBeNull()
  })

  it('fija y añade a favoritos una conversación desde el menú contextual', async () => {
    const { chatService } = await import('../../services/chat')
    const { notify } = await import('../../components/ToastProvider')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: 'Último mensaje',
        no_leidos: 0,
      }],
    })

    render(<Chat />)
    await screen.findAllByText('Librería Central')
    const sala = screen.getAllByText('Librería Central')[0].closest('.sala-item')
    fireEvent.contextMenu(sala, { clientX: 40, clientY: 40 })
    fireEvent.click(screen.getByRole('button', { name: 'Fijar chat' }))

    expect(JSON.parse(localStorage.getItem('bkh_chats_fijados'))).toEqual([1])
    expect(notify).toHaveBeenCalledWith('Chat fijado al inicio', 'success')

    fireEvent.contextMenu(sala, { clientX: 40, clientY: 40 })
    fireEvent.click(screen.getByRole('button', { name: 'Añadir a Favoritos' }))
    expect(JSON.parse(localStorage.getItem('bkh_chats_favoritos'))).toEqual([1])
    expect(notify).toHaveBeenCalledWith('Añadido a favoritos', 'success')
  })

  it('elimina un mensaje desde sus opciones y conserva la conversación', async () => {
    const { chatService } = await import('../../services/chat')
    const { notify } = await import('../../components/ToastProvider')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: 'Mensaje para borrar',
        no_leidos: 0,
      }],
    })
    chatService.obtenerMensajes.mockResolvedValueOnce({
      mensajes: [{
        id_mensaje: 21,
        id_remitente: 1,
        mensaje: 'Mensaje para borrar',
        enviado_en: new Date().toISOString(),
      }],
    })

    render(<Chat />)
    await screen.findByText('Mensaje para borrar', { selector: '.mensaje-texto' })
    const message = document.querySelector('.chat-mensajes .mensaje')
    fireEvent.click(within(message).getByTitle('Más opciones'))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(document.querySelector('.chat-mensajes .mensaje-texto')).toBeNull()
    })
    expect(screen.getAllByText('Librería Central').length).toBeGreaterThan(0)
    expect(notify).toHaveBeenCalledWith('Mensaje eliminado ✓', 'success')
  })

  it('copia, responde, fija y destaca mensajes desde el menú contextual', async () => {
    const { chatService } = await import('../../services/chat')
    const { notify } = await import('../../components/ToastProvider')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: 'Acciones de mensaje',
        no_leidos: 0,
      }],
    })
    chatService.obtenerMensajes.mockResolvedValueOnce({
      mensajes: [{
        id_mensaje: 71,
        id_remitente: 2,
        mensaje: 'Acciones de mensaje',
        enviado_en: new Date().toISOString(),
      }],
    })
    render(<Chat />)
    await screen.findByText('Acciones de mensaje', { selector: '.mensaje-texto' })
    const abrirMenu = () => fireEvent.contextMenu(document.querySelector('.mensaje'))

    abrirMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('Acciones de mensaje'))
    expect(notify).toHaveBeenCalledWith('Texto copiado al portapapeles ✓', 'success')

    abrirMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))
    expect(screen.getByText('Acciones de mensaje', { selector: '.reply-bar-text' })).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Escribe un mensaje'), {
      target: { value: 'Respuesta' },
    })
    fireEvent.click(screen.getByTitle('Enviar mensaje'))
    await waitFor(() => expect(chatService.enviarMensaje).toHaveBeenCalledWith(
      1,
      '┌── 💬 Usuario: "Acciones de mensaje"\n└── Respuesta',
    ))

    abrirMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Fijar' }))
    expect(notify).toHaveBeenCalledWith('Mensaje fijado 📌', 'success')

    abrirMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Destacar' }))
    expect(JSON.parse(localStorage.getItem('bkh_chat_destacados'))).toEqual([71])
    expect(notify).toHaveBeenCalledWith('Mensaje destacado ⭐', 'success')
  })

  it('guarda una reacción rápida en los mensajes propios', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: 'Mi mensaje',
        no_leidos: 0,
      }],
    })
    chatService.obtenerMensajes.mockResolvedValueOnce({
      mensajes: [{
        id_mensaje: 31,
        id_remitente: 1,
        mensaje: 'Mi mensaje',
        enviado_en: new Date().toISOString(),
      }],
    })

    render(<Chat />)
    await screen.findByText('Mi mensaje', { selector: '.mensaje-texto' })
    fireEvent.click(screen.getByTitle('Reaccionar'))
    fireEvent.click(document.querySelector('.reaction-quick-btn'))

    expect(JSON.parse(localStorage.getItem('bkh_chat_reacciones'))).toEqual({ 31: ['👍'] })
  })

  it('abre las preferencias del contacto y actualiza la configuración de mensajes', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: 'Último mensaje',
        no_leidos: 0,
      }],
    })
    render(<Chat />)
    await screen.findAllByText('Librería Central')

    fireEvent.click(screen.getByTitle('Más opciones'))
    fireEvent.click(screen.getByText('Info. del contacto'))
    fireEvent.click(screen.getByTitle('Configuración y apariencia del chat'))
    expect(screen.getByRole('dialog', { name: 'Configuración y Apariencia del Chat' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Preferencias/ }))
    const enterToSend = screen.getByLabelText('Enviar al presionar Enter')
    const wasChecked = enterToSend.checked
    fireEvent.click(enterToSend)
    expect(enterToSend.checked).toBe(!wasChecked)
  })

  it('personaliza el texto y las reacciones desde los selectores de emoji', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: 'Mensaje para reaccionar',
        no_leidos: 0,
      }],
    })
    chatService.obtenerMensajes.mockResolvedValueOnce({
      mensajes: [{
        id_mensaje: 61,
        id_remitente: 2,
        mensaje: 'Mensaje para reaccionar',
        fecha_creacion: new Date().toISOString(),
        enviado_en: new Date().toISOString(),
      }],
    })
    render(<Chat />)
    await screen.findByText('Mensaje para reaccionar', { selector: '.mensaje-texto' })

    fireEvent.contextMenu(document.querySelector('.mensaje'))
    fireEvent.click(screen.getByTitle('Más reacciones'))
    const picker = screen.getByRole('dialog', { name: 'Seleccionar reacción' })
    fireEvent.change(within(picker).getByPlaceholderText('Busca una reacción'), {
      target: { value: '❤️' },
    })
    fireEvent.click(within(picker).getByRole('button', { name: '❤️', exact: true }))
    expect(JSON.parse(localStorage.getItem('bkh_chat_reacciones'))[61]).toContain('❤️')

    fireEvent.click(screen.getByTitle('Emojis'))
    expect(document.querySelector('.chat-emoji-tray')).toBeTruthy()
    fireEvent.click(document.querySelector('.chat-emoji-tray-btn'))
    expect(screen.getByPlaceholderText('Escribe un mensaje').value).toBeTruthy()
  })

  it('recorre y restablece las secciones de apariencia del chat', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: '',
        no_leidos: 0,
      }],
    })
    render(<Chat />)
    await screen.findAllByText('Librería Central')
    fireEvent.click(screen.getByTitle('Más opciones'))
    fireEvent.click(screen.getByText('Info. del contacto'))
    fireEvent.click(screen.getByTitle('Configuración y apariencia del chat'))
    const dialog = screen.getByRole('dialog', { name: 'Configuración y Apariencia del Chat' })

    fireEvent.click(within(dialog).getByRole('button', { name: /📋 Lista de Chats/ }))
    fireEvent.click(within(dialog).getByRole('radio', { name: /Contorno Neón Oscuro/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: /💬 Burbujas/ }))
    fireEvent.click(within(dialog).getByRole('radio', { name: /Verde Esmeralda/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: /🔤 Tamaño Letra/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: /Grande/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: /⚡ Preferencias/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restablecer valores' }))
    expect(JSON.parse(localStorage.getItem('bkh_chat_theme_settings')).tamanoFuente).toBe('mediana')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Listo / Guardar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('actualiza el progreso de una nota de voz al mover el scrubber, pausar y terminar', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: 'Nota de voz',
        no_leidos: 0,
      }],
    })
    chatService.obtenerMensajes.mockResolvedValueOnce({
      mensajes: [{
        id_mensaje: 41,
        id_remitente: 1,
        mensaje: '[AUDIO]{"url":"https://example.test/voice.mp3","duracion":"0:10","seg":10}',
        enviado_en: new Date().toISOString(),
        mensaje_leido: '1',
      }],
    })

    let audio
    vi.stubGlobal('Audio', class {
      constructor(url) {
        this.url = url
        this.currentTime = 0
        this.ended = false
        this.pause = vi.fn()
        this.play = vi.fn().mockResolvedValue(undefined)
        this.onended = null
        audio = this
      }
    })

    render(<Chat />)
    await screen.findByText('0:10')
    expect(screen.getByTitle('Visto')).toBeInTheDocument()
    const slider = screen.getByRole('slider', { name: 'Barra de progreso de audio' })
    slider.getBoundingClientRect = () => ({ left: 10, width: 100 })
    fireEvent.click(slider, { clientX: 45 })
    expect(slider).toHaveAttribute('aria-valuenow', '35')

    vi.useFakeTimers()
    fireEvent.click(screen.getByTitle('Reproducir nota de voz'))
    expect(audio.url).toBe('https://example.test/voice.mp3')
    expect(audio.currentTime).toBe(3.5)
    expect(audio.play).toHaveBeenCalledOnce()

    act(() => {
      audio.currentTime = 6
      vi.advanceTimersByTime(50)
    })
    expect(slider).toHaveAttribute('aria-valuenow', '60')
    expect(screen.getByText('0:06')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Pausar nota de voz'))
    expect(audio.pause).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByTitle('Reproducir nota de voz'))
    act(() => audio.onended())
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByText('0:10')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Reproducir nota de voz'))
    act(() => {
      audio.currentTime = 10
      vi.advanceTimersByTime(50)
    })
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByTitle('Reproducir nota de voz')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Reproducir nota de voz'))
    act(() => {
      audio.currentTime = 1
      audio.ended = true
      vi.advanceTimersByTime(50)
    })
    expect(slider).toHaveAttribute('aria-valuenow', '0')
  })

  it('muestra los estados pendiente, entregado y enviado para mensajes propios', async () => {
    const { chatService } = await import('../../services/chat')
    chatService.getSalas.mockResolvedValueOnce({
      salas: [{
        id_sala: 1,
        nombre_tienda: 'Librería Central',
        ultimo_mensaje: 'Estados',
        no_leidos: 0,
      }],
    })
    chatService.obtenerMensajes.mockResolvedValueOnce({
      mensajes: [
        { id_mensaje: 51, id_remitente: 1, mensaje: 'Pendiente', pendiente: true },
        { id_mensaje: 52, id_remitente: 1, mensaje: 'Entregado', entregado: 1 },
        { id_mensaje: 53, id_remitente: 1, mensaje: 'Enviado' },
      ],
    })

    render(<Chat />)
    await screen.findByText('Pendiente')

    expect(screen.getByTitle('Enviando...')).toBeInTheDocument()
    expect(screen.getByTitle('Entregado')).toBeInTheDocument()
    expect(screen.getByTitle('Enviado')).toBeInTheDocument()
  })
})
