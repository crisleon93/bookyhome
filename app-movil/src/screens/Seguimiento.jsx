import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SafeAreaView from '../components/ThemedSafeAreaView';
import { useThemedStyles } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { cancelOrder, confirmarEntrega, getOrdenes } from '../services/api';
import { IconClose, IconTruck } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BACKGROUND = '#F8F1F4';
const TEXT = '#1A1A1A';
const MUTED = '#6B7280';
const PAGE_SIZE = 8;

const ESTADOS = {
  esperando: {
    etiqueta: 'Esperando envío',
    borde: '#D18B21',
    fondo: '#FFF7E6',
    texto: '#92400E',
    descripcion: 'El vendedor aún está preparando el envío.',
  },
  camino: {
    etiqueta: 'En camino',
    borde: '#2563EB',
    fondo: '#EFF6FF',
    texto: '#1D4ED8',
    descripcion: 'Tu pedido está en ruta.',
  },
  entregado: {
    etiqueta: 'Entregado',
    borde: '#15803D',
    fondo: '#ECFDF3',
    texto: '#166534',
    descripcion: 'Entrega confirmada por el comprador.',
  },
};

const idVisible = (orden) => orden.id_orden_db || orden.id_orden;
const ordenarPorFecha = (ordenes) => [...ordenes].sort(
  (a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')),
);

function separarOrdenes(ordenes) {
  const esperando = [];
  const camino = [];
  const entregado = [];

  ordenes.forEach((orden) => {
    const estado = String(orden.estado || '').toLowerCase().trim();
    if (/^entregad/.test(estado)) {
      entregado.push(orden);
    } else if (/^enviad/.test(estado)) {
      camino.push(orden);
    } else if (/^cancelad/.test(estado) || /^pend/.test(estado)) {
      return;
    } else if (/^pagad/.test(estado)) {
      if (orden.envio?.numero_guia) camino.push(orden);
      else esperando.push(orden);
    }
  });

  return {
    esperando: ordenarPorFecha(esperando),
    camino: ordenarPorFecha(camino),
    entregado: ordenarPorFecha(entregado),
  };
}

function formatearFechaHora(fecha, valorVacio = 'No registrada') {
  if (!fecha) return valorVacio;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return valorVacio;
  const incluyeHora = /T|\d{1,2}:\d{2}/.test(String(fecha));
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    ...(incluyeHora ? { timeStyle: 'short' } : {}),
  }).format(valor);
}

function origenEnvio(orden) {
  if (orden.envio?.origen) return orden.envio.origen;
  const tienda = orden.items?.find((item) => item.nombre_tienda)?.nombre_tienda;
  return tienda ? `Tienda ${tienda}` : 'Tienda vendedora';
}

function urlRastreo(envio) {
  if (!envio) return null;
  if (String(envio.empresa_mensajeria || '').toLowerCase().includes('interrapid')) {
    return 'https://www.interrapidisimo.com';
  }
  return envio.url_rastreo || envio.sitio_web || null;
}

function DatoInfo({ etiqueta, valor }) {
  const styles = useThemedStyles(baseStyles);
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{etiqueta.toUpperCase()}</Text>
      <Text style={styles.infoValue}>{valor}</Text>
    </View>
  );
}

function EventoEntrega({ color, titulo, detalle, fecha }) {
  const styles = useThemedStyles(baseStyles);
  return (
    <View style={styles.eventRow}>
      <View style={[styles.eventDot, { backgroundColor: color, shadowColor: color }]} />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{titulo}</Text>
        <Text style={styles.eventDescription}>{detalle}</Text>
        <Text style={styles.eventDate}>{fecha}</Text>
      </View>
    </View>
  );
}

