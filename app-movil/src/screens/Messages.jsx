// src/screens/Messages.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconChevronRight } from '../components/Icons';
import { useChatSocket } from '../context/ChatSocketContext';
const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const WHITE = '#FFFFFF';
const BORDER = '#E5DED3';
const TEXT_MUTED = '#8A8A8A';

export default function Messages() {
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const { salas, loadingSalas, recargarSalas } = useChatSocket();
  const onRefresh = () => {
    setRefreshing(true);
    recargarSalas().finally(() => setRefreshing(false));
  };

  const abrirSala = (sala) => {
    navigation.navigate('Chat', {
      id_sala: sala.id_sala,
      nombre_tienda: sala.nombre_tienda,
    });
  };

  const renderSala = ({ item: sala }) => (
    <TouchableOpacity style={styles.salaItem} onPress={() => abrirSala(sala)} activeOpacity={0.7}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {(sala.nombre_tienda || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.salaNombre} numberOfLines={1}>
          {sala.nombre_tienda || 'Tienda'}
        </Text>
        <Text style={styles.salaUltimoMensaje} numberOfLines={1}>
          {sala.ultimo_mensaje || 'Sin mensajes'}
        </Text>
      </View>
      {sala.no_leidos > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{sala.no_leidos}</Text>
        </View>
      )}
      <IconChevronRight size={18} color={TEXT_MUTED} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={{ width: 32 }} />
      </View>

      {loadingSalas ? (
        <View style={styles.centered}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : salas.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Aún no tienes conversaciones</Text>
          <Text style={styles.emptySubtitle}>
            Escríbele a una librería desde la página de un libro para empezar a chatear.
          </Text>
        </View>
      ) : (
        <FlatList
          data={salas}
          keyExtractor={(item) => String(item.id_sala)}
          renderItem={renderSala}
          contentContainerStyle={{ paddingVertical: 4 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#7A1E3A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { width: 32, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: WHITE, fontSize: 28, fontWeight: '400', lineHeight: 28 },
  headerTitle: { color: WHITE, fontSize: 17, fontWeight: '800' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center' },

  salaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 10,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: WHITE, fontWeight: '700', fontSize: 16 },
  salaNombre: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  salaUltimoMensaje: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  badge: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: WHITE, fontSize: 11, fontWeight: '700' },
});