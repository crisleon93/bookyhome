import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import CouponsList from '../../components/CouponsList'

const mocks = vi.hoisted(() => ({
  getCoupons: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('../../services/api', () => ({ getCuponesDisponibles: mocks.getCoupons }))
vi.mock('../../components/ToastProvider', () => ({ notify: mocks.notify }))

const coupons = [
  {
    id_cupon: 1,
    codigo_cupon: 'GLOBAL20',
    valor_descuento: 20,
    tipo_descuento: 'porcentaje',
    minimo_compra: 50000,
    fecha_fin: new Date(Date.now() + 3 * 86400000).toISOString(),
  },
  {
    id_cupon: 2,
    codigo_cupon: 'TIENDA10',
    valor_descuento: 10000,
    tipo_descuento: 'fijo',
    nombre_tienda: 'Librería Norte',
    fecha_fin: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  {
    id_cupon: 3,
    codigo_cupon: 'OPEN5',
    valor_descuento: 5,
    tipo_descuento: 'porcentaje',
  },
]

describe('CouponsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn(() => 1),
    })
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('carga cupones desde el servicio y muestra el estado de carga', async () => {
    let resolveRequest
    mocks.getCoupons.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve }))
    render(<CouponsList darkMode />)

    expect(screen.getByText('Cargando cupones disponibles...')).toBeInTheDocument()
    resolveRequest({ data: coupons })

    expect(await screen.findByText('Cupones de Descuento')).toBeInTheDocument()
    expect(screen.getAllByText('GLOBAL20').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tienda: Librería Norte').length).toBeGreaterThan(0)
    expect(mocks.getCoupons).toHaveBeenCalledOnce()
  })

  it('filtra por código, tienda, tipo y vencimiento dentro del diálogo', () => {
    render(<CouponsList initialCoupons={coupons} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))

    const dialog = screen.getByRole('dialog', { name: 'Todos los cupones' })
    const search = within(dialog).getByPlaceholderText('Buscar por código o tienda')
    fireEvent.change(search, { target: { value: 'librería norte' } })
    expect(within(dialog).getByText('TIENDA10')).toBeInTheDocument()
    expect(within(dialog).queryByText('GLOBAL20')).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: '' } })
    const selects = dialog.querySelectorAll('select')
    fireEvent.change(selects[0], { target: { value: 'fijo' } })
    expect(within(dialog).getByText('TIENDA10')).toBeInTheDocument()
    expect(within(dialog).queryByText('GLOBAL20')).not.toBeInTheDocument()

    fireEvent.change(selects[0], { target: { value: 'todos' } })
    fireEvent.change(selects[1], { target: { value: 'proximos' } })
    expect(within(dialog).getByText('GLOBAL20')).toBeInTheDocument()
    expect(within(dialog).queryByText('TIENDA10')).not.toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog', { name: 'Todos los cupones' })).not.toBeInTheDocument()
  })

  it('copia el código, confirma visualmente y avisa si el portapapeles falla', async () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<CouponsList initialCoupons={[coupons[0]]} />)
    const code = screen.getAllByRole('button', { name: /GLOBAL20/ })[0]

    fireEvent.click(code)
    await waitFor(() => expect(mocks.notify).toHaveBeenCalledWith(
      'Código copiado al portapapeles',
      'success',
    ))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('GLOBAL20')

    navigator.clipboard.writeText.mockRejectedValueOnce(new Error('clipboard blocked'))
    fireEvent.click(code)
    await waitFor(() => expect(mocks.notify).toHaveBeenLastCalledWith(
      'Error al copiar el código',
      'error',
    ))
    expect(logError).toHaveBeenCalled()
  })

  it('muestra el estado vacío y no oculta el contenido si falla la carga', async () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.getCoupons.mockRejectedValueOnce(new Error('offline'))
    const { rerender } = render(<CouponsList initialCoupons={[]} />)
    expect(screen.getByText(/No hay cupones disponibles/)).toBeInTheDocument()

    rerender(<CouponsList />)
    expect(await screen.findByText(/No hay cupones disponibles/)).toBeInTheDocument()
    expect(logError).toHaveBeenCalledWith('Error loading coupons:', expect.any(Error))
  })
})
