// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from '../../screens/Profile';

// ── Mocks hoisted ────────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  getEstadisticasUsuario: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  saveBannerColor: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}));

// ── react-native ──────────────────────────────────────────────────────────────
vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeEl({
    children, onPress, disabled, testID, accessibilityLabel, ...rest
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        'data-testid': testID,
      }, children);
    }
    return ReactModule.createElement(tag, { 'data-testid': testID }, children);
  };
  return {
    ActivityIndicator: () => ReactModule.createElement('div', null, 'Loading…'),
    Alert: { alert: mocks.alert },
    Image: ({ source, testID }) =>
      ReactModule.createElement('img', { src: source?.uri, 'data-testid': testID }),
    Modal: ({ visible, children }) =>
      visible ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children) : null,
    Platform: { OS: 'android', select: (o) => o.android ?? o.default ?? o.ios },
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (s) => s, absoluteFillObject: {} },
    Text: nativeElement('span'),
    TextInput: ({ value, onChangeText, testID, ...rest }) =>
      ReactModule.createElement('input', {
        value: value ?? '',
        onChange: (e) => onChangeText?.(e.target.value),
        'data-testid': testID,
      }),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  };
});

// ── safe-area (componente personalizado ThemedSafeAreaView) ──────────────────
vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children, style }) => <div data-testid="safe-area">{children}</div>,
}));

// ── ThemeContext ──────────────────────────────────────────────────────────────
vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: (styles) => styles,
}));

// ── expo-image-picker ─────────────────────────────────────────────────────────
vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ granted: false }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

// ── expo-linear-gradient ─────────────────────────────────────────────────────
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div data-testid="linear-gradient">{children}</div>,
}));

// ── Icons ─────────────────────────────────────────────────────────────────────
vi.mock('../../components/Icons', () => ({
  IconBook: () => null,
  IconBookOpen: () => null,
  IconChartBar: () => null,
  IconStar: () => null,
  IconUser: () => null,
}));

// ── Footer ────────────────────────────────────────────────────────────────────
vi.mock('../../components/Footer', () => ({ default: () => null }));

// ── API ───────────────────────────────────────────────────────────────────────
vi.mock('../../services/api', () => ({
  getApiBaseUrl: mocks.getApiBaseUrl,
  getProfile: mocks.getProfile,
  updateProfile: mocks.updateProfile,
  getEstadisticasUsuario: mocks.getEstadisticasUsuario,
  uploadProfilePhoto: mocks.uploadProfilePhoto,
  uploadBannerPhoto: mocks.uploadBannerPhoto,
  saveBannerColor: mocks.saveBannerColor,
}));

// ── Datos de prueba ───────────────────────────────────────────────────────────
const profileData = {
  nombre_usuario: 'Ana López',
  correo_usuario: 'ana@example.com',
  telefono: '3001234567',
  foto_perfil: null,
  banner_perfil: null,
  banner_color: '#7A1E3A',
};

