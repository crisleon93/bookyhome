import { useThemedStyles } from '../context/ThemeContext';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import {
  enviarMensajeReclamo, getMensajesReclamo, getQuejasVendedor, resolveImageUrl,
} from '../services/api';
import {
  IconAlertTriangle, IconBookOpen, IconCheck, IconClose, IconEye, IconMenu, IconMessage, IconSearch,
} from '../components/Icons';

const PRIMARY = '#7A1E3A';
const BG = '#F8FAFC';
const BORDER = '#E5E7EB';
const QUICK_REPLIES = [
  'Hola, lamentamos el inconveniente. Estamos revisando lo sucedido con tu pedido.',
  'Ya hemos contactado a la transportadora para agilizar la entrega de tu paquete.',
  'Te enviaremos un ejemplar de reemplazo sin costo adicional. Disculpa las molestias.',
  '¿Podrías enviarnos una foto adicional para verificar el estado del libro?',
];
const FILTERS = [
  { key: 'todos', label: 'Todos', count: (stats) => stats.total, color: PRIMARY },
  { key: 'abierto', label: 'Abiertos', count: (stats) => stats.open, color: '#DC2626' },
  { key: 'revision', label: 'En revisión', count: (stats) => stats.review, color: '#EA580C' },
  { key: 'resuelto', label: 'Resueltos', count: (stats) => stats.resolved, color: '#16A34A' },
];

