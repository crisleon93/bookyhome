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
import api, { getChatHistory, marcarSalaLeida as marcarSalaLeidaApi, enviarMensajeChat } from '../services/api';

// Deriva la URL del WS a partir de la baseURL de axios (http -> ws, https -> wss)
const WS_BASE_URL = api.defaults.baseURL.replace(/^http/, 'ws');

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

export default function Chat() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id_sala, nombre_tienda } = route.params;
  const { user, token } = useContext(AuthContext);

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [conectado, setConectado] = useState(false);

  const flatListRef = useRef(null);
  const wsRef = useRef(null);
  const reconectarTimeoutRef = useRef(null);
  const intentosReconexion = useRef(0);
  const montadoRef = useRef(true);

  useEffect(() => {
    navigation.setOptions({ title: nombre_tienda || 'Chat' });
  }, [nombre_tienda]);

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

  const marcarSalaLeida = useCallback(async () => {
    try {
      await marcarSalaLeidaApi(id_sala);
    } catch (e) {
      // No es crítico si falla; no bloqueamos la UI por esto.
    }
  }, [id_sala]);

  const conectarWebSocket = useCallback(() => {
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE_URL}/chat/ws?token=${token}`);

    ws.onopen = () => {
      if (!montadoRef.current) return;
      setConectado(true);
      intentosReconexion.current = 0;
    };

    ws.onmessage = (event) => {
      if (!montadoRef.current) return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error('Mensaje WS malformado:', event.data);
        return;
      }

      if (data.tipo === 'nuevo_mensaje' && data.mensaje.id_sala === id_sala) {
        setMensajes((prev) => {
          if (prev.some((m) => m.id_mensaje === data.mensaje.id_mensaje)) return prev;
          return [...prev, data.mensaje];
        });
        marcarSalaLeida();
      } else if (data.tipo === 'mensaje_enviado') {
        setMensajes((prev) => {
          if (prev.some((m) => m.id_mensaje === data.mensaje.id_mensaje)) return prev;
          return [...prev, data.mensaje];
        });
      } else if (data.tipo === 'error') {
        console.warn('Error del servidor de chat:', data.detalle);
      }
    };

    ws.onerror = (e) => {
      console.error('Error en WebSocket de chat:', e.message);
    };

    ws.onclose = (event) => {
        console.log('[WS onclose]', 'code:', event.code, 'reason:', event.reason, 'wasClean:', event.wasClean);
      if (!montadoRef.current) return;
      setConectado(false);

      if (event.code === 4401) {
        // Token inválido/expirado: no reintentamos.
        // TODO: cuando esté centralizado el logout, redirigir a Login desde acá.
        console.warn('Token inválido en WS de chat, no se reintenta la conexión');
        return;
      }

      intentosReconexion.current += 1;
      const espera = Math.min(1000 * intentosReconexion.current, 10000);
      reconectarTimeoutRef.current = setTimeout(conectarWebSocket, espera);
    };

    wsRef.current = ws;
  }, [token, id_sala, marcarSalaLeida]);

  useEffect(() => {
    montadoRef.current = true;
    cargarHistorial();
    marcarSalaLeida();
    conectarWebSocket();

    return () => {
      montadoRef.current = false;
      if (reconectarTimeoutRef.current) clearTimeout(reconectarTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // evita que intente reconectar al desmontar
        wsRef.current.close();
      }
    };
  }, [conectarWebSocket, cargarHistorial, marcarSalaLeida]);

  const enviarMensaje = () => {
    const contenido = texto.trim();
    if (!contenido) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ tipo: 'mensaje', id_sala, mensaje: contenido }));
    } else {
      // Fallback REST si el WS no está disponible (ej. reconectando)
      enviarMensajeChat({ id_sala, mensaje: contenido })
        .then(() => cargarHistorial())
        .catch((e) => console.error('Error enviando mensaje (fallback REST):', e));
    }

    setTexto('');
  };

  const renderItem = ({ item, index }) => {
    const esPropio = Number(item.id_remitente) === Number(user.sub);
    const anterior = mensajes[index - 1];
    const mostrarFecha =
      !anterior || formatFechaSeparador(anterior.enviado_en) !== formatFechaSeparador(item.enviado_en);

    return (
      <View>
        {mostrarFecha && (
          <View style={styles.fechaSeparador}>
            <Text style={styles.fechaSeparadorTexto}>{formatFechaSeparador(item.enviado_en)}</Text>
          </View>
        )}
        <View style={[styles.burbuja, esPropio ? styles.burbujaPropia : styles.burbujaAjena]}>
          {!esPropio && <Text style={styles.nombreRemitente}>{item.nombre_remitente}</Text>}
          <Text style={esPropio ? styles.textoPropio : styles.textoAjeno}>{item.mensaje}</Text>
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