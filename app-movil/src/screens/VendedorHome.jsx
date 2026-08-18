import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useChatSocket } from '../context/ChatSocketContext';
import {
  getMisLibros, getStatsVendedor, getTopVendidos,
  getAlertasStock, getPedidosRecientes,
} from '../services/api';
import SidebarVendedor from '../components/SidebarVendedor';

const PRIMARY   = '#7A1E3A';
const PRIMARY_L = '#9B2648';
const WHITE     = '#FFFFFF';
const BG        = '#F5F3EF';
const BORDER    = '#E5E0D8';
const TEXT      = '#1A1A1A';
const MUTED     = '#8A8A8A';
const SUCCESS   = '#16A34A';
const WARNING   = '#D97706';

const fmt = (val) =>
  val == null
    ? '$0 COP'
    : '$' + String(Math.floor(val)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' COP';

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7C2F'];

export default function VendedorHome({ navigation: navProp }) {
  const navigation = navProp || useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const { salas, loadingSalas, recargarSalas } = useChatSocket();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [libros,     setLibros]     = useState([]);
  const [stats,      setStats]      = useState(null);
  const [top,        setTop]        = useState([]);
  const [alertas,    setAlertas]    = useState([]);
  const [pedidos,    setPedidos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [rLib, rStats, rTop, rAlt, rPed] = await Promise.all([
        getMisLibros().catch(() => ({ data: [] })),
        getStatsVendedor().catch(() => ({ data: null })),
        getTopVendidos().catch(() => ({ data: [] })),
        getAlertasStock(3).catch(() => ({ data: [] })),
        getPedidosRecientes().catch(() => ({ data: [] })),
      ]);
      setLibros(rLib.data || []);
      setStats(rStats.data || null);
      setTop(Array.isArray(rTop.data) ? rTop.data : []);
      setAlertas(Array.isArray(rAlt.data) ? rAlt.data : []);
      setPedidos(rPed.data || []);
    } catch { /* silencioso */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    cargar();
    recargarSalas();
  }, [cargar, recargarSalas]));

  const onRefresh = () => { setRefreshing(true); cargar(true); recargarSalas(); };

  const totalNoLeidos = salas.reduce((acc, s) => acc + (s.no_leidos || 0), 0);
  const statsLibros = {
    total:      libros.length,
    stock:      libros.reduce((a, l) => a + (l.stock || 0), 0),
    categorias: [...new Set(libros.map(l => l.nombre_categoria).filter(Boolean))].length,
  };

  const Header = () => (
    <View style={s.header}>
      <TouchableOpacity onPress={() => setSidebarVisible(true)} style={s.menuBtn}>
        <Text style={s.menuIcon}>☰</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <Header />
        <View style={s.centered}>
          <ActivityIndicator size="large" color={WHITE} />
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: 13 }}>Cargando tu tienda…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <Header />

      <ScrollView
        style={{ flex: 1, backgroundColor: PRIMARY }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WHITE} />}
      >
        {/* ── Bienvenida ── */}
        <View style={s.welcome}>
          <Text style={s.welcomeName}>Bienvenido/a 👋</Text>
          <Text style={s.welcomeStore}>{user?.nombre_tienda || user?.nombre?.split(' ')[0] || 'Tu Tienda'}</Text>
          <Text style={s.welcomeSub}>Aquí tienes el panorama de tu tienda</Text>
        </View>

        {/* ── KPI principal (ventas del mes) ── */}
        <View style={s.kpiBanner}>
          <View style={s.kpiLeft}>
            <Text style={s.kpiLabel}>Ventas del mes</Text>
            <Text style={s.kpiBig}>{fmt(stats?.total_mes)}</Text>
            <Text style={s.kpiSub}>{stats?.ordenes_mes ?? 0} órdenes este mes</Text>
          </View>
          <View style={s.kpiDivider} />
          <View style={s.kpiRight}>
            <View style={s.kpiMini}>
              <Text style={s.kpiMiniLabel}>Hoy</Text>
              <Text style={s.kpiMiniVal}>{fmt(stats?.total_hoy)}</Text>
              <Text style={s.kpiMiniSub}>{stats?.ordenes_hoy ?? 0} orden(es)</Text>
            </View>
            <View style={[s.kpiMini, { marginTop: 14 }]}>
              <Text style={s.kpiMiniLabel}>Semana</Text>
              <Text style={s.kpiMiniVal}>{fmt(stats?.total_semana)}</Text>
            </View>
          </View>
        </View>

        {/* ── Cuerpo crema ── */}
        <View style={s.body}>

          {/* Fila stats libros */}
          <View style={s.statsRow}>
            {[
              { icon: '📚', label: 'Publicados', val: statsLibros.total },
              { icon: '📦', label: 'En stock',   val: statsLibros.stock },
              { icon: '🏷️', label: 'Categorías', val: statsLibros.categorias },
            ].map((item) => (
              <View key={item.label} style={s.statsCard}>
                <Text style={s.statsIcon}>{item.icon}</Text>
                <Text style={s.statsVal}>{item.val}</Text>
                <Text style={s.statsLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Alerta stock bajo */}
          {alertas.length > 0 && (
            <View style={s.alertaBox}>
              <View style={s.alertaHeader}>
                <Text style={s.alertaIcon}>⚠️</Text>
                <Text style={s.alertaTitle}>
                  {alertas.length} libro{alertas.length > 1 ? 's' : ''} con stock bajo
                </Text>
              </View>
              <View style={s.alertaChips}>
                {alertas.slice(0, 4).map((a, i) => (
                  <View key={i} style={s.alertaChip}>
                    <Text style={s.alertaChipText} numberOfLines={1}>
                      {a.titulo} — {a.stock ?? 0} uds
                    </Text>
                  </View>
                ))}
                {alertas.length > 4 && (
                  <View style={[s.alertaChip, s.alertaChipMore]}>
                    <Text style={s.alertaChipText}>+{alertas.length - 4} más</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Libros más vendidos */}
          {top.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Libros más vendidos</Text>
                <View style={s.badgePrimary}><Text style={s.badgeText}>TOP 5</Text></View>
              </View>
              <View style={s.card}>
                {top.slice(0, 5).map((libro, i) => (
                  <View
                    key={libro.id_libro ?? i}
                    style={[s.topRow, i < Math.min(top.length, 5) - 1 && s.rowSep]}
                  >
                    {/* medalla / número */}
                    <View style={[s.rankBadge, { backgroundColor: RANK_COLORS[i] ?? '#E5E0D8' }]}>
                      <Text style={s.rankText}>{i + 1}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={s.itemTitle} numberOfLines={1}>{libro.titulo}</Text>
                      <Text style={s.itemSub}>{libro.autor_libro}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.itemPrice}>{fmt(libro.precio_libro)}</Text>
                      <View style={[
                        s.soldBadge,
                        (libro.unidades_vendidas ?? 0) > 0 && s.soldBadgeActive,
                      ]}>
                        <Text style={[
                          s.soldText,
                          (libro.unidades_vendidas ?? 0) > 0 && s.soldTextActive,
                        ]}>
                          {libro.unidades_vendidas ?? 0} vendido(s)
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Últimos libros */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Últimos libros</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Libreria')}>
                <Text style={s.linkText}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              {libros.length === 0
                ? <Text style={s.emptyText}>Aún no tienes libros publicados.</Text>
                : libros.slice(0, 3).map((libro, i) => (
                    <View
                      key={libro.id_libro ?? i}
                      style={[s.libroRow, i < 2 && s.rowSep]}
                    >
                      <View style={s.libroIconBox}>
                        <Text style={{ fontSize: 18 }}>📖</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.itemTitle} numberOfLines={1}>{libro.titulo}</Text>
                        <Text style={s.itemSub}>{libro.autor_libro}</Text>
                      </View>
                      <Text style={s.itemPrice}>{fmt(libro.precio_libro ?? libro.precio)}</Text>
                    </View>
                  ))
              }
            </View>
          </View>

          {/* Pedidos recientes */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Pedidos recientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PedidosVendedor')}>
                <Text style={s.linkText}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              {pedidos.length === 0
                ? <Text style={s.emptyText}>Sin pedidos recientes.</Text>
                : pedidos.slice(0, 4).map((p, i) => (
                    <TouchableOpacity
                      key={p.id_orden ?? i}
                      style={[s.pedidoRow, i < Math.min(pedidos.length, 4) - 1 && s.rowSep]}
                      onPress={() => navigation.navigate('PedidosVendedor')}
                      activeOpacity={0.7}
                    >
                      <View style={s.pedidoIconBox}>
                        <Text style={{ fontSize: 16 }}>📋</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.itemTitle}>Pedido #{p.id_orden}</Text>
                        <Text style={s.itemSub}>
                          {p.fecha
                            ? new Date(p.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'Sin fecha'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.itemPrice}>{fmt(p.total ?? p.total_tienda)}</Text>
                        <Text style={[s.itemSub, { color: SUCCESS, fontWeight: '600' }]}>Ver →</Text>
                      </View>
                    </TouchableOpacity>
                  ))
              }
            </View>
          </View>

        </View>{/* fin body */}
      </ScrollView>

      <SidebarVendedor
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: PRIMARY },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* ── Header ── */
  header:      { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  menuBtn:     { padding: 4 },
  menuIcon:    { color: WHITE, fontSize: 22, fontWeight: '700' },
  storeName:   { color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 1 },
  signOutBtn:  { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  signOutText: { color: WHITE, fontSize: 12, fontWeight: '700' },

  /* ── Bienvenida ── */
  welcome:     { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  welcomeName: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.2 },
  welcomeStore: { fontSize: 26, fontWeight: '900', color: WHITE, letterSpacing: -0.5, marginTop: 2 },
  welcomeSub:  { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  /* ── KPI banner ── */
  kpiBanner:  { marginHorizontal: 16, marginBottom: 0, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 20, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  kpiLeft:    { flex: 1.3 },
  kpiLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  kpiBig:     { fontSize: 26, fontWeight: '900', color: WHITE, letterSpacing: -0.5 },
  kpiSub:     { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  kpiDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  kpiRight:   { flex: 1, justifyContent: 'center' },
  kpiMini:    {},
  kpiMiniLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiMiniVal:   { fontSize: 15, fontWeight: '800', color: WHITE, marginTop: 1 },
  kpiMiniSub:   { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 },

  /* ── Cuerpo crema ── */
  body: { backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 20, paddingTop: 8, paddingBottom: 20 },

  /* ── Stats row (3 cards) ── */
  statsRow:   { flexDirection: 'row', marginHorizontal: 16, marginTop: 18, gap: 10 },
  statsCard:  { flex: 1, backgroundColor: WHITE, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1, borderColor: BORDER, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  statsIcon:  { fontSize: 22, marginBottom: 6 },
  statsVal:   { fontSize: 22, fontWeight: '900', color: PRIMARY },
  statsLabel: { fontSize: 11, color: MUTED, marginTop: 2, fontWeight: '600' },

  /* ── Alerta stock ── */
  alertaBox:    { marginHorizontal: 16, marginTop: 14, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FCD34D' },
  alertaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  alertaIcon:   { fontSize: 16 },
  alertaTitle:  { fontSize: 13, fontWeight: '700', color: '#92400E' },
  alertaChips:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  alertaChip:   { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  alertaChipMore: { backgroundColor: '#FDE68A' },
  alertaChipText: { fontSize: 11, color: '#92400E', fontWeight: '600' },

  /* ── Secciones genéricas ── */
  section:       { marginHorizontal: 16, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: TEXT },
  linkText:      { color: PRIMARY, fontWeight: '700', fontSize: 13 },
  badgePrimary:  { backgroundColor: PRIMARY, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText:     { color: WHITE, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  /* ── Card contenedor ── */
  card:    { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  rowSep:  { borderBottomWidth: 1, borderBottomColor: BORDER },

  /* ── Top vendidos ── */
  topRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rankBadge:   { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rankText:    { fontSize: 13, fontWeight: '900', color: WHITE },
  soldBadge:   { backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginTop: 3 },
  soldBadgeActive: { backgroundColor: '#DCFCE7' },
  soldText:    { fontSize: 10, color: MUTED, fontWeight: '600' },
  soldTextActive: { color: SUCCESS },

  /* ── Últimos libros ── */
  libroRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  libroIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FDF0F3', alignItems: 'center', justifyContent: 'center' },

  /* ── Pedidos ── */
  pedidoRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  pedidoIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },

  /* ── Items genéricos ── */
  itemTitle: { fontSize: 13, fontWeight: '700', color: TEXT },
  itemSub:   { fontSize: 11, color: MUTED, marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: '800', color: PRIMARY },

  /* ── Mensajes (estilos conservados por sidebar) ── */
  unreadBadge:   { backgroundColor: PRIMARY, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  unreadText:    { color: WHITE, fontSize: 10, fontWeight: '800' },
  avatarCircle:  { width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: WHITE, fontWeight: '800', fontSize: 16 },
  dotBadge:      { backgroundColor: PRIMARY, borderRadius: 12, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  dotBadgeText:  { color: WHITE, fontSize: 11, fontWeight: '800' },

  emptyText: { color: '#aaa', fontSize: 13, textAlign: 'center', paddingVertical: 24 },
});