const statsData = {
  total_gastado: 200000,
  num_compras: 5,
  ticket_promedio: 40000,
  categorias_favoritas: [
    { nombre: 'Ficción', conteo: 3 },
    { nombre: 'Historia', conteo: 2 },
  ],
  nivel_fidelizacion: 'Plata',
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProfile.mockResolvedValue({ data: profileData });
    mocks.getEstadisticasUsuario.mockResolvedValue({ data: statsData });
    mocks.updateProfile.mockResolvedValue({});
    mocks.saveBannerColor.mockResolvedValue({});
  });
  afterEach(cleanup);

  // ── 1. Render con loading ─────────────────────────────────────────────────
  it('muestra indicador de carga mientras obtiene el perfil', () => {
    mocks.getProfile.mockReturnValue(new Promise(() => {}));
    render(<Profile />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  // ── 2. Carga exitosa ──────────────────────────────────────────────────────
  it('muestra los datos del perfil y estadísticas tras cargar', async () => {
    render(<Profile />);

    // Espera que cargue
    expect(await screen.findByText('Información Personal')).toBeTruthy();

    // Nombre y apellido correctamente separados
    const inputs = screen.getAllByRole('textbox');
    const nombres = inputs.find((i) => i.value === 'Ana');
    const apellidos = inputs.find((i) => i.value === 'López');
    expect(nombres).toBeTruthy();
    expect(apellidos).toBeTruthy();

    // Email
    const emailInput = inputs.find((i) => i.value === 'ana@example.com');
    expect(emailInput).toBeTruthy();

    // Estadísticas
    expect(screen.getByText('Estadísticas de Compras')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  // ── 3. Guardar cambios ────────────────────────────────────────────────────
  it('llama a updateProfile al guardar y muestra alerta de éxito', async () => {
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ nombre_usuario: 'Ana López' }),
      ),
    );
    expect(mocks.alert).toHaveBeenCalledWith('Listo', 'Perfil actualizado correctamente');
  });

  // ── 4. Error al cargar perfil ─────────────────────────────────────────────
  it('muestra alerta de error si getProfile falla', async () => {
    mocks.getProfile.mockRejectedValueOnce(new Error('Network error'));
    render(<Profile />);
    await waitFor(() =>
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo cargar tu perfil'),
    );
  });

  // ── 5. Abrir/cerrar editor de banner ─────────────────────────────────────
  it('abre el editor de banner al pulsar "Editar" y lo cierra al pulsarlo de nuevo', async () => {
    render(<Profile />);
    await screen.findByText('Información Personal');

    // Editor no visible aún
    expect(screen.queryByText('Colores sólidos')).toBeNull();

    fireEvent.click(screen.getByText('Editar'));
    expect(await screen.findByText('Colores sólidos')).toBeTruthy();
    expect(screen.getByText('Gradientes')).toBeTruthy();

    // Segundo clic cierra
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => expect(screen.queryByText('Colores sólidos')).toBeNull());
  });

  // ── 6. Modal de niveles de fidelización ──────────────────────────────────
  it('abre y cierra el modal de niveles al pulsar "Ver detalles"', async () => {
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Ver detalles'));
    expect(await screen.findByText('Escala de fidelización')).toBeTruthy();
    // Verifica que al menos Bronce y Platino están en la lista
    expect(screen.getByText('Bronce')).toBeTruthy();
    expect(screen.getByText('Platino')).toBeTruthy();

    // Cierra con ×
    fireEvent.click(screen.getByText('×'));
    await waitFor(() => expect(screen.queryByText('Escala de fidelización')).toBeNull());
  });

  // ── 7. Categorías favoritas ───────────────────────────────────────────────
  it('muestra categorías favoritas cuando existen datos', async () => {
    render(<Profile />);
    await screen.findByText('Categorías Favoritas');
    expect(screen.getByText('Ficción')).toBeTruthy();
    expect(screen.getByText('Historia')).toBeTruthy();
    expect(screen.getByText('3 compras')).toBeTruthy();
    expect(screen.getByText('2 compras')).toBeTruthy();
  });

  it('muestra mensaje de estado vacío cuando no hay categorías y no hay compras', async () => {
    mocks.getEstadisticasUsuario.mockResolvedValue({
      data: { ...statsData, categorias_favoritas: [], num_compras: 0, total_gastado: 0 },
    });
    render(<Profile />);
    await screen.findByText('Categorías Favoritas');
    expect(
      screen.getByText(/Aún no tienes categorías favoritas/),
    ).toBeTruthy();
  });

  it('muestra mensaje diferente cuando hay compras pero sin detalle de categorías', async () => {
    mocks.getEstadisticasUsuario.mockResolvedValue({
      data: { ...statsData, categorias_favoritas: [], num_compras: 3 },
    });
    render(<Profile />);
    await screen.findByText('Categorías Favoritas');
    expect(
      screen.getByText(/Tienes compras activas pero necesitamos más detalles/),
    ).toBeTruthy();
  });

  // ── 8. Nivel máximo de fidelización (Platino) ────────────────────────────
  it('muestra "nivel máximo" cuando el nivel es Platino', async () => {
    mocks.getEstadisticasUsuario.mockResolvedValue({
      data: {
        ...statsData,
        nivel_fidelizacion: 'Platino',
        total_gastado: 7000000,
      },
    });
    render(<Profile />);
    await screen.findByText('Información Personal');
    expect(
      await screen.findByText('Has alcanzado el nivel máximo de fidelización'),
    ).toBeTruthy();
    // No debe mostrar barra de progreso
    expect(screen.queryByText('Próximo:')).toBeNull();
  });
});
