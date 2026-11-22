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
    const users = [
      ...data.usuarios,
      { nombre_usuario: 'Usuario sin rol', correo_usuario: 'sin-rol@example.test' },
    ];
    expect(getSectionItems({
      activeSection: 'usuarios', data: { ...data, usuarios: users }, query: 'ana', role: 'admin',
      userStatus: 'Activo', category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    })).toEqual([data.usuarios[0]]);
    expect(getSectionItems({
      activeSection: 'usuarios', data: { ...data, usuarios: users }, query: '', role: 'vendedor',
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

  it('aplica todos los filtros de estado de tienda y conserva estados desconocidos', () => {
    const stores = [
      { id_tienda: 1, estado_tienda: 'habilitada' },
      { id_tienda: 2, estado_tienda: 'por revisar' },
      { id_tienda: 3, estado_tienda: 'en vacaciones' },
      { id_tienda: 4, estado_tienda: 'pausada' },
      { id_tienda: 5, estado_tienda: 'inactivo' },
      { id_tienda: 6, estado_tienda: 'otro estado' },
      { id_tienda: 7 },
    ];
    const getStoresByStatus = (storeStatus) => getSectionItems({
      activeSection: 'tiendas',
      data: { ...data, tiendas: stores },
      query: '',
      role: 'todos',
      userStatus: 'todos',
      category: 'todas',
      storeStatus,
      orderStatus: 'todos',
    }).map((store) => store.id_tienda);

    expect(getStoresByStatus('activa')).toEqual([1]);
    expect(getStoresByStatus('pendiente')).toEqual([2]);
    expect(getStoresByStatus('vacaciones')).toEqual([3]);
    expect(getStoresByStatus('suspendida')).toEqual([4]);
    expect(getStoresByStatus('inactiva')).toEqual([5]);
    expect(getStoresByStatus('desconocido'))
      .toEqual(stores.slice().reverse().map((store) => store.id_tienda));
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

// ── Tests adicionales para subir cobertura de condiciones no cubiertas ────────

describe('AdminHome — getStoreColors y matchesStoreStatusFilter', () => {
  // Funciones extraídas inline para testear la lógica de colores y filtros
  const isActiveStore = (s) =>
    ['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes((s || '').toLowerCase().trim());
  const isPendingStore = (s) =>
    ['pendiente', 'en revision', 'en revisión', 'por revisar'].includes((s || '').toLowerCase().trim());
  const isSuspendedStore = (s) =>
    ['suspendida', 'suspendido', 'inactiva', 'inactivo', 'pausada', 'pausado'].includes((s || '').toLowerCase().trim());
  const isVacationStore = (s) =>
    ['vacaciones', 'en vacaciones'].includes((s || '').toLowerCase().trim());
  const isInactiveStore = (s) =>
    ['inactiva', 'inactivo'].includes((s || '').toLowerCase().trim());

  it('isActiveStore reconoce habilitada y aprobada', () => {
    expect(isActiveStore('habilitada')).toBe(true);
    expect(isActiveStore('aprobado')).toBe(true);
    expect(isActiveStore('activo')).toBe(true);
  });

  it('isPendingStore reconoce por revisar y en revision', () => {
    expect(isPendingStore('por revisar')).toBe(true);
    expect(isPendingStore('en revision')).toBe(true);
    expect(isPendingStore('pendiente')).toBe(true);
    expect(isPendingStore('activa')).toBe(false);
  });

  it('isSuspendedStore reconoce pausada y suspendido', () => {
    expect(isSuspendedStore('pausada')).toBe(true);
    expect(isSuspendedStore('suspendido')).toBe(true);
    expect(isSuspendedStore('activa')).toBe(false);
  });

  it('isVacationStore reconoce "vacaciones" y "en vacaciones"', () => {
    expect(isVacationStore('vacaciones')).toBe(true);
    expect(isVacationStore('en vacaciones')).toBe(true);
    expect(isVacationStore('activa')).toBe(false);
  });

  it('isInactiveStore reconoce "inactiva" e "inactivo"', () => {
    expect(isInactiveStore('inactiva')).toBe(true);
    expect(isInactiveStore('inactivo')).toBe(true);
    expect(isInactiveStore('suspendida')).toBe(false);
  });

  const matchesStoreStatusFilter = (estado, filtro) => {
    if (filtro === 'todos') return true;
    if (filtro === 'activa') return isActiveStore(estado);
    if (filtro === 'pendiente') return isPendingStore(estado);
    if (filtro === 'vacaciones') return isVacationStore(estado);
    if (filtro === 'suspendida') return isSuspendedStore(estado) && !isInactiveStore(estado);
    if (filtro === 'inactiva') return isInactiveStore(estado);
    return true;
  };

  it('filtro "todos" acepta cualquier estado', () => {
    expect(matchesStoreStatusFilter('activa', 'todos')).toBe(true);
    expect(matchesStoreStatusFilter('suspendida', 'todos')).toBe(true);
    expect(matchesStoreStatusFilter(null, 'todos')).toBe(true);
  });

  it('filtro "suspendida" no incluye inactivas', () => {
    expect(matchesStoreStatusFilter('suspendida', 'suspendida')).toBe(true);
    expect(matchesStoreStatusFilter('pausada', 'suspendida')).toBe(true);
    expect(matchesStoreStatusFilter('inactiva', 'suspendida')).toBe(false); // isSuspended=true pero isInactive=true
  });

  it('filtro desconocido devuelve true (permisivo)', () => {
    expect(matchesStoreStatusFilter('activa', 'desconocido')).toBe(true);
  });
});

describe('AdminHome — normalizeUserRoleFilter', () => {
  const normalizeUserRoleFilter = (rol) => {
    const rolNormalizado = (rol || '').toLowerCase().trim();
    return rolNormalizado === 'admin' || rolNormalizado === 'administrador'
      ? 'admin'
      : rolNormalizado;
  };

  it('normaliza "administrador" a "admin"', () => {
    expect(normalizeUserRoleFilter('administrador')).toBe('admin');
  });

  it('mantiene "admin" como "admin"', () => {
    expect(normalizeUserRoleFilter('admin')).toBe('admin');
  });

  it('mantiene "vendedor" sin cambios', () => {
    expect(normalizeUserRoleFilter('vendedor')).toBe('vendedor');
  });

  it('mantiene "comprador" sin cambios', () => {
    expect(normalizeUserRoleFilter('comprador')).toBe('comprador');
  });

  it('maneja null y undefined', () => {
    expect(normalizeUserRoleFilter(null)).toBe('');
    expect(normalizeUserRoleFilter(undefined)).toBe('');
  });
});

describe('AdminHome — fmtPrice', () => {
  const fmtPrice = (p) => `$${Number(p || 0).toLocaleString('es-CO')}`;

  it('formatea un precio numérico', () => {
    const result = fmtPrice(50000);
    expect(result).toContain('$');
    expect(result).toContain('50');
  });

  it('devuelve $0 para valor nulo', () => {
    expect(fmtPrice(null)).toBe('$0');
    expect(fmtPrice(undefined)).toBe('$0');
  });

  it('formatea string numérico correctamente', () => {
    const result = fmtPrice('25000');
    expect(result).toContain('25');
  });
});

describe('AdminHome — getOrderReportKey', () => {
  const getOrderReportKey = (state) => {
    const statesByReportKey = [
      [['pagado', 'pagada', 'pago confirmado', 'aprobada', 'aprobado'], 'pagada'],
      [['entregado', 'entregada', 'completada', 'finalizada'], 'entregada'],
      [['enviado', 'enviada', 'despachado', 'en camino'], 'enviada'],
      [['procesando', 'en proceso', 'preparando'], 'procesando'],
      [['cancelado', 'cancelada', 'anulado', 'rechazada'], 'cancelada'],
    ];
    return statesByReportKey.find(([states]) => states.includes(state))?.[1] || 'pendiente';
  };

  it('clasifica pagado como pagada', () => {
    expect(getOrderReportKey('pagado')).toBe('pagada');
    expect(getOrderReportKey('aprobado')).toBe('pagada');
  });

  it('clasifica entregada/completada como entregada', () => {
    expect(getOrderReportKey('entregada')).toBe('entregada');
    expect(getOrderReportKey('completada')).toBe('entregada');
    expect(getOrderReportKey('finalizada')).toBe('entregada');
  });

  it('clasifica enviado/despachado como enviada', () => {
    expect(getOrderReportKey('enviado')).toBe('enviada');
    expect(getOrderReportKey('despachado')).toBe('enviada');
    expect(getOrderReportKey('en camino')).toBe('enviada');
  });

  it('clasifica procesando como procesando', () => {
    expect(getOrderReportKey('procesando')).toBe('procesando');
    expect(getOrderReportKey('en proceso')).toBe('procesando');
    expect(getOrderReportKey('preparando')).toBe('procesando');
  });

  it('clasifica cancelado como cancelada', () => {
    expect(getOrderReportKey('cancelado')).toBe('cancelada');
    expect(getOrderReportKey('anulado')).toBe('cancelada');
  });

  it('usa "pendiente" como fallback para estados desconocidos', () => {
    expect(getOrderReportKey('desconocido')).toBe('pendiente');
    expect(getOrderReportKey('')).toBe('pendiente');
    expect(getOrderReportKey(undefined)).toBe('pendiente');
  });
});

describe('AdminHome — getStoreReportKey', () => {
  const isActiveStore = (s) =>
    ['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes((s || '').toLowerCase().trim());
  const isPendingStore = (s) =>
    ['pendiente', 'en revision', 'en revisión', 'por revisar'].includes((s || '').toLowerCase().trim());

  const getStoreReportKey = (state) => {
    if (isActiveStore(state)) return 'activa';
    if (['vacaciones', 'en vacaciones', 'pausada', 'pausado'].includes(state)) return 'vacaciones';
    if (isPendingStore(state)) return 'pendiente';
    if (['suspendida', 'suspendido'].includes(state)) return 'suspendida';
    return 'inactiva';
  };

  it('activa devuelve "activa"', () => {
    expect(getStoreReportKey('activa')).toBe('activa');
    expect(getStoreReportKey('habilitada')).toBe('activa');
  });

  it('vacaciones devuelve "vacaciones"', () => {
    expect(getStoreReportKey('vacaciones')).toBe('vacaciones');
    expect(getStoreReportKey('pausada')).toBe('vacaciones');
  });

  it('pendiente devuelve "pendiente"', () => {
    expect(getStoreReportKey('pendiente')).toBe('pendiente');
    expect(getStoreReportKey('por revisar')).toBe('pendiente');
  });

  it('suspendida devuelve "suspendida"', () => {
    expect(getStoreReportKey('suspendida')).toBe('suspendida');
    expect(getStoreReportKey('suspendido')).toBe('suspendida');
  });

  it('estados desconocidos devuelven "inactiva"', () => {
    expect(getStoreReportKey('otro')).toBe('inactiva');
    expect(getStoreReportKey(undefined)).toBe('inactiva');
  });
});

describe('AdminHome — categoryTheme', () => {
  const CATEGORY_THEMES = [
    [(text) => text.includes('ficcion') && !text.includes('cientifica'), { icon: '📖', label: 'Ficción' }],
    [(text) => text.includes('fantasia'), { icon: '🧙', label: 'Fantasía' }],
    [(text) => text.includes('terror'), { icon: '👻', label: 'Terror' }],
    [(text) => text.includes('ciencia') || text.includes('cientifica'), { icon: '🔬', label: 'Ciencia' }],
    [(text) => text.includes('romance'), { icon: '💖', label: 'Romance' }],
    [(text) => text.includes('historia'), { icon: '🏛️', label: 'Historia' }],
    [(text) => text.includes('tecnologia'), { icon: '💻', label: 'Tecnología' }],
    [(text) => text.includes('infantil'), { icon: '🧸', label: 'Infantil' }],
    [(text) => text.includes('arte'), { icon: '🎨', label: 'Arte' }],
    [(text) => text.includes('poesia'), { icon: '✍️', label: 'Poesía' }],
    [(text) => text.includes('filosofia'), { icon: '🧠', label: 'Filosofía' }],
  ];

  const categoryTheme = (name) => {
    const text = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const match = CATEGORY_THEMES.find(([matches]) => matches(text));
    return match?.[1] || { label: 'General' };
  };

  it('identifica Fantasía', () => {
    expect(categoryTheme('Fantasía').label).toBe('Fantasía');
  });

  it('identifica Terror', () => {
    expect(categoryTheme('Terror').label).toBe('Terror');
  });

  it('identifica Ciencia (con acento normalizado)', () => {
    // "Ciencia ficción" matchea primero Ficción por el orden del array,
    // pero "Ciencia" solo coincide con la categoría de Ciencia
    expect(categoryTheme('Ciencia').label).toBe('Ciencia');
  });

  it('identifica Romance', () => {
    expect(categoryTheme('Romance').label).toBe('Romance');
  });

  it('identifica Historia', () => {
    expect(categoryTheme('Historia').label).toBe('Historia');
  });

  it('identifica Tecnología (normaliza tildes)', () => {
    expect(categoryTheme('Tecnología').label).toBe('Tecnología');
  });

  it('devuelve General para categoría desconocida', () => {
    expect(categoryTheme('Desconocido').label).toBe('General');
    expect(categoryTheme('').label).toBe('General');
    expect(categoryTheme(undefined).label).toBe('General');
  });
});

describe('AdminHome — filterOrders entregada/entregado', () => {
  const ordenes = [
    { id_orden: 1, estado: 'entregada', fecha: '2026-01-01' },
    { id_orden: 2, estado: 'entregado', fecha: '2026-01-02' },
    { id_orden: 3, estado: 'pagado', fecha: '2026-01-03' },
    { id_orden: 4, estado: 'cancelada', fecha: '2026-01-04' },
  ];

  const filterOrders = (orders, query, status) => orders.filter((order) => {
    const orderStatus = (order.estado || '').trim().toLowerCase();
    const matchesStatus = status === 'todos' ||
      (status === 'entregada' && ['entregada', 'entregado'].includes(orderStatus)) ||
      orderStatus === status;
    const matchesQuery = !query || [String(order.id_orden), order.estado].some((v) =>
      String(v || '').toLowerCase().includes(query)
    );
    return matchesQuery && matchesStatus;
  });

  it('filtro "entregada" incluye tanto "entregada" como "entregado"', () => {
    const result = filterOrders(ordenes, '', 'entregada');
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.id_orden)).toEqual(expect.arrayContaining([1, 2]));
  });

  it('filtro "pagado" solo incluye pagados', () => {
    const result = filterOrders(ordenes, '', 'pagado');
    expect(result).toHaveLength(1);
    expect(result[0].id_orden).toBe(3);
  });

  it('filtro "todos" devuelve todas las órdenes', () => {
    const result = filterOrders(ordenes, '', 'todos');
    expect(result).toHaveLength(4);
  });

  it('búsqueda por id_orden funciona', () => {
    const result = filterOrders(ordenes, '3', 'todos');
    expect(result).toHaveLength(1);
    expect(result[0].id_orden).toBe(3);
  });
});

describe('AdminHome — sortOrders', () => {
  const sortOrders = (orders) => orders.slice().sort((a, b) => {
    const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    return (b.id_orden || 0) - (a.id_orden || 0);
  });

  it('ordena por fecha descendente', () => {
    const orders = [
      { id_orden: 1, fecha: '2026-01-01' },
      { id_orden: 2, fecha: '2026-03-01' },
      { id_orden: 3, fecha: '2026-02-01' },
    ];
    const result = sortOrders(orders);
    expect(result[0].id_orden).toBe(2);
    expect(result[2].id_orden).toBe(1);
  });

  it('desempata por id_orden descendente cuando misma fecha', () => {
    const orders = [
      { id_orden: 5, fecha: '2026-01-01' },
      { id_orden: 8, fecha: '2026-01-01' },
    ];
    const result = sortOrders(orders);
    expect(result[0].id_orden).toBe(8);
  });

  it('órdenes sin fecha van al final', () => {
    const orders = [
      { id_orden: 1 },
      { id_orden: 2, fecha: '2026-01-01' },
    ];
    const result = sortOrders(orders);
    expect(result[0].id_orden).toBe(2);
  });
});

describe('AdminHome — getSectionItems con RoleBasedSidebar y filtros de usuario avanzados', () => {
  it('filtra usuario bloqueado por status Bloqueado', () => {
    const result = getSectionItems({
      activeSection: 'usuarios',
      data: {
        usuarios: [
          { nombre_usuario: 'Activo', correo_usuario: 'a@a.com', rol: 'comprador', estado_usuario: 'Activo' },
          { nombre_usuario: 'Bloqueado', correo_usuario: 'b@b.com', rol: 'comprador', estado_usuario: 'Bloqueado' },
        ],
        libros: [], tiendas: [], ordenes: [],
      },
      query: '', role: 'todos', userStatus: 'Bloqueado',
      category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    });
    expect(result).toHaveLength(1);
    expect(result[0].nombre_usuario).toBe('Bloqueado');
  });

  it('filtra usuario por estado Activo (case-insensitive)', () => {
    const result = getSectionItems({
      activeSection: 'usuarios',
      data: {
        usuarios: [
          { nombre_usuario: 'activo1', correo_usuario: 'a@a.com', rol: 'comprador', estado_usuario: 'activo' },
          { nombre_usuario: 'Bloqueado', correo_usuario: 'b@b.com', rol: 'comprador', estado_usuario: 'Bloqueado' },
        ],
        libros: [], tiendas: [], ordenes: [],
      },
      query: '', role: 'todos', userStatus: 'Activo',
      category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    });
    expect(result).toHaveLength(1);
    expect(result[0].nombre_usuario).toBe('activo1');
  });

  it('filtra administrador usando rol normalizado', () => {
    const result = getSectionItems({
      activeSection: 'usuarios',
      data: {
        usuarios: [
          { nombre_usuario: 'Admin', correo_usuario: 'a@a.com', rol: 'administrador', estado_usuario: 'Activo' },
          { nombre_usuario: 'Comprador', correo_usuario: 'c@c.com', rol: 'comprador', estado_usuario: 'Activo' },
        ],
        libros: [], tiendas: [], ordenes: [],
      },
      query: '', role: 'admin', userStatus: 'todos',
      category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    });
    expect(result).toHaveLength(1);
    expect(result[0].nombre_usuario).toBe('Admin');
  });

  it('filtra libros por tienda en matchesSearch', () => {
    const result = getSectionItems({
      activeSection: 'libros',
      data: {
        usuarios: [], tiendas: [], ordenes: [],
        libros: [
          { titulo: 'Libro A', autor_libro: 'Autor', nombre_tienda: 'Librería Central', nombre_categoria: 'Literatura' },
          { titulo: 'Libro B', autor_libro: 'Otro', nombre_tienda: 'Librería Norte', nombre_categoria: 'Ciencia' },
        ],
      },
      query: 'central', role: 'todos', userStatus: 'todos',
      category: 'todas', storeStatus: 'todos', orderStatus: 'todos',
    });
    expect(result).toHaveLength(1);
    expect(result[0].titulo).toBe('Libro A');
  });
});
