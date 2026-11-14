// @vitest-environment jsdom

import React, { useContext } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import { CartContext, CartProvider } from '../../context/CartContext';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../context/AuthContext', async () => {
  const ReactModule = await vi.importActual('react');
  return { AuthContext: ReactModule.createContext({}) };
});

vi.mock('../../services/api', () => ({
  default: { get: mocks.get, post: mocks.post, delete: mocks.delete },
}));

const book = {
  id_libro: 7,
  titulo: 'Libro del carrito',
  autor_libro: 'Autora',
  precio_libro: '25000',
  imagen: '/portada.jpg',
  id_variante: 3,
  variante_label: 'Digital',
};

function CartProbe() {
  const cartValue = useContext(CartContext);
  return (
    <div>
      <output data-testid="cart">{JSON.stringify(cartValue.cart)}</output>
      <output data-testid="loading">{String(cartValue.loading)}</output>
      <button onClick={() => cartValue.addToCart(book, 2).catch(() => {})}>Agregar</button>
      <button onClick={() => cartValue.removeFromCart(7)}>Quitar</button>
      <button onClick={() => cartValue.clearCart()}>Vaciar</button>
      <button onClick={() => cartValue.loadCart()}>Recargar</button>
    </div>
  );
}

const renderCart = (user) => render(
  <AuthContext.Provider value={{ user }}>
    <CartProvider><CartProbe /></CartProvider>
  </AuthContext.Provider>,
);

describe('CartProvider', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({ data: [] });
    mocks.post.mockResolvedValue({ data: [book] });
    mocks.delete.mockResolvedValue({ data: [] });
  });

  it('limpia el carrito y no realiza llamadas cuando no hay usuario', async () => {
    renderCart(null);

    expect(screen.getByTestId('cart').textContent).toBe('[]');
    fireEvent.click(screen.getByText('Agregar'));
    fireEvent.click(screen.getByText('Quitar'));
    fireEvent.click(screen.getByText('Vaciar'));
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it('carga y modifica el carrito usando los datos de las respuestas', async () => {
    mocks.get.mockResolvedValue({ data: [book] });
    renderCart({ sub: 'usuario-1' });

    await waitFor(() => expect(screen.getByTestId('cart').textContent).toContain('Libro del carrito'));
    expect(mocks.get).toHaveBeenCalledWith('/carrito');
    expect(screen.getByTestId('loading').textContent).toBe('false');

    fireEvent.click(screen.getByText('Agregar'));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/carrito', {
      id_libro: 7,
      cantidad: 2,
      titulo: 'Libro del carrito',
      autor_libro: 'Autora',
      precio_libro: 25000,
      imagen: '/portada.jpg',
      id_variante: 3,
      variante_label: 'Digital',
    }));

    fireEvent.click(screen.getByText('Quitar'));
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith('/carrito/7'));
    fireEvent.click(screen.getByText('Vaciar'));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/carrito/clear'));
  });

  it('finaliza la carga si la API falla y propaga el error al agregar', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.get.mockRejectedValueOnce(new Error('sin conexión'));
    mocks.post.mockRejectedValueOnce(new Error('no se pudo agregar'));
    renderCart({ sub: 'usuario-1' });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    fireEvent.click(screen.getByText('Agregar'));
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Error adding to cart', 'no se pudo agregar'));
    consoleSpy.mockRestore();
  });
});
