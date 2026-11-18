/**
 * toastProvider.extra.test.jsx
 * Cubre las ramas faltantes de ToastProvider.jsx (7.5% restante)
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { ToastProvider, notify, useToast } from '../../components/ToastProvider'
import React from 'react'

describe('ToastProvider — auto-cierre del toast', () => {
  it('el toast desaparece automáticamente después de 3200ms', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<ToastProvider><span>hijo</span></ToastProvider>)

    act(() => { notify('Toast temporal', 'info') })
    // El toast aparece
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Avanzar el tiempo
    act(() => { vi.advanceTimersByTime(3300) })
    expect(screen.queryByRole('status')).toBeNull()

    vi.useRealTimers()
  })
})

describe('ToastProvider — formatToastMessage con array anidado', () => {
  it('filtra elementos vacíos del array', async () => {
    render(<ToastProvider><span /></ToastProvider>)
    act(() => { notify(['Mensaje válido', '', 'Otro válido'], 'info') })
    expect(screen.getByRole('status').textContent).toBe('Mensaje válido | Otro válido')
  })

  it('usa fallback para objetos sin campos conocidos', () => {
    render(<ToastProvider><span /></ToastProvider>)
    act(() => { notify({ sinCamposConocidos: true }, 'error') })
    expect(screen.getByText('Ha ocurrido un error')).toBeInTheDocument()
  })

  it('extrae campo message de objeto', () => {
    render(<ToastProvider><span /></ToastProvider>)
    act(() => { notify({ message: 'Desde campo message' }, 'info') })
    expect(screen.getByText('Desde campo message')).toBeInTheDocument()
  })
})

describe('useToast — hook devuelve showToast', () => {
  it('useToast retorna el contexto del provider', () => {
    let toastCtx
    function Consumer() {
      toastCtx = useToast()
      return null
    }
    render(<ToastProvider><Consumer /></ToastProvider>)
    expect(typeof toastCtx.showToast).toBe('function')
  })
})
