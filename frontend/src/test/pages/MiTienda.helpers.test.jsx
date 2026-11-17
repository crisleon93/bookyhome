import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  BadgeEstado,
  BadgeCategoriaLibro,
  AlertaStock,
  ModalStock,
  ModalCodigoLibro,
  ModalRetiroTienda,
  StarIcon,
  Stars,
  SeccionCalificacionesVendedor,
} from '../../pages/MiTienda'
import {
  categoriaColor,
  getCategoriaBadgeStyle,
  parseFechaPedido,
  infoEstadoEnvio,
  resolveImageUrl,
  resolveLibroCandidate,
  getLibroImageUrl,
  formatPrecio,
  normalizarEstado,
  initials,
  AVATAR_COLORS,
  avatarColor,
  getSellerMediaStorageKey,
  clearLegacySellerMediaCache,
} from '../../pages/MiTienda.utils'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  default: {
    get: mocks.apiGet,
    patch: mocks.apiPatch,
  },
  getApiBaseUrl: () => 'https://api.bookyhome.test',
  habilitarPagoRetiro: vi.fn(),
  confirmarEntregaRetiro: vi.fn(),
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: (token) => {
    if (token === 'valid-sub') return { sub: 12 }
    if (token === 'valid-id') return { id: 34 }
    if (token === 'valid-usuario-id') return { usuario_id: 56 }
    if (token === 'valid-user-id') return { user_id: 78 }
    if (token === 'empty-user') return {}
    throw new Error('Invalid token')
  },
}))

