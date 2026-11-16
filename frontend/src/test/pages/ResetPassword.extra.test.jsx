/**
 * ResetPassword.extra.test.jsx — ramas no cubiertas del 2.9% faltante
 *
 * Cubre:
 * - Botón "Iniciar sesión" (el link de texto, no el de éxito) → navigate('/')
 * - Estado "Cambiando..." mientras carga (botón deshabilitado)
 * - Error sin response.data.detail → usa fallback
 * - Solo password corto (confirmar coincide) → solo un error
 * - Solo confirmar distinto (password ok) → solo un error
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ResetPassword from '../../pages/ResetPassword'

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  default: { post: mocks.apiPost },
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate }
})

const renderWithToken = (token = 'tok-123') =>
  render(
    <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
      <ResetPassword />
    </MemoryRouter>
  )

describe('ResetPassword — ramas extra', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.apiPost.mockResolvedValue({ data: {} })
  })

  it('el link "Iniciar sesión" al pie llama a navigate("/")', () => {
    renderWithToken()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/')
  })

  it('deshabilita el botón y muestra "Cambiando..." mientras carga', () => {
    mocks.apiPost.mockReturnValueOnce(new Promise(() => {})) // nunca resuelve
    renderWithToken()
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'ValidPass1!' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'ValidPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    const btn = screen.getByRole('button', { name: 'Cambiando...' })
    expect(btn).toBeDisabled()
  })

  it('usa el fallback cuando el error no tiene response.data.detail', async () => {
    mocks.apiPost.mockRejectedValueOnce(new Error('network error'))
    renderWithToken()
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'ValidPass1!' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'ValidPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    await waitFor(() => {
      expect(screen.getByText('El enlace es inválido o ha expirado.')).toBeInTheDocument()
    })
  })

  it('muestra solo error de longitud cuando confirmar es igual pero password es corto', () => {
    renderWithToken()
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'short' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
    expect(screen.queryByText('Las contraseñas no coinciden')).toBeNull()
  })

  it('muestra solo error de coincidencia cuando password cumple longitud pero confirmar difiere', () => {
    renderWithToken()
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'ValidPass1!' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'OtroPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(screen.queryByText('La contraseña debe tener al menos 8 caracteres')).toBeNull()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
  })
})
