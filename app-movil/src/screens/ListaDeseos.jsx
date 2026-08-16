import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert
} from 'react-native';
import { getApiBaseUrl, getFavoritos, removeFavorito } from '../services/api';

export default function ListaDeseos({ navigation }) {
  const [listaDeseos, setListaDeseos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const favoritos = await getFavoritos();
      setListaDeseos(favoritos.data || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar tu lista de deseos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    cargar();
  }, [cargar]));

  const handleEliminar = async (id_libro) => {
    Alert.alert('Quitar de la lista', '¿Quitar este libro de tu lista de deseos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive', onPress: async () => {
          try {
            await removeFavorito(id_libro);
            setListaDeseos(prev => prev.filter(f => f.id_libro !== id_libro));
          } catch {
            Alert.alert('Error', 'No se pudo quitar el libro de la lista.');
          }
        }
      }
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#7A1E3A" /></View>;

  if (listaDeseos.length === 0) return (
    <View style={s.center}>
      <Text style={s.emptyIcon}>🤍</Text>
      <Text style={s.emptyTitle}>Tu lista de deseos está vacía</Text>
      <Text style={s.emptySubtitle}>Agrega libros a tu lista mientras navegas el catálogo.</Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('PostLogin')}>
        <Text style={s.btnText}>Explorar catálogo</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      <Text style={s.header}>Lista de Deseos ({listaDeseos.length})</Text>
      <FlatList
        data={listaDeseos}
        keyExtractor={item => String(item.id_libro)}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.imagen_url ? (
              <Image source={{ uri: item.imagen_url.startsWith('http') ? item.imagen_url : `${getApiBaseUrl()}${item.imagen_url}` }} style={s.cover} />
            ) : (
              <View style={[s.cover, s.coverPlaceholder]}>
                <Text style={{ fontSize: 28 }}>📚</Text>
              </View>
            )}
            <View style={s.info}>
              <Text style={s.titulo} numberOfLines={2}>{item.titulo}</Text>
              <Text style={s.autor} numberOfLines={1}>{item.autor_libro}</Text>
              <Text style={s.precio}>${parseFloat(item.precio_libro || 0).toLocaleString('es-CO')}</Text>
              <View style={s.actions}>
                <TouchableOpacity style={s.detailBtn} onPress={() => navigation.navigate('BookDetail', { book: item })}>
                  <Text style={s.detailBtnText}>Ver detalle</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEliminar(item.id_libro)} style={s.deleteBtn}>
                  <Text style={s.deleteBtnText}>Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5', paddingHorizontal: 16, paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5', padding: 24 },
  header: { fontSize: 20, fontWeight: '700', color: '#7A1E3A', marginBottom: 14 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  btn: { backgroundColor: '#7A1E3A', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cover: { width: 70, height: 100 },
  coverPlaceholder: { backgroundColor: '#f0e8ec', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  titulo: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 4 },
  autor: { fontSize: 13, color: '#666', marginBottom: 6 },
  precio: { fontSize: 16, fontWeight: '800', color: '#7A1E3A' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 9 },
  detailBtn: { backgroundColor: '#7A1E3A', borderRadius: 7, paddingVertical: 7, paddingHorizontal: 10 },
  detailBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  deleteBtn: { borderWidth: 1, borderColor: '#C5425A', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 10 },
  deleteBtnText: { color: '#C5425A', fontSize: 11, fontWeight: '800' },
});
