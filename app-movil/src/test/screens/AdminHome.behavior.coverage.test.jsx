// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminHome from '../../screens/AdminHome'
import {
  bloquearUsuario,
  cambiarEstadoTienda,
  eliminarLibroAdmin,
  getAdminLibros,
  getAdminOrdenes,
  getAdminSolicitudes,
  getAdminTiendas,
  getAdminUsuarios,
  ocultarLibroAdmin,
} from '../../services/api'

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    value,
    placeholder,
    source,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    accessibilityHint,
    disabled,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        'aria-pressed': accessibilityState?.selected,
        'aria-description': accessibilityHint,
        role: accessibilityRole || 'button',
      }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        disabled,
        'aria-label': accessibilityLabel,
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', {
        src: source?.uri || source,
        alt: accessibilityLabel || '',
      })
    }
    return ReactModule.createElement(tag, {
      'data-testid': props.testID,
      'aria-label': accessibilityLabel,
    }, children)
  }
  const renderListPart = (part) => typeof part === 'function'
    ? ReactModule.createElement(part)
    : part
  return {
    ActivityIndicator: element('span'),
    FlatList: ({ data = [], renderItem, ListHeaderComponent, ListFooterComponent, ListEmptyComponent }) => (
      ReactModule.createElement('div', null,
        renderListPart(ListHeaderComponent),
        data.length
          ? data.map((item, index) => ReactModule.createElement(
            ReactModule.Fragment,
            { key: index },
            renderItem({ item, index }),
          ))
          : renderListPart(ListEmptyComponent),
        renderListPart(ListFooterComponent),
      )
    ),
    Image: element('img'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' }, children)
      : null,
    Platform: { OS: 'web' },
    RefreshControl: () => null,
    ScrollView: element('div'),
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => (Array.isArray(style) ? style : [style]).filter(Boolean).reduce((all, item) => ({ ...all, ...item }), {}),
    },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
    useWindowDimensions: () => ({ width: 375, height: 812 }),
  }
})

vi.mock('react-native-svg', () => ({
  default: () => null,
  Circle: () => null,
  Path: () => null,
}))
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}))
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    AuthContext: ReactModule.createContext({
      user: { nombre: 'Admin de prueba' },
      signOut: vi.fn(),
    }),
  }
})
vi.mock('../../components/SidebarAdmin', () => ({
  default: ({ visible, onSelectSection, onSelectDashboard }) => visible ? (
    <nav>
      <button onClick={onSelectDashboard}>Admin: Dashboard</button>
      {['usuarios', 'libros', 'tiendas', 'ordenes', 'reclamos', 'soporte', 'perfil', 'reportes', 'finanzas'].map((section) => (
        <button key={section} onClick={() => onSelectSection(section)}>Admin: {section}</button>
      ))}
    </nav>
  ) : null,
}))
vi.mock('../../screens/FinanzasAdmin', () => ({ default: () => <div>Finanzas de administración</div> }))
vi.mock('../../screens/AdminRequests', () => ({ default: ({ type }) => <div>Solicitudes: {type}</div> }))
vi.mock('../../screens/AdminProfile', () => ({ default: () => <div>Perfil de administración</div> }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  const Menu = () => <span>Abrir menú</span>
  return {
    IconAlertTriangle: Icon,
    IconBook: Icon,
    IconCart: Icon,
    IconCheck: Icon,
    IconClose: Icon,
    IconEye: Icon,
    IconEyeOff: Icon,
    IconFilter: Icon,
    IconLock: Icon,
    IconMail: Icon,
    IconMenu: Menu,
    IconPackage: Icon,
    IconPhone: Icon,
    IconSearch: Icon,
    IconSettings: Icon,
    IconShield: Icon,
    IconStore: Icon,
    IconTool: Icon,
    IconTrash: Icon,
    IconUnlock: Icon,
    IconUser: Icon,
    IconUsers: Icon,
  }
})
vi.mock('../../services/api', () => ({
  bloquearUsuario: vi.fn(),
  cambiarEstadoTienda: vi.fn(),
  eliminarLibroAdmin: vi.fn(),
  getAdminLibros: vi.fn(),
  getAdminOrdenes: vi.fn(),
  getAdminSolicitudes: vi.fn(),
  getAdminTiendas: vi.fn(),
  getAdminUsuarios: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  ocultarLibroAdmin: vi.fn(),
}))