const normalizedStatus = (status) => String(status || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const statusColors = (status) => {
  const normalized = normalizedStatus(status);
  if (normalized === 'resuelto') return { bg: '#DCFCE7', color: '#166534', dot: '#16A34A' };
  if (normalized.includes('revision')) return { bg: '#FFF7ED', color: '#9A3412', dot: '#EA580C' };
  if (normalized === 'abierto') return { bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' };
  if (normalized === 'rechazado') return { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' };
  return { bg: '#F3F4F6', color: '#374151', dot: '#6B7280' };
};
const formatDate = (value, withTime = false) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleString('es-CO', withTime
    ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return 'No disponible';
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    : 'No disponible';
};
const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || error?.response?.data?.message || error?.message || fallback;

function StatusBadge({ status }) {
  const colors = statusColors(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.statusText, { color: colors.color }]}>{status || 'Sin estado'}</Text>
    </View>
  );
}

function StatCard({ label, value, color, background, icon, valueColor }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: background }]}>
        {icon}
      </View>
      <View style={styles.statCopy}>
        <Text style={[styles.statValue, { color: valueColor || '#111827' }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function QuejasVendedor({ navigation }) {
  const styles = useThemedStyles(themeBaseStyles);
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [quejas, setQuejas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [evidenceVisible, setEvidenceVisible] = useState(false);
  const [draft, setDraft] = useState('');
  const complaintsRequestId = useRef(0);
  const hasLoadedComplaints = useRef(false);
  const chatRequestId = useRef(0);

  const loadComplaints = useCallback(async (background = false) => {
    const requestId = ++complaintsRequestId.current;
    if (!background) {
      if (hasLoadedComplaints.current) setRefreshing(true);
      else setLoading(true);
    }
    setError('');
    try {
      const response = await getQuejasVendedor();
      if (!Array.isArray(response.data)) {
        throw new Error('El servidor devolvió una lista de reclamos no válida.');
      }
      if (requestId !== complaintsRequestId.current) return;
      setQuejas(response.data);
      hasLoadedComplaints.current = true;
      setSelected((current) => {
        if (!response.data.length) return null;
        return response.data.find((item) => String(item.id_solicitud) === String(current?.id_solicitud))
          || response.data[0];
      });
    } catch (requestError) {
      if (requestId === complaintsRequestId.current) {
        setError(getErrorMessage(requestError, 'No se pudieron cargar los reclamos de la tienda.'));
      }
    } finally {
      if (requestId === complaintsRequestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadComplaints();
    const timer = setInterval(() => loadComplaints(true), 12000);
    return () => {
      clearInterval(timer);
      complaintsRequestId.current += 1;
    };
  }, [loadComplaints]);

  const loadMessages = useCallback(async (id, showLoading = false) => {
    const requestId = ++chatRequestId.current;
    if (showLoading) setChatLoading(true);
    setChatError('');
    try {
      const response = await getMensajesReclamo(id);
      if (!Array.isArray(response.data)) {
        throw new Error('El servidor devolvió una conversación no válida.');
      }
      if (requestId === chatRequestId.current) {
        setMessages(response.data);
      }
    } catch (requestError) {
      if (requestId === chatRequestId.current) {
        setChatError(getErrorMessage(requestError, 'No se pudieron cargar los mensajes.'));
      }
    } finally {
      if (requestId === chatRequestId.current) setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!detailsVisible || !selected?.id_solicitud) return undefined;
    loadMessages(selected.id_solicitud, true);
    const timer = setInterval(() => loadMessages(selected.id_solicitud), 12000);
    return () => {
      clearInterval(timer);
      chatRequestId.current += 1;
    };
  }, [detailsVisible, selected?.id_solicitud, loadMessages]);

  const stats = useMemo(() => ({
    total: quejas.length,
    open: quejas.filter((item) => normalizedStatus(item.estado) === 'abierto').length,
    review: quejas.filter((item) => normalizedStatus(item.estado).includes('revision')).length,
    resolved: quejas.filter((item) => normalizedStatus(item.estado) === 'resuelto').length,
  }), [quejas]);

  const filteredComplaints = useMemo(() => {
    const term = search.trim().toLowerCase();
    return quejas.filter((item) => {
      const status = normalizedStatus(item.estado);
      if (filter === 'abierto' && status !== 'abierto') return false;
      if (filter === 'revision' && !status.includes('revision')) return false;
      if (filter === 'resuelto' && status !== 'resuelto') return false;
      if (filter === 'cerrado' && !['cerrado', 'rechazado'].includes(status)) return false;
      if (!term) return true;
      return [
        item.id_orden, item.id_solicitud, item.comprador, item.asunto,
        item.titulo_libro, item.descripcion,
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [quejas, filter, search]);

  const openComplaint = (complaint) => {
    setSelected(complaint);
    setMessages([]);
    setChatError('');
    setDraft('');
    setDetailsVisible(true);
  };

  const sendMessage = async () => {
    const message = draft.trim();
    if (!message || !selected?.id_solicitud || sending) return;
    setSending(true);
    setChatError('');
    try {
      await enviarMensajeReclamo(selected.id_solicitud, message);
      setDraft('');
      await loadMessages(selected.id_solicitud);
      await loadComplaints(true);
    } catch (requestError) {
      setChatError(getErrorMessage(requestError, 'No se pudo enviar la respuesta.'));
    } finally {
      setSending(false);
    }
  };

  const renderComplaint = (item) => {
    const imageUri = resolveImageUrl(item.imagen_libro);
    return (
      <TouchableOpacity
        key={item.id_solicitud}
        style={styles.complaintCard}
        onPress={() => openComplaint(item)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Abrir reclamo ${item.id_solicitud}, ${item.asunto || 'sin asunto'}`}
      >
        <View style={styles.cardTop}>
          {imageUri
            ? <Image source={{ uri: imageUri }} style={styles.bookCover} />
            : <View style={[styles.bookCover, styles.coverPlaceholder]}><IconBookOpen size={22} color={PRIMARY} /></View>}
          <View style={styles.cardHeading}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.asunto || 'Reclamo sin asunto'}</Text>
            <Text style={styles.cardId}>Caso #{item.id_solicitud} · Pedido #{item.id_orden}</Text>
            <StatusBadge status={item.estado} />
          </View>
        </View>
        <View style={styles.cardDivider} />
        <Text style={styles.cardBuyer} numberOfLines={1}>{item.comprador || 'Comprador'}</Text>
        <Text style={styles.cardBook} numberOfLines={1}>{item.titulo_libro || 'Libro no especificado'}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.descripcion || 'Sin descripción adicional.'}</Text>
        <View style={styles.cardBottom}>
          <Text style={styles.cardDate}>{formatDate(item.fecha_creacion, true)}</Text>
          <Text style={styles.viewDetails}>Ver detalle ›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setSidebarVisible(true)}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Abrir menú del vendedor"
        >
          <IconMenu size={23} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Quejas y reclamos</Text>
          <Text style={styles.headerSubtitle}>Casos recibidos por tu tienda</Text>
        </View>
        <TouchableOpacity onPress={() => loadComplaints(true)} style={styles.refreshButton} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={styles.refreshText}>Actualizar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.statsGrid}>
          <StatCard
            label="Total reclamos"
            value={stats.total}
            color={PRIMARY}
            background="#FCE7EF"
            icon={<IconAlertTriangle size={18} color={PRIMARY} />}
          />
          <StatCard
            label="Abiertos / nuevos"
            value={stats.open}
            color="#DC2626"
            valueColor="#DC2626"
            background="#FEF2F2"
            icon={<IconAlertTriangle size={18} color="#DC2626" />}
          />
          <StatCard
            label="En revisión"
            value={stats.review}
            color="#EA580C"
            valueColor="#EA580C"
            background="#FFF7ED"
            icon={<IconEye size={18} color="#EA580C" />}
          />
          <StatCard
            label="Resueltos"
            value={stats.resolved}
            color="#16A34A"
            valueColor="#16A34A"
            background="#F0FDF4"
            icon={<IconCheck size={18} color="#16A34A" />}
          />
        </View>

        <View style={styles.filterToolbar}>
          <View style={styles.searchBox}>
            <IconSearch size={19} color="#6B7280" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por comprador, orden..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              accessibilityLabel="Buscar reclamos por comprador u orden"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Limpiar búsqueda">
                <IconClose size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((item) => {
              const active = filter === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[
                    styles.filterChip,
                    active && { backgroundColor: item.color, borderColor: item.color },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
                  <Text style={[styles.filterCount, active && styles.filterCountActive]}>
                    {item.count(stats)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>Bandeja de reclamos</Text>
          <Text style={styles.resultCount}>{filteredComplaints.length} casos</Text>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.stateText}>Cargando reclamos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadComplaints()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredComplaints.length === 0 ? (
          <View style={styles.emptyState}>
            <IconMessage size={30} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{quejas.length ? 'No hay resultados' : 'Aún no tienes reclamos'}</Text>
            <Text style={styles.stateText}>
              {quejas.length ? 'Prueba con otro filtro o término de búsqueda.' : 'Cuando un comprador envíe un reclamo, aparecerá aquí.'}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList}>{filteredComplaints.map(renderComplaint)}</View>
        )}
      </ScrollView>

      <Modal visible={detailsVisible} animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            style={styles.modalRoot}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>Detalle del reclamo</Text>
                <Text style={styles.modalSubtitle}>Caso #{selected?.id_solicitud} · Pedido #{selected?.id_orden}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailsVisible(false)} style={styles.closeButton} accessibilityLabel="Cerrar detalle">
                <IconClose size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            {selected && (
              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.detailStatusRow}>
                  <StatusBadge status={selected.estado} />
                  <Text style={styles.detailDate}>{formatDate(selected.fecha_creacion)}</Text>
                </View>

                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <IconAlertTriangle size={18} color={PRIMARY} />
                    <Text style={styles.detailSubject}>{selected.asunto || 'Motivo no especificado'}</Text>
                  </View>
                  <Text style={styles.detailDescription}>{selected.descripcion || 'Sin descripción adicional.'}</Text>
                  {selected.evidencia_url ? (
                    <TouchableOpacity style={styles.evidenceButton} onPress={() => setEvidenceVisible(true)}>
                      <IconEye size={17} color={PRIMARY} />
                      <Text style={styles.evidenceButtonText}>Ver evidencia adjunta</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Comprador</Text>
                    <Text style={styles.infoValue}>{selected.comprador || 'No disponible'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Correo</Text>
                    <Text style={styles.infoValue}>{selected.correo_comprador || 'No disponible'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Libro</Text>
                    <Text style={styles.infoValue}>{selected.titulo_libro || 'No disponible'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Tienda</Text>
                    <Text style={styles.infoValue}>{selected.nombre_tienda || 'Tu tienda'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Categoría</Text>
                    <Text style={styles.infoValue}>{selected.categoria || 'No disponible'}</Text>
                  </View>
                  {selected.fecha_resolucion ? (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Fecha de resolución</Text>
                      <Text style={styles.infoValue}>{formatDate(selected.fecha_resolucion)}</Text>
                    </View>
                  ) : null}
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Artículos</Text>
                    <Text style={styles.infoValue}>{selected.total_items ?? 'No disponible'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Total del pedido</Text>
                    <Text style={styles.infoValue}>{formatMoney(selected.total_orden)}</Text>
                  </View>
                </View>

                <View style={styles.chatHeading}>
                  <View>
                    <Text style={styles.sectionTitle}>Conversación</Text>
                    <Text style={styles.chatHint}>Responde al comprador desde aquí.</Text>
                  </View>
                  <TouchableOpacity onPress={() => loadMessages(selected.id_solicitud, true)}>
                    <Text style={styles.chatRefresh}>Actualizar</Text>
                  </TouchableOpacity>
                </View>

                {chatError ? <Text style={styles.chatError}>{chatError}</Text> : null}
                <View style={styles.messagesBox}>
                  {chatLoading ? (
                    <ActivityIndicator color={PRIMARY} />
                  ) : messages.length === 0 ? (
                    <Text style={styles.noMessages}>Aún no hay mensajes. Envía una respuesta para iniciar la conversación.</Text>
                  ) : (
                    messages.map((item) => {
                      const role = normalizedStatus(item.rol);
                      const isSeller = role === 'vendedor';
                      const isAdmin = role === 'admin' || role === 'administrador';
                      return (
                        <View key={item.id_mensaje} style={[styles.messageBubble, isSeller ? styles.sellerMessage : styles.buyerMessage]}>
                          <View style={styles.messageMeta}>
                            <Text style={[styles.messageAuthor, isSeller && styles.sellerMessageAuthor]}>
                              {item.nombre_usuario || (isSeller ? 'Tu tienda' : 'Comprador')}
                            </Text>
                            <Text style={styles.messageRole}>{isSeller ? 'Tu tienda' : isAdmin ? 'Administración' : 'Comprador'}</Text>
                          </View>
                          <Text style={styles.messageText}>{item.mensaje}</Text>
                          {item.fecha_creacion ? <Text style={styles.messageTime}>{formatDate(item.fecha_creacion, true)}</Text> : null}
                        </View>
                      );
                    })
                  )}
                </View>

                <Text style={styles.quickReplyLabel}>Respuestas rápidas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplies}>
                  {QUICK_REPLIES.map((reply) => (
                    <TouchableOpacity key={reply} style={styles.quickReply} onPress={() => setDraft(reply)}>
                      <Text style={styles.quickReplyText} numberOfLines={2}>{reply}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.composeRow}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Escribe una respuesta..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    style={styles.composeInput}
                    accessibilityLabel="Escribir respuesta al reclamo"
                  />
                  <TouchableOpacity
                    onPress={sendMessage}
                    disabled={sending || !draft.trim()}
                    style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel="Enviar respuesta"
                  >
                    {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.sendButtonText}>Enviar</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal visible={evidenceVisible} transparent animationType="fade" onRequestClose={() => setEvidenceVisible(false)}>
        <View style={styles.evidenceOverlay}>
          <TouchableOpacity style={styles.evidenceClose} onPress={() => setEvidenceVisible(false)} accessibilityLabel="Cerrar evidencia">
            <IconClose size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {selected?.evidencia_url ? (
            <Image source={{ uri: resolveImageUrl(selected.evidencia_url) }} style={styles.evidenceImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

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

const themeBaseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: {
    minHeight: 72, backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center',
  },
  menuButton: { width: 40, height: 42, justifyContent: 'center' },
  headerText: { flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: '#F5DCE5', fontSize: 11, marginTop: 2 },
  refreshButton: { minWidth: 75, alignItems: 'flex-end', paddingVertical: 8 },
  refreshText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  content: { padding: 14, paddingBottom: 30 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '48%', minHeight: 76, flexGrow: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#DDE4EE', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statCopy: { flex: 1 },
  statValue: { color: '#111827', fontSize: 20, lineHeight: 22, fontWeight: '800' },
  statLabel: { color: '#64748B', fontSize: 10, marginTop: 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  filterToolbar: { padding: 11, borderWidth: 1, borderColor: '#DDE4EE', borderRadius: 14, backgroundColor: '#FFFFFF', marginBottom: 16 },
  searchBox: {
    height: 46, borderRadius: 11, borderWidth: 1, borderColor: BORDER, backgroundColor: '#FFFFFF',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 9,
  },
  searchInput: { flex: 1, color: '#111827', fontSize: 13, paddingVertical: 0 },
  filterRow: { gap: 8, paddingTop: 10 },
  filterChip: { borderWidth: 1, borderColor: '#DDE4EE', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterText: { color: '#4B5563', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  filterCount: { minWidth: 19, textAlign: 'center', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: '#E2E8F0', color: '#64748B', fontSize: 10, fontWeight: '800' },
  filterCountActive: { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.25)' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  resultCount: { color: '#6B7280', fontSize: 12 },
  cardsList: { gap: 10 },
  complaintCard: { backgroundColor: '#FFFFFF', borderRadius: 13, borderWidth: 1, borderColor: BORDER, padding: 13 },
  cardTop: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  bookCover: { width: 52, height: 66, borderRadius: 7, backgroundColor: '#F3F4F6' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardHeading: { flex: 1, gap: 5 },
  cardTitle: { color: '#111827', fontSize: 14, fontWeight: '800' },
  cardId: { color: '#6B7280', fontSize: 11 },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  cardBuyer: { color: '#374151', fontSize: 12, fontWeight: '700' },
  cardBook: { color: PRIMARY, fontSize: 12, marginTop: 3 },
  cardDescription: { color: '#6B7280', fontSize: 12, lineHeight: 17, marginTop: 6 },
  cardBottom: { marginTop: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { color: '#9CA3AF', fontSize: 10 },
  viewDetails: { color: PRIMARY, fontSize: 11, fontWeight: '800' },
  centerState: { paddingVertical: 50, alignItems: 'center', gap: 10 },
  stateText: { color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  errorBox: { borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', padding: 14, alignItems: 'flex-start' },
  errorText: { color: '#991B1B', fontSize: 13, lineHeight: 19 },
  retryButton: { marginTop: 10, borderRadius: 8, backgroundColor: PRIMARY, paddingHorizontal: 13, paddingVertical: 8 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyState: { paddingHorizontal: 22, paddingVertical: 38, alignItems: 'center', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#374151', fontSize: 15, fontWeight: '800' },
  modalSafeArea: { flex: 1, backgroundColor: BG },
  modalRoot: { flex: 1 },
  modalHeader: { minHeight: 68, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: BORDER, flexDirection: 'row', alignItems: 'center' },
  modalHeaderCopy: { flex: 1 },
  modalTitle: { color: '#111827', fontSize: 17, fontWeight: '800' },
  modalSubtitle: { color: '#6B7280', fontSize: 11, marginTop: 3 },
  closeButton: { padding: 7 },
  modalContent: { padding: 14, paddingBottom: 30 },
  detailStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailDate: { color: '#6B7280', fontSize: 11 },
  detailCard: { backgroundColor: '#FFFFFF', borderColor: '#FECACA', borderWidth: 1, borderRadius: 12, padding: 13 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailSubject: { flex: 1, color: '#7F1D1D', fontSize: 14, fontWeight: '800' },
  detailDescription: { color: '#374151', fontSize: 13, lineHeight: 20, marginTop: 10 },
  evidenceButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#FCE7EF' },
  evidenceButtonText: { color: PRIMARY, fontSize: 12, fontWeight: '800' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10 },
  infoItem: { width: '48%', flexGrow: 1, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: '#FFFFFF' },
  infoLabel: { color: '#6B7280', fontSize: 10, fontWeight: '700' },
  infoValue: { color: '#111827', fontSize: 12, fontWeight: '700', marginTop: 4 },
  chatHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  chatHint: { color: '#6B7280', fontSize: 11, marginTop: 3 },
  chatRefresh: { color: PRIMARY, fontSize: 12, fontWeight: '800', padding: 6 },
  chatError: { color: '#B91C1C', backgroundColor: '#FEF2F2', borderRadius: 8, padding: 9, fontSize: 12, marginBottom: 8 },
  messagesBox: { minHeight: 100, maxHeight: 300, borderWidth: 1, borderColor: BORDER, borderRadius: 11, backgroundColor: '#FFFFFF', padding: 10, justifyContent: 'center', gap: 9 },
  noMessages: { color: '#6B7280', fontSize: 12, lineHeight: 18, textAlign: 'center', padding: 15 },
  messageBubble: { maxWidth: '88%', borderRadius: 11, borderWidth: 1, padding: 10 },
  buyerMessage: { alignSelf: 'flex-start', backgroundColor: '#F8FAFC', borderColor: '#E5E7EB' },
  sellerMessage: { alignSelf: 'flex-end', backgroundColor: '#FCE7EF', borderColor: '#E9B8C8' },
  messageMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginBottom: 5 },
  messageAuthor: { color: '#1F2937', fontSize: 11, fontWeight: '800' },
  sellerMessageAuthor: { color: PRIMARY },
  messageRole: { color: '#6B7280', fontSize: 9, fontWeight: '700' },
  messageText: { color: '#1F2937', fontSize: 12, lineHeight: 18 },
  messageTime: { color: '#9CA3AF', fontSize: 9, textAlign: 'right', marginTop: 5 },
  quickReplyLabel: { color: '#6B7280', fontSize: 10, fontWeight: '800', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  quickReplies: { gap: 7, paddingBottom: 8 },
  quickReply: { width: 205, borderWidth: 1, borderColor: '#E9B8C8', borderRadius: 9, backgroundColor: '#FFF7FA', padding: 9 },
  quickReplyText: { color: PRIMARY, fontSize: 10, lineHeight: 15 },
  composeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 5 },
  composeInput: { flex: 1, minHeight: 45, maxHeight: 110, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10, color: '#111827', fontSize: 13, textAlignVertical: 'top' },
  sendButton: { height: 44, minWidth: 68, borderRadius: 9, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  sendButtonDisabled: { opacity: 0.55 },
  sendButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  evidenceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  evidenceClose: { position: 'absolute', top: 45, right: 18, zIndex: 1, padding: 8 },
  evidenceImage: { width: '100%', height: '80%' },
});
const styles = themeBaseStyles;
