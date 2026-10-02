// src/screens/Messages.jsx
import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { IconChevronRight, IconMenu, IconSearch, IconMessage } from '../components/Icons';
import SidebarMenu from '../components/SidebarMenu';
import SidebarVendedor from '../components/SidebarVendedor';
import { useChatSocket } from '../context/ChatSocketContext';
import { AuthContext } from '../context/AuthContext';

const PRIMARY = '#7A1E3A';
const PRIMARY_DARK = '#4E1022';
const BG = '#F9F6F1';
const SOFT = '#F4EEF0';
const WHITE = '#FFFFFF';
const BORDER = '#EADFE5';
const TEXT_MUTED = '#6B5B63';
const TEXT = '#1A1A1A';
const MUTED_PANEL = '#EEE6E1';

const formatHoraSala = (fechaStr) => {
  if (!fechaStr) return '';

  const date = new Date(fechaStr.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';

  const hoy = new Date();
  const mismoDia =
    date.getFullYear() === hoy.getFullYear() &&
    date.getMonth() === hoy.getMonth() &&
    date.getDate() === hoy.getDate();

  if (mismoDia) {
    return date.toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const esAyer =
    date.getFullYear() === ayer.getFullYear() &&
    date.getMonth() === ayer.getMonth() &&
    date.getDate() === ayer.getDate();

  if (esAyer) return 'Ayer';

  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });
};

