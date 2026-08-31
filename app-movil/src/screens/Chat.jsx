import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Modal, ScrollView,
  Clipboard, Alert, Pressable,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useChatSocket } from '../context/ChatSocketContext';
import { getChatHistory, marcarSalaLeida as marcarSalaLeidaApi, enviarMensajeChat } from '../services/api';
import { IconSearch, IconAlertTriangle } from '../components/Icons';
import Svg, { Circle, Polyline, Path } from 'react-native-svg';

// ── Paleta BookyHome ──────────────────────────────────────────────────────────
const PRIMARY   = '#7A1E3A';
const BG_CHAT   = '#FAF8F5';
const WHITE     = '#FFFFFF';
const BORDER    = '#E5DED3';
const TEXT      = '#1A1A1A';
const MUTED     = '#8A8A8A';

// Tema de burbujas BookyHome (igual que la web: tema "bookyhome")
const BUBBLE_OWN_BG    = '#541223';
const BUBBLE_OWN_TEXT  = '#FFFFFF';
const BUBBLE_OTHER_BG  = '#FCE8EE';
const BUBBLE_OTHER_TEXT= '#3B0B1A';

// ── Checkmarks estilo WhatsApp (igual que la web) ─────────────────────────────
function MessageCheckmark({ msg }) {
  if (msg.pendiente) {
    // Relojito
    return (
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none"
        stroke="rgba(255,255,255,0.7)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Polyline points="12 6 12 12 16 14" />
      </Svg>
    );
  }
  const esLeido = msg.mensaje_leido === true || msg.mensaje_leido === 1 || msg.mensaje_leido === '1';
  const esEntregado = msg.entregado === true || msg.entregado === 1 || msg.entregado === '1';
  const color = esLeido ? '#FFB3C8' : 'rgba(255,255,255,0.65)';

  if (esLeido || esEntregado) {
    // Dos tics
    return (
      <Svg width={16} height={11} viewBox="0 0 16 11" fill="none">
        <Path d="M1 5.5L5 9.5L11 1.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M5 5.5L9 9.5L15 1.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  // Un tic
  return (
    <Svg width={13} height={11} viewBox="0 0 16 11" fill="none">
      <Path d="M1 5.5L5 9.5L13 1.5" stroke="rgba(255,255,255,0.65)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Emojis rápidos de reacción (igual que la web) ─────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#7A1E3A','#1e4d8a','#1e7a45','#7a5c00','#5a1e7a','#1e6a7a','#8a1e1e'];
const avatarColor = (n = '') => AVATAR_COLORS[(n.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const getIniciales = (n = '') =>
  n.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');

const formatHora = (fechaStr) => {
  if (!fechaStr) return '';
  const d = new Date(fechaStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatSeparador = (fechaStr) => {
  if (!fechaStr) return '';
  const d    = new Date(fechaStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  const hoy  = new Date();
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (same(d, hoy))  return 'Hoy';
  if (same(d, ayer)) return 'Ayer';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function Chat() {
  const route      = useRoute();
  const navigation = useNavigation();
  const { id_sala, nombre_tienda, nombre_comprador } = route.params;
  const { user } = useContext(AuthContext);
  const { conectado, suscribirseAMensajes, enviarPorSocket, marcarSalaLeidaLocal } = useChatSocket();

  // ── Estado principal ──────────────────────────────────────────────────────
  const [mensajes,  setMensajes]  = useState([]);
  const [texto,     setTexto]     = useState('');
  const [cargando,  setCargando]  = useState(true);

  // Responder
  const [respondiendoA, setRespondiendoA] = useState(null);

  // Destacados y fijados (persistencia local)
  const [destacados, setDestacados] = useState([]);
  const [fijados,    setFijados]    = useState([]);

  // Reacciones locales { [id_mensaje]: [emoji, ...] }
  const [reacciones, setReacciones] = useState({});

  // Menú contextual de mensaje
  const [menuMsg, setMenuMsg] = useState({ visible: false, msg: null });
  const [barReacciones, setBarReacciones] = useState({ visible: false, msg: null });

  // Búsqueda inline
  const [busquedaVisible, setBusquedaVisible] = useState(false);
  const [busquedaTerm, setBusquedaTerm] = useState('');

  // Picker de emojis básico
  const [emojiVisible, setEmojiVisible] = useState(false);
  const EMOJIS_BASICOS = ['😀','😂','😍','🥺','😎','🤔','👍','❤️','🔥','🎉','👏','🙏','😭','🤣','😊','😘','🥳','😅','🤩','😤','😡','💪','🎯','✨','💯','🫂','👀','🤝','😴','🤯'];

  const flatListRef = useRef(null);
  const montadoRef  = useRef(true);

  const esVendedor  = user?.rol === 'vendedor';
  const nombreChat  = esVendedor ? (nombre_comprador || 'Comprador') : (nombre_tienda || 'Tienda');
  const iniciales   = getIniciales(nombreChat);
  const bgAvatar    = avatarColor(nombreChat);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // ── Historial ─────────────────────────────────────────────────────────────
  const cargarHistorial = useCallback(async () => {
    try {
      const { data } = await getChatHistory(id_sala);
      if (montadoRef.current) setMensajes(data.mensajes || []);
    } catch (e) {
      console.error('Error historial:', e);
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  }, [id_sala]);

  const marcarLeida = useCallback(async () => {
    marcarSalaLeidaLocal(id_sala);
    try { await marcarSalaLeidaApi(id_sala); } catch {}
  }, [id_sala, marcarSalaLeidaLocal]);

  useEffect(() => {
    cargarHistorial();
    marcarLeida();
    const desuscribir = suscribirseAMensajes((data) => {
      if (!montadoRef.current) return;
      if (data.tipo === 'nuevo_mensaje' && data.mensaje.id_sala === id_sala) {
        setMensajes(prev => {
          const idx = prev.findIndex(m => m.pendiente && m.mensaje === data.mensaje.mensaje);
          if (idx !== -1) {
            const copia = [...prev]; copia[idx] = data.mensaje; return copia;
          }
          if (prev.some(m => m.id_mensaje === data.mensaje.id_mensaje)) return prev;
          return [...prev, data.mensaje];
        });
        marcarLeida();
      } else if (data.tipo === 'mensaje_enviado' && data.mensaje.id_sala === id_sala) {
        setMensajes(prev => {
          const idx = prev.findIndex(m => m.pendiente && m.mensaje === data.mensaje.mensaje);
          if (idx !== -1) {
            const copia = [...prev]; copia[idx] = data.mensaje; return copia;
          }
          if (prev.some(m => m.id_mensaje === data.mensaje.id_mensaje)) return prev;
          return [...prev, data.mensaje];
        });
      } else if (data.tipo === 'mensaje_entregado') {
        setMensajes(prev => prev.map(m =>
          m.id_mensaje === data.id_mensaje ? { ...m, entregado: true } : m
        ));
      } else if (data.tipo === 'mensajes_leidos' && data.id_sala === id_sala) {
        setMensajes(prev => prev.map(m => ({ ...m, mensaje_leido: true, entregado: true })));
      }
    });
    return desuscribir;
  }, [id_sala, cargarHistorial, marcarLeida, suscribirseAMensajes]);

  // ── Enviar mensaje con estado temporal (pendiente) ────────────────────────
  const enviar = useCallback(() => {
    let contenido = texto.trim();
    if (!contenido) return;

    // Quote si se está respondiendo
    if (respondiendoA) {
      const remitente = respondiendoA.nombre_remitente || 'Usuario';
      const resumen = respondiendoA.mensaje.slice(0, 60);
      contenido = `┌── 💬 ${remitente}: "${resumen}"\n└── ${contenido}`;
      setRespondiendoA(null);
    }

    setTexto('');
    setEmojiVisible(false);

    // Mensaje temporal optimista
    const tempId = 'temp_' + Date.now();
    const tempMsg = {
      id_mensaje: tempId,
      id_sala,
      id_remitente: Number(user?.sub),
      nombre_remitente: user?.nombre || 'Yo',
      mensaje: contenido,
      enviado_en: new Date().toISOString().replace('T', ' ').slice(0, 19),
      mensaje_leido: false,
      entregado: false,
      pendiente: true,
    };
    setMensajes(prev => [...prev, tempMsg]);

    const enviado = enviarPorSocket(id_sala, contenido);
    if (!enviado) {
      enviarMensajeChat({ id_sala, mensaje: contenido })
        .then(res => {
          setMensajes(prev => prev.map(m =>
            m.id_mensaje === tempId
              ? res?.data ? res.data : { ...m, pendiente: false }
              : m
          ));
        })
        .catch(() => {
          setMensajes(prev => prev.map(m =>
            m.id_mensaje === tempId ? { ...m, pendiente: false } : m
          ));
        });
    }
  }, [texto, id_sala, user, enviarPorSocket, respondiendoA]);

  // ── Acciones de mensaje ───────────────────────────────────────────────────
  const copiarMensaje = (msg) => {
    Clipboard.setString(msg.mensaje);
    setMenuMsg({ visible: false, msg: null });
  };

  const responderMensaje = (msg) => {
    setRespondiendoA(msg);
    setMenuMsg({ visible: false, msg: null });
  };

  const destacarMensaje = (idMsg) => {
    setDestacados(prev =>
      prev.includes(idMsg) ? prev.filter(id => id !== idMsg) : [...prev, idMsg]
    );
    setMenuMsg({ visible: false, msg: null });
  };

  const fijarMensaje = (idMsg) => {
    setFijados(prev =>
      prev.includes(idMsg) ? prev.filter(id => id !== idMsg) : [...prev, idMsg]
    );
    setMenuMsg({ visible: false, msg: null });
  };

  const eliminarMensajeLocal = (idMsg) => {
    setMensajes(prev => prev.filter(m => m.id_mensaje !== idMsg));
    setMenuMsg({ visible: false, msg: null });
  };

  const reaccionar = (idMsg, emoji) => {
    setReacciones(prev => {
      const curr = prev[idMsg] || [];
      return {
        ...prev,
        [idMsg]: curr.includes(emoji) ? curr.filter(e => e !== emoji) : [...curr, emoji],
      };
    });
    setBarReacciones({ visible: false, msg: null });
    setMenuMsg({ visible: false, msg: null });
  };

  // ── Mensajes filtrados por búsqueda ───────────────────────────────────────
  const mensajesFiltrados = busquedaTerm.trim()
    ? mensajes.filter(m => m.mensaje?.toLowerCase().includes(busquedaTerm.toLowerCase()))
    : mensajes;

  // ── Render burbuja ────────────────────────────────────────────────────────
  const renderItem = ({ item, index }) => {
    const esPropio    = Number(item.id_remitente) === Number(user?.sub);
    const anterior    = mensajes[index - 1];
    const mostrarFecha = !anterior ||
      formatSeparador(anterior.enviado_en) !== formatSeparador(item.enviado_en);
    const mostrarNombre = !esPropio && (
      !anterior || anterior.id_remitente !== item.id_remitente || mostrarFecha
    );
    const bgAv  = avatarColor(item.nombre_remitente || '');
    const inits = getIniciales(item.nombre_remitente || '');
    const estaDestacado = destacados.includes(item.id_mensaje);
    const estaFijado    = fijados.includes(item.id_mensaje);
    const reacsMensaje  = reacciones[item.id_mensaje] || [];

    // Si hay búsqueda activa y no coincide, atenuar
    const noCoincide = busquedaTerm.trim() &&
      !item.mensaje?.toLowerCase().includes(busquedaTerm.toLowerCase());

    return (
      <View style={{ opacity: noCoincide ? 0.3 : 1 }}>
        {mostrarFecha && (
          <View style={s.fechaSep}>
            <Text style={s.fechaSepText}>{formatSeparador(item.enviado_en)}</Text>
          </View>
        )}

        <Pressable
          onLongPress={() => setMenuMsg({ visible: true, msg: item })}
          delayLongPress={400}
          style={[s.msgRow, esPropio ? s.msgRowOwn : s.msgRowOther]}
        >
          {/* Avatar del otro */}
          {!esPropio && (
            <View style={[s.msgAvatar, { backgroundColor: bgAv }]}>
              <Text style={s.msgAvatarText}>{inits}</Text>
            </View>
          )}

          <View style={[
            s.bubble,
            esPropio ? s.bubbleOwn : s.bubbleOther,
            estaDestacado && s.bubbleDestacado,
          ]}>
            {/* Indicadores de estado en la esquina */}
            {estaDestacado && <Text style={[s.bubbleIcon, { right: 28 }]}>⭐</Text>}
            {estaFijado    && <Text style={[s.bubbleIcon, { right: 8 }]}>📌</Text>}

            {/* Quote (respuesta a) */}
            {item.mensaje?.startsWith('┌──') && (
              <View style={[s.quoteBar, esPropio ? s.quoteBarOwn : s.quoteBarOther]}>
                <Text style={[s.quoteText, esPropio ? { color: 'rgba(255,255,255,0.75)' } : { color: '#7A1E3A' }]}
                  numberOfLines={2}>
                  {item.mensaje.split('\n')[0].replace('┌── ', '')}
                </Text>
              </View>
            )}

            {/* Nombre remitente */}
            {mostrarNombre && (
              <Text style={[s.bubbleNombre, { color: bgAv }]}>
                {item.nombre_remitente}
              </Text>
            )}

            {/* Texto del mensaje */}
            <Text style={esPropio ? s.bubbleTextOwn : s.bubbleTextOther}>
              {item.mensaje?.startsWith('┌──')
                ? item.mensaje.split('\n').slice(1).join('\n').replace('└── ', '')
                : item.mensaje}
            </Text>

            {/* Meta: hora + checkmarks */}
            <View style={s.bubbleMeta}>
              <Text style={[s.bubbleHora, esPropio && { color: 'rgba(255,255,255,0.65)' }]}>
                {formatHora(item.enviado_en)}
              </Text>
              {esPropio && <MessageCheckmark msg={item} />}
            </View>
          </View>

          {/* Botón de reacción rápida (al lado de la burbuja) */}
          <TouchableOpacity
            style={[s.reaccionBtn, esPropio ? s.reaccionBtnOwn : s.reaccionBtnOther]}
            onPress={() => setBarReacciones({ visible: true, msg: item })}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14 }}>😊</Text>
          </TouchableOpacity>

          {!esPropio && <View style={{ width: 36 }} />}
        </Pressable>

        {/* Reacciones debajo de la burbuja */}
        {reacsMensaje.length > 0 && (
          <View style={[s.reacsBadge, esPropio ? s.reacsBadgeOwn : s.reacsBadgeOther]}>
            {reacsMensaje.map((e, i) => (
              <Text key={i} style={{ fontSize: 14 }}>{e}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={s.loadingText}>Cargando mensajes…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <View style={[s.headerAvatar, { backgroundColor: bgAvatar }]}>
          <Text style={s.headerAvatarText}>{iniciales}</Text>
        </View>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.7}>
          <Text style={s.headerNombre} numberOfLines={1}>{nombreChat}</Text>
          <View style={s.headerStatusRow}>
            <View style={[s.statusDot, { backgroundColor: conectado ? '#22c55e' : '#f59e0b' }]} />
            <Text style={s.headerStatus}>{conectado ? 'en línea' : 'reconectando…'}</Text>
          </View>
        </TouchableOpacity>
        {/* Botón buscar en chat */}
        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => { setBusquedaVisible(v => !v); setBusquedaTerm(''); }}
          activeOpacity={0.7}
        >
          <IconSearch size={18} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </View>

      {/* ── Barra de búsqueda inline ── */}
      {busquedaVisible && (
        <View style={s.busquedaBar}>
          <TextInput
            style={s.busquedaInput}
            value={busquedaTerm}
            onChangeText={setBusquedaTerm}
            placeholder="Buscar en la conversación…"
            placeholderTextColor={MUTED}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {busquedaTerm.trim() ? (
            <Text style={s.busquedaCount}>
              {mensajes.filter(m => m.mensaje?.toLowerCase().includes(busquedaTerm.toLowerCase())).length} resultados
            </Text>
          ) : null}
          <TouchableOpacity onPress={() => { setBusquedaVisible(false); setBusquedaTerm(''); }} style={{ padding: 6 }}>
            <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Banner reconexión ── */}
      {!conectado && (
        <View style={s.bannerRecon}>
          <IconAlertTriangle size={14} color="#92400e" />
          <Text style={s.bannerReconText}>Reconectando al chat…</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Área de mensajes ── */}
        <FlatList
          ref={flatListRef}
          data={mensajesFiltrados}
          keyExtractor={(item, i) => String(item.id_mensaje ?? i)}
          renderItem={renderItem}
          contentContainerStyle={s.lista}
          style={s.chatArea}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <Text style={s.emptyChatIcon}>💬</Text>
              <Text style={s.emptyChatText}>
                {busquedaTerm.trim()
                  ? 'No se encontraron mensajes'
                  : 'Aún no hay mensajes. ¡Empieza la conversación!'}
              </Text>
            </View>
          }
        />

        {/* ── Barra de respuesta (quote) ── */}
        {respondiendoA && (
          <View style={s.replyBar}>
            <View style={s.replyBarAccent} />
            <View style={{ flex: 1 }}>
              <Text style={s.replyBarNombre}>{respondiendoA.nombre_remitente}</Text>
              <Text style={s.replyBarTexto} numberOfLines={1}>{respondiendoA.mensaje}</Text>
            </View>
            <TouchableOpacity onPress={() => setRespondiendoA(null)} style={{ padding: 8 }}>
              <Text style={{ color: MUTED, fontSize: 18, fontWeight: '300' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Picker de emojis básico ── */}
        {emojiVisible && (
          <View style={s.emojiPicker}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, padding: 10 }}>
              {EMOJIS_BASICOS.map((e, i) => (
                <TouchableOpacity key={i} onPress={() => setTexto(t => t + e)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Input bar ── */}
        <View style={s.inputBar}>
          {/* Botón emoji */}
          <TouchableOpacity
            style={s.inputSideBtn}
            onPress={() => setEmojiVisible(v => !v)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 22 }}>😊</Text>
          </TouchableOpacity>

          <TextInput
            style={s.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={MUTED}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[s.sendBtn, !texto.trim() && s.sendBtnDis]}
            onPress={enviar}
            disabled={!texto.trim()}
            activeOpacity={0.8}
          >
            <Text style={s.sendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Modal menú contextual de mensaje ── */}
      <Modal
        visible={menuMsg.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuMsg({ visible: false, msg: null })}
      >
        <Pressable style={s.menuOverlay} onPress={() => setMenuMsg({ visible: false, msg: null })}>
          <View style={s.menuBox}>
            {/* Barra de reacciones rápidas */}
            <View style={s.quickReactions}>
              {QUICK_REACTIONS.map((e, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.quickReactionBtn}
                  onPress={() => menuMsg.msg && reaccionar(menuMsg.msg.id_mensaje, e)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.menuDivider} />

            {/* Opciones */}
            {[
              { label: '💬  Responder',  fn: () => menuMsg.msg && responderMensaje(menuMsg.msg) },
              { label: '📋  Copiar',     fn: () => menuMsg.msg && copiarMensaje(menuMsg.msg) },
              { label: menuMsg.msg && destacados.includes(menuMsg.msg.id_mensaje)
                  ? '⭐  Quitar destacado'
                  : '⭐  Destacar',
                fn: () => menuMsg.msg && destacarMensaje(menuMsg.msg.id_mensaje) },
              { label: menuMsg.msg && fijados.includes(menuMsg.msg.id_mensaje)
                  ? '📌  Desfijar'
                  : '📌  Fijar',
                fn: () => menuMsg.msg && fijarMensaje(menuMsg.msg.id_mensaje) },
              { label: '🗑️  Eliminar',  fn: () => {
                  if (menuMsg.msg) {
                    Alert.alert('Eliminar mensaje', '¿Eliminar este mensaje? (solo localmente)', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarMensajeLocal(menuMsg.msg.id_mensaje) },
                    ]);
                  }
                }, danger: true },
            ].map((op, i) => (
              <TouchableOpacity
                key={i}
                style={s.menuOption}
                onPress={op.fn}
                activeOpacity={0.7}
              >
                <Text style={[s.menuOptionText, op.danger && { color: '#dc2626' }]}>
                  {typeof op.label === 'function' ? op.label() : op.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal barra de reacciones flotante ── */}
      <Modal
        visible={barReacciones.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setBarReacciones({ visible: false, msg: null })}
      >
        <Pressable style={s.menuOverlay} onPress={() => setBarReacciones({ visible: false, msg: null })}>
          <View style={s.reaccionesBar}>
            {QUICK_REACTIONS.map((e, i) => (
              <TouchableOpacity
                key={i}
                style={s.quickReactionBtn}
                onPress={() => barReacciones.msg && reaccionar(barReacciones.msg.id_mensaje, e)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 28 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: PRIMARY },
  loading:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG_CHAT, gap: 12 },
  loadingText: { color: MUTED, fontSize: 13 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: PRIMARY, paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 0 : 8, paddingBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  backBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText:         { color: WHITE, fontSize: 32, fontWeight: '300', lineHeight: 36, marginTop: -2 },
  headerAvatar:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  headerAvatarText: { color: WHITE, fontWeight: '800', fontSize: 15 },
  headerNombre:     { color: WHITE, fontSize: 15, fontWeight: '800' },
  headerStatusRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  headerStatus:     { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  headerBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)' },

  // Búsqueda inline
  busquedaBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 8 },
  busquedaInput: { flex: 1, fontSize: 14, color: TEXT, paddingVertical: 6 },
  busquedaCount: { fontSize: 11, color: MUTED, fontWeight: '600' },

  // Banner reconexión
  bannerRecon:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', paddingVertical: 7, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  bannerReconText: { color: '#92400e', fontSize: 12, fontWeight: '600' },

  // Chat area
  chatArea: { flex: 1, backgroundColor: BG_CHAT },
  lista:    { padding: 12, paddingBottom: 8, flexGrow: 1 },

  // Estado vacío
  emptyChat:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyChatIcon: { fontSize: 40, marginBottom: 12 },
  emptyChatText: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Separador de fecha
  fechaSep:     { alignSelf: 'center', backgroundColor: '#EDE6DC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginVertical: 10 },
  fechaSepText: { fontSize: 12, color: '#6B5B52', fontWeight: '600' },

  // Fila de mensaje
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2, gap: 6, paddingHorizontal: 4 },
  msgRowOwn:   { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },

  // Avatar pequeño
  msgAvatar:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 },
  msgAvatarText: { color: WHITE, fontWeight: '800', fontSize: 10 },

  // Burbuja
  bubble: {
    maxWidth: '72%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
    position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  bubbleOwn:       { backgroundColor: BUBBLE_OWN_BG,    borderBottomRightRadius: 4 },
  bubbleOther:     { backgroundColor: BUBBLE_OTHER_BG,   borderBottomLeftRadius: 4,  borderWidth: 1, borderColor: '#F0D8DF' },
  bubbleDestacado: { borderWidth: 1.5, borderColor: '#FFD700' },
  bubbleIcon:      { position: 'absolute', top: 6, fontSize: 10 },
  bubbleNombre:    { fontSize: 11, fontWeight: '800', marginBottom: 3 },
  bubbleTextOwn:   { fontSize: 14, color: BUBBLE_OWN_TEXT,   lineHeight: 20 },
  bubbleTextOther: { fontSize: 14, color: BUBBLE_OTHER_TEXT, lineHeight: 20 },
  bubbleMeta:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  bubbleHora:      { fontSize: 10, color: '#B0C0B8' },

  // Quote
  quoteBar:      { borderLeftWidth: 3, paddingLeft: 8, marginBottom: 6, borderRadius: 4 },
  quoteBarOwn:   { borderLeftColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.1)', padding: 6, borderRadius: 6 },
  quoteBarOther: { borderLeftColor: PRIMARY, backgroundColor: 'rgba(122,30,58,0.08)', padding: 6, borderRadius: 6 },
  quoteText:     { fontSize: 12, lineHeight: 16 },

  // Botón de reacción junto a la burbuja
  reaccionBtn:      { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3EDE8', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  reaccionBtnOwn:   { order: -1 },
  reaccionBtnOther: {},

  // Badge de reacciones
  reacsBadge:     { flexDirection: 'row', gap: 2, backgroundColor: WHITE, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginTop: -4, marginBottom: 4, borderWidth: 1, borderColor: BORDER, alignSelf: 'flex-start' },
  reacsBadgeOwn:  { alignSelf: 'flex-end', marginRight: 40 },
  reacsBadgeOther:{ alignSelf: 'flex-start', marginLeft: 40 },

  // Barra de respuesta (reply)
  replyBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER, gap: 10 },
  replyBarAccent: { width: 4, height: '100%', backgroundColor: PRIMARY, borderRadius: 2 },
  replyBarNombre: { fontSize: 12, fontWeight: '800', color: PRIMARY, marginBottom: 2 },
  replyBarTexto:  { fontSize: 12, color: MUTED },

  // Picker de emojis
  emojiPicker: { backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER, height: 56 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  inputSideBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14, color: TEXT, maxHeight: 100, backgroundColor: BG_CHAT,
  },
  sendBtn:     { backgroundColor: PRIMARY, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  sendBtnDis:  { backgroundColor: '#D4A0B0' },
  sendBtnText: { color: WHITE, fontWeight: '800', fontSize: 14 },

  // Menú contextual
  menuOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  menuBox:      { backgroundColor: WHITE, borderRadius: 20, width: '100%', maxWidth: 320, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }, android: { elevation: 10 } }) },
  quickReactions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 8 },
  quickReactionBtn: { padding: 6 },
  menuDivider:  { height: 1, backgroundColor: BORDER },
  menuOption:   { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F0EB' },
  menuOptionText:{ fontSize: 15, color: TEXT, fontWeight: '500' },

  // Barra de reacciones flotante
  reaccionesBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: WHITE, borderRadius: 40, paddingVertical: 10, paddingHorizontal: 14, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 }, android: { elevation: 8 } }) },
});
