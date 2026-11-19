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
    IconDollar: Icon,
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

  it('edita un cupón existente y convierte el descuento antes de guardarlo', async () => {
    getCuponesTienda.mockResolvedValue({
      data: [{
        id_cupon: 31,
        codigo_cupon: 'LECTURA',
        tipo_descuento: 'porcentaje',
        valor_descuento: 10,
        minimo_compra: 0,
        usos_maximos: 20,
        usos_actuales: 3,
        activo: true,
        fecha_fin: '2099-12-31',
      }],
    })
    render(<SeccionCuponesVendedor tiendaId={12} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText(/Valor del descuento/), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(editarCupon).toHaveBeenCalledWith(
      31,
      expect.objectContaining({ codigo_cupon: 'LECTURA', valor_descuento: 25, activo: 1 }),
    ))
    expect(notify).toHaveBeenCalledWith('Cupón actualizado correctamente', 'success')
  })

  it('alterna el estado del cupón y confirma su eliminación', async () => {
    getCuponesTienda.mockResolvedValue({
      data: [{
        id_cupon: 32,
        codigo_cupon: 'PAUSABLE',
        tipo_descuento: 'fijo',
        valor_descuento: 5000,
        usos_actuales: 0,
        usos_maximos: null,
        activo: true,
        fecha_fin: '2099-12-31',
      }],
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SeccionCuponesVendedor tiendaId={12} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Activo' }))
    await waitFor(() => expect(editarCupon).toHaveBeenCalledWith(32, { activo: 0 }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(confirm).toHaveBeenCalledWith('¿Estás seguro de que deseas eliminar este cupón?')
    await waitFor(() => expect(eliminarCupon).toHaveBeenCalledWith(32))
  })

  it('notifica cuando no puede cargar los cupones de la tienda', async () => {
    getCuponesTienda.mockRejectedValue(new Error('network error'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<SeccionCuponesVendedor tiendaId={12} />)

    await waitFor(() => expect(notify).toHaveBeenCalledWith('Error al cargar cupones de tienda', 'error'))
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
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

  it('requiere un libro para el impulso principal y permite cancelar uno activo', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/impulsos/tipos') {
        return Promise.resolve({ data: [{
          id_tipo_impulso: 4, tipo: 'home', nombre: 'Destacado en portada',
          descripcion: 'Impulso de portada', precio: 12000, duracion_dias: 7,
        }] })
      }
      if (path === '/impulsos/mis-impulsos') {
        return Promise.resolve({ data: [{
          id_impulso: 9, tipo: 'desconocido', estado: 'Activo',
          nombre_impulso: 'Campaña activa', fecha_inicio: '2026-11-01',
          fecha_fin: '2026-11-08', monto_pagado: 12000,
        }] })
      }
      if (path === '/libros/mis-libros') {
        return Promise.resolve({ data: [{ id_libro: 5, titulo: 'Libro para impulsar' }] })
      }
      return Promise.resolve({ data: [] })
    })
    api.post.mockRejectedValueOnce({ response: { data: { detail: 'No se pudo contratar' } } })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<SeccionImpulsos tiendaId={2} />)
    fireEvent.click(await screen.findByText('Destacado en portada'))
    const libro = screen.getByLabelText('Selecciona el libro a impulsar *')
    fireEvent.change(libro, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Contratar por/ }))
    expect(await screen.findByText('No se pudo contratar')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Mis Impulsos Activos/ }))
    expect(screen.getByText('Campaña activa')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/impulsos/9'))
    expect(await screen.findByText('Impulso cancelado correctamente.')).toBeTruthy()
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
