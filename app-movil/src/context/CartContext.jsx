import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

export const CartContext = createContext({});

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCart = async () => {
    if (!user || !user.sub) {
      setCart([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/carrito');
      setCart(res.data || []);
    } catch (e) {
      console.log('Error loading cart', e.message);
      console.log('Error response', e.response?.status, e.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Temporalmente desactivado para depurar
    // loadCart();
  }, [user]);

  const addToCart = async (book, qty = 1) => {
    if (!user) return;
    try {
      const payload = {
        id_libro: book.id_libro || book.id,
        cantidad: qty,
        titulo: book.titulo,
        autor_libro: book.autor_libro || book.autor,
        precio_libro: parseFloat(book.precio_libro || book.precio || 0),
        imagen: book.imagen
      };
      const res = await api.post('/carrito', payload);
      setCart(res.data || []);
    } catch (e) {
      console.log('Error adding to cart', e.message);
    }
  };

  const removeFromCart = async (bookId) => {
    if (!user) return;
    try {
      const res = await api.delete(`/carrito/${bookId}`);
      setCart(res.data || []);
    } catch (e) {
      console.log('Error removing from cart', e.message);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      const res = await api.post('/carrito/clear');
      setCart(res.data || []);
    } catch (e) {
      console.log('Error clearing cart', e.message);
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, clearCart, loadCart }}>
      {children}
    </CartContext.Provider>
  );
}
