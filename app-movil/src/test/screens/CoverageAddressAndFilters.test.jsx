// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Direcciones from '../../screens/Direcciones';
import FiltrosBusqueda from '../../components/FiltrosBusqueda';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  mapWindow: null,
  platformOS: 'ios',
  getDirecciones: vi.fn(),
  createDireccion: vi.fn(),
  deleteDireccion: vi.fn(),
  setPrincipalDireccion: vi.fn(),
  updateDireccion: vi.fn(),
  apiGet: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  fetch: vi.fn(),
  setMapLocation: vi.fn(),
  injectJavaScript: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    disabled,
    value,
    placeholder,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        role: accessibilityRole || 'button',
        'aria-label': accessibilityLabel,
        'aria-checked': accessibilityState?.checked,
      }, children);
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        disabled,
        onChange: (event) => onChangeText?.(event.target.value),
      });
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  const FlatList = ({
    data = [],
    renderItem,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    onRefresh,
  }) => ReactModule.createElement('div', { 'data-testid': 'flat-list' },
    ListHeaderComponent,
    data.length
      ? data.map((item, index) => ReactModule.createElement(
        ReactModule.Fragment,
        { key: item?.id_direccion || index },
        renderItem({ item, index }),
      ))
      : ListEmptyComponent,
    ListFooterComponent,
    onRefresh && ReactModule.createElement('button', { type: 'button', onClick: onRefresh }, 'Actualizar lista'),
  );
  return {
    ActivityIndicator: element('span'),
    Alert: { alert: mocks.alert },
    FlatList,
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children)
      : null,
    Platform: { get OS() { return mocks.platformOS }, select: (values) => values[mocks.platformOS] || values.default },
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles, flatten: (style) => style },
    Switch: ({ value, onValueChange, disabled }) => ReactModule.createElement('button', {
      type: 'button',
      role: 'switch',
      'aria-checked': value,
      disabled,
      onClick: () => onValueChange?.(!value),
    }),
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  };
});

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

vi.mock('../../context/ThemeContext', () => ({ useThemedStyles: (styles) => styles }));
vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/Icons', () => ({ IconLocation: () => null }));

vi.mock('../../components/AddressMapFrame.web.jsx', async () => {
  const ReactModule = await vi.importActual('react');
  const AddressMapFrame = ReactModule.forwardRef(({ html, onMessage, onError }, ref) => {
    const contentWindow = { setMapLocation: mocks.setMapLocation };
    ReactModule.useImperativeHandle(ref, () => ({
      contentWindow,
      injectJavaScript: mocks.injectJavaScript,
    }));
    mocks.mapWindow = contentWindow;
    return ReactModule.createElement('div', { 'data-testid': 'map-frame', 'data-html': html },
      ReactModule.createElement('button', {
        type: 'button',
        onClick: () => onMessage({ data: JSON.stringify({ lat: 4.711, lng: -74.0721 }) }),
      }, 'Seleccionar punto en mapa'),
      ReactModule.createElement('button', {
        type: 'button',
        onClick: () => onMessage({ data: 'no es json' }),
      }, 'Punto sin formato'),
      ReactModule.createElement('button', {
        type: 'button',
        onClick: () => onMessage({ data: JSON.stringify({ lat: 'inválida', lng: 1 }) }),
      }, 'Punto sin coordenadas'),
      ReactModule.createElement('button', { type: 'button', onClick: onError }, 'Error del mapa'),
    );
  });
  return { default: AddressMapFrame };
});

vi.mock('expo-location', () => ({
  Accuracy: { High: 6 },
  requestForegroundPermissionsAsync: mocks.requestForegroundPermissionsAsync,
  getCurrentPositionAsync: mocks.getCurrentPositionAsync,
}));

vi.mock('../../services/api', () => ({
  createDireccion: mocks.createDireccion,
  deleteDireccion: mocks.deleteDireccion,
  getDirecciones: mocks.getDirecciones,
  setPrincipalDireccion: mocks.setPrincipalDireccion,
  updateDireccion: mocks.updateDireccion,
  default: { get: mocks.apiGet },
}));

