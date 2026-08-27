import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import SidebarMenu from '../components/SidebarMenu';
import SidebarVendedor from '../components/SidebarVendedor';

const PRIMARY = '#7A1E3A';
const WHITE   = '#FFFFFF';
const BG      = '#F5F3EF';
const BORDER  = '#E5E0D8';
const TEXT    = '#1A1A1A';
const MUTED   = '#8A8A8A';

/* ── helpers ── */
const getIcon = (tipo) => ({
  mensaje:  '💬', resena:  '⭐', oferta: '🎉',
  pedido:   '📦', entrega: '🚚', pago:   '💳',
  sistema:  'ℹ️', venta:   '🛒',
}[tipo] ?? '🔔');

// Quita emojis/caracteres raros del título que vienen del backend
const cleanTitle = (titulo = '') =>
  titulo.replace(/^[\s\S]{0,3}?(?=\p{L})/u, '').trim() || titulo.trim();

const fmtFecha = (raw) => {
  if (!raw) return '';
  try {
    const d = new Date(raw.replace(' ', 'T'));
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch { return raw; }
};

export default function Notifications({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const { resetearNotif } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('todas');
  const [error,         setError]         = useState(null);
  const [modalEliminar, setModalEliminar] = useState({ visible: false, id: null });
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => { resetearNotif(); }, []);

  const normalizeNotifications = (items) => {
    const deduped = [];
    const seen = new Set();
    for (const item of Array.isArray(items) ? items : []) {
      const key = [item?.tipo, item?.id_referencia ?? '', item?.titulo ?? '', item?.fecha_creacion ?? ''].join('::');
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    return deduped;
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications(filter === 'no_leidas', 50, 0);
      setNotifications(normalizeNotifications(res.data?.notificaciones || []));
    } catch (e) {
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, [filter]);

  const handleMarkRead = async (id) => {
    try { await markNotificationRead(id); loadNotifications(); } catch {}
  };

  const handleMarkAllRead = async () => {
    try { await markAllNotificationsRead(); loadNotifications(); } catch {}
  };

  const handleDelete = async (id) => {
    try { await deleteNotification(id); loadNotifications(); } catch {}
  };

  const confirmarEliminar = async () => {
    const id = modalEliminar.id;
    setModalEliminar({ visible: false, id: null });
    if (id) { try { await deleteNotification(id); loadNotifications(); } catch {} }
  };
  const handleOpen = async (item) => {
    if (item?.tipo === 'mensaje' && item?.id_referencia) {
      if (!item.leida) { try { await markNotificationRead(item.id_notificacion); resetearNotif(); loadNotifications(); } catch {} }
      const nombreTienda = (item.titulo || '').replace(/^Nuevo mensaje de\s+/i, '').trim() || 'Chat';
      navigation.navigate('Chat', { id_sala: Number(item.id_referencia), nombre_tienda: nombreTienda });
    }
  };

  const noLeidas = notifications.filter(n => !n.leida).length;

  const renderItem = ({ item, index }) => {
    const unread = !item.leida;
    const icon   = getIcon(item.tipo);
    const title  = cleanTitle(item.titulo);

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handleOpen(item)}
        style={[s.card, unread && s.cardUnread, index === 0 && { marginTop: 4 }]}
      >
        {/* Indicador no leída */}
        {unread && <View style={s.unreadDot} />}

        <View style={s.cardInner}>
          {/* Icono */}
          <View style={[s.iconBox, unread && s.iconBoxUnread]}>
            <Text style={s.iconText}>{icon}</Text>
          </View>

          {/* Contenido */}
          <View style={{ flex: 1 }}>
            <View style={s.cardTopRow}>
              <Text style={[s.cardTitle, unread && s.cardTitleUnread]} numberOfLines={1}>{title}</Text>
              <Text style={s.cardDate}>{fmtFecha(item.fecha_creacion)}</Text>
            </View>
            <Text style={s.cardBody} numberOfLines={2}>{item.cuerpo || item.descripcion}</Text>

            {/* Acciones */}
            <View style={s.actions}>
              {unread && (
                <TouchableOpacity style={s.btnRead} onPress={() => handleMarkRead(item.id_notificacion)}>
                  <Text style={s.btnReadText}>✓ Leída</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.btnDelete} onPress={() => setModalEliminar({ visible: true, id: item.id_notificacion })}>
                <Text style={s.btnDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {user?.rol === 'vendedor' && (
        <>
          {/* ── Header vino del vendedor ── */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => setSidebarVisible(true)} style={s.menuBtn}>
              <Text style={s.menuIcon}>☰</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Notificaciones</Text>
              <Text style={s.headerSub}>Mantente al día con tus pedidos y mensajes</Text>
            </View>
            {noLeidas > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadBadgeText}>{noLeidas}</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* ── Body crema ── */}
      <View style={s.body}>
        {/* Filtros */}
        <View style={s.filterRow}>
          {['todas', 'no_leidas'].map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === 'todas' ? 'Todas' : 'No leídas'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.8}>
            <Text style={s.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.centered}><ActivityIndicator size="large" color={PRIMARY} /></View>
        ) : error ? (
          <View style={s.centered}><Text style={s.errorText}>{error}</Text></View>
        ) : notifications.length === 0 ? (
          <View style={s.centered}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
            <Text style={s.emptyTitle}>Sin notificaciones</Text>
            <Text style={s.emptySubtitle}>Cuando tengas actividad aparecerá aquí</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id_notificacion)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* ── Modal confirmar eliminar ── */}
      <Modal
        visible={modalEliminar.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEliminar({ visible: false, id: null })}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalIconBox}>
              <Text style={{ fontSize: 28 }}>🗑️</Text>
            </View>
            <Text style={s.modalTitle}>Eliminar notificación</Text>
            <Text style={s.modalMsg}>¿Estás seguro que quieres eliminar esta notificación?</Text>
            <Text style={s.modalWarning}>Esta acción no se puede deshacer.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={() => setModalEliminar({ visible: false, id: null })}
                activeOpacity={0.8}
              >
                <Text style={s.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnDelete]}
                onPress={confirmarEliminar}
                activeOpacity={0.8}
              >
                <Text style={s.modalBtnDeleteText}>Sí, eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {user?.rol === 'vendedor' ? (
        <SidebarVendedor
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          user={user}
          navigation={navigation}
          onSignOut={signOut}
        />
      ) : (
        <SidebarMenu
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          user={user}
          navigation={navigation}
          onSignOut={signOut}
        />
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PRIMARY },

  /* header */
  header:           { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtn:          { width: 32, justifyContent: 'center', alignItems: 'flex-start' },
  backText:         { color: WHITE, fontSize: 28, fontWeight: '400', lineHeight: 28 },
  menuBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:         { color: WHITE, fontSize: 20, fontWeight: '700' },
  headerTitle:      { fontSize: 20, fontWeight: '900', color: WHITE, letterSpacing: -0.3 },
  headerSub:        { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  unreadBadge:      { backgroundColor: WHITE, borderRadius: 14, minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  unreadBadgeText:  { color: PRIMARY, fontWeight: '900', fontSize: 13 },

  /* body */
  body:   { flex: 1, backgroundColor: PRIMARY, borderTopLeftRadius: 28, borderTopRightRadius: 28 },

  /* filtros */
  filterRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10, gap: 8 },
  filterBtn:       { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  filterBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterText:      { fontSize: 13, fontWeight: '600', color: MUTED },
  filterTextActive:{ color: WHITE, fontWeight: '700' },
  markAllBtn:      { marginLeft: 'auto', paddingVertical: 7, paddingHorizontal: 10 },
  markAllText:     { color: WHITE, fontWeight: '700', fontSize: 13 },

  /* card */
  card:        { backgroundColor: WHITE, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardUnread:  { borderColor: PRIMARY, borderWidth: 1.5 },
  unreadDot:   { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  cardInner:   { flexDirection: 'row', padding: 14, gap: 12 },

  /* icono */
  iconBox:       { width: 44, height: 44, borderRadius: 22, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  iconBoxUnread: { backgroundColor: '#FDF0F3' },
  iconText:      { fontSize: 20 },

  /* texto */
  cardTopRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 },
  cardTitle:           { fontSize: 14, fontWeight: '700', color: TEXT, flex: 1 },
  cardTitleUnread:     { color: PRIMARY },
  cardDate:            { fontSize: 10, color: MUTED, marginTop: 2, flexShrink: 0 },
  cardBody:            { fontSize: 13, color: MUTED, lineHeight: 18, marginBottom: 10 },

  /* acciones */
  actions:        { flexDirection: 'row', gap: 8 },
  btnRead:        { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#DCFCE7' },
  btnReadText:    { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  btnDelete:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#FEE2E2' },
  btnDeleteText:  { fontSize: 12, fontWeight: '700', color: '#DC2626' },

  /* estados */
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: WHITE, marginBottom: 6 },
  emptySubtitle:{ fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  errorText:    { color: '#FFD7DF', textAlign: 'center', fontSize: 13 },

  /* modal eliminar */
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  modalBox:          { backgroundColor: WHITE, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  modalIconBox:      { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle:        { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 10 },
  modalMsg:          { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22 },
  modalWarning:      { fontSize: 12, color: '#DC2626', fontWeight: '600', marginTop: 8, marginBottom: 24 },
  modalBtns:         { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn:          { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  modalBtnCancel:    { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: BORDER },
  modalBtnCancelText:{ fontSize: 14, fontWeight: '700', color: '#444' },
  modalBtnDelete:    { backgroundColor: '#DC2626' },
  modalBtnDeleteText:{ fontSize: 14, fontWeight: '800', color: WHITE },
});
