import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getConfigLibreria, getLibreria, updateConfigLibreria, updateMiTienda,
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import Footer from '../components/Footer';
import { useAppTheme } from '../context/ThemeContext';

export default function ConfiguracionTienda({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const { darkMode, setDarkMode, colors } = useAppTheme();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canSaveConfiguration, setCanSaveConfiguration] = useState(false);
  const [store, setStore] = useState({
    nombre_tienda: '',
    direccion: '',
    telefono: '',
  });
  const [config, setConfig] = useState({
    descripcion: '',
    logo_url: '',
    banner_url: '',
    horario_atencion: '',
    politica_devoluciones: '',
    politica_envios: '',
    tiempo_despacho_dias: '2',
    ciudad_origen: '',
    email_publico: '',
    tarifa_envio: '0',
  });

  useEffect(() => {
    void cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    let configLoaded = false;
    let storeLoaded = false;

    try {
      const res = await getConfigLibreria();
      if (res.data) {
        setConfig({
          ...res.data,
          tiempo_despacho_dias: String(res.data.tiempo_despacho_dias || 2),
          tarifa_envio: String(res.data.tarifa_envio ?? 0),
        });
      }
      configLoaded = true;
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'No se pudo cargar la configuración de tu tienda.');
    }

    try {
      const response = await getLibreria();
      setStore({
        nombre_tienda: response.data?.nombre_tienda || '',
        direccion: response.data?.direccion || '',
        telefono: response.data?.telefono || '',
      });
      storeLoaded = true;
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'No se pudo cargar la identidad de tu tienda.');
    }
    setCanSaveConfiguration(configLoaded && storeLoaded);

    setLoading(false);
  };

  const handleChange = (field, value) => {
    setConfig((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    const nombreTienda = store.nombre_tienda.trim();
    if (!nombreTienda) {
      Alert.alert('Falta información', 'El nombre de la tienda es obligatorio.');
      return;
    }
    if (nombreTienda.length < 3) {
      Alert.alert('Nombre inválido', 'El nombre de la tienda debe tener al menos 3 caracteres.');
      return;
    }

    const diasDespacho = Number.parseInt(config.tiempo_despacho_dias, 10);
    const tarifaEnvio = Number.parseFloat(config.tarifa_envio);
    if (!Number.isFinite(tarifaEnvio) || tarifaEnvio < 0) {
      Alert.alert('Tarifa inválida', 'La tarifa de envío debe ser cero o un valor positivo.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        updateMiTienda({
          ...store,
          nombre_tienda: nombreTienda,
        }),
        updateConfigLibreria({
          ...config,
          tiempo_despacho_dias: Number.isFinite(diasDespacho) ? diasDespacho : 2,
          tarifa_envio: tarifaEnvio,
        }),
      ]);
      Alert.alert('Éxito', 'Los cambios se guardaron correctamente y se reflejarán en tu perfil público.');
    } catch (e) {
      Alert.alert(
        'Error',
        e?.response?.data?.detail || 'No se pudo guardar la configuración de la tienda.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && !config.descripcion) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A1E3A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#7A1E3A' }]}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Configuración de tienda</Text>
      </View>
      <ScrollView style={[styles.container, { backgroundColor: colors.page }]} contentContainerStyle={styles.content}>
        <Text style={[styles.title, darkMode && styles.darkText]}>Configuración de tienda</Text>

        <View style={[styles.card, darkMode && styles.darkCard]}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>🏪  Identidad de la tienda</Text>
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Nombre de la tienda *</Text>
          <TextInput
            style={[styles.input, darkMode && styles.darkInput]}
            placeholder="Ej: Librería El Quijote"
            placeholderTextColor={darkMode ? '#999' : '#666'}
            value={store.nombre_tienda}
            onChangeText={(value) => setStore((current) => ({ ...current, nombre_tienda: value }))}
          />
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Teléfono de contacto</Text>
          <TextInput
            style={[styles.input, darkMode && styles.darkInput]}
            placeholder="Ej: 3001234567"
            placeholderTextColor={darkMode ? '#999' : '#666'}
            keyboardType="phone-pad"
            value={store.telefono}
            onChangeText={(value) => setStore((current) => ({ ...current, telefono: value }))}
          />
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Dirección física</Text>
          <TextInput
            style={[styles.input, darkMode && styles.darkInput]}
            placeholder="Calle 123 # 45-67"
            placeholderTextColor={darkMode ? '#999' : '#666'}
            value={store.direccion}
            onChangeText={(value) => setStore((current) => ({ ...current, direccion: value }))}
          />
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Ciudad de origen</Text>
          <TextInput
            style={[styles.input, darkMode && styles.darkInput]}
            placeholder="Bogotá, Medellín..."
            placeholderTextColor={darkMode ? '#999' : '#666'}
            value={config.ciudad_origen || ''}
            onChangeText={(value) => handleChange('ciudad_origen', value)}
          />
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Email público</Text>
          <TextInput
            style={[styles.input, darkMode && styles.darkInput]}
            placeholder="contacto@milibreria.com"
            placeholderTextColor={darkMode ? '#999' : '#666'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={config.email_publico || ''}
            onChangeText={(value) => handleChange('email_publico', value)}
          />
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Horario de atención</Text>
          <TextInput
            style={[styles.input, darkMode && styles.darkInput]}
            placeholder="Lun-Vie 9am-6pm"
            placeholderTextColor={darkMode ? '#999' : '#666'}
            value={config.horario_atencion || ''}
            onChangeText={(value) => handleChange('horario_atencion', value)}
          />
        </View>

        <View style={[styles.card, darkMode && styles.darkCard]}>
          <Text style={[styles.sectionTitle, { color: '#0369A1' }]}>📝  Descripción pública</Text>
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Describe tu tienda</Text>
          <TextInput
            style={[styles.input, styles.textArea, darkMode && styles.darkInput]}
            placeholder="Cuéntales a tus compradores qué hace especial a tu librería..."
            placeholderTextColor={darkMode ? '#999' : '#666'}
            multiline
            maxLength={500}
            value={config.descripcion || ''}
            onChangeText={(v) => handleChange('descripcion', v)}
          />
          <Text style={[styles.hint, darkMode && styles.darkHint]}>{(config.descripcion || '').length}/500 caracteres recomendados</Text>
        </View>

        <View style={[styles.card, darkMode && styles.darkCard]}>
          <Text style={[styles.sectionTitle, { color: '#15803D' }]}>🚚  Logística y envío</Text>
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Días promedio de despacho</Text>
          <TextInput
            style={[styles.input, darkMode && styles.darkInput]}
            placeholder="2"
            placeholderTextColor={darkMode ? '#999' : '#666'}
            keyboardType="numeric"
            maxLength={2}
            value={String(config.tiempo_despacho_dias)}
            onChangeText={(value) => handleChange('tiempo_despacho_dias', value.replace(/[^0-9]/g, ''))}
          />
          <Text style={[styles.hint, darkMode && styles.darkHint]}>Tiempo estimado desde que recibes el pedido hasta despachar.</Text>
          <View style={styles.infoNotice}>
            <Text style={styles.noticeText}>📦  El retiro en tienda (Click &amp; Collect) es siempre gratuito para el comprador.</Text>
          </View>
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Tarifa de envío a domicilio (COP)</Text>
          <TextInput
            style={[styles.input, darkMode && styles.darkInput]}
            placeholder="0"
            placeholderTextColor={darkMode ? '#999' : '#666'}
            keyboardType="numeric"
            value={String(config.tarifa_envio)}
            onChangeText={(value) => handleChange('tarifa_envio', value.replace(/[^0-9]/g, ''))}
          />
          <Text style={[styles.hint, darkMode && styles.darkHint]}>Retiro en tienda siempre es gratis. Pon 0 para ofrecer domicilio gratis.</Text>
          <View style={[styles.infoNotice, styles.taxNotice]}>
            <Text style={[styles.noticeText, styles.taxNoticeText]}>📚  Los libros tienen IVA $0: son exentos por el Art. 424 del Estatuto Tributario colombiano.</Text>
          </View>
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Política de envíos</Text>
          <TextInput
            style={[styles.input, styles.textArea, darkMode && styles.darkInput]}
            placeholder="Transportadoras, zonas de cobertura y tiempos estimados..."
            placeholderTextColor={darkMode ? '#999' : '#666'}
            multiline
            value={config.politica_envios}
            onChangeText={(v) => handleChange('politica_envios', v)}
          />
          <Text style={[styles.fieldLabel, darkMode && styles.darkText]}>Política de devoluciones</Text>
          <TextInput
            style={[styles.input, styles.textArea, darkMode && styles.darkInput]}
            placeholder="Condiciones para devoluciones, cambios y garantías..."
            placeholderTextColor={darkMode ? '#999' : '#666'}
            multiline
            value={config.politica_devoluciones}
            onChangeText={(v) => handleChange('politica_devoluciones', v)}
          />
        </View>

        <View style={[styles.card, darkMode && styles.darkCard]}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>🎨  Preferencias visuales</Text>
          <View style={[styles.themeRow, darkMode && styles.darkThemeRow]}>
            <View style={styles.themeCopy}>
              <Text style={[styles.themeTitle, darkMode && styles.darkText]}>Modo oscuro</Text>
              <Text style={[styles.themeDescription, darkMode && styles.darkHint]}>
                Cambia el tema de la aplicación a modo oscuro
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={async (enabled) => {
                try {
                  await setDarkMode(enabled);
                } catch (error) {
                  console.error('No se pudo guardar el tema:', error);
                  Alert.alert('Error', 'No se pudo guardar la preferencia del tema.');
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#7A1E3A' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Activar modo oscuro"
            />
          </View>
        </View>

        {!loading && !canSaveConfiguration && (
          <Text style={styles.loadError}>No se pudo cargar toda la configuración; recarga antes de guardar para evitar sobrescribir datos.</Text>
        )}
        <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving || loading || !canSaveConfiguration}>
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
        </TouchableOpacity>

        {loading && saving === false && (
          <ActivityIndicator size="small" color="#7A1E3A" style={{ marginTop: 10 }} />
        )}
        <Footer onLinkPress={() => {}} />
      </ScrollView>

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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fdfbfa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7A1E3A', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  topHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#7A1E3A', marginBottom: 20 },
  darkText: { color: '#ECECEC' },
  loadError: { color: '#B91C1C', fontSize: 13, marginBottom: 12 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e8e4e0', elevation: 1 },
  darkCard: { backgroundColor: '#1E1E1E', borderColor: '#3A3A3A' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0369A1', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 6, textTransform: 'uppercase' },
  hint: { fontSize: 12, color: '#7C8798', marginTop: -7, marginBottom: 13 },
  infoNotice: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  noticeText: { color: '#166534', fontSize: 12, lineHeight: 18 },
  taxNotice: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', marginTop: 1 },
  taxNoticeText: { color: '#1D4ED8' },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#FAF8F6', borderRadius: 9, borderLeftWidth: 4, borderLeftColor: '#7A1E3A' },
  darkThemeRow: { backgroundColor: '#2A2A2A', borderLeftColor: '#E05A7A' },
  themeCopy: { flex: 1, paddingRight: 12 },
  themeTitle: { color: '#2A2A2A', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  themeDescription: { color: '#666', fontSize: 13 },
  darkHint: { color: '#C8C8C8' },
  input: { borderWidth: 1, borderColor: '#e0dbd4', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14, color: '#333', backgroundColor: '#fafafa' },
  darkInput: { borderColor: '#444', color: '#ECECEC', backgroundColor: '#2A2A2A' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  saveBtn: { backgroundColor: '#7A1E3A', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 18 },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
