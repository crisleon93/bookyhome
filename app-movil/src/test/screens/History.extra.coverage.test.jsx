// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import History from '../../screens/History';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  getOrdenes: vi.fn(),
  getDevoluciones: vi.fn(),
  getOrderDetails: vi.fn(),
  cancelarMisPendientes: vi.fn(),
  notificarLlegadaTienda: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  printAsync: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
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
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  return {
    ActivityIndicator: () => null,
    Alert: { alert: mocks.alert },
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children)
      : null,
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (styles) => styles, flatten: (style) => style },
    Text: nativeElement('span'),
    TextInput: nativeElement('input'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  };
});

vi.mock('react-native-svg', () => {
  const Shape = () => null;
  return { default: Shape, Circle: Shape, Line: Shape, Path: Shape, Polyline: Shape, Polygon: Shape, Rect: Shape };
});

vi.mock('expo-print', () => ({ printAsync: mocks.printAsync }));
vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react');
  return { useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]) };
});
vi.mock('../../components/ThemedSafeAreaView', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/Icons', () => ({
  IconPackage: () => null,
  IconSearch: () => null,
}));
vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({ darkMode: true }),
  useThemedStyles: (styles) => styles,
  adaptStyleForTheme: (style) => style,
}));
vi.mock('../../services/api', () => ({
  cancelarMisPendientes: mocks.cancelarMisPendientes,
  getOrdenes: mocks.getOrdenes,
  getDevoluciones: mocks.getDevoluciones,
  getOrderDetails: mocks.getOrderDetails,
  notificarLlegadaTienda: mocks.notificarLlegadaTienda,
  sendConfirmationEmail: mocks.sendConfirmationEmail,
}));

