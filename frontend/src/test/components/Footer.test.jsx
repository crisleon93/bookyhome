import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../components/Footer'

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mocks.navigate,
}))
vi.mock('../../components/Legal', () => {
  const EmptyPage = () => null
  return {
    Terminos: EmptyPage,
    Privacidad: EmptyPage,
    AcercaDeNosotros: EmptyPage,
    Contacto: EmptyPage,
    ComoComprar: EmptyPage,
    EnviosYEntregas: EmptyPage,
    DevolucionesInfo: EmptyPage,
    VenderEnBookyHome: EmptyPage,
    PlanesYTarifas: EmptyPage,
    CentroDeVendedores: EmptyPage,
    FAQVendedores: EmptyPage,
  }
})

function renderFooter(props = {}) {
  return render(
    <MemoryRouter>
      <Footer {...props} />
    </MemoryRouter>,
  )
}

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('abre y cierra las páginas legales desde el modal', () => {
    renderFooter({ hasSidebar: true })
    fireEvent.click(screen.getByRole('button', { name: 'Cómo comprar' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Cómo comprar')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Política de privacidad' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Política de privacidad')
    fireEvent.click(document.querySelector('.legal-modal-backdrop'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('emite el evento de autenticación cuando no hay token', () => {
    const openJoin = vi.fn()
    window.addEventListener('bookyhome:open-join', openJoin)
    renderFooter()

    fireEvent.click(screen.getByRole('button', { name: 'Mis compras' }))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión / Registro' }))

    expect(openJoin).toHaveBeenCalledTimes(2)
    window.removeEventListener('bookyhome:open-join', openJoin)
  })

  it('navega a las secciones de cuenta cuando ya existe un token', () => {
    localStorage.setItem('token', 'session-token')
    renderFooter()

    fireEvent.click(screen.getByRole('button', { name: 'Mis compras' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lista de deseos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda y Soporte' }))

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, '/?seccion=Mis%20Compras')
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, '/lista-deseos')
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, '/?seccion=Soporte%20t%C3%A9cnico')
  })
})
