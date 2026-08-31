import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import {
  getQuejasVendedor,
  getMensajesReclamo,
  enviarMensajeReclamo,
  getApiBaseUrl,
} from '../services/api';
import { IconAlertTriangle, IconMessage, IconEye, IconStar } from '../components/Icons';

// ── Paleta ──────────────────────────────────────────────────────────────────
const PRIMARY  = '#7A1E3A';
const BG       = '#FAF8F5';
const WHITE    = '#FFFFFF';
const TEXT     = '#1f2937';
const MUTED    = '#6b7280';
const BORDER   = '#e5e7eb';

// ── Config de estados ────────────────────────────────────────────────────────
const ESTADO_CFG = {
  'Abierto':     { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', dot: '#ef4444', label: 'Abierto' },
  'En revisión': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', dot: '#f97316', label: 'En revisión' },
  'En revision': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', dot: '#f97316', label: 'En revisión' },
  'Resuelto':    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', dot: '#22c55e', label: 'Resuelto' },
  'Rechazado':   { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#dc2626', label: 'Rechazado' },
  'Cerrado':     { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8', label: 'Cerrado' },
};
const getCfg = (estado) => ESTADO_CFG[estado] || ESTADO_CFG['Abierto'];

// ── Plantillas rápidas ───────────────────────────────────────────────────────
const PLANTILLAS = [
  'Hola, lamentamos el inconveniente. Estamos revisando lo sucedido con tu pedido.',
  'Ya hemos contactado a la transportadora para agilizar la entrega de tu paquete.',
  'Te enviaremos un ejemplar de reemplazo sin costo adicional. ¡Disculpa las molestias!',
  '¿Podrías enviarnos una foto adicional para verificar el estado del libro?',
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const tiempoTranscurrido = (fechaStr) => {
  if (!fechaStr) return null;
  const diff = Date.now() - new Date(fechaStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
  return `hace ${Math.floor(days / 30)} mes(es)`;
};

// ── Badge de estado ──────────────────────────────────────────────────────────
function BadgeEstado({ estado, small = false }) {
  const cfg = getCfg(estado);
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }, small && s.badgeSmall]}>
      <View style={[s.badgeDot, { backgroundColor: cfg.dot }]} />
      <Text style={[s.badgeText, { color: cfg.text }, small && s.badgeTextSmall]}>
        {cfg.label}
      </Text>
    </View>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, bg }) {
  return (
    <View style={[s.kpi, { backgroundColor: bg }]}>
      <Text style={[s.kpiValue, { color }]}>{value}</Text>
      <Text style={[s.kpiLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function QuejasVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [quejas,     setQuejas]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  // Lista
  const [filtro,    setFiltro]    = useState('todos');
  const [busqueda,  setBusqueda]  = useState('');

  // Detalle + chat
  const [seleccionada,  setSeleccionada]  = useState(null);
  const [mensajes,      setMensajes]      = useState([]);
  const [loadingChat,   setLoadingChat]   = useState(false);
  const [texto,         setTexto]         = useState('');
  const [enviando,      setEnviando]      = useState(false);
  const [vista,         setVista]         = useState('lista'); // 'lista' | 'detalle'

  const flatRef = useRef(null);

  // ── Carga ────────────────────────────────────────────────────────────────
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const res = await getQuejasVendedor();
      const items = Array.isArray(res.data) ? res.data : [];
      setQuejas(items);
      setSeleccionada((prev) => {
        if (!prev) return items[0] || null;
        return items.find((q) => q.id_solicitud === prev.id_solicitud) || items[0] || null;
      });
    } catch (e) {
      setError(e?.response?.data?.detail || 'No se pudieron cargar los reclamos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // Polling cada 12s (igual que la web)
  useEffect(() => {
    const id = setInterval(() => cargar(true), 12000);
    return () => clearInterval(id);
  }, [cargar]);

  // ── Cargar mensajes al seleccionar ───────────────────────────────────────
  useEffect(() => {
    if (!seleccionada) { setMensajes([]); return; }
    setLoadingChat(true);
    getMensajesReclamo(seleccionada.id_solicitud)
      .then((r) => setMensajes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setMensajes([]))
      .finally(() => setLoadingChat(false));
  }, [seleccionada?.id_solicitud]);

  // Scroll al final cuando llegan mensajes
  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd?.({ animated: true }), 200);
    }
  }, [mensajes]);

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const enviar = async () => {
    if (!texto.trim() || !seleccionada || enviando) return;
    setEnviando(true);
    try {
      await enviarMensajeReclamo(seleccionada.id_solicitud, texto.trim());
      setTexto('');
      const r = await getMensajesReclamo(seleccionada.id_solicitud);
      setMensajes(Array.isArray(r.data) ? r.data : []);
      await cargar(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const total      = quejas.length;
  const abiertos   = quejas.filter((q) => q.estado === 'Abierto').length;
  const enRevision = quejas.filter((q) => ['En revisión', 'En revision'].includes(q.estado)).length;
  const resueltos  = quejas.filter((q) => q.estado === 'Resuelto').length;

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const quejasFiltradas = quejas.filter((q) => {
    if (filtro === 'abierto'      && q.estado !== 'Abierto') return false;
    if (filtro === 'en revision'  && !['En revisión', 'En revision'].includes(q.estado)) return false;
    if (filtro === 'resuelto'     && q.estado !== 'Resuelto') return false;
    if (filtro === 'rechazado'    && !['Rechazado', 'Cerrado'].includes(q.estado)) return false;
    if (busqueda.trim()) {
      const t = busqueda.toLowerCase();
      return [q.id_orden, q.id_solicitud, q.comprador, q.asunto, q.titulo_libro, q.descripcion]
        .some((v) => String(v || '').toLowerCase().includes(t));
    }
    return true;
  });

  // ── Seleccionar reclamo ───────────────────────────────────────────────────
  const abrirDetalle = (queja) => {
    setSeleccionada(queja);
    setVista('detalle');
  };

  // ── Render item de lista ──────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const cfg      = getCfg(item.estado);
    const esActivo = seleccionada?.id_solicitud === item.id_solicitud;
    return (
      <TouchableOpacity
        style={[s.itemCard, esActivo && s.itemCardActive, { borderLeftColor: cfg.dot }]}
        onPress={() => abrirDetalle(item)}
        activeOpacity={0.7}
      >
        <View style={s.itemTop}>
          <View style={[s.ordenBadge, esActivo && { backgroundColor: PRIMARY }]}>
            <Text style={[s.ordenBadgeText, esActivo && { color: WHITE }]}>
              Orden #{item.id_orden}
            </Text>
          </View>
          <BadgeEstado estado={item.estado} small />
        </View>
        <Text style={s.itemComprador} numberOfLines={1}>
          {item.comprador || 'Comprador'}
        </Text>
        <Text style={s.itemAsunto} numberOfLines={1}>
          {item.asunto || item.titulo_libro || '—'}
        </Text>
        <Text style={s.itemTiempo}>{tiempoTranscurrido(item.fecha_creacion)}</Text>
      </TouchableOpacity>
    );
  };

  // ── Vista detalle + chat ──────────────────────────────────────────────────
  const renderDetalle = () => {
    if (!seleccionada) return null;
    const cfg = getCfg(seleccionada.estado);

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header del caso */}
        <View style={s.detalleHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => setVista('lista')} activeOpacity={0.7}>
            <Text style={s.backBtnText}>← Volver</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={s.detalleOrdenRow}>
              <View style={s.ordenChip}>
                <Text style={s.ordenChipText}>Orden #{seleccionada.id_orden}</Text>
              </View>
              <Text style={s.casoBadge}>Caso #{seleccionada.id_solicitud}</Text>
            </View>
            <Text style={s.detalleTitulo} numberOfLines={2}>
              {seleccionada.titulo_libro || `Reclamo de ${seleccionada.comprador}`}
            </Text>
            <Text style={s.detalleComprador} numberOfLines={1}>
              Comprador: <Text style={{ fontWeight: '800', color: TEXT }}>{seleccionada.comprador}</Text>
            </Text>
          </View>
          <BadgeEstado estado={seleccionada.estado} />
        </View>

        {/* Descripción del reclamo */}
        <View style={s.reclamoBox}>
          <View style={s.reclamoMotivo}>
            <Text style={s.reclamoMotivoText}>⚠️ Motivo: {seleccionada.asunto}</Text>
          </View>
          <Text style={s.reclamoDesc}>"{seleccionada.descripcion}"</Text>
        </View>

        {/* Mensajes del chat */}
        {loadingChat ? (
          <View style={s.chatLoading}>
            <ActivityIndicator color={PRIMARY} />
            <Text style={s.chatLoadingText}>Cargando mensajes…</Text>
          </View>
        ) : (
          <ScrollView
            ref={flatRef}
            style={s.chatScroll}
            contentContainerStyle={s.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {mensajes.length === 0 ? (
              <View style={s.chatVacio}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                <Text style={s.chatVacioTitle}>Aún no hay mensajes</Text>
                <Text style={s.chatVacioSub}>
                  Envía un mensaje para dialogar con el comprador y resolver el caso.
                </Text>
              </View>
            ) : (
              mensajes.map((item) => {
                const rolStr    = (item.rol || '').toLowerCase();
                const esVendedor = rolStr === 'vendedor';
                const esAdmin    = rolStr === 'admin' || rolStr === 'administrador';
                return (
                  <View
                    key={item.id_mensaje}
                    style={[
                      s.bubble,
                      esVendedor ? s.bubbleVendedor : esAdmin ? s.bubbleAdmin : s.bubbleComprador,
                    ]}
                  >
                    <View style={s.bubbleHeader}>
                      <Text style={[
                        s.bubbleNombre,
                        { color: esVendedor ? PRIMARY : esAdmin ? '#b45309' : '#1e40af' },
                      ]}>
                        {item.nombre_usuario}
                      </Text>
                      <View style={[
                        s.bubbleRolBadge,
                        { backgroundColor: esVendedor ? PRIMARY : esAdmin ? '#b45309' : '#1e40af' },
                      ]}>
                        <Text style={s.bubbleRolText}>
                          {esVendedor ? 'Tu Librería' : esAdmin ? 'BookyHome' : 'Comprador'}
                        </Text>
                      </View>
                      {item.fecha_creacion && (
                        <Text style={s.bubbleHora}>
                          {new Date(item.fecha_creacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </View>
                    <Text style={s.bubbleTexto}>{item.mensaje}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Plantillas rápidas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.plantillasRow}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Text style={s.plantillasLabel}>Respuestas rápidas:</Text>
          {PLANTILLAS.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={s.plantillaChip}
              onPress={() => setTexto(p)}
              activeOpacity={0.7}
            >
              <Text style={s.plantillaChipText} numberOfLines={1}>{p.substring(0, 32)}…</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input de respuesta */}
        <View style={s.inputBox}>
          <TextInput
            style={s.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe tu mensaje para el comprador…"
            placeholderTextColor={MUTED}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={enviar}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!texto.trim() || enviando) && { opacity: 0.5 }]}
            onPress={enviar}
            disabled={!texto.trim() || enviando}
            activeOpacity={0.8}
          >
            {enviando
              ? <ActivityIndicator size="small" color={WHITE} />
              : <Text style={s.sendBtnText}>Enviar</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <SidebarVendedor
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => setSidebarVisible(true)} activeOpacity={0.7}>
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Quejas y reclamos</Text>
          <Text style={s.headerSub}>Solicitudes recibidas de compradores</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={s.loadingText}>Cargando reclamos…</Text>
        </View>
      ) : vista === 'detalle' ? (
        renderDetalle()
      ) : (
        <>
          {/* KPIs */}
          <View style={s.kpiRow}>
            <KpiCard label="Total"       value={total}      color={PRIMARY}    bg="#fdf0f3" />
            <KpiCard label="Abiertos"    value={abiertos}   color="#dc2626"    bg="#fef2f2" />
            <KpiCard label="En revisión" value={enRevision} color="#ea580c"    bg="#fff7ed" />
            <KpiCard label="Resueltos"   value={resueltos}  color="#16a34a"    bg="#f0fdf4" />
          </View>

          {/* Filtros */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.filtrosScroll}
            contentContainerStyle={s.filtrosContent}
          >
            {[
              { id: 'todos',       label: 'Todos',       count: total,      color: PRIMARY  },
              { id: 'abierto',     label: 'Abiertos',    count: abiertos,   color: '#dc2626' },
              { id: 'en revision', label: 'En revisión', count: enRevision, color: '#ea580c' },
              { id: 'resuelto',    label: 'Resueltos',   count: resueltos,  color: '#16a34a' },
            ].map((f) => {
              const activo = filtro === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[s.filtroPill, activo && { backgroundColor: f.color, borderColor: f.color }]}
                  onPress={() => setFiltro(f.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.filtroPillText, activo && { color: WHITE }]}>
                    {f.label}
                  </Text>
                  <View style={[s.filtroCount, { backgroundColor: activo ? 'rgba(255,255,255,0.25)' : BORDER }]}>
                    <Text style={[s.filtroCountText, activo && { color: WHITE }]}>{f.count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Buscador */}
          <View style={s.searchBox}>
            <TextInput
              style={s.searchInput}
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar por comprador, orden, libro…"
              placeholderTextColor={MUTED}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Lista */}
          {error ? (
            <View style={s.centered}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => cargar()} activeOpacity={0.8}>
                <Text style={s.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : quejasFiltradas.length === 0 ? (
            <View style={s.centered}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
              <Text style={s.emptyTitle}>
                {busqueda.trim() ? 'Sin resultados' : 'Sin reclamos recibidos'}
              </Text>
              <Text style={s.emptyDesc}>
                {busqueda.trim()
                  ? 'Prueba con otro término'
                  : 'Cuando un comprador abra un caso, aparecerá aquí'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={quejasFiltradas}
              keyExtractor={(item) => String(item.id_solicitud)}
              renderItem={renderItem}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); cargar(true); }}
                  tintColor={PRIMARY}
                  colors={[PRIMARY]}
                />
              }
              ListHeaderComponent={
                <Text style={s.contador}>
                  {quejasFiltradas.length} solicitud{quejasFiltradas.length !== 1 ? 'es' : ''}
                </Text>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14 },
  menuBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:   { color: WHITE, fontSize: 20, fontWeight: '700' },
  headerTitle:{ color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // KPIs
  kpiRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  kpi:    { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  kpiLabel: { fontSize: 10, fontWeight: '700', marginTop: 3, textAlign: 'center' },

  // Filtros
  filtrosScroll:  { maxHeight: 50 },
  filtrosContent: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  filtroPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  filtroPillText: { fontSize: 13, fontWeight: '700', color: TEXT },
  filtroCount:    { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filtroCountText:{ fontSize: 11, fontWeight: '800', color: MUTED },

  // Buscador
  searchBox:   { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: 14, color: TEXT },

  // Lista
  list:       { padding: 16, paddingBottom: 40 },
  contador:   { fontSize: 12, color: MUTED, fontWeight: '600', marginBottom: 10 },
  loadingText:{ marginTop: 12, color: MUTED, fontSize: 14 },
  errorText:  { fontSize: 15, color: TEXT, textAlign: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: TEXT, textAlign: 'center', marginBottom: 8 },
  emptyDesc:  { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20 },
  retryBtn:   { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:  { color: WHITE, fontWeight: '800' },

  // Item tarjeta
  itemCard: {
    backgroundColor: WHITE, borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: BORDER,
    borderWidth: 1, borderColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  itemCardActive: { borderColor: PRIMARY, backgroundColor: '#fdf7f9' },
  itemTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ordenBadge:     { backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ordenBadgeText: { fontSize: 12, fontWeight: '800', color: TEXT },
  itemComprador:  { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  itemAsunto:     { fontSize: 12, color: PRIMARY, fontWeight: '600', marginBottom: 4 },
  itemTiempo:     { fontSize: 11, color: MUTED },

  // Badge
  badge:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeSmall:    { paddingHorizontal: 7, paddingVertical: 3 },
  badgeDot:      { width: 6, height: 6, borderRadius: 3 },
  badgeText:     { fontSize: 12, fontWeight: '700' },
  badgeTextSmall:{ fontSize: 10 },

  // Detalle
  detalleHeader: { backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER, padding: 14, gap: 8 },
  backBtn:       { alignSelf: 'flex-start', paddingVertical: 4 },
  backBtnText:   { color: PRIMARY, fontWeight: '700', fontSize: 14 },
  detalleOrdenRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ordenChip:     { backgroundColor: PRIMARY, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ordenChipText: { color: WHITE, fontSize: 12, fontWeight: '800' },
  casoBadge:     { fontSize: 12, color: MUTED, fontWeight: '600' },
  detalleTitulo: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 4 },
  detalleComprador: { fontSize: 13, color: MUTED },

  // Reclamo
  reclamoBox:    { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2', margin: 12, borderRadius: 12, padding: 12 },
  reclamoMotivo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reclamoMotivoText: { fontSize: 13, fontWeight: '700', color: '#991b1b' },
  reclamoDesc:   { fontSize: 13, color: '#450a0a', lineHeight: 20, backgroundColor: 'rgba(255,255,255,0.75)', padding: 10, borderRadius: 8 },

  // Chat
  chatLoading:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  chatLoadingText:{ color: MUTED, fontSize: 13 },
  chatScroll:    { flex: 1 },
  chatContent:   { padding: 16, paddingBottom: 8, gap: 10 },
  chatVacio:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  chatVacioTitle:{ fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 6 },
  chatVacioSub:  { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  // Burbujas
  bubble:         { maxWidth: '82%', borderRadius: 14, padding: 10, borderWidth: 1 },
  bubbleVendedor: { alignSelf: 'flex-end', backgroundColor: '#fdf0f3', borderColor: '#f3d1dc' },
  bubbleAdmin:    { alignSelf: 'flex-start', backgroundColor: '#fffbeb', borderColor: '#fef3c7' },
  bubbleComprador:{ alignSelf: 'flex-start', backgroundColor: WHITE, borderColor: BORDER },
  bubbleHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' },
  bubbleNombre:   { fontSize: 12, fontWeight: '800' },
  bubbleRolBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  bubbleRolText:  { color: WHITE, fontSize: 10, fontWeight: '800' },
  bubbleHora:     { fontSize: 10, color: MUTED, marginLeft: 'auto' },
  bubbleTexto:    { fontSize: 13, color: TEXT, lineHeight: 20 },

  // Plantillas
  plantillasRow:  { maxHeight: 46, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: '#fafafa' },
  plantillasLabel:{ fontSize: 11, fontWeight: '800', color: MUTED, textTransform: 'uppercase', alignSelf: 'center', flexShrink: 0 },
  plantillaChip:  { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, justifyContent: 'center' },
  plantillaChipText: { fontSize: 11, color: TEXT, fontWeight: '600' },

  // Input
  inputBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: WHITE },
  input:    { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: TEXT, maxHeight: 100 },
  sendBtn:  { backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: WHITE, fontWeight: '800', fontSize: 14 },
});
