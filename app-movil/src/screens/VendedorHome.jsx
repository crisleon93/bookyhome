import { useThemedStyles } from '../context/ThemeContext';
import React, { useState, useCallback, useContext, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image, Modal, TextInput, Alert, useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useChatSocket } from '../context/ChatSocketContext';
import {
  getMisLibros, getStatsVendedor, getTopVendidos, getMisVentas,
  getAlertasStock, getNotifications, getLibreria, resolveImageUrl,
} from '../services/api';
import SidebarVendedor from '../components/SidebarVendedor';
import Footer from '../components/Footer';

const PRIMARY   = '#7A1E3A';
const WHITE     = '#FFFFFF';
const BG        = '#F5F3EF';
const BORDER    = '#E5E0D8';
const TEXT      = '#1A1A1A';
const MUTED     = '#8A8A8A';
const SUCCESS   = '#16A34A';
const CHART_BLUE = '#2563EB';
const UMBRAL_DEFAULT = 3;
const UMBRAL_STORAGE_KEY = 'vendedor_stock_umbral';

const fmt = (val) =>
  val == null
    ? '$0 COP'
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.floor(val));

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7C2F'];

const getBookImageUri = (book) => {
  const raw = book?.imagen_url || book?.imagen_principal || book?.imagen
    || (Array.isArray(book?.imagenes) ? book.imagenes[0] : book?.imagenes) || book?.foto;
  return resolveImageUrl(raw);
};

const getNotificationIcon = (type) => {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('pedido') || normalized.includes('orden')) return '🛍️';
  if (normalized.includes('pago')) return '💳';
  if (normalized.includes('mensaje')) return '💬';
  if (normalized.includes('entrega') || normalized.includes('envio')) return '🚚';
  if (normalized.includes('resena')) return '⭐';
  return '🔔';
};

const parseSaleDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatPeriodDate = (date, options) => date.toLocaleDateString('es-CO', options);

