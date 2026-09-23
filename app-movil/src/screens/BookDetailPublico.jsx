// src/screens/BookDetailPublico.jsx
// Detalle de libro compartido por visitantes y compradores autenticados.
// Estructura idéntica al "detalle-libro-inline" de Catalogo.jsx del frontend:
//   1. Portada + thumbnails de galería
//   2. Badge categoría, título, autor, estrellas, precio, tienda
//   3. Info de compra (stock, despacho, envío, devoluciones)
//   4. Botones de acción → inicio de sesión o acciones de compra, según el rol
//   5. Descripción del producto
//   6. Características: Autor / Categoría / Stock / Tienda  ← igual que el frontend
//   7. Reseñas del libro (GET /resenas/libro/{id})
//   8. FAQ — 3 preguntas estáticas
//   9. Sobre el autor — avatar con inicial
//  10. Información de envío — card verde
//  11. Libros relacionados (carrusel)
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Polygon, Polyline } from 'react-native-svg';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CarruselAnimado from '../components/CarruselAnimado';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api, { crearSalaChat, getApiBaseUrl, getBookById, getVariantes } from '../services/api';

// ── Colores (light mode — igual que dm del frontend) ─────────────────────────
const PRIMARY   = '#7A1E3A';
const SECTION_BG= '#FAF8F6';   // dm.sectionBg
const CARD_BG   = '#FFFFFF';   // dm.cardBg
const CARD_BORDER = '#E0E0E0'; // dm.cardBorder
const TEXT_P    = '#2C2C2C';   // dm.textPrimary
const TEXT_S    = '#555555';   // dm.textSecondary
const TEXT_M    = '#666666';   // dm.textMuted
const GREEN     = '#4CAF50';
const RED       = '#E53935';
const WHITE     = '#FFFFFF';
const BORDER    = '#E2D8D0';

const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

function resolveImg(v, base) {
  if (!v) return null;
  const s = String(v).split(',')[0].trim();
  if (!s) return null;
  if (s.startsWith('http')) return s;
  return `${base}/${s.replace(/^\//, '')}`;
}

function getImgSrc(libro, base) {
  return (
    resolveImg(libro.imagen_url, base) ||
    resolveImg(libro.imagen_principal, base) ||
    resolveImg(libro.imagen, base) ||
    (libro.isbn ? `https://books.google.com/books/content?vid=ISBN${libro.isbn}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api` : null) ||
    IMG_DEFAULT
  );
}

// ── SVG icons (idénticos al frontend) ────────────────────────────────────────
function IconTruck()  { return <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="1" y="3" width="15" height="13"/><Polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><Circle cx="5.5" cy="18.5" r="2.5"/><Circle cx="18.5" cy="18.5" r="2.5"/></Svg>; }
function IconClock()  { return <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/><Polyline points="12 6 12 12 16 14"/></Svg>; }
function IconShield() { return <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>; }
function IconCart({ color = PRIMARY }) { return <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="9" cy="21" r="1"/><Circle cx="20" cy="21" r="1"/><Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></Svg>; }
function IconTrash({ color = RED }) { return <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="3 6 5 6 21 6"/><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Svg>; }
function IconPin() { return <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_M} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle cx="12" cy="10" r="3"/></Svg>; }
function IconMessage() { return <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></Svg>; }

