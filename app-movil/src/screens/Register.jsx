// src/screens/Register.jsx
import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import api from '../services/api';
import AuthHeader from '../components/AuthHeader';
import Footer from '../components/Footer';
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff, IconClose, IconPhone } from '../components/Icons';

const VINOTINTO = '#7A1E3A';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#888';
const BORDER = '#E0DBD4';
const WHITE = '#FFFFFF';

// ── Contenido legal ──────────────────────────────────────────────
const TERMINOS_SECCIONES = [
  { h: '1. Aceptación de los Términos', p: 'Al registrarte en BookyHome, declaras que tienes al menos 18 años o cuentas con autorización de un tutor legal, y aceptas cumplir estos términos en su totalidad.' },
  { h: '2. Descripción del Servicio', p: 'BookyHome es una plataforma de comercio electrónico especializada en libros que conecta compradores con librerías y vendedores independientes. Actuamos como intermediarios y no somos propietarios de los libros listados.' },
  { h: '3. Registro y Cuenta de Usuario', p: 'Debes proporcionar información verídica al registrarte. Eres el único responsable de mantener la confidencialidad de tu contraseña. BookyHome se reserva el derecho de suspender cuentas que violen estos términos.' },
  { h: '4. Compras y Pagos', p: 'Los precios son establecidos por cada vendedor. Las transacciones están protegidas por nuestro sistema de Compra Protegida. BookyHome no garantiza la disponibilidad permanente de ningún producto.' },
  { h: '5. Envíos y Entregas', p: 'Los tiempos de entrega varían según el vendedor y la ubicación. BookyHome no se responsabiliza por retrasos causados por empresas de mensajería o circunstancias externas.' },
  { h: '6. Devoluciones y Reembolsos', p: 'Tienes hasta 15 días calendario desde la recepción del producto para solicitar una devolución. Los reembolsos se procesan en 5 a 10 días hábiles.' },
  { h: '7. Conducta del Usuario', p: 'Está prohibido publicar información falsa, usar la plataforma para actividades ilegales, copiar contenido protegido o intentar acceder a cuentas ajenas.' },
  { h: '8. Propiedad Intelectual', p: 'El nombre BookyHome, logo, diseño y contenido son propiedad exclusiva de BookyHome. Queda prohibida su reproducción sin autorización expresa.' },
  { h: '9. Modificaciones', p: 'BookyHome puede actualizar estos términos en cualquier momento. Los cambios entran en vigor 30 días después de su publicación.' },
];

const PRIVACIDAD_SECCIONES = [
  { h: '1. Información que Recopilamos', p: 'Recopilamos nombre completo, email, contraseña encriptada, dirección de envío, historial de pedidos y datos de navegación.' },
  { h: '2. Cómo Usamos tu Información', p: 'Usamos tus datos para gestionar tu cuenta, procesar pedidos, enviarte confirmaciones y mejorar nuestros servicios.' },
  { h: '3. Compartir tu Información', p: 'No vendemos tu información a terceros. Solo la compartimos con vendedores para procesar pedidos, empresas de mensajería y autoridades cuando la ley lo exija.' },
  { h: '4. Seguridad de tus Datos', p: 'Tu contraseña se almacena encriptada con bcrypt. Usamos HTTPS para todas las transacciones y realizamos auditorías periódicas de seguridad.' },
  { h: '5. Cookies', p: 'Usamos cookies para mantener tu sesión, recordar tus preferencias y analizar el tráfico. Puedes desactivarlas desde tu navegador.' },
  { h: '6. Tus Derechos', p: 'Tienes derecho a acceder, rectificar y eliminar tus datos. Contáctanos en privacidad@bookyhome.com' },
  { h: '7. Retención de Datos', p: 'Conservamos tus datos mientras tu cuenta esté activa. Si la eliminas, borramos tus datos en máximo 30 días.' },
  { h: '8. Menores de Edad', p: 'BookyHome no está dirigida a menores de 18 años. Si eres tutor y crees que tu hijo proporcionó datos, contáctanos para eliminarlos.' },
];

