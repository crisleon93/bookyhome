// src/context/ChatSocketContext.jsx
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { NotificationContext } from './NotificationContext';
import api, { getSalasUsuario } from '../services/api';

const WS_BASE_URL = api.defaults.baseURL.replace(/^http/, 'ws');

export const ChatSocketContext = createContext(null);

export function ChatSocketProvider({ children }) {
  const { token } = useContext(AuthContext);
  const notifCtx = useContext(NotificationContext);

  const [conectado, setConectado] = useState(false);
  const [salas, setSalas] = useState([]);
  const [loadingSalas, setLoadingSalas] = useState(true);

  const wsRef = useRef(null);
  const reconectarTimeoutRef = useRef(null);
  const intentosReconexion = useRef(0);
  const montadoRef = useRef(true);
  const listenersRef = useRef(new Set());
  const salasRef = useRef([]);

  const cargarSalas = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await getSalasUsuario();
      const lista = Array.isArray(data?.salas) ? data.salas : [];
      if (montadoRef.current) {
        salasRef.current = lista;
        setSalas(lista);
        // Sincronizar badge de mensajes con el total real de no leídos
        const totalNoLeidos = lista.reduce((acc, s) => acc + (s.no_leidos || 0), 0);
        notifCtx?.setMsgCount(totalNoLeidos);
      }
    } catch (e) {
      console.log('Error cargando salas:', e?.message);
    } finally {
      if (montadoRef.current) setLoadingSalas(false);
    }
  }, [token]);

  const actualizarSalaConMensaje = useCallback((mensaje, esPropio) => {
    setSalas((prev) => {
      const idx = prev.findIndex((s) => s.id_sala === mensaje.id_sala);
      if (idx === -1) return prev; // sala no cargada aún; se resuelve en el próximo refresh manual
      const copia = [...prev];
      const sala = { ...copia[idx] };
      sala.ultimo_mensaje = mensaje.mensaje;
      sala.fecha_ultimo_mensaje = mensaje.enviado_en;
      if (!esPropio) sala.no_leidos = (sala.no_leidos || 0) + 1;
      copia.splice(idx, 1);
      copia.unshift(sala);
      salasRef.current = copia;
      return copia;
    });
  }, []);

  const marcarSalaLeidaLocal = useCallback((id_sala) => {
    setSalas((prev) => {
      const next = prev.map((s) => (s.id_sala === id_sala ? { ...s, no_leidos: 0 } : s));
      salasRef.current = next;
      return next;
    });

    const sala = salasRef.current.find((s) => s.id_sala === id_sala);
    const noLeidos = sala?.no_leidos || 0;
    if (noLeidos > 0) notifCtx?.resetearMsg(noLeidos);
  }, [notifCtx]);

  const conectarWebSocket = useCallback(() => {
    if (!token) return;
    const ws = new WebSocket(`${WS_BASE_URL}/chat/ws?token=${token}`);

    ws.onopen = () => {
      if (!montadoRef.current) return;
      setConectado(true);
      intentosReconexion.current = 0;
    };

    ws.onmessage = (event) => {
      if (!montadoRef.current) return;
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.tipo === 'nuevo_mensaje' || data.tipo === 'mensaje_enviado') {
        const esPropio = data.tipo === 'mensaje_enviado';
        actualizarSalaConMensaje(data.mensaje, esPropio);
        listenersRef.current.forEach((cb) => cb(data)); // avisa a Chat.jsx si está abierto

        // Actualizar badges si el mensaje es ajeno
        if (!esPropio && notifCtx) {
          notifCtx.incrementarMsg();      // badge de mensajes en el menú
          notifCtx.incrementarNotif();    // badge de notificaciones (el backend ya insertó la fila)
        }
      }
    };

    ws.onerror = (e) => {
      if (e?.message) console.log('WS error:', e.message);
    };

    ws.onclose = (event) => {
      if (!montadoRef.current) return;
      setConectado(false);
      if (event.code === 4401) return; // token inválido, no reintentar
      if (intentosReconexion.current >= 5) return; // máximo 5 reintentos
      intentosReconexion.current += 1;
      const espera = Math.min(1000 * intentosReconexion.current, 10000);
      reconectarTimeoutRef.current = setTimeout(conectarWebSocket, espera);
    };

    wsRef.current = ws;
  }, [token, actualizarSalaConMensaje]);

  useEffect(() => {
    montadoRef.current = true;
    if (token) {
      cargarSalas();
      conectarWebSocket();
    } else {
      // Sin token (no autenticado o logout): limpiar estado
      setSalas([]);
      setLoadingSalas(false);
      setConectado(false);
    }
    return () => {
      montadoRef.current = false;
      if (reconectarTimeoutRef.current) clearTimeout(reconectarTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [token]); // se reconecta solo al cambiar el token (login/logout)

  const suscribirseAMensajes = useCallback((callback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  }, []);

  const enviarPorSocket = useCallback((id_sala, mensaje) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ tipo: 'mensaje', id_sala, mensaje }));
      return true;
    }
    return false;
  }, []);

  const value = {
    conectado, salas, loadingSalas,
    recargarSalas: cargarSalas,
    marcarSalaLeidaLocal,
    suscribirseAMensajes,
    enviarPorSocket,
  };
  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) throw new Error('useChatSocket debe usarse dentro de ChatSocketProvider');
  return ctx;
}