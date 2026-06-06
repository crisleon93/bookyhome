import React, { useContext, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      const token = res.data?.access_token;
      if (!token) {
        throw new Error('No se recibió token');
      }
      await signIn(token);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error';
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Entrar" onPress={handleLogin} />
      )}

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkButton}>
        <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 },
  linkButton: { marginTop: 12 },
  linkText: { color: '#007bff', textAlign: 'center' },
});
