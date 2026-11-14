import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CompradorSidebar from '../../components/CompradorSidebar'

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('../../components/Icons', () => {
  const Icon = () => null
  return {
    IconStoreAlt: Icon,
    IconBookOpen: Icon,
    IconShoppingBag: Icon,
    IconAlertTriangle: Icon,
    IconTool: Icon,
    IconSettings: Icon,
    IconChevronLeft: Icon,
    IconMenu: Icon,
    IconLogOut: Icon,
    IconMapPin: Icon,
  }
})

describe('CompradorSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('muestra el avatar inicial, expande el menú y notifica la selección', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <CompradorSidebar userName="Ana Pérez" userEmail="ana@example.test" onSelect={onSelect} />,
    )

    expect(container.querySelector('.dashboard-sidebar')).toHaveClass('collapsed')
    expect(screen.getByText('A')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Expandir menú'))
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('ana@example.test')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Mis compras/i }))
    expect(onSelect).toHaveBeenCalledWith('Mis Compras')
    fireEvent.click(screen.getByTitle('Contraer menú'))
    expect(container.querySelector('.dashboard-sidebar')).toHaveClass('collapsed')
  })

  it('navega al catálogo y cierra sesión limpiando la sesión local', () => {
    localStorage.setItem('token', 'token-test')
    const dispatch = vi.spyOn(window, 'dispatchEvent')
    render(<CompradorSidebar userName="Bea" profilePhotoUrl="/avatar.png" activeSide="Catálogo" />)

    expect(screen.getByAltText('Bea avatar')).toHaveAttribute('src', '/avatar.png')
    fireEvent.click(screen.getByTitle('Catálogo'))
    expect(mocks.navigate).toHaveBeenCalledWith('/catalogo')

    fireEvent.click(screen.getByTitle('Cerrar sesión'))
    expect(localStorage.getItem('token')).toBeNull()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(mocks.navigate).toHaveBeenLastCalledWith('/')
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'auth-change',
      detail: { authenticated: false },
    }))
  })
})