export default function VendedorHome({ navigation: navProp }) {
  const s = useThemedStyles(themeBaseS);
  const navigation = navProp || useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const { user, signOut } = useContext(AuthContext);
  const { recargarSalas } = useChatSocket();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const scrollRef = useRef(null);
  const inventoryPosition = useRef(0);
  const [libros,     setLibros]     = useState([]);
  const [tienda,     setTienda]     = useState(null);
  const [ventas,     setVentas]     = useState([]);
  const [errorVentas, setErrorVentas] = useState(false);
  const [stats,      setStats]      = useState(null);
  const [top,        setTop]        = useState([]);
  const [alertas,    setAlertas]    = useState([]);
  const [errorAlertas, setErrorAlertas] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [errorNotificaciones, setErrorNotificaciones] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [umbralStock, setUmbralStock] = useState(UMBRAL_DEFAULT);
  const [umbralModal, setUmbralModal] = useState(false);
  const [umbralInput, setUmbralInput] = useState(String(UMBRAL_DEFAULT));
  const [guardandoUmbral, setGuardandoUmbral] = useState(false);
  const [periodoGrafico, setPeriodoGrafico] = useState('semana');
  const [desplazamientoGrafico, setDesplazamientoGrafico] = useState(0);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(null);
  const [tipoGrafico, setTipoGrafico] = useState('area');

  useEffect(() => {
    AsyncStorage.getItem(UMBRAL_STORAGE_KEY)
      .then((value) => {
        if (value === null) return;
        const saved = Number(value);
        if (Number.isInteger(saved) && saved >= 0 && saved <= 100) {
          setUmbralStock(saved);
          setUmbralInput(String(saved));
        }
      })
      .catch((error) => console.warn('[VENDEDOR_HOME] No se pudo leer el umbral:', error?.message));
  }, []);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [rLib, rStats, rTop, rAlt, rVentas, rNotifications, rStore] = await Promise.all([
        getMisLibros().catch(() => ({ data: [] })),
        getStatsVendedor().catch(() => ({ data: null })),
        getTopVendidos().catch(() => ({ data: [] })),
        getAlertasStock(umbralStock).catch(() => ({ data: null })),
        getMisVentas().catch(() => ({ data: null })),
        getNotifications(false, 10, 0).catch(() => ({ data: null })),
        getLibreria().catch(() => ({ data: null })),
      ]);
      setLibros(Array.isArray(rLib.data) ? rLib.data : []);
      setStats(rStats.data || null);
      setTop(Array.isArray(rTop.data) ? rTop.data : []);
      setAlertas(Array.isArray(rAlt.data) ? rAlt.data : []);
      setErrorAlertas(!Array.isArray(rAlt.data));
      setVentas(Array.isArray(rVentas.data) ? rVentas.data : []);
      setErrorVentas(!Array.isArray(rVentas.data));
      const itemsNotificaciones = rNotifications.data?.notificaciones;
      setNotificaciones(Array.isArray(itemsNotificaciones) ? itemsNotificaciones : []);
      setErrorNotificaciones(!Array.isArray(itemsNotificaciones));
      setTienda(rStore.data && typeof rStore.data === 'object' ? rStore.data : null);
    } catch { /* silencioso */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [umbralStock]);

  useFocusEffect(useCallback(() => {
    cargar();
    recargarSalas();
  }, [cargar, recargarSalas]));

  const onRefresh = () => { setRefreshing(true); cargar(true); recargarSalas(); };

  const statsLibros = {
    total:      libros.length,
    stock:      libros.reduce((a, l) => a + (l.stock || 0), 0),
    categorias: [...new Set(libros.map(l => l.nombre_categoria).filter(Boolean))].length,
  };

  const periodosGrafico = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let inicio;
    let cantidad;
    let titulo;
    let paso;
    let etiquetas;

    if (periodoGrafico === 'semana') {
      const diaSemana = (hoy.getDay() + 6) % 7;
      inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - diaSemana + desplazamientoGrafico * 7);
      cantidad = 7;
      paso = 'dia';
      etiquetas = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      titulo = desplazamientoGrafico === 0
        ? `Esta semana · ${formatPeriodDate(inicio, { day: 'numeric', month: 'short' })} - ${formatPeriodDate(fin, { day: 'numeric', month: 'short' })}`
        : `${formatPeriodDate(inicio, { day: 'numeric', month: 'short' })} - ${formatPeriodDate(fin, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (periodoGrafico === 'mes') {
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() + desplazamientoGrafico, 1);
      inicio = mes;
      cantidad = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
      paso = 'dia';
      etiquetas = Array.from({ length: cantidad }, (_, index) => String(index + 1));
      titulo = formatPeriodDate(mes, { month: 'long', year: 'numeric' });
      titulo = desplazamientoGrafico === 0 ? `Este mes · ${titulo}` : titulo;
    } else {
      const anio = hoy.getFullYear() + desplazamientoGrafico;
      inicio = new Date(anio, 0, 1);
      cantidad = 12;
      paso = 'mes';
      etiquetas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      titulo = desplazamientoGrafico === 0 ? `Este año · ${anio}` : `Año ${anio}`;
    }

    const totales = new Map();
    (Array.isArray(ventas) ? ventas : []).forEach((venta) => {
      const fecha = parseSaleDate(venta.fecha);
      if (!fecha) return;
      const clave = paso === 'dia'
        ? dateKey(fecha)
        : `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const agregado = totales.get(clave) || { total: 0, ordenes: new Set() };
      agregado.total += Number(venta.total) || 0;
      if (venta.id_orden != null) agregado.ordenes.add(venta.id_orden);
      totales.set(clave, agregado);
    });

    const items = Array.from({ length: cantidad }, (_, index) => {
      const fecha = new Date(inicio);
      if (paso === 'dia') fecha.setDate(inicio.getDate() + index);
      else fecha.setMonth(index);
      const clave = paso === 'dia'
        ? dateKey(fecha)
        : `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const agregado = totales.get(clave);
      const esHoy = paso === 'mes'
        ? fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth()
        : dateKey(fecha) === dateKey(hoy);
      return {
        label: etiquetas[index],
        fecha,
        total: agregado?.total || 0,
        ordenes: agregado?.ordenes.size || 0,
        esHoy,
      };
    });

    return { titulo, items };
  }, [ventas, periodoGrafico, desplazamientoGrafico]);

  const itemSeleccionado = indiceSeleccionado == null
    ? periodosGrafico.items.find((item) => item.esHoy) || periodosGrafico.items[0]
    : periodosGrafico.items[indiceSeleccionado] || periodosGrafico.items[0];
  const maxTotalGrafico = Math.max(50000, ...periodosGrafico.items.map((item) => item.total));
  const anchoVisibleGrafico = Math.max(280, screenWidth - 56);
  const anchoGrafico = anchoVisibleGrafico;
  const altoGrafico = 176;
  const baseGrafico = 142;
  const puntosGrafico = periodosGrafico.items.map((item, index) => ({
    x: periodosGrafico.items.length > 1
      ? 34 + (index / (periodosGrafico.items.length - 1)) * (anchoGrafico - 46)
      : anchoGrafico / 2,
    y: baseGrafico - (item.total / maxTotalGrafico) * 110,
  }));
  const lineaGrafico = puntosGrafico.map((punto, index) =>
    `${index === 0 ? 'M' : 'L'} ${punto.x} ${punto.y}`
  ).join(' ');
  const areaGrafico = puntosGrafico.length
    ? `${lineaGrafico} L ${puntosGrafico[puntosGrafico.length - 1].x} ${baseGrafico} L ${puntosGrafico[0].x} ${baseGrafico} Z`
    : '';
  const formatoEje = (value) => value >= 1000000
    ? `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`
    : value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value));
  const totalPeriodo = periodosGrafico.items.reduce((total, item) => total + item.total, 0);
  const ordenesPeriodo = new Set(
    (Array.isArray(ventas) ? ventas : [])
      .filter((venta) => {
        const fecha = parseSaleDate(venta.fecha);
        if (!fecha) return false;
        if (periodoGrafico === 'semana' || periodoGrafico === 'mes') {
          const item = periodosGrafico.items.find((periodo) => dateKey(periodo.fecha) === dateKey(fecha));
          return Boolean(item);
        }
        return periodosGrafico.items.some((periodo) =>
          periodo.fecha.getFullYear() === fecha.getFullYear() && periodo.fecha.getMonth() === fecha.getMonth()
        );
      })
      .map((venta) => venta.id_orden)
      .filter((id) => id != null)
  ).size;

  const nombreTienda = tienda?.nombre_tienda || user?.nombre_tienda
    || (user?.nombre && user.nombre !== 'Vendedor' ? user.nombre : 'tu Librería');
  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 19 ? 'Buenas tardes' : 'Buenas noches';
  const fechaActual = formatPeriodDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' });
  const guardarUmbral = async () => {
    const nuevoUmbral = Number(umbralInput);
    if (!Number.isInteger(nuevoUmbral) || nuevoUmbral < 0 || nuevoUmbral > 100) {
      Alert.alert('Umbral no válido', 'Ingresa un número entero entre 0 y 100.');
      return;
    }
    setGuardandoUmbral(true);
    try {
      const response = await getAlertasStock(nuevoUmbral);
      if (!Array.isArray(response.data)) throw new Error('El servidor devolvió un formato de alertas no válido.');
      await AsyncStorage.setItem(UMBRAL_STORAGE_KEY, String(nuevoUmbral));
      setUmbralStock(nuevoUmbral);
      setAlertas(response.data);
      setErrorAlertas(false);
      setUmbralModal(false);
    } catch (error) {
      setErrorAlertas(true);
      Alert.alert('No se pudo actualizar el umbral', error?.response?.data?.detail || error?.message || 'Inténtalo de nuevo.');
    } finally {
      setGuardandoUmbral(false);
    }
  };
  const navegarPeriodo = (desplazamiento) => {
    setDesplazamientoGrafico((actual) => actual + desplazamiento);
    setIndiceSeleccionado(null);
  };
  const seleccionarPeriodo = (periodo) => {
    setPeriodoGrafico(periodo);
    setDesplazamientoGrafico(0);
    setIndiceSeleccionado(null);
  };
  const irAInventario = () => {
    scrollRef.current?.scrollTo({ y: inventoryPosition.current, animated: true });
  };

  const Header = () => (
    <View style={s.header}>
      <TouchableOpacity onPress={() => setSidebarVisible(true)} style={s.menuBtn}>
        <Text style={s.menuIcon}>☰</Text>
      </TouchableOpacity>
      <Text style={s.headerTitle}>Panel de vendedor</Text>
      <View style={{ flex: 1 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <Header />
        <View style={s.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={{ color: MUTED, marginTop: 12, fontSize: 13 }}>Cargando tu tienda…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <Header />

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
      >
        <LinearGradient
          colors={['#2A111A', '#4A1224', PRIMARY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.welcome}
        >
          <View style={s.welcomeContent}>
            <Text style={s.welcomeTitle}>{saludo}, {nombreTienda} 📚</Text>
            <Text style={s.welcomeSub}>
              Aquí tienes el resumen en tiempo real del rendimiento, ventas y actividad de tu catálogo en BookyHome.
            </Text>
            <View style={s.welcomeMeta}>
              <Text style={s.welcomeDate}>▦  {fechaActual}</Text>
              <Text style={s.welcomeStore}>▣  {nombreTienda}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.kpisGrid}>
          <TouchableOpacity style={s.kpiCard} onPress={() => navigation.navigate('VentasVendedor')} activeOpacity={0.8}>
            <View style={s.kpiHeader}>
              <Text style={s.kpiLabel}>Ventas este mes</Text>
              <View style={[s.kpiIcon, s.kpiIconWine]}><Text>💳</Text></View>
            </View>
            <Text style={s.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{fmt(stats?.total_mes)}</Text>
            <View style={s.kpiFooter}>
              <Text style={s.kpiHighlight} numberOfLines={1}>Hoy: {fmt(stats?.total_hoy)}</Text>
              <Text style={s.kpiLink}>Ver ventas →</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.kpiCard} onPress={() => navigation.navigate('PedidosVendedor')} activeOpacity={0.8}>
            <View style={s.kpiHeader}>
              <Text style={s.kpiLabel}>Órdenes este mes</Text>
              <View style={[s.kpiIcon, s.kpiIconAmber]}><Text>🛍️</Text></View>
            </View>
            <Text style={s.kpiValue}>{stats?.ordenes_mes ?? 0}<Text style={s.kpiUnit}> órdenes</Text></Text>
            <View style={s.kpiFooter}>
              <Text style={s.kpiSubText}>{stats?.ordenes_hoy ?? 0} orden(es) hoy</Text>
              <Text style={s.kpiLink}>Ver pedidos →</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.kpiCard} onPress={irAInventario} activeOpacity={0.8}>
            <View style={s.kpiHeader}>
              <Text style={s.kpiLabel}>Libros en catálogo</Text>
              <View style={[s.kpiIcon, s.kpiIconBlue]}><Text>📚</Text></View>
            </View>
            <Text style={s.kpiValue}>{statsLibros.total}<Text style={s.kpiUnit}> títulos</Text></Text>
            <View style={s.kpiFooter}>
              <Text style={s.kpiSubText}>{statsLibros.stock} unidades en stock</Text>
              <Text style={s.kpiLink}>Gestionar →</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.kpiCard} onPress={() => navigation.navigate('Libreria')} activeOpacity={0.8}>
            <View style={s.kpiHeader}>
              <Text style={s.kpiLabel}>Salud de inventario</Text>
              <View style={[s.kpiIcon, errorAlertas ? s.kpiIconRed : alertas.length > 0 ? s.kpiIconRed : s.kpiIconGreen]}>
                <Text>{errorAlertas || alertas.length > 0 ? '⚠️' : '✅'}</Text>
              </View>
            </View>
            <Text style={s.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
              {errorAlertas ? 'No disponible' : alertas.length > 0 ? `${alertas.length} en alerta` : '100% Óptimo'}
            </Text>
            <View style={s.kpiFooter}>
              <Text style={[s.kpiStatus, alertas.length > 0 && s.kpiStatusWarning]}>
                {errorAlertas ? 'No se pudo consultar' : alertas.length > 0 ? `Stock ≤ ${umbralStock} uds` : 'Sin quiebres de stock'}
              </Text>
              <Text style={s.kpiLink}>Revisar ↓</Text>
            </View>
          </TouchableOpacity>
        </View>

          {/* Rendimiento y tendencia de ventas */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>Rendimiento y tendencia de ventas</Text>
                <Text style={s.chartDescription}>Explora tus ingresos por semana, mes o año</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('VentasVendedor')} accessibilityRole="button" accessibilityLabel="Ver historial de ventas">
                <Text style={s.linkText}>Ver ventas →</Text>
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <View style={s.chartControlRow}>
                <View style={s.chartTabs}>
                  {[
                    { id: 'semana', label: 'Semana' },
                    { id: 'mes', label: 'Mes' },
                    { id: 'anio', label: 'Año' },
                  ].map((opcion) => (
                    <TouchableOpacity
                      key={opcion.id}
                      style={[s.chartTab, periodoGrafico === opcion.id && s.chartTabActive]}
                      onPress={() => seleccionarPeriodo(opcion.id)}
                    >
                      <Text style={[s.chartTabText, periodoGrafico === opcion.id && s.chartTabTextActive]}>{opcion.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.chartTypeTabs}>
                  {[
                    { id: 'area', label: 'Curva' },
                    { id: 'barras', label: 'Barras' },
                  ].map((opcion) => (
                    <TouchableOpacity
                      key={opcion.id}
                      style={[s.chartTypeTab, tipoGrafico === opcion.id && s.chartTypeTabActive]}
                      onPress={() => setTipoGrafico(opcion.id)}
                    >
                      <Text style={[s.chartTypeText, tipoGrafico === opcion.id && s.chartTypeTextActive]}>{opcion.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.chartNavigator}>
                <TouchableOpacity style={s.periodNavButton} onPress={() => navegarPeriodo(-1)} accessibilityLabel="Ver período anterior">
                  <Text style={s.periodNavText}>‹</Text>
                </TouchableOpacity>
                <Text style={s.periodTitle}>{periodosGrafico.titulo}</Text>
                <TouchableOpacity
                  style={[s.periodNavButton, desplazamientoGrafico === 0 && s.periodNavDisabled]}
                  onPress={() => navegarPeriodo(1)}
                  disabled={desplazamientoGrafico === 0}
                  accessibilityLabel="Ver período siguiente"
                >
                  <Text style={s.periodNavText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={s.periodStats}>
                <View style={s.periodStat}>
                  <Text style={s.periodStatLabel}>Total en el período</Text>
                  <Text style={s.periodStatValue} numberOfLines={1} adjustsFontSizeToFit>{fmt(totalPeriodo)}</Text>
                  <Text style={s.periodStatSub}>{ordenesPeriodo} orden(es) registrada(s)</Text>
                </View>
                <View style={s.periodStat}>
                  <Text style={s.periodStatLabel}>Ventas hoy</Text>
                  <Text style={s.periodStatValue} numberOfLines={1} adjustsFontSizeToFit>{fmt(stats?.total_hoy)}</Text>
                  <Text style={s.periodStatSub}>{stats?.ordenes_hoy ?? 0} órdenes hoy</Text>
                </View>
                <View style={s.periodStat}>
                  <Text style={s.periodStatLabel}>Ventas este mes</Text>
                  <Text style={s.periodStatValue} numberOfLines={1} adjustsFontSizeToFit>{fmt(stats?.total_mes)}</Text>
                  <Text style={s.periodStatSub}>{stats?.ordenes_mes ?? 0} órdenes este mes</Text>
                </View>
              </View>

              {errorVentas ? (
                <Text style={s.chartMessage}>No se pudo cargar el historial de ventas. Desliza para volver a intentar.</Text>
              ) : (
                tipoGrafico === 'area' && periodoGrafico === 'mes' ? (
                  <View style={s.chartPlotContainer}>
                    <View style={s.chartTooltip}>
                      <View style={s.chartTooltipDate}>
                        <View style={s.chartTooltipDot} />
                        <Text style={s.chartTooltipDateText}>
                          {itemSeleccionado
                            ? formatPeriodDate(itemSeleccionado.fecha, periodoGrafico === 'anio'
                              ? { month: 'long', year: 'numeric' }
                              : { weekday: 'short', day: 'numeric', month: 'short' })
                            : '—'}
                        </Text>
                      </View>
                      <View style={s.chartTooltipValue}>
                        <Text style={s.chartTooltipTotal}>{fmt(itemSeleccionado?.total)}</Text>
                        <Text style={s.chartTooltipOrders}>
                          {itemSeleccionado?.ordenes
                            ? `${itemSeleccionado.ordenes} orden(es)`
                            : itemSeleccionado?.esHoy ? 'Hoy (en curso)' : 'Sin ventas'}
                        </Text>
                      </View>
                    </View>
                    <View>
                    <View style={{ width: anchoGrafico }}>
                      <Svg width={anchoGrafico} height={altoGrafico} viewBox={`0 0 ${anchoGrafico} ${altoGrafico}`}>
                        {[32, 87, baseGrafico].map((y, index) => {
                          const valor = maxTotalGrafico * (1 - index * 0.5);
                          return (
                            <React.Fragment key={`grid-${y}`}>
                              <Path
                                d={`M 32 ${y} L ${anchoGrafico - 10} ${y}`}
                                fill="none"
                                stroke={BORDER}
                                strokeWidth={index === 2 ? 1.2 : 1}
                                strokeDasharray={index === 2 ? undefined : '4 5'}
                              />
                              <SvgText x={4} y={y + 4} fill={MUTED} fontSize={9} fontWeight="600">
                                ${formatoEje(valor)}
                              </SvgText>
                            </React.Fragment>
                          );
                        })}
                        <Path d={areaGrafico} fill={CHART_BLUE} fillOpacity={0.12} />
                        <Path d={lineaGrafico} fill="none" stroke={CHART_BLUE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        {puntosGrafico.map((punto, index) => (
                          <Circle
                            key={`${periodoGrafico}-punto-${index}`}
                            cx={punto.x}
                            cy={punto.y}
                            r={indiceSeleccionado === index ? 5 : periodosGrafico.items[index].esHoy ? 4 : 3}
                            fill={indiceSeleccionado === index ? PRIMARY : CHART_BLUE}
                            onPress={() => setIndiceSeleccionado(index)}
                          />
                        ))}
                      </Svg>
                      <View style={[s.chartAxisLabels, { width: anchoGrafico }]}>
                        {periodosGrafico.items.map((item, index) => (
                          periodoGrafico !== 'mes' || index === 0 || (index + 1) % 5 === 0 || index === periodosGrafico.items.length - 1
                            ? (
                              <TouchableOpacity
                                key={`${periodoGrafico}-etiqueta-${item.label}`}
                                style={[
                                  s.chartAxisLabel,
                                  { left: puntosGrafico[index]?.x ?? 0, transform: [{ translateX: -18 }] },
                                ]}
                                onPress={() => setIndiceSeleccionado(index)}
                                accessibilityRole="button"
                                accessibilityLabel={`${item.label}: ${fmt(item.total)}, ${item.ordenes} órdenes`}
                              >
                                <Text style={[s.chartLabel, item.esHoy && s.chartLabelToday]}>{item.label}</Text>
                              </TouchableOpacity>
                            )
                            : null
                        ))}
                      </View>
                    </View>
                    </View>
                  </View>
                ) : tipoGrafico === 'area' ? (
                  <View style={s.chartPlotContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ width: anchoGrafico }}>
                        <Svg width={anchoGrafico} height={altoGrafico} viewBox={`0 0 ${anchoGrafico} ${altoGrafico}`}>
                          {[32, 87, baseGrafico].map((y, index) => {
                            const valor = maxTotalGrafico * (1 - index * 0.5);
                            return (
                              <React.Fragment key={`grid-${y}`}>
                                <Path
                                  d={`M 32 ${y} L ${anchoGrafico - 10} ${y}`}
                                  fill="none"
                                  stroke={BORDER}
                                  strokeWidth={index === 2 ? 1.2 : 1}
                                  strokeDasharray={index === 2 ? undefined : '4 5'}
                                />
                                <SvgText x={4} y={y + 4} fill={MUTED} fontSize={9} fontWeight="600">
                                  ${formatoEje(valor)}
                                </SvgText>
                              </React.Fragment>
                            );
                          })}
                          <Path d={areaGrafico} fill={CHART_BLUE} fillOpacity={0.12} />
                          <Path d={lineaGrafico} fill="none" stroke={CHART_BLUE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                          {puntosGrafico.map((punto, index) => (
                            <Circle
                              key={`${periodoGrafico}-punto-${index}`}
                              cx={punto.x}
                              cy={punto.y}
                              r={indiceSeleccionado === index ? 5 : periodosGrafico.items[index].esHoy ? 4 : 3}
                              fill={indiceSeleccionado === index ? PRIMARY : CHART_BLUE}
                              onPress={() => setIndiceSeleccionado(index)}
                            />
                          ))}
                        </Svg>
                        <View style={[s.chartAxisLabels, { width: anchoGrafico }]}>
                          {periodosGrafico.items.map((item, index) => (
                            <TouchableOpacity
                              key={`${periodoGrafico}-etiqueta-${item.label}`}
                              style={[s.chartAxisLabel, { left: puntosGrafico[index]?.x ?? 0, transform: [{ translateX: -18 }] }]}
                              onPress={() => setIndiceSeleccionado(index)}
                              accessibilityRole="button"
                              accessibilityLabel={`${item.label}: ${fmt(item.total)}, ${item.ordenes} órdenes`}
                            >
                              <Text style={[s.chartLabel, item.esHoy && s.chartLabelToday]}>{item.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View style={s.chartPlotContainer}>
                    <View style={s.chartTooltip}>
                      <View style={s.chartTooltipDate}>
                        <View style={s.chartTooltipDot} />
                        <Text style={s.chartTooltipDateText}>
                          {itemSeleccionado
                            ? formatPeriodDate(itemSeleccionado.fecha, periodoGrafico === 'anio'
                              ? { month: 'long', year: 'numeric' }
                              : { weekday: 'short', day: 'numeric', month: 'short' })
                            : '—'}
                        </Text>
                      </View>
                      <View style={s.chartTooltipValue}>
                        <Text style={s.chartTooltipTotal}>{fmt(itemSeleccionado?.total)}</Text>
                        <Text style={s.chartTooltipOrders}>
                          {itemSeleccionado?.ordenes
                            ? `${itemSeleccionado.ordenes} orden(es)`
                            : itemSeleccionado?.esHoy ? 'Hoy (en curso)' : 'Sin ventas'}
                        </Text>
                      </View>
                    </View>
                    <Svg width={anchoGrafico} height={altoGrafico} viewBox={`0 0 ${anchoGrafico} ${altoGrafico}`}>
                      {[32, 87, baseGrafico].map((y, index) => {
                        const valor = maxTotalGrafico * (1 - index * 0.5);
                        return (
                          <React.Fragment key={`bar-grid-${y}`}>
                            <Path
                              d={`M 32 ${y} L ${anchoGrafico - 10} ${y}`}
                              fill="none"
                              stroke={BORDER}
                              strokeWidth={index === 2 ? 1.2 : 1}
                              strokeDasharray={index === 2 ? undefined : '4 5'}
                            />
                            <SvgText x={4} y={y + 4} fill={MUTED} fontSize={9} fontWeight="600">
                              ${formatoEje(valor)}
                            </SvgText>
                          </React.Fragment>
                        );
                      })}
                      {periodosGrafico.items.map((item, index) => {
                        const punto = puntosGrafico[index];
                        const valorAltura = (item.total / maxTotalGrafico) * 110;
                        const altura = Math.max(2, valorAltura);
                        const anchoBarra = periodoGrafico === 'mes' ? 5 : 16;
                        const color = indiceSeleccionado === index
                          ? PRIMARY
                          : item.esHoy ? '#D4AF37' : '#B9C9E8';
                        return (
                          <React.Fragment key={`${periodoGrafico}-barra-${item.label}`}>
                            <Rect
                              x={punto.x - anchoBarra / 2}
                              y={baseGrafico - altura}
                              width={anchoBarra}
                              height={altura}
                              rx={Math.min(3, anchoBarra / 2)}
                              fill={color}
                              onPress={() => setIndiceSeleccionado(index)}
                            />
                            {item.total > 0 ? (
                              <SvgText
                                x={punto.x}
                                y={baseGrafico - altura - 5}
                                fill={MUTED}
                                fontSize={periodoGrafico === 'mes' ? 7 : 8}
                                fontWeight="600"
                                textAnchor="middle"
                              >
                                {item.total >= 1000 ? `$${Math.round(item.total / 1000)}k` : `$${Math.round(item.total)}`}
                              </SvgText>
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                      {periodosGrafico.items.map((item, index) => (
                        <Circle
                          key={`${periodoGrafico}-barra-hit-${item.label}`}
                          cx={puntosGrafico[index].x}
                          cy={baseGrafico - 4}
                          r={12}
                          fill="transparent"
                          onPress={() => setIndiceSeleccionado(index)}
                        />
                      ))}
                    </Svg>
                    <View style={[s.chartAxisLabels, { width: anchoGrafico }]}>
                      {periodosGrafico.items.map((item, index) => (
                        periodoGrafico !== 'mes' || index === 0 || (index + 1) % 5 === 0 || index === periodosGrafico.items.length - 1
                          ? (
                            <TouchableOpacity
                              key={`${periodoGrafico}-barra-etiqueta-${item.label}`}
                              style={[s.chartAxisLabel, { left: puntosGrafico[index]?.x ?? 0, transform: [{ translateX: -18 }] }]}
                              onPress={() => setIndiceSeleccionado(index)}
                              accessibilityRole="button"
                              accessibilityLabel={`${item.label}: ${fmt(item.total)}, ${item.ordenes} órdenes`}
                            >
                              <Text style={[s.chartLabel, item.esHoy && s.chartLabelToday]}>{item.label}</Text>
                            </TouchableOpacity>
                          )
                          : null
                      ))}
                    </View>
                  </View>
                )
              )}
              <View style={s.chartFooter}>
                <Text style={s.chartFooterText}>Mostrando órdenes de tu tienda en {periodosGrafico.titulo}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('VentasVendedor')}>
                  <Text style={s.chartFooterLink}>Ver historial detallado →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>Libros más vendidos</Text>
                <Text style={s.chartDescription}>Los títulos con mayor demanda en tu catálogo</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Libreria')}>
                <Text style={s.linkText}>Ver catálogo →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              {top.length === 0 ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyIcon}>▥</Text>
                  <Text style={s.emptyTitle}>Aún no registras ventas en tus libros</Text>
                  <Text style={s.emptyText}>Tus títulos más populares y con mayor facturación aparecerán aquí.</Text>
                </View>
              ) : top.slice(0, 5).map((libro, index) => (
                <View key={libro.id_libro ?? index} style={[s.topRow, index < Math.min(top.length, 5) - 1 && s.rowSep]}>
                  <View style={[s.rankBadge, { backgroundColor: RANK_COLORS[index] ?? '#E5E0D8' }]}>
                    <Text style={s.rankText}>#{index + 1}</Text>
                  </View>
                  {getBookImageUri(libro) ? (
                    <Image
                      source={{ uri: getBookImageUri(libro) }}
                      style={s.topBookCover}
                      resizeMode="cover"
                      accessibilityLabel={`Portada de ${libro.titulo}`}
                    />
                  ) : (
                    <View style={s.topBookCoverPlaceholder}>
                      <Text style={s.recentBookPlaceholder}>📖</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.itemTitle} numberOfLines={1}>{libro.titulo}</Text>
                    <Text style={s.itemSub} numberOfLines={1}>
                      {libro.autor_libro || 'Autor desconocido'}{libro.nombre_categoria ? ` · ${libro.nombre_categoria}` : ''}
                    </Text>
                  </View>
                  <View style={s.topBookFinancials}>
                    <Text style={s.itemPrice}>{fmt(libro.precio_libro)}</Text>
                    <Text style={s.soldCount}>
                      {libro.unidades_vendidas ?? 0} {Number(libro.unidades_vendidas) === 1 ? 'unidad vendida' : 'unidades vendidas'}
                    </Text>
                    {Number(libro.total_generado) > 0 ? <Text style={s.itemSub}>Total: {fmt(libro.total_generado)}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>Últimos libros añadidos</Text>
                <Text style={s.chartDescription}>Novedades recientes en el inventario de tu tienda</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Libreria')}>
                <Text style={s.linkText}>Ver todos ({libros.length}) →</Text>
              </TouchableOpacity>
            </View>
            {libros.length === 0 ? (
              <View style={[s.card, s.emptyState]}>
                <Text style={s.emptyIcon}>📚</Text>
                <Text style={s.emptyTitle}>No tienes libros publicados</Text>
                <Text style={s.emptyText}>Agrega tus primeros libros desde la sección Mis Libros.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recentBooksRow}>
                {libros.slice(0, 4).map((libro) => {
                  const imageUri = getBookImageUri(libro);
                  const stock = Number(libro.stock) || 0;
                  const stockBajo = stock <= umbralStock;
                  return (
                    <TouchableOpacity
                      key={libro.id_libro}
                      style={s.recentBookCard}
                      onPress={() => navigation.navigate('Libreria')}
                      activeOpacity={0.85}
                    >
                      <View style={s.recentBookCover}>
                        {imageUri
                          ? <Image source={{ uri: imageUri }} style={s.recentBookImage} resizeMode="cover" />
                          : <Text style={s.recentBookPlaceholder}>📖</Text>}
                        {stockBajo ? (
                          <View style={s.lowStockTag}>
                            <Text style={s.lowStockTagText}>{stock === 0 ? 'Agotado' : `Stock: ${stock}`}</Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={s.recentBookInfo}>
                        <Text style={s.categoryPill} numberOfLines={1}>{libro.nombre_categoria || 'General'}</Text>
                        <Text style={s.itemTitle} numberOfLines={2}>{libro.titulo}</Text>
                        <Text style={s.itemSub} numberOfLines={1}>{libro.autor_libro || 'Autor desconocido'}</Text>
                        <Text style={s.itemPrice}>{fmt(libro.precio_libro ?? libro.precio)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View style={s.section} onLayout={(event) => { inventoryPosition.current = event.nativeEvent.layout.y; }}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>Alertas de stock</Text>
                <Text style={s.chartDescription}>Control de inventario mínimo</Text>
              </View>
              <TouchableOpacity
                style={s.thresholdButton}
                onPress={() => { setUmbralInput(String(umbralStock)); setUmbralModal(true); }}
              >
                <Text style={s.thresholdButtonText}>Umbral: {umbralStock} uds ⚙</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              <View style={[s.inventoryStatus, errorAlertas ? s.inventoryStatusError : alertas.length > 0 ? s.inventoryStatusWarning : s.inventoryStatusHealthy]}>
                <Text style={s.inventoryStatusIcon}>{errorAlertas ? '⚠️' : alertas.length > 0 ? '⚠️' : '✅'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.inventoryStatusTitle, errorAlertas && s.inventoryErrorTitle]}>
                    {errorAlertas ? 'No se pudo consultar el inventario' : alertas.length === 0 ? 'Inventario saludable' : `${alertas.length} libro(s) con stock bajo`}
                  </Text>
                  <Text style={s.itemSub}>
                    {errorAlertas ? 'Desliza para volver a intentar.' : alertas.length === 0
                      ? 'Todos los títulos están por encima del límite de alerta.'
                      : 'Se recomienda reabastecer unidades pronto.'}
                  </Text>
                </View>
              </View>
              {alertas.length > 0 ? (
                <View style={s.inventoryAlertList}>
                  <Text style={s.inventoryListTitle}>Libros por reabastecer:</Text>
                  {alertas.slice(0, 5).map((item) => (
                    <TouchableOpacity
                      key={item.id_libro}
                      style={s.inventoryAlertRow}
                      onPress={() => navigation.navigate('Libreria')}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.itemTitle} numberOfLines={1}>{item.titulo}</Text>
                        <Text style={[s.itemSub, Number(item.stock) === 0 && s.stockEmpty]}>
                          {Number(item.stock) === 0 ? 'Sin stock (0 uds)' : `${item.stock} unidad(es)`}
                        </Text>
                      </View>
                      <Text style={s.linkText}>+ Stock</Text>
                    </TouchableOpacity>
                  ))}
                  {alertas.length > 5 ? (
                    <TouchableOpacity onPress={() => navigation.navigate('Libreria')}>
                      <Text style={s.linkText}>Ver {alertas.length - 5} libro(s) más en Mis Libros →</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : !errorAlertas ? (
                <View style={s.inventoryAllOk}>
                  <Text style={s.inventoryCheck}>✓</Text>
                  <Text style={s.itemSub}>No tienes libros en riesgo de agotarse según tu umbral de {umbralStock} unidades.</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>Actividad reciente</Text>
                <Text style={s.chartDescription}>Notificaciones y novedades</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                <Text style={s.linkText}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              {errorNotificaciones ? (
                <Text style={s.emptyText}>No se pudieron cargar las notificaciones. Desliza para actualizar.</Text>
              ) : notificaciones.length > 0 ? (
                notificaciones.slice(0, 4).map((notif, index) => {
                  const fechaNotificacion = new Date(notif.fecha_creacion);
                  const fechaTexto = Number.isNaN(fechaNotificacion.getTime())
                    ? ''
                    : fechaNotificacion.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                  return (
                    <TouchableOpacity
                      key={notif.id_notificacion ?? index}
                      style={[s.notificationRow, !notif.leida && s.notificationUnread, index < Math.min(notificaciones.length, 4) - 1 && s.rowSep]}
                      onPress={() => navigation.navigate('Notifications')}
                      activeOpacity={0.75}
                    >
                      <View style={s.notificationIcon}><Text style={{ fontSize: 18 }}>{getNotificationIcon(notif.tipo)}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.itemTitle} numberOfLines={1}>{notif.titulo || 'Notificación'}</Text>
                        <Text style={s.itemSub} numberOfLines={2}>{notif.descripcion || notif.cuerpo || ''}</Text>
                        {!!fechaTexto && <Text style={s.notificationDate}>{fechaTexto}</Text>}
                      </View>
                      {!notif.leida ? <View style={s.notificationDot} /> : null}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={s.emptyState}>
                  <Text style={s.emptyIcon}>✓</Text>
                  <Text style={s.emptyTitle}>Sin notificaciones pendientes</Text>
                  <Text style={s.emptyText}>Las alertas de nuevos pedidos y mensajes aparecerán aquí.</Text>
                </View>
              )}
            </View>
          </View>

          <View style={s.section}>
            <View style={[s.card, s.tipsCard]}>
              <View style={s.sectionHeader}>
                <View style={s.tipsTitleRow}>
                  <Text style={s.tipsIcon}>★</Text>
                  <Text style={s.sectionTitle}>Consejos para aumentar tus ventas</Text>
                </View>
              </View>
              {[
                ['Fotos de alta calidad:', ' Los libros con portadas claras tienen hasta un 40% más de visualizaciones.'],
                ['Mantén tu stock al día:', ' Evita cancelaciones actualizando tus existencias periódicamente.'],
                ['Descripciones detalladas:', ' Incluye el estado exacto del libro y detalles de conservación.'],
              ].map(([title, detail]) => (
                <View key={title} style={s.tipRow}>
                  <Text style={s.tipBullet}>•</Text>
                  <Text style={s.tipText}><Text style={s.tipBold}>{title}</Text>{detail}</Text>
                </View>
              ))}
            </View>
          </View>

        <Footer onLinkPress={() => {}} />
      </ScrollView>

      <SidebarVendedor
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />

      <Modal visible={umbralModal} transparent animationType="fade" onRequestClose={() => !guardandoUmbral && setUmbralModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.thresholdModal}>
            <Text style={s.modalTitle}>Configurar alerta de stock</Text>
            <Text style={s.itemSub}>Avisar cuando queden esta cantidad o menos unidades.</Text>
            <View style={s.thresholdInputRow}>
              <TextInput
                style={s.thresholdInput}
                value={umbralInput}
                onChangeText={setUmbralInput}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="3"
                placeholderTextColor={MUTED}
              />
              <Text style={s.thresholdUnits}>uds</Text>
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setUmbralModal(false)} disabled={guardandoUmbral}>
                <Text style={s.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSave} onPress={guardarUmbral} disabled={guardandoUmbral}>
                {guardandoUmbral ? <ActivityIndicator color={WHITE} /> : <Text style={s.modalSaveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const themeBaseS = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 36 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 18, paddingVertical: 12, gap: 12 },
  menuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  menuIcon: { color: WHITE, fontSize: 21, fontWeight: '700' },
  headerTitle: { color: WHITE, fontSize: 16, fontWeight: '800' },
  welcome: { marginHorizontal: 16, marginTop: 14, marginBottom: 2, borderRadius: 16, padding: 20, overflow: 'hidden', minHeight: 150, justifyContent: 'center' },
  welcomeContent: { gap: 8 },
  welcomeTitle: { color: WHITE, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  welcomeSub: { color: '#F3E8EE', fontSize: 12, lineHeight: 18 },
  welcomeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  welcomeDate: { color: '#FCE7F3', fontSize: 10, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.22)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, overflow: 'hidden', textTransform: 'capitalize' },
  welcomeStore: { color: WHITE, fontSize: 10, fontWeight: '700', backgroundColor: 'rgba(212,175,55,0.25)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.5)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16, overflow: 'hidden' },
  kpisGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginHorizontal: 16, marginTop: 14 },
  kpiCard: { width: '48.5%', minHeight: 132, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 12, justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 5 },
  kpiLabel: { flex: 1, color: '#78716C', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  kpiIconWine: { backgroundColor: '#FDF2F4' },
  kpiIconAmber: { backgroundColor: '#FEFCE8' },
  kpiIconBlue: { backgroundColor: '#EFF6FF' },
  kpiIconGreen: { backgroundColor: '#F0FDF4' },
  kpiIconRed: { backgroundColor: '#FEF2F2' },
  kpiValue: { color: TEXT, fontSize: 17, fontWeight: '900', marginTop: 8 },
  kpiUnit: { color: '#A8A29E', fontSize: 10, fontWeight: '600' },
  kpiFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4, borderTopWidth: 1, borderTopColor: '#F5F2ED', paddingTop: 8, marginTop: 7 },
  kpiHighlight: { color: PRIMARY, fontSize: 9, fontWeight: '700', flexShrink: 1 },
  kpiSubText: { color: '#78716C', fontSize: 9, flexShrink: 1 },
  kpiLink: { color: '#A8A29E', fontSize: 9, fontWeight: '700' },
  kpiStatus: { color: '#15803D', backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, fontSize: 8, fontWeight: '700', flexShrink: 1 },
  kpiStatusWarning: { color: '#B91C1C', backgroundColor: '#FEE2E2' },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: '800' },
  linkText: { color: PRIMARY, fontWeight: '700', fontSize: 11 },
  chartDescription: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 3 },
  card: { backgroundColor: WHITE, borderRadius: 15, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  chartControlRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 7, marginHorizontal: 8, marginTop: 10 },
  chartTabs: { flexDirection: 'row', padding: 3, borderRadius: 10, backgroundColor: BG },
  chartTab: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8 },
  chartTabActive: { backgroundColor: PRIMARY },
  chartTabText: { color: MUTED, fontSize: 10, fontWeight: '700' },
  chartTabTextActive: { color: WHITE },
  chartTypeTabs: { flexDirection: 'row', padding: 3, borderRadius: 9, backgroundColor: BG },
  chartTypeTab: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 7 },
  chartTypeTabActive: { backgroundColor: '#E8E2DF' },
  chartTypeText: { color: MUTED, fontSize: 9, fontWeight: '700' },
  chartTypeTextActive: { color: PRIMARY },
  chartNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 8, marginBottom: 6 },
  periodNavButton: { width: 32, height: 32, borderWidth: 1, borderColor: BORDER, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE },
  periodNavDisabled: { opacity: 0.4 },
  periodNavText: { fontSize: 21, lineHeight: 24, color: TEXT },
  periodTitle: { flex: 1, textAlign: 'center', color: TEXT, fontSize: 11, fontWeight: '700', textTransform: 'capitalize', paddingHorizontal: 5 },
  periodStats: { flexDirection: 'row', gap: 7, marginHorizontal: 9, marginTop: 6, marginBottom: 10 },
  periodStat: { flex: 1, minWidth: 0, backgroundColor: WHITE, borderWidth: 1, borderColor: '#EEE8E1', borderRadius: 11, paddingHorizontal: 8, paddingVertical: 9 },
  periodStatLabel: { color: '#78716C', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 },
  periodStatValue: { color: PRIMARY, fontSize: 13, fontWeight: '900', marginTop: 4 },
  periodStatSub: { color: MUTED, fontSize: 8, marginTop: 3 },
  chartPlotContainer: { marginHorizontal: 7, marginTop: 2, paddingHorizontal: 5, paddingTop: 8, paddingBottom: 2, backgroundColor: '#FCFAF8', borderWidth: 1, borderColor: '#F0EBE5', borderRadius: 12 },
  chartTooltip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, backgroundColor: WHITE, borderWidth: 1, borderColor: '#EDE8E3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 7, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  chartTooltipDate: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  chartTooltipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  chartTooltipDateText: { color: TEXT, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  chartTooltipValue: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  chartTooltipTotal: { color: TEXT, fontSize: 11, fontWeight: '900' },
  chartTooltipOrders: { color: MUTED, fontSize: 8, backgroundColor: BG, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, overflow: 'hidden' },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#EEE8E1', marginHorizontal: 12, marginTop: 6, paddingTop: 9, paddingBottom: 11 },
  chartFooterText: { color: MUTED, fontSize: 8, flexShrink: 1 },
  chartFooterLink: { color: PRIMARY, fontSize: 9, fontWeight: '800' },
  chartLabel: { color: MUTED, fontSize: 9, marginTop: 5 },
  chartLabelToday: { color: PRIMARY, fontWeight: '800' },
  chartMessage: { color: MUTED, fontSize: 12, textAlign: 'center', padding: 20 },
  chartAxisLabels: { position: 'relative', height: 24, paddingBottom: 8 },
  chartAxisLabel: { position: 'absolute', width: 36, alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 13, gap: 9 },
  rankBadge: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 10, fontWeight: '900', color: WHITE },
  topBookCover: { width: 44, height: 58, borderRadius: 6, backgroundColor: '#F4F0EC' },
  topBookCoverPlaceholder: { width: 44, height: 58, borderRadius: 6, backgroundColor: '#F4F0EC', alignItems: 'center', justifyContent: 'center' },
  topBookFinancials: { alignItems: 'flex-end', maxWidth: 112 },
  soldCount: { color: MUTED, fontSize: 9, marginTop: 3, textAlign: 'right' },
  rowSep: { borderBottomWidth: 1, borderBottomColor: BORDER },
  recentBooksRow: { gap: 10, paddingRight: 4, paddingBottom: 2 },
  recentBookCard: { width: 154, backgroundColor: WHITE, borderRadius: 13, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  recentBookCover: { height: 112, backgroundColor: '#F4F0EC', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  recentBookImage: { width: '100%', height: '100%' },
  recentBookPlaceholder: { fontSize: 28 },
  lowStockTag: { position: 'absolute', right: 6, bottom: 6, backgroundColor: '#FEF2F2', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  lowStockTagText: { color: '#B91C1C', fontSize: 9, fontWeight: '800' },
  recentBookInfo: { padding: 10, gap: 5 },
  categoryPill: { alignSelf: 'flex-start', color: PRIMARY, backgroundColor: '#FDF2F4', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '700', overflow: 'hidden', maxWidth: '100%' },
  thresholdButton: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  thresholdButtonText: { color: TEXT, fontSize: 10, fontWeight: '700' },
  inventoryStatus: { flexDirection: 'row', alignItems: 'center', gap: 9, margin: 11, padding: 11, borderWidth: 1, borderRadius: 12 },
  inventoryStatusHealthy: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  inventoryStatusWarning: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  inventoryStatusError: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  inventoryStatusIcon: { fontSize: 18 },
  inventoryStatusTitle: { color: '#166534', fontSize: 12, fontWeight: '800' },
  inventoryErrorTitle: { color: '#991B1B' },
  inventoryAlertList: { paddingHorizontal: 14, paddingBottom: 12 },
  inventoryListTitle: { color: '#57534E', fontSize: 11, fontWeight: '700', marginBottom: 5 },
  inventoryAlertRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: BORDER },
  stockEmpty: { color: '#B91C1C', fontWeight: '700' },
  inventoryAllOk: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 15, paddingBottom: 14 },
  inventoryCheck: { color: SUCCESS, fontSize: 20, fontWeight: '900' },
  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  notificationUnread: { backgroundColor: '#FDF9FA' },
  notificationIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FDF2F4', alignItems: 'center', justifyContent: 'center' },
  notificationDate: { color: MUTED, fontSize: 9, marginTop: 4 },
  notificationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  tipsCard: { padding: 14 },
  tipsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  tipsIcon: { color: '#D4AF37', fontSize: 22, fontWeight: '900' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10 },
  tipBullet: { color: PRIMARY, fontSize: 15, lineHeight: 19, fontWeight: '900' },
  tipText: { flex: 1, color: '#57534E', fontSize: 11, lineHeight: 17 },
  tipBold: { color: TEXT, fontWeight: '800' },
  itemTitle: { color: TEXT, fontSize: 12, fontWeight: '700' },
  itemSub: { color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 2 },
  itemPrice: { color: PRIMARY, fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 22 },
  emptyIcon: { color: PRIMARY, opacity: 0.65, fontSize: 28, marginBottom: 7 },
  emptyTitle: { color: TEXT, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: MUTED, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'center', padding: 24 },
  thresholdModal: { backgroundColor: WHITE, borderRadius: 16, padding: 20 },
  modalTitle: { color: TEXT, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  thresholdInputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
  thresholdInput: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: TEXT, fontSize: 16 },
  thresholdUnits: { color: MUTED, fontSize: 12, fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 18 },
  modalCancel: { borderWidth: 1, borderColor: BORDER, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelText: { color: TEXT, fontSize: 12, fontWeight: '700' },
  modalSave: { minWidth: 88, alignItems: 'center', backgroundColor: PRIMARY, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 10 },
  modalSaveText: { color: WHITE, fontSize: 12, fontWeight: '800' },
});
const s = themeBaseS;