describe('History móvil - cobertura adicional', () => {
  const navigation = { navigate: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('cubre retiro en tienda con estado reservado y notificar llegada exitoso', async () => {
    const ordenTienda = {
      id_orden: 55,
      id_orden_db: 55,
      estado: 'pendiente',
      estado_retiro: 'reservado',
      tipo_entrega: 'retiro_tienda',
      pin_retiro: '1234',
      fecha: '2026-11-15T10:00:00',
      fecha_limite_retiro: '2026-11-20T18:00:00',
      total: 35000,
      tienda_retiro: {
        nombre_tienda: 'Librería Central',
        direccion: 'Calle 10 # 5-20',
        telefono: '3001234567',
      },
      items: [{ id_libro: 9, titulo: 'Cien Años', cantidad: 1, precio_libro: 35000 }],
    };

    mocks.getOrdenes.mockResolvedValue({ data: [ordenTienda] });
    mocks.getDevoluciones.mockResolvedValue({ data: [] });
    mocks.getOrderDetails.mockResolvedValue({ data: ordenTienda });
    mocks.notificarLlegadaTienda.mockResolvedValue({ data: { ok: true } });

    render(<History navigation={navigation} />);

    expect(await screen.findByText('Orden #55')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver Detalles' }));

    expect(await screen.findByText(/🏪 Click & Collect/)).toBeTruthy();
    expect(screen.getByText(/PIN: 1234/)).toBeTruthy();
    expect(screen.getByText(/Librería Central/)).toBeTruthy();
    expect(screen.getByText(/Calle 10 # 5-20/)).toBeTruthy();
    expect(screen.getByText(/3001234567/)).toBeTruthy();

    const notificarBtn = screen.getByRole('button', { name: /Notificar llegada/ });
    fireEvent.click(notificarBtn);

    await waitFor(() => {
      expect(mocks.notificarLlegadaTienda).toHaveBeenCalledWith(55);
      expect(mocks.alert).toHaveBeenCalledWith('Llegada notificada', 'El encargado de la librería te atenderá en breve.');
    });
  });

  it('maneja error en notificar llegada a tienda', async () => {
    const ordenTienda = {
      id_orden: 56,
      id_orden_db: 56,
      estado: 'pendiente',
      estado_retiro: 'reservado',
      tipo_entrega: 'retiro_tienda',
      total: 40000,
      items: [],
    };

    mocks.getOrdenes.mockResolvedValue({ data: [ordenTienda] });
    mocks.getDevoluciones.mockResolvedValue({ data: [] });
    mocks.getOrderDetails.mockResolvedValue({ data: ordenTienda });
    mocks.notificarLlegadaTienda.mockRejectedValue(new Error('Network error'));

    render(<History navigation={navigation} />);

    expect(await screen.findByText('Orden #56')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver Detalles' }));

    const notificarBtn = await screen.findByRole('button', { name: /Notificar llegada/ });
    fireEvent.click(notificarBtn);

    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo notificar tu llegada. Intenta de nuevo.');
    });
  });

  it('permite pagar ahora cuando el estado_retiro es habilitado_pago', async () => {
    const ordenHabilitada = {
      id_orden: 57,
      id_orden_db: 57,
      estado: 'pendiente',
      estado_retiro: 'habilitado_pago',
      tipo_entrega: 'retiro_tienda',
      total: 60000,
      items: [{ id_libro: 10, titulo: 'El Quijote', cantidad: 2, precio_libro: 30000 }],
    };

    mocks.getOrdenes.mockResolvedValue({ data: [ordenHabilitada] });
    mocks.getDevoluciones.mockResolvedValue({ data: [] });
    mocks.getOrderDetails.mockResolvedValue({ data: ordenHabilitada });

    render(<History navigation={navigation} />);

    expect(await screen.findByText('Orden #57')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver Detalles' }));

    const pagarBtn = await screen.findByRole('button', { name: /💳 Pagar Ahora/ });
    fireEvent.click(pagarBtn);

    expect(navigation.navigate).toHaveBeenCalledWith('Checkout', { orderId: 57 });
  });

  it('muestra estado en_tienda y orden retirada pagada', async () => {
    const ordenEnTienda = {
      id_orden: 58,
      id_orden_db: 58,
      estado: 'pagado',
      estado_retiro: 'en_tienda',
      tipo_entrega: 'retiro_tienda',
      total: 45000,
      items: [{ id_libro: 11, titulo: 'Ficciones', cantidad: 1, precio_libro: 45000 }],
    };

    mocks.getOrdenes.mockResolvedValue({ data: [ordenEnTienda] });
    mocks.getDevoluciones.mockResolvedValue({ data: [] });
    mocks.getOrderDetails.mockResolvedValue({ data: ordenEnTienda });

    render(<History navigation={navigation} />);

    expect(await screen.findByText('Orden #58')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver Detalles' }));

    expect(await screen.findByText(/Presenta tu PIN en el mostrador/)).toBeTruthy();

    const verBaucher = screen.getByRole('button', { name: '📄 Ver Baucher' });
    fireEvent.click(verBaucher);
    expect(await screen.findByText('¡Compra Exitosa!')).toBeTruthy();
  });

  it('maneja fallos en enviar correo e imprimir comprobante', async () => {
    const ordenPagada = {
      id_orden: 59,
      id_orden_db: 59,
      estado: 'pagado',
      tipo_entrega: 'domicilio',
      total: 20000,
      envio: null,
      items: [],
    };

    mocks.getOrdenes.mockResolvedValue({ data: [ordenPagada] });
    mocks.getDevoluciones.mockResolvedValue({ data: [] });
    mocks.getOrderDetails.mockResolvedValue({ data: ordenPagada });
    mocks.sendConfirmationEmail.mockRejectedValue(new Error('SMTP down'));
    mocks.printAsync.mockRejectedValue(new Error('Print failed'));

    render(<History navigation={navigation} />);

    expect(await screen.findByText('Orden #59')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ver Baucher/ }));

    expect(await screen.findByText('¡Compra Exitosa!')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar por correo' }));
    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo enviar el comprobante por correo.');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith('Error', 'No se pudo abrir el diálogo de impresión.');
    });
  });

  it('maneja error al cancelar pendientes si el backend rechaza o falla', async () => {
    const ordenPendiente = {
      id_orden: 60,
      estado: 'pendiente',
      total: 10000,
      fecha: '2026-11-10T10:00:00',
      items: [],
    };

    mocks.getOrdenes.mockResolvedValue({ data: [ordenPendiente] });
    mocks.getDevoluciones.mockResolvedValue({ data: [] });
    mocks.cancelarMisPendientes.mockRejectedValueOnce({
      response: { data: { detail: 'Error de prueba en servidor' } },
      message: 'Server error',
    });

    render(<History navigation={navigation} />);

    expect(await screen.findByText('Orden #60')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Limpiar 1 pendiente/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /🗑️ Limpiar/ })[1]);

    expect(await screen.findByText('Error de prueba en servidor')).toBeTruthy();
  });

  it('ordena por antiguas y por menor precio y filtra por devoluciones', async () => {
    const ordenA = { id_orden: 1, total: 80000, fecha: '2026-11-01T10:00:00', estado: 'entregada', items: [] };
    const ordenB = { id_orden: 2, total: 20000, fecha: '2026-11-05T10:00:00', estado: 'pagado', items: [] };

    mocks.getOrdenes.mockResolvedValue({ data: [ordenA, ordenB] });
    mocks.getDevoluciones.mockResolvedValue({ data: [{ id_orden: 1, estado_devolucion: 'solicitada' }] });

    render(<History navigation={navigation} />);

    expect(await screen.findByText('Orden #1')).toBeTruthy();
    expect(screen.getByText('Orden #2')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Ordenar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Menor valor' }));
    expect(screen.getByText('Orden #2')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Ordenar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Más antiguas' }));
    expect(screen.getByText('Orden #1')).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: /✓ Entregadas/ })[0]);
    expect(screen.getByText('Orden #1')).toBeTruthy();
    expect(screen.queryByText('Orden #2')).toBeNull();
  });
});
