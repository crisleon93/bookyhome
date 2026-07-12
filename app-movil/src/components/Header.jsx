// src/components/Header.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Modal, StatusBar,
} from 'react-native';
import { IconSearch, IconUser, IconUserPlus, IconLocation, IconClose, IconChevronRight, IconBook } from './Icons';

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
}) {
  const [search, setSearch]           = useState('');
  const [modalVisible, setModalVisible] = useState(false);
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

      {/* FILA 0 — Top bar "Envíos a todo el país" */}
      {topBar && (
        <View style={styles.topBar}>
          <IconLocation size={14} color={WHITE} />
          <Text style={styles.topBarText}>  Envíos a todo el país</Text>
        </View>
      )}

      {/* FILA 1 — Logo + acciones */}
      <View style={[styles.row1, { backgroundColor: bgColor }]}>
        {/* Logo */}
        <TouchableOpacity
          style={styles.logoArea}
          onPress={() => navigation?.navigate?.(isDashboard ? 'PostLogin' : 'Home')}
          activeOpacity={0.8}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </TouchableOpacity>

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
            {userName && (
              <Text style={styles.dashGreeting} numberOfLines={1}>
                Hola, {userName} 👋
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    minHeight: 70,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginLeft: -42,
    justifyContent: 'flex-start',
    minWidth: 150,
    maxWidth: 200,
  },
  logoImg: { width: 170, height: 92, resizeMode: 'contain' },
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
  dashRight:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dashGreeting: { color: WHITE, fontSize: 13, fontWeight: '600', maxWidth: 160 },
  signOutBtn:   { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
  signOutText:  { color: WHITE, fontSize: 12, fontWeight: '700' },

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