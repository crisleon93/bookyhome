import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ResenaLibro from '../../components/ResenaLibro'
import api from '../../services/api'
import { notify } from '../../components/ToastProvider'

vi.mock('../../services/api', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))
vi.mock('../../components/ToastProvider', () => ({
  notify: vi.fn(),
}))

const reviews = Array.from({ length: 6 }, (_, index) => ({
  id_resena: index + 1,
  id_usuario: index === 0 ? 9 : 20 + index,
  nombre_usuario: index === 0 ? 'Usuario actual' : `Lector ${index}`,
  calificacion: index === 0 ? 5 : index % 2 ? 3 : 4,
  comentario: `Comentario ${index + 1}`,
  fecha_resena: '2026-03-20T12:00:00',
}))

describe('ResenaLibro', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.get.mockResolvedValue({ data: { resenas: reviews, promedio: 4.2 } })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
  })

  it('carga reseñas, filtra por estrellas y pagina los resultados', async () => {
    render(<ResenaLibro idLibro={42} idUsuario={9} />)
    expect(await screen.findByText('4.2')).toBeTruthy()
    expect(screen.getAllByText(/6\s*reseñas/)).toHaveLength(2)
    expect(screen.getByText('Comentario 5')).toBeTruthy()
    expect(screen.queryByText('Comentario 6')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByText('Comentario 6')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Filtrar reseñas por estrellas'), {
      target: { value: '3' },
    })
    expect(screen.getByText('Comentario 2')).toBeTruthy()
    expect(screen.queryByText('Comentario 1')).toBeNull()
    fireEvent.change(screen.getByLabelText('Filtrar reseñas por estrellas'), {
      target: { value: '5' },
    })
    expect(screen.getByText('Comentario 1')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Filtrar reseñas por estrellas'), {
      target: { value: '2' },
    })
    expect(screen.getByText('No hay reseñas con ese filtro.')).toBeTruthy()
    expect(api.get).toHaveBeenCalledWith('/resenas/libro/42')
  })

  it('valida el formulario y crea una reseña con los datos ingresados', async () => {
    api.get.mockResolvedValue({ data: { resenas: reviews.slice(1), promedio: 4 } })
    render(<ResenaLibro idLibro={42} idUsuario={9} />)
    fireEvent.click(await screen.findByRole('button', { name: /Dejar una reseña/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Publicar reseña' }))
    expect(notify).toHaveBeenCalledWith('Por favor selecciona una calificación', 'error')
    fireEvent.click(document.querySelectorAll('.star-btn')[4])
    fireEvent.click(screen.getByRole('button', { name: 'Publicar reseña' }))
    expect(notify).toHaveBeenCalledWith('Por favor escribe un comentario', 'error')

    fireEvent.change(screen.getByPlaceholderText('Comparte la experiencia con este libro...'), {
      target: { value: 'Muy recomendado' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Publicar reseña' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/resenas/crear', {
      id_libro: 42,
      calificacion: 5,
      comentario: 'Muy recomendado',
    }))
    expect(notify).toHaveBeenCalledWith('¡Gracias por tu reseña!', 'success')
  })

  it('cancela el borrado si el usuario declina y elimina cuando confirma', async () => {
    render(<ResenaLibro idLibro={42} idUsuario={9} />)
    expect(await screen.findByText('Usuario actual')).toBeTruthy()
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: '🗑️ Eliminar' }))
    expect(api.delete).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '🗑️ Eliminar' }))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/resenas/1'))
    expect(notify).toHaveBeenCalledWith('Reseña eliminada', 'success')
  })
})
