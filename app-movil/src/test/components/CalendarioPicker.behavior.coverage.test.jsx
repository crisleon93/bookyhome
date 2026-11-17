// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CalendarioPicker from '../../components/CalendarioPicker'

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const nativeElement = (tag) => ({
    children,
    disabled,
    onPress,
    accessibilityLabel,
    accessibilityRole,
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
      'div',
      null,
      onMomentumScrollEnd && [-44, 88, 99999].map((y, index) => ReactModule.createElement(
        'button',
        {
          key: y,
          type: 'button',
          onClick: () => onMomentumScrollEnd({ nativeEvent: { contentOffset: { y } } }),
        },
        ['Desplazar al inicio', 'Simular desplazamiento', 'Desplazar al final'][index],
      )),
      children,
    )
  })

  return {
    Dimensions: { get: () => ({ width: 375, height: 812 }) },
    Modal: ({ visible, children, onRequestClose }) => visible
      ? ReactModule.createElement(
        'div',
        { role: 'dialog' },
        ReactModule.createElement('button', { onClick: onRequestClose }, 'Cerrar por sistema'),
        children,
      )
      : null,
    Platform: { OS: 'ios' },
    Pressable: ({ children, onPress, style }) => ReactModule.createElement(
      'div',
      {
        'data-testid': style?.justifyContent === 'flex-end' ? 'calendar-overlay' : 'calendar-sheet',
        onClick: onPress,
      },
      children,
    ),
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

describe('CalendarioPicker: interacciones de fecha y hora', () => {
  afterEach(cleanup)

  it('elige fecha y hora respetando la fecha mínima', () => {
    const onChange = vi.fn()
    render(
      <CalendarioPicker
        label="Entrega"
        value="2026-03-10T09:10"
        minDate="2026-03-15T00:00"
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /2026/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Marzo 2026')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: '‹' }))
    expect(within(dialog).getByText('Febrero 2026')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: '›' }))
    expect(within(dialog).getByText('Marzo 2026')).toBeTruthy()
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Desplazar al inicio' })[0])
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Desplazar al inicio' })[0])
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Desplazar al final' })[0])
    fireEvent.click(within(dialog).getByRole('button', { name: '14' }))
    fireEvent.click(within(dialog).getAllByRole('button', { name: '15' })[0])
    fireEvent.click(within(dialog).getAllByRole('button', { name: '02' }).at(-1))
    fireEvent.click(within(dialog).getByRole('button', { name: '35' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'PM' }))
    fireEvent.click(within(dialog).getByRole('button', { name: /Aceptar/ }))

    expect(onChange).toHaveBeenCalledWith('2026-03-15T14:35')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('navega entre diciembre y enero y permite cerrar el selector del sistema', () => {
    render(
      <CalendarioPicker
        label="Entrega"
        value="2026-12-15T13:20"
        onChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /2026/ }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: '›' }))
    expect(within(dialog).getByText('Enero 2027')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: '‹' }))
    expect(within(dialog).getByText('Diciembre 2026')).toBeTruthy()

    fireEvent.click(screen.getByTestId('calendar-overlay'))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /2026/ }))
    const reopenedDialog = screen.getByRole('dialog')
    fireEvent.click(within(reopenedDialog).getByRole('button', { name: 'Cerrar por sistema' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('usa los presets para seleccionar una fecha cuando todavía no hay valor', () => {
    const onChange = vi.fn()
    render(
      <CalendarioPicker
        label="Entrega"
        value=""
        placeholder="Elegir fecha"
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Elegir fecha/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: /Aceptar/ }).disabled).toBe(true)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mañana' }))
    fireEvent.click(within(dialog).getByRole('button', { name: /Aceptar/ }))

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}T00:00$/)
  })
})
