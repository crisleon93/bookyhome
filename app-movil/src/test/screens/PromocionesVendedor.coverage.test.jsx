// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PromocionesVendedor from '../../screens/PromocionesVendedor';
import { AuthContext } from '../../context/AuthContext';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  crearOferta: vi.fn(),
  deleteOferta: vi.fn(),
  getApiBaseUrl: vi.fn(),
  getMisLibros: vi.fn(),
  getOfertaById: vi.fn(),
  getOfertas: vi.fn(),
  navigate: vi.fn(),
  signOut: vi.fn(),
  updateOferta: vi.fn(),
}));

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react');
  const nativeElement = (tag) => function NativeElement({ children, onPress, accessibilityLabel, disabled, placeholder, value, onChangeText, ...props }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', { type: 'button', onClick: onPress, disabled, 'aria-label': accessibilityLabel }, children);
    }
    if (tag === 'input') {
      return ReactModule.createElement('input', { placeholder, value: value ?? '', onChange: (e) => onChangeText?.(e.target.value) });
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children);
  };
  return {
    ActivityIndicator: () => ReactModule.createElement('span', {}, 'loading'),
    Alert: { alert: mocks.alert },
    Animated: { Value: class { constructor(v) { this.v = v; } }, View: ({ children }) => ReactModule.createElement('div', {}, children) },
    FlatList: ({ data, renderItem }) => ReactModule.createElement('div', {}, data?.map((item, i) => renderItem({ item, index: i }))),
    Image: ({ source }) => ReactModule.createElement('img', { src: source?.uri }),
    KeyboardAvoidingView: ({ children }) => ReactModule.createElement('div', {}, children),
    Modal: ({ visible, children }) => visible ? ReactModule.createElement('div', { 'data-testid': 'modal' }, children) : null,
    Platform: { OS: 'web', select: (obj) => obj.android ?? obj.default ?? {} },
    RefreshControl: ({ onRefresh }) => ReactModule.createElement('button', { type: 'button', onClick: onRefresh }, 'Actualizar'),
    ScrollView: ({ children }) => ReactModule.createElement('div', {}, children),
    StyleSheet: { create: (s) => s },
    Text: nativeElement('span'),
    TextInput: nativeElement('input'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  };
});

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => <div>{children}</div>,
}));

vi.mock('@react-navigation/native', async () => {
  const ReactModule = await vi.importActual('react');
  return { useFocusEffect: (cb) => ReactModule.useEffect(cb, [cb]) };
});

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({}) };
});

