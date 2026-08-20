import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator, Modal, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import {
  cancelarSuscripcionHerramientas, getMiSuscripcionHerramientas,
  getPlanesHerramientas, suscribirPlanHerramientas,
} from '../services/api';
import SidebarVendedor from '../components/SidebarVendedor';

const PRIMARY = '#7A1E3A';
const BG = '#FAF8F5';
const WHITE = '#FFFFFF';
const TEXT = '#2A2A2A';
const MUTED = '#6E6E6E';
const BORDER = '#E0DBD4';

const formatoCOP = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')} COP`;
const fechaLocalISO = (fecha) => [
  fecha.getFullYear(),
  String(fecha.getMonth() + 1).padStart(2, '0'),
  String(fecha.getDate()).padStart(2, '0'),
].join('-');
const formatoFecha = (fecha) => fecha
  ? new Date(`${String(fecha).slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
  : 'No disponible';

export default function SuscripcionesVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [miSuscripcion, setMiSuscripcion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const [respuestaPlanes, respuestaSuscripcion] = await Promise.all([
        getPlanesHerramientas(),
        getMiSuscripcionHerramientas(),
      ]);
      setPlanes(Array.isArray(respuestaPlanes.data) ? respuestaPlanes.data : []);
      setMiSuscripcion(respuestaSuscripcion.data || null);
    } catch (e) {
      setPlanes([]);
      setMiSuscripcion(null);
      setError(e?.response?.data?.detail || 'No se pudieron cargar los planes y tu suscripción.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarDatos(); }, [cargarDatos]));

  const suscripcionActiva = miSuscripcion?.activa ? miSuscripcion.suscripcion : null;
  const idPlanActivo = suscripcionActiva?.id_plan || 1;

  const cambiarPlan = async (plan) => {
    if (procesando) return;
    setProcesando(true);
    setError('');
    try {
      const inicio = new Date();
      const fin = new Date(inicio);
      fin.setMonth(fin.getMonth() + 1);
      await suscribirPlanHerramientas({
        id_plan: plan.id_plan,
        fecha_inicio: fechaLocalISO(inicio),
        fecha_fin: fechaLocalISO(fin),
        metodo_pago: 'Simulación de Pago',
        monto_pagado: Number(plan.precio_mensual || 0),
      });
      await cargarDatos(true);
      setModal({ type: 'success', title: 'Suscripción actualizada', message: `Ahora tienes el plan ${plan.nombre_plan}.` });
    } catch (e) {
      const mensaje = e?.response?.data?.detail || 'No fue posible procesar la suscripción.';
      setError(mensaje);
      setModal({ type: 'error', title: 'No se pudo actualizar', message: mensaje });
    } finally {
      setProcesando(false);
    }
  };

  const cancelarPlan = async () => {
    setProcesando(true);
    setError('');
    try {
      await cancelarSuscripcionHerramientas();
      await cargarDatos(true);
      setModal({ type: 'success', title: 'Suscripción cancelada', message: 'Tu tienda volvió al plan Gratuito.' });
    } catch (e) {
      const mensaje = e?.response?.data?.detail || 'No fue posible cancelar la suscripción.';
      setError(mensaje);
      setModal({ type: 'error', title: 'No se pudo cancelar', message: mensaje });
    } finally {
      setProcesando(false);
    }
  };

  const beneficios = (plan) => [
    `Historial de datos: ${plan.historial_meses || 0} ${(plan.historial_meses || 0) === 1 ? 'mes' : 'meses'} de registro de ventas.`,
    plan.estadisticas_basicas ? 'Métricas Básicas: Resumen mensual de ventas totales e ingresos directos.' : null,
    plan.estadisticas_avanzadas ? 'Métricas Avanzadas: Gráficos interactivos de visitas, tasas de conversión e ingresos históricos.' : null,
    plan.exportar_reportes ? 'Reportes Contables: Exportación de reportes de ventas listos en formato Excel y PDF.' : null,
    plan.soporte_prioritario ? 'Soporte Prioritario: Canal de atención y resolución de dudas prioritario en menos de 2h.' : null,
    Number(plan.impulsos_con_descuento) > 0 ? `Impulsos Destacados: ${Number(plan.impulsos_con_descuento)}% de descuento al pagar para posicionar tus libros arriba en el catálogo.` : null,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton} accessibilityLabel="Abrir menú">
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Suscripciones</Text>
          <Text style={styles.headerSubtitle}>Herramientas para hacer crecer tu tienda</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={PRIMARY} /><Text style={styles.loadingText}>Cargando planes…</Text></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarDatos(true); }} tintColor={PRIMARY} colors={[PRIMARY]} />}
        >
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Suscripciones de Herramientas</Text>
            <Text style={styles.introText}>Mejora tu tienda con herramientas y estadísticas avanzadas para vender más</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {planes.map((plan) => {
            const activo = Number(plan.id_plan) === Number(idPlanActivo);
            return (
              <View key={plan.id_plan} style={[styles.planCard, activo && styles.planCardActive]}>
                {activo ? <Text style={styles.activePill}>PLAN ACTIVO</Text> : null}
                <Text style={styles.planName}>{plan.nombre_plan}</Text>
                <Text style={styles.description}>{plan.descripcion}</Text>
                <Text style={styles.price}>{formatoCOP(plan.precio_mensual)}<Text style={styles.priceSuffix}> / mes</Text></Text>
                <View style={styles.divider} />
                <Text style={styles.includes}>Incluye</Text>
                {beneficios(plan).map((beneficio) => (
                  <View key={beneficio} style={styles.benefitRow}>
                    <Text style={styles.check}>✓</Text><Text style={styles.benefit}>{beneficio}</Text>
                  </View>
                ))}
                {activo ? (
                  Number(plan.id_plan) === 1 ? (
                    <View style={styles.baseButton}><Text style={styles.baseButtonText}>Plan base predeterminado</Text></View>
                  ) : (
                    <TouchableOpacity disabled={procesando} onPress={() => setModal({ type: 'cancel', title: '¿Cancelar suscripción?', message: 'Volverás al plan Gratuito y perderás los beneficios del plan actual.' })} style={[styles.cancelButton, procesando && styles.disabled]}>
                      <Text style={styles.cancelText}>{procesando ? 'Procesando…' : 'Cancelar suscripción'}</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  <TouchableOpacity disabled={procesando} onPress={() => setModal({ type: 'change', title: `Cambiar al plan ${plan.nombre_plan}`, message: `Se activará por un mes por ${formatoCOP(plan.precio_mensual)}.`, plan })} style={[styles.changeButton, procesando && styles.disabled]}>
                    <Text style={styles.changeText}>{procesando ? 'Procesando…' : 'Cambiar a este plan'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {suscripcionActiva ? (
            <View style={styles.details}>
              <Text style={styles.detailsTitle}>Detalles de tu suscripción activa</Text>
              <Text style={styles.detail}>Inicio: <Text style={styles.detailStrong}>{formatoFecha(suscripcionActiva.fecha_inicio)}</Text></Text>
              <Text style={styles.detail}>Vencimiento: <Text style={styles.detailStrong}>{formatoFecha(suscripcionActiva.fecha_fin)}</Text></Text>
              <Text style={styles.detail}>Método de pago: <Text style={styles.detailStrong}>{suscripcionActiva.metodo_pago || 'No disponible'}</Text></Text>
              <Text style={styles.detail}>Monto cobrado: <Text style={styles.detailStrong}>{formatoCOP(suscripcionActiva.monto_pagado)}</Text></Text>
            </View>
          ) : null}

          <View style={styles.impulsos}>
            <Text style={styles.impulsosTitle}>⚡ ¿Para qué sirve el descuento en Impulsos?</Text>
            <Text style={styles.impulsosText}>Los Impulsos son espacios publicitarios dentro de BookyHome: destaca tu libro en la página principal, aparece como banner en categorías o llega por email a miles de compradores. Tu plan te da ese descuento de forma automática en cada compra.</Text>
            <TouchableOpacity style={styles.impulsosButton} onPress={() => navigation.navigate('ImpulsosVendedor')}>
              <Text style={styles.impulsosButtonText}>🚀 Ver y contratar Impulsos</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <SidebarVendedor visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={user} navigation={navigation} onSignOut={signOut} />

      <Modal visible={Boolean(modal)} transparent animationType="fade" onRequestClose={() => !procesando && setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}><Text style={styles.modalMark}>{modal?.type === 'error' ? '!' : modal?.type === 'success' ? '✓' : '◆'}</Text></View>
            <Text style={styles.modalTitle}>{modal?.title}</Text>
            <Text style={styles.modalText}>{modal?.message}</Text>
            {modal?.type === 'change' || modal?.type === 'cancel' ? (
              <View style={styles.modalActions}>
                <TouchableOpacity disabled={procesando} style={styles.modalSecondary} onPress={() => setModal(null)}><Text style={styles.modalSecondaryText}>Volver</Text></TouchableOpacity>
                <TouchableOpacity disabled={procesando} style={[styles.modalPrimary, modal?.type === 'cancel' && styles.modalDanger, procesando && styles.disabled]} onPress={() => { const accion = modal.type === 'change' ? () => cambiarPlan(modal.plan) : cancelarPlan; setModal(null); accion(); }}><Text style={styles.modalPrimaryText}>{procesando ? 'Procesando…' : modal?.type === 'cancel' ? 'Sí, cancelar' : 'Confirmar cambio'}</Text></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.modalPrimary} onPress={() => setModal(null)}><Text style={styles.modalPrimaryText}>Entendido</Text></TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 16 },
  menuButton: { padding: 4 }, menuIcon: { color: WHITE, fontSize: 22, fontWeight: '700' },
  headerTitle: { color: WHITE, fontSize: 20, fontWeight: '800' }, headerSubtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { color: MUTED, marginTop: 12 },
  content: { padding: 16, paddingBottom: 36 },
  intro: { backgroundColor: WHITE, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  introTitle: { color: TEXT, fontSize: 19, fontWeight: '800' }, introText: { color: MUTED, fontSize: 13, lineHeight: 19, marginTop: 5 },
  error: { backgroundColor: '#FDEBEC', color: '#9D1D26', borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 14 },
  planCard: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  planCardActive: { borderWidth: 2, borderColor: PRIMARY }, activePill: { alignSelf: 'flex-end', backgroundColor: PRIMARY, color: WHITE, fontSize: 10, fontWeight: '800', letterSpacing: .5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 3 },
  planName: { color: TEXT, fontSize: 20, fontWeight: '800' }, description: { color: MUTED, fontSize: 13, lineHeight: 19, marginTop: 7, minHeight: 38 },
  price: { color: PRIMARY, fontSize: 24, fontWeight: '900', marginTop: 16 }, priceSuffix: { color: MUTED, fontSize: 13, fontWeight: '500' }, divider: { height: 1, backgroundColor: '#EEE9E4', marginVertical: 16 },
  includes: { color: TEXT, fontSize: 13, fontWeight: '800', marginBottom: 9 }, benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingRight: 4 }, check: { color: PRIMARY, fontSize: 15, fontWeight: '900', marginRight: 8 }, benefit: { color: '#4E4E4E', flex: 1, fontSize: 13, lineHeight: 19 },
  changeButton: { backgroundColor: PRIMARY, borderRadius: 9, alignItems: 'center', paddingVertical: 12, marginTop: 14 }, changeText: { color: WHITE, fontWeight: '800', fontSize: 14 },
  cancelButton: { borderWidth: 1, borderColor: '#B42318', borderRadius: 9, alignItems: 'center', paddingVertical: 11, marginTop: 14 }, cancelText: { color: '#B42318', fontWeight: '800', fontSize: 14 },
  baseButton: { backgroundColor: '#F4F2F0', borderWidth: 1, borderColor: '#E2DED9', borderRadius: 9, alignItems: 'center', paddingVertical: 11, marginTop: 14 }, baseButtonText: { color: '#999', fontWeight: '700', fontSize: 13 }, disabled: { opacity: .6 },
  details: { backgroundColor: '#F4F0EB', borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 17, marginTop: 2, marginBottom: 16 }, detailsTitle: { color: TEXT, fontSize: 15, fontWeight: '800', marginBottom: 10 }, detail: { color: MUTED, fontSize: 13, lineHeight: 22 }, detailStrong: { color: TEXT, fontWeight: '700' },
  impulsos: { backgroundColor: WHITE, borderLeftWidth: 5, borderLeftColor: PRIMARY, borderRadius: 12, padding: 18 }, impulsosTitle: { color: PRIMARY, fontSize: 14, fontWeight: '800' }, impulsosText: { color: '#555', fontSize: 13, lineHeight: 19, marginTop: 6 }, impulsosButton: { alignSelf: 'flex-start', backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 11, marginTop: 16 }, impulsosButtonText: { color: WHITE, fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(46, 10, 24, 0.62)', alignItems: 'center', justifyContent: 'center', padding: 24 }, modalCard: { width: '100%', maxWidth: 380, backgroundColor: WHITE, borderRadius: 20, overflow: 'hidden', padding: 22, elevation: 12 }, modalHeader: { alignSelf: 'center', width: 52, height: 52, borderRadius: 26, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, modalMark: { color: WHITE, fontSize: 25, fontWeight: '900' }, modalTitle: { color: PRIMARY, fontSize: 19, fontWeight: '900', textAlign: 'center' }, modalText: { color: '#5E5360', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, marginBottom: 22 }, modalActions: { flexDirection: 'row', gap: 10 }, modalSecondary: { flex: 1, borderWidth: 1, borderColor: '#D8CCD1', borderRadius: 9, alignItems: 'center', paddingVertical: 12 }, modalSecondaryText: { color: PRIMARY, fontSize: 13, fontWeight: '800' }, modalPrimary: { flex: 1, backgroundColor: PRIMARY, borderRadius: 9, alignItems: 'center', paddingVertical: 12 }, modalDanger: { backgroundColor: '#A82645' }, modalPrimaryText: { color: WHITE, fontSize: 13, fontWeight: '800' },
});
