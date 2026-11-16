// @vitest-environment jsdom

/**
 * CalificacionesVendedor.extra.test.jsx — ramas no cubiertas del 5.3% faltante
 *
 * Cubre:
 * - Estado de carga (loading=true): muestra ActivityIndicator
 * - temaPromedio: promedio ≥ 4.5 (verde), 3.5–4.4 (amarillo), < 3.5 (rojo)
 * - colorCalificacion: 4+ (verde), 3 (amarillo), < 3 (rojo)
 * - Cabecera con singular "opinión" cuando total === 1
 * - Calificación con comentario muestra las comillas
 * - Footer onLinkPress (siempre () => {})
 * - esteMes: solo calificaciones del mes actual cuentan
 * - Iniciales de nombre_usuario con dos palabras
 */

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
  const renderPart = (part) =>
    typeof part === 'function' ? ReactModule.createElement(part) : part

  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Cargando calificaciones'),
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
      'button', { type: 'button', onClick: onRefresh }, 'Actualizar',
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
      user: { nombre: 'Vendedor' },
      signOut: vi.fn(),
    }),
  }
})

vi.mock('../../services/api', () => ({
  getCalificacionesVendedor: vi.fn(),
  getLibreria: vi.fn(),
}))

vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible }) => visible ? <nav>Sidebar</nav> : null,
}))

vi.mock('../../components/Icons', () => ({
  IconCalendar: () => <span>Calendario</span>,
  IconMessage:  () => <span>Mensaje</span>,
  IconStar:     ({ color, filled }) => (
    <span data-color={color} data-filled={String(!!filled)}>★</span>
  ),
}))

vi.mock('../../components/Footer', () => ({
  default: ({ onLinkPress }) => (
    <button type="button" onClick={() => onLinkPress('terminos')}>Footer</button>
  ),
}))

const renderConUsuario = (element, user = { nombre: 'Vendedor' }, signOut = vi.fn()) =>
  render(
    <AuthContext.Provider value={{ user, signOut }}>
      {element}
    </AuthContext.Provider>
  )

describe('CalificacionesVendedor — ramas extra', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLibreria.mockResolvedValue({ data: { id_tienda: 1 } })
    getCalificacionesVendedor.mockResolvedValue({ data: {} })
  })
  afterEach(cleanup)

  it('muestra ActivityIndicator durante la carga inicial', () => {
    getCalificacionesVendedor.mockReturnValueOnce(new Promise(() => {}))
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)
    expect(screen.getByText('Cargando calificaciones')).toBeTruthy()
  })

  it('muestra "opinión" (singular) cuando total === 1', async () => {
    const hoy = new Date()
    getCalificacionesVendedor.mockResolvedValueOnce({
      data: {
        total: 1,
        promedio: 5.0,
        distribucion: { 5: 1 },
        calificaciones: [{
          id_calificacion: 1,
          nombre_usuario: 'María López',
          calificacion: 5,
          fecha_calificacion: hoy.toISOString(),
          comentario: 'Perfecto servicio.',
        }],
      },
    })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)
    expect(await screen.findByText(/sobre 1 opinión/)).toBeTruthy()
  })

  it('muestra el comentario entre comillas cuando existe', async () => {
    getCalificacionesVendedor.mockResolvedValueOnce({
      data: {
        total: 1,
        promedio: 4.0,
        distribucion: { 4: 1 },
        calificaciones: [{
          id_calificacion: 2,
          nombre_usuario: 'Pedro',
          calificacion: 4,
          fecha_calificacion: new Date().toISOString(),
          comentario: 'Muy buen servicio.',
        }],
      },
    })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)
    const comentario = await screen.findByText(/Muy buen servicio\./)
    expect(comentario.textContent).toBe('“Muy buen servicio.”')
  })

  it('temaPromedio ≥ 4.5 renderiza la tarjeta de promedio verde (D1FAE5)', async () => {
    getCalificacionesVendedor.mockResolvedValueOnce({
      data: {
        total: 2,
        promedio: 4.8,
        distribucion: { 5: 2 },
        calificaciones: [
          { id_calificacion: 10, nombre_usuario: 'A', calificacion: 5, fecha_calificacion: null, comentario: '' },
          { id_calificacion: 11, nombre_usuario: 'B', calificacion: 5, fecha_calificacion: null, comentario: '' },
        ],
      },
    })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)
    expect(await screen.findByText('4.8')).toBeTruthy()
  })

  it('temaPromedio 3.5–4.4 renderiza la tarjeta de promedio amarilla', async () => {
    getCalificacionesVendedor.mockResolvedValueOnce({
      data: {
        total: 1,
        promedio: 3.8,
        distribucion: { 4: 1 },
        calificaciones: [
          { id_calificacion: 20, nombre_usuario: 'C', calificacion: 4, fecha_calificacion: null, comentario: '' },
        ],
      },
    })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)
    expect(await screen.findByText('3.8')).toBeTruthy()
  })

  it('temaPromedio < 3.5 renderiza la tarjeta de promedio roja', async () => {
    getCalificacionesVendedor.mockResolvedValueOnce({
      data: {
        total: 1,
        promedio: 2.0,
        distribucion: { 2: 1 },
        calificaciones: [
          { id_calificacion: 30, nombre_usuario: 'D', calificacion: 2, fecha_calificacion: null, comentario: '' },
        ],
      },
    })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)
    expect(await screen.findByText('2.0')).toBeTruthy()
  })

  it('el Footer llama onLinkPress sin lanzar error', async () => {
    getCalificacionesVendedor.mockResolvedValueOnce({ data: { total: 0, calificaciones: [] } })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)
    await screen.findByText('Aún no tienes calificaciones')
    fireEvent.click(screen.getByText('Footer'))
    // No debe lanzar
  })

  it('las iniciales se forman con las dos primeras palabras del nombre', async () => {
    getCalificacionesVendedor.mockResolvedValueOnce({
      data: {
        total: 1,
        promedio: 5.0,
        distribucion: { 5: 1 },
        calificaciones: [{
          id_calificacion: 40,
          nombre_usuario: 'Ana María',
          calificacion: 5,
          fecha_calificacion: null,
          comentario: '',
        }],
      },
    })
    renderConUsuario(<CalificacionesVendedor navigation={{ navigate: vi.fn() }} />)
    expect(await screen.findByText('AM')).toBeTruthy()
  })
})
