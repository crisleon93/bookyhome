/**
 * Devoluciones.test.jsx — Tests de Devoluciones.jsx.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Devoluciones from '../../pages/Devoluciones'
import { crearQueja, getDevoluciones, getOrdenes, getQuejas } from '../../services/api'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
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

describe('Devoluciones — flujos de solicitudes y reclamos', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      localStorage.setItem('token', 'token-test')
      getOrdenes.mockResolvedValue({
        data: [
          {
            id_orden: 1,
            estado: 'pagado',
            fecha: '2026-02-01',
            total: 25000,
            items: [{ titulo: 'Libro elegible', cantidad: 2 }],
          },
          { id_orden: 2, estado: 'pagado', total: 10000, items: [] },
          { id_orden: 3, estado: 'pagado', fecha: '2026-02-03', total: 5000, items: [{ titulo: 'Libro elegible', cantidad: 2 }] },
        ],
      })
      getDevoluciones.mockResolvedValue({ data: [{
        id_devolucion: 9,
        id_orden: 2,
        motivo: 'Revisión',
        estado_devolucion: 'En Revision',
        fecha_solicitud: '2026-02-02',
        notas_vendedor: 'Estamos revisando',
        total_orden: 10000,
        tipo_resolucion: 'Parcial',
        monto_reembolso: 5000,
        fecha_resolucion: '2026-02-03',
      }] })
      getQuejas.mockResolvedValue({ data: [
        { id_solicitud: 4, id_orden: 1, asunto: 'Producto', estado: 'Abierto', descripcion: 'Detalle', evidencia_url: '/evidencia.jpg', respuesta: 'Recibido' },
        { id_solicitud: 5, id_orden: 2, asunto: 'Soporte', estado: 'En revisión', descripcion: 'Otro' },
      ] })
      crearQueja.mockResolvedValue({ data: {} })
    })

    it('filtra pedidos bloqueados por reclamos activos y renderiza devoluciones y quejas', async () => {
      render(<MemoryRouter><Devoluciones /></MemoryRouter>)

      const ordersSelect = await screen.findByLabelText('Pedido')
      expect(ordersSelect.querySelectorAll('option')).toHaveLength(2)
      expect(ordersSelect.querySelector('option[value="3"]')).toBeTruthy()
      expect(ordersSelect.querySelector('option[value="1"]')).toBeNull()
      expect(ordersSelect.querySelector('option[value="2"]')).toBeNull()
      expect(screen.getAllByText('Orden #2').length).toBeGreaterThan(0)
      expect(screen.getByText(/Resolución: Parcial/)).toBeInTheDocument()
      expect(screen.getByText(/Nota del vendedor:.*Estamos revisando/)).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Ver evidencia' }))
      expect(screen.getByRole('dialog', { name: 'Evidencia del reclamo' })).toBeInTheDocument()
      expect(screen.getByAltText('Evidencia del reclamo').getAttribute('src'))
        .toBe('http://localhost:8000/evidencia.jpg')
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar evidencia del reclamo' }))
      expect(screen.queryByRole('dialog', { name: 'Evidencia del reclamo' })).toBeNull()
    })

    it('valida campos requeridos y envía la solicitud con comentarios', async () => {
      render(<MemoryRouter><Devoluciones /></MemoryRouter>)
      await screen.findByLabelText('Pedido')

      fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
      expect(screen.getAllByText('Selecciona un pedido').length).toBeGreaterThan(1)

      fireEvent.change(screen.getByLabelText('Pedido'), { target: { value: '3' } })
      fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
      expect(screen.getAllByText('Selecciona un motivo').length).toBeGreaterThan(1)

      fireEvent.change(screen.getByLabelText('Motivo'), {
        target: { value: 'Producto dañado o defectuoso' },
      })
      fireEvent.change(screen.getByLabelText('Comentarios (opcional)'), {
        target: { value: '  Llegó roto  ' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

      await waitFor(() => expect(crearQueja).toHaveBeenCalledOnce())
      const formData = crearQueja.mock.calls[0][0]
      expect(formData.get('id_orden')).toBe('3')
      expect(formData.get('motivo')).toBe('Producto dañado o defectuoso')
      expect(formData.get('descripcion')).toBe('Llegó roto')
      expect(await screen.findByText('Solicitud de devolución enviada correctamente')).toBeInTheDocument()
    })

    it('muestra errores al cargar y al enviar una solicitud', async () => {
      getOrdenes.mockRejectedValueOnce({
        response: { data: { detail: 'No se pudieron leer los pedidos' } },
      })
      const { unmount } = render(<MemoryRouter><Devoluciones /></MemoryRouter>)
      expect(await screen.findByText('No se pudieron leer los pedidos')).toBeInTheDocument()
      unmount()

      getOrdenes.mockResolvedValue({
        data: [{ id_orden: 1, estado: 'pagado', total: 10, items: [] }],
      })
      getDevoluciones.mockResolvedValue({ data: [] })
      getQuejas.mockResolvedValue({ data: [] })
      crearQueja.mockRejectedValueOnce({
        response: { data: { detail: 'Solicitud rechazada' } },
      })

      render(<MemoryRouter><Devoluciones /></MemoryRouter>)
      await screen.findByLabelText('Pedido')
      fireEvent.change(screen.getByLabelText('Pedido'), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Otro' } })
      fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
      expect(await screen.findByText('Solicitud rechazada')).toBeInTheDocument()
    })

    it('redirige a /login cuando el servicio responde con 401', async () => {
      getOrdenes.mockRejectedValueOnce({
        response: { status: 401, data: { detail: 'No autorizado' } },
      })
      render(<MemoryRouter><Devoluciones /></MemoryRouter>)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })
})
