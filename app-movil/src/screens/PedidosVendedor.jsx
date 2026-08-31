import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Alert, Modal, TextInput, TouchableOpacity, ScrollView,
  RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMisPedidos, actualizarEstadoOrden, registrarGuia, getEmpresasMensajeria } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';

const PRIMARY = '#7A1E3A';
const WHITE = '#FFFFFF';
const BG = '#FAF8F5';
const BORDER = '#E0DBD4';
const TEXT = '#2A2A2A';
const MUTED = '#777';

// ── colores de badge por estado ──────────────────────────────────────────────
const ESTADO_STYLE = {
  pendiente:  { bg: '#FFF3CD', color: '#856404' },
  pagado:     { bg: '#D4EDDA', color: '#155724' },
  enviado:    { bg: '#CCE5FF', color: '#004085' },
  entregada:  { bg: '#E2D9F3', color: '#4A235A' },
  cancelada:  { bg: '#F8D7DA', color: '#721C24' },
};

const estadoLabel = (e) =>
  ({ pendiente: 'Pendiente', pagado: 'Pagado', enviado: 'Enviado',
     entregada: 'Entregado', cancelada: 'Cancelado' }[e] ?? e);

// ── estados que el vendedor puede asignar manualmente ────────────────────────
const ESTADOS_OPCIONES = ['pagado', 'enviado', 'cancelada'];

