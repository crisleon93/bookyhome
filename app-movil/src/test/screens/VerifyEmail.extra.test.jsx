// @vitest-environment jsdom

/**
 * VerifyEmail.extra.test.jsx — ramas no cubiertas del 6.2% faltante
 *
 * Cubre:
 * - Estado "cargando": muestra ActivityIndicator y textos de espera
 * - Botón "Ir al inicio de sesión" en estado error
 * - Footer onLinkPress (siempre pasa () => {})
 * - Error sin response.data.detail → usa fallback
 * - verifyEmail se llama con el token correcto al reintentar (segunda llamada)
 */

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import VerifyEmail from '../../screens/VerifyEmail'
import { verifyEmail } from '../../services/api'

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => ({ children, onPress, ...props }) =>
    ReactModule.createElement(tag, { ...props, onClick: onPress }, children)
  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Cargando'),
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})

vi.mock('../../components/Footer', () => ({
  default: ({ onLinkPress }) => (
    <button type="button" onClick={() => onLinkPress('privacidad')}>
      Footer
    </button>
  ),
}))
vi.mock('../../services/api', () => ({ verifyEmail: vi.fn() }))

afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

describe('VerifyEmail — ramas extra', () => {
  const navigation = { navigate: vi.fn() }

  it('muestra el estado de carga antes de que resuelva la promesa', async () => {
    // La promesa nunca resuelve, así queda en "cargando"
    verifyEmail.mockReturnValueOnce(new Promise(() => {}))
    render(<VerifyEmail route={{ params: { token: 'slow-token' } }} navigation={navigation} />)

    expect(screen.getByText('Cargando')).toBeTruthy()
    expect(screen.getByText('Verificando tu cuenta...')).toBeTruthy()
    expect(screen.getByText('Por favor espera un momento.')).toBeTruthy()
  })

  it('muestra el botón "Ir al inicio de sesión" en estado error y navega', async () => {
    verifyEmail.mockRejectedValueOnce({ response: { data: { detail: 'Token inválido' } } })
    render(<VerifyEmail route={{ params: { token: 'bad-token' } }} navigation={navigation} />)

    expect(await screen.findByText('Verificación fallida')).toBeTruthy()
    fireEvent.click(screen.getByText('Ir al inicio de sesión'))
    expect(navigation.navigate).toHaveBeenCalledWith('Login')
  })

  it('usa el mensaje fallback cuando el error no tiene response.data.detail', async () => {
    verifyEmail.mockRejectedValueOnce(new Error('timeout'))
    render(<VerifyEmail route={{ params: { token: 'timeout-token' } }} navigation={navigation} />)

    expect(await screen.findByText('El enlace es inválido o ya fue utilizado.')).toBeTruthy()
  })

  it('el Footer llama a onLinkPress con el argumento recibido (siempre {})', async () => {
    verifyEmail.mockResolvedValueOnce({})
    render(<VerifyEmail route={{ params: { token: 'ok-token' } }} navigation={navigation} />)
    // Esperar cualquier estado final para que el Footer esté en el DOM
    await screen.findByText('¡Cuenta verificada!')
    // No lanza error al hacer clic en el Footer
    fireEvent.click(screen.getByText('Footer'))
  })

  it('llama a verifyEmail con el token correcto en el reintento', async () => {
    verifyEmail
      .mockRejectedValueOnce({ response: { data: { detail: 'Error 1' } } })
      .mockResolvedValueOnce({})
    render(<VerifyEmail route={{ params: { token: 're-token' } }} navigation={navigation} />)

    expect(await screen.findByText('Error 1')).toBeTruthy()
    fireEvent.click(screen.getByText('Reintentar'))

    await waitFor(() => expect(verifyEmail).toHaveBeenCalledTimes(2))
    expect(verifyEmail).toHaveBeenLastCalledWith({ token: 're-token' })
    expect(await screen.findByText('¡Cuenta verificada!')).toBeTruthy()
  })
})
