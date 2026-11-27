import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Modal, Animated, Dimensions, Platform, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';
import { 
  IconClose, IconUser, IconFavorites, IconAlertTriangle, IconStore, IconPackage,
  IconLogout, IconChevronRight, IconBell, IconShoppingBag, IconTruck,
  IconStoreAlt, IconBookOpen, IconMessage, IconCart, IconMapPin, IconTool, IconSettings
} from './Icons';
import { useNotifications } from '../context/NotificationContext';
import { getApiBaseUrl, getProfile } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(250, width * 0.72);
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function SidebarMenu({ visible, onClose, user, navigation, onSignOut }) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [profile, setProfile] = React.useState(null);
  const { unreadNotifCount, unreadMsgCount } = useNotifications();
  const { darkMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(baseStyles);

  useEffect(() => {
    if (!visible) return;
    getProfile().then((response) => setProfile(response.data || {})).catch(() => {});
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: USE_NATIVE_DRIVER,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: USE_NATIVE_DRIVER,
        })
      ]).start();
    }
  }, [visible]);

  if (!visible && slideAnim._value === -DRAWER_WIDTH) return null;

  const navigateTo = (screen) => {
    onClose();
    setTimeout(() => {
      navigation?.navigate(screen);
    }, 100);
  };

  const isVendedor = user?.rol === 'vendedor';
  const profilePhoto = profile?.foto_perfil;
  const profilePhotoUrl = profilePhoto
    ? `${getApiBaseUrl()}/${profilePhoto.replace(/^\/+/, '')}`
    : null;
  const bannerPath = profile?.banner_perfil;
  const bannerUrl = bannerPath
    ? `${getApiBaseUrl()}/${bannerPath.replace(/^\/+/, '')}`
    : null;
  const headerColor = profile?.banner_color && !profile.banner_color.startsWith('linear-gradient')
    ? profile.banner_color
    : '#7A1E3A';
  const bannerGradient = profile?.banner_color?.startsWith('linear-gradient')
    ? profile.banner_color.match(/#[0-9a-f]{6}/gi)
    : null;

  const MenuItem = ({ icon, label, onPress, badge }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        <IconChevronRight size={16} color="rgba(255,255,255,0.45)" />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      navigationBarTranslucent={Platform.OS === 'android'}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {Platform.OS === 'android' && <NavigationBar style="dark" />}
      <View style={styles.overlayContainer}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}> 
          {/* Header del drawer */}
          <View style={[styles.header, { backgroundColor: headerColor, paddingTop: insets.top + 8 }]}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : bannerGradient?.length >= 2 ? (
              <LinearGradient colors={bannerGradient} style={StyleSheet.absoluteFillObject} />
            ) : null}
            {Boolean(bannerUrl || bannerGradient?.length >= 2) && (
              <View style={[StyleSheet.absoluteFillObject, styles.headerOverlay]} />
            )}
            <View style={styles.avatar}>
              {profilePhotoUrl ? (
                <Image source={{ uri: profilePhotoUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarText}>{user?.nombre?.charAt(0)?.toUpperCase() || 'U'}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <View>
                <Text style={styles.userName} numberOfLines={1}>{user?.nombre || 'Usuario'}</Text>
                <Text style={styles.userRole}>{isVendedor ? 'Vendedor' : 'Comprador'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconClose size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Lista de opciones */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
            testID="sidebar-menu-scroll"
          >
            <Text style={styles.sectionTitle}>MI CUENTA</Text>

            {!isVendedor && (
              <>
                <MenuItem
                  icon={<IconStoreAlt size={22} color="#FFF" />}
                  label="Inicio"
                  onPress={() => navigateTo('PostLogin')}
                />
                <MenuItem
                  icon={<IconBookOpen size={22} color="#FFF" />}
                  label="Catálogo"
                  onPress={() => navigateTo('Catalogo')}
                />
                <MenuItem
                  icon={<IconTruck size={22} color="#FFF" />}
                  label="Seguimiento de pedidos"
                  onPress={() => navigateTo('Seguimiento')}
                />
              </>
            )}
            <MenuItem
              icon={<IconUser size={22} color="#FFF" />}
              label="Mi Perfil"
              onPress={() => navigateTo('Profile')}
            />
            <MenuItem
              icon={<IconMessage size={22} color="#FFF" />}
              label="Mensajes"
              badge={unreadMsgCount}
              onPress={() => navigateTo('Messages')}
            />
            <MenuItem
              icon={<IconCart size={22} color="#FFF" />}
              label="Mi Carrito"
              onPress={() => navigateTo('Cart')}
            />
            <MenuItem
              icon={<IconMapPin size={22} color="#FFF" />}
              label="Direcciones"
              onPress={() => navigateTo('Direcciones')}
            />
            <MenuItem
              icon={<IconFavorites size={22} color="#FFF" />}
              label="Lista de Deseos"
              onPress={() => navigateTo('ListaDeseos')}
            />
            <MenuItem
              icon={<IconShoppingBag size={22} color="#FFF" />}
              label="Mis compras"
              onPress={() => navigateTo('History')}
            />
            <MenuItem
              icon={<IconAlertTriangle size={22} color="#FFF" />}
              label="Quejas y reclamos"
              onPress={() => navigateTo('QuejasReclamos')}
            />
            <MenuItem
              icon={<IconBell size={22} color="#FFF" />}
              label="Notificaciones"
              badge={unreadNotifCount}
              onPress={() => navigateTo('Notifications')}
            />
            <MenuItem
              icon={<IconTool size={22} color="#FFF" />}
              label="Soporte técnico"
              onPress={() => navigateTo('SoporteTecnico')}
            />
            <MenuItem
              icon={<IconSettings size={22} color="#FFF" />}
              label="Configuración"
              onPress={() => navigateTo(isVendedor ? 'ConfiguracionTienda' : 'ConfiguracionComprador')}
            />

            {isVendedor && (
              <>
                <Text style={styles.sectionTitle}>MI LIBRERÍA</Text>
                <MenuItem
                  icon={<IconStore size={22} color="#FFF" />}
                  label="Panel de Tienda"
                  onPress={() => navigateTo('VendorHome')}
                />
                <MenuItem
                  icon={<IconPackage size={22} color="#FFF" />}
                  label="Mi Librería"
                  onPress={() => navigateTo('Libreria')}
                />
              </>
            )}
          </ScrollView>

          <View
            style={[styles.menuFooter, { paddingBottom: insets.bottom + 12 }]}
            testID="sidebar-menu-footer"
          >
            <TouchableOpacity
              style={[styles.logoutButton, darkMode && styles.logoutButtonDark]}
              onPress={() => {
                onClose();
                onSignOut && onSignOut();
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar Sesión"
            >
              <IconLogout size={18} color={darkMode ? '#ECECEC' : '#7A1E3A'} />
              <Text style={[styles.logoutText, darkMode && styles.logoutTextDark]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const baseStyles = StyleSheet.create({
  overlayContainer: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#7A1E3A',
    flexDirection: 'column',
  },
  header: {
    position: 'relative',
    backgroundColor: '#7A1E3A',
    flexShrink: 0,
    paddingBottom: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  userInfo: {
    flex: 1,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    zIndex: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  userRole: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    zIndex: 1,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 16,
    paddingBottom: 28,
  },
  menuFooter: {
    flexShrink: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 13,
  },
  logoutButtonDark: {
    backgroundColor: '#303030',
  },
  logoutText: {
    color: '#7A1E3A',
    fontSize: 14,
    fontWeight: '800',
  },
  logoutTextDark: {
    color: '#ECECEC',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginHorizontal: 8,
    marginBottom: 3,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuItemText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 13,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#7A1E3A',
    fontSize: 11,
    fontWeight: '800',
  },
});
