// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PerfilVendedor from '../../screens/PerfilVendedor';
import QuejasVendedor from '../../screens/QuejasVendedor';
import { AuthContext } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  createDireccion: vi.fn(),
  enviarMensajeReclamo: vi.fn(),
  getDirecciones: vi.fn(),
  getMensajesReclamo: vi.fn(),
  getProfile: vi.fn(),
  getQuejasVendedor: vi.fn(),
  resolveImageUrl: vi.fn((value) => value || null),
  saveBannerColor: vi.fn(),
  updateDireccion: vi.fn(),
  updatePreferences: vi.fn(),
  updateProfile: vi.fn(),
  uploadBannerPhoto: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const element = (tag) => function NativeElement({
    children,
    onPress,
    onChangeText,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
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
        'aria-checked': accessibilityState?.checked,
        'aria-selected': accessibilityState?.selected,
        role: accessibilityRole || 'button',
      }, children);
    }
    if (tag === 'input' || tag === 'textarea') {
      return ReactModule.createElement(tag, {
        value: value ?? '',
        placeholder,
        disabled: disabled || props.editable === false,
        'aria-label': accessibilityLabel,
        onChange: (event) => onChangeText?.(event.target.value),
      });
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', { src: props.source?.uri });
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  return {
    ActivityIndicator: element('span'),
    Alert: { alert: mocks.alert },
    Image: element('img'),
    KeyboardAvoidingView: element('div'),
    Modal: ({ visible, children }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' }, children)
      : null,
    Platform: { OS: 'web' },
    SafeAreaView: element('div'),
    ScrollView: element('div'),
    StyleSheet: {
      absoluteFill: {},
      create: (styles) => styles,
    },
    Text: element('span'),
    TextInput: element('input'),
    TouchableOpacity: element('button'),
    View: element('div'),
    useWindowDimensions: () => ({ width: 900, height: 900 }),
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));
vi.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'images' },
  requestMediaLibraryPermissionsAsync: mocks.requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync: mocks.launchImageLibraryAsync,
}));
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => <div data-testid="gradient">{children}</div>,
}));
vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({ darkMode: false }),
  useThemedStyles: (styles) => styles,
}));
vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({ user: null, signOut: vi.fn() }) };
});
vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible, onClose, onSignOut }) => visible ? (
    <nav>
      <button onClick={onClose}>Cerrar menú</button>
      <button onClick={onSignOut}>Salir</button>
    </nav>
  ) : null,
}));
vi.mock('../../components/Icons', () => {
  const Icon = () => null;
  return {
    IconAlertTriangle: Icon,
    IconBookOpen: Icon,
    IconCheck: Icon,
    IconClose: Icon,
    IconCreditCard: Icon,
    IconEye: Icon,
    IconMenu: Icon,
    IconMessage: Icon,
    IconPackage: Icon,
    IconSearch: Icon,
    IconStar: Icon,
    IconUser: Icon,
  };
});
vi.mock('../../screens/MetodosCobroVendedor', () => ({
  default: () => <div>Métodos de cobro integrados</div>,
}));
vi.mock('../../screens/SuscripcionesVendedor', () => ({
  default: () => <div>Suscripciones integradas</div>,
}));
vi.mock('../../screens/ImpulsosVendedor', () => ({
  default: () => <div>Impulsos integrados</div>,
}));
vi.mock('../../services/api', () => ({
  createDireccion: mocks.createDireccion,
  enviarMensajeReclamo: mocks.enviarMensajeReclamo,
  getDirecciones: mocks.getDirecciones,
  getMensajesReclamo: mocks.getMensajesReclamo,
  getProfile: mocks.getProfile,
  getQuejasVendedor: mocks.getQuejasVendedor,
  resolveImageUrl: mocks.resolveImageUrl,
  saveBannerColor: mocks.saveBannerColor,
  updateDireccion: mocks.updateDireccion,
  updatePreferences: mocks.updatePreferences,
  updateProfile: mocks.updateProfile,
  uploadBannerPhoto: mocks.uploadBannerPhoto,
  uploadProfilePhoto: mocks.uploadProfilePhoto,
}));

