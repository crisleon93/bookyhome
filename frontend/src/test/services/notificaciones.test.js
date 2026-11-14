import { beforeEach, describe, expect, it, vi } from 'vitest'
import { notificacionesService } from '../../services/notificaciones'

const mocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  default: {
    delete: mocks.apiDelete,
    get: mocks.apiGet,
    post: mocks.apiPost,
    put: mocks.apiPut,
  },
}))

describe('notificacionesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.apiGet.mockResolvedValue({ data: { notificaciones: [] } })
    mocks.apiPost.mockResolvedValue({ data: { ok: true } })
    mocks.apiPut.mockResolvedValue({ data: { ok: true } })
    mocks.apiDelete.mockResolvedValue({ data: { eliminadas: 1 } })
  })

  it('consulta con filtros y valores predeterminados y devuelve data', async () => {
    await expect(notificacionesService.obtener()).resolves.toEqual({ notificaciones: [] })
    expect(mocks.apiGet).toHaveBeenCalledWith('/notificaciones', {
      params: { solo_no_leidas: false, limit: 20, offset: 0 },
    })

    await notificacionesService.obtener(true, 5, 10)
    expect(mocks.apiGet).toHaveBeenLastCalledWith('/notificaciones', {
      params: { solo_no_leidas: true, limit: 5, offset: 10 },
    })
  })

  it('crea una notificación con todos los campos proporcionados', async () => {
    await expect(notificacionesService.crear('mensaje', 'Nuevo', 'Texto', 14))
      .resolves.toEqual({ ok: true })
    expect(mocks.apiPost).toHaveBeenCalledWith('/notificaciones', {
      tipo: 'mensaje',
      titulo: 'Nuevo',
      descripcion: 'Texto',
      referencia_id: 14,
    })
  })

  it('marca una y todas las notificaciones como leídas', async () => {
    await notificacionesService.marcarLeida(9)
    expect(mocks.apiPut).toHaveBeenNthCalledWith(1, '/notificaciones/9/leer', {})

    await notificacionesService.marcarTodasLeidas()
    expect(mocks.apiPut).toHaveBeenNthCalledWith(2, '/notificaciones/marcar-todas-leidas', {})
  })

  it('elimina una notificación y permite borrar por filtro', async () => {
    await notificacionesService.eliminar(7)
    expect(mocks.apiDelete).toHaveBeenNthCalledWith(1, '/notificaciones/7')

    await notificacionesService.eliminarVarias()
    expect(mocks.apiDelete).toHaveBeenNthCalledWith(2, '/notificaciones', {
      params: { filtro: 'leidas' },
    })
    await notificacionesService.eliminarVarias('semana')
    expect(mocks.apiDelete).toHaveBeenNthCalledWith(3, '/notificaciones', {
      params: { filtro: 'semana' },
    })
  })
})
