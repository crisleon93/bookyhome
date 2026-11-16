// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Messages from '../../screens/Messages';
import MetodosCobroVendedor from '../../screens/MetodosCobroVendedor';
import Notifications from '../../screens/Notifications';
import PedidosVendedor from '../../screens/PedidosVendedor';
import PerfilTienda from '../../screens/PerfilTienda';
import VentasVendedor from '../../screens/VentasVendedor';
import MobileMenuButton from '../../components/MobileMenuButton';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext, NotificationProvider } from '../../context/NotificationContext';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  navigation: { navigate: vi.fn(), goBack: vi.fn() },
  requestPermissionsAsync: vi.fn(),
  salas: [],
  loadingSalas: false,
  recargarSalas: vi.fn(),
  api: {
    actualizarEstadoOrden: vi.fn(),
    crearCuentaBancariaVendedor: vi.fn(),
    deleteNotification: vi.fn(),
    deleteNotificationsByFilter: vi.fn(),
    getCuentasBancariasVendedor: vi.fn(),
    getEmpresasMensajeria: vi.fn(),
    getMisPedidos: vi.fn(),
    getMisVentas: vi.fn(),
    getNotifications: vi.fn(),
    getOrdenes: vi.fn(),
    getPerfilTiendaPublico: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
    marcarCuentaPrincipalVendedor: vi.fn(),
    registrarGuia: vi.fn(),
    eliminarCuentaBancariaVendedor: vi.fn(),
  },
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
    value,
    placeholder,
    ...props
  }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', {
        type: 'button',
        onClick: onPress,
        disabled,
        'aria-label': accessibilityLabel,
        role: accessibilityRole || 'button',
        'aria-checked': accessibilityRole === 'switch' ? value : undefined,
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
  const component = (value) => ReactModule.isValidElement(value)
    ? value
    : typeof value === 'function' ? ReactModule.createElement(value) : value;

  return {
    ActivityIndicator: element('span'),
    Alert: { alert: mocks.alert },
    FlatList: ({ data = [], renderItem, ListHeaderComponent, ListFooterComponent, ListEmptyComponent }) => (
      ReactModule.createElement('div', null,
        component(ListHeaderComponent),
        data.length
          ? data.map((item, index) => ReactModule.createElement(
            ReactModule.Fragment,
            { key: index },
            renderItem({ item, index }),
          ))
          : component(ListEmptyComponent),
        component(ListFooterComponent),
      )
    ),
    Image: element('img'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children)
      : null,
    RefreshControl: () => null,
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
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));
vi.mock('react-native-svg', () => {
  const Shape = () => null;
  return { default: Shape, Path: Shape, Circle: Shape, Rect: Shape };
});
vi.mock('expo-notifications', () => ({
  requestPermissionsAsync: mocks.requestPermissionsAsync,
}));
vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react');
  return {
  useNavigation: () => mocks.navigation,
  useFocusEffect: (callback) => {
    ReactModule.useEffect(callback, [callback]);
  },
  };
});
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({}) };
});
vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: (styles) => styles,
  useAppTheme: () => ({
    darkMode: false,
    colors: { page: '#F9F6F1', text: '#2A2A2A', muted: '#666666' },
  }),
}));
vi.mock('../../context/ChatSocketContext', () => ({
  useChatSocket: () => ({
    salas: mocks.salas,
    loadingSalas: mocks.loadingSalas,
    recargarSalas: mocks.recargarSalas,
  }),
}));
vi.mock('../../services/api', () => ({
  crearCuentaBancariaVendedor: mocks.api.crearCuentaBancariaVendedor,
  deleteNotification: mocks.api.deleteNotification,
  deleteNotificationsByFilter: mocks.api.deleteNotificationsByFilter,
  getApiBaseUrl: () => 'https://api.example.test',
  getCuentasBancariasVendedor: mocks.api.getCuentasBancariasVendedor,
  getEmpresasMensajeria: mocks.api.getEmpresasMensajeria,
  getMisPedidos: mocks.api.getMisPedidos,
  getMisVentas: mocks.api.getMisVentas,
  getNotifications: mocks.api.getNotifications,
  getOrdenes: mocks.api.getOrdenes,
  getPerfilTiendaPublico: mocks.api.getPerfilTiendaPublico,
  markAllNotificationsRead: mocks.api.markAllNotificationsRead,
  markNotificationRead: mocks.api.markNotificationRead,
  marcarCuentaPrincipalVendedor: mocks.api.marcarCuentaPrincipalVendedor,
  actualizarEstadoOrden: mocks.api.actualizarEstadoOrden,
  registrarGuia: mocks.api.registrarGuia,
  eliminarCuentaBancariaVendedor: mocks.api.eliminarCuentaBancariaVendedor,
}));
vi.mock('../../components/Icons', () => {
  const Icon = () => null;
  return {
    IconChevronRight: Icon,
    IconCreditCard: Icon,
    IconMenu: Icon,
    IconMessage: Icon,
    IconPackage: Icon,
    IconSearch: Icon,
    IconShoppingBag: Icon,
    IconStar: Icon,
    IconTruck: Icon,
  };
});
vi.mock('../../components/SidebarMenu', () => ({
  default: ({ visible, onClose }) => visible
    ? <button type="button" onClick={onClose}>Cerrar menú</button>
    : null,
}));
vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible, onClose }) => visible
    ? <button type="button" onClick={onClose}>Cerrar menú vendedor</button>
    : null,
}));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/Header', () => ({ default: () => null }));

