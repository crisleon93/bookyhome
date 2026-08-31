import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import {
  cancelarImpulso, contratarImpulso, getMiSuscripcionHerramientas,
  getMisImpulsos, getMisLibros, getTiposImpulso,
} from '../services/api';

const PRIMARY = '#7A1E3A';
const BG = '#FAF8F5';
const WHITE = '#FFFFFF';
const TEXT = '#2A2A2A';
const MUTED = '#6E6E6E';
const BORDER = '#E0DBD4';
const TIPO = {
  home: { label: '🏠 PÁGINA PRINCIPAL', color: PRIMARY },
  categoria: { label: '📚 BANNER EN CATEGORÍA', color: '#1A5276' },
  // Compatibilidad con datos existentes previos a la normalización a "categoria".
  banner: { label: '📚 BANNER EN CATEGORÍA', color: '#1A5276' },
  libro_dia: { label: '⭐ LIBRO DEL DÍA', color: '#7D6608' },
  email: { label: '✉️ EMAIL MASIVO', color: '#1E8449' },
};
const ESTADO = { Activo: '#1E8449', Finalizado: '#777777', Cancelado: '#B42318' };
const formatoCOP = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')} COP`;
const formatoFecha = (fecha) => fecha
  ? new Date(`${String(fecha).slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  : 'No disponible';

export default function ImpulsosVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [tipos, setTipos] = useState([]);
  const [impulsos, setImpulsos] = useState([]);
  const [libros, setLibros] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [tab, setTab] = useState('contratar');
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [libroSeleccionado, setLibroSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const [rTipos, rImpulsos, rLibros, rSuscripcion] = await Promise.all([
        getTiposImpulso(), getMisImpulsos(), getMisLibros(), getMiSuscripcionHerramientas(),
      ]);
      setTipos(Array.isArray(rTipos.data) ? rTipos.data : []);
      setImpulsos(Array.isArray(rImpulsos.data) ? rImpulsos.data : []);
      setLibros(Array.isArray(rLibros.data) ? rLibros.data : []);
      const suscripcion = rSuscripcion.data;
      setDescuento(suscripcion?.activa ? Number(suscripcion?.suscripcion?.impulsos_con_descuento || 0) : 0);
    } catch (e) {
      setError(e?.response?.data?.detail || 'No se pudieron cargar los impulsos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarDatos(); }, [cargarDatos]));

  const precioFinal = (precio) => Number(precio || 0) * (1 - descuento / 100);
  const tipoActual = tipos.find((tipo) => Number(tipo.id_tipo_impulso) === Number(tipoSeleccionado));
  const requiereLibro = ['home', 'libro_dia'].includes(tipoActual?.tipo);
  const impulsosActivos = impulsos.filter((impulso) => impulso.estado === 'Activo');

  const seleccionarTipo = (id) => {
    setTipoSeleccionado(id);
    setLibroSeleccionado(null);
    setError('');
    setMensaje('');
  };

  const contratar = async () => {
    if (!tipoActual) return;
    if (requiereLibro && !libroSeleccionado) {
      setError('Selecciona el libro que quieres impulsar.');
      return;
    }
    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      const datos = { id_tipo_impulso: tipoActual.id_tipo_impulso };
      if (libroSeleccionado) datos.id_libro = Number(libroSeleccionado);
      await contratarImpulso(datos);
      setMensaje('¡Impulso contratado con éxito! Tu libro ya tiene mayor visibilidad.');
      setTipoSeleccionado(null);
      setLibroSeleccionado(null);
      await cargarDatos(true);
      setTab('activos');
    } catch (e) {
      setError(e?.response?.data?.detail || 'No fue posible contratar el impulso.');
    } finally {
      setProcesando(false);
    }
  };

  const confirmarCancelacion = (id) => Alert.alert(
    '¿Cancelar impulso?',
    'No se reembolsará el monto pagado.',
    [
      { text: 'Volver', style: 'cancel' },
      { text: 'Cancelar impulso', style: 'destructive', onPress: () => cancelar(id) },
    ],
  );

  const cancelar = async (id) => {
    setProcesando(true);
    setError('');
    try {
      await cancelarImpulso(id);
      setMensaje('Impulso cancelado correctamente.');
      await cargarDatos(true);
    } catch (e) {
      setError(e?.response?.data?.detail || 'No fue posible cancelar el impulso.');
    } finally {
      setProcesando(false);
    }
  };

  const tiposUnicos = tipos.filter((tipo, index, lista) => lista.findIndex((item) => item.tipo === tipo.tipo) === index);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton} accessibilityLabel="Abrir menú"><Text style={styles.menuIcon}>☰</Text></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>Impulsos</Text><Text style={styles.headerSubtitle}>Dale más visibilidad a tus libros</Text></View>
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={PRIMARY} /><Text style={styles.loadingText}>Cargando impulsos…</Text></View> : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarDatos(true); }} tintColor={PRIMARY} colors={[PRIMARY]} />}>
          <View style={styles.intro}><Text style={styles.introTitle}>⚡ Impulsos publicitarios</Text><Text style={styles.introText}>Destaca tus libros en BookyHome y llega a más compradores.</Text>{descuento > 0 ? <Text style={styles.discount}>🎉 Tu plan aplica {descuento}% de descuento en todos los impulsos.</Text> : null}</View>
          {descuento === 0 ? <TouchableOpacity style={styles.upgrade} onPress={() => navigation.navigate('SuscripcionesVendedor')}><View style={{ flex: 1 }}><Text style={styles.upgradeTitle}>💡 Ahorra en cada impulso con un plan de pago</Text><Text style={styles.upgradeText}>Con el plan <Text style={{ fontWeight: '800' }}>Básico</Text> ahorras 5%, con <Text style={{ fontWeight: '800' }}>Estándar</Text> un 10% y con <Text style={{ fontWeight: '800' }}>Premium</Text> hasta un 20% en todos tus impulsos.</Text></View><Text style={styles.upgradeAction}>Ver planes ›</Text></TouchableOpacity> : null}
          {mensaje ? <Text style={styles.success}>{mensaje}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.tabs}><TouchableOpacity onPress={() => setTab('contratar')} style={[styles.tab, tab === 'contratar' && styles.tabActive]}><Text style={[styles.tabText, tab === 'contratar' && styles.tabTextActive]}>➕ Contratar</Text></TouchableOpacity><TouchableOpacity onPress={() => setTab('activos')} style={[styles.tab, tab === 'activos' && styles.tabActive]}><Text style={[styles.tabText, tab === 'activos' && styles.tabTextActive]}>⚡ Activos ({impulsosActivos.length})</Text></TouchableOpacity></View>
          {tab === 'contratar' ? <>
            {tiposUnicos.map((tipo) => { const seleccionado = Number(tipoSeleccionado) === Number(tipo.id_tipo_impulso); const badge = TIPO[tipo.tipo] || {}; const colorTipo = badge.color || PRIMARY; return <TouchableOpacity key={tipo.id_tipo_impulso} onPress={() => seleccionarTipo(tipo.id_tipo_impulso)} style={[styles.typeCard, seleccionado && styles.typeCardSelected]}><Text style={[styles.badge, { color: colorTipo }]}>{badge.label || tipo.tipo}</Text><Text style={[styles.typeName, { color: colorTipo }]}>{tipo.nombre}</Text><Text style={styles.typeDescription}>{tipo.descripcion}</Text><View style={styles.priceRow}><Text style={styles.price}>{formatoCOP(precioFinal(tipo.precio))}</Text>{descuento > 0 ? <Text style={styles.originalPrice}>{formatoCOP(tipo.precio)}</Text> : null}</View><Text style={styles.duration}>⏱ Duración: {tipo.duracion_dias} {Number(tipo.duracion_dias) === 1 ? 'día' : 'días'}</Text></TouchableOpacity>; })}
            {tipoActual ? <View style={styles.config}><Text style={styles.configTitle}>Configurar: <Text style={{ color: PRIMARY }}>{tipoActual.nombre}</Text></Text>{requiereLibro ? <><Text style={styles.label}>Selecciona el libro a impulsar *</Text>{libros.length ? libros.map((libro) => <TouchableOpacity key={libro.id_libro} onPress={() => setLibroSeleccionado(libro.id_libro)} style={[styles.bookOption, Number(libroSeleccionado) === Number(libro.id_libro) && styles.bookOptionSelected]}><Text style={[styles.bookText, Number(libroSeleccionado) === Number(libro.id_libro) && styles.bookTextSelected]}>📖 {libro.titulo}</Text></TouchableOpacity>) : <Text style={styles.emptyText}>No tienes libros disponibles para impulsar.</Text>}</> : null}<TouchableOpacity disabled={procesando || (requiereLibro && !libroSeleccionado)} onPress={contratar} style={[styles.primaryButton, (procesando || (requiereLibro && !libroSeleccionado)) && styles.disabled]}><Text style={styles.primaryButtonText}>{procesando ? 'Procesando…' : `Contratar por ${formatoCOP(precioFinal(tipoActual.precio))}`}</Text></TouchableOpacity></View> : null}
          </> : <>{impulsos.length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>Aún no has contratado ningún impulso.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setTab('contratar')}><Text style={styles.primaryButtonText}>Contratar mi primer impulso</Text></TouchableOpacity></View> : impulsos.map((impulso) => { const badge = TIPO[impulso.tipo] || {}; const colorTipo = badge.color || PRIMARY; return <View key={impulso.id_impulso} style={styles.impulseCard}><View style={styles.impulseTop}><View style={{ flex: 1 }}><Text style={[styles.badge, { color: colorTipo }]}>{badge.label || impulso.tipo}</Text><Text style={[styles.typeName, { color: colorTipo }]}>{impulso.nombre_impulso}</Text>{impulso.titulo_libro ? <Text style={styles.bookName}>📖 {impulso.titulo_libro}</Text> : null}<Text style={styles.period}>{formatoFecha(impulso.fecha_inicio)} → {formatoFecha(impulso.fecha_fin)}</Text><Text style={styles.paid}>Pagado: {formatoCOP(impulso.monto_pagado)}</Text></View><Text style={[styles.status, { color: ESTADO[impulso.estado] || MUTED }]}>{impulso.estado}</Text></View><View style={styles.metrics}>{[['👁', 'Impresiones', impulso.impresiones], ['🖱', 'Clics', impulso.clics], ['🛒', 'Ventas', impulso.ventas_generadas]].map(([icono, etiqueta, valor]) => <View key={etiqueta} style={styles.metric}><Text style={styles.metricLabel}>{icono} {etiqueta}</Text><Text style={styles.metricValue}>{Number(valor || 0).toLocaleString('es-CO')}</Text></View>)}</View>{impulso.estado === 'Activo' ? <TouchableOpacity disabled={procesando} onPress={() => confirmarCancelacion(impulso.id_impulso)} style={[styles.cancelButton, procesando && styles.disabled]}><Text style={styles.cancelText}>Cancelar impulso</Text></TouchableOpacity> : null}</View>; })}</>}
        </ScrollView>
      )}
      <SidebarVendedor visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={user} navigation={navigation} onSignOut={signOut} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 16 }, menuButton: { padding: 4 }, menuIcon: { color: WHITE, fontSize: 22, fontWeight: '700' }, headerTitle: { color: WHITE, fontSize: 20, fontWeight: '800' }, headerSubtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { color: MUTED, marginTop: 12 }, content: { padding: 16, paddingBottom: 36 }, intro: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18, marginBottom: 14 }, introTitle: { color: TEXT, fontSize: 19, fontWeight: '800' }, introText: { color: MUTED, fontSize: 13, lineHeight: 19, marginTop: 5 }, discount: { color: PRIMARY, fontSize: 13, fontWeight: '700', marginTop: 10, lineHeight: 19 }, upgrade: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F4F0EB', borderLeftWidth: 4, borderLeftColor: PRIMARY, borderRadius: 10, padding: 14, marginBottom: 14 }, upgradeTitle: { color: PRIMARY, fontSize: 13, fontWeight: '800' }, upgradeText: { color: MUTED, fontSize: 12, marginTop: 3 }, upgradeAction: { color: PRIMARY, fontSize: 12, fontWeight: '800' }, success: { backgroundColor: '#DDEFE1', color: '#155724', borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 14 }, error: { backgroundColor: '#FDEBEC', color: '#9D1D26', borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 14 }, tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 }, tab: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, paddingVertical: 11, borderRadius: 9 }, tabActive: { backgroundColor: PRIMARY, borderColor: PRIMARY }, tabText: { color: MUTED, fontSize: 13, fontWeight: '800' }, tabTextActive: { color: WHITE }, typeCard: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 16, marginBottom: 12 }, typeCardSelected: { borderWidth: 2, borderColor: PRIMARY, backgroundColor: '#FDF7F9' }, badge: { fontSize: 10, letterSpacing: .4, fontWeight: '900' }, typeName: { color: TEXT, fontSize: 16, fontWeight: '800', marginTop: 6 }, typeDescription: { color: MUTED, fontSize: 13, lineHeight: 19, marginTop: 5 }, priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 13 }, price: { color: PRIMARY, fontSize: 19, fontWeight: '900' }, originalPrice: { color: '#999', fontSize: 12, textDecorationLine: 'line-through' }, duration: { color: MUTED, fontSize: 12, marginTop: 5 }, config: { backgroundColor: '#F4F0EB', borderRadius: 14, padding: 16, marginTop: 3 }, configTitle: { color: TEXT, fontSize: 15, fontWeight: '800', marginBottom: 12 }, label: { color: MUTED, fontSize: 13, fontWeight: '700', marginBottom: 8 }, bookOption: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 11, marginBottom: 8 }, bookOptionSelected: { borderColor: PRIMARY, backgroundColor: '#FDF7F9' }, bookText: { color: TEXT, fontSize: 13 }, bookTextSelected: { color: PRIMARY, fontWeight: '800' }, primaryButton: { backgroundColor: PRIMARY, borderRadius: 9, paddingVertical: 13, paddingHorizontal: 14, alignItems: 'center', marginTop: 14 }, primaryButtonText: { color: WHITE, fontSize: 13, fontWeight: '800' }, disabled: { opacity: .55 }, empty: { backgroundColor: WHITE, borderRadius: 14, alignItems: 'center', padding: 22 }, emptyText: { color: MUTED, textAlign: 'center', fontSize: 13, lineHeight: 19 }, impulseCard: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 16, marginBottom: 12 }, impulseTop: { flexDirection: 'row', gap: 8 }, status: { backgroundColor: '#F4F2F0', alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '900' }, bookName: { color: MUTED, fontSize: 12, marginTop: 5 }, period: { color: MUTED, fontSize: 12, marginTop: 6 }, paid: { color: TEXT, fontSize: 12, fontWeight: '700', marginTop: 3 }, metrics: { flexDirection: 'row', gap: 8, marginTop: 14 }, metric: { flex: 1, alignItems: 'center', backgroundColor: '#F9F8F6', borderRadius: 8, paddingVertical: 9, paddingHorizontal: 2 }, metricLabel: { color: MUTED, fontSize: 9, textAlign: 'center' }, metricValue: { color: PRIMARY, fontSize: 16, fontWeight: '900', marginTop: 3 }, cancelButton: { borderWidth: 1, borderColor: '#B42318', borderRadius: 8, alignItems: 'center', paddingVertical: 10, marginTop: 14 }, cancelText: { color: '#B42318', fontSize: 13, fontWeight: '800' },
});
