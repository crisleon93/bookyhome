// @vitest-environment jsdom

import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SidebarAdmin from '../../components/SidebarAdmin'
import SidebarMenu from '../../components/SidebarMenu'
import SidebarVendedor from '../../components/SidebarVendedor'
import { ThemeProvider, adaptStyleForTheme, useAppTheme, useThemedStyles } from '../../context/ThemeContext'
import { AuthContext } from '../../context/AuthContext'

const mocks = vi.hoisted(() => ({
  getConfigLibreria: vi.fn(),
  getProfile: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  resolveImageUrl: vi.fn((value) => value),
  navigate: vi.fn(),
  onClose: vi.fn(),
  onSelectDashboard: vi.fn(),
  onSelectSection: vi.fn(),
  onSignOut: vi.fn(),
  setItem: vi.fn(),
  getItem: vi.fn(),
  unreadMsgCount: 3,
  unreadNotifCount: 4,
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const NativeElement = (tag) => function NativeElementComponent({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    disabled,
    source,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        'aria-pressed': accessibilityState?.selected,
        role: accessibilityRole || 'button',
      }, children)
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', { src: source?.uri || source, alt: '' })
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  class AnimatedValue {
    constructor(value) {
      this._value = value
    }
  }
  const Animated = {
    Value: AnimatedValue,
    View: NativeElement('div'),
    parallel: (animations) => ({
      start: () => animations.forEach((animation) => animation.start()),
    }),
    timing: (value, { toValue }) => ({
      start: () => { value._value = toValue },
    }),
  }
  return {
    Animated,
    Appearance: { setColorScheme: vi.fn() },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Image: NativeElement('img'),
    PanResponder: { create: () => ({ panHandlers: {} }) },
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' }, children)
      : null,
    Platform: { OS: 'web', select: (values) => values.web || values.default },
    Pressable: NativeElement('button'),
    ScrollView: NativeElement('div'),
    StyleSheet: { absoluteFill: {}, create: (styles) => styles, flatten: (style) => style },
    Text: NativeElement('span'),
    TouchableOpacity: NativeElement('button'),
    View: NativeElement('div'),
  }
})

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: mocks.getItem, setItem: mocks.setItem },
}))
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div>{children}</div>,
}))
vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    unreadMsgCount: mocks.unreadMsgCount,
    unreadNotifCount: mocks.unreadNotifCount,
  }),
}))
vi.mock('../../services/api', () => ({
  getApiBaseUrl: mocks.getApiBaseUrl,
  getConfigLibreria: mocks.getConfigLibreria,
  getProfile: mocks.getProfile,
  resolveImageUrl: mocks.resolveImageUrl,
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconBell: Icon,
    IconBook: Icon,
    IconBookOpen: Icon,
    IconBolt: Icon,
    IconCart: Icon,
    IconCartAlt: Icon,
    IconChevronRight: Icon,
    IconClose: Icon,
    IconCreditCard: Icon,
    IconFavorites: Icon,
    IconLayoutDashboard: Icon,
    IconLayers: Icon,
    IconLogout: Icon,
    IconMail: Icon,
    IconMapPin: Icon,
    IconMessage: Icon,
    IconNomina: Icon,
    IconPackage: Icon,
    IconPlus: Icon,
    IconSettings: Icon,
    IconShoppingBag: Icon,
    IconStar: Icon,
    IconStore: Icon,
    IconStoreAlt: Icon,
    IconTag: Icon,
    IconTicket: Icon,
    IconTool: Icon,
    IconTrendingUp: Icon,
    IconTruck: Icon,
    IconUser: Icon,
    IconWallet: Icon,
  }
})

function ThemeSummary() {
  const { darkMode, setDarkMode, colors } = useAppTheme()
  const styles = useThemedStyles({ text: { color: '#111111', backgroundColor: '#ffffff' } })
  return (
    <div>
      <span>{darkMode ? 'Tema oscuro' : 'Tema claro'}</span>
      <span>{colors.page}</span>
      <span data-testid="themed-text" style={styles.text}>Texto</span>
      <button onClick={() => setDarkMode(true)}>Activar tema oscuro</button>
    </div>
  )
}

