import React, { useEffect, useRef } from 'react';
import {
  Animated, Dimensions, Modal, Platform, ScrollView,
  Image, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getApiBaseUrl } from '../services/api';
import {
  IconAlertTriangle, IconBook, IconClose, IconLayoutDashboard, IconLogout,
  IconPackage, IconSettings, IconStore, IconTool, IconTrendingUp, IconUser, IconWallet,
} from './Icons';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH  = Math.min(320, width * 0.82);
const VINOTINTO      = '#7A1E3A';
const VINOTINTO_DARK = '#5e1629';
const WHITE          = '#FFFFFF';

const ADMIN_SECTIONS = [
  { label: 'Dashboard',         Icon: IconLayoutDashboard,id: 'dashboard' },
  { label: 'Reportes',          Icon: IconTrendingUp,    id: 'reportes'  },
  { label: 'Usuarios',          Icon: IconUser,          id: 'usuarios'  },
  { label: 'Libros',            Icon: IconBook,          id: 'libros'    },
  { label: 'Tiendas',           Icon: IconStore,         id: 'tiendas'   },
  { label: 'Órdenes',           Icon: IconPackage,       id: 'ordenes'   },
  { label: 'Finanzas',          Icon: IconWallet,        id: 'finanzas'  },
  { label: 'Quejas y reclamos', Icon: IconAlertTriangle,  id: 'reclamos' },
  { label: 'Soporte técnico',   Icon: IconTool,           id: 'soporte'   },
  { label: 'Mi perfil',         Icon: IconSettings,       id: 'perfil'    },
];

// ─── Item deshabilitado ───────────────────────────────────────────────────────
function ComingSoonItem({ label, Icon }) {
  return (
    <View style={st.item} accessible accessibilityRole="text" accessibilityLabel={`${label}. Próximamente`} accessibilityState={{ disabled: true }}>
      <View style={st.itemLeft}>
        <Icon size={19} color="rgba(255,255,255,0.38)" />
        <Text style={st.itemLabel}>{label}</Text>
      </View>
      <View style={st.chip}>
        <Text style={st.chipTxt}>Próximamente</Text>
      </View>
    </View>
  );
}

