import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import { getApiBaseUrl, getProfile, saveBannerColor, updateProfile, uploadBannerPhoto, uploadProfilePhoto } from '../services/api';
import { IconAlertTriangle, IconBook, IconCheck, IconPackage, IconSettings, IconStore, IconTool, IconUser, IconUsers } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const GRAY = '#666';
const COLORS = ['#7A1E3A', '#1E3A7A', '#1E7A3A', '#7A6A1E', '#3A1E7A', '#1E6A7A', '#2A2A2A', '#8B4513'];
const GRADIENTS = [
  ['#7A1E3A', '#3A1E7A'],
  ['#1E3A7A', '#1E7A6A'],
  ['#7A6A1E', '#7A1E3A'],
  ['#2A2A2A', '#7A1E3A'],
  ['#0f2027', '#2c5364'],
  ['#373B44', '#4286f4'],
  ['#834d9b', '#d04ed6'],
  ['#f093fb', '#f5576c'],
];

const resolveImage = (path) => {
  if (!path) return null;
  const value = String(path);
  return /^(https?:|file:|blob:|data:)/i.test(value)
    ? value
    : `${getApiBaseUrl()}/${value.replace(/^\/+/, '')}`;
};

function StatCard({ Icon, label, value, color, darkMode }) {
  return (
    <View style={[styles.statCard, darkMode && styles.statCardDark]}>
      <Icon size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>{label}</Text>
    </View>
  );
}

