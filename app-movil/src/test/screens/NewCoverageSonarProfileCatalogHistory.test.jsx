// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from '../../screens/Profile';
import ListaDeseos from '../../screens/ListaDeseos';
import BookDetail from '../../screens/BookDetail';
import Home from '../../screens/Home';
import Catalogo from '../../screens/Catalogo';
import History from '../../screens/History';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  addFavorito: vi.fn(),
  addToCart: vi.fn(),
  addToListaDeseos: vi.fn(),
  apiGet: vi.fn(),
  cancelarMisPendientes: vi.fn(),
  createListaDeseos: vi.fn(),
  createReview: vi.fn(),
  crearSalaChat: vi.fn(),
  deleteListaDeseos: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  getBookById: vi.fn(),
  getBusquedaAvanzada: vi.fn(),
  getCatalogoStats: vi.fn(),
  getDevoluciones: vi.fn(),
  getEstadisticasUsuario: vi.fn(),
  getFiltrosDisponibles: vi.fn(),
  getFavoritos: vi.fn(),
  getLibrosListaDeseos: vi.fn(),
  getListaDeseos: vi.fn(),
  getOrderDetails: vi.fn(),
  getOrdenes: vi.fn(),
  getProfile: vi.fn(),
  getReviewsForBook: vi.fn(),
  getTiendasDestacadas: vi.fn(),
  getVariantes: vi.fn(),
  navigation: { navigate: vi.fn(), push: vi.fn(), goBack: vi.fn() },
  notificarLlegadaTienda: vi.fn(),
  printAsync: vi.fn(),
  removeFavorito: vi.fn(),
  removeFromCart: vi.fn(),
  removeFromListaDeseos: vi.fn(),
  saveBannerColor: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  updateProfile: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  uploadProfilePhoto: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeElement({
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
      }, children);
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        'aria-label': accessibilityLabel,
        placeholder,
        value: value ?? '',
        disabled,
        onChange: (event) => onChangeText?.(event.target.value),
      });
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', {
        src: source?.uri || source,
        alt: accessibilityLabel || '',
        onError: props.onError,
      });
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  const FlatList = ({
    data = [],
    renderItem,
    ListEmptyComponent,
    ListFooterComponent,
    onLayout,
    onContentSizeChange,
    onScroll,
  }) => {
    const renderComponent = (component) => (
      typeof component === 'function' ? ReactModule.createElement(component) : component || null
    );
    return ReactModule.createElement('div', { 'data-testid': 'flat-list' },
      onLayout && ReactModule.createElement('button', {
        type: 'button',
        onClick: () => onLayout({ nativeEvent: { layout: { height: 600 } } }),
      }, 'Measure list'),
      onContentSizeChange && ReactModule.createElement('button', {
        type: 'button',
        onClick: () => onContentSizeChange(0, 300),
      }, 'Measure content'),
      onScroll && ReactModule.createElement('button', {
        type: 'button',
        onClick: () => onScroll({
          nativeEvent: {
            contentOffset: { y: 0 },
            layoutMeasurement: { height: 600 },
            contentSize: { height: 900 },
          },
        }),
      }, 'Scroll list'),
      data.length
        ? data.map((item, index) => ReactModule.createElement(
          ReactModule.Fragment,
          { key: item?.id_libro || index },
          renderItem({ item, index }),
        ))
        : renderComponent(ListEmptyComponent),
      renderComponent(ListFooterComponent),
    );
  };
  return {
    ActivityIndicator: () => ReactModule.createElement('span', null, 'Loading…'),
    Alert: { alert: mocks.alert },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    FlatList,
    Image: nativeElement('img'),
    ImageBackground: ({ children }) => ReactModule.createElement('div', null, children),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children)
      : null,
    Platform: { OS: 'web', select: (options) => options.web || options.default },
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (styles) => styles, absoluteFillObject: {}, flatten: (style) => style },
    Text: nativeElement('span'),
    TextInput: nativeElement('input'),
    TouchableOpacity: nativeElement('button'),
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    View: nativeElement('div'),
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div data-testid="safe-area">{children}</div>,
}));
vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div data-testid="themed-safe-area">{children}</div>,
}));
vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react');
  return { useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]) };
});
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({}) };
});
vi.mock('../../context/CartContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { CartContext: ReactModule.createContext({}) };
});
vi.mock('../../context/ThemeContext', () => ({
  adaptStyleForTheme: (style) => style,
  useAppTheme: () => ({ colors: { page: '#fff' }, darkMode: false }),
  useThemedStyles: (styles) => styles,
}));
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div>{children}</div>,
}));
vi.mock('react-native-svg', () => {
  const Shape = () => null;
  return {
    default: Shape,
    Circle: Shape,
    Line: Shape,
    Path: Shape,
    Polygon: Shape,
    Polyline: Shape,
    Rect: Shape,
  };
});
vi.mock('expo-print', () => ({ printAsync: mocks.printAsync }));
vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ granted: false }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));
vi.mock('../../components/Header', () => ({
  default: ({ onSearch, onFilterApply }) => (
    <div>
      <button onClick={() => onSearch?.('búsqueda de prueba')}>Buscar desde encabezado</button>
      <button onClick={() => onFilterApply?.({
        busqueda: 'filtrado',
        nombre_tienda: 'Librería Central',
        categoria_id: 4,
        precio_min: 10000,
        precio_max: 50000,
        calificacion_min: 4,
        disponible: false,
        ordenar_por: 'precio_asc',
      })}>Aplicar filtros del encabezado</button>
    </div>
  ),
}));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/Icons', () => {
  const Icon = () => null;
  return {
    IconBook: Icon,
    IconBookOpen: Icon,
    IconBooks: Icon,
    IconChartBar: Icon,
    IconPackage: Icon,
    IconSearch: Icon,
    IconShield: Icon,
    IconStar: Icon,
    IconTrash: Icon,
    IconTruck: Icon,
    IconUser: Icon,
  };
});
vi.mock('../../components/CarruselAnimado', () => ({
  default: ({ titulo, libros = [], onVerLibro, onVerTodos }) => (
    <section>
      <h2>{titulo}</h2>
      <span>{libros.length} libros</span>
      <button onClick={() => onVerLibro({ titulo: 'Libro destacado' })}>Abrir {titulo}</button>
      <button onClick={onVerTodos}>Ver todos {titulo}</button>
    </section>
  ),
}));
vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet },
  addFavorito: mocks.addFavorito,
  addToListaDeseos: mocks.addToListaDeseos,
  cancelarMisPendientes: mocks.cancelarMisPendientes,
  createListaDeseos: mocks.createListaDeseos,
  createReview: mocks.createReview,
  crearSalaChat: mocks.crearSalaChat,
  deleteListaDeseos: mocks.deleteListaDeseos,
  getApiBaseUrl: mocks.getApiBaseUrl,
  getBookById: mocks.getBookById,
  getBusquedaAvanzada: mocks.getBusquedaAvanzada,
  getCatalogoStats: mocks.getCatalogoStats,
  getDevoluciones: mocks.getDevoluciones,
  getEstadisticasUsuario: mocks.getEstadisticasUsuario,
  getFiltrosDisponibles: mocks.getFiltrosDisponibles,
  getFavoritos: mocks.getFavoritos,
  getLibrosListaDeseos: mocks.getLibrosListaDeseos,
  getListaDeseos: mocks.getListaDeseos,
  getOrderDetails: mocks.getOrderDetails,
  getOrdenes: mocks.getOrdenes,
  getProfile: mocks.getProfile,
  getReviewsForBook: mocks.getReviewsForBook,
  getTiendasDestacadas: mocks.getTiendasDestacadas,
  getVariantes: mocks.getVariantes,
  notificarLlegadaTienda: mocks.notificarLlegadaTienda,
  removeFavorito: mocks.removeFavorito,
  removeFromCart: mocks.removeFromCart,
  removeFromListaDeseos: mocks.removeFromListaDeseos,
  saveBannerColor: mocks.saveBannerColor,
  sendConfirmationEmail: mocks.sendConfirmationEmail,
  updateProfile: mocks.updateProfile,
  uploadBannerPhoto: mocks.uploadBannerPhoto,
  uploadProfilePhoto: mocks.uploadProfilePhoto,
}));

