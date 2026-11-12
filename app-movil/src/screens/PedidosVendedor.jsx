import { useThemedStyles } from '../context/ThemeContext';
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Image,
  Alert, Modal, TextInput, TouchableOpacity, ScrollView,
  RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiBaseUrl, getMisPedidos, actualizarEstadoOrden, registrarGuia, getEmpresasMensajeria } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import Footer from '../components/Footer';
import { IconBook, IconFilter, IconMail, IconMapPin, IconPackage, IconPhone, IconRefresh, IconSearch } from '../components/Icons';

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

const FILTROS_ENVIOS = [
  { id: 'todos', label: 'Todos', clases: null, color: PRIMARY, bg: '#F8E7EC', border: PRIMARY },
  { id: 'transito', label: 'En tránsito', clases: ['camino', 'procesando'], color: '#1D68A8', bg: '#EAF3FF', border: '#8FC5F5' },
  { id: 'entregados', label: 'Entregados', clases: ['entregado'], color: '#087A49', bg: '#E7F8EF', border: '#8BE3B0' },
  { id: 'sin_guia', label: 'Sin guía', clases: ['alerta'], color: '#C7374E', bg: '#FFF0F1', border: '#F49AA5' },
];

const RANGOS_ENVIOS = [
  { id: 'todos', label: 'Todos', dias: null },
  { id: 'hoy', label: 'Hoy', dias: 0 },
  { id: '7d', label: '7 días', dias: 6 },
  { id: '30d', label: '30 días', dias: 29 },
  { id: '90d', label: '90 días', dias: 89 },
];

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = [1];
  if (currentPage > 3) items.push('start-ellipsis');
  for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page += 1) {
    items.push(page);
  }
  if (currentPage < totalPages - 2) items.push('end-ellipsis');
  items.push(totalPages);
  return items;
};

const normalizarEstado = (estado) => {
  const raw = String(estado || '').toLowerCase().trim();
  if (['pagado', 'pagada', 'aprobado', 'aprobada'].includes(raw)) return 'pagado';
  if (['enviado', 'enviada', 'en_camino'].includes(raw)) return 'enviado';
  if (['entregado', 'entregada', 'completado', 'completada'].includes(raw)) return 'entregada';
  if (['cancelado', 'cancelada', 'anulado', 'anulada'].includes(raw)) return 'cancelada';
  return 'pendiente';
};

const getOrderImageUri = (image) => {
  if (!image) return null;
  return image.startsWith('http') ? image : `${getApiBaseUrl()}/${image.replace(/^\/+/, '')}`;
};

const FILTROS_PEDIDOS = [
  { id: 'todos', label: 'Todos', icon: '📦' },
  { id: 'retiro_tienda', label: 'Retiros', icon: '🏪' },
  { id: 'pendiente', label: 'Pendientes', icon: '⏳' },
  { id: 'pagado', label: 'Pagadas', icon: '💳' },
  { id: 'enviado', label: 'Enviadas', icon: '🚚' },
  { id: 'entregada', label: 'Entregadas', icon: '✅' },
  { id: 'cancelada', label: 'Canceladas', icon: '❌' },
];

