import React, { useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';

export default function Cart() {
  const { items, loading, updateQuantity, removeItem, clearCart, totalAmount } = useContext(CartContext);

  const renderItem = ({ item }) => {
    const title = item.titulo || item.nombre || item.autor_libro || 'Libro';
    const quantity = item.cantidad ?? 1;
    const price = item.precio_libro ?? item.precio ?? 0;
    const total = quantity * price;

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {item.autor_libro ? <Text style={styles.subtitle}>Autor: {item.autor_libro}</Text> : null}
        <Text>Cantidad: {quantity}</Text>
        <Text>Precio: ${price.toFixed(2)}</Text>
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        <View style={styles.cardActions}>
          <Button
            title="-"
            onPress={() => updateQuantity(item.id, Math.max(1, quantity - 1))}
          />
          <Button title="Quitar" color="#d9534f" onPress={() => removeItem(item.id)} />
          <Button title="+" onPress={() => updateQuantity(item.id, quantity + 1)} />
        </View>
      </View>
    );
  };

  const handleCheckout = () => {
    if (!items.length) {
      Alert.alert('Carrito vacío', 'Añade productos antes de pagar.');
      return;
    }

    Alert.alert(
      'Checkout',
      'Función de pago aún no está disponible. El carrito local guarda tus productos.',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Carrito</Text>
      {loading ? (
        <Text style={styles.loading}>Cargando carrito...</Text>
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>El carrito está vacío.</Text>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item, index) => String(item.id || index)}
            renderItem={renderItem}
          />
          <View style={styles.summary}>
            <Text style={styles.summaryText}>Total a pagar: ${totalAmount.toFixed(2)}</Text>
            <Button title="Finalizar compra" onPress={handleCheckout} />
            <View style={{ height: 10 }} />
            <Button title="Vaciar carrito" color="#d9534f" onPress={clearCart} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pageTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
  title: { fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 4 },
  total: { marginTop: 8, fontWeight: '700' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 24 },
  loading: { marginTop: 24 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  summary: { padding: 12, borderTopWidth: 1, borderColor: '#eee', marginTop: 12 },
  summaryText: { fontSize: 18, fontWeight: '700' },
});
