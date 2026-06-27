import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getPurchaseHistory } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777';

export default function History({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await getPurchaseHistory();
        setHistory(res.data?.compras || []);
      } catch (e) {
        console.log('Error loading history', e.message);
        setError('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Orden #{item.id_orden}</Text>
        <Text style={styles.cardStatus}>{item.estado_orden || 'Pendiente'}</Text>
      </View>
      <Text style={styles.cardText}>Fecha: {item.fecha_orden}</Text>
      <Text style={styles.cardText}>Total: ${Number(item.total ?? 0).toLocaleString('es-CO')}</Text>
      <Text style={styles.cardText}>Items: {item.cantidad_items}</Text>
      {item.libros ? <Text style={styles.cardText}>Libros: {item.libros}</Text> : null}
      <TouchableOpacity
        style={styles.detailBtn}
        onPress={() => navigation.navigate('Checkout', { orderId: item.id_orden })}
      >
        <Text style={styles.detailBtnText}>Ver orden</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        variant="dashboard"
        navigation={navigation}
        onSignOut={signOut}
        userName={user?.nombre || user?.email?.split('@')[0]}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Historial de compras</Text>
        <Text style={styles.subtitle}>Tus últimas órdenes están aquí.</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aún no tienes órdenes registradas.</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => String(item.id_orden)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: TEXT, marginBottom: 6 },
  subtitle: { fontSize: 14, color: MUTED, marginBottom: 18 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  cardStatus: { fontSize: 13, color: PRIMARY, fontWeight: '700' },
  cardText: { color: MUTED, marginBottom: 4 },
  detailBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  detailBtnText: { color: WHITE, fontWeight: '700' },
  emptyText: { color: MUTED, textAlign: 'center', marginTop: 20 },
  errorText: { color: '#C5425A', textAlign: 'center' },
});