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

const mocks = vi.hoisted(() => ({
  webView: vi.fn(() => null),
}))

// Mock de react-native-webview para evitar error de módulo no encontrado
vi.mock('react-native-webview', () => ({
  WebView: mocks.webView,
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
  it('muestra el mapa en un iframe y propaga errores', async () => {
    const mod = await import('../../components/AddressMapFrame.web.jsx')
    const onError = vi.fn()
    const { container } = render(React.createElement(mod.default, {
      html: '<p>Mapa</p>',
      onError,
    }))
    const iframe = container.querySelector('iframe')
    const frame = mod.default({ html: '<p>Mapa</p>', onError })

    expect(iframe.getAttribute('title')).toBe('Mapa para elegir dirección')
    expect(iframe.getAttribute('srcdoc')).toBe('<p>Mapa</p>')
    expect(frame.props.onError).toBe(onError)
  })
})

describe('AddressMapFrame.native', () => {
  it('configura WebView y entrega el HTML y sus callbacks', async () => {
    const mod = await import('../../components/AddressMapFrame.native.jsx')
    const onMessage = vi.fn()
    const onError = vi.fn()

    render(React.createElement(mod.default, {
      html: '<p>Mapa nativo</p>',
      onMessage,
      onError,
    }))

    const props = mocks.webView.mock.lastCall[0]
    expect(props.source).toEqual({ html: '<p>Mapa nativo</p>' })
    expect(props.javaScriptEnabled).toBe(true)
    expect(props.domStorageEnabled).toBe(true)
    expect(props.originWhitelist).toEqual(['*'])
    expect(props.onMessage).toBe(onMessage)
    expect(props.onError).toBe(onError)
  })
})
