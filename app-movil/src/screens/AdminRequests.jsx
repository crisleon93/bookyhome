import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiBaseUrl, getMensajesSolicitudAdmin, enviarMensajeSolicitudAdmin, resolverSolicitudAdmin } from '../services/api';
import { IconAlertTriangle, IconCheck, IconMessage, IconTool } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const GRAY = '#666';
const STATES = ['Todos', 'Abierto', 'En revisión', 'Resuelto', 'Rechazado'];

const stateStyle = (state) => {
  const key = (state || '').toLowerCase();
  if (key === 'resuelto') return { bg: '#DCFCE7', color: '#166534' };
  if (key === 'rechazado') return { bg: '#FEF2F2', color: '#B91C1C' };
  if (key.includes('revision')) return { bg: '#FFF7ED', color: '#C2410C' };
  return { bg: '#EFF6FF', color: '#1D4ED8' };
};

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

function ActionButton({ label, color, backgroundColor, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor, borderColor: color }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminRequests({ type, solicitudes = [], loading, refreshing, error, onRefresh }) {
  const isSupport = type === 'soporte';
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [roleFilter, setRoleFilter] = useState('comprador');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const sectionItems = useMemo(() => {
    const requestType = (item) => (item.tipo_solicitud || '').toLowerCase();
    const q = query.trim().toLowerCase();
    return solicitudes
      .filter((item) => requestType(item) === (isSupport ? 'soporte' : 'reclamo'))
      .filter((item) => !isSupport || (item.rol_usuario || 'comprador').toLowerCase() === roleFilter)
      .filter((item) => stateFilter === 'Todos' || item.estado === stateFilter || (stateFilter === 'En revisión' && item.estado === 'En revision'))
      .filter((item) => !q || [
        item.comprador, item.nombre_tienda, item.asunto, item.descripcion,
        item.id_solicitud, item.id_orden, item.titulo_libro,
      ].some((value) => String(value || '').toLowerCase().includes(q)));
  }, [solicitudes, isSupport, roleFilter, stateFilter, query]);

  const updateRequest = async () => {
    if (!resolution?.item) return;
    if (answer.trim().length < 3) {
      Alert.alert('Respuesta requerida', 'Escribe al menos 3 caracteres para actualizar y notificar la solicitud.');
      return;
    }
    setSaving(true);
    try {
      await resolverSolicitudAdmin(resolution.item.id_solicitud, resolution.state, answer.trim());
      setResolution(null);
      setAnswer('');
      Alert.alert('Actualizado', 'La solicitud se actualizó y el usuario fue notificado.');
      await onRefresh?.();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo actualizar la solicitud.');
    } finally {
      setSaving(false);
    }
  };

  const openChat = async (item) => {
    setSelected(item);
    setChatMessages([]);
    setChatText('');
    setChatLoading(true);
    try {
      const response = await getMensajesSolicitudAdmin(item.id_solicitud);
      setChatMessages(response.data || []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo cargar la conversación.');
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatText.trim() || !selected || sending) return;
    setSending(true);
    try {
      await enviarMensajeSolicitudAdmin(selected.id_solicitud, chatText.trim());
      setChatText('');
      const response = await getMensajesSolicitudAdmin(selected.id_solicitud);
      setChatMessages(response.data || []);
      await onRefresh?.();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const status = stateStyle(item.estado);
    const imagePath = item.evidencia_url || item.imagen_libro;
    const imageUri = imagePath
      ? String(imagePath).startsWith('http') ? imagePath : `${getApiBaseUrl()}/${String(imagePath).replace(/^\/+/, '')}`
      : null;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.idTag}>
            {isSupport ? <IconTool size={14} color={PRIMARY} /> : <IconAlertTriangle size={14} color={PRIMARY} />}
            <Text style={styles.idText}>#{item.numero || item.id_solicitud}</Text>
          </View>
          <Text style={[styles.status, { backgroundColor: status.bg, color: status.color }]}>
            {item.estado || 'Abierto'}
          </Text>
        </View>
        <Text style={styles.title}>{item.asunto || (isSupport ? 'Solicitud de soporte' : 'Queja o reclamo')}</Text>
        <Text style={styles.body} numberOfLines={3}>{item.descripcion || 'Sin descripción.'}</Text>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.evidence} resizeMode="cover" /> : null}
        <View style={styles.metadata}>
          <Text style={styles.metaText}>{item.comprador || 'Usuario'} · {(item.rol_usuario || 'comprador').toLowerCase()}</Text>
          <Text style={styles.metaText}>{formatDate(item.fecha_creacion)}</Text>
          {item.nombre_tienda ? <Text style={styles.metaText}>Tienda: {item.nombre_tienda}</Text> : null}
          {item.id_orden ? <Text style={styles.metaText}>Orden #{item.id_orden}</Text> : null}
        </View>
        {item.respuesta ? (
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>Respuesta del administrador</Text>
            <Text style={styles.answerText}>{item.respuesta}</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          {!isSupport && (
            <ActionButton label="Conversación" color={PRIMARY} backgroundColor="#FDF2F4" onPress={() => openChat(item)} />
          )}
          <ActionButton label="En revisión" color="#C2410C" backgroundColor="#FFF7ED" onPress={() => { setResolution({ item, state: 'En revisión' }); setAnswer(item.respuesta || ''); }} />
          <ActionButton label="Rechazar" color="#B91C1C" backgroundColor="#FEF2F2" onPress={() => { setResolution({ item, state: 'Rechazado' }); setAnswer(item.respuesta || ''); }} />
          <ActionButton label="Resolver" color="#166534" backgroundColor="#DCFCE7" onPress={() => { setResolution({ item, state: 'Resuelto' }); setAnswer(item.respuesta || ''); }} />
        </View>
      </View>
    );
  };

  const counts = useMemo(() => ({
    total: solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo')).length,
    open: solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo') && item.estado === 'Abierto').length,
    review: solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo') && ['En revisión', 'En revision'].includes(item.estado)).length,
    resolved: solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo') && item.estado === 'Resuelto').length,
  }), [solicitudes, isSupport]);

  return (
    <View style={styles.container}>
      <FlatList
        data={sectionItems}
        keyExtractor={(item) => String(item.id_solicitud)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[PRIMARY]} tintColor={PRIMARY} />}
        ListHeaderComponent={
          <View>
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
                  <Text style={styles.retryText}>{refreshing ? 'Cargando...' : 'Reintentar'}</Text>
                </TouchableOpacity>
              </View>
            )}
            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.loadingText}>Cargando solicitudes...</Text>
              </View>
            )}
            <View style={styles.statsRow}>
              {[
                ['Total', counts.total, PRIMARY],
                ['Abiertos', counts.open, '#1D4ED8'],
                ['En revisión', counts.review, '#C2410C'],
                ['Resueltos', counts.resolved, '#166534'],
              ].map(([label, value, color]) => (
                <View key={label} style={styles.stat}>
                  <Text style={[styles.statValue, { color }]}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
            {isSupport && (
              <View style={styles.filters}>
                {['comprador', 'vendedor'].map((role) => (
                  <TouchableOpacity key={role} onPress={() => setRoleFilter(role)} style={[styles.filterPill, roleFilter === role && styles.filterPillActive]}>
                    <Text style={[styles.filterText, roleFilter === role && styles.filterTextActive]}>
                      {role === 'comprador' ? 'Compradores' : 'Vendedores'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              style={styles.search}
              placeholder="Buscar por usuario, solicitud, tienda u orden..."
              placeholderTextColor="#8A8A8A"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {STATES.map((state) => (
                <TouchableOpacity key={state} onPress={() => setStateFilter(state)} style={[styles.filterPill, stateFilter === state && styles.filterPillActive]}>
                  <Text style={[styles.filterText, stateFilter === state && styles.filterTextActive]}>{state}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.resultCount}>{sectionItems.length} solicitud(es)</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No hay solicitudes que coincidan con los filtros.</Text>}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={!!resolution} transparent animationType="fade" onRequestClose={() => !saving && setResolution(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {resolution?.state === 'Resuelto' ? 'Resolver solicitud' : `${resolution?.state || ''} solicitud`}
            </Text>
            <Text style={styles.modalHint}>Escribe la respuesta que recibirá el usuario.</Text>
            <TextInput
              style={styles.answerInput}
              multiline
              maxLength={1000}
              value={answer}
              onChangeText={setAnswer}
              placeholder="Respuesta (mínimo 3 caracteres)"
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <ActionButton label="Cancelar" color={GRAY} backgroundColor="#F3F4F6" disabled={saving} onPress={() => setResolution(null)} />
              <TouchableOpacity style={[styles.confirmButton, saving && styles.disabled]} onPress={updateRequest} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Guardar y notificar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.chatPage}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.closeText}>Cerrar</Text></TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatTitle}>Conversación #{selected?.id_solicitud}</Text>
              <Text style={styles.metaText}>{selected?.comprador || 'Comprador'}{selected?.nombre_tienda ? ` · ${selected.nombre_tienda}` : ''}</Text>
            </View>
          </View>
          {chatLoading ? <ActivityIndicator style={{ marginTop: 24 }} color={PRIMARY} /> : (
            <FlatList
              data={chatMessages}
              keyExtractor={(message, index) => String(message.id_mensaje || index)}
              contentContainerStyle={styles.chatList}
              ListEmptyComponent={<Text style={styles.empty}>Aún no hay mensajes en esta conversación.</Text>}
              renderItem={({ item }) => (
                <View style={styles.message}>
                  <Text style={styles.messageAuthor}>{item.nombre_usuario || item.rol || 'Usuario'}</Text>
                  <Text style={styles.messageText}>{item.mensaje}</Text>
                  <Text style={styles.messageDate}>{formatDate(item.fecha_creacion)}</Text>
                </View>
              )}
            />
          )}
          <View style={styles.chatComposer}>
            <TextInput style={styles.chatInput} value={chatText} onChangeText={setChatText} placeholder="Escribe un mensaje..." multiline />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending || !chatText.trim()}>
              {sending ? <ActivityIndicator color="#fff" /> : <IconMessage size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  list: { padding: 14, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  stat: { flexGrow: 1, flexBasis: '22%', minWidth: 72, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 10 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: GRAY, marginTop: 3, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  filterPill: { borderWidth: 1, borderColor: BORDER, backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  filterPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterText: { color: GRAY, fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: '#fff' },
  search: { backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10, fontSize: 13, color: '#222', marginBottom: 10 },
  resultCount: { color: GRAY, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  errorBox: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#991B1B', fontSize: 12, lineHeight: 18 },
  retryText: { color: PRIMARY, fontSize: 12, fontWeight: '800', marginTop: 7 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderRadius: 10, padding: 11, marginBottom: 10 },
  loadingText: { color: GRAY, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: BORDER, padding: 15, marginBottom: 12, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  idTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  idText: { fontSize: 12, color: PRIMARY, fontWeight: '800' },
  status: { overflow: 'hidden', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: '800' },
  title: { color: '#222', fontSize: 16, fontWeight: '800', marginBottom: 5 },
  body: { color: '#4B5563', fontSize: 13, lineHeight: 19 },
  evidence: { height: 170, borderRadius: 10, marginTop: 10, backgroundColor: '#F3F4F6' },
  metadata: { gap: 4, marginTop: 12 },
  metaText: { color: GRAY, fontSize: 11 },
  answerBox: { backgroundColor: '#F9FAFB', borderRadius: 9, padding: 10, marginTop: 10, borderLeftWidth: 3, borderLeftColor: PRIMARY },
  answerLabel: { color: PRIMARY, fontWeight: '800', fontSize: 11, marginBottom: 4 },
  answerText: { color: '#374151', fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  actionButton: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  actionText: { fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  empty: { color: GRAY, textAlign: 'center', paddingVertical: 36, fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#222' },
  modalHint: { fontSize: 13, color: GRAY, marginVertical: 8 },
  answerInput: { minHeight: 110, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 12, color: '#222' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 14 },
  confirmButton: { backgroundColor: PRIMARY, minHeight: 38, justifyContent: 'center', borderRadius: 9, paddingHorizontal: 12 },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chatPage: { flex: 1, backgroundColor: BG, paddingTop: 24 },
  chatHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  closeText: { color: PRIMARY, fontSize: 13, fontWeight: '800' },
  chatTitle: { color: '#222', fontSize: 16, fontWeight: '800' },
  chatList: { padding: 14, flexGrow: 1 },
  message: { alignSelf: 'flex-start', maxWidth: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 11, marginBottom: 9, borderWidth: 1, borderColor: BORDER },
  messageAuthor: { fontSize: 11, color: PRIMARY, fontWeight: '800', marginBottom: 4 },
  messageText: { color: '#333', fontSize: 13, lineHeight: 18 },
  messageDate: { color: '#888', fontSize: 10, marginTop: 5, textAlign: 'right' },
  chatComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: BORDER },
  chatInput: { flex: 1, maxHeight: 100, borderWidth: 1, borderColor: BORDER, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, color: '#222' },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY },
});