export default function Seguimiento() {
  const styles = useThemedStyles(baseStyles);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [estadoActivo, setEstadoActivo] = useState('esperando');
  const [pagina, setPagina] = useState(1);
  const [detalle, setDetalle] = useState(null);
  const [confirmacionPendiente, setConfirmacionPendiente] = useState(null);
  const [cancelacionPendiente, setCancelacionPendiente] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cargarOrdenes = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) setCargando(true);
    else setActualizando(true);
    try {
      const respuesta = await getOrdenes();
      setOrdenes(respuesta.data || []);
      setAviso(null);
    } catch (error) {
      console.error('Error cargando seguimientos:', error);
      setAviso({
        tipo: 'error',
        texto: error.response?.data?.detail || 'No se pudieron cargar tus seguimientos. Inténtalo nuevamente.',
      });
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarOrdenes();
    const intervalo = setInterval(() => cargarOrdenes(false), 20000);
    return () => clearInterval(intervalo);
  }, [cargarOrdenes]);

  const pedidosPorEstado = useMemo(() => separarOrdenes(ordenes), [ordenes]);
  const pedidosActuales = pedidosPorEstado[estadoActivo];
  const totalPaginas = Math.ceil(pedidosActuales.length / PAGE_SIZE);
  const pedidosVisibles = pedidosActuales.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);
  const detalleEntregado = detalle && /^entregad/i.test(String(detalle.estado || ''));
  const fechaDespacho = detalle?.envio?.fecha_despacho_con_hora
    || detalle?.envio?.actualizado_en
    || detalle?.envio?.fecha_despacho;

  const cambiarEstado = (estado) => {
    setEstadoActivo(estado);
    setPagina(1);
  };

  const confirmarRecepcion = async () => {
    const orden = confirmacionPendiente;
    if (!orden) return;
    setProcesando(true);
    try {
      await confirmarEntrega(idVisible(orden));
      setConfirmacionPendiente(null);
      setAviso({ tipo: 'exito', texto: `Confirmaste la entrega del pedido #${idVisible(orden)}.` });
      await cargarOrdenes(false);
      setEstadoActivo('entregado');
      setPagina(1);
    } catch (error) {
      setAviso({
        tipo: 'error',
        texto: error.response?.data?.detail || 'No se pudo confirmar la entrega. Inténtalo nuevamente.',
      });
    } finally {
      setProcesando(false);
    }
  };

  const cancelarPedido = async () => {
    const orden = cancelacionPendiente;
    const motivo = motivoCancelacion.trim();
    if (!orden || motivo.length < 5) return;
    setProcesando(true);
    try {
      await cancelOrder(idVisible(orden), motivo);
      setCancelacionPendiente(null);
      setMotivoCancelacion('');
      setAviso({ tipo: 'exito', texto: `El pedido #${idVisible(orden)} fue cancelado.` });
      await cargarOrdenes(false);
      setEstadoActivo('esperando');
      setPagina(1);
    } catch (error) {
      setAviso({
        tipo: 'error',
        texto: error.response?.data?.detail || 'No se pudo cancelar el pedido.',
      });
    } finally {
      setProcesando(false);
    }
  };

  const abrirRastreo = async () => {
    const enlace = urlRastreo(detalle?.envio);
    if (!enlace) return;
    try {
      await Linking.openURL(enlace);
    } catch (error) {
      console.error('No se pudo abrir el sitio de rastreo:', error);
      setAviso({ tipo: 'error', texto: 'No se pudo abrir el sitio de rastreo.' });
    }
  };

  const renderPedido = (orden) => {
    const estilo = ESTADOS[estadoActivo];
    const esEntregado = estadoActivo === 'entregado';
    const nombreTransportadora = orden.envio?.empresa_mensajeria
      || (estadoActivo === 'esperando' ? 'Pago confirmado' : 'Información de envío');

    return (
      <View key={idVisible(orden)} style={[styles.orderCard, { borderColor: `${estilo.borde}55` }]}>
        <View style={[styles.orderAccent, { backgroundColor: estilo.borde }]} />
        <View style={styles.orderHeading}>
          <View style={[styles.truckBadge, { backgroundColor: estilo.fondo, shadowColor: estilo.borde }]}>
            <IconTruck size={25} color={estilo.texto} />
          </View>
          <View style={styles.orderHeadingText}>
            <Text style={styles.orderNumber}>Pedido #{idVisible(orden)}</Text>
            <Text style={styles.orderCarrier} numberOfLines={1}>{nombreTransportadora}</Text>
          </View>
        </View>
        <View style={styles.orderBody}>
          <Text style={styles.orderDescription}>
            {esEntregado ? ESTADOS.entregado.descripcion : ESTADOS[estadoActivo].descripcion}
          </Text>
          {estadoActivo === 'camino' && (
            <View style={styles.actionStack}>
              <TouchableOpacity
                style={[styles.outlineAction, styles.primaryOutline]}
                disabled={procesando}
                onPress={() => setConfirmacionPendiente(orden)}
              >
                <Text style={[styles.outlineActionText, { color: PRIMARY }]}>
                  {procesando ? 'Confirmando...' : 'Confirmar que recibí el pedido'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.outlineAction, styles.cancelAction]}
                disabled={procesando}
                onPress={() => {
                  setCancelacionPendiente(orden);
                  setMotivoCancelacion('');
                }}
              >
                <Text style={[styles.outlineActionText, { color: '#DC2626' }]}>Cancelar pedido</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineAction} onPress={() => setDetalle(orden)}>
                <Text style={[styles.outlineActionText, { color: estilo.texto }]}>Información del envío</Text>
              </TouchableOpacity>
            </View>
          )}
          {esEntregado && (
            <TouchableOpacity style={styles.outlineAction} onPress={() => setDetalle(orden)}>
              <Text style={[styles.outlineActionText, { color: estilo.texto }]}>Información de entrega</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={actualizando} onRefresh={() => cargarOrdenes(false)} tintColor={PRIMARY} />}
      >
        <View style={styles.pageHeader}>
          <IconTruck size={30} color={PRIMARY} />
          <View style={styles.pageHeaderCopy}>
            <Text style={styles.pageTitle}>Seguimiento de pedidos</Text>
            <Text style={styles.pageSubtitle}>Consulta el estado de tus envíos y confirma cuando recibas tu pedido.</Text>
          </View>
        </View>

        {!!aviso && (
          <View style={[styles.notice, aviso.tipo === 'error' ? styles.errorNotice : styles.successNotice]}>
            <Text style={[styles.noticeText, aviso.tipo === 'error' ? styles.errorText : styles.successText]}>{aviso.texto}</Text>
            {aviso.tipo === 'error' && (
              <TouchableOpacity onPress={() => cargarOrdenes()} accessibilityLabel="Reintentar carga">
                <Text style={[styles.retryText, styles.errorText]}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {cargando ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Cargando seguimientos...</Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
            >
              {Object.entries(ESTADOS).map(([clave, estilo]) => {
                const activo = estadoActivo === clave;
                return (
                  <TouchableOpacity
                    key={clave}
                    onPress={() => cambiarEstado(clave)}
                    style={[
                      styles.tab,
                      { borderColor: activo ? estilo.borde : '#E5E7EB' },
                      activo && { backgroundColor: estilo.borde },
                    ]}
                  >
                    <Text style={[styles.tabText, activo && styles.activeTabText]}>
                      {estilo.etiqueta} ({pedidosPorEstado[clave].length})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {pedidosActuales.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No tienes pedidos en “{ESTADOS[estadoActivo].etiqueta}”.</Text>
              </View>
            ) : (
              <>
                <View style={styles.ordersList}>{pedidosVisibles.map(renderPedido)}</View>
                {pedidosActuales.length > PAGE_SIZE && (
                  <View style={styles.pagination}>
                    <Text style={styles.paginationLabel}>
                      Mostrando {(pagina - 1) * PAGE_SIZE + 1}-{Math.min(pagina * PAGE_SIZE, pedidosActuales.length)} de {pedidosActuales.length} pedidos
                    </Text>
                    <View style={styles.paginationActions}>
                      <TouchableOpacity
                        disabled={pagina === 1}
                        onPress={() => setPagina((actual) => Math.max(1, actual - 1))}
                        style={[styles.pageButton, pagina === 1 && styles.disabledButton]}
                      >
                        <Text style={styles.pageButtonText}>Anterior</Text>
                      </TouchableOpacity>
                      <Text style={styles.pageNumber}>{pagina} / {totalPaginas}</Text>
                      <TouchableOpacity
                        disabled={pagina === totalPaginas}
                        onPress={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
                        style={[styles.pageButton, pagina === totalPaginas && styles.disabledButton]}
                      >
                        <Text style={styles.pageButtonText}>Siguiente</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!detalle} transparent animationType="fade" onRequestClose={() => setDetalle(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailModal}>
            <LinearGradient
              colors={detalleEntregado ? ['#14532D', '#15803D'] : ['#173F8A', '#2563EB']}
              style={styles.detailHeader}
            >
              <View style={styles.detailHeadingCopy}>
                <Text style={styles.detailEyebrow}>{detalleEntregado ? 'COMPROBANTE DE ENTREGA' : 'DETALLE DEL ENVÍO'}</Text>
                <Text style={styles.detailTitle}>{detalleEntregado ? 'Pedido entregado' : 'Pedido en camino'}</Text>
                <Text style={styles.detailOrder}>Pedido #{detalle ? idVisible(detalle) : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetalle(null)} style={styles.closeButton} accessibilityLabel="Cerrar">
                <IconClose size={20} color={WHITE} />
              </TouchableOpacity>
            </LinearGradient>
            <ScrollView contentContainerStyle={styles.detailBody}>
              <View style={styles.detailData}>
                <DatoInfo etiqueta="Transportadora" valor={detalle?.envio?.empresa_mensajeria || 'No registrada'} />
                <DatoInfo etiqueta="Número de guía" valor={detalle?.envio?.numero_guia || 'No registrada'} />
              </View>
              <Text style={styles.movementHeading}>MOVIMIENTO DEL PEDIDO</Text>
              <View style={styles.events}>
                <EventoEntrega
                  color="#2563EB"
                  titulo="Enviado desde"
                  detalle={origenEnvio(detalle || {})}
                  fecha={formatearFechaHora(fechaDespacho)}
                />
                {detalleEntregado && (
                  <EventoEntrega
                    color="#15803D"
                    titulo="Recibido"
                    detalle="Entrega confirmada por el comprador"
                    fecha={formatearFechaHora(detalle?.fecha_entrega_confirmada)}
                  />
                )}
              </View>
              {!detalleEntregado && !!urlRastreo(detalle?.envio) && (
                <TouchableOpacity style={styles.trackButton} onPress={abrirRastreo}>
                  <Text style={styles.trackButtonText}>Ver rastreo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!confirmacionPendiente}
        transparent
        animationType="fade"
        onRequestClose={() => !procesando && setConfirmacionPendiente(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>¿Recibiste tu pedido?</Text>
            <Text style={styles.confirmDescription}>
              Al confirmar, el pedido #{confirmacionPendiente && idVisible(confirmacionPendiente)} pasará a “Entregado”.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                disabled={procesando}
                onPress={() => setConfirmacionPendiente(null)}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, procesando && styles.busyButton]}
                disabled={procesando}
                onPress={confirmarRecepcion}
              >
                <Text style={styles.primaryButtonText}>{procesando ? 'Confirmando...' : 'Sí, confirmar entrega'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!cancelacionPendiente}
        transparent
        animationType="fade"
        onRequestClose={() => !procesando && setCancelacionPendiente(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Cancelar pedido</Text>
            <Text style={styles.confirmDescription}>Indica el motivo de la cancelación (mínimo 5 caracteres).</Text>
            <TextInput
              value={motivoCancelacion}
              onChangeText={setMotivoCancelacion}
              placeholder="Motivo de cancelación"
              placeholderTextColor="#8A8A8A"
              multiline
              style={styles.reasonInput}
              editable={!procesando}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                disabled={procesando}
                onPress={() => setCancelacionPendiente(null)}
              >
                <Text style={styles.secondaryButtonText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerButton, (procesando || motivoCancelacion.trim().length < 5) && styles.busyButton]}
                disabled={procesando || motivoCancelacion.trim().length < 5}
                onPress={cancelarPedido}
              >
                <Text style={styles.primaryButtonText}>{procesando ? 'Cancelando...' : 'Confirmar cancelación'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BACKGROUND },
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 28 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pageHeaderCopy: { flex: 1 },
  pageTitle: { color: TEXT, fontSize: 18, fontWeight: '700' },
  pageSubtitle: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 4 },
  notice: { borderRadius: 10, padding: 12, marginBottom: 14, gap: 8 },
  errorNotice: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
  successNotice: { backgroundColor: '#ECFDF3', borderColor: '#BBF7D0', borderWidth: 1 },
  noticeText: { fontSize: 13, lineHeight: 19 },
  errorText: { color: '#B91C1C' },
  successText: { color: '#166534' },
  retryText: { fontWeight: '700', fontSize: 13 },
  loadingCard: { alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 12 },
  loadingText: { color: MUTED, fontSize: 14 },
  tabs: { gap: 8, paddingBottom: 14 },
  tab: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderRadius: 10,
  },
  tabText: { color: '#374151', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: WHITE },
  ordersList: { gap: 12 },
  orderCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  orderAccent: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 4 },
  orderHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  truckBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  orderHeadingText: { flex: 1, minWidth: 0 },
  orderNumber: { color: TEXT, fontSize: 15, fontWeight: '700' },
  orderCarrier: { color: '#4B5563', fontSize: 12, marginTop: 4 },
  orderBody: { marginTop: 15, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 14 },
  orderDescription: { color: '#4B5563', fontSize: 13, lineHeight: 20, fontWeight: '500' },
  actionStack: { gap: 9 },
  outlineAction: {
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#15803D',
    borderRadius: 9,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOutline: { borderColor: PRIMARY },
  cancelAction: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  outlineActionText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  emptyCard: { minHeight: 120, padding: 20, borderRadius: 12, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: MUTED, textAlign: 'center', fontSize: 14, lineHeight: 21 },
  pagination: { marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: '#FAFAFA', borderColor: '#E5E7EB', borderWidth: 1, gap: 12 },
  paginationLabel: { color: MUTED, fontSize: 12 },
  paginationActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pageButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: WHITE },
  disabledButton: { opacity: 0.45 },
  pageButtonText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  pageNumber: { color: '#374151', fontSize: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(36,20,27,0.55)', justifyContent: 'center', padding: 16 },
  detailModal: { maxHeight: '90%', backgroundColor: WHITE, borderRadius: 16, overflow: 'hidden' },
  detailHeader: { padding: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  detailHeadingCopy: { flex: 1 },
  detailEyebrow: { color: WHITE, opacity: 0.9, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  detailTitle: { color: WHITE, fontSize: 21, fontWeight: '700', marginTop: 7 },
  detailOrder: { color: WHITE, opacity: 0.9, fontSize: 13, marginTop: 5 },
  closeButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  detailBody: { padding: 18 },
  detailData: { gap: 10 },
  infoBox: { minHeight: 74, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 11, backgroundColor: '#FAFAFA' },
  infoLabel: { color: MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  infoValue: { color: TEXT, fontSize: 14, fontWeight: '600' },
  movementHeading: { color: MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 22, marginBottom: 14 },
  events: { gap: 18 },
  eventRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  eventDot: { width: 14, height: 14, borderRadius: 7, marginTop: 4, shadowOpacity: 0.2, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  eventContent: { flex: 1 },
  eventTitle: { color: TEXT, fontSize: 14, fontWeight: '700' },
  eventDescription: { color: '#4B5563', fontSize: 13, lineHeight: 19, marginTop: 4 },
  eventDate: { color: MUTED, fontSize: 12, marginTop: 6 },
  trackButton: { marginTop: 22, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: PRIMARY },
  trackButtonText: { color: WHITE, fontSize: 14, fontWeight: '700' },
  confirmModal: { padding: 22, borderRadius: 16, backgroundColor: WHITE },
  confirmTitle: { color: TEXT, fontSize: 19, fontWeight: '700' },
  confirmDescription: { color: '#4B5563', fontSize: 14, lineHeight: 21, marginTop: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 9, marginTop: 22 },
  secondaryButton: { minHeight: 40, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 7, borderWidth: 1, borderColor: '#D1D5DB' },
  secondaryButtonText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  primaryButton: { minHeight: 40, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 7, backgroundColor: PRIMARY },
  dangerButton: { minHeight: 40, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 7, backgroundColor: '#DC2626' },
  busyButton: { opacity: 0.6 },
  primaryButtonText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  reasonInput: { minHeight: 88, textAlignVertical: 'top', marginTop: 14, padding: 12, borderRadius: 9, borderWidth: 1, borderColor: '#D1D5DB', color: TEXT, fontSize: 14 },
});

const styles = baseStyles;
