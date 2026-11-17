// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImpulsosVendedor from '../../screens/ImpulsosVendedor';
import { AuthContext } from '../../context/AuthContext';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  cancelarImpulso: vi.fn(),
  contratarImpulso: vi.fn(),
  getMiSuscripcionHerramientas: vi.fn(),
  getMisImpulsos: vi.fn(),
  getMisLibros: vi.fn(),
  getTiposImpulso: vi.fn(),
  navigate: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeElement({
    children,
    onPress,
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
    return tag === 'div' && props.refreshControl
      ? ReactModule.createElement(tag, { 'data-testid': props.testID }, children, props.refreshControl)
      : ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  return {
    ActivityIndicator: () => null,
    Alert: { alert: mocks.alert },
    RefreshControl: ({ onRefresh }) => ReactModule.createElement('button', {
      type: 'button',
      onClick: onRefresh,
    }, 'Actualizar lista'),
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (styles) => styles },
    Text: nativeElement('span'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));

vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react');
  return { useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]) };
});

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({}) };
});

vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible, onClose, user, onSignOut }) => (
    <div data-testid="seller-sidebar" data-visible={String(visible)} data-user={user?.nombre || ''}>
      <button onClick={onClose}>Cerrar menú</button>
      <button onClick={onSignOut}>Salir</button>
    </div>
  ),
}));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../services/api', () => ({
  cancelarImpulso: mocks.cancelarImpulso,
  contratarImpulso: mocks.contratarImpulso,
  getMiSuscripcionHerramientas: mocks.getMiSuscripcionHerramientas,
  getMisImpulsos: mocks.getMisImpulsos,
  getMisLibros: mocks.getMisLibros,
  getTiposImpulso: mocks.getTiposImpulso,
}));

const impulseTypes = [
  { id_tipo_impulso: 1, tipo: 'home', nombre: 'Portada', descripcion: 'Espacio destacado', precio: 100000, duracion_dias: 1 },
  { id_tipo_impulso: 2, tipo: 'categoria', nombre: 'Categoría', descripcion: 'Banner de categoría', precio: 50000, duracion_dias: 7 },
  { id_tipo_impulso: 3, tipo: 'categoria', nombre: 'Categoría duplicada', descripcion: 'No debe repetirse', precio: 30000, duracion_dias: 2 },
  { id_tipo_impulso: 4, tipo: 'email', nombre: 'Correo', descripcion: 'Correo masivo', precio: 25000, duracion_dias: 1 },
];
const activeImpulse = {
  id_impulso: 9,
  tipo: 'home',
  nombre_impulso: 'Portada',
  titulo_libro: 'Libro activo',
  fecha_inicio: '2026-11-01',
  fecha_fin: '2026-11-08',
  monto_pagado: 100000,
  impresiones: 250,
  clics: 20,
  ventas_generadas: 2,
  estado: 'Activo',
};

function renderScreen() {
  return render(
    <AuthContext.Provider value={{ user: { nombre: 'Vendedora' }, signOut: mocks.signOut }}>
      <ImpulsosVendedor navigation={{ navigate: mocks.navigate }} />
    </AuthContext.Provider>,
  );
}

describe('ImpulsosVendedor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTiposImpulso.mockResolvedValue({ data: impulseTypes });
    mocks.getMisImpulsos.mockResolvedValue({ data: [activeImpulse] });
    mocks.getMisLibros.mockResolvedValue({ data: [{ id_libro: 5, titulo: 'Libro propio' }] });
    mocks.getMiSuscripcionHerramientas.mockResolvedValue({ data: { activa: false } });
    mocks.contratarImpulso.mockResolvedValue({});
    mocks.cancelarImpulso.mockResolvedValue({});
  });

  afterEach(cleanup);

  it('carga los tipos únicos y exige elegir un libro para impulsar en portada', async () => {
    renderScreen();

    expect(await screen.findByText(/Impulsos publicitarios/)).toBeTruthy();
    expect(screen.getAllByText('Categoría')).toHaveLength(1);
    fireEvent.click(screen.getByText('Portada'));
    expect(screen.getByText(/Configurar:/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Libro propio/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Contratar por \$100\.000 COP/ }).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Libro propio/ }));
    fireEvent.click(screen.getByRole('button', { name: /Contratar por \$100\.000 COP/ }));
    await waitFor(() => expect(mocks.contratarImpulso).toHaveBeenCalledWith({
      id_tipo_impulso: 1,
      id_libro: 5,
    }));
    expect(await screen.findByText('¡Impulso contratado con éxito! Tu libro ya tiene mayor visibilidad.')).toBeTruthy();
    expect(screen.getByText('⚡ Activos (1)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ahorra con un plan de pago/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('SuscripcionesVendedor');
  });

  it('aplica el descuento del plan y permite navegar a suscripciones', async () => {
    mocks.getMiSuscripcionHerramientas.mockResolvedValue({
      data: { activa: true, suscripcion: { impulsos_con_descuento: 10 } },
    });
    renderScreen();

    expect(await screen.findByText(/Tu plan aplica\s*10\s*%\s*de descuento/)).toBeTruthy();
    expect(screen.queryByText('Ahorra con un plan de pago')).toBeNull();
    fireEvent.click(screen.getByText('Categoría'));
    fireEvent.click(screen.getByRole('button', { name: /Contratar por \$45\.000 COP/ }));
    await waitFor(() => expect(mocks.contratarImpulso).toHaveBeenCalledWith({ id_tipo_impulso: 2 }));

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getByTestId('seller-sidebar').getAttribute('data-visible')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    expect(screen.getByTestId('seller-sidebar').getAttribute('data-visible')).toBe('false');
  });

  it('muestra campañas activas y confirma su cancelación', async () => {
    renderScreen();
    await screen.findByText(/Impulsos publicitarios/);
    fireEvent.click(screen.getByRole('button', { name: /Activos/ }));

    expect(screen.getByText(/Libro activo/)).toBeTruthy();
    expect(screen.getByText('250')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar impulso' }));
    expect(mocks.alert).toHaveBeenCalledWith(
      '¿Cancelar impulso?',
      'No se reembolsará el monto pagado.',
      expect.any(Array),
    );
    const actions = mocks.alert.mock.calls[0][2];
    await actions[1].onPress();
    await waitFor(() => expect(mocks.cancelarImpulso).toHaveBeenCalledWith(9));
    expect(await screen.findByText('Impulso cancelado correctamente.')).toBeTruthy();
  });

  it('muestra errores de carga y permite volver a solicitar los datos', async () => {
    mocks.getTiposImpulso.mockRejectedValueOnce({
      response: { data: { detail: 'Servicio temporalmente no disponible' } },
    });
    renderScreen();

    expect(await screen.findByText('Servicio temporalmente no disponible')).toBeTruthy();
    mocks.getTiposImpulso.mockResolvedValue({ data: [] });
    mocks.getMisImpulsos.mockResolvedValue({ data: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar lista' }));
    await waitFor(() => expect(mocks.getTiposImpulso).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: /Activos/ }));
    expect(screen.getByText('Aún no has contratado ningún impulso.')).toBeTruthy();
  });
});
