import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useChatSocket } from '../context/ChatSocketContext';
import { getChatHistory, marcarSalaLeida as marcarSalaLeidaApi, enviarMensajeChat } from '../services/api';

// ─── Helpers de formato ───────────────────────────────────────────────────────

const formatHora = (fechaStr) => {
  if (!fechaStr) return '';
  const date = new Date(fechaStr.replace(' ', 'T'));
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatFechaSeparador = (fechaStr) => {
  if (!fechaStr) return '';
  const date = new Date(fechaStr.replace(' ', 'T'));
  if (isNaN(date.getTime())) return '';

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

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Chat() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id_sala, nombre_tienda } = route.params;
  const { user } = useContext(AuthContext);

  // Usa el WebSocket compartido del contexto — evita doble conexión
  const { conectado, suscribirseAMensajes, enviarPorSocket, marcarSalaLeidaLocal } = useChatSocket();

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);

  const flatListRef = useRef(null);
  const montadoRef = useRef(true);

  // ── Título de la pantalla
  useEffect(() => {
    navigation.setOptions({ title: nombre_tienda || 'Chat' });
  }, [nombre_tienda]);

  // ── Limpieza al desmontar
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // ── Cargar historial inicial
  const cargarHistorial = useCallback(async () => {
    try {
      const { data } = await getChatHistory(id_sala);
      if (montadoRef.current) setMensajes(data.mensajes);
    } catch (e) {
      console.error('Error cargando historial de chat:', e);
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  }, [id_sala]);

  // ── Marcar sala como leída en el backend y en el estado global del contexto
  const marcarLeida = useCallback(async () => {
    marcarSalaLeidaLocal(id_sala);
    try {
      await marcarSalaLeidaApi(id_sala);
    } catch (_) {
      // No es crítico
    }
  }, [id_sala, marcarSalaLeidaLocal]);

  // ── Efecto principal: historial + suscripción al WS compartido
  useEffect(() => {
    cargarHistorial();
    marcarLeida();

    // Suscribirse a los eventos del WebSocket compartido del contexto
    const desuscribirse = suscribirseAMensajes((data) => {
      if (!montadoRef.current) return;

      if (data.tipo === 'nuevo_mensaje' && data.mensaje.id_sala === id_sala) {
        setMensajes((prev) => {
          if (prev.some((m) => m.id_mensaje === data.mensaje.id_mensaje)) return prev;
          return [...prev, data.mensaje];
        });
        marcarLeida();
      } else if (data.tipo === 'mensaje_enviado' && data.mensaje.id_sala === id_sala) {
        setMensajes((prev) => {
          if (prev.some((m) => m.id_mensaje === data.mensaje.id_mensaje)) return prev;
          return [...prev, data.mensaje];
        });
      }
    });

    return desuscribirse;
  }, [id_sala, cargarHistorial, marcarLeida, suscribirseAMensajes]);

  // ── Enviar mensaje: primero intenta WS compartido, fallback a REST
  const enviarMensaje = useCallback(() => {
    const contenido = texto.trim();
    if (!contenido) return;
    setTexto('');

    const enviado = enviarPorSocket(id_sala, contenido);
    if (!enviado) {
      // WS no disponible (reconectando) → REST como fallback
      enviarMensajeChat({ id_sala, mensaje: contenido })
        .then(() => cargarHistorial())
        .catch((e) => console.error('Error enviando mensaje (fallback REST):', e));
    }
  }, [texto, id_sala, enviarPorSocket, cargarHistorial]);

  // ── Render de cada mensaje
  const renderItem = ({ item, index }) => {
    const esPropio = Number(item.id_remitente) === Number(user.sub);
    const anterior = mensajes[index - 1];
    const mostrarFecha =
      !anterior ||
      formatFechaSeparador(anterior.enviado_en) !== formatFechaSeparador(item.enviado_en);

    return (
      <View>
        {mostrarFecha && (
          <View style={styles.fechaSeparador}>
            <Text style={styles.fechaSeparadorTexto}>
              {formatFechaSeparador(item.enviado_en)}
            </Text>
          </View>
        )}
        <View style={[styles.burbuja, esPropio ? styles.burbujaPropia : styles.burbujaAjena]}>
          {!esPropio && (
            <Text style={styles.nombreRemitente}>{item.nombre_remitente}</Text>
          )}
          <Text style={esPropio ? styles.textoPropio : styles.textoAjeno}>
            {item.mensaje}
          </Text>
          <Text style={styles.hora}>{formatHora(item.enviado_en)}</Text>
        </View>
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" />
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

      <FlatList
        ref={flatListRef}
        data={mensajes}
        keyExtractor={(item) => String(item.id_mensaje)}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContenedor}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe un mensaje..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.botonEnviar} onPress={enviarMensaje}>
          <Text style={styles.textoBotonEnviar}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { padding: 12, flexGrow: 1 },
  burbuja: {
    maxWidth: '75%',
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
  },
  burbujaPropia: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  burbujaAjena: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
  },
  nombreRemitente: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    color: '#555',
  },
  textoPropio: { fontSize: 15, color: '#000' },
  textoAjeno: { fontSize: 15, color: '#000' },
  hora: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContenedor: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  botonEnviar: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textoBotonEnviar: { color: '#fff', fontWeight: '600' },
  bannerDesconectado: {
    backgroundColor: '#FFF3CD',
    padding: 6,
    alignItems: 'center',
  },
  textoBanner: { color: '#856404', fontSize: 12 },
  fechaSeparador: {
    alignSelf: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 10,
  },
  fechaSeparadorTexto: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
});
