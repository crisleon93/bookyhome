// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthHeader from '../../components/AuthHeader';
import BarcodeScanner from '../../components/BarcodeScanner';
import BookDetail from '../../screens/BookDetail';
import BookDetailPublico from '../../screens/BookDetailPublico';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import api, {
  crearSalaChat,
  createReview,
  getApiBaseUrl,
  getBookById,
  getReviewsForBook,
  getVariantes,
} from '../../services/api';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  requestPermission: vi.fn(),
  permission: { granted: true },
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
  push: vi.fn(),
  goBack: vi.fn(),
  get: vi.fn(),
  createReview: vi.fn(),
  crearSalaChat: vi.fn(),
  getBookById: vi.fn(),
  getReviewsForBook: vi.fn(),
  getVariantes: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const createNativeElement = (tag, extraProps = {}) => function NativeElement({
    children,
    onPress,
    onChangeText,
    source,
    style,
    multiline,
    ...props
  }) {
    const elementProps = { ...extraProps };
    if (tag === 'button') {
      elementProps.type = 'button';
      elementProps.disabled = props.disabled;
      elementProps['aria-label'] = props.accessibilityLabel;
      elementProps.onClick = onPress;
    } else if (tag === 'input' || tag === 'textarea') {
      elementProps.placeholder = props.placeholder;
      elementProps.value = props.value;
      elementProps.disabled = props.editable === false;
      elementProps.onChange = (event) => onChangeText?.(event.target.value);
    } else if (tag === 'img') {
      elementProps.src = source?.uri || source;
      elementProps.alt = props.accessibilityLabel || '';
      elementProps.onError = props.onError;
    } else {
      elementProps['data-testid'] = props.testID;
    }

    return ReactModule.createElement(tag, elementProps, children);
  };
  return {
    ActivityIndicator: createNativeElement('span'),
    Alert: { alert: mocks.alert },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Image: createNativeElement('img'),
    Modal: ({ visible, children, onRequestClose }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal', onKeyDown: onRequestClose }, children)
      : null,
    ScrollView: createNativeElement('div'),
    StatusBar: ({ barStyle, backgroundColor, translucent }) => ReactModule.createElement('span', {
      'data-testid': 'status-bar',
      'data-bar-style': barStyle,
      'data-background-color': backgroundColor,
      'data-translucent': String(translucent),
    }),
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => style,
    },
    Text: createNativeElement('span'),
    TextInput: ({ multiline, ...props }) => ReactModule.createElement(
      multiline ? 'textarea' : 'input',
      {
        placeholder: props.placeholder,
        value: props.value,
        disabled: props.editable === false,
        onChange: (event) => props.onChangeText?.(event.target.value),
      },
    ),
    TouchableOpacity: createNativeElement('button'),
    View: createNativeElement('div'),
  };
});

vi.mock('expo-camera', () => ({
  CameraView: ({ onBarcodeScanned, children }) => (
    <div>
      <button type="button" onClick={() => onBarcodeScanned?.({ type: 'ean13', data: '978-0-306-40615-7' })}>
        Simular ISBN válido
      </button>
      <button type="button" onClick={() => onBarcodeScanned?.({ type: 'code128', data: 'no-es-isbn' })}>
        Simular ISBN inválido
      </button>
      {children}
    </div>
  ),
  useCameraPermissions: () => [mocks.permission, mocks.requestPermission],
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));

vi.mock('react-native-svg', () => {
  const Shape = () => null;
  return {
    default: Shape,
    Circle: Shape,
    Path: Shape,
    Polygon: Shape,
    Polyline: Shape,
    Rect: Shape,
  };
});

vi.mock('../../components/Icons', () => {
  const Icon = () => null;
  return { IconCamera: Icon, IconClose: Icon };
});

vi.mock('../../components/Header', () => ({ default: () => null }));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/CarruselAnimado', () => ({ default: () => null }));

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return {
    AuthContext: ReactModule.createContext({ user: null, signOut: mocks.signOut }),
  };
});

vi.mock('../../context/CartContext', async () => {
  const ReactModule = await vi.importActual('react');
  return {
    CartContext: ReactModule.createContext({
      addToCart: mocks.addToCart,
      removeFromCart: mocks.removeFromCart,
    }),
  };
});

vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({ colors: { page: '#fff' } }),
  useThemedStyles: (styles) => styles,
}));

vi.mock('../../services/api', () => ({
  default: { get: mocks.get },
  crearSalaChat: mocks.crearSalaChat,
  createReview: mocks.createReview,
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  getBookById: mocks.getBookById,
  getReviewsForBook: mocks.getReviewsForBook,
  getVariantes: mocks.getVariantes,
}));

