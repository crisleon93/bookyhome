import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AddressMapFrame from '../components/AddressMapFrame';
import { IconLocation } from '../components/Icons';
import { createDireccion, deleteDireccion, getDirecciones, setPrincipalDireccion, updateDireccion } from '../services/api';
import Footer from '../components/Footer';

const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#666';
const emptyForm = { alias_direccion: '', direccion: '', ciudad: '', departamento: '', codigo_postal: '', es_principal: false };
const fields = [
  ['alias_direccion', 'Alias', 'Ej. Casa, Oficina'],
  ['direccion', 'Dirección', 'Calle, número, barrio...'],
  ['ciudad', 'Ciudad', ''],
  ['departamento', 'Departamento', ''],
  ['codigo_postal', 'Código postal', ''],
];
const CITY_COORDINATES = [
  { key: 'bogot', lat: 4.711, lng: -74.0721 },
  { key: 'medell', lat: 6.2442, lng: -75.5812 },
  { key: 'cali', lat: 3.4516, lng: -76.532 },
  { key: 'barranquilla', lat: 10.9685, lng: -74.7813 },
  { key: 'cartagena', lat: 10.391, lng: -75.4794 },
  { key: 'santa marta', lat: 11.2408, lng: -74.211 },
  { key: 'bucaramanga', lat: 7.1193, lng: -73.1227 },
  { key: 'pereira', lat: 4.8133, lng: -75.6961 },
  { key: 'manizales', lat: 5.0703, lng: -75.5138 },
  { key: 'armenia', lat: 4.5339, lng: -75.6811 },
  { key: 'ibagu', lat: 4.4389, lng: -75.2322 },
  { key: 'neiva', lat: 2.9273, lng: -75.2819 },
  { key: 'villavicencio', lat: 4.142, lng: -73.6266 },
  { key: 'pasto', lat: 1.2136, lng: -77.2811 },
];

