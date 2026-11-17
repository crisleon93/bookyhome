// @vitest-environment jsdom

import React, { useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ChatSocketProvider, useChatSocket } from '../../context/ChatSocketContext'
import { AuthContext } from '../../context/AuthContext'
import { NotificationContext } from '../../context/NotificationContext'

const mocks = vi.hoisted(() => ({
  getSalasUsuario: vi.fn(),
  incrementarMsg: vi.fn(),
  incrementarNotif: vi.fn(),
  resetearMsg: vi.fn(),
  setMsgCount: vi.fn(),
}))

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { AuthContext: ReactModule.createContext({ token: null }) }
})
vi.mock('../../context/NotificationContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { NotificationContext: ReactModule.createContext({}) }
})
vi.mock('../../services/api', () => ({
  default: {
    defaults: { baseURL: 'https://api.example.test' },
    interceptors: { response: { use: vi.fn(() => 1), eject: vi.fn() } },
  },
  getSalasUsuario: mocks.getSalasUsuario,
}))

class MockWebSocket {
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances = []

  constructor(url) {
    this.url = url
    this.readyState = 0
    this.close = vi.fn()
    this.send = vi.fn()
    MockWebSocket.instances.push(this)
  }
}

function Consumer() {
  const socket = useChatSocket()
  const [lastEvent, setLastEvent] = useState('ninguno')

  useEffect(() => socket.suscribirseAMensajes((event) => {
    setLastEvent(event.mensaje?.mensaje || event.tipo)
  }), [socket.suscribirseAMensajes])

  return (
    <div>
      <span data-testid="state">
        {`${socket.salas.length}:${socket.conectado}:${socket.loadingSalas}:${lastEvent}`}
      </span>
      <button type="button" onClick={() => socket.marcarSalaLeidaLocal(1)}>Marcar leída</button>
      <button type="button" onClick={() => socket.enviarPorSocket(1, 'saludo')}>Enviar</button>
    </div>
  )
}

function renderProvider(token = 'test-token') {
  return render(
    <AuthContext.Provider value={{ token }}>
      <NotificationContext.Provider value={{
        incrementarMsg: mocks.incrementarMsg,
        incrementarNotif: mocks.incrementarNotif,
        resetearMsg: mocks.resetearMsg,
        setMsgCount: mocks.setMsgCount,
      }}>
        <ChatSocketProvider><Consumer /></ChatSocketProvider>
      </NotificationContext.Provider>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  MockWebSocket.instances = []
  vi.stubGlobal('WebSocket', MockWebSocket)
  mocks.getSalasUsuario.mockResolvedValue({
    data: { salas: [{ id_sala: 1, no_leidos: 2, nombre_tienda: 'Lecturas' }] },
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ChatSocketProvider', () => {
  it('carga salas, sincroniza el contador y distribuye nuevos mensajes', async () => {
    renderProvider()

    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('1:false:false:ninguno'))
    expect(mocks.getSalasUsuario).toHaveBeenCalledOnce()
    expect(mocks.setMsgCount).toHaveBeenCalledWith(2)
    expect(MockWebSocket.instances[0].url).toBe('wss://api.example.test/chat/ws?token=test-token')

    await act(async () => {
      MockWebSocket.instances[0].onmessage({
        data: JSON.stringify({
          tipo: 'nuevo_mensaje',
          mensaje: { id_sala: 1, mensaje: 'Mensaje nuevo', enviado_en: '2026-03-01' },
        }),
      })
    })
    expect(screen.getByTestId('state').textContent).toBe('1:false:false:Mensaje nuevo')
    expect(mocks.incrementarMsg).toHaveBeenCalledOnce()
    expect(mocks.incrementarNotif).toHaveBeenCalledOnce()
  })

  it('marca la sala como leída y envía solo cuando el socket está abierto', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('state').textContent).toContain('1:false:false'))

    const socket = MockWebSocket.instances[0]
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(socket.send).not.toHaveBeenCalled()
    socket.readyState = MockWebSocket.OPEN
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({
      tipo: 'mensaje',
      id_sala: 1,
      mensaje: 'saludo',
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Marcar leída' }))
    expect(mocks.resetearMsg).toHaveBeenCalledWith(2)
  })

  it('no abre conexión ni solicita salas cuando no hay token', async () => {
    renderProvider(null)
    await waitFor(() => expect(screen.getByTestId('state').textContent).toContain('0:false:false'))

    expect(mocks.getSalasUsuario).not.toHaveBeenCalled()
    expect(MockWebSocket.instances).toHaveLength(0)
  })

  it('ignora mensajes WebSocket que no contienen JSON válido', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('state').textContent).toContain('1:false:false'))

    await act(async () => {
      MockWebSocket.instances[0].onmessage({ data: '{' })
    })
    expect(screen.getByTestId('state').textContent).toBe('1:false:false:ninguno')
  })
})
