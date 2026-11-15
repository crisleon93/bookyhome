/**
 * AuthContext.test.js — Tests de lógica pura de AuthContext.
 */

import React, { useContext } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
import api from '../../services/api'
import { AuthContext, AuthProvider } from '../../context/AuthContext'

vi.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: vi.fn(() => ({ remove: vi.fn() })) },
  Platform: { OS: 'web' },
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
    multiRemove: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(() => Promise.resolve(false)),
  isEnrolledAsync: vi.fn(() => Promise.resolve(false)),
  authenticateAsync: vi.fn(() => Promise.resolve({ success: false })),
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn((token) => {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid token')
    return JSON.parse(atob(parts[1]))
  }),
}))

vi.mock('../../services/api', () => ({
  default: {
    interceptors: { response: { use: vi.fn(() => 1), eject: vi.fn() } },
    defaults: { headers: { common: {} } },
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual }
})

// ── Lógica pura ───────────────────────────────────────────────────────────────

function decodeJwtPayload(token) {
  try {
    const { jwtDecode } = require('jwt-decode')
    return jwtDecode(token)
  } catch {
    return null
  }
}

function isTokenExpired(payload) {
  return !payload?.exp || payload.exp * 1000 <= Date.now()
}

function fakeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesig`
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthContext — isTokenExpired', () => {
  it('devuelve true si payload es null', () => {
    expect(isTokenExpired(null)).toBe(true)
  })

  it('devuelve true si no hay campo exp', () => {
    expect(isTokenExpired({ sub: '1' })).toBe(true)
  })

  it('devuelve true si el token ya expiró', () => {
    const payload = { exp: Math.floor(Date.now() / 1000) - 60 }
    expect(isTokenExpired(payload)).toBe(true)
  })

  it('devuelve false si el token es válido', () => {
    const payload = { exp: Math.floor(Date.now() / 1000) + 3600 }
    expect(isTokenExpired(payload)).toBe(false)
  })
})

describe('AuthContext — módulo exporta contexto y provider', () => {
  it('exporta AuthContext', async () => {
    const mod = await import('../../context/AuthContext.jsx')
    expect(mod.AuthContext).toBeDefined()
  })

  it('exporta AuthProvider', async () => {
    const mod = await import('../../context/AuthContext.jsx')
    expect(mod.AuthProvider).toBeDefined()
    expect(typeof mod.AuthProvider).toMatch(/function|object/)
  })
})

describe('AuthContext — estado inicial del contexto', () => {
  it('el contexto por defecto es un objeto', async () => {
    const { AuthContext } = await import('../../context/AuthContext.jsx')
    expect(AuthContext).toBeDefined()
    expect(typeof AuthContext).toBe('object')
  })
})

function AuthProbe() {
  const auth = useContext(AuthContext)
  return React.createElement('div', null,
    React.createElement('span', null, auth.loading ? 'loading' : 'ready'),
    React.createElement('span', null, auth.user?.nombre || 'anonymous'),
    React.createElement('span', null, auth.biometricLocked ? 'locked' : 'unlocked'),
    React.createElement('button', { onClick: () => auth.signIn(fakeJwt({
        sub: '12',
        nombre: 'Ana',
        rol: 'comprador',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }), { enableBiometrics: true }) }, 'sign in'),
    React.createElement('button', { onClick: () => auth.signOut() }, 'sign out'),
    React.createElement('button', { onClick: () => auth.setBiometricPreference(true) }, 'enable biometrics'),
    React.createElement('button', { onClick: async () => {
        const result = await auth.unlockWithBiometrics('face')
        document.querySelector('[data-result]').textContent = JSON.stringify(result)
      } }, 'unlock'),
    React.createElement('output', { 'data-result': '' }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  AsyncStorage.getItem.mockResolvedValue(null)
  AsyncStorage.setItem.mockResolvedValue(undefined)
  AsyncStorage.multiRemove.mockResolvedValue(undefined)
  LocalAuthentication.hasHardwareAsync.mockResolvedValue(false)
  LocalAuthentication.isEnrolledAsync.mockResolvedValue(false)
  LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false })
  api.defaults.headers.common = {}
})

afterEach(cleanup)

describe('AuthProvider — comportamiento de sesión', () => {
  it('inicia sesión, persiste el token y limpia la sesión al salir', async () => {
    render(React.createElement(AuthProvider, null, React.createElement(AuthProbe)))
    expect(await screen.findByText('ready')).toBeTruthy()
    fireEvent.click(screen.getByText('sign in'))

    expect(await screen.findByText('Ana')).toBeTruthy()
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', expect.any(String)))
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometricEnabled', 'true')
    expect(api.defaults.headers.common.Authorization).toMatch(/^Bearer /)

    fireEvent.click(screen.getByText('sign out'))
    await waitFor(() => expect(screen.getByText('anonymous')).toBeTruthy())
    expect(screen.getByText('locked')).toBeTruthy()
    expect(api.defaults.headers.common.Authorization).toBeUndefined()
    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled()
  })

  it('bloquea un token restaurado y lo desbloquea con biometría disponible', async () => {
    const restoredToken = fakeJwt({
      sub: '20',
      nombre: 'Luis',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
    AsyncStorage.getItem.mockImplementation(async (key) => (
      key === 'token' ? restoredToken : 'true'
    ))
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true)
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true)
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true })

    render(React.createElement(AuthProvider, null, React.createElement(AuthProbe)))
    expect(await screen.findByText('locked')).toBeTruthy()
    expect(screen.getByText('anonymous')).toBeTruthy()
    fireEvent.click(screen.getByText('unlock'))

    expect(await screen.findByText('Luis')).toBeTruthy()
    expect(await screen.findByText('unlocked')).toBeTruthy()
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(expect.objectContaining({
      promptMessage: 'Desbloquea BookyHome con Face Unlock',
      disableDeviceFallback: true,
    }))
  })

  it('elimina tokens expirados durante la restauración', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => (
      key === 'token' ? fakeJwt({ exp: Math.floor(Date.now() / 1000) - 60 }) : 'false'
    ))
    render(React.createElement(AuthProvider, null, React.createElement(AuthProbe)))

    expect(await screen.findByText('ready')).toBeTruthy()
    expect(screen.getByText('anonymous')).toBeTruthy()
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['token', 'biometricEnabled'])
  })

  it('persiste el cambio de preferencia biométrica', async () => {
    render(React.createElement(AuthProvider, null, React.createElement(AuthProbe)))
    await screen.findByText('ready')

    fireEvent.click(screen.getByText('enable biometrics'))
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometricEnabled', 'true'))
  })

  it('informa por qué no puede desbloquear una sesión biométrica', async () => {
    const restoredToken = fakeJwt({ sub: '20', nombre: 'Luis', exp: Math.floor(Date.now() / 1000) + 3600 })
    AsyncStorage.getItem.mockImplementation(async (key) => key === 'token' ? restoredToken : 'true')
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(false)
    render(React.createElement(AuthProvider, null, React.createElement(AuthProbe)))
    await screen.findByText('locked')

    fireEvent.click(screen.getByText('unlock'))
    await waitFor(() => expect(document.querySelector('[data-result]').textContent).toBe(JSON.stringify({ success: false, reason: 'no_hardware' })))

    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true)
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(false)
    fireEvent.click(screen.getByText('unlock'))
    await waitFor(() => expect(document.querySelector('[data-result]').textContent).toBe(JSON.stringify({ success: false, reason: 'not_enrolled' })))
  })

  it('distingue cancelación y fallo de la autenticación biométrica', async () => {
    const restoredToken = fakeJwt({ sub: '20', nombre: 'Luis', exp: Math.floor(Date.now() / 1000) + 3600 })
    AsyncStorage.getItem.mockImplementation(async (key) => key === 'token' ? restoredToken : 'true')
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true)
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true)
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' })
    render(React.createElement(AuthProvider, null, React.createElement(AuthProbe)))
    await screen.findByText('locked')

    fireEvent.click(screen.getByText('unlock'))
    await waitFor(() => expect(document.querySelector('[data-result]').textContent).toBe(JSON.stringify({ success: false, reason: 'cancelled' })))

    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false, error: 'denied' })
    fireEvent.click(screen.getByText('unlock'))
    await waitFor(() => expect(document.querySelector('[data-result]').textContent).toBe(JSON.stringify({ success: false, reason: 'failed', error: 'denied' })))
  })
})
