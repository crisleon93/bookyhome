// src/components/CarruselAnimado.jsx
//
// Carrusel horizontal que:
//  - Renderiza los items en un ScrollView (NO FlatList — que no funciona
//    anidado dentro de otro ScrollView/FlatList en React Native).
//  - Duplica la lista para crear efecto "loop" infinito.
//  - Avanza automáticamente con setInterval a ~28px/s (igual que el web).
//  - Permite scroll manual interrumpiendo el auto-scroll mientras el
//    usuario toca y retomándolo al soltar.
//
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TICK_MS    = 16;   // ~60 fps
const SPEED_PX_S = 38;   // píxeles por segundo (similar al web 28px/s pero más visible en móvil)
const STEP       = (SPEED_PX_S * TICK_MS) / 1000; // px por tick

// ── Helpers de imagen ────────────────────────────────────────────────────────
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
const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=70';

export function resolveImgUri(libro, baseUrl) {
  const candidates = [libro.imagen_url, libro.imagen_principal, libro.imagen];
  for (const c of candidates) {
    if (!c) continue;
    const s = typeof c === 'string' ? c.split(',')[0].trim() : '';
    if (!s) continue;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    return `${baseUrl}/${s.replace(/^\//, '')}`;
  }
  return IMAGENES_CAT[libro.nombre_categoria] || IMG_DEFAULT;
}

