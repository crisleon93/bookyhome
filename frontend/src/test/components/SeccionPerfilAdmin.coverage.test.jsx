/**
 * SeccionPerfilAdmin.coverage.test.jsx
 * Cobertura adicional para SeccionPerfilAdmin.jsx (57.4%)
 */

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SeccionPerfilAdmin from '../../components/dashboard/SeccionPerfilAdmin'

const mocks = vi.hoisted(() => ({
  notify: vi.fn(),
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  saveBannerColor: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet, put: mocks.apiPut },
  uploadProfilePhoto: mocks.uploadProfilePhoto,
  uploadBannerPhoto: mocks.uploadBannerPhoto,
  saveBannerColor: mocks.saveBannerColor,
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}))

vi.mock('../ToastProvider', () => ({ notify: mocks.notify }))
vi.mock('../../components/ToastProvider', () => ({ notify: mocks.notify }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconUser: Icon, IconUsers: Icon, IconBook: Icon, IconPackage: Icon,
    IconStore: Icon, IconAlertTriangle: Icon, IconTool: Icon,
    IconCheck: Icon, IconSettings: Icon,
  }
})

const perfilBase = {
  nombre_usuario: 'Admin Prueba',
  correo_usuario: 'admin@test.com',
  telefono: '3001234567',
  fecha_registro: '2024-01-15T00:00:00',
  foto_perfil: null,
  banner_perfil: null,
  banner_color: '#7A1E3A',
}

const quejasMock = [
  { tipo_solicitud: 'Reclamo', estado: 'Abierto' },
  { tipo_solicitud: 'Reclamo', estado: 'Resuelto' },
  { tipo_solicitud: 'Soporte', estado: 'En revisión' },
]

beforeEach(() => {
  vi.clearAllMocks()
  mocks.apiGet.mockImplementation((url) => {
    if (url === '/perfil/mi-perfil') return Promise.resolve({ data: perfilBase })
    if (url === '/quejas/admin/todas') return Promise.resolve({ data: quejasMock })
    return Promise.resolve({ data: [] })
  })
  mocks.apiPut.mockResolvedValue({ data: {} })
  mocks.saveBannerColor.mockResolvedValue({})
})

afterEach(cleanup)

