import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import MiTienda from '../../pages/MiTienda'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  navigate: vi.fn(),
  habilitarPagoRetiro: vi.fn(),
  confirmarEntregaRetiro: vi.fn(),
  notificaciones: {
    obtener: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodasLeidas: vi.fn(),
    eliminar: vi.fn(),
    eliminarVarias: vi.fn(),
  },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ search: window.location.search }),
}))
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ sub: 42, nombre: 'Ana Vendedora' }),
}))
vi.mock('../../services/api', () => ({
  default: {
    delete: mocks.apiDelete,
    get: mocks.apiGet,
    patch: mocks.apiPatch,
    post: mocks.apiPost,
    put: mocks.apiPut,
  },
  confirmarEntregaRetiro: mocks.confirmarEntregaRetiro,
  getApiBaseUrl: () => 'https://api.example.test',
  habilitarPagoRetiro: mocks.habilitarPagoRetiro,
}))
vi.mock('../../services/notificaciones', () => ({
  notificacionesService: mocks.notificaciones,
}))
vi.mock('../../components/VendedorSidebar', () => ({
  default: ({ activeSide, setActiveSide, handleLogout }) => (
    <nav aria-label="Secciones de tienda">
      {['Inicio', 'Mis Libros', 'Ventas', 'Pedidos', 'Notificaciones', 'Perfil'].map((section) => (
        <button
          key={section}
          type="button"
          aria-current={activeSide === section ? 'page' : undefined}
          onClick={() => setActiveSide(section)}
        >
          {section}
        </button>
      ))}
      <button type="button" onClick={handleLogout}>Cerrar sesión</button>
    </nav>
  ),
}))
vi.mock('../../components/SeccionOfertas', () => ({ default: () => <div>Ofertas mock</div> }))
vi.mock('../../components/SeccionCuponesVendedor', () => ({ default: () => <div>Cupones mock</div> }))
vi.mock('../../components/SeccionSuscripciones', () => ({ default: () => <div>Suscripciones mock</div> }))
vi.mock('../../components/SeccionImpulsos', () => ({ default: () => <div>Impulsos mock</div> }))
vi.mock('../../pages/Chat', () => ({ default: () => <div>Chat mock</div> }))
vi.mock('../../pages/QuejasVendedor', () => ({ default: () => <div>Reclamos mock</div> }))
vi.mock('../../pages/Soporte', () => ({ default: () => <div>Soporte mock</div> }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconBook: Icon,
    IconBookOpen: Icon,
    IconChartBar: Icon,
    IconStar: Icon,
    IconUser: Icon,
    IconSettings: Icon,
    IconCheck: Icon,
    IconLock: Icon,
    IconPackage: Icon,
    IconMessage: Icon,
    IconGift: Icon,
    IconShoppingBag: Icon,
    IconTruck: Icon,
    IconCreditCard: Icon,
    IconInfo: Icon,
    IconRefresh: Icon,
    IconCalendar: Icon,
    IconSearch: Icon,
    IconPlus: Icon,
    IconTrash: Icon,
    IconDollar: Icon,
    IconEye: Icon,
    IconClose: Icon,
    IconMapPin: Icon,
    IconAlertTriangle: Icon,
  }
})

const books = [
  {
    id_libro: 5,
    titulo: 'Cien años de soledad',
    autor_libro: 'Gabriel García Márquez',
    nombre_categoria: 'Ficción',
    id_categoria: 2,
    descripcion_libro: 'Descripción del libro',
    precio_libro: 35000,
    stock: 5,
    estado_libro: 'nuevo',
  },
  {
    id_libro: 6,
    titulo: 'La casa de los espíritus',
    autor_libro: 'Isabel Allende',
    nombre_categoria: 'Ficción',
    id_categoria: 2,
    descripcion_libro: 'Descripción de la novela',
    precio_libro: 28000,
    stock: 0,
    estado_libro: 'usado_buen_estado',
  },
]

