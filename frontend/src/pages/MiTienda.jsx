// src/pages/MiTienda.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api, { getApiBaseUrl, habilitarPagoRetiro, confirmarEntregaRetiro } from "../services/api";
import { notificacionesService } from "../services/notificaciones";
import SeccionOfertas from "../components/SeccionOfertas";
import SeccionCuponesVendedor from "../components/SeccionCuponesVendedor";
import SeccionSuscripciones from "../components/SeccionSuscripciones";
import SeccionImpulsos from "../components/SeccionImpulsos";
import SellerSidebar from "../components/VendedorSidebar";
import Chat from './Chat';
import QuejasVendedor from './QuejasVendedor';
import Soporte from './Soporte';

// Función para colores de categorías
const categoriaColor = (categoria = '', dark = false) => {
  const texto = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (dark) {
    if (texto.includes('terror')) return { bg: '#1e1530', color: '#b48ce8' };
    if (texto.includes('ciencia') || texto.includes('cientifica')) return { bg: '#0f2e1a', color: '#4ade80' };
    if (texto.includes('romance')) return { bg: '#2e0d1e', color: '#f472b6' };
    if (texto.includes('fantasia')) return { bg: '#0d1a3c', color: '#818cf8' };
    if (texto.includes('historia')) return { bg: '#2a1a08', color: '#fbbf24' };
    if (texto.includes('tecnologia')) return { bg: '#0a2a2e', color: '#22d3ee' };
    if (texto.includes('juvenil')) return { bg: '#2a1e00', color: '#fcd34d' };
    if (texto.includes('infantil')) return { bg: '#0a1e30', color: '#60a5fa' };
    if (texto.includes('aventura')) return { bg: '#2a1500', color: '#fb923c' };
    if (texto.includes('arte')) return { bg: '#1e0a24', color: '#d8b4fe' };
    if (texto.includes('biografia')) return { bg: '#0d1f3c', color: '#7dd3fc' };
    if (texto.includes('educacion')) return { bg: '#0f2e18', color: '#6ee7b7' };
    if (texto.includes('ficcion')) return { bg: '#2e0d0d', color: '#f87171' };
    if (texto.includes('comedia')) return { bg: '#2a2008', color: '#fcd34d' };
    return { bg: '#2a1a24', color: '#e05a7a' };
  }
  if (texto.includes('terror')) return { bg: '#eee8f7', color: '#603a92' };
  if (texto.includes('ciencia') || texto.includes('cientifica')) return { bg: '#e4f5e9', color: '#1f7a45' };
  if (texto.includes('romance')) return { bg: '#fde8ef', color: '#b4235d' };
  if (texto.includes('fantasia')) return { bg: '#e9edff', color: '#4156a6' };
  if (texto.includes('historia')) return { bg: '#f8eddb', color: '#8c5a1d' };
  if (texto.includes('tecnologia')) return { bg: '#e2f4f6', color: '#137783' };
  if (texto.includes('juvenil')) return { bg: '#fff2d7', color: '#a25d00' };
  if (texto.includes('infantil')) return { bg: '#e4f4ff', color: '#2775a7' };
  if (texto.includes('aventura')) return { bg: '#fff0df', color: '#b85f11' };
  if (texto.includes('arte')) return { bg: '#f4e6f6', color: '#86418f' };
  if (texto.includes('biografia')) return { bg: '#e8eef8', color: '#365d96' };
  if (texto.includes('educacion')) return { bg: '#e8f3e9', color: '#397542' };
  if (texto.includes('ficcion')) return { bg: '#fce4ec', color: '#8b0000' };
  if (texto.includes('comedia')) return { bg: '#fff8db', color: '#a25d00' };
  return { bg: '#f4eef0', color: '#7a1e3a' };
};
import {
  IconBook,
  IconBookOpen,
  IconChartBar,
  IconStar,
  IconUser,
  IconSettings,
  IconCheck,
  IconLock,
  IconPackage,
  IconMessage,
  IconGift,
  IconShoppingBag,
  IconTruck,
  IconCreditCard,
  IconInfo,
  IconRefresh,
  IconCalendar,
  IconSearch,
  IconPlus,
  IconTrash,
  IconDollar,
  IconEye,
  IconClose,
  IconMapPin,
  IconAlertTriangle
} from "../components/Icons";
import "../styles/Notificaciones.css";


// ========================
// Utilidades y constantes
// ========================
const formatPrecio = (valor) => {
  if (!valor && valor !== 0) return "$0 COP";
  return "$" + String(Math.floor(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " COP";
};

const normalizarEstado = (estado) => {
  const raw = String(estado || "").toLowerCase().trim();
  if (["pagado", "pagada", "aprobado", "aprobada"].includes(raw)) return "pagado";
  if (["enviado", "enviada", "en_camino"].includes(raw)) return "enviado";
  if (["entregado", "entregada", "completado", "completada"].includes(raw)) return "entregada";
  if (["cancelado", "cancelada", "anulado", "anulada"].includes(raw)) return "cancelada";
  return "pendiente";
};

const FILTROS_ENVIOS = [
  { id: "todos", label: "Todos", clases: null },
  { id: "transito", label: "En tránsito", clases: ["camino", "procesando"] },
  { id: "entregados", label: "Entregados", clases: ["entregado"] },
  { id: "sin_guia", label: "Sin guía", clases: ["alerta"] },
];

const RANGOS_ENVIOS = [
  { id: "todos", label: "Todos los tiempos", dias: null },
  { id: "hoy", label: "Hoy", dias: 0 },
  { id: "7d", label: "Últimos 7 días", dias: 6 },
  { id: "30d", label: "Últimos 30 días", dias: 29 },
  { id: "90d", label: "Últimos 90 días", dias: 89 },
];

const parseFechaPedido = (d) => {
  if (!d) return new Date();
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, dd] = d.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, dd);
  }
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? new Date() : dt;
};

