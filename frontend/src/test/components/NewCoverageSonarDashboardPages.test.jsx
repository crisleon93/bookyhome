import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mocks = vi.hoisted(() => ({
  getStoredLibros: vi.fn(),
  getOrdenes: vi.fn(),
  getCuponesDisponibles: vi.fn(),
  getDevoluciones: vi.fn(),
  getOrden: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  notificarLlegadaTienda: vi.fn(),
  cancelarMisPendientes: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  apiGet: vi.fn(() => Promise.resolve({ data: [] })),
  navigate: vi.fn(),
  getCuponesTienda: vi.fn(),
  crearCupon: vi.fn(),
  editarCupon: vi.fn(),
  eliminarCupon: vi.fn(),
  getQuejas: vi.fn(),
  crearQueja: vi.fn(),
  cancelarQueja: vi.fn(),
  getMensajesReclamo: vi.fn(),
  enviarMensajeReclamo: vi.fn(),
  getApiBaseUrlNamed: vi.fn(() => 'http://localhost:8000'),
}))

vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet, post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  getStoredLibros: mocks.getStoredLibros,
  getOrdenes: mocks.getOrdenes,
  getCuponesDisponibles: mocks.getCuponesDisponibles,
  getDevoluciones: mocks.getDevoluciones,
  getOrden: mocks.getOrden,
  sendConfirmationEmail: mocks.sendConfirmationEmail,
  notificarLlegadaTienda: mocks.notificarLlegadaTienda,
  cancelarMisPendientes: mocks.cancelarMisPendientes,
  getApiBaseUrl: mocks.getApiBaseUrl,
  getCuponesTienda: mocks.getCuponesTienda,
  crearCupon: mocks.crearCupon,
  editarCupon: mocks.editarCupon,
  eliminarCupon: mocks.eliminarCupon,
  getQuejas: mocks.getQuejas,
  crearQueja: mocks.crearQueja,
  cancelarQueja: mocks.cancelarQueja,
  getMensajesReclamo: mocks.getMensajesReclamo,
  enviarMensajeReclamo: mocks.enviarMensajeReclamo,
  getApiBaseUrlNamed: mocks.getApiBaseUrlNamed,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate }
})

vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))
vi.mock('../../hooks/useAuth', () => ({ getUserRole: vi.fn(() => 'admin') }))
vi.mock('../../pages/BookyPagoFinanzas', () => ({ default: () => <div>Finanzas</div> }))
vi.mock('../../components/dashboard/SeccionPerfilAdmin', () => ({ default: () => <div>Perfil</div> }))
vi.mock('../../components/CouponsList', () => ({ default: () => <div>Cupones disponibles</div> }))
vi.mock('../../components/LibroCard', () => ({ default: ({ libro, onVerDetalles }) => <button onClick={() => onVerDetalles?.(libro)}>{libro.titulo}</button> }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconBookOpen: Icon, IconFavorites: Icon, IconBook: Icon, IconChevronLeft: Icon,
    IconPackage: Icon, IconCheck: Icon, IconLock: Icon,
    IconLayoutDashboard: Icon, IconTrendingUp: Icon, IconUser: Icon, IconUsers: Icon,
    IconStore: Icon, IconSettings: Icon, IconChevronDown: Icon, IconMenu: Icon,
    IconLogOut: Icon, IconUnlock: Icon, IconBan: Icon, IconEye: Icon, IconTrash: Icon,
    IconDollar: Icon, IconCart: Icon, IconTool: Icon, IconAlertTriangle: Icon,
    IconWallet: Icon, IconInfo: Icon, IconTruck: Icon, IconMessage: Icon,
    IconStoreAlt: Icon, IconSearch: Icon, IconClose: Icon, IconPhone: Icon, IconMail: Icon,
    IconPlus: Icon, IconEdit: Icon, IconCalendar: Icon, IconGift: Icon,
    IconRefresh: Icon, IconTag: Icon,
  }
})

import SeccionInicio from '../../components/dashboard/SeccionInicio'
import SeccionMisCompras from '../../components/dashboard/SeccionMisCompras'
import AdminDashboard from '../../pages/AdminDashboard'
import CarruselPublico from '../../components/CarruselPublico'
import SeccionCuponesVendedor from '../../components/SeccionCuponesVendedor'
import QuejasReclamos from '../../pages/QuejasReclamos'