const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const coordinatesForCity = (city, department) => {
  const search = `${city} ${department}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CITY_COORDINATES.find(({ key }) => search.includes(key)) || { lat: 4.711, lng: -74.0721 };
};

const addressFromGeocoding = (result) => {
  const address = result?.address || {};
  const parts = [
    address.road,
    address.house_number,
    address.neighbourhood,
    address.suburb,
    address.village,
  ].map(normalize).filter(Boolean);
  const uniqueParts = parts.filter((part, index) =>
    parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index
  );
  const street = uniqueParts.join(' ') || normalize(result?.display_name);
  return {
    direccion: street,
    ciudad: normalize(address.city || address.town || address.village || address.suburb),
    departamento: normalize(address.state || address.state_district),
    codigo_postal: normalize(address.postcode),
    lat: Number(result?.lat),
    lng: Number(result?.lon),
  };
};

const createMapHtml = ({ lat, lng }) => `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;width:100%;margin:0;padding:0} .leaflet-control-attribution{font-size:9px}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map=L.map('map').setView([${lat},${lng}],14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
const marker=L.marker([${lat},${lng}]).addTo(map);
map.on('click',event=>{
  marker.setLatLng(event.latlng);
  const message=JSON.stringify({lat:event.latlng.lat,lng:event.latlng.lng});
  if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
  else window.parent.postMessage(message,'*');
});
window.setMapLocation=(latitude,longitude)=>{
  const point=[latitude,longitude];
  marker.setLatLng(point);
  map.setView(point,16);
};
setTimeout(()=>map.invalidateSize(),300);
</script></body></html>`;

export default function Direcciones() {
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapForm, setMapForm] = useState({ direccion: '', ciudad: '', departamento: '', codigo_postal: '' });
  const [mapInitialCoordinates, setMapInitialCoordinates] = useState({ lat: 4.711, lng: -74.0721 });
  const [mapLoading, setMapLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState('');
  const mapFrame = useRef(null);
  const mapRequestId = useRef(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDirecciones();
      setDirecciones(response.data || []);
    } catch (error) {
      Alert.alert('Direcciones', error.response?.data?.detail || 'No se pudieron cargar tus direcciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cancelar = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const abrirNuevo = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const abrirMapa = () => {
    const initialCoordinates = coordinatesForCity(form.ciudad, form.departamento);
    setMapInitialCoordinates(initialCoordinates);
    setMapForm({
      direccion: form.direccion,
      ciudad: form.ciudad,
      departamento: form.departamento,
      codigo_postal: form.codigo_postal,
    });
    setMapError('');
    setMapLoading(false);
    setLocating(false);
    setMapVisible(true);
  };

  const cerrarMapa = () => {
    mapRequestId.current += 1;
    setMapLoading(false);
    setMapVisible(false);
  };

  const seleccionarResultadoMapa = useCallback((result) => {
    const address = addressFromGeocoding(result);
    if (!Number.isFinite(address.lat) || !Number.isFinite(address.lng)) {
      throw new Error('La ubicación no tiene coordenadas válidas.');
    }
    setMapForm((current) => ({
      ...current,
      direccion: address.direccion || current.direccion,
      ciudad: address.ciudad || current.ciudad,
      departamento: address.departamento || current.departamento,
      codigo_postal: address.codigo_postal || current.codigo_postal,
    }));
    setMapError('');
    return address;
  }, []);

  const buscarDireccionEnMapa = async () => {
    const query = [mapForm.direccion, mapForm.ciudad, mapForm.departamento]
      .map(normalize)
      .filter(Boolean)
      .join(', ');
    if (!query) {
      setMapError('Escribe una dirección para buscarla en el mapa.');
      return;
    }
    const requestId = ++mapRequestId.current;
    setMapLoading(true);
    setMapError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=co&q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('El servicio de mapas no está disponible.');
      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('No se encontró la dirección. Prueba con una referencia más específica.');
      }
      if (requestId !== mapRequestId.current) return;
      const address = seleccionarResultadoMapa(results[0]);
      if (Platform.OS === 'web') {
        mapFrame.current?.contentWindow?.setMapLocation?.(address.lat, address.lng);
      } else {
        mapFrame.current?.injectJavaScript(`window.setMapLocation(${address.lat},${address.lng}); true;`);
      }
    } catch (error) {
      if (requestId === mapRequestId.current) {
        setMapError(error.message || 'No se pudo buscar la dirección.');
      }
    } finally {
      if (requestId === mapRequestId.current) setMapLoading(false);
    }
  };

  const actualizarCentroMapa = (lat, lng) => {
    if (Platform.OS === 'web') {
      mapFrame.current?.contentWindow?.setMapLocation?.(lat, lng);
    } else {
      mapFrame.current?.injectJavaScript(`window.setMapLocation(${lat},${lng}); true;`);
    }
  };

  const usarUbicacionActual = async () => {
    setLocating(true);
    setMapError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Permite el acceso a tu ubicación para poder usar esta opción.');
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = position.coords;
      actualizarCentroMapa(latitude, longitude);
      await seleccionarPuntoEnMapa({ data: JSON.stringify({ lat: latitude, lng: longitude }) });
    } catch (error) {
      setMapError(error.message || 'No se pudo obtener tu ubicación actual.');
    } finally {
      setLocating(false);
    }
  };

  const seleccionarPuntoEnMapa = useCallback(async (event) => {
    let point;
    try {
      const data = typeof event?.data === 'string' ? event.data : event?.nativeEvent?.data;
      point = JSON.parse(data);
    } catch {
      setMapError('No se pudo leer el punto seleccionado en el mapa.');
      return;
    }
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setMapError('El punto seleccionado no tiene coordenadas válidas.');
      return;
    }
    const requestId = ++mapRequestId.current;
    setMapLoading(true);
    setMapError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`);
      if (!response.ok) throw new Error('El servicio de mapas no está disponible.');
      const result = await response.json();
      if (requestId !== mapRequestId.current) return;
      seleccionarResultadoMapa({ ...result, lat, lon: lng });
    } catch (error) {
      if (requestId === mapRequestId.current) {
        setMapError(error.message || 'No se pudo obtener la dirección desde OpenStreetMap.');
      }
    } finally {
      if (requestId === mapRequestId.current) setMapLoading(false);
    }
  }, [seleccionarResultadoMapa]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapVisible) return undefined;
    const handleWebMapMessage = (event) => {
      if (event.source !== mapFrame.current?.contentWindow) return;
      seleccionarPuntoEnMapa(event);
    };
    window.addEventListener('message', handleWebMapMessage);
    return () => window.removeEventListener('message', handleWebMapMessage);
  }, [mapVisible, seleccionarPuntoEnMapa]);

  const confirmarDireccionMapa = () => {
    if (!normalize(mapForm.direccion)) {
      setMapError('Escribe o selecciona una dirección antes de continuar.');
      return;
    }
    setForm((current) => ({
      ...current,
      direccion: normalize(mapForm.direccion),
      ciudad: normalize(mapForm.ciudad),
      departamento: normalize(mapForm.departamento),
      codigo_postal: normalize(mapForm.codigo_postal),
    }));
    cerrarMapa();
  };

  const guardar = async () => {
    if (!form.direccion.trim()) {
      Alert.alert('Dirección requerida', 'Ingresa la dirección de envío.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        alias_direccion: form.alias_direccion.trim() || 'Dirección',
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        departamento: form.departamento.trim(),
        codigo_postal: form.codigo_postal.trim(),
      };
      if (editingId) await updateDireccion(editingId, payload);
      else await createDireccion(payload);
      cancelar();
      await cargar();
    } catch (error) {
      Alert.alert('No se pudo guardar', error.response?.data?.detail || 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const editar = (direccion) => {
    setEditingId(direccion.id_direccion);
    setShowForm(true);
    setForm({
      alias_direccion: direccion.alias_direccion || '',
      direccion: direccion.direccion || '',
      ciudad: direccion.ciudad || '',
      departamento: direccion.departamento || '',
      codigo_postal: direccion.codigo_postal || '',
      es_principal: Boolean(direccion.es_principal),
    });
  };

  const eliminar = (direccion) => Alert.alert('Eliminar dirección', `¿Eliminar “${direccion.alias_direccion || 'Dirección'}”?`, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteDireccion(direccion.id_direccion);
          await cargar();
        } catch (error) {
          Alert.alert('No se pudo eliminar', error.response?.data?.detail || 'Inténtalo nuevamente.');
        }
      },
    },
  ]);

  const hacerPrincipal = async (id) => {
    try {
      await setPrincipalDireccion(id);
      await cargar();
    } catch (error) {
      Alert.alert('No se pudo actualizar', error.response?.data?.detail || 'Inténtalo nuevamente.');
    }
  };

  const renderDireccion = ({ item }) => (
    <View style={[styles.card, item.es_principal && styles.cardMain]}>
      <View style={styles.cardHeader}>
        <View style={styles.addressIcon}><IconLocation size={19} color={PRIMARY} /></View>
        <Text style={styles.cardTitle}>{item.alias_direccion || 'Dirección'}</Text>
        {item.es_principal && <Text style={styles.mainBadge}>Principal</Text>}
      </View>
      <Text style={styles.cardText}>{item.direccion}</Text>
      {[item.ciudad, item.departamento].filter(Boolean).length > 0 && (
        <Text style={styles.cardText}>{[item.ciudad, item.departamento].filter(Boolean).join(', ')}</Text>
      )}
      {item.codigo_postal ? <Text style={styles.cardMuted}>CP: {item.codigo_postal}</Text> : null}
      <View style={styles.actions}>
        {!item.es_principal && (
          <TouchableOpacity style={styles.mainBtn} onPress={() => hacerPrincipal(item.id_direccion)}>
            <Text style={styles.mainBtnText}>Hacer principal</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.editBtn} onPress={() => editar(item)}>
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => eliminar(item)}>
          <Text style={styles.deleteBtnText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{editingId ? 'Editar dirección' : 'Agregar nueva dirección'}</Text>
      {fields.map(([field, label, placeholder]) => (
        <View key={field} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={form[field]}
            onChangeText={(value) => setForm((current) => ({ ...current, [field]: value }))}
            placeholder={placeholder}
            placeholderTextColor="#999"
            autoCapitalize="sentences"
          />
        </View>
      ))}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Marcar como dirección principal</Text>
        <Switch
          value={form.es_principal}
          onValueChange={(value) => setForm((current) => ({ ...current, es_principal: value }))}
          trackColor={{ true: PRIMARY }}
          thumbColor="#FFFFFF"
        />
      </View>
      <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={guardar} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{editingId ? 'Actualizar dirección' : 'Guardar dirección'}</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.mapBtn} onPress={abrirMapa} disabled={saving}>
        <Text style={styles.mapBtnText}>Elegir en mapa</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={cancelar} disabled={saving}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={showForm ? [] : direcciones}
        keyExtractor={(item) => String(item.id_direccion)}
        renderItem={renderDireccion}
        refreshing={loading}
        onRefresh={cargar}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <>
            <View style={styles.headingCard}>
              <View style={styles.headingRow}>
                <View style={styles.headingIcon}><IconLocation size={22} color={PRIMARY} /></View>
                <View style={styles.headingCopy}>
                  <Text style={styles.title}>Mis direcciones de envío</Text>
                  <Text style={styles.subtitle}>Gestiona las direcciones que podrás elegir al pagar.</Text>
                </View>
              </View>
            </View>
            {showForm ? renderForm() : (
              <TouchableOpacity style={styles.addBtn} onPress={abrirNuevo} activeOpacity={0.85}>
                <Text style={styles.addBtnText}>+ Agregar dirección</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        ListEmptyComponent={showForm ? null : (
          loading ? (
            <View style={styles.empty}><ActivityIndicator size="small" color={PRIMARY} /></View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><IconLocation size={22} color={PRIMARY} /></View>
              <Text style={styles.emptyTitle}>No tienes direcciones guardadas</Text>
              <Text style={styles.emptyText}>Agrega una dirección para recibir tus pedidos más fácilmente.</Text>
            </View>
          )
        )}
        ListFooterComponent={<Footer onLinkPress={() => {}} />}
      />
      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={cerrarMapa}
      >
        <SafeAreaView style={styles.mapSafe}>
          <View style={styles.mapHeader}>
            <View style={styles.mapHeadingCopy}>
              <Text style={styles.mapTitle}>Elegir dirección</Text>
              <Text style={styles.mapSubtitle}>Escribe la dirección o selecciona un punto en el mapa. Completaremos los demás datos automáticamente.</Text>
            </View>
            <TouchableOpacity onPress={cerrarMapa} style={styles.mapClose} accessibilityLabel="Cerrar mapa">
              <Text style={styles.mapCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapFields}>
            <View style={styles.mapField}>
              <Text style={styles.mapLabel}>Dirección</Text>
              <View style={styles.mapAddressRow}>
                <TextInput
                  style={[styles.mapInput, styles.mapAddressInput]}
                  value={mapForm.direccion}
                  onChangeText={(value) => setMapForm((current) => ({ ...current, direccion: value }))}
                  placeholder="Ej. Carrera 7 # 45-67, Bogotá"
                  placeholderTextColor="#888"
                  returnKeyType="search"
                  onSubmitEditing={buscarDireccionEnMapa}
                  autoCapitalize="sentences"
                />
                <TouchableOpacity style={styles.mapSearchBtn} onPress={buscarDireccionEnMapa} disabled={mapLoading}>
                  {mapLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.mapSearchBtnText}>Buscar</Text>}
                </TouchableOpacity>
              </View>
            </View>
            <MapField
              label="Ciudad"
              value={mapForm.ciudad}
              placeholder="Ciudad"
              onChangeText={(value) => setMapForm((current) => ({ ...current, ciudad: value }))}
            />
            <View style={styles.mapFieldsRow}>
              <MapField
                label="Departamento"
                value={mapForm.departamento}
                placeholder="Departamento"
                onChangeText={(value) => setMapForm((current) => ({ ...current, departamento: value }))}
                style={styles.mapHalfField}
              />
              <MapField
                label="Código postal"
                value={mapForm.codigo_postal}
                placeholder="Código postal"
                onChangeText={(value) => setMapForm((current) => ({ ...current, codigo_postal: value }))}
                style={styles.mapHalfField}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View style={styles.mapFrame}>
            <AddressMapFrame
              ref={mapFrame}
              html={createMapHtml(mapInitialCoordinates)}
              onMessage={seleccionarPuntoEnMapa}
              onError={() => setMapError('No se pudo cargar el mapa. Comprueba tu conexión e inténtalo de nuevo.')}
            />
            {mapLoading && (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.mapLoadingText}>Buscando la dirección…</Text>
              </View>
            )}
          </View>
          {mapError ? <Text style={styles.mapError}>{mapError}</Text> : null}
          <TouchableOpacity
            style={[styles.currentLocationBtn, locating && styles.disabled]}
            onPress={usarUbicacionActual}
            disabled={locating || mapLoading}
          >
            {locating ? <ActivityIndicator size="small" color={PRIMARY} /> : <IconLocation size={16} color={PRIMARY} />}
            <Text style={styles.currentLocationText}>{locating ? 'Ubicando…' : 'Usar mi ubicación actual'}</Text>
          </TouchableOpacity>
          <View style={styles.mapActions}>
            <TouchableOpacity style={styles.mapCancelBtn} onPress={cerrarMapa}>
              <Text style={styles.mapCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapConfirmBtn, (!normalize(mapForm.direccion) || mapLoading || locating) && styles.disabled]}
              onPress={confirmarDireccionMapa}
              disabled={!normalize(mapForm.direccion) || mapLoading || locating}
            >
              <Text style={styles.mapConfirmText}>Usar esta dirección</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function MapField({ label, value, placeholder, onChangeText, style, keyboardType = 'default' }) {
  return (
    <View style={[styles.mapField, style]}>
      <Text style={styles.mapLabel}>{label}</Text>
      <TextInput
        style={styles.mapInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        keyboardType={keyboardType}
        autoCapitalize="sentences"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 36 },
  headingCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 18, marginBottom: 16 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headingIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9EEF1', alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  title: { fontSize: 19, lineHeight: 24, fontWeight: '800', color: TEXT },
  subtitle: { color: MUTED, marginTop: 4, lineHeight: 19, fontSize: 13 },
  addBtn: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 14 },
  addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  empty: { alignItems: 'center', backgroundColor: '#FAF8F6', borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 20, paddingVertical: 26 },
  emptyIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F9EEF1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { textAlign: 'center', fontWeight: '700', color: '#444', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardMain: { borderColor: PRIMARY, borderWidth: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  addressIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9EEF1', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontWeight: '800', fontSize: 16, color: TEXT },
  mainBadge: { overflow: 'hidden', backgroundColor: PRIMARY, color: '#FFFFFF', fontSize: 11, fontWeight: '700', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 12 },
  cardText: { color: '#555', marginBottom: 4, lineHeight: 20 },
  cardMuted: { color: '#888', fontSize: 12, marginTop: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0ECE8' },
  mainBtn: { minHeight: 40, justifyContent: 'center', backgroundColor: PRIMARY, paddingHorizontal: 12, borderRadius: 7 },
  mainBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  editBtn: { minHeight: 40, justifyContent: 'center', backgroundColor: '#8B5A2B', paddingHorizontal: 14, borderRadius: 7 },
  editBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  deleteBtn: { minHeight: 40, justifyContent: 'center', backgroundColor: '#DC2626', paddingHorizontal: 14, borderRadius: 7 },
  deleteBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  formCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 18, marginBottom: 14 },
  formTitle: { fontSize: 19, fontWeight: '800', color: TEXT, marginBottom: 18 },
  field: { marginBottom: 14 },
  label: { color: '#444', fontWeight: '700', fontSize: 13, marginBottom: 6 },
  input: { minHeight: 48, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 10, color: TEXT, fontSize: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 8, marginBottom: 8 },
  switchLabel: { flex: 1, color: '#444', fontWeight: '700', fontSize: 13 },
  saveBtn: { minHeight: 48, backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  disabled: { opacity: 0.65 },
  mapBtn: { minHeight: 48, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  mapBtnText: { color: PRIMARY, fontWeight: '800', fontSize: 14 },
  cancelBtn: { alignItems: 'center', padding: 13, marginTop: 2 },
  cancelText: { color: PRIMARY, fontWeight: '700', fontSize: 14 },
  mapSafe: { flex: 1, backgroundColor: '#FFFFFF', padding: 14 },
  mapHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  mapHeadingCopy: { flex: 1 },
  mapTitle: { color: PRIMARY, fontSize: 19, fontWeight: '800' },
  mapSubtitle: { color: '#777', fontSize: 12, lineHeight: 17, marginTop: 4 },
  mapClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mapCloseText: { color: '#444', fontSize: 30, lineHeight: 34 },
  mapFields: { marginBottom: 10 },
  mapField: { marginBottom: 7 },
  mapFieldsRow: { flexDirection: 'row', gap: 8 },
  mapHalfField: { flex: 1 },
  mapLabel: { color: '#444', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  mapAddressRow: { flexDirection: 'row', gap: 7 },
  mapInput: { minHeight: 42, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D7D2C7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: TEXT, fontSize: 13 },
  mapAddressInput: { flex: 1 },
  mapSearchBtn: { minHeight: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 13 },
  mapSearchBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  mapFrame: { flex: 1, minHeight: 170, borderWidth: 1, borderColor: '#D7D2C7', borderRadius: 10, overflow: 'hidden', backgroundColor: '#E8E4DE' },
  mapLoading: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.94)', padding: 10, borderRadius: 8 },
  mapLoadingText: { color: PRIMARY, fontSize: 13, fontWeight: '600' },
  mapError: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 6 },
  currentLocationBtn: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', gap: 7, borderWidth: 1, borderColor: PRIMARY, borderRadius: 8, paddingHorizontal: 11, marginTop: 9 },
  currentLocationText: { color: PRIMARY, fontSize: 12, fontWeight: '700' },
  mapActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 9 },
  mapCancelBtn: { minHeight: 43, minWidth: 95, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 12 },
  mapCancelText: { color: '#555', fontSize: 13, fontWeight: '700' },
  mapConfirmBtn: { minHeight: 43, justifyContent: 'center', alignItems: 'center', backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 15 },
  mapConfirmText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
