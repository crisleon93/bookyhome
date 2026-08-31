import React, { createContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
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

function isTokenExpired(payload) {
  return !payload?.exp || payload.exp * 1000 <= Date.now();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const appState = useRef(AppState.currentState);
  const authFailureHandled = useRef(false);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !authFailureHandled.current) {
          authFailureHandled.current = true;
          delete api.defaults.headers.common.Authorization;
          setToken(null);
          setUser(null);
          setPendingToken(null);
          setBiometricLocked(false);
          setBiometricEnabled(false);
          await AsyncStorage.multiRemove(['token', 'biometricEnabled']);
          authFailureHandled.current = false;
        }
        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptorId);
  }, []);

  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedBiometricEnabled = await AsyncStorage.getItem('biometricEnabled');

        if (storedToken) {
          const payload = decodeJwtPayload(storedToken);
          if (!payload || isTokenExpired(payload)) {
            await AsyncStorage.multiRemove(['token', 'biometricEnabled']);
            return;
          }

          if (storedBiometricEnabled === 'true') {
            setPendingToken(storedToken);
            setBiometricEnabled(true);
            setBiometricLocked(true);
          } else {
            api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
            setToken(storedToken);
            setUser(payload);
          }
        }
      } catch (error) {
        console.log('Error restoring token', error);
      } finally {
        setLoading(false);
      }
    };

    restore();

    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        const storedToken = await AsyncStorage.getItem('token');
        const storedBiometricEnabled = await AsyncStorage.getItem('biometricEnabled');

        if (storedToken && storedBiometricEnabled === 'true') {
          setPendingToken(storedToken);
          setBiometricEnabled(true);
          setBiometricLocked(true);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const signIn = async (newToken, options = {}) => {
    if (!newToken) {
      return;
    }
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    authFailureHandled.current = false;
    const payload = decodeJwtPayload(newToken);
    const safeUser = payload || {
      sub: 'usuario',
      nombre: 'usuario',
      rol: 'comprador',
    };

    setToken(newToken);
    setUser(safeUser);
    setBiometricLocked(false);
    setPendingToken(null);
    await AsyncStorage.setItem('token', newToken);

    if (options.enableBiometrics) {
      await AsyncStorage.setItem('biometricEnabled', 'true');
      setBiometricEnabled(true);
    } else {
      await AsyncStorage.setItem('biometricEnabled', 'false');
      setBiometricEnabled(false);
    }
  };

  const setBiometricPreference = async (enabled) => {
    setBiometricEnabled(enabled);
    await AsyncStorage.setItem('biometricEnabled', enabled ? 'true' : 'false');
  };

  const unlockWithBiometrics = async (method) => {
    if (!pendingToken) {
      return { success: false, reason: 'no_session' };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware) {
        return { success: false, reason: 'no_hardware' };
      }

      if (!isEnrolled) {
        return { success: false, reason: 'not_enrolled' };
      }

      const promptMessage =
        method === 'face'
          ? 'Desbloquea BookyHome con Face Unlock'
          : method === 'fingerprint'
          ? 'Desbloquea BookyHome con tu huella'
          : 'Desbloquea BookyHome con tu biometría';

      const options = {
        promptMessage,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
      };

      if (Platform.OS === 'ios') {
        options.fallbackLabel = '';
      }

      if (Platform.OS === 'android') {
        options.promptSubtitle =
          method === 'face'
            ? 'Usa tu rostro para desbloquear'
            : method === 'fingerprint'
            ? 'Usa tu huella digital'
            : 'Usa tu biometría';
        options.promptDescription =
          method === 'face'
            ? 'Face Unlock disponible en tu dispositivo'
            : 'Autentícate con tu huella digital';
        options.biometricsSecurityLevel = method === 'face' ? 'weak' : 'strong';
      }

      const result = await LocalAuthentication.authenticateAsync(options);

      if (result.success) {
        await signIn(pendingToken, { enableBiometrics: true });
        return { success: true };
      }

      const cancelErrors = new Set(['user_cancel', 'system_cancel', 'app_cancel']);
      if (cancelErrors.has(result.error)) {
        return { success: false, reason: 'cancelled' };
      }

      return { success: false, reason: 'failed', error: result.error };
    } catch (error) {
      console.log('Biometric auth error', error);
      return { success: false, reason: 'failed', error: error?.message };
    }
  };

  const signOut = async () => {
    delete api.defaults.headers.common.Authorization;
    const currentToken = token;
    setToken(null);
    setUser(null);

    if (biometricEnabled && currentToken) {
      setPendingToken(currentToken);
      setBiometricLocked(true);
      // Leave token and biometricEnabled in storage so biometric login can restore it.
    } else {
      setBiometricLocked(false);
      setPendingToken(null);
      setBiometricEnabled(false);
      await AsyncStorage.multiRemove(['token', 'biometricEnabled']);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        biometricEnabled,
        biometricLocked,
        pendingToken,
        signIn,
        signOut,
        unlockWithBiometrics,
        setBiometricPreference,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}