import React, { useContext, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';
import { checkoutCarrito } from '../services/api';

export default function Cart({ navigation }) {
  const { cart, removeFromCart, clearCart, loading } = useContext(CartContext);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const total = cart.reduce((acc, item) => acc + (Number(item.precio_libro || item.precio || 0) * Number(item.cantidad || 1)), 0);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await checkoutCarrito();
      if (res.data && res.data.ok) {
        const orderId = res.data.order.id_orden;
        // Navegar a la pantalla de pago
        navigation.navigate('Checkout', { orderId });
      } else {
        Alert.alert('Error', 'No pudimos crear tu orden de compra.');
      }
    } catch (e) {
      console.log('Checkout error', e.message);
      Alert.alert('Error', e.response?.data?.detail || 'Ocurrió un error al procesar el checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>
        <Text style={styles.author}>{item.autor_libro}</Text>
        <Text style={styles.qty}>Cantidad: {item.cantidad}</Text>
        <Text style={styles.price}>
          ${Number(item.precio_libro * item.cantidad).toLocaleString('es-CO')}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id_libro)}>
        <Text style={styles.removeText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A1E3A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tu carrito está vacío</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopBtnText}>Explorar Libros</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => String(item.id_libro)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a pagar:</Text>
              <Text style={styles.totalValue}>
                ${total.toLocaleString('es-CO')} COP
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.checkoutBtn, checkoutLoading && styles.disabledBtn]} 
              onPress={handleCheckout}
              disabled={checkoutLoading}
            >
              <Text style={styles.checkoutBtnText}>
                {checkoutLoading ? 'Procesando...' : 'Proceder al Pago'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
              <Text style={styles.clearBtnText}>Vaciar Carrito</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbfa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, alignItems: 'center' },
  image: { width: 60, height: 90, borderRadius: 4, marginRight: 12, backgroundColor: '#eee' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#2A2A2A', marginBottom: 2 },
  author: { fontSize: 13, color: '#666', marginBottom: 4 },
  qty: { fontSize: 12, color: '#888', marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '600', color: '#C5425A' },
  removeBtn: { padding: 8, justifyContent: 'center' },
  removeText: { color: '#d9534f', fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 20 },
  shopBtn: { backgroundColor: '#7A1E3A', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 6 },
  shopBtnText: { color: '#fff', fontWeight: '700' },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e0dbd4', borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#2A2A2A' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#C5425A' },
  checkoutBtn: { backgroundColor: '#7A1E3A', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  disabledBtn: { opacity: 0.7 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  clearBtn: { paddingVertical: 10, alignItems: 'center' },
  clearBtnText: { color: '#666', fontSize: 14, fontWeight: '500' },
});
