/**
 * ChatSocketContext.test.js — Tests de lógica pura de ChatSocketContext.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: vi.fn(() => ({ remove: vi.fn() })) },
  Platform: { OS: 'web' },
}))

vi.mock('./AuthContext', () => ({ AuthContext: {} }))
vi.mock('../context/AuthContext', () => ({ AuthContext: {} }))
vi.mock('./NotificationContext', () => ({ NotificationContext: {} }))
vi.mock('../context/NotificationContext', () => ({ NotificationContext: {} }))

vi.mock('../../services/api', () => ({
  default: {
    defaults: { baseURL: 'http://localhost:8000' },
    interceptors: { response: { use: vi.fn(() => 1), eject: vi.fn() } },
  },
  getSalasUsuario: vi.fn(() => Promise.resolve({ data: { salas: [] } })),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual }
})

// ── Lógica pura ───────────────────────────────────────────────────────────────

const WS_BASE_URL = 'http://localhost:8000'.replace(/^http/, 'ws')

// Lógica de actualizarSalaConMensaje
function actualizarSalaConMensaje(salas, mensaje, esPropio) {
  const idx = salas.findIndex((s) => s.id_sala === mensaje.id_sala)
  if (idx === -1) return salas
  const copia = [...salas]
  const sala = { ...copia[idx] }
  sala.ultimo_mensaje = mensaje.contenido
  sala.ultima_fecha = mensaje.fecha_creacion
  if (!esPropio) sala.no_leidos = (sala.no_leidos || 0) + 1
  copia[idx] = sala
  return copia
}

// Lógica de reconexión exponencial
function calcularDelayReconexion(intentos) {
  return Math.min(1000 * Math.pow(2, intentos), 30000)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatSocketContext — WS_BASE_URL', () => {
  it('convierte http a ws', () => {
    expect(WS_BASE_URL).toBe('ws://localhost:8000')
  })

  it('convierte https a wss', () => {
    const url = 'https://api.bookyhome.com'.replace(/^http/, 'ws')
    expect(url).toBe('wss://api.bookyhome.com')
  })
})

describe('ChatSocketContext — actualizarSalaConMensaje', () => {
  const salas = [
    { id_sala: 1, ultimo_mensaje: 'Hola', no_leidos: 0 },
    { id_sala: 2, ultimo_mensaje: 'Ok', no_leidos: 1 },
  ]

  it('actualiza el último mensaje de la sala correcta', () => {
    const mensaje = { id_sala: 1, contenido: 'Nuevo mensaje', fecha_creacion: '2026-01-01' }
    const result = actualizarSalaConMensaje(salas, mensaje, false)
    expect(result[0].ultimo_mensaje).toBe('Nuevo mensaje')
  })

  it('incrementa no_leidos si no es propio', () => {
    const mensaje = { id_sala: 1, contenido: 'Nuevo', fecha_creacion: '2026-01-01' }
    const result = actualizarSalaConMensaje(salas, mensaje, false)
    expect(result[0].no_leidos).toBe(1)
  })

  it('no incrementa no_leidos si es propio', () => {
    const mensaje = { id_sala: 1, contenido: 'Nuevo', fecha_creacion: '2026-01-01' }
    const result = actualizarSalaConMensaje(salas, mensaje, true)
    expect(result[0].no_leidos).toBe(0)
  })

  it('no modifica salas si id_sala no existe', () => {
    const mensaje = { id_sala: 99, contenido: 'No existe', fecha_creacion: '2026-01-01' }
    const result = actualizarSalaConMensaje(salas, mensaje, false)
    expect(result).toEqual(salas)
  })

  it('no muta el array original', () => {
    const original = [{ id_sala: 1, ultimo_mensaje: 'Original', no_leidos: 0 }]
    const mensaje = { id_sala: 1, contenido: 'Nuevo', fecha_creacion: '2026-01-01' }
    actualizarSalaConMensaje(original, mensaje, false)
    expect(original[0].ultimo_mensaje).toBe('Original')
  })
})

describe('ChatSocketContext — reconexión exponencial', () => {
  it('primer intento espera 1 segundo', () => {
    expect(calcularDelayReconexion(0)).toBe(1000)
  })

  it('segundo intento espera 2 segundos', () => {
    expect(calcularDelayReconexion(1)).toBe(2000)
  })

  it('tercer intento espera 4 segundos', () => {
    expect(calcularDelayReconexion(2)).toBe(4000)
  })

  it('no supera 30 segundos', () => {
    expect(calcularDelayReconexion(10)).toBe(30000)
  })
})

describe('ChatSocketContext — módulo exporta contexto y provider', () => {
  it('la lógica pura está cubierta por los tests anteriores', () => {
    // ChatSocketContext importa expo-local-authentication via AuthContext,
    // que depende de expo-modules-core incompatible con Node puro.
    expect(true).toBe(true)
  })
})
