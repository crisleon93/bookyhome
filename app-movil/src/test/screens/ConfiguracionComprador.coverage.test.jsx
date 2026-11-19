// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConfiguracionComprador from '../../screens/ConfiguracionComprador';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  getProfile: vi.fn(),
  updatePreferences: vi.fn(),
  changePassword: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    accessibilityLabel,
    accessibilityRole,
    disabled,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        role: accessibilityRole,
      }, children);
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', {
        placeholder: props.placeholder,
        value: props.value,
        type: props.secureTextEntry ? 'password' : 'text',
        onChange: (event) => onChangeText?.(event.target.value),
      });
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID, onClick: onPress }, children);
  };

  return {
    ActivityIndicator: () => null,
    Alert: { alert: mocks.alert },
    Pressable: element('button'),
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../components/Icons', () => ({
  IconBell: () => null,
  IconEye: () => null,
  IconEyeOff: () => null,
  IconGlobe: () => null,
  IconMail: () => null,
  IconSettings: () => null,
  IconShield: () => null,
}));

vi.mock('../../components/Footer', () => ({
  default: () => null,
}));

vi.mock('../../services/api', () => ({
  getProfile: mocks.getProfile,
  updatePreferences: mocks.updatePreferences,
  changePassword: mocks.changePassword,
}));

let currentDarkMode = false;
vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({
    darkMode: currentDarkMode,
    setDarkMode: mocks.setDarkMode,
    colors: {
      page: '#FAF8F6',
      card: '#FFFFFF',
      border: '#E2D8D0',
      text: '#2A2A2A',
      muted: '#888888',
    },
  }),
}));