// ── Fila de info de compra ────────────────────────────────────────────────────
function InfoRow({ icon, strong, sub }) {
  return (
    <View style={d.infoRow}>
      <View style={d.infoIconWrap}><Text style={d.infoIconTxt}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={d.infoStrong}>{strong}</Text>
        {sub ? <Text style={d.infoSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Sección: RESEÑAS DEL LIBRO
// Endpoint: GET /resenas/libro/{idLibro}  (igual que ResenaLibro.jsx)
// Respuesta: { resenas: [...], promedio: number }
// ════════════════════════════════════════════════════════════════════════════
function ResenasLibro({ idLibro }) {
  const [resenas,  setResenas]  = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [pagina,   setPagina]   = useState(1);
  const [filtro,   setFiltro]   = useState('todas'); // 'todas' | '1'..'5'

  useEffect(() => {
    if (!idLibro) { setLoading(false); return; }
    api.get(`/resenas/libro/${idLibro}`)
      .then(res => {
        setResenas(res.data?.resenas || []);
        setPromedio(Number(res.data?.promedio || 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [idLibro]);

  useEffect(() => { setPagina(1); }, [filtro]);

  const filtradas = filtro === 'todas'
    ? resenas
    : resenas.filter(r => Number(r.calificacion) === Number(filtro));

  const POR_PAG = 5;
  const totalPag = Math.max(1, Math.ceil(filtradas.length / POR_PAG));
  const visibles = filtradas.slice((pagina - 1) * POR_PAG, pagina * POR_PAG);

  if (loading) {
    return <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 12 }} />;
  }

  return (
    <View>
      {/* Promedio */}
      <View style={d.resenasPromedioRow}>
        <Text style={d.promedioNum}>{promedio.toFixed(1)}</Text>
        <Text style={d.promedioSlash}>/5</Text>
        <View style={{ flexDirection: 'row', marginLeft: 8 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Text key={i} style={{ color: i <= Math.round(promedio) ? '#ffc107' : '#e0e0e0', fontSize: 18 }}>★</Text>
          ))}
        </View>
        <Text style={d.promedioCount}> {resenas.length} reseña{resenas.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Filtro de estrellas */}
      {resenas.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {['todas', '5', '4', '3', '2', '1'].map(v => (
            <TouchableOpacity
              key={v}
              style={[d.filtroStarBtn, filtro === v && d.filtroStarBtnActive]}
              onPress={() => setFiltro(v)}
            >
              <Text style={[d.filtroStarTxt, filtro === v && d.filtroStarTxtActive]}>
                {v === 'todas' ? 'Todas' : `${v} ★`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Lista de reseñas */}
      {resenas.length === 0 ? (
        <Text style={d.sinResenas}>Aún no hay reseñas. ¡Sé el primero en comentar!</Text>
      ) : filtradas.length === 0 ? (
        <Text style={d.sinResenas}>No hay reseñas con ese filtro.</Text>
      ) : (
        visibles.map(r => (
          <View key={r.id_resena} style={d.resenaItem}>
            <View style={d.resenaHeader}>
              <View>
                <Text style={d.resenaNombre}>{r.nombre_usuario || 'Usuario'}</Text>
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Text key={i} style={{ color: i <= r.calificacion ? '#ffc107' : '#e0e0e0', fontSize: 14 }}>★</Text>
                  ))}
                </View>
              </View>
              <Text style={d.resenaFecha}>
                {new Date(r.fecha_resena).toLocaleDateString('es-CO')}
              </Text>
            </View>
            {r.comentario ? <Text style={d.resenaComentario}>{r.comentario}</Text> : null}
          </View>
        ))
      )}

      {/* Paginación de reseñas */}
      {totalPag > 1 && (
        <View style={d.resenaPagRow}>
          <TouchableOpacity
            style={[d.resenaPagBtn, pagina === 1 && { opacity: 0.4 }]}
            disabled={pagina === 1}
            onPress={() => setPagina(p => p - 1)}
          >
            <Text style={d.resenaPagBtnTxt}>Anterior</Text>
          </TouchableOpacity>
          <Text style={d.resenaPagInfo}>Página {pagina} de {totalPag}</Text>
          <TouchableOpacity
            style={[d.resenaPagBtn, pagina >= totalPag && { opacity: 0.4 }]}
            disabled={pagina >= totalPag}
            onPress={() => setPagina(p => p + 1)}
          >
            <Text style={d.resenaPagBtnTxt}>Siguiente</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function BookDetailPublico({ navigation, route }) {
  const BASE = getApiBaseUrl();
  const { book: bookParam } = route.params || {};
  const { user, signOut } = useContext(AuthContext);
  const { addToCart, removeFromCart } = useContext(CartContext);

  const [libro,     setLibro]     = useState(bookParam || {});
  const [imgActiva, setImgActiva] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [varSelec,  setVarSelec]  = useState(null);
  const [librosRel, setLibrosRel] = useState([]);
  const [adding,    setAdding]    = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [contactando, setContactando] = useState(false);

  // El catálogo entrega información resumida; se completa para mostrar todas
  // las secciones que también tiene el detalle del frontend.
  useEffect(() => {
    const id = bookParam?.id_libro || bookParam?.id;
    if (!id) return;
    getBookById(id)
      .then(({ data }) => setLibro(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, [bookParam?.id_libro, bookParam?.id]);

  // Cargar variantes
  useEffect(() => {
    const id = bookParam?.id_libro || bookParam?.id;
    if (!id) return;
    getVariantes(id)
      .then(({ data }) => {
        const list = data || [];
        setVariantes(list);
        if (list.length > 0) setVarSelec(list[0]);
      })
      .catch(() => {});
  }, [bookParam?.id_libro]);

  // Cargar libros relacionados (misma categoría)
  useEffect(() => {
    const cat = bookParam?.nombre_categoria;
    if (!cat) return;
    api.get('/catalogo/busqueda-avanzada', { params: { categoria: cat, limite: 12, pagina: 1 } })
      .then(res => {
        const list = res.data?.libros || [];
        setLibrosRel(list.filter(l => l.id_libro !== (bookParam?.id_libro || bookParam?.id)));
      })
      .catch(() => {});
  }, [bookParam?.nombre_categoria]);

  // Imagen principal
  const imgPrincipal = imgActiva || getImgSrc(libro, BASE);

  // Galería extra
  const imagenesExtra = (() => {
    if (!libro.imagenes) return [];
    if (Array.isArray(libro.imagenes)) return libro.imagenes.filter(Boolean);
    return String(libro.imagenes).split(',').map(s => s.trim()).filter(Boolean);
  })();

  const precio     = varSelec ? varSelec.precio_variante : (libro.precio_libro || libro.precio || 0);
  const stock = varSelec ? varSelec.stock_variante : libro.stock;
  const outOfStock = Number(stock ?? 1) <= 0;
  const rating     = Number(libro.calificacion || libro.calificacion_promedio || libro.calificacion_tienda || 0);
  const totalResenas = Number(libro.total_resenas || 0);
  const idLibro    = libro.id_libro || libro.id;

  const itemParaCarrito = () => varSelec
    ? {
        ...libro,
        precio_libro: varSelec.precio_variante,
        id_variante: varSelec.id_variante,
        variante_label: [varSelec.tipo_tapa, varSelec.idioma, varSelec.edicion].filter(Boolean).join(' · '),
      }
    : libro;

  const agregarAlCarrito = async (irAlCarrito = false) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (outOfStock) return;
    try {
      setAdding(true);
      await addToCart(itemParaCarrito());
      setAddedToCart(true);
      if (irAlCarrito) navigation.navigate('Cart');
      else Alert.alert('Carrito', 'Libro agregado al carrito.');
    } catch (error) {
      Alert.alert('Carrito', error?.response?.data?.detail || 'No se pudo agregar el libro al carrito.');
    } finally {
      setAdding(false);
    }
  };

  const quitarDelCarrito = async () => {
    try {
      setAdding(true);
      await removeFromCart(idLibro);
      setAddedToCart(false);
    } finally {
      setAdding(false);
    }
  };

  const contactarLibreria = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (!libro.id_tienda) {
      Alert.alert('Contacto', 'No se pudo identificar la librería de este libro.');
      return;
    }
    try {
      setContactando(true);
      const { data } = await crearSalaChat(libro.id_tienda);
      navigation.navigate('Chat', { id_sala: data.id_sala, nombre_tienda: libro.nombre_tienda || 'Librería' });
    } catch {
      Alert.alert('Contacto', 'No se pudo abrir el chat con la librería.');
    } finally {
      setContactando(false);
    }
  };

  return (
    <SafeAreaView style={d.safe}>
      <Header variant={user ? "dashboard" : "public"} navigation={navigation} showTopBar={false} onSignOut={signOut} />

      <ScrollView style={d.scroll} showsVerticalScrollIndicator={false}>

        {/* ── BOTÓN VOLVER ─────────────────────────────────────────────── */}
        <View style={d.backWrap}>
          <TouchableOpacity style={d.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={d.backBtnTxt}>← Volver al catálogo</Text>
          </TouchableOpacity>
        </View>

        {/* ── PORTADA ──────────────────────────────────────────────────── */}
        <View style={d.galleryWrap}>
          <Image
            source={{ uri: imgPrincipal }}
            style={d.coverImg}
            resizeMode="cover"
            onError={() => {}}
          />
          {outOfStock && (
            <View style={d.sinStockBadge}><Text style={d.sinStockTxt}>Sin stock</Text></View>
          )}
          {libro.es_impulsado && (
            <View style={d.impulsoBadge}><Text style={d.impulsoTxt}>⭐ Destacado</Text></View>
          )}
        </View>

        {/* Thumbnails */}
        {imagenesExtra.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={d.thumbsScroll}>
            {imagenesExtra.map((img, i) => {
              const uri = resolveImg(img, BASE) || IMG_DEFAULT;
              const activa = (imgActiva || imagenesExtra[0]) === img;
              return (
                <TouchableOpacity key={i} style={[d.thumb, activa && d.thumbActive]}
                  onPress={() => setImgActiva(img)} activeOpacity={0.8}>
                  <Image source={{ uri }} style={d.thumbImg} resizeMode="cover" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={d.body}>

          {/* ── RESUMEN: categoría, título, autor, estrellas, precio, tienda ── */}
          {libro.nombre_categoria && (
            <View style={d.catPill}>
              <Text style={d.catPillTxt}>{libro.nombre_categoria}</Text>
            </View>
          )}
          <Text style={d.titulo}>{libro.titulo || 'Sin título'}</Text>
          <Text style={d.autor}>{libro.autor_libro || libro.autor || 'Autor no disponible'}</Text>

          {/* Estrellas + reseñas */}
          <View style={d.starsRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <Text key={s} style={{ fontSize: 20, color: s <= Math.round(rating || 4) ? '#ffc107' : '#e0e0e0' }}>★</Text>
            ))}
            <Text style={d.starsCount}>({(rating || 4).toFixed(1)})</Text>
            <Text style={d.resenasCount}>• {totalResenas} reseñas</Text>
          </View>

          {/* Tienda */}
          {libro.nombre_tienda && (
            <TouchableOpacity
              onPress={() => libro.id_tienda && navigation.navigate('PerfilTienda', { id_tienda: libro.id_tienda })}
              activeOpacity={0.8}
              style={d.tiendaRow}
            >
              <IconPin />
              <Text style={d.tienda}>{libro.nombre_tienda}</Text>
            </TouchableOpacity>
          )}

          {/* Precio */}
          <Text style={d.precio}>${Number(precio).toLocaleString('es-CO')}</Text>

          {/* Variantes */}
          {variantes.length > 1 && (
            <View style={d.section}>
              <Text style={d.sectionLbl}>VARIANTES DISPONIBLES</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {variantes.map((v, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[d.varBtn, varSelec?.id_variante === v.id_variante && d.varBtnActive]}
                    onPress={() => setVarSelec(v)}
                  >
                    <Text style={[d.varBtnTxt, varSelec?.id_variante === v.id_variante && { color: WHITE }]}>
                      {v.tipo_variante || `Opción ${i + 1}`}
                    </Text>
                    <Text style={[d.varBtnPrecio, varSelec?.id_variante === v.id_variante && { color: 'rgba(255,255,255,0.8)' }]}>
                      ${Number(v.precio_variante).toLocaleString('es-CO')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── INFO DE COMPRA (detalle-purchase-info) ───────────────── */}
          <View style={d.purchaseCard}>
            <InfoRow
              icon="✓"
              strong={Number(stock || 0) > 0 ? `En stock: ${stock} disponibles` : 'Agotado'}
              sub="Disponibilidad actual"
            />
            <InfoRow
              icon="↗"
              strong={`Despacho en ${libro.tiempo_despacho_dias || 2} días hábiles`}
              sub={libro.politica_envios || 'Envío gestionado por la librería'}
            />
            <InfoRow
              icon="$"
              strong={Number(libro.costo_envio_tienda || 0) > 0
                ? `Envío: $${Number(libro.costo_envio_tienda).toLocaleString('es-CO')}`
                : 'Envío gratis'}
              sub="Tarifa definida por la tienda"
            />
            <InfoRow
              icon="↺"
              strong="Pago seguro en BookyHome"
              sub={libro.politica_devoluciones || 'Consulta la política de devoluciones con la librería'}
            />
          </View>

          {/* ── BOTONES DE ACCIÓN ─────────────────────────────────────── */}
          <View style={d.actionsCol}>
            <TouchableOpacity
              style={[d.btnPrimary, (outOfStock || adding) && { opacity: 0.55 }]}
              onPress={() => agregarAlCarrito(true)}
              disabled={outOfStock || adding}
              activeOpacity={0.88}
            >
              <View style={d.actionContent}>
                {!outOfStock && !adding && <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>}
                <Text style={d.btnPrimaryTxt}>{outOfStock ? 'Sin stock' : adding ? 'Procesando...' : 'Comprar ahora'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[d.btnSecondary, (outOfStock || adding) && { opacity: 0.55 }, addedToCart && d.btnRemove]}
              onPress={addedToCart ? quitarDelCarrito : () => agregarAlCarrito(false)}
              disabled={outOfStock || adding}
              activeOpacity={0.88}
            >
              <View style={d.actionContent}>
                {!outOfStock && !adding && (addedToCart ? <IconTrash /> : <IconCart />)}
                <Text style={[d.btnSecondaryTxt, addedToCart && d.btnRemoveTxt]}>{outOfStock ? 'Sin stock' : adding ? 'Procesando...' : addedToCart ? 'Eliminar del carrito' : 'Agregar al carrito'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[d.btnTertiary, contactando && { opacity: 0.55 }]}
              onPress={contactarLibreria}
              disabled={contactando}
              activeOpacity={0.88}
            >
              <View style={d.actionContent}>
                {!contactando && <IconMessage />}
                <Text style={d.btnTertiaryTxt}>{contactando ? 'Abriendo chat...' : 'Contactar librería'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── DESCRIPCIÓN DEL PRODUCTO ─────────────────────────────── */}
          <View style={[d.section, { backgroundColor: SECTION_BG, borderRadius: 12, padding: 16 }]}>
            <Text style={d.sectionTitle}>Descripción del producto</Text>
            <Text style={d.descripcion}>
              {libro.descripcion_libro || libro.descripcion ||
                `Este libro de ${libro.nombre_categoria || 'literatura'} escrito por ${libro.autor_libro || libro.autor || 'el autor'} es una excelente elección. Disponible en BookyHome a través de ${libro.nombre_tienda || 'librerías verificadas'}.`}
            </Text>
          </View>

          {/* ── CARACTERÍSTICAS ─────────────────────────────────────────
               Idéntico al frontend: Autor / Categoría / Stock / Tienda
               Grid 2×2, card blanca con border, label muted + value bold  */}
          <View style={d.section}>
            <Text style={d.sectionTitle}>Características</Text>
            <View style={d.caracteristicasGrid}>
              {[
                {
                  label: 'Autor',
                  value: libro.autor_libro || libro.autor || 'N/A',
                  valueColor: TEXT_P,
                },
                {
                  label: 'Categoría',
                  value: libro.nombre_categoria || 'N/A',
                  valueColor: TEXT_P,
                },
                {
                  label: 'Stock',
                  value: Number(libro.stock || 0) > 0 ? `${libro.stock} disponibles` : 'Agotado',
                  // Verde si hay stock, rojo si agotado — igual que el frontend
                  valueColor: Number(libro.stock || 0) > 0 ? GREEN : RED,
                },
                {
                  label: 'Tienda',
                  value: libro.nombre_tienda || 'N/A',
                  valueColor: TEXT_P,
                },
              ].map((item, i) => (
                <View key={i} style={d.caracteristicaCard}>
                  <Text style={d.caracteristicaLbl}>{item.label}</Text>
                  <Text style={[d.caracteristicaVal, { color: item.valueColor }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── RESEÑAS DEL LIBRO ─────────────────────────────────────── */}
          <View style={[d.section, { backgroundColor: SECTION_BG, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: CARD_BORDER }]}>
            <Text style={d.sectionTitle}>Reseñas del libro</Text>
            <ResenasLibro idLibro={idLibro} />
          </View>

          {/* ── PREGUNTAS FRECUENTES ─────────────────────────────────────
               3 preguntas estáticas — idéntico al frontend (sin acordeón) */}
          <View style={d.section}>
            <Text style={d.sectionTitle}>Preguntas frecuentes</Text>
            <View style={{ gap: 10 }}>
              {[
                {
                  q: '¿Cuál es el estado del libro?',
                  a: 'Todos los libros en nuestro catálogo son nuevos o en excelente estado, garantizando su calidad.',
                },
                {
                  q: '¿Cuánto tiempo tarda el envío?',
                  a: 'El tiempo de envío varía según la ubicación. Generalmente entre 2-5 días hábiles.',
                },
                {
                  q: '¿Tienen garantía de devolución?',
                  a: 'Sí, ofrecemos garantía de devolución de 15 días si el producto no cumple con sus expectativas.',
                },
              ].map((item, i) => (
                <View key={i} style={d.faqCard}>
                  <Text style={d.faqQ}>{item.q}</Text>
                  <Text style={d.faqA}>{item.a}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── SOBRE EL AUTOR ───────────────────────────────────────────
               Avatar circular con inicial + nombre + descripción generada
               Idéntico al frontend: fondo rosa, letra bordeaux         */}
          <View style={d.autorCard}>
            <Text style={d.sectionTitle}>Sobre el autor</Text>
            <View style={d.autorRow}>
              <View style={d.autorAvatar}>
                <Text style={d.autorAvatarTxt}>
                  {(libro.autor_libro || libro.autor || 'A')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={d.autorNombre}>{libro.autor_libro || libro.autor || 'Autor destacado'}</Text>
                <Text style={d.autorDesc}>
                  Autor reconocido en el género de {libro.nombre_categoria || 'ficción'} con múltiples best-sellers. Sus obras han sido traducidas a varios idiomas y han recibido premios literarios internacionales.
                </Text>
              </View>
            </View>
          </View>

          {/* ── INFORMACIÓN DE ENVÍO ─────────────────────────────────────
               Card verde con 3 ítems — idéntico al frontend            */}
          <View style={d.envioCard}>
            <Text style={d.envioTitle}>Información de envío</Text>
            <View style={d.envioGrid}>
              {[
                { Icon: IconTruck,  label: 'Envío gratis',    sub: 'En compras mayores a $50.000' },
                { Icon: IconClock,  label: 'Entrega rápida',  sub: '2-5 días hábiles' },
                { Icon: IconShield, label: 'Pago seguro',     sub: '100% protegido' },
              ].map((item, i) => (
                <View key={i} style={d.envioItem}>
                  <item.Icon />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={d.envioItemLabel}>{item.label}</Text>
                    <Text style={d.envioItemSub}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── LIBROS RELACIONADOS ──────────────────────────────────────
               Carrusel animado — igual que el frontend                 */}
          {librosRel.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={[d.sectionTitle, { marginBottom: 0 }]}>Libros relacionados</Text>
              <CarruselAnimado
                titulo=""
                emoji=""
                libros={librosRel}
                loading={false}
                baseUrl={BASE}
                onVerLibro={l => navigation.push('BookDetailPublico', { book: l })}
                cardWidth={140}
                cardGap={10}
              />
            </View>
          )}

        </View>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <Footer onLinkPress={link => console.log('Footer:', link)} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
const d = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PRIMARY },
  scroll: { flex: 1, backgroundColor: SECTION_BG },

  // Volver
  backWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, backgroundColor: CARD_BG },
  backBtn:  { alignSelf: 'flex-start', backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 6 },
  backBtnTxt: { color: WHITE, fontSize: 13, fontWeight: '700' },

  // Portada
  galleryWrap:   { width: '100%', height: 300, position: 'relative', backgroundColor: '#EEE8E0' },
  coverImg:      { width: '100%', height: '100%' },
  sinStockBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  sinStockTxt:   { color: WHITE, fontSize: 11, fontWeight: '700' },
  impulsoBadge:  { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#fbbf24', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  impulsoTxt:    { fontSize: 11, fontWeight: '700', color: '#78350f' },

  // Thumbnails
  thumbsScroll: { backgroundColor: CARD_BG, paddingVertical: 8 },
  thumb:        { width: 60, height: 60, borderRadius: 6, marginLeft: 12, borderWidth: 2, borderColor: BORDER, overflow: 'hidden' },
  thumbActive:  { borderColor: PRIMARY },
  thumbImg:     { width: '100%', height: '100%' },

  // Cuerpo principal
  body: { padding: 20, backgroundColor: SECTION_BG },

  // Cabecera del libro
  catPill:      { alignSelf: 'flex-start', backgroundColor: '#F7E9EE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  catPillTxt:   { color: '#9D274D', fontSize: 11, fontWeight: '700' },
  titulo:       { fontSize: 22, fontWeight: '800', color: TEXT_P, lineHeight: 28, marginBottom: 6 },
  autor:        { fontSize: 15, color: TEXT_M, fontWeight: '600', marginBottom: 10 },
  starsRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 2, flexWrap: 'wrap' },
  starsCount:   { fontSize: 13, color: TEXT_M, marginLeft: 4 },
  resenasCount: { fontSize: 13, color: '#999', marginLeft: 4 },
  tiendaRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tienda:       { fontSize: 14, color: TEXT_M },
  precio:       { fontSize: 30, fontWeight: '800', color: PRIMARY, marginBottom: 16 },

  // Variantes
  varBtn:       { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: CARD_BG },
  varBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  varBtnTxt:    { fontSize: 12, fontWeight: '600', color: TEXT_P },
  varBtnPrecio: { fontSize: 11, color: TEXT_M, marginTop: 2 },

  // Info de compra
  purchaseCard: { backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: CARD_BORDER, padding: 16, marginBottom: 18 },
  infoRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F7E9EE', alignItems: 'center', justifyContent: 'center' },
  infoIconTxt:  { fontSize: 14, color: PRIMARY, fontWeight: '700' },
  infoStrong:   { fontSize: 13, fontWeight: '700', color: TEXT_P, marginBottom: 1 },
  infoSub:      { fontSize: 11, color: TEXT_M },

  // Botones
  actionsCol:        { gap: 10, marginBottom: 22 },
  actionContent:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimary:        { backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 15, alignItems: 'center', shadowColor: PRIMARY, shadowOpacity: 0.28, shadowRadius: 6, elevation: 4 },
  btnPrimaryTxt:     { color: WHITE, fontSize: 15, fontWeight: '800' },
  btnSecondary:      { borderWidth: 2, borderColor: PRIMARY, borderRadius: 8, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fdf2f4' },
  btnSecondaryTxt:   { color: PRIMARY, fontSize: 15, fontWeight: '700' },
  btnRemove:         { borderColor: RED, backgroundColor: '#FEE2E2' },
  btnRemoveTxt:      { color: RED },
  btnTertiary:       { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 13, alignItems: 'center', backgroundColor: CARD_BG },
  btnTertiaryTxt:    { color: '#4b5563', fontSize: 14, fontWeight: '600' },

  // Secciones genéricas
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: TEXT_P, marginBottom: 14 },
  sectionLbl:   { fontSize: 10, fontWeight: '800', color: TEXT_M, marginBottom: 8, letterSpacing: 0.4 },
  descripcion:  { fontSize: 14, color: TEXT_S, lineHeight: 22 },

  // ── Características — grid 2×2 idéntico al frontend ──────────────────────
  // Frontend: display:grid, gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16px
  // Móvil: 2 columnas con gap 12
  caracteristicasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  caracteristicaCard:  {
    // Ocupa el 48% del ancho para simular las 2 columnas del grid del frontend
    width: '48%',
    padding: 16,
    backgroundColor: CARD_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  caracteristicaLbl: { fontSize: 13, color: TEXT_M, marginBottom: 4 },   // dm.textMuted, 0.85rem
  caracteristicaVal: { fontSize: 15, fontWeight: '600' },                 // 1rem, fontWeight:600

  // ── Reseñas ───────────────────────────────────────────────────────────────
  resenasPromedioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  promedioNum:  { fontSize: 28, fontWeight: '800', color: TEXT_P },
  promedioSlash:{ fontSize: 16, color: TEXT_M, marginTop: 6 },
  promedioCount:{ fontSize: 13, color: TEXT_M, marginLeft: 8, marginTop: 4 },
  filtroStarBtn:      { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: BORDER, borderRadius: 5, marginRight: 6, backgroundColor: CARD_BG },
  filtroStarBtnActive:{ backgroundColor: PRIMARY, borderColor: PRIMARY },
  filtroStarTxt:      { fontSize: 12, color: TEXT_P },
  filtroStarTxtActive:{ color: WHITE, fontWeight: '700' },
  sinResenas:   { fontSize: 13, color: TEXT_M, textAlign: 'center', paddingVertical: 16 },
  resenaItem:   { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0EBE4' },
  resenaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  resenaNombre: { fontSize: 14, fontWeight: '700', color: TEXT_P, marginBottom: 2 },
  resenaFecha:  { fontSize: 11, color: TEXT_M },
  resenaComentario: { fontSize: 13, color: TEXT_S, lineHeight: 19 },
  resenaPagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 },
  resenaPagBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD_BG },
  resenaPagBtnTxt: { fontSize: 13, color: TEXT_P },
  resenaPagInfo:   { fontSize: 13, color: TEXT_M },

  // ── FAQ — cards estáticas ─────────────────────────────────────────────────
  faqCard: { padding: 16, backgroundColor: CARD_BG, borderRadius: 8, borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 10 },
  faqQ:    { fontSize: 15, fontWeight: '600', color: TEXT_P, marginBottom: 6 },
  faqA:    { fontSize: 14, color: TEXT_S, lineHeight: 20 },

  // ── Sobre el autor ────────────────────────────────────────────────────────
  autorCard:   { backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: CARD_BORDER, padding: 20, marginBottom: 20 },
  autorRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  autorAvatar: { width: 64, height: 64, borderRadius: 32, background: 'linear-gradient(135deg,#fce4ec,#f8bbd0)', backgroundColor: '#fce4ec', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  autorAvatarTxt: { fontSize: 26, fontWeight: '800', color: '#8b0000' },
  autorNombre: { fontSize: 17, fontWeight: '700', color: TEXT_P, marginBottom: 6 },
  autorDesc:   { fontSize: 14, color: TEXT_S, lineHeight: 21 },

  // ── Información de envío — card verde ────────────────────────────────────
  // Frontend: background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
  envioCard:    { backgroundColor: '#e8f5e9', borderRadius: 12, padding: 20, marginBottom: 24 },
  envioTitle:   { fontSize: 20, fontWeight: '700', color: TEXT_P, marginBottom: 14 },
  envioGrid:    { gap: 14 },
  envioItem:    { flexDirection: 'row', alignItems: 'center' },
  envioItemLabel:{ fontSize: 14, fontWeight: '600', color: TEXT_P },
  envioItemSub:  { fontSize: 12, color: TEXT_M },
});
