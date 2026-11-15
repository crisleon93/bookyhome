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
  confirmarEntregaRetiro: vi.fn(),
  getApiBaseUrl: () => 'https://api.example.test',
  habilitarPagoRetiro: vi.fn(),
}))
vi.mock('../../services/notificaciones', () => ({
  notificacionesService: mocks.notificaciones,
}))
vi.mock('../../components/VendedorSidebar', () => ({
  default: ({ activeSide, setActiveSide, handleLogout }) => (
    <nav aria-label="Secciones de tienda">
      {['Inicio', 'Mis Libros', 'Notificaciones', 'Perfil'].map((section) => (
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
})
