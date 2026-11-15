import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SeccionConfiguracion from '../../components/dashboard/SeccionConfiguracion'
import SeccionFavoritos from '../../components/dashboard/SeccionFavoritos'
import SeccionInicio from '../../components/dashboard/SeccionInicio'
import SeccionMiPerfil from '../../components/dashboard/SeccionMiPerfil'
import SeccionMisDirecciones from '../../components/dashboard/SeccionMisDirecciones'
import api, {
  getCuponesDisponibles,
  getEstadisticasUsuario,
  getOrdenes,
  getStoredLibros,
  saveBannerColor,
} from '../../services/api'
import { notify } from '../../components/ToastProvider'

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getCuponesDisponibles: vi.fn(),
  getEstadisticasUsuario: vi.fn(),
  getOrdenes: vi.fn(),
  getStoredLibros: vi.fn(),
  saveBannerColor: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  uploadProfilePhoto: vi.fn(),
}))
vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconBook: Icon,
    IconBookOpen: Icon,
    IconChartBar: Icon,
    IconChevronLeft: Icon,
    IconEyeClosed: Icon,
    IconEyeOpen: Icon,
    IconFavorites: Icon,
    IconGift: Icon,
    IconLocation: Icon,
    IconSettings: Icon,
    IconStar: Icon,
    IconUser: Icon,
  }
})
vi.mock('../../components/CouponsList', () => ({ default: ({ initialCoupons }) => <div data-testid="coupons">{initialCoupons.length} cupones</div> }))
vi.mock('../../components/LibroCard', () => ({
  default: ({ libro, onVerDetalles }) => <button onClick={() => onVerDetalles(libro)}>{libro.titulo}</button>,
}))
vi.mock('../../components/LeafletAddressPickerModal', () => ({
  default: ({ isOpen, onSelect }) => isOpen ? (
    <button onClick={() => onSelect({ direccion: 'Calle del mapa 10', ciudad: 'Bogotá', departamento: 'Cundinamarca' })}>Usar ubicación del mapa</button>
  ) : null,
}))

