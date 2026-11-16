import { jwtDecode } from "jwt-decode";
import { resolveLibroCandidate } from "../utils/catalogo";
export {
  categoriaColor,
  parseTiendaInfo,
  tiempoTranscurrido,
  resolveImageUrl,
  resolveLibroCandidate,
} from "../utils/catalogo";

export const formatPrecio = (valor) => {
  if (!valor && valor !== 0) return "$0 COP";
  return `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Math.floor(valor))} COP`;
};

export const normalizarEstado = (estado) => {
  const raw = String(estado || "").toLowerCase().trim();
  if (["pagado", "pagada", "aprobado", "aprobada"].includes(raw)) return "pagado";
  if (["enviado", "enviada", "en_camino"].includes(raw)) return "enviado";
  if (["entregado", "entregada", "completado", "completada"].includes(raw)) return "entregada";
  if (["cancelado", "cancelada", "anulado", "anulada"].includes(raw)) return "cancelada";
  return "pendiente";
};

export const FILTROS_ENVIOS = [
  { id: "todos", label: "Todos", clases: null },
  { id: "transito", label: "En tránsito", clases: ["camino", "procesando"] },
  { id: "entregados", label: "Entregados", clases: ["entregado"] },
  { id: "sin_guia", label: "Sin guía", clases: ["alerta"] },
];

export const RANGOS_ENVIOS = [
  { id: "todos", label: "Todos los tiempos", dias: null },
  { id: "hoy", label: "Hoy", dias: 0 },
  { id: "7d", label: "Últimos 7 días", dias: 6 },
  { id: "30d", label: "Últimos 30 días", dias: 29 },
  { id: "90d", label: "Últimos 90 días", dias: 89 },
];

export const parseFechaPedido = (d) => {
  if (!d) return new Date();
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, dd] = d.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, dd);
  }
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
};

export const infoEstadoEnvio = (pedido) => {
  const estNorm = normalizarEstado(pedido.estado);
  const envio = pedido.envio;
  if (!envio) {
    if (estNorm === "entregada") return { clase: "entregado", texto: "Entregado" };
    if (estNorm === "pagado" || estNorm === "enviado") return { clase: "alerta", texto: "Sin guía" };
    return { clase: "pendiente", texto: "Pendiente" };
  }
  const raw = String(envio.estado_envio || "").toLowerCase().trim();
  if (!raw) {
    if (estNorm === "entregada") return { clase: "entregado", texto: "Entregado" };
    return { clase: "camino", texto: "En tránsito" };
  }
  if (/entregad|complet|recibid|finaliz|exitoso|despachad/.test(raw)) return { clase: "entregado", texto: "Entregado" };
  if (/transito|en viaje|en ruta|camino|enviad|traslado|adelanto|forzado|registrad|cread|generad|emitid/.test(raw)) return { clase: "camino", texto: "En tránsito" };
  if (/devolu|rechaz|no entregad|excepci|nov/.test(raw)) return { clase: "devolucion", texto: "Devolución" };
  return { clase: "procesando", texto: raw.charAt(0).toUpperCase() + raw.slice(1) };
};

export const getLibroImageUrl = (libro) => {
  const candidates = [
    libro?.imagen_url,
    libro?.imagen_principal,
    libro?.imagen_principal_url,
    libro?.imagenes,
    libro?.foto,
  ];

  for (const candidate of candidates) {
    const resolved = resolveLibroCandidate(candidate);
    if (resolved) return resolved;
  }

  return null;
};

export const ESTADOS = [
  { value: "nuevo",             label: "Nuevo" },
  { value: "usado_buen_estado", label: "Usado — buen estado" },
  { value: "usado_regular",     label: "Usado — estado regular" },
];

export const getCategoriaBadgeStyle = (cat = '') => {
  const t = (cat || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (t.includes('terror'))     return { bg: '#eee8f7', color: '#603a92', border: '#d8b4fe' };
  if (t.includes('ciencia'))    return { bg: '#e4f5e9', color: '#1f7a45', border: '#86efac' };
  if (t.includes('romance'))    return { bg: '#fde8ef', color: '#b4235d', border: '#f9a8d4' };
  if (t.includes('fantasia'))   return { bg: '#e9edff', color: '#4156a6', border: '#a5b4fc' };
  if (t.includes('historia'))   return { bg: '#f8eddb', color: '#8c5a1d', border: '#fcd34d' };
  if (t.includes('tecnologia')) return { bg: '#e2f4f6', color: '#137783', border: '#67e8f9' };
  if (t.includes('juvenil'))    return { bg: '#fff2d7', color: '#a25d00', border: '#fed7aa' };
  if (t.includes('infantil'))   return { bg: '#e4f4ff', color: '#2775a7', border: '#7dd3fc' };
  if (t.includes('aventura'))   return { bg: '#fff0df', color: '#b85f11', border: '#fdba74' };
  if (t.includes('arte'))       return { bg: '#f4e6f6', color: '#86418f', border: '#f0abfc' };
  if (t.includes('biografia'))  return { bg: '#e8eef8', color: '#365d96', border: '#93c5fd' };
  if (t.includes('educacion'))  return { bg: '#e8f3e9', color: '#397542', border: '#86efac' };
  if (t.includes('filosofia'))  return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
  if (t.includes('poesia'))     return { bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' };
  if (t.includes('comedia'))    return { bg: '#fef9c3', color: '#a16207', border: '#fef08a' };
  if (t.includes('ficcion'))    return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  return { bg: '#f4eef0', color: '#7A1E3A', border: '#fbcfe8' };
};

export const initials = (name = '') => name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export const AVATAR_COLORS = ['#7A1E3A','#1e4d8a','#1e7a45','#7a5c00','#5a1e7a','#1e6a7a'];
export const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] || '#7A1E3A';

export const getSellerMediaStorageKey = (key) => {
  const token = localStorage.getItem("token");
  if (!token) return key;

  try {
    const payload = jwtDecode(token);
    const userId = payload?.sub || payload?.id || payload?.usuario_id || payload?.user_id;
    if (!userId) return key;
    return `${key}_${userId}`;
  } catch {
    return key;
  }
};

export const clearLegacySellerMediaCache = () => {
  localStorage.removeItem('vendedor_user_photo_url');
  localStorage.removeItem('vendedor_banner_url');
};
