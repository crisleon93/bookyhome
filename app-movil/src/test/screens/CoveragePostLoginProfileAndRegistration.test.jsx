// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PostLogin from '../../screens/PostLogin'
import Profile from '../../screens/Profile'
import PromocionesVendedor from '../../screens/PromocionesVendedor'
import PublicarLibro from '../../screens/PublicarLibro'
import QuejasReclamos from '../../screens/QuejasReclamos'
import Register from '../../screens/Register'
import RegisterLibrary from '../../screens/RegisterLibrary'
import { AuthContext } from '../../context/AuthContext'
import { CartContext } from '../../context/CartContext'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  clipboardSetString: vi.fn(),
  apiPost: vi.fn(),
  getApiBaseUrl: vi.fn(),
  getBusquedaAvanzada: vi.fn(),
  getCategorias: vi.fn(),
  getCuponesDisponibles: vi.fn(),
  getEstadisticasUsuario: vi.fn(),
  getMisLibros: vi.fn(),
  getMensajesReclamo: vi.fn(),
  getOfertas: vi.fn(),
  getOfertaById: vi.fn(),
  getOrdenes: vi.fn(),
  getProfile: vi.fn(),
  getQuejas: vi.fn(),
  crearQueja: vi.fn(),
  enviarMensajeReclamo: vi.fn(),
  cancelarQueja: vi.fn(),
  crearOferta: vi.fn(),
  updateOferta: vi.fn(),
  deleteOferta: vi.fn(),
  publicarLibro: vi.fn(),
  updateLibro: vi.fn(),
  updateStockLibro: vi.fn(),
  crearVariante: vi.fn(),
  saveBannerColor: vi.fn(),
  updateProfile: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  registerLibrary: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  navigationGoBack: vi.fn(),
  navigationNavigate: vi.fn(),
  setDarkMode: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    onSubmitEditing,
    source,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    disabled,
    value,
    placeholder,
    secureTextEntry,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('div', {
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        'aria-pressed': accessibilityState?.selected,
        role: accessibilityRole || 'button',
        onKeyDown: props.onKeyPress,
      }, children)
    }
    if (tag === 'input' || tag === 'textarea') {
      return ReactModule.createElement(tag, {
        value: value ?? '',
        placeholder,
        type: secureTextEntry ? 'password' : 'text',
        disabled,
        'aria-label': accessibilityLabel,
        onChange: (event) => onChangeText?.(event.target.value),
        onKeyDown: onSubmitEditing ? (event) => {
          if (event.key === 'Enter') onSubmitEditing()
        } : undefined,
      })
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', { src: source?.uri || source, alt: accessibilityLabel || '' })
    }
    return ReactModule.createElement(tag, {
      'data-testid': props.testID,
      onClick: onPress,
    }, children)
  }
  return {
    ActivityIndicator: element('span'),
    Alert: { alert: mocks.alert },
    Animated: {},
    Clipboard: { setString: mocks.clipboardSetString },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    FlatList: ({ data = [], renderItem }) => ReactModule.createElement('div', null, data.map((item, index) => renderItem({ item, index }))),
    Image: element('img'),
    KeyboardAvoidingView: element('div'),
    Modal: ({ visible, children }) => visible ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children) : null,
    Platform: { OS: 'android', select: (values) => values.android || values.default },
    RefreshControl: () => null,
    ScrollView: element('div'),
    StyleSheet: {
      absoluteFill: {},
      absoluteFillObject: {},
      create: (styles) => styles,
      flatten: (style) => style,
    },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}))
vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div>{children}</div>,
}))
vi.mock('react-native-svg', async () => {
  const ReactModule = await vi.importActual('react')
  const Shape = () => null
  return {
    default: ({ children }) => ReactModule.createElement('svg', null, children),
    Circle: Shape,
    Path: Shape,
    Polyline: Shape,
    Rect: Shape,
  }
})
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div>{children}</div>,
}))
vi.mock('expo-image-picker', () => ({
  MediaType: { Images: 'images' },
  MediaTypeOptions: { Images: 'images' },
  requestMediaLibraryPermissionsAsync: mocks.requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync: mocks.launchImageLibraryAsync,
}))
vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react')
  return { useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]) }
})
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { AuthContext: ReactModule.createContext({}) }
})
vi.mock('../../context/CartContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { CartContext: ReactModule.createContext({}) }
})
vi.mock('../../context/ThemeContext', () => ({
  adaptStyleForTheme: (style) => style,
  useAppTheme: () => ({ darkMode: false, setDarkMode: mocks.setDarkMode }),
  useThemedStyles: (styles) => styles,
}))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconAlertTriangle: Icon,
    IconBook: Icon,
    IconBookOpen: Icon,
    IconCamera: Icon,
    IconCart: Icon,
    IconChartBar: Icon,
    IconCalendar: Icon,
    IconCheck: Icon,
    IconChevronRight: Icon,
    IconClose: Icon,
    IconEdit: Icon,
    IconEye: Icon,
    IconEyeOff: Icon,
    IconLock: Icon,
    IconMail: Icon,
    IconMessage: Icon,
    IconPhone: Icon,
    IconPlus: Icon,
    IconStar: Icon,
    IconStore: Icon,
    IconStoreAlt: Icon,
    IconTag: Icon,
    IconTrash: Icon,
    IconUser: Icon,
    IconLocation: Icon,
  }
})
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../components/AuthHeader', () => ({ default: () => null }))
vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/CarruselAnimado', () => ({ default: () => null }))
vi.mock('../../components/SidebarVendedor', () => ({ default: () => null }))
vi.mock('../../components/SidebarMenu', () => ({ default: () => null }))
vi.mock('../../components/BarcodeScanner', () => ({ default: () => null }))
vi.mock('../../components/CalendarioPicker', () => ({
  default: ({ label, onChange }) => (
    <button type="button" onClick={() => onChange(label.includes('inicio')
      ? '2030-01-01T10:00'
      : '2031-01-01T10:00')}>
      {label}
    </button>
  ),
}))
vi.mock('../../services/api', () => ({
  default: { post: mocks.apiPost },
  getApiBaseUrl: mocks.getApiBaseUrl,
  getBusquedaAvanzada: mocks.getBusquedaAvanzada,
  getCategorias: mocks.getCategorias,
  getCuponesDisponibles: mocks.getCuponesDisponibles,
  getEstadisticasUsuario: mocks.getEstadisticasUsuario,
  getMisLibros: mocks.getMisLibros,
  getMensajesReclamo: mocks.getMensajesReclamo,
  getOfertas: mocks.getOfertas,
  getOfertaById: mocks.getOfertaById,
  getOrdenes: mocks.getOrdenes,
  getProfile: mocks.getProfile,
  getQuejas: mocks.getQuejas,
  crearQueja: mocks.crearQueja,
  enviarMensajeReclamo: mocks.enviarMensajeReclamo,
  cancelarQueja: mocks.cancelarQueja,
  crearOferta: mocks.crearOferta,
  updateOferta: mocks.updateOferta,
  deleteOferta: mocks.deleteOferta,
  publicarLibro: mocks.publicarLibro,
  updateLibro: mocks.updateLibro,
  updateStockLibro: mocks.updateStockLibro,
  crearVariante: mocks.crearVariante,
  saveBannerColor: mocks.saveBannerColor,
  updateProfile: mocks.updateProfile,
  uploadBannerPhoto: mocks.uploadBannerPhoto,
  uploadProfilePhoto: mocks.uploadProfilePhoto,
  registerLibrary: mocks.registerLibrary,
}))

const navigation = {
  goBack: mocks.navigationGoBack,
  navigate: mocks.navigationNavigate,
}

const coupons = [
  { id_cupon: 1, codigo_cupon: 'BOOK10', tipo_descuento: 'porcentaje', valor_descuento: 10, nombre_tienda: 'Librería Norte', fecha_fin: '2030-01-01' },
  { id_cupon: 2, codigo_cupon: 'GLOBAL5', tipo_descuento: 'fijo', valor_descuento: 5000, fecha_fin: '2031-01-01' },
]

const orders = [{
  id_orden: 25,
  estado: 'pagado',
  total: 25000,
  items: [{ titulo: 'Libro comprado', nombre_tienda: 'Librería Norte' }],
}]

function renderAsBuyer(component) {
  return render(
    <AuthContext.Provider value={{ user: { nombre: 'Ana Compradora', email: 'ana@example.com' }, signOut: vi.fn() }}>
      <CartContext.Provider value={{ cart: [{ cantidad: 2 }] }}>
        {component}
      </CartContext.Provider>
    </AuthContext.Provider>,
  )
}

