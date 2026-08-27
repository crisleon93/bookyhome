import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import CalendarioPicker from '../components/CalendarioPicker';
import {
  getOfertas,
  getOfertaById,
  crearOferta,
  updateOferta,
  deleteOferta,
  getMisLibros,
  getApiBaseUrl,
} from '../services/api';
import {
  IconTag,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconCheck,
  IconBook,
  IconLock,
  IconAlertTriangle,
} from '../components/Icons';

// ── Constantes de color (siguiendo la paleta del proyecto) ──
const PRIMARY   = '#7A1E3A';
const PRIMARY_L = '#C5425A';
const BG        = '#FAF8F5';
const WHITE     = '#FFFFFF';
const TEXT      = '#1f2937';
const MUTED     = '#6b7280';
const BORDER    = '#e5e7eb';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatPrecio = (v) => {
  if (v == null) return '—';
  return '$' + String(parseInt(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' COP';
};

const formatFecha = (f) => {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// Devuelve el estado de una oferta a partir de las fechas (igual que el backend)
const calcEstado = (fechaInicio, fechaFin) => {
  const ahora = new Date();
  const ini   = new Date(fechaInicio);
  const fin   = new Date(fechaFin);
  if (ahora >= ini && ahora <= fin) return 'activa';
  if (ini > ahora)                  return 'proxima';
  return 'vencida';
};

const ESTADO_CONFIG = {
  activa:  { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', label: 'Activa',   icon: '✓' },
  proxima: { color: '#1e40af', bg: '#dbeafe', border: '#93c5fd', label: 'Próxima',  icon: '◷' },
  vencida: { color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', label: 'Vencida',  icon: '✕' },
};

const labelTipo = (tipo, valor) => {
  const t = (tipo || '').toLowerCase();
  if (t === 'porcentaje') return `${valor}% dto.`;
  if (t === 'fijo')       return `${formatPrecio(valor)} dto.`;
  if (t === 'especial')   return '2×1';
  return String(valor || tipo);
};

const resolveImg = (value) => {
  if (!value || typeof value !== 'string') return null;
  const s = value.trim().split(',')[0];
  if (!s) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const base = getApiBaseUrl();
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
};

const getLibroImg = (libro) => {
  const c = libro?.imagen_url || libro?.imagen_principal || libro?.imagen
    || (Array.isArray(libro?.imagenes) ? libro.imagenes[0] : null);
  return resolveImg(c);
};


// ── Badge de estado ───────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const s = ESTADO_CONFIG[estado] || ESTADO_CONFIG.vencida;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.icon} {s.label}</Text>
    </View>
  );
}

// ── Tarjeta de oferta ─────────────────────────────────────────────────────────
function TarjetaOferta({ oferta, onEditar, onEliminar }) {
  const estado = oferta.estado || calcEstado(oferta.fecha_inicio, oferta.fecha_fin);
  const cfg    = ESTADO_CONFIG[estado] || ESTADO_CONFIG.vencida;
  const esVencida = estado === 'vencida';

  return (
    <View style={[styles.card, { borderLeftColor: cfg.border, opacity: esVencida ? 0.75 : 1 }]}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardNombre} numberOfLines={2}>{oferta.nombre_oferta}</Text>
          <View style={styles.cardMeta}>
            <BadgeEstado estado={estado} />
            <View style={[styles.tipoBadge, { backgroundColor: PRIMARY + '18' }]}>
              <Text style={[styles.tipoBadgeText, { color: PRIMARY }]}>
                {labelTipo(oferta.tipo_descuento, oferta.valor_descuento)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardDates}>
        <IconCalendar size={13} color={MUTED} />
        <Text style={styles.cardDateText}>
          {formatFecha(oferta.fecha_inicio)} → {formatFecha(oferta.fecha_fin)}
        </Text>
      </View>

      {oferta.total_libros != null && (
        <Text style={styles.cardLibros}>
          {oferta.total_libros} libro{oferta.total_libros !== 1 ? 's' : ''} incluido{oferta.total_libros !== 1 ? 's' : ''}
        </Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.btnAccion, { backgroundColor: '#dbeafe', borderColor: '#93c5fd' }]}
          onPress={() => onEditar(oferta)}
          activeOpacity={0.7}
        >
          <IconEdit size={15} color="#1e40af" />
          <Text style={[styles.btnAccionText, { color: '#1e40af' }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnAccion, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
          onPress={() => onEliminar(oferta)}
          activeOpacity={0.7}
        >
          <IconTrash size={15} color="#dc2626" />
          <Text style={[styles.btnAccionText, { color: '#dc2626' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Grupo de ofertas por estado ───────────────────────────────────────────────
function GrupoOfertas({ titulo, lista, colorAccent, onEditar, onEliminar }) {
  if (!lista || lista.length === 0) return null;
  return (
    <View style={styles.grupo}>
      <View style={[styles.grupoHeader, { borderLeftColor: colorAccent }]}>
        <Text style={[styles.grupoTitulo, { color: colorAccent }]}>
          {titulo}
        </Text>
        <View style={[styles.grupoBadge, { backgroundColor: colorAccent + '22' }]}>
          <Text style={[styles.grupoBadgeText, { color: colorAccent }]}>{lista.length}</Text>
        </View>
      </View>
      {lista.map((o) => (
        <TarjetaOferta key={o.id_oferta} oferta={o} onEditar={onEditar} onEliminar={onEliminar} />
      ))}
    </View>
  );
}

// ── Selector de libros ────────────────────────────────────────────────────────
function SelectorLibros({ libros, idsSeleccionados, onToggle, onSelAll, onClearAll }) {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = libros.filter((l) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return l.titulo?.toLowerCase().includes(q) || l.autor_libro?.toLowerCase().includes(q);
  });

  return (
    <View style={styles.selectorBox}>
      <View style={styles.selectorHeader}>
        <View style={styles.selectorHeaderLeft}>
          <IconBook size={16} color={PRIMARY} />
          <Text style={styles.selectorTitle}>Libros incluidos</Text>
          <View style={[styles.selectorCount, { backgroundColor: idsSeleccionados.length > 0 ? PRIMARY : BORDER }]}>
            <Text style={[styles.selectorCountText, { color: idsSeleccionados.length > 0 ? WHITE : MUTED }]}>
              {idsSeleccionados.length}/{libros.length}
            </Text>
          </View>
        </View>
        <View style={styles.selectorHeaderBtns}>
          <TouchableOpacity onPress={onSelAll} style={styles.selectorBtn} activeOpacity={0.7}>
            <Text style={styles.selectorBtnText}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClearAll} style={[styles.selectorBtn, { marginLeft: 6 }]} activeOpacity={0.7}>
            <Text style={styles.selectorBtnText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.selectorSearch}
        placeholder="Buscar libro…"
        placeholderTextColor={MUTED}
        value={busqueda}
        onChangeText={setBusqueda}
      />

      <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {filtrados.map((libro) => {
          const sel = idsSeleccionados.includes(libro.id_libro);
          const img = getLibroImg(libro);
          return (
            <TouchableOpacity
              key={libro.id_libro}
              style={[styles.libroItem, sel && styles.libroItemSel]}
              onPress={() => onToggle(libro.id_libro)}
              activeOpacity={0.7}
            >
              {img
                ? <Image source={{ uri: img }} style={styles.libroImg} />
                : <View style={[styles.libroImg, styles.libroImgPlaceholder]}>
                    <IconBook size={16} color={MUTED} />
                  </View>
              }
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.libroTitulo, sel && { color: PRIMARY }]} numberOfLines={1}>
                  {libro.titulo}
                </Text>
                <Text style={styles.libroAutor} numberOfLines={1}>{libro.autor_libro}</Text>
              </View>
              <View style={[styles.libroCheck, sel && styles.libroCheckSel]}>
                {sel && <Text style={styles.libroCheckMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
        {filtrados.length === 0 && (
          <Text style={styles.libroEmpty}>Sin resultados</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ── Formulario crear / editar ─────────────────────────────────────────────────
function FormOferta({ libros, ofertaEditar, onGuardado, onCancelar }) {
  const esEdicion = !!ofertaEditar;

  const [form, setForm] = useState({
    nombre_oferta:   ofertaEditar?.nombre_oferta   || '',
    tipo_descuento:  ofertaEditar?.tipo_descuento  || 'porcentaje',
    valor_descuento: ofertaEditar?.valor_descuento != null ? String(ofertaEditar.valor_descuento) : '',
    fecha_inicio:    ofertaEditar?.fecha_inicio    ? String(ofertaEditar.fecha_inicio).slice(0, 16) : '',
    fecha_fin:       ofertaEditar?.fecha_fin       ? String(ofertaEditar.fecha_fin).slice(0, 16)    : '',
    ids_libros:      ofertaEditar?.libros?.map((l) => l.id_libro) || [],
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleLibro = (id) =>
    setField('ids_libros', form.ids_libros.includes(id)
      ? form.ids_libros.filter((x) => x !== id)
      : [...form.ids_libros, id]);

  const guardar = async () => {
    if (!form.nombre_oferta.trim())  { setError('El nombre es obligatorio'); return; }
    if (!form.fecha_inicio)           { setError('La fecha de inicio es obligatoria'); return; }
    if (!form.fecha_fin)              { setError('La fecha de fin es obligatoria'); return; }

    if (!esEdicion) {
      const ahora = new Date().toISOString().slice(0, 16);
      if (form.fecha_inicio < ahora) { setError('No puedes crear promociones con fechas pasadas'); return; }
    }

    if (form.fecha_inicio >= form.fecha_fin) {
      setError('La fecha de inicio debe ser anterior a la de fin');
      return;
    }

    if (form.tipo_descuento !== 'especial' && (!form.valor_descuento || Number(form.valor_descuento) <= 0)) {
      setError('El valor del descuento debe ser mayor a 0');
      return;
    }

    if (form.ids_libros.length === 0) {
      setError('Selecciona al menos un libro para la oferta');
      return;
    }

    setCargando(true);
    setError('');
    try {
      const data = new FormData();
      data.append('nombre_oferta',   form.nombre_oferta.trim());
      data.append('tipo_descuento',  form.tipo_descuento);
      data.append('valor_descuento', form.tipo_descuento === 'especial' ? '0' : form.valor_descuento);
      // El backend espera "YYYY-MM-DD HH:MM:SS"
      data.append('fecha_inicio', form.fecha_inicio.replace('T', ' ') + ':00');
      data.append('fecha_fin',    form.fecha_fin.replace('T', ' ')    + ':00');
      data.append('ids_libros',   form.ids_libros.join(','));

      if (esEdicion) {
        await updateOferta(ofertaEditar.id_oferta, data);
      } else {
        await crearOferta(data);
      }
      onGuardado();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg).join(', '));
      } else {
        setError(detail || 'Error al guardar la oferta');
      }
    } finally {
      setCargando(false);
    }
  };

  const TIPOS = [
    { tipo: 'porcentaje', icon: '%',  label: 'Porcentaje', desc: 'Descuento sobre el precio (%)', color: '#10b981', bg: '#d1fae5' },
    { tipo: 'fijo',       icon: '$',  label: 'Monto fijo', desc: 'Descuento en COP',              color: '#3b82f6', bg: '#dbeafe' },
    { tipo: 'especial',   icon: '🎁', label: '2×1 Especial', desc: 'Lleva 2, paga 1',            color: '#8b5cf6', bg: '#ede9fe' },
  ];

  return (
    <View style={styles.formBox}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{esEdicion ? 'Editar oferta' : 'Nueva oferta'}</Text>
      </View>

      {/* Nombre */}
      <Text style={styles.label}>Nombre de la oferta *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Descuento verano"
        placeholderTextColor={MUTED}
        value={form.nombre_oferta}
        onChangeText={(v) => setField('nombre_oferta', v)}
        maxLength={100}
      />

      {/* Tipo de descuento */}
      <Text style={[styles.label, { marginTop: 16 }]}>Tipo de descuento *</Text>
      {TIPOS.map((opc) => {
        const sel = form.tipo_descuento === opc.tipo;
        return (
          <TouchableOpacity
            key={opc.tipo}
            style={[styles.tipoCard, sel && { borderColor: PRIMARY, backgroundColor: PRIMARY + '08' }]}
            onPress={() => setField('tipo_descuento', opc.tipo)}
            activeOpacity={0.7}
          >
            <View style={[styles.tipoIcon, { backgroundColor: opc.bg }]}>
              <Text style={{ fontSize: 16 }}>{opc.icon}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
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

      {/* Valor del descuento */}
      {form.tipo_descuento !== 'especial' && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.label}>
            {form.tipo_descuento === 'porcentaje' ? 'Porcentaje (%) *' : 'Monto (COP) *'}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={form.tipo_descuento === 'porcentaje' ? 'Ej: 25' : 'Ej: 15000'}
              placeholderTextColor={MUTED}
              keyboardType="numeric"
              value={form.valor_descuento}
              onChangeText={(v) => setField('valor_descuento', v)}
            />
            <View style={styles.inputSuffix}>
              <Text style={styles.inputSuffixText}>
                {form.tipo_descuento === 'porcentaje' ? '%' : 'COP'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Fechas */}
      <View style={[styles.fechasBox, { marginTop: 16 }]}>
        <View style={styles.fechasHeader}>
          <IconCalendar size={15} color={PRIMARY} />
          <Text style={styles.fechasTitle}>Vigencia de la promoción</Text>
        </View>
        <CalendarioPicker
          label="Fecha y hora de inicio *"
          value={form.fecha_inicio}
          onChange={(v) => setField('fecha_inicio', v)}
          placeholder="Seleccionar inicio…"
        />
        <View style={{ marginTop: 14 }}>
          <CalendarioPicker
            label="Fecha y hora de fin *"
            value={form.fecha_fin}
            onChange={(v) => setField('fecha_fin', v)}
            minDate={form.fecha_inicio || undefined}
            placeholder="Seleccionar fin…"
          />
        </View>
      </View>

      {/* Selector de libros */}
      <View style={{ marginTop: 16 }}>
        <SelectorLibros
          libros={libros}
          idsSeleccionados={form.ids_libros}
          onToggle={toggleLibro}
          onSelAll={() => setField('ids_libros', libros.map((l) => l.id_libro))}
          onClearAll={() => setField('ids_libros', [])}
        />
      </View>

      {/* Error */}
      {!!error && (
        <View style={styles.errorBox}>
          <IconAlertTriangle size={16} color="#dc2626" />
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
            : <Text style={styles.btnGuardarText}>{esEdicion ? 'Actualizar' : 'Crear oferta'}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function PromocionesVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [ofertas,  setOfertas]  = useState([]);
  const [libros,   setLibros]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,    setError]    = useState('');

  // Estado de UI del formulario
  const [mostrarForm,   setMostrarForm]   = useState(false);
  const [ofertaEditar,  setOfertaEditar]  = useState(null);  // null = crear
  const [cargandoForm,  setCargandoForm]  = useState(false); // cargando detalle para editar

  // Modal de eliminación
  const [ofertaEliminar, setOfertaEliminar] = useState(null);
  const [eliminando,     setEliminando]     = useState(false);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const [rOfertas, rLibros] = await Promise.all([
        getOfertas(),
        getMisLibros(),
      ]);
      setOfertas(Array.isArray(rOfertas.data)  ? rOfertas.data  : []);
      setLibros (Array.isArray(rLibros.data)   ? rLibros.data   : []);
    } catch {
      setError('No se pudieron cargar las promociones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const onRefresh = () => { setRefreshing(true); cargar(true); };

  // ── Abrir editar (carga detalle con libros asignados) ───────────────────────
  const abrirEditar = async (oferta) => {
    setCargandoForm(true);
    setMostrarForm(true);
    try {
      const res = await getOfertaById(oferta.id_oferta);
      setOfertaEditar(res.data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el detalle de la oferta');
      setMostrarForm(false);
    } finally {
      setCargandoForm(false);
    }
  };

  const cerrarForm = () => {
    setMostrarForm(false);
    setOfertaEditar(null);
  };

  const onGuardado = () => {
    cerrarForm();
    cargar(true);
  };

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const confirmarEliminar = async () => {
    if (!ofertaEliminar) return;
    setEliminando(true);
    try {
      await deleteOferta(ofertaEliminar.id_oferta);
      setOfertaEliminar(null);
      cargar(true);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al eliminar';
      Alert.alert('Error', detail);
    } finally {
      setEliminando(false);
    }
  };

  // ── Clasificación por estado ────────────────────────────────────────────────
  const activas  = ofertas.filter((o) => (o.estado || calcEstado(o.fecha_inicio, o.fecha_fin)) === 'activa');
  const proximas = ofertas.filter((o) => (o.estado || calcEstado(o.fecha_inicio, o.fecha_fin)) === 'proxima');
  const vencidas = ofertas.filter((o) => (o.estado || calcEstado(o.fecha_inicio, o.fecha_fin)) === 'vencida');

  // ── Render ──────────────────────────────────────────────────────────────────
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
          <Text style={styles.headerTitle}>Promociones</Text>
        </View>
        {!mostrarForm && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setOfertaEditar(null); setMostrarForm(true); }}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Nueva</Text>
          </TouchableOpacity>
        )}
        {mostrarForm && (
          <View style={{ width: 70 }} />
        )}
      </View>

      {/* Stats bar */}
      {!mostrarForm && !loading && ofertas.length > 0 && (
        <View style={styles.statsBar}>
          {[
            { label: 'Activas',  value: activas.length,  color: '#10b981', bg: '#d1fae5' },
            { label: 'Próximas', value: proximas.length, color: '#3b82f6', bg: '#dbeafe' },
            { label: 'Vencidas', value: vencidas.length, color: '#6b7280', bg: '#f3f4f6' },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Cuerpo principal */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Cargando promociones…</Text>
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
        // ── Formulario ────────────────────────────────────────────────────────
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
            {cargandoForm ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.loadingText}>Cargando oferta…</Text>
              </View>
            ) : (
              <FormOferta
                libros={libros}
                ofertaEditar={ofertaEditar}
                onGuardado={onGuardado}
                onCancelar={cerrarForm}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        // ── Lista de ofertas ──────────────────────────────────────────────────
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
          {ofertas.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <IconTag size={32} color={PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>Sin promociones todavía</Text>
              <Text style={styles.emptyDesc}>
                Crea tu primera oferta para atraer más compradores
              </Text>
              <TouchableOpacity
                style={styles.btnGuardar}
                onPress={() => { setOfertaEditar(null); setMostrarForm(true); }}
                activeOpacity={0.8}
              >
                <Text style={styles.btnGuardarText}>+ Crear primera oferta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <GrupoOfertas
                titulo="Activas ahora"
                lista={activas}
                colorAccent="#10b981"
                onEditar={abrirEditar}
                onEliminar={setOfertaEliminar}
              />
              <GrupoOfertas
                titulo="Próximas"
                lista={proximas}
                colorAccent="#3b82f6"
                onEditar={abrirEditar}
                onEliminar={setOfertaEliminar}
              />
              <GrupoOfertas
                titulo="Vencidas"
                lista={vencidas}
                colorAccent="#6b7280"
                onEditar={abrirEditar}
                onEliminar={setOfertaEliminar}
              />
            </>
          )}
        </ScrollView>
      )}

      {/* Modal confirmación eliminar */}
      <Modal
        visible={!!ofertaEliminar}
        transparent
        animationType="fade"
        onRequestClose={() => setOfertaEliminar(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBox}>
              <IconTrash size={28} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Eliminar oferta</Text>
            <Text style={styles.modalMsg}>
              ¿Estás seguro de que quieres eliminar{' '}
              <Text style={{ fontWeight: '800' }}>"{ofertaEliminar?.nombre_oferta}"</Text>?
              {'\n'}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => setOfertaEliminar(null)}
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
  root:         { flex: 1, backgroundColor: BG },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  menuBtn:       { padding: 6, marginRight: 8 },
  menuIcon:      { gap: 4 },
  menuLine:      { width: 22, height: 2, borderRadius: 1, backgroundColor: TEXT },
  headerCenter:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle:   { fontSize: 18, fontWeight: '800', color: TEXT },
  addBtn: {
    backgroundColor: PRIMARY, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText:    { color: WHITE, fontWeight: '800', fontSize: 13 },

  // ── Stats bar ──
  statsBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  statItem:      { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 8 },
  statValue:     { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  statLabel:     { fontSize: 11, fontWeight: '700', marginTop: 2 },

  // ── Cards ──
  listScroll:    { padding: 16, paddingBottom: 40 },
  grupo:         { marginBottom: 20 },
  grupoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10,
  },
  grupoTitulo:   { fontSize: 14, fontWeight: '800' },
  grupoBadge:    { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  grupoBadgeText:{ fontSize: 12, fontWeight: '800' },

  card: {
    backgroundColor: WHITE, borderRadius: 14,
    borderLeftWidth: 4, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  cardRow:       { flexDirection: 'row', marginBottom: 8 },
  cardNombre:    { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 6 },
  cardMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge:         { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText:     { fontSize: 11, fontWeight: '700' },
  tipoBadge:     { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  tipoBadgeText: { fontSize: 11, fontWeight: '700' },
  cardDates: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, marginBottom: 4,
  },
  cardDateText:  { fontSize: 12, color: MUTED },
  cardLibros:    { fontSize: 12, color: MUTED, marginBottom: 8 },
  cardActions:   { flexDirection: 'row', gap: 8, marginTop: 8 },
  btnAccion: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
  },
  btnAccionText: { fontSize: 13, fontWeight: '700' },

  // ── Vacío / carga ──
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText:   { marginTop: 12, color: MUTED, fontSize: 14 },
  errorMsg:      { marginTop: 12, color: TEXT, fontSize: 15, textAlign: 'center' },
  retryBtn:      { marginTop: 16, backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:     { color: WHITE, fontWeight: '800' },
  emptyBox:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: PRIMARY + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle:    { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 8 },
  emptyDesc:     { fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 24 },

  // ── Formulario ──
  formScroll:    { padding: 16, paddingBottom: 60 },
  formBox: {
    backgroundColor: WHITE, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: BORDER,
  },
  formHeader:    { marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  formTitle:     { fontSize: 17, fontWeight: '900', color: TEXT },
  label: {
    fontSize: 12, fontWeight: '700', color: '#374151',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7,
  },
  input: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    padding: 12, fontSize: 15, color: TEXT,
    backgroundColor: '#fafafa', fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  inputRow:       { flexDirection: 'row', alignItems: 'center', gap: 0 },
  inputSuffix: {
    backgroundColor: '#f3f4f6', borderWidth: 1.5, borderLeftWidth: 0,
    borderColor: BORDER, borderTopRightRadius: 10, borderBottomRightRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  inputSuffixText:{ fontWeight: '800', color: PRIMARY, fontSize: 13 },

  tipoCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    padding: 12, marginBottom: 8, backgroundColor: WHITE,
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
  fechasHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  fechasTitle:   { fontSize: 14, fontWeight: '800', color: TEXT },
  fechasHint:    { fontSize: 11, color: MUTED, marginTop: 8, fontStyle: 'italic' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fee2e2', borderRadius: 10,
    padding: 12, marginTop: 14,
  },
  errorText:     { flex: 1, color: '#dc2626', fontSize: 13, fontWeight: '600' },

  formBtns:      { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCancelar: {
    flex: 1, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelarText:{ fontSize: 15, fontWeight: '700', color: MUTED },
  btnGuardar: {
    flex: 1, backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  btnGuardarText: { color: WHITE, fontWeight: '800', fontSize: 15 },

  // ── Selector de libros ──
  selectorBox: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    overflow: 'hidden', backgroundColor: '#fafafa',
  },
  selectorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
    backgroundColor: WHITE,
  },
  selectorHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectorTitle:       { fontSize: 13, fontWeight: '800', color: TEXT },
  selectorCount: {
    borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2,
  },
  selectorCountText:   { fontSize: 11, fontWeight: '800' },
  selectorHeaderBtns:  { flexDirection: 'row' },
  selectorBtn: {
    backgroundColor: BORDER, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  selectorBtnText:     { fontSize: 11, fontWeight: '700', color: TEXT },
  selectorSearch: {
    margin: 10, borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 13, color: TEXT, backgroundColor: WHITE,
  },
  libroItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  libroItemSel:   { backgroundColor: PRIMARY + '08' },
  libroImg: {
    width: 38, height: 52, borderRadius: 5,
    backgroundColor: BORDER, resizeMode: 'cover',
  },
  libroImgPlaceholder:{ alignItems: 'center', justifyContent: 'center' },
  libroTitulo:    { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 3 },
  libroAutor:     { fontSize: 12, color: MUTED },
  libroCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  libroCheckSel:  { backgroundColor: PRIMARY, borderColor: PRIMARY },
  libroCheckMark: { color: WHITE, fontSize: 12, fontWeight: '900' },
  libroEmpty:     { textAlign: 'center', color: MUTED, padding: 20, fontSize: 13 },

  // ── Modal eliminar ──
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
  modalTitle:    { fontSize: 18, fontWeight: '900', color: TEXT, marginBottom: 10 },
  modalMsg:      { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalBtns:     { flexDirection: 'row', gap: 10, width: '100%' },
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
