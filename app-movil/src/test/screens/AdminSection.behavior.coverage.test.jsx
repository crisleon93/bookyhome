// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminSection from '../../screens/AdminSection'
import { Alert } from 'react-native'
import {
  bloquearUsuario,
  getAdminLibros,
  getAdminOrdenes,
  getAdminTiendas,
  getAdminUsuarios,
  ocultarLibroAdmin,
} from '../../services/api'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  bloquear: vi.fn(),
  libros: vi.fn(),
  ordenes: vi.fn(),
  ocultar: vi.fn(),
  tiendas: vi.fn(),
  usuarios: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    value,
    placeholder,
    accessibilityLabel,
    disabled,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
      }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        disabled,
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  const renderPart = (part) => ReactModule.isValidElement(part)
    ? part
    : typeof part === 'function' ? ReactModule.createElement(part) : part
  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Cargando'),
    Alert: { alert: mocks.alert },
    FlatList: ({ data = [], renderItem, ListHeaderComponent, ListFooterComponent, ListEmptyComponent }) => (
      ReactModule.createElement('div', null,
        renderPart(ListHeaderComponent),
        data.length
          ? data.map((item, index) => ReactModule.createElement(
            ReactModule.Fragment,
            { key: index },
            renderItem({ item, index }),
          ))
          : renderPart(ListEmptyComponent),
        renderPart(ListFooterComponent),
      )
    ),
    Image: element('img'),
    Modal: () => null,
    Platform: { OS: 'web' },
    RefreshControl: () => null,
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }) => <div>{children}</div> }))
vi.mock('../../services/api', () => ({
  bloquearUsuario: mocks.bloquear,
  cambiarEstadoTienda: vi.fn(),
  eliminarLibroAdmin: vi.fn(),
  getAdminLibros: mocks.libros,
  getAdminOrdenes: mocks.ordenes,
  getAdminTiendas: mocks.tiendas,
  getAdminUsuarios: mocks.usuarios,
  ocultarLibroAdmin: mocks.ocultar,
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconBook: Icon,
    IconCheck: Icon,
    IconChevronLeft: Icon,
    IconEye: Icon,
    IconEyeOff: Icon,
    IconLock: Icon,
    IconPackage: Icon,
    IconStore: Icon,
    IconTrash: Icon,
    IconUnlock: Icon,
    IconUser: Icon,
  }
})

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.bloquear.mockResolvedValue({ data: {} })
  mocks.ocultar.mockResolvedValue({ data: {} })
  mocks.usuarios.mockResolvedValue({
    data: [
      { id_usuario: 1, nombre_usuario: 'Ana Compradora', correo_usuario: 'ana@example.test', rol: 'comprador', estado_usuario: 'Activo' },
      { id_usuario: 2, nombre_usuario: 'Luis Vendedor', correo_usuario: 'luis@example.test', rol: 'vendedor', estado_usuario: 'Activo' },
    ],
  })
  mocks.libros.mockResolvedValue({
    data: [{ id_libro: 5, titulo: 'Libro de prueba', nombre_categoria: 'Fantasía' }],
  })
  mocks.ordenes.mockResolvedValue({ data: [] })
  mocks.tiendas.mockResolvedValue({ data: [] })
})

describe('AdminSection', () => {
  it('filtra usuarios y confirma bloqueo actualizando la ficha', async () => {
    const navigation = { goBack: vi.fn() }
    render(<AdminSection route={{ params: { section: 'usuarios' } }} navigation={navigation} />)

    expect(await screen.findByText('Ana Compradora')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Vendedor' }))
    expect(screen.getByText('Luis Vendedor')).toBeTruthy()
    expect(screen.queryByText('Ana Compradora')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o correo…'), {
      target: { value: 'luis' },
    })
    expect(screen.getByText('Luis Vendedor')).toBeTruthy()

    fireEvent.click(screen.getByText('Bloquear'))
    expect(Alert.alert).toHaveBeenCalledWith(
      '¿Bloquear usuario?',
      expect.stringContaining('Luis Vendedor'),
      expect.any(Array),
    )
    const actions = Alert.alert.mock.calls[0][2]
    await act(async () => actions[1].onPress())
    await waitFor(() => expect(bloquearUsuario).toHaveBeenCalledWith(2, true))
    expect(screen.getByText('Bloqueado')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Volver'))
    expect(navigation.goBack).toHaveBeenCalledOnce()
  })

  it('oculta un libro y presenta el estado vacío al filtrar', async () => {
    render(<AdminSection route={{ params: { section: 'libros' } }} navigation={{ goBack: vi.fn() }} />)
    expect(await screen.findByText('Libro de prueba')).toBeTruthy()
    fireEvent.click(screen.getByText('Ocultar'))
    await waitFor(() => expect(ocultarLibroAdmin).toHaveBeenCalledWith(5, true))
    expect(screen.getByText('Oculto')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Buscar por título o categoría…'), {
      target: { value: 'inexistente' },
    })
    expect(screen.getByText('Sin resultados para los filtros aplicados.')).toBeTruthy()
    expect(getAdminUsuarios).not.toHaveBeenCalled()
    expect(getAdminLibros).toHaveBeenCalledOnce()
  })

  it('filtra tiendas por estado y órdenes por identificador o estado', async () => {
    mocks.tiendas.mockResolvedValueOnce({
      data: [
        { id_tienda: 8, nombre_tienda: 'Librería Central', estado_tienda: 'activa', telefono: '5550100' },
        { id_tienda: 9, nombre_tienda: 'Libros del Sur', estado_tienda: 'suspendida' },
      ],
    })
    const navigation = { goBack: vi.fn() }
    const { rerender } = render(
      <AdminSection route={{ params: { section: 'tiendas' } }} navigation={navigation} />,
    )

    expect(await screen.findByText('Librería Central')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o estado…'), {
      target: { value: 'suspendida' },
    })
    expect(screen.getByText('Libros del Sur')).toBeTruthy()
    expect(screen.queryByText('Librería Central')).toBeNull()

    mocks.ordenes.mockResolvedValueOnce({
      data: [
        { id_orden: 120, estado: 'pagado', total: 24000, fecha: '2026-01-01' },
        { id_orden: 121, estado: 'pendiente', total: 0 },
      ],
    })
    rerender(<AdminSection route={{ params: { section: 'ordenes' } }} navigation={navigation} />)

    expect(await screen.findByText('Orden #120')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar por ID o estado…'), {
      target: { value: 'pendiente' },
    })
    expect(screen.getByText('Orden #121')).toBeTruthy()
    expect(screen.queryByText('Orden #120')).toBeNull()
    expect(getAdminTiendas).toHaveBeenCalledOnce()
    expect(getAdminOrdenes).toHaveBeenCalledOnce()
  })
})
