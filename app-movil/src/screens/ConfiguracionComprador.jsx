import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconBell, IconEye, IconEyeOff, IconGlobe, IconMail, IconSettings, IconShield } from '../components/Icons';
import Footer from '../components/Footer';
import { changePassword, getProfile, updatePreferences } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';

const PRIMARY = '#7A1E3A';
const WEB_PINK = '#e91e63';
const PASSWORD_REQUIREMENTS = 'Mínimo 8 caracteres, una mayúscula, un número y un carácter especial.';
const DEFAULT_PREFERENCES = {
  notificaciones_mensajes: { email: true, web: true },
  notificaciones_resenas: { email: true, web: true },
  notificaciones_ofertas: { email: true, web: false },
  notificaciones_pedidos: { email: true, web: true },
  notificaciones_entregas: { email: true, web: true },
  notificaciones_pagos: { email: true, web: true },
  notificaciones_sistema: { email: true, web: true },
};

const NOTIFICATION_TYPES = [
  {
    key: 'notificaciones_mensajes',
    title: 'Mensajes',
    description: 'Mensajes de chat con vendedores',
  },
  {
    key: 'notificaciones_resenas',
    title: 'Reseñas',
    description: 'Notificaciones sobre reseñas de productos',
  },
  {
    key: 'notificaciones_ofertas',
    title: 'Promociones y Ofertas',
    description: 'Descuentos especiales y promociones',
  },
  {
    key: 'notificaciones_pedidos',
    title: 'Actualizaciones de Pedidos',
    description: 'Estado de tus compras y envíos',
  },
  {
    key: 'notificaciones_entregas',
    title: 'Entregas y Domicilios',
    description: 'Notificaciones sobre entregas y domicilios',
  },
  {
    key: 'notificaciones_pagos',
    title: 'Pagos',
    description: 'Notificaciones sobre pagos y reembolsos',
  },
  {
    key: 'notificaciones_sistema',
    title: 'Sistema y Soporte',
    description: 'Quejas, reclamos y notificaciones del sistema',
  },
];

function mergePreferences(saved = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_PREFERENCES).map(([key, defaults]) => {
      const current = saved?.[key] || {};
      return [
        key,
        {
          email: typeof current.email === 'boolean' ? current.email : defaults.email,
          web: typeof current.web === 'boolean' ? current.web : defaults.web,
        },
      ];
    }),
  );
}

function errorMessage(error, fallback) {
  const message = error?.response?.data?.detail || error?.response?.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) {
    const details = message
      .map((item) => item?.msg || item?.message)
      .filter((item) => typeof item === 'string');
    if (details.length) return details.join(' ');
  }
  return fallback;
}

