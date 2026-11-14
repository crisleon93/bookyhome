/**
 * AddressMapFrame.test.js — Tests de los componentes AddressMapFrame.
 *
 * AddressMapFrame.web.jsx  → iframe para web
 * AddressMapFrame.native.jsx → WebView para React Native
 *
 * Solo verificamos que los módulos exportan un componente válido
 * (función/objeto), ya que el entorno de test es Node sin DOM ni
 * React Native runtime.
 */

import { describe, it, expect, vi } from 'vitest'

// Mock de react-native-webview para evitar error de módulo no encontrado
vi.mock('react-native-webview', () => ({
  WebView: () => null,
}))

// Mock de react para forwardRef
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    forwardRef: (fn) => fn,
  }
})

describe('AddressMapFrame.web', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../components/AddressMapFrame.web.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})

describe('AddressMapFrame.native', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../components/AddressMapFrame.native.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})
