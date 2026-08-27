import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Dimensions, Platform, ScrollView, Image,
} from 'react-native';
import {
  IconClose, IconChevronRight, IconLogout,
  IconHome, IconBook, IconBooks, IconPackage, IconStore,
  IconDollar, IconStar, IconAlertTriangle, IconChat,
  IconBell, IconUser, IconTruck, IconCreditCard,
} from './Icons';
import { useNotifications } from '../context/NotificationContext';
import { getConfigLibreria, getApiBaseUrl } from '../services/api';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78 > 300 ? 300 : width * 0.78;
const PRIMARY  = '#7A1E3A';
const DARK     = '#5A1228';
const WHITE    = '#FFFFFF';
const ITEM_BG  = 'rgba(255,255,255,0.08)';
const ITEM_ACTIVE_BG = 'rgba(255,255,255,0.22)';
const DIVIDER  = 'rgba(255,255,255,0.12)';

const MenuItem = ({ icon, label, onPress, badge, soon }) => (
  <TouchableOpacity
    style={[styles.item, soon && styles.itemSoon]}
    onPress={soon ? null : onPress}
    activeOpacity={soon ? 1 : 0.7}
  >
    <View style={styles.itemLeft}>
      <View style={styles.itemIcon}>{icon}</View>
      <Text style={[styles.itemLabel, soon && styles.itemLabelSoon]}>{label}</Text>
    </View>
    <View style={styles.itemRight}>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
      {soon
        ? <View style={styles.soonChip}><Text style={styles.soonText}>Pronto</Text></View>
        : <IconChevronRight size={15} color="rgba(255,255,255,0.4)" />
      }
    </View>
  </TouchableOpacity>
);

const Sep = () => <View style={styles.sep} />;

export default function SidebarVendedor({ visible, onClose, user, navigation, onSignOut }) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const { unreadNotifCount, unreadMsgCount } = useNotifications();
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    if (user?.rol !== 'vendedor' || !user?.id_tienda) {
      setLogoUrl(null);
      return;
    }

    getConfigLibreria()
      .then(r => {
        const raw = r?.data?.logo_url;
        if (!raw) return;
        const base = getApiBaseUrl();
        setLogoUrl(raw.startsWith('http') ? raw : `${base}/${raw.replace(/^\/+/, '')}`);
      })
      .catch(() => {});
  }, [user?.id_tienda, user?.rol]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0,             duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1,             duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,             duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible && slideAnim._value === -DRAWER_WIDTH) return null;

  const go = (screen, params) => {
    onClose();
    setTimeout(() => navigation?.navigate(screen, params), 100);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          {/* ── Cabecera ── */}
          <View style={styles.header}>
            <View style={styles.avatarBox}>
              {logoUrl
                ? <Image source={{ uri: logoUrl }} style={styles.avatarImg} />
                : <Text style={styles.avatarText}>
                    {(user?.nombre_tienda || user?.nombre || 'V').charAt(0).toUpperCase()}
                  </Text>
              }
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerName} numberOfLines={1}>
                {user?.nombre_tienda || user?.nombre || 'Mi Tienda'}
              </Text>
              <Text style={styles.headerRole}>Panel de ventas</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconClose size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* ── Lista ── */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10, paddingBottom: 30 }}
          >
            <MenuItem icon={<IconHome    size={19} color={WHITE} />} label="Inicio"             onPress={() => go('VendorHome')} />
            <Sep />
            <MenuItem icon={<IconBooks   size={19} color={WHITE} />} label="Mis Libros"         onPress={() => go('Libreria')} />
            <MenuItem icon={<IconBook    size={19} color={WHITE} />} label="Publicar Libro"     onPress={() => go('PublicarLibro')} />
            <Sep />
            <MenuItem icon={<IconStore   size={19} color={WHITE} />} label="Ventas"             onPress={() => go('VentasVendedor')} />
            <MenuItem icon={<IconPackage size={19} color={WHITE} />} label="Pedidos"            onPress={() => go('PedidosVendedor')} />
            <Sep />
            <MenuItem icon={<IconDollar  size={19} color={WHITE} />} label="Nómina"             onPress={null} soon />
            <MenuItem icon={<IconStar    size={19} color={WHITE} />} label="Calificaciones"     onPress={() => go('CalificacionesVendedor')} />
            <MenuItem icon={<IconAlertTriangle size={19} color={WHITE} />} label="Quejas y reclamos" onPress={() => go('QuejasReclamos')} />
            <Sep />
            <MenuItem icon={<IconBell    size={19} color={WHITE} />} label="Notificaciones"     onPress={() => go('Notifications')} badge={unreadNotifCount} />
            <MenuItem icon={<IconChat    size={19} color={WHITE} />} label="Mensajes"           onPress={() => go('Messages')} badge={unreadMsgCount} />
            <Sep />
            <MenuItem icon={<IconUser    size={19} color={WHITE} />} label="Perfil"             onPress={() => go('PerfilTienda', { id_tienda: user?.id_tienda })} />
            <MenuItem icon={<IconTruck   size={19} color={WHITE} />} label="Configuración"      onPress={() => go('ConfiguracionTienda')} />
            <Sep />
            <MenuItem icon={<IconCreditCard size={19} color={WHITE} />} label="Suscripciones"   onPress={() => go('SuscripcionesVendedor')} />
            <MenuItem icon={<IconStore   size={19} color={WHITE} />} label="Impulsos"           onPress={() => go('ImpulsosVendedor')} />
          </ScrollView>

          {/* ── Cerrar sesión ── */}
          <View style={styles.logoutBox}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => { onClose(); onSignOut?.(); }}
              activeOpacity={0.8}
            >
              <IconLogout size={18} color={PRIMARY} />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, flexDirection: 'row' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },

  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: PRIMARY,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 3, height: 0 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 10 },
    }),
  },

  // cabecera
  header:      { backgroundColor: DARK, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 20, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
  avatarBox:   { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  avatarImg:   { width: 44, height: 44, borderRadius: 22 },
  avatarText:  { fontSize: 18, fontWeight: '800', color: WHITE },
  headerName:  { color: WHITE, fontSize: 14, fontWeight: '800' },
  headerRole:  { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  closeBtn:    { padding: 6 },

  // ítems
  item:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 18, marginHorizontal: 8, borderRadius: 10, marginBottom: 2 },
  itemSoon:     { opacity: 0.5 },
  itemLeft:     { flexDirection: 'row', alignItems: 'center' },
  itemIcon:     { width: 26 },
  itemLabel:    { fontSize: 14, color: WHITE, fontWeight: '500', marginLeft: 14 },
  itemLabelSoon:{ color: 'rgba(255,255,255,0.6)' },
  itemRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },

  badge:        { backgroundColor: WHITE, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText:    { color: PRIMARY, fontSize: 10, fontWeight: '800' },

  soonChip:     { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  soonText:     { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' },

  sep:          { height: 1, backgroundColor: DIVIDER, marginHorizontal: 18, marginVertical: 6 },

  // cerrar sesión
  logoutBox:   { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: WHITE, borderRadius: 12, paddingVertical: 13 },
  logoutText:  { color: PRIMARY, fontWeight: '800', fontSize: 14 },
});
