/**
 * SeccionImpulsos.extra.coverage.test.jsx
 * Covers uncovered branches in SeccionImpulsos.jsx (78.7%)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SeccionImpulsos from '../../components/SeccionImpulsos'

vi.mock('../../hooks/useSyncedDarkMode', () => ({ default: () => [false] }))
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const tipoBase = {
  id_tipo_impulso: 1,
  tipo: 'home',
  nombre: 'Impulso Home',
  descripcion: 'Aparece en la página principal',
  precio: 50000,
  duracion_dias: 7,
}

const tipoEmail = {
  id_tipo_impulso: 2,
  tipo: 'email',
  nombre: 'Email Masivo',
  descripcion: 'Envío de email',
  precio: 30000,
  duracion_dias: 1,
}

const tipoCategoria = {
  id_tipo_impulso: 3,
  tipo: 'categoria',
  nombre: 'Banner Categoría',
  descripcion: 'Banner en categoría',
  precio: 40000,
  duracion_dias: 5,
}

const impulsoActivo = {
  id_impulso: 10,
  tipo: 'home',
  nombre_impulso: 'Impulso Home',
  titulo_libro: 'Mi Libro',
  estado: 'Activo',
  fecha_inicio: '2024-01-01',
  fecha_fin: '2024-01-07',
  monto_pagado: 50000,
  impresiones: 100,
  clics: 10,
  ventas_generadas: 2,
}

const libroSample = { id_libro: 1, titulo: 'Libro A' }
const getContratarButton = () =>
  screen.getByRole('button', { name: /contratar por/i })

const mockApi = async (overrides = {}) => {
  const api = (await import('../../services/api')).default
  api.get.mockImplementation((url) => {
    if (url === '/impulsos/tipos') return Promise.resolve({ data: overrides.tipos ?? [tipoBase, tipoEmail, tipoCategoria] })
    if (url === '/impulsos/mis-impulsos') return Promise.resolve({ data: overrides.impulsos ?? [] })
    if (url === '/libros/mis-libros') return Promise.resolve({ data: overrides.libros ?? [libroSample] })
    if (url === '/herramientas/mi-suscripcion') return Promise.resolve({ data: overrides.suscripcion ?? { activa: false } })
    return Promise.resolve({ data: [] })
  })
  api.post.mockResolvedValue({ data: { ok: true } })
  api.delete.mockResolvedValue({ data: { ok: true } })
}

beforeEach(async () => {
  vi.clearAllMocks()
  await mockApi()
})
afterEach(cleanup)

describe('SeccionImpulsos — loading and render', () => {
  it('renders after loading with tipos', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    expect(await screen.findByText('Impulso Home')).toBeInTheDocument()
  })

  it('shows discount banner for free plan', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    expect(screen.getByText(/ahorra en cada impulso/i)).toBeInTheDocument()
  })

  it('shows discount percentage from subscription', async () => {
    await mockApi({ suscripcion: { activa: true, suscripcion: { impulsos_con_descuento: 10 } } })
    render(<SeccionImpulsos tiendaId={1} />)
    expect(await screen.findByText(/tu plan te da un 10%/i)).toBeInTheDocument()
  })

  it('renders Ver Planes button when onNavegar is provided', async () => {
    const nav = vi.fn()
    render(<SeccionImpulsos tiendaId={1} onNavegar={nav} />)
    const btn = await screen.findByRole('button', { name: 'Ver Planes' })
    fireEvent.click(btn)
    expect(nav).toHaveBeenCalledWith('Suscripciones')
  })
})

describe('SeccionImpulsos — tab Contratar', () => {
  it('selects a tipo impulso when clicked', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    fireEvent.click(screen.getByText('Impulso Home').closest('[role="button"]') || screen.getByText('Impulso Home'))
    // The configurar section should appear
    expect(await screen.findByText(/configurar impulso/i)).toBeInTheDocument()
  })

  it('shows libro selector for tipo home', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    const card = screen.getByText('Impulso Home').closest('[role="button"]')
    if (card) fireEvent.click(card)
    await screen.findByText(/selecciona el libro a impulsar/i)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('keeps tipo home contract disabled until a libro is selected', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    const card = screen.getByText('Impulso Home').closest('[role="button"]')
    if (card) fireEvent.click(card)
    const btn = getContratarButton()
    expect(btn).toBeDisabled()
  })

  it('contracts email tipo without libro required', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Email Masivo')
    const card = screen.getByText('Email Masivo').closest('[role="button"]')
    if (card) fireEvent.click(card)
    const btn = getContratarButton()
    // email does not require libro, button should be enabled
    expect(btn).not.toBeDisabled()
  })

  it('contracts successfully and switches to activos tab', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Email Masivo')
    const card = screen.getByText('Email Masivo').closest('[role="button"]')
    if (card) fireEvent.click(card)
    const btn = getContratarButton()
    fireEvent.click(btn)
    await waitFor(() => expect(screen.getByText(/contratado con éxito/i)).toBeInTheDocument())
  })

  it('shows API error on contract failure', async () => {
    const api = (await import('../../services/api')).default
    api.post.mockRejectedValue({ response: { data: { detail: 'Saldo insuficiente' } } })
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Email Masivo')
    const card = screen.getByText('Email Masivo').closest('[role="button"]')
    if (card) fireEvent.click(card)
    const btn = getContratarButton()
    fireEvent.click(btn)
    await waitFor(() => expect(screen.getByText(/saldo insuficiente/i)).toBeInTheDocument())
  })

  it('handles Enter key on tipo card', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Email Masivo')
    const card = screen.getByText('Email Masivo').closest('[role="button"]')
    if (card) fireEvent.keyDown(card, { key: 'Enter' })
    expect(await screen.findByText(/configurar impulso/i)).toBeInTheDocument()
  })
})

describe('SeccionImpulsos — tab Activos', () => {
  it('shows empty state when no impulsos', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    fireEvent.click(screen.getByRole('button', { name: /mis impulsos activos/i }))
    expect(screen.getByText(/aún no has contratado/i)).toBeInTheDocument()
  })

  it('switches to contratar from empty activos via button', async () => {
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    fireEvent.click(screen.getByRole('button', { name: /mis impulsos activos/i }))
    fireEvent.click(screen.getByRole('button', { name: /contratar mi primer/i }))
    expect(screen.getByText(/impulso home/i)).toBeInTheDocument()
  })

  it('renders active impulso cards', async () => {
    await mockApi({ impulsos: [impulsoActivo] })
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    fireEvent.click(screen.getByRole('button', { name: /mis impulsos activos/i }))
    await waitFor(() => expect(screen.getByText(/Mi Libro/i)).toBeInTheDocument())
    expect(screen.getByText(/100/)).toBeInTheDocument() // impresiones
  })

  it('cancels an impulso after confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await mockApi({ impulsos: [impulsoActivo] })
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    fireEvent.click(screen.getByRole('button', { name: /mis impulsos activos/i }))
    await waitFor(() => expect(screen.getByText(/Mi Libro/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await screen.findByText(/cancelado correctamente/i)
  })

  it('does not cancel when confirm is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    await mockApi({ impulsos: [impulsoActivo] })
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    fireEvent.click(screen.getByRole('button', { name: /mis impulsos activos/i }))
    await waitFor(() => expect(screen.getByText(/Mi Libro/i)).toBeInTheDocument())
    const api = (await import('../../services/api')).default
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(api.delete).not.toHaveBeenCalled()
  })

  it('shows API error on cancel failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const api = (await import('../../services/api')).default
    await mockApi({ impulsos: [impulsoActivo] })
    api.delete.mockRejectedValue({ response: { data: { detail: 'Error al cancelar' } } })
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    fireEvent.click(screen.getByRole('button', { name: /mis impulsos activos/i }))
    await waitFor(() => expect(screen.getByText(/Mi Libro/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await screen.findByText(/error al cancelar/i)
  })

  it('renders Finalizado impulso without cancel button', async () => {
    await mockApi({ impulsos: [{ ...impulsoActivo, estado: 'Finalizado' }] })
    render(<SeccionImpulsos tiendaId={1} />)
    await screen.findByText('Impulso Home')
    fireEvent.click(screen.getByRole('button', { name: /mis impulsos activos/i }))
    await waitFor(() => expect(screen.getByText(/Mi Libro/i)).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull()
  })
})

describe('SeccionImpulsos — API error on load', () => {
  it('shows error when load fails', async () => {
    const api = (await import('../../services/api')).default
    api.get.mockRejectedValue(new Error('Network error'))
    render(<SeccionImpulsos tiendaId={1} />)
    expect(await screen.findByText(/no se pudieron cargar/i)).toBeInTheDocument()
  })
})
