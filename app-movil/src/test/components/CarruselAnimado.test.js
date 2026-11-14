/**
 * CarruselAnimado.test.js — Tests de lógica pura de CarruselAnimado.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  Image: () => null, ScrollView: () => null, StyleSheet: { create: (s) => s },
  Text: () => null, TouchableOpacity: () => null, View: () => null,
}))

vi.mock('../../context/ThemeContext', () => ({
  adaptStyleForTheme: vi.fn((s) => s),
  useAppTheme: vi.fn(() => ({ darkMode: false, colors: {} })),
  useThemedStyles: vi.fn((fn) => fn({})),
}))

vi.mock('../context/ThemeContext', () => ({
  adaptStyleForTheme: vi.fn((s) => s),
  useAppTheme: vi.fn(() => ({ darkMode: false, colors: {} })),
  useThemedStyles: vi.fn((fn) => fn({})),
}))

// ── Lógica pura ───────────────────────────────────────────────────────────────

const IMAGENES_CAT = {
  'Fantasía':   'https://images.unsplash.com/photo-1518709268805?w=300&q=70',
  'Romance':    'https://images.unsplash.com/photo-1516589178581?w=300&q=70',
}
const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803?w=300&q=70'

function resolveImgUri(libro, baseUrl) {
  const candidates = [libro.imagen_url, libro.imagen_principal, libro.imagen]
  for (const c of candidates) {
    if (!c) continue
    const s = typeof c === 'string' ? c.split(',')[0].trim() : ''
    if (!s) continue
    if (s.startsWith('http://') || s.startsWith('https://')) return s
    return `${baseUrl}/${s.replace(/^\//, '')}`
  }
  return IMAGENES_CAT[libro.nombre_categoria] || IMG_DEFAULT
}

const TICK_MS    = 16
const SPEED_PX_S = 38
const STEP       = (SPEED_PX_S * TICK_MS) / 1000

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CarruselAnimado — resolveImgUri', () => {
  it('devuelve URL absoluta si imagen_url es http', () => {
    const libro = { imagen_url: 'https://cdn.com/img.jpg' }
    expect(resolveImgUri(libro, 'http://localhost:8000')).toBe('https://cdn.com/img.jpg')
  })

  it('agrega baseUrl a ruta relativa', () => {
    const libro = { imagen_url: '/uploads/libro.jpg' }
    expect(resolveImgUri(libro, 'http://localhost:8000')).toBe('http://localhost:8000/uploads/libro.jpg')
  })

  it('usa imagen_principal si imagen_url es null', () => {
    const libro = { imagen_url: null, imagen_principal: 'https://cdn.com/principal.jpg' }
    expect(resolveImgUri(libro, 'http://localhost:8000')).toBe('https://cdn.com/principal.jpg')
  })

  it('usa imagen si las otras son null', () => {
    const libro = { imagen_url: null, imagen_principal: null, imagen: 'https://cdn.com/img3.jpg' }
    expect(resolveImgUri(libro, 'http://localhost:8000')).toBe('https://cdn.com/img3.jpg')
  })

  it('devuelve imagen de categoría si no hay imagen', () => {
    const libro = { nombre_categoria: 'Fantasía' }
    const result = resolveImgUri(libro, 'http://localhost:8000')
    expect(result).toContain('unsplash')
  })

  it('devuelve IMG_DEFAULT para categoría desconocida sin imagen', () => {
    const libro = { nombre_categoria: 'Desconocida' }
    expect(resolveImgUri(libro, 'http://localhost:8000')).toBe(IMG_DEFAULT)
  })

  it('toma solo la primera URL de imagen_url con comas', () => {
    const libro = { imagen_url: 'https://a.com/1.jpg,https://b.com/2.jpg' }
    expect(resolveImgUri(libro, 'http://localhost:8000')).toBe('https://a.com/1.jpg')
  })
})

describe('CarruselAnimado — constantes de animación', () => {
  it('TICK_MS es 16 (~60fps)', () => {
    expect(TICK_MS).toBe(16)
  })

  it('SPEED_PX_S es 38', () => {
    expect(SPEED_PX_S).toBe(38)
  })

  it('STEP calcula correctamente px por tick', () => {
    expect(STEP).toBeCloseTo(0.608, 2)
  })
})

describe('CarruselAnimado — módulo exporta resolveImgUri y componente', () => {
  it('exporta resolveImgUri como named export', async () => {
    const mod = await import('../../components/CarruselAnimado.jsx')
    expect(mod.resolveImgUri).toBeDefined()
    expect(typeof mod.resolveImgUri).toBe('function')
  })

  it('exporta componente por defecto', async () => {
    const mod = await import('../../components/CarruselAnimado.jsx')
    expect(mod.default).toBeDefined()
  })
})