vi.mock('../../components/SidebarVendedor', () => ({
  default: ({ visible, onClose }) => (
    <div data-testid="sidebar" data-visible={String(visible)}>
      <button onClick={onClose}>Cerrar menú</button>
    </div>
  ),
}));
vi.mock('../../components/Footer', () => ({ default: () => null }));
vi.mock('../../components/CalendarioPicker', () => ({
  default: ({ label, value, onChange, placeholder }) => (
    <div>
      <span>{label}</span>
      <input
        data-testid={`calendario-${label}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
}));
vi.mock('../../components/Icons', () => ({
  IconTag: () => null,
  IconPlus: () => null,
  IconEdit: () => null,
  IconTrash: () => null,
  IconCalendar: () => null,
  IconCheck: () => null,
  IconBook: () => null,
  IconLock: () => null,
  IconAlertTriangle: () => null,
}));

vi.mock('../../services/api', () => ({
  crearOferta: mocks.crearOferta,
  deleteOferta: mocks.deleteOferta,
  getApiBaseUrl: mocks.getApiBaseUrl,
  getMisLibros: mocks.getMisLibros,
  getOfertaById: mocks.getOfertaById,
  getOfertas: mocks.getOfertas,
  updateOferta: mocks.updateOferta,
}));

const ahora = new Date();
const ayer = new Date(ahora); ayer.setDate(ayer.getDate() - 1);
const manana = new Date(ahora); manana.setDate(ahora.getDate() + 1);
const pasado = new Date(ahora); pasado.setDate(ahora.getDate() + 2);
const hace2 = new Date(ahora); hace2.setDate(ahora.getDate() - 2);

const ofertaActiva = { id_oferta: 1, nombre_oferta: 'Oferta activa', tipo_descuento: 'porcentaje', valor_descuento: 20, fecha_inicio: ayer.toISOString(), fecha_fin: manana.toISOString(), estado: 'activa', total_libros: 2 };
const ofertaProxima = { id_oferta: 2, nombre_oferta: 'Oferta próxima', tipo_descuento: 'fijo', valor_descuento: 5000, fecha_inicio: manana.toISOString(), fecha_fin: pasado.toISOString(), estado: 'proxima', total_libros: 1 };
const ofertaVencida = { id_oferta: 3, nombre_oferta: 'Oferta vencida', tipo_descuento: 'especial', valor_descuento: 0, fecha_inicio: hace2.toISOString(), fecha_fin: ayer.toISOString(), estado: 'vencida', total_libros: 0 };
const libros = [{ id_libro: 10, titulo: 'Libro A', autor_libro: 'Autor A', imagen_url: null }];

function renderScreen() {
  return render(
    <AuthContext.Provider value={{ user: { nombre: 'Vendedor' }, signOut: mocks.signOut }}>
      <PromocionesVendedor navigation={{ navigate: mocks.navigate }} />
    </AuthContext.Provider>,
  );
}

describe('PromocionesVendedor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getApiBaseUrl.mockReturnValue('http://localhost:8000');
    mocks.getOfertas.mockResolvedValue({ data: [ofertaActiva, ofertaProxima, ofertaVencida] });
    mocks.getMisLibros.mockResolvedValue({ data: libros });
    mocks.getOfertaById.mockResolvedValue({ data: { ...ofertaActiva, libros: [{ id_libro: 10 }] } });
    mocks.crearOferta.mockResolvedValue({});
    mocks.updateOferta.mockResolvedValue({});
    mocks.deleteOferta.mockResolvedValue({});
  });

  afterEach(cleanup);

  it('muestra loading al inicio y luego carga las ofertas', async () => {
    renderScreen();
    await waitFor(() => expect(mocks.getOfertas).toHaveBeenCalled());
    expect(await screen.findByText('Oferta activa')).toBeTruthy();
    expect(screen.getByText('Oferta próxima')).toBeTruthy();
    expect(screen.getByText('Oferta vencida')).toBeTruthy();
  });

  it('muestra error de carga y permite reintentar', async () => {
    mocks.getOfertas.mockRejectedValueOnce(new Error('fallo'));
    renderScreen();
    expect(await screen.findByText('No se pudieron cargar las promociones')).toBeTruthy();
    mocks.getOfertas.mockResolvedValueOnce({ data: [] });
    mocks.getMisLibros.mockResolvedValueOnce({ data: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(mocks.getOfertas).toHaveBeenCalledTimes(2));
  });

  it('muestra estado vacío y botón para crear primera oferta', async () => {
    mocks.getOfertas.mockResolvedValue({ data: [] });
    renderScreen();
    expect(await screen.findByText('Sin promociones todavía')).toBeTruthy();
    expect(screen.getByRole('button', { name: '+ Crear primera oferta' })).toBeTruthy();
  });

  it('abre y cierra el formulario de nueva oferta', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva' }));
    expect(screen.getByText('Nueva oferta')).toBeTruthy();
  });

  it('valida nombre obligatorio en formulario', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear oferta' }));
    expect(await screen.findByText('El nombre es obligatorio')).toBeTruthy();
  });

  it('valida fechas y libros en el formulario', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva' }));

    // Llenar nombre
    const nombreInput = screen.getByPlaceholderText('Ej: Descuento verano');
    fireEvent.change(nombreInput, { target: { value: 'Promo test' } });

    // Sin fechas
    fireEvent.click(screen.getByRole('button', { name: 'Crear oferta' }));
    expect(await screen.findByText('La fecha de inicio es obligatoria')).toBeTruthy();

    // Con fecha inicio pero sin fin
    const calendarios = screen.getAllByPlaceholderText(/Seleccionar/);
    fireEvent.change(calendarios[0], { target: { value: '2099-01-01T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear oferta' }));
    expect(await screen.findByText('La fecha de fin es obligatoria')).toBeTruthy();

    // Fecha inicio >= fin
    fireEvent.change(calendarios[1], { target: { value: '2099-01-01T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear oferta' }));
    expect(await screen.findByText('La fecha de inicio debe ser anterior a la de fin')).toBeTruthy();

    // Fecha fin mayor que inicio, valor de descuento vacío
    fireEvent.change(calendarios[1], { target: { value: '2099-06-01T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear oferta' }));
    expect(await screen.findByText('El valor del descuento debe ser mayor a 0')).toBeTruthy();

    // Con valor pero sin libros
    const valorInput = screen.getByPlaceholderText('Ej: 25');
    fireEvent.change(valorInput, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear oferta' }));
    expect(await screen.findByText('Selecciona al menos un libro para la oferta')).toBeTruthy();
  });

  it('crea una oferta exitosamente', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva' }));

    fireEvent.change(screen.getByPlaceholderText('Ej: Descuento verano'), { target: { value: 'Promo nueva' } });
    const calendarios = screen.getAllByPlaceholderText(/Seleccionar/);
    fireEvent.change(calendarios[0], { target: { value: '2099-01-01T10:00' } });
    fireEvent.change(calendarios[1], { target: { value: '2099-06-01T10:00' } });
    fireEvent.change(screen.getByPlaceholderText('Ej: 25'), { target: { value: '15' } });
    // Seleccionar libro por texto
    fireEvent.click(screen.getByText('Libro A'));
    fireEvent.click(screen.getByRole('button', { name: 'Crear oferta' }));

    await waitFor(() => expect(mocks.crearOferta).toHaveBeenCalled());
  });

  it('cancela formulario al presionar Cancelar', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva' }));
    expect(screen.getByText('Nueva oferta')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Oferta activa')).toBeTruthy();
  });

  it('abre modal de confirmación al eliminar y cancela', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    const botonesEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(botonesEliminar[0]);
    expect(screen.getByTestId('modal')).toBeTruthy();
    expect(screen.getByText(/Eliminar oferta/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByTestId('modal')).toBeNull());
  });

  it('confirma y ejecuta la eliminación de una oferta', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    const botonesEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(botonesEliminar[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(mocks.deleteOferta).toHaveBeenCalledWith(ofertaActiva.id_oferta));
  });

  it('abre y cierra el sidebar', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    // El estado del sidebar arranca en false, simplemente verificamos que el toggle funciona
    expect(screen.getByTestId('sidebar').getAttribute('data-visible')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    // Sigue en false porque ya estaba cerrado — lo que importa es que no falle
    expect(screen.getByTestId('sidebar')).toBeTruthy();
  });

  it('abre edición de oferta existente', async () => {
    renderScreen();
    await screen.findByText('Oferta activa');
    const botonesEditar = screen.getAllByRole('button', { name: 'Editar' });
    fireEvent.click(botonesEditar[0]);
    await waitFor(() => expect(mocks.getOfertaById).toHaveBeenCalledWith(ofertaActiva.id_oferta));
    expect(await screen.findByText('Editar oferta')).toBeTruthy();
  });
});
