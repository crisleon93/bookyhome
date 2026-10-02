import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  SectionList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  Linking,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path, Circle, Line, Rect, Polygon, SvgUri } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { useChatSocket } from '../context/ChatSocketContext';
import {
  getChatHistory,
  marcarSalaLeida as marcarSalaLeidaApi,
  enviarMensajeChat,
  vaciarSalaChat,
  eliminarSalaChat,
} from '../services/api';
import { EMOJI_CATEGORIES, GIF_OPTIONS, STICKER_OPTIONS } from '../data/chatEmojiData';

const PRIMARY = '#7A1E3A';
const PRIMARY_DARK = '#4E1022';
const BG = '#F3EFEA';
const PANEL = '#F9F5F0';
const INPUT_BG = '#F7F3F0';
const SOFT = '#F4EEF0';
const WHITE = '#FFFFFF';
const BORDER = '#EADFE5';
const TEXT = '#2A1C20';
const TEXT_MUTED = '#6B5B63';
const CHAT_BG = '#F6F2ED';
const REACTION_OPTIONS = ['❤️', '😂', '👍', '😮', '😢', '👏', '🔥', '🙏'];
const formatHora = (fechaStr) => {
  if (!fechaStr) return '';
  const date = new Date(fechaStr.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatFechaSeparador = (fechaStr) => {
  if (!fechaStr) return '';
  const date = new Date(fechaStr.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';

  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  const esMismoDia = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (esMismoDia(date, hoy)) return 'Hoy';
  if (esMismoDia(date, ayer)) return 'Ayer';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
};

const IconPhone = ({ size = 20, color = PRIMARY_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const IconVideo = ({ size = 20, color = PRIMARY_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="6" width="13" height="12" rx="2" />
    <Path d="m16 10 5-3v10l-5-3" />
  </Svg>
);

const IconSearchAction = ({ size = 18, color = PRIMARY_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="7" />
    <Path d="m20 20-3.5-3.5" />
  </Svg>
);

const IconDots = ({ size = 18, color = PRIMARY_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="5" cy="12" r="1.8" />
    <Circle cx="12" cy="12" r="1.8" />
    <Circle cx="19" cy="12" r="1.8" />
  </Svg>
);

const IconSend = ({ size = 20, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 2 11 13" />
    <Path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </Svg>
);

const IconPaperclip = ({ size = 18, color = PRIMARY_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m21.44 11.05-8.49 8.49a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.4a2 2 0 1 1-2.83-2.83l8.49-8.49" />
  </Svg>
);

const ATTACHMENT_ICONS = {
  document: ['#7F66FF', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 3.5L18.5 9H13V3.5zM8 13h8v2H8v-2zm0 4h8v2H8v-2zm0-8h3v2H8V9z'],
  media: ['#007BFC', 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'],
  camera: ['#FF2E74', 'M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z'],
  audio: ['#FF6900', 'M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1a7 7 0 0 1 14 0v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z'],
  contact: ['#00B2FF', 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'],
  poll: ['#FFB600', 'M4 6h16v2H4V6zm0 5h11v2H4v-2zm0 5h8v2H4v-2z'],
  event: ['#FF2473', 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z'],
  sticker: ['#00D775', 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h9l7-7V5c0-1.1-.9-2-2-2zm-6 16.5V14h5.5L13 19.5zM11 7h2v3h3v2h-3v3h-2v-3H8v-2h3V7z'],
};

const AttachmentIcon = ({ type }) => {
  const [color, path] = ATTACHMENT_ICONS[type];
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d={path} />
    </Svg>
  );
};

const IconSmile = ({ size = 18, color = PRIMARY_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <Path d="M9 9h.01M15 9h.01" />
  </Svg>
);

const EmojiGraphic = ({ emoji, size = 26 }) => {
  const [imageError, setImageError] = useState(false);
  const codePoints = [...emoji].map((character) => character.codePointAt(0));
  const isFlag = codePoints.length === 2 && codePoints.every((codePoint) => codePoint >= 0x1F1E6 && codePoint <= 0x1F1FF);

  if (imageError) return <Text style={{ fontSize: size }}>{emoji}</Text>;
  if (isFlag) {
    const countryCode = codePoints.map((codePoint) => String.fromCharCode(codePoint - 0x1F1E6 + 65)).join('').toLowerCase();
    return <Image source={{ uri: `https://flagcdn.com/w40/${countryCode}.png` }} style={{ width: Math.round(size * 1.15), height: Math.round(size * 0.8), borderRadius: 2 }} onError={() => setImageError(true)} />;
  }

  const fileName = codePoints.filter((codePoint) => codePoint !== 0xFE0F).map((codePoint) => codePoint.toString(16).padStart(4, '0')).join('-');
  return <SvgUri uri={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${fileName}.svg`} width={size} height={size} onError={() => setImageError(true)} />;
};

const IconMic = ({ size = 18, color = PRIMARY_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
  </Svg>
);

const IconPlay = ({ size = 18, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Polygon points="7,4 20,12 7,20" />
  </Svg>
);

const IconBack = ({ size = 22, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const IconReaction = ({ size = 18, color = PRIMARY_DARK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
  </Svg>
);

export default function Chat() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id_sala, nombre_tienda, nombre_comprador, telefono_contacto } = route.params || {};
  const { user } = useContext(AuthContext);
  const { conectado, suscribirseAMensajes, enviarPorSocket, marcarSalaLeidaLocal } = useChatSocket();

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarMenuHeader, setMostrarMenuHeader] = useState(false);
  const [mostrarBusquedaMensajes, setMostrarBusquedaMensajes] = useState(false);
  const [busquedaMensajes, setBusquedaMensajes] = useState('');
  const [mensajeEncontrado, setMensajeEncontrado] = useState(null);
  const [silenciado, setSilenciado] = useState(false);
  const [favorito, setFavorito] = useState(false);
  const [seleccionandoMensajes, setSeleccionandoMensajes] = useState(false);
  const [mensajesSeleccionados, setMensajesSeleccionados] = useState([]);
  const [mensajesTemporales, setMensajesTemporales] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [reacciones, setReacciones] = useState({});
  const [mensajeActivo, setMensajeActivo] = useState(null);
  const [mostrarReacciones, setMostrarReacciones] = useState(false);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [mostrarAdjuntos, setMostrarAdjuntos] = useState(false);
  const [pestanaMultimedia, setPestanaMultimedia] = useState('emojis');
  const [categoriaEmoji, setCategoriaEmoji] = useState('smileys');
  const [busquedaEmoji, setBusquedaEmoji] = useState('');
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [segundosGrabacion, setSegundosGrabacion] = useState(0);
  const [audioReproduciendo, setAudioReproduciendo] = useState(null);

  const flatListRef = useRef(null);
  const sectionListRef = useRef(null);
  const montadoRef = useRef(true);
  const recordingRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const soundRef = useRef(null);
  const emojiSections = EMOJI_CATEGORIES.map((categoria) => {
    const emojis = categoria.emojis.filter((emoji) => !busquedaEmoji.trim() || emoji.includes(busquedaEmoji.trim()));
    const filas = [];
    for (let index = 0; index < emojis.length; index += 8) filas.push(emojis.slice(index, index + 8));
    return { id: categoria.id, title: categoria.name, data: filas };
  }).filter((seccion) => seccion.data.length > 0);

  useEffect(() => {
    const termino = busquedaMensajes.trim().toLowerCase();
    if (!termino) {
      setMensajeEncontrado(null);
      return;
    }
    const indice = mensajes.findIndex((mensaje) => String(mensaje.mensaje || '').toLowerCase().includes(termino));
    if (indice < 0) {
      setMensajeEncontrado(null);
      return;
    }
    setMensajeEncontrado(mensajes[indice].id_mensaje);
    requestAnimationFrame(() => flatListRef.current?.scrollToIndex({ index: indice, animated: true, viewPosition: 0.45 }));
  }, [busquedaMensajes, mensajes]);

  const nombreContacto = user?.rol === 'vendedor'
    ? (nombre_comprador || 'Comprador')
    : (nombre_tienda || 'Tienda');

  useEffect(() => {
    navigation.setOptions({
      title: nombreContacto || 'Chat',
      headerStyle: { backgroundColor: '#7A1E3A' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { color: '#FFFFFF', fontWeight: '700' },
      headerShadowVisible: false,
      headerBackTitle: 'Atrás',
    });
  }, [navigation, nombreContacto]);

  useEffect(() => {
    montadoRef.current = true;
    AsyncStorage.multiGet([`chat_silenciado_${id_sala}`, `chat_favorito_${id_sala}`]).then(([silencio, favoritoGuardado]) => {
      if (!montadoRef.current) return;
      setSilenciado(silencio?.[1] === '1');
      setFavorito(favoritoGuardado?.[1] === '1');
    });
    AsyncStorage.getItem(`chat_reacciones_${id_sala}`).then((guardado) => {
      if (montadoRef.current && guardado) setReacciones(JSON.parse(guardado));
    });
    AsyncStorage.multiGet([`chat_temporales_${id_sala}`, `chat_bloqueado_${id_sala}`]).then(([temporales, bloqueadoGuardado]) => {
      if (!montadoRef.current) return;
      setMensajesTemporales(temporales?.[1] === '1');
      setBloqueado(bloqueadoGuardado?.[1] === '1');
    });
    return () => {
      montadoRef.current = false;
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(() => {});
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, [id_sala]);

  const cargarHistorial = useCallback(async () => {
    try {
      const { data } = await getChatHistory(id_sala);
      if (montadoRef.current) setMensajes(Array.isArray(data?.mensajes) ? data.mensajes : []);
    } catch (e) {
      console.error('Error cargando historial de chat:', e);
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  }, [id_sala]);

  const marcarLeida = useCallback(async () => {
    if (!id_sala) return;
    marcarSalaLeidaLocal(id_sala);
    try {
      await marcarSalaLeidaApi(id_sala);
    } catch (_) {
      // ignored
    }
  }, [id_sala, marcarSalaLeidaLocal]);

  useEffect(() => {
    if (!id_sala) return;

    cargarHistorial();
    marcarLeida();

    const desuscribirse = suscribirseAMensajes((data) => {
      if (!montadoRef.current) return;
      if (data?.tipo === 'nuevo_mensaje' && data.mensaje?.id_sala === id_sala) {
        setMensajes((prev) => {
          if (prev.some((m) => m.id_mensaje === data.mensaje.id_mensaje)) return prev;
          return [...prev, data.mensaje];
        });
        marcarLeida();
      } else if (data?.tipo === 'mensaje_enviado' && data.mensaje?.id_sala === id_sala) {
        setMensajes((prev) => {
          if (prev.some((m) => m.id_mensaje === data.mensaje.id_mensaje)) return prev;
          return [...prev, data.mensaje];
        });
      }
    });

    return desuscribirse;
  }, [id_sala, cargarHistorial, marcarLeida, suscribirseAMensajes]);

  const enviarMensaje = useCallback(() => {
    const contenido = texto.trim();
    if (!contenido || !id_sala) return;
    setTexto('');

    const enviado = enviarPorSocket(id_sala, contenido);
    if (!enviado) {
      enviarMensajeChat({ id_sala, mensaje: contenido })
        .then(() => cargarHistorial())
        .catch((e) => console.error('Error enviando mensaje (fallback REST):', e));
    }
  }, [texto, id_sala, enviarPorSocket, cargarHistorial]);

  const enviarPayloadREST = useCallback(async (payload) => {
    const { data } = await enviarMensajeChat({ id_sala, mensaje: payload });
    if (data?.data) {
      setMensajes((prev) => [...prev, data.data]);
    } else {
      await cargarHistorial();
    }
  }, [id_sala, cargarHistorial]);

  const iniciarGrabacionAudio = async () => {
    try {
      const permiso = await Audio.requestPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso de micrófono', 'Activa el micrófono para grabar una nota de voz.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const grabacion = new Audio.Recording();
      await grabacion.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await grabacion.startAsync();
      recordingRef.current = grabacion;
      setSegundosGrabacion(0);
      setGrabandoAudio(true);
      recordingTimerRef.current = setInterval(() => setSegundosGrabacion((prev) => prev + 1), 1000);
    } catch (e) {
      Alert.alert('No se pudo grabar', 'Verifica el permiso del micrófono e inténtalo de nuevo.');
    }
  };

  const detenerGrabacionAudio = async (enviar = true) => {
    if (!recordingRef.current) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const grabacion = recordingRef.current;
    recordingRef.current = null;
    setGrabandoAudio(false);
    const duracion = Math.max(segundosGrabacion, 1);
    setSegundosGrabacion(0);
    try {
      await grabacion.stopAndUnloadAsync();
      const uri = grabacion.getURI();
      if (!enviar || !uri) return;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      await enviarPayloadREST(`[AUDIO]${JSON.stringify({ duracion: `${Math.floor(duracion / 60)}:${String(duracion % 60).padStart(2, '0')}`, seg: duracion, url: `data:audio/mp4;base64,${base64}` })}`);
    } catch (e) {
      Alert.alert('No se pudo enviar el audio', 'Inténtalo de nuevo.');
    }
  };

  const adjuntarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso de galería', 'Activa el acceso a tus fotos para adjuntar una imagen.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
    });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const archivo = resultado.assets[0];
    const mime = archivo.mimeType || 'image/jpeg';
    const base64 = archivo.base64 || await FileSystem.readAsStringAsync(archivo.uri, { encoding: FileSystem.EncodingType.Base64 });
    await enviarPayloadREST(`[FILE]${JSON.stringify({ nombre: archivo.fileName || 'imagen.jpg', tipo: mime, url: `data:${mime};base64,${base64}` })}`);
  };

  const adjuntarDocumento = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const archivo = resultado.assets[0];
    const base64 = await FileSystem.readAsStringAsync(archivo.uri, { encoding: FileSystem.EncodingType.Base64 });
    await enviarPayloadREST(`[FILE]${JSON.stringify({ nombre: archivo.name, tipo: archivo.mimeType || 'application/octet-stream', url: `data:${archivo.mimeType || 'application/octet-stream'};base64,${base64}` })}`);
    setMostrarAdjuntos(false);
  };

  const adjuntarAudio = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const archivo = resultado.assets[0];
    const mime = archivo.mimeType || 'audio/mpeg';
    const base64 = await FileSystem.readAsStringAsync(archivo.uri, { encoding: FileSystem.EncodingType.Base64 });
    await enviarPayloadREST(`[AUDIO]${JSON.stringify({ duracion: 'Audio adjunto', url: `data:${mime};base64,${base64}` })}`);
    setMostrarAdjuntos(false);
  };

  const mostrarAvisoAdjunto = (titulo, mensaje) => {
    setMostrarAdjuntos(false);
    Alert.alert(titulo, mensaje);
  };

  const abrirCamara = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso de cámara', 'Activa el acceso a la cámara para tomar una foto.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const archivo = resultado.assets[0];
    const mime = archivo.mimeType || 'image/jpeg';
    const base64 = archivo.base64 || await FileSystem.readAsStringAsync(archivo.uri, { encoding: FileSystem.EncodingType.Base64 });
    await enviarPayloadREST(`[FILE]${JSON.stringify({ nombre: 'foto.jpg', tipo: mime, url: `data:${mime};base64,${base64}` })}`);
    setMostrarAdjuntos(false);
  };

  const enviarMultimedia = async (item, esSticker = false) => {
    const tipo = esSticker ? 'image/svg+xml' : 'image/gif';
    await enviarPayloadREST(`[FILE]${JSON.stringify({ nombre: item.title || item.label, tipo, url: item.url })}`);
    setMostrarEmojis(false);
  };

  const elegirReaccion = async (idMensaje, emoji) => {
    setReacciones((prev) => {
      const actuales = prev[idMensaje] || [];
      const siguiente = actuales.includes(emoji) ? actuales.filter((item) => item !== emoji) : [...actuales, emoji];
      const nuevoEstado = { ...prev, [idMensaje]: siguiente };
      AsyncStorage.setItem(`chat_reacciones_${id_sala}`, JSON.stringify(nuevoEstado));
      return nuevoEstado;
    });
    setMostrarReacciones(false);
    setMensajeActivo(null);
  };

  const abrirAccionesMensaje = (mensaje) => {
    if (seleccionandoMensajes) {
      setMensajesSeleccionados((prev) => prev.includes(mensaje.id_mensaje)
        ? prev.filter((id) => id !== mensaje.id_mensaje)
        : [...prev, mensaje.id_mensaje]);
      return;
    }
    setMensajeActivo(mensaje);
    setMostrarReacciones(false);
  };

  const reproducirAudio = async (mensaje) => {
    try {
      if (audioReproduciendo === mensaje.id_mensaje) {
        await soundRef.current?.pauseAsync();
        setAudioReproduciendo(null);
        return;
      }
      if (soundRef.current) await soundRef.current.unloadAsync();
      const datos = JSON.parse(mensaje.mensaje.replace('[AUDIO]', ''));
      const { sound } = await Audio.Sound.createAsync({ uri: datos.url }, { shouldPlay: true });
      soundRef.current = sound;
      setAudioReproduciendo(mensaje.id_mensaje);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setAudioReproduciendo(null);
      });
    } catch (e) {
      Alert.alert('Audio no disponible', 'No se pudo reproducir esta nota de voz.');
    }
  };

  const copiarMensaje = async () => {
    if (!mensajeActivo) return;
    await Clipboard.setStringAsync(mensajeActivo.mensaje?.startsWith('[AUDIO]') ? 'Nota de voz' : mensajeActivo.mensaje || '');
    setMensajeActivo(null);
  };

  const iniciarLlamada = async (video = false) => {
    if (!video && telefono_contacto) {
      await Linking.openURL(`tel:${telefono_contacto}`);
      return;
    }
    await Share.share({ message: `Invitación a ${video ? 'videollamada' : 'llamada'} de BookyHome con ${nombreContacto}. Sala: ${id_sala}` });
  };

  const renderItem = ({ item, index }) => {
    const esPropio = Number(item.id_remitente) === Number(user?.sub);
    const anterior = mensajes[index - 1];
    const mostrarFecha =
      !anterior ||
      formatFechaSeparador(anterior.enviado_en) !== formatFechaSeparador(item.enviado_en);
    const esAudio = String(item.mensaje || '').startsWith('[AUDIO]');
    const esArchivo = String(item.mensaje || '').startsWith('[FILE]');
    let datosEspeciales = null;
    if (esAudio || esArchivo) {
      try { datosEspeciales = JSON.parse(item.mensaje.replace(/^\[(AUDIO|FILE)\]/, '')); } catch (_) { datosEspeciales = null; }
    }

    return (
      <View>
        {mostrarFecha && (
          <View style={styles.fechaSeparador}>
            <Text style={styles.fechaSeparadorTexto}>{formatFechaSeparador(item.enviado_en)}</Text>
          </View>
        )}

          <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => abrirAccionesMensaje(item)}
          onPress={() => (esAudio ? reproducirAudio(item) : null)}
            style={[styles.burbuja, esPropio ? styles.burbujaPropia : styles.burbujaAjena, mensajeEncontrado === item.id_mensaje && styles.burbujaEncontrada, mensajesSeleccionados.includes(item.id_mensaje) && styles.burbujaSeleccionada]}
        >
          {!esPropio && <Text style={styles.nombreRemitente}>{item.nombre_remitente || nombreContacto}</Text>}
          {esAudio ? (
            <View style={styles.audioMensaje}>
              <View style={styles.audioPlayButton}>
                {audioReproduciendo === item.id_mensaje ? <Text style={styles.audioPauseText}>||</Text> : <IconPlay size={16} />}
              </View>
              <View style={styles.audioWaveFake}>
                {Array.from({ length: 18 }).map((_, indice) => <View key={indice} style={[styles.audioBar, indice < 8 && styles.audioBarActive, { height: 5 + ((indice * 7) % 14) }]} />)}
              </View>
              <Text style={esPropio ? styles.textoPropio : styles.textoAjeno}>{datosEspeciales?.duracion || '0:01'}</Text>
            </View>
          ) : esArchivo ? (
            <View style={styles.archivoMensaje}>
              {datosEspeciales?.tipo?.startsWith('image/') && datosEspeciales?.url ? <Image source={{ uri: datosEspeciales.url }} style={styles.imagenAdjunta} /> : null}
              <Text style={esPropio ? styles.textoPropio : styles.textoAjeno}>📎 {datosEspeciales?.nombre || 'Archivo adjunto'}</Text>
            </View>
          ) : (
            <Text style={esPropio ? styles.textoPropio : styles.textoAjeno}>{item.mensaje}</Text>
          )}
          <Text style={[styles.hora, esPropio ? styles.horaPropia : styles.horaAjena]}>{formatHora(item.enviado_en)}</Text>
          {reacciones[item.id_mensaje]?.length > 0 && <Text style={styles.reaccionesBadge}>{reacciones[item.id_mensaje].join(' ')}</Text>}
          <TouchableOpacity style={styles.reactionTrigger} onPress={() => abrirAccionesMensaje(item)} accessibilityLabel="Reaccionar al mensaje">
            <IconReaction size={16} color={esPropio ? '#FFD2DC' : PRIMARY_DARK} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  const inicial = (nombreContacto || 'T').charAt(0).toUpperCase();

  const toggleSilencio = async () => {
    const nuevoEstado = !silenciado;
    setSilenciado(nuevoEstado);
    await AsyncStorage.setItem(`chat_silenciado_${id_sala}`, nuevoEstado ? '1' : '0');
    setMostrarMenuHeader(false);
  };

  const toggleFavorito = async () => {
    const nuevoEstado = !favorito;
    setFavorito(nuevoEstado);
    await AsyncStorage.setItem(`chat_favorito_${id_sala}`, nuevoEstado ? '1' : '0');
    setMostrarMenuHeader(false);
  };

  const vaciarChatLocal = async () => {
    try {
      await vaciarSalaChat(id_sala);
      setMensajes([]);
      setMostrarMenuHeader(false);
    } catch (e) {
      Alert.alert('No se pudo vaciar', 'Inténtalo de nuevo.');
    }
  };

  const eliminarChatLocal = () => {
    Alert.alert('Eliminar chat', `¿Seguro que deseas eliminar la conversación con ${nombreContacto}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarSalaChat(id_sala);
            setMostrarMenuHeader(false);
            navigation.goBack();
          } catch (e) {
            Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
          }
        },
      },
    ]);
  };

  const exportarChat = () => {
    setMostrarMenuHeader(false);
    if (!mensajes.length) {
      Alert.alert('Sin mensajes', 'No hay mensajes para exportar.');
      return;
    }
    const contenido = mensajes.map((mensaje) => `[${mensaje.enviado_en || ''}] ${mensaje.mensaje || ''}`).join('\n');
    Share.share({
      title: `Chat de ${nombreContacto}`,
      message: contenido,
    });
  };

  const enviarEnlace = () => {
    setMostrarMenuHeader(false);
    Share.share({
      title: 'Enlace de videollamada',
      message: `Únete a la videollamada de BookyHome con ${nombreContacto}. Sala: ${id_sala}`,
    });
  };

  const denunciarChat = () => {
    setMostrarMenuHeader(false);
    Alert.alert('Reporte', `Se ha registrado el reporte de la conversación con ${nombreContacto}.`);
  };

  const bloquearChat = () => {
    setMostrarMenuHeader(false);
    Alert.alert('Bloquear contacto', `¿Seguro que deseas ${bloqueado ? 'desbloquear' : 'bloquear'} a ${nombreContacto}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        const nuevoEstado = !bloqueado;
        setBloqueado(nuevoEstado);
        await AsyncStorage.setItem(`chat_bloqueado_${id_sala}`, nuevoEstado ? '1' : '0');
      } },
    ]);
  };

  const alternarTemporales = async () => {
    const nuevoEstado = !mensajesTemporales;
    setMensajesTemporales(nuevoEstado);
    await AsyncStorage.setItem(`chat_temporales_${id_sala}`, nuevoEstado ? '1' : '0');
    setMostrarMenuHeader(false);
  };

  const anadirALaLista = async () => {
    await AsyncStorage.setItem(`chat_lista_${id_sala}`, '1');
    setMostrarMenuHeader(false);
    Alert.alert('Añadir a la lista', 'La conversación se añadió a tu lista.');
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {!conectado && (
        <View style={styles.bannerDesconectado}>
          <Text style={styles.textoBanner}>Reconectando...</Text>
        </View>
      )}

      <View style={styles.headerChat}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Volver a mensajes">
          <IconBack size={22} color={PRIMARY_DARK} />
        </TouchableOpacity>
        <View style={styles.avatarHeader}>
          <Text style={styles.avatarHeaderText}>{inicial}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerNombre}>{nombreContacto}</Text>
          <Text style={styles.headerEstado}>en línea</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => iniciarLlamada(true)}>
            <IconVideo size={18} color={PRIMARY_DARK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => iniciarLlamada(false)}>
            <IconPhone size={18} color={PRIMARY_DARK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => setMostrarBusquedaMensajes((prev) => !prev)}>
            <IconSearchAction size={18} color={PRIMARY_DARK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => setMostrarMenuHeader((prev) => !prev)}>
            <IconDots size={18} color={PRIMARY_DARK} />
          </TouchableOpacity>
        </View>
      </View>

      {mostrarBusquedaMensajes && (
        <View style={styles.searchInline}>
          <IconSearchAction size={16} color={PRIMARY_DARK} />
          <TextInput
            value={busquedaMensajes}
            onChangeText={setBusquedaMensajes}
            style={styles.searchInputInline}
            placeholder="Buscar en esta conversación..."
            placeholderTextColor={TEXT_MUTED}
          />
          {busquedaMensajes.trim() && <Text style={styles.searchResultText}>{mensajeEncontrado ? 'Encontrado' : 'Sin resultados'}</Text>}
        </View>
      )}

      {mostrarMenuHeader && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Info del contacto', `Contacto: ${nombreContacto}`)}>
            <Text style={styles.menuItemText}>Info. del contacto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => {
            setSeleccionandoMensajes((prev) => !prev);
            setMensajesSeleccionados([]);
            setMostrarMenuHeader(false);
          }}>
            <Text style={styles.menuItemText}>{seleccionandoMensajes ? 'Salir de selección' : 'Seleccionar mensajes'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={toggleSilencio}>
            <Text style={styles.menuItemText}>{silenciado ? 'Desactivar silencio' : 'Silenciar notificaciones'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={alternarTemporales}>
            <Text style={styles.menuItemText}>{mensajesTemporales ? 'Desactivar mensajes temporales' : 'Mensajes temporales'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={toggleFavorito}>
            <Text style={styles.menuItemText}>{favorito ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={anadirALaLista}>
            <Text style={styles.menuItemText}>Añadir a la lista</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={exportarChat}>
            <Text style={styles.menuItemText}>Exportar chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={enviarEnlace}>
            <Text style={styles.menuItemText}>Enviar enlace de llamada</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={denunciarChat}>
            <Text style={[styles.menuItemText, styles.warningText]}>Reportar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={bloquearChat}>
            <Text style={[styles.menuItemText, styles.warningText]}>Bloquear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={vaciarChatLocal}>
            <Text style={[styles.menuItemText, styles.warningText]}>Vaciar chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={eliminarChatLocal}>
            <Text style={[styles.menuItemText, styles.dangerText]}>Eliminar chat</Text>
          </TouchableOpacity>
        </View>
      )}


      <FlatList
        ref={flatListRef}
        data={mensajes}
        keyExtractor={(item) => String(item.id_mensaje || `${item.enviado_en}-${Math.random()}`)}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onScrollToIndexFailed={({ index }) => setTimeout(() => flatListRef.current?.scrollToIndex({ index, animated: true }), 100)}
      />

      <Modal visible={Boolean(mensajeActivo)} transparent animationType="fade" onRequestClose={() => setMensajeActivo(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setMensajeActivo(null)}>
          <View style={styles.messageActions}>
            <Text style={styles.messageActionsTitle}>Reaccionar</Text>
            <View style={styles.reactionRow}>
              {REACTION_OPTIONS.map((emoji) => (
                <TouchableOpacity key={emoji} style={styles.reactionButton} onPress={() => elegirReaccion(mensajeActivo?.id_mensaje, emoji)}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.messageActionItem} onPress={copiarMensaje}><Text style={styles.menuItemText}>Copiar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.messageActionItem} onPress={() => { setTexto(mensajeActivo?.mensaje || ''); setMensajeActivo(null); }}><Text style={styles.menuItemText}>Responder</Text></TouchableOpacity>
            <TouchableOpacity style={styles.messageActionItem} onPress={() => { setMostrarReacciones(true); }}><Text style={styles.menuItemText}>Más reacciones</Text></TouchableOpacity>
            {Number(mensajeActivo?.id_remitente) === Number(user?.sub) && <TouchableOpacity style={styles.messageActionItem} onPress={() => { setMensajes((prev) => prev.filter((mensaje) => mensaje.id_mensaje !== mensajeActivo.id_mensaje)); setMensajeActivo(null); }}><Text style={styles.dangerText}>Eliminar para mí</Text></TouchableOpacity>}
          </View>
        </TouchableOpacity>
      </Modal>

      {mostrarReacciones && mensajeActivo && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setMostrarReacciones(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.reactionPanel}>
              <Text style={styles.messageActionsTitle}>Elige una reacción</Text>
              <View style={styles.reactionGrid}>
                {['😀', '😃', '😄', '😁', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤔', '😮', '😢', '😡', '👍', '👏', '🙏', '🔥', '🎉', '❤️', '💯'].map((emoji) => (
                  <TouchableOpacity key={emoji} style={styles.reactionLargeButton} onPress={() => elegirReaccion(mensajeActivo.id_mensaje, emoji)}><Text style={styles.reactionEmoji}>{emoji}</Text></TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => { setMostrarReacciones(false); setMensajeActivo(null); }}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.inputContenedor}>
        <TouchableOpacity style={styles.inputIconBtn} activeOpacity={0.7} onPress={() => setMostrarAdjuntos((prev) => !prev)}>
          <IconPaperclip size={18} color={PRIMARY_DARK} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputIconBtn} activeOpacity={0.7} onPress={() => setMostrarEmojis(true)}>
          <IconSmile size={18} color={PRIMARY_DARK} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe un mensaje"
          placeholderTextColor={TEXT_MUTED}
          multiline
          maxLength={500}
        />

        {texto.trim() ? (
          <TouchableOpacity style={styles.botonEnviar} onPress={enviarMensaje} activeOpacity={0.8}>
            <IconSend size={18} color={WHITE} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.botonEnviar, grabandoAudio && styles.botonGrabando]} onPressIn={iniciarGrabacionAudio} onPressOut={() => detenerGrabacionAudio(true)} activeOpacity={0.8}>
            <IconMic size={18} color={WHITE} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={mostrarEmojis} transparent animationType="slide" onRequestClose={() => setMostrarEmojis(false)}>
        <TouchableOpacity style={styles.emojiBackdrop} activeOpacity={1} onPress={() => setMostrarEmojis(false)}>
          <View style={styles.emojiPicker}>
            {pestanaMultimedia === 'emojis' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiCategoryTabs}>
                {EMOJI_CATEGORIES.map((categoria) => (
                  <TouchableOpacity
                    key={categoria.id}
                    style={[styles.emojiCategoryTab, categoriaEmoji === categoria.id && styles.emojiCategoryTabActive]}
                    onPress={() => {
                      setPestanaMultimedia('emojis');
                      setCategoriaEmoji(categoria.id);
                      setBusquedaEmoji('');
                      requestAnimationFrame(() => sectionListRef.current?.scrollToLocation({ sectionIndex: EMOJI_CATEGORIES.findIndex((item) => item.id === categoria.id), itemIndex: 0, animated: true, viewPosition: 0 }));
                    }}
                    accessibilityLabel={categoria.name}
                  >
                    <EmojiGraphic emoji={categoria.icon} size={20} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={styles.emojiSearchBox}>
              <IconSearchAction size={16} color="#9BA6AE" />
              <TextInput value={busquedaEmoji} onChangeText={setBusquedaEmoji} placeholder={pestanaMultimedia === 'emojis' ? 'Buscar emoji' : pestanaMultimedia === 'gifs' ? 'Buscar GIF...' : 'Buscar sticker...'} placeholderTextColor="#9BA6AE" style={styles.emojiSearchInput} />
            </View>
            {pestanaMultimedia === 'emojis' && (
              <SectionList
                ref={sectionListRef}
                sections={emojiSections}
                keyExtractor={(fila) => fila.join('-')}
                renderSectionHeader={({ section }) => <Text style={styles.emojiSectionTitle}>{section.title}</Text>}
                renderItem={({ item: fila }) => (
                  <View style={styles.emojiGridRow}>
                    {fila.map((emoji, index) => (
                      <TouchableOpacity key={`${emoji}-${index}`} style={styles.emojiButton} onPress={() => setTexto((prev) => `${prev}${emoji}`)}>
                        <EmojiGraphic emoji={emoji} size={26} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                contentContainerStyle={styles.emojiGrid}
                stickySectionHeadersEnabled={false}
              />
            )}
            {pestanaMultimedia === 'gifs' && <FlatList data={GIF_OPTIONS.filter((item) => !busquedaEmoji.trim() || item.title.toLowerCase().includes(busquedaEmoji.toLowerCase()))} keyExtractor={(item) => item.id} numColumns={2} contentContainerStyle={styles.mediaGrid} renderItem={({ item }) => <TouchableOpacity style={styles.gifCard} onPress={() => enviarMultimedia(item)}><Image source={{ uri: item.url }} style={styles.gifImage} /><Text style={styles.mediaLabel}>{item.title}</Text></TouchableOpacity>} />}
            {pestanaMultimedia === 'stickers' && <FlatList data={STICKER_OPTIONS.filter((item) => !busquedaEmoji.trim() || item.label.toLowerCase().includes(busquedaEmoji.toLowerCase()))} keyExtractor={(item) => item.id} numColumns={4} contentContainerStyle={styles.mediaGrid} renderItem={({ item }) => <TouchableOpacity style={styles.stickerCard} onPress={() => enviarMultimedia(item, true)}><EmojiGraphic emoji={item.emoji} size={46} /><Text style={styles.mediaLabel}>{item.label}</Text></TouchableOpacity>} />}
            <View style={styles.emojiPickerFooter}>
              <TouchableOpacity style={[styles.footerTab, pestanaMultimedia === 'emojis' && styles.footerTabActive]} onPress={() => setPestanaMultimedia('emojis')} accessibilityLabel="Emojis"><IconSmile size={18} color={pestanaMultimedia === 'emojis' ? PRIMARY : '#8696A0'} /></TouchableOpacity>
              <TouchableOpacity style={[styles.footerTab, pestanaMultimedia === 'gifs' && styles.footerTabActive]} onPress={() => setPestanaMultimedia('gifs')}><Text style={styles.footerTabText}>GIF</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.footerTab, pestanaMultimedia === 'stickers' && styles.footerTabActive]} onPress={() => setPestanaMultimedia('stickers')} accessibilityLabel="Stickers">
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={pestanaMultimedia === 'stickers' ? PRIMARY : '#8696A0'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 3h9l5 5v12H5z" />
                  <Path d="M14 3v5h5" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={mostrarAdjuntos} transparent animationType="fade" onRequestClose={() => setMostrarAdjuntos(false)}>
        <TouchableOpacity style={styles.attachmentBackdrop} activeOpacity={1} onPress={() => setMostrarAdjuntos(false)}>
          <LinearGradient
            colors={['#3A0D1A', '#290812']}
            style={styles.attachmentMenu}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity style={styles.attachmentOption} onPress={() => { setMostrarAdjuntos(false); adjuntarDocumento(); }}>
              <AttachmentIcon type="document" /><Text style={styles.attachmentLabel}>Documento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={() => { setMostrarAdjuntos(false); adjuntarImagen(); }}>
              <AttachmentIcon type="media" /><Text style={styles.attachmentLabel}>Fotos y videos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={() => { setMostrarAdjuntos(false); abrirCamara(); }}>
              <AttachmentIcon type="camera" /><Text style={styles.attachmentLabel}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={() => { setMostrarAdjuntos(false); adjuntarAudio(); }}>
              <AttachmentIcon type="audio" /><Text style={styles.attachmentLabel}>Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={() => mostrarAvisoAdjunto('Contacto', 'Tarjeta de contacto compartida.')}>
              <AttachmentIcon type="contact" /><Text style={styles.attachmentLabel}>Contacto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={() => mostrarAvisoAdjunto('Encuesta', 'Crear encuesta en el chat.')}>
              <AttachmentIcon type="poll" /><Text style={styles.attachmentLabel}>Encuesta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={() => mostrarAvisoAdjunto('Evento', 'Crear evento en calendario.')}>
              <AttachmentIcon type="event" /><Text style={styles.attachmentLabel}>Evento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={() => { setMostrarAdjuntos(false); adjuntarImagen(); }}>
              <AttachmentIcon type="sticker" /><Text style={styles.attachmentLabel}>Nuevo sticker</Text>
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: CHAT_BG },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CHAT_BG },
  bannerDesconectado: {
    backgroundColor: '#F8E7EC',
    padding: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EADFE5',
  },
  textoBanner: { color: '#4E1022', fontSize: 12, fontWeight: '600' },
  searchInline: {
    backgroundColor: '#F4F0EC',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E3DCD6',
  },
  searchInputInline: {
    flex: 1,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E7D9DC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#2A1C20',
  },
  searchResultText: { color: PRIMARY, fontSize: 11, fontWeight: '700' },
  headerChat: {
    backgroundColor: '#F4F0EC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3DCD6',
  },
  backButton: {
    width: 34,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  avatarHeader: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarHeaderText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  headerNombre: {
    color: PRIMARY_DARK,
    fontSize: 17,
    fontWeight: '700',
  },
  headerEstado: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 66,
    right: 12,
    width: 255,
    maxHeight: 480,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: 'rgba(84, 18, 35, 0.12)',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#541223',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 200,
  },
  menuItem: {
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  menuItemText: {
    color: '#2A1C20',
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    color: '#7A1E3A',
  },
  dangerText: {
    color: '#B42318',
  },
  audioMensaje: {
    minWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPauseText: { color: WHITE, fontWeight: '800', fontSize: 12 },
  audioWaveFake: { flex: 1, height: 28, flexDirection: 'row', alignItems: 'center', gap: 2 },
  audioBar: { width: 3, borderRadius: 2, backgroundColor: '#D7B7C2' },
  audioBarActive: { backgroundColor: PRIMARY },
  archivoMensaje: { gap: 6 },
  imagenAdjunta: { width: 210, height: 150, borderRadius: 10, backgroundColor: '#EADFE5' },
  reaccionesBadge: { marginTop: 5, fontSize: 15 },
  reactionTrigger: { position: 'absolute', right: -22, bottom: 2, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  burbujaEncontrada: { borderColor: '#D99A2B', borderWidth: 2 },
  burbujaSeleccionada: { borderColor: '#2E7D32', borderWidth: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(27, 12, 18, 0.38)', justifyContent: 'center', alignItems: 'center' },
  messageActions: { width: '88%', maxWidth: 360, backgroundColor: WHITE, borderRadius: 14, padding: 14, shadowColor: '#541223', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  messageActionsTitle: { color: PRIMARY_DARK, fontWeight: '700', fontSize: 16, marginBottom: 10 },
  reactionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reactionButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  reactionEmoji: { fontSize: 24 },
  messageActionItem: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0E7E9' },
  reactionPanel: { width: '92%', maxWidth: 380, backgroundColor: WHITE, borderRadius: 16, padding: 18 },
  reactionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  reactionLargeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: PRIMARY, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  botonGrabando: { backgroundColor: '#B42318' },
  emojiBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.48)', justifyContent: 'flex-end', paddingHorizontal: 10, paddingBottom: 10 },
  emojiPicker: { width: '100%', maxWidth: 420, height: '62%', maxHeight: 460, alignSelf: 'center', backgroundColor: '#111B21', borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, overflow: 'hidden' },
  emojiCategoryTabs: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)', paddingHorizontal: 2, paddingTop: 5 },
  emojiCategoryTab: { width: 40, height: 38, alignItems: 'center', justifyContent: 'center', opacity: 0.62 },
  emojiCategoryTabActive: { borderBottomWidth: 2.5, borderBottomColor: PRIMARY, opacity: 1 },
  emojiSearchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111B21', borderColor: PRIMARY, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 12, marginTop: 10, marginBottom: 6 },
  emojiSearchInput: { flex: 1, color: '#E9EDEF', paddingVertical: 8, fontSize: 13 },
  emojiGrid: { paddingHorizontal: 2, paddingBottom: 8 },
  emojiSectionTitle: { color: '#8696A0', fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  emojiGridRow: { flexDirection: 'row' },
  emojiButton: { width: '12.5%', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  mediaGrid: { paddingBottom: 8, gap: 8 },
  gifCard: { flex: 1, margin: 4, backgroundColor: '#202C33', borderRadius: 8, overflow: 'hidden' },
  gifImage: { width: '100%', height: 82 },
  stickerCard: { width: '25%', alignItems: 'center', padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 10 },
  mediaLabel: { color: '#8696A0', fontSize: 11, textAlign: 'center', padding: 5 },
  emojiPickerFooter: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#202C33', borderRadius: 20, padding: 3, gap: 4, marginVertical: 8 },
  footerTab: { width: 44, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  footerTabActive: { backgroundColor: 'rgba(255, 255, 255, 0.14)' },
  footerTabText: { color: '#8696A0', fontWeight: '800', fontSize: 13 },
  attachmentBackdrop: { flex: 1, backgroundColor: 'rgba(27, 12, 18, 0.08)', justifyContent: 'flex-end', alignItems: 'flex-start', paddingLeft: 18, paddingBottom: 56 },
  attachmentMenu: { width: 205, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(220, 150, 170, 0.2)', shadowColor: '#290812', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  attachmentOption: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  attachmentLabel: { color: '#F8EDF1', fontSize: 14, fontWeight: '500' },
  lista: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
    backgroundColor: CHAT_BG,
  },
  fechaSeparador: {
    alignSelf: 'center',
    backgroundColor: '#EEE2E5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginVertical: 10,
  },
  fechaSeparadorTexto: {
    fontSize: 11,
    color: PRIMARY_DARK,
    fontWeight: '700',
  },
  burbuja: {
    maxWidth: '78%',
    marginVertical: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  burbujaPropia: {
    alignSelf: 'flex-end',
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
    borderBottomRightRadius: 8,
  },
  burbujaAjena: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4F1F0',
    borderColor: '#E9DCE1',
    borderBottomLeftRadius: 8,
  },
  nombreRemitente: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },
  textoPropio: {
    fontSize: 15,
    color: WHITE,
    lineHeight: 20,
  },
  textoAjeno: {
    fontSize: 15,
    color: TEXT,
    lineHeight: 20,
  },
  hora: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  horaPropia: {
    color: 'rgba(255,255,255,0.75)',
  },
  horaAjena: {
    color: '#7E676D',
  },
  inputContenedor: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2EEE9',
    borderTopWidth: 1,
    borderTopColor: '#D9D0CA',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  inputIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: '#E3D6DA',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#2A1C20',
    fontSize: 15,
  },
  botonEnviar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
});
