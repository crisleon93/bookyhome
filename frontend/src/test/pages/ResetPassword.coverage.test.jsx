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

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.apiPost.mockResolvedValue({ data: {} })
  })

  it('guía al inicio si el enlace no contiene token', () => {
    render(<MemoryRouter><ResetPassword /></MemoryRouter>)
    expect(screen.getByText('Enlace inválido')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/')
    expect(mocks.apiPost).not.toHaveBeenCalled()
  })

  it('valida contraseña, muestra errores del servidor y confirma el cambio exitoso', async () => {
    mocks.apiPost
      .mockRejectedValueOnce({ response: { data: { detail: 'Token vencido' } } })
      .mockResolvedValueOnce({ data: {} })
    render(
      <MemoryRouter initialEntries={['/reset-password?token=reset-123']}>
        <ResetPassword />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'short' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'other' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy()
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy()
    expect(mocks.apiPost).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'NuevaClave123!' } })
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'NuevaClave123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith('/reset-password', {
        token: 'reset-123',
        password: 'NuevaClave123!',
      })
    })
    expect(await screen.findByText('Token vencido')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByText('Contraseña actualizada')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ir al inicio de sesión' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/')
  })
})
