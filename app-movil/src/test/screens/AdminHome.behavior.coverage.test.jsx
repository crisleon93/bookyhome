// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminHome from '../../screens/AdminHome'
import { AuthContext } from '../../context/AuthContext'
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

const platformState = vi.hoisted(() => ({ os: 'web' }))

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
        onError: props.onError,
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
    FlatList: ({ data = [], renderItem, refreshControl, ListHeaderComponent, ListFooterComponent, ListEmptyComponent }) => (
      ReactModule.createElement('div', null,
        renderListPart(refreshControl),
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
    Modal: ({ visible, children, onRequestClose }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' },
        onRequestClose && ReactModule.createElement(
          'button',
          { type: 'button', onClick: onRequestClose },
          'Cerrar diálogo',
        ),
        children,
      )
      : null,
    Platform: { get OS() { return platformState.os } },
    RefreshControl: ({ onRefresh }) => ReactModule.createElement(
      'button',
      { type: 'button', onClick: onRefresh },
      'Actualizar datos',
    ),
    ScrollView: ({ children, refreshControl }) => ReactModule.createElement(
      'div',
      null,
      renderListPart(refreshControl),
      children,
    ),
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
  default: ({ visible, onClose, onSignOut, onSelectSection, onSelectDashboard, user }) => visible ? (
    <nav>
      <output data-testid="admin-sidebar-profile">
        {[user?.nombre, user?.foto_perfil, user?.banner_perfil, user?.banner_color].join('|')}
      </output>
      <button onClick={onClose}>Cerrar menú</button>
      <button onClick={onSignOut}>Cerrar sesión</button>
      <button onClick={onSelectDashboard}>Admin: Dashboard</button>
      {['usuarios', 'libros', 'tiendas', 'ordenes', 'reclamos', 'soporte', 'perfil', 'reportes', 'finanzas'].map((section) => (
        <button key={section} onClick={() => onSelectSection(section)}>Admin: {section}</button>
      ))}
    </nav>
  ) : null,
}))
vi.mock('../../screens/FinanzasAdmin', () => ({ default: () => <div>Finanzas de administración</div> }))
vi.mock('../../screens/AdminRequests', () => ({
  default: ({ type, onRefresh }) => (
    <div>
      <div>Solicitudes: {type}</div>
      <button onClick={onRefresh}>Actualizar solicitudes</button>
    </div>
  ),
}))
vi.mock('../../screens/AdminProfile', () => ({
  default: ({ onProfilePhotoChange, onProfileNameChange, onProfileBannerChange }) => (
    <div>
      <div>Perfil de administración</div>
      <button onClick={() => onProfilePhotoChange('foto-nueva')}>Cambiar foto de perfil</button>
      <button onClick={() => onProfileNameChange('Nombre nuevo')}>Cambiar nombre de perfil</button>
      <button onClick={() => onProfileBannerChange('banner-nuevo', 'color-nuevo')}>Cambiar banner de perfil</button>
    </div>
  ),
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  const Menu = () => <span>Abrir menú</span>
  return {
    IconAlertTriangle: Icon,
    IconBan: Icon,
    IconBook: Icon,
    IconCart: Icon,
    IconCheck: Icon,
    IconClose: Icon,
    IconDollar: Icon,
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
    IconTruck: Icon,
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

  afterEach(() => {
    cleanup()
    platformState.os = 'web'
  })

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
    expect(await screen.findAllByText('Oculto')).not.toHaveLength(0)

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

    fireEvent.click(screen.getByText('Cambiar Estado'))
    const stateSelection = screen.getByText('Selecciona un estado').closest('[role="dialog"]')
    fireEvent.click(within(stateSelection).getByText('✕'))
    expect(screen.queryByText('Selecciona un estado')).toBeNull()
  })

  it('muestra artículos, comprador, pago y entrega al expandir órdenes', async () => {
    render(<AdminHome />)
    fireEvent.click(await screen.findByText('Órdenes Procesadas'))

    const orderButtons = await screen.findAllByRole('button', { name: 'Ver detalles de la orden' })
    fireEvent.click(orderButtons[0])
    expect(screen.getAllByText('Ana Compradora')).not.toHaveLength(0)
    expect(screen.getByText('Libro adicional')).toBeTruthy()
    expect(screen.getByText('Tercer libro')).toBeTruthy()
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

  it('refresca los datos del dashboard, de una sección y de las solicitudes', async () => {
    render(<AdminHome />)
    await screen.findByText('Usuarios Totales')

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar datos' }))
    await waitFor(() => expect(getAdminUsuarios).toHaveBeenCalledTimes(2))

    fireEvent.click(screen.getByText('Abrir menú'))
    fireEvent.click(screen.getByRole('button', { name: 'Admin: soporte' }))
    await screen.findByText('Solicitudes: soporte')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar solicitudes' }))
    await waitFor(() => expect(getAdminSolicitudes).toHaveBeenCalledTimes(2))

    fireEvent.click(screen.getByRole('button', { name: 'Admin: usuarios' }))
    await screen.findByText('Ana Compradora')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar datos' }))
    await waitFor(() => expect(getAdminUsuarios).toHaveBeenCalledTimes(3))
  })

  it('filtra libros por categoría, muestra búsquedas vacías y navega páginas', async () => {
    const books = Array.from({ length: 11 }, (_, index) => ({
      id_libro: index + 1,
      titulo: `Libro ${index + 1}`,
      autor_libro: 'Autora',
      nombre_tienda: 'Librería Uno',
      nombre_categoria: index === 10 ? 'Ciencia' : 'Fantasía',
      precio_libro: 10000,
      oculto: false,
    }))
    getAdminLibros.mockResolvedValueOnce({ data: books })
    render(<AdminHome />)

    fireEvent.click(await screen.findByText('Libros Publicados'))
    expect(screen.getByText('1 / 2')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Elegir categoría/ }))

    let categoryDialog = screen.getByRole('dialog')
    const categorySearch = within(categoryDialog).getByPlaceholderText('Buscar categoría...')
    fireEvent.change(categorySearch, { target: { value: 'inexistente' } })
    expect(within(categoryDialog).getByText('No se encontraron categorías.')).toBeTruthy()

    fireEvent.click(within(categoryDialog).getByLabelText('Limpiar búsqueda de categoría'))
    fireEvent.change(categorySearch, { target: { value: 'Ciencia' } })
    fireEvent.click(within(categoryDialog).getByRole('button', { name: /Ciencia/ }))
    expect(screen.getByRole('button', { name: /Elegir categoría.*Ciencia/ })).toBeTruthy()

    fireEvent.click(screen.getByText('Limpiar filtros'))
    fireEvent.click(screen.getByRole('button', { name: /Elegir categoría/ }))
    categoryDialog = screen.getByRole('dialog')
    fireEvent.click(within(categoryDialog).getByLabelText('Cerrar categorías'))
    expect(screen.queryByText('Filtrar por categoría')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Elegir categoría/ }))
    categoryDialog = screen.getByRole('dialog')
    fireEvent.click(within(categoryDialog).getByText('Listo'))
    expect(screen.queryByText('Filtrar por categoría')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Elegir categoría/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Cerrar diálogo'))
    expect(screen.queryByText('Filtrar por categoría')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(screen.getByText('2 / 2')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Anterior/ }))
    expect(screen.getByText('1 / 2')).toBeTruthy()
  })

  it('aplica filtros de rol y estado a usuarios y órdenes', async () => {
    render(<AdminHome />)
    fireEvent.click(await screen.findByText('Usuarios Totales'))

    fireEvent.click(screen.getByRole('button', { name: 'Admin' }))
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Solo activos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Solo activos' }))

    fireEvent.click(screen.getByText('Abrir menú'))
    fireEvent.click(screen.getByRole('button', { name: 'Admin: ordenes' }))
    const orderFilters = screen.getByText('Filtrar por estado').parentElement
    fireEvent.click(within(orderFilters).getByRole('button', { name: 'Pagado' }))
    expect(screen.getByText('Ana Compradora')).toBeTruthy()
    fireEvent.click(within(orderFilters).getByRole('button', { name: 'Todas' }))
  })

  it('propaga cambios del perfil de administrador al usuario del menú', async () => {
    const user = {
      nombre: 'Nombre original',
      foto_perfil: 'foto-original',
      banner_perfil: 'banner-original',
      banner_color: 'color-original',
    }
    const signOut = vi.fn()
    render(
      <AuthContext.Provider value={{ user, signOut }}>
        <AdminHome />
      </AuthContext.Provider>,
    )

    fireEvent.click(await screen.findByText('Usuarios Totales'))
    fireEvent.click(screen.getByText('Abrir menú'))
    fireEvent.click(screen.getByRole('button', { name: 'Admin: perfil' }))
    expect(screen.getByText('Perfil de administración')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar foto de perfil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar nombre de perfil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar banner de perfil' }))

    expect(screen.getByTestId('admin-sidebar-profile').textContent).toBe(
      'Nombre nuevo|foto-nueva|banner-nuevo|color-nuevo',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Admin: Dashboard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    expect(screen.queryByRole('navigation')).toBeNull()
    fireEvent.click(screen.getByText('Abrir menú'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('resuelve fotos de usuario remotas y de perfil, y usa iniciales ante rutas inválidas o errores', async () => {
    getAdminUsuarios.mockResolvedValueOnce({
      data: [
        { ...fixtures.usuarios[0], foto_perfil: ' https://cdn.example.test/ana.jpg ' },
        { ...fixtures.usuarios[1], foto_perfil: '/uploads/perfiles/luis.jpg' },
        { id_usuario: 3, nombre_usuario: 'María López', rol: 'comprador', foto_perfil: '/otra-ruta/maria.jpg' },
        { id_usuario: 4, nombre_usuario: 'Nora Díaz', rol: 'comprador', foto_perfil: { url: 'foto' } },
        { id_usuario: 5, nombre_usuario: 'Omar', rol: 'rol desconocido' },
        { id_usuario: 6, rol: 'comprador', foto_perfil: 'https://cdn.example.test/sin-nombre.jpg' },
      ],
    })
    render(<AdminHome />)
    fireEvent.click(await screen.findByText('Usuarios Totales'))

    const remotePhoto = screen.getByAltText('Foto de perfil de Ana Compradora')
    expect(remotePhoto.getAttribute('src')).toBe('https://cdn.example.test/ana.jpg')
    expect(screen.getByAltText('Foto de perfil de Luis Vendedor').getAttribute('src'))
      .toBe('https://api.example.test/uploads/perfiles/luis.jpg')
    expect(screen.getByText('ML')).toBeTruthy()
    expect(screen.getByText('ND')).toBeTruthy()

    fireEvent.error(remotePhoto)
    expect(screen.getByText('AC')).toBeTruthy()
    expect(screen.queryByAltText('Foto de perfil de Ana Compradora')).toBeNull()
    fireEvent.error(screen.getByAltText('Foto de perfil de usuario'))
    expect(screen.getByText('?')).toBeTruthy()
  })

  it('renderiza las iniciales en un componente de texto fuera de web', async () => {
    platformState.os = 'ios'
    getAdminUsuarios.mockResolvedValueOnce({
      data: [{ id_usuario: 7, nombre_usuario: 'Ana Test', rol: 'comprador' }],
    })
    render(<AdminHome />)

    fireEvent.click(await screen.findByText('Usuarios Totales'))
    expect(screen.getByText('AT')).toBeTruthy()
  })

  it('mantiene valores de respaldo para roles, estados y solicitudes sin clasificación', async () => {
    getAdminUsuarios.mockResolvedValueOnce({
      data: [{ id_usuario: 15, nombre_usuario: 'Usuario sin rol' }],
    })
    getAdminTiendas.mockResolvedValueOnce({
      data: [{ id_tienda: 16, nombre_tienda: 'Librería sin estado' }],
    })
    getAdminSolicitudes.mockResolvedValueOnce({
      data: [
        { tipo_solicitud: 'Reclamo', estado: 'Cerrado' },
        { tipo_solicitud: 'Soporte', estado: 'Resuelto' },
        { tipo_solicitud: 'Soporte' },
      ],
    })
    render(<AdminHome />)

    expect(await screen.findByText('Usuario sin rol')).toBeTruthy()
    expect(screen.getByText('Librería sin estado')).toBeTruthy()
    fireEvent.click(screen.getByText('Abrir menú'))
    fireEvent.click(screen.getByRole('button', { name: 'Admin: soporte' }))
    expect(await screen.findByText('Solicitudes: soporte')).toBeTruthy()
  })

  it('resuelve portadas remotas y relativas, y muestra el recurso alternativo cuando falla la imagen', async () => {
    getAdminLibros.mockResolvedValueOnce({
      data: [
        { ...fixtures.libros[0], imagen: 'https://cdn.example.test/libro.jpg' },
        { id_libro: 6, titulo: 'Libro relativo', imagen: '/uploads/libros/relativo.jpg' },
        { id_libro: 7, imagen: 'https://cdn.example.test/sin-titulo.jpg' },
      ],
    })
    render(<AdminHome />)
    fireEvent.click(await screen.findByText('Libros Publicados'))

    const remoteCover = screen.getByAltText('Portada de Libro visible')
    expect(remoteCover.getAttribute('src')).toBe('https://cdn.example.test/libro.jpg')
    expect(screen.getByAltText('Portada de Libro relativo').getAttribute('src'))
      .toBe('https://api.example.test/uploads/libros/relativo.jpg')
    expect(screen.getByAltText('Portada de libro').getAttribute('src'))
      .toBe('https://cdn.example.test/sin-titulo.jpg')

    fireEvent.error(remoteCover)
    expect(screen.queryByAltText('Portada de Libro visible')).toBeNull()
  })

  it('resuelve logos de tienda y calcula iniciales si no hay imagen o esta falla', async () => {
    getAdminTiendas.mockResolvedValueOnce({
      data: [
        { id_tienda: 7, nombre_tienda: 'Sol', estado_tienda: 'activa' },
        { id_tienda: 8, estado_tienda: 'activa' },
        { ...fixtures.tiendas[0], logo_url: 'https://cdn.example.test/tienda.jpg' },
        { id_tienda: 9, nombre_tienda: 'Librería Dos Palabras', estado_tienda: 'pendiente', foto_tienda: '/uploads/tiendas/dos.jpg' },
        { id_tienda: 11, nombre_tienda: 'Librería Suspendida', estado_tienda: 'suspendida' },
        { id_tienda: 12, nombre_tienda: 'Librería en Vacaciones', estado_tienda: 'vacaciones' },
        { id_tienda: 13, nombre_tienda: 'Librería Inactiva', estado_tienda: 'inactiva' },
        { id_tienda: 14, nombre_tienda: 'Librería con estado nuevo', estado_tienda: 'otro estado' },
      ],
    })
    render(<AdminHome />)
    fireEvent.click(await screen.findByText('Librerías & Tiendas'))

    const remoteLogo = screen.getByAltText('Logo de Librería Uno')
    expect(remoteLogo.getAttribute('src')).toBe('https://cdn.example.test/tienda.jpg')
    expect(screen.getByAltText('Logo de Librería Dos Palabras').getAttribute('src'))
      .toBe('https://api.example.test/uploads/tiendas/dos.jpg')
    expect(screen.getByText('SO')).toBeTruthy()
    expect(screen.getAllByText('LI')).toHaveLength(2)
    expect(screen.getByText('LC')).toBeTruthy()

    fireEvent.error(remoteLogo)
    expect(screen.getByText('LU')).toBeTruthy()
    expect(screen.queryByAltText('Logo de Librería Uno')).toBeNull()
  })
})
