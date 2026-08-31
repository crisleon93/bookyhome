import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TextInput, Platform,
  Modal, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useChatSocket } from '../context/ChatSocketContext';
import { AuthContext } from '../context/AuthContext';
import SidebarMenu from '../components/SidebarMenu';
import SidebarVendedor from '../components/SidebarVendedor';
import { IconSearch, IconMessage } from '../components/Icons';
import { chatService } from '../services/chat';

// ── Paleta ────────────────────────────────────────────────────────────────────
const PRIMARY  = '#7A1E3A';
const BG       = '#FAF8F5';
const WHITE    = '#FFFFFF';
const BORDER   = '#E5DED3';
const TEXT     = '#1A1A1A';
const MUTED    = '#8A8A8A';

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#7A1E3A','#1e4d8a','#1e7a45','#7a5c00','#5a1e7a','#1e6a7a','#8a1e1e'];
const avatarColor = (n = '') => AVATAR_COLORS[(n.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const getIniciales = (n = '') =>
  n.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');

// ── Formato hora de sala (igual que la web) ───────────────────────────────────
const formatHoraSala = (fechaStr) => {
  if (!fechaStr) return '';
  const d    = new Date(fechaStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  const hoy  = new Date();
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();
  if (same(d, hoy))  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  if (same(d, ayer)) return 'Ayer';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function Messages() {
  const navigation = useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [busqueda, setBusqueda]   = useState('');
  const [filtro,   setFiltro]     = useState('todos'); // 'todos' | 'no_leidos' | 'favoritos'
  const [refreshing, setRefreshing] = useState(false);
  const { salas: salasCtx, loadingSalas, recargarSalas } = useChatSocket();

  // Estado local extendido de salas (fijadas, silenciadas, favoritas, archivadas)
  const [fijadas,     setFijadas]     = useState([]);
  const [silenciadas, setSilenciadas] = useState([]);
  const [favoritas,   setFavoritas]   = useState([]);
  const [archivadas,  setArchivadas]  = useState([]);
  // No leídos locales (para toggle marcar leído/no leído)
  const [noLeidosLocal, setNoLeidosLocal] = useState({});

  // Menú contextual de sala
  const [menuSala, setMenuSala]   = useState({ visible: false, sala: null });
  const touchTimerRef = useRef(null);

  const onRefresh = () => {
    setRefreshing(true);
    recargarSalas().finally(() => setRefreshing(false));
  };

  const abrirSala = (sala) => {
    // Limpiar no leídos locales al abrir
    setNoLeidosLocal(prev => ({ ...prev, [sala.id_sala]: 0 }));
    navigation.navigate('Chat', {
      id_sala:          sala.id_sala,
      nombre_tienda:    sala.nombre_tienda,
      nombre_comprador: sala.nombre_comprador,
    });
  };

  // ── Nombre a mostrar (igual que la web) ───────────────────────────────────
  const nombreMostrar = (sala) => {
    if (!sala) return '';
    const esVendedor = user?.rol === 'vendedor';
    if (esVendedor) {
      const rolC = (sala.rol_comprador || '').toLowerCase();
      if (rolC === 'admin' || rolC === 'administrador') {
        return `🛡️ ${sala.nombre_comprador || 'Administración BookyHome'}`;
      }
      return sala.nombre_comprador || sala.nombre_cliente || sala.nombre_usuario || 'Comprador';
    }
    return sala.nombre_tienda || sala.nombre_libreria || sala.nombre_vendedor || 'Tienda / Vendedor';
  };

  // ── No leídos efectivos (local override) ─────────────────────────────────
  const getNoLeidos = (sala) => {
    if (!sala) return 0;
    if (noLeidosLocal[sala.id_sala] !== undefined) return noLeidosLocal[sala.id_sala];
    return sala.no_leidos || 0;
  };

  // ── Acciones del menú contextual ─────────────────────────────────────────
  const toggleFijar = (idSala) => {
    setFijadas(prev =>
      prev.includes(idSala) ? prev.filter(id => id !== idSala) : [...prev, idSala]
    );
    setMenuSala({ visible: false, sala: null });
  };

  const toggleSilenciar = (idSala) => {
    setSilenciadas(prev =>
      prev.includes(idSala) ? prev.filter(id => id !== idSala) : [...prev, idSala]
    );
    setMenuSala({ visible: false, sala: null });
  };

  const toggleFavorito = (idSala) => {
    setFavoritas(prev =>
      prev.includes(idSala) ? prev.filter(id => id !== idSala) : [...prev, idSala]
    );
    setMenuSala({ visible: false, sala: null });
  };

  const toggleArchivar = (idSala) => {
    setArchivadas(prev =>
      prev.includes(idSala) ? prev.filter(id => id !== idSala) : [...prev, idSala]
    );
    setMenuSala({ visible: false, sala: null });
  };

  const toggleMarcarLeido = (sala) => {
    const curr = getNoLeidos(sala);
    setNoLeidosLocal(prev => ({ ...prev, [sala.id_sala]: curr > 0 ? 0 : 1 }));
    setMenuSala({ visible: false, sala: null });
  };

  const vaciarChat = async (sala) => {
    setMenuSala({ visible: false, sala: null });
    Alert.alert('Vaciar chat', `¿Vaciar todos los mensajes con ${nombreMostrar(sala)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: async () => {
        try { await chatService.vaciarChat(sala.id_sala); } catch {}
      }},
    ]);
  };

  const eliminarChat = async (sala) => {
    setMenuSala({ visible: false, sala: null });
    Alert.alert('Eliminar conversación', `¿Eliminar la conversación con ${nombreMostrar(sala)}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await chatService.eliminarSala(sala.id_sala);
          await recargarSalas();
          setFijadas(prev => prev.filter(id => id !== sala.id_sala));
          setSilenciadas(prev => prev.filter(id => id !== sala.id_sala));
          setFavoritas(prev => prev.filter(id => id !== sala.id_sala));
          setArchivadas(prev => prev.filter(id => id !== sala.id_sala));
        } catch {}
      }},
    ]);
  };

  // ── Long press en sala ────────────────────────────────────────────────────
  const onLongPressSala = (sala) => {
    setMenuSala({ visible: true, sala });
  };

  // ── Filtrar y ordenar salas (igual que la web) ────────────────────────────
  const salasFiltradas = salasCtx
    .filter((sala) => {
      // Ocultar archivadas excepto si filtro es archivadas
      if (archivadas.includes(sala.id_sala)) return false;
      // Búsqueda
      if (busqueda.trim()) {
        const nombre = nombreMostrar(sala).toLowerCase();
        const ultimo = (sala.ultimo_mensaje || '').toLowerCase();
        if (!nombre.includes(busqueda.toLowerCase()) && !ultimo.includes(busqueda.toLowerCase())) {
          return false;
        }
      }
      // Filtros
      if (filtro === 'no_leidos')  return getNoLeidos(sala) > 0;
      if (filtro === 'favoritos')  return favoritas.includes(sala.id_sala);
      return true;
    })
    .sort((a, b) => {
      // Fijadas primero
      const aF = fijadas.includes(a.id_sala) ? 1 : 0;
      const bF = fijadas.includes(b.id_sala) ? 1 : 0;
      return bF - aF;
    });

  const totalNoLeidos     = salasCtx.reduce((acc, s) => acc + getNoLeidos(s), 0);
  const totalNoLeidosChip = salasCtx.reduce((acc, s) => acc + (getNoLeidos(s) > 0 ? 1 : 0), 0);

  // ── Render item de sala ───────────────────────────────────────────────────
  const renderSala = ({ item: sala }) => {
    const nombre       = nombreMostrar(sala);
    const iniciales    = getIniciales(nombre);
    const bgAv         = avatarColor(nombre);
    const noLeidos     = getNoLeidos(sala);
    const tieneNoLeidos = noLeidos > 0;
    const hora         = formatHoraSala(sala.ultimo_mensaje_fecha || sala.fecha_ultimo_mensaje || '');
    const esFijada     = fijadas.includes(sala.id_sala);
    const esSilenciada = silenciadas.includes(sala.id_sala);
    const esFavorita   = favoritas.includes(sala.id_sala);

    return (
      <Pressable
        style={[s.salaItem, tieneNoLeidos && s.salaItemUnread]}
        onPress={() => abrirSala(sala)}
        onLongPress={() => onLongPressSala(sala)}
        delayLongPress={500}
        android_ripple={{ color: '#F0E8EB' }}
      >
        {/* Acento lateral vinotinto si tiene no leídos */}
        {tieneNoLeidos && <View style={s.acento} />}

        {/* Avatar */}
        <View style={[s.avatar, { backgroundColor: bgAv }]}>
          <Text style={s.avatarText}>{iniciales}</Text>
          {/* Badge de silenciado */}
          {esSilenciada && (
            <View style={s.silenciadoBadge}>
              <Text style={{ fontSize: 8 }}>🔕</Text>
            </View>
          )}
        </View>

        {/* Contenido */}
        <View style={s.salaInfo}>
          <View style={s.salaTopRow}>
            <View style={s.salaNombreRow}>
              {esFijada   && <Text style={s.salaPin}>📌</Text>}
              {esFavorita && <Text style={s.salaPin}>⭐</Text>}
              <Text style={[s.salaNombre, tieneNoLeidos && s.salaNombreUnread]} numberOfLines={1}>
                {nombre}
              </Text>
            </View>
            {hora ? (
              <Text style={[s.salaHora, tieneNoLeidos && s.salaHoraUnread]}>{hora}</Text>
            ) : null}
          </View>
          <View style={s.salaBottomRow}>
            <Text style={[s.salaUltimo, tieneNoLeidos && s.salaUltimoUnread]} numberOfLines={1}>
              {sala.ultimo_mensaje || 'Sin mensajes aún'}
            </Text>
            {tieneNoLeidos && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{noLeidos > 99 ? '99+' : noLeidos}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // ── Chips de filtro ───────────────────────────────────────────────────────
  const FILTROS = [
    { id: 'todos',      label: 'Todos',      count: null },
    { id: 'no_leidos',  label: 'No leídos',  count: totalNoLeidosChip > 0 ? totalNoLeidosChip : null },
    { id: 'favoritos',  label: 'Favoritos',  count: favoritas.length > 0 ? favoritas.length : null },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => setSidebarVisible(true)} activeOpacity={0.7}>
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Mensajes</Text>
          <Text style={s.headerSub}>
            {totalNoLeidos > 0
              ? `${totalNoLeidos} sin leer`
              : 'Todas tus conversaciones'}
          </Text>
        </View>
        {totalNoLeidos > 0 && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{totalNoLeidos > 99 ? '99+' : totalNoLeidos}</Text>
          </View>
        )}
      </View>

      {/* ── Buscador ── */}
      <View style={s.searchBox}>
        <View style={s.searchInner}>
          <IconSearch size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar un chat o iniciar uno nuevo"
            placeholderTextColor="rgba(255,255,255,0.5)"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* ── Chips de filtro (igual que la web) ── */}
      <View style={s.filtrosRow}>
        {FILTROS.map(f => {
          const activo = filtro === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[s.filtroPill, activo && s.filtroPillActive]}
              onPress={() => setFiltro(f.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.filtroText, activo && s.filtroTextActive]}>{f.label}</Text>
              {f.count != null && (
                <View style={[s.filtroCount, activo && s.filtroCountActive]}>
                  <Text style={[s.filtroCountText, activo && s.filtroCountTextActive]}>
                    {f.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Cuerpo ── */}
      <View style={s.body}>
        {loadingSalas ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={s.loadingText}>Cargando conversaciones…</Text>
          </View>
        ) : salasFiltradas.length === 0 ? (
          <View style={s.centered}>
            <View style={s.emptyIconBox}>
              <IconMessage size={32} color={PRIMARY} />
            </View>
            <Text style={s.emptyTitle}>
              {busqueda.trim()
                ? 'Sin resultados'
                : filtro === 'no_leidos'
                ? 'No tienes mensajes sin leer'
                : filtro === 'favoritos'
                ? 'No tienes favoritos aún'
                : 'Sin conversaciones aún'}
            </Text>
            <Text style={s.emptySubtitle}>
              {busqueda.trim()
                ? 'Prueba con otro término'
                : filtro === 'todos'
                ? 'Escríbele a una librería desde la página de un libro para empezar a chatear'
                : ''}
            </Text>
          </View>
        ) : (
          <FlatList
            data={salasFiltradas}
            keyExtractor={(item) => String(item.id_sala)}
            renderItem={renderSala}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
            }
            ItemSeparatorComponent={() => <View style={s.separator} />}
          />
        )}
      </View>

      {/* ── Modal menú contextual de sala ── */}
      <Modal
        visible={menuSala.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuSala({ visible: false, sala: null })}
      >
        <Pressable style={s.sheetOverlay} onPress={() => setMenuSala({ visible: false, sala: null })}>
          <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
            {/* Handle */}
            <View style={s.sheetHandle} />

            {/* Encabezado de la sala */}
            {menuSala.sala && (
              <View style={s.sheetHeader}>
                <View style={[s.sheetAvatar, { backgroundColor: avatarColor(nombreMostrar(menuSala.sala)) }]}>
                  <Text style={s.sheetAvatarText}>{getIniciales(nombreMostrar(menuSala.sala))}</Text>
                </View>
                <Text style={s.sheetNombre} numberOfLines={1}>{nombreMostrar(menuSala.sala)}</Text>
              </View>
            )}

            <View style={s.sheetDivider} />

            {/* Opciones del menú (igual que la web) */}
            {[
              {
                label: fijadas.includes(menuSala.sala?.id_sala) ? '📌 Desfijar' : '📌 Fijar al inicio',
                fn: () => menuSala.sala && toggleFijar(menuSala.sala.id_sala),
              },
              {
                label: silenciadas.includes(menuSala.sala?.id_sala) ? '🔔 Activar notificaciones' : '🔕 Silenciar notificaciones',
                fn: () => menuSala.sala && toggleSilenciar(menuSala.sala.id_sala),
              },
              {
                label: menuSala.sala && getNoLeidos(menuSala.sala) > 0 ? '✓ Marcar como leído' : '● Marcar como no leído',
                fn: () => menuSala.sala && toggleMarcarLeido(menuSala.sala),
              },
              {
                label: favoritas.includes(menuSala.sala?.id_sala) ? '⭐ Quitar de favoritos' : '⭐ Añadir a favoritos',
                fn: () => menuSala.sala && toggleFavorito(menuSala.sala.id_sala),
              },
              {
                label: archivadas.includes(menuSala.sala?.id_sala) ? '📂 Desarchivar' : '📂 Archivar',
                fn: () => menuSala.sala && toggleArchivar(menuSala.sala.id_sala),
              },
              {
                label: '🗑️ Vaciar chat',
                fn: () => menuSala.sala && vaciarChat(menuSala.sala),
                danger: false,
              },
              {
                label: '❌ Eliminar conversación',
                fn: () => menuSala.sala && eliminarChat(menuSala.sala),
                danger: true,
              },
            ].map((op, i) => (
              <TouchableOpacity
                key={i}
                style={[s.sheetOption, i === 5 && s.sheetOptionSep]}
                onPress={op.fn}
                activeOpacity={0.7}
              >
                <Text style={[s.sheetOptionText, op.danger && { color: '#dc2626' }]}>
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Cancelar */}
            <TouchableOpacity
              style={s.sheetCancel}
              onPress={() => setMenuSala({ visible: false, sala: null })}
              activeOpacity={0.7}
            >
              <Text style={s.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Sidebars ── */}
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

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PRIMARY },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  menuBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  menuIcon:       { color: WHITE, fontSize: 20, fontWeight: '700' },
  headerTitle:    { color: WHITE, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  headerSub:      { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  headerBadge:    { backgroundColor: WHITE, borderRadius: 14, minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  headerBadgeText:{ color: PRIMARY, fontWeight: '900', fontSize: 13 },

  // Buscador
  searchBox:   { paddingHorizontal: 16, paddingBottom: 10 },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  searchInput: { flex: 1, fontSize: 14, color: WHITE },

  // Chips de filtro
  filtrosRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
  filtroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  filtroPillActive:    { backgroundColor: WHITE, borderColor: WHITE },
  filtroText:          { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  filtroTextActive:    { color: PRIMARY, fontWeight: '800' },
  filtroCount:         { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  filtroCountActive:   { backgroundColor: PRIMARY },
  filtroCountText:     { fontSize: 11, fontWeight: '800', color: WHITE },
  filtroCountTextActive:{ color: WHITE },

  // Cuerpo
  body: { flex: 1, backgroundColor: BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },

  // Sala item
  salaItem:       { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  salaItemUnread: { backgroundColor: '#FDF7F9' },
  acento:         { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: PRIMARY },
  separator:      { height: 1, backgroundColor: BORDER, marginLeft: 76 },

  // Avatar
  avatar:         { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  avatarText:     { color: WHITE, fontWeight: '800', fontSize: 18, letterSpacing: -0.5 },
  silenciadoBadge:{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },

  // Info
  salaInfo:        { flex: 1, minWidth: 0 },
  salaTopRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  salaNombreRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  salaPin:         { fontSize: 11 },
  salaNombre:      { fontSize: 14, fontWeight: '600', color: TEXT, flex: 1 },
  salaNombreUnread:{ fontWeight: '800', color: TEXT },
  salaHora:        { fontSize: 11, color: MUTED, flexShrink: 0, marginLeft: 8 },
  salaHoraUnread:  { color: PRIMARY, fontWeight: '700' },
  salaBottomRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  salaUltimo:      { fontSize: 13, color: MUTED, flex: 1 },
  salaUltimoUnread:{ color: TEXT, fontWeight: '600' },

  // Badge no leídos
  badge:     { backgroundColor: PRIMARY, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 8 },
  badgeText: { color: WHITE, fontSize: 11, fontWeight: '800' },

  // Estados
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#FDF0F3', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6, textAlign: 'center' },
  emptySubtitle:{ fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20 },
  loadingText:  { marginTop: 12, color: MUTED, fontSize: 13 },

  // Bottom sheet menú contextual
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1C8C0', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  sheetHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  sheetAvatar:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sheetAvatarText:{ color: WHITE, fontWeight: '800', fontSize: 16 },
  sheetNombre:   { fontSize: 16, fontWeight: '800', color: TEXT, flex: 1 },
  sheetDivider:  { height: 1, backgroundColor: BORDER, marginBottom: 8 },
  sheetOption:   { paddingHorizontal: 20, paddingVertical: 15 },
  sheetOptionSep:{ borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4 },
  sheetOptionText:{ fontSize: 15, color: TEXT, fontWeight: '500' },
  sheetCancel:   { marginHorizontal: 16, marginTop: 8, backgroundColor: '#F5F0EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sheetCancelText:{ fontSize: 15, fontWeight: '700', color: TEXT },
});
