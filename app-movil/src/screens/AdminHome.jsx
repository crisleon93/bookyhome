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
import FinanzasAdmin from './FinanzasAdmin';
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
  reportes: { title: 'Sistema de Reportes', subtitle: 'Indicadores globales de BookyHome', Icon: IconPackage, color: '#1E40AF', soft: '#EFF6FF' },
  finanzas: { title: 'BookyPago Finanzas', subtitle: 'Sistema de gestión financiera de BookyHome', Icon: IconPackage, color: VINOTINTO, soft: '#FDF2F4' },
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
const isSuspendedStore = (s) => ['suspendida', 'suspendido', 'inactiva', 'inactivo', 'pausada', 'pausado'].includes((s || '').toLowerCase().trim());
const isVacationStore = (s) => ['vacaciones', 'en vacaciones'].includes((s || '').toLowerCase().trim());
const getRolColors   = (rol) => ROL_COLORS[(rol || '').toLowerCase()] || { bg: '#F3F4F6', color: GRAY, border: '#D1D5DB' };
const getStoreColors = (estado) => {
  const state = (estado || '').toLowerCase().trim();
  if (isActiveStore(state)) return COLORS.active;
  if (isPendingStore(state)) return COLORS.pending;
  if (isSuspendedStore(state)) return COLORS.suspended;
  if (isVacationStore(state)) return { bg: '#FFF7ED', color: '#C2410C', border: '#FDBA74' };
  return { bg: '#F3F4F6', color: GRAY, border: '#D1D5DB' };
};
const fmtPrice       = (p) => `$${Number(p || 0).toLocaleString('es-CO')}`;

