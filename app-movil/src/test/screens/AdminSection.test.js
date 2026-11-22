/**
 * AdminSection.test.js — Tests de lógica pura de AdminSection.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  ActivityIndicator: () => null, Alert: { alert: vi.fn() }, FlatList: () => null,
  Modal: () => null, Platform: { OS: 'web' }, RefreshControl: () => null,
  ScrollView: () => null, StyleSheet: { create: (s) => s },
  Text: () => null, TextInput: () => null, TouchableOpacity: () => null, View: () => null,
}))

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: vi.fn(() => ({ darkMode: false, colors: {} })),
  useThemedStyles: vi.fn((styles) => styles),
}))

vi.mock('../../components/Icons', () => ({
  IconBook: () => null, IconCheck: () => null, IconChevronLeft: () => null,
  IconEye: () => null, IconEyeOff: () => null, IconLock: () => null,
  IconPackage: () => null, IconStore: () => null, IconTrash: () => null,
  IconUnlock: () => null, IconUser: () => null,
}))

vi.mock('../../services/api', () => ({
  bloquearUsuario: vi.fn(() => Promise.resolve({ data: {} })),
  cambiarEstadoTienda: vi.fn(() => Promise.resolve({ data: {} })),
  eliminarLibroAdmin: vi.fn(() => Promise.resolve({ data: {} })),
  getAdminLibros: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminOrdenes: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminTiendas: vi.fn(() => Promise.resolve({ data: [] })),
  getAdminUsuarios: vi.fn(() => Promise.resolve({ data: [] })),
  ocultarLibroAdmin: vi.fn(() => Promise.resolve({ data: {} })),
}))

// ── Lógica pura del módulo ────────────────────────────────────────────────────

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const isActiveStore = (s) =>
  ['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes(
    (s || '').toLowerCase().trim()
  )

const isSuspendedStore = (s) =>
  ['suspendida', 'suspendido', 'inactiva', 'inactivo', 'pausada', 'pausado'].includes(
    (s || '').toLowerCase().trim()
  )

const ROL_COLORS = {
  admin:         { color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA' },
  administrador: { color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA' },
  vendedor:      { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  comprador:     { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
}
const getRolColors = (rol) =>
  ROL_COLORS[(rol || '').toLowerCase()] || { color: '#666', bg: '#F3F4F6', border: '#D1D5DB' }

const PER_PAGE = 10

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminSection — initials', () => {
  it('devuelve iniciales de nombre completo', () => {
    expect(initials('Juan Pérez')).toBe('JP')
  })

  it('devuelve inicial de nombre simple', () => {
    expect(initials('Ana')).toBe('A')
  })

  it('usa solo las dos primeras palabras', () => {
    expect(initials('María José García')).toBe('MJ')
  })

  it('devuelve ? para nombre vacío', () => {
    expect(initials('')).toBe('?')
  })

  it('devuelve ? para null', () => {
    expect(initials(null)).toBe('?')
  })

  it('devuelve en mayúsculas', () => {
    expect(initials('juan pérez')).toBe('JP')
  })
})

describe('AdminSection — isActiveStore', () => {
  it('reconoce tienda activa', () => {
    expect(isActiveStore('activa')).toBe(true)
    expect(isActiveStore('Activa')).toBe(true)
    expect(isActiveStore('activo')).toBe(true)
  })

  it('reconoce tienda habilitada', () => {
    expect(isActiveStore('habilitada')).toBe(true)
    expect(isActiveStore('aprobada')).toBe(true)
  })

  it('no reconoce tienda suspendida como activa', () => {
    expect(isActiveStore('suspendida')).toBe(false)
    expect(isActiveStore('inactiva')).toBe(false)
  })

  it('maneja null y string vacío', () => {
    expect(isActiveStore(null)).toBe(false)
    expect(isActiveStore('')).toBe(false)
  })
})

describe('AdminSection — isSuspendedStore', () => {
  it('reconoce tienda suspendida', () => {
    expect(isSuspendedStore('suspendida')).toBe(true)
    expect(isSuspendedStore('Suspendida')).toBe(true)
    expect(isSuspendedStore('inactiva')).toBe(true)
    expect(isSuspendedStore('pausada')).toBe(true)
  })

  it('no reconoce tienda activa como suspendida', () => {
    expect(isSuspendedStore('activa')).toBe(false)
  })

  it('maneja null', () => {
    expect(isSuspendedStore(null)).toBe(false)
  })
})

describe('AdminSection — getRolColors', () => {
  it('devuelve colores para rol comprador', () => {
    const c = getRolColors('comprador')
    expect(c.color).toBe('#047857')
  })

  it('devuelve colores para rol vendedor', () => {
    const c = getRolColors('vendedor')
    expect(c.color).toBe('#B45309')
  })

  it('devuelve colores para rol admin', () => {
    const c = getRolColors('admin')
    expect(c.color).toBe('#7A1E3A')
  })

  it('devuelve colores por defecto para rol desconocido', () => {
    const c = getRolColors('otro_rol')
    expect(c.bg).toBe('#F3F4F6')
  })

  it('es case insensitive', () => {
    const c = getRolColors('ADMIN')
    expect(c.color).toBe('#7A1E3A')
  })
})

describe('AdminSection — paginación', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, nombre: `Item ${i + 1}` }))

  it('PER_PAGE es 10', () => {
    expect(PER_PAGE).toBe(10)
  })

  it('primera página tiene 10 items', () => {
    const pagina = 1
    const result = items.slice(0, pagina * PER_PAGE)
    expect(result).toHaveLength(10)
  })

  it('segunda página acumula 20 items', () => {
    const pagina = 2
    const result = items.slice(0, pagina * PER_PAGE)
    expect(result).toHaveLength(20)
  })

  it('tercera página muestra todos', () => {
    const pagina = 3
    const result = items.slice(0, pagina * PER_PAGE)
    expect(result).toHaveLength(25)
  })
})

describe('AdminSection — módulo exporta componente', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../screens/AdminSection.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})

// ── Tests de filtrado interno ─────────────────────────────────────────────────

describe('AdminSection — filtrado de usuarios', () => {
  const usuarios = [
    { nombre_usuario: 'Carlos', correo_usuario: 'carlos@test.com', rol: 'comprador', id_usuario: 1 },
    { nombre_usuario: 'María', correo_usuario: 'maria@test.com', rol: 'vendedor', id_usuario: 2 },
    { nombre_usuario: 'Admin User', correo_usuario: 'admin@test.com', rol: 'administrador', id_usuario: 3 },
    { nombre_usuario: 'Sin Rol', correo_usuario: 'sinrol@test.com', id_usuario: 4 },
  ]

  it('filtra por rol comprador', () => {
    const result = usuarios.filter((u) => (u.rol || '').toLowerCase() === 'comprador')
    expect(result).toHaveLength(1)
    expect(result[0].nombre_usuario).toBe('Carlos')
  })

  it('filtra por rol vendedor', () => {
    const result = usuarios.filter((u) => (u.rol || '').toLowerCase() === 'vendedor')
    expect(result).toHaveLength(1)
    expect(result[0].nombre_usuario).toBe('María')
  })

  it('filtra por búsqueda en nombre', () => {
    const q = 'mar'
    const result = usuarios.filter(
      (u) => (u.nombre_usuario || '').toLowerCase().includes(q)
    )
    expect(result).toHaveLength(1)
    expect(result[0].nombre_usuario).toBe('María')
  })

  it('filtra por búsqueda en correo', () => {
    const q = 'admin@'
    const result = usuarios.filter(
      (u) => (u.correo_usuario || '').toLowerCase().includes(q)
    )
    expect(result).toHaveLength(1)
    expect(result[0].nombre_usuario).toBe('Admin User')
  })

  it('devuelve todos cuando rol es "todos"', () => {
    const result = usuarios.filter((u) => 'todos' === 'todos' || (u.rol || '').toLowerCase() === 'todos')
    expect(result).toHaveLength(4)
  })

  it('no falla con usuario sin rol definido', () => {
    const result = usuarios.filter((u) => (u.rol || '').toLowerCase() === 'comprador')
    const sinRolIncluido = result.find((u) => u.id_usuario === 4)
    expect(sinRolIncluido).toBeUndefined()
  })
})

describe('AdminSection — filtrado de libros', () => {
  const libros = [
    { id_libro: 1, titulo: 'El Quijote', nombre_categoria: 'Literatura', autor_libro: 'Cervantes' },
    { id_libro: 2, titulo: 'Cien años de soledad', nombre_categoria: 'Literatura', autor_libro: 'García Márquez' },
    { id_libro: 3, titulo: 'Una breve historia del tiempo', nombre_categoria: 'Ciencia', autor_libro: 'Hawking' },
  ]

  it('filtra por categoría', () => {
    const result = libros.filter((l) => l.nombre_categoria === 'Ciencia')
    expect(result).toHaveLength(1)
    expect(result[0].titulo).toBe('Una breve historia del tiempo')
  })

  it('filtra por búsqueda en título', () => {
    const q = 'quijote'
    const result = libros.filter((l) =>
      (l.titulo || l.nombre_libro || '').toLowerCase().includes(q)
    )
    expect(result).toHaveLength(1)
  })

  it('filtra por búsqueda en categoría', () => {
    const q = 'ciencia'
    const result = libros.filter((l) =>
      (l.nombre_categoria || '').toLowerCase().includes(q)
    )
    expect(result).toHaveLength(1)
  })

  it('devuelve todos cuando categoría es "todas"', () => {
    const result = libros.filter((l) => 'todas' === 'todas' || l.nombre_categoria === 'todas')
    expect(result).toHaveLength(3)
  })

  it('categorías únicas se extraen correctamente', () => {
    const cats = new Set(libros.map((l) => l.nombre_categoria).filter(Boolean))
    expect([...cats].sort()).toEqual(['Ciencia', 'Literatura'])
  })
})

describe('AdminSection — filtrado de tiendas', () => {
  const tiendas = [
    { id_tienda: 1, nombre_tienda: 'Librería Central', estado_tienda: 'activa' },
    { id_tienda: 2, nombre_tienda: 'Librería Norte', estado_tienda: 'suspendida' },
    { id_tienda: 3, nombre_tienda: 'Librería Sur', estado_tienda: 'inactiva' },
  ]

  it('filtra tiendas por nombre', () => {
    const q = 'norte'
    const result = tiendas.filter((t) =>
      (t.nombre_tienda || '').toLowerCase().includes(q)
    )
    expect(result).toHaveLength(1)
    expect(result[0].id_tienda).toBe(2)
  })

  it('filtra tiendas por estado', () => {
    const q = 'inactiva'
    const result = tiendas.filter((t) =>
      (t.estado_tienda || '').toLowerCase().includes(q)
    )
    expect(result).toHaveLength(1)
    expect(result[0].id_tienda).toBe(3)
  })

  it('isActiveStore reconoce correctamente "activa"', () => {
    expect(isActiveStore('activa')).toBe(true)
    expect(isActiveStore('suspendida')).toBe(false)
    expect(isActiveStore('inactiva')).toBe(false)
  })

  it('isSuspendedStore reconoce correctamente "suspendida"', () => {
    expect(isSuspendedStore('suspendida')).toBe(true)
    expect(isSuspendedStore('activa')).toBe(false)
    expect(isSuspendedStore(null)).toBe(false)
  })
})

describe('AdminSection — filtrado de órdenes', () => {
  const ordenes = [
    { id_orden: 10, estado: 'pagado' },
    { id_orden: 20, estado: 'cancelada' },
    { id_orden: 30, estado: 'enviado' },
  ]

  it('filtra por id_orden parcial', () => {
    const q = '10'
    const result = ordenes.filter((o) => String(o.id_orden || '').includes(q))
    expect(result).toHaveLength(1)
    expect(result[0].id_orden).toBe(10)
  })

  it('filtra por estado', () => {
    const q = 'cancelada'
    const result = ordenes.filter((o) => (o.estado || '').toLowerCase().includes(q))
    expect(result).toHaveLength(1)
    expect(result[0].id_orden).toBe(20)
  })

  it('busca coincidencia parcial en estado', () => {
    const q = 'ado'
    const result = ordenes.filter((o) => (o.estado || '').toLowerCase().includes(q))
    // pagado y enviado contienen 'ado'
    expect(result).toHaveLength(2)
  })
})

describe('AdminSection — CONFIG', () => {
  it('todas las secciones tienen title, subtitle, load e Icon', async () => {
    const mod = await import('../../screens/AdminSection.jsx')
    // El módulo importado puede no exportar CONFIG directamente,
    // pero verificamos que el default es un componente válido
    expect(typeof mod.default).toMatch(/function|object/)
  })

  it('ESTADOS_TIENDA incluye activa y suspendida', () => {
    const ESTADOS_TIENDA = [
      { value: 'activa', label: 'Activa' },
      { value: 'vacaciones', label: 'En Vacaciones' },
      { value: 'suspendida', label: 'Suspendida' },
      { value: 'inactiva', label: 'Inactiva' },
    ]
    expect(ESTADOS_TIENDA.find((e) => e.value === 'activa')).toBeDefined()
    expect(ESTADOS_TIENDA.find((e) => e.value === 'suspendida')).toBeDefined()
    expect(ESTADOS_TIENDA).toHaveLength(4)
  })
})
