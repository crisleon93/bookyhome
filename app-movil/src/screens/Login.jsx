// src/screens/Login.jsx
import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AuthHeader from '../components/AuthHeader';
import Footer from '../components/Footer';
import { IconMail, IconLock, IconEye, IconEyeOff, IconGoogle } from '../components/Icons';

const VINOTINTO = '#7A1E3A';
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
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [supportedBiometricTypes, setSupportedBiometricTypes] = useState([]);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [biometricModalOptions, setBiometricModalOptions] = useState([]);
  const [biometricSuccessToken, setBiometricSuccessToken] = useState(null);
  const {
    signIn,
    biometricEnabled,
    biometricLocked,
    pendingToken,
    unlockWithBiometrics,
    setBiometricPreference,
  } = useContext(AuthContext);

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const available = hasHardware && isEnrolled && supportedTypes.length > 0;
        setSupportedBiometricTypes(supportedTypes);
        setBiometricAvailable(available);
      } catch (error) {
        setBiometricAvailable(false);
      }
    };

    checkSupport();
  }, []);

  useEffect(() => {
    if (!biometricLocked || !pendingToken || !biometricAvailable) return;

    const runPrompt = async () => {
      setBiometricLoading(true);
      const result = await unlockWithBiometrics();
      if (!result.success && result.reason !== 'cancelled') {
        showBiometricError(result);
      }
      setBiometricLoading(false);
    };

    runPrompt();
  }, [biometricAvailable, biometricLocked, pendingToken, unlockWithBiometrics]);

  const showBiometricError = (result) => {
    if (result.reason === 'no_session') {
      Alert.alert(
        'Sesión no guardada',
        'No hay una sesión biométrica activa. Ve a iniciar sesión y marca "Usar Face ID / Huella" para habilitarla.'
      );
      return;
    }

    if (result.reason === 'not_enrolled' || result.reason === 'no_hardware') {
      Alert.alert(
        'Biometría no disponible',
        'Activa Face ID o huella en la configuración de tu dispositivo y vuelve a iniciar sesión.'
      );
      return;
    }

    if (result.reason === 'cancelled') {
      return;
    }

    Alert.alert(
      'No se pudo verificar',
      'Intenta de nuevo o inicia sesión con tu email y contraseña.'
    );
  };

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

      if (enableBiometrics && biometricAvailable) {
        await setBiometricPreference(true);
        setBiometricSuccessToken(token);
      } else {
        await signIn(token, { enableBiometrics: false });
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error';
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = async (method) => {
    setBiometricLoading(true);
    const result = await unlockWithBiometrics(method);

    if (!result.success && method === 'face' && result.reason !== 'cancelled') {
      const message =
        result.reason === 'not_enrolled'
          ? 'Tu dispositivo no tiene Face ID configurado.'
          : result.reason === 'no_hardware'
          ? 'Tu dispositivo no tiene soporte de Face ID.'
          : result.reason === 'failed'
          ? `No se pudo desbloquear con Face ID (${result.error || 'error desconocido'}).`
          : 'No se pudo desbloquear con Face ID.';

      Alert.alert(
        'Face ID no disponible',
        message,
        [
          {
            text: 'Usar huella',
            onPress: async () => {
              const fingerprintResult = await unlockWithBiometrics('fingerprint');
              if (!fingerprintResult.success) {
                showBiometricError(fingerprintResult);
              }
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } else if (!result.success) {
      showBiometricError(result);
    }

    setBiometricLoading(false);
  };

  const faceSupported = supportedBiometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const fingerprintSupported = supportedBiometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

  const handleBiometricButtonPress = async () => {
    if (!biometricAvailable) {
      Alert.alert('Biometría no disponible', 'Activa Face ID o huella en tu dispositivo.');
      return;
    }

    if (!biometricEnabled || !pendingToken) {
      Alert.alert(
        'No hay sesión biométrica activa',
        'Inicia sesión con email y contraseña y marca "Usar Face ID / Huella" para habilitarla.'
      );
      return;
    }

    let currentSupportedTypes = supportedBiometricTypes;
    try {
      currentSupportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setSupportedBiometricTypes(currentSupportedTypes);
    } catch (error) {
      // Keep the previous supported types if refresh fails
    }

    const currentFaceSupported = currentSupportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const currentFingerprintSupported = currentSupportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

    const buttons = [];

    if (currentFaceSupported) {
      buttons.push({ label: 'Face ID', onPress: () => handleBiometricUnlock('face') });
    }
    if (currentFingerprintSupported) {
      buttons.push({ label: 'Huella dactilar', onPress: () => handleBiometricUnlock('fingerprint') });
    }

    setBiometricModalOptions(buttons);
    setBiometricModalVisible(true);
  };

  const canUnlockWithBiometrics = biometricEnabled && pendingToken && biometricAvailable;
  const biometricMethodNames = supportedBiometricTypes
    .map((type) => {
      if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
        return 'Face ID';
      }
      if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'Huella';
      return 'Biometría';
    })
    .join(' + ');

  const biometricButtonLabel = 'Ingresar con Huella o Face ID';

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
              <View style={styles.heroContainer}>
                <LottieView
                  source={require('../assets/biometric-login.json')}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
              </View>

              <Text style={styles.title}>Iniciar Sesión</Text>
              <Text style={styles.subtitle}>Ingresa a tu cuenta de BookyHome con una experiencia más fluida.</Text>

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

              <TouchableOpacity
                style={styles.forgotWrap}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <View style={styles.optionList}>
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

                {biometricAvailable && (
                  <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setEnableBiometrics(!enableBiometrics)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, enableBiometrics && styles.checkboxChecked]}>
                      {enableBiometrics && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <Text style={styles.rememberText}>Usar Face ID / Huella</Text>
                  </TouchableOpacity>
                )}
              </View>

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

              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.bioButton}
                  onPress={handleBiometricButtonPress}
                  disabled={biometricLoading}
                  activeOpacity={0.85}
                >
                  {biometricLoading ? (
                    <ActivityIndicator color={VINOTINTO} />
                  ) : (
                    <Text style={styles.bioButtonText}>{biometricButtonLabel}</Text>
                  )}
                </TouchableOpacity>
              )}


              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85}>
                <IconGoogle size={18} />
                <Text style={styles.googleText}>Continuar con Google</Text>
              </TouchableOpacity>

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

      {/* Modal biométrico personalizado */}
      <Modal
        visible={biometricModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBiometricModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.bioModalOverlay}
          activeOpacity={1}
          onPress={() => setBiometricModalVisible(false)}
        >
          <View style={styles.bioModalCard} onStartShouldSetResponder={() => true}>
            {/* Franja vinotinto superior */}
            <View style={styles.bioModalHeader}>
              <Text style={styles.bioModalTitle}>Elige un método</Text>
            </View>
            <Text style={styles.bioModalSubtitle}>
              Selecciona cómo deseas desbloquear la app.
            </Text>
            {/* Botones de opciones */}
            <View style={styles.bioModalOptions}>
              {biometricModalOptions.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.bioModalOptionBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setBiometricModalVisible(false);
                    btn.onPress();
                  }}
                >
                  <Text style={styles.bioModalOptionText}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Cancelar */}
            <TouchableOpacity
              style={styles.bioModalCancelBtn}
              activeOpacity={0.7}
              onPress={() => setBiometricModalVisible(false)}
            >
              <Text style={styles.bioModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={Boolean(biometricSuccessToken)}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.bioSuccessOverlay}>
          <View style={styles.bioSuccessCard}>
            <View style={styles.bioSuccessIcon}><Text style={styles.bioSuccessIconText}>✓</Text></View>
            <Text style={styles.bioSuccessTitle}>Huella registrada</Text>
            <Text style={styles.bioSuccessText}>Tu sesión quedó protegida. La próxima vez podrás ingresar con Face ID o huella.</Text>
            <TouchableOpacity
              style={styles.bioSuccessButton}
              onPress={async () => {
                const token = biometricSuccessToken;
                setBiometricSuccessToken(null);
                await signIn(token, { enableBiometrics: true });
              }}
            >
              <Text style={styles.bioSuccessButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#7A1E3A' },
  scrollContent: { flexGrow: 1 },
  authMain: {
    backgroundColor: BEIGE,
    paddingVertical: 20,
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
  heroContainer: { alignItems: 'center', marginBottom: 4 },
  lottie: { width: 100, height: 100 },
  title: { fontSize: 26, fontWeight: '800', color: CARBON, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: GRAY, textAlign: 'center', marginBottom: 24 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: CARBON, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 16, height: 54, backgroundColor: WHITE,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: CARBON, padding: 0 },
  eyeBtn: { padding: 6, marginLeft: 6 },
  forgotWrap: { alignItems: 'flex-end', marginTop: -6, marginBottom: 14 },
  forgotText: { fontSize: 13, fontWeight: '600', color: VINOTINTO },
  optionList: { marginBottom: 18 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: VINOTINTO, borderColor: VINOTINTO },
  checkboxMark: { color: WHITE, fontSize: 13, fontWeight: '800' },
  rememberText: { fontSize: 14, color: '#666' },
  submitBtn: { backgroundColor: VINOTINTO, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  bioButton: {
    backgroundColor: '#F8ECEF',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#EAC6CF',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  bioButtonText: { color: VINOTINTO, fontSize: 15, fontWeight: '700' },
  bioHint: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E0D8' },
  dividerText: { fontSize: 13, color: '#bbb' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, paddingVertical: 16,
  },
  googleText: { fontSize: 15, fontWeight: '600', color: CARBON },
  footerLinks: { marginTop: 22, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#888' },
  footerLink: { color: VINOTINTO, fontWeight: '700' },

  /* Modal biométrico */
  bioModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  bioModalCard: {
    backgroundColor: WHITE, borderRadius: 18, width: '100%',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  bioModalHeader: {
    backgroundColor: VINOTINTO, paddingVertical: 18, paddingHorizontal: 24,
  },
  bioModalTitle: {
    color: WHITE, fontSize: 18, fontWeight: '800',
  },
  bioModalSubtitle: {
    fontSize: 14, color: GRAY, paddingHorizontal: 24,
    paddingTop: 16, paddingBottom: 8, lineHeight: 20,
  },
  bioModalOptions: {
    paddingHorizontal: 24, paddingTop: 8, gap: 10,
  },
  bioModalOptionBtn: {
    backgroundColor: VINOTINTO, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  bioModalOptionText: {
    color: WHITE, fontSize: 15, fontWeight: '700',
  },
  bioModalCancelBtn: {
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  bioModalCancelText: {
    color: GRAY, fontSize: 14, fontWeight: '600',
  },
  bioSuccessOverlay: { flex: 1, backgroundColor: 'rgba(42, 18, 28, 0.5)', justifyContent: 'center', paddingHorizontal: 28 },
  bioSuccessCard: { backgroundColor: WHITE, borderWidth: 2, borderColor: VINOTINTO, borderRadius: 18, padding: 26, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 14, elevation: 8 },
  bioSuccessIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: VINOTINTO, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  bioSuccessIconText: { color: WHITE, fontSize: 30, fontWeight: '900' },
  bioSuccessTitle: { color: VINOTINTO, fontSize: 21, fontWeight: '800', marginBottom: 8 },
  bioSuccessText: { color: '#62555A', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  bioSuccessButton: { backgroundColor: VINOTINTO, width: '100%', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  bioSuccessButtonText: { color: WHITE, fontSize: 15, fontWeight: '800' },
});
