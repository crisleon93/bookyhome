import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext({});

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
