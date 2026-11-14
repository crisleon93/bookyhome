// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import CarruselAnimado from '../../components/CarruselAnimado'

const mocks = vi.hoisted(() => ({ scrollTo: vi.fn() }))

vi.mock('react-native', async () => {
  const ReactModule = await vi.importActual('react')
  const element = (tag) => function NativeElement({ children, onPress, ...props }) {
    if (tag === 'button') {
      return ReactModule.createElement('button', { type: 'button', onClick: onPress }, children)
    }
    if (tag === 'img') {
      return ReactModule.createElement('img', { alt: props.accessibilityLabel || '', onError: props.onError })
    }
    return ReactModule.createElement(tag, { 'data-testid': props.testID }, children)
  }
  const ScrollView = ReactModule.forwardRef(({ children, onScrollBeginDrag, onScrollEndDrag, onScroll }, ref) => (
    <div
      data-testid="carousel-track"
      ref={(node) => {
        if (node) node.scrollTo = mocks.scrollTo
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      onMouseDown={onScrollBeginDrag}
      onMouseUp={onScrollEndDrag}
      onScroll={(event) => onScroll?.({ nativeEvent: { contentOffset: { x: event.currentTarget.scrollLeft } } })}
    >
      {children}
    </div>
  ))
  return {
    Image: element('img'),
    ScrollView,
    StyleSheet: { create: (styles) => styles },
    Text: element('span'),
    TouchableOpacity: element('button'),
    View: element('div'),
  }
})
vi.mock('../../context/ThemeContext', () => ({
  adaptStyleForTheme: (style) => style,
  useAppTheme: () => ({ darkMode: false, colors: {} }),
  useThemedStyles: (styles) => styles,
}))

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CarruselAnimado', () => {
  it('duplica libros, llama callbacks y permite abrir todos', () => {
    const book = { id_libro: 5, titulo: 'Libro destacado', nombre_categoria: 'Fantasía', precio_libro: 12000 }
    const onVerLibro = vi.fn()
    const onVerTodos = vi.fn()
    render(
      <CarruselAnimado
        libros={[book]}
        titulo="Recomendados"
        onVerLibro={onVerLibro}
        onVerTodos={onVerTodos}
      />,
    )

    expect(screen.getAllByText('Libro destacado')).toHaveLength(2)
    fireEvent.click(screen.getAllByText('Ver detalles')[0])
    expect(onVerLibro).toHaveBeenCalledWith(book)
    fireEvent.click(screen.getByText('Ver todos →'))
    expect(onVerTodos).toHaveBeenCalledOnce()
  })

  it('renderiza placeholders durante la carga y un mensaje cuando no hay libros', () => {
    const { rerender } = render(<CarruselAnimado loading titulo="Novedades" />)
    expect(screen.getByTestId('carousel-track').children).toHaveLength(8)

    rerender(<CarruselAnimado libros={[]} titulo="Novedades" />)
    expect(screen.getByText('Sin libros disponibles')).toBeTruthy()
    expect(screen.queryByTestId('carousel-track')).toBeNull()
  })

  it('inicia auto-scroll para varios libros y lo detiene al desmontar', () => {
    vi.useFakeTimers()
    const { unmount } = render(
      <CarruselAnimado
        libros={[
          { id_libro: 1, titulo: 'Uno' },
          { id_libro: 2, titulo: 'Dos' },
        ]}
        titulo="Varios"
      />,
    )

    act(() => vi.advanceTimersByTime(650))
    expect(mocks.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ animated: false }))
    const callsBeforeUnmount = mocks.scrollTo.mock.calls.length
    unmount()
    act(() => vi.advanceTimersByTime(100))
    expect(mocks.scrollTo).toHaveBeenCalledTimes(callsBeforeUnmount)
  })
})
