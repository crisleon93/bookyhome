/**
 * historial.test.js — Tests del servicio historial.js
 * Importa el módulo real para que SonarCloud cuente la cobertura.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { items: [] } })),
    post: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    delete: vi.fn(() => Promise.resolve({ data: { ok: true } })),
  },
}))

import { historialService } from '../../services/historial'
import api from '../../services/api'

describe('historialService — obtener', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a GET /historial con params por defecto', async () => {
    await historialService.obtener()
    expect(api.get).toHaveBeenCalledWith('/historial', {
      params: { tipo: null, limit: 50, offset: 0 },
    })
  })

  it('llama a GET /historial con params personalizados', async () => {
    await historialService.obtener('vista', 20, 10)
    expect(api.get).toHaveBeenCalledWith('/historial', {
      params: { tipo: 'vista', limit: 20, offset: 10 },
    })
  })

  it('devuelve los datos de la respuesta', async () => {
    api.get.mockResolvedValueOnce({ data: { items: [{ id: 1 }] } })
    const result = await historialService.obtener()
    expect(result.items).toHaveLength(1)
  })
})

describe('historialService — registrar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a POST /historial con los datos correctos', async () => {
    await historialService.registrar('vista', 5, null, 'Ver libro')
    expect(api.post).toHaveBeenCalledWith('/historial', {
      tipo: 'vista',
      id_libro: 5,
      id_tienda: null,
      descripcion: 'Ver libro',
    })
  })

  it('usa null por defecto para campos opcionales', async () => {
    await historialService.registrar('busqueda')
    expect(api.post).toHaveBeenCalledWith('/historial', {
      tipo: 'busqueda',
      id_libro: null,
      id_tienda: null,
      descripcion: null,
    })
  })
})

describe('historialService — obtenerEstadisticas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a GET /historial/estadisticas', async () => {
    await historialService.obtenerEstadisticas()
    expect(api.get).toHaveBeenCalledWith('/historial/estadisticas')
  })
})

describe('historialService — eliminar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a DELETE /historial/:id', async () => {
    await historialService.eliminar(7)
    expect(api.delete).toHaveBeenCalledWith('/historial/7')
  })
})
