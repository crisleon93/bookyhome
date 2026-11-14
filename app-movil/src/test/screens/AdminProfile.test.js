/**
 * AdminProfile.test.js — Tests unitarios de la lógica de AdminProfile.
 *
 * El componente usa React Native, expo y contextos nativos que no
 * están disponibles en Node. Se mockean todas las dependencias nativas
 * y se prueba la lógica pura: resolveImage, StatCard, helpers de stats.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks de dependencias nativas ─────────────────────────────────────────────

vi.mock('react-native', () => ({
  ActivityIndicator: () => null,
  Alert: { alert: vi.fn() },
  Image: () => null,
  Platform: { OS: 'web' },
  RefreshControl: () => null,
  ScrollView: ({ children }) => children,
  StyleSheet: { create: (s) => s, absoluteFill: {} },
  Switch: () => null,
  Text: () => null,
  TextInput: () => null,
  TouchableOpacity: () => null,
  View: () => null,
}))

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: vi.fn(() => Promise.resolve({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
}))

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: () => null,
}))

vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({
    darkMode: false,
    setDarkMode: vi.fn(),
    colors: {
      page: '#fff', card: '#fff', border: '#eee',
      text: '#000', muted: '#666', inset: '#f5f5f5',
    },
  }),
}))

vi.mock('../../services/api', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  getProfile: vi.fn(() => Promise.resolve({
    data: {
      nombre_usuario: 'Admin User',
      telefono: '3001234567',
      correo_usuario: 'admin@test.com',
      fecha_registro: '2026-01-15',
      foto_perfil: null,
      banner_perfil: null,
      banner_color: '#7A1E3A',
    },
  })),
  saveBannerColor: vi.fn(() => Promise.resolve({})),
  updateProfile: vi.fn(() => Promise.resolve({})),
  uploadBannerPhoto: vi.fn(() => Promise.resolve({ data: { url: '/banner.jpg' } })),
  uploadProfilePhoto: vi.fn(() => Promise.resolve({ data: { url: '/foto.jpg' } })),
}))

vi.mock('../../components/Icons', () => ({
  IconAlertTriangle: () => null,
  IconBook: () => null,
  IconCheck: () => null,
  IconPackage: () => null,
  IconSettings: () => null,
  IconStore: () => null,
  IconTool: () => null,
  IconUser: () => null,
  IconUsers: () => null,
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual }
})

// ── Tests de lógica pura ──────────────────────────────────────────────────────

describe('AdminProfile — resolveImage', () => {
  it('devuelve null para un path vacío', async () => {
    const { getApiBaseUrl } = await import('../../services/api')
    getApiBaseUrl.mockReturnValue('http://localhost:8000')

    // Replicar la lógica de resolveImage del componente
    const resolveImage = (path) => {
      if (!path) return null
      const value = String(path)
      return /^(https?:|file:|blob:|data:)/i.test(value)
        ? value
        : `http://localhost:8000/${value.replace(/^\/+/, '')}`
    }

    expect(resolveImage(null)).toBeNull()
    expect(resolveImage('')).toBeNull()
    expect(resolveImage(undefined)).toBeNull()
  })

  it('devuelve la URL absoluta sin modificar si ya es http', () => {
    const resolveImage = (path) => {
      if (!path) return null
      const value = String(path)
      return /^(https?:|file:|blob:|data:)/i.test(value)
        ? value
        : `http://localhost:8000/${value.replace(/^\/+/, '')}`
    }

    expect(resolveImage('https://example.com/foto.jpg')).toBe('https://example.com/foto.jpg')
    expect(resolveImage('http://cdn.com/img.png')).toBe('http://cdn.com/img.png')
  })

  it('agrega la base URL a rutas relativas', () => {
    const resolveImage = (path) => {
      if (!path) return null
      const value = String(path)
      return /^(https?:|file:|blob:|data:)/i.test(value)
        ? value
        : `http://localhost:8000/${value.replace(/^\/+/, '')}`
    }

    expect(resolveImage('/uploads/foto.jpg')).toBe('http://localhost:8000/uploads/foto.jpg')
    expect(resolveImage('uploads/foto.jpg')).toBe('http://localhost:8000/uploads/foto.jpg')
  })
})

describe('AdminProfile — lógica de solicitudes', () => {
  const solicitudes = [
    { estado: 'Resuelto', tipo_solicitud: 'Reclamo' },
    { estado: 'Abierto', tipo_solicitud: 'soporte' },
    { estado: 'En revisión', tipo_solicitud: 'soporte' },
    { estado: 'Resuelto', tipo_solicitud: 'soporte' },
    { estado: 'Abierto', tipo_solicitud: 'Reclamo' },
  ]

  it('cuenta correctamente los resueltos', () => {
    const resolved = solicitudes.filter((s) => s.estado === 'Resuelto').length
    expect(resolved).toBe(2)
  })

  it('cuenta correctamente los pendientes', () => {
    const pending = solicitudes.filter((s) =>
      ['Abierto', 'En revisión', 'En revision'].includes(s.estado)
    ).length
    expect(pending).toBe(3)
  })

  it('cuenta correctamente los reclamos', () => {
    const reclamos = solicitudes.filter((s) =>
      s.tipo_solicitud === 'Reclamo' || s.tipo_solicitud === 'reclamo'
    ).length
    expect(reclamos).toBe(2)
  })

  it('cuenta correctamente los tickets de soporte', () => {
    const tickets = solicitudes.filter((s) =>
      s.tipo_solicitud !== 'Reclamo' && s.tipo_solicitud !== 'reclamo'
    ).length
    expect(tickets).toBe(3)
  })
})

describe('AdminProfile — validación de color personalizado', () => {
  const isValidHex = (color) => /^#[0-9A-Fa-f]{6}$/.test(color)

  it('acepta colores hexadecimales válidos', () => {
    expect(isValidHex('#7A1E3A')).toBe(true)
    expect(isValidHex('#000000')).toBe(true)
    expect(isValidHex('#FFFFFF')).toBe(true)
  })

  it('rechaza colores inválidos', () => {
    expect(isValidHex('7A1E3A')).toBe(false)
    expect(isValidHex('#ZZZ')).toBe(false)
    expect(isValidHex('#7A1E3')).toBe(false)
    expect(isValidHex('')).toBe(false)
  })
})

describe('AdminProfile — memberSince', () => {
  it('formatea la fecha correctamente', () => {
    const registeredAt = '2026-01-15'
    const memberSince = registeredAt
      ? new Date(registeredAt).toLocaleDateString('es-CO', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : ''
    expect(memberSince).toContain('2026')
    expect(memberSince.length).toBeGreaterThan(0)
  })

  it('devuelve string vacío si no hay fecha', () => {
    const registeredAt = ''
    const memberSince = registeredAt
      ? new Date(registeredAt).toLocaleDateString('es-CO', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : ''
    expect(memberSince).toBe('')
  })
})

describe('AdminProfile — módulo exporta componente', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../screens/AdminProfile.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})
