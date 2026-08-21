import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { getApiBaseUrl, getMisVentas } from '../services/api';
import SidebarVendedor from '../components/SidebarVendedor';

const PRIMARY = '#7A1E3A';
const BG = '#FAF8F5';
const WHITE = '#FFFFFF';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777777';

const formatoCOP = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')} COP`;
const formatoFecha = (fecha) => fecha
  ? new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  : 'Sin fecha';

const getBookImageUri = (image) => {
  if (!image) return null;
  return image.startsWith('http')
    ? image
    : `${getApiBaseUrl()}/${image.replace(/^\/+/, '')}`;
};

export default function VentasVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [ordenDetalle, setOrdenDetalle] = useState(null);

  const cargarVentas = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const respuesta = await getMisVentas();
      const ventasDetalle = Array.isArray(respuesta.data) ? respuesta.data : [];
      const ventasAgrupadas = Object.values(ventasDetalle.reduce((ordenes, venta) => {
        const idOrden = venta.id_orden;
        if (!ordenes[idOrden]) {
          ordenes[idOrden] = {
            ...venta,
            total: 0,
            items: [],
          };
        }
        ordenes[idOrden].total += Number(venta.total || 0);
        ordenes[idOrden].items.push(venta);
        return ordenes;
      }, {}));
      setVentas(ventasAgrupadas);
    } catch (e) {
      setVentas([]);
      setError(e?.response?.data?.detail || 'No se pudo cargar el historial de ventas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarVentas(); }, [cargarVentas]));

  const refrescar = () => {
    setRefreshing(true);
    cargarVentas(true);
  };

  const resumen = ventas.reduce((acumulado, venta) => acumulado + Number(venta.total || 0), 0);

  const renderVenta = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <View style={styles.orderLine}>
            <Text style={styles.order}>Orden #{item.id_orden}</Text>
            {item.items.length > 1 && (
              <TouchableOpacity onPress={() => setOrdenDetalle(item)} style={styles.detailButton}>
                <Text style={styles.detailButtonText}>Ver detalle</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.date}>{formatoFecha(item.fecha)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.booksList}>
        {item.items.map((libro, index) => (
          <View key={`${libro.id_libro}-${index}`} style={[styles.bookBlock, index > 0 && styles.bookSeparator]}>
            <View style={styles.bookRow}>
              <View style={styles.bookIcon}>
                {getBookImageUri(libro.imagen)
                  ? <Image source={{ uri: getBookImageUri(libro.imagen) }} style={styles.bookImage} resizeMode="cover" />
                  : <Text style={styles.bookEmoji}>📖</Text>}
              </View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{libro.titulo || 'Libro sin título'}</Text>
                {libro.autor_libro ? <Text style={styles.muted} numberOfLines={1}>{libro.autor_libro}</Text> : null}
              </View>
            </View>

            <View style={styles.detailPanel}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cantidad</Text>
                <Text style={styles.detailValue}>{libro.cantidad || 0}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Precio unitario</Text>
                <Text style={styles.detailValue}>{formatoCOP(libro.precio_libro)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.orderSummary}>
        <View>
          <Text style={styles.summaryLabel}>Resumen de la venta</Text>
          <Text style={styles.summaryUnits}>
            {item.items.reduce((total, libro) => total + Number(libro.cantidad || 0), 0)} unidades
          </Text>
        </View>
        <View style={styles.summaryTotalBox}>
          <Text style={styles.summaryTotalLabel}>Total vendido</Text>
          <Text style={styles.summaryTotal}>{formatoCOP(item.total)}</Text>
        </View>
      </View>

      <View style={styles.buyerRow}>
        <View style={styles.buyerAvatar}>
          {getBookImageUri(item.foto_perfil_cliente)
            ? <Image source={{ uri: getBookImageUri(item.foto_perfil_cliente) }} style={styles.buyerAvatarImage} />
            : <Text style={styles.buyerAvatarText}>{(item.cliente || 'C').charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={styles.buyerInfo}>
          <Text style={styles.buyerLabel}>Comprador</Text>
          <Text style={styles.buyer} numberOfLines={1}>{item.cliente || 'No disponible'}</Text>
        </View>
      </View>
    </View>
  );

  const contenidoVacio = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text style={styles.emptyTitle}>{error ? 'No fue posible cargar las ventas' : 'Aún no hay ventas registradas'}</Text>
      <Text style={styles.emptyText}>{error || 'Aquí aparecerá el detalle de cada libro vendido.'}</Text>
      {error ? <TouchableOpacity style={styles.retry} onPress={() => cargarVentas()}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton} accessibilityLabel="Abrir menú">
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ventas</Text>
          <Text style={styles.headerSubtitle}>Historial de libros vendidos</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={PRIMARY} /><Text style={styles.loadingText}>Cargando ventas…</Text></View>
      ) : (
        <FlatList
          data={ventas}
          keyExtractor={(item) => String(item.id_orden)}
          renderItem={renderVenta}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ventas.length ? (
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Total registrado</Text>
              <Text style={styles.summaryValue}>{formatoCOP(resumen)}</Text>
              <Text style={styles.summarySub}>{ventas.length} venta{ventas.length === 1 ? '' : 's'} registrada{ventas.length === 1 ? '' : 's'}</Text>
            </View>
          ) : null}
          ListEmptyComponent={contenidoVacio}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refrescar} tintColor={PRIMARY} colors={[PRIMARY]} />}
        />
      )}

      <Modal
        visible={Boolean(ordenDetalle)}
        transparent
        animationType="slide"
        onRequestClose={() => setOrdenDetalle(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Detalle de la orden</Text>
                <Text style={styles.modalSubtitle}>Orden #{ordenDetalle?.id_orden}</Text>
              </View>
              <TouchableOpacity onPress={() => setOrdenDetalle(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              {ordenDetalle?.items.map((libro, index) => (
                <View key={`${libro.id_libro}-${index}`} style={styles.modalBookRow}>
                  <View style={styles.modalBookImageBox}>
                    {getBookImageUri(libro.imagen)
                      ? <Image source={{ uri: getBookImageUri(libro.imagen) }} style={styles.modalBookImage} resizeMode="cover" />
                      : <Text style={styles.bookEmoji}>📖</Text>}
                  </View>
                  <View style={styles.modalBookInfo}>
                    <Text style={styles.modalBookTitle} numberOfLines={2}>{libro.titulo || 'Libro sin título'}</Text>
                    {libro.autor_libro ? <Text style={styles.muted} numberOfLines={1}>{libro.autor_libro}</Text> : null}
                    <Text style={styles.modalBookMeta}>Cantidad: {libro.cantidad || 0}</Text>
                    <Text style={styles.modalBookMeta}>Unitario: {formatoCOP(libro.precio_libro)}</Text>
                  </View>
                  <Text style={styles.modalBookTotal}>{formatoCOP(libro.total)}</Text>
                </View>
              ))}
              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>Total de la orden</Text>
                <Text style={styles.modalTotalValue}>{formatoCOP(ordenDetalle?.total)}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SidebarVendedor visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={user} navigation={navigation} onSignOut={signOut} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 16 },
  menuButton: { padding: 4 }, menuIcon: { color: WHITE, fontSize: 22, fontWeight: '700' },
  headerTitle: { color: WHITE, fontSize: 20, fontWeight: '800' }, headerSubtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { color: MUTED, marginTop: 12 },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  summary: { backgroundColor: PRIMARY, borderRadius: 16, padding: 18, marginBottom: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: .5 },
  summaryValue: { color: WHITE, fontSize: 25, fontWeight: '900', marginTop: 4 }, summarySub: { color: 'rgba(255,255,255,0.74)', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: .06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, orderInfo: { flex: 1 }, orderLine: { flexDirection: 'row', alignItems: 'center', gap: 8 }, order: { color: TEXT, fontSize: 15, fontWeight: '800' }, date: { color: MUTED, fontSize: 12, marginTop: 4 }, detailButton: { backgroundColor: '#F5E3E8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, detailButtonText: { color: PRIMARY, fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 14 }, bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  booksList: { gap: 14 }, bookBlock: {}, bookSeparator: { borderTopWidth: 1, borderTopColor: '#F1EDE8', paddingTop: 14 }, bookIcon: { width: 54, height: 62, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDF0F3', overflow: 'hidden' }, bookImage: { width: '100%', height: '100%' }, bookEmoji: { fontSize: 21 }, bookInfo: { flex: 1 }, bookTitle: { color: TEXT, fontSize: 14, fontWeight: '800', lineHeight: 19 }, muted: { color: MUTED, fontSize: 12, marginTop: 4 },
  detailPanel: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF8F5', borderRadius: 10, marginTop: 14, paddingVertical: 10, paddingHorizontal: 12 }, detailItem: { flex: 1 }, detailLabel: { color: MUTED, fontSize: 11 }, detailValue: { color: TEXT, fontSize: 13, fontWeight: '800', marginTop: 3 }, detailDivider: { width: 1, height: 26, backgroundColor: BORDER, marginHorizontal: 8 },
  orderSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDF0F3', borderRadius: 10, marginTop: 14, paddingVertical: 11, paddingHorizontal: 12 }, summaryLabel: { color: PRIMARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .4 }, summaryUnits: { color: MUTED, fontSize: 12, marginTop: 3 }, summaryTotalBox: { alignItems: 'flex-end' }, summaryTotalLabel: { color: MUTED, fontSize: 10 }, summaryTotal: { color: PRIMARY, fontSize: 15, fontWeight: '900', marginTop: 2 },
  buyerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#F1EDE8' }, buyerAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5E3E8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, buyerAvatarImage: { width: '100%', height: '100%' }, buyerAvatarText: { color: PRIMARY, fontSize: 12, fontWeight: '900' }, buyerInfo: { marginLeft: 9 }, buyerLabel: { color: MUTED, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .5 }, buyer: { color: TEXT, fontSize: 13, fontWeight: '800', marginTop: 2 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26, 26, 26, 0.42)' }, modalCard: { maxHeight: '82%', backgroundColor: WHITE, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER }, modalTitle: { color: TEXT, fontSize: 18, fontWeight: '900' }, modalSubtitle: { color: MUTED, fontSize: 12, marginTop: 3 }, modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F1ED', alignItems: 'center', justifyContent: 'center' }, modalCloseText: { color: TEXT, fontSize: 24, lineHeight: 26 }, modalContent: { paddingTop: 4, paddingBottom: 8 }, modalBookRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1EDE8' }, modalBookImageBox: { width: 52, height: 60, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDF0F3', overflow: 'hidden' }, modalBookImage: { width: '100%', height: '100%' }, modalBookInfo: { flex: 1 }, modalBookTitle: { color: TEXT, fontSize: 13, fontWeight: '800' }, modalBookMeta: { color: MUTED, fontSize: 11, marginTop: 4 }, modalBookTotal: { color: PRIMARY, fontSize: 12, fontWeight: '900' }, modalTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16 }, modalTotalLabel: { color: TEXT, fontSize: 13, fontWeight: '800' }, modalTotalValue: { color: PRIMARY, fontSize: 16, fontWeight: '900' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 70 }, emptyIcon: { fontSize: 42, marginBottom: 12 }, emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '800', textAlign: 'center' }, emptyText: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 7 },
  retry: { backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 18 }, retryText: { color: WHITE, fontWeight: '800', fontSize: 13 },
});
