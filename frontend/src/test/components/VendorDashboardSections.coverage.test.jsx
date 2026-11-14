import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SeccionCuponesVendedor from '../../components/SeccionCuponesVendedor'
import SeccionImpulsos from '../../components/SeccionImpulsos'
import SeccionOfertas from '../../components/SeccionOfertas'
import SeccionPerfilAdmin from '../../components/dashboard/SeccionPerfilAdmin'
import api, { crearCupon, editarCupon, eliminarCupon, getCuponesTienda, saveBannerColor } from '../../services/api'
import { notify } from '../../components/ToastProvider'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  crearCupon: vi.fn(),
  editarCupon: vi.fn(),
  eliminarCupon: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  getCuponesTienda: vi.fn(),
  saveBannerColor: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  uploadProfilePhoto: vi.fn(),
}))
vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconBook: Icon,
    IconBookOpen: Icon,
    IconCalendar: Icon,
    IconCheck: Icon,
    IconEdit: Icon,
    IconEye: Icon,
    IconGift: Icon,
    IconLock: Icon,
    IconPackage: Icon,
    IconPlus: Icon,
    IconRefresh: Icon,
    IconSettings: Icon,
    IconStore: Icon,
    IconTag: Icon,
    IconTool: Icon,
    IconTrash: Icon,
    IconUser: Icon,
    IconUsers: Icon,
  }
})

describe('secciones del vendedor y administrador', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.get.mockImplementation((path) => {
      if (path === '/impulsos/tipos') {
        return Promise.resolve({ data: [{ id_tipo_impulso: 3, tipo: 'email', nombre: 'Email masivo', descripcion: 'Promociona por correo', precio: 12000, duracion_dias: 7 }] })
      }
      if (path === '/ofertas') return Promise.resolve({ data: [] })
      if (path === '/libros/mis-libros') return Promise.resolve({ data: [{ id_libro: 5, titulo: 'Libro disponible', autor_libro: 'Autora', stock: 4, precio_libro: 9000 }] })
      if (path === '/perfil/mi-perfil') return Promise.resolve({ data: { nombre_usuario: 'Admin Ruiz', correo_usuario: 'admin@example.com', telefono: '3005550101' } })
      if (path === '/quejas/admin/todas') return Promise.resolve({ data: [{ tipo_solicitud: 'Reclamo', estado: 'Abierto' }, { tipo_solicitud: 'Soporte', estado: 'Resuelto' }] })
      if (path === '/impulsos/mis-impulsos') return Promise.resolve({ data: [] })
      if (path === '/herramientas/mi-suscripcion') return Promise.resolve({ data: { activa: false } })
      return Promise.resolve({ data: [] })
    })
    api.post.mockResolvedValue({ data: { ok: true } })
    api.put.mockResolvedValue({ data: { ok: true } })
    api.delete.mockResolvedValue({ data: { ok: true } })
    getCuponesTienda.mockResolvedValue({ data: [] })
    crearCupon.mockResolvedValue({ data: { ok: true } })
    editarCupon.mockResolvedValue({ data: { ok: true } })
    eliminarCupon.mockResolvedValue({ data: { ok: true } })
    saveBannerColor.mockResolvedValue({})
  })

  afterEach(cleanup)

  it('valida y crea un cupón con código normalizado y valores numéricos', async () => {
    render(<SeccionCuponesVendedor tiendaId={12} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo cupón' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear cupón' }))
    expect(notify).toHaveBeenCalledWith('El código del cupón es obligatorio', 'error')

    fireEvent.change(screen.getByLabelText('Código del cupón *'), { target: { value: 'libros20' } })
    fireEvent.change(screen.getByLabelText(/Valor del descuento/), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cupón' }))

    await waitFor(() => expect(crearCupon).toHaveBeenCalledWith(expect.objectContaining({
      id_tienda: 12,
      codigo_cupon: 'LIBROS20',
      tipo_descuento: 'porcentaje',
      valor_descuento: 20,
      activo: 1,
    })))
  })

  it('contrata el impulso seleccionado y cambia a la lista de activos', async () => {
    const onNavegar = vi.fn()
    render(<SeccionImpulsos tiendaId={2} onNavegar={onNavegar} />)
    fireEvent.click(await screen.findByText('Email masivo'))
    fireEvent.click(screen.getByRole('button', { name: /Contratar por/ }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/impulsos/contratar', { id_tipo_impulso: 3 }))
    expect(await screen.findByText(/Impulso contratado con éxito/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Mis Impulsos Activos/ }))
    expect(screen.getByText('Aún no has contratado ningún impulso.')).toBeTruthy()
    fireEvent.click(screen.getByText('Contratar mi primer Impulso'))
    fireEvent.click(screen.getByText('Ver Planes'))
    expect(onNavegar).toHaveBeenCalledWith('Suscripciones')
  })

  it('abre el formulario de ofertas y ejecuta la validación del nombre requerido', async () => {
    render(<SeccionOfertas />)
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva oferta' }))
    expect(screen.getByText('Nueva oferta')).toBeTruthy()
    fireEvent.click(screen.getByText('✓ Crear oferta'))
    expect(screen.getByText('El nombre es obligatorio')).toBeTruthy()
    expect(api.post).not.toHaveBeenCalledWith('/ofertas', expect.anything(), expect.anything())
  })

  it('muestra métricas del administrador y guarda los datos del perfil', async () => {
    render(<SeccionPerfilAdmin
      stats={{ usuarios: 120, libros: 45, ordenes: 80, tiendas: 6 }}
    />)
    await screen.findByDisplayValue('Admin')
    expect(screen.getByText('120')).toBeTruthy()
    expect(screen.getByText('Reclamos recibidos')).toBeTruthy()
    expect(screen.getByText('Tickets de soporte')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Celular'), { target: { value: '3001112233' } })
    fireEvent.click(screen.getByText('Guardar cambios'))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/perfil/actualizar', {
      nombre_usuario: 'Admin Ruiz',
      telefono: '3001112233',
    }))

    fireEvent.click(screen.getByText('Editar'))
    fireEvent.click(screen.getByTitle('#1E3A7A'))
    await waitFor(() => expect(saveBannerColor).toHaveBeenCalledWith('#1E3A7A'))
  })
})
