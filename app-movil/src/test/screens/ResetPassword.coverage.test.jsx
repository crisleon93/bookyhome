// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ResetPassword from '../../screens/ResetPassword'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  resetPassword: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const makeElement = (tag) => ({ children, onPress, onChangeText, value, placeholder, secureTextEntry, disabled }) => {
    if (tag === 'button') {
      return ReactModule.createElement('button', { type: 'button', onClick: onPress, disabled }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        type: secureTextEntry ? 'password' : 'text',
        disabled,
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    return ReactModule.createElement(tag, null, children)
  }
  return {
    ActivityIndicator: makeElement('span'),
    Alert: { alert: mocks.alert },
    KeyboardAvoidingView: makeElement('div'),
    Platform: { OS: 'web' },
    ScrollView: makeElement('div'),
    StyleSheet: { create: (styles) => styles },
    Text: makeElement('span'),
    TextInput: makeElement('input'),
    TouchableOpacity: makeElement('button'),
    View: makeElement('div'),
  }
})

vi.mock('../../services/api', () => ({ resetPassword: mocks.resetPassword }))
vi.mock('../../components/Footer', () => ({ default: () => null }))

describe('ResetPassword', () => {
  const navigation = { navigate: mocks.navigate }

  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('solicita un enlace nuevo cuando no recibe token', () => {
    render(<ResetPassword route={{ params: {} }} navigation={navigation} />)

    expect(screen.getByText('Enlace inválido')).toBeTruthy()
    fireEvent.click(screen.getByText('Solicitar nuevo enlace'))
    expect(mocks.navigate).toHaveBeenCalledWith('ForgotPassword')
    expect(mocks.resetPassword).not.toHaveBeenCalled()
  })

  it('valida longitud y coincidencia antes de llamar al servicio', () => {
    render(<ResetPassword route={{ params: { token: 'valid-token' } }} navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'short' } })
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'different' } })
    fireEvent.click(screen.getByText('Cambiar contraseña'))

    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy()
    expect(mocks.resetPassword).not.toHaveBeenCalled()
  })

  it('envía token y nueva contraseña, y permite ir al inicio de sesión', async () => {
    mocks.resetPassword.mockResolvedValueOnce({})
    render(<ResetPassword route={{ params: { token: 'reset-token' } }} navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'new-password' } })
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'new-password' } })
    fireEvent.click(screen.getByText('Cambiar contraseña'))

    await screen.findByText('Contraseña actualizada')
    expect(mocks.resetPassword).toHaveBeenCalledWith({ token: 'reset-token', nueva_password: 'new-password' })
    fireEvent.click(screen.getByText('Ir al inicio de sesión'))
    expect(mocks.navigate).toHaveBeenCalledWith('Login')
  })

  it('muestra el error del servidor si el enlace ya expiró', async () => {
    mocks.resetPassword.mockRejectedValueOnce({ response: { data: { detail: 'Token expirado' } } })
    render(<ResetPassword route={{ params: { token: 'expired-token' } }} navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'new-password' } })
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'new-password' } })
    fireEvent.click(screen.getByText('Cambiar contraseña'))

    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'Token expirado'))
    expect(screen.getByText('Cambiar contraseña')).toBeTruthy()
  })
})
