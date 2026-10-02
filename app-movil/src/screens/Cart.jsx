import React, { useCallback, useContext, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { cancelOrder, checkoutCarrito, getApiBaseUrl, getDirecciones, getOrdenes } from '../services/api';
import { IconCart } from '../components/Icons';

function PendingOrderIcon({ type, color = 'currentColor', size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      {type === 'details' && <><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/></>}
      {type === 'pay' && <><Rect x="1" y="4" width="22" height="16" rx="2"/><Line x1="1" y1="10" x2="23" y2="10"/></>}
      {type === 'cancel' && <><Circle cx="12" cy="12" r="10"/><Line x1="15" y1="9" x2="9" y2="15"/><Line x1="9" y1="9" x2="15" y2="15"/></>}
      {type === 'pending' && <><Circle cx="12" cy="12" r="10"/><Path d="M12 6v6l4 2"/></>}
      {type === 'alert' && <><Circle cx="12" cy="12" r="10"/><Line x1="12" y1="8" x2="12" y2="12"/><Line x1="12" y1="16" x2="12.01" y2="16"/></>}
    </Svg>
  );
}

export default function Cart({ navigation }) {
  const { cart, removeFromCart, clearCart, loadCart, loading } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [direcciones, setDirecciones] = useState([]);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState(null);
  const [direccionesLoading, setDireccionesLoading] = useState(true);
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [addressNoticeVisible, setAddressNoticeVisible] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState(null);
  const [ordenACancelar, setOrdenACancelar] = useState(null);
  const [cancelandoOrden, setCancelandoOrden] = useState(false);

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
      setOrdenesPendientes((response.data || []).filter((orden) => {
        const estado = String(orden.estado || orden.estado_orden || '').toLowerCase().trim();
        return estado === 'pendiente' || estado === 'pendiente de pago' || estado.startsWith('pend');
      }));
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

  const handleConfirmarCancelarOrden = async () => {
    if (!ordenACancelar) return;
    setCancelandoOrden(true);
    try {
      const orderId = ordenACancelar.id_orden_db || ordenACancelar.id_orden;
      await cancelOrder(orderId, 'Cancelación de orden pendiente');
      setOrdenACancelar(null);
      await cargarOrdenesPendientes();
      Alert.alert('Información', 'Orden cancelada correctamente.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo cancelar la orden');
    } finally {
      setCancelandoOrden(false);
    }
  };

  const renderOrdenPendiente = (orden) => (
    <View key={orden.id_orden} style={styles.pendingCard}>
      <View style={styles.pendingHeading}>
        <View style={styles.pendingIcon}><PendingOrderIcon type="pending" color="#B45309" size={21} /></View>
        <View style={styles.pendingCopy}>
          <Text style={styles.pendingTitle}>Tienes una orden pendiente de pago</Text>
          <View style={styles.pendingMeta}>
            <Text style={styles.pendingId}>Orden #{orden.id_orden_db || orden.id_orden}</Text>
            <Text style={styles.pendingTotal}>${Number(orden.total || 0).toLocaleString('es-CO')} COP</Text>
            <Text style={styles.pendingCount}>· {orden.items?.length || 0} producto(s)</Text>
          </View>
        </View>
      </View>
      <View style={styles.pendingActions}>
        <TouchableOpacity style={styles.detailsBtn} onPress={() => setOrdenDetalle(orden)}>
          <PendingOrderIcon type="details" color="#B45309" />
          <Text style={styles.detailsBtnText}>Ver detalles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.navigate('Checkout', { orderId: orden.id_orden_db || orden.id_orden })}>
          <PendingOrderIcon type="pay" color="#FFFFFF" />
          <Text style={styles.continueBtnText}>Continuar al Pago</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => setOrdenACancelar(orden)}>
          <PendingOrderIcon type="cancel" color="#DC2626" />
          <Text style={styles.cancelOrderBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrdenItem = (item, index) => {
    const uri = getImageUri(item);
    const quantity = Number(item.cantidad || 1);
    const unitPrice = Number(item.precio_libro || item.precio || 0);
    return (
      <View key={`${item.id_libro || item.id || index}`} style={styles.orderDetailItem}>
        {uri ? <Image source={{ uri }} style={styles.orderDetailImage} resizeMode="cover" /> : (
          <View style={[styles.orderDetailImage, styles.imageFallback]}><Text style={styles.fallbackIcon}>📚</Text></View>
        )}
        <View style={styles.orderDetailCopy}>
          <Text style={styles.orderDetailTitle}>{item.titulo || 'Sin título'}</Text>
          <Text style={styles.orderDetailAuthor}>{item.autor_libro || 'Segunda mano'}</Text>
          <Text style={styles.orderDetailQuantity}>Cant: {quantity}</Text>
        </View>
        <View style={styles.orderDetailPrices}>
          <Text style={styles.orderDetailUnit}>c/u ${unitPrice.toLocaleString('es-CO')}</Text>
          <Text style={styles.orderDetailTotal}>${(unitPrice * quantity).toLocaleString('es-CO')}</Text>
        </View>
      </View>
    );
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
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>En stock · Entrega disponible</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.titulo || 'Sin título'}</Text>
          <Text style={styles.author} numberOfLines={1}>{item.autor_libro || item.autor || ''}</Text>
          {item.variante_label ? (
            <Text style={styles.variantLabel}>{item.variante_label}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.unitPrice}>Cantidad: <Text style={styles.qtyText}>{item.cantidad || 1}</Text></Text>
            <Text style={styles.unitPrice}>Unitario: <Text style={styles.unitPriceStrong}>${Number(item.precio_libro || item.precio || 0).toLocaleString('es-CO')}</Text></Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <Text style={styles.price}>
            ${Number((item.precio_libro || item.precio || 0) * (item.cantidad || 1)).toLocaleString('es-CO')}
          </Text>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeFromCart(item.id_libro)}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${item.titulo || 'libro'} del carrito`}
          >
            <Text style={styles.removeText}>Quitar</Text>
          </TouchableOpacity>
        </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(item, i) => String(item.id_libro || i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={(
          <View>
            <View style={styles.pageHeader}>
              <View style={styles.pageHeadingRow}>
                <View style={styles.headerIcon}><IconCart size={24} color="#7A1E3A" /></View>
                <View style={styles.headerCopy}>
                  <View style={styles.titleCountRow}>
                    <Text style={styles.pageTitle}>Mi Carrito</Text>
                    {cart.length > 0 && <Text style={styles.countBadge}>{cart.length} {cart.length === 1 ? 'libro' : 'libros'}</Text>}
                  </View>
                  <Text style={styles.pageSubtitle}>Revisa tus lecturas antes de continuar al pago seguro.</Text>
                </View>
              </View>
              <View style={styles.stepper}>
                <View style={styles.stepActive}><Text style={styles.stepActiveText}>1. Carrito</Text></View>
                <Text style={styles.stepArrow}>›</Text>
                <View style={styles.stepInactive}><Text style={styles.stepInactiveText}>2. Entrega y Pago</Text></View>
              </View>
            </View>
            {ordenesPendientes.length > 0 && (
              <View style={styles.pendingList}>{ordenesPendientes.map(renderOrdenPendiente)}</View>
            )}
            {cart.length > 0 && (
              <View style={styles.listHeading}>
                <View style={styles.listHeadingCopy}>
                  <Text style={styles.listTitle}>Libros en tu carrito</Text>
                  <Text style={styles.listSubtitle}>Verifica tus ejemplares antes de continuar</Text>
                </View>
                <TouchableOpacity style={styles.addBooksBtn} onPress={() => navigation.navigate('Catalogo')}>
                  <Text style={styles.addBooksText}>+ Agregar más</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={ordenesPendientes.length ? (
          <Text style={styles.cartEmptyWithPending}>No tienes productos en el carrito.</Text>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}><Text style={styles.emptyIllustration}>🛒</Text></View>
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptySubtitle}>Explora el catálogo y encuentra tu próxima lectura favorita.</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Catalogo')}>
              <Text style={styles.shopBtnText}>Ir al catálogo</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={cart.length > 0 ? (
          <View style={styles.deliveryCard}>
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
          </View>
        ) : null}
      />

      {/* Resumen fijo al fondo */}
      {cart.length > 0 && <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({cart.length} {cart.length === 1 ? 'libro' : 'libros'})</Text>
          <Text style={styles.summaryValue}>${total.toLocaleString('es-CO')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryMuted}>Envío</Text>
          <Text style={styles.shippingNote}>Se calcula al confirmar</Text>
        </View>
        <View style={styles.totalRow}>
          <View><Text style={styles.totalLabel}>Total estimado</Text><Text style={styles.taxNote}>IVA $0 · Libros exentos</Text></View>
          <Text style={styles.totalValue}>${total.toLocaleString('es-CO')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, checkoutLoading && styles.disabledBtn]}
          onPress={handleCheckout}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutBtnText}>Continuar con el pago  ›</Text>
          )}
        </TouchableOpacity>
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.continueShoppingBtn} onPress={() => navigation.navigate('Catalogo')}>
            <Text style={styles.continueShoppingText}>📖  Seguir comprando</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
            <Text style={styles.clearBtnText}>Vaciar</Text>
          </TouchableOpacity>
        </View>
      </View>
      }

      <Modal visible={Boolean(ordenDetalle)} transparent animationType="fade" onRequestClose={() => setOrdenDetalle(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderIcon}><PendingOrderIcon type="pending" color="#B45309" size={19} /></View>
              <View style={styles.detailHeaderCopy}>
                <Text style={styles.detailTitle}>Orden #{ordenDetalle?.id_orden_db || ordenDetalle?.id_orden}</Text>
                <Text style={styles.detailSubtitle}>Pendiente de pago · {ordenDetalle?.items?.length || 0} producto(s)</Text>
              </View>
              <Text style={styles.detailOrderTotal}>${Number(ordenDetalle?.total || 0).toLocaleString('es-CO')}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setOrdenDetalle(null)} accessibilityRole="button" accessibilityLabel="Cerrar detalles">
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.detailItems}>
              {(ordenDetalle?.items || []).map(renderOrdenItem)}
              {(ordenDetalle?.items || []).length === 0 && <Text style={styles.emptyDetails}>No hay productos registrados en esta orden.</Text>}
              <View style={styles.detailSummary}>
                <Text style={styles.detailSummaryLabel}>Total de la orden</Text>
                <Text style={styles.detailSummaryValue}>${Number(ordenDetalle?.total || 0).toLocaleString('es-CO')} COP</Text>
              </View>
            </ScrollView>

            <View style={styles.detailFooter}>
              <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setOrdenDetalle(null)}>
                <Text style={styles.detailCloseText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailPayBtn}
                onPress={() => {
                  const orderId = ordenDetalle?.id_orden_db || ordenDetalle?.id_orden;
                  setOrdenDetalle(null);
                  navigation.navigate('Checkout', { orderId });
                }}
              >
                <PendingOrderIcon type="pay" color="#FFFFFF" size={13} />
                <Text style={styles.detailPayText}>Continuar al Pago</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(ordenACancelar)} transparent animationType="fade" onRequestClose={() => !cancelandoOrden && setOrdenACancelar(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModal}>
            <TouchableOpacity
              style={styles.cancelModalClose}
              onPress={() => setOrdenACancelar(null)}
              disabled={cancelandoOrden}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Text style={styles.cancelModalCloseText}>×</Text>
            </TouchableOpacity>
            <View style={styles.cancelAlertIcon}><PendingOrderIcon type="alert" color="#DC2626" size={28} /></View>
            <Text style={styles.cancelModalTitle}>¿Cancelar compra?</Text>
            <Text style={styles.cancelModalText}>
              ¿Estás seguro de que deseas cancelar la <Text style={styles.cancelModalOrder}>Orden #{ordenACancelar?.id_orden_db || ordenACancelar?.id_orden}</Text>?
            </Text>
            <Text style={styles.cancelModalHint}>Esta acción anulará la orden pendiente de pago.</Text>
            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={[styles.keepOrderBtn, cancelandoOrden && styles.disabledBtn]}
                onPress={() => setOrdenACancelar(null)}
                disabled={cancelandoOrden}
              >
                <Text style={styles.keepOrderText}>No, mantener</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, cancelandoOrden && styles.disabledBtn]}
                onPress={handleConfirmarCancelarOrden}
                disabled={cancelandoOrden}
              >
                {cancelandoOrden ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.confirmCancelText}>Sí, cancelar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 },
  separator: { height: 12 },
  pageHeader: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 16 },
  pageHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#FDF2F4', borderWidth: 1, borderColor: '#FBCFE8', alignItems: 'center', justifyContent: 'center' },
  headerIconText: { fontSize: 22 },
  headerCopy: { flex: 1, minWidth: 0 },
  titleCountRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  countBadge: { overflow: 'hidden', backgroundColor: '#7A1E3A', color: '#FFFFFF', fontSize: 11, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 14 },
  pageSubtitle: { marginTop: 4, color: '#6B7280', fontSize: 12, lineHeight: 17 },
  stepper: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 14, padding: 4, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F8F9FA' },
  stepActive: { backgroundColor: '#7A1E3A', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  stepActiveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  stepArrow: { color: '#9CA3AF', paddingHorizontal: 7, fontSize: 19, lineHeight: 22 },
  stepInactive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 6 },
  stepInactiveText: { color: '#6B7280', fontSize: 11, fontWeight: '700' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  listHeadingCopy: { flex: 1, minWidth: 0 },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  listSubtitle: { marginTop: 3, color: '#6B7280', fontSize: 11 },
  addBooksBtn: { backgroundColor: '#FDF2F4', borderWidth: 1, borderColor: '#FBCFE8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  addBooksText: { color: '#7A1E3A', fontSize: 11, fontWeight: '800' },
  pendingList: { marginBottom: 16 },
  pendingCard: { backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#FDE68A', borderLeftWidth: 5, borderLeftColor: '#F59E0B', borderRadius: 14, padding: 13, marginBottom: 10, shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  pendingHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 13 },
  pendingIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D', alignItems: 'center', justifyContent: 'center' },
  pendingCopy: { flex: 1, minWidth: 0 },
  pendingTitle: { color: '#78350F', fontWeight: '800', fontSize: 13, marginBottom: 5 },
  pendingMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  pendingId: { color: '#B45309', fontSize: 10, fontWeight: '800', backgroundColor: '#FFFFFF', borderColor: '#FCD34D', borderWidth: 1, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  pendingTotal: { color: '#FFFFFF', backgroundColor: '#7A1E3A', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: '800' },
  pendingCount: { color: '#78716C', fontSize: 10, fontWeight: '600' },
  pendingActions: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  detailsBtn: { flex: 1, minHeight: 38, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#FCD34D', borderRadius: 9, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  detailsBtnText: { color: '#B45309', fontSize: 9, fontWeight: '800' },
  continueBtn: { flex: 1.2, minHeight: 38, backgroundColor: '#7A1E3A', borderRadius: 9, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, shadowColor: '#7A1E3A', shadowOpacity: 0.22, shadowRadius: 5, elevation: 2 },
  continueBtnText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  cancelOrderBtn: { flex: 0.8, minHeight: 38, borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FFFFFF', borderRadius: 9, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  cancelOrderBtnText: { color: '#DC2626', fontSize: 9, fontWeight: '800' },
  cartEmptyWithPending: { color: '#6B7280', textAlign: 'center', paddingVertical: 20, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.52)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  detailModal: { width: '100%', maxWidth: 560, maxHeight: '88%', overflow: 'hidden', borderRadius: 18, backgroundColor: '#FFFFFF', shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 18, elevation: 12 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailHeaderIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D', alignItems: 'center', justifyContent: 'center' },
  detailHeaderCopy: { flex: 1, minWidth: 0 },
  detailTitle: { color: '#111827', fontSize: 15, fontWeight: '800' },
  detailSubtitle: { color: '#9CA3AF', fontSize: 10, marginTop: 2 },
  detailOrderTotal: { color: '#FFFFFF', backgroundColor: '#7A1E3A', overflow: 'hidden', borderRadius: 16, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '800' },
  modalClose: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: '#6B7280', fontSize: 21, lineHeight: 24, fontWeight: '700' },
  detailItems: { paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  orderDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#FAFAF9', borderRadius: 11, borderWidth: 1, borderColor: '#F3F4F6' },
  orderDetailImage: { width: 60, height: 82, borderRadius: 7, backgroundColor: '#F3F4F6' },
  orderDetailCopy: { flex: 1, minWidth: 0 },
  orderDetailTitle: { color: '#111827', fontSize: 12, lineHeight: 16, fontWeight: '800' },
  orderDetailAuthor: { color: '#9CA3AF', fontSize: 10, marginTop: 3, marginBottom: 7 },
  orderDetailQuantity: { alignSelf: 'flex-start', color: '#6B7280', backgroundColor: '#F3F4F6', overflow: 'hidden', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, fontSize: 10, fontWeight: '700' },
  orderDetailPrices: { alignItems: 'flex-end', flexShrink: 0 },
  orderDetailUnit: { color: '#9CA3AF', fontSize: 9, marginBottom: 3 },
  orderDetailTotal: { color: '#7A1E3A', fontSize: 12, fontWeight: '900' },
  emptyDetails: { textAlign: 'center', color: '#6B7280', fontSize: 13, paddingVertical: 18 },
  detailSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 2 },
  detailSummaryLabel: { color: '#374151', fontSize: 13, fontWeight: '700' },
  detailSummaryValue: { color: '#7A1E3A', fontSize: 15, fontWeight: '900' },
  detailFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailCloseBtn: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 9, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  detailCloseText: { color: '#374151', fontSize: 12, fontWeight: '700' },
  detailPayBtn: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 13, borderRadius: 9, backgroundColor: '#7A1E3A' },
  detailPayText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  cancelModal: { width: '100%', maxWidth: 440, paddingHorizontal: 22, paddingTop: 27, paddingBottom: 20, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', position: 'relative', shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 18, elevation: 12 },
  cancelModalClose: { position: 'absolute', top: 8, right: 12, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  cancelModalCloseText: { color: '#888888', fontSize: 24, fontWeight: '500' },
  cancelAlertIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  cancelModalTitle: { color: '#2A2A2A', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  cancelModalText: { color: '#555555', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 7 },
  cancelModalOrder: { color: '#2A2A2A', fontWeight: '800' },
  cancelModalHint: { color: '#888888', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  cancelModalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  keepOrderBtn: { flex: 1, minHeight: 42, borderRadius: 8, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  keepOrderText: { color: '#374151', fontSize: 13, fontWeight: '700' },
  confirmCancelBtn: { flex: 1, minHeight: 42, borderRadius: 8, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  confirmCancelText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  noticeOverlay: { flex: 1, backgroundColor: 'rgba(42, 18, 28, 0.48)', justifyContent: 'center', padding: 28 },
  noticeCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 14, elevation: 8 },
  noticeIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#7A1E3A', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  noticeIconText: { color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  noticeTitle: { color: '#111827', fontSize: 19, fontWeight: '800', marginBottom: 8 },
  noticeText: { color: '#6B7280', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  noticePrimaryBtn: { width: '100%', backgroundColor: '#7A1E3A', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  noticePrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  noticeSecondaryBtn: { paddingVertical: 13, marginTop: 4 },
  noticeSecondaryText: { color: '#6B7280', fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: '#FAFAF9', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', position: 'relative' },
  image: { width: 72, height: 96, borderRadius: 8, marginRight: 12, backgroundColor: '#F3F4F6' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  fallbackIcon: { fontSize: 27 },
  digitalBadge: { position: 'absolute', top: 9, left: 9, backgroundColor: '#15803D', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  digitalBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  info: { flex: 1, minWidth: 0 },
  stockBadge: { alignSelf: 'flex-start', backgroundColor: '#DCFCE7', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 5 },
  stockBadgeText: { color: '#15803D', fontSize: 9, fontWeight: '800' },
  title: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 3, lineHeight: 19 },
  author: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  variantLabel: { fontSize: 10, color: '#7A1E3A', fontWeight: '700', marginBottom: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 3, marginTop: 3 },
  qtyText: { color: '#374151', fontWeight: '800' },
  unitPrice: { fontSize: 10, color: '#6B7280' },
  unitPriceStrong: { color: '#374151', fontWeight: '700' },
  itemActions: { alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginLeft: 8 },
  price: { fontSize: 14, fontWeight: '900', color: '#7A1E3A', textAlign: 'right' },
  removeBtn: { minHeight: 30, justifyContent: 'center', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 7, backgroundColor: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 5 },
  removeText: { fontSize: 10, color: '#DC2626', fontWeight: '800' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 24 },
  emptyIconWrap: { width: 74, height: 74, borderRadius: 22, backgroundColor: '#FDF2F4', borderWidth: 1, borderColor: '#FBCFE8', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIllustration: { fontSize: 36 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#2A2A2A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  shopBtn: { backgroundColor: '#7A1E3A', paddingVertical: 13, paddingHorizontal: 24, borderRadius: 10, shadowColor: '#7A1E3A', shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  shopBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  deliveryCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginTop: 16 },
  deliveryLabel: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 10 },
  deliveryEmpty: { color: '#7A1E3A', fontSize: 13, marginBottom: 8 },
  addressList: { gap: 8, marginBottom: 4 },
  addressOption: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 9, padding: 11, backgroundColor: '#FFFFFF' },
  addressOptionSelected: { borderColor: '#7A1E3A', backgroundColor: '#FDF2F4' },
  addressOptionTitle: { fontSize: 13, fontWeight: '800', color: '#2A2A2A' },
  addressOptionText: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  addAddressBtn: { alignSelf: 'flex-start', paddingVertical: 9 },
  addAddressBtnText: { color: '#7A1E3A', fontSize: 12, fontWeight: '800' },
  footer: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderTopWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  summaryLabel: { fontSize: 12, color: '#4B5563' },
  summaryValue: { fontSize: 12, color: '#111827', fontWeight: '700' },
  summaryMuted: { fontSize: 12, color: '#6B7280' },
  shippingNote: { backgroundColor: '#F3F4F6', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, color: '#6B7280', fontSize: 10, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FDF2F4', borderWidth: 1, borderColor: '#FBCFE8', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 2, marginBottom: 10 },
  totalLabel: { fontSize: 12, color: '#7A1E3A', fontWeight: '800' },
  taxNote: { fontSize: 9, color: '#059669', marginTop: 2 },
  totalValue: { fontSize: 19, fontWeight: '900', color: '#7A1E3A' },
  checkoutBtn: { backgroundColor: '#7A1E3A', paddingVertical: 13, borderRadius: 10, alignItems: 'center', marginBottom: 8, shadowColor: '#7A1E3A', shadowOpacity: 0.22, shadowRadius: 7, elevation: 3 },
  disabledBtn: { opacity: 0.65 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  footerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continueShoppingBtn: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 9, paddingVertical: 9, alignItems: 'center' },
  continueShoppingText: { color: '#374151', fontSize: 11, fontWeight: '800' },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  clearBtnText: { color: '#9CA3AF', fontSize: 11, fontWeight: '700' },
});
