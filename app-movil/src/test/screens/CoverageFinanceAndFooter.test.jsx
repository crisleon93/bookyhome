// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FinanzasAdmin from '../../screens/FinanzasAdmin';
import Footer from '../../components/Footer';
import { AuthContext } from '../../context/AuthContext';

const mocks = vi.hoisted(() => ({
  getFinanzasBalance: vi.fn(),
  getFinanzasEstadisticas: vi.fn(),
  getFinanzasHistorial: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const element = (tag) => function NativeElement({
    children,
    onPress,
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
        role: accessibilityRole || 'button',
        'aria-label': accessibilityLabel,
      }, children);
    }
    return tag === 'div' && props.refreshControl
      ? ReactModule.createElement(tag, { 'data-testid': props.testID }, children, props.refreshControl)
      : ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  return {
    ActivityIndicator: element('span'),
    RefreshControl: ({ onRefresh }) => ReactModule.createElement('button', {
      type: 'button',
      onClick: onRefresh,
    }, 'Actualizar desde gesto'),
    ScrollView: element('div'),
    StyleSheet: { create: (styles) => styles, flatten: (style) => style },
    Text: element('span'),
    TouchableOpacity: element('button'),
    View: element('div'),
    Pressable: element('div'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children)
      : null,
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
});

vi.mock('react-native-svg', () => {
  const Shape = () => null;
  return { default: Shape, Circle: Shape, Line: Shape, Path: Shape, Text: Shape };
});

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => mocks.navigate,
}));

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({}) };
});

vi.mock('../../context/ThemeContext', () => ({
  createThemeAwareComponent: (Component) => Component,
  useAppTheme: () => ({ darkMode: false, colors: { page: '#F9F6F1', text: '#2A2A2A', muted: '#666666', card: '#FFFFFF', border: '#E0DBD4', inset: '#FAF8F6' } }),
  useThemedStyles: (styles) => styles,
}));

vi.mock('../../components/Icons', () => {
  const Icon = () => null;
  return {
    IconAlertTriangle: Icon,
    IconBolt: Icon,
    IconChartBar: Icon,
    IconPackage: Icon,
    IconRefresh: Icon,
    IconStore: Icon,
    IconTrendingUp: Icon,
    IconWallet: Icon,
    IconUser: Icon,
    IconUserPlus: Icon,
  };
});

vi.mock('../../services/api', () => ({
  getFinanzasBalance: mocks.getFinanzasBalance,
  getFinanzasEstadisticas: mocks.getFinanzasEstadisticas,
  getFinanzasHistorial: mocks.getFinanzasHistorial,
}));

const today = new Date().toISOString();
const incomeRows = Array.from({ length: 21 }, (_, index) => ({
  id: index + 1,
  tipo: index % 3 === 0 ? 'venta' : index % 3 === 1 ? 'plan' : 'impulso',
  fecha: today,
  monto: 10000 + index,
  monto_venta: 50000 + index,
  comision: 1500 + index,
  estado: index === 0 ? 'completado' : 'pendiente',
}));
const balance = {
  balance: 80000,
  ingresos_totales: 100000,
  pagos_totales: 20000,
  ingresos_por_tipo: { venta: 50000, plan: 30000, impulso: 20000 },
};
const statistics = {
  ingresos_30_dias: 25000,
  promedio_diario: 833,
  ventas_totales: 4,
  planes_activos: 2,
  impulsos_comprados: 3,
};
const history = {
  ingresos: incomeRows,
  pagos: [{ id: 101, tipo: 'reembolso', fecha: today, monto: 5000, estado: 'completado' }],
};

function renderFooter({ user = null, token = null } = {}) {
  return render(
    <AuthContext.Provider value={{ user, token }}>
      <Footer />
    </AuthContext.Provider>,
  );
}