const book = {
  id: 21,
  id_libro: 21,
  id_tienda: 8,
  nombre_tienda: 'Librería Central',
  titulo: 'Libro de prueba',
  autor_libro: 'Autora de prueba',
  nombre_categoria: 'Ficción',
  precio_libro: 45000,
  stock: 5,
  descripcion_libro: 'Descripción del libro.',
};

const renderBookDetail = (user = null, selectedBook = book) => render(
  <AuthContext.Provider value={{ user, signOut: mocks.signOut }}>
    <CartContext.Provider value={{ addToCart: mocks.addToCart, removeFromCart: mocks.removeFromCart }}>
      <BookDetail
        route={{ params: { book: selectedBook } }}
        navigation={{ navigate: mocks.navigate, push: mocks.push }}
      />
    </CartContext.Provider>
  </AuthContext.Provider>,
);

const renderPublicBookDetail = (user = null, selectedBook = book) => render(
  <AuthContext.Provider value={{ user, signOut: mocks.signOut }}>
    <CartContext.Provider value={{ addToCart: mocks.addToCart, removeFromCart: mocks.removeFromCart }}>
      <BookDetailPublico
        route={{ params: { book: selectedBook } }}
        navigation={{ navigate: mocks.navigate, push: mocks.push, goBack: mocks.goBack }}
      />
    </CartContext.Provider>
  </AuthContext.Provider>,
);

describe('AuthHeader', () => {
  it('muestra la barra de estado clara y el logo en la cabecera vinotinto', () => {
    vi.stubGlobal('require', vi.fn(() => 'logo.png'));
    render(<AuthHeader />);

    const statusBar = screen.getByTestId('status-bar');
    expect(statusBar.getAttribute('data-bar-style')).toBe('light-content');
    expect(statusBar.getAttribute('data-background-color')).toBe('#7A1E3A');
    expect(statusBar.getAttribute('data-translucent')).toBe('false');
    expect(screen.getByRole('presentation').getAttribute('src')).toMatch(/logo\.png$/);
  });
});

