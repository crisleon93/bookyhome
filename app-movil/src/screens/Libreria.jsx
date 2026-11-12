import { useThemedStyles } from '../context/ThemeContext';
import React, { useState, useCallback, useContext, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, RefreshControl, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import {
  getMisLibros, deleteLibro, getAlertasStock, resolveImageUrl, getCategorias, updateStockLibro,
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import Footer from '../components/Footer';
import { IconFilter } from '../components/Icons';

const PRIMARY = '#7A1E3A';
const WHITE   = '#FFFFFF';
const BG      = '#FAF8F5';
const BORDER  = '#E0DBD4';
const TEXT    = '#2A2A2A';
const MUTED   = '#888';
const UMBRAL_DEFAULT = 3;
const UMBRAL_STORAGE_KEY = 'vendedor_stock_umbral';

const FILTROS_STOCK = [
  { id: 'todos', label: 'Todo' },
  { id: 'disponibles', label: 'Stock normal' },
  { id: 'bajo_stock', label: 'Stock bajo' },
  { id: 'agotados', label: 'Agotados' },
];

const FILTROS_ESTADO = [
  { id: 'todos', label: 'Todos los estados' },
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'usado_buen_estado', label: 'Usado · buen estado' },
  { id: 'usado_regular', label: 'Usado · regular' },
];

const ORDENES_LIBROS = [
  { id: 'recientes', label: 'Más recientes' },
  { id: 'titulo_asc', label: 'Título A-Z' },
  { id: 'titulo_desc', label: 'Título Z-A' },
  { id: 'precio_desc', label: 'Precio mayor' },
  { id: 'precio_asc', label: 'Precio menor' },
  { id: 'stock_desc', label: 'Más stock' },
  { id: 'stock_asc', label: 'Menos stock' },
];

const ESTADOS_ETIQUETAS = {
  nuevo: 'Nuevo',
  usado_buen_estado: 'Usado · buen estado',
  usado_regular: 'Usado · regular',
  visible: 'Visible',
  oculto: 'Oculto',
  agotado: 'Agotado',
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.detail || error?.message || fallback;

const ESTADO_COLORS = {
  Nuevo:    { bg: '#D1FAE5', color: '#065F46' },
  nuevo:    { bg: '#D1FAE5', color: '#065F46' },
  Visible:  { bg: '#DBEAFE', color: '#1E40AF' },
  Oculto:   { bg: '#F3F4F6', color: '#6B7280' },
  Agotado:  { bg: '#FEE2E2', color: '#991B1B' },
  usado_buen_estado: { bg: '#EDE9FE', color: '#5B21B6' },
  usado_regular: { bg: '#FEF3C7', color: '#92400E' },
};

const fmt = (val) =>
  val == null
    ? '$0 COP'
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.floor(val));

const nivelesFidelizacion = {
  Bronce: 'Bronce',
  Plata: 'Plata',
  Oro: 'Oro',
  Zafiro: 'Zafiro',
  Rubi: 'Rubí',
  Esmeralda: 'Esmeralda',
  Amatista: 'Amatista',
  Perla: 'Perla',
  Obsidiana: 'Obsidiana',
  Diamante: 'Diamante',
  Onix: 'Ónix',
  Platino: 'Platino',
};

const tieneAccesoAnticipado = (libro) =>
  [true, 1, '1', 'true'].includes(libro?.acceso_anticipado);

const getImgUrl = (libro) => {
  const raw = libro?.imagen_url || libro?.imagen_principal || libro?.imagen_principal_url
    || (Array.isArray(libro?.imagenes) ? libro.imagenes[0] : libro?.imagenes)
    || libro?.foto;
  return resolveImageUrl(raw);
};

export default function Libreria({ navigation: navProp }) {
  const s = useThemedStyles(themeBaseS);
  const navigation = navProp || useNavigation();
  const { user, signOut } = useContext(AuthContext);
  const [libros,     setLibros]     = useState([]);
  const [alertas,    setAlertas]    = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorAlertas, setErrorAlertas] = useState('');
  const [errorCategorias, setErrorCategorias] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [orden, setOrden] = useState('recientes');
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(8);
  const [umbralStock, setUmbralStock] = useState(UMBRAL_DEFAULT);
  const [umbralModal, setUmbralModal] = useState(false);
  const [umbralInput, setUmbralInput] = useState(String(UMBRAL_DEFAULT));
  const [guardandoUmbral, setGuardandoUmbral] = useState(false);
  const [ventaModalVisible, setVentaModalVisible] = useState(false);
  const [ventaLibro, setVentaLibro] = useState(null);
  const [ventaBusqueda, setVentaBusqueda] = useState('');
  const [ventaCantidad, setVentaCantidad] = useState('1');
  const [guardandoVenta, setGuardandoVenta] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const [codigoLibro, setCodigoLibro] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [modalEliminar, setModalEliminar] = useState({ visible: false, libro: null });

  useEffect(() => {
    AsyncStorage.getItem(UMBRAL_STORAGE_KEY)
      .then((value) => {
        if (value === null) return;
        const saved = Number(value);
        if (Number.isInteger(saved) && saved >= 0) {
          setUmbralStock(saved);
          setUmbralInput(String(saved));
        }
      })
      .catch((error) => console.warn('[LIBRERIA] No se pudo leer el umbral guardado:', error?.message));
  }, []);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setErrorCarga('');
    setErrorAlertas('');
    setErrorCategorias('');
    try {
      const [rLib, rAlt, rCategorias] = await Promise.all([
        getMisLibros(),
        getAlertasStock(umbralStock).catch((error) => {
          setErrorAlertas(getErrorMessage(error, 'No se pudieron consultar las alertas de stock.'));
          return { data: [] };
        }),
        getCategorias().catch((error) => {
          const mensaje = getErrorMessage(error, 'No se pudieron cargar las categorías.');
          setErrorCategorias(mensaje);
          console.warn('[LIBRERIA] No se pudieron cargar las categorías:', mensaje);
          return { data: [] };
        }),
      ]);
      if (!Array.isArray(rLib.data)) throw new Error('El servidor devolvió un catálogo con formato inválido.');
      setLibros(rLib.data);
      setAlertas(Array.isArray(rAlt.data) ? rAlt.data : []);
      setCategorias(Array.isArray(rCategorias.data) ? rCategorias.data : []);
    } catch (error) {
      const mensaje = getErrorMessage(error, 'No se pudo cargar el catálogo de libros.');
      setErrorCarga(mensaje);
      if (silencioso) Alert.alert('Error al actualizar', mensaje);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [umbralStock]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onRefresh = () => { setRefreshing(true); cargar(true); };

  const confirmarEliminar = async () => {
    const libro = modalEliminar.libro;
    if (!libro) return;
    setDeleting(libro.id_libro);
    try {
      await deleteLibro(libro.id_libro);
      setLibros(prev => prev.filter(l => l.id_libro !== libro.id_libro));
      setAlertas((prev) => prev.filter((alerta) => alerta.id_libro !== libro.id_libro));
      setModalEliminar({ visible: false, libro: null });
    } catch (error) {
      Alert.alert('No se pudo eliminar', getErrorMessage(error, 'Ocurrió un error al eliminar el libro.'));
    } finally {
      setDeleting(null);
    }
  };

  const librosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLocaleLowerCase();
    return libros.filter((libro) => {
      if (query && ![libro.titulo, libro.autor_libro, libro.nombre_categoria]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query))) return false;
      if (filtroCategoria !== 'todas'
        && String(libro.id_categoria) !== String(filtroCategoria)
        && libro.nombre_categoria !== filtroCategoria) return false;
      const stock = Number(libro.stock) || 0;
      if (filtroStock === 'disponibles' && stock <= umbralStock) return false;
      if (filtroStock === 'bajo_stock' && (stock <= 0 || stock > umbralStock)) return false;
      if (filtroStock === 'agotados' && stock > 0) return false;
      if (filtroEstado !== 'todos' && libro.estado_libro !== filtroEstado) return false;
      return true;
    }).sort((a, b) => {
      if (orden === 'precio_asc') return (Number(a.precio_libro) || 0) - (Number(b.precio_libro) || 0);
      if (orden === 'precio_desc') return (Number(b.precio_libro) || 0) - (Number(a.precio_libro) || 0);
      if (orden === 'stock_asc') return (Number(a.stock) || 0) - (Number(b.stock) || 0);
      if (orden === 'stock_desc') return (Number(b.stock) || 0) - (Number(a.stock) || 0);
      if (orden === 'titulo_asc') return (a.titulo || '').localeCompare(b.titulo || '');
      if (orden === 'titulo_desc') return (b.titulo || '').localeCompare(a.titulo || '');
      return (Number(b.id_libro) || 0) - (Number(a.id_libro) || 0);
    });
  }, [libros, busqueda, filtroCategoria, filtroStock, filtroEstado, orden, umbralStock]);

  const totalPaginas = Math.max(1, Math.ceil(librosFiltrados.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const librosPagina = librosFiltrados.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);
  const totalStock = libros.reduce((total, libro) => total + (Number(libro.stock) || 0), 0);
  const valorInventario = libros.reduce((total, libro) =>
    total + (Number(libro.precio_libro ?? libro.precio) || 0) * (Number(libro.stock) || 0), 0);
  const agotados = libros.filter((libro) => (Number(libro.stock) || 0) <= 0).length;
  const bajoStock = libros.filter((libro) => {
    const stock = Number(libro.stock) || 0;
    return stock > 0 && stock <= umbralStock;
  }).length;
  const filtrosActivos = [
    filtroCategoria !== 'todas',
    filtroStock !== 'todos',
    filtroEstado !== 'todos',
    orden !== 'recientes',
  ].filter(Boolean).length;
  const librosVenta = libros.filter((libro) => {
    const query = ventaBusqueda.trim().toLocaleLowerCase();
    return !query || [libro.titulo, libro.autor_libro, libro.nombre_categoria]
      .some((value) => String(value || '').toLocaleLowerCase().includes(query));
  });

  const abrirVenta = (libro = null) => {
    setVentaModalVisible(true);
    setVentaLibro(libro);
    setVentaBusqueda('');
    setVentaCantidad('1');
    setVentaExitosa(false);
  };

  const registrarVenta = async () => {
    if (!ventaLibro) {
      Alert.alert('Selecciona un libro', 'Elige un título del catálogo para continuar.');
      return;
    }
    const cantidad = Number(ventaCantidad);
    const stockActual = Number(ventaLibro.stock) || 0;
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresa una cantidad entera mayor que cero.');
      return;
    }
    if (cantidad > stockActual) {
      Alert.alert('Stock insuficiente', `Solo tienes ${stockActual} unidad(es) disponibles.`);
      return;
    }
    setGuardandoVenta(true);
    try {
      await updateStockLibro(ventaLibro.id_libro, stockActual - cantidad);
      setLibros((prev) => prev.map((libro) => libro.id_libro === ventaLibro.id_libro
        ? { ...libro, stock: stockActual - cantidad }
        : libro));
      setVentaLibro((prev) => ({ ...prev, stock: stockActual - cantidad }));
      setAlertas((prev) => {
        const restantes = prev.filter((alerta) => alerta.id_libro !== ventaLibro.id_libro);
        return stockActual - cantidad <= umbralStock
          ? [...restantes, { id_libro: ventaLibro.id_libro, titulo: ventaLibro.titulo, stock: stockActual - cantidad }]
          : restantes;
      });
      setVentaExitosa(true);
    } catch (error) {
      Alert.alert('No se pudo registrar la venta', getErrorMessage(error, 'Ocurrió un error al actualizar el inventario.'));
    } finally {
      setGuardandoVenta(false);
    }
  };

  const guardarUmbral = async () => {
    const nuevoUmbral = Number(umbralInput);
    if (!Number.isInteger(nuevoUmbral) || nuevoUmbral < 0 || nuevoUmbral > 100) {
      Alert.alert('Umbral inválido', 'Ingresa un número entero entre 0 y 100.');
      return;
    }
    setGuardandoUmbral(true);
    try {
      await AsyncStorage.setItem(UMBRAL_STORAGE_KEY, String(nuevoUmbral));
      setUmbralStock(nuevoUmbral);
      setUmbralModal(false);
    } catch (error) {
      Alert.alert('No se pudo guardar', getErrorMessage(error, 'No se pudo guardar el umbral en este dispositivo.'));
    } finally {
      setGuardandoUmbral(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroStock('todos');
    setFiltroEstado('todos');
    setFiltroCategoria('todas');
    setOrden('recientes');
    setPagina(1);
  };

  const estadoBadge = (libro) => {
    const e = libro.estado_libro || (libro.activo ? 'Visible' : 'Oculto');
    const etiqueta = ESTADOS_ETIQUETAS[e] || e;
    const c = ESTADO_COLORS[e] || ESTADO_COLORS[etiqueta] || { bg: '#F3F4F6', color: '#6B7280' };
    return (
      <View style={[s.badge, { backgroundColor: c.bg }]}>
        <Text style={[s.badgeText, { color: c.color }]}>{etiqueta}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const imgUrl = getImgUrl(item);
    const stock = Number(item.stock) || 0;
    const estaEnAlerta = stock > 0 && stock <= umbralStock;
    const estaAgotado = stock <= 0;

    return (
      <View style={[s.card, estaEnAlerta && s.cardAlerta]}>
        {/* portada */}
        <View style={s.coverBox}>
          {imgUrl
            ? <Image source={{ uri: imgUrl }} style={s.cover} resizeMode="cover" />
            : <View style={s.coverPlaceholder}><Text style={{ fontSize: 22 }}>📖</Text></View>
          }
        </View>

        {/* info */}
        <View style={s.info}>
          <View style={s.infoTop}>
            <Text style={s.titulo} numberOfLines={1}>{item.titulo}</Text>
            {estadoBadge(item)}
          </View>
          <Text style={s.autor} numberOfLines={1}>{item.autor_libro} · {item.nombre_categoria}</Text>
          {tieneAccesoAnticipado(item) && (
            <View style={s.earlyAccessBadge}>
              <Text style={s.earlyAccessBadgeTitle}>Club Booky · Acceso anticipado</Text>
              <Text style={s.earlyAccessBadgeText}>
                Nivel mínimo: {nivelesFidelizacion[item.nivel_minimo_acceso] || 'Plata'} · 24 horas
              </Text>
            </View>
          )}
          <View style={s.infoBottom}>
            <Text style={s.precio}>{fmt(item.precio_libro ?? item.precio)}</Text>
            <Text style={[s.stock, estaAgotado && s.stockAgotado, estaEnAlerta && s.stockBajo]}>
              {estaAgotado ? 'Agotado' : `Stock: ${stock} uds`}
            </Text>
          </View>

          {/* acciones */}
          <View style={s.actions}>
              <TouchableOpacity style={[s.btn, s.btnVenta]} onPress={() => abrirVenta(item)} disabled={estaAgotado}>
                <Text style={s.btnText}>Venta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnId]} onPress={() => setCodigoLibro(item)}>
                <Text style={s.btnText}>ID</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, s.btnStock]}
                onPress={() => navigation.navigate('PublicarLibro', { libro: item, modo: 'stock' })}
            >
              <Text style={s.btnText}>Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnEditar]}
              onPress={() => navigation.navigate('PublicarLibro', { libro: item, modo: 'editar' })}
            >
              <Text style={s.btnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnEliminar]}
              onPress={() => setModalEliminar({ visible: true, libro: item })}
              disabled={deleting === item.id_libro}
            >
              {deleting === item.id_libro
                ? <ActivityIndicator size="small" color={WHITE} />
                : <Text style={s.btnText}>Eliminar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFiltros = () => (
    <View style={s.filters}>
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{libros.length}</Text>
          <Text style={s.summaryLabel}>Títulos</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{totalStock}</Text>
          <Text style={s.summaryLabel}>Unidades</Text>
        </View>
        <View style={[s.summaryCard, s.summaryValueCard]}>
          <Text style={s.summaryValueSmall}>Valor catálogo</Text>
          <Text style={s.summaryMoney}>{fmt(valorInventario)}</Text>
        </View>
      </View>

      <View style={s.toolbarActions}>
        <TouchableOpacity style={s.posButton} onPress={() => abrirVenta()}>
          <Text style={s.posButtonText}>▣ Venta en mostrador</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.thresholdButton} onPress={() => {
          setUmbralInput(String(umbralStock));
          setUmbralModal(true);
        }}>
          <Text style={s.thresholdButtonText}>Umbral: {umbralStock} ⚙</Text>
        </TouchableOpacity>
      </View>

      {errorAlertas ? (
        <Text style={s.inlineError}>No se pudieron cargar las alertas de stock. {errorAlertas}</Text>
      ) : alertas.length > 0 ? (
        <View style={s.alertaBanner}>
          <Text style={s.alertaBannerTitle}>⚠️ {alertas.length} libro{alertas.length > 1 ? 's' : ''} con stock bajo (hasta {umbralStock} uds.)</Text>
          <View style={s.alertaChips}>
            {alertas.slice(0, 6).map((alerta, index) => (
              <View key={alerta.id_libro ?? index} style={s.alertaChip}>
                <Text style={s.alertaChipText} numberOfLines={1}>{alerta.titulo} — {alerta.stock ?? 0} uds</Text>
              </View>
            ))}
            {alertas.length > 6 ? <Text style={s.alertaMore}>y {alertas.length - 6} más</Text> : null}
          </View>
        </View>
      ) : null}
      {errorCategorias ? (
        <Text style={s.inlineError}>No se pudieron cargar las categorías. {errorCategorias}</Text>
      ) : null}

      <View style={s.searchRow}>
        <TextInput
          style={[s.searchInput, s.searchInputInline]}
          value={busqueda}
          onChangeText={(value) => { setBusqueda(value); setPagina(1); }}
          placeholder="Buscar por título, autor o categoría..."
          placeholderTextColor={MUTED}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[s.filterButton, filtrosActivos > 0 && s.filterButtonActive]}
          onPress={() => setFiltrosVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={filtrosActivos ? `Filtros, ${filtrosActivos} activos` : 'Abrir filtros'}
        >
          <IconFilter size={20} color={filtrosActivos > 0 ? WHITE : PRIMARY} />
          {filtrosActivos > 0 && (
            <View style={s.filterCountBadge}>
              <Text style={s.filterCountText}>{filtrosActivos}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.resultHeader}>
        <Text style={s.resultText}>
          {librosFiltrados.length} de {libros.length} libro{libros.length === 1 ? '' : 's'}
        </Text>
      </View>
    </View>
  );

  const renderPaginacion = () => (
    <View style={s.pagination}>
      <Text style={s.paginationInfo}>
        {librosFiltrados.length === 0 ? 'Sin resultados' : `Página ${paginaSegura} de ${totalPaginas}`}
      </Text>
      <View style={s.paginationButtons}>
        <TouchableOpacity style={[s.pageButton, paginaSegura <= 1 && s.pageButtonDisabled]} disabled={paginaSegura <= 1} onPress={() => setPagina((actual) => Math.max(1, actual - 1))}>
          <Text style={s.pageButtonText}>‹ Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.pageButton, paginaSegura >= totalPaginas && s.pageButtonDisabled]} disabled={paginaSegura >= totalPaginas} onPress={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}>
          <Text style={s.pageButtonText}>Siguiente ›</Text>
        </TouchableOpacity>
      </View>
      <View style={s.pageSizes}>
        {[8, 10, 20, 50].map((cantidad) => (
          <TouchableOpacity key={cantidad} style={[s.pageSizeChip, porPagina === cantidad && s.pageSizeChipActive]} onPress={() => { setPorPagina(cantidad); setPagina(1); }}>
            <Text style={[s.pageSizeText, porPagina === cantidad && s.pageSizeTextActive]}>{cantidad}</Text>
          </TouchableOpacity>
        ))}
        <Text style={s.paginationInfo}>por página</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={s.menuBtn}>
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Mis libros</Text>
          {!loading && (
            <Text style={s.headerSub}>
              {libros.length} libro{libros.length !== 1 ? 's' : ''} publicado{libros.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={s.publishBtn}
          onPress={() => navigation.navigate('PublicarLibro')}
        >
          <Text style={s.publishBtnText}>+ Publicar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={PRIMARY} /></View>
      ) : errorCarga && libros.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyTitle}>No se pudo cargar el catálogo</Text>
          <Text style={s.errorText}>{errorCarga}</Text>
          <TouchableOpacity style={s.publishBtn2} onPress={() => cargar()}>
            <Text style={s.publishBtn2Text}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={librosPagina}
          keyExtractor={(item, idx) => String(item.id_libro ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
          ListHeaderComponent={renderFiltros}
          ListEmptyComponent={(
            <View style={s.emptyResults}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>{libros.length === 0 ? '📚' : '🔍'}</Text>
              <Text style={s.emptyTitle}>
                {libros.length === 0 ? 'Aún no tienes libros publicados' : 'No se encontraron libros'}
              </Text>
              <Text style={s.emptyDescription}>
                {libros.length === 0
                  ? 'Comienza a vender agregando tu primer título al catálogo.'
                  : 'No hay coincidencias con la búsqueda o los filtros seleccionados.'}
              </Text>
              {libros.length === 0 ? (
                <TouchableOpacity style={s.publishBtn2} onPress={() => navigation.navigate('PublicarLibro')}>
                  <Text style={s.publishBtn2Text}>Publicar primer libro</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.publishBtn2} onPress={limpiarFiltros}>
                  <Text style={s.publishBtn2Text}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListFooterComponent={<View>{renderPaginacion()}<Footer onLinkPress={() => {}} /></View>}
        />
      )}

      {/* ── Modal umbral de stock ── */}
      <Modal visible={filtrosVisible} transparent animationType="slide" onRequestClose={() => setFiltrosVisible(false)}>
        <View style={[s.modalOverlay, s.filtersOverlay]}>
          <View style={[s.formModal, s.filtersModal]}>
            <View style={s.filterModalHeader}>
              <Text style={s.modalTitle}>Filtrar y ordenar</Text>
              <TouchableOpacity onPress={() => setFiltrosVisible(false)} accessibilityRole="button" accessibilityLabel="Cerrar filtros">
                <Text style={s.filterModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={s.filterModalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.filterTitle}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                <TouchableOpacity style={[s.filterChip, filtroCategoria === 'todas' && s.filterChipActive]} onPress={() => { setFiltroCategoria('todas'); setPagina(1); }}>
                  <Text style={[s.filterChipText, filtroCategoria === 'todas' && s.filterChipTextActive]}>Todas</Text>
                </TouchableOpacity>
                {categorias.map((categoria) => (
                  <TouchableOpacity
                    key={categoria.id_categoria}
                    style={[s.filterChip, String(filtroCategoria) === String(categoria.id_categoria) && s.filterChipActive]}
                    onPress={() => { setFiltroCategoria(String(categoria.id_categoria)); setPagina(1); }}
                  >
                    <Text style={[s.filterChipText, String(filtroCategoria) === String(categoria.id_categoria) && s.filterChipTextActive]}>{categoria.nombre_categoria}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.filterTitle}>Inventario</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                {FILTROS_STOCK.map((filtro) => {
                  const cantidad = filtro.id === 'agotados' ? agotados : filtro.id === 'bajo_stock' ? bajoStock : null;
                  return (
                    <TouchableOpacity
                      key={filtro.id}
                      style={[s.filterChip, filtroStock === filtro.id && s.filterChipActive]}
                      onPress={() => { setFiltroStock(filtro.id); setPagina(1); }}
                    >
                      <Text style={[s.filterChipText, filtroStock === filtro.id && s.filterChipTextActive]}>
                        {filtro.label}{cantidad !== null ? ` (${cantidad})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={s.filterTitle}>Estado del libro</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                {FILTROS_ESTADO.map((filtro) => (
                  <TouchableOpacity
                    key={filtro.id}
                    style={[s.filterChip, filtroEstado === filtro.id && s.filterChipActive]}
                    onPress={() => { setFiltroEstado(filtro.id); setPagina(1); }}
                  >
                    <Text style={[s.filterChipText, filtroEstado === filtro.id && s.filterChipTextActive]}>{filtro.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.filterTitle}>Ordenar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                {ORDENES_LIBROS.map((opcion) => (
                  <TouchableOpacity key={opcion.id} style={[s.filterChip, orden === opcion.id && s.filterChipActive]} onPress={() => { setOrden(opcion.id); setPagina(1); }}>
                    <Text style={[s.filterChipText, orden === opcion.id && s.filterChipTextActive]}>{opcion.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
            <View style={s.filterModalActions}>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnCancel]} onPress={limpiarFiltros}>
                <Text style={s.modalBtnCancelText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.filterModalApply} onPress={() => setFiltrosVisible(false)}>
                <Text style={s.filterModalApplyText}>Ver {librosFiltrados.length} resultados</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={umbralModal} transparent animationType="fade" onRequestClose={() => setUmbralModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.formModal}>
            <Text style={s.modalTitle}>Umbral de stock bajo</Text>
            <Text style={s.modalDescription}>Se mostrarán alertas cuando las existencias de un libro sean iguales o menores a este valor.</Text>
            <TextInput
              style={s.quantityInput}
              value={umbralInput}
              onChangeText={setUmbralInput}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="3"
              placeholderTextColor={MUTED}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnCancel]} onPress={() => setUmbralModal(false)} disabled={guardandoUmbral}>
                <Text style={s.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnPrimary]} onPress={guardarUmbral} disabled={guardandoUmbral}>
                {guardandoUmbral ? <ActivityIndicator color={WHITE} /> : <Text style={s.modalBtnDeleteText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal venta en mostrador ── */}
      <Modal visible={ventaModalVisible} transparent animationType="slide" onRequestClose={() => !guardandoVenta && setVentaModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.formModal, s.saleModal]}>
            {ventaExitosa ? (
              <>
                <Text style={s.saleSuccessIcon}>✓</Text>
                <Text style={s.modalTitle}>¡Venta registrada!</Text>
                <Text style={s.modalDescription}>Se descontaron {ventaCantidad} unidad(es) de “{ventaLibro?.titulo}”.</Text>
                <TouchableOpacity style={[s.modalBtn, s.modalBtnPrimary, { marginTop: 16 }]} onPress={() => setVentaModalVisible(false)}>
                  <Text style={s.modalBtnDeleteText}>Listo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.modalTitle}>Venta en mostrador</Text>
                {!ventaLibro ? (
                  <>
                    <TextInput
                      style={s.searchInput}
                      value={ventaBusqueda}
                      onChangeText={setVentaBusqueda}
                      placeholder="Buscar libro, autor o categoría..."
                      placeholderTextColor={MUTED}
                    />
                    <ScrollView style={s.saleBookList} keyboardShouldPersistTaps="handled">
                      {librosVenta.map((libro) => {
                        const sinStock = Number(libro.stock) <= 0;
                        return (
                          <TouchableOpacity
                            key={libro.id_libro}
                            style={[s.saleBookRow, sinStock && s.saleBookDisabled]}
                            disabled={sinStock}
                            onPress={() => { setVentaLibro(libro); setVentaCantidad('1'); }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={s.saleBookTitle} numberOfLines={1}>{libro.titulo}</Text>
                              <Text style={s.saleBookDetail} numberOfLines={1}>
                                {libro.autor_libro || 'Autor desconocido'} · {fmt(libro.precio_libro ?? libro.precio)}
                              </Text>
                            </View>
                            <Text style={[s.saleBookStock, sinStock && s.stockAgotado]}>
                              {sinStock ? 'Agotado' : `${libro.stock} uds`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {librosVenta.length === 0 ? <Text style={s.emptyDescription}>No hay libros que coincidan.</Text> : null}
                    </ScrollView>
                  </>
                ) : (
                  <>
                    <View style={s.selectedBook}>
                      <Text style={s.saleBookTitle}>{ventaLibro.titulo}</Text>
                      <Text style={s.saleBookDetail}>Precio: {fmt(ventaLibro.precio_libro ?? ventaLibro.precio)} · Stock: {ventaLibro.stock} uds</Text>
                      <TouchableOpacity onPress={() => { setVentaLibro(null); setVentaCantidad('1'); }}>
                        <Text style={s.changeBook}>Cambiar libro</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.filterTitle}>Cantidad vendida</Text>
                    <View style={s.quantityRow}>
                      <TouchableOpacity style={s.quantityStep} onPress={() => setVentaCantidad(String(Math.max(1, Number(ventaCantidad) - 1)))}>
                        <Text style={s.quantityStepText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={s.quantityInput}
                        value={ventaCantidad}
                        onChangeText={(value) => setVentaCantidad(value.replace(/\D/g, ''))}
                        keyboardType="number-pad"
                        maxLength={6}
                        selectTextOnFocus
                      />
                      <TouchableOpacity style={s.quantityStep} onPress={() => setVentaCantidad(String(Math.min(Number(ventaLibro.stock), Number(ventaCantidad || 0) + 1)))}>
                        <Text style={s.quantityStepText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.saleTotal}>
                      Total: {fmt((Number(ventaLibro.precio_libro ?? ventaLibro.precio) || 0) * (Number(ventaCantidad) || 0))}
                    </Text>
                    <Text style={s.modalDescription}>La venta presencial actualiza el inventario descontando las unidades registradas, igual que en la web.</Text>
                  </>
                )}
                <View style={s.modalBtns}>
                  <TouchableOpacity style={[s.modalBtn, s.modalBtnCancel]} onPress={() => setVentaModalVisible(false)} disabled={guardandoVenta}>
                    <Text style={s.modalBtnCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  {ventaLibro ? (
                    <TouchableOpacity style={[s.modalBtn, s.modalBtnPrimary]} onPress={registrarVenta} disabled={guardandoVenta}>
                      {guardandoVenta ? <ActivityIndicator color={WHITE} /> : <Text style={s.modalBtnDeleteText}>Registrar venta</Text>}
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal identificador del libro ── */}
      <Modal visible={codigoLibro !== null} transparent animationType="fade" onRequestClose={() => setCodigoLibro(null)}>
        <View style={s.modalOverlay}>
          <View style={s.formModal}>
            <Text style={s.modalTitle}>Identificación del libro</Text>
            <Text style={s.modalDescription} numberOfLines={2}>{codigoLibro?.titulo}</Text>
            <View style={s.codeCard}>
              <Text style={s.codeBrand}>BOOKYHOME · ID DEL LIBRO</Text>
              <Text style={s.codeValue}>{codigoLibro ? `BKH-${String(codigoLibro.id_libro).padStart(5, '0')}` : ''}</Text>
              <View style={s.barcodeRow}>
                {(codigoLibro ? Array.from({ length: 40 }, (_, index) => {
                  const seed = `BKH-${String(codigoLibro.id_libro).padStart(5, '0')}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                  return { width: ((seed * (index + 1) * 7) % 4) + 1, filled: index % 2 === 0 };
                }) : []).map((bar, index) => (
                  <View key={index} style={[s.barcode, { width: bar.width, backgroundColor: bar.filled ? TEXT : 'transparent' }]} />
                ))}
              </View>
              {codigoLibro?.isbn || codigoLibro?.codigo_barras ? (
                <Text style={s.codeIsbn}>ISBN: {codigoLibro.isbn || codigoLibro.codigo_barras}</Text>
              ) : null}
              <Text style={s.codeMeta}>Precio {fmt(codigoLibro?.precio_libro ?? codigoLibro?.precio)} · Stock {codigoLibro?.stock ?? 0}</Text>
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnCancel]} onPress={() => setCodigoLibro(null)}>
                <Text style={s.modalBtnCancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnPrimary]}
                onPress={() => Clipboard.setStringAsync(`BKH-${String(codigoLibro?.id_libro).padStart(5, '0')}`)
                  .then(() => Alert.alert('Código copiado', 'El identificador del libro está en el portapapeles.'))
                  .catch((error) => Alert.alert('No se pudo copiar', getErrorMessage(error, 'Intenta copiar el código manualmente.')))}
              >
                <Text style={s.modalBtnDeleteText}>Copiar ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal eliminar ── */}
      <Modal
        visible={modalEliminar.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEliminar({ visible: false, libro: null })}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            {/* Icono */}
            <View style={s.modalIconBox}>
              <Text style={s.modalIconText}>🗑️</Text>
            </View>

            <Text style={s.modalTitle}>Eliminar libro</Text>
            <Text style={s.modalMsg}>
              ¿Estás seguro que quieres eliminar{'\n'}
              <Text style={s.modalLibroName}>"{modalEliminar.libro?.titulo}"</Text>?
            </Text>
            <Text style={s.modalWarning}>Esta acción no se puede deshacer.</Text>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={() => setModalEliminar({ visible: false, libro: null })}
                activeOpacity={0.8}
                disabled={deleting !== null}
              >
                <Text style={s.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnDelete]}
                onPress={confirmarEliminar}
                activeOpacity={0.8}
                disabled={deleting !== null}
              >
                {deleting === modalEliminar.libro?.id_libro
                  ? <ActivityIndicator color={WHITE} />
                  : <Text style={s.modalBtnDeleteText}>Sí, eliminar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SidebarVendedor
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />
    </SafeAreaView>
  );
}

const themeBaseS = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: BG },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },

  // header
  header:      { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  menuBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:    { color: WHITE, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  publishBtn:  { backgroundColor: WHITE, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  publishBtnText: { color: PRIMARY, fontWeight: '800', fontSize: 13 },
  publishBtn2: { backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  publishBtn2Text: { color: WHITE, fontWeight: '800', fontSize: 13 },
  errorText:   { color: '#991B1B', fontSize: 12, lineHeight: 18, textAlign: 'center', marginHorizontal: 20, marginTop: 8 },

  // resumen y filtros
  filters: { marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 7, marginBottom: 12 },
  summaryCard: { flex: 1, minHeight: 67, alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 8 },
  summaryValue: { color: PRIMARY, fontSize: 19, fontWeight: '900' },
  summaryLabel: { color: MUTED, fontSize: 10, fontWeight: '600', marginTop: 2 },
  summaryValueCard: { flex: 1.5 },
  summaryValueSmall: { color: MUTED, fontSize: 9, fontWeight: '700' },
  summaryMoney: { color: PRIMARY, fontSize: 12, fontWeight: '900', marginTop: 4, textAlign: 'center' },
  toolbarActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  posButton: { flex: 1, backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  posButtonText: { color: WHITE, fontSize: 12, fontWeight: '800' },
  thresholdButton: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  thresholdButtonText: { color: TEXT, fontSize: 11, fontWeight: '700' },

  // alertas
  alertaBanner:      { backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderColor: '#FCD34D', padding: 12 },
  alertaBannerTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 6 },
  alertaChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  alertaChip:        { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  alertaChipText:    { fontSize: 11, color: '#92400E', fontWeight: '600' },
  alertaMore:        { color: '#92400E', fontSize: 11, fontWeight: '700', alignSelf: 'center' },
  inlineError:       { color: '#991B1B', backgroundColor: '#FEF2F2', borderRadius: 9, padding: 10, fontSize: 11, marginBottom: 10 },
  searchRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  searchInput:       { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10, color: TEXT, fontSize: 13, marginBottom: 10 },
  searchInputInline: { flex: 1, minWidth: 0, marginBottom: 0 },
  filterButton:      { width: 44, height: 44, borderRadius: 11, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  filterButtonActive:{ backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterCountBadge:  { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: WHITE },
  filterCountText:   { color: WHITE, fontSize: 10, fontWeight: '800', paddingHorizontal: 3 },
  filterTitle:       { color: TEXT, fontSize: 11, fontWeight: '800', marginBottom: 6, marginTop: 3 },
  chipsRow:          { gap: 6, paddingBottom: 9 },
  filterChip:        { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7 },
  filterChipActive:  { backgroundColor: '#F8E7EC', borderColor: '#D8AAB7' },
  filterChipText:    { color: MUTED, fontSize: 10, fontWeight: '600' },
  filterChipTextActive: { color: PRIMARY, fontWeight: '800' },
  resultHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  resultText:        { color: MUTED, fontSize: 11 },
  pagination:        { alignItems: 'center', paddingVertical: 16, gap: 10 },
  paginationInfo:    { color: MUTED, fontSize: 11 },
  paginationButtons: { flexDirection: 'row', gap: 10 },
  pageButton:        { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 8 },
  pageButtonDisabled:{ opacity: 0.45 },
  pageButtonText:    { color: PRIMARY, fontSize: 11, fontWeight: '700' },
  pageSizes:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageSizeChip:      { borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  pageSizeChipActive:{ borderColor: PRIMARY, backgroundColor: '#F8E7EC' },
  pageSizeText:      { color: MUTED, fontSize: 10, fontWeight: '600' },
  pageSizeTextActive:{ color: PRIMARY, fontWeight: '800' },
  emptyResults:      { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 18 },
  emptyDescription:  { color: MUTED, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },

  // tarjeta libro
  card:        { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, overflow: 'hidden' },
  cardAlerta:  { borderColor: '#FCD34D', borderWidth: 1.5 },
  coverBox:    { width: 80, backgroundColor: '#F4F0EC', justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' },
  cover:       { width: 80, height: 110 },
  coverPlaceholder: { width: 80, height: 110, justifyContent: 'center', alignItems: 'center' },

  info:        { flex: 1, padding: 12, gap: 4 },
  infoTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  titulo:      { fontSize: 14, fontWeight: '700', color: TEXT, flex: 1 },
  autor:       { fontSize: 12, color: MUTED },
  earlyAccessBadge: { alignSelf: 'flex-start', borderRadius: 9, borderWidth: 1, borderColor: '#EAC8D2', backgroundColor: '#FDF2F4', paddingHorizontal: 9, paddingVertical: 6, marginTop: 7, marginBottom: 5 },
  earlyAccessBadgeTitle: { color: PRIMARY, fontSize: 10, fontWeight: '800' },
  earlyAccessBadgeText: { color: '#6B4A55', fontSize: 10, marginTop: 2 },
  infoBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  precio:      { fontSize: 14, fontWeight: '800', color: PRIMARY },
  stock:       { fontSize: 12, color: MUTED },
  stockBajo:   { color: '#B45309', fontWeight: '800' },
  stockAgotado:{ color: '#DC2626', fontWeight: '800' },

  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText:   { fontSize: 10, fontWeight: '700' },

  actions:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  btn:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, minWidth: 52, alignItems: 'center' },
  btnText:     { color: WHITE, fontSize: 11, fontWeight: '700' },
  btnVenta:    { backgroundColor: '#7A1E3A' },
  btnId:       { backgroundColor: '#64748B' },
  btnStock:    { backgroundColor: '#2563EB' },
  btnEditar:   { backgroundColor: '#059669' },
  btnEliminar: { backgroundColor: '#DC2626' },

  emptyTitle:  { fontSize: 15, fontWeight: '700', color: TEXT },

  // modal eliminar
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  modalBox:          { backgroundColor: WHITE, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  modalIconBox:      { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalIconText:     { fontSize: 28 },
  modalTitle:        { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 10 },
  modalMsg:          { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22 },
  modalLibroName:    { fontWeight: '700', color: TEXT },
  modalWarning:      { fontSize: 12, color: '#DC2626', fontWeight: '600', marginTop: 8, marginBottom: 24 },
  modalBtns:         { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn:          { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  modalBtnCancel:    { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: BORDER },
  modalBtnCancelText:{ fontSize: 14, fontWeight: '700', color: '#444' },
  modalBtnDelete:    { backgroundColor: '#DC2626' },
  modalBtnPrimary:   { backgroundColor: PRIMARY },
  modalBtnDeleteText:{ fontSize: 14, fontWeight: '800', color: WHITE },
  formModal:         { backgroundColor: WHITE, borderRadius: 20, padding: 22, width: '100%', maxWidth: 480, maxHeight: '85%' },
  filtersOverlay:    { justifyContent: 'flex-end', alignItems: 'stretch', paddingHorizontal: 0 },
  filtersModal:      { width: '100%', maxWidth: '100%', maxHeight: '82%', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 30 },
  filterModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  filterModalClose:  { color: MUTED, fontSize: 20, fontWeight: '700', paddingHorizontal: 4 },
  filterModalScroll: { flexShrink: 1 },
  filterModalActions:{ flexDirection: 'row', gap: 10, marginTop: 14 },
  filterModalApply:  { flex: 1, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  filterModalApplyText: { color: WHITE, fontSize: 13, fontWeight: '800' },
  saleModal:         { alignItems: 'stretch' },
  modalDescription:  { color: MUTED, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  saleBookList:      { maxHeight: 280, borderWidth: 1, borderColor: BORDER, borderRadius: 10, marginBottom: 14 },
  saleBookRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: BORDER, paddingHorizontal: 11, paddingVertical: 10 },
  saleBookDisabled:  { opacity: 0.45 },
  saleBookTitle:     { color: TEXT, fontSize: 13, fontWeight: '800' },
  saleBookDetail:    { color: MUTED, fontSize: 11, marginTop: 3 },
  saleBookStock:     { color: '#047857', fontSize: 10, fontWeight: '800' },
  selectedBook:      { backgroundColor: BG, borderRadius: 10, padding: 12, marginBottom: 14 },
  changeBook:        { color: PRIMARY, fontSize: 11, fontWeight: '800', marginTop: 8 },
  quantityRow:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 10 },
  quantityStep:      { width: 42, height: 42, borderRadius: 11, backgroundColor: '#F8E7EC', alignItems: 'center', justifyContent: 'center' },
  quantityStepText:  { color: PRIMARY, fontSize: 22, fontWeight: '700' },
  quantityInput:     { minWidth: 80, borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: TEXT, fontSize: 18, fontWeight: '800', textAlign: 'center', backgroundColor: WHITE },
  saleTotal:         { textAlign: 'center', color: PRIMARY, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  saleSuccessIcon:   { color: '#047857', backgroundColor: '#D1FAE5', borderRadius: 30, width: 54, height: 54, lineHeight: 54, textAlign: 'center', fontSize: 30, fontWeight: '900', alignSelf: 'center', marginBottom: 12, overflow: 'hidden' },
  codeCard:          { backgroundColor: WHITE, borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 13, padding: 16, alignItems: 'center', marginVertical: 14 },
  codeBrand:         { color: WHITE, backgroundColor: PRIMARY, fontSize: 10, fontWeight: '900', letterSpacing: 0.7, paddingHorizontal: 14, paddingVertical: 8, overflow: 'hidden', borderRadius: 6 },
  codeValue:         { color: TEXT, fontSize: 22, fontWeight: '900', letterSpacing: 2, fontFamily: 'monospace', marginTop: 14 },
  barcodeRow:        { height: 50, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', marginVertical: 8, overflow: 'hidden' },
  barcode:           { height: '100%', marginHorizontal: 0.5 },
  codeIsbn:          { color: MUTED, fontSize: 11, marginTop: 4 },
  codeMeta:          { color: TEXT, fontSize: 11, fontWeight: '700', marginTop: 8 },
});
const s = themeBaseS;
