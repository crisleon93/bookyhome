import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { resetPassword } from '../services/api';

export default function ResetPassword({ route, navigation }) {
  // El token llega por deep link como parámetro de navegación
  const token = route?.params?.token || '';
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errores, setErrores] = useState({});

  const validar = () => {
    const e = {};
    if (password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres';
    if (password !== confirmar) e.confirmar = 'Las contraseñas no coinciden';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validar()) return;
    setCargando(true);
    try {
      await resetPassword({ token, nueva_password: password });
      setExito(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'El enlace es inválido o ha expirado.';
      Alert.alert('Error', msg);
    } finally {
      setCargando(false);
    }
  };

  if (!token) return (
    <View style={s.center}>
      <Text style={s.errorIcon}>⚠️</Text>
      <Text style={s.title}>Enlace inválido</Text>
      <Text style={s.subtitle}>No se encontró un token de restablecimiento. Solicita un nuevo enlace.</Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={s.btnText}>Solicitar nuevo enlace</Text>
      </TouchableOpacity>
    </View>
  );

  if (exito) return (
    <View style={s.center}>
      <Text style={s.successIcon}>✅</Text>
      <Text style={s.title}>Contraseña actualizada</Text>
      <Text style={s.subtitle}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.btnText}>Ir al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.icon}>🔐</Text>
        <Text style={s.title}>Nueva contraseña</Text>
        <Text style={s.subtitle}>Ingresa y confirma tu nueva contraseña para continuar.</Text>

        <View style={s.fieldGroup}>
          <Text style={s.label}>Nueva contraseña</Text>
          <TextInput
            style={[s.input, errores.password && s.inputError]}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          {errores.password && <Text style={s.errorText}>{errores.password}</Text>}
        </View>

        <View style={s.fieldGroup}>
          <Text style={s.label}>Confirmar contraseña</Text>
          <TextInput
            style={[s.input, errores.confirmar && s.inputError]}
            placeholder="Repite la contraseña"
            secureTextEntry
            value={confirmar}
            onChangeText={setConfirmar}
            autoCapitalize="none"
          />
          {errores.confirmar && <Text style={s.errorText}>{errores.confirmar}</Text>}
        </View>

        <TouchableOpacity style={s.btn} onPress={handleReset} disabled={cargando}>
          {cargando
            ? <ActivityIndicator color="white" />
            : <Text style={s.btnText}>Cambiar contraseña</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  content: { padding: 28, paddingTop: 48, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5', padding: 28 },
  icon: { fontSize: 52, marginBottom: 16 },
  errorIcon: { fontSize: 52, marginBottom: 16 },
  successIcon: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#222', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  fieldGroup: { width: '100%', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, fontSize: 15, color: '#222', backgroundColor: 'white', width: '100%' },
  inputError: { borderColor: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: 4 },
  btn: { backgroundColor: '#7A1E3A', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36, alignItems: 'center', marginTop: 8, width: '100%', elevation: 2 },
  btnText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
