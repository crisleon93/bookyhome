// src/screens/PostLogin.jsx
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  ScrollView, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addFavorito, getBooks, getApiBaseUrl, getFavoritos, searchByISBN } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import Header from '../components/Header';
import { IconBooks, IconStore, IconStar, IconCart, IconFavorites, IconMail, IconPackage, IconDollar, IconBook } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const BG      = '#F9F6F1';
const WHITE   = '#FFFFFF';
const GRAY    = '#888';
const BORDER  = '#EEE';
const CARBON  = '#2A2A2A';
const BEIGE   = '#F4EDE2';

const CATEGORIES = [
  { id: 1, label: 'Ficción',    emoji: '🚀' },
  { id: 2, label: 'Romance',    emoji: '💕' },
  { id: 3, label: 'Historia',   emoji: '📜' },
  { id: 4, label: 'Ciencia',    emoji: '🔬' },
  { id: 5, label: 'Poesía',     emoji: '✒️' },
  { id: 6, label: 'Filosofía',  emoji: '🧠' },
  { id: 7, label: 'Arte',       emoji: '🎨' },
  { id: 8, label: 'Tecnología', emoji: '💻' },
];

export default function PostLogin({ navigation }) {
  const [books, setBooks]               = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [scanningISBN, setScanningISBN] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteNotice, setFavoriteNotice] = useState(false);
  const { signOut, user } = useContext(AuthContext);
  const { cart } = useContext(CartContext);

  // ── Filtros avanzados ──
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    precioMin: '',
    precioMax: '',
    tienda: '',
    correoVendedor: '',
    estado: '',    // 'nuevo', 'usado_buen_estado', 'usado_regular'
    formato: '',   // 'fisico', 'digital'
  });

  const cartItemsCount = cart.reduce((sum, item) => sum + (item.cantidad || 1), 0);

  // Extraer tiendas únicas de los libros
  const tiendasUnicas = [...new Set(books.map(b => b.nombre_tienda).filter(Boolean))].sort();

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const res  = await getBooks();
        const data = res.data || [];
        setBooks(data);
        setFiltered(data);
      } catch (e) {
        console.log('Error fetching libros', e.message);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  useFocusEffect(useCallback(() => {
    getFavoritos()
      .then((res) => setFavoriteIds(new Set((res.data || []).map((libro) => Number(libro.id_libro)))))
      .catch(() => {});
  }, []));

  // ── Aplicar todos los filtros ──
  const applyFilters = (searchText, categoryId, currentFilters) => {
    let result = [...books];

    // Filtro de texto (título, autor, tienda)
    if (searchText) {
      const term = searchText.toLowerCase();
      result = result.filter(b =>
        (b.titulo || b.nombre || '').toLowerCase().includes(term) ||
        (b.autor_libro || b.autor || '').toLowerCase().includes(term) ||
        (b.nombre_tienda || '').toLowerCase().includes(term) ||
        (b.email_vendedor || '').toLowerCase().includes(term) ||
        (b.isbn || '').toLowerCase().includes(term) ||
        (b.descripcion || '').toLowerCase().includes(term)
      );
    }

    // Filtro por categoría
    if (categoryId) {
      const catLabel = CATEGORIES.find(c => c.id === categoryId)?.label || '';
      result = result.filter(b =>
        (b.nombre_categoria || b.categoria || '').toLowerCase().includes(catLabel.toLowerCase())
      );
    }

    // Filtro por precio mínimo
    if (currentFilters.precioMin) {
      const min = parseFloat(currentFilters.precioMin);
      if (!isNaN(min)) result = result.filter(b => (b.precio_libro ?? b.precio ?? 0) >= min);
    }

    // Filtro por precio máximo
    if (currentFilters.precioMax) {
      const max = parseFloat(currentFilters.precioMax);
      if (!isNaN(max)) result = result.filter(b => (b.precio_libro ?? b.precio ?? 0) <= max);
    }

    // Filtro por tienda
    if (currentFilters.tienda) {
      result = result.filter(b =>
        (b.nombre_tienda || '').toLowerCase() === currentFilters.tienda.toLowerCase()
      );
    }

    // Filtro por correo del vendedor
    if (currentFilters.correoVendedor) {
      result = result.filter(b =>
        (b.email_vendedor || '').toLowerCase().includes(currentFilters.correoVendedor.toLowerCase())
      );
    }

    // Filtro por estado
    if (currentFilters.estado) {
      result = result.filter(b =>
        (b.estado || '').toLowerCase() === currentFilters.estado.toLowerCase()
      );
    }

    // Filtro por formato
    if (currentFilters.formato) {
      result = result.filter(b =>
        (b.formato || '').toLowerCase() === currentFilters.formato.toLowerCase()
      );
    }

    setFiltered(result);
  };

  // Este handler lo recibe el Header via onSearch
  const handleSearch = (text) => {
    setSearch(text);
    setActiveCategory(null);
    applyFilters(text, null, filters);
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    applyFilters(search, activeCategory, filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = { precioMin: '', precioMax: '', tienda: '', correoVendedor: '', estado: '', formato: '' };
    setFilters(emptyFilters);
    setShowFilters(false);
    applyFilters(search, activeCategory, emptyFilters);
  };

  const activeFilterCount = [filters.precioMin, filters.precioMax, filters.tienda, filters.correoVendedor, filters.estado, filters.formato].filter(Boolean).length;

  // Handler para ISBN escaneado
  const handleBarcodeScanned = async (isbn) => {
    setScanningISBN(true);
    setSearch(isbn);
    setActiveCategory(null);

    try {
      const response = await searchByISBN(isbn);
      const isbnBooks = response.data?.libros || [];

      if (isbnBooks.length > 0) {
        // Mostrar resultados del ISBN escaneado
        setFiltered(isbnBooks);
        
        // Mostrar mensaje de éxito
        const mejorPrecio = isbnBooks[0].precio_libro;
        const numVendedores = isbnBooks.length;
        
        Alert.alert(
          '¡Libro encontrado!',
          `Encontramos ${numVendedores} vendedor${numVendedores > 1 ? 'es' : ''} con este libro. Mejor precio: $${Number(mejorPrecio).toLocaleString('es-CO')}`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        // No se encontraron libros con este ISBN
        Alert.alert(
          'Libro no encontrado',
          'No encontramos vendedores en BookyHome con este ISBN. Intenta buscar por título o autor.',
          [
            { text: 'OK', onPress: () => setFiltered(books) }
          ]
        );
      }
    } catch (error) {
      console.error('Error buscando por ISBN:', error);
      Alert.alert(
        'Error de búsqueda',
        'Hubo un error al buscar el libro. Por favor intenta nuevamente.',
        [
          { text: 'OK', onPress: () => setFiltered(books) }
        ]
      );
    } finally {
      setScanningISBN(false);
    }
  };

  const handleCategory = (cat) => {
    if (activeCategory === cat.id) {
      setActiveCategory(null);
      applyFilters(search, null, filters);
    } else {
      setActiveCategory(cat.id);
      setSearch('');
      applyFilters('', cat.id, filters);
    }
  };

  const renderBook = ({ item }) => {
    const bookId = Number(item.id_libro || item.id);
    const isFavorite = favoriteIds.has(bookId);
    const imageUrl = item.imagen || item.imagen_url;
    const finalImageUrl = imageUrl 
      ? (imageUrl.startsWith('http') ? imageUrl : `${getApiBaseUrl()}${imageUrl}`)
      : null;

    return (
      <View
        style={styles.card}
      >
        {finalImageUrl
          ? <Image source={{ uri: finalImageUrl }} style={styles.cardImg} resizeMode="cover" />
          : <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
              <Text style={{ fontSize: 28 }}>📚</Text>
            </View>
        }
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.titulo || item.nombre || 'Sin título'}
          </Text>
          <Text style={styles.cardAuthor} numberOfLines={1}>
            {item.autor_libro || item.autor || ''}
          </Text>
          <Text style={styles.cardPrice}>
            ${Number(item.precio_libro ?? item.precio ?? 0).toLocaleString('es-CO')}
          </Text>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => navigation.navigate('BookDetail', { book: item })}>
            <Text style={styles.addBtnText}>Ver detalles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]}
            activeOpacity={0.8}
            disabled={isFavorite}
            onPress={async () => {
              try {
                await addFavorito(bookId);
                setFavoriteIds((current) => new Set([...current, bookId]));
                setFavoriteNotice(true);
              } catch (error) {
                const mensaje = error.response?.data?.detail;
                if (mensaje === 'El libro ya está en favoritos') {
                  setFavoriteIds((current) => new Set([...current, bookId]));
                  return;
                }
                Alert.alert('Favoritos', mensaje || 'No se pudo agregar a favoritos.');
              }
            }}
          >
            <IconFavorites size={14} color={isFavorite ? WHITE : PRIMARY} />
            <Text style={[styles.favoriteBtnText, isFavorite && styles.favoriteBtnTextActive]}>{isFavorite ? 'En favoritos' : 'Agregar a favoritos'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // El greeting va aquí dentro del ListHeader, no en el Header
  const ListHeader = () => (
    <View>
      {/* Saludo debajo del Header */}
      <View style={styles.greetingRow}>
        <Text style={styles.greetingText}>
          Hola, {user?.nombre || user?.email?.split('@')[0] || 'lector'} 👋
        </Text>
        <Text style={styles.greetingSub}>¿Qué libro buscas hoy?</Text>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        {[
          { value: '+10.000', label: 'Libros', icon: <IconBooks size={18} color={PRIMARY} /> },
          { value: '+150',    label: 'Librerías', icon: <IconStore size={18} color={PRIMARY} /> },
          { value: '4.8',     label: 'Calificación', icon: <IconStar size={18} color={PRIMARY} /> },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <View style={styles.statIconWrap}>{s.icon}</View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Categorías */}
      <Text style={styles.sectionTitle}>Explorar categorías</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {/* Botón de Filtros */}
        <TouchableOpacity
          style={[styles.catChip, { backgroundColor: activeFilterCount > 0 ? PRIMARY : WHITE, borderColor: activeFilterCount > 0 ? PRIMARY : BORDER }]}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.catEmoji}>🔍</Text>
          <Text style={[styles.catLabel, activeFilterCount > 0 && { color: WHITE }]}>
            Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
            onPress={() => handleCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filtros activos */}
      {activeFilterCount > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 8 }}>
          {filters.tienda ? (
            <View style={styles.filterTag}><Text style={styles.filterTagText}>🏪 {filters.tienda}</Text></View>
          ) : null}
          {filters.precioMin ? (
            <View style={styles.filterTag}><Text style={styles.filterTagText}>Min: ${filters.precioMin}</Text></View>
          ) : null}
          {filters.precioMax ? (
            <View style={styles.filterTag}><Text style={styles.filterTagText}>Max: ${filters.precioMax}</Text></View>
          ) : null}
          {filters.estado ? (
            <View style={styles.filterTag}><Text style={styles.filterTagText}>📦 {filters.estado === 'nuevo' ? 'Nuevo' : filters.estado === 'usado_buen_estado' ? 'Buen estado' : 'Regular'}</Text></View>
          ) : null}
          {filters.formato ? (
            <View style={styles.filterTag}><Text style={styles.filterTagText}>{filters.formato === 'digital' ? '💾 Digital' : '📖 Físico'}</Text></View>
          ) : null}
          <TouchableOpacity style={[styles.filterTag, { backgroundColor: 'rgba(255,255,255,0.3)' }]} onPress={handleClearFilters}>
            <Text style={[styles.filterTagText, { fontWeight: '800' }]}>✕ Limpiar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Título del catálogo */}
      <Text style={styles.sectionTitle}>
        {activeCategory
          ? CATEGORIES.find(c => c.id === activeCategory)?.label
          : search
          ? `Resultados para "${search}"`
          : 'Catálogo completo'}
        {` (${filtered.length})`}
      </Text>

      {filtered.length === 0 && !loading && (
        <Text style={styles.emptyText}>No se encontraron libros.</Text>
      )}
    </View>
  );

  return (
    // SafeAreaView ya lo maneja Header internamente via StatusBar,
    // pero lo conservamos aquí para el layout del contenido
    <SafeAreaView style={styles.safe}>

      {/* Header reutilizable — variante dashboard */}
      <Header
        variant="dashboard"
        navigation={navigation}
        onSignOut={signOut}
        onSearch={handleSearch}
        onBarcodeScanned={handleBarcodeScanned}
        onFilterPress={() => setShowFilters(true)}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={{ color: GRAY, marginTop: 12 }}>Cargando catálogo...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) =>
            String(item.id_libro || item.id || item.id_producto || Math.random())
          }
          renderItem={renderBook}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Floating Cart Button */}
      {cartItemsCount > 0 && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <IconCart size={24} color={WHITE} />
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{cartItemsCount > 9 ? '9+' : cartItemsCount}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Modal de Filtros Avanzados ── */}
      <Modal visible={showFilters} transparent animationType="slide">
        <View style={styles.filterOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>🔍 Filtros Avanzados</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={{ fontSize: 22, color: '#999' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
              <View style={{ gap: 20 }}>
                {/* Rango de precio */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <IconDollar size={18} color={GRAY} />
                    <Text style={[styles.filterLabel, { marginTop: 0, marginBottom: 0, marginLeft: 6 }]}>Rango de precio (COP)</Text>
                  </View>
                  <View style={styles.filterRow}>
                    <TextInput
                      style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
                      placeholder="Mínimo"
                      keyboardType="numeric"
                      value={filters.precioMin}
                      onChangeText={(v) => setFilters({ ...filters, precioMin: v })}
                    />
                    <TextInput
                      style={[styles.filterInput, { flex: 1 }]}
                      placeholder="Máximo"
                      keyboardType="numeric"
                      value={filters.precioMax}
                      onChangeText={(v) => setFilters({ ...filters, precioMax: v })}
                    />
                  </View>
                </View>

                {/* Tienda */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <IconStore size={18} color={GRAY} />
                    <Text style={[styles.filterLabel, { marginTop: 0, marginBottom: 0, marginLeft: 6 }]}>Nombre de Tienda</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                    <TouchableOpacity
                      style={[styles.filterChip, !filters.tienda && styles.filterChipActive]}
                      onPress={() => setFilters({ ...filters, tienda: '' })}
                    >
                      <Text style={[styles.filterChipText, !filters.tienda && styles.filterChipTextActive]}>Todas</Text>
                    </TouchableOpacity>
                    {tiendasUnicas.map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.filterChip, filters.tienda === t && styles.filterChipActive]}
                        onPress={() => setFilters({ ...filters, tienda: filters.tienda === t ? '' : t })}
                      >
                        <Text style={[styles.filterChipText, filters.tienda === t && styles.filterChipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Correo del Vendedor */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <IconMail size={18} color={GRAY} />
                    <Text style={[styles.filterLabel, { marginTop: 0, marginBottom: 0, marginLeft: 6 }]}>Correo del Vendedor</Text>
                  </View>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Ej. libreria@bookyhome.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={filters.correoVendedor}
                    onChangeText={(v) => setFilters({ ...filters, correoVendedor: v })}
                  />
                </View>

                {/* Estado */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <IconPackage size={18} color={GRAY} />
                    <Text style={[styles.filterLabel, { marginTop: 0, marginBottom: 0, marginLeft: 6 }]}>Estado del libro</Text>
                  </View>
                  <View style={[styles.filterRow, { marginBottom: 0 }]}>
                    {[
                      { value: '', label: 'Todos' },
                      { value: 'nuevo', label: 'Nuevo' },
                      { value: 'usado_buen_estado', label: 'Buen estado' },
                      { value: 'usado_regular', label: 'Regular' },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.filterChip, filters.estado === opt.value && styles.filterChipActive]}
                        onPress={() => setFilters({ ...filters, estado: opt.value })}
                      >
                        <Text style={[styles.filterChipText, filters.estado === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Formato */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <IconBook size={18} color={GRAY} />
                    <Text style={[styles.filterLabel, { marginTop: 0, marginBottom: 0, marginLeft: 6 }]}>Formato</Text>
                  </View>
                  <View style={[styles.filterRow, { marginBottom: 0 }]}>
                    {[
                      { value: '', label: 'Todos' },
                      { value: 'fisico', label: 'Físico' },
                      { value: 'digital', label: 'Digital' },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.filterChip, filters.formato === opt.value && styles.filterChipActive]}
                        onPress={() => setFilters({ ...filters, formato: opt.value })}
                      >
                        <Text style={[styles.filterChipText, filters.formato === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Botones */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.filterClearBtn} onPress={handleClearFilters}>
                <Text style={styles.filterClearBtnText}>Limpiar filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterApplyBtn} onPress={handleApplyFilters}>
                <Text style={styles.filterApplyBtnText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={favoriteNotice} transparent animationType="fade" onRequestClose={() => setFavoriteNotice(false)}>
        <View style={styles.favoriteOverlay}>
          <View style={styles.favoriteNoticeCard}>
            <View style={styles.favoriteNoticeIcon}><IconFavorites size={28} color={WHITE} /></View>
            <Text style={styles.favoriteNoticeTitle}>¡Guardado en favoritos!</Text>
            <Text style={styles.favoriteNoticeText}>Este libro ya está disponible en tu lista de deseos.</Text>
            <TouchableOpacity style={styles.favoriteNoticeButton} onPress={() => setFavoriteNotice(false)}>
              <Text style={styles.favoriteNoticeButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY },

  /* Greeting */
  greetingRow: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  greetingText: { fontSize: 18, fontWeight: '800', color: WHITE },
  greetingSub:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  /* Stats */
  statsStrip: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 4,
    borderRadius: 12, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statItem:  { alignItems: 'center' },
  statIconWrap: { marginBottom: 4, opacity: 0.9 },
  statValue: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  statLabel: { fontSize: 11, color: GRAY, marginTop: 2 },

  /* Categorías */
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: WHITE,
    marginHorizontal: 16, marginTop: 22, marginBottom: 10,
  },
  catScroll: { paddingLeft: 16, marginBottom: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 10, borderWidth: 1.5, borderColor: BORDER,
  },
  catChipActive:  { backgroundColor: PRIMARY, borderColor: PRIMARY },
  catEmoji:       { fontSize: 15, marginRight: 5 },
  catLabel:       { fontSize: 13, color: '#333', fontWeight: '600' },
  catLabelActive: { color: WHITE },

  /* Grid de libros */
  listContent:   { paddingBottom: 30, paddingHorizontal: 10 },
  columnWrapper: { justifyContent: 'space-between', marginHorizontal: 6 },
  card: {
    backgroundColor: WHITE, borderRadius: 14, marginBottom: 14,
    width: '48%', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardImg:            { width: '100%', height: 150, backgroundColor: '#EEE' },
  cardImgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardInfo:   { padding: 10 },
  cardTitle:  { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  cardAuthor: { fontSize: 11, color: GRAY, marginBottom: 6 },
  cardPrice:  { fontSize: 15, fontWeight: '800', color: PRIMARY, marginBottom: 8 },
  addBtn:     { 
    backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 7, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 
  },
  addBtnText: { color: WHITE, fontSize: 11, fontWeight: '700' },
  favoriteBtn: { marginTop: 7, borderWidth: 1, borderColor: PRIMARY, borderRadius: 8, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  favoriteBtnText: { color: PRIMARY, fontSize: 11, fontWeight: '700' },
  favoriteBtnActive: { backgroundColor: PRIMARY },
  favoriteBtnTextActive: { color: WHITE },
  favoriteOverlay: { flex: 1, backgroundColor: 'rgba(42, 18, 28, 0.48)', justifyContent: 'center', padding: 28 },
  favoriteNoticeCard: { backgroundColor: WHITE, borderRadius: 18, padding: 26, alignItems: 'center', borderWidth: 2, borderColor: '#7A1E3A', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, elevation: 8 },
  favoriteNoticeIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  favoriteNoticeTitle: { color: PRIMARY, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  favoriteNoticeText: { color: '#62555A', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  favoriteNoticeButton: { width: '100%', backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  favoriteNoticeButtonText: { color: WHITE, fontSize: 15, fontWeight: '800' },

  /* Misc */
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:   { textAlign: 'center', color: 'rgba(255,255,255,0.75)', marginTop: 30, fontSize: 15 },

  /* FAB Carrito */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C5425A', // color resaltado
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C5425A',
  },
  fabBadgeText: {
    color: '#C5425A',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Filtros Activos */
  filterTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  filterTagText: { color: WHITE, fontSize: 12, fontWeight: '600' },

  /* Modal de Filtros */
  filterOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center', // Centrar horizontalmente
  },
  filterModal: {
    backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    width: '100%', maxWidth: 600, // Evitar que se estire en pantallas grandes
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
  },
  filterHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: { fontSize: 18, fontWeight: '800', color: CARBON },
  filterLabel: { fontSize: 14, fontWeight: '700', color: GRAY, marginBottom: 8, marginTop: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  filterInput: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    padding: 10, fontSize: 14, color: CARBON, backgroundColor: '#FAFAFA',
  },
  filterChip: {
    backgroundColor: BEIGE, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent',
  },
  filterChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterChipText: { fontSize: 13, color: CARBON, fontWeight: '600' },
  filterChipTextActive: { color: WHITE },
  
  filterActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12,
  },
  filterClearBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  filterClearBtnText: { color: GRAY, fontSize: 15, fontWeight: '700' },
  filterApplyBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: PRIMARY,
    alignItems: 'center',
  },
  filterApplyBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
});
