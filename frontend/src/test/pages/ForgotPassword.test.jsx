/**
 * ForgotPassword.test.jsx — Tests RTL de la pantalla de recuperación de contraseña.
 *
 * ForgotPassword.jsx tiene dos modos: standalone (page) y modal (isModal=true).
 * Probamos renderizado, validaciones client-side y flujo de submit exitoso/error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ForgotPassword from '../../pages/ForgotPassword'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/api', () => ({
  forgotPassword: vi.fn(),
}))

import { forgotPassword } from '../../services/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  )

const renderModal = (onClose = vi.fn()) =>
  render(
    <MemoryRouter>
      <ForgotPassword isModal={true} onClose={onClose} />
    </MemoryRouter>
  )

// ── Tests: modo standalone ────────────────────────────────────────────────────

describe('ForgotPassword — modo página (standalone)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra el título ¿Olvidaste tu contraseña?', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /olvidaste tu contraseña/i })).toBeInTheDocument()
  })

  it('muestra el campo email con su label', () => {
    renderPage()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('muestra el botón Enviar enlace', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /enviar enlace/i })).toBeInTheDocument()
  })

  it('el botón no está deshabilitado al inicio', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /enviar enlace/i })).not.toBeDisabled()
  })
})

// ── Tests: validaciones client-side ──────────────────────────────────────────

describe('ForgotPassword — validaciones', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra error si se envía con el campo vacío', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    expect(screen.getByText(/este campo es obligatorio/i)).toBeInTheDocument()
  })

  it('no llama a forgotPassword si el campo está vacío', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    expect(forgotPassword).not.toHaveBeenCalled()
  })

  it('muestra error con email sin formato válido', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'noesvalido')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    expect(screen.getByText(/ingresa un email válido/i)).toBeInTheDocument()
  })

  it('no llama a forgotPassword con email inválido', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'noesvalido')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    expect(forgotPassword).not.toHaveBeenCalled()
  })

  it('limpia el error de email al escribir de nuevo', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    expect(screen.getByText(/este campo es obligatorio/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/email/i), 'a')
    expect(screen.queryByText(/este campo es obligatorio/i)).toBeNull()
  })
})

// ── Tests: submit exitoso ─────────────────────────────────────────────────────

describe('ForgotPassword — submit exitoso', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a forgotPassword con el email correcto', async () => {
    forgotPassword.mockResolvedValueOnce({ data: { correo_enviado: true } })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'usuario@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith({ email: 'usuario@test.com' })
    })
  })

  it('muestra mensaje de éxito cuando correo_enviado es true', async () => {
    forgotPassword.mockResolvedValueOnce({ data: { correo_enviado: true } })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'usuario@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/correo de recuperación enviado/i)).toBeInTheDocument()
    })
  })

  it('oculta el formulario tras el éxito', async () => {
    forgotPassword.mockResolvedValueOnce({ data: { correo_enviado: true } })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'usuario@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /enviar enlace/i })).toBeNull()
    })
  })
})

// ── Tests: manejo de errores del servidor ─────────────────────────────────────

describe('ForgotPassword — errores del servidor', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra mensaje del servidor cuando correo_enviado es false', async () => {
    forgotPassword.mockResolvedValueOnce({
      data: { correo_enviado: false, mensaje: 'No se encontró una cuenta con ese email' },
    })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'noexiste@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/no se encontró una cuenta/i)).toBeInTheDocument()
    })
  })

  it('muestra error genérico si la llamada lanza una excepción', async () => {
    forgotPassword.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'usuario@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/error al enviar el enlace/i)).toBeInTheDocument()
    })
  })

  it('muestra el detail del servidor si está disponible en el error', async () => {
    forgotPassword.mockRejectedValueOnce({
      response: { data: { detail: 'Servicio temporalmente no disponible' } },
    })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'usuario@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/servicio temporalmente no disponible/i)).toBeInTheDocument()
    })
  })

  it('deshabilita el botón mientras carga', async () => {
    // Mock que tarda en resolver
    forgotPassword.mockReturnValueOnce(new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'usuario@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled()
  })
})

// ── Tests: modo modal ─────────────────────────────────────────────────────────

describe('ForgotPassword — modo modal (isModal=true)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza el campo email en modo modal', () => {
    renderModal()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('muestra el botón Enviar enlace en modo modal', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /enviar enlace/i })).toBeInTheDocument()
  })

  it('muestra el botón Volver al inicio de sesión', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /volver al inicio de sesión/i })).toBeInTheDocument()
  })

  it('llama a onClose al hacer clic en Volver', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal(onClose)
    await user.click(screen.getByRole('button', { name: /volver al inicio de sesión/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('muestra éxito en modo modal al recibir correo_enviado true', async () => {
    forgotPassword.mockResolvedValueOnce({ data: { correo_enviado: true } })
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText(/email/i), 'test@correo.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/correo de recuperación enviado/i)).toBeInTheDocument()
    })
  })

  it('no muestra el título h1 en modo modal (sin componente auth-card)', () => {
    renderModal()
    expect(screen.queryByRole('heading', { name: /olvidaste tu contraseña/i })).toBeNull()
  })
})
