/**
 * chat.test.js — Tests del servicio de chat del frontend.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

import { chatService } from '../../services/chat'
import api from '../../services/api'

describe('chatService — getSalas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a GET /chat/salas', async () => {
    api.get.mockResolvedValueOnce({ data: { salas: [] } })
    await chatService.getSalas()
    expect(api.get).toHaveBeenCalledWith('/chat/salas')
  })

  it('devuelve los datos de la respuesta', async () => {
    api.get.mockResolvedValueOnce({ data: { salas: [{ id: 1 }] } })
    const result = await chatService.getSalas()
    expect(result.salas).toHaveLength(1)
  })
})

describe('chatService — crearSala', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a POST /chat/salas con id_tienda', async () => {
    api.post.mockResolvedValueOnce({ data: { id_sala: 5 } })
    await chatService.crearSala(3)
    expect(api.post).toHaveBeenCalledWith('/chat/salas', { id_tienda: 3 })
  })
})

describe('chatService — obtenerMensajes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a GET con id_sala, limit y offset', async () => {
    api.get.mockResolvedValueOnce({ data: { mensajes: [] } })
    await chatService.obtenerMensajes(1, 50, 0)
    expect(api.get).toHaveBeenCalledWith('/chat/salas/1/mensajes?limit=50&offset=0')
  })

  it('usa valores por defecto limit=50 offset=0', async () => {
    api.get.mockResolvedValueOnce({ data: { mensajes: [] } })
    await chatService.obtenerMensajes(2)
    expect(api.get).toHaveBeenCalledWith('/chat/salas/2/mensajes?limit=50&offset=0')
  })
})

describe('chatService — enviarMensaje', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a POST /chat/mensajes con id_sala y mensaje', async () => {
    api.post.mockResolvedValueOnce({ data: { id_mensaje: 10 } })
    await chatService.enviarMensaje(1, 'Hola')
    expect(api.post).toHaveBeenCalledWith('/chat/mensajes', { id_sala: 1, mensaje: 'Hola' })
  })
})

describe('chatService — marcarMensajeLeido', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a PUT /chat/mensajes/:id/leer', async () => {
    api.put.mockResolvedValueOnce({ data: {} })
    await chatService.marcarMensajeLeido(5)
    expect(api.put).toHaveBeenCalledWith('/chat/mensajes/5/leer', {})
  })
})

describe('chatService — marcarSalaLeida', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a PUT /chat/salas/:id/marcar-leidos', async () => {
    api.put.mockResolvedValueOnce({ data: {} })
    await chatService.marcarSalaLeida(3)
    expect(api.put).toHaveBeenCalledWith('/chat/salas/3/marcar-leidos', {})
  })
})

describe('chatService — eliminarSala', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a DELETE /chat/salas/:id', async () => {
    api.delete.mockResolvedValueOnce({ data: {} })
    await chatService.eliminarSala(2)
    expect(api.delete).toHaveBeenCalledWith('/chat/salas/2')
  })
})

describe('chatService — vaciarChat', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a DELETE /chat/salas/:id/mensajes', async () => {
    api.delete.mockResolvedValueOnce({ data: {} })
    await chatService.vaciarChat(4)
    expect(api.delete).toHaveBeenCalledWith('/chat/salas/4/mensajes')
  })
})
