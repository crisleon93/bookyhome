import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { getReviewsForBook, createReview, crearSalaChat, getBookById } from '../services/api';

export default function BookDetail({ route, navigation }) {
  const { book: bookParam } = route.params;
  const { addToCart, removeFromCart } = useContext(CartContext);
  const { user, loading: authLoading } = useContext(AuthContext);
  const [book, setBook] = useState(bookParam);
  const [adding, setAdding] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [contactando, setContactando] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Si el objeto book que llegó no tiene id_tienda, lo pide al backend
  useEffect(() => {
    if (!bookParam.id_tienda) {
      const id = bookParam.id_libro || bookParam.id;
      getBookById(id)
        .then(({ data }) => setBook(data))
        .catch((e) => console.warn('No se pudo obtener detalle del libro:', e?.message));
    }
  }, [bookParam]);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(book);
    setAdding(false);
    setAddedToCart(true);
    Alert.alert(
      'Carrito',
      'AGREGADO AL CARRITO',
      [
        { text: 'Seguir mirando', style: 'cancel' },
        { text: 'Ver Carrito', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  const handleRemoveFromCart = async () => {
    setAdding(true);
    const bookId = book.id_libro || book.id || book.idBook || book.id_book;
    await removeFromCart(bookId);
    setAdding(false);
    setAddedToCart(false);
    Alert.alert(
      'Carrito',
      'Eliminado del carrito',
      [
        { text: 'Seguir mirando', style: 'cancel' },
        { text: 'Ver Carrito', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  const contactarVendedor = async () => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para contactar al vendedor.');
      return;
    }

    const id_tienda = book.id_tienda;
    if (!id_tienda) {
      console.warn('BookDetail: falta id_tienda en el objeto book', book);
      Alert.alert('Error', 'No se pudo identificar la tienda de este libro.');
      return;
    }

    setContactando(true);
    try {
      const { data } = await crearSalaChat(id_tienda);
      navigation.navigate('Chat', {
        id_sala: data.id_sala,
        nombre_tienda: book.nombre_tienda || 'Vendedor',
      });
    } catch (e) {
      console.log('Error creando/abriendo sala de chat', JSON.stringify(e.response?.data, null, 2));
      Alert.alert('Error', 'No se pudo abrir el chat con el vendedor. Intenta de nuevo.');
    } finally {
      setContactando(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingReviews(true);
      try {
        const id = book.id_libro || book.id || book.idBook || book.id_book;
        const resp = await getReviewsForBook(id);
        if (!mounted) return;
        setPromedio(resp.data.promedio ?? 0);
        setTotal(resp.data.total ?? 0);
        setReviews(resp.data.resenas || []);
      } catch (err) {
        console.log('Error cargando reseñas', err);
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [book]);

  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para dejar una reseña.');
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert('Calificación inválida', 'La calificación debe estar entre 1 y 5.');
      return;
    }

    setSubmittingReview(true);
    try {
      const id_libro = book.id_libro || book.id || book.idBook || book.id_book;
      await createReview({ id_libro, calificacion: rating, comentario: comment });
      setComment('');
      setRating(5);
      // recargar reseñas
      const resp = await getReviewsForBook(id_libro);
      setPromedio(resp.data.promedio ?? 0);
      setTotal(resp.data.total ?? 0);
      setReviews(resp.data.resenas || []);
      Alert.alert('Éxito', 'Reseña creada correctamente');
    } catch (err) {
      console.log('Error creando reseña', err);
      const msg = err?.response?.data?.detail || 'Error creando reseña';
      Alert.alert('Error', msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {book.imagen ? (
          <Image source={{ uri: book.imagen }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <Text style={styles.title}>{book.titulo || 'Sin título'}</Text>
        <Text style={styles.author}>{book.autor_libro || book.autor || ''}</Text>
        
        <Text style={styles.price}>
          ${Number(book.precio_libro || book.precio || 0).toLocaleString('es-CO')} COP
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>
          {book.descripcion_libro || book.descripcion || 'Sin descripción disponible para este libro.'}
        </Text>

        <TouchableOpacity 
          style={[styles.button, adding && styles.buttonDisabled, addedToCart && styles.buttonRemove]} 
          onPress={addedToCart ? handleRemoveFromCart : handleAddToCart}
          disabled={adding}
        >
          <Text style={styles.buttonText}>{adding ? 'Procesando...' : addedToCart ? 'Eliminar de carrito' : 'Agregar al Carrito'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.buttonSecondary, contactando && styles.buttonDisabled]} 
          onPress={contactarVendedor}
          disabled={contactando}
        >
          <Text style={styles.buttonSecondaryText}>
            {contactando ? 'Abriendo chat...' : 'Contactar vendedor'}
          </Text>
        </TouchableOpacity>

        <View style={{ width: '100%', marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Reseñas ({total}) — Promedio: {promedio}</Text>

          {loadingReviews ? (
            <ActivityIndicator size="small" color="#7A1E3A" />
          ) : (
            reviews.map((r) => (
              <View key={r.id_resena} style={{ marginBottom: 12, alignSelf: 'stretch' }}>
                <Text style={{ fontWeight: '700' }}>{r.nombre_usuario} · {r.calificacion}/5</Text>
                <Text style={{ color: '#555' }}>{r.comentario}</Text>
                <Text style={{ color: '#999', fontSize: 12 }}>{r.fecha_resena}</Text>
              </View>
            ))
          )}

          <View style={{ height: 1, backgroundColor: '#e0dbd4', marginVertical: 12 }} />

          <Text style={styles.sectionTitle}>Dejar una reseña</Text>
          <Text style={{ marginBottom: 6, color: '#444' }}>{user ? `Como ${user.nombre_usuario || user.email || ''}` : 'Inicia sesión para comentar'}</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {[1,2,3,4,5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ marginRight: 8 }}>
                <Text style={{ fontSize: 18, color: s <= rating ? '#C5425A' : '#999' }}>{'★'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Escribe tu reseña..."
            multiline
            style={{ borderWidth: 1, borderColor: '#e0dbd4', padding: 10, borderRadius: 8, minHeight: 80, marginBottom: 10 }}
            editable={!!user}
          />

          <TouchableOpacity
            style={[styles.button, (submittingReview || !user) && styles.buttonDisabled]}
            onPress={handleSubmitReview}
            disabled={submittingReview || !user}
          >
            <Text style={styles.buttonText}>{submittingReview ? 'Enviando...' : 'Enviar reseña'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbfa', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, alignItems: 'center', marginBottom: 30 },
  image: { width: 160, height: 240, borderRadius: 8, marginBottom: 20 },
  imagePlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#2A2A2A', textAlign: 'center', marginBottom: 6 },
  author: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 12 },
  price: { fontSize: 20, fontWeight: '700', color: '#C5425A', marginBottom: 20 },
  divider: { width: '100%', height: 1, backgroundColor: '#e0dbd4', marginVertical: 15 },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 16, fontWeight: '700', color: '#2A2A2A', marginBottom: 8 },
  description: { alignSelf: 'flex-start', fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 25 },
  button: { backgroundColor: '#7A1E3A', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonRemove: { backgroundColor: '#e53935' },
  buttonSecondary: { borderWidth: 1.5, borderColor: '#7A1E3A', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 10 },
  buttonSecondaryText: { color: '#7A1E3A', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});