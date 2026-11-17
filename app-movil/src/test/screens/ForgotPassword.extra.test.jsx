// @vitest-environment jsdom

/**
 * ForgotPassword.extra.test.jsx — ramas no cubiertas del 7.5% faltante
 *
 * Cubre:
 * - Botón "← Volver al inicio de sesión" llama a navigation.goBack()
 * - Footer onLinkPress registra el console.log
 * - Estado de carga: botón deshabilitado mientras la promesa no resuelve
 * - err.message cuando no hay response (ya cubierto parcialmente, esta vez
 *   con message real distinto de 'Error')
 * - Email con espacios al inicio/fin (trim falla la regex → alert)
 */

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPassword from '../../screens/ForgotPassword'
import api from '../../services/api'
import { Alert } from 'react-native'

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    ActivityIndicator: ({ color }) => <span data-color={color}>Procesando</span>,
    Alert: { alert: vi.fn() },
    KeyboardAvoidingView: ({ children }) => <div>{children}</div>,
    Platform: { OS: 'web' },
    SafeAreaView: ({ children }) => <div>{children}</div>,
    ScrollView: ({ children }) => <div>{children}</div>,
    StyleSheet: { create: (styles) => styles },
    Text: ({ children }) => <span>{children}</span>,
    TextInput: ({ value, onChangeText, placeholder }) => (
      <input
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
      />
    ),
    TouchableOpacity: ({ children, onPress, disabled }) => (
      <button type="button" onClick={onPress} disabled={disabled}>
        {children}
      </button>
    ),
    View: ({ children }) => <div>{children}</div>,
  }
})

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}))
vi.mock('../../services/api', () => ({ default: { post: vi.fn() } }))
vi.mock('../../components/AuthHeader', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({
  default: ({ onLinkPress }) => (
    <button type="button" onClick={() => onLinkPress('privacidad')}>
      Footer link
    </button>
  ),
}))
vi.mock('../../components/Icons', () => ({
  IconMail: () => null,
  IconLock: () => null,
}))

describe('ForgotPassword móvil: ramas extra', () => {
  const navigation = { goBack: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    api.post.mockResolvedValue({ data: {} })
  })
  afterEach(cleanup)

  it('el botón "← Volver" llama a navigation.goBack()', () => {
    render(<ForgotPassword navigation={navigation} />)
    fireEvent.click(screen.getByRole('button', { name: /volver al inicio de sesión/i }))
    expect(navigation.goBack).toHaveBeenCalledOnce()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('el Footer llama a onLinkPress con el link recibido', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    render(<ForgotPassword navigation={navigation} />)
    fireEvent.click(screen.getByRole('button', { name: 'Footer link' }))
    expect(logSpy).toHaveBeenCalledWith('Footer link:', 'privacidad')
    logSpy.mockRestore()
  })

  it('deshabilita el botón mientras la API no responde', async () => {
    api.post.mockReturnValueOnce(new Promise(() => {})) // nunca resuelve
    render(<ForgotPassword navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'carga@example.com' },
    })
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
    fireEvent.click(submitButton)

    // El botón enviar debe estar deshabilitado mientras carga
    await waitFor(() => expect(submitButton.disabled).toBe(true))
  })

  it('usa err.message real cuando no hay response', async () => {
    const err = new Error('Conexión rechazada')
    api.post.mockRejectedValueOnce(err)
    render(<ForgotPassword navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'x@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Conexión rechazada')
    })
  })

  it('rechaza email con sólo espacios (trim vacío)', () => {
    render(<ForgotPassword navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Ingresa un email válido')
    expect(api.post).not.toHaveBeenCalled()
  })
})