export default function ConfiguracionComprador() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const { darkMode, setDarkMode, colors: globalColors } = useAppTheme();
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirmar: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getProfile();
        const data = response.data || {};
        setProfile(data);
        setPreferences(mergePreferences(data.preferencias));
      } catch {
        Alert.alert('Error', 'No se pudo cargar la configuración de tu cuenta.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const colors = {
    ...globalColors,
    inset: darkMode ? '#303030' : '#faf8f6',
    row: darkMode ? '#2a2a2a' : '#FFFFFF',
    description: darkMode ? '#b8b8b8' : '#777777',
    heading: darkMode ? '#e05a7a' : PRIMARY,
    input: darkMode ? '#2a2a2a' : '#FFFFFF',
    inputBorder: darkMode ? '#444444' : '#dddddd',
  };

  const toggleChannel = (type, channel) => {
    setPreferences((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [channel]: !current[type][channel],
      },
    }));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await updatePreferences(preferences);
      Alert.alert('Listo', 'Preferencias guardadas');
    } catch (error) {
      Alert.alert('Error', errorMessage(error, 'Error al guardar preferencias'));
    } finally {
      setSaving(false);
    }
  };

  const toggleDarkMode = async () => {
    const nextMode = !darkMode;
    try {
      await setDarkMode(nextMode);
      Alert.alert('Listo', nextMode ? 'Modo oscuro activado' : 'Modo claro activado');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la preferencia del tema.');
    }
  };

  const setPasswordField = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordFeedback(null);
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      password_actual: '',
      password_nueva: '',
      password_confirmar: '',
    });
    setVisiblePasswords({});
    setPasswordFeedback(null);
  };

  const submitPassword = async () => {
    if (!passwordForm.password_actual || !passwordForm.password_nueva || !passwordForm.password_confirmar) {
      setPasswordFeedback({ type: 'error', message: 'Completa todos los campos de contraseña.' });
      return;
    }
    if (passwordForm.password_nueva !== passwordForm.password_confirmar) {
      setPasswordFeedback({ type: 'error', message: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    const passwordError = passwordValidationMessage(passwordForm.password_nueva);
    if (passwordError) {
      setPasswordFeedback({ type: 'error', message: passwordError });
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({
        password_actual: passwordForm.password_actual,
        password_nueva: passwordForm.password_nueva,
      });
      setPasswordFeedback({ type: 'success', message: 'Contraseña actualizada correctamente.' });
      Alert.alert('Listo', 'Contraseña actualizada correctamente');
      resetPasswordForm();
      setShowPasswordForm(false);
    } catch (error) {
      const message = errorMessage(error, 'Error al cambiar contraseña');
      setPasswordFeedback({ type: 'error', message });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.page }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.page }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headingRow}>
            <IconSettings size={28} color={PRIMARY} />
            <Text style={[styles.pageTitle, { color: colors.text }]}>Configuración de Cuenta</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeading}>
            <LinearGradient colors={[PRIMARY, '#9a2e52']} style={styles.sectionIcon}>
              <IconBell size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.sectionHeadingText}>
              <Text style={[styles.sectionTitle, { color: colors.heading }]}>Preferencias de Notificaciones</Text>
              <Text style={[styles.helper, { color: colors.muted }]}>
                Personaliza dónde recibir cada tipo de notificación
              </Text>
            </View>
          </View>

          <View style={[styles.channelHeader, { backgroundColor: darkMode ? '#252525' : '#f8f6f4', borderColor: colors.border }]}>
            <Text style={[styles.channelHeaderTitle, { color: colors.text, flex: 2 }]}>Tipo de notificación</Text>
            <ChannelHeading label="Email" color={PRIMARY} icon="email" textColor={colors.text} />
            <ChannelHeading label="Web" color={WEB_PINK} icon="web" textColor={colors.text} />
          </View>

          {NOTIFICATION_TYPES.map((notification) => (
            <View
              key={notification.key}
              style={[styles.notificationCard, { backgroundColor: colors.row, borderColor: colors.border }]}
            >
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: colors.text }]}>{notification.title}</Text>
                <Text style={[styles.notificationDescription, { color: colors.description }]}>
                  {notification.description}
                </Text>
              </View>
              <View style={styles.switchColumn}>
                <ChannelSwitch
                  accessibilityLabel={`Email: ${notification.title}`}
                  value={preferences[notification.key].email}
                  color={PRIMARY}
                  disabled={loading || saving}
                  onValueChange={() => toggleChannel(notification.key, 'email')}
                />
              </View>
              <View style={styles.switchColumn}>
                <ChannelSwitch
                  accessibilityLabel={`Web: ${notification.title}`}
                  value={preferences[notification.key].web}
                  color={WEB_PINK}
                  disabled={loading || saving}
                  onValueChange={() => toggleChannel(notification.key, 'web')}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={saving || loading}
            onPress={savePreferences}
            accessibilityRole="button"
            style={[styles.saveButton, (saving || loading) && styles.disabled]}
          >
            <LinearGradient colors={[PRIMARY, '#9a2e52']} style={styles.saveGradient}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeading}>
            <IconShield size={24} color={PRIMARY} />
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>Seguridad de Cuenta</Text>
          </View>
          <View style={[styles.insetCard, { backgroundColor: colors.inset, borderColor: colors.border }]}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>Cambiar Contraseña</Text>
            <Text style={[styles.helper, styles.passwordDescription, { color: colors.muted }]}>
              Actualiza tu contraseña regularmente para mantener tu cuenta segura
            </Text>
            {!showPasswordForm ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setShowPasswordForm(true)}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Cambiar Contraseña</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.passwordForm}>
                <PasswordField
                  label="Contraseña Actual"
                  placeholder="Ingresa tu contraseña actual"
                  value={passwordForm.password_actual}
                  visible={Boolean(visiblePasswords.password_actual)}
                  colors={colors}
                  onChangeText={(value) => setPasswordField('password_actual', value)}
                  onToggle={() => setVisiblePasswords((current) => ({ ...current, password_actual: !current.password_actual }))}
                />
                <PasswordField
                  label="Nueva Contraseña"
                  placeholder="Mínimo 8 caracteres"
                  value={passwordForm.password_nueva}
                  visible={Boolean(visiblePasswords.password_nueva)}
                  colors={colors}
                  onChangeText={(value) => setPasswordField('password_nueva', value)}
                  onToggle={() => setVisiblePasswords((current) => ({ ...current, password_nueva: !current.password_nueva }))}
                />
                <Text style={[styles.passwordRequirements, { color: colors.muted }]}>
                  {PASSWORD_REQUIREMENTS}
                </Text>
                <PasswordField
                  label="Confirmar Nueva Contraseña"
                  placeholder="Confirma tu nueva contraseña"
                  value={passwordForm.password_confirmar}
                  visible={Boolean(visiblePasswords.password_confirmar)}
                  colors={colors}
                  onChangeText={(value) => setPasswordField('password_confirmar', value)}
                  onToggle={() => setVisiblePasswords((current) => ({ ...current, password_confirmar: !current.password_confirmar }))}
                />
                {passwordFeedback && (
                  <View
                    style={[
                      styles.passwordFeedback,
                      passwordFeedback.type === 'success'
                        ? (darkMode ? styles.passwordFeedbackSuccessDark : styles.passwordFeedbackSuccess)
                        : (darkMode ? styles.passwordFeedbackErrorDark : styles.passwordFeedbackError),
                    ]}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                  >
                    <Text
                      style={[
                        styles.passwordFeedbackText,
                        {
                          color: passwordFeedback.type === 'success'
                            ? (darkMode ? '#B5E3C2' : '#166534')
                            : (darkMode ? '#FFC2CB' : '#991b1b'),
                        },
                      ]}
                    >
                      {passwordFeedback.message}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, changingPassword && styles.disabled]}
                  onPress={submitPassword}
                  disabled={changingPassword}
                  accessibilityRole="button"
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Actualizar Contraseña</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowPasswordForm(false);
                    resetPasswordForm();
                  }}
                  disabled={changingPassword}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, styles.visualTitle, { color: colors.heading }]}>Preferencias Visuales</Text>
          <View style={[styles.insetCard, styles.visualRow, { backgroundColor: colors.inset, borderColor: colors.border }]}>
            <View style={styles.visualText}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Modo Oscuro</Text>
              <Text style={[styles.helper, { color: colors.muted }]}>
                Cambia el tema de la aplicacion a modo oscuro
              </Text>
            </View>
            <ChannelSwitch
              value={darkMode}
              onValueChange={toggleDarkMode}
              color="#e91e63"
              disabled={false}
              accessibilityLabel="Modo Oscuro"
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, styles.visualTitle, { color: colors.heading }]}>Información de la Cuenta</Text>
          <View style={styles.accountInfo}>
            <AccountInfo label="Rol" value="Usuario" colors={colors} />
            <AccountInfo label="Estado" value="Activo" colors={colors} />
            <AccountInfo label="ID de Usuario" value={`#${profile?.id_usuario || 'N/A'}`} colors={colors} />
          </View>
        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

