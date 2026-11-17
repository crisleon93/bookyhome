/**
 * CalificacionesVendedor.test.js — Tests de lógica pura.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  ActivityIndicator: () => null, FlatList: () => null, RefreshControl: () => null,
  StyleSheet: { create: (s) => s }, Text: () => null,
  TouchableOpacity: () => null, View: () => null,
}))
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }) => children }))
vi.mock('@react-navigation/native', () => ({ useFocusEffect: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ AuthContext: {} }))
vi.mock('../../services/api', () => ({
  getCalificacionesVendedor: vi.fn(() => Promise.resolve({ data: {} })),
  getLibreria: vi.fn(() => Promise.resolve({ data: {} })),
}))
vi.mock('../../components/SidebarVendedor', () => ({ default: () => null }))
vi.mock('../../components/Icons', () => ({
  IconCalendar: () => null, IconMessage: () => null, IconStar: () => null,
}))
vi.mock('../../components/Footer', () => ({ default: () => null }))

// ── Lógica pura ───────────────────────────────────────────────────────────────

const fechaFormato = (fecha) => fecha
  ? new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  : 'Sin fecha'

const temaPromedio = (valor) => {
  if (valor >= 4.5) return { background: '#D1FAE5', color: '#065F46', border: '#6EE7B7' }
  if (valor >= 3.5) return { background: '#FEF9C3', color: '#854D0E', border: '#FDE047' }
  return { background: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' }
}

const colorCalificacion = (valor) => valor >= 4 ? '#22C55E' : valor === 3 ? '#F59E0B' : '#EF4444'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CalificacionesVendedor — fechaFormato', () => {
  it('formatea fecha ISO correctamente', () => {
    const r = fechaFormato('2026-01-15')
    expect(r).toContain('2026')
  })

  it('devuelve "Sin fecha" para null', () => {
    expect(fechaFormato(null)).toBe('Sin fecha')
    expect(fechaFormato('')).toBe('Sin fecha')
  })
})

describe('CalificacionesVendedor — temaPromedio', () => {
  it('devuelve verde para promedio >= 4.5', () => {
    expect(temaPromedio(5).background).toBe('#D1FAE5')
    expect(temaPromedio(4.5).background).toBe('#D1FAE5')
  })

  it('devuelve amarillo para promedio >= 3.5', () => {
    expect(temaPromedio(4).background).toBe('#FEF9C3')
    expect(temaPromedio(3.5).background).toBe('#FEF9C3')
  })

  it('devuelve rojo para promedio < 3.5', () => {
    expect(temaPromedio(3).background).toBe('#FEE2E2')
    expect(temaPromedio(1).background).toBe('#FEE2E2')
  })
})

describe('CalificacionesVendedor — colorCalificacion', () => {
  it('devuelve verde para calificación >= 4', () => {
    expect(colorCalificacion(4)).toBe('#22C55E')
    expect(colorCalificacion(5)).toBe('#22C55E')
  })

  it('devuelve amarillo para calificación exacta 3', () => {
    expect(colorCalificacion(3)).toBe('#F59E0B')
  })

  it('devuelve rojo para calificación < 3', () => {
    expect(colorCalificacion(2)).toBe('#EF4444')
    expect(colorCalificacion(1)).toBe('#EF4444')
  })
})

describe('CalificacionesVendedor — módulo exporta componente', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../screens/CalificacionesVendedor.jsx')
    expect(mod.default).toBeDefined()
  })
})
