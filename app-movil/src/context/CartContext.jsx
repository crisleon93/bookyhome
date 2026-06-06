import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext({});
const CART_STORAGE_KEY = 'cartItems';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          setItems(JSON.parse(raw));
        }
      } catch (error) {
        console.log('Error restoring cart', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const saveCart = async (nextItems) => {
    setItems(nextItems);
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
    } catch (error) {
      console.log('Error saving cart', error);
    }
  };

  const addItem = (book, quantity) => {
    const id = book.id_libro ?? book.id ?? book.id_producto ?? book.itemId;
    if (!id) return;

    const nextItems = [...items];
    const existingIndex = nextItems.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      nextItems[existingIndex].cantidad += quantity;
    } else {
      nextItems.push({
        id,
        titulo: book.titulo ?? book.nombre ?? book.nombre_producto ?? 'Libro',
        autor_libro: book.autor_libro ?? book.autor,
        precio_libro: book.precio_libro ?? book.precio ?? 0,
        cantidad: quantity,
        imagen: book.imagen ?? (book.imagenes?.[0] ?? null),
      });
    }

    saveCart(nextItems);
  };

  const updateQuantity = (id, cantidad) => {
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, cantidad } : item
    );
    saveCart(nextItems);
  };

  const removeItem = (id) => {
    const nextItems = items.filter((item) => item.id !== id);
    saveCart(nextItems);
  };

  const clearCart = () => saveCart([]);

  const totalAmount = items.reduce(
    (acc, item) => acc + Number(item.precio_libro ?? 0) * Number(item.cantidad ?? 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