const buyer = { sub: '11', rol: 'comprador' };
const vendor = { sub: '42', rol: 'vendedor' };
const navigation = mocks.navigation;
const authValue = (user, token = null) => ({ user, token, signOut: vi.fn() });
const withAuth = (ui, user = buyer, token = null) => (
  <AuthContext.Provider value={authValue(user, token)}>{ui}</AuthContext.Provider>
);

const paymentAccount = {
  id_metodo: 3,
  banco: 'Bancolombia',
  tipo_cuenta: 'Ahorros',
  numero_cuenta: '1234567890',
  nombre_titular: 'Ana',
  cedula_titular: '123',
  es_principal: false,
};

const notification = {
  id_notificacion: 8,
  tipo: 'mensaje',
  titulo: 'Nuevo mensaje de Librería Sol',
  descripcion: '¿Tienes este libro?',
  fecha_creacion: '2026-03-20T12:00:00',
  referencia_id: 18,
  leida: false,
};

const order = {
  id_orden: 21,
  id_comprador: 11,
  estado: 'pendiente',
  cliente: 'Ana',
  fecha: '2026-03-20T12:00:00',
  total_tienda: 24000,
  items: [{ titulo: 'Libro de prueba', cantidad: 2 }],
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.navigation.navigate.mockReset();
  mocks.navigation.goBack.mockReset();
  mocks.api.getNotifications.mockResolvedValue({ data: { notificaciones: [notification] } });
  mocks.api.getOrdenes.mockResolvedValue({ data: { orders: [] } });
  mocks.api.markNotificationRead.mockResolvedValue({ data: {} });
  mocks.api.markAllNotificationsRead.mockResolvedValue({ data: {} });
  mocks.api.deleteNotification.mockResolvedValue({ data: {} });
  mocks.api.deleteNotificationsByFilter.mockResolvedValue({ data: {} });
  mocks.api.getCuentasBancariasVendedor.mockResolvedValue({ data: { cuentas: [paymentAccount] } });
  mocks.api.getMisPedidos.mockResolvedValue({ data: [order] });
  mocks.api.getMisVentas.mockResolvedValue({
    data: [
      { id_orden: 51, id_libro: 5, titulo: 'Libro A', cantidad: 2, precio_libro: 12000, total: 24000, fecha: '2026-03-20', cliente: 'Ana' },
      { id_orden: 51, id_libro: 6, titulo: 'Libro B', cantidad: 1, precio_libro: 18000, total: 18000, fecha: '2026-03-20', cliente: 'Ana' },
      { id_orden: 52, id_libro: 7, titulo: 'Libro reciente', cantidad: 1, total: 9000, fecha: '2026-03-21' },
    ],
  });
  mocks.api.getEmpresasMensajeria.mockResolvedValue({ data: [{ id_empresa: 2, nombre: 'Servientrega' }] });
  mocks.api.registrarGuia.mockResolvedValue({ data: {} });
  mocks.api.getPerfilTiendaPublico.mockResolvedValue({
    data: {
      tienda: { id_tienda: 7, nombre_tienda: 'Librería Sol', calificacion_promedio: 4.5 },
      configuracion: {
        banner_url: '/banner.jpg',
        ciudad_origen: 'Cali',
        descripcion: 'Lecturas para todos',
        email_publico: 'sol@example.com',
        horario_atencion: 'Lunes a sábado',
        logo_url: '/logo.jpg',
        politica_devoluciones: 'Cambios en 15 días',
        politica_envios: 'Envíos nacionales',
        tiempo_despacho_dias: 2,
      },
      libros: [{ id_libro: 5, titulo: 'La aventura', autor_libro: 'Ana', precio_libro: 18000 }],
    },
  });
  mocks.salas = [
    {
      id_sala: 1,
      id_usuario: 11,
      nombre_tienda: 'Tienda Uno',
      ultimo_mensaje: 'Pedido listo',
      no_leidos: 2,
      fecha_ultimo_mensaje: '2026-03-20T12:00:00',
    },
    {
      id_sala: 2,
      id_usuario: 8,
      nombre_comprador: 'Cliente Dos',
      ultimo_mensaje: 'Hola',
      no_leidos: 0,
      fecha_ultimo_mensaje: '2026-03-19T12:00:00',
    },
  ];
  mocks.loadingSalas = false;
  mocks.recargarSalas.mockResolvedValue(undefined);
  mocks.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
});

