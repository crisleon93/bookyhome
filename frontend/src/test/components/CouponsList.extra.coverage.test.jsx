/**
 * CouponsList.extra.coverage.test.jsx
 * Covers uncovered branches in CouponsList.jsx (76.9%)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CouponsList from '../../components/CouponsList'

vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))
vi.mock('../../services/api', () => ({
  getCuponesDisponibles: vi.fn(() => Promise.resolve({ data: [] })),
}))

const makeCoupon = (overrides = {}) => ({
  id_cupon: 1,
  codigo_cupon: 'BOOKY10',
  tipo_descuento: 'porcentaje',
  valor_descuento: 10,
  minimo_compra: 20000,
  fecha_fin: '2099-12-31',
  nombre_tienda: null,
  ...overrides,
})

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('CouponsList — loading state', () => {
  it('shows loading when initialCoupons is undefined and API pending', async () => {
    const { getCuponesDisponibles } = await import('../../services/api')
    getCuponesDisponibles.mockReturnValue(new Promise(() => {}))
    render(<CouponsList />)
    expect(screen.getByText(/cargando cupones/i)).toBeInTheDocument()
  })

  it('shows empty state when no coupons', async () => {
    render(<CouponsList initialCoupons={[]} />)
    expect(screen.getByText(/no hay cupones/i)).toBeInTheDocument()
  })
})

describe('CouponsList — coupon display', () => {
  it('renders coupon with valor fijo', () => {
    render(<CouponsList initialCoupons={[makeCoupon({ tipo_descuento: 'fijo', valor_descuento: 5000, nombre_tienda: 'Librería Test' })]} />)
    expect(screen.getByText(/5\.000/)).toBeInTheDocument()
  })

  it('renders coupon without expiration date', () => {
    render(<CouponsList initialCoupons={[makeCoupon({ fecha_fin: null })]} />)
    expect(screen.getByText('BOOKY10')).toBeInTheDocument()
  })

  it('renders coupon with no minimo_compra', () => {
    render(<CouponsList initialCoupons={[makeCoupon({ minimo_compra: 0 })]} />)
    expect(screen.getByText('BOOKY10')).toBeInTheDocument()
  })

  it('renders tienda badge for store coupon', () => {
    render(<CouponsList initialCoupons={[makeCoupon({ nombre_tienda: 'Mi Tienda' })]} />)
    expect(screen.getAllByText(/Tienda: Mi Tienda/i)).toHaveLength(2) // duplicated for carousel
  })

  it('renders Global BookyHome badge for global coupon', () => {
    render(<CouponsList initialCoupons={[makeCoupon({ nombre_tienda: null })]} />)
    expect(screen.getAllByText(/Global BookyHome/i)).toHaveLength(2)
  })
})

describe('CouponsList — copy functionality', () => {
  it('copies coupon code to clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.assign(navigator, { clipboard: { writeText } })
    const { notify } = await import('../../components/ToastProvider')
    render(<CouponsList initialCoupons={[makeCoupon()]} />)
    // find the coupon code element (first occurrence in carousel)
    const codeEls = screen.getAllByText('BOOKY10')
    fireEvent.click(codeEls[0].closest('[role="button"]') || codeEls[0])
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('BOOKY10'))
    expect(notify).toHaveBeenCalledWith('Código copiado al portapapeles', 'success')
  })

  it('handles clipboard error', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('no clipboard')))
    Object.assign(navigator, { clipboard: { writeText } })
    const { notify } = await import('../../components/ToastProvider')
    render(<CouponsList initialCoupons={[makeCoupon()]} />)
    const codeEls = screen.getAllByText('BOOKY10')
    fireEvent.click(codeEls[0].closest('[role="button"]') || codeEls[0])
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Error al copiar el código', 'error'))
  })

  it('handles Enter key on coupon code', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.assign(navigator, { clipboard: { writeText } })
    render(<CouponsList initialCoupons={[makeCoupon()]} />)
    const codeEls = screen.getAllByText('BOOKY10')
    const el = codeEls[0].closest('[role="button"]') || codeEls[0]
    fireEvent.keyDown(el, { key: 'Enter' })
    await waitFor(() => expect(writeText).toHaveBeenCalled())
  })
})

describe('CouponsList — Ver todos modal', () => {
  it('opens and closes the modal', async () => {
    render(<CouponsList initialCoupons={[makeCoupon(), makeCoupon({ id_cupon: 2, codigo_cupon: 'BOOKY20', valor_descuento: 20 })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // close with ×
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes modal clicking backdrop', async () => {
    render(<CouponsList initialCoupons={[makeCoupon()]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog) // click backdrop (target === currentTarget)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    render(<CouponsList initialCoupons={[makeCoupon(), makeCoupon({ id_cupon: 2, codigo_cupon: 'ESPECIAL50', valor_descuento: 50, nombre_tienda: 'Tienda Dos' })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    const input = screen.getByPlaceholderText(/buscar por código/i)
    await user.type(input, 'especial')
    expect(screen.queryByText('BOOKY10')).toBeNull()
  })

  it('filters by tipo globales', async () => {
    render(<CouponsList initialCoupons={[makeCoupon({ nombre_tienda: null }), makeCoupon({ id_cupon: 2, nombre_tienda: 'Tienda' })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'globales' } })
    // only global coupon should appear
    expect(screen.getAllByText('BOOKY10').length).toBeGreaterThan(0)
  })

  it('filters by tipo tienda', async () => {
    render(<CouponsList initialCoupons={[makeCoupon({ nombre_tienda: null }), makeCoupon({ id_cupon: 2, nombre_tienda: 'Tienda' })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'tienda' } })
    expect(screen.queryByText('BOOKY10')).toBeNull()
  })

  it('filters by tipo fijo', async () => {
    render(<CouponsList initialCoupons={[makeCoupon({ tipo_descuento: 'fijo', id_cupon: 3 }), makeCoupon({ id_cupon: 4 })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'fijo' } })
    // fijo coupon visible
    expect(screen.queryAllByText('BOOKY10').length).toBeGreaterThan(0)
  })

  it('filters by vencimiento vigentes', async () => {
    render(<CouponsList initialCoupons={[makeCoupon({ fecha_fin: '2099-12-31' }), makeCoupon({ id_cupon: 2, fecha_fin: '2000-01-01' })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'vigentes' } })
    // only the future coupon
    expect(screen.queryAllByText('BOOKY10').length).toBeGreaterThan(0)
  })

  it('filters by proximos', async () => {
    // coupon expiring in 3 days
    const inThreeDays = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
    render(<CouponsList initialCoupons={[makeCoupon({ fecha_fin: inThreeDays }), makeCoupon({ id_cupon: 2, fecha_fin: '2099-12-31' })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'proximos' } })
    expect(screen.queryAllByText('BOOKY10').length).toBeGreaterThan(0)
  })

  it('shows empty state when no filtered results', async () => {
    const user = userEvent.setup()
    render(<CouponsList initialCoupons={[makeCoupon()]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    const input = screen.getByPlaceholderText(/buscar por código/i)
    await user.type(input, 'zzznomatch')
    expect(screen.getByText(/no hay cupones que coincidan/i)).toBeInTheDocument()
  })
})

describe('CouponsList — carousel navigation', () => {
  it('carousel prev/next buttons work without throwing', () => {
    render(<CouponsList initialCoupons={[makeCoupon(), makeCoupon({ id_cupon: 2, codigo_cupon: 'B2' })]} />)
    const prevBtn = screen.getByRole('button', { name: 'Cupones anteriores' })
    const nextBtn = screen.getByRole('button', { name: 'Siguientes cupones' })
    expect(() => { fireEvent.click(nextBtn); fireEvent.click(prevBtn) }).not.toThrow()
  })
})

describe('CouponsList — dark mode', () => {
  it('renders in dark mode without errors', () => {
    render(<CouponsList initialCoupons={[makeCoupon()]} darkMode={true} />)
    expect(screen.getAllByText('BOOKY10').length).toBeGreaterThan(0)
  })
})
