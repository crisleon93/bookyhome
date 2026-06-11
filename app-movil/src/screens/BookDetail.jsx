import React, { useContext, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';

export default function BookDetail({ route, navigation }) {
  const { book } = route.params;
  const { addToCart } = useContext(CartContext);
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(book);
    setAdding(false);
    Alert.alert(
      'Carrito',
      '¡Libro agregado al carrito con éxito!',
      [
        { text: 'Seguir mirando', style: 'cancel' },
        { text: 'Ver Carrito', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {book.imagen ? (
          <Image source={{ uri: book.imagen }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <Text style={styles.title}>{book.titulo || 'Sin título'}</Text>
        <Text style={styles.author}>{book.autor_libro || book.autor || ''}</Text>
        
        <Text style={styles.price}>
          ${Number(book.precio_libro || book.precio || 0).toLocaleString('es-CO')} COP
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>
          {book.descripcion_libro || book.descripcion || 'Sin descripción disponible para este libro.'}
        </Text>

        <TouchableOpacity 
          style={[styles.button, adding && styles.buttonDisabled]} 
          onPress={handleAddToCart}
          disabled={adding}
        >
          <Text style={styles.buttonText}>{adding ? 'Agregando...' : 'Agregar al Carrito'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbfa', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, alignItems: 'center', marginBottom: 30 },
  image: { width: 160, height: 240, borderRadius: 8, marginBottom: 20 },
  imagePlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#2A2A2A', textAlign: 'center', marginBottom: 6 },
  author: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 12 },
  price: { fontSize: 20, fontWeight: '700', color: '#C5425A', marginBottom: 20 },
  divider: { width: '100%', height: 1, backgroundColor: '#e0dbd4', marginVertical: 15 },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 16, fontWeight: '700', color: '#2A2A2A', marginBottom: 8 },
  description: { alignSelf: 'flex-start', fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 25 },
  button: { backgroundColor: '#7A1E3A', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
