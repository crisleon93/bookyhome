// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BarcodeScanner from '../../components/BarcodeScanner'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  requestPermission: vi.fn(),
  useCameraPermissions: vi.fn(),
  onBarcodeScanned: vi.fn(),
}))

vi.mock('react-native', async () => {
  const R = await vi.importActual('react')
  const el = (tag) => ({ children, onPress, accessibilityLabel }) =>
    R.createElement(tag, { onClick: onPress, 'aria-label': accessibilityLabel }, children)
  return {
    ActivityIndicator: () => null,
    Alert: { alert: mocks.alert },
    Dimensions: { get: () => ({ width: 375, height: 812 }) },
    Modal: ({ visible, children }) =>
      visible ? R.createElement('div', { 'data-testid': 'modal' }, children) : null,
    StyleSheet: { create: (s) => s },
    Text: el('span'),
    TouchableOpacity: el('button'),
    View: el('div'),
  }
})

vi.mock('expo-camera', () => ({
  CameraView: ({ children, onBarcodeScanned }) =>
    <div
      data-testid="camera"
      onClick={() => mocks.onBarcodeScanned(onBarcodeScanned)}
    >{children}</div>,
  useCameraPermissions: mocks.useCameraPermissions,
}))

vi.mock('../../components/Icons', () => ({
  IconClose: () => <span>X</span>,
  IconCamera: () => <span>📷</span>,
}))

afterEach(cleanup)

const baseProps = {
  visible: true,
  onClose: vi.fn(),
  onBarcodeDetected: vi.fn(),
}

describe('BarcodeScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requestPermission.mockResolvedValue({ granted: true })
    baseProps.onClose.mockReset()
    baseProps.onBarcodeDetected.mockReset()
  })

  it('retorna vista vacía mientras permission es null', () => {
    mocks.useCameraPermissions.mockReturnValue([null, mocks.requestPermission])
    const { container } = render(<BarcodeScanner {...baseProps} />)
    expect(container.querySelector('[data-testid="modal"]')).toBeNull()
  })

  it('muestra pantalla de permisos cuando no están concedidos', () => {
    mocks.useCameraPermissions.mockReturnValue([{ granted: false }, mocks.requestPermission])
    render(<BarcodeScanner {...baseProps} />)
    expect(screen.getByText('Conceder permiso')).toBeTruthy()
    expect(screen.getByText('Cancelar')).toBeTruthy()
    expect(screen.getByText(/BookyHome necesita acceso/)).toBeTruthy()
  })

  it('llama a requestPermission al hacer clic en Conceder permiso', () => {
    mocks.useCameraPermissions.mockReturnValue([{ granted: false }, mocks.requestPermission])
    render(<BarcodeScanner {...baseProps} />)
    fireEvent.click(screen.getByText('Conceder permiso'))
    expect(mocks.requestPermission).toHaveBeenCalled()
  })

  it('llama a onClose al cancelar desde la pantalla de permisos', () => {
    mocks.useCameraPermissions.mockReturnValue([{ granted: false }, mocks.requestPermission])
    render(<BarcodeScanner {...baseProps} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(baseProps.onClose).toHaveBeenCalled()
  })

  it('renderiza la cámara cuando el permiso está concedido', () => {
    mocks.useCameraPermissions.mockReturnValue([{ granted: true }, mocks.requestPermission])
    render(<BarcodeScanner {...baseProps} />)
    expect(screen.getByTestId('camera')).toBeTruthy()
  })

  it('no muestra el modal cuando visible=false', () => {
    mocks.useCameraPermissions.mockReturnValue([{ granted: true }, mocks.requestPermission])
    render(<BarcodeScanner {...baseProps} visible={false} />)
    expect(screen.queryByTestId('modal')).toBeNull()
  })

  it('detecta ISBN-13 válido y llama a onBarcodeDetected', async () => {
    mocks.useCameraPermissions.mockReturnValue([{ granted: true }, mocks.requestPermission])
    baseProps.onBarcodeDetected.mockResolvedValue()
    mocks.onBarcodeScanned.mockImplementation((cb) => cb?.({ type: 'ean13', data: '9780061965777' }))

    render(<BarcodeScanner {...baseProps} />)
    fireEvent.click(screen.getByTestId('camera'))
    await waitFor(() => expect(baseProps.onBarcodeDetected).toHaveBeenCalledWith('9780061965777'))
  })

  it('muestra alert para código que no es ISBN', async () => {
    mocks.useCameraPermissions.mockReturnValue([{ granted: true }, mocks.requestPermission])
    mocks.onBarcodeScanned.mockImplementation((cb) => cb?.({ type: 'qr', data: 'NO-ES-ISBN' }))

    render(<BarcodeScanner {...baseProps} />)
    fireEvent.click(screen.getByTestId('camera'))
    await waitFor(() =>
      expect(mocks.alert).toHaveBeenCalledWith(
        'Código no reconocido',
        expect.any(String),
        expect.any(Array),
      )
    )
  })

  it('muestra alert de error cuando onBarcodeDetected lanza excepción', async () => {
    mocks.useCameraPermissions.mockReturnValue([{ granted: true }, mocks.requestPermission])
    baseProps.onBarcodeDetected.mockRejectedValue(new Error('API error'))
    mocks.onBarcodeScanned.mockImplementation((cb) => cb?.({ type: 'ean13', data: '9780061965777' }))

    render(<BarcodeScanner {...baseProps} />)
    fireEvent.click(screen.getByTestId('camera'))
    await waitFor(() =>
      expect(mocks.alert).toHaveBeenCalledWith('Error', expect.any(String), expect.any(Array))
    )
  })

  it('ejecuta el temporizador de cierre exitoso llamando a onClose', async () => {
    vi.useFakeTimers()
    mocks.useCameraPermissions.mockReturnValue([{ granted: true }, mocks.requestPermission])
    baseProps.onBarcodeDetected.mockResolvedValue()
    mocks.onBarcodeScanned.mockImplementation((cb) => cb?.({ type: 'ean13', data: '9780061965777' }))

    render(<BarcodeScanner {...baseProps} />)
    fireEvent.click(screen.getByTestId('camera'))
    await vi.advanceTimersByTimeAsync(600)
    expect(baseProps.onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('no llama a onClose si el componente se desmonta antes de que expire el temporizador', async () => {
    vi.useFakeTimers()
    mocks.useCameraPermissions.mockReturnValue([{ granted: true }, mocks.requestPermission])
    baseProps.onBarcodeDetected.mockResolvedValue()
    mocks.onBarcodeScanned.mockImplementation((cb) => cb?.({ type: 'ean13', data: '9780061965777' }))

    const { unmount } = render(<BarcodeScanner {...baseProps} />)
    fireEvent.click(screen.getByTestId('camera'))
    unmount()
    await vi.advanceTimersByTimeAsync(600)
    expect(baseProps.onClose).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
