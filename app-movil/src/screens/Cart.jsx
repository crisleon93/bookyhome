import React, { useCallback, useContext, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, SafeAreaView
} from 'react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { cancelOrder, checkoutCarrito, getApiBaseUrl, getDirecciones, getOrdenes } from '../services/api';

export default function Cart({ navigation }) {
  const { cart, removeFromCart, clearCart, loadCart, loading } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [direcciones, setDirecciones] = useState([]);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState(null);
  const [direccionesLoading, setDireccionesLoading] = useState(true);
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [addressNoticeVisible, setAddressNoticeVisible] = useState(false);

  const cargarDirecciones = useCallback(async () => {
    setDireccionesLoading(true);
    try {
      const response = await getDirecciones();
      const disponibles = response.data || [];
      setDirecciones(disponibles);
      setDireccionSeleccionadaId((actual) => actual || disponibles.find((item) => item.es_principal)?.id_direccion || disponibles[0]?.id_direccion || null);
    } catch (error) {
      Alert.alert('Direcciones', error.response?.data?.detail || 'No se pudieron cargar tus direcciones de entrega.');
    } finally {
      setDireccionesLoading(false);
    }
  }, []);

  const cargarOrdenesPendientes = useCallback(async () => {
    try {
      const response = await getOrdenes();
      setOrdenesPendientes((response.data || []).filter((orden) => orden.estado === 'pendiente'));
    } catch (error) {
      console.log('No se pudieron cargar las órdenes pendientes', error.message);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    cargarDirecciones();
    loadCart();
    cargarOrdenesPendientes();
  }, [cargarDirecciones, cargarOrdenesPendientes, loadCart]));

  const total = cart.reduce(
    (acc, item) => acc + Number(item.precio_libro || item.precio || 0) * Number(item.cantidad || 1),
    0
  );

  const handleCheckout = async () => {
    if (!direccionSeleccionadaId) {
      setAddressNoticeVisible(true);
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await checkoutCarrito({ id_direccion: Number(direccionSeleccionadaId) });
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

  const handleCancelarOrden = (orderId) => {
    Alert.alert('Cancelar compra', '¿Seguro que deseas cancelar esta orden pendiente?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
          try {
            await cancelOrder(orderId);
            await cargarOrdenesPendientes();
          } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || 'No se pudo cancelar la compra.');
          }
        }
      }
    ]);
  };

  const renderOrdenPendiente = (orden) => (
    <View key={orden.id_orden} style={styles.pendingCard}>
      <Text style={styles.pendingTitle}>Orden pendiente de pago</Text>
      <Text style={styles.pendingText}>Orden #{orden.id_orden} · ${Number(orden.total || 0).toLocaleString('es-CO')} COP</Text>
      <View style={styles.pendingActions}>
        <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.navigate('Checkout', { orderId: orden.id_orden })}>
          <Text style={styles.continueBtnText}>Continuar pago</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => handleCancelarOrden(orden.id_orden)}>
          <Text style={styles.cancelOrderBtnText}>Cancelar compra</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

  if (cart.length === 0 && ordenesPendientes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIllustration}>🛒</Text>
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySubtitle}>Agrega libros que te interesen y regresa aquí para comprarlos.</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('PostLogin')}>
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
        ListHeaderComponent={ordenesPendientes.length ? (
          <View style={styles.pendingList}>{ordenesPendientes.map(renderOrdenPendiente)}</View>
        ) : null}
        ListEmptyComponent={ordenesPendientes.length ? (
          <Text style={styles.cartEmptyWithPending}>No tienes productos en el carrito.</Text>
        ) : null}
      />

      {/* Footer pegado al fondo */}
      {cart.length > 0 && <View style={styles.footer}>
        <Text style={styles.deliveryLabel}>Dirección de entrega</Text>
        {direccionesLoading ? <ActivityIndicator color="#7A1E3A" /> : direcciones.length === 0 ? (
          <Text style={styles.deliveryEmpty}>Aún no tienes direcciones registradas.</Text>
        ) : (
          <View style={styles.addressList}>
            {direcciones.map((direccion) => (
              <TouchableOpacity
                key={direccion.id_direccion}
                style={[styles.addressOption, Number(direccionSeleccionadaId) === Number(direccion.id_direccion) && styles.addressOptionSelected]}
                onPress={() => setDireccionSeleccionadaId(direccion.id_direccion)}
              >
                <Text style={styles.addressOptionTitle}>{direccion.alias_direccion || 'Dirección'}{direccion.es_principal ? ' · Principal' : ''}</Text>
                <Text style={styles.addressOptionText}>{direccion.direccion}, {direccion.ciudad}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('Direcciones')}>
          <Text style={styles.addAddressBtnText}>Administrar direcciones</Text>
        </TouchableOpacity>
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
      }

      <Modal visible={addressNoticeVisible} transparent animationType="fade" onRequestClose={() => setAddressNoticeVisible(false)}>
        <View style={styles.noticeOverlay}>
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}><Text style={styles.noticeIconText}>⌂</Text></View>
            <Text style={styles.noticeTitle}>Dirección requerida</Text>
            <Text style={styles.noticeText}>Agrega o selecciona una dirección de entrega antes de continuar al pago.</Text>
            <TouchableOpacity style={styles.noticePrimaryBtn} onPress={() => { setAddressNoticeVisible(false); navigation.navigate('Direcciones'); }}>
              <Text style={styles.noticePrimaryText}>Agregar dirección</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.noticeSecondaryBtn} onPress={() => setAddressNoticeVisible(false)}>
              <Text style={styles.noticeSecondaryText}>Ahora no</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7A1E3A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#7A1E3A' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#FFFFFF' },

  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  separator: { height: 12 },
  pendingList: { marginBottom: 18 },
  pendingCard: { backgroundColor: '#FFF8EA', borderWidth: 1, borderColor: '#F0B642', borderRadius: 12, padding: 14, marginBottom: 10 },
  pendingTitle: { color: '#9B5B00', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  pendingText: { color: '#6E5A37', fontSize: 13, marginBottom: 12 },
  pendingActions: { flexDirection: 'row', gap: 8 },
  continueBtn: { flex: 1, backgroundColor: '#7A1E3A', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cancelOrderBtn: { flex: 1, borderWidth: 1, borderColor: '#C5425A', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  cancelOrderBtnText: { color: '#C5425A', fontSize: 12, fontWeight: '800' },
  cartEmptyWithPending: { color: '#777', textAlign: 'center', paddingTop: 20, fontSize: 14 },
  noticeOverlay: { flex: 1, backgroundColor: 'rgba(42, 18, 28, 0.48)', justifyContent: 'center', padding: 28 },
  noticeCard: { backgroundColor: '#fff', borderRadius: 18, padding: 26, alignItems: 'center', borderWidth: 2, borderColor: '#7A1E3A', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, elevation: 8 },
  noticeIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#7A1E3A', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  noticeIconText: { color: '#fff', fontSize: 27, fontWeight: '800' },
  noticeTitle: { color: '#7A1E3A', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  noticeText: { color: '#62555A', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  noticePrimaryBtn: { width: '100%', backgroundColor: '#7A1E3A', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  noticePrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  noticeSecondaryBtn: { paddingVertical: 13, marginTop: 4 },
  noticeSecondaryText: { color: '#75676C', fontSize: 14, fontWeight: '700' },

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
    backgroundColor: '#7A1E3A', padding: 32,
  },
  emptyIllustration: { fontSize: 72, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
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
  deliveryLabel: { fontSize: 14, fontWeight: '700', color: '#2A2A2A', marginBottom: 8 },
  deliveryEmpty: { color: '#8B1E3F', fontSize: 13, marginBottom: 8 },
  addressList: { gap: 8, marginBottom: 8 },
  addressOption: { borderWidth: 1, borderColor: '#E0DBD4', borderRadius: 9, padding: 10, backgroundColor: '#fff' },
  addressOptionSelected: { borderColor: '#7A1E3A', backgroundColor: '#FDF0F2' },
  addressOptionTitle: { fontSize: 13, fontWeight: '700', color: '#2A2A2A' },
  addressOptionText: { fontSize: 12, color: '#666', marginTop: 2 },
  addAddressBtn: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 8 },
  addAddressBtnText: { color: '#7A1E3A', fontSize: 13, fontWeight: '700' },
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
