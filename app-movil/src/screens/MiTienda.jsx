import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, FlatList
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getMisLibros, getMetricasTienda, getPedidosRecientes } from '../services/api';

export default function MiTienda({ navigation }) {
  const { user } = useContext(AuthContext);
  const [metricas, setMetricas] = useState(null);
  const [libros, setLibros] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const [rMet, rLib, rPed] = await Promise.all([
        getMetricasTienda().catch(() => ({ data: null })),
        getMisLibros().catch(() => ({ data: [] })),
        getPedidosRecientes().catch(() => ({ data: [] })),
      ]);
      setMetricas(rMet.data);
      setLibros(rLib.data || []);
      setPedidos(rPed.data || []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el panel de tu tienda.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#7A1E3A" /></View>;

  const ACCESOS = [
    { label: 'Publicar Libro', icon: '📚', screen: 'PublicarLibro' },
    { label: 'Mi Librería', icon: '🏪', screen: 'Libreria' },
    { label: 'Historial', icon: '📦', screen: 'History' },
    { label: 'Notificaciones', icon: '🔔', screen: 'Notifications' },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Bienvenida */}
      <View style={s.welcomeCard}>
        <Text style={s.welcomeText}>Hola, {user?.nombre || 'vendedor'} 👋</Text>
        <Text style={s.welcomeSub}>Panel de tu librería</Text>
      </View>

      {/* Métricas */}
      {metricas && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resumen del mes</Text>
          <View style={s.metricRow}>
            {[
              { label: 'Ventas', val: metricas.ventas_mes ?? 0, icon: '🛒' },
              { label: 'Ingresos', val: `$${(metricas.ingresos_mes ?? 0).toLocaleString('es-CO')}`, icon: '💰' },
              { label: 'Libros', val: libros.length, icon: '📚' },
              { label: 'Visitas', val: metricas.visitas_mes ?? 0, icon: '👁' },
            ].map(m => (
              <View key={m.label} style={s.metricCard}>
                <Text style={s.metricIcon}>{m.icon}</Text>
                <Text style={s.metricVal}>{m.val}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Accesos rápidos */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Accesos rápidos</Text>
        <View style={s.quickRow}>
          {ACCESOS.map(a => (
            <TouchableOpacity key={a.screen} style={s.quickCard} onPress={() => navigation.navigate(a.screen)}>
              <Text style={s.quickIcon}>{a.icon}</Text>
              <Text style={s.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Libros recientes */}
      <View style={s.section}>
        <View style={s.rowBetween}>
          <Text style={s.sectionTitle}>Mis libros ({libros.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PublicarLibro')}>
            <Text style={s.linkText}>+ Publicar</Text>
          </TouchableOpacity>
        </View>
        {libros.slice(0, 5).map(libro => (
          <View key={libro.id_libro} style={s.libroRow}>
            <View style={s.libroInfo}>
              <Text style={s.libroTitulo} numberOfLines={1}>{libro.titulo}</Text>
              <Text style={s.libroMeta}>{libro.estado} · ${parseFloat(libro.precio || 0).toLocaleString('es-CO')}</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: libro.activo ? '#d4edda' : '#f8d7da' }]}>
              <Text style={{ color: libro.activo ? '#155724' : '#721c24', fontSize: 11, fontWeight: '700' }}>
                {libro.activo ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        ))}
        {libros.length === 0 && <Text style={s.emptyText}>Aún no tienes libros publicados.</Text>}
      </View>

      {/* Pedidos recientes */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Pedidos recientes</Text>
        {pedidos.slice(0, 4).map(p => (
          <View key={p.id_pedido} style={s.pedidoRow}>
            <View>
              <Text style={s.pedidoId}>Pedido #{p.id_pedido}</Text>
              <Text style={s.pedidoFecha}>{new Date(p.fecha_pedido).toLocaleDateString('es-CO')}</Text>
            </View>
            <Text style={s.pedidoMonto}>${parseFloat(p.total || 0).toLocaleString('es-CO')}</Text>
          </View>
        ))}
        {pedidos.length === 0 && <Text style={s.emptyText}>Aún no tienes pedidos recientes.</Text>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeCard: { backgroundColor: '#7A1E3A', padding: 24, paddingTop: 36 },
  welcomeText: { fontSize: 22, fontWeight: '800', color: 'white' },
  welcomeSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  section: { margin: 14, marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { flex: 1, minWidth: '42%', backgroundColor: 'white', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  metricIcon: { fontSize: 24, marginBottom: 4 },
  metricVal: { fontSize: 20, fontWeight: '800', color: '#7A1E3A' },
  metricLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { flex: 1, minWidth: '42%', backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: 13, fontWeight: '600', color: '#333', textAlign: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  linkText: { color: '#7A1E3A', fontWeight: '700', fontSize: 14 },
  libroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  libroInfo: { flex: 1, marginRight: 10 },
  libroTitulo: { fontSize: 14, fontWeight: '600', color: '#222' },
  libroMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pedidoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  pedidoId: { fontSize: 14, fontWeight: '600', color: '#333' },
  pedidoFecha: { fontSize: 12, color: '#888', marginTop: 2 },
  pedidoMonto: { fontSize: 15, fontWeight: '800', color: '#7A1E3A' },
  emptyText: { color: '#aaa', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});
