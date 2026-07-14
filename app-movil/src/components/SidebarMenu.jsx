import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Dimensions, Platform
} from 'react-native';
import { 
  IconClose, IconUser, IconFavorites, IconHistory, 
  IconStore, IconPackage, IconLogout, IconChevronRight, IconBell 
} from './Icons';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75 > 320 ? 320 : width * 0.75;

export default function SidebarMenu({ visible, onClose, user, navigation, onSignOut }) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
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

  const MenuItem = ({ icon, label, onPress, isLogout }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={[styles.menuItemText, isLogout && { color: '#D32F2F', fontWeight: '700' }]}>
          {label}
        </Text>
      </View>
      {!isLogout && <IconChevronRight size={16} color="#ccc" />}
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
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.nombre?.charAt(0)?.toUpperCase() || 'U'}</Text>
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
            
            <MenuItem 
              icon={<IconUser size={22} color="#555" />} 
              label="Mi Perfil" 
              onPress={() => {
                // Aquí podrías navegar a una pantalla de Perfil
                Alert.alert("En desarrollo", "Pantalla de perfil próximamente");
              }} 
            />
            <MenuItem 
              icon={<IconFavorites size={22} color="#555" />} 
              label="Lista de Deseos" 
              onPress={() => navigateTo('ListaDeseos')} 
            />
            <MenuItem 
              icon={<IconHistory size={22} color="#555" />} 
              label="Historial de Pedidos" 
              onPress={() => {
                // Aquí podrías navegar a una pantalla de Historial
                Alert.alert("En desarrollo", "Pantalla de historial próximamente");
              }} 
            />
            <MenuItem 
              icon={<IconBell size={22} color="#555" />} 
              label="Notificaciones" 
              onPress={() => navigateTo('Notifications')} 
            />
            
            {isVendedor && (
              <>
                <Text style={styles.sectionTitle}>MI LIBRERÍA</Text>
                <MenuItem 
                  icon={<IconStore size={22} color="#555" />} 
                  label="Panel de Tienda" 
                  onPress={() => navigateTo('MiTienda')} 
                />
                <MenuItem 
                  icon={<IconPackage size={22} color="#555" />} 
                  label="Mi Librería" 
                  onPress={() => navigateTo('Libreria')} 
                />
              </>
            )}
            
            <View style={styles.spacer} />
            
            <View style={styles.divider} />
            <MenuItem 
              icon={<IconLogout size={22} color="#D32F2F" />} 
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
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    backgroundColor: '#7A1E3A',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F4EDE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7A1E3A',
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
  },
  menuContent: {
    flex: 1,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
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
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  }
});
