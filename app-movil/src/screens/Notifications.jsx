import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777';

export default function Notifications({ navigation }) {
  const { resetearNotif } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');
  const [error, setError] = useState(null);

  // Resetear badge al abrir esta pantalla
  useEffect(() => {
    resetearNotif();
  }, []);

  const normalizeNotifications = (items) => {
    const deduped = [];
    const seen = new Set();

    for (const item of Array.isArray(items) ? items : []) {
      const key = [
        item?.tipo || 'notif',
        item?.id_referencia ?? item?.id_sala ?? '',
        item?.titulo || '',
        item?.cuerpo || item?.descripcion || '',
        item?.fecha_creacion || '',
      ].join('::');

      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }

    return deduped;
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const soloNoLeidas = filter === 'no_leidas';
      const res = await getNotifications(soloNoLeidas, 50, 0);
      setNotifications(normalizeNotifications(res.data?.notificaciones || []));
    } catch (e) {
      console.log('Error loading notifications', e.message);
      setError('No se pudo cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (e) {
      console.log('Error marking read', e.message);
      Alert.alert('Error', 'No se pudo marcar la notificación como leída');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (e) {
      console.log('Error marking all read', e.message);
      Alert.alert('Error', 'No se pudo marcar todas como leídas');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      await loadNotifications();
    } catch (e) {
      console.log('Error deleting notification', e.message);
      Alert.alert('Error', 'No se pudo eliminar la notificación');
    }
  };

  const getIcon = (type) => {
    const icons = {
      mensaje: '💬',
      resena: '⭐',
      oferta: '🎉',
      pedido: '📦',
      entrega: '🚚',
      pago: '💳',
      sistema: 'ℹ️',
    };
    return icons[type] || '🔔';
  };

  const handleOpenNotification = async (item) => {
    if (item?.tipo === 'mensaje' && item?.id_referencia) {
      try {
        if (!item.leida) {
          await markNotificationRead(item.id_notificacion);
          resetearNotif();
          await loadNotifications();
        }
      } catch (_) {
        // Continuamos aunque falle la marca como leída
      }

      const nombreTienda = (item.titulo || '').replace(/^Nuevo mensaje de\s+/i, '').trim() || 'Chat';
      navigation.navigate('Chat', {
        id_sala: Number(item.id_referencia),
        nombre_tienda: nombreTienda,
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.leida && styles.cardUnread]}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => handleOpenNotification(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{getIcon(item.tipo)}</Text>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardDate}>{item.fecha_creacion}</Text>
          </View>
        </View>
        <Text style={styles.cardText}>{item.cuerpo || item.descripcion}</Text>
      </TouchableOpacity>
      <View style={styles.actionsRow}>
        {!item.leida && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleMarkRead(item.id_notificacion)}>
            <Text style={styles.actionText}>Marcar leída</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id_notificacion)}>
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.subtitle}>Mantente al día con tus pedidos y mensajes.</Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'todas' && styles.filterBtnActive]}
            onPress={() => setFilter('todas')}
          >
            <Text style={[styles.filterText, filter === 'todas' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'no_leidas' && styles.filterBtnActive]}
            onPress={() => setFilter('no_leidas')}
          >
            <Text style={[styles.filterText, filter === 'no_leidas' && styles.filterTextActive]}>
              No leídas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No hay notificaciones.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id_notificacion)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: TEXT, marginBottom: 6 },
  subtitle: { fontSize: 14, color: MUTED, marginBottom: 18 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterText: { color: MUTED },
  filterTextActive: { color: WHITE, fontWeight: '700' },
  markAllBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  markAllText: { color: PRIMARY, fontWeight: '700' },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardUnread: { borderColor: PRIMARY },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon: { fontSize: 22 },
  cardTitleRow: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  cardDate: { color: MUTED, fontSize: 12, marginTop: 4 },
  cardText: { color: MUTED, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  actionText: { color: WHITE, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#F4EDE2', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  deleteText: { color: '#C5425A', fontWeight: '700' },
  emptyText: { color: MUTED, textAlign: 'center', marginTop: 20 },
  errorText: { color: '#C5425A', textAlign: 'center' },
});