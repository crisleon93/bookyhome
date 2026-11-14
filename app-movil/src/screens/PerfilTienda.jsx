// src/screens/PerfilTienda.jsx
// Perfil público de una librería — accesible sin login.
// Muestra banner, logo, info, tabs (Catálogo / Políticas y Horario).
// Los libros tienen botón "Ver detalles" que navega a BookDetailPublico.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPerfilTiendaPublico, getApiBaseUrl } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const VINOTINTO = '#7A1E3A';
const BEIGE     = '#F4EDE2';
const WHITE     = '#FFFFFF';
const CARBON    = '#2A2A2A';
const GRAY      = '#666';
const BORDER    = '#E2D8D0';
const BG        = '#FAF8F6';

function resolveImg(url, base) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${base}/${url.replace(/^\/+/, '')}`;
}

// ── Card de libro — igual al estilo de CatalogoPublico ───────────────────────
function LibroCard({ libro, base, cardWidth, coverHeight, onPress }) {
  const rawImg =
    libro.imagen_url || libro.imagen_principal || libro.imagen ||
    (Array.isArray(libro.imagenes) ? libro.imagenes[0] : null);
  const imgUri = resolveImg(rawImg, base);

  return (
    <View style={[s.bookCard, { width: cardWidth }]}>
      {imgUri ? (
        <Image source={{ uri: imgUri }} style={[s.bookImg, { height: coverHeight }]} resizeMode="cover" />
      ) : (
        <View style={[s.bookImg, s.bookImgPlaceholder, { height: coverHeight }]}>
          <Text style={{ fontSize: 32 }}>📚</Text>
        </View>
      )}

      <View style={s.bookInfo}>
        <Text style={s.bookTitle} numberOfLines={2}>{libro.titulo}</Text>
        <Text style={s.bookAuthor} numberOfLines={1}>{libro.autor_libro || libro.autor || ''}</Text>
        <Text style={s.bookPrice}>
          ${Number(libro.precio_libro || libro.precio || 0).toLocaleString('es-CO')}
        </Text>
      </View>

      <TouchableOpacity style={s.detailBtn} onPress={onPress} activeOpacity={0.85}>
        <Text style={s.detailBtnTxt}>Ver detalles</Text>
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function PerfilTienda({ route, navigation }) {
  const BASE = getApiBaseUrl();
  const { width: W } = useWindowDimensions();
  const GAP     = 12;
  const PADDING = 16;
  const COLS    = 2;
  const cardWidth   = (W - PADDING * 2 - GAP * (COLS - 1)) / COLS;
  const coverHeight = Math.round(cardWidth * 1.25);

  const id_tienda = route.params?.id_tienda;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('catalogo'); // 'catalogo' | 'politicas'

  useEffect(() => {
    if (!id_tienda) { setLoading(false); return; }
    getPerfilTiendaPublico(id_tienda)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id_tienda]);

  const irADetalle = useCallback((libro) => {
    navigation.navigate('BookDetailPublico', { book: libro });
  }, [navigation]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <Header variant="public" navigation={navigation} showTopBar={false} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={VINOTINTO} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error / no encontrada ─────────────────────────────────────────────────
  if (!data?.tienda) {
    return (
      <SafeAreaView style={s.safe}>
        <Header variant="public" navigation={navigation} showTopBar={false} />
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🏪</Text>
          <Text style={s.errorTitle}>Librería no encontrada</Text>
          <Text style={s.errorSub}>No pudimos cargar la información de esta tienda.</Text>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnTxt}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { tienda, configuracion, libros = [] } = data;

  const bannerUri = resolveImg(configuracion?.banner_url, BASE);
  const logoUri   = resolveImg(configuracion?.logo_url,   BASE);

  return (
    <SafeAreaView style={s.safe}>
      <Header variant="public" navigation={navigation} showTopBar={false} />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Botón volver ─────────────────────────────────────────────── */}
        <View style={s.backRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={s.backBtnTxt}>← Volver</Text>
          </TouchableOpacity>
        </View>

        {/* ── Banner ───────────────────────────────────────────────────── */}
        <View style={s.bannerWrap}>
          {bannerUri ? (
            <Image source={{ uri: bannerUri }} style={s.banner} resizeMode="cover" />
          ) : (
            <View style={[s.banner, { backgroundColor: VINOTINTO }]} />
          )}

          {/* Logo superpuesto */}
          <View style={s.logoRing}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={s.logo} resizeMode="cover" />
            ) : (
              <View style={[s.logo, s.logoPlaceholder]}>
                <Text style={s.logoInitial}>
                  {(tienda.nombre_tienda || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Info principal ────────────────────────────────────────────── */}
        <View style={s.infoSection}>
          <Text style={s.storeName}>{tienda.nombre_tienda}</Text>

          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map(i => {
              const avg = Number(tienda.calificacion_promedio || 0);
              return (
                <Text key={i} style={{ fontSize: 18, color: i <= Math.round(avg) ? '#ffc107' : '#e0e0e0' }}>★</Text>
              );
            })}
            <Text style={s.starsAvg}>
              {Number(tienda.calificacion_promedio || 0).toFixed(1)}
            </Text>
          </View>

          {configuracion?.descripcion ? (
            <Text style={s.description}>{configuracion.descripcion}</Text>
          ) : null}

          <View style={s.badgesRow}>
            {configuracion?.ciudad_origen ? (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>📍 {configuracion.ciudad_origen}</Text>
              </View>
            ) : null}
            {configuracion?.tiempo_despacho_dias ? (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>🚚 Despacha en {configuracion.tiempo_despacho_dias} días</Text>
              </View>
            ) : null}
            {libros.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>📚 {libros.length} libro{libros.length !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tabBtn, tab === 'catalogo' && s.tabBtnActive]}
            onPress={() => setTab('catalogo')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabTxt, tab === 'catalogo' && s.tabTxtActive]}>
              Catálogo ({libros.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tabBtn, tab === 'politicas' && s.tabBtnActive]}
            onPress={() => setTab('politicas')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabTxt, tab === 'politicas' && s.tabTxtActive]}>
              Políticas y Horario
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Contenido del tab ────────────────────────────────────────── */}
        {tab === 'catalogo' ? (
          <View style={s.catalogoSection}>
            {libros.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>📖</Text>
                <Text style={s.emptyTitle}>Sin libros publicados</Text>
                <Text style={s.emptySub}>Esta librería aún no tiene libros disponibles.</Text>
              </View>
            ) : (
              <View style={s.grid}>
                {libros.map(libro => (
                  <LibroCard
                    key={libro.id_libro}
                    libro={libro}
                    base={BASE}
                    cardWidth={cardWidth}
                    coverHeight={coverHeight}
                    onPress={() => irADetalle(libro)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={s.politicasSection}>
            {configuracion?.horario_atencion ? (
              <View style={s.policyBlock}>
                <Text style={s.policyTitle}>🕒 Horario de Atención</Text>
                <Text style={s.policyText}>{configuracion.horario_atencion}</Text>
              </View>
            ) : null}
            {configuracion?.politica_envios ? (
              <View style={s.policyBlock}>
                <Text style={s.policyTitle}>📦 Política de Envíos</Text>
                <Text style={s.policyText}>{configuracion.politica_envios}</Text>
              </View>
            ) : null}
            {configuracion?.politica_devoluciones ? (
              <View style={s.policyBlock}>
                <Text style={s.policyTitle}>↩️ Política de Devoluciones</Text>
                <Text style={s.policyText}>{configuracion.politica_devoluciones}</Text>
              </View>
            ) : null}
            {configuracion?.email_publico ? (
              <View style={s.policyBlock}>
                <Text style={s.policyTitle}>✉️ Contacto</Text>
                <Text style={s.policyText}>{configuracion.email_publico}</Text>
              </View>
            ) : null}
            {!configuracion?.horario_atencion &&
             !configuracion?.politica_envios &&
             !configuracion?.politica_devoluciones ? (
              <View style={s.emptyWrap}>
                <Text style={s.emptySub}>Esta tienda no ha especificado políticas públicas.</Text>
              </View>
            ) : null}
          </View>
        )}

        <Footer onLinkPress={() => {}} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: VINOTINTO },
  scroll: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: BG },

  // Volver
  backRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, backgroundColor: WHITE },
  backBtn: { alignSelf: 'flex-start', backgroundColor: VINOTINTO, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  backBtnTxt: { color: WHITE, fontSize: 13, fontWeight: '700' },

  // Error
  errorTitle: { fontSize: 18, fontWeight: '800', color: CARBON, marginBottom: 6 },
  errorSub:   { fontSize: 14, color: GRAY, textAlign: 'center', marginBottom: 20 },

  // Banner + logo
  bannerWrap: { height: 180, position: 'relative', marginBottom: 52 },
  banner:     { width: '100%', height: '100%' },
  logoRing: {
    position: 'absolute', bottom: -46, left: '50%', marginLeft: -48,
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: WHITE, padding: 3,
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6,
  },
  logo:            { width: '100%', height: '100%', borderRadius: 45 },
  logoPlaceholder: { backgroundColor: VINOTINTO, justifyContent: 'center', alignItems: 'center' },
  logoInitial:     { color: WHITE, fontSize: 34, fontWeight: '800' },

  // Info
  infoSection: { paddingHorizontal: 20, alignItems: 'center', paddingBottom: 16, backgroundColor: WHITE },
  storeName:   { fontSize: 22, fontWeight: '800', color: CARBON, textAlign: 'center', marginBottom: 8 },
  starsRow:    { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 },
  starsAvg:    { fontSize: 14, color: GRAY, fontWeight: '700', marginLeft: 6 },
  description: { fontSize: 14, color: GRAY, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  badgesRow:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 4 },
  badge:       { backgroundColor: BEIGE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeTxt:    { fontSize: 12, color: '#555', fontWeight: '600' },

  // Tabs
  tabRow:       { flexDirection: 'row', backgroundColor: WHITE, borderBottomWidth: 1, borderColor: BORDER },
  tabBtn:       { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: VINOTINTO },
  tabTxt:       { fontSize: 14, fontWeight: '600', color: '#999' },
  tabTxtActive: { color: VINOTINTO, fontWeight: '800' },

  // Grid de libros
  catalogoSection: { padding: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Card de libro
  bookCard: {
    backgroundColor: WHITE,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 4,
  },
  bookImg:            { width: '100%', resizeMode: 'cover' },
  bookImgPlaceholder: { backgroundColor: BEIGE, alignItems: 'center', justifyContent: 'center' },
  bookInfo:           { padding: 10 },
  bookTitle:          { fontSize: 13, fontWeight: '700', color: CARBON, marginBottom: 3, lineHeight: 18 },
  bookAuthor:         { fontSize: 11, color: GRAY, marginBottom: 5 },
  bookPrice:          { fontSize: 15, fontWeight: '800', color: VINOTINTO },
  detailBtn: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: VINOTINTO,
    borderRadius: 7,
    paddingVertical: 9,
    alignItems: 'center',
  },
  detailBtnTxt: { color: WHITE, fontSize: 13, fontWeight: '700' },

  // Vacío
  emptyWrap:  { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: CARBON, marginBottom: 6 },
  emptySub:   { fontSize: 14, color: GRAY, textAlign: 'center' },

  // Políticas
  politicasSection: { padding: 20 },
  policyBlock:      { marginBottom: 22 },
  policyTitle:      { fontSize: 16, fontWeight: '700', color: CARBON, marginBottom: 8 },
  policyText:       { fontSize: 14, color: GRAY, lineHeight: 22 },
});
