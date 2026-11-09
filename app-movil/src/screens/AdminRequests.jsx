import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiBaseUrl, getMensajesSolicitudAdmin, enviarMensajeSolicitudAdmin, resolverSolicitudAdmin } from '../services/api';
import { IconAlertTriangle, IconCheck, IconEye, IconEyeOff, IconMail, IconMessage, IconStoreAlt, IconTool, IconUser } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const BORDER = '#E0DBD4';
const GRAY = '#666';
const STATES = ['Todos', 'Abierto', 'En revisión', 'Resuelto', 'Rechazado'];
const STATE_FILTER_STYLES = {
  Todos: { active: '#7A1E3A', inactiveBg: '#FDF8F9', inactiveBorder: '#F0DDE4', inactiveText: '#7A1E3A', dot: '#7A1E3A' },
  Abierto: { active: '#2563EB', inactiveBg: '#EFF6FF', inactiveBorder: '#BFDBFE', inactiveText: '#1E40AF', dot: '#3B82F6' },
  'En revisión': { active: '#EA580C', inactiveBg: '#FFF7ED', inactiveBorder: '#FED7AA', inactiveText: '#C2410C', dot: '#EA580C' },
  Resuelto: { active: '#16A34A', inactiveBg: '#F0FDF4', inactiveBorder: '#BBF7D0', inactiveText: '#15803D', dot: '#16A34A' },
  Rechazado: { active: '#DC2626', inactiveBg: '#FEF2F2', inactiveBorder: '#FECACA', inactiveText: '#B91C1C', dot: '#EF4444' },
};
const ITEMS_PER_PAGE = 10;

const normalizeState = (state) => (state || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const stateStyle = (state) => {
  const key = normalizeState(state);
  if (key === 'resuelto') return { bg: '#DCFCE7', border: '#BBF7D0', color: '#166534' };
  if (key === 'rechazado') return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };
  if (key.includes('revision')) return { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C' };
  return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };
};

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

