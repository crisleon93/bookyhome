// src/screens/Librerias.jsx — Listado completo de librerías BookyHome
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTiendasDestacadas, getApiBaseUrl } from '../services/api';
import Header from '../components/Header';

const PRIMARY   = '#7A1E3A';
const PRIMARY2  = '#4B1E2F';
const BEIGE     = '#F0E8DB';
const BG        = '#FAF8F6';
const WHITE     = '#FFFFFF';
const GRAY      = '#666';
const TEXT      = '#2A2A2A';
const BORDER    = '#E2D8D0';

const SORT_OPTIONS = [
  { value: 'mas_libros',        label: '📚 Mayor cantidad de libros' },
  { value: 'mejor_calificacion',label: '⭐ Mejor calificación' },
  { value: 'menos_libros',      label: '📖 Menor cantidad de libros' },
  { value: 'nombre_asc',        label: '🔤 Nombre: A → Z' },
  { value: 'nombre_desc',       label: '🔤 Nombre: Z → A' },
];

// ── Parsear ciudad (igual que Home.jsx) ─────────────────────────────────────
function parseCiudad(tienda) {
  let ciudad = (tienda.ciudad_origen || '').trim();
  const dir  = (tienda.direccion || '').trim();
  if (!ciudad && dir.includes(',')) ciudad = dir.split(',').pop().trim();
  const cn = (ciudad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (cn.includes('bogot'))    return 'Bogotá';
  if (cn.includes('medell'))   return 'Medellín';
  if (cn.includes('cali'))     return 'Cali';
  if (cn.includes('barranq'))  return 'Barranquilla';
  if (cn.includes('cartag'))   return 'Cartagena';
  if (cn.includes('santa mart'))return 'Santa Marta';
  if (cn.includes('bucaram'))  return 'Bucaramanga';
  if (cn.includes('perei'))    return 'Pereira';
  if (cn.includes('maniz'))    return 'Manizales';
  if (cn.includes('armen'))    return 'Armenia';
  if (cn.includes('ibag'))     return 'Ibagué';
  if (cn.includes('neiv'))     return 'Neiva';
  if (cn.includes('villav'))   return 'Villavicencio';
  if (cn.includes('past'))     return 'Pasto';
  if (cn.includes('popay'))    return 'Popayán';
  return ciudad || 'Colombia';
}

function parseTiendaInfo(tienda) {
  const ciudad  = parseCiudad(tienda);
  const nombre  = (tienda.nombre_tienda || '').replace(/Librer\?\?a/g, 'Librería').replace(/Bogot\?\?/g, 'Bogotá');
  let desc = (tienda.descripcion || '').trim();
  if (!desc || desc.includes('??') || desc.toLowerCase().includes('en colombia')) {
    desc = `Librería asociada a BookyHome en ${ciudad}.`;
  }
  return { ciudad, nombre, desc };
}

const normalize = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// ── Logo con fallback a iniciales ────────────────────────────────────────────
function TiendaLogo({ tienda, base }) {
  const [err, setErr] = useState(false);
  const logo = tienda.logo_url
    ? (tienda.logo_url.startsWith('http') ? tienda.logo_url : `${base}/${tienda.logo_url.replace(/^\//, '')}`)
    : null;
  const { nombre } = parseTiendaInfo(tienda);
  const ini = nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
  return (
    <View style={s.logoWrap}>
      {logo && !err
        ? <Image source={{ uri: logo }} style={s.logoImg} resizeMode="cover" onError={() => setErr(true)} />
        : <Text style={s.logoIni}>{ini}</Text>
      }
    </View>
  );
}

// ── Tarjeta de librería ───────────────────────────────────────────────────────
function TiendaCard({ tienda, base, onPress }) {
  const { ciudad, nombre, desc } = parseTiendaInfo(tienda);
  const calif = Number(tienda.calificacion_promedio || 0);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <TiendaLogo tienda={tienda} base={base} />
      <Text style={s.ciudad}>📍 {ciudad}</Text>
      <Text style={s.nombre} numberOfLines={2}>{nombre}</Text>
      <Text style={s.desc} numberOfLines={2}>{desc}</Text>
      <View style={s.footer}>
        <Text style={s.libros}>📚 {tienda.total_libros || 0} libros</Text>
        {calif > 0 && <Text style={s.calif}>⭐ {calif.toFixed(1)}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function Librerias({ navigation, route }) {
  const BASE = getApiBaseUrl();

  const [tiendas,     setTiendas]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState(route?.params?.nombre_tienda ?? '');
  const [ordenarPor,  setOrdenarPor]  = useState('mas_libros');
  const [soloConStock,setSoloConStock]= useState(false);
  const [showSort,    setShowSort]    = useState(false);

  // Si se navega de nuevo con un nombre_tienda diferente (p.ej. desde el Header), actualizarlo
  useEffect(() => {
    const nombre = route?.params?.nombre_tienda;
    if (nombre !== undefined) setBusqueda(nombre);
  }, [route?.params?.nombre_tienda]);

  useEffect(() => {
    getTiendasDestacadas({ todas: true })
      .then(r => setTiendas(r.data || []))
      .catch(() => setTiendas([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Filtrado y orden (replica la lógica del frontend web) ────────────────
  const filtradas = useMemo(() => {
    const base = tiendas.filter(t => {
      const { ciudad, nombre } = parseTiendaInfo(t);
      const matchNombre = normalize(nombre).includes(normalize(busqueda));
      const matchStock  = !soloConStock || ((t.total_libros || 0) > 0);
      return matchNombre && matchStock;
    });

    return [...base].sort((a, b) => {
      if (ordenarPor === 'mas_libros')
        return (b.total_libros || 0) - (a.total_libros || 0) || (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0);
      if (ordenarPor === 'mejor_calificacion')
        return (Number(b.calificacion_promedio) || 0) - (Number(a.calificacion_promedio) || 0) || (b.total_libros || 0) - (a.total_libros || 0);
      if (ordenarPor === 'menos_libros')
        return (a.total_libros || 0) - (b.total_libros || 0);
      if (ordenarPor === 'nombre_asc') {
        const { nombre: nA } = parseTiendaInfo(a);
        const { nombre: nB } = parseTiendaInfo(b);
        return nA.localeCompare(nB, 'es');
      }
      if (ordenarPor === 'nombre_desc') {
        const { nombre: nA } = parseTiendaInfo(a);
        const { nombre: nB } = parseTiendaInfo(b);
        return nB.localeCompare(nA, 'es');
      }
      return 0;
    });
  }, [tiendas, busqueda, ordenarPor, soloConStock]);

  const sortLabel = SORT_OPTIONS.find(o => o.value === ordenarPor)?.label || 'Ordenar';

  const renderItem = useCallback(({ item }) => (
    <TiendaCard
      tienda={item}
      base={BASE}
      onPress={() => navigation.navigate('PerfilTienda', { id_tienda: item.id_tienda })}
    />
  ), [BASE, navigation]);

  const renderSkeleton = () => (
    <View style={s.skeletonWrap}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[s.card, { opacity: 0.45 }]}>
          <View style={[s.logoWrap, { backgroundColor: '#d0b8c0' }]} />
          <View style={{ width: '55%', height: 8,  borderRadius: 4, backgroundColor: '#ddd', marginBottom: 5 }} />
          <View style={{ width: '85%', height: 10, borderRadius: 4, backgroundColor: '#ddd', marginBottom: 6 }} />
          <View style={{ width: '70%', height: 8,  borderRadius: 4, backgroundColor: '#ddd', marginBottom: 8 }} />
          <View style={{ width: '45%', height: 8,  borderRadius: 4, backgroundColor: '#ddd' }} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <Header variant="public" navigation={navigation} showTopBar={true} />

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>🏪 Librerías en BookyHome</Text>
            <Text style={s.headerSub}>Vendedores verificados con catálogo activo</Text>
          </View>
          {!loading && (
            <Text style={s.count}>
              {filtradas.length} {filtradas.length === 1 ? 'librería' : 'librerías'}
            </Text>
          )}
        </View>

        {/* Buscador */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Buscar librería..."
              placeholderTextColor="#aaa"
              value={busqueda}
              onChangeText={setBusqueda}
              returnKeyType="search"
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')} style={s.clearBtn}>
                <Text style={s.clearBtnTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros rápidos */}
        <View style={s.filtersRow}>
          {/* Botón ordenar */}
          <TouchableOpacity style={s.sortBtn} onPress={() => setShowSort(true)} activeOpacity={0.8}>
            <Text style={s.sortBtnTxt} numberOfLines={1}>{sortLabel}</Text>
            <Text style={s.sortArrow}>▾</Text>
          </TouchableOpacity>

          {/* Toggle solo con libros */}
          <TouchableOpacity
            style={[s.toggleBtn, soloConStock && s.toggleBtnActive]}
            onPress={() => setSoloConStock(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={[s.toggleBtnTxt, soloConStock && s.toggleBtnTxtActive]}>
              {soloConStock ? '✅' : '⚪'} Solo con libros
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Lista ────────────────────────────────────────────────────── */}
      {loading ? (
        <ScrollView contentContainerStyle={s.listContainer}>
          {renderSkeleton()}
        </ScrollView>
      ) : filtradas.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔍</Text>
          <Text style={s.emptyTitle}>Sin resultados</Text>
          <Text style={s.emptySub}>No se encontraron librerías con ese filtro</Text>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={item => String(item.id_tienda)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Modal de ordenamiento ────────────────────────────────────── */}
      {showSort && (
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSort(false)}
        >
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Ordenar por</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.modalOption, ordenarPor === opt.value && s.modalOptionActive]}
                onPress={() => { setOrdenarPor(opt.value); setShowSort(false); }}
                activeOpacity={0.8}
              >
                <Text style={[s.modalOptionTxt, ordenarPor === opt.value && s.modalOptionTxtActive]}>
                  {opt.label}
                </Text>
                {ordenarPor === opt.value && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: PRIMARY },

  // Cabecera
  header:     { backgroundColor: WHITE, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerTitle:{ fontSize: 15, fontWeight: '800', color: TEXT },
  headerSub:  { fontSize: 11, color: GRAY, marginTop: 2 },
  count:      { fontSize: 11, fontWeight: '600', color: GRAY, marginTop: 4 },

  // Buscador
  searchRow:  { marginBottom: 10 },
  searchBox:  { flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 8, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, height: 40 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput:{ flex: 1, fontSize: 13, color: TEXT, paddingVertical: 0 },
  clearBtn:   { padding: 4 },
  clearBtnTxt:{ fontSize: 12, color: GRAY },

  // Filtros
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sortBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 8, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 8, gap: 4, flex: 1 },
  sortBtnTxt: { fontSize: 11, fontWeight: '600', color: TEXT, flex: 1 },
  sortArrow:  { fontSize: 10, color: GRAY },
  toggleBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 8, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 8 },
  toggleBtnActive: { backgroundColor: '#fdf2f4', borderColor: PRIMARY },
  toggleBtnTxt:    { fontSize: 11, fontWeight: '500', color: GRAY },
  toggleBtnTxtActive: { color: PRIMARY, fontWeight: '700' },

  // Lista
  listContainer: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 24, backgroundColor: BG },
  row:           { justifyContent: 'space-between', marginBottom: 12 },
  skeletonWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },

  // Tarjeta
  card:      { flex: 1, maxWidth: '48%', backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  logoWrap:  { width: 54, height: 54, borderRadius: 27, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 9, overflow: 'hidden' },
  logoImg:   { width: '100%', height: '100%' },
  logoIni:   { color: WHITE, fontSize: 17, fontWeight: '800' },
  ciudad:    { fontSize: 10, color: GRAY, textAlign: 'center', marginBottom: 3 },
  nombre:    { fontSize: 12, fontWeight: '700', color: TEXT, textAlign: 'center', lineHeight: 15, marginBottom: 4 },
  desc:      { fontSize: 10, color: GRAY, textAlign: 'center', lineHeight: 14, marginBottom: 8 },
  footer:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0EBE4', paddingTop: 6 },
  libros:    { fontSize: 10, color: GRAY },
  calif:     { fontSize: 10, fontWeight: '700', color: '#ca8a04' },

  // Vacío
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6 },
  emptySub:  { fontSize: 13, color: GRAY, textAlign: 'center', paddingHorizontal: 24 },

  // Modal de orden
  modalOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', zIndex: 100 },
  modalSheet:     { backgroundColor: WHITE, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 36 },
  modalTitle:     { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 14 },
  modalOption:    { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F0EBE4', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOptionActive: { backgroundColor: '#fdf2f4', borderRadius: 8, paddingHorizontal: 8 },
  modalOptionTxt: { fontSize: 13, color: TEXT },
  modalOptionTxtActive: { color: PRIMARY, fontWeight: '700' },
  checkmark:      { fontSize: 14, color: PRIMARY, fontWeight: '800' },
});
