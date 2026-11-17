import { describe, expect, it } from 'vitest'
import { getApiErrorMessage, normalizarMetodoPagoApi } from '../../services/api'

describe('getApiErrorMessage', () => {
  it('formats FastAPI validation detail arrays as readable text', () => {
    const error = {
      response: {
        data: {
          detail: [
            { loc: ['body', 'payment_method'], msg: "Input should be 'tarjeta'", type: 'literal_error' },
            { loc: ['body', 'amount'], msg: 'Input should be greater than 0', type: 'greater_than' },
          ],
        },
      },
    }

    expect(getApiErrorMessage(error, 'Fallback'))
      .toBe("payment_method: Input should be 'tarjeta'; amount: Input should be greater than 0")
  })

  it('preserves string API details', () => {
    const error = { response: { data: { detail: 'Orden no encontrada' } } }

    expect(getApiErrorMessage(error, 'Fallback')).toBe('Orden no encontrada')
  })

  it('uses the fallback when the error has no readable detail', () => {
    const error = { response: { data: { detail: { unexpected: true } } } }

    expect(getApiErrorMessage(error, 'Fallback'))
      .toBe('Fallback')
  })
})

describe('normalizarMetodoPagoApi', () => {
  it.each([
    ['Tarjeta de Crédito', 'tarjeta'],
    ['Efectivo en Tienda', 'efectivo'],
    ['Transferencia Bancaria', 'transferencia'],
    ['Nequi', 'nequi'],
    ['Daviplata', 'daviplata'],
    ['PSE', 'pse'],
    ['Pago en Efecty', 'sucursal'],
    ['PayPal', 'paypal'],
  ])('normalizes %s to %s', (label, expected) => {
    expect(normalizarMetodoPagoApi(label)).toBe(expected)
  })

  it('returns null for an unsupported payment method', () => {
    expect(normalizarMetodoPagoApi('Criptomoneda')).toBeNull()
  })
})
