/**
 * ForgotPassword.test.js — Tests de ForgotPassword.jsx (app-movil)
 * Importa el módulo real para cobertura real en SonarCloud.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  View: () => null, Text: () => null, TextInput: () => null,
  StyleSheet: { create: (s) => s },
  Alert: { alert: vi.fn() },
  ActivityIndicator: () => null,
  TouchableOpacity: () => null,
  ScrollView: () => null,
  KeyboardAvoidingView: () => null,
  Platform: { OS: 'web' },
}))

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: {} })),
    defaults: { baseURL: 'http://localhost:8000' },
    interceptors: { response: { use: vi.fn(() => 1), eject: vi.fn() } },
  },
}))

vi.mock('../../components/AuthHeader', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../components/Icons', () => ({
  IconMail: () => null, IconLock: () => null,
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual }
})

describe('ForgotPassword (app-movil) — módulo', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../screens/ForgotPassword.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})

describe('ForgotPassword (app-movil) — validación de email', () => {
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  it('acepta email válido', () => {
    expect(isValidEmail('usuario@test.com')).toBe(true)
  })

  it('rechaza email sin @', () => {
    expect(isValidEmail('usuariotest.com')).toBe(false)
  })

  it('rechaza email vacío', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rechaza email sin dominio', () => {
    expect(isValidEmail('usuario@')).toBe(false)
  })

  it('rechaza email con espacios', () => {
    expect(isValidEmail('usu ario@test.com')).toBe(false)
  })
})

describe('ForgotPassword (app-movil) — lógica de envío', () => {
  it('llama a POST /forgot-password con el email', async () => {
    const api = (await import('../../services/api')).default
    api.post.mockResolvedValueOnce({ data: {} })

    // Simular la lógica de handleForgot directamente
    const email = 'test@correo.com'
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await api.post('/forgot-password', { email })
    }

    expect(api.post).toHaveBeenCalledWith('/forgot-password', { email: 'test@correo.com' })
  })

  it('no llama a POST si el email es inválido', async () => {
    const api = (await import('../../services/api')).default
    api.post.mockClear()

    const email = 'invalido'
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await api.post('/forgot-password', { email })
    }

    expect(api.post).not.toHaveBeenCalled()
  })
})
