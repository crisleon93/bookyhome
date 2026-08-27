import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IconBook,
  IconCheck,
  IconChevronLeft,
  IconEye,
  IconEyeOff,
  IconLock,
  IconPackage,
  IconStore,
  IconTrash,
  IconUnlock,
  IconUser,
} from '../components/Icons';
import {
  bloquearUsuario,
  cambiarEstadoTienda,
  eliminarLibroAdmin,
  getAdminLibros,
  getAdminOrdenes,
  getAdminTiendas,
  getAdminUsuarios,
  ocultarLibroAdmin,
} from '../services/api';

// ─── Paleta ───────────────────────────────────────────────────────────────────
const VINOTINTO = '#7A1E3A';
const BEIGE     = '#F4EDE2';
const BORDER    = '#E0DBD4';
const CARBON    = '#2A2A2A';
const GRAY      = '#666666';
const WHITE     = '#FFFFFF';
const GREEN     = '#2e7d32';
const RED       = '#c62828';

// ─── Config por sección ───────────────────────────────────────────────────────
const CONFIG = {
  usuarios: {
    title: 'Usuarios',
    subtitle: 'Gestiona los usuarios registrados',
    load: getAdminUsuarios,
    Icon: IconUser,
    color: VINOTINTO,
    soft: '#FDF2F4',
  },
  libros: {
    title: 'Libros',
    subtitle: 'Catálogo publicado en BookyHome',
    load: getAdminLibros,
    Icon: IconBook,
    color: '#7E22CE',
    soft: '#F3E8FF',
  },
  tiendas: {
    title: 'Tiendas',
    subtitle: 'Librerías y vendedores asociados',
    load: getAdminTiendas,
    Icon: IconStore,
    color: '#047857',
    soft: '#ECFDF5',
  },
  ordenes: {
    title: 'Órdenes',
    subtitle: 'Transacciones de la plataforma',
    load: getAdminOrdenes,
    Icon: IconPackage,
    color: '#1D4ED8',
    soft: '#EFF6FF',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const isActiveStore = (s) =>
  ['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes(
    (s || '').toLowerCase().trim()
  );
const isSuspendedStore = (s) =>
  ['suspendida', 'suspendido', 'inactiva', 'inactivo', 'pausada', 'pausado'].includes(
    (s || '').toLowerCase().trim()
  );

const ROL_COLORS = {
  admin:        { color: VINOTINTO,  bg: '#FDF2F4',  border: '#F8D2DA' },
  administrador:{ color: VINOTINTO,  bg: '#FDF2F4',  border: '#F8D2DA' },
  vendedor:     { color: '#B45309',  bg: '#FFFBEB',  border: '#FDE68A' },
  comprador:    { color: '#047857',  bg: '#ECFDF5',  border: '#A7F3D0' },
};
const getRolColors = (rol) =>
  ROL_COLORS[(rol || '').toLowerCase()] || { color: GRAY, bg: '#F3F4F6', border: '#D1D5DB' };

// ─── Componente principal ─────────────────────────────────────────────────────
const PER_PAGE = 10;

export default function AdminSection({ route, navigation }) {
  const section = route.params?.section || 'usuarios';
  const config  = CONFIG[section] || CONFIG.usuarios;

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  // Filtros compartidos
  const [busqueda, setBusqueda] = useState('');
  const [pagina,   setPagina]   = useState(1);

  // Filtro rol (usuarios)
  const ROLES = ['todos', 'comprador', 'vendedor', 'admin'];
  const [filtroRol, setFiltroRol] = useState('todos');

  // Filtro categoría (libros)
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // Estado de acciones en curso (para deshabilitar botones mientras se procesa)
  const actionInProgress = useRef({});

  // ─── Carga de datos ──────────────────────────────────────────────────────────
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const res = await config.load();
      setItems(res.data || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'No se pudo cargar esta sección.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [config]);

  useEffect(() => {
    load();
    setBusqueda('');
    setPagina(1);
    setFiltroRol('todos');
    setFiltroCategoria('todas');
  }, [load]);

  // ─── Categorías únicas para filtro de libros ──────────────────────────────
  const categorias = useMemo(() => {
    if (section !== 'libros') return [];
    const cats = new Set(items.map((l) => l.nombre_categoria).filter(Boolean));
    return ['todas', ...Array.from(cats).sort()];
  }, [items, section]);

  // ─── Filtrado y paginación ────────────────────────────────────────────────
  const reversed = useMemo(() => items.slice().reverse(), [items]);

  const filtered = useMemo(() => {
    let list = reversed;
    const q = busqueda.trim().toLowerCase();

    if (section === 'usuarios') {
      if (filtroRol !== 'todos')
        list = list.filter((u) => (u.rol || '').toLowerCase() === filtroRol);
      if (q)
        list = list.filter(
          (u) =>
            (u.nombre_usuario || '').toLowerCase().includes(q) ||
            (u.correo_usuario || '').toLowerCase().includes(q)
        );
    }

    if (section === 'libros') {
      if (filtroCategoria !== 'todas')
        list = list.filter((l) => l.nombre_categoria === filtroCategoria);
      if (q)
        list = list.filter(
          (l) =>
            (l.titulo || l.nombre_libro || '').toLowerCase().includes(q) ||
            (l.nombre_categoria || '').toLowerCase().includes(q)
        );
    }

    if (section === 'tiendas' && q)
      list = list.filter((t) =>
        (t.nombre_tienda || '').toLowerCase().includes(q) ||
        (t.estado_tienda || '').toLowerCase().includes(q)
      );

    if (section === 'ordenes' && q)
      list = list.filter(
        (o) =>
          String(o.id_orden || '').includes(q) ||
          (o.estado || '').toLowerCase().includes(q)
      );

    return list;
  }, [reversed, section, filtroRol, filtroCategoria, busqueda]);

  const totalPages  = Math.ceil(filtered.length / PER_PAGE) || 1;
  const pageSafe    = Math.min(pagina, totalPages);
  const pageItems   = filtered.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

  // Resetear página cuando cambia un filtro
  const resetPage = () => setPagina(1);

  // ─── Acciones usuarios ────────────────────────────────────────────────────
  const toggleBloqueo = useCallback(async (usuario) => {
    const key = `u-${usuario.id_usuario}`;
    if (actionInProgress.current[key]) return;
    actionInProgress.current[key] = true;

    const bloqueado = usuario.estado_usuario !== 'Bloqueado';
    const accion    = bloqueado ? 'bloquear' : 'desbloquear';

    Alert.alert(
      `¿${bloqueado ? 'Bloquear' : 'Desbloquear'} usuario?`,
      `${usuario.nombre_usuario} será ${accion}do de la plataforma.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => { actionInProgress.current[key] = false; },
        },
        {
          text: bloqueado ? 'Bloquear' : 'Desbloquear',
          style: bloqueado ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await bloquearUsuario(usuario.id_usuario, bloqueado);
              setItems((prev) =>
                prev.map((u) =>
                  u.id_usuario === usuario.id_usuario
                    ? { ...u, estado_usuario: bloqueado ? 'Bloqueado' : 'Activo' }
                    : u
                )
              );
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || 'No se pudo cambiar el estado del usuario.');
            } finally {
              actionInProgress.current[key] = false;
            }
          },
        },
      ]
    );
  }, []);

  // ─── Acciones libros ──────────────────────────────────────────────────────
  const toggleOcultar = useCallback(async (libro) => {
    const key = `l-${libro.id_libro}`;
    if (actionInProgress.current[key]) return;
    actionInProgress.current[key] = true;

    const nuevoOculto = !libro.oculto;
    try {
      await ocultarLibroAdmin(libro.id_libro, nuevoOculto);
      setItems((prev) =>
        prev.map((l) =>
          l.id_libro === libro.id_libro ? { ...l, oculto: nuevoOculto } : l
        )
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'No se pudo cambiar la visibilidad del libro.');
    } finally {
      actionInProgress.current[key] = false;
    }
  }, []);

  const confirmarEliminarLibro = useCallback((libro) => {
    Alert.alert(
      '¿Eliminar libro?',
      `"${libro.titulo || libro.nombre_libro}" será eliminado permanentemente. Si tiene compras asociadas, se ocultará en su lugar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await eliminarLibroAdmin(libro.id_libro);
              if (res.data?.modo === 'ocultado') {
                // El backend lo ocultó en lugar de eliminarlo (tiene compras)
                setItems((prev) =>
                  prev.map((l) =>
                    l.id_libro === libro.id_libro ? { ...l, oculto: true } : l
                  )
                );
                Alert.alert('Libro ocultado', 'El libro tiene compras asociadas y fue ocultado en lugar de eliminado.');
              } else {
                setItems((prev) => prev.filter((l) => l.id_libro !== libro.id_libro));
              }
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || 'No se pudo eliminar el libro.');
            }
          },
        },
      ]
    );
  }, []);

  // ─── Acciones tiendas ──────────────────────────────────────────────────────
  const toggleTienda = useCallback(async (tienda) => {
    const key = `t-${tienda.id_tienda}`;
    if (actionInProgress.current[key]) return;
    actionInProgress.current[key] = true;

    const activa       = isActiveStore(tienda.estado_tienda);
    const nuevoEstado  = activa ? 'Suspendida' : 'Activa';

    Alert.alert(
      `¿${activa ? 'Suspender' : 'Activar'} tienda?`,
      `"${tienda.nombre_tienda}" pasará al estado ${nuevoEstado}.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => { actionInProgress.current[key] = false; },
        },
        {
          text: activa ? 'Suspender' : 'Activar',
          style: activa ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await cambiarEstadoTienda(tienda.id_tienda, nuevoEstado);
              setItems((prev) =>
                prev.map((t) =>
                  t.id_tienda === tienda.id_tienda
                    ? { ...t, estado_tienda: nuevoEstado }
                    : t
                )
              );
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || 'No se pudo cambiar el estado de la tienda.');
            } finally {
              actionInProgress.current[key] = false;
            }
          },
        },
      ]
    );
  }, []);

  // ─── Renderizado de filas ─────────────────────────────────────────────────
  const renderUsuario = useCallback(({ item: u }) => {
    const bloqueado  = u.estado_usuario === 'Bloqueado';
    const rolColors  = getRolColors(u.rol);
    return (
      <View style={[styles.card, bloqueado && styles.cardBloqueado]}>
        {/* Avatar + info */}
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: bloqueado ? '#FEF2F2' : '#FDF2F4' }]}>
            <Text style={[styles.avatarText, { color: bloqueado ? RED : VINOTINTO }]}>
              {initials(u.nombre_usuario)}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{u.nombre_usuario || 'Usuario'}</Text>
            <Text style={styles.cardDetail} numberOfLines={1}>{u.correo_usuario || 'Sin correo'}</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          {/* Rol */}
          <View style={[styles.badge, { backgroundColor: rolColors.bg, borderColor: rolColors.border }]}>
            <Text style={[styles.badgeText, { color: rolColors.color }]}>{u.rol || 'usuario'}</Text>
          </View>
          {/* Estado */}
          <View style={[styles.badge, {
            backgroundColor: bloqueado ? '#FEF2F2' : '#ECFDF5',
            borderColor:      bloqueado ? '#FECACA' : '#A7F3D0',
          }]}>
            {bloqueado
              ? <IconLock   size={11} color={RED}   />
              : <IconCheck  size={11} color={GREEN}  />
            }
            <Text style={[styles.badgeText, { color: bloqueado ? RED : GREEN, marginLeft: 3 }]}>
              {bloqueado ? 'Bloqueado' : 'Activo'}
            </Text>
          </View>
        </View>

        {/* Acción */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: bloqueado ? '#ECFDF5' : '#FEF2F2', borderColor: bloqueado ? '#A7F3D0' : '#FECACA' }]}
          onPress={() => toggleBloqueo(u)}
          activeOpacity={0.75}
        >
          {bloqueado
            ? <IconUnlock size={14} color={GREEN} />
            : <IconLock   size={14} color={RED}   />
          }
          <Text style={[styles.actionText, { color: bloqueado ? GREEN : RED }]}>
            {bloqueado ? 'Desbloquear' : 'Bloquear'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [toggleBloqueo]);

  const renderLibro = useCallback(({ item: l }) => {
    const oculto = !!l.oculto;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: '#F3E8FF' }]}>
            <IconBook size={18} color="#7E22CE" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{l.titulo || l.nombre_libro || 'Libro sin título'}</Text>
            <Text style={styles.cardDetail} numberOfLines={1}>{l.nombre_categoria || 'Sin categoría'}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, {
            backgroundColor: oculto ? '#FEF2F2' : '#ECFDF5',
            borderColor:      oculto ? '#FECACA' : '#A7F3D0',
          }]}>
            {oculto
              ? <IconEyeOff size={11} color="#991B1B" />
              : <IconEye    size={11} color="#047857" />
            }
            <Text style={[styles.badgeText, { color: oculto ? '#991B1B' : '#047857', marginLeft: 3 }]}>
              {oculto ? 'Oculto' : 'Visible'}
            </Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnHalf, {
              backgroundColor: oculto ? '#ECFDF5' : '#FFFBEB',
              borderColor:      oculto ? '#A7F3D0' : '#FDE68A',
            }]}
            onPress={() => toggleOcultar(l)}
            activeOpacity={0.75}
          >
            {oculto
              ? <IconEye    size={13} color="#047857" />
              : <IconEyeOff size={13} color="#B45309" />
            }
            <Text style={[styles.actionText, { color: oculto ? '#047857' : '#B45309' }]}>
              {oculto ? 'Mostrar' : 'Ocultar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnHalf, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={() => confirmarEliminarLibro(l)}
            activeOpacity={0.75}
          >
            <IconTrash size={13} color={RED} />
            <Text style={[styles.actionText, { color: RED }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [toggleOcultar, confirmarEliminarLibro]);

  const renderTienda = useCallback(({ item: t }) => {
    const activa     = isActiveStore(t.estado_tienda);
    const suspendida = isSuspendedStore(t.estado_tienda);
    const estadoColor = activa
      ? { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857' }
      : suspendida
      ? { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' }
      : { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' };

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: '#ECFDF5' }]}>
            <IconStore size={18} color="#047857" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{t.nombre_tienda || 'Librería'}</Text>
            <Text style={styles.cardDetail} numberOfLines={1}>
              {t.telefono || (t.fecha_creacion ? new Date(t.fecha_creacion).toLocaleDateString('es-CO') : 'Sin información')}
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: estadoColor.bg, borderColor: estadoColor.border }]}>
            <Text style={[styles.badgeText, { color: estadoColor.text }]}>
              {t.estado_tienda || 'Pendiente'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, {
            backgroundColor: activa ? '#FEF2F2' : '#ECFDF5',
            borderColor:      activa ? '#FECACA' : '#A7F3D0',
          }]}
          onPress={() => toggleTienda(t)}
          activeOpacity={0.75}
        >
          <Text style={[styles.actionText, { color: activa ? RED : GREEN }]}>
            {activa ? 'Suspender' : 'Activar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [toggleTienda]);

  const renderOrden = useCallback(({ item: o }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: '#EFF6FF' }]}>
          <IconPackage size={18} color="#1D4ED8" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>Orden #{o.id_orden || '-'}</Text>
          <Text style={styles.cardDetail}>
            {o.fecha ? new Date(o.fecha).toLocaleDateString('es-CO') : 'Sin fecha'}
            {' · '}${Number(o.total || 0).toLocaleString('es-CO')}
          </Text>
        </View>
      </View>
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Text style={[styles.badgeText, { color: '#1D4ED8' }]}>{o.estado || 'Pendiente'}</Text>
        </View>
      </View>
    </View>
  ), []);

  const renderItem = useCallback((args) => {
    if (section === 'usuarios') return renderUsuario(args);
    if (section === 'libros')   return renderLibro(args);
    if (section === 'tiendas')  return renderTienda(args);
    return renderOrden(args);
  }, [section, renderUsuario, renderLibro, renderTienda, renderOrden]);

  const keyExtractor = useCallback(
    (item, idx) => String(item.id_usuario || item.id_libro || item.id_tienda || item.id_orden || idx),
    []
  );

  // ─── Header de la lista (filtros + búsqueda + contador) ───────────────────
  const ListHeader = useMemo(() => {
    return (
      <View style={styles.filtersBox}>
        {/* Búsqueda */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={
              section === 'usuarios' ? 'Buscar por nombre o correo…'
              : section === 'libros'  ? 'Buscar por título o categoría…'
              : section === 'tiendas' ? 'Buscar por nombre o estado…'
              : 'Buscar por ID o estado…'
            }
            placeholderTextColor="#AAA"
            value={busqueda}
            onChangeText={(t) => { setBusqueda(t); resetPage(); }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {/* Pills de rol (solo usuarios) */}
        {section === 'usuarios' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pillsContent}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, filtroRol === r && styles.pillActive]}
                onPress={() => { setFiltroRol(r); resetPage(); }}
              >
                <Text style={[styles.pillText, filtroRol === r && styles.pillTextActive]}>
                  {r === 'todos' ? 'Todos' : r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Pills de categoría (solo libros) */}
        {section === 'libros' && categorias.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pillsContent}>
            {categorias.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.pill, filtroCategoria === c && styles.pillActive]}
                onPress={() => { setFiltroCategoria(c); resetPage(); }}
              >
                <Text style={[styles.pillText, filtroCategoria === c && styles.pillTextActive]} numberOfLines={1}>
                  {c === 'todas' ? 'Todas' : c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Contador de resultados */}
        <Text style={styles.counter}>
          {filtered.length} {section} encontrado{filtered.length !== 1 ? 's' : ''}{busqueda || (filtroRol !== 'todos') || (filtroCategoria !== 'todas') ? ' (filtrado)' : ''}
        </Text>

        {/* Error */}
        {!!error && <Text style={styles.errorBox}>{error}</Text>}
      </View>
    );
  }, [section, busqueda, filtroRol, filtroCategoria, categorias, filtered.length, error]);

  // ─── Footer de paginación ─────────────────────────────────────────────────
  const ListFooter = useMemo(() => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageBtn, pageSafe === 1 && styles.pageBtnDisabled]}
          onPress={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pageSafe === 1}
        >
          <Text style={[styles.pageBtnText, pageSafe === 1 && styles.pageBtnTextDisabled]}>‹ Anterior</Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>{pageSafe} / {totalPages}</Text>

        <TouchableOpacity
          style={[styles.pageBtn, pageSafe === totalPages && styles.pageBtnDisabled]}
          onPress={() => setPagina((p) => Math.min(totalPages, p + 1))}
          disabled={pageSafe === totalPages}
        >
          <Text style={[styles.pageBtnText, pageSafe === totalPages && styles.pageBtnTextDisabled]}>Siguiente ›</Text>
        </TouchableOpacity>
      </View>
    );
  }, [pageSafe, totalPages]);

  // ─── Render principal ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header de pantalla */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <IconChevronLeft size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: config.soft }]}>
          <config.Icon size={20} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>{config.title}</Text>
          <Text style={styles.screenSubtitle}>{config.subtitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={config.color} />
          <Text style={{ color: GRAY, marginTop: 10 }}>Cargando {config.title.toLowerCase()}…</Text>
        </View>
      ) : (
        <FlatList
          data={pageItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[config.color]}
              tintColor={config.color}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {busqueda || filtroRol !== 'todos' || filtroCategoria !== 'todas'
                ? 'Sin resultados para los filtros aplicados.'
                : 'No hay registros todavía.'}
            </Text>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BEIGE,
  },

  // Header de pantalla
  screenHeader: {
    backgroundColor: VINOTINTO,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  screenTitle: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    marginTop: 1,
  },

  // Carga
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Lista
  list: {
    padding: 14,
    paddingBottom: 36,
  },

  // Filtros
  filtersBox: {
    marginBottom: 12,
  },
  searchRow: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 13,
    color: CARBON,
  },
  pillsScroll: {
    marginBottom: 10,
  },
  pillsContent: {
    gap: 7,
    paddingHorizontal: 1,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  pillActive: {
    backgroundColor: VINOTINTO,
    borderColor: VINOTINTO,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: GRAY,
  },
  pillTextActive: {
    color: WHITE,
  },
  counter: {
    color: GRAY,
    fontSize: 11,
    marginBottom: 4,
    marginLeft: 2,
  },
  errorBox: {
    color: '#991B1B',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    fontSize: 13,
  },

  // Tarjeta de ítem
  card: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardBloqueado: {
    opacity: 0.78,
    borderColor: '#FECACA',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: CARBON,
    fontSize: 14,
    fontWeight: '800',
  },
  cardDetail: {
    color: GRAY,
    fontSize: 11,
    marginTop: 3,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Botones de acción
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionBtnHalf: {
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Paginación
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  pageBtn: {
    backgroundColor: VINOTINTO,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  pageBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  pageBtnText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 13,
  },
  pageBtnTextDisabled: {
    color: GRAY,
  },
  pageInfo: {
    color: CARBON,
    fontWeight: '700',
    fontSize: 13,
  },

  // Vacío
  empty: {
    color: GRAY,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
