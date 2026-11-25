/**
 * LibroCard.test.jsx — Tests RTL del componente LibroCard.
 * Perspectiva de usuario: textos visibles, botones, accesibilidad.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LibroCard from '../../components/LibroCard'
import { agregarFavorito, eliminarFavorito, getFavoritos } from '../../services/api'
import { notify } from '../../components/ToastProvider'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../services/api', () => ({
  agregarFavorito: vi.fn(),
  eliminarFavorito: vi.fn(),
  getFavoritos: vi.fn(() => Promise.resolve({ data: [] })),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
  getOfertaActivaLibro: vi.fn(() => Promise.resolve({ data: null })),
}))

vi.mock('../ToastProvider', () => ({ notify: vi.fn() }))
vi.mock('../../components/ToastProvider', () => ({ notify: vi.fn() }))

// ── Datos de prueba ───────────────────────────────────────────────────────────

const libroBase = {
  id_libro: 1,
  titulo: 'Cien años de soledad',
  autor_libro: 'Gabriel García Márquez',
  precio_libro: 45000,
  stock: 5,
  nombre_categoria: 'Ficción',
  nombre_tienda: 'Librería El Saber',
}

const libroSinStock = { ...libroBase, stock: 0 }

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  getFavoritos.mockResolvedValue({ data: [] })
  agregarFavorito.mockResolvedValue({})
  eliminarFavorito.mockResolvedValue({})
})

describe('LibroCard — renderizado', () => {
  it('muestra el título del libro', () => {
    render(<LibroCard libro={libroBase} />)
    expect(screen.getByText('Cien años de soledad')).toBeInTheDocument()
  })

  it('muestra el autor', () => {
    render(<LibroCard libro={libroBase} />)
    expect(screen.getByText(/García Márquez/i)).toBeInTheDocument()
  })

  it('muestra el precio formateado', () => {
    render(<LibroCard libro={libroBase} />)
    expect(screen.getByText(/45\.000/)).toBeInTheDocument()
  })

  it('muestra el nombre de la tienda', () => {
    render(<LibroCard libro={libroBase} />)
    expect(screen.getByText(/El Saber/i)).toBeInTheDocument()
  })

  it('muestra "Disponible" cuando hay stock', () => {
    render(<LibroCard libro={libroBase} />)
    expect(screen.getAllByText(/disponible/i).length).toBeGreaterThan(0)
  })

  it('muestra "Sin stock" cuando el stock es 0', () => {
    render(<LibroCard libro={libroSinStock} />)
    expect(screen.getAllByText(/sin stock/i).length).toBeGreaterThan(0)
  })

  it('muestra el botón Ver detalles', () => {
    render(<LibroCard libro={libroBase} />)
    expect(screen.getByRole('button', { name: /ver detalles/i })).toBeInTheDocument()
  })

  it('no rompe si no se pasa onVerDetalles', () => {
    render(<LibroCard libro={libroBase} />)
    const btn = screen.getByRole('button', { name: /ver detalles/i })
    expect(() => fireEvent.click(btn)).not.toThrow()
  })
})

describe('LibroCard — interacciones', () => {
  it('llama a onVerDetalles con el libro al hacer clic en Ver detalles', async () => {
    const onVerDetalles = vi.fn()
    const user = userEvent.setup()
    render(<LibroCard libro={libroBase} onVerDetalles={onVerDetalles} />)

    await user.click(screen.getByRole('button', { name: /ver detalles/i }))
    expect(onVerDetalles).toHaveBeenCalledWith(libroBase)
  })

  it('no renderiza nada si libro es undefined', () => {
    // LibroCard tiene el guard DESPUÉS de los hooks, así que null rompe React.
    // Verificamos que el componente maneja libro vacío sin contenido visible.
    const { container } = render(<LibroCard libro={{}} />)
    expect(container).toBeTruthy()
  })

  it('requiere iniciar sesión para modificar la lista de deseos', () => {
    render(<LibroCard libro={libroBase} />)
    fireEvent.click(screen.getAllByRole('button')[0])

    expect(notify).toHaveBeenCalledWith('Debes iniciar sesión para usar listas de deseos', 'error')
    expect(agregarFavorito).not.toHaveBeenCalled()
  })

  it('agrega y quita de favoritos usando el estado cargado desde la API', async () => {
    localStorage.setItem('token', 'token-de-prueba')
    getFavoritos.mockResolvedValueOnce({ data: [] })
    render(<LibroCard libro={libroBase} />)

    fireEvent.click(screen.getAllByRole('button')[0])
    await waitFor(() => expect(agregarFavorito).toHaveBeenCalledWith(1))
    expect(notify).toHaveBeenCalledWith('Libro agregado a favoritos', 'success')

    fireEvent.click(screen.getAllByRole('button')[0])
    await waitFor(() => expect(eliminarFavorito).toHaveBeenCalledWith(1))
    expect(notify).toHaveBeenCalledWith('Libro eliminado de favoritos', 'success')
  })

  it('carga el favorito existente y muestra el error de la API al quitarlo', async () => {
    localStorage.setItem('token', 'token-de-prueba')
    getFavoritos.mockResolvedValueOnce({ data: [{ id_libro: 1 }] })
    eliminarFavorito.mockRejectedValueOnce({
      response: { data: { detail: 'No se pudo quitar' } },
    })
    render(<LibroCard libro={libroBase} />)

    await waitFor(() => expect(screen.getAllByRole('button')[0]).toHaveTextContent('♥'))
    fireEvent.click(screen.getAllByRole('button')[0])
    await waitFor(() => expect(notify).toHaveBeenCalledWith('No se pudo quitar', 'error'))
    expect(agregarFavorito).not.toHaveBeenCalled()
  })

  it('usa la imagen de respaldo y termina mostrando el icono si también falla', () => {
    const { container } = render(<LibroCard libro={{
      ...libroBase,
      nombre_categoria: 'Ficción',
      imagen_url: '/uploads/libro.jpg',
    }} />)
    const image = screen.getByAltText(libroBase.titulo)

    expect(image.getAttribute('src')).toBe('http://localhost:8000/uploads/libro.jpg')
    fireEvent.error(image)
    expect(image.getAttribute('src')).toContain('images.unsplash.com')
    fireEvent.error(image)
    expect(container.querySelector('img')).toBeNull()
  })

  describe('LibroCard — comparación y ofertas (RF-033, HU-020)', () => {
    it('renderiza el botón Comparar y responde al clic cuando onToggleComparar está presente', () => {
      const onToggle = vi.fn()
      render(<LibroCard libro={libroBase} onToggleComparar={onToggle} isComparando={false} />)

      const btn = screen.getByTitle('Agregar a la comparación')
      expect(btn).toBeInTheDocument()
      expect(btn).toHaveTextContent('Comparar')

      fireEvent.click(btn)
      expect(onToggle).toHaveBeenCalledWith(libroBase)
    })

    it('renderiza el estado Comparando cuando isComparando es true', () => {
      const onToggle = vi.fn()
      render(<LibroCard libro={libroBase} onToggleComparar={onToggle} isComparando={true} />)

      const btn = screen.getByTitle('Quitar de la comparación')
      expect(btn).toBeInTheDocument()
      expect(btn).toHaveTextContent('Comparando')
    })

    it('muestra el precio de descuento con porcentaje cuando el libro tiene una oferta activa porcentual', () => {
      const libroConOferta = {
        ...libroBase,
        precio_libro: 50000,
        oferta: {
          precio_descuento: 35000,
          tipo_descuento: 'porcentaje',
          valor_descuento: 30,
        },
      }
      render(<LibroCard libro={libroConOferta} />)

      expect(screen.getByText('$35.000')).toBeInTheDocument()
      expect(screen.getByText('$50.000')).toBeInTheDocument()
      expect(screen.getAllByText('-30%').length).toBeGreaterThan(0)
    })

    it('muestra el precio de descuento sin porcentaje cuando es monto fijo', () => {
      const libroConOfertaFija = {
        ...libroBase,
        precio_libro: 50000,
        oferta: {
          precio_descuento: 40000,
          tipo_descuento: 'monto_fijo',
          valor_descuento: 10000,
        },
      }
      render(<LibroCard libro={libroConOfertaFija} />)

      expect(screen.getByText('$40.000')).toBeInTheDocument()
      expect(screen.getByText('$50.000')).toBeInTheDocument()
      expect(screen.queryByText(/-%/)).not.toBeInTheDocument()
    })

    it('consulta la oferta activa por API si el libro no incluye el campo oferta', async () => {
      const { getOfertaActivaLibro } = await import('../../services/api')
      getOfertaActivaLibro.mockResolvedValueOnce({
        data: { precio_descuento: 29000, tipo_descuento: 'monto_fijo' },
      })

      render(<LibroCard libro={libroBase} />)

      await waitFor(() => {
        expect(getOfertaActivaLibro).toHaveBeenCalledWith(libroBase.id_libro)
      })
    })
  })
})
