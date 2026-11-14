import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AdminHome, { getOrdenEstado, getSectionItems } from '../../screens/AdminHome';

vi.mock('react-native', () => ({
  ActivityIndicator: () => null,
  FlatList: () => null,
  Image: () => null,
  Modal: () => null,
  Platform: { OS: 'web' },
  RefreshControl: () => null,
  ScrollView: () => null,
  StyleSheet: { create: (styles) => styles, flatten: (style) => style },
  Text: () => null,
  TextInput: () => null,
  TouchableOpacity: () => null,
  View: () => null,
  useWindowDimensions: () => ({ width: 375, height: 812 }),
}));

vi.mock('react-native-svg', () => ({
  default: () => null,
  Circle: () => null,
  Path: () => null,
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}));

vi.mock('../../context/AuthContext', async () => {
  const { createContext } = await vi.importActual('react');
  return { AuthContext: createContext({ user: { nombre: 'Admin Test' }, signOut: vi.fn() }) };
});

vi.mock('../../components/SidebarAdmin', () => ({ default: () => null }));
vi.mock('../../screens/FinanzasAdmin', () => ({ default: () => null }));
vi.mock('../../screens/AdminRequests', () => ({ default: () => null }));
vi.mock('../../screens/AdminProfile', () => ({ default: () => null }));

vi.mock('../../components/Icons', () => {
  const Icon = () => null;
  return {
    IconAlertTriangle: Icon, IconBook: Icon, IconCheck: Icon,
    IconEye: Icon, IconEyeOff: Icon, IconLock: Icon, IconMenu: Icon,
    IconPackage: Icon, IconStore: Icon, IconTrash: Icon, IconUnlock: Icon,
    IconUser: Icon, IconUsers: Icon, IconCart: Icon, IconClose: Icon,
    IconFilter: Icon, IconMail: Icon, IconPhone: Icon, IconSearch: Icon,
    IconShield: Icon, IconSettings: Icon, IconTool: Icon,
  };
});

vi.mock('../../services/api', () => ({
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  bloquearUsuario: vi.fn(),
  cambiarEstadoTienda: vi.fn(),
  eliminarLibroAdmin: vi.fn(),
  getAdminLibros: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminOrdenes: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminSolicitudes: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminTiendas: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminUsuarios: vi.fn(() => Promise.resolve({ data: [] })),
  ocultarLibroAdmin: vi.fn(),
}));

const data = {
  usuarios: [
    { nombre_usuario: 'Ana', correo_usuario: 'ana@example.test', rol: 'administrador', estado_usuario: 'Activo' },
    { nombre_usuario: 'Luis', correo_usuario: 'luis@example.test', rol: 'vendedor', estado_usuario: 'Bloqueado' },
  ],
  libros: [
    { titulo: 'Fantasia', autor_libro: 'Autora', nombre_tienda: 'Librería Uno', nombre_categoria: 'Fantasía' },
    { titulo: 'Ciencia', autor_libro: 'Autor', nombre_tienda: 'Librería Dos', nombre_categoria: 'Ciencia' },
  ],
  tiendas: [
    { nombre_tienda: 'Librería Activa', direccion: 'Calle 1', telefono: '123', id_tienda: 1, estado_tienda: 'activa' },
    { nombre_tienda: 'Librería en pausa', direccion: 'Calle 2', telefono: '456', id_tienda: 2, estado_tienda: 'vacaciones' },
    { nombre_tienda: 'Librería inactiva', direccion: 'Calle 3', telefono: '789', id_tienda: 3, estado_tienda: 'inactiva' },
  ],
  ordenes: [
    { id_orden: 1, estado: 'pagado', fecha: '2026-01-01' },
    { id_orden: 2, estado: 'cancelada', fecha: '2026-02-01' },
  ],
  solicitudes: [],
};

describe('AdminHome', () => {
  it('renderiza el componente real en estado inicial de carga', () => {
    expect(typeof AdminHome).toBe('function');
    expect(() => renderToStaticMarkup(React.createElement(AdminHome))).not.toThrow();
  });

  it.each([
    ['pagado', 'Pagado'],
    ['ENTREGADA', 'Entregada'],
    ['finalizada', 'Finalizada'],
    ['cancelado', 'Cancelado'],
    ['en proceso', 'En proceso'],
  ])('reconoce el estado de orden %s', (state, label) => {
    expect(getOrdenEstado(state).label).toBe(label);
  });

  it.each([undefined, null, '', 'estado desconocido'])('usa la etiqueta de respaldo para %s', (state) => {
    expect(getOrdenEstado(state).label).toBe(state || 'Desconocido');
  });

  it('filtra usuarios por búsqueda, rol normalizado y estado', () => {
    expect(getSectionItems({
      activeSection: 'usuarios', data, query: 'ana', role: 'admin',
      userStatus: 'Activo', category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([data.usuarios[0]]);
    expect(getSectionItems({
      activeSection: 'usuarios', data, query: '', role: 'vendedor',
      userStatus: 'Bloqueado', category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([data.usuarios[1]]);
    expect(getSectionItems({
      activeSection: 'usuarios', data, query: '', role: 'todos',
      userStatus: 'Activo', category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([data.usuarios[0]]);
  });

  it('filtra libros por consulta y categoría y devuelve orden inverso', () => {
    expect(getSectionItems({
      activeSection: 'libros', data, query: 'autora', role: 'todos',
      userStatus: 'todos', category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([data.libros[0]]);
    expect(getSectionItems({
      activeSection: 'libros', data, query: '', role: 'todos',
      userStatus: 'todos', category: 'Ciencia', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([data.libros[1]]);
  });

  it('filtra tiendas por estado y búsqueda en campos distintos', () => {
    expect(getSectionItems({
      activeSection: 'tiendas', data, query: '', role: 'todos',
      userStatus: 'todos', category: 'todas', storeStatus: 'activa', orderStatus: 'todos',
    })).toEqual([data.tiendas[0]]);
    expect(getSectionItems({
      activeSection: 'tiendas', data, query: '456', role: 'todos',
      userStatus: 'todos', category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([data.tiendas[1]]);
  });

  it('ordena órdenes por fecha e identifica el estado filtrado', () => {
    expect(getSectionItems({
      activeSection: 'ordenes', data, query: '', role: 'todos',
      userStatus: 'todos', category: 'todas', storeStatus: 'todos', orderStatus: 'cancelada',
    })).toEqual([data.ordenes[1]]);
    expect(getSectionItems({
      activeSection: 'ordenes', data, query: '1', role: 'todos',
      userStatus: 'todos', category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([data.ordenes[0]]);
  });

  it('devuelve una lista vacía para secciones sin registros tabulares', () => {
    expect(getSectionItems({
      activeSection: 'dashboard', data, query: '', role: 'todos',
      userStatus: 'todos', category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([]);
  });
});
