import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteNotification,
  deleteNotificationsByFilter,
  getNotifications,
  getOrdenes,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import SidebarMenu from '../components/SidebarMenu';
import SidebarVendedor from '../components/SidebarVendedor';
import Footer from '../components/Footer';
import {
  IconCreditCard,
  IconMessage,
  IconPackage,
  IconShoppingBag,
  IconStar,
  IconTruck,
} from '../components/Icons';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#FAF8F6';
const BORDER = '#E8E4DF';
const TEXT = '#1A1A1A';
const MUTED = '#8A8A8A';

const BUYER_FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'no_leidas', label: 'No leídas' },
  { key: 'pedidos_envios', label: 'Pedidos y envíos', types: ['pedido', 'entrega', 'pago'] },
  { key: 'reclamos', label: 'Reclamos y soporte', types: ['sistema'] },
  { key: 'mensajes', label: 'Mensajes', types: ['mensaje'] },
];

const DELETE_OPTIONS = [
  { value: 'leidas', label: 'Solo las leídas' },
  { value: 'hoy', label: 'De hoy' },
  { value: 'semana', label: 'De los últimos 7 días' },
  { value: 'mes', label: 'Del último mes' },
  { value: 'todas', label: 'Todas las notificaciones' },
];

const PAGE_SIZES = [5, 10, 20, 50];

const getIcon = (type) => ({
  mensaje: <IconMessage size={22} color={PRIMARY} />,
  resena: <IconStar size={22} color="#FFA500" />,
  oferta: <Text style={styles.iconText}>🎉</Text>,
  pedido: <IconShoppingBag size={22} color={PRIMARY} />,
  entrega: <IconTruck size={22} color={PRIMARY} />,
  pago: <IconCreditCard size={22} color="#10B981" />,
  sistema: <Text style={styles.iconText}>ℹ️</Text>,
  venta: <IconShoppingBag size={22} color={PRIMARY} />,
  devolucion: <IconPackage size={22} color={PRIMARY} />,
}[type] ?? <IconShoppingBag size={22} color={PRIMARY} />);

const cleanTitle = (title = '') =>
  title.replace(/^[\s\S]{0,3}?(?=\p{L})/u, '').trim() || title.trim();

const formatDate = (raw) => {
  if (!raw) return '';
  try {
    const date = new Date(String(raw).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(raw);
    return `${date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} · ${date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return String(raw);
  }
};

const getSyntheticOrderNotifications = (orders, readIds, deletedIds) => {
  const generated = [];
  const completedStates = [
    'completada', 'pagada', 'pagado', 'entregada', 'entregado', 'enviado', 'procesando',
  ];

  orders.forEach((order) => {
    const status = String(order?.estado || '').toLowerCase();
    if (!order?.id_orden) return;

    const total = Number(order.total).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    let id;
    let type;
    let title;
    let description;

    if (status === 'pendiente') {
      id = `orden-pendiente-${order.id_orden}`;
      type = 'pago';
      title = 'Pago Pendiente';
      description = `Tienes un pago pendiente de ${total} para la orden #${order.id_orden}`;
    } else if (completedStates.includes(status)) {
      const delivered = ['entregada', 'entregado'].includes(status);
      const shipping = ['enviado', 'procesando'].includes(status);
      id = `orden-estado-${order.id_orden}`;
      type = delivered || shipping ? 'entrega' : 'pedido';
      title = delivered ? 'Compra entregada' : shipping ? 'Compra en camino' : 'Compra realizada';
      description = delivered
        ? `Tu compra #${order.id_orden} fue entregada correctamente por ${total}.`
        : shipping
          ? `Tu compra #${order.id_orden} está en proceso de entrega por ${total}.`
          : `Tu compra #${order.id_orden} fue confirmada por ${total}.`;
    } else {
      return;
    }

    if (deletedIds.has(id)) return;
    generated.push({
      id_notificacion: id,
      tipo: type,
      titulo: title,
      descripcion: description,
      fecha_creacion: order.fecha || order.fecha_creacion || new Date().toISOString(),
      leida: readIds.has(id),
      referencia_id: order.id_orden,
      es_automatica: true,
    });
  });

  return generated;
};

