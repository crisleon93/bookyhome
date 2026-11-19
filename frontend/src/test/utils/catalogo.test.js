import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  categoriaColor,
  parseTiendaInfo,
  resolveImageUrl,
  resolveLibroCandidate,
  tiempoTranscurrido,
} from '../../utils/catalogo'

vi.mock('../../services/api', () => ({
  getApiBaseUrl: () => 'https://api.example.test',
}))

afterEach(() => {
  vi.useRealTimers()
})

describe('catalogo helpers', () => {
  it('selects normalized category colors in light and dark themes', () => {
    const categories = [
      ['Terror', '#603a92', '#b48ce8'],
      ['Ciencia científica', '#1f7a45', '#4ade80'],
      ['Romance', '#b4235d', '#f472b6'],
      ['Fantasía', '#4156a6', '#818cf8'],
      ['Historia', '#8c5a1d', '#fbbf24'],
      ['Tecnología', '#137783', '#22d3ee'],
      ['Juvenil', '#a25d00', '#fcd34d'],
      ['Infantil', '#2775a7', '#60a5fa'],
      ['Aventura', '#b85f11', '#fb923c'],
      ['Arte', '#86418f', '#d8b4fe'],
      ['Biografía', '#365d96', '#7dd3fc'],
      ['Educación', '#397542', '#6ee7b7'],
      ['Ficción', '#8b0000', '#f87171'],
      ['Comedia', '#a25d00', '#fcd34d'],
    ]

    for (const [category, lightColor, darkColor] of categories) {
      expect(categoriaColor(category).color).toBe(lightColor)
      expect(categoriaColor(category, true).color).toBe(darkColor)
    }

    expect(categoriaColor('Comedia', false, false).color).toBe('#7a1e3a')
    expect(categoriaColor('Comedia', true, false).color).toBe('#e05a7a')
    expect(categoriaColor('Otra categoría').color).toBe('#7a1e3a')
    expect(categoriaColor('Otra categoría', true).color).toBe('#e05a7a')
  })

  it('cleans store addresses and normalizes supported Colombian cities', () => {
    const cities = [
      ['Bogota D.C.', 'Bogotá'],
      ['Medellin', 'Medellín'],
      ['Cali', 'Cali'],
      ['Barranquilla', 'Barranquilla'],
      ['Cartagena', 'Cartagena'],
      ['Santa Marta', 'Santa Marta'],
      ['Bucaramanga', 'Bucaramanga'],
      ['Pereira', 'Pereira'],
      ['Manizales', 'Manizales'],
      ['Armenia', 'Armenia'],
      ['Ibague', 'Ibagué'],
      ['Neiva', 'Neiva'],
      ['Villavicencio', 'Villavicencio'],
      ['Pasto', 'Pasto'],
      ['Popayan', 'Popayán'],
    ]

    for (const [inputCity, expectedCity] of cities) {
      expect(parseTiendaInfo({ ciudad_origen: inputCity }).ciudad).toBe(expectedCity)
    }

    expect(parseTiendaInfo({
      ciudad_origen: 'Colombia',
      direccion: 'Carrera 7, Bogotá',
      nombre_tienda: 'Librer??a Bogot??',
      descripcion: ' ',
    })).toEqual({
      ciudad: 'Bogotá',
      direccion: 'Carrera 7',
      descripcion: 'Librería asociada a BookyHome en Bogotá. Catálogo y novedades.',
      nombre: 'Librería Bogotá',
    })
    expect(parseTiendaInfo({ direccion: 'Calle 1, Medellin' })).toMatchObject({
      ciudad: 'Medellín',
      direccion: 'Calle 1',
    })
    expect(parseTiendaInfo({ ciudad_origen: 'Colombia', descripcion: 'En Colombia, libros para todos' }).ciudad).toBe('Bogotá')
    expect(parseTiendaInfo({ ciudad_origen: 'Tunja', direccion: 'Calle 3', descripcion: 'Una librería' })).toMatchObject({
      ciudad: 'Tunja',
      direccion: 'Calle 3',
      descripcion: 'Una librería',
    })
  })

  it('formats elapsed times at minute, hour, day and month boundaries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'))

    expect(tiempoTranscurrido()).toBeNull()
    expect(tiempoTranscurrido('2026-03-20T11:59:00Z')).toBe('hace 1 min')
    expect(tiempoTranscurrido('2026-03-20T10:00:00Z')).toBe('hace 2 h')
    expect(tiempoTranscurrido('2026-03-19T12:00:00Z')).toBe('hace 1 día')
    expect(tiempoTranscurrido('2026-03-18T12:00:00Z')).toBe('hace 2 días')
    expect(tiempoTranscurrido('2026-02-15T12:00:00Z')).toBe('hace 1 mes')
    expect(tiempoTranscurrido('2025-12-10T12:00:00Z')).toBe('hace 3 meses')
  })

  it('resolves absolute and API-relative images and searches candidate lists', () => {
    expect(resolveImageUrl(null)).toBeNull()
    expect(resolveImageUrl(5)).toBeNull()
    expect(resolveImageUrl('   ')).toBeNull()
    expect(resolveImageUrl(' https://cdn.example.test/book.png ')).toBe('https://cdn.example.test/book.png')
    expect(resolveImageUrl('http://cdn.example.test/book.png')).toBe('http://cdn.example.test/book.png')
    expect(resolveImageUrl('/uploads/book.png')).toBe('https://api.example.test/uploads/book.png')
    expect(resolveImageUrl('uploads/book.png')).toBe('https://api.example.test/uploads/book.png')

    expect(resolveLibroCandidate(null)).toBeNull()
    expect(resolveLibroCandidate([' ', '/uploads/first.png', 'https://cdn.example.test/second.png']))
      .toBe('https://api.example.test/uploads/first.png')
    expect(resolveLibroCandidate(['', null])).toBeNull()
    expect(resolveLibroCandidate(' , /uploads/cover.png, https://cdn.example.test/other.png'))
      .toBe('https://api.example.test/uploads/cover.png')
    expect(resolveLibroCandidate(' , ')).toBeNull()
    expect(resolveLibroCandidate('relative/cover.png')).toBe('https://api.example.test/relative/cover.png')
  })
})
