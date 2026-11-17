import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../../pages/Home'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  getUserRole: vi.fn(),
  jwtDecode: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="redirect">{to}</div>,
    useNavigate: () => mocks.navigate,
  }
})

vi.mock('jwt-decode', () => ({ jwtDecode: mocks.jwtDecode }))
vi.mock('../../hooks/useAuth', () => ({ getUserRole: mocks.getUserRole }))
vi.mock('../../services/api', () => ({ default: { get: mocks.apiGet } }))
vi.mock('../../components/Header', () => ({ default: () => <div>Public header</div> }))
vi.mock('../../components/Icons', () => ({ IconUsers: () => <svg data-testid="users-icon" /> }))
vi.mock('../../components/CarruselPublico', () => ({
  default: ({ onVerDetalles }) => (
    <button onClick={() => onVerDetalles({ titulo: 'Libro del carrusel' })}>Abrir libro destacado</button>
  ),
}))
vi.mock('../../components/LibreriasDestacadas', () => ({ default: () => <div>Librerías destacadas</div> }))
vi.mock('../../components/CompradorSidebar', () => ({
  default: ({ onSelect, userName, userEmail, profilePhotoUrl, bannerUrl, bannerColor }) => (
    <aside
      data-testid="buyer-sidebar"
      data-user={userName}
      data-email={userEmail}
      data-photo={profilePhotoUrl || ''}
      data-banner={bannerUrl || ''}
      data-banner-color={bannerColor || ''}
    >
      {['Inicio', 'Mensajes', 'Carrito', 'Mis Compras', 'Seguimiento', 'Lista de Deseos',
        'Favoritos', 'Mi Perfil', 'Mis Direcciones', 'Configuración', 'Notificaciones',
        'Catálogo', 'Quejas y reclamos', 'Soporte técnico', 'Direcciones'].map((section) => (
        <button key={section} onClick={() => onSelect(section)}>{section}</button>
      ))}
    </aside>
  ),
}))
vi.mock('../../components/dashboard/SeccionInicio', () => ({
  default: ({ userName, onGoToCatalog, onSelectSeccion, onVerDetalleLibro }) => (
    <div>
      <span>Inicio de {userName}</span>
      <button onClick={onGoToCatalog}>Abrir catálogo desde inicio</button>
      <button onClick={() => onSelectSeccion('Mensajes')}>Abrir mensajes desde inicio</button>
      <button onClick={() => onVerDetalleLibro({ id_libro: 5 })}>Ver detalle de libro</button>
    </div>
  ),
}))
vi.mock('../../components/dashboard/SeccionSeguimiento', () => ({ default: () => <div>Sección seguimiento</div> }))
vi.mock('../../components/dashboard/SeccionFavoritos', () => ({
  default: ({ onGoToCatalog, onSetActiveSide }) => (
    <div><button onClick={onGoToCatalog}>Catálogo desde favoritos</button><button onClick={() => onSetActiveSide('Inicio')}>Volver al inicio</button></div>
  ),
}))
vi.mock('../../components/dashboard/SeccionConfiguracion', () => ({ default: () => <div>Sección configuración</div> }))
vi.mock('../../components/dashboard/SeccionMiPerfil', () => ({ default: () => <div>Sección perfil</div> }))
vi.mock('../../components/dashboard/SeccionMisDirecciones', () => ({ default: () => <div>Sección direcciones</div> }))
vi.mock('../../components/dashboard/SeccionNotificaciones', () => ({ default: () => <div>Sección notificaciones</div> }))
vi.mock('../../components/dashboard/SeccionCarrito', () => ({ default: () => <div>Sección carrito</div> }))
vi.mock('../../components/dashboard/SeccionMisCompras', () => ({ default: () => <div>Sección compras</div> }))
vi.mock('../../pages/Catalogo', () => ({ default: () => <div>Catálogo autenticado</div> }))
vi.mock('../../pages/Chat', () => ({
  default: ({ selectedSalaProp }) => <div>Chat sala {selectedSalaProp}</div>,
}))
vi.mock('../../pages/ListaDeseos', () => ({ default: () => <div>Lista de deseos autenticada</div> }))
vi.mock('../../pages/QuejasReclamos', () => ({ default: () => <div>Sección reclamos</div> }))
vi.mock('../../pages/Soporte', () => ({ default: () => <div>Sección soporte</div> }))