// ── Modal Legal ──────────────────────────────────────────────────
function LegalModal({ visible, onClose, onAccept, accepted, title, sections }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <IconClose size={20} color={CARBON} />
            </TouchableOpacity>
          </View>

          {accepted && (
            <View style={styles.acceptedBanner}>
              <Text style={styles.acceptedBannerText}>✓ Ya aceptaste este documento</Text>
            </View>
          )}

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalUpdated}>Última actualización: 21 de Marzo de 2026</Text>
            {sections.map((s, i) => (
              <View key={i} style={{ marginBottom: 14 }}>
                <Text style={styles.modalSectionTitle}>{s.h}</Text>
                <Text style={styles.modalSectionText}>{s.p}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            {!accepted ? (
              <>
                <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
                  <Text style={styles.acceptBtnText}>✓ Acepto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.denyBtn} onPress={onClose} activeOpacity={0.85}>
                  <Text style={styles.denyBtnText}>Denegar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.denyBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.denyBtnText}>Cerrar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function Register({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);
  const [showPrivacidad, setShowPrivacidad] = useState(false);

  const [exito, setExito] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const terminosCompletos = aceptoTerminos && aceptoPrivacidad;

  const validate = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre completo');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Ingresa un email válido');
      return false;
    }
    if (!telefono.trim() || telefono.trim().length < 7) {
      Alert.alert('Error', 'Ingresa un teléfono válido');
      return false;
    }
    if (!password.trim() || password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (!terminosCompletos) {
      Alert.alert('Error', 'Debes aceptar tanto los Términos y Condiciones como la Política de Privacidad');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/register', { nombre, email, telefono, password, rol: 'comprador' });
      setExito(true);
      setCountdown(5);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al crear la cuenta';
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  };

  // Countdown para redirigir al login tras éxito
  useEffect(() => {
    if (!exito) return;
    if (countdown === 0) {
      navigation.navigate('Login');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [exito, countdown]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <AuthHeader />

          <View style={styles.authMain}>
            <View style={styles.authCard}>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Únete y accede a miles de libros</Text>

              {/* Mensaje de éxito */}
              {exito && (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>
                    ✓ ¡Cuenta creada exitosamente! Serás redirigido al login en {countdown} segundos...
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.successBannerLink}>Ir al login ahora →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!exito && (
                <>
                  {/* Nombre completo */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Nombre completo</Text>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIcon}>
                        <IconUser size={18} color="#C5425A" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#aaa"
                        value={nombre}
                        onChangeText={setNombre}
                      />
                    </View>
                  </View>

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

                  {/* Teléfono / Celular */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Teléfono / Celular</Text>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIcon}>
                        <IconPhone />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Tu teléfono"
                        placeholderTextColor="#aaa"
                        value={telefono}
                        onChangeText={setTelefono}
                        keyboardType="phone-pad"
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
                        placeholder="Mínimo 8 caracteres"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Términos y privacidad */}
                  <View style={styles.termsRow}>
                    <View style={[styles.checkbox, terminosCompletos && styles.checkboxChecked]}>
                      {terminosCompletos && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <Text style={styles.termsText}>
                      He leído y acepto los{' '}
                      <Text style={styles.termsLink} onPress={() => setShowTerminos(true)}>
                        términos y condiciones
                      </Text>
                      {aceptoTerminos ? ' ✓' : ''} y la{' '}
                      <Text style={styles.termsLink} onPress={() => setShowPrivacidad(true)}>
                        política de privacidad
                      </Text>
                      {aceptoPrivacidad ? ' ✓' : ''}
                    </Text>
                  </View>

                  {/* Botón Crear Cuenta */}
                  <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.disabledBtn]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.submitBtnText}>Crear Cuenta</Text>}
                  </TouchableOpacity>
                </>
              )}

              {/* Footer links */}
              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>
                  ¿Ya tienes cuenta?{' '}
                  <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                    Inicia sesión
                  </Text>
                </Text>
                <Text style={[styles.footerText, { marginTop: 8 }]}>
                  ¿Quieres vender libros?{' '}
                  <Text style={styles.footerLink} onPress={() => navigation.navigate('RegisterLibrary')}>
                    Registra tu librería
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          <Footer onLinkPress={(link) => console.log('Footer link:', link)} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modales legales */}
      <LegalModal
        visible={showTerminos}
        onClose={() => setShowTerminos(false)}
        onAccept={() => { setAceptoTerminos(true); }}
        accepted={aceptoTerminos}
        title="Términos y Condiciones de Uso — BookyHome"
        sections={TERMINOS_SECCIONES}
      />
      <LegalModal
        visible={showPrivacidad}
        onClose={() => setShowPrivacidad(false)}
        onAccept={() => { setAceptoPrivacidad(true); }}
        accepted={aceptoPrivacidad}
        title="Política de Privacidad — BookyHome"
        sections={PRIVACIDAD_SECCIONES}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  scrollContent: { flexGrow: 1 },

  authMain: { backgroundColor: BEIGE, paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  authCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 28, width: '100%', maxWidth: 460,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },

  title:    { fontSize: 26, fontWeight: '800', color: CARBON, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: GRAY, textAlign: 'center', marginBottom: 32 },

  /* Fields */
  field: { marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '600', color: CARBON, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 16, height: 54, backgroundColor: WHITE,
  },
  inputIcon: { marginRight: 12 },
  input:     { flex: 1, fontSize: 16, color: CARBON, padding: 0 },
  eyeBtn:    { padding: 6, marginLeft: 6 },

  /* Términos */
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 26 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, marginTop: 2,
    borderWidth: 1.5, borderColor: BORDER, justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: VINOTINTO, borderColor: VINOTINTO },
  checkboxMark:    { color: WHITE, fontSize: 13, fontWeight: '800' },
  termsText:       { flex: 1, fontSize: 13, color: '#666', lineHeight: 20 },
  termsLink:       { color: VINOTINTO, fontWeight: '700', textDecorationLine: 'underline' },

  /* Botón principal */
  submitBtn:     { backgroundColor: VINOTINTO, borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  disabledBtn:   { opacity: 0.7 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  /* Footer links */
  footerLinks: { marginTop: 26, alignItems: 'center' },
  footerText:  { fontSize: 14, color: '#888', textAlign: 'center' },
  footerLink:  { color: VINOTINTO, fontWeight: '700' },

  /* Banner de éxito */
  successBanner: {
    backgroundColor: '#edf7ee', borderWidth: 1.5, borderColor: '#a5d6a7',
    borderRadius: 8, padding: 16, marginBottom: 20,
  },
  successBannerText: { color: '#2e7d32', fontSize: 13, fontWeight: '600', lineHeight: 19, marginBottom: 8 },
  successBannerLink: { color: '#2e7d32', fontWeight: '800', textDecorationLine: 'underline', fontSize: 13 },

  /* Modal legal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  modalCard: {
    backgroundColor: WHITE, borderRadius: 14, padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle:     { fontSize: 17, fontWeight: '800', color: CARBON, flex: 1, marginRight: 10 },
  modalCloseBtn:  { padding: 2 },

  acceptedBanner: { backgroundColor: '#edf7ee', borderWidth: 1.5, borderColor: '#a5d6a7', borderRadius: 8, padding: 10, marginBottom: 12 },
  acceptedBannerText: { color: '#2e7d32', fontSize: 13, fontWeight: '700' },

  modalBody:         { marginBottom: 16 },
  modalUpdated:      { fontSize: 12, fontWeight: '700', color: CARBON, marginBottom: 14 },
  modalSectionTitle: { fontSize: 14, fontWeight: '800', color: CARBON, marginBottom: 4 },
  modalSectionText:  { fontSize: 13, color: '#555', lineHeight: 19 },

  modalActions: { flexDirection: 'row', gap: 10 },
  acceptBtn:    { flex: 1, backgroundColor: VINOTINTO, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  acceptBtnText:{ color: WHITE, fontWeight: '700', fontSize: 14 },
  denyBtn:      { flex: 1, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  denyBtnText:  { color: '#666', fontWeight: '600', fontSize: 14 },
});