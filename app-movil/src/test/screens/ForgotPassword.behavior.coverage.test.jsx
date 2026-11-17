// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPassword from '../../screens/ForgotPassword'
import api from '../../services/api'
import { Alert } from 'react-native'

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    ActivityIndicator: () => <span>Procesando</span>,
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
        onChange={(event) => onChangeText(event.target.value)}
        placeholder={placeholder}
      />
    ),
    TouchableOpacity: ({ children, onPress, disabled }) => (
      <button type="button" onClick={onPress} disabled={disabled}>{children}</button>
    ),
    View: ({ children }) => <div>{children}</div>,
  }
})

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}))
vi.mock('../../services/api', () => ({
  default: { post: vi.fn() },
}))
vi.mock('../../components/AuthHeader', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../components/Icons', () => ({
  IconMail: () => null,
  IconLock: () => null,
}))

describe('ForgotPassword móvil: flujos reales', () => {
  const navigation = { goBack: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    api.post.mockResolvedValue({ data: {} })
  })

  afterEach(cleanup)

  it('rechaza correo vacío o inválido sin llamar a la API', () => {
    render(<ForgotPassword navigation={navigation} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(Alert.alert).toHaveBeenLastCalledWith('Error', 'Ingresa un email válido')
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'correo-invalido' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(Alert.alert).toHaveBeenCalledTimes(2)
    expect(api.post).not.toHaveBeenCalled()
    expect(navigation.goBack).not.toHaveBeenCalled()
  })

  it('envía email válido, confirma y regresa a la pantalla anterior', async () => {
    render(<ForgotPassword navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'persona@example.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/forgot-password',
        { email: 'persona@example.test' },
      )
    })
    expect(Alert.alert).toHaveBeenCalledWith(
      'Enviado',
      'Si el email existe, recibirás un enlace de recuperación.',
    )
    expect(navigation.goBack).toHaveBeenCalledOnce()
  })

  it('muestra errores del servidor y libera el estado de carga', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { detail: 'Servidor temporalmente ocupado' } },
    })
    render(<ForgotPassword navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'persona@example.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Servidor temporalmente ocupado')
    })
    expect(screen.getByRole('button', { name: 'Enviar enlace' }).disabled).toBe(false)
    expect(navigation.goBack).not.toHaveBeenCalled()
  })

  it('usa mensaje genérico si el error no incluye respuesta ni mensaje', async () => {
    api.post.mockRejectedValueOnce({})
    render(<ForgotPassword navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
      target: { value: 'persona@example.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'Error'))
  })
})
