// src/screens/PostLogin.jsx
import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  ScrollView, SafeAreaView,
} from 'react-native';
import { getBooks } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

const PRIMARY = '#7A1E3A';
const BG      = '#F9F6F1';
const WHITE   = '#FFFFFF';
const GRAY    = '#888';
const BORDER  = '#EEE';

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
  const { signOut, user } = useContext(AuthContext);

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

  // Este handler lo recibe el Header via onSearch
  const handleSearch = (text) => {
    setSearch(text);
    setActiveCategory(null);
    if (!text) return setFiltered(books);
    setFiltered(books.filter(b =>
      (b.titulo || b.nombre || '').toLowerCase().includes(text.toLowerCase()) ||
      (b.autor_libro || b.autor || '').toLowerCase().includes(text.toLowerCase())
    ));
  };

  const handleCategory = (cat) => {
    if (activeCategory === cat.id) {
      setActiveCategory(null);
      setFiltered(books);
    } else {
      setActiveCategory(cat.id);
      setSearch('');
      setFiltered(books.filter(b =>
        (b.nombre_categoria || b.categoria || '').toLowerCase().includes(cat.label.toLowerCase())
      ));
    }
  };

  const renderBook = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('BookDetail', { book: item })}
    >
      {item.imagen
        ? <Image source={{ uri: item.imagen }} style={styles.cardImg} />
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
          ${Number(item.precio ?? 0).toLocaleString('es-CO')}
        </Text>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>Agregar al carrito</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.quickActionLabel}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('History')}>
          <Text style={styles.quickActionLabel}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.quickActionLabel}>Notificaciones</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        {[
          { value: '+10.000', label: 'Libros' },
          { value: '+150',    label: 'Librerías' },
          { value: '4.8 ⭐',  label: 'Calificación' },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Categorías */}
      <Text style={styles.sectionTitle}>Explorar categorías</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
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

      {/* Título del catálogo */}
      <Text style={styles.sectionTitle}>
        {activeCategory
          ? CATEGORIES.find(c => c.id === activeCategory)?.label
          : search
          ? `Resultados para "${search}"`
          : 'Catálogo completo'}
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
        userName={user?.nombre || user?.email?.split('@')[0]}
        onSearch={handleSearch}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* Greeting */
  greetingRow: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  greetingText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  greetingSub:  { fontSize: 13, color: GRAY, marginTop: 2 },

  /* Stats */
  statsStrip: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 4,
    borderRadius: 12, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statItem:  { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  statLabel: { fontSize: 11, color: GRAY, marginTop: 2 },

  /* Categorías */
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#222',
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
  addBtn:     { backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  addBtnText: { color: WHITE, fontSize: 11, fontWeight: '700' },

  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 18,
  },
  quickAction: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionLabel: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 12,
  },

  /* Misc */
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:   { textAlign: 'center', color: GRAY, marginTop: 30, fontSize: 15 },
});