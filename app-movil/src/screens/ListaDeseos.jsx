import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getListaDeseos, removeFromListaDeseos } from '../services/api';

export default function ListaDeseos({ navigation }) {
  const { token } = useContext(AuthContext);
  const [listaDeseos, setListaDeseos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getListaDeseos();
      setListaDeseos(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar tu lista de deseos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id_libro) => {
    Alert.alert('Quitar de la lista', '¿Quitar este libro de tu lista de deseos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive', onPress: async () => {
          try {
            await removeFromListaDeseos(id_libro);
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
          <TouchableOpacity
            style={s.card}
            onPress={() => navigation.navigate('BookDetail', { id: item.id_libro })}
            activeOpacity={0.85}
          >
            {item.imagen_portada ? (
              <Image source={{ uri: item.imagen_portada }} style={s.cover} />
            ) : (
              <View style={[s.cover, s.coverPlaceholder]}>
                <Text style={{ fontSize: 28 }}>📚</Text>
              </View>
            )}
            <View style={s.info}>
              <Text style={s.titulo} numberOfLines={2}>{item.titulo}</Text>
              <Text style={s.autor} numberOfLines={1}>{item.autor}</Text>
              <Text style={s.precio}>${parseFloat(item.precio || 0).toLocaleString('es-CO')}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEliminar(item.id_libro)} style={s.deleteBtn}>
              <Text style={{ fontSize: 20 }}>🗑</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
  deleteBtn: { padding: 12, justifyContent: 'center', alignItems: 'center' },
});
