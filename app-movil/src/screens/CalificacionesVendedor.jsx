import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { getCalificacionesVendedor, getLibreria } from '../services/api';
import SidebarVendedor from '../components/SidebarVendedor';
import { IconCalendar, IconMessage, IconStar } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const BG = '#FAF8F5';
const WHITE = '#FFFFFF';
const TEXT = '#2A2A2A';
const MUTED = '#777777';
const BORDER = '#E0DBD4';

const fechaFormato = (fecha) => fecha
  ? new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  : 'Sin fecha';

const temaPromedio = (valor) => {
  if (valor >= 4.5) return { background: '#D1FAE5', color: '#065F46', border: '#6EE7B7' };
  if (valor >= 3.5) return { background: '#FEF9C3', color: '#854D0E', border: '#FDE047' };
  return { background: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' };
};
const colorCalificacion = (valor) => valor >= 4 ? '#22C55E' : valor === 3 ? '#F59E0B' : '#EF4444';
const estrellas = (valor, size = 16) => (
  <View style={styles.stars}>
    {[1, 2, 3, 4, 5].map((numero) => (
      <IconStar key={numero} size={size} color={numero <= Number(valor) ? '#FFC107' : '#E0E0E0'} filled />
    ))}
  </View>
);

export default function CalificacionesVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const tienda = await getLibreria();
      const idTienda = tienda.data?.id_tienda;
      if (!idTienda) throw new Error('No se encontró la tienda del vendedor.');
      const respuesta = await getCalificacionesVendedor(idTienda);
      setData(respuesta.data || null);
    } catch (e) {
      setData(null);
      setError(e?.response?.data?.detail || e?.message || 'No se pudieron cargar las calificaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const refrescar = () => { setRefreshing(true); cargar(true); };
  const total = Number(data?.total || 0);
  const promedio = Number(data?.promedio || 0);
  const distribucion = data?.distribucion || {};
  const calificaciones = Array.isArray(data?.calificaciones) ? data.calificaciones : [];
  const tema = temaPromedio(promedio);
  const esteMes = calificaciones.filter((calificacion) => {
    const fecha = new Date(calificacion.fecha_calificacion);
    const hoy = new Date();
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  }).length;

  const cabecera = total > 0 ? (
    <>
      <View style={[styles.averageCard, { backgroundColor: tema.background, borderColor: tema.border }]}>
        <Text style={[styles.averageLabel, { color: tema.color }]}>Promedio general</Text>
        <Text style={[styles.averageValue, { color: tema.color }]}>{promedio.toFixed(1)}</Text>
        {estrellas(Math.round(promedio), 22)}
        <Text style={[styles.averageSub, { color: tema.color }]}>sobre {total} {total === 1 ? 'opinión' : 'opiniones'}</Text>
      </View>

      <View style={styles.metrics}>
        <Metric label="Opiniones" value={total} Icon={IconMessage} background="#EFF6FF" color="#1D4ED8" border="#BFDBFE" />
        <Metric label="5 estrellas" value={Number(distribucion[5] || 0)} Icon={IconStar} background="#D1FAE5" color="#065F46" border="#6EE7B7" />
        <Metric label="Este mes" value={esteMes} Icon={IconCalendar} background="#FAF5FF" color="#6B21A8" border="#D8B4FE" />
      </View>

      <View style={styles.distribution}>
        <Text style={styles.sectionTitle}>Distribución de calificaciones</Text>
        {[5, 4, 3, 2, 1].map((valor) => {
          const cantidad = Number(distribucion[valor] || 0);
          const porcentaje = total ? Math.round((cantidad / total) * 100) : 0;
          return (
            <View key={valor} style={styles.distributionRow}>
              <View style={styles.starNumber}><Text style={styles.starNumberText}>{valor}</Text><IconStar size={13} color="#FFC107" filled /></View>
              <View style={styles.barTrack}><View style={[styles.barFill, { width: `${porcentaje}%`, backgroundColor: colorCalificacion(valor) }]} /></View>
              <Text style={styles.distributionCount}>{cantidad} ({porcentaje}%)</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.listTitle}>Últimas opiniones</Text>
    </>
  ) : null;

  const opinion = ({ item }) => {
    const iniciales = (item.nombre_usuario || '?').trim().split(/\s+/).map((nombre) => nombre[0]).slice(0, 2).join('').toUpperCase();
    return (
      <View style={[styles.reviewCard, { borderTopColor: colorCalificacion(Number(item.calificacion || 0)) }]}>
        <View style={styles.reviewHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{iniciales}</Text></View>
          <View style={styles.reviewInfo}>
            <Text style={styles.userName} numberOfLines={1}>{item.nombre_usuario || 'Cliente'}</Text>
            {estrellas(item.calificacion, 14)}
          </View>
          <Text style={styles.date}>{fechaFormato(item.fecha_calificacion)}</Text>
        </View>
        {item.comentario ? <Text style={styles.comment}>“{item.comentario}”</Text> : null}
      </View>
    );
  };

  const vacio = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{error ? '⚠️' : '⭐'}</Text>
      <Text style={styles.emptyTitle}>{error ? 'No fue posible cargar las calificaciones' : 'Aún no tienes calificaciones'}</Text>
      <Text style={styles.emptyText}>{error || 'Cuando un cliente reciba su pedido y evalúe tu tienda, su opinión aparecerá aquí.'}</Text>
      {error ? <TouchableOpacity onPress={() => cargar()} style={styles.retry}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton} accessibilityLabel="Abrir menú"><Text style={styles.menuIcon}>☰</Text></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Calificaciones</Text><Text style={styles.headerSubtitle}>Opiniones sobre tu tienda</Text></View>
      </View>

      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={PRIMARY} /><Text style={styles.loadingText}>Cargando calificaciones…</Text></View> : (
        <FlatList
          data={calificaciones.slice(0, 10)}
          keyExtractor={(item) => String(item.id_calificacion)}
          renderItem={opinion}
          ListHeaderComponent={cabecera}
          ListEmptyComponent={vacio}
          ListFooterComponent={
            calificaciones.length > 10 ? (
              <View style={styles.masOpiniones}>
                <IconMessage size={15} color={MUTED} />
                <Text style={styles.masOpinionesText}>
                  Las opiniones anteriores están disponibles en la sección de{' '}
                  <Text style={styles.masOpinionesLink}>Notificaciones</Text>
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refrescar} tintColor={PRIMARY} colors={[PRIMARY]} />}
        />
      )}

      <SidebarVendedor visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={user} navigation={navigation} onSignOut={signOut} />
    </SafeAreaView>
  );
}

function Metric({ Icon, label, value, background, color, border }) {
  return (
    <View style={[styles.metric, { backgroundColor: background, borderColor: border }]}>
      <Icon size={28} color={color} />
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  menuButton: { padding: 4 }, menuIcon: { color: WHITE, fontSize: 22, fontWeight: '700' }, headerTitle: { color: WHITE, fontSize: 20, fontWeight: '800' }, headerSubtitle: { color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 2 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, loadingText: { color: MUTED, marginTop: 12 }, list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  averageCard: { borderRadius: 16, borderWidth: 2, padding: 22, alignItems: 'center' }, averageLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: .5, opacity: .75 }, averageValue: { fontSize: 48, fontWeight: '900', lineHeight: 58, marginTop: 2 }, averageSub: { fontSize: 12, marginTop: 5, opacity: .7 },
  metrics: { flexDirection: 'row', gap: 9, marginTop: 12, marginBottom: 20 }, metric: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 13, paddingVertical: 14, paddingHorizontal: 4 }, metricValue: { fontSize: 20, fontWeight: '900', marginTop: 7 }, metricLabel: { fontSize: 10, fontWeight: '700', marginTop: 3, textAlign: 'center', opacity: .8 },
  stars: { flexDirection: 'row', gap: 2 }, distribution: { backgroundColor: WHITE, borderColor: BORDER, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 20 }, sectionTitle: { color: TEXT, fontSize: 14, fontWeight: '800', marginBottom: 14 }, distributionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }, starNumber: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 30 }, starNumberText: { color: TEXT, fontSize: 12, fontWeight: '700' }, barTrack: { flex: 1, height: 9, borderRadius: 99, backgroundColor: '#F1F0EE', overflow: 'hidden' }, barFill: { height: '100%', borderRadius: 99 }, distributionCount: { color: MUTED, fontSize: 11, width: 54, textAlign: 'right' },
  listTitle: { color: TEXT, fontSize: 16, fontWeight: '800', marginBottom: 10 }, reviewCard: { backgroundColor: WHITE, borderColor: BORDER, borderWidth: 1, borderTopWidth: 3, borderRadius: 14, padding: 14, marginBottom: 10 }, reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY }, avatarText: { color: WHITE, fontSize: 12, fontWeight: '800' }, reviewInfo: { flex: 1 }, userName: { color: TEXT, fontSize: 13, fontWeight: '800', marginBottom: 2 }, date: { color: '#A8A29E', fontSize: 10, maxWidth: 85, textAlign: 'right' }, comment: { color: '#5E5A57', fontSize: 13, lineHeight: 20, marginTop: 12, paddingTop: 10, borderTopColor: '#F1EDE8', borderTopWidth: 1, fontStyle: 'italic' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 70 }, emptyIcon: { fontSize: 42, marginBottom: 12 }, emptyTitle: { color: TEXT, fontWeight: '800', fontSize: 16, textAlign: 'center' }, emptyText: { color: MUTED, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 }, retry: { backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 18 }, retryText: { color: WHITE, fontSize: 13, fontWeight: '800' },
  masOpiniones: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, marginTop: 4, marginBottom: 16 },
  masOpinionesText: { flex: 1, fontSize: 12, color: MUTED, lineHeight: 18 },
  masOpinionesLink: { fontWeight: '700', color: PRIMARY },
});
