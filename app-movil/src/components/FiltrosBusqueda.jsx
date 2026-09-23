// src/components/FiltrosBusqueda.jsx
// Réplica EXACTA del FiltrosHeader del frontend web (Header.jsx, líneas 36-636)
// Todos los colores, iconos SVG y estilos son idénticos al original.
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polygon, Polyline, Line, Rect } from 'react-native-svg';
import api from '../services/api';

// ── Colores exactos del frontend ──────────────────────────────────────────────
const VINOTINTO  = '#7A1E3A';   // var(--vinotinto)
const VINOTINTO2 = '#6b1530';   // gradiente oscuro
const VINOTINTO3 = '#8b1a35';   // gradiente claro del botón "Ver resultados"
const WHITE      = '#FFFFFF';
const CARBON     = '#1a1a1a';   // color texto principal
const GRAY_DARK  = '#555';
const GRAY_MID   = '#666';
const GRAY_LIGHT = '#888';
const GRAY_BORDER = '#e8e2db';  // border de inputs
const GRAY_BG    = '#fafaf9';   // background de secciones
const GRAY_SECT  = '#ede8e1';   // border de secciones
const BEIGE_TAB  = '#f3ede6';   // fondo de la barra de tabs

// ── Iconos SVG exactos del frontend ─────────────────────────────────────────

