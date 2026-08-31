import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getSoporte, crearSoporte } from '../services/api';
import {
  IconRefresh, IconLock, IconCreditCard, IconShoppingBag, IconMessage, IconTool,
} from '../components/Icons';

// ── Paleta ────────────────────────────────────────────────────────────────────
const PRIMARY  = '#7A1E3A';
const PRIMARY_L = '#9b2c4e';
const BG       = '#FAF8F5';
const WHITE    = '#FFFFFF';
const TEXT     = '#1f2937';
const MUTED    = '#6b7280';
const BORDER   = '#e5e7eb';

// ── Categorías (igual que la web) ─────────────────────────────────────────────
const CATEGORIAS = [
  { label: 'La página no carga',         Icon: IconRefresh    },
  { label: 'Error al iniciar sesión',     Icon: IconLock       },
  { label: 'Problema al pagar',           Icon: IconCreditCard },
  { label: 'Error al publicar o comprar', Icon: IconShoppingBag},
  { label: 'Otro problema técnico',       Icon: IconMessage    },
];

// ── Config de estados ─────────────────────────────────────────────────────────
const ESTADO_CFG = {
  'Abierto':     { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', dot: '#3b82f6', label: 'Abierto' },
  'Pendiente':   { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', dot: '#3b82f6', label: 'Abierto' },
  'En revisión': { bg: '#fff7ed', text: '#9a3412', border: '#fdba74', dot: '#ea580c', label: 'En revisión' },
  'En revision': { bg: '#fff7ed', text: '#9a3412', border: '#fdba74', dot: '#ea580c', label: 'En revisión' },
  'Resuelto':    { bg: '#f0fdf4', text: '#166534', border: '#86efac', dot: '#16a34a', label: 'Resuelto' },
  'Rechazado':   { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5', dot: '#ef4444', label: 'Rechazado' },
  'Cerrado':     { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', dot: '#6b7280', label: 'Cerrado' },
};
const getCfg = (estado) => ESTADO_CFG[estado] || ESTADO_CFG['Abierto'];

const PASOS = ['Abierto', 'En revisión', 'Resuelto'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const tiempoTranscurrido = (fechaStr) => {
  if (!fechaStr) return null;
  const diff = Date.now() - new Date(fechaStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
  return `hace ${Math.floor(days / 30)} mes(es)`;
};

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

// ── Badge de estado ───────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const cfg = getCfg(estado);
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[s.badgeDot, { backgroundColor: cfg.dot }]} />
      <Text style={[s.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ── Tarjeta de ticket ─────────────────────────────────────────────────────────
function TarjetaTicket({ ticket }) {
  const cfg       = getCfg(ticket.estado);
  const estadoN   = ticket.estado === 'Pendiente' ? 'Abierto' : ticket.estado;
  const pasoActual = PASOS.indexOf(estadoN);
  const mostrarProgreso = !['Rechazado', 'Cerrado'].includes(ticket.estado);

  return (
    <View style={[s.ticketCard, { borderLeftColor: cfg.dot }]}>
      {/* Header */}
      <View style={s.ticketHeader}>
        <View style={s.ticketNumBox}>
          <Text style={s.ticketNum}>#{ticket.numero || ticket.id_solicitud}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={s.ticketOrdenRow}>
            <View style={s.ticketOrdenChip}>
              <Text style={s.ticketOrdenChipText}>
                TICKET #{ticket.numero || ticket.id_solicitud}
              </Text>
            </View>
          </View>
          <Text style={s.ticketAsunto} numberOfLines={2}>{ticket.asunto}</Text>
        </View>
        <BadgeEstado estado={ticket.estado} />
      </View>

      {/* Barra de progreso */}
      {mostrarProgreso && (
        <View style={s.progresoBox}>
          <View style={s.pasoRow}>
            {PASOS.map((paso, i) => {
              const done    = pasoActual >= i;
              const current = pasoActual === i;
              return (
                <View key={paso} style={s.paso}>
                  <View style={[
                    s.pasoDot,
                    done    && { backgroundColor: cfg.dot },
                    current && { borderWidth: 2, borderColor: cfg.dot },
                  ]}>
                    {done && <Text style={s.pasoDotCheck}>✓</Text>}
                  </View>
                  <Text style={[s.pasoLabel, done && { color: cfg.text, fontWeight: '700' }]}>{paso}</Text>
                </View>
              );
            })}
          </View>
          <View style={s.barTrack}>
            <View style={[
              s.barFill,
              {
                backgroundColor: cfg.dot,
                width: pasoActual === 0 ? '10%' : pasoActual === 1 ? '55%' : '100%',
              },
            ]} />
          </View>
        </View>
      )}

      {/* Metadata */}
      <View style={s.metaRow}>
        {ticket.categoria && (
          <View style={s.categoriaChip}>
            <Text style={s.categoriaChipText}>{ticket.categoria}</Text>
          </View>
        )}
        {fmtFecha(ticket.fecha_creacion) && (
          <Text style={s.metaFecha}>📅 {fmtFecha(ticket.fecha_creacion)}</Text>
        )}
        {tiempoTranscurrido(ticket.fecha_creacion) && (
          <Text style={s.metaTiempo}>{tiempoTranscurrido(ticket.fecha_creacion)}</Text>
        )}
      </View>

      {/* Descripción */}
      {ticket.descripcion && (
        <View style={s.descBox}>
          <Text style={s.descLabel}>DESCRIPCIÓN</Text>
          <Text style={s.descText}>{ticket.descripcion}</Text>
        </View>
      )}

      {/* Respuesta del admin */}
      {ticket.respuesta && (
        <View style={s.respuestaBox}>
          <Text style={s.respuestaLabel}>💬 Respuesta del soporte</Text>
          <Text style={s.respuestaText}>{ticket.respuesta}</Text>
          {ticket.fecha_resolucion && (
            <Text style={s.respuestaFecha}>
              Atendido el {fmtFecha(ticket.fecha_resolucion)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function SoporteTecnico({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Datos
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formulario
  const [categoria,   setCategoria]   = useState(CATEGORIAS[0].label);
  const [asunto,      setAsunto]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando,    setEnviando]    = useState(false);
  const [exito,       setExito]       = useState('');
  const [errorForm,   setErrorForm]   = useState('');

  // Historial
  const [filtro, setFiltro] = useState('Todos');
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 5;

  // ── Carga ────────────────────────────────────────────────────────────────
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const res = await getSoporte();
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // ── Enviar ticket ─────────────────────────────────────────────────────────
  const enviar = async () => {
    setErrorForm('');
    setExito('');
    if (!asunto.trim())      return setErrorForm('El asunto es obligatorio.');
    if (!descripcion.trim()) return setErrorForm('La descripción es obligatoria.');

    setEnviando(true);
    try {
      await crearSoporte({ asunto: asunto.trim(), descripcion: descripcion.trim(), categoria });
      setAsunto('');
      setDescripcion('');
      setExito('Ticket enviado al soporte técnico.');
      await cargar(true);
    } catch (e) {
      setErrorForm(e?.response?.data?.detail || 'No se pudo crear el ticket.');
    } finally {
      setEnviando(false);
    }
  };

  // ── Filtrado y paginación ─────────────────────────────────────────────────
  const ticketsFiltrados = tickets.filter(
    (t) => filtro === 'Todos' || t.estado === filtro
  );
  const totalPaginas  = Math.max(1, Math.ceil(ticketsFiltrados.length / POR_PAGINA));
  const paginaActual  = Math.min(pagina, totalPaginas);
  const ticketsVis    = ticketsFiltrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  // Stats por estado
  const statsEstado = tickets.reduce((acc, t) => {
    acc[t.estado] = (acc[t.estado] || 0) + 1;
    return acc;
  }, {});

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
          <Text style={s.headerTitle}>Soporte técnico</Text>
          <Text style={s.headerSub}>Reporta fallas de la plataforma</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); cargar(true); }}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
        >
          {/* Hero */}
          <View style={s.hero}>
            <View style={s.heroIcon}><IconTool size={28} color={WHITE} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>Soporte técnico</Text>
              <Text style={s.heroSub}>
                Reporta fallas de la plataforma. Este canal no es para pedidos o devoluciones.
              </Text>
            </View>
          </View>

          {/* Alertas */}
          {exito ? (
            <View style={[s.alerta, s.alertaExito]}>
              <Text style={s.alertaTexto}>✓ {exito}</Text>
            </View>
          ) : null}
          {errorForm ? (
            <View style={[s.alerta, s.alertaError]}>
              <Text style={s.alertaTexto}>⚠️ {errorForm}</Text>
            </View>
          ) : null}

          {/* ── Formulario ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Nuevo ticket de soporte</Text>
            <Text style={s.cardSub}>Cuéntanos qué falló y qué estabas intentando hacer.</Text>

            {/* Categorías */}
            <Text style={s.fieldLabel}>TIPO DE PROBLEMA</Text>
            <View style={s.catGrid}>
              {CATEGORIAS.map((cat) => {
                const activo = categoria === cat.label;
                const CatIcon = cat.Icon;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[s.catBtn, activo && s.catBtnActive]}
                    onPress={() => setCategoria(cat.label)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.catIconBox, activo && { backgroundColor: PRIMARY }]}>
                      <CatIcon size={18} color={activo ? WHITE : PRIMARY} />
                    </View>
                    <Text style={[s.catLabel, activo && { color: PRIMARY, fontWeight: '700' }]} numberOfLines={2}>
                      {cat.label}
                    </Text>
                    {activo && (
                      <View style={s.catCheck}><Text style={s.catCheckText}>✓</Text></View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Asunto */}
            <Text style={[s.fieldLabel, { marginTop: 18 }]}>ASUNTO *</Text>
            <TextInput
              style={s.input}
              value={asunto}
              onChangeText={setAsunto}
              placeholder="Ej.: No puedo finalizar el pago"
              placeholderTextColor={MUTED}
              maxLength={150}
              returnKeyType="next"
            />

            {/* Descripción */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>DESCRIPCIÓN DEL PROBLEMA *</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Describe qué pasó, qué estabas haciendo y si apareció algún mensaje de error…"
              placeholderTextColor={MUTED}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
            />

            {/* Botón enviar */}
            <TouchableOpacity
              style={[s.submitBtn, enviando && { opacity: 0.6 }]}
              onPress={enviar}
              disabled={enviando}
              activeOpacity={0.85}
            >
              {enviando
                ? <ActivityIndicator color={WHITE} size="small" />
                : <Text style={s.submitBtnText}>Enviar ticket</Text>
              }
            </TouchableOpacity>
          </View>

          {/* ── Historial ── */}
          <View style={s.card}>
            <View style={s.histHeader}>
              <Text style={s.cardTitle}>Mis tickets técnicos</Text>
              {tickets.length > 0 && (
                <View style={s.totalChip}>
                  <Text style={s.totalChipText}>
                    {tickets.length} ticket{tickets.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats por estado */}
            {Object.keys(statsEstado).length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                  {Object.entries(statsEstado).map(([estado, n]) => {
                    const cfg = getCfg(estado);
                    return (
                      <View key={estado} style={[s.statChip, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                        <View style={[s.statDot, { backgroundColor: cfg.dot }]} />
                        <Text style={[s.statText, { color: cfg.text }]}>{n} {cfg.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Filtros */}
            {tickets.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtrosScroll}>
                <View style={s.filtrosRow}>
                  {['Todos', 'Abierto', 'En revisión', 'Resuelto', 'Rechazado'].map((f) => {
                    const activo = filtro === f;
                    const cfg = f === 'Todos' ? { dot: PRIMARY, text: PRIMARY } : getCfg(f);
                    return (
                      <TouchableOpacity
                        key={f}
                        style={[
                          s.filtroPill,
                          activo && { backgroundColor: cfg.dot, borderColor: cfg.dot },
                        ]}
                        onPress={() => { setFiltro(f); setPagina(1); }}
                        activeOpacity={0.7}
                      >
                        <View style={[s.filtroDot, { backgroundColor: activo ? WHITE : cfg.dot }]} />
                        <Text style={[s.filtroText, activo && { color: WHITE }]}>{f}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Lista */}
            {loading ? (
              <View style={s.centered}>
                <ActivityIndicator color={PRIMARY} />
                <Text style={s.loadingText}>Cargando tickets…</Text>
              </View>
            ) : ticketsFiltrados.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>🎫</Text>
                <Text style={s.emptyTitle}>
                  {filtro !== 'Todos' ? 'Sin tickets con ese estado' : 'No tienes tickets previos'}
                </Text>
                <Text style={s.emptyDesc}>
                  {filtro !== 'Todos'
                    ? 'Prueba cambiando el filtro'
                    : 'Cuando envíes un ticket, aparecerá aquí'}
                </Text>
              </View>
            ) : (
              <>
                {ticketsVis.map((ticket) => (
                  <TarjetaTicket key={ticket.id_solicitud} ticket={ticket} />
                ))}

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <View style={s.paginacion}>
                    <TouchableOpacity
                      style={[s.paginaBtn, paginaActual === 1 && s.paginaBtnDis]}
                      onPress={() => setPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.paginaBtnText, paginaActual === 1 && { color: MUTED }]}>
                        ← Anterior
                      </Text>
                    </TouchableOpacity>

                    <Text style={s.paginaInfo}>
                      {paginaActual} / {totalPaginas}
                      {'  ·  '}{ticketsFiltrados.length} ticket{ticketsFiltrados.length > 1 ? 's' : ''}
                    </Text>

                    <TouchableOpacity
                      style={[s.paginaBtn, paginaActual === totalPaginas && s.paginaBtnDis]}
                      onPress={() => setPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.paginaBtnText, paginaActual === totalPaginas && { color: MUTED }]}>
                        Siguiente →
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  scroll:  { padding: 16, paddingBottom: 40 },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14 },
  menuBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:   { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerTitle:{ color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // Hero
  hero:     { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: PRIMARY, borderRadius: 20, padding: 20, marginBottom: 16, ...Platform.select({ ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: { elevation: 6 } }) },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  heroTitle:{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  heroSub:  { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 18 },

  // Alertas
  alerta:      { borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  alertaExito: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  alertaError: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  alertaTexto: { fontSize: 14, fontWeight: '600', color: TEXT },

  // Card
  card:      { backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 } }) },
  cardTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: MUTED, marginBottom: 18 },

  // Formulario
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  catGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catBtn:     { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#fafafa' },
  catBtnActive: { borderColor: PRIMARY, backgroundColor: '#fdf8f9', ...Platform.select({ ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 6 }, android: { elevation: 2 } }) },
  catIconBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f7e9ee', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catLabel:   { flex: 1, fontSize: 12, color: TEXT, lineHeight: 16 },
  catCheck:   { width: 18, height: 18, borderRadius: 9, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  catCheckText: { color: WHITE, fontSize: 10, fontWeight: '900' },

  input:      { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: TEXT, backgroundColor: WHITE },
  inputMulti: { height: 110, textAlignVertical: 'top', paddingTop: 12 },
  submitBtn:  { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 20, ...Platform.select({ ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) },
  submitBtnText: { color: WHITE, fontWeight: '800', fontSize: 15 },

  // Historial
  histHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  totalChip:  { backgroundColor: '#fdf2f4', borderWidth: 1, borderColor: '#f0dde4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  totalChipText: { color: PRIMARY, fontSize: 12, fontWeight: '700' },

  statChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statDot:   { width: 6, height: 6, borderRadius: 3 },
  statText:  { fontSize: 12, fontWeight: '700' },

  filtrosScroll: { maxHeight: 44, marginBottom: 14 },
  filtrosRow:    { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filtroPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  filtroDot:     { width: 6, height: 6, borderRadius: 3 },
  filtroText:    { fontSize: 13, fontWeight: '700', color: TEXT },

  // Ticket card
  ticketCard:    { borderRadius: 16, borderWidth: 1, borderColor: '#eee3e9', borderLeftWidth: 5, marginBottom: 16, backgroundColor: WHITE, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 8 }, android: { elevation: 3 } }) },
  ticketHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fdf8f9', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0e8ec' },
  ticketNumBox:  { width: 48, height: 56, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...Platform.select({ ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 }, android: { elevation: 3 } }) },
  ticketNum:     { color: WHITE, fontSize: 11, fontWeight: '900', letterSpacing: -0.5 },
  ticketOrdenRow:{ marginBottom: 4 },
  ticketOrdenChip: { backgroundColor: PRIMARY, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  ticketOrdenChipText: { color: WHITE, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  ticketAsunto:  { fontSize: 14, fontWeight: '800', color: TEXT, lineHeight: 20 },

  // Badge
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, borderWidth: 1, flexShrink: 0 },
  badgeDot:  { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Progreso
  progresoBox: { padding: 14, paddingBottom: 12 },
  pasoRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  paso:        { alignItems: 'center', flex: 1 },
  pasoDot:     { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f0e8ec', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pasoDotCheck:{ color: WHITE, fontSize: 11, fontWeight: '900' },
  pasoLabel:   { fontSize: 10, color: MUTED, textAlign: 'center' },
  barTrack:    { height: 5, borderRadius: 4, backgroundColor: '#f0e8ec', overflow: 'hidden' },
  barFill:     { height: 5, borderRadius: 4 },

  // Metadata
  metaRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10 },
  categoriaChip:   { backgroundColor: '#fdf2f4', borderWidth: 1, borderColor: '#f0dde4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  categoriaChipText:{ color: PRIMARY, fontSize: 11, fontWeight: '700' },
  metaFecha:       { fontSize: 11, color: MUTED, fontWeight: '600' },
  metaTiempo:      { fontSize: 11, color: MUTED, marginLeft: 'auto' },

  // Descripción
  descBox:   { marginHorizontal: 14, marginBottom: 10, padding: 12, backgroundColor: '#fafafa', borderRadius: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  descLabel: { fontSize: 10, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  descText:  { fontSize: 13, color: '#555', lineHeight: 20 },

  // Respuesta
  respuestaBox:   { marginHorizontal: 14, marginBottom: 14, padding: 14, backgroundColor: '#fdf8f9', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: PRIMARY },
  respuestaLabel: { fontSize: 12, fontWeight: '800', color: PRIMARY, marginBottom: 6 },
  respuestaText:  { fontSize: 13, color: '#444', lineHeight: 20 },
  respuestaFecha: { fontSize: 11, color: MUTED, marginTop: 6 },

  // Estado
  centered:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  loadingText: { marginTop: 10, color: MUTED, fontSize: 13 },
  emptyBox:    { alignItems: 'center', paddingVertical: 32 },
  emptyTitle:  { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 6 },
  emptyDesc:   { fontSize: 13, color: MUTED, textAlign: 'center' },

  // Paginación
  paginacion:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: BORDER },
  paginaBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: PRIMARY, backgroundColor: WHITE },
  paginaBtnDis:  { borderColor: BORDER },
  paginaBtnText: { fontSize: 13, fontWeight: '700', color: PRIMARY },
  paginaInfo:    { fontSize: 12, color: MUTED, fontWeight: '600', textAlign: 'center' },
});
