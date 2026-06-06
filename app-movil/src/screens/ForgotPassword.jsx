import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgot = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }
    setLoading(true);
    try {
      await api.post('/forgot-password', { email });
      Alert.alert('Enviado', 'Si el email existe, recibirás un enlace de recuperación.');
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error';
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>Ingresa tu email y te enviaremos instrucciones.</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Enviar enlace" onPress={handleForgot} />
      )}
      <Text style={styles.footerText} onPress={() => navigation.goBack()}>
        Volver al login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 },
  footerText: { marginTop: 16, textAlign: 'center', color: '#007bff' },
});
