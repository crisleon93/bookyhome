import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  AcercaDeNosotros,
  ComoComprar,
  Contacto,
  CentroDeVendedores,
  DevolucionesInfo,
  EnviosYEntregas,
  FAQVendedores,
  LegalModal,
  PlanesYTarifas,
  Privacidad,
  Terminos,
  VenderEnBookyHome,
} from '../../components/Legal'

describe('LegalModal', () => {
  it('no renderiza cuando está cerrado y cierra desde botón o fondo', () => {
    const onClose = vi.fn()
    const { rerender, container } = render(
      <LegalModal open={false} onClose={onClose} title="Aviso">Contenido</LegalModal>,
    )
    expect(container).toBeEmptyDOMElement()

    rerender(<LegalModal open onClose={onClose} title="Aviso">Contenido</LegalModal>)
    fireEvent.click(document.querySelector('.modal-close'))
    fireEvent.click(document.querySelector('.modal-overlay'))
    expect(onClose).toHaveBeenCalledTimes(2)
    fireEvent.click(document.querySelector('.modal-card'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('permite aceptar un documento y muestra el estado aceptado', () => {
    const onAccept = vi.fn()
    const onClose = vi.fn()
    const { rerender } = render(
      <LegalModal open onClose={onClose} onAccept={onAccept} title="Términos">
        <p>Contenido legal</p>
      </LegalModal>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Acepto' }))
    expect(onAccept).toHaveBeenCalledOnce()

    rerender(
      <LegalModal open accepted onClose={onClose} onAccept={onAccept} title="Términos">
        <p>Contenido legal</p>
      </LegalModal>,
    )
    expect(screen.getByText('Ya aceptaste este documento')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Acepto' })).not.toBeInTheDocument()
    fireEvent.click(document.querySelector('.modal-close'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('Páginas legales', () => {
  it.each([
    [AcercaDeNosotros, 'Nuestra misión'],
    [Contacto, 'Soporte y atención'],
    [VenderEnBookyHome, '¿Cómo funciona?'],
    [PlanesYTarifas, 'Publicación'],
    [CentroDeVendedores, 'Desde ahí puedes'],
    [FAQVendedores, '¿Necesito ser una librería para vender?'],
    [ComoComprar, '1. Explora el catálogo'],
    [EnviosYEntregas, '¿Cómo se gestionan?'],
    [DevolucionesInfo, 'Cuándo puedes devolver'],
    [Privacidad, /Información que Recopilamos/],
    [Terminos, /Aceptación de los Términos/],
  ])('presenta el contenido esperado de %s', (Page, heading) => {
    render(<Page />)
    expect(screen.getByText(heading)).toBeInTheDocument()
  })
})
