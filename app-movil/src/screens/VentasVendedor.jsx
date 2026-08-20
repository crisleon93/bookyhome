import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { getMisVentas } from '../services/api';
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

export default function VentasVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const cargarVentas = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const respuesta = await getMisVentas();
      setVentas(Array.isArray(respuesta.data) ? respuesta.data : []);
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
        <View>
          <Text style={styles.order}>Orden #{item.id_orden}</Text>
          <Text style={styles.date}>{formatoFecha(item.fecha)}</Text>
        </View>
        <Text style={styles.total}>{formatoCOP(item.total)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.bookRow}>
        <View style={styles.bookIcon}><Text style={styles.bookEmoji}>📖</Text></View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.titulo || 'Libro sin título'}</Text>
          {item.autor_libro ? <Text style={styles.muted} numberOfLines={1}>{item.autor_libro}</Text> : null}
        </View>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.muted}>Cantidad: <Text style={styles.detailValue}>{item.cantidad || 0}</Text></Text>
        <Text style={styles.muted}>Unitario: <Text style={styles.detailValue}>{formatoCOP(item.precio_libro)}</Text></Text>
      </View>

      <View style={styles.buyerRow}>
        <Text style={styles.buyerLabel}>Comprador</Text>
        <Text style={styles.buyer} numberOfLines={1}>{item.cliente || 'No disponible'}</Text>
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
          keyExtractor={(item, index) => `${item.id_orden}-${item.id_libro}-${index}`}
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
  card: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 15, padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: .06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, order: { color: TEXT, fontSize: 15, fontWeight: '800' }, date: { color: MUTED, fontSize: 12, marginTop: 3 }, total: { color: PRIMARY, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 13 }, bookRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDF0F3' }, bookEmoji: { fontSize: 18 }, bookInfo: { flex: 1 }, bookTitle: { color: TEXT, fontSize: 14, fontWeight: '700' }, muted: { color: MUTED, fontSize: 12, marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 14 }, detailValue: { color: TEXT, fontWeight: '700' },
  buyerRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1EDE8' }, buyerLabel: { color: MUTED, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: .4 }, buyer: { color: TEXT, fontSize: 13, fontWeight: '700', marginTop: 3 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 70 }, emptyIcon: { fontSize: 42, marginBottom: 12 }, emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '800', textAlign: 'center' }, emptyText: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 7 },
  retry: { backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 18 }, retryText: { color: WHITE, fontWeight: '800', fontSize: 13 },
});
