const PRIMARY = '#7A1E3A';

export const ESTADO_STYLE = {
  pendiente: { bg: '#FFF3CD', color: '#856404' },
  pagado: { bg: '#D4EDDA', color: '#155724' },
  enviado: { bg: '#CCE5FF', color: '#004085' },
  entregada: { bg: '#E2D9F3', color: '#4A235A' },
  cancelada: { bg: '#F8D7DA', color: '#721C24' },
};

export const estadoLabel = (estado) =>
  ({
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    enviado: 'Enviado',
    entregada: 'Entregado',
    cancelada: 'Cancelado',
  }[estado] ?? estado);

export const ESTADOS_OPCIONES = ['pagado', 'enviado', 'cancelada'];

export const FILTROS_ENVIOS = [
  { id: 'todos', label: 'Todos', clases: null, color: PRIMARY, bg: '#F8E7EC', border: PRIMARY },
  { id: 'transito', label: 'En tránsito', clases: ['camino', 'procesando'], color: '#1D68A8', bg: '#EAF3FF', border: '#8FC5F5' },
  { id: 'entregados', label: 'Entregados', clases: ['entregado'], color: '#087A49', bg: '#E7F8EF', border: '#8BE3B0' },
  { id: 'sin_guia', label: 'Sin guía', clases: ['alerta'], color: '#C7374E', bg: '#FFF0F1', border: '#F49AA5' },
];

export const RANGOS_ENVIOS = [
  { id: 'todos', label: 'Todos', dias: null },
  { id: 'hoy', label: 'Hoy', dias: 0 },
  { id: '7d', label: '7 días', dias: 6 },
  { id: '30d', label: '30 días', dias: 29 },
  { id: '90d', label: '90 días', dias: 89 },
];

export const getPaginationItems = (currentPage, totalPages) => {
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

export const normalizarEstado = (estado) => {
  const raw = String(estado || '').toLowerCase().trim();
  if (['pagado', 'pagada', 'aprobado', 'aprobada'].includes(raw)) return 'pagado';
  if (['enviado', 'enviada', 'en_camino'].includes(raw)) return 'enviado';
  if (['entregado', 'entregada', 'completado', 'completada'].includes(raw)) return 'entregada';
  if (['cancelado', 'cancelada', 'anulado', 'anulada'].includes(raw)) return 'cancelada';
  return 'pendiente';
};

export const FILTROS_PEDIDOS = [
  { id: 'todos', label: 'Todos', icon: '📦' },
  { id: 'retiro_tienda', label: 'Retiros', icon: '🏪' },
  { id: 'pendiente', label: 'Pendientes', icon: '⏳' },
  { id: 'pagado', label: 'Pagadas', icon: '💳' },
  { id: 'enviado', label: 'Enviadas', icon: '🚚' },
  { id: 'entregada', label: 'Entregadas', icon: '✅' },
  { id: 'cancelada', label: 'Canceladas', icon: '❌' },
];

export const parseFechaPedido = (fecha) => {
  if (!fecha) return new Date();
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const [year, month, day] = fecha.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(fecha);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const infoEstadoEnvio = (pedido) => {
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

export const ESTADO_ENVIO_STYLE = {
  entregado: { bg: '#D4EDDA', color: '#155724' },
  alerta: { bg: '#FFF3CD', color: '#856404' },
  camino: { bg: '#CCE5FF', color: '#004085' },
  procesando: { bg: '#E8EAF6', color: '#3949AB' },
  devolucion: { bg: '#F8D7DA', color: '#721C24' },
  pendiente: { bg: '#F1F1F1', color: '#666666' },
};