function ActionButton({ label, color, backgroundColor, onPress, disabled, wide, Icon, solid }) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        wide && styles.actionButtonWide,
        solid && styles.actionButtonSolid,
        { backgroundColor, borderColor: color },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {Icon ? <Icon size={16} color={solid ? '#FFFFFF' : color} /> : null}
      <Text style={[styles.actionText, { color: solid ? '#FFFFFF' : color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RequestCard({ item, isSupport, onOpenChat, onSetResolution }) {
  const [expanded, setExpanded] = useState(false);
  const status = stateStyle(item.estado);
  const imagePath = item.imagen_libro;
  const imageUri = imagePath
    ? String(imagePath).startsWith('http') ? imagePath : `${getApiBaseUrl()}/${String(imagePath).replace(/^\/+/, '')}`
    : null;
  const evidencePath = item.evidencia_url;
  const evidenceUri = evidencePath
    ? String(evidencePath).startsWith('http') ? evidencePath : `${getApiBaseUrl()}/${String(evidencePath).replace(/^\/+/, '')}`
    : null;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={[styles.cardHeader, expanded && styles.cardHeaderExpanded]}
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Ocultar detalles' : 'Ver detalles'}
        accessibilityState={{ expanded }}
      >
        <View style={styles.cardHeaderTop}>
          {imageUri
            ? <Image source={{ uri: imageUri }} style={styles.bookThumbnail} resizeMode="cover" />
            : <View style={styles.cardFallback}><Text style={styles.cardFallbackText}>#{item.numero || item.id_solicitud}</Text></View>}
          <View style={styles.cardMain}>
            <View style={styles.cardEyebrow}>
              <Text style={styles.cardEyebrowText}>{isSupport ? 'Solicitud' : 'Reclamo'} #{item.numero || item.id_solicitud}</Text>
              {item.id_orden ? <Text style={styles.orderPill}>Orden #{item.id_orden}</Text> : null}
              <View style={styles.cardEyebrowRight}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={[styles.status, { color: status.color }]} numberOfLines={1}>{item.estado || 'Abierto'}</Text>
                </View>
                <View style={styles.expandIcon}>
                  {expanded ? <IconEyeOff size={16} color={PRIMARY} /> : <IconEye size={16} color={PRIMARY} />}
                </View>
              </View>
            </View>
            <Text style={styles.cardBookTitle} numberOfLines={2}>
              {item.titulo_libro || (item.id_orden ? `Orden #${item.id_orden}` : item.asunto || (isSupport ? 'Solicitud de soporte' : 'Queja o reclamo'))}
              {item.total_items > 1 ? <Text style={styles.additionalItems}> +{item.total_items - 1} más</Text> : null}
            </Text>
            <Text style={styles.cardBuyer} numberOfLines={1}>
              Comprador: <Text style={styles.cardBuyerStrong}>{item.comprador || 'Usuario'}</Text>
            </Text>
            {item.nombre_tienda ? (
              <Text style={styles.cardBuyer} numberOfLines={1}>
                Tienda:                 <Text style={styles.cardStore}>{item.nombre_tienda}</Text>
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardDetails}>
          <View style={styles.detailChips}>
            {item.asunto ? <Text style={styles.reasonChip}>{item.asunto}</Text> : null}
            {item.nombre_tienda ? <View style={styles.storeChip}><IconStoreAlt size={13} color="#0369A1" /><Text style={styles.storeChipText}>{item.nombre_tienda}</Text></View> : null}
            {item.total_orden ? <Text style={styles.totalChip}>${Number(item.total_orden).toLocaleString('es-CO')}</Text> : null}
              {item.fecha_creacion ? <Text style={styles.dateChip}>{formatDate(item.fecha_creacion)}</Text> : null}
          </View>
          {item.descripcion ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Detalle del reclamo por el cliente</Text>
              <Text style={styles.descriptionText}>{item.descripcion}</Text>
            </View>
          ) : null}
          {evidenceUri ? (
            <View style={styles.evidenceCard}>
              <Image source={{ uri: evidenceUri }} style={styles.evidenceThumbnail} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.evidenceTitle}>Evidencia gráfica adjunta</Text>
                <Text style={styles.evidenceHint}>Imagen enviada por el usuario.</Text>
              </View>
            </View>
          ) : null}
          {item.respuesta ? (
            <View style={styles.answerBox}>
              <Text style={styles.answerLabel}>Respuesta actual del administrador</Text>
              <Text style={styles.answerText}>{item.respuesta}</Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            {!isSupport && (
              <ActionButton
                wide
                label="Contactar / Chat con la tienda"
                color={PRIMARY}
                backgroundColor="#FDF8F9"
                Icon={IconStoreAlt}
                onPress={() => onOpenChat(item)}
              />
            )}
            <View style={styles.actionRow}>
              <ActionButton
                label={isSupport ? 'En revisión' : 'Marcar En revisión'}
                color={isSupport ? '#C2410C' : '#EA580C'}
                backgroundColor="#FFF7ED"
                Icon={IconTool}
                onPress={() => onSetResolution(item, 'En revisión')}
              />
              <ActionButton
                label={isSupport ? 'Rechazar solicitud' : 'Rechazar reclamo'}
                color={isSupport ? '#B91C1C' : '#DC2626'}
                backgroundColor="#FEF2F2"
                Icon={IconAlertTriangle}
                onPress={() => onSetResolution(item, 'Rechazado')}
              />
            </View>
            <ActionButton
              wide
              label={isSupport ? 'Cerrar solicitud' : 'Resolver reclamo'}
              color={PRIMARY}
              backgroundColor={PRIMARY}
              Icon={IconCheck}
              solid
              onPress={() => onSetResolution(item, 'Resuelto')}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function SupportRequestCard({ item, onSetResolution }) {
  const [expanded, setExpanded] = useState(false);
  const status = stateStyle(item.estado);
  const photoPath = item.foto_comprador;
  const photoUri = photoPath
    ? String(photoPath).startsWith('http') ? photoPath : `${getApiBaseUrl()}/${String(photoPath).replace(/^\/+/, '')}`
    : null;
  const userName = item.comprador || 'Usuario';
  const userRole = (item.rol_usuario || '').toLowerCase() === 'vendedor' ? 'Vendedor' : 'Comprador';

  return (
    <View style={[styles.supportCard, { borderLeftColor: status.color }]}>
      <TouchableOpacity
        style={[styles.supportHeader, expanded && styles.supportHeaderExpanded]}
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Ocultar detalles del ticket' : 'Ver detalles del ticket'}
        accessibilityState={{ expanded }}
      >
        <View style={styles.supportIdentity}>
          <View style={styles.supportAvatar}>
            <Text style={styles.supportAvatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
            {photoUri ? <Image source={{ uri: photoUri }} style={styles.supportAvatarImage} resizeMode="cover" /> : null}
          </View>
          <View style={styles.supportIdentityContent}>
            <View style={styles.supportIdentityTags}>
              <Text style={styles.supportTicket}>TICKET #{item.numero || item.id_solicitud}</Text>
              <View style={styles.supportRole}>
                <IconUser size={12} color={PRIMARY} />
                <Text style={styles.supportRoleText}>{userRole}</Text>
              </View>
            </View>
            <Text style={styles.supportName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.supportSubjectPreview} numberOfLines={1}>{item.asunto || 'Solicitud de soporte'}</Text>
          </View>
        </View>
        <View style={styles.supportHeaderActions}>
          <View style={[styles.supportStatus, { backgroundColor: status.bg, borderColor: status.border }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.supportStatusText, { color: status.color }]} numberOfLines={1}>{item.estado || 'Abierto'}</Text>
          </View>
          <View style={styles.expandIcon}>
            {expanded ? <IconEyeOff size={16} color={PRIMARY} /> : <IconEye size={16} color={PRIMARY} />}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && <View style={styles.supportDetails}>
        <View style={styles.supportMetadata}>
          <View style={styles.supportCategory}>
            <IconTool size={14} color={PRIMARY} />
            <Text style={styles.supportCategoryText}>{item.categoria || 'Soporte'}</Text>
          </View>
          {item.correo_comprador ? (
            <View style={styles.supportEmail}>
              <IconMail size={14} color="#0369A1" />
              <Text style={styles.supportEmailText}>{item.correo_comprador}</Text>
            </View>
          ) : null}
          {item.fecha_creacion ? <Text style={styles.supportDate}>{formatDate(item.fecha_creacion)}</Text> : null}
        </View>

        <View style={styles.supportDescription}>
          <Text style={styles.supportSubject}>{item.asunto || 'Solicitud de soporte'}</Text>
          <Text style={styles.descriptionText}>{item.descripcion || 'Sin descripción.'}</Text>
        </View>

        {item.respuesta ? (
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>Respuesta del administrador</Text>
            <Text style={styles.answerText}>{item.respuesta}</Text>
          </View>
        ) : null}

        <View style={styles.supportActions}>
          <View style={styles.actionRow}>
            <ActionButton
              label="Marcar en revisión"
              color="#C2410C"
              backgroundColor="#FFFFFF"
              Icon={IconEye}
              onPress={() => onSetResolution(item, 'En revisión')}
            />
            <ActionButton
              label="Rechazar ticket"
              color="#DC2626"
              backgroundColor="#FEF2F2"
              Icon={IconAlertTriangle}
              onPress={() => onSetResolution(item, 'Rechazado')}
            />
          </View>
          <ActionButton
            wide
            label="Resolver y notificar"
            color={PRIMARY}
            backgroundColor={PRIMARY}
            Icon={IconCheck}
            solid
            onPress={() => onSetResolution(item, 'Resuelto')}
          />
        </View>
      </View>}
    </View>
  );
}

export default function AdminRequests({ type, solicitudes = [], loading, refreshing, error, onRefresh }) {
  const isSupport = type === 'soporte';
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [roleFilter, setRoleFilter] = useState('comprador');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const listRef = useRef(null);

  const sectionItems = useMemo(() => {
    const requestType = (item) => (item.tipo_solicitud || '').toLowerCase();
    const q = query.trim().toLowerCase();
    return solicitudes
      .filter((item) => requestType(item) === (isSupport ? 'soporte' : 'reclamo'))
      .filter((item) => !isSupport || (item.rol_usuario || 'comprador').toLowerCase() === roleFilter)
      .filter((item) => stateFilter === 'Todos' || normalizeState(item.estado) === normalizeState(stateFilter))
      .filter((item) => isSupport || !q || [
        item.comprador, item.nombre_tienda, item.asunto, item.descripcion,
        item.id_solicitud, item.id_orden, item.titulo_libro,
      ].some((value) => String(value || '').toLowerCase().includes(q)));
  }, [solicitudes, isSupport, roleFilter, stateFilter, query]);
  const totalPages = Math.max(1, Math.ceil(sectionItems.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = sectionItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [query, stateFilter, roleFilter, type, solicitudes]);

  const changePage = (nextPage) => {
    setPage(nextPage);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const updateRequest = async () => {
    if (!resolution?.item) return;
    if (answer.trim().length < 3) {
      Alert.alert('Respuesta requerida', 'Escribe al menos 3 caracteres para actualizar y notificar la solicitud.');
      return;
    }
    setSaving(true);
    try {
      await resolverSolicitudAdmin(resolution.item.id_solicitud, resolution.state, answer.trim());
      setResolution(null);
      setAnswer('');
      Alert.alert('Actualizado', 'La solicitud se actualizó y el usuario fue notificado.');
      await onRefresh?.();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo actualizar la solicitud.');
    } finally {
      setSaving(false);
    }
  };

  const openChat = async (item) => {
    setSelected(item);
    setChatMessages([]);
    setChatText('');
    setChatLoading(true);
    try {
      const response = await getMensajesSolicitudAdmin(item.id_solicitud);
      setChatMessages(response.data || []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo cargar la conversación.');
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatText.trim() || !selected || sending) return;
    setSending(true);
    try {
      await enviarMensajeSolicitudAdmin(selected.id_solicitud, chatText.trim());
      setChatText('');
      const response = await getMensajesSolicitudAdmin(selected.id_solicitud);
      setChatMessages(response.data || []);
      await onRefresh?.();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const setRequestResolution = (request, state) => {
    setResolution({ item: request, state });
    setAnswer(request.respuesta || '');
  };

  const renderItem = ({ item }) => isSupport
    ? <SupportRequestCard item={item} onSetResolution={setRequestResolution} />
    : <RequestCard item={item} onOpenChat={openChat} onSetResolution={setRequestResolution} />;

  const counts = useMemo(() => ({
    total: solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo')).length,
    open: solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo') && item.estado === 'Abierto').length,
    review: solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo') && ['En revisión', 'En revision'].includes(item.estado)).length,
    resolved: solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo') && item.estado === 'Resuelto').length,
  }), [solicitudes, isSupport]);
  const stateCounts = useMemo(() => {
    const items = solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === (isSupport ? 'soporte' : 'reclamo'));
    return STATES.reduce((result, state) => {
      result[state] = state === 'Todos'
        ? items.length
        : items.filter((item) => normalizeState(item.estado) === normalizeState(state)).length;
      return result;
    }, {});
  }, [solicitudes, isSupport]);
  const supportRoleCounts = useMemo(() => {
    const supportItems = solicitudes.filter((item) => (item.tipo_solicitud || '').toLowerCase() === 'soporte');
    return {
      comprador: supportItems.filter((item) => (item.rol_usuario || 'comprador').toLowerCase() === 'comprador').length,
      vendedor: supportItems.filter((item) => (item.rol_usuario || 'comprador').toLowerCase() === 'vendedor').length,
    };
  }, [solicitudes]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={paginatedItems}
        keyExtractor={(item) => String(item.id_solicitud)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[PRIMARY]} tintColor={PRIMARY} />}
        ListHeaderComponent={
          <View>
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
                  <Text style={styles.retryText}>{refreshing ? 'Cargando...' : 'Reintentar'}</Text>
                </TouchableOpacity>
              </View>
            )}
            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.loadingText}>Cargando solicitudes...</Text>
              </View>
            )}
            {!isSupport && (
              <View style={styles.statsRow}>
                {[
                  ['Total', counts.total, PRIMARY],
                  ['Abiertos', counts.open, '#1D4ED8'],
                  ['En revisión', counts.review, '#C2410C'],
                  ['Resueltos', counts.resolved, '#166534'],
                ].map(([label, value, color]) => (
                  <View key={label} style={styles.stat}>
                    <Text style={[styles.statValue, { color }]}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            )}
            {isSupport && (
              <View style={styles.supportFilters}>
                {['comprador', 'vendedor'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setRoleFilter(role)}
                    style={[styles.supportRoleFilter, roleFilter === role && styles.supportRoleFilterActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: roleFilter === role }}
                  >
                    <IconTool size={16} color={roleFilter === role ? '#FFFFFF' : PRIMARY} />
                    <Text style={[styles.filterText, roleFilter === role && styles.filterTextActive]}>
                      {role === 'comprador' ? 'Compradores' : 'Vendedores'}
                    </Text>
                    <Text style={[styles.supportRoleCount, roleFilter === role && styles.supportRoleCountActive]}>{supportRoleCounts[role]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {!isSupport && (
              <>
                <TextInput
                  style={styles.search}
                  placeholder="Buscar comprador, tienda, orden o ID..."
                  placeholderTextColor="#8A8A8A"
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                />
              </>
            )}
            <View style={styles.filterPanel}>
              <Text style={styles.filterSectionTitle}>Filtrar por estado</Text>
              <View style={styles.stateFilters}>
                {STATES.map((state) => (
                  <TouchableOpacity
                    key={state}
                    onPress={() => setStateFilter(state)}
                    style={[
                      styles.stateFilterPill,
                      {
                        backgroundColor: stateFilter === state ? STATE_FILTER_STYLES[state].active : STATE_FILTER_STYLES[state].inactiveBg,
                        borderColor: stateFilter === state ? STATE_FILTER_STYLES[state].active : STATE_FILTER_STYLES[state].inactiveBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${state}: ${stateCounts[state]}`}
                    accessibilityState={{ selected: stateFilter === state }}
                  >
                    <View style={[styles.stateFilterDot, { backgroundColor: stateFilter === state ? '#FFFFFF' : STATE_FILTER_STYLES[state].dot }]} />
                    <Text style={[styles.stateFilterText, { color: stateFilter === state ? '#FFFFFF' : STATE_FILTER_STYLES[state].inactiveText }]}>
                      {state === 'En revisión' ? 'Revisión' : state === 'Rechazado' ? 'Rechaz.' : state}
                    </Text>
                    <Text style={[
                      styles.stateFilterCount,
                      {
                        backgroundColor: stateFilter === state ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.06)',
                        color: stateFilter === state ? '#FFFFFF' : STATE_FILTER_STYLES[state].inactiveText,
                      },
                    ]}>{stateCounts[state]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={styles.resultCount}>{sectionItems.length} {isSupport ? 'ticket(s)' : 'solicitud(es)'}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{isSupport ? `No hay tickets para ${roleFilter === 'comprador' ? 'compradores' : 'vendedores'}.` : 'No hay solicitudes que coincidan con los filtros.'}</Text>}
        ListFooterComponent={sectionItems.length > 0 ? (
          <View style={styles.pagination}>
            <Text style={styles.paginationSummary}>
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sectionItems.length)} de {sectionItems.length}
            </Text>
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => changePage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                accessibilityLabel="Página anterior"
              >
                <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>{currentPage} / {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => changePage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                accessibilityLabel="Página siguiente"
              >
                <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={!!resolution} transparent animationType="fade" onRequestClose={() => !saving && setResolution(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {resolution?.state === 'Resuelto' ? 'Resolver solicitud' : `${resolution?.state || ''} solicitud`}
            </Text>
            <Text style={styles.modalHint}>Escribe la respuesta que recibirá el usuario.</Text>
            <TextInput
              style={styles.answerInput}
              multiline
              maxLength={1000}
              value={answer}
              onChangeText={setAnswer}
              placeholder="Respuesta (mínimo 3 caracteres)"
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <ActionButton label="Cancelar" color={GRAY} backgroundColor="#F3F4F6" disabled={saving} onPress={() => setResolution(null)} />
              <TouchableOpacity style={[styles.confirmButton, saving && styles.disabled]} onPress={updateRequest} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Guardar y notificar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.chatPage}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.closeText}>Cerrar</Text></TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatTitle}>Conversación #{selected?.id_solicitud}</Text>
              <Text style={styles.metaText}>{selected?.comprador || 'Comprador'}{selected?.nombre_tienda ? ` · ${selected.nombre_tienda}` : ''}</Text>
            </View>
          </View>
          {chatLoading ? <ActivityIndicator style={{ marginTop: 24 }} color={PRIMARY} /> : (
            <FlatList
              data={chatMessages}
              keyExtractor={(message, index) => String(message.id_mensaje || index)}
              contentContainerStyle={styles.chatList}
              ListEmptyComponent={<Text style={styles.empty}>Aún no hay mensajes en esta conversación.</Text>}
              renderItem={({ item }) => (
                <View style={styles.message}>
                  <Text style={styles.messageAuthor}>{item.nombre_usuario || item.rol || 'Usuario'}</Text>
                  <Text style={styles.messageText}>{item.mensaje}</Text>
                  <Text style={styles.messageDate}>{formatDate(item.fecha_creacion)}</Text>
                </View>
              )}
            />
          )}
          <View style={styles.chatComposer}>
            <TextInput style={styles.chatInput} value={chatText} onChangeText={setChatText} placeholder="Escribe un mensaje..." multiline />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending || !chatText.trim()}>
              {sending ? <ActivityIndicator color="#fff" /> : <IconMessage size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  list: { padding: 14, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  stat: { flexGrow: 1, flexBasis: '22%', minWidth: 72, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 10 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: GRAY, marginTop: 3, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  filterPill: { borderWidth: 1, borderColor: BORDER, backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  filterPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterText: { color: GRAY, fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: '#fff' },
  supportFilters: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  supportRoleFilter: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 8 },
  supportRoleFilterActive: { backgroundColor: PRIMARY, borderColor: PRIMARY, elevation: 2 },
  supportRoleCount: { color: PRIMARY, backgroundColor: '#F7E9EE', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: '800' },
  supportRoleCountActive: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.25)' },
  filterPanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, marginBottom: 10 },
  filterSectionTitle: { color: '#555', fontSize: 10, fontWeight: '800', marginBottom: 6 },
  search: { backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#222', marginBottom: 8 },
  stateFilters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: 6, rowGap: 6 },
  stateFilterPill: { flexBasis: '31%', minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 4, paddingVertical: 4 },
  stateFilterDot: { width: 6, height: 6, borderRadius: 3 },
  stateFilterText: { fontSize: 9, fontWeight: '700' },
  stateFilterCount: { minWidth: 16, overflow: 'hidden', textAlign: 'center', borderRadius: 8, paddingHorizontal: 3, paddingVertical: 2, fontSize: 8, fontWeight: '800' },
  resultCount: { color: GRAY, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  errorBox: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#991B1B', fontSize: 12, lineHeight: 18 },
  retryText: { color: PRIMARY, fontSize: 12, fontWeight: '800', marginTop: 7 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderRadius: 10, padding: 11, marginBottom: 10 },
  loadingText: { color: GRAY, fontSize: 12, fontWeight: '700' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4, paddingBottom: 16 },
  paginationSummary: { color: GRAY, fontSize: 11, flex: 1 },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageButton: { width: 34, height: 34, borderWidth: 1, borderColor: PRIMARY, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  pageButtonDisabled: { borderColor: BORDER, backgroundColor: '#F3F4F6' },
  pageButtonText: { color: PRIMARY, fontSize: 22, fontWeight: '700', lineHeight: 25 },
  pageButtonTextDisabled: { color: '#A8A29E' },
  pageIndicator: { color: '#222', fontSize: 11, fontWeight: '800', minWidth: 38, textAlign: 'center' },
  supportCard: { backgroundColor: '#fff', borderRadius: 15, borderWidth: 1.5, borderColor: '#EEE3E9', borderLeftWidth: 5, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  supportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 12, backgroundColor: '#FCF7F9' },
  supportHeaderExpanded: { borderBottomWidth: 1, borderBottomColor: '#F0E8EC' },
  supportHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  supportIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  supportAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', elevation: 2, overflow: 'hidden' },
  supportAvatarInitial: { color: '#fff', fontSize: 16, fontWeight: '800' },
  supportAvatarImage: { position: 'absolute', width: '100%', height: '100%', borderRadius: 22 },
  supportIdentityContent: { flex: 1, minWidth: 0 },
  supportIdentityTags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginBottom: 4 },
  supportTicket: { color: '#fff', backgroundColor: PRIMARY, overflow: 'hidden', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, fontSize: 9, fontWeight: '800' },
  supportRole: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECDCE3', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  supportRoleText: { color: PRIMARY, fontSize: 9, fontWeight: '700' },
  supportName: { color: '#252525', fontSize: 13, fontWeight: '800' },
  supportSubjectPreview: { color: GRAY, fontSize: 11, marginTop: 2 },
  supportStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 14, paddingHorizontal: 7, paddingVertical: 5 },
  supportStatusText: { fontSize: 9, fontWeight: '800' },
  supportDetails: { padding: 12, gap: 10 },
  supportMetadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  supportCategory: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FDF2F4', borderWidth: 1, borderColor: '#F0DDE4', borderRadius: 15, paddingHorizontal: 9, paddingVertical: 6 },
  supportCategoryText: { color: PRIMARY, fontSize: 10, fontWeight: '700' },
  supportEmail: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 15, paddingHorizontal: 9, paddingVertical: 6 },
  supportEmailText: { flexShrink: 1, color: '#0369A1', fontSize: 10, fontWeight: '600' },
  supportDate: { color: '#6B7280', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 15, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '600' },
  supportDescription: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 10, padding: 11 },
  supportSubject: { color: '#252525', fontSize: 12, fontWeight: '800', marginBottom: 5 },
  supportActions: { gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  card: { backgroundColor: '#fff', borderRadius: 15, borderWidth: 1.5, borderColor: '#B9A99A', marginBottom: 12, elevation: 2, overflow: 'hidden' },
  cardHeader: { padding: 13 },
  cardHeaderExpanded: { borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#FFFCFA' },
  cardHeaderTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  bookThumbnail: { width: 54, height: 68, borderRadius: 9, backgroundColor: '#F3F4F6' },
  cardFallback: { width: 54, height: 68, borderRadius: 9, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cardFallbackText: { color: '#fff', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  cardMain: { flex: 1, minWidth: 0 },
  cardEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  cardEyebrowText: { fontSize: 10, color: GRAY, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardEyebrowRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  orderPill: { backgroundColor: '#F7E9EE', color: PRIMARY, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, fontSize: 10, fontWeight: '800' },
  cardBookTitle: { color: '#252525', fontSize: 14, lineHeight: 19, fontWeight: '800' },
  additionalItems: { color: GRAY, fontSize: 12, fontWeight: '500' },
  cardBuyer: { color: GRAY, fontSize: 11, marginTop: 3 },
  cardBuyerStrong: { color: '#252525', fontWeight: '700' },
  cardStore: { color: PRIMARY, fontWeight: '800' },
  statusBadge: { minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  status: { fontSize: 9, fontWeight: '800' },
  expandIcon: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#F0DDE4', backgroundColor: '#FDF2F4', alignItems: 'center', justifyContent: 'center' },
  cardDetails: { padding: 13, gap: 11 },
  detailChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  reasonChip: { color: PRIMARY, backgroundColor: '#FDF2F4', borderColor: '#F0DDE4', borderWidth: 1, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '700' },
  storeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1, borderRadius: 15, paddingHorizontal: 9, paddingVertical: 6 },
  storeChipText: { color: '#0369A1', fontSize: 11, fontWeight: '700' },
  totalChip: { color: '#166534', backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '700' },
  dateChip: { color: GRAY, backgroundColor: '#FAFAFA', borderColor: BORDER, borderWidth: 1, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '600' },
  descriptionBox: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: BORDER, borderRadius: 11, padding: 12 },
  descriptionLabel: { color: GRAY, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 5 },
  descriptionText: { color: '#252525', fontSize: 13, lineHeight: 19 },
  evidenceCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FDF8F9', borderWidth: 1, borderColor: '#F0DDE4', borderRadius: 11, padding: 10 },
  evidenceThumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F3F4F6' },
  evidenceTitle: { color: PRIMARY, fontSize: 12, fontWeight: '800' },
  evidenceHint: { color: GRAY, fontSize: 11, marginTop: 3 },
  answerBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 11, borderLeftWidth: 3, borderLeftColor: PRIMARY },
  answerLabel: { color: PRIMARY, fontWeight: '800', fontSize: 11, marginBottom: 4 },
  answerText: { color: '#374151', fontSize: 12, lineHeight: 18 },
  actions: { gap: 9, marginTop: 3, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER },
  actionRow: { flexDirection: 'row', gap: 9 },
  actionButton: { flex: 1, minHeight: 44, flexDirection: 'row', gap: 7, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  actionButtonWide: { width: '100%', flex: 0 },
  actionButtonSolid: { borderWidth: 0, elevation: 2 },
  actionText: { flexShrink: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.55 },
  empty: { color: GRAY, textAlign: 'center', paddingVertical: 36, fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#222' },
  modalHint: { fontSize: 13, color: GRAY, marginVertical: 8 },
  answerInput: { minHeight: 110, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 12, color: '#222' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 14 },
  confirmButton: { backgroundColor: PRIMARY, minHeight: 38, justifyContent: 'center', borderRadius: 9, paddingHorizontal: 12 },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chatPage: { flex: 1, backgroundColor: BG, paddingTop: 24 },
  chatHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  closeText: { color: PRIMARY, fontSize: 13, fontWeight: '800' },
  chatTitle: { color: '#222', fontSize: 16, fontWeight: '800' },
  chatList: { padding: 14, flexGrow: 1 },
  message: { alignSelf: 'flex-start', maxWidth: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 11, marginBottom: 9, borderWidth: 1, borderColor: BORDER },
  messageAuthor: { fontSize: 11, color: PRIMARY, fontWeight: '800', marginBottom: 4 },
  messageText: { color: '#333', fontSize: 13, lineHeight: 18 },
  messageDate: { color: '#888', fontSize: 10, marginTop: 5, textAlign: 'right' },
  chatComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: BORDER },
  chatInput: { flex: 1, maxHeight: 100, borderWidth: 1, borderColor: BORDER, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, color: '#222' },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY },
});
