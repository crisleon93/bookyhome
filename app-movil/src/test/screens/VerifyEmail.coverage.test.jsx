// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import VerifyEmail from '../../screens/VerifyEmail'
import { verifyEmail } from '../../services/api'

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => ({ children, onPress, ...props }) => ReactModule.createElement(tag, {
    ...props,
    onClick: onPress,
  }, children)
  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Cargando'),
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../services/api', () => ({ verifyEmail: vi.fn() }))

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VerifyEmail', () => {
  const navigation = { navigate: vi.fn() }

  it('informa si el enlace no incluye token', async () => {
    render(<VerifyEmail route={{ params: {} }} navigation={navigation} />)

    expect(await screen.findByText('Verificación fallida')).toBeTruthy()
    expect(screen.getByText(/No se encontró un token de verificación/)).toBeTruthy()
    expect(verifyEmail).not.toHaveBeenCalled()
  })

  it('verifica el token y navega al inicio de sesión', async () => {
    verifyEmail.mockResolvedValueOnce({})
    render(<VerifyEmail route={{ params: { token: 'valid-token' } }} navigation={navigation} />)

    expect(await screen.findByText('¡Cuenta verificada!')).toBeTruthy()
    expect(verifyEmail).toHaveBeenCalledWith({ token: 'valid-token' })
    fireEvent.click(screen.getByText('Iniciar sesión'))
    expect(navigation.navigate).toHaveBeenCalledWith('Login')
  })

  it('muestra errores del servicio y permite reintentar', async () => {
    verifyEmail
      .mockRejectedValueOnce({ response: { data: { detail: 'Token vencido' } } })
      .mockResolvedValueOnce({})
    render(<VerifyEmail route={{ params: { token: 'expired-token' } }} navigation={navigation} />)

    expect(await screen.findByText('Token vencido')).toBeTruthy()
    fireEvent.click(screen.getByText('Reintentar'))
    await waitFor(() => expect(verifyEmail).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('¡Cuenta verificada!')).toBeTruthy()
  })
})
