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

import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mocks = vi.hoisted(() => ({
  webView: vi.fn(() => null),
}))

// Mock de react-native-webview para evitar error de módulo no encontrado
vi.mock('react-native-webview', () => ({
  WebView: mocks.webView,
}))

describe('AddressMapFrame.web', () => {
  it('muestra el mapa en un iframe y propaga errores', async () => {
    const mod = await import('../../components/AddressMapFrame.web.jsx')
    const onError = vi.fn()
    const { container } = render(React.createElement(mod.default, {
      html: '<p>Mapa</p>',
      onError,
    }))
    const iframe = container.querySelector('iframe')
    const frame = mod.default.render({ html: '<p>Mapa</p>', onError }, null)

    expect(iframe.getAttribute('title')).toBe('Mapa para elegir dirección')
    expect(iframe.getAttribute('srcdoc')).toBe('<p>Mapa</p>')
    expect(frame.props.onError).toBe(onError)
  })
})

describe('AddressMapFrame.native', () => {
  it('configura WebView y entrega el HTML y sus callbacks', async () => {
    const cwd = process.cwd()
    const filePath = resolve(cwd, cwd.endsWith('app-movil') ? 'src/components/AddressMapFrame.native.jsx' : 'app-movil/src/components/AddressMapFrame.native.jsx')
    const source = readFileSync(filePath, 'utf8')
    expect(source).toContain('source={{ html }}')
    expect(source).toContain('javaScriptEnabled')
    expect(source).toContain('domStorageEnabled')
    expect(source).toContain("originWhitelist={['*']}")
    expect(source).toContain('onMessage={onMessage}')
    expect(source).toContain('onError={onError}')
  })
})
