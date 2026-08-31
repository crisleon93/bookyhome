import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  getApiBaseUrl,
  getProfile,
  updateProfile,
  updatePreferences,
  getEstadisticasUsuario,
  uploadProfilePhoto,
  uploadBannerPhoto,
  saveBannerColor,
} from '../services/api';
import { IconBook, IconStar, IconUser } from '../components/Icons';
import { LinearGradient } from 'expo-linear-gradient';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notificationsPromotions, setNotificationsPromotions] = useState(true);
  const [notificationsOrders, setNotificationsOrders] = useState(true);
  const [notificationsNews, setNotificationsNews] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [bannerColor, setBannerColor] = useState('#7A1E3A');
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [categoriasFavoritas, setCategoriasFavoritas] = useState([]);
  const [nivelFidelizacion, setNivelFidelizacion] = useState(null);

  const resolveImageUrl = (path) => {
    if (!path) return null;
    return `${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`;
  };

  const getSiguienteNivel = (nivelActual) => {
    const niveles = ['Bronce', 'Plata', 'Oro', 'Platino'];
    const index = niveles.indexOf(nivelActual);
    return index >= 0 && index < niveles.length - 1 ? niveles[index + 1] : null;
  };

  const getNivelColor = (nivel) => ({
    Bronce: { backgroundColor: '#FFF8E1', borderColor: '#CD7F32', textColor: '#CD7F32' },
    Plata: { backgroundColor: '#F5F5F5', borderColor: '#C0C0C0', textColor: '#757575' },
    Oro: { backgroundColor: '#FFFDE7', borderColor: '#FFD700', textColor: '#FF8F00' },
    Platino: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9', textColor: '#1565C0' },
  }[nivel] || { backgroundColor: '#FFF8E1', borderColor: '#CD7F32', textColor: '#CD7F32' });

  const cargarEstadisticas = async () => {
    try {
      const res = await getEstadisticasUsuario();
      const data = res.data || {};
      const puntos = Number(data.total_gastado || 0);
      const nivel = data.nivel_fidelizacion || 'Bronce';
      const siguiente = getSiguienteNivel(nivel);
      const umbrales = { Bronce: 50000, Plata: 150000, Oro: 300000 };
      setEstadisticas({
        total_gastado: puntos,
        num_compras: Number(data.num_compras || 0),
        ticket_promedio: Number(data.ticket_promedio || 0),
      });
      setCategoriasFavoritas(data.categorias_favoritas || []);
      setNivelFidelizacion({
        nivel,
        puntos,
        siguiente_nivel: siguiente,
        puntos_para_siguiente: siguiente ? Math.max(umbrales[nivel] - puntos, 0) : 0,
      });
    } catch {
      setEstadisticas({ total_gastado: 0, num_compras: 0, ticket_promedio: 0 });
      setCategoriasFavoritas([]);
      setNivelFidelizacion({ nivel: 'Bronce', puntos: 0, siguiente_nivel: 'Plata', puntos_para_siguiente: 50000 });
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        const data = res.data || {};
        setProfile(data);
        const nameParts = (data.nombre_usuario || '').trim().split(/\s+/);
        setName(nameParts.shift() || '');
        setSurname(nameParts.join(' '));
        setPhone(data.telefono || '');
        setCity(data.ciudad || '');
        setAddress(data.direccion || '');
        setNotificationsPromotions(data.preferencias?.notificaciones_promociones ?? true);
        setNotificationsOrders(data.preferencias?.notificaciones_pedidos ?? true);
        setNotificationsNews(data.preferencias?.notificaciones_novedades ?? false);
        setProfilePhotoUrl(resolveImageUrl(data.foto_perfil));
        setBannerUrl(resolveImageUrl(data.banner_perfil));
        setBannerColor(data.banner_perfil ? null : (data.banner_color || '#7A1E3A'));
      } catch (e) {
        console.log('Error loading profile', e.message);
        Alert.alert('Error', 'No se pudo cargar tu perfil');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
    cargarEstadisticas();
  }, []);

  const seleccionarImagen = async (tipo) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: tipo === 'foto' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
    const formData = new FormData();
    const fileName = `${tipo}.${extension}`;
    const mimeType = asset.mimeType || asset.file?.type || `image/${extension}`;

    if (Platform.OS === 'web') {
      const file = asset.file || await fetch(asset.uri).then((response) => response.blob());
      formData.append('file', file, fileName);
    } else {
      formData.append('file', { uri: asset.uri, name: fileName, type: mimeType });
    }

    try {
      if (tipo === 'foto') {
        setPhotoUploading(true);
        const response = await uploadProfilePhoto(formData);
        setProfilePhotoUrl(resolveImageUrl(response.data?.url));
        Alert.alert('Listo', 'Foto de perfil actualizada.');
      } else {
        setBannerUploading(true);
        const response = await uploadBannerPhoto(formData);
        setBannerUrl(resolveImageUrl(response.data?.url));
        setBannerColor(null);
        setShowBannerEditor(false);
        Alert.alert('Listo', 'Banner actualizado.');
      }
    } catch {
      Alert.alert('Error', `No se pudo actualizar ${tipo === 'foto' ? 'la foto' : 'el banner'}.`);
    } finally {
      setPhotoUploading(false);
      setBannerUploading(false);
    }
  };

  const seleccionarColorBanner = async (color) => {
    try {
      await saveBannerColor(color);
      setBannerColor(color);
      setBannerUrl(null);
      setShowBannerEditor(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el color del banner.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nombre_usuario: `${name.trim()} ${surname.trim()}`.trim() || undefined,
        telefono: phone.trim() || undefined,
        ciudad: city.trim() || undefined,
        direccion: address.trim() || undefined,
      };
      await updateProfile(payload);
      await updatePreferences({
        notificaciones_promociones: notificationsPromotions,
        notificaciones_pedidos: notificationsOrders,
        notificaciones_novedades: notificationsNews,
      });
      await cargarEstadisticas();
      Alert.alert('Listo', 'Perfil actualizado correctamente');
    } catch (e) {
      console.log('Error saving profile', e.message);
      Alert.alert('Error', 'No se pudo actualizar tu perfil');
    } finally {
      setSaving(false);
    }
  };

  const gradientColors = (value) => value.match(/#[0-9a-f]{6}/gi) || ['#7A1E3A', '#3A1E7A'];

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={WHITE} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeading}>
            <IconUser size={28} color={WHITE} />
            <Text style={styles.title}>Mi Perfil</Text>
          </View>
          <Text style={styles.subtitle}>Actualiza tus datos, personaliza tu perfil y revisa tu actividad.</Text>

          <View style={styles.mediaCard}>
            <Text style={styles.cardTitle}>Información personal</Text>
            <View style={styles.photoRow}>
              {profilePhotoUrl ? (
                <Image source={{ uri: profilePhotoUrl }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profileInitial}>{name.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}
              <View style={styles.photoInfo}>
                <Text style={styles.mediaTitle}>Foto de perfil</Text>
                <Text style={styles.mediaDescription}>Personaliza tu cuenta con una foto.</Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => seleccionarImagen('foto')} disabled={photoUploading}>
                  {photoUploading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.secondaryBtnText}>Cambiar foto</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.mediaTitle}>Banner de perfil</Text>
            <View style={styles.bannerPreview}>
              {bannerUrl ? (
                <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />
              ) : bannerColor?.startsWith('linear-gradient') ? (
                <LinearGradient colors={gradientColors(bannerColor)} style={styles.bannerImage} />
              ) : (
                <View style={[styles.bannerImage, { backgroundColor: bannerColor || '#7A1E3A' }]} />
              )}
              <TouchableOpacity style={styles.bannerEditBtn} onPress={() => setShowBannerEditor(!showBannerEditor)}>
                <Text style={styles.bannerEditText}>{showBannerEditor ? 'Cerrar' : 'Editar'}</Text>
              </TouchableOpacity>
            </View>
            {showBannerEditor && (
              <View style={styles.bannerEditor}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => seleccionarImagen('banner')} disabled={bannerUploading}>
                  {bannerUploading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.secondaryBtnText}>Elegir imagen</Text>}
                </TouchableOpacity>
                <Text style={styles.editorLabel}>Colores y gradientes</Text>
                <View style={styles.swatches}>
                  {[
                    '#7A1E3A', '#1E3A7A', '#1E7A3A', '#7A6A1E', '#3A1E7A', '#1E6A7A', '#2A2A2A', '#8B4513',
                    'linear-gradient(135deg, #7A1E3A, #3A1E7A)',
                    'linear-gradient(135deg, #1E3A7A, #1E7A6A)',
                    'linear-gradient(135deg, #f093fb, #f5576c)',
                  ].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.swatch, !color.startsWith('linear-gradient') && { backgroundColor: color }]}
                      onPress={() => seleccionarColorBanner(color)}
                      accessibilityLabel="Seleccionar color de banner"
                    >
                      {color.startsWith('linear-gradient') && <LinearGradient colors={gradientColors(color)} style={styles.swatchGradient} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Datos de contacto</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Apellidos</Text>
                <TextInput style={styles.input} value={surname} onChangeText={setSurname} />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Ciudad</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} />
            </View>
          </View>

          <View style={styles.preferencesCard}>
            <Text style={styles.cardTitle}>Preferencias de notificaciones</Text>
            {[
              ['Promociones', notificationsPromotions, setNotificationsPromotions],
              ['Pedidos', notificationsOrders, setNotificationsOrders],
              ['Novedades', notificationsNews, setNotificationsNews],
            ].map(([label, enabled, setEnabled]) => (
              <View style={styles.toggleRow} key={label}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <TouchableOpacity
                  style={[styles.toggleBtn, enabled && styles.toggleBtnActive]}
                  onPress={() => setEnabled(!enabled)}
                >
                  <Text style={[styles.toggleText, enabled && styles.toggleTextActive]}>
                    {enabled ? 'Activado' : 'Desactivado'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={WHITE} /> : <Text style={styles.saveBtnText}>Guardar cambios</Text>}
          </TouchableOpacity>

          <View style={styles.loyaltyCard}>
            <View style={styles.cardTitleRow}>
              <IconStar size={24} color={PRIMARY} />
              <Text style={styles.cardTitle}>Nivel de fidelización</Text>
            </View>
            {nivelFidelizacion && (() => {
              const colors = getNivelColor(nivelFidelizacion.nivel);
              const progress = nivelFidelizacion.siguiente_nivel
                ? Math.min((nivelFidelizacion.puntos / ({ Bronce: 50000, Plata: 150000, Oro: 300000 }[nivelFidelizacion.nivel] || 1)) * 100, 100)
                : 100;
              return (
                <View style={[styles.loyaltyPanel, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}>
                  <View style={[styles.loyaltyIcon, { backgroundColor: colors.borderColor }]}>
                    <IconStar size={42} color={WHITE} />
                  </View>
                  <Text style={[styles.loyaltyLevel, { color: colors.textColor }]}>{nivelFidelizacion.nivel}</Text>
                  <Text style={styles.loyaltySpent}>${Math.floor(nivelFidelizacion.puntos).toLocaleString('es-CO')} COP gastados</Text>
                  {nivelFidelizacion.siguiente_nivel && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabels}>
                        <Text style={styles.mutedText}>Próximo: {nivelFidelizacion.siguiente_nivel}</Text>
                        <Text style={styles.mutedText}>${Math.floor(nivelFidelizacion.puntos_para_siguiente).toLocaleString('es-CO')} COP</Text>
                      </View>
                      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.borderColor }]} /></View>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Estadísticas de compras</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}><Text style={styles.statLabel}>Total gastado</Text><Text style={styles.statValue}>${Math.floor(estadisticas?.total_gastado || 0).toLocaleString('es-CO')}</Text><Text style={styles.statUnit}>COP</Text></View>
              <View style={styles.statBox}><Text style={styles.statLabel}>Número de compras</Text><Text style={styles.statValue}>{estadisticas?.num_compras || 0}</Text></View>
              <View style={styles.statBox}><Text style={styles.statLabel}>Ticket promedio</Text><Text style={styles.statValue}>${Math.floor(estadisticas?.ticket_promedio || 0).toLocaleString('es-CO')}</Text><Text style={styles.statUnit}>COP</Text></View>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.cardTitleRow}><IconBook size={24} color={PRIMARY} /><Text style={styles.cardTitle}>Categorías favoritas</Text></View>
            <Text style={styles.mutedText}>Basado en tu historial de compras</Text>
            {categoriasFavoritas.length > 0 ? categoriasFavoritas.map((categoria) => (
              <View key={categoria.nombre} style={styles.categoryRow}>
                <IconBook size={22} color={PRIMARY} />
                <Text style={styles.categoryName}>{categoria.nombre}</Text>
                <Text style={styles.mutedText}>{categoria.conteo} compra{categoria.conteo > 1 ? 's' : ''}</Text>
              </View>
            )) : <Text style={styles.emptyCategory}>Aún no tienes categorías favoritas. Compra libros para ver tus preferencias aquí.</Text>}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY },
  scrollView: {
    flex: 1,
    backgroundColor: PRIMARY,
  },
  container: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: PRIMARY,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PRIMARY },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '800', color: WHITE },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 20 },
  mediaCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  cardTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY, marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 20, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: BORDER },
  profilePhoto: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: PRIMARY },
  profilePlaceholder: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#E0DBD4', borderWidth: 3, borderColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  profileInitial: { fontSize: 34, fontWeight: '800', color: PRIMARY },
  photoInfo: { flex: 1 },
  mediaTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 5 },
  mediaDescription: { color: MUTED, fontSize: 13, marginBottom: 10 },
  secondaryBtn: { alignSelf: 'flex-start', backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, minWidth: 110, alignItems: 'center' },
  secondaryBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  bannerPreview: { height: 88, borderRadius: 10, marginBottom: 12, overflow: 'hidden', borderWidth: 2, borderColor: BORDER, justifyContent: 'flex-end', alignItems: 'flex-end' },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerEditBtn: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, margin: 8 },
  bannerEditText: { color: WHITE, fontWeight: '700', fontSize: 12 },
  bannerEditor: { backgroundColor: '#F9F7F4', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 18 },
  editorLabel: { fontSize: 14, color: TEXT, fontWeight: '700', marginTop: 16, marginBottom: 10 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#CCC', overflow: 'hidden' },
  swatchGradient: { width: '100%', height: '100%' },
  loyaltyCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  loyaltyPanel: { borderRadius: 16, borderWidth: 3, padding: 20, alignItems: 'center' },
  loyaltyIcon: { width: 86, height: 86, borderRadius: 43, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  loyaltyLevel: { fontSize: 25, fontWeight: '800', textTransform: 'uppercase', marginBottom: 5 },
  loyaltySpent: { color: MUTED, fontSize: 14, marginBottom: 14 },
  progressSection: { width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 12 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressTrack: { height: 10, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  detailsCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  statsCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  statsGrid: { gap: 10 },
  statBox: { backgroundColor: '#FAF8F6', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: BORDER },
  statLabel: { color: MUTED, fontSize: 13, marginBottom: 6 },
  statValue: { color: PRIMARY, fontSize: 22, fontWeight: '800' },
  statUnit: { color: MUTED, fontSize: 12, marginTop: 2 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FAF8F6', borderRadius: 10, padding: 13, marginTop: 10 },
  categoryName: { flex: 1, color: TEXT, fontWeight: '700' },
  emptyCategory: { color: MUTED, textAlign: 'center', paddingVertical: 16, lineHeight: 20 },
  mutedText: { color: MUTED, fontSize: 13 },
  field: { marginBottom: 14 },
  label: { color: TEXT, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: WHITE,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: TEXT,
  },
  preferencesCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 4, borderWidth: 1, borderColor: BORDER },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  toggleLabel: { color: TEXT, fontWeight: '600' },
  toggleBtn: {
    minWidth: 96,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F0F0F0',
  },
  toggleBtnActive: { backgroundColor: PRIMARY },
  toggleText: { color: '#555' },
  toggleTextActive: { color: WHITE },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
  disabledBtn: { opacity: 0.7 },
});