describe('MiTienda - Helper functions and utility components', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('categoriaColor', () => {
    const categories = [
      'terror',
      'ciencia',
      'científica',
      'romance',
      'fantasía',
      'historia',
      'tecnología',
      'juvenil',
      'infantil',
      'aventura',
      'arte',
      'biografía',
      'educación',
      'ficción',
      'comedia',
      'desconocida',
    ]

    it('devuelve colores esperados en dark=true para todas las categorías', () => {
      categories.forEach((cat) => {
        const res = categoriaColor(cat, true)
        expect(res).toHaveProperty('bg')
        expect(res).toHaveProperty('color')
      })
      // Categoría no mapeada
      expect(categoriaColor('cocina', true)).toEqual({ bg: '#2a1a24', color: '#e05a7a' })
    })

    it('devuelve colores esperados en dark=false para todas las categorías', () => {
      categories.forEach((cat) => {
        const res = categoriaColor(cat, false)
        expect(res).toHaveProperty('bg')
        expect(res).toHaveProperty('color')
      })
      expect(categoriaColor('cocina', false)).toEqual({ bg: '#f4eef0', color: '#7a1e3a' })
    })
  })

  describe('getCategoriaBadgeStyle', () => {
    const categories = [
      'terror',
      'ciencia',
      'romance',
      'fantasía',
      'historia',
      'tecnología',
      'juvenil',
      'infantil',
      'aventura',
      'arte',
      'biografía',
      'educación',
      'filosofía',
      'poesía',
      'comedia',
      'ficción',
    ]

    it('devuelve estilos para cada categoría y el valor por defecto', () => {
      categories.forEach((cat) => {
        const style = getCategoriaBadgeStyle(cat)
        expect(style).toHaveProperty('bg')
        expect(style).toHaveProperty('color')
        expect(style).toHaveProperty('border')
      })
      expect(getCategoriaBadgeStyle('otra')).toEqual({ bg: '#f4eef0', color: '#7A1E3A', border: '#fbcfe8' })
      expect(getCategoriaBadgeStyle('')).toEqual({ bg: '#f4eef0', color: '#7A1E3A', border: '#fbcfe8' })
    })
  })

  describe('parseFechaPedido', () => {
    it('procesa fechas nulas, cadenas YYYY-MM-DD y fechas estándar', () => {
      expect(parseFechaPedido(null)).toBeInstanceOf(Date)
      expect(parseFechaPedido('')).toBeInstanceOf(Date)

      const parsed = parseFechaPedido('2026-03-25T14:30:00')
      expect(parsed.getFullYear()).toBe(2026)
      expect(parsed.getMonth()).toBe(2) // marzo (0-indexado)
      expect(parsed.getDate()).toBe(25)

      const invalid = parseFechaPedido('invalid-date')
      expect(invalid).toBeInstanceOf(Date)

      const timestampDate = parseFechaPedido(1700000000000)
      expect(timestampDate.getTime()).toBe(1700000000000)
    })
  })

  describe('infoEstadoEnvio', () => {
    it('maneja pedidos sin envío', () => {
      expect(infoEstadoEnvio({ estado: 'entregada' })).toEqual({ clase: 'entregado', texto: 'Entregado' })
      expect(infoEstadoEnvio({ estado: 'pagado' })).toEqual({ clase: 'alerta', texto: 'Sin guía' })
      expect(infoEstadoEnvio({ estado: 'enviado' })).toEqual({ clase: 'alerta', texto: 'Sin guía' })
      expect(infoEstadoEnvio({ estado: 'pendiente' })).toEqual({ clase: 'pendiente', texto: 'Pendiente' })
    })

    it('maneja pedidos con envío sin estado_envio raw', () => {
      expect(infoEstadoEnvio({ estado: 'entregado', envio: { estado_envio: '' } })).toEqual({
        clase: 'entregado',
        texto: 'Entregado',
      })
      expect(infoEstadoEnvio({ estado: 'pagado', envio: { estado_envio: '' } })).toEqual({
        clase: 'camino',
        texto: 'En tránsito',
      })
    })

    it('clasifica según patrones en estado_envio', () => {
      expect(infoEstadoEnvio({ estado: 'pagado', envio: { estado_envio: 'Pedido despachado' } })).toEqual({
        clase: 'entregado',
        texto: 'Entregado',
      })
      expect(infoEstadoEnvio({ estado: 'pagado', envio: { estado_envio: 'En camino hacia la ciudad' } })).toEqual({
        clase: 'camino',
        texto: 'En tránsito',
      })
      expect(infoEstadoEnvio({ estado: 'pagado', envio: { estado_envio: 'Rechazado por destinatario' } })).toEqual({
        clase: 'devolucion',
        texto: 'Devolución',
      })
      expect(infoEstadoEnvio({ estado: 'pagado', envio: { estado_envio: 'verificando datos' } })).toEqual({
        clase: 'procesando',
        texto: 'Verificando datos',
      })
    })
  })

  describe('resolveImageUrl, resolveLibroCandidate y getLibroImageUrl', () => {
    it('resuelve URLs de imagen locales y remotas', () => {
      expect(resolveImageUrl(null)).toBeNull()
      expect(resolveImageUrl(123)).toBeNull()
      expect(resolveImageUrl('   ')).toBeNull()
      expect(resolveImageUrl('http://img.test/pic.png')).toBe('http://img.test/pic.png')
      expect(resolveImageUrl('https://img.test/pic.png')).toBe('https://img.test/pic.png')
      expect(resolveImageUrl('/uploads/pic.png')).toBe('https://api.bookyhome.test/uploads/pic.png')
      expect(resolveImageUrl('uploads/pic.png')).toBe('https://api.bookyhome.test/uploads/pic.png')
    })

    it('resuelve candidatos de imagen en array, cadenas separadas por coma o string', () => {
      expect(resolveLibroCandidate(null)).toBeNull()
      expect(resolveLibroCandidate(['', '  ', 'https://img.test/1.png'])).toBe('https://img.test/1.png')
      expect(resolveLibroCandidate(['', '  '])).toBeNull()
      expect(resolveLibroCandidate('  , /img2.png')).toBe('https://api.bookyhome.test/img2.png')
      expect(resolveLibroCandidate('  ,  ')).toBeNull()
      expect(resolveLibroCandidate('https://img.test/3.png')).toBe('https://img.test/3.png')
    })

    it('obtiene imagen de libro explorando propiedades alternativas', () => {
      expect(getLibroImageUrl(null)).toBeNull()
      expect(getLibroImageUrl({ imagen_url: 'https://img.test/a.png' })).toBe('https://img.test/a.png')
      expect(getLibroImageUrl({ imagen_principal: '/b.png' })).toBe('https://api.bookyhome.test/b.png')
      expect(getLibroImageUrl({ imagen_principal_url: 'https://img.test/c.png' })).toBe('https://img.test/c.png')
      expect(getLibroImageUrl({ imagenes: ['https://img.test/d.png'] })).toBe('https://img.test/d.png')
      expect(getLibroImageUrl({ foto: 'https://img.test/e.png' })).toBe('https://img.test/e.png')
      expect(getLibroImageUrl({})).toBeNull()
    })
  })

  describe('formatPrecio y normalizarEstado', () => {
    it('formatea precio correctamente', () => {
      expect(formatPrecio(null)).toBe('$0 COP')
      expect(formatPrecio(0)).toContain('0')
      expect(formatPrecio(25000)).toContain('25')
    })

    it('normaliza estados de orden correctamente', () => {
      expect(normalizarEstado('pagado')).toBe('pagado')
      expect(normalizarEstado('Aprobada')).toBe('pagado')
      expect(normalizarEstado('en_camino')).toBe('enviado')
      expect(normalizarEstado('entregada')).toBe('entregada')
      expect(normalizarEstado('cancelado')).toBe('cancelada')
      expect(normalizarEstado('otro_estado')).toBe('pendiente')
      expect(normalizarEstado(null)).toBe('pendiente')
    })
  })

  describe('Badges: BadgeEstado y BadgeCategoriaLibro', () => {
    it('renderiza BadgeEstado con distintos estados y modos', () => {
      const { rerender } = render(<BadgeEstado estado="nuevo" darkMode={false} />)
      expect(screen.getByText('Nuevo')).toBeTruthy()

      rerender(<BadgeEstado estado="usado_buen_estado" darkMode={true} />)
      expect(screen.getByText('Buen estado')).toBeTruthy()

      rerender(<BadgeEstado estado="usado_regular" darkMode={false} />)
      expect(screen.getByText('Est. regular')).toBeTruthy()

      rerender(<BadgeEstado estado="desconocido" darkMode={true} />)
      expect(screen.getByText('desconocido')).toBeTruthy()
    })

    it('renderiza BadgeCategoriaLibro cuando tiene categoría o cuando no', () => {
      const { rerender } = render(<BadgeCategoriaLibro categoria={null} />)
      expect(screen.getByText('—')).toBeTruthy()

      rerender(<BadgeCategoriaLibro categoria="Terror" darkMode={false} />)
      expect(screen.getByText('Terror')).toBeTruthy()

      rerender(<BadgeCategoriaLibro categoria="Ciencia Ficción" darkMode={true} />)
      expect(screen.getByText('Ciencia Ficción')).toBeTruthy()
    })
  })

  describe('AlertaStock', () => {
    it('retorna null si no hay alertas', () => {
      const { container } = render(<AlertaStock alertas={[]} umbral={3} />)
      expect(container.firstChild).toBeNull()
    })

    it('renderiza alertas de stock y reacciona a eventos de darkMode', () => {
      const alertas = [{ id_libro: 1, titulo: 'Libro Alerta', stock: 1 }]
      const { rerender } = render(<AlertaStock alertas={alertas} umbral={3} />)
      expect(screen.getByText(/Libro Alerta/)).toBeTruthy()

      localStorage.setItem('darkMode', 'true')
      window.dispatchEvent(new Event('darkModeChange'))
      window.dispatchEvent(new Event('storage'))

      rerender(<AlertaStock alertas={alertas} umbral={3} />)
      expect(screen.getByText(/Libro Alerta/)).toBeTruthy()
    })
  })

  describe('ModalStock', () => {
    it('permite cambiar stock con botones y guardar actualización', async () => {
      const onClose = vi.fn()
      const onActualizado = vi.fn()
      mocks.apiPatch.mockResolvedValueOnce({ data: {} })

      render(
        <ModalStock
          libro={{ id_libro: 10, titulo: 'Libro Stock', stock: 5 }}
          onClose={onClose}
          onActualizado={onActualizado}
        />
      )

      expect(screen.getByText('Gestionar stock')).toBeTruthy()
      expect(screen.getByText('Libro Stock')).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: '+' }))
      fireEvent.click(screen.getByRole('button', { name: '−' }))

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '8' } })

      fireEvent.click(screen.getByRole('button', { name: 'Guardar stock' }))

      await waitFor(() => {
        expect(mocks.apiPatch).toHaveBeenCalledWith(
          '/libros/10/stock',
          expect.any(FormData),
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        expect(onActualizado).toHaveBeenCalled()
      })
    })

    it('muestra error al ingresar stock negativo o error de API', async () => {
      const onClose = vi.fn()
      const onActualizado = vi.fn()

      const { rerender } = render(
        <ModalStock
          libro={{ id_libro: 10, titulo: 'Libro Stock', stock: 0 }}
          onClose={onClose}
          onActualizado={onActualizado}
        />
      )

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '-2' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar stock' }))
      expect(screen.getByText('El stock no puede ser negativo')).toBeTruthy()

      mocks.apiPatch.mockRejectedValueOnce({ response: { data: { detail: 'Error de servidor' } } })
      fireEvent.change(input, { target: { value: '3' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar stock' }))

      await waitFor(() => {
        expect(screen.getByText('Error de servidor')).toBeTruthy()
      })

      fireEvent.click(screen.getByRole('button', { name: 'x' }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('ModalCodigoLibro', () => {
    it('renderiza ID de libro y código de barras', () => {
      const onClose = vi.fn()
      render(
        <ModalCodigoLibro
          libro={{ id_libro: 42, titulo: 'Rayuela', autor_libro: 'Julio Cortázar', isbn: '9780123456789' }}
          onClose={onClose}
        />
      )

      expect(screen.getByText('Código del Libro')).toBeTruthy()
      expect(screen.getByText('BKH-00042')).toBeTruthy()
      expect(screen.getByText(/9780123456789/)).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: 'x' }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('ModalRetiroTienda', () => {
    it('muestra aviso cuando no hay stock disponible', () => {
      render(
        <ModalRetiroTienda
          libro={{ id_libro: 22, titulo: 'Ficciones', stock: 0 }}
          onClose={vi.fn()}
          onConfirmado={vi.fn()}
        />
      )
      expect(screen.getByText('Sin stock disponible')).toBeTruthy()
    })

    it('permite cambiar cantidad y confirmar entrega exitosa', async () => {
      const onClose = vi.fn()
      const onConfirmado = vi.fn()
      mocks.apiPatch.mockResolvedValueOnce({ data: {} })

      render(
        <ModalRetiroTienda
          libro={{ id_libro: 22, titulo: 'Ficciones', stock: 3, precio_libro: 25000 }}
          onClose={onClose}
          onConfirmado={onConfirmado}
        />
      )

      const inputNombre = screen.getByLabelText(/Nombre del cliente que recoge/)
      fireEvent.change(inputNombre, { target: { value: 'Carlos Ruiz' } })

      fireEvent.click(screen.getByRole('button', { name: '+' }))
      fireEvent.click(screen.getByRole('button', { name: '−' }))

      const inputCantidad = screen.getByLabelText(/Unidades a entregar/)
      fireEvent.change(inputCantidad, { target: { value: '2' } })

      fireEvent.click(screen.getByRole('button', { name: 'Entregar y Cobrar' }))

      await waitFor(() => {
        expect(mocks.apiPatch).toHaveBeenCalledWith(
          '/libros/22/stock',
          expect.any(FormData),
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
      })

      expect(screen.getByText('¡Entrega confirmada!')).toBeTruthy()
      await waitFor(() => expect(onConfirmado).toHaveBeenCalled(), { timeout: 2500 })
    })

    it('maneja error en confirmación de retiro', async () => {
      mocks.apiPatch.mockRejectedValueOnce({ response: { data: { detail: 'Fallo al confirmar' } } })
      render(
        <ModalRetiroTienda
          libro={{ id_libro: 22, titulo: 'Ficciones', stock: 3 }}
          onClose={vi.fn()}
          onConfirmado={vi.fn()}
        />
      )

      const inputNombre = screen.getByLabelText(/Nombre del cliente que recoge/)
      fireEvent.change(inputNombre, { target: { value: 'Carlos Ruiz' } })
      fireEvent.click(screen.getByRole('button', { name: 'Entregar y Cobrar' }))

      await waitFor(() => {
        expect(screen.getByText('Fallo al confirmar')).toBeTruthy()
      })
    })
  })

  describe('Estrellas y avatares', () => {
    it('renderiza StarIcon y Stars', () => {
      const { container } = render(
        <div>
          <StarIcon filled={true} size={16} />
          <StarIcon filled={false} size={20} />
          <Stars value={3} />
        </div>
      )
      expect(container.querySelectorAll('svg').length).toBe(7)
    })

    it('calcula iniciales y colores de avatar', () => {
      expect(initials('Gabriel García Márquez')).toBe('GG')
      expect(initials('Alonso')).toBe('A')
      expect(initials('')).toBe('?')
      expect(AVATAR_COLORS).toContain(avatarColor('Ana'))
      expect(avatarColor('')).toBe('#7A1E3A')
    })
  })

  describe('SeccionCalificacionesVendedor', () => {
    it('renderiza calificaciones cuando carga datos', async () => {
      mocks.apiGet.mockResolvedValueOnce({
        data: {
          total: 3,
          promedio: 4.6,
          distribucion: { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 },
          calificaciones: [
            {
              id_calificacion: 1,
              nombre_usuario: 'Mariana Gomez',
              calificacion: 5,
              comentario: 'Excelente servicio',
              fecha_calificacion: new Date().toISOString(),
            },
            {
              id_calificacion: 2,
              nombre_usuario: 'Pedro Pascal',
              calificacion: 3,
              comentario: 'Todo bien',
              fecha_calificacion: new Date().toISOString(),
            },
            {
              id_calificacion: 3,
              nombre_usuario: 'Laura Perez',
              calificacion: 2,
              comentario: '',
              fecha_calificacion: '2025-01-01T10:00:00',
            },
          ],
        },
      })

      render(<SeccionCalificacionesVendedor tiendaId={99} darkMode={true} />)
      expect(await screen.findByText(/Excelente servicio/)).toBeTruthy()
      expect(screen.getByText('Mariana Gomez')).toBeTruthy()
      expect(screen.getByText('Promedio general')).toBeTruthy()
    })

    it('muestra estado vacío cuando total es 0', async () => {
      mocks.apiGet.mockResolvedValueOnce({
        data: { total: 0, promedio: 0, distribucion: {}, calificaciones: [] },
      })
      render(<SeccionCalificacionesVendedor tiendaId={99} darkMode={false} />)
      expect(await screen.findByText(/Aún no tienes calificaciones/)).toBeTruthy()
    })

    it('maneja error al cargar calificaciones', async () => {
      mocks.apiGet.mockRejectedValueOnce(new Error('Network error'))
      render(<SeccionCalificacionesVendedor tiendaId={100} darkMode={false} />)
      expect(await screen.findByText('Calificaciones de tu tienda')).toBeTruthy()
    })
  })

  describe('getSellerMediaStorageKey y clearLegacySellerMediaCache', () => {
    it('resuelve claves de almacenamiento según token', () => {
      expect(getSellerMediaStorageKey('avatar')).toBe('avatar')

      localStorage.setItem('token', 'valid-sub')
      expect(getSellerMediaStorageKey('avatar')).toBe('avatar_12')

      localStorage.setItem('token', 'valid-id')
      expect(getSellerMediaStorageKey('avatar')).toBe('avatar_34')

      localStorage.setItem('token', 'valid-usuario-id')
      expect(getSellerMediaStorageKey('avatar')).toBe('avatar_56')

      localStorage.setItem('token', 'valid-user-id')
      expect(getSellerMediaStorageKey('avatar')).toBe('avatar_78')

      localStorage.setItem('token', 'empty-user')
      expect(getSellerMediaStorageKey('avatar')).toBe('avatar')

      localStorage.setItem('token', 'corrupt')
      expect(getSellerMediaStorageKey('avatar')).toBe('avatar')
    })

    it('limpia las claves legacy en cache', () => {
      localStorage.setItem('vendedor_user_photo_url', 'http://old.jpg')
      localStorage.setItem('vendedor_banner_url', 'http://oldbanner.jpg')
      clearLegacySellerMediaCache()
      expect(localStorage.getItem('vendedor_user_photo_url')).toBeNull()
      expect(localStorage.getItem('vendedor_banner_url')).toBeNull()
    })
  })
})