// ── Color badge de categoría ─────────────────────────────────────────────────
export function categoriaColor(cat = '') {
  const t = (cat || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
  return { bg: '#f4eef0', color: '#7A1E3A' };
}

// ════════════════════════════════════════════════════════════════════════════
// TARJETA DE LIBRO (interna — no exportar para no romper imports existentes)
// ════════════════════════════════════════════════════════════════════════════
function LibroCardInterna({ libro, onPress, baseUrl, cardWidth, coverHeight }) {
  const [imgUri, setImgUri] = useState(() => resolveImgUri(libro, baseUrl));
  const cat   = libro.nombre_categoria || '';
  const price = Number(libro.precio_libro ?? libro.precio ?? 0);
  const { bg: catBg, color: catColor } = categoriaColor(cat);
  const rating = Number(libro.calificacion_tienda || libro.calificacion_promedio || libro.calificacion || 0);
  const sinStock = Number(libro.stock ?? 1) <= 0;

  return (
    <View
      style={[c.card, { width: cardWidth }]}
    >
      {/* Portada */}
      <View style={[c.cover, { height: coverHeight }]}>
        <Image
          source={{ uri: imgUri }}
          style={c.coverImg}
          resizeMode="cover"
          onError={() => setImgUri(IMAGENES_CAT[cat] || IMG_DEFAULT)}
        />
        {sinStock && (
          <View style={c.sinStockBadge}>
            <Text style={c.sinStockText}>Sin stock</Text>
          </View>
        )}
        {libro.es_impulsado && (
          <View style={c.impulsoBadge}>
            <Text style={c.impulsoText}>⭐ Dest.</Text>
          </View>
        )}
      </View>

      {/* Cuerpo */}
      <View style={c.body}>
        {cat ? (
          <View style={[c.catPill, { backgroundColor: catBg }]}>
            <Text style={[c.catPillText, { color: catColor }]} numberOfLines={1}>{cat}</Text>
          </View>
        ) : null}
        <Text style={c.title} numberOfLines={2}>{libro.titulo || 'Sin título'}</Text>
        <Text style={c.author} numberOfLines={1}>{libro.autor_libro || libro.autor || ''}</Text>
        {rating > 0 && <Text style={c.rating}>★ {rating.toFixed(1)}</Text>}
        <Text style={c.price}>${price.toLocaleString('es-CO')}</Text>
        {libro.nombre_tienda ? (
          <Text style={c.tienda} numberOfLines={1}>{libro.nombre_tienda}</Text>
        ) : null}
        <TouchableOpacity style={c.detailsButton} onPress={onPress} activeOpacity={0.8}>
          <Text style={c.detailsButtonText}>Ver detalles</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ cardWidth, coverHeight }) {
  return (
    <View style={[c.card, { width: cardWidth, opacity: 0.45 }]}>
      <View style={[c.cover, { height: coverHeight, backgroundColor: '#ddd' }]} />
      <View style={c.body}>
        <View style={{ width: '55%', height: 7, borderRadius: 4, backgroundColor: '#ddd', marginBottom: 5 }} />
        <View style={{ width: '90%', height: 9, borderRadius: 4, backgroundColor: '#ddd', marginBottom: 4 }} />
        <View style={{ width: '65%', height: 7, borderRadius: 4, backgroundColor: '#ddd', marginBottom: 8 }} />
        <View style={{ width: '40%', height: 11, borderRadius: 4, backgroundColor: '#ddd' }} />
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CARRUSEL ANIMADO — componente principal exportado
//
// Props:
//   libros       — array de libros
//   loading      — boolean, muestra skeletons mientras carga
//   onVerLibro   — callback(libro) al pulsar una tarjeta
//   onVerTodos   — callback() al pulsar "Ver todos"
//   emoji        — string emoji para el título
//   headerIcon    — icono React Native para el título (prioriza el estilo web)
//   titulo       — string
//   subtitulo    — string (opcional)
//   accentColor  — color del texto "Ver todos"
//   baseUrl      — base URL para resolver imágenes relativas
//   cardWidth    — ancho de cada tarjeta (default 148)
//   cardGap      — separación entre tarjetas (default 10)
// ════════════════════════════════════════════════════════════════════════════
export default function CarruselAnimado({
  libros = [],
  loading = false,
  onVerLibro,
  onVerTodos,
  emoji = '📚',
  headerIcon = null,
  titulo = '',
  subtitulo = '',
  accentColor = '#7A1E3A',
  baseUrl = '',
  cardWidth = 148,
  cardGap = 10,
  // debug — poner true temporalmente para ver logs en consola
  debug = false,
}) {
  // Log de depuración para ver si los datos llegan
  if (debug) {
    console.log(`[CarruselAnimado] ${titulo} — loading:${loading} libros:${libros.length}`);
  }
  const scrollRef    = useRef(null);
  const offsetRef    = useRef(0);
  const intervalRef  = useRef(null);
  const pausedRef    = useRef(false);   // true mientras el usuario toca

  // Altura de la portada proporcional al ancho
  const coverHeight = Math.round(cardWidth * 1.15);

  // Duplicamos la lista para el efecto loop — igual que el web
  const items = loading
    ? Array(8).fill(null)
    : libros.length > 0 ? [...libros, ...libros] : [];

  // Ancho total del primer "tramo" (mitad del track duplicado)
  // Se recalcula cuando tenemos items reales
  const halfWidthRef = useRef(0);

  useEffect(() => {
    if (!loading && libros.length > 0) {
      halfWidthRef.current = libros.length * (cardWidth + cardGap);
    }
  }, [loading, libros.length, cardWidth, cardGap]);

  // ── Auto-scroll con setInterval ──────────────────────────────────────────
  const startScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      if (!scrollRef.current) return;

      offsetRef.current += STEP;

      const half = halfWidthRef.current;
      if (half > 0 && offsetRef.current >= half) {
        // Loop: volver al inicio sin animación
        offsetRef.current = offsetRef.current - half;
        scrollRef.current.scrollTo({ x: offsetRef.current, animated: false });
      } else {
        scrollRef.current.scrollTo({ x: offsetRef.current, animated: false });
      }
    }, TICK_MS);
  }, []);

  const stopScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!loading && libros.length > 1) {
      // Pequeño delay para que el ScrollView ya tenga su layout
      const t = setTimeout(startScroll, 600);
      return () => {
        clearTimeout(t);
        stopScroll();
      };
    }
    return stopScroll;
  }, [loading, libros.length, startScroll, stopScroll]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={r.section}>
      {/* Encabezado */}
      <View style={r.head}>
        <View style={r.headTitle}>
          {headerIcon ? <View style={r.iconBox}>{headerIcon}</View> : null}
          <View style={{ flex: 1 }}>
            <Text style={r.titulo}>{headerIcon ? titulo : `${emoji}  ${titulo}`}</Text>
            {subtitulo ? <Text style={r.subtitulo}>{subtitulo}</Text> : null}
          </View>
        </View>
        {onVerTodos && (
          <TouchableOpacity onPress={onVerTodos} activeOpacity={0.7}>
            <Text style={[r.verTodos, { color: accentColor }]}>Ver todos →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Track */}
      {items.length === 0 && !loading ? (
        <View style={r.empty}>
          <Text style={r.emptyText}>Sin libros disponibles</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={[r.track, { paddingHorizontal: 16 }]}
          // Pausar auto-scroll mientras el usuario interactúa
          onScrollBeginDrag={() => { pausedRef.current = true; }}
          onScrollEndDrag={() => {
            pausedRef.current = false;
            // Sincronizar offset con la posición actual
          }}
          onScroll={e => {
            if (pausedRef.current) {
              offsetRef.current = e.nativeEvent.contentOffset.x;
            }
          }}
        >
          {items.map((item, idx) =>
            item ? (
              <View key={`${item.id_libro ?? idx}-${idx}`} style={{ marginRight: cardGap }}>
                <LibroCardInterna
                  libro={item}
                  baseUrl={baseUrl}
                  cardWidth={cardWidth}
                  coverHeight={coverHeight}
                  onPress={() => onVerLibro && onVerLibro(item)}
                />
              </View>
            ) : (
              <View key={`sk-${idx}`} style={{ marginRight: cardGap }}>
                <Skeleton cardWidth={cardWidth} coverHeight={coverHeight} />
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ════════════════════════════════════════════════════════════════════════════
const c = StyleSheet.create({
  // Tarjeta
  card:   { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E2D8D0', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
  cover:  { position: 'relative', backgroundColor: '#E8DDD5' },
  coverImg:{ width: '100%', height: '100%' },
  sinStockBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  sinStockText:  { fontSize: 9, fontWeight: '700', color: '#fff' },
  impulsoBadge:  { position: 'absolute', bottom: 5, left: 5, backgroundColor: '#fbbf24', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  impulsoText:   { fontSize: 9, fontWeight: '700', color: '#78350f' },
  body:     { padding: 8 },
  catPill:  { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  catPillText: { fontSize: 9, fontWeight: '700' },
  title:    { fontSize: 11, fontWeight: '700', color: '#1a1a1a', lineHeight: 14, marginBottom: 3, minHeight: 28 },
  author:   { fontSize: 10, color: '#888', marginBottom: 3, fontStyle: 'italic' },
  rating:   { fontSize: 10, color: '#f59e0b', fontWeight: '700', marginBottom: 3 },
  price:    { fontSize: 13, fontWeight: '800', color: '#7A1E3A', marginBottom: 2 },
  tienda:   { fontSize: 9, color: '#7A1E3A', fontWeight: '600', opacity: 0.85 },
  detailsButton: { backgroundColor: '#7A1E3A', borderRadius: 6, alignItems: 'center', paddingVertical: 7, marginTop: 8 },
  detailsButtonText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

const r = StyleSheet.create({
  section:   { paddingTop: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE8E0' },
  head:      { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, marginBottom: 14, gap: 12 },
  headTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:   { width: 40, height: 40, borderRadius: 10, backgroundColor: '#7A1E3A', alignItems: 'center', justifyContent: 'center' },
  titulo:    { fontSize: 15, fontWeight: '800', color: '#2A2A2A' },
  subtitulo: { fontSize: 12, color: '#888', marginTop: 2 },
  verTodos:  { fontSize: 12, fontWeight: '700', marginTop: 2 },
  track:     { alignItems: 'flex-start' },
  empty:     { paddingHorizontal: 16, paddingVertical: 20 },
  emptyText: { color: '#999', fontSize: 13 },
});
