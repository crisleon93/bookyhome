import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getConfigLibreria, updateConfigLibreria, uploadTiendaImage, getApiBaseUrl } from '../services/api';

export default function ConfiguracionTienda({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    descripcion: '',
    logo_url: '',
    banner_url: '',
    horario_atencion: '',
    politica_devoluciones: '',
    politica_envios: '',
    tiempo_despacho_dias: '2',
    ciudad_origen: '',
    email_publico: ''
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const res = await getConfigLibreria();
      if (res.data) {
        setConfig({
          ...res.data,
          tiempo_despacho_dias: String(res.data.tiempo_despacho_dias || 2)
        });
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'No se pudo cargar la configuración de tu tienda.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  const handlePickImage = async (tipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: tipo === 'banner' ? [16, 9] : [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await subirImagen(asset.uri, tipo);
    }
  };

  const subirImagen = async (uri, tipo) => {
    setLoading(true);
    try {
      const formData = new FormData();
      const ext = uri.split('.').pop() || 'jpg';
      formData.append('file', {
        uri,
        name: `imagen.${ext}`,
        type: `image/${ext}`
      });
      formData.append('tipo', tipo);

      const res = await uploadTiendaImage(formData);
      if (res.data && res.data.url) {
        setConfig(prev => ({
          ...prev,
          [tipo === 'logo' ? 'logo_url' : 'banner_url']: res.data.url
        }));
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfigLibreria({
        ...config,
        tiempo_despacho_dias: parseInt(config.tiempo_despacho_dias) || 2
      });
      Alert.alert('Éxito', 'Configuración guardada correctamente.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const getImageUri = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return { uri: url };
    return { uri: `${getApiBaseUrl()}${url}` };
  };

  if (loading && !config.descripcion) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A1E3A" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configuración de Tienda</Text>
      
      {/* Imágenes */}
      <View style={styles.imagesCard}>
        <Text style={styles.label}>Imágenes del Perfil</Text>
        
        {/* Banner */}
        <TouchableOpacity style={styles.bannerContainer} onPress={() => handlePickImage('banner')}>
          {config.banner_url ? (
            <Image source={getImageUri(config.banner_url)} style={styles.bannerImg} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Text style={styles.uploadText}>Subir Banner (16:9)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Logo */}
        <TouchableOpacity style={styles.logoContainer} onPress={() => handlePickImage('logo')}>
          {config.logo_url ? (
            <Image source={getImageUri(config.logo_url)} style={styles.logoImg} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.uploadText}>Subir Logo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Información Básica */}
      <View style={styles.card}>
        <Text style={styles.label}>Información Pública</Text>
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descripción breve de tu tienda..."
          multiline
          value={config.descripcion}
          onChangeText={(v) => handleChange('descripcion', v)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Ciudad de Origen"
          value={config.ciudad_origen}
          onChangeText={(v) => handleChange('ciudad_origen', v)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email Público (Contacto)"
          keyboardType="email-address"
          value={config.email_publico}
          onChangeText={(v) => handleChange('email_publico', v)}
        />

        <TextInput
          style={styles.input}
          placeholder="Horario de Atención (Ej: Lun-Vie 9am-6pm)"
          value={config.horario_atencion}
          onChangeText={(v) => handleChange('horario_atencion', v)}
        />
      </View>

      {/* Logística y Políticas */}
      <View style={styles.card}>
        <Text style={styles.label}>Políticas y Logística</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Días promedio de despacho"
          keyboardType="numeric"
          value={String(config.tiempo_despacho_dias)}
          onChangeText={(v) => handleChange('tiempo_despacho_dias', v)}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Políticas de envío (costos, transportadoras...)"
          multiline
          value={config.politica_envios}
          onChangeText={(v) => handleChange('politica_envios', v)}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Políticas de devoluciones y garantías..."
          multiline
          value={config.politica_devoluciones}
          onChangeText={(v) => handleChange('politica_devoluciones', v)}
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving || loading}>
        <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
      </TouchableOpacity>
      
      {loading && saving === false && (
        <ActivityIndicator size="small" color="#7A1E3A" style={{ marginTop: 10 }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbfa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#7A1E3A', marginBottom: 20 },
  
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  imagesCard: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#eee', position: 'relative', height: 200 },
  
  label: { fontSize: 14, fontWeight: '700', color: '#2A2A2A', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#e0dbd4', borderRadius: 6, padding: 12, marginBottom: 12, fontSize: 14, color: '#333', backgroundColor: '#fafafa' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  
  bannerContainer: { height: 120, width: '100%', backgroundColor: '#eee', borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: 'hidden' },
  bannerImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  logoContainer: { position: 'absolute', bottom: 15, left: 16, width: 80, height: 80, borderRadius: 40, backgroundColor: '#ddd', borderWidth: 3, borderColor: '#fff', overflow: 'hidden', zIndex: 10 },
  logoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 5 },
  
  uploadText: { fontSize: 10, color: '#666', fontWeight: 'bold', textAlign: 'center' },

  saveBtn: { backgroundColor: '#7A1E3A', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
