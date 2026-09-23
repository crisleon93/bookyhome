// src/screens/Catalogo.jsx
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addFavorito, getApiBaseUrl, getBusquedaAvanzada, getFiltrosDisponibles, getFavoritos, removeFavorito } from '../services/api';
import { IconBooks } from '../components/Icons';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

const PRIMARY = '#7A1E3A';
const BG      = '#F9F6F1';
const WHITE   = '#FFFFFF';
const GRAY    = '#6B7280';
const TEXT    = '#1F2937';
const BORDER  = '#E5E7EB';

// Opciones de ordenamiento — mismas que el frontend web
const SORT_OPTIONS = [
  { value: 'relevancia',  label: 'Relevancia' },
  { value: 'precio_asc',  label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'calificacion',label: 'Calificación' },
  { value: 'recientes',   label: 'Recientes' },
];

// Defaults de filtros
const FILTROS_DEFAULT = {
  q:              '',
  nombre_tienda:  '',
  correo_vendedor: '',
  categoria_id:   null,
  categoria_nombre: null,
  precio_min:     '0',
  precio_max:     '1000000',
  calificacion_min: 0,
  disponible:     true,
  ordenar_por:    'relevancia',
};

// ── Helper para contar filtros activos (igual que FiltrosCatalogo.jsx del web) ──
function contarFiltrosActivos(filtros, precioMaxReal) {
  let n = 0;
  if (filtros.q)             n++;
  if (filtros.nombre_tienda) n++;
  if (filtros.correo_vendedor) n++;
  if (filtros.categoria_id || filtros.categoria_nombre) n++;
  if (Number(filtros.precio_min) > 0) n++;
  if (precioMaxReal && Number(filtros.precio_max) < precioMaxReal) n++;
  if (filtros.calificacion_min > 0) n++;
  if (!filtros.disponible)   n++;
  if (filtros.ordenar_por !== 'relevancia') n++;
  return n;
}