describe('ConfiguracionComprador móvil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentDarkMode = false;
    mocks.getProfile.mockResolvedValue({
      data: {
        id_usuario: 42,
        preferencias: {
          notificaciones_mensajes: { email: true, web: true },
          notificaciones_resenas: { email: false, web: true },
        },
      },
    });
    mocks.updatePreferences.mockResolvedValue({ data: { ok: true } });
    mocks.changePassword.mockResolvedValue({ data: { ok: true } });
    mocks.setDarkMode.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it('muestra spinner al inicio y maneja error al cargar perfil', async () => {
    mocks.getProfile.mockRejectedValueOnce(new Error('Network error'));
    render(<ConfiguracionComprador />);

    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo cargar la configuración de tu cuenta.');
    });
  });

  it('carga datos, modifica canales de notificación y guarda preferencias exitosamente', async () => {
    render(<ConfiguracionComprador />);

    expect(await screen.findByText('Configuración de Cuenta')).toBeTruthy();
    expect(screen.getByText('Preferencias de Notificaciones')).toBeTruthy();
    expect(screen.getByText('#42')).toBeTruthy();

    const emailSwitch = screen.getByLabelText('Email: Mensajes');
    fireEvent.click(emailSwitch);

    const guardarBtn = screen.getByRole('button', { name: 'Guardar cambios' });
    fireEvent.click(guardarBtn);

    await waitFor(() => {
      expect(mocks.updatePreferences).toHaveBeenCalled();
      expect(mocks.alert).toHaveBeenCalledWith('Listo', 'Preferencias guardadas');
    });
  });

  it('maneja error al guardar preferencias', async () => {
    mocks.updatePreferences.mockRejectedValueOnce({
      response: { data: { detail: 'Error del servidor al guardar' } },
    });

    render(<ConfiguracionComprador />);
    expect(await screen.findByText('Configuración de Cuenta')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'Error del servidor al guardar');
    });
  });

  it('permite alternar el modo oscuro y maneja fallos', async () => {
    render(<ConfiguracionComprador />);
    expect(await screen.findByText('Modo Oscuro')).toBeTruthy();

    const darkModeSwitch = screen.getByLabelText('Modo Oscuro');
    fireEvent.click(darkModeSwitch);

    await waitFor(() => {
      expect(mocks.setDarkMode).toHaveBeenCalledWith(true);
      expect(mocks.alert).toHaveBeenCalledWith('Listo', 'Modo oscuro activado');
    });

    mocks.setDarkMode.mockRejectedValueOnce(new Error('Storage failure'));
    fireEvent.click(darkModeSwitch);

    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo guardar la preferencia del tema.');
    });
  });

  it('valida campos incompletos, disparidad y requisitos de contraseña', async () => {
    render(<ConfiguracionComprador />);
    expect(await screen.findByText('Seguridad de Cuenta')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar Contraseña' }));
    expect(screen.getByText('Actualizar Contraseña')).toBeTruthy();

    // 1. Submit empty
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    expect(screen.getByText('Completa todos los campos de contraseña.')).toBeTruthy();

    // 2. Passwords do not match
    const actualInput = screen.getByPlaceholderText('Ingresa tu contraseña actual');
    const nuevaInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const confirmarInput = screen.getByPlaceholderText('Confirma tu nueva contraseña');

    fireEvent.change(actualInput, { target: { value: 'OldPass123!' } });
    fireEvent.change(nuevaInput, { target: { value: 'NuevaPass1!' } });
    fireEvent.change(confirmarInput, { target: { value: 'DiferentePass1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    expect(screen.getByText('Las contraseñas nuevas no coinciden.')).toBeTruthy();

    // 3. Password requirements: too short
    fireEvent.change(confirmarInput, { target: { value: 'NuevaPass1!' } });
    fireEvent.change(nuevaInput, { target: { value: 'Sh1!' } });
    fireEvent.change(confirmarInput, { target: { value: 'Sh1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeTruthy();

    // 4. Missing uppercase
    fireEvent.change(nuevaInput, { target: { value: 'nuevapassword1!' } });
    fireEvent.change(confirmarInput, { target: { value: 'nuevapassword1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    expect(screen.getByText('Agrega al menos una letra mayúscula.')).toBeTruthy();

    // 5. Missing number
    fireEvent.change(nuevaInput, { target: { value: 'NuevaPassword!' } });
    fireEvent.change(confirmarInput, { target: { value: 'NuevaPassword!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    expect(screen.getByText('Agrega al menos un número.')).toBeTruthy();

    // 6. Missing special char
    fireEvent.change(nuevaInput, { target: { value: 'NuevaPassword1' } });
    fireEvent.change(confirmarInput, { target: { value: 'NuevaPassword1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    expect(screen.getByText('Agrega al menos un carácter especial.')).toBeTruthy();

    // Toggle password eye visibility
    const eyeBtns = screen.getAllByRole('button', { name: /mostrar/i });
    if (eyeBtns.length > 0) {
      fireEvent.click(eyeBtns[0]);
    }

    // Cancel form
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByPlaceholderText('Ingresa tu contraseña actual')).toBeNull();
  });

  it('actualiza contraseña exitosamente y maneja error del servidor', async () => {
    render(<ConfiguracionComprador />);
    expect(await screen.findByText('Seguridad de Cuenta')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar Contraseña' }));

    const actualInput = screen.getByPlaceholderText('Ingresa tu contraseña actual');
    const nuevaInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const confirmarInput = screen.getByPlaceholderText('Confirma tu nueva contraseña');

    fireEvent.change(actualInput, { target: { value: 'ActualPass123!' } });
    fireEvent.change(nuevaInput, { target: { value: 'NuevaPass123!' } });
    fireEvent.change(confirmarInput, { target: { value: 'NuevaPass123!' } });

    // Success
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    await waitFor(() => {
      expect(mocks.changePassword).toHaveBeenCalledWith({
        password_actual: 'ActualPass123!',
        password_nueva: 'NuevaPass123!',
      });
      expect(mocks.alert).toHaveBeenCalledWith('Listo', 'Contraseña actualizada correctamente');
    });

    // Reopen and test server rejection
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar Contraseña' }));
    mocks.changePassword.mockRejectedValueOnce({
      response: { data: { detail: 'La contraseña actual es incorrecta' } },
    });

    const actualInput2 = screen.getByPlaceholderText('Ingresa tu contraseña actual');
    const nuevaInput2 = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const confirmarInput2 = screen.getByPlaceholderText('Confirma tu nueva contraseña');

    fireEvent.change(actualInput2, { target: { value: 'WrongPass123!' } });
    fireEvent.change(nuevaInput2, { target: { value: 'NuevaPass123!' } });
    fireEvent.change(confirmarInput2, { target: { value: 'NuevaPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));
    expect(await screen.findByText('La contraseña actual es incorrecta')).toBeTruthy();
  });
});
