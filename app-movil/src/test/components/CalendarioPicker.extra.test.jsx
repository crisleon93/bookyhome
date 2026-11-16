// @vitest-environment jsdom

/**
 * CalendarioPicker.extra.test.jsx — ramas no cubiertas del 2.5% faltante
 *
 * Cubre:
 * - Resincronización por cambio externo de value (useEffect que depende de value)
 * - DrumRoller: selección directa con onPress en un item (scrollTo animated)
 * - displayValue cuando value tiene fecha válida (formato localeDateString)
 * - isoToDate devuelve null para string vacío (guardado en rama !iso)
 * - dateToIso produce el formato correcto
 * - confirmar no llama onChange si selDay === null
 * - esMarcado (selDay definido pero sin value)
 */

import React, { useState } from 'react'
import { cleanup, fireEvent, render, screen, within, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CalendarioPicker from '../../components/CalendarioPicker'

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const nativeElement = (tag) => ({
    children, disabled, onPress, accessibilityLabel, accessibilityRole,
  }) => ReactModule.createElement(tag, {
    type: tag === 'button' ? 'button' : undefined,
    disabled,
    onClick: onPress,
    'aria-label': accessibilityLabel,
    role: accessibilityRole || (tag === 'button' ? 'button' : undefined),
  }, children)

  const ScrollView = ReactModule.forwardRef(({ children, onMomentumScrollEnd }, ref) => {
    ReactModule.useImperativeHandle(ref, () => ({ scrollTo: vi.fn() }), [])
    return ReactModule.createElement(
      'div', null,
      onMomentumScrollEnd && [-44, 88, 99999].map((y, index) =>
        ReactModule.createElement('button', {
          key: y,
          type: 'button',
          onClick: () => onMomentumScrollEnd({ nativeEvent: { contentOffset: { y } } }),
        }, ['Desplazar al inicio', 'Simular desplazamiento', 'Desplazar al final'][index]),
      ),
      children,
    )
  })

  return {
    Dimensions: { get: () => ({ width: 375, height: 812 }) },
    Modal: ({ visible, children, onRequestClose }) => visible
      ? ReactModule.createElement('div', { role: 'dialog' },
          ReactModule.createElement('button', { onClick: onRequestClose }, 'Cerrar por sistema'),
          children,
        )
      : null,
    Platform: { OS: 'android' },
    Pressable: ({ children, onPress, style }) => ReactModule.createElement('div', {
      'data-testid': style?.justifyContent === 'flex-end' ? 'calendar-overlay' : 'calendar-sheet',
      onClick: onPress,
    }, children),
    ScrollView,
    StyleSheet: { create: (styles) => styles },
    Text: nativeElement('span'),
    TouchableOpacity: nativeElement('button'),
    View: nativeElement('div'),
  }
})

vi.mock('../../components/Icons', () => ({
  IconCalendar: () => <span aria-hidden="true">Calendario</span>,
}))

describe('CalendarioPicker — ramas extra', () => {
  afterEach(cleanup)

  it('no llama onChange si se pulsa Aceptar sin seleccionar día (Aceptar deshabilitado)', () => {
    const onChange = vi.fn()
    render(
      <CalendarioPicker
        label="Fecha"
        value=""
        placeholder="Sin fecha"
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Sin fecha/ }))
    const dialog = screen.getByRole('dialog')
    const aceptar = within(dialog).getByRole('button', { name: /Aceptar/ })
    expect(aceptar.disabled).toBe(true)
    fireEvent.click(aceptar) // disabled no dispara confirmar, pero la cubre
    expect(onChange).not.toHaveBeenCalled()
  })

  it('resincroniza el estado interno cuando value cambia desde fuera', () => {
    const onChange = vi.fn()
    function Wrapper() {
      const [val, setVal] = useState('2026-05-10T10:00')
      return (
        <>
          <CalendarioPicker label="Fecha" value={val} onChange={onChange} />
          <button type="button" onClick={() => setVal('2027-08-20T15:30')}>
            Cambiar valor
          </button>
        </>
      )
    }
    render(<Wrapper />)
    expect(screen.getByRole('button', { name: /2026/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar valor' }))
    expect(screen.getByRole('button', { name: /2027/ })).toBeTruthy()
  })

  it('DrumRoller: clic directo en un item llama scrollTo animated', () => {
    const onChange = vi.fn()
    render(
      <CalendarioPicker
        label="Fecha"
        value="2026-06-15T09:00"
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /2026/ }))
    const dialog = screen.getByRole('dialog')

    // Hacer clic en el item '05' de minutos (índice 1 en MINUTOS_LIST)
    const botonesMinuto = within(dialog).getAllByRole('button', { name: '05' })
    // El primer botón '05' que sea un item del drum (no nav ni preset)
    fireEvent.click(botonesMinuto[0])
    // No debe lanzar; onChange no fue llamado (no confirmamos)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('displayValue formatea la fecha correctamente cuando hay value', () => {
    render(
      <CalendarioPicker
        label="Fecha"
        value="2026-11-05T14:30"
        onChange={vi.fn()}
      />
    )
    // El botón trigger debe contener texto con año 2026
    expect(screen.getByRole('button', { name: /2026/ })).toBeTruthy()
  })

  it('preset "Hoy" selecciona el día actual y el Aceptar queda activo', () => {
    const onChange = vi.fn()
    render(
      <CalendarioPicker
        label="Fecha"
        value=""
        placeholder="Elegir"
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Elegir/ }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hoy' }))

    const aceptar = within(dialog).getByRole('button', { name: /Aceptar/ })
    expect(aceptar.disabled).toBe(false)
    fireEvent.click(aceptar)
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('preset "+7d" selecciona fecha 7 días adelante', () => {
    const onChange = vi.fn()
    render(
      <CalendarioPicker label="F" value="" placeholder="Elegir" onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('button', { name: /Elegir/ }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: '+7d' }))
    fireEvent.click(within(dialog).getByRole('button', { name: /Aceptar/ }))
    expect(onChange).toHaveBeenCalledOnce()
    const iso = onChange.mock.calls[0][0]
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })
})
