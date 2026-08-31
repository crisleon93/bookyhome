import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
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
import { getMisPedidos } from '../services/api';

const PRIMARY = '#7A1E3A';
const BG      = '#FAF8F5';
const WHITE   = '#FFFFFF';
const BORDER  = '#E0DBD4';
const TEXT    = '#2A2A2A';
const MUTED   = '#777';

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function EnviosVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [pedidos,    setPedidos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda,   setBusqueda]   = useState('');

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const res = await getMisPedidos();
      setPedidos(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onRefresh = () => { setRefreshing(true); cargar(true); };

  // Solo pedidos que tengan guía registrada y no estén cancelados
  const envios = pedidos.filter((p) => {
    if (!p.envio || p.estado === 'cancelada') return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return [
      p.codigo_compra, p.id_orden, p.cliente,
      p.correo_cliente, p.envio?.empresa_mensajeria, p.envio?.numero_guia,
    ].some((v) => String(v || '').toLowerCase().includes(q));
  });

  const abrirRastreo = (envio) => {
    const url = envio?.url_rastreo || envio?.sitio_web;
    if (url) Linking.openURL(url);
  };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      {/* Acento lateral vinotinto */}
      <View style={s.acento} />

      <View style={s.cardBody}>
        {/* Fila superior: código + estado envío */}
        <View style={s.cardTop}>
          <View>
            <Text style={s.codigo}>{item.codigo_compra || `#${item.id_orden}`}</Text>
            <Text style={s.subInfo}>Pedido #{item.id_orden} · {item.cliente}</Text>
          </View>
          <View style={s.estadoChip}>
            <Text style={s.estadoChipText}>
              {item.envio?.estado_envio || 'Guía registrada'}
            </Text>
          </View>
        </View>

        {/* Empresa y guía */}
        <View style={s.guiaRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.empresa}>🚚 {item.envio?.empresa_mensajeria}</Text>
            <Text style={s.guia}>Guía: {item.envio?.numero_guia}</Text>
            <Text style={s.fecha}>{fmtFecha(item.fecha)}</Text>
          </View>

          {/* Botón rastrear */}
          {(item.envio?.url_rastreo || item.envio?.sitio_web) ? (
            <TouchableOpacity
              style={s.rastrearBtn}
              onPress={() => abrirRastreo(item.envio)}
              activeOpacity={0.7}
            >
              <Text style={s.rastrearBtnText}>🔍 Rastrear</Text>
              <Text style={s.rastrearBtnSub}>con la transportadora</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.sinRastreoBox}>
              <Text style={s.sinRastreoText}>Rastreo no disponible</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

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
        <TouchableOpacity
          style={s.menuBtn}
          onPress={() => setSidebarVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Envíos y seguimiento</Text>
          <Text style={s.headerSub}>Consulta guías y rastreo de tus pedidos</Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar por compra, guía, comprador o transportadora…"
          placeholderTextColor={MUTED}
          value={busqueda}
          onChangeText={setBusqueda}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={s.loadingText}>Cargando envíos…</Text>
        </View>
      ) : envios.length === 0 ? (
        <View style={s.centered}>
          <Text style={{ fontSize: 42, marginBottom: 12 }}>📦</Text>
          <Text style={s.emptyTitle}>
            {busqueda.trim()
              ? 'No hay envíos que coincidan'
              : 'Aún no hay envíos con guía registrada'}
          </Text>
          <Text style={s.emptyDesc}>
            {busqueda.trim()
              ? 'Prueba con otro término de búsqueda'
              : 'Cuando registres una guía en un pedido, aparecerá aquí'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={envios}
          keyExtractor={(item, idx) => String(item.id_orden ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
          ListHeaderComponent={
            <Text style={s.contador}>
              {envios.length} envío{envios.length !== 1 ? 's' : ''} encontrado{envios.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: PRIMARY,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:   { color: WHITE, fontSize: 20, fontWeight: '700' },
  headerTitle:{ color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSub:  { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },

  // Buscador
  searchBox: {
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  searchInput: {
    backgroundColor: '#F4F0EC',
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14, color: TEXT,
  },

  // Lista
  list:      { padding: 16, paddingBottom: 40 },
  contador:  { fontSize: 12, color: MUTED, fontWeight: '600', marginBottom: 12 },

  // Tarjeta
  card: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  acento:   { width: 5, backgroundColor: PRIMARY },
  cardBody: { flex: 1, padding: 14 },

  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  codigo:   { fontSize: 15, fontWeight: '800', color: PRIMARY },
  subInfo:  { fontSize: 12, color: MUTED, marginTop: 2 },

  estadoChip: {
    backgroundColor: '#E2D9F3', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  estadoChipText: { fontSize: 11, fontWeight: '700', color: '#4A235A' },

  // Guía
  guiaRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  empresa:    { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 2 },
  guia:       { fontSize: 12, color: MUTED },
  fecha:      { fontSize: 11, color: MUTED, marginTop: 4 },

  // Botón rastrear
  rastrearBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center',
    minWidth: 110,
    ...Platform.select({
      ios:     { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
      android: { elevation: 3 },
    }),
  },
  rastrearBtnText: { color: WHITE, fontWeight: '800', fontSize: 13 },
  rastrearBtnSub:  { color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 2 },

  sinRastreoBox: {
    backgroundColor: '#F3F4F6', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    alignItems: 'center', minWidth: 100,
  },
  sinRastreoText: { fontSize: 11, color: MUTED, fontWeight: '600', textAlign: 'center' },

  // Estados
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: MUTED, fontSize: 14 },
  emptyTitle:  { fontSize: 16, fontWeight: '800', color: TEXT, textAlign: 'center', marginBottom: 8 },
  emptyDesc:   { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20 },
});
