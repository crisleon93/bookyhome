import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MiTienda, {
  AlertaStock,
  ModalCodigoLibro,
  ModalEditarLibro,
  ModalEliminar,
  ModalRetiroTienda,
  ModalStock,
  ModalVentaFisica,
  SeccionCalificacionesVendedor,
} from '../../pages/MiTienda'

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
      {[
        'Inicio', 'Mis Libros', 'Ventas', 'Pedidos', 'Notificaciones', 'Perfil',
        'Mensajes', 'Calificaciones', 'Quejas y reclamos', 'Soporte técnico',
        'Envíos', 'Clientes', 'Configuración', 'Promociones', 'Cupones',
        'Métodos de cobro', 'Suscripciones', 'Impulsos',
      ].map((section) => (
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
        return Promise.resolve({ data: {
          id_tienda: 9,
          nombre_tienda: 'Librería Central',
          foto_tienda: '/uploads/store.png',
        } })
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

  it('filters inventory by category, availability, condition and sort order', async () => {
    const defaultGet = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/libros/categorias') {
        return Promise.resolve({ data: [
          { id_categoria: 2, nombre_categoria: 'Ficción' },
          { id_categoria: 4, nombre_categoria: 'Clásicos' },
        ] })
      }
      if (path === '/libros/mis-libros') {
        return Promise.resolve({ data: [
          books[0],
          { ...books[1], id_categoria: 4, nombre_categoria: 'Clásicos' },
          { ...books[1], id_libro: 7, titulo: 'Libro con pocas unidades', stock: 2 },
        ] })
      }
      return defaultGet(path)
    })
    renderSeller()
    await screen.findByRole('heading', { name: 'Mis Libros Publicados' })
    const filters = screen.getAllByRole('combobox')

    fireEvent.change(filters[0], { target: { value: '2' } })
    expect(screen.getByText('Cien años de soledad')).toBeInTheDocument()
    expect(screen.queryByText('La casa de los espíritus')).toBeNull()

    fireEvent.change(filters[0], { target: { value: 'todas' } })
    fireEvent.change(filters[1], { target: { value: 'agotados' } })
    expect(screen.getByText('La casa de los espíritus')).toBeInTheDocument()
    expect(screen.queryByText('Cien años de soledad')).toBeNull()

    fireEvent.change(filters[1], { target: { value: 'bajo_stock' } })
    expect(screen.getByText('Libro con pocas unidades')).toBeInTheDocument()
    fireEvent.change(filters[1], { target: { value: 'disponibles' } })
    expect(screen.queryByText('Libro con pocas unidades')).toBeNull()

    fireEvent.change(filters[1], { target: { value: 'todos' } })
    fireEvent.change(filters[2], { target: { value: 'nuevo' } })
    expect(screen.getByText('Cien años de soledad')).toBeInTheDocument()
    expect(screen.queryByText('La casa de los espíritus')).toBeNull()

    fireEvent.change(filters[2], { target: { value: 'todos' } })
    fireEvent.change(filters[3], { target: { value: 'titulo_desc' } })
    const titles = Array.from(document.querySelectorAll('.libro-main-title')).map((el) => el.textContent.trim())
    expect(titles[0]).toBe('Libro con pocas unidades')
    fireEvent.change(screen.getByPlaceholderText('Buscar por título, autor o categoría...'), {
      target: { value: 'título que no existe' },
    })
    expect(screen.getByText('No se encontraron libros')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByText('Cien años de soledad')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Ver:'), { target: { value: '10' } })
    expect(screen.getByText('La casa de los espíritus')).toBeInTheDocument()
  })

  it('navigates through inventory pagination and ellipses', async () => {
    const manyBooks = Array.from({ length: 40 }, (_, index) => ({
      ...books[0],
      id_libro: 100 + index,
      titulo: `Libro inventario ${index + 1}`,
    }))
    const defaultGet = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => path === '/libros/mis-libros'
      ? Promise.resolve({ data: manyBooks })
      : defaultGet(path))
    renderSeller()
    expect(await screen.findByText('Libro inventario 40')).toBeInTheDocument()
    expect(document.querySelector('.pagination-ellipsis')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '2', exact: true }))
    expect(screen.getByText('Libro inventario 32')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    expect(screen.getByText('Libro inventario 8')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '‹ Anterior' }))
    fireEvent.click(screen.getByRole('button', { name: '4', exact: true }))
    expect(screen.getByText('Libro inventario 16')).toBeInTheDocument()
  })

  it('shows the empty inventory prompt when no books have been published', async () => {
    mocks.apiGet.mockImplementation((path) => path === '/libros/mis-libros'
      ? Promise.resolve({ data: [] })
      : Promise.resolve({ data: [] }))
    renderSeller()
    expect(await screen.findByText('No tienes libros publicados')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Publicar primer libro' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/vendedor/publicar')
  })

  it('registra una venta presencial y confirma el descuento de inventario', async () => {
    renderSeller()
    await screen.findByRole('heading', { name: 'Mis Libros Publicados' })
    fireEvent.click(screen.getByRole('button', { name: 'Venta en mostrador' }))
    const saleDialog = within(screen.getByRole('dialog'))
    const selector = document.getElementById('venta-presencial-libro')
    fireEvent.click(selector)
    fireEvent.click(selector)
    const catalogSearch = saleDialog.getByPlaceholderText('Buscar por título, autor o categoría...')
    fireEvent.change(catalogSearch, { target: { value: 'no existe' } })
    expect(saleDialog.getByText('No se encontraron libros con ese término')).toBeInTheDocument()
    fireEvent.click(saleDialog.getByRole('button', { name: '✕' }))
    const firstOption = saleDialog.getByRole('option', { name: /Cien años de soledad/ })
    fireEvent.mouseEnter(firstOption)
    fireEvent.mouseLeave(firstOption)
    fireEvent.keyDown(firstOption, { key: 'Enter' })
    fireEvent.click(saleDialog.getByRole('button', { name: 'Cambiar libro' }))
    fireEvent.click(document.getElementById('venta-presencial-libro'))
    fireEvent.change(screen.getByLabelText(/Nombre del comprador/), {
      target: { value: 'Juan Pérez' },
    })
    fireEvent.change(screen.getByLabelText('Nota interna (opcional)'), {
      target: { value: 'Pagó en efectivo' },
    })
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    fireEvent.click(screen.getByRole('button', { name: '−' }))
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

  it('muestra el error del servidor al registrar una venta presencial', async () => {
    const sold = vi.fn()
    mocks.apiPatch.mockRejectedValueOnce({ response: { data: { detail: 'No se pudo descontar el stock' } } })
    render(<ModalVentaFisica libro={books[0]} libros={books} onClose={vi.fn()} onVendido={sold} />)
    fireEvent.change(screen.getByLabelText(/Nombre del comprador/), {
      target: { value: 'Juan Pérez' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Venta' }))
    expect(await screen.findByText('No se pudo descontar el stock')).toBeInTheDocument()
    expect(sold).not.toHaveBeenCalled()
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

    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }))
    fireEvent.click(screen.getByRole('button', { name: /Ventas este Mes/ }))
    expect(await screen.findByRole('heading', { name: 'Registro de Ventas' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }))
    fireEvent.click(screen.getByRole('button', { name: /Órdenes este Mes/ }))
    expect(await screen.findByRole('heading', { name: 'Pedidos Recibidos' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }))
    const inventorySection = document.getElementById('inventory-health-section')
    inventorySection.scrollIntoView = vi.fn()
    fireEvent.click(screen.getByRole('button', { name: /Salud de Inventario/ }))
    expect(inventorySection.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('caches store branding and loads profile photo, banner and notification preferences', async () => {
    const defaultGet = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/configuracion') {
        return Promise.resolve({ data: {
          logo_url: '/uploads/tienda.png',
          banner_url: '/uploads/portada.png',
        } })
      }
      if (path === '/perfil/mi-perfil') {
        return Promise.resolve({ data: {
          nombre_usuario: 'Ana Vendedora',
          foto_perfil: '/uploads/perfil.png',
          banner_perfil: '/uploads/perfil-banner.png',
          preferencias: {
            notificaciones_promociones: false,
            notificaciones_pedidos: true,
            notificaciones_novedades: true,
          },
        } })
      }
      return defaultGet(path)
    })
    renderSeller('?seccion=Perfil')

    expect(await screen.findByRole('heading', { name: 'Mi Perfil' })).toBeInTheDocument()
    await waitFor(() => {
      expect(localStorage.getItem('vendedor_user_photo_url_42')).toBe('https://api.example.test/uploads/tienda.png')
      expect(localStorage.getItem('vendedor_banner_url_42')).toBe('https://api.example.test/uploads/portada.png')
    })
    expect(screen.getByDisplayValue('Ana')).toBeInTheDocument()
  })

  it('explores chart periods and renders populated sales, bestseller and low-stock summaries', async () => {
    const defaultGet = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/libros/top-vendidos') {
        return Promise.resolve({ data: Array.from({ length: 6 }, (_, index) => ({
          id_libro: 50 + index,
          titulo: `Libro destacado ${index + 1}`,
          autor_libro: 'Autora de prueba',
          nombre_categoria: index === 0 ? 'Ficción' : '',
          precio_libro: 15000 + index * 1000,
          unidades_vendidas: index + 1,
          total_generado: index === 0 ? 90000 : 0,
          estado_libro: 'nuevo',
          imagen_url: index === 0 ? '/uploads/portada.png' : null,
        })) })
      }
      if (path === '/libros/alertas-stock?umbral=3') {
        return Promise.resolve({ data: Array.from({ length: 6 }, (_, index) => ({
          id_libro: 70 + index,
          titulo: `Stock bajo ${index + 1}`,
          stock: index,
        })) })
      }
      return defaultGet(path)
    })
    renderSeller('?seccion=Inicio')

    expect(await screen.findByText('Libro destacado 1')).toBeInTheDocument()
    expect(screen.getByText('Stock bajo 1')).toBeInTheDocument()
    expect(screen.getByText('Ver 1 libro(s) más en Mis Libros →')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mes' }))
    expect(document.querySelector('.current-period-label')).toHaveTextContent(/Este mes/)
    fireEvent.click(screen.getByTitle('Ver mes anterior'))
    expect(screen.getByTitle('Volver al período actual')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Volver al período actual'))

    fireEvent.click(screen.getByRole('button', { name: 'Año' }))
    expect(document.querySelector('.current-period-label')).toHaveTextContent(/Este año/)
    fireEvent.click(screen.getByTitle('Ver año anterior'))
    fireEvent.click(screen.getByTitle('Ver año siguiente'))
    fireEvent.click(screen.getByTitle('Vista en Barras'))
    expect(document.querySelector('.modern-bars-viewport')).toBeInTheDocument()
    fireEvent.mouseEnter(document.querySelector('.modern-bar-col'))
    fireEvent.click(screen.getByTitle('Vista en Curva Suave'))
    fireEvent.mouseEnter(document.querySelector('.svg-point-group'))

    fireEvent.click(screen.getAllByTitle('Ajustar stock')[0])
    expect(await screen.findByText('Gestionar stock')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.change(screen.getByLabelText('Avisar cuando queden:'), { target: { value: '0' } })
    expect(localStorage.getItem('stockUmbral')).toBe('0')
  })

  it('navigates historical chart years across clean scale ranges and missing sale dates', async () => {
    const now = new Date()
    const year = now.getFullYear()
    const sales = [
      { id_orden: 1, fecha: now.toISOString(), total: 70000 },
      { id_orden: 2, fecha: new Date(year, now.getMonth(), 10), total: 1000 },
      { id_orden: 3, fecha: null, total: 9000000 },
      ...[150000, 350000, 800000, 1100000, 1300000, 1700000, 2200000, 3000000, 6000000, 8000000]
        .map((total, index) => ({
          id_orden: index + 10,
          fecha: new Date(year - index - 1, 5, 15).toISOString(),
          total,
        })),
    ]
    const defaultGet = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => path === '/libros/mis-ventas'
      ? Promise.resolve({ data: sales })
      : defaultGet(path))
    renderSeller('?seccion=Inicio')
    await screen.findByRole('heading', { name: /Ana Vendedora/ })

    fireEvent.click(screen.getByRole('button', { name: 'Año' }))
    expect(document.querySelector('.current-period-label')).toHaveTextContent(/Este año/)
    for (let offset = 1; offset <= 11; offset += 1) {
      fireEvent.click(screen.getByTitle('Ver año anterior'))
    }
    expect(document.querySelector('.current-period-label')).toHaveTextContent(`Año ${year - 11}`)
    fireEvent.click(screen.getByTitle('Ver año siguiente'))
    expect(document.querySelector('.current-period-label')).toHaveTextContent(`Año ${year - 10}`)
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

  it('pagina las ventas y cambia el tamaño de página', async () => {
    const sales = Array.from({ length: 12 }, (_, index) => ({
      id_orden: 200 + index,
      fecha: `2026-03-${String(index + 1).padStart(2, '0')}T12:00:00`,
      cliente: `Cliente ${index + 1}`,
      estado: 'pagado',
      titulo: `Libro ${index + 1}`,
      cantidad: 1,
      total: 12000 + index,
      precio_libro: 12000 + index,
    }))
    const defaultGet = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => path === '/libros/mis-ventas'
      ? Promise.resolve({ data: sales })
      : defaultGet(path))
    renderSeller('?seccion=Ventas')
    expect(await screen.findByText('#211')).toBeInTheDocument()
    fireEvent.mouseEnter(document.querySelector('tbody tr'))
    fireEvent.mouseLeave(document.querySelector('tbody tr'))
    fireEvent.click(screen.getByRole('button', { name: /Siguiente ›/ }))
    expect(screen.getByText('#203')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Ver:'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    expect(screen.getByText('#201')).toBeInTheDocument()
  })

  it('pagina una lista larga de notificaciones', async () => {
    const manyNotifications = Array.from({ length: 25 }, (_, index) => ({
      id_notificacion: 100 + index,
      tipo: 'mensaje',
      titulo: `Aviso ${index + 1}`,
      descripcion: `Mensaje ${index + 1}`,
      fecha_creacion: '2026-03-20T12:00:00',
      leida: true,
    }))
    mocks.notificaciones.obtener.mockResolvedValue({ notificaciones: manyNotifications })
    renderSeller('?seccion=Notificaciones')
    expect(await screen.findByText('Aviso 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Siguiente ›/ }))
    expect(screen.getByText('Aviso 11')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    expect(screen.getByText('Aviso 21')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Ver:'), { target: { value: '5' } })
    expect(screen.getByText('Aviso 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Siguiente ›/ }))
    expect(screen.getByText('Aviso 6')).toBeInTheDocument()
  })

  it('filtra, marca como leída y elimina las notificaciones del vendedor', async () => {
    renderSeller('?seccion=Notificaciones')
    expect(await screen.findByText('Nuevo mensaje')).toBeTruthy()
    expect(screen.getByText('Nuevo pedido')).toBeTruthy()

    fireEvent.click(document.querySelector('.notif-filtros button:last-child'))
    expect(screen.getByText('Nuevo mensaje')).toBeTruthy()
    expect(screen.queryByText('Nuevo pedido')).toBeNull()
    fireEvent.click(screen.getByText('✓'))
    await waitFor(() => expect(mocks.notificaciones.marcarLeida).toHaveBeenCalledWith(10))

    fireEvent.click(screen.getByRole('button', { name: /Eliminar mensajes/ }))
    fireEvent.click(screen.getByText('Todas las notificaciones'))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar', exact: true }))
    await waitFor(() => expect(mocks.notificaciones.eliminarVarias).toHaveBeenCalledWith('todas'))
  })

  it('elimina una sola notificación después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mocks.notificaciones.obtener
      .mockResolvedValueOnce({ notificaciones: notifications })
      .mockResolvedValueOnce({ notificaciones: [notifications[1]] })
    renderSeller('?seccion=Notificaciones')
    expect(await screen.findByText('Nuevo mensaje')).toBeInTheDocument()

    fireEvent.click(document.querySelector('.notif-item .btn-eliminar'))
    await waitFor(() => expect(mocks.notificaciones.eliminar).toHaveBeenCalledWith(10))
    expect(screen.queryByText('Nuevo mensaje')).toBeNull()
    expect(screen.getByText('Nuevo pedido')).toBeInTheDocument()
  })

  it('maneja fallos al cargar notificaciones y al ejecutar sus acciones', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.notificaciones.obtener.mockResolvedValue({ notificaciones: notifications })
    mocks.notificaciones.marcarLeida.mockRejectedValueOnce(new Error('read failed'))
    mocks.notificaciones.marcarTodasLeidas.mockRejectedValueOnce(new Error('read all failed'))
    mocks.notificaciones.eliminar.mockRejectedValueOnce(new Error('delete failed'))
    mocks.notificaciones.eliminarVarias.mockRejectedValueOnce(new Error('delete all failed'))
    renderSeller('?seccion=Notificaciones')
    expect(await screen.findByText('Nuevo mensaje')).toBeInTheDocument()

    fireEvent.click(document.querySelector('.notif-item .btn-marcar'))
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
      'Error marcando notificación como leída:',
      expect.any(Error),
    ))
    fireEvent.click(screen.getByRole('button', { name: /Marcar todas/ }))
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
      'Error marcando todas las notificaciones como leídas:',
      expect.any(Error),
    ))
    fireEvent.click(document.querySelector('.notif-item .btn-eliminar'))
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
      'Error eliminando notificación:',
      expect.any(Error),
    ))
    fireEvent.click(screen.getByRole('button', { name: /Eliminar mensajes/ }))
    fireEvent.click(screen.getByText('Todas las notificaciones'))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar', exact: true }))
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
      'Error eliminando notificaciones:',
      expect.any(Error),
    ))
    consoleError.mockRestore()
  })

  it('cubre fallos y respuestas inesperadas en los servicios de la tienda', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.apiGet.mockRejectedValue(new Error('offline'))
    mocks.notificaciones.obtener.mockRejectedValue(new Error('notifications offline'))
    renderSeller('?seccion=Inicio')
    await screen.findByRole('navigation', { name: 'Secciones de tienda' })

    fireEvent.click(screen.getByRole('button', { name: 'Ventas' }))
    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/libros/mis-ventas'))
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }))
    await waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/libros/mis-pedidos'))
    fireEvent.click(screen.getByRole('button', { name: 'Envíos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Perfil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones' }))
    fireEvent.click(screen.getByRole('button', { name: 'Configuración' }))

    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
      'Error cargando perfil del vendedor:',
      expect.any(Error),
    ))
    expect(consoleError).toHaveBeenCalledWith('Error cargando libros:', expect.any(Error))
    expect(consoleError).toHaveBeenCalledWith('Error cargando pedidos:', expect.any(Error))
    expect(consoleError).toHaveBeenCalledWith('Error cargando ventas:', expect.any(Error))
    expect(consoleError).toHaveBeenCalledWith('Error cargando información de tienda:', expect.any(Error))
    expect(consoleError).toHaveBeenCalledWith('Error cargando Configuración avanzada:', expect.any(Error))
    consoleError.mockRestore()
  })

  it('descarta respuestas con formatos inesperados en las secciones de tienda', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.apiGet.mockResolvedValue({ data: { unexpected: true } })
    renderSeller('?seccion=Inicio')
    await screen.findByRole('navigation', { name: 'Secciones de tienda' })
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Respuesta inesperada de mis-libros:', { unexpected: true })
      expect(consoleError).toHaveBeenCalledWith('Respuesta inesperada de categorías:', { unexpected: true })
      expect(consoleError).toHaveBeenCalledWith('Respuesta inesperada de top-vendidos:', { unexpected: true })
      expect(consoleError).toHaveBeenCalledWith('Respuesta inesperada de alertas-stock:', { unexpected: true })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ventas' }))
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
      'Respuesta inesperada de mis-ventas:',
      { unexpected: true },
    ))
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }))
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
      'Respuesta inesperada de mis-pedidos:',
      { unexpected: true },
    ))
    consoleError.mockRestore()
  })

  it('routes notification clicks to messages, orders, promotions and complaints', async () => {
    mocks.notificaciones.obtener.mockResolvedValue({
      notificaciones: [
        ...notifications,
        {
          id_notificacion: 12,
          tipo: 'resena',
          titulo: 'Nueva reseña',
          descripcion: 'Recibiste una reseña',
          fecha_creacion: '2026-03-21T12:00:00',
          leida: true,
        },
        {
          id_notificacion: 13,
          tipo: 'sistema',
          titulo: 'Nuevo reclamo',
          descripcion: 'Tienes un reclamo pendiente',
          fecha_creacion: '2026-03-22T12:00:00',
          leida: true,
        },
      ],
    })
    renderSeller('?seccion=Notificaciones')
    expect(await screen.findByText('Nuevo mensaje')).toBeInTheDocument()

    const openNotification = (title) => {
      fireEvent.click(screen.getByText(title).closest('.notif-item-open'))
    }
    openNotification('Nuevo mensaje')
    expect(screen.getByRole('button', { name: 'Mensajes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Chat mock')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones' }))
    await screen.findByText('Nuevo pedido')
    openNotification('Nuevo pedido')
    expect(screen.getByRole('button', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones' }))
    await screen.findByText('Nueva reseña')
    openNotification('Nueva reseña')
    expect(screen.getByRole('button', { name: 'Promociones' })).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones' }))
    await screen.findByText('Nuevo reclamo')
    openNotification('Nuevo reclamo')
    expect(screen.getByRole('button', { name: 'Quejas y reclamos' })).toHaveAttribute('aria-current', 'page')
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
    const stockDialog = within(screen.getByRole('dialog'))
    fireEvent.click(stockDialog.getByRole('button', { name: '+' }))
    fireEvent.click(stockDialog.getByRole('button', { name: '−' }))
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
    mocks.habilitarPagoRetiro
      .mockResolvedValueOnce({ data: { ok: false, error: 'El pago no está disponible todavía' } })
      .mockRejectedValueOnce({ response: { data: { detail: 'No se pudo habilitar el pago' } } })
      .mockResolvedValueOnce({ data: { ok: true } })
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
    expect(await screen.findByText('El pago no está disponible todavía')).toBeInTheDocument()
    fireEvent.click(btnConfirmarHabilitar)
    expect(await screen.findByText('No se pudo habilitar el pago')).toBeInTheDocument()
    fireEvent.click(btnConfirmarHabilitar)

    await waitFor(() => {
      expect(mocks.habilitarPagoRetiro).toHaveBeenCalledTimes(3)
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

  it('filtra, pagina y abre los detalles y la foto de los pedidos', async () => {
    const orders = [
      {
        id_orden: 501, codigo_compra: 'ORD-501', cliente: 'Laura Compradora',
        correo_cliente: 'laura@example.test', telefono_cliente: '3001234567',
        foto_perfil_cliente: '/laura.jpg', fecha: '2026-03-20T10:00:00',
        estado: 'pagado', tipo_entrega: 'envio', total_orden: 40000,
        direccion_entrega: { ciudad: 'Bogotá', direccion: 'Calle 10' },
        items: [
          { id_libro: 5, titulo: 'Libro A', autor_libro: 'Autora A', cantidad: 1, precio_libro: 20000 },
          { id_libro: 6, titulo: 'Libro B', cantidad: 2, precio_libro: 10000 },
        ],
      },
      { id_orden: 502, codigo_compra: 'ORD-502', cliente: 'Cliente pendiente', estado: 'pendiente', tipo_entrega: 'envio', items: [] },
      { id_orden: 503, codigo_compra: 'ORD-503', cliente: 'Cliente enviado', estado: 'enviado', tipo_entrega: 'envio', envio: { numero_guia: 'GUIA-503' }, items: [] },
      { id_orden: 504, codigo_compra: 'ORD-504', cliente: 'Cliente entregado', estado: 'entregada', tipo_entrega: 'envio', items: [] },
      { id_orden: 505, codigo_compra: 'ORD-505', cliente: 'Cliente cancelado', estado: 'cancelada', tipo_entrega: 'envio', items: [] },
      { id_orden: 506, codigo_compra: 'ORD-506', cliente: 'Cliente retiro', estado: 'pagado', tipo_entrega: 'retiro_tienda', estado_retiro: 'reservado', items: [] },
    ]
    const defaultGet = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => path === '/libros/mis-pedidos'
      ? Promise.resolve({ data: orders })
      : defaultGet(path))
    renderSeller('?seccion=Pedidos')
    expect(await screen.findByText('Laura Compradora')).toBeInTheDocument()

    for (const status of ['Pendientes', 'Pagadas', 'Enviadas', 'Entregadas', 'Canceladas', 'Retiros en Tienda', 'Todos']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(status) }))
    }

    const search = screen.getByPlaceholderText(/Buscar por #orden/)
    fireEvent.change(search, { target: { value: 'no coincide' } })
    expect(screen.getByText(/Tus pedidos actualmente:/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))

    fireEvent.click(screen.getByTitle('Ver foto de perfil'))
    expect(screen.getByRole('dialog', { name: 'Foto de perfil del cliente' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar foto de perfil' })[0])

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle (2)' }))
    const detailDialog = screen.getByRole('dialog', { name: 'Detalle de la orden #501' })
    expect(detailDialog).toBeInTheDocument()
    expect(within(detailDialog).getByText('Libro A')).toBeInTheDocument()
    expect(within(detailDialog).getByText('Libro B')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }))

    fireEvent.click(screen.getByRole('button', { name: /Siguiente ›/ }))
    expect(screen.getByText('Cliente retiro')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /‹ Anterior/ }))
    fireEvent.change(screen.getByLabelText('Ver:'), { target: { value: '10' } })
  })

  it('confirma y finaliza la entrega de un pedido de retiro ya pagado', async () => {
    mocks.apiGet.mockImplementation((path) => path === '/libros/mis-pedidos'
      ? Promise.resolve({ data: [{
        id_orden: 302,
        codigo_compra: 'RET-302',
        cliente: 'Laura Compradora',
        correo_cliente: 'laura@example.test',
        fecha: '2026-03-20T10:00:00',
        estado: 'pagado',
        tipo_entrega: 'retiro_tienda',
        estado_retiro: 'habilitado_pago',
        metodo_pago: 'transferencia',
        total: 22000,
        libros: [{ id_libro: 5, titulo: 'Libro reservado', cantidad: 1, precio_libro: 22000 }],
      }] })
      : Promise.resolve({ data: [] }))
    mocks.confirmarEntregaRetiro.mockResolvedValueOnce({ data: { ok: true } })

    renderSeller('?seccion=Pedidos')
    expect(await screen.findByText('Laura Compradora')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Entregar Libro \(Ya Pagado\)/ }))
    expect(screen.getByRole('dialog', { name: 'Confirmar entrega en tienda' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Entregar Libro Físico/ }))

    await waitFor(() => expect(mocks.confirmarEntregaRetiro).toHaveBeenCalledWith(302, false))
    expect(await screen.findByText(/ha sido finalizada y entregada al cliente/)).toBeInTheDocument()
  })

  it('muestra errores al entregar y permite cobrar efectivo en tienda', async () => {
    mocks.apiGet.mockImplementation((path) => path === '/libros/mis-pedidos'
      ? Promise.resolve({ data: [
        {
          id_orden: 601, codigo_compra: 'RET-601', cliente: 'Compradora pagada',
          estado: 'pagado', tipo_entrega: 'retiro_tienda', estado_retiro: 'en_tienda',
          metodo_pago: 'transferencia', pin_retiro: '1234',
          items: [{ id_libro: 5, titulo: 'Libro pagado', cantidad: 1 }],
        },
        {
          id_orden: 602, codigo_compra: 'RET-602', cliente: 'Comprador efectivo',
          estado: 'pendiente', tipo_entrega: 'retiro_tienda', estado_retiro: 'en_tienda',
          metodo_pago: 'efectivo', pin_retiro: '5678',
          items: [{ id_libro: 6, titulo: 'Libro en caja', cantidad: 2 }],
        },
      ] })
      : Promise.resolve({ data: [] }))
    mocks.confirmarEntregaRetiro
      .mockRejectedValueOnce({ response: { data: { detail: 'No se pudo confirmar la entrega' } } })
      .mockResolvedValueOnce({ data: { ok: true } })

    renderSeller('?seccion=Pedidos')
    expect(await screen.findByText('Compradora pagada')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Entregar Libro/ }))
    fireEvent.click(screen.getByRole('button', { name: /Entregar Libro Físico/ }))
    expect(await screen.findByText('No se pudo confirmar la entrega')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    fireEvent.click(screen.getByRole('button', { name: /Cobrar Efectivo y Entregar/ }))
    fireEvent.click(screen.getByRole('button', { name: /Cobrar y Entregar Libro/ }))
    await waitFor(() => expect(mocks.confirmarEntregaRetiro).toHaveBeenCalledWith(602, true))
    expect(await screen.findByText(/ha sido finalizada y entregada al cliente/)).toBeInTheDocument()
  })

  it('gestiona la sección de Envíos y aplica filtros', async () => {
    const orders = Array.from({ length: 10 }, (_, index) => ({
      id_orden: 201 + index,
      codigo_compra: `ENV-${201 + index}`,
      cliente: index === 0 ? 'Daniela Mejia' : `Cliente ${index + 1}`,
      correo_cliente: 'daniela@test.com',
      fecha: new Date().toISOString(),
      estado: 'pagado',
      tipo_entrega: 'envio',
      total: 50000,
      envio: null,
    }))
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

    fireEvent.click(document.querySelector('.envios-stat--todos'))
    fireEvent.click(screen.getByRole('button', { name: /Siguiente ›/ }))
    expect(screen.getByText('Compra ENV-209')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /‹ Anterior/ }))

    // Filtro por fecha
    const selectFecha = screen.getByLabelText(/Filtrar por fecha/i)
    fireEvent.change(selectFecha, { target: { value: '30d' } })

    // Búsqueda en envíos
    const inputBusquedaEnvios = screen.getByPlaceholderText(/Buscar por compra/i)
    fireEvent.change(inputBusquedaEnvios, { target: { value: 'ENV-201' } })
    expect(screen.getByText(/Daniela Mejia/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
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

  it('valida el nombre de la tienda antes de guardar sus opciones de configuración', async () => {
    const getDefault = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => path === '/configuracion'
      ? Promise.resolve({ data: { alertas_email: true, costo_envio: 5000 } })
      : getDefault(path))
    renderSeller('?seccion=Configuración')
    await screen.findByRole('heading', { name: 'Configuración de tienda' })

    const name = screen.getByLabelText(/Nombre de la tienda/)
    const save = screen.getByRole('button', { name: /Guardar cambios/ })
    await waitFor(() => expect(name.value).toBe('Librería Central'))
    fireEvent.change(name, { target: { value: ' ' } })
    fireEvent.click(save)
    expect(await screen.findByText(/El nombre de la tienda es obligatorio/)).toBeTruthy()

    fireEvent.change(name, { target: { value: 'AB' } })
    fireEvent.click(save)
    expect(await screen.findByText(/El nombre debe tener al menos 3 caracteres/)).toBeTruthy()

    fireEvent.change(name, { target: { value: 'Librería Renovada' } })
    fireEvent.click(save)
    await waitFor(() => {
      expect(mocks.apiPut).toHaveBeenCalledWith(
        '/tiendas/mi-tienda',
        expect.objectContaining({ nombre_tienda: 'Librería Renovada' }),
      )
      expect(mocks.apiPut).toHaveBeenCalledWith('/configuracion', expect.any(Object))
    })
    expect(await screen.findByText('✓ Cambios guardados')).toBeTruthy()
  })

  it('saves identity, policy, shipping and visual settings for the store', async () => {
    const defaultGet = mocks.apiGet.getMockImplementation()
    mocks.apiGet.mockImplementation((path) => {
      if (path === '/configuracion') {
        return Promise.resolve({ data: {
          horario_atencion: '',
          politica_devoluciones: '',
          politica_envios: '',
          tiempo_despacho_dias: 2,
          descripcion: '',
          ciudad_origen: '',
          email_publico: '',
          tarifa_envio: 0,
        } })
      }
      if (path === '/tiendas/mi-tienda') {
        return Promise.resolve({ data: { id_tienda: 9, nombre_tienda: 'Librería Central', fecha_creacion: '2024-01-01' } })
      }
      return defaultGet(path)
    })
    const darkModeChanged = vi.fn()
    window.addEventListener('darkModeChange', darkModeChanged)
    renderSeller('?seccion=Configuración')
    await screen.findByRole('heading', { name: 'Configuración de tienda' })

    fireEvent.change(screen.getByLabelText('Teléfono de contacto'), { target: { value: '3005550011' } })
    fireEvent.change(screen.getByLabelText('Dirección física'), { target: { value: 'Calle 50' } })
    fireEvent.change(screen.getByLabelText('Ciudad de origen'), { target: { value: 'Cali' } })
    fireEvent.change(screen.getByLabelText('Email público'), { target: { value: 'contacto@letras.test' } })
    fireEvent.change(screen.getByLabelText('Horario de atención'), { target: { value: 'Lun a sábados' } })
    fireEvent.change(screen.getByLabelText('Describe tu tienda'), { target: { value: 'Libros seleccionados' } })
    fireEvent.change(screen.getByLabelText('Días promedio de despacho'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Política de envíos'), { target: { value: 'Envíos nacionales' } })
    fireEvent.change(screen.getByLabelText('Política de devoluciones'), { target: { value: 'Cambios en 30 días' } })
    fireEvent.change(document.querySelectorAll('input[type="number"]')[1], { target: { value: '8500' } })
    document.querySelectorAll('#cfg-nombre-tienda, #cfg-telefono, #cfg-direccion, #cfg-ciudad, #cfg-email-publico, #cfg-horario, #tienda-descripcion, #cfg-dias-despacho, #cfg-politica-envios, #cfg-politica-devoluciones')
      .forEach((input) => {
        fireEvent.focus(input)
        fireEvent.blur(input)
      })
    const shippingFee = document.querySelectorAll('input[type="number"]')[1]
    fireEvent.focus(shippingFee)
    fireEvent.mouseEnter(screen.getByRole('button', { name: /Guardar cambios/ }))
    fireEvent.mouseLeave(screen.getByRole('button', { name: /Guardar cambios/ }))
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))

    await waitFor(() => expect(mocks.apiPut).toHaveBeenCalledWith('/configuracion', expect.objectContaining({
      ciudad_origen: 'Cali',
      email_publico: 'contacto@letras.test',
      horario_atencion: 'Lun a sábados',
      descripcion: 'Libros seleccionados',
      tiempo_despacho_dias: 4,
      politica_envios: 'Envíos nacionales',
      politica_devoluciones: 'Cambios en 30 días',
      tarifa_envio: 8500,
    })))
    fireEvent.change(shippingFee, { target: { value: '' } })
    fireEvent.blur(shippingFee)
    expect(shippingFee).toHaveValue(0)
    fireEvent.click(screen.getByLabelText('Activar modo oscuro'))
    expect(localStorage.getItem('darkMode')).toBe('true')
    expect(darkModeChanged).toHaveBeenCalledOnce()
    window.removeEventListener('darkModeChange', darkModeChanged)
  })

  it('shows the backend error when store configuration cannot be saved', async () => {
    mocks.apiPut.mockRejectedValueOnce({ response: { data: { detail: 'Tienda no disponible' } } })
    renderSeller('?seccion=Configuración')
    await screen.findByRole('heading', { name: 'Configuración de tienda' })
    fireEvent.change(screen.getByLabelText(/Nombre de la tienda/), { target: { value: 'Letras nuevas' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }))
    expect(await screen.findByText('⚠️ Error: Tienda no disponible')).toBeInTheDocument()
  })

  it('actualiza datos y preferencias del perfil, y personaliza foto y banner', async () => {
    const profilePhotoUpdated = vi.fn()
    const profileBannerUpdated = vi.fn()
    window.addEventListener('profile-photo-updated', profilePhotoUpdated)
    window.addEventListener('profile-banner-updated', profileBannerUpdated)
    mocks.apiPost.mockImplementation((path) => Promise.resolve({
      data: path === '/perfil/foto-perfil'
        ? { url: '/uploads/seller.jpg' }
        : { url: '/uploads/banner.jpg' },
    }))
    const { unmount } = renderSeller('?seccion=Perfil')
    await screen.findByRole('tab', { name: /Mi perfil/ })
    await screen.findByDisplayValue('Ana')

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana María' } })
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'Gómez' } })
    fireEvent.change(screen.getByLabelText('Telefono'), { target: { value: '3112223344' } })
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Cali' } })
    fireEvent.change(screen.getByLabelText('Direccion'), { target: { value: 'Carrera 10' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Activado' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mocks.apiPut).toHaveBeenCalledWith('/perfil/mi-perfil', expect.objectContaining({
        nombre_usuario: 'Ana María Gómez',
        ciudad: 'Cali',
      }))
    })
    expect(mocks.apiPut).toHaveBeenCalledWith('/perfil/preferencias', expect.objectContaining({
      notificaciones_promociones: false,
    }))

    fireEvent.change(document.querySelector('input[type="file"][accept="image/*"]'), {
      target: { files: [new File(['photo'], 'seller.png', { type: 'image/png' })] },
    })
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      '/perfil/foto-perfil',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ))
    expect(profilePhotoUpdated).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: '✏️ Editar banner' }))
    fireEvent.change(document.getElementById('perfil-banner-upload'), {
      target: { files: [new File(['banner'], 'banner.png', { type: 'image/png' })] },
    })
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      '/perfil/banner',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ))
    expect(profileBannerUpdated).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: '✏️ Editar banner' }))
    fireEvent.click(screen.getByTitle('#1E3A7A'))
    await waitFor(() => expect(mocks.apiPatch).toHaveBeenCalledWith(
      '/perfil/banner-color',
      { banner_color: '#1E3A7A' },
    ))
    fireEvent.click(screen.getByRole('button', { name: '✏️ Editar banner' }))
    fireEvent.change(document.querySelector('input[type="color"]'), { target: { value: '#123456' } })
    await waitFor(() => expect(mocks.apiPatch).toHaveBeenCalledWith(
      '/perfil/banner-color',
      { banner_color: '#123456' },
    ))
    expect(profileBannerUpdated).toHaveBeenCalledTimes(3)

    unmount()
    window.removeEventListener('profile-photo-updated', profilePhotoUpdated)
    window.removeEventListener('profile-banner-updated', profileBannerUpdated)
  })

  it('muestra errores al guardar el perfil y al personalizar imágenes y color', async () => {
    mocks.apiPut.mockRejectedValueOnce(new Error('profile failed'))
    mocks.apiPost
      .mockRejectedValueOnce(new Error('photo failed'))
      .mockRejectedValueOnce(new Error('banner failed'))
    mocks.apiPatch.mockRejectedValueOnce(new Error('color failed'))
    renderSeller('?seccion=Perfil')
    await screen.findByRole('tab', { name: /Mi perfil/ })
    await screen.findByDisplayValue('Ana')

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Error al guardar el perfil')).toBeInTheDocument()

    fireEvent.change(document.querySelector('input[type="file"][accept="image/*"]'), {
      target: { files: [new File(['photo'], 'failed.png', { type: 'image/png' })] },
    })
    expect(await screen.findByText('Error al subir la foto')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '✏️ Editar banner' }))
    fireEvent.change(document.getElementById('perfil-banner-upload'), {
      target: { files: [new File(['banner'], 'failed.png', { type: 'image/png' })] },
    })
    expect(await screen.findByText('Error al subir el banner')).toBeInTheDocument()

    fireEvent.change(document.querySelector('input[type="color"]'), { target: { value: '#123456' } })
    expect(await screen.findByText('Error al guardar el color')).toBeInTheDocument()
  })

  it('recorre secciones de envíos, clientes, configuración y promociones', async () => {
    renderSeller('?seccion=Inicio')
    await screen.findByRole('navigation', { name: 'Secciones de tienda' })

    fireEvent.click(screen.getByRole('button', { name: 'Envíos' }))
    expect(screen.getByRole('navigation', { name: 'Secciones de tienda' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clientes' }))
    expect(screen.getByRole('navigation', { name: 'Secciones de tienda' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Configuración' }))
    expect(screen.getByRole('navigation', { name: 'Secciones de tienda' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Promociones' }))
    expect(await screen.findByText('Ofertas mock')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cupones' }))
    expect(await screen.findByText('Cupones mock')).toBeInTheDocument()
  })

  it('renderiza las pestañas de suscripciones e impulsos desde Perfil', async () => {
    renderSeller('?seccion=Perfil&tab=suscripciones')
    await screen.findByRole('heading', { name: 'Mi Perfil' })
    expect(screen.getByText('Suscripciones mock')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Impulsos' }))
    expect(await screen.findByText('Impulsos mock')).toBeInTheDocument()
  })

  it('redirects legacy billing routes to the matching profile tab', async () => {
    renderSeller()
    fireEvent.click(await screen.findByRole('button', { name: 'Métodos de cobro' }))
    expect(await screen.findByRole('tab', { name: 'Métodos de cobro' })).toHaveAttribute('aria-selected', 'true')
    expect(window.location.search).toContain('seccion=Perfil&tab=cobro')
  })

  it('permite cambiar a cobros y ver cuentas bancarias cargadas', async () => {
    mocks.apiGet.mockImplementation((path) => path.includes('cuentas-bancarias')
      ? Promise.resolve({ data: { cuentas: [{
        id_metodo: 3,
        banco: 'Banco Central',
        tipo_cuenta: 'Ahorros',
        numero_cuenta: '12345678',
        nombre_titular: 'Ana Vendedora',
        cedula_titular: '100200300',
        es_principal: true,
      }, {
        id_metodo: 4,
        banco: 'Banco Secundario',
        tipo_cuenta: 'Corriente',
        numero_cuenta: '87654321',
        nombre_titular: 'Ana Vendedora',
        cedula_titular: '100200300',
        es_principal: false,
      }] } })
      : Promise.resolve({ data: [] }))
    renderSeller('?seccion=Perfil&tab=cobro')
    expect(await screen.findByText('Banco Central')).toBeTruthy()
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'Hacer Principal' }))
    await waitFor(() => expect(mocks.apiPut).toHaveBeenCalledWith(
      '/api/v1/bookypago-finanzas/cuentas-bancarias/42/principal/4',
    ))
    expect(alert).toHaveBeenCalledWith('Cuenta principal actualizada')
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    expect(screen.getByRole('tab', { name: 'Métodos de cobro' })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('tab', { name: 'Suscripciones' }))
    expect(screen.getByText('Suscripciones mock')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Impulsos' }))
    expect(screen.getByText('Impulsos mock')).toBeInTheDocument()
    alert.mockRestore()
  })

  it('muestra el error al guardar una cuenta bancaria', async () => {
    const user = userEvent.setup()
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    mocks.apiGet.mockImplementation((path) => path.includes('cuentas-bancarias')
      ? Promise.resolve({ data: { cuentas: [] } })
      : Promise.resolve({ data: [] }))
    mocks.apiPost.mockRejectedValueOnce({ response: { data: { detail: 'Cuenta duplicada' } } })
    renderSeller('?seccion=Perfil&tab=cobro')
    await screen.findByRole('heading', { name: 'Cuentas Bancarias' })
    await user.click(await screen.findByRole('button', { name: '+ Agregar Cuenta' }))
    await screen.findByRole('heading', { name: 'Agregar Nueva Cuenta' })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(alert).toHaveBeenCalledWith(
      'Error agregando cuenta bancaria: Cuenta duplicada',
    ))
    alert.mockRestore()
  })

  it('registra una cuenta bancaria con los datos del titular', async () => {
    mocks.apiGet.mockImplementation((path) => path.includes('cuentas-bancarias')
      ? Promise.resolve({ data: { cuentas: [] } })
      : Promise.resolve({ data: [] }))
    renderSeller('?seccion=Perfil&tab=cobro')
    await screen.findByRole('heading', { name: 'Cuentas Bancarias' })
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar Cuenta' }))

    fireEvent.change(screen.getByLabelText('Tipo de cuenta bancaria'), { target: { value: 'Ahorros' } })
    fireEvent.change(screen.getByLabelText('Banco'), { target: { value: 'Davivienda' } })
    fireEvent.change(screen.getByLabelText('Número de cuenta'), { target: { value: '99887766' } })
    fireEvent.change(screen.getByPlaceholderText('Nombre del titular'), { target: { value: 'Ana Vendedora' } })
    fireEvent.change(screen.getByPlaceholderText('Cédula del titular'), { target: { value: '100200300' } })
    fireEvent.click(screen.getByLabelText('Marcar como cuenta principal'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/api/v1/bookypago-finanzas/cuentas-bancarias/42',
        {
          tipo_cuenta: 'Ahorros',
          banco: 'Davivienda',
          numero_cuenta: '99887766',
          nombre_titular: 'Ana Vendedora',
          cedula_titular: '100200300',
          es_principal: true,
        },
      )
    })
    expect(screen.queryByRole('heading', { name: 'Agregar Nueva Cuenta' })).toBeNull()
  })

  it('redirige a / si no hay token o cuando se hace logout', async () => {
    localStorage.removeItem('token')
    const { unmount } = render(<MiTienda />)
    expect(mocks.navigate).toHaveBeenCalledWith('/')
    unmount()

    mocks.navigate.mockClear()
    localStorage.setItem('token', 'fake.token')
    render(<MiTienda />)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/')
  })

  it('valida el editor del libro, guarda acceso anticipado y muestra errores', async () => {
    const libro = { ...books[0], fecha_lanzamiento_publico: null, acceso_anticipado: false }
    const close = vi.fn()
    const saved = vi.fn()
    mocks.apiPut.mockRejectedValueOnce({ response: { data: { detail: 'No se pudo actualizar' } } })
    const { rerender } = render(<ModalEditarLibro libro={libro} categorias={[{ id_categoria: 2, nombre_categoria: 'Ficción' }]} onClose={close} onGuardado={saved} />)

    fireEvent.change(screen.getByLabelText('Título *'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'Título correcto' } })
    fireEvent.change(screen.getByLabelText('Autor *'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('El autor es obligatorio')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Autor *'), { target: { value: 'Autora' } })
    fireEvent.change(screen.getByLabelText('Precio (COP) *'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('El precio debe ser mayor a 0')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Precio (COP) *'), { target: { value: '25000' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Preparar acceso anticipado para este libro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Indica cuándo estará disponible el libro para todos')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Disponible para todos desde (hora Colombia)'), {
      target: { value: '2020-01-01T10:00' },
    })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    expect(await screen.findByText('La disponibilidad pública debe ser al menos 24 horas después')).toBeInTheDocument()

    const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const dateValue = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    fireEvent.change(screen.getByLabelText('Disponible para todos desde (hora Colombia)'), {
      target: { value: dateValue },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('No se pudo actualizar')).toBeInTheDocument()
    mocks.apiPut.mockResolvedValueOnce({ data: {} })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(saved).toHaveBeenCalledOnce())
    expect(mocks.apiPut).toHaveBeenCalledTimes(2)
    rerender(<ModalEditarLibro libro={libro} categorias={[]} onClose={close} onGuardado={saved} />)
  })

  it('maneja errores en eliminación y ajuste de stock, y oculta alertas vacías', async () => {
    const close = vi.fn()
    const deleted = vi.fn()
    mocks.apiDelete.mockRejectedValueOnce({ response: { data: { detail: 'Libro en uso' } } })
    render(<ModalEliminar libro={books[0]} onClose={close} onEliminado={deleted} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    expect(await screen.findByText('Libro en uso')).toBeInTheDocument()
    mocks.apiDelete.mockResolvedValueOnce({ data: {} })
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    await waitFor(() => expect(deleted).toHaveBeenCalledOnce())

    mocks.apiPatch.mockRejectedValueOnce({ response: { data: { detail: 'Stock bloqueado' } } })
    const updated = vi.fn()
    const { unmount } = render(<ModalStock libro={books[0]} onClose={close} onActualizado={updated} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar stock' }))
    expect(await screen.findByText('El stock no puede ser negativo')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar stock' }))
    expect(await screen.findByText('Stock bloqueado')).toBeInTheDocument()
    mocks.apiPatch.mockResolvedValueOnce({ data: {} })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar stock' }))
    await waitFor(() => expect(updated).toHaveBeenCalledOnce())
    unmount()

    expect(render(<AlertaStock alertas={[]} umbral={3} />).container.firstChild).toBeNull()
  })

  it('valida ventas presenciales y muestra el estado vacío de alertas', async () => {
    const onClose = vi.fn()
    const sold = vi.fn()
    render(<ModalVentaFisica libros={[]} onClose={onClose} onVendido={sold} />)
    expect(screen.getByText(/selecciona un libro de la lista arriba para registrar la venta/)).toBeInTheDocument()
    expect(sold).not.toHaveBeenCalled()
    expect(render(<AlertaStock alertas={[{ titulo: 'Libro agotado', stock: 0 }]} umbral={1} />).getByText('1 libro con stock bajo')).toBeInTheDocument()
  })

  it('cubre el retiro en tienda, el código digital y las calificaciones del vendedor', async () => {
    const close = vi.fn()
    const confirmed = vi.fn()
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    render(<ModalRetiroTienda libro={books[0]} onClose={close} onConfirmado={confirmed} />)

    const deliver = screen.getByRole('button', { name: /Entregar y Cobrar/ })
    expect(deliver).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Nombre del cliente que recoge *'), {
      target: { value: 'María García' },
    })
    mocks.apiPatch.mockRejectedValueOnce({ response: { data: { detail: 'Reserva vencida' } } })
    fireEvent.click(deliver)
    expect(await screen.findByText('Reserva vencida')).toBeInTheDocument()
    mocks.apiPatch.mockResolvedValueOnce({ data: {} })
    fireEvent.click(deliver)
    expect(await screen.findByText('¡Entrega confirmada!')).toBeInTheDocument()
    expect(mocks.apiPatch).toHaveBeenCalledWith(
      '/libros/5/stock',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    const code = render(<ModalCodigoLibro libro={{ ...books[0], isbn: '9781234567890' }} onClose={close} />)
    expect(screen.getByText('ISBN:')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Copiar Código Digital' }))
    await waitFor(() => expect(alert).toHaveBeenCalledWith(
      'No se pudo copiar el código. Puedes copiarlo manualmente: BKH-00005',
    ))
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Copiar Código Digital' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('BKH-00005'))
    code.unmount()

    mocks.apiGet.mockResolvedValueOnce({ data: {
      total: 3,
      promedio: 4,
      distribucion: { 5: 1, 4: 1, 3: 1, 2: 0, 1: 0 },
      calificaciones: [
        { id_calificacion: 1, nombre_usuario: 'Ana', calificacion: 5, fecha_calificacion: '2026-03-20', comentario: 'Excelente atención' },
        { id_calificacion: 2, nombre_usuario: 'Luis', calificacion: 4, fecha_calificacion: '2026-03-19', comentario: '' },
        { id_calificacion: 3, nombre_usuario: 'Eva', calificacion: 3, fecha_calificacion: '2026-03-18', comentario: 'Buen servicio' },
      ],
    } })
    render(<SeccionCalificacionesVendedor tiendaId={9} darkMode />)
    expect(await screen.findByText('Calificaciones de tu tienda')).toBeInTheDocument()
    expect(await screen.findByText(/Excelente atención/)).toBeInTheDocument()
    expect(screen.getByText(/Buen servicio/)).toBeInTheDocument()
    expect(mocks.apiGet).toHaveBeenCalledWith('/perfil/calificaciones-tienda/9')

    if (previousClipboard) Object.defineProperty(navigator, 'clipboard', previousClipboard)
    else delete navigator.clipboard
    alert.mockRestore()
    consoleError.mockRestore()
  })
})
