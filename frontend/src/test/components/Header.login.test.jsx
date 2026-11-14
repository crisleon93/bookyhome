/**
 * Header.login.test.jsx — Tests RTL del formulario de Login en el Header.
 *
 * El login en BookyHome es un modal gestionado desde Header.jsx.
 * Se abre vía el custom event 'bookyhome:open-login'.
 * Perspectiva de usuario: errores visibles, botón, redirección por rol.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../components/Header'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/' }) }
})

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [] })) },
  login: vi.fn(),
  getOrdenes: vi.fn(() => Promise.resolve({ data: { orders: [] } })),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}))

vi.mock('../../services/notificaciones', () => ({
  notificacionesService: { obtener: vi.fn(() => Promise.resolve({ no_leidas: 0 })) },
}))

vi.mock('../../services/chat', () => ({
  chatService: { getSalas: vi.fn(() => Promise.resolve({ salas: [] })) },
}))

vi.mock('../../components/ToastProvider', () => ({
  notify: vi.fn(),
  default: ({ children }) => <>{children}</>,
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({ rol: 'comprador', sub: '1' })),
}))

vi.mock('../../pages/Register', () => ({ default: () => <div>Register</div> }))
vi.mock('../../pages/ForgotPassword', () => ({ default: () => <div>ForgotPassword</div> }))
vi.mock('../../components/FiltrosCatalogo', () => ({ default: () => <div>Filtros</div> }))

import { login } from '../../services/api'
import { notify } from '../../components/ToastProvider'

// ── Helper: abrir modal de login ──────────────────────────────────────────────

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  )

const abrirModalLogin = () =>
  fireEvent(window, new CustomEvent('bookyhome:open-login'))

// ── Helper: esperar a que el modal esté abierto ───────────────────────────────
// El formulario tiene id="login-email" e id="login-password"
// El label no tiene htmlFor asociado → usamos querySelector por id.

const esperarModal = () =>
  waitFor(() => screen.getByRole('heading', { name: /iniciar sesión/i }))

const getEmailInput  = () => document.getElementById('login-email')
const getPassInput   = () => document.getElementById('login-password')

// ── Tests: renderizado del modal ─────────────────────────────────────────────

describe('Header — modal de Login (renderizado)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('el modal no está visible al inicio', () => {
    renderHeader()
    expect(screen.queryByRole('heading', { name: /iniciar sesión/i })).toBeNull()
  })

  it('abre el modal al disparar bookyhome:open-login', async () => {
    renderHeader()
    abrirModalLogin()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    })
  })

  it('muestra campo de email y contraseña', async () => {
    renderHeader()
    abrirModalLogin()
    await esperarModal()
    expect(getEmailInput()).toBeInTheDocument()
    expect(getPassInput()).toBeInTheDocument()
  })
})

// ── Tests: validaciones client-side ──────────────────────────────────────────

describe('Header — Login: validaciones client-side', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra errores cuando ambos campos están vacíos', async () => {
    const user = userEvent.setup()
    renderHeader()
    abrirModalLogin()
    await esperarModal()

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      // Al menos uno de los errores de campo obligatorio
      const errores = screen.getAllByText(/este campo es obligatorio/i)
      expect(errores.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('muestra error cuando el email tiene formato inválido', async () => {
    const user = userEvent.setup()
    renderHeader()
    abrirModalLogin()
    await esperarModal()

    await user.type(getEmailInput(), 'no-es-un-email')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/email válido/i)).toBeInTheDocument()
    })
  })

  it('muestra error de contraseña obligatoria cuando solo hay email', async () => {
    const user = userEvent.setup()
    renderHeader()
    abrirModalLogin()
    await esperarModal()

    await user.type(getEmailInput(), 'valido@test.com')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      // El campo contraseña lanza error
      const errores = screen.getAllByText(/este campo es obligatorio/i)
      expect(errores.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('no llama a login() si los campos están vacíos (gate de validación)', async () => {
    const user = userEvent.setup()
    renderHeader()
    abrirModalLogin()
    await esperarModal()

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(login).not.toHaveBeenCalled()
  })
})

// ── Tests: submit exitoso ─────────────────────────────────────────────────────

describe('Header — Login: submit exitoso', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a login() con email y password al enviar form válido', async () => {
    login.mockResolvedValueOnce({ data: { access_token: 'fake.jwt.token' } })
    const user = userEvent.setup()
    renderHeader()
    abrirModalLogin()
    await esperarModal()

    await user.type(getEmailInput(), 'user@test.com')
    await user.type(getPassInput(), 'Password1!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@test.com', password: 'Password1!' })
      )
    })
  })

  it('muestra toast de éxito tras login correcto', async () => {
    login.mockResolvedValueOnce({ data: { access_token: 'fake.jwt.token' } })
    const user = userEvent.setup()
    renderHeader()
    abrirModalLogin()
    await esperarModal()

    await user.type(getEmailInput(), 'user@test.com')
    await user.type(getPassInput(), 'Password1!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(
        expect.stringMatching(/inicio de sesión/i), 'success'
      )
    })
  })

  it('muestra error del servidor si las credenciales son incorrectas', async () => {
    login.mockRejectedValueOnce({
      response: { data: { detail: 'Email o contraseña incorrectos' } },
    })
    const user = userEvent.setup()
    renderHeader()
    abrirModalLogin()
    await esperarModal()

    await user.type(getEmailInput(), 'mal@test.com')
    await user.type(getPassInput(), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument()
    })
  })
})
