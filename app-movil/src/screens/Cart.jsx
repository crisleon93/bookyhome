import React, { useContext, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { checkoutCarrito, getApiBaseUrl } from '../services/api';

export default function Cart({ navigation }) {
  const { cart, removeFromCart, clearCart, loading } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const total = cart.reduce(
    (acc, item) => acc + Number(item.precio_libro || item.precio || 0) * Number(item.cantidad || 1),
    0
  );

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await checkoutCarrito();
      if (res.data && res.data.ok) {
        navigation.navigate('Checkout', { orderId: res.data.order.id_orden });
      } else {
        Alert.alert('Error', 'No pudimos crear tu orden de compra.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Ocurrió un error al procesar el checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getImageUri = (item) => {
    const raw = item.imagen_url || item.imagen;
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    return `${getApiBaseUrl()}${raw}`;
  };

  const renderItem = ({ item, index }) => {
    const uri = getImageUri(item);
    const isDigital = item.variante_label?.toLowerCase().includes('digital')
      || item.tipo_tapa?.toLowerCase() === 'digital';

    return (
      <View style={styles.card}>
        {/* Imagen con fallback */}
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.fallbackIcon}>📚</Text>
          </View>
        )}

        {/* Badge Digital */}
        {isDigital && (
          <View style={styles.digitalBadge}>
            <Text style={styles.digitalBadgeText}>Digital</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.titulo || 'Sin título'}</Text>
          <Text style={styles.author} numberOfLines={1}>{item.autor_libro || item.autor || ''}</Text>
          {item.variante_label ? (
            <Text style={styles.variantLabel}>{item.variante_label}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>×{item.cantidad || 1}</Text>
            </View>
            <Text style={styles.price}>
              ${Number((item.precio_libro || item.precio || 0) * (item.cantidad || 1)).toLocaleString('es-CO')}
            </Text>
          </View>
        </View>

        {/* Eliminar */}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeFromCart(item.id_libro)}
        >
          <Text style={styles.removeIcon}>🗑</Text>
          <Text style={styles.removeText}>Quitar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A1E3A" />
        <Text style={styles.loadingText}>Cargando carrito...</Text>
      </View>
    );
  }

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIllustration}>🛒</Text>
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySubtitle}>Agrega libros que te interesen y regresa aquí para comprarlos.</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.shopBtnText}>Explorar Libros</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(item, i) => String(item.id_libro || i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Footer pegado al fondo */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>${total.toLocaleString('es-CO')} COP</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, checkoutLoading && styles.disabledBtn]}
          onPress={handleCheckout}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutBtnText}>Proceder al Pago</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
          <Text style={styles.clearBtnText}>Vaciar carrito</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4f1' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f4f1' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },

  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  separator: { height: 12 },

  /* Tarjeta de producto */
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7A1E3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  image: {
    width: 68,
    height: 96,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#f0ebe7',
  },
  imageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: { fontSize: 28 },

  digitalBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#2e7d32',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  digitalBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 3, lineHeight: 20 },
  author: { fontSize: 12, color: '#888', marginBottom: 4 },
  variantLabel: { fontSize: 11, color: '#7A1E3A', fontWeight: '600', marginBottom: 6 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  qtyBadge: {
    backgroundColor: '#f0ebe7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qtyText: { fontSize: 12, color: '#7A1E3A', fontWeight: '700' },
  price: { fontSize: 15, fontWeight: '800', color: '#C5425A' },

  /* Botón eliminar */
  removeBtn: { alignItems: 'center', paddingLeft: 10, gap: 2 },
  removeIcon: { fontSize: 18 },
  removeText: { fontSize: 10, color: '#ccc', fontWeight: '600' },

  /* Estado vacío */
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f7f4f1', padding: 32,
  },
  emptyIllustration: { fontSize: 72, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#2A2A2A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  shopBtn: {
    backgroundColor: '#7A1E3A', paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 10, shadowColor: '#7A1E3A', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  /* Footer */
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: '#ede8e3',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#555' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#C5425A' },

  checkoutBtn: {
    backgroundColor: '#7A1E3A', paddingVertical: 15, borderRadius: 12,
    alignItems: 'center', marginBottom: 12,
    shadowColor: '#7A1E3A', shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  disabledBtn: { opacity: 0.65 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  clearBtn: { paddingVertical: 8, alignItems: 'center' },
  clearBtnText: { color: '#bbb', fontSize: 13, fontWeight: '500' },
});