const fixtures = {
  usuarios: [
    { id_usuario: 1, nombre_usuario: 'Ana Compradora', correo_usuario: 'ana@example.test', rol: 'comprador', estado_usuario: 'Activo', telefono: '3001234567', email_verificado: true },
    { id_usuario: 2, nombre_usuario: 'Luis Vendedor', correo_usuario: 'luis@example.test', rol: 'vendedor', estado_usuario: 'Bloqueado' },
  ],
  libros: [
    { id_libro: 5, titulo: 'Libro visible', autor_libro: 'Autora', nombre_tienda: 'Librería Uno', nombre_categoria: 'Fantasía', precio_libro: 24000, oculto: false },
  ],
  tiendas: [
    { id_tienda: 8, nombre_tienda: 'Librería Uno', direccion: 'Calle 1', telefono: '5550100', estado_tienda: 'activa', id_usuario: 2 },
  ],
  ordenes: [
    {
      id_orden: 20,
      id_usuario_propietario: 1,
      estado: 'pagado',
      fecha: '2026-01-01',
      total: 24000,
      tipo_entrega: 'domicilio',
      metodo_pago: 'Tarjeta',
      items: [
        { titulo: 'Libro visible', cantidad: 1 },
        { titulo: 'Libro adicional', cantidad: 2 },
        { titulo: 'Tercer libro', cantidad: 1 },
      ],
    },
    { id_orden: 21, estado: 'pendiente', total: 0, items: [] },
  ],
  solicitudes: [
    { tipo_solicitud: 'Reclamo', estado: 'Abierto' },
    { tipo_solicitud: 'Soporte', estado: 'En revisión' },
  ],
}

