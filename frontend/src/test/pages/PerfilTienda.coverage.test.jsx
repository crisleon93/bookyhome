import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import PerfilTienda from '../../pages/PerfilTienda'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  navigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => ({ id: '32' }),
  }
})
vi.mock('../../services/api', () => ({
  default: { get: mocks.apiGet },
  getApiBaseUrl: mocks.getApiBaseUrl,
}))

const perfil = {
  tienda: { id_tienda: 32, nombre_tienda: 'Librería Central' },
  configuracion: {
    ciudad_origen: 'Bogotá',
    descripcion: 'Libros para lectores curiosos',
    email_publico: 'contacto@example.com',
    horario_atencion: 'Lunes a viernes',
    logo_url: '/logo.png',
    politica_devoluciones: 'Cambios en 30 días',
    politica_envios: 'Envíos nacionales',
    tiempo_despacho_dias: 2,
  },
  libros: [{
    id_libro: 5,
    titulo: 'Libro destacado',
    autor_libro: 'Autora',
    precio_libro: 24000,
    imagenes: [],
  }],
}

describe('PerfilTienda web', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.apiGet.mockResolvedValue({ data: perfil })
  })

  it('muestra la información, filtra datos opcionales y navega al libro', async () => {
    render(<PerfilTienda />)
    expect(await screen.findByRole('heading', { name: 'Librería Central' })).toBeTruthy()
    expect(screen.getByText('Libros para lectores curiosos')).toBeTruthy()
    expect(screen.getByText('Lunes a viernes')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Libro destacado/ }))
    expect(mocks.navigate).toHaveBeenCalledWith('/catalogo?q=Libro%20destacado')

    fireEvent.click(screen.getByRole('button', { name: 'Ver catálogo →' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/catalogo?tienda=32')
    expect(mocks.apiGet).toHaveBeenCalledWith('/configuracion/32')
  })

  it('muestra el estado no encontrado cuando la API falla', async () => {
    mocks.apiGet.mockRejectedValueOnce(new Error('offline'))
    render(<PerfilTienda />)
    expect(await screen.findByText('Esta librería no existe o no está disponible')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas las librerías' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/librerias')
  })

  it('actualiza el tema cuando cambia el evento de modo oscuro', async () => {
    render(<PerfilTienda />)
    await screen.findByRole('heading', { name: 'Librería Central' })
    localStorage.setItem('darkMode', 'true')
    act(() => window.dispatchEvent(new Event('darkModeChange')))
    expect(document.querySelector('main').style.background).toBe('rgb(26, 26, 26)')
  })
})
