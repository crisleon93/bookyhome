/**
 * Chat.test.jsx — Tests de lógica pura de Chat.jsx del frontend.
 */

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  constructor() {
    this.readyState = 0
    this.close = vi.fn()
    this.send = vi.fn()
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
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    cleanup()
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
})
