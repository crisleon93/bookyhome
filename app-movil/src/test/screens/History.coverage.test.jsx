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
  useAppTheme: () => ({ darkMode: false }),
  useThemedStyles: (styles) => styles,
}));
vi.mock('../../services/api', () => ({
  cancelarMisPendientes: mocks.cancelarMisPendientes,
  getOrdenes: mocks.getOrdenes,
  getDevoluciones: mocks.getDevoluciones,
  getOrderDetails: mocks.getOrderDetails,
  notificarLlegadaTienda: mocks.notificarLlegadaTienda,
  sendConfirmationEmail: mocks.sendConfirmationEmail,
}));

const baseOrders = [
  {
    id_orden: 1,
    estado: 'pagado',
    fecha: '2026-11-14T12:00:00',
    total: 50000,
    tipo_entrega: 'domicilio',
    envio: { numero_guia: 'GUIA-1', empresa_mensajeria: 'Mensajería', estado_envio: 'en_transito' },
    items: [{ id_libro: 11, titulo: 'Libro en camino', autor_libro: 'Autora', cantidad: 1, precio_libro: 50000 }],
  },
  {
    id_orden: 2,
    estado: 'entregada',
    fecha: '2026-11-13T12:00:00',
    total: 25000,
    tipo_entrega: 'retiro_tienda',
    items: [{ id_libro: 12, titulo: 'Libro devuelto', cantidad: 1, precio_libro: 25000 }],
  },
  {
    id_orden: 3,
    estado: 'pendiente',
    fecha: '2026-11-12T12:00:00',
    total: 30000,
    tipo_entrega: 'domicilio',
    items: [{ id_libro: 13, titulo: 'Libro pendiente', cantidad: 1, precio_libro: 30000 }],
  },
  {
    id_orden: 4,
    estado: 'cancelada',
    fecha: '2026-11-11T12:00:00',
    total: 10000,
    items: [],
  },
];

const detailedOrder = {
  ...baseOrders[0],
  id_orden_db: 101,
  estado: 'pagado',
  metodo_pago: 'PSE',
  costo_envio: 5000,
  total_con_descuento: 48000,
  cupon_aplicado: 'LECTURA',
  envio: { numero_guia: 'GUIA-1', empresa_mensajeria: 'Mensajería', estado_envio: 'en_transito' },
};

const navigation = { navigate: vi.fn() };

function renderHistory() {
  return render(<History navigation={navigation} />);
}

describe('History móvil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrdenes.mockResolvedValue({ data: baseOrders });
    mocks.getDevoluciones.mockResolvedValue({ data: [{ id_orden: 2, estado_devolucion: 'completada' }] });
    mocks.getOrderDetails.mockResolvedValue({ data: detailedOrder });
    mocks.cancelarMisPendientes.mockResolvedValue({ data: { ok: true, canceladas: 1 } });
    mocks.notificarLlegadaTienda.mockResolvedValue({});
    mocks.sendConfirmationEmail.mockResolvedValue({});
    mocks.printAsync.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it('carga compras, calcula estados y filtra por estado y búsqueda', async () => {
    renderHistory();

    expect(await screen.findByText('Orden #1')).toBeTruthy();
    expect(screen.getByText('4 Compras registradas')).toBeTruthy();
    expect(screen.getByText('En camino')).toBeTruthy();
    expect(screen.getByText('Reembolsado')).toBeTruthy();
    expect(screen.getByText('Cancelada')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Pendientes de pago/ }));
    expect(screen.getByText('Orden #3')).toBeTruthy();
    expect(screen.queryByText('Orden #1')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer filtros' }));
    expect(screen.getByText('Orden #1')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText(/Buscar por # orden/), { target: { value: 'Libro en camino' } });
    expect(screen.getByText('Orden #1')).toBeTruthy();
    expect(screen.queryByText('Orden #2')).toBeNull();
  });

  it('ordena, pagina y abre el detalle y el comprobante de una compra', async () => {
    mocks.getOrdenes.mockResolvedValue({
      data: Array.from({ length: 9 }, (_, index) => ({
        ...baseOrders[0],
        id_orden: index + 1,
        fecha: `2026-11-${String(index + 1).padStart(2, '0')}T12:00:00`,
        total: (index + 1) * 10000,
        items: [{ ...baseOrders[0].items[0], titulo: `Libro ${index + 1}` }],
      })),
    });
    renderHistory();

    expect(await screen.findByText('Mostrando 1–8 de 9 órdenes')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ordenar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mayor valor' }));
    expect(screen.getByText('Orden #9')).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Ver Detalles' })[0]);
    expect(await screen.findByText(/Guía:/)).toBeTruthy();
    expect(screen.getByText(/en_transito/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalles' }));

    fireEvent.click(screen.getAllByRole('button', { name: /Ver Baucher/ })[0]);
    expect(await screen.findByText('¡Compra Exitosa!')).toBeTruthy();
    expect(screen.getByText(/Cupón LECTURA/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar por correo' }));
    await waitFor(() => expect(mocks.sendConfirmationEmail).toHaveBeenCalledWith(1));
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
    await waitFor(() => expect(mocks.printAsync).toHaveBeenCalled());
    expect(mocks.printAsync.mock.calls[0][0].html).toContain('Comprobante BookyHome');
  });

  it('limpia órdenes pendientes y muestra el resultado del servidor', async () => {
    renderHistory();
    await screen.findByText('Orden #1');

    fireEvent.click(screen.getByRole('button', { name: /Limpiar 1 pendiente/ }));
    expect(screen.getByText('Limpiar órdenes pendientes')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /🗑️ Limpiar/ })[1]);

    expect(await screen.findByText('1 orden pendiente cancelada.')).toBeTruthy();
    expect(mocks.cancelarMisPendientes).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar mensaje' }));
    expect(screen.queryByText('1 orden pendiente cancelada.')).toBeNull();
  });

  it('muestra errores al cargar y permite reintentar', async () => {
    mocks.getOrdenes.mockRejectedValueOnce(new Error('offline'));
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderHistory();

    expect(await screen.findByText('No se pudo cargar el historial')).toBeTruthy();
    expect(consoleWarn).toHaveBeenCalled();
    mocks.getOrdenes.mockResolvedValue({ data: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByText('Aún no has realizado ninguna compra en BookyHome.')).toBeTruthy();
  });
});
