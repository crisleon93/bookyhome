import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Image, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getOrdenes, getQuejas, crearQueja, getApiBaseUrl } from '../services/api';
import { IconAlertTriangle, IconCheck, IconEye, IconChevronRight } from '../components/Icons';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const GRAY = '#888';
const BG = '#F9F6F1';
const BORDER = '#EEE';

const MOTIVOS = [
  'Libro dañado o defectuoso',
  'Producto incorrecto',
  'No coincide con la descripción',
  'Problema con la entrega',
  'Otro',
];

export default function QuejasReclamos({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [quejas, setQuejas] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [evidencia, setEvidencia] = useState(null);
  
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [vistaEvidencia, setVistaEvidencia] = useState(null);
  
  // Modals for selection
  const [showOrdenModal, setShowOrdenModal] = useState(false);
  const [showMotivoModal, setShowMotivoModal] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensajeExito('');
    try {
      const [ordenesRes, quejasRes] = await Promise.all([getOrdenes(), getQuejas()]);
      const solicitudes = quejasRes.data || [];
      const ordenesConSolicitudActiva = new Set(solicitudes
        .filter((item) => ['Abierto', 'En revisión'].includes(item.estado))
        .map((item) => Number(item.id_orden)));
        
      setOrdenes((ordenesRes.data || []).filter((orden) =>
        orden.estado === 'pagado' && !ordenesConSolicitudActiva.has(Number(orden.id_orden))
      ));
      setQuejas(solicitudes);
    } catch (err) {
      console.log('Error cargando quejas:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.detail || 'No se pudieron cargar tus compras y reclamos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const seleccionarEvidencia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a tus fotos para adjuntar evidencia.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
      const asset = pickerResult.assets[0];
      setEvidencia({
        uri: asset.uri,
        name: asset.fileName || `evidencia_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const enviar = async () => {
    if (!ordenSeleccionada || !motivo) {
      Alert.alert('Incompleto', 'Selecciona una compra y un motivo.');
      return;
    }
    
    setEnviando(true);
    const data = new FormData();
    data.append('id_orden', ordenSeleccionada.id_orden);
    data.append('motivo', motivo);
    data.append('descripcion', descripcion.trim() || motivo);
    
    if (evidencia) {
      data.append('evidencia', {
        uri: evidencia.uri,
        name: evidencia.name,
        type: evidencia.type,
      });
    }

    try {
      await crearQueja(data);
      setOrdenSeleccionada(null);
      setMotivo('');
      setDescripcion('');
      setEvidencia(null);
      setMensajeExito('Solicitud enviada. El administrador revisará tu caso.');
      await cargar();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  const renderBadge = (estado) => {
    let bg = '#E5E7EB';
    let text = '#333';
    if (estado === 'Resuelto') {
      bg = '#DCFCE7';
      text = '#166534';
    } else if (estado === 'En revisión') {
      bg = '#FEF3C7';
      text = '#B45309';
    }
    
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{estado}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Quejas y reclamos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.headerBox}>
          <View style={styles.iconWrap}>
            <IconAlertTriangle size={32} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Quejas y reclamos</Text>
            <Text style={styles.subtitle}>Reporta un problema de una compra pagada y adjunta evidencia.</Text>
          </View>
        </View>

        {mensajeExito ? (
          <View style={styles.successBox}>
            <IconCheck size={20} color="#166534" />
            <Text style={styles.successText}>{mensajeExito}</Text>
          </View>
        ) : null}

        {/* Formulario */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Nueva queja o reclamo</Text>
            <Text style={styles.cardSubtitle}>Solo aparecen compras pagadas de tu cuenta.</Text>
          </View>

          {cargando ? (
            <ActivityIndicator size="large" color={PRIMARY} style={{ marginVertical: 30 }} />
          ) : ordenes.length === 0 ? (
            <View style={styles.emptyBox}>
              <IconAlertTriangle size={32} color={PRIMARY} />
              <Text style={styles.emptyText}>No tienes compras pagadas disponibles para una nueva solicitud.</Text>
            </View>
          ) : (
            <>
              {/* Select Orden */}
              <Text style={styles.label}>Selecciona una compra pagada</Text>
              <TouchableOpacity style={[styles.selectInput, ordenSeleccionada && { height: 'auto', paddingVertical: 12 }]} onPress={() => setShowOrdenModal(true)} activeOpacity={0.8}>
                {ordenSeleccionada ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    {ordenSeleccionada.items?.[0]?.imagen_url || ordenSeleccionada.items?.[0]?.imagen ? (
                      <Image 
                        source={{ uri: (ordenSeleccionada.items[0].imagen_url || ordenSeleccionada.items[0].imagen).startsWith('http') ? (ordenSeleccionada.items[0].imagen_url || ordenSeleccionada.items[0].imagen) : `${getApiBaseUrl()}${ordenSeleccionada.items[0].imagen_url || ordenSeleccionada.items[0].imagen}` }} 
                        style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#eee' }} 
                      />
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#F7E9EE', alignItems: 'center', justifyContent: 'center' }}><Text>📚</Text></View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: '#333', fontWeight: '700' }} numberOfLines={1}>
                        {ordenSeleccionada.items?.[0]?.titulo || ordenSeleccionada.items?.[0]?.nombre_libro || 'Varios libros'}
                      </Text>
                      <Text style={{ fontSize: 12, color: GRAY }} numberOfLines={1}>
                        Orden #{ordenSeleccionada.id_orden} · {ordenSeleccionada.items?.[0]?.nombre_tienda || 'Tienda'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.selectText}>Selecciona una compra pagada</Text>
                )}
                <IconChevronRight size={18} color={GRAY} />
              </TouchableOpacity>

              {/* Select Motivo */}
              <Text style={styles.label}>Motivo del reclamo</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowMotivoModal(true)} activeOpacity={0.8}>
                <Text style={styles.selectText}>{motivo || 'Selecciona un motivo'}</Text>
                <IconChevronRight size={18} color={GRAY} />
              </TouchableOpacity>

              {/* Upload Evidencia */}
              <Text style={styles.label}>Evidencia (opcional)</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.uploadBtn} onPress={seleccionarEvidencia} activeOpacity={0.8}>
                  <Text style={styles.uploadBtnText}>Seleccionar archivo</Text>
                </TouchableOpacity>
                <Text style={styles.fileText} numberOfLines={1}>
                  {evidencia ? evidencia.name : 'Sin archivos seleccionados'}
                </Text>
              </View>

              {/* Descripción */}
              <Text style={styles.label}>Descripción del problema (opcional)</Text>
              <TextInput
                style={styles.textArea}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Describe el problema con más detalle..."
                placeholderTextColor={GRAY}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                style={[styles.submitBtn, enviando && styles.submitBtnDisabled]}
                onPress={enviar}
                disabled={enviando}
                activeOpacity={0.8}
              >
                {enviando ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={styles.submitBtnText}>Enviar solicitud</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Historial */}
        <View style={styles.card}>
          <Text style={styles.historyTitle}>Mis quejas y reclamos</Text>
          
          {quejas.length === 0 && !cargando ? (
            <Text style={styles.emptyHistory}>No tienes solicitudes previas.</Text>
          ) : (
            quejas.map((queja) => (
              <View key={queja.id_solicitud} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyItemTitle}>Orden #{queja.id_orden} · {queja.asunto}</Text>
                  {renderBadge(queja.estado)}
                </View>
                
                <Text style={styles.historyDesc}>{queja.descripcion}</Text>
                
                {queja.evidencia_url && (
                  <TouchableOpacity 
                    style={styles.evidenciaBtn} 
                    onPress={() => setVistaEvidencia(`${getApiBaseUrl()}${queja.evidencia_url}`)}
                    activeOpacity={0.8}
                  >
                    <IconEye size={18} color={PRIMARY} />
                    <Text style={styles.evidenciaText}>Ver evidencia</Text>
                  </TouchableOpacity>
                )}
                
                {queja.respuesta && (
                  <View style={styles.respuestaBox}>
                    <Text style={styles.respuestaTitle}>Respuesta del administrador:</Text>
                    <Text style={styles.respuestaText}>{queja.respuesta}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Modal Ordenes */}
      <Modal visible={showOrdenModal} transparent animationType="fade" onRequestClose={() => setShowOrdenModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una compra</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {ordenes.map(orden => {
                const primerItem = (orden.items && orden.items.length > 0) ? orden.items[0] : {};
                const imageUrl = primerItem.imagen_url || primerItem.imagen;
                const nombreLibro = primerItem.titulo || primerItem.nombre_libro || 'Varios libros';
                const nombreTienda = primerItem.nombre_tienda || 'Tienda BookyHome';
                const masItems = orden.items && orden.items.length > 1 ? ` +${orden.items.length - 1}` : '';

                return (
                  <TouchableOpacity 
                    key={orden.id_orden} 
                    style={[styles.modalOption, { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 }]}
                    onPress={() => { setOrdenSeleccionada(orden); setShowOrdenModal(false); }}
                  >
                    {imageUrl ? (
                      <Image 
                        source={{ uri: imageUrl.startsWith('http') ? imageUrl : `${getApiBaseUrl()}${imageUrl}` }} 
                        style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#f0f0f0' }} 
                      />
                    ) : (
                      <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#F7E9EE', alignItems: 'center', justifyContent: 'center' }}>
                         <Text style={{ fontSize: 20 }}>📚</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalOptionText, { textAlign: 'left', fontWeight: '700', fontSize: 15, marginBottom: 4 }]} numberOfLines={1}>
                        {nombreLibro}{masItems}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#666' }} numberOfLines={1}>
                        Orden #{orden.id_orden} · {nombreTienda}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: PRIMARY, marginTop: 2 }}>
                        ${Number(orden.total || 0).toLocaleString('es-CO')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowOrdenModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Motivos */}
      <Modal visible={showMotivoModal} transparent animationType="fade" onRequestClose={() => setShowMotivoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona un motivo</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {MOTIVOS.map(m => (
                <TouchableOpacity 
                  key={m} 
                  style={styles.modalOption}
                  onPress={() => { setMotivo(m); setShowMotivoModal(false); }}
                >
                  <Text style={styles.modalOptionText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMotivoModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Evidencia (Imagen) */}
      <Modal visible={!!vistaEvidencia} transparent animationType="fade" onRequestClose={() => setVistaEvidencia(null)}>
        <View style={styles.imgModalOverlay}>
          <TouchableOpacity style={{ flex: 1, width: '100%' }} onPress={() => setVistaEvidencia(null)} />
          {vistaEvidencia && (
            <Image 
              source={{ uri: vistaEvidencia }} 
              style={styles.fullImg} 
              resizeMode="contain" 
            />
          )}
          <TouchableOpacity style={{ flex: 1, width: '100%' }} onPress={() => setVistaEvidencia(null)} />
          <TouchableOpacity style={styles.closeImgBtn} onPress={() => setVistaEvidencia(null)}>
            <Text style={styles.closeImgText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <SidebarVendedor
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#7A1E3A' },
  topHeader:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7A1E3A', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:        { color: WHITE, fontSize: 20, fontWeight: '700' },
  topHeaderTitle:  { fontSize: 18, fontWeight: '800', color: WHITE },
  scroll: { padding: 16, paddingBottom: 40, backgroundColor: BG },
  
  headerBox: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: WHITE, padding: 20, borderRadius: 16,
    marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#F7E9EE',
    alignItems: 'center', justifyContent: 'center'
  },
  title: { fontSize: 20, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  subtitle: { fontSize: 13, color: GRAY, lineHeight: 18 },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4', padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#86EFAC', marginBottom: 20,
  },
  successText: { fontSize: 14, color: '#166534', fontWeight: '500', flex: 1 },

  card: {
    backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  cardHeader: { borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 16, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: GRAY },

  emptyBox: { backgroundColor: BG, padding: 24, borderRadius: 12, alignItems: 'center', gap: 12 },
  emptyText: { textAlign: 'center', color: GRAY, fontSize: 14, fontWeight: '500' },

  label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 16 },
  
  selectInput: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#DDD', borderRadius: 12,
    paddingHorizontal: 16, height: 52, backgroundColor: WHITE,
  },
  selectText: { fontSize: 14, color: '#333' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadBtn: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F9F9F9',
  },
  uploadBtnText: { fontSize: 13, color: '#333', fontWeight: '500' },
  fileText: { flex: 1, fontSize: 13, color: GRAY },

  textArea: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 12,
    padding: 16, fontSize: 14, backgroundColor: WHITE,
    minHeight: 100,
  },

  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 24,
    shadowColor: PRIMARY, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },

  historyTitle: { fontSize: 18, fontWeight: '800', color: PRIMARY, marginBottom: 16 },
  emptyHistory: { textAlign: 'center', color: GRAY, paddingVertical: 24 },
  historyItem: {
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingVertical: 16,
  },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 8, gap: 10,
  },
  historyItemTitle: { fontSize: 15, fontWeight: '700', color: '#333', flex: 1, lineHeight: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  historyDesc: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },

  evidenciaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F7E9EE', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  evidenciaText: { fontSize: 13, fontWeight: '700', color: PRIMARY },

  respuestaBox: {
    backgroundColor: BG, padding: 14, borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: PRIMARY, marginTop: 12,
  },
  respuestaTitle: { fontSize: 13, fontWeight: '700', color: PRIMARY, marginBottom: 4 },
  respuestaText: { fontSize: 14, color: '#555', lineHeight: 20 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalOptionText: { fontSize: 16, color: '#333', textAlign: 'center' },
  modalCancel: { marginTop: 20, paddingVertical: 16, backgroundColor: BG, borderRadius: 12 },
  modalCancelText: { fontSize: 16, fontWeight: '700', color: PRIMARY, textAlign: 'center' },

  imgModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  fullImg: { width: Dimensions.get('window').width * 0.9, height: Dimensions.get('window').height * 0.7 },
  closeImgBtn: { position: 'absolute', bottom: 40, backgroundColor: WHITE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  closeImgText: { fontSize: 15, fontWeight: '700', color: PRIMARY },
});
