// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Cart from '../../screens/Cart';
import Catalogo from '../../screens/Catalogo';
import CatalogoPublico from '../../screens/CatalogoPublico';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  apiGet: vi.fn(),
  addFavorito: vi.fn(),
  removeFavorito: vi.fn(),
  getBusquedaAvanzada: vi.fn(),
  getFiltrosDisponibles: vi.fn(),
  getFavoritos: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  loadCart: vi.fn(),
  getDirecciones: vi.fn(),
  getOrdenes: vi.fn(),
  checkoutCarrito: vi.fn(),
  cancelOrder: vi.fn(),
  searchByISBN: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    source,
    accessibilityLabel,
    disabled,
    ...props
  }) {
    const elementProps = {};
    if (tag === 'button') {
      elementProps.type = 'button';
      elementProps.onClick = onPress;
      elementProps.disabled = disabled;
      elementProps['aria-label'] = accessibilityLabel;
    } else if (tag === 'img') {
      elementProps.src = source?.uri || source;
      elementProps.alt = accessibilityLabel || '';
      elementProps.onError = props.onError;
    } else {
      elementProps['data-testid'] = props.testID;
    }
    return ReactModule.createElement(tag, elementProps, children);
  };
  const FlatList = ({
    data = [],
    renderItem,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    onLayout,
    onContentSizeChange,
    onScroll,
  }) => {
    const renderComponent = (component) => {
      if (typeof component === 'function') return ReactModule.createElement(component);
      return component || null;
    };
    return ReactModule.createElement(
      'div',
      { 'data-testid': 'flat-list' },
      onLayout && ReactModule.createElement('button', {
        type: 'button',
        'data-testid': 'list-layout',
        onClick: () => onLayout({ nativeEvent: { layout: { height: 600 } } }),
      }),
      onContentSizeChange && ReactModule.createElement('button', {
        type: 'button',
        'data-testid': 'list-content-size',
        onClick: () => onContentSizeChange(0, 300),
      }),
      onScroll && ReactModule.createElement('button', {
        type: 'button',
        'data-testid': 'list-scroll',
        onClick: () => onScroll({
          nativeEvent: {
            contentOffset: { y: 0 },
            layoutMeasurement: { height: 600 },
            contentSize: { height: 900 },
          },
        }),
      }),
      renderComponent(ListHeaderComponent),
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
    ActivityIndicator: nativeElement('span'),
    Alert: { alert: mocks.alert },
    FlatList,
    Image: nativeElement('img'),
    Modal: ({ visible, children, onRequestClose }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal', onKeyDown: onRequestClose }, children)
      : null,
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (styles) => styles, flatten: (style) => style },
    Text: nativeElement('span'),
    TextInput: ({ onChangeText, ...props }) => ReactModule.createElement('input', {
      placeholder: props.placeholder,
      value: props.value,
      onChange: (event) => onChangeText?.(event.target.value),
    }),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
});

vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react');
  return { useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]) };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));

vi.mock('react-native-svg', () => {
  const Shape = () => null;
  return {
    default: Shape,
    Circle: Shape,
    Line: Shape,
    Path: Shape,
    Rect: Shape,
  };
});

vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({}) };
});

vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: (styles) => styles,
}));

vi.mock('../../components/Header', () => ({
  default: ({ onSearch, onFilterApply, onBarcodeScanned }) => (
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
      }, 'librerias')}>Aplicar filtros del encabezado</button>
      <button onClick={() => onBarcodeScanned?.('9780306406157')}>Buscar ISBN</button>
    </div>
  ),
}));

vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/Icons', () => ({
  IconBooks: () => null,
  IconCart: () => null,
}));

vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet },
  addFavorito: mocks.addFavorito,
  removeFavorito: mocks.removeFavorito,
  getBusquedaAvanzada: mocks.getBusquedaAvanzada,
  getFiltrosDisponibles: mocks.getFiltrosDisponibles,
  getFavoritos: mocks.getFavoritos,
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  getDirecciones: mocks.getDirecciones,
  getOrdenes: mocks.getOrdenes,
  checkoutCarrito: mocks.checkoutCarrito,
  cancelOrder: mocks.cancelOrder,
  searchByISBN: mocks.searchByISBN,
}));

const book = {
  id_libro: 5,
  titulo: 'Libro móvil',
  autor_libro: 'Autora móvil',
  nombre_categoria: 'Ficción',
  precio_libro: 18000,
  stock: 3,
  imagen_url: '/portada.jpg',
  variante_label: 'Digital',
};

const navigation = {
  navigate: vi.fn(),
  push: vi.fn(),
};

