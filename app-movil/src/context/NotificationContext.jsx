// src/context/NotificationContext.jsx
// Gestiona el conteo de notificaciones no leídas y mensajes no leídos para los badges del menú.
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { getNotifications } from '../services/api';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token } = useContext(AuthContext);

  // Conteo de notificaciones no leídas (para badge campanita)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  // Conteo de mensajes no leídos (para badge mensajes) — lo alimenta ChatSocketContext
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const montadoRef = useRef(true);

  // Carga el conteo real desde el backend
  const cargarConteo = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getNotifications(true, 1, 0); // solo no leídas, limit 1 para obtener el total
      if (montadoRef.current) {
        setUnreadNotifCount(res.data?.no_leidas ?? 0);
      }
    } catch (e) {
      // Silencioso — no bloquear la app si falla
    }
  }, [token]);

  // Incrementa el badge de notificaciones (llamado desde ChatSocketContext al llegar msg)
  const incrementarNotif = useCallback(() => {
    setUnreadNotifCount((prev) => prev + 1);
  }, []);

  // Resetea el badge de notificaciones (cuando el usuario abre la pantalla Notifications)
  const resetearNotif = useCallback(() => {
    setUnreadNotifCount(0);
  }, []);

  // Setea el conteo de mensajes no leídos (llamado desde ChatSocketContext)
  const setMsgCount = useCallback((count) => {
    setUnreadMsgCount(count);
  }, []);

  // Incrementa el badge de mensajes
  const incrementarMsg = useCallback(() => {
    setUnreadMsgCount((prev) => prev + 1);
  }, []);

  // Resetea el badge de mensajes para una sala concreta o todo
  const resetearMsg = useCallback((delta = null) => {
    if (delta !== null) {
      setUnreadMsgCount((prev) => Math.max(0, prev - delta));
    } else {
      setUnreadMsgCount(0);
    }
  }, []);

  useEffect(() => {
    montadoRef.current = true;
    if (token) {
      cargarConteo();
    } else {
      setUnreadNotifCount(0);
      setUnreadMsgCount(0);
    }
    return () => { montadoRef.current = false; };
  }, [token]);

  return (
    <NotificationContext.Provider
      value={{
        unreadNotifCount,
        unreadMsgCount,
        cargarConteo,
        incrementarNotif,
        resetearNotif,
        setMsgCount,
        incrementarMsg,
        resetearMsg,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  return ctx;
}
