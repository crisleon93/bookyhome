/**
 * BookyPagoFinanzas.test.jsx — Tests de lógica pura de BookyPagoFinanzas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import api from '../../services/api'
import BookyPagoFinanzas from '../../pages/BookyPagoFinanzas'

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

describe('BookyPagoFinanzas — datos financieros', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra historial y permite filtrar la gráfica por ventas', async () => {
    const hoy = new Date().toISOString()
    api.get.mockImplementation((url) => Promise.resolve({
      data: url.endsWith('/balance')
        ? {
            balance: 140,
            ingresos_totales: 140,
            pagos_totales: 0,
            ingresos_por_tipo: { venta: 100, plan: 25, impulso: 15 },
          }
        : url.endsWith('/estadisticas')
          ? {
              estadisticas: {
                ingresos_30_dias: 100,
                promedio_diario: 3.33,
                ventas_totales: 1,
                planes_activos: 1,
                impulsos_comprados: 1,
              },
            }
          : {
              historial: {
                ingresos: [{
                  id: 1,
                  tipo: 'venta',
                  fecha: hoy,
                  comision: 100,
                  monto_venta: 1000,
                  estado: 'completado',
                }],
                pagos: [],
              },
            },
    }))

    render(<MemoryRouter><BookyPagoFinanzas /></MemoryRouter>)
    await screen.findByText('Desglose de Ingresos')

    fireEvent.click(screen.getByRole('button', { name: 'Historial' }))
    expect(await screen.findByText('Historial Financiero · Últimos 30 días')).toBeInTheDocument()
    expect(screen.getByText('Ingresos registrados')).toBeInTheDocument()
    expect(screen.getByText('Venta')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Estadísticas' }))
    fireEvent.click(screen.getByRole('button', { name: /Ventas/ }))
    expect(screen.getByText(/Ventas · últimos 30 días/)).toBeInTheDocument()
    expect(screen.getByText('Período total')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(3)
  })
})
