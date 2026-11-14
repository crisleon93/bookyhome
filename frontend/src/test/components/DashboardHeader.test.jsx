/**
 * DashboardHeader.test.jsx — Tests del componente DashboardHeader.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardHeader from '../../components/DashboardHeader'

vi.mock('../../assets/logo.png', () => ({ default: 'logo.png' }))
vi.mock('../../components/Icons', () => ({ IconSearch: () => <svg data-testid="icon-search" /> }))

const renderHeader = () =>
  render(<MemoryRouter><DashboardHeader /></MemoryRouter>)

describe('DashboardHeader — renderizado', () => {
  it('renderiza el header', () => {
    renderHeader()
    expect(document.querySelector('header')).toBeTruthy()
  })

  it('muestra el logo con alt BookyHome', () => {
    renderHeader()
    expect(screen.getByAltText('BookyHome')).toBeInTheDocument()
  })

  it('muestra el input de búsqueda', () => {
    renderHeader()
    expect(screen.getByPlaceholderText(/buscar libros/i)).toBeInTheDocument()
  })

  it('el logo es un enlace a la raíz', () => {
    renderHeader()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/')
  })
})
