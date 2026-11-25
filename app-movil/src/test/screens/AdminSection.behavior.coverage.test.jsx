// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminSection from '../../screens/AdminSection'
import { Alert } from 'react-native'
import {
  bloquearUsuario,
  cambiarEstadoTienda,
  eliminarLibroAdmin,
  getAdminLibros,
  getAdminOrdenes,
  getAdminTiendas,
  getAdminUsuarios,
  ocultarLibroAdmin,
} from '../../services/api'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  bloquear: vi.fn(),
  cambiarEstadoTienda: vi.fn(),
  eliminarLibro: vi.fn(),
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
    FlatList: ({ data = [], renderItem, keyExtractor, ListHeaderComponent, ListFooterComponent, ListEmptyComponent, refreshControl }) => (
      ReactModule.createElement('div', null,
        renderPart(ListHeaderComponent),
        data.length
          ? data.map((item, index) => ReactModule.createElement(
            'div',
            { key: index, 'data-item-key': keyExtractor?.(item, index) },
            renderItem({ item, index }),
          ))
          : renderPart(ListEmptyComponent),
        renderPart(ListFooterComponent),
          refreshControl,
      )
    ),
    Image: element('img'),
    Modal: ({ visible, children, onRequestClose }) => visible
      ? ReactModule.createElement(ReactModule.Fragment, null,
          ReactModule.createElement('div', { 'data-testid': 'modal' }, children),
          ReactModule.createElement('button', { type: 'button', onClick: onRequestClose }, 'Cerrar estado'))
      : null,
    Platform: { OS: 'web' },
    RefreshControl: ({ onRefresh }) => ReactModule.createElement('button', {
      type: 'button',
      onClick: onRefresh,
    }, 'Actualizar lista'),
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }) => <div>{children}</div> }))
vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: (styles) => styles,
  useAppTheme: () => ({ darkMode: false, colors: {} }),
}))
vi.mock('../../services/api', () => ({
  bloquearUsuario: mocks.bloquear,
  cambiarEstadoTienda: mocks.cambiarEstadoTienda,
  eliminarLibroAdmin: mocks.eliminarLibro,
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
  mocks.cambiarEstadoTienda.mockResolvedValue({ data: {} })
  mocks.eliminarLibro.mockResolvedValue({ data: {} })
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

    fireEvent.click(screen.getAllByText('Bloquear')[0])
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
    const { rerender, container } = render(
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
        { id_orden: 120, id_orden_db: 900, estado: 'pagado', total: 24000, fecha: '2026-01-01' },
        { id_orden: 121, id_usuario_propietario: 8, estado: 'pendiente', total: 0 },
      ],
    })
    rerender(<AdminSection route={{ params: { section: 'ordenes' } }} navigation={navigation} />)

    expect(await screen.findByText('Orden #120')).toBeTruthy()
    expect(container.querySelector('[data-item-key="orden-db-900"]')).toBeTruthy()
    expect(container.querySelector('[data-item-key="orden-8-121"]')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar por ID o estado…'), {
      target: { value: 'pendiente' },
    })
    expect(screen.getByText('Orden #121')).toBeTruthy()
    expect(screen.queryByText('Orden #120')).toBeNull()
    expect(getAdminTiendas).toHaveBeenCalledOnce()
    expect(getAdminOrdenes).toHaveBeenCalledOnce()
  })

  it('cambia estado de tienda desde el modal, evita una actualización redundante y reporta errores', async () => {
    mocks.tiendas.mockResolvedValue({
      data: [{ id_tienda: 8, nombre_tienda: 'Librería Central', estado_tienda: 'activa' }],
    })
    render(<AdminSection route={{ params: { section: 'tiendas' } }} navigation={{ goBack: vi.fn() }} />)
    await screen.findByText('Librería Central')

    fireEvent.click(screen.getByText('Cambiar Estado'))
    expect(screen.getByTestId('modal')).toBeTruthy()
    fireEvent.click(screen.getAllByText('Activa')[1])
    expect(cambiarEstadoTienda).not.toHaveBeenCalled()
    expect(screen.queryByTestId('modal')).toBeNull()

    fireEvent.click(screen.getByText('Cambiar Estado'))
    mocks.cambiarEstadoTienda.mockRejectedValueOnce({ response: { data: { detail: 'estado no disponible' } } })
    fireEvent.click(screen.getByText('En Vacaciones'))
    await waitFor(() => expect(cambiarEstadoTienda).toHaveBeenCalledWith(8, 'vacaciones'))
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'estado no disponible')

    mocks.cambiarEstadoTienda.mockResolvedValueOnce({ data: {} })
    fireEvent.click(screen.getByText('Suspendida'))
    await waitFor(() => expect(cambiarEstadoTienda).toHaveBeenLastCalledWith(8, 'suspendida'))
    expect(screen.getByText('Suspendida')).toBeTruthy()
    fireEvent.click(screen.getByText('Cambiar Estado'))
    fireEvent.click(screen.getByText('Cerrar estado'))
    expect(screen.queryByTestId('modal')).toBeNull()
  })

  it('cubre eliminación de libro con ocultamiento por compras, borrado y error', async () => {
    mocks.eliminarLibro.mockResolvedValueOnce({ data: { modo: 'ocultado' } })
    render(<AdminSection route={{ params: { section: 'libros' } }} navigation={{ goBack: vi.fn() }} />)
    await screen.findByText('Libro de prueba')
    fireEvent.click(screen.getByText('Eliminar'))
    let actions = Alert.alert.mock.calls[0][2]
    await act(async () => actions[1].onPress())
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
      'Libro ocultado',
      'El libro tiene compras asociadas y fue ocultado en lugar de eliminado.',
    ))
    expect(screen.getByText('Oculto')).toBeTruthy()

    cleanup()
    mocks.libros.mockResolvedValueOnce({
      data: [{ id_libro: 5, titulo: 'Libro de prueba', nombre_categoria: 'Fantasía' }],
    })
    mocks.eliminarLibro.mockResolvedValueOnce({ data: { modo: 'eliminado' } })
    render(<AdminSection route={{ params: { section: 'libros' } }} navigation={{ goBack: vi.fn() }} />)
    await screen.findByText('Libro de prueba')
    fireEvent.click(screen.getByText('Eliminar'))
    actions = Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1][2]
    await act(async () => actions[1].onPress())
    await waitFor(() => expect(screen.getByText('No hay registros todavía.')).toBeTruthy())
  })

  it('muestra errores de carga y de cambios de visibilidad', async () => {
    mocks.libros.mockRejectedValueOnce({ response: { data: { detail: 'catálogo sin conexión' } } })
    render(<AdminSection route={{ params: { section: 'libros' } }} navigation={{ goBack: vi.fn() }} />)
    expect(await screen.findByText('catálogo sin conexión')).toBeTruthy()

    cleanup()
    mocks.libros.mockResolvedValueOnce({
      data: [{ id_libro: 5, titulo: 'Libro de prueba', nombre_categoria: 'Fantasía' }],
    })
    mocks.ocultar.mockRejectedValueOnce({ response: { data: { detail: 'no autorizado' } } })
    render(<AdminSection route={{ params: { section: 'libros' } }} navigation={{ goBack: vi.fn() }} />)
    await screen.findByText('Libro de prueba')
    fireEvent.click(screen.getByText('Ocultar'))
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'no autorizado'))
  })

  it('pagina usuarios, cancela un bloqueo y reintenta una carga desde el refresco', async () => {
    const users = Array.from({ length: 12 }, (_, index) => ({
      id_usuario: index + 1,
      nombre_usuario: `Usuario ${index + 1}`,
      correo_usuario: `user${index + 1}@example.test`,
      rol: 'comprador',
      estado_usuario: 'Activo',
    }))
    mocks.usuarios.mockResolvedValueOnce({ data: users })
    render(<AdminSection route={{ params: { section: 'usuarios' } }} navigation={{ goBack: vi.fn() }} />)
    expect(await screen.findByText('Usuario 12')).toBeTruthy()

    fireEvent.click(screen.getByText('Siguiente ›'))
    expect(await screen.findByText('Usuario 2')).toBeTruthy()
    fireEvent.click(screen.getByText('‹ Anterior'))
    expect(await screen.findByText('Usuario 12')).toBeTruthy()

    fireEvent.click(screen.getAllByText('Bloquear')[0])
    const cancelAction = Alert.alert.mock.calls[0][2][0]
    act(() => cancelAction.onPress())
    expect(bloquearUsuario).not.toHaveBeenCalled()

    mocks.usuarios.mockRejectedValueOnce(new Error('offline'))
    fireEvent.click(screen.getByText('Actualizar lista'))
    expect(await screen.findByText('No se pudo cargar esta sección.')).toBeTruthy()
  })

  it('muestra los errores de bloqueo, eliminación y consulta de libros por categoría', async () => {
    mocks.bloquear.mockRejectedValueOnce({ response: { data: { detail: 'bloqueo rechazado' } } })
    render(<AdminSection route={{ params: { section: 'usuarios' } }} navigation={{ goBack: vi.fn() }} />)
    await screen.findByText('Ana Compradora')
    fireEvent.click(screen.getAllByText('Bloquear')[0])
    const confirmBlock = Alert.alert.mock.calls[0][2][1]
    await act(async () => confirmBlock.onPress())
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'bloqueo rechazado'))

    cleanup()
    mocks.libros.mockResolvedValueOnce({
      data: [
        { id_libro: 5, titulo: 'Libro de prueba', nombre_categoria: 'Fantasía' },
        { id_libro: 6, titulo: 'Libro de misterio', nombre_categoria: 'Misterio' },
      ],
    })
    mocks.eliminarLibro.mockRejectedValueOnce({ response: { data: { detail: 'eliminación rechazada' } } })
    render(<AdminSection route={{ params: { section: 'libros' } }} navigation={{ goBack: vi.fn() }} />)
    await screen.findByText('Libro de misterio')
    fireEvent.click(screen.getAllByText('Misterio')[0])
    expect(screen.getByText('Libro de misterio')).toBeTruthy()
    expect(screen.queryByText('Libro de prueba')).toBeNull()
    fireEvent.click(screen.getByText('Eliminar'))
    const confirmDelete = Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1][2][1]
    await act(async () => confirmDelete.onPress())
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'eliminación rechazada'))
  })
})