export default function PedidosVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [pedidos, setPedidos]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [empresas, setEmpresas]         = useState([]);

  // modal de guía
  const [guiaModal, setGuiaModal]       = useState(false);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [empresaId, setEmpresaId]       = useState(null);
  const [numeroGuia, setNumeroGuia]     = useState('');
  const [savingGuia, setSavingGuia]     = useState(false);

  // modal de estado
  const [estadoModal, setEstadoModal]   = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [rPed, rEmp] = await Promise.all([
        getMisPedidos(),
        getEmpresasMensajeria().catch(() => ({ data: [] })),
      ]);
      setPedidos(rPed.data || []);
      setEmpresas(rEmp.data || []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = () => { setRefreshing(true); cargar(true); };

  // ── cambiar estado ────────────────────────────────────────────────────────
  const abrirModalEstado = (pedido) => {
    setPedidoActivo(pedido);
    setEstadoModal(true);
  };

  const confirmarEstado = async (nuevoEstado) => {
    if (!pedidoActivo) return;
    setSavingEstado(true);
    try {
      await actualizarEstadoOrden(pedidoActivo.id_orden, nuevoEstado);
      setPedidos(prev =>
        prev.map(p =>
          p.id_orden === pedidoActivo.id_orden ? { ...p, estado: nuevoEstado } : p
        )
      );
      setEstadoModal(false);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo actualizar el estado.');
    } finally {
      setSavingEstado(false);
    }
  };

  // ── registrar guía ────────────────────────────────────────────────────────
  const abrirModalGuia = (pedido) => {
    setPedidoActivo(pedido);
    setEmpresaId(pedido.envio?.id_empresa ?? null);
    setNumeroGuia(pedido.envio?.numero_guia ?? '');
    setGuiaModal(true);
  };

  const guardarGuia = async () => {
    if (!empresaId) { Alert.alert('Falta', 'Selecciona la empresa de mensajería.'); return; }
    if (!numeroGuia.trim()) { Alert.alert('Falta', 'Ingresa el número de guía.'); return; }
    setSavingGuia(true);
    try {
      const res = await registrarGuia(pedidoActivo.id_orden, {
        id_comprador: pedidoActivo.id_comprador,
        id_empresa: empresaId,
        numero_guia: numeroGuia.trim(),
      });
      // actualizar localmente
      const envioActualizado = res.data?.envio ?? {
        id_empresa: empresaId,
        empresa_mensajeria: empresas.find(e => e.id_empresa === empresaId)?.nombre ?? '',
        numero_guia: numeroGuia.trim(),
        estado_envio: 'Guía registrada',
      };
      setPedidos(prev =>
        prev.map(p =>
          p.id_orden === pedidoActivo.id_orden
            ? { ...p, estado: 'enviado', envio: envioActualizado }
            : p
        )
      );
      setGuiaModal(false);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo registrar la guía.');
    } finally {
      setSavingGuia(false);
    }
  };

  // ── render de cada tarjeta ────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const est = ESTADO_STYLE[item.estado] ?? ESTADO_STYLE.pendiente;
    const tieneGuia = !!item.envio?.numero_guia;
    const puedeGuia = ['pagado', 'enviado'].includes(item.estado);

    return (
      <View style={s.card}>
        {/* barra lateral de color por estado */}
        <View style={[s.cardAccent, { backgroundColor: est.color }]} />

        <View style={s.cardInner}>
          {/* fila superior: ID + fecha */}
          <View style={s.cardHeader}>
            <View style={s.ordenIdRow}>
              <Text style={s.ordenId}>#{item.id_orden}</Text>
              {item.codigo_compra ? (
                <Text style={s.ordenSub}>{item.codigo_compra}</Text>
              ) : null}
            </View>
            <Text style={s.fecha}>
              {item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : '—'}
            </Text>
          </View>

          {/* cliente */}
          <View style={s.clienteBox}>
            <Text style={s.clienteIcon}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.clienteNombre} numberOfLines={1}>{item.cliente || '—'}</Text>
              {item.correo_cliente ? (
                <Text style={s.muted} numberOfLines={1}>{item.correo_cliente}</Text>
              ) : null}
            </View>
          </View>

          {/* productos */}
          <View style={s.productosBox}>
            {(item.items || []).map((it, idx) => (
              <View key={idx} style={s.productoChip}>
                <Text style={s.productoChipText} numberOfLines={1}>
                  📖 {it.titulo}
                </Text>
                <View style={s.cantidadBadge}>
                  <Text style={s.cantidadText}>×{it.cantidad}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* fila estado + total */}
          <View style={s.estadoTotalRow}>
            <TouchableOpacity
              style={[s.badge, { backgroundColor: est.bg }]}
              onPress={() => abrirModalEstado(item)}
              disabled={item.estado === 'entregada' || item.estado === 'cancelada'}
            >
              <Text style={[s.badgeText, { color: est.color }]}>
                {estadoLabel(item.estado)}
                {item.estado !== 'entregada' && item.estado !== 'cancelada' ? ' ▾' : ''}
              </Text>
            </TouchableOpacity>
            <Text style={s.total}>
              ${Number(item.total_tienda ?? 0).toLocaleString('es-CO')} COP
            </Text>
          </View>

          {/* guía */}
          <View style={s.guiaBox}>
            <View style={s.guiaInfo}>
              {tieneGuia ? (
                <>
                  <Text style={s.guiaEmpresa}>🚚 {item.envio.empresa_mensajeria}</Text>
                  <Text style={s.guiaNro}>Guía: {item.envio.numero_guia}</Text>
                </>
              ) : (
                <Text style={s.sinGuia}>Sin guía registrada</Text>
              )}
            </View>
            <View style={s.guiaAcciones}>
              {(item.envio?.url_rastreo || item.envio?.sitio_web) && (
                <TouchableOpacity
                  style={s.rastrearBtn}
                  onPress={() => Linking.openURL(item.envio.url_rastreo || item.envio.sitio_web)}
                  activeOpacity={0.7}
                >
                  <Text style={s.rastrearBtnText}>🔍 Rastrear</Text>
                </TouchableOpacity>
              )}
              {puedeGuia && (
                <TouchableOpacity style={s.guiaBtn} onPress={() => abrirModalGuia(item)}>
                  <Text style={s.guiaBtnText}>
                    {tieneGuia ? '✏️ Editar' : '+ Guía'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={s.menuBtn}>
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.title}>Pedidos recibidos</Text>
          <Text style={s.subtitle}>Gestiona las compras de tus clientes</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : pedidos.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyText}>Aún no tienes pedidos recibidos.</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item, idx) => String(item.id_orden ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
          }
        />
      )}

      {/* ── Modal cambiar estado ── */}
      <Modal visible={estadoModal} transparent animationType="fade" onRequestClose={() => setEstadoModal(false)}>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Cambiar estado</Text>
            <Text style={s.modalSub}>Orden #{pedidoActivo?.id_orden}</Text>
            {ESTADOS_OPCIONES.map(op => (
              <TouchableOpacity
                key={op}
                style={[
                  s.estadoOpcion,
                  pedidoActivo?.estado === op && s.estadoOpcionActiva,
                ]}
                onPress={() => confirmarEstado(op)}
                disabled={savingEstado}
              >
                {savingEstado && pedidoActivo?.estado !== op ? null : (
                  <Text style={[
                    s.estadoOpcionText,
                    pedidoActivo?.estado === op && { color: PRIMARY, fontWeight: '800' },
                  ]}>
                    {estadoLabel(op)}
                    {pedidoActivo?.estado === op ? ' ✓' : ''}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            {savingEstado && <ActivityIndicator color={PRIMARY} style={{ marginTop: 10 }} />}
            <TouchableOpacity style={s.cancelBtn} onPress={() => setEstadoModal(false)} disabled={savingEstado}>
              <Text style={s.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal registrar guía ── */}
      <Modal visible={guiaModal} transparent animationType="slide" onRequestClose={() => setGuiaModal(false)}>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>
              {pedidoActivo?.envio?.numero_guia ? 'Editar Guía' : 'Registrar Guía'}
            </Text>
            <Text style={s.modalSub}>Orden #{pedidoActivo?.id_orden}</Text>

            {/* selector de empresa */}
            <Text style={s.inputLabel}>Empresa de mensajería</Text>
            <ScrollView style={s.empresaList} nestedScrollEnabled>
              {empresas.map(emp => (
                <TouchableOpacity
                  key={emp.id_empresa}
                  style={[s.empresaOp, empresaId === emp.id_empresa && s.empresaOpActiva]}
                  onPress={() => setEmpresaId(emp.id_empresa)}
                >
                  <Text style={[s.empresaOpText, empresaId === emp.id_empresa && { color: PRIMARY, fontWeight: '700' }]}>
                    {emp.nombre}{empresaId === emp.id_empresa ? ' ✓' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* número de guía */}
            <Text style={s.inputLabel}>Número de guía</Text>
            <TextInput
              style={s.input}
              value={numeroGuia}
              onChangeText={setNumeroGuia}
              placeholder="Ej: SRV-123456789"
              placeholderTextColor="#bbb"
              autoCapitalize="characters"
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setGuiaModal(false)} disabled={savingGuia}>
                <Text style={s.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={guardarGuia} disabled={savingGuia}>
                {savingGuia
                  ? <ActivityIndicator color={WHITE} size="small" />
                  : <Text style={s.saveBtnText}>Guardar</Text>
                }
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

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: BG },
  header:         { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, padding: 16, paddingTop: 12, gap: 12 },
  menuBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:       { color: WHITE, fontSize: 20, fontWeight: '700' },
  title:          { fontSize: 18, fontWeight: '800', color: WHITE },
  subtitle:       { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { color: MUTED, fontSize: 14, textAlign: 'center' },

  // tarjeta
  card:           { backgroundColor: WHITE, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, flexDirection: 'row', overflow: 'hidden' },
  cardAccent:     { width: 5, borderRadius: 0 },
  cardInner:      { flex: 1, padding: 14 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  ordenIdRow:     { gap: 2 },
  ordenId:        { fontSize: 17, fontWeight: '800', color: PRIMARY },
  ordenSub:       { fontSize: 11, color: MUTED },
  fecha:          { fontSize: 12, color: MUTED, fontWeight: '600', backgroundColor: '#F4F0EC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  // cliente
  clienteBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FAFAF8', borderRadius: 10, padding: 10, marginBottom: 10 },
  clienteIcon:    { fontSize: 16, marginTop: 1 },
  clienteNombre:  { fontSize: 13, fontWeight: '700', color: TEXT },

  // productos
  productosBox:   { gap: 5, marginBottom: 12 },
  productoChip:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4F0EC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  productoChipText: { fontSize: 13, color: TEXT, fontWeight: '600', flex: 1 },
  cantidadBadge:  { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  cantidadText:   { color: WHITE, fontSize: 11, fontWeight: '800' },

  // estado + total
  estadoTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText:      { fontSize: 12, fontWeight: '700' },
  total:          { fontSize: 16, fontWeight: '800', color: PRIMARY },

  // guía
  guiaBox:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderColor: BORDER, gap: 8 },
  guiaInfo:       { flex: 1 },
  guiaEmpresa:    { fontSize: 13, fontWeight: '700', color: TEXT },
  guiaNro:        { fontSize: 11, color: MUTED, marginTop: 2 },
  sinGuia:        { fontSize: 12, color: '#BBBBBB', fontStyle: 'italic' },
  guiaAcciones:   { flexDirection: 'row', gap: 6, alignItems: 'center' },
  rastrearBtn:    { backgroundColor: '#EAF3FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#93C5FD' },
  rastrearBtnText:{ fontSize: 12, color: '#1E40AF', fontWeight: '700' },
  guiaBtn:        { backgroundColor: '#F8E7EC', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#EAC8D2' },
  guiaBtnText:    { fontSize: 12, color: PRIMARY, fontWeight: '700' },

  muted:          { fontSize: 11, color: MUTED },

  // modales
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalBox:       { backgroundColor: WHITE, borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 4 },
  modalSub:       { fontSize: 13, color: MUTED, marginBottom: 14 },
  estadoOpcion:   { paddingVertical: 13, paddingHorizontal: 14, borderRadius: 10, backgroundColor: BG, marginBottom: 8 },
  estadoOpcionActiva: { borderWidth: 1.5, borderColor: PRIMARY, backgroundColor: '#FDF0F3' },
  estadoOpcionText: { fontSize: 15, color: TEXT },
  cancelBtn:      { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText:  { color: MUTED, fontWeight: '700', fontSize: 14 },
  saveBtn:        { flex: 1, backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText:    { color: WHITE, fontWeight: '700', fontSize: 14 },
  modalActions:   { flexDirection: 'row', gap: 10, marginTop: 16 },
  inputLabel:     { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 6, marginTop: 10 },
  input:          { borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: TEXT, backgroundColor: BG },
  empresaList:    { maxHeight: 160, borderWidth: 1, borderColor: BORDER, borderRadius: 10, marginBottom: 4 },
  empresaOp:      { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: BORDER },
  empresaOpActiva: { backgroundColor: '#FDF0F3' },
  empresaOpText:  { fontSize: 13, color: TEXT },
});
