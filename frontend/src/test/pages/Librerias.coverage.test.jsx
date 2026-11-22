/**
 * Librerias.coverage.test.jsx — Tests de cobertura para Librerias.jsx
 *
 * Cubre: renderizado con loading, carga de tiendas, búsqueda, filtro por
 * ciudad, toggle "Solo con libros", ordenar por calificación, navegación,
 * lista vacía, error de API, helpers parseTiendaInfo / getLogoUrl / normalize.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Librerias from '../../pages/Librerias'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// getApiBaseUrl se llama en el módulo scope, antes del componente
vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}))

// ── Datos de prueba ───────────────────────────────────────────────────────────

const tiendasEjemplo = [
  {
    id_tienda: 1,
    nombre_tienda: 'Librería Central',
    ciudad_origen: 'Bogotá',
    direccion: 'Calle 10 # 5-20, Bogotá',
    descripcion: 'Gran catálogo de libros técnicos.',
    total_libros: 150,
    calificacion_promedio: '4.5',
    total_calificaciones: 30,
    logo_url: null,
  },
  {
    id_tienda: 2,
    nombre_tienda: 'Libros Medellín',
    ciudad_origen: 'Medellín',
    direccion: 'Carrera 70 # 45-10, Medellín',
    descripcion: 'Especialistas en ficción.',
    total_libros: 80,
    calificacion_promedio: '3.8',
    total_calificaciones: 10,
    logo_url: '/media/tiendas/logo2.png',
  },
  {
    id_tienda: 3,
    nombre_tienda: 'Papelería Sin Libros',
    ciudad_origen: 'Cali',
    direccion: 'Av. Roosevelt 15, Cali',
    descripcion: 'Artículos de papelería.',
    total_libros: 0,
    calificacion_promedio: '5.0',
    total_calificaciones: 2,
    logo_url: null,
  },
]

// ── Helper de render ──────────────────────────────────────────────────────────

const renderLibrerias = () =>
  render(
    <MemoryRouter>
      <Librerias />
    </MemoryRouter>
  )

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Librerias — estado de carga', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra esqueletos mientras carga', async () => {
    // La promesa tarda — el componente queda en loading
    const { default: api } = await import('../../services/api')
    api.get.mockReturnValue(new Promise(() => {}))

    renderLibrerias()
    // En estado loading se renderizan 12 divs de esqueleto (sin text visible
    // de tiendas); el heading aún aparece
    expect(screen.queryByText('Librería Central')).toBeNull()
  })
})

describe('Librerias — carga exitosa', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: tiendasEjemplo })
  })

  it('muestra las tiendas tras resolver la API', async () => {
    renderLibrerias()
    await waitFor(() => expect(screen.getByText('Librería Central')).toBeInTheDocument())
    expect(screen.getByText('Libros Medellín')).toBeInTheDocument()
    expect(screen.getByText('Papelería Sin Libros')).toBeInTheDocument()
  })

  it('muestra el contador de librerías encontradas', async () => {
    renderLibrerias()
    await waitFor(() => expect(screen.getByText(/librerías encontradas/i)).toBeInTheDocument())
  })
})

describe('Librerias — búsqueda por nombre', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: tiendasEjemplo })
  })

  it('filtra tiendas según el texto buscado', async () => {
    const user = userEvent.setup()
    renderLibrerias()
    await waitFor(() => screen.getByText('Librería Central'))

    const input = screen.getByPlaceholderText(/buscar librería/i)
    await user.type(input, 'central')

    expect(screen.getByText('Librería Central')).toBeInTheDocument()
    expect(screen.queryByText('Libros Medellín')).toBeNull()
  })

  it('busca ignorando mayúsculas y acentos', async () => {
    const user = userEvent.setup()
    renderLibrerias()
    await waitFor(() => screen.getByText('Libros Medellín'))

    const input = screen.getByPlaceholderText(/buscar librería/i)
    await user.type(input, 'medellin')

    expect(screen.getByText('Libros Medellín')).toBeInTheDocument()
    expect(screen.queryByText('Librería Central')).toBeNull()
  })
})

describe('Librerias — filtro por ciudad', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: tiendasEjemplo })
  })

  it('filtra tiendas al seleccionar una ciudad', async () => {
    const user = userEvent.setup()
    renderLibrerias()
    await waitFor(() => screen.getByText('Librería Central'))

    // El botón de ciudad está en la barra de filtros (tiene un span con el conteo)
    // Usamos getAllByRole y filtramos el que está dentro de la barra de ciudades
    const botonesCiudad = screen.getAllByRole('button', { name: /medellín/i })
    // El botón de filtro de ciudad es el que tiene aria-label vacío (no es una card)
    const botonFiltro = botonesCiudad.find(b => !b.classList.contains('lib-card'))
    await user.click(botonFiltro)

    expect(screen.getByText('Libros Medellín')).toBeInTheDocument()
    expect(screen.queryByText('Librería Central')).toBeNull()
    expect(screen.queryByText('Papelería Sin Libros')).toBeNull()
  })
})

describe('Librerias — toggle "Solo con libros"', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: tiendasEjemplo })
  })

  it('oculta tiendas con 0 libros al activar el filtro', async () => {
    const user = userEvent.setup()
    renderLibrerias()
    await waitFor(() => screen.getByText('Papelería Sin Libros'))

    const toggle = screen.getByRole('button', { name: /solo con libros/i })
    await user.click(toggle)

    expect(screen.queryByText('Papelería Sin Libros')).toBeNull()
    expect(screen.getByText('Librería Central')).toBeInTheDocument()
  })
})

describe('Librerias — ordenar por mejor calificación', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: tiendasEjemplo })
  })

  it('reordena con la tienda mejor valorada primero', async () => {
    renderLibrerias()
    await waitFor(() => screen.getByText('Librería Central'))

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'mejor_calificacion' } })

    // La tienda con 5.0 (Papelería Sin Libros) debería aparecer primero
    const nombres = screen.getAllByText(/Librería Central|Libros Medellín|Papelería Sin Libros/)
    expect(nombres[0].textContent).toBe('Papelería Sin Libros')
  })

  it('cubre los otros criterios de orden y desplaza la lista de ciudades', async () => {
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: tiendasEjemplo })
    const { container } = renderLibrerias()
    await screen.findByText('Librería Central')

    const select = screen.getByRole('combobox')
    const expectedFirst = {
      menos_libros: 'Papelería Sin Libros',
      nombre_asc: 'Librería Central',
      nombre_desc: 'Papelería Sin Libros',
      mas_libros: 'Librería Central',
    }
    for (const [order, name] of Object.entries(expectedFirst)) {
      fireEvent.change(select, { target: { value: order } })
      const cards = Array.from(container.querySelectorAll('.lib-card__nombre'))
      expect(cards[0].textContent).toBe(name)
    }

    const cityBar = Array.from(container.querySelectorAll('div')).find((element) => element.style.overflowX === 'auto')
    const scrollBy = vi.fn()
    cityBar.scrollBy = scrollBy
    fireEvent.click(screen.getByRole('button', { name: 'Desplazar ciudades a la izquierda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Desplazar ciudades a la derecha' }))
    expect(scrollBy).toHaveBeenNthCalledWith(1, { left: -260, behavior: 'smooth' })
    expect(scrollBy).toHaveBeenNthCalledWith(2, { left: 260, behavior: 'smooth' })
  })
})

describe('Librerias — navegación al hacer click en tienda', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: tiendasEjemplo })
  })

  it('navega a /tienda/:id al hacer click en una tienda', async () => {
    const user = userEvent.setup()
    renderLibrerias()
    await waitFor(() => screen.getByText('Librería Central'))

    // Las tiendas se renderizan como botones
    const boton = screen.getByRole('button', { name: /librería central/i })
    await user.click(boton)

    expect(mockNavigate).toHaveBeenCalledWith('/tienda/1')
  })
})

describe('Librerias — lista vacía', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: [] })
  })

  it('muestra mensaje cuando no hay librerías', async () => {
    renderLibrerias()
    await waitFor(() =>
      expect(screen.getByText(/no se encontraron librerías/i)).toBeInTheDocument()
    )
  })
})

describe('Librerias — error de API', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    api.get.mockRejectedValue(new Error('Network error'))
  })

  it('muestra lista vacía sin romper el render', async () => {
    renderLibrerias()
    await waitFor(() =>
      expect(screen.getByText(/no se encontraron librerías/i)).toBeInTheDocument()
    )
  })
})

// ── Tests de helpers internos ─────────────────────────────────────────────────
// Se prueban indirectamente a través del render, o directamente importando
// (ya que no se exportan, los cubrimos vía render con datos específicos).

describe('Librerias — parseTiendaInfo normaliza ciudades', () => {
  beforeEach(() => vi.clearAllMocks())

  const cases = [
    { ciudad_origen: 'bogota', expected: 'Bogotá' },
    { ciudad_origen: 'medellin', expected: 'Medellín' },
    { ciudad_origen: 'barranquilla', expected: 'Barranquilla' },
    { ciudad_origen: 'cartagena', expected: 'Cartagena' },
    { ciudad_origen: 'santa marta', expected: 'Santa Marta' },
    { ciudad_origen: 'bucaramanga', expected: 'Bucaramanga' },
    { ciudad_origen: 'pereira', expected: 'Pereira' },
    { ciudad_origen: 'manizales', expected: 'Manizales' },
    { ciudad_origen: 'armenia', expected: 'Armenia' },
    { ciudad_origen: 'ibague', expected: 'Ibagué' },
    { ciudad_origen: 'neiva', expected: 'Neiva' },
    { ciudad_origen: 'villavicencio', expected: 'Villavicencio' },
    { ciudad_origen: 'pasto', expected: 'Pasto' },
    { ciudad_origen: '', expected: 'Bogotá' },
    { ciudad_origen: 'colombia', expected: 'Bogotá' },
  ]

  cases.forEach(({ ciudad_origen, expected }) => {
    it(`normaliza "${ciudad_origen}" → "${expected}"`, async () => {
      const { default: api } = await import('../../services/api')
      api.get.mockResolvedValue({
        data: [{
          id_tienda: 99,
          nombre_tienda: 'Tienda Test',
          ciudad_origen,
          direccion: '',
          descripcion: 'desc',
          total_libros: 1,
          calificacion_promedio: '0',
          total_calificaciones: 0,
          logo_url: null,
        }],
      })

      renderLibrerias()
      // La ciudad normalizada aparece en el span .lib-card__ciudad dentro de la card
      await waitFor(() => {
        const ciudadSpans = document.querySelectorAll('.lib-card__ciudad')
        const encontrado = Array.from(ciudadSpans).some(el => el.textContent.includes(expected))
        expect(encontrado).toBe(true)
      })
    })
  })
})

describe('Librerias — getLogoUrl con URL relativa y absoluta', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usa la URL absoluta tal cual cuando empieza con http', async () => {
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({
      data: [{
        id_tienda: 10,
        nombre_tienda: 'Tienda HTTP',
        ciudad_origen: 'Bogotá',
        direccion: 'Calle 1',
        descripcion: 'desc',
        total_libros: 5,
        calificacion_promedio: '4',
        total_calificaciones: 1,
        logo_url: 'https://example.com/logo.png',
      }],
    })
    renderLibrerias()
    await waitFor(() => screen.getByText('Tienda HTTP'))
    // Si la URL es absoluta, el <img> se renderiza (no el fallback de iniciales)
    const img = screen.getByRole('img', { name: 'Tienda HTTP' })
    expect(img.src).toBe('https://example.com/logo.png')
  })

  it('prefija BASE_URL cuando la URL es relativa', async () => {
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({
      data: [{
        id_tienda: 11,
        nombre_tienda: 'Tienda Relativa',
        ciudad_origen: 'Cali',
        direccion: 'Av. 2',
        descripcion: 'desc',
        total_libros: 3,
        calificacion_promedio: '3',
        total_calificaciones: 1,
        logo_url: '/media/logo_rel.png',
      }],
    })
    renderLibrerias()
    await waitFor(() => screen.getByText('Tienda Relativa'))
    const img = screen.getByRole('img', { name: 'Tienda Relativa' })
    expect(img.src).toBe('http://localhost:8000/media/logo_rel.png')
  })

  it('muestra las iniciales cuando logo_url es null', async () => {
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({
      data: [{
        id_tienda: 12,
        nombre_tienda: 'Alfa Beta',
        ciudad_origen: 'Bogotá',
        direccion: 'Calle 5',
        descripcion: 'desc',
        total_libros: 1,
        calificacion_promedio: '0',
        total_calificaciones: 0,
        logo_url: null,
      }],
    })
    renderLibrerias()
    await waitFor(() => expect(screen.getByText('AB')).toBeInTheDocument())
  })

  it('muestra las iniciales si la imagen de la tienda no puede cargarse', async () => {
    const { default: api } = await import('../../services/api')
    api.get.mockResolvedValue({ data: [{
      ...tiendasEjemplo[0],
      nombre_tienda: 'Librería Norte',
      logo_url: '/media/logo-roto.png',
    }] })
    renderLibrerias()
    const logo = await screen.findByRole('img', { name: 'Librería Norte' })
    fireEvent.error(logo)
    expect(await screen.findByText('LN')).toBeInTheDocument()
  })
})

describe('Librerias — normalize helper', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { default: api } = await import('../../services/api')
    // Tienda cuyo nombre solo coincide tras normalizar
    api.get.mockResolvedValue({
      data: [{
        id_tienda: 20,
        nombre_tienda: 'Librería Ñoña',
        ciudad_origen: 'Bogotá',
        direccion: '',
        descripcion: 'desc',
        total_libros: 1,
        calificacion_promedio: '0',
        total_calificaciones: 0,
        logo_url: null,
      }],
    })
  })

  it('busca texto normalizado sin acento', async () => {
    const user = userEvent.setup()
    renderLibrerias()
    await waitFor(() => screen.getByText('Librería Ñoña'))

    const input = screen.getByPlaceholderText(/buscar librería/i)
    // "nona" debería encontrar "Ñoña" tras normalizar
    await user.type(input, 'nona')
    expect(screen.getByText('Librería Ñoña')).toBeInTheDocument()
  })
})
