import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { verifyEmail } from '../services/api';

export default function VerifyEmail({ route, navigation }) {
  // El token llega por deep link como parámetro de navegación
  const token = route?.params?.token || '';
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'exito' | 'error'
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('error');
      setMensajeError('No se encontró un token de verificación. El enlace puede ser inválido.');
      return;
    }
    verificar();
  }, [token]);

  const verificar = async () => {
    setEstado('cargando');
    try {
      await verifyEmail({ token });
      setEstado('exito');
    } catch (err) {
      setEstado('error');
      setMensajeError(err.response?.data?.detail || 'El enlace es inválido o ya fue utilizado.');
    }
  };

  if (estado === 'cargando') return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#7A1E3A" style={{ marginBottom: 20 }} />
      <Text style={s.title}>Verificando tu cuenta...</Text>
      <Text style={s.subtitle}>Por favor espera un momento.</Text>
    </View>
  );

  if (estado === 'exito') return (
    <View style={s.center}>
      <Text style={s.icon}>🎉</Text>
      <Text style={s.title}>¡Cuenta verificada!</Text>
      <Text style={s.subtitle}>Tu correo ha sido verificado correctamente. Ya puedes iniciar sesión.</Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.btnText}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.center}>
      <Text style={s.icon}>❌</Text>
      <Text style={s.title}>Verificación fallida</Text>
      <Text style={s.subtitle}>{mensajeError}</Text>
      <TouchableOpacity style={s.btn} onPress={verificar}>
        <Text style={s.btnText}>Reintentar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.secondaryText}>Ir al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5', padding: 28 },
  icon: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#222', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  btn: { backgroundColor: '#7A1E3A', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36, alignItems: 'center', width: '100%', elevation: 2, marginBottom: 12 },
  btnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  secondaryBtn: { paddingVertical: 12 },
  secondaryText: { color: '#7A1E3A', fontSize: 14, fontWeight: '600' },
});