// Ícono embudo (filtro) — polygon del frontend
const IcoFilter = ({ size = 20, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={color} />
  </Svg>
);

// Ícono lupa
const IcoSearch = ({ size = 14, color = '#b0a89e' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" stroke={color} />
    <Path d="m21 21-4.3-4.3" stroke={color} />
  </Svg>
);

// Ícono X cerrar
const IcoClose = ({ size = 14, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18" stroke={color} /><Path d="m6 6 12 12" stroke={color} />
  </Svg>
);

// Ícono libro (tab Por Libros)
const IcoBook = ({ size = 14, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" stroke={color} />
  </Svg>
);

// Ícono librería/edificio (tab Librerías)
const IcoStore = ({ size = 14, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 21h18" stroke={color} />
    <Path d="M5 21V7l8-4 8 4v14" stroke={color} />
    <Path d="M17 21v-8.5a1.5 1.5 0 0 0-3 0V21" stroke={color} />
  </Svg>
);

// Ícono categoría (☰ tres líneas)
const IcoCat = ({ size = 12, color = VINOTINTO }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 6h16" stroke={color} /><Path d="M4 12h16" stroke={color} /><Path d="M4 18h7" stroke={color} />
  </Svg>
);

// Ícono precio ($)
const IcoDollar = ({ size = 12, color = VINOTINTO }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="1" x2="12" y2="23" stroke={color} />
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={color} />
  </Svg>
);

// Ícono estrella (★ rellena, color vinotinto)
const IcoStar = ({ size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={VINOTINTO} stroke="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

// Ícono regalo/stock
const IcoGift = ({ size = 13, color = VINOTINTO }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 12V22H4V12" stroke={color} />
    <Path d="M22 7H2v5h20V7z" stroke={color} />
    <Path d="M12 22V7" stroke={color} />
    <Path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke={color} />
    <Path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke={color} />
  </Svg>
);

// Ícono ordenar (tres líneas decrecientes)
const IcoSort = ({ size = 12, color = VINOTINTO }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" stroke={color} /><Path d="M7 12h10" stroke={color} /><Path d="M11 18h2" stroke={color} />
  </Svg>
);

// Ícono chevron abajo
const IcoChevronDown = ({ size = 13, color = '#999' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="6 9 12 15 18 9" stroke={color} />
  </Svg>
);

// Ícono limpiar (papelera)
const IcoTrash = ({ size = 13, color = GRAY_MID }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" stroke={color} />
    <Path d="M8 6V4h8v2" stroke={color} />
    <Path d="M19 6 18 20H6L5 6" stroke={color} />
  </Svg>
);

// Ícono edificio/librería para tab
const IcoBuilding = ({ size = 14, color = '#888' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 21h18" stroke={color} />
    <Path d="M5 21V7l8-4 8 4v14" stroke={color} />
  </Svg>
);

// ════════════════════════════════════════════════════════════════════════════

const PRICE_PRESETS = [
  { label: '< $30k',     min: 0,      max: 30000  },
  { label: '$30k–$70k',  min: 30000,  max: 70000  },
  { label: '$70k–$120k', min: 70000,  max: 120000 },
  { label: '> $120k',    min: 120000, max: null    },
];

const RATING_OPTIONS = [
  { val: 0, label: 'Todas' },
  { val: 3, label: '3★+' },
  { val: 4, label: '4★+' },
  { val: 5, label: '5★'  },
];

const SORT_FALLBACK = [
  { value: 'relevancia',   label: 'Relevancia' },
  { value: 'precio_asc',   label: 'Precio: menor a mayor' },
  { value: 'precio_desc',  label: 'Precio: mayor a menor' },
  { value: 'calificacion', label: 'Mayor calificación' },
  { value: 'recientes',    label: 'Más recientes' },
];

const DEFAULTS = {
  busqueda:         '',
  nombre_tienda:    '',
  correo_vendedor:  '',
  categoria_id:     null,
  precio_min:       0,
  precio_max:       1000000,
  calificacion_min: 0,
  disponible:       true,
  ordenar_por:      'relevancia',
};

// ── Sub-componentes FUERA del componente principal ──────────────────────────
// Definirlos dentro causaría re-montaje en cada render (pérdida de foco en inputs)

function LabelRow({ icon, text }) {
  return (
    <View style={s.labelRow}>
      {icon}
      <Text style={s.labelTxt}>{text}</Text>
    </View>
  );
}

function Seccion({ children, style }) {
  return <View style={[s.seccion, style]}>{children}</View>;
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function FiltrosBusqueda({
  visible,
  onClose,
  filtros: filtrosIniciales = {},
  onApply,
}) {
  const [activeTab, setActiveTab] = useState('libros');
  const [filtros, setFiltros]     = useState({ ...DEFAULTS, ...filtrosIniciales });
  const [opciones, setOpciones]   = useState({ categorias: [], precio_min: 0, precio_max: 1000000, opciones_ordenamiento: SORT_FALLBACK });
  const [loading, setLoading]     = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [catOpen, setCatOpen]     = useState(false);
  const [limpiarHover, setLimpiarHover] = useState(false);

  // Cargar opciones desde la API (igual que el frontend)
  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    setLoading(true);
    api.get('/catalogo/filtros-disponibles')
      .then(res => {
        if (!mounted) return;
        const data = res.data || {};
        setOpciones({
          categorias:              data.categorias             || [],
          precio_min:              data.precio_min             || 0,
          precio_max:              data.precio_max             || 1000000,
          opciones_ordenamiento:   data.opciones_ordenamiento  || SORT_FALLBACK,
        });
        if (!initialized) {
          setFiltros(prev => ({ ...prev, precio_max: data.precio_max || prev.precio_max, ...filtrosIniciales }));
          setInitialized(true);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [visible]);

  const set = (campo, valor) => setFiltros(prev => ({ ...prev, [campo]: valor }));

  const handleLimpiar = () => setFiltros({ ...DEFAULTS, precio_max: opciones.precio_max || 1000000 });

  const handleAplicar = () => {
    onApply?.(filtros, activeTab === 'libros' ? 'libros' : 'librerias');
    onClose?.();
  };

  const setRangoPreset = (min, max) => {
    setFiltros(prev => ({ ...prev, precio_min: min, precio_max: max ?? (opciones.precio_max || 1000000) }));
  };

  // Contar filtros activos — lógica exacta del frontend
  const filtrosAplicados = Object.entries(filtros).filter(([key, val]) => {
    if (key === 'disponible')       return val !== true;
    if (key === 'ordenar_por')      return val !== 'relevancia';
    if (key === 'precio_min')       return val > opciones.precio_min;
    if (key === 'precio_max')       return val < opciones.precio_max;
    if (key === 'calificacion_min') return val > 0;
    return val !== null && val !== '' && val !== 0;
  }).length;

  const catNombre = filtros.categoria_id
    ? (opciones.categorias.find(c => c.id_categoria === filtros.categoria_id)?.nombre_categoria ?? 'Categoría')
    : 'Todas las categorías';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/*
        Estructura correcta para modal en React Native:
        El overlay tiene dos zonas flexbox (arriba/abajo vacías)
        que actúan como backdrop, y el contenedor en el medio
        recibe todos los toques sin interferencia.
      */}
      <View style={s.overlay}>
        {/* Zona superior — toque cierra */}
        <TouchableOpacity style={{ flex: 1, width: '100%' }} onPress={onClose} activeOpacity={1} />

        {/* Contenedor del modal — no toca el TouchableOpacity */}
        <View style={s.container}>

              {/* ── Header vinotinto exacto del frontend ── */}
              <View style={s.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Cuadrado redondeado semitransparente con ícono embudo */}
                  <View style={s.filterIconBox}>
                    <IcoFilter size={20} color={WHITE} />
                  </View>
                  <View>
                    <Text style={s.modalTitle}>Filtrar búsqueda</Text>
                    <Text style={s.modalSubtitle}>Afina los resultados a tu gusto</Text>
                  </View>
                </View>
                {/* Botón X circular con fondo semitransparente */}
                <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
                  <IcoClose size={14} color={WHITE} />
                </TouchableOpacity>
              </View>

              {/* ── Cuerpo scrolleable ── */}
              <ScrollView
                style={s.body}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {loading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Text style={{ color: '#888', fontSize: 13, fontWeight: '600', marginTop: 14 }}>
                      Cargando filtros disponibles...
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* ── TABS — grid 2 columnas, fondo #f3ede6 ── */}
                    <View style={s.tabBar}>
                      {[
                        { id: 'libros',     label: 'Por Libros', Icon: IcoBook },
                        { id: 'librerias',  label: 'Librerías',  Icon: IcoStore },
                      ].map(tab => {
                        const active = activeTab === tab.id;
                        return (
                          <TouchableOpacity
                            key={tab.id}
                            style={[s.tab, active && s.tabActive]}
                            onPress={() => setActiveTab(tab.id)}
                            activeOpacity={0.85}
                          >
                            <tab.Icon size={14} color={active ? WHITE : GRAY_LIGHT} />
                            <Text style={[s.tabTxt, active && s.tabTxtActive]}>{tab.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* ── CONTENIDO según tab ── */}
                    {activeTab === 'libros' ? (
                      <>
                        {/* BÚSQUEDA */}
                        <Seccion>
                          <LabelRow icon={<IcoSearch size={12} color={VINOTINTO} />} text="Búsqueda" />
                          <View style={s.inputWrap}>
                            <View style={{ position: 'absolute', left: 11, top: '50%', transform: [{ translateY: -7 }], zIndex: 1 }}>
                              <IcoSearch size={14} color="#b0a89e" />
                            </View>
                            <TextInput
                              style={[s.input, { paddingLeft: 34 }]}
                              value={filtros.busqueda}
                              onChangeText={v => set('busqueda', v)}
                              placeholder="Título, autor o ISBN..."
                              placeholderTextColor="#bbb"
                              returnKeyType="search"
                            />
                          </View>
                        </Seccion>

                        {/* CATEGORÍA */}
                        <Seccion style={{ marginTop: 8 }}>
                          <LabelRow icon={<IcoCat size={12} color={VINOTINTO} />} text="Categoría" />
                          <TouchableOpacity
                            style={s.selectRow}
                            onPress={() => setCatOpen(v => !v)}
                            activeOpacity={0.85}
                          >
                            <Text style={[s.selectTxt, filtros.categoria_id && { fontWeight: '600' }]} numberOfLines={1}>
                              {catNombre}
                            </Text>
                            <IcoChevronDown size={13} color="#999" />
                          </TouchableOpacity>
                          {catOpen && (
                            <View style={s.catDropdown}>
                              <TouchableOpacity
                                style={s.catOption}
                                onPress={() => { set('categoria_id', null); setCatOpen(false); }}
                              >
                                <Text style={[s.catOptionTxt, !filtros.categoria_id && s.catOptionActive]}>
                                  Todas las categorías
                                </Text>
                              </TouchableOpacity>
                              {opciones.categorias.map(cat => (
                                <TouchableOpacity
                                  key={cat.id_categoria}
                                  style={s.catOption}
                                  onPress={() => { set('categoria_id', cat.id_categoria); setCatOpen(false); }}
                                >
                                  <Text style={[s.catOptionTxt, filtros.categoria_id === cat.id_categoria && s.catOptionActive]}>
                                    {cat.nombre_categoria}
                                    {cat.cantidad_libros != null ? (
                                      <Text style={{ color: GRAY_MID }}> ({cat.cantidad_libros})</Text>
                                    ) : null}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </Seccion>

                        {/* RANGO DE PRECIO */}
                        <Seccion style={{ marginTop: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <LabelRow icon={<IcoDollar size={12} color={VINOTINTO} />} text="Rango de precio" />
                            <View style={s.precioBadge}>
                              <Text style={s.precioBadgeTxt}>
                                ${(filtros.precio_min || 0).toLocaleString('es-CO')} – ${(filtros.precio_max || 0).toLocaleString('es-CO')}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                            <View style={[s.inputWrap, { flex: 1 }]}>
                              <Text style={s.prefixCurrency}>$</Text>
                              <TextInput
                                style={[s.input, { paddingLeft: 22 }]}
                                value={String(filtros.precio_min)}
                                onChangeText={v => { const n = parseInt(v)||0; if (n <= filtros.precio_max) set('precio_min', n); }}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#bbb"
                              />
                            </View>
                            <Text style={{ color: '#ccc', fontSize: 16, fontWeight: '300', flexShrink: 0 }}>—</Text>
                            <View style={[s.inputWrap, { flex: 1 }]}>
                              <Text style={s.prefixCurrency}>$</Text>
                              <TextInput
                                style={[s.input, { paddingLeft: 22 }]}
                                value={String(filtros.precio_max)}
                                onChangeText={v => { const n = parseInt(v)||opciones.precio_max; if (n >= filtros.precio_min) set('precio_max', n); }}
                                keyboardType="numeric"
                                placeholder={String(opciones.precio_max)}
                                placeholderTextColor="#bbb"
                              />
                            </View>
                          </View>
                          {/* Chips de precio — exactos del frontend */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                            {PRICE_PRESETS.map(preset => {
                              const isActive = filtros.precio_min === preset.min &&
                                filtros.precio_max === (preset.max ?? opciones.precio_max);
                              return (
                                <TouchableOpacity
                                  key={preset.label}
                                  style={[s.chip, isActive && s.chipActive]}
                                  onPress={() => setRangoPreset(preset.min, preset.max)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={[s.chipTxt, isActive && s.chipTxtActive]}>{preset.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </Seccion>

                        {/* CALIFICACIÓN MÍNIMA */}
                        <Seccion style={{ marginTop: 8 }}>
                          <LabelRow icon={<IcoStar size={12} />} text="Calificación mínima" />
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            {RATING_OPTIONS.map(item => {
                              const sel = filtros.calificacion_min === item.val;
                              return (
                                <TouchableOpacity
                                  key={item.val}
                                  style={[s.ratingBtn, sel && s.ratingBtnActive]}
                                  onPress={() => set('calificacion_min', item.val)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={[s.ratingBtnTxt, sel && s.ratingBtnTxtActive]}>{item.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </Seccion>

                        {/* SOLO EN STOCK — toggle igual al frontend */}
                        <TouchableOpacity
                          style={[s.stockRow, filtros.disponible && s.stockRowActive]}
                          onPress={() => set('disponible', !filtros.disponible)}
                          activeOpacity={0.85}
                          accessibilityRole="switch"
                          accessibilityState={{ checked: filtros.disponible }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <View style={[s.stockIconBox, filtros.disponible && s.stockIconBoxActive]}>
                              <IcoGift size={13} color={filtros.disponible ? VINOTINTO : '#aaa'} />
                            </View>
                            <View>
                              <Text style={s.stockLabel}>Solo en stock</Text>
                              <Text style={s.stockDesc}>Ocultar agotados</Text>
                            </View>
                          </View>
                          {/* Toggle switch animado igual al frontend */}
                          <View style={[s.toggleTrack, filtros.disponible && s.toggleTrackOn]}>
                            <View style={[s.toggleThumb, filtros.disponible && s.toggleThumbOn]} />
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : (
                      /* ── TAB LIBRERÍAS ── */
                      <>
                        <Seccion>
                          <LabelRow
                            icon={<IcoBuilding size={12} color={VINOTINTO} />}
                            text="Nombre de la librería"
                          />
                          <TextInput
                            style={s.input}
                            value={filtros.nombre_tienda}
                            onChangeText={v => set('nombre_tienda', v)}
                            placeholder="Buscar por nombre de tienda..."
                            placeholderTextColor="#bbb"
                            returnKeyType="search"
                          />
                        </Seccion>

                        <Seccion style={{ marginTop: 8 }}>
                          <LabelRow
                            icon={
                              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={VINOTINTO} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <Rect x="2" y="4" width="20" height="16" rx="2" stroke={VINOTINTO} />
                                <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={VINOTINTO} />
                              </Svg>
                            }
                            text="Correo del vendedor"
                          />
                          <TextInput
                            style={s.input}
                            value={filtros.correo_vendedor}
                            onChangeText={v => set('correo_vendedor', v)}
                            placeholder="contacto@libreria.com"
                            placeholderTextColor="#bbb"
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </Seccion>

                        {/* Recuadro informativo amarillo — igual al frontend */}
                        <View style={s.infoBox}>
                          <View style={s.infoIconBox}>
                            <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <Circle cx="12" cy="12" r="10" stroke={WHITE} />
                              <Path d="M12 16v-4" stroke={WHITE} />
                              <Path d="M12 8h.01" stroke={WHITE} />
                            </Svg>
                          </View>
                          <Text style={s.infoTxt}>
                            Encuentra vendedores específicos por su razón social o email oficial.
                          </Text>
                        </View>
                      </>
                    )}

                    {/* ORDENAR POR — visible en ambos tabs */}
                    <Seccion style={{ marginTop: 8 }}>
                      <LabelRow icon={<IcoSort size={12} color={VINOTINTO} />} text="Ordenar por" />
                      <View>
                        {opciones.opciones_ordenamiento.map(op => {
                          const sel = filtros.ordenar_por === op.value;
                          return (
                            <TouchableOpacity
                              key={op.value}
                              style={[s.sortOption, sel && s.sortOptionActive]}
                              onPress={() => set('ordenar_por', op.value)}
                              activeOpacity={0.8}
                            >
                              <Text style={[s.sortOptionTxt, sel && s.sortOptionTxtActive]}>{op.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </Seccion>
                  </>
                )}
              </ScrollView>

              {/* ── Footer: Limpiar + Ver resultados ── */}
              <View style={s.footer}>
                <TouchableOpacity
                  style={[s.btnLimpiar, limpiarHover && s.btnLimpiarHover]}
                  onPress={handleLimpiar}
                  onPressIn={() => setLimpiarHover(true)}
                  onPressOut={() => setLimpiarHover(false)}
                  activeOpacity={0.85}
                >
                  <IcoTrash size={13} color={limpiarHover ? '#c0392b' : GRAY_MID} />
                  <Text style={[s.btnLimpiarTxt, limpiarHover && s.btnLimpiarTxtHover]}>Limpiar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.btnAplicar}
                  onPress={handleAplicar}
                  activeOpacity={0.88}
                >
                  <IcoFilter size={14} color={WHITE} />
                  <Text style={s.btnAplicarTxt}>Ver resultados</Text>
                  {filtrosAplicados > 0 && (
                    <View style={s.aplicarBadge}>
                      <Text style={s.aplicarBadgeTxt}>{filtrosAplicados}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

            </View>
        {/* Zona inferior — toque cierra */}
        <TouchableOpacity style={{ flex: 1, width: '100%' }} onPress={onClose} activeOpacity={1} />
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ESTILOS — replicando los inline styles del frontend web
// ════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  // Overlay: columna flex, zonas arriba/abajo son el backdrop
  overlay: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'rgba(10,5,8,0.6)',
  },

  // Contenedor del modal
  container: {
    backgroundColor: WHITE,
    borderRadius: 20,
    width: '100%',
    alignSelf: 'center',
    marginHorizontal: 20,
    maxWidth: 460,
    maxHeight: '82%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 15 },
    elevation: 20,
  },

  // Header vinotinto: gradiente 135deg de #7A1E3A a #6b1530
  modalHeader: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    // Gradiente simulado con color sólido vinotinto (más oscuro)
    backgroundColor: VINOTINTO,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  // Cuadrado redondeado con ícono embudo — rgba(255,255,255,0.18) border rgba(255,255,255,0.25)
  filterIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  modalTitle:    { fontSize: 17, fontWeight: '800', color: WHITE, letterSpacing: -0.1 },
  modalSubtitle: { marginTop: 2, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },

  // Botón X circular — rgba(255,255,255,0.15) border rgba(255,255,255,0.2)
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },

  // Body scrolleable
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  // ── TABS ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: BEIGE_TAB,     // #f3ede6
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    gap: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 9, gap: 6,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: VINOTINTO,
    shadowColor: VINOTINTO, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tabTxt:       { fontSize: 13, fontWeight: '500', color: GRAY_LIGHT },
  tabTxtActive: { color: WHITE, fontWeight: '700' },

  // ── SECCIÓN ──
  seccion: {
    backgroundColor: GRAY_BG,       // #fafaf9
    borderWidth: 1, borderColor: GRAY_SECT,  // #ede8e1
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 13,
  },

  // ── LABEL ──
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
  labelTxt: {
    fontSize: 11, fontWeight: '700', color: VINOTINTO,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // ── INPUT ──
  inputWrap: { position: 'relative' },
  input: {
    width: '100%',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 13,
    borderWidth: 1.5, borderColor: GRAY_BORDER,   // #e8e2db
    borderRadius: 9,
    fontSize: 13,
    color: CARBON,
    backgroundColor: WHITE,
  },
  prefixCurrency: {
    position: 'absolute', left: 9, top: Platform.OS === 'ios' ? 11 : 9,
    fontSize: 12, color: '#aaa', fontWeight: '700', zIndex: 1,
  },

  // ── SELECTOR CATEGORÍA ──
  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 13, paddingVertical: 10,
    borderWidth: 1.5, borderColor: GRAY_BORDER, borderRadius: 9,
    backgroundColor: WHITE,
  },
  selectTxt: { flex: 1, fontSize: 13, color: CARBON, fontWeight: '400' },

  catDropdown: {
    marginTop: 4, borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, backgroundColor: WHITE, overflow: 'hidden',
  },
  catOption:     { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  catOptionTxt:  { fontSize: 14, color: CARBON },
  catOptionActive:{ fontWeight: '700', color: VINOTINTO },

  // ── PRECIO ──
  precioBadge: {
    backgroundColor: 'rgba(122,30,58,0.08)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  precioBadgeTxt: { fontSize: 11.5, fontWeight: '700', color: VINOTINTO },

  // Chips de precio — igual al frontend
  chip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e0d8d0',
    backgroundColor: WHITE,
  },
  chipActive: {
    borderColor: VINOTINTO,
    backgroundColor: 'rgba(122,30,58,0.08)',
  },
  chipTxt:       { fontSize: 11.5, fontWeight: '500', color: GRAY_MID },
  chipTxtActive: { color: VINOTINTO, fontWeight: '700' },

  // ── CALIFICACIÓN ──
  ratingBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e0d8d0',
    backgroundColor: WHITE, alignItems: 'center',
  },
  ratingBtnActive: {
    backgroundColor: VINOTINTO, borderColor: VINOTINTO,
    shadowColor: VINOTINTO, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ratingBtnTxt:       { fontSize: 12.5, fontWeight: '500', color: GRAY_DARK },
  ratingBtnTxtActive: { color: WHITE, fontWeight: '700' },

  // ── TOGGLE SOLO EN STOCK ──
  stockRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 13, paddingVertical: 10, marginTop: 8,
    backgroundColor: GRAY_BG, borderRadius: 12,
    borderWidth: 1, borderColor: GRAY_SECT,
  },
  stockRowActive: {
    backgroundColor: 'rgba(122,30,58,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(122,30,58,0.2)',
  },
  stockIconBox: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: '#f0ebe3',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stockIconBoxActive: { backgroundColor: 'rgba(122,30,58,0.12)' },
  stockLabel: { fontSize: 13, fontWeight: '600', color: CARBON, lineHeight: 18 },
  stockDesc:  { fontSize: 11, color: '#999' },

  // Toggle — animación con position absoluta igual al frontend
  toggleTrack: {
    width: 40, height: 22, borderRadius: 11,
    backgroundColor: '#d9d2c9',
    position: 'relative', justifyContent: 'center',
    flexShrink: 0,
  },
  toggleTrackOn: { backgroundColor: VINOTINTO },
  toggleThumb: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: WHITE,
    position: 'absolute', top: 3, left: 3,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  toggleThumbOn: { left: 21 },

  // ── ORDENAR POR ──
  sortOption: {
    paddingVertical: 10, paddingHorizontal: 13,
    borderRadius: 8, borderWidth: 1, borderColor: '#e0d8d0',
    backgroundColor: WHITE, marginBottom: 5,
  },
  sortOptionActive: { backgroundColor: VINOTINTO, borderColor: VINOTINTO },
  sortOptionTxt:       { fontSize: 13, color: CARBON },
  sortOptionTxtActive: { color: WHITE, fontWeight: '700' },

  // ── LIBRERÍAS — infobox amarillo ──
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 12,
    backgroundColor: '#fffbf0',
    borderWidth: 1, borderColor: '#f5dfa0',
    marginTop: 8,
  },
  infoIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#f5a623',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoTxt: { flex: 1, fontSize: 12.5, color: '#7a5010', lineHeight: 19, fontWeight: '500' },

  // ── FOOTER ──
  footer: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1, borderTopColor: GRAY_SECT,
    backgroundColor: WHITE,
  },

  // Botón Limpiar — border #e0d8d0, blanco, hover rojo
  btnLimpiar: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#e0d8d0',
    borderRadius: 10, backgroundColor: WHITE,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  btnLimpiarHover: { borderColor: '#c0392b', backgroundColor: '#fff5f5' },
  btnLimpiarTxt:       { fontSize: 13.5, fontWeight: '600', color: GRAY_MID },
  btnLimpiarTxtHover:  { color: '#c0392b' },

  // Botón Ver resultados — gradiente vinotinto → #8b1a35, sombra vinotinto
  btnAplicar: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: VINOTINTO,   // gradiente simulado
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    shadowColor: VINOTINTO, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnAplicarTxt: { fontSize: 14, fontWeight: '700', color: WHITE },

  // Badge del botón Ver resultados
  aplicarBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2,
  },
  aplicarBadgeTxt: { color: WHITE, fontSize: 11.5, fontWeight: '700', lineHeight: 16 },
});
