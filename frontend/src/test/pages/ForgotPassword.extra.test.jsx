/**
 * ForgotPassword.extra.test.jsx — ramas no cubiertas del 4.9% faltante
 *
 * Cubre:
 * - Modo modal: error visible cuando correo_enviado es false (rama modal)
 * - Modo modal: error genérico cuando lanza excepción
 * - Modo modal: estado de carga (botón deshabilitado)
 * - Modo modal: exito muestra botón "Volver" pero NO el form
 * - Modo standalone: "← Volver al inicio de sesión" (texto estático en standalone)
 * - Limpiar emailErr al escribir en modo modal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ForgotPassword from '../../pages/ForgotPassword'

vi.mock('../../services/api', () => ({ forgotPassword: vi.fn() }))
import { forgotPassword } from '../../services/api'

const renderModal = (onClose = vi.fn()) =>
  render(
    <MemoryRouter>
      <ForgotPassword isModal={true} onClose={onClose} />
    </MemoryRouter>
  )

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  )

describe('ForgotPassword extra — modo modal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra error cuando correo_enviado es false en modo modal', async () => {
    forgotPassword.mockResolvedValueOnce({
      data: { correo_enviado: false, mensaje: 'Cuenta no registrada' },
    })
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText(/email/i), 'x@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/cuenta no registrada/i)).toBeInTheDocument()
    })
  })

  it('muestra error genérico en modo modal cuando la llamada falla', async () => {
    forgotPassword.mockRejectedValueOnce(new Error('timeout'))
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText(/email/i), 'y@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/error al enviar el enlace/i)).toBeInTheDocument()
    })
  })

  it('muestra el detail del servidor en modo modal', async () => {
    forgotPassword.mockRejectedValueOnce({
      response: { data: { detail: 'Servicio caído' } },
    })
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText(/email/i), 'z@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/servicio caído/i)).toBeInTheDocument()
    })
  })

  it('deshabilita el botón mientras carga en modo modal', async () => {
    forgotPassword.mockReturnValueOnce(new Promise(() => {}))
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText(/email/i), 'carga@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled()
  })

  it('después del éxito en modal oculta el form pero mantiene el botón Volver', async () => {
    forgotPassword.mockResolvedValueOnce({ data: { correo_enviado: true } })
    const user = userEvent.setup()
    renderModal()
    await user.type(screen.getByLabelText(/email/i), 'ok@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /enviar enlace/i })).toBeNull()
    })
    expect(
      screen.getByRole('button', { name: /volver al inicio de sesión/i })
    ).toBeInTheDocument()
  })

  it('limpia emailErr al empezar a escribir en modo modal', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    expect(screen.getByText(/este campo es obligatorio/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/email/i), 'a')
    expect(screen.queryByText(/este campo es obligatorio/i)).toBeNull()
  })
})

describe('ForgotPassword extra — modo standalone', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra el texto estático de volver en modo standalone', () => {
    renderPage()
    expect(screen.getByText(/← Volver al inicio de sesión/i)).toBeInTheDocument()
  })

  it('muestra error genérico cuando no hay detail en la excepción', async () => {
    forgotPassword.mockRejectedValueOnce({})
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }))
    await waitFor(() => {
      expect(screen.getByText(/error al enviar el enlace/i)).toBeInTheDocument()
    })
  })
})
