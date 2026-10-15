import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect, Polygon } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import {
  cancelarMisPendientes,
  getOrdenes,
  getDevoluciones,
  getOrderDetails,
  notificarLlegadaTienda,
  sendConfirmationEmail,
} from '../services/api';
import { IconPackage, IconSearch } from '../components/Icons';
import Footer from '../components/Footer';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777';
const ORDER_PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'antiguas', label: 'Más antiguas' },
  { value: 'mayor_precio', label: 'Mayor valor' },
  { value: 'menor_precio', label: 'Menor valor' },
];

const formatCurrency = (value) => Number(value || 0).toLocaleString('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const formatOrderDate = (value) => value
  ? new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  : 'Fecha no disponible';

const getOrderStatusBadge = (order) => {
  const status = String(order?.estado || order?.estado_orden || '').toLowerCase();
  if (status.includes('entreg')) return { label: '✓ Entregada', className: 'entregado' };
  if (status.includes('enviad') || status.includes('transit')) return { label: '🚚 En tránsito', className: 'camino' };
  if (status.includes('pagad') || status.includes('aprob')) return { label: '✓ Pagado', className: 'entregado' };
  if (status.includes('cancel')) return { label: '✕ Cancelada', className: 'cancelado' };
  return { label: 'Pendiente de pago', className: 'procesando' };
};

export default function History({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [detalleModo, setDetalleModo] = useState('details');
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [llegadaLoading, setLlegadaLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [devoluciones, setDevoluciones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('recientes');
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenarVisible, setOrdenarVisible] = useState(false);
  const [limpiandoPendientes, setLimpiandoPendientes] = useState(false);
  const [confirmarLimpiezaVisible, setConfirmarLimpiezaVisible] = useState(false);
  const [resultadoLimpieza, setResultadoLimpieza] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // La web usa este mismo endpoint y sus identificadores abren la misma orden en móvil.
      const [ordenesRes, devolucionesRes] = await Promise.all([getOrdenes(), getDevoluciones()]);
      setHistory(ordenesRes.data || []);
      setDevoluciones(devolucionesRes.data || []);
    } catch (requestError) {
      console.warn('Error loading purchase history', requestError.message);
      setError('No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleVerOrden = async (orden, modo = 'details') => {
    setOrdenSeleccionada(orden);
    setDetalleModo(modo);
    setDetalleVisible(true);
    setDetalleLoading(true);
    try {
      const response = await getOrderDetails(orden.id_orden_db || orden.id_orden);
      setOrdenSeleccionada(response.data);
    } catch (requestError) {
      Alert.alert('Error', 'No se pudo obtener la información de la compra.');
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleNotificarLlegada = async () => {
    if (!ordenSeleccionada) return;
    const orderId = ordenSeleccionada.id_orden_db || ordenSeleccionada.id_orden;
    setLlegadaLoading(true);
    try {
      await notificarLlegadaTienda(orderId);
      const response = await getOrderDetails(orderId);
      setOrdenSeleccionada(response.data);
      await loadHistory();
      Alert.alert('Llegada notificada', 'El encargado de la librería te atenderá en breve.');
    } catch (requestError) {
      console.warn('Error notifying store arrival', requestError.message);
      Alert.alert('Error', 'No se pudo notificar tu llegada. Intenta de nuevo.');
    } finally {
      setLlegadaLoading(false);
    }
  };

  const obtenerEstadoVisible = useCallback((orden) => {
    const devolucion = devoluciones.find((item) => Number(item.id_orden) === Number(orden.id_orden));
    const estadoDevolucion = String(devolucion?.estado_devolucion || '').toLowerCase();
    if (['completada', 'resuelta', 'reembolsada', 'devuelta'].includes(estadoDevolucion)) {
      return { pago: 'Reembolsado', entrega: 'Devolución', pagoClase: 'devolucion', entregaClase: 'devolucion', completada: false };
    }

    const estado = String(orden.estado || orden.estado_orden || '').toLowerCase().trim();
    const estadoEnvio = String(orden.envio?.estado_envio || '').toLowerCase();
    if (estado.includes('cancelad')) {
      return { pago: 'Cancelada', entrega: null, pagoClase: 'cancelado', entregaClase: null, completada: false, esCancelada: true };
    }

    const entregada = estado.includes('entregad') || estadoEnvio.includes('entregad');
    const enCamino = estado.includes('enviad') || estadoEnvio.includes('transito') || estadoEnvio.includes('camino')
      || (estado.startsWith('pagad') && !!orden.envio?.numero_guia);
    const esRetiro = orden.tipo_entrega === 'retiro_tienda';

    if (entregada) {
      return { pago: 'Pagado', entrega: esRetiro ? 'Retirado en tienda' : 'Entregado', pagoClase: 'entregado', entregaClase: 'entregado', completada: true };
    }
    if (enCamino) {
      return { pago: 'Pagado', entrega: 'En camino', pagoClase: 'entregado', entregaClase: 'camino', completada: false };
    }
    if (estado.startsWith('pagad') || estado === 'pago' || estado === 'aprobado') {
      return { pago: 'Pagado', entrega: esRetiro ? 'Listo para retirar' : 'Preparando envío', pagoClase: 'entregado', entregaClase: esRetiro ? 'entregado' : 'procesando', completada: false };
    }
    if (estado.includes('procesand') || estado.includes('preparand') || estado.includes('en proceso')) {
      return { pago: 'Pagado', entrega: 'Preparando envío', pagoClase: 'entregado', entregaClase: 'procesando', completada: false };
    }
    return { pago: 'Pendiente de pago', entrega: null, pagoClase: 'procesando', entregaClase: 'procesando', completada: false };
  }, [devoluciones]);

  const renderEstadoIcono = (estadoVisible) => {
    if (estadoVisible.completada) {
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <Polyline points="22 4 12 14.01 9 11.01" />
        </Svg>
      );
    }
    if (estadoVisible.esCancelada) {
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Line x1="15" y1="9" x2="9" y2="15" />
          <Line x1="9" y1="9" x2="15" y2="15" />
        </Svg>
      );
    }
    if (estadoVisible.pago === 'Pendiente de pago') {
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="12 6 12 12 16 14" />
        </Svg>
      );
    }
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="1" y="3" width="15" height="13" />
        <Polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <Circle cx="5.5" cy="18.5" r="2.5" />
        <Circle cx="18.5" cy="18.5" r="2.5" />
      </Svg>
    );
  };

  const totalCompras = history.length;
  const totalEntregadas = history.filter((orden) => {
    const estado = obtenerEstadoVisible(orden);
    return estado.completada || estado.entrega === 'Entregado';
  }).length;
  const totalEnCamino = history.filter((orden) => ['En camino', 'Preparando envío'].includes(obtenerEstadoVisible(orden).entrega)).length;
  const totalPendientes = history.filter((orden) => obtenerEstadoVisible(orden).pago === 'Pendiente de pago').length;
  const totalCanceladas = history.filter((orden) => {
    const estado = obtenerEstadoVisible(orden);
    return estado.esCancelada || estado.pago === 'Cancelada';
  }).length;

  const ordenesFiltradas = useMemo(() => history
    .filter((orden) => {
      const estado = obtenerEstadoVisible(orden);
      if (filtroEstado === 'entregado' && !(estado.completada || estado.entrega === 'Entregado')) return false;
      if (filtroEstado === 'camino' && !['En camino', 'Preparando envío'].includes(estado.entrega)) return false;
      if (filtroEstado === 'pendiente' && estado.pago !== 'Pendiente de pago') return false;
      if (filtroEstado === 'cancelado' && !(estado.esCancelada || estado.pago === 'Cancelada')) return false;

      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const idMatch = String(orden.id_orden_db || orden.id_orden).includes(query.replace(/^#/, ''));
        const fechaMatch = orden.fecha && new Date(orden.fecha).toLocaleDateString('es-CO').toLowerCase().includes(query);
        const itemMatch = Array.isArray(orden.items) && orden.items.some((item) =>
          (item.titulo || item.nombre_libro || '').toLowerCase().includes(query)
          || (item.autor_libro || item.autor || '').toLowerCase().includes(query)
        );
        const estadoMatch = `${estado.pago} ${estado.entrega || ''}`.toLowerCase().includes(query);
        return idMatch || fechaMatch || itemMatch || estadoMatch;
      }
      return true;
    })
    .sort((a, b) => {
      if (ordenarPor === 'recientes') return (new Date(b.fecha || 0) - new Date(a.fecha || 0)) || (Number(a.id_orden) - Number(b.id_orden));
      if (ordenarPor === 'antiguas') return (new Date(a.fecha || 0) - new Date(b.fecha || 0)) || (Number(a.id_orden) - Number(b.id_orden));
      if (ordenarPor === 'mayor_precio') return Number(b.total || 0) - Number(a.total || 0);
      if (ordenarPor === 'menor_precio') return Number(a.total || 0) - Number(b.total || 0);
      return 0;
    }), [busqueda, filtroEstado, history, obtenerEstadoVisible, ordenarPor]);

  const totalPaginas = Math.max(1, Math.ceil(ordenesFiltradas.length / ORDER_PAGE_SIZE));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const ordenesPaginadas = ordenesFiltradas.slice((paginaSegura - 1) * ORDER_PAGE_SIZE, paginaSegura * ORDER_PAGE_SIZE);

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setBusqueda('');
    setOrdenarPor('recientes');
    setPaginaActual(1);
  };

  const limpiarPendientes = async () => {
    if (limpiandoPendientes) return;
    setConfirmarLimpiezaVisible(false);
    setLimpiandoPendientes(true);
    setResultadoLimpieza(null);
    try {
      const response = await cancelarMisPendientes();
      if (response.data?.ok !== true) {
        throw new Error('El servidor no confirmó la cancelación de las órdenes.');
      }
      const cantidad = Number(response.data.canceladas || 0);
      setResultadoLimpieza({
        type: 'success',
        text: cantidad > 0
          ? `${cantidad} orden${cantidad === 1 ? '' : 'es'} pendiente${cantidad === 1 ? '' : 's'} cancelada${cantidad === 1 ? '' : 's'}.`
          : 'No había órdenes pendientes para limpiar.',
      });
      await loadHistory();
    } catch (requestError) {
      console.warn('Error cleaning pending orders', requestError.message);
      setResultadoLimpieza({
        type: 'error',
        text: requestError.response?.data?.detail || 'No se pudo completar la limpieza. Intenta de nuevo.',
      });
    } finally {
      setLimpiandoPendientes(false);
    }
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
      const productos = (ordenSeleccionada.items || []).map((producto) => {
        const titulo = escaparHtml(producto.titulo || 'Libro');
        const autor = escaparHtml(producto.autor_libro || '');
        const cantidad = Number(producto.cantidad || 1);
        const precio = Number(producto.precio_libro || producto.precio_final || 0) * cantidad;
        return `<tr><td>${titulo}<br/><small>${autor} · Cantidad: ${cantidad}</small></td><td>${escaparHtml(formatCurrency(precio))}</td></tr>`;
      }).join('');
      const costoEnvio = Number(ordenSeleccionada.costo_envio || 0);
      const subtotal = (ordenSeleccionada.items || []).reduce(
        (suma, producto) => suma + Number(producto.precio_libro || 0) * Number(producto.cantidad || 1),
        0
      );
      const subtotalRow = `<tr><td>Subtotal</td><td>${escaparHtml(formatCurrency(subtotal))}</td></tr>`;
      const deliveryRow = ordenSeleccionada.tipo_entrega !== 'retiro_tienda' && costoEnvio > 0
        ? `<tr><td>Domicilio</td><td>${escaparHtml(formatCurrency(costoEnvio))}</td></tr>`
        : '';
      const discount = Number(ordenSeleccionada.total || 0) - Number(ordenSeleccionada.total_con_descuento || 0);
      const couponRow = ordenSeleccionada.cupon_aplicado && ordenSeleccionada.total_con_descuento != null
        ? `<tr><td>Cupón ${escaparHtml(ordenSeleccionada.cupon_aplicado)}</td><td>-${escaparHtml(formatCurrency(discount))}</td></tr>`
        : '';
      const date = escaparHtml(formatOrderDate(ordenSeleccionada.fecha));
      const orderId = escaparHtml(ordenSeleccionada.id_orden_db || ordenSeleccionada.id_orden);
      const method = escaparHtml(ordenSeleccionada.metodo_pago || 'Tarjeta de Crédito');
      const delivery = escaparHtml(ordenSeleccionada.tipo_entrega === 'retiro_tienda' ? 'Retiro en Tienda' : 'Envío a Domicilio');
      const status = escaparHtml(ordenSeleccionada.estado || ordenSeleccionada.estado_orden || 'pendiente');
      const total = escaparHtml(formatCurrency(totalComprobante));
      await Print.printAsync({
        html: `<!doctype html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;color:#2A2A2A;padding:28px}h1{color:#7A1E3A;text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:10px;border-bottom:1px solid #e0dbd4}td:last-child{text-align:right;font-weight:bold}.total{margin-top:20px;font-size:20px;font-weight:bold;color:#C5425A;text-align:right}.meta{background:#fcfaf7;padding:14px;border-radius:8px}.meta p{display:flex;justify-content:space-between;gap:12px}</style></head><body><h1>Comprobante BookyHome</h1><div class="meta"><p><b>Número de Orden</b><span>#${orderId}</span></p><p><b>Fecha</b><span>${date}</span></p><p><b>Método de Pago</b><span>${method}</span></p><p><b>Forma de Entrega</b><span>${delivery}</span></p><p><b>Estado</b><span>${status}</span></p></div><h2>Productos Comprados</h2><table>${productos || '<tr><td>No hay detalle de productos disponible.</td></tr>'}${subtotalRow}${deliveryRow}${couponRow}</table><p class="total">Total Pagado: ${total}</p></body></html>`,
      });
    } catch (printError) {
      Alert.alert('Error', 'No se pudo abrir el diálogo de impresión.');
    } finally {
      setPrintLoading(false);
    }
  };

  const estiloEstado = (clase) => {
    if (clase === 'entregado') return { color: '#047857', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' };
    if (clase === 'camino') return { color: '#1D4ED8', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' };
    if (clase === 'cancelado') return { color: '#B91C1C', backgroundColor: '#FEF2F2', borderColor: '#FECACA' };
    if (clase === 'devolucion') return { color: PRIMARY, backgroundColor: '#FDF2F4', borderColor: '#F8D2DA' };
    if (clase === 'procesando') return { color: '#B45309', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' };
    return { color: '#374151', backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' };
  };

  const renderOrder = (orden) => {
    const estadoVisible = obtenerEstadoVisible(orden);
    const estadoPagoStyle = estiloEstado(estadoVisible.pagoClase);
    const estadoEntregaStyle = estiloEstado(estadoVisible.entregaClase);
    const estiloIcono = estadoVisible.completada
      ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
      : estadoVisible.esCancelada
        ? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }
        : estadoVisible.pago === 'Pendiente de pago'
          ? { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
          : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' };
    return (
      <View key={String(orden.id_orden)} style={styles.card}>
        <View style={styles.orderHeader}>
          <View style={[styles.statusIcon, estiloIcono]}>
            {renderEstadoIcono(estadoVisible)}
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.cardTitle}>Orden #{orden.id_orden_db || orden.id_orden}</Text>
            <Text style={styles.cardText}>{orden.fecha ? new Date(orden.fecha).toLocaleDateString('es-CO') : '—'}</Text>
          </View>
          <Text style={styles.orderTotal}>${Number(orden.total ?? 0).toLocaleString('es-CO')} COP</Text>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.productCount}>
            <View style={styles.productDot} />
            <Text style={styles.productCountText}>
              {orden.items?.length || 0} {orden.items?.length === 1 ? 'ud' : 'uds'}
            </Text>
          </View>
          <Text style={styles.productPreview} numberOfLines={1}>
            {orden.items?.[0]?.titulo || 'Productos de la orden'}
          </Text>
          <View style={[
            styles.deliveryBadge,
            orden.tipo_entrega === 'retiro_tienda' ? styles.pickupBadge : styles.homeDeliveryBadge,
          ]}>
            <Text style={[
              styles.deliveryBadgeText,
              orden.tipo_entrega === 'retiro_tienda' ? styles.pickupBadgeText : styles.homeDeliveryBadgeText,
            ]}>
              {orden.tipo_entrega === 'retiro_tienda' ? '🏪 Retiro en tienda' : '🚚 Domicilio'}
            </Text>
          </View>
        </View>

        <View style={styles.statusGroup}>
          <Text style={[styles.statusBadge, estadoPagoStyle]}>{estadoVisible.pago}</Text>
          {estadoVisible.entrega && <Text style={[styles.statusBadge, estadoEntregaStyle]}>{estadoVisible.entrega}</Text>}
        </View>

        <View style={styles.orderActions}>
        {estadoVisible.pago === 'Pendiente de pago' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.payButton]}
            onPress={() => navigation.navigate('Checkout', { orderId: orden.id_orden_db || orden.id_orden })}
          >
            <Text style={[styles.actionButtonText, styles.payButtonText]}>Pagar</Text>
          </TouchableOpacity>
        ) : null}
          <TouchableOpacity style={[styles.actionButton, styles.detailsButton]} onPress={() => handleVerOrden(orden)}>
            <Text style={[styles.actionButtonText, styles.detailsButtonText]}>Ver Detalles</Text>
          </TouchableOpacity>
          {estadoVisible.pago === 'Pagado' && (
            <TouchableOpacity style={[styles.actionButton, styles.receiptButton]} onPress={() => handleVerOrden(orden, 'receipt')}>
              <Text style={[styles.actionButtonText, styles.receiptButtonText]}>Ver Baucher</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const estadoBadgeSeleccionado = getOrderStatusBadge(ordenSeleccionada);
  const esCompraPagada = ['pagado', 'pagada'].includes(
    String(ordenSeleccionada?.estado || ordenSeleccionada?.estado_orden || '').toLowerCase()
  );
  const subtotalComprobante = (ordenSeleccionada?.items || []).reduce(
    (suma, producto) => suma + Number(producto.precio_libro || 0) * Number(producto.cantidad || 1),
    0
  );
  const totalComprobante = Number(ordenSeleccionada?.total_con_descuento ?? ordenSeleccionada?.total ?? 0);
  const descuentoComprobante = Number(ordenSeleccionada?.total || 0) - Number(ordenSeleccionada?.total_con_descuento || 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerMain}>
              <View style={styles.headerIcon}><IconPackage size={24} color={WHITE} /></View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Mis Compras</Text>
                <Text style={styles.subtitle}>Historial, estado de entrega y comprobantes de pago de tus pedidos</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.purchaseCount}>
                <Text style={styles.purchaseCountText}>
                  {totalCompras} {totalCompras === 1 ? 'Compra registrada' : 'Compras registradas'}
                </Text>
              </View>
              {totalPendientes > 0 && (
                <TouchableOpacity
                  style={[styles.clearPendingButton, limpiandoPendientes && styles.actionDisabled]}
                  onPress={() => setConfirmarLimpiezaVisible(true)}
                  disabled={limpiandoPendientes}
                >
                  <Text style={styles.clearPendingText}>
                    {limpiandoPendientes ? 'Limpiando...' : `🗑️ Limpiar ${totalPendientes} pendiente${totalPendientes === 1 ? '' : 's'}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {resultadoLimpieza && (
            <View style={[styles.cleanupFeedback, resultadoLimpieza.type === 'error' && styles.cleanupFeedbackError]}>
              <Text style={[styles.cleanupFeedbackText, resultadoLimpieza.type === 'error' && styles.cleanupFeedbackErrorText]}>
                {resultadoLimpieza.text}
              </Text>
              <TouchableOpacity onPress={() => setResultadoLimpieza(null)} accessibilityLabel="Cerrar mensaje">
                <Text style={styles.cleanupFeedbackDismiss}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metrics}>
            {[
              { id: 'todos', label: 'Total', count: totalCompras, color: TEXT, activeBackground: '#FDF2F4', activeBorder: PRIMARY },
              { id: 'entregado', label: '✓ Entregadas', count: totalEntregadas, color: '#047857', activeBackground: '#ECFDF5', activeBorder: '#047857' },
              { id: 'camino', label: '🚚 En camino', count: totalEnCamino, color: '#2563EB', activeBackground: '#EFF6FF', activeBorder: '#2563EB' },
              { id: 'pendiente', label: '⏱️ Por Pagar', count: totalPendientes, color: '#B45309', activeBackground: '#FFFBEB', activeBorder: '#D97706' },
              { id: 'cancelado', label: '❌ Canceladas', count: totalCanceladas, color: '#DC2626', activeBackground: '#FEF2F2', activeBorder: '#DC2626' },
            ].map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={[
                  styles.metricCard,
                  filtroEstado === metric.id && { backgroundColor: metric.activeBackground, borderColor: metric.activeBorder },
                ]}
                onPress={() => { setFiltroEstado(metric.id); setPaginaActual(1); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.metricLabel, { color: metric.color }]}>{metric.label}</Text>
                <Text style={[styles.metricCount, { color: metric.color }]}>{metric.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.searchSortRow}>
            <View style={styles.searchBox}>
              <IconSearch size={18} color={MUTED} />
              <TextInput
                style={styles.searchInput}
                value={busqueda}
                onChangeText={(value) => { setBusqueda(value); setPaginaActual(1); }}
                placeholder="Buscar por # orden, libro o fecha..."
                placeholderTextColor="#8C857B"
                returnKeyType="search"
              />
              {!!busqueda && (
                <TouchableOpacity onPress={() => { setBusqueda(''); setPaginaActual(1); }} accessibilityLabel="Limpiar búsqueda">
                  <Text style={styles.clearSearch}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.sortButton} onPress={() => setOrdenarVisible(true)}>
              <Text style={styles.sortLabel}>Ordenar</Text>
              <Text style={styles.sortValue}>{SORT_OPTIONS.find((option) => option.value === ordenarPor)?.label}⌄</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            {[
              { id: 'todos', label: 'Todos', count: totalCompras },
              { id: 'entregado', label: '✓ Entregadas', count: totalEntregadas },
              { id: 'camino', label: '🚚 En camino', count: totalEnCamino },
              { id: 'pendiente', label: '⏱️ Pendientes de pago', count: totalPendientes },
              { id: 'cancelado', label: '❌ Canceladas', count: totalCanceladas },
            ].map((tab) => {
              const activo = filtroEstado === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterChip, activo && styles.activeFilterChip]}
                  onPress={() => { setFiltroEstado(tab.id); setPaginaActual(1); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, activo && styles.activeFilterChipText]}>{tab.label}</Text>
                  <Text style={[styles.filterChipCount, activo && styles.activeFilterChipCount]}>{tab.count}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {(filtroEstado !== 'todos' || busqueda.trim()) && (
            <TouchableOpacity style={styles.resetFilters} onPress={limpiarFiltros}>
              <Text style={styles.resetFiltersText}>Restablecer filtros</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.stateCard}><ActivityIndicator size="large" color={PRIMARY} /><Text style={styles.stateMessage}>Cargando tus compras...</Text></View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadHistory}><Text style={styles.retryButtonText}>Intentar de nuevo</Text></TouchableOpacity>
          </View>
        ) : ordenesFiltradas.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No se encontraron compras</Text>
            <Text style={styles.emptyDescription}>
              {busqueda || filtroEstado !== 'todos'
                ? 'No hay órdenes que coincidan con los criterios de búsqueda o filtros seleccionados.'
                : 'Aún no has realizado ninguna compra en BookyHome.'}
            </Text>
            {(busqueda || filtroEstado !== 'todos') && (
              <TouchableOpacity style={styles.retryButton} onPress={limpiarFiltros}>
                <Text style={styles.retryButtonText}>Mostrar todas las compras</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.ordersList}>
            {ordenesPaginadas.map(renderOrder)}
            {ordenesFiltradas.length > ORDER_PAGE_SIZE && (
              <View style={styles.pagination}>
                <Text style={styles.paginationInfo}>
                  Mostrando {(paginaSegura - 1) * ORDER_PAGE_SIZE + 1}–{Math.min(paginaSegura * ORDER_PAGE_SIZE, ordenesFiltradas.length)} de {ordenesFiltradas.length} órdenes
                </Text>
                <View style={styles.paginationButtons}>
                  <TouchableOpacity
                    style={[styles.pageButton, paginaSegura <= 1 && styles.pageButtonDisabled]}
                    disabled={paginaSegura <= 1}
                    onPress={() => setPaginaActual((page) => Math.max(1, page - 1))}
                  >
                    <Text style={styles.pageButtonText}>‹ Anterior</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageNumber}>{paginaSegura} / {totalPaginas}</Text>
                  <TouchableOpacity
                    style={[styles.pageButton, paginaSegura >= totalPaginas && styles.pageButtonDisabled]}
                    disabled={paginaSegura >= totalPaginas}
                    onPress={() => setPaginaActual((page) => Math.min(totalPaginas, page + 1))}
                  >
                    <Text style={styles.pageButtonText}>Siguiente ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        <Footer onLinkPress={() => {}} />
      </ScrollView>

      <Modal
        visible={confirmarLimpiezaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmarLimpiezaVisible(false)}
      >
        <View style={styles.cleanupOverlay}>
          <View style={styles.cleanupModal}>
            <View style={styles.cleanupModalIcon}><Text style={styles.cleanupModalEmoji}>🗑️</Text></View>
            <Text style={styles.cleanupModalTitle}>Limpiar órdenes pendientes</Text>
            <Text style={styles.cleanupModalDescription}>
              Se cancelarán las {totalPendientes} órdenes pendientes de pago que no completaste.
            </Text>
            <View style={styles.cleanupModalActions}>
              <TouchableOpacity
                style={styles.cleanupCancelButton}
                onPress={() => setConfirmarLimpiezaVisible(false)}
              >
                <Text style={styles.cleanupCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cleanupConfirmButton, limpiandoPendientes && styles.actionDisabled]}
                onPress={limpiarPendientes}
                disabled={limpiandoPendientes}
              >
                <Text style={styles.cleanupConfirmText}>{limpiandoPendientes ? 'Limpiando...' : '🗑️ Limpiar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={ordenarVisible} transparent animationType="fade" onRequestClose={() => setOrdenarVisible(false)}>
        <TouchableOpacity style={styles.sortOverlay} activeOpacity={1} onPress={() => setOrdenarVisible(false)}>
          <View style={styles.sortModal}>
            <Text style={styles.sortModalTitle}>Ordenar compras</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.sortOption, ordenarPor === option.value && styles.sortOptionActive]}
                onPress={() => { setOrdenarPor(option.value); setPaginaActual(1); setOrdenarVisible(false); }}
              >
                <Text style={[styles.sortOptionText, ordenarPor === option.value && styles.sortOptionTextActive]}>{option.label}</Text>
                {ordenarPor === option.value && <Text style={styles.sortCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={detalleVisible} transparent animationType="slide" onRequestClose={() => setDetalleVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModal, detalleModo === 'receipt' && styles.receiptModal]}>
            {detalleLoading ? (
              <View style={styles.detailLoading}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.cardText}>{detalleModo === 'receipt' ? 'Cargando baucher...' : 'Cargando información de la orden...'}</Text>
              </View>
            ) : ordenSeleccionada ? (
              detalleModo === 'receipt' ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.receiptHeader}>
                    <View style={styles.receiptIcon}>
                      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <Polyline points="22 4 12 14.01 9 11.01" />
                      </Svg>
                    </View>
                    <Text style={styles.receiptTitle}>¡Compra Exitosa!</Text>
                    <Text style={styles.receiptSubtitle}>Gracias por tu compra en BookyHome</Text>
                  </View>

                  <View style={styles.receiptInfoBox}>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Número de Orden</Text><Text style={styles.detailValue}>#{ordenSeleccionada.id_orden_db || ordenSeleccionada.id_orden}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Fecha</Text><Text style={styles.detailValue}>{formatOrderDate(ordenSeleccionada.fecha)}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Método de Pago</Text><Text style={styles.detailValue}>{ordenSeleccionada.metodo_pago || 'Tarjeta de Crédito'}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Forma de Entrega</Text><Text style={styles.detailValue}>{ordenSeleccionada.tipo_entrega === 'retiro_tienda' ? '🏪 Retiro en Tienda' : '🚚 Envío a Domicilio'}</Text></View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Estado</Text>
                      <Text style={styles.receiptStateBadge}>{ordenSeleccionada.estado || ordenSeleccionada.estado_orden || 'pendiente'}</Text>
                    </View>
                  </View>

                  <Text style={styles.receiptProductsTitle}>Productos Comprados</Text>
                  {(ordenSeleccionada.items || []).length > 0 ? (ordenSeleccionada.items || []).map((producto, index) => (
                    <View key={`${producto.id_libro}-${index}`} style={styles.receiptProductRow}>
                      <View style={styles.receiptProductInfo}>
                        <Text style={styles.productTitle}>{producto.titulo || 'Libro'}</Text>
                        <Text style={styles.productMeta}>{producto.autor_libro || 'Autor'} · Cantidad: {producto.cantidad || 1}</Text>
                      </View>
                      <Text style={styles.receiptProductPrice}>
                        {formatCurrency(Number(producto.precio_libro || producto.precio_final || 0) * Number(producto.cantidad || 1))}
                      </Text>
                    </View>
                  )) : (
                    <Text style={styles.emptyProducts}>No hay detalle de productos disponible.</Text>
                  )}

                  <View style={styles.receiptTotals}>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Subtotal</Text><Text style={styles.detailValue}>{formatCurrency(subtotalComprobante)}</Text></View>
                    {ordenSeleccionada.tipo_entrega !== 'retiro_tienda' && Number(ordenSeleccionada.costo_envio || 0) > 0 && (
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>Domicilio</Text><Text style={styles.detailValue}>{formatCurrency(ordenSeleccionada.costo_envio)}</Text></View>
                    )}
                    {ordenSeleccionada.cupon_aplicado && ordenSeleccionada.total_con_descuento != null && (
                      <View style={styles.couponRow}>
                        <Text style={styles.couponText}>🏷️ Cupón {ordenSeleccionada.cupon_aplicado}</Text>
                        <Text style={styles.couponText}>-{formatCurrency(descuentoComprobante)}</Text>
                      </View>
                    )}
                    <View style={styles.receiptPaidRow}>
                      <Text style={styles.receiptPaidLabel}>Total Pagado</Text>
                      <Text style={styles.receiptPaidValue}>{formatCurrency(totalComprobante)}</Text>
                    </View>
                  </View>

                  <View style={styles.receiptActions}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setDetalleVisible(false)}><Text style={styles.closeBtnText}>Cerrar</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.emailBtn, emailLoading && styles.actionDisabled]} onPress={enviarComprobante} disabled={emailLoading}>
                      <Text style={styles.emailBtnText}>{emailLoading ? 'Enviando...' : 'Enviar por correo'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.printBtn, printLoading && styles.actionDisabled]} onPress={imprimirComprobante} disabled={printLoading}>
                      <Text style={styles.printBtnText}>{printLoading ? 'Abriendo...' : 'Imprimir'}</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.orderDetailHeader}>
                    <View style={styles.orderDetailHeading}>
                      <Text style={styles.orderDetailTitle}>Orden #{ordenSeleccionada.id_orden_db || ordenSeleccionada.id_orden}</Text>
                      <Text style={[styles.detailStateBadge, estiloEstado(estadoBadgeSeleccionado.className)]}>{estadoBadgeSeleccionado.label}</Text>
                      <Text style={styles.orderDetailDate}>{formatOrderDate(ordenSeleccionada.fecha)}</Text>
                    </View>
                    <TouchableOpacity style={styles.dismissButton} onPress={() => setDetalleVisible(false)} accessibilityLabel="Cerrar detalles">
                      <Text style={styles.dismissButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  {ordenSeleccionada.tipo_entrega === 'retiro_tienda' ? (
                    <View style={styles.pickupInfoBox}>
                      <View style={styles.deliveryHeader}>
                        <Text style={styles.deliveryTitle}>🏪 Click & Collect · Retiro en Tienda</Text>
                        <Text style={styles.pickupPin}>PIN: {ordenSeleccionada.pin_retiro || '----'}</Text>
                      </View>
                      <View style={styles.deliveryFacts}>
                        <Text style={styles.deliveryFact}><Text style={styles.deliveryFactStrong}>Librería:</Text> {ordenSeleccionada.tienda_retiro?.nombre_tienda || 'Librería Asociada'}</Text>
                        {!!ordenSeleccionada.tienda_retiro?.direccion && <Text style={styles.deliveryFact}><Text style={styles.deliveryFactStrong}>Dirección:</Text> 📍 {ordenSeleccionada.tienda_retiro.direccion}</Text>}
                        {!!ordenSeleccionada.tienda_retiro?.telefono && <Text style={styles.deliveryFact}><Text style={styles.deliveryFactStrong}>Teléfono:</Text> 📞 {ordenSeleccionada.tienda_retiro.telefono}</Text>}
                        {!!ordenSeleccionada.fecha_limite_retiro && (
                          <Text style={styles.deliveryFact}>
                            <Text style={styles.deliveryFactStrong}>Plazo de retiro:</Text> Hasta el {new Date(ordenSeleccionada.fecha_limite_retiro).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </View>
                      <View style={styles.pickupStatusBox}>
                        <Text style={styles.pickupStatusText}>
                          {ordenSeleccionada.estado === 'pagado' || ordenSeleccionada.estado_orden === 'pagado'
                            ? '✓ Pago completado. Presenta tu PIN en el mostrador para retirar tus libros.'
                            : ordenSeleccionada.estado_retiro === 'habilitado_pago'
                              ? '🔔 Pago habilitado por el vendedor en la librería.'
                              : ordenSeleccionada.estado_retiro === 'en_tienda'
                                ? '📍 Notificaste tu llegada. El encargado te atenderá en breve.'
                                : '🟡 Libros apartados en la librería física.'}
                        </Text>
                        {ordenSeleccionada.estado_retiro === 'reservado' && !esCompraPagada && (
                          <TouchableOpacity style={styles.arrivalButton} onPress={handleNotificarLlegada} disabled={llegadaLoading}>
                            <Text style={styles.arrivalButtonText}>{llegadaLoading ? 'Notificando...' : '📍 Notificar llegada'}</Text>
                          </TouchableOpacity>
                        )}
                        {ordenSeleccionada.estado_retiro === 'habilitado_pago' && !esCompraPagada && (
                          <TouchableOpacity
                            style={styles.pickupPayButton}
                            onPress={() => {
                              setDetalleVisible(false);
                              navigation.navigate('Checkout', { orderId: ordenSeleccionada.id_orden_db || ordenSeleccionada.id_orden });
                            }}
                          >
                            <Text style={styles.pickupPayButtonText}>💳 Pagar Ahora</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.homeDeliveryInfoBox}>
                      <Text style={styles.deliveryTitle}>🚚 Envío a Domicilio</Text>
                      {ordenSeleccionada.envio?.numero_guia ? (
                        <Text style={styles.deliveryFact}>
                          Guía: <Text style={styles.deliveryFactStrong}>{ordenSeleccionada.envio.numero_guia}</Text> ({ordenSeleccionada.envio.empresa_mensajeria}){'\n'}
                          Estado: {ordenSeleccionada.envio.estado_envio || 'En tránsito'}
                        </Text>
                      ) : (
                        <Text style={styles.deliveryFact}>
                          {['entregada', 'entregado'].includes(String(ordenSeleccionada.estado || ordenSeleccionada.estado_orden || '').toLowerCase())
                            ? `Tu pedido fue entregado${ordenSeleccionada.envio?.empresa_mensajeria ? ` por ${ordenSeleccionada.envio.empresa_mensajeria}` : ''}.`
                            : 'Tu pedido será despachado por la librería a tu dirección registrada.'}
                        </Text>
                      )}
                      {Number(ordenSeleccionada.costo_envio || 0) > 0 && (
                        <Text style={styles.deliveryFact}>Costo de domicilio: <Text style={styles.deliveryFactStrong}>{formatCurrency(ordenSeleccionada.costo_envio)}</Text></Text>
                      )}
                    </View>
                  )}

                  <Text style={styles.detailProductsTitle}>Productos ({ordenSeleccionada.items?.length || 0})</Text>
                  {(ordenSeleccionada.items || []).length > 0 ? (ordenSeleccionada.items || []).map((producto, index) => (
                    <View key={`${producto.id_libro}-${index}`} style={styles.detailProductRow}>
                      <View style={styles.receiptProductInfo}>
                        <Text style={styles.productTitle}>{producto.titulo || 'Libro'}</Text>
                        <Text style={styles.productMeta}>{producto.autor_libro || 'Autor'} · Cantidad: {producto.cantidad || 1}</Text>
                      </View>
                      <Text style={styles.receiptProductPrice}>
                        {formatCurrency(Number(producto.precio_libro || producto.precio_final || 0) * Number(producto.cantidad || 1))}
                      </Text>
                    </View>
                  )) : (
                    <Text style={styles.emptyProducts}>No hay detalle de productos disponible.</Text>
                  )}

                  <View style={styles.detailFinancials}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Método de pago</Text>
                      <Text style={styles.detailValue}>{ordenSeleccionada.metodo_pago || 'En línea'}</Text>
                    </View>
                    <View style={styles.detailTotalRow}>
                      <Text style={styles.detailTotalLabel}>Total</Text>
                      <Text style={styles.detailTotalValue}>{formatCurrency(ordenSeleccionada.total)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailFooterActions}>
                    {esCompraPagada && (
                      <TouchableOpacity style={styles.detailReceiptButton} onPress={() => handleVerOrden(ordenSeleccionada, 'receipt')}>
                        <Text style={styles.detailReceiptButtonText}>📄 Ver Baucher</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.detailCloseButton} onPress={() => setDetalleVisible(false)}>
                      <Text style={styles.detailCloseButtonText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 28 },
  headerCard: { backgroundColor: WHITE, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#EBE5DC' },
  headerRow: { gap: 12 },
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { fontSize: 21, fontWeight: '800', color: TEXT, marginBottom: 3 },
  subtitle: { fontSize: 12, color: MUTED, lineHeight: 17 },
  headerActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  purchaseCount: { backgroundColor: '#FDF2F4', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#F8D2DA' },
  purchaseCountText: { color: PRIMARY, fontSize: 12, fontWeight: '800' },
  clearPendingButton: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  clearPendingText: { color: '#B45309', fontSize: 12, fontWeight: '700' },
  cleanupFeedback: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  cleanupFeedbackError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  cleanupFeedbackText: { flex: 1, color: '#047857', fontSize: 12, fontWeight: '600' },
  cleanupFeedbackErrorText: { color: '#B91C1C' },
  cleanupFeedbackDismiss: { color: MUTED, fontSize: 21, lineHeight: 22, paddingHorizontal: 3 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 16, paddingTop: 14 },
  metricCard: { width: '48.5%', minHeight: 62, justifyContent: 'center', backgroundColor: '#FAFAF9', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  metricLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricCount: { fontSize: 19, fontWeight: '800', marginTop: 2 },
  filterCard: { backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#EBE5DC' },
  searchSortRow: { gap: 10 },
  searchBox: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FAFAF9' },
  searchInput: { flex: 1, minWidth: 0, color: TEXT, fontSize: 13, paddingVertical: 9 },
  clearSearch: { color: MUTED, fontSize: 23, lineHeight: 25, paddingHorizontal: 3 },
  sortButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, backgroundColor: WHITE },
  sortLabel: { color: MUTED, fontSize: 12, fontWeight: '600' },
  sortValue: { color: '#374151', fontSize: 13, fontWeight: '700' },
  filterChips: { gap: 8, paddingTop: 13, marginTop: 13, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: WHITE },
  activeFilterChip: { borderColor: PRIMARY, backgroundColor: PRIMARY },
  filterChipText: { color: '#4B5563', fontSize: 12, fontWeight: '700' },
  activeFilterChipText: { color: WHITE },
  filterChipCount: { minWidth: 20, textAlign: 'center', color: '#6B7280', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  activeFilterChipCount: { color: WHITE, backgroundColor: 'rgba(255,255,255,0.28)' },
  resetFilters: { alignSelf: 'flex-end', paddingTop: 11, paddingHorizontal: 4 },
  resetFiltersText: { color: PRIMARY, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  stateCard: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: '#EBE5DC', padding: 26, alignItems: 'center', marginTop: 2 },
  stateMessage: { color: MUTED, textAlign: 'center', marginTop: 10, fontSize: 14 },
  emptyIcon: { fontSize: 38, marginBottom: 6 },
  emptyTitle: { color: TEXT, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyDescription: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, marginBottom: 14 },
  retryButton: { backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  retryButtonText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  ordersList: { paddingBottom: 4 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EBE5DC',
  },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIcon: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
  cardText: { color: MUTED, fontSize: 12, marginTop: 3 },
  orderTotal: { color: PRIMARY, fontSize: 13, fontWeight: '800', textAlign: 'right', flexShrink: 0 },
  orderDetails: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13 },
  productCount: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  productDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  productCountText: { color: '#047857', fontSize: 11, fontWeight: '700' },
  productPreview: { flex: 1, minWidth: 0, color: MUTED, fontSize: 11 },
  deliveryBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  deliveryBadgeText: { fontSize: 10, fontWeight: '700' },
  pickupBadge: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  pickupBadgeText: { color: '#1E40AF' },
  homeDeliveryBadge: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  homeDeliveryBadgeText: { color: '#374151' },
  statusGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  orderActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  actionButton: { flexGrow: 1, flexBasis: '30%', minHeight: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 7 },
  actionButtonText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  payButton: { backgroundColor: '#FDF2F4', borderColor: '#F8D2DA' },
  payButtonText: { color: PRIMARY },
  detailsButton: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
  detailsButtonText: { color: '#334155' },
  receiptButton: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  receiptButtonText: { color: WHITE },
  pagination: { backgroundColor: WHITE, borderWidth: 1, borderColor: '#EBE5DC', borderRadius: 12, padding: 13, marginBottom: 12 },
  paginationInfo: { color: MUTED, fontSize: 12, textAlign: 'center', marginBottom: 10 },
  paginationButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pageButton: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  pageNumber: { color: TEXT, fontSize: 12, fontWeight: '700' },
  sortOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15,23,42,0.45)' },
  sortModal: { backgroundColor: WHITE, borderRadius: 16, padding: 18 },
  sortModalTitle: { color: TEXT, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  sortOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
  sortOptionActive: { backgroundColor: '#FDF2F4' },
  sortOptionText: { color: '#374151', fontSize: 14 },
  sortOptionTextActive: { color: PRIMARY, fontWeight: '700' },
  sortCheck: { color: PRIMARY, fontWeight: '800' },
  cleanupOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.55)', padding: 24 },
  cleanupModal: { width: '100%', maxWidth: 420, backgroundColor: WHITE, borderRadius: 16, padding: 22, alignItems: 'center' },
  cleanupModalIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cleanupModalEmoji: { fontSize: 27 },
  cleanupModalTitle: { color: TEXT, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  cleanupModalDescription: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  cleanupModalActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 },
  cleanupCancelButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingVertical: 11 },
  cleanupCancelText: { color: '#334155', fontSize: 13, fontWeight: '700' },
  cleanupConfirmButton: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, borderWidth: 1, borderColor: PRIMARY, borderRadius: 8, paddingVertical: 11 },
  cleanupConfirmText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 18 },
  detailModal: { maxHeight: '88%', backgroundColor: WHITE, borderRadius: 18, padding: 20 },
  receiptModal: { padding: 24 },
  detailLoading: { alignItems: 'center', gap: 14, paddingVertical: 45 },
  receiptHeader: { alignItems: 'center', borderBottomWidth: 2, borderColor: BORDER, paddingBottom: 14, marginBottom: 14 },
  receiptIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FDF0F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  receiptTitle: { color: PRIMARY, fontSize: 24, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  receiptSubtitle: { color: '#666', fontSize: 14, textAlign: 'center' },
  receiptInfoBox: { backgroundColor: '#FCFAF7', borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 15, gap: 10, marginBottom: 14 },
  receiptStateBadge: { color: '#2E7D32', backgroundColor: '#E8F5E9', borderColor: '#C8E6C9', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  receiptProductsTitle: { color: TEXT, fontSize: 17, fontWeight: '700', marginBottom: 10 },
  receiptProductRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FAF8F6', borderRadius: 8, borderWidth: 1, borderColor: BORDER, marginBottom: 9 },
  receiptProductInfo: { flex: 1, minWidth: 0 },
  receiptProductPrice: { color: PRIMARY, fontSize: 13, fontWeight: '800', textAlign: 'right', flexShrink: 0 },
  emptyProducts: { color: MUTED, fontSize: 13, paddingVertical: 10 },
  receiptTotals: { borderTopWidth: 2, borderColor: BORDER, paddingTop: 13, marginTop: 4, gap: 9 },
  receiptPaidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 5 },
  receiptPaidLabel: { color: TEXT, fontSize: 17, fontWeight: '800' },
  receiptPaidValue: { color: '#C5425A', fontSize: 19, fontWeight: '900', textAlign: 'right', flexShrink: 1 },
  receiptActions: { marginTop: 18, gap: 10 },
  orderDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 16, marginBottom: 18 },
  orderDetailHeading: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  orderDetailTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  detailStateBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  orderDetailDate: { flexBasis: '100%', color: '#64748B', fontSize: 12, marginTop: -3 },
  dismissButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  dismissButtonText: { color: '#64748B', fontSize: 22, lineHeight: 25, fontWeight: '700' },
  pickupInfoBox: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE', borderRadius: 14, padding: 15, marginBottom: 18 },
  deliveryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 13 },
  deliveryTitle: { color: '#1E3A8A', fontSize: 14, fontWeight: '800', flexShrink: 1 },
  pickupPin: { color: '#FDE047', backgroundColor: '#0F172A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  deliveryFacts: { gap: 6 },
  deliveryFact: { color: '#334155', fontSize: 12, lineHeight: 18 },
  deliveryFactStrong: { color: '#1E293B', fontWeight: '800' },
  pickupStatusBox: { borderTopWidth: 1, borderColor: '#DBEAFE', marginTop: 13, paddingTop: 12, gap: 10 },
  pickupStatusText: { color: '#15803D', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  arrivalButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#16A34A' },
  arrivalButtonText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  pickupPayButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, backgroundColor: PRIMARY },
  pickupPayButtonText: { color: WHITE, fontSize: 12, fontWeight: '800' },
  homeDeliveryInfoBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 16, marginBottom: 18, gap: 8 },
  detailProductsTitle: { color: '#1E293B', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  detailProductRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, paddingHorizontal: 13, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 9 },
  detailFinancials: { borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 14, marginTop: 5, marginBottom: 17, gap: 10 },
  detailTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 3 },
  detailTotalLabel: { color: TEXT, fontSize: 17, fontWeight: '800' },
  detailTotalValue: { color: PRIMARY, fontSize: 18, fontWeight: '800', textAlign: 'right' },
  detailFooterActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 9 },
  detailReceiptButton: { backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  detailReceiptButtonText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  detailCloseButton: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  detailCloseButtonText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { color: MUTED, fontSize: 13, flex: 1 },
  detailValue: { color: TEXT, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  productTitle: { color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  productMeta: { color: MUTED, fontSize: 12, lineHeight: 17 },
  couponRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EEF8EF', borderWidth: 1, borderColor: '#C8E6C9', borderRadius: 7, padding: 9 },
  couponText: { color: '#287A45', fontSize: 12, fontWeight: '800' },
  closeBtn: { borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 9, paddingVertical: 12, alignItems: 'center' },
  closeBtnText: { color: PRIMARY, fontWeight: '800', fontSize: 15 },
  emailBtn: { backgroundColor: '#2E7D32', borderRadius: 9, paddingVertical: 12, alignItems: 'center' },
  emailBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  printBtn: { backgroundColor: PRIMARY, borderRadius: 9, paddingVertical: 12, alignItems: 'center' },
  printBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  actionDisabled: { opacity: 0.65 },
});