export default function Messages() {
  const navigation = useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [bannerVisible, setBannerVisible] = useState(true);
  const { salas, loadingSalas, recargarSalas } = useChatSocket();

  const activarNotificaciones = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setBannerVisible(false);
        return;
      }
      Alert.alert('Permisos necesarios', 'Activa las notificaciones para recibir avisos de mensajes.');
    } catch (e) {
      Alert.alert('No se pudo activar', 'Inténtalo de nuevo desde Ajustes.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    recargarSalas().finally(() => setRefreshing(false));
  };

  const salasFiltradas = useMemo(() => {
    const lista = (salas || []).filter((sala) => {
      const esMiSala = Number(sala.id_usuario) === Number(user?.sub);
      const nombreMostrar = esMiSala
        ? (sala.nombre_tienda || 'Tienda')
        : (sala.nombre_comprador || 'Comprador');

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const textoSala = `${nombreMostrar} ${sala.ultimo_mensaje || ''}`.toLowerCase();
        if (!textoSala.includes(q)) return false;
      }

      if (filtroActivo === 'no_leidos') {
        return Number(sala.no_leidos || 0) > 0;
      }

      if (filtroActivo === 'librerias') {
        return true;
      }

      return true;
    });

    return lista.sort((a, b) => {
      const aFecha = a.fecha_ultimo_mensaje || a.ultimo_mensaje_fecha || a.actualizado_en || '';
      const bFecha = b.fecha_ultimo_mensaje || b.ultimo_mensaje_fecha || b.actualizado_en || '';
      return new Date(bFecha).getTime() - new Date(aFecha).getTime();
    });
  }, [salas, busqueda, filtroActivo, user?.sub]);

  const abrirSala = (sala) => {
    navigation.navigate('Chat', {
      id_sala: sala.id_sala,
      nombre_tienda: sala.nombre_tienda,
      nombre_comprador: sala.nombre_comprador,
      telefono_contacto: Number(sala.id_usuario) === Number(user?.sub)
        ? sala.telefono_tienda
        : sala.telefono_comprador,
    });
  };

  const renderSala = ({ item: sala }) => {
    const esMiSala = Number(sala.id_usuario) === Number(user?.sub);
    const nombreMostrar = esMiSala
      ? (sala.nombre_tienda || 'Tienda')
      : (sala.nombre_comprador || 'Comprador');
    const inicial = (nombreMostrar || 'T').charAt(0).toUpperCase();
    const ultimoMensaje = sala.ultimo_mensaje || 'Sin mensajes';
    const hora = formatHoraSala(sala.fecha_ultimo_mensaje || sala.ultimo_mensaje_fecha || sala.actualizado_en);
    const noLeidos = Number(sala.no_leidos || 0);

    return (
      <TouchableOpacity style={styles.salaItem} onPress={() => abrirSala(sala)} activeOpacity={0.8}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{inicial}</Text>
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.rowTop}>
            <Text style={styles.salaNombre} numberOfLines={1}>{nombreMostrar}</Text>
            {hora ? <Text style={styles.salaHora}>{hora}</Text> : null}
          </View>

          <View style={styles.rowBottom}>
            <Text style={styles.salaUltimoMensaje} numberOfLines={1}>{ultimoMensaje}</Text>
            {noLeidos > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{noLeidos}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <IconChevronRight size={18} color={TEXT_MUTED} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Abrir menú"
          accessibilityRole="button"
          hitSlop={8}
        >
          <IconMenu size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Mensajes</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.searchWrap}>
          <IconSearch size={18} color={PRIMARY} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar un chat o iniciar uno nuevo"
            placeholderTextColor={TEXT_MUTED}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterRow}>
          {['todos', 'no_leidos', 'librerias'].map((filtro) => {
            const labels = {
              todos: 'Todos',
              no_leidos: 'No leídos',
              librerias: 'Librerías',
            };

            const active = filtroActivo === filtro;
            return (
              <TouchableOpacity
                key={filtro}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFiltroActivo(filtro)}
                activeOpacity={0.9}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{labels[filtro]}</Text>
                {filtro === 'no_leidos' && salas.some((s) => Number(s.no_leidos || 0) > 0) ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {salas.reduce((acc, s) => acc + Number(s.no_leidos || 0), 0)}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.plusChip}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Catalogo')}
            accessibilityLabel="Explorar librerías en el catálogo"
          >
            <Text style={styles.plusChipText}>+</Text>
          </TouchableOpacity>
        </View>

        {bannerVisible && (
          <View style={styles.noticeBanner}>
            <View style={styles.noticeIconWrap}>
              <IconMessage size={18} color={WHITE} />
            </View>
            <Text style={styles.noticeText}>
              Las notificaciones para tu móvil están desactivadas.
            </Text>
            <TouchableOpacity onPress={activarNotificaciones} style={styles.activateBtn}>
              <Text style={styles.activateBtnText}>Activar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBannerVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {loadingSalas ? (
          <View style={styles.centered}>
            <ActivityIndicator color={PRIMARY} size="small" />
          </View>
        ) : salasFiltradas.length === 0 ? (
          <View style={styles.centeredEmpty}>
            <Text style={styles.emptyTitle}>No tienes conversaciones</Text>
            <Text style={styles.emptySubtitle}>Inicia una conversación con una tienda</Text>
          </View>
        ) : (
          <FlatList
            data={salasFiltradas}
            keyExtractor={(item) => String(item.id_sala)}
            renderItem={renderSala}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      {user?.rol === 'vendedor' ? (
        <SidebarVendedor
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          user={user}
          navigation={navigation}
          onSignOut={signOut}
        />
      ) : (
        <SidebarMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          user={user}
          navigation={navigation}
          onSignOut={signOut}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F1EF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  topTitle: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  panel: {
    flex: 1,
    backgroundColor: '#F2F0EE',
    paddingTop: 16,
  },
  searchWrap: {
    marginHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D9D4',
    backgroundColor: '#F7F3F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#2B1D20',
    fontSize: 14,
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6EDEC',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E5D9D4',
  },
  filterChipActive: {
    backgroundColor: '#F4E7EA',
    borderColor: '#CBA7B4',
  },
  filterText: {
    color: PRIMARY_DARK,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: PRIMARY,
  },
  filterBadge: {
    marginLeft: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '700',
  },
  plusChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFE2E5',
    borderWidth: 1,
    borderColor: '#D9B9C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusChipText: {
    color: PRIMARY,
    fontSize: 24,
    fontWeight: '700',
    marginTop: -3,
  },
  noticeBanner: {
    backgroundColor: '#E7D5D9',
    marginHorizontal: 14,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C59BA7',
  },
  noticeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY_DARK,
    fontWeight: '600',
    lineHeight: 18,
  },
  noticeLink: {
    color: PRIMARY,
    fontWeight: '700',
  },
  activateBtn: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activateBtnText: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 13,
  },
  closeBtn: {
    marginLeft: 4,
    paddingHorizontal: 6,
  },
  closeBtnText: {
    color: PRIMARY_DARK,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 22,
  },
  salaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EADFE5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
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
  avatarText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '700',
  },
  contentWrap: {
    flex: 1,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  salaNombre: {
    flex: 1,
    color: '#1E1A1B',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  salaHora: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '600',
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  salaUltimoMensaje: {
    flex: 1,
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  centeredEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyTitle: {
    color: PRIMARY_DARK,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: TEXT_MUTED,
    fontSize: 13,
    textAlign: 'center',
  },
});