function ChannelSwitch({ accessibilityLabel, value, color, disabled, onValueChange }) {
  return (
    <Pressable
      onPress={onValueChange}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.switchTrack, { backgroundColor: value ? color : '#d1d5db' }, disabled && styles.disabled]}
    >
      <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
    </Pressable>
  );
}

function ChannelHeading({ label, color, icon, textColor }) {
  return (
    <View style={styles.channelHeading}>
      <View style={[styles.channelIcon, { backgroundColor: color }]}>
        {icon === 'email' ? <IconMail size={14} color="#FFFFFF" /> : <IconGlobe size={14} color="#FFFFFF" />}
      </View>
      <Text style={[styles.channelLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function passwordValidationMessage(password) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'Agrega al menos una letra mayúscula.';
  if (!/[0-9]/.test(password)) return 'Agrega al menos un número.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Agrega al menos un carácter especial.';
  return '';
}

function PasswordField({ label, placeholder, value, visible, colors, onChangeText, onToggle }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.passwordInputWrap, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
        />
        <TouchableOpacity
          onPress={onToggle}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          {visible ? <IconEyeOff size={20} color={colors.muted} /> : <IconEye size={20} color={colors.muted} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AccountInfo({ label, value, colors }) {
  return (
    <View style={[styles.accountInfoItem, { backgroundColor: colors.inset, borderColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.heading }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageTitle: { flex: 1, fontSize: 21, fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  sectionHeadingText: { flex: 1 },
  sectionIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  helper: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingLeft: 17,
    paddingRight: 14,
    marginBottom: 10,
  },
  channelHeaderTitle: { fontSize: 12, fontWeight: '700', paddingRight: 4 },
  channelHeading: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  channelIcon: { width: 22, height: 22, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  channelLabel: { fontSize: 12, fontWeight: '700', color: '#2a2a2a' },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  notificationInfo: { flex: 2, paddingRight: 4 },
  notificationTitle: { fontSize: 15, fontWeight: '700' },
  notificationDescription: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  switchColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  switchTrack: { width: 38, height: 22, borderRadius: 11, padding: 2, justifyContent: 'center' },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: { alignSelf: 'flex-end' },
  saveButton: { marginTop: 12, borderRadius: 8, overflow: 'hidden' },
  saveGradient: { minHeight: 48, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.7 },
  insetCard: {
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
    borderRadius: 8,
    padding: 15,
  },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  passwordDescription: { marginBottom: 14 },
  passwordRequirements: { fontSize: 12, lineHeight: 18, marginTop: -7 },
  passwordFeedback: { borderWidth: 1, borderRadius: 6, padding: 10 },
  passwordFeedbackSuccess: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  passwordFeedbackError: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  passwordFeedbackSuccessDark: { backgroundColor: '#183123', borderColor: '#315b42' },
  passwordFeedbackErrorDark: { backgroundColor: '#3a2024', borderColor: '#6a3540' },
  passwordFeedbackText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  primaryButton: {
    minHeight: 44,
    borderRadius: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  passwordForm: { gap: 12 },
  field: { marginBottom: 3 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  passwordInputWrap: { minHeight: 46, borderWidth: 1, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, minHeight: 44, paddingHorizontal: 11, fontSize: 14 },
  eyeButton: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelButton: {
    minHeight: 44,
    borderRadius: 6,
    backgroundColor: '#666666',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualTitle: { marginBottom: 14 },
  visualRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  visualText: { flex: 1 },
  accountInfo: { gap: 10 },
  accountInfoItem: { borderWidth: 1, borderRadius: 8, padding: 14 },
  infoLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 },
  infoValue: { fontSize: 16, fontWeight: '500' },
});