export default function AdminProfile({
  stats = {},
  solicitudes = [],
  onProfilePhotoChange,
  onProfileNameChange,
  onProfileBannerChange,
}) {
  const { darkMode, setDarkMode, colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registeredAt, setRegisteredAt] = useState('');
  const [photo, setPhoto] = useState(null);
  const [banner, setBanner] = useState(null);
  const [bannerColor, setBannerColor] = useState(PRIMARY);
  const [pendingPhotoAsset, setPendingPhotoAsset] = useState(null);
  const [pendingBannerAsset, setPendingBannerAsset] = useState(null);
  const [pendingBannerColor, setPendingBannerColor] = useState(null);
  const [bannerEditorOpen, setBannerEditorOpen] = useState(false);
  const [customBannerColor, setCustomBannerColor] = useState(PRIMARY);

  const loadProfile = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await getProfile();
      const data = response.data || {};
      const nameParts = (data.nombre_usuario || '').trim().split(/\s+/);
      setFirstName(nameParts[0] || '');
      setSurname(nameParts.slice(1).join(' '));
      setPhone(data.telefono || '');
      setEmail(data.correo_usuario || '');
      setRegisteredAt(data.fecha_registro || '');
      setPhoto(resolveImage(data.foto_perfil));
      setBanner(resolveImage(data.banner_perfil));
      setBannerColor(data.banner_perfil ? null : (data.banner_color || PRIMARY));
      setPendingPhotoAsset(null);
      setPendingBannerAsset(null);
      setPendingBannerColor(null);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo cargar el perfil del administrador.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const save = async () => {
    const fullName = `${firstName.trim()} ${surname.trim()}`.trim();
    if (!firstName.trim()) {
      Alert.alert('Dato requerido', 'El nombre no puede quedar vacío.');
      return;
    }
    setSaving(true);
    let profileSaved = false;
    try {
      const savedName = fullName;
      await updateProfile({ nombre_usuario: savedName, telefono: phone.trim() });
      profileSaved = true;
      setFirstName(firstName.trim());
      setSurname(surname.trim());
      onProfileNameChange?.(savedName);

      if (pendingPhotoAsset) {
        setUploading('foto');
        const response = await uploadProfilePhoto(await createImageFormData(pendingPhotoAsset, 'foto'));
        const imageUrl = resolveImage(response.data?.url || response.data?.foto_perfil);
        if (!imageUrl) throw new Error('El servidor no devolvió la URL de la foto.');
        setPhoto(imageUrl);
        setPendingPhotoAsset(null);
        onProfilePhotoChange?.(imageUrl);
      }

      if (pendingBannerAsset) {
        setUploading('banner');
        const response = await uploadBannerPhoto(await createImageFormData(pendingBannerAsset, 'banner'));
        const imageUrl = resolveImage(response.data?.url || response.data?.banner_perfil);
        if (!imageUrl) throw new Error('El servidor no devolvió la URL del banner.');
        setBanner(imageUrl);
        setBannerColor(null);
        setPendingBannerAsset(null);
        setPendingBannerColor(null);
        onProfileBannerChange?.(imageUrl, null);
      } else if (pendingBannerColor) {
        await saveBannerColor(pendingBannerColor);
        setBanner(null);
        setBannerColor(pendingBannerColor);
        setPendingBannerColor(null);
        onProfileBannerChange?.(null, pendingBannerColor);
      }

      Alert.alert('Listo', 'El perfil se actualizó correctamente.');
    } catch (error) {
      Alert.alert(
        'Error',
        profileSaved
          ? `Los datos personales se guardaron, pero no se completaron todos los cambios. ${error.response?.data?.detail || error.message || 'Inténtalo de nuevo.'}`
          : error.response?.data?.detail || error.message || 'No se pudieron guardar los cambios. Inténtalo de nuevo.'
      );
    } finally {
      setUploading('');
      setSaving(false);
    }
  };

  const createImageFormData = async (asset, type) => {
    const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const file = asset.file || await fetch(asset.uri).then((response) => response.blob());
      formData.append('file', file, `${type}.${extension}`);
    } else {
      formData.append('file', {
        uri: asset.uri,
        name: `${type}.${extension}`,
        type: asset.mimeType || `image/${extension}`,
      });
    }
    return formData;
  };

  const pickImage = async (type) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Permite el acceso a la galería para seleccionar una imagen.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'foto' ? [1, 1] : [16, 9],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (type === 'foto') {
        setPendingPhotoAsset(asset);
        setPhoto(asset.uri);
      } else {
        setPendingBannerAsset(asset);
        setPendingBannerColor(null);
        setBanner(asset.uri);
        setBannerColor(null);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message || 'No se pudo subir la imagen.');
    }
  };

  const selectBannerColor = (color) => {
    setPendingBannerAsset(null);
    setPendingBannerColor(color);
    setBanner(null);
    setBannerColor(color);
    setBannerEditorOpen(false);
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View></SafeAreaView>;
  }

  const resolved = solicitudes.filter((item) => item.estado === 'Resuelto').length;
  const pending = solicitudes.filter((item) => ['Abierto', 'En revisión', 'En revision'].includes(item.estado)).length;
  const requestManagement = [
    { Icon: IconAlertTriangle, label: 'Reclamos recibidos', value: solicitudes.filter((item) => item.tipo_solicitud === 'Reclamo' || item.tipo_solicitud === 'reclamo').length, color: '#EA580C' },
    { Icon: IconTool, label: 'Tickets de soporte', value: solicitudes.filter((item) => item.tipo_solicitud !== 'Reclamo' && item.tipo_solicitud !== 'reclamo').length, color: '#3B82F6' },
    { Icon: IconCheck, label: 'Resueltos', value: resolved, color: '#16A34A' },
    { Icon: IconSettings, label: 'Pendientes', value: pending, color: PRIMARY },
  ];
  const platformStats = [
    { Icon: IconUsers, label: 'Usuarios registrados', value: stats.usuarios || 0 },
    { Icon: IconBook, label: 'Libros publicados', value: stats.libros || 0 },
    { Icon: IconPackage, label: 'Órdenes totales', value: stats.ordenes || 0 },
    { Icon: IconStore, label: 'Tiendas activas', value: stats.tiendas || 0 },
  ];
  const memberSince = registeredAt
    ? new Date(registeredAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const selectedGradient = typeof bannerColor === 'string' && bannerColor.startsWith('linear-gradient')
    ? GRADIENTS.find((gradient) => bannerColor.includes(gradient[0]) && bannerColor.includes(gradient[1])) || GRADIENTS[0]
    : null;
  const displayName = `${firstName} ${surname}`.trim() || 'Administrador';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.page }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} colors={[PRIMARY]} tintColor={PRIMARY} />}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, darkMode && styles.titleDark]}>Información personal</Text>
          <View style={styles.photoRow}>
            {photo
              ? <Image source={{ uri: photo }} style={styles.avatar} />
              : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase() || 'A'}</Text></View>}
            <View style={{ flex: 1 }}>
              <Text style={[styles.photoTitle, { color: colors.text }]}>Foto de perfil</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>Sube una foto para personalizar tu perfil.</Text>
              <TouchableOpacity style={[styles.secondaryButton, darkMode && styles.secondaryButtonDark]} onPress={() => pickImage('foto')} disabled={!!uploading}>
                <Text style={[styles.secondaryText, darkMode && styles.secondaryTextDark]}>{uploading === 'foto' ? 'Subiendo...' : pendingPhotoAsset ? 'Cambiar foto seleccionada' : 'Cambiar foto'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionDivider, { borderColor: colors.border }]} />
          <View style={styles.bannerHeading}>
            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 0 }]}>Banner de perfil</Text>
            <TouchableOpacity style={[styles.secondaryButton, darkMode && styles.secondaryButtonDark]} onPress={() => setBannerEditorOpen((open) => !open)}>
              <Text style={[styles.secondaryText, darkMode && styles.secondaryTextDark]}>{bannerEditorOpen ? 'Cerrar editor' : 'Editar banner'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.banner}>
            {banner ? (
              <Image source={{ uri: banner }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : selectedGradient ? (
              <LinearGradient colors={selectedGradient} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: bannerColor || PRIMARY }]} />
            )}
          </View>
          {bannerEditorOpen && (
            <View style={[styles.bannerEditor, { backgroundColor: colors.inset, borderColor: colors.border }]}>
              <Text style={[styles.editorLabel, { color: colors.text }]}>Subir imagen</Text>
              <TouchableOpacity style={styles.editorButton} onPress={() => pickImage('banner')} disabled={!!uploading}>
                <Text style={styles.editorButtonText}>{uploading === 'banner' ? 'Subiendo...' : pendingBannerAsset ? 'Cambiar imagen seleccionada' : 'Elegir imagen'}</Text>
              </TouchableOpacity>
              <Text style={[styles.editorLabel, { color: colors.text }]}>Colores sólidos</Text>
              <View style={styles.swatches}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar color ${color} para el banner`}
                    style={[styles.swatch, { backgroundColor: color }, bannerColor === color && styles.swatchSelected]}
                    onPress={() => selectBannerColor(color)}
                  />
                ))}
              </View>
              <Text style={[styles.editorLabel, { color: colors.text }]}>Gradientes</Text>
              <View style={styles.swatches}>
                {GRADIENTS.map((gradient) => {
                  const cssGradient = `linear-gradient(135deg, ${gradient.join(', ')})`;
                  const selected = bannerColor === cssGradient;
                  return (
                    <TouchableOpacity
                      key={cssGradient}
                      accessibilityRole="button"
                      accessibilityLabel="Usar gradiente para el banner"
                      style={[styles.gradientSwatch, selected && styles.swatchSelected]}
                      onPress={() => selectBannerColor(cssGradient)}
                    >
                      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.editorLabel, { color: colors.text }]}>Color personalizado</Text>
              <View style={styles.customColorRow}>
                <TextInput
                  style={[styles.input, styles.customColorInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  value={customBannerColor}
                  onChangeText={setCustomBannerColor}
                  autoCapitalize="none"
                  placeholder="#7A1E3A"
                />
                <TouchableOpacity
                  style={[styles.editorButton, styles.applyColorButton]}
                  onPress={() => {
                    if (!/^#[0-9A-Fa-f]{6}$/.test(customBannerColor)) {
                      Alert.alert('Color inválido', 'Escribe un color hexadecimal válido, por ejemplo #7A1E3A.');
                      return;
                    }
                    selectBannerColor(customBannerColor);
                  }}
                >
                  <Text style={styles.editorButtonText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.fieldLabel, { color: colors.text }]}>Nombres</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Nombres"
            placeholderTextColor={colors.muted}
          />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Apellidos</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={surname}
            onChangeText={setSurname}
            placeholder="Apellidos"
            placeholderTextColor={colors.muted}
          />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Correo electrónico</Text>
          <TextInput style={[styles.input, styles.readOnly, { backgroundColor: colors.inset, color: colors.muted, borderColor: colors.border }]} value={email} editable={false} />
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Celular</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Número de contacto"
            placeholderTextColor={colors.muted}
          />
          {(pendingPhotoAsset || pendingBannerAsset || pendingBannerColor) && (
            <Text style={[styles.hint, { color: colors.muted }]}>Los cambios de foto y banner se aplicarán al guardar el perfil.</Text>
          )}
          <TouchableOpacity style={[styles.saveButton, (saving || !!uploading) && styles.disabled]} onPress={save} disabled={saving || !!uploading}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar cambios</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.accountCard, { backgroundColor: darkMode ? '#2A1A24' : '#FDF2F6', borderColor: PRIMARY }]}>
          <View style={styles.accountAvatarWrap}>
            {photo ? <Image source={{ uri: photo }} style={styles.accountAvatar} /> : (
              <View style={styles.accountAvatarFallback}><Text style={styles.accountAvatarInitial}>{firstName.charAt(0).toUpperCase() || 'A'}</Text></View>
            )}
          </View>
          <Text style={styles.accountRole}>ADMINISTRADOR</Text>
          <Text style={[styles.accountName, { color: darkMode ? '#F3D6E0' : PRIMARY }]}>{displayName}</Text>
          <Text style={[styles.accountCaption, { color: colors.muted }]}>Administrador BookyHome</Text>
          {memberSince ? <Text style={[styles.accountCaption, { color: colors.muted }]}>Miembro desde {memberSince}</Text> : null}
          <View style={styles.accessBadge}><Text style={styles.accessBadgeText}>Acceso total a la plataforma</Text></View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, darkMode && styles.titleDark]}>Estadísticas de la Plataforma</Text>
          <View style={styles.statsGrid}>
            {platformStats.map(({ Icon, label, value }) => (
              <StatCard key={label} Icon={Icon} label={label} value={value} color={PRIMARY} darkMode={darkMode} />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, darkMode && styles.titleDark]}>Gestión de Solicitudes</Text>
          <Text style={[styles.sectionHint, { color: colors.muted }]}>Resumen de quejas, reclamos y tickets de soporte de la comunidad.</Text>
          <View style={styles.statsGrid}>
            {requestManagement.map(({ Icon, label, value, color }) => (
              <StatCard key={label} Icon={Icon} label={label} value={value} color={color} darkMode={darkMode} />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, darkMode && styles.titleDark]}>Preferencias Visuales</Text>
          <View style={[styles.themeRow, { backgroundColor: colors.inset, borderLeftColor: PRIMARY }]}>
            <View style={styles.themeText}>
              <Text style={[styles.themeTitle, { color: colors.text }]}>Modo Oscuro</Text>
              <Text style={[styles.hint, { color: colors.muted, marginBottom: 0 }]}>Cambia el tema de la aplicación.</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#C8C8C8', true: PRIMARY }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Activar modo oscuro"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 14, paddingBottom: 30, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 17 },
  title: { color: PRIMARY, fontSize: 18, fontWeight: '900', marginBottom: 14 },
  titleDark: { color: '#E05A7A' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F3F4F6' },
  avatarFallback: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FDF2F4', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: PRIMARY, fontSize: 28, fontWeight: '800' },
  photoTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  sectionDivider: { borderBottomWidth: 1, marginBottom: 6 },
  bannerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fieldLabel: { color: '#333', fontSize: 12, fontWeight: '800', marginBottom: 6, marginTop: 9 },
  hint: { color: GRAY, fontSize: 11, marginBottom: 8 },
  secondaryButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: PRIMARY, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  secondaryButtonDark: { borderColor: '#E05A7A' },
  secondaryText: { color: PRIMARY, fontSize: 12, fontWeight: '800' },
  secondaryTextDark: { color: '#E05A7A' },
  banner: { height: 82, width: '100%', borderRadius: 11, backgroundColor: PRIMARY, marginBottom: 10, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: BORDER },
  bannerEditor: { borderWidth: 1, borderRadius: 10, padding: 11, marginBottom: 10 },
  editorLabel: { fontSize: 11, fontWeight: '800', marginTop: 5, marginBottom: 8 },
  editorButton: { alignSelf: 'flex-start', backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 9 },
  editorButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 8 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  gradientSwatch: { width: 31, height: 31, borderRadius: 8, borderWidth: 2, borderColor: '#fff', overflow: 'hidden' },
  swatchSelected: { borderColor: '#222', borderWidth: 3 },
  customColorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customColorInput: { flex: 1 },
  applyColorButton: { marginBottom: 0 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, color: '#222', fontSize: 13, backgroundColor: '#fff' },
  readOnly: { backgroundColor: '#F3F4F6', color: GRAY },
  saveButton: { minHeight: 44, backgroundColor: PRIMARY, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  saveText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.6 },
  accountCard: { alignItems: 'center', backgroundColor: '#FDF2F6', borderRadius: 16, borderWidth: 2, padding: 20, elevation: 2 },
  accountAvatarWrap: { width: 86, height: 86, borderRadius: 43, borderWidth: 3, borderColor: '#fff', backgroundColor: PRIMARY, marginBottom: 11, overflow: 'hidden', elevation: 3 },
  accountAvatar: { width: '100%', height: '100%' },
  accountAvatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  accountAvatarInitial: { color: '#fff', fontSize: 34, fontWeight: '900' },
  accountRole: { color: PRIMARY, fontSize: 18, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  accountName: { fontSize: 15, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  accountCaption: { fontSize: 11, marginBottom: 3, textAlign: 'center' },
  accessBadge: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECDCE3', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7, marginTop: 9 },
  accessBadgeText: { color: PRIMARY, fontSize: 11, fontWeight: '800' },
  sectionHint: { fontSize: 12, lineHeight: 18, marginTop: -7, marginBottom: 12 },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderLeftWidth: 4, borderRadius: 9, padding: 13 },
  themeText: { flex: 1 },
  themeTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statCard: { flexGrow: 1, flexBasis: '45%', borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, backgroundColor: '#FAFAFA' },
  statCardDark: { backgroundColor: '#252525', borderColor: '#3A3A3A' },
  statValue: { fontSize: 21, fontWeight: '900', marginTop: 7 },
  statLabel: { color: GRAY, fontSize: 11, fontWeight: '700', marginTop: 2 },
  statLabelDark: { color: '#C8C8C8' },
  meta: { color: GRAY, fontSize: 12, marginTop: 10 },
});