function renderHome(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home web', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.classList.add('dark')
    mocks.getUserRole.mockReturnValue('comprador')
    mocks.jwtDecode.mockReturnValue({ nombre: 'María', sub: '12' })
    mocks.apiGet.mockImplementation((url) => Promise.resolve({
      data: url === '/catalogo/stats'
        ? { libros_disponibles: 1250, librerias_asociadas: 14, usuarios_activos: 320, calificacion_promedio: 4.7 }
        : { correo_usuario: 'maria@example.test', foto_perfil: '/media/foto.png', banner_perfil: '/media/banner.png' },
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renderiza la portada pública, sus categorías y eventos de registro', async () => {
    renderHome()

    expect(screen.getByRole('heading', { name: /marketplace que conecta lectores/i })).toBeTruthy()
    expect(await screen.findByText('+1.250')).toBeTruthy()
    expect(screen.getByText('Librerías destacadas')).toBeTruthy()
    expect(document.documentElement).not.toHaveClass('dark')

    fireEvent.click(screen.getByRole('button', { name: 'Comenzar a comprar' }))
    expect(screen.getByText('¡Bienvenido a BookyHome!')).toBeTruthy()
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    fireEvent.click(screen.getByRole('link', { name: /Soy nuevo/ }))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'bookyhome:open-register' }))

    act(() => window.dispatchEvent(new CustomEvent('bookyhome:open-join')))
    expect(screen.getByText('¡Bienvenido a BookyHome!')).toBeTruthy()
    fireEvent.click(screen.getByText('Ficción').closest('.category-card'))
    expect(mocks.navigate).toHaveBeenCalledWith('/catalogo?categoria=Ficci%C3%B3n')

    fireEvent.click(screen.getByRole('button', { name: 'Abrir libro destacado' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/catalogo?q=Libro%20del%20carrusel')
  })

  it('carga el dashboard, cambia secciones, aplica eventos de perfil y cierra sesión', async () => {
    localStorage.setItem('token', 'valid-session')
    renderHome('/?seccion=Mensajes&sala=42')

    expect(await screen.findByText('Chat sala 42')).toBeTruthy()
    const sidebar = screen.getByTestId('buyer-sidebar')
    expect(sidebar).toHaveAttribute('data-user', 'María')
    expect(sidebar).toHaveAttribute('data-email', 'maria@example.test')
    expect(sidebar).toHaveAttribute('data-photo', 'http://127.0.0.1:8000/media/foto.png')

    act(() => window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { url: '/new-photo.png' } })))
    act(() => window.dispatchEvent(new CustomEvent('profile-banner-updated', { detail: { bannerColor: '#112233' } })))
    expect(sidebar).toHaveAttribute('data-photo', '/new-photo.png')
    expect(sidebar).toHaveAttribute('data-banner-color', '#112233')

    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de libro' }))
    expect(await screen.findByText('Catálogo autenticado')).toBeTruthy()
    expect(mocks.navigate).toHaveBeenCalledWith('/?seccion=Cat%C3%A1logo', { replace: true })
    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mis Compras' }))
    expect(await screen.findByText('Sección compras')).toBeTruthy()

    act(() => window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } })))
    expect(await screen.findByRole('heading', { name: /marketplace que conecta lectores/i })).toBeTruthy()
  })

  it.each([
    ['vendedor', '/mi-tienda'],
    ['admin', '/admin'],
    ['administrador', '/admin'],
  ])('redirige al dashboard para el rol %s', async (role, destination) => {
    localStorage.setItem('token', 'valid-session')
    mocks.getUserRole.mockReturnValue(role)
    renderHome()

    expect(await screen.findByTestId('redirect')).toHaveTextContent(destination)
  })

  it('recupera la portada si el token no se puede decodificar', async () => {
    localStorage.setItem('token', 'bad-session')
    mocks.jwtDecode.mockImplementation(() => { throw new Error('invalid token') })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderHome()

    expect(await screen.findByRole('heading', { name: /marketplace que conecta lectores/i })).toBeTruthy()
    expect(consoleError).toHaveBeenCalled()
  })
})