const renderCart = ({ cart = [], loading = false } = {}) => render(
  <CartContext.Provider value={{
    cart,
    loading,
    removeFromCart: mocks.removeFromCart,
    clearCart: mocks.clearCart,
    loadCart: mocks.loadCart,
  }}>
    <AuthContext.Provider value={{ token: 'token' }}>
      <Cart navigation={navigation} />
    </AuthContext.Provider>
  </CartContext.Provider>,
);

const renderCatalogo = (route = { params: {} }) => render(
  <AuthContext.Provider value={{ signOut: mocks.signOut }}>
    <Catalogo navigation={navigation} route={route} />
  </AuthContext.Provider>,
);

afterEach(cleanup);

describe('Cart screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDirecciones.mockResolvedValue({ data: [{ id_direccion: 14, alias_direccion: 'Casa', direccion: 'Calle 1', ciudad: 'Bogotá', es_principal: true }] });
    mocks.getOrdenes.mockResolvedValue({ data: [] });
    mocks.checkoutCarrito.mockResolvedValue({ data: { ok: true, order: { id_orden: 71 } } });
    mocks.cancelOrder.mockResolvedValue({});
  });

  it('muestra la carga y ofrece el catálogo cuando el carrito está vacío', () => {
    const { rerender } = renderCart({ loading: true });
    expect(screen.getByText('Cargando carrito...')).toBeTruthy();

    rerender(
      <CartContext.Provider value={{
        cart: [], loading: false, removeFromCart: mocks.removeFromCart,
        clearCart: mocks.clearCart, loadCart: mocks.loadCart,
      }}>
        <AuthContext.Provider value={{ token: 'token' }}>
          <Cart navigation={navigation} />
        </AuthContext.Provider>
      </CartContext.Provider>,
    );
    fireEvent.click(screen.getByText('Ir al catálogo'));
    expect(navigation.navigate).toHaveBeenCalledWith('Catalogo');
  });

  it('selecciona la dirección principal y crea la orden al continuar al pago', async () => {
    renderCart({ cart: [book] });
    fireEvent.click(await screen.findByRole('button', { name: /Continuar con el pago/ }));

    await waitFor(() => expect(mocks.checkoutCarrito).toHaveBeenCalledWith({ id_direccion: 14 }));
    expect(navigation.navigate).toHaveBeenCalledWith('Checkout', { orderId: 71 });
  });

  it('pide una dirección antes del pago cuando no hay ninguna disponible', async () => {
    mocks.getDirecciones.mockResolvedValue({ data: [] });
    renderCart({ cart: [book] });
    fireEvent.click(await screen.findByRole('button', { name: /Continuar con el pago/ }));

    expect(await screen.findByText('Dirección requerida')).toBeTruthy();
    fireEvent.click(screen.getByText('Agregar dirección'));
    expect(navigation.navigate).toHaveBeenCalledWith('Direcciones');
  });

  it('muestra el total del artículo y permite quitarlo y vaciar el carrito', async () => {
    renderCart({ cart: [{ ...book, cantidad: 2 }] });
    expect(await screen.findAllByText('Digital')).toHaveLength(2);
    expect(screen.getAllByText('$36.000')).toHaveLength(3);

    fireEvent.click(screen.getByLabelText('Quitar Libro móvil del carrito'));
    fireEvent.click(screen.getByText('Vaciar'));
    expect(mocks.removeFromCart).toHaveBeenCalledWith(5);
    expect(mocks.clearCart).toHaveBeenCalledOnce();
  });

  it('muestra detalles de una orden pendiente y permite cancelarla', async () => {
    mocks.getOrdenes
      .mockResolvedValueOnce({ data: [{
        id_orden_db: 22,
        estado: 'pendiente de pago',
        total: 18000,
        items: [book],
      }] })
      .mockResolvedValue({ data: [] });
    renderCart();

    fireEvent.click(await screen.findByText('Ver detalles'));
    expect(screen.getAllByText('Orden #22')).toHaveLength(2);
    expect(screen.getByText('Libro móvil')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancelar'));
    fireEvent.click(screen.getByText('Sí, cancelar'));

    await waitFor(() => expect(mocks.cancelOrder).toHaveBeenCalledWith(22, 'Cancelación de orden pendiente'));
    expect(mocks.alert).toHaveBeenCalledWith('Información', 'Orden cancelada correctamente.');
  });
});

