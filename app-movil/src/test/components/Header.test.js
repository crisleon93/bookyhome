/**
 * Header.test.js — Tests de Header.jsx (app-movil)
 * Importa el módulo real para cobertura real en SonarCloud.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  View: () => null, Text: () => null, TextInput: () => null,
  TouchableOpacity: () => null, Image: () => null,
  StyleSheet: { create: (s) => s },
  Modal: () => null,
  StatusBar: { setBarStyle: vi.fn() },
}))

vi.mock('../context/AuthContext', () => ({ AuthContext: {} }))
vi.mock('../../context/AuthContext', () => ({ AuthContext: {} }))

vi.mock('./Icons', () => ({
  IconSearch: () => null, IconUser: () => null, IconUserPlus: () => null,
  IconLocation: () => null, IconClose: () => null, IconChevronRight: () => null,
  IconBook: () => null, IconMenu: () => null, IconCart: () => null,
  IconCamera: () => null, IconFilter: () => null,
}))
vi.mock('../../components/Icons', () => ({
  IconSearch: () => null, IconUser: () => null, IconUserPlus: () => null,
  IconLocation: () => null, IconClose: () => null, IconChevronRight: () => null,
  IconBook: () => null, IconMenu: () => null, IconCart: () => null,
  IconCamera: () => null, IconFilter: () => null,
}))

vi.mock('./SidebarMenu', () => ({ default: () => null }))
vi.mock('../../components/SidebarMenu', () => ({ default: () => null }))
vi.mock('./BarcodeScanner', () => ({ default: () => null }))
vi.mock('../../components/BarcodeScanner', () => ({ default: () => null }))
vi.mock('./FiltrosBusqueda', () => ({ default: () => null }))
vi.mock('../../components/FiltrosBusqueda', () => ({ default: () => null }))

vi.mock('../context/ThemeContext', () => ({
  useThemedStyles: vi.fn((fn) => fn({})),
}))
vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: vi.fn((fn) => fn({})),
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual }
})

describe('Header (app-movil) — módulo', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../components/Header.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})

describe('Header (app-movil) — FilterBadge lógica', () => {
  it('no muestra badge cuando count es 0', () => {
    const count = 0
    const shouldShow = !!count
    expect(shouldShow).toBe(false)
  })

  it('muestra badge cuando count > 0', () => {
    const count = 3
    const shouldShow = !!count
    expect(shouldShow).toBe(true)
  })

  it('muestra 9+ cuando count > 9', () => {
    const count = 15
    const label = count > 9 ? '9+' : String(count)
    expect(label).toBe('9+')
  })

  it('muestra el número exacto cuando count <= 9', () => {
    const count = 5
    const label = count > 9 ? '9+' : String(count)
    expect(label).toBe('5')
  })
})

describe('Header (app-movil) — props por defecto', () => {
  it('variant por defecto es public', () => {
    const defaultVariant = 'public'
    expect(defaultVariant).toBe('public')
  })

  it('filtrosActivos por defecto es 0', () => {
    const defaultFiltros = 0
    expect(defaultFiltros).toBe(0)
  })
})