describe('Messages', () => {
  it('filtra salas, abre la conversación seleccionada y solicita permisos de notificación', async () => {
    render(withAuth(<Messages />));
    expect(screen.getByText('Tienda Uno')).toBeTruthy();
    expect(screen.getByText('Cliente Dos')).toBeTruthy();

    fireEvent.click(screen.getByText('No leídos'));
    expect(screen.getByText('Tienda Uno')).toBeTruthy();
    expect(screen.queryByText('Cliente Dos')).toBeNull();

    fireEvent.click(screen.getByText('Tienda Uno'));
    expect(navigation.navigate).toHaveBeenCalledWith('Chat', expect.objectContaining({
      id_sala: 1,
      nombre_tienda: 'Tienda Uno',
      telefono_contacto: undefined,
    }));

    fireEvent.click(screen.getByText('Activar'));
    await waitFor(() => expect(mocks.requestPermissionsAsync).toHaveBeenCalledOnce());
    expect(screen.queryByText('Activar')).toBeNull();
  });

  it('permite buscar salas, ir al catálogo y actualizar la lista', async () => {
    render(withAuth(<Messages />));
    fireEvent.change(screen.getByPlaceholderText('Buscar un chat o iniciar uno nuevo'), {
      target: { value: 'cliente dos' },
    });
    expect(screen.getByText('Cliente Dos')).toBeTruthy();
    expect(screen.queryByText('Tienda Uno')).toBeNull();
    fireEvent.click(screen.getByLabelText('Explorar librerías en el catálogo'));
    expect(navigation.navigate).toHaveBeenCalledWith('Catalogo');
  });
});

