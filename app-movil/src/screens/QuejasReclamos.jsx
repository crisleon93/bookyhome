import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Image, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Footer from '../components/Footer';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  getOrdenes, getQuejas, crearQueja, cancelarQueja, getApiBaseUrl,
  getMensajesReclamo, enviarMensajeReclamo,
} from '../services/api';
import {
  IconAlertTriangle, IconCheck, IconEye, IconChevronRight, IconMessage, IconStoreAlt,
} from '../components/Icons';
import { AuthContext } from '../context/AuthContext';
import SidebarMenu from '../components/SidebarMenu';
import SidebarVendedor from '../components/SidebarVendedor';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const GRAY = '#6B7280';
const BG = '#F8FAFC';
const BORDER = '#E5E7EB';

const MOTIVOS = [
  'Libro dañado o defectuoso',
  'Producto incorrecto',
  'No coincide con la descripción',
  'Problema con la entrega',
  'Otro',
];

const ESTADO_CONFIG = {
  'Resuelto': { bg: '#DCFCE7', color: '#166534', dot: '#16A34A' },
  'En revisión': { bg: '#FFF7ED', color: '#9A3412', dot: '#EA580C' },
  'Abierto': { bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
  'Cerrado': { bg: '#F3F4F6', color: '#374151', dot: '#6B7280' },
  'Rechazado': { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
};

const getEstadoConfig = (estado) =>
  ESTADO_CONFIG[estado === 'En revision' ? 'En revisión' : estado] || ESTADO_CONFIG.Cerrado;

const getFechaQueja = (queja) =>
  queja.fecha_solicitud || queja.fecha_creacion || queja.created_at;

const getTiempoTranscurrido = (fecha) => {
  if (!fecha) return null;
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (!Number.isFinite(minutos) || minutos < 0) return null;
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} día${dias === 1 ? '' : 's'}`;
  const meses = Math.floor(dias / 30);
  return `hace ${meses} mes${meses === 1 ? '' : 'es'}`;
};

export default function QuejasReclamos({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [quejas, setQuejas] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [motivoOtro, setMotivoOtro] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [evidencia, setEvidencia] = useState(null);
  
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');
  const [vistaPrincipal, setVistaPrincipal] = useState('nueva');
  const [vistaEvidencia, setVistaEvidencia] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [cancelando, setCancelando] = useState(null);
  const [paginaReclamos, setPaginaReclamos] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(5);
  const [tarjetaColapsada, setTarjetaColapsada] = useState({});
  const [chatAbierto, setChatAbierto] = useState(null);
  const [mensajesChat, setMensajesChat] = useState({});
  const [cargandoChat, setCargandoChat] = useState(null);
  const [mensajeChatInput, setMensajeChatInput] = useState({});
  const [enviandoMensaje, setEnviandoMensaje] = useState(null);
  
  // Modals for selection
  const [showOrdenModal, setShowOrdenModal] = useState(false);
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [showPageSizeModal, setShowPageSizeModal] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
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
    setError('');
    if (!ordenSeleccionada || !motivo) {
      Alert.alert('Incompleto', 'Selecciona una compra y un motivo.');
      return;
    }
    if (motivo === 'Otro' && !motivoOtro.trim()) {
      Alert.alert('Incompleto', 'Por favor especifica el motivo del reclamo.');
      return;
    }
    
    setEnviando(true);
    const data = new FormData();
    data.append('id_orden', ordenSeleccionada.id_orden);
    const motivoFinal = motivo === 'Otro' ? motivoOtro.trim() : motivo;
    data.append('motivo', motivoFinal);
    data.append('descripcion', descripcion.trim() || motivoFinal);
    
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
      setMotivoOtro('');
      setDescripcion('');
      setEvidencia(null);
      setMensajeExito('Solicitud enviada. El administrador revisará tu caso.');
      setError('');
      setVistaPrincipal('historial');
      await cargar();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'No se pudo enviar la solicitud.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setEnviando(false);
    }
  };

  const renderBadge = (estado) => {
    const estadoNormalizado = estado === 'En revision' ? 'En revisión' : estado;
    const config = getEstadoConfig(estado);
    
    return (
      <View style={[styles.badge, { backgroundColor: config.dot }]}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>{estadoNormalizado}</Text>
      </View>
    );
  };

  const reclamosFiltrados = quejas.filter((queja) =>
    filtroEstado === 'Todos' || queja.estado === filtroEstado ||
    (filtroEstado === 'En revisión' && queja.estado === 'En revision')
  );
  const totalPaginasReclamos = Math.max(1, Math.ceil(reclamosFiltrados.length / itemsPorPagina));
  const paginaActualReclamos = Math.min(paginaReclamos, totalPaginasReclamos);
  const reclamosVisibles = reclamosFiltrados.slice(
    (paginaActualReclamos - 1) * itemsPorPagina,
    paginaActualReclamos * itemsPorPagina
  );
  const conteosEstados = quejas.reduce((conteos, queja) => {
    const estado = queja.estado === 'En revision' ? 'En revisión' : queja.estado;
    conteos[estado] = (conteos[estado] || 0) + 1;
    return conteos;
  }, {});

  const abrirChat = async (idSolicitud) => {
    if (chatAbierto === idSolicitud) {
      setChatAbierto(null);
      return;
    }
    setChatAbierto(idSolicitud);
    if (mensajesChat[idSolicitud]) return;
    setCargandoChat(idSolicitud);
    try {
      const response = await getMensajesReclamo(idSolicitud);
      setMensajesChat((actuales) => ({ ...actuales, [idSolicitud]: response.data || [] }));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudieron cargar los mensajes del reclamo.');
    } finally {
      setCargandoChat(null);
    }
  };

  const handleEnviarMensaje = async (idSolicitud) => {
    const texto = (mensajeChatInput[idSolicitud] || '').trim();
    if (!texto || enviandoMensaje === idSolicitud) return;
    setEnviandoMensaje(idSolicitud);
    try {
      await enviarMensajeReclamo(idSolicitud, texto);
      setMensajeChatInput((actuales) => ({ ...actuales, [idSolicitud]: '' }));
      const response = await getMensajesReclamo(idSolicitud);
      setMensajesChat((actuales) => ({ ...actuales, [idSolicitud]: response.data || [] }));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviandoMensaje(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <LinearGradient colors={['#7A1E3A', '#8E2640']} style={styles.headerBox}>
          <View style={styles.iconWrap}>
            <IconAlertTriangle size={28} color={WHITE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subtitle}>
              {vistaPrincipal === 'nueva'
                ? 'Reporta un problema de una compra pagada y adjunta evidencia si la tienes.'
                : 'Consulta el estado de tus solicitudes anteriores.'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.tabs}>
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected: vistaPrincipal === 'nueva' }}
            style={[styles.tab, vistaPrincipal === 'nueva' && styles.tabActive]}
            onPress={() => setVistaPrincipal('nueva')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, vistaPrincipal === 'nueva' && styles.tabTextActive]}>
              Nueva queja o reclamo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected: vistaPrincipal === 'historial' }}
            style={[styles.tab, vistaPrincipal === 'historial' && styles.tabActive]}
            onPress={() => setVistaPrincipal('historial')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, vistaPrincipal === 'historial' && styles.tabTextActive]}>
              Mis quejas y reclamos
            </Text>
          </TouchableOpacity>
        </View>

        {mensajeExito ? (
          <View style={styles.successBox}>
            <IconCheck size={20} color="#166534" />
            <Text style={styles.successText}>{mensajeExito}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <IconAlertTriangle size={18} color="#991B1B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {vistaPrincipal === 'nueva' ? (
        <View style={styles.card}>
          {cargando ? (
            <ActivityIndicator size="large" color={PRIMARY} style={{ marginVertical: 30 }} />
          ) : ordenes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No hay compras disponibles</Text>
            </View>
          ) : (
            <>
              <View style={styles.purchaseGroup}>
                <Text style={styles.groupTitle}>📦  Selecciona tu compra</Text>
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
                  <Text style={[styles.selectText, styles.placeholderText]}>Selecciona una compra...</Text>
                )}
                <IconChevronRight size={18} color={GRAY} />
                </TouchableOpacity>
              </View>

              <View style={styles.problemGroup}>
                <Text style={styles.groupTitle}>📝  Describe el problema</Text>
                <Text style={styles.label}>Motivo del reclamo</Text>
                <TouchableOpacity style={styles.selectInput} onPress={() => setShowMotivoModal(true)} activeOpacity={0.8}>
                  <Text style={[styles.selectText, !motivo && styles.placeholderText]}>{motivo || 'Selecciona un motivo'}</Text>
                  <IconChevronRight size={18} color={GRAY} />
                </TouchableOpacity>
                {motivo === 'Otro' && (
                  <TextInput
                    style={styles.input}
                    value={motivoOtro}
                    onChangeText={setMotivoOtro}
                    placeholder="Especifica el motivo..."
                    placeholderTextColor={GRAY}
                  />
                )}

                <Text style={styles.label}>Evidencia <Text style={styles.optionalText}>(opcional)</Text></Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={seleccionarEvidencia} activeOpacity={0.8}>
                  <Text style={styles.uploadChoice}>Elegir</Text>
                  <Text style={styles.fileText} numberOfLines={1}>{evidencia ? evidencia.name : 'Sin archivo'}</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Descripción <Text style={styles.optionalText}>(opcional)</Text></Text>
                <TextInput
                  style={styles.textArea}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholder="Describe el problema..."
                  placeholderTextColor={GRAY}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.submitBtn, enviando && styles.submitBtnDisabled]}
                  onPress={enviar}
                  disabled={enviando}
                  activeOpacity={0.8}
                >
                  {enviando ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={styles.submitBtnText}>Enviar</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        ) : (
        <View style={styles.card}>
          <View style={styles.historyHeading}>
            <Text style={styles.historyTitle}>Mis quejas y reclamos</Text>
            {quejas.length > 0 && <Text style={styles.historyCount}>{quejas.length} solicitud{quejas.length !== 1 ? 'es' : ''}</Text>}
          </View>
          {quejas.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {['Todos', 'Abierto', 'En revisión', 'Resuelto', 'Rechazado'].map(estado => (
                  <TouchableOpacity
                    key={estado}
                    style={[styles.filterBtn, filtroEstado === estado && styles.filterBtnActive]}
                    onPress={() => { setFiltroEstado(estado); setPaginaReclamos(1); }}
                  >
                    <Text style={[styles.filterText, filtroEstado === estado && styles.filterTextActive]}>
                      {estado} {((estado === 'Todos' ? quejas.length : conteosEstados[estado]) || 0) > 0
                        ? ` (${estado === 'Todos' ? quejas.length : conteosEstados[estado]})`
                        : ''}
                    </Text>
                  </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {quejas.length === 0 && !cargando ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No hay solicitudes</Text>
            </View>
          ) : reclamosFiltrados.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>No hay solicitudes con este estado</Text>
            </View>
          ) : (
            <>
            <View style={styles.ticketList}>
            {reclamosVisibles.map((queja) => {
              const estadoConfig = getEstadoConfig(queja.estado);
              const estadoActual = queja.estado === 'En revision' ? 'En revisión' : queja.estado;
              const progresoActual = ['Abierto', 'En revisión', 'Resuelto'].indexOf(estadoActual);
              const fecha = getFechaQueja(queja);
              const fechaTexto = fecha
                ? new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                : null;
              const tiempoTexto = getTiempoTranscurrido(fecha);
              const tienda = queja.nombre_tienda || queja.tienda || null;
              const imagen = queja.imagen_libro
                ? (queja.imagen_libro.startsWith('http') ? queja.imagen_libro : `${getApiBaseUrl()}${queja.imagen_libro}`)
                : null;
              const numero = queja.numero || queja.id_solicitud;
              const colapsada = Boolean(tarjetaColapsada[queja.id_solicitud]);
              const puedeChatear = !['Cerrado', 'Resuelto', 'Rechazado'].includes(queja.estado);
              return (
              <View key={queja.id_solicitud} style={[styles.ticketCard, { borderColor: `${estadoConfig.dot}33`, borderLeftColor: estadoConfig.dot }]}>
                <TouchableOpacity
                  style={[styles.ticketHeader, colapsada && styles.ticketHeaderCollapsed]}
                  onPress={() => setTarjetaColapsada((actuales) => ({
                    ...actuales,
                    [queja.id_solicitud]: !actuales[queja.id_solicitud],
                  }))}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${colapsada ? 'Expandir' : 'Contraer'} reclamo ${numero}`}
                >
                  {imagen ? (
                    <Image source={{ uri: imagen }} style={styles.ticketImage} />
                  ) : (
                    <View style={styles.ticketImageFallback}>
                      <Text style={styles.ticketImageNumber}>#{numero}</Text>
                    </View>
                  )}
                  <View style={styles.ticketHeadingText}>
                    <View style={styles.ticketNumberRow}>
                      <Text style={styles.ticketNumber}>#{numero}</Text>
                      {queja.id_orden ? <Text style={styles.ticketOrder}>· #{queja.id_orden}</Text> : null}
                    </View>
                    <Text style={styles.ticketBookTitle} numberOfLines={1}>
                      {queja.titulo_libro || 'Libro'}
                      {queja.total_items > 1 ? ` +${queja.total_items - 1} más` : ''}
                    </Text>
                    {colapsada && (
                      <Text style={styles.collapsedSummary} numberOfLines={1}>
                        {queja.asunto}{tiempoTexto ? ` · ${tiempoTexto}` : ''}
                      </Text>
                    )}
                  </View>
                  {renderBadge(queja.estado)}
                  <Text style={styles.collapseIcon}>{colapsada ? '⌄' : '⌃'}</Text>
                </TouchableOpacity>

                {!colapsada && (
                  <View style={styles.ticketBody}>
                    {!['Rechazado', 'Cerrado'].includes(queja.estado) && (
                      <View style={styles.progressRow}>
                        <View style={styles.progressSteps}>
                          {['Abierto', 'En revisión', 'Resuelto'].map((paso, index) => {
                            const completado = progresoActual >= index;
                            return (
                              <View key={paso} style={styles.progressStep}>
                                <View style={[
                                  styles.progressDot,
                                  completado && { backgroundColor: estadoConfig.dot },
                                  progresoActual === index && { borderWidth: 2, borderColor: estadoConfig.dot },
                                ]}>
                                  {completado && <Text style={styles.progressCheck}>✓</Text>}
                                </View>
                                <Text style={[
                                  styles.progressText,
                                  completado && { color: estadoConfig.color, fontWeight: '600' },
                                ]}>{paso}</Text>
                              </View>
                            );
                          })}
                        </View>
                        <View style={styles.progressTrack}>
                          <View style={[
                            styles.progressFill,
                            { backgroundColor: estadoConfig.dot, width: progresoActual <= 0 ? '0%' : progresoActual === 1 ? '50%' : '100%' },
                          ]} />
                        </View>
                      </View>
                    )}

                    <View style={styles.ticketMetadata}>
                      <View style={styles.reasonTag}>
                        <IconMessage size={12} color={PRIMARY} />
                        <Text style={styles.reasonTagText}>{queja.asunto}</Text>
                      </View>
                      {tienda && (
                        <View style={styles.storeTag}>
                          <IconStoreAlt size={12} color="#0369A1" />
                          <Text style={styles.storeTagText}>{tienda}</Text>
                        </View>
                      )}
                      {fechaTexto && <Text style={styles.ticketDate}>{fechaTexto}</Text>}
                      {tiempoTexto && <Text style={styles.ticketElapsed}>{tiempoTexto}</Text>}
                    </View>

                    {queja.descripcion ? (
                      <View style={styles.descriptionBox}>
                        <Text style={styles.historyDesc}>{queja.descripcion}</Text>
                      </View>
                    ) : null}

                    {queja.evidencia_url && (
                      <TouchableOpacity
                        style={styles.evidenciaBtn}
                        onPress={() => setVistaEvidencia(`${getApiBaseUrl()}${queja.evidencia_url}`)}
                        activeOpacity={0.8}
                      >
                        <IconEye size={14} color={PRIMARY} />
                        <Text style={styles.evidenciaText}>Ver evidencia</Text>
                      </TouchableOpacity>
                    )}

                    {queja.respuesta && queja.respuesta !== 'Cancelado por el usuario' && (
                      <View style={styles.respuestaBox}>
                        <Text style={styles.respuestaText}>
                          <Text style={styles.respuestaTitle}>Admin: </Text>{queja.respuesta}
                        </Text>
                      </View>
                    )}

                    {puedeChatear && (
                      <View>
                        <TouchableOpacity style={styles.chatToggle} onPress={() => abrirChat(queja.id_solicitud)} activeOpacity={0.8}>
                          <IconMessage size={14} color={PRIMARY} />
                          <Text style={styles.chatToggleText}>
                            {chatAbierto === queja.id_solicitud ? 'Ocultar chat' : 'Chat'}
                          </Text>
                        </TouchableOpacity>
                        {chatAbierto === queja.id_solicitud && (
                          <View style={styles.chatPanel}>
                            <View style={styles.chatHeader}>
                              <IconMessage size={14} color={WHITE} />
                              <Text style={styles.chatHeaderText}>Chat · #{queja.id_solicitud}</Text>
                            </View>
                            <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent} nestedScrollEnabled>
                              {cargandoChat === queja.id_solicitud ? (
                                <ActivityIndicator size="small" color={PRIMARY} />
                              ) : !mensajesChat[queja.id_solicitud]?.length ? (
                                <Text style={styles.chatEmpty}>Sin mensajes aún</Text>
                              ) : mensajesChat[queja.id_solicitud].map((mensaje, index) => {
                                const esComprador = mensaje.rol === 'usuario' || mensaje.rol === 'comprador';
                                const esAdmin = mensaje.rol === 'admin' || mensaje.rol === 'administrador';
                                const hora = mensaje.fecha_creacion || mensaje.creado_en;
                                return (
                                  <View key={mensaje.id_mensaje || index} style={[
                                    styles.chatMessageRow,
                                    esComprador ? styles.chatMessageBuyer : styles.chatMessageOther,
                                  ]}>
                                    <View style={[
                                      styles.chatBubble,
                                      esComprador ? styles.chatBubbleBuyer : esAdmin ? styles.chatBubbleAdmin : styles.chatBubbleOther,
                                    ]}>
                                      <Text style={[
                                        styles.chatMessageText,
                                        esComprador && styles.chatMessageBuyerText,
                                        esAdmin && styles.chatMessageAdminText,
                                      ]}>{mensaje.mensaje}</Text>
                                    </View>
                                    {hora ? (
                                      <Text style={styles.chatTime}>
                                        {new Date(hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                      </Text>
                                    ) : null}
                                  </View>
                                );
                              })}
                            </ScrollView>
                            <View style={styles.chatInputRow}>
                              <TextInput
                                style={styles.chatInput}
                                value={mensajeChatInput[queja.id_solicitud] || ''}
                                onChangeText={(texto) => setMensajeChatInput((actuales) => ({
                                  ...actuales,
                                  [queja.id_solicitud]: texto,
                                }))}
                                placeholder="Escribe..."
                                placeholderTextColor={GRAY}
                                returnKeyType="send"
                                onSubmitEditing={() => handleEnviarMensaje(queja.id_solicitud)}
                              />
                              <TouchableOpacity
                                style={[
                                  styles.chatSendButton,
                                  (!(mensajeChatInput[queja.id_solicitud] || '').trim() || enviandoMensaje === queja.id_solicitud) && styles.chatSendDisabled,
                                ]}
                                onPress={() => handleEnviarMensaje(queja.id_solicitud)}
                                disabled={!(mensajeChatInput[queja.id_solicitud] || '').trim() || enviandoMensaje === queja.id_solicitud}
                                accessibilityRole="button"
                                accessibilityLabel="Enviar mensaje"
                              >
                                {enviandoMensaje === queja.id_solicitud
                                  ? <ActivityIndicator size="small" color={WHITE} />
                                  : <Text style={styles.chatSendText}>→</Text>}
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {queja.estado === 'Abierto' && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        disabled={cancelando === queja.id_solicitud}
                        onPress={() => Alert.alert('Cancelar reclamo', '¿Seguro que quieres cancelar este reclamo? Esta acción no se puede deshacer.', [
                          { text: 'No', style: 'cancel' },
                          { text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
                            setCancelando(queja.id_solicitud);
                            try { await cancelarQueja(queja.id_solicitud); await cargar(); }
                            catch (err) { Alert.alert('Error', err.response?.data?.detail || 'No se pudo cancelar.'); }
                            finally { setCancelando(null); }
                          } },
                        ])}
                      >
                        <Text style={styles.cancelBtnText}>{cancelando === queja.id_solicitud ? 'Cancelando...' : '⊗  Cancelar'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              );
            })}
            </View>
            <View style={styles.pagination}>
              <Text style={styles.paginationCount}>
                {(paginaActualReclamos - 1) * itemsPorPagina + 1}-{Math.min(paginaActualReclamos * itemsPorPagina, reclamosFiltrados.length)} de {reclamosFiltrados.length}
              </Text>
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[styles.pageButton, paginaActualReclamos === 1 && styles.pageButtonDisabled]}
                  onPress={() => setPaginaReclamos(paginaActualReclamos - 1)}
                  disabled={paginaActualReclamos === 1}
                ><Text style={styles.pageButtonText}>‹</Text></TouchableOpacity>
                <View style={styles.currentPage}><Text style={styles.currentPageText}>{paginaActualReclamos}</Text></View>
                <TouchableOpacity
                  style={[styles.pageButton, paginaActualReclamos === totalPaginasReclamos && styles.pageButtonDisabled]}
                  onPress={() => setPaginaReclamos(paginaActualReclamos + 1)}
                  disabled={paginaActualReclamos === totalPaginasReclamos}
                ><Text style={styles.pageButtonText}>›</Text></TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.pageSizeDropdown}
                onPress={() => setShowPageSizeModal(true)}
                accessibilityRole="button"
                accessibilityLabel={`Solicitudes por página: ${itemsPorPagina}`}
              >
                <Text style={styles.pageSizeDropdownText}>{itemsPorPagina}</Text>
                <Text style={styles.pageSizeChevron}>⌄</Text>
              </TouchableOpacity>
            </View>
            </>
          )}
        </View>
        )}
        <Footer onLinkPress={() => {}} />
      </ScrollView>

      <Modal
        visible={showPageSizeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPageSizeModal(false)}
      >
        <TouchableOpacity
          style={styles.pageSizeModalOverlay}
          activeOpacity={1}
          onPress={() => setShowPageSizeModal(false)}
        >
          <View style={styles.pageSizeMenu}>
            {[5, 10, 15].map((cantidad) => (
              <TouchableOpacity
                key={cantidad}
                style={[styles.pageSizeOption, itemsPorPagina === cantidad && styles.pageSizeOptionActive]}
                onPress={() => {
                  setItemsPorPagina(cantidad);
                  setPaginaReclamos(1);
                  setShowPageSizeModal(false);
                }}
              >
                <Text style={[styles.pageSizeOptionText, itemsPorPagina === cantidad && styles.pageSizeOptionTextActive]}>
                  {cantidad}
                </Text>
                {itemsPorPagina === cantidad && <IconCheck size={16} color={PRIMARY} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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

      {user?.rol === 'vendedor' ? (
        <SidebarVendedor
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          user={user}
          navigation={navigation}
          onSignOut={signOut}
        />
      ) : (
        <SidebarMenu
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          user={user}
          navigation={navigation}
          onSignOut={signOut}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: BG },
  scroll: { padding: 16, paddingBottom: 40, backgroundColor: BG },
  headerBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderRadius: 16, marginBottom: 20,
    elevation: 4, shadowColor: PRIMARY, shadowOpacity: 0.2, shadowRadius: 12,
  },
  iconWrap: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center'
  },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 19 },

  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 20 },
  tab: { flex: 1, minHeight: 44, paddingHorizontal: 8, paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: WHITE, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { color: GRAY, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  tabTextActive: { color: PRIMARY, fontWeight: '700' },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#86EFAC', marginBottom: 16,
  },
  successText: { fontSize: 14, color: '#166534', fontWeight: '500', flex: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: 16 },
  errorText: { flex: 1, color: '#991B1B', fontSize: 13, lineHeight: 18 },

  card: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  emptyBox: { backgroundColor: '#FAFAFA', padding: 28, borderRadius: 10, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 30, marginBottom: 3 },
  emptyText: { textAlign: 'center', color: GRAY, fontSize: 13, fontWeight: '500' },
  purchaseGroup: { gap: 12, padding: 12, backgroundColor: '#FDF8F9', borderRadius: 8, borderWidth: 1, borderColor: '#F0DDE4', marginBottom: 12 },
  problemGroup: { gap: 8, padding: 12, backgroundColor: '#FAFAFA', borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  groupTitle: { color: PRIMARY, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 2 },
  optionalText: { color: GRAY, fontWeight: '400' },
  selectInput: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, minHeight: 46, backgroundColor: WHITE,
  },
  selectText: { flex: 1, fontSize: 13, color: '#1A1A1A' },
  placeholderText: { color: GRAY },
  input: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#1A1A1A', backgroundColor: WHITE },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: WHITE,
  },
  uploadChoice: { backgroundColor: '#F7E9EE', color: PRIMARY, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  fileText: { flex: 1, fontSize: 12, color: GRAY },
  textArea: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 8,
    padding: 12, fontSize: 13, color: '#1A1A1A', backgroundColor: WHITE,
    minHeight: 84, lineHeight: 19,
  },
  submitBtn: {
    alignSelf: 'flex-end', minWidth: 105, backgroundColor: PRIMARY, borderRadius: 8,
    paddingHorizontal: 24, paddingVertical: 11, alignItems: 'center',
    marginTop: 10, shadowColor: PRIMARY, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  historyTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#111827' },
  historyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  historyCount: { color: PRIMARY, backgroundColor: '#FDF2F4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, fontSize: 11, fontWeight: '700', overflow: 'hidden' },
  filterRow: { gap: 4, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  filterBtnActive: { backgroundColor: '#3B82F6' },
  filterText: { color: PRIMARY, fontSize: 12, fontWeight: '400' },
  filterTextActive: { color: WHITE },
  emptyHistory: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  ticketList: { gap: 12 },
  ticketCard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 14, overflow: 'hidden', backgroundColor: WHITE, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FDF8F9', borderBottomWidth: 1, borderBottomColor: '#F0E8EC' },
  ticketHeaderCollapsed: { borderBottomWidth: 0 },
  ticketImage: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#F3F4F6' },
  ticketImageFallback: { width: 40, height: 40, borderRadius: 6, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  ticketImageNumber: { color: WHITE, fontSize: 10, fontWeight: '800' },
  ticketHeadingText: { flex: 1, minWidth: 0 },
  ticketNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  ticketNumber: { overflow: 'hidden', backgroundColor: PRIMARY, color: WHITE, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: '800' },
  ticketOrder: { color: PRIMARY, fontSize: 10, fontWeight: '600' },
  ticketBookTitle: { color: '#111827', fontSize: 13, lineHeight: 17, fontWeight: '800' },
  collapsedSummary: { color: GRAY, fontSize: 10, marginTop: 2 },
  collapseIcon: { width: 18, color: PRIMARY, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  ticketBody: { gap: 10, padding: 12 },
  progressRow: { padding: 10, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: BORDER, borderRadius: 6 },
  progressSteps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressStep: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1 },
  progressDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  progressCheck: { color: WHITE, fontSize: 9, fontWeight: '900' },
  progressText: { color: GRAY, fontSize: 9, textAlign: 'center', flexShrink: 1 },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  ticketMetadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  reasonTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 4, backgroundColor: '#FDF2F4', borderWidth: 1, borderColor: '#F0DDE4' },
  reasonTagText: { color: PRIMARY, fontSize: 10, fontWeight: '600', flexShrink: 1 },
  storeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 4, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD' },
  storeTagText: { color: '#0369A1', fontSize: 10, fontWeight: '600', flexShrink: 1 },
  ticketDate: { color: GRAY, fontSize: 10 },
  ticketElapsed: { color: GRAY, fontSize: 9, marginLeft: 'auto' },
  descriptionBox: { paddingHorizontal: 9, paddingVertical: 8, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: BORDER, borderRadius: 6 },
  historyDesc: { color: '#374151', fontSize: 12, lineHeight: 18 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14 },
  badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: WHITE },
  badgeText: { fontSize: 10, fontWeight: '700', color: WHITE },

  evidenciaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F7E9EE', alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 6, borderRadius: 5,
  },
  evidenciaText: { fontSize: 10, fontWeight: '700', color: PRIMARY },

  respuestaBox: {
    backgroundColor: '#FAFAFA', padding: 12, borderRadius: 8,
    borderLeftWidth: 3, borderLeftColor: PRIMARY, marginTop: 12,
  },
  respuestaTitle: { fontSize: 11, fontWeight: '700', color: PRIMARY },
  respuestaText: { fontSize: 12, color: '#374151', lineHeight: 18 },
  chatToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: '#E0DBD4', backgroundColor: WHITE, borderRadius: 6 },
  chatToggleText: { color: PRIMARY, fontSize: 10, fontWeight: '600' },
  chatPanel: { marginTop: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 8, overflow: 'hidden', backgroundColor: WHITE, elevation: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: PRIMARY },
  chatHeaderText: { color: WHITE, fontSize: 11, fontWeight: '700' },
  chatMessages: { maxHeight: 230, minHeight: 60, backgroundColor: '#FAFAFA' },
  chatMessagesContent: { padding: 10, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  chatEmpty: { color: GRAY, fontSize: 11, textAlign: 'center', marginVertical: 18 },
  chatMessageRow: { gap: 2 },
  chatMessageBuyer: { alignItems: 'flex-end' },
  chatMessageOther: { alignItems: 'flex-start' },
  chatBubble: { maxWidth: '88%', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  chatBubbleBuyer: { backgroundColor: PRIMARY },
  chatBubbleAdmin: { backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD' },
  chatBubbleOther: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: BORDER },
  chatMessageText: { color: '#374151', fontSize: 12, lineHeight: 17 },
  chatMessageBuyerText: { color: WHITE },
  chatMessageAdminText: { color: '#1A1A1A' },
  chatTime: { color: GRAY, fontSize: 9 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: '#FAFAFA' },
  chatInput: { flex: 1, minHeight: 36, borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: WHITE, color: '#1A1A1A', fontSize: 12 },
  chatSendButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 6 },
  chatSendDisabled: { backgroundColor: '#D1C0C5' },
  chatSendText: { color: WHITE, fontSize: 18, fontWeight: '700' },
  cancelBtn: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FFF', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7 },
  cancelBtnText: { color: '#DC2626', fontSize: 10, fontWeight: '700' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  paginationCount: { color: GRAY, fontSize: 10, fontWeight: '500' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pageButton: { minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 5, backgroundColor: WHITE },
  pageButtonDisabled: { opacity: 0.45 },
  pageButtonText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  currentPage: { minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 4 },
  currentPageText: { color: WHITE, fontSize: 11, fontWeight: '700' },
  pageSizeDropdown: { minWidth: 58, height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 5, backgroundColor: WHITE },
  pageSizeDropdownText: { color: '#374151', fontSize: 11, fontWeight: '600' },
  pageSizeChevron: { color: '#374151', fontSize: 13, marginTop: -4 },
  pageSizeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'flex-end', alignItems: 'flex-end', padding: 20 },
  pageSizeMenu: { minWidth: 110, padding: 4, borderRadius: 8, backgroundColor: WHITE, elevation: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12 },
  pageSizeOption: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderRadius: 5 },
  pageSizeOptionActive: { backgroundColor: '#FDF2F4' },
  pageSizeOptionText: { color: '#374151', fontSize: 13 },
  pageSizeOptionTextActive: { color: PRIMARY, fontWeight: '700' },

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