describe('BarcodeScanner', () => {
  beforeEach(() => {
    mocks.permission = { granted: true };
    mocks.requestPermission.mockReset().mockResolvedValue({ granted: true });
    mocks.alert.mockReset();
  });

  it('espera si el estado del permiso de cámara aún no está disponible', () => {
    mocks.permission = null;
    const { container } = render(<BarcodeScanner visible onClose={vi.fn()} onBarcodeDetected={vi.fn()} />);
    expect(container.querySelector('[data-testid="modal"]')).toBeNull();
  });

  it('solicita permiso y permite cancelar cuando el acceso está denegado', () => {
    mocks.permission = { granted: false };
    const onClose = vi.fn();
    render(<BarcodeScanner visible onClose={onClose} onBarcodeDetected={vi.fn()} />);

    fireEvent.click(screen.getByText('Conceder permiso'));
    expect(mocks.requestPermission).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('rechaza códigos no ISBN y permite reintentar después de cerrar la alerta', async () => {
    const onBarcodeDetected = vi.fn();
    render(<BarcodeScanner visible onClose={vi.fn()} onBarcodeDetected={onBarcodeDetected} />);

    fireEvent.click(screen.getByText('Simular ISBN inválido'));
    expect(mocks.alert).toHaveBeenCalledWith(
      'Código no reconocido',
      expect.stringContaining('ISBN válido'),
      [expect.objectContaining({ text: 'OK', onPress: expect.any(Function) })],
    );
    expect(onBarcodeDetected).not.toHaveBeenCalled();

    await act(async () => mocks.alert.mock.calls[0][2][0].onPress());
    fireEvent.click(screen.getByText('Simular ISBN válido'));
    await waitFor(() => expect(onBarcodeDetected).toHaveBeenCalledWith('9780306406157'));
  });

  it('procesa un ISBN válido y cierra el escáner al terminar', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const onBarcodeDetected = vi.fn().mockResolvedValue(undefined);
    render(<BarcodeScanner visible onClose={onClose} onBarcodeDetected={onBarcodeDetected} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Simular ISBN válido'));
      await Promise.resolve();
    });
    expect(onBarcodeDetected).toHaveBeenCalledWith('9780306406157');
    expect(screen.getByText('Procesando...')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('restablece el escáner y notifica si el callback de lectura falla', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onBarcodeDetected = vi.fn().mockRejectedValue(new Error('falló'));
    render(<BarcodeScanner visible onClose={vi.fn()} onBarcodeDetected={onBarcodeDetected} />);

    fireEvent.click(screen.getByText('Simular ISBN válido'));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith(
      'Error',
      expect.stringContaining('procesar el código'),
      [expect.objectContaining({ text: 'OK', onPress: expect.any(Function) })],
    ));
    await act(async () => mocks.alert.mock.calls[0][2][0].onPress());
    expect(screen.getByText('Centra el código de barras aquí')).toBeTruthy();
  });
});

describe('BookDetail', () => {
  beforeEach(() => {
    mocks.addToCart.mockReset().mockResolvedValue(undefined);
    mocks.removeFromCart.mockReset().mockResolvedValue(undefined);
    mocks.alert.mockReset();
    mocks.navigate.mockReset();
    mocks.push.mockReset();
    mocks.getBookById.mockReset().mockResolvedValue({ data: book });
    mocks.getReviewsForBook.mockReset().mockResolvedValue({
      data: { promedio: 4, total: 1, resenas: [{ id_resena: 1, nombre_usuario: 'Lector', calificacion: 4, comentario: 'Muy bueno' }] },
    });
    mocks.getVariantes.mockReset().mockResolvedValue({
      data: [
        { id_variante: 1, tipo_tapa: 'Tapa dura', idioma: 'Espanol', edicion: 'Primera', precio_variante: 50000, stock_variante: 3 },
        { id_variante: 2, tipo_tapa: 'Tapa blanda', idioma: 'Ingles', edicion: 'Segunda', precio_variante: 40000, stock_variante: 0 },
      ],
    });
    mocks.createReview.mockReset().mockResolvedValue({});
    mocks.crearSalaChat.mockReset().mockResolvedValue({ data: { id_sala: 31 } });
  });

  it('carga detalles, variantes y reseñas, y permite elegir una variante', async () => {
    renderBookDetail({ nombre_usuario: 'Lector' });

    expect(screen.getByText('Libro de prueba')).toBeTruthy();
    expect(await screen.findByText('Muy bueno')).toBeTruthy();
    expect(mocks.getVariantes).toHaveBeenCalledWith(21);
    expect(mocks.getReviewsForBook).toHaveBeenCalledWith(21);
    expect(screen.getByText('Tapa dura · Primera')).toBeTruthy();
    fireEvent.click(screen.getByText('Tapa blanda · Ingles · Segunda'));
    expect(screen.getByText('Tapa blanda · Ingles · Segunda')).toBeTruthy();
  });

  it('requiere iniciar sesión para agregar al carrito y contactar al vendedor', () => {
    renderBookDetail();

    fireEvent.click(screen.getByText('Agregar al Carrito'));
    expect(mocks.alert).toHaveBeenCalledWith('Inicia sesión', expect.stringContaining('agregar al carrito'));
    fireEvent.click(screen.getByText('Contactar vendedor'));
    expect(mocks.alert).toHaveBeenCalledWith('Inicia sesión', expect.stringContaining('contactar al vendedor'));
  });

  it('agrega una variante al carrito y deja abrir el carrito desde el diálogo', async () => {
    renderBookDetail({ nombre_usuario: 'Lector' });
    fireEvent.click(await screen.findByText('Agregar al Carrito'));

    await waitFor(() => expect(mocks.addToCart).toHaveBeenCalledWith(expect.objectContaining({
      id_libro: 21,
      precio_libro: 50000,
      id_variante: 1,
      variante_label: 'Tapa dura · Espanol · Primera',
    })));
    fireEvent.click(screen.getByText('VER CARRITO'));
    expect(mocks.navigate).toHaveBeenCalledWith('Cart');
  });

  it('publica una reseña y recarga las reseñas del libro', async () => {
    renderBookDetail({ nombre_usuario: 'Lector' });
    fireEvent.change(screen.getByPlaceholderText('Escribe tu reseña...'), {
      target: { value: 'Excelente lectura' },
    });
    fireEvent.click(screen.getByText('Enviar reseña'));

    await waitFor(() => expect(mocks.createReview).toHaveBeenCalledWith({
      id_libro: 21,
      calificacion: 5,
      comentario: 'Excelente lectura',
    }));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Éxito', 'Reseña creada correctamente'));
    expect(mocks.getReviewsForBook).toHaveBeenCalledTimes(2);
  });

  it('abre el chat del vendedor para una cuenta autenticada', async () => {
    renderBookDetail({ nombre_usuario: 'Lector' });
    fireEvent.click(screen.getByText('Contactar vendedor'));

    await waitFor(() => expect(mocks.crearSalaChat).toHaveBeenCalledWith(8));
    expect(mocks.navigate).toHaveBeenCalledWith('Chat', {
      id_sala: 31,
      nombre_tienda: 'Librería Central',
    });
  });
});

describe('BookDetailPublico', () => {
  beforeEach(() => {
    mocks.addToCart.mockReset().mockResolvedValue(undefined);
    mocks.removeFromCart.mockReset().mockResolvedValue(undefined);
    mocks.alert.mockReset();
    mocks.navigate.mockReset();
    mocks.push.mockReset();
    mocks.goBack.mockReset();
    mocks.getBookById.mockReset().mockResolvedValue({ data: { descripcion_libro: 'Detalles completos.' } });
    mocks.getVariantes.mockReset().mockResolvedValue({
      data: [
        { id_variante: 1, tipo_variante: 'Tapa dura', tipo_tapa: 'Tapa dura', idioma: 'Español', edicion: 'Primera', precio_variante: 52000, stock_variante: 4 },
        { id_variante: 2, tipo_variante: 'Tapa blanda', tipo_tapa: 'Tapa blanda', precio_variante: 43000, stock_variante: 2 },
      ],
    });
    mocks.crearSalaChat.mockReset().mockResolvedValue({ data: { id_sala: 52 } });
    mocks.get.mockReset().mockImplementation((url) => {
      if (url.startsWith('/resenas/libro/')) {
        return Promise.resolve({ data: { promedio: 4.5, resenas: [] } });
      }
      if (url === '/catalogo/busqueda-avanzada') {
        return Promise.resolve({ data: { libros: [{ id_libro: 99, titulo: 'Relacionado' }] } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('muestra la ficha pública, completa sus datos y deja regresar al catálogo', async () => {
    renderPublicBookDetail();

    expect(screen.getByText('Libro de prueba')).toBeTruthy();
    expect(screen.getAllByText('Ficción').length).toBeGreaterThan(0);
    expect(await screen.findByText('Detalles completos.')).toBeTruthy();
    expect(screen.getByText('Preguntas frecuentes')).toBeTruthy();
    expect(mocks.getBookById).toHaveBeenCalledWith(21);
    expect(mocks.getVariantes).toHaveBeenCalledWith(21);

    fireEvent.click(screen.getByText('← Volver al catálogo'));
    expect(mocks.goBack).toHaveBeenCalledOnce();
  });

  it('redirige al inicio de sesión si un visitante intenta comprar o contactar', () => {
    renderPublicBookDetail();

    fireEvent.click(screen.getByText('Comprar ahora'));
    expect(mocks.navigate).toHaveBeenCalledWith('Login');
    fireEvent.click(screen.getByText('Contactar librería'));
    expect(mocks.navigate).toHaveBeenCalledWith('Login');
  });

  it('agrega al carrito con la variante elegida y navega a Cart al comprar', async () => {
    renderPublicBookDetail({ id_usuario: 3 });
    fireEvent.click(await screen.findByText('Tapa blanda'));
    fireEvent.click(screen.getByText('Comprar ahora'));

    await waitFor(() => expect(mocks.addToCart).toHaveBeenCalledWith(expect.objectContaining({
      id_libro: 21,
      id_variante: 2,
      precio_libro: 43000,
      variante_label: 'Tapa blanda',
    })));
    expect(mocks.navigate).toHaveBeenCalledWith('Cart');
  });

  it('muestra reseñas y permite filtrar por puntuación', async () => {
    mocks.get.mockImplementation((url) => url.startsWith('/resenas/libro/')
      ? Promise.resolve({
        data: {
          promedio: 4,
          resenas: [
            { id_resena: 1, nombre_usuario: 'Ana', calificacion: 5, comentario: 'Excelente', fecha_resena: '2026-01-01' },
            { id_resena: 2, nombre_usuario: 'Luis', calificacion: 2, comentario: 'Regular', fecha_resena: '2026-01-02' },
          ],
        },
      })
      : Promise.resolve({ data: { libros: [] } }));
    renderPublicBookDetail(null, { ...book, nombre_categoria: undefined });

    expect(await screen.findByText('Excelente')).toBeTruthy();
    fireEvent.click(screen.getByText('5 ★'));
    expect(screen.getByText('Excelente')).toBeTruthy();
    expect(screen.queryByText('Regular')).toBeNull();
  });

  it('informa si el libro no tiene tienda para contactar', async () => {
    renderPublicBookDetail({ id_usuario: 3 }, { ...book, id_tienda: null });
    fireEvent.click(await screen.findByText('Contactar librería'));

    expect(mocks.alert).toHaveBeenCalledWith('Contacto', 'No se pudo identificar la librería de este libro.');
    expect(mocks.crearSalaChat).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