function renderAsSeller(component) {
  return render(
    <AuthContext.Provider value={{ user: { id_tienda: 8, nombre: 'Librería' }, signOut: vi.fn() }}>
      {component}
    </AuthContext.Provider>,
  )
}

describe('Additional mobile screen coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getApiBaseUrl.mockReturnValue('https://api.example.test')
    mocks.getBusquedaAvanzada.mockResolvedValue({ data: { libros: [] } })
    mocks.getCuponesDisponibles.mockResolvedValue({ data: coupons })
    mocks.getOrdenes.mockResolvedValue({ data: orders })
    mocks.getProfile.mockResolvedValue({
      data: { nombre_usuario: 'Ana Compradora', correo_usuario: 'ana@example.com', telefono: '3001234567' },
    })
    mocks.getEstadisticasUsuario.mockResolvedValue({
      data: { total_gastado: 60000, num_compras: 2, ticket_promedio: 30000, nivel_fidelizacion: 'Plata', categorias_favoritas: [{ nombre: 'Ficción', conteo: 2 }] },
    })
    mocks.getOfertas.mockResolvedValue({ data: [] })
    mocks.getMisLibros.mockResolvedValue({ data: [{ id_libro: 5, titulo: 'Cien años', autor_libro: 'García Márquez' }] })
    mocks.getCategorias.mockResolvedValue({ data: [{ id_categoria: 3, nombre_categoria: 'Ficción' }] })
    mocks.getQuejas.mockResolvedValue({ data: [] })
    mocks.crearQueja.mockResolvedValue({ data: {} })
    mocks.getMensajesReclamo.mockResolvedValue({ data: [] })
    mocks.enviarMensajeReclamo.mockResolvedValue({ data: {} })
    mocks.crearOferta.mockResolvedValue({ data: {} })
    mocks.publicarLibro.mockResolvedValue({ data: { id_libro: 90 } })
    mocks.updateStockLibro.mockResolvedValue({ data: {} })
    mocks.updateProfile.mockResolvedValue({ data: {} })
    mocks.saveBannerColor.mockResolvedValue({ data: {} })
    mocks.apiPost.mockResolvedValue({ data: {} })
    mocks.registerLibrary.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('carga el inicio del comprador, filtra cupones, copia su código y abre el carrito', async () => {
    renderAsBuyer(<PostLogin navigation={navigation} />)
    expect(await screen.findByText('Ana 👋')).toBeTruthy()
    fireEvent.click(screen.getByText('Explorar catálogo'))
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('Catalogo', {})
    fireEvent.click(screen.getByText('Ver todos'))
    expect(screen.getByText('Todos los cupones')).toBeTruthy()
    const modal = screen.getByTestId('modal')
    fireEvent.change(screen.getByPlaceholderText('Buscar por código o tienda'), {
      target: { value: 'global5' },
    })
    expect(within(modal).getByText('GLOBAL5')).toBeTruthy()
    expect(within(modal).queryByText('BOOK10')).toBeNull()
    fireEvent.click(within(modal).getByText('GLOBAL5'))
    expect(mocks.clipboardSetString).toHaveBeenCalledWith('GLOBAL5')
    fireEvent.click(screen.getByLabelText('Cerrar cupones'))
    fireEvent.click(screen.getByText('2'))
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('Cart')
    expect(mocks.getOrdenes).toHaveBeenCalled()
    expect(mocks.getBusquedaAvanzada).toHaveBeenCalledWith({ ordenar_por: 'recientes', limite: 12, pagina: 1 })
  })

  it('filtra cupones por tipo y vencimiento y abre el historial de compras', async () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    mocks.getCuponesDisponibles.mockResolvedValue({
      data: [
        { ...coupons[0], fecha_fin: soon },
        { ...coupons[1], fecha_fin: '2031-01-01' },
      ],
    })
    renderAsBuyer(<PostLogin navigation={navigation} />)

    expect(await screen.findByText('Tus últimas compras')).toBeTruthy()
    fireEvent.click(screen.getByText('Ver todos'))
    const modal = screen.getByTestId('modal')
    fireEvent.click(within(modal).getByText('Todos'))
    fireEvent.click(within(modal).getByText('Por tienda'))
    expect(within(modal).getByText('BOOK10')).toBeTruthy()
    expect(within(modal).queryByText('GLOBAL5')).toBeNull()

    fireEvent.click(within(modal).getByText('Cualquier vencimiento'))
    fireEvent.click(within(modal).getByText('Vencen en 7 días'))
    expect(within(modal).getByText('BOOK10')).toBeTruthy()
    fireEvent.click(within(modal).getByText('Por tienda'))
    fireEvent.click(within(modal).getByText('Globales'))
    expect(within(modal).getByText('No hay cupones que coincidan.')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Cerrar cupones'))

    fireEvent.click(screen.getByText('Libro comprado'))
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('History')
  })

  it('guarda el perfil y el banner, muestra estadísticas y detalles de fidelización', async () => {
    renderAsBuyer(<Profile />)
    expect(await screen.findByText('Información Personal')).toBeTruthy()
    fireEvent.change(screen.getByDisplayValue('Ana'), { target: { value: 'Ana María' } })
    fireEvent.click(screen.getByText('Guardar cambios'))
    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith({
      nombre_usuario: 'Ana María Compradora',
      telefono: '3001234567',
    }))
    expect(screen.getByText('Ficción')).toBeTruthy()
    fireEvent.click(screen.getByText('Editar'))
    fireEvent.change(screen.getByDisplayValue('#7A1E3A'), { target: { value: '#123456' } })
    fireEvent.click(screen.getByText('Aplicar'))
    await waitFor(() => expect(mocks.saveBannerColor).toHaveBeenCalledWith('#123456'))
    fireEvent.click(screen.getByText('Ver detalles'))
    expect(screen.getByText('Escala de fidelización')).toBeTruthy()
    expect(screen.getByText('Diamante')).toBeTruthy()
  })

  it('valida una nueva promoción antes de guardar sus fechas y libros seleccionados', async () => {
    renderAsSeller(<PromocionesVendedor navigation={navigation} />)
    fireEvent.click(await screen.findByText('+ Crear primera oferta'))
    fireEvent.click(screen.getByText('Crear oferta'))
    expect(await screen.findByText('El nombre es obligatorio')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Ej: Descuento verano'), {
      target: { value: 'Oferta verano' },
    })
    fireEvent.click(screen.getByText('Fecha y hora de inicio *'))
    fireEvent.click(screen.getByText('Fecha y hora de fin *'))
    fireEvent.click(screen.getByText('Cien años'))
    fireEvent.change(screen.getByPlaceholderText('Ej: 25'), { target: { value: '15' } })
    fireEvent.click(screen.getByText('Crear oferta'))
    await waitFor(() => expect(mocks.crearOferta).toHaveBeenCalledTimes(1))
    const formData = mocks.crearOferta.mock.calls[0][0]
    expect(formData.get('nombre_oferta')).toBe('Oferta verano')
    expect(formData.get('ids_libros')).toBe('5')
  })

  it('valida publicación de libro y permite actualizar existencias desde el modo stock', async () => {
    const published = renderAsSeller(<PublicarLibro navigation={navigation} />)
    expect(await screen.findByText('Información del libro')).toBeTruthy()
    fireEvent.click(screen.getByText('📚 Publicar libro'))
    expect(screen.getByText('El título es obligatorio')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Ej: Cien años de soledad'), { target: { value: 'Libro nuevo' } })
    fireEvent.change(screen.getByPlaceholderText('Ej: Gabriel García Márquez'), { target: { value: 'Autora' } })
    fireEvent.change(screen.getByPlaceholderText('25000'), { target: { value: '25000' } })
    fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '4' } })
    fireEvent.click(screen.getByText('Selecciona una categoría…'))
    fireEvent.click(screen.getByText('Ficción'))
    fireEvent.click(screen.getByText('Nuevo'))
    fireEvent.click(screen.getByText('📚 Publicar libro'))
    await waitFor(() => expect(mocks.publicarLibro).toHaveBeenCalledTimes(1))
    expect(mocks.navigationGoBack).toHaveBeenCalled()
    published.unmount()

    renderAsSeller(<PublicarLibro
      navigation={navigation}
      route={{ params: { modo: 'stock', libro: { id_libro: 7, titulo: 'Libro stock', autor_libro: 'Autor', stock: 2 } } }}
    />)
    expect(await screen.findByText('Actualizar stock')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '' } })
    fireEvent.click(screen.getByText('📦 Guardar stock'))
    expect(screen.getByText('Ingresa un stock válido (mínimo 0)')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '8' } })
    fireEvent.click(screen.getByText('📦 Guardar stock'))
    await waitFor(() => expect(mocks.updateStockLibro).toHaveBeenCalledWith(7, 8))
  })

  it('crea un reclamo validando selección de compra y motivo', async () => {
    renderAsBuyer(<QuejasReclamos navigation={navigation} />)
    expect(await screen.findByText(/Selecciona tu compra/)).toBeTruthy()
    fireEvent.click(screen.getByText('Enviar'))
    expect(mocks.alert).toHaveBeenCalledWith('Incompleto', 'Selecciona una compra y un motivo.')
    fireEvent.click(screen.getByText('Selecciona una compra...'))
    fireEvent.click(screen.getByText('Libro comprado'))
    fireEvent.click(screen.getByText('Selecciona un motivo'))
    fireEvent.click(screen.getByText('Otro'))
    fireEvent.change(screen.getByPlaceholderText('Especifica el motivo...'), {
      target: { value: 'Empaque incompleto' },
    })
    fireEvent.change(screen.getByPlaceholderText('Describe el problema...'), {
      target: { value: 'Falta un artículo en la caja.' },
    })
    fireEvent.click(screen.getByText('Enviar'))
    await waitFor(() => expect(mocks.crearQueja).toHaveBeenCalledTimes(1))
    const data = mocks.crearQueja.mock.calls[0][0]
    expect(data.get('id_orden')).toBe('25')
    expect(data.get('motivo')).toBe('Empaque incompleto')
    expect(data.get('descripcion')).toBe('Falta un artículo en la caja.')
    expect(await screen.findByText('Solicitud enviada. El administrador revisará tu caso.')).toBeTruthy()
    expect(mocks.getQuejas).toHaveBeenCalled()
  })

  it('valida el registro del comprador, acepta documentos legales y crea la cuenta', async () => {
    render(<Register navigation={navigation} />)
    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }))
    expect(mocks.alert).toHaveBeenCalledWith('Error', 'Ingresa tu nombre completo')
    fireEvent.change(screen.getByPlaceholderText('Tu nombre completo'), { target: { value: 'Ana Pérez' } })
    fireEvent.change(screen.getByPlaceholderText('ejemplo@gmail.com'), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('3001234567'), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'Clave123!' } })
    fireEvent.click(screen.getByText(/términos y condiciones/))
    fireEvent.click(screen.getByText('✓ Acepto'))
    fireEvent.click(screen.getByText('Cerrar'))
    fireEvent.click(screen.getByText(/política de privacidad/))
    fireEvent.click(screen.getByText('✓ Acepto'))
    fireEvent.click(screen.getByText('Cerrar'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }))
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith('/register', {
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      telefono: '3001234567',
      password: 'Clave123!',
      rol: 'comprador',
    }))
    expect(await screen.findByText(/¡Cuenta creada exitosamente!/)).toBeTruthy()
    fireEvent.click(screen.getByText('Ir al login ahora →'))
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('Login')
  })

  it('valida y registra una librería con rol vendedor', async () => {
    render(<RegisterLibrary navigation={navigation} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrar Librería' }))
    expect(screen.getAllByText('Este campo es obligatorio').length).toBeGreaterThan(0)
    fireEvent.change(screen.getByPlaceholderText('Tu nombre completo'), { target: { value: 'Luis Pérez' } })
    fireEvent.change(screen.getByPlaceholderText('Mi Librería'), { target: { value: 'Libros del Centro' } })
    fireEvent.change(screen.getByPlaceholderText('Calle Principal 123'), { target: { value: 'Calle 1 #2-3' } })
    fireEvent.change(screen.getByPlaceholderText('Tu teléfono'), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByPlaceholderText('@email.com'), { target: { value: 'luis@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: 'Clave1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar Librería' }))
    await waitFor(() => expect(mocks.registerLibrary).toHaveBeenCalledWith({
      nombre: 'Luis Pérez',
      libreria: 'Libros del Centro',
      direccion: 'Calle 1 #2-3',
      telefono: '3001234567',
      email: 'luis@example.com',
      password: 'Clave1234',
      rol: 'vendedor',
    }))
    expect(await screen.findByText(/¡Librería registrada exitosamente!/)).toBeTruthy()
  })
})
