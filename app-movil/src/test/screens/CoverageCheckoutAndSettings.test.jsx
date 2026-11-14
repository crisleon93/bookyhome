// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Checkout from '../../screens/Checkout';
import ConfiguracionComprador from '../../screens/ConfiguracionComprador';
import ConfiguracionTienda from '../../screens/ConfiguracionTienda';
import CuponesVendedor from '../../screens/CuponesVendedor';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  loadCart: vi.fn(),
  actualizarCostoEnvio: vi.fn(),
  aplicarCupon: vi.fn(),
  getDatosTransferenciaVendedor: vi.fn(),
  getDirecciones: vi.fn(),
  getOrderDetails: vi.fn(),
  getApiBaseUrl: vi.fn(),
  notificarLlegadaTienda: vi.fn(),
  processPayment: vi.fn(),
  reservarRetiroEnTienda: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  validarCupon: vi.fn(),
  changePassword: vi.fn(),
  getProfile: vi.fn(),
  updatePreferences: vi.fn(),
  getConfigLibreria: vi.fn(),
  updateConfigLibreria: vi.fn(),
  uploadTiendaImage: vi.fn(),
  getCuponesVendedor: vi.fn(),
  crearCupon: vi.fn(),
  actualizarCupon: vi.fn(),
  eliminarCupon: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    source,
    accessibilityLabel,
    accessibilityRole,
    disabled,
    value,
    placeholder,
    secureTextEntry,
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
        type: secureTextEntry ? 'password' : 'text',
        disabled,
        'aria-label': accessibilityLabel,
        onChange: (event) => onChangeText?.(event.target.value),
      });
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', {
        src: source?.uri || source,
        alt: accessibilityLabel || '',
      });
    }
    return ReactModule.createElement(tag, {
      'data-testid': props.testID,
    }, children);
  };
  return {
    ActivityIndicator: nativeElement('span'),
    Alert: { alert: mocks.alert },
    Image: nativeElement('img'),
    Linking: { openURL: vi.fn().mockResolvedValue(undefined) },
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children)
      : null,
    Platform: { OS: 'android', select: (values) => values.android || values.default },
    Pressable: nativeElement('button'),
    ScrollView: nativeElement('div'),
    StyleSheet: { create: (styles) => styles, flatten: (style) => style },
    Switch: ({ value, onValueChange, disabled }) => ReactModule.createElement('button', {
      type: 'button',
      role: 'switch',
      'aria-checked': value,
      disabled,
      onClick: () => onValueChange?.(!value),
    }),
    Text: nativeElement('span'),
    TextInput: nativeElement('input'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
    KeyboardAvoidingView: nativeElement('div'),
    RefreshControl: () => null,
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));

vi.mock('react-native-svg', () => {
  const Shape = () => null;
  return { default: Shape, Line: Shape, Path: Shape, Rect: Shape };
});

vi.mock('expo-linear-gradient', async () => {
  const ReactModule = await vi.importActual('react');
  return { LinearGradient: ({ children }) => ReactModule.createElement('div', null, children) };
});

vi.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'images' },
  requestMediaLibraryPermissionsAsync: mocks.requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync: mocks.launchImageLibraryAsync,
}));

vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react');
  return { useFocusEffect: (callback) => ReactModule.useEffect(callback, [callback]) };
});

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({}) };
});

vi.mock('../../context/CartContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { CartContext: ReactModule.createContext({}) };
});

vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({
    darkMode: false,
    setDarkMode: mocks.setDarkMode,
    colors: {
      page: '#F9F6F1',
      card: '#FFFFFF',
      text: '#2A2A2A',
      muted: '#666666',
      border: '#E0DBD4',
      inset: '#FAF8F6',
    },
  }),
  useThemedStyles: (styles) => styles,
}));

vi.mock('../../components/Icons', () => {
  const Icon = () => null;
  return {
    IconAlertTriangle: Icon,
    IconBell: Icon,
    IconCalendar: Icon,
    IconCheck: Icon,
    IconEdit: Icon,
    IconEye: Icon,
    IconEyeOff: Icon,
    IconGlobe: Icon,
    IconMail: Icon,
    IconPlus: Icon,
    IconSettings: Icon,
    IconShield: Icon,
    IconTag: Icon,
    IconTrash: Icon,
  };
});

vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible, onClose }) => visible
    ? <button type="button" onClick={onClose}>Cerrar menú</button>
    : null,
}));
vi.mock('../../components/CalendarioPicker', () => ({
  default: ({ label, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(label.includes('inicio') ? '2026-01-01T10:00' : '2026-12-31T10:00')}
    >
      {label}
    </button>
  ),
}));
vi.mock('../../services/api', () => ({
  actualizarCostoEnvio: mocks.actualizarCostoEnvio,
  aplicarCupon: mocks.aplicarCupon,
  getDatosTransferenciaVendedor: mocks.getDatosTransferenciaVendedor,
  getDirecciones: mocks.getDirecciones,
  getOrderDetails: mocks.getOrderDetails,
  getApiBaseUrl: mocks.getApiBaseUrl,
  notificarLlegadaTienda: mocks.notificarLlegadaTienda,
  processPayment: mocks.processPayment,
  reservarRetiroEnTienda: mocks.reservarRetiroEnTienda,
  sendConfirmationEmail: mocks.sendConfirmationEmail,
  validarCupon: mocks.validarCupon,
  changePassword: mocks.changePassword,
  getProfile: mocks.getProfile,
  updatePreferences: mocks.updatePreferences,
  getConfigLibreria: mocks.getConfigLibreria,
  updateConfigLibreria: mocks.updateConfigLibreria,
  uploadTiendaImage: mocks.uploadTiendaImage,
  getCuponesVendedor: mocks.getCuponesVendedor,
  crearCupon: mocks.crearCupon,
  actualizarCupon: mocks.actualizarCupon,
  eliminarCupon: mocks.eliminarCupon,
}));

const initialOrder = {
  id_orden: 21,
  id_orden_db: 21,
  estado: 'pendiente',
  tipo_entrega: 'domicilio',
  total: 110000,
  subtotal: 100000,
  costo_envio: 10000,
  id_direccion: 1,
  fecha: '2026-04-15T12:00:00',
  items: [{
    id_libro: 5,
    titulo: 'Libro de prueba',
    cantidad: 2,
    precio_libro: 50000,
    variante_label: 'Tapa blanda',
  }],
  desglose_envio: [{ id_tienda: 8 }],
};

const addresses = [{
  id_direccion: 1,
  alias_direccion: 'Casa',
  direccion: 'Calle 10 #20-30',
  direccion_completa: 'Calle 10 #20-30',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  telefono_contacto: '3001234567',
  es_principal: true,
}];

const navigation = { goBack: vi.fn(), navigate: vi.fn() };

function renderCheckout(order) {
  if (order) mocks.getOrderDetails.mockResolvedValue({ data: order });
  return render(
    <AuthContext.Provider value={{ token: 'test-token' }}>
      <CartContext.Provider value={{ loadCart: mocks.loadCart }}>
        <Checkout route={{ params: { orderId: 21 } }} navigation={navigation} />
      </CartContext.Provider>
    </AuthContext.Provider>,
  );
}

function renderBuyerSettings() {
  return render(<ConfiguracionComprador />);
}

function renderStoreSettings() {
  return render(
    <AuthContext.Provider value={{ user: { id_tienda: 8 }, signOut: vi.fn() }}>
      <ConfiguracionTienda navigation={navigation} />
    </AuthContext.Provider>,
  );
}

function renderSellerCoupons() {
  return render(
    <AuthContext.Provider value={{ user: { id_tienda: 8 }, signOut: vi.fn() }}>
      <CuponesVendedor navigation={navigation} />
    </AuthContext.Provider>,
  );
}

const sellerCoupons = [
  {
    id_cupon: 1,
    codigo_cupon: 'ACTIVO',
    tipo_descuento: 'porcentaje',
    valor_descuento: 15,
    minimo_compra: 50000,
    usos_actuales: 9,
    usos_maximos: 10,
    fecha_inicio: new Date(Date.now() - 86400000).toISOString(),
    fecha_fin: new Date(Date.now() + 86400000).toISOString(),
    activo: true,
  },
  {
    id_cupon: 2,
    codigo_cupon: 'PROXIMO',
    tipo_descuento: 'fijo',
    valor_descuento: 5000,
    usos_actuales: 0,
    usos_maximos: null,
    fecha_inicio: new Date(Date.now() + 86400000).toISOString(),
    fecha_fin: new Date(Date.now() + 2 * 86400000).toISOString(),
    activo: true,
  },
  {
    id_cupon: 3,
    codigo_cupon: 'VENCIDO',
    tipo_descuento: 'porcentaje',
    valor_descuento: 10,
    usos_actuales: 1,
    usos_maximos: 5,
    fecha_inicio: new Date(Date.now() - 3 * 86400000).toISOString(),
    fecha_fin: new Date(Date.now() - 86400000).toISOString(),
    activo: true,
  },
  {
    id_cupon: 4,
    codigo_cupon: 'PAUSADO',
    tipo_descuento: 'porcentaje',
    valor_descuento: 5,
    usos_actuales: 0,
    usos_maximos: 0,
    activo: false,
  },
];

