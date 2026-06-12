import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { registerLibrary } from '../services/api';
import AuthHeader from '../components/AuthHeader';
import Footer from '../components/Footer';
import { IconUser, IconStore, IconLocation, IconPhone, IconMail, IconLock, IconEye, IconEyeOff } from '../components/Icons';

const VINOTINTO = '#7A1E3A';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#888';
const BORDER = '#E0DBD4';
const WHITE = '#FFFFFF';
const ERROR = '#e53935';

export default function RegisterLibrary({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [libreria, setLibreria] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  const [errors, setErrors] = useState({
    nombre: '', libreria: '', direccion: '', telefono: '', email: '', password: '',
  });

  const clearField = (field) => setErrors(p => ({ ...p, [field]: '' }));

  const validate = () => {
    const e = { nombre: '', libreria: '', direccion: '', telefono: '', email: '', password: '' };
    let valid = true;

    if (!nombre.trim())    { e.nombre = 'Este campo es obligatorio'; valid = false; }
    if (!libreria.trim())  { e.libreria = 'Este campo es obligatorio'; valid = false; }
    if (!direccion.trim()) { e.direccion = 'Este campo es obligatorio'; valid = false; }

    if (!telefono.trim()) {
      e.telefono = 'Este campo es obligatorio'; valid = false;
    } else if (!/^\d{7,15}$/.test(telefono.trim())) {
      e.telefono = 'Ingresa un número válido (solo números, 7-15 dígitos)'; valid = false;
    }

    if (!email.trim()) {
      e.email = 'Este campo es obligatorio'; valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Ingresa un email válido'; valid = false;
    }

    if (!password.trim()) {
      e.password = 'Este campo es obligatorio'; valid = false;
    } else if (password.length < 8) {
      e.password = 'Mínimo 8 caracteres'; valid = false;
    }

    setErrors(e);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerLibrary({
        nombre,
        libreria,
        direccion,
        telefono,
        email,
        password,
        rol: 'vendedor',
      });
      setExito(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al registrar la librería';
      setErrors(p => ({ ...p, email: msg }));
    } finally {
      setLoading(false);
    }
  };

  // Redirigir al login tras éxito
  useEffect(() => {
    if (!exito) return;
    const timer = setTimeout(() => navigation.navigate('Login'), 2500);
    return () => clearTimeout(timer);
  }, [exito]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <AuthHeader />

          <View style={styles.authMain}>
            <View style={styles.authCard}>
              <Text style={styles.title}>Registrar Librería</Text>
              <Text style={styles.subtitle}>Vende tus libros en BookyHome</Text>

              {exito && (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>
                    ✓ ¡Librería registrada exitosamente! Ya puedes iniciar sesión.
                  </Text>
                </View>
              )}

              {!exito && (
                <>
                  {/* Nombre */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Nombre</Text>
                    <View style={[styles.inputWrapper, errors.nombre && styles.inputError]}>
                      <View style={styles.inputIcon}><IconUser size={18} color="#C5425A" /></View>
                      <TextInput
                        style={styles.input}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#aaa"
                        value={nombre}
                        onChangeText={(t) => { setNombre(t); clearField('nombre'); }}
                      />
                    </View>
                    {errors.nombre && <Text style={styles.errorMsg}>{errors.nombre}</Text>}
                  </View>

                  {/* Nombre librería */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Nombre de la librería</Text>
                    <View style={[styles.inputWrapper, errors.libreria && styles.inputError]}>
                      <View style={styles.inputIcon}><IconStore /></View>
                      <TextInput
                        style={styles.input}
                        placeholder="Mi Librería"
                        placeholderTextColor="#aaa"
                        value={libreria}
                        onChangeText={(t) => { setLibreria(t); clearField('libreria'); }}
                      />
                    </View>
                    {errors.libreria && <Text style={styles.errorMsg}>{errors.libreria}</Text>}
                  </View>

                  {/* Dirección */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Dirección</Text>
                    <View style={[styles.inputWrapper, errors.direccion && styles.inputError]}>
                      <View style={styles.inputIcon}><IconLocation size={18} color="#C5425A" /></View>
                      <TextInput
                        style={styles.input}
                        placeholder="Calle Principal 123"
                        placeholderTextColor="#aaa"
                        value={direccion}
                        onChangeText={(t) => { setDireccion(t); clearField('direccion'); }}
                      />
                    </View>
                    {errors.direccion && <Text style={styles.errorMsg}>{errors.direccion}</Text>}
                  </View>

                  {/* Teléfono */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Teléfono / Celular</Text>
                    <View style={[styles.inputWrapper, errors.telefono && styles.inputError]}>
                      <View style={styles.inputIcon}><IconPhone /></View>
                      <TextInput
                        style={styles.input}
                        placeholder="Tu teléfono"
                        placeholderTextColor="#aaa"
                        value={telefono}
                        onChangeText={(t) => { setTelefono(t); clearField('telefono'); }}
                        keyboardType="phone-pad"
                      />
                    </View>
                    {errors.telefono && <Text style={styles.errorMsg}>{errors.telefono}</Text>}
                  </View>

                  {/* Email */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                      <View style={styles.inputIcon}><IconMail /></View>
                      <TextInput
                        style={styles.input}
                        placeholder="@email.com"
                        placeholderTextColor="#aaa"
                        value={email}
                        onChangeText={(t) => { setEmail(t); clearField('email'); }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                    {errors.email && <Text style={styles.errorMsg}>{errors.email}</Text>}
                  </View>

                  {/* Contraseña */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Contraseña</Text>
                    <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                      <View style={styles.inputIcon}><IconLock /></View>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={(t) => { setPassword(t); clearField('password'); }}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorMsg}>{errors.password}</Text>}
                  </View>

                  {/* Botón */}
                  <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.disabledBtn]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.submitBtnText}>Registrar Librería</Text>}
                  </TouchableOpacity>
                </>
              )}

              {/* Footer link */}
              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>
                  ¿Ya tienes cuenta?{' '}
                  <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                    Inicia sesión
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

  authMain: { backgroundColor: BEIGE, paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  authCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },

  title:    { fontSize: 26, fontWeight: '800', color: CARBON, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: GRAY, textAlign: 'center', marginBottom: 32 },

  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: CARBON, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 16, height: 54, backgroundColor: WHITE,
  },
  inputError: { borderColor: ERROR },
  inputIcon: { marginRight: 12 },
  input:     { flex: 1, fontSize: 16, color: CARBON, padding: 0 },
  eyeBtn:    { padding: 6, marginLeft: 6 },
  errorMsg:  { color: ERROR, fontSize: 12, fontWeight: '600', marginTop: 5 },

  submitBtn:     { backgroundColor: VINOTINTO, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  disabledBtn:   { opacity: 0.7 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  footerLinks: { marginTop: 26, alignItems: 'center' },
  footerText:  { fontSize: 14, color: '#888', textAlign: 'center' },
  footerLink:  { color: VINOTINTO, fontWeight: '700' },

  successBanner: {
    backgroundColor: '#edf7ee', borderWidth: 1.5, borderColor: '#a5d6a7',
    borderRadius: 8, padding: 16, marginBottom: 8,
  },
  successBannerText: { color: '#2e7d32', fontSize: 13, fontWeight: '600', lineHeight: 19 },
});