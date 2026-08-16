import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import { getOrdenes, getOrderDetails, getApiBaseUrl, sendConfirmationEmail } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777';

export default function History() {
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // La web usa este mismo endpoint. Sus identificadores permiten abrir
        // exactamente la misma orden en el checkout móvil.
        const res = await getOrdenes();
        setHistory(res.data || []);
      } catch (e) {
        console.log('Error loading history', e.message);
        setError('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleDescargar = (id_variante, titulo) => {
    if (!token) {
      Alert.alert('Sesión expirada', 'Inicia sesión nuevamente.');
      return;
    }
    const url = `${getApiBaseUrl()}/libros/descargar/${id_variante}?token=${token}`;
    Linking.openURL(url);
  };

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

  const obtenerPasoActual = (orden) => {
    const estado = String(orden?.estado || '').toLowerCase();
    const estadoEnvio = String(orden?.envio?.estado_envio || '').toLowerCase();

    // El pedido mantiene el pago y el envío por separado. Se usa el estado
    // más avanzado para que la línea se actualice al registrar la guía o al
    // confirmar la entrega, aunque la orden siga figurando como “pagado”.
    if (estado.includes('entreg') || estadoEnvio.includes('entreg')) return 3;
    if (
      estado.includes('enviad') ||
      estadoEnvio.includes('transit') ||
      estadoEnvio.includes('camino') ||
      estadoEnvio.includes('despach')
    ) return 2;
    if (
      estado.includes('proceso') ||
      estado.includes('prepar') ||
      estadoEnvio.includes('guía registrada') ||
      estadoEnvio.includes('guia registrada') ||
      orden?.envio?.numero_guia
    ) return 1;
    if (estado.includes('pagad') || estado.includes('complet')) return 0;
    return -1;
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Orden #{item.id_orden}</Text>
      <Text style={styles.cardStatus}>{item.estado || 'Pendiente'}</Text>
      </View>
      <Text style={styles.cardText}>Fecha: {item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : 'Sin fecha'}</Text>
      <Text style={styles.cardText}>Total: ${Number(item.total ?? 0).toLocaleString('es-CO')}</Text>
      <Text style={styles.cardText}>Items: {item.items?.length || 0}</Text>
      {item.items?.length ? <Text style={styles.cardText}>Libros: {item.items.map((libro) => libro.titulo).join(', ')}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => handleVerOrden(item)}
        >
          <Text style={styles.detailBtnText}>Ver orden</Text>
        </TouchableOpacity>
        {/* Botón de descarga si hay variantes digitales */}
        {item.items?.filter((d) => d.variante_label?.includes('Digital') || d.tipo_tapa === 'Digital').map((d, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.detailBtn, { backgroundColor: '#2e7d32' }]}
            onPress={() => handleDescargar(d.id_variante, d.titulo)}
          >
            <Text style={styles.detailBtnText}>📥 {d.titulo}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>Estado</Text><Text style={styles.statusBadge}>{ordenSeleccionada.estado || 'pendiente'}</Text></View>
                </View>

                <Text style={styles.productsTitle}>Estado de tu pedido</Text>
                <View style={styles.timeline}>
                  {['Pagado', 'En proceso', 'Enviado', 'Entregado'].map((paso, index) => {
                    const pasoActual = obtenerPasoActual(ordenSeleccionada);
                    const activo = index <= pasoActual;
                    return (
                      <View key={paso} style={styles.timelineStep}>
                        {index > 0 && <View style={[styles.timelineLine, index <= pasoActual && styles[`timelineLine${index}`]]} />}
                        <View style={[styles.timelineDot, activo && styles[`timelineDot${index}`]]}><Text style={styles.timelineDotText}>{activo ? '✓' : index + 1}</Text></View>
                        <Text style={[styles.timelineLabel, activo && styles[`timelineLabel${index}`]]}>{paso}</Text>
                      </View>
                    );
                  })}
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
  safe: { flex: 1, backgroundColor: '#7A1E3A' },
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: TEXT, marginBottom: 6 },
  subtitle: { fontSize: 14, color: MUTED, marginBottom: 18 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  cardStatus: { fontSize: 13, color: PRIMARY, fontWeight: '700' },
  cardText: { color: MUTED, marginBottom: 4 },
  detailBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  detailBtnText: { color: WHITE, fontWeight: '700' },
  emptyText: { color: MUTED, textAlign: 'center', marginTop: 20 },
  errorText: { color: '#C5425A', textAlign: 'center' },
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
  statusBadge: { color: '#287A45', backgroundColor: '#E8F5E9', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12, fontWeight: '800', fontSize: 12, textTransform: 'capitalize' },
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
