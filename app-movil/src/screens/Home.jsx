import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { getBooks } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Home({ navigation }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { signOut } = useContext(AuthContext);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const res = await getBooks();
        setBooks(res.data || []);
      } catch (e) {
        console.log('Error fetching libros', e.message);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BookDetail', { book: item })}>
      {item.imagen ? <Image source={{ uri: item.imagen }} style={styles.image} /> : <View style={[styles.image, styles.imagePlaceholder]} />}
      <View style={styles.info}>
        <Text style={styles.title}>{item.titulo || item.nombre || 'Sin título'}</Text>
        <Text style={styles.author}>{item.autor_libro || item.autor || item.nombre_categoria || ''}</Text>
        <Text style={styles.price}>${item.precio ?? '0.00'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="Carrito" onPress={() => navigation.navigate('Cart')} />
        <Button title="Cerrar sesión" onPress={signOut} color="#d9534f" />
      </View>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loading} />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id_libro || item.id || item.id_producto || Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
  image: { width: 70, height: 100, marginRight: 12, backgroundColor: '#ddd', borderRadius: 6 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  author: { color: '#666', marginBottom: 6 },
  price: { color: '#111', fontWeight: '600' },
  loading: { marginTop: 40 },
});
