import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListaDeseos from '../../pages/ListaDeseos'

const mocks = vi.hoisted(() => ({
  agregarLibroListaDeseos: vi.fn(),
  crearListaDeseos: vi.fn(),
  eliminarFavorito: vi.fn(),
  eliminarLibroListaDeseos: vi.fn(),
  eliminarListaDeseos: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test'),
  getFavoritos: vi.fn(),
  getLibrosListaDeseos: vi.fn(),
  getListasDeseos: vi.fn(),
  navigate: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate }
})

vi.mock('../../services/api', () => ({
  agregarLibroListaDeseos: mocks.agregarLibroListaDeseos,
  crearListaDeseos: mocks.crearListaDeseos,
  eliminarFavorito: mocks.eliminarFavorito,
  eliminarLibroListaDeseos: mocks.eliminarLibroListaDeseos,
  eliminarListaDeseos: mocks.eliminarListaDeseos,
  getApiBaseUrl: mocks.getApiBaseUrl,
  getFavoritos: mocks.getFavoritos,
  getLibrosListaDeseos: mocks.getLibrosListaDeseos,
  getListasDeseos: mocks.getListasDeseos,
}))

vi.mock('../../components/ToastProvider', () => ({ notify: mocks.notify }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconBookOpen: Icon,
    IconFavorites: Icon,
    IconPlus: Icon,
    IconTrash: Icon,
  }
})

const favorite = {
  id_libro: 17,
  titulo: 'Cuentos de prueba',
  autor_libro: 'Autora',
  precio_libro: 12000,
  imagen_url: '/cover.jpg',
  nombre_categoria: 'Ficción',
}

const list = { id_lista: 4, nombre_lista: 'Para leer', total_libros: 1 }

function renderWishlist(props = {}) {
  return render(<MemoryRouter><ListaDeseos {...props} /></MemoryRouter>)
}

describe('ListaDeseos web', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('token', 'token-de-prueba')
    localStorage.removeItem('darkMode')
    mocks.getFavoritos.mockResolvedValue({ data: [favorite] })
    mocks.getListasDeseos.mockResolvedValue({ data: [list] })
    mocks.getLibrosListaDeseos.mockResolvedValue({ data: [] })
    mocks.crearListaDeseos.mockResolvedValue({ data: { id_lista: 9 } })
    mocks.agregarLibroListaDeseos.mockResolvedValue({})
    mocks.eliminarFavorito.mockResolvedValue({})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('redirige al login sin token y carga listas y favoritos al autenticarse', async () => {
    localStorage.removeItem('token')
    renderWishlist()
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/login'))
    expect(mocks.getFavoritos).not.toHaveBeenCalled()

    localStorage.setItem('token', 'token')
    renderWishlist()
    expect(await screen.findByText('Cuentos de prueba')).toBeInTheDocument()
    expect(screen.getByText('Para leer')).toBeInTheDocument()
  })

  it('crea una lista con el nombre recortado y navega el detalle al callback', async () => {
    const onVerLibro = vi.fn()
    renderWishlist({ onVerLibro })
    await screen.findByText('Cuentos de prueba')
    fireEvent.click(screen.getByRole('button', { name: /Nueva/i }))
    fireEvent.change(screen.getByPlaceholderText('Nombre de la lista'), {
      target: { value: '  Próximas lecturas  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() => {
      expect(mocks.crearListaDeseos).toHaveBeenCalledWith({
        nombre_lista: 'Próximas lecturas',
        publica: false,
      })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    expect(onVerLibro).toHaveBeenCalledWith(favorite)
  })

  it('quita un favorito y actualiza la lista visible', async () => {
    renderWishlist()
    await screen.findByText('Cuentos de prueba')
    fireEvent.click(screen.getByRole('button', { name: /Quitar/i }))

    await waitFor(() => expect(mocks.eliminarFavorito).toHaveBeenCalledWith(17))
    expect(screen.queryByText('Cuentos de prueba')).not.toBeInTheDocument()
    expect(mocks.notify).toHaveBeenCalledWith('Libro eliminado de favoritos', 'success')
  })

  it('agrega un favorito a una lista existente', async () => {
    renderWishlist()
    await screen.findByText('Cuentos de prueba')
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a lista' }))
    fireEvent.click(screen.getByRole('button', { name: 'Para leer', exact: true }))

    await waitFor(() => {
      expect(mocks.agregarLibroListaDeseos).toHaveBeenCalledWith(4, { id_libro: 17 })
    })
    expect(mocks.notify).toHaveBeenCalledWith('Libro agregado a la lista', 'success')
  })

  it('abre una lista, elimina uno de sus libros y permite borrar la lista', async () => {
    mocks.getLibrosListaDeseos.mockResolvedValue({ data: [favorite] })
    renderWishlist()
    await screen.findByText('Cuentos de prueba')
    fireEvent.click(screen.getByRole('button', { name: /Para leer/ }))
    expect(await screen.findByText('Para leer', { selector: 'h3' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Quitar/i }))
    await waitFor(() => {
      expect(mocks.eliminarLibroListaDeseos).toHaveBeenCalledWith(4, 17)
    })
    expect(mocks.notify).toHaveBeenCalledWith('Libro eliminado de la lista', 'success')

    fireEvent.click(screen.getByTitle('Eliminar lista'))
    await waitFor(() => expect(mocks.eliminarListaDeseos).toHaveBeenCalledWith(4))
    expect(mocks.notify).toHaveBeenCalledWith('Lista eliminada', 'success')
  })
})
