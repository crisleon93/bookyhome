// src/screens/CatalogoPublico.jsx
// Catálogo público — SIN autenticación requerida.
// Estructura IDÉNTICA al frontend web:
//   • Barra de búsqueda + botón "Filtros" (colapsa/expande el panel)
//   • Panel de filtros: búsqueda, categoría, precio min/max,
//     calificación mínima (0-5★), solo en stock, ordenar por
//   • Grid 2 columnas de tarjetas de libros (igual que LibroCard.jsx)
//   • Paginación
//   • Al tocar una tarjeta → BookDetailPublico
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api, { getApiBaseUrl, searchByISBN } from '../services/api';

const PRIMARY  = '#7A1E3A';
const BG       = '#FAF8F6';
const WHITE    = '#FFFFFF';
const GRAY     = '#6B7280';
const TEXT     = '#1F2937';
const BORDER   = '#E5E7EB';
const BEIGE    = '#F0E8DB';

const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

const IMAGENES_CAT = {
  'Fantasía':   'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&q=70',
  'Romance':    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=300&q=70',
  'Ciencia':    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&q=70',
  'Tecnología': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300&q=70',
  'Historia':   'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=300&q=70',
  'Infantil':   'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=70',
  'Aventura':   'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=300&q=70',
  'Arte':       'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&q=70',
  'Biografía':  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&q=70',
};

const SORT_OPTIONS = [
  { value: 'relevancia',   label: 'Relevancia' },
  { value: 'precio_asc',   label: 'Precio: menor a mayor' },
  { value: 'precio_desc',  label: 'Precio: mayor a menor' },
  { value: 'calificacion', label: 'Calificación' },
  { value: 'recientes',    label: 'Más recientes' },
];

function resolveImgUri(libro, base) {
  const c = [libro.imagen_url, libro.imagen_principal, libro.imagen];
  for (const v of c) {
    if (!v) continue;
    const s = String(v).split(',')[0].trim();
    if (!s) continue;
    if (s.startsWith('http')) return s;
    return `${base}/${s.replace(/^\//, '')}`;
  }
  if (libro.isbn)
    return `https://books.google.com/books/content?vid=ISBN${libro.isbn}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`;
  return IMAGENES_CAT[libro.nombre_categoria] || IMG_DEFAULT;
}

function catColor(cat = '') {
  const t = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (t.includes('terror'))    return { bg: '#eee8f7', color: '#603a92' };
  if (t.includes('ciencia'))   return { bg: '#e4f5e9', color: '#1f7a45' };
  if (t.includes('romance'))   return { bg: '#fde8ef', color: '#b4235d' };
  if (t.includes('fantasia'))  return { bg: '#e9edff', color: '#4156a6' };
  if (t.includes('historia'))  return { bg: '#f8eddb', color: '#8c5a1d' };
  if (t.includes('tecnologia'))return { bg: '#e2f4f6', color: '#137783' };
  if (t.includes('infantil'))  return { bg: '#e4f4ff', color: '#2775a7' };
  if (t.includes('aventura'))  return { bg: '#fff0df', color: '#b85f11' };
  if (t.includes('arte'))      return { bg: '#f4e6f6', color: '#86418f' };
  if (t.includes('biografia')) return { bg: '#e8eef8', color: '#365d96' };
  return { bg: '#F7E9EE', color: PRIMARY };
}