describe('FinanzasAdmin and mobile Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getFinanzasBalance.mockResolvedValue({ data: { balance } });
    mocks.getFinanzasEstadisticas.mockResolvedValue({ data: { estadisticas: statistics } });
    mocks.getFinanzasHistorial.mockResolvedValue({ data: { historial: history } });
    mocks.navigate.getState = vi.fn(() => ({
      routeNames: ['Catalogo', 'Profile', 'History', 'ListaDeseos', 'SoporteTecnico', 'Register', 'RegisterLibrary', 'Login'],
    }));
    mocks.navigate.navigate = vi.fn();
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      callback();
      return 1;
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('muestra balance, filtra estadísticas por tipo y pagina el historial', async () => {
    render(<FinanzasAdmin />);
    expect(await screen.findByText('BookyPago Finanzas')).toBeTruthy();
    expect(screen.getByText('Desglose de ingresos')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Estadísticas' }));
    expect(screen.getByText('Estadísticas Financieras')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ventas/ }));
    const dayButton = screen.getAllByRole('button', { name: /registros/ })[0];
    fireEvent.click(dayButton);
    expect(screen.getByText(/registro\(s\)/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Historial' }));
    expect(screen.getByText('Mostrando 1–20 de 21')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Página siguiente' })[0]);
    expect(screen.getByText('Mostrando 21–21 de 21')).toBeTruthy();
    expect(screen.getByText('Impulso')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Comisiones' }));
    expect(screen.getByText('Comisiones de BookyHome')).toBeTruthy();
    expect(screen.getByText('TOTAL COMISIONES ACUMULADAS')).toBeTruthy();
  });

  it('muestra un error de carga, reintenta y permite actualizar desde el control de refresco', async () => {
    mocks.getFinanzasBalance.mockRejectedValueOnce({
      response: { data: { detail: 'Balance no disponible' } },
    });
    render(<FinanzasAdmin />);

    expect(await screen.findByText('Balance no disponible')).toBeTruthy();
    fireEvent.click(screen.getByText('Reintentar'));
    await waitFor(() => expect(mocks.getFinanzasBalance).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Desglose de ingresos')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar desde gesto' }));
    await waitFor(() => expect(mocks.getFinanzasBalance).toHaveBeenCalledTimes(3));
  });

  it('abre los enlaces legales y cierra su diálogo', () => {
    renderFooter();
    fireEvent.click(screen.getByRole('button', { name: 'Acerca de nosotros' }));
    expect(screen.getAllByText('Acerca de nosotros')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByTestId('modal')).toBeNull();
  });

  it('guía a usuarios sin sesión hacia registro y a compradores hacia sus pantallas', () => {
    renderFooter();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión / Registro' }));
    expect(screen.getByText('¡Bienvenido a BookyHome!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Soy nuevo/ }));
    expect(screen.getByText('Crear cuenta')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tengo una librería/ }));
    expect(mocks.navigate.navigate).toHaveBeenCalledWith('RegisterLibrary');

    cleanup();
    renderFooter({ user: { rol: 'comprador' }, token: 'buyer-token' });
    mocks.navigate.navigate.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Explorar catálogo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mis compras' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lista de deseos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda y Soporte' }));
    expect(mocks.navigate.navigate).toHaveBeenNthCalledWith(1, 'Catalogo');
    expect(mocks.navigate.navigate).toHaveBeenNthCalledWith(2, 'History');
    expect(mocks.navigate.navigate).toHaveBeenNthCalledWith(3, 'ListaDeseos');
    expect(mocks.navigate.navigate).toHaveBeenNthCalledWith(4, 'SoporteTecnico');
  });

  it('explica las opciones no disponibles para un vendedor', () => {
    renderFooter({ user: { rol: 'vendedor' }, token: 'seller-token' });
    fireEvent.click(screen.getByRole('button', { name: 'Mis compras' }));
    expect(screen.getByText('El historial de compras está disponible para cuentas de comprador.')).toBeTruthy();
  });
});
