// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PostLogin from '../../screens/PostLogin';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';

const mocks = vi.hoisted(() => ({
  clipboardSetString: vi.fn(),
  getCuponesDisponibles: vi.fn(),
  getOrdenes: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://api.test'),
  getBusquedaAvanzada: vi.fn(),
  navigationNavigate: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    source,
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
      }, children);
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        placeholder: props.placeholder,
        value: props.value,
        onChange: (event) => onChangeText?.(event.target.value),
      });
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', { src: source?.uri || source, alt: accessibilityLabel || '' });
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID, onClick: onPress }, children);
  };

  return {
    Clipboard: { setString: mocks.clipboardSetString },
    Image: element('img'),
    Modal: ({ visible, children, onRequestClose }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal', onKeyDown: (e) => e.key === 'Escape' && onRequestClose?.() }, children)
      : null,
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles, absoluteFill: {} },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  };
});

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div>{children}</div>,
}));

vi.mock('react-native-svg', () => {
  const SvgMock = ({ children }) => <svg>{children}</svg>;
  return {
    default: SvgMock,
    Path: () => null,
    Rect: () => null,
    Circle: () => null,
    Polyline: () => null,
  };
});

vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/Header', () => ({
  default: ({ onSearch }) => (
    <div>
      <button type="button" onClick={() => onSearch('quijote')}>Buscar libro</button>
      <button type="button" onClick={() => onSearch('   ')}>Buscar vacio</button>
    </div>
  ),
}));
vi.mock('../../components/CarruselAnimado', () => ({
  default: ({ onVerLibro, onVerTodos }) => (
    <div>
      <button type="button" onClick={() => onVerLibro({ id_libro: 99, titulo: 'Libro Carrusel' })}>
        Ver Libro Carrusel
      </button>
      <button type="button" onClick={() => onVerTodos()}>
        Ver Todos Carrusel
      </button>
    </div>
  ),
}));
vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({ darkMode: false }),
  useThemedStyles: (styles) => styles,
  adaptStyleForTheme: (style) => style,
}));
vi.mock('../../services/api', () => ({
  getCuponesDisponibles: mocks.getCuponesDisponibles,
  getOrdenes: mocks.getOrdenes,
  getApiBaseUrl: mocks.getApiBaseUrl,
  getBusquedaAvanzada: mocks.getBusquedaAvanzada,
}));

