// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import PublicarLibro from '../../screens/PublicarLibro'
import Checkout from '../../screens/Checkout'
import Libreria from '../../screens/Libreria'
import VendedorHome from '../../screens/VendedorHome'
import PedidosVendedor from '../../screens/PedidosVendedor'
import VentasVendedor from '../../screens/VentasVendedor'
import { AuthContext } from '../../context/AuthContext'
import { CartContext } from '../../context/CartContext'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  navigate: vi.fn(),
  goBack: vi.fn(),
  signOut: vi.fn(),
  loadCart: vi.fn(),
  recargarSalas: vi.fn(),
  imagePermission: vi.fn(),
  imageLaunch: vi.fn(),
  documentPicker: vi.fn(),
  storageGet: vi.fn(),
  storageSet: vi.fn(),
  getCategorias: vi.fn(),
  publicarLibro: vi.fn(),
  updateLibro: vi.fn(),
  updateStockLibro: vi.fn(),
  crearVariante: vi.fn(),
  subirArchivoVariante: vi.fn(),
  getOrderDetails: vi.fn(),
  actualizarCostoEnvio: vi.fn(),
  getDirecciones: vi.fn(),
  validarCupon: vi.fn(),
  processPayment: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  getDatosTransferenciaVendedor: vi.fn(),
  reservarRetiroEnTienda: vi.fn(),
  notificarLlegadaTienda: vi.fn(),
  getMisLibros: vi.fn(),
  getAlertasStock: vi.fn(),
  deleteLibro: vi.fn(),
  getMisVentas: vi.fn(),
  getStatsVendedor: vi.fn(),
  getTopVendidos: vi.fn(),
  getNotifications: vi.fn(),
  getLibreria: vi.fn(),
  getMisPedidos: vi.fn(),
  getEmpresasMensajeria: vi.fn(),
  actualizarEstadoOrden: vi.fn(),
  registrarGuia: vi.fn(),
  clipboard: vi.fn(),
}))

vi.mock('react-native', async () => {
  const R = await vi.importActual('react')
  const native = (tag) => function Native({
    children, onPress, onChangeText, accessibilityLabel, accessibilityRole,
    accessibilityState, disabled, value, placeholder, source, refreshControl,
    onRefresh, ...props
  }) {
    if (tag === 'button') {
      return R.createElement('button', {
        type: 'button',
        onClick: (event) => {
          event.stopPropagation()
          onPress?.()
        },
        disabled,
        'aria-label': accessibilityLabel,
        'aria-pressed': accessibilityState?.selected,
        role: accessibilityRole || 'button',
      }, children)
    }
    if (tag === 'input' || tag === 'textarea') {
      return R.createElement(tag, {
        value: value ?? '',
        placeholder,
        disabled: disabled || props.editable === false,
        'aria-label': accessibilityLabel,
        onChange: (event) => onChangeText?.(event.target.value),
      })
    }
    if (tag === 'img') return R.createElement('img', { src: source?.uri || source, alt: accessibilityLabel || '' })
    if (tag === 'div' && (refreshControl || onRefresh)) {
      return R.createElement('div', null, children, refreshControl)
    }
    return R.createElement(tag, { 'data-testid': props.testID }, children)
  }
  const FlatList = ({ data = [], renderItem, ListHeaderComponent, ListFooterComponent, ListEmptyComponent }) =>
    R.createElement('div', { 'data-testid': 'flat-list' },
      typeof ListHeaderComponent === 'function' ? R.createElement(ListHeaderComponent) : ListHeaderComponent,
      data.length
        ? data.map((item, index) => R.createElement(R.Fragment, { key: item?.id_orden ?? item?.id_libro ?? index }, renderItem({ item, index })))
        : (typeof ListEmptyComponent === 'function' ? R.createElement(ListEmptyComponent) : ListEmptyComponent),
      typeof ListFooterComponent === 'function' ? R.createElement(ListFooterComponent) : ListFooterComponent)
  return {
    ActivityIndicator: native('span'),
    Alert: { alert: mocks.alert },
    FlatList,
    Image: native('img'),
    Linking: { openURL: vi.fn().mockResolvedValue(undefined) },
    Modal: ({ visible, children }) => visible ? R.createElement('div', { role: 'dialog' }, children) : null,
    Platform: { OS: 'web', select: (values) => values.web || values.default },
    RefreshControl: ({ onRefresh }) => R.createElement('button', { type: 'button', onClick: onRefresh }, 'Actualizar'),
    ScrollView: native('div'),
    StyleSheet: { create: (styles) => styles, absoluteFillObject: {}, flatten: (style) => style },
    Text: native('span'),
    TextInput: native('input'),
    TouchableOpacity: native('button'),
    View: native('div'),
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  }
})

vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }) => <div>{children}</div> }))
vi.mock('react-native-svg', () => {
  const Shape = () => null
  return { default: Shape, Circle: Shape, Defs: Shape, Line: Shape, Path: Shape, Rect: Shape, Stop: Shape, Text: Shape, LinearGradient: Shape }
})
vi.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }) => <div>{children}</div> }))
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: mocks.storageGet,
    setItem: mocks.storageSet,
  },
}))
vi.mock('@react-navigation/native', async () => {
  const R = await vi.importActual('react')
  return {
    useFocusEffect: (callback) => R.useEffect(callback, [callback]),
    useNavigation: () => ({ navigate: mocks.navigate, goBack: mocks.goBack }),
  }
})
vi.mock('../../context/AuthContext', async () => {
  const R = await vi.importActual('react')
  return { AuthContext: R.createContext({ user: null, token: 'test-token', signOut: mocks.signOut }) }
})
vi.mock('../../context/CartContext', async () => {
  const R = await vi.importActual('react')
  return { CartContext: R.createContext({ loadCart: mocks.loadCart }) }
})
vi.mock('../../context/ChatSocketContext', () => ({
  useChatSocket: () => ({ recargarSalas: mocks.recargarSalas, salas: [], loadingSalas: false }),
}))
vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({ darkMode: false, colors: { page: '#fff', card: '#fff', text: '#111', muted: '#777', border: '#ddd', inset: '#fafafa' } }),
  useThemedStyles: (styles) => styles,
}))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../components/SidebarVendedor', () => ({ default: () => null }))
vi.mock('../../components/BarcodeScanner', () => ({ default: () => null }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconBook: Icon,
    IconCamera: Icon,
    IconDollar: Icon,
    IconFilter: Icon,
    IconMail: Icon,
    IconMapPin: Icon,
    IconPackage: Icon,
    IconPhone: Icon,
    IconRefresh: Icon,
    IconSearch: Icon,
    IconShoppingBag: Icon,
    IconUser: Icon,
  }
})
vi.mock('../../services/api', () => ({
  getCategorias: mocks.getCategorias,
  publicarLibro: mocks.publicarLibro,
  updateLibro: mocks.updateLibro,
  updateStockLibro: mocks.updateStockLibro,
  crearVariante: mocks.crearVariante,
  subirArchivoVariante: mocks.subirArchivoVariante,
  getOrderDetails: mocks.getOrderDetails,
  actualizarCostoEnvio: mocks.actualizarCostoEnvio,
  getDirecciones: mocks.getDirecciones,
  validarCupon: mocks.validarCupon,
  processPayment: mocks.processPayment,
  sendConfirmationEmail: mocks.sendConfirmationEmail,
  getDatosTransferenciaVendedor: mocks.getDatosTransferenciaVendedor,
  reservarRetiroEnTienda: mocks.reservarRetiroEnTienda,
  notificarLlegadaTienda: mocks.notificarLlegadaTienda,
  getMisLibros: mocks.getMisLibros,
  getAlertasStock: mocks.getAlertasStock,
  deleteLibro: mocks.deleteLibro,
  getMisVentas: mocks.getMisVentas,
  getStatsVendedor: mocks.getStatsVendedor,
  getTopVendidos: mocks.getTopVendidos,
  getNotifications: mocks.getNotifications,
  getLibreria: mocks.getLibreria,
  getMisPedidos: mocks.getMisPedidos,
  getEmpresasMensajeria: mocks.getEmpresasMensajeria,
  actualizarEstadoOrden: mocks.actualizarEstadoOrden,
  registrarGuia: mocks.registrarGuia,
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  resolveImageUrl: (value) => value,
}))
vi.mock('expo-clipboard', () => ({ setStringAsync: mocks.clipboard }))
vi.mock('expo-image-picker', () => ({
  MediaType: { Images: 'images' },
  MediaTypeOptions: { Images: 'images' },
  requestMediaLibraryPermissionsAsync: mocks.imagePermission,
  launchImageLibraryAsync: mocks.imageLaunch,
}))
vi.mock('expo-document-picker', () => ({ getDocumentAsync: mocks.documentPicker }))

