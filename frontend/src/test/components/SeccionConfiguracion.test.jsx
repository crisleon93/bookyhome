import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SeccionConfiguracion from '../../components/dashboard/SeccionConfiguracion';
import * as ToastProvider from '../../components/ToastProvider';

const mockPreferencias = {
  notificaciones_mensajes: { email: true, web: true },
  notificaciones_resenas: { email: true, web: true },
  notificaciones_ofertas: { email: true, web: false },
  notificaciones_pedidos: { email: true, web: true },
  notificaciones_entregas: { email: true, web: true },
  notificaciones_pagos: { email: true, web: true },
  notificaciones_sistema: { email: true, web: true },
};

describe('SeccionConfiguracion', () => {
  let notifySpy;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'fake-jwt-token');
    notifySpy = vi.spyOn(ToastProvider, 'notify').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carga preferencias del usuario desde el backend y modo oscuro inicial', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferencias: mockPreferencias,
      }),
    });

    render(<SeccionConfiguracion userId={10} />);

    expect(await screen.findByText('Configuración de Cuenta')).toBeInTheDocument();
    expect(screen.getByText('Preferencias de Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Seguridad de Cuenta')).toBeInTheDocument();
    expect(screen.getByText('Preferencias Visuales')).toBeInTheDocument();
  });

  it('guarda preferencias correctamente y maneja error del servidor', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferencias: mockPreferencias }),
      })
      .mockResolvedValueOnce({
        ok: true,
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<SeccionConfiguracion userId={10} />);
    await screen.findByText('Configuración de Cuenta');

    // Click Guardar cambios
    const guardarBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(guardarBtn);

    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalledWith('Preferencias guardadas', 'success');
    });

    // Guardar con error
    fireEvent.click(guardarBtn);
    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalledWith('Error al guardar preferencias', 'error');
    });
  });

  it('permite alternar el modo oscuro y emite el evento correspondiente', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferencias: mockPreferencias }),
    });

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    render(<SeccionConfiguracion userId={10} />);
    await screen.findByText('Configuración de Cuenta');

    // Find the dark mode toggle
    const darkModeText = screen.getByText('Modo Oscuro');
    const darkModeCard = darkModeText.closest('div');
    const switchInput = darkModeCard.parentElement.querySelector('input[type="checkbox"]');
    expect(switchInput).not.toBeNull();

    fireEvent.click(switchInput);

    expect(localStorage.getItem('darkMode')).toBe('true');
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(notifySpy).toHaveBeenCalledWith('Modo oscuro activado', 'success');

    fireEvent.click(switchInput);
    expect(localStorage.getItem('darkMode')).toBe('false');
    expect(notifySpy).toHaveBeenCalledWith('Modo claro activado', 'success');
  });

  it('valida formulario de contraseña y actualiza la contraseña exitosamente', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferencias: mockPreferencias }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

    render(<SeccionConfiguracion userId={10} />);
    await screen.findByText('Configuración de Cuenta');

    // Click Cambiar Contraseña button to show form
    fireEvent.click(screen.getByRole('button', { name: /Cambiar Contraseña/i }));

    const actualInput = screen.getByPlaceholderText('Ingresa tu contraseña actual');
    const nuevaInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const confirmarInput = screen.getByPlaceholderText('Confirma tu nueva contraseña');

    // 1. Password mismatch
    fireEvent.change(actualInput, { target: { value: 'OldPass123!' } });
    fireEvent.change(nuevaInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmarInput, { target: { value: 'DifferentPass123!' } });

    const submitBtn = screen.getByRole('button', { name: /Actualizar Contraseña/i });
    fireEvent.click(submitBtn);
    expect(notifySpy).toHaveBeenCalledWith('Las contraseñas nuevas no coinciden', 'error');

    // 2. Weak password
    fireEvent.change(confirmarInput, { target: { value: 'weak' } });
    fireEvent.change(nuevaInput, { target: { value: 'weak' } });
    fireEvent.click(submitBtn);
    expect(notifySpy).toHaveBeenCalledWith(expect.stringContaining('Mínimo 8 caracteres'), 'error');

    // 3. Strong and matching password
    fireEvent.change(nuevaInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmarInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalledWith('Contraseña actualizada correctamente', 'success');
    });
  });

  it('maneja rechazo del servidor al cambiar contraseña', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferencias: mockPreferencias }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'La contraseña actual no es correcta' }),
      });

    render(<SeccionConfiguracion userId={10} />);
    await screen.findByText('Configuración de Cuenta');

    fireEvent.click(screen.getByRole('button', { name: /Cambiar Contraseña/i }));

    const actualInput = screen.getByPlaceholderText('Ingresa tu contraseña actual');
    const nuevaInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const confirmarInput = screen.getByPlaceholderText('Confirma tu nueva contraseña');

    fireEvent.change(actualInput, { target: { value: 'WrongPass123!' } });
    fireEvent.change(nuevaInput, { target: { value: 'NewStrongPass123!' } });
    fireEvent.change(confirmarInput, { target: { value: 'NewStrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Actualizar Contraseña/i }));

    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalledWith('La contraseña actual no es correcta', 'error');
    });
  });

  it('permite alternar visibilidad de las tres contraseñas, hover en botón y cancelar el formulario', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferencias: mockPreferencias }),
    });

    render(<SeccionConfiguracion userId={10} />);
    await screen.findByText('Configuración de Cuenta');

    // Hover guardar botón
    const guardarBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.mouseEnter(guardarBtn);
    fireEvent.mouseLeave(guardarBtn);

    // Toggle notification checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
    }

    fireEvent.click(screen.getByRole('button', { name: /Cambiar Contraseña/i }));

    const actualInput = screen.getByPlaceholderText('Ingresa tu contraseña actual');
    const nuevaInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const confirmarInput = screen.getByPlaceholderText('Confirma tu nueva contraseña');

    expect(actualInput.type).toBe('password');
    expect(nuevaInput.type).toBe('password');
    expect(confirmarInput.type).toBe('password');

    // Click eyes to toggle visibility
    const eyeCurrent = screen.getByRole('button', { name: /Mostrar contraseña actual/i });
    fireEvent.click(eyeCurrent);
    expect(actualInput.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: /Ocultar contraseña actual/i }));
    expect(actualInput.type).toBe('password');

    const eyeNew = screen.getByRole('button', { name: /Mostrar nueva contraseña/i });
    fireEvent.click(eyeNew);
    expect(nuevaInput.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: /Ocultar nueva contraseña/i }));
    expect(nuevaInput.type).toBe('password');

    const eyeConfirm = screen.getByRole('button', { name: /Mostrar confirmación de contraseña/i });
    fireEvent.click(eyeConfirm);
    expect(confirmarInput.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: /Ocultar confirmación de contraseña/i }));
    expect(confirmarInput.type).toBe('password');

    // Cancel form
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByPlaceholderText('Ingresa tu contraseña actual')).not.toBeInTheDocument();
  });

  it('maneja excepción de red al cambiar contraseña y al cargar preferencias', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Fetch network error'))
      .mockRejectedValueOnce(new Error('Password network error'));

    render(<SeccionConfiguracion userId={null} />);
    await screen.findByText('Configuración de Cuenta');

    fireEvent.click(screen.getByRole('button', { name: /Cambiar Contraseña/i }));

    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña actual'), { target: { value: 'ValidOld123!' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'ValidNew123!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirma tu nueva contraseña'), { target: { value: 'ValidNew123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Actualizar Contraseña/i }));

    await waitFor(() => {
      expect(notifySpy).toHaveBeenCalledWith('Error al cambiar contraseña', 'error');
    });

    consoleError.mockRestore();
  });
});
