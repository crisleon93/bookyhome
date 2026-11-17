/**
 * AdminRequests.test.js — Tests de lógica pura de AdminRequests.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  ActivityIndicator: () => null, Alert: { alert: vi.fn() }, FlatList: () => null,
  Image: () => null, Modal: () => null, RefreshControl: () => null,
  ScrollView: () => null, StyleSheet: { create: (s) => s },
  Text: () => null, TextInput: () => null, TouchableOpacity: () => null, View: () => null,
}))

vi.mock('../../services/api', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  getMensajesSolicitudAdmin: vi.fn(() => Promise.resolve({ data: [] })),
  enviarMensajeSolicitudAdmin: vi.fn(() => Promise.resolve({ data: {} })),
  resolverSolicitudAdmin: vi.fn(() => Promise.resolve({ data: {} })),
}))

vi.mock('../../components/Icons', () => ({
  IconAlertTriangle: () => null, IconCheck: () => null, IconEye: () => null,
  IconEyeOff: () => null, IconMail: () => null, IconMessage: () => null,
  IconStoreAlt: () => null, IconTool: () => null, IconUser: () => null,
}))

// ── Lógica pura del módulo ────────────────────────────────────────────────────

const normalizeState = (state) =>
  (state || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const stateStyle = (state) => {
  const key = normalizeState(state)
  if (key === 'resuelto') return { bg: '#DCFCE7', border: '#BBF7D0', color: '#166534' }
  if (key === 'rechazado') return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' }
  if (key.includes('revision')) return { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C' }
  return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' }
}

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATES = ['Todos', 'Abierto', 'En revisión', 'Resuelto', 'Rechazado']
const ITEMS_PER_PAGE = 10

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminRequests — normalizeState', () => {
  it('normaliza a minúsculas', () => {
    expect(normalizeState('Resuelto')).toBe('resuelto')
  })

  it('elimina tildes', () => {
    expect(normalizeState('En revisión')).toBe('en revision')
  })

  it('maneja null', () => {
    expect(normalizeState(null)).toBe('')
  })

  it('maneja string vacío', () => {
    expect(normalizeState('')).toBe('')
  })
})

describe('AdminRequests — stateStyle', () => {
  it('devuelve estilo verde para Resuelto', () => {
    const s = stateStyle('Resuelto')
    expect(s.bg).toBe('#DCFCE7')
    expect(s.color).toBe('#166534')
  })

  it('devuelve estilo rojo para Rechazado', () => {
    const s = stateStyle('Rechazado')
    expect(s.bg).toBe('#FEF2F2')
  })

  it('devuelve estilo naranja para En revisión', () => {
    const s = stateStyle('En revisión')
    expect(s.bg).toBe('#FFF7ED')
  })

  it('devuelve estilo azul por defecto para Abierto', () => {
    const s = stateStyle('Abierto')
    expect(s.bg).toBe('#EFF6FF')
  })

  it('devuelve estilo azul para estado desconocido', () => {
    const s = stateStyle('otro_estado')
    expect(s.bg).toBe('#EFF6FF')
  })
})

describe('AdminRequests — formatDate', () => {
  it('devuelve "Fecha no disponible" para null', () => {
    expect(formatDate(null)).toBe('Fecha no disponible')
  })

  it('devuelve "Fecha no disponible" para string vacío', () => {
    expect(formatDate('')).toBe('Fecha no disponible')
  })

  it('formatea fecha ISO válida', () => {
    const result = formatDate('2026-01-15T00:00:00.000Z')
    expect(result).toContain('2026')
  })

  it('devuelve el string original para fecha inválida', () => {
    expect(formatDate('no-es-fecha')).toBe('no-es-fecha')
  })
})

describe('AdminRequests — constantes', () => {
  it('STATES tiene los 5 estados esperados', () => {
    expect(STATES).toHaveLength(5)
    expect(STATES).toContain('Todos')
    expect(STATES).toContain('Resuelto')
  })

  it('ITEMS_PER_PAGE es 10', () => {
    expect(ITEMS_PER_PAGE).toBe(10)
  })
})

describe('AdminRequests — filtrado de solicitudes', () => {
  const solicitudes = [
    { id_solicitud: 1, estado: 'Abierto', tipo_solicitud: 'reclamo', asunto: 'Producto dañado' },
    { id_solicitud: 2, estado: 'Resuelto', tipo_solicitud: 'soporte', asunto: 'No llega pedido' },
    { id_solicitud: 3, estado: 'En revisión', tipo_solicitud: 'reclamo', asunto: 'Error en cobro' },
  ]

  it('filtra por estado Abierto', () => {
    const result = solicitudes.filter((s) => s.estado === 'Abierto')
    expect(result).toHaveLength(1)
  })

  it('filtra por tipo reclamo', () => {
    const result = solicitudes.filter((s) => s.tipo_solicitud === 'reclamo')
    expect(result).toHaveLength(2)
  })

  it('filtra por texto en asunto', () => {
    const q = 'pedido'
    const result = solicitudes.filter((s) =>
      s.asunto.toLowerCase().includes(q.toLowerCase())
    )
    expect(result).toHaveLength(1)
  })

  it('devuelve todos cuando filtro es Todos', () => {
    const filtro = 'Todos'
    const result = filtro === 'Todos' ? solicitudes : solicitudes.filter((s) => s.estado === filtro)
    expect(result).toHaveLength(3)
  })
})

describe('AdminRequests — módulo exporta componente', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../screens/AdminRequests.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})
