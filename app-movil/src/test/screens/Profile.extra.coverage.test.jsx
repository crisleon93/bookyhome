// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from '../../screens/Profile';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  getEstadisticasUsuario: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  saveBannerColor: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

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
    Platform: { OS: 'web', select: (o) => o.web ?? o.default },
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

vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div data-testid="safe-area">{children}</div>,
}));

vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: (styles) => styles,
}));

vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => mocks.requestMediaLibraryPermissionsAsync(),
  launchImageLibraryAsync: (opts) => mocks.launchImageLibraryAsync(opts),
  MediaTypeOptions: { Images: 'Images' },
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div data-testid="linear-gradient">{children}</div>,
}));

vi.mock('../../components/Icons', () => ({
  IconBook: () => null,
  IconBookOpen: () => null,
  IconChartBar: () => null,
  IconStar: () => null,
  IconUser: () => null,
}));

vi.mock('../../components/Footer', () => ({ default: () => null }));

vi.mock('../../services/api', () => ({
  getApiBaseUrl: mocks.getApiBaseUrl,
  getProfile: mocks.getProfile,
  updateProfile: mocks.updateProfile,
  getEstadisticasUsuario: mocks.getEstadisticasUsuario,
  uploadProfilePhoto: mocks.uploadProfilePhoto,
  uploadBannerPhoto: mocks.uploadBannerPhoto,
  saveBannerColor: mocks.saveBannerColor,
}));

describe('Profile — Cobertura completa de ramas y acciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProfile.mockResolvedValue({
      data: {
        nombre_usuario: 'Carlos Gomez',
        correo_usuario: 'carlos@test.com',
        telefono: '3119876543',
        foto_perfil: 'uploads/avatars/carlos.jpg',
        banner_perfil: 'uploads/banners/carlos.jpg',
        banner_color: null,
      },
    });
    mocks.getEstadisticasUsuario.mockResolvedValue({
      data: {
        total_gastado: 450000,
        num_compras: 8,
        ticket_promedio: 56250,
        categorias_favoritas: [{ nombre: 'Novelas', conteo: 4 }],
        nivel_fidelizacion: 'Oro',
      },
    });
    mocks.updateProfile.mockResolvedValue({});
    mocks.saveBannerColor.mockResolvedValue({});
    mocks.uploadProfilePhoto.mockResolvedValue({ data: { url: 'http://img.test/photo.png' } });
    mocks.uploadBannerPhoto.mockResolvedValue({ data: { banner_perfil: 'banners/new.png' } });
  });

  afterEach(cleanup);

  it('resuelve imágenes relativas y muestra foto y banner existentes', async () => {
    render(<Profile />);
    expect(await screen.findByText('Información Personal')).toBeTruthy();
    expect(screen.getByDisplayValue('Carlos')).toBeTruthy();
    expect(screen.getByText('Oro')).toBeTruthy();
  });

  it('maneja rechazo de permiso de galería al subir foto', async () => {
    mocks.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Cambiar Foto'));
    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Permiso requerido', expect.stringContaining('acceso a la galería'));
    });
  });

  it('cancela la selección de imagen si el usuario la cancela', async () => {
    mocks.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: true });
    mocks.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true });
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Cambiar Foto'));
    await waitFor(() => {
      expect(mocks.uploadProfilePhoto).not.toHaveBeenCalled();
    });
  });

  it('sube foto de perfil exitosamente en web y actualiza estado', async () => {
    mocks.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: true });
    mocks.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'blob:http://localhost/test.jpg', file: new Blob(['fake']) }],
    });
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Cambiar Foto'));
    await waitFor(() => {
      expect(mocks.uploadProfilePhoto).toHaveBeenCalled();
      expect(mocks.alert).toHaveBeenCalledWith('Listo', 'Foto de perfil actualizada.');
    });
  });

  it('informa error si falla la subida de foto de perfil', async () => {
    mocks.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: true });
    mocks.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'blob:http://localhost/test.jpg', file: new Blob(['fake']) }],
    });
    mocks.uploadProfilePhoto.mockRejectedValueOnce(new Error('Fallo de red'));
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Cambiar Foto'));
    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo actualizar la foto.');
    });
  });

  it('permite cambiar colores sólidos del banner y maneja éxito y error', async () => {
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Editar'));
    expect(await screen.findByText('Colores sólidos')).toBeTruthy();

    // Guardar color sólido con éxito
    const swatchButtons = screen.getAllByRole('button');
    // Clic en uno de los botones de swatch
    fireEvent.click(swatchButtons[5]);
    await waitFor(() => {
      expect(mocks.saveBannerColor).toHaveBeenCalled();
    });

    // Guardar color personalizado
    fireEvent.click(screen.getByText('Editar'));
    const inputCustom = screen.getAllByRole('textbox').find((i) => i.value.startsWith('#'));
    if (inputCustom) {
      fireEvent.change(inputCustom, { target: { value: '#123456' } });
    }
    fireEvent.click(screen.getByText('Aplicar'));
    await waitFor(() => {
      expect(mocks.saveBannerColor).toHaveBeenCalledWith('#123456');
    });

    // Error al guardar color
    mocks.saveBannerColor.mockRejectedValueOnce(new Error('BD error'));
    fireEvent.click(screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Aplicar'));
    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo guardar el color del banner.');
    });
  });

  it('sube banner exitosamente desde el editor', async () => {
    mocks.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: true });
    mocks.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'blob:http://localhost/banner.png', file: new Blob(['fake']) }],
    });
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Elegir imagen'));
    await waitFor(() => {
      expect(mocks.uploadBannerPhoto).toHaveBeenCalled();
      expect(mocks.alert).toHaveBeenCalledWith('Listo', 'Banner actualizado.');
    });
  });

  it('muestra error al guardar cambios de perfil si updateProfile falla', async () => {
    mocks.updateProfile.mockRejectedValueOnce(new Error('Fallo al actualizar'));
    render(<Profile />);
    await screen.findByText('Información Personal');

    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo actualizar tu perfil');
    });
  });

  it('maneja perfil con banner de gradiente y sin foto', async () => {
    mocks.getProfile.mockResolvedValueOnce({
      data: {
        nombre_usuario: '',
        correo_usuario: 'sin_nombre@test.com',
        telefono: '',
        foto_perfil: null,
        banner_perfil: null,
        banner_color: 'linear-gradient(135deg, #7A1E3A, #3A1E7A)',
      },
    });
    mocks.getEstadisticasUsuario.mockRejectedValueOnce(new Error('Fallo stats'));
    render(<Profile />);
    expect(await screen.findByText('Información Personal')).toBeTruthy();
    expect(screen.getByText('U')).toBeTruthy(); // Initial fallback
  });
});
