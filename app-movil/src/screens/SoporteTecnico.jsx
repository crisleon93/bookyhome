import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SafeAreaView from '../components/ThemedSafeAreaView';
import Footer from '../components/Footer';
import { useThemedStyles } from '../context/ThemeContext';
import {
  IconCheck,
  IconCreditCard,
  IconLock,
  IconMessage,
  IconRefresh,
  IconShoppingBag,
  IconTool,
} from '../components/Icons';
import { crearSoporte, getSoporte } from '../services/api';

const PRIMARY = '#7A1E3A';
const PRIMARY_LIGHT = '#9b2c4e';
const WHITE = '#FFFFFF';
const TEXT = '#111111';
const SECONDARY = '#374151';
const MUTED = '#6b7280';
const CARD = '#FFFFFF';
const SUB_CARD = '#fafafa';
const BORDER = '#e5e7eb';
const CATEGORIES = [
  { label: 'La página no carga', Icon: IconRefresh },
  { label: 'Error al iniciar sesión', Icon: IconLock },
  { label: 'Problema al pagar', Icon: IconCreditCard },
  { label: 'Error al publicar o comprar', Icon: IconShoppingBag },
  { label: 'Otro problema técnico', Icon: IconMessage },
];
const FILTERS = ['Todos', 'Abierto', 'En revisión', 'Resuelto', 'Rechazado'];
const TICKET_PAGE_SIZE = 5;
const STEPS = ['Abierto', 'En revisión', 'Resuelto'];

