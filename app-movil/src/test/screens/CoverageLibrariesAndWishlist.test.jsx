// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Libreria from '../../screens/Libreria'
import Librerias from '../../screens/Librerias'
import ListaDeseos from '../../screens/ListaDeseos'
import { AuthContext } from '../../context/AuthContext'

const mocks = vi.hoisted(() => ({
  addToListaDeseos: vi.fn(),
  alert: vi.fn(),
  createListaDeseos: vi.fn(),
  deleteLibro: vi.fn(),
  deleteListaDeseos: vi.fn(),
  getAlertasStock: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  getFavoritos: vi.fn(),
  getLibrosListaDeseos: vi.fn(),
  getListaDeseos: vi.fn(),
  getMisLibros: vi.fn(),
  getTiendasDestacadas: vi.fn(),
  navigation: { navigate: vi.fn(), goBack: vi.fn() },
  removeFavorito: vi.fn(),
  removeFromListaDeseos: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({
    children,
    accessibilityLabel,
    accessibilityRole,
    disabled,
    onChangeText,
    onPress,
    placeholder,
    source,
    value,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        'aria-label': accessibilityLabel,
        role: accessibilityRole || 'button',
        disabled,
        onClick: onPress,
      }, children)
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        'aria-label': accessibilityLabel,
        placeholder,
        value: value ?? '',
        disabled,
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
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  const FlatList = ({ data = [], renderItem, ListFooterComponent }) => ReactModule.createElement(
    'div',
    { 'data-testid': 'flat-list' },
    data.map((item, index) => ReactModule.createElement(
      ReactModule.Fragment,
      { key: item?.id_libro ?? item?.id_tienda ?? index },
      renderItem({ item, index }),
    )),
    ListFooterComponent,
  )
  return {
    ActivityIndicator: element('span'),
    Alert: { alert: mocks.alert },
    FlatList,
    Image: element('img'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children)
      : null,
    Platform: { OS: 'web', select: (options) => options.web || options.default },
    RefreshControl: ({ onRefresh }) => ReactModule.createElement('button', {
      type: 'button',
      onClick: onRefresh,
      'aria-label': 'Actualizar',
    }),
    ScrollView: element('div'),
    StyleSheet: {
      absoluteFillObject: {},
      create: (styles) => styles,
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

vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react')
  return { useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]) }
})

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react')
  return { AuthContext: ReactModule.createContext({}) }
})

vi.mock('../../context/ThemeContext', () => ({
  adaptStyleForTheme: (style) => style,
  useAppTheme: () => ({ colors: { page: '#fff' }, darkMode: false }),
  useThemedStyles: (styles) => styles,
}))

vi.mock('../../services/api', () => ({
  addToListaDeseos: mocks.addToListaDeseos,
  createListaDeseos: mocks.createListaDeseos,
  deleteLibro: mocks.deleteLibro,
  deleteListaDeseos: mocks.deleteListaDeseos,
  getAlertasStock: mocks.getAlertasStock,
  getApiBaseUrl: mocks.getApiBaseUrl,
  getFavoritos: mocks.getFavoritos,
  getLibrosListaDeseos: mocks.getLibrosListaDeseos,
  getListaDeseos: mocks.getListaDeseos,
  getMisLibros: mocks.getMisLibros,
  getTiendasDestacadas: mocks.getTiendasDestacadas,
  removeFavorito: mocks.removeFavorito,
  removeFromListaDeseos: mocks.removeFromListaDeseos,
}))

vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return { IconTrash: Icon }
})
vi.mock('../../components/Header', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))
vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible, onClose }) => visible
    ? <button type="button" onClick={onClose}>Cerrar menú</button>
    : null,
}))

const book = {
  id_libro: 17,
  titulo: 'Cuentos móviles',
  autor_libro: 'Autora',
  precio_libro: 15000,
  imagen_url: '/cover.jpg',
  nombre_categoria: 'Ficción',
  stock: 2,
  estado_libro: 'Visible',
}
const store = {
  id_tienda: 8,
  nombre_tienda: 'Lecturas Centro',
  ciudad_origen: 'Bogota',
  direccion: 'Calle 4',
  descripcion: 'Novedades',
  total_libros: 4,
  calificacion_promedio: 4.5,
}
const wishlist = { id_lista: 4, nombre_lista: 'Para leer', total_libros: 1 }

