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

const PRIMARY = '#7A1E3A';
const WHITE   = '#FFFFFF';
const BG      = '#FAF8F5';
const BORDER  = '#E0DBD4';
const TEXT    = '#2A2A2A';
const MUTED   = '#888';

const fmt = (val) =>
  val == null ? '$0 COP'
  : '$' + String(Math.floor(val)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' COP';

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
    } catch { /* fallo silencioso */ } finally {
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

  const ACCESOS = [
    { label: 'Mis Libros',     icon: '🏪', screen: 'Libreria' },
    { label: 'Publicar',       icon: '📚', screen: 'PublicarLibro' },
    { label: 'Pedidos',        icon: '📦', screen: 'PedidosVendedor' },
    { label: 'Perfil Tienda',  icon: '🏷️', screen: 'PerfilTienda' },
    { label: 'Mensajes',       icon: '💬', screen: 'Messages' },
    { label: 'Configuración',  icon: '⚙️', screen: 'ConfiguracionTienda' },
  ];

  const Header = () => (
    <View style={s.header}>
      <TouchableOpacity onPress={() => setSidebarVisible(true)} style={s.menuBtn}>
        <Text style={s.menuIcon}>☰</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.storeName} numberOfLines={1}>{user?.nombre_tienda || 'Mi Tienda'}</Text>
        <Text style={s.headerSub}>Panel de ventas</Text>
      </View>
      <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
        <Text style={s.signOutText}>Salir</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <Header />
        <View style={s.centered}>
          <ActivityIndicator size="large" color={WHITE} />
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
        <View style={s.welcomeCard}>
          <Text style={s.welcomeText}>Hola, {user?.nombre?.split(' ')[0] || 'vendedor'} 👋</Text>
          <Text style={s.welcomeSub}>Aquí tienes el panorama de tu tienda en BookyHome</Text>
        </View>

        {/* ── Cuerpo crema ── */}
        <View style={s.body}>

          {/* Resumen + Tendencia */}
          <View style={s.section}>
            <View style={s.statsRow}>
              <View style={[s.statsCard, { flex: 1 }]}>
                <View style={s.statsCardHeader}>
                  <Text style={s.statsCardTitle}>Resumen</Text>
                  <View style={s.tagGray}><Text style={s.tagText}>HISTÓRICO</Text></View>
                </View>
                <Text style={s.statsCardSub}>Estado general</Text>
                <Text style={s.statsBig}>{fmt(stats?.total_mes)}</Text>
                <Text style={s.statsMini}>Total ventas COP</Text>
                <View style={s.divider} />
                <Text style={s.statsBig}>{statsLibros.total}</Text>
                <Text style={s.statsMini}>Libros publicados</Text>
              </View>
              <View style={[s.statsCard, { flex: 1 }]}>
                <View style={s.statsCardHeader}>
                  <Text style={s.statsCardTitle}>Tendencia</Text>
                  <View style={s.tagAccent}><Text style={[s.tagText, { color: PRIMARY }]}>SEMANA</Text></View>
                </View>
                <Text style={s.statsCardSub}>Resumen mensual</Text>
                <Text style={s.statsBig}>{fmt(stats?.total_semana)}</Text>
                <Text style={s.statsMini}>Esta semana</Text>
                <View style={s.divider} />
                <Text style={s.statsBig}>{stats?.ordenes_mes ?? 0}</Text>
                <Text style={s.statsMini}>Órdenes este mes</Text>
              </View>
            </View>
          </View>

          {/* Tus ventas */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>TUS VENTAS</Text>
            <View style={s.metricsRow}>
              {[
                { label: 'Hoy',    val: fmt(stats?.total_hoy),    sub: `${stats?.ordenes_hoy ?? 0} orden(es)` },
                { label: 'Semana', val: fmt(stats?.total_semana), sub: null },
                { label: 'Mes',    val: fmt(stats?.total_mes),    sub: `${stats?.ordenes_mes ?? 0} orden(es)` },
              ].map(m => (
                <View key={m.label} style={s.metricCard}>
                  <Text style={s.metricLabel}>{m.label}</Text>
                  <Text style={s.metricVal}>{m.val}</Text>
                  {m.sub ? <Text style={s.metricSub}>{m.sub}</Text> : null}
                </View>
              ))}
            </View>
          </View>

          {/* Tus libros */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>TUS LIBROS</Text>
            <View style={s.metricsRow}>
              {[
                { label: 'Publicados', val: String(statsLibros.total) },
                { label: 'En stock',   val: String(statsLibros.stock) },
                { label: 'Categorías', val: String(statsLibros.categorias) },
              ].map(m => (
                <View key={m.label} style={[s.metricCard, s.metricCardNeutral]}>
                  <Text style={s.metricLabel}>{m.label}</Text>
                  <Text style={[s.metricVal, { color: TEXT }]}>{m.val}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Alertas stock */}
          {alertas.length > 0 && (
            <View style={s.section}>
              <View style={s.alertaBox}>
                <Text style={s.alertaTitle}>⚠️ {alertas.length} libro{alertas.length > 1 ? 's' : ''} con stock bajo</Text>
                <View style={s.alertaChips}>
                  {alertas.slice(0, 4).map((a, i) => (
                    <View key={i} style={s.alertaChip}>
                      <Text style={s.alertaChipText} numberOfLines={1}>{a.titulo} — {a.stock ?? 0} uds</Text>
                    </View>
                  ))}
                  {alertas.length > 4 && (
                    <View style={[s.alertaChip, { backgroundColor: '#FDE68A' }]}>
                      <Text style={s.alertaChipText}>+{alertas.length - 4} más</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Libros más vendidos */}
          {top.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>⭐ Libros más vendidos</Text>
              <View style={s.listBox}>
                {top.slice(0, 5).map((libro, i) => (
                  <View key={libro.id_libro ?? i} style={[s.topRow, i < Math.min(top.length, 5) - 1 && s.rowBorder]}>
                    <Text style={s.topRank}>#{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.topTitulo} numberOfLines={1}>{libro.titulo}</Text>
                      <Text style={s.topAutor}>{libro.autor_libro}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.topPrecio}>{fmt(libro.precio_libro)}</Text>
                      <Text style={s.topVendidos}>{libro.unidades_vendidas ?? 0} vendido(s)</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Últimos libros */}
          <View style={s.section}>
            <View style={s.rowBetween}>
              <Text style={s.sectionTitle}>Últimos libros</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Libreria')}>
                <Text style={s.linkText}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.listBox}>
              {libros.slice(0, 3).map((libro, i) => (
                <View key={libro.id_libro ?? i} style={[s.libroRow, i < 2 && s.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.topTitulo} numberOfLines={1}>{libro.titulo}</Text>
                    <Text style={s.topAutor}>{libro.autor_libro}</Text>
                  </View>
                  <Text style={s.topPrecio}>{fmt(libro.precio_libro ?? libro.precio)}</Text>
                </View>
              ))}
              {libros.length === 0 && <Text style={s.emptyText}>Aún no tienes libros publicados.</Text>}
            </View>
          </View>

          {/* Pedidos recientes */}
          <View style={s.section}>
            <View style={s.rowBetween}>
              <Text style={s.sectionTitle}>Pedidos recientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PedidosVendedor')}>
                <Text style={s.linkText}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.listBox}>
              {pedidos.slice(0, 4).map((p, i) => (
                <TouchableOpacity
                  key={p.id_orden ?? i}
                  style={[s.pedidoRow, i < Math.min(pedidos.length, 4) - 1 && s.rowBorder]}
                  onPress={() => navigation.navigate('PedidosVendedor')}
                >
                  <View>
                    <Text style={s.topTitulo}>Pedido #{p.id_orden}</Text>
                    <Text style={s.topAutor}>{p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : 'Sin fecha'}</Text>
                  </View>
                  <Text style={s.topPrecio}>{fmt(p.total ?? p.total_tienda)}</Text>
                </TouchableOpacity>
              ))}
              {pedidos.length === 0 && <Text style={s.emptyText}>Aún no tienes pedidos recientes.</Text>}
            </View>
          </View>

          {/* Mensajes */}
          <View style={s.section}>
            <View style={s.rowBetween}>
              <Text style={s.sectionTitle}>Mensajes</Text>
              {totalNoLeidos > 0 && (
                <View style={s.unreadBadge}><Text style={s.unreadText}>{totalNoLeidos}</Text></View>
              )}
            </View>
            <View style={s.listBox}>
              {loadingSalas ? (
                <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
              ) : salas.length === 0 ? (
                <View style={s.emptyMensajes}>
                  <Text style={s.emptyTitle}>Sin conversaciones</Text>
                  <Text style={s.emptySubtitle}>Aún no has recibido mensajes de clientes.</Text>
                </View>
              ) : (
                salas.slice(0, 5).map(sala => (
                  <TouchableOpacity
                    key={sala.id_sala}
                    style={[s.salaItem, s.rowBorder]}
                    onPress={() => navigation.navigate('Chat', { id_sala: sala.id_sala, nombre_tienda: sala.nombre_tienda })}
                  >
                    <View style={s.avatarCircle}>
                      <Text style={s.avatarText}>
                        {(sala.nombre_comprador || sala.nombre_otro_usuario || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.topTitulo} numberOfLines={1}>{sala.nombre_comprador || 'Comprador'}</Text>
                      <Text style={s.topAutor} numberOfLines={1}>{sala.ultimo_mensaje || 'Sin mensajes'}</Text>
                    </View>
                    {sala.no_leidos > 0 && <View style={s.dot} />}
                  </TouchableOpacity>
                ))
              )}
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
  safe:         { flex: 1, backgroundColor: PRIMARY },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // header
  header:       { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  menuBtn:      { padding: 4 },
  menuIcon:     { color: WHITE, fontSize: 22, fontWeight: '700' },
  storeName:    { color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSub:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  signOutBtn:   { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  signOutText:  { color: WHITE, fontSize: 12, fontWeight: '700' },

  // bienvenida
  welcomeCard:  { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  welcomeText:  { fontSize: 22, fontWeight: '800', color: WHITE },
  welcomeSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  // cuerpo crema
  body:         { backgroundColor: BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 6, paddingBottom: 20 },

  // secciones
  section:      { marginHorizontal: 14, marginTop: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, marginBottom: 8 },
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  linkText:     { color: PRIMARY, fontWeight: '700', fontSize: 14 },

  // stats
  statsRow:         { flexDirection: 'row', gap: 10 },
  statsCard:        { backgroundColor: WHITE, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  statsCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  statsCardTitle:   { fontSize: 13, fontWeight: '800', color: TEXT },
  statsCardSub:     { fontSize: 11, color: MUTED, marginBottom: 10 },
  statsBig:         { fontSize: 18, fontWeight: '800', color: PRIMARY, marginBottom: 2 },
  statsMini:        { fontSize: 11, color: MUTED },
  divider:          { height: 1, backgroundColor: BORDER, marginVertical: 10 },
  tagGray:          { backgroundColor: '#F0EDE9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagAccent:        { backgroundColor: '#FDF0F3', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagText:          { fontSize: 9, fontWeight: '800', color: MUTED, letterSpacing: 0.5 },

  // métricas
  metricsRow:       { flexDirection: 'row', gap: 8 },
  metricCard:       { flex: 1, backgroundColor: '#FDF0F3', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EAC8D2', alignItems: 'center', elevation: 1 },
  metricCardNeutral:{ backgroundColor: WHITE, borderColor: BORDER },
  metricLabel:      { fontSize: 11, color: MUTED, fontWeight: '600', marginBottom: 4 },
  metricVal:        { fontSize: 15, fontWeight: '800', color: PRIMARY, textAlign: 'center' },
  metricSub:        { fontSize: 10, color: MUTED, marginTop: 2 },

  // alertas
  alertaBox:        { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FCD34D' },
  alertaTitle:      { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  alertaChips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  alertaChip:       { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, maxWidth: 180 },
  alertaChipText:   { fontSize: 11, color: '#92400E', fontWeight: '600' },

  // grid accesos
  grid:             { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard:         { width: '30%', backgroundColor: WHITE, borderRadius: 14, padding: 14, alignItems: 'flex-start', borderWidth: 1, borderColor: BORDER, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  gridIcon:         { fontSize: 24, marginBottom: 8 },
  gridLabel:        { fontSize: 12, fontWeight: '700', color: TEXT },

  // listas
  listBox:          { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  rowBorder:        { borderBottomWidth: 1, borderColor: BORDER },
  topRow:           { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  topRank:          { fontSize: 14, fontWeight: '800', color: PRIMARY, width: 28 },
  topTitulo:        { fontSize: 13, fontWeight: '700', color: TEXT },
  topAutor:         { fontSize: 11, color: MUTED, marginTop: 2 },
  topPrecio:        { fontSize: 13, fontWeight: '800', color: PRIMARY },
  topVendidos:      { fontSize: 10, color: MUTED, marginTop: 2 },
  libroRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  pedidoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  emptyText:        { color: '#aaa', fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  // mensajes
  unreadBadge:      { backgroundColor: PRIMARY, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText:       { color: WHITE, fontSize: 11, fontWeight: '700' },
  emptyMensajes:    { paddingVertical: 28, alignItems: 'center' },
  emptyTitle:       { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 4 },
  emptySubtitle:    { fontSize: 12, color: MUTED, textAlign: 'center' },
  salaItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  avatarCircle:     { width: 38, height: 38, borderRadius: 19, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText:       { color: WHITE, fontWeight: '700', fontSize: 15 },
  dot:              { width: 9, height: 9, borderRadius: 5, backgroundColor: PRIMARY, marginLeft: 8 },
});
