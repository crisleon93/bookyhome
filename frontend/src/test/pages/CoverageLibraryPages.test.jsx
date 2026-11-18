import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LegalPage from '../../pages/LegalPage'
import Libreria from '../../pages/Libreria'
import Librerias from '../../pages/Librerias'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  navigate: vi.fn(),
  notify: vi.fn(),
  registerLibrary: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate }
})

vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet },
  getApiBaseUrl: mocks.getApiBaseUrl,
  registerLibrary: mocks.registerLibrary,
}))

vi.mock('../../components/ToastProvider', () => ({ notify: mocks.notify }))
vi.mock('../../components/Legal', () => ({
  LegalModal: ({ children, open }) => open ? <div role="dialog">{children}</div> : null,
  Privacidad: () => <div>Texto privacidad de prueba</div>,
  Terminos: () => <div>Texto términos de prueba</div>,
}))
vi.mock('../../components/LeafletAddressPickerModal', () => ({
  default: ({ isOpen, onSelect }) => isOpen
    ? <button onClick={() => onSelect({ direccion: 'Calle 10', ciudadResuelta: 'Cali' })}>Elegir dirección de prueba</button>
    : null,
}))

const tiendas = [
  {
    id_tienda: 1,
    nombre_tienda: 'Librería Norte',
    ciudad_origen: 'Bogotá',
    direccion: 'Calle 1',
    descripcion: 'Libros de ficción',
    total_libros: 4,
    calificacion_promedio: 4.5,
    total_calificaciones: 3,
  },
  {
    id_tienda: 2,
    nombre_tienda: 'Librería Sur',
    ciudad_origen: 'Cali',
    direccion: 'Carrera 2',
    descripcion: 'Libros de ciencia',
    total_libros: 0,
    calificacion_promedio: 3,
  },
]

function renderRegistration(props = {}) {
  return render(<MemoryRouter><Libreria {...props} /></MemoryRouter>)
}

async function completeRegistration() {
  fireEvent.change(screen.getByLabelText(/^nombre$/i), { target: { value: 'Ana Pérez' } })
  fireEvent.change(screen.getByLabelText(/nombre de la librería/i), { target: { value: 'Lecturas' } })
  fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Bogota' } })
  fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '3001234567' } })
  fireEvent.change(screen.getByLabelText(/dirección de la tienda/i), { target: { value: 'Calle 10' } })
  fireEvent.change(screen.getByLabelText(/complemento/i), { target: { value: 'Local 2' } })
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText(/^contraseña$/i), { target: { value: 'Segura123!' } })
  fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'Segura123!' } })
  fireEvent.click(screen.getByRole('checkbox'))
}

describe('LegalPage', () => {
  it('muestra ambos documentos por defecto y permite filtrar cada uno', () => {
    const { rerender } = render(<LegalPage />)
    expect(screen.getByRole('heading', { name: 'Política de Privacidad' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Términos y Condiciones' })).toBeInTheDocument()

    rerender(<LegalPage type="privacidad" />)
    expect(screen.getByRole('heading', { name: 'Política de Privacidad' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Términos y Condiciones' })).not.toBeInTheDocument()

    rerender(<LegalPage type="terminos" />)
    expect(screen.getByRole('heading', { name: 'Términos y Condiciones' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Política de Privacidad' })).not.toBeInTheDocument()
  })
})

describe('Libreria registration page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.registerLibrary.mockResolvedValue({})
  })

  it('requires valid registration information before enabling submit', async () => {
    renderRegistration()
    expect(screen.getByRole('button', { name: 'Registrar Librería' })).toBeDisabled()
    await completeRegistration()
    expect(screen.getByRole('button', { name: 'Registrar Librería' })).toBeEnabled()
  })

  it('submits the normalized address and reports registration errors', async () => {
    mocks.registerLibrary.mockRejectedValueOnce({
      response: { data: { detail: 'El correo ya está registrado' } },
    })
    const { container } = renderRegistration()
    await completeRegistration()
    fireEvent.submit(container.querySelector('form'))

    await waitFor(() => {
      expect(mocks.registerLibrary).toHaveBeenCalledWith(expect.objectContaining({
        nombre: 'Ana Pérez',
        libreria: 'Lecturas',
        direccion: 'Bogota, Calle 10, Local 2',
        email: 'ana@example.com',
        rol: 'vendedor',
      }))
      expect(screen.getByText('El correo ya está registrado')).toBeInTheDocument()
    })
    expect(mocks.notify).toHaveBeenCalledWith('El correo ya está registrado', 'error')
  })

  it('aplica una dirección elegida en el mapa y permite ver la contraseña', async () => {
    renderRegistration({ isModal: true })
    fireEvent.click(screen.getByRole('button', { name: /elegir en mapa/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Elegir dirección de prueba' }))
    expect(screen.getByLabelText(/ciudad/i)).toHaveValue('Cali')
    expect(screen.getByLabelText(/dirección de la tienda/i)).toHaveValue('Calle 10')

    const password = screen.getByLabelText(/^contraseña$/i)
    fireEvent.change(password, { target: { value: 'Segura123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password).toHaveAttribute('type', 'text')
  })
})

describe('Librerias catalog page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.apiGet.mockResolvedValue({ data: tiendas })
  })

  it('filters by city, stock and name, sorts the results, and navigates to a store', async () => {
    render(<MemoryRouter><Librerias /></MemoryRouter>)
    await screen.findByRole('button', { name: /Librería Norte/i })
    expect(screen.getByRole('button', { name: /Librería Sur/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Solo con libros/i }))
    expect(screen.getByRole('button', { name: /Librería Norte/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Librería Sur/i })).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Buscar librería por nombre...'), {
      target: { value: 'norte' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Librería Norte/i }))
    expect(mocks.navigate).toHaveBeenCalledWith('/tienda/1')
  })

  it('shows an empty state when the request fails', async () => {
    mocks.apiGet.mockRejectedValueOnce(new Error('offline'))
    render(<MemoryRouter><Librerias /></MemoryRouter>)
    expect(await screen.findByText('No se encontraron librerías con ese filtro')).toBeInTheDocument()
  })
})
