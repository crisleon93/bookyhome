// src/screens/ForgotPassword.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import AuthHeader from '../components/AuthHeader';
import Footer from '../components/Footer';
import { IconMail, IconLock } from '../components/Icons';

const VINOTINTO = '#7A1E3A';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#888';
const BORDER = '#E0DBD4';
const WHITE = '#FFFFFF';

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <AuthHeader />

          <View style={styles.authMain}>
            <View style={styles.authCard}>

              {/* Icono circular grande */}
              <View style={styles.iconTop}>
                <View style={styles.iconCircle}>
                  <IconLock size={28} color={VINOTINTO} />
                </View>
              </View>

              <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.subtitle}>
                Ingresa tu email y te enviaremos un enlace para restablecerla
              </Text>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <IconMail />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Botón enviar */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabledBtn]}
                onPress={handleForgot}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.submitBtnText}>Enviar enlace</Text>}
              </TouchableOpacity>

              {/* Volver al login */}
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.backLinkText}>← Volver al inicio de sesión</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Footer onLinkPress={(link) => console.log('Footer link:', link)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#7A1E3A' },
  scrollContent: { flexGrow: 1 },

  authMain: { backgroundColor: BEIGE, paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  authCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 28, width: '100%', maxWidth: 460,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
    alignItems: 'center',
  },

  /* Icono circular */
  iconTop: { marginBottom: 18 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F5EAED',
    justifyContent: 'center', alignItems: 'center',
  },

  title:    { fontSize: 24, fontWeight: '800', color: CARBON, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: GRAY, textAlign: 'center', marginBottom: 28, lineHeight: 20, paddingHorizontal: 8 },

  /* Field */
  field: { width: '100%', marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '600', color: CARBON, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 16, height: 54, backgroundColor: WHITE,
  },
  inputIcon: { marginRight: 12 },
  input:     { flex: 1, fontSize: 16, color: CARBON, padding: 0 },

  /* Botón */
  submitBtn:     { backgroundColor: VINOTINTO, borderRadius: 10, paddingVertical: 16, alignItems: 'center', width: '100%' },
  disabledBtn:   { opacity: 0.7 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  /* Volver */
  backLink:     { marginTop: 20 },
  backLinkText: { color: VINOTINTO, fontWeight: '700', fontSize: 14 },
});