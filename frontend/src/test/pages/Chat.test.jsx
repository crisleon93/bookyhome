/**
 * Chat.test.jsx — Tests de lógica pura de Chat.jsx del frontend.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

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
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

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
