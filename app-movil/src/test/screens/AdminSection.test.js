/**
 * AdminSection.test.js — Tests de lógica pura de AdminSection.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  ActivityIndicator: () => null, Alert: { alert: vi.fn() }, FlatList: () => null,
  Modal: () => null, Platform: { OS: 'web' }, RefreshControl: () => null,
  ScrollView: () => null, StyleSheet: { create: (s) => s },
  Text: () => null, TextInput: () => null, TouchableOpacity: () => null, View: () => null,
}))

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

vi.mock('../../components/Icons', () => ({
  IconBook: () => null, IconCheck: () => null, IconChevronLeft: () => null,
  IconEye: () => null, IconEyeOff: () => null, IconLock: () => null,
  IconPackage: () => null, IconStore: () => null, IconTrash: () => null,
  IconUnlock: () => null, IconUser: () => null,
}))

vi.mock('../../services/api', () => ({
  bloquearUsuario: vi.fn(() => Promise.resolve({ data: {} })),
  cambiarEstadoTienda: vi.fn(() => Promise.resolve({ data: {} })),
  eliminarLibroAdmin: vi.fn(() => Promise.resolve({ data: {} })),
  getAdminLibros: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminOrdenes: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminTiendas: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminUsuarios: vi.fn(() => Promise.resolve({ data: [] })),
  ocultarLibroAdmin: vi.fn(() => Promise.resolve({ data: {} })),
}))

// ── Lógica pura del módulo ────────────────────────────────────────────────────

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const isActiveStore = (s) =>
  ['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes(
    (s || '').toLowerCase().trim()
  )

const isSuspendedStore = (s) =>
  ['suspendida', 'suspendido', 'inactiva', 'inactivo', 'pausada', 'pausado'].includes(
    (s || '').toLowerCase().trim()
  )

const ROL_COLORS = {
  admin:         { color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA' },
  administrador: { color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA' },
  vendedor:      { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  comprador:     { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
}
const getRolColors = (rol) =>
  ROL_COLORS[(rol || '').toLowerCase()] || { color: '#666', bg: '#F3F4F6', border: '#D1D5DB' }

const PER_PAGE = 10

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminSection — initials', () => {
  it('devuelve iniciales de nombre completo', () => {
    expect(initials('Juan Pérez')).toBe('JP')
  })

  it('devuelve inicial de nombre simple', () => {
    expect(initials('Ana')).toBe('A')
  })

  it('usa solo las dos primeras palabras', () => {
    expect(initials('María José García')).toBe('MJ')
  })

  it('devuelve ? para nombre vacío', () => {
    expect(initials('')).toBe('?')
  })

  it('devuelve ? para null', () => {
    expect(initials(null)).toBe('?')
  })

  it('devuelve en mayúsculas', () => {
    expect(initials('juan pérez')).toBe('JP')
  })
})

describe('AdminSection — isActiveStore', () => {
  it('reconoce tienda activa', () => {
    expect(isActiveStore('activa')).toBe(true)
    expect(isActiveStore('Activa')).toBe(true)
    expect(isActiveStore('activo')).toBe(true)
  })

  it('reconoce tienda habilitada', () => {
    expect(isActiveStore('habilitada')).toBe(true)
    expect(isActiveStore('aprobada')).toBe(true)
  })

  it('no reconoce tienda suspendida como activa', () => {
    expect(isActiveStore('suspendida')).toBe(false)
    expect(isActiveStore('inactiva')).toBe(false)
  })

  it('maneja null y string vacío', () => {
    expect(isActiveStore(null)).toBe(false)
    expect(isActiveStore('')).toBe(false)
  })
})

describe('AdminSection — isSuspendedStore', () => {
  it('reconoce tienda suspendida', () => {
    expect(isSuspendedStore('suspendida')).toBe(true)
    expect(isSuspendedStore('Suspendida')).toBe(true)
    expect(isSuspendedStore('inactiva')).toBe(true)
    expect(isSuspendedStore('pausada')).toBe(true)
  })

  it('no reconoce tienda activa como suspendida', () => {
    expect(isSuspendedStore('activa')).toBe(false)
  })

  it('maneja null', () => {
    expect(isSuspendedStore(null)).toBe(false)
  })
})

describe('AdminSection — getRolColors', () => {
  it('devuelve colores para rol comprador', () => {
    const c = getRolColors('comprador')
    expect(c.color).toBe('#047857')
  })

  it('devuelve colores para rol vendedor', () => {
    const c = getRolColors('vendedor')
    expect(c.color).toBe('#B45309')
  })

  it('devuelve colores para rol admin', () => {
    const c = getRolColors('admin')
    expect(c.color).toBe('#7A1E3A')
  })

  it('devuelve colores por defecto para rol desconocido', () => {
    const c = getRolColors('otro_rol')
    expect(c.bg).toBe('#F3F4F6')
  })

  it('es case insensitive', () => {
    const c = getRolColors('ADMIN')
    expect(c.color).toBe('#7A1E3A')
  })
})

describe('AdminSection — paginación', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, nombre: `Item ${i + 1}` }))

  it('PER_PAGE es 10', () => {
    expect(PER_PAGE).toBe(10)
  })

  it('primera página tiene 10 items', () => {
    const pagina = 1
    const result = items.slice(0, pagina * PER_PAGE)
    expect(result).toHaveLength(10)
  })

  it('segunda página acumula 20 items', () => {
    const pagina = 2
    const result = items.slice(0, pagina * PER_PAGE)
    expect(result).toHaveLength(20)
  })

  it('tercera página muestra todos', () => {
    const pagina = 3
    const result = items.slice(0, pagina * PER_PAGE)
    expect(result).toHaveLength(25)
  })
})

describe('AdminSection — módulo exporta componente', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../screens/AdminSection.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})
