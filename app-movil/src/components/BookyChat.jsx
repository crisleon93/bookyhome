/**
 * BookyChat.jsx
 * Widget flotante del asistente IA Booky para la app móvil.
 * Replica el diseño y paleta de AsistenteIA.jsx (web), adaptado a React Native.
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { chatAsistente } from '../services/api';

// ─── Imágenes de la mascota ─────────────────────────────────────────────────
const IMG_BOOKY       = require('../assets/booky.png');
const IMG_BOOKY_HAPPY = require('../assets/Bookyalegre.png');
const IMG_BOOKY_THINK = require('../assets/Bookypensante.png');

// ─── Paleta (idéntica a BOOKY_THEME de la web) ──────────────────────────────
const T = {
  panel:      '#120d12',
  panelSoft:  '#1b1217',
  brand:      '#541223',
  brandDark:  '#3b0d19',
  accent:     '#7A1E3A',
  accentSoft: '#F4E2E7',
  bubbleUser: '#541223',
  bubbleBot:  '#F4E2E7',
  text:       '#F5EDF1',
  textMuted:  'rgba(245,237,241,0.7)',
  ink:        '#2d1018',
  border:     '#E8D5DA',
  panelBg:    '#F7EEF1',
  msgBg:      '#F8F0F3',
  inputBorder:'#D9B6C0',
  botText:    '#3E1721',
};

// ─── Constantes de sesión ───────────────────────────────────────────────────
const SESSION_PREFIX = 'booky_mobile_session';

// ─── Helpers de sesión / persistencia ───────────────────────────────────────
function buildWelcome(nombre) {
  const saludo = nombre && nombre !== 'Usuario'
    ? `¡Hola ${nombre}! Soy Booky, tu compañero lector. ¿En qué puedo ayudarte hoy?`
    : '¡Hola! Soy Booky, tu compañero lector. ¿En qué puedo ayudarte hoy?';
  return [{ from: 'bot', text: saludo }];
}

function getSessionTitle(messages) {
  const first = messages.find((m) => m.from === 'user' && m.text?.trim());
  if (!first) return 'Nueva conversación';
  return first.text.length > 26 ? `${first.text.slice(0, 26)}…` : first.text;
}

function newSession(nombre) {
  return {
    id: `s-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title: 'Nueva conversación',
    updatedAt: Date.now(),
    messages: buildWelcome(nombre),
  };
}

async function loadSessions(uid) {
  try {
    const raw = await AsyncStorage.getItem(`${SESSION_PREFIX}_${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveSessions(uid, sessions) {
  try {
    await AsyncStorage.setItem(`${SESSION_PREFIX}_${uid}`, JSON.stringify(sessions));
  } catch { /* silencioso */ }
}

// ─── Parseo básico de Markdown inline ───────────────────────────────────────
function InlineText({ text }) {
  // Renderiza **negrita** dentro de un texto
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={i} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

function MessageContent({ text, isUser }) {
  const color = isUser ? T.accentSoft : T.botText;
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        const bullet = /^[-•]\s+(.+)/.exec(line);
        const numbered = /^(\d+)\.\s+(.+)/.exec(line);
        if (bullet) {
          return (
            <View key={i} style={styles.listRow}>
              <Text style={[styles.listBullet, { color }]}>•</Text>
              <Text style={[styles.listText, { color }]}><InlineText text={bullet[1]} /></Text>
            </View>
          );
        }
        if (numbered) {
          return (
            <View key={i} style={styles.listRow}>
              <Text style={[styles.listBullet, { color }]}>{numbered[1]}.</Text>
              <Text style={[styles.listText, { color }]}><InlineText text={numbered[2]} /></Text>
            </View>
          );
        }
        if (!line.trim()) return <View key={i} style={{ height: 5 }} />;
        return (
          <Text key={i} style={[styles.msgText, { color }, i > 0 && { marginTop: 4 }]}>
            <InlineText text={line} />
          </Text>
        );
      })}
    </View>
  );
}

