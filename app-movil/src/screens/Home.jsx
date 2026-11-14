// src/screens/Home.jsx — Landing pública (usuario NO autenticado)
// Estructura idéntica al frontend web, adaptada a React Native.
//
// Secciones (mismo orden que el web):
//  1. HERO con carrusel de imágenes
//  2. STATS dinámicas
//  3. 4 CARRUSELES de libros (Recién llegados, Populares, Mejor calificados, Económicos)
//  4. LIBRERÍAS EN BOOKYHOME (siempre visible mientras carga o tiene datos)
//  5. ¿Por qué BookyHome? (beneficios)
//  6. Categorías + Ver catálogo completo
//  7. ¿Cómo funciona?
//  8. CTA librería
//  9. Footer
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { IconShield, IconTruck, IconBook } from '../components/Icons';
import api, {
  getCatalogoStats,
  getTiendasDestacadas,
  getApiBaseUrl,
} from '../services/api';
import CarruselAnimado from '../components/CarruselAnimado';

const { width: SW } = Dimensions.get('window');

const VINOTINTO  = '#7A1E3A';
const VINOTINTO2 = '#4B1E2F';
const BEIGE      = '#F0E8DB';
const WHITE      = '#FFFFFF';
const DARK       = '#2A2A2A';
const GRAY       = '#666';
const LIGHT_BG   = '#FAF8F6';

// ── Categorías ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Ficción',    img: require('../assets/ficcion.png') },
  { label: 'Romance',    img: require('../assets/romance.png') },
  { label: 'Historia',   img: require('../assets/historia.png') },
  { label: 'Ciencia',    img: require('../assets/ciencia.png') },
  { label: 'Poesía',     img: require('../assets/poesia.png') },
  { label: 'Filosofía',  img: require('../assets/filosofia.png') },
  { label: 'Arte',       img: require('../assets/arte.png') },
  { label: 'Biografía',  img: require('../assets/biografia.png') },
  { label: 'Infantil',   img: require('../assets/infantil.png') },
  { label: 'Tecnología', img: require('../assets/tecnologia.png') },
];

const FEATURES = [
  { Icon: IconShield, title: 'Compra Protegida',     desc: 'Tu dinero está seguro. Recibe el producto que esperabas o te devolvemos tu dinero.' },
  { Icon: IconTruck,  title: 'Envío a Todo el País', desc: 'Envío gratis en compras mayores a $30.000. Seguimiento en tiempo real.' },
  { Icon: IconBook,   title: 'Amplio Catálogo',      desc: 'Desde clásicos hasta novedades. Libros nuevos, usados y de colección.' },
];

const STEPS = [
  { num: '1', title: 'Regístrate gratis',  desc: 'Crea tu cuenta en minutos.',       color: VINOTINTO },
  { num: '2', title: 'Busca y compara',    desc: 'Precios, condiciones y reseñas.',  color: '#C5425A' },
  { num: '3', title: 'Compra seguro',      desc: 'Paga seguro y recibe en casa.',    color: VINOTINTO },
];

