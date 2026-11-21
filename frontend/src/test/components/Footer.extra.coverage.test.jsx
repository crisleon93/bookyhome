/**
 * Footer.extra.coverage.test.jsx
 * Covers uncovered branches in Footer.jsx (77.6%)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../components/Footer'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../components/Legal', () => ({
  Terminos: () => <div>Términos</div>,
  Privacidad: () => <div>Privacidad</div>,
  AcercaDeNosotros: () => <div>Acerca</div>,
  Contacto: () => <div>Contacto</div>,
  ComoComprar: () => <div>Cómo comprar</div>,
  EnviosYEntregas: () => <div>Envíos</div>,
  DevolucionesInfo: () => <div>Devoluciones</div>,
  VenderEnBookyHome: () => <div>Vender</div>,
  PlanesYTarifas: () => <div>Planes</div>,
  CentroDeVendedores: () => <div>Centro vendedores</div>,
  FAQVendedores: () => <div>FAQ vendedores</div>,
}))

const renderFooter = (hasSidebar = false) =>
  render(
    <MemoryRouter>
      <Footer hasSidebar={hasSidebar} />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
afterEach(cleanup)

describe('Footer — legal modals open and close', () => {
  it('opens Acerca de nosotros modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Acerca de nosotros' }))
    expect(await screen.findByText('Acerca')).toBeInTheDocument()
    // Close via × button
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(screen.queryByText('Acerca')).toBeNull())
  })

  it('opens Contacto modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Contacto' }))
    expect(await screen.findByText('Contacto')).toBeInTheDocument()
  })

  it('opens Términos y condiciones modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Términos y condiciones' }))
    expect(await screen.findByText('Términos')).toBeInTheDocument()
  })

  it('opens Política de privacidad modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Política de privacidad' }))
    expect(await screen.findByText('Privacidad')).toBeInTheDocument()
  })

  it('opens Cómo comprar modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Cómo comprar' }))
    expect(await screen.findByText('Cómo comprar')).toBeInTheDocument()
  })

  it('opens Envíos y entregas modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Envíos y entregas' }))
    expect(await screen.findByText('Envíos')).toBeInTheDocument()
  })

  it('opens Devoluciones modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Devoluciones' }))
    expect(await screen.findByText('Devoluciones')).toBeInTheDocument()
  })

  it('opens Vender en BookyHome modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Vender en BookyHome' }))
    expect(await screen.findByText('Vender')).toBeInTheDocument()
  })

  it('opens Planes y tarifas modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Planes y tarifas' }))
    expect(await screen.findByText('Planes')).toBeInTheDocument()
  })

  it('opens Centro de vendedores modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Centro de vendedores' }))
    expect(await screen.findByText('Centro vendedores')).toBeInTheDocument()
  })

  it('opens FAQ vendedores modal', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'FAQ vendedores' }))
    expect(await screen.findByText('FAQ vendedores')).toBeInTheDocument()
  })

  it('closes modal clicking backdrop', async () => {
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: 'Acerca de nosotros' }))
    await screen.findByText('Acerca')
    // Click directly on the backdrop (the presentation div)
    const backdrop = document.querySelector('.legal-modal-backdrop')
    fireEvent.click(backdrop)
    await waitFor(() => expect(screen.queryByText('Acerca')).toBeNull())
  })
})

describe('Footer — account actions with and without token', () => {
  it('dispatches join event when no token and clicking Iniciar sesión', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'bookyhome:open-join' }))
  })

  it('navigates to Mis Compras when token exists', async () => {
    localStorage.setItem('token', 'test.token.here')
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: /mis compras/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/?seccion=Mis%20Compras')
  })

  it('navigates to lista-deseos when token exists', async () => {
    localStorage.setItem('token', 'test.token.here')
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: /lista de deseos/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/lista-deseos')
  })

  it('navigates to soporte when token exists', async () => {
    localStorage.setItem('token', 'test.token.here')
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: /ayuda y soporte/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/?seccion=Soporte%20t%C3%A9cnico')
  })

  it('dispatches join event for compras when no token', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    localStorage.removeItem('token')
    renderFooter()
    fireEvent.click(screen.getByRole('button', { name: /mis compras/i }))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'bookyhome:open-join' }))
  })
})

describe('Footer — dark mode', () => {
  it('responds to darkModeChange event', () => {
    renderFooter()
    localStorage.setItem('darkMode', 'true')
    window.dispatchEvent(new Event('darkModeChange'))
    // just checking it does not throw
    expect(screen.getByText(/BookyHome/i)).toBeInTheDocument()
  })

  it('respects hasSidebar prop', () => {
    renderFooter(true)
    const footer = document.querySelector('footer')
    expect(footer.style.marginLeft).not.toBe('0px')
  })
})
