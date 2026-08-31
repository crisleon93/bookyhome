import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, Animated, Dimensions, Platform
} from 'react-native';
import { 
  IconClose, IconUser, IconFavorites, IconHistory, IconAlertTriangle,
  IconStore, IconPackage, IconLogout, IconChevronRight, IconBell, IconChat, IconLocation
} from './Icons';
import { useNotifications } from '../context/NotificationContext';
import { getApiBaseUrl, getProfile } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75 > 320 ? 320 : width * 0.75;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function SidebarMenu({ visible, onClose, user, navigation, onSignOut }) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [profile, setProfile] = React.useState(null);
  const { unreadNotifCount, unreadMsgCount } = useNotifications();

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

  const MenuItem = ({ icon, label, onPress, isLogout, badge }) => (
    <TouchableOpacity
      style={[styles.menuItem, isLogout && styles.logoutItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={[styles.menuItemText, isLogout && styles.logoutText]}>
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        {!isLogout && <IconChevronRight size={16} color="rgba(255,255,255,0.45)" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}> 
          {/* Header del drawer */}
          <View style={[styles.header, { backgroundColor: headerColor }]}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={styles.headerBanner} />
            ) : bannerGradient?.length >= 2 ? (
              <LinearGradient colors={bannerGradient} style={styles.headerBanner} />
            ) : (
              <View style={[styles.headerBanner, { backgroundColor: headerColor }]} />
            )}
            <View style={styles.headerOverlay} />
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                {profilePhotoUrl ? (
                  <Image source={{ uri: profilePhotoUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{user?.nombre?.charAt(0)?.toUpperCase() || 'U'}</Text>
                )}
              </View>
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
          <View style={styles.menuContent}>
            <Text style={styles.sectionTitle}>MI CUENTA</Text>

            {!isVendedor && (
              <>
                <MenuItem
                  icon={<IconStore size={22} color="#FFF" />}
                  label="Inicio"
                  onPress={() => navigateTo('PostLogin')}
                />
                <MenuItem
                  icon={<IconPackage size={22} color="#FFF" />}
                  label="Catálogo"
                  onPress={() => navigateTo('Catalogo')}
                />
              </>
            )}
            <MenuItem
              icon={<IconUser size={22} color="#FFF" />}
              label="Mi Perfil"
              onPress={() => navigateTo('Profile')}
            />
            <MenuItem
              icon={<IconChat size={22} color="#FFF" />}
              label="Mensajes"
              badge={unreadMsgCount}
              onPress={() => navigateTo('Messages')}
            />
            <MenuItem
              icon={<IconPackage size={22} color="#FFF" />}
              label="Mi Carrito"
              onPress={() => navigateTo('Cart')}
            />
            <MenuItem
              icon={<IconLocation size={22} color="#FFF" />}
              label="Direcciones"
              onPress={() => navigateTo('Direcciones')}
            />
            <MenuItem
              icon={<IconFavorites size={22} color="#FFF" />}
              label="Lista de Deseos"
              onPress={() => navigateTo('ListaDeseos')}
            />
            <MenuItem
              icon={<IconHistory size={22} color="#FFF" />}
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
            
            <View style={styles.spacer} />
            
            <View style={styles.divider} />
            <MenuItem 
              icon={<IconLogout size={22} color="#7A1E3A" />} 
              label="Cerrar Sesión" 
              onPress={() => {
                onClose();
                onSignOut && onSignOut();
              }} 
              isLogout 
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#7A1E3A',
    boxShadow: '2px 0px 5px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  header: {
    position: 'relative',
    backgroundColor: '#7A1E3A',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBanner: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    zIndex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    zIndex: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  closeBtn: {
    padding: 5,
    zIndex: 1,
  },
  menuContent: {
    flex: 1,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginLeft: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  logoutItem: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
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
    fontSize: 15,
    color: '#FFF',
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutText: {
    color: '#7A1E3A',
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
  spacer: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 10,
  }
});