// ─── Dots de "pensando" ──────────────────────────────────────────────────────
function ThinkingDots() {
  const anims = [useRef(new Animated.Value(0.25)).current,
                 useRef(new Animated.Value(0.25)).current,
                 useRef(new Animated.Value(0.25)).current];

  useEffect(() => {
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(anim, { toValue: 1, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.25, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.delay((2 - i) * 180),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  return (
    <View style={styles.dotsRow}>
      {anims.map((anim, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
      ))}
    </View>
  );
}

// ─── Animación de la mascota flotante ────────────────────────────────────────
function useMascotFloat() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: -7, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

function useMascotThink() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.07, duration: 375, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 375, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

// ─── toApiHistory ─────────────────────────────────────────────────────────────
function toApiHistory(messages) {
  return messages
    .filter((m) => m.from && m.text?.trim())
    .map((m) => ({ rol: m.from === 'user' ? 'user' : 'assistant', contenido: m.text }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function BookyChat() {
  const insets = useSafeAreaInsets();
  const { user, token } = useContext(AuthContext);

  const uid = user?.id ? String(user.id) : 'guest';
  const nombre = user?.nombre || user?.email || 'Usuario';

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [open, setOpen]               = useState(false);
  const [sessions, setSessions]       = useState([]);
  const [activeId, setActiveId]       = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showHappy, setShowHappy]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const flatRef = useRef(null);

  // ── Cargar sesiones al montar / cuando cambia el usuario ────────────────────
  useEffect(() => {
    (async () => {
      let stored = await loadSessions(uid);
      if (stored.length === 0) {
        const primera = newSession(nombre);
        stored = [primera];
        await saveSessions(uid, stored);
      }
      setSessions(stored);
      setActiveId(stored[0].id);
      setMessages(stored[0].messages);
    })();
  }, [uid]);

  // ── Persistir mensajes cuando cambian ───────────────────────────────────────
  useEffect(() => {
    if (!activeId || sessions.length === 0) return;
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id !== activeId
          ? s
          : { ...s, messages, title: getSessionTitle(messages), updatedAt: Date.now() },
      );
      void saveSessions(uid, next);
      return next;
    });
  }, [messages]);

  // ── Scroll al último mensaje ─────────────────────────────────────────────────
  useEffect(() => {
    if (open && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages, open]);

  // ── Acciones de sesión ───────────────────────────────────────────────────────
  const openSession = useCallback((id) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    setActiveId(id);
    setMessages(s.messages);
    setSidebarOpen(false);
  }, [sessions]);

  const createSession = useCallback(async () => {
    const s = newSession(nombre);
    const next = [s, ...sessions];
    setSessions(next);
    setActiveId(s.id);
    setMessages(s.messages);
    await saveSessions(uid, next);
    setSidebarOpen(false);
  }, [sessions, nombre, uid]);

  const deleteSession = useCallback(async (id) => {
    setSessions((prev) => {
      let remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fallback = newSession(nombre);
        remaining = [fallback];
      }
      const top = remaining[0];
      setActiveId(top.id);
      setMessages(top.messages);
      void saveSessions(uid, remaining);
      return remaining;
    });
  }, [nombre, uid]);

  // ── Enviar mensaje ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const texto = input.trim();
    if (!texto || loading) return;

    const historialLimpio = toApiHistory(messages);
    setMessages((prev) => [...prev, { from: 'user', text: texto }]);
    setInput('');
    setLoading(true);
    setShowHappy(false);

    try {
      const { data } = await chatAsistente({
        mensaje: texto,
        pagina: 'app-movil',
        historial: historialLimpio,
      });
      setMessages((prev) => [...prev, { from: 'bot', text: data.respuesta }]);
      setShowHappy(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'No pude responder en este momento. Inténtalo de nuevo en unos segundos.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  // ── Animaciones ──────────────────────────────────────────────────────────────
  const floatY  = useMascotFloat();
  const scaleAnim = useMascotThink();
  const mascotImg = loading ? IMG_BOOKY_THINK : (showHappy ? IMG_BOOKY_HAPPY : IMG_BOOKY);

  // ─── Render de cada mensaje ──────────────────────────────────────────────────
  const renderMessage = useCallback(({ item, index }) => {
    const isUser = item.from === 'user';
    return (
      <View key={index} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <Image source={IMG_BOOKY} style={styles.botAvatar} />
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <MessageContent text={item.text} isUser={isUser} />
        </View>
      </View>
    );
  }, []);

  // ─── Render del item de sesión en el sidebar ─────────────────────────────────
  const renderSession = useCallback(({ item }) => {
    const isActive = item.id === activeId;
    return (
      <View style={styles.sessionRow}>
        <TouchableOpacity
          onPress={() => openSession(item.id)}
          style={[styles.sessionBtn, isActive && styles.sessionBtnActive]}
          activeOpacity={0.75}
        >
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {item.title || 'Nueva conversación'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteSession(item.id)}
          style={styles.sessionDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.sessionDeleteTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }, [activeId, openSession, deleteSession]);

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Botón flotante mascota ── */}
      {!open && (
        <Animated.View
          style={[
            styles.fabContainer,
            { bottom: insets.bottom + 20, transform: [{ translateY: floatY }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => setOpen(true)}
            activeOpacity={0.9}
            accessibilityLabel="Abrir asistente Booky"
          >
            <Image source={IMG_BOOKY} style={styles.fabImg} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Modal del chat ── */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={0}
        >
          {/* Fondo semitransparente — cierra el modal al tocar fuera */}
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

          {/* Panel del chat */}
          <View style={[styles.chatPanel, { paddingBottom: insets.bottom }]}>

            {/* ── HEADER ── */}
            <View style={styles.header}>
              {/* Botón menú sesiones */}
              <TouchableOpacity
                onPress={() => setSidebarOpen((v) => !v)}
                style={styles.headerMenuBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.headerMenuIcon}>☰</Text>
              </TouchableOpacity>

              {/* Avatar + títulos */}
              <View style={styles.headerCenter}>
                <Animated.Image
                  source={mascotImg}
                  style={[
                    styles.headerAvatar,
                    loading
                      ? { transform: [{ scale: scaleAnim }] }
                      : undefined,
                  ]}
                />
                <View>
                  <Text style={styles.headerName}>Booky</Text>
                  <Text style={styles.headerSub}>Tu compañero lector</Text>
                </View>
              </View>

              {/* Botón cerrar */}
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.headerCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.headerCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ── CUERPO: sidebar + mensajes ── */}
            <View style={styles.body}>

              {/* Sidebar de sesiones (drawer lateral) */}
              {sidebarOpen && (
                <View style={styles.sidebar}>
                  <View style={styles.sidebarHeader}>
                    <Text style={styles.sidebarTitle}>Sesiones</Text>
                    <TouchableOpacity onPress={createSession} style={styles.newSessionBtn}>
                      <Text style={styles.newSessionTxt}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={sessions}
                    keyExtractor={(s) => s.id}
                    renderItem={renderSession}
                    contentContainerStyle={{ gap: 6 }}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              )}

              {/* Área de mensajes */}
              <ScrollView
                ref={flatRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.map((item, index) => renderMessage({ item, index }))}

                {/* Loading thinking */}
                {loading && (
                  <View style={[styles.msgRow, styles.msgRowBot]}>
                    <Image source={IMG_BOOKY_THINK} style={styles.botAvatar} />
                    <View style={[styles.bubble, styles.bubbleBot, styles.thinkingBubble]}>
                      <Text style={styles.thinkingLabel}>Booky está pensando</Text>
                      <ThinkingDots />
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* ── INPUT ── */}
            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Escribe tu pregunta sobre BookyHome…"
                placeholderTextColor={T.inputBorder}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!loading}
                multiline={false}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBtnTxt}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Botón flotante
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 9999,
    elevation: 10,
  },
  fabImg: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Panel del chat
  chatPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
    minHeight: 420,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: T.brandDark,
    // Gradiente simulado con sombra interior — LinearGradient requiere expo-linear-gradient
    // ya instalado en la app.
  },
  headerMenuBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(244,226,231,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMenuIcon: {
    color: T.accentSoft,
    fontSize: 17,
    lineHeight: 20,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 10,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  headerName: {
    color: T.text,
    fontWeight: '700',
    fontSize: 16,
  },
  headerSub: {
    color: T.textMuted,
    fontSize: 11,
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(244,226,231,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseTxt: {
    color: T.accentSoft,
    fontSize: 15,
    fontWeight: '600',
  },

  // Cuerpo
  body: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  // Sidebar sesiones
  sidebar: {
    width: 170,
    backgroundColor: T.brandDark,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sidebarTitle: {
    color: T.accentSoft,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  newSessionBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244,226,231,0.25)',
    backgroundColor: 'rgba(244,226,231,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSessionTxt: {
    color: T.accentSoft,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '300',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(244,226,231,0.07)',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  sessionBtnActive: {
    backgroundColor: T.accent,
  },
  sessionTitle: {
    color: T.text,
    fontSize: 12,
  },
  sessionDelete: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(244,226,231,0.18)',
    backgroundColor: 'rgba(244,226,231,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDeleteTxt: {
    color: T.accentSoft,
    fontSize: 10,
    lineHeight: 14,
  },

  // Mensajes
  messages: {
    flex: 1,
    backgroundColor: T.msgBg,
  },
  messagesContent: {
    padding: 14,
    gap: 10,
    flexGrow: 1,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowBot: {
    justifyContent: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    borderRadius: 14,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  bubbleBot: {
    backgroundColor: T.bubbleBot,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: T.bubbleUser,
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  listRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  listBullet: {
    fontSize: 14,
    lineHeight: 20,
    minWidth: 14,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Thinking
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  thinkingLabel: {
    color: T.botText,
    fontSize: 13,
    fontStyle: 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.accent,
  },

  // Input
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: T.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: T.ink,
    backgroundColor: '#fff',
  },
  sendBtn: {
    backgroundColor: T.brandDark,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnTxt: {
    color: T.accentSoft,
    fontWeight: '700',
    fontSize: 13,
  },
});