describe('Catalogo screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBusquedaAvanzada.mockResolvedValue({
      data: { libros: [book], total_paginas: 2, total: 1 },
    });
    mocks.getFiltrosDisponibles.mockResolvedValue({
      data: { categorias: [{ id_categoria: 4, nombre_categoria: 'Ficción', cantidad_libros: 3 }], precio_max: 80000 },
    });
    mocks.getFavoritos.mockResolvedValue({ data: [] });
    mocks.addFavorito.mockResolvedValue({});
    mocks.removeFavorito.mockResolvedValue({});
  });

  it('carga libros, abre el detalle y agrega y quita favoritos', async () => {
    renderCatalogo();

    expect(await screen.findByText('Libro móvil')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    await waitFor(() => expect(mocks.addFavorito).toHaveBeenCalledWith(5));
    expect(mocks.alert).toHaveBeenCalledWith('Favoritos', 'Libro agregado a favoritos.');

    fireEvent.click(screen.getByLabelText('Quitar de favoritos'));
    await waitFor(() => expect(mocks.removeFavorito).toHaveBeenCalledWith(5));
    fireEvent.click(screen.getByText('Ver detalles'));
    expect(navigation.navigate).toHaveBeenCalledWith('BookDetailPublico', { book });
  });

  it('aplica los filtros recibidos desde el encabezado', async () => {
    renderCatalogo();
    await screen.findByText('Libro móvil');

    fireEvent.click(screen.getByText('Aplicar filtros del encabezado'));
    await waitFor(() => expect(mocks.getBusquedaAvanzada).toHaveBeenCalledWith(expect.objectContaining({
      q: 'filtrado',
      nombre_tienda: 'Librería Central',
      categoria_id: 4,
      precio_min: 10000,
      precio_max: 50000,
      calificacion_min: 4,
      ordenar_por: 'precio_asc',
    })));
  });

  it('muestra la paginación al medir la lista y carga la página siguiente', async () => {
    renderCatalogo();
    await screen.findByText('Libro móvil');

    fireEvent.click(screen.getByTestId('list-layout'));
    expect(screen.getByText('Pág. 1 / 2')).toBeTruthy();
    fireEvent.click(screen.getByText('Siguiente →'));

    await waitFor(() => expect(mocks.getBusquedaAvanzada).toHaveBeenCalledWith(
      expect.objectContaining({ pagina: 2 }),
    ));
  });
});

describe('CatalogoPublico screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiGet.mockImplementation(async (url) => {
      if (url === '/catalogo/filtros-disponibles') return { data: { precio_max: 90000 } };
      return { data: { libros: [book], total_paginas: 2, total: 1 } };
    });
    mocks.searchByISBN.mockResolvedValue({ data: book });
  });

  it('carga resultados y abre el detalle desde una tarjeta', async () => {
    render(<CatalogoPublico navigation={navigation} route={{ params: {} }} />);

    expect(await screen.findByText('Libro móvil')).toBeTruthy();
    fireEvent.click(screen.getByText('Ver detalles'));
    expect(navigation.navigate).toHaveBeenCalledWith('BookDetailPublico', { book });
    expect(mocks.apiGet).toHaveBeenCalledWith('/catalogo/busqueda-avanzada', {
      params: expect.objectContaining({ pagina: 1, limite: 24 }),
    });
  });

  it('busca por ISBN y navega al libro encontrado', async () => {
    render(<CatalogoPublico navigation={navigation} route={{ params: {} }} />);
    await screen.findByText('Libro móvil');

    fireEvent.click(screen.getByText('Buscar ISBN'));
    await waitFor(() => expect(mocks.searchByISBN).toHaveBeenCalledWith('9780306406157'));
    expect(navigation.navigate).toHaveBeenCalledWith('BookDetailPublico', { book });
  });

  it('usa la búsqueda por texto cuando falla la consulta ISBN y permite paginar', async () => {
    mocks.searchByISBN.mockRejectedValueOnce(new Error('no encontrado'));
    render(<CatalogoPublico navigation={navigation} route={{ params: {} }} />);
    await screen.findByText('Libro móvil');

    fireEvent.click(screen.getByText('Buscar ISBN'));
    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/catalogo/busqueda-avanzada', {
      params: expect.objectContaining({ q: '9780306406157' }),
    }));

    fireEvent.click(screen.getByText('Siguiente →'));
    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/catalogo/busqueda-avanzada', {
      params: expect.objectContaining({ pagina: 2 }),
    }));
  });

  it('aplica filtros de librerías sin perder el orden actual', async () => {
    render(<CatalogoPublico navigation={navigation} route={{ params: { ordenar_por: 'recientes' } }} />);
    await screen.findByText('Libro móvil');

    fireEvent.click(screen.getByText('Aplicar filtros del encabezado'));
    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/catalogo/busqueda-avanzada', {
      params: expect.objectContaining({
        nombre_tienda: 'Librería Central',
        ordenar_por: 'precio_asc',
        pagina: 1,
      }),
    }));
  });
});