export default function Catalogo({ navigation, route }) {
  const { signOut } = useContext(AuthContext);
  const { width: windowWidth } = useWindowDimensions();

  const [books,          setBooks]          = useState([]);
  const [favoriteIds,    setFavoriteIds]    = useState(new Set());
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const [totalBooks,     setTotalBooks]     = useState(0);
  // Se revela al terminar de recorrer la página actual de libros.
  const [showPagination, setShowPagination] = useState(false);

  // ── Opciones de filtros cargadas desde la API ────────────────────────────
  const [categorias,     setCategorias]     = useState([]);  // [{ id_categoria, nombre_categoria, cantidad_libros }]
  const [precioMaxReal,  setPrecioMaxReal]  = useState(1000000);
  const [loadingFiltros, setLoadingFiltros] = useState(true);

  // ── Estado de filtros (todos los del web) ────────────────────────────────
  const [filtros, setFiltros] = useState({
    ...FILTROS_DEFAULT,
    categoria_id:     route?.params?.categoryId      ?? null,
    categoria_nombre: route?.params?.categoria       ?? null,
    q:                route?.params?.q               ?? '',
    nombre_tienda:    route?.params?.nombre_tienda   ?? '',
    correo_vendedor:  route?.params?.correo_vendedor ?? '',
    ordenar_por:      route?.params?.ordenar_por     ?? 'relevancia',
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showCatModal,    setShowCatModal]    = useState(false);
  const [showSortModal,   setShowSortModal]   = useState(false);

  // Deduplicación de búsqueda (igual que el web, via ref)
  const ultimaBusquedaRef = useRef(null);
  const listMetricsRef = useRef({ contentHeight: 0, viewportHeight: 0 });

  // ── Dimensiones del grid ─────────────────────────────────────────────────
  const gridColumns  = Math.max(2, Math.floor((windowWidth - 32) / 140));
  const cardGap      = windowWidth >= 700 ? 14 : 10;
  const cardWidth    = (windowWidth - 32 - (cardGap * (gridColumns - 1))) / gridColumns;
  const coverHeight  = Math.max(132, Math.min(170, cardWidth * 1.12));

  // ── Cargar opciones de filtros desde /catalogo/filtros-disponibles ───────
  useEffect(() => {
    getFiltrosDisponibles()
      .then(res => {
        const data = res.data || {};
        setCategorias(data.categorias || []);
        if (data.precio_max) {
          setPrecioMaxReal(data.precio_max);
          setFiltros(prev => ({
            ...prev,
            precio_max: prev.precio_max === '1000000' ? String(data.precio_max) : prev.precio_max,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFiltros(false));
  }, []);

  // ── Reaccionar a parámetros de navegación (categoría desde Home) ─────────
  useEffect(() => {
    const { categoryId, categoria, q: qParam, nombre_tienda, correo_vendedor, ordenar_por: ord } = route?.params || {};
    setFiltros(prev => ({
      ...prev,
      ...(categoryId   != null ? { categoria_id: Number(categoryId), categoria_nombre: null } : {}),
      ...(categoria    != null ? { categoria_nombre: categoria, categoria_id: null }           : {}),
      ...(qParam       != null ? { q: qParam }                                                  : {}),
      ...(nombre_tienda != null ? { nombre_tienda }                                              : {}),
      ...(correo_vendedor != null ? { correo_vendedor }                                          : {}),
      ...(ord          != null ? { ordenar_por: ord }                                            : {}),
    }));
    setPage(1);
    setShowPagination(false);
    ultimaBusquedaRef.current = null;
  }, [route?.params?.categoryId, route?.params?.categoria, route?.params?.q, route?.params?.nombre_tienda, route?.params?.correo_vendedor, route?.params?.ordenar_por]);

  // ── Cargar libros con deduplicación ──────────────────────────────────────
  const cargarLibros = useCallback(async () => {
    const params = {};
    if (filtros.q)              params.q              = filtros.q;
    if (filtros.nombre_tienda)  params.nombre_tienda  = filtros.nombre_tienda;
    if (filtros.correo_vendedor) params.correo_vendedor = filtros.correo_vendedor;
    if (filtros.categoria_id)   params.categoria_id   = filtros.categoria_id;
    if (filtros.categoria_nombre && !filtros.categoria_id)
      params.categoria = filtros.categoria_nombre;
    if (Number(filtros.precio_min) > 0)  params.precio_min  = Number(filtros.precio_min);
    if (Number(filtros.precio_max) > 0)  params.precio_max  = Number(filtros.precio_max);
    if (filtros.calificacion_min > 0)    params.calificacion_min = filtros.calificacion_min;
    if (filtros.disponible)  params.disponible = true;
    params.ordenar_por = filtros.ordenar_por;
    params.pagina      = page;
    params.limite      = windowWidth >= 700 ? 30 : 12;

    const clave = JSON.stringify(params);
    if (clave === ultimaBusquedaRef.current) return;
    ultimaBusquedaRef.current = clave;

    setLoading(true);
    try {
      const res  = await getBusquedaAvanzada(params);
      const data = res.data || {};
      setBooks(data.libros || []);
      setTotalPages(data.total_paginas || 1);
      setTotalBooks(data.total || 0);
      setShowPagination(false);
    } catch (err) {
      console.log('Error cargando catálogo', err?.message || err);
      ultimaBusquedaRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [filtros, page, windowWidth]);

  useEffect(() => {
    cargarLibros();
  }, [cargarLibros]);

  // El estado se consulta una vez y se actualiza localmente al tocar el corazón.
  useEffect(() => {
    getFavoritos()
      .then(res => setFavoriteIds(new Set((res.data || []).map(libro => Number(libro.id_libro)))))
      .catch(() => {});
  }, []);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPage(1);
    setShowPagination(false);
    ultimaBusquedaRef.current = null;
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ ...FILTROS_DEFAULT, precio_max: String(precioMaxReal) });
    setPage(1);
    setShowPagination(false);
    ultimaBusquedaRef.current = null;
  };

  const handleHeaderFilterApply = (nuevosFiltros) => {
    setFiltros(prev => ({
      ...prev,
      q: nuevosFiltros.busqueda ?? prev.q,
      nombre_tienda: nuevosFiltros.nombre_tienda ?? prev.nombre_tienda,
      correo_vendedor: nuevosFiltros.correo_vendedor ?? prev.correo_vendedor,
      categoria_id: nuevosFiltros.categoria_id ?? null,
      categoria_nombre: nuevosFiltros.categoria_nombre ?? null,
      precio_min: String(nuevosFiltros.precio_min ?? prev.precio_min),
      precio_max: String(nuevosFiltros.precio_max ?? prev.precio_max),
      calificacion_min: nuevosFiltros.calificacion_min ?? prev.calificacion_min,
      disponible: nuevosFiltros.disponible ?? prev.disponible,
      ordenar_por: nuevosFiltros.ordenar_por ?? prev.ordenar_por,
    }));
    setPage(1);
    setShowPagination(false);
    ultimaBusquedaRef.current = null;
  };

  const updatePaginationVisibility = (offsetY, viewportHeight, contentHeight) => {
    if (totalPages <= 1) {
      setShowPagination(false);
      return;
    }
    // El margen evita exigir el último píxel. Al volver a subir, la barra se oculta.
    const atEnd = offsetY + viewportHeight >= contentHeight - 24;
    setShowPagination(current => current === atEnd ? current : atEnd);
  };

  const handleListLayout = ({ nativeEvent }) => {
    const viewportHeight = nativeEvent.layout.height;
    listMetricsRef.current.viewportHeight = viewportHeight;
    // Si toda la página cabe en pantalla, el final ya está visible.
    if (listMetricsRef.current.contentHeight <= viewportHeight + 24) {
      setShowPagination(totalPages > 1);
    }
  };

  const handleContentSizeChange = (_, contentHeight) => {
    listMetricsRef.current.contentHeight = contentHeight;
    if (contentHeight <= listMetricsRef.current.viewportHeight + 24) {
      setShowPagination(totalPages > 1);
    }
  };

  const handleListScroll = ({ nativeEvent }) => {
    updatePaginationVisibility(
      nativeEvent.contentOffset.y,
      nativeEvent.layoutMeasurement.height,
      nativeEvent.contentSize.height,
    );
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPages) return;
    setShowPagination(false);
    setPage(nuevaPagina);
  };

  const toggleFavorito = async (libro) => {
    const idLibro = Number(libro.id_libro);
    if (!idLibro || favoriteLoadingId) return;

    const yaEsFavorito = favoriteIds.has(idLibro);
    setFavoriteLoadingId(idLibro);
    try {
      if (yaEsFavorito) {
        await removeFavorito(idLibro);
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(idLibro);
          return next;
        });
        Alert.alert('Favoritos', 'Libro eliminado de favoritos.');
      } else {
        await addFavorito(idLibro);
        setFavoriteIds(prev => new Set(prev).add(idLibro));
        Alert.alert('Favoritos', 'Libro agregado a favoritos.');
      }
    } catch (error) {
      Alert.alert('Favoritos', error?.response?.data?.detail || 'No se pudo actualizar favoritos.');
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  const filtrosActivos = contarFiltrosActivos(filtros, precioMaxReal);

  // ── Nombre visible de categoría seleccionada ─────────────────────────────
  const catNombreSeleccionada = filtros.categoria_id
    ? (categorias.find(c => c.id_categoria === filtros.categoria_id)?.nombre_categoria ?? 'Categoría')
    : filtros.categoria_nombre
      ? filtros.categoria_nombre
      : 'Todas las categorías';

  // ── Render de tarjeta de libro (igual que antes) ─────────────────────────
  const renderBook = ({ item }) => {
    const imageUrl     = item.imagen || item.imagen_url || item.imagen_principal;
    const finalImgUrl  = imageUrl
      ? (imageUrl.startsWith('http') ? imageUrl : `${getApiBaseUrl()}/${imageUrl.replace(/^\//, '')}`)
      : null;
    const rating       = Number(item.calificacion_promedio || item.calificacion_tienda || item.calificacion || 0).toFixed(1);
    const disponible   = item.disponible !== false && Number(item.stock ?? 1) > 0;
    const libreria     = item.nombre_tienda || null;
    const outOfStock   = Number(item.stock ?? 1) <= 0;
    const enFavoritos  = favoriteIds.has(Number(item.id_libro));

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }]}
        onPress={() => navigation.navigate('BookDetailPublico', { book: item })}
        activeOpacity={0.92}
      >
        <View style={styles.cardImageWrap}>
          {finalImgUrl ? (
            <Image
              source={{ uri: finalImgUrl }}
              style={[styles.cardImage, { height: coverHeight }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.placeholder, { height: coverHeight }]}>
              <Text style={styles.placeholderText}>📚</Text>
            </View>
          )}
          {/* Badge sin stock */}
          {outOfStock && (
            <View style={styles.sinStockBadge}>
              <Text style={styles.sinStockText}>Sin stock</Text>
            </View>
          )}
          {/* Corazón favoritos */}
          <TouchableOpacity
            style={styles.heartBadge}
            onPress={() => toggleFavorito(item)}
            disabled={favoriteLoadingId === Number(item.id_libro)}
            accessibilityLabel={enFavoritos ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            accessibilityState={{ selected: enFavoritos, busy: favoriteLoadingId === Number(item.id_libro) }}
          >
            <Text style={[styles.heartIcon, enFavoritos && styles.heartIconActive]}>
              {enFavoritos ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
          {/* Badge impulso */}
          {item.es_impulsado && (
            <View style={styles.impulsoBadge}>
              <Text style={styles.impulsoBadgeText}>⭐ Destacado</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText} numberOfLines={1}>
              {item.nombre_categoria || 'General'}
            </Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo || 'Sin título'}</Text>
          <Text style={styles.cardAuthor} numberOfLines={1}>{item.autor_libro || item.autor || 'Autor desconocido'}</Text>

          <View style={styles.ratingInfoRow}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingVal}>{rating}</Text>
            <View style={[styles.disponibleBadge, outOfStock && styles.sinStockBadgeSmall]}>
              <Text style={[styles.disponibleText, outOfStock && styles.sinStockTextSmall]}>
                {outOfStock ? 'Sin stock' : 'Disponible'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardPrice}>
            ${Number(item.precio_libro ?? item.precio ?? 0).toLocaleString('es-CO')}
          </Text>
          {libreria && <Text style={styles.libreriaName} numberOfLines={1}>{libreria}</Text>}

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('BookDetailPublico', { book: item })}
          >
            <Text style={styles.detailButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        variant="dashboard"
        navigation={navigation}
        onSignOut={signOut}
        onSearch={text => handleFiltroChange('q', text)}
        onFilterApply={handleHeaderFilterApply}
        filtrosActivos={filtrosActivos}
      />

      <View style={styles.container}>
        <View style={styles.catalogTitleRow}>
          <IconBooks size={24} color={PRIMARY} />
          <Text style={styles.catalogTitle}>Catálogo de libros</Text>
        </View>

        {/* Panel heredado: los filtros se abren desde el Header compartido. */}
        {showFilterPanel && (
          <View style={styles.filterPanel}>

            {/* Fila 1: Título/autor y Librería */}
            <View style={styles.filterRow}>
              <View style={[styles.filterGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.filterLabel}>BUSCAR</Text>
                <TextInput
                  value={filtros.q}
                  onChangeText={val => handleFiltroChange('q', val)}
                  placeholder="Título, autor..."
                  placeholderTextColor="#AAA"
                  style={styles.filterInput}
                />
              </View>
              <View style={[styles.filterGroup, { flex: 1 }]}>
                <Text style={styles.filterLabel}>NOMBRE LIBRERÍA</Text>
                <TextInput
                  value={filtros.nombre_tienda}
                  onChangeText={val => handleFiltroChange('nombre_tienda', val)}
                  placeholder="Ej: Librería XYZ"
                  placeholderTextColor="#AAA"
                  style={styles.filterInput}
                />
              </View>
            </View>

            {/* Fila 2: Categoría y Ordenar por */}
            <View style={styles.filterRow}>
              <View style={[styles.filterGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.filterLabel}>CATEGORÍA</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setShowCatModal(true)}
                >
                  <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                    {catNombreSeleccionada}
                  </Text>
                  <Text style={styles.dropdownArrow}>▾</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.filterGroup, { flex: 1 }]}>
                <Text style={styles.filterLabel}>ORDENAR POR</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setShowSortModal(true)}
                >
                  <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                    {SORT_OPTIONS.find(o => o.value === filtros.ordenar_por)?.label || 'Relevancia'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▾</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fila 3: Rango de precio */}
            <View style={styles.filterRow}>
              <View style={[styles.filterGroup, { flex: 1 }]}>
                <Text style={styles.filterLabel}>PRECIO (COP)</Text>
                <View style={styles.priceRangeRow}>
                  <TextInput
                    value={filtros.precio_min}
                    onChangeText={val => handleFiltroChange('precio_min', val)}
                    keyboardType="numeric"
                    placeholder="Mín"
                    placeholderTextColor="#AAA"
                    style={[styles.filterInput, { flex: 1, marginRight: 4 }]}
                  />
                  <Text style={styles.priceSeparator}>—</Text>
                  <TextInput
                    value={filtros.precio_max}
                    onChangeText={val => handleFiltroChange('precio_max', val)}
                    keyboardType="numeric"
                    placeholder="Máx"
                    placeholderTextColor="#AAA"
                    style={[styles.filterInput, { flex: 1, marginLeft: 4 }]}
                  />
                </View>
                <Text style={styles.priceRangeLabel}>
                  ${Number(filtros.precio_min || 0).toLocaleString('es-CO')} — ${Number(filtros.precio_max || precioMaxReal).toLocaleString('es-CO')}
                </Text>
              </View>
            </View>

            {/* Fila 4: Calificación mínima */}
            <View style={styles.filterRow}>
              <View style={[styles.filterGroup, { flex: 1 }]}>
                <Text style={styles.filterLabel}>CALIFICACIÓN MÍNIMA</Text>
                <View style={styles.ratingRow}>
                  {[0, 1, 2, 3, 4, 5].map(stars => (
                    <TouchableOpacity
                      key={stars}
                      style={[styles.ratingBtn, filtros.calificacion_min === stars && styles.ratingBtnActive]}
                      onPress={() => handleFiltroChange('calificacion_min', stars)}
                    >
                      <Text style={[styles.ratingBtnText, filtros.calificacion_min === stars && styles.ratingBtnTextActive]}>
                        {stars === 0 ? 'Todas' : `${stars} ★`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Fila 5: Solo libros en stock */}
            <View style={[styles.filterRow, { marginBottom: 4 }]}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleFiltroChange('disponible', !filtros.disponible)}
              >
                <View style={[styles.checkbox, filtros.disponible && styles.checkboxChecked]}>
                  {filtros.disponible && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>SOLO LIBROS EN STOCK</Text>
              </TouchableOpacity>
            </View>

            {/* Acciones */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {filtrosActivos > 0 && (
                <TouchableOpacity
                  style={[styles.applyButton, { flex: 1, backgroundColor: '#888' }]}
                  onPress={handleLimpiarFiltros}
                >
                  <Text style={styles.applyButtonText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.applyButton, { flex: 2 }]}
                onPress={() => setShowFilterPanel(false)}
              >
                <Text style={styles.applyButtonText}>✓ Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Resumen de resultados ── */}
        {!loading && (
          <View style={styles.resultBar}>
            <Text style={styles.resultText}>
              {totalBooks > 0
                ? `${totalBooks.toLocaleString('es-CO')} libro${totalBooks !== 1 ? 's' : ''} encontrado${totalBooks !== 1 ? 's' : ''}`
                : 'Sin resultados'}
            </Text>
            {filtrosActivos > 0 && (
              <TouchableOpacity onPress={handleLimpiarFiltros}>
                <Text style={styles.limpiarLink}>Limpiar ({filtrosActivos})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Grid de libros / loading ── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Cargando catálogo...</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={books}
              key={`catalog-grid-${gridColumns}`}
              renderItem={renderBook}
              keyExtractor={(item, idx) => `${item.id_libro || item.id || 'book'}-${idx}`}
              numColumns={gridColumns}
              columnWrapperStyle={[styles.columnWrapper, { gap: cardGap }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              onLayout={handleListLayout}
              onContentSizeChange={handleContentSizeChange}
              onScroll={handleListScroll}
              scrollEventThrottle={16}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📖</Text>
                  <Text style={styles.emptyTitle}>No se encontraron libros</Text>
                  <Text style={styles.emptyText}>
                    Prueba con otra búsqueda o ajusta los filtros.
                  </Text>
                  {filtrosActivos > 0 && (
                    <TouchableOpacity style={[styles.applyButton, { marginTop: 16, paddingHorizontal: 20 }]} onPress={handleLimpiarFiltros}>
                      <Text style={styles.applyButtonText}>Limpiar filtros</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />

            {/* Se revela al llegar al final de la lista y se mantiene fija abajo. */}
            {totalPages > 1 && showPagination && <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
                onPress={() => cambiarPagina(page - 1)}
                disabled={page === 1}
              >
                <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                  ← Anterior
                </Text>
              </TouchableOpacity>

              <View style={styles.pageLabelBox}>
                <Text style={styles.pageLabelText}>Pág. {page} / {totalPages}</Text>
              </View>

              <TouchableOpacity
                style={[styles.paginationButton, styles.paginationButtonPrimary, page >= totalPages && styles.paginationButtonDisabledPrimary]}
                onPress={() => cambiarPagina(page + 1)}
                disabled={page >= totalPages}
              >
                <Text style={[styles.paginationButtonTextPrimary, page >= totalPages && styles.paginationButtonTextDisabledPrimary]}>
                  Siguiente →
                </Text>
              </TouchableOpacity>
            </View>}
          </>
        )}
      </View>

      {/* ── Modal: Seleccionar Categoría (con conteo de libros desde API) ── */}
      <Modal
        visible={showCatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una Categoría</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {/* Opción: Todas */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFiltros(prev => ({ ...prev, categoria_id: null, categoria_nombre: null }));
                  setPage(1);
                  setShowPagination(false);
                  ultimaBusquedaRef.current = null;
                  setShowCatModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, (!filtros.categoria_id && !filtros.categoria_nombre) && styles.activeOptionText]}>
                  Todas las categorías
                </Text>
              </TouchableOpacity>

              {/* Categorías desde API */}
              {loadingFiltros ? (
                <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 16 }} />
              ) : (
                categorias.map(cat => (
                  <TouchableOpacity
                    key={cat.id_categoria}
                    style={styles.modalOption}
                    onPress={() => {
                      setFiltros(prev => ({
                        ...prev,
                        categoria_id:     cat.id_categoria,
                        categoria_nombre: null,
                      }));
                      setPage(1);
                      setShowPagination(false);
                      ultimaBusquedaRef.current = null;
                      setShowCatModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      filtros.categoria_id === cat.id_categoria && styles.activeOptionText,
                    ]}>
                      {cat.nombre_categoria}
                      {cat.cantidad_libros != null
                        ? <Text style={styles.modalOptionCount}> ({cat.cantidad_libros})</Text>
                        : null}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCatModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Ordenar por ── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ordenar por</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.modalOption}
                  onPress={() => {
                    handleFiltroChange('ordenar_por', opt.value);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, filtros.ordenar_por === opt.value && styles.activeOptionText]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSortModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#f5f4f2' },

  // Top bar
  topBar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 18, paddingVertical: 14, minHeight: 64 },
  menuButton: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuIcon:   { width: 22, height: 18, justifyContent: 'space-between' },
  menuLine:   { height: 2.5, borderRadius: 2, backgroundColor: '#fff' },
  title:      { fontSize: 18, fontWeight: '800', color: '#fff' },

  // Container
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 14, backgroundColor: '#f5f4f2' },
  catalogTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  catalogTitle: { color: TEXT, fontSize: 20, fontWeight: '800' },

  // Barra de búsqueda
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 8, borderWidth: 1, borderColor: '#d2cfc8',
    height: 46, paddingHorizontal: 6, marginBottom: 12,
  },
  searchInput:     { flex: 1, fontSize: 14, color: '#1f1f1f', paddingVertical: 0, paddingLeft: 4 },
  filterButton:    { backgroundColor: PRIMARY, borderRadius: 5, paddingVertical: 6, paddingHorizontal: 10 },
  filterButtonContent: { flexDirection: 'row', alignItems: 'center' },
  filterButtonText:    { color: WHITE, fontSize: 13, fontWeight: '700', marginLeft: 5 },
  filtrosBadge:    { backgroundColor: WHITE, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 5, paddingHorizontal: 4 },
  filtrosBadgeText:{ color: PRIMARY, fontSize: 10, fontWeight: '800' },

  // Resultado bar
  resultBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultText:  { fontSize: 12, color: GRAY, fontWeight: '600' },
  limpiarLink: { fontSize: 12, color: PRIMARY, fontWeight: '700' },

  // Panel de filtros
  filterPanel: { backgroundColor: WHITE, borderRadius: 8, borderWidth: 1, borderColor: '#d2cfc8', padding: 12, marginBottom: 12 },
  filterRow:   { flexDirection: 'row', marginBottom: 12 },
  filterGroup: { flexDirection: 'column' },
  filterLabel: { fontSize: 10, fontWeight: '800', color: '#555', marginBottom: 5, letterSpacing: 0.4 },
  filterInput: { height: 38, borderWidth: 1, borderColor: '#d2cfc8', borderRadius: 6, paddingHorizontal: 8, fontSize: 13, color: '#1f1f1f', backgroundColor: WHITE },

  dropdownSelector:     { height: 38, borderWidth: 1, borderColor: '#d2cfc8', borderRadius: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: WHITE },
  dropdownSelectorText: { fontSize: 12, color: '#1f1f1f', flex: 1 },
  dropdownArrow:        { fontSize: 12, color: GRAY },

  priceRangeRow:  { flexDirection: 'row', alignItems: 'center' },
  priceSeparator: { fontSize: 14, color: GRAY, marginHorizontal: 2 },
  priceRangeLabel:{ fontSize: 11, fontWeight: '700', color: PRIMARY, marginTop: 4, textAlign: 'center' },

  ratingRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ratingBtn:          { paddingHorizontal: 7, paddingVertical: 5, borderWidth: 1, borderColor: '#d2cfc8', borderRadius: 5, backgroundColor: WHITE, alignItems: 'center' },
  ratingBtnActive:    { backgroundColor: PRIMARY, borderColor: PRIMARY },
  ratingBtnText:      { fontSize: 11, color: '#333', fontWeight: '600' },
  ratingBtnTextActive:{ color: WHITE },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox:          { width: 18, height: 18, borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 3, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  checkboxChecked:   { backgroundColor: PRIMARY },
  checkboxCheck:     { color: WHITE, fontSize: 11, fontWeight: '800' },
  checkboxLabel:     { fontSize: 11, fontWeight: '700', color: '#333' },

  applyButton:     { backgroundColor: PRIMARY, borderRadius: 6, height: 40, alignItems: 'center', justifyContent: 'center' },
  applyButtonText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  // Grid libros
  loadingWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText:    { marginTop: 10, color: GRAY },
  // Reserva espacio para que la última fila no quede bajo la paginación fija.
  listContent:    { paddingBottom: 112 },
  columnWrapper:  { justifyContent: 'flex-start', marginBottom: 14 },

  // Tarjeta
  card:          { backgroundColor: WHITE, borderRadius: 9, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  cardImageWrap: { position: 'relative', width: '100%' },
  cardImage:     { width: '100%', backgroundColor: '#ece9e4' },
  sinStockBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  sinStockText:  { color: WHITE, fontSize: 9, fontWeight: '700' },
  heartBadge:    { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 50, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  heartIcon:     { color: PRIMARY, fontSize: 19, lineHeight: 20 },
  heartIconActive: { color: PRIMARY },
  impulsoBadge:  { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#fbbf24', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  impulsoBadgeText: { fontSize: 9, fontWeight: '700', color: '#78350f' },
  placeholder:   { alignItems: 'center', justifyContent: 'center' },
  placeholderText:{ fontSize: 36 },

  cardBody:         { paddingHorizontal: 10, paddingTop: 9, paddingBottom: 10 },
  categoryPill:     { alignSelf: 'flex-start', backgroundColor: '#F7E9EE', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, maxWidth: '100%', marginBottom: 5 },
  categoryPillText: { color: '#9D274D', fontSize: 9, fontWeight: '700' },
  cardTitle:        { color: '#1c1c1c', fontSize: 12, fontWeight: '800', marginBottom: 2, lineHeight: 16 },
  cardAuthor:       { color: '#777', fontSize: 10, marginBottom: 4, fontStyle: 'italic' },
  ratingInfoRow:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3, marginBottom: 5 },
  starIcon:         { color: '#F59E0B', fontSize: 12 },
  ratingVal:        { color: '#333', fontSize: 11, fontWeight: '700' },
  disponibleBadge:       { backgroundColor: '#DCFCE7', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  disponibleText:        { color: '#16A34A', fontSize: 9, fontWeight: '700' },
  sinStockBadgeSmall:    { backgroundColor: '#FEE2E2' },
  sinStockTextSmall:     { color: '#DC2626' },
  cardPrice:        { color: PRIMARY, fontSize: 14, fontWeight: '800', marginBottom: 3 },
  libreriaName:     { color: '#8b8b8b', fontSize: 9, marginBottom: 7 },
  detailButton:     { backgroundColor: PRIMARY, borderRadius: 6, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  detailButtonText: { color: WHITE, fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { color: '#1d1d1d', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText:  { color: GRAY, fontSize: 14, textAlign: 'center' },

  // Paginación
  paginationRow:   { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10, backgroundColor: '#f5f4f2', borderTopWidth: 1, borderTopColor: '#e0dbd4' },
  paginationButton:{ borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingVertical: 10 },
  paginationButtonDisabled:        { opacity: 0.4 },
  paginationButtonPrimary:         { borderColor: PRIMARY, backgroundColor: WHITE },
  paginationButtonDisabledPrimary: { opacity: 0.5 },
  paginationButtonText:            { color: '#2f2f2f', fontSize: 13, fontWeight: '600' },
  paginationButtonTextDisabled:    { color: '#aaa' },
  paginationButtonTextPrimary:     { color: PRIMARY, fontSize: 13, fontWeight: '700' },
  paginationButtonTextDisabledPrimary: { color: '#a76b80' },
  pageLabelBox:  { minWidth: 100, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  pageLabelText: { color: '#333', fontSize: 13, fontWeight: '600' },

  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: TEXT, marginBottom: 14, textAlign: 'center' },
  modalOption:  { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalOptionText:  { fontSize: 15, color: TEXT, textAlign: 'center' },
  modalOptionCount: { fontSize: 13, color: GRAY },
  activeOptionText: { fontWeight: '700', color: PRIMARY },
  modalCancel:      { marginTop: 18, paddingVertical: 14, backgroundColor: BG, borderRadius: 12 },
  modalCancelText:  { fontSize: 15, fontWeight: '700', color: PRIMARY, textAlign: 'center' },
});