describe('MetodosCobroVendedor', () => {
  it('carga cuentas, cambia la principal y confirma la eliminación', async () => {
    render(withAuth(<MetodosCobroVendedor navigation={navigation} />, vendor));
    expect(await screen.findByText('Bancolombia')).toBeTruthy();
    fireEvent.click(screen.getByText('Marcar principal'));
    await waitFor(() => {
      expect(mocks.api.marcarCuentaPrincipalVendedor).toHaveBeenCalledWith('42', 3);
    });

    fireEvent.click(screen.getByText('Eliminar'));
    expect(mocks.alert).toHaveBeenCalledWith(
      'Confirmar',
      '¿Deseas eliminar este método de cobro?',
      expect.any(Array),
    );
    const actions = mocks.alert.mock.calls[0][2];
    await act(async () => actions[1].onPress());
    expect(mocks.api.eliminarCuentaBancariaVendedor).toHaveBeenCalledWith('42', 3);
  });

  it('valida el formulario y permite elegir un banco y guardar la cuenta', async () => {
    mocks.api.getCuentasBancariasVendedor.mockResolvedValue({ data: { cuentas: [] } });
    render(withAuth(<MetodosCobroVendedor navigation={navigation} />, vendor));
    fireEvent.click(await screen.findByText('+ Agregar cuenta'));
    fireEvent.click(screen.getByText('Guardar cuenta'));
    expect(mocks.alert).toHaveBeenCalledWith(
      'Falta información',
      'Completa todos los campos antes de guardar.',
    );

    fireEvent.click(screen.getByText('Ahorros'));
    fireEvent.click(screen.getByText('Selecciona el banco'));
    fireEvent.click(screen.getByText('Bancolombia'));
    fireEvent.change(screen.getByPlaceholderText('Número de cuenta'), { target: { value: '445566' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre del titular'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByPlaceholderText('Cédula del titular'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Guardar cuenta'));
    await waitFor(() => expect(mocks.api.crearCuentaBancariaVendedor).toHaveBeenCalledWith('42', {
      tipo_cuenta: 'Ahorros',
      banco: 'Bancolombia',
      numero_cuenta: '445566',
      nombre_titular: 'Ana',
      cedula_titular: '123',
      es_principal: false,
    }));
  });
});

describe('Notifications', () => {
  const notificationContext = {
    cargarConteo: vi.fn(),
    resetearNotif: vi.fn(),
  };

  it('marca como leída y abre el chat asociado', async () => {
    render(
      <NotificationContext.Provider value={notificationContext}>
        {withAuth(<Notifications navigation={navigation} />)}
      </NotificationContext.Provider>,
    );
    expect(await screen.findByText('¿Tienes este libro?')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Marcar como leída'));
    await waitFor(() => expect(mocks.api.markNotificationRead).toHaveBeenCalledWith(8));
    fireEvent.click(screen.getByText('¿Tienes este libro?'));
    expect(navigation.navigate).toHaveBeenCalledWith('Chat', {
      id_sala: 18,
      nombre_tienda: 'Librería Sol',
    });
    expect(notificationContext.resetearNotif).toHaveBeenCalledOnce();
  });

  it('incluye notificaciones sintéticas de pedidos y permite filtrar por categoría', async () => {
    mocks.api.getNotifications.mockResolvedValue({ data: { notificaciones: [] } });
    mocks.api.getOrdenes.mockResolvedValue({
      data: { orders: [{ id_orden: 31, estado: 'pendiente', total: 25000 }] },
    });
    render(
      <NotificationContext.Provider value={notificationContext}>
        {withAuth(<Notifications navigation={navigation} />)}
      </NotificationContext.Provider>,
    );
    expect(await screen.findByText('Pago Pendiente')).toBeTruthy();
    fireEvent.click(screen.getByText('Pedidos y envíos'));
    expect(screen.getByText('Pago Pendiente')).toBeTruthy();
    fireEvent.click(screen.getByText('Reclamos y soporte'));
    expect(screen.getByText('Sin notificaciones')).toBeTruthy();
  });

  it('permite marcar todas como leídas y eliminar una notificación mediante confirmación', async () => {
    render(
      <NotificationContext.Provider value={notificationContext}>
        {withAuth(<Notifications navigation={navigation} />)}
      </NotificationContext.Provider>,
    );
    expect(await screen.findByText('Marcar todas como leídas')).toBeTruthy();
    fireEvent.click(screen.getByText('Marcar todas como leídas'));
    await waitFor(() => expect(mocks.api.markAllNotificationsRead).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByLabelText('Eliminar notificación'));
    fireEvent.click(screen.getByText('Sí, eliminar'));
    await waitFor(() => expect(mocks.api.deleteNotification).toHaveBeenCalledWith(8));
  });

  it('ordena, cambia el tamaño de página y borra todas las notificaciones elegidas', async () => {
    mocks.api.getNotifications.mockResolvedValue({
      data: {
        notificaciones: [
          { ...notification, id_notificacion: 8, titulo: '🔔 Mensaje reciente', fecha_creacion: '2026-03-22T12:00:00' },
          { ...notification, id_notificacion: 9, tipo: 'pedido', titulo: 'Pedido anterior', leida: true, fecha_creacion: '2026-03-19T12:00:00' },
        ],
      },
    })
    render(
      <NotificationContext.Provider value={notificationContext}>
        {withAuth(<Notifications navigation={navigation} />)}
      </NotificationContext.Provider>,
    )
    expect(await screen.findByText('Mensaje reciente')).toBeTruthy()
    fireEvent.click(screen.getByText('Más recientes'))
    fireEvent.click(screen.getByText('Más antiguas'))
    expect(screen.getAllByText(/Pedido anterior|Mensaje reciente/)[0].textContent).toContain('Pedido anterior')
    fireEvent.click(screen.getByText('10 por pág.⌄'))
    fireEvent.click(screen.getByText('5 por página'))
    expect(screen.getByText('5 por pág.⌄')).toBeTruthy()

    fireEvent.click(screen.getByText('🗑️ Eliminar mensajes'))
    const bulkModal = screen.getByTestId('modal')
    fireEvent.click(within(bulkModal).getByText('Todas las notificaciones'))
    fireEvent.click(within(bulkModal).getByText('Eliminar'))
    await waitFor(() => expect(mocks.api.deleteNotificationsByFilter).toHaveBeenCalledWith('todas'))
    expect(await screen.findByText('Sin notificaciones')).toBeTruthy()
  })

  it('muestra la vista del vendedor y navega según el tipo de notificación', async () => {
    mocks.api.getNotifications.mockResolvedValue({
      data: {
        notificaciones: [
          { ...notification, tipo: 'mensaje', referencia_id: null, titulo: 'Nuevo mensaje' },
          { ...notification, id_notificacion: 9, tipo: 'sistema', titulo: 'Actualización del sistema' },
        ],
      },
    })
    render(
      <NotificationContext.Provider value={notificationContext}>
        {withAuth(<Notifications navigation={navigation} />, vendor)}
      </NotificationContext.Provider>,
    )
    expect(await screen.findByText('Mantente al día con tus pedidos y mensajes')).toBeTruthy()
    fireEvent.click(screen.getByText('Nuevo mensaje'))
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('Messages'))
    fireEvent.click(screen.getByText('Actualización del sistema'))
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('QuejasReclamos'))
    fireEvent.click(screen.getByText('☰'))
    expect(screen.getByText('Cerrar menú vendedor')).toBeTruthy()
    fireEvent.click(screen.getByText('Cerrar menú vendedor'))
  })
});