const notifications = [
  {
    id_notificacion: 10,
    tipo: 'mensaje',
    titulo: 'Nuevo mensaje',
    descripcion: 'Tienes un mensaje de una tienda',
    fecha_creacion: '2026-03-20T12:00:00',
    leida: false,
  },
  {
    id_notificacion: 11,
    tipo: 'pedido',
    titulo: 'Nuevo pedido',
    descripcion: 'Tienes un pedido nuevo',
    fecha_creacion: '2026-03-19T12:00:00',
    leida: true,
  },
]

function renderSeller(search = '?seccion=Mis%20Libros') {
  localStorage.setItem('token', 'seller-token')
  window.history.replaceState({}, '', `/mi-tienda${search}`)
  return render(<MiTienda />)
}

describe('MiTienda', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    mocks.navigate.mockReset()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/libros/mis-libros') return Promise.resolve({ data: books })
      if (path === '/perfil/mi-perfil') {
        return Promise.resolve({
          data: {
            nombre_usuario: 'Ana Vendedora',
            correo_usuario: 'ana@example.com',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            direccion: 'Calle 1',
            preferencias: {},
          },
        })
      }
      if (path === '/tiendas/mi-tienda') {
        return Promise.resolve({ data: { id_tienda: 9, nombre_tienda: 'Librería Central' } })
      }
      if (path === '/libros/stats') {
        return Promise.resolve({ data: { total_mes: 120000, total_hoy: 20000, ordenes_mes: 4, ordenes_hoy: 1 } })
      }
      if (path === '/libros/alertas-stock?umbral=3') {
        return Promise.resolve({ data: [books[1]] })
      }
      return Promise.resolve({ data: [] })
    })
    mocks.apiPost.mockResolvedValue({ data: {} })
    mocks.apiPut.mockResolvedValue({ data: {} })
    mocks.apiPatch.mockResolvedValue({ data: {} })
    mocks.apiDelete.mockResolvedValue({ data: {} })
    mocks.notificaciones.obtener.mockResolvedValue({ notificaciones: notifications })
    mocks.notificaciones.marcarLeida.mockResolvedValue({})
    mocks.notificaciones.marcarTodasLeidas.mockResolvedValue({})
    mocks.notificaciones.eliminar.mockResolvedValue({})
    mocks.notificaciones.eliminarVarias.mockResolvedValue({})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('carga el inventario, filtra por título y abre la venta de mostrador', async () => {
    renderSeller()
    expect(await screen.findByRole('heading', { name: 'Mis Libros Publicados' })).toBeTruthy()
    expect(screen.getByText('Cien años de soledad')).toBeTruthy()
    expect(screen.getByText('La casa de los espíritus')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Buscar por título, autor o categoría...'), {
      target: { value: 'cien años' },
    })
    expect(screen.getByText('Cien años de soledad')).toBeTruthy()
    expect(screen.queryByText('La casa de los espíritus')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '✕' }))
    expect(screen.getByText('La casa de los espíritus')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Venta' })[0])
    expect(screen.getByRole('heading', { name: 'Registrar Venta Presencial' })).toBeTruthy()
    expect(screen.getByText('Cien años de soledad')).toBeTruthy()
  })

  it('registra una venta presencial y confirma el descuento de inventario', async () => {
    renderSeller()
    await screen.findByRole('heading', { name: 'Mis Libros Publicados' })
    fireEvent.click(screen.getByRole('button', { name: 'Venta en mostrador' }))
    fireEvent.click(screen.getByRole('option', { name: /Cien años de soledad/ }))
    fireEvent.change(screen.getByLabelText(/Nombre del comprador/), {
      target: { value: 'Juan Pérez' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Venta' }))

    await waitFor(() => {
      expect(mocks.apiPatch).toHaveBeenCalledWith(
        '/libros/5/stock',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
    })
    expect(await screen.findByText('¡Venta registrada con éxito!')).toBeTruthy()
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Se descontaron 1 unidad(es) de "Cien años de soledad"',
    )
  })

  it('valida y guarda los cambios del libro desde el formulario de edición', async () => {
    renderSeller()
    await screen.findByRole('heading', { name: 'Mis Libros Publicados' })
    fireEvent.click(screen.getAllByTitle('Editar información del libro')[0])

    fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'Título actualizado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(mocks.apiPut).toHaveBeenCalledWith(
      '/libros/6',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ))
    const formData = mocks.apiPut.mock.calls[0][1]
    expect(formData.get('titulo')).toBe('Título actualizado')
  })

  it('confirma la eliminación de un libro del catálogo', async () => {
    renderSeller()
    await screen.findByRole('heading', { name: 'Mis Libros Publicados' })
    fireEvent.click(screen.getAllByTitle('Eliminar del catálogo')[0])

    expect(await screen.findByRole('heading', { name: 'Eliminar libro' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    await waitFor(() => expect(mocks.apiDelete).toHaveBeenCalledWith('/libros/6'))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Eliminar libro' })).toBeNull())
  })

  it('muestra el resumen de Inicio y cambia de sección desde los indicadores', async () => {
    renderSeller('?seccion=Inicio')
    expect(await screen.findByRole('heading', { name: /Ana Vendedora/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Libros en Catálogo/ }))
    expect(await screen.findByRole('heading', { name: 'Mis Libros Publicados' })).toBeTruthy()
    expect(mocks.apiGet).toHaveBeenCalledWith('/libros/mis-libros')
  })

  it('agrupa ventas de una orden y permite consultar el detalle de sus libros', async () => {
    const getDefault = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/libros/mis-ventas') {
        return Promise.resolve({ data: [
          {
            id_orden: 71,
            fecha: '2026-03-20T12:00:00',
            cliente: 'Juan Pérez',
            estado: 'pagado',
            titulo: 'Libro uno',
            cantidad: 1,
            total: 12000,
            precio_libro: 12000,
          },
          {
            id_orden: 71,
            fecha: '2026-03-20T12:00:00',
            cliente: 'Juan Pérez',
            estado: 'pagado',
            titulo: 'Libro dos',
            cantidad: 2,
            total: 18000,
            precio_libro: 9000,
          },
        ] })
      }
      return getDefault(path)
    })
    renderSeller('?seccion=Ventas')

    expect(await screen.findByRole('heading', { name: 'Registro de Ventas' })).toBeTruthy()
    expect(screen.getByText('Varios libros')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))

    expect(screen.getByRole('dialog', { name: 'Detalle de la venta' })).toBeTruthy()
    expect(screen.getByText('Libro uno')).toBeTruthy()
    expect(screen.getByText('Libro dos')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalle de venta' }))
    expect(screen.queryByRole('dialog', { name: 'Detalle de la venta' })).toBeNull()
  })

  it('filtra, marca como leída y elimina las notificaciones del vendedor', async () => {
    renderSeller('?seccion=Notificaciones')
    expect(await screen.findByText('Nuevo mensaje')).toBeTruthy()
    expect(screen.getByText('Nuevo pedido')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Mensajes/ }))
    expect(screen.getByText('Nuevo mensaje')).toBeTruthy()
    expect(screen.queryByText('Nuevo pedido')).toBeNull()
    fireEvent.click(screen.getByText('✓'))
    await waitFor(() => expect(mocks.notificaciones.marcarLeida).toHaveBeenCalledWith(10))

    fireEvent.click(screen.getByRole('button', { name: /Eliminar mensajes/ }))
    fireEvent.click(screen.getByText('Todas las notificaciones'))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar', exact: true }))
    await waitFor(() => expect(mocks.notificaciones.eliminarVarias).toHaveBeenCalledWith('todas'))
  })

  it('marca todas como leídas y actualiza datos de perfil', async () => {
    renderSeller('?seccion=Notificaciones')
    expect(await screen.findByText('Marcar todas como leídas')).toBeTruthy()
    fireEvent.click(screen.getByText('Marcar todas como leídas'))
    await waitFor(() => expect(mocks.notificaciones.marcarTodasLeidas).toHaveBeenCalledOnce())

    fireEvent.click(screen.getByRole('button', { name: 'Perfil' }))
    expect(await screen.findByRole('heading', { name: 'Mi Perfil' })).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Métodos de cobro' }))
    expect(screen.getByRole('heading', { name: 'Cuentas Bancarias' })).toBeTruthy()
  })

  it('cierra sesión y limpia el token cuando el vendedor sale', async () => {
    renderSeller('?seccion=Inicio')
    expect(await screen.findByRole('heading', { name: /Ana Vendedora/ })).toBeTruthy()
    fireEvent.click(screen.getByText('Cerrar sesión'))
    expect(localStorage.getItem('token')).toBeNull()
    expect(mocks.navigate).toHaveBeenCalledWith('/')
  })

  it('abre y cierra modal de stock y modal de código desde la lista de libros', async () => {
    renderSeller()
    await screen.findByRole('heading', { name: 'Mis Libros Publicados' })

    // Abrir y cerrar modal de código ID
    fireEvent.click(screen.getAllByTitle('Ver código de barras / identificación del libro')[0])
    expect(await screen.findByText('Código del Libro')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'x' }))
    await waitFor(() => expect(screen.queryByText('Código del Libro')).toBeNull())

    // Abrir y cerrar modal de stock
    fireEvent.click(screen.getAllByTitle('Ajustar unidades en stock')[0])
    expect(await screen.findByText('Gestionar stock')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByText('Gestionar stock')).toBeNull())
  })

  it('gestiona la sección de Pedidos, habilita pago y registra guía de envío', async () => {
    const orders = [
      {
        id_orden: 101,
        codigo_compra: 'ORD-101',
        cliente: 'Beatriz Gomez',
        correo_cliente: 'beatriz@test.com',
        fecha: '2026-03-20T10:00:00',
        estado: 'pagado',
        tipo_entrega: 'envio',
        total: 45000,
        libros: [{ id_libro: 5, titulo: 'Cien años de soledad', cantidad: 1, precio_libro: 45000 }],
        envio: null,
      },
      {
        id_orden: 102,
        codigo_compra: 'ORD-102',
        cliente: 'Carlos Mario',
        correo_cliente: 'carlos@test.com',
        fecha: '2026-03-21T11:00:00',
        estado: 'pendiente',
        tipo_entrega: 'retiro_tienda',
        estado_retiro: 'en_tienda',
        metodo_pago: 'transferencia',
        total: 28000,
        libros: [{ id_libro: 6, titulo: 'La casa de los espíritus', cantidad: 1, precio_libro: 28000 }],
      },
    ]
    const empresas = [{ id_empresa: 1, nombre_empresa: 'Servientrega' }]

    const getDefault = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/libros/mis-pedidos') return Promise.resolve({ data: orders })
      if (path === '/envios/empresas') return Promise.resolve({ data: empresas })
      return getDefault(path)
    })
    mocks.habilitarPagoRetiro.mockResolvedValueOnce({ data: { ok: true } })
    mocks.apiPut.mockResolvedValue({ data: {} })

    renderSeller('?seccion=Pedidos')
    expect(await screen.findByText('Beatriz Gomez')).toBeTruthy()
    expect(screen.getByText('Carlos Mario')).toBeTruthy()

    // Filtro búsqueda
    const inputBuscar = screen.getByPlaceholderText(/Buscar por #orden/i)
    fireEvent.change(inputBuscar, { target: { value: 'Beatriz' } })
    expect(screen.getByText('Beatriz Gomez')).toBeTruthy()
    fireEvent.change(inputBuscar, { target: { value: '' } })

    // Abrir modal de habilitar pago para retiro
    const btnHabilitar = screen.getByRole('button', { name: /Habilitar Pago/i })
    fireEvent.click(btnHabilitar)

    expect(await screen.findByText('Habilitar Cobro / Pago')).toBeTruthy()
    const dialogHabilitar = screen.getByRole('dialog', { name: 'Habilitar pagos en tienda' })
    const btnConfirmarHabilitar = dialogHabilitar.querySelector('button[style*="linear-gradient"]')
    fireEvent.click(btnConfirmarHabilitar)

    await waitFor(() => {
      expect(mocks.habilitarPagoRetiro).toHaveBeenCalledWith(102)
    })

    // Registrar guía desde la sección de pedidos
    const btnRegistrarGuia = screen.getByRole('button', { name: /\+ Registrar Guía/i })
    fireEvent.click(btnRegistrarGuia)

    expect(await screen.findByText(/Registrar Guía de envío/i)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/Empresa de mensajería/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/Número de Guía/i), { target: { value: 'GUIA-101' } })

    fireEvent.click(screen.getByRole('button', { name: /Guardar Guía/i }))
    await waitFor(() => {
      expect(mocks.apiPut).toHaveBeenCalledWith(
        '/envios/orden/101',
        expect.objectContaining({ numero_guia: 'GUIA-101' })
      )
    })
  })

  it('gestiona la sección de Envíos y aplica filtros', async () => {
    const orders = [
      {
        id_orden: 201,
        codigo_compra: 'ENV-201',
        cliente: 'Daniela Mejia',
        correo_cliente: 'daniela@test.com',
        fecha: new Date().toISOString(),
        estado: 'pagado',
        tipo_entrega: 'envio',
        total: 50000,
        envio: null,
      },
    ]
    const empresas = [{ id_empresa: 1, nombre_empresa: 'Servientrega' }]

    const getDefault = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/libros/mis-pedidos') return Promise.resolve({ data: orders })
      if (path === '/envios/empresas') return Promise.resolve({ data: empresas })
      return getDefault(path)
    })

    renderSeller('?seccion=Envíos')
    expect(await screen.findByText(/Envíos y seguimiento/i)).toBeTruthy()
    expect(screen.getByText(/Daniela Mejia/)).toBeTruthy()

    // Filtros de estado de envío
    const botonSinGuia = screen.getByRole('button', { name: /Sin guía/i })
    fireEvent.click(botonSinGuia)

    const botonTodos = screen.getByRole('button', { name: /Todos/i })
    fireEvent.click(botonTodos)

    // Filtro por fecha
    const selectFecha = screen.getByLabelText(/Filtrar por fecha/i)
    fireEvent.change(selectFecha, { target: { value: '30d' } })

    // Búsqueda en envíos
    const inputBusquedaEnvios = screen.getByPlaceholderText(/Buscar por compra/i)
    fireEvent.change(inputBusquedaEnvios, { target: { value: 'ENV-201' } })
    expect(screen.getByText(/Daniela Mejia/)).toBeTruthy()
  })

  it('renderiza secciones complementarias: Configuración, Promociones, Cupones, Reclamos, Soporte y Clientes', async () => {
    const getDefault = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/configuracion') return Promise.resolve({ data: { alertas_email: true } })
      return getDefault(path)
    })

    const { unmount: u1 } = renderSeller('?seccion=Promociones')
    expect(await screen.findByText('Ofertas mock')).toBeTruthy()
    u1()

    const { unmount: u2 } = renderSeller('?seccion=Cupones')
    expect(await screen.findByText('Cupones mock')).toBeTruthy()
    u2()

    const { unmount: u3 } = renderSeller('?seccion=Quejas%20y%20reclamos')
    expect(await screen.findByText('Reclamos mock')).toBeTruthy()
    u3()

    const { unmount: u4 } = renderSeller('?seccion=Soporte%20t%C3%A9cnico')
    expect(await screen.findByText('Soporte mock')).toBeTruthy()
    u4()

    const { unmount: u5 } = renderSeller('?seccion=Clientes')
    expect(await screen.findByText(/Próximamente/i)).toBeTruthy()
    u5()

    const { unmount: u6 } = renderSeller('?seccion=Configuración')
    expect(await screen.findByText(/Configuración de tienda/i)).toBeTruthy()
    u6()
  })
})
