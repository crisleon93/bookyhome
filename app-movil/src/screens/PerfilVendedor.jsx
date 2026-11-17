import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import {
  createDireccion, getDirecciones, getProfile, resolveImageUrl, saveBannerColor,
  updateDireccion, updatePreferences, updateProfile, uploadBannerPhoto, uploadProfilePhoto,
} from '../services/api';
import {
  IconCreditCard, IconMenu, IconPackage, IconStar, IconUser,
} from '../components/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import MetodosCobroVendedor from './MetodosCobroVendedor';
import SuscripcionesVendedor from './SuscripcionesVendedor';
import ImpulsosVendedor from './ImpulsosVendedor';

const PRIMARY = '#7A1E3A';
const BG = '#F8EEF1';
const WHITE = '#FFFFFF';
const BORDER = '#E5E0D8';
const MUTED = '#6B7280';
const DEFAULT_NOTIFICATION_PREFERENCES = {
  notificaciones_mensajes: { email: true, web: true },
  notificaciones_resenas: { email: true, web: true },
  notificaciones_ofertas: { email: true, web: false },
  notificaciones_pedidos: { email: true, web: true },
  notificaciones_entregas: { email: true, web: true },
  notificaciones_pagos: { email: true, web: true },
  notificaciones_sistema: { email: true, web: true },
};
const PROFILE_NOTIFICATION_ROWS = [
  { key: 'notificaciones_ofertas', label: 'Promociones' },
  { key: 'notificaciones_pedidos', label: 'Pedidos' },
  { key: 'notificaciones_sistema', label: 'Novedades' },
];
const SOLID_BANNERS = ['#7A1E3A', '#1E3A7A', '#1E7A3A', '#7A6A1E', '#3A1E7A', '#1E6A7A', '#2A2A2A', '#8B4513'];
const GRADIENT_BANNERS = [
  ['#7A1E3A', '#3A1E7A'],
  ['#1E3A7A', '#1E7A6A'],
  ['#7A6A1E', '#7A1E3A'],
  ['#2A2A2A', '#7A1E3A'],
  ['#0F2027', '#2C5364'],
  ['#373B44', '#4286F4'],
];
const PROFILE_TABS = [
  { key: 'perfil', label: 'Mi perfil', Icon: IconUser },
  { key: 'cobro', label: 'Métodos de cobro', Icon: IconCreditCard },
  { key: 'suscripciones', label: 'Suscripciones', Icon: IconPackage },
  { key: 'impulsos', label: 'Impulsos', Icon: IconStar },
];

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || error?.response?.data?.message || fallback;

