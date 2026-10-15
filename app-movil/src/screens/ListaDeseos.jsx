import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createListaDeseos,
  deleteListaDeseos,
  getApiBaseUrl,
  getFavoritos,
  getLibrosListaDeseos,
  getListaDeseos,
  removeFavorito,
  removeFromListaDeseos,
  addToListaDeseos,
} from '../services/api';
import { IconTrash } from '../components/Icons';
import Footer from '../components/Footer';

const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

const resolveImageUrl = (value) => {
  if (!value || typeof value !== 'string') return IMG_DEFAULT;
  const imageUrl = value.trim();
  if (!imageUrl) return IMG_DEFAULT;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${getApiBaseUrl()}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

const categoriaColor = (categoria = '') => {
  const texto = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (texto.includes('terror')) return { bg: '#eee8f7', color: '#603a92' };
  if (texto.includes('ciencia')) return { bg: '#e4f5e9', color: '#1f7a45' };
  if (texto.includes('romance')) return { bg: '#fde8ef', color: '#b4235d' };
  if (texto.includes('fantasia')) return { bg: '#e9edff', color: '#4156a6' };
  if (texto.includes('historia')) return { bg: '#f8eddb', color: '#8c5a1d' };
  if (texto.includes('tecnologia')) return { bg: '#e2f4f6', color: '#137783' };
  if (texto.includes('juvenil')) return { bg: '#fff2d7', color: '#a25d00' };
  if (texto.includes('infantil')) return { bg: '#e4f4ff', color: '#2775a7' };
  if (texto.includes('aventura')) return { bg: '#fff0df', color: '#b85f11' };
  if (texto.includes('arte')) return { bg: '#f4e6f6', color: '#86418f' };
  if (texto.includes('biografia')) return { bg: '#e8eef8', color: '#365d96' };
  if (texto.includes('educacion')) return { bg: '#e8f3e9', color: '#397542' };
  if (texto.includes('ficcion')) return { bg: '#fce4ec', color: '#8b0000' };
  return { bg: '#f4eef0', color: '#7a1e3a' };
};

export default function ListaDeseos({ navigation }) {
  const [favoritos, setFavoritos] = useState([]);
  const [listas, setListas] = useState([]);
  const [libros, setLibros] = useState([]);
  const [listaSeleccionadaId, setListaSeleccionadaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [librosLoading, setLibrosLoading] = useState(false);
  const [nombreNuevaLista, setNombreNuevaLista] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [creandoLista, setCreandoLista] = useState(false);
  const [eliminandoListaId, setEliminandoListaId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [actualizandoLibroId, setActualizandoLibroId] = useState(null);
  const [libroParaAgregarId, setLibroParaAgregarId] = useState(null);
  const [recargaLibros, setRecargaLibros] = useState(0);
  const listaSeleccionadaIdRef = useRef(listaSeleccionadaId);

  const listaSeleccionada = useMemo(
    () => listas.find((lista) => lista.id_lista === listaSeleccionadaId),
    [listas, listaSeleccionadaId],
  );
  const mostrandoFavoritos = !listaSeleccionada;
  const librosMostrados = mostrandoFavoritos ? favoritos : libros;
  const totalLibrosListas = listas.reduce((total, lista) => total + (lista.total_libros || 0), 0);

  useEffect(() => {
    listaSeleccionadaIdRef.current = listaSeleccionadaId;
  }, [listaSeleccionadaId]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [favoritosRes, listasRes] = await Promise.all([getFavoritos(), getListaDeseos()]);
      const listasActualizadas = listasRes.data || [];
      setFavoritos(favoritosRes.data || []);
      setListas(listasActualizadas);
      if (!listasActualizadas.some((lista) => lista.id_lista === listaSeleccionadaIdRef.current)) {
        setListaSeleccionadaId(null);
        setLibros([]);
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.detail || 'No se pudo cargar tu lista de deseos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    cargar();
    setRecargaLibros((actual) => actual + 1);
  }, [cargar]));

  useEffect(() => {
    if (!listaSeleccionadaId) {
      setLibros([]);
      return;
    }

    let activo = true;
    setLibrosLoading(true);
    getLibrosListaDeseos(listaSeleccionadaId)
      .then(({ data }) => {
        if (activo) setLibros(data || []);
      })
      .catch((error) => {
        if (activo) {
          setLibros([]);
          Alert.alert('Error', error?.response?.data?.detail || 'No se pudieron cargar los libros de esta lista.');
        }
      })
      .finally(() => {
        if (activo) setLibrosLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [listaSeleccionadaId, recargaLibros]);

  const handleCrearLista = async () => {
    const nombre = nombreNuevaLista.trim();
    if (!nombre) {
      Alert.alert('Nombre requerido', 'Escribe un nombre para tu lista.');
      return;
    }

    setCreandoLista(true);
    try {
      const { data } = await createListaDeseos({ nombre_lista: nombre, publica: false });
      setNombreNuevaLista('');
      setMostrarFormulario(false);
      await cargar();
      if (data?.id_lista) setListaSeleccionadaId(data.id_lista);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.detail || 'No se pudo crear la lista.');
    } finally {
      setCreandoLista(false);
    }
  };

  const handleEliminarLista = async (lista) => {
    setFeedback(null);
    setEliminandoListaId(lista.id_lista);
    try {
      await deleteListaDeseos(lista.id_lista);
      if (listaSeleccionadaId === lista.id_lista) {
        setListaSeleccionadaId(null);
        setLibros([]);
      }
      await cargar();
    } catch (error) {
      const mensaje = error?.response?.data?.detail || 'No se pudo eliminar la lista.';
      setFeedback({ type: 'error', text: mensaje });
      if (Platform.OS !== 'web') Alert.alert('Error', mensaje);
    } finally {
      setEliminandoListaId(null);
    }
  };

  const confirmarEliminarLista = (lista) => {
    const mensaje = `¿Eliminar "${lista.nombre_lista}" y los libros que contiene?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(mensaje)) {
        handleEliminarLista(lista);
      }
      return;
    }

    Alert.alert('Eliminar lista', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => handleEliminarLista(lista) },
    ]);
  };

  const handleEliminarLibro = async (libro) => {
    setFeedback(null);
    setActualizandoLibroId(libro.id_libro);
    try {
      if (mostrandoFavoritos) {
        await removeFavorito(libro.id_libro);
        setFavoritos((actuales) => actuales.filter((item) => item.id_libro !== libro.id_libro));
      } else {
        await removeFromListaDeseos(libro.id_libro, listaSeleccionadaId);
        setLibros((actuales) => actuales.filter((item) => item.id_libro !== libro.id_libro));
        await cargar();
      }
      setFeedback({ type: 'success', text: 'Libro quitado de la lista.' });
    } catch (error) {
      const mensaje = error?.response?.data?.detail || 'No se pudo quitar el libro.';
      setFeedback({ type: 'error', text: mensaje });
      if (Platform.OS !== 'web') Alert.alert('Error', mensaje);
    } finally {
      setActualizandoLibroId(null);
    }
  };

  const confirmarEliminarLibro = (libro) => {
    const mensaje = '¿Quieres quitar este libro de la lista?';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(mensaje)) {
        handleEliminarLibro(libro);
      }
      return;
    }

    Alert.alert('Quitar libro', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => handleEliminarLibro(libro) },
    ]);
  };

  const handleAgregarLibroALista = async (idLista, idLibro) => {
    setFeedback(null);
    try {
      await addToListaDeseos(idLibro, idLista);
      setLibroParaAgregarId(null);
      await cargar();
      setFeedback({ type: 'success', text: '¡Libro agregado correctamente a la colección!' });
    } catch (error) {
      const mensaje = error?.response?.data?.detail || 'No se pudo agregar el libro a la lista.';
      setFeedback({ type: 'error', text: mensaje });
      if (Platform.OS !== 'web') Alert.alert('Error', mensaje);
    }
  };

  if (loading && listas.length === 0 && favoritos.length === 0) {
    return <View style={s.center}><ActivityIndicator size="large" color={COLORS.wine} /></View>;
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.hero}>
        <View style={s.heroTitleRow}>
          <View style={s.heroIcon}><Text style={s.heroIconText}>♡</Text></View>
          <View style={s.heroCopy}>
            <Text style={s.heroTitle}>Lista de Deseos</Text>
            <Text style={s.heroSubtitle}>Organiza y guarda los libros que te interesan</Text>
          </View>
        </View>
      </View>

      <View style={s.panel}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Mis listas</Text>
          {!mostrarFormulario && (
            <TouchableOpacity
              accessibilityRole="button"
              style={s.newListButton}
              onPress={() => setMostrarFormulario(true)}
            >
              <Text style={s.newListButtonText}>+ Nueva</Text>
            </TouchableOpacity>
          )}
        </View>

        {feedback ? (
          <Text
            accessibilityRole="alert"
            style={[s.feedbackMessage, feedback.type === 'success' ? s.successMessage : s.errorMessage]}
          >
            {feedback.text}
          </Text>
        ) : null}

        {mostrarFormulario && (
          <View style={s.createForm}>
            <TextInput
              style={s.input}
              placeholder="Nombre de la lista"
              placeholderTextColor={COLORS.muted}
              value={nombreNuevaLista}
              onChangeText={setNombreNuevaLista}
              maxLength={80}
              returnKeyType="done"
              onSubmitEditing={handleCrearLista}
            />
            <View style={s.formActions}>
              <TouchableOpacity
                accessibilityRole="button"
                style={[s.primaryButton, s.formActionButton, creandoLista && s.disabledButton]}
                onPress={handleCrearLista}
                disabled={creandoLista}
              >
                {creandoLista
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryButtonText}>Crear lista</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={[s.cancelButton, s.formActionButton]}
                onPress={() => {
                  setMostrarFormulario(false);
                  setNombreNuevaLista('');
                }}
                disabled={creandoLista}
              >
                <Text style={s.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          style={[s.listRow, mostrandoFavoritos && s.selectedListRow]}
          onPress={() => setListaSeleccionadaId(null)}
        >
          <View style={s.listRowCopy}>
            <Text style={[s.listName, mostrandoFavoritos && s.selectedListName]}>♡  Mis favoritos</Text>
            <Text style={s.listDescription}>Libros que guardaste para después</Text>
          </View>
          <Text style={s.countBadge}>{favoritos.length} libro{favoritos.length === 1 ? '' : 's'}</Text>
        </TouchableOpacity>

        {loading && listas.length === 0 ? (
          <ActivityIndicator style={s.inlineLoader} color={COLORS.wine} />
        ) : listas.length === 0 ? (
          <Text style={s.noLists}>No tienes listas aún. Crea una para empezar.</Text>
        ) : (
          listas.map((lista) => {
            const activa = listaSeleccionadaId === lista.id_lista;
            return (
              <View key={lista.id_lista} style={[s.listRow, activa && s.selectedListRow]}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={s.listRowCopy}
                  onPress={() => setListaSeleccionadaId(lista.id_lista)}
                >
                  <Text style={[s.listName, activa && s.selectedListName]} numberOfLines={1}>
                    {lista.nombre_lista}
                  </Text>
                  <Text style={s.listDescription}>
                    {lista.total_libros || 0} libro{(lista.total_libros || 0) === 1 ? '' : 's'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar lista ${lista.nombre_lista}`}
                  style={[s.deleteListButton, eliminandoListaId === lista.id_lista && s.disabledButton]}
                  onPress={() => confirmarEliminarLista(lista)}
                  disabled={eliminandoListaId === lista.id_lista}
                >
                  {eliminandoListaId === lista.id_lista
                    ? <ActivityIndicator size="small" color={COLORS.wine} />
                    : <IconTrash size={18} color="#b0878f" />}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <View style={s.tipsPanel}>
        <Text style={s.tipsTitle}>💡 Tips de Compra</Text>
        <Text style={s.tipsText}>
          Organiza tus listas por géneros, autores favoritos o próximas compras para no perder de vista ninguna lectura.
        </Text>
        <View style={s.tipsStats}>
          <Text style={s.tipsStat}>Listas: {listas.length}</Text>
          <Text style={s.tipsStat}>Total libros: {totalLibrosListas}</Text>
        </View>
      </View>

      <View style={s.panel}>
        <View style={s.booksHeader}>
          <Text style={s.booksTitle}>{listaSeleccionada?.nombre_lista || 'Mis favoritos'}</Text>
          <Text style={s.productsBadge}>
            {librosMostrados.length} producto{librosMostrados.length === 1 ? '' : 's'}
          </Text>
        </View>

        {librosLoading ? (
          <ActivityIndicator style={s.booksLoader} size="large" color={COLORS.wine} />
        ) : librosMostrados.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📚</Text>
            <Text style={s.emptyTitle}>
              {mostrandoFavoritos ? 'Tu lista de deseos está vacía' : 'Esta lista está vacía'}
            </Text>
            <Text style={s.emptySubtitle}>
              Agrega libros desde el catálogo para tenerlos a mano.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={s.primaryButton}
              onPress={() => navigation.navigate('Catalogo')}
            >
              <Text style={s.primaryButtonText}>Explorar catálogo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          librosMostrados.map((libro) => {
            const categoria = libro.nombre_categoria ? categoriaColor(libro.nombre_categoria) : null;
            return (
              <View key={libro.id_libro} style={s.bookCard}>
                <Image source={{ uri: resolveImageUrl(libro.imagen_url) }} style={s.cover} />
                <View style={s.bookInfo}>
                  <Text style={s.bookTitle} numberOfLines={2}>{libro.titulo}</Text>
                  <Text style={s.author} numberOfLines={1}>{libro.autor_libro || 'Autor no disponible'}</Text>
                  {categoria && (
                    <Text style={[s.category, { backgroundColor: categoria.bg, color: categoria.color }]} numberOfLines={1}>
                      {libro.nombre_categoria}
                    </Text>
                  )}
                  <Text style={s.price}>{formatCurrency(libro.precio_libro)}</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={s.primaryButton}
                    onPress={() => navigation.navigate('BookDetailPublico', { book: libro })}
                  >
                    <Text style={s.primaryButtonText}>Ver detalle</Text>
                  </TouchableOpacity>
                  {mostrandoFavoritos && listas.length > 0 && (
                    libroParaAgregarId === libro.id_libro ? (
                      <View style={s.addToListPanel}>
                        <Text style={s.addToListLabel}>Agregar a:</Text>
                        {listas.map((lista) => (
                          <TouchableOpacity
                            key={lista.id_lista}
                            style={s.addToListOption}
                            onPress={() => handleAgregarLibroALista(lista.id_lista, libro.id_libro)}
                          >
                            <Text style={s.addToListOptionText} numberOfLines={1}>{lista.nombre_lista}</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setLibroParaAgregarId(null)}>
                          <Text style={s.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        accessibilityRole="button"
                        style={s.secondaryButton}
                        onPress={() => setLibroParaAgregarId(libro.id_libro)}
                      >
                        <Text style={s.secondaryButtonText}>＋ Agregar a lista</Text>
                      </TouchableOpacity>
                    )
                  )}
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[s.removeButton, actualizandoLibroId === libro.id_libro && s.disabledButton]}
                    onPress={() => confirmarEliminarLibro(libro)}
                    disabled={actualizandoLibroId === libro.id_libro}
                  >
                    {actualizandoLibroId === libro.id_libro
                      ? <ActivityIndicator size="small" color={COLORS.wine} />
                      : <Text style={s.removeButtonText}>Quitar de la lista</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
      <Footer onLinkPress={() => {}} />
    </ScrollView>
  );
}

const COLORS = {
  wine: '#7A1E3A',
  wineLight: '#fdf2f4',
  ink: '#2A2A2A',
  muted: '#888',
  border: '#e8e4df',
  surface: '#fff',
  page: '#f9f7f5',
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.page },
  content: { padding: 16, paddingBottom: 0, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.page },
  hero: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.wine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { color: '#fff', fontSize: 32, lineHeight: 38, fontWeight: '700' },
  heroCopy: { flex: 1 },
  heroTitle: { color: COLORS.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  heroSubtitle: { color: '#666', fontSize: 13, lineHeight: 18, marginTop: 4 },
  panel: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: COLORS.ink, fontSize: 19, fontWeight: '800' },
  newListButton: { backgroundColor: COLORS.wineLight, borderRadius: 9, paddingVertical: 9, paddingHorizontal: 13 },
  newListButtonText: { color: COLORS.wine, fontSize: 13, fontWeight: '800' },
  createForm: { backgroundColor: '#faf8f6', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, gap: 10, marginBottom: 12 },
  formActions: { flexDirection: 'row', gap: 8 },
  formActionButton: { flex: 1 },
  input: { backgroundColor: '#fff', color: COLORS.ink, borderWidth: 1.5, borderColor: '#e0dbd4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  listRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  selectedListRow: { borderWidth: 2, borderColor: COLORS.wine, backgroundColor: '#fbf7f8' },
  listRowCopy: { flex: 1 },
  listName: { color: '#333', fontSize: 15, fontWeight: '700' },
  selectedListName: { color: COLORS.wine },
  listDescription: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  countBadge: { color: COLORS.wine, backgroundColor: '#f5eaed', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '700' },
  deleteListButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  noLists: { color: COLORS.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, paddingVertical: 12 },
  inlineLoader: { paddingVertical: 16 },
  tipsPanel: { padding: 18, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.border, backgroundColor: '#fdfcfb', gap: 10 },
  tipsTitle: { color: COLORS.wine, fontSize: 15, fontWeight: '800' },
  tipsText: { color: '#666', fontSize: 13, lineHeight: 19, fontWeight: '500' },
  tipsStats: { borderTopWidth: 1.5, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 3, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  tipsStat: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  booksHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 14, marginBottom: 16, borderBottomWidth: 2.5, borderBottomColor: '#f3f0ec' },
  booksTitle: { color: COLORS.wine, fontSize: 18, fontWeight: '800', flex: 1 },
  productsBadge: { color: COLORS.wine, backgroundColor: '#f5eaed', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '700' },
  booksLoader: { paddingVertical: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 22 },
  emptyIcon: { fontSize: 38, marginBottom: 10 },
  emptyTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { color: '#666', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  primaryButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.wine, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 14 },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  cancelButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.wineLight, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 14 },
  cancelButtonText: { color: COLORS.wine, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  feedbackMessage: { borderWidth: 1, borderRadius: 9, padding: 10, fontSize: 13, marginBottom: 12, fontWeight: '600' },
  successMessage: { color: '#166534', backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  errorMessage: { color: '#991b1b', backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  disabledButton: { opacity: 0.65 },
  bookCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, padding: 12, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, backgroundColor: '#fff', marginBottom: 12 },
  cover: { width: 82, height: 120, borderRadius: 9, backgroundColor: '#f0e8ec' },
  bookInfo: { flex: 1, gap: 7 },
  bookTitle: { color: COLORS.ink, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  author: { color: '#666', fontSize: 12, fontWeight: '600' },
  category: { alignSelf: 'flex-start', maxWidth: '100%', overflow: 'hidden', borderRadius: 14, paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: '700' },
  price: { color: COLORS.wine, fontSize: 17, fontWeight: '800', marginBottom: 2 },
  secondaryButton: { alignItems: 'center', borderWidth: 1.5, borderColor: '#d1c8c0', backgroundColor: '#fff', borderRadius: 9, paddingVertical: 9, paddingHorizontal: 10 },
  secondaryButtonText: { color: '#555', fontSize: 12, fontWeight: '700' },
  removeButton: { alignItems: 'center', borderWidth: 1.5, borderColor: '#e5d5d5', borderRadius: 9, paddingVertical: 8, paddingHorizontal: 10 },
  removeButtonText: { color: '#b0878f', fontSize: 11, fontWeight: '700' },
  addToListPanel: { padding: 9, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: '#fafafa', gap: 7 },
  addToListLabel: { color: '#666', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  addToListOption: { backgroundColor: '#fdf2f4', borderWidth: 1, borderColor: COLORS.wine, borderRadius: 7, paddingVertical: 7, paddingHorizontal: 8 },
  addToListOptionText: { color: COLORS.wine, fontSize: 11, fontWeight: '700' },
  cancelText: { color: COLORS.muted, fontSize: 11, textAlign: 'center', paddingVertical: 3 },
});