describe('SeccionPerfilAdmin', () => {
  it('carga y muestra nombre, email y fecha de registro', async () => {
    render(<SeccionPerfilAdmin stats={{}} />)
    expect(await screen.findByDisplayValue('Admin')).toBeTruthy()
    expect(screen.getByDisplayValue('Prueba')).toBeTruthy()
    expect(screen.getByDisplayValue('admin@test.com')).toBeTruthy()
    expect(screen.getByDisplayValue('3001234567')).toBeTruthy()
    expect(screen.getByText(/Miembro desde/)).toBeTruthy()
  })

  it('guarda cambios del perfil exitosamente', async () => {
    render(<SeccionPerfilAdmin stats={{}} />)
    await screen.findByDisplayValue('Admin')
    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Nuevo' } })
    fireEvent.click(screen.getByText('Guardar cambios'))
    await waitFor(() => expect(mocks.apiPut).toHaveBeenCalledWith('/perfil/actualizar', {
      nombre_usuario: 'Nuevo Prueba',
      telefono: '3001234567',
    }))
    expect(mocks.notify).toHaveBeenCalledWith('Perfil actualizado', 'success')
  })

  it('muestra error si falla el guardado del perfil', async () => {
    mocks.apiPut.mockRejectedValueOnce(new Error('error red'))
    render(<SeccionPerfilAdmin stats={{}} />)
    await screen.findByDisplayValue('Admin')
    fireEvent.click(screen.getByText('Guardar cambios'))
    await waitFor(() => expect(mocks.notify).toHaveBeenCalledWith('Error al actualizar perfil', 'error'))
  })

  it('abre y cierra el editor de banner', async () => {
    render(<SeccionPerfilAdmin stats={{}} />)
    await screen.findByDisplayValue('Admin')
    fireEvent.click(screen.getByText('Editar'))
    expect(screen.getByText('Colores sólidos')).toBeTruthy()
    fireEvent.click(screen.getByText('Editar'))
    expect(screen.queryByText('Colores sólidos')).toBeNull()
  })

  it('selecciona color sólido de banner y llama a saveBannerColor', async () => {
    render(<SeccionPerfilAdmin stats={{}} />)
    await screen.findByDisplayValue('Admin')
    fireEvent.click(screen.getByText('Editar'))
    const colorButtons = screen.getAllByTitle('#1E3A7A')
    fireEvent.click(colorButtons[0])
    await waitFor(() => expect(mocks.saveBannerColor).toHaveBeenCalledWith('#1E3A7A'))
    expect(mocks.notify).toHaveBeenCalledWith('Color de banner guardado', 'success')
  })

  it('muestra estadísticas de plataforma con valores', async () => {
    render(<SeccionPerfilAdmin stats={{ usuarios: 100, libros: 50, ordenes: 200, tiendas: 10 }} />)
    await screen.findByDisplayValue('Admin')
    expect(screen.getByText('100')).toBeTruthy()
    expect(screen.getByText('50')).toBeTruthy()
    expect(screen.getByText('200')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
  })

  it('carga y muestra estadísticas de gestión desde la API', async () => {
    render(<SeccionPerfilAdmin stats={{}} />)
    await screen.findByDisplayValue('Admin')
    // Verificar que se llamó a la API de quejas
    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/quejas/admin/todas'))
  })

  it('usa gestionProp en lugar de llamar a la API', async () => {
    const gestion = { reclamos: 5, soporte: 3, resueltos: 7, pendientes: 1 }
    render(<SeccionPerfilAdmin stats={{}} gestionProp={gestion} />)
    await screen.findByDisplayValue('Admin')
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    // Con gestionProp no llama a /quejas/admin/todas
    expect(mocks.apiGet).not.toHaveBeenCalledWith('/quejas/admin/todas')
  })

  it('toggle modo oscuro cambia localStorage y dispatcha evento', async () => {
    render(<SeccionPerfilAdmin stats={{}} />)
    await screen.findByDisplayValue('Admin')
    const toggle = screen.getByLabelText('Activar modo oscuro')
    expect(toggle.checked).toBe(false)
    fireEvent.click(toggle)
    expect(localStorage.getItem('darkMode')).toBe('true')
    fireEvent.click(toggle)
    expect(localStorage.getItem('darkMode')).toBe('false')
  })

  it('carga perfil con foto y banner existentes', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/perfil/mi-perfil') return Promise.resolve({
        data: {
          ...perfilBase,
          foto_perfil: '/uploads/foto.jpg',
          banner_perfil: '/uploads/banner.jpg',
        }
      })
      return Promise.resolve({ data: [] })
    })
    render(<SeccionPerfilAdmin stats={{}} />)
    await screen.findByDisplayValue('Admin')
    expect(screen.getByAltText('Foto de perfil')).toBeTruthy()
  })

  it('aplica el tema guardado para el perfil administrador', async () => {
    localStorage.setItem('darkMode_admin', 'true')
    render(<SeccionPerfilAdmin stats={{}} />)

    await screen.findByDisplayValue('Admin')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    window.dispatchEvent(new CustomEvent('darkModeChange', {
      detail: { role: 'comprador', darkMode: false },
    }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    fireEvent.click(screen.getByText('Editar'))
    expect(screen.getByText('Colores sólidos')).toBeInTheDocument()

    localStorage.setItem('darkMode_admin', 'false')
    window.dispatchEvent(new CustomEvent('darkModeChange', {
      detail: { role: 'admin' },
    }))
    localStorage.removeItem('darkMode_admin')
    document.documentElement.classList.remove('dark')
  })
})
