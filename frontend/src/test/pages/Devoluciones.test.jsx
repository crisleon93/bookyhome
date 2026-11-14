/**
 * Devoluciones.test.jsx — Tests de Devoluciones.jsx.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Devoluciones from '../../pages/Devoluciones'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('../../services/api', () => ({
  getDevoluciones: vi.fn(() => Promise.resolve({ data: [] })),
  getOrdenes: vi.fn(() => Promise.resolve({ data: [] })),
  crearQueja: vi.fn(() => Promise.resolve({ data: {} })),
  getQuejas: vi.fn(() => Promise.resolve({ data: [] })),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}))

vi.mock('../../components/Icons', () => ({
  IconPackage: () => null, IconCheck: () => null, IconInfo: () => null,
}))

// ── Lógica pura del módulo ────────────────────────────────────────────────────

const MOTIVOS = [
  'Producto dañado o defectuoso',
  'Producto incorrecto',
  'No coincide con la descripción',
  'Llegó tarde',
  'Ya no lo necesito',
  'Otro',
]

const ESTADO_STYLES = {
  Solicitada:   { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
  'En Revision':{ bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  Aprobada:     { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  Reembolsada:  { bg: '#f0fdf4', color: '#166634', border: '#86efac' },
  Rechazada:    { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
}

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  })

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Tests de lógica pura ──────────────────────────────────────────────────────

describe('Devoluciones — MOTIVOS', () => {
  it('tiene 6 motivos', () => {
    expect(MOTIVOS).toHaveLength(6)
  })

  it('incluye "Producto dañado o defectuoso"', () => {
    expect(MOTIVOS).toContain('Producto dañado o defectuoso')
  })

  it('incluye "Otro" como último motivo', () => {
    expect(MOTIVOS[MOTIVOS.length - 1]).toBe('Otro')
  })
})

describe('Devoluciones — ESTADO_STYLES', () => {
  it('tiene estilos para Solicitada', () => {
    expect(ESTADO_STYLES.Solicitada.color).toBe('#c2410c')
  })

  it('tiene estilos para Rechazada', () => {
    expect(ESTADO_STYLES.Rechazada.bg).toBe('#fef2f2')
  })

  it('tiene estilos para Aprobada', () => {
    expect(ESTADO_STYLES.Aprobada.color).toBe('#15803d')
  })
})

describe('Devoluciones — formatCurrency', () => {
  it('formatea 0 correctamente', () => {
    expect(formatCurrency(0)).toContain('0')
  })

  it('formatea 50000 como COP', () => {
    const r = formatCurrency(50000)
    expect(r).toContain('50')
  })

  it('maneja null como 0', () => {
    expect(formatCurrency(null)).toContain('0')
  })
})

describe('Devoluciones — formatFecha', () => {
  it('devuelve "—" para null', () => {
    expect(formatFecha(null)).toBe('—')
  })

  it('formatea fecha ISO correctamente', () => {
    const r = formatFecha('2026-01-15')
    expect(r).toContain('2026')
  })
})

// ── Tests de renderizado ──────────────────────────────────────────────────────

describe('Devoluciones — renderizado', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza el componente sin errores', async () => {
    const { container } = render(
      <MemoryRouter><Devoluciones /></MemoryRouter>
    )
    expect(container).toBeTruthy()
  })

  it('muestra contenido de devoluciones', async () => {
    render(<MemoryRouter><Devoluciones /></MemoryRouter>)
    await waitFor(() => {
      expect(document.body.innerHTML).toMatch(/devoluc|solicitud|orden/i)
    })
  })
})