const STATUS_CONFIG = {
  Resuelto: { bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#16a34a' },
  'En revisión': { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  'En revision': { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  Abierto: { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', dot: '#3b82f6' },
  Pendiente: { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', dot: '#3b82f6' },
  Cerrado: { bg: '#f3f4f6', color: '#374151', border: '#d1d5db', dot: '#6b7280' },
  Rechazado: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444' },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.Abierto;
}

function elapsedTime(dateValue) {
  if (!dateValue) return null;
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return null;
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? 'es' : ''}`;
}

function StatusBadge({ status }) {
  const styles = useThemedStyles(baseStyles);
  const config = getStatusConfig(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
      <Text style={[styles.statusText, { color: config.color }]}>{status || 'Abierto'}</Text>
    </View>
  );
}

export default function SoporteTecnico() {
  const styles = useThemedStyles(baseStyles);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIES[0].label);
  const [vistaPrincipal, setVistaPrincipal] = useState('nueva');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [pagina, setPagina] = useState(1);
  const [ticketsColapsados, setTicketsColapsados] = useState({});

  const cargar = async () => {
    try {
      const response = await getSoporte();
      setTickets(response.data || []);
      setError('');
    } catch {
      setError('No se pudieron cargar los tickets de soporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const enviarTicket = async () => {
    const asuntoTrim = asunto.trim();
    const descripcionTrim = descripcion.trim();
    if (!asuntoTrim || !descripcionTrim) {
      Alert.alert('Falta información', 'Escribe un asunto y una descripción para continuar.');
      return;
    }
    if (descripcionTrim.length < 5) {
      Alert.alert('Descripción incompleta', 'La descripción debe tener al menos 5 caracteres.');
      return;
    }

    setError('');
    setEnviando(true);
    try {
      await crearSoporte({ asunto: asuntoTrim, descripcion: descripcionTrim, categoria });
      setAsunto('');
      setDescripcion('');
      setCategoria(CATEGORIES[0].label);
      await cargar();
      Alert.alert('Listo', 'Ticket enviado al soporte técnico.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo crear el ticket.');
    } finally {
      setEnviando(false);
    }
  };

  const ticketsFiltrados = tickets.filter(
    (ticket) => filtroEstado === 'Todos' || ticket.estado === filtroEstado,
  );
  const totalPaginas = Math.max(1, Math.ceil(ticketsFiltrados.length / TICKET_PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const ticketsVisibles = ticketsFiltrados.slice(
    (paginaActual - 1) * TICKET_PAGE_SIZE,
    paginaActual * TICKET_PAGE_SIZE,
  );
  const counts = tickets.reduce((result, ticket) => {
    const status = ticket.estado || 'Abierto';
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});

  const cambiarFiltro = (filter) => {
    setFiltroEstado(filter);
    setPagina(1);
  };

  const alternarTicket = (ticketId) => {
    setTicketsColapsados((current) => ({ ...current, [ticketId]: !current[ticketId] }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[PRIMARY, PRIMARY_LIGHT]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <IconTool size={32} color={WHITE} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Soporte técnico</Text>
            <Text style={styles.heroSubtitle}>
              Reporta fallas de la plataforma. Este canal no es para pedidos o devoluciones.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.tabs}>
          {[
            { id: 'nueva', label: 'Nuevo ticket' },
            { id: 'historial', label: 'Mis tickets' },
          ].map((tab) => {
            const active = vistaPrincipal === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.tab, active && styles.activeTab]}
                onPress={() => setVistaPrincipal(tab.id)}
              >
                <Text style={[styles.tabText, active && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={cargar} accessibilityRole="button">
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {vistaPrincipal === 'nueva' ? (
          <View style={styles.formCard}>
            <View style={styles.problemTypeBox}>
              <View style={styles.problemTypeTitle}>
                <IconTool size={17} color={SECONDARY} />
                <Text style={styles.problemTypeLabel}>Tipo de problema</Text>
              </View>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(({ label, Icon }) => {
                  const active = categoria === label;
                  return (
                    <TouchableOpacity
                      key={label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.categoryButton, active && styles.categoryButtonActive]}
                      onPress={() => setCategoria(label)}
                    >
                      <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                        <Icon size={18} color={active ? WHITE : '#e05a7a'} />
                      </View>
                      <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Asunto</Text>
              <TextInput
                value={asunto}
                onChangeText={setAsunto}
                placeholder="Ej: No puedo pagar"
                placeholderTextColor="#9ca3af"
                maxLength={150}
                style={styles.input}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Describe el problema..."
                placeholderTextColor="#9ca3af"
                multiline
                minLength={5}
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, enviando && styles.disabledButton]}
              onPress={enviarTicket}
              disabled={enviando}
              accessibilityRole="button"
            >
              {enviando
                ? <ActivityIndicator color={WHITE} />
                : <Text style={styles.submitText}>Enviar</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyCard}>
            {tickets.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
              >
                {FILTERS.map((filter) => {
                  const active = filtroEstado === filter;
                  const config = filter === 'Todos'
                    ? { dot: PRIMARY, color: PRIMARY, bg: '#fdf2f4' }
                    : getStatusConfig(filter);
                  const count = filter === 'Todos' ? tickets.length : (counts[filter] || 0);
                  return (
                    <TouchableOpacity
                      key={filter}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.filterButton,
                        active && { backgroundColor: config.dot },
                      ]}
                      onPress={() => cambiarFiltro(filter)}
                    >
                      <Text style={[styles.filterText, { color: active ? WHITE : config.color }]}>
                        {filter}{count > 0 ? ` (${count})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {loading ? (
              <ActivityIndicator size="large" color={PRIMARY} style={styles.loading} />
            ) : tickets.length === 0 ? (
              <View style={styles.emptyState}>
                <IconTool size={32} color="#e05a7a" />
                <Text style={styles.emptyText}>No hay tickets</Text>
              </View>
            ) : ticketsFiltrados.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay tickets con este estado</Text>
              </View>
            ) : (
              <>
                <View style={styles.ticketList}>
                  {ticketsVisibles.map((ticket) => {
                    const ticketId = ticket.id_solicitud || ticket.id;
                    const status = ticket.estado || 'Abierto';
                    const statusConfig = getStatusConfig(status);
                    const normalizedStatus = status === 'Pendiente' ? 'Abierto' : status;
                    const progress = Math.max(0, STEPS.indexOf(normalizedStatus));
                    const collapsed = !!ticketsColapsados[ticketId];
                    const date = ticket.fecha_creacion
                      ? new Date(ticket.fecha_creacion).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                      : null;
                    const elapsed = elapsedTime(ticket.fecha_creacion);
                    const number = ticket.numero || ticketId;

                    return (
                      <View
                        key={ticketId}
                        style={[styles.ticketCard, { borderLeftColor: statusConfig.dot }]}
                      >
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityState={{ expanded: !collapsed }}
                          style={styles.ticketHeader}
                          onPress={() => alternarTicket(ticketId)}
                        >
                          <View style={styles.ticketIdentity}>
                            <View style={styles.ticketNumber}>
                              <Text style={styles.ticketNumberText}>#{number}</Text>
                            </View>
                            <View style={styles.ticketHeading}>
                              <Text style={styles.ticketTitle} numberOfLines={2}>{ticket.asunto}</Text>
                              {collapsed && (
                                <Text style={styles.collapsedMeta} numberOfLines={1}>
                                  {ticket.categoria || 'Soporte'}{elapsed ? ` · ${elapsed}` : ''}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.ticketHeaderRight}>
                            <StatusBadge status={status} />
                            <Text style={styles.expandIcon}>{collapsed ? '›' : '⌄'}</Text>
                          </View>
                        </TouchableOpacity>

                        {!collapsed && (
                          <View style={styles.ticketBody}>
                            {status !== 'Rechazado' && status !== 'Cerrado' && (
                              <View style={styles.progressBox}>
                                <View style={styles.progressLabels}>
                                  {STEPS.map((step, index) => {
                                    const done = progress >= index;
                                    const current = progress === index;
                                    return (
                                      <View key={step} style={styles.progressStep}>
                                        <View
                                          style={[
                                            styles.progressDot,
                                            done && { backgroundColor: statusConfig.dot },
                                            current && { borderColor: statusConfig.dot, borderWidth: 2 },
                                          ]}
                                        >
                                          {done && <IconCheck size={11} color={WHITE} />}
                                        </View>
                                        <Text
                                          style={[
                                            styles.progressLabel,
                                            done && { color: statusConfig.color, fontWeight: '700' },
                                          ]}
                                        >
                                          {step}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                </View>
                                <View style={styles.progressTrack}>
                                  <View
                                    style={[
                                      styles.progressFill,
                                      {
                                        backgroundColor: statusConfig.dot,
                                        width: progress === 0 ? '0%' : progress === 1 ? '50%' : '100%',
                                      },
                                    ]}
                                  />
                                </View>
                              </View>
                            )}

                            <View style={styles.ticketMetaRow}>
                              <Text style={styles.categoryTag}>{ticket.categoria || 'Soporte'}</Text>
                              {!!date && <Text style={styles.ticketDate}>{date}</Text>}
                              {!!elapsed && <Text style={styles.elapsedText}>{elapsed}</Text>}
                            </View>
                            {!!ticket.descripcion && (
                              <View style={styles.descriptionBox}>
                                <Text style={styles.ticketDescription}>{ticket.descripcion}</Text>
                              </View>
                            )}
                            {!!ticket.respuesta && (
                              <View style={styles.responseBox}>
                                <Text style={styles.responseText}>
                                  <Text style={styles.responseLabel}>Soporte: </Text>
                                  {ticket.respuesta}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {ticketsFiltrados.length > 0 && (
                  <View style={styles.pagination}>
                    <Text style={styles.paginationSummary}>
                      {(paginaActual - 1) * TICKET_PAGE_SIZE + 1}-
                      {Math.min(paginaActual * TICKET_PAGE_SIZE, ticketsFiltrados.length)} de {ticketsFiltrados.length}
                    </Text>
                    <View style={styles.paginationControls}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Página anterior"
                        disabled={paginaActual === 1}
                        onPress={() => setPagina(paginaActual - 1)}
                        style={styles.pageButton}
                      >
                        <Text style={[styles.pageButtonText, paginaActual === 1 && styles.pageDisabled]}>‹</Text>
                      </TouchableOpacity>
                      {Array.from({ length: totalPaginas }, (_, index) => index + 1)
                        .filter((page) => page >= Math.max(1, Math.min(paginaActual - 2, totalPaginas - 4))
                          && page <= Math.min(totalPaginas, Math.max(5, paginaActual + 2)))
                        .map((page) => (
                          <TouchableOpacity
                            key={page}
                            accessibilityRole="button"
                            accessibilityLabel={`Página ${page}`}
                            accessibilityState={{ selected: paginaActual === page }}
                            onPress={() => setPagina(page)}
                            style={[styles.pageButton, paginaActual === page && styles.activePageButton]}
                          >
                            <Text style={[styles.pageButtonText, paginaActual === page && styles.activePageText]}>
                              {page}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Página siguiente"
                        disabled={paginaActual === totalPaginas}
                        onPress={() => setPagina(paginaActual + 1)}
                        style={styles.pageButton}
                      >
                        <Text style={[styles.pageButtonText, paginaActual === totalPaginas && styles.pageDisabled]}>›</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}
        <Footer onLinkPress={() => {}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f7f6f6',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: WHITE,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  activeTab: {
    backgroundColor: WHITE,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: PRIMARY,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  retryText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  problemTypeBox: {
    padding: 12,
    backgroundColor: SUB_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    marginBottom: 14,
  },
  problemTypeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  problemTypeLabel: {
    color: SECONDARY,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '48%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#fdf8f9',
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f7e9ee',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryIconActive: {
    backgroundColor: PRIMARY,
  },
  categoryText: {
    color: SECONDARY,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    flex: 1,
  },
  categoryTextActive: {
    color: PRIMARY,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    color: SECONDARY,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    minHeight: 44,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    lineHeight: 20,
  },
  submitButton: {
    minHeight: 46,
    backgroundColor: PRIMARY,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
    minWidth: 104,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filters: {
    gap: 5,
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loading: {
    marginVertical: 26,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ticketHeader: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fdf8f9',
  },
  ticketIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minWidth: 0,
  },
  ticketNumber: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ticketNumberText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
  },
  ticketHeading: {
    flex: 1,
    minWidth: 0,
  },
  ticketTitle: {
    color: TEXT,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  collapsedMeta: {
    color: MUTED,
    fontSize: 10,
    marginTop: 3,
  },
  ticketHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statusBadge: {
    minHeight: 27,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  expandIcon: {
    width: 22,
    color: PRIMARY,
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 24,
  },
  ticketBody: {
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0e8ec',
  },
  progressBox: {
    padding: 10,
    backgroundColor: SUB_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 7,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  progressStep: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressDot: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  progressLabel: {
    color: MUTED,
    fontSize: 9,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    overflow: 'hidden',
    backgroundColor: '#fdf2f4',
    borderWidth: 1,
    borderColor: '#f0dde4',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: PRIMARY,
    fontSize: 10,
    fontWeight: '600',
  },
  ticketDate: {
    color: MUTED,
    fontSize: 10,
  },
  elapsedText: {
    color: MUTED,
    fontSize: 10,
    marginLeft: 'auto',
  },
  descriptionBox: {
    padding: 9,
    backgroundColor: SUB_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
  },
  ticketDescription: {
    color: SECONDARY,
    fontSize: 13,
    lineHeight: 19,
  },
  responseBox: {
    padding: 9,
    backgroundColor: '#fdf8f9',
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
    borderRadius: 6,
  },
  responseText: {
    color: SECONDARY,
    fontSize: 12,
    lineHeight: 18,
  },
  responseLabel: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: '700',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 14,
    paddingTop: 12,
  },
  paginationSummary: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '500',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pageButton: {
    minWidth: 30,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    backgroundColor: WHITE,
  },
  pageButtonText: {
    color: SECONDARY,
    fontSize: 13,
    fontWeight: '600',
  },
  pageDisabled: {
    color: '#9ca3af',
  },
  activePageButton: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  activePageText: {
    color: WHITE,
  },
});

const styles = baseStyles;
