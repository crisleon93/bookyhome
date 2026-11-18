// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import VendedorSidebar from '../../components/VendedorSidebar'
import LeafletAddressPickerModal from '../../components/LeafletAddressPickerModal'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  mapClick: null,
  map: { getZoom: () => 14, setView: vi.fn() },
}))

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconStoreAlt: Icon,
    IconBookOpen: Icon,
    IconPlus: Icon,
    IconCartAlt: Icon,
    IconShoppingBag: Icon,
    IconAlertTriangle: Icon,
    IconTool: Icon,
    IconUser: Icon,
    IconSettings: Icon,
    IconMail: Icon,
    IconBell: Icon,
    IconTag: Icon,
    IconChevronLeft: Icon,
    IconMenu: Icon,
    IconLogOut: Icon,
    IconStar: Icon,
    IconTruck: Icon,
  }
})
vi.mock('leaflet', () => ({ default: { icon: () => ({}) } }))
vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, whenReady }) => {
    whenReady?.({ target: mocks.map })
    return <div data-testid="map">{children}</div>
  },
  Marker: () => null,
  TileLayer: () => null,
  useMapEvents: (events) => {
    if (events.click) mocks.mapClick = events.click
    return mocks.map
  },
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.style.removeProperty('--dashboard-sidebar-width')
})

describe('VendedorSidebar', () => {
  it('expande, selecciona secciones y navega a publicar libro', () => {
    const setActiveSide = vi.fn()
    const { container } = render(
      <VendedorSidebar userName="Ana Pérez" activeSide="Inicio" setActiveSide={setActiveSide} />,
    )
    expect(container.querySelector('.dashboard-sidebar')).not.toHaveClass('collapsed')

    fireEvent.click(screen.getByTitle('Contraer menú'))
    expect(localStorage.getItem('vendedor_sidebar_open')).toBe('false')
    fireEvent.click(screen.getByTitle('Expandir menú'))
    expect(localStorage.getItem('vendedor_sidebar_open')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Ventas' }))
    expect(setActiveSide).toHaveBeenCalledWith('Ventas')
    fireEvent.click(screen.getByRole('button', { name: 'Publicar Libro' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/vendedor/publicar')
    expect(setActiveSide).toHaveBeenLastCalledWith('Publicar Libro')
  })

  it('usa la foto de perfil y cierra sesión limpiando la sesión local', () => {
    localStorage.setItem('token', 'token-test')
    document.documentElement.classList.add('dark')
    render(
      <VendedorSidebar userName="Bea" profileImage="/foto.png" userPhotoUrl="/fallback.png" />,
    )

    expect(screen.getByAltText('Bea avatar')).toHaveAttribute('src', '/foto.png')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(localStorage.getItem('token')).toBeNull()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(mocks.navigate).toHaveBeenCalledWith('/')
  })
})

describe('LeafletAddressPickerModal', () => {
  it('busca dirección manual, normaliza ciudad y entrega los datos elegidos', async () => {
    const onClose = vi.fn()
    const onSelect = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => [{
        lat: '4.71',
        lon: '-74.07',
        display_name: 'Bogotá, Colombia',
        address: {
          road: 'Carrera 7',
          house_number: '45-67',
          city: 'Bogotá',
          state: 'Cundinamarca',
          postcode: '110111',
        },
      }],
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<LeafletAddressPickerModal isOpen onClose={onClose} onSelect={onSelect} initialCity="Bogota" />)

    const address = screen.getByPlaceholderText('Ej. Carrera 7 # 45-67, Bogotá')
    fireEvent.change(address, { target: { value: '  Carrera 7 45-67  ' } })
    fireEvent.keyDown(address, { key: 'Enter', code: 'Enter' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(await screen.findByPlaceholderText('Departamento')).toHaveValue('Cundinamarca')

    fireEvent.click(screen.getByText('Usar esta dirección'))
    expect(onSelect).toHaveBeenCalledWith({
      direccion: 'Carrera 7 45-67',
      ciudad: 'Bogotá',
      ciudadResuelta: 'Bogota',
      departamento: 'Cundinamarca',
      codigo_postal: '110111',
      lat: 4.71,
      lng: -74.07,
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('muestra errores para consulta vacía o fallida y permite seleccionar el punto del mapa', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        json: async () => ({
          lat: '6.24',
          lon: '-75.58',
          address: { road: 'Calle 10', city: 'Medellín', state: 'Antioquia' },
        }),
      })
    vi.stubGlobal('fetch', fetchMock)
    render(<LeafletAddressPickerModal isOpen onClose={vi.fn()} onSelect={vi.fn()} />)

    const address = screen.getByPlaceholderText('Ej. Carrera 7 # 45-67, Bogotá')
    fireEvent.keyDown(address, { key: 'Enter', code: 'Enter' })
    expect(screen.getByText('Escribe una dirección para completar los datos.')).toBeTruthy()
    fireEvent.change(address, { target: { value: 'una dirección' } })
    fireEvent.keyDown(address, { key: 'Enter', code: 'Enter' })
    expect(await screen.findByText(/No se pudo encontrar una dirección completa/)).toBeTruthy()

    await waitFor(() => expect(mocks.mapClick).toBeTypeOf('function'))
    fireEvent.click(screen.getByTestId('map'))
    await waitFor(() => mocks.mapClick({ latlng: { lat: 6.24, lng: -75.58 } }))
    expect(await screen.findByPlaceholderText('Ciudad')).toHaveValue('Medellín')
  })

  it('detecta ubicación y comunica una ciudad reconocida', async () => {
    const onGpsCity = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({ address: { city: 'Medellín', state: 'Antioquia' } }),
    }))
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (onSuccess) => onSuccess({ coords: { latitude: 6.24, longitude: -75.58 } }),
      },
    })
    render(<LeafletAddressPickerModal isOpen onClose={vi.fn()} onSelect={vi.fn()} onGpsCity={onGpsCity} />)

    fireEvent.click(screen.getByText('Usar mi ubicación actual'))
    await waitFor(() => expect(onGpsCity).toHaveBeenCalledWith('Medellin'))
  })
})