const ESTADOS_TIENDA = [
  { value: 'activa',      label: 'Activa',          color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  { value: 'pendiente',   label: 'Pendiente',        color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  { value: 'vacaciones',  label: 'En Vacaciones',    color: '#C2410C', bg: '#FFF7ED', border: '#FDBA74' },
  { value: 'suspendida',  label: 'Suspendida',       color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  { value: 'inactiva',    label: 'Inactiva',         color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA' },
];

const MOTIVOS_SUSPENSION_PREDEFINIDOS = [
  'Incumplimiento de las políticas y términos de servicio de la plataforma.',
  'Publicaciones de libros no autorizadas, fraudulentas o piratería.',
  'Reclamos reiterados de compradores sin respuesta ni solución.',
  'Sospecha de actividad irregular, fraude o suplantación de identidad.',
  'Información de contacto, ubicación o documentos de tienda inválidos.',
];

const MENSAJES_ESTADO_TIENDA = {
  activa:     { icon: '✅', desc: 'La librería quedará activa y visible para los compradores.' },
  pendiente:  { icon: '🕐', desc: 'La librería quedará en revisión y no podrá operar hasta ser aprobada.' },
  vacaciones: { icon: '🏖️', desc: 'La librería entrará en modo vacaciones y sus productos no estarán disponibles temporalmente.' },
  suspendida: { icon: '🚫', desc: 'La librería será suspendida por incumplimiento. No podrá vender ni recibir pedidos en la plataforma.' },
  inactiva:   { icon: '⭕', desc: 'La librería quedará marcada como inactiva.' },
};

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

const categoryTheme = (name) => {
  const text = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (text.includes('ficcion') && !text.includes('cientifica')) return { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: '📖' };
  if (text.includes('fantasia')) return { color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE', icon: '🧙' };
  if (text.includes('terror')) return { color: '#6B21A8', bg: '#FAF5FF', border: '#E9D5FF', icon: '👻' };
  if (text.includes('juvenil')) return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '🎒' };
  if (text.includes('ciencia') || text.includes('cientifica')) return { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0', icon: '🔬' };
  if (text.includes('romance')) return { color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8', icon: '💖' };
  if (text.includes('aventura')) return { color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5', icon: '🗺️' };
  if (text.includes('historia')) return { color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', icon: '🏛️' };
  if (text.includes('tecnologia')) return { color: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC', icon: '💻' };
  if (text.includes('infantil')) return { color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', icon: '🧸' };
  if (text.includes('arte')) return { color: '#9333EA', bg: '#FAF5FF', border: '#F3E8FF', icon: '🎨' };
  if (text.includes('biografia')) return { color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', icon: '👤' };
  if (text.includes('educacion')) return { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', icon: '🎓' };
  if (text.includes('poesia')) return { color: '#BE185D', bg: '#FDF2F8', border: '#FCE7F3', icon: '✍️' };
  if (text.includes('filosofia')) return { color: '#475569', bg: '#F8FAFC', border: '#E2E8F0', icon: '🧠' };
  return { color: VINOTINTO, bg: '#FDF2F4', border: '#F8D2DA', icon: '📚' };
};

function ReportKpi({ title, value, badge, sub, color, bg, border, Icon }) {
  return <View style={[rs.kpi, { borderColor: border }]}>
    <View style={[rs.kpiBar, { backgroundColor: color }]} />
    <View style={rs.kpiHead}><Text style={rs.kpiTitle}>{title}</Text><View style={[rs.kpiIcon, { backgroundColor: bg }]}><Icon size={18} color={color} /></View></View>
    <View style={rs.kpiValueRow}><Text style={rs.kpiValue}>{value}</Text><View style={[rs.kpiBadge, { backgroundColor: bg, borderColor: border }]}><Text style={[rs.kpiBadgeText, { color }]}>{badge}</Text></View></View>
    <Text style={rs.kpiSub}>{sub}</Text>
  </View>;
}

function ReportRow({ icon, label, desc, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return <View style={rs.row}><View style={rs.rowTop}><View style={rs.rowText}><Text style={rs.rowIcon}>{icon}</Text><View style={{ flex: 1 }}><Text style={rs.rowLabel}>{label}</Text><Text style={rs.rowDesc}>{desc}</Text></View></View><Text style={[rs.rowCount, { color }]}>{count} <Text style={rs.rowPct}>({pct}%)</Text></Text></View><View style={rs.track}><View style={[rs.fill, { backgroundColor: color, width: `${pct}%` }]} /></View></View>;
}

function AdminReports({ data, stats }) {
  const totalUsers = data.usuarios.length;
  const roleItems = [
    { key: 'comprador', label: 'Compradores', icon: '🛒', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0', desc: 'Usuarios lectores y clientes' },
    { key: 'vendedor', label: 'Vendedores', icon: '🏪', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', desc: 'Librerías y tiendas asociadas' },
    { key: 'administrador', label: 'Administradores', icon: '🛡️', color: VINOTINTO, bg: '#FDF2F4', border: '#F8D2DA', desc: 'Gestión total de la plataforma' },
  ].map((item) => ({ ...item, count: item.key === 'comprador' ? stats.buyers : item.key === 'vendedor' ? stats.sellers : stats.admins }));
  const categories = Object.entries(stats.categories).sort(([, a], [, b]) => b - a).slice(0, 8);
  const storeItems = [
    { key: 'activa', label: 'Activas / Operativas', icon: '🟢', color: '#047857', desc: 'Visibles en el catálogo y vendiendo' },
    { key: 'vacaciones', label: 'En Vacaciones', icon: '🏖️', color: '#EA580C', desc: 'En pausa temporal programada' },
    { key: 'pendiente', label: 'Pendientes de Revisión', icon: '🕐', color: '#D97706', desc: 'Esperando validación de admin' },
    { key: 'suspendida', label: 'Suspendidas', icon: '🚫', color: '#DC2626', desc: 'Sancionadas por incumplimiento' },
    { key: 'inactiva', label: 'Inactivas', icon: '⭕', color: VINOTINTO, desc: 'Deshabilitadas del sistema' },
  ];
  const orderItems = [
    { key: 'pagada', label: 'Pagadas / Preparación', icon: '💳', color: '#D97706', desc: 'Pago confirmado por BookyPago' },
    { key: 'entregada', label: 'Entregadas con éxito', icon: '✅', color: '#047857', desc: 'Recibidas por el comprador' },
    { key: 'enviada', label: 'En Camino / Enviadas', icon: '🚚', color: '#1E40AF', desc: 'Con número de guía activo' },
    { key: 'procesando', label: 'En Proceso', icon: '⚙️', color: '#7C3AED', desc: 'En alistamiento por la tienda' },
    { key: 'pendiente', label: 'Pendientes de Pago', icon: '⏳', color: '#EA580C', desc: 'Esperando confirmación' },
    { key: 'cancelada', label: 'Canceladas', icon: '❌', color: '#DC2626', desc: 'Canceladas o no concretadas' },
  ];
  const storeCounts = data.tiendas.reduce((acc, store) => {
    const state = (store.estado_tienda || '').toLowerCase().trim();
    const key = isActiveStore(state) ? 'activa' :
                ['vacaciones', 'en vacaciones', 'pausada', 'pausado'].includes(state) ? 'vacaciones' :
                isPendingStore(state) ? 'pendiente' :
                ['suspendida', 'suspendido'].includes(state) ? 'suspendida' : 'inactiva';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const orderCounts = data.ordenes.reduce((acc, order) => {
    const state = (order.estado || '').toLowerCase().trim();
    const key = ['pagado', 'pagada', 'pago confirmado', 'aprobada', 'aprobado'].includes(state) ? 'pagada' :
                ['entregado', 'entregada', 'completada', 'finalizada'].includes(state) ? 'entregada' :
                ['enviado', 'enviada', 'despachado', 'en camino'].includes(state) ? 'enviada' :
                ['procesando', 'en proceso', 'preparando'].includes(state) ? 'procesando' :
                ['cancelado', 'cancelada', 'anulado', 'rechazada'].includes(state) ? 'cancelada' : 'pendiente';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const activeStores = storeCounts.activa || 0;
  const successfulOrders = (orderCounts.entregada || 0) + (orderCounts.pagada || 0) + (orderCounts.enviada || 0);
  const storePct = data.tiendas.length ? Math.round((activeStores / data.tiendas.length) * 100) : 0;
  const orderPct = data.ordenes.length ? Math.round((successfulOrders / data.ordenes.length) * 100) : 0;
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={rs.content} showsVerticalScrollIndicator={false}>
    <View style={rs.kpiGrid}>
      <ReportKpi title="ÓRDENES" value={data.ordenes.length} badge={`${stats.ordersToday} hoy`} sub="Flujo total de compras" color="#1E40AF" bg="#EFF6FF" border="#BFDBFE" Icon={IconPackage} />
      <ReportKpi title="LIBROS ACTIVOS" value={data.libros.length} badge={`${Object.keys(stats.categories).length} géneros`} sub="Catálogo publicado" color="#6D28D9" bg="#F5F3FF" border="#DDD6FE" Icon={IconBook} />
      <ReportKpi title="LIBRERÍAS" value={data.tiendas.length} badge={`${activeStores} activas`} sub={`${storePct}% operativas`} color="#047857" bg="#ECFDF5" border="#A7F3D0" Icon={IconStore} />
      <ReportKpi title="USUARIOS" value={totalUsers} badge={`${stats.sellers} vendedores`} sub={`${stats.buyers} compradores`} color={VINOTINTO} bg="#FDF2F4" border="#F8D2DA" Icon={IconUser} />
    </View>
    <View style={rs.card}><PanelHeader iconNode={<IconUser size={20} color={VINOTINTO} />} title="Usuarios por Rol" subtitle="Composición de la comunidad BookyHome" extra={`${totalUsers} Total`} />
      <View style={rs.miniGrid}>{roleItems.map((item) => <View key={item.key} style={[rs.mini, { backgroundColor: item.bg, borderColor: item.border }]}><Text>{item.icon}</Text><Text style={[rs.miniCount, { color: item.color }]}>{item.count}</Text><Text style={[rs.miniLabel, { color: item.color }]}>{item.label}</Text><Text style={rs.miniPct}>{totalUsers ? Math.round(item.count / totalUsers * 100) : 0}% del total</Text></View>)}</View>
      <View style={rs.composed}>{roleItems.map((item) => <View key={item.key} style={{ height: '100%', backgroundColor: item.color, width: `${totalUsers ? item.count / totalUsers * 100 : 0}%` }} />)}</View>
      {roleItems.map((item) => <ReportRow key={item.key} {...item} total={totalUsers} />)}
    </View>
    <View style={rs.card}><PanelHeader iconNode={<IconBook size={20} color="#6D28D9" />} title="Libros por Categoría" subtitle="Ranking de géneros en el catálogo" extra={`${data.libros.length} Libros`} />
      {categories.length >= 3 && <View style={rs.miniGrid}>{categories.slice(0, 3).map(([name, count], index) => { const theme = categoryTheme(name); return <View key={name} style={[rs.mini, { backgroundColor: theme.bg, borderColor: theme.border }]}><Text style={[rs.miniLabel, { color: theme.color }]}>{['🥇 1º', '🥈 2º', '🥉 3º'][index]}</Text><Text style={[rs.miniCount, { color: theme.color }]}>{count}</Text><Text style={rs.miniLabel} numberOfLines={1}>{theme.icon} {name}</Text><Text style={[rs.miniPct, { color: theme.color }]}>{data.libros.length ? Math.round(count / data.libros.length * 100) : 0}% catálogo</Text></View>; })}</View>}
      {categories.length ? categories.map(([name, count], index) => { const theme = categoryTheme(name); return <ReportRow key={name} icon={`${theme.icon} #${index + 1}`} label={name} desc="Categoría del catálogo" count={count} total={data.libros.length} color={theme.color} />; }) : <Text style={s.emptyTxt}>No hay libros categorizados aún.</Text>}
      <Text style={rs.footer}>✨ Total de {Object.keys(stats.categories).length} categorías en plataforma · {data.libros.length} ejemplares</Text>
    </View>
    <View style={rs.card}><PanelHeader iconNode={<IconStore size={20} color="#047857" />} title="Tiendas por Estado" subtitle="Salud y disponibilidad de librerías" extra={`${data.tiendas.length} Librerías`} />
      <View style={rs.highlight}><Text style={rs.highlightTitle}>✓ TASA DE OPERATIVIDAD</Text><Text style={rs.highlightText}><Text style={{ fontWeight: '800' }}>{activeStores} de {data.tiendas.length}</Text> librerías activas vendiendo</Text><Text style={rs.highlightPct}>{storePct}%</Text></View>
      <View style={rs.composed}>{storeItems.map((item) => <View key={item.key} style={{ height: '100%', backgroundColor: item.color, width: `${data.tiendas.length ? (storeCounts[item.key] || 0) / data.tiendas.length * 100 : 0}%` }} />)}</View>
      {storeItems.map((item) => <ReportRow key={item.key} {...item} count={storeCounts[item.key] || 0} total={data.tiendas.length} />)}
    </View>
    <View style={rs.card}><PanelHeader iconNode={<IconPackage size={20} color="#1E40AF" />} title="Órdenes por Estado" subtitle="Pipeline y ciclo de vida de pedidos" extra={`${data.ordenes.length} Órdenes`} />
      <View style={[rs.highlight, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}><Text style={[rs.highlightTitle, { color: '#475569' }]}>TASA DE EFECTIVIDAD</Text><Text style={[rs.highlightText, { color: '#334155' }]}>{successfulOrders} órdenes procesadas con éxito</Text><Text style={[rs.highlightPct, { color: '#1E40AF' }]}>{orderPct}%</Text></View>
      <View style={rs.composed}>{orderItems.map((item) => <View key={item.key} style={{ height: '100%', backgroundColor: item.color, width: `${data.ordenes.length ? (orderCounts[item.key] || 0) / data.ordenes.length * 100 : 0}%` }} />)}</View>
      {orderItems.map((item) => <ReportRow key={item.key} {...item} count={orderCounts[item.key] || 0} total={data.ordenes.length} />)}
    </View>
  </ScrollView>;
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

  // Flujo equivalente al dashboard web para los estados de una librería.
  const [modalEstadoTienda, setModalEstadoTienda] = useState(null);
  const [motivoSuspension, setMotivoSuspension] = useState('');
  const [errorMotivoSuspension, setErrorMotivoSuspension] = useState('');
  const [guardandoEstadoTienda, setGuardandoEstadoTienda] = useState(false);

  const showConfirm = (opts) => setModal({ visible: true, ...opts });
  const hideConfirm = () => setModal((m) => ({ ...m, visible: false }));
  const showInfo    = (title, message) => setInfoModal({ visible: true, title, message });
  const hideInfo    = () => setInfoModal((m) => ({ ...m, visible: false }));

  // ── Filtros por sección ───────────────────────────────────────────────────
  const [filtroRol,          setFiltroRol]          = useState('todos');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState('todos'); // 'todos' | 'Activo' | 'Bloqueado'
  const [filtroCategoria,    setFiltroCategoria]    = useState('todas');
  const [busqueda,           setBusqueda]           = useState('');
  const [pagina,             setPagina]             = useState(1);

  // ── Modal ficha de usuario ────────────────────────────────────────────────
  const [fichaUsuarioId, setFichaUsuarioId] = useState(null);
  // Derivar el objeto usuario actualizado del array (para reflejar cambios de estado en tiempo real)
  const fichaUsuario = fichaUsuarioId != null
    ? data.usuarios.find((u) => u.id_usuario === fichaUsuarioId) || null
    : null;

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
    setFiltroEstadoUsuario('todos');
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
      suspendedStores: data.tiendas.filter((t) => isSuspendedStore(t.estado_tienda)).length,
      vacationStores: data.tiendas.filter((t) => isVacationStore(t.estado_tienda)).length,
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
    let list = activeSection === 'usuarios' ? data.usuarios.slice() // Sin reverse, orden igual a la web
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
      if (filtroEstadoUsuario !== 'todos') {
        list = list.filter((u) => {
          const estado = (u.estado_usuario || 'Activo').toLowerCase();
          return (
            (filtroEstadoUsuario === 'Activo' && estado === 'activo') ||
            (filtroEstadoUsuario === 'Bloqueado' && estado === 'bloqueado')
          );
        });
      }
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
  }, [activeSection, data, busqueda, filtroRol, filtroEstadoUsuario, filtroCategoria]);

  const totalPages = Math.ceil(sectionItems.length / PER_PAGE) || 1;
  const pageSafe   = Math.min(pagina, totalPages);
  const pageItems  = sectionItems.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

  // ── Acciones — Usuarios ───────────────────────────────────────────────────
  const handleBloqueo = useCallback((u) => {
    const bloqueado = u.estado_usuario !== 'Bloqueado';
    showConfirm({
      title:        bloqueado ? 'Bloquear Acceso a Usuario' : 'Restaurar Acceso a Usuario',
      message:      bloqueado
        ? '⚠️ Al bloquear a este usuario, se cerrará su sesión de inmediato y se le impedirá ingresar a la plataforma, comprar o administrar su tienda hasta que sea reactivado.'
        : '✅ Al restaurar el acceso, el usuario podrá volver a iniciar sesión y utilizar todas las funciones de BookyHome según su rol.',
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
    setMotivoSuspension('');
    setErrorMotivoSuspension('');
    setModalEstadoTienda({ tienda: t, nuevoEstado: null });
  }, []);

  const seleccionarEstadoTienda = useCallback((nuevoEstado) => {
    setModalEstadoTienda((actual) => {
      if (!actual || (actual.tienda.estado_tienda || '').toLowerCase() === nuevoEstado) return null;
      return { ...actual, nuevoEstado };
    });
  }, []);

  const confirmarEstadoTienda = useCallback(async () => {
    if (!modalEstadoTienda?.nuevoEstado) return;
    const { tienda, nuevoEstado } = modalEstadoTienda;
    if (nuevoEstado === 'suspendida' && !motivoSuspension.trim()) {
      setErrorMotivoSuspension('Debes ingresar o seleccionar un motivo para suspender la librería.');
      return;
    }
    setGuardandoEstadoTienda(true);
    try {
      await cambiarEstadoTienda(tienda.id_tienda, nuevoEstado, motivoSuspension.trim());
      setData((prev) => ({
        ...prev,
        tiendas: prev.tiendas.map((x) =>
          x.id_tienda === tienda.id_tienda ? { ...x, estado_tienda: nuevoEstado } : x),
      }));
      const cfg = ESTADOS_TIENDA.find((estado) => estado.value === nuevoEstado);
      showInfo(
        'Estado actualizado',
        nuevoEstado === 'suspendida'
          ? 'Librería suspendida y notificación enviada al chat del vendedor'
          : `Librería actualizada a: ${cfg?.label || nuevoEstado}`
      );
      setModalEstadoTienda(null);
    } catch (e) {
      showInfo('Error', e.response?.data?.detail || 'Error al cambiar el estado');
    } finally {
      setGuardandoEstadoTienda(false);
    }
  }, [modalEstadoTienda, motivoSuspension]);

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
            <Text style={s.cardSub}  numberOfLines={1}>{u.correo_usuario || u.correo || u.email || 'Sin correo'}</Text>
            {!!(u.telefono || u.phone) && (
              <Text style={[s.cardSub, { marginTop: 1 }]} numberOfLines={1}>📞 {u.telefono || u.phone}</Text>
            )}
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
        {/* Acciones: Ver Ficha + Bloquear/Desbloquear */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.actionHalf, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
            onPress={() => setFichaUsuarioId(u.id_usuario)}
            activeOpacity={0.75}
          >
            <IconEye size={13} color={CARBON} />
            <Text style={[s.actionTxt, { color: CARBON }]}>Ficha</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.actionHalf, { backgroundColor: bloqueado ? '#ECFDF5' : '#FEF2F2', borderColor: bloqueado ? '#A7F3D0' : '#FECACA' }]}
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
    const estadoActual = (t.estado_tienda || '').toLowerCase();
    const estadoConfig = ESTADOS_TIENDA.find(e => e.value === estadoActual) || ESTADOS_TIENDA[4];
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
            <View style={[s.badge, { backgroundColor: estadoConfig.bg, borderColor: estadoConfig.border }]}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: estadoConfig.color, marginRight: 4 }} />
              <Text style={[s.badgeTxt, { color: estadoConfig.color }]}>{estadoConfig.label}</Text>
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
              <View style={[s.badge, { backgroundColor: estadoConfig.bg, borderColor: estadoConfig.border }]}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: estadoConfig.color, marginRight: 4 }} />
                <Text style={[s.badgeTxt, { color: estadoConfig.color }]}>{estadoConfig.label}</Text>
              </View>
            </View>

            {/* Acción */}
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: estadoConfig.bg, borderColor: estadoConfig.border }]}
              onPress={() => handleEstadoTienda(t)}
              activeOpacity={0.75}
            >
              <Text style={[s.actionTxt, { color: estadoConfig.color }]}>
                Cambiar Estado
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

  // KPI cards de la sección usuarios (calculadas fuera del useMemo para depender de data)
  const usuariosKpi = useMemo(() => {
    if (activeSection !== 'usuarios') return null;
    const total       = data.usuarios.length;
    const compradores = data.usuarios.filter((u) => (u.rol || '').toLowerCase() === 'comprador').length;
    const vendedores  = data.usuarios.filter((u) => (u.rol || '').toLowerCase() === 'vendedor').length;
    const bloqueados  = data.usuarios.filter((u) => (u.estado_usuario || '').toLowerCase() === 'bloqueado').length;
    const activos     = total - bloqueados;
    const tiendasActivas = data.tiendas.filter((t) => isActiveStore(t.estado_tienda)).length;
    return [
      {
        key: 'total',
        label: 'Total Usuarios',
        value: total,
        badge: `${activos} activos`,
        sub: 'Comunidad registrada',
        Icon: IconUser,
        color: VINOTINTO,
        bg: '#FDF2F4',
        border: '#F8D2DA',
        onPress: () => { setFiltroRol('todos'); setPagina(1); },
      },
      {
        key: 'compradores',
        label: 'Compradores',
        value: compradores,
        badge: total ? `${Math.round((compradores / total) * 100)}% del total` : '0%',
        sub: 'Lectores y clientes',
        Icon: IconPackage,
        color: '#047857',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        onPress: () => { setFiltroRol('comprador'); setPagina(1); },
      },
      {
        key: 'vendedores',
        label: 'Vendedores',
        value: vendedores,
        badge: total ? `${Math.round((vendedores / total) * 100)}% del total` : '0%',
        sub: `${tiendasActivas} tiendas asociadas`,
        Icon: IconStore,
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        onPress: () => { setFiltroRol('vendedor'); setPagina(1); },
      },
      {
        key: 'bloqueados',
        label: 'Bloqueados',
        value: bloqueados,
        badge: bloqueados > 0 ? 'Sancionados' : 'Sin bloqueos',
        sub: bloqueados > 0 ? 'Acceso revocado' : 'Todo operativo',
        Icon: IconLock,
        color: bloqueados > 0 ? '#DC2626' : '#6B7280',
        bg: bloqueados > 0 ? '#FEF2F2' : '#F3F4F6',
        border: bloqueados > 0 ? '#FECACA' : '#E5E7EB',
        onPress: () => { setFiltroRol('todos'); setFiltroEstadoUsuario('Bloqueado'); setPagina(1); },
      },
    ];
  }, [activeSection, data.usuarios, data.tiendas]);

  const SectionListHeader = useMemo(() => (
    <View style={{ marginBottom: 12 }}>

      {/* ── KPI cards sección usuarios: 2 filas de 2 ── */}
      {activeSection === 'usuarios' && usuariosKpi && (
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {usuariosKpi.slice(0, 2).map((k) => (
              <TouchableOpacity
                key={k.key}
                style={[s.kpiCardUsuario, { borderColor: k.border }]}
                activeOpacity={0.8}
                onPress={k.onPress}
              >
                <View style={[s.kpiCardUsuarioBar, { backgroundColor: k.color }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.04, flex: 1 }}>
                    {k.label}
                  </Text>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: k.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <k.Icon width={16} height={16} style={{ color: k.color }} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <Text style={[s.kpiCardUsuarioValue, { color: CARBON }]}>{k.value}</Text>
                  <View style={{ borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: k.bg, borderColor: k.border }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: k.color }}>{k.badge}</Text>
                  </View>
                </View>
                <Text style={[s.kpiCardUsuarioSub, { color: '#9CA3AF' }]}>{k.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {usuariosKpi.slice(2, 4).map((k) => (
              <TouchableOpacity
                key={k.key}
                style={[s.kpiCardUsuario, { borderColor: k.border }]}
                activeOpacity={0.8}
                onPress={k.onPress}
              >
                <View style={[s.kpiCardUsuarioBar, { backgroundColor: k.color }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.04, flex: 1 }}>
                    {k.label}
                  </Text>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: k.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <k.Icon width={16} height={16} style={{ color: k.color }} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <Text style={[s.kpiCardUsuarioValue, { color: CARBON }]}>{k.value}</Text>
                  <View style={{ borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: k.bg, borderColor: k.border }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: k.color }}>{k.badge}</Text>
                  </View>
                </View>
                <Text style={[s.kpiCardUsuarioSub, { color: '#9CA3AF' }]}>{k.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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

      {/* Pills rol (solo usuarios) */}
      {activeSection === 'usuarios' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 7 }}>
          {['todos', 'comprador', 'vendedor', 'admin'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.pill, filtroRol === r && s.pillActive]}
              onPress={() => { setFiltroRol(r); setPagina(1); }}
            >
              <Text style={[s.pillTxt, filtroRol === r && s.pillTxtActive]}>
                {r === 'todos' ? '👥 Todos' : r === 'comprador' ? '🛒 Comprador' : r === 'vendedor' ? '🏪 Vendedor' : '🛡️ Admin'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Pills estado (solo usuarios) */}
      {activeSection === 'usuarios' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 7 }}>
          {['Activo', 'Bloqueado'].map((e) => (
            <TouchableOpacity
              key={e}
              style={[s.pill, filtroEstadoUsuario === e && s.pillActive]}
              onPress={() => { setFiltroEstadoUsuario(e); setPagina(1); }}
            >
              <Text style={[s.pillTxt, filtroEstadoUsuario === e && s.pillTxtActive]}>
                {e === 'Activo' ? '✅ Solo Activos' : '🚫 Solo Bloqueados'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Limpiar filtros (solo usuarios, si hay algo activo) */}
      {activeSection === 'usuarios' && (busqueda || filtroRol !== 'todos' || (filtroEstadoUsuario !== 'todos' && filtroEstadoUsuario)) && (
        <TouchableOpacity
          style={s.clearFiltersBtn}
          onPress={() => { setBusqueda(''); setFiltroRol('todos'); setFiltroEstadoUsuario('todos'); setPagina(1); }}
          activeOpacity={0.8}
        >
          <Text style={s.clearFiltersTxt}>↺ Limpiar filtros</Text>
        </TouchableOpacity>
      )}

      {/* Pills categoría (solo libros) */}
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
        {busqueda || filtroRol !== 'todos' || (filtroEstadoUsuario !== 'todos' && filtroEstadoUsuario) || filtroCategoria !== 'todas' ? ' (filtrado)' : ''}
      </Text>
    </View>
  ), [activeSection, busqueda, filtroRol, filtroEstadoUsuario, filtroCategoria, categorias, sectionItems.length, usuariosKpi]);

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
                <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={{ color: '#991b1b', fontSize: 11, fontWeight: '700' }}>{stats.suspendedStores} Suspendidas/Inactivas</Text></View>
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

      ) : activeSection === 'reportes' ? (
        <AdminReports data={data} stats={stats} />

      ) : activeSection === 'finanzas' ? (
        <FinanzasAdmin />

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

      {/* ── Modal Ficha de Usuario ─────────────────────────────────────────── */}
      {fichaUsuario != null && (() => {
        const u           = fichaUsuario;
        const esBloqueado = (u.estado_usuario || '').toLowerCase() === 'bloqueado';
        const rolKey      = (u.rol || 'comprador').toLowerCase().trim();
        const tiendaVinculada = data.tiendas.find(
          (t) => Number(t.id_usuario) === Number(u.id_usuario)
        );
        const rolEmoji = rolKey.includes('admin') ? '🛡️' : rolKey === 'vendedor' ? '🏪' : '🛒';
        const rolLabel = rolKey.includes('admin') ? 'Administrador' : rolKey === 'vendedor' ? 'Vendedor' : 'Comprador';

        return (
          <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => setFichaUsuarioId(null)}
          >
            {/* fondo oscuro: toca fuera para cerrar */}
            <TouchableOpacity
              style={fm.overlay}
              activeOpacity={1}
              onPress={() => setFichaUsuarioId(null)}
            >
              {/* la tarjeta no propaga el toque al overlay */}
              <View style={fm.card} onStartShouldSetResponder={() => true}>

                {/* ── Header vinotinto ── */}
                <View style={fm.header}>
                  <View style={fm.headerAvatar}>
                    <Text style={fm.headerAvatarTxt}>{initials(u.nombre_usuario)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={fm.headerName} numberOfLines={1}>{u.nombre_usuario || 'Usuario'}</Text>
                    <Text style={fm.headerSub}>Ficha de Usuario · ID #{u.id_usuario}</Text>
                  </View>
                  <TouchableOpacity style={fm.closeBtn} onPress={() => setFichaUsuarioId(null)} activeOpacity={0.8}>
                    <Text style={fm.closeBtnTxt}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Cuerpo scrolleable ── */}
                <ScrollView
                  style={{ flexGrow: 0 }}
                  contentContainerStyle={fm.body}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Grid 2 cols: Rol + Estado */}
                  <View style={fm.grid2}>
                    <View style={fm.infoBox}>
                      <Text style={fm.infoBoxLabel}>ROL DE CUENTA</Text>
                      <Text style={fm.infoBoxValue}>{rolEmoji} {rolLabel}</Text>
                    </View>
                    <View style={fm.infoBox}>
                      <Text style={fm.infoBoxLabel}>ESTADO ACTUAL</Text>
                      <Text style={[fm.infoBoxValue, { color: esBloqueado ? RED : '#047857' }]}>
                        {esBloqueado ? '🔒 Bloqueado' : '🟢 Activo'}
                      </Text>
                    </View>
                  </View>

                  {/* Información de Contacto y Cuenta */}
                  <View style={fm.section}>
                    <Text style={fm.sectionTitle}>INFORMACIÓN DE CONTACTO Y CUENTA</Text>

                    <View style={fm.dataRow}>
                      <Text style={fm.dataLabel}>Correo Electrónico:</Text>
                      <Text style={fm.dataValue} numberOfLines={1}>{u.correo_usuario || '—'}</Text>
                    </View>
                    <View style={fm.dataRow}>
                      <Text style={fm.dataLabel}>Teléfono:</Text>
                      <Text style={fm.dataValue}>{u.telefono || 'No registrado'}</Text>
                    </View>
                    <View style={fm.dataRow}>
                      <Text style={fm.dataLabel}>Fecha de Registro:</Text>
                      <Text style={fm.dataValue}>{u.fecha_registro || 'N/A'}</Text>
                    </View>
                    <View style={[fm.dataRow, { borderBottomWidth: 0 }]}>
                      <Text style={fm.dataLabel}>Verificación Email:</Text>
                      <Text style={[fm.dataValue, { color: u.email_verificado ? '#047857' : '#D97706' }]}>
                        {u.email_verificado ? '✓ Verificado' : '⏳ Pendiente'}
                      </Text>
                    </View>
                  </View>

                  {/* Librería vinculada (solo vendedores) */}
                  {tiendaVinculada && (
                    <View style={fm.tiendaBox}>
                      <Text style={fm.tiendaTitle}>🏪 LIBRERÍA VINCULADA</Text>
                      <View style={fm.tiendaRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={fm.tiendaNombre}>{tiendaVinculada.nombre_tienda}</Text>
                          <Text style={fm.tiendaId}>ID Tienda: #{tiendaVinculada.id_tienda}</Text>
                        </View>
                        <View style={[fm.tiendaEstadoBadge, {
                          backgroundColor: isActiveStore(tiendaVinculada.estado_tienda) ? '#047857' : RED,
                        }]}>
                          <Text style={fm.tiendaEstadoTxt}>
                            {tiendaVinculada.estado_tienda || 'Activa'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* ── Footer: Cerrar + Bloquear ── */}
                <View style={fm.footer}>
                  <TouchableOpacity
                    style={fm.footerBtnSecondary}
                    onPress={() => setFichaUsuarioId(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={fm.footerBtnSecondaryTxt}>Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[fm.footerBtnPrimary, { backgroundColor: esBloqueado ? GREEN : RED }]}
                    onPress={() => {
                      setFichaUsuarioId(null);
                      handleBloqueo(u);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={fm.footerBtnPrimaryTxt}>
                      {esBloqueado ? '🔓 Desbloquear' : '🔒 Bloquear'}
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            </TouchableOpacity>
          </Modal>
        );
      })()}

      {/* Modal de estado de tienda: mismos estados, mensajes y colores de la web */}
      {modalEstadoTienda && (() => {
        const { tienda, nuevoEstado } = modalEstadoTienda;
        const estadoActual = (tienda.estado_tienda || 'pendiente').toLowerCase();
        const cfgEstado = ESTADOS_TIENDA.find((estado) => estado.value === nuevoEstado);
        const esSuspension = nuevoEstado === 'suspendida';
        const info = MENSAJES_ESTADO_TIENDA[nuevoEstado];
        const cerrar = () => {
          if (!guardandoEstadoTienda) setModalEstadoTienda(null);
        };

        return (
          <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={cerrar}>
            <View style={tm.overlay}>
              <View style={tm.card}>
                {!nuevoEstado ? (
                  <>
                    <View style={[tm.header, { backgroundColor: VINOTINTO }]}>
                      <View style={tm.headerIcon}><IconStore size={24} color={WHITE} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={tm.headerEyebrow}>Cambiar estado</Text>
                        <Text style={tm.headerTitle}>Selecciona un estado</Text>
                      </View>
                      <TouchableOpacity style={tm.close} onPress={cerrar}><Text style={tm.closeText}>✕</Text></TouchableOpacity>
                    </View>
                    <View style={tm.body}>
                      <Text style={tm.storeLabel}>LIBRERÍA A MODIFICAR</Text>
                      <Text style={tm.storeName}>{tienda.nombre_tienda || `ID #${tienda.id_tienda}`}</Text>
                      <Text style={tm.storeId}>ID #{tienda.id_tienda} · Estado actual: {ESTADOS_TIENDA.find((e) => e.value === estadoActual)?.label || estadoActual}</Text>
                      <Text style={tm.chooseLabel}>Selecciona el nuevo estado</Text>
                      {ESTADOS_TIENDA.map((estado) => {
                        const actual = estado.value === estadoActual;
                        return (
                          <TouchableOpacity
                            key={estado.value}
                            style={[tm.statusOption, { backgroundColor: estado.bg, borderColor: estado.border }, actual && tm.statusOptionDisabled]}
                            onPress={() => seleccionarEstadoTienda(estado.value)}
                            disabled={actual}
                            activeOpacity={0.75}
                          >
                            <View style={[tm.statusDot, { backgroundColor: estado.color }]} />
                            <Text style={[tm.statusOptionText, { color: estado.color }]}>{estado.label}</Text>
                            <Text style={[tm.statusCurrent, { color: estado.color }]}>{actual ? 'Estado actual' : '›'}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[tm.header, { backgroundColor: esSuspension ? '#B91C1C' : cfgEstado.color }]}>
                      <View style={tm.headerEmoji}><Text style={{ fontSize: 24 }}>{info.icon}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={tm.headerEyebrow}>{esSuspension ? 'Acción Disciplinaria' : 'Cambiar estado'}</Text>
                        <Text style={tm.headerTitle}>{esSuspension ? 'Suspender Librería' : `Marcar como ${cfgEstado.label}`}</Text>
                      </View>
                      <TouchableOpacity style={tm.close} onPress={cerrar} disabled={guardandoEstadoTienda}><Text style={tm.closeText}>✕</Text></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={tm.body} keyboardShouldPersistTaps="handled">
                      <View style={[tm.storeBox, { backgroundColor: cfgEstado.bg, borderColor: cfgEstado.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[tm.storeLabel, { color: cfgEstado.color }]}>LIBRERÍA A MODIFICAR</Text>
                          <Text style={[tm.storeName, { color: cfgEstado.color }]}>{tienda.nombre_tienda || `ID #${tienda.id_tienda}`}</Text>
                        </View>
                        <View style={[tm.idBadge, { backgroundColor: cfgEstado.color }]}><Text style={tm.idBadgeText}>ID #{tienda.id_tienda}</Text></View>
                      </View>
                      <Text style={tm.description}>{info.desc}</Text>

                      {esSuspension && (
                        <View>
                          <View style={tm.notice}>
                            <Text style={tm.noticeText}>💬  <Text style={{ fontWeight: '800' }}>Notificación formal al vendedor:</Text> El motivo ingresado se enviará inmediatamente como mensaje en la sección de Chat del vendedor.</Text>
                          </View>
                          <Text style={tm.reasonLabel}>MOTIVOS FRECUENTES (TOCA PARA SELECCIONAR)</Text>
                          <View style={tm.reasonChips}>
                            {MOTIVOS_SUSPENSION_PREDEFINIDOS.map((motivo) => {
                              const seleccionado = motivoSuspension === motivo;
                              return (
                                <TouchableOpacity key={motivo} style={[tm.reasonChip, seleccionado && tm.reasonChipSelected]} onPress={() => { setMotivoSuspension(motivo); setErrorMotivoSuspension(''); }}>
                                  <Text style={[tm.reasonChipText, seleccionado && tm.reasonChipTextSelected]}>{seleccionado ? '✓ ' : '+ '}{motivo}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          <View style={tm.reasonHeading}><Text style={tm.reasonFieldLabel}>Explicación detallada del motivo *</Text><Text style={[tm.count, motivoSuspension.length > 400 && tm.countWarning]}>{motivoSuspension.length} / 450</Text></View>
                          <TextInput
                            value={motivoSuspension}
                            onChangeText={(texto) => { setMotivoSuspension(texto); if (texto.trim()) setErrorMotivoSuspension(''); }}
                            placeholder="Escribe detalladamente las razones por las cuales se suspende la librería..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            maxLength={450}
                            textAlignVertical="top"
                            style={[tm.reasonInput, errorMotivoSuspension && tm.reasonInputError]}
                          />
                          {!!errorMotivoSuspension && <Text style={tm.reasonError}>⚠️ {errorMotivoSuspension}</Text>}
                        </View>
                      )}
                      <View style={tm.actions}>
                        <TouchableOpacity style={tm.cancelButton} onPress={cerrar} disabled={guardandoEstadoTienda}><Text style={tm.cancelButtonText}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={[tm.confirmButton, { backgroundColor: esSuspension ? '#B91C1C' : cfgEstado.color }, guardandoEstadoTienda && tm.buttonDisabled]} onPress={confirmarEstadoTienda} disabled={guardandoEstadoTienda}>
                          <Text style={tm.confirmButtonText}>{guardandoEstadoTienda ? 'Procesando...' : esSuspension ? '🚫 Suspender y Notificar' : 'Confirmar'}</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </>
                )}
              </View>
            </View>
          </Modal>
        );
      })()}

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

  // KPI cards de usuarios (estilo web)
  kpiCardUsuario: { flex: 1, backgroundColor: WHITE, borderWidth: 1, borderRadius: 16, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20, overflow: 'hidden', position: 'relative', justifyContent: 'space-between' },
  kpiCardUsuarioBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  kpiCardUsuarioValue: { fontSize: 28, fontWeight: '900', color: CARBON, lineHeight: 32 },
  kpiCardUsuarioLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.04 },
  kpiCardUsuarioSub: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

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

// ─── Estilos del modal Ficha de Usuario ──────────────────────────────────────
const fm = StyleSheet.create({
  // Overlay: fondo oscuro semitransparente, centra la tarjeta
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },

  // Tarjeta central (igual al maxWidth 520 de la web)
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', backgroundColor: VINOTINTO, paddingHorizontal: 20, paddingVertical: 18, gap: 12 },
  headerAvatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', flexShrink: 0 },
  headerAvatarTxt: { color: WHITE, fontWeight: '900', fontSize: 18 },
  headerName:      { color: WHITE, fontSize: 15, fontWeight: '800' },
  headerSub:       { color: 'rgba(255,255,255,0.82)', fontSize: 11, marginTop: 2 },
  closeBtn:        { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  closeBtnTxt:     { color: WHITE, fontWeight: '800', fontSize: 14 },

  // Cuerpo
  body: { padding: 20, paddingBottom: 12 },

  // Grid 2 columnas rol/estado
  grid2:        { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoBox:      { flex: 1, backgroundColor: '#FAFAF9', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  infoBoxLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoBoxValue: { fontSize: 14, fontWeight: '800', color: CARBON },

  // Sección de contacto
  section:      { backgroundColor: '#FAFAF9', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, marginBottom: 14 },
  sectionTitle: { fontSize: 9, color: '#6B7280', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  dataRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F0F0EE', paddingVertical: 9 },
  dataLabel:    { fontSize: 13, color: '#6B7280', flex: 1 },
  dataValue:    { fontSize: 13, fontWeight: '700', color: CARBON, textAlign: 'right', flexShrink: 1, maxWidth: '58%' },

  // Tienda vinculada
  tiendaBox:         { backgroundColor: '#ECFDF5', borderWidth: 1.5, borderColor: '#A7F3D0', borderRadius: 14, padding: 14, marginBottom: 8 },
  tiendaTitle:       { fontSize: 9, color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  tiendaRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tiendaNombre:      { color: '#065F46', fontSize: 14, fontWeight: '800' },
  tiendaId:          { color: '#047857', fontSize: 11, marginTop: 2 },
  tiendaEstadoBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tiendaEstadoTxt:   { color: WHITE, fontWeight: '800', fontSize: 11, textTransform: 'capitalize' },

  // Footer
  footer:               { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: BORDER },
  footerBtnSecondary:   { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  footerBtnSecondaryTxt:{ color: '#4B5563', fontWeight: '700', fontSize: 14 },
  footerBtnPrimary:     { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 8 },
  footerBtnPrimaryTxt:  { color: WHITE, fontWeight: '800', fontSize: 14 },
});

const rs = StyleSheet.create({
  content: { padding: 14, paddingBottom: 36 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  kpi: { width: '50%', backgroundColor: WHITE, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10 },
  kpiBar: { position: 'absolute', left: 0, top: 0, right: 0, height: 4 },
  kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, marginBottom: 10 },
  kpiTitle: { color: '#6B7280', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
  kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiValueRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  kpiValue: { color: CARBON, fontSize: 26, fontWeight: '900', lineHeight: 31 },
  kpiBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 82 },
  kpiBadgeText: { fontSize: 9, fontWeight: '800' },
  kpiSub: { color: '#9CA3AF', fontSize: 10, fontWeight: '600', marginTop: 5 },
  card: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 16, marginTop: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 12 },
  miniGrid: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  mini: { flex: 1, borderWidth: 1.5, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 5, alignItems: 'center', minWidth: 0 },
  miniCount: { fontSize: 18, fontWeight: '900', lineHeight: 22, marginTop: 2 },
  miniLabel: { color: CARBON, fontSize: 9, fontWeight: '800', marginTop: 2, textAlign: 'center' },
  miniPct: { color: '#6B7280', fontSize: 8, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  composed: { height: 9, borderRadius: 20, backgroundColor: '#F3F4F6', overflow: 'hidden', flexDirection: 'row', marginBottom: 13 },
  row: { backgroundColor: '#FAFAF9', borderWidth: 1, borderColor: '#F0ECE6', borderRadius: 11, padding: 10, marginBottom: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  rowText: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 6 },
  rowIcon: { fontSize: 15, marginRight: 7 },
  rowLabel: { color: CARBON, fontSize: 12, fontWeight: '800' },
  rowDesc: { color: '#9CA3AF', fontSize: 9, marginTop: 1 },
  rowCount: { fontSize: 14, fontWeight: '900' },
  rowPct: { color: '#6B7280', fontSize: 10, fontWeight: '700' },
  track: { height: 7, backgroundColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 10 },
  highlight: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0', borderRadius: 13, padding: 12, marginBottom: 13, position: 'relative', paddingRight: 68 },
  highlightTitle: { color: '#047857', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  highlightText: { color: '#166534', fontSize: 11, marginTop: 3, lineHeight: 16 },
  highlightPct: { color: '#047857', fontSize: 22, fontWeight: '900', position: 'absolute', right: 12, top: 19 },
  footer: { borderTopWidth: 1, borderTopColor: BORDER, borderStyle: 'dashed', paddingTop: 10, marginTop: 4, color: '#6D28D9', fontSize: 10, fontWeight: '700', textAlign: 'center' },
});

// ─── Estilos del modal de estados de tienda ──────────────────────────────────
const tm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { backgroundColor: WHITE, borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '92%', overflow: 'hidden', elevation: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 18 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerEmoji: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { color: 'rgba(255,255,255,0.82)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '800', marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: WHITE, fontSize: 14, fontWeight: '800' },
  body: { padding: 20 },
  storeLabel: { color: '#6B7280', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  storeName: { color: CARBON, fontSize: 16, fontWeight: '800', marginTop: 4 },
  storeId: { color: GRAY, fontSize: 12, marginTop: 3 },
  chooseLabel: { color: '#374151', fontSize: 12, fontWeight: '800', marginTop: 22, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.35 },
  statusOption: { minHeight: 48, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  statusOptionDisabled: { opacity: 0.68 },
  statusDot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 },
  statusOptionText: { flex: 1, fontSize: 14, fontWeight: '800' },
  statusCurrent: { fontSize: 11, fontWeight: '700' },
  storeBox: { borderWidth: 1.5, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  idBadge: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  idBadgeText: { color: WHITE, fontSize: 11, fontWeight: '800' },
  description: { color: '#4B5563', fontSize: 13, lineHeight: 20, marginTop: 16, marginBottom: 16 },
  notice: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  noticeText: { color: '#92400E', fontSize: 12, lineHeight: 18 },
  reasonLabel: { color: '#374151', fontSize: 10, fontWeight: '800', letterSpacing: 0.35, marginBottom: 8 },
  reasonChips: { gap: 6, marginBottom: 14 },
  reasonChip: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  reasonChipSelected: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' },
  reasonChipText: { color: '#374151', fontSize: 11, lineHeight: 15 },
  reasonChipTextSelected: { color: WHITE, fontWeight: '700' },
  reasonHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  reasonFieldLabel: { color: '#1F2937', fontSize: 12, fontWeight: '800' },
  count: { color: '#9CA3AF', fontSize: 11, fontWeight: '600' },
  countWarning: { color: '#DC2626' },
  reasonInput: { minHeight: 92, borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#FAFAFA', color: CARBON, fontSize: 13, lineHeight: 19, paddingHorizontal: 12, paddingVertical: 10 },
  reasonInputError: { borderColor: '#EF4444' },
  reasonError: { color: '#DC2626', fontSize: 11, fontWeight: '700', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, minHeight: 46, paddingHorizontal: 10 },
  cancelButtonText: { color: '#4B5563', fontSize: 14, fontWeight: '700' },
  confirmButton: { flex: 1.2, alignItems: 'center', justifyContent: 'center', borderRadius: 10, minHeight: 46, paddingHorizontal: 10 },
  confirmButtonText: { color: WHITE, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  buttonDisabled: { opacity: 0.7 },
});