const mockCupones = [
  {
    id_cupon: 1,
    codigo_cupon: 'GLOBAL10',
    tipo_descuento: 'porcentaje',
    valor_descuento: 10,
    nombre_tienda: null,
    fecha_fin: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
  {
    id_cupon: 2,
    codigo_cupon: 'TIENDA5000',
    tipo_descuento: 'fijo',
    valor_descuento: 5000,
    nombre_tienda: 'Libreria Macondo',
    fecha_fin: new Date(Date.now() + 86400000 * 20).toISOString(),
  },
];

const mockOrders = [
  {
    id_orden: 10,
    estado: 'enviado',
    total: 35000,
    libros: [
      { id_libro: 1, titulo: 'Rayuela', imagen_url: 'http://img.test/rayuela.jpg' },
      { id_libro: 2, titulo: 'Ficciones', imagen_url: '/local/ficciones.jpg' },
    ],
  },
  {
    id_orden: 11,
    estado: 'cancelado',
    total: 20000,
    libros: [{ id_libro: 3, titulo: 'Sin Imagen', imagen_url: null }],
  },
  {
    id_orden: 12,
    estado: 'pagado',
    total: 15000,
    libros: [],
  },
];

describe('PostLogin móvil - cobertura completa', () => {
  const navigation = { navigate: mocks.navigationNavigate };

  const renderComponent = ({ user = { nombre: 'Laura Sofia' }, cartCount = 2 } = {}) => {
    const cart = Array.from({ length: cartCount }, () => ({ cantidad: 1 }));
    return render(
      <AuthContext.Provider value={{ user, signOut: mocks.signOut }}>
        <CartContext.Provider value={{ cart, cartCount, cartItems: cart }}>
          <PostLogin navigation={navigation} />
        </CartContext.Provider>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCuponesDisponibles.mockResolvedValue({ data: mockCupones });
    mocks.getOrdenes.mockResolvedValue({ data: mockOrders });
    mocks.getBusquedaAvanzada.mockResolvedValue({ data: { libros: [] } });
  });

  afterEach(() => {
    cleanup();
  });

  it('saluda al usuario, copia cupones y maneja navegación del carrusel y header', async () => {
    renderComponent({ user: { email: 'usuario@correo.com' }, cartCount: 3 });

    expect(await screen.findByText('usuario 👋')).toBeTruthy();

    fireEvent.click(screen.getByText('Buscar libro'));
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('Catalogo', { q: 'quijote' });

    fireEvent.click(screen.getByText('Buscar vacio'));

    fireEvent.click(screen.getByRole('button', { name: 'Ver Libro Carrusel' }));
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('BookDetail', { book: { id_libro: 99, titulo: 'Libro Carrusel' } });

    fireEvent.click(screen.getByRole('button', { name: 'Ver Todos Carrusel' }));
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('Catalogo', { ordenar_por: 'recientes' });
  });

  it('interactúa con el modal de todos los cupones y sus filtros', async () => {
    renderComponent();

    expect(await screen.findByText('Cupones de Descuento')).toBeTruthy();

    fireEvent.click(screen.getByText('Ver todos'));
    expect(screen.getByText('Todos los cupones')).toBeTruthy();

    // Copy coupon
    fireEvent.click(screen.getAllByText('GLOBAL10')[0]);
    expect(mocks.clipboardSetString).toHaveBeenCalledWith('GLOBAL10');

    // Filter by search
    fireEvent.change(screen.getByPlaceholderText('Buscar por código o tienda'), { target: { value: 'TIENDA' } });
    expect(screen.getAllByText('TIENDA5000').length).toBeGreaterThan(0);

    // Filter by inexistent
    fireEvent.change(screen.getByPlaceholderText('Buscar por código o tienda'), { target: { value: 'INEXISTENTE_CUPON' } });
    expect(screen.getByText('No hay cupones que coincidan.')).toBeTruthy();

    // Clear search
    fireEvent.change(screen.getByPlaceholderText('Buscar por código o tienda'), { target: { value: '' } });

    // Open coupon type dropdown and filter by Globales
    fireEvent.click(screen.getAllByText('⌄')[0]);
    fireEvent.click(screen.getByText('Globales'));
    expect(screen.getAllByText('GLOBAL10').length).toBeGreaterThan(0);

    // Filter by Por tienda
    fireEvent.click(screen.getAllByText('⌄')[0]);
    fireEvent.click(screen.getByText('Por tienda'));
    expect(screen.getAllByText('TIENDA5000').length).toBeGreaterThan(0);

    // Filter by Valor fijo
    fireEvent.click(screen.getAllByText('⌄')[0]);
    fireEvent.click(screen.getByText('Valor fijo'));
    expect(screen.getAllByText('TIENDA5000').length).toBeGreaterThan(0);

    // Filter by Porcentaje
    fireEvent.click(screen.getAllByText('⌄')[0]);
    fireEvent.click(screen.getByText('Porcentaje'));
    expect(screen.getAllByText('GLOBAL10').length).toBeGreaterThan(0);

    // Filter by expiration
    fireEvent.click(screen.getAllByText('⌄')[1]);
    fireEvent.click(screen.getByText('Vencen en 7 días'));
    expect(screen.getAllByText('GLOBAL10').length).toBeGreaterThan(0);

    // Filter by vigentes
    fireEvent.click(screen.getAllByText('⌄')[1]);
    fireEvent.click(screen.getByText('Vigentes'));
    expect(screen.getAllByText('GLOBAL10').length).toBeGreaterThan(0);

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar cupones' }));
    expect(screen.queryByText('Todos los cupones')).toBeNull();
  });

  it('muestra últimas compras con badges, contador de libros y navegación al historial y carrito', async () => {
    renderComponent({ cartCount: 1 });

    expect(await screen.findByText('Tus últimas compras')).toBeTruthy();
    expect(screen.getByText('Rayuela')).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy(); // 2 libros
    expect(screen.getByText('Sin Imagen')).toBeTruthy();
    expect(screen.getByText('Compra')).toBeTruthy(); // 0 libros

    // Navigation on click order
    fireEvent.click(screen.getByText('Rayuela'));
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('History');

    // Navigation on click Ver todas
    fireEvent.click(screen.getByText('Ver todas'));
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('History');

    // FAB button for cart
    const fab = screen.getByText('1');
    fireEvent.click(fab);
    expect(mocks.navigationNavigate).toHaveBeenCalledWith('Cart');
  });

  it('saluda con lector por defecto si user es nulo', async () => {
    renderComponent({ user: null });
    expect(await screen.findByText(/lector 👋/)).toBeTruthy();
  });
});