describe('AdminHome: flujos de administración', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAdminUsuarios.mockResolvedValue({ data: fixtures.usuarios })
    getAdminLibros.mockResolvedValue({ data: fixtures.libros })
    getAdminOrdenes.mockResolvedValue({ data: fixtures.ordenes })
    getAdminTiendas.mockResolvedValue({ data: fixtures.tiendas })
    getAdminSolicitudes.mockResolvedValue({ data: fixtures.solicitudes })
    cambiarEstadoTienda.mockResolvedValue({})
    bloquearUsuario.mockResolvedValue({})
    ocultarLibroAdmin.mockResolvedValue({})
    eliminarLibroAdmin.mockResolvedValue({ data: {} })
  })

  afterEach(cleanup)

  it('carga métricas, filtra usuarios y actualiza el estado desde la ficha', async () => {
    render(<AdminHome />)
    expect(await screen.findByText('Usuarios Totales')).toBeTruthy()
    expect(getAdminUsuarios).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByText('Usuarios Totales'))
    expect(await screen.findByText('Ana Compradora')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o correo…'), {
      target: { value: 'ana' },
    })
    expect(screen.getByText('Ana Compradora')).toBeTruthy()
    expect(screen.queryByText('Luis Vendedor')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ficha' }))
    const profileDialog = screen.getByRole('dialog')
    expect(within(profileDialog).getByText('ana@example.test')).toBeTruthy()
    fireEvent.click(within(profileDialog).getByRole('button', { name: '🔒 Bloquear' }))

    const confirmation = screen.getByRole('dialog')
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Bloquear' }))
    await waitFor(() => expect(bloquearUsuario).toHaveBeenCalledWith(1, true))
    expect(await screen.findByText('Bloqueado')).toBeTruthy()
  })

  it('expande un libro, lo oculta del catálogo y confirma su eliminación segura', async () => {
    eliminarLibroAdmin.mockResolvedValueOnce({ data: { modo: 'ocultado' } })
    render(<AdminHome />)
    await screen.findByText('Libros Publicados')
    fireEvent.click(screen.getByText('Libros Publicados'))
    expect(await screen.findByText('Libro visible')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalles' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar' }))

    await waitFor(() => expect(ocultarLibroAdmin).toHaveBeenCalledWith(5, true))
    expect(await screen.findByText('Oculto')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    const confirmation = screen.getByRole('dialog')
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Libro ocultado')).toBeTruthy()
    expect(eliminarLibroAdmin).toHaveBeenCalledWith(5)
  })

  it('presenta el error de carga y permite reintentar', async () => {
    getAdminUsuarios
      .mockRejectedValueOnce({ response: { data: { detail: 'Servicio temporalmente no disponible' } } })
      .mockResolvedValueOnce({ data: fixtures.usuarios })
    render(<AdminHome />)

    expect(await screen.findByText('Servicio temporalmente no disponible')).toBeTruthy()
    fireEvent.click(screen.getByText('Reintentar'))
    expect(await screen.findByText('Usuarios Totales')).toBeTruthy()
    expect(getAdminUsuarios).toHaveBeenCalledTimes(2)
  })

  it('valida el motivo y suspende una tienda con el detalle ingresado', async () => {
    render(<AdminHome />)
    fireEvent.click(await screen.findByText('Librerías & Tiendas'))
    expect(await screen.findByText('Librería Uno')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalles' }))
    fireEvent.click(screen.getByText('Cambiar Estado'))

    fireEvent.click(within(screen.getByRole('dialog')).getByText('Suspendida'))
    const suspensionDialog = screen.getByRole('dialog')
    fireEvent.click(within(suspensionDialog).getByRole('button', { name: /Suspender y Notificar/ }))
    expect(within(suspensionDialog).getByText(/Debes ingresar o seleccionar un motivo/)).toBeTruthy()

    fireEvent.change(within(suspensionDialog).getByPlaceholderText(/Escribe detalladamente/), {
      target: { value: 'Incumplimiento confirmado de las políticas.' },
    })
    fireEvent.click(within(suspensionDialog).getByRole('button', { name: /Suspender y Notificar/ }))

    await waitFor(() => {
      expect(cambiarEstadoTienda).toHaveBeenCalledWith(
        8,
        'suspendida',
        'Incumplimiento confirmado de las políticas.',
      )
    })
    expect(await screen.findAllByText('Suspendida')).not.toHaveLength(0)
    expect(screen.getByText('Estado actualizado')).toBeTruthy()
  })

  it('muestra artículos, comprador, pago y entrega al expandir órdenes', async () => {
    render(<AdminHome />)
    fireEvent.click(await screen.findByText('Órdenes Procesadas'))

    const orderButtons = await screen.findAllByRole('button', { name: 'Ver detalles de la orden' })
    fireEvent.click(orderButtons[0])
    expect(screen.getAllByText('Ana Compradora')).not.toHaveLength(0)
    expect(screen.getByText('Libro adicional')).toBeTruthy()
    expect(screen.getByText('y 1 más')).toBeTruthy()
    expect(screen.getByText('Tarjeta')).toBeTruthy()
    expect(screen.getByText('Domicilio')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalles de la orden' }))
    expect(screen.getByText('No hay artículos disponibles')).toBeTruthy()
  })

  it('carga solicitudes al abrir la sección de soporte desde el menú', async () => {
    render(<AdminHome />)
    fireEvent.click(await screen.findByText('Usuarios Totales'))
    fireEvent.click(screen.getByText('Abrir menú'))
    fireEvent.click(screen.getByRole('button', { name: 'Admin: soporte' }))

    expect(await screen.findByText('Solicitudes: soporte')).toBeTruthy()
    expect(getAdminSolicitudes).toHaveBeenCalledOnce()
  })
})