const HERO_IMAGES = [
  { uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80' },
  { uri: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80' },
  { uri: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80' },
  { uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80' },
];

const STATS_CONFIG = [
  { key: 'libros_disponibles',     label: 'Libros disponibles',    prefix: '+', dec: 0 },
  { key: 'librerias_asociadas',    label: 'Librerías asociadas',   prefix: '+', dec: 0 },
  { key: 'usuarios_activos',       label: 'Usuarios registrados',  prefix: '+', dec: 0 },
  { key: 'calificacion_promedio',  label: 'Calificación promedio', prefix: '',  dec: 1 },
];

function IconLibro()     { return <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2ZM12 6v12M8 10h4M8 14h3" /></Svg>; }
function IconLibreria()  { return <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Path d="M9 22V12h6v10" /></Svg>; }
function IconUsuarios()  { return <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87" /><Path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>; }
function IconEstrella()  { return <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Svg>; }

const STAT_ICONS   = [IconLibro, IconLibreria, IconUsuarios, IconEstrella];
const STAT_COLORS  = [VINOTINTO, '#C5425A', VINOTINTO, '#C5425A'];

// ── Parsear ciudad de tienda ──────────────────────────────────────────────────
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
  if (cn.includes('perei'))    return 'Pereira';
  if (cn.includes('bucaram'))  return 'Bucaramanga';
  if (cn.includes('maniz'))    return 'Manizales';
  return ciudad || 'Colombia';
}

const CARD_W = Math.floor((SW - 48) / 2);

// ── Logo de tienda con fallback a iniciales ───────────────────────────────────
function TiendaLogo({ tienda, base }) {
  const [err, setErr] = useState(false);
  const nombre = (tienda.nombre_tienda || '').replace(/Librer\?\?a/g, 'Librería');
  const logo = tienda.logo_url
    ? (tienda.logo_url.startsWith('http') ? tienda.logo_url : `${base}/${tienda.logo_url.replace(/^\//, '')}`)
    : null;
  const ini = nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
  return (
    <View style={s.tiendaLogoWrap}>
      {logo && !err
        ? <Image source={{ uri: logo }} style={s.tiendaLogoImg} resizeMode="cover" onError={() => setErr(true)} />
        : <Text style={s.tiendaIni}>{ini}</Text>
      }
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function Home({ navigation }) {
  const BASE = getApiBaseUrl();

  // ── Hero carousel ────────────────────────────────────────────────────────
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // ── Stats dinámicas (GET /catalogo/stats) ────────────────────────────────
  const [stats, setStats] = useState(null);
  useEffect(() => {
    getCatalogoStats().then(r => setStats(r.data || null)).catch(() => {});
  }, []);

  const fmtStat = (cfg) => {
    if (!stats) return '...';
    const v = stats[cfg.key];
    if (v == null) return '...';
    const n = Number(v);
    return cfg.dec > 0
      ? `${cfg.prefix}${n.toFixed(cfg.dec)}`
      : `${cfg.prefix}${n.toLocaleString('es-CO')}`;
  };

  // ── 4 carruseles de libros (GET /catalogo/busqueda-avanzada) ─────────────
  // Igual que CarruselPublico.jsx del frontend: { limite: 12, ordenar_por, pagina: 1 }
  const [secciones, setSecciones] = useState({
    recientes:   { libros: [], loading: true },
    populares:   { libros: [], loading: true },
    calificados: { libros: [], loading: true },
    economicos:  { libros: [], loading: true },
  });

  const fetchSeccion = useCallback(async (key, params) => {
    try {
      const res   = await api.get('/catalogo/busqueda-avanzada', { params: { limite: 12, ...params } });
      const libros = res.data?.libros || res.data || [];
      setSecciones(prev => ({ ...prev, [key]: { libros: Array.isArray(libros) ? libros : [], loading: false } }));
    } catch (err) {
      console.warn(`[Home] fetchSeccion ${key}:`, err?.message || err);
      setSecciones(prev => ({ ...prev, [key]: { libros: [], loading: false } }));
    }
  }, []);

  useEffect(() => {
    // queueMicrotask para no bloquear el render inicial (igual que el frontend)
    const t = setTimeout(() => {
      fetchSeccion('recientes',   { ordenar_por: 'recientes',    pagina: 1 });
      fetchSeccion('populares',   { ordenar_por: 'relevancia',   pagina: 1 });
      fetchSeccion('calificados', { ordenar_por: 'calificacion', pagina: 1 });
      fetchSeccion('economicos',  { ordenar_por: 'precio_asc',   pagina: 1 });
    }, 0);
    return () => clearTimeout(t);
  }, [fetchSeccion]);

  // ── Librerías destacadas (GET /tiendas/destacadas) ───────────────────────
  const [tiendas, setTiendas]         = useState([]);
  const [tiendasLoad, setTiendasLoad] = useState(true);

  useEffect(() => {
    getTiendasDestacadas()
      .then(r => {
        const data = r.data || [];
        setTiendas(Array.isArray(data) ? data : []);
      })
      .catch(() => setTiendas([]))
      .finally(() => setTiendasLoad(false));
  }, []);

  // Auto-scroll de librerías (igual que LibreriasDestacadas.jsx del frontend)
  const tiendasScrollRef = useRef(null);
  const tiendasOffset    = useRef(0);
  const tiendasHalf      = useRef(0);
  useEffect(() => {
    if (tiendasLoad || tiendas.length < 2) return;
    // ancho de card (148) + gap (10) = 158
    tiendasHalf.current = tiendas.length * 158;
    const id = setInterval(() => {
      if (!tiendasScrollRef.current) return;
      tiendasOffset.current += 0.5;
      if (tiendasOffset.current >= tiendasHalf.current) tiendasOffset.current = 0;
      tiendasScrollRef.current.scrollTo({ x: tiendasOffset.current, animated: false });
    }, 16);
    return () => clearInterval(id);
  }, [tiendasLoad, tiendas.length]);

  // ── Navegación ───────────────────────────────────────────────────────────
  const irACatalogo = (params = {}) => navigation.navigate('CatalogoPublico', params);
  const irALibrerias = () => navigation.navigate('Librerias');

  // ════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={s.safe}>
      <Header variant="public" navigation={navigation} showTopBar={true} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* ── 1. HERO ──────────────────────────────────────────────────── */}
        <LinearGradient colors={[VINOTINTO, DARK]} style={s.hero}>
          <View style={s.heroImgWrap}>
            <Image source={HERO_IMAGES[heroIdx]} style={s.heroImg} resizeMode="cover" />
            <View style={s.heroImgOverlay} />
            <TouchableOpacity style={[s.heroArrow, s.heroArrowL]}
              onPress={() => setHeroIdx(i => (i - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)}>
              <Text style={s.heroArrowTxt}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.heroArrow, s.heroArrowR]}
              onPress={() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length)}>
              <Text style={s.heroArrowTxt}>›</Text>
            </TouchableOpacity>
            <View style={s.heroDots}>
              {HERO_IMAGES.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setHeroIdx(i)}>
                  <View style={[s.heroDot, i === heroIdx && s.heroDotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>El marketplace que conecta lectores con librerías</Text>
            <Text style={s.heroSub}>Miles de títulos de las mejores librerías independientes del país. Todo en un solo lugar.</Text>
            <View style={s.heroButtons}>
              <TouchableOpacity style={s.heroBtnP} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
                <Text style={s.heroBtnPTxt}>Comenzar a comprar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.heroBtnS} onPress={() => navigation.navigate('RegisterLibrary')} activeOpacity={0.85}>
                <Text style={s.heroBtnSTxt}>Vender libros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* ── 2. STATS ─────────────────────────────────────────────────── */}
        <View style={s.statsSection}>
          <View style={s.statsGrid}>
            {STATS_CONFIG.map((cfg, i) => {
              const Icon = STAT_ICONS[i];
              return (
                <View key={i} style={s.statItem}>
                  <View style={[s.statCircle, { backgroundColor: STAT_COLORS[i] }]}>
                    <Icon />
                  </View>
                  <Text style={s.statVal}>{fmtStat(cfg)}</Text>
                  <Text style={s.statLbl}>{cfg.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── 3. CARRUSELES DE LIBROS ───────────────────────────────────── */}
        {/* Igual que CarruselPublico.jsx del frontend.
            onVerLibro navega al CatalogoPublico buscando por título.
            onVerTodos navega al CatalogoPublico con ordenar_por correcto. */}
        <View style={{ backgroundColor: LIGHT_BG, paddingTop: 4, paddingBottom: 4 }}>
          <CarruselAnimado
            emoji="🆕" titulo="Recién llegados"
            subtitulo="Los últimos títulos agregados al catálogo"
            accentColor={VINOTINTO}
            libros={secciones.recientes.libros}
            loading={secciones.recientes.loading}
            baseUrl={BASE}
            onVerLibro={libro => irACatalogo({ q: libro.titulo })}
            onVerTodos={() => irACatalogo({ ordenar_por: 'recientes' })}
          />
          <CarruselAnimado
            emoji="🔥" titulo="Los más populares"
            subtitulo="Lo que más están leyendo ahora mismo"
            accentColor="#e05c1a"
            libros={secciones.populares.libros}
            loading={secciones.populares.loading}
            baseUrl={BASE}
            onVerLibro={libro => irACatalogo({ q: libro.titulo })}
            onVerTodos={() => irACatalogo({ ordenar_por: 'relevancia' })}
          />
          <CarruselAnimado
            emoji="⭐" titulo="Mejor calificados"
            subtitulo="Los títulos con las mejores reseñas de lectores"
            accentColor="#b8860b"
            libros={secciones.calificados.libros}
            loading={secciones.calificados.loading}
            baseUrl={BASE}
            onVerLibro={libro => irACatalogo({ q: libro.titulo })}
            onVerTodos={() => irACatalogo({ ordenar_por: 'calificacion' })}
          />
          <CarruselAnimado
            emoji="💰" titulo="Desde los más económicos"
            subtitulo="Grandes lecturas sin gastar mucho"
            accentColor="#2e7d32"
            libros={secciones.economicos.libros}
            loading={secciones.economicos.loading}
            baseUrl={BASE}
            onVerLibro={libro => irACatalogo({ q: libro.titulo })}
            onVerTodos={() => irACatalogo({ ordenar_por: 'precio_asc' })}
          />
        </View>

        {/* ── 4. LIBRERÍAS EN BOOKYHOME ─────────────────────────────────── */}
        {/* Igual que LibreriasDestacadas.jsx del frontend.
            Siempre visible mientras carga (skeletons) o tiene datos.
            Si carga termina y no hay tiendas, no se muestra (igual que el frontend). */}
        {(tiendasLoad || tiendas.length > 0) && (
          <View style={s.tiendasSection}>
            {/* Cabecera con "Ver todas →" */}
            <View style={s.tiendasHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.tiendasTitle}>🏪 Librerías en BookyHome</Text>
                <Text style={s.tiendasSub}>Vendedores verificados con catálogo activo</Text>
              </View>
              <TouchableOpacity onPress={irALibrerias} activeOpacity={0.7}>
                <Text style={s.tiendasVerTodas}>Ver todas →</Text>
              </TouchableOpacity>
            </View>

            {/* Carrusel horizontal */}
            <ScrollView
              ref={tiendasScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={s.tiendasList}
            >
              {(tiendasLoad ? Array(6).fill(null) : [...tiendas, ...tiendas]).map((t, idx) =>
                t ? (
                  <TouchableOpacity
                    key={`${t.id_tienda}-${idx}`}
                    style={s.tiendaCard}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('PerfilTienda', { id_tienda: t.id_tienda })}
                  >
                    <TiendaLogo tienda={t} base={BASE} />
                    <Text style={s.tiendaCiudad}>📍 {parseCiudad(t)}</Text>
                    <Text style={s.tiendaNombre} numberOfLines={2}>
                      {(t.nombre_tienda || '').replace(/Librer\?\?a/g, 'Librería')}
                    </Text>
                    {/* Dirección (igual que lib-card__direccion del frontend) */}
                    {(t.direccion || '').trim().length > 0 && (
                      <Text style={s.tiendaDireccion} numberOfLines={1}>
                        {(t.direccion || '').split(',').slice(0, -1).join(',').trim() || t.direccion}
                      </Text>
                    )}
                    {/* Descripción (igual que lib-card__desc del frontend) */}
                    <Text style={s.tiendaDesc} numberOfLines={2}>
                      {(t.descripcion && !t.descripcion.includes('??'))
                        ? t.descripcion
                        : `Librería en ${parseCiudad(t)}. Catálogo activo.`}
                    </Text>
                    <View style={s.tiendaFooter}>
                      <Text style={s.tiendaLibros}>📚 {t.total_libros > 0 ? `${t.total_libros} ${t.total_libros === 1 ? 'libro' : 'libros'}` : '0 libros'}</Text>
                      {Number(t.calificacion_promedio || 0) > 0 && (
                        <Text style={s.tiendaCal}>⭐ {Number(t.calificacion_promedio).toFixed(1)}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ) : (
                  // Skeleton de carga
                  <View key={`sk-${idx}`} style={[s.tiendaCard, { opacity: 0.45 }]}>
                    <View style={[s.tiendaLogoWrap, { backgroundColor: '#d0b8c0' }]} />
                    <View style={{ width: '55%', height: 8,  borderRadius: 4, backgroundColor: '#ddd', marginBottom: 4 }} />
                    <View style={{ width: '90%', height: 10, borderRadius: 4, backgroundColor: '#ddd', marginBottom: 6 }} />
                    <View style={{ width: '75%', height: 8,  borderRadius: 4, backgroundColor: '#ddd', marginBottom: 8 }} />
                    <View style={{ width: '50%', height: 8,  borderRadius: 4, backgroundColor: '#ddd' }} />
                  </View>
                )
              )}
            </ScrollView>
          </View>
        )}

        {/* ── 5. ¿POR QUÉ BOOKYHOME? ───────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: BEIGE }]}>
          <Text style={s.sectionTitle}>¿Por qué elegir BookyHome?</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureCard}>
              <View style={s.featureIcon}>
                <f.Icon size={22} color={VINOTINTO} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── 6. CATEGORÍAS ─────────────────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: WHITE }]}>
          <Text style={s.sectionTitle}>Explora nuestras categorías</Text>
          <Text style={s.sectionSub}>Libros para todos los gustos y momentos</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={[s.catCard, { width: CARD_W }]}
                onPress={() => irACatalogo({ categoria: cat.label })}
                activeOpacity={0.85}
              >
                <ImageBackground source={cat.img} style={s.catBg} imageStyle={s.catImg} resizeMode="cover">
                  <View style={s.catOverlay} />
                  <Text style={s.catLabel}>{cat.label}</Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
          {/* "Ver catálogo completo" — igual que el <Link to="/catalogo"> del frontend */}
          <TouchableOpacity style={s.catBtn} onPress={() => irACatalogo({})} activeOpacity={0.85}>
            <Text style={s.catBtnTxt}>Ver catálogo completo</Text>
          </TouchableOpacity>
        </View>

        {/* ── 7. ¿CÓMO FUNCIONA? ────────────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: BEIGE }]}>
          <Text style={s.sectionTitle}>¿Cómo funciona?</Text>
          <View style={s.stepsRow}>
            {STEPS.map((step, i) => (
              <View key={i} style={s.stepItem}>
                <View style={[s.stepNum, { backgroundColor: step.color }]}>
                  <Text style={s.stepNumTxt}>{step.num}</Text>
                </View>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 8. CTA LIBRERÍA ───────────────────────────────────────────── */}
        <LinearGradient colors={[VINOTINTO, VINOTINTO2]} style={s.libCta}>
          <Text style={s.libCtaTitle}>¿Tienes una librería?</Text>
          <Text style={s.libCtaSub}>Únete a nuestra red y alcanza a miles de lectores en todo el país.</Text>
          <TouchableOpacity style={s.libCtaBtn} onPress={() => navigation.navigate('RegisterLibrary')} activeOpacity={0.85}>
            <Text style={s.libCtaBtnTxt}>Registrar mi librería</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── 9. FOOTER ─────────────────────────────────────────────────── */}
        <Footer onLinkPress={link => console.log('Footer:', link)} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: VINOTINTO },

  // Hero
  hero:           { paddingBottom: 24 },
  heroImgWrap:    { width: '100%', height: 200, position: 'relative' },
  heroImg:        { width: '100%', height: 200 },
  heroImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(74,12,28,0.42)' },
  heroArrow:      { position: 'absolute', top: '50%', marginTop: -22, width: 34, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 6 },
  heroArrowL:     { left: 8 },
  heroArrowR:     { right: 8 },
  heroArrowTxt:   { color: WHITE, fontSize: 28, fontWeight: '700', lineHeight: 34 },
  heroDots:       { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  heroDot:        { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.45)' },
  heroDotActive:  { backgroundColor: WHITE, width: 16 },
  heroText:       { paddingHorizontal: 20, paddingTop: 18 },
  heroTitle:      { color: WHITE, fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 10 },
  heroSub:        { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  heroButtons:    { flexDirection: 'column', gap: 10 },
  heroBtnP:       { backgroundColor: WHITE, borderRadius: 6, paddingVertical: 13, alignItems: 'center' },
  heroBtnPTxt:    { color: VINOTINTO, fontWeight: '800', fontSize: 15 },
  heroBtnS:       { borderWidth: 2, borderColor: WHITE, borderRadius: 6, paddingVertical: 13, alignItems: 'center' },
  heroBtnSTxt:    { color: WHITE, fontWeight: '700', fontSize: 15 },

  // Stats
  statsSection: { backgroundColor: WHITE, paddingVertical: 24, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0EBE5' },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  statItem:     { alignItems: 'center', width: '46%', marginVertical: 12 },
  statCircle:   { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statVal:      { fontSize: 21, fontWeight: '800', color: DARK },
  statLbl:      { fontSize: 12, color: GRAY, marginTop: 4, textAlign: 'center', fontWeight: '500' },

  // Librerías destacadas
  tiendasSection: { backgroundColor: WHITE, paddingTop: 20, paddingBottom: 18, borderTopWidth: 1, borderTopColor: '#EEE8E0' },
  tiendasHead:    { paddingHorizontal: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  tiendasTitle:   { fontSize: 15, fontWeight: '800', color: DARK },
  tiendasSub:     { fontSize: 12, color: GRAY, marginTop: 2 },
  tiendasVerTodas:{ fontSize: 12, fontWeight: '700', color: VINOTINTO, marginTop: 3 },
  tiendasList:    { paddingHorizontal: 16 },

  // Tarjeta de tienda (igual que .lib-card del frontend)
  tiendaCard:    { width: 160, backgroundColor: '#FAF8F6', borderRadius: 12, borderWidth: 1, borderColor: '#E2D8D0', padding: 12, marginRight: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tiendaLogoWrap:{ width: 54, height: 54, borderRadius: 27, backgroundColor: VINOTINTO, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 8, overflow: 'hidden' },
  tiendaLogoImg: { width: '100%', height: '100%' },
  tiendaIni:     { color: WHITE, fontSize: 17, fontWeight: '800' },
  tiendaCiudad:  { fontSize: 10, color: GRAY, marginBottom: 3, textAlign: 'center' },
  tiendaNombre:  { fontSize: 12, fontWeight: '700', color: DARK, marginBottom: 3, lineHeight: 15, textAlign: 'center' },
  tiendaDireccion:{ fontSize: 9, color: GRAY, marginBottom: 3, textAlign: 'center' },
  tiendaDesc:    { fontSize: 9, color: GRAY, marginBottom: 8, lineHeight: 13, textAlign: 'center' },
  tiendaFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE8E0', paddingTop: 6 },
  tiendaLibros:  { fontSize: 10, color: GRAY },
  tiendaCal:     { fontSize: 10, fontWeight: '700', color: '#ca8a04' },

  // Secciones genéricas
  section:      { paddingHorizontal: 16, paddingVertical: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: DARK, textAlign: 'center', marginBottom: 8 },
  sectionSub:   { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 20 },

  // Beneficios
  featureCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: WHITE, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  featureIcon:  { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FCE8EC', justifyContent: 'center', alignItems: 'center' },
  featureTitle: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 4 },
  featureDesc:  { fontSize: 12, color: GRAY, lineHeight: 18 },

  // Categorías
  catGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  catCard:    { height: 86, borderRadius: 12, overflow: 'hidden' },
  catBg:      { width: '100%', height: '100%', justifyContent: 'flex-end' },
  catImg:     { borderRadius: 12 },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 12 },
  catLabel:   { color: WHITE, fontWeight: '700', fontSize: 13, padding: 10 },
  catBtn:     { backgroundColor: VINOTINTO, paddingVertical: 14, borderRadius: 6, alignItems: 'center', marginTop: 12, width: '100%' },
  catBtnTxt:  { color: WHITE, fontWeight: '800', fontSize: 15 },

  // Pasos
  stepsRow:   { flexDirection: 'row', gap: 10, marginTop: 10 },
  stepItem:   { flex: 1, alignItems: 'center' },
  stepNum:    { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  stepNumTxt: { color: WHITE, fontSize: 20, fontWeight: '800' },
  stepTitle:  { fontSize: 12, fontWeight: '700', color: DARK, marginBottom: 4, textAlign: 'center' },
  stepDesc:   { fontSize: 11, color: GRAY, lineHeight: 16, textAlign: 'center' },

  // CTA librería
  libCta:      { paddingHorizontal: 24, paddingVertical: 34, alignItems: 'center' },
  libCtaTitle: { color: WHITE, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  libCtaSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  libCtaBtn:   { backgroundColor: WHITE, borderRadius: 6, paddingHorizontal: 28, paddingVertical: 13 },
  libCtaBtnTxt:{ color: VINOTINTO, fontWeight: '800', fontSize: 15 },
});