const book = {
  id_libro: 17,
  titulo: 'Cuentos móviles',
  autor_libro: 'Autora',
  precio_libro: 15000,
  imagen_url: '/cover.jpg',
  nombre_categoria: 'Ficción',
  stock: 3,
};
const wishlist = { id_lista: 4, nombre_lista: 'Para leer', total_libros: 1 };
const renderBookDetail = (bookData = { ...book, id_tienda: 8, nombre_tienda: 'Lecturas Centro' }, user = { nombre_usuario: 'Ana' }) => render(
  <AuthContext.Provider value={{ user }}>
    <CartContext.Provider value={{ addToCart: mocks.addToCart, removeFromCart: mocks.removeFromCart }}>
      <BookDetail route={{ params: { book: bookData } }} navigation={mocks.navigation} />
    </CartContext.Provider>
  </AuthContext.Provider>,
);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.navigation.navigate = vi.fn();
  mocks.navigation.push = vi.fn();
  mocks.getProfile.mockResolvedValue({
    data: {
      nombre_usuario: 'Ana López',
      correo_usuario: 'ana@example.com',
      telefono: '3001234567',
      banner_color: '#7A1E3A',
    },
  });
  mocks.getEstadisticasUsuario.mockResolvedValue({
    data: { total_gastado: 200000, num_compras: 5, ticket_promedio: 40000, categorias_favoritas: [], nivel_fidelizacion: 'Plata' },
  });
  mocks.updateProfile.mockResolvedValue({});
  mocks.saveBannerColor.mockResolvedValue({});
  mocks.getFavoritos.mockResolvedValue({ data: [book] });
  mocks.getListaDeseos.mockResolvedValue({ data: [wishlist] });
  mocks.getLibrosListaDeseos.mockResolvedValue({ data: [book] });
  mocks.createListaDeseos.mockResolvedValue({ data: { id_lista: 9 } });
  mocks.deleteListaDeseos.mockResolvedValue({});
  mocks.removeFavorito.mockResolvedValue({});
  mocks.removeFromListaDeseos.mockResolvedValue({});
  mocks.addToListaDeseos.mockResolvedValue({});
  mocks.getBusquedaAvanzada.mockResolvedValue({ data: { libros: [book], total_paginas: 2, total: 1 } });
  mocks.getFiltrosDisponibles.mockResolvedValue({
    data: { categorias: [{ id_categoria: 4, nombre_categoria: 'Ficción', cantidad_libros: 3 }], precio_max: 80000 },
  });
  mocks.addFavorito.mockResolvedValue({});
  mocks.getBookById.mockResolvedValue({ data: { ...book, id_tienda: 8, nombre_tienda: 'Lecturas Centro' } });
  mocks.getVariantes.mockResolvedValue({
    data: [
      { id_variante: 31, precio_variante: 18000, stock_variante: 2, tipo_tapa: 'Tapa dura', idioma: 'Espanol', edicion: '2024' },
      { id_variante: 32, precio_variante: 12000, stock_variante: 0, tipo_tapa: 'Digital', idioma: 'Inglés', edicion: '2023' },
    ],
  });
  mocks.getReviewsForBook.mockResolvedValue({
    data: { promedio: 4.5, total: 1, resenas: [{ id_resena: 1, nombre_usuario: 'Luis', calificacion: 5, comentario: 'Excelente', fecha_resena: '2026-01-01' }] },
  });
  mocks.createReview.mockResolvedValue({});
  mocks.crearSalaChat.mockResolvedValue({ data: { id_sala: 22 } });
  mocks.apiGet.mockResolvedValue({ data: { libros: [] } });
  mocks.getCatalogoStats.mockResolvedValue({
    data: { libros_disponibles: 1250, librerias_asociadas: 14, usuarios_activos: 320, calificacion_promedio: 4.7 },
  });
  mocks.getTiendasDestacadas.mockResolvedValue({ data: [] });
  mocks.getOrdenes.mockResolvedValue({ data: [] });
  mocks.getDevoluciones.mockResolvedValue({ data: [] });
  mocks.getOrderDetails.mockResolvedValue({ data: {} });
  mocks.cancelarMisPendientes.mockResolvedValue({ data: { ok: true, canceladas: 0 } });
  mocks.notificarLlegadaTienda.mockResolvedValue({});
  mocks.sendConfirmationEmail.mockResolvedValue({});
  mocks.printAsync.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Sonar mobile screen behaviors', () => {
  it('saves trimmed profile data and keeps the selected banner color', async () => {
    render(<Profile />);
    await screen.findByText('Información Personal');
    const phone = screen.getAllByRole('textbox').find((input) => input.value === '3001234567');
    fireEvent.change(phone, { target: { value: '  3110000000  ' } });
    fireEvent.click(screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Aplicar'));
    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith({
      nombre_usuario: 'Ana López',
      telefono: '3110000000',
    }));
    expect(mocks.saveBannerColor).toHaveBeenCalledWith('#7A1E3A');
  });

  it('handles wishlist creation validation, list removal, and an API error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.getListaDeseos
      .mockResolvedValueOnce({ data: [wishlist] })
      .mockResolvedValueOnce({ data: [] });
    render(<ListaDeseos navigation={mocks.navigation} />);
    await screen.findByText('Cuentos móviles');

    fireEvent.click(screen.getByText('+ Nueva'));
    fireEvent.click(screen.getByText('Crear lista'));
    expect(mocks.alert).toHaveBeenCalledWith('Nombre requerido', 'Escribe un nombre para tu lista.');
    fireEvent.click(screen.getByText('Cancelar'));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar lista Para leer' }));
    await waitFor(() => expect(mocks.deleteListaDeseos).toHaveBeenCalledWith(4));
    expect(screen.getByText('No tienes listas aún. Crea una para empezar.')).toBeTruthy();

    mocks.getFavoritos.mockRejectedValueOnce(new Error('offline'));
    mocks.getListaDeseos.mockRejectedValueOnce(new Error('offline'));
    cleanup();
    render(<ListaDeseos navigation={mocks.navigation} />);
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo cargar tu lista de deseos.'));
  });

  it('supports variant cart, seller chat, and review workflows on a book detail', async () => {
    renderBookDetail();
    expect(await screen.findByText(/Promedio: 4.5/)).toBeTruthy();
    expect(screen.getByText('2 disponibles')).toBeTruthy();
    fireEvent.click(screen.getByText('Tapa dura · 2024'));
    fireEvent.click(screen.getByText('Agregar al Carrito'));
    await waitFor(() => expect(mocks.addToCart).toHaveBeenCalledWith(expect.objectContaining({
      id_variante: 31,
      precio_libro: 18000,
    })));
    fireEvent.click(await screen.findByText('VER CARRITO'));
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('Cart');

    fireEvent.click(screen.getByText('Contactar vendedor'));
    await waitFor(() => expect(mocks.navigation.navigate).toHaveBeenCalledWith('Chat', {
      id_sala: 22,
      nombre_tienda: 'Lecturas Centro',
    }));
    fireEvent.change(screen.getByPlaceholderText('Escribe tu reseña...'), {
      target: { value: 'Muy recomendable' },
    });
    fireEvent.click(screen.getByText('Enviar reseña'));
    await waitFor(() => expect(mocks.createReview).toHaveBeenCalledWith({
      id_libro: 17,
      calificacion: 5,
      comentario: 'Muy recomendable',
    }));
    expect(mocks.alert).toHaveBeenCalledWith('Éxito', 'Reseña creada correctamente');
  });

  it('uses fallback book details and handles anonymous actions and backend failures', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.getBookById.mockRejectedValueOnce(new Error('offline'));
    mocks.getVariantes.mockRejectedValueOnce(new Error('offline'));
    mocks.getReviewsForBook.mockRejectedValueOnce(new Error('offline'));
    renderBookDetail({ id: 17, titulo: 'Libro sin tienda', stock: 2 }, null);
    expect(await screen.findByText('Libro sin tienda')).toBeTruthy();
    fireEvent.click(screen.getByText('Agregar al Carrito'));
    expect(mocks.alert).toHaveBeenCalledWith('Inicia sesión', 'Debes iniciar sesión para agregar al carrito.');
    fireEvent.click(screen.getByText('Contactar vendedor'));
    expect(mocks.alert).toHaveBeenCalledWith('Inicia sesión', 'Debes iniciar sesión para contactar al vendedor.');
    expect(warn).toHaveBeenCalledWith('No se pudo obtener detalle del libro:', 'offline');
    expect(mocks.getBookById).toHaveBeenCalledWith(17);

    cleanup();
    mocks.getVariantes.mockResolvedValueOnce({ data: [] });
    mocks.getReviewsForBook.mockResolvedValueOnce({ data: { promedio: 0, total: 0, resenas: [] } });
    renderBookDetail({ ...book, stock: 0, id_tienda: 8 }, { nombre_usuario: 'Ana' });
    expect(await screen.findByText('Sin stock')).toBeTruthy();
    fireEvent.click(screen.getByText('Contactar vendedor'));
    await waitFor(() => expect(mocks.navigation.navigate).toHaveBeenCalledWith('Chat', expect.any(Object)));
  });

  it('renders home store fallbacks and navigates to city-filtered catalog sections', async () => {
    mocks.getCatalogoStats.mockResolvedValueOnce({
      data: { libros_disponibles: null, librerias_asociadas: 1, usuarios_activos: 2, calificacion_promedio: 0 },
    });
    mocks.getTiendasDestacadas.mockResolvedValueOnce({
      data: [
        { id_tienda: 1, nombre_tienda: 'Librería Cali', ciudad_origen: 'Cali', logo_url: '/cali.png' },
        { id_tienda: 2, nombre_tienda: 'Librería Barranquilla', ciudad_origen: 'Barranquilla' },
        { id_tienda: 3, nombre_tienda: 'Librería Cartagena', ciudad_origen: 'Cartagena' },
        { id_tienda: 4, nombre_tienda: 'Librería Pereira', ciudad_origen: 'Pereira' },
        { id_tienda: 5, nombre_tienda: 'Librería Bucaramanga', ciudad_origen: 'Bucaramanga' },
        { id_tienda: 6, nombre_tienda: 'Librería Manizales', ciudad_origen: 'Manizales' },
        { id_tienda: 7, nombre_tienda: 'Sin ciudad', direccion: 'Calle 1, Medellin' },
      ],
    });
    const { container } = render(<Home navigation={mocks.navigation} />);

    expect(await screen.findByText('El marketplace que conecta lectores con librerías')).toBeTruthy();
    for (const city of ['Cali', 'Barranquilla', 'Cartagena', 'Pereira', 'Bucaramanga', 'Manizales', 'Medellín']) {
      expect(container.textContent).toContain(city);
    }
    expect(screen.getByText('...')).toBeTruthy();
    fireEvent.click(screen.getByText('Abrir Recién llegados'));
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('CatalogoPublico', { q: 'Libro destacado' });
  });

  it('reports catalog API failures and clears favorite state only after a successful request', async () => {
    mocks.getBusquedaAvanzada.mockRejectedValueOnce(new Error('offline'));
    mocks.getFavoritos.mockRejectedValueOnce(new Error('offline'));
    render(
      <AuthContext.Provider value={{ signOut: vi.fn() }}>
        <Catalogo navigation={mocks.navigation} route={{ params: {} }} />
      </AuthContext.Provider>,
    );
    await screen.findByText('Sin resultados');

    mocks.getBusquedaAvanzada.mockResolvedValue({ data: { libros: [book], total_paginas: 1, total: 1 } });
    fireEvent.click(screen.getByText('Buscar desde encabezado'));
    expect(await screen.findByText('Cuentos móviles')).toBeTruthy();
    mocks.addFavorito.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Favoritos', 'No se pudo actualizar favoritos.'));
  });

  it('shows the empty history state after a pending-order cleanup response', async () => {
    mocks.cancelarMisPendientes.mockResolvedValueOnce({ data: { ok: true, canceladas: 0 } });
    render(<History navigation={mocks.navigation} />);
    expect(await screen.findByText('Aún no has realizado ninguna compra en BookyHome.')).toBeTruthy();
    expect(screen.getByText(/0 Compras registradas/)).toBeTruthy();
  });
});