// ─── Item navegable ───────────────────────────────────────────────────────────
function NavItem({ label, Icon, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[st.navItem, isActive && st.navItemActive]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Ir a ${label}`}
      accessibilityState={{ selected: isActive }}
    >
      <View style={st.itemLeft}>
        <Icon size={19} color={isActive ? VINOTINTO : WHITE} />
        <Text style={[st.navLabel, isActive && st.navLabelActive]}>{label}</Text>
      </View>
      {isActive && (
        <View style={st.activeDot} />
      )}
    </TouchableOpacity>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SidebarAdmin({
  visible, onClose, user, onSignOut,
  onSelectDashboard, onSelectSection,
  activeSection = 'dashboard',
}) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: visible ? 0 : -DRAWER_WIDTH, duration: visible ? 280 : 220, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(fadeAnim,  { toValue: visible ? 1 : 0,             duration: visible ? 280 : 220, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [visible, fadeAnim, slideAnim]);

  if (!visible && slideAnim._value === -DRAWER_WIDTH) return null;

  const initial = (user?.nombre || 'A').charAt(0).toUpperCase();
  const photoUri = user?.foto_perfil
    ? (/^https?:\/\//i.test(user.foto_perfil)
      ? user.foto_perfil
      : `${getApiBaseUrl()}/${String(user.foto_perfil).replace(/^\/+/, '')}`)
    : null;
  const bannerUri = user?.banner_perfil
    ? (/^https?:\/\//i.test(user.banner_perfil)
      ? user.banner_perfil
      : `${getApiBaseUrl()}/${String(user.banner_perfil).replace(/^\/+/, '')}`)
    : null;
  const bannerGradientColors = typeof user?.banner_color === 'string' && user.banner_color.startsWith('linear-gradient')
    ? user.banner_color.match(/#[0-9A-Fa-f]{6}/g)
    : null;
  const bannerBackgroundColor = /^#[0-9A-Fa-f]{6}$/.test(user?.banner_color || '')
    ? user.banner_color
    : VINOTINTO_DARK;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={st.root}>
        {/* Fondo oscuro */}
        <Animated.View style={[st.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* Drawer */}
        <Animated.View style={[st.drawer, { transform: [{ translateX: slideAnim }] }]}>

          {/* Cabecera con avatar */}
          <View style={[st.header, { backgroundColor: bannerBackgroundColor }]}>
            {bannerGradientColors?.length >= 2 ? (
              <LinearGradient colors={bannerGradientColors} style={StyleSheet.absoluteFill} />
            ) : bannerUri ? (
              <Image source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
            {(bannerUri || bannerGradientColors?.length >= 2) && (
              <View style={[StyleSheet.absoluteFill, st.headerOverlay]} />
            )}
            <View style={st.avatar}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={st.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={st.avatarTxt}>{initial}</Text>
              )}
            </View>
            <View style={st.userInfo}>
              <Text style={st.name} numberOfLines={1}>{user?.nombre || 'Administrador'}</Text>
              <Text style={st.role}>Administrador</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={st.closeBtn} accessibilityLabel="Cerrar menú">
              <IconClose size={20} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          </View>

          {/* Menú */}
          <ScrollView contentContainerStyle={st.menuContent} showsVerticalScrollIndicator={false}>
            <Text style={st.sectionTitle}>ADMINISTRACIÓN</Text>

            {ADMIN_SECTIONS.map((sec) => {
              if (sec.id === 'dashboard') {
                return (
                  <NavItem
                    key={sec.label}
                    label={sec.label}
                    Icon={sec.Icon}
                    isActive={activeSection === 'dashboard'}
                    onPress={() => { onClose(); onSelectDashboard?.(); }}
                  />
                );
              }
              if (sec.id) {
                return (
                  <NavItem
                    key={sec.label}
                    label={sec.label}
                    Icon={sec.Icon}
                    isActive={activeSection === sec.id}
                    onPress={() => { onClose(); onSelectSection?.(sec.id); }}
                  />
                );
              }
              return <ComingSoonItem key={sec.label} label={sec.label} Icon={sec.Icon} />;
            })}

          </ScrollView>

          {/* Cerrar sesión */}
          <View style={st.logoutBox}>
            <TouchableOpacity
              style={st.logoutBtn}
              onPress={() => { onClose(); onSignOut?.(); }}
              activeOpacity={0.8}
              accessibilityLabel="Cerrar sesión"
            >
              <IconLogout size={18} color={VINOTINTO} />
              <Text style={st.logoutTxt}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root:    { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  drawer:  {
    width: DRAWER_WIDTH, height: '100%', backgroundColor: VINOTINTO,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 3, height: 0 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 10 },
    }),
  },

  // Cabecera
  header:    { backgroundColor: VINOTINTO_DARK, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 20, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  headerOverlay: { backgroundColor: 'rgba(0,0,0,0.35)' },
  avatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 22 },
  avatarTxt: { color: WHITE, fontSize: 18, fontWeight: '800' },
  userInfo:  { flex: 1, marginLeft: 12 },
  name:      { color: WHITE, fontSize: 14, fontWeight: '800' },
  role:      { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  closeBtn:  { padding: 6 },

  // Menú
  menuContent:  { paddingVertical: 16, paddingBottom: 28 },
  sectionTitle: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginHorizontal: 20, marginBottom: 10, textTransform: 'uppercase' },
  description:  { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 16, marginHorizontal: 20, marginTop: 10, marginBottom: 13 },

  // Item deshabilitado
  item:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 18, marginHorizontal: 8, marginBottom: 2 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemLabel:{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600', marginLeft: 13 },
  chip:     { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipTxt:  { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800' },

  // Item navegable
  navItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 18, marginHorizontal: 8, marginBottom: 3,
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: WHITE,
  },
  navLabel:       { color: WHITE, fontSize: 14, fontWeight: '700', marginLeft: 13 },
  navLabelActive: { color: VINOTINTO, fontWeight: '800' },
  activeDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: VINOTINTO },

  // Logout
  logoutBox: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: WHITE, borderRadius: 12, paddingVertical: 13 },
  logoutTxt: { color: VINOTINTO, fontSize: 14, fontWeight: '800' },
});