const parseFechaPedido = (fecha) => {
  if (!fecha) return new Date();
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const [year, month, day] = fecha.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(fecha);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const infoEstadoEnvio = (pedido) => {
  const estado = normalizarEstado(pedido.estado);
  const envio = pedido.envio;
  if (!envio) {
    if (estado === 'entregada') return { clase: 'entregado', texto: 'Entregado' };
    if (estado === 'pagado' || estado === 'enviado') return { clase: 'alerta', texto: 'Sin guía' };
    return { clase: 'pendiente', texto: 'Pendiente' };
  }

  const raw = String(envio.estado_envio || '').toLowerCase().trim();
  if (!raw) {
    return estado === 'entregada'
      ? { clase: 'entregado', texto: 'Entregado' }
      : { clase: 'camino', texto: 'En tránsito' };
  }
  if (/entregad|complet|recibid|finaliz|exitoso|despachad/.test(raw)) {
    return { clase: 'entregado', texto: 'Entregado' };
  }
  if (/transito|en viaje|en ruta|camino|enviad|traslado|adelanto|forzado|registrad|cread|generad|emitid/.test(raw)) {
    return { clase: 'camino', texto: 'En tránsito' };
  }
  if (/devolu|rechaz|no entregad|excepci|nov/.test(raw)) {
    return { clase: 'devolucion', texto: 'Devolución' };
  }
  return { clase: 'procesando', texto: raw.charAt(0).toUpperCase() + raw.slice(1) };
};

const ESTADO_ENVIO_STYLE = {
  entregado: { bg: '#D4EDDA', color: '#155724' },
  alerta: { bg: '#FFF3CD', color: '#856404' },
  camino: { bg: '#CCE5FF', color: '#004085' },
  procesando: { bg: '#E8EAF6', color: '#3949AB' },
  devolucion: { bg: '#F8D7DA', color: '#721C24' },
  pendiente: { bg: '#F1F1F1', color: '#666666' },
};

export default function PedidosVendedor({ navigation, route }) {
  const s = useThemedStyles(themeBaseS);
  const { user, signOut } = useContext(AuthContext);
  const esSeccionEnvios = route?.name === 'EnviosVendedor';
  const numColumnas = 2;
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [pedidos, setPedidos]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [empresas, setEmpresas]         = useState([]);
  const [busquedaEnvios, setBusquedaEnvios] = useState('');
  const [filtroEstadoEnvios, setFiltroEstadoEnvios] = useState('todos');
  const [rangoEnvios, setRangoEnvios] = useState('todos');
  const [filtroEnviosVisible, setFiltroEnviosVisible] = useState(false);
  const [paginaEnvios, setPaginaEnvios] = useState(1);
  const [enviosPorPagina, setEnviosPorPagina] = useState(8);
  const [selectorCantidadVisible, setSelectorCantidadVisible] = useState(false);
  const [filtroEstadoPedidos, setFiltroEstadoPedidos] = useState('todos');
  const [filtroPedidosVisible, setFiltroPedidosVisible] = useState(false);
  const [busquedaPedidos, setBusquedaPedidos] = useState('');
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [pedidosPorPagina, setPedidosPorPagina] = useState(8);
  const [detallePedido, setDetallePedido] = useState(null);

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
        getEmpresasMensajeria().catch((error) => {
          console.warn('[ENVÍOS] No se pudieron cargar las empresas de mensajería:', error?.message);
          Alert.alert('Aviso', 'No se pudieron cargar las empresas de mensajería. Podrás consultar pedidos, pero no registrar guías.');
          return { data: [] };
        }),
      ]);
      setPedidos(rPed.data || []);
      setEmpresas(rEmp.data || []);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.detail || 'No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = () => { setRefreshing(true); cargar(true); };

  const conteoPedidos = {
    todos: pedidos.length,
    retiro_tienda: pedidos.filter((pedido) => pedido.tipo_entrega === 'retiro_tienda').length,
    pendiente: 0,
    pagado: 0,
    enviado: 0,
    entregada: 0,
    cancelada: 0,
  };
  const retirosEnTienda = pedidos.filter(
    (pedido) => pedido.tipo_entrega === 'retiro_tienda' && pedido.estado_retiro === 'en_tienda',
  ).length;
  pedidos.forEach((pedido) => {
    const estado = normalizarEstado(pedido.estado);
    if (conteoPedidos[estado] !== undefined) conteoPedidos[estado] += 1;
  });
  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtroEstadoPedidos === 'retiro_tienda') {
      if (pedido.tipo_entrega !== 'retiro_tienda') return false;
    } else if (filtroEstadoPedidos !== 'todos' && normalizarEstado(pedido.estado) !== filtroEstadoPedidos) {
      return false;
    }

    const query = busquedaPedidos.trim().toLowerCase();
    if (!query) return true;
    return [
      pedido.id_orden,
      pedido.id_orden_unico,
      pedido.codigo_compra,
      pedido.cliente,
      pedido.correo_cliente,
      pedido.telefono_cliente,
    ].some((valor) => String(valor || '').toLowerCase().includes(query));
  });
  const totalPaginasPedidos = Math.max(1, Math.ceil(pedidosFiltrados.length / pedidosPorPagina));
  const paginaPedidosSegura = Math.min(paginaPedidos, totalPaginasPedidos);
  const pedidosPagina = pedidosFiltrados.slice(
    (paginaPedidosSegura - 1) * pedidosPorPagina,
    paginaPedidosSegura * pedidosPorPagina,
  );

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const rangoSeleccionado = RANGOS_ENVIOS.find((rango) => rango.id === rangoEnvios) || RANGOS_ENVIOS[0];
  const inicioRango = new Date(hoy);
  if (rangoSeleccionado.dias !== null) inicioRango.setDate(inicioRango.getDate() - rangoSeleccionado.dias);

  const pedidosEnvio = pedidos.filter((pedido) => {
    if (pedido.tipo_entrega === 'retiro_tienda') return false;
    if (['cancelada', 'pendiente'].includes(normalizarEstado(pedido.estado))) return false;
    if (rangoSeleccionado.dias !== null && parseFechaPedido(pedido.fecha) < inicioRango) return false;
    return true;
  });

  const conteoEnvios = {
    todos: pedidosEnvio.length,
    transito: pedidosEnvio.filter((pedido) => ['camino', 'procesando'].includes(infoEstadoEnvio(pedido).clase)).length,
    entregados: pedidosEnvio.filter((pedido) => infoEstadoEnvio(pedido).clase === 'entregado').length,
    sin_guia: pedidosEnvio.filter((pedido) => infoEstadoEnvio(pedido).clase === 'alerta').length,
  };

  const filtroActivo = FILTROS_ENVIOS.find((filtro) => filtro.id === filtroEstadoEnvios) || FILTROS_ENVIOS[0];
  const enviosFiltrados = pedidosEnvio.filter((pedido) => {
    const clase = infoEstadoEnvio(pedido).clase;
    if (filtroActivo.clases && !filtroActivo.clases.includes(clase)) return false;
    const query = busquedaEnvios.trim().toLowerCase();
    if (!query) return true;
    return [
      pedido.codigo_compra,
      pedido.id_orden,
      pedido.cliente,
      pedido.correo_cliente,
      pedido.envio?.empresa_mensajeria,
      pedido.envio?.numero_guia,
    ].some((valor) => String(valor || '').toLowerCase().includes(query));
  });
  const totalPaginasEnvios = Math.max(1, Math.ceil(enviosFiltrados.length / enviosPorPagina));
  const paginaEnviosSegura = Math.min(paginaEnvios, totalPaginasEnvios);
  const enviosPagina = enviosFiltrados.slice(
    (paginaEnviosSegura - 1) * enviosPorPagina,
    paginaEnviosSegura * enviosPorPagina,
  );

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
    if (!pedidoActivo) return;
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
        empresa_mensajeria: empresas.find(e => e.id_empresa === empresaId)?.nombre_empresa
          ?? empresas.find(e => e.id_empresa === empresaId)?.nombre
          ?? '',
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
    const estadoNormalizado = normalizarEstado(item.estado);
    const est = ESTADO_STYLE[estadoNormalizado] ?? ESTADO_STYLE.pendiente;
    const tieneGuia = !!item.envio?.numero_guia;
    const puedeGuia = ['pagado', 'enviado'].includes(estadoNormalizado);
    if (esSeccionEnvios) {
      const estadoEnvio = infoEstadoEnvio(item);
      const estiloEstado = ESTADO_ENVIO_STYLE[estadoEnvio.clase] || ESTADO_ENVIO_STYLE.pendiente;
      const direccion = item.direccion_entrega || {};
      const direccionTexto = [direccion.alias, direccion.direccion, direccion.ciudad, direccion.departamento]
        .filter(Boolean)
        .join(' · ');

      return (
        <View style={[s.envioCard, { borderLeftColor: estiloEstado.color }]}>
          <View style={s.envioHeader}>
            <View style={s.envioIdent}>
              <Text style={s.envioCompra}>Compra {item.codigo_compra || `BH-${item.id_orden}`}</Text>
              <Text style={s.envioPedido}>Pedido #{item.id_orden} · {item.cliente || 'Comprador'}</Text>
            </View>
            <Text style={[s.envioBadge, { backgroundColor: estiloEstado.bg, color: estiloEstado.color }]}>
              {estadoEnvio.texto}
            </Text>
          </View>

          {item.correo_cliente ? <Text style={s.envioCorreo}>{item.correo_cliente}</Text> : null}
          <Text style={s.envioFecha}>
            {item.fecha ? parseFechaPedido(item.fecha).toLocaleDateString('es-CO') : '—'}
          </Text>

          {tieneGuia ? (
            <View style={s.envioGuia}>
              <Text style={s.envioEmpresa}>🚚 {item.envio.empresa_mensajeria || 'Mensajería'}</Text>
              <Text style={s.envioNumeroGuia}>No. guía: {item.envio.numero_guia}</Text>
            </View>
          ) : (
            <View style={s.envioSinGuia}>
              <Text style={s.envioSinGuiaTexto}>Este pedido ya está pagado. Registra la guía para iniciar el envío.</Text>
            </View>
          )}

          {direccionTexto ? (
            <View style={s.addressRow}>
              <IconMapPin size={15} color={PRIMARY} />
              <Text style={s.envioDireccion}>{direccionTexto}</Text>
            </View>
          ) : null}

          <View style={s.envioAcciones}>
            {puedeGuia ? (
              <TouchableOpacity style={s.guiaBtn} onPress={() => abrirModalGuia(item)}>
                <Text style={s.guiaBtnText}>{tieneGuia ? '✏️ Editar guía' : '+ Registrar guía'}</Text>
              </TouchableOpacity>
            ) : null}
            {tieneGuia ? (
              <TouchableOpacity
                style={s.rastrearBtn}
                onPress={() => {
                  const url = item.envio.url_rastreo || item.envio.sitio_web;
                  if (!url) {
                    Alert.alert('Rastreo no disponible', 'Esta transportadora no tiene un enlace de rastreo configurado.');
                    return;
                  }
                  Linking.openURL(url).catch(() => {
                    Alert.alert('Error', 'No se pudo abrir el sitio de la transportadora.');
                  });
                }}
              >
                <Text style={s.rastrearBtnText}>Rastrear envío ↗</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      );
    }

    const esRetiro = item.tipo_entrega === 'retiro_tienda';
    const unidades = (item.items || []).reduce((total, libro) => total + Number(libro.cantidad || 0), 0);
    const direccion = item.direccion_entrega || {};
    const direccionTexto = [direccion.alias, direccion.direccion, direccion.ciudad, direccion.departamento]
      .filter(Boolean)
      .join(' · ');
    const totalTienda = esRetiro
      ? Number(item.total_orden ?? item.total_tienda ?? 0)
      : Number(item.total_tienda ?? 0) + Number(item.costo_envio_tienda || 0);

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
            <View style={s.clienteAvatar}>
              {getOrderImageUri(item.foto_perfil_cliente) ? (
                <Image source={{ uri: getOrderImageUri(item.foto_perfil_cliente) }} style={s.clienteAvatarImage} />
              ) : (
                <Text style={s.clienteAvatarText}>
                  {String(item.cliente || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.clienteNombre} numberOfLines={1}>{item.cliente || '—'}</Text>
              {item.correo_cliente ? (
                <View style={s.contactLine}>
                  <IconMail size={12} color={MUTED} />
                  <Text style={s.muted} numberOfLines={1}>{item.correo_cliente}</Text>
                </View>
              ) : null}
              {item.telefono_cliente ? (
                <View style={s.contactLine}>
                  <IconPhone size={12} color="#16803C" />
                  <Text style={s.phoneText} numberOfLines={1}>{item.telefono_cliente}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* productos */}
          <View style={s.productosBox}>
            {(item.items || []).slice(0, 2).map((it, idx) => (
              <View key={idx} style={s.productoChip}>
                {getOrderImageUri(it.imagen) ? (
                  <Image source={{ uri: getOrderImageUri(it.imagen) }} style={s.productThumb} />
                ) : null}
                <Text style={s.productoChipText} numberOfLines={1}>
                  📖 {it.titulo}
                </Text>
                <View style={s.cantidadBadge}>
                  <Text style={s.cantidadText}>×{it.cantidad}</Text>
                </View>
              </View>
            ))}
            {(item.items || []).length > 0 && (
              <View style={s.productActions}>
                <Text style={s.unitsText}>📚 {unidades} {unidades === 1 ? 'unidad' : 'unidades'}</Text>
                <TouchableOpacity style={s.detailBtn} onPress={() => setDetallePedido(item)}>
                  <Text style={s.detailBtnText}>Ver detalle{item.items.length > 1 ? ` (${item.items.length})` : ''}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* fila estado + total */}
          <View style={s.estadoTotalRow}>
            <TouchableOpacity
              style={[s.badge, { backgroundColor: est.bg }]}
              onPress={() => abrirModalEstado(item)}
              disabled={['entregada', 'cancelada'].includes(estadoNormalizado)}
            >
              <Text style={[s.badgeText, { color: est.color }]}>
                {estadoLabel(estadoNormalizado)}
                {!['entregada', 'cancelada'].includes(estadoNormalizado) ? ' ▾' : ''}
              </Text>
            </TouchableOpacity>
            <Text style={s.total}>
              ${totalTienda.toLocaleString('es-CO')} COP
            </Text>
          </View>

          {/* guía */}
          <View style={s.guiaBox}>
            <View style={s.guiaInfo}>
              {esRetiro ? (
                <>
                  <Text style={s.guiaEmpresa}>🏪 Retiro en tienda</Text>
                  <Text style={s.guiaNro}>
                    {item.estado_retiro === 'en_tienda' ? 'Cliente en la tienda' : `Estado: ${item.estado_retiro || 'Reservado'}`}
                    {item.pin_retiro ? ` · PIN ${item.pin_retiro}` : ''}
                  </Text>
                </>
              ) : tieneGuia ? (
                <>
                  <Text style={s.guiaEmpresa}>🚚 {item.envio.empresa_mensajeria}</Text>
                  <Text style={s.guiaNro}>Guía: {item.envio.numero_guia}</Text>
                </>
              ) : (
                <Text style={s.sinGuia}>{puedeGuia ? 'Sin guía registrada' : 'Envío pendiente'}</Text>
              )}
            </View>
            {!esRetiro && puedeGuia && (
              <TouchableOpacity style={[s.guiaBtn, s.orderGuiaBtn]} onPress={() => abrirModalGuia(item)}>
                <Text style={[s.guiaBtnText, s.orderGuiaBtnText]}>
                  {tieneGuia ? '✏️ Editar' : '+ Guía'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {!esRetiro && direccionTexto ? (
            <View style={[s.addressRow, s.orderAddress]}>
              <IconMapPin size={15} color={PRIMARY} />
              <Text style={s.envioDireccion}>{direccionTexto}</Text>
            </View>
          ) : null}
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
        <View style={s.headerText}>
          <Text style={s.title}>{esSeccionEnvios ? 'Envíos y seguimiento' : 'Pedidos recibidos'}</Text>
          <Text style={s.subtitle}>
            {esSeccionEnvios ? 'Consulta el estado y registra guías' : 'Gestiona las compras de tus clientes'}
          </Text>
        </View>
        <TouchableOpacity
          style={s.refreshButton}
          onPress={onRefresh}
          disabled={refreshing || loading}
          accessibilityRole="button"
          accessibilityLabel="Actualizar pedidos"
        >
          {refreshing
            ? <ActivityIndicator size="small" color={PRIMARY} />
            : <IconRefresh size={17} color={PRIMARY} />}
          <Text style={s.refreshButtonText}>{refreshing ? 'Actualizando' : 'Actualizar'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          key={`orders-grid-${numColumnas}`}
          data={esSeccionEnvios ? enviosPagina : pedidosPagina}
          numColumns={numColumnas}
          columnWrapperStyle={numColumnas > 1 ? s.orderGridRow : undefined}
          keyExtractor={(item, idx) => String(item.id_orden ?? idx)}
          renderItem={({ item }) => (
            <View style={[s.orderGridItem, numColumnas === 1 && s.orderGridItemFullWidth]}>
              {renderItem({ item })}
            </View>
          )}
          contentContainerStyle={{
            flexGrow: esSeccionEnvios ? 1 : 0,
            padding: esSeccionEnvios ? 14 : 9,
            paddingBottom: esSeccionEnvios ? 0 : 32,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={esSeccionEnvios ? (
            <View style={s.enviosControls}>
              <Text style={s.enviosIntro}>Registra guías y consulta el estado de cada envío.</Text>
              <View style={s.searchRow}>
                <View style={s.searchBox}>
                  <IconSearch size={17} color={MUTED} />
                  <TextInput
                    style={s.searchInput}
                    value={busquedaEnvios}
                    onChangeText={(value) => {
                      setBusquedaEnvios(value);
                      setPaginaEnvios(1);
                    }}
                    placeholder="Buscar compra, pedido, guía o comprador..."
                    placeholderTextColor="#999"
                    returnKeyType="search"
                  />
                  {busquedaEnvios ? (
                    <TouchableOpacity
                      onPress={() => {
                        setBusquedaEnvios('');
                        setPaginaEnvios(1);
                      }}
                      accessibilityLabel="Limpiar búsqueda de envíos"
                    >
                      <Text style={s.clearSearch}>×</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[
                    s.filterButton,
                    (filtroEstadoEnvios !== 'todos' || rangoEnvios !== 'todos') && s.filterButtonActive,
                  ]}
                  onPress={() => setFiltroEnviosVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Filtrar envíos"
                >
                  <IconFilter
                    size={18}
                    color={filtroEstadoEnvios !== 'todos' || rangoEnvios !== 'todos' ? WHITE : PRIMARY}
                  />
                  <Text style={[
                    s.filterButtonText,
                    (filtroEstadoEnvios !== 'todos' || rangoEnvios !== 'todos') && s.filterButtonTextActive,
                  ]}>
                    Filtrar
                  </Text>
                  {filtroEstadoEnvios !== 'todos' || rangoEnvios !== 'todos'
                    ? <View style={s.filterCountDot} />
                    : null}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.ordersControls}>
              <View style={s.searchRow}>
                <View style={s.searchBox}>
                  <IconSearch size={17} color={MUTED} />
                  <TextInput
                    style={s.searchInput}
                    value={busquedaPedidos}
                    onChangeText={(value) => { setBusquedaPedidos(value); setPaginaPedidos(1); }}
                    placeholder="Buscar por #orden, código o cliente..."
                    placeholderTextColor="#999"
                    returnKeyType="search"
                  />
                  {busquedaPedidos ? (
                    <TouchableOpacity onPress={() => { setBusquedaPedidos(''); setPaginaPedidos(1); }} accessibilityLabel="Limpiar búsqueda">
                      <Text style={s.clearSearch}>×</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[s.filterButton, filtroEstadoPedidos !== 'todos' && s.filterButtonActive]}
                  onPress={() => setFiltroPedidosVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Filtrar pedidos"
                >
                  <IconFilter size={18} color={filtroEstadoPedidos !== 'todos' ? WHITE : PRIMARY} />
                  <Text style={[s.filterButtonText, filtroEstadoPedidos !== 'todos' && s.filterButtonTextActive]}>Filtrar</Text>
                  {filtroEstadoPedidos !== 'todos' ? <View style={s.filterCountDot} /> : null}
                </TouchableOpacity>
              </View>
              <View style={s.listHeading}>
                <Text style={s.listHeadingTitle}>
                  {busquedaPedidos.trim() ? 'Resultados de búsqueda' : 'Listado de pedidos'}
                  {filtroEstadoPedidos !== 'todos'
                    ? ` · ${FILTROS_PEDIDOS.find((filtro) => filtro.id === filtroEstadoPedidos)?.label}`
                    : ''}
                </Text>
                <Text style={s.listHeadingCount}>
                  {pedidosFiltrados.length === 0
                    ? '0 pedidos'
                    : `Mostrando ${(paginaPedidosSegura - 1) * pedidosPorPagina + 1}–${Math.min(paginaPedidosSegura * pedidosPorPagina, pedidosFiltrados.length)} de ${pedidosFiltrados.length}`}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.emptyOrders}>
              <IconPackage size={32} color={PRIMARY} />
              <Text style={s.emptyText}>
                {esSeccionEnvios
                  ? 'No hay envíos que coincidan. Prueba otra búsqueda o cambia los filtros.'
                  : busquedaPedidos.trim()
                    ? 'No se encontraron pedidos con esa búsqueda.'
                    : pedidos.length === 0
                      ? 'Aún no tienes pedidos recibidos.'
                      : 'No hay pedidos en este estado.'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
          }
          ListFooterComponent={(
            <View style={esSeccionEnvios ? { flexGrow: 1 } : undefined}>
              {esSeccionEnvios ? (
                <View style={[s.pagination, s.enviosPagination]}>
                  <View style={s.enviosPaginationTopRow}>
                    <Text style={s.enviosPaginationSummary}>
                      {enviosFiltrados.length === 0
                        ? '0 envíos'
                        : `Mostrando ${(paginaEnviosSegura - 1) * enviosPorPagina + 1}–${Math.min(paginaEnviosSegura * enviosPorPagina, enviosFiltrados.length)} de ${enviosFiltrados.length} envíos`}
                    </Text>
                    <View style={[s.paginationControls, s.enviosPaginationControls]}>
                      <TouchableOpacity
                        style={[s.enviosPageButton, paginaEnviosSegura === 1 && s.pageButtonDisabled]}
                        onPress={() => setPaginaEnvios((page) => Math.max(1, page - 1))}
                        disabled={paginaEnviosSegura === 1}
                      >
                        <Text style={s.enviosPageButtonText}>‹ Anterior</Text>
                      </TouchableOpacity>
                      {getPaginationItems(paginaEnviosSegura, totalPaginasEnvios).map((page) => (
                        typeof page === 'number' ? (
                          <TouchableOpacity
                            key={page}
                            style={[s.enviosPageNumber, paginaEnviosSegura === page && s.enviosPageNumberActive]}
                            onPress={() => setPaginaEnvios(page)}
                            accessibilityRole="button"
                            accessibilityLabel={`Página ${page}`}
                            accessibilityState={{ selected: paginaEnviosSegura === page }}
                          >
                            <Text style={[s.enviosPageNumberText, paginaEnviosSegura === page && s.enviosPageNumberTextActive]}>
                              {page}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text key={page} style={s.enviosPageEllipsis}>…</Text>
                        )
                      ))}
                      <TouchableOpacity
                        style={[s.enviosPageButton, paginaEnviosSegura === totalPaginasEnvios && s.pageButtonDisabled]}
                        onPress={() => setPaginaEnvios((page) => Math.min(totalPaginasEnvios, page + 1))}
                        disabled={paginaEnviosSegura === totalPaginasEnvios}
                      >
                        <Text style={s.enviosPageButtonText}>Siguiente ›</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[s.pageSizes, s.enviosPageSizes]}>
                      <Text style={s.pageSizeLabel}>Ver:</Text>
                      <TouchableOpacity
                        style={s.enviosPageSizeSelect}
                        onPress={() => setSelectorCantidadVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel={`Cantidad por página: ${enviosPorPagina}`}
                      >
                        <Text style={s.enviosPageSizeSelectText}>{enviosPorPagina} por pág.</Text>
                        <Text style={s.enviosPageSizeSelectArrow}>⌄</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : null}
              {!esSeccionEnvios ? (
                <View style={[s.pagination, s.enviosPagination]}>
                  <View style={s.enviosPaginationTopRow}>
                    <Text style={s.enviosPaginationSummary}>
                      {pedidosFiltrados.length === 0
                        ? '0 pedidos'
                        : `Mostrando ${(paginaPedidosSegura - 1) * pedidosPorPagina + 1}–${Math.min(paginaPedidosSegura * pedidosPorPagina, pedidosFiltrados.length)} de ${pedidosFiltrados.length} pedidos`}
                    </Text>
                    <View style={[s.paginationControls, s.enviosPaginationControls]}>
                      <TouchableOpacity
                        style={[s.enviosPageButton, paginaPedidosSegura === 1 && s.pageButtonDisabled]}
                        onPress={() => setPaginaPedidos((page) => Math.max(1, page - 1))}
                        disabled={paginaPedidosSegura === 1}
                      >
                        <Text style={s.enviosPageButtonText}>‹ Anterior</Text>
                      </TouchableOpacity>
                      {getPaginationItems(paginaPedidosSegura, totalPaginasPedidos).map((page) => (
                        typeof page === 'number' ? (
                          <TouchableOpacity
                            key={page}
                            style={[s.enviosPageNumber, paginaPedidosSegura === page && s.enviosPageNumberActive]}
                            onPress={() => setPaginaPedidos(page)}
                            accessibilityRole="button"
                            accessibilityLabel={`Página ${page}`}
                            accessibilityState={{ selected: paginaPedidosSegura === page }}
                          >
                            <Text style={[s.enviosPageNumberText, paginaPedidosSegura === page && s.enviosPageNumberTextActive]}>
                              {page}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text key={page} style={s.enviosPageEllipsis}>…</Text>
                        )
                      ))}
                      <TouchableOpacity
                        style={[s.enviosPageButton, paginaPedidosSegura === totalPaginasPedidos && s.pageButtonDisabled]}
                        onPress={() => setPaginaPedidos((page) => Math.min(totalPaginasPedidos, page + 1))}
                        disabled={paginaPedidosSegura === totalPaginasPedidos}
                      >
                        <Text style={s.enviosPageButtonText}>Siguiente ›</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[s.pageSizes, s.enviosPageSizes]}>
                      <Text style={s.pageSizeLabel}>Ver:</Text>
                      <TouchableOpacity
                        style={s.enviosPageSizeSelect}
                        onPress={() => setSelectorCantidadVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel={`Cantidad por página: ${pedidosPorPagina}`}
                      >
                        <Text style={s.enviosPageSizeSelectText}>{pedidosPorPagina} por pág.</Text>
                        <Text style={s.enviosPageSizeSelectArrow}>⌄</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : null}
              <View
                style={esSeccionEnvios
                  ? { flexGrow: 1, justifyContent: 'flex-end', marginHorizontal: -14 }
                  : { marginHorizontal: -9 }}
              >
                <Footer onLinkPress={() => {}} />
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={selectorCantidadVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorCantidadVisible(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setSelectorCantidadVisible(false)}
        >
          <View style={s.pageSizeModal}>
            <Text style={s.pageSizeModalTitle}>{esSeccionEnvios ? 'Envíos por página' : 'Pedidos por página'}</Text>
            {[8, 16, 24].map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  s.pageSizeModalOption,
                  (esSeccionEnvios ? enviosPorPagina : pedidosPorPagina) === size && s.pageSizeModalOptionActive,
                ]}
                onPress={() => {
                  if (esSeccionEnvios) {
                    setEnviosPorPagina(size);
                    setPaginaEnvios(1);
                  } else {
                    setPedidosPorPagina(size);
                    setPaginaPedidos(1);
                  }
                  setSelectorCantidadVisible(false);
                }}
              >
                <Text style={[
                  s.pageSizeModalOptionText,
                  (esSeccionEnvios ? enviosPorPagina : pedidosPorPagina) === size && s.pageSizeModalOptionTextActive,
                ]}>
                  {size} por página
                </Text>
                {(esSeccionEnvios ? enviosPorPagina : pedidosPorPagina) === size
                  ? <Text style={s.filterOptionCheck}>✓</Text>
                  : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={filtroEnviosVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFiltroEnviosVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.filterModal}>
            <View style={s.filterModalHeader}>
              <View style={s.filterModalTitleGroup}>
                <Text style={s.modalTitle}>Filtrar envíos</Text>
                <Text style={s.filterModalSubtitle}>Estado del envío y período</Text>
              </View>
              <TouchableOpacity onPress={() => setFiltroEnviosVisible(false)} accessibilityLabel="Cerrar filtros de envíos">
                <Text style={s.closeDetailText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={s.filterOptions} showsVerticalScrollIndicator={false}>
              <Text style={s.envioFilterSectionTitle}>Estado</Text>
              {FILTROS_ENVIOS.map((filtro) => {
                const activo = filtroEstadoEnvios === filtro.id;
                return (
                  <TouchableOpacity
                    key={filtro.id}
                    style={[
                      s.filterOption,
                      s.envioFilterOption,
                      activo && { backgroundColor: filtro.bg, borderColor: filtro.border },
                    ]}
                    onPress={() => {
                      setFiltroEstadoEnvios(filtro.id);
                      setPaginaEnvios(1);
                    }}
                  >
                    <View style={[s.envioFilterDot, { backgroundColor: filtro.color }]} />
                    <Text style={[s.filterOptionLabel, activo && { color: filtro.color }]}>
                      {filtro.label}
                    </Text>
                    <Text style={[s.filterOptionCount, activo && { color: filtro.color }]}>
                      {conteoEnvios[filtro.id]}
                    </Text>
                    {activo ? <Text style={[s.filterOptionCheck, { color: filtro.color }]}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}

              <Text style={s.envioFilterSectionTitle}>Período</Text>
              <View style={s.envioRangeOptions}>
                {RANGOS_ENVIOS.map((rango) => {
                  const activo = rangoEnvios === rango.id;
                  return (
                    <TouchableOpacity
                      key={rango.id}
                      style={[s.envioRangeOption, activo && s.envioRangeOptionActive]}
                      onPress={() => {
                        setRangoEnvios(rango.id);
                        setPaginaEnvios(1);
                      }}
                    >
                      <Text style={[s.envioRangeOptionText, activo && s.envioRangeOptionTextActive]}>
                        {rango.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={s.envioFilterActions}>
              <TouchableOpacity
                style={s.resetFilterButton}
                onPress={() => {
                  setFiltroEstadoEnvios('todos');
                  setRangoEnvios('todos');
                  setPaginaEnvios(1);
                }}
              >
                <Text style={s.resetFilterText}>Limpiar filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.applyFilterButton}
                onPress={() => setFiltroEnviosVisible(false)}
              >
                <Text style={s.applyFilterText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={filtroPedidosVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFiltroPedidosVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.filterModal}>
            <View style={s.filterModalHeader}>
              <View style={s.filterModalTitleGroup}>
                <Text style={s.modalTitle}>Filtrar pedidos</Text>
                <Text style={s.filterModalSubtitle}>Selecciona un estado o tipo de entrega</Text>
              </View>
              <TouchableOpacity onPress={() => setFiltroPedidosVisible(false)} accessibilityLabel="Cerrar filtros">
                <Text style={s.closeDetailText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={s.filterOptions}>
              {FILTROS_PEDIDOS.map((filtro) => {
                const activo = filtroEstadoPedidos === filtro.id;
                return (
                  <TouchableOpacity
                    key={filtro.id}
                    style={[s.filterOption, activo && s.filterOptionActive]}
                    onPress={() => {
                      setFiltroEstadoPedidos(filtro.id);
                      setPaginaPedidos(1);
                      setFiltroPedidosVisible(false);
                    }}
                  >
                    <Text style={s.filterOptionIcon}>{filtro.icon}</Text>
                    <Text style={[s.filterOptionLabel, activo && s.filterOptionLabelActive]}>{filtro.label}</Text>
                    {filtro.id === 'retiro_tienda' && retirosEnTienda > 0 ? (
                      <Text style={s.filterOptionAlert}>⏰ {retirosEnTienda} en tienda</Text>
                    ) : null}
                    <Text style={[s.filterOptionCount, activo && s.filterOptionLabelActive]}>
                      {conteoPedidos[filtro.id]}
                    </Text>
                    {activo ? <Text style={s.filterOptionCheck}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={s.resetFilterButton}
              onPress={() => {
                setFiltroEstadoPedidos('todos');
                setPaginaPedidos(1);
                setFiltroPedidosVisible(false);
              }}
            >
              <Text style={s.resetFilterText}>Limpiar filtro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                    {emp.nombre_empresa || emp.nombre}{empresaId === emp.id_empresa ? ' ✓' : ''}
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

      <Modal
        visible={Boolean(detallePedido)}
        transparent
        animationType="slide"
        onRequestClose={() => setDetallePedido(null)}
      >
        <View style={s.overlay}>
          <View style={s.detailModal}>
            <View style={s.detailModalHeader}>
              <View style={s.detailModalTitleGroup}>
                <Text style={s.modalTitle}>Detalle del pedido</Text>
                <Text style={s.modalSub}>
                  Orden #{detallePedido?.id_orden} · {detallePedido?.codigo_compra || ''}
                </Text>
              </View>
              <TouchableOpacity style={s.closeDetailBtn} onPress={() => setDetallePedido(null)} accessibilityLabel="Cerrar detalle">
                <Text style={s.closeDetailText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={s.detailModalScroll} showsVerticalScrollIndicator={false}>
              {(detallePedido?.items || []).map((libro, index) => {
                const cantidad = Number(libro.cantidad || 0);
                const precio = Number(libro.precio_libro || 0);
                const total = Number(libro.total_linea ?? (precio * cantidad));
                const imagen = getOrderImageUri(libro.imagen);
                return (
                  <View key={`${libro.id_libro}-${index}`} style={s.detailBookRow}>
                    <View style={s.detailBookThumb}>
                      {imagen ? <Image source={{ uri: imagen }} style={s.detailBookImage} resizeMode="cover" /> : <IconBook size={22} color={PRIMARY} />}
                    </View>
                    <View style={s.detailBookInfo}>
                      <Text style={s.detailBookTitle}>{libro.titulo || 'Libro sin título'}</Text>
                      {libro.autor_libro ? <Text style={s.muted}>{libro.autor_libro}</Text> : null}
                      <Text style={s.detailBookMeta}>Cantidad: {cantidad} · Unitario: ${precio.toLocaleString('es-CO')} COP</Text>
                    </View>
                    <Text style={s.detailBookTotal}>${total.toLocaleString('es-CO')} COP</Text>
                  </View>
                );
              })}
              <View style={s.detailOrderTotal}>
                <Text style={s.detailOrderTotalLabel}>Total de la tienda</Text>
                <Text style={s.detailOrderTotalValue}>
                  ${Number(
                    detallePedido?.tipo_entrega === 'retiro_tienda'
                      ? (detallePedido?.total_orden ?? detallePedido?.total_tienda ?? 0)
                      : (Number(detallePedido?.total_tienda || 0) + Number(detallePedido?.costo_envio_tienda || 0)),
                  ).toLocaleString('es-CO')} COP
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={s.closeDetailAction} onPress={() => setDetallePedido(null)}>
              <Text style={s.closeDetailActionText}>Cerrar</Text>
            </TouchableOpacity>
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
  safe:           { flex: 1, backgroundColor: BG },
  header:         { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, padding: 16, paddingTop: 12, gap: 12 },
  menuBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:       { color: WHITE, fontSize: 20, fontWeight: '700' },
  headerText:     { flex: 1, minWidth: 0 },
  title:          { fontSize: 18, fontWeight: '800', color: WHITE },
  subtitle:       { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  refreshButton:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 8, backgroundColor: WHITE, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 9 },
  refreshButtonText: { color: TEXT, fontSize: 10, fontWeight: '800' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { color: MUTED, fontSize: 14, textAlign: 'center' },
  ordersControls: { marginBottom: 8 },
  searchRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchBox:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 11, paddingHorizontal: 11 },
  searchInput:    { flex: 1, minWidth: 0, color: TEXT, fontSize: 12, paddingVertical: 10 },
  clearSearch:    { color: MUTED, fontSize: 20, paddingHorizontal: 3 },
  filterButton:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 40, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 11, paddingHorizontal: 10 },
  filterButtonActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterButtonText: { color: PRIMARY, fontSize: 11, fontWeight: '800' },
  filterButtonTextActive: { color: WHITE },
  filterCountDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: WHITE, marginLeft: 1 },
  filterModal:    { width: '100%', maxHeight: '78%', backgroundColor: WHITE, borderRadius: 18, padding: 18 },
  filterModalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  filterModalTitleGroup: { flex: 1 },
  filterModalSubtitle: { color: MUTED, fontSize: 11, marginTop: 3 },
  filterOptions:  { flexShrink: 1, marginTop: 8 },
  filterOption:   { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 46, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1EDE8', borderRadius: 9 },
  filterOptionActive: { backgroundColor: '#FDF0F3', borderColor: '#FDF0F3' },
  filterOptionIcon: { fontSize: 15 },
  filterOptionLabel: { flex: 1, color: TEXT, fontSize: 13, fontWeight: '700' },
  filterOptionLabelActive: { color: PRIMARY },
  filterOptionAlert: { color: '#b45309', fontSize: 9, fontWeight: '800' },
  filterOptionCount: { color: MUTED, fontSize: 11, fontWeight: '800' },
  filterOptionCheck: { color: PRIMARY, fontSize: 14, fontWeight: '900' },
  resetFilterButton: { alignItems: 'center', borderWidth: 1, borderColor: '#EAC8D2', borderRadius: 10, paddingVertical: 11, marginTop: 14 },
  resetFilterText: { color: PRIMARY, fontSize: 12, fontWeight: '800' },
  envioFilterSectionTitle: { color: TEXT, fontSize: 12, fontWeight: '800', marginTop: 14, marginBottom: 6 },
  envioFilterOption: { minHeight: 40, paddingVertical: 6 },
  envioFilterDot: { width: 9, height: 9, borderRadius: 5 },
  envioRangeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  envioRangeOption: { borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  envioRangeOptionActive: { backgroundColor: '#F8E7EC', borderColor: PRIMARY },
  envioRangeOptionText: { color: MUTED, fontSize: 11, fontWeight: '600' },
  envioRangeOptionTextActive: { color: PRIMARY, fontWeight: '800' },
  envioFilterActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  applyFilterButton: { flex: 1, alignItems: 'center', backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 12, marginTop: 14 },
  applyFilterText: { color: WHITE, fontSize: 12, fontWeight: '800' },
  listHeading:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  listHeadingTitle: { color: TEXT, fontSize: 14, fontWeight: '800' },
  listHeadingCount: { color: MUTED, fontSize: 10, textAlign: 'right' },
  emptyOrders:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20, gap: 12 },
  pagination:    { alignItems: 'center', backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, marginBottom: 14 },
  enviosPagination: { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', borderRadius: 0, borderLeftWidth: 0, borderRightWidth: 0, marginBottom: 0, paddingHorizontal: 24, paddingVertical: 12, gap: 10 },
  enviosPaginationTopRow: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 20, rowGap: 10 },
  enviosPaginationSummary: { flexGrow: 1, flexShrink: 1, minWidth: 220, color: MUTED, fontSize: 12 },
  paginationControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  enviosPaginationControls: { flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 },
  enviosPageSizes: { flexShrink: 0, marginTop: 0 },
  enviosPageButton: { minHeight: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 9, paddingHorizontal: 11 },
  enviosPageButtonText: { color: TEXT, fontSize: 12, fontWeight: '700' },
  enviosPageNumber: { minWidth: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 9 },
  enviosPageNumberActive: { backgroundColor: PRIMARY, borderColor: PRIMARY, elevation: 3, shadowColor: PRIMARY, shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  enviosPageNumberText: { color: TEXT, fontSize: 12, fontWeight: '700' },
  enviosPageNumberTextActive: { color: WHITE },
  enviosPageEllipsis: { color: MUTED, fontSize: 13, paddingHorizontal: 2 },
  pageButton:    { backgroundColor: '#F8E7EC', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: PRIMARY, fontSize: 11, fontWeight: '800' },
  pageNumber:    { minWidth: 38, textAlign: 'center', color: TEXT, fontSize: 12, fontWeight: '800' },
  pageSizes:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageSizeLabel: { color: MUTED, fontSize: 10 },
  enviosPageSizeSelect: { minWidth: 140, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 9, paddingHorizontal: 12 },
  enviosPageSizeSelectText: { color: TEXT, fontSize: 12, fontWeight: '700' },
  enviosPageSizeSelectArrow: { color: TEXT, fontSize: 16, marginTop: -4 },
  pageSizeModal: { width: '100%', maxWidth: 320, alignSelf: 'center', backgroundColor: WHITE, borderRadius: 14, padding: 16 },
  pageSizeModalTitle: { color: TEXT, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  pageSizeModalOption: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F1EDE8' },
  pageSizeModalOptionActive: { backgroundColor: '#FDF0F3', borderRadius: 8 },
  pageSizeModalOptionText: { color: TEXT, fontSize: 13 },
  pageSizeModalOptionTextActive: { color: PRIMARY, fontWeight: '800' },
  pageSizeButton: { minWidth: 28, alignItems: 'center', backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  pageSizeButtonActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pageSizeText:  { color: MUTED, fontSize: 10, fontWeight: '700' },
  pageSizeTextActive: { color: WHITE },
  orderGridRow:  { marginHorizontal: -5, alignItems: 'stretch' },
  orderGridItem: { width: '50%', paddingHorizontal: 5, paddingBottom: 10 },
  orderGridItemFullWidth: { width: '100%' },

  // tarjeta
  card:           { width: '100%', flex: 1, backgroundColor: WHITE, borderRadius: 13, marginBottom: 0, borderWidth: 1, borderColor: BORDER, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, flexDirection: 'row', overflow: 'hidden' },
  cardAccent:     { width: 5, borderRadius: 0 },
  cardInner:      { flex: 1, minWidth: 0, padding: 9 },
  cardHeader:     { flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4, marginBottom: 8 },
  ordenIdRow:     { gap: 2 },
  ordenId:        { fontSize: 14, fontWeight: '800', color: PRIMARY },
  ordenSub:       { fontSize: 9, color: MUTED },
  fecha:          { fontSize: 9, color: MUTED, fontWeight: '600', backgroundColor: '#F4F0EC', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },

  // cliente
  clienteBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FAFAF8', borderRadius: 8, padding: 7, marginBottom: 8 },
  clienteAvatar:  { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E3E8', overflow: 'hidden' },
  clienteAvatarImage: { width: '100%', height: '100%' },
  clienteAvatarText: { color: PRIMARY, fontSize: 11, fontWeight: '900' },
  clienteNombre:  { fontSize: 10, fontWeight: '700', color: TEXT },
  contactLine:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  phoneText:      { fontSize: 9, color: '#16803C', fontWeight: '700' },

  // productos
  productosBox:   { gap: 5, marginBottom: 8 },
  productoChip:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4F0EC', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 5 },
  productThumb:   { width: 22, height: 28, borderRadius: 4, marginRight: 5 },
  productoChipText: { fontSize: 9, color: TEXT, fontWeight: '600', flex: 1 },
  cantidadBadge:  { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2, marginLeft: 4 },
  cantidadText:   { color: WHITE, fontSize: 9, fontWeight: '800' },
  productActions: { flexDirection: 'column', alignItems: 'stretch', gap: 5, marginTop: 2 },
  unitsText:      { color: MUTED, fontSize: 9, fontWeight: '700' },
  detailBtn:      { alignItems: 'center', borderWidth: 1, borderColor: '#EAC8D2', borderRadius: 16, paddingHorizontal: 5, paddingVertical: 5, backgroundColor: WHITE },
  detailBtnText:  { color: PRIMARY, fontSize: 9, fontWeight: '800' },

  // estado + total
  estadoTotalRow: { flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  badge:          { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  badgeText:      { fontSize: 9, fontWeight: '700' },
  total:          { fontSize: 11, fontWeight: '800', color: PRIMARY },

  // guía
  guiaBox:        { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', paddingTop: 8, borderTopWidth: 1, borderColor: BORDER, gap: 6 },
  addressRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  orderAddress:   { marginTop: 10 },
  guiaInfo:       { flex: 1 },
  guiaEmpresa:    { fontSize: 10, fontWeight: '700', color: TEXT },
  guiaNro:        { fontSize: 9, color: MUTED, marginTop: 2 },
  sinGuia:        { fontSize: 9, color: '#888', fontStyle: 'italic' },
  guiaBtn:        { backgroundColor: '#F8E7EC', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#EAC8D2' },
  orderGuiaBtn:   { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9 },
  guiaBtnText:    { fontSize: 12, color: PRIMARY, fontWeight: '700' },
  orderGuiaBtnText: { fontSize: 9 },
  enviosControls: { marginBottom: 8 },
  enviosIntro:    { color: MUTED, fontSize: 11, lineHeight: 15, marginBottom: 7 },
  envioCard:      { width: '100%', flex: 1, backgroundColor: WHITE, borderRadius: 12, marginBottom: 0, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3, borderLeftColor: '#10A66A', padding: 9, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  envioHeader:    { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 5, paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: '#F1EDE8' },
  envioIdent:     { flex: 1 },
  envioCompra:    { color: PRIMARY, fontSize: 11, fontWeight: '800' },
  envioPedido:    { color: TEXT, fontSize: 9, fontWeight: '600', marginTop: 2 },
  envioBadge:     { overflow: 'hidden', borderRadius: 16, paddingHorizontal: 7, paddingVertical: 4, fontSize: 9, fontWeight: '800' },
  envioCorreo:    { color: MUTED, fontSize: 9, marginTop: 4 },
  envioFecha:     { color: MUTED, fontSize: 9, marginTop: 3 },
  envioGuia:      { backgroundColor: '#FAF8F5', borderRadius: 8, padding: 7, marginTop: 7 },
  envioEmpresa:   { color: TEXT, fontSize: 10, fontWeight: '700' },
  envioNumeroGuia:{ color: MUTED, fontSize: 9, marginTop: 3 },
  envioSinGuia:   { backgroundColor: '#FFF9E8', borderRadius: 8, padding: 7, marginTop: 7 },
  envioSinGuiaTexto: { color: '#856404', fontSize: 9, lineHeight: 13 },
  envioDireccion: { flex: 1, color: MUTED, fontSize: 9, lineHeight: 13, marginTop: 0 },
  envioAcciones:  { flexDirection: 'column', alignItems: 'stretch', gap: 5, marginTop: 7 },
  rastrearBtn:    { alignItems: 'center', backgroundColor: '#EEF4FA', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: '#D5E4F1' },
  rastrearBtnText:{ color: '#24547A', fontSize: 9, fontWeight: '700' },

  muted:          { fontSize: 11, color: MUTED },

  // modales
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalBox:       { backgroundColor: WHITE, borderRadius: 16, padding: 20, maxHeight: '80%' },
  detailModal:    { backgroundColor: WHITE, borderRadius: 18, padding: 18, maxHeight: '82%' },
  detailModalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  detailModalTitleGroup: { flex: 1 },
  closeDetailBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, borderRadius: 15 },
  closeDetailText: { color: TEXT, fontSize: 22, lineHeight: 25 },
  detailModalScroll: { flexGrow: 0 },
  detailBookRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1EDE8' },
  detailBookThumb: { width: 42, height: 52, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDF0F3', overflow: 'hidden' },
  detailBookImage: { width: '100%', height: '100%' },
  detailBookInfo: { flex: 1, minWidth: 0 },
  detailBookTitle: { color: TEXT, fontSize: 12, fontWeight: '800' },
  detailBookMeta: { color: MUTED, fontSize: 10, marginTop: 4 },
  detailBookTotal: { color: PRIMARY, fontSize: 10, fontWeight: '800', maxWidth: 82, textAlign: 'right' },
  detailOrderTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 14 },
  detailOrderTotalLabel: { color: TEXT, fontSize: 12, fontWeight: '700' },
  detailOrderTotalValue: { color: PRIMARY, fontSize: 14, fontWeight: '900' },
  closeDetailAction: { alignItems: 'center', backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 11, marginTop: 14 },
  closeDetailActionText: { color: WHITE, fontSize: 13, fontWeight: '800' },
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
const s = themeBaseS;
