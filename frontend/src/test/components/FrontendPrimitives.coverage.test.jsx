import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ModalBackdrop from '../../components/ModalBackdrop'
import PromoSectionHeading from '../../components/PromoSectionHeading'
import SidebarExpandedHeader from '../../components/SidebarExpandedHeader'
import SidebarIcon from '../../components/SidebarIcon'

function TestIcon(props) {
  return <svg data-testid="test-icon" {...props} />
}

describe('small reusable frontend components', () => {
  it('renders a clickable backdrop and respects the disabled state', () => {
    const onClick = vi.fn()
    const { rerender } = render(<ModalBackdrop label="Cerrar modal" onClick={onClick} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }))
    expect(onClick).toHaveBeenCalledOnce()

    rerender(<ModalBackdrop label="Cerrar modal" onClick={onClick} disabled />)
    expect(screen.getByRole('button', { name: 'Cerrar modal' })).toBeDisabled()
  })

  it('shows promotion heading details in light and dark themes', () => {
    const { rerender } = render(
      <PromoSectionHeading title="Ofertas" summary="Ahorra en libros" darkMode={false} />,
    )
    expect(screen.getByRole('heading', { name: 'Ofertas' })).toHaveStyle({ color: '#1f2937' })
    expect(screen.getByText('Ahorra en libros')).toHaveStyle({ color: '#6b7280' })

    rerender(<PromoSectionHeading title="Ofertas" summary="Ahorra en libros" darkMode />)
    expect(screen.getByRole('heading', { name: 'Ofertas' })).toHaveStyle({ color: '#f3f4f6' })
    expect(screen.getByText('Ahorra en libros')).toHaveStyle({ color: '#b8b8b8' })
  })

  it('renders a sidebar avatar image or fallback and invokes collapse', () => {
    const onCollapse = vi.fn()
    const { rerender, container } = render(
      <SidebarExpandedHeader
        bannerUrl="/banner.jpg"
        backgroundFallback="#123"
        showBannerOverlay
        avatarSrc="/avatar.jpg"
        avatarAlt="Ana avatar"
        userName="Ana"
        nameFallback="Usuario"
        avatarFallback="U"
        subtitle="Vendedora"
        onCollapse={onCollapse}
      />,
    )
    expect(screen.getByAltText('Ana avatar')).toHaveAttribute('src', '/avatar.jpg')
    expect(container.querySelector('[style*="rgba(0, 0, 0, 0.35)"]')).not.toBeNull()
    fireEvent.click(screen.getByTitle('Contraer menú'))
    expect(onCollapse).toHaveBeenCalledOnce()

    rerender(
      <SidebarExpandedHeader
        backgroundFallback="#123"
        userName=""
        nameFallback="Nombre alternativo"
        avatarFallback="Invitado"
        subtitle="Sin banner"
        onCollapse={onCollapse}
      />,
    )
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('Nombre alternativo')).toBeInTheDocument()
    expect(container.querySelector('[style*="rgba(0, 0, 0, 0.35)"]')).toBeNull()
  })

  it('forwards icon size and drawing props to the supplied icon component', () => {
    render(<SidebarIcon Icon={TestIcon} size={32} />)
    expect(screen.getByTestId('test-icon')).toHaveAttribute('width', '32')
    expect(screen.getByTestId('test-icon')).toHaveAttribute('height', '32')
    expect(screen.getByTestId('test-icon')).toHaveAttribute('stroke-width', '2')
  })
})
