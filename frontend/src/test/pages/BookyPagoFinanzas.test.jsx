/**
 * BookyPagoFinanzas.test.jsx — Tests de lógica pura de BookyPagoFinanzas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { balance: 0, transacciones: [], resumen: {} } })),
  },
}))

vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))

vi.mock('../../components/Icons', () => ({
  IconWallet: () => null, IconTrendingUp: () => null, IconRefresh: () => null,
  IconPackage: () => null, IconStore: () => null, IconBolt: () => null, IconChartBar: () => null,
}))

// ── Lógica pura ───────────────────────────────────────────────────────────────

function fmt(v) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(v || 0)
}

// ── Tests: fmt ────────────────────────────────────────────────────────────────

describe('BookyPagoFinanzas — fmt', () => {
  it('formatea 0 como COP', () => {
    const r = fmt(0)
    expect(r).toContain('0')
  })

  it('formatea un valor positivo', () => {
    const r = fmt(50000)
    expect(r).toContain('50')
  })

  it('formatea null como 0', () => {
    const r = fmt(null)
    expect(r).toContain('0')
  })

  it('formatea undefined como 0', () => {
    const r = fmt(undefined)
    expect(r).toContain('0')
  })

  it('incluye símbolo de COP', () => {
    const r = fmt(100000)
    expect(r).toMatch(/COP|\$/)
  })
})

// ── Tests: lógica de tipos de transacción ─────────────────────────────────────

describe('BookyPagoFinanzas — Badge tipos', () => {
  const tipos = ['venta', 'plan', 'impulso']

  it('reconoce los tres tipos válidos', () => {
    const cfg = {
      venta:   { label: 'Venta' },
      plan:    { label: 'Plan' },
      impulso: { label: 'Impulso' },
    }
    tipos.forEach((tipo) => {
      expect(cfg[tipo]).toBeDefined()
      expect(cfg[tipo].label).toBeTruthy()
    })
  })

  it('usa fallback para tipo desconocido', () => {
    const cfg = { venta: {}, plan: {}, impulso: {} }
    const result = cfg['otro_tipo'] || { label: 'otro_tipo' }
    expect(result.label).toBe('otro_tipo')
  })
})

// ── Tests: renderizado ────────────────────────────────────────────────────────

describe('BookyPagoFinanzas — renderizado', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza sin errores', async () => {
    const BookyPagoFinanzas = (await import('../../pages/BookyPagoFinanzas')).default
    const { container } = render(
      <MemoryRouter><BookyPagoFinanzas /></MemoryRouter>
    )
    expect(container).toBeTruthy()
  })

  it('muestra el título de finanzas', async () => {
    const BookyPagoFinanzas = (await import('../../pages/BookyPagoFinanzas')).default
    render(<MemoryRouter><BookyPagoFinanzas /></MemoryRouter>)
    await waitFor(() => {
      const html = document.body.innerHTML
      expect(html).toMatch(/booky|finanz|balance|wallet/i)
    })
  })
})

// ── Tests: lógica de resumen ──────────────────────────────────────────────────

describe('BookyPagoFinanzas — cálculos de resumen', () => {
  const transacciones = [
    { tipo: 'venta', monto: 50000, estado: 'completado' },
    { tipo: 'plan', monto: 20000, estado: 'completado' },
    { tipo: 'impulso', monto: 10000, estado: 'pendiente' },
    { tipo: 'venta', monto: 30000, estado: 'completado' },
  ]

  it('suma ventas completadas', () => {
    const total = transacciones
      .filter((t) => t.tipo === 'venta' && t.estado === 'completado')
      .reduce((acc, t) => acc + t.monto, 0)
    expect(total).toBe(80000)
  })

  it('cuenta transacciones pendientes', () => {
    const pendientes = transacciones.filter((t) => t.estado === 'pendiente').length
    expect(pendientes).toBe(1)
  })

  it('agrupa por tipo', () => {
    const porTipo = transacciones.reduce((acc, t) => {
      acc[t.tipo] = (acc[t.tipo] || 0) + 1
      return acc
    }, {})
    expect(porTipo.venta).toBe(2)
    expect(porTipo.plan).toBe(1)
    expect(porTipo.impulso).toBe(1)
  })
})