const renderSellerLibrary = () => render(
  <AuthContext.Provider value={{ user: { id_usuario: 3 }, signOut: mocks.signOut }}>
    <Libreria navigation={mocks.navigation} />
  </AuthContext.Provider>,
)
const renderWishlist = () => render(<ListaDeseos navigation={mocks.navigation} />)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.navigation.navigate = vi.fn()
  mocks.getMisLibros.mockResolvedValue({ data: [book] })
  mocks.getAlertasStock.mockResolvedValue({ data: [{ id_libro: 17, titulo: book.titulo, stock: 2 }] })
  mocks.deleteLibro.mockResolvedValue({})
  mocks.getTiendasDestacadas.mockResolvedValue({ data: [store] })
  mocks.getFavoritos.mockResolvedValue({ data: [book] })
  mocks.getListaDeseos.mockResolvedValue({ data: [wishlist] })
  mocks.getLibrosListaDeseos.mockResolvedValue({ data: [book] })
  mocks.createListaDeseos.mockResolvedValue({ data: { id_lista: 9 } })
  mocks.addToListaDeseos.mockResolvedValue({})
  mocks.removeFavorito.mockResolvedValue({})
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(cleanup)

describe('Libreria móvil', () => {
  it('carga libros, expone edición y confirma su eliminación', async () => {
    renderSellerLibrary()

    expect(await screen.findByText('Cuentos móviles')).toBeTruthy()
    expect(screen.getByText('1 libro publicado')).toBeTruthy()
    expect(screen.getByText(/1 libro con stock bajo/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Stock' }))
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('PublicarLibro', {
      libro: book,
      modo: 'stock',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByText(/¿Estás seguro que quieres eliminar/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    await waitFor(() => expect(mocks.deleteLibro).toHaveBeenCalledWith(17))
    expect(screen.queryByText('Cuentos móviles')).toBeNull()
  })

  it('muestra el estado vacío y permite abrir y cerrar el menú', async () => {
    mocks.getMisLibros.mockResolvedValueOnce({ data: [] })
    mocks.getAlertasStock.mockRejectedValueOnce(new Error('no alert service'))
    renderSellerLibrary()

    expect(await screen.findByText('Aún no tienes libros publicados')).toBeTruthy()
    fireEvent.click(screen.getByText('☰'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    fireEvent.click(screen.getByRole('button', { name: 'Publicar primer libro' }))
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('PublicarLibro')
  })
})

describe('Librerias móvil', () => {
  it('filtra por texto y stock, cambia orden y abre el perfil de la tienda', async () => {
    render(<Librerias navigation={mocks.navigation} route={{ params: {} }} />)
    expect(await screen.findByText('Lecturas Centro')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Solo con libros/i }))
    fireEvent.change(screen.getByPlaceholderText('Buscar librería...'), {
      target: { value: 'no existe' },
    })
    expect(screen.getByText('Sin resultados')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Mayor cantidad de libros/i }))
    fireEvent.click(screen.getByText(/Nombre: Z/))
    fireEvent.change(screen.getByPlaceholderText('Buscar librería...'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByText('Lecturas Centro'))
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('PerfilTienda', { id_tienda: 8 })
  })

  it('permite ordenar por calificación, cantidad y nombre ascendente', async () => {
    mocks.getTiendasDestacadas.mockResolvedValueOnce({
      data: [
        { ...store, id_tienda: 11, nombre_tienda: 'Zeta', total_libros: 3, calificacion_promedio: 3.2 },
        { ...store, id_tienda: 12, nombre_tienda: 'Alfa', total_libros: 1, calificacion_promedio: 4.9 },
        { ...store, id_tienda: 13, nombre_tienda: 'Beta', total_libros: 8, calificacion_promedio: 4.1 },
      ],
    })
    render(<Librerias navigation={mocks.navigation} route={{ params: {} }} />)
    await screen.findByText('Alfa')

    for (const [option, selected] of [
      [/Mejor calificación/, /Mejor calificación/],
      [/Menor cantidad de libros/, /Menor cantidad de libros/],
      [/Nombre: A/, /Nombre: A/],
    ]) {
      fireEvent.click(screen.getByText(/Mayor cantidad de libros|Mejor calificación|Menor cantidad de libros|Nombre: A/))
      fireEvent.click(screen.getByText(option))
      expect(screen.getByText(selected)).toBeTruthy()
    }
  })

  it('normaliza la ciudad desde la dirección y muestra datos alternativos si faltan', async () => {
    mocks.getTiendasDestacadas.mockResolvedValueOnce({
      data: [{
        id_tienda: 14,
        nombre_tienda: 'Librer??a de prueba',
        direccion: 'Calle 1, Medell??n',
        total_libros: 0,
        descripcion: ' ',
        logo_url: '/logos/prueba.png',
      }],
    })
    render(<Librerias navigation={mocks.navigation} route={{ params: {} }} />)

    expect(await screen.findAllByText(/Medellín/)).toHaveLength(2)
    expect(screen.getByText('Librería de prueba')).toBeTruthy()
    expect(screen.getByText('Librería asociada a BookyHome en Medellín.')).toBeTruthy()
    fireEvent.error(document.querySelector('img'))
    expect(screen.getByText('LD')).toBeTruthy()
  })

  it('normaliza ciudades colombianas y usa Colombia como ubicación predeterminada', async () => {
    const cities = [
      ['Bogota', 'Bogotá'],
      ['Medellin', 'Medellín'],
      ['Cali', 'Cali'],
      ['Barranquilla', 'Barranquilla'],
      ['Cartagena', 'Cartagena'],
      ['Santa Marta', 'Santa Marta'],
      ['Bucaramanga', 'Bucaramanga'],
      ['Pereira', 'Pereira'],
      ['Manizales', 'Manizales'],
      ['Armenia', 'Armenia'],
      ['Ibague', 'Ibagué'],
      ['Neiva', 'Neiva'],
      ['Villavicencio', 'Villavicencio'],
      ['Pasto', 'Pasto'],
      ['Popayan', 'Popayán'],
    ]
    mocks.getTiendasDestacadas.mockResolvedValueOnce({
      data: [
        ...cities.map(([ciudad_origen], index) => ({
          id_tienda: 20 + index,
          nombre_tienda: `Librería ${index}`,
          ciudad_origen,
          total_libros: 1,
        })),
        { id_tienda: 40, nombre_tienda: 'Sin ciudad', total_libros: 1 },
      ],
    })
    const { container } = render(<Librerias navigation={mocks.navigation} route={{ params: {} }} />)
    await screen.findByText('Librería 0')

    for (const [, city] of cities) {
      expect(container.textContent).toContain(city)
    }
    expect(container.textContent).toContain('Colombia')
  })

  it('muestra la lista vacía cuando no se pueden cargar las librerías', async () => {
    mocks.getTiendasDestacadas.mockRejectedValueOnce(new Error('offline'))
    render(<Librerias navigation={mocks.navigation} route={{ params: { nombre_tienda: 'No existe' } }} />)

    expect(await screen.findByText('Sin resultados')).toBeTruthy()
    expect(screen.getByText('0 librerías')).toBeTruthy()
  })
})

describe('ListaDeseos móvil', () => {
  it('carga favoritos y listas, crea una lista y agrega un favorito a ella', async () => {
    renderWishlist()
    expect(await screen.findByText('Cuentos móviles')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva' }))
    fireEvent.change(screen.getByPlaceholderText('Nombre de la lista'), {
      target: { value: '  Lecturas futuras  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Crear lista' }))

    await waitFor(() => {
      expect(mocks.createListaDeseos).toHaveBeenCalledWith({
        nombre_lista: 'Lecturas futuras',
        publica: false,
      })
    })
    expect(await screen.findByText('Cuentos móviles')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Mis favoritos/ }))
    fireEvent.click(screen.getByRole('button', { name: /Agregar a lista/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Para leer' }))
    await waitFor(() => expect(mocks.addToListaDeseos).toHaveBeenCalledWith(17, 4))
    expect(screen.getByText(/¡Libro agregado correctamente a la colección!/)).toBeTruthy()
  })

  it('permite ver el detalle y quitar un libro de favoritos', async () => {
    const { getByText } = renderWishlist()
    await screen.findByText('Cuentos móviles')
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('BookDetailPublico', { book })

    fireEvent.click(screen.getByRole('button', { name: 'Quitar de la lista' }))
    await waitFor(() => expect(mocks.removeFavorito).toHaveBeenCalledWith(17))
    expect(getByText(/Libro quitado de la lista/)).toBeTruthy()
  })
})