const address = {
  id_direccion: 5,
  alias_direccion: 'Casa',
  direccion: 'Calle 1',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  codigo_postal: '110111',
  es_principal: true,
};
const complaints = [
  {
    id_solicitud: 20,
    id_orden: 10,
    estado: 'Abierto',
    asunto: 'Libro dañado',
    descripcion: 'Portada rota',
    comprador: 'Ana',
    correo_comprador: 'ana@example.test',
    titulo_libro: 'Libro azul',
    nombre_tienda: 'Librería',
    categoria: 'Estado del libro',
    total_items: 2,
    total_orden: 25000,
    fecha_creacion: '2026-11-10T10:00:00',
    evidencia_url: '/evidencia.jpg',
    imagen_libro: '/libro.jpg',
  },
  {
    id_solicitud: 21,
    id_orden: 11,
    estado: 'En revisión',
    asunto: 'Demora',
    descripcion: '',
    comprador: 'Bruno',
    titulo_libro: 'Libro verde',
    fecha_creacion: 'fecha invalida',
    total_orden: 'no válido',
  },
  { id_solicitud: 22, id_orden: 12, estado: 'Resuelto', asunto: 'Resuelto' },
  { id_solicitud: 23, id_orden: 13, estado: 'Rechazado', asunto: 'Cerrado' },
];