describe('PedidosVendedor', () => {
  it('actualiza el estado y registra una guía para el pedido', async () => {
    render(withAuth(<PedidosVendedor navigation={navigation} />, vendor));
    expect(await screen.findByText('#21')).toBeTruthy();
    fireEvent.click(screen.getByText('Pendiente ▾'));
    fireEvent.click(screen.getByText('Pagado'));
    await waitFor(() => {
      expect(mocks.api.actualizarEstadoOrden).toHaveBeenCalledWith(21, 'pagado');
    });

    fireEvent.click(await screen.findByText('+ Guía'));
    fireEvent.click(screen.getByText('Servientrega'));
    fireEvent.change(screen.getByPlaceholderText('Ej: SRV-123456789'), {
      target: { value: '  TRK-100  ' },
    });
    fireEvent.click(screen.getByText('Guardar'));
    await waitFor(() => {
      expect(mocks.api.registrarGuia).toHaveBeenCalledWith(21, {
        id_comprador: 11,
        id_empresa: 2,
        numero_guia: 'TRK-100',
      });
    });
    expect(await screen.findByText('Guía: TRK-100')).toBeTruthy();
  });
});

describe('VentasVendedor', () => {
  it('agrupa libros por orden, muestra totales y permite consultar el detalle', async () => {
    render(withAuth(<VentasVendedor navigation={navigation} />, vendor));

    expect(await screen.findByText('Orden #51')).toBeTruthy();
    expect(screen.getByText('Orden #52')).toBeTruthy();
    expect(screen.getByText('Libro A')).toBeTruthy();
    expect(screen.getByText('Libro B')).toBeTruthy();
    expect(screen.getByText('3 unidades')).toBeTruthy();

    fireEvent.click(screen.getByText('Ver detalle'));
    expect(screen.getByText('Detalle de la orden')).toBeTruthy();
    expect(screen.getByText('Total de la orden')).toBeTruthy();
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('Detalle de la orden')).toBeNull();
    expect(mocks.api.getMisVentas).toHaveBeenCalledOnce();
  });

  it('muestra errores de carga y permite reintentar', async () => {
    mocks.api.getMisVentas
      .mockRejectedValueOnce({ response: { data: { detail: 'Ventas no disponibles' } } })
      .mockResolvedValueOnce({ data: [] });
    render(withAuth(<VentasVendedor navigation={navigation} />, vendor));

    expect(await screen.findByText('Ventas no disponibles')).toBeTruthy();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(await screen.findByText('Aún no hay ventas registradas')).toBeTruthy();
    expect(mocks.api.getMisVentas).toHaveBeenCalledTimes(2);
  });
});

