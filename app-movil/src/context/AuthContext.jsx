import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext({});

function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const needed = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(needed);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';

  for (let i = 0; i < padded.length; i += 4) {
    const enc1 = chars.indexOf(padded.charAt(i));
    const enc2 = chars.indexOf(padded.charAt(i + 1));
    const enc3 = chars.indexOf(padded.charAt(i + 2));
    const enc4 = chars.indexOf(padded.charAt(i + 3));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }

  return decodeURIComponent(
    output
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

function decodeJwtPayload(token) {
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          // El header se pone AQUÍ, antes de setToken, para que ya exista
          // cuando cualquier componente hijo reaccione al cambio de token
          // (evita la condición de carrera que causaba 401 en carrito/chat).
          api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
          setToken(storedToken);
          const payload = decodeJwtPayload(storedToken);
          if (payload) setUser(payload);
        }
      } catch (error) {
        console.log('Error restoring token', error);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      console.log('Token set in headers:', token.substring(0, 20) + '...');
    } else {
      delete api.defaults.headers.common.Authorization;
      console.log('Token removed from headers');
    }
  }, [token]);

  const signIn = async (newToken) => {
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    const payload = decodeJwtPayload(newToken);
    const safeUser = payload || {
      sub: 'usuario',
      nombre: 'usuario',
      rol: 'comprador',
    };
    setToken(newToken);
    setUser(safeUser);
    await AsyncStorage.setItem('token', newToken);
  };

  const signOut = async () => {
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}