describe('barras laterales y tema', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getItem.mockResolvedValue(null)
    mocks.setItem.mockResolvedValue(undefined)
    mocks.getProfile.mockResolvedValue({ data: { foto_perfil: '/uploads/foto.png', banner_perfil: '/uploads/banner.png' } })
    mocks.getConfigLibreria.mockResolvedValue({ data: { logo_url: '/uploads/logo.png' } })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('navega por las secciones del menú de administración y cierra sesión', () => {
    render(
      <SidebarAdmin
        visible
        user={{ nombre: 'Admin Ana', foto_perfil: 'https://cdn.example.test/admin.png' }}
        onClose={mocks.onClose}
        onSignOut={mocks.onSignOut}
        onSelectDashboard={mocks.onSelectDashboard}
        onSelectSection={mocks.onSelectSection}
        activeSection="usuarios"
      />,
    )
    expect(screen.getByText('Admin Ana')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ir a Usuarios' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Ir a Reportes' }))
    expect(mocks.onClose).toHaveBeenCalledOnce()
    expect(mocks.onSelectSection).toHaveBeenCalledWith('reportes')

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(mocks.onSignOut).toHaveBeenCalledOnce()
  })

  it('usa la identidad predeterminada y resuelve imágenes locales del administrador', () => {
    const { container, rerender } = render(
      <SidebarAdmin
        visible
        user={{ foto_perfil: '/uploads/admin.png', banner_perfil: '/uploads/banner.png', banner_color: '#123456' }}
        onClose={mocks.onClose}
      />,
    )

    expect(screen.getAllByText('Administrador')).toHaveLength(2)
    const imageSources = Array.from(container.querySelectorAll('img'))
      .map((image) => image.getAttribute('src'))
    expect(imageSources).toContain('https://api.example.test/uploads/admin.png')
    expect(imageSources).toContain('https://api.example.test/uploads/banner.png')

    rerender(<SidebarAdmin visible user={{}} onClose={mocks.onClose} />)
    expect(screen.getByText('A')).toBeTruthy()
  })

  it('muestra las opciones de comprador y programa la navegación tras cerrar el menú', async () => {
    vi.useFakeTimers()
    render(
      <SidebarMenu
        visible
        user={{ nombre: 'Ana Compradora', rol: 'comprador' }}
        navigation={{ navigate: mocks.navigate }}
        onClose={mocks.onClose}
        onSignOut={mocks.onSignOut}
      />,
    )
    expect(screen.getByText('Ana Compradora')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    const buyerRoutes = [
      ['Inicio', 'PostLogin'],
      ['Catálogo', 'Catalogo'],
      ['Seguimiento de pedidos', 'Seguimiento'],
      ['Mi Perfil', 'Profile'],
      ['Mensajes', 'Messages'],
      ['Mi Carrito', 'Cart'],
      ['Direcciones', 'Direcciones'],
      ['Lista de Deseos', 'ListaDeseos'],
      ['Mis compras', 'History'],
      ['Quejas y reclamos', 'QuejasReclamos'],
      ['Notificaciones', 'Notifications'],
      ['Soporte técnico', 'SoporteTecnico'],
      ['Configuración', 'ConfiguracionComprador'],
    ]
    for (const [label, route] of buyerRoutes) {
      fireEvent.click(screen.getByText(label))
      await act(async () => { await vi.advanceTimersByTimeAsync(100) })
      expect(mocks.navigate).toHaveBeenLastCalledWith(route)
    }
    expect(mocks.onClose).toHaveBeenCalledTimes(buyerRoutes.length)
    fireEvent.click(screen.getByText('Cerrar Sesión'))
    expect(mocks.onSignOut).toHaveBeenCalledOnce()
    expect(mocks.onClose).toHaveBeenCalledTimes(buyerRoutes.length + 1)
    expect(mocks.getProfile).toHaveBeenCalledOnce()
  })

  it('muestra las opciones adicionales del menú para vendedores', async () => {
    vi.useFakeTimers()
    render(
      <SidebarMenu
        visible
        user={{ nombre: 'Vendedora', rol: 'vendedor' }}
        navigation={{ navigate: mocks.navigate }}
        onClose={mocks.onClose}
      />,
    )
    expect(screen.queryByText('Seguimiento de pedidos')).toBeNull()
    expect(screen.getByText('Panel de Tienda')).toBeTruthy()
    expect(screen.getByText('Mi Librería')).toBeTruthy()
    fireEvent.click(screen.getByText('Panel de Tienda'))
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    expect(mocks.navigate).toHaveBeenCalledWith('VendorHome')
    fireEvent.click(screen.getByText('Configuración'))
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    expect(mocks.navigate).toHaveBeenLastCalledWith('ConfiguracionTienda')
  })

  it('muestra las secciones de vendedor, carga el logo y navega a suscripciones', async () => {
    const { container } = render(
      <SidebarVendedor
        visible
        user={{ rol: 'vendedor', id_tienda: 8, nombre_tienda: 'Librería Central' }}
        navigation={{ navigate: mocks.navigate }}
        onClose={mocks.onClose}
        onSignOut={mocks.onSignOut}
      />,
    )
    expect(screen.getByText('Librería Central')).toBeTruthy()
    await waitFor(() => {
      const images = Array.from(container.querySelectorAll('img'))
      expect(images.some((image) => image.getAttribute('src') === 'https://api.example.test/uploads/logo.png')).toBe(true)
    })
    vi.useFakeTimers()
    const sellerRoutes = [
      ['Inicio', 'VendorHome'],
      ['Mis Libros', 'Libreria'],
      ['Publicar Libro', 'PublicarLibro'],
      ['Promociones', 'PromocionesVendedor'],
      ['Cupones', 'CuponesVendedor'],
      ['Ventas', 'VentasVendedor'],
      ['Pedidos', 'PedidosVendedor'],
      ['Envíos', 'EnviosVendedor'],
      ['Calificaciones', 'CalificacionesVendedor'],
      ['Quejas y reclamos', 'QuejasReclamos'],
      ['Notificaciones', 'Notifications'],
      ['Mensajes', 'Messages'],
      ['Perfil', 'PerfilVendedor'],
      ['Configuración', 'ConfiguracionTienda'],
    ]
    for (const [label, route] of sellerRoutes) {
      fireEvent.click(screen.getByText(label))
      await act(async () => { await vi.advanceTimersByTimeAsync(100) })
      expect(mocks.navigate).toHaveBeenLastCalledWith(route, undefined)
    }
    expect(mocks.getConfigLibreria).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByText('Cerrar sesión'))
    expect(mocks.onClose).toHaveBeenCalled()
    expect(mocks.onSignOut).toHaveBeenCalledOnce()
  })

  it('muestra colores de banner alternativos y omite datos de librería para compradores', async () => {
    mocks.getConfigLibreria.mockResolvedValueOnce({ data: {} })
    mocks.getProfile.mockResolvedValueOnce({
      data: { banner_color: 'linear-gradient(90deg, #123456, #ABCDEF)' },
    })
    const { container, rerender } = render(
      <SidebarVendedor
        visible
        user={{ rol: 'vendedor', id_tienda: 8, nombre: 'Vendedora' }}
        navigation={{ navigate: mocks.navigate }}
        onClose={mocks.onClose}
      />,
    )
    expect(await screen.findByText('Vendedora')).toBeTruthy()
    await waitFor(() => expect(mocks.resolveImageUrl).toHaveBeenCalled())
    expect(container.textContent).toContain('Inicio')
    expect(screen.getByText('V')).toBeTruthy()

    rerender(
      <SidebarVendedor
        visible
        user={{ rol: 'comprador', nombre: 'Ana' }}
        navigation={{ navigate: mocks.navigate }}
        onClose={mocks.onClose}
      />,
    )
    expect(screen.getByText('Ana')).toBeTruthy()
    expect(mocks.getConfigLibreria).toHaveBeenCalledOnce()
    expect(mocks.getProfile).toHaveBeenCalledOnce()
  })

  it('mantiene el menú renderizable cuando falla la carga del banner', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mocks.getProfile.mockRejectedValueOnce(new Error('offline'))
    render(
      <SidebarVendedor
        visible
        user={{ rol: 'vendedor', id_tienda: 8 }}
        navigation={{ navigate: mocks.navigate }}
        onClose={mocks.onClose}
      />,
    )
    expect(await screen.findByText('Mi Tienda')).toBeTruthy()
    await waitFor(() => expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('No se pudo cargar el banner'),
      expect.any(Error),
    ))
    warning.mockRestore()
  })

  it('persiste el tema oscuro, actualiza la paleta y transforma estilos', async () => {
    render(
      <AuthContext.Provider value={{ token: 'test-token', loading: false }}>
        <ThemeProvider><ThemeSummary /></ThemeProvider>
      </AuthContext.Provider>,
    )
    expect(await screen.findByText('Tema claro')).toBeTruthy()
    fireEvent.click(screen.getByText('Activar tema oscuro'))

    await waitFor(() => expect(mocks.setItem).toHaveBeenCalledWith('darkMode', 'true'))
    await waitFor(() => expect(screen.getByText('Tema oscuro')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('#121212')).toBeTruthy())
    await waitFor(() => expect(document.body.style.backgroundColor).toBe('rgb(18, 18, 18)'))
    expect(screen.getByTestId('themed-text').style.color).not.toBe('rgb(17, 17, 17)')

    const styles = adaptStyleForTheme({
      color: '#000',
      backgroundColor: 'white',
      borderColor: 'rgb(255, 255, 255)',
      transparentColor: 'transparent',
      image: 'url(https://example.test/a.png)',
      nested: [{ color: 'black' }],
    }, true)
    expect(styles.color).not.toBe('#000')
    expect(styles.backgroundColor).not.toBe('white')
    expect(styles.borderColor).not.toBe('rgb(255, 255, 255)')
    expect(styles.transparentColor).toBe('transparent')
    expect(styles.image).toBe('url(https://example.test/a.png)')
    expect(styles.nested[0].color).not.toBe('black')
    expect(adaptStyleForTheme(styles, false)).toBe(styles)
  })

  it('usa el tema claro si falla la lectura de la preferencia guardada', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mocks.getItem.mockRejectedValueOnce(new Error('almacenamiento no disponible'))

    render(
      <AuthContext.Provider value={{ token: 'test-token', loading: false }}>
        <ThemeProvider><ThemeSummary /></ThemeProvider>
      </AuthContext.Provider>,
    )

    expect(await screen.findByText('Tema claro')).toBeTruthy()
    expect(warning).toHaveBeenCalledWith(
      'No se pudo cargar el tema guardado:',
      expect.any(Error),
    )
    warning.mockRestore()
  })
})