describe('PerfilTienda móvil', () => {
  it('muestra la tienda, abre políticas y navega al detalle de un libro', async () => {
    render(<PerfilTienda route={{ params: { id_tienda: 7 } }} navigation={navigation} />);
    expect(await screen.findByText('Librería Sol')).toBeTruthy();
    expect(screen.getByText('Lecturas para todos')).toBeTruthy();
    fireEvent.click(screen.getByText('Políticas y Horario'));
    expect(screen.getByText('Lunes a sábado')).toBeTruthy();
    expect(screen.getByText('Envíos nacionales')).toBeTruthy();

    fireEvent.click(screen.getByText('Catálogo (1)'));
    fireEvent.click(screen.getByText('Ver detalles'));
    expect(navigation.navigate).toHaveBeenCalledWith('BookDetailPublico', {
      book: expect.objectContaining({ id_libro: 5, titulo: 'La aventura' }),
    });
    expect(mocks.api.getPerfilTiendaPublico).toHaveBeenCalledWith(7);
  });

  it('maneja tienda inexistente, error de carga y navegación atrás', async () => {
    render(<PerfilTienda route={{ params: {} }} navigation={navigation} />);
    expect(await screen.findByText('Librería no encontrada')).toBeTruthy();
    fireEvent.click(screen.getByText('← Volver'));
    expect(navigation.goBack).toHaveBeenCalledOnce();

    mocks.api.getPerfilTiendaPublico.mockRejectedValueOnce(new Error('offline'));
    render(<PerfilTienda route={{ params: { id_tienda: 99 } }} navigation={navigation} />);
    expect(await screen.findByText('Librería no encontrada')).toBeTruthy();
  });
});

describe('MobileMenuButton', () => {
  it('abre y cierra el menú lateral', () => {
    render(withAuth(<MobileMenuButton tintColor="#123456" />));
    expect(screen.queryByText('Cerrar menú')).toBeNull();
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    expect(screen.getByText('Cerrar menú')).toBeTruthy();
    fireEvent.click(screen.getByText('Cerrar menú'));
    expect(screen.queryByText('Cerrar menú')).toBeNull();
  });
});

describe('NotificationProvider', () => {
  it('carga el contador autenticado y gestiona los contadores de mensajes', async () => {
    mocks.api.getNotifications.mockResolvedValue({ data: { no_leidas: 4 } });
    function Consumer() {
      const { unreadNotifCount, unreadMsgCount, incrementarNotif, incrementarMsg, resetearMsg, setMsgCount } =
        React.useContext(NotificationContext);
      return (
        <div>
          <span>{unreadNotifCount}:{unreadMsgCount}</span>
          <button onClick={incrementarNotif}>+n</button>
          <button onClick={incrementarMsg}>+m</button>
          <button onClick={() => setMsgCount(2)}>setm</button>
          <button onClick={() => resetearMsg(8)}>reset partial</button>
          <button onClick={() => resetearMsg()}>reset all</button>
        </div>
      );
    }
    render(
      <AuthContext.Provider value={{ token: 'token' }}>
        <NotificationProvider><Consumer /></NotificationProvider>
      </AuthContext.Provider>,
    );
    expect(await screen.findByText('4:0')).toBeTruthy();
    expect(mocks.api.getNotifications).toHaveBeenCalledWith(true, 1, 0);
    fireEvent.click(screen.getByText('+n'));
    fireEvent.click(screen.getByText('+m'));
    expect(screen.getByText('5:1')).toBeTruthy();
    fireEvent.click(screen.getByText('setm'));
    fireEvent.click(screen.getByText('reset partial'));
    expect(screen.getByText('5:0')).toBeTruthy();
    fireEvent.click(screen.getByText('reset all'));
    expect(screen.getByText('5:0')).toBeTruthy();
  });

  it('deja los contadores en cero cuando no existe token', () => {
    mocks.api.getNotifications.mockClear();
    function Consumer() {
      const { unreadNotifCount, unreadMsgCount } = React.useContext(NotificationContext);
      return <span>{unreadNotifCount}:{unreadMsgCount}</span>;
    }
    render(
      <AuthContext.Provider value={{ token: null }}>
        <NotificationProvider><Consumer /></NotificationProvider>
      </AuthContext.Provider>,
    );
    expect(screen.getByText('0:0')).toBeTruthy();
    expect(mocks.api.getNotifications).not.toHaveBeenCalled();
  });
});
