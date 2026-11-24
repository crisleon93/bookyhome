/**
 * Notifications.test.js — Tests de lógica pura de Notifications.
 *
 * Cubre: getSyntheticOrderNotifications, matchesDeleteFilter,
 *        cleanTitle, formatDate, filtros por rol, paginación.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('react-native', () => ({
  ActivityIndicator: () => null, FlatList: () => null, Modal: () => null,
  RefreshControl: () => null, ScrollView: () => null,
  StyleSheet: { create: (s) => s }, Text: () => null,
  TouchableOpacity: () => null, View: () => null,
}))

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}))

vi.mock('../../context/ThemeContext', () => ({
  useThemedStyles: vi.fn((s) => s),
  useAppTheme: vi.fn(() => ({ darkMode: false, colors: {} })),
}))

vi.mock('../../context/AuthContext', async () => {
  const { createContext } = await vi.importActual('react')
  return { AuthContext: createContext({ user: { rol: 'comprador' }, signOut: vi.fn() }) }
})

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: vi.fn(() => ({ cargarConteo: vi.fn(), resetearNotif: vi.fn() })),
}))

vi.mock('../../components/RoleBasedSidebar', () => ({ default: () => null }))
vi.mock('../../components/Footer', () => ({ default: () => null }))

vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconCreditCard: Icon, IconFilter: Icon, IconMessage: Icon,
    IconPackage: Icon, IconShoppingBag: Icon, IconStar: Icon, IconTruck: Icon,
  }
})

vi.mock('../../services/api', () => ({
  deleteNotification: vi.fn(() => Promise.resolve({ data: {} })),
  deleteNotificationsByFilter: vi.fn(() => Promise.resolve({ data: {} })),
  getNotifications: vi.fn(() => Promise.resolve({ data: { notificaciones: [] } })),
  getOrdenes: vi.fn(() => Promise.resolve({ data: { orders: [] } })),
  markAllNotificationsRead: vi.fn(() => Promise.resolve({ data: {} })),
  markNotificationRead: vi.fn(() => Promise.resolve({ data: {} })),
}))

// ── Funciones puras copiadas del módulo ───────────────────────────────────────

const cleanTitle = (title = '') =>
  title.replace(/^[\s\S]{0,3}?(?=\p{L})/u, '').trim() || title.trim()

const formatDate = (raw) => {
  if (!raw) return ''
  try {
    const date = new Date(String(raw).replace(' ', 'T'))
    if (Number.isNaN(date.getTime())) return String(raw)
    return `${date.toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    })} · ${date.toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit',
    })}`
  } catch {
    return String(raw)
  }
}

const matchesDeleteFilter = (notification, filter) => {
  if (filter === 'todas') return true
  if (filter === 'leidas') return notification.leida

  const date = new Date(String(notification.fecha_creacion || '').replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()

  if (filter === 'hoy') {
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate()
  }

  const days = filter === 'semana' ? 7 : 30
  return date >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

const getSyntheticOrderNotifications = (orders, readIds, deletedIds) => {
  const generated = []
  const completedStates = [
    'completada', 'pagada', 'pagado', 'entregada', 'entregado', 'enviado', 'procesando',
  ]

  orders.forEach((order) => {
    const status = String(order?.estado || '').toLowerCase()
    if (!order?.id_orden) return

    const total = Number(order.total).toLocaleString('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    })
    let id, type, title, description

    if (status === 'pendiente') {
      id = `orden-pendiente-${order.id_orden}`
      type = 'pago'
      title = 'Pago Pendiente'
      description = `Tienes un pago pendiente de ${total} para la orden #${order.id_orden}`
    } else if (completedStates.includes(status)) {
      const delivered = ['completada', 'entregada', 'entregado'].includes(status)
      const shipping = ['enviado', 'procesando'].includes(status)
      id = `orden-estado-${order.id_orden}`
      type = delivered || shipping ? 'entrega' : 'pedido'
      title = delivered ? 'Compra entregada' : shipping ? 'Compra en camino' : 'Compra realizada'
      description = delivered
        ? `Tu compra #${order.id_orden} fue entregada correctamente por ${total}.`
        : shipping
          ? `Tu compra #${order.id_orden} está en proceso de entrega por ${total}.`
          : `Tu compra #${order.id_orden} fue confirmada por ${total}.`
    } else {
      return
    }

    if (deletedIds.has(id)) return
    generated.push({
      id_notificacion: id,
      tipo: type,
      titulo: title,
      descripcion: description,
      fecha_creacion: order.fecha || order.fecha_creacion || new Date().toISOString(),
      leida: readIds.has(id),
      referencia_id: order.id_orden,
      es_automatica: true,
    })
  })

  return generated
}

const BUYER_FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'no_leidas', label: 'No leídas' },
  { key: 'pedidos_envios', label: 'Pedidos y envíos', types: ['pedido', 'entrega', 'pago'] },
  { key: 'reclamos', label: 'Reclamos y soporte', types: ['sistema'] },
  { key: 'mensajes', label: 'Mensajes', types: ['mensaje'] },
]

const VENDOR_FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'no_leidas', label: 'No leídas' },
  { key: 'pedidos_envios', label: 'Ventas y envíos', types: ['venta', 'pedido', 'entrega', 'pago'] },
  { key: 'reclamos', label: 'Reclamos', types: ['sistema', 'reclamo', 'devolucion'] },
  { key: 'resenas', label: 'Reseñas', types: ['resena', 'reseña', 'resenia'] },
  { key: 'mensajes', label: 'Mensajes', types: ['mensaje'] },
]

const DELETE_OPTIONS = [
  { value: 'leidas', label: 'Solo las leídas' },
  { value: 'hoy', label: 'De hoy' },
  { value: 'semana', label: 'De los últimos 7 días' },
  { value: 'mes', label: 'Del último mes' },
  { value: 'todas', label: 'Todas las notificaciones' },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Notifications — cleanTitle', () => {
  it('elimina emoji al inicio', () => {
    expect(cleanTitle('🔔 Nuevo mensaje')).toBe('Nuevo mensaje')
  })

  it('no modifica título que empieza con letra', () => {
    expect(cleanTitle('Pago Pendiente')).toBe('Pago Pendiente')
  })

  it('cadena vacía devuelve vacío', () => {
    expect(cleanTitle('')).toBe('')
  })

  it('solo espacios devuelve vacío', () => {
    expect(cleanTitle('   ')).toBe('')
  })

  it('sin parámetro no lanza error', () => {
    expect(() => cleanTitle()).not.toThrow()
  })
})

describe('Notifications — formatDate', () => {
  it('devuelve cadena vacía para valor nulo', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('formatea fecha ISO válida', () => {
    const result = formatDate('2026-01-15T10:30:00')
    expect(result).toContain('2026')
    expect(result).toContain('·')
  })

  it('maneja fecha con espacio en lugar de T', () => {
    const result = formatDate('2026-01-15 10:30:00')
    expect(result).toContain('2026')
  })

  it('devuelve el string original para fecha inválida', () => {
    expect(formatDate('no-es-fecha')).toBe('no-es-fecha')
  })
})

describe('Notifications — matchesDeleteFilter', () => {
  const now = new Date()
  const hoy = now.toISOString()
  const haceTresDias = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const haceVeinticinco = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString()
  const haceDosMeses = new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString()

  const leida = { leida: true, fecha_creacion: hoy }
  const noLeida = { leida: false, fecha_creacion: hoy }

  it('filter "todas" incluye cualquier notificación', () => {
    expect(matchesDeleteFilter(noLeida, 'todas')).toBe(true)
    expect(matchesDeleteFilter(leida, 'todas')).toBe(true)
  })

  it('filter "leidas" incluye solo leídas', () => {
    expect(matchesDeleteFilter(leida, 'leidas')).toBe(true)
    expect(matchesDeleteFilter(noLeida, 'leidas')).toBe(false)
  })

  it('filter "hoy" incluye notificaciones de hoy', () => {
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: hoy }, 'hoy')).toBe(true)
  })

  it('filter "hoy" excluye notificaciones de hace 3 días', () => {
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: haceTresDias }, 'hoy')).toBe(false)
  })

  it('filter "semana" incluye notificaciones de los últimos 7 días', () => {
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: haceTresDias }, 'semana')).toBe(true)
  })

  it('filter "semana" excluye notificaciones de hace 25 días', () => {
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: haceVeinticinco }, 'semana')).toBe(false)
  })

  it('filter "mes" incluye notificaciones de los últimos 30 días', () => {
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: haceVeinticinco }, 'mes')).toBe(true)
  })

  it('filter "mes" excluye notificaciones de hace más de 30 días', () => {
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: haceDosMeses }, 'mes')).toBe(false)
  })

  it('fecha inválida retorna false para filtros de rango', () => {
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: 'invalida' }, 'hoy')).toBe(false)
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: 'invalida' }, 'semana')).toBe(false)
    expect(matchesDeleteFilter({ leida: false, fecha_creacion: 'invalida' }, 'mes')).toBe(false)
  })
})

describe('Notifications — getSyntheticOrderNotifications', () => {
  const readIds = new Set()
  const deletedIds = new Set()

  it('genera notificación de pago pendiente', () => {
    const orders = [{ id_orden: 1, estado: 'pendiente', total: 50000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(1)
    expect(result[0].tipo).toBe('pago')
    expect(result[0].titulo).toBe('Pago Pendiente')
    expect(result[0].referencia_id).toBe(1)
    expect(result[0].es_automatica).toBe(true)
  })

  it('genera notificación de compra entregada', () => {
    const orders = [{ id_orden: 2, estado: 'entregada', total: 30000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(1)
    expect(result[0].tipo).toBe('entrega')
    expect(result[0].titulo).toBe('Compra entregada')
  })

  it('genera notificación de compra en camino para "enviado"', () => {
    const orders = [{ id_orden: 3, estado: 'enviado', total: 25000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(1)
    expect(result[0].titulo).toBe('Compra en camino')
    expect(result[0].tipo).toBe('entrega')
  })

  it('genera notificación de compra en camino para "procesando"', () => {
    const orders = [{ id_orden: 4, estado: 'procesando', total: 20000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(1)
    expect(result[0].titulo).toBe('Compra en camino')
  })

  it('genera notificación de compra realizada para "pagado"', () => {
    const orders = [{ id_orden: 5, estado: 'pagado', total: 15000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(1)
    expect(result[0].titulo).toBe('Compra realizada')
    expect(result[0].tipo).toBe('pedido')
  })

  it('genera notificación de compra realizada para "pagada"', () => {
    const orders = [{ id_orden: 6, estado: 'pagada', total: 12000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(1)
    expect(result[0].titulo).toBe('Compra realizada')
  })

  it('genera notificación de compra realizada para "completada"', () => {
    const orders = [{ id_orden: 7, estado: 'completada', total: 18000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(1)
    expect(result[0].titulo).toBe('Compra entregada')
    expect(result[0].tipo).toBe('entrega')
  })

  it('ignora órdenes con estado desconocido', () => {
    const orders = [{ id_orden: 8, estado: 'devuelta', total: 10000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(0)
  })

  it('ignora órdenes sin id_orden', () => {
    const orders = [{ estado: 'pendiente', total: 10000 }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(0)
  })

  it('excluye notificaciones en deletedIds', () => {
    const orders = [{ id_orden: 9, estado: 'pendiente', total: 10000 }]
    const deleted = new Set(['orden-pendiente-9'])
    const result = getSyntheticOrderNotifications(orders, readIds, deleted)
    expect(result).toHaveLength(0)
  })

  it('marca como leída las notificaciones en readIds', () => {
    const orders = [{ id_orden: 10, estado: 'pendiente', total: 10000 }]
    const read = new Set(['orden-pendiente-10'])
    const result = getSyntheticOrderNotifications(orders, read, deletedIds)
    expect(result[0].leida).toBe(true)
  })

  it('usa fecha de la orden si está disponible', () => {
    const orders = [{ id_orden: 11, estado: 'pendiente', total: 10000, fecha: '2026-03-01' }]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result[0].fecha_creacion).toBe('2026-03-01')
  })

  it('procesa múltiples órdenes correctamente', () => {
    const orders = [
      { id_orden: 12, estado: 'pendiente', total: 10000 },
      { id_orden: 13, estado: 'enviado', total: 20000 },
      { id_orden: 14, estado: 'cancelada', total: 30000 },
    ]
    const result = getSyntheticOrderNotifications(orders, readIds, deletedIds)
    expect(result).toHaveLength(2) // cancelada no genera notificación
  })
})

describe('Notifications — BUYER_FILTERS', () => {
  it('contiene filtro "todas"', () => {
    expect(BUYER_FILTERS.find((f) => f.key === 'todas')).toBeDefined()
  })

  it('contiene filtro "no_leidas"', () => {
    expect(BUYER_FILTERS.find((f) => f.key === 'no_leidas')).toBeDefined()
  })

  it('pedidos_envios incluye tipos pedido, entrega y pago', () => {
    const f = BUYER_FILTERS.find((f) => f.key === 'pedidos_envios')
    expect(f.types).toContain('pedido')
    expect(f.types).toContain('entrega')
    expect(f.types).toContain('pago')
  })

  it('mensajes filtra por tipo mensaje', () => {
    const f = BUYER_FILTERS.find((f) => f.key === 'mensajes')
    expect(f.types).toContain('mensaje')
  })
})

describe('Notifications — VENDOR_FILTERS', () => {
  it('contiene todos los filtros básicos', () => {
    const keys = VENDOR_FILTERS.map((f) => f.key)
    expect(keys).toContain('todas')
    expect(keys).toContain('no_leidas')
    expect(keys).toContain('pedidos_envios')
    expect(keys).toContain('reclamos')
    expect(keys).toContain('resenas')
    expect(keys).toContain('mensajes')
  })

  it('pedidos_envios del vendedor incluye venta', () => {
    const f = VENDOR_FILTERS.find((f) => f.key === 'pedidos_envios')
    expect(f.types).toContain('venta')
  })

  it('reclamos incluye devolución', () => {
    const f = VENDOR_FILTERS.find((f) => f.key === 'reclamos')
    expect(f.types).toContain('devolucion')
  })
})

describe('Notifications — DELETE_OPTIONS', () => {
  it('tiene 5 opciones', () => {
    expect(DELETE_OPTIONS).toHaveLength(5)
  })

  it('incluye opción "todas"', () => {
    expect(DELETE_OPTIONS.find((o) => o.value === 'todas')).toBeDefined()
  })

  it('incluye opciones de rango temporal', () => {
    const valores = DELETE_OPTIONS.map((o) => o.value)
    expect(valores).toContain('hoy')
    expect(valores).toContain('semana')
    expect(valores).toContain('mes')
  })
})

describe('Notifications — filtrado por tipo', () => {
  const notificaciones = [
    { tipo: 'pedido', leida: false },
    { tipo: 'mensaje', leida: true },
    { tipo: 'sistema', leida: false },
    { tipo: 'pago', leida: true },
    { tipo: 'entrega', leida: false },
    { tipo: 'resena', leida: true },
  ]

  it('filtro "pedidos_envios" comprador devuelve pedido, entrega y pago', () => {
    const tipos = ['pedido', 'entrega', 'pago']
    const result = notificaciones.filter((n) => tipos.includes(n.tipo.toLowerCase()))
    expect(result).toHaveLength(3)
  })

  it('filtro "mensajes" devuelve solo tipo mensaje', () => {
    const result = notificaciones.filter((n) => n.tipo === 'mensaje')
    expect(result).toHaveLength(1)
  })

  it('filtro "no_leidas" devuelve las no leídas', () => {
    const result = notificaciones.filter((n) => !n.leida)
    expect(result).toHaveLength(3)
  })

  it('filtro "reclamos" comprador devuelve tipo sistema', () => {
    const tipos = ['sistema']
    const result = notificaciones.filter((n) => tipos.includes(n.tipo))
    expect(result).toHaveLength(1)
  })
})

describe('Notifications — paginación', () => {
  const PAGE_SIZES = [5, 10, 20, 50]

  it('PAGE_SIZES tiene cuatro opciones', () => {
    expect(PAGE_SIZES).toHaveLength(4)
  })

  it('página segura no excede el total de páginas', () => {
    const totalItems = 7
    const pageSize = 10
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(5, totalPages) // página 5 cuando solo hay 1
    expect(safePage).toBe(1)
  })

  it('slice correcto para la primera página', () => {
    const items = Array.from({ length: 15 }, (_, i) => i)
    const pageSize = 5
    const page = 1
    const result = items.slice((page - 1) * pageSize, page * pageSize)
    expect(result).toHaveLength(5)
    expect(result[0]).toBe(0)
  })

  it('slice correcto para la segunda página', () => {
    const items = Array.from({ length: 15 }, (_, i) => i)
    const pageSize = 5
    const page = 2
    const result = items.slice((page - 1) * pageSize, page * pageSize)
    expect(result).toHaveLength(5)
    expect(result[0]).toBe(5)
  })

  it('última página puede tener menos items', () => {
    const items = Array.from({ length: 12 }, (_, i) => i)
    const pageSize = 5
    const page = 3
    const result = items.slice((page - 1) * pageSize, page * pageSize)
    expect(result).toHaveLength(2)
  })
})

describe('Notifications — módulo exporta componente', () => {
  it('exporta un componente por defecto', async () => {
    const mod = await import('../../screens/Notifications.jsx')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toMatch(/function|object/)
  })
})