const savedAddresses = [
  {
    id_direccion: 1,
    alias_direccion: 'Casa',
    direccion: 'Calle 10 #20-30',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    codigo_postal: '110111',
    es_principal: true,
  },
  {
    id_direccion: 2,
    alias_direccion: 'Oficina',
    direccion: 'Carrera 5 #10-20',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    codigo_postal: '',
    es_principal: false,
  },
];

const filterData = {
  categorias: [{ id_categoria: 3, nombre_categoria: 'Historia', cantidad_libros: 18 }],
  precio_min: 1000,
  precio_max: 200000,
  opciones_ordenamiento: [
    { value: 'relevancia', label: 'Relevancia' },
    { value: 'precio_asc', label: 'Precio: menor a mayor' },
  ],
};

const reverseAddress = {
  address: {
    road: 'Carrera 7',
    house_number: '45-67',
    neighbourhood: 'Chapinero',
    suburb: 'Chapinero',
    city: 'Bogotá',
    state: 'Cundinamarca',
    postcode: '110231',
  },
  display_name: 'Carrera 7 45-67, Bogotá',
};

function renderAddresses() {
  return render(<Direcciones />);
}

describe('Direcciones y FiltrosBusqueda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.platformOS = 'ios';
    mocks.getDirecciones.mockResolvedValue({ data: savedAddresses });
    mocks.createDireccion.mockResolvedValue({ data: { id_direccion: 3 } });
    mocks.deleteDireccion.mockResolvedValue({ data: { ok: true } });
    mocks.setPrincipalDireccion.mockResolvedValue({ data: { ok: true } });
    mocks.updateDireccion.mockResolvedValue({ data: { ok: true } });
    mocks.apiGet.mockResolvedValue({ data: filterData });
    mocks.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mocks.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 4.71, longitude: -74.07 } });
    mocks.fetch.mockImplementation(async (url) => ({
      ok: true,
      json: async () => url.includes('/reverse')
        ? reverseAddress
        : [{ ...reverseAddress, lat: '4.711', lon: '-74.0721' }],
    }));
    vi.stubGlobal('fetch', mocks.fetch);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('carga direcciones, permite marcar principal, editar y eliminar', async () => {
    renderAddresses();
    expect(await screen.findByText('Casa')).toBeTruthy();
    expect(screen.getByText('CP: 110111')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Hacer principal' }));
    await waitFor(() => expect(mocks.setPrincipalDireccion).toHaveBeenCalledWith(2));

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    fireEvent.change(screen.getByPlaceholderText('Calle, número, barrio...'), {
      target: { value: '  Carrera 9   # 10-20  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar dirección' }));
    await waitFor(() => expect(mocks.updateDireccion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ direccion: 'Carrera 9   # 10-20' }),
    ));

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);
    const deleteAction = mocks.alert.mock.calls.at(-1)[2]
      .find((button) => button.text === 'Eliminar');
    await act(async () => deleteAction.onPress());
    expect(mocks.deleteDireccion).toHaveBeenCalledWith(1);
  });

  it('valida una dirección vacía y completa una nueva desde el mapa', async () => {
    renderAddresses();
    await screen.findByText('Casa');
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar dirección' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
    expect(mocks.alert).toHaveBeenCalledWith('Dirección requerida', 'Ingresa la dirección de envío.');

    fireEvent.change(screen.getByPlaceholderText('Calle, número, barrio...'), {
      target: { value: 'Calle 1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ej. Casa, Oficina'), {
      target: { value: '  Casa nueva  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Elegir en mapa' }));
    fireEvent.change(screen.getByPlaceholderText('Ej. Carrera 7 # 45-67, Bogotá'), {
      target: { value: 'Carrera 7 #45-67' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith(expect.stringContaining('/search?')));
    await waitFor(() => expect(mocks.injectJavaScript).toHaveBeenCalledWith(
      'window.setMapLocation(4.711,-74.0721); true;',
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Usar esta dirección' }));
    expect(screen.getByPlaceholderText('Calle, número, barrio...').value).toBe('Carrera 7 45-67 Chapinero');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
    await waitFor(() => expect(mocks.createDireccion).toHaveBeenCalledWith(
      expect.objectContaining({
        alias_direccion: 'Casa nueva',
        direccion: 'Carrera 7 45-67 Chapinero',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        codigo_postal: '110231',
      }),
    ));
  });

  it('muestra errores de geolocalización y valida puntos seleccionados', async () => {
    renderAddresses();
    await screen.findByText('Casa');
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar dirección' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elegir en mapa' }));

    mocks.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación actual' }));
    expect(await screen.findByText('Permite el acceso a tu ubicación para poder usar esta opción.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar punto en mapa' }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith(expect.stringContaining('/reverse?')));
    fireEvent.click(screen.getByRole('button', { name: 'Error del mapa' }));
    expect(await screen.findByText('No se pudo cargar el mapa. Comprueba tu conexión e inténtalo de nuevo.')).toBeTruthy();
  });

  it('busca ubicaciones actuales y muestra resultados vacíos del geocodificador', async () => {
    renderAddresses();
    await screen.findByText('Casa');
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar dirección' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elegir en mapa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Escribe una dirección para buscarla en el mapa.')).toBeTruthy();

    mocks.fetch.mockImplementationOnce(async () => ({ ok: true, json: async () => [] }));
    fireEvent.change(screen.getByPlaceholderText('Ej. Carrera 7 # 45-67, Bogotá'), {
      target: { value: 'Calle inexistente' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('No se encontró la dirección. Prueba con una referencia más específica.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación actual' }));
    await waitFor(() => expect(mocks.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: 6 }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith(expect.stringContaining('/reverse?')));
    fireEvent.click(screen.getByRole('button', { name: 'Usar esta dirección' }));
    expect(screen.getByPlaceholderText('Calle, número, barrio...').value).toContain('Carrera 7');
  });

  it('valida puntos del mapa web, búsquedas sin coordenadas y eventos de otra ventana', async () => {
    mocks.platformOS = 'web';
    renderAddresses();
    await screen.findByText('Casa');
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar dirección' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elegir en mapa' }));
    fireEvent.change(screen.getByPlaceholderText('Ej. Carrera 7 # 45-67, Bogotá'), {
      target: { value: 'Calle 5' },
    });

    mocks.fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ lat: 'invalid', lon: 'invalid', address: {} }] });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('La ubicación no tiene coordenadas válidas.')).toBeTruthy();

    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ ...reverseAddress, lat: '4.711', lon: '-74.0721' }],
    });
    fireEvent.change(screen.getByPlaceholderText('Ej. Carrera 7 # 45-67, Bogotá'), {
      target: { value: 'Carrera 7' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ciudad'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByPlaceholderText('Departamento'), { target: { value: 'Cundinamarca' } });
    fireEvent.change(screen.getByPlaceholderText('Código postal'), { target: { value: '110111' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(mocks.setMapLocation).toHaveBeenCalledWith(4.711, -74.0721));

    fireEvent.click(screen.getByRole('button', { name: 'Punto sin formato' }));
    expect(await screen.findByText('No se pudo leer el punto seleccionado en el mapa.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Punto sin coordenadas' }));
    expect(await screen.findByText('El punto seleccionado no tiene coordenadas válidas.')).toBeTruthy();

    const externalMessage = new Event('message');
    Object.assign(externalMessage, {
      origin: 'https://untrusted.example',
      source: mocks.mapWindow,
      data: JSON.stringify({ lat: 1, lng: 1 }),
    });
    window.dispatchEvent(externalMessage);
    const wrongSourceMessage = new Event('message');
    Object.assign(wrongSourceMessage, {
      origin: 'null',
      source: {},
      data: JSON.stringify({ lat: 1, lng: 1 }),
    });
    window.dispatchEvent(wrongSourceMessage);
    expect(mocks.fetch).toHaveBeenCalledTimes(2);

    const validMessage = new Event('message');
    Object.assign(validMessage, {
      origin: 'null',
      source: mocks.mapWindow,
      data: JSON.stringify({ lat: 4.712, lng: -74.073 }),
    });
    window.dispatchEvent(validMessage);
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith(expect.stringContaining('lat=4.712&lon=-74.073')));
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[1]);
    expect(screen.queryByText('Elegir dirección')).toBeNull();
  });

  it('muestra errores al cargar, guardar, actualizar, marcar y eliminar direcciones', async () => {
    mocks.getDirecciones.mockRejectedValueOnce({
      response: { data: { detail: 'Lista no disponible' } },
    });
    renderAddresses();
    expect(await screen.findByText('Mis direcciones de envío')).toBeTruthy();
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Direcciones', 'Lista no disponible'));
    fireEvent.click(await screen.findByText('Actualizar lista'));
    await screen.findByText('Casa');

    mocks.createDireccion.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar dirección' }));
    fireEvent.change(screen.getByPlaceholderText('Calle, número, barrio...'), {
      target: { value: 'Calle 1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('No se pudo guardar', 'Inténtalo nuevamente.'));

    mocks.updateDireccion.mockRejectedValueOnce({
      response: { data: { detail: 'No se pudo editar' } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar dirección' }));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('No se pudo guardar', 'No se pudo editar'));

    mocks.setPrincipalDireccion.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hacer principal' }));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('No se pudo actualizar', 'Inténtalo nuevamente.'));

    mocks.deleteDireccion.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);
    const deleteAction = mocks.alert.mock.calls.at(-1)[2]
      .find((button) => button.text === 'Eliminar');
    await act(async () => deleteAction.onPress());
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('No se pudo eliminar', 'Inténtalo nuevamente.'));
  });

  it('filtra libros por categoría, precio y atributos, y aplica la selección', async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<FiltrosBusqueda visible onApply={onApply} onClose={onClose} />);

    expect(await screen.findByPlaceholderText('Título, autor o ISBN...')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Título, autor o ISBN...'), {
      target: { value: 'historia' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Todas las categorías' }));
    fireEvent.click(screen.getByRole('button', { name: /Historia/ }));
    fireEvent.click(screen.getByRole('button', { name: '$30k–$70k' }));
    fireEvent.click(screen.getByRole('button', { name: '4★+' }));
    fireEvent.click(screen.getByRole('switch', { name: /Solo en stock/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Precio: menor a mayor' }));
    fireEvent.click(screen.getByRole('button', { name: /Ver resultados/ }));

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
      busqueda: 'historia',
      categoria_id: 3,
      precio_min: 30000,
      precio_max: 70000,
      calificacion_min: 4,
      disponible: false,
      ordenar_por: 'precio_asc',
    }), 'libros');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cambia a búsqueda de librerías, limpia los criterios y no carga datos si está cerrado', async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(<FiltrosBusqueda visible={false} onApply={onApply} onClose={onClose} />);
    expect(mocks.apiGet).not.toHaveBeenCalled();

    rerender(<FiltrosBusqueda visible onApply={onApply} onClose={onClose} />);
    await screen.findByText('Filtrar búsqueda');
    fireEvent.click(screen.getByRole('button', { name: 'Librerías' }));
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre de tienda...'), {
      target: { value: 'Librería Central' },
    });
    fireEvent.change(screen.getByPlaceholderText('contacto@libreria.com'), {
      target: { value: 'ventas@central.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver resultados' }));

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
      nombre_tienda: '',
      correo_vendedor: '',
      precio_max: 200000,
      ordenar_por: 'relevancia',
    }), 'librerias');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