const renderWithAuth = (screenComponent, signOut = vi.fn()) => render(
  <AuthContext.Provider value={{ user: { nombre_tienda: 'Tienda de prueba' }, signOut }}>
    {screenComponent}
  </AuthContext.Provider>,
);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getProfile.mockResolvedValue({
    data: {
      nombre_usuario: 'Ana María López',
      correo_usuario: 'ana@example.test',
      telefono: '3001234567',
      banner_color: 'linear-gradient(135deg, #123456, #654321)',
      preferencias: { notificaciones_ofertas: { email: false, web: false } },
    },
  });
  mocks.getDirecciones.mockResolvedValue({ data: [address] });
  mocks.getQuejasVendedor.mockResolvedValue({ data: complaints });
  mocks.getMensajesReclamo.mockResolvedValue({ data: [] });
  mocks.createDireccion.mockResolvedValue({ data: { ...address, id_direccion: 9 } });
  mocks.updateDireccion.mockResolvedValue({});
  mocks.updateProfile.mockResolvedValue({});
  mocks.updatePreferences.mockResolvedValue({});
  mocks.saveBannerColor.mockResolvedValue({});
  mocks.uploadBannerPhoto.mockResolvedValue({ data: { url: '/banner.jpg' } });
  mocks.uploadProfilePhoto.mockResolvedValue({ data: { url: '/foto.jpg' } });
  mocks.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
  mocks.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PerfilVendedor', () => {
  it('carga y guarda los datos, valida los campos y actualiza las preferencias', async () => {
    renderWithAuth(<PerfilVendedor navigation={{ navigate: vi.fn() }} />);
    await screen.findByText('Información Personal');
    expect(screen.getByText('Tienda de prueba')).toBeTruthy();
    expect(screen.getByTestId('gradient')).toBeTruthy();
    expect(screen.getByLabelText('Correo electrónico').disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: ' ' } });
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: ' ' } });
    fireEvent.click(screen.getAllByText('Guardar cambios')[0]);
    expect(mocks.alert).toHaveBeenLastCalledWith('Datos incompletos', 'Escribe al menos un nombre o apellido.');

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: ' Laura ' } });
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Cali' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: '' } });
    fireEvent.click(screen.getAllByText('Guardar cambios')[0]);
    expect(mocks.alert).toHaveBeenLastCalledWith(
      'Datos incompletos', 'Escribe la dirección completa para guardar la ciudad del perfil.',
    );

    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: '  Calle 2  ' } });
    fireEvent.click(screen.getAllByText('Guardar cambios')[0]);
    await waitFor(() => expect(mocks.updateDireccion).toHaveBeenCalledWith(
      5, expect.objectContaining({ direccion: 'Calle 2', ciudad: 'Cali', es_principal: true }),
    ));
    expect(mocks.updateProfile).toHaveBeenCalledWith({
      nombre_usuario: 'Laura', telefono: '3001234567',
    });

    const offers = screen.getByRole('switch', { name: /Promociones/ });
    expect(offers.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(offers);
    expect(offers.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getAllByText('Guardar cambios')[1]);
    await waitFor(() => expect(mocks.updatePreferences).toHaveBeenCalledOnce());
    expect(mocks.alert).toHaveBeenCalledWith(
      'Preferencias', 'Tus preferencias de notificaciones se guardaron correctamente.',
    );
  });

  it('crea una dirección nueva, permite personalizar el banner y navega por las secciones', async () => {
    mocks.getDirecciones.mockResolvedValue({ data: [] });
    renderWithAuth(<PerfilVendedor navigation={{ navigate: vi.fn() }} />);
    await screen.findByText('Información Personal');

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Lucía' } });
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Medellín' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Carrera 3' } });
    fireEvent.click(screen.getAllByText('Guardar cambios')[0]);
    await waitFor(() => expect(mocks.createDireccion).toHaveBeenCalledWith(
      expect.objectContaining({ direccion: 'Carrera 3', ciudad: 'Medellín' }),
    ));

    fireEvent.click(screen.getByText('✏️ Editar banner'));
    fireEvent.click(screen.getByLabelText('Usar banner color #1E3A7A'));
    await waitFor(() => expect(mocks.saveBannerColor).toHaveBeenCalledWith('#1E3A7A'));

    fireEvent.click(screen.getByText('Métodos de cobro'));
    expect(screen.getByText('Métodos de cobro integrados')).toBeTruthy();
    fireEvent.click(screen.getByText('Suscripciones'));
    expect(screen.getByText('Suscripciones integradas')).toBeTruthy();
    fireEvent.click(screen.getByText('Impulsos'));
    expect(screen.getByText('Impulsos integrados')).toBeTruthy();
  });

  it('maneja errores de carga, permisos de imagen, cargas y guardado de preferencias', async () => {
    mocks.getProfile.mockRejectedValueOnce({ response: { data: { detail: 'Perfil no disponible' } } });
    const signOut = vi.fn();
    renderWithAuth(<PerfilVendedor navigation={{ navigate: vi.fn() }} />, signOut);
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Perfil', 'Perfil no disponible'));

    mocks.getProfile.mockResolvedValue({ data: { nombre_usuario: 'Eva' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú del vendedor' }));
    fireEvent.click(screen.getByText('Salir'));
    expect(signOut).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Cerrar menú'));

    await waitFor(() => expect(screen.getByText('Información Personal')).toBeTruthy());
    fireEvent.click(screen.getByLabelText('Cambiar foto de perfil'));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith(
      'Permiso requerido', 'Se necesita acceso a la galería para seleccionar una imagen.',
    ));

    mocks.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mocks.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'blob:foto.jpg?token=1', file: new File(['foto'], 'foto.jpg', { type: 'image/jpeg' }), mimeType: 'image/jpeg' }],
    });
    vi.stubGlobal('FormData', class {
      append = vi.fn();
    });
    mocks.uploadProfilePhoto.mockResolvedValueOnce({ data: { url: null } });
    fireEvent.click(screen.getByLabelText('Cambiar foto de perfil'));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith(
      'Perfil', 'No se pudo actualizar la foto de perfil.',
    ));

    mocks.updatePreferences.mockRejectedValueOnce({ response: { data: { message: 'Preferencias fallidas' } } });
    fireEvent.click(screen.getAllByText('Guardar cambios')[1]);
    await waitFor(() => expect(mocks.alert).toHaveBeenLastCalledWith('Preferencias', 'Preferencias fallidas'));
  });
});

