// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../context/AuthContext'
import { getCalificacionesVendedor, getLibreria } from '../../services/api'
import CalificacionesVendedor from '../../screens/CalificacionesVendedor'

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const nativeElement = (tag) => ({ children, onPress, accessibilityLabel }) => (
    ReactModule.createElement(tag, {
      type: tag === 'button' ? 'button' : undefined,
      onClick: onPress,
      'aria-label': accessibilityLabel,
      role: tag === 'button' ? 'button' : undefined,
    }, children)
  )
  const renderPart = (part) => typeof part === 'function'
    ? ReactModule.createElement(part)
    : part

  return {
    ActivityIndicator: nativeElement('span'),
    FlatList: ({ data = [], renderItem, keyExtractor, ListHeaderComponent, ListEmptyComponent, ListFooterComponent, refreshControl }) => (
      ReactModule.createElement('div', null,
        renderPart(ListHeaderComponent),
        data.length
          ? data.map((item, index) => ReactModule.createElement(
            ReactModule.Fragment,
            { key: keyExtractor ? keyExtractor(item, index) : index },
            renderItem({ item, index }),
          ))
          : renderPart(ListEmptyComponent),
        renderPart(ListFooterComponent),
        renderPart(refreshControl),
      )
    ),
    RefreshControl: ({ onRefresh }) => ReactModule.createElement(
      'button',
      { type: 'button', onClick: onRefresh },
      'Actualizar calificaciones',
    ),
    StyleSheet: { create: (styles) => styles },
    Text: nativeElement('span'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  }
})

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}))

vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react')
  return { useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]) }
})

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    AuthContext: ReactModule.createContext({
      user: { nombre: 'Vendedora' },
      signOut: vi.fn(),
    }),
  }
})

vi.mock('../../services/api', () => ({
  getCalificacionesVendedor: vi.fn(),
  getLibreria: vi.fn(),
}))

vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible, onClose, onSignOut }) => visible ? (
    <nav>
      <button onClick={onClose}>Cerrar menú vendedor</button>
      <button onClick={onSignOut}>Salir de la cuenta</button>
    </nav>
  ) : null,
}))

vi.mock('../../components/Icons', () => ({
  IconCalendar: () => <span>Calendario</span>,
  IconMessage: () => <span>Mensaje</span>,
  IconStar: () => <span>Estrella</span>,
}))

vi.mock('../../components/Footer', () => ({ default: () => <footer>Pie de página</footer> }))

const renderConUsuario = (element, user = { nombre: 'Vendedora' }, signOut = vi.fn()) => ({
  ...render(
    <AuthContext.Provider value={{ user, signOut }}>
      {element}
    </AuthContext.Provider>,
  ),
  signOut,
})

describe('CalificacionesVendedor: comportamiento de la pantalla', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLibreria.mockResolvedValue({ data: { id_tienda: 8 } })
    getCalificacionesVendedor.mockResolvedValue({ data: {} })
  })

  afterEach(cleanup)

  it('presenta el promedio, la distribución y las reseñas; permite actualizar', async () => {
    const fechaActual = new Date()
    fechaActual.setDate(15)
    fechaActual.setHours(12, 0, 0, 0)
    getCalificacionesVendedor.mockResolvedValue({
      data: {
        total: 2,
        promedio: 4.7,
        distribucion: { 5: 1, 3: 1 },
        calificaciones: [
          {
            id_calificacion: 1,
            nombre_usuario: 'Ana María',
            calificacion: 5,
            fecha_calificacion: fechaActual.toISOString(),
            comentario: 'Excelente atención.',
          },
          {
            id_calificacion: 2,
            nombre_usuario: '',
            calificacion: 3,
            fecha_calificacion: null,
            comentario: '',
          },
        ],
      },
    })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)

    expect(await screen.findByText('Promedio general')).toBeTruthy()
    expect(screen.getByText('4.7')).toBeTruthy()
    expect(screen.getByText('Ana María')).toBeTruthy()
    expect(screen.getByText(/Excelente atención/)).toBeTruthy()
    expect(screen.getByText('Cliente')).toBeTruthy()
    expect(screen.getByText('Sin fecha')).toBeTruthy()
    expect(screen.getAllByText('1 (50%)')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar calificaciones' }))
    await waitFor(() => expect(getCalificacionesVendedor).toHaveBeenCalledTimes(2))
    expect(getCalificacionesVendedor).toHaveBeenCalledWith(8)
  })

  it('muestra error si no hay tienda y permite reintentar hasta obtener el estado vacío', async () => {
    getLibreria
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { id_tienda: 12 } })
    getCalificacionesVendedor.mockResolvedValue({ data: { total: 0, calificaciones: [] } })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)

    expect(await screen.findByText('No fue posible cargar las calificaciones')).toBeTruthy()
    expect(screen.getByText('No se encontró la tienda del vendedor.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Aún no tienes calificaciones')).toBeTruthy()
    expect(getCalificacionesVendedor).toHaveBeenCalledWith(12)
  })

  it('expone el detalle del servicio y permite cerrar el menú de vendedor', async () => {
    getCalificacionesVendedor
      .mockRejectedValueOnce({ response: { data: { detail: 'Servicio temporalmente no disponible' } } })
      .mockResolvedValueOnce({ data: { total: 0, calificaciones: [] } })
    const signOut = vi.fn()
    renderConUsuario(
      <CalificacionesVendedor navigation={{ navigate: vi.fn() }} />,
      { nombre: 'Vendedora de prueba' },
      signOut,
    )

    expect(await screen.findByText('Servicio temporalmente no disponible')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú vendedor' }))
    expect(screen.queryByRole('navigation')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salir de la cuenta' }))
    expect(signOut).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Aún no tienes calificaciones')).toBeTruthy()
  })
})
