// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Login from '../../screens/Login'
import { AuthContext } from '../../context/AuthContext'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  apiPost: vi.fn(),
  hasHardwareAsync: vi.fn(),
  isEnrolledAsync: vi.fn(),
  setBiometricPreference: vi.fn(),
  signIn: vi.fn(),
  supportedAuthenticationTypesAsync: vi.fn(),
  unlockWithBiometrics: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const nativeElement = (tag) => function NativeElement({
    children,
    accessibilityLabel,
    disabled,
    onChangeText,
    onPress,
    placeholder,
    secureTextEntry,
    value,
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        'aria-label': accessibilityLabel,
        disabled,
        onClick: onPress,
      }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        'aria-label': accessibilityLabel,
        placeholder,
        type: secureTextEntry ? 'password' : 'text',
        value: value ?? '',
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    return ReactModule.createElement(tag, null, children)
  }
  return {
    ActivityIndicator: nativeElement('span'),
    Alert: { alert: mocks.alert },
    KeyboardAvoidingView: nativeElement('div'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children)
      : null,
    Platform: { OS: 'web' },
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (styles) => styles },
    Text: nativeElement('span'),
    TextInput: nativeElement('input'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  }
})

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}))

vi.mock('expo-local-authentication', () => ({
  AuthenticationType: { FACIAL_RECOGNITION: 1, FINGERPRINT: 2 },
  hasHardwareAsync: mocks.hasHardwareAsync,
  isEnrolledAsync: mocks.isEnrolledAsync,
  supportedAuthenticationTypesAsync: mocks.supportedAuthenticationTypesAsync,
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn(), setItem: vi.fn() },
}))
vi.mock('lottie-react-native', () => ({ default: () => null }))
vi.mock('../../services/api', () => ({ default: { post: mocks.apiPost } }))
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { AuthContext: ReactModule.createContext({}) }
})
vi.mock('../../components/AuthHeader', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../components/Icons', () => ({
  IconEye: () => <span>eye</span>,
  IconEyeOff: () => <span>eye-off</span>,
  IconGoogle: () => null,
  IconLock: () => null,
  IconMail: () => null,
}))

const normalAuth = {
  biometricEnabled: false,
  biometricLocked: false,
  pendingToken: null,
  setBiometricPreference: mocks.setBiometricPreference,
  signIn: mocks.signIn,
  unlockWithBiometrics: mocks.unlockWithBiometrics,
}

function renderLogin(auth = normalAuth) {
  return render(
    <AuthContext.Provider value={auth}>
      <Login navigation={{ navigate: vi.fn() }} />
    </AuthContext.Provider>,
  )
}

function fillCredentials() {
  fireEvent.change(screen.getByPlaceholderText('ejemplo@gmail.com'), {
    target: { value: '  lector@example.com  ' },
  })
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
    target: { value: 'secreto' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.hasHardwareAsync.mockResolvedValue(true)
  mocks.isEnrolledAsync.mockResolvedValue(true)
  mocks.supportedAuthenticationTypesAsync.mockResolvedValue([1, 2])
  mocks.apiPost.mockResolvedValue({ data: { access_token: 'login-token' } })
  mocks.setBiometricPreference.mockResolvedValue(undefined)
  mocks.signIn.mockResolvedValue(undefined)
  mocks.unlockWithBiometrics.mockResolvedValue({ success: true })
})

afterEach(cleanup)

describe('Login móvil', () => {
  it('valida campos requeridos y alterna la visibilidad de la contraseña', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('Ingresa email y contraseña')).toBeTruthy()
    expect(mocks.apiPost).not.toHaveBeenCalled()

    const password = screen.getByPlaceholderText('Contraseña')
    fireEvent.click(screen.getByRole('button', { name: 'eye' }))
    expect(screen.getByPlaceholderText('Contraseña').type).toBe('text')
  })

  it('inicia sesión con el correo recortado y traduce errores de validación', async () => {
    renderLogin()
    fillCredentials()
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith('/login', {
        email: 'lector@example.com',
        password: 'secreto',
      })
      expect(mocks.signIn).toHaveBeenCalledWith('login-token', { enableBiometrics: false })
    })

    cleanup()
    mocks.apiPost.mockRejectedValueOnce({
      response: { status: 422, data: { detail: 'email inválido' } },
    })
    renderLogin()
    fillCredentials()
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('El correo electrónico no tiene un formato válido.')).toBeTruthy()
  })

  it('ofrece métodos biométricos cuando hay una sesión guardada', async () => {
    renderLogin({
      ...normalAuth,
      biometricEnabled: true,
      pendingToken: 'saved-token',
    })
    const biometricButton = await screen.findByRole('button', {
      name: 'Ingresar con Huella o Face ID',
    })
    fireEvent.click(biometricButton)

    expect(await screen.findByText('Elige un método')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Face ID' }))
    await waitFor(() => expect(mocks.unlockWithBiometrics).toHaveBeenCalledWith('face'))
  })

  it('guarda el token pendiente al activar biometría en el inicio de sesión', async () => {
    renderLogin()
    fillCredentials()
    fireEvent.click(await screen.findByText('Usar Face ID / Huella'))
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => expect(mocks.setBiometricPreference).toHaveBeenCalledWith(true))
    expect(await screen.findByText('Huella registrada')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith('login-token', { enableBiometrics: true })
    })
  })
})