describe('secciones personales del comprador', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.get.mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
    getEstadisticasUsuario.mockResolvedValue({
      data: { total_gastado: 25000, num_compras: 2, ticket_promedio: 12500, nivel_fidelizacion: 'Bronce', categorias_favoritas: ['Historia'] },
    })
    saveBannerColor.mockResolvedValue({})
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('permite regresar al catálogo cuando no hay favoritos', () => {
    const onCatalog = vi.fn()
    render(<SeccionFavoritos onGoToCatalog={onCatalog} onSetActiveSide={vi.fn()} />)
    fireEvent.click(screen.getByText('Ir al catálogo'))
    expect(onCatalog).toHaveBeenCalledOnce()
  })

  it('muestra los favoritos guardados y persiste al quitar uno', () => {
    localStorage.setItem('favoritos', JSON.stringify([{
      id_libro: 5, titulo: 'La historia', autor: 'A. Autora', nombre_categoria: 'Historia', stock: 0,
    }]))
    const onSetActiveSide = vi.fn()
    render(<SeccionFavoritos onGoToCatalog={vi.fn()} onSetActiveSide={onSetActiveSide} />)
    expect(screen.getByText('Agotado')).toBeTruthy()
    fireEvent.click(screen.getByText('Ver en catálogo'))
    expect(onSetActiveSide).toHaveBeenCalledWith('Catálogo')
    fireEvent.click(screen.getByText('Quitar de favoritos'))
    expect(JSON.parse(localStorage.getItem('favoritos'))).toEqual([])
    expect(screen.getByText(/¡Agrega algunos desde el catálogo!/)).toBeTruthy()
  })

  it('carga preferencias, alterna un canal y guarda el cambio de tema', async () => {
    const initialPreferences = {
      notificaciones_mensajes: { email: true, web: false },
      notificaciones_resenas: { email: true, web: true },
      notificaciones_ofertas: { email: true, web: false },
      notificaciones_pedidos: { email: true, web: true },
      notificaciones_entregas: { email: true, web: true },
      notificaciones_pagos: { email: true, web: true },
      notificaciones_sistema: { email: true, web: true },
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ preferencias: initialPreferences }) })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    render(<SeccionConfiguracion userId={9} />)

    const checkboxes = await screen.findAllByRole('checkbox')
    expect(checkboxes[0].checked).toBe(true)
    fireEvent.click(checkboxes[0])
    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).notificaciones_mensajes.email).toBe(false)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Activar modo oscuro' }))
    expect(localStorage.getItem('darkMode')).toBe('true')
    expect(notify).toHaveBeenCalledWith('Modo oscuro activado', 'success')
  })

  it('carga y navega desde novedades, compras y cupones de la portada', async () => {
    const book = { id_libro: 8, titulo: 'Libro nuevo', autor_libro: 'Autor', precio_libro: 9000 }
    getStoredLibros.mockResolvedValue({ data: [book] })
    getOrdenes.mockResolvedValue({ data: [{ id_orden: 2, estado: 'pagado', items: [{ titulo: 'Compra reciente' }] }] })
    getCuponesDisponibles.mockResolvedValue({ data: [{ id: 1 }] })
    const onSelect = vi.fn()
    const onDetail = vi.fn()
    render(<SeccionInicio userName="Ana María" onSelectSeccion={onSelect} onVerDetalleLibro={onDetail} />)

    expect((await screen.findAllByText('Libro nuevo')).length).toBeGreaterThan(0)
    expect(screen.getByText('1 cupones')).toBeTruthy()
    expect(screen.getByText('Compra reciente')).toBeTruthy()
    fireEvent.click(screen.getByText('Explorar catálogo'))
    fireEvent.click(screen.getByText('Ver todas'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Libro nuevo' })[0])
    expect(onSelect).toHaveBeenNthCalledWith(1, 'Catálogo')
    expect(onSelect).toHaveBeenNthCalledWith(2, 'Mis Compras')
    expect(onDetail).toHaveBeenCalledWith(book)
  })

  it('guarda una dirección validada y abre el selector de mapa', async () => {
    api.get.mockResolvedValue({ data: [] })
    render(<SeccionMisDirecciones />)
    fireEvent.click(await screen.findByText('+ Agregar dirección'))
    fireEvent.click(screen.getByText('Guardar dirección'))
    expect(screen.getByText('La dirección es obligatoria')).toBeTruthy()

    fireEvent.click(screen.getByText('Elegir en mapa'))
    fireEvent.click(screen.getByText('Usar ubicación del mapa'))
    expect(screen.getByLabelText('Dirección').value).toBe('Calle del mapa 10')
    fireEvent.click(screen.getByText('Guardar dirección'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/perfil/direcciones', expect.objectContaining({
      direccion: 'Calle del mapa 10',
      ciudad: 'Bogotá',
    })))
  })

  it('edita una dirección, la marca como principal y permite eliminarla', async () => {
    const direccion = {
      id_direccion: 19,
      alias_direccion: 'Casa',
      direccion: 'Calle 10',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      codigo_postal: '110111',
      es_principal: false,
    }
    api.get.mockImplementation((path) => path === '/perfil/direcciones'
      ? Promise.resolve({ data: [direccion] })
      : Promise.resolve({ data: [] }))
    render(<SeccionMisDirecciones />)

    expect(await screen.findByText('Calle 10')).toBeTruthy()
    fireEvent.click(screen.getByText('Hacer principal'))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith(
      '/perfil/direcciones/19',
      { es_principal: true },
    ))
    expect(notify).toHaveBeenCalledWith('Dirección marcada como principal', 'success')

    fireEvent.click(screen.getByText('Editar'))
    fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'Oficina' } })
    fireEvent.click(screen.getByText('Actualizar dirección'))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/perfil/direcciones/19', {
      alias_direccion: 'Oficina',
      direccion: 'Calle 10',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      codigo_postal: '110111',
      es_principal: false,
    }))

    fireEvent.click(await screen.findByText('Eliminar'))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/perfil/direcciones/19'))
    expect(notify).toHaveBeenCalledWith('Dirección eliminada', 'success')
  })

  it('mantiene el formulario abierto y muestra el error al fallar el guardado', async () => {
    api.get.mockResolvedValue({ data: [] })
    api.post.mockRejectedValue({ response: { data: { detail: 'Dirección duplicada' } } })
    render(<SeccionMisDirecciones />)

    fireEvent.click(await screen.findByText('+ Agregar dirección'))
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Calle 20' } })
    fireEvent.click(screen.getByText('Guardar dirección'))

    expect(await screen.findByText('Dirección duplicada')).toBeTruthy()
    expect(screen.getByText('Cancelar')).toBeTruthy()
  })

  it('actualiza el perfil y muestra/cierra la escala de fidelización', async () => {
    api.get.mockImplementation((path) => path === '/perfil/mi-perfil'
      ? Promise.resolve({ data: { nombre_usuario: 'Ana Ruiz', correo_usuario: 'ana@example.com', telefono: '3001234567' } })
      : Promise.resolve({ data: [] }))
    render(<SeccionMiPerfil userId={4} />)

    await screen.findByDisplayValue('Ana')
    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: 'Ana María' } })
    fireEvent.click(screen.getByText('Guardar cambios'))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/perfil/actualizar', {
      nombre_usuario: 'Ana María Ruiz',
      telefono: '3001234567',
    }))

    fireEvent.click(screen.getByText('Ver detalles'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(within(screen.getByRole('dialog')).getAllByLabelText('Cerrar detalles de fidelización').at(-1))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