describe('dashboard personal coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.requestAnimationFrame = vi.fn(() => 1)
    window.cancelAnimationFrame = vi.fn()
    mocks.getStoredLibros.mockResolvedValue({ data: [{ id_libro: 1, titulo: 'Novedad' }] })
    mocks.getOrdenes.mockResolvedValue({ data: [] })
    mocks.getCuponesDisponibles.mockResolvedValue({ data: [{ codigo_cupon: 'LECTURA' }] })
    mocks.getDevoluciones.mockResolvedValue({ data: [] })
    mocks.getOrden.mockResolvedValue({ data: {} })
    mocks.notificarLlegadaTienda.mockResolvedValue({ data: { ok: true } })
    mocks.cancelarMisPendientes.mockResolvedValue({ data: { canceladas: 1 } })
    mocks.getCuponesTienda.mockResolvedValue({ data: [] })
    mocks.crearCupon.mockResolvedValue({ data: {} })
    mocks.editarCupon.mockResolvedValue({ data: {} })
    mocks.eliminarCupon.mockResolvedValue({ data: {} })
    mocks.getQuejas.mockResolvedValue({ data: [] })
    mocks.crearQueja.mockResolvedValue({ data: {} })
    mocks.cancelarQueja.mockResolvedValue({ data: {} })
    mocks.getMensajesReclamo.mockResolvedValue({ data: [] })
    mocks.enviarMensajeReclamo.mockResolvedValue({ data: {} })
  })

  it('renders the personal home, loads content, toggles dark mode, and navigates', async () => {
    const select = vi.fn()
    const detail = vi.fn()
    render(<SeccionInicio userName="Ana Pérez" onSelectSeccion={select} onVerDetalleLibro={detail} />)
    expect((await screen.findAllByText('Novedad'))[0]).toBeInTheDocument()
    expect(screen.getByText('Cupones disponibles')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Explorar catálogo/i }))
    expect(select).toHaveBeenCalledWith('Catálogo')
    window.dispatchEvent(new Event('darkModeChange'))
    fireEvent.click(screen.getAllByText('Novedad')[0])
    expect(detail).toHaveBeenCalled()
  })

  it('shows the empty home state when the catalog has no books', async () => {
    mocks.getStoredLibros.mockResolvedValue({ data: [] })
    mocks.getCuponesDisponibles.mockRejectedValue(new Error('offline'))
    render(<SeccionInicio userName="" onSelectSeccion={vi.fn()} />)
    expect(await screen.findByText('No hay libros disponibles aún')).toBeInTheDocument()
  })

  it('renders recent purchases with fallback data and navigates to purchases', async () => {
    mocks.getOrdenes.mockResolvedValue({
      data: [
        { id_orden: 11, estado: 'entregada', total: 25000, fecha: '2026-02-01', items: [{ nombre: 'Libro alterno', cantidad: 2 }], imagen: 'covers/demo.jpg' },
        { id_orden: 12, estado_orden: 'enviado', total: 12000, fecha: '2026-02-02', productos: [] },
      ],
    })
    const select = vi.fn()
    render(<SeccionInicio userName="Comprador" onSelectSeccion={select} />)
    expect(await screen.findByText('Tus últimas compras')).toBeInTheDocument()
    expect(screen.getByText('Libro alterno')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas' }))
    expect(select).toHaveBeenCalledWith('Mis Compras')
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(select).toHaveBeenCalledWith('Mis Compras')
  })

  it('renders orders in each state and exercises filters, sorting, details and receipt actions', async () => {
    mocks.getOrden.mockResolvedValue({ data: {
      id_orden: 1, estado: 'pendiente', fecha: '2026-01-02', total: 100,
      tipo_entrega: 'retiro_tienda', estado_retiro: 'reservado', pin_retiro: '1234',
      tienda_retiro: { nombre_tienda: 'Librería Central', direccion: 'Calle 1', telefono: '555' },
      fecha_limite_retiro: '2026-02-01', items: [{ titulo: 'Detalle', cantidad: 1, precio: 100 }],
    } })
    mocks.getOrdenes.mockResolvedValue({
      data: [
        { id_orden: 1, estado: 'entregada', total: 100, fecha: '2026-01-02', items: [{ titulo: 'Entregado', cantidad: 1 }], tipo_entrega: 'retiro_tienda' },
        { id_orden: 2, estado: 'enviado', total: 200, fecha: '2026-01-03', items: [{ titulo: 'En camino', cantidad: 2 }], tipo_entrega: 'domicilio' },
        { id_orden: 3, estado: 'pendiente', total: 300, fecha: '2026-01-04', items: [{ titulo: 'Pendiente', cantidad: 1 }], tipo_entrega: 'domicilio' },
        { id_orden: 4, estado: 'cancelada', total: 400, fecha: '2026-01-01', items: [{ titulo: 'Cancelada', cantidad: 1 }], tipo_entrega: 'domicilio' },
      ],
    })
    render(<MemoryRouter><SeccionMisCompras userId={7} /></MemoryRouter>)
    expect(await screen.findByText('Entregado')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /Entregadas/ })[0])
    fireEvent.click(screen.getByRole('button', { name: /^Total/ }))
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'mayor_precio' } })
    fireEvent.change(screen.getByPlaceholderText(/Buscar por/), { target: { value: 'En camino' } })
    expect(screen.getAllByText('En camino').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('Restablecer filtros'))
    fireEvent.click(screen.getAllByRole('button', { name: /Ver detalle/i })[0])
    await waitFor(() => expect(mocks.getOrden).toHaveBeenCalled())
    expect(await screen.findByText(/Librería Central/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Notificar llegada/ }))
    await waitFor(() => expect(mocks.notificarLlegadaTienda).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /Cerrar detalles/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /Ver Baucher/ })[0])
    await waitFor(() => expect(screen.getByText('¡Compra Exitosa!')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Cerrar comprobante/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /Por Pagar/ })[0])
    fireEvent.click(screen.getAllByRole('button', { name: /Pagar/ })[1])
    expect(mocks.navigate).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Limpiar 1 pendiente/i }))
    await waitFor(() => expect(mocks.cancelarMisPendientes).toHaveBeenCalled())
  })

  it('paginates a long purchase history and renders delivery details', async () => {
    mocks.getOrdenes.mockResolvedValue({ data: Array.from({ length: 9 }, (_, i) => ({
      id_orden: i + 20, estado: 'entregada', total: i + 1, fecha: `2026-01-${String(i + 1).padStart(2, '0')}`,
      items: [{ titulo: `Compra ${i + 1}`, cantidad: 1 }], tipo_entrega: 'domicilio',
    })) })
    render(<MemoryRouter><SeccionMisCompras userId={7} /></MemoryRouter>)
    expect(await screen.findByText('Compra 9')).toBeInTheDocument()
    fireEvent.change(document.querySelector('#compras-per-page'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    fireEvent.click(screen.getByRole('button', { name: /Anterior/ }))
    fireEvent.change(screen.getByLabelText('Ver:'), { target: { value: '10' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Ver Detalles/ })[0])
    await waitFor(() => expect(mocks.getOrden).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /Cerrar detalles de la orden/ }))
  })

  it('visits every administrator section with empty API results', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
    for (const label of ['Reportes', 'Usuarios', 'Libros', 'Tiendas', 'Órdenes', 'Quejas y reclamos', 'Soporte técnico', 'Mi Perfil']) {
      fireEvent.click((await screen.findAllByText(label, { selector: 'span' }))[0])
      await waitFor(() => expect(screen.getAllByText(label).length).toBeGreaterThan(0))
    }
  })

  it('renders populated administrator tables and exercises row actions', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/usuarios') return Promise.resolve({ data: [
        { id_usuario: 1, nombre_usuario: 'Admin Demo', correo_usuario: 'admin@demo.test', rol: 'admin', estado_usuario: 'Activo' },
        { id_usuario: 2, nombre_usuario: 'Lector Demo', correo_usuario: 'lector@demo.test', rol: 'comprador', estado_usuario: 'Bloqueado' },
      ] })
      if (url === '/api/stored/libros') return Promise.resolve({ data: [
        { id_libro: 1, titulo: 'Libro Admin', autor: 'Autor', precio: 10000, stock: 3, activo: true },
      ] })
      if (url === '/tiendas') return Promise.resolve({ data: [
        { id_tienda: 1, nombre_tienda: 'Tienda Admin', email: 'tienda@demo.test', activa: true },
      ] })
      if (url === '/api/v1/admin/orders') return Promise.resolve({ data: [
        { id_orden: 1, total: 25000, estado: 'pagado', usuario: { nombre: 'Lector Demo' } },
      ] })
      if (url === '/quejas/admin/todas') return Promise.resolve({ data: [
        { id_solicitud: 1, id_orden: 1, tipo_solicitud: 'reclamo', asunto: 'Reclamo demo', descripcion: 'Detalle',
          estado: 'Abierto', comprador: 'Lector Demo', nombre_tienda: 'Tienda Admin',
          titulo_libro: 'Libro Admin', nombre_vendedor: 'Vendedor Demo', correo_vendedor: 'vendedor@demo.test',
          telefono_tienda: '3001234567', fecha_creacion: '2026-01-01', evidencia_url: '/uploads/admin.jpg' },
      ] })
      if (url === '/quejas/1/mensajes') return Promise.resolve({ data: [
        { id_mensaje: 1, nombre_usuario: 'Vendedor Demo', rol: 'vendedor', mensaje: 'Respuesta de tienda' },
      ] })
      if (url === '/envios/orden/1') return Promise.resolve({ data: {
        empresa_mensajeria: 'Mensajería Demo', numero_guia: 'GUIA-1', estado_envio: 'En tránsito',
        fecha_despacho: '2026-01-02', url_rastreo: 'https://tracking.example.test/1',
      } })
      return Promise.resolve({ data: [] })
    })
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
    expect(await screen.findByText('Admin Demo')).toBeInTheDocument()
    fireEvent.click((await screen.findAllByText('Usuarios', { selector: 'span' }))[0])
    fireEvent.click(document.querySelector('button[title="Ver detalles del usuario"]'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalles de usuario' }))
    fireEvent.click(document.querySelector('button[title="Ver detalles del usuario"]'))
    fireEvent.click(screen.getByText('✕'))
    fireEvent.click(document.querySelector('button[title="Ver detalles del usuario"]'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.click(document.querySelector('button[title="Ver detalles del usuario"]'))
    const blockButton = Array.from(document.querySelectorAll('button')).reverse().find((button) =>
      button.textContent.includes('Bloquear') && !button.textContent.includes('Desbloquear'))
    fireEvent.click(blockButton)
    fireEvent.click(screen.getByText('Bloquear Acceso a Usuario'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar confirmación de usuario' }))
    fireEvent.click(Array.from(document.querySelectorAll('button')).reverse().find((button) =>
      button.textContent.includes('Bloquear') && !button.textContent.includes('Desbloquear')))
    fireEvent.click(screen.getByText('Bloquear Acceso a Usuario'))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Bloqueo' }))
    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/usuarios'))
    fireEvent.click((await screen.findAllByText('Libros', { selector: 'span' }))[0])
    fireEvent.click((await screen.findAllByText('Tiendas', { selector: 'span' }))[0])
    fireEvent.click((await screen.findAllByText('Órdenes', { selector: 'span' }))[0])
    fireEvent.click((await screen.findAllByText('Quejas y reclamos', { selector: 'span' }))[0])
    expect(screen.getByText('Quejas y Reclamos')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Libro Admin/ }))
    const chatButton = await screen.findByRole('button', { name: /Contactar \/ Chat con la tienda/ })
    fireEvent.click(chatButton)
    expect(await screen.findByRole('dialog', { name: /Chat y contacto/ })).toBeInTheDocument()
    expect(await screen.findByText('Respuesta de tienda')).toBeInTheDocument()
    const chatInput = screen.getByPlaceholderText(/Escribe un mensaje o indicación/)
    fireEvent.change(chatInput, { target: { value: 'Mensaje admin' } })
    fireEvent.focus(chatInput)
    fireEvent.blur(chatInput)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: /Chat y contacto/ })).getByRole('button', { name: '✕' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver evidencia' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar evidencia del reclamo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Marcar En revisión' }))
    fireEvent.change(screen.getByLabelText('Respuesta o resolución para el usuario:'), { target: { value: 'Revisaremos el caso.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar En revisión' }))
    fireEvent.click(screen.getByRole('button', { name: /Contactar \/ Chat/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar chat con la tienda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar reclamo' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])
  })

  it('handles an unavailable public catalog without leaving skeletons mounted', async () => {
    mocks.apiGet.mockRejectedValue(new Error('offline'))
    render(<MemoryRouter><CarruselPublico /></MemoryRouter>)
    await waitFor(() => expect(screen.queryByText('Recién llegados')).toBeInTheDocument())
    expect(screen.getAllByText('Ver todos →').length).toBe(4)
  })

  it('renders public catalog cards, arrows, links and image fallbacks', async () => {
    mocks.apiGet.mockResolvedValue({ data: { libros: [
      { id_libro: 99, titulo: 'Libro público', autor: 'Autora', precio: 12000,
        nombre_categoria: 'Ciencia', stock: 0, calificacion_tienda: 4.5,
        imagen: 'covers/public.jpg', nombre_tienda: 'Tienda demo' },
      { id_libro: 100, titulo: 'Libro público 2', autor: 'Autor 2', precio: 0,
        nombre_categoria: 'Desconocida', imagen_principal: 'https://example.test/book.jpg' },
    ] } })
    const detail = vi.fn()
    let frames = 0
    window.requestAnimationFrame = vi.fn((callback) => {
      if (frames++ === 0) callback(1000)
      return frames
    })
    render(<MemoryRouter><CarruselPublico onVerDetalles={detail} /></MemoryRouter>)
    expect((await screen.findAllByText('Libro público')).length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByRole('button', { name: 'Anterior' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Siguiente' })[0])
    fireEvent.click(screen.getAllByText('Libro público')[0])
    expect(detail).toHaveBeenCalled()
    fireEvent.error(screen.getAllByAltText('Libro público')[0])
    fireEvent.error(screen.getAllByAltText('Libro público')[0])
    screen.getAllByRole('button', { name: 'Ver todos →' }).forEach((button) => fireEvent.click(button))
  })

  it('covers coupon creation form, alternate discount type and failures', async () => {
    render(<SeccionCuponesVendedor tiendaId={9} darkMode />)
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo cupón' }))
    fireEvent.click(screen.getByRole('button', { name: /Crear cupón/ }))
    fireEvent.change(screen.getByLabelText('Código del cupón *'), { target: { value: 'demo' } })
    fireEvent.click(screen.getByRole('button', { name: /Monto fijo/ }))
    fireEvent.click(screen.getByRole('button', { name: /\$5\.000/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Generar código aleatorio' }))
    fireEvent.change(screen.getByLabelText('Compra mínima'), { target: { value: '10000' } })
    fireEvent.change(screen.getByLabelText('Usos máximos'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2026-01-01T10:00' } })
    fireEvent.change(screen.getByLabelText('Fin'), { target: { value: '2026-12-31T10:00' } })
    fireEvent.click(document.querySelector('button[aria-pressed="true"]'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo cupón' }))
    fireEvent.change(screen.getByLabelText('Código del cupón *'), { target: { value: 'demo' } })
    fireEvent.click(screen.getByRole('button', { name: /Monto fijo/ }))
    fireEvent.click(screen.getByRole('button', { name: /\$5\.000/ }))
    fireEvent.focus(screen.getByLabelText(/Valor del descuento/))
    fireEvent.blur(screen.getByLabelText(/Valor del descuento/))
    fireEvent.click(screen.getByRole('button', { name: /Crear cupón/ }))
    await waitFor(() => expect(mocks.crearCupon).toHaveBeenCalled())

    mocks.crearCupon.mockRejectedValueOnce({ response: { data: { detail: 'No se pudo crear' } } })
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo cupón' }))
    fireEvent.change(screen.getByLabelText('Código del cupón *'), { target: { value: 'fallo' } })
    fireEvent.change(screen.getByLabelText(/Valor del descuento/), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Crear cupón/ }))
    await waitFor(() => expect(mocks.crearCupon).toHaveBeenCalledTimes(2))
  })

  it('renders coupon cards and exercises edit, toggle and delete actions', async () => {
    mocks.getCuponesTienda.mockResolvedValue({
      data: [
        { id_cupon: 4, codigo_cupon: 'ACTIVO', activo: 1, tipo_descuento: 'porcentaje', valor_descuento: 20, usos_actuales: 2, usos_maximos: 10, minimo_compra: 5000, fecha_fin: '2099-12-31' },
        { id_cupon: 5, codigo_cupon: 'INACTIVO', activo: 0, tipo_descuento: 'monto_fijo', valor_descuento: 10000, usos_actuales: 0 },
      ],
    })
    window.confirm = vi.fn(() => true)
    render(<SeccionCuponesVendedor tiendaId={9} />)
    expect(await screen.findByText('ACTIVO')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Activo' }))
    await waitFor(() => expect(mocks.editarCupon).toHaveBeenCalled())
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    expect(screen.getByRole('heading', { name: 'Editar cupón' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    await waitFor(() => expect(mocks.eliminarCupon).toHaveBeenCalledWith(4))
  })

  it('covers buyer complaint empty and loading/error states', async () => {
    mocks.getOrdenes.mockResolvedValue({ data: [] })
    mocks.getQuejas.mockResolvedValue({ data: [] })
    render(<QuejasReclamos />)
    expect(await screen.findByText('No hay compras disponibles')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mis quejas y reclamos' }))
    expect(screen.getByText('No hay solicitudes')).toBeInTheDocument()
  })

  it('opens the selected order details while creating a complaint', async () => {
    mocks.getOrdenes.mockResolvedValue({ data: [{
      id_orden: 31, estado: 'pagado', total: 45000, fecha: '2026-03-01',
      tienda: { nombre_tienda: 'Tienda Reclamos' },
      items: [{ titulo: 'Libro reclamado', cantidad: 1, precio: 45000, imagen: '/cover.jpg' }],
    }] })
    mocks.getQuejas.mockResolvedValue({ data: [] })
    render(<QuejasReclamos />)
    const orderSelect = await screen.findByRole('combobox')
    fireEvent.change(orderSelect, { target: { value: '31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalles' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '✕' }))
  })

  it('renders complaint history, order details and chat actions', async () => {
    mocks.getOrdenes.mockResolvedValue({ data: [{
      id_orden: 31, estado: 'pagado', total: 45000, fecha: '2026-03-01',
      tienda: { nombre_tienda: 'Tienda Reclamos' },
      items: [{ titulo: 'Libro reclamado', cantidad: 1, precio: 45000 }],
    }] })
    mocks.getQuejas.mockResolvedValue({ data: Array.from({ length: 6 }, (_, index) => ({
      id_solicitud: index + 8, id_orden: 31, tipo_solicitud: 'reclamo', estado: index === 1 ? 'Cerrado' : 'Abierto',
      asunto: index === 0 ? 'Libro reclamado' : `Reclamo ${index}`,
      descripcion: index === 0 ? 'Descripción del reclamo' : 'Detalle',
      comprador: 'Ana', titulo_libro: index === 0 ? 'Libro reclamado' : `Libro ${index}`, evidencia_url: '/uploads/evidencia.jpg',
    })) })
    mocks.getMensajesReclamo.mockResolvedValue({ data: [{ id: 1, mensaje: 'Hola', remitente: 'admin' }] })
    render(<QuejasReclamos />)
    fireEvent.click(await screen.findByRole('button', { name: 'Mis quejas y reclamos' }))
    expect(await screen.findByText('Descripción del reclamo')).toBeInTheDocument()
    const selects = document.querySelectorAll('select')
    fireEvent.change(selects[selects.length - 1], { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: '›' }))
    fireEvent.click(screen.getByRole('button', { name: /Chat/ }))
    expect(await screen.findByText('Hola')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Respuesta' } })
    fireEvent.click(screen.getByRole('button', { name: '→' }))
    fireEvent.click(screen.getByRole('button', { name: /Ver evidencia/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar vista de evidencia' }))
    window.confirm = vi.fn(() => true)
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])
    await waitFor(() => expect(mocks.cancelarQueja).toHaveBeenCalled())
  })
})