const matchesDeleteFilter = (notification, filter) => {
  if (filter === 'todas') return true;
  if (filter === 'leidas') return notification.leida;

  const date = new Date(String(notification.fecha_creacion || '').replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();

  if (filter === 'hoy') {
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  }

  const days = filter === 'semana' ? 7 : 30;
  return date >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

export default function Notifications({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const { cargarConteo, resetearNotif } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null });
  const [bulkDeleteVisible, setBulkDeleteVisible] = useState(false);
  const [deleteFilter, setDeleteFilter] = useState('leidas');
  const [deleting, setDeleting] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [pageSizeVisible, setPageSizeVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState('recientes');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [readSyntheticIds, setReadSyntheticIds] = useState(new Set());
  const [deletedSyntheticIds, setDeletedSyntheticIds] = useState(new Set());
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const isBuyer = user?.rol !== 'vendedor';

  useEffect(() => {
    resetearNotif();
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const notificationsRequest = getNotifications(false, 200, 0);
      const [notificationsResponse, ordersResponse] = isBuyer
        ? await Promise.all([notificationsRequest, getOrdenes()])
        : [await notificationsRequest, null];
      const apiItems = notificationsResponse.data?.notificaciones || [];

      if (!isBuyer) {
        setNotifications(apiItems);
        return;
      }

      const ordersData = ordersResponse?.data?.orders || ordersResponse?.data || [];
      const synthetic = getSyntheticOrderNotifications(
        Array.isArray(ordersData) ? ordersData : [],
        readSyntheticIds,
        deletedSyntheticIds,
      );
      const coveredOrderIds = new Set(
        apiItems
          .filter((item) => ['pedido', 'pago'].includes(item.tipo))
          .map((item) => String(item.referencia_id || item.id_referencia || '')),
      );
      setNotifications([
        ...apiItems,
        ...synthetic.filter((item) => !coveredOrderIds.has(String(item.referencia_id))),
      ]);
    } catch {
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, [deletedSyntheticIds, isBuyer, readSyntheticIds]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = useMemo(() => {
    let items = notifications;
    if (filter === 'no_leidas') {
      items = items.filter((item) => !item.leida);
    } else if (isBuyer) {
      const selectedFilter = BUYER_FILTERS.find((item) => item.key === filter);
      if (selectedFilter?.types) {
        items = items.filter((item) => selectedFilter.types.includes(item.tipo));
      }
    }

    if (isBuyer) {
      items = [...items].sort((a, b) => {
        const dateA = new Date(a.fecha_creacion || 0).getTime();
        const dateB = new Date(b.fecha_creacion || 0).getTime();
        return sortOrder === 'antiguas' ? dateA - dateB : dateB - dateA;
      });
    }
    return items;
  }, [filter, isBuyer, notifications, sortOrder]);

  const unreadCount = notifications.filter((item) => !item.leida).length;
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleNotifications = isBuyer
    ? filteredNotifications.slice((safePage - 1) * pageSize, safePage * pageSize)
    : filteredNotifications;

  const getFilterCount = (filterOption) => {
    if (filterOption.key === 'no_leidas') return unreadCount;
    if (!filterOption.types) return notifications.length;
    return notifications.filter((item) => filterOption.types.includes(item.tipo)).length;
  };

  const handleMarkRead = async (id) => {
    const notification = notifications.find((item) => item.id_notificacion === id);
    setError(null);
    try {
      if (notification?.es_automatica) {
        setReadSyntheticIds((previous) => new Set([...previous, id]));
      } else {
        await markNotificationRead(id);
      }
      setNotifications((previous) => previous.map((item) => (
        item.id_notificacion === id ? { ...item, leida: true } : item
      )));
      await cargarConteo();
    } catch {
      setError('No se pudo marcar la notificación como leída');
    }
  };

  const handleMarkAllRead = async () => {
    setError(null);
    try {
      await markAllNotificationsRead();
      const syntheticIds = notifications
        .filter((item) => item.es_automatica)
        .map((item) => item.id_notificacion);
      setReadSyntheticIds((previous) => new Set([...previous, ...syntheticIds]));
      setNotifications((previous) => previous.map((item) => ({ ...item, leida: true })));
      await cargarConteo();
    } catch {
      setError('No se pudieron marcar todas las notificaciones como leídas');
    }
  };

  const handleDelete = async () => {
    const id = deleteModal.id;
    const notification = notifications.find((item) => item.id_notificacion === id);
    if (!id) return;
    setError(null);
    try {
      if (notification?.es_automatica) {
        setDeletedSyntheticIds((previous) => new Set([...previous, id]));
        setReadSyntheticIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      } else {
        await deleteNotification(id);
      }
      setNotifications((previous) => previous.filter((item) => item.id_notificacion !== id));
      setDeleteModal({ visible: false, id: null });
      await cargarConteo();
    } catch {
      setError('No se pudo eliminar la notificación');
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteNotificationsByFilter(deleteFilter);
      const removed = notifications.filter((item) => matchesDeleteFilter(item, deleteFilter));
      const removedSyntheticIds = removed
        .filter((item) => item.es_automatica)
        .map((item) => item.id_notificacion);
      setDeletedSyntheticIds((previous) => new Set([...previous, ...removedSyntheticIds]));
      setReadSyntheticIds((previous) => {
        const next = new Set(previous);
        removedSyntheticIds.forEach((id) => next.delete(id));
        return next;
      });
      setNotifications((previous) => previous.filter(
        (item) => !matchesDeleteFilter(item, deleteFilter),
      ));
      setPage(1);
      setBulkDeleteVisible(false);
      await cargarConteo();
    } catch {
      setError('No se pudieron eliminar las notificaciones seleccionadas');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpen = async (item) => {
    if (!item.leida) await handleMarkRead(item.id_notificacion);
    const referenceId = item.referencia_id || item.id_referencia;
    if (item.es_automatica || ['pedido', 'pago', 'entrega'].includes(item.tipo)) {
      navigation.navigate('History');
    } else if (item.tipo === 'mensaje') {
      if (referenceId) {
        const storeName = (item.titulo || '').replace(/^Nuevo mensaje de\s+/i, '').trim() || 'Chat';
        navigation.navigate('Chat', { id_sala: Number(referenceId), nombre_tienda: storeName });
      } else {
        navigation.navigate('Messages');
      }
    } else if (item.tipo === 'sistema') {
      navigation.navigate('QuejasReclamos');
    }
  };

  const renderItem = ({ item }) => {
    const unread = !item.leida;
    return (
      <View style={[
        styles.card,
        !isBuyer && styles.vendorCard,
        unread && (isBuyer ? styles.cardUnread : styles.vendorCardUnread),
      ]}>
        <View style={styles.cardInner}>
          <TouchableOpacity
            style={styles.cardContent}
            activeOpacity={0.75}
            onPress={() => handleOpen(item)}
          >
            <View style={[
              styles.iconBox,
              !isBuyer && styles.vendorIconBox,
              unread && isBuyer && styles.iconBoxUnread,
            ]}>
              {getIcon(item.tipo)}
            </View>
            <View style={styles.notificationCopy}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, unread && styles.cardTitleUnread]}>
                  {cleanTitle(item.titulo)}
                </Text>
                {unread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardBody}>{item.descripcion || item.cuerpo}</Text>
              <Text style={styles.cardDate}>🕐 {formatDate(item.fecha_creacion) || 'Ahora'}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actions}>
            {unread && (
              <TouchableOpacity
                style={[styles.btnRead, !isBuyer && styles.vendorBtnRead]}
                onPress={() => handleMarkRead(item.id_notificacion)}
                accessibilityRole="button"
                accessibilityLabel="Marcar como leída"
              >
                <Text style={[styles.btnReadText, !isBuyer && styles.vendorBtnReadText]}>
                  {isBuyer ? '✓' : '✓ Leída'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btnDelete, !isBuyer && styles.vendorBtnDelete]}
              onPress={() => setDeleteModal({ visible: true, id: item.id_notificacion })}
              accessibilityRole="button"
              accessibilityLabel="Eliminar notificación"
            >
              <Text style={[styles.btnDeleteText, !isBuyer && styles.vendorBtnDeleteText]}>
                {isBuyer ? '×' : 'Eliminar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const filterOptions = isBuyer ? BUYER_FILTERS : [
    { key: 'todas', label: 'Todas' },
    { key: 'no_leidas', label: 'No leídas' },
  ];

  return (
    <SafeAreaView style={[styles.safe, !isBuyer && styles.vendorSafe]}>
      {user?.rol === 'vendedor' && (
        <View style={styles.vendorHeader}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorHeaderTitle}>Notificaciones</Text>
            <Text style={styles.vendorHeaderSubtitle}>Mantente al día con tus pedidos y mensajes</Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.vendorUnreadBadge}>
              <Text style={styles.vendorUnreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        style={[styles.list, !isBuyer && styles.vendorList]}
        data={visibleNotifications}
        keyExtractor={(item) => String(item.id_notificacion)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={(
          <RefreshControl refreshing={loading} onRefresh={loadNotifications} tintColor={PRIMARY} />
        )}
        ListHeaderComponent={(
          <View style={[styles.listHeader, !isBuyer && styles.vendorListHeader]}>
            {isBuyer && (
              <View style={styles.headerCard}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.buyerTitle}>Notificaciones</Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadCountPill}>
                      <Text style={styles.unreadCountText}>{unreadCount} sin leer</Text>
                    </View>
                  )}
                </View>
                <View style={styles.headerActions}>
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      style={styles.markAllButton}
                      onPress={handleMarkAllRead}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.markAllText}>Marcar todas como leídas</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.bulkDeleteButton}
                    onPress={() => {
                      setDeleteFilter('leidas');
                      setBulkDeleteVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bulkDeleteText}>🗑️ Eliminar mensajes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterRow, !isBuyer && styles.vendorFilterRow]}
            >
              {filterOptions.map((option) => {
                const count = isBuyer
                  ? getFilterCount(option)
                  : option.key === 'no_leidas' ? unreadCount : notifications.length;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterBtn, filter === option.key && styles.filterBtnActive]}
                    onPress={() => {
                      setFilter(option.key);
                      setPage(1);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterText, filter === option.key && styles.filterTextActive]}>
                      {option.label}
                    </Text>
                    {isBuyer && count > 0 && (
                      <Text style={[styles.filterBadge, filter === option.key && styles.filterBadgeActive]}>
                        {count > 99 ? '99+' : count}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {!isBuyer && unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.vendorMarkAllButton}
                  onPress={handleMarkAllRead}
                  activeOpacity={0.8}
                >
                  <Text style={styles.vendorMarkAllText}>Marcar todas</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {isBuyer && (
              <View style={styles.listTools}>
                <TouchableOpacity style={styles.sortControl} onPress={() => setSortVisible(true)}>
                  <Text style={styles.sortIcon}>🗓️</Text>
                  <Text style={styles.sortText}>
                    {sortOrder === 'recientes' ? 'Más recientes' : 'Más antiguas'}
                  </Text>
                  <Text style={styles.sortChevron}>⌄</Text>
                </TouchableOpacity>
                <Text style={styles.resultsCount}>
                  {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notificación' : 'notificaciones'}
                </Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadNotifications}>
                  <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : (
          <View style={[styles.emptyCard, !isBuyer && styles.vendorEmptyCard]}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, !isBuyer && styles.vendorEmptyTitle]}>Sin notificaciones</Text>
            <Text style={[styles.emptySubtitle, !isBuyer && styles.vendorEmptySubtitle]}>
              {filter === 'no_leidas'
                ? 'No tienes notificaciones sin leer'
                : isBuyer && filter !== 'todas'
                  ? 'No tienes notificaciones en esta categoría'
                  : 'Cuando tengas actividad aparecerá aquí'}
            </Text>
          </View>
        )}
        ListFooterComponent={(
          <View>
            {isBuyer && filteredNotifications.length > 0 && (
              <View style={styles.pagination}>
                <Text style={styles.paginationInfo}>
                  Mostrando {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredNotifications.length)} de {filteredNotifications.length}
                </Text>
                <View style={styles.paginationControls}>
                  <TouchableOpacity
                    style={[styles.pageButton, safePage <= 1 && styles.disabledButton]}
                    onPress={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={safePage <= 1}
                  >
                    <Text style={styles.pageButtonText}>‹ Anterior</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageNumber}>{safePage} / {totalPages}</Text>
                  <TouchableOpacity
                    style={[styles.pageButton, safePage >= totalPages && styles.disabledButton]}
                    onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={safePage >= totalPages}
                  >
                    <Text style={styles.pageButtonText}>Siguiente ›</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pageSizeRow}>
                  <Text style={styles.pageSizeLabel}>Ver:</Text>
                  <TouchableOpacity style={styles.pageSizeButton} onPress={() => setPageSizeVisible(true)}>
                    <Text style={styles.pageSizeText}>{pageSize} por pág.⌄</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <Footer onLinkPress={() => {}} />
          </View>
        )}
      />

      <Modal
        visible={deleteModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModal({ visible: false, id: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.singleDeleteModal}>
            <View style={styles.modalIconBox}>
              <Text style={styles.modalTrash}>🗑️</Text>
            </View>
            <Text style={styles.singleDeleteTitle}>Eliminar notificación</Text>
            <Text style={styles.singleDeleteMessage}>
              ¿Estás seguro que quieres eliminar esta notificación?
            </Text>
            <Text style={styles.singleDeleteWarning}>Esta acción no se puede deshacer.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setDeleteModal({ visible: false, id: null })}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDelete]}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnDeleteText}>Sí, eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={bulkDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setBulkDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalBox}>
            <Text style={styles.bulkModalTitle}>🗑️ Eliminar notificaciones</Text>
            <Text style={styles.bulkModalDescription}>
              Selecciona qué notificaciones quieres eliminar. Esta acción no se puede deshacer.
            </Text>
            {DELETE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.deleteOption, deleteFilter === option.value && styles.deleteOptionSelected]}
                onPress={() => setDeleteFilter(option.value)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, deleteFilter === option.value && styles.radioOuterSelected]}>
                  {deleteFilter === option.value && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.deleteOptionText, deleteFilter === option.value && styles.deleteOptionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setBulkDeleteVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDelete]}
                onPress={handleBulkDelete}
                disabled={deleting}
              >
                <Text style={styles.modalBtnDeleteText}>{deleting ? 'Eliminando...' : 'Eliminar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={sortVisible || pageSizeVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSortVisible(false);
          setPageSizeVisible(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setSortVisible(false);
            setPageSizeVisible(false);
          }}
        >
          <View style={styles.optionsModal}>
            <Text style={styles.optionsTitle}>
              {sortVisible ? 'Ordenar notificaciones' : 'Notificaciones por página'}
            </Text>
            {(sortVisible
              ? [
                { value: 'recientes', label: 'Más recientes' },
                { value: 'antiguas', label: 'Más antiguas' },
              ]
              : PAGE_SIZES.map((value) => ({ value, label: `${value} por página` }))
            ).map((option) => {
              const selected = sortVisible ? sortOrder === option.value : pageSize === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  onPress={() => {
                    if (sortVisible) {
                      setSortOrder(option.value);
                    setPage(1);
                  } else {
                    setPageSize(option.value);
                    setPage(1);
                    }
                    setSortVisible(false);
                    setPageSizeVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                  {selected && <Text style={styles.optionCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: BG },
  vendorSafe: { backgroundColor: PRIMARY },
  list: { flex: 1, backgroundColor: BG },
  vendorList: {
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  listContent: { flexGrow: 1, paddingBottom: 0 },
  listHeader: { paddingHorizontal: 14, paddingTop: 14 },
  vendorListHeader: { paddingHorizontal: 0, paddingTop: 0 },

  vendorHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PRIMARY,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: { color: WHITE, fontSize: 20, fontWeight: '700' },
  vendorHeaderTitle: { fontSize: 20, fontWeight: '900', color: WHITE, letterSpacing: -0.3 },
  vendorHeaderSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  vendorUnreadBadge: {
    backgroundColor: WHITE,
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  vendorUnreadBadgeText: { color: PRIMARY, fontWeight: '900', fontSize: 13 },

  headerCard: {
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  buyerTitle: { color: PRIMARY, fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  unreadCountPill: { backgroundColor: PRIMARY, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 4 },
  unreadCountText: { color: WHITE, fontSize: 11, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  markAllButton: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  markAllText: { color: WHITE, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  bulkDeleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  bulkDeleteText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },

  filterRow: { alignItems: 'center', paddingBottom: 12, gap: 8 },
  vendorFilterRow: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10 },
  vendorMarkAllButton: { marginLeft: 2, paddingVertical: 8, paddingHorizontal: 10 },
  vendorMarkAllText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E0DBD4',
    backgroundColor: WHITE,
    gap: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  filterBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterText: { fontSize: 12, fontWeight: '600', color: '#555' },
  filterTextActive: { color: WHITE, fontWeight: '700' },
  filterBadge: {
    minWidth: 19,
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#F7E8EC',
    color: PRIMARY,
    textAlign: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '800',
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)', color: WHITE },
  listTools: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderWidth: 1.5,
    borderColor: '#E0DBD4',
    backgroundColor: WHITE,
    borderRadius: 10,
    minHeight: 40,
  },
  sortIcon: { fontSize: 14 },
  sortText: { color: '#374151', fontSize: 12, fontWeight: '700' },
  sortChevron: { color: '#64748B', fontSize: 17, marginTop: -5 },
  resultsCount: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    marginHorizontal: 14,
    marginTop: 2,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: BORDER,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },
  cardUnread: { backgroundColor: '#FFF8F5', borderLeftColor: PRIMARY, borderLeftWidth: 5 },
  vendorCard: { borderWidth: 1, borderColor: '#E5E0D8', marginTop: 4, marginBottom: 10 },
  vendorCardUnread: { backgroundColor: WHITE, borderColor: PRIMARY, borderWidth: 1.5 },
  cardInner: { padding: 14 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  notificationCopy: { flex: 1, minWidth: 0 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#F7F4F1',
    borderWidth: 1.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxUnread: { backgroundColor: '#FFF1F3', borderColor: '#F0D9DE' },
  vendorIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F3EF', borderWidth: 0 },
  iconText: { fontSize: 23 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 7 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: TEXT, flex: 1 },
  cardTitleUnread: { color: PRIMARY },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  cardDate: { fontSize: 11, color: '#999', marginTop: 8, fontWeight: '500' },
  cardBody: { fontSize: 13, color: '#555', lineHeight: 19 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  btnRead: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReadText: { fontSize: 19, fontWeight: '800', color: '#16A34A' },
  vendorBtnRead: { width: undefined, height: undefined, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
  vendorBtnReadText: { fontSize: 12 },
  btnDelete: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorBtnDelete: { width: undefined, height: undefined, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
  btnDeleteText: { fontSize: 23, lineHeight: 26, fontWeight: '500', color: '#DC2626' },
  vendorBtnDeleteText: { fontSize: 12, lineHeight: 16, fontWeight: '700' },

  centered: { minHeight: 220, justifyContent: 'center', alignItems: 'center' },
  emptyCard: {
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 18,
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 42,
    paddingHorizontal: 22,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  vendorEmptyCard: { backgroundColor: 'transparent', borderWidth: 0, elevation: 0, shadowOpacity: 0 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#666', marginBottom: 6 },
  vendorEmptyTitle: { color: WHITE },
  emptySubtitle: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 19 },
  vendorEmptySubtitle: { color: 'rgba(255,255,255,0.75)' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#B91C1C', textAlign: 'center', fontSize: 13 },
  retryText: { color: PRIMARY, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 7 },

  pagination: {
    marginHorizontal: 14,
    marginTop: 2,
    marginBottom: 18,
    padding: 14,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    gap: 12,
  },
  paginationInfo: { color: '#64748B', fontSize: 12, textAlign: 'center' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pageButton: { paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E0DBD4', borderRadius: 9, backgroundColor: WHITE },
  pageButtonText: { color: '#374151', fontSize: 12, fontWeight: '700' },
  disabledButton: { opacity: 0.4 },
  pageNumber: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  pageSizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pageSizeLabel: { color: '#64748B', fontSize: 12 },
  pageSizeButton: { borderWidth: 1, borderColor: '#E0DBD4', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
  pageSizeText: { color: '#374151', fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 26 },
  singleDeleteModal: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  modalIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  modalTrash: { fontSize: 27 },
  singleDeleteTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 10 },
  singleDeleteMessage: { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22 },
  singleDeleteWarning: { fontSize: 12, color: '#DC2626', fontWeight: '600', marginTop: 8, marginBottom: 22 },
  modalBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 14 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 11, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E0D8' },
  modalBtnCancelText: { fontSize: 13, fontWeight: '700', color: '#444' },
  modalBtnDelete: { backgroundColor: '#DC2626' },
  modalBtnDeleteText: { fontSize: 13, fontWeight: '800', color: WHITE },

  bulkModalBox: { backgroundColor: WHITE, borderRadius: 18, padding: 20, width: '100%', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  bulkModalTitle: { color: '#1F2937', fontSize: 18, fontWeight: '800', marginBottom: 7 },
  bulkModalDescription: { color: '#6B7280', fontSize: 13, lineHeight: 19, marginBottom: 16 },
  deleteOption: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FAFAF9', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 8 },
  deleteOptionSelected: { borderColor: PRIMARY, backgroundColor: '#FDF2F4' },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: PRIMARY },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: PRIMARY },
  deleteOptionText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  deleteOptionTextSelected: { color: PRIMARY },

  optionsModal: { width: '100%', backgroundColor: WHITE, borderRadius: 18, padding: 18, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  optionsTitle: { color: '#1F2937', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  optionRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F1F1', paddingHorizontal: 8 },
  optionRowSelected: { backgroundColor: '#FDF2F4', borderRadius: 8 },
  optionText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  optionTextSelected: { color: PRIMARY },
  optionCheck: { color: PRIMARY, fontSize: 17, fontWeight: '800' },
});
