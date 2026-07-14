// src/screens/Login.jsx
import React, { useContext, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AuthHeader from '../components/AuthHeader';
import Footer from '../components/Footer';
import { IconMail, IconLock, IconEye, IconEyeOff, IconGoogle } from '../components/Icons';

const VINOTINTO = '#7A1E3A';
const ROJO_SUAVE = '#C5425A';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#888';
const BORDER = '#E0DBD4';
const WHITE = '#FFFFFF';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
      if (!token) throw new Error('No se recibió token');
      await signIn(token);
      // El AppNavigator detecta el token y cambia al stack autenticado automáticamente
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error';
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader />

          <View style={styles.authMain}>
            <View style={styles.authCard}>
              <Text style={styles.title}>Iniciar Sesión</Text>
              <Text style={styles.subtitle}>Ingresa a tu cuenta de BookyHome</Text>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <IconMail />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="ejemplo@gmail.com"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Contraseña */}
              <View style={styles.field}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <IconLock />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Olvidé contraseña */}
              <TouchableOpacity
                style={styles.forgotWrap}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* Recordarme */}
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRemember(!remember)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                  {remember && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Recordarme</Text>
              </TouchableOpacity>

              {/* Botón Ingresar */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabledBtn]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.submitBtnText}>Ingresar</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google */}
              <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85}>
                <IconGoogle size={18} />
                <Text style={styles.googleText}>Continuar con Google</Text>
              </TouchableOpacity>

              {/* Footer link */}
              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>
                  ¿No tienes cuenta?{' '}
                  <Text
                    style={styles.footerLink}
                    onPress={() => navigation.navigate('Register')}
                  >
                    Regístrate
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          <Footer onLinkPress={(link) => console.log('Footer link:', link)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  scrollContent: { flexGrow: 1 },

  /* Auth main */
  authMain: {
    backgroundColor: BEIGE,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  authCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 460,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  title:    { fontSize: 26, fontWeight: '800', color: CARBON, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: GRAY, textAlign: 'center', marginBottom: 32 },

  /* Fields */
  field: { marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '600', color: CARBON, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 16, height: 54, backgroundColor: WHITE,
  },
  inputIcon: { marginRight: 12 },
  input:     { flex: 1, fontSize: 16, color: CARBON, padding: 0 },
  eyeBtn:    { padding: 6, marginLeft: 6 },

  /* Olvidé / recordarme */
  forgotWrap: { alignItems: 'flex-end', marginTop: -8, marginBottom: 18 },
  forgotText: { fontSize: 13, fontWeight: '600', color: VINOTINTO },

  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: VINOTINTO, borderColor: VINOTINTO },
  checkboxMark:    { color: WHITE, fontSize: 13, fontWeight: '800' },
  rememberText:    { fontSize: 14, color: '#666' },

  /* Botón principal */
  submitBtn:     { backgroundColor: VINOTINTO, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginBottom: 6 },
  disabledBtn:   { opacity: 0.7 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  /* Divider */
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 26 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E0D8' },
  dividerText: { fontSize: 13, color: '#bbb' },

  /* Google */
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, paddingVertical: 16,
  },
  googleText: { fontSize: 15, fontWeight: '600', color: CARBON },

  /* Footer link */
  footerLinks: { marginTop: 26, alignItems: 'center' },
  footerText:  { fontSize: 14, color: '#888' },
  footerLink:  { color: VINOTINTO, fontWeight: '700' },
});