// ── Tarjeta de libro ─────────────────────────────────────────────────────────
function LibroCard({ libro, onPress, cardWidth, coverHeight, BASE }) {
  const [uri, setUri] = useState(() => resolveImgUri(libro, BASE));
  const cat        = libro.nombre_categoria || '';
  const price      = Number(libro.precio_libro ?? libro.precio ?? 0);
  const rating     = Number(libro.calificacion_tienda || libro.calificacion_promedio || libro.calificacion || 0);
  const outOfStock = Number(libro.stock ?? 1) <= 0;
  const { bg: cBg, color: cColor } = catColor(cat);

  return (
    <TouchableOpacity style={[st.card, { width: cardWidth }]} onPress={onPress} activeOpacity={0.88}>
      <View style={[st.cover, { height: coverHeight }]}>
        <Image source={{ uri }} style={st.coverImg} resizeMode="cover"
          onError={() => setUri(IMAGENES_CAT[cat] || IMG_DEFAULT)} />
        {outOfStock && <View style={st.sinStock}><Text style={st.sinStockTxt}>Sin stock</Text></View>}
        {libro.es_impulsado && <View style={st.impulso}><Text style={st.impulsoTxt}>⭐ Dest.</Text></View>}
      </View>
      <View style={st.body}>
        {cat ? <View style={[st.catPill, { backgroundColor: cBg }]}><Text style={[st.catTxt, { color: cColor }]} numberOfLines={1}>{cat}</Text></View> : null}
        <Text style={st.title} numberOfLines={2}>{libro.titulo || 'Sin título'}</Text>
        <Text style={st.author} numberOfLines={1}>{libro.autor_libro || libro.autor || '—'}</Text>
        <View style={st.ratingRow}>
          {rating > 0 && <Text style={st.rating}>★ {rating.toFixed(1)}</Text>}
          <View style={[st.stockPill, outOfStock && st.stockPillOut]}>
            <Text style={[st.stockTxt, outOfStock && st.stockTxtOut]}>{outOfStock ? 'Sin stock' : 'Disponible'}</Text>
          </View>
        </View>
        <Text style={st.price}>${price.toLocaleString('es-CO')}</Text>
        {libro.nombre_tienda ? <Text style={st.tiendaTxt} numberOfLines={1}>{libro.nombre_tienda}</Text> : null}
        <TouchableOpacity style={st.verBtn} onPress={onPress}><Text style={st.verBtnTxt}>Ver detalles</Text></TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function CardSkeleton({ cardWidth, coverHeight }) {
  return (
    <View style={[st.card, { width: cardWidth, opacity: 0.45 }]}>
      <View style={[st.cover, { height: coverHeight, backgroundColor: '#ddd' }]} />
      <View style={st.body}>
        {[['55%',7],['90%',9],['65%',7],['40%',11]].map(([w,h],i) => (
          <View key={i} style={{ width: w, height: h, borderRadius: 4, backgroundColor: '#ddd', marginBottom: i < 3 ? 5 : 0 }} />
        ))}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function CatalogoPublico({ navigation, route }) {
  const BASE = getApiBaseUrl();
  const { width: W } = useWindowDimensions();
  const GAP = 10, PADDING = 16, COLS = 2;
  const cardWidth   = (W - PADDING * 2 - GAP * (COLS - 1)) / COLS;
  const coverHeight = Math.round(cardWidth * 1.18);

  // ── Estado de libros ──────────────────────────────────────────────────────
  const [books,      setBooks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  // ── Opciones de filtros (precio máximo para contar filtros activos) ──────
  const [precioMaxReal, setPrecioMaxReal] = useState(1000000);

  // ── Estado de filtros ────────────────────────────────────────────────────
  const [filtros, setFiltros] = useState({
    busqueda:         route?.params?.q               ?? '',
    categoria_id:     route?.params?.categoryId      ?? null,
    categoria_nombre: route?.params?.categoria       ?? null,
    nombre_tienda:    route?.params?.nombre_tienda   ?? '',
    correo_vendedor:  route?.params?.correo_vendedor ?? '',
    precio_min:       0,
    precio_max:       1000000,
    calificacion_min: 0,
    disponible:       true,
    ordenar_por:      route?.params?.ordenar_por     ?? 'relevancia',
  });

  const ultimaBusquedaRef = useRef(null);

  // ── Escáner de código de barras (ISBN) ────────────────────────────────────
  // El escáner vive dentro del Header — handleISBNDetectado se pasa via onBarcodeScanned
  const handleISBNDetectado = async (isbn) => {
    try {
      const res = await searchByISBN(isbn);
      if (res.data) {
        navigation.navigate('BookDetailPublico', { book: res.data });
      }
    } catch {
      setFiltros(prev => ({ ...prev, busqueda: isbn }));
      setPage(1);
      ultimaBusquedaRef.current = null;
    }
  };

  // ── Cargar precio máximo real (para contar filtros activos) ───────────────
  useEffect(() => {
    api.get('/catalogo/filtros-disponibles')
      .then(res => {
        const data = res.data || {};
        if (data.precio_max) {
          setPrecioMaxReal(data.precio_max);
          setFiltros(prev => ({
            ...prev,
            precio_max: prev.precio_max === 1000000 ? data.precio_max : prev.precio_max,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // ── Reaccionar a params de navegación ────────────────────────────────────
  useEffect(() => {
    const p = route?.params || {};
    if (!p.q && !p.categoria && !p.categoryId && !p.ordenar_por && !p.nombre_tienda && !p.correo_vendedor) return;
    setFiltros(prev => ({
      ...prev,
      busqueda:         p.q              ?? prev.busqueda,
      categoria_nombre: p.categoria      ?? prev.categoria_nombre,
      categoria_id:     p.categoryId     ?? prev.categoria_id,
      nombre_tienda:    p.nombre_tienda  ?? prev.nombre_tienda,
      correo_vendedor:  p.correo_vendedor ?? prev.correo_vendedor,
      ordenar_por:      p.ordenar_por    ?? prev.ordenar_por,
    }));
    setPage(1);
    ultimaBusquedaRef.current = null;
  }, [route?.params?.q, route?.params?.categoria, route?.params?.categoryId, route?.params?.ordenar_por, route?.params?.nombre_tienda, route?.params?.correo_vendedor]);

  // ── Cargar libros ─────────────────────────────────────────────────────────
  const cargarLibros = useCallback(async () => {
    const params = {};
    if (filtros.busqueda)         params.q               = filtros.busqueda;
    if (filtros.categoria_id)     params.categoria_id    = filtros.categoria_id;
    else if (filtros.categoria_nombre) params.categoria  = filtros.categoria_nombre;
    if (filtros.nombre_tienda)    params.nombre_tienda   = filtros.nombre_tienda;
    if (filtros.correo_vendedor)  params.correo_vendedor = filtros.correo_vendedor;
    if (filtros.precio_min > 0)   params.precio_min      = filtros.precio_min;
    if (filtros.precio_max < precioMaxReal) params.precio_max = filtros.precio_max;
    if (filtros.calificacion_min > 0) params.calificacion_min = filtros.calificacion_min;
    if (filtros.disponible)       params.disponible      = true;
    params.ordenar_por = filtros.ordenar_por;
    params.pagina      = page;
    params.limite      = 24;

    const clave = JSON.stringify(params);
    if (clave === ultimaBusquedaRef.current) return;
    ultimaBusquedaRef.current = clave;

    setLoading(true);
    try {
      const res  = await api.get('/catalogo/busqueda-avanzada', { params });
      const data = res.data || {};
      setBooks(data.libros || []);
      setTotalPages(data.total_paginas || 1);
      setTotalBooks(data.total || 0);
    } catch (err) {
      console.warn('[CatalogoPublico]', err?.message);
      ultimaBusquedaRef.current = null;
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [filtros, page, precioMaxReal]);

  useEffect(() => { cargarLibros(); }, [cargarLibros]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPage(1);
    ultimaBusquedaRef.current = null;
  };

  const limpiarFiltros = () => {
    setFiltros({ busqueda: '', categoria_id: null, categoria_nombre: null, nombre_tienda: '', correo_vendedor: '', precio_min: 0, precio_max: precioMaxReal, calificacion_min: 0, disponible: true, ordenar_por: 'relevancia' });
    setPage(1);
    ultimaBusquedaRef.current = null;
  };

  // ── Recibir filtros desde el modal del Header ────────────────────────────
  const handleFilterApply = (nuevosFiltros, tab) => {
    // Si el usuario está en el tab Librerías, aplicar los filtros de tienda
    // directamente en este catálogo — la API ya soporta nombre_tienda y correo_vendedor
    if (tab === 'librerias') {
      setFiltros(prev => ({
        ...prev,
        nombre_tienda:   nuevosFiltros.nombre_tienda   ?? '',
        correo_vendedor: nuevosFiltros.correo_vendedor ?? '',
        ordenar_por:     nuevosFiltros.ordenar_por     ?? prev.ordenar_por,
      }));
      setPage(1);
      ultimaBusquedaRef.current = null;
      return;
    }
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
    setPage(1);
    ultimaBusquedaRef.current = null;
  };

  // Contar filtros aplicados (igual que filtrosAplicados en FiltrosCatalogo.jsx)
  const filtrosAplicados = [
    filtros.busqueda !== '',
    filtros.categoria_id !== null || filtros.categoria_nombre !== null,
    filtros.nombre_tienda !== '',
    filtros.correo_vendedor !== '',
    filtros.precio_min > 0,
    filtros.precio_max < precioMaxReal,
    filtros.calificacion_min > 0,
    filtros.disponible !== true,
    filtros.ordenar_por !== 'relevancia',
  ].filter(Boolean).length;

  const renderItem = useCallback(({ item }) => (
    <LibroCard
      libro={item} BASE={BASE} cardWidth={cardWidth} coverHeight={coverHeight}
      onPress={() => navigation.navigate('BookDetailPublico', { book: item })}
    />
  ), [BASE, cardWidth, coverHeight, navigation]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={sc.safe}>
      {/* Header unificado — búsqueda + filtros modal + cámara */}
      <Header
        variant="public"
        navigation={navigation}
        showTopBar={false}
        onSearch={v => { setFiltro('busqueda', v); }}
        onBarcodeScanned={handleISBNDetectado}
        onFilterApply={handleFilterApply}
        filtrosActivos={filtrosAplicados}
      />

      {/* ── Barra de título + contador de resultados ── */}
      <View style={sc.topArea}>
        <Text style={sc.pageTitle}>
          {filtros.nombre_tienda
            ? `📚 ${filtros.nombre_tienda}`
            : '📚 Catálogo de libros'}
        </Text>
        {!loading && (
          <View style={sc.resultRow}>
            <Text style={sc.resultTxt}>
              {totalBooks > 0
                ? `${totalBooks.toLocaleString('es-CO')} libro${totalBooks !== 1 ? 's' : ''}`
                : 'Sin resultados'}
              {filtrosAplicados > 0 && (
                <Text style={{ color: PRIMARY }}>
                  {' '}· {filtrosAplicados} filtro{filtrosAplicados !== 1 ? 's' : ''} activo{filtrosAplicados !== 1 ? 's' : ''}
                </Text>
              )}
            </Text>
            {filtrosAplicados > 0 && (
              <TouchableOpacity onPress={limpiarFiltros}>
                <Text style={sc.limpiarLink}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── GRID DE LIBROS ────────────────────────────────────────────── */}
      {loading ? (
        <FlatList
          data={Array(8).fill(null)}
          key="skel"
          keyExtractor={(_, i) => `sk${i}`}
          renderItem={() => <CardSkeleton cardWidth={cardWidth} coverHeight={coverHeight} />}
          numColumns={COLS}
          columnWrapperStyle={[sc.colWrapper, { gap: GAP }]}
          contentContainerStyle={sc.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<Footer onLinkPress={() => {}} />}
        />
      ) : (
        <FlatList
          data={books}
          key={`cat-${COLS}`}
          keyExtractor={(item, i) => `${item.id_libro ?? i}-${i}`}
          renderItem={renderItem}
          numColumns={COLS}
          columnWrapperStyle={[sc.colWrapper, { gap: GAP }]}
          contentContainerStyle={sc.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={sc.emptyWrap}>
              <Text style={{ fontSize: 42, marginBottom: 12 }}>📖</Text>
              <Text style={sc.emptyTitle}>No se encontraron libros</Text>
              <Text style={sc.emptySub}>Prueba con otra búsqueda o ajusta los filtros.</Text>
              {filtrosAplicados > 0 && (
                <TouchableOpacity style={[sc.applyBtn, { marginTop: 16, paddingHorizontal: 24 }]} onPress={limpiarFiltros}>
                  <Text style={sc.applyBtnTxt}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            <>
              {totalPages > 1 && (
                <View style={sc.paginationRow}>
                  <TouchableOpacity style={[sc.pageBtn, page === 1 && { opacity: 0.4 }]}
                    onPress={() => { if (page > 1) { setPage(p => p - 1); ultimaBusquedaRef.current = null; } }}
                    disabled={page === 1}>
                    <Text style={sc.pageBtnTxt}>← Anterior</Text>
                  </TouchableOpacity>
                  <View style={sc.pageLbl}><Text style={sc.pageLblTxt}>Pág. {page}/{totalPages}</Text></View>
                  <TouchableOpacity style={[sc.pageBtn, sc.pageBtnPrimary, page >= totalPages && { opacity: 0.4 }]}
                    onPress={() => { if (page < totalPages) { setPage(p => p + 1); ultimaBusquedaRef.current = null; } }}
                    disabled={page >= totalPages}>
                    <Text style={[sc.pageBtnTxt, { color: PRIMARY, fontWeight: '700' }]}>Siguiente →</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Footer onLinkPress={link => console.log('Footer:', link)} />
            </>
          }
        />
      )}

    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
const st = StyleSheet.create({
  card:      { backgroundColor: WHITE, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d8cec6', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 5, elevation: 3 },
  cover:     { position: 'relative', backgroundColor: '#ECE9E4' },
  coverImg:  { width: '100%', height: '100%' },
  sinStock:  { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 },
  sinStockTxt:{ color: WHITE, fontSize: 9, fontWeight: '700' },
  impulso:   { position: 'absolute', bottom: 5, left: 5, backgroundColor: '#fbbf24', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  impulsoTxt:{ fontSize: 9, fontWeight: '700', color: '#78350f' },
  body:      { padding: 10 },
  catPill:   { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 5 },
  catTxt:    { fontSize: 9, fontWeight: '700' },
  title:     { fontSize: 12, fontWeight: '700', color: '#1a1a1a', lineHeight: 16, marginBottom: 3, minHeight: 28 },
  author:    { fontSize: 10, color: '#777', fontStyle: 'italic', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5, flexWrap: 'wrap' },
  rating:    { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
  stockPill: { backgroundColor: '#DCFCE7', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  stockPillOut:{ backgroundColor: '#FEE2E2' },
  stockTxt:  { color: '#16A34A', fontSize: 9, fontWeight: '700' },
  stockTxtOut:{ color: '#DC2626' },
  price:     { fontSize: 14, fontWeight: '800', color: PRIMARY, marginBottom: 2 },
  tiendaTxt: { fontSize: 9, color: '#8b8b8b', marginBottom: 7 },
  verBtn:    { backgroundColor: PRIMARY, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  verBtnTxt: { color: WHITE, fontSize: 11, fontWeight: '700' },
});

const sc = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: PRIMARY },

  // Área superior — título + resultados
  topArea:     { backgroundColor: WHITE, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  pageTitle:   { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  resultRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTxt:   { fontSize: 11, color: GRAY, fontWeight: '600' },
  limpiarLink: { fontSize: 11, color: PRIMARY, fontWeight: '700' },

  // Grid
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30, backgroundColor: BG },
  colWrapper:  { justifyContent: 'flex-start', marginBottom: 12 },

  // Vacío
  emptyWrap:  { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 6 },
  emptySub:   { fontSize: 14, color: GRAY, textAlign: 'center' },
  applyBtn:    { backgroundColor: PRIMARY, borderRadius: 6, height: 40, alignItems: 'center', justifyContent: 'center' },
  applyBtnTxt: { color: WHITE, fontSize: 13, fontWeight: '700' },

  // Paginación
  paginationRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  pageBtn:        { borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, paddingHorizontal: 14, paddingVertical: 10 },
  pageBtnPrimary: { borderColor: PRIMARY },
  pageBtnTxt:     { color: TEXT, fontSize: 13, fontWeight: '600' },
  pageLbl:        { minWidth: 90, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  pageLblTxt:     { color: '#333', fontSize: 13, fontWeight: '600' },
});
