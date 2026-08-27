import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import { getOrdenes, getDevoluciones, getOrderDetails, sendConfirmationEmail } from '../services/api';
import { IconAlertTriangle, IconStar, IconTruck } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777';

export default function History({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [devoluciones, setDevoluciones] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // La web usa este mismo endpoint. Sus identificadores permiten abrir
        // exactamente la misma orden en el checkout móvil.
        const [ordenesRes, devolucionesRes] = await Promise.all([getOrdenes(), getDevoluciones()]);
        setHistory(ordenesRes.data || []);
        setDevoluciones(devolucionesRes.data || []);
      } catch (e) {
        console.log('Error loading history', e.message);
        setError('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleVerOrden = async (orden) => {
    setOrdenSeleccionada(orden);
    setDetalleVisible(true);
    setDetalleLoading(true);
    try {
      const response = await getOrderDetails(orden.id_orden);
      setOrdenSeleccionada(response.data);
    } catch (requestError) {
      Alert.alert('Error', 'No se pudo obtener la información de la compra.');
    } finally {
      setDetalleLoading(false);
    }
  };

  const obtenerEstadoVisible = (orden) => {
    const devolucion = devoluciones.find((item) => Number(item.id_orden) === Number(orden.id_orden));
    const estadoDevolucion = String(devolucion?.estado_devolucion || '').toLowerCase();
    if (['completada', 'resuelta', 'reembolsada', 'devuelta'].includes(estadoDevolucion)) {
      return { pago: 'Reembolsado', entrega: 'Devolución', color: '#7A1E3A', entregaColor: '#7A1E3A' };
    }

    const estado = String(orden.estado || orden.estado_orden || '').toLowerCase();
    const estadoEnvio = String(orden.envio?.estado_envio || '').toLowerCase();
    if (estado.includes('cancelad') || estadoEnvio.includes('cancelad')) {
      return { pago: 'Cancelada', entrega: null, color: '#DC2626' };
    }
    if (estado.includes('entregad') || estadoEnvio.includes('entregad')) {
      return { pago: 'Pagado', entrega: 'Entregado', color: '#16A34A', entregaColor: '#16A34A' };
    }
    if (estado.includes('enviad') || estadoEnvio.includes('transit') || estadoEnvio.includes('camino')) {
      return { pago: 'Pagado', entrega: 'En camino', color: '#16A34A', entregaColor: '#2563EB' };
    }
    if (estado === 'pagado') {
      return { pago: 'Pagado', entrega: 'Preparando envío', color: '#16A34A', entregaColor: '#D97706' };
    }
    return { pago: 'Pendiente de pago', entrega: null, color: '#D97706' };
  };

  const renderEstadoIcono = (orden, estadoVisible) => {
    if (estadoVisible.pago === 'Cancelada') return <IconAlertTriangle size={20} color="#DC2626" />;
    if (estadoVisible.pago === 'Pendiente de pago') return <IconAlertTriangle size={20} color="#D97706" />;
    if (estadoVisible.entrega === 'Entregado') return <IconStar size={20} color="#16A34A" filled />;
    if (estadoVisible.entrega === 'En camino' || estadoVisible.entrega === 'Preparando envío') return <IconTruck size={20} color="#2563EB" />;
    return <IconTruck size={20} color="#2563EB" />;
  };

  const enviarComprobante = async () => {
    if (!ordenSeleccionada) return;
    setEmailLoading(true);
    try {
      await sendConfirmationEmail(ordenSeleccionada.id_orden);
      Alert.alert('Correo enviado', 'Enviamos el comprobante de tu compra al correo registrado.');
    } catch (requestError) {
      Alert.alert('Error', 'No se pudo enviar el comprobante por correo.');
    } finally {
      setEmailLoading(false);
    }
  };

  const escaparHtml = (valor) => String(valor ?? '').replace(/[&<>'"]/g, (caracter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));

  const imprimirComprobante = async () => {
    if (!ordenSeleccionada) return;
    setPrintLoading(true);
    try {
      const productos = (ordenSeleccionada.items || []).map((producto) => `<tr><td>${escaparHtml(producto.titulo || 'Libro')}<br/><small>${escaparHtml(producto.autor_libro || '')} · Cantidad: ${producto.cantidad || 1}</small></td><td>$${Number((producto.precio_libro || 0) * (producto.cantidad || 1)).toLocaleString('es-CO')}</td></tr>`).join('');
      const total = Number(ordenSeleccionada.total_con_descuento ?? ordenSeleccionada.total ?? 0).toLocaleString('es-CO');
      await Print.printAsync({ html: `<!doctype html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;color:#2A2A2A;padding:28px}h1{color:#7A1E3A}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:10px;border-bottom:1px solid #e0dbd4}td:last-child{text-align:right;font-weight:bold}.total{margin-top:20px;font-size:20px;font-weight:bold;color:#C5425A;text-align:right}.meta{background:#fcfaf7;padding:14px;border-radius:8px}</style></head><body><h1>Comprobante BookyHome</h1><div class="meta"><p><b>Orden:</b> #${ordenSeleccionada.id_orden}</p><p><b>Fecha:</b> ${escaparHtml(ordenSeleccionada.fecha ? new Date(ordenSeleccionada.fecha).toLocaleDateString('es-CO') : '—')}</p><p><b>Método de pago:</b> ${escaparHtml(ordenSeleccionada.metodo_pago || 'Pendiente de pago')}</p><p><b>Estado:</b> ${escaparHtml(ordenSeleccionada.estado || 'pendiente')}</p></div><h2>Productos</h2><table>${productos}</table><p class="total">Total pagado: $${total} COP</p></body></html>` });
    } catch (printError) {
      Alert.alert('Error', 'No se pudo abrir el diálogo de impresión.');
    } finally {
      setPrintLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const estadoVisible = obtenerEstadoVisible(item);
    return (
    <View style={styles.card}>
      <View style={styles.statusIcon}>{renderEstadoIcono(item, estadoVisible)}</View>
      <View style={styles.orderInfo}>
        <Text style={styles.cardTitle}>Orden #{item.id_orden}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.cardText}>{item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : 'Sin fecha'}</Text>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.cardText}>{item.items?.length || 0} producto{item.items?.length === 1 ? '' : 's'}</Text>
        </View>
        <View style={styles.statusGroup}>
          <Text style={[styles.statusBadge, { color: estadoVisible.color, backgroundColor: `${estadoVisible.color}18`, borderColor: `${estadoVisible.color}55` }]}>{estadoVisible.pago}</Text>
          {estadoVisible.entrega && <Text style={[styles.statusBadge, { color: estadoVisible.entregaColor, backgroundColor: `${estadoVisible.entregaColor}18`, borderColor: `${estadoVisible.entregaColor}55` }]}>{estadoVisible.entrega}</Text>}
        </View>
      </View>
      <View style={styles.orderAction}>
        <Text style={styles.orderTotal}>$ {Number(item.total ?? 0).toLocaleString('es-CO')}</Text>
        {estadoVisible.pago === 'Pendiente de pago' ? (
          <TouchableOpacity style={styles.detailBtn} onPress={() => navigation.navigate('Checkout', { orderId: item.id_orden })}>
            <Text style={styles.detailBtnText}>Pagar orden</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.detailBtn} onPress={() => handleVerOrden(item)}>
            <Text style={styles.detailBtnText}>Ver Baucher</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Historial de compras</Text>
        <Text style={styles.subtitle}>Tus últimas órdenes están aquí.</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aún no tienes órdenes registradas.</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => String(item.id_orden)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal visible={detalleVisible} transparent animationType="slide" onRequestClose={() => setDetalleVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            {detalleLoading ? (
              <View style={styles.detailLoading}><ActivityIndicator size="large" color={PRIMARY} /><Text style={styles.cardText}>Cargando información de la orden...</Text></View>
            ) : ordenSeleccionada ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <View style={styles.detailIcon}><Text style={styles.detailIconText}>✓</Text></View>
                  <Text style={styles.detailTitle}>{ordenSeleccionada.estado === 'pendiente' ? 'Orden pendiente' : 'Compra exitosa'}</Text>
                  <Text style={styles.detailSubtitle}>Gracias por comprar en BookyHome</Text>
                </View>

                <View style={styles.detailInfoBox}>
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>Número de orden</Text><Text style={styles.detailValue}>#{ordenSeleccionada.id_orden}</Text></View>
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>Fecha</Text><Text style={styles.detailValue}>{ordenSeleccionada.fecha ? new Date(ordenSeleccionada.fecha).toLocaleDateString('es-CO') : '—'}</Text></View>
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>Método de pago</Text><Text style={styles.detailValue}>{ordenSeleccionada.metodo_pago || 'Pendiente de pago'}</Text></View>
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>Estado</Text><Text style={styles.detailStatusBadge}>{ordenSeleccionada.estado || 'pendiente'}</Text></View>
                </View>

                <Text style={styles.productsTitle}>Productos comprados</Text>
                {(ordenSeleccionada.items || []).map((producto, index) => (
                  <View key={`${producto.id_libro}-${index}`} style={styles.productRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productTitle}>{producto.titulo || 'Libro'}</Text>
                      <Text style={styles.productMeta}>{producto.autor_libro || 'Autor no disponible'} · Cantidad: {producto.cantidad || 1}</Text>
                    </View>
                    <Text style={styles.productPrice}>${Number((producto.precio_libro || 0) * (producto.cantidad || 1)).toLocaleString('es-CO')}</Text>
                  </View>
                ))}

                <View style={styles.totalBox}>
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>Subtotal</Text><Text style={styles.detailValue}>${Number(ordenSeleccionada.total || 0).toLocaleString('es-CO')}</Text></View>
                  {ordenSeleccionada.cupon_aplicado && ordenSeleccionada.total_con_descuento != null && <View style={styles.couponRow}><Text style={styles.couponText}>Cupón {ordenSeleccionada.cupon_aplicado}</Text><Text style={styles.couponText}>-${Number(ordenSeleccionada.total - ordenSeleccionada.total_con_descuento).toLocaleString('es-CO')}</Text></View>}
                  <View style={styles.paidRow}><Text style={styles.paidLabel}>Total pagado</Text><Text style={styles.paidValue}>${Number(ordenSeleccionada.total_con_descuento ?? ordenSeleccionada.total ?? 0).toLocaleString('es-CO')} COP</Text></View>
                </View>

                {ordenSeleccionada.envio?.numero_guia && <View style={styles.shippingBox}><Text style={styles.productsTitle}>Envío</Text><Text style={styles.productMeta}>{ordenSeleccionada.envio.empresa_mensajeria} · Guía {ordenSeleccionada.envio.numero_guia}</Text><Text style={styles.productMeta}>{ordenSeleccionada.envio.estado_envio}</Text></View>}
                <View style={styles.detailActions}>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setDetalleVisible(false)}><Text style={styles.closeBtnText}>Cerrar</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.emailBtn, emailLoading && styles.actionDisabled]} onPress={enviarComprobante} disabled={emailLoading}><Text style={styles.emailBtnText}>{emailLoading ? 'Enviando...' : 'Enviar por correo'}</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.printBtn, printLoading && styles.actionDisabled]} onPress={imprimirComprobante} disabled={printLoading}><Text style={styles.printBtnText}>{printLoading ? 'Abriendo...' : 'Imprimir'}</Text></TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY },
  container: { flex: 1, padding: 16, backgroundColor: PRIMARY },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: WHITE, marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 18 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 18,
    minHeight: 104,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusIcon: { width: 36, alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1, minWidth: 0 },
  cardHeader: { marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: TEXT },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  metaDivider: { color: '#C8C0BA', fontSize: 13 },
  cardText: { color: MUTED, marginBottom: 0, fontSize: 12 },
  statusGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statusBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: '700' },
  orderAction: { alignItems: 'flex-end', width: 116 },
  orderTotal: { color: TEXT, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  detailBtn: {
    width: 116,
    alignItems: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 7,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  detailBtnText: { color: WHITE, fontWeight: '700', fontSize: 11, textAlign: 'center' },
  emptyText: { color: WHITE, textAlign: 'center', marginTop: 20 },
  errorText: { color: '#FFD7DF', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 18 },
  detailModal: { maxHeight: '88%', backgroundColor: WHITE, borderRadius: 18, padding: 20 },
  detailLoading: { alignItems: 'center', gap: 14, paddingVertical: 45 },
  detailHeader: { alignItems: 'center', borderBottomWidth: 1, borderColor: BORDER, paddingBottom: 18, marginBottom: 16 },
  detailIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F8E7EC', justifyContent: 'center', alignItems: 'center', marginBottom: 9 },
  detailIconText: { color: '#C5425A', fontSize: 30, fontWeight: '900' },
  detailTitle: { color: PRIMARY, fontSize: 21, fontWeight: '800' },
  detailSubtitle: { color: MUTED, marginTop: 4, fontSize: 13 },
  detailInfoBox: { backgroundColor: '#FCFAF7', borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 13, gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { color: MUTED, fontSize: 13, flex: 1 },
  detailValue: { color: TEXT, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  detailStatusBadge: { color: '#287A45', backgroundColor: '#E8F5E9', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12, fontWeight: '800', fontSize: 12, textTransform: 'capitalize' },
  productsTitle: { color: TEXT, fontSize: 16, fontWeight: '800', marginTop: 18, marginBottom: 10 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FAF8F6', borderWidth: 1, borderColor: BORDER, borderRadius: 9, padding: 12, marginBottom: 8 },
  productTitle: { color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  productMeta: { color: MUTED, fontSize: 12, lineHeight: 17 },
  productPrice: { color: PRIMARY, fontWeight: '800', fontSize: 13 },
  totalBox: { borderTopWidth: 2, borderColor: BORDER, paddingTop: 14, marginTop: 10, gap: 10 },
  couponRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EEF8EF', borderWidth: 1, borderColor: '#C8E6C9', borderRadius: 7, padding: 9 },
  couponText: { color: '#287A45', fontSize: 12, fontWeight: '800' },
  paidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  paidLabel: { color: TEXT, fontSize: 17, fontWeight: '800' },
  paidValue: { color: '#C5425A', fontSize: 18, fontWeight: '900', textAlign: 'right' },
  shippingBox: { backgroundColor: '#F4F8FE', borderWidth: 1, borderColor: '#D0DEEF', borderRadius: 9, padding: 12, marginTop: 15 },
  timeline: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  timelineStep: { flex: 1, alignItems: 'center', position: 'relative' },
  timelineLine: { position: 'absolute', height: 3, backgroundColor: '#DDD5D7', width: '100%', right: '50%', top: 13 },
  timelineLine1: { backgroundColor: '#1976D2' },
  timelineLine2: { backgroundColor: '#7A1E3A' },
  timelineLine3: { backgroundColor: '#6A1B9A' },
  timelineDot: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#DDD5D7', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDot0: { backgroundColor: '#2E7D32' },
  timelineDot1: { backgroundColor: '#1976D2' },
  timelineDot2: { backgroundColor: '#7A1E3A' },
  timelineDot3: { backgroundColor: '#6A1B9A' },
  timelineDotText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  timelineLabel: { color: '#91878A', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  timelineLabel0: { color: '#2E7D32' },
  timelineLabel1: { color: '#1976D2' },
  timelineLabel2: { color: '#7A1E3A' },
  timelineLabel3: { color: '#6A1B9A' },
  detailActions: { marginTop: 22, gap: 10 },
  closeBtn: { borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 9, paddingVertical: 12, alignItems: 'center' },
  closeBtnText: { color: PRIMARY, fontWeight: '800', fontSize: 15 },
  emailBtn: { backgroundColor: '#2E7D32', borderRadius: 9, paddingVertical: 12, alignItems: 'center' },
  emailBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  printBtn: { backgroundColor: PRIMARY, borderRadius: 9, paddingVertical: 12, alignItems: 'center' },
  printBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  actionDisabled: { opacity: 0.65 },
});
