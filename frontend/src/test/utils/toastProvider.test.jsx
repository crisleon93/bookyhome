/**
 * toastProvider.test.jsx — Tests del ToastProvider y la función notify.
 *
 * Prueba que el provider renderiza toasts correctamente vía evento DOM
 * y que la función notify dispatcha el evento esperado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { ToastProvider, notify } from '../../components/ToastProvider'

// ── Helper ────────────────────────────────────────────────────────────────────

const renderProvider = (children = <span>contenido</span>) =>
  render(<ToastProvider>{children}</ToastProvider>)

// ── Tests: renderizado base ───────────────────────────────────────────────────

describe('ToastProvider — renderizado base', () => {
  it('renderiza los hijos sin mostrar toast', () => {
    renderProvider(<span>hola mundo</span>)
    expect(screen.getByText('hola mundo')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
  })
})

// ── Tests: notify dispara el toast ───────────────────────────────────────────

describe('notify — muestra toast correctamente', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra un toast de tipo success', async () => {
    renderProvider()
    act(() => notify('Operación exitosa', 'success'))
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/operación exitosa/i)).toBeInTheDocument()
    })
  })

  it('muestra un toast de tipo error', async () => {
    renderProvider()
    act(() => notify('Hubo un error', 'error'))
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/hubo un error/i)).toBeInTheDocument()
    })
  })

  it('muestra un toast de tipo info por defecto', async () => {
    renderProvider()
    act(() => notify('Mensaje informativo'))
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  it('el toast tiene la clase correspondiente al tipo', async () => {
    renderProvider()
    act(() => notify('Alerta', 'warning'))
    await waitFor(() => {
      const toast = screen.getByRole('status')
      expect(toast.className).toContain('warning')
    })
  })
})

// ── Tests: evento bookyhome:toast ─────────────────────────────────────────────

describe('ToastProvider — escucha evento bookyhome:toast', () => {
  it('muestra toast al recibir evento con message y type', async () => {
    renderProvider()
    act(() => {
      window.dispatchEvent(
        new CustomEvent('bookyhome:toast', {
          detail: { message: 'Evento directo', type: 'success' },
        })
      )
    })
    await waitFor(() => {
      expect(screen.getByText(/evento directo/i)).toBeInTheDocument()
    })
  })

  it('ignora el evento si no tiene message', async () => {
    renderProvider()
    act(() => {
      window.dispatchEvent(
        new CustomEvent('bookyhome:toast', { detail: { type: 'error' } })
      )
    })
    // Esperamos un tick para que no aparezca nada
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('status')).toBeNull()
  })
})

// ── Tests: formatToastMessage (indirectamente via notify) ─────────────────────

describe('notify — formatToastMessage', () => {
  it('formatea un array de mensajes con separador |', async () => {
    renderProvider()
    act(() => notify(['Error A', 'Error B'], 'error'))
    await waitFor(() => {
      expect(screen.getByText(/error a \| error b/i)).toBeInTheDocument()
    })
  })

  it('extrae el campo msg de un objeto de error', async () => {
    renderProvider()
    act(() => notify({ msg: 'Mensaje del campo msg' }, 'error'))
    await waitFor(() => {
      expect(screen.getByText(/mensaje del campo msg/i)).toBeInTheDocument()
    })
  })

  it('extrae el campo detail de un objeto de error', async () => {
    renderProvider()
    act(() => notify({ detail: 'Detalle del error' }, 'error'))
    await waitFor(() => {
      expect(screen.getByText(/detalle del error/i)).toBeInTheDocument()
    })
  })

  it('usa fallback "Ha ocurrido un error" para objetos sin campos conocidos', async () => {
    renderProvider()
    act(() => notify({ desconocido: 'x' }, 'error'))
    await waitFor(() => {
      expect(screen.getByText(/ha ocurrido un error/i)).toBeInTheDocument()
    })
  })

  it('convierte un número a string para el mensaje', async () => {
    renderProvider()
    act(() => notify(42, 'info'))
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })
})