describe('Checkout and buyer/store settings coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.loadCart.mockResolvedValue(undefined);
    mocks.actualizarCostoEnvio.mockResolvedValue({
      data: { ok: true, total: 110000, costo_envio: 10000, desglose_envio: [{ id_tienda: 8 }] },
    });
    mocks.aplicarCupon.mockResolvedValue({ data: { ok: true } });
    mocks.getDatosTransferenciaVendedor.mockResolvedValue({ data: { vendedores: [] } });
    mocks.getDirecciones.mockResolvedValue({ data: addresses });
    mocks.getOrderDetails.mockResolvedValue({ data: initialOrder });
    mocks.getApiBaseUrl.mockReturnValue('https://api.example.test');
    mocks.notificarLlegadaTienda.mockResolvedValue({ data: { ok: true } });
    mocks.processPayment.mockResolvedValue({ data: { ok: true } });
    mocks.reservarRetiroEnTienda.mockResolvedValue({ data: { ok: true, pin_retiro: '123456' } });
    mocks.sendConfirmationEmail.mockResolvedValue({ data: { ok: true } });
    mocks.validarCupon.mockResolvedValue({ data: { valido: true, descuento: 15000, mensaje: 'Cupón aplicado' } });
    mocks.changePassword.mockResolvedValue({ data: { ok: true } });
    mocks.getProfile.mockResolvedValue({
      data: { nombre: 'Ana', preferencias: { notificaciones_mensajes: { email: false, web: true } } },
    });
    mocks.updatePreferences.mockResolvedValue({ data: { ok: true } });
    mocks.getConfigLibreria.mockResolvedValue({
      data: {
        descripcion: 'Librería de barrio',
        ciudad_origen: 'Bogotá',
        email_publico: 'tienda@example.test',
        horario_atencion: 'Lun-Vie',
        tiempo_despacho_dias: 3,
        politica_envios: 'Envíos nacionales',
        politica_devoluciones: 'Cambios en 30 días',
      },
    });
    mocks.updateConfigLibreria.mockResolvedValue({ data: { ok: true } });
    mocks.uploadTiendaImage.mockResolvedValue({ data: { url: '/uploads/logo.jpg' } });
    mocks.getCuponesVendedor.mockResolvedValue({ data: sellerCoupons });
    mocks.crearCupon.mockResolvedValue({ data: { id_cupon: 9 } });
    mocks.actualizarCupon.mockResolvedValue({ data: { ok: true } });
    mocks.eliminarCupon.mockResolvedValue({ data: { ok: true } });
    mocks.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mocks.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/logo.jpg' }],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('carga el pedido, cambia la dirección seleccionada y aplica un cupón válido', async () => {
    renderCheckout();

    expect(await screen.findByText('Entrega y Pago')).toBeTruthy();
    expect(screen.getByText('Libro de prueba x2')).toBeTruthy();
    expect(screen.getAllByText('Casa').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText('Código de cupón'), { target: { value: 'LIBROS15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(await screen.findByText('Cupón aplicado')).toBeTruthy();
    expect(mocks.validarCupon).toHaveBeenCalledWith({
      codigo: 'LIBROS15',
      order_id: 21,
      total: 110000,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar dirección de entrega' }));
    const addressOptions = screen.getAllByRole('button')
      .filter((button) => button.textContent.includes('Calle 10'));
    fireEvent.click(addressOptions[addressOptions.length - 1]);
    expect(screen.getByText(/Destino activo/)).toBeTruthy();
  });

  it('valida los datos de tarjeta y completa el pago con correo de confirmación', async () => {
    renderCheckout();
    const payButton = await screen.findByRole('button', { name: /Pagar/ });

    fireEvent.click(payButton);
    expect(mocks.alert).toHaveBeenCalledWith('Error', 'Ingresa el nombre del titular');

    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'Ana Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '4111111111111111' } });
    fireEvent.change(screen.getByPlaceholderText('MM/AA'), { target: { value: '1228' } });
    fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '123' } });

    vi.useFakeTimers();
    fireEvent.click(payButton);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mocks.processPayment).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 21,
      amount: 110000,
      payment_method: 'Tarjeta de Crédito',
      id_direccion: 1,
    }));
    expect(mocks.sendConfirmationEmail).toHaveBeenCalledWith(21);
    expect(mocks.loadCart).toHaveBeenCalledOnce();
    expect(screen.getByText('¡Pago Exitoso!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Volver al Catálogo' }));
    expect(navigation.navigate).toHaveBeenCalledWith('PostLogin');
  });

  it('muestra la confirmación de una orden que ya estaba pagada', async () => {
    renderCheckout({ ...initialOrder, estado: 'pagado' });
    expect(await screen.findByText('¡Pago Exitoso!')).toBeTruthy();
  });

  it('guarda las preferencias de notificación y valida que las contraseñas coincidan', async () => {
    renderBuyerSettings();
    const emailSwitch = await screen.findByRole('switch', { name: 'Email: Mensajes' });
    fireEvent.click(emailSwitch);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(mocks.updatePreferences).toHaveBeenCalled());
    expect(mocks.updatePreferences.mock.calls[0][0].notificaciones_mensajes.email).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar Contraseña' }));
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña actual'), { target: { value: 'OldPass1!' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'NewPass1!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirma tu nueva contraseña'), { target: { value: 'OtherPass1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));

    expect(screen.getByText('Las contraseñas nuevas no coinciden.')).toBeTruthy();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it('cambia la contraseña tras validar los campos y permite cancelar el formulario', async () => {
    renderBuyerSettings();
    fireEvent.click(await screen.findByRole('button', { name: 'Cambiar Contraseña' }));
    fireEvent.change(screen.getByPlaceholderText('Ingresa tu contraseña actual'), { target: { value: 'OldPass1!' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'NewPass1!' } });
    fireEvent.change(screen.getByPlaceholderText('Confirma tu nueva contraseña'), { target: { value: 'NewPass1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }));

    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith({
      password_actual: 'OldPass1!',
      password_nueva: 'NewPass1!',
    }));
    expect(mocks.alert).toHaveBeenCalledWith('Listo', 'Contraseña actualizada correctamente');
  });

  it('actualiza la configuración de tienda y sube una imagen seleccionada', async () => {
    renderStoreSettings();
    const description = await screen.findByPlaceholderText('Descripción breve de tu tienda...');
    fireEvent.change(description, { target: { value: 'Libros para todos' } });
    fireEvent.change(screen.getByPlaceholderText('Días promedio de despacho'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

    await waitFor(() => expect(mocks.updateConfigLibreria).toHaveBeenCalledWith(
      expect.objectContaining({ descripcion: 'Libros para todos', tiempo_despacho_dias: 5 }),
    ));
    expect(navigation.goBack).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Subir Logo' }));
    await waitFor(() => expect(mocks.uploadTiendaImage).toHaveBeenCalled());
    const formData = mocks.uploadTiendaImage.mock.calls[0][0];
    expect(formData.get('tipo')).toBe('logo');
    expect((await screen.findByAltText('')).getAttribute('src')).toBe('https://api.example.test/uploads/logo.jpg');
  });

  it('muestra los estados de cupones, valida y crea uno con fechas', async () => {
    renderSellerCoupons();
    expect(await screen.findByText('ACTIVO')).toBeTruthy();
    expect(screen.getByText('Próximos')).toBeTruthy();
    expect(screen.getByText('Vencido')).toBeTruthy();
    expect(screen.getByText('Inactivo')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear cupón' }));
    expect(screen.getByText('El código del cupón es obligatorio')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Ej: VERANO25'), { target: { value: 'verano25' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 15'), { target: { value: '15' } });
    fireEvent.change(screen.getByPlaceholderText('0 = sin mínimo'), { target: { value: '50000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fecha y hora de inicio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fecha y hora de fin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear cupón' }));

    await waitFor(() => expect(mocks.crearCupon).toHaveBeenCalledWith({
      codigo_cupon: 'VERANO25',
      tipo_descuento: 'porcentaje',
      valor_descuento: 15,
      minimo_compra: 50000,
      usos_maximos: 1,
      fecha_inicio: '2026-01-01 10:00:00',
      fecha_fin: '2026-12-31 10:00:00',
      activo: true,
    }));
    expect(mocks.getCuponesVendedor).toHaveBeenCalledWith(8);
  });

  it('edita y elimina cupones después de confirmar', async () => {
    renderSellerCoupons();
    await screen.findByText('ACTIVO');

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    fireEvent.change(screen.getByPlaceholderText('Ej: 15'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => expect(mocks.actualizarCupon).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ valor_descuento: 25, activo: false }),
    ));

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);
    expect(screen.getByText('Eliminar cupón')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mocks.eliminarCupon).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(mocks.eliminarCupon).toHaveBeenCalledWith(1));
  });
});
