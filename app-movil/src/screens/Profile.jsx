import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getProfile, updateProfile, updatePreferences } from '../services/api';
import Header from '../components/Header';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777';

export default function Profile({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notificationsPromotions, setNotificationsPromotions] = useState(true);
  const [notificationsOrders, setNotificationsOrders] = useState(true);
  const [notificationsNews, setNotificationsNews] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        const data = res.data || {};
        setProfile(data);
        setName(data.nombre_usuario || '');
        setPhone(data.telefono || '');
        setCity(data.ciudad || '');
        setAddress(data.direccion || '');
        setNotificationsPromotions(data.preferencias?.notificaciones_promociones ?? true);
        setNotificationsOrders(data.preferencias?.notificaciones_pedidos ?? true);
        setNotificationsNews(data.preferencias?.notificaciones_novedades ?? false);
      } catch (e) {
        console.log('Error loading profile', e.message);
        Alert.alert('Error', 'No se pudo cargar tu perfil');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nombre_usuario: name.trim() || undefined,
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
      Alert.alert('Listo', 'Perfil actualizado correctamente');
    } catch (e) {
      console.log('Error saving profile', e.message);
      Alert.alert('Error', 'No se pudo actualizar tu perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        variant="dashboard"
        navigation={navigation}
        onSignOut={signOut}
        userName={user?.nombre || user?.email?.split('@')[0]}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Mi perfil</Text>
          <Text style={styles.subtitle}>Actualiza tus datos de usuario y tus preferencias</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ciudad</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Preferencias de notificaciones</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Promociones</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, notificationsPromotions && styles.toggleBtnActive]}
              onPress={() => setNotificationsPromotions(!notificationsPromotions)}
            >
              <Text style={[styles.toggleText, notificationsPromotions && styles.toggleTextActive]}>
                {notificationsPromotions ? 'Activado' : 'Desactivado'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Pedidos</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, notificationsOrders && styles.toggleBtnActive]}
              onPress={() => setNotificationsOrders(!notificationsOrders)}
            >
              <Text style={[styles.toggleText, notificationsOrders && styles.toggleTextActive]}>
                {notificationsOrders ? 'Activado' : 'Desactivado'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Novedades</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, notificationsNews && styles.toggleBtnActive]}
              onPress={() => setNotificationsNews(!notificationsNews)}
            >
              <Text style={[styles.toggleText, notificationsNews && styles.toggleTextActive]}>
                {notificationsNews ? 'Activado' : 'Desactivado'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={WHITE} /> : <Text style={styles.saveBtnText}>Guardar cambios</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: TEXT, marginBottom: 6 },
  subtitle: { fontSize: 14, color: MUTED, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { color: TEXT, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: TEXT,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  toggleLabel: { color: TEXT, fontWeight: '600' },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F0F0F0',
  },
  toggleBtnActive: { backgroundColor: PRIMARY },
  toggleText: { color: '#555' },
  toggleTextActive: { color: WHITE },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
  disabledBtn: { opacity: 0.7 },
});