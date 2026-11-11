import { useThemedStyles } from '../context/ThemeContext';
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
import Footer from '../components/Footer';
import { IconBook, IconDollar, IconShoppingBag, IconUser } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const BG = '#FAF8F5';
const WHITE = '#FFFFFF';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777777';

const formatoCOP = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')} COP`;
const formatoFecha = (fecha) => {
  if (!fecha) return { fecha: 'Sin fecha', hora: '' };
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return { fecha: 'Sin fecha', hora: '' };
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const esHoy = date.toDateString() === hoy.toDateString();
  const esAyer = date.toDateString() === ayer.toDateString();
  return {
    fecha: esHoy
      ? 'Hoy'
      : esAyer
        ? 'Ayer'
        : date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    hora: date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
  };
};

const getEstadoVenta = (estado) => {
  const normalizado = String(estado || '').toLowerCase().trim();
  if (['entregada', 'entregado', 'completado', 'completada'].includes(normalizado)) {
    return { label: 'Entregado', color: '#7A1E3A', bg: '#f8e9ee', border: '#7A1E3A' };
  }
  if (['enviado', 'enviada'].includes(normalizado)) {
    return { label: 'Enviado', color: '#1a4f8a', bg: '#eaf3ff', border: '#2979c7' };
  }
  if (['pagado', 'pagada'].includes(normalizado)) {
    return { label: 'Pagado', color: '#145c2e', bg: '#eafaf1', border: '#1e8a45' };
  }
  if (normalizado === 'en preparacion') {
    return { label: 'En preparación', color: '#b95c00', bg: '#fef5e7', border: '#e67e22' };
  }
  return { label: 'Pendiente', color: '#b95c00', bg: '#fef5e7', border: '#e67e22' };
};

const getBookImageUri = (image) => {
  if (!image) return null;
  return image.startsWith('http')
    ? image
    : `${getApiBaseUrl()}/${image.replace(/^\/+/, '')}`;
};