export default function PerfilVendedor({ navigation }) {
  const styles = useThemedStyles(themeBaseStyles);
  const { darkMode } = useAppTheme();
  const { user, signOut } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [uploading, setUploading] = useState('');
  const [bannerEditorVisible, setBannerEditorVisible] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState(null);
  const [banner, setBanner] = useState(null);
  const [bannerColor, setBannerColor] = useState(PRIMARY);
  const [notificationPreferences, setNotificationPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const isWide = width >= 700;

  const storeName = useMemo(
    () => user?.nombre_tienda || `${name} ${surname}`.trim() || 'Tu perfil',
    [name, surname, user?.nombre_tienda],
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [profileResponse, addressResponse] = await Promise.all([getProfile(), getDirecciones()]);
      const profile = profileResponse.data || {};
      const nameParts = String(profile.nombre_usuario || '').trim().split(/\s+/).filter(Boolean);
      const addresses = Array.isArray(addressResponse.data) ? addressResponse.data : [];
      const defaultAddress = addresses.find((item) => item.es_principal) || addresses[0] || null;

      setName(nameParts.shift() || '');
      setSurname(nameParts.join(' '));
      setPhone(profile.telefono || '');
      setEmail(profile.correo_usuario || '');
      setPhoto(resolveImageUrl(profile.foto_perfil));
      setBanner(resolveImageUrl(profile.banner_perfil));
      setBannerColor(profile.banner_perfil ? null : (profile.banner_color || PRIMARY));
      setNotificationPreferences(Object.fromEntries(
        Object.entries(DEFAULT_NOTIFICATION_PREFERENCES).map(([key, defaults]) => {
          const saved = profile.preferencias?.[key] || {};
          return [key, {
            email: typeof saved.email === 'boolean' ? saved.email : defaults.email,
            web: typeof saved.web === 'boolean' ? saved.web : defaults.web,
          }];
        }),
      ));
      setPrimaryAddress(defaultAddress);
      setCity(defaultAddress?.ciudad || '');
      setAddress(defaultAddress?.direccion || '');
    } catch (error) {
      Alert.alert('Perfil', getErrorMessage(error, 'No se pudo cargar tu perfil.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const pickImage = async (type) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'banner' ? [16, 5] : [1, 1],
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    setUploading(type);
    try {
      const formData = new FormData();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      if (Platform.OS === 'web') {
        const file = asset.file || await fetch(asset.uri).then((response) => {
          if (!response.ok) throw new Error('No se pudo leer la imagen seleccionada.');
          return response.blob();
        });
        formData.append('file', file, `${type}.${extension}`);
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: `${type}.${extension}`,
          type: asset.mimeType || `image/${extension}`,
        });
      }

      const response = type === 'banner'
        ? await uploadBannerPhoto(formData)
        : await uploadProfilePhoto(formData);
      const imageUrl = resolveImageUrl(response.data?.url);
      if (!imageUrl) throw new Error('El servidor no devolvió la dirección de la imagen.');
      if (type === 'banner') {
        setBanner(imageUrl);
        setBannerColor(null);
      } else {
        setPhoto(imageUrl);
      }
      setBannerEditorVisible(false);
    } catch (error) {
      Alert.alert('Perfil', getErrorMessage(error, `No se pudo actualizar ${type === 'banner' ? 'el banner' : 'la foto de perfil'}.`));
    } finally {
      setUploading('');
    }
  };

  const saveProfileBannerColor = async (color) => {
    setUploading('banner');
    try {
      await saveBannerColor(color);
      setBannerColor(color);
      setBanner(null);
      setBannerEditorVisible(false);
    } catch (error) {
      Alert.alert('Perfil', getErrorMessage(error, 'No se pudo guardar el color del banner.'));
    } finally {
      setUploading('');
    }
  };

  const saveProfile = async () => {
    const normalizedName = name.trim();
    const normalizedSurname = surname.trim();
    const normalizedPhone = phone.trim();
    const normalizedCity = city.trim();
    const normalizedAddress = address.trim();

    if (!normalizedName && !normalizedSurname) {
      Alert.alert('Datos incompletos', 'Escribe al menos un nombre o apellido.');
      return;
    }

    if (normalizedCity && !normalizedAddress) {
      Alert.alert('Datos incompletos', 'Escribe la dirección completa para guardar la ciudad del perfil.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        nombre_usuario: `${normalizedName} ${normalizedSurname}`.trim(),
        telefono: normalizedPhone,
      });

      if (primaryAddress || normalizedAddress) {
        const addressPayload = {
          alias_direccion: primaryAddress?.alias_direccion || 'Dirección principal',
          direccion: normalizedAddress,
          ciudad: normalizedCity,
          departamento: primaryAddress?.departamento || '',
          codigo_postal: primaryAddress?.codigo_postal || '',
          es_principal: true,
        };

        if (primaryAddress?.id_direccion) {
          await updateDireccion(primaryAddress.id_direccion, addressPayload);
        } else {
          const response = await createDireccion(addressPayload);
          setPrimaryAddress(response.data);
        }
      }

      Alert.alert('Perfil', 'Tus datos se guardaron correctamente.');
    } catch (error) {
      Alert.alert('Perfil', getErrorMessage(error, 'No se pudieron guardar los cambios.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleNotificationPreference = (key) => {
    const enabled = !Boolean(
      notificationPreferences[key]?.email || notificationPreferences[key]?.web,
    );
    setNotificationPreferences((current) => ({
      ...current,
      [key]: { email: enabled, web: enabled },
    }));
  };

  const saveNotificationPreferences = async () => {
    setSavingPreferences(true);
    try {
      await updatePreferences(notificationPreferences);
      Alert.alert('Preferencias', 'Tus preferencias de notificaciones se guardaron correctamente.');
    } catch (error) {
      Alert.alert('Preferencias', getErrorMessage(error, 'No se pudieron guardar tus preferencias.'));
    } finally {
      setSavingPreferences(false);
    }
  };

  const bannerGradient = useMemo(() => {
    if (!bannerColor?.startsWith('linear-gradient')) return null;
    return bannerColor.match(/#[0-9a-fA-F]{3,8}/g)?.slice(0, 2) || null;
  }, [bannerColor]);

  const renderField = (label, value, onChangeText, options = {}) => (
    <View style={[styles.field, isWide && !options.fullWidth && styles.fieldHalf]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={options.editable !== false}
        placeholder={options.placeholder || label}
        placeholderTextColor="#9CA3AF"
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize={options.autoCapitalize || 'sentences'}
        style={[styles.input, options.editable === false && styles.inputDisabled]}
        accessibilityLabel={label}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Cargando tu perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={[styles.pageTitleCard, darkMode && styles.darkPageTitleCard]}>
          <TouchableOpacity
            style={[styles.menuButton, darkMode && styles.darkMenuButton]}
            onPress={() => setSidebarVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú del vendedor"
          >
            <IconMenu size={21} color={darkMode ? WHITE : PRIMARY} />
          </TouchableOpacity>
          <View style={styles.pageTitleCopy}>
            <Text style={[styles.pageTitle, darkMode && styles.darkPageTitle]}>Mi Perfil</Text>
            <Text style={[styles.pageSubtitle, darkMode && styles.darkPageSubtitle]}>Actualiza tus datos y personaliza tu perfil.</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          style={styles.tabsScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {PROFILE_TABS.map((tab) => {
            const TabIcon = tab.Icon;
            const active = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <TabIcon size={17} color={active ? PRIMARY : MUTED} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeTab === 'perfil' ? (
          <ScrollView style={styles.profileScroll} contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Personal</Text>

          <View style={styles.banner}>
            {banner ? (
              <Image source={{ uri: banner }} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              bannerGradient?.length === 2
                ? <LinearGradient colors={bannerGradient} style={styles.bannerColor} />
                : <View style={[styles.bannerColor, { backgroundColor: bannerColor || PRIMARY }]} />
            )}
            <TouchableOpacity
              style={styles.editBannerButton}
              onPress={() => setBannerEditorVisible((visible) => !visible)}
              accessibilityRole="button"
            >
              <Text style={styles.editBannerText}>✏️ Editar banner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => pickImage('foto')}
              disabled={uploading === 'foto'}
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase() || 'V'}</Text>
              )}
              {uploading === 'foto' && (
                <View style={styles.avatarLoading}><ActivityIndicator color={PRIMARY} /></View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.profileNameBlock}>
            <Text style={styles.storeName}>{storeName}</Text>
            <Text style={styles.profileRole}>Perfil de vendedor</Text>
          </View>

          {bannerEditorVisible && (
            <View style={styles.bannerEditor}>
              <TouchableOpacity
                style={styles.chooseImageButton}
                onPress={() => pickImage('banner')}
                disabled={uploading === 'banner'}
              >
                {uploading === 'banner'
                  ? <ActivityIndicator color={WHITE} />
                  : <Text style={styles.chooseImageText}>Elegir imagen de banner</Text>}
              </TouchableOpacity>
              <Text style={styles.paletteLabel}>Colores sólidos</Text>
              <View style={styles.swatches}>
                {SOLID_BANNERS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.solidSwatch, { backgroundColor: color }, bannerColor === color && styles.swatchSelected]}
                    onPress={() => saveProfileBannerColor(color)}
                    accessibilityLabel={`Usar banner color ${color}`}
                  />
                ))}
              </View>
              <Text style={styles.paletteLabel}>Gradientes</Text>
              <View style={styles.swatches}>
                {GRADIENT_BANNERS.map(([first, second]) => (
                  <TouchableOpacity
                    key={`${first}-${second}`}
                    style={[
                      styles.gradientSwatch,
                      { backgroundColor: first },
                      bannerColor === `linear-gradient(135deg, ${first}, ${second})` && styles.swatchSelected,
                    ]}
                    onPress={() => saveProfileBannerColor(`linear-gradient(135deg, ${first}, ${second})`)}
                    accessibilityLabel="Usar banner con gradiente"
                  >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: second, opacity: 0.48 }]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Datos de contacto</Text>
            <View style={[styles.fieldsGrid, isWide && styles.fieldsGridWide]}>
              {renderField('Nombre', name, setName)}
              {renderField('Apellidos', surname, setSurname)}
              {renderField('Teléfono', phone, setPhone, { keyboardType: 'phone-pad' })}
              {renderField('Ciudad', city, setCity)}
              {renderField('Dirección', address, setAddress, { fullWidth: true })}
              {renderField('Correo electrónico', email, undefined, {
                editable: false,
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                fullWidth: true,
              })}
            </View>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={saveProfile}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving
                ? <ActivityIndicator color={WHITE} />
                : <Text style={styles.saveButtonText}>Guardar cambios</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.notificationCard}>
            <Text style={styles.notificationHeading}>Preferencias de notificaciones</Text>
            {PROFILE_NOTIFICATION_ROWS.map(({ key, label }) => {
              const enabled = Boolean(
                notificationPreferences[key]?.email || notificationPreferences[key]?.web,
              );
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.notificationRow}
                  onPress={() => toggleNotificationPreference(key)}
                  disabled={savingPreferences}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: enabled }}
                >
                  <Text style={styles.notificationLabel}>{label}</Text>
                  <View style={[styles.notificationStatus, enabled && styles.notificationStatusEnabled]}>
                    <Text style={[styles.notificationStatusText, enabled && styles.notificationStatusTextEnabled]}>
                      {enabled ? 'Activado' : 'Desactivado'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.saveButton, savingPreferences && styles.buttonDisabled]}
              onPress={saveNotificationPreferences}
              disabled={savingPreferences}
              accessibilityRole="button"
            >
              {savingPreferences
                ? <ActivityIndicator color={WHITE} />
                : <Text style={styles.saveButtonText}>Guardar cambios</Text>}
            </TouchableOpacity>
          </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.sectionContent}>
            {activeTab === 'cobro' && (
              <MetodosCobroVendedor navigation={navigation} embedded />
            )}
            {activeTab === 'suscripciones' && (
              <SuscripcionesVendedor
                navigation={navigation}
                embedded
                onNavigateTab={setActiveTab}
              />
            )}
            {activeTab === 'impulsos' && (
              <ImpulsosVendedor
                navigation={navigation}
                embedded
                onNavigateTab={setActiveTab}
              />
            )}
          </View>
        )}
      </View>

      <SidebarVendedor
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />
    </SafeAreaView>
  );
}

const themeBaseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  page: { flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 },
  profileScroll: { flex: 1 },
  profileContent: { paddingBottom: 28 },
  sectionContent: { flex: 1, minHeight: 0 },
  tabsScroll: { flexGrow: 0, flexShrink: 0, height: 55, marginTop: 12, marginBottom: 12 },
  pageTitleCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    borderRadius: 14,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#F0E7EA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },
  darkPageTitleCard: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  menuButton: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F7E8EC', alignItems: 'center', justifyContent: 'center' },
  darkMenuButton: { backgroundColor: 'rgba(255,255,255,0.15)' },
  pageTitleCopy: { flex: 1 },
  pageTitle: { color: '#1F2937', fontSize: 20, fontWeight: '900' },
  darkPageTitle: { color: WHITE },
  pageSubtitle: { color: MUTED, fontSize: 11, marginTop: 3 },
  darkPageSubtitle: { color: 'rgba(255,255,255,0.8)' },
  tabsRow: { minHeight: 55, alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: '#E8DDE1' },
  tabButton: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: PRIMARY },
  tabLabel: { color: MUTED, fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: PRIMARY },
  card: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#F0E7EA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { color: PRIMARY, fontSize: 18, fontWeight: '800', marginBottom: 13 },
  banner: { height: 150, borderRadius: 13, backgroundColor: PRIMARY, borderWidth: 1, borderColor: BORDER, position: 'relative', marginBottom: 0 },
  bannerImage: { width: '100%', height: '100%', borderRadius: 12 },
  bannerColor: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  editBannerButton: { position: 'absolute', right: 10, bottom: 10, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.68)' },
  editBannerText: { color: WHITE, fontSize: 11, fontWeight: '700' },
  avatarButton: { position: 'absolute', left: 18, bottom: -34, width: 82, height: 82, borderRadius: 41, backgroundColor: '#E5E0D8', borderWidth: 4, borderColor: WHITE, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', elevation: 3 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 41 },
  avatarInitial: { color: PRIMARY, fontSize: 29, fontWeight: '900' },
  avatarLoading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  profileNameBlock: { paddingLeft: 110, minHeight: 78, justifyContent: 'center', marginBottom: 11 },
  storeName: { color: '#1F2937', fontSize: 15, fontWeight: '900' },
  profileRole: { color: MUTED, fontSize: 11, marginTop: 3 },
  bannerEditor: { padding: 12, marginBottom: 14, borderRadius: 11, borderWidth: 1, borderColor: BORDER, backgroundColor: '#FAF8F6' },
  chooseImageButton: { alignSelf: 'flex-start', minHeight: 38, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 13, backgroundColor: PRIMARY, marginBottom: 12 },
  chooseImageText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  paletteLabel: { color: '#374151', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 4 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 9 },
  solidSwatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: WHITE },
  gradientSwatch: { width: 42, height: 30, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: WHITE },
  swatchSelected: { borderColor: '#111827', borderWidth: 3 },
  contactCard: { borderRadius: 13, borderWidth: 1, borderColor: BORDER, padding: 13, backgroundColor: WHITE },
  contactTitle: { color: PRIMARY, fontSize: 16, fontWeight: '800', marginBottom: 11 },
  notificationCard: { marginTop: 14, borderRadius: 13, borderWidth: 1, borderColor: BORDER, padding: 16, backgroundColor: WHITE },
  notificationHeading: { color: PRIMARY, fontSize: 17, fontWeight: '800', marginBottom: 8, textTransform: 'capitalize' },
  notificationRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER },
  notificationLabel: { color: '#2A2A2A', fontSize: 15 },
  notificationStatus: { minWidth: 104, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#EEEEEE' },
  notificationStatusEnabled: { backgroundColor: PRIMARY },
  notificationStatusText: { color: '#555', fontSize: 13, fontWeight: '700' },
  notificationStatusTextEnabled: { color: WHITE },
  fieldsGrid: { gap: 10 },
  fieldsGridWide: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  field: { width: '100%' },
  fieldHalf: { width: '48%', flexGrow: 1 },
  fieldLabel: { color: '#4B5563', fontSize: 12, fontWeight: '700', marginBottom: 5 },
  input: { minHeight: 43, borderRadius: 9, borderWidth: 1, borderColor: BORDER, backgroundColor: '#FAFAFA', paddingHorizontal: 11, color: '#1F2937', fontSize: 13 },
  inputDisabled: { backgroundColor: '#F0F0F0', color: '#888' },
  saveButton: { minHeight: 45, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderRadius: 9, backgroundColor: PRIMARY, paddingHorizontal: 14 },
  buttonDisabled: { opacity: 0.65 },
  saveButtonText: { color: WHITE, fontSize: 13, fontWeight: '800' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: MUTED, fontSize: 13 },
});
const styles = themeBaseStyles;
