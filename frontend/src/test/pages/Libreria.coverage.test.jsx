import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Libreria from '../../pages/Libreria'

const mocks = vi.hoisted(() => ({
  registerLibrary: vi.fn(),
  notify: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate }
})

vi.mock('../../services/api', () => ({
  registerLibrary: mocks.registerLibrary,
}))

vi.mock('../../components/ToastProvider', () => ({ notify: mocks.notify }))

vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconUser: Icon,
    IconStore: Icon,
    IconLocation: Icon,
    IconPhone: Icon,
    IconMail: Icon,
    IconLock: Icon,
    IconEyeOpen: Icon,
    IconEyeClosed: Icon,
    IconCheck: Icon,
  }
})

vi.mock('../../components/Legal', () => ({
  LegalModal: ({ open, title, onClose, onAccept, children }) => open ? (
    <section aria-label={title}>
      {children}
      <button onClick={onAccept}>Aceptar documento</button>
      <button onClick={onClose}>Cerrar documento</button>
    </section>
  ) : null,
  Terminos: () => <p>Contenido de términos</p>,
  Privacidad: () => <p>Contenido de privacidad</p>,
}))

vi.mock('../../components/LeafletAddressPickerModal', () => ({
  default: ({ isOpen, onClose, onGpsCity, onSelect }) => isOpen ? (
    <div role="dialog" aria-label="Elegir dirección">
      <button onClick={() => onGpsCity('Cali')}>Usar ubicación</button>
      <button onClick={() => onSelect({ direccion: 'Carrera 10', ciudadResuelta: 'Bogota' })}>
        Seleccionar dirección
      </button>
      <button onClick={onClose}>Cerrar mapa</button>
    </div>
  ) : null,
}))

const submitForm = () => fireEvent.submit(screen.getByRole('heading', { name: 'Registrar Librería' }).closest('div').querySelector('form'))

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Pérez' } })
  fireEvent.change(screen.getByLabelText('Nombre de la librería'), { target: { value: 'Letras' } })
  fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Bogota' } })
  fireEvent.change(screen.getByLabelText('Dirección de la tienda'), { target: { value: 'Calle 1' } })
  fireEvent.change(screen.getByLabelText('Complemento (opcional)'), { target: { value: 'Local 2' } })
  fireEvent.change(screen.getByLabelText('Teléfono / Celular'), { target: { value: '3001234567' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Strong123!' } })
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Strong123!' } })
  fireEvent.click(screen.getByRole('checkbox'))
}

describe('Libreria registration form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.registerLibrary.mockResolvedValue({})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports each required field in order without calling the API', () => {
    render(<MemoryRouter><Libreria /></MemoryRouter>)

    submitForm()
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
    submitForm()
    expect(screen.getByText('El nombre de la librería es obligatorio')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nombre de la librería'), { target: { value: 'Letras' } })
    submitForm()
    expect(screen.getByText('Completa la ubicación de la tienda')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Bogota' } })
    fireEvent.change(screen.getByLabelText('Dirección de la tienda'), { target: { value: 'Calle 1' } })
    submitForm()
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Teléfono / Celular'), { target: { value: '12ab' } })
    submitForm()
    expect(screen.getByText(/Ingresa un número de teléfono válido/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Teléfono / Celular'), { target: { value: '3001234567' } })
    submitForm()
    expect(screen.getByText('Ingresa un email válido')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'no-es-email' } })
    submitForm()
    expect(screen.getByText('Ingresa un email válido')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'corta' } })
    submitForm()
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Strong123!' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'different' } })
    submitForm()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Strong123!' } })
    submitForm()
    expect(screen.getByText(/Debes aceptar tanto los Términos/)).toBeInTheDocument()
    expect(mocks.registerLibrary).not.toHaveBeenCalled()
  })

  it('opens legal and map dialogs, blocks password clipboard actions, and registers a modal account', async () => {
    vi.useFakeTimers()
    const onSuccess = vi.fn()
    render(<MemoryRouter><Libreria isModal onSuccess={onSuccess} /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'términos y condiciones' }))
    expect(screen.getByText('Contenido de términos')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar documento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar documento' }))
    fireEvent.click(screen.getByRole('button', { name: 'política de privacidad' }))
    expect(screen.getByText('Contenido de privacidad')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar documento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar documento' }))

    fireEvent.click(screen.getByRole('button', { name: 'Elegir en mapa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Usar ubicación' }))
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar dirección' }))
    expect(screen.getByLabelText('Dirección de la tienda')).toHaveValue('Carrera 10')
    expect(screen.getByLabelText('Ciudad')).toHaveValue('Bogota')

    const password = screen.getByLabelText('Contraseña')
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    password.dispatchEvent(paste)
    expect(paste.defaultPrevented).toBe(true)
    expect(mocks.notify).toHaveBeenCalledWith('Por seguridad, escribe este campo manualmente.', 'info')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('checkbox'))
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    fireEvent.submit(screen.getByRole('heading', { name: 'Registrar Librería' }).closest('div').querySelector('form'))
    await act(async () => { await Promise.resolve() })
    expect(mocks.registerLibrary).toHaveBeenCalledWith({
      nombre: 'Ana Pérez',
      libreria: 'Letras',
      direccion: 'Bogota, Calle 1, Local 2',
      telefono: '3001234567',
      email: 'ana@example.com',
      password: 'Strong123!',
      rol: 'vendedor',
    })
    expect(screen.getByText(/¡Librería registrada exitosamente!/)).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(2500) })
    expect(onSuccess).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('shows the server error when registration fails', async () => {
    mocks.registerLibrary.mockRejectedValueOnce({ response: { data: { detail: 'Correo ocupado' } } })
    render(<MemoryRouter><Libreria /></MemoryRouter>)
    fillValidForm()
    fireEvent.submit(screen.getByRole('heading', { name: 'Registrar Librería' }).closest('div').querySelector('form'))
    expect(await screen.findByText('Correo ocupado')).toBeInTheDocument()
    await waitFor(() => expect(mocks.notify).toHaveBeenCalledWith('Correo ocupado', 'error'))
  })
})
