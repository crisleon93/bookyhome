// @vitest-environment jsdom

/**
 * ResetPassword.extra.test.jsx — ramas no cubiertas del 3.4% faltante
 *
 * Cubre:
 * - ActivityIndicator visible mientras carga (cargando = true)
 * - Footer onLinkPress (siempre () => {})
 * - Error sin response.data.detail → usa fallback
 * - Solo password corto (confirmar coincide) → solo el primer error
 * - Solo confirmar distinto → solo el segundo error
 * - Platform.OS branch: behavior = undefined en web (ya cubierto por mock web,
 *   este test verifica que el componente renderiza igual)
 */

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
        onChange: (e) => onChangeText?.(e.target.value),
      })
    }
    return ReactModule.createElement(tag, null, children)
  }
  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Cargando'),
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
vi.mock('../../components/Footer', () => ({
  default: ({ onLinkPress }) => (
    <button type="button" onClick={() => onLinkPress('terminos')}>
      Footer
    </button>
  ),
}))

describe('ResetPassword móvil — ramas extra', () => {
  const navigation = { navigate: mocks.navigate }

  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('muestra ActivityIndicator mientras carga', async () => {
    mocks.resetPassword.mockReturnValueOnce(new Promise(() => {})) // nunca resuelve
    render(<ResetPassword route={{ params: { token: 'tok' } }} navigation={navigation} />)

    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'ValidPass!' } })
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'ValidPass!' } })
    fireEvent.click(screen.getByText('Cambiar contraseña'))

    expect(await screen.findByText('Cargando')).toBeTruthy()
  })

  it('usa fallback cuando el error no tiene response.data.detail', async () => {
    mocks.resetPassword.mockRejectedValueOnce(new Error('network'))
    render(<ResetPassword route={{ params: { token: 'tok' } }} navigation={navigation} />)

    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'ValidPass!' } })
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'ValidPass!' } })
    fireEvent.click(screen.getByText('Cambiar contraseña'))

    await waitFor(() =>
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'El enlace es inválido o ha expirado.')
    )
  })

  it('solo muestra error de longitud cuando confirmar coincide pero es corto', () => {
    render(<ResetPassword route={{ params: { token: 'tok' } }} navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'short' } })
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'short' } })
    fireEvent.click(screen.getByText('Cambiar contraseña'))

    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy()
    expect(screen.queryByText('Las contraseñas no coinciden')).toBeNull()
  })

  it('solo muestra error de coincidencia cuando password es largo pero confirmar difiere', () => {
    render(<ResetPassword route={{ params: { token: 'tok' } }} navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'LongPassword!' } })
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'OtroPassword!' } })
    fireEvent.click(screen.getByText('Cambiar contraseña'))

    expect(screen.queryByText('La contraseña debe tener al menos 8 caracteres')).toBeNull()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy()
  })

  it('el Footer llama onLinkPress sin lanzar error', async () => {
    mocks.resetPassword.mockResolvedValueOnce({})
    render(<ResetPassword route={{ params: { token: 'tok' } }} navigation={navigation} />)
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'ValidPass!' } })
    fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'ValidPass!' } })
    fireEvent.click(screen.getByText('Cambiar contraseña'))
    await screen.findByText('Contraseña actualizada')

    // Footer aparece en el estado de éxito también
    fireEvent.click(screen.getByText('Footer'))
    // No debe lanzar
  })
})
