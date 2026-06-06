import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Button, ActivityIndicator, Alert, TextInput } from 'react-native';
import { getBookAvailability, getBookOffer } from '../services/api';
import { CartContext } from '../context/CartContext';

export default function BookDetail({ route }) {
  const { book } = route.params || {};
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState(null);
  const { addItem } = useContext(CartContext);

  const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1);

  useEffect(() => {
    const loadOffer = async () => {
      if (!book?.id_libro) return;
      try {
        const res = await getBookOffer(book.id_libro);
        setOffer(res.data ?? null);
      } catch (err) {
        console.log('No active offer', err.message || err);
      }
    };
    loadOffer();
  }, [book]);

  const handleCheckAvailability = async () => {
    if (!book?.id_libro) return;
    setLoading(true);
    try {
      await getBookAvailability(book.id_libro, parsedQuantity);
      Alert.alert('Disponible', `Hay suficiente stock para ${parsedQuantity} unidad(es).`);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'No disponible';
      Alert.alert('No disponible', String(detail));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    const count = Math.max(1, parsedQuantity);
    addItem(book, count);
    Alert.alert('Agregado', `Agregaste ${count} unidad(es) al carrito.`);
  };

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No se encontró el libro.</Text>
      </View>
    );
  }

  const price = book.precio_libro ?? book.precio ?? book.price ?? 0;
  const discount = offer?.tipo === 'porcentaje'
    ? price * (offer.valor / 100)
    : offer?.tipo === 'fijo'
      ? offer.valor
      : 0;

  const finalPrice = offer ? Math.max(0, price - discount) : price;

  return (
    <View style={styles.container}>
      {book.imagen ? (
        <Image source={{ uri: book.imagen }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>No hay imagen</Text></View>
      )}
      <Text style={styles.title}>{book.titulo || book.nombre || 'Sin título'}</Text>
      <Text style={styles.author}>{book.autor_libro || book.autor || book.nombre_categoria || ''}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Precio:</Text>
        <Text style={styles.value}>${price}</Text>
      </View>
      {offer ? (
        <View style={styles.offerBox}>
          <Text style={styles.offerLabel}>Oferta activa</Text>
          <Text>{offer.nombre_oferta || 'Descuento activo'}</Text>
          <Text style={styles.offerValue}>{offer.tipo === 'porcentaje' ? `${offer.valor}%` : `$${offer.valor}`}</Text>
          <Text style={styles.offerFinal}>Precio con oferta: ${finalPrice.toFixed(2)}</Text>
        </View>
      ) : null}
      <Text style={styles.sectionTitle}>Descripción</Text>
      <Text style={styles.description}>{book.descripcion_libro || book.descripcion || 'No hay descripción disponible.'}</Text>
      <View style={styles.rowInput}>
        <Text style={styles.label}>Cantidad</Text>
        <TextInput
          keyboardType="numeric"
          value={String(quantity)}
          onChangeText={setQuantity}
          style={styles.quantityInput}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loading} />
      ) : (
        <>
          <Button title="Verificar disponibilidad" onPress={handleCheckAvailability} />
          <View style={styles.separator} />
          <Button title="Agregar al carrito" onPress={handleAddToCart} />
        </>
      )}
      <Text style={styles.stock}>Stock disponible: {book.stock ?? book.stock_libro ?? 'N/A'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  image: { width: '100%', height: 250, borderRadius: 10, marginBottom: 16, backgroundColor: '#eee' },
  imagePlaceholder: { width: '100%', height: 250, borderRadius: 10, marginBottom: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  placeholderText: { color: '#888' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  author: { color: '#666', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontWeight: '700' },
  value: { color: '#111' },
  sectionTitle: { fontWeight: '700', marginBottom: 8, marginTop: 16 },
  description: { color: '#444', marginBottom: 16, lineHeight: 20 },
  rowInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  quantityInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, flex: 1, padding: 10, marginLeft: 12, textAlign: 'center' },
  loading: { marginVertical: 16 },
  offerBox: { padding: 12, backgroundColor: '#f8f0d9', borderRadius: 10, marginBottom: 16 },
  offerLabel: { fontWeight: '700', marginBottom: 4 },
  offerValue: { marginTop: 4, fontWeight: '700' },
  offerFinal: { marginTop: 8, color: '#d9534f', fontWeight: '700' },
  separator: { height: 10 },
  stock: { marginTop: 16, color: '#333' },
  error: { padding: 16, textAlign: 'center', color: '#d9534f' },
});
