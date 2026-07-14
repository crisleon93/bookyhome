import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getCategorias, publicarLibro } from '../services/api';

const ESTADOS = ['Nuevo', 'Como nuevo', 'Bueno', 'Aceptable'];

export default function PublicarLibro({ navigation }) {
  const [form, setForm] = useState({
    titulo: '', autor: '', isbn: '', precio: '',
    id_categoria: '', estado: '', descripcion: '',
  });
  const [categorias, setCategorias] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    getCategorias().then(r => setCategorias(r.data || [])).catch(() => {}).finally(() => setLoadingCats(false));
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validar = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'El título es obligatorio';
    if (!form.autor.trim()) e.autor = 'El autor es obligatorio';
    if (!form.precio || isNaN(form.precio) || parseFloat(form.precio) <= 0) e.precio = 'Ingresa un precio válido';
    if (!form.id_categoria) e.id_categoria = 'Selecciona una categoría';
    if (!form.estado) e.estado = 'Selecciona el estado del libro';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleAgregarImagen = async () => {
    if (imagenes.length >= 4) { Alert.alert('Máximo 4 imágenes'); return; }
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setImagenes(prev => [...prev, result.assets[0].uri]);
  };

  const handlePublicar = async () => {
    if (!validar()) return;
    setCargando(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      imagenes.forEach((uri, i) => formData.append('imagenes', { uri, name: `img_${i}.jpg`, type: 'image/jpeg' }));
      await publicarLibro(formData);
      Alert.alert('¡Publicado!', 'Tu libro ya está visible en la tienda.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo publicar el libro.');
    } finally {
      setCargando(false);
    }
  };

  if (loadingCats) return <View style={s.center}><ActivityIndicator size="large" color="#7A1E3A" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.pageTitle}>Publicar Libro</Text>

      {/* Imágenes */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Imágenes ({imagenes.length}/4)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
          {imagenes.map((uri, i) => (
            <View key={i} style={{ marginRight: 10 }}>
              <Image source={{ uri }} style={s.imgThumb} />
              <TouchableOpacity style={s.removeImg} onPress={() => setImagenes(p => p.filter((_, idx) => idx !== i))}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {imagenes.length < 4 && (
            <TouchableOpacity style={s.addImgBtn} onPress={handleAgregarImagen}>
              <Text style={{ fontSize: 28, color: '#7A1E3A' }}>+</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Campos */}
      <View style={s.card}>
        {[
          { key: 'titulo', label: 'Título *', placeholder: 'Título del libro' },
          { key: 'autor', label: 'Autor *', placeholder: 'Nombre del autor' },
          { key: 'isbn', label: 'ISBN', placeholder: 'Código ISBN (opcional)' },
          { key: 'precio', label: 'Precio *', placeholder: '0', keyboardType: 'numeric' },
        ].map(({ key, label, placeholder, keyboardType }) => (
          <View key={key} style={s.fieldGroup}>
            <Text style={s.fieldLabel}>{label}</Text>
            <TextInput
              style={[s.input, errores[key] && s.inputError]}
              placeholder={placeholder}
              value={form[key]}
              onChangeText={v => set(key, v)}
              keyboardType={keyboardType || 'default'}
            />
            {errores[key] && <Text style={s.errorText}>{errores[key]}</Text>}
          </View>
        ))}

        {/* Categoría */}
        <Text style={s.fieldLabel}>Categoría *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {categorias.map(c => (
            <TouchableOpacity
              key={c.id_categoria}
              style={[s.chip, form.id_categoria === String(c.id_categoria) && s.chipSelected]}
              onPress={() => set('id_categoria', String(c.id_categoria))}
            >
              <Text style={[s.chipText, form.id_categoria === String(c.id_categoria) && s.chipTextSelected]}>
                {c.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {errores.id_categoria && <Text style={s.errorText}>{errores.id_categoria}</Text>}

        {/* Estado */}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Estado del libro *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          {ESTADOS.map(est => (
            <TouchableOpacity
              key={est}
              style={[s.chip, form.estado === est && s.chipSelected]}
              onPress={() => set('estado', est)}
            >
              <Text style={[s.chipText, form.estado === est && s.chipTextSelected]}>{est}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errores.estado && <Text style={s.errorText}>{errores.estado}</Text>}

        {/* Descripción */}
        <View style={[s.fieldGroup, { marginTop: 14 }]}>
          <Text style={s.fieldLabel}>Descripción (opcional)</Text>
          <TextInput
            style={[s.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Descripción breve del libro..."
            value={form.descripcion}
            onChangeText={v => set('descripcion', v)}
            multiline
          />
        </View>
      </View>

      <TouchableOpacity style={s.publishBtn} onPress={handlePublicar} disabled={cargando}>
        <Text style={s.publishBtnText}>{cargando ? 'Publicando...' : '📚 Publicar libro'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#7A1E3A', padding: 16, paddingBottom: 8 },
  card: { margin: 12, marginTop: 8, backgroundColor: 'white', borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#7A1E3A', textTransform: 'uppercase', letterSpacing: 0.5 },
  imgThumb: { width: 90, height: 120, borderRadius: 8 },
  removeImg: { position: 'absolute', top: 4, right: 4, backgroundColor: '#7A1E3A', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  addImgBtn: { width: 90, height: 120, borderRadius: 8, borderWidth: 2, borderColor: '#e0c8d0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdf7f9' },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, color: '#222', backgroundColor: '#fafafa' },
  inputError: { borderColor: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: 3 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5', marginRight: 8, marginBottom: 6 },
  chipSelected: { backgroundColor: '#7A1E3A', borderColor: '#7A1E3A' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: 'white', fontWeight: '700' },
  publishBtn: { margin: 16, backgroundColor: '#7A1E3A', borderRadius: 12, paddingVertical: 15, alignItems: 'center', elevation: 3 },
  publishBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
