import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { getApiBaseUrl, getBooks, getBusquedaAvanzada } from '../services/api';
import { IconSearch } from '../components/Icons';
import { AuthContext } from '../context/AuthContext';
import SidebarMenu from '../components/SidebarMenu';

const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const WHITE = '#FFFFFF';
const GRAY = '#6B7280';
const TEXT = '#1F2937';
const BORDER = '#E5E7EB';
const CARD = '#FFFFFF';

const CATEGORIES = [
  { id: 1, label: 'Ficción', emoji: '🚀' },
  { id: 2, label: 'Romance', emoji: '💕' },
  { id: 3, label: 'Historia', emoji: '📜' },
  { id: 4, label: 'Ciencia', emoji: '🔬' },
  { id: 5, label: 'Poesía', emoji: '✒️' },
  { id: 6, label: 'Filosofía', emoji: '🧠' },
  { id: 7, label: 'Arte', emoji: '🎨' },
  { id: 8, label: 'Tecnología', emoji: '💻' },
];

const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'calificacion', label: 'Calificación' },
  { value: 'recientes', label: 'Recientes' },
];

export default function Catalogo({ navigation, route }) {
  const { user, signOut } = useContext(AuthContext);
  const { width: windowWidth } = useWindowDimensions();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const [filtros, setFiltros] = useState({
    q: '',
    categoria_id: route?.params?.categoryId ?? null,
    precio_min: '0',
    precio_max: '75000',
    calificacion_min: 0,
    disponible: true,
    ordenar_por: 'relevancia',
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const gridColumns = Math.max(2, Math.floor((windowWidth - 32) / 140));
  const cardGap = windowWidth >= 700 ? 14 : 10;
  const cardWidth = (windowWidth - 32 - (cardGap * (gridColumns - 1))) / gridColumns;
  const coverHeight = Math.max(132, Math.min(170, cardWidth * 1.12));

  const loadCatalogBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.q) params.q = filtros.q;
      if (filtros.categoria_id) params.categoria_id = filtros.categoria_id;
      if (filtros.precio_min) params.precio_min = Number(filtros.precio_min);
      if (filtros.precio_max) params.precio_max = Number(filtros.precio_max);
      if (filtros.calificacion_min) params.calificacion_min = filtros.calificacion_min;
      if (filtros.disponible) params.disponible = true;
      params.ordenar_por = filtros.ordenar_por;
      params.pagina = page;
      params.limite = windowWidth >= 700 ? 30 : 12;

      const response = await getBusquedaAvanzada(params);
      const data = response.data || {};
      setBooks(data.libros || []);
      setTotalPages(data.total_paginas || 1);
      setTotalBooks(data.total || 0);
    } catch (error) {
      console.log('Error cargando catálogo', error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogBooks();
  }, [filtros, page, windowWidth]);

  useEffect(() => {
    if (route?.params?.categoryId) {
      setFiltros((prev) => ({ ...prev, categoria_id: Number(route.params.categoryId) }));
      setPage(1);
    }
  }, [route?.params?.categoryId]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPage(1);
  };

  const renderBook = ({ item }) => {
    const imageUrl = item.imagen || item.imagen_url;
    const finalImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${getApiBaseUrl()}${imageUrl}`) : null;
    const rating = Number(item.calificacion_promedio || item.calificacion || 0).toFixed(1);
    const numReviews = item.num_calificaciones || item.total_calificaciones || 0;
    const disponible = item.disponible !== false;
    const libreria = item.nombre_tienda || item.libreria || item.tienda || null;

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }]}
        onPress={() => navigation.navigate('BookDetail', { book: item })}
        activeOpacity={0.92}
      >
        {/* Image with overlays */}
        <View style={styles.cardImageWrap}>
          {finalImageUrl ? (
            <Image source={{ uri: finalImageUrl }} style={[styles.cardImage, { height: coverHeight }]} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.placeholder, { height: coverHeight }]}>
              <Text style={styles.placeholderText}>📚</Text>
            </View>
          )}
          {/* Heart icon top-right */}
          <TouchableOpacity style={styles.heartBadge} accessibilityLabel="Agregar a favoritos">
            <Text style={styles.heartIcon}>♡</Text>
          </TouchableOpacity>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText} numberOfLines={1}>{item.nombre_categoria || item.categoria || 'General'}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo || item.nombre || 'Sin título'}</Text>
          <Text style={styles.cardAuthor} numberOfLines={1}>{item.autor_libro || item.autor || 'Autor desconocido'}</Text>

          {/* Rating row */}
          <View style={styles.ratingInfoRow}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingVal}>{rating}</Text>
            {disponible && (
              <View style={styles.disponibleBadge}>
                <Text style={styles.disponibleText}>Disponible</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardPrice}>${Number(item.precio_libro ?? item.precio ?? 0).toLocaleString('es-CO')}</Text>
          {libreria && <Text style={styles.libreriaName} numberOfLines={1}>{libreria}</Text>}
          <TouchableOpacity style={styles.detailButton} onPress={() => navigation.navigate('BookDetail', { book: item })}>
            <Text style={styles.detailButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Sidebar Menu */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Catálogo</Text>
      </View>

      <View style={styles.container}>

        <View style={styles.searchWrapper}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterPanel(!showFilterPanel)}>
            <View style={styles.filterButtonContent}>
              <IconSearch size={13} color="#ffffff" />
              <Text style={styles.filterButtonText}>Filtros</Text>
            </View>
          </TouchableOpacity>
          <TextInput
            value={filtros.q}
            onChangeText={(val) => handleFiltroChange('q', val)}
            placeholder="Buscar libros..."
            placeholderTextColor="#747474"
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>

        {showFilterPanel && (
          <View style={styles.filterPanel}>
            {/* Fila 1: Buscar y Categoría */}
            <View style={styles.filterRow}>
              <View style={[styles.filterGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.filterLabel}>BUSCAR</Text>
                <TextInput
                  value={filtros.q}
                  onChangeText={(val) => handleFiltroChange('q', val)}
                  placeholder="Título, autor..."
                  placeholderTextColor="#AAA"
                  style={styles.filterInput}
                />
              </View>
              <View style={[styles.filterGroup, { flex: 1 }]}>
                <Text style={styles.filterLabel}>CATEGORÍA</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setShowCatModal(true)}
                >
                  <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                    {filtros.categoria_id 
                      ? CATEGORIES.find((cat) => cat.id === Number(filtros.categoria_id))?.label 
                      : 'Todas las categorías'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▾</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fila 2: Precio y Calificación Mínima */}
            <View style={styles.filterRow}>
              <View style={[styles.filterGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.filterLabel}>PRECIO</Text>
                <View style={styles.priceRangeRow}>
                  <TextInput
                    value={filtros.precio_min}
                    onChangeText={(val) => handleFiltroChange('precio_min', val)}
                    keyboardType="numeric"
                    placeholder="Mín"
                    placeholderTextColor="#AAA"
                    style={[styles.filterInput, { flex: 1, marginRight: 4 }]}
                  />
                  <Text style={styles.priceSeparator}>-</Text>
                  <TextInput
                    value={filtros.precio_max}
                    onChangeText={(val) => handleFiltroChange('precio_max', val)}
                    keyboardType="numeric"
                    placeholder="Máx"
                    placeholderTextColor="#AAA"
                    style={[styles.filterInput, { flex: 1, marginLeft: 4 }]}
                  />
                </View>
                <Text style={styles.priceRangeLabel}>
                  ${Number(filtros.precio_min || 0).toLocaleString('es-CO')} - ${Number(filtros.precio_max || 75000).toLocaleString('es-CO')}
                </Text>
              </View>
              <View style={[styles.filterGroup, { flex: 1 }]}>
                <Text style={styles.filterLabel}>CALIFICACIÓN MÍNIMA</Text>
                <View style={styles.ratingRow}>
                  <TouchableOpacity
                    style={[styles.ratingBtn, filtros.calificacion_min === 0 && styles.ratingBtnActive]}
                    onPress={() => handleFiltroChange('calificacion_min', 0)}
                  >
                    <Text style={[styles.ratingBtnText, filtros.calificacion_min === 0 && styles.ratingBtnTextActive]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <TouchableOpacity
                      key={stars}
                      style={[styles.ratingBtn, filtros.calificacion_min === stars && styles.ratingBtnActive]}
                      onPress={() => handleFiltroChange('calificacion_min', stars)}
                    >
                      <Text style={[styles.ratingBtnText, filtros.calificacion_min === stars && styles.ratingBtnTextActive]}>
                        {stars} ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Fila 3: Solo libros en stock y Ordenar por */}
            <View style={styles.filterRow}>
              <View style={[styles.filterGroup, { flex: 1, marginRight: 8, justifyContent: 'center' }]}>
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
              <View style={[styles.filterGroup, { flex: 1 }]}>
                <Text style={styles.filterLabel}>ORDENAR POR</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setShowSortModal(true)}
                >
                  <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                    {SORT_OPTIONS.find((opt) => opt.value === filtros.ordenar_por)?.label || 'Relevancia'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▾</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón aplicar filtros */}
            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilterPanel(false)}>
              <Text style={styles.applyButtonText}>✓ Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        )}

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
              keyExtractor={(item, index) => `${item.id_libro || item.id || 'book'}-${index}`}
              numColumns={gridColumns}
              columnWrapperStyle={[styles.columnWrapper, { gap: cardGap }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📖</Text>
                  <Text style={styles.emptyTitle}>No se encontraron libros</Text>
                  <Text style={styles.emptyText}>Prueba con otra búsqueda o cambia la categoría.</Text>
                </View>
              }
            />

            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
                onPress={() => page > 1 && setPage(page - 1)}
                disabled={page === 1}
              >
                <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>← Anterior</Text>
              </TouchableOpacity>

              <View style={styles.pageLabelBox}>
                <Text style={styles.pageLabelText}>Página {page} de {totalPages}</Text>
              </View>

              <TouchableOpacity
                style={[styles.paginationButton, styles.paginationButtonPrimary, page >= totalPages && styles.paginationButtonDisabledPrimary]}
                onPress={() => page < totalPages && setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <Text style={[styles.paginationButtonTextPrimary, page >= totalPages && styles.paginationButtonTextDisabledPrimary]}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Modal Categoría */}
      <Modal visible={showCatModal} transparent animationType="slide" onRequestClose={() => setShowCatModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una Categoría</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleFiltroChange('categoria_id', null);
                  setShowCatModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, !filtros.categoria_id && styles.activeOptionText]}>
                  Todas las categorías
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.modalOption}
                  onPress={() => {
                    handleFiltroChange('categoria_id', cat.id);
                    setShowCatModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, filtros.categoria_id === cat.id && styles.activeOptionText]}>
                    {cat.emoji} {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCatModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ordenar por */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ordenar por</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {SORT_OPTIONS.map((opt) => (
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f4f2',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7A1E3A',
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 64,
  },
  menuButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    width: 22,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: '#f5f4f2',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d2cfc8',
    height: 46,
    paddingHorizontal: 6,
    marginBottom: 12,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f1f1f',
    paddingVertical: 0,
    paddingLeft: 4,
  },
  filterButton: {
    backgroundColor: '#7A1E3A',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContent: {
    paddingBottom: 36,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 9,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardImageWrap: {
    position: 'relative',
    width: '100%',
  },
  cardImage: {
    width: '100%',
    backgroundColor: '#ece9e4',
  },
  heartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 50,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    color: '#7A1E3A',
    fontSize: 19,
    lineHeight: 20,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 36,
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 10,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7E9EE',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: '100%',
    marginBottom: 6,
  },
  categoryPillText: {
    color: '#9D274D',
    fontSize: 9,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#1c1c1c',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
    lineHeight: 16,
  },
  cardAuthor: {
    color: '#777',
    fontSize: 10,
    marginBottom: 4,
  },
  ratingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 5,
  },
  starIcon: {
    color: '#F59E0B',
    fontSize: 12,
  },
  ratingVal: {
    color: '#333',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingCount: {
    color: '#999',
    fontSize: 10,
  },
  disponibleBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  disponibleText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '700',
  },
  cardPrice: {
    color: '#7A1E3A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  libreriaName: {
    color: '#8b8b8b',
    fontSize: 9,
    marginBottom: 8,
  },
  detailButton: {
    backgroundColor: '#7A1E3A',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#1d1d1d',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginBottom: 22,
    gap: 12,
  },
  paginationButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationButtonPrimary: {
    borderColor: PRIMARY,
    backgroundColor: WHITE,
  },
  paginationButtonDisabledPrimary: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#2f2f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#aaa',
  },
  paginationButtonTextPrimary: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  paginationButtonTextDisabledPrimary: {
    color: '#a76b80',
  },
  pageLabelBox: {
    minWidth: 116,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pageLabelText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalOptionText: {
    fontSize: 16,
    color: TEXT,
    textAlign: 'center',
  },
  activeOptionText: {
    fontWeight: '700',
    color: PRIMARY,
  },
  modalCancel: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: BG,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  filterPanel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d2cfc8',
    padding: 12,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterGroup: {
    flexDirection: 'column',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
  },
  filterInput: {
    height: 38,
    borderWidth: 1,
    borderColor: '#d2cfc8',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#1f1f1f',
    backgroundColor: '#fff',
  },
  dropdownSelector: {
    height: 38,
    borderWidth: 1,
    borderColor: '#d2cfc8',
    borderRadius: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dropdownSelectorText: {
    fontSize: 13,
    color: '#1f1f1f',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  priceRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceSeparator: {
    fontSize: 14,
    color: '#666',
  },
  priceRangeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A1E3A',
    marginTop: 4,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  ratingBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#d2cfc8',
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBtnActive: {
    backgroundColor: '#7A1E3A',
    borderColor: '#7A1E3A',
  },
  ratingBtnText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },
  ratingBtnTextActive: {
    color: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#7A1E3A',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#7A1E3A',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  checkboxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#7A1E3A',
    borderRadius: 6,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
