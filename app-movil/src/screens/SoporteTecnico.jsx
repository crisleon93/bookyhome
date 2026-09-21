import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crearSoporte, getSoporte } from '../services/api';

const PRIMARY = '#7A1E3A';
const PRIMARY_DARK = '#4E1022';
const BG = '#F9F6F1';
const SOFT = '#F7ECF1';
const WHITE = '#FFFFFF';
const BORDER = '#E7D6DD';
const TEXT = '#2A1C20';
const MUTED = '#6E5A61';

const CATEGORIAS = [
  'La página no carga',
  'Error al iniciar sesión',
  'Problema al pagar',
  'Error al publicar o comprar',
  'Otro problema técnico',
];

export default function SoporteTecnico() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);

  const cargar = async () => {
    try {
      const res = await getSoporte();
      setTickets(res.data || []);
    } catch (e) {
      console.log('Error cargando soporte:', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const enviarTicket = async () => {
    const asuntoTrim = asunto.trim();
    const descripcionTrim = descripcion.trim();
    if (!asuntoTrim || !descripcionTrim) {
      Alert.alert('Falta información', 'Escribe un asunto y una descripción para continuar.');
      return;
    }

    setEnviando(true);
    try {
      await crearSoporte({
        asunto: asuntoTrim,
        descripcion: descripcionTrim,
        categoria,
      });
      setAsunto('');
      setDescripcion('');
      setCategoria(CATEGORIAS[0]);
      await cargar();
      Alert.alert('Listo', 'Tu ticket de soporte fue enviado correctamente.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo enviar tu ticket de soporte.');
    } finally {
      setEnviando(false);
    }
  };

  const badgeColor = (estado) => {
    if (estado === 'Resuelto') return { bg: '#DCFCE7', text: '#166534' };
    if (estado === 'En revisión' || estado === 'En revision') return { bg: '#FEF3C7', text: '#B45309' };
    return { bg: '#E0F2FE', text: '#1D4ED8' };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroIconText}>?</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Soporte técnico</Text>
            <Text style={styles.heroSubtitle}>Reporta una falla de la plataforma, pago, sesión o navegación.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nuevo ticket</Text>

          <Text style={styles.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORIAS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, categoria === item && styles.chipActive]}
                onPress={() => setCategoria(item)}
              >
                <Text style={[styles.chipText, categoria === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Asunto</Text>
          <TextInput
            style={styles.input}
            value={asunto}
            onChangeText={setAsunto}
            placeholder="Ej. No puedo pagar mi compra"
            placeholderTextColor={MUTED}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Explica el problema con el mayor detalle posible"
            placeholderTextColor={MUTED}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={enviarTicket} disabled={enviando}>
            {enviando ? <ActivityIndicator color={WHITE} /> : <Text style={styles.submitText}>Enviar ticket</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mis tickets</Text>
          {loading ? (
            <ActivityIndicator size="large" color={PRIMARY} style={{ marginVertical: 20 }} />
          ) : tickets.length === 0 ? (
            <Text style={styles.emptyText}>Aún no tienes tickets de soporte.</Text>
          ) : (
            tickets.map((ticket) => {
              const color = badgeColor(ticket.estado);
              return (
                <View key={ticket.id_solicitud || ticket.id} style={styles.ticketItem}>
                  <View style={styles.ticketHeaderRow}>
                    <Text style={styles.ticketTitle}>{ticket.asunto}</Text>
                    <View style={[styles.badge, { backgroundColor: color.bg }]}>
                      <Text style={[styles.badgeText, { color: color.text }]}>{ticket.estado || 'Abierto'}</Text>
                    </View>
                  </View>

                  <Text style={styles.ticketMeta}>{ticket.categoria || 'Soporte'} · #{ticket.numero || ticket.id_solicitud}</Text>
                  <Text style={styles.ticketDescription} numberOfLines={3}>{ticket.descripcion}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#7A1E3A',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroIconText: {
    color: WHITE,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 26,
  },
  heroTitle: {
    color: WHITE,
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    color: PRIMARY_DARK,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  label: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 8,
  },
  categoryRow: {
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: SOFT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipText: {
    color: PRIMARY_DARK,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: WHITE,
  },
  input: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 14,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 14,
  },
  emptyText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginVertical: 12,
  },
  ticketItem: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 10,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    paddingRight: 12,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ticketMeta: {
    color: MUTED,
    fontSize: 11,
    marginBottom: 6,
  },
  ticketDescription: {
    color: TEXT,
    fontSize: 12,
    lineHeight: 18,
  },
});
