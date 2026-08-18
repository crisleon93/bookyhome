import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMisLibros, deleteLibro, getAlertasStock, getApiBaseUrl } from '../services/api';

const PRIMARY = '#7A1E3A';
const WHITE   = '#FFFFFF';
const BG      = '#FAF8F5';
const BORDER  = '#E0DBD4';
const TEXT    = '#2A2A2A';
const MUTED   = '#888';

const ESTADO_COLORS = {
  Nuevo:    { bg: '#D1FAE5', color: '#065F46' },
  Visible:  { bg: '#DBEAFE', color: '#1E40AF' },
  Oculto:   { bg: '#F3F4F6', color: '#6B7280' },
  Agotado:  { bg: '#FEE2E2', color: '#991B1B' },
};

const fmt = (val) =>
  val == null ? '$0 COP'
  : '$' + String(Math.floor(val)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' COP';

const getImgUrl = (libro) => {
  const base = getApiBaseUrl();
  const raw = libro?.imagen_url || libro?.imagen_principal || libro?.imagen_principal_url
    || (Array.isArray(libro?.imagenes) ? libro.imagenes[0] : libro?.imagenes)
    || libro?.foto;
  if (!raw) return null;
  const candidate = typeof raw === 'string' && raw.includes(',') ? raw.split(',')[0].trim() : String(raw).trim();
  if (!candidate) return null;
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
  return `${base}/${candidate.replace(/^\/+/, '')}`;
};

export default function Libreria({ navigation }) {
  const [libros,     setLibros]     = useState([]);
  const [alertas,    setAlertas]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting,   setDeleting]   = useState(null);

  // Modal eliminar
  const [modalEliminar, setModalEliminar] = useState({ visible: false, libro: null });

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [rLib, rAlt] = await Promise.all([
        getMisLibros(),
        getAlertasStock(3).catch(() => ({ data: [] })),
      ]);
      setLibros(rLib.data || []);
      setAlertas(Array.isArray(rAlt.data) ? rAlt.data : []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onRefresh = () => { setRefreshing(true); cargar(true); };

  const confirmarEliminar = async () => {
    const libro = modalEliminar.libro;
    if (!libro) return;
    setModalEliminar({ visible: false, libro: null });
    setDeleting(libro.id_libro);
    try {
      await deleteLibro(libro.id_libro);
      setLibros(prev => prev.filter(l => l.id_libro !== libro.id_libro));
    } catch {
      // silencioso
    } finally {
      setDeleting(null);
    }
  };

  const estadoBadge = (libro) => {
    const e = libro.estado_libro || (libro.activo ? 'Visible' : 'Oculto');
    const c = ESTADO_COLORS[e] || { bg: '#F3F4F6', color: '#6B7280' };
    return (
      <View style={[s.badge, { backgroundColor: c.bg }]}>
        <Text style={[s.badgeText, { color: c.color }]}>{e}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const imgUrl = getImgUrl(item);
    const estaEnAlerta = alertas.some(a => a.id_libro === item.id_libro);

    return (
      <View style={[s.card, estaEnAlerta && s.cardAlerta]}>
        {/* portada */}
        <View style={s.coverBox}>
          {imgUrl
            ? <Image source={{ uri: imgUrl }} style={s.cover} resizeMode="cover" />
            : <View style={s.coverPlaceholder}><Text style={{ fontSize: 22 }}>📖</Text></View>
          }
        </View>

        {/* info */}
        <View style={s.info}>
          <View style={s.infoTop}>
            <Text style={s.titulo} numberOfLines={1}>{item.titulo}</Text>
            {estadoBadge(item)}
          </View>
          <Text style={s.autor} numberOfLines={1}>{item.autor_libro} · {item.nombre_categoria}</Text>
          <View style={s.infoBottom}>
            <Text style={s.precio}>{fmt(item.precio_libro ?? item.precio)}</Text>
            <Text style={[s.stock, (item.stock ?? 0) <= 3 && { color: '#DC2626', fontWeight: '700' }]}>
              Stock: {item.stock ?? 0}
            </Text>
          </View>

          {/* acciones */}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btn, s.btnStock]}
              onPress={() => navigation.navigate('PublicarLibro', { libro: item, modo: 'stock' })}
            >
              <Text style={s.btnText}>Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnEditar]}
              onPress={() => navigation.navigate('PublicarLibro', { libro: item, modo: 'editar' })}
            >
              <Text style={s.btnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnEliminar]}
              onPress={() => setModalEliminar({ visible: true, libro: item })}
              disabled={deleting === item.id_libro}
            >
              {deleting === item.id_libro
                ? <ActivityIndicator size="small" color={WHITE} />
                : <Text style={s.btnText}>Eliminar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Mis libros</Text>
          {!loading && (
            <Text style={s.headerSub}>
              {libros.length} libro{libros.length !== 1 ? 's' : ''} publicado{libros.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={s.publishBtn}
          onPress={() => navigation.navigate('PublicarLibro')}
        >
          <Text style={s.publishBtnText}>+ Publicar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Alertas stock ── */}
      {alertas.length > 0 && (
        <View style={s.alertaBanner}>
          <Text style={s.alertaBannerTitle}>⚠️ {alertas.length} libro{alertas.length > 1 ? 's' : ''} con stock bajo</Text>
          <View style={s.alertaChips}>
            {alertas.map((a, i) => (
              <View key={i} style={s.alertaChip}>
                <Text style={s.alertaChipText} numberOfLines={1}>{a.titulo} — {a.stock ?? 0} uds</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={PRIMARY} /></View>
      ) : libros.length === 0 ? (
        <View style={s.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📚</Text>
          <Text style={s.emptyTitle}>Aún no tienes libros publicados</Text>
          <TouchableOpacity style={s.publishBtn2} onPress={() => navigation.navigate('PublicarLibro')}>
            <Text style={s.publishBtnText}>Publicar primer libro</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={libros}
          keyExtractor={(item, idx) => String(item.id_libro ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
        />
      )}

      {/* ── Modal eliminar ── */}
      <Modal
        visible={modalEliminar.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEliminar({ visible: false, libro: null })}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            {/* Icono */}
            <View style={s.modalIconBox}>
              <Text style={s.modalIconText}>🗑️</Text>
            </View>

            <Text style={s.modalTitle}>Eliminar libro</Text>
            <Text style={s.modalMsg}>
              ¿Estás seguro que quieres eliminar{'\n'}
              <Text style={s.modalLibroName}>"{modalEliminar.libro?.titulo}"</Text>?
            </Text>
            <Text style={s.modalWarning}>Esta acción no se puede deshacer.</Text>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={() => setModalEliminar({ visible: false, libro: null })}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: BG },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },

  // header
  header:      { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  backIcon:    { color: WHITE, fontSize: 28, lineHeight: 32, fontWeight: '300', marginTop: -2 },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  publishBtn:  { backgroundColor: WHITE, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  publishBtnText: { color: PRIMARY, fontWeight: '800', fontSize: 13 },
  publishBtn2: { backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },

  // alertas
  alertaBanner:      { backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderColor: '#FCD34D', padding: 12 },
  alertaBannerTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 6 },
  alertaChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  alertaChip:        { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  alertaChipText:    { fontSize: 11, color: '#92400E', fontWeight: '600' },

  // tarjeta libro
  card:        { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, overflow: 'hidden' },
  cardAlerta:  { borderColor: '#FCD34D', borderWidth: 1.5 },
  coverBox:    { width: 80, backgroundColor: '#F4F0EC', justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' },
  cover:       { width: 80, height: 110 },
  coverPlaceholder: { width: 80, height: 110, justifyContent: 'center', alignItems: 'center' },

  info:        { flex: 1, padding: 12, gap: 4 },
  infoTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  titulo:      { fontSize: 14, fontWeight: '700', color: TEXT, flex: 1 },
  autor:       { fontSize: 12, color: MUTED },
  infoBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  precio:      { fontSize: 14, fontWeight: '800', color: PRIMARY },
  stock:       { fontSize: 12, color: MUTED },

  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText:   { fontSize: 10, fontWeight: '700' },

  actions:     { flexDirection: 'row', gap: 6, marginTop: 8 },
  btn:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, minWidth: 52, alignItems: 'center' },
  btnText:     { color: WHITE, fontSize: 11, fontWeight: '700' },
  btnStock:    { backgroundColor: '#2563EB' },
  btnEditar:   { backgroundColor: '#059669' },
  btnEliminar: { backgroundColor: '#DC2626' },

  emptyTitle:  { fontSize: 15, fontWeight: '700', color: TEXT },

  // modal eliminar
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  modalBox:          { backgroundColor: WHITE, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  modalIconBox:      { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalIconText:     { fontSize: 28 },
  modalTitle:        { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 10 },
  modalMsg:          { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22 },
  modalLibroName:    { fontWeight: '700', color: TEXT },
  modalWarning:      { fontSize: 12, color: '#DC2626', fontWeight: '600', marginTop: 8, marginBottom: 24 },
  modalBtns:         { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn:          { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  modalBtnCancel:    { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: BORDER },
  modalBtnCancelText:{ fontSize: 14, fontWeight: '700', color: '#444' },
  modalBtnDelete:    { backgroundColor: '#DC2626' },
  modalBtnDeleteText:{ fontSize: 14, fontWeight: '800', color: WHITE },
});