const infoEstadoEnvio = (pedido) => {
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

const resolveImageUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${getApiBaseUrl()}${trimmed}`;
  return `${getApiBaseUrl()}/${trimmed}`;
};

const resolveLibroCandidate = (candidate) => {
  if (!candidate) return null;
  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      const resolved = resolveImageUrl(item);
      if (resolved) return resolved;
    }
    return null;
  }
  if (typeof candidate === "string" && candidate.includes(",")) {
    for (const part of candidate.split(",")) {
      const resolved = resolveImageUrl(part);
      if (resolved) return resolved;
    }
    return null;
  }
  return resolveImageUrl(candidate);
};

const getLibroImageUrl = (libro) => {
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

const ESTADOS = [
  { value: "nuevo",             label: "Nuevo" },
  { value: "usado_buen_estado", label: "Usado — buen estado" },
  { value: "usado_regular",     label: "Usado — estado regular" },
];

const BadgeEstado = ({ estado, darkMode = false }) => {
  const map = {
    nuevo:             { label: "Nuevo",        color: "#d1fae5", text: "#065f46", darkBg: "#0d2e23", darkText: "#a7f3d0", darkBorder: "#1f7a5d" },
    usado_buen_estado: { label: "Buen estado",  color: "#dbeafe", text: "#1e40af", darkBg: "#0e1d39", darkText: "#bfdbfe", darkBorder: "#3b82f6" },
    usado_regular:     { label: "Est. regular", color: "#fef3c7", text: "#92400e", darkBg: "#2a1a00", darkText: "#fbbf24", darkBorder: "#b45309" },
  };
  const s = map[estado] || { label: estado, color: "#f3f4f6", text: "#374151", darkBg: "#1f2937", darkText: "#e5e7eb", darkBorder: "#374151" };
  return (
    <span style={{
      background: darkMode ? s.darkBg : s.color,
      color: darkMode ? s.darkText : s.text,
      border: `1px solid ${darkMode ? s.darkBorder : 'transparent'}`,
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "0.72rem",
      fontWeight: 700,
      display: "inline-block",
      whiteSpace: "nowrap"
    }}>
      {s.label}
    </span>
  );
};

const getCategoriaBadgeStyle = (cat = '') => {
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

const BadgeCategoriaLibro = ({ categoria, darkMode = false }) => {
  if (!categoria) return <span style={{ color: '#a8a29e', fontSize: '0.8rem' }}>—</span>;
  const s = getCategoriaBadgeStyle(categoria);
  return (
    <span
      className="libro-category-pill"
      style={{
        backgroundColor: darkMode ? `${s.bg}cc` : s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '0.74rem',
        fontWeight: 700,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        boxShadow: darkMode ? 'inset 0 0 0 1px rgba(255,255,255,0.02)' : 'none'
      }}
    >
      {categoria}
    </span>
  );
};

// ========================
// Componentes auxiliares
// ========================
function AlertaStock({ alertas, umbral }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  
  useEffect(() => {
    const handleDarkModeChange = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handleDarkModeChange);
    window.addEventListener('storage', handleDarkModeChange);
    return () => { 
      window.removeEventListener('darkModeChange', handleDarkModeChange); 
      window.removeEventListener('storage', handleDarkModeChange); 
    };
  }, []);

  if (!alertas || alertas.length === 0) return null;
  
  const containerStyle = darkMode ? {
    background: "#2a1a00",
    border: "1.5px solid #4a3a00",
    color: "#fbbf24"
  } : {
    background: "#fefce8",
    border: "1.5px solid #fde68a",
    color: "#92400e"
  };

  const iconColor = darkMode ? "#fbbf24" : "#92400e";
  const titleColor = darkMode ? "#fbbf24" : "#92400e";
  const subtitleColor = darkMode ? "#d4a517" : "#854d0e";

  return (
    <div style={{
      ...containerStyle,
      borderRadius: "10px",
      padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "12px",
    }}>
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: '2px' }}><IconLock width={20} height={20} strokeWidth={2} style={{ color: iconColor }} /></span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "0.92rem", color: titleColor }}>
          {alertas.length === 1 ? "1 libro con stock bajo" : `${alertas.length} libros con stock bajo`}
        </p>
        <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: subtitleColor }}>
          Alerta configurada para {umbral} unidad{Number(umbral) === 1 ? "" : "es"} o menos.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {alertas.map((libro, i) => {
            const isOutOfStock = libro.stock === 0;
            const tagStyle = darkMode 
              ? (isOutOfStock 
                  ? { background: "#2a1a18", color: "#f87171", border: "1px solid #4a2a3a" }
                  : { background: "#2a1a00", color: "#fbbf24", border: "1px solid #4a3a00" })
              : (isOutOfStock
                  ? { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" }
                  : { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" });
            
            return (
              <span key={i} style={{
                ...tagStyle,
                borderRadius: "20px", padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700,
              }}>
                {libro.titulo} — {isOutOfStock ? "Sin stock" : `${libro.stock} uds`}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ModalEditarLibro({ libro, categorias, onClose, onGuardado }) {
  const [form, setForm] = useState({
    id_categoria:      libro.id_categoria,
    titulo:            libro.titulo,
    autor_libro:       libro.autor_libro,
    descripcion_libro: libro.descripcion_libro,
    precio_libro:      libro.precio_libro,
    stock:             libro.stock,
    estado_libro:      libro.estado_libro,
  });
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState("");

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim())            return setError("El título es obligatorio");
    if (!form.autor_libro.trim())       return setError("El autor es obligatorio");
    if (!form.id_categoria)             return setError("Selecciona una categoría");
    if (Number(form.precio_libro) <= 0) return setError("El precio debe ser mayor a 0");
    if (Number(form.stock) < 0)         return setError("El stock no puede ser negativo");
    setCargando(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      await api.put(`/libros/${libro.id_libro}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar los cambios");
    } finally { setCargando(false); }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar libro</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-grid">
            <div className="form-group">
              <label>Título *</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} maxLength={100} />
            </div>
            <div className="form-group">
              <label>Autor *</label>
              <input name="autor_libro" value={form.autor_libro} onChange={handleChange} maxLength={50} />
            </div>
            <div className="form-group">
              <label>Categoría *</label>
              <select name="id_categoria" value={form.id_categoria} onChange={handleChange}>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Estado *</label>
              <select name="estado_libro" value={form.estado_libro} onChange={handleChange}>
                {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Precio (COP) *</label>
              <input name="precio_libro" type="number" min="1" value={form.precio_libro} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Stock *</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Descripción *
              <span style={{ float: "right", color: "#bbb", fontWeight: 500, fontSize: "0.78rem" }}>
                {form.descripcion_libro.length}/300
              </span>
            </label>
            <textarea name="descripcion_libro" maxLength={300} rows={3}
              value={form.descripcion_libro} onChange={handleChange} />
          </div>
          {error && <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /> {error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose} disabled={cargando}>Cancelar</button>
            <button type="submit" className="btn btn-vinotinto" disabled={cargando}>
              {cargando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalEliminar({ libro, onClose, onEliminado }) {
  // ========================
  // Estado del modal de eliminación
  // ========================
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState("");

  const confirmar = async () => {
    setCargando(true);
    try {
      await api.delete(`/libros/${libro.id_libro}`);
      onEliminado();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al eliminar");
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Eliminar libro</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <div style={{ padding: "8px 0 20px" }}>
          <p style={{ color: "#444", marginBottom: "6px" }}>
            ¿Estás seguro de que quieres eliminar <strong>"{libro.titulo}"</strong>?
          </p>
          <p style={{ fontSize: "0.85rem", color: "#888" }}>Esta acción no se puede deshacer.</p>
        </div>
        {error && <div className="form-error" style={{ marginBottom: "16px", display: 'flex', alignItems: 'center', gap: '4px' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /> {error}</div>}
        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose} disabled={cargando}>Cancelar</button>
          <button className="btn-eliminar" onClick={confirmar} disabled={cargando}>
            {cargando ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalStock({ libro, onClose, onActualizado }) {
  // ========================
  // Estado del modal de stock
  // ========================
  const [stock,    setStock]    = useState(libro.stock);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState("");

  const guardar = async () => {
    if (stock < 0) return setError("El stock no puede ser negativo");
    setCargando(true);
    try {
      const data = new FormData();
      data.append("stock", stock);
      await api.patch(`/libros/${libro.id_libro}/stock`, data, { headers: { "Content-Type": "multipart/form-data" } });
      onActualizado();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al actualizar stock");
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestionar stock</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "20px" }}>
          <strong>{libro.titulo}</strong>
        </p>
        <div className="stock-control">
          <button className="stock-btn" onClick={() => setStock(Math.max(0, stock - 1))}>−</button>
          <input type="number" min="0" value={stock}
            onChange={(e) => setStock(Number(e.target.value))} className="stock-input" />
          <button className="stock-btn" onClick={() => setStock(stock + 1)}>+</button>
        </div>
        {error && <div className="form-error" style={{ margin: "12px 0", display: 'flex', alignItems: 'center', gap: '4px' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /> {error}</div>}
        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button className="btn-outline" onClick={onClose} disabled={cargando}>Cancelar</button>
          <button className="btn btn-vinotinto" onClick={guardar} disabled={cargando}>
            {cargando ? "Guardando…" : "Guardar stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MODAL VENTA FÍSICA (POS - Punto de Venta) ================= */
function ModalVentaFisica({ libro: libroInicial, libros = [], onClose, onVendido }) {
  const [selectedLibroId, setSelectedLibroId] = useState(libroInicial?.id_libro || "");
  const [dropdownAbierto, setDropdownAbierto] = useState(!libroInicial?.id_libro);
  const [busqueda, setBusqueda] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [comprador, setComprador] = useState("");
  const [nota, setNota] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  // Encontrar el libro seleccionado actual
  const libroActual = useMemo(() => {
    if (selectedLibroId) {
      return (libros || []).find(l => String(l.id_libro) === String(selectedLibroId)) || libroInicial;
    }
    return null;
  }, [selectedLibroId, libros, libroInicial]);

  // Libros filtrados por la búsqueda en el dropdown
  const librosFiltrados = useMemo(() => {
    return (libros || []).filter(l => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        (l.titulo || "").toLowerCase().includes(q) ||
        (l.autor_libro || "").toLowerCase().includes(q) ||
        (l.nombre_categoria || "").toLowerCase().includes(q)
      );
    });
  }, [libros, busqueda]);

  const stockActual = Number(libroActual?.stock || 0);
  const maxVenta = Math.max(stockActual, 0);

  const confirmarVenta = async () => {
    if (!libroActual) return setError("Por favor selecciona un libro");
    if (cantidad <= 0) return setError("Debes vender al menos 1 unidad");
    if (cantidad > stockActual) return setError(`Solo tienes ${stockActual} unidad(es) disponibles`);
    setCargando(true);
    setError("");
    try {
      const nuevoStock = stockActual - cantidad;
      const data = new FormData();
      data.append("stock", nuevoStock);
      await api.patch(`/libros/${libroActual.id_libro}/stock`, data, { headers: { "Content-Type": "multipart/form-data" } });
      setExito(true);
      setTimeout(() => { onVendido(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al registrar la venta");
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '94%',
          minHeight: '560px',
          padding: '30px 32px 34px',
          borderRadius: '18px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.22)'
        }}
      >
        <div className="modal-header" style={{ marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
            <IconShoppingBag width={24} height={24} strokeWidth={2.2} style={{ color: '#7A1E3A' }} />
            Registrar Venta Presencial
          </h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        {exito ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', margin: 'auto 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <IconCheck width={32} height={32} strokeWidth={2.5} style={{ color: '#16a34a' }} />
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#065f46', fontWeight: 800, fontSize: '1.25rem' }}>¡Venta registrada con éxito!</h3>
            <p style={{ margin: 0, color: '#78716c', fontSize: '0.92rem' }}>
              Se descontaron <strong>{cantidad} unidad(es)</strong> de <strong>"{libroActual?.titulo}"</strong>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Selector de libro */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#57534e' }}>
                  Libro a vender *
                </label>
                {libroActual && (
                  <button
                    type="button"
                    onClick={() => setDropdownAbierto(prev => !prev)}
                    style={{ background: 'none', border: 'none', color: '#7A1E3A', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {dropdownAbierto ? "Ocultar catálogo" : "Cambiar libro"}
                  </button>
                )}
              </div>

              {/* Botón trigger del selector */}
              <div
                onClick={() => setDropdownAbierto(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  background: '#ffffff',
                  border: `1.5px solid ${dropdownAbierto ? '#7A1E3A' : '#e0dad1'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: dropdownAbierto ? '0 0 0 3px rgba(122, 30, 58, 0.1)' : 'none'
                }}
              >
                {libroActual ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 34, height: 46, borderRadius: '6px', background: '#ede6df', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(() => {
                        const img = getLibroImageUrl(libroActual);
                        return img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <IconBook width={18} height={18} strokeWidth={1.8} style={{ color: '#7A1E3A' }} />;
                      })()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 750, color: '#2A2A2A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {libroActual.titulo}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#78716c' }}>
                        {libroActual.autor_libro || "Autor"} • <strong style={{ color: '#7A1E3A' }}>{formatPrecio(libroActual.precio_libro)}</strong> • <span style={{ color: Number(libroActual.stock) > 0 ? '#15803d' : '#b91c1c', fontWeight: 700 }}>{Number(libroActual.stock) > 0 ? `${libroActual.stock} uds` : "Agotado"}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: '#8c857b', fontSize: '0.88rem', fontWeight: 550, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconSearch width={16} height={16} strokeWidth={2} style={{ color: '#7A1E3A' }} /> Seleccionar un libro del catálogo...
                  </span>
                )}
                <span style={{ fontSize: '0.8rem', color: '#78716c', marginLeft: '8px' }}>
                  {dropdownAbierto ? '▲' : '▼'}
                </span>
              </div>

              {/* Lista Desplegable integrada */}
              {dropdownAbierto && (
                <div style={{
                  marginTop: '8px',
                  background: '#ffffff',
                  border: '1.5px solid #e0dad1',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}>
                  {/* Buscador interno */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0ebe4', background: '#faf8f5', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconSearch width={16} height={16} strokeWidth={2} style={{ color: '#8c857b' }} />
                    <input
                      type="text"
                      placeholder="Buscar por título, autor o categoría..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: '0.84rem',
                        fontFamily: 'inherit',
                        color: '#2A2A2A'
                      }}
                    />
                    {busqueda && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setBusqueda(""); }}
                        style={{ border: 'none', background: 'transparent', color: '#a8a29e', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Lista de libros */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {librosFiltrados.length === 0 ? (
                      <div style={{ padding: '20px 14px', textAlign: 'center', color: '#8c857b', fontSize: '0.84rem' }}>
                        No se encontraron libros con ese término
                      </div>
                    ) : (
                      librosFiltrados.map(l => {
                        const img = getLibroImageUrl(l);
                        const isSelected = String(l.id_libro) === String(selectedLibroId);
                        const isOut = Number(l.stock) <= 0;

                        return (
                          <div
                            key={l.id_libro}
                            onClick={() => {
                              if (isOut) return;
                              setSelectedLibroId(l.id_libro);
                              setDropdownAbierto(false);
                              setCantidad(1);
                              setError("");
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 14px',
                              borderBottom: '1px solid #f7f4ef',
                              cursor: isOut ? 'not-allowed' : 'pointer',
                              background: isSelected ? '#fdf2f4' : 'transparent',
                              opacity: isOut ? 0.45 : 1,
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected && !isOut) e.currentTarget.style.backgroundColor = '#faf7f4';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{ width: 34, height: 46, borderRadius: '6px', background: '#ede6df', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0dad1' }}>
                              {img ? (
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <IconBook width={16} height={16} strokeWidth={1.8} style={{ color: '#7A1E3A' }} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: '0 0 2px', fontSize: '0.86rem', fontWeight: 750, color: '#2A2A2A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {l.titulo}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.76rem', color: '#78716c' }}>
                                {l.autor_libro || "Autor"} • <span style={{ color: '#7A1E3A', fontWeight: 750 }}>{formatPrecio(l.precio_libro)}</span>
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '10px',
                                background: isOut ? '#fef2f2' : '#ecfdf5',
                                color: isOut ? '#b91c1c' : '#065f46',
                                border: `1px solid ${isOut ? '#fecaca' : '#a7f3d0'}`
                              }}>
                                {isOut ? "Agotado" : `${l.stock} uds`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Formulario de venta cuando el libro está seleccionado */}
            {!libroActual ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', background: '#faf8f5', borderRadius: '12px', border: '1px dashed #dcd5cb', color: '#8c857b', margin: 'auto 0', fontSize: '0.88rem' }}>
                👆 Por favor selecciona un libro de la lista arriba para registrar la venta
              </div>
            ) : stockActual <= 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fca5a5', marginBottom: '16px' }}>
                <p style={{ color: '#991b1b', fontWeight: 700, margin: '0 0 4px', fontSize: '0.95rem' }}>Este libro está agotado (0 existencias)</p>
                <p style={{ color: '#78716c', fontSize: '0.82rem', margin: 0 }}>Debes actualizar el inventario antes de registrar ventas presenciales.</p>
              </div>
            ) : (
              <div style={{ marginTop: 'auto' }}>
                {/* Cantidad a vender */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#57534e', marginBottom: '6px' }}>Cantidad vendida *</label>
                  <div className="stock-control">
                    <button className="stock-btn" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>−</button>
                    <input type="number" min="1" max={maxVenta} value={cantidad}
                      onChange={(e) => setCantidad(Math.min(maxVenta, Math.max(1, Number(e.target.value))))} className="stock-input" />
                    <button className="stock-btn" onClick={() => setCantidad(Math.min(maxVenta, cantidad + 1))}>+</button>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: '#a8a29e' }}>
                    Stock actual: {stockActual} → Quedará: <strong style={{ color: stockActual - cantidad <= 0 ? '#991b1b' : '#065f46' }}>{Math.max(0, stockActual - cantidad)} uds</strong>
                  </p>
                </div>

                {/* Comprador (opcional) */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#57534e', marginBottom: '6px' }}>Nombre del comprador <span style={{ fontWeight: 500, color: '#a8a29e' }}>(opcional)</span></label>
                  <input type="text" value={comprador} onChange={(e) => setComprador(e.target.value)}
                    placeholder="Ej: Juan Pérez" maxLength={80}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0dad1', borderRadius: '10px', fontSize: '0.84rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                {/* Nota (opcional) */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#57534e', marginBottom: '6px' }}>Nota interna <span style={{ fontWeight: 500, color: '#a8a29e' }}>(opcional)</span></label>
                  <input type="text" value={nota} onChange={(e) => setNota(e.target.value)}
                    placeholder="Ej: Pagó en efectivo" maxLength={120}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0dad1', borderRadius: '10px', fontSize: '0.84rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                {/* Resumen */}
                <div style={{ background: '#faf8f5', border: '1px solid #ebe5dc', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#78716c' }}>Total venta en mostrador:</span>
                    <span style={{ fontSize: '1.08rem', fontWeight: 850, color: '#7A1E3A' }}>{formatPrecio(Number(libroActual?.precio_libro || 0) * cantidad)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#a8a29e' }}>
                    {cantidad} × {formatPrecio(libroActual?.precio_libro)} = {formatPrecio(Number(libroActual?.precio_libro || 0) * cantidad)}
                  </p>
                </div>
              </div>
            )}

            {error && <div className="form-error" style={{ margin: "10px 0", display: 'flex', alignItems: 'center', gap: '4px' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /> {error}</div>}
            <div className="modal-actions" style={{ marginTop: "14px" }}>
              <button className="btn-outline" onClick={onClose} disabled={cargando}>Cancelar</button>
              {libroActual && stockActual > 0 && (
                <button className="btn btn-vinotinto" onClick={confirmarVenta} disabled={cargando || cantidad <= 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconShoppingBag width={16} height={16} strokeWidth={2} />
                  {cargando ? "Registrando…" : "Confirmar Venta"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= MODAL CÓDIGO / IDENTIFICACIÓN DEL LIBRO ================= */
function ModalCodigoLibro({ libro, onClose }) {
  const codigoId = `BKH-${String(libro.id_libro).padStart(5, '0')}`;
  const isbn = libro.isbn || libro.codigo_barras || null;

  // Generar patrón visual tipo código de barras basado en el ID
  const generarBarras = (code) => {
    const barras = [];
    const seed = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    for (let i = 0; i < 40; i++) {
      const w = ((seed * (i + 1) * 7) % 4) + 1;
      const isBar = i % 2 === 0;
      barras.push({ width: w, filled: isBar });
    }
    return barras;
  };
  const barras = generarBarras(codigoId);

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconSearch width={20} height={20} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Código del Libro
          </h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        {/* Tarjeta de identificación visual */}
        <div style={{ background: '#ffffff', border: '2px solid #7A1E3A', borderRadius: '14px', padding: '24px 20px', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ background: '#7A1E3A', margin: '-24px -20px 18px', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <IconBook width={18} height={18} strokeWidth={2} style={{ color: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.04em' }}>BOOKYHOME — ID DEL LIBRO</span>
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: '#2A2A2A' }}>{libro.titulo}</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#78716c' }}>{libro.autor_libro || "Autor desconocido"}</p>

          {/* Código de barras visual */}
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'center', gap: '1px', height: '60px', margin: '0 auto 10px', maxWidth: '280px' }}>
            {barras.map((b, i) => (
              <div key={i} style={{ width: `${b.width}px`, height: b.filled ? '100%' : '70%', background: b.filled ? '#2A2A2A' : 'transparent', borderRadius: '1px' }} />
            ))}
          </div>
          <p style={{ margin: '0 0 6px', fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 900, color: '#2A2A2A', letterSpacing: '0.12em' }}>{codigoId}</p>
          {isbn && <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#78716c' }}>ISBN: <strong>{isbn}</strong></p>}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #e5dfd7' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio</p>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#7A1E3A' }}>{formatPrecio(libro.precio_libro)}</p>
            </div>
            <div style={{ width: '1px', background: '#e5dfd7' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</p>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: Number(libro.stock) > 0 ? '#065f46' : '#991b1b' }}>{libro.stock} uds</p>
            </div>
            <div style={{ width: '1px', background: '#e5dfd7' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</p>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#57534e' }}>{libro.nombre_categoria || '—'}</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#faf8f5', border: '1px solid #ebe5dc', borderRadius: '10px', padding: '12px 14px', marginTop: '14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <IconInfo width={18} height={18} strokeWidth={2} style={{ color: '#7A1E3A', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '0.78rem', color: '#57534e', lineHeight: 1.5 }}>
            <strong>100% Digital o Físico:</strong> No es obligatorio imprimirlo. Puedes ver este código electrónico en tu celular o tablet en el mostrador para consultar precios, verificar stock o registrar ventas en 1 clic.
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn-outline" onClick={onClose}>Cerrar</button>
          <button
            className="btn btn-vinotinto"
            onClick={() => {
              navigator.clipboard?.writeText(codigoId);
              alert(`Código electrónico ${codigoId} copiado al portapapeles`);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Copiar Código Digital
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MODAL RETIRO EN TIENDA (CLICK & COLLECT) ================= */
function ModalRetiroTienda({ libro, onClose, onConfirmado }) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [cantidadReserva, setCantidadReserva] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const stockActual = Number(libro.stock || 0);

  const confirmarRetiro = async () => {
    if (!nombreCliente.trim()) return setError("Ingresa el nombre del cliente que recoge");
    if (cantidadReserva <= 0) return setError("La cantidad debe ser al menos 1");
    if (cantidadReserva > stockActual) return setError(`Solo tienes ${stockActual} unidad(es) en stock`);
    setCargando(true);
    setError("");
    try {
      const nuevoStock = stockActual - cantidadReserva;
      const data = new FormData();
      data.append("stock", nuevoStock);
      await api.patch(`/libros/${libro.id_libro}/stock`, data, { headers: { "Content-Type": "multipart/form-data" } });
      setExito(true);
      setTimeout(() => { onConfirmado(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al confirmar el retiro");
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconPackage width={22} height={22} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Retiro en Tienda
          </h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        {exito ? (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <IconCheck width={28} height={28} strokeWidth={2.5} style={{ color: '#16a34a' }} />
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#065f46', fontWeight: 800 }}>¡Entrega confirmada!</h3>
            <p style={{ margin: 0, color: '#78716c', fontSize: '0.88rem' }}>
              <strong>{nombreCliente}</strong> recogió <strong>{cantidadReserva} unidad(es)</strong> de "<strong>{libro.titulo}</strong>"
            </p>
          </div>
        ) : (
          <>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <IconInfo width={18} height={18} strokeWidth={2} style={{ color: '#1d4ed8', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5 }}>
                <strong>Retiro en Tienda (Click & Collect):</strong> El cliente reservó este libro online y viene a recogerlo a tu local. Confirma la entrega para descontar el inventario.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: '1px solid #f0ebe4', marginBottom: '18px' }}>
              <div style={{ width: 44, height: 56, borderRadius: '8px', background: '#f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconBook width={20} height={20} strokeWidth={1.8} style={{ color: '#7A1E3A' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 3px', fontSize: '0.92rem', fontWeight: 800 }}>{libro.titulo}</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#78716c' }}>{libro.autor_libro} — {formatPrecio(libro.precio_libro)}</p>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#065f46', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                  {stockActual} en stock
                </span>
              </div>
            </div>

            {stockActual <= 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#991b1b', fontWeight: 700, margin: '0 0 6px' }}>Sin stock disponible</p>
                <p style={{ color: '#78716c', fontSize: '0.84rem', margin: 0 }}>No se puede confirmar la entrega sin unidades en inventario.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#57534e', marginBottom: '6px' }}>Nombre del cliente que recoge *</label>
                  <input type="text" value={nombreCliente} onChange={(e) => { setNombreCliente(e.target.value); setError(""); }}
                    placeholder="Ej: María García" maxLength={80} autoFocus
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0dad1', borderRadius: '10px', fontSize: '0.84rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#57534e', marginBottom: '6px' }}>Unidades a entregar</label>
                  <div className="stock-control">
                    <button className="stock-btn" onClick={() => setCantidadReserva(Math.max(1, cantidadReserva - 1))}>−</button>
                    <input type="number" min="1" max={stockActual} value={cantidadReserva}
                      onChange={(e) => setCantidadReserva(Math.min(stockActual, Math.max(1, Number(e.target.value))))} className="stock-input" />
                    <button className="stock-btn" onClick={() => setCantidadReserva(Math.min(stockActual, cantidadReserva + 1))}>+</button>
                  </div>
                </div>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 600 }}>Total cobrado en tienda:</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 850, color: '#065f46' }}>{formatPrecio(Number(libro.precio_libro || 0) * cantidadReserva)}</span>
                  </div>
                </div>
              </>
            )}

            {error && <div className="form-error" style={{ margin: "10px 0", display: 'flex', alignItems: 'center', gap: '4px' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /> {error}</div>}
            <div className="modal-actions" style={{ marginTop: "12px" }}>
              <button className="btn-outline" onClick={onClose} disabled={cargando}>Cancelar</button>
              {stockActual > 0 && (
                <button className="btn btn-vinotinto" onClick={confirmarRetiro} disabled={cargando || !nombreCliente.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconCheck width={16} height={16} strokeWidth={2.5} />
                  {cargando ? "Confirmando…" : "Entregar y Cobrar"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= SECCIÓN CALIFICACIONES VENDEDOR ================= */
const StarIcon = ({ filled, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#ffc107' : '#e0e0e0'} stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const Stars = ({ value, size = 16 }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= value} size={size} />)}
  </div>
);

// Iniciales del usuario para el avatar
const initials = (name = '') => name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

// Paleta de colores para avatares
const AVATAR_COLORS = ['#7A1E3A','#1e4d8a','#1e7a45','#7a5c00','#5a1e7a','#1e6a7a'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] || '#7A1E3A';

function SeccionCalificacionesVendedor({ tiendaId, darkMode = false }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tiendaId) return;
    let activo = true;
    const cargarCalificaciones = async () => {
      if (activo) setLoading(true);
      try {
        const respuesta = await api.get(`/perfil/calificaciones-tienda/${tiendaId}`);
        if (activo) setData(respuesta.data);
      } catch (e) {
        console.error('Error calificaciones:', e);
      } finally {
        if (activo) setLoading(false);
      }
    };
    cargarCalificaciones();
    return () => { activo = false; };
  }, [tiendaId]);

  const total    = data?.total     ?? 0;
  const promedio = data?.promedio  ?? 0;
  const dist     = data?.distribucion ?? {};
  const lista    = data?.calificaciones ?? [];

  const barColor = (s) => s >= 4 ? '#22c55e' : s === 3 ? '#f59e0b' : '#ef4444';
  const topBorder = (s) => s >= 4 ? '#22c55e' : s === 3 ? '#f59e0b' : '#ef4444';
  const promedioColor = darkMode
    ? '#f4b266'
    : (promedio >= 4.5 ? '#065f46' : promedio >= 3.5 ? '#854d0e' : '#991b1b');
  const promedioBg    = darkMode
    ? '#1a1a1a'
    : (promedio >= 4.5 ? '#d1fae5' : promedio >= 3.5 ? '#fef9c3' : '#fee2e2');
  const promedioBorder= darkMode
    ? '#3a3a3a'
    : (promedio >= 4.5 ? '#6ee7b7' : promedio >= 3.5 ? '#fde047' : '#fca5a5');

  const estesMes = lista.filter(c => {
    const d = new Date(c.fecha_calificacion), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <>
      {/* Header igual al de todas las secciones */}
      <div className="welcome-card" style={{ background: darkMode ? '#1f1f1f' : undefined, borderColor: darkMode ? '#3a3a3a' : undefined }}>
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px', color: darkMode ? '#f3f4f6' : undefined }}>
          <IconStar width={28} height={28} strokeWidth={2} style={{ color: darkMode ? '#ff9f43' : '#7A1E3A' }} />
          Calificaciones de tu tienda
        </h1>
        <p style={{ margin: 0, color: darkMode ? '#c8c8c8' : undefined }}>Lo que tus clientes opinan sobre tu servicio</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', border: `3px solid ${darkMode ? '#2a2a2a' : '#f0e8ea'}`, borderTopColor: darkMode ? '#ff9f43' : '#7A1E3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: darkMode ? '#b8b8b8' : '#aaa', fontSize: '0.9rem' }}>Cargando calificaciones...</span>
        </div>
      ) : total === 0 ? (
        /* ── Estado vacío ── */
        <div style={{ padding: '20px' }}>
          <div style={{ background: darkMode ? '#1f1f1f' : 'white', border: darkMode ? '1px solid #3a3a3a' : 'none', borderRadius: '16px', padding: '70px 20px', textAlign: 'center', boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⭐</div>
            <h3 style={{ margin: '0 0 8px 0', color: darkMode ? '#f3f4f6' : '#333', fontWeight: '700', fontSize: '1.2rem' }}>Aún no tienes calificaciones</h3>
            <p style={{ margin: '0 auto', color: darkMode ? '#b8b8b8' : '#999', fontSize: '0.95rem', maxWidth: '340px' }}>
              Cuando un cliente reciba su pedido y te evalúe, sus opiniones aparecerán aquí.
            </p>
          </div>
        </div>
      ) : (
        <div className="calificaciones-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Fila superior: promedio destacado + 3 métricas ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', alignItems: 'stretch' }}>

            {/* Promedio grande */}
            <div className="calificaciones-promedio-card" style={{
              background: darkMode ? '#1f1f1f' : promedioBg,
              border: `2px solid ${darkMode ? '#f4b266' : promedioBorder}`,
              borderRadius: '16px',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: darkMode ? `0 0 0 1px rgba(244, 178, 102, 0.18)` : '0 4px 16px rgba(0,0,0,0.07)'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: promedioColor, opacity: 0.75 }}>
                Promedio general
              </span>
              <div style={{ fontSize: '4rem', fontWeight: '900', color: promedioColor, lineHeight: 1 }}>
                {promedio.toFixed(1)}
              </div>
              <Stars value={Math.round(promedio)} size={20} />
              <span style={{ fontSize: '0.85rem', color: promedioColor, opacity: 0.7, marginTop: '4px' }}>
                sobre {total} {total === 1 ? 'opinión' : 'opiniones'}
              </span>
            </div>

            {/* 3 métricas en columna */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { 
                  label: 'Opiniones totales', 
                  value: total,      
                  icon: <IconMessage width={32} height={32} strokeWidth={1.5} style={{ color: '#1d4ed8' }} />, 
                  bg: '#eff6ff', 
                  color: '#1d4ed8', 
                  border: '#bfdbfe' 
                },
                { 
                  label: '5 estrellas',        
                  value: dist[5]??0, 
                  icon: <IconStar width={32} height={32} strokeWidth={1.5} style={{ color: '#34d399' }} />, 
                  bg: '#d1fae5', 
                  color: '#34d399', 
                  border: '#86efac' 
                },
                { 
                  label: 'Este mes',            
                  value: estesMes,  
                  icon: <IconCalendar width={32} height={32} strokeWidth={1.5} style={{ color: '#6b21a8' }} />, 
                  bg: '#faf5ff', 
                  color: '#6b21a8', 
                  border: '#d8b4fe' 
                },
              ].map(m => (
                <div key={m.label} className="calificaciones-metric-card metric-card" style={{
                  background: darkMode ? '#1b1b1b' : m.bg,
                  border: darkMode ? `1px solid ${m.color}55` : `1px solid ${m.border}`,
                  boxShadow: darkMode ? `inset 0 0 0 1px ${m.color}33, 0 0 0 1px ${m.color}10` : '0 2px 8px rgba(0,0,0,0.05)',
                  borderRadius: '14px',
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center',
                }}>
                  <div className="metric-icon">
                    {m.icon}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: darkMode ? '#f3f4f6' : m.color, lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: '0.78rem', color: darkMode ? '#d1d5db' : m.color, opacity: darkMode ? 1 : 0.8, fontWeight: '600' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Fila inferior: Distribución + lista ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', alignItems: 'start' }}>

            {/* Distribución */}
            <div className="calificaciones-distribution" style={{ background: darkMode ? '#1f1f1f' : 'white', border: darkMode ? '1px solid #3a3a3a' : 'none', borderRadius: '14px', padding: '22px', boxShadow: darkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '0.85rem', fontWeight: '700', color: darkMode ? '#d1d5db' : '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Distribución
              </h3>
              {[5,4,3,2,1].map(stars => {
                const count = dist[stars] ?? 0;
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ minWidth: '10px', fontSize: '0.85rem', fontWeight: '700', color: darkMode ? '#e5e7eb' : '#555' }}>{stars}</span>
                    <StarIcon filled size={13} />
                    <div style={{ flex: 1, background: darkMode ? '#2a2a2a' : '#f3f4f6', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ background: barColor(stars), height: '100%', width: `${pct}%`, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ minWidth: '52px', fontSize: '0.8rem', color: darkMode ? '#d1d5db' : '#888', textAlign: 'right' }}>
                      {count} <span style={{ color: '#ccc' }}>({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Lista de opiniones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '700', color: darkMode ? '#d1d5db' : '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Últimas opiniones
                </h3>
                {lista.length > 10 && (
                  <span style={{ fontSize: '0.75rem', color: darkMode ? '#b8b8b8' : '#999', fontStyle: 'italic' }}>
                    Mostrando 10 de {lista.length}
                  </span>
                )}
              </div>
              {lista.slice(0, 10).map(cal => (
                <div key={cal.id_calificacion} className="calificaciones-review-card" style={{
                  background: darkMode ? '#1f1f1f' : 'white',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                  border: darkMode ? '1px solid #3a3a3a' : 'none',
                  borderTop: `3px solid ${topBorder(cal.calificacion)}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: cal.comentario ? '10px' : 0 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: avatarColor(cal.nombre_usuario),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '700', fontSize: '0.82rem'
                    }}>
                      {initials(cal.nombre_usuario)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: darkMode ? '#f3f4f6' : '#222', fontSize: '0.9rem' }}>{cal.nombre_usuario}</strong>
                        <span style={{ fontSize: '0.78rem', color: darkMode ? '#b8b8b8' : '#bbb', flexShrink: 0, marginLeft: '8px' }}>
                          {new Date(cal.fecha_calificacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <Stars value={cal.calificacion} size={13} />
                    </div>
                  </div>
                  {cal.comentario && (
                    <p style={{
                      margin: 0, color: darkMode ? '#d1d5db' : '#666', fontSize: '0.88rem', lineHeight: '1.55',
                      paddingLeft: '48px', fontStyle: 'italic',
                      borderTop: darkMode ? '1px solid #3a3a3a' : '1px solid #f3f4f6', paddingTop: '10px'
                    }}>
                      "{cal.comentario}"
                    </p>
                  )}
                </div>
              ))}
              
              {/* Estado vacío cuando no hay opiniones */}
              {lista.length === 0 && (
                <div className="calificaciones-empty-state" style={{
                  background: darkMode ? '#1f1f1f' : 'white',
                  border: darkMode ? '1px solid #3a3a3a' : 'none',
                  borderRadius: '14px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '12px' }}>💭</div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: darkMode ? '#f3f4f6' : '#666' }}>
                    Aún no hay opiniones
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: darkMode ? '#b8b8b8' : '#888' }}>
                    Las opiniones de tus clientes aparecerán aquí cuando recibas calificaciones
                  </p>
                </div>
              )}
              
              {/* Nota sobre notificaciones */}
              {lista.length > 10 && (
                <div style={{
                  background: darkMode ? '#171717' : '#f8fafc',
                  border: darkMode ? '1px solid #3a3a3a' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.82rem',
                  color: darkMode ? '#d1d5db' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IconMessage width={16} height={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                  <span>
                    Las opiniones anteriores están disponibles en la Sección de <strong>Notificaciones</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

const getSellerMediaStorageKey = (key) => {
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

const clearLegacySellerMediaCache = () => {
  localStorage.removeItem('vendedor_user_photo_url');
  localStorage.removeItem('vendedor_banner_url');
};

/* ================= COMPONENTE PRINCIPAL ================= */
export default function MiTienda() {
  const navigate = useNavigate();
  const handleLogout = () => {
    clearLegacySellerMediaCache();
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = jwtDecode(token);
        const userId = payload?.sub || payload?.id || payload?.usuario_id || payload?.user_id;
        if (userId) {
          localStorage.removeItem(`vendedor_user_photo_url_${userId}`);
          localStorage.removeItem(`vendedor_banner_url_${userId}`);
        }
      } catch {
        // Ignore malformed JWT while clearing cached seller media.
      }
    }
    localStorage.removeItem("token");
    document.documentElement.classList.remove('dark');
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } }));
    navigate("/");
  };
  const [userName,      setUserName]      = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = jwtDecode(token);
        return payload.nombre || "Vendedor";
      } catch {
        return "Vendedor";
      }
    }
    return "Vendedor";
  });
  const [userPhotoUrl,  setUserPhotoUrl]  = useState(() => localStorage.getItem(getSellerMediaStorageKey('vendedor_user_photo_url')) || null);
  const [bannerUrl,     setBannerUrl]     = useState(() => localStorage.getItem(getSellerMediaStorageKey('vendedor_banner_url')) || null);
  const [loading]                 = useState(false);
  const location = useLocation();
  const [activeSide, setActiveSide] = useState(() => {
    const seccion = new URLSearchParams(window.location.search).get('seccion');
    return seccion || 'Inicio';
  });

  useEffect(() => {
    const seccion = new URLSearchParams(location.search).get('seccion');
    if (seccion) {
      setActiveSide(seccion);
    }
  }, [location.search]);
  const [selectedSalaInChat, setSelectedSalaInChat] = useState(null);
  const [libros,        setLibros]        = useState([]);
  const [loadingLibros, setLoadingLibros] = useState(false);
  const [categorias,    setCategorias]    = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loadingStats,  setLoadingStats]  = useState(false);
  const [topVendidos,   setTopVendidos]   = useState([]);
  const [loadingTop,    setLoadingTop]    = useState(false);
  const [alertasStock,  setAlertasStock]  = useState([]);
  const [stockUmbral,   setStockUmbral]   = useState(() => Number(localStorage.getItem('stockUmbral')) || 3);
  const [tiendaInfo,    setTiendaInfo]    = useState(null);
  const [darkMode,      setDarkMode]      = useState(() => localStorage.getItem('darkMode') === 'true');
  const [configForm,    setConfigForm]    = useState({
    horario_atencion: "",
    politica_devoluciones: "",
    politica_envios: "",
    tiempo_despacho_dias: 2,
    logo_url: "",
    banner_url: "",
    descripcion: "",
    ciudad_origen: "",
    email_publico: "",
    tarifa_envio: 0,
  });
  const [tiendaForm,    setTiendaForm]    = useState({ nombre_tienda: "", direccion: "", telefono: "" });
  const [tiendaMsg,     setTiendaMsg]     = useState("");

  const [ventas,           setVentas]           = useState([]);
  const [paginaVentas,     setPaginaVentas]     = useState(1);
  const [ventasPorPagina,  setVentasPorPagina]  = useState(8);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [detalleVenta,  setDetalleVenta]  = useState(null);
  const [pedidos,       setPedidos]       = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [filtroEstadoPedidos, setFiltroEstadoPedidos] = useState("todos"); // "todos" | "retiro_tienda" | estado
  const [busquedaPedidos, setBusquedaPedidos] = useState("");
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [detallePedido, setDetallePedido] = useState(null);
  const [fotoCliente, setFotoCliente] = useState(null);
  const [pedidosPorPagina, setPedidosPorPagina] = useState(5);
  const [actualizandoRetiro, setActualizandoRetiro] = useState(null);
  const [filtroEnvios, setFiltroEnvios] = useState("");
  const [filtroEstadoEnvios, setFiltroEstadoEnvios] = useState("todos");
  const [enviosPage, setEnviosPage] = useState(1);
  const [enviosPerPage, setEnviosPerPage] = useState(8);
  const [rangoEnvios, setRangoEnvios] = useState("todos");
  const [empresasMensajeria, setEmpresasMensajeria] = useState([]);
  const [pedidoEnvio, setPedidoEnvio] = useState(null);
  const [envioForm, setEnvioForm] = useState({ id_empresa: "", numero_guia: "" });
  const [guardandoEnvio, setGuardandoEnvio] = useState(false);
  const [envioError, setEnvioError] = useState("");
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const [notificacionesFilter, setNotificacionesFilter] = useState("todas");
  // Paginación de notificaciones (vendedor)
  const [notifPaginaActual,   setNotifPaginaActual]   = useState(1);
  const [notifPorPagina,      setNotifPorPagina]      = useState(10);
  // Modal eliminación masiva (vendedor)
  const [showNotifDeleteModal, setShowNotifDeleteModal] = useState(false);
  const [notifDeleteFilter,    setNotifDeleteFilter]    = useState("leidas");
  const [notifEliminando,      setNotifEliminando]      = useState(false);
  const [chartType, setChartType] = useState('area'); // 'area' | 'barras'
  const [chartTimeframe, setChartTimeframe] = useState('semana'); // 'semana' | 'mes' | 'anio'
  const [chartOffset, setChartOffset] = useState(0); // 0 = actual, -1 = anterior, etc.
  const [hoveredDay, setHoveredDay] = useState(null);

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalStock,    setModalStock]    = useState(null);
  const [modalVentaFisica, setModalVentaFisica] = useState(null);
  const [modalCodigo,      setModalCodigo]      = useState(null);
  const [modalRetiro,      setModalRetiro]      = useState(null);
  const [modalConfirmarEntrega, setModalConfirmarEntrega] = useState(null);
  const [modalHabilitarPago, setModalHabilitarPago] = useState(null);

  // Estados para búsqueda, filtro y paginación en Mis Libros
  const [librosSearch, setLibrosSearch] = useState("");
  const [librosCategoriaFilter, setLibrosCategoriaFilter] = useState("todas");
  const [librosStockFilter, setLibrosStockFilter] = useState("todos"); // 'todos' | 'disponibles' | 'bajo_stock' | 'agotados'
  const [librosEstadoFilter, setLibrosEstadoFilter] = useState("todos"); // 'todos' | 'nuevo' | 'usado_buen_estado' | 'usado_regular'
  const [librosOrder, setLibrosOrder] = useState("recientes");
  const [librosPage, setLibrosPage] = useState(1);
  const [librosPerPage, setLibrosPerPage] = useState(8);

  // Lógica de filtrado, ordenamiento y paginación para Mis Libros (Hooks unconditionally at top)
  const filteredLibros = useMemo(() => {
    return (libros || []).filter((libro) => {
      // 1. Búsqueda por texto (título, autor, categoría)
      if (librosSearch.trim()) {
        const q = librosSearch.toLowerCase().trim();
        const matchTitulo = (libro.titulo || "").toLowerCase().includes(q);
        const matchAutor = (libro.autor_libro || "").toLowerCase().includes(q);
        const matchCat = (libro.nombre_categoria || "").toLowerCase().includes(q);
        if (!matchTitulo && !matchAutor && !matchCat) return false;
      }

      // 2. Filtro categoría
      if (librosCategoriaFilter !== "todas") {
        if (String(libro.id_categoria) !== String(librosCategoriaFilter) && libro.nombre_categoria !== librosCategoriaFilter) {
          return false;
        }
      }

      // 3. Filtro stock
      if (librosStockFilter === "disponibles") {
        if (Number(libro.stock || 0) <= stockUmbral) return false;
      } else if (librosStockFilter === "bajo_stock") {
        const s = Number(libro.stock || 0);
        if (s <= 0 || s > stockUmbral) return false;
      } else if (librosStockFilter === "agotados") {
        if (Number(libro.stock || 0) > 0) return false;
      }

      // 4. Filtro estado del libro
      if (librosEstadoFilter !== "todos") {
        if (libro.estado_libro !== librosEstadoFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (librosOrder === "precio_asc") return (Number(a.precio_libro) || 0) - (Number(b.precio_libro) || 0);
      if (librosOrder === "precio_desc") return (Number(b.precio_libro) || 0) - (Number(a.precio_libro) || 0);
      if (librosOrder === "stock_asc") return (Number(a.stock) || 0) - (Number(b.stock) || 0);
      if (librosOrder === "stock_desc") return (Number(b.stock) || 0) - (Number(a.stock) || 0);
      if (librosOrder === "titulo_asc") return (a.titulo || "").localeCompare(b.titulo || "");
      if (librosOrder === "titulo_desc") return (b.titulo || "").localeCompare(a.titulo || "");
      return (Number(b.id_libro) || 0) - (Number(a.id_libro) || 0);
    });
  }, [libros, librosSearch, librosCategoriaFilter, librosStockFilter, librosEstadoFilter, librosOrder, stockUmbral]);

  const totalLibrosFiltrados = filteredLibros.length;
  const totalPagesLibros = Math.max(1, Math.ceil(totalLibrosFiltrados / librosPerPage));
  const currentPageLibros = Math.min(librosPage, totalPagesLibros);
  const paginatedLibros = filteredLibros.slice((currentPageLibros - 1) * librosPerPage, currentPageLibros * librosPerPage);

  const totalStockUnidades = useMemo(() => (libros || []).reduce((sum, l) => sum + (Number(l.stock) || 0), 0), [libros]);
  const valorTotalInventario = useMemo(() => (libros || []).reduce((sum, l) => sum + ((Number(l.precio_libro) || 0) * (Number(l.stock) || 0)), 0), [libros]);
  const agotadosCount = useMemo(() => (libros || []).filter(l => Number(l.stock || 0) <= 0).length, [libros]);
  const bajoStockCount = useMemo(() => (libros || []).filter(l => Number(l.stock || 0) > 0 && Number(l.stock || 0) <= stockUmbral).length, [libros, stockUmbral]);

  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [mostrarFormCuenta, setMostrarFormCuenta] = useState(false);
  const [cuentaForm, setCuentaForm] = useState({
    tipo_cuenta: '',
    banco: '',
    numero_cuenta: '',
    nombre_titular: '',
    cedula_titular: '',
    es_principal: false
  });
  const [_cuentaAEliminar, setCuentaAEliminar] = useState(null);
  const [_mostrarExitoCuenta, setMostrarExitoCuenta] = useState(false);
  
  // Datos del método de cobro del vendedor
  const [_pagosPendientes, setPagosPendientes] = useState([]);
  const [_historialPagos, setHistorialPagos] = useState([]);
  const [_loadingNomina, setLoadingNomina] = useState(false);
  const [_expandedPayment, _setExpandedPayment] = useState(null);

  // ── Perfil personal ──────────────────────────────────────────────
  const [perfilName,        setPerfilName]        = useState('');
  const [perfilSurname,     setPerfilSurname]      = useState('');
  const [perfilPhone,       setPerfilPhone]        = useState('');
  const [perfilCity,        setPerfilCity]         = useState('');
  const [perfilAddress,     setPerfilAddress]      = useState('');
  const [perfilEmail,       setPerfilEmail]        = useState('');
  const [profilePhotoUrl,   setProfilePhotoUrl]    = useState(null);
  const [perfilBannerUrl,   setPerfilBannerUrl]    = useState(null);
  const [perfilBannerColor, setPerfilBannerColor]  = useState('#7A1E3A');
  const [showBannerEditor,  setShowBannerEditor]   = useState(false);
  const [perfilFotoUploading, setPerfilFotoUploading] = useState(false);
  const [perfilBannerUploading, setPerfilBannerUploading] = useState(false);
  const [notifPromociones,  setNotifPromociones]   = useState(true);
  const [notifPedidos,      setNotifPedidos]        = useState(true);
  const [notifNovedades,    setNotifNovedades]      = useState(false);
  const [_estadisticas,      setEstadisticas]        = useState(null);
  const [_categoriasFav,     setCategoriasFav]       = useState([]);
  const [nivelFidelizacion, setNivelFidelizacion]   = useState(null);
  const [savingPerfil,      setSavingPerfil]        = useState(false);
  const [perfilMsg,         setPerfilMsg]           = useState('');
  const [perfilLoaded,      setPerfilLoaded]        = useState(false);

  const cargarCuentasBancarias = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = jwtDecode(token);
      const userId = payload.sub;
      
      const res = await api.get(`/api/v1/bookypago-finanzas/cuentas-bancarias/${userId}`);
      setCuentasBancarias(res.data.cuentas || []);
    } catch (error) {
      console.error('Error cargando cuentas bancarias:', error);
      setCuentasBancarias([]);
    }
  };

  const cargarPagosPendientes = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = jwtDecode(token);
      const userId = payload.sub;
      const res = await api.get(`/api/v1/bookypago-finanzas/pagos-pendientes/${userId}`);
      setPagosPendientes(res.data.pagos_pendientes || []);
    } catch (error) {
      console.error('Error cargando pagos pendientes:', error);
      console.error('Detalle del error:', error.response?.data);
      setPagosPendientes([]);
    }
  };

  const cargarHistorialPagos = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = jwtDecode(token);
      const userId = payload.sub;
      const res = await api.get(`/api/v1/bookypago-finanzas/historial-pagos/${userId}`);
      setHistorialPagos(res.data.historial || []);
    } catch (error) {
      console.error('Error cargando historial de pagos:', error);
      console.error('Detalle del error:', error.response?.data);
      setHistorialPagos([]);
    }
  };

  const handleAgregarCuenta = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = jwtDecode(token);
      const userId = payload.sub;
      
      await api.post(`/api/v1/bookypago-finanzas/cuentas-bancarias/${userId}`, cuentaForm);
      setMostrarFormCuenta(false);
      setCuentaForm({
        tipo_cuenta: '',
        banco: '',
        numero_cuenta: '',
        nombre_titular: '',
        cedula_titular: '',
        es_principal: false
      });
      setMostrarExitoCuenta(true);
      cargarCuentasBancarias();
      
      // Cerrar el modal de éxito automáticamente después de 3 segundos
      setTimeout(() => setMostrarExitoCuenta(false), 3000);
    } catch (error) {
      alert('Error agregando cuenta bancaria: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleMarcarPrincipal = async (idCuenta) => {
    try {
      const token = localStorage.getItem("token");
      const payload = jwtDecode(token);
      const userId = payload.sub;
      
      await api.put(`/api/v1/bookypago-finanzas/cuentas-bancarias/${userId}/principal/${idCuenta}`);
      alert('Cuenta principal actualizada');
      cargarCuentasBancarias();
    } catch (error) {
      alert('Error actualizando cuenta principal: ' + (error.response?.data?.detail || error.message));
    }
  };

  const _handleEliminarCuenta = async (idCuenta) => {
    try {
      const token = localStorage.getItem("token");
      const payload = jwtDecode(token);
      const userId = payload.sub;
      
      await api.delete(`/api/v1/bookypago-finanzas/cuentas-bancarias/${userId}/${idCuenta}`);
      setCuentaAEliminar(null);
      cargarCuentasBancarias();
    } catch (error) {
      alert('Error eliminando cuenta bancaria: ' + (error.response?.data?.detail || error.message));
    }
  };

  const confirmarEliminarCuenta = (cuenta) => {
    setCuentaAEliminar(cuenta);
  };

  const statsLibros = {
    totalLibros: libros.length,
    stockTotal:  libros.reduce((acc, l) => acc + (l.stock || 0), 0),
    categorias:  [...new Set(libros.map((l) => l.nombre_categoria).filter(Boolean))].length,
  };

  useEffect(() => {
    cargarCuentasBancarias();
  }, []);

  useEffect(() => {
    if (activeSide === 'Métodos de cobro') {
      setLoadingNomina(true);
      Promise.all([cargarPagosPendientes(), cargarHistorialPagos()])
        .finally(() => setLoadingNomina(false));
    }
  }, [activeSide]);

  useEffect(() => {
    const handleDarkModeChange = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handleDarkModeChange);
    window.addEventListener('storage', handleDarkModeChange);
    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange);
      window.removeEventListener('storage', handleDarkModeChange);
    };
  }, []);

  const cargarNotificaciones = useCallback(async (silent = false) => {
    try {
      if (!silent) setNotificacionesLoading(true);
      const data = await notificacionesService.obtener(false, 3000, 0);
      setNotificaciones(data.notificaciones || []);
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
      setNotificaciones([]);
    } finally {
      if (!silent) setNotificacionesLoading(false);
    }
  }, []);

  const FILTROS_VENDEDOR = {
    todas:          null,
    no_leidas:      null,
    ventas_envios:  ["orden", "pedido", "entrega", "pago"],
    reclamos:       ["sistema"],
    resenas:        ["resena"],
    mensajes:       ["mensaje"],
  };

  const handleMarcarLeida = async (id_notificacion) => {
    try {
      await notificacionesService.marcarLeida(id_notificacion);
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error marcando notificación como leída:", err);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error marcando todas las notificaciones como leídas:", err);
    }
  };

  const handleEliminar = async (id_notificacion) => {
    try {
      await notificacionesService.eliminar(id_notificacion);
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    }
  };

  const handleClickNotificacion = (notif) => {
    switch (notif.tipo) {
      case "mensaje":
        setActiveSide("Mensajes");
        break;
      case "resena":
      case "oferta":
        setActiveSide("Promociones");
        break;
      case "pedido":
      case "entrega":
      case "pago":
        setActiveSide("Pedidos");
        break;
      case "sistema":
        setActiveSide("Quejas y reclamos");
        break;
      default:
        break;
    }
    handleMarcarLeida(notif.id_notificacion);
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      mensaje: <IconMessage width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      resena: <IconStar width={24} height={24} strokeWidth={1.5} style={{ color: '#FFA500' }} />,
      oferta: <IconGift width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      pedido: <IconShoppingBag width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      entrega: <IconTruck width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      pago: <IconCreditCard width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      sistema: <IconInfo width={24} height={24} strokeWidth={1.5} style={{ color: '#666' }} />,
    };
    return iconos[tipo] || <IconShoppingBag width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }

    let mounted = true;

    api.get("/perfil/mi-perfil")
      .then((res) => {
        if (!mounted || !res?.data) return;
        const d = res.data;
        const fotoPerfil = d.foto_perfil;
        if (fotoPerfil) {
          setUserPhotoUrl(resolveImageUrl(fotoPerfil));
          setProfilePhotoUrl(resolveImageUrl(fotoPerfil));
        }
        if (d.nombre_usuario) {
          setUserName(d.nombre_usuario);
          const parts = d.nombre_usuario.trim().split(/\s+/);
          setPerfilName(parts.shift() || '');
          setPerfilSurname(parts.join(' '));
        }
        setPerfilPhone(d.telefono || '');
        setPerfilCity(d.ciudad || '');
        setPerfilAddress(d.direccion || '');
        setPerfilEmail(d.correo_usuario || '');
        if (d.banner_perfil) {
          setPerfilBannerUrl(resolveImageUrl(d.banner_perfil));
          setPerfilBannerColor(null);
        } else if (d.banner_color) {
          setPerfilBannerColor(d.banner_color);
          setPerfilBannerUrl(null);
        }
        const pref = d.preferencias || {};
        setNotifPromociones(pref.notificaciones_promociones ?? true);
        setNotifPedidos(pref.notificaciones_pedidos ?? true);
        setNotifNovedades(pref.notificaciones_novedades ?? false);
        setPerfilLoaded(true);
      })
      .catch((err) => {
        console.error("Error cargando perfil del vendedor:", err);
      });

    return () => { mounted = false; };
  }, [navigate]);

  // Cargar estadísticas de usuario (para sección Perfil)
  const cargarEstadisticasUsuario = () => {
    api.get("/perfil/estadisticas/usuario")
      .then((res) => {
        const data = res.data || {};
        const puntos = Number(data.total_gastado || 0);
        const nivel = data.nivel_fidelizacion || 'Bronce';
        const umbrales = {
          Bronce: 0,
          Plata: 50000,
          Oro: 150000,
          Zafiro: 300000,
          Rubi: 500000,
          Esmeralda: 800000,
          Amatista: 1200000,
          Perla: 1700000,
          Obsidiana: 2300000,
          Diamante: 3200000,
          Onix: 4500000,
          Platino: 6500000,
        };
        const niveles = ['Bronce', 'Plata', 'Oro', 'Zafiro', 'Rubi', 'Esmeralda', 'Amatista', 'Perla', 'Obsidiana', 'Diamante', 'Onix', 'Platino'];
        const idx = niveles.indexOf(nivel);
        const siguiente = idx >= 0 && idx < niveles.length - 1 ? niveles[idx + 1] : null;
        setEstadisticas({
          total_gastado: puntos,
          num_compras: Number(data.num_compras || 0),
          ticket_promedio: Number(data.ticket_promedio || 0),
        });
        setCategoriasFav(data.categorias_favoritas || []);
        setNivelFidelizacion({
          nivel, puntos, siguiente_nivel: siguiente,
          puntos_para_siguiente: siguiente ? Math.max((umbrales[siguiente] || 0) - puntos, 0) : 0,
        });
      })
      .catch(() => {
        setEstadisticas({ total_gastado: 0, num_compras: 0, ticket_promedio: 0 });
        setCategoriasFav([]);
        setNivelFidelizacion({ nivel: 'Bronce', puntos: 0, siguiente_nivel: 'Plata', puntos_para_siguiente: 50000 });
      });
  };

  // Sincronizar activeSide con la URL: usamos history.replaceState en lugar de
  // navigate() para no disparar el ciclo de re-render de React Router (que causa
  // el parpadeo blanco al cambiar de Sección).
  const cambiarSeccion = (nuevaSeccion) => {
    setActiveSide(nuevaSeccion);
    window.history.replaceState(null, '', `/mi-tienda?seccion=${encodeURIComponent(nuevaSeccion)}`);
  };

  useEffect(() => {
    if (activeSide === "Notificaciones") {
      cargarNotificaciones(false);
    }
  }, [activeSide, cargarNotificaciones]);

  const cargarLibros = useCallback(() => {
    setLoadingLibros(true);
    api.get("/libros/mis-libros")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setLibros(res.data);
        } else {
          console.error("Respuesta inesperada de mis-libros:", res.data);
          setLibros([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando libros:", err);
        setLibros([]);
      })
      .finally(() => setLoadingLibros(false));
  }, []);

  const cargarPedidos = useCallback(() => {
    setLoadingPedidos(true);
    api.get("/libros/mis-pedidos")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setPedidos(res.data);
        } else {
          console.error("Respuesta inesperada de mis-pedidos:", res.data);
          setPedidos([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando pedidos:", err);
        setPedidos([]);
      })
      .finally(() => setLoadingPedidos(false));
  }, []);

  const abrirRegistroEnvio = async (pedido) => {
    setPedidoEnvio(pedido);
    setEnvioError("");
    setEnvioForm({
      id_empresa: pedido.envio?.id_empresa ? String(pedido.envio.id_empresa) : "",
      numero_guia: pedido.envio?.numero_guia || ""
    });
    if (empresasMensajeria.length === 0) {
      try {
        const res = await api.get("/envios/empresas");
        setEmpresasMensajeria(res.data);
      } catch {
        setEnvioError("No se pudo cargar el listado de empresas de mensajería.");
      }
    }
  };

  const guardarEnvio = async () => {
    if (!envioForm.id_empresa || !envioForm.numero_guia.trim()) {
      setEnvioError("Selecciona una empresa e ingresa el número de Guía.");
      return;
    }
    setGuardandoEnvio(true);
    setEnvioError("");
    try {
      await api.put(`/envios/orden/${pedidoEnvio.id_orden}`, {
        id_comprador: pedidoEnvio.id_comprador,
        id_empresa: Number(envioForm.id_empresa),
        numero_guia: envioForm.numero_guia.trim()
      });
      setPedidoEnvio(null);
      cargarPedidos();
    } catch (err) {
      setEnvioError(err.response?.data?.detail || "No se pudo registrar la Guía.");
    } finally {
      setGuardandoEnvio(false);
    }
  };

  const cargarVentas = useCallback(() => {
    setLoadingVentas(true);
    api.get("/libros/mis-ventas")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setVentas(res.data);
          setPaginaVentas(1);
        } else {
          console.error("Respuesta inesperada de mis-ventas:", res.data);
          setVentas([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando ventas:", err);
        setVentas([]);
      })
      .finally(() => setLoadingVentas(false));
  }, []);

 
  // ========================
  // Efectos de carga inicial y actualizacion por Sección
  // ========================
  // Cargar libros únicamente al montar el componente
  useEffect(() => {
    cargarLibros();
  }, [cargarLibros]);

  useEffect(() => {
    if (activeSide === "Pedidos" || activeSide === "Envios" || activeSide === "Envíos") {
      cargarPedidos();
      const intervalId = setInterval(() => {
        api.get("/libros/mis-pedidos")
          .then((res) => {
            if (Array.isArray(res.data)) {
              setPedidos(res.data);
            }
          })
          .catch(() => {});
      }, 4000);
      return () => clearInterval(intervalId);
    } else if (activeSide === "Ventas") {
      cargarVentas();
    } else if (activeSide === "Mis Libros") {
      cargarLibros();
    } else if (activeSide === "Inicio") {
      cargarLibros();
      cargarVentas();
    } else if (activeSide === "Perfil") {
      cargarEstadisticasUsuario();
    }
  }, [activeSide, cargarPedidos, cargarVentas, cargarLibros]);

  useEffect(() => {
    api.get("/libros/categorias")
      .then((r) => {
        if (Array.isArray(r.data)) {
          setCategorias(r.data);
        } else {
          console.error("Respuesta inesperada de categorías:", r.data);
          setCategorias([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando categorías:", err);
        setCategorias([]);
      });
  }, []);

  useEffect(() => {
    setLoadingStats(true);
    api.get("/libros/stats")
      .then((r) => {
        if (r.data && typeof r.data === "object") {
          setStats(r.data);
        } else {
          console.error("Respuesta inesperada de stats:", r.data);
          setStats(null);
        }
      })
      .catch((err) => {
        console.error("Error cargando stats:", err);
        setStats(null);
      })
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    setLoadingTop(true);
    api.get("/libros/top-vendidos")
      .then((r) => {
        if (Array.isArray(r.data)) {
          setTopVendidos(r.data);
        } else {
          console.error("Respuesta inesperada de top-vendidos:", r.data);
          setTopVendidos([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando top-vendidos:", err);
        setTopVendidos([]);
      })
      .finally(() => setLoadingTop(false));
  }, []);

  useEffect(() => {
    api.get(`/libros/alertas-stock?umbral=${stockUmbral}`)
      .then((r) => {
        if (Array.isArray(r.data)) {
          setAlertasStock(r.data);
        } else {
          console.error("Respuesta inesperada de alertas-stock:", r.data);
          setAlertasStock([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando alertas de stock:", err);
        setAlertasStock([]);
      });
  }, [stockUmbral]);

  useEffect(() => {
    api.get("/tiendas/mi-tienda")
      .then((r) => {
        const miTienda = r.data;
        if (miTienda && typeof miTienda === "object") {
          setTiendaInfo(miTienda);
          const fotoTienda = miTienda.foto_tienda || miTienda.foto_perfil || miTienda.foto || null;
          if (fotoTienda) {
            setUserPhotoUrl(resolveImageUrl(fotoTienda));
          }
          setTiendaForm({
            nombre_tienda: miTienda.nombre_tienda || "",
            direccion: miTienda.direccion || "",
            telefono: miTienda.telefono || "",
          });
        }
      })
      .catch((err) => {
        console.error("Error cargando información de tienda:", err);
        setTiendaInfo(null);
      });

    // Cargar Configuración avanzada
    api.get("/configuracion")
      .then((r) => {
        if (r.data) {
          if (r.data.logo_url) {
            const nextLogoUrl = resolveImageUrl(r.data.logo_url);
            setUserPhotoUrl(nextLogoUrl);
            localStorage.setItem(getSellerMediaStorageKey('vendedor_user_photo_url'), nextLogoUrl);
            clearLegacySellerMediaCache();
            setProfilePhotoUrl(prev => prev || nextLogoUrl);
          }
          if (r.data.banner_url) {
            const nextBannerUrl = resolveImageUrl(r.data.banner_url);
            setBannerUrl(nextBannerUrl);
            localStorage.setItem(getSellerMediaStorageKey('vendedor_banner_url'), nextBannerUrl);
            clearLegacySellerMediaCache();
            setPerfilBannerUrl(prev => {
              if (prev) return prev;
              setPerfilBannerColor(null);
              return nextBannerUrl;
            });
          }
          setConfigForm({
            horario_atencion: r.data.horario_atencion || "",
            politica_devoluciones: r.data.politica_devoluciones || "",
            politica_envios: r.data.politica_envios || "",
            tiempo_despacho_dias: r.data.tiempo_despacho_dias || 2,
            logo_url: r.data.logo_url || "",
            banner_url: r.data.banner_url || "",
            descripcion: r.data.descripcion || "",
            ciudad_origen: r.data.ciudad_origen || "",
            email_publico: r.data.email_publico || "",
            tarifa_envio: r.data.tarifa_envio !== undefined && r.data.tarifa_envio !== null ? Number(r.data.tarifa_envio) : 0,
          });
        }
      })
      .catch((err) => {
        console.error("Error cargando Configuración avanzada:", err);
      });
  }, []);

  const cargarAlertas = () => {
    api.get(`/libros/alertas-stock?umbral=${stockUmbral}`)
      .then((r) => {
        if (Array.isArray(r.data)) {
          setAlertasStock(r.data);
        } else {
          console.error("Respuesta inesperada de alertas-stock:", r.data);
          setAlertasStock([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando alertas de stock:", err);
        setAlertasStock([]);
      });
  };

  if (loading) return <div style={{ padding: "2rem" }}>Cargando tienda...</div>;

  const renderInicio = () => {
    const nombreLibreria = tiendaInfo?.nombre_tienda || (userName && userName !== "Vendedor" ? userName : "tu Librería");
    const horaActual = new Date().getHours();
    const saludo = horaActual < 12 ? "Buenos días" : horaActual < 19 ? "Buenas tardes" : "Buenas noches";

    return (
      <>
        {/* ── Banner Hero de Bienvenida ── */}
        <div className="seller-hero-banner">
          <div className="seller-hero-content">
            <h1 className="seller-hero-title">
              {saludo}, {nombreLibreria} 📚
            </h1>
            <p className="seller-hero-subtitle">
              Aquí tienes el resumen en tiempo real del rendimiento, ventas y actividad de tu catálogo en BookyHome.
            </p>
          </div>
          <div className="seller-hero-meta">
            <div className="seller-hero-date">
              <IconCalendar width={18} height={18} strokeWidth={2} />
              <span>{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</span>
            </div>
            <div className="seller-store-tag">
              <IconShoppingBag width={16} height={16} strokeWidth={2} />
              <span>{nombreLibreria}</span>
            </div>
          </div>
        </div>

      {/* ── 4 Tarjetas KPI Unificadas ── */}
      <div className="seller-kpis-grid">
        {/* KPI 1: Ingresos / Ventas */}
        <div className="seller-kpi-card" onClick={() => cambiarSeccion("Ventas")}>
          <div className="kpi-header">
            <span className="kpi-label">Ventas este Mes</span>
            <div className="kpi-icon-pill kpi-icon-vinotinto">
              <IconCreditCard width={22} height={22} strokeWidth={2} />
            </div>
          </div>
          <div className="kpi-value">
            {loadingStats ? "…" : stats ? formatPrecio(stats.total_mes) : "$0 COP"}
          </div>
          <div className="kpi-footer">
            <span className="kpi-sub-highlight">
              Hoy: {loadingStats ? "…" : stats ? formatPrecio(stats.total_hoy) : "$0 COP"}
            </span>
            <span className="kpi-arrow-link">Ver ventas →</span>
          </div>
        </div>

        {/* KPI 2: Pedidos / Órdenes */}
        <div className="seller-kpi-card" onClick={() => cambiarSeccion("Pedidos")}>
          <div className="kpi-header">
            <span className="kpi-label">Órdenes este Mes</span>
            <div className="kpi-icon-pill kpi-icon-amber">
              <IconShoppingBag width={22} height={22} strokeWidth={2} />
            </div>
          </div>
          <div className="kpi-value">
            {loadingStats ? "…" : stats ? stats.ordenes_mes : 0}
            <span className="kpi-unit">órdenes</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-sub-text">
              {loadingStats ? "…" : stats ? `${stats.ordenes_hoy} orden(es) hoy` : "0 hoy"}
            </span>
            <span className="kpi-arrow-link">Ver pedidos →</span>
          </div>
        </div>

        {/* KPI 3: Catálogo Activo */}
        <div className="seller-kpi-card" onClick={() => cambiarSeccion("Mis Libros")}>
          <div className="kpi-header">
            <span className="kpi-label">Libros en Catálogo</span>
            <div className="kpi-icon-pill kpi-icon-blue">
              <IconBookOpen width={22} height={22} strokeWidth={2} />
            </div>
          </div>
          <div className="kpi-value">
            {loadingLibros ? "…" : statsLibros.totalLibros}
            <span className="kpi-unit">títulos</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-sub-text">
              {loadingLibros ? "…" : `${statsLibros.stockTotal} unidades en stock`}
            </span>
            <span className="kpi-arrow-link">Gestionar →</span>
          </div>
        </div>

        {/* KPI 4: Estado del Inventario */}
        <div className="seller-kpi-card" onClick={() => {
          const el = document.getElementById("inventory-health-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}>
          <div className="kpi-header">
            <span className="kpi-label">Salud de Inventario</span>
            <div className={`kpi-icon-pill ${alertasStock.length > 0 ? "kpi-icon-red" : "kpi-icon-green"}`}>
              {alertasStock.length > 0 ? (
                <IconLock width={22} height={22} strokeWidth={2} />
              ) : (
                <IconCheck width={22} height={22} strokeWidth={2} />
              )}
            </div>
          </div>
          <div className="kpi-value">
            {alertasStock.length > 0 ? `${alertasStock.length} en alerta` : "100% Óptimo"}
          </div>
          <div className="kpi-footer">
            <span className={`kpi-badge-status ${alertasStock.length > 0 ? "badge-warning" : "badge-success"}`}>
              {alertasStock.length > 0 ? `Stock ≤ ${stockUmbral} uds` : "Sin quiebres de stock"}
            </span>
            <span className="kpi-arrow-link">Revisar ↓</span>
          </div>
        </div>
      </div>

      {/* ── Bento Grid: Contenido Principal y Lateral ── */}
      <div className="seller-bento-layout">
        {/* Columna Principal (Izquierda) */}
        <div className="seller-bento-main">
          {/* Card 1: Rendimiento y Tendencia de Ventas con Navegación Histórica */}
          <div className="seller-card-box">
            <div className="seller-card-box-header">
              <div>
                <h3 className="seller-card-box-title">Rendimiento y Tendencia de Ventas</h3>
                <p className="seller-card-box-desc">Explora tus ingresos por semana, mes o año</p>
              </div>
              <div className="chart-header-controls">
                {/* Selector de Granularidad (Semana / Mes / Año) */}
                <div className="chart-timeframe-toggle">
                  <button 
                    type="button" 
                    className={`btn-tf ${chartTimeframe === 'semana' ? 'active' : ''}`}
                    onClick={() => { setChartTimeframe('semana'); setChartOffset(0); setHoveredDay(null); }}
                  >
                    Semana
                  </button>
                  <button 
                    type="button" 
                    className={`btn-tf ${chartTimeframe === 'mes' ? 'active' : ''}`}
                    onClick={() => { setChartTimeframe('mes'); setChartOffset(0); setHoveredDay(null); }}
                  >
                    Mes
                  </button>
                  <button 
                    type="button" 
                    className={`btn-tf ${chartTimeframe === 'anio' ? 'active' : ''}`}
                    onClick={() => { setChartTimeframe('anio'); setChartOffset(0); setHoveredDay(null); }}
                  >
                    Año
                  </button>
                </div>

                {/* Selector de Tipo de Gráfica (Curva / Barras) */}
                <div className="chart-type-toggle">
                  <button 
                    type="button"
                    className={`btn-chart-toggle ${chartType === 'area' ? 'active' : ''}`}
                    onClick={() => setChartType('area')}
                    title="Vista en Curva Suave"
                  >
                    Curva
                  </button>
                  <button 
                    type="button"
                    className={`btn-chart-toggle ${chartType === 'barras' ? 'active' : ''}`}
                    onClick={() => setChartType('barras')}
                    title="Vista en Barras"
                  >
                    Barras
                  </button>
                </div>
              </div>
            </div>

            {/* Cálculo de datos según período y offset */}
            {(() => {
              const ahora = new Date();

              let items = [];
              let periodoTitulo = "";
              let defaultHoverIdx = 0;

              if (chartTimeframe === 'semana') {
                // SEMANA
                const diasNombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
                const diaHoyIdx = (ahora.getDay() + 6) % 7;
                
                const lunes = new Date(ahora);
                lunes.setDate(ahora.getDate() - diaHoyIdx + (chartOffset * 7));
                lunes.setHours(0, 0, 0, 0);

                const domingo = new Date(lunes);
                domingo.setDate(lunes.getDate() + 6);

                periodoTitulo = chartOffset === 0 
                  ? `Esta semana (${lunes.getDate()} ${lunes.toLocaleDateString("es-CO", { month: "short" })} - ${domingo.getDate()} ${domingo.toLocaleDateString("es-CO", { month: "short" })})`
                  : `Semana: ${lunes.getDate()} ${lunes.toLocaleDateString("es-CO", { month: "short" })} - ${domingo.getDate()} ${domingo.toLocaleDateString("es-CO", { month: "short", year: "numeric" })}`;

                items = diasNombres.map((nombre, i) => {
                  const fDia = new Date(lunes);
                  fDia.setDate(lunes.getDate() + i);
                  const fISO = fDia.toISOString().slice(0, 10);
                  const vDia = (ventas || []).filter(v => {
                    if (!v.fecha) return false;
                    const strF = typeof v.fecha === 'string' ? v.fecha.slice(0, 10) : new Date(v.fecha).toISOString().slice(0, 10);
                    return strF === fISO;
                  });
                  const total = vDia.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
                  const ordenes = new Set(vDia.map(v => v.id_orden)).size;
                  const esHoy = chartOffset === 0 && i === diaHoyIdx;

                  return {
                    label: nombre,
                    fechaTexto: fDia.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" }),
                    total,
                    ordenes,
                    esHoy
                  };
                });

                defaultHoverIdx = chartOffset === 0 ? diaHoyIdx : 0;
              } else if (chartTimeframe === 'mes') {
                // MES
                const targetMonthDate = new Date(ahora.getFullYear(), ahora.getMonth() + chartOffset, 1);
                const anio = targetMonthDate.getFullYear();
                const mes = targetMonthDate.getMonth();
                const numDias = new Date(anio, mes + 1, 0).getDate();
                const nombreMes = targetMonthDate.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
                periodoTitulo = chartOffset === 0 ? `Este mes (${nombreMes})` : `Mes: ${nombreMes}`;

                items = [];
                for (let d = 1; d <= numDias; d++) {
                  const fDia = new Date(anio, mes, d);
                  const fISO = fDia.toISOString().slice(0, 10);
                  const vDia = (ventas || []).filter(v => {
                    if (!v.fecha) return false;
                    const strF = typeof v.fecha === 'string' ? v.fecha.slice(0, 10) : new Date(v.fecha).toISOString().slice(0, 10);
                    return strF === fISO;
                  });
                  const total = vDia.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
                  const ordenes = new Set(vDia.map(v => v.id_orden)).size;
                  const esHoy = chartOffset === 0 && d === ahora.getDate() && mes === ahora.getMonth() && anio === ahora.getFullYear();

                  items.push({
                    label: `${d}`,
                    fechaTexto: fDia.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" }),
                    total,
                    ordenes,
                    esHoy
                  });
                }

                defaultHoverIdx = chartOffset === 0 ? Math.min(ahora.getDate() - 1, items.length - 1) : 0;
              } else {
                // AÑO
                const targetYear = ahora.getFullYear() + chartOffset;
                const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                const mesesCompletos = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                periodoTitulo = chartOffset === 0 ? `Este año (${targetYear})` : `Año ${targetYear}`;

                items = mesesNombres.map((nombre, m) => {
                  const vMes = (ventas || []).filter(v => {
                    if (!v.fecha) return false;
                    const f = new Date(v.fecha);
                    return f.getFullYear() === targetYear && f.getMonth() === m;
                  });
                  const total = vMes.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
                  const ordenes = new Set(vMes.map(v => v.id_orden)).size;
                  const esHoy = chartOffset === 0 && m === ahora.getMonth();

                  return {
                    label: nombre,
                    fechaTexto: `${mesesCompletos[m]} ${targetYear}`,
                    total,
                    ordenes,
                    esHoy
                  };
                });

                defaultHoverIdx = chartOffset === 0 ? ahora.getMonth() : 0;
              }

              // Totales del período seleccionado
              const totalPeriodo = items.reduce((sum, it) => sum + it.total, 0);
              const ordenesPeriodo = items.reduce((sum, it) => sum + it.ordenes, 0);

              // Para escala del gráfico con valores limpios y redondeados (múltiplos agradables)
              const maxTotalCalculado = Math.max(...items.map(d => d.total));
              const rawMax = Math.max(maxTotalCalculado, 50000);
              
              // Algoritmo de escala limpia para números ordenados (ej. 200k, 100k, 50k, 1M, etc.)
              const calcularEscalaLimpia = (val) => {
                if (val <= 50000) return 50000;
                if (val <= 100000) return 100000;
                if (val <= 200000) return 200000;
                if (val <= 500000) return 500000;
                if (val <= 1000000) return 1000000;
                const ordenMagnitud = Math.pow(10, Math.floor(Math.log10(val)));
                const fraccion = val / ordenMagnitud;
                let factor = 1;
                if (fraccion <= 1.2) factor = 1.2;
                else if (fraccion <= 1.5) factor = 1.5;
                else if (fraccion <= 2) factor = 2;
                else if (fraccion <= 2.5) factor = 2.5;
                else if (fraccion <= 5) factor = 5;
                else if (fraccion <= 7.5) factor = 7.5;
                else factor = 10;
                return Math.ceil(factor * ordenMagnitud);
              };

              const maxVal = calcularEscalaLimpia(rawMax);

              const svgW = 800;
              const svgH = 280;
              const padTop = 20;
              const padBottom = 36;
              const padLeft = 60;
              const padRight = 20;
              const plotW = svgW - padLeft - padRight;
              const plotH = svgH - padTop - padBottom;
              const nPoints = items.length;

              const pts = items.map((d, i) => {
                const x = padLeft + (nPoints > 1 ? (i / (nPoints - 1)) * plotW : plotW / 2);
                const ratio = maxVal > 0 ? (d.total / maxVal) : 0;
                const y = padTop + plotH - ratio * plotH;
                return { ...d, x, y, ratio };
              });

              let linePath = `M ${pts[0].x},${pts[0].y}`;
              for (let i = 0; i < pts.length - 1; i++) {
                const c = pts[i];
                const n = pts[i + 1];
                const mx = (c.x + n.x) / 2;
                linePath += ` C ${mx},${c.y} ${mx},${n.y} ${n.x},${n.y}`;
              }
              const areaPath = `${linePath} L ${pts[pts.length - 1].x},${padTop + plotH} L ${pts[0].x},${padTop + plotH} Z`;

              const activeItem = (hoveredDay !== null && items[hoveredDay]) ? items[hoveredDay] : items[defaultHoverIdx];

              const formatearEjeY = (num) => {
                if (num === 0) return { val: "0", suf: "k" };
                if (num >= 1000000) {
                  const m = num / 1000000;
                  return { val: Number.isInteger(m) ? `${m}` : `${m.toFixed(1)}`, suf: "M" };
                }
                if (num >= 1000) {
                  const k = num / 1000;
                  return { val: Number.isInteger(k) ? `${k}` : `${k.toFixed(0)}`, suf: "k" };
                }
                return { val: `${num}`, suf: "" };
              };

              return (
                <>
                  {/* Barra de navegación de fechas (Anterior / Siguiente) */}
                  <div className="chart-period-navigator" style={{
                    background: darkMode ? '#2a2a2a' : '#f8f6f4',
                    border: darkMode ? '1px solid #3a3a3a' : '1px solid #e8e4e0'
                  }}>
                    <button 
                      type="button" 
                      className="btn-nav-period"
                      onClick={() => { setChartOffset(prev => prev - 1); setHoveredDay(null); }}
                      title={`Ver ${chartTimeframe === 'semana' ? 'semana anterior' : chartTimeframe === 'mes' ? 'mes anterior' : 'año anterior'}`}
                      style={{
                        color: darkMode ? '#c8c8c8' : '#2a2a2a',
                        border: darkMode ? '1px solid #3a3a3a' : '1px solid #d1cec9'
                      }}
                    >
                      ‹ Anterior
                    </button>
                    <span className="current-period-label" style={{
                      color: darkMode ? '#ececec' : '#2a2a2a'
                    }}>{periodoTitulo}</span>
                    <div className="period-nav-right">
                      {chartOffset !== 0 && (
                        <button 
                          type="button" 
                          className="btn-reset-period"
                          onClick={() => { setChartOffset(0); setHoveredDay(null); }}
                          title="Volver al período actual"
                          style={{
                            color: darkMode ? '#e05a7a' : '#7A1E3A',
                            border: darkMode ? '1px solid #3a3a3a' : '1px solid #d1cec9'
                          }}
                        >
                          Actual
                        </button>
                      )}
                      <button 
                        type="button" 
                        className="btn-nav-period"
                        disabled={chartOffset >= 0}
                        onClick={() => { setChartOffset(prev => Math.min(0, prev + 1)); setHoveredDay(null); }}
                        title={`Ver ${chartTimeframe === 'semana' ? 'semana siguiente' : chartTimeframe === 'mes' ? 'mes siguiente' : 'año siguiente'}`}
                        style={{
                          color: darkMode ? '#c8c8c8' : '#2a2a2a',
                          border: darkMode ? '1px solid #3a3a3a' : '1px solid #d1cec9'
                        }}
                      >
                        Siguiente ›
                      </button>
                    </div>
                  </div>

                  {/* Resumen del Período Seleccionado */}
                  <div className="seller-sales-overview-grid">
                    <div className="sales-overview-stat">
                      <span className="stat-title">Total en el Período</span>
                      <strong className="stat-num">{formatPrecio(totalPeriodo)}</strong>
                      <small className="stat-desc">{ordenesPeriodo} orden(es) registrada(s)</small>
                    </div>
                    <div className="sales-overview-stat">
                      <span className="stat-title">Ventas Hoy</span>
                      <strong className="stat-num">{loadingStats ? "…" : stats ? formatPrecio(stats.total_hoy) : "$0 COP"}</strong>
                      <small className="stat-desc">{stats?.ordenes_hoy || 0} órdenes hoy</small>
                    </div>
                    <div className="sales-overview-stat">
                      <span className="stat-title">Ventas este Mes</span>
                      <strong className="stat-num">{loadingStats ? "…" : stats ? formatPrecio(stats.total_mes) : "$0 COP"}</strong>
                      <small className="stat-desc">{stats?.ordenes_mes || 0} órdenes este mes</small>
                    </div>
                  </div>

                  {/* Contenedor del Gráfico */}
                  <div className="seller-modern-chart-wrapper">
                    <div className="chart-interactive-container">
                      {/* Tooltip flotante informativo */}
                      <div className="chart-floating-indicator" style={{
                        background: darkMode ? '#1e1e1e' : '#fff',
                        border: darkMode ? '1px solid #3a3a3a' : '1px solid #ede8e3',
                        boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'
                      }}>
                        <div className="indicator-day-badge" style={{
                          background: darkMode ? '#2a1a24' : '#fdf2f4',
                          color: darkMode ? '#e05a7a' : '#7A1E3A'
                        }}>
                          <span className="dot-indicator" style={{
                            background: darkMode ? '#e05a7a' : '#7A1E3A'
                          }}></span>
                          <span style={{ color: darkMode ? '#ececec' : '#2a2a2a' }}>{activeItem?.fechaTexto || "—"}</span>
                        </div>
                        <div className="indicator-data-group">
                          <strong className="indicator-value" style={{
                            color: darkMode ? '#ececec' : '#2a2a2a'
                          }}>{formatPrecio(activeItem?.total || 0)}</strong>
                          <span className="indicator-orders" style={{
                            color: darkMode ? '#b8b8b8' : '#666'
                          }}>
                            {activeItem?.ordenes > 0 
                              ? `${activeItem.ordenes} orden(es)` 
                              : activeItem?.esHoy 
                                ? "Hoy (en curso)" 
                                : "Sin ventas"}
                          </span>
                        </div>
                      </div>

                      {chartType === 'area' ? (
                        <div className="svg-chart-viewport">
                          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="modern-svg-chart" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="areaGradientVentas" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#7A1E3A" stopOpacity="0.28" />
                                <stop offset="70%" stopColor="#7A1E3A" stopOpacity="0.05" />
                                <stop offset="100%" stopColor="#7A1E3A" stopOpacity="0.0" />
                              </linearGradient>
                              <filter id="glowVentas" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#7A1E3A" floodOpacity="0.28" />
                              </filter>
                            </defs>

                            {/* Líneas guía horizontales y etiquetas Y perfectamente alineadas */}
                            {[1, 0.5, 0].map((r, i) => {
                              const yPos = padTop + plotH - r * plotH;
                              const valorGuia = maxVal * r;
                              const { val, suf } = formatearEjeY(valorGuia);
                              return (
                                <g key={i}>
                                  <line
                                    x1={padLeft}
                                    y1={yPos}
                                    x2={svgW - padRight}
                                    y2={yPos}
                                    stroke={darkMode ? "#3a3a3a" : "#ede8e3"}
                                    strokeDasharray={r === 0 ? "none" : "4 4"}
                                    strokeWidth={r === 0 ? "1.2" : "1"}
                                  />
                                  {/* Símbolo $ alineado a la izquierda */}
                                  <text
                                    x={padLeft - 48}
                                    y={yPos + 4}
                                    fontSize="11"
                                    fill={darkMode ? "#888" : "#a8a29e"}
                                    fontWeight="600"
                                    fontFamily="Montserrat, sans-serif"
                                  >
                                    $
                                  </text>
                                  {/* Cifra numérica alineada a la derecha de la columna numérica */}
                                  <text
                                    x={padLeft - 18}
                                    y={yPos + 4}
                                    textAnchor="end"
                                    fontSize="11"
                                    fill={darkMode ? "#888" : "#78716c"}
                                    fontWeight="700"
                                    fontFamily="Montserrat, sans-serif"
                                  >
                                    {val}
                                  </text>
                                  {/* Letra de sufijo (k o M) alineada en su propia columna fija */}
                                  <text
                                    x={padLeft - 17}
                                    y={yPos + 4}
                                    fontSize="11"
                                    fill={darkMode ? "#888" : "#a8a29e"}
                                    fontWeight="600"
                                    fontFamily="Montserrat, sans-serif"
                                  >
                                    {suf}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Área con gradiente */}
                            <path d={areaPath} fill="url(#areaGradientVentas)" />

                            {/* Línea curva principal */}
                            <path
                              d={linePath}
                              fill="none"
                              stroke={darkMode ? "#e05a7a" : "#7A1E3A"}
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter="url(#glowVentas)"
                            />

                            {/* Puntos interactivos con guía vertical al hover */}
                            {pts.map((p, i) => {
                              const isHovered = hoveredDay === i;
                              return (
                                <g 
                                  key={i} 
                                  className="svg-point-group"
                                  onMouseEnter={() => setHoveredDay(i)}
                                  onMouseLeave={() => setHoveredDay(null)}
                                  style={{ cursor: "pointer" }}
                                >
                                  {/* Línea vertical tenue sobre el punto al pasar el cursor */}
                                  {isHovered && (
                                    <line
                                      x1={p.x}
                                      y1={padTop}
                                      x2={p.x}
                                      y2={padTop + plotH}
                                      stroke={darkMode ? "#e05a7a" : "#7A1E3A"}
                                      strokeOpacity="0.25"
                                      strokeDasharray="3 3"
                                      strokeWidth="1.2"
                                    />
                                  )}

                                  <circle cx={p.x} cy={p.y} r={nPoints > 15 ? "8" : "16"} fill="transparent" />

                                  {(p.esHoy || isHovered) && (
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r={isHovered ? "9" : "7"}
                                      fill={p.esHoy ? "#D4AF37" : (darkMode ? "#e05a7a" : "#7A1E3A")}
                                      opacity="0.28"
                                    />
                                  )}

                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isHovered ? "5.5" : nPoints > 15 ? "3" : "4.2"}
                                    fill={p.esHoy ? "#D4AF37" : (darkMode ? "#e05a7a" : "#7A1E3A")}
                                    stroke={darkMode ? "#1e1e1e" : "#ffffff"}
                                    strokeWidth={nPoints > 15 ? "1.5" : "2"}
                                    style={{ transition: "all 0.15s ease" }}
                                  />
                                </g>
                              );
                            })}

                            {/* EJE X EXACTO DENTRO DEL SVG: Alineado 1 a 1 con la coordenada p.x de cada punto */}
                            {pts.map((p, i) => {
                              const isHovered = hoveredDay === i;
                              const shouldShowLabel = nPoints <= 12 || i === 0 || i === nPoints - 1 || (i + 1) % 5 === 0;
                              return (
                                <g
                                  key={`x-axis-${i}`}
                                  onClick={() => setHoveredDay(i)}
                                  onMouseEnter={() => setHoveredDay(i)}
                                  onMouseLeave={() => setHoveredDay(null)}
                                  style={{ cursor: "pointer" }}
                                >
                                  {/* Línea o marca divisoria del día */}
                                  <line
                                    x1={p.x}
                                    y1={padTop + plotH}
                                    x2={p.x}
                                    y2={padTop + plotH + 4}
                                    stroke={isHovered ? (darkMode ? "#e05a7a" : "#7A1E3A") : (darkMode ? "#3a3a3a" : "#e5dfd7")}
                                    strokeWidth="1"
                                  />

                                  {/* Texto del día perfectamente centrado debajo de su punto */}
                                  <text
                                    x={p.x}
                                    y={padTop + plotH + (shouldShowLabel ? 18 : 14)}
                                    textAnchor="middle"
                                    fontSize={shouldShowLabel ? (nPoints > 15 ? "9.5" : "11") : "8"}
                                    fontWeight={p.esHoy || isHovered ? "800" : "600"}
                                    fill={p.esHoy ? (darkMode ? "#e05a7a" : "#7A1E3A") : isHovered ? (darkMode ? "#e05a7a" : "#7A1E3A") : shouldShowLabel ? (darkMode ? "#888" : "#8c857b") : (darkMode ? "#555" : "#d1cbbf")}
                                    fontFamily="Montserrat, sans-serif"
                                  >
                                    {shouldShowLabel ? p.label : "·"}
                                  </text>

                                  {/* Indicador 'Hoy' si corresponde */}
                                  {p.esHoy && (
                                    <text
                                      x={p.x}
                                      y={padTop + plotH + 30}
                                      textAnchor="middle"
                                      fontSize="8"
                                      fontWeight="800"
                                      fill="#D4AF37"
                                      fontFamily="Montserrat, sans-serif"
                                    >
                                      HOY
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      ) : (
                        <div className="modern-bars-viewport">
                          {items.map((d, idx) => {
                            const ratio = maxVal > 0 ? (d.total / maxVal) : 0;
                            const heightPct = Math.max(d.total > 0 ? 12 : 5, ratio * 100);
                            const isHovered = hoveredDay === idx;
                            return (
                              <div 
                                key={idx} 
                                className={`modern-bar-col ${d.esHoy ? 'col-today' : ''} ${isHovered ? 'col-hovered' : ''}`}
                                onMouseEnter={() => setHoveredDay(idx)}
                                onMouseLeave={() => setHoveredDay(null)}
                              >
                                <div className="modern-bar-track">
                                  <div 
                                    className="modern-bar-fill-inner" 
                                    style={{ height: `${heightPct}%` }}
                                  >
                                    {d.total > 0 && nPoints <= 12 && (
                                      <span className="bar-val-badge">${Math.round(d.total / 1000)}k</span>
                                    )}
                                  </div>
                                </div>
                                <span className="bar-x-label">{d.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="seller-chart-footer-info" style={{
                      color: darkMode ? '#888' : '#666'
                    }}>
                      <span>* Mostrando órdenes de tu tienda en {periodoTitulo}</span>
                      <button className="btn-inline-link" onClick={() => cambiarSeccion("Ventas")} style={{
                        color: darkMode ? '#e05a7a' : '#7A1E3A'
                      }}>
                        Ver historial detallado →
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Card 2: Top Libros Más Vendidos */}
          <div className="seller-card-box">
            <div className="seller-card-box-header" style={{
              borderBottom: darkMode ? '1px solid #3a3a3a' : '1px solid #f0eae2'
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="header-icon-circle">
                  <IconStar width={20} height={20} strokeWidth={2} style={{ color: "#D4AF37" }} />
                </div>
                <div>
                  <h3 className="seller-card-box-title" style={{
                    color: darkMode ? '#ececec' : '#1a1a1a'
                  }}>Libros Más Vendidos</h3>
                  <p className="seller-card-box-desc" style={{
                    color: darkMode ? '#b8b8b8' : '#6b7280'
                  }}>Los títulos con mayor demanda en tu catálogo</p>
                </div>
              </div>
              <button className="btn-ver-todos-link" onClick={() => cambiarSeccion("Mis Libros")} style={{
                color: darkMode ? '#e05a7a' : '#7A1E3A'
              }}>
                Ver catálogo completo →
              </button>
            </div>

            {loadingTop ? (
              <div className="seller-loading-box">Cargando libros más vendidos...</div>
            ) : topVendidos.length === 0 ? (
              <div className="seller-empty-box">
                <IconChartBar width={44} height={44} strokeWidth={1.5} style={{ color: "#7A1E3A", opacity: 0.6 }} />
                <p className="empty-title">Aún no registras ventas en tus libros</p>
                <p className="empty-sub">Tus títulos más populares y con mayor facturación se posicionarán automáticamente aquí.</p>
              </div>
            ) : (
              <div className="top-books-ranked-list">
                {topVendidos.slice(0, 5).map((libro, idx) => {
                  const libroImg = getLibroImageUrl(libro);
                  const rankClass = idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : "rank-other";
                  return (
                    <div key={libro.id_libro} className="top-book-card-item">
                      <div className={`rank-medal-badge ${rankClass}`}>
                        #{idx + 1}
                      </div>
                      <div className="top-book-cover-thumb">
                        {libroImg ? (
                          <img src={libroImg} alt={libro.titulo} />
                        ) : (
                          <div className="cover-placeholder">
                            <IconBook width={22} height={22} strokeWidth={1.8} />
                          </div>
                        )}
                      </div>
                      <div className="top-book-meta-info">
                        <h4 className="top-book-title">{libro.titulo}</h4>
                        <p className="top-book-author">{libro.autor_libro} {libro.nombre_categoria ? `· ${libro.nombre_categoria}` : ""}</p>
                        <div className="top-book-tags">
                          <BadgeEstado estado={libro.estado_libro} darkMode={darkMode} />
                        </div>
                      </div>
                      <div className="top-book-financials">
                        <span className="top-book-price">{formatPrecio(libro.precio_libro)}</span>
                        <span className="top-book-sold-count">
                          <strong>{libro.unidades_vendidas || 0}</strong> {libro.unidades_vendidas === 1 ? "unidad vendida" : "unidades vendidas"}
                        </span>
                        {libro.total_generado ? (
                          <small className="top-book-total-gen">Total: {formatPrecio(libro.total_generado)}</small>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: Últimos Libros Añadidos */}
          <div className="seller-card-box">
            <div className="seller-card-box-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="header-icon-circle">
                  <IconBookOpen width={20} height={20} strokeWidth={2} style={{ color: "#7A1E3A" }} />
                </div>
                <div>
                  <h3 className="seller-card-box-title">Últimos Libros Añadidos</h3>
                  <p className="seller-card-box-desc">Novedades recientes en el inventario de tu tienda</p>
                </div>
              </div>
              <button className="btn-ver-todos-link" onClick={() => cambiarSeccion("Mis Libros")}>
                Ver todos ({libros.length}) →
              </button>
            </div>

            {loadingLibros ? (
              <div className="seller-loading-box">Cargando publicaciones...</div>
            ) : libros.length === 0 ? (
              <div className="seller-empty-box">
                <IconBookOpen width={44} height={44} strokeWidth={1.5} style={{ color: "#7A1E3A", opacity: 0.6 }} />
                <p className="empty-title">No tienes libros publicados</p>
                <p className="empty-sub">Comienza agregando tus primeros libros al catálogo desde la sección Mis Libros.</p>
              </div>
            ) : (
              <div className="recent-books-modern-grid">
                {libros.slice(0, 4).map((libro) => {
                  const libroImg = getLibroImageUrl(libro);
                  const isLowStock = libro.stock <= stockUmbral;
                  return (
                    <div key={libro.id_libro} className="recent-book-modern-card">
                      <div className="recent-book-card-cover">
                        {libroImg ? (
                          <img src={libroImg} alt={libro.titulo} />
                        ) : (
                          <div className="cover-placeholder">
                            <IconBook width={28} height={28} strokeWidth={1.8} />
                          </div>
                        )}
                        {isLowStock && (
                          <span className="low-stock-float-tag">
                            {libro.stock === 0 ? "Agotado" : `Stock: ${libro.stock}`}
                          </span>
                        )}
                      </div>
                      <div className="recent-book-card-body">
                        <span 
                          className="book-category-pill"
                          style={{
                            background: categoriaColor(libro.nombre_categoria, darkMode).bg,
                            color: categoriaColor(libro.nombre_categoria, darkMode).color
                          }}
                        >
                          {libro.nombre_categoria || "General"}
                        </span>
                        <h4 className="book-item-title" title={libro.titulo}>{libro.titulo}</h4>
                        <p className="book-item-author">{libro.autor_libro}</p>
                        <div className="book-item-bottom">
                          <span className="book-item-price">{formatPrecio(libro.precio_libro)}</span>
                          <button 
                            className="btn-quick-edit"
                            onClick={() => setModalEditar(libro)}
                            title="Editar libro"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna Lateral (Derecha) */}
        <div className="seller-bento-side">
          {/* Card Lateral 1: Salud del Inventario y Umbral */}
          <div id="inventory-health-section" className="seller-card-box seller-side-card">
            <div className="seller-card-box-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className={`header-icon-circle ${alertasStock.length > 0 ? "circle-warning" : "circle-success"}`}>
                  {alertasStock.length > 0 ? (
                    <IconLock width={20} height={20} strokeWidth={2} style={{ color: "#d97706" }} />
                  ) : (
                    <IconCheck width={20} height={20} strokeWidth={2} style={{ color: "#16a34a" }} />
                  )}
                </div>
                <div>
                  <h3 className="seller-card-box-title">Alertas de Stock</h3>
                  <p className="seller-card-box-desc">Control de inventario mínimo</p>
                </div>
              </div>
            </div>

            <div className="inventory-health-status-box">
              <div className="health-status-indicator">
                <div className="status-label-group">
                  <span className="status-main-text">
                    {alertasStock.length === 0 ? "Inventario Saludable" : `${alertasStock.length} libro(s) con stock bajo`}
                  </span>
                  <span className="status-sub-text">
                    {alertasStock.length === 0 
                      ? "Todos los títulos están por encima del límite de alerta."
                      : "Se recomienda reabastecer unidades pronto."}
                  </span>
                </div>
              </div>

              {/* Ajuste de umbral estilizado */}
              <div className="threshold-config-box">
                <div className="threshold-info">
                  <label htmlFor="input-stock-umbral">Avisar cuando queden:</label>
                  <small>o menos unidades</small>
                </div>
                <div className="threshold-input-wrap">
                  <input
                    id="input-stock-umbral"
                    type="number"
                    min="0"
                    max="100"
                    value={stockUmbral}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setStockUmbral(val);
                      localStorage.setItem("stockUmbral", val);
                    }}
                  />
                  <span>uds</span>
                </div>
              </div>
            </div>

            {/* Lista de alertas o estado OK */}
            {alertasStock.length > 0 ? (
              <div className="inventory-alert-items-list">
                <div className="alert-items-header">
                  <span>Libros por reabastecer:</span>
                </div>
                {alertasStock.slice(0, 5).map((item) => (
                  <div key={item.id_libro} className="inventory-alert-item-row">
                    <div className="alert-item-info">
                      <strong>{item.titulo}</strong>
                      <span className={`stock-count-tag ${item.stock === 0 ? "tag-out" : "tag-low"}`}>
                        {item.stock === 0 ? "Sin stock (0 uds)" : `${item.stock} unidad(es)`}
                      </span>
                    </div>
                    <button 
                      className="btn-add-stock-fast"
                      onClick={() => setModalStock(item)}
                      title="Ajustar stock"
                    >
                      + Stock
                    </button>
                  </div>
                ))}
                {alertasStock.length > 5 && (
                  <button className="btn-see-all-alerts" onClick={() => cambiarSeccion("Mis Libros")}>
                    Ver {alertasStock.length - 5} libro(s) más en Mis Libros →
                  </button>
                )}
              </div>
            ) : (
              <div className="inventory-all-ok-box">
                <IconCheck width={28} height={28} strokeWidth={2.5} style={{ color: "#16a34a" }} />
                <p>No tienes libros en riesgo de agotarse según tu umbral de {stockUmbral} unidades.</p>
              </div>
            )}
          </div>

          {/* Card Lateral 2: Notificaciones y Avisos de la Tienda */}
          <div className="seller-card-box seller-side-card">
            <div className="seller-card-box-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="header-icon-circle">
                  <IconMessage width={20} height={20} strokeWidth={2} style={{ color: "#7A1E3A" }} />
                </div>
                <div>
                  <h3 className="seller-card-box-title">Actividad Reciente</h3>
                  <p className="seller-card-box-desc">Notificaciones y novedades</p>
                </div>
              </div>
              <button className="btn-ver-todos-link" onClick={() => cambiarSeccion("Notificaciones")}>
                Ver todas →
              </button>
            </div>

            {notificaciones && notificaciones.length > 0 ? (
              <div className="recent-activity-list">
                {notificaciones.slice(0, 4).map((notif) => (
                  <div 
                    key={notif.id_notificacion} 
                    className={`activity-item-card ${!notif.leida ? "activity-unread" : ""}`}
                    onClick={() => handleClickNotificacion(notif)}
                  >
                    <div className="activity-icon-slot">
                      {getIconoTipo(notif.tipo)}
                    </div>
                    <div className="activity-body">
                      <p className="activity-title">{notif.titulo}</p>
                      <p className="activity-desc">{notif.descripcion || notif.cuerpo}</p>
                      <span className="activity-time">{new Date(notif.fecha_creacion).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="seller-empty-box" style={{ padding: "24px 14px" }}>
                <IconCheck width={32} height={32} strokeWidth={1.8} style={{ color: "#9ca3af" }} />
                <p className="empty-title" style={{ fontSize: "0.92rem" }}>Sin notificaciones pendientes</p>
                <p className="empty-sub" style={{ fontSize: "0.82rem" }}>Las alertas de nuevos pedidos y mensajes aparecerán aquí.</p>
              </div>
            )}
          </div>

          {/* Card Lateral 3: Información y Consejos de la Tienda */}
          <div className="seller-card-box seller-side-card seller-tips-card">
            <div className="tips-card-header">
              <IconStar width={20} height={20} strokeWidth={2} style={{ color: "#D4AF37" }} />
              <h4>Consejos para aumentar tus ventas</h4>
            </div>
            <ul className="seller-tips-list">
              <li>
                <strong>Fotos de alta calidad:</strong> Los libros con portadas claras tienen hasta un 40% más de visualizaciones.
              </li>
              <li>
                <strong>Mantén tu stock al día:</strong> Evita cancelaciones actualizando tus existencias periódicamente.
              </li>
              <li>
                <strong>Descripciones detalladas:</strong> Incluye el estado exacto del libro (usado, nuevo, detalles de conservación).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
    );
  };

  const renderMisLibros = () => {
    const emptyStateText = darkMode ? '#f3f4f6' : '#444';
    const emptyStateMuted = darkMode ? '#b8b8b8' : '#777';

    return (
    <div className="mis-libros-container">
      {/* Cabecera Principal */}
      <div className="mis-libros-header-card">
        <div className="mis-libros-header-info">
          <h1 className="mis-libros-title">Mis Libros Publicados</h1>
          <p className="mis-libros-subtitle">Gestiona tu catálogo, actualiza existencias y publica nuevos títulos</p>
          
          <div className="mis-libros-kpi-pills">
            <span className="libros-kpi-pill">
              <strong>{libros.length}</strong> títulos
            </span>
            <span className="libros-kpi-pill">
              <strong>{totalStockUnidades}</strong> unidades en stock
            </span>
            <span className="libros-kpi-pill valor-pill">
              Valor catálogo: <strong>{formatPrecio(valorTotalInventario)}</strong>
            </span>
          </div>
        </div>

        <div className="mis-libros-top-actions">
          <button 
            type="button"
            className="btn-pos-venta-top" 
            onClick={() => {
              // Abrir modal de venta en mostrador para que el vendedor elija el libro que desee
              setModalVentaFisica({ id_libro: "" });
            }}
            title="Registrar venta en mostrador / local físico"
          >
            <IconShoppingBag width={17} height={17} strokeWidth={2.2} />
            <span>Venta en mostrador</span>
          </button>

          <button 
            type="button"
            className="btn-publicar-libro-top" 
            onClick={() => navigate("/vendedor/publicar")}
          >
            <IconPlus width={18} height={18} strokeWidth={2.5} />
            <span>Publicar nuevo libro</span>
          </button>
        </div>
      </div>

      {/* Alerta de stock bajo si aplica */}
      <AlertaStock alertas={alertasStock} umbral={stockUmbral} />

      {/* Barra de Filtros, Búsqueda y Orden */}
      <div className="mis-libros-toolbar">
        <div className="toolbar-search-box">
          <IconSearch width={17} height={17} strokeWidth={2} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por título, autor o categoría..."
            value={librosSearch}
            onChange={(e) => { setLibrosSearch(e.target.value); setLibrosPage(1); }}
            className="toolbar-search-input"
          />
          {librosSearch && (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={() => { setLibrosSearch(""); setLibrosPage(1); }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="toolbar-filters-group">
          {/* Filtro de Categoría */}
          <select
            value={librosCategoriaFilter}
            onChange={(e) => { setLibrosCategoriaFilter(e.target.value); setLibrosPage(1); }}
            className="toolbar-select"
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre_categoria}
              </option>
            ))}
          </select>

          {/* Filtro de Stock */}
          <select
            value={librosStockFilter}
            onChange={(e) => { setLibrosStockFilter(e.target.value); setLibrosPage(1); }}
            className="toolbar-select"
          >
            <option value="todos">Todo el inventario</option>
            <option value="disponibles">En stock normal</option>
            <option value="bajo_stock">Stock bajo ({bajoStockCount})</option>
            <option value="agotados">Agotados ({agotadosCount})</option>
          </select>

          {/* Filtro de Estado del Libro */}
          <select
            value={librosEstadoFilter}
            onChange={(e) => { setLibrosEstadoFilter(e.target.value); setLibrosPage(1); }}
            className="toolbar-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="usado_buen_estado">Usado — buen estado</option>
            <option value="usado_regular">Usado — estado regular</option>
          </select>

          {/* Ordenamiento */}
          <select
            value={librosOrder}
            onChange={(e) => { setLibrosOrder(e.target.value); setLibrosPage(1); }}
            className="toolbar-select order-select"
          >
            <option value="recientes">Más recientes</option>
            <option value="titulo_asc">Título (A - Z)</option>
            <option value="titulo_desc">Título (Z - A)</option>
            <option value="precio_desc">Precio: Mayor a menor</option>
            <option value="precio_asc">Precio: Menor a mayor</option>
            <option value="stock_desc">Stock: Mayor a menor</option>
            <option value="stock_asc">Stock: Menor a mayor</option>
          </select>
        </div>
      </div>

      {/* Listado de Libros */}
      <div className="mis-libros-list-card">
        {loadingLibros ? (
          <div className="seller-loading-box">Cargando catálogo de libros...</div>
        ) : libros.length === 0 ? (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
              <IconBookOpen width={48} height={48} strokeWidth={2} style={{ color: darkMode ? '#ff4f83' : '#7A1E3A' }} />
            </div>
            <p style={{ fontWeight: 700, color: emptyStateText, marginBottom: "8px", fontSize: "1.1rem" }}>No tienes libros publicados</p>
            <p style={{ color: emptyStateMuted, marginBottom: "16px", fontSize: "0.88rem" }}>Comienza a vender agregando tu primer título al catálogo.</p>
            <button className="btn btn-vinotinto" onClick={() => navigate("/vendedor/publicar")}>
              + Publicar primer libro
            </button>
          </div>
        ) : filteredLibros.length === 0 ? (
          <div className="mis-libros-no-results">
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
            <h4 style={{ color: emptyStateText }}>No se encontraron libros</h4>
            <p style={{ color: emptyStateMuted }}>No hay coincidencias con los filtros o el término de búsqueda actual.</p>
            <button 
              type="button" 
              className="btn-clear-filters"
              onClick={() => {
                setLibrosSearch("");
                setLibrosCategoriaFilter("todas");
                setLibrosStockFilter("todos");
                setLibrosEstadoFilter("todos");
                setLibrosOrder("recientes");
                setLibrosPage(1);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            {/* Cabecera de Columnas de la Tabla */}
            <div className="mis-libros-table-header">
              <span className="th-cell th-cover">Portada</span>
              <span className="th-cell th-info">Título y Autor</span>
              <span className="th-cell th-category">Categoría</span>
              <span className="th-cell th-condition">Estado</span>
              <span className="th-cell th-stock">Existencias</span>
              <span className="th-cell th-price">Precio</span>
              <span className="th-cell th-actions">Acciones</span>
            </div>

            {/* Tabla / Lista de Libros */}
            <div className="mis-libros-items-list">
              {paginatedLibros.map((libro) => {
                const libroImageUrl = getLibroImageUrl(libro);
                const isAgotado = Number(libro.stock || 0) <= 0;
                const isBajoStock = Number(libro.stock || 0) > 0 && Number(libro.stock || 0) <= stockUmbral;

                return (
                  <div key={libro.id_libro} className={`mis-libros-row ${isAgotado ? 'row-agotado' : ''}`}>
                    {/* Portada */}
                    <div className="libro-cover-container">
                      {libroImageUrl ? (
                        <img src={libroImageUrl} alt={libro.titulo} className="libro-cover-img" />
                      ) : (
                        <div className="libro-cover-placeholder">
                          <IconBook width={22} height={22} strokeWidth={1.8} style={{ color: darkMode ? '#e05a7a' : '#7A1E3A' }} />
                        </div>
                      )}
                    </div>

                    {/* Información Principal: Título y Autor */}
                    <div className="libro-info-main">
                      <h4 className="libro-main-title" title={libro.titulo}>
                        {libro.titulo}
                      </h4>
                      <p className="libro-author">{libro.autor_libro || "Autor desconocido"}</p>
                    </div>

                    {/* Categoría en columna dedicada y alineada en hilera */}
                    <div className="libro-category-cell">
                      <BadgeCategoriaLibro categoria={libro.nombre_categoria} darkMode={darkMode} />
                    </div>

                    {/* Badge Estado */}
                    <div className="libro-condition-cell">
                      <BadgeEstado estado={libro.estado_libro} darkMode={darkMode} />
                    </div>

                    {/* Estado de Stock con Badge Informativo */}
                    <div className="libro-stock-cell">
                      <div className={`stock-status-pill ${isAgotado ? 'stock-pill-danger' : isBajoStock ? 'stock-pill-warning' : 'stock-pill-ok'}`}>
                        <span className="stock-dot"></span>
                        <span className="stock-count-text">
                          {isAgotado ? "Agotado" : `${libro.stock} uds`}
                        </span>
                      </div>
                    </div>

                    {/* Precio */}
                    <div className="libro-price-cell">
                      <span className="libro-price-num">{formatPrecio(libro.precio_libro)}</span>
                    </div>

                    {/* Botones de Acción */}
                    <div className="libro-actions-cell">
                      <button
                        type="button"
                        className="btn-action-pill btn-action-pos"
                        onClick={() => setModalVentaFisica(libro)}
                        title="Registrar venta física directa en mostrador"
                      >
                        <IconShoppingBag width={13} height={13} strokeWidth={2.2} />
                        <span>Venta</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-pill btn-action-qr"
                        onClick={() => setModalCodigo(libro)}
                        title="Ver código de barras / identificación del libro"
                      >
                        <IconSearch width={13} height={13} strokeWidth={2} />
                        <span>ID</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-pill btn-action-stock"
                        onClick={() => setModalStock(libro)}
                        title="Ajustar unidades en stock"
                      >
                        <IconPackage width={13} height={13} strokeWidth={2} />
                        <span>Stock</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-pill btn-action-edit"
                        onClick={() => setModalEditar(libro)}
                        title="Editar información del libro"
                      >
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-pill btn-action-delete"
                        onClick={() => setModalEliminar(libro)}
                        title="Eliminar del catálogo"
                      >
                        <IconTrash width={13} height={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controles de Paginación */}
            <div className="mis-libros-pagination-bar">
              <div className="pagination-info">
                Mostrando <strong>{(currentPageLibros - 1) * librosPerPage + 1} - {Math.min(currentPageLibros * librosPerPage, totalLibrosFiltrados)}</strong> de <strong>{totalLibrosFiltrados}</strong> libros
                {totalLibrosFiltrados !== libros.length && (
                  <span className="pagination-total-note"> (filtrados de {libros.length} totales)</span>
                )}
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn-nav"
                  disabled={currentPageLibros <= 1}
                  onClick={() => setLibrosPage(prev => Math.max(1, prev - 1))}
                >
                  ‹ Anterior
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPagesLibros }, (_, idx) => idx + 1).map((pageNum) => {
                    if (
                      pageNum === 1 || 
                      pageNum === totalPagesLibros || 
                      Math.abs(pageNum - currentPageLibros) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`pagination-num-btn ${pageNum === currentPageLibros ? 'active' : ''}`}
                          onClick={() => setLibrosPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === 2 && currentPageLibros > 3) ||
                      (pageNum === totalPagesLibros - 1 && currentPageLibros < totalPagesLibros - 2)
                    ) {
                      return <span key={pageNum} className="pagination-ellipsis">…</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  className="pagination-btn-nav"
                  disabled={currentPageLibros >= totalPagesLibros}
                  onClick={() => setLibrosPage(prev => Math.min(totalPagesLibros, prev + 1))}
                >
                  Siguiente ›
                </button>
              </div>

              <div className="pagination-per-page">
                <label htmlFor="select-per-page">Ver:</label>
                <select
                  id="select-per-page"
                  value={librosPerPage}
                  onChange={(e) => {
                    setLibrosPerPage(Number(e.target.value));
                    setLibrosPage(1);
                  }}
                  className="select-per-page"
                >
                  <option value={8}>8 por pág.</option>
                  <option value={10}>10 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
  };

  const renderPerfil = () => {
    const PRIMARY = '#7A1E3A';
    const BORDER  = '#E0DBD4';
    const TEXT    = '#2A2A2A';
    const MUTED   = '#777';

    const getNivelColor = (nivel) => ({
      Bronce:  { bg: '#FFF8E1', border: '#CD7F32', text: '#CD7F32' },
      Plata:   { bg: '#F5F5F5', border: '#C0C0C0', text: '#757575' },
      Oro:     { bg: '#FFFDE7', border: '#FFD700', text: '#FF8F00' },
      Platino: { bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0' },
    }[nivel] || { bg: '#FFF8E1', border: '#CD7F32', text: '#CD7F32' });

    const handleFotoUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPerfilFotoUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post('/perfil/foto-perfil', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = resolveImageUrl(res.data?.url || res.data?.foto_perfil);
        setProfilePhotoUrl(url);
        setUserPhotoUrl(url);
        localStorage.setItem(getSellerMediaStorageKey('vendedor_user_photo_url'), url);
        clearLegacySellerMediaCache();
        window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { url } }));
        setPerfilMsg('Foto actualizada');
        setTimeout(() => setPerfilMsg(''), 3000);
      } catch { setPerfilMsg('Error al subir la foto'); }
      finally { setPerfilFotoUploading(false); }
    };

    const handleBannerUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPerfilBannerUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post('/perfil/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = resolveImageUrl(res.data?.url || res.data?.banner_perfil);
        setPerfilBannerUrl(url);
        setPerfilBannerColor(null);
        setBannerUrl(url);
        localStorage.setItem(getSellerMediaStorageKey('vendedor_banner_url'), url);
        clearLegacySellerMediaCache();
        setShowBannerEditor(false);
        window.dispatchEvent(new CustomEvent('profile-banner-updated', { detail: { bannerUrl: url, bannerColor: null } }));
        setPerfilMsg('Banner actualizado');
        setTimeout(() => setPerfilMsg(''), 3000);
      } catch { setPerfilMsg('Error al subir el banner'); }
      finally { setPerfilBannerUploading(false); }
    };

    const handleBannerColor = async (color) => {
      try {
        await api.patch('/perfil/banner-color', { banner_color: color });
        setPerfilBannerColor(color);
        setPerfilBannerUrl(null);
        setBannerUrl(null);
        localStorage.removeItem(getSellerMediaStorageKey('vendedor_banner_url'));
        clearLegacySellerMediaCache();
        setShowBannerEditor(false);
        window.dispatchEvent(new CustomEvent('profile-banner-updated', { detail: { bannerUrl: null, bannerColor: color } }));
        setPerfilMsg('Color de banner guardado');
        setTimeout(() => setPerfilMsg(''), 3000);
      } catch { setPerfilMsg('Error al guardar el color'); }
    };

    const handleSavePerfil = async () => {
      setSavingPerfil(true);
      try {
        const payload = {
          nombre_usuario: `${perfilName.trim()} ${perfilSurname.trim()}`.trim() || undefined,
          telefono: perfilPhone.trim() || undefined,
          ciudad: perfilCity.trim() || undefined,
          direccion: perfilAddress.trim() || undefined,
        };
        await api.put('/perfil/mi-perfil', payload);
        await api.put('/perfil/preferencias', {
          notificaciones_promociones: notifPromociones,
          notificaciones_pedidos: notifPedidos,
          notificaciones_novedades: notifNovedades,
        });
        setUserName(`${perfilName.trim()} ${perfilSurname.trim()}`.trim());
        await cargarEstadisticasUsuario();
        setPerfilMsg('Perfil actualizado correctamente');
        setTimeout(() => setPerfilMsg(''), 3500);
      } catch { setPerfilMsg('Error al guardar el perfil'); }
      finally { setSavingPerfil(false); }
    };

    const umbralesPuntos = {
      Bronce: 0,
      Plata: 50000,
      Oro: 150000,
      Zafiro: 300000,
      Rubi: 500000,
      Esmeralda: 800000,
      Amatista: 1200000,
      Perla: 1700000,
      Obsidiana: 2300000,
      Diamante: 3200000,
      Onix: 4500000,
      Platino: 6500000,
    };

    const card = {
      background: darkMode ? '#2a2a2a' : '#fff', borderRadius: '14px', padding: '1.5rem',
      marginBottom: '1.25rem', border: darkMode ? '1px solid #3a3a3a' : `1px solid ${BORDER}`,
      boxShadow: darkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
    };
    const cardTitle = {
      fontSize: '1.1rem', fontWeight: 800, color: darkMode ? '#e05a7a' : PRIMARY,
      marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px',
    };
    const inp = {
      width: '100%', padding: '10px 14px', borderRadius: '8px',
      border: darkMode ? '1px solid #4a4a4a' : `1px solid ${BORDER}`, fontSize: '0.92rem',
      fontFamily: 'Montserrat, sans-serif', color: darkMode ? '#ececec' : TEXT, background: darkMode ? '#353535' : '#fafafa',
      boxSizing: 'border-box',
    };
    const lbl = { display: 'block', fontWeight: 600, color: darkMode ? '#c8c8c8' : '#444', marginBottom: '5px', fontSize: '0.88rem' };
    const btnPrimary = {
      background: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px',
      padding: '10px 20px', fontWeight: 700, fontSize: '0.88rem',
      cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
    };

    const BANNER_COLORS = [
      '#7A1E3A', '#1E3A7A', '#1E7A3A', '#7A6A1E', '#3A1E7A', '#1E6A7A', '#2A2A2A', '#8B4513',
      'linear-gradient(135deg,#7A1E3A,#3A1E7A)',
      'linear-gradient(135deg,#1E3A7A,#1E7A6A)',
      'linear-gradient(135deg,#7A6A1E,#7A1E3A)',
      'linear-gradient(135deg,#2A2A2A,#7A1E3A)',
      'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
      'linear-gradient(135deg,#373B44,#4286f4)',
      'linear-gradient(135deg,#834d9b,#d04ed6)',
      'linear-gradient(135deg,#f093fb,#f5576c)',
    ];

    const getImgUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${resolveImageUrl(url)}`;
    };

    const _logoUrl         = getImgUrl(configForm.logo_url);
    const _bannerTiendaUrl = getImgUrl(configForm.banner_url);

    const _handleLogoUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tipo', 'logo');
      try {
        const res = await api.post('/tiendas/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.url) {
          setConfigForm(prev => ({ ...prev, logo_url: res.data.url }));
          setUserPhotoUrl(resolveImageUrl(res.data.url));
          setPerfilMsg('? Logo actualizado');
          setTimeout(() => setPerfilMsg(''), 3000);
        }
      } catch { setPerfilMsg('Error al subir el logo'); }
    };

    const _handleBannerTiendaUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tipo', 'banner');
      try {
        const res = await api.post('/tiendas/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.url) {
          setConfigForm(prev => ({ ...prev, banner_url: res.data.url }));
          setBannerUrl(resolveImageUrl(res.data.url));
          setPerfilMsg('? Banner actualizado');
          setTimeout(() => setPerfilMsg(''), 3000);
        }
      } catch { setPerfilMsg('Error al subir el banner'); }
    };

    const _nivelColors = nivelFidelizacion ? getNivelColor(nivelFidelizacion.nivel) : null;
    const _nivelPct    = nivelFidelizacion?.siguiente_nivel
      ? Math.min((nivelFidelizacion.puntos / (umbralesPuntos[nivelFidelizacion.nivel] || 1)) * 100, 100)
      : 100;

    return (
      <>
        <div className="welcome-card welcome-card--small">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.55rem', margin: 0 }}>
            <IconUser width={26} height={26} strokeWidth={2} style={{ color: darkMode ? '#e05a7a' : PRIMARY }} />
            Mi Perfil
          </h1>
          <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.9rem' }}>
            Actualiza tus datos, personaliza tu perfil y revisa tu actividad.
          </p>
        </div>

        {!perfilLoaded ? (
          <div className="pl-card" style={{ padding: '3rem', textAlign: 'center', color: MUTED }}>Cargando perfil...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', alignItems: 'start', marginTop: '1rem' }}>
            <div>
              <div className="pl-card" style={{ padding: '2rem', marginBottom: '1.25rem', background: darkMode ? '#2a2a2a' : '#fff', border: darkMode ? '1px solid #3a3a3a' : 'none' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: darkMode ? '#e05a7a' : 'var(--vinotinto)', fontSize: '1.2rem' }}>Información Personal</h3>

                {/* Cabecera visual del perfil */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem' }}>
                  <div style={{
                    width: '100%', height: '180px', borderRadius: '14px',
                      background: (perfilBannerUrl || bannerUrl) ? `url(${perfilBannerUrl || bannerUrl}) center/cover no-repeat` : (perfilBannerColor || (darkMode ? '#e05a7a' : PRIMARY)),
                    border: darkMode ? '2px solid #3a3a3a' : '2px solid #e0dbd4', position: 'relative', overflow: 'visible',
                  }}>
                    {perfilBannerColor?.startsWith('linear-gradient') && !perfilBannerUrl && (
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: perfilBannerColor, borderRadius: '12px' }} />
                    )}
                    <button onClick={() => setShowBannerEditor(v => !v)} style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 2, background: 'rgba(0,0,0,0.62)', color: 'white', border: 'none', borderRadius: '7px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                      ✏️ Editar banner
                    </button>
                    <div style={{ position: 'absolute', left: 24, bottom: -48, zIndex: 3 }}>
                      <label className="perfil-avatar-editable" title="Cambiar foto de perfil">
                        {(profilePhotoUrl || userPhotoUrl) ? (
                          <img src={profilePhotoUrl || userPhotoUrl} alt="Foto de perfil" />
                        ) : (
                          <span className="perfil-avatar-editable__fallback">
                            {perfilName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                        <span className="perfil-avatar-editable__overlay">✎</span>
                        <input type="file" accept="image/*" onChange={handleFotoUpload} disabled={perfilFotoUploading} />
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '58px 24px 0 0', minHeight: '58px', boxSizing: 'border-box', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, color: darkMode ? '#ececec' : '#1f2937', fontSize: '1.08rem', fontWeight: 800 }}>{`${perfilName || ''} ${perfilSurname || ''}`.trim() || 'Tu perfil'}</h3>
                      <p style={{ margin: '3px 0 0', color: darkMode ? '#c8c8c8' : '#777', fontSize: '0.82rem' }}>Perfil de vendedor</p>
                    </div>
                  </div>
                  {showBannerEditor && (
                    <div style={{ background: darkMode ? '#2a2a2a' : '#f9f7f4', borderRadius: '10px', padding: '1rem', border: darkMode ? '1px solid #3a3a3a' : '1px solid #e0dbd4' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: darkMode ? '#c8c8c8' : '#444' }}>Subir imagen</p>
                        <label style={{ background: darkMode ? '#e05a7a' : PRIMARY, color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-block', opacity: perfilBannerUploading ? 0.7 : 1 }}>
                          {perfilBannerUploading ? 'Subiendo...' : '📁 Elegir imagen'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} disabled={perfilBannerUploading} />
                        </label>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: darkMode ? '#c8c8c8' : '#444' }}>Colores sólidos</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['#7A1E3A','#1E3A7A','#1E7A3A','#7A6A1E','#3A1E7A','#1E6A7A','#2A2A2A','#8B4513'].map(c => (
                            <button key={c} onClick={() => handleBannerColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: perfilBannerColor === c ? '3px solid #fff' : '2px solid #ccc', cursor: 'pointer', boxShadow: perfilBannerColor === c ? `0 0 0 2px ${c}` : 'none' }} title={c} />
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '0.9rem', color: darkMode ? '#c8c8c8' : '#444' }}>Gradientes</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {BANNER_COLORS.filter(c => c.startsWith('linear')).map((g, i) => (
                            <button key={i} onClick={() => handleBannerColor(g)} style={{ width: 32, height: 32, borderRadius: '8px', backgroundImage: g, border: perfilBannerColor === g ? '3px solid #fff' : '2px solid #ccc', cursor: 'pointer', boxShadow: perfilBannerColor === g ? '0 0 0 2px #7A1E3A' : 'none' }} title={`Gradiente ${i+1}`} />
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: darkMode ? '#c8c8c8' : '#444' }}>Color personalizado</p>
                        <input type="color" defaultValue="#7A1E3A" onChange={e => handleBannerColor(e.target.value)} style={{ width: 34, height: 34, borderRadius: '8px', border: darkMode ? '1px solid #4a4a4a' : '1px solid #ccc', cursor: 'pointer', padding: 2 }} />
                      </div>
                    </div>
                  )}
                </div>

              </div>
              <div style={card}>
                <p style={cardTitle}>Datos de contacto</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div><label style={lbl}>Nombre</label><input style={inp} value={perfilName} onChange={e => setPerfilName(e.target.value)} placeholder="Nombre" /></div>
                  <div><label style={lbl}>Apellidos</label><input style={inp} value={perfilSurname} onChange={e => setPerfilSurname(e.target.value)} placeholder="Apellidos" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div><label style={lbl}>Telefono</label><input style={inp} value={perfilPhone} onChange={e => setPerfilPhone(e.target.value)} placeholder="Telefono" /></div>
                  <div><label style={lbl}>Ciudad</label><input style={inp} value={perfilCity} onChange={e => setPerfilCity(e.target.value)} placeholder="Ciudad" /></div>
                </div>
                <div><label style={lbl}>Direccion</label><input style={inp} value={perfilAddress} onChange={e => setPerfilAddress(e.target.value)} placeholder="Direccion" /></div>
                <div style={{ marginTop: '14px' }}>
                  <label style={lbl}>Correo electronico</label>
                  <input style={{ ...inp, background: darkMode ? '#2a2a2a' : '#f0f0f0', color: darkMode ? '#888' : '#888', cursor: 'not-allowed' }} value={perfilEmail} readOnly placeholder="Cargando..." />
                </div>
              </div>

              <div style={card}>
                <p style={cardTitle}>Preferencias de notificaciones</p>
                {[['Promociones', notifPromociones, setNotifPromociones], ['Pedidos', notifPedidos, setNotifPedidos], ['Novedades', notifNovedades, setNotifNovedades]].map(([label, enabled, setEnabled]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: darkMode ? '1px solid #3a3a3a' : `1px solid ${BORDER}` }}>
                    <span style={{ fontWeight: 600, color: darkMode ? '#c8c8c8' : TEXT }}>{label}</span>
                    <button onClick={() => setEnabled(!enabled)} style={{ minWidth: '110px', padding: '8px 16px', borderRadius: '999px', border: 'none', background: enabled ? (darkMode ? '#e05a7a' : PRIMARY) : (darkMode ? '#3a3a3a' : '#f0f0f0'), color: enabled ? '#fff' : (darkMode ? '#c8c8c8' : '#555'), fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
                      {enabled ? 'Activado' : 'Desactivado'}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
                <button onClick={handleSavePerfil} disabled={savingPerfil} style={{ ...btnPrimary, padding: '12px 32px', fontSize: '0.95rem', opacity: savingPerfil ? 0.7 : 1 }}>
                  {savingPerfil ? 'Guardando...' : 'Guardar cambios'}
                </button>
                {perfilMsg && <span style={{ color: perfilMsg.startsWith('\u2713') ? '#2e7d32' : '#c62828', fontWeight: 600, fontSize: '0.88rem' }}>{perfilMsg}</span>}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  const renderConfiguracion = () => {
    const PRIMARY   = '#7A1E3A';
    const PRIMARY_L = '#FDF2F4';
    const BORDER    = '#E5E7EB';
    const TEXT      = '#111827';
    const MUTED     = '#6B7280';
    const BG        = '#FAFAFA';

    // Paleta de colores según modo
    const t = {
      sectionBg:       darkMode ? '#2a2a2a' : '#fff',
      sectionBorder:   darkMode ? '1px solid #3a3a3a' : `1px solid ${BORDER}`,
      sectionHeaderBg: darkMode ? '#353535' : PRIMARY_L,
      sectionHeaderBorder: darkMode ? '1px solid #3a3a3a' : `1px solid ${BORDER}`,
      textPrimary:     darkMode ? '#ececec' : TEXT,
      textSecondary:   darkMode ? '#c8c8c8' : MUTED,
      textMuted:       darkMode ? '#999' : MUTED,
      inputBg:         darkMode ? '#353535' : BG,
      inputBorder:     darkMode ? '#4a4a4a' : BORDER,
      inputColor:      darkMode ? '#ececec' : TEXT,
      hintColor:       darkMode ? '#999' : MUTED,
      cardBg:          darkMode ? '#2a2a2a' : '#fff',
      cardBorder:      darkMode ? '1px solid #3a3a3a' : `1px solid ${BORDER}`,
      iconColor:       darkMode ? '#e05a7a' : PRIMARY,
      divider:         darkMode ? '#333' : BORDER,
      vino:            darkMode ? '#e05a7a' : PRIMARY,
    };

    const handleSaveConfig = () => {
      if (!tiendaForm.nombre_tienda?.trim()) {
        setTiendaMsg('El nombre de la tienda es obligatorio');
        return;
      }
      if (tiendaForm.nombre_tienda.trim().length < 3) {
        setTiendaMsg('El nombre debe tener al menos 3 caracteres');
        return;
      }
      Promise.all([
        api.put('/tiendas/mi-tienda', tiendaForm),
        api.put('/configuracion', configForm),
      ])
        .then(() => {
          setTiendaMsg('ok');
          setTimeout(() => setTiendaMsg(''), 3500);
          setTiendaInfo(prev => ({ ...prev, ...tiendaForm }));
        })
        .catch((err) => {
          setTiendaMsg('Error: ' + (err.response?.data?.detail || err.message));
          setTimeout(() => setTiendaMsg(''), 4000);
        });
    };

    // Estilos reutilizables
    const section = {
      background: t.sectionBg,
      borderRadius: '16px',
      border: t.sectionBorder,
      boxShadow: darkMode ? 'none' : '0 1px 6px rgba(0,0,0,0.05)',
      marginBottom: '20px',
      overflow: 'hidden',
    };
    const sectionHeader = (color = t.sectionHeaderBg) => ({
      background: color,
      padding: '14px 22px',
      borderBottom: t.sectionHeaderBorder,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    });
    const sectionTitle = {
      fontSize: '0.95rem', fontWeight: 800, color: t.iconColor, margin: 0,
    };
    const sectionBody = { padding: '22px' };
    const row = { display: 'grid', gap: '16px', marginBottom: '16px' };
    const field = { display: 'flex', flexDirection: 'column', gap: '6px' };
    const lbl = {
      fontSize: '0.8rem', fontWeight: 700, color: darkMode ? '#c8c8c8' : '#374151',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    };
    const inp = {
      padding: '10px 14px', borderRadius: '10px',
      border: `1.5px solid ${t.inputBorder}`, fontSize: '0.9rem',
      fontFamily: 'inherit', color: t.inputColor, background: t.inputBg,
      boxSizing: 'border-box', width: '100%',
      outline: 'none', transition: 'border-color 0.15s',
    };
    const inpTA = { ...inp, resize: 'vertical', minHeight: '90px', lineHeight: 1.5 };
    const hint = { fontSize: '0.74rem', color: t.hintColor, marginTop: 2 };
    const badge = (txt, bg, col) => (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        background: bg, color: col,
        fontSize: '0.72rem', fontWeight: 700,
        padding: '2px 8px', borderRadius: '999px',
        border: `1px solid ${col}33`,
      }}>{txt}</span>
    );

    return (
      <>
        {/* ── HEADER ── */}
        <div style={{
          background: darkMode ? 'linear-gradient(135deg, #e05a7a 0%, #c5425a 100%)' : `linear-gradient(135deg, ${PRIMARY} 0%, #9B2449 100%)`,
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 4px 20px rgba(122,30,58,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconSettings width={26} height={26} strokeWidth={2} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.01em' }}>
                Configuración de tienda
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '0.84rem', opacity: 0.82 }}>
                Personaliza tu perfil, logística y políticas en BookyHome
              </p>
            </div>
          </div>
          {tiendaInfo && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}>
              🏪 {tiendaForm.nombre_tienda || tiendaInfo.nombre_tienda}
            </div>
          )}
        </div>

        {!tiendaInfo ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: MUTED }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚙️</div>
            Cargando configuración de la tienda...
          </div>
        ) : (
          <div>

            {/* ── SECCIÓN 1: Identidad de la tienda ── */}
            <div style={section}>
              <div style={sectionHeader(darkMode ? '#1a2a3a' : '#F0F9FF')}>
                <span style={{ fontSize: '1.1rem' }}>🏪</span>
                <p style={{ ...sectionTitle, color: darkMode ? '#60a5fa' : '#0369A1' }}>Identidad de la tienda</p>
              </div>
              <div style={sectionBody}>
                <div style={{ ...row, gridTemplateColumns: '1fr 1fr' }}>
                  <div style={field}>
                    <label style={lbl}>Nombre de la tienda <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      style={inp}
                      value={tiendaForm.nombre_tienda}
                      onChange={e => setTiendaForm({ ...tiendaForm, nombre_tienda: e.target.value })}
                      placeholder="Ej: Librería El Quijote"
                      onFocus={e => e.target.style.borderColor = t.vino}
                      onBlur={e => e.target.style.borderColor = t.inputBorder}
                    />
                  </div>
                  <div style={field}>
                    <label style={lbl}>Teléfono de contacto</label>
                    <input
                      style={inp}
                      value={tiendaForm.telefono}
                      onChange={e => setTiendaForm({ ...tiendaForm, telefono: e.target.value })}
                      placeholder="Ej: 3001234567"
                      onFocus={e => e.target.style.borderColor = t.vino}
                      onBlur={e => e.target.style.borderColor = t.inputBorder}
                    />
                  </div>
                </div>
                <div style={{ ...row, gridTemplateColumns: '1fr 1fr' }}>
                  <div style={field}>
                    <label style={lbl}>Dirección física</label>
                    <input
                      style={inp}
                      value={tiendaForm.direccion}
                      onChange={e => setTiendaForm({ ...tiendaForm, direccion: e.target.value })}
                      placeholder="Calle 123 # 45-67"
                      onFocus={e => e.target.style.borderColor = t.vino}
                      onBlur={e => e.target.style.borderColor = t.inputBorder}
                    />
                  </div>
                  <div style={field}>
                    <label style={lbl}>Ciudad de origen</label>
                    <input
                      style={inp}
                      value={configForm.ciudad_origen || ''}
                      onChange={e => setConfigForm({ ...configForm, ciudad_origen: e.target.value })}
                      placeholder="Ej: Bogotá, Medellín..."
                      onFocus={e => e.target.style.borderColor = t.vino}
                      onBlur={e => e.target.style.borderColor = t.inputBorder}
                    />
                  </div>
                </div>
                <div style={{ ...row, gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
                  <div style={field}>
                    <label style={lbl}>Email público</label>
                    <input
                      style={inp}
                      type="email"
                      value={configForm.email_publico || ''}
                      onChange={e => setConfigForm({ ...configForm, email_publico: e.target.value })}
                      placeholder="contacto@milibreria.com"
                      onFocus={e => e.target.style.borderColor = t.vino}
                      onBlur={e => e.target.style.borderColor = t.inputBorder}
                    />
                  </div>
                  <div style={field}>
                    <label style={lbl}>Horario de atención</label>
                    <input
                      style={inp}
                      value={configForm.horario_atencion}
                      onChange={e => setConfigForm({ ...configForm, horario_atencion: e.target.value })}
                      placeholder="Lun–Vie 9am–6pm"
                      onFocus={e => e.target.style.borderColor = t.vino}
                      onBlur={e => e.target.style.borderColor = t.inputBorder}
                    />
                  </div>
                </div>
                {tiendaInfo.fecha_creacion && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: '0.82rem', color: MUTED, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📅 Miembro desde <strong style={{ color: TEXT }}>{tiendaInfo.fecha_creacion}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECCIÓN 2: Descripción ── */}
            <div style={section}>
              <div style={sectionHeader('#F0F9FF')}>
                <span style={{ fontSize: '1.1rem' }}>📝</span>
                <p style={{ ...sectionTitle, color: '#0369A1' }}>Descripción pública</p>
              </div>
              <div style={sectionBody}>
                <div style={field}>
                  <label style={lbl}>Describe tu tienda</label>
                  <textarea
                    style={{ ...inpTA, minHeight: '110px' }}
                    placeholder="Cuéntales a tus compradores qué hace especial a tu librería: géneros, servicios, historia..."
                    value={configForm.descripcion || ''}
                    onChange={e => setConfigForm({ ...configForm, descripcion: e.target.value })}
                    onFocus={e => e.target.style.borderColor = t.vino}
                    onBlur={e => e.target.style.borderColor = t.inputBorder}
                  />
                  <span style={hint}>{(configForm.descripcion || '').length}/500 caracteres recomendados</span>
                </div>
              </div>
            </div>

            {/* ── SECCIÓN 3: Logística y envío ── */}
            <div style={section}>
              <div style={sectionHeader('#F0FDF4')}>
                <span style={{ fontSize: '1.1rem' }}>🚚</span>
                <p style={{ ...sectionTitle, color: '#15803D' }}>Logística y envío</p>
              </div>
              <div style={sectionBody}>
                {/* Grid unificado: cada columna tiene campo + alerta + política alineados */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

                  {/* ── Columna izquierda: Días + alerta retiro + Política envíos ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={field}>
                      <label style={lbl}>Días promedio de despacho</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          style={{ ...inp, paddingRight: 60 }}
                          type="number"
                          min="1"
                          max="30"
                          value={configForm.tiempo_despacho_dias}
                          onChange={e => setConfigForm({ ...configForm, tiempo_despacho_dias: parseInt(e.target.value) || 2 })}
                          onFocus={e => e.target.style.borderColor = t.vino}
                          onBlur={e => e.target.style.borderColor = t.inputBorder}
                        />
                        <span style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          fontSize: '0.78rem', color: MUTED, fontWeight: 600, pointerEvents: 'none',
                        }}>días</span>
                      </div>
                      <span style={hint}>Tiempo estimado desde que recibes el pedido hasta despachar.</span>
                    </div>

                    <div style={{ background: darkMode ? '#1a3a2a' : '#F0FDF4', border: darkMode ? '1px solid #2a5a3a' : '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px', fontSize: '0.8rem', color: darkMode ? '#6ae07a' : '#166534', display: 'flex', gap: 8 }}>
                      <span>📦</span>
                      <span>El retiro en tienda (Click &amp; Collect) es <strong>siempre gratuito</strong> para el comprador.</span>
                    </div>

                    <div style={field}>
                      <label style={lbl}>Política de envíos</label>
                      <textarea
                        style={inpTA}
                        placeholder="Describe tus condiciones de envío: transportadoras, zonas de cobertura, tiempos estimados..."
                        value={configForm.politica_envios}
                        onChange={e => setConfigForm({ ...configForm, politica_envios: e.target.value })}
                        onFocus={e => e.target.style.borderColor = t.vino}
                        onBlur={e => e.target.style.borderColor = t.inputBorder}
                      />
                    </div>
                  </div>

                  {/* ── Columna derecha: Tarifa + alerta IVA + Política devoluciones ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={field}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={lbl}>Tarifa de envío a domicilio</span>
                        {badge('COP', '#FEF9C3', '#854D0E')}
                        {(configForm.tarifa_envio === 0 || !configForm.tarifa_envio) && badge('Gratis', '#DCFCE7', '#166534')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          padding: '10px 12px', background: '#F3F4F6',
                          border: `1.5px solid ${BORDER}`, borderRight: 'none',
                          borderRadius: '10px 0 0 10px',
                          fontSize: '0.88rem', fontWeight: 800, color: '#374151',
                          whiteSpace: 'nowrap',
                        }}>$</span>
                        <input
                          style={{ ...inp, borderRadius: '0 10px 10px 0', borderLeft: 'none', flex: 1 }}
                          type="number"
                          min="0"
                          step="500"
                          value={configForm.tarifa_envio === undefined || configForm.tarifa_envio === null ? '' : configForm.tarifa_envio}
                          onChange={e => {
                            const raw = e.target.value;
                            setConfigForm({ ...configForm, tarifa_envio: raw === '' ? 0 : parseFloat(raw) });
                          }}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            setConfigForm(prev => ({ ...prev, tarifa_envio: isNaN(val) ? 0 : Math.max(0, val) }));
                          }}
                          onFocus={e => e.target.style.borderColor = t.vino}
                          placeholder="0"
                        />
                      </div>
                      <span style={hint}>Retiro en tienda siempre es gratis. Pon 0 para ofrecer domicilio gratis.</span>
                    </div>

                    <div style={{ background: darkMode ? '#1a2a3a' : '#EFF6FF', border: darkMode ? '1px solid #2a4a5a' : '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', fontSize: '0.8rem', color: darkMode ? '#60a5fa' : '#1D4ED8', display: 'flex', gap: 8 }}>
                      <span>📚</span>
                      <span>Los libros tienen <strong>IVA $0</strong> — exentos por el Art. 424 del E.T. colombiano.</span>
                    </div>

                    <div style={field}>
                      <label style={lbl}>Política de devoluciones</label>
                      <textarea
                        style={inpTA}
                        placeholder="Condiciones para devoluciones, cambios y garantías de tus libros..."
                        value={configForm.politica_devoluciones}
                        onChange={e => setConfigForm({ ...configForm, politica_devoluciones: e.target.value })}
                        onFocus={e => e.target.style.borderColor = t.vino}
                        onBlur={e => e.target.style.borderColor = t.inputBorder}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ── BOTÓN GUARDAR ── */}
            <div style={{
              background: t.cardBg,
              borderRadius: '16px',
              border: t.cardBorder,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              boxShadow: darkMode ? 'none' : '0 1px 6px rgba(0,0,0,0.05)',
              marginBottom: '1.5rem',
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: t.textPrimary, fontSize: '0.92rem' }}>¿Listo para actualizar?</p>
                <p style={{ margin: '2px 0 0', color: t.textSecondary, fontSize: '0.8rem' }}>Los cambios se verán reflejados de inmediato en tu perfil público.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {tiendaMsg === 'ok' && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: darkMode ? '#6ae07a' : '#15803D', fontWeight: 700, fontSize: '0.88rem',
                    background: darkMode ? '#1a3a2a' : '#DCFCE7', padding: '6px 14px', borderRadius: 8,
                    border: darkMode ? '1px solid #2a5a3a' : '1px solid #BBF7D0',
                  }}>
                    ✓ Cambios guardados
                  </span>
                )}
                {tiendaMsg && tiendaMsg !== 'ok' && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: '#DC2626', fontWeight: 700, fontSize: '0.88rem',
                    background: '#FEF2F2', padding: '6px 14px', borderRadius: 8,
                    border: '1px solid #FECACA',
                  }}>
                    ⚠️ {tiendaMsg}
                  </span>
                )}
                <button
                  onClick={handleSaveConfig}
                  style={{
                    background: darkMode ? 'linear-gradient(135deg, #e05a7a 0%, #c5425a 100%)' : `linear-gradient(135deg, ${PRIMARY} 0%, #9B2449 100%)`,
                    color: '#fff', border: 'none', borderRadius: '10px',
                    padding: '11px 28px', fontWeight: 800, fontSize: '0.92rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(122,30,58,0.3)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(122,30,58,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(122,30,58,0.3)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Guardar cambios
                </button>
              </div>
            </div>

            {/* ── SECCIÓN: Preferencias Visuales ── */}
            <div style={section}>
              <div style={sectionHeader(darkMode ? '#353535' : PRIMARY_L)}>
                <span style={{ fontSize: '1.1rem' }}>🎨</span>
                <p style={sectionTitle}>Preferencias Visuales</p>
              </div>
              <div style={sectionBody}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.2rem',
                  background: darkMode ? '#2a2a2a' : '#faf8f6',
                  borderRadius: '8px',
                  borderLeft: darkMode ? '4px solid #e05a7a' : '4px solid var(--vinotinto)'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', color: darkMode ? '#ececec' : '#2a2a2a', fontSize: '1rem' }}>Modo Oscuro</h4>
                    <p style={{ margin: 0, color: darkMode ? '#c8c8c8' : '#666', fontSize: '0.85rem' }}>Cambia el tema de la aplicación a modo oscuro</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={() => {
                        const newMode = !darkMode;
                        setDarkMode(newMode);
                        localStorage.setItem('darkMode', newMode);
                        if (newMode) {
                          document.documentElement.classList.add('dark');
                        } else {
                          document.documentElement.classList.remove('dark');
                        }
                        window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { darkMode: newMode } }));
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: darkMode ? '#e05a7a' : '#ccc',
                      transition: '0.3s', borderRadius: '26px'
                    }}></span>
                    <span style={{
                      position: 'absolute', content: '', height: '20px', width: '20px',
                      left: '3px', bottom: '3px', backgroundColor: 'white',
                      transition: '0.3s', borderRadius: '50%',
                      transform: darkMode ? 'translateX(22px)' : 'translateX(0)'
                    }}></span>
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}
      </>
    );
  };

  const RenderCuentasBancarias = () => (
    <>
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconCreditCard width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Cuentas Bancarias
        </h1>
        <p style={{ margin: 0, color: darkMode ? '#c8c8c8' : '#666' }}>Gestiona las cuentas donde recibirás directamente los pagos de tus ventas.</p>
      </div>

      <div className="pl-card" style={{ padding: "2rem", marginTop: "20px", background: darkMode ? '#1e1e1e' : '#fff', borderColor: darkMode ? '#3a3a3a' : '#e8e8e8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: darkMode ? '#f3f4f6' : '#2A2A2A' }}>Mis Cuentas Bancarias</h3>
          <button
            onClick={() => setMostrarFormCuenta(true)}
            style={{
              background: "var(--vinotinto)", color: "white", border: "none",
              padding: "10px 20px", borderRadius: "8px", fontWeight: 600,
              fontSize: "0.9rem", cursor: "pointer"
            }}
          >
            + Agregar Cuenta
          </button>
        </div>

        {mostrarFormCuenta && (
          <div style={{ padding: '20px', background: darkMode ? '#2a2a2a' : '#f4f4f4', border: `1px solid ${darkMode ? '#3a3a3a' : '#ddd'}`, borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: darkMode ? '#f3f4f6' : '#2A2A2A' }}>Agregar Nueva Cuenta</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <select
                value={cuentaForm.tipo_cuenta}
                onChange={(e) => setCuentaForm({...cuentaForm, tipo_cuenta: e.target.value})}
                style={{ padding: '10px', border: `1px solid ${darkMode ? '#4a4a4a' : '#ddd'}`, borderRadius: '6px', background: darkMode ? '#1f1f1f' : '#fff', color: darkMode ? '#f3f4f6' : '#2A2A2A' }}
              >
                <option value="">Tipo de cuenta</option>
                <option value="Ahorros">Ahorros</option>
                <option value="Corriente">Corriente</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
              </select>
              <select
                value={cuentaForm.banco}
                onChange={(e) => setCuentaForm({...cuentaForm, banco: e.target.value})}
                style={{ padding: '10px', border: `1px solid ${darkMode ? '#4a4a4a' : '#ddd'}`, borderRadius: '6px', background: darkMode ? '#1f1f1f' : '#fff', color: darkMode ? '#f3f4f6' : '#2A2A2A' }}
              >
                <option value="">Selecciona el banco</option>
                <option value="Bancolombia">Bancolombia</option>
                <option value="Davivienda">Davivienda</option>
                <option value="Banco de Bogotá">Banco de Bogotá</option>
                <option value="BBVA Colombia">BBVA Colombia</option>
                <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                <option value="Banco Popular">Banco Popular</option>
                <option value="Banco GNB Sudameris">Banco GNB Sudameris</option>
                <option value="Citibank Colombia">Citibank Colombia</option>
                <option value="HSBC Colombia">HSBC Colombia</option>
                <option value="Banco Pichincha">Banco Pichincha</option>
                <option value="Bancoomeva">Bancoomeva</option>
                <option value="Banco Falabella">Banco Falabella</option>
                <option value="Banco Agrario">Banco Agrario</option>
                <option value="Banco WWB">Banco WWB</option>
                <option value="Caja Social">Caja Social</option>
                <option value="Colpatria">Colpatria</option>
                <option value="Conavi">Conavi</option>
                <option value="Mibanco">Mibanco</option>
                <option value="Lulo Bank">Lulo Bank</option>
                <option value="Rappi">Rappi</option>
                <option value="Nu">Nu</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
                <option value="PSE">PSE</option>
                <option value="Efecty">Efecty</option>
                <option value="Baloto">Baloto</option>
                <option value="Gana">Gana</option>
                <option value="AstroPay">AstroPay</option>
                <option value="PayU">PayU</option>
                <option value="Otro">Otro banco</option>
              </select>
              <input
                type="text"
                placeholder="Número de cuenta"
                value={cuentaForm.numero_cuenta}
                onChange={(e) => setCuentaForm({...cuentaForm, numero_cuenta: e.target.value})}
                style={{ padding: '10px', border: `1px solid ${darkMode ? '#4a4a4a' : '#ddd'}`, borderRadius: '6px', background: darkMode ? '#1f1f1f' : '#fff', color: darkMode ? '#f3f4f6' : '#2A2A2A' }}
              />
              <input
                type="text"
                placeholder="Nombre del titular"
                value={cuentaForm.nombre_titular}
                onChange={(e) => setCuentaForm({...cuentaForm, nombre_titular: e.target.value})}
                style={{ padding: '10px', border: `1px solid ${darkMode ? '#4a4a4a' : '#ddd'}`, borderRadius: '6px', background: darkMode ? '#1f1f1f' : '#fff', color: darkMode ? '#f3f4f6' : '#2A2A2A' }}
              />
              <input
                type="text"
                placeholder="Cédula del titular"
                value={cuentaForm.cedula_titular}
                onChange={(e) => setCuentaForm({...cuentaForm, cedula_titular: e.target.value})}
                style={{ padding: '10px', border: `1px solid ${darkMode ? '#4a4a4a' : '#ddd'}`, borderRadius: '6px', background: darkMode ? '#1f1f1f' : '#fff', color: darkMode ? '#f3f4f6' : '#2A2A2A' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: darkMode ? '#d1d5db' : '#2A2A2A' }}>
                <input
                  type="checkbox"
                  checked={cuentaForm.es_principal}
                  onChange={(e) => setCuentaForm({...cuentaForm, es_principal: e.target.checked})}
                />
                Marcar como cuenta principal para recibir pagos
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAgregarCuenta}
                  style={{
                    background: "var(--vinotinto)", color: "white", border: "none",
                    padding: "10px 20px", borderRadius: "6px", fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setMostrarFormCuenta(false);
                    setCuentaForm({
                      tipo_cuenta: '',
                      banco: '',
                      numero_cuenta: '',
                      nombre_titular: '',
                      cedula_titular: '',
                      es_principal: false
                    });
                  }}
                  style={{
                    background: "#ccc", color: "#2A2A2A", border: "none",
                    padding: "10px 20px", borderRadius: "6px", fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {cuentasBancarias.length === 0 ? (
          <p style={{ color: darkMode ? '#d1d5db' : '#666', textAlign: 'center', padding: '40px' }}>
            No tienes cuentas bancarias registradas. Agrega tu primera cuenta para empezar a recibir pagos.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {cuentasBancarias.map((cuenta) => (
              <div key={cuenta.id_metodo} style={{
                padding: '16px',
                border: `1px solid ${darkMode ? '#3a3a3a' : '#ddd'}`,
                borderRadius: '8px',
                background: darkMode ? (cuenta.es_principal ? '#2a2a2a' : '#1f1f1f') : (cuenta.es_principal ? '#f0f0f0' : '#fff'),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: darkMode ? '#f3f4f6' : '#2A2A2A' }}>{cuenta.banco}</h4>
                    {cuenta.es_principal && (
                      <span style={{
                        padding: '4px 8px',
                        background: 'var(--vinotinto)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Principal
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0', color: darkMode ? '#d1d5db' : '#666', fontSize: '0.9rem' }}>
                    {cuenta.tipo_cuenta} - {cuenta.numero_cuenta}
                  </p>
                  <p style={{ margin: '4px 0', color: darkMode ? '#d1d5db' : '#666', fontSize: '0.9rem' }}>
                    Titular: {cuenta.nombre_titular}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {!cuenta.es_principal && (
                    <button
                      onClick={() => handleMarcarPrincipal(cuenta.id_metodo)}
                      style={{
                        padding: '6px 12px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Hacer Principal
                    </button>
                  )}
                  <button
                    onClick={() => confirmarEliminarCuenta(cuenta)}
                    style={{
                      padding: '6px 12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderProximamente = (nombre) => (
    <div className="welcome-card">
      <div className="empty-state" style={{ boxShadow: "none", padding: "60px 20px" }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
          <IconLock width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
        </div>
        <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px", fontSize: "1.1rem" }}>{nombre}</p>
        <p style={{ fontSize: "0.87rem", color: "#888" }}>Esta Sección estará disponible próximamente</p>
      </div>
    </div>
  );

  const ejecutarHabilitarPago = async () => {
    if (!modalHabilitarPago?.pedido) return;
    const idOrden = modalHabilitarPago.pedido.id_orden;
    try {
      setActualizandoRetiro(idOrden);
      const res = await habilitarPagoRetiro(idOrden);
      if (res.data?.ok) {
        setModalHabilitarPago(prev => ({ ...prev, exito: true, error: "" }));
        cargarPedidos();
        setTimeout(() => {
          setModalHabilitarPago(null);
        }, 1600);
      } else {
        setModalHabilitarPago(prev => ({ ...prev, error: res.data?.error || "No se pudo habilitar el pago" }));
      }
    } catch (e) {
      setModalHabilitarPago(prev => ({ ...prev, error: e.response?.data?.detail || "No se pudo habilitar el pago." }));
    } finally {
      setActualizandoRetiro(null);
    }
  };

  const ejecutarConfirmarEntrega = async () => {
    if (!modalConfirmarEntrega?.pedido) return;
    const { pedido, esEfectivo } = modalConfirmarEntrega;
    const idOrden = pedido.id_orden;
    try {
      setActualizandoRetiro(idOrden);
      const res = await confirmarEntregaRetiro(idOrden, esEfectivo);
      if (res.data?.ok) {
        setModalConfirmarEntrega(prev => ({ ...prev, exito: true, error: "" }));
        cargarPedidos();
        setTimeout(() => {
          setModalConfirmarEntrega(null);
        }, 1600);
      } else {
        setModalConfirmarEntrega(prev => ({ ...prev, error: res.data?.error || "No se pudo confirmar la entrega" }));
      }
    } catch (e) {
      setModalConfirmarEntrega(prev => ({ ...prev, error: e.response?.data?.detail || "No se pudo confirmar la entrega." }));
    } finally {
      setActualizandoRetiro(null);
    }
  };

  const renderPedidos = () => {
    const pedidosRetiro = pedidos.filter(p => p.tipo_entrega === 'retiro_tienda');
    const clientesEnTienda = pedidosRetiro.filter(p => p.estado_retiro === 'en_tienda').length;

    const conteoEstado = {
      todos: pedidos.length,
      retiro_tienda: pedidosRetiro.length,
      pendiente: 0, pagado: 0, enviado: 0, entregada: 0, cancelada: 0,
    };
    pedidos.forEach((p) => {
      const e = normalizarEstado(p.estado);
      if (conteoEstado[e] !== undefined) conteoEstado[e] += 1;
    });

    const pedidosAMostrar = pedidos.filter(p => {
      if (filtroEstadoPedidos === 'retiro_tienda') return p.tipo_entrega === 'retiro_tienda';
      if (filtroEstadoPedidos !== 'todos' && normalizarEstado(p.estado) !== filtroEstadoPedidos) return false;
      const term = busquedaPedidos.trim().toLowerCase();
      if (term) {
        const en = [p.id_orden, p.id_orden_unico, p.codigo_compra, p.cliente, p.correo_cliente, p.telefono_cliente]
          .filter(v => v !== null && v !== undefined)
          .join(" ")
          .toLowerCase();
        if (!en.includes(term)) return false;
      }
      return true;
    });

    const totalPagsPed = Math.max(1, Math.ceil(pedidosAMostrar.length / pedidosPorPagina));
    const paginaActual = Math.min(paginaPedidos, totalPagsPed);

    return (
      <>
        <div className="welcome-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IconPackage width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
              Pedidos Recibidos
            </h1>
            <p style={{ margin: 0 }}>Gestiona las compras y retiros de tus clientes</p>
          </div>
          <button
            onClick={cargarPedidos}
            disabled={loadingPedidos}
            style={{
              background: darkMode ? '#1f1f1f' : '#FFFFFF',
              border: darkMode ? '1.5px solid #3a3a3a' : '1.5px solid #CBD5E1',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: darkMode ? '#f3f4f6' : '#1E293B',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.28)' : '0 1px 4px rgba(0,0,0,0.06)'
            }}
          >
            <span>🔄</span> {loadingPedidos ? 'Actualizando...' : 'Actualizar Pedidos'}
          </button>
        </div>

        <div className="seller-books" style={{ marginTop: "20px" }}>
          {/* BARRA DE FILTROS POR ESTADO */}
          <div className="pedidos-filtros">
            <span className="pedidos-filtros__label">Estado</span>
            <button
              className={`pedidos-filtros__tab${filtroEstadoPedidos === "todos" ? " is-active" : ""}`}
              onClick={() => { setFiltroEstadoPedidos("todos"); setPaginaPedidos(1); }}
            >
              <span>📦</span> Todos
              <span className="pedidos-filtros__count">{conteoEstado.todos}</span>
            </button>
            <button
              className={`pedidos-filtros__tab${filtroEstadoPedidos === "retiro_tienda" ? " is-active" : ""}`}
              onClick={() => { setFiltroEstadoPedidos("retiro_tienda"); setPaginaPedidos(1); }}
            >
              <span>🏪</span> Retiros en Tienda
              <span className="pedidos-filtros__count">{conteoEstado.retiro_tienda}</span>
              {clientesEnTienda > 0 && (
                <span className="pedidos-filtros__urgente">
                  <span>⏰</span> {clientesEnTienda} ¡En tienda!
                </span>
              )}
            </button>
            <button
              className={`pedidos-filtros__tab${filtroEstadoPedidos === "pendiente" ? " is-active" : ""}`}
              onClick={() => { setFiltroEstadoPedidos("pendiente"); setPaginaPedidos(1); }}
            >
              <span>⏳</span> Pendientes
              <span className="pedidos-filtros__count">{conteoEstado.pendiente}</span>
            </button>
            <button
              className={`pedidos-filtros__tab${filtroEstadoPedidos === "pagado" ? " is-active" : ""}`}
              onClick={() => { setFiltroEstadoPedidos("pagado"); setPaginaPedidos(1); }}
            >
              <span>💳</span> Pagadas
              <span className="pedidos-filtros__count">{conteoEstado.pagado}</span>
            </button>
            <button
              className={`pedidos-filtros__tab${filtroEstadoPedidos === "enviado" ? " is-active" : ""}`}
              onClick={() => { setFiltroEstadoPedidos("enviado"); setPaginaPedidos(1); }}
            >
              <span>🚚</span> Enviadas
              <span className="pedidos-filtros__count">{conteoEstado.enviado}</span>
            </button>
            <button
              className={`pedidos-filtros__tab${filtroEstadoPedidos === "entregada" ? " is-active" : ""}`}
              onClick={() => { setFiltroEstadoPedidos("entregada"); setPaginaPedidos(1); }}
            >
              <span>✅</span> Entregadas
              <span className="pedidos-filtros__count">{conteoEstado.entregada}</span>
            </button>
            <button
              className={`pedidos-filtros__tab${filtroEstadoPedidos === "cancelada" ? " is-active" : ""}`}
              onClick={() => { setFiltroEstadoPedidos("cancelada"); setPaginaPedidos(1); }}
            >
              <span>❌</span> Canceladas
              <span className="pedidos-filtros__count">{conteoEstado.cancelada}</span>
            </button>
            <span className="pedidos-filtros__spacer" />
            <div className="pedidos-busqueda-box">
              <IconSearch width={17} height={17} strokeWidth={2} className="search-icon" />
              <input
                type="text"
                className="pedidos-busqueda"
                placeholder="Buscar por #orden, código o cliente..."
                value={busquedaPedidos}
                onChange={(e) => { setBusquedaPedidos(e.target.value); setPaginaPedidos(1); }}
              />
              {busquedaPedidos && (
                <button type="button" className="search-clear-btn" onClick={() => setBusquedaPedidos("")} aria-label="Limpiar búsqueda">✕</button>
              )}
            </div>
          </div>

          {loadingPedidos && <p style={{ color: "#999", padding: "20px 0" }}>Cargando pedidos...</p>}
          {!loadingPedidos && pedidosAMostrar.length === 0 && (
            <div className="empty-state">
              <div className="pedidos-empty-icon">
                <IconPackage width={30} height={30} strokeWidth={2} style={{ color: darkMode ? '#ff8eac' : '#7A1E3A' }} />
              </div>
              <p style={{ fontWeight: 700, color: darkMode ? '#f3f4f6' : '#444', marginBottom: '8px' }}>
                {busquedaPedidos.trim()
                  ? 'No se encontraron pedidos con esa búsqueda'
                  : filtroEstadoPedidos === 'retiro_tienda'
                    ? 'No hay retiros en tienda registrados'
                    : 'Aún no has recibido pedidos'}
              </p>
              <p style={{ fontSize: '0.85rem', color: darkMode ? '#c8c8c8' : '#888' }}>
                {busquedaPedidos.trim()
                  ? 'Revisa el número de orden, el código de compra o el nombre del cliente'
                  : filtroEstadoPedidos === 'retiro_tienda'
                    ? 'Las reservas para recoger en tu librería aparecerán aquí'
                    : 'Cuando un comprador adquiera tus libros, aparecerán aquí'}
              </p>
              {busquedaPedidos.trim() && pedidos.length > 0 && (
                <p className="pedidos-empty-sugerencia">
                  Tus pedidos actualmente: {pedidos.map(p => `#${p.id_orden}`).join(", ")} — prueba con uno de estos
                </p>
              )}
            </div>
          )}
          {!loadingPedidos && pedidosAMostrar.length > 0 && (
            <>
            <div className="pedidos-tabla-encabezado">
              <span>{busquedaPedidos.trim() ? <>Resultados para <strong>"{busquedaPedidos.trim()}"</strong></> : "Listado de pedidos"}</span>
              <span className="pedidos-tabla-encabezado__info">
                Mostrando {Math.min(pedidosAMostrar.length, pedidosPorPagina)} de {pedidosAMostrar.length} pedido{pedidosAMostrar.length === 1 ? "" : "s"}
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="ventas-table ventas-table--pedidos" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0dbd4", color: "var(--vinotinto)" }}>
                    <th style={{ width: "96px" }}>ID Orden</th>
                    <th style={{ width: "118px" }}>Fecha</th>
                    <th style={{ width: "180px" }}>Cliente</th>
                    <th style={{ width: "280px" }}>Libros</th>
                    <th style={{ width: "126px" }}>Estado</th>
                    <th style={{ width: "185px" }}>Guía / Retiro</th>
                    <th style={{ width: "115px" }}>Total Tienda</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosAMostrar.slice((paginaActual - 1) * pedidosPorPagina, paginaActual * pedidosPorPagina).map((pedido, idx) => {
                    const estadoNorm = normalizarEstado(pedido.estado);
                    const esRetiro = pedido.tipo_entrega === 'retiro_tienda';
                    const pendienteGuia = !esRetiro && !pedido.envio && ["pagado", "enviado"].includes(estadoNorm);
                    const totalUds = (pedido.items || []).reduce((sum, it) => sum + Number(it.cantidad || 1), 0);
                    const primerItem = (pedido.items && pedido.items[0]) || {};
                    const primerTitulo = primerItem.titulo || "Libro";
                    const primerImagen = primerItem.imagen;
                    const primerAutor = primerItem.autor_libro || null;
                    const inicialesCliente = String(pedido.cliente || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";
                    const fotoClienteUrl = resolveImageUrl(pedido.foto_perfil_cliente);
                    // Retiro en tienda: la tienda recibe el valor completo de la orden.
                    // Domicilio: recibe lo de sus libros + el costo de envío (de ahí paga la transportadora).
                    const montoTienda = pedido.tipo_entrega === 'retiro_tienda'
                      ? (pedido.total_orden ?? pedido.total_tienda)
                      : ((pedido.total_tienda ?? 0) + (pedido.costo_envio_tienda ?? 0));

                    const estilos = {
                      pagado:    { border: "#1e8a45", bg: "#eafaf1", color: "#145c2e", label: "Pagada",    emoji: "💳" },
                      enviado:   { border: "#2979c7", bg: "#eaf3ff", color: "#1a4f8a", label: "Enviada",   emoji: "🚚" },
                      entregada: { border: "#7A1E3A", bg: "#f8e9ee", color: "#7A1E3A", label: "Entregada", emoji: "✅" },
                      cancelada: { border: "#dc2626", bg: "#fee2e2", color: "#b91c1c", label: "Cancelada", emoji: "❌" },
                      pendiente: { border: "#e67e22", bg: "#fef5e7", color: "#b95c00", label: "Pendiente", emoji: "⏳" },
                    };
                    const c = estilos[estadoNorm] || estilos.pendiente;

                    return (
                    <tr key={`${pedido.id_orden}-${idx}`} className={`ventas-table__row${pendienteGuia ? " ventas-table__row--alerta" : ""}`} style={{ borderBottom: "1px solid #f0ebe4" }}>
                      <td className="ventas-table__center">
                        <div className="pedidos-id">
                          <div className="pedidos-id__chip">#{pedido.id_orden}</div>
                          <div className="pedidos-id__code">{pedido.codigo_compra}</div>
                        </div>
                      </td>
                      <td className="ventas-table__center">
                        <div className={`pedidos-fecha${pedido.fecha ? "" : " pedidos-fecha--reciente"}`}>
                          {pedido.fecha ? <>📅 {new Date(pedido.fecha).toLocaleDateString("es-CO")}</> : "Reciente"}
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div className="pedidos-cliente">
                          <div
                            className={`pedidos-cliente__avatar${fotoClienteUrl ? " pedidos-cliente__avatar--foto" : ""}`}
                            onClick={() => fotoClienteUrl && setFotoCliente({ url: fotoClienteUrl, nombre: pedido.cliente, correo: pedido.correo_cliente })}
                            role={fotoClienteUrl ? "button" : undefined}
                            title={fotoClienteUrl ? "Ver foto de perfil" : undefined}
                          >
                            {fotoClienteUrl ? (
                              <img className="pedidos-cliente__avatar-img" src={fotoClienteUrl} alt="" />
                            ) : inicialesCliente}
                          </div>
                          <div className="pedidos-cliente__info">
                            <span className="pedidos-cliente__name">{pedido.cliente}</span>
                            <span className="pedidos-cliente__mail">
                              <span className="pedidos-cliente__mail-icon">✉️</span>
                              <span className="pedidos-cliente__mail-text">{pedido.correo_cliente}</span>
                            </span>
                            {pedido.telefono_cliente && (
                              <span className="pedidos-cliente__phone">
                                <span>📞</span> {pedido.telefono_cliente}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div className="pedidos-libro">
                          <div className="pedidos-libro__thumb">
                            {resolveImageUrl(primerImagen) ? (
                              <img className="ventas-book-thumb__img" src={resolveImageUrl(primerImagen)} alt="" />
                            ) : (
                              <div className="ventas-book-placeholder">
                                <div className="ventas-book-placeholder__spine" />
                                <IconBook className="ventas-book-placeholder__icon" width={17} height={17} strokeWidth={2} />
                                <div className="ventas-book-placeholder__lines">
                                  <div /><div /><div />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="pedidos-libro__info">
                            <span className="pedidos-libro__title">{primerTitulo}</span>
                            {primerAutor && <span className="pedidos-libro__author">{primerAutor}</span>}
                            <span className="pedidos-uds">
                              <span>📚</span> {totalUds} unidad{totalUds === 1 ? "" : "es"}
                            </span>
                            {(pedido.items && pedido.items.length > 0) && (
                              <button type="button" className="pedidos-ver-detalle" onClick={() => setDetallePedido(pedido)}>
                                Ver detalle {pedido.items.length > 1 ? `(${pedido.items.length})` : ""}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="ventas-table__center">
                        <div className={`pedidos-estado pedidos-estado--${estadoNorm}`}>
                          <span className="pedidos-estado__dot" />
                          {c.label}
                        </div>
                      </td>
                      <td className="ventas-table__center" style={{ padding: "12px", minWidth: "155px" }}>
                        {(() => {
                          // SI ES RETIRO EN TIENDA
                          if (esRetiro) {
                            const metodoPagoNormalizado = String(pedido.metodo_pago || '').toLowerCase().replace(/\s+/g, '_');
                            const esPagoEfectivo = !pedido.metodo_pago || metodoPagoNormalizado.includes('efectivo');
                            return (
                              <div className="pedidos-guia">
                                <div className="pedidos-retiro-card">
                                  <div className="pedidos-retiro-card__head">
                                    <span className="pedidos-retiro-card__icon">🏪</span>
                                    <span className="pedidos-retiro-card__title">Retiro en tienda</span>
                                  </div>
                                  <div className="pedidos-retiro-card__pin">
                                    <span className="pedidos-retiro-card__pin-label">PIN</span>
                                    <span className="pedidos-retiro-card__pin-value">{pedido.pin_retiro || '----'}</span>
                                  </div>
                                  {pedido.fecha_limite_retiro && (
                                    <div className="pedidos-retiro-card__limite">
                                      <span>⏳</span> Retira antes del {new Date(pedido.fecha_limite_retiro).toLocaleDateString("es-CO")}
                                    </div>
                                  )}
                                </div>

                                {pedido.estado_retiro === 'en_tienda' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                                    <div className="pedidos-guia__nota">📍 ¡Cliente en tienda!</div>
                                    {estadoNorm === 'pagado' ? (
                                      <>
                                        <div className="pedidos-guia__aplica">💳 Pagado ({pedido.metodo_pago || 'En línea'})</div>
                                        <button
                                          onClick={() => setModalConfirmarEntrega({ pedido, esEfectivo: false, exito: false, error: "" })}
                                          disabled={actualizandoRetiro === pedido.id_orden}
                                          className="pedidos-guia__btn pedidos-guia__btn--block"
                                        >
                                          <span>✅</span> Entregar Libro
                                        </button>
                                      </>
                                    ) : esPagoEfectivo ? (
                                      <button
                                        onClick={() => setModalConfirmarEntrega({ pedido, esEfectivo: true, exito: false, error: "" })}
                                        disabled={actualizandoRetiro === pedido.id_orden}
                                        className="pedidos-guia__btn pedidos-guia__btn--block"
                                      >
                                        <span>💵</span> Cobrar Efectivo y Entregar
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setModalHabilitarPago({ pedido, exito: false, error: "" })}
                                        disabled={actualizandoRetiro === pedido.id_orden}
                                        className="pedidos-guia__btn pedidos-guia__btn--block"
                                      >
                                        <span>🔔</span> Habilitar Pago
                                      </button>
                                    )}
                                  </div>
                                )}

                                {pedido.estado_retiro === 'reservado' && (
                                  <div className="pedidos-guia" style={{ width: '100%' }}>
                                    {estadoNorm === 'pagado' ? (
                                      <div className="pedidos-guia__aplica">💳 Pagado ({pedido.metodo_pago || 'En línea'})</div>
                                    ) : (
                                      <div className="pedidos-guia__aviso pedidos-guia__aviso--wait">🟡 Esperando llegada</div>
                                    )}
                                  </div>
                                )}

                                {pedido.estado_retiro === 'habilitado_pago' && (
                                  <div className="pedidos-guia" style={{ width: '100%' }}>
                                    {estadoNorm === 'pagado' ? (
                                      <div className="pedidos-guia__aplica">💳 Pagado ({pedido.metodo_pago || 'En línea'})</div>
                                    ) : (
                                      <div className="pedidos-guia__aviso pedidos-guia__aviso--ready">⏳ Esperando pago en tienda</div>
                                    )}
                                    <button
                                      onClick={() => setModalConfirmarEntrega({ pedido, esEfectivo: estadoNorm !== 'pagado', exito: false, error: "" })}
                                      disabled={actualizandoRetiro === pedido.id_orden}
                                      className="pedidos-guia__btn pedidos-guia__btn--block"
                                    >
                                      <span>✅</span> {estadoNorm === 'pagado' ? 'Entregar Libro (Ya Pagado)' : 'Cobrar Efectivo y Entregar'}
                                    </button>
                                  </div>
                                )}

                                {["entregado", "entregada"].includes(pedido.estado_retiro) && (
                                  <div className="pedidos-guia__piloto pedidos-guia__piloto--done pedidos-guia__piloto--block">✅ Entregado en tienda</div>
                                )}

                                {(!pedido.estado_retiro && estadoNorm === 'pagado') && (
                                  <button
                                    onClick={() => setModalConfirmarEntrega({ pedido, esEfectivo: false, exito: false, error: "" })}
                                    disabled={actualizandoRetiro === pedido.id_orden}
                                    className="pedidos-guia__btn pedidos-guia__btn--block"
                                  >
                                    <span>✅</span> Confirmar Entrega
                                  </button>
                                )}
                              </div>
                            );
                          }

                          // 1. Orden cancelada (estado ya visible en la columna Estado)
                          if (estadoNorm === "cancelada") {
                            return (
                              <span className="pedidos-guia__empty">—</span>
                            );
                          }

                          // 2. Guía ya registrada
                          if (pedido.envio) {
                            return (
                              <div className="pedidos-guia">
                                <div className="pedidos-envio-card">
                                  <div className="pedidos-envio-card__head">
                                    <span className="pedidos-envio-card__icon">🚚</span>
                                    <span className="pedidos-envio-card__empresa">{pedido.envio.empresa_mensajeria || "Mensajería"}</span>
                                  </div>
                                  <div className="pedidos-envio-card__nro">
                                    <span className="pedidos-envio-card__nro-label">No. guía</span>
                                    <span className="pedidos-envio-card__nro-value">{pedido.envio.numero_guia}</span>
                                  </div>
                                  {(() => {
                                    const dir = pedido.direccion_entrega || {};
                                    const texto = [dir.alias, dir.direccion, dir.ciudad, dir.departamento].filter(Boolean).join(" · ");
                                    if (!texto) return null;
                                    return (
                                      <div className="pedidos-envio-card__dir">
                                        <span>📍</span>
                                        <span>{texto}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                                {["pagado", "enviado"].includes(estadoNorm) && (
                                  <button
                                    onClick={() => abrirRegistroEnvio(pedido)}
                                    className="pedidos-guia__btn pedidos-guia__btn--block"
                                  >
                                    ✏️ Editar Guía
                                  </button>
                                )}
                              </div>
                            );
                          }

                          // 3. Pagada o enviada pero sin guía: botón para registrarla
                          if (["pagado", "enviado"].includes(estadoNorm)) {
                            return (
                              <div className="pedidos-guia">
                                {pendienteGuia && (
                                  <div className="pedidos-guia__nota">⚠ Falta guía</div>
                                )}
                                {(() => {
                                  const dir = pedido.direccion_entrega || {};
                                  const texto = [dir.alias, dir.direccion, dir.ciudad, dir.departamento].filter(Boolean).join(" · ");
                                  if (!texto) return null;
                                  return (
                                    <div className="pedidos-envio-card__dir">
                                      <span>📍</span>
                                      <span>{texto}</span>
                                    </div>
                                  );
                                })()}
                                <button
                                  onClick={() => abrirRegistroEnvio(pedido)}
                                  className="pedidos-guia__btn"
                                >
                                  + Registrar Guía
                                </button>
                              </div>
                            );
                          }

                          // 4. Entregada sin guía
                          if (estadoNorm === "entregada") {
                            return (
                              <div className="pedidos-guia__piloto pedidos-guia__piloto--done">
                                Entregado
                              </div>
                            );
                          }

                          // 5. Pendiente de pago real
                          return (
                            <div className="pedidos-guia__piloto pedidos-guia__piloto--wait">
                              Pendiente de pago
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div className="pedidos-total">
                          <div className="pedidos-total__value">{formatPrecio(montoTienda)}</div>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalPagsPed > 1 && (
                <div className="mis-libros-pagination-bar" style={{ marginTop: "16px" }}>
                  <div className="pagination-info">
                    Mostrando <strong>{(paginaActual - 1) * pedidosPorPagina + 1} - {Math.min(paginaActual * pedidosPorPagina, pedidosAMostrar.length)}</strong> de <strong>{pedidosAMostrar.length}</strong> pedidos
                  </div>

                  <div className="pagination-controls">
                    <button type="button" className="pagination-btn-nav" disabled={paginaActual <= 1} onClick={() => setPaginaPedidos(prev => Math.max(1, prev - 1))}>
                      ‹ Anterior
                    </button>
                    <div className="pagination-numbers">
                      {Array.from({ length: totalPagsPed }, (_, idx) => idx + 1).map((pageNum) => {
                        if (pageNum === 1 || pageNum === totalPagsPed || Math.abs(pageNum - paginaActual) <= 1) {
                          return (
                            <button key={pageNum} type="button" className={`pagination-num-btn ${pageNum === paginaActual ? 'active' : ''}`} onClick={() => setPaginaPedidos(pageNum)}>
                              {pageNum}
                            </button>
                          );
                        } else if (
                          (pageNum === 2 && paginaActual > 3) ||
                          (pageNum === totalPagsPed - 1 && paginaActual < totalPagsPed - 2)
                        ) {
                          return <span key={pageNum} className="pagination-ellipsis">…</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button type="button" className="pagination-btn-nav" disabled={paginaActual >= totalPagsPed} onClick={() => setPaginaPedidos(prev => Math.min(totalPagsPed, prev + 1))}>
                      Siguiente ›
                    </button>
                  </div>

                  <div className="pagination-per-page">
                    <label htmlFor="select-per-page-pedidos">Ver:</label>
                    <select id="select-per-page-pedidos" value={pedidosPorPagina} onChange={(e) => { setPedidosPorPagina(Number(e.target.value)); setPaginaPedidos(1); }} className="select-per-page">
                      <option value={5}>5 por pág.</option>
                      <option value={10}>10 por pág.</option>
                      <option value={20}>20 por pág.</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            </>
          )}
        </div>
        {detallePedido && (
          <div className="modal-overlay open" onClick={() => setDetallePedido(null)}>
            <div className="modal-box ventas-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ventas-modal__header">
                <div>
                  <h2 className="ventas-modal__title">Detalle de la orden #{detallePedido.id_orden}</h2>
                  <p className="ventas-modal__sub">
                    {detallePedido.cliente}
                    {detallePedido.fecha ? ` · ${new Date(detallePedido.fecha).toLocaleDateString("es-CO")}` : " · Reciente"}
                    {detallePedido.codigo_compra ? ` · ${detallePedido.codigo_compra}` : ""}
                  </p>
                </div>
                <button type="button" onClick={() => setDetallePedido(null)} aria-label="Cerrar detalle" className="ventas-modal__close">×</button>
              </div>
              <div className="ventas-modal__list">
                {(detallePedido.items || []).map((item, idx) => (
                  <div key={`${item.id_libro}-${idx}`} className="ventas-modal__item">
                    <div className="ventas-modal__item-thumb">
                      {resolveImageUrl(item.imagen) ? (
                        <img src={resolveImageUrl(item.imagen)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <IconBook width={18} height={18} strokeWidth={2} style={{ color: "var(--vinotinto)", opacity: 0.7 }} />
                      )}
                    </div>
                    <div className="ventas-modal__item-info">
                      <span className="ventas-modal__item-title">{item.titulo}</span>
                      <span className="ventas-modal__item-author">{item.autor_libro || "Autor no disponible"}</span>
                      <span className="ventas-modal__item-meta">
                        Cantidad: {item.cantidad} · Unitario: {formatPrecio(item.precio_libro)}
                      </span>
                    </div>
                    <span className="ventas-modal__item-total">
                      {formatPrecio(Number(item.total_linea ?? item.total ?? (item.precio_libro || 0) * Number(item.cantidad || 1)))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="ventas-modal__footer">
                <div className="ventas-modal__footer-sum">
                  {(() => {
                    const esRetiro = detallePedido.tipo_entrega === 'retiro_tienda';
                    const costoEnvio = Number(detallePedido.costo_envio ?? detallePedido.envio?.costo_envio ?? 0);
                    const pagoTienda = esRetiro
                      ? (detallePedido.total_orden ?? detallePedido.total_tienda)
                      : ((detallePedido.total_tienda ?? 0) + costoEnvio);
                    return (
                      <>
                        <div className="ventas-modal__footer-row">
                          <span>Total de la orden</span>
                          <span className="ventas-modal__footer-fila-total">
                            {formatPrecio(detallePedido.total_orden ?? detallePedido.total_tienda)}
                          </span>
                        </div>
                        {!esRetiro && costoEnvio > 0 && (
                          <div className="ventas-modal__footer-row">
                            <span>🚚 Envío</span>
                            <span>+ {formatPrecio(costoEnvio)}</span>
                          </div>
                        )}
                        <div className="ventas-modal__footer-row ventas-modal__footer-row--destacada">
                          <span>👛 {esRetiro ? 'Cobras en la tienda' : 'Pago a tu tienda'}</span>
                          <span>{formatPrecio(pagoTienda)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
        {fotoCliente && (
          <div className="modal-overlay open pedidos-foto-cerrar" onClick={() => setFotoCliente(null)}>
            <div className="pedidos-foto-card" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setFotoCliente(null)} aria-label="Cerrar foto de perfil" className="ventas-modal__close">×</button>
              <img className="pedidos-foto-card__img" src={fotoCliente.url} alt="Foto de perfil" />
              {fotoCliente.nombre && <span className="pedidos-foto-card__nombre">{fotoCliente.nombre}</span>}
              {fotoCliente.correo && <span className="pedidos-foto-card__correo">{fotoCliente.correo}</span>}
            </div>
          </div>
        )}
        {pedidoEnvio && (
          <div className="modal-overlay open" onClick={() => !guardandoEnvio && setPedidoEnvio(null)}>
            <div
              className="modal-box"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "500px",
                padding: "0",
                overflow: "hidden",
                background: darkMode ? '#171717' : '#ffffff',
                border: darkMode ? '1px solid #3a3a3a' : '1px solid #e5dfe3',
                boxShadow: darkMode ? '0 24px 60px rgba(0,0,0,0.48)' : '0 24px 60px rgba(0,0,0,0.12)'
              }}
            >
              <div className="envios-modal__header">
                <span className="envios-modal__icon">
                  <IconTruck width={22} height={22} strokeWidth={2} style={{ color: "white" }} />
                </span>
                <div>
                  <h3>{pedidoEnvio.envio ? "Editar" : "Registrar"} Guía de envío</h3>
                  <span>Orden #{pedidoEnvio.id_orden} · Compra {pedidoEnvio.codigo_compra} · {pedidoEnvio.cliente}</span>
                </div>
              </div>
              <div style={{ padding: "24px 26px", background: darkMode ? '#171717' : '#ffffff' }}>
                <p className="envios-modal__nota" style={{ background: darkMode ? '#201b1e' : '#f8f6f2', borderColor: darkMode ? '#3a3a3a' : '#ddd2c7', color: darkMode ? '#f3f4f6' : '#5b5650' }}>Elige la transportadora acordada e ingresa el número de Guía que ella te entregó. BookyHome no realiza ni controla el transporte.</p>
                <label style={{ display: "block", fontWeight: 700, color: darkMode ? "#ffbfd2" : "#4b2733", fontSize: "0.88rem" }}>Empresa de mensajería</label>
                <select
                  value={envioForm.id_empresa}
                  onChange={(e) => setEnvioForm({ ...envioForm, id_empresa: e.target.value })}
                  style={{
                    width: "100%",
                    marginTop: "6px",
                    padding: "11px 12px",
                    borderRadius: "8px",
                    border: darkMode ? "1.5px solid #3a3a3a" : "1.5px solid #d9cfd1",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    background: darkMode ? '#1f1f1f' : '#ffffff',
                    color: darkMode ? '#f3f4f6' : '#1f2937'
                  }}
                >
                  <option value="" style={{ background: darkMode ? '#1f1f1f' : '#ffffff', color: darkMode ? '#f3f4f6' : '#1f2937' }}>Selecciona una empresa</option>
                  {empresasMensajeria.map((empresa) => <option key={empresa.id_empresa} value={empresa.id_empresa} style={{ background: darkMode ? '#1f1f1f' : '#ffffff', color: darkMode ? '#f3f4f6' : '#1f2937' }}>{empresa.nombre_empresa}</option>)}
                </select>
                <label style={{ display: "block", fontWeight: 700, color: darkMode ? "#ffbfd2" : "#4b2733", fontSize: "0.88rem", marginTop: "16px" }}>Número de Guía</label>
                <input
                  value={envioForm.numero_guia}
                  onChange={(e) => setEnvioForm({ ...envioForm, numero_guia: e.target.value })}
                  maxLength={80}
                  placeholder="Ej. 123456789"
                  style={{
                    width: "100%",
                    marginTop: "6px",
                    padding: "11px 12px",
                    borderRadius: "8px",
                    border: darkMode ? "1.5px solid #3a3a3a" : "1.5px solid #d9cfd1",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    background: darkMode ? '#1f1f1f' : '#ffffff',
                    color: darkMode ? '#f3f4f6' : '#1f2937'
                  }}
                />
                {envioError && <p className="envios-modal__error">⚠ {envioError}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "22px" }}>
                  <button
                    onClick={() => setPedidoEnvio(null)}
                    disabled={guardandoEnvio}
                    style={{
                      fontFamily: "inherit",
                      padding: "9px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: darkMode ? '#1f1f1f' : '#ffffff',
                      color: darkMode ? '#f3f4f6' : '#1f2937',
                      border: darkMode ? '1.5px solid #3a3a3a' : '1.5px solid #d9cfd1'
                    }}
                  >
                    Cancelar
                  </button>
                  <button className="btn btn-vinotinto" onClick={guardarEnvio} disabled={guardandoEnvio} style={{ padding: "9px 18px", borderRadius: "8px" }}>{guardandoEnvio ? "Guardando..." : "Guardar Guía"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL CONFIRMAR ENTREGA EN TIENDA ── */}
        {modalConfirmarEntrega && (
          <div
            className="modal-overlay open"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 2500,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px"
            }}
            onClick={() => !actualizandoRetiro && setModalConfirmarEntrega(null)}
          >
            <div
              className="modal-box"
              style={{
                background: "#FFFFFF",
                maxWidth: "480px",
                width: "100%",
                borderRadius: "16px",
                padding: "28px 30px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
                border: "1px solid #E2E8F0"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {modalConfirmarEntrega.exito ? (
                <div style={{ textAlign: "center", padding: "20px 10px" }}>
                  <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    border: "3px solid #86EFAC"
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 800, color: "#166534" }}>
                    ¡Entrega Confirmada con Éxito!
                  </h3>
                  <p style={{ margin: 0, color: "#4B5563", fontSize: "0.88rem" }}>
                    La orden #{modalConfirmarEntrega.pedido.id_orden} ha sido finalizada y entregada al cliente.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: modalConfirmarEntrega.esEfectivo ? "#FEF3C7" : "#DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      flexShrink: 0
                    }}>
                      {modalConfirmarEntrega.esEfectivo ? "💵" : "📖"}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>
                        Confirmar Entrega de Libro
                      </h3>
                      <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748B" }}>
                        Orden #{modalConfirmarEntrega.pedido.id_orden} · Cliente: <strong>{modalConfirmarEntrega.pedido.cliente}</strong>
                      </p>
                    </div>
                  </div>

                  {/* PIN Check */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#0F172A",
                    color: "#FFFFFF",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    marginBottom: "16px"
                  }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      PIN de Retiro del Cliente:
                    </span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#FDE047", letterSpacing: "3px" }}>
                      {modalConfirmarEntrega.pedido.pin_retiro || "----"}
                    </span>
                  </div>

                  {/* Libros a entregar */}
                  <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "16px"
                  }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                      Ejemplares para entregar:
                    </div>
                    {modalConfirmarEntrega.pedido.items?.map((it, idx) => (
                      <div key={idx} style={{ fontSize: "0.86rem", color: "#1E293B", fontWeight: 600, display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span>📖 {it.titulo}</span>
                        <span style={{ color: "#7A1E3A" }}>x{it.cantidad}</span>
                      </div>
                    ))}
                  </div>

                  {/* Estado de pago explicativo */}
                  {!modalConfirmarEntrega.esEfectivo ? (
                    <div style={{
                      background: "#F0FDF4",
                      border: "1.5px solid #86EFAC",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "18px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 800, fontSize: "0.86rem", marginBottom: "3px" }}>
                        <span>✓</span> Pago Confirmado ({modalConfirmarEntrega.pedido.metodo_pago || "En línea"})
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#14532D", lineHeight: "1.4" }}>
                        El comprador ya realizó el pago exitosamente. Verifica que su PIN coincida y entrégale el libro físico.
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      background: "#FFFBEB",
                      border: "1.5px solid #FDE68A",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "18px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#92400E", fontWeight: 800, fontSize: "0.86rem", marginBottom: "3px" }}>
                        <span>💵</span> Cobro Pendiente en Caja
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#78350F", lineHeight: "1.4" }}>
                        Verifica recibir <strong>{Number(modalConfirmarEntrega.pedido.total_tienda || modalConfirmarEntrega.pedido.total_orden || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</strong> en efectivo en caja antes de entregar el libro.
                      </p>
                    </div>
                  )}

                  {modalConfirmarEntrega.error && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "8px 12px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "14px" }}>
                      {modalConfirmarEntrega.error}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setModalConfirmarEntrega(null)}
                      disabled={actualizandoRetiro === modalConfirmarEntrega.pedido.id_orden}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "8px",
                        border: "1.5px solid #CBD5E1",
                        background: "#FFFFFF",
                        color: "#475569",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer"
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={ejecutarConfirmarEntrega}
                      disabled={actualizandoRetiro === modalConfirmarEntrega.pedido.id_orden}
                      style={{
                        padding: "9px 18px",
                        borderRadius: "8px",
                        border: "none",
                        background: !modalConfirmarEntrega.esEfectivo ? "linear-gradient(135deg, #16A34A 0%, #15803D 100%)" : "linear-gradient(135deg, #7A1E3A 0%, #5E1629 100%)",
                        color: "#FFFFFF",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                      }}
                    >
                      {actualizandoRetiro === modalConfirmarEntrega.pedido.id_orden
                        ? "Confirmando..."
                        : !modalConfirmarEntrega.esEfectivo
                          ? "✅ Entregar Libro Físico"
                          : "💵 Cobrar y Entregar Libro"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL HABILITAR PAGO ── */}
        {modalHabilitarPago && (
          <div
            className="modal-overlay open"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 2500,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px"
            }}
            onClick={() => !actualizandoRetiro && setModalHabilitarPago(null)}
          >
            <div
              className="modal-box"
              style={{
                background: "#FFFFFF",
                maxWidth: "460px",
                width: "100%",
                borderRadius: "16px",
                padding: "26px 28px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
                border: "1px solid #E2E8F0"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {modalHabilitarPago.exito ? (
                <div style={{ textAlign: "center", padding: "16px 10px" }}>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#DCFCE7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    border: "2px solid #86EFAC"
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 800, color: "#166534" }}>
                    ¡Pago Habilitado!
                  </h3>
                  <p style={{ margin: 0, color: "#4B5563", fontSize: "0.85rem" }}>
                    El comprador ya puede proceder a pagar en línea o en caja para la orden #{modalHabilitarPago.pedido.id_orden}.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      🔔
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0F172A" }}>
                        Habilitar Cobro / Pago
                      </h3>
                      <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748B" }}>
                        Orden #{modalHabilitarPago.pedido.id_orden} · Cliente en tienda: <strong>{modalHabilitarPago.pedido.cliente}</strong>
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.86rem", color: "#334155", lineHeight: "1.5", margin: "0 0 16px" }}>
                    El cliente <strong>{modalHabilitarPago.pedido.cliente}</strong> ha notificado que ya llegó a la librería. ¿Deseas habilitar el cobro para que pueda realizar el pago presencial o en línea?
                  </p>

                  {modalHabilitarPago.error && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "8px 12px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "14px" }}>
                      {modalHabilitarPago.error}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setModalHabilitarPago(null)}
                      disabled={actualizandoRetiro === modalHabilitarPago.pedido.id_orden}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1.5px solid #CBD5E1",
                        background: "#FFFFFF",
                        color: "#475569",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer"
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={ejecutarHabilitarPago}
                      disabled={actualizandoRetiro === modalHabilitarPago.pedido.id_orden}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                        color: "#FFFFFF",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {actualizandoRetiro === modalHabilitarPago.pedido.id_orden ? "Habilitando..." : "🔔 Habilitar Pago"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderEnvios = () => {
    const texto = filtroEnvios.trim().toLowerCase();

    const rango = RANGOS_ENVIOS.find((r) => r.id === rangoEnvios) || RANGOS_ENVIOS[0];
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    if (rango.dias !== null) inicio.setDate(inicio.getDate() - rango.dias);

    const baseEnvios = pedidos.filter((pedido) => {
      if (pedido.tipo_entrega === "retiro_tienda") return false;
      const est = normalizarEstado(pedido.estado);
      if (["cancelada", "pendiente"].includes(est)) return false;
      if (rango.dias !== null && parseFechaPedido(pedido.fecha) < inicio) return false;
      return true;
    });

    const conteo = {
      todos: baseEnvios.length,
      transito: baseEnvios.filter((p) => ["camino", "procesando"].includes(infoEstadoEnvio(p).clase)).length,
      entregados: baseEnvios.filter((p) => infoEstadoEnvio(p).clase === "entregado").length,
      sin_guia: baseEnvios.filter((p) => infoEstadoEnvio(p).clase === "alerta").length,
    };

    const envios = baseEnvios.filter((pedido) => {
      const clase = infoEstadoEnvio(pedido).clase;
      const activo = FILTROS_ENVIOS.find((f) => f.id === filtroEstadoEnvios) || FILTROS_ENVIOS[0];
      if (activo.clases && !activo.clases.includes(clase)) return false;
      if (!texto) return true;
      return [pedido.codigo_compra, pedido.id_orden, pedido.cliente, pedido.correo_cliente, pedido.envio?.empresa_mensajeria, pedido.envio?.numero_guia]
        .some((valor) => String(valor || "").toLowerCase().includes(texto));
    });

    const totalEnviosFiltrados = envios.length;
    const totalPagesEnvios = Math.max(1, Math.ceil(totalEnviosFiltrados / enviosPerPage));
    const currentPageEnvios = Math.min(enviosPage, totalPagesEnvios);
    const paginatedEnvios = envios.slice((currentPageEnvios - 1) * enviosPerPage, currentPageEnvios * enviosPerPage);

    return (
      <>
        <div className="welcome-card">
          <h1 style={{ fontSize: "1.5rem", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="envios-title-icon">
              <IconTruck width={22} height={22} strokeWidth={2} style={{ color: "white" }} />
            </span>
            Envíos y seguimiento
          </h1>
          <p style={{ margin: "3px 0 0", color: darkMode ? "#b8b8b8" : "#666" }}>Registra las guías de tus pedidos pagados y sigue el rastreo oficial de cada transportadora.</p>
        </div>

        <div className="envios-stats">
          {FILTROS_ENVIOS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`envios-stat ${filtroEstadoEnvios === f.id ? "envios-stat--active" : ""} envios-stat--${f.id}`}
              onClick={() => { setFiltroEstadoEnvios(f.id); setEnviosPage(1); }}
            >
              <span className="envios-stat__label">{f.label}</span>
              <span className="envios-stat__count">{conteo[f.id]}</span>
            </button>
          ))}
        </div>

        <div className="seller-books envios-search-wrap">
          <div className="envios-tools">
            <div className="envios-search">
              <IconSearch width={17} height={17} strokeWidth={2.2} className="envios-search__icon" />
              <input
                value={filtroEnvios}
                onChange={(e) => { setFiltroEnvios(e.target.value); setEnviosPage(1); }}
                placeholder="Buscar por compra, pedido, guía, comprador o transportadora..."
              />
              {filtroEnvios && (
                <button type="button" className="envios-search__clear" onClick={() => { setFiltroEnvios(""); setEnviosPage(1); }} aria-label="Limpiar búsqueda">
                  <IconClose width={13} height={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
            <div className="envios-rango">
              <IconCalendar width={16} height={16} strokeWidth={2} className="envios-rango__icon" />
              <select
                value={rangoEnvios}
                onChange={(e) => { setRangoEnvios(e.target.value); setEnviosPage(1); }}
                aria-label="Filtrar por fecha"
              >
                {RANGOS_ENVIOS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loadingPedidos ? (
          <p style={{ color: darkMode ? "#c8c8c8" : "#777", padding: "30px 0", textAlign: "center" }}>Cargando envíos...</p>
        ) : envios.length === 0 ? (
          <div className="empty-state envios-empty">
            <div className="envios-empty__icon"><IconTruck width={34} height={34} strokeWidth={1.5} /></div>
            <p><strong>No hay envíos que coincidan</strong></p>
            <span>{texto ? "Prueba con otra búsqueda o cambia el filtro." : "Aún no tienes envíos en esta categoría."}</span>
          </div>
        ) : (
          <>
          <div className="envios-list">
            {paginatedEnvios.map((pedido) => {
              const info = infoEstadoEnvio(pedido);
              const sinGuia = !pedido.envio;
              const dir = pedido.direccion_entrega || {};
              const dirTexto = [dir.alias, dir.direccion, dir.ciudad, dir.departamento].filter(Boolean).join(" · ");
              return (
                <article key={`${pedido.id_comprador}-${pedido.id_orden}`} className={`envios-card envios-card--${info.clase}`}>
                  <div className="envios-card__head">
                    <div className="envios-card__ident">
                      <span className={`envios-card__type-icon envios-card__type-icon--${info.clase}`}>
                        {sinGuia ? <IconAlertTriangle width={16} height={16} strokeWidth={2} /> : <IconTruck width={16} height={16} strokeWidth={2} />}
                      </span>
                      <div>
                        <strong>Compra {pedido.codigo_compra}</strong>
                        <span>Pedido #{pedido.id_orden} · {pedido.cliente}</span>
                      </div>
                    </div>
                    <span className={`envios-badge envios-badge--${info.clase}`}>{info.texto}</span>
                  </div>

                  {!sinGuia ? (
                    <div className="envios-card__body">
                      <div className="envios-card__courier">
                        <span className="envios-card__courier-name">{pedido.envio.empresa_mensajeria || "Mensajería"}</span>
                      </div>
                      <div className="envios-card__guia">
                        <span className="envios-card__guia-label">No. guía</span>
                        <span className="envios-card__guia-value">{pedido.envio.numero_guia}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="envios-card__sin-guia">
                      <span>Este pedido ya está pago, registra la guía para iniciar el envío.</span>
                      <button type="button" className="btn btn-vinotinto envios-card__register" onClick={() => abrirRegistroEnvio(pedido)}>
                        + Registrar Guía
                      </button>
                    </div>
                  )}

                  <div className="envios-card__foot">
                    {dirTexto && (
                      <span className="envios-card__address"><IconMapPin width={13} height={13} strokeWidth={2} /> {dirTexto}</span>
                    )}
                    {!sinGuia ? (
                      (pedido.envio.url_rastreo || pedido.envio.sitio_web) ? (
                        <a href={pedido.envio.url_rastreo || pedido.envio.sitio_web} target="_blank" rel="noreferrer" className="envios-card__track">
                          <IconTruck width={19} height={19} strokeWidth={2} /> Rastrear envío con la transportadora
                        </a>
                      ) : (
                        <span className="envios-card__no-track">Rastreo no disponible</span>
                      )
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mis-libros-pagination-bar" style={{ marginTop: "16px" }}>
            <div className="pagination-info">
              Mostrando <strong>{(currentPageEnvios - 1) * enviosPerPage + 1} - {Math.min(currentPageEnvios * enviosPerPage, totalEnviosFiltrados)}</strong> de <strong>{totalEnviosFiltrados}</strong> envíos
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn-nav"
                disabled={currentPageEnvios <= 1}
                onClick={() => setEnviosPage((prev) => Math.max(1, prev - 1))}
              >
                ‹ Anterior
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPagesEnvios }, (_, idx) => idx + 1).map((pageNum) => {
                  if (
                    pageNum === 1 ||
                    pageNum === totalPagesEnvios ||
                    Math.abs(pageNum - currentPageEnvios) <= 1
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`pagination-num-btn ${pageNum === currentPageEnvios ? "active" : ""}`}
                        onClick={() => setEnviosPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === 2 && currentPageEnvios > 3) ||
                    (pageNum === totalPagesEnvios - 1 && currentPageEnvios < totalPagesEnvios - 2)
                  ) {
                    return <span key={pageNum} className="pagination-ellipsis">…</span>;
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                className="pagination-btn-nav"
                disabled={currentPageEnvios >= totalPagesEnvios}
                onClick={() => setEnviosPage((prev) => Math.min(totalPagesEnvios, prev + 1))}
              >
                Siguiente ›
              </button>
            </div>

            <div className="pagination-per-page">
              <label htmlFor="select-per-page-envios">Ver:</label>
              <select
                id="select-per-page-envios"
                value={enviosPerPage}
                onChange={(e) => {
                  setEnviosPerPage(Number(e.target.value));
                  setEnviosPage(1);
                }}
                className="select-per-page"
              >
                <option value={8}>8 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
                <option value={50}>50 por pág.</option>
              </select>
            </div>
          </div>
          </>
        )}
      </>
    );
  };

  const renderVentas = () => {
    const ventasAgrupadas = Object.values(ventas.reduce((ordenes, venta) => {
      const idOrden = venta.id_orden;
      if (!ordenes[idOrden]) {
        ordenes[idOrden] = { ...venta, items: [], totalOrden: 0 };
      }
      ordenes[idOrden].items.push(venta);
      ordenes[idOrden].totalOrden += Number(venta.total || 0);
      return ordenes;
    }, {})).sort((a, b) => {
      // Ordenar por fecha descendente (más reciente primero) y luego por ID ascendente
      return (new Date(b.fecha || 0) - new Date(a.fecha || 0)) || (Number(a.id_orden) - Number(b.id_orden));
    });
    ventasAgrupadas.forEach((venta) => {
      venta.cantidadOrden = venta.items.reduce((total, item) => total + Number(item.cantidad || 0), 0);
    });

    const ESTADO_VENTA_CFG = {
      pagado:           { label: "Pagado",    color: "#145c2e", bg: "#eafaf1", border: "#1e8a45" },
      enviado:          { label: "Enviado",   color: "#1a4f8a", bg: "#eaf3ff", border: "#2979c7" },
      entregada:        { label: "Entregado", color: "#7A1E3A", bg: "#f8e9ee", border: "#7A1E3A" },
      pendiente:        { label: "Pendiente", color: "#b95c00", bg: "#fef5e7", border: "#e67e22" },
    };
    const getEstCfg = (estado) => ESTADO_VENTA_CFG[String(estado || "").toLowerCase().trim()] || ESTADO_VENTA_CFG.pendiente;

    const formatearFecha = (f) => {
      if (!f) return { corta: "Reciente", detalle: "" };
      const d = new Date(f);
      if (isNaN(d.getTime())) return { corta: "Reciente", detalle: "" };
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffDias = Math.round((inicioHoy - inicioDia) / 86400000);
      const corta = diffDias === 0 ? "Hoy" : diffDias === 1 ? "Ayer" : d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
      const hora = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      return { corta, detalle: `${corta === "Hoy" || corta === "Ayer" ? d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : ""}${hora ? " · " + hora : ""}` };
    };

    const iniciales = (nombre) =>
      String(nombre || "V").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

    const totalIngresos  = ventasAgrupadas.reduce((s, v) => s + v.totalOrden, 0);
    const totalLibros    = ventasAgrupadas.reduce((s, v) => s + v.cantidadOrden, 0);
    const clientesUnicos = new Set(ventasAgrupadas.map((v) => v.cliente).filter(Boolean)).size;

    // paginación
    const totalPags     = Math.max(1, Math.ceil(ventasAgrupadas.length / ventasPorPagina));
    const paginaActual  = Math.min(paginaVentas, totalPags);
    const ventasPag     = ventasAgrupadas.slice((paginaActual - 1) * ventasPorPagina, paginaActual * ventasPorPagina);
    const irPag = (n) => setPaginaVentas(Math.min(Math.max(1, n), totalPags));

    const kpis = [
      { label: "Ingresos totales", value: formatPrecio(totalIngresos), icon: <IconDollar width={20} height={20} strokeWidth={2} style={{ color: darkMode ? "#ff8eac" : "#7A1E3A" }} />, bg: darkMode ? "rgba(255,79,131,0.12)" : "#fbe8ee" },
      { label: "Órdenes", value: ventasAgrupadas.length, icon: <IconShoppingBag width={20} height={20} strokeWidth={2} style={{ color: darkMode ? "#7ab8ff" : "#3b82f6" }} />, bg: darkMode ? "rgba(59,130,246,0.12)" : "#dbeafe" },
      { label: "Libros vendidos", value: totalLibros, icon: <IconBook width={20} height={20} strokeWidth={2} style={{ color: darkMode ? "#b99cff" : "#6d28d9" }} />, bg: darkMode ? "rgba(109,40,217,0.12)" : "#ede9fe" },
      { label: "Clientes", value: clientesUnicos, icon: <IconUser width={20} height={20} strokeWidth={2} style={{ color: darkMode ? "#6ee7b7" : "#10b981" }} />, bg: darkMode ? "rgba(16,185,129,0.12)" : "#d1fae5" },
    ];

    const panelBg = darkMode ? "#1f1f1f" : "#ffffff";
    const panelSoft = darkMode ? "#181818" : "#f8f6f4";
    const panelBorder = darkMode ? "#3a3a3a" : "#e5e7eb";
    const panelText = darkMode ? "#f3f4f6" : "#1f2937";
    const panelMuted = darkMode ? "#b8b8b8" : "#6b7280";

    return (
    <>
      {/* Header */}
      <div style={{
        background: panelBg, borderRadius: "16px",
        border: `1.5px solid ${panelBorder}`, boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.05)",
        padding: "24px 28px", marginBottom: "20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "16px", flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "50px", height: "50px", borderRadius: "14px",
            background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(122,30,58,0.25)", flexShrink: 0
          }}>
            <IconShoppingBag width={24} height={24} strokeWidth={2.2} style={{ color: "white" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 900, color: panelText }}>
              Registro de Ventas
            </h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: panelMuted, marginTop: "2px" }}>
              Historial de órdenes confirmadas · {ventasAgrupadas.length} orden{ventasAgrupadas.length !== 1 ? "es" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px", marginBottom: "20px"
      }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{
            background: panelBg, borderRadius: "14px",
            border: `1.5px solid ${panelBorder}`, boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.04)",
            padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px"
          }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0,
              background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: darkMode ? "#d1d5db" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: panelText, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{
        background: panelBg, borderRadius: "16px",
        border: `1.5px solid ${panelBorder}`, boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.22)" : "0 2px 8px rgba(0,0,0,0.05)",
        padding: "24px 28px"
      }}>
        {loadingVentas && (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>Cargando ventas…</div>
        )}
        {!loadingVentas && ventas.length === 0 && (
          <div style={{ border: `2px dashed ${panelBorder}`, borderRadius: "14px", padding: "56px 20px", textAlign: "center", background: darkMode ? "#171717" : "transparent" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: darkMode ? "rgba(255,79,131,0.12)" : "#fdf7f8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <IconChartBar width={30} height={30} strokeWidth={1.8} style={{ color: darkMode ? "#ff4f83" : "#C5425A" }} />
            </div>
            <h3 style={{ margin: "0 0 8px", color: panelText, fontSize: "1.05rem" }}>No hay ventas registradas aún</h3>
            <p style={{ margin: 0, color: panelMuted, fontSize: "0.88rem" }}>Aquí aparecerá el desglose por libro vendido</p>
          </div>
        )}
        {!loadingVentas && ventas.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "860px" }}>
              <thead>
                <tr style={{ background: panelSoft, borderBottom: `1.5px solid ${darkMode ? "#3a3a3a" : "#e0dbd4"}` }}>
                  {["Orden", "Fecha", "Libros", "Cant.", "Precio", "Total", "Cliente", "Estado"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 14px", fontWeight: 800, fontSize: "0.72rem",
                      textTransform: "uppercase", letterSpacing: "0.05em", color: panelMuted,
                      whiteSpace: "nowrap", textAlign: "center"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ventasPag.map((v) => {
                  const fec = formatearFecha(v.fecha);
                  const est = getEstCfg(v.estado);
                  const multi = v.items.length > 1;
                  const cliente = v.cliente || "Cliente";
                  return (
                    <tr
                      key={v.id_orden}
                      style={{ borderBottom: `1px solid ${darkMode ? "#2f2f2f" : "#f0ebe4"}`, transition: "background 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = darkMode ? "#242424" : "#fdf9fa"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Orden */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center",
                          background: "#fbe8ee", color: "#7A1E3A",
                          borderRadius: "8px", padding: "3px 10px",
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 800, fontSize: "0.84rem", letterSpacing: "0.5px"
                        }}>
                          #{v.id_orden}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: "14px", whiteSpace: "nowrap", textAlign: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: panelText }}>{fec.corta}</div>
                        <div style={{ fontSize: "0.72rem", color: darkMode ? "#b8b8b8" : "#9ca3af" }}>{fec.detalle}</div>
                      </td>

                      {/* Producto(s) */}
                      <td style={{ padding: "14px", minWidth: "200px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                          <div style={{
                            width: "40px", height: "52px", borderRadius: "8px", flexShrink: 0,
                            overflow: "hidden", background: "#fdf0f3", border: "1px solid #f0e4e8",
                            display: "grid", placeItems: "center"
                          }}>
                            {resolveImageUrl(v.imagen) ? (
                              <img src={resolveImageUrl(v.imagen)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : <IconBook width={17} height={17} strokeWidth={2} style={{ color: "#C5425A" }} />}
                          </div>
                          <div style={{ width: "190px", textAlign: "center" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.86rem", color: panelText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "190px" }}>
                              {multi ? "Varios libros" : (v.titulo || "Libro")}
                            </div>
                            {multi ? (
                              <button
                                type="button"
                                onClick={() => setDetalleVenta(v)}
                                style={{
                                  marginTop: "5px", display: "inline-flex", alignItems: "center", gap: "4px",
                                  border: `1px solid ${darkMode ? "rgba(255,79,131,0.35)" : "#e8d5dc"}`, borderRadius: "999px",
                                  padding: "3px 9px", background: darkMode ? "rgba(255,79,131,0.08)" : "#fdf7f8", color: darkMode ? "#ff8eac" : "#7A1E3A",
                                  fontWeight: 700, fontSize: "0.7rem", cursor: "pointer", fontFamily: "inherit"
                                }}
                              >
                                <IconEye width={11} height={11} strokeWidth={2.2} /> Ver detalle
                              </button>
                            ) : (
                              <div style={{ fontSize: "0.72rem", color: darkMode ? "#b8b8b8" : "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "190px" }}>
                                {v.autor_libro || ""}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cantidad */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          minWidth: "34px", background: darkMode ? "#2a2a2a" : "#f3f4f6", color: darkMode ? "#f3f4f6" : "#374151",
                          borderRadius: "9px", padding: "4px 10px", fontWeight: 800, fontSize: "0.82rem"
                        }}>
                          {v.cantidadOrden}
                        </span>
                      </td>

                      {/* Precio unitario */}
                      <td style={{ padding: "14px", fontSize: "0.82rem", color: panelMuted, whiteSpace: "nowrap", textAlign: "center" }}>
                        {multi ? "Varios" : formatPrecio(v.precio_libro)}
                      </td>

                      {/* Total */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{
                          width: "120px", margin: "0 auto", textAlign: "right",
                          fontSize: "1.02rem", fontWeight: 900, color: darkMode ? "#ff4f83" : "#7A1E3A",
                          fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap"
                        }}>
                          {formatPrecio(v.totalOrden)}
                        </div>
                      </td>

                      {/* Comprador */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "9px" }}>
                          <div style={{
                            width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                            overflow: "hidden", background: "linear-gradient(135deg, #C5425A, #7A1E3A)",
                            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.72rem", fontWeight: 800
                          }}>
                            {resolveImageUrl(v.foto_perfil_cliente) ? (
                              <img src={resolveImageUrl(v.foto_perfil_cliente)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : iniciales(cliente)}
                          </div>
                          <div style={{ minWidth: 0, textAlign: "center" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.84rem", color: panelText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px" }}>
                              {cliente}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: darkMode ? "#b8b8b8" : "#9ca3af", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {v.correo_cliente || ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          background: est.bg, color: est.color, border: `1px solid ${est.border}`,
                          borderRadius: "20px", padding: "4px 11px", fontSize: "0.72rem",
                          fontWeight: 800, whiteSpace: "nowrap",
                          minWidth: "130px", textAlign: "center"
                        }}>
                          {est.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* ── Paginación ── */}
        {!loadingVentas && totalPags > 1 && (
          <div className="mis-libros-pagination-bar" style={{ marginTop: "16px" }}>
            <div className="pagination-info">
              Mostrando <strong>{(paginaActual - 1) * ventasPorPagina + 1} - {Math.min(paginaActual * ventasPorPagina, ventasAgrupadas.length)}</strong> de <strong>{ventasAgrupadas.length}</strong> órdenes
            </div>

            <div className="pagination-controls">
              <button type="button" className="pagination-btn-nav" disabled={paginaActual <= 1} onClick={() => irPag(paginaActual - 1)}>
                ‹ Anterior
              </button>
              <div className="pagination-numbers">
                {Array.from({ length: totalPags }, (_, idx) => idx + 1).map((pageNum) => {
                  if (pageNum === 1 || pageNum === totalPags || Math.abs(pageNum - paginaActual) <= 1) {
                    return (
                      <button key={pageNum} type="button" className={`pagination-num-btn ${pageNum === paginaActual ? 'active' : ''}`} onClick={() => irPag(pageNum)}>
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === 2 && paginaActual > 3) ||
                    (pageNum === totalPags - 1 && paginaActual < totalPags - 2)
                  ) {
                    return <span key={pageNum} className="pagination-ellipsis">…</span>;
                  }
                  return null;
                })}
              </div>
              <button type="button" className="pagination-btn-nav" disabled={paginaActual >= totalPags} onClick={() => irPag(paginaActual + 1)}>
                Siguiente ›
              </button>
            </div>

            <div className="pagination-per-page">
              <label htmlFor="select-per-page-ventas">Ver:</label>
              <select id="select-per-page-ventas" value={ventasPorPagina} onChange={(e) => { setVentasPorPagina(Number(e.target.value)); setPaginaVentas(1); }} className="select-per-page">
                <option value={5}>5 por pág.</option>
                <option value={8}>8 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modal detalle de orden */}
      {detalleVenta && (
        <div
          onClick={() => setDetalleVenta(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)", padding: "20px"
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "white", borderRadius: "16px",
              width: "min(600px, 100%)", maxHeight: "90vh",
              overflow: "hidden", boxShadow: "0 24px 70px rgba(36,20,27,0.3)",
              display: "flex", flexDirection: "column"
            }}
          >
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
              padding: "20px 24px", display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: "12px", flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "11px",
                  background: "rgba(255,255,255,0.2)", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <IconShoppingBag width={21} height={21} strokeWidth={2.2} style={{ color: "white" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, color: "white", fontSize: "1.05rem", fontWeight: 800 }}>
                    Detalle de la orden #{detalleVenta.id_orden}
                  </h2>
                  <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {detalleVenta.cliente}{detalleVenta.fecha ? ` · ${new Date(detalleVenta.fecha).toLocaleDateString("es-CO")}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetalleVenta(null)}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                  background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
                  color: "white", cursor: "pointer", fontSize: "1.1rem",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                ×
              </button>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gap: "10px", marginBottom: "18px" }}>
                {detalleVenta.items.map((item, index) => (
                  <div
                    key={`${item.id_libro}-${index}`}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px", borderRadius: "12px",
                      border: `1.5px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}`, background: darkMode ? "#181818" : "#fafafa"
                    }}
                  >
                    <div style={{
                      width: "44px", height: "56px", borderRadius: "8px", flexShrink: 0,
                      overflow: "hidden", background: "#fdf0f3", border: "1px solid #f0e4e8",
                      display: "grid", placeItems: "center"
                    }}>
                      {resolveImageUrl(item.imagen) ? (
                        <img src={resolveImageUrl(item.imagen)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : <IconBook width={18} height={18} style={{ color: "#C5425A" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem", color: panelText }}>{item.titulo}</div>
                      <div style={{ fontSize: "0.76rem", color: panelMuted, marginTop: "3px" }}>
                        Cantidad: {item.cantidad} · Unitario: {formatPrecio(item.precio_libro)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: darkMode ? "#ff8eac" : "#7A1E3A", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {formatPrecio(item.total)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div style={{
                background: darkMode ? "rgba(255,79,131,0.08)" : "#fdf7f8", borderRadius: "12px",
                border: `1px solid ${darkMode ? "rgba(255,79,131,0.25)" : "#f0e4e8"}`, padding: "16px 18px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: panelMuted, marginBottom: "8px" }}>
                  <span>Total de la orden</span>
                  <span style={{ color: panelText, fontWeight: 700 }}>{formatPrecio(detalleVenta.totalOrden)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: panelMuted }}>
                  <span>Comprador</span>
                  <span style={{ color: panelText, fontWeight: 700 }}>{detalleVenta.cliente}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    );
  };

  const renderNotificaciones = () => {
    // ── Filtrado ────────────────────────────────────────────────────────────
    const notifFiltradas = (() => {
      if (notificacionesFilter === "no_leidas") return notificaciones.filter((n) => !n.leida);
      const tipos = FILTROS_VENDEDOR[notificacionesFilter];
      if (!tipos) return notificaciones;
      return notificaciones.filter((n) => tipos.includes(n.tipo));
    })();

    // ── Paginación derivada ─────────────────────────────────────────────────
    const totalNotif   = notifFiltradas.length;
    const totalPaginas = Math.max(1, Math.ceil(totalNotif / notifPorPagina));
    const paginaSegura = Math.min(notifPaginaActual, totalPaginas);
    const notifPag     = notifFiltradas.slice(
      (paginaSegura - 1) * notifPorPagina,
      paginaSegura * notifPorPagina
    );

    const noLeidas = notificaciones.filter((n) => !n.leida).length;

    // ── Opciones de eliminación masiva ──────────────────────────────────────
    const OPCIONES_ELIMINAR_V = [
      { value: "leidas",  label: "Solo las leídas" },
      { value: "hoy",     label: "De hoy" },
      { value: "semana",  label: "De los últimos 7 días" },
      { value: "mes",     label: "Del último mes" },
      { value: "todas",   label: "Todas las notificaciones" },
    ];

    const handleEliminarVarias = async () => {
      setNotifEliminando(true);
      try {
        await notificacionesService.eliminarVarias(notifDeleteFilter);
        await cargarNotificaciones(true);
      } catch (err) {
        console.error("Error eliminando notificaciones:", err);
      } finally {
        setNotifEliminando(false);
        setShowNotifDeleteModal(false);
        setNotifPaginaActual(1);
      }
    };

    return (
      <div className="notificaciones-container notificaciones-container--embedded">
        <div className="notificaciones-wrapper">

          {/* ── HEADER ── */}
          <div className="notif-header notif-header--embedded" style={{ flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ margin: 0 }}>Notificaciones</h1>
              {noLeidas > 0 && (
                <span style={{
                  background: "#7A1E3A", color: "#fff",
                  fontSize: "0.72rem", fontWeight: 800,
                  padding: "2px 10px", borderRadius: 20
                }}>
                  {noLeidas} sin leer
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {noLeidas > 0 && (
                <button className="btn-marcar-todas" onClick={handleMarcarTodasLeidas}>
                  Marcar todas como leídas
                </button>
              )}
              <button
                onClick={() => { setNotifDeleteFilter("leidas"); setShowNotifDeleteModal(true); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8,
                  background: "#FEF2F2", border: "1.5px solid #FECACA",
                  color: "#DC2626", fontSize: "0.82rem", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.18s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#DC2626"; }}
              >
                🗑️ Eliminar mensajes
              </button>
            </div>
          </div>

          {/* ── FILTROS DE CATEGORÍA ── */}
          <div className="notif-filtros">
            {[
              { key: "todas",         label: "Todas",           tipos: null },
              { key: "no_leidas",     label: "No leídas",       soloNoLeidas: true },
              { key: "ventas_envios", label: "Ventas y envíos", tipos: ["orden", "pedido", "entrega", "pago"] },
              { key: "reclamos",      label: "Reclamos",        tipos: ["sistema"] },
              { key: "resenas",       label: "Reseñas",         tipos: ["resena"] },
              { key: "mensajes",      label: "Mensajes",        tipos: ["mensaje"] },
            ].map(({ key, label, tipos, soloNoLeidas }) => {
              const count = soloNoLeidas
                ? notificaciones.filter((n) => !n.leida).length
                : tipos
                  ? notificaciones.filter((n) => tipos.includes(n.tipo)).length
                  : notificaciones.length;
              return (
                <button key={key}
                  className={`filtro ${notificacionesFilter === key ? "active" : ""}`}
                  onClick={() => { setNotificacionesFilter(key); setNotifPaginaActual(1); }}>
                  {label}
                  {count > 0 && <span className="filtro-badge">{count > 99 ? "99+" : count}</span>}
                </button>
              );
            })}
          </div>

          {/* ── LISTA ── */}
          <div className="notif-lista">
            {notificacionesLoading ? (
              <div className="loading">Cargando...</div>
            ) : notifPag.length === 0 ? (
              <div className="notif-empty">
                <p>{notificacionesFilter === "no_leidas" ? "No tienes notificaciones sin leer" : "No tienes notificaciones en esta categoría"}</p>
              </div>
            ) : (
              notifPag.map((notif) => (
                <div key={notif.id_notificacion}
                  className={`notif-item ${notif.leida ? "" : "no-leida"}`}
                  onClick={() => handleClickNotificacion(notif)}>
                  <div className="notif-icono"><span>{getIconoTipo(notif.tipo)}</span></div>
                  <div className="notif-contenido">
                    <h3>{notif.titulo}</h3>
                    <p>{notif.descripcion || notif.cuerpo}</p>
                    <small>
                      {notif.fecha_creacion
                        ? new Date(notif.fecha_creacion).toLocaleString("es-CO", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "Ahora"}
                    </small>
                  </div>
                  <div className="notif-acciones">
                    {!notif.leida && (
                      <button className="btn-marcar"
                        onClick={(e) => { e.stopPropagation(); handleMarcarLeida(notif.id_notificacion); }}>
                        ✓
                      </button>
                    )}
                    <button className="btn-eliminar"
                      onClick={(e) => { e.stopPropagation(); handleEliminar(notif.id_notificacion); }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── PAGINACIÓN ── */}
          {totalNotif > notifPorPagina && (
            <div className="mis-libros-pagination-bar">
              <div className="pagination-info">
                Mostrando <strong>{(paginaSegura - 1) * notifPorPagina + 1}–{Math.min(paginaSegura * notifPorPagina, totalNotif)}</strong> de <strong>{totalNotif}</strong> {totalNotif === 1 ? "notificación" : "notificaciones"}
                {totalNotif !== notificaciones.length && (
                  <span className="pagination-total-note"> (filtradas de {notificaciones.length} totales)</span>
                )}
              </div>

              <div className="pagination-controls">
                <button type="button" className="pagination-btn-nav"
                  disabled={paginaSegura <= 1}
                  onClick={() => setNotifPaginaActual((p) => Math.max(1, p - 1))}>
                  ‹ Anterior
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
                    if (num === 1 || num === totalPaginas || Math.abs(num - paginaSegura) <= 1) {
                      return (
                        <button key={num} type="button"
                          className={`pagination-num-btn ${num === paginaSegura ? "active" : ""}`}
                          onClick={() => setNotifPaginaActual(num)}>
                          {num}
                        </button>
                      );
                    } else if (
                      (num === 2 && paginaSegura > 3) ||
                      (num === totalPaginas - 1 && paginaSegura < totalPaginas - 2)
                    ) {
                      return <span key={num} className="pagination-ellipsis">…</span>;
                    }
                    return null;
                  })}
                </div>

                <button type="button" className="pagination-btn-nav"
                  disabled={paginaSegura >= totalPaginas}
                  onClick={() => setNotifPaginaActual((p) => Math.min(totalPaginas, p + 1))}>
                  Siguiente ›
                </button>
              </div>

              <div className="pagination-per-page">
                <label htmlFor="vnotif-per-page">Ver:</label>
                <select id="vnotif-per-page" className="select-per-page"
                  value={notifPorPagina}
                  onChange={(e) => { setNotifPorPagina(Number(e.target.value)); setNotifPaginaActual(1); }}>
                  <option value={5}>5 por pág.</option>
                  <option value={10}>10 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* ── MODAL ELIMINAR MENSAJES ── */}
        {showNotifDeleteModal && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 2000,
              background: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowNotifDeleteModal(false); }}
          >
            <div style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420,
              padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}>
              <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem", fontWeight: 800, color: "#1F2937" }}>
                🗑️ Eliminar notificaciones
              </h2>
              <p style={{ margin: "0 0 20px", fontSize: "0.86rem", color: "#6B7280" }}>
                Selecciona qué notificaciones quieres eliminar. Esta acción no se puede deshacer.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {OPCIONES_ELIMINAR_V.map((op) => (
                  <label key={op.value} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${notifDeleteFilter === op.value ? "#7A1E3A" : "#E5E7EB"}`,
                    background: notifDeleteFilter === op.value ? "#FDF2F4" : "#FAFAF9",
                    transition: "all 0.15s"
                  }}>
                    <input type="radio" name="notifDeleteFilter" value={op.value}
                      checked={notifDeleteFilter === op.value}
                      onChange={() => setNotifDeleteFilter(op.value)}
                      style={{ accentColor: "#7A1E3A" }}
                    />
                    <span style={{
                      fontSize: "0.88rem", fontWeight: 600,
                      color: notifDeleteFilter === op.value ? "#7A1E3A" : "#374151"
                    }}>
                      {op.label}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setShowNotifDeleteModal(false)}
                  style={{
                    padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E5E7EB",
                    background: "#F9FAFB", color: "#374151", fontWeight: 700,
                    fontSize: "0.85rem", cursor: "pointer"
                  }}>
                  Cancelar
                </button>
                <button onClick={handleEliminarVarias} disabled={notifEliminando}
                  style={{
                    padding: "9px 18px", borderRadius: 8, border: "none",
                    background: notifEliminando ? "#e5e7eb" : "#DC2626",
                    color: notifEliminando ? "#9ca3af" : "#fff",
                    fontWeight: 700, fontSize: "0.85rem",
                    cursor: notifEliminando ? "not-allowed" : "pointer",
                  }}>
                  {notifEliminando ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCalificaciones = () => {
    return (
      <>
        <style>{`
          .metric-card {
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.12);
          }
          .metric-icon {
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .metric-card:hover .metric-icon {
            transform: scale(1.1) rotate(5deg);
          }
        `}</style>
        <SeccionCalificacionesVendedor tiendaId={tiendaInfo?.id_tienda} darkMode={darkMode} />
      </>
    );
  };

  const renderContenido = () => {
    switch (activeSide) {
      case "Inicio":        return renderInicio();
      case "Mensajes":      return <Chat embedded={true} selectedSalaProp={selectedSalaInChat} onSelectSala={(id) => setSelectedSalaInChat(id)} />;
      case "Notificaciones":return renderNotificaciones();
      case "Mis Libros":    return renderMisLibros();
      case "Ventas":        return renderVentas();
      case "Pedidos":       return renderPedidos();
      case "Calificaciones": return renderCalificaciones();
      case "Quejas y reclamos": return <QuejasVendedor />;
      case "Soporte técnico": return <Soporte />;
      case "Envíos":        return renderEnvios();
      case "Clientes":      return renderProximamente("Clientes");
      case "Configuración": return renderConfiguracion();
      case "Perfil":        return renderPerfil();
      case "Métodos de cobro": return RenderCuentasBancarias();
      case "Promociones":   return <SeccionOfertas />;
      case "Cupones":       return <SeccionCuponesVendedor tiendaId={tiendaInfo?.id_tienda} darkMode={darkMode} />;
      case "Suscripciones": return <SeccionSuscripciones tiendaId={tiendaInfo?.id_tienda} onNavegar={cambiarSeccion} darkMode={darkMode} />;
      case "Impulsos":      return <SeccionImpulsos tiendaId={tiendaInfo?.id_tienda} onNavegar={cambiarSeccion} darkMode={darkMode} />;
      default:              return renderInicio();
    }
  };

  return (
    <div className="dashboard-container seller-dashboard">
      <SellerSidebar
        userName={userName}
        userPhotoUrl={userPhotoUrl}
        bannerUrl={bannerUrl}
        activeSide={activeSide}
        setActiveSide={cambiarSeccion}
        handleLogout={handleLogout}
      />

      <main className={`dashboard-main ${activeSide === 'Mensajes' ? 'dashboard-main--chat' : ''}`}>
        {activeSide === 'Mensajes' ? (
          <div style={{ height: '100%', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Chat embedded={true} selectedSalaProp={selectedSalaInChat} onSelectSala={(id) => setSelectedSalaInChat(id)} />
          </div>
        ) : (
          <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>{renderContenido()}</div>
        )}
      </main>

      {modalEditar && (
        <ModalEditarLibro
          libro={modalEditar}
          categorias={categorias}
          onClose={() => setModalEditar(null)}
          onGuardado={() => { setModalEditar(null); cargarLibros(); cargarAlertas(); }}
        />
      )}
      {modalEliminar && (
        <ModalEliminar
          libro={modalEliminar}
          onClose={() => setModalEliminar(null)}
          onEliminado={() => { setModalEliminar(null); cargarLibros(); cargarAlertas(); }}
        />
      )}
      {modalStock && (
        <ModalStock
          libro={modalStock}
          onClose={() => setModalStock(null)}
          onActualizado={() => { setModalStock(null); cargarLibros(); cargarAlertas(); }}
        />
      )}
      {modalVentaFisica && (
        <ModalVentaFisica
          libro={modalVentaFisica}
          libros={libros}
          onClose={() => setModalVentaFisica(null)}
          onVendido={() => { setModalVentaFisica(null); cargarLibros(); cargarAlertas(); }}
        />
      )}
      {modalCodigo && (
        <ModalCodigoLibro
          libro={modalCodigo}
          onClose={() => setModalCodigo(null)}
        />
      )}
      {modalRetiro && (
        <ModalRetiroTienda
          libro={modalRetiro}
          onClose={() => setModalRetiro(null)}
          onConfirmado={() => { setModalRetiro(null); cargarLibros(); cargarAlertas(); }}
        />
      )}
    </div>
  );
}
