import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import CalendarioPicker from '../components/CalendarioPicker';
import {
  getCuponesVendedor,
  crearCupon,
  actualizarCupon,
  eliminarCupon,
} from '../services/api';
import {
  IconTag,
  IconPlus,
  IconEdit,
  IconTrash,
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
} from '../components/Icons';

// ── Paleta ───────────────────────────────────────────────────────────────────
const PRIMARY  = '#7A1E3A';
const PRIMARY_L = '#C5425A';
const BG       = '#FAF8F5';
const WHITE    = '#FFFFFF';
const TEXT     = '#1f2937';
const MUTED    = '#6b7280';
const BORDER   = '#e5e7eb';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPrecio = (v) =>
  '$' + String(parseInt(v || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' COP';

const formatFecha = (f) => {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// Estado del cupón calculado desde fechas y activo
const calcEstado = (c) => {
  if (!c.activo) return 'inactivo';
  const ahora = new Date();
  const ini   = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
  const fin   = c.fecha_fin    ? new Date(c.fecha_fin)    : null;
  if (fin  && ahora > fin)  return 'vencido';
  if (ini  && ahora < ini)  return 'proximo';
  return 'activo';
};

const ESTADO_CFG = {
  activo:   { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', label: 'Activo'   },
  proximo:  { color: '#1e40af', bg: '#dbeafe', border: '#93c5fd', label: 'Próximo'  },
  vencido:  { color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', label: 'Vencido'  },
  inactivo: { color: '#92400e', bg: '#fef3c7', border: '#fcd34d', label: 'Inactivo' },
};

// ── Componente Badge ──────────────────────────────────────────────────────────
function BadgeEstado({ cupon }) {
  const estado = calcEstado(cupon);
  const cfg    = ESTADO_CFG[estado];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ── Tarjeta de cupón ──────────────────────────────────────────────────────────
function TarjetaCupon({ cupon, onEditar, onEliminar }) {
  const estado   = calcEstado(cupon);
  const esActivo = estado === 'activo';
  const usosMax  = cupon.usos_maximos ?? '∞';
  const usosPct  = cupon.usos_maximos
    ? Math.round((cupon.usos_actuales / cupon.usos_maximos) * 100)
    : 0;

  return (
    <View style={[styles.card, !esActivo && { opacity: 0.75 }]}>
      {/* Fila superior: código + badge */}
      <View style={styles.cardTop}>
        <View style={styles.codigoBox}>
          <Text style={styles.codigoText}>{cupon.codigo_cupon}</Text>
        </View>
        <BadgeEstado cupon={cupon} />
      </View>

      {/* Descuento + mínimo */}
      <View style={styles.cardMid}>
        <View style={styles.descuentoChip}>
          <Text style={styles.descuentoChipText}>
            {cupon.tipo_descuento === 'porcentaje'
              ? `${cupon.valor_descuento}% dto.`
              : `${formatPrecio(cupon.valor_descuento)} dto.`}
          </Text>
        </View>
        {cupon.minimo_compra > 0 && (
          <Text style={styles.minimoText}>
            Mín. {formatPrecio(cupon.minimo_compra)}
          </Text>
        )}
      </View>

      {/* Barra de usos */}
      <View style={styles.usosRow}>
        <Text style={styles.usosLabel}>
          Usos: {cupon.usos_actuales} / {usosMax}
        </Text>
        {cupon.usos_maximos != null && (
          <View style={styles.usosBarBg}>
            <View style={[styles.usosBarFill, {
              width: `${Math.min(usosPct, 100)}%`,
              backgroundColor: usosPct >= 90 ? '#ef4444' : PRIMARY,
            }]} />
          </View>
        )}
      </View>

      {/* Fechas */}
      {(cupon.fecha_inicio || cupon.fecha_fin) && (
        <View style={styles.fechasRow}>
          <IconCalendar size={12} color={MUTED} />
          <Text style={styles.fechasText}>
            {formatFecha(cupon.fecha_inicio)} → {formatFecha(cupon.fecha_fin)}
          </Text>
        </View>
      )}

      {/* Acciones */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.btnAccion, { backgroundColor: '#dbeafe', borderColor: '#93c5fd' }]}
          onPress={() => onEditar(cupon)}
          activeOpacity={0.7}
        >
          <IconEdit size={14} color="#1e40af" />
          <Text style={[styles.btnAccionText, { color: '#1e40af' }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnAccion, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
          onPress={() => onEliminar(cupon)}
          activeOpacity={0.7}
        >
          <IconTrash size={14} color="#dc2626" />
          <Text style={[styles.btnAccionText, { color: '#dc2626' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Formulario crear / editar ─────────────────────────────────────────────────
const FORM_VACIO = {
  codigo_cupon:    '',
  tipo_descuento:  'porcentaje',
  valor_descuento: '',
  minimo_compra:   '',
  usos_maximos:    '1',
  fecha_inicio:    '',
  fecha_fin:       '',
  activo:          true,
};

function FormCupon({ cuponEditar, onGuardado, onCancelar }) {
  const esEdicion = !!cuponEditar;

  const [form, setForm] = useState(() =>
    esEdicion
      ? {
          codigo_cupon:    cuponEditar.codigo_cupon    || '',
          tipo_descuento:  cuponEditar.tipo_descuento  || 'porcentaje',
          valor_descuento: cuponEditar.valor_descuento != null ? String(cuponEditar.valor_descuento) : '',
          minimo_compra:   cuponEditar.minimo_compra   != null ? String(cuponEditar.minimo_compra)   : '',
          usos_maximos:    cuponEditar.usos_maximos    != null ? String(cuponEditar.usos_maximos)    : '1',
          fecha_inicio:    cuponEditar.fecha_inicio    ? String(cuponEditar.fecha_inicio).slice(0, 16) : '',
          fecha_fin:       cuponEditar.fecha_fin       ? String(cuponEditar.fecha_fin).slice(0, 16)    : '',
          activo:          cuponEditar.activo ?? true,
        }
      : FORM_VACIO,
  );

  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    // Validaciones
    if (!form.codigo_cupon.trim())
      return setError('El código del cupón es obligatorio');
    if (!/^[A-Z0-9_-]{3,20}$/i.test(form.codigo_cupon.trim()))
      return setError('El código solo puede tener letras, números, guiones y guion bajo (3-20 caracteres)');
    if (!form.valor_descuento || Number(form.valor_descuento) <= 0)
      return setError('El valor del descuento debe ser mayor a 0');
    if (form.tipo_descuento === 'porcentaje' && Number(form.valor_descuento) > 100)
      return setError('El porcentaje no puede superar 100');
    if (form.fecha_inicio && form.fecha_fin && form.fecha_inicio >= form.fecha_fin)
      return setError('La fecha de inicio debe ser anterior a la de fin');

    setCargando(true);
    setError('');

    const payload = {
      codigo_cupon:    form.codigo_cupon.trim().toUpperCase(),
      tipo_descuento:  form.tipo_descuento,
      valor_descuento: Number(form.valor_descuento),
      minimo_compra:   form.minimo_compra ? Number(form.minimo_compra) : 0,
      usos_maximos:    form.usos_maximos  ? Number(form.usos_maximos)  : 1,
      fecha_inicio:    form.fecha_inicio
        ? form.fecha_inicio.replace('T', ' ') + ':00'
        : null,
      fecha_fin:       form.fecha_fin
        ? form.fecha_fin.replace('T', ' ') + ':00'
        : null,
      activo:          form.activo,
    };

    try {
      if (esEdicion) {
        await actualizarCupon(cuponEditar.id_cupon, payload);
      } else {
        await crearCupon(payload);
      }
      onGuardado();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail)
        ? detail.map((e) => e.msg).join(', ')
        : detail || 'Error al guardar el cupón');
    } finally {
      setCargando(false);
    }
  };

  const TIPOS = [
    { tipo: 'porcentaje', icon: '%',  label: 'Porcentaje', desc: 'Descuento sobre el total (%)', color: '#10b981', bg: '#d1fae5' },
    { tipo: 'fijo',       icon: '$',  label: 'Monto fijo', desc: 'Descuento en COP',              color: '#3b82f6', bg: '#dbeafe' },
  ];

  return (
    <View style={styles.formBox}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{esEdicion ? 'Editar cupón' : 'Nuevo cupón'}</Text>
      </View>

      {/* Código */}
      <Text style={styles.label}>Código del cupón *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: VERANO25"
        placeholderTextColor={MUTED}
        value={form.codigo_cupon}
        onChangeText={(v) => set('codigo_cupon', v.toUpperCase())}
        autoCapitalize="characters"
        maxLength={20}
      />
      <Text style={styles.inputHint}>Solo letras, números y guiones. Se guardará en mayúsculas.</Text>

      {/* Tipo de descuento */}
      <Text style={[styles.label, { marginTop: 16 }]}>Tipo de descuento *</Text>
      <View style={styles.tiposRow}>
        {TIPOS.map((opc) => {
          const sel = form.tipo_descuento === opc.tipo;
          return (
            <TouchableOpacity
              key={opc.tipo}
              style={[styles.tipoCard, sel && { borderColor: PRIMARY, backgroundColor: PRIMARY + '08' }]}
              onPress={() => set('tipo_descuento', opc.tipo)}
              activeOpacity={0.7}
            >
              <View style={[styles.tipoIcon, { backgroundColor: opc.bg }]}>
                <Text style={{ fontSize: 16 }}>{opc.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.tipoLabel, sel && { color: PRIMARY }]}>{opc.label}</Text>
                <Text style={styles.tipoDesc}>{opc.desc}</Text>
              </View>
              {sel && (
                <View style={styles.tipoCheck}>
                  <Text style={styles.tipoCheckMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Valor */}
      <Text style={[styles.label, { marginTop: 16 }]}>
        {form.tipo_descuento === 'porcentaje' ? 'Porcentaje de descuento (%) *' : 'Monto de descuento (COP) *'}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={form.tipo_descuento === 'porcentaje' ? 'Ej: 15' : 'Ej: 20000'}
          placeholderTextColor={MUTED}
          keyboardType="numeric"
          value={form.valor_descuento}
          onChangeText={(v) => set('valor_descuento', v)}
        />
        <View style={styles.inputSuffix}>
          <Text style={styles.inputSuffixText}>
            {form.tipo_descuento === 'porcentaje' ? '%' : 'COP'}
          </Text>
        </View>
      </View>

      {/* Compra mínima */}
      <Text style={[styles.label, { marginTop: 16 }]}>Compra mínima (COP)</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="0 = sin mínimo"
          placeholderTextColor={MUTED}
          keyboardType="numeric"
          value={form.minimo_compra}
          onChangeText={(v) => set('minimo_compra', v)}
        />
        <View style={styles.inputSuffix}>
          <Text style={styles.inputSuffixText}>COP</Text>
        </View>
      </View>

      {/* Usos máximos */}
      <Text style={[styles.label, { marginTop: 16 }]}>Usos máximos</Text>
      <TextInput
        style={styles.input}
        placeholder="1"
        placeholderTextColor={MUTED}
        keyboardType="numeric"
        value={form.usos_maximos}
        onChangeText={(v) => set('usos_maximos', v)}
      />
      <Text style={styles.inputHint}>Cuántas veces en total puede canjearse este cupón.</Text>

      {/* Vigencia */}
      <View style={[styles.fechasBox, { marginTop: 16 }]}>
        <View style={styles.fechasHeader}>
          <IconCalendar size={15} color={PRIMARY} />
          <Text style={styles.fechasTitle}>Vigencia (opcional)</Text>
        </View>
        <CalendarioPicker
          label="Fecha y hora de inicio"
          value={form.fecha_inicio}
          onChange={(v) => set('fecha_inicio', v)}
          placeholder="Seleccionar inicio…"
        />
        <View style={{ marginTop: 14 }}>
          <CalendarioPicker
            label="Fecha y hora de fin"
            value={form.fecha_fin}
            onChange={(v) => set('fecha_fin', v)}
            minDate={form.fecha_inicio || undefined}
            placeholder="Seleccionar fin…"
          />
        </View>
      </View>

      {/* Activo / Inactivo */}
      {esEdicion && (
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Cupón activo</Text>
            <Text style={styles.switchDesc}>Desactívalo para pausarlo sin eliminarlo</Text>
          </View>
          <Switch
            value={form.activo}
            onValueChange={(v) => set('activo', v)}
            trackColor={{ false: BORDER, true: PRIMARY_L }}
            thumbColor={form.activo ? PRIMARY : '#f4f3f4'}
          />
        </View>
      )}

      {/* Error */}
      {!!error && (
        <View style={styles.errorBox}>
          <IconAlertTriangle size={15} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Botones */}
      <View style={styles.formBtns}>
        <TouchableOpacity style={styles.btnCancelar} onPress={onCancelar} activeOpacity={0.7}>
          <Text style={styles.btnCancelarText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnGuardar, cargando && { opacity: 0.6 }]}
          onPress={guardar}
          disabled={cargando}
          activeOpacity={0.8}
        >
          {cargando
            ? <ActivityIndicator size="small" color={WHITE} />
            : <Text style={styles.btnGuardarText}>{esEdicion ? 'Actualizar' : 'Crear cupón'}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function CuponesVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [cupones,    setCupones]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  // Formulario
  const [mostrarForm,  setMostrarForm]  = useState(false);
  const [cuponEditar,  setCuponEditar]  = useState(null);

  // Modal eliminar
  const [cuponEliminar, setCuponEliminar] = useState(null);
  const [eliminando,    setEliminando]    = useState(false);

  // ── Carga ─────────────────────────────────────────────────────────────────
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const idTienda = user?.id_tienda;
      if (!idTienda) throw new Error('Sin tienda asociada');
      const res = await getCuponesVendedor(idTienda);
      setCupones(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('No se pudieron cargar los cupones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onRefresh = () => { setRefreshing(true); cargar(true); };

  const cerrarForm = () => { setMostrarForm(false); setCuponEditar(null); };
  const onGuardado = () => { cerrarForm(); cargar(true); };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const confirmarEliminar = async () => {
    if (!cuponEliminar) return;
    setEliminando(true);
    try {
      await eliminarCupon(cuponEliminar.id_cupon);
      setCuponEliminar(null);
      cargar(true);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al eliminar';
      Alert.alert('Error', detail);
    } finally {
      setEliminando(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activos  = cupones.filter((c) => calcEstado(c) === 'activo');
  const proximos = cupones.filter((c) => calcEstado(c) === 'proximo');
  const vencidos = cupones.filter((c) => calcEstado(c) === 'vencido' || calcEstado(c) === 'inactivo');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SidebarVendedor
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <IconTag size={20} color={WHITE} />
          </View>
          <Text style={styles.headerTitle}>Cupones</Text>
        </View>
        {!mostrarForm && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setCuponEditar(null); setMostrarForm(true); }}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
        {mostrarForm && <View style={{ width: 70 }} />}
      </View>

      {/* Stats bar */}
      {!mostrarForm && !loading && cupones.length > 0 && (
        <View style={styles.statsBar}>
          {[
            { label: 'Activos',   value: activos.length,  color: '#10b981', bg: '#d1fae5' },
            { label: 'Próximos',  value: proximos.length, color: '#3b82f6', bg: '#dbeafe' },
            { label: 'Inactivos', value: vencidos.length, color: '#6b7280', bg: '#f3f4f6' },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Cuerpo */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Cargando cupones…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <IconAlertTriangle size={36} color={PRIMARY} />
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => cargar()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : mostrarForm ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormCupon
              cuponEditar={cuponEditar}
              onGuardado={onGuardado}
              onCancelar={cerrarForm}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        >
          {cupones.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <IconTag size={32} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>Sin cupones todavía</Text>
              <Text style={styles.emptyDesc}>
                Crea tu primer cupón de descuento para atraer más compradores
              </Text>
              <TouchableOpacity
                style={styles.btnGuardar}
                onPress={() => { setCuponEditar(null); setMostrarForm(true); }}
                activeOpacity={0.8}
              >
                <Text style={styles.btnGuardarText}>+ Crear primer cupón</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cupones.map((c) => (
              <TarjetaCupon
                key={c.id_cupon}
                cupon={c}
                onEditar={(cupon) => { setCuponEditar(cupon); setMostrarForm(true); }}
                onEliminar={setCuponEliminar}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Modal confirmar eliminación */}
      <Modal
        visible={!!cuponEliminar}
        transparent
        animationType="fade"
        onRequestClose={() => setCuponEliminar(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBox}>
              <IconTrash size={28} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Eliminar cupón</Text>
            <Text style={styles.modalMsg}>
              ¿Estás seguro de que quieres eliminar el cupón{' '}
              <Text style={{ fontWeight: '800' }}>"{cuponEliminar?.codigo_cupon}"</Text>?
              {'\n\n'}
              Si ya fue usado por compradores, solo se desactivará para preservar el historial.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => setCuponEliminar(null)}
                disabled={eliminando}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnEliminar, eliminando && { opacity: 0.6 }]}
                onPress={confirmarEliminar}
                disabled={eliminando}
                activeOpacity={0.8}
              >
                {eliminando
                  ? <ActivityIndicator size="small" color={WHITE} />
                  : <Text style={styles.modalBtnEliminarText}>Sí, eliminar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  menuBtn:      { padding: 6, marginRight: 8 },
  menuIcon:     { gap: 4 },
  menuLine:     { width: 22, height: 2, borderRadius: 1, backgroundColor: TEXT },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: TEXT },
  addBtn: {
    backgroundColor: PRIMARY, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: WHITE, fontWeight: '800', fontSize: 13 },

  // Stats bar
  statsBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  statItem:  { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 8 },
  statValue: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },

  // Estados vacío / carga
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText:  { marginTop: 12, color: MUTED, fontSize: 14 },
  errorMsg:     { marginTop: 12, color: TEXT, fontSize: 15, textAlign: 'center' },
  retryBtn:     { marginTop: 16, backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:    { color: WHITE, fontWeight: '800' },
  emptyBox:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: PRIMARY + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle:   { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 8 },
  emptyDesc:    { fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 24 },

  // Lista
  listScroll: { padding: 16, paddingBottom: 40 },

  // Tarjeta de cupón
  card: {
    backgroundColor: WHITE, borderRadius: 14,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  cardTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  codigoBox: {
    backgroundColor: PRIMARY + '10', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  codigoText:   { fontSize: 16, fontWeight: '900', color: PRIMARY, letterSpacing: 1 },
  badge:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  cardMid:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  descuentoChip:{ backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  descuentoChipText: { color: WHITE, fontSize: 12, fontWeight: '800' },
  minimoText:   { fontSize: 12, color: MUTED, fontWeight: '600' },

  // Barra de usos
  usosRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  usosLabel:  { fontSize: 12, color: MUTED, minWidth: 90 },
  usosBarBg:  { flex: 1, height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden' },
  usosBarFill:{ height: 6, borderRadius: 3 },

  fechasRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  fechasText: { fontSize: 12, color: MUTED },

  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnAccion: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
  },
  btnAccionText: { fontSize: 13, fontWeight: '700' },

  // Formulario
  formScroll: { padding: 16, paddingBottom: 60 },
  formBox: {
    backgroundColor: WHITE, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: BORDER,
  },
  formHeader:  { marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  formTitle:   { fontSize: 17, fontWeight: '900', color: TEXT },

  label: {
    fontSize: 12, fontWeight: '700', color: '#374151',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7,
  },
  input: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    padding: 12, fontSize: 15, color: TEXT, backgroundColor: '#fafafa',
  },
  inputHint: { fontSize: 11, color: MUTED, marginTop: 5, fontStyle: 'italic' },

  inputRow:       { flexDirection: 'row', alignItems: 'stretch' },
  inputSuffix: {
    backgroundColor: '#f3f4f6', borderWidth: 1.5, borderLeftWidth: 0,
    borderColor: BORDER, borderTopRightRadius: 10, borderBottomRightRadius: 10,
    paddingHorizontal: 12, justifyContent: 'center',
  },
  inputSuffixText: { fontWeight: '800', color: PRIMARY, fontSize: 13 },

  tiposRow:   { gap: 8 },
  tipoCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    padding: 12, backgroundColor: WHITE,
  },
  tipoIcon:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipoLabel:     { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  tipoDesc:      { fontSize: 12, color: MUTED },
  tipoCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  tipoCheckMark: { color: WHITE, fontSize: 11, fontWeight: '900' },

  fechasBox: {
    backgroundColor: '#fafafa', borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER, padding: 14,
  },
  fechasHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  fechasTitle:  { fontSize: 14, fontWeight: '800', color: TEXT },

  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fafafa', borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER,
    padding: 14, marginTop: 16, gap: 12,
  },
  switchLabel: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  switchDesc:  { fontSize: 12, color: MUTED },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fee2e2', borderRadius: 10,
    padding: 12, marginTop: 14,
  },
  errorText: { flex: 1, color: '#dc2626', fontSize: 13, fontWeight: '600' },

  formBtns:       { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCancelar: {
    flex: 1, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelarText: { fontSize: 15, fontWeight: '700', color: MUTED },
  btnGuardar: {
    flex: 1, backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  btnGuardarText: { color: WHITE, fontWeight: '800', fontSize: 15 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalBox: {
    backgroundColor: WHITE, borderRadius: 20,
    padding: 24, width: '100%', maxWidth: 360, alignItems: 'center',
  },
  modalIconBox: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  modalTitle:   { fontSize: 18, fontWeight: '900', color: TEXT, marginBottom: 10 },
  modalMsg:     { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalBtns:    { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnCancelar: {
    flex: 1, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnCancelarText: { fontSize: 14, fontWeight: '700', color: MUTED },
  modalBtnEliminar: {
    flex: 1, backgroundColor: '#dc2626', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  modalBtnEliminarText: { color: WHITE, fontWeight: '800', fontSize: 14 },
});
