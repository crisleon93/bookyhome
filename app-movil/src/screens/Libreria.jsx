import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getLibreria, updateLibreria, uploadLibreriaLogo } from '../services/api';

export default function Libreria() {
  const [libreria, setLibreria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', ubicacion: '' });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getLibreria();
      const data = res.data;
      setLibreria(data);
      setForm({ nombre: data.nombre || '', descripcion: data.descripcion || '', ubicacion: data.ubicacion || '' });
    } catch {
      Alert.alert('Error', 'No se pudo cargar la información de la librería.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await updateLibreria(form);
      setLibreria(prev => ({ ...prev, ...form }));
      setEditando(false);
      Alert.alert('Guardado', 'Información de la librería actualizada.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarLogo = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const formData = new FormData();
    formData.append('file', { uri, name: 'logo.jpg', type: 'image/jpeg' });
    try {
      const res = await uploadLibreriaLogo(formData);
      setLibreria(prev => ({ ...prev, logo: res.data.logo }));
      Alert.alert('Logo actualizado', 'El logo de tu librería fue actualizado.');
    } catch {
      Alert.alert('Error', 'No se pudo subir el logo.');
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#7A1E3A" /></View>;
  if (!libreria) return <View style={s.center}><Text style={s.emptyText}>No se encontró información de la librería.</Text></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Logo */}
      <View style={s.logoWrapper}>
        {libreria.logo ? (
          <Image source={{ uri: libreria.logo }} style={s.logo} />
        ) : (
          <View style={[s.logo, s.logoPlaceholder]}>
            <Text style={{ fontSize: 40 }}>🏪</Text>
          </View>
        )}
        <TouchableOpacity style={s.logoBtn} onPress={handleCambiarLogo}>
          <Text style={s.logoBtnText}>📷 Cambiar Logo</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.sectionTitle}>Información de la Librería</Text>
          <TouchableOpacity onPress={() => setEditando(!editando)}>
            <Text style={s.editLink}>{editando ? 'Cancelar' : '✏️ Editar'}</Text>
          </TouchableOpacity>
        </View>

        {(['nombre', 'descripcion', 'ubicacion']).map(campo => (
          <View key={campo} style={s.field}>
            <Text style={s.label}>{campo.charAt(0).toUpperCase() + campo.slice(1)}</Text>
            {editando ? (
              <TextInput
                style={[s.input, campo === 'descripcion' && { height: 90, textAlignVertical: 'top' }]}
                value={form[campo]}
                onChangeText={v => setForm(p => ({ ...p, [campo]: v }))}
                multiline={campo === 'descripcion'}
                placeholder={`Ingresa ${campo}`}
              />
            ) : (
              <Text style={s.value}>{libreria[campo] || <Text style={{ color: '#bbb' }}>Sin información</Text>}</Text>
            )}
          </View>
        ))}

        {editando && (
          <TouchableOpacity style={s.saveBtn} onPress={handleGuardar} disabled={guardando}>
            <Text style={s.saveBtnText}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' },
  emptyText: { color: '#888', fontSize: 15 },
  logoWrapper: { alignItems: 'center', paddingVertical: 28, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  logo: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
  logoPlaceholder: { backgroundColor: '#f0e8ec', justifyContent: 'center', alignItems: 'center' },
  logoBtn: { backgroundColor: '#f5eef2', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#e0c8d0' },
  logoBtnText: { color: '#7A1E3A', fontWeight: '600', fontSize: 14 },
  card: { margin: 16, backgroundColor: 'white', borderRadius: 14, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  editLink: { fontSize: 14, color: '#7A1E3A', fontWeight: '600' },
  field: { marginBottom: 14 },
  label: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  value: { fontSize: 15, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, color: '#222', backgroundColor: '#fafafa' },
  saveBtn: { backgroundColor: '#7A1E3A', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