const authValue = {
  user: { id_usuario: 7, id_tienda: 8, rol: 'vendedor', nombre: 'Librería Centro', nombre_tienda: 'Librería Centro' },
  token: 'test-token',
  signOut: mocks.signOut,
}
const navigation = { navigate: mocks.navigate, goBack: mocks.goBack }
const book = {
  id_libro: 17, titulo: 'Cuentos móviles', autor_libro: 'Autora', isbn: '123',
  precio_libro: 15000, stock: 2, id_categoria: 1, nombre_categoria: 'Ficción',
  estado_libro: 'Visible', imagen_url: '/cover.jpg',
}
const renderWithContext = (node) => render(
  <AuthContext.Provider value={authValue}>
    <CartContext.Provider value={{ loadCart: mocks.loadCart }}>{node}</CartContext.Provider>
  </AuthContext.Provider>,
)
const fillNewBookRequiredFields = () => {
  fireEvent.change(screen.getByPlaceholderText('Ej: Cien años de soledad'), { target: { value: 'Libro digital' } })
  fireEvent.change(screen.getByPlaceholderText('Ej: Gabriel García Márquez'), { target: { value: 'Autora' } })
  fireEvent.change(screen.getByPlaceholderText('25000'), { target: { value: '24000' } })
  fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '2' } })
  fireEvent.click(screen.getAllByText(/Selecciona una categoría/).pop())
  fireEvent.click(screen.getByText('Ficción'))
  fireEvent.click(screen.getByText('Nuevo'))
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getCategorias.mockResolvedValue({ data: [{ id_categoria: 1, nombre_categoria: 'Ficción' }] })
  mocks.publicarLibro.mockResolvedValue({ data: { id_libro: 25 } })
  mocks.updateLibro.mockResolvedValue({})
  mocks.updateStockLibro.mockResolvedValue({})
  mocks.crearVariante.mockResolvedValue({ data: { id_variante: 2 } })
  mocks.subirArchivoVariante.mockResolvedValue({})
  mocks.getOrderDetails.mockResolvedValue({
    data: {
      id_orden: 32, estado: 'pendiente', subtotal: 30000, costo_envio: 5000, total: 35000,
      fecha: '2026-11-18', items: [{ id_libro: 17, titulo: book.titulo, cantidad: 2, precio_libro: 15000 }],
    },
  })
  mocks.actualizarCostoEnvio.mockResolvedValue({ data: { ok: true, costo_envio: 5000, total: 35000 } })
  mocks.getDirecciones.mockResolvedValue({ data: [{ id_direccion: 4, alias_direccion: 'Casa', direccion: 'Calle 1', ciudad: 'Bogotá', es_principal: true }] })
  mocks.validarCupon.mockResolvedValue({ data: { valido: true, descuento: 5000, mensaje: 'Cupón aplicado.' } })
  mocks.processPayment.mockResolvedValue({ data: { ok: true } })
  mocks.sendConfirmationEmail.mockResolvedValue({})
  mocks.getMisLibros.mockResolvedValue({ data: [book] })
  mocks.getAlertasStock.mockResolvedValue({ data: [{ id_libro: 17, titulo: book.titulo, stock: 2 }] })
  mocks.deleteLibro.mockResolvedValue({})
  mocks.getMisVentas.mockResolvedValue({ data: [] })
  mocks.getStatsVendedor.mockResolvedValue({ data: { total_mes: 12000, ordenes_mes: 1, total_hoy: 12000, ordenes_hoy: 1, total_semana: 12000 } })
  mocks.getTopVendidos.mockResolvedValue({ data: [{ ...book, unidades_vendidas: 1 }] })
  mocks.getNotifications.mockResolvedValue({ data: { notificaciones: [] } })
  mocks.getLibreria.mockResolvedValue({ data: { nombre_tienda: 'Librería Centro' } })
  mocks.getMisPedidos.mockResolvedValue({ data: [{ id_orden: 18, estado: 'pagado', cliente: 'Ana Compradora', fecha: new Date().toISOString(), items: [{ titulo: book.titulo, cantidad: 1 }], total_tienda: 15000 }] })
  mocks.getEmpresasMensajeria.mockResolvedValue({ data: [{ id_empresa: 1, nombre_empresa: 'Mensajería Uno' }] })
  mocks.actualizarEstadoOrden.mockResolvedValue({})
  mocks.registrarGuia.mockResolvedValue({})
  mocks.loadCart.mockResolvedValue({})
  mocks.imagePermission.mockResolvedValue({ granted: false })
  mocks.imageLaunch.mockResolvedValue({ canceled: true, assets: [] })
  mocks.documentPicker.mockResolvedValue({ canceled: true, assets: [] })
  mocks.storageGet.mockResolvedValue(null)
  mocks.storageSet.mockResolvedValue(undefined)
  mocks.clipboard.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('mobile publishing, checkout and seller screens', () => {
  it('validates stock updates and saves an edited book', async () => {
    renderWithContext(<PublicarLibro navigation={navigation} route={{ params: { modo: 'stock', libro: book } }} />)
    const stockField = await screen.findByPlaceholderText('0')
    fireEvent.change(stockField, { target: { value: '-1' } })
    fireEvent.click(screen.getByText('📦 Guardar stock'))
    expect(await screen.findByText('Ingresa un stock válido (mínimo 0)')).toBeTruthy()
    fireEvent.change(stockField, { target: { value: '5' } })
    fireEvent.click(screen.getByText('📦 Guardar stock'))
    await waitFor(() => expect(mocks.updateStockLibro).toHaveBeenCalledWith(17, 5))

    renderWithContext(<PublicarLibro navigation={navigation} route={{ params: { modo: 'editar', libro: book } }} />)
    await screen.findByPlaceholderText('Ej: Cien años de soledad')
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    await waitFor(() => expect(mocks.updateLibro).toHaveBeenCalledWith(17, expect.any(FormData)))
  })

  it('publishes a validated book and exercises category, date and variant controls', async () => {
    renderWithContext(<PublicarLibro navigation={navigation} route={{ params: {} }} />)
    await screen.findByPlaceholderText('Ej: Cien años de soledad')
    fireEvent.click(screen.getByRole('button', { name: /Publicar libro/ }))
    expect(await screen.findByText('El título es obligatorio')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Ej: Cien años de soledad'), { target: { value: 'Libro nuevo' } })
    fireEvent.change(screen.getByPlaceholderText('Ej: Gabriel García Márquez'), { target: { value: 'Autora' } })
    fireEvent.change(screen.getByPlaceholderText('25000'), { target: { value: '24000' } })
    fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '2' } })
    fireEvent.click(screen.getAllByText(/Selecciona una categoría/).pop())
    fireEvent.click(screen.getByText('Ficción'))
    fireEvent.click(screen.getByText('Nuevo'))
    fireEvent.click(screen.getByText('Ofrecer acceso anticipado'))
    fireEvent.change(screen.getByPlaceholderText('AAAA-MM-DD'), { target: { value: '2030-13-40' } })
    fireEvent.click(screen.getByText('+ Agregar variante'))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '10000' } })
    fireEvent.change(within(dialog).getByPlaceholderText('5'), { target: { value: '2' } })
    fireEvent.click(within(dialog).getByText('Agregar variante'))
    fireEvent.click(screen.getByRole('button', { name: /Publicar libro/ }))
    await waitFor(() => expect(mocks.publicarLibro).toHaveBeenCalledOnce())
    expect(mocks.goBack).toHaveBeenCalled()
  })

  it('handles photo permissions and a digital variant through upload', async () => {
    mocks.imagePermission.mockResolvedValue({ granted: true })
    mocks.imageLaunch.mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'photo://one', fileName: 'cover.PNG', mimeType: 'image/png', file: new Blob(['cover']) },
        { uri: 'photo://bad', fileName: 'cover.gif', mimeType: 'image/gif', file: new Blob(['bad']) },
      ],
    })
    mocks.documentPicker.mockResolvedValue({ canceled: false, assets: [{ name: 'libro.txt' }] })
    renderWithContext(<PublicarLibro navigation={navigation} route={{ params: {} }} />)
    await screen.findByPlaceholderText('Ej: Cien años de soledad')
    fireEvent.click(screen.getByText('Agregar'))
    expect(await screen.findByAltText('')).toBeTruthy()
    expect(mocks.alert).toHaveBeenCalledWith('Formato no compatible', 'Solo se admiten fotos JPG, PNG o WebP.')
    fireEvent.click(screen.getByText('+ Agregar variante'))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Digital' }))
    fireEvent.change(within(dialog).getByPlaceholderText('0'), { target: { value: '12000' } })
    fireEvent.change(await screen.findByPlaceholderText('999'), { target: { value: '10' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Seleccionar archivo PDF o EPUB' }))
    expect(mocks.documentPicker).toHaveBeenCalled()
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Formato no compatible', 'Selecciona un archivo PDF o EPUB.'))
    fireEvent.click(within(dialog).getByText('Agregar variante'))
    expect(mocks.alert).toHaveBeenCalledWith(
      'Falta el archivo digital',
      'Para una variante Digital debes seleccionar un archivo PDF o EPUB.',
    )
    mocks.documentPicker.mockResolvedValueOnce({ canceled: false, assets: [{ name: 'libro.epub', uri: 'file://book' }] })
    fireEvent.click(within(dialog).getByText('Seleccionar archivo PDF o EPUB'))
    expect(await within(dialog).findByText('libro.epub')).toBeTruthy()
    fireEvent.click(within(dialog).getByText('Agregar variante'))
    expect(await screen.findByText(/Digital · Español/)).toBeTruthy()
    fillNewBookRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /Publicar libro/ }))
    await waitFor(() => expect(mocks.subirArchivoVariante).toHaveBeenCalledWith(25, 2, expect.objectContaining({ name: 'libro.epub' })))
  })

  it('reports server errors while saving a listing and its stock', async () => {
    mocks.publicarLibro.mockRejectedValueOnce({ response: { data: { detail: 'No se pudo publicar' } } })
    renderWithContext(<PublicarLibro navigation={navigation} route={{ params: {} }} />)
    await screen.findByPlaceholderText('Ej: Cien años de soledad')
    fillNewBookRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /Publicar libro/ }))
    expect(await screen.findByText(/No se pudo publicar/)).toBeTruthy()
    cleanup()
    mocks.updateStockLibro.mockRejectedValueOnce({ response: { data: { detail: 'Stock no actualizado' } } })
    renderWithContext(<PublicarLibro navigation={navigation} route={{ params: { modo: 'stock', libro: book } }} />)
    fireEvent.change(await screen.findByPlaceholderText('0'), { target: { value: '4' } })
    fireEvent.click(screen.getByText('📦 Guardar stock'))
    expect(await screen.findByText(/Stock no actualizado/)).toBeTruthy()
  })

  it('applies coupon feedback, selects delivery address and shows payment validation', async () => {
    renderWithContext(<Checkout route={{ params: { orderId: 32 } }} navigation={navigation} />)
    await screen.findByText('Entrega y Pago')
    fireEvent.click(screen.getByText('Aplicar'))
    expect(screen.getByText('Ingresa un código de cupón.')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Código de cupón'), { target: { value: 'SAVE' } })
    fireEvent.click(screen.getByText('Aplicar'))
    expect(await screen.findByText('Cupón aplicado.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar dirección de entrega' }))
    fireEvent.click(screen.getAllByText('Casa').pop())
    fireEvent.click(screen.getByText(/^Pagar /))
    expect(mocks.alert).toHaveBeenCalledWith('Error', 'Ingresa el nombre del titular')
    fireEvent.click(screen.getByText('Retiro en Tienda'))
    await waitFor(() => expect(mocks.actualizarCostoEnvio).toHaveBeenCalled())
  })

  it('completes PayPal checkout after rejecting empty sandbox credentials', async () => {
    renderWithContext(<Checkout route={{ params: { orderId: 32 } }} navigation={navigation} />)
    await screen.findByText('Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /PayPal/ }))
    fireEvent.click(screen.getByRole('button', { name: /PayPal · Pagar/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }))
    expect(mocks.alert).toHaveBeenCalledWith('Error', 'Ingresa las credenciales de tu cuenta Sandbox')
    fireEvent.click(screen.getByText('Cancelar'))
    fireEvent.click(screen.getByRole('button', { name: /PayPal · Pagar/ }))
    fireEvent.change(screen.getByPlaceholderText('usuario@sandbox.paypal.com'), { target: { value: 'buyer@example.test' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'demo-password' } })
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    expect(mocks.processPayment).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'PayPal' }))
    expect(screen.getByText('¡Pago Exitoso!')).toBeTruthy()
  })

  it('lets a buyer review PSE details and rejects an empty dynamic token', async () => {
    renderWithContext(<Checkout route={{ params: { orderId: 32 } }} navigation={navigation} />)
    await screen.findByText('Entrega y Pago')
    fireEvent.click(screen.getByRole('button', { name: /PSE/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Abrir Simulador PSE/ }))
    const pseDialog = screen.getByText('ACH Colombia · PSE').closest('[role="dialog"]')
    fireEvent.click(within(pseDialog).getByText(/Persona Jurídica/))
    fireEvent.click(within(pseDialog).getByText(/Persona Natural/))
    fireEvent.click(within(pseDialog).getByText('Bancolombia'))
    const bankDialog = screen.getByText('Selecciona tu entidad financiera').closest('[role="dialog"]')
    fireEvent.click(within(bankDialog).getByText('Davivienda'))
    expect(screen.getByText(/ACH Colombia · PSE/)).toBeTruthy()
    fireEvent.click(screen.getByText('⚡ Autocompletar'))
    fireEvent.click(screen.getByRole('button', { name: /Ir a la Banca Virtual/ }))
    fireEvent.click(screen.getByRole('button', { name: /Modificar datos o cambiar de banco/ }))
    expect(screen.getByText('1. Identificación PSE')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Ir a la Banca Virtual/ }))
    fireEvent.change(screen.getByPlaceholderText('6 dígitos'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Aprobar Débito Bancario/ }))
    expect(screen.getByText(/Ingresa la clave dinámica de seguridad/)).toBeTruthy()
    fireEvent.click(screen.getAllByText('×').pop())
  })

  it('filters inventory and records a point-of-sale stock change', async () => {
    renderWithContext(<Libreria navigation={navigation} />)
    expect(await screen.findByText(book.titulo)).toBeTruthy()
    fireEvent.click(screen.getByText('Venta'))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(dialog.querySelector('input'), { target: { value: '' } })
    fireEvent.click(within(dialog).getByText('Registrar venta'))
    expect(mocks.alert).toHaveBeenCalledWith('Cantidad inválida', 'Ingresa una cantidad entera mayor que cero.')
    fireEvent.change(dialog.querySelector('input'), { target: { value: '1' } })
    fireEvent.click(within(dialog).getByText('Registrar venta'))
    await waitFor(() => expect(mocks.updateStockLibro).toHaveBeenCalledWith(17, 1))
    expect(await screen.findByText('¡Venta registrada!')).toBeTruthy()
  })

  it('filters, changes the alert threshold, copies a book ID and deletes a listing', async () => {
    const secondBook = { ...book, id_libro: 18, titulo: 'Libro agotado', stock: 0, estado_libro: 'Oculto', nombre_categoria: 'Historia' }
    mocks.getMisLibros.mockResolvedValue({ data: [book, secondBook] })
    mocks.getCategorias.mockResolvedValue({ data: [
      { id_categoria: 1, nombre_categoria: 'Ficción' },
      { id_categoria: 2, nombre_categoria: 'Historia' },
    ] })
    renderWithContext(<Libreria navigation={navigation} />)
    expect(await screen.findByText('Libro agotado')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir filtros' }))
    const filters = screen.getByRole('dialog')
    fireEvent.click(within(filters).getByText('Agotados (1)'))
    fireEvent.click(within(filters).getByText(/Ver .* resultados/))
    expect(screen.getByText('Libro agotado')).toBeTruthy()
    expect(screen.queryByText('Cuentos móviles')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    fireEvent.click(screen.getByText('Limpiar'))

    fireEvent.click(screen.getAllByRole('button', { name: 'ID' })[0])
    const codeDialog = screen.getByText('Identificación del libro').closest('[role="dialog"]')
    fireEvent.click(within(codeDialog).getByText('Copiar ID'))
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Código copiado', 'El identificador del libro está en el portapapeles.'))
    fireEvent.click(within(codeDialog).getByText('Cerrar'))

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    fireEvent.click(screen.getByText('Sí, eliminar'))
    await waitFor(() => expect(mocks.deleteLibro).toHaveBeenCalledOnce())
  })

  it('validates failed inventory updates and restores all filters after searching', async () => {
    mocks.getMisLibros.mockResolvedValue({ data: [book] })
    mocks.updateStockLibro.mockRejectedValueOnce({ response: { data: { detail: 'No se pudo descontar el stock' } } })
    renderWithContext(<Libreria navigation={navigation} />)
    await screen.findByText(book.titulo)
    fireEvent.change(screen.getByPlaceholderText('Buscar por título, autor o categoría...'), { target: { value: 'sin coincidencia' } })
    expect(screen.getByText('No se encontraron libros')).toBeTruthy()
    fireEvent.click(screen.getByText('Limpiar filtros'))
    expect(screen.getByText(book.titulo)).toBeTruthy()

    fireEvent.click(screen.getByText('▣ Venta en mostrador'))
    const saleDialog = screen.getByRole('dialog')
    fireEvent.click(within(saleDialog).getByText(book.titulo))
    fireEvent.change(saleDialog.querySelector('input'), { target: { value: '3' } })
    fireEvent.click(within(saleDialog).getByText('Registrar venta'))
    expect(mocks.alert).toHaveBeenCalledWith('Stock insuficiente', 'Solo tienes 2 unidad(es) disponibles.')
    fireEvent.change(saleDialog.querySelector('input'), { target: { value: '1' } })
    fireEvent.click(within(saleDialog).getByText('Registrar venta'))
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith(
      'No se pudo registrar la venta',
      'No se pudo descontar el stock',
    ))
    fireEvent.click(within(saleDialog).getByText('Cancelar'))

    fireEvent.click(screen.getByText('Umbral: 3 ⚙'))
    const thresholdDialog = screen.getByText('Umbral de stock bajo').closest('[role="dialog"]')
    fireEvent.change(thresholdDialog.querySelector('input'), { target: { value: '101' } })
    fireEvent.click(within(thresholdDialog).getByText('Guardar'))
    expect(mocks.alert).toHaveBeenCalledWith('Umbral inválido', 'Ingresa un número entero entre 0 y 100.')
    fireEvent.click(within(thresholdDialog).getByText('Cancelar'))
  })

  it('loads the seller dashboard, changes chart modes and saves the stock threshold', async () => {
    mocks.getMisVentas.mockResolvedValue({ data: [
      { id_orden: 1, fecha: new Date().toISOString(), total: 24000 },
      { id_orden: 2, fecha: new Date(Date.now() - 86400000).toISOString(), total: 12000 },
    ] })
    mocks.getAlertasStock.mockResolvedValue({ data: [
      { id_libro: 17, titulo: book.titulo, stock: 0 },
      { id_libro: 18, titulo: 'Stock bajo', stock: 1 },
    ] })
    mocks.getNotifications.mockResolvedValue({ data: { notificaciones: [
      { id_notificacion: 1, tipo: 'pedido', titulo: 'Nuevo pedido', descripcion: 'Pedido recibido', fecha_creacion: new Date().toISOString(), leida: false },
      { id_notificacion: 2, tipo: 'otro', cuerpo: 'Aviso', fecha_creacion: 'fecha no válida', leida: true },
    ] } })
    renderWithContext(<VendedorHome navigation={navigation} />)
    expect((await screen.findAllByText(/Librería Centro/)).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('Barras'))
    fireEvent.click(screen.getByText('Mes'))
    fireEvent.click(screen.getByText('Año'))
    fireEvent.click(screen.getByRole('button', { name: 'Ver período anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver historial de ventas' }))
    fireEvent.click(screen.getByText('Ver historial detallado →'))
    fireEvent.click(screen.getByText('Ver catálogo →'))
    fireEvent.click(screen.getAllByText('Cuentos móviles')[0])
    fireEvent.click(screen.getByText('Nuevo pedido'))
    fireEvent.click(screen.getByText('Ver todas →'))
    expect(mocks.navigate).toHaveBeenCalledWith('Notifications')
    fireEvent.click(screen.getByText('Ver pedidos →'))
    expect(mocks.navigate).toHaveBeenCalledWith('PedidosVendedor')
    fireEvent.click(screen.getByText(/Umbral: 3 uds/))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByPlaceholderText('3'), { target: { value: '0' } })
    fireEvent.click(within(dialog).getByText('Guardar'))
    await waitFor(() => expect(mocks.getAlertasStock).toHaveBeenCalledWith(0))
  })

  it('updates order status and registers a shipment guide', async () => {
    renderWithContext(<PedidosVendedor navigation={navigation} route={{ name: 'PedidosVendedor' }} />)
    expect(await screen.findByText('Ana Compradora')).toBeTruthy()
    fireEvent.click(screen.getByText(/Pagado/))
    fireEvent.click(screen.getByText('Enviado'))
    await waitFor(() => expect(mocks.actualizarEstadoOrden).toHaveBeenCalledWith(18, 'enviado'))

    renderWithContext(<PedidosVendedor navigation={navigation} route={{ name: 'EnviosVendedor' }} />)
    expect(await screen.findByText(/Compra BH-18/)).toBeTruthy()
    fireEvent.click(screen.getByText('+ Registrar guía'))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByText('Mensajería Uno'))
    fireEvent.change(within(dialog).getByPlaceholderText('Ej: SRV-123456789'), { target: { value: 'GUIA-18' } })
    fireEvent.click(within(dialog).getByText('Guardar'))
    await waitFor(() => expect(mocks.registrarGuia).toHaveBeenCalledWith(18, expect.objectContaining({ numero_guia: 'GUIA-18' })))
  })

  it('searches and filters orders, views details, and handles a missing shipment company', async () => {
    mocks.getMisPedidos.mockResolvedValue({ data: [
      { id_orden: 18, estado: 'pagado', cliente: 'Ana Compradora', fecha: new Date().toISOString(), items: [{ titulo: book.titulo, cantidad: 2, precio_libro: 15000 }] },
      { id_orden: 19, estado: 'entregada', cliente: 'Luis', fecha: new Date().toISOString(), items: [] },
      { id_orden: 20, tipo_entrega: 'retiro_tienda', estado_retiro: 'en_tienda', estado: 'pagado', cliente: 'Marta', items: [] },
    ] })
    renderWithContext(<PedidosVendedor navigation={navigation} route={{ name: 'PedidosVendedor' }} />)
    expect(await screen.findByText('Ana Compradora')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar por #orden, código o cliente...'), { target: { value: 'Marta' } })
    expect(screen.getByText('Marta')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar pedidos' }))
    const filterDialog = screen.getByRole('dialog')
    fireEvent.click(within(filterDialog).getByText('Entregadas'))
    expect(screen.getByText('Luis')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar pedidos' }))
    fireEvent.click(screen.getByText('Limpiar filtro'))
    fireEvent.click(screen.getByText('Ver detalle'))
    expect(screen.getByText(/Detalle del pedido/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }))

    mocks.getEmpresasMensajeria.mockRejectedValueOnce(new Error('sin empresas'))
    renderWithContext(<PedidosVendedor navigation={navigation} route={{ name: 'EnviosVendedor' }} />)
    await screen.findByText(/Compra BH-18/)
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar envíos' }))
    const shipmentFilters = screen.getByText('Filtrar envíos').closest('[role="dialog"]')
    fireEvent.click(within(shipmentFilters).getByText('Sin guía'))
    fireEvent.click(within(shipmentFilters).getByText('7 días'))
    fireEvent.click(within(shipmentFilters).getByText('Limpiar filtros'))
    fireEvent.click(within(shipmentFilters).getByText('Aplicar filtros'))
    fireEvent.click(screen.getByText('+ Registrar guía'))
    const guideDialog = screen.getByRole('dialog')
    fireEvent.click(within(guideDialog).getByText('Guardar'))
    expect(mocks.alert).toHaveBeenCalledWith('Aviso', 'No se pudieron cargar las empresas de mensajería. Podrás consultar pedidos, pero no registrar guías.')
    expect(mocks.alert).toHaveBeenCalledWith('Falta', 'Selecciona la empresa de mensajería.')
  })

  it('aggregates sales and opens grouped order details', async () => {
    mocks.getMisVentas.mockResolvedValue({ data: [
      { id_orden: 1, fecha: new Date().toISOString(), estado: 'pagado', cliente: 'Ana', titulo: 'Libro A', id_libro: 1, cantidad: 1, precio_libro: 10000, total: 10000 },
      { id_orden: 1, fecha: new Date().toISOString(), estado: 'pagado', cliente: 'Ana', titulo: 'Libro B', id_libro: 2, cantidad: 2, precio_libro: 5000, total: 10000 },
    ] })
    renderWithContext(<VentasVendedor navigation={navigation} />)
    expect(await screen.findByText('Libro A')).toBeTruthy()
    fireEvent.click(screen.getByText('Ver detalle'))
    expect(screen.getByText('Detalle de la orden')).toBeTruthy()
  })

  it('shows an empty sales state, retries after failure and paginates results', async () => {
    mocks.getMisVentas.mockRejectedValueOnce({ response: { data: { detail: 'Ventas no disponibles' } } })
    renderWithContext(<VentasVendedor navigation={navigation} />)
    expect(await screen.findByText('Ventas no disponibles')).toBeTruthy()
    fireEvent.click(screen.getByText('Reintentar'))
    await waitFor(() => expect(mocks.getMisVentas).toHaveBeenCalledTimes(2))
    cleanup()
    mocks.getMisVentas.mockResolvedValue({ data: Array.from({ length: 6 }, (_, index) => ({
      id_orden: index + 1,
      fecha: new Date(Date.now() - index * 86400000).toISOString(),
      estado: index === 0 ? 'entregada' : index === 1 ? 'cancelada' : 'pagado',
      cliente: index === 0 ? 'Ana' : 'Cliente',
      titulo: `Libro ${index + 1}`,
      id_libro: index + 1,
      cantidad: index + 1,
      precio_libro: 10000,
      total: 10000,
    })) })
    renderWithContext(<VentasVendedor navigation={navigation} />)
    expect(await screen.findByText('Libro 1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(await screen.findByText('Libro 6')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    fireEvent.click(screen.getAllByRole('button', { name: '5' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
  })
})
