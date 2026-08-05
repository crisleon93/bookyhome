// src/components/Header.jsx
import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Modal, StatusBar, Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { IconSearch, IconUser, IconUserPlus, IconLocation, IconClose, IconChevronRight, IconBook, IconMenu, IconCart, IconChat } from './Icons';
import SidebarMenu from './SidebarMenu';

const VINOTINTO  = '#7A1E3A';
const WHITE      = '#FFFFFF';
const BEIGE      = '#F4EDE2';
const CARBON     = '#2A2A2A';
const GRAY       = '#666';

function ModalOption({ icon, title, desc, onPress }) {
  return (
    <TouchableOpacity style={styles.modalOption} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.modalOptionIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.modalOptionTitle}>{title}</Text>
        <Text style={styles.modalOptionDesc}>{desc}</Text>
      </View>
      <IconChevronRight size={18} color={VINOTINTO} />
    </TouchableOpacity>
  );
}

export default function Header({
  variant = 'public',
  navigation,
  showTopBar,
  onSearch,
  onSignOut,
  userName,
  onMessagesPress,
  unreadMessagesCount = 0,
}) {
  const [search, setSearch]           = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Todo el país (Colombia)');
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const { user } = useContext(AuthContext);

  const isPublic    = variant === 'public';
  const isDashboard = variant === 'dashboard';
  const topBar      = showTopBar !== undefined ? showTopBar : isPublic;

  const handleSearch = (text) => {
    setSearch(text);
    onSearch?.(text);
  };

  const bgColor = VINOTINTO;
  const fgColor = WHITE;
  const isPublicHeader = isPublic;

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={VINOTINTO}
      />

      {topBar && (
        <TouchableOpacity style={[styles.topBar, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]} activeOpacity={0.7} onPress={() => setLocationModalVisible(true)}>
          <IconLocation size={14} color={WHITE} />
          <Text style={styles.topBarText}>  Enviar a: {selectedLocation}</Text>
          <Text style={{ color: WHITE, fontSize: 10, marginLeft: 6 }}>▼</Text>
        </TouchableOpacity>
      )}

      {/* FILA 1 — Logo + acciones */}
      <View style={[styles.row1, { backgroundColor: bgColor }]}>
        {/* Logo y Menú */}
        <View style={styles.logoArea}>
          {isDashboard && (
            <TouchableOpacity 
              style={styles.menuIconBtn} 
              onPress={() => setDrawerVisible(true)}
              activeOpacity={0.8}
            >
              <IconMenu size={26} color={WHITE} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation?.navigate?.(isDashboard ? 'PostLogin' : 'Home')}
            activeOpacity={0.8}
          >
            <Image
              source={require('../assets/logo.png')}
              style={[styles.logoImg, isDashboard && styles.logoImgDash]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Acciones — public */}
        {isPublic && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation?.navigate?.('Login')}
              activeOpacity={0.8}
            >
              <IconUser size={22} color={fgColor} />
              <Text style={[styles.actionText, { color: fgColor }]}>Ingresa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <IconUserPlus size={22} color={fgColor} />
              <Text style={[styles.actionText, { color: fgColor }]}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Acciones — dashboard */}
        {isDashboard && (
          <View style={styles.dashRight}>
            <TouchableOpacity 
              style={styles.cartIconBtn} 
              onPress={() => navigation?.navigate?.('Cart')} // Asumiendo que haya una vista Cart o la crearemos
              activeOpacity={0.8}
            >
              <IconCart size={24} color={WHITE} />
            </TouchableOpacity>
            {userName && (
              <Text style={styles.dashGreeting} numberOfLines={1}>
                Hola, {userName} 👋
              </Text>
            )}
            {onMessagesPress && (
              <TouchableOpacity style={styles.messagesBtn} onPress={onMessagesPress} activeOpacity={0.8}>
                <IconChat size={20} color={WHITE} />
                {unreadMessagesCount > 0 && (
                  <View style={styles.messagesBadge}>
                    <Text style={styles.messagesBadgeText}>
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {onSignOut && (
              <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.8}>
                <Text style={styles.signOutText}>Salir</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* FILA 2 — Barra de búsqueda a ancho completo */}
      <View style={[styles.row2, { backgroundColor: bgColor }]}>
        <View style={[styles.searchWrapper, isDashboard && styles.searchWrapperDark]}>
          <IconSearch size={18} color={isDashboard ? 'rgba(255,255,255,0.7)' : VINOTINTO} />
          <TextInput
            style={[styles.searchInput, isDashboard && styles.searchInputDark]}
            placeholder="Buscar libros..."
            placeholderTextColor={isDashboard ? 'rgba(255,255,255,0.5)' : '#AAA'}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <IconClose size={16} color={isDashboard ? 'rgba(255,255,255,0.7)' : GRAY} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MODAL — Crear cuenta */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <IconClose size={20} color={CARBON} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Crear cuenta</Text>
            <Text style={styles.modalSubtitle}>¿Cómo quieres unirte a BookyHome?</Text>
            <ModalOption
              icon={<IconUser size={22} color={VINOTINTO} />}
              title="Soy comprador"
              desc="Quiero explorar y comprar libros"
              onPress={() => { setModalVisible(false); navigation?.navigate?.('Register'); }}
            />
            <ModalOption
              icon={<IconBook size={22} color={VINOTINTO} />}
              title="Tengo una librería"
              desc="Quiero vender mis libros en BookyHome"
              onPress={() => { setModalVisible(false); navigation?.navigate?.('RegisterLibrary'); }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Elige tu ubicación */}
      <Modal visible={locationModalVisible} transparent animationType="fade" onRequestClose={() => setLocationModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={[styles.modalCard, { maxHeight: '80%' }]} onStartShouldSetResponder={() => true}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setLocationModalVisible(false)}>
              <IconClose size={20} color={CARBON} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Elige tu ubicación</Text>
            <Text style={styles.modalSubtitle}>Selecciona dónde quieres recibir tus compras.</Text>
            <View style={{ marginTop: 15, width: '100%' }}>
              {['Todo el país (Colombia)', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'].map((city, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    backgroundColor: selectedLocation === city ? '#F4EDE2' : 'transparent',
                    borderWidth: 1.5,
                    borderColor: '#E0DBD4',
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                  onPress={() => {
                    setSelectedLocation(city);
                    setLocationModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: selectedLocation === city ? 'bold' : 'normal', color: CARBON }}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Menú lateral (Drawer) para Dashboard */}
      {isDashboard && (
        <SidebarMenu 
          visible={drawerVisible} 
          onClose={() => setDrawerVisible(false)} 
          user={user} 
          navigation={navigation}
          onSignOut={onSignOut}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  /* Top bar */
  topBar: {
    backgroundColor: VINOTINTO,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  topBarText: { color: WHITE, fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  /* Fila 1 — logo + acciones */
  row1: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 0,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginLeft: -5,
    justifyContent: 'flex-start',
  },
  menuIconBtn: {
    padding: 8,
    marginRight: 2,
    marginLeft: -10,
  },
  logoImg: { width: 180, height: 100, resizeMode: 'contain', marginTop: -25, marginBottom: -25, marginLeft: -25 },
  logoImgDash: { width: 140, height: 80, marginTop: -20, marginBottom: -20, marginLeft: 0 },
  logoText: { fontSize: 17, fontWeight: '800', color: VINOTINTO },
  logoTextWhite: { color: WHITE },

  /* Acciones public */
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginLeft: 6 },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 8,
  },
  actionText: { fontSize: 10, color: WHITE, fontWeight: '700', marginTop: 2, textAlign: 'center' },

  /* Dashboard derecha */
  dashRight:    { flexDirection: 'row', alignItems: 'center', marginRight: 5 },
  cartIconBtn:  { padding: 6 },

  /* Botón de mensajes */
  messagesBtn: { position: 'relative', padding: 4 },
  messagesBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#E53E3E', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  messagesBadgeText: { color: WHITE, fontSize: 9, fontWeight: '800' },

  /* Fila 2 — búsqueda */
  row2: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0DBD4',
  },
  searchWrapperDark: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' },
  searchInput:       { flex: 1, fontSize: 14, color: '#222', paddingVertical: 0 },
  searchInputDark:   { color: WHITE },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalClose:         { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  modalTitle:         { fontSize: 20, fontWeight: '800', color: CARBON, marginBottom: 4 },
  modalSubtitle:      { fontSize: 14, color: GRAY, marginBottom: 20 },
  modalOption:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0EBE5' },
  modalOptionIcon:    { width: 46, height: 46, borderRadius: 23, backgroundColor: BEIGE, justifyContent: 'center', alignItems: 'center' },
  modalOptionTitle:   { fontSize: 15, fontWeight: '700', color: CARBON, marginBottom: 2 },
  modalOptionDesc:    { fontSize: 12, color: GRAY },
});