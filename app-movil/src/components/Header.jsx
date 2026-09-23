// src/components/Header.jsx
import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Modal, StatusBar,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import {
  IconSearch, IconUser, IconUserPlus, IconLocation, IconClose,
  IconChevronRight, IconBook, IconMenu, IconCart, IconCamera, IconFilter,
} from './Icons';
import SidebarMenu from './SidebarMenu';
import BarcodeScanner from './BarcodeScanner';
import FiltrosBusqueda from './FiltrosBusqueda';

const VINOTINTO = '#7A1E3A';
const WHITE     = '#FFFFFF';
const BEIGE     = '#F4EDE2';
const CARBON    = '#2A2A2A';
const GRAY      = '#666';

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

// ── Badge de filtros activos encima del ícono embudo ──────────────────────────
function FilterBadge({ count }) {
  if (!count) return null;
  return (
    <View style={styles.filterBadge}>
      <Text style={styles.filterBadgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function Header({
  variant = 'public',
  navigation,
  showTopBar,
  // Callbacks para pantallas que quieran manejar búsqueda/filtros ellas mismas
  onSearch,
  onSignOut,
  onBarcodeScanned,
  onFilterApply,   // (filtros, tab) => void — si se pasa, la pantalla maneja la lógica
  filtrosActivos = 0, // número de filtros activos para mostrar en el badge
}) {
  const [search, setSearch]               = useState('');
  const [cuentaModalVisible, setCuentaModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Todo el país (Colombia)');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [filtrosActuales, setFiltrosActuales] = useState({});

  const { user } = useContext(AuthContext);

  const isPublic    = variant === 'public';
  const isDashboard = variant === 'dashboard';
  const topBar      = showTopBar !== undefined ? showTopBar : isPublic;

  // Las categorías y precio máximo los carga FiltrosBusqueda internamente
  // — no hace falta duplicar la petición aquí

  const handleSearch = (text) => {
    setSearch(text);
    onSearch?.(text);
  };

  const handleBarcodeDetected = (isbn) => {
    setBarcodeScannerVisible(false);
    onBarcodeScanned?.(isbn);
  };

  const handleFiltrosApply = (filtros, tab) => {
    setFiltrosActuales(filtros);
    setFiltrosVisible(false);
    if (onFilterApply) {
      // La pantalla maneja la navegación/filtrado
      onFilterApply(filtros, tab);
    } else {
      // Comportamiento por defecto: navegar al catálogo con los filtros
      const params = {};
      if (filtros.busqueda)         params.q               = filtros.busqueda;
      if (filtros.categoria_id)     params.categoryId      = filtros.categoria_id;
      else if (filtros.categoria_nombre) params.categoria  = filtros.categoria_nombre;
      if (filtros.ordenar_por && filtros.ordenar_por !== 'relevancia')
        params.ordenar_por = filtros.ordenar_por;

      if (tab === 'librerias') {
        // Llevar al catálogo filtrando por la tienda buscada — la API soporta nombre_tienda y correo_vendedor
        navigation?.navigate?.('CatalogoPublico', {
          nombre_tienda:   filtros.nombre_tienda   || undefined,
          correo_vendedor: filtros.correo_vendedor || undefined,
          ordenar_por:     filtros.ordenar_por !== 'relevancia' ? filtros.ordenar_por : undefined,
        });
      } else {
        navigation?.navigate?.('CatalogoPublico', params);
      }
    }
  };

  const bgColor = VINOTINTO;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={VINOTINTO} translucent={false} />

      {/* TOP BAR — ubicación */}
      {topBar && (
        <TouchableOpacity
          style={styles.topBar}
          activeOpacity={0.7}
          onPress={() => setLocationModalVisible(true)}
        >
          <IconLocation size={14} color={WHITE} />
          <Text style={styles.topBarText}> Envíos a Colombia</Text>
          <Text style={{ color: WHITE, fontSize: 10, marginLeft: 6 }}>▼</Text>
        </TouchableOpacity>
      )}

      {/* FILA 1 — Logo + acciones usuario */}
      <View style={[styles.row1, { backgroundColor: bgColor }]}>
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

        {isPublic && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation?.navigate?.('Login')}
              activeOpacity={0.8}
            >
              <IconUser size={22} color={WHITE} />
              <Text style={styles.actionText}>Ingresa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setCuentaModalVisible(true)}
              activeOpacity={0.8}
            >
              <IconUserPlus size={22} color={WHITE} />
              <Text style={styles.actionText}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>
        )}

        {isDashboard && (
          <View style={styles.dashRight}>
            <TouchableOpacity
              style={styles.cartIconBtn}
              onPress={() => navigation?.navigate?.('Cart')}
              activeOpacity={0.8}
            >
              <IconCart size={24} color={WHITE} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* FILA 2 — Barra de búsqueda + botón filtro al lado */}
      <View style={[styles.row2, { backgroundColor: bgColor }]}>
        {/* Barra de búsqueda: lupa + input + cámara — todo dentro */}
        <View style={[styles.searchWrapper, isDashboard && styles.searchWrapperDash]}>
          <IconSearch size={17} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar libros..."
            placeholderTextColor="#AAA"
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (search.trim()) handleFiltrosApply({ ...filtrosActuales, busqueda: search.trim() }, 'libros');
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
              <IconClose size={14} color={GRAY} />
            </TouchableOpacity>
          )}
          {/* Cámara dentro de la barra */}
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => setBarcodeScannerVisible(true)}
            activeOpacity={0.8}
          >
            <IconCamera size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Botón filtro — FUERA de la barra, al lado derecho */}
        <TouchableOpacity
          style={[styles.filterBtn, filtrosActivos > 0 && styles.filterBtnActive]}
          onPress={() => setFiltrosVisible(true)}
          activeOpacity={0.85}
        >
          <IconFilter size={18} color={filtrosActivos > 0 ? WHITE : VINOTINTO} />
          <FilterBadge count={filtrosActivos} />
        </TouchableOpacity>
      </View>

      {/* ── MODAL: Crear cuenta ────────────────────────────────────────────── */}
      <Modal
        visible={cuentaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCuentaModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCuentaModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setCuentaModalVisible(false)}>
              <IconClose size={20} color={CARBON} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Crear cuenta</Text>
            <Text style={styles.modalSubtitle}>¿Cómo quieres unirte a BookyHome?</Text>
            <ModalOption
              icon={<IconUser size={22} color={VINOTINTO} />}
              title="Soy comprador"
              desc="Quiero explorar y comprar libros"
              onPress={() => { setCuentaModalVisible(false); navigation?.navigate?.('Register'); }}
            />
            <ModalOption
              icon={<IconBook size={22} color={VINOTINTO} />}
              title="Tengo una librería"
              desc="Quiero vender mis libros en BookyHome"
              onPress={() => { setCuentaModalVisible(false); navigation?.navigate?.('RegisterLibrary'); }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MODAL: Ubicación ──────────────────────────────────────────────── */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
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
                    paddingVertical: 12, paddingHorizontal: 15, marginBottom: 10,
                    backgroundColor: selectedLocation === city ? BEIGE : 'transparent',
                    borderWidth: 1.5, borderColor: '#E0DBD4', borderRadius: 8,
                  }}
                  onPress={() => { setSelectedLocation(city); setLocationModalVisible(false); }}
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

      {/* ── Drawer lateral (dashboard) ────────────────────────────────────── */}
      {isDashboard && (
        <SidebarMenu
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          user={user}
          navigation={navigation}
          onSignOut={onSignOut}
        />
      )}

      {/* ── Escáner de código de barras ───────────────────────────────────── */}
      <BarcodeScanner
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />

      {/* ── Modal de filtros ─────────────────────────────────────────────── */}
      <FiltrosBusqueda
        visible={filtrosVisible}
        onClose={() => setFiltrosVisible(false)}
        filtros={filtrosActuales}
        onApply={handleFiltrosApply}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  /* Top bar */
  topBar: {
    backgroundColor: VINOTINTO,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  topBarText: { color: WHITE, fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  /* Fila 1 */
  row1: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  logoArea:    { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  menuIconBtn: { padding: 8, marginRight: 2 },
  logoImg:     { width: 160, height: 51 },
  logoImgDash: { width: 130, height: 41 },

  /* Acciones public */
  actions:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn:  { alignItems: 'center', justifyContent: 'center', minWidth: 60, paddingVertical: 2, paddingHorizontal: 2, borderRadius: 8 },
  actionText: { fontSize: 10, color: WHITE, fontWeight: '700', marginTop: 2, textAlign: 'center' },

  /* Dashboard derecha */
  dashRight:   { flexDirection: 'row', alignItems: 'center', marginRight: 5 },
  cartIconBtn: { padding: 6 },

  /* Fila 2 — búsqueda + filtro */
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 8,
    elevation: 2,
  },

  /* Barra de búsqueda */
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    gap: 6,
  },
  searchWrapperDash: { backgroundColor: WHITE },
  searchInput: { flex: 1, fontSize: 14, color: '#222', paddingVertical: 0 },
  clearBtn:    { padding: 2 },
  cameraBtn:   { padding: 4, marginLeft: 2 },

  /* Botón filtro — cuadrado al lado */
  filterBtn: {
    width: 42, height: 42,
    borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: { backgroundColor: VINOTINTO },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#E53E3E',
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: VINOTINTO,
  },
  filterBadgeText: { color: WHITE, fontSize: 9, fontWeight: '800' },

  /* Modales */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalClose:       { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  modalTitle:       { fontSize: 20, fontWeight: '800', color: CARBON, marginBottom: 4 },
  modalSubtitle:    { fontSize: 14, color: GRAY, marginBottom: 20 },
  modalOption:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0EBE5' },
  modalOptionIcon:  { width: 46, height: 46, borderRadius: 23, backgroundColor: BEIGE, justifyContent: 'center', alignItems: 'center' },
  modalOptionTitle: { fontSize: 15, fontWeight: '700', color: CARBON, marginBottom: 2 },
  modalOptionDesc:  { fontSize: 12, color: GRAY },
});
