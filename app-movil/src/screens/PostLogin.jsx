// src/screens/PostLogin.jsx — Dashboard del comprador autenticado
// Estructura idéntica al SeccionInicio.jsx del frontend:
//   1. Hero saludo
//   2. Cupones de Descuento — carrusel animado de tarjetas con código copiable
//   3. Recién llegados
//   4. Últimas compras (con badge de estado colorido)
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Clipboard,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Polyline } from 'react-native-svg';
import {
  getCuponesDisponibles,
  getOrdenes,
  getApiBaseUrl,
  getBusquedaAvanzada,
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import Header from '../components/Header';
import {
  IconBook, IconCart, IconBookOpen,
} from '../components/Icons';
import CarruselAnimado from '../components/CarruselAnimado';

// ── Paleta (idéntica al frontend) ─────────────────────────────────────────────
const VINOTINTO  = '#7A1E3A';
const VINOTINTO2 = '#9B2648';
const BEIGE      = '#F4EDE2';
const WHITE      = '#FFFFFF';
const CARBON     = '#2A2A2A';
const GRAY       = '#888';
const LIGHT_BG   = '#FAF8F6';
const BORDER     = '#E2D8D0';
const ORANGE     = '#E37A24';  // badge de tienda en cupones
const COUPON_TYPE_OPTIONS = [
  ['todos', 'Todos'], ['globales', 'Globales'], ['tienda', 'Por tienda'],
  ['fijo', 'Valor fijo'], ['porcentaje', 'Porcentaje'],
];
const EXPIRATION_OPTIONS = [
  ['todos', 'Cualquier vencimiento'], ['vigentes', 'Vigentes'], ['proximos', 'Vencen en 7 días'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function resolveImg(url, base) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${base}/${url.replace(/^\/+/, '')}`;
}

function getEstadoBadgeStyle(estado) {
  const e = String(estado || '').toLowerCase().trim();
  if (e.includes('entreg'))  return { bg: '#FDF2F4', color: '#7A1E3A', border: '#F8D2DA' };
  if (e.includes('pagad') || e.includes('aprob')) return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
  if (e.includes('enviad') || e.includes('transit')) return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
  if (e.includes('cancel'))  return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
  return { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
}

// ── Ícono de ticket (cupón) — igual al frontend ───────────────────────────────
function IconTicket() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={WHITE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 5v2"/>
      <Path d="M15 11v2"/>
      <Path d="M15 17v2"/>
      <Path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/>
    </Svg>
  );
}

function IconCopy() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={GRAY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </Svg>
  );
}

function IconCheck() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="green" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12"/>
    </Svg>
  );
}

// ── Tarjeta de cupón (idéntica al frontend) ───────────────────────────────────
function CuponCard({ cupon, copiedCode, onCopy, compact = false }) {
  const isFijo    = cupon.tipo_descuento === 'fijo';
  const valFormato = isFijo
    ? `$${Number(cupon.valor_descuento).toLocaleString('es-CO')}`
    : `${Number(cupon.valor_descuento)}%`;

  return (
    <View style={[s.cuponCard, compact && s.cuponCardCompact]}>
      {/* Badge de tienda o global */}
      <View style={[s.cuponBadge, compact && s.cuponBadgeCompact, { backgroundColor: cupon.nombre_tienda ? ORANGE : VINOTINTO }]}>
        <Text style={[s.cuponBadgeTxt, compact && s.cuponBadgeTxtCompact]} numberOfLines={1}>
          {cupon.nombre_tienda ? `Tienda: ${cupon.nombre_tienda}` : 'Global BookyHome'}
        </Text>
      </View>

      {/* Valor + descuento */}
      <Text style={[s.cuponValor, compact && s.cuponValorCompact]} numberOfLines={1}>
        {valFormato}{' '}
        <Text style={s.cuponDcto}>Dcto.</Text>
      </Text>

      {/* Compra mínima */}
      {cupon.minimo_compra > 0 && (
        <Text style={[s.cuponMin, compact && s.cuponDetailCompact]} numberOfLines={compact ? 2 : undefined}>
          Compra mínima:{' '}
          <Text style={{ fontWeight: '700' }}>
            ${Number(cupon.minimo_compra).toLocaleString('es-CO')}
          </Text>
        </Text>
      )}

      {/* Fecha de vencimiento */}
      {cupon.fecha_fin ? (
        <Text style={[s.cuponFecha, compact && s.cuponDetailCompact]} numberOfLines={compact ? 2 : undefined}>
          Válido hasta:{' '}
          {new Date(cupon.fecha_fin).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      ) : null}

      {/* Código copiable */}
      <TouchableOpacity
        style={[s.cuponCodigo, compact && s.cuponCodigoCompact]}
        onPress={() => onCopy(cupon.codigo_cupon)}
        activeOpacity={0.75}
      >
        <Text style={[s.cuponCodigoTxt, compact && s.cuponCodigoTxtCompact]} numberOfLines={1}>{cupon.codigo_cupon}</Text>
        {copiedCode === cupon.codigo_cupon ? <IconCheck /> : <IconCopy />}
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function PostLogin({ navigation }) {
  const { signOut, user } = useContext(AuthContext);
  const { cart }          = useContext(CartContext);
  const BASE              = getApiBaseUrl();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [cupones,       setCupones]       = useState([]);
  const [copiedCode,    setCopiedCode]    = useState(null);
  const [showAllCupones,setShowAllCupones]= useState(false);
  const [cuponSearch,   setCuponSearch]   = useState('');
  const [cuponFilter,   setCuponFilter]   = useState('todos');
  const [expirationFilter, setExpirationFilter] = useState('todos');
  const [openCouponSelect, setOpenCouponSelect] = useState(null);
  const [ultimasCompras,setUltimasCompras]= useState([]);
  const [secciones,     setSecciones]     = useState({
    recientes:   { libros: [], loading: true },
  });
  const cuponesScrollRef = useRef(null);
  const cuponesOffset    = useRef(0);
  const cuponesPaused    = useRef(false);

  const cartCount = cart.reduce((s, i) => s + (i.cantidad || 1), 0);

  useEffect(() => {
    // Cupones + últimas compras
    getCuponesDisponibles()
      .then(r => setCupones(
        (r.data || []).sort((a, b) => {
          if (!a.fecha_fin) return 1;
          if (!b.fecha_fin) return -1;
          return new Date(a.fecha_fin) - new Date(b.fecha_fin);
        })
      ))
      .catch(() => setCupones([]));

    getOrdenes()
      .then(r => {
        const orders = r.data?.orders || r.data || [];
        setUltimasCompras(orders.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const fetchSeccion = useCallback(async (key, ordenar_por) => {
    try {
      const res  = await getBusquedaAvanzada({ ordenar_por, limite: 12, pagina: 1 });
      const data = res.data || {};
      setSecciones(prev => ({ ...prev, [key]: { libros: data.libros || [], loading: false } }));
    } catch {
      setSecciones(prev => ({ ...prev, [key]: { libros: [], loading: false } }));
    }
  }, []);

  useEffect(() => {
    fetchSeccion('recientes',   'recientes');
  }, [fetchSeccion]);

  useEffect(() => {
    if (cupones.length < 2) return undefined;
    const half = cupones.length * (220 + 14);
    const id = setInterval(() => {
      if (cuponesPaused.current || !cuponesScrollRef.current) return;
      cuponesOffset.current += 0.6;
      if (cuponesOffset.current >= half) cuponesOffset.current -= half;
      cuponesScrollRef.current.scrollTo({ x: cuponesOffset.current, animated: false });
    }, 16);
    return () => clearInterval(id);
  }, [cupones.length]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const irACatalogo = (params = {}) => navigation.navigate('Catalogo', params);

  const handleCopy = async (code) => {
    try {
      Clipboard.setString(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {}
  };

  const cuponesFiltrados = cupones.filter(cupon => {
    const search = `${cupon.codigo_cupon} ${cupon.nombre_tienda || ''}`.toLowerCase();
    const matchesSearch = search.includes(cuponSearch.trim().toLowerCase());
    const matchesType = cuponFilter === 'todos'
      || (cuponFilter === 'globales' && !cupon.nombre_tienda)
      || (cuponFilter === 'tienda' && Boolean(cupon.nombre_tienda))
      || (cuponFilter === 'fijo' && cupon.tipo_descuento === 'fijo')
      || (cuponFilter === 'porcentaje' && cupon.tipo_descuento !== 'fijo');
    const expiresAt = cupon.fecha_fin ? new Date(cupon.fecha_fin) : null;
    const daysUntilExpiration = expiresAt ? (expiresAt - new Date()) / 86400000 : Infinity;
    const matchesExpiration = expirationFilter === 'todos'
      || (expirationFilter === 'vigentes' && daysUntilExpiration >= 0)
      || (expirationFilter === 'proximos' && daysUntilExpiration >= 0 && daysUntilExpiration <= 7);
    return matchesSearch && matchesType && matchesExpiration;
  });

  // Saludo dinámico
  const nombre = user?.nombre?.split(' ')[0] || user?.email?.split('@')[0] || 'lector';
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  // ════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={s.safe}>
      <Header
        variant="dashboard"
        navigation={navigation}
        onSignOut={signOut}
        onSearch={text => { if (text.trim()) navigation.navigate('Catalogo', { q: text.trim() }); }}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: LIGHT_BG }}>

        {/* ── 1. HERO ──────────────────────────────────────────────────── */}
        <View style={s.heroWrap}>
          <LinearGradient colors={[VINOTINTO, '#3a0d1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            {/* círculos decorativos */}
            <View style={s.heroCircle1} />
            <View style={s.heroCircle2} />

            <View style={s.heroContent}>
              <View style={s.heroText}>
                <Text style={s.heroSaludo}>{saludo},</Text>
                <Text style={s.heroNombre}>{nombre} 👋</Text>
                <Text style={s.heroSub}>
                  ¿Qué quieres leer hoy? Miles de títulos de las mejores librerías.
                </Text>
                <TouchableOpacity style={s.heroPBtn} onPress={() => irACatalogo({})} activeOpacity={0.9}>
                  <Text style={s.heroPBtnTxt}>Explorar catálogo</Text>
                </TouchableOpacity>
              </View>
              <View style={s.heroIconCircle}>
                <IconBookOpen size={40} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── 2. CUPONES DE DESCUENTO ───────────────────────────────────── */}
        {cupones.length > 0 && (
          <View style={s.card}>
            {/* Encabezado */}
            <View style={s.cardHeader}>
              <View style={s.cardIconBox}>
                <IconTicket />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Cupones de Descuento</Text>
                <Text style={s.cardSubtitle}>Aprovecha estos códigos especiales en tu próxima compra</Text>
              </View>
              <TouchableOpacity
                style={s.verTodosBtn}
                onPress={() => setShowAllCupones(true)}
                activeOpacity={0.8}
              >
                <Text style={s.verTodosTxt}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {/* Carrusel de tarjetas */}
            <ScrollView
              ref={cuponesScrollRef}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.cuponesScroll}
              onScrollBeginDrag={() => { cuponesPaused.current = true; }}
              onScroll={event => {
                if (cuponesPaused.current) {
                  cuponesOffset.current = event.nativeEvent.contentOffset.x;
                }
              }}
              onScrollEndDrag={() => { cuponesPaused.current = false; }}
              onMomentumScrollEnd={() => { cuponesPaused.current = false; }}
            >
              {(cupones.length > 1 ? [...cupones, ...cupones] : cupones).map((c, index) => (
                <CuponCard
                  key={`${c.id_cupon}-${index}`}
                  cupon={c}
                  copiedCode={copiedCode}
                  onCopy={handleCopy}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── 3. RECIÉN LLEGADOS ────────────────────────────────────────── */}
        <View style={{ paddingTop: 8, paddingBottom: 4 }}>
          <CarruselAnimado
            headerIcon={<IconBookOpen size={20} color={WHITE} />} titulo="Recién llegados"
            subtitulo="Los últimos títulos agregados al catálogo"
            accentColor={VINOTINTO}
            libros={secciones.recientes.libros}
            loading={secciones.recientes.loading}
            baseUrl={BASE}
            onVerLibro={libro => navigation.navigate('BookDetail', { book: libro })}
            onVerTodos={() => irACatalogo({ ordenar_por: 'recientes' })}
          />
        </View>

        {/* ── 4. ÚLTIMAS COMPRAS ───────────────────────────────────────── */}
        {ultimasCompras.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardIconBox, { backgroundColor: VINOTINTO2 }]}>
                <IconBook size={20} color={WHITE} />
              </View>
              <Text style={[s.cardTitle, { flex: 1 }]}>Tus últimas compras</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')} activeOpacity={0.8}>
                <Text style={s.verTodosTxt}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              {ultimasCompras.map((orden, idx) => {
                const libros      = orden.libros || orden.items || orden.productos || orden.detalles || [];
                const primerLibro = Array.isArray(libros) && libros.length > 0 ? libros[0] : null;
                const rawImg      = primerLibro?.imagen_url || primerLibro?.imagen || primerLibro?.portada || orden.imagen;
                const imgUri      = resolveImg(rawImg, BASE);
                const titulo      = primerLibro?.titulo || primerLibro?.nombre_libro ||
                                    (Array.isArray(libros) && libros.length > 0
                                      ? `${libros.length} libro${libros.length > 1 ? 's' : ''}`
                                      : 'Compra');
                const estado      = orden.estado || orden.estado_orden || 'Procesando';
                const badge       = getEstadoBadgeStyle(estado);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={s.purchaseRow}
                    onPress={() => navigation.navigate('History')}
                    activeOpacity={0.85}
                  >
                    {/* Miniatura */}
                    <LinearGradient colors={[VINOTINTO, VINOTINTO2]} style={s.purchaseThumb}>
                      {imgUri
                        ? <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        : <Text style={{ fontSize: 22, color: WHITE }}>📖</Text>}
                      {Array.isArray(libros) && libros.length > 1 && (
                        <View style={s.purchaseThumbBadge}>
                          <Text style={s.purchaseThumbBadgeTxt}>+{libros.length - 1}</Text>
                        </View>
                      )}
                    </LinearGradient>

                    {/* Info */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.purchaseTitulo} numberOfLines={1}>{titulo}</Text>
                      <View style={[s.estadoBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Text style={[s.estadoBadgeTxt, { color: badge.color }]}>{estado}</Text>
                      </View>
                      <Text style={s.purchaseMeta}>Pedido #{orden.id_orden || orden.id || idx + 1}</Text>
                    </View>

                    {/* Precio + flecha */}
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={s.purchasePrecio}>
                        ${Number(orden.total ?? 0).toLocaleString('es-CO')}
                      </Text>
                      <View style={s.purchaseArrow}>
                        <Text style={{ color: VINOTINTO, fontSize: 14, fontWeight: '700' }}>›</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      <Modal
        visible={showAllCupones}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllCupones(false)}
      >
        <SafeAreaView style={s.cuponesModalSafe}>
          <View style={s.cuponesModalHeader}>
            <Text style={s.cuponesModalTitle}>Todos los cupones</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar cupones"
              style={s.cuponesModalClose}
              onPress={() => setShowAllCupones(false)}
            >
              <Text style={s.cuponesModalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.cuponesModalContent} keyboardShouldPersistTaps="handled">
            <TextInput
              value={cuponSearch}
              onChangeText={setCuponSearch}
              placeholder="Buscar por código o tienda"
              placeholderTextColor="#999"
              style={s.cuponSearchInput}
            />

            <View style={s.cuponSelectRow}>
              <View style={s.cuponSelectWrap}>
                <TouchableOpacity
                  style={s.cuponSelect}
                  onPress={() => setOpenCouponSelect(openCouponSelect === 'type' ? null : 'type')}
                >
                  <Text style={s.cuponSelectText} numberOfLines={1}>
                    {COUPON_TYPE_OPTIONS.find(([value]) => value === cuponFilter)?.[1] || 'Todos'}
                  </Text>
                  <Text style={s.cuponSelectChevron}>⌄</Text>
                </TouchableOpacity>
                {openCouponSelect === 'type' && (
                  <View style={s.cuponSelectOptions}>
                    {COUPON_TYPE_OPTIONS.map(([value, label]) => (
                      <TouchableOpacity
                        key={value}
                        style={s.cuponSelectOption}
                        onPress={() => { setCuponFilter(value); setOpenCouponSelect(null); }}
                      >
                        <Text style={[s.cuponSelectOptionText, cuponFilter === value && s.cuponSelectOptionTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={s.cuponSelectWrap}>
                <TouchableOpacity
                  style={s.cuponSelect}
                  onPress={() => setOpenCouponSelect(openCouponSelect === 'expiration' ? null : 'expiration')}
                >
                  <Text style={s.cuponSelectText} numberOfLines={1}>
                    {EXPIRATION_OPTIONS.find(([value]) => value === expirationFilter)?.[1] || 'Cualquier vencimiento'}
                  </Text>
                  <Text style={s.cuponSelectChevron}>⌄</Text>
                </TouchableOpacity>
                {openCouponSelect === 'expiration' && (
                  <View style={s.cuponSelectOptions}>
                    {EXPIRATION_OPTIONS.map(([value, label]) => (
                      <TouchableOpacity
                        key={value}
                        style={s.cuponSelectOption}
                        onPress={() => { setExpirationFilter(value); setOpenCouponSelect(null); }}
                      >
                        <Text style={[s.cuponSelectOptionText, expirationFilter === value && s.cuponSelectOptionTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {cuponesFiltrados.length === 0 ? (
              <Text style={s.cuponesEmpty}>No hay cupones que coincidan.</Text>
            ) : (
              <View style={s.cuponesModalList}>
                {cuponesFiltrados.map(cupon => (
                  <CuponCard
                    key={`modal-${cupon.id_cupon}`}
                    cupon={cupon}
                    copiedCode={copiedCode}
                    onCopy={handleCopy}
                    compact
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* FAB carrito */}
      {!showAllCupones && cartCount > 0 && (
        <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('Cart')} activeOpacity={0.9}>
          <IconCart size={24} color={WHITE} />
          <View style={s.fabBadge}>
            <Text style={s.fabBadgeTxt}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: VINOTINTO },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroWrap:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 0, backgroundColor: LIGHT_BG },
  hero:          { borderRadius: 14, overflow: 'hidden', minHeight: 140 },
  heroCircle1:   { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroCircle2:   { position: 'absolute', bottom: -30, right: 120, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.03)' },
  heroContent:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  heroText:      { flex: 1, paddingRight: 12 },
  heroSaludo:    { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginBottom: 2 },
  heroNombre:    { fontSize: 24, fontWeight: '800', color: WHITE, marginBottom: 6 },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 19, marginBottom: 18 },
  heroPBtn:      { alignSelf: 'flex-start', backgroundColor: WHITE, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  heroPBtnTxt:   { color: VINOTINTO, fontSize: 13, fontWeight: '800' },
  heroIconCircle:{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  // ── Card genérica (cupones, últimas compras) ──────────────────────────────
  card: {
    backgroundColor: WHITE, marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#EEE6DF',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  cardIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: VINOTINTO,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardTitle:    { fontSize: 18, fontWeight: '700', color: CARBON },
  cardSubtitle: { fontSize: 12, color: GRAY, marginTop: 2 },
  verTodosBtn: {
    borderWidth: 1, borderColor: VINOTINTO, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  verTodosTxt: { color: VINOTINTO, fontSize: 12, fontWeight: '700' },

  // ── Carrusel de cupones ───────────────────────────────────────────────────
  cuponesScroll: { paddingBottom: 6, gap: 14 },

  // Tarjeta de cupón — idéntica al frontend: borde punteado, fondo degradado
  cuponCard: {
    width: 220,
    backgroundColor: WHITE,
    borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed',
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  cuponCardCompact: { width: '31.9%', minWidth: 0, borderRadius: 10, padding: 7 },
  cuponBadge: {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12,
    maxWidth: '100%',
  },
  cuponBadgeCompact: { paddingHorizontal: 5, paddingVertical: 2, marginBottom: 7 },
  cuponBadgeTxt: { fontSize: 11, fontWeight: '700', color: WHITE },
  cuponBadgeTxtCompact: { fontSize: 7 },
  cuponValor:    { fontSize: 26, fontWeight: '800', color: VINOTINTO, marginBottom: 4 },
  cuponValorCompact: { fontSize: 15, marginBottom: 3 },
  cuponDcto:     { fontSize: 14, fontWeight: '500', color: GRAY },
  cuponMin:      { fontSize: 12, color: GRAY, marginBottom: 6 },
  cuponFecha:    { fontSize: 11, color: '#999', marginBottom: 12 },
  cuponDetailCompact: { fontSize: 8, lineHeight: 11, marginBottom: 5 },
  cuponCodigo: {
    backgroundColor: BEIGE, borderWidth: 1, borderColor: BORDER,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  cuponCodigoCompact: { borderRadius: 5, paddingHorizontal: 3, paddingVertical: 6, gap: 2 },
  cuponCodigoTxt: { fontSize: 14, fontWeight: '700', color: CARBON, letterSpacing: 1.5 },
  cuponCodigoTxtCompact: { fontSize: 8, letterSpacing: 0.2 },

  // ── Hoja de todos los cupones ─────────────────────────────────────────────
  cuponesModalSafe:    { flex: 1, backgroundColor: LIGHT_BG },
  cuponesModalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#EEE6DF' },
  cuponesModalTitle:   { color: CARBON, fontSize: 21, fontWeight: '800' },
  cuponesModalClose:   { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5EEEE', alignItems: 'center', justifyContent: 'center' },
  cuponesModalCloseText:{ color: VINOTINTO, fontSize: 24, lineHeight: 28, fontWeight: '500' },
  cuponesModalContent: { padding: 16, paddingBottom: 32 },
  cuponSearchInput:    { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 8, color: CARBON, fontSize: 14, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 18 },
  cuponSelectRow:      { flexDirection: 'row', gap: 10, marginBottom: 18, zIndex: 3 },
  cuponSelectWrap:     { flex: 1, position: 'relative' },
  cuponSelect:         { minHeight: 42, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  cuponSelectText:     { flex: 1, color: CARBON, fontSize: 12 },
  cuponSelectChevron:  { color: VINOTINTO, fontSize: 20, lineHeight: 20 },
  cuponSelectOptions:  { position: 'absolute', top: 46, left: 0, right: 0, zIndex: 5, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 8, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 8, elevation: 8 },
  cuponSelectOption:   { paddingHorizontal: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1EAE4' },
  cuponSelectOptionText: { color: CARBON, fontSize: 12 },
  cuponSelectOptionTextActive: { color: VINOTINTO, fontWeight: '800' },
  cuponesModalList:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  cuponesEmpty:        { color: GRAY, fontSize: 14, textAlign: 'center', paddingVertical: 36 },

  // ── Últimas compras ───────────────────────────────────────────────────────
  purchaseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: WHITE, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#E8E2D9',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  purchaseThumb: {
    width: 56, height: 70, borderRadius: 8,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  purchaseThumbBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  purchaseThumbBadgeTxt: { color: WHITE, fontSize: 10, fontWeight: '700' },
  purchaseTitulo: { fontSize: 13, fontWeight: '700', color: CARBON, marginBottom: 4 },
  estadoBadge: {
    alignSelf: 'flex-start', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, marginBottom: 4,
  },
  estadoBadgeTxt: { fontSize: 10, fontWeight: '700' },
  purchaseMeta:   { fontSize: 11, color: GRAY },
  purchasePrecio: { fontSize: 14, fontWeight: '800', color: VINOTINTO },
  purchaseArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FDF2F4', alignItems: 'center', justifyContent: 'center',
  },

  // ── FAB carrito ───────────────────────────────────────────────────────────
  fab:         { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#C5425A', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 5 },
  fabBadge:    { position: 'absolute', top: -2, right: -2, backgroundColor: WHITE, borderRadius: 11, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#C5425A' },
  fabBadgeTxt: { color: '#C5425A', fontSize: 10, fontWeight: '800' },
});
