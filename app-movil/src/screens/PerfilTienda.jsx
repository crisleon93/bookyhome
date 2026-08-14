import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
  TouchableOpacity, FlatList
} from 'react-native';
import { getPerfilTiendaPublico, getApiBaseUrl } from '../services/api';

export default function PerfilTienda({ route, navigation }) {
  const { id_tienda } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('catalogo'); // 'catalogo' | 'politicas'

  useEffect(() => {
    cargarPerfil();
  }, [id_tienda]);

  const cargarPerfil = async () => {
    try {
      const res = await getPerfilTiendaPublico(id_tienda);
      setData(res.data);
    } catch (e) {
      console.log(e);
      // Ocurre si la tienda no existe
    } finally {
      setLoading(false);
    }
  };

  const getImageUri = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return { uri: url };
    return { uri: `${getApiBaseUrl()}${url}` };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A1E3A" />
      </View>
    );
  }

  if (!data || !data.tienda) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No pudimos encontrar esta tienda.</Text>
      </View>
    );
  }

  const { tienda, configuracion, libros } = data;

  const renderLibro = ({ item }) => {
    const imageUrl = item.imagen_url || item.imagen_principal || item.imagen;
    return (
      <TouchableOpacity 
        style={styles.bookCard}
        onPress={() => navigation.push('BookDetail', { id: item.id_libro })}
      >
        {imageUrl ? (
          <Image source={getImageUri(imageUrl)} style={styles.bookImg} />
        ) : (
          <View style={[styles.bookImg, styles.placeholderImg]}>
            <Text style={{ fontSize: 24 }}>📚</Text>
          </View>
        )}
        <Text style={styles.bookTitle} numberOfLines={2}>{item.titulo}</Text>
        <Text style={styles.bookPrice}>${Number(item.precio || 0).toLocaleString('es-CO')}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header con Banner y Logo */}
        <View style={styles.header}>
          {configuracion.banner_url ? (
            <Image source={getImageUri(configuracion.banner_url)} style={styles.banner} />
          ) : (
            <View style={[styles.banner, { backgroundColor: '#7A1E3A' }]} />
          )}

          <View style={styles.logoWrapper}>
            {configuracion.logo_url ? (
              <Image source={getImageUri(configuracion.logo_url)} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoInitial}>{tienda.nombre_tienda?.[0]}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info principal */}
        <View style={styles.infoSection}>
          <Text style={styles.storeName}>{tienda.nombre_tienda}</Text>
          <Text style={styles.ratingText}>⭐ Promedio: {Number(tienda.calificacion_promedio || 0).toFixed(1)}</Text>
          {configuracion.descripcion ? (
            <Text style={styles.description}>{configuracion.descripcion}</Text>
          ) : null}
          
          <View style={styles.badgesRow}>
            {configuracion.ciudad_origen ? (
              <View style={styles.badge}><Text style={styles.badgeText}>📍 {configuracion.ciudad_origen}</Text></View>
            ) : null}
            {configuracion.tiempo_despacho_dias ? (
              <View style={styles.badge}><Text style={styles.badgeText}>🚚 Despacha en {configuracion.tiempo_despacho_dias} días</Text></View>
            ) : null}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, tab === 'catalogo' && styles.activeTab]} onPress={() => setTab('catalogo')}>
            <Text style={[styles.tabText, tab === 'catalogo' && styles.activeTabText]}>Catálogo ({libros.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'politicas' && styles.activeTab]} onPress={() => setTab('politicas')}>
            <Text style={[styles.tabText, tab === 'politicas' && styles.activeTabText]}>Políticas y Horario</Text>
          </TouchableOpacity>
        </View>

        {/* Contenido */}
        {tab === 'catalogo' ? (
          <View style={styles.catalogoSection}>
            {libros.length === 0 ? (
              <Text style={styles.emptyText}>Esta tienda aún no tiene libros publicados.</Text>
            ) : (
              <View style={styles.gridContainer}>
                {libros.map(item => <React.Fragment key={item.id_libro}>{renderLibro({item})}</React.Fragment>)}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.politicasSection}>
            {configuracion.horario_atencion ? (
              <View style={styles.policyBlock}>
                <Text style={styles.policyTitle}>🕒 Horario de Atención</Text>
                <Text style={styles.policyText}>{configuracion.horario_atencion}</Text>
              </View>
            ) : null}

            {configuracion.politica_envios ? (
              <View style={styles.policyBlock}>
                <Text style={styles.policyTitle}>📦 Política de Envíos</Text>
                <Text style={styles.policyText}>{configuracion.politica_envios}</Text>
              </View>
            ) : null}

            {configuracion.politica_devoluciones ? (
              <View style={styles.policyBlock}>
                <Text style={styles.policyTitle}>↩️ Política de Devoluciones</Text>
                <Text style={styles.policyText}>{configuracion.politica_devoluciones}</Text>
              </View>
            ) : null}

            {configuracion.email_publico ? (
              <View style={styles.policyBlock}>
                <Text style={styles.policyTitle}>✉️ Contacto</Text>
                <Text style={styles.policyText}>{configuracion.email_publico}</Text>
              </View>
            ) : null}
            
            {!configuracion.horario_atencion && !configuracion.politica_envios && !configuracion.politica_devoluciones && (
              <Text style={styles.emptyText}>Esta tienda no ha especificado políticas públicas.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbfa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#666' },

  header: { height: 180, position: 'relative', marginBottom: 50 },
  banner: { width: '100%', height: '100%', resizeMode: 'cover' },
  logoWrapper: {
    position: 'absolute', bottom: -45, left: '50%', marginLeft: -45,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#fff', padding: 3, elevation: 5,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 5
  },
  logo: { width: '100%', height: '100%', borderRadius: 42, resizeMode: 'cover' },
  logoPlaceholder: { backgroundColor: '#7A1E3A', justifyContent: 'center', alignItems: 'center' },
  logoInitial: { color: '#fff', fontSize: 32, fontWeight: 'bold' },

  infoSection: { paddingHorizontal: 20, alignItems: 'center' },
  storeName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 5 },
  ratingText: { fontSize: 14, color: '#C5425A', fontWeight: '700', marginBottom: 12 },
  description: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 },
  badge: { backgroundColor: '#f0ebe7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#444', fontWeight: '600' },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderColor: '#7A1E3A' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#888' },
  activeTabText: { color: '#7A1E3A', fontWeight: '800' },

  catalogoSection: { padding: 16 },
  politicasSection: { padding: 20 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  bookCard: { width: '48%', backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1 },
  bookImg: { width: '100%', height: 180, borderRadius: 6, resizeMode: 'cover', marginBottom: 8 },
  placeholderImg: { backgroundColor: '#f0ebe7', justifyContent: 'center', alignItems: 'center' },
  bookTitle: { fontSize: 13, fontWeight: '700', color: '#2A2A2A', marginBottom: 4 },
  bookPrice: { fontSize: 14, fontWeight: '800', color: '#C5425A' },

  policyBlock: { marginBottom: 20 },
  policyTitle: { fontSize: 16, fontWeight: '700', color: '#2A2A2A', marginBottom: 8 },
  policyText: { fontSize: 14, color: '#555', lineHeight: 22 },
  
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 14 }
});
