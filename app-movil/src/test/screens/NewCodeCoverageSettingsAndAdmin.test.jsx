// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConfiguracionTienda from '../../screens/ConfiguracionTienda';
import QuejasReclamos from '../../screens/QuejasReclamos';
import SidebarAdmin from '../../components/SidebarAdmin';
import { AuthContext } from '../../context/AuthContext';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  getConfigLibreria: vi.fn(),
  getLibreria: vi.fn(),
  updateConfigLibreria: vi.fn(),
  updateMiTienda: vi.fn(),
  setDarkMode: vi.fn(),
  getOrdenes: vi.fn(),
  getQuejas: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  panHandlers: null,
  getProfile: vi.fn(),
  close: vi.fn(),
  signOut: vi.fn(),
  selectDashboard: vi.fn(),
  selectSection: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    disabled,
    value,
    placeholder,
    source,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        'aria-checked': accessibilityState?.checked,
        'aria-selected': accessibilityState?.selected,
        role: accessibilityRole || 'button',
      }, children);
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        value: value ?? '',
        placeholder,
        disabled,
        'aria-label': accessibilityLabel,
        onChange: (event) => onChangeText?.(event.target.value),
      });
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', { src: source?.uri || source });
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  class AnimatedValue {
    constructor(value) {
      this._value = value;
    }
    setValue(value) {
      this._value = value;
    }
  }
  const animation = (value, { toValue }) => ({
    start: () => { value._value = toValue; },
  });
  return {
    ActivityIndicator: nativeElement('span'),
    Alert: { alert: mocks.alert },
    Animated: {
      Value: AnimatedValue,
      View: nativeElement('div'),
      timing: animation,
      spring: animation,
      parallel: (items) => ({
        start: () => items.forEach((item) => item.start()),
      }),
    },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Image: nativeElement('img'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' }, children)
      : null,
    PanResponder: {
      create: (handlers) => {
        mocks.panHandlers = handlers;
        return { panHandlers: {} };
      },
    },
    Platform: { OS: 'web' },
    Pressable: nativeElement('button'),
    ScrollView: nativeElement('div'),
    StyleSheet: {
      absoluteFill: {},
      absoluteFillObject: {},
      create: (styles) => styles,
    },
    Switch: ({ value, onValueChange, accessibilityLabel }) => ReactModule.createElement('button', {
      type: 'button',
      role: 'switch',
      'aria-label': accessibilityLabel,
      'aria-checked': value,
      onClick: () => onValueChange?.(!value),
    }),
    Text: nativeElement('span'),
    TextInput: nativeElement('input'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div data-testid="gradient">{children}</div>,
}));
vi.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'images' },
  requestMediaLibraryPermissionsAsync: mocks.requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync: mocks.launchImageLibraryAsync,
}));
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({ user: null, signOut: vi.fn() }) };
});
vi.mock('../../context/ThemeContext', () => ({
  createThemeAwareComponent: (Component) => Component,
  useAppTheme: () => ({
    darkMode: false,
    setDarkMode: mocks.setDarkMode,
    colors: { page: '#F9F6F1' },
  }),
  useThemedStyles: (styles) => styles,
}));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible, onClose, onSignOut }) => visible ? (
    <nav>
      <button onClick={onClose}>Cerrar menú vendedor</button>
      <button onClick={onSignOut}>Salir vendedor</button>
    </nav>
  ) : null,
}));
vi.mock('../../components/RoleBasedSidebar', () => ({
  default: ({ visible, onClose, onSignOut }) => visible ? (
    <nav>
      <button onClick={onClose}>Cerrar menú de rol</button>
      <button onClick={onSignOut}>Salir de rol</button>
    </nav>
  ) : null,
}));
vi.mock('../../components/Icons', () => {
  const Icon = () => null;
  return {
    IconAlertTriangle: Icon,
    IconBook: Icon,
    IconCheck: Icon,
    IconChevronRight: Icon,
    IconClose: Icon,
    IconLayoutDashboard: Icon,
    IconLogout: Icon,
    IconMessage: Icon,
    IconPackage: Icon,
    IconSettings: Icon,
    IconStore: Icon,
    IconStoreAlt: Icon,
    IconTool: Icon,
    IconTrendingUp: Icon,
    IconUser: Icon,
    IconWallet: Icon,
    IconEye: Icon,
  };
});
vi.mock('../../services/api', () => ({
  getConfigLibreria: mocks.getConfigLibreria,
  getLibreria: mocks.getLibreria,
  updateConfigLibreria: mocks.updateConfigLibreria,
  updateMiTienda: mocks.updateMiTienda,
  getOrdenes: mocks.getOrdenes,
  getQuejas: mocks.getQuejas,
  getApiBaseUrl: mocks.getApiBaseUrl,
  getProfile: mocks.getProfile,
}));

