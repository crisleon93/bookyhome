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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getApiBaseUrl, getProfile, saveBannerColor, updateProfile, uploadBannerPhoto, uploadProfilePhoto } from '../services/api';
import { IconBook, IconPackage, IconStore, IconUser } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const GRAY = '#666';
const COLORS = ['#7A1E3A', '#1E3A7A', '#1E7A3A', '#7A6A1E', '#3A1E7A', '#2A2A2A'];

const resolveImage = (path) => {
  if (!path) return null;
  const value = String(path);
  return value.startsWith('http') ? value : `${getApiBaseUrl()}/${value.replace(/^\/+/, '')}`;
};

function StatCard({ Icon, label, value, color }) {
  return (
    <View style={styles.statCard}>
      <Icon size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminProfile({ stats = {}, solicitudes = [], onProfilePhotoChange, onProfileNameChange }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registeredAt, setRegisteredAt] = useState('');
  const [photo, setPhoto] = useState(null);
  const [banner, setBanner] = useState(null);
  const [bannerColor, setBannerColor] = useState(PRIMARY);

  const loadProfile = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await getProfile();
      const data = response.data || {};
      setName(data.nombre_usuario || '');
      setPhone(data.telefono || '');
      setEmail(data.correo_usuario || '');
      setRegisteredAt(data.fecha_registro || '');
      setPhoto(resolveImage(data.foto_perfil));
      setBanner(resolveImage(data.banner_perfil));
      setBannerColor(data.banner_perfil ? null : (data.banner_color || PRIMARY));
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo cargar el perfil del administrador.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Dato requerido', 'El nombre no puede quedar vacío.');
      return;
    }
    setSaving(true);
    try {
      const savedName = name.trim();
      await updateProfile({ nombre_usuario: savedName, telefono: phone.trim() });
      setName(savedName);
      onProfileNameChange?.(savedName);
      Alert.alert('Listo', 'El perfil se actualizó correctamente.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
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

      setUploading(type);
      const response = type === 'foto'
        ? await uploadProfilePhoto(formData)
        : await uploadBannerPhoto(formData);
      const imageUrl = resolveImage(response.data?.url || response.data?.[type === 'foto' ? 'foto_perfil' : 'banner_perfil']);
      if (!imageUrl) throw new Error('El servidor no devolvió la URL de la imagen.');
      if (type === 'foto') {
        setPhoto(imageUrl);
        onProfilePhotoChange?.(imageUrl);
      }
      else {
        setBanner(imageUrl);
        setBannerColor(null);
      }
      Alert.alert('Listo', type === 'foto' ? 'Foto de perfil actualizada.' : 'Banner actualizado.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || error.message || 'No se pudo subir la imagen.');
    } finally {
      setUploading('');
    }
  };

  const saveColor = async (color) => {
    try {
      await saveBannerColor(color);
      setBanner(null);
      setBannerColor(color);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar el color del banner.');
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View></SafeAreaView>;
  }

  const resolved = solicitudes.filter((item) => item.estado === 'Resuelto').length;
  const pending = solicitudes.filter((item) => ['Abierto', 'En revisión', 'En revision'].includes(item.estado)).length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} colors={[PRIMARY]} tintColor={PRIMARY} />}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Información personal</Text>
          <View style={styles.photoRow}>
            {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : (
              <View style={styles.avatarFallback}><IconUser size={28} color={PRIMARY} /></View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Foto de perfil</Text>
              <Text style={styles.hint}>Personaliza la cuenta de administración.</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage('foto')} disabled={!!uploading}>
                <Text style={styles.secondaryText}>{uploading === 'foto' ? 'Subiendo...' : 'Cambiar foto'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Banner del perfil</Text>
          {banner ? <Image source={{ uri: banner }} style={styles.banner} /> : <View style={[styles.banner, { backgroundColor: bannerColor || PRIMARY }]} />}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage('banner')} disabled={!!uploading}>
            <Text style={styles.secondaryText}>{uploading === 'banner' ? 'Subiendo...' : 'Subir banner'}</Text>
          </TouchableOpacity>
          <View style={styles.swatches}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                accessibilityRole="button"
                accessibilityLabel={`Usar color ${color} para el banner`}
                style={[styles.swatch, { backgroundColor: color }, bannerColor === color && styles.swatchSelected]}
                onPress={() => saveColor(color)}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Nombre completo</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre del administrador" />
          <Text style={styles.fieldLabel}>Correo electrónico</Text>
          <TextInput style={[styles.input, styles.readOnly]} value={email} editable={false} />
          <Text style={styles.fieldLabel}>Teléfono</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Número de contacto" />
          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar cambios</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Resumen de BookyHome</Text>
          <View style={styles.statsGrid}>
            <StatCard Icon={IconUser} label="Usuarios" value={stats.usuarios || 0} color={PRIMARY} />
            <StatCard Icon={IconBook} label="Libros" value={stats.libros || 0} color="#7E22CE" />
            <StatCard Icon={IconPackage} label="Órdenes" value={stats.ordenes || 0} color="#1D4ED8" />
            <StatCard Icon={IconStore} label="Tiendas" value={stats.tiendas || 0} color="#047857" />
          </View>
          <Text style={styles.meta}>Solicitudes resueltas: {resolved}</Text>
          <Text style={styles.meta}>Solicitudes pendientes: {pending}</Text>
          {registeredAt ? <Text style={styles.meta}>Miembro desde: {new Date(registeredAt).toLocaleDateString('es-CO')}</Text> : null}
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
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F3F4F6' },
  avatarFallback: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FDF2F4', alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { color: '#333', fontSize: 12, fontWeight: '800', marginBottom: 6, marginTop: 9 },
  hint: { color: GRAY, fontSize: 11, marginBottom: 8 },
  secondaryButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: PRIMARY, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  secondaryText: { color: PRIMARY, fontSize: 12, fontWeight: '800' },
  banner: { height: 115, width: '100%', borderRadius: 11, backgroundColor: PRIMARY, marginBottom: 9 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 8 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  swatchSelected: { borderColor: '#222', borderWidth: 3 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, color: '#222', fontSize: 13, backgroundColor: '#fff' },
  readOnly: { backgroundColor: '#F3F4F6', color: GRAY },
  saveButton: { minHeight: 44, backgroundColor: PRIMARY, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  saveText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statCard: { flexGrow: 1, flexBasis: '45%', borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, backgroundColor: '#FAFAFA' },
  statValue: { fontSize: 21, fontWeight: '900', marginTop: 7 },
  statLabel: { color: GRAY, fontSize: 11, fontWeight: '700', marginTop: 2 },
  meta: { color: GRAY, fontSize: 12, marginTop: 10 },
});