describe('QuejasVendedor', () => {
  it('presenta conteos y filtros, busca casos y abre sus detalles, evidencia y conversación', async () => {
    renderWithAuth(<QuejasVendedor navigation={{ navigate: vi.fn() }} />);
    expect(await screen.findByText('Bandeja de reclamos')).toBeTruthy();
    expect(screen.getByText('4 casos')).toBeTruthy();
    expect(screen.getByText('Libro dañado')).toBeTruthy();
    expect(screen.getByText('Demora')).toBeTruthy();

    fireEvent.click(screen.getByText('Abiertos'));
    expect(screen.getByText('1 casos')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /En revisión/ }));
    expect(screen.getByText('1 casos')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Resueltos/ }));
    expect(screen.getByText('1 casos')).toBeTruthy();
    fireEvent.click(screen.getByText('Todos'));
    fireEvent.change(screen.getByLabelText('Buscar reclamos por comprador u orden'), {
      target: { value: 'bruno' },
    });
    expect(screen.getByText('1 casos')).toBeTruthy();
    expect(screen.getByText('Demora')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Limpiar búsqueda'));
    expect(screen.getByText('4 casos')).toBeTruthy();

    mocks.getMensajesReclamo.mockResolvedValueOnce({
      data: [
        { id_mensaje: 1, rol: 'vendedor', mensaje: 'Estamos revisando', nombre_usuario: 'Tienda', fecha_creacion: '2026-11-10' },
        { id_mensaje: 2, rol: 'administrador', mensaje: 'Gracias', fecha_creacion: null },
        { id_mensaje: 3, rol: 'cliente', mensaje: 'De acuerdo' },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir reclamo 20, Libro dañado' }));
    const detail = await screen.findByRole('dialog');
    expect(within(detail).getByText('Detalle del reclamo')).toBeTruthy();
    expect(within(detail).getByText(/25\.000/)).toBeTruthy();
    expect(within(detail).getByText('Estamos revisando')).toBeTruthy();
    expect(within(detail).getByText('Administración')).toBeTruthy();
    expect(within(detail).getAllByText('Comprador').length).toBeGreaterThan(1);

    fireEvent.click(within(detail).getByText('Ver evidencia adjunta'));
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
    fireEvent.click(screen.getByLabelText('Cerrar evidencia'));
    fireEvent.click(within(detail).getByText('Actualizar'));
    await waitFor(() => expect(mocks.getMensajesReclamo).toHaveBeenCalledTimes(2));

    fireEvent.click(within(detail).getByText(/Hola, lamentamos el inconveniente/));
    fireEvent.click(within(detail).getByLabelText('Enviar respuesta'));
    await waitFor(() => expect(mocks.enviarMensajeReclamo).toHaveBeenCalledWith(
      20, 'Hola, lamentamos el inconveniente. Estamos revisando lo sucedido con tu pedido.',
    ));
  });

  it('muestra errores, permite reintentar, y presenta estados vacíos y fallos del chat', async () => {
    mocks.getQuejasVendedor.mockRejectedValueOnce({ message: 'Sin conexión' });
    renderWithAuth(<QuejasVendedor navigation={{ navigate: vi.fn() }} />);
    expect(await screen.findByText('Sin conexión')).toBeTruthy();

    mocks.getQuejasVendedor.mockResolvedValueOnce({ data: [] });
    fireEvent.click(screen.getByText('Reintentar'));
    expect(await screen.findByText('Aún no tienes reclamos')).toBeTruthy();

    mocks.getQuejasVendedor.mockResolvedValue({ data: complaints });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(await screen.findByText('Libro dañado')).toBeTruthy();

    mocks.getMensajesReclamo.mockRejectedValueOnce({ response: { data: { detail: 'Chat no disponible' } } });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir reclamo 21, Demora' }));
    const detail = await screen.findByRole('dialog');
    expect(await within(detail).findByText('Chat no disponible')).toBeTruthy();

    mocks.getMensajesReclamo.mockResolvedValueOnce({ data: null });
    fireEvent.click(within(detail).getByText('Actualizar'));
    expect(await within(detail).findByText('El servidor devolvió una conversación no válida.')).toBeTruthy();

    fireEvent.change(within(detail).getByLabelText('Escribir respuesta al reclamo'), {
      target: { value: '   ' },
    });
    fireEvent.click(within(detail).getByLabelText('Enviar respuesta'));
    expect(mocks.enviarMensajeReclamo).not.toHaveBeenCalled();

    fireEvent.change(within(detail).getByLabelText('Escribir respuesta al reclamo'), {
      target: { value: 'Respuesta' },
    });
    mocks.enviarMensajeReclamo.mockRejectedValueOnce({ message: 'No se pudo responder' });
    fireEvent.click(within(detail).getByLabelText('Enviar respuesta'));
    expect(await within(detail).findByText('No se pudo responder')).toBeTruthy();
    fireEvent.click(within(detail).getByLabelText('Cerrar detalle'));
  });
});