export default function VentasVendedor({ navigation }) {
  const styles = useThemedStyles(themeBaseStyles);
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [ordenDetalle, setOrdenDetalle] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [ventasPorPagina, setVentasPorPagina] = useState(10);

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
      }, {})).sort((a, b) => {
        // Ordenar por fecha descendente (más reciente primero) y luego por ID ascendente
        return (new Date(b.fecha || 0) - new Date(a.fecha || 0)) || (Number(a.id_orden) - Number(b.id_orden));
      });
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
  const librosVendidos = ventas.reduce(
    (total, venta) => total + venta.items.reduce((subtotal, libro) => subtotal + Number(libro.cantidad || 0), 0),
    0,
  );
  const clientesUnicos = new Set(
    ventas.map((venta) => String(venta.cliente || '').trim().toLowerCase()).filter(Boolean),
  ).size;
  const totalPaginas = Math.max(1, Math.ceil(ventas.length / ventasPorPagina));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const ventasPagina = ventas.slice(
    (paginaSegura - 1) * ventasPorPagina,
    paginaSegura * ventasPorPagina,
  );
  const kpis = [
    { label: 'Ingresos totales', value: formatoCOP(resumen), icon: IconDollar, color: PRIMARY, background: '#fbe8ee' },
    { label: 'Órdenes', value: ventas.length, icon: IconShoppingBag, color: '#3b82f6', background: '#dbeafe' },
    { label: 'Libros vendidos', value: librosVendidos, icon: IconBook, color: '#6d28d9', background: '#ede9fe' },
    { label: 'Clientes', value: clientesUnicos, icon: IconUser, color: '#10b981', background: '#d1fae5' },
  ];

  const renderVenta = ({ item }) => {
    const fechaVenta = formatoFecha(item.fecha);
    const estadoVenta = getEstadoVenta(item.estado);
    return (
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
          <View style={styles.dateStatusRow}>
            <View>
              <Text style={styles.date}>{fechaVenta.fecha}</Text>
              {fechaVenta.hora ? <Text style={styles.time}>{fechaVenta.hora}</Text> : null}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: estadoVenta.bg, borderColor: estadoVenta.border }]}>
              <Text style={[styles.statusText, { color: estadoVenta.color }]}>{estadoVenta.label}</Text>
            </View>
          </View>
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
                <Text style={styles.detailValue} numberOfLines={1}>{libro.cantidad || 0}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Precio</Text>
                <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{formatoCOP(libro.precio_libro)}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Total</Text>
                <Text style={styles.detailValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{formatoCOP(libro.total)}</Text>
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
          {item.correo_cliente ? <Text style={styles.buyerEmail} numberOfLines={1}>{item.correo_cliente}</Text> : null}
        </View>
      </View>
      </View>
    );
  };

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
        <View style={styles.headerIcon}><IconShoppingBag size={21} color={WHITE} /></View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Registro de Ventas</Text>
          <Text style={styles.headerSubtitle}>
            Historial de órdenes confirmadas · {ventas.length} {ventas.length === 1 ? 'orden' : 'órdenes'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={PRIMARY} /><Text style={styles.loadingText}>Cargando ventas…</Text></View>
      ) : (
        <FlatList
          data={ventasPagina}
          keyExtractor={(item) => String(item.id_orden)}
          renderItem={renderVenta}
          contentContainerStyle={styles.list}
          ListHeaderComponent={(
            <View style={styles.kpiGrid}>
              {kpis.map(({ label, value, icon: Icon, color, background }) => (
                <View key={label} style={styles.kpiCard}>
                  <View style={[styles.kpiIcon, { backgroundColor: background }]}>
                    <Icon size={19} color={color} />
                  </View>
                  <View style={styles.kpiInfo}>
                    <Text style={styles.kpiLabel}>{label}</Text>
                    <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={contenidoVacio}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refrescar} tintColor={PRIMARY} colors={[PRIMARY]} />}
          ListFooterComponent={(
            <View>
              {ventas.length > 0 && (
                <View style={styles.pagination}>
                  <Text style={styles.paginationInfo}>
                    Mostrando {(paginaSegura - 1) * ventasPorPagina + 1}–
                    {Math.min(paginaSegura * ventasPorPagina, ventas.length)} de {ventas.length} órdenes
                  </Text>
                  <View style={styles.paginationControls}>
                    <TouchableOpacity
                      style={[styles.pageButton, paginaSegura === 1 && styles.pageButtonDisabled]}
                      onPress={() => setPaginaActual((page) => Math.max(1, page - 1))}
                      disabled={paginaSegura === 1}
                      accessibilityLabel="Página anterior"
                    >
                      <Text style={styles.pageButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageNumber}>{paginaSegura} / {totalPaginas}</Text>
                    <TouchableOpacity
                      style={[styles.pageButton, paginaSegura === totalPaginas && styles.pageButtonDisabled]}
                      onPress={() => setPaginaActual((page) => Math.min(totalPaginas, page + 1))}
                      disabled={paginaSegura === totalPaginas}
                      accessibilityLabel="Página siguiente"
                    >
                      <Text style={styles.pageButtonText}>›</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.pageSizeRow}>
                    <Text style={styles.pageSizeLabel}>Por página</Text>
                    {[5, 10, 20].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[styles.pageSizeButton, ventasPorPagina === size && styles.pageSizeButtonActive]}
                        onPress={() => {
                          setVentasPorPagina(size);
                          setPaginaActual(1);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: ventasPorPagina === size }}
                      >
                        <Text style={[styles.pageSizeText, ventasPorPagina === size && styles.pageSizeTextActive]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <Footer onLinkPress={() => {}} />
            </View>
          )}
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

const themeBaseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14 },
  menuButton: { padding: 4 }, menuIcon: { color: WHITE, fontSize: 22, fontWeight: '700' },
  headerIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '800' }, headerSubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 10, marginTop: 3, flexShrink: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { color: MUTED, marginTop: 12 },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 6 },
  kpiCard: { width: '48.5%', minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 13, padding: 10, marginBottom: 10, elevation: 1 },
  kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiInfo: { flex: 1, minWidth: 0 },
  kpiLabel: { color: MUTED, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  kpiValue: { color: TEXT, fontSize: 13, fontWeight: '900' },
  pagination: { alignItems: 'center', backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 13, padding: 12, marginTop: 2, marginBottom: 12 },
  paginationInfo: { color: MUTED, fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  paginationControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  pageButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5e3e8', borderRadius: 10 },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: PRIMARY, fontSize: 22, fontWeight: '800', lineHeight: 25 },
  pageNumber: { color: TEXT, fontSize: 13, fontWeight: '800', minWidth: 48, textAlign: 'center' },
  pageSizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  pageSizeLabel: { color: MUTED, fontSize: 11, marginRight: 2 },
  pageSizeButton: { minWidth: 32, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: BORDER, borderRadius: 8, backgroundColor: WHITE },
  pageSizeButtonActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pageSizeText: { color: MUTED, fontSize: 11, fontWeight: '700' },
  pageSizeTextActive: { color: WHITE },
  card: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: .06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, orderInfo: { flex: 1 }, orderLine: { flexDirection: 'row', alignItems: 'center', gap: 8 }, order: { color: TEXT, fontSize: 15, fontWeight: '800' }, dateStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }, date: { color: MUTED, fontSize: 12 }, time: { color: MUTED, fontSize: 10, marginTop: 1 }, statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, maxWidth: '55%' }, statusText: { fontSize: 10, fontWeight: '800' }, detailButton: { backgroundColor: '#F5E3E8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, detailButtonText: { color: PRIMARY, fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 14 }, bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  booksList: { gap: 14 }, bookBlock: {}, bookSeparator: { borderTopWidth: 1, borderTopColor: '#F1EDE8', paddingTop: 14 }, bookIcon: { width: 54, height: 62, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDF0F3', overflow: 'hidden' }, bookImage: { width: '100%', height: '100%' }, bookEmoji: { fontSize: 21 }, bookInfo: { flex: 1 }, bookTitle: { color: TEXT, fontSize: 14, fontWeight: '800', lineHeight: 19 }, muted: { color: MUTED, fontSize: 12, marginTop: 4 },
  detailPanel: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF8F5', borderRadius: 10, marginTop: 14, paddingVertical: 10, paddingHorizontal: 12 }, detailItem: { flex: 1 }, detailLabel: { color: MUTED, fontSize: 11 }, detailValue: { color: TEXT, fontSize: 13, fontWeight: '800', marginTop: 3 }, detailDivider: { width: 1, height: 26, backgroundColor: BORDER, marginHorizontal: 8 },
  orderSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDF0F3', borderRadius: 10, marginTop: 14, paddingVertical: 11, paddingHorizontal: 12 }, summaryLabel: { color: PRIMARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .4 }, summaryUnits: { color: MUTED, fontSize: 12, marginTop: 3 }, summaryTotalBox: { alignItems: 'flex-end' }, summaryTotalLabel: { color: MUTED, fontSize: 10 }, summaryTotal: { color: PRIMARY, fontSize: 15, fontWeight: '900', marginTop: 2 },
  buyerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#F1EDE8' }, buyerAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5E3E8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, buyerAvatarImage: { width: '100%', height: '100%' }, buyerAvatarText: { color: PRIMARY, fontSize: 12, fontWeight: '900' }, buyerInfo: { marginLeft: 9 }, buyerLabel: { color: MUTED, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .5 }, buyer: { color: TEXT, fontSize: 13, fontWeight: '800', marginTop: 2 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26, 26, 26, 0.42)' }, modalCard: { maxHeight: '82%', backgroundColor: WHITE, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER }, modalTitle: { color: TEXT, fontSize: 18, fontWeight: '900' }, modalSubtitle: { color: MUTED, fontSize: 12, marginTop: 3 }, modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F1ED', alignItems: 'center', justifyContent: 'center' }, modalCloseText: { color: TEXT, fontSize: 24, lineHeight: 26 }, modalContent: { paddingTop: 4, paddingBottom: 8 }, modalBookRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1EDE8' }, modalBookImageBox: { width: 52, height: 60, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDF0F3', overflow: 'hidden' }, modalBookImage: { width: '100%', height: '100%' }, modalBookInfo: { flex: 1 }, modalBookTitle: { color: TEXT, fontSize: 13, fontWeight: '800' }, modalBookMeta: { color: MUTED, fontSize: 11, marginTop: 4 }, modalBookTotal: { color: PRIMARY, fontSize: 12, fontWeight: '900' }, modalTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16 }, modalTotalLabel: { color: TEXT, fontSize: 13, fontWeight: '800' }, modalTotalValue: { color: PRIMARY, fontSize: 16, fontWeight: '900' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 70 }, emptyIcon: { fontSize: 42, marginBottom: 12 }, emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '800', textAlign: 'center' }, emptyText: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 7 },
  retry: { backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 18 }, retryText: { color: WHITE, fontWeight: '800', fontSize: 13 },
});
const styles = themeBaseStyles;
