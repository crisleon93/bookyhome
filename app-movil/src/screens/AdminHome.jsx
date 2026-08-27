import React, {
  useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  ActivityIndicator, FlatList, Modal,
  Platform, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import SidebarAdmin from '../components/SidebarAdmin';
import {
  IconAlertTriangle, IconBook, IconCheck,
  IconEye, IconEyeOff, IconLock, IconMenu,
  IconPackage, IconStore, IconTrash, IconUnlock, IconUser,
} from '../components/Icons';
import {
  bloquearUsuario, cambiarEstadoTienda, eliminarLibroAdmin,
  getAdminLibros, getAdminOrdenes, getAdminSolicitudes,
  getAdminTiendas, getAdminUsuarios, ocultarLibroAdmin,
} from '../services/api';

// ─── Paleta ───────────────────────────────────────────────────────────────────
const VINOTINTO      = '#7A1E3A';
const VINOTINTO_DARK = '#5e1629';
const BEIGE          = '#F4EDE2';
const WHITE          = '#FFFFFF';
const CARBON         = '#2A2A2A';
const GRAY           = '#666666';
const BORDER         = '#E0DBD4';
const GREEN          = '#2e7d32';
const RED            = '#c62828';

// ─── Colores de estados de órdenes ───────────────────────────────────────────
const ORDEN_ESTADOS = {
  // Pagado — verde azulado
  pagado:      { bg: '#eafaf1', color: '#145c2e', border: '#1e8a45',  dot: '#1e8a45',  label: 'Pagado'      },
  // Enviado — azul
  enviado:     { bg: '#eaf3ff', color: '#1a4f8a', border: '#2979c7',  dot: '#2979c7',  label: 'Enviado'     },
  // Entregado — naranja cálido (no rojo, es un estado positivo)
  entregado:   { bg: '#FFF7ED', color: '#9A3412', border: '#FDBA74',  dot: '#EA580C',  label: 'Entregado'   },
  entregada:   { bg: '#FFF7ED', color: '#9A3412', border: '#FDBA74',  dot: '#EA580C',  label: 'Entregada'   },
  // Completada / Finalizada — verde oscuro
  completada:  { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0',  dot: '#10B981',  label: 'Completada'  },
  finalizada:  { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0',  dot: '#10B981',  label: 'Finalizada'  },
  // Cancelada — rojo
  cancelada:   { bg: '#fdecea', color: '#7b1e1e', border: '#c0392b',  dot: '#c0392b',  label: 'Cancelada'   },
  cancelado:   { bg: '#fdecea', color: '#7b1e1e', border: '#c0392b',  dot: '#c0392b',  label: 'Cancelado'   },
  // Pendiente / En proceso — naranja
  pendiente:   { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A',  dot: '#F59E0B',  label: 'Pendiente'   },
  'en proceso':{ bg: '#FFF7ED', color: '#9A3412', border: '#FDBA74',  dot: '#EA580C',  label: 'En proceso'  },
};
const getOrdenEstado = (estado) =>
  ORDEN_ESTADOS[(estado || '').toLowerCase()] ||
  { bg: '#F3F4F6', color: GRAY, border: '#D1D5DB', dot: '#9CA3AF', label: estado || 'Desconocido' };

const COLORS = {
  usuarios: { soft: '#FDF2F4', main: VINOTINTO,  value: VINOTINTO,  border: '#F8D2DA' },
  libros:   { soft: '#F3E8FF', main: '#7E22CE',  value: '#581C87',  border: '#E9D5FF' },
  tiendas:  { soft: '#ECFDF5', main: '#047857',  value: '#064E3B',  border: '#A7F3D0' },
  ordenes:  { soft: '#EFF6FF', main: '#1D4ED8',  value: '#1E3A8A',  border: '#BFDBFE' },
  active:    { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  pending:   { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  suspended: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  admin:     { bg: '#FDF2F4', color: VINOTINTO,  border: '#F8D2DA' },
  vendedor:  { bg: '#FFFBEB', color: '#B45309',  border: '#FDE68A' },
  comprador: { bg: '#ECFDF5', color: '#047857',  border: '#A7F3D0' },
};

const ROL_COLORS = {
  admin:         COLORS.admin,
  administrador: COLORS.admin,
  vendedor:      COLORS.vendedor,
  comprador:     COLORS.comprador,
};

const SECTION_CONFIG = {
  usuarios: { title: 'Usuarios',  subtitle: 'Gestiona los usuarios registrados',    Icon: IconUser,    color: VINOTINTO,  soft: '#FDF2F4' },
  libros:   { title: 'Libros',    subtitle: 'Catálogo publicado en BookyHome',       Icon: IconBook,    color: '#7E22CE',  soft: '#F3E8FF' },
  tiendas:  { title: 'Tiendas',   subtitle: 'Librerías y vendedores asociados',      Icon: IconStore,   color: '#047857',  soft: '#ECFDF5' },
  ordenes:  { title: 'Órdenes',   subtitle: 'Transacciones de la plataforma',        Icon: IconPackage, color: '#1D4ED8',  soft: '#EFF6FF' },
};

const PER_PAGE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const isPending      = (s) => ['abierto', 'en revision', 'en revisión'].includes((s || '').toLowerCase().trim());
const isActiveStore  = (s) => ['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes((s || '').toLowerCase().trim());
const isPendingStore = (s) => ['pendiente', 'en revision', 'en revisión', 'por revisar'].includes((s || '').toLowerCase().trim());
const isSuspStore    = (s) => ['suspendida', 'suspendido', 'inactiva', 'inactivo', 'pausada', 'pausado'].includes((s || '').toLowerCase().trim());
const getRolColors   = (rol) => ROL_COLORS[(rol || '').toLowerCase()] || { bg: '#F3F4F6', color: GRAY, border: '#D1D5DB' };
const getStoreColors = (estado) => isActiveStore(estado) ? COLORS.active : isPendingStore(estado) ? COLORS.pending : COLORS.suspended;
const fmtPrice       = (p) => `$${Number(p || 0).toLocaleString('es-CO')}`;

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
function ConfirmModal({ visible, title, message, confirmText, confirmColor = RED, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={ms.overlay}>
        <View style={ms.box}>
          <View style={ms.iconRow}>
            <View style={[ms.iconWrap, { backgroundColor: confirmColor === RED ? '#FEF2F2' : '#ECFDF5' }]}>
              <IconAlertTriangle size={26} color={confirmColor} />
            </View>
          </View>
          <Text style={ms.title}>{title}</Text>
          <Text style={ms.message}>{message}</Text>
          <View style={ms.btnRow}>
            <TouchableOpacity style={ms.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={ms.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ms.confirmBtn, { backgroundColor: confirmColor }]} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={ms.confirmText}>{confirmText || 'Confirmar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  box:        { backgroundColor: WHITE, borderRadius: 20, padding: 26, width: '100%', maxWidth: 360, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 },
  iconRow:    { alignItems: 'center', marginBottom: 16 },
  iconWrap:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title:      { color: CARBON, fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  message:    { color: GRAY, fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 24 },
  btnRow:     { flexDirection: 'row', gap: 10 },
  cancelBtn:  { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { color: CARBON, fontWeight: '700', fontSize: 14 },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  confirmText:{ color: WHITE, fontWeight: '800', fontSize: 14 },
});

// ─── InfoModal genérico (para avisos sin acción destructiva) ──────────────────
function InfoModal({ visible, title, message, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.box}>
          <View style={ms.iconRow}>
            <View style={[ms.iconWrap, { backgroundColor: '#EFF6FF' }]}>
              <IconCheck size={26} color="#1D4ED8" />
            </View>
          </View>
          <Text style={ms.title}>{title}</Text>
          <Text style={ms.message}>{message}</Text>
          <TouchableOpacity style={[ms.confirmBtn, { backgroundColor: VINOTINTO }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={ms.confirmText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ text, bg, color, border }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 10, borderColor: border, backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, marginRight: 5, marginBottom: 4 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{text}</Text>
    </View>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, valueColor, tagLabel, tagBg, tagColor, tagBorder, iconBg, Icon, iconColor, cardBorder, onPress, details }) {
  return (
    <TouchableOpacity style={[s.kpiCard, { borderColor: cardBorder }]} onPress={onPress} activeOpacity={0.82}>
      <View style={s.kpiTop}>
        <View style={[s.kpiIconBox, { backgroundColor: iconBg }]}><Icon size={22} color={iconColor} /></View>
        <View style={[s.kpiTag, { backgroundColor: tagBg, borderColor: tagBorder }]}>
          <Text style={[s.kpiTagText, { color: tagColor }]} numberOfLines={1}>{tagLabel}</Text>
        </View>
      </View>
      <Text style={[s.kpiValue, { color: valueColor }]}>{value}</Text>
      <Text style={s.kpiTitle}>{title}</Text>
      <View style={s.kpiDivider} />
      <View style={s.kpiBadges}>{details}</View>
    </TouchableOpacity>
  );
}

// ─── RoleRow ──────────────────────────────────────────────────────────────────
function RoleRow({ label, count, total, dotColor, pctBg, pctColor, pctBorder }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor, marginRight: 8 }} />
        <Text style={{ flex: 1, color: CARBON, fontSize: 13, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: GRAY, fontSize: 11, fontWeight: '600', marginRight: 8 }}>{count} usuarios</Text>
        <View style={{ borderWidth: 1, borderRadius: 8, borderColor: pctBorder, backgroundColor: pctBg, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ color: pctColor, fontSize: 11, fontWeight: '800' }}>{pct}%</Text>
        </View>
      </View>
      <View style={{ height: 8, borderRadius: 10, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
        <View style={{ height: '100%', borderRadius: 10, width: `${pct}%`, backgroundColor: dotColor }} />
      </View>
    </View>
  );
}

// ─── PanelHeader ─────────────────────────────────────────────────────────────
function PanelHeader({ iconNode, title, subtitle, extra, linkText, onLink }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 8 }}>
          <View style={{ marginRight: 10, marginTop: 1 }}>{iconNode}</View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: VINOTINTO, fontSize: 15, fontWeight: '800' }} numberOfLines={2}>{title}</Text>
            {subtitle ? <Text style={{ color: GRAY, fontSize: 11, marginTop: 2 }}>{subtitle}</Text> : null}
          </View>
        </View>
        {onLink && (
          <TouchableOpacity onPress={onLink} style={{ backgroundColor: '#FAF5EE', borderColor: BORDER, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', flexShrink: 0 }}>
            <Text style={{ color: VINOTINTO, fontSize: 10, fontWeight: '800' }} numberOfLines={1}>{linkText}</Text>
          </TouchableOpacity>
        )}
      </View>
      {extra ? <Text style={{ color: GRAY, fontSize: 11, fontWeight: '600', marginTop: 6, marginLeft: 30 }}>{extra}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminHome() {
  const { user, signOut } = useContext(AuthContext);

  // ── Vista activa: 'dashboard' o id de sección ─────────────────────────────
  const [activeSection, setActiveSection] = useState('dashboard');
  const [menuVisible,   setMenuVisible]   = useState(false);

  // ── Datos globales (cargados una vez) ─────────────────────────────────────
  const [data, setData] = useState({
    usuarios: [], libros: [], ordenes: [], tiendas: [], solicitudes: [],
  });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  // ── Estado del modal de confirmación ─────────────────────────────────────
  const [modal, setModal] = useState({ visible: false, title: '', message: '', confirmText: '', confirmColor: RED, onConfirm: null });
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', message: '' });

  const showConfirm = (opts) => setModal({ visible: true, ...opts });
  const hideConfirm = () => setModal((m) => ({ ...m, visible: false }));
  const showInfo    = (title, message) => setInfoModal({ visible: true, title, message });
  const hideInfo    = () => setInfoModal((m) => ({ ...m, visible: false }));

  // ── Filtros por sección ───────────────────────────────────────────────────
  const [filtroRol,       setFiltroRol]       = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [busqueda,        setBusqueda]        = useState('');
  const [pagina,          setPagina]          = useState(1);

  // Libro expandido (acordeón)
  const [expandedLibro,  setExpandedLibro]  = useState(null);
  // Tienda expandida (acordeón)
  const [expandedTienda, setExpandedTienda] = useState(null);

  // Previene doble tap en acciones
  const actionInProgress = useRef({});

  // ── Carga de datos ────────────────────────────────────────────────────────
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [u, l, o, t, s] = await Promise.all([
        getAdminUsuarios(), getAdminLibros(), getAdminOrdenes(),
        getAdminTiendas(), getAdminSolicitudes(),
      ]);
      setData({
        usuarios:    u.data || [],
        libros:      l.data || [],
        ordenes:     o.data || [],
        tiendas:     t.data || [],
        solicitudes: s.data || [],
      });
    } catch (e) {
      setError(e.response?.data?.detail || 'No pudimos cargar el resumen. Desliza para reintentar.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Resetear filtros al cambiar sección
  useEffect(() => {
    setBusqueda('');
    setPagina(1);
    setFiltroRol('todos');
    setFiltroCategoria('todas');
    setExpandedLibro(null);
    setExpandedTienda(null);
  }, [activeSection]);

  // ── Stats del dashboard ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const rol  = (n) => data.usuarios.filter((u) => (u.rol || '').toLowerCase() === n).length;
    const cats = data.libros.reduce((a, l) => {
      const k = l.nombre_categoria || 'Sin categoría'; a[k] = (a[k] || 0) + 1; return a;
    }, {});
    const today = new Date().toLocaleDateString('es-CO');
    return {
      buyers:        rol('comprador'),
      sellers:       rol('vendedor'),
      admins:        data.usuarios.filter((u) => ['admin', 'administrador'].includes((u.rol || '').toLowerCase())).length,
      activeBooks:   data.libros.filter((l) => !l.oculto).length,
      activeStores:  data.tiendas.filter((t) => isActiveStore(t.estado_tienda)).length,
      pendingStores: data.tiendas.filter((t) => isPendingStore(t.estado_tienda)).length,
      suspStores:    data.tiendas.filter((t) => isSuspStore(t.estado_tienda)).length,
      categories:    cats,
      ordersToday:   data.ordenes.filter((o) => o.fecha && new Date(o.fecha).toLocaleDateString('es-CO') === today).length,
      completed:     data.ordenes.filter((o) => ['completada', 'entregado', 'finalizada'].includes((o.estado || '').toLowerCase())).length,
      claims:        data.solicitudes.filter((s) => ['reclamo', 'queja', 'quejas'].includes((s.tipo_solicitud || '').toLowerCase()) && isPending(s.estado)).length,
      support:       data.solicitudes.filter((s) => !['reclamo', 'queja', 'quejas'].includes((s.tipo_solicitud || '').toLowerCase()) && isPending(s.estado)).length,
    };
  }, [data]);

  const totalCats  = Object.keys(stats.categories).length;
  const topCats    = Object.entries(stats.categories).sort(([, a], [, b]) => b - a).slice(0, 6);
  const lastUsers  = data.usuarios.slice().reverse().slice(0, 5);
  const lastStores = data.tiendas.slice().reverse().slice(0, 5);

  // ── Categorías únicas para filtro de libros ───────────────────────────────
  const categorias = useMemo(() => {
    const cats = new Set(data.libros.map((l) => l.nombre_categoria).filter(Boolean));
    return ['todas', ...Array.from(cats).sort()];
  }, [data.libros]);

  // ── Filtrado y paginación por sección ─────────────────────────────────────
  const sectionItems = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let list = activeSection === 'usuarios' ? data.usuarios.slice().reverse()
             : activeSection === 'libros'   ? data.libros.slice().reverse()
             : activeSection === 'tiendas'  ? data.tiendas.slice().reverse()
             : activeSection === 'ordenes'  ? data.ordenes.slice().sort((a, b) => {
               // Más recientes primero: ordena por fecha descendente, luego por id descendente como fallback
               const fa = a.fecha ? new Date(a.fecha).getTime() : 0;
               const fb = b.fecha ? new Date(b.fecha).getTime() : 0;
               if (fb !== fa) return fb - fa;
               return (b.id_orden || 0) - (a.id_orden || 0);
             })
             : [];

    if (activeSection === 'usuarios') {
      if (filtroRol !== 'todos') list = list.filter((u) => (u.rol || '').toLowerCase() === filtroRol);
      if (q) list = list.filter((u) =>
        (u.nombre_usuario || '').toLowerCase().includes(q) ||
        (u.correo_usuario || '').toLowerCase().includes(q));
    }
    if (activeSection === 'libros') {
      if (filtroCategoria !== 'todas') list = list.filter((l) => l.nombre_categoria === filtroCategoria);
      if (q) list = list.filter((l) =>
        (l.titulo || l.nombre_libro || '').toLowerCase().includes(q) ||
        (l.autor_libro || '').toLowerCase().includes(q) ||
        (l.nombre_tienda || '').toLowerCase().includes(q));
    }
    if (activeSection === 'tiendas' && q)
      list = list.filter((t) =>
        (t.nombre_tienda || '').toLowerCase().includes(q) ||
        (t.estado_tienda || '').toLowerCase().includes(q));
    if (activeSection === 'ordenes' && q)
      list = list.filter((o) =>
        String(o.id_orden || '').includes(q) ||
        (o.estado || '').toLowerCase().includes(q));

    return list;
  }, [activeSection, data, busqueda, filtroRol, filtroCategoria]);

  const totalPages = Math.ceil(sectionItems.length / PER_PAGE) || 1;
  const pageSafe   = Math.min(pagina, totalPages);
  const pageItems  = sectionItems.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

  // ── Acciones — Usuarios ───────────────────────────────────────────────────
  const handleBloqueo = useCallback((u) => {
    const bloqueado = u.estado_usuario !== 'Bloqueado';
    showConfirm({
      title:        bloqueado ? '¿Bloquear usuario?' : '¿Desbloquear usuario?',
      message:      `${u.nombre_usuario} ${bloqueado ? 'no podrá ingresar a la plataforma.' : 'recuperará el acceso a la plataforma.'}`,
      confirmText:  bloqueado ? 'Bloquear' : 'Desbloquear',
      confirmColor: bloqueado ? RED : GREEN,
      onConfirm: async () => {
        hideConfirm();
        try {
          await bloquearUsuario(u.id_usuario, bloqueado);
          setData((prev) => ({
            ...prev,
            usuarios: prev.usuarios.map((x) =>
              x.id_usuario === u.id_usuario
                ? { ...x, estado_usuario: bloqueado ? 'Bloqueado' : 'Activo' }
                : x),
          }));
        } catch (e) {
          showInfo('Error', e.response?.data?.detail || 'No se pudo cambiar el estado del usuario.');
        }
      },
    });
  }, []);

  // ── Acciones — Libros ─────────────────────────────────────────────────────
  const handleOcultar = useCallback(async (libro) => {
    const key = `l-${libro.id_libro}`;
    if (actionInProgress.current[key]) return;
    actionInProgress.current[key] = true;
    const nuevoOculto = !libro.oculto;
    try {
      await ocultarLibroAdmin(libro.id_libro, nuevoOculto);
      setData((prev) => ({
        ...prev,
        libros: prev.libros.map((l) =>
          l.id_libro === libro.id_libro ? { ...l, oculto: nuevoOculto } : l),
      }));
    } catch (e) {
      showInfo('Error', e.response?.data?.detail || 'No se pudo cambiar la visibilidad.');
    } finally {
      actionInProgress.current[key] = false;
    }
  }, []);

  const handleEliminar = useCallback((libro) => {
    showConfirm({
      title:        '¿Eliminar libro?',
      message:      `"${libro.titulo || libro.nombre_libro}" será eliminado. Si tiene compras asociadas, se ocultará en su lugar.`,
      confirmText:  'Eliminar',
      confirmColor: RED,
      onConfirm: async () => {
        hideConfirm();
        try {
          const res = await eliminarLibroAdmin(libro.id_libro);
          if (res.data?.modo === 'ocultado') {
            setData((prev) => ({
              ...prev,
              libros: prev.libros.map((l) =>
                l.id_libro === libro.id_libro ? { ...l, oculto: true } : l),
            }));
            showInfo('Libro ocultado', 'El libro tiene compras asociadas y fue ocultado en lugar de eliminado.');
          } else {
            setData((prev) => ({ ...prev, libros: prev.libros.filter((l) => l.id_libro !== libro.id_libro) }));
          }
        } catch (e) {
          showInfo('Error', e.response?.data?.detail || 'No se pudo eliminar el libro.');
        }
      },
    });
  }, []);

  // ── Acciones — Tiendas ────────────────────────────────────────────────────
  const handleEstadoTienda = useCallback((t) => {
    const activa      = isActiveStore(t.estado_tienda);
    const nuevoEstado = activa ? 'Suspendida' : 'Activa';
    showConfirm({
      title:        activa ? '¿Suspender tienda?' : '¿Activar tienda?',
      message:      `"${t.nombre_tienda}" pasará al estado ${nuevoEstado}.`,
      confirmText:  activa ? 'Suspender' : 'Activar',
      confirmColor: activa ? RED : GREEN,
      onConfirm: async () => {
        hideConfirm();
        try {
          await cambiarEstadoTienda(t.id_tienda, nuevoEstado);
          setData((prev) => ({
            ...prev,
            tiendas: prev.tiendas.map((x) =>
              x.id_tienda === t.id_tienda ? { ...x, estado_tienda: nuevoEstado } : x),
          }));
        } catch (e) {
          showInfo('Error', e.response?.data?.detail || 'No se pudo cambiar el estado de la tienda.');
        }
      },
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER — tarjetas de cada sección
  // ─────────────────────────────────────────────────────────────────────────

  // ── Tarjeta Usuario ───────────────────────────────────────────────────────
  const renderUsuario = useCallback(({ item: u }) => {
    const bloqueado = u.estado_usuario === 'Bloqueado';
    const rc        = getRolColors(u.rol);
    return (
      <View style={[s.card, bloqueado && s.cardBloqueado]}>
        <View style={s.cardTop}>
          <View style={[s.avatar, { backgroundColor: bloqueado ? '#FEF2F2' : '#FDF2F4' }]}>
            <Text style={[s.avatarTxt, { color: bloqueado ? RED : VINOTINTO }]}>{initials(u.nombre_usuario)}</Text>
          </View>
          <View style={s.cardMid}>
            <Text style={s.cardName} numberOfLines={1}>{u.nombre_usuario || 'Usuario'}</Text>
            <Text style={s.cardSub}  numberOfLines={1}>{u.correo_usuario  || 'Sin correo'}</Text>
          </View>
        </View>
        {/* Badges */}
        <View style={s.badgeRow}>
          <View style={[s.badge, { backgroundColor: rc.bg, borderColor: rc.border }]}>
            <Text style={[s.badgeTxt, { color: rc.color }]}>{u.rol || 'usuario'}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: bloqueado ? '#FEF2F2' : '#ECFDF5', borderColor: bloqueado ? '#FECACA' : '#A7F3D0' }]}>
            {bloqueado
              ? <IconLock  size={11} color={RED}   />
              : <IconCheck size={11} color={GREEN}  />}
            <Text style={[s.badgeTxt, { color: bloqueado ? RED : GREEN, marginLeft: 3 }]}>
              {bloqueado ? 'Bloqueado' : 'Activo'}
            </Text>
          </View>
        </View>
        {/* Acción */}
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: bloqueado ? '#ECFDF5' : '#FEF2F2', borderColor: bloqueado ? '#A7F3D0' : '#FECACA' }]}
          onPress={() => handleBloqueo(u)}
          activeOpacity={0.75}
        >
          {bloqueado
            ? <IconUnlock size={14} color={GREEN} />
            : <IconLock   size={14} color={RED}   />}
          <Text style={[s.actionTxt, { color: bloqueado ? GREEN : RED }]}>
            {bloqueado ? 'Desbloquear' : 'Bloquear'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [handleBloqueo]);

  // ── Tarjeta Libro (con acordeón) ──────────────────────────────────────────
  const renderLibro = useCallback(({ item: l }) => {
    const oculto   = !!l.oculto;
    const expanded = expandedLibro === l.id_libro;

    return (
      <View style={[s.card, oculto && s.cardOculto]}>
        {/* Fila principal siempre visible */}
        <TouchableOpacity
          style={s.cardTop}
          onPress={() => setExpandedLibro(expanded ? null : l.id_libro)}
          activeOpacity={0.8}
        >
          <View style={[s.avatar, { backgroundColor: '#F3E8FF' }]}>
            <IconBook size={18} color="#7E22CE" />
          </View>
          <View style={s.cardMid}>
            <Text style={s.cardName} numberOfLines={1}>{l.titulo || l.nombre_libro || 'Libro sin título'}</Text>
            <Text style={s.cardSub}  numberOfLines={1}>{l.autor_libro || 'Autor desconocido'}</Text>
          </View>
          {/* Badge visible/oculto + chevron */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[s.badge, { backgroundColor: oculto ? '#FEF2F2' : '#ECFDF5', borderColor: oculto ? '#FECACA' : '#A7F3D0' }]}>
              {oculto
                ? <IconEyeOff size={11} color="#991B1B" />
                : <IconEye    size={11} color="#047857" />}
              <Text style={[s.badgeTxt, { color: oculto ? '#991B1B' : '#047857', marginLeft: 3 }]}>
                {oculto ? 'Oculto' : 'Visible'}
              </Text>
            </View>
            <View style={s.chevronWrap}>
              <Text style={s.chevronTxt}>{expanded ? '▲' : '▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Detalles expandibles */}
        {expanded && (
          <View style={s.expandBox}>
            {/* Precio */}
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Precio</Text>
              <View style={s.priceBadge}>
                <Text style={s.priceTxt}>{fmtPrice(l.precio_libro)}</Text>
              </View>
            </View>
            {/* Tienda */}
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Tienda</Text>
              <Text style={[s.detailValue, { color: VINOTINTO, fontWeight: '700' }]} numberOfLines={1}>
                {l.nombre_tienda || '—'}
              </Text>
            </View>
            {/* Categoría */}
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Categoría</Text>
              <View style={[s.badge, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
                <Text style={[s.badgeTxt, { color: '#7E22CE' }]}>{l.nombre_categoria || 'Sin categoría'}</Text>
              </View>
            </View>
            {/* Stock eliminado — no aparece en el dashboard web */}
            {/* Estado */}
            <View style={[s.detailRow, { marginBottom: 14 }]}>
              <Text style={s.detailLabel}>Estado</Text>
              <View style={[s.badge, { backgroundColor: oculto ? '#FEF2F2' : '#ECFDF5', borderColor: oculto ? '#FECACA' : '#A7F3D0' }]}>
                {oculto
                  ? <IconEyeOff size={11} color="#991B1B" />
                  : <IconEye    size={11} color="#047857" />}
                <Text style={[s.badgeTxt, { color: oculto ? '#991B1B' : '#047857', marginLeft: 3 }]}>
                  {oculto ? 'Oculto en catálogo' : 'Visible en catálogo'}
                </Text>
              </View>
            </View>

            {/* Acciones */}
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, s.actionHalf, {
                  backgroundColor: oculto ? '#ECFDF5' : '#FFFBEB',
                  borderColor:     oculto ? '#A7F3D0' : '#FDE68A',
                }]}
                onPress={() => handleOcultar(l)}
                activeOpacity={0.75}
              >
                {oculto
                  ? <IconEye    size={13} color="#047857" />
                  : <IconEyeOff size={13} color="#B45309" />}
                <Text style={[s.actionTxt, { color: oculto ? '#047857' : '#B45309' }]}>
                  {oculto ? 'Mostrar' : 'Ocultar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, s.actionHalf, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                onPress={() => handleEliminar(l)}
                activeOpacity={0.75}
              >
                <IconTrash size={13} color={RED} />
                <Text style={[s.actionTxt, { color: RED }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }, [expandedLibro, handleOcultar, handleEliminar]);

  // ── Tarjeta Tienda (con acordeón) ────────────────────────────────────────
  const renderTienda = useCallback(({ item: t }) => {
    const activa   = isActiveStore(t.estado_tienda);
    const sc       = getStoreColors(t.estado_tienda);
    const expanded = expandedTienda === t.id_tienda;
    const fecha    = t.fecha_creacion
      ? new Date(t.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    return (
      <View style={s.card}>
        {/* Fila principal — siempre visible, toca para expandir */}
        <TouchableOpacity
          style={s.cardTop}
          onPress={() => setExpandedTienda(expanded ? null : t.id_tienda)}
          activeOpacity={0.8}
        >
          <View style={[s.avatar, { backgroundColor: '#ECFDF5' }]}>
            <IconStore size={18} color="#047857" />
          </View>
          <View style={s.cardMid}>
            <Text style={s.cardName} numberOfLines={1}>{t.nombre_tienda || 'Librería'}</Text>
            <Text style={s.cardSub}  numberOfLines={1}>
              {t.telefono || t.direccion || fecha}
            </Text>
          </View>
          {/* Badge estado + chevron */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[s.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sc.color, marginRight: 4 }} />
              <Text style={[s.badgeTxt, { color: sc.color }]}>{t.estado_tienda || 'Pendiente'}</Text>
            </View>
            <View style={s.chevronWrap}>
              <Text style={s.chevronTxt}>{expanded ? '▲' : '▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Detalles expandibles */}
        {expanded && (
          <View style={s.expandBox}>
            {/* ID */}
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>ID Tienda</Text>
              <Text style={s.detailValue}>#{t.id_tienda || '—'}</Text>
            </View>
            {/* Dirección */}
            {!!t.direccion && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Dirección</Text>
                <Text style={[s.detailValue, { maxWidth: '60%', textAlign: 'right' }]} numberOfLines={2}>{t.direccion}</Text>
              </View>
            )}
            {/* Teléfono */}
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Teléfono</Text>
              <Text style={s.detailValue}>{t.telefono || '—'}</Text>
            </View>
            {/* Fecha de registro */}
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Registro</Text>
              <Text style={s.detailValue}>{fecha}</Text>
            </View>
            {/* Estado actual */}
            <View style={[s.detailRow, { marginBottom: 14 }]}>
              <Text style={s.detailLabel}>Estado</Text>
              <View style={[s.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sc.color, marginRight: 4 }} />
                <Text style={[s.badgeTxt, { color: sc.color }]}>{t.estado_tienda || 'Pendiente'}</Text>
              </View>
            </View>

            {/* Acción */}
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: activa ? '#FEF2F2' : '#ECFDF5', borderColor: activa ? '#FECACA' : '#A7F3D0' }]}
              onPress={() => handleEstadoTienda(t)}
              activeOpacity={0.75}
            >
              <Text style={[s.actionTxt, { color: activa ? RED : GREEN }]}>
                {activa ? 'Suspender tienda' : 'Activar tienda'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [expandedTienda, handleEstadoTienda]);

  // ── Tarjeta Orden ─────────────────────────────────────────────────────────
  const renderOrden = useCallback(({ item: o }) => {
    const ec = getOrdenEstado(o.estado);
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={[s.avatar, { backgroundColor: '#EFF6FF' }]}>
            <IconPackage size={18} color="#1D4ED8" />
          </View>
          <View style={s.cardMid}>
            <Text style={s.cardName}>Orden #{o.id_orden || '—'}</Text>
            <Text style={s.cardSub}>
              {o.fecha ? new Date(o.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
            </Text>
          </View>
          {/* Precio destacado */}
          <View style={s.priceBadge}>
            <Text style={s.priceTxt}>{fmtPrice(o.total)}</Text>
          </View>
        </View>
        {/* Badge de estado con color semántico */}
        <View style={s.badgeRow}>
          <View style={[s.badge, { backgroundColor: ec.bg, borderColor: ec.border }]}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ec.dot, marginRight: 5 }} />
            <Text style={[s.badgeTxt, { color: ec.color }]}>{ec.label}</Text>
          </View>
        </View>
      </View>
    );
  }, []);

  const renderItem = useCallback((args) => {
    if (activeSection === 'usuarios') return renderUsuario(args);
    if (activeSection === 'libros')   return renderLibro(args);
    if (activeSection === 'tiendas')  return renderTienda(args);
    return renderOrden(args);
  }, [activeSection, renderUsuario, renderLibro, renderTienda, renderOrden]);

  const keyExtractor = useCallback((item, idx) =>
    String(item.id_usuario || item.id_libro || item.id_tienda || item.id_orden || idx), []);

  // ─────────────────────────────────────────────────────────────────────────
  //  HEADER DE SECCIÓN (filtros + búsqueda)
  // ─────────────────────────────────────────────────────────────────────────
  const cfg = SECTION_CONFIG[activeSection];

  const SectionListHeader = useMemo(() => (
    <View style={{ marginBottom: 12 }}>
      {/* Buscador */}
      <TextInput
        style={s.searchInput}
        placeholder={
          activeSection === 'usuarios' ? 'Buscar por nombre o correo…'
          : activeSection === 'libros'  ? 'Buscar por título, autor o tienda…'
          : activeSection === 'tiendas' ? 'Buscar por nombre o estado…'
          : 'Buscar por ID o estado…'
        }
        placeholderTextColor="#AAA"
        value={busqueda}
        onChangeText={(t) => { setBusqueda(t); setPagina(1); }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {/* Pills rol */}
      {activeSection === 'usuarios' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ gap: 7 }}>
          {['todos', 'comprador', 'vendedor', 'admin'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.pill, filtroRol === r && s.pillActive]}
              onPress={() => { setFiltroRol(r); setPagina(1); }}
            >
              <Text style={[s.pillTxt, filtroRol === r && s.pillTxtActive]}>
                {r === 'todos' ? 'Todos' : r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Pills categoría */}
      {activeSection === 'libros' && categorias.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ gap: 7 }}>
          {categorias.map((c) => (
            <TouchableOpacity
              key={c}
              style={[s.pill, filtroCategoria === c && s.pillActive]}
              onPress={() => { setFiltroCategoria(c); setPagina(1); }}
            >
              <Text style={[s.pillTxt, filtroCategoria === c && s.pillTxtActive]} numberOfLines={1}>
                {c === 'todas' ? 'Todas' : c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={s.counter}>
        {sectionItems.length} {activeSection} encontrado{sectionItems.length !== 1 ? 's' : ''}
        {busqueda || filtroRol !== 'todos' || filtroCategoria !== 'todas' ? ' (filtrado)' : ''}
      </Text>
    </View>
  ), [activeSection, busqueda, filtroRol, filtroCategoria, categorias, sectionItems.length]);

  // ── Paginación ────────────────────────────────────────────────────────────
  const SectionListFooter = useMemo(() => {
    if (totalPages <= 1) return null;
    return (
      <View style={s.pagination}>
        <TouchableOpacity
          style={[s.pageBtn, pageSafe === 1 && s.pageBtnOff]}
          onPress={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pageSafe === 1}
        >
          <Text style={[s.pageBtnTxt, pageSafe === 1 && s.pageBtnTxtOff]}>‹ Anterior</Text>
        </TouchableOpacity>
        <Text style={s.pageInfo}>{pageSafe} / {totalPages}</Text>
        <TouchableOpacity
          style={[s.pageBtn, pageSafe === totalPages && s.pageBtnOff]}
          onPress={() => setPagina((p) => Math.min(totalPages, p + 1))}
          disabled={pageSafe === totalPages}
        >
          <Text style={[s.pageBtnTxt, pageSafe === totalPages && s.pageBtnTxtOff]}>Siguiente ›</Text>
        </TouchableOpacity>
      </View>
    );
  }, [pageSafe, totalPages]);

  // ─────────────────────────────────────────────────────────────────────────
  //  HEADER DINÁMICO (cambia entre dashboard y sección)
  // ─────────────────────────────────────────────────────────────────────────
  const isDashboard = activeSection === 'dashboard';

  const headerContent = isDashboard ? (
    <>
      <TouchableOpacity style={s.menuBtn} onPress={() => setMenuVisible(true)}>
        <IconMenu size={24} color={WHITE} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.headTitle}>Dashboard Global</Text>
        <Text style={s.headSub}>Administración</Text>
      </View>
    </>
  ) : (
    <>
      <TouchableOpacity style={s.menuBtn} onPress={() => setMenuVisible(true)}>
        <IconMenu size={24} color={WHITE} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.headTitle}>{cfg.title}</Text>
        <Text style={s.headSub}>{cfg.subtitle}</Text>
      </View>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>{headerContent}</View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={VINOTINTO} />
          <Text style={{ color: GRAY, marginTop: 12 }}>Cargando panel...</Text>
        </View>

      ) : isDashboard ? (
        /* ══════════════ DASHBOARD ══════════════ */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[VINOTINTO]} tintColor={VINOTINTO} />}
        >
          <Text style={s.greeting}>Hola, {user?.nombre || 'Administrador'} 👋</Text>
          <Text style={s.intro}>Este es el estado actual de BookyHome.</Text>

          {!!error && (
            <View style={s.errorBox}>
              <Text style={{ color: '#991B1B', fontSize: 13, flex: 1 }}>{error}</Text>
              <TouchableOpacity onPress={() => load(true)}>
                <Text style={{ color: VINOTINTO, fontWeight: '800', marginLeft: 10, fontSize: 13 }}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Alerta de atención */}
          {(stats.claims > 0 || stats.support > 0 || stats.pendingStores > 0) && (
            <View style={s.alert}>
              <View style={s.alertIconBox}><IconAlertTriangle size={22} color="#D97706" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>Atención requerida del Administrador</Text>
                <Text style={s.alertBody}>
                  {stats.claims > 0        ? `Tienes ${stats.claims} queja(s) o reclamo(s) abierta(s). ` : ''}
                  {stats.support > 0       ? `Hay ${stats.support} ticket(s) de soporte sin resolver. ` : ''}
                  {stats.pendingStores > 0 ? `Hay ${stats.pendingStores} librería(s) pendiente(s) de revisión.` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* KPIs 2×2 */}
          <View style={{ marginHorizontal: -6, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              <KpiCard
                title="Usuarios Totales" value={data.usuarios.length} valueColor={VINOTINTO}
                tagLabel="Ecosistema" tagBg="#FDF2F4" tagColor={VINOTINTO} tagBorder="#F8D2DA"
                iconBg="#FDF2F4" iconColor={VINOTINTO} cardBorder="#F8D2DA" Icon={IconUser}
                onPress={() => setActiveSection('usuarios')}
                details={<>
                  <Chip text={`${stats.buyers} compradores`} bg="#ECFDF5" color="#047857" border="#A7F3D0" />
                  <Chip text={`${stats.sellers} vendedores`} bg="#FFFBEB" color="#B45309" border="#FDE68A" />
                </>}
              />
              <KpiCard
                title="Libros Publicados" value={data.libros.length} valueColor="#581C87"
                tagLabel="Catálogo" tagBg="#F3E8FF" tagColor="#7E22CE" tagBorder="#E9D5FF"
                iconBg="#F3E8FF" iconColor="#7E22CE" cardBorder="#E9D5FF" Icon={IconBook}
                onPress={() => setActiveSection('libros')}
                details={<>
                  <Chip text={`${stats.activeBooks} disponibles`} bg="#FAF5FF" color="#6B21A8" border="#E9D5FF" />
                  <Chip text={`${totalCats} categorías`}          bg="#F3F4F6" color="#4B5563" border="#D1D5DB" />
                </>}
              />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <KpiCard
                title="Librerías & Tiendas" value={data.tiendas.length} valueColor="#064E3B"
                tagLabel={`${stats.activeStores} Activas`} tagBg="#ECFDF5" tagColor="#047857" tagBorder="#A7F3D0"
                iconBg="#ECFDF5" iconColor="#047857" cardBorder="#A7F3D0" Icon={IconStore}
                onPress={() => setActiveSection('tiendas')}
                details={<>
                  <Chip text={`${stats.activeStores} verificadas`} bg="#ECFDF5" color="#047857" border="#A7F3D0" />
                  <Chip
                    text={stats.pendingStores ? `${stats.pendingStores} pendientes` : 'Al día'}
                    bg={stats.pendingStores ? '#FEF3C7' : '#F3F4F6'}
                    color={stats.pendingStores ? '#B45309' : '#4B5563'}
                    border={stats.pendingStores ? '#FDE68A' : '#D1D5DB'}
                  />
                </>}
              />
              <KpiCard
                title="Órdenes Procesadas" value={data.ordenes.length} valueColor="#1E3A8A"
                tagLabel="Transacciones" tagBg="#EFF6FF" tagColor="#1D4ED8" tagBorder="#BFDBFE"
                iconBg="#EFF6FF" iconColor="#1D4ED8" cardBorder="#BFDBFE" Icon={IconPackage}
                onPress={() => setActiveSection('ordenes')}
                details={<>
                  <Chip text={`${stats.ordersToday} creadas hoy`} bg="#EFF6FF" color="#1D4ED8" border="#BFDBFE" />
                  <Chip text={`${stats.completed} entregadas`}    bg="#ECFDF5" color="#047857" border="#A7F3D0" />
                </>}
              />
            </View>
          </View>

          {/* Distribución de la comunidad */}
          <View style={s.panel}>
            <PanelHeader iconNode={<IconUser size={20} color={VINOTINTO} />} title="Distribución de la comunidad" extra={`${data.usuarios.length} miembros en total`} />
            <RoleRow label="Compradores"            count={stats.buyers}  total={data.usuarios.length} dotColor="#10B981" pctBg="#ECFDF5" pctColor="#047857" pctBorder="#A7F3D0" />
            <RoleRow label="Vendedores / Librerías"  count={stats.sellers} total={data.usuarios.length} dotColor="#F59E0B" pctBg="#FFFBEB" pctColor="#B45309" pctBorder="#FDE68A" />
            <RoleRow label="Administradores"         count={stats.admins}  total={data.usuarios.length} dotColor={VINOTINTO} pctBg="#FDF2F4" pctColor={VINOTINTO} pctBorder="#F8D2DA" />
          </View>

          {/* Categorías más populares */}
          <View style={s.panel}>
            <PanelHeader
              iconNode={<IconBook size={20} color={VINOTINTO} />}
              title="Categorías más populares"
              linkText="Explorar catálogo →"
              onLink={() => setActiveSection('libros')}
            />
            {topCats.length ? (
              <View style={s.cats}>
                {topCats.map(([name, cnt]) => (
                  <View key={name} style={s.cat}>
                    <Text style={s.catName} numberOfLines={1}>{name}</Text>
                    <View style={s.catBadge}><Text style={s.catCount}>{cnt}</Text></View>
                  </View>
                ))}
              </View>
            ) : <Text style={s.emptyTxt}>No hay libros categorizados aún.</Text>}

            <View style={s.storeStatus}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ color: CARBON, fontSize: 12, fontWeight: '700', flex: 1 }}>Estado operativo de librerías</Text>
                <Text style={{ color: '#166534', fontSize: 11, fontWeight: '800' }}>{stats.activeStores} de {data.tiendas.length} operando</Text>
              </View>
              <View style={s.legend}>
                <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#16a34a' }]} /><Text style={{ color: '#166534', fontSize: 11, fontWeight: '700' }}>{stats.activeStores} Activas</Text></View>
                <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#ea580c' }]} /><Text style={{ color: '#9a3412', fontSize: 11, fontWeight: '700' }}>{stats.pendingStores} Pendientes</Text></View>
                <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={{ color: '#991b1b', fontSize: 11, fontWeight: '700' }}>{stats.suspStores} Suspendidas</Text></View>
              </View>
            </View>
          </View>

          {/* Últimos usuarios */}
          <View style={s.panel}>
            <PanelHeader
              iconNode={<View style={[s.smallIcon, { backgroundColor: COLORS.usuarios.soft }]}><IconUser size={16} color={VINOTINTO} /></View>}
              title="Últimos usuarios registrados"
              subtitle="Nuevos registros en la plataforma"
              linkText={`Ver todos (${data.usuarios.length}) →`}
              onLink={() => setActiveSection('usuarios')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator persistentScrollbar style={s.tableScroll}>
              <View style={{ width: 500 }}>
                <View style={[s.tableHead, { backgroundColor: VINOTINTO }]}>
                  <Text style={[s.th, { width: 130 }]}>Usuario</Text>
                  <Text style={[s.th, { width: 170 }]}>Correo</Text>
                  <Text style={[s.th, { width: 88 }]}>Rol</Text>
                  <Text style={[s.th, { width: 80, textAlign: 'right' }]}>Estado</Text>
                </View>
                {lastUsers.map((item, i) => {
                  const rc = getRolColors(item.rol);
                  const ini = (item.nombre_usuario || 'U').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                  const bloq = item.estado_usuario === 'Bloqueado';
                  return (
                    <View key={item.id_usuario} style={[s.tableRow, { backgroundColor: i % 2 === 0 ? '#fafafa' : WHITE }]}>
                      <View style={[s.td, { width: 130, flexDirection: 'row', alignItems: 'center', gap: 7 }]}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: rc.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Text style={{ color: rc.color, fontSize: 10, fontWeight: '800' }}>{ini}</Text>
                        </View>
                        <Text style={{ color: CARBON, fontSize: 12, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>{item.nombre_usuario || 'Usuario'}</Text>
                      </View>
                      <View style={[s.td, { width: 170 }]}><Text style={{ color: GRAY, fontSize: 11 }} numberOfLines={1}>{item.correo_usuario || '—'}</Text></View>
                      <View style={[s.td, { width: 88 }]}>
                        <View style={{ backgroundColor: rc.bg, borderColor: rc.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' }}>
                          <Text style={{ color: rc.color, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }} numberOfLines={1}>{item.rol || 'usuario'}</Text>
                        </View>
                      </View>
                      <View style={[s.td, { width: 80, alignItems: 'flex-end' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: bloq ? '#FEF2F2' : '#ECFDF5', borderColor: bloq ? '#FECACA' : '#A7F3D0', borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: bloq ? '#ef4444' : '#16a34a' }} />
                          <Text style={{ color: bloq ? '#991b1b' : '#166534', fontSize: 9, fontWeight: '700' }}>{bloq ? 'Bloqueado' : 'Activo'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {lastUsers.length === 0 && <Text style={s.emptyTxt}>No hay usuarios registrados aún.</Text>}
              </View>
            </ScrollView>
            <Text style={s.scrollHint}>← Desliza para ver más →</Text>
          </View>

          {/* Últimas tiendas */}
          <View style={s.panel}>
            <PanelHeader
              iconNode={<View style={[s.smallIcon, { backgroundColor: COLORS.tiendas.soft }]}><IconStore size={16} color={COLORS.tiendas.main} /></View>}
              title="Últimas tiendas creadas"
              subtitle="Librerías y vendedores asociados"
              linkText={`Gestionar todas (${data.tiendas.length}) →`}
              onLink={() => setActiveSection('tiendas')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator persistentScrollbar style={s.tableScroll}>
              <View style={{ width: 520 }}>
                <View style={[s.tableHead, { backgroundColor: VINOTINTO }]}>
                  <Text style={[s.th, { width: 140 }]}>Librería</Text>
                  <Text style={[s.th, { width: 110 }]}>Teléfono</Text>
                  <Text style={[s.th, { width: 110 }]}>Registro</Text>
                  <Text style={[s.th, { width: 100, textAlign: 'right' }]}>Estado</Text>
                </View>
                {lastStores.map((item, i) => {
                  const sc = getStoreColors(item.estado_tienda);
                  const fecha = item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                  return (
                    <View key={item.id_tienda} style={[s.tableRow, { backgroundColor: i % 2 === 0 ? '#fafafa' : WHITE }]}>
                      <View style={[s.td, { width: 140, flexDirection: 'row', alignItems: 'center', gap: 7 }]}>
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.tiendas.soft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconStore size={15} color={COLORS.tiendas.main} />
                        </View>
                        <Text style={{ color: VINOTINTO, fontSize: 12, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>{item.nombre_tienda || 'Librería'}</Text>
                      </View>
                      <View style={[s.td, { width: 110 }]}><Text style={{ color: GRAY, fontSize: 11 }} numberOfLines={1}>{item.telefono || '—'}</Text></View>
                      <View style={[s.td, { width: 110 }]}><Text style={{ color: GRAY, fontSize: 11 }} numberOfLines={1}>{fecha}</Text></View>
                      <View style={[s.td, { width: 100, alignItems: 'flex-end' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: sc.bg, borderColor: sc.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sc.color }} />
                          <Text style={{ color: sc.color, fontSize: 10, fontWeight: '700' }} numberOfLines={1}>{item.estado_tienda || 'Pendiente'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {lastStores.length === 0 && <Text style={s.emptyTxt}>No hay tiendas registradas aún.</Text>}
              </View>
            </ScrollView>
            <Text style={s.scrollHint}>← Desliza para ver más →</Text>
          </View>

        </ScrollView>

      ) : (
        /* ══════════════ SECCIÓN ══════════════ */
        <FlatList
          data={pageItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={s.sectionContent}
          ListHeaderComponent={SectionListHeader}
          ListFooterComponent={SectionListFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[cfg.color]} tintColor={cfg.color} />
          }
          ListEmptyComponent={
            <Text style={s.emptySection}>
              {busqueda || filtroRol !== 'todos' || filtroCategoria !== 'todas'
                ? 'Sin resultados para los filtros aplicados.'
                : 'No hay registros todavía.'}
            </Text>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Sidebar */}
      <SidebarAdmin
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        user={user}
        activeSection={activeSection}
        onSignOut={signOut}
        onSelectDashboard={() => { setActiveSection('dashboard'); }}
        onSelectSection={(sec) => { setActiveSection(sec); }}
      />

      {/* Modal de confirmación */}
      <ConfirmModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        confirmColor={modal.confirmColor}
        onConfirm={modal.onConfirm}
        onCancel={hideConfirm}
      />

      {/* Modal informativo */}
      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        onClose={hideInfo}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BEIGE },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', backgroundColor: VINOTINTO, paddingHorizontal: 14, paddingVertical: 12 },
  menuBtn:      { padding: 7, marginRight: 2 },
  headTitle:    { color: WHITE, fontSize: 17, fontWeight: '800' },
  headSub:      { color: 'rgba(255,255,255,.72)', fontSize: 11 },

  // Loading
  loadingBox:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Dashboard scroll
  content:      { padding: 14, paddingBottom: 36 },
  greeting:     { color: CARBON, fontSize: 21, fontWeight: '800', marginBottom: 2 },
  intro:        { color: GRAY,   fontSize: 14, marginBottom: 18 },

  // Error / alerta
  errorBox:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 14 },
  alert:        { backgroundColor: '#FFFBEB', borderColor: '#FCD34D', borderWidth: 1.5, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, elevation: 3 },
  alertIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 },
  alertTitle:   { color: '#92400E', fontSize: 14, fontWeight: '800' },
  alertBody:    { color: '#B45309', fontSize: 12, lineHeight: 18, marginTop: 3 },

  // KPI
  kpiCard:      { flex: 1, backgroundColor: WHITE, borderWidth: 1, borderRadius: 16, padding: 14, margin: 6, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20 },
  kpiTop:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  kpiIconBox:   { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  kpiTag:       { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, maxWidth: 88, alignSelf: 'flex-start', flexShrink: 1 },
  kpiTagText:   { fontSize: 9, fontWeight: '800', textAlign: 'center' },
  kpiValue:     { fontSize: 30, fontWeight: '900', lineHeight: 34 },
  kpiTitle:     { color: CARBON, fontSize: 12, fontWeight: '700', marginTop: 3, marginBottom: 10 },
  kpiDivider:   { height: 1, backgroundColor: BEIGE, marginBottom: 8 },
  kpiBadges:    { flexDirection: 'row', flexWrap: 'wrap' },

  // Paneles dashboard
  panel:        { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 18, marginTop: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20 },
  cats:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 },
  cat:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F6F0', borderColor: '#EAE4D9', borderWidth: 1, borderRadius: 12, paddingLeft: 10, paddingRight: 6, paddingVertical: 5 },
  catName:      { color: CARBON, fontSize: 11, fontWeight: '700', marginRight: 6, maxWidth: 120 },
  catBadge:     { backgroundColor: VINOTINTO, borderRadius: 9, paddingHorizontal: 6, paddingVertical: 2 },
  catCount:     { color: WHITE, fontSize: 10, fontWeight: '800' },
  storeStatus:  { backgroundColor: '#FAF8F5', borderColor: BORDER, borderWidth: 1, borderRadius: 12, padding: 13, marginTop: 14 },
  legend:       { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  smallIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tableScroll:  { marginTop: 8, borderRadius: 10, overflow: 'hidden' },
  tableHead:    { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 6 },
  th:           { color: WHITE, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow:     { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: '#F4EDE2' },
  td:           { justifyContent: 'center', paddingRight: 6 },
  scrollHint:   { textAlign: 'center', color: GRAY, fontSize: 10, marginTop: 8, fontWeight: '600', letterSpacing: 0.5 },

  // Sección FlatList
  sectionContent: { padding: 14, paddingBottom: 36 },
  emptySection:   { color: GRAY, textAlign: 'center', marginTop: 40, fontSize: 14 },
  emptyTxt:       { color: GRAY, fontSize: 13, marginTop: 10 },

  // Búsqueda + pills
  searchInput:  { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 11 : 8, fontSize: 13, color: CARBON, marginBottom: 10 },
  pill:         { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER },
  pillActive:   { backgroundColor: VINOTINTO, borderColor: VINOTINTO },
  pillTxt:      { fontSize: 12, fontWeight: '700', color: GRAY },
  pillTxtActive:{ color: WHITE },
  counter:      { color: GRAY, fontSize: 11, marginBottom: 6, marginLeft: 2 },

  // Tarjeta de ítem
  card:         { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardBloqueado:{ borderColor: '#FECACA' },
  cardOculto:   { borderColor: '#E9D5FF', opacity: 0.85 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarTxt:    { fontWeight: '800', fontSize: 14 },
  cardMid:      { flex: 1, marginRight: 8 },
  cardName:     { color: CARBON, fontSize: 14, fontWeight: '800' },
  cardSub:      { color: GRAY,   fontSize: 11, marginTop: 3 },

  // Badges
  badgeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:     { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  // Acordeón libro
  expandBox:    { borderTopWidth: 1, borderTopColor: BEIGE, marginTop: 4, paddingTop: 14 },
  detailRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel:  { color: GRAY, fontSize: 12, fontWeight: '600', flex: 1 },
  detailValue:  { color: CARBON, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  priceBadge:   { backgroundColor: VINOTINTO, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  priceTxt:     { color: WHITE, fontWeight: '800', fontSize: 13 },
  chevronWrap:  { alignSelf: 'center' },
  chevronTxt:   { color: GRAY, fontSize: 10, fontWeight: '800' },

  // Acciones
  actionRow:    { flexDirection: 'row', gap: 8 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  actionHalf:   { flex: 1 },
  actionTxt:    { fontSize: 12, fontWeight: '700' },

  // Paginación
  pagination:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  pageBtn:       { backgroundColor: VINOTINTO, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16 },
  pageBtnOff:    { backgroundColor: '#D1D5DB' },
  pageBtnTxt:    { color: WHITE, fontWeight: '700', fontSize: 13 },
  pageBtnTxtOff: { color: GRAY },
  pageInfo:      { color: CARBON, fontWeight: '700', fontSize: 13 },
});