const storeConfig = {
  descripcion: 'Libros para todos',
  ciudad_origen: 'Bogotá',
  email_publico: 'tienda@example.test',
  horario_atencion: 'Lun-Vie',
  tiempo_despacho_dias: 3,
  tarifa_envio: 5000,
  politica_envios: 'Envíos nacionales',
  politica_devoluciones: 'Cambios en 30 días',
};
const storeIdentity = {
  nombre_tienda: 'Librería Central',
  direccion: 'Calle 10',
  telefono: '3001234567',
};

const renderStoreSettings = () => render(
  <AuthContext.Provider value={{ user: { rol: 'vendedor' }, signOut: mocks.signOut }}>
    <ConfiguracionTienda navigation={{ navigate: vi.fn() }} />
  </AuthContext.Provider>,
);

const complaints = [
  {
    id_solicitud: 20,
    id_orden: 10,
    estado: 'Abierto',
    asunto: 'Libro dañado',
    descripcion: 'Portada rota',
    fecha_solicitud: '2026-11-10T10:00:00',
    nombre_tienda: 'Librería',
    evidencia_url: '/evidencia.jpg',
    respuesta: 'Estamos revisando',
  },
  { id_solicitud: 21, estado: 'En revision', asunto: 'Demora', fecha_creacion: '2026-11-09' },
  { id_solicitud: 22, estado: 'Resuelto', asunto: 'Resuelto' },
  { id_solicitud: 23, estado: 'Rechazado', asunto: 'Rechazado' },
  { id_solicitud: 24, estado: 'Cerrado', asunto: 'Cerrado' },
  { id_solicitud: 25, estado: 'Estado especial', asunto: 'Otro' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.panHandlers = null;
  mocks.getConfigLibreria.mockResolvedValue({ data: storeConfig });
  mocks.getLibreria.mockResolvedValue({ data: storeIdentity });
  mocks.updateConfigLibreria.mockResolvedValue({});
  mocks.updateMiTienda.mockResolvedValue({});
  mocks.setDarkMode.mockResolvedValue(undefined);
  mocks.getOrdenes.mockResolvedValue({
    data: [    { id_orden: 99, estado: 'pagado', total: 25000, items: [{ titulo: 'Libro', nombre_tienda: 'Tienda' }] }],
  });
  mocks.getQuejas.mockResolvedValue({ data: complaints });
  mocks.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
  mocks.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('settings and admin coverage behaviors', () => {
  it('validates store settings, saves normalized data, and reports load/theme/save failures', async () => {
    renderStoreSettings();
    await screen.findByPlaceholderText('Ej: Librería El Quijote');

    fireEvent.change(screen.getByPlaceholderText('Ej: Librería El Quijote'), { target: { value: '  ' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    expect(mocks.alert).toHaveBeenLastCalledWith('Falta información', 'El nombre de la tienda es obligatorio.');
    expect(mocks.updateMiTienda).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Ej: Librería El Quijote'), { target: { value: 'AB' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    expect(mocks.alert).toHaveBeenLastCalledWith('Nombre inválido', 'El nombre de la tienda debe tener al menos 3 caracteres.');
    expect(mocks.updateMiTienda).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Ej: Librería El Quijote'), { target: { value: '  Librería Norte  ' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '0' } });
    fireEvent.change(screen.getByPlaceholderText('2'), { target: { value: 'días' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => {
      expect(mocks.updateMiTienda).toHaveBeenCalledWith(
        expect.objectContaining({ nombre_tienda: 'Librería Norte' }),
      );
      expect(mocks.alert).toHaveBeenCalledWith('Éxito', expect.any(String));
    });
    expect(mocks.updateConfigLibreria).toHaveBeenCalledWith(expect.objectContaining({
      tiempo_despacho_dias: 2,
      tarifa_envio: 0,
    }));

    mocks.setDarkMode.mockRejectedValueOnce(new Error('storage'));
    fireEvent.click(screen.getByRole('switch', { name: 'Activar modo oscuro' }));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith(
      'Error', 'No se pudo guardar la preferencia del tema.',
    ));

    mocks.updateConfigLibreria.mockRejectedValueOnce({
      response: { data: { detail: 'No se guardó' } },
    });
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se guardó'));
  });

  it('prevents saving partial settings when either store request fails', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.getConfigLibreria.mockRejectedValueOnce(new Error('config unavailable'));
    mocks.getLibreria.mockRejectedValueOnce(new Error('store unavailable'));
    renderStoreSettings();

    expect(await screen.findByText(/No se pudo cargar toda la configuración/)).toBeTruthy();
    const saveButton = screen.getByText('Guardar cambios').closest('button');
    expect(saveButton.disabled).toBe(true);
    expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo cargar la configuración de tu tienda.');
    expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo cargar la identidad de tu tienda.');
    expect(log).toHaveBeenCalledTimes(2);
  });

  it('filters seller claims, opens evidence and page-size controls, and handles image permission denial', async () => {
    const signOut = vi.fn();
    render(
      <AuthContext.Provider value={{ user: { rol: ' VENDEDOR ' }, signOut }}>
        <QuejasReclamos navigation={{ navigate: vi.fn() }} />
      </AuthContext.Provider>,
    );
    await screen.findByText('Selecciona una compra...');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    fireEvent.click(screen.getByText('Salir de rol'));
    expect(signOut).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('tab', { name: 'Mis quejas y reclamos' }));
    expect(screen.getByText('Libro dañado')).toBeTruthy();
    fireEvent.click(screen.getByText('Ver evidencia'));
    expect(screen.getByRole('img')).toBeTruthy();
    fireEvent.click(screen.getByText('Cerrar'));

    fireEvent.click(screen.getByRole('button', { name: 'Solicitudes por página: 5' }));
    fireEvent.click(screen.getByText('10'));
    expect(screen.getByRole('button', { name: 'Solicitudes por página: 10' })).toBeTruthy();
    fireEvent.click(screen.getByText('En revisión (1)'));
    expect(screen.getByText('Demora')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Contraer reclamo 21'));
    expect(screen.getByText(/Demora/)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Nueva queja o reclamo' }));
    fireEvent.click(screen.getByText('Elegir'));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith(
      'Permiso requerido', 'Se necesita acceso a tus fotos para adjuntar evidencia.',
    ));
  });

  it('renders the admin drawer identity, navigates, signs out, and handles swipe gestures', () => {
    render(
      <SidebarAdmin
        visible
        user={{
          nombre: 'Admin',
          foto_perfil: '/uploads/admin.png',
          banner_perfil: '/uploads/banner.png',
          banner_color: 'linear-gradient(135deg, #123456, #654321)',
        }}
        onClose={mocks.close}
        onSignOut={mocks.signOut}
        onSelectDashboard={mocks.selectDashboard}
        onSelectSection={mocks.selectSection}
      />,
    );
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getByTestId('gradient')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ir a Dashboard' }));
    expect(mocks.selectDashboard).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Ir a Quejas y reclamos' }));
    expect(mocks.selectSection).toHaveBeenCalledWith('reclamos');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(mocks.signOut).toHaveBeenCalledOnce();

    const handlers = mocks.panHandlers;
    expect(handlers.onMoveShouldSetPanResponderCapture({}, { dx: -20, dy: 2 })).toBe(true);
    handlers.onPanResponderMove({}, { dx: -40 });
    handlers.onPanResponderRelease({}, { dx: -100, vx: -1 });
    expect(mocks.close).toHaveBeenCalledTimes(4);

    handlers.onPanResponderRelease({}, { dx: -10, vx: 0 });
    handlers.onPanResponderTerminate();
  });
});
