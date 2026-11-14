// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../../screens/Home';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  getCatalogoStats: vi.fn(),
  getTiendasDestacadas: vi.fn(),
  navigate: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeElement({
    children,
    onPress,
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
    if (tag === 'img') {
      return ReactModule.createElement('img', {
        src: source?.uri || source,
        alt: accessibilityLabel || '',
        onError: props.onError,
      });
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  return {
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Image: nativeElement('img'),
    ImageBackground: ({ children }) => ReactModule.createElement('div', null, children),
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (styles) => styles },
    Text: nativeElement('span'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div data-testid="safe-area">{children}</div>,
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div>{children}</div>,
}));

vi.mock('react-native-svg', () => {
  const Shape = () => null;
  return { default: Shape, Circle: Shape, Path: Shape };
});

vi.mock('../../components/Header', () => ({ default: () => <div>Public mobile header</div> }));
vi.mock('../../components/Footer', () => ({ default: () => <div>Mobile footer</div> }));
vi.mock('../../components/Icons', () => ({
  IconBook: () => null,
  IconShield: () => null,
  IconTruck: () => null,
}));
vi.mock('../../components/CarruselAnimado', () => ({
  default: ({ titulo, libros, loading, onVerLibro, onVerTodos }) => (
    <section>
      <h2>{titulo}</h2>
      <span>{loading ? 'Cargando carrusel' : `${libros.length} libros`}</span>
      <button onClick={() => onVerLibro({ titulo: 'Libro destacado' })}>Abrir {titulo}</button>
      <button onClick={onVerTodos}>Ver todos {titulo}</button>
    </section>
  ),
}));
vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet },
  getApiBaseUrl: mocks.getApiBaseUrl,
  getCatalogoStats: mocks.getCatalogoStats,
  getTiendasDestacadas: mocks.getTiendasDestacadas,
}));

const bookstore = {
  id_tienda: 8,
  nombre_tienda: 'Librería Central',
  ciudad_origen: '',
  direccion: 'Calle 10, Medellín',
  descripcion: 'Libros para todos',
  logo_url: 'logos/central.png',
  total_libros: 1,
  calificacion_promedio: 4.5,
};

function renderHome() {
  const navigation = { navigate: mocks.navigate };
  return render(<Home navigation={navigation} />);
}

describe('Home móvil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getApiBaseUrl.mockReturnValue('https://api.example.test');
    mocks.getCatalogoStats.mockResolvedValue({
      data: {
        libros_disponibles: 1250,
        librerias_asociadas: 14,
        usuarios_activos: 320,
        calificacion_promedio: 4.7,
      },
    });
    mocks.getTiendasDestacadas.mockResolvedValue({ data: [bookstore] });
    mocks.apiGet.mockResolvedValue({ data: { libros: [{ id_libro: 1, titulo: 'Libro de prueba' }] } });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('muestra la portada, sus carruseles, librerías y permite navegar', async () => {
    renderHome();

    expect(await screen.findByText('El marketplace que conecta lectores con librerías')).toBeTruthy();
    expect(screen.getByText('+1.250')).toBeTruthy();
    expect(screen.getByText(/Librerías en BookyHome/)).toBeTruthy();
    expect(screen.getAllByText(/Medellín/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Libros para todos').length).toBeGreaterThan(0);
    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledTimes(4));

    fireEvent.click(screen.getByRole('button', { name: 'Comenzar a comprar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vender libros' }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar mi librería' }));
    fireEvent.click(screen.getByRole('button', { name: /Historia/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver catálogo completo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Recién llegados' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas →' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Librería Central/ })[0]);

    expect(mocks.navigate).toHaveBeenCalledWith('Register');
    expect(mocks.navigate).toHaveBeenCalledWith('RegisterLibrary');
    expect(mocks.navigate).toHaveBeenCalledWith('CatalogoPublico', { categoria: 'Historia' });
    expect(mocks.navigate).toHaveBeenCalledWith('CatalogoPublico', {});
    expect(mocks.navigate).toHaveBeenCalledWith('CatalogoPublico', { q: 'Libro destacado' });
    expect(mocks.navigate).toHaveBeenCalledWith('Librerias');
    expect(mocks.navigate).toHaveBeenCalledWith('PerfilTienda', { id_tienda: 8 });
  });

  it('navega el carrusel principal y usa respaldo cuando fallan las cargas', async () => {
    mocks.getCatalogoStats.mockRejectedValue(new Error('stats offline'));
    mocks.getTiendasDestacadas.mockRejectedValue(new Error('stores offline'));
    mocks.apiGet.mockRejectedValue(new Error('books offline'));
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderHome();

    expect(await screen.findByText('El marketplace que conecta lectores con librerías')).toBeTruthy();
    expect(screen.getAllByText('...')).toHaveLength(4);
    await waitFor(() => expect(consoleWarn).toHaveBeenCalled());
    expect(screen.queryByText('Librerías en BookyHome')).toBeNull();

    fireEvent.click(screen.getByText('›').closest('button'));
    expect(screen.getByText('Ver catálogo completo')).toBeTruthy();
    fireEvent.click(screen.getByText('Vender libros'));
    expect(mocks.navigate).toHaveBeenCalledWith('RegisterLibrary');
  });
});
