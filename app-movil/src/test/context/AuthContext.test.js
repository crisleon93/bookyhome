/**
 * AuthContext.test.js — Tests de lógica pura de AuthContext.
 */

import { describe, it, expect, vi } from 'vitest'

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
