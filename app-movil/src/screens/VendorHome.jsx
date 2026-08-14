// src/screens/VendorHome.jsx
import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { getSalasUsuario } from '../services/api';
import { useChatSocket } from '../context/ChatSocketContext';

const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const WHITE = '#FFFFFF';
const BORDER = '#E5DED3';
const TEXT_MUTED = '#8A8A8A';

const SECTIONS = [
  { key: 'libros', label: 'Mis Libros', icon: '📚', route: 'Libreria', comingSoon: false },
  { key: 'publicar', label: 'Publicar Libro', icon: '➕', route: 'PublicarLibro', comingSoon: false },
  { key: 'promociones', label: 'Promociones', icon: '🏷️', route: 'Promociones', comingSoon: true },
  { key: 'ventas', label: 'Ventas', icon: '🛒', route: 'Ventas', comingSoon: true },
  { key: 'pedidos', label: 'Pedidos', icon: '📦', route: 'MiTienda', comingSoon: false },
  { key: 'notificaciones', label: 'Notificaciones', icon: '🔔', route: 'Notifications', comingSoon: false },
  { key: 'perfil', label: 'Perfil', icon: '👤', route: 'PerfilTienda', comingSoon: false },
  { key: 'configuracion', label: 'Configuración', icon: '⚙️', route: 'ConfiguracionTienda', comingSoon: false },
];

export default function VendorHome() {
  const { user, signOut } = useContext(AuthContext);
  const navigation = useNavigation();

// dentro del componente:
const { salas, loadingSalas, recargarSalas } = useChatSocket();
const [refreshing, setRefreshing] = useState(false);

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

const totalNoLeidos = salas.reduce((acc, s) => acc + (s.no_leidos || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.storeName}>{user?.nombre_tienda || 'Mi Tienda'}</Text>
          <Text style={styles.title}>Panel de ventas</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
      >
        <Text style={styles.greeting}>Hola, {user?.nombre || 'vendedor'} 👋</Text>

        <View style={styles.grid}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.key}
              style={[styles.card, section.comingSoon && styles.cardDisabled]}
              activeOpacity={section.comingSoon ? 1 : 0.7}
              onPress={() => {
                if (!section.comingSoon) {
                  if (section.route === 'PerfilTienda') {
                    navigation.navigate(section.route, { id_tienda: user?.id_tienda });
                  } else {
                    navigation.navigate(section.route);
                  }
                }
              }}
            >
              <Text style={styles.cardIcon}>{section.icon}</Text>
              <Text style={styles.cardLabel}>{section.label}</Text>
              {section.comingSoon && <Text style={styles.cardSoon}>Próximamente</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.messagesBlock}>
          <View style={styles.messagesHeader}>
            <Text style={styles.messagesTitle}>Mensajes</Text>
            {totalNoLeidos > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalNoLeidos}</Text>
              </View>
            )}
          </View>

          {loadingSalas ? (
            <ActivityIndicator color={PRIMARY} style={{ marginVertical: 24 }} />
          ) : salas.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aún no tienes conversaciones</Text>
              <Text style={styles.emptySubtitle}>No has recibido mensajes de clientes todavía.</Text>
            </View>
          ) : (
            salas.map((sala) => (
              <TouchableOpacity
                key={sala.id_sala}
                style={styles.salaItem}
                onPress={() => abrirSala(sala)}
              >
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(sala.nombre_otro_usuario || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.salaNombre} numberOfLines={1}>
                    {sala.nombre_comprador || 'Comprador'}
                  </Text>
                  <Text style={styles.salaUltimoMensaje} numberOfLines={1}>
                    {sala.ultimo_mensaje || 'Sin mensajes'}
                  </Text>
                </View>
                {sala.no_leidos > 0 && <View style={styles.dot} />}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#7A1E3A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  storeName: { color: WHITE, fontSize: 18, fontWeight: '800' },
  title: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  signOutText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  greeting: { fontSize: 18, fontWeight: '700', color: WHITE, marginBottom: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardDisabled: { opacity: 1 },
  cardIcon: { fontSize: 22, marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  cardSoon: { fontSize: 10, color: TEXT_MUTED, marginTop: 4 },

  messagesBlock: {
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  messagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  messagesTitle: { fontSize: 16, fontWeight: '800', color: PRIMARY },
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

  emptyState: { paddingVertical: 32, paddingHorizontal: 16, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: TEXT_MUTED, textAlign: 'center' },

  salaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: WHITE, fontWeight: '700' },
  salaNombre: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  salaUltimoMensaje: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY, marginLeft: 8 },
});