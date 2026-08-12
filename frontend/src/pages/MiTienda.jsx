// src/pages/MiTienda.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api, { getApiBaseUrl } from "../services/api";
import { notificacionesService } from "../services/notificaciones";
import SeccionOfertas from "../components/SeccionOfertas";
import SeccionCuponesVendedor from "../components/SeccionCuponesVendedor";
import SeccionSuscripciones from "../components/SeccionSuscripciones";
import SeccionImpulsos from "../components/SeccionImpulsos";
import SellerSidebar from "../components/VendedorSidebar";
import Chat from './Chat';
import QuejasVendedor from './QuejasVendedor';
import Soporte from './Soporte';
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
  IconCalendar
} from "../components/Icons";
import "../styles/Notificaciones.css";


// ========================
// Utilidades y constantes
// ========================
const formatPrecio = (valor) => {
  if (!valor && valor !== 0) return "$0 COP";
  return "$" + String(Math.floor(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " COP";
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
  { value: "usado_buen_estado", label: "Usado â€” buen estado" },
  { value: "usado_regular",     label: "Usado â€” estado regular" },
];

const BadgeEstado = ({ estado }) => {
  const map = {
    nuevo:             { label: "Nuevo",        color: "#d1fae5", text: "#065f46" },
    usado_buen_estado: { label: "Buen estado",  color: "#dbeafe", text: "#1e40af" },
    usado_regular:     { label: "Est. regular", color: "#fef3c7", text: "#92400e" },
  };
  const s = map[estado] || { label: estado, color: "#f3f4f6", text: "#374151" };
  return (
    <span style={{ background: s.color, color: s.text, padding: "3px 10px",
      borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

// ========================
// Componentes auxiliares
// ========================
function AlertaStock({ alertas, umbral }) {
  if (!alertas || alertas.length === 0) return null;
  return (
    <div style={{
      background: "#fefce8", border: "1.5px solid #fde68a", borderRadius: "10px",
      padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "12px",
    }}>
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: '2px' }}><IconLock width={20} height={20} strokeWidth={2} style={{ color: '#92400e' }} /></span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "0.92rem", color: "#92400e" }}>
          {alertas.length === 1 ? "1 libro con stock bajo" : `${alertas.length} libros con stock bajo`}
        </p>
        <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#854d0e" }}>
          Alerta configurada para {umbral} unidad{Number(umbral) === 1 ? "" : "es"} o menos.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {alertas.map((libro, i) => (
            <span key={i} style={{
              background: libro.stock === 0 ? "#fef2f2" : "#fef9c3",
              color: libro.stock === 0 ? "#b91c1c" : "#854d0e",
              border: `1px solid ${libro.stock === 0 ? "#fca5a5" : "#fde047"}`,
              borderRadius: "20px", padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700,
            }}>
              {libro.titulo} â€” {libro.stock === 0 ? "Sin stock" : `${libro.stock} uds`}
            </span>
          ))}
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
    if (!form.titulo.trim())            return setError("El tÃ­tulo es obligatorio");
    if (!form.autor_libro.trim())       return setError("El autor es obligatorio");
    if (!form.id_categoria)             return setError("Selecciona una categorÃ­a");
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
          <button className="modal-close" onClick={onClose}>Ã—</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-grid">
            <div className="form-group">
              <label>TÃ­tulo *</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} maxLength={100} />
            </div>
            <div className="form-group">
              <label>Autor *</label>
              <input name="autor_libro" value={form.autor_libro} onChange={handleChange} maxLength={50} />
            </div>
            <div className="form-group">
              <label>CategorÃ­a *</label>
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
            <label>DescripciÃ³n *
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
              {cargando ? "Guardandoâ€¦" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalEliminar({ libro, onClose, onEliminado }) {
  // ========================
  // Estado del modal de eliminaciÃ³n
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
          <button className="modal-close" onClick={onClose}>Ã—</button>
        </div>
        <div style={{ padding: "8px 0 20px" }}>
          <p style={{ color: "#444", marginBottom: "6px" }}>
            Â¿EstÃ¡s seguro de que quieres eliminar <strong>"{libro.titulo}"</strong>?
          </p>
          <p style={{ fontSize: "0.85rem", color: "#888" }}>Esta acciÃ³n no se puede deshacer.</p>
        </div>
        {error && <div className="form-error" style={{ marginBottom: "16px", display: 'flex', alignItems: 'center', gap: '4px' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /> {error}</div>}
        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose} disabled={cargando}>Cancelar</button>
          <button className="btn-eliminar" onClick={confirmar} disabled={cargando}>
            {cargando ? "Eliminandoâ€¦" : "SÃ­, eliminar"}
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
          <button className="modal-close" onClick={onClose}>Ã—</button>
        </div>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "20px" }}>
          <strong>{libro.titulo}</strong>
        </p>
        <div className="stock-control">
          <button className="stock-btn" onClick={() => setStock(Math.max(0, stock - 1))}>âˆ’</button>
          <input type="number" min="0" value={stock}
            onChange={(e) => setStock(Number(e.target.value))} className="stock-input" />
          <button className="stock-btn" onClick={() => setStock(stock + 1)}>+</button>
        </div>
        {error && <div className="form-error" style={{ margin: "12px 0", display: 'flex', alignItems: 'center', gap: '4px' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /> {error}</div>}
        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button className="btn-outline" onClick={onClose} disabled={cargando}>Cancelar</button>
          <button className="btn btn-vinotinto" onClick={guardar} disabled={cargando}>
            {cargando ? "Guardandoâ€¦" : "Guardar stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= SECCIÃ“N CALIFICACIONES VENDEDOR ================= */
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

// Color del badge segÃºn calificaciÃ³n
const calColor = (n) => {
  if (n >= 4.5) return { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' };
  if (n >= 3.5) return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
  return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
};

// Iniciales del usuario para el avatar
const initials = (name = '') => name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

// Paleta de colores para avatares
const AVATAR_COLORS = ['#7A1E3A','#1e4d8a','#1e7a45','#7a5c00','#5a1e7a','#1e6a7a'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] || '#7A1E3A';

function SeccionCalificacionesVendedor({ tiendaId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tiendaId) return;
    setLoading(true);
    api.get(`/perfil/calificaciones-tienda/${tiendaId}`)
      .then(r => setData(r.data))
      .catch(e => console.error('Error calificaciones:', e))
      .finally(() => setLoading(false));
  }, [tiendaId]);

  const total    = data?.total     ?? 0;
  const promedio = data?.promedio  ?? 0;
  const dist     = data?.distribucion ?? {};
  const lista    = data?.calificaciones ?? [];

  const barColor = (s) => s >= 4 ? '#22c55e' : s === 3 ? '#f59e0b' : '#ef4444';
  const topBorder = (s) => s >= 4 ? '#22c55e' : s === 3 ? '#f59e0b' : '#ef4444';
  const promedioColor = promedio >= 4.5 ? '#065f46' : promedio >= 3.5 ? '#854d0e' : '#991b1b';
  const promedioBg    = promedio >= 4.5 ? '#d1fae5' : promedio >= 3.5 ? '#fef9c3' : '#fee2e2';
  const promedioBorder= promedio >= 4.5 ? '#6ee7b7' : promedio >= 3.5 ? '#fde047' : '#fca5a5';

  const estesMes = lista.filter(c => {
    const d = new Date(c.fecha_calificacion), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <>
      {/* Header igual al de todas las secciones */}
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconStar width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Calificaciones de tu tienda
        </h1>
        <p style={{ margin: 0 }}>Lo que tus clientes opinan sobre tu servicio</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #f0e8ea', borderTopColor: '#7A1E3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Cargando calificaciones...</span>
        </div>
      ) : total === 0 ? (
        /* â”€â”€ Estado vacÃ­o â”€â”€ */
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '70px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>â­</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#333', fontWeight: '700', fontSize: '1.2rem' }}>AÃºn no tienes calificaciones</h3>
            <p style={{ margin: '0 auto', color: '#999', fontSize: '0.95rem', maxWidth: '340px' }}>
              Cuando un cliente reciba su pedido y te evalÃºe, sus opiniones aparecerÃ¡n aquÃ­.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* â”€â”€ Fila superior: promedio destacado + 3 mÃ©tricas â”€â”€ */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', alignItems: 'stretch' }}>

            {/* Promedio grande */}
            <div style={{
              background: promedioBg,
              border: `2px solid ${promedioBorder}`,
              borderRadius: '16px',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.07)'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: promedioColor, opacity: 0.75 }}>
                Promedio general
              </span>
              <div style={{ fontSize: '4rem', fontWeight: '900', color: promedioColor, lineHeight: 1 }}>
                {promedio.toFixed(1)}
              </div>
              <Stars value={Math.round(promedio)} size={20} />
              <span style={{ fontSize: '0.85rem', color: promedioColor, opacity: 0.7, marginTop: '4px' }}>
                sobre {total} {total === 1 ? 'opiniÃ³n' : 'opiniones'}
              </span>
            </div>

            {/* 3 mÃ©tricas en columna */}
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
                  icon: <IconStar width={32} height={32} strokeWidth={1.5} style={{ color: '#065f46' }} />, 
                  bg: '#d1fae5', 
                  color: '#065f46', 
                  border: '#6ee7b7' 
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
                <div key={m.label} className="metric-card" style={{
                  background: m.bg,
                  border: `1px solid ${m.border}`,
                  borderRadius: '14px',
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div className="metric-icon">
                    {m.icon}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: m.color, lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: '0.78rem', color: m.color, opacity: 0.8, fontWeight: '600' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* â”€â”€ Fila inferior: distribuciÃ³n + lista â”€â”€ */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', alignItems: 'start' }}>

            {/* DistribuciÃ³n */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '0.85rem', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                DistribuciÃ³n
              </h3>
              {[5,4,3,2,1].map(stars => {
                const count = dist[stars] ?? 0;
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ minWidth: '10px', fontSize: '0.85rem', fontWeight: '700', color: '#555' }}>{stars}</span>
                    <StarIcon filled size={13} />
                    <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ background: barColor(stars), height: '100%', width: `${pct}%`, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ minWidth: '52px', fontSize: '0.8rem', color: '#888', textAlign: 'right' }}>
                      {count} <span style={{ color: '#ccc' }}>({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Lista de opiniones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Ãšltimas opiniones
                </h3>
                {lista.length > 10 && (
                  <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                    Mostrando 10 de {lista.length}
                  </span>
                )}
              </div>
              {lista.slice(0, 10).map(cal => (
                <div key={cal.id_calificacion} style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
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
                        <strong style={{ color: '#222', fontSize: '0.9rem' }}>{cal.nombre_usuario}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#bbb', flexShrink: 0, marginLeft: '8px' }}>
                          {new Date(cal.fecha_calificacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <Stars value={cal.calificacion} size={13} />
                    </div>
                  </div>
                  {cal.comentario && (
                    <p style={{
                      margin: 0, color: '#666', fontSize: '0.88rem', lineHeight: '1.55',
                      paddingLeft: '48px', fontStyle: 'italic',
                      borderTop: '1px solid #f3f4f6', paddingTop: '10px'
                    }}>
                      "{cal.comentario}"
                    </p>
                  )}
                </div>
              ))}
              
              {/* Estado vacÃ­o cuando no hay opiniones */}
              {lista.length === 0 && (
                <div style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '12px' }}>ðŸ’­</div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#666' }}>
                    AÃºn no hay opiniones
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>
                    Las opiniones de tus clientes aparecerÃ¡n aquÃ­ cuando recibas calificaciones
                  </p>
                </div>
              )}
              
              {/* Nota sobre notificaciones */}
              {lista.length > 10 && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.82rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IconMessage width={16} height={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                  <span>
                    Las opiniones anteriores estÃ¡n disponibles en la secciÃ³n de <strong>Notificaciones</strong>
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

/* ================= COMPONENTE PRINCIPAL ================= */
export default function MiTienda() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };
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
  const [userPhotoUrl,  setUserPhotoUrl]  = useState(null);
  const [loading]                 = useState(false);
  const [activeSide,    setActiveSide]    = useState(() => {
    const seccion = new URLSearchParams(window.location.search).get('seccion');
    return seccion || 'Inicio';
  });
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
  const [configForm,    setConfigForm]    = useState({
    horario_atencion: "",
    politica_devoluciones: "",
    politica_envios: "",
    tiempo_despacho_dias: 2
  });
  const [tiendaForm,    setTiendaForm]    = useState({ nombre_tienda: "", direccion: "", telefono: "" });
  const [tiendaMsg,     setTiendaMsg]     = useState("");

  const [ventas,        setVentas]        = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [pedidos,       setPedidos]       = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [filtroEnvios, setFiltroEnvios] = useState("");
  const [empresasMensajeria, setEmpresasMensajeria] = useState([]);
  const [pedidoEnvio, setPedidoEnvio] = useState(null);
  const [envioForm, setEnvioForm] = useState({ id_empresa: "", numero_guia: "" });
  const [guardandoEnvio, setGuardandoEnvio] = useState(false);
  const [envioError, setEnvioError] = useState("");
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const [notificacionesFilter, setNotificacionesFilter] = useState("todas");

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalStock,    setModalStock]    = useState(null);
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
  const [cuentaAEliminar, setCuentaAEliminar] = useState(null);
  const [mostrarExitoCuenta, setMostrarExitoCuenta] = useState(false);
  
  // Estados para nÃ³mina
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [loadingNomina, setLoadingNomina] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState(null);

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
      
      // Cerrar el modal de Ã©xito automÃ¡ticamente despuÃ©s de 3 segundos
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

  const handleEliminarCuenta = async (idCuenta) => {
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
    if (activeSide === 'NÃ³mina') {
      setLoadingNomina(true);
      Promise.all([cargarPagosPendientes(), cargarHistorialPagos()])
        .finally(() => setLoadingNomina(false));
    }
  }, [activeSide]);

  const cargarNotificaciones = useCallback(async (silent = false) => {
    try {
      if (!silent) setNotificacionesLoading(true);
      const soloNoLeidas = notificacionesFilter === "no_leidas";
      const data = await notificacionesService.obtener(soloNoLeidas, 50, 0);
      setNotificaciones(data.notificaciones || []);
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
      setNotificaciones([]);
    } finally {
      if (!silent) setNotificacionesLoading(false);
    }
  }, [notificacionesFilter]);

  const handleMarcarLeida = async (id_notificacion) => {
    try {
      await notificacionesService.marcarLeida(id_notificacion);
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error marcando notificaciÃ³n como leÃ­da:", err);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error marcando todas las notificaciones como leÃ­das:", err);
    }
  };

  const handleEliminar = async (id_notificacion) => {
    if (!window.confirm("Â¿Eliminar notificaciÃ³n?")) return;
    try {
      await notificacionesService.eliminar(id_notificacion);
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error eliminando notificaciÃ³n:", err);
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
    if (!token) { navigate("/login"); return; }

    let mounted = true;

    api.get("/perfil/mi-perfil")
      .then((res) => {
        if (!mounted || !res?.data) return;
        const fotoPerfil = res.data.foto_perfil;
        if (fotoPerfil) {
          setUserPhotoUrl(resolveImageUrl(fotoPerfil));
        }
        if (res.data.nombre_usuario) {
          setUserName(res.data.nombre_usuario);
        }
      })
      .catch((err) => {
        console.error("Error cargando perfil del vendedor:", err);
      });

    return () => { mounted = false; };
  }, [navigate]);

  // Sincronizar activeSide con la URL: usamos history.replaceState en lugar de
  // navigate() para no disparar el ciclo de re-render de React Router (que causa
  // el parpadeo blanco al cambiar de secciÃ³n).
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
        setEnvioError("No se pudo cargar el listado de empresas de mensajerÃ­a.");
      }
    }
  };

  const guardarEnvio = async () => {
    if (!envioForm.id_empresa || !envioForm.numero_guia.trim()) {
      setEnvioError("Selecciona una empresa e ingresa el nÃºmero de guÃ­a.");
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
      setEnvioError(err.response?.data?.detail || "No se pudo registrar la guÃ­a.");
    } finally {
      setGuardandoEnvio(false);
    }
  };

  const cambiarEstadoOrden = async (idOrden, nuevoEstado) => {
    try {
      await api.put(`/perfil/ordenes/${idOrden}/estado`, { estado: nuevoEstado });
      cargarPedidos();
    } catch (err) {
      console.error("Error cambiando estado:", err);
      alert("No se pudo cambiar el estado de la orden");
    }
  };

  const cargarVentas = useCallback(() => {
    setLoadingVentas(true);
    api.get("/libros/mis-ventas")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setVentas(res.data);
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
  // Efectos de carga inicial y actualizacion por secciÃ³n
  // ========================
  // Cargar libros Ãºnicamente al montar el componente
  useEffect(() => {
    cargarLibros();
  }, [cargarLibros]);

  useEffect(() => {
    if (activeSide === "Pedidos" || activeSide === "Envios") {
      cargarPedidos();
    } else if (activeSide === "Ventas") {
      cargarVentas();
    } else if (activeSide === "Mis Libros" || activeSide === "Inicio") {
      cargarLibros();
    }
  }, [activeSide, cargarPedidos, cargarVentas, cargarLibros]);

  useEffect(() => {
    api.get("/libros/categorias")
      .then((r) => {
        if (Array.isArray(r.data)) {
          setCategorias(r.data);
        } else {
          console.error("Respuesta inesperada de categorÃ­as:", r.data);
          setCategorias([]);
        }
      })
      .catch((err) => {
        console.error("Error cargando categorÃ­as:", err);
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
        console.error("Error cargando informaciÃ³n de tienda:", err);
        setTiendaInfo(null);
      });

    // Cargar configuraciÃ³n avanzada
    api.get("/configuracion")
      .then((r) => {
        if (r.data) {
          setConfigForm({
            horario_atencion: r.data.horario_atencion || "",
            politica_devoluciones: r.data.politica_devoluciones || "",
            politica_envios: r.data.politica_envios || "",
            tiempo_despacho_dias: r.data.tiempo_despacho_dias || 2
          });
        }
      })
      .catch((err) => {
        console.error("Error cargando configuraciÃ³n avanzada:", err);
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

  const renderInicio = () => (
    <>
      <div className="welcome-card welcome-card--small">
        <h1>Bienvenido, {userName.split(" ")[0]}</h1>
        <p>AquÃ­ tienes un panorama claro de tu tienda en BookyHome.</p>
      </div>

      <div className="dashboard-top-grid">
        <div className="dashboard-card summary-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-title">Resumen</p>
              <p className="dashboard-card-subtitle">Estado general de tu tienda</p>
            </div>
            <span className="dashboard-card-tag">HISTÃ“RICO</span>
          </div>

          <div className="summary-pill-grid">
            <div className="summary-pill">
              <span>Total ventas (COP)</span>
              <strong>{loadingStats ? "â€¦" : stats ? formatPrecio(stats.total_mes) : "$0 COP"}</strong>
            </div>
            <div className="summary-pill">
              <span>Libros publicados</span>
              <strong>{loadingLibros ? "â€¦" : statsLibros.totalLibros}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card trend-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-title">Tendencia de venta</p>
              <p className="dashboard-card-subtitle">Resumen mensual</p>
            </div>
            <span className="dashboard-card-tag tag-accent">ESTA SEMANA</span>
          </div>

          <div className="trend-pill-grid">
            <div className="trend-pill">
              <p>Ventas esta semana</p>
              <strong>{loadingStats ? 'â€¦' : stats ? formatPrecio(stats.total_semana) : '$0 COP'}</strong>
            </div>
            <div className="trend-pill">
              <p>Ã“rdenes este mes</p>
              <strong>{loadingStats ? 'â€¦' : stats ? stats.ordenes_mes : '0'}</strong>
            </div>
          </div>

          <div className="analytics-chart-block">
            <div className="analytics-chart-bars">
              {[0.35, 0.55, 0.7, 0.6, 0.85, 1].map((ratio, index) => (
                <div
                  key={index}
                  className="analytics-chart-bar"
                  style={{ height: `${Math.max(18, ratio * 100)}%` }}
                />
              ))}
            </div>
            <div className="analytics-chart-meta">
              <p>Ventas en los Ãºltimos 6 dÃ­as</p>
              <strong>{loadingStats ? 'â€¦' : stats ? formatPrecio(stats.total_semana) : '$0 COP'}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card notifications-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-title">Centro de notificaciones</p>
              <p className="dashboard-card-subtitle">Lo mÃ¡s reciente</p>
            </div>
          </div>
          <div className="notification-item">
            <strong>{alertasStock.length}</strong>
            <div>
              <p>Libros con stock bajo</p>
              <small>Revisa el inventario</small>
            </div>
          </div>
          <div className="notification-item">
            <strong>{loadingLibros ? 'â€¦' : statsLibros.totalLibros}</strong>
            <div>
              <p>Libros publicados</p>
              <small>Tu catÃ¡logo activo</small>
            </div>
          </div>
          <div className="notification-item">
            <strong>{loadingTop ? 'â€¦' : topVendidos.length}</strong>
            <div>
              <p>Libros en top ventas</p>
              <small>Los mÃ¡s populares</small>
            </div>
          </div>
        </div>
      </div>

      <div className="inventory-alert-card">
        <div>
          <div className="inventory-alert-top">
            <p className="inventory-alert-title">Alertas de inventario</p>
            <p className="inventory-alert-copy">Recibe avisos automÃ¡ticos cuando el stock de tus libros estÃ© por debajo del umbral.</p>
          </div>
          <div className="inventory-alert-status">
            <span className={alertasStock.length > 0 ? 'inventory-status-warning' : 'inventory-status-ok'} style={{ display: 'flex', alignItems: 'center' }}>
              {alertasStock.length > 0 ? <IconLock width={20} height={20} strokeWidth={2} style={{ color: '#92400e' }} /> : <IconCheck width={20} height={20} strokeWidth={2} style={{ color: 'green' }} />}
            </span>
            <div>
              <p className="inventory-status-title">
                {alertasStock.length > 0 ? 'Hay libros por debajo del umbral' : 'Todo tu inventario estÃ¡ dentro del umbral'}
              </p>
              <p className="inventory-status-copy">
                {alertasStock.length > 0
                  ? `${alertasStock.length} de ${libros.length} libro(s) por debajo de ${stockUmbral} unidades`
                  : `0 de ${libros.length} libros por debajo de ${stockUmbral} unidades`}
              </p>
            </div>
          </div>
        </div>

        <div className="inventory-alert-right">
          <p className="inventory-alert-subtitle">Umbral de alerta</p>
          <input
            id="stock-umbral"
            type="number"
            min="0"
            value={stockUmbral}
            onChange={(e) => {
              const val = Math.max(0, Number(e.target.value));
              setStockUmbral(val);
              localStorage.setItem('stockUmbral', val);
            }}
          />
          <small className="inventory-alert-hint">Ajusta cuÃ¡ntas unidades quedan antes de generar una alerta.</small>
        </div>
      </div>

      <AlertaStock alertas={alertasStock} umbral={stockUmbral} />

      <div className="dashboard-card recent-books-card">
        <div className="dashboard-card-header">
          <div>
            <p className="dashboard-card-title">Ãšltimos libros publicados</p>
            <p className="dashboard-card-subtitle">Los tres libros mÃ¡s recientes de tu catÃ¡logo</p>
          </div>
          <button className="btn-ver-todos" onClick={() => setActiveSide("Mis Libros")}>Ver todos â†’</button>
        </div>

        {loadingLibros ? (
          <p style={{ color: "#999", padding: "16px 0" }}>Cargando libros...</p>
        ) : libros.length === 0 ? (
          <div className="empty-state" style={{ padding: "30px 20px" }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "10px" }}>
              <IconBookOpen width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            </div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>No hay libros publicados aÃºn</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>Publica tu primer libro para verlo aquÃ­.</p>
          </div>
        ) : (
          <div className="recent-books-list">
            {libros.slice(0, 3).map((libro) => {
              const libroImageUrl = getLibroImageUrl(libro);
              return (
                <div key={libro.id_libro} className="recent-book-item">
                  <div className="recent-book-left">
                    <div className="recent-book-cover">
                      {libroImageUrl ? (
                        <img src={libroImageUrl} alt={libro.titulo} />
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} /></span>
                      )}
                    </div>
                    <div>
                      <strong>{libro.titulo}</strong>
                      <p>{libro.autor_libro}</p>
                    </div>
                  </div>
                  <div className="recent-book-meta">
                    <span>{libro.nombre_categoria}</span>
                    <strong>{formatPrecio(libro.precio_libro)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="stats-seccion-label">Tus libros</div>
      <div className="seller-stats">
        <div className="seller-stat-card">
          <h3>Libros publicados</h3>
          <div className="seller-stat-number">{loadingLibros ? "â€¦" : statsLibros.totalLibros}</div>
        </div>
        <div className="seller-stat-card">
          <h3>Unidades en stock</h3>
          <div className="seller-stat-number">{loadingLibros ? "â€¦" : statsLibros.stockTotal}</div>
        </div>
        <div className="seller-stat-card">
          <h3>CategorÃ­as activas</h3>
          <div className="seller-stat-number">{loadingLibros ? "â€¦" : statsLibros.categorias}</div>
        </div>
      </div>

      <div className="stats-seccion-label">Tus ventas</div>
      <div className="seller-stats">
        <div className="seller-stat-card seller-stat-card--ventas">
          <h3>Vendido hoy</h3>
          <div className="seller-stat-number">
            {loadingStats ? "â€¦" : stats ? formatPrecio(stats.total_hoy) : "â€”"}
          </div>
          <span className="stat-sub">{stats ? `${stats.ordenes_hoy} orden(es)` : "Sin datos aÃºn"}</span>
        </div>
        <div className="seller-stat-card seller-stat-card--ventas">
          <h3>Vendido esta semana</h3>
          <div className="seller-stat-number">
            {loadingStats ? "â€¦" : stats ? formatPrecio(stats.total_semana) : "â€”"}
          </div>
        </div>
        <div className="seller-stat-card seller-stat-card--ventas">
          <h3>Vendido este mes</h3>
          <div className="seller-stat-number">
            {loadingStats ? "â€¦" : stats ? formatPrecio(stats.total_mes) : "â€”"}
          </div>
          <span className="stat-sub">{stats ? `${stats.ordenes_mes} orden(es)` : "Sin datos aÃºn"}</span>
        </div>
      </div>

      <div className="seller-books">
        <div className="seller-books-header">
          <h2 className="seller-books-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconStar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Libros mÃ¡s vendidos
          </h2>
          <button className="btn-ver-todos" onClick={() => setActiveSide("Mis Libros")}>Ver todos â†’</button>
        </div>
        {loadingTop && <p style={{ color: "#999", padding: "20px 0" }}>Cargando...</p>}
        {!loadingTop && topVendidos.length === 0 && (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "10px" }}>
              <IconChartBar width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            </div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>AÃºn no hay ventas registradas</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>Cuando se registren ventas, aparecerÃ¡n aquÃ­ los mÃ¡s populares</p>
          </div>
        )}
        {!loadingTop && topVendidos.map((libro, i) => {
          const libroImageUrl = getLibroImageUrl(libro);
          return (
            <div key={libro.id_libro} className="book-row">
              <div className="top-rank">#{i + 1}</div>
              <div className="book-cover-mini">
                {libroImageUrl
                  ? <img src={libroImageUrl} alt={libro.titulo} />
                  : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} /></span>}
              </div>
              <div className="book-info" style={{ flex: 1 }}>
                <h4>{libro.titulo}</h4>
                <p>{libro.autor_libro}</p>
              </div>
              <BadgeEstado estado={libro.estado_libro} />
              <div style={{ textAlign: "right", minWidth: "110px" }}>
                <div className="book-price">{formatPrecio(libro.precio_libro)}</div>
                <div style={{ fontSize: "0.78rem", color: "#888", marginTop: "2px" }}>{libro.unidades_vendidas} vendido(s)</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderMisLibros = () => (
    <>
      <div className="welcome-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.55rem", marginBottom: "4px" }}>Mis libros</h1>
          <p style={{ margin: 0 }}>{libros.length} {libros.length === 1 ? "libro publicado" : "libros publicados"}</p>
        </div>
        <button className="btn btn-vinotinto btn-header" onClick={() => navigate("/vendedor/publicar")}>
          + Publicar libro
        </button>
      </div>

      <AlertaStock alertas={alertasStock} umbral={stockUmbral} />

      <div className="seller-books">
        {loadingLibros && <p style={{ color: "#999", padding: "20px 0" }}>Cargando...</p>}
        {!loadingLibros && libros.length === 0 && (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
              <IconBookOpen width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            </div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px" }}>No tienes libros publicados</p>
            <button className="btn btn-vinotinto btn-header" onClick={() => navigate("/vendedor/publicar")}>
              Publicar primer libro
            </button>
          </div>
        )}
        {!loadingLibros && libros.map((libro) => {
          const libroImageUrl = getLibroImageUrl(libro);
          return (
            <div key={libro.id_libro} className="book-row">
              <div className="book-cover-mini">
                {libroImageUrl
                  ? <img src={libroImageUrl} alt={libro.titulo} />
                  : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} /></span>}
              </div>
              <div className="book-info" style={{ flex: 1 }}>
                <h4>{libro.titulo}</h4>
                <p>{libro.autor_libro} Â· {libro.nombre_categoria}</p>
              </div>
              <BadgeEstado estado={libro.estado_libro} />
              <div className="book-price">{formatPrecio(libro.precio_libro)}</div>
              <div style={{
                fontSize: "0.85rem", minWidth: "70px",
                color: libro.stock === 0 ? "#b91c1c" : libro.stock <= 3 ? "#92400e" : "#777",
                fontWeight: libro.stock <= 3 ? 700 : 400,
              }}>
                Stock: <strong>{libro.stock}</strong>
                {libro.stock === 0 && <span style={{ marginLeft: "4px", display: 'flex', alignItems: 'center' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /></span>}
              </div>
              <div className="book-actions">
                <button className="btn-accion btn-stock" onClick={() => setModalStock(libro)}>Stock</button>
                <button className="btn-accion btn-editar" onClick={() => setModalEditar(libro)}>Editar</button>
                <button className="btn-accion btn-eliminar-sm" onClick={() => setModalEliminar(libro)}>Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderPerfil = () => (
    <>
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconUser width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Perfil del negocio
        </h1>
        <p style={{ margin: 0 }}>Resumen de tu tienda y tus datos pÃºblicos.</p>
      </div>

      <div className="pl-card" style={{ padding: "2rem", marginTop: "20px" }}>
        {!tiendaInfo ? (
          <p style={{ color: "#888" }}>Cargando informaciÃ³n de la tienda...</p>
        ) : (
          <div style={{ display: "grid", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Nombre de la tienda</label>
                <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#fafafa", border: "1px solid #ddd" }}>
                  {tiendaInfo.nombre_tienda || "--"}
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>TelÃ©fono</label>
                <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#fafafa", border: "1px solid #ddd" }}>
                  {tiendaInfo.telefono || "--"}
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>DirecciÃ³n</label>
              <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#fafafa", border: "1px solid #ddd" }}>
                {tiendaInfo.direccion || "--"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Miembro desde</label>
                <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#fafafa", border: "1px solid #ddd" }}>
                  {tiendaInfo.fecha_creacion || "--"}
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>Libros publicados</label>
                <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#fafafa", border: "1px solid #ddd" }}>
                  {statsLibros.totalLibros}
                </div>
              </div>
            </div>

            <button
              style={{
                background: "var(--vinotinto)", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", fontWeight: 700,
                fontSize: "0.95rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif", width: "fit-content"
              }}
              onClick={() => setActiveSide("ConfiguraciÃ³n")}
            >
              Editar configuraciÃ³n
            </button>
          </div>
        )}
      </div>

      {/* SecciÃ³n de Cuentas Bancarias en el Perfil */}
      <div className="pl-card" style={{ padding: "2rem", marginTop: "20px" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <IconCreditCard width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Cuentas Bancarias</h2>
        </div>
        
        {cuentasBancarias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', background: '#fafafa', borderRadius: '8px' }}>
            <IconCreditCard width={48} height={48} strokeWidth={1.5} style={{ color: '#ccc', marginBottom: '15px' }} />
            <p style={{ color: '#666', marginBottom: '15px' }}>No tienes cuentas bancarias registradas</p>
            <button
              onClick={() => setMostrarFormCuenta(true)}
              style={{
                background: "var(--vinotinto)", color: "white", border: "none",
                padding: "10px 20px", borderRadius: "6px", fontWeight: 600,
                cursor: "pointer", fontFamily: "Montserrat, sans-serif"
              }}
            >
              Agregar cuenta bancaria
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {cuentasBancarias.map((cuenta) => (
              <div
                key={cuenta.id_metodo}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: cuenta.es_principal ? '#f0f8ff' : '#fafafa',
                  border: cuenta.es_principal ? '2px solid #4a90e2' : '1px solid #ddd',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {cuenta.banco} - {cuenta.tipo_cuenta}
                    {cuenta.es_principal && (
                      <span style={{
                        background: '#4a90e2', color: 'white',
                        padding: '2px 8px', borderRadius: '4px',
                        fontSize: '0.75rem', marginLeft: '8px'
                      }}>
                        Principal
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    ****{cuenta.numero_cuenta.slice(-4)}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>
                    {cuenta.titular}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!cuenta.es_principal && (
                    <button
                      onClick={() => handleMarcarPrincipal(cuenta.id)}
                      style={{
                        background: '#4a90e2', color: 'white', border: 'none',
                        padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem',
                        cursor: 'pointer', fontWeight: 500
                      }}
                    >
                      Principal
                    </button>
                  )}
                  <button
                    onClick={() => confirmarEliminarCuenta(cuenta)}
                    style={{
                      background: '#dc3545', color: 'white', border: 'none',
                      padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem',
                      cursor: 'pointer', fontWeight: 500
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setMostrarFormCuenta(true)}
              style={{
                background: 'white', color: 'var(--vinotinto)', border: '2px solid var(--vinotinto)',
                padding: '10px 20px', borderRadius: '6px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', marginTop: '10px'
              }}
            >
              + Agregar nueva cuenta
            </button>
          </div>
        )}
      </div>

      {/* Modal para agregar cuenta bancaria */}
      {mostrarFormCuenta && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '16px',
            maxWidth: '550px', width: '95%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#7A1E3A' }}>
                Agregar cuenta bancaria
              </h3>
              <button
                onClick={() => setMostrarFormCuenta(false)}
                style={{
                  background: 'none', border: 'none', fontSize: '1.5rem',
                  cursor: 'pointer', color: '#999', padding: '5px',
                  borderRadius: '50%', width: '35px', height: '35px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                Ã—
              </button>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#444', fontSize: '0.9rem' }}>
                  Tipo de cuenta *
                </label>
                <select
                  value={cuentaForm.tipo_cuenta}
                  onChange={(e) => setCuentaForm({...cuentaForm, tipo_cuenta: e.target.value})}
                  style={{ padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                >
                  <option value="">Selecciona tipo de cuenta</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#444', fontSize: '0.9rem' }}>
                  Banco *
                </label>
                <select
                  value={cuentaForm.banco}
                  onChange={(e) => setCuentaForm({...cuentaForm, banco: e.target.value})}
                  style={{ padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                >
                  <option value="">Selecciona el banco</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Davivienda">Davivienda</option>
                  <option value="Banco de BogotÃ¡">Banco de BogotÃ¡</option>
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
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#444', fontSize: '0.9rem' }}>
                  NÃºmero de cuenta *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 123-456789-01"
                  value={cuentaForm.numero_cuenta}
                  onChange={(e) => setCuentaForm({...cuentaForm, numero_cuenta: e.target.value})}
                  style={{ padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#444', fontSize: '0.9rem' }}>
                  Titular de la cuenta *
                </label>
                <input
                  type="text"
                  placeholder="Nombre completo del titular"
                  value={cuentaForm.nombre_titular}
                  onChange={(e) => setCuentaForm({...cuentaForm, nombre_titular: e.target.value})}
                  style={{ padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#444', fontSize: '0.9rem' }}>
                  CÃ©dula del titular *
                </label>
                <input
                  type="text"
                  placeholder="NÃºmero de documento"
                  value={cuentaForm.cedula_titular}
                  onChange={(e) => setCuentaForm({...cuentaForm, cedula_titular: e.target.value})}
                  style={{ padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f7e9ee', borderRadius: '8px', border: '1px solid #f0e0e6' }}>
                <input
                  type="checkbox"
                  checked={cuentaForm.es_principal}
                  onChange={(e) => setCuentaForm({...cuentaForm, es_principal: e.target.checked})}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, color: '#7A1E3A', fontSize: '0.9rem' }}>
                  Establecer como cuenta principal para recibir pagos
                </span>
              </label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  onClick={handleAgregarCuenta}
                  style={{
                    background: 'var(--vinotinto)', color: 'white', border: 'none',
                    padding: '14px 28px', borderRadius: '8px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', flex: 1,
                    fontSize: '1rem', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#6a1832'}
                  onMouseLeave={(e) => e.target.style.background = 'var(--vinotinto)'}
                >
                  Guardar cuenta
                </button>
                <button
                  onClick={() => setMostrarFormCuenta(false)}
                  style={{
                    background: '#f5f5f5', color: '#333', border: '1px solid #ddd',
                    padding: '14px 28px', borderRadius: '8px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', flex: 1,
                    fontSize: '1rem', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#e5e5e5'}
                  onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmaciÃ³n para eliminar cuenta */}
      {cuentaAEliminar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '16px',
            maxWidth: '450px', width: '95%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: '#fee2e2', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 15px'
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.3rem', fontWeight: 700, color: '#333' }}>
                Â¿Eliminar cuenta bancaria?
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.95rem', lineHeight: 1.5 }}>
                EstÃ¡s a punto de eliminar la cuenta <strong>{cuentaAEliminar.banco}</strong> - {cuentaAEliminar.tipo_cuenta} (****{cuentaAEliminar.numero_cuenta?.slice(-4)}).
              </p>
              <p style={{ margin: '10px 0 0', color: '#999', fontSize: '0.85rem' }}>
                Esta acciÃ³n no se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setCuentaAEliminar(null)}
                style={{
                  background: '#f5f5f5', color: '#333', border: '1px solid #ddd',
                  padding: '12px 24px', borderRadius: '8px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', flex: 1,
                  fontSize: '0.95rem', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e5e5e5'}
                onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarCuenta(cuentaAEliminar.id_metodo)}
                style={{
                  background: '#dc3545', color: 'white', border: 'none',
                  padding: '12px 24px', borderRadius: '8px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', flex: 1,
                  fontSize: '0.95rem', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#c82333'}
                onMouseLeave={(e) => e.target.style.background = '#dc3545'}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ã©xito al agregar cuenta */}
      {mostrarExitoCuenta && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '16px',
            maxWidth: '400px', width: '95%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '70px', height: '70px', borderRadius: '50%',
                background: '#dcfce7', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px'
              }}>
                <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', fontWeight: 700, color: '#16a34a' }}>
                Â¡Cuenta agregada exitosamente!
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Tu cuenta bancaria ha sido registrada correctamente en el sistema.
              </p>
              <button
                onClick={() => setMostrarExitoCuenta(false)}
                style={{
                  background: '#16a34a', color: 'white', border: 'none',
                  padding: '12px 32px', borderRadius: '8px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                  fontSize: '1rem', marginTop: '20px', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#15803d'}
                onMouseLeave={(e) => e.target.style.background = '#16a34a'}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderNomina = () => {
    const token = localStorage.getItem("token");
    let userId = 'N/A';
    try {
      const payload = jwtDecode(token);
      userId = payload.sub;
    } catch (e) {
      console.error('Error decodificando token:', e);
    }

    return (
    <>
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconCreditCard width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          NÃ³mina y Pagos
        </h1>
        <p style={{ margin: 0 }}>Consulta tus pagos pendientes, historial de pagos procesados y estadÃ­sticas financieras.</p>
        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
          ID de Vendedor: <strong>{userId}</strong>
        </div>
      </div>

      <div className="pl-card" style={{ padding: "2rem", marginTop: "20px" }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={() => {
              setLoadingNomina(true);
              Promise.all([cargarPagosPendientes(), cargarHistorialPagos()])
                .finally(() => setLoadingNomina(false));
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#7A1E3A',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <IconRefresh width={16} height={16} strokeWidth={2} />
            Recargar datos
          </button>
        </div>

        {loadingNomina ? (
          <p style={{ color: "#888" }}>Cargando informaciÃ³n de pagos...</p>
        ) : (
          <div style={{ display: 'grid', gap: '32px' }}>
            {/* Resumen General - Similar al Admin */}
            <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, #7A1E3A 0%, #5e1629 100%)', 
              borderRadius: '12px', 
              color: 'white',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Pendiente</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>
                    ${formatPrecio(pagosPendientes.reduce((acc, p) => acc + p.monto, 0))}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Pagos Pendientes</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                    {pagosPendientes.length}
                  </p>
                </div>
              </div>
            </div>

            {/* EstadÃ­sticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#F4EDE2', 
                borderRadius: '8px',
                border: '1px solid #E0DBD4'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Total Recibido</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  ${formatPrecio(historialPagos.reduce((acc, p) => acc + p.monto, 0))}
                </p>
              </div>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#F4EDE2', 
                borderRadius: '8px',
                border: '1px solid #E0DBD4'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Pagos Procesados</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#7A1E3A' }}>
                  {historialPagos.length}
                </p>
              </div>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#F4EDE2', 
                borderRadius: '8px',
                border: '1px solid #E0DBD4'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Ventas Totales</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#2A2A2A' }}>
                  {pagosPendientes.length + historialPagos.reduce((acc, p) => acc + p.num_pagos, 0)}
                </p>
              </div>
            </div>

            {/* Pagos Pendientes */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 700 }}>
                Pagos Pendientes (Ventas individuales)
              </h3>
              {pagosPendientes.length === 0 ? (
                <div style={{ padding: '32px', background: '#fafafa', borderRadius: '8px', textAlign: 'center', border: '1px solid #eee' }}>
                  <IconCreditCard width={48} height={48} strokeWidth={1.5} style={{ color: '#ccc', marginBottom: '16px' }} />
                  <p style={{ color: '#666', margin: 0 }}>No tienes pagos pendientes</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {pagosPendientes.map((pago) => (
                    <div key={pago.id} style={{ padding: '16px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                          Orden #{pago.id_venta}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          Fecha: {new Date(pago.fecha_venta).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#7A1E3A', fontSize: '1.1rem' }}>
                          ${formatPrecio(pago.monto)}
                        </div>
                        <div style={{ color: '#999', fontSize: '0.85rem' }}>
                          Pendiente
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial de Pagos */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#7A1E3A', fontSize: '1.3rem', fontWeight: 700 }}>
                Historial de Pagos Procesados
              </h3>
              {historialPagos.length === 0 ? (
                <div style={{ padding: '32px', background: '#fafafa', borderRadius: '8px', textAlign: 'center', border: '1px solid #eee' }}>
                  <IconCreditCard width={48} height={48} strokeWidth={1.5} style={{ color: '#ccc', marginBottom: '16px' }} />
                  <p style={{ color: '#666', margin: 0 }}>No hay historial de pagos</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {historialPagos.map((pago) => (
                    <div key={pago.id} style={{ padding: '16px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedPayment(expandedPayment === pago.id ? null : pago.id)}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                            Lote de Pagos - Ref: {pago.referencia}
                          </div>
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            {pago.num_pagos} ventas procesadas â€¢ {new Date(pago.fecha).toLocaleDateString('es-CO')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>
                            ${formatPrecio(pago.monto)}
                          </div>
                          <div style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>
                            Procesado
                          </div>
                        </div>
                      </div>
                      
                      {expandedPayment === pago.id && pago.pagos && (
                        <div style={{ 
                          marginTop: '12px', 
                          paddingTop: '12px', 
                          borderTop: '1px solid #eee',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#7A1E3A' }}>
                            Ventas incluidas en este lote:
                          </div>
                          {pago.pagos.map((pagoDetalle, idx) => (
                            <div key={idx} style={{ 
                              padding: '4px 0', 
                              borderBottom: '1px solid #f5f5f5',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span>Orden #{pagoDetalle.id_venta}</span>
                              <span>${formatPrecio(pagoDetalle.monto)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
    );
  };

  const renderConfiguracion = () => (
    <>
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconSettings width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          ConfiguraciÃ³n del negocio
        </h1>
        <p style={{ margin: 0 }}>Actualiza los datos de tu tienda en BookyHome</p>
      </div>

      <div className="pl-card" style={{ padding: "2rem", marginTop: "20px" }}>
        {!tiendaInfo ? (
          <p style={{ color: "#888" }}>Cargando informaciÃ³n de la tienda...</p>
        ) : (
          <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minWidth: "300px", maxWidth: "500px" }}>
              <h3 style={{ fontSize: "1.1rem", margin: "10px 0 0 0", color: "var(--vinotinto)" }}>InformaciÃ³n BÃ¡sica</h3>
              <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>
                Nombre de la tienda
              </label>
              <input
                type="text"
                value={tiendaForm.nombre_tienda}
                onChange={(e) => setTiendaForm({ ...tiendaForm, nombre_tienda: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>
                DirecciÃ³n
              </label>
              <input
                type="text"
                value={tiendaForm.direccion}
                onChange={(e) => setTiendaForm({ ...tiendaForm, direccion: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>
                TelÃ©fono
              </label>
              <input
                type="text"
                value={tiendaForm.telefono}
                onChange={(e) => setTiendaForm({ ...tiendaForm, telefono: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>
                Miembro desde
              </label>
              <input
                type="text"
                value={tiendaInfo.fecha_creacion}
                readOnly
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #ddd", fontSize: "0.95rem", background: "#f5f5f5",
                  fontFamily: "Montserrat, sans-serif", color: "#888"
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minWidth: "300px" }}>
            <h3 style={{ fontSize: "1.1rem", margin: "10px 0 0 0", color: "var(--vinotinto)" }}>Ajustes Avanzados</h3>
            
            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>
                Horario de atenciÃ³n
              </label>
              <input
                type="text"
                placeholder="Ej: Lunes a Viernes 8am a 5pm"
                value={configForm.horario_atencion}
                onChange={(e) => setConfigForm({ ...configForm, horario_atencion: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>
                DÃ­as de despacho
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={configForm.tiempo_despacho_dias}
                onChange={(e) => setConfigForm({ ...configForm, tiempo_despacho_dias: parseInt(e.target.value) || 2 })}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif"
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>
                PolÃ­tica de envÃ­os
              </label>
              <textarea
                rows="3"
                value={configForm.politica_envios}
                onChange={(e) => setConfigForm({ ...configForm, politica_envios: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif", resize: "vertical"
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, color: "#444", display: "block", marginBottom: "6px" }}>
                PolÃ­tica de devoluciones
              </label>
              <textarea
                rows="3"
                value={configForm.politica_devoluciones}
                onChange={(e) => setConfigForm({ ...configForm, politica_devoluciones: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #ddd", fontSize: "0.95rem", fontFamily: "Montserrat, sans-serif", resize: "vertical"
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            style={{
              background: "var(--vinotinto)", color: "white", border: "none",
              padding: "12px 24px", borderRadius: "8px", fontWeight: 700,
              fontSize: "0.95rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif"
            }}
            onClick={() => {
              if (!tiendaForm.nombre_tienda?.trim()) {
                setTiendaMsg("El nombre de la tienda es obligatorio");
                return;
              }
              if (tiendaForm.nombre_tienda.trim().length < 3) {
                setTiendaMsg("El nombre debe tener al menos 3 caracteres");
                return;
              }
              
              Promise.all([
                api.put("/tiendas/mi-tienda", tiendaForm),
                api.put("/configuracion", configForm)
              ])
                .then(() => {
                  setTiendaMsg("Â¡ConfiguraciÃ³n actualizada con Ã©xito!");
                  setTimeout(() => setTiendaMsg(""), 3000);
                  setTiendaInfo(prev => ({ ...prev, ...tiendaForm }));
                })
                .catch((err) => {
                  console.error("Error actualizando configuraciÃ³n:", err);
                  setTiendaMsg("Error: " + (err.response?.data?.detail || err.message));
                  setTimeout(() => setTiendaMsg(""), 4000);
                });
            }}
          >
            Guardar cambios
          </button>
          
          {tiendaMsg && <p style={{ color: "green", fontWeight: 600, margin: 0 }}>{tiendaMsg}</p>}
        </div>
          </>
        )}
      </div>
    </>
  );

  const renderCuentasBancarias = () => (
    <>
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconCreditCard width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Cuentas Bancarias
        </h1>
        <p style={{ margin: 0 }}>Gestiona tus cuentas bancarias para recibir pagos de nÃ³mina.</p>
      </div>

      <div className="pl-card" style={{ padding: "2rem", marginTop: "20px" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#2A2A2A' }}>Mis Cuentas Bancarias</h3>
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
          <div style={{ padding: '20px', background: '#f4f4f4', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#2A2A2A' }}>Agregar Nueva Cuenta</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <select
                value={cuentaForm.tipo_cuenta}
                onChange={(e) => setCuentaForm({...cuentaForm, tipo_cuenta: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
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
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="">Selecciona el banco</option>
                <option value="Bancolombia">Bancolombia</option>
                <option value="Davivienda">Davivienda</option>
                <option value="Banco de BogotÃ¡">Banco de BogotÃ¡</option>
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
                placeholder="NÃºmero de cuenta"
                value={cuentaForm.numero_cuenta}
                onChange={(e) => setCuentaForm({...cuentaForm, numero_cuenta: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
              <input
                type="text"
                placeholder="Nombre del titular"
                value={cuentaForm.nombre_titular}
                onChange={(e) => setCuentaForm({...cuentaForm, nombre_titular: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
              <input
                type="text"
                placeholder="CÃ©dula del titular"
                value={cuentaForm.cedula_titular}
                onChange={(e) => setCuentaForm({...cuentaForm, cedula_titular: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={cuentaForm.es_principal}
                  onChange={(e) => setCuentaForm({...cuentaForm, es_principal: e.target.checked})}
                />
                Marcar como cuenta principal para nÃ³mina
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
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No tienes cuentas bancarias registradas. Agrega tu primera cuenta para empezar a recibir pagos.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {cuentasBancarias.map((cuenta) => (
              <div key={cuenta.id_metodo} style={{
                padding: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: cuenta.es_principal ? '#f0f0f0' : 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, color: '#2A2A2A' }}>{cuenta.banco}</h4>
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
                  <p style={{ margin: '4px 0', color: '#666', fontSize: '0.9rem' }}>
                    {cuenta.tipo_cuenta} - {cuenta.numero_cuenta}
                  </p>
                  <p style={{ margin: '4px 0', color: '#666', fontSize: '0.9rem' }}>
                    Titular: {cuenta.nombre_titular}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
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
        <p style={{ fontSize: "0.87rem", color: "#888" }}>Esta secciÃ³n estarÃ¡ disponible prÃ³ximamente</p>
      </div>
    </div>
  );

  const renderPedidos = () => (
    <>
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconPackage width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Pedidos Recibidos
        </h1>
        <p style={{ margin: 0 }}>Gestiona las compras realizadas por tus clientes</p>
      </div>

      <div className="seller-books" style={{ marginTop: "20px" }}>
        {loadingPedidos && <p style={{ color: "#999", padding: "20px 0" }}>Cargando pedidos...</p>}
        {!loadingPedidos && pedidos.length === 0 && (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
              <IconPackage width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            </div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px" }}>AÃºn no has recibido pedidos</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>Cuando un comprador adquiera tus libros, aparecerÃ¡n aquÃ­</p>
          </div>
        )}
        {!loadingPedidos && pedidos.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0dbd4", color: "var(--vinotinto)" }}>
                  <th style={{ padding: "12px", fontWeight: 700 }}>ID Orden</th>
                  <th style={{ padding: "12px", fontWeight: 700 }}>Fecha</th>
                  <th style={{ padding: "12px", fontWeight: 700 }}>Cliente</th>
                  <th style={{ padding: "12px", fontWeight: 700 }}>Productos</th>
                  <th style={{ padding: "12px", fontWeight: 700 }}>Estado</th>
                  <th style={{ padding: "12px", fontWeight: 700 }}>GuÃ­a / envÃ­o</th>
                  <th style={{ padding: "12px", fontWeight: 700, textAlign: "right" }}>Total Tienda</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido, idx) => (
                  <tr key={`${pedido.id_orden}-${idx}`} style={{ borderBottom: "1px solid #f0ebe4" }}>
                    <td style={{ padding: "12px", fontWeight: 600 }}>#{pedido.id_orden}<br /><span style={{ color: "#777", fontWeight: 500, fontSize: "0.72rem" }}>{pedido.codigo_compra}</span></td>
                    <td style={{ padding: "12px", fontSize: "0.9rem" }}>
                      {pedido.fecha ? new Date(pedido.fecha).toLocaleDateString("es-CO") : "Reciente"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: 600 }}>{pedido.cliente}</div>
                      <div style={{ fontSize: "0.8rem", color: "#777" }}>{pedido.correo_cliente}</div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {pedido.items.map((item, index) => (
                        <div key={index} style={{ fontSize: "0.88rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IconBook width={16} height={16} strokeWidth={2} style={{ color: '#7A1E3A' }} /> <strong>{item.titulo}</strong> x {item.cantidad}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {(() => {
                        const estado = pedido.estado?.toLowerCase();
                        const colores = {
                          pagado:   { border: "#c49a00", bg: "#fffbea", color: "#7a5c00" },
                          enviado:  { border: "#2979c7", bg: "#eaf3ff", color: "#1a4f8a" },
                          entregada:{ border: "#1e8a45", bg: "#eafaf1", color: "#145c2e" },
                          cancelada:{ border: "#c0392b", bg: "#fdecea", color: "#7b1e1e" },
                        };
                        const c = colores[estado];
                        if (c) {
                          return (
                            <select
                              value={estado}
                              onChange={(e) => cambiarEstadoOrden(pedido.id_orden, e.target.value)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: `2px solid ${c.border}`,
                                backgroundColor: c.bg,
                                color: c.color,
                                fontSize: "0.85rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                minWidth: "120px",
                                transition: "all 0.2s ease"
                              }}
                            >
                              <option value="pagado">Pagado</option>
                              <option value="enviado">Enviado</option>
                              <option value="entregada">Entregada</option>
                              <option value="cancelada">Cancelada</option>
                            </select>
                          );
                        }
                        return (
                          <div style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            backgroundColor: "#f5f5f5",
                            color: "#999",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            minWidth: "120px",
                            textAlign: "center"
                          }}>
                            {pedido.estado || "Pendiente"}
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "12px", minWidth: "145px" }}>
                      {(() => {
                        const estado = pedido.estado?.toLowerCase();
                        // Orden cancelada
                        if (estado === "cancelada") {
                          return (
                            <div style={{
                              padding: "7px 11px",
                              borderRadius: "999px",
                              background: "#fdecea",
                              color: "#c0392b",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              textAlign: "center",
                              border: "1px solid #e9b4b0"
                            }}>
                              Pedido cancelado
                            </div>
                          );
                        }
                        // GuÃ­a ya registrada â€” se muestra en cualquier estado
                        if (pedido.envio) {
                          return (
                            <div style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                              <strong style={{ display: "block", color: "#4b2733" }}>
                                {pedido.envio.empresa_mensajeria}
                              </strong>
                              <span style={{ color: "#6d6265" }}>GuÃ­a {pedido.envio.numero_guia}</span>
                              {["pagado", "enviado"].includes(estado) && (
                                <button
                                  onClick={() => abrirRegistroEnvio(pedido)}
                                  style={{
                                    display: "block",
                                    marginTop: "5px",
                                    border: "1px solid #9b4d65",
                                    borderRadius: "999px",
                                    padding: "4px 9px",
                                    cursor: "pointer",
                                    background: "#fff",
                                    color: "#7A1E3A",
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  âœï¸ Editar guÃ­a
                                </button>
                              )}
                            </div>
                          );
                        }
                        // Sin guÃ­a â€” botÃ³n disponible si estÃ¡ pagado o enviado
                        if (["pagado", "enviado"].includes(estado)) {
                          return (
                            <button
                              onClick={() => abrirRegistroEnvio(pedido)}
                              style={{
                                border: "1px solid #9b4d65",
                                borderRadius: "999px",
                                padding: "7px 11px",
                                cursor: "pointer",
                                background: "#fff",
                                color: "#7A1E3A",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                whiteSpace: "nowrap"
                              }}
                            >
                              + Registrar guÃ­a
                            </button>
                          );
                        }
                        // Entregada sin guÃ­a
                        if (estado === "entregada") {
                          return (
                            <div style={{
                              padding: "7px 11px",
                              borderRadius: "999px",
                              background: "#eafaf1",
                              color: "#1e8a45",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              textAlign: "center",
                              border: "1px solid #a8d5b5"
                            }}>
                              Entregado
                            </div>
                          );
                        }
                        // Pendiente u otro
                        return (
                          <div style={{
                            padding: "7px 11px",
                            borderRadius: "999px",
                            background: "#e7e1e2",
                            color: "#7b7073",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            textAlign: "center"
                          }}>
                            Pendiente de pago
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "var(--gris-carbon)" }}>
                      {formatPrecio(pedido.total_tienda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {pedidoEnvio && (
        <div className="modal-overlay open" onClick={() => !guardandoEnvio && setPedidoEnvio(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px", padding: "28px" }}>
            <h2 style={{ marginTop: 0 }}>Registrar guÃ­a de envÃ­o Â· Orden #{pedidoEnvio.id_orden}</h2>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Elige la transportadora acordada e ingresa el nÃºmero de guÃ­a que ella te entregÃ³. BookyHome no realiza ni controla el transporte.</p>
            <label style={{ display: "block", fontWeight: 600, marginTop: "18px" }}>Empresa de mensajerÃ­a</label>
            <select value={envioForm.id_empresa} onChange={(e) => setEnvioForm({ ...envioForm, id_empresa: e.target.value })} style={{ width: "100%", marginTop: "6px", padding: "10px", borderRadius: "6px" }}>
              <option value="">Selecciona una empresa</option>
              {empresasMensajeria.map((empresa) => <option key={empresa.id_empresa} value={empresa.id_empresa}>{empresa.nombre_empresa}</option>)}
            </select>
            <label style={{ display: "block", fontWeight: 600, marginTop: "14px" }}>NÃºmero de guÃ­a</label>
            <input value={envioForm.numero_guia} onChange={(e) => setEnvioForm({ ...envioForm, numero_guia: e.target.value })} maxLength={80} placeholder="Ej. 123456789" style={{ width: "100%", marginTop: "6px", padding: "10px", borderRadius: "6px", boxSizing: "border-box" }} />
            {envioError && <p style={{ color: "#b42318", fontSize: "0.85rem" }}>{envioError}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "22px" }}>
              <button onClick={() => setPedidoEnvio(null)} disabled={guardandoEnvio}>Cancelar</button>
              <button className="btn btn-vinotinto" onClick={guardarEnvio} disabled={guardandoEnvio}>{guardandoEnvio ? "Guardando..." : "Guardar guÃ­a"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderEnvios = () => {
    const texto = filtroEnvios.trim().toLowerCase();
    const envios = pedidos.filter((pedido) => {
      if (!pedido.envio || pedido.estado !== "pagado") return false;
      if (!texto) return true;
      return [pedido.codigo_compra, pedido.id_orden, pedido.cliente, pedido.correo_cliente, pedido.envio.empresa_mensajeria, pedido.envio.numero_guia]
        .some((valor) => String(valor || "").toLowerCase().includes(texto));
    });

    return (
      <>
        <div className="welcome-card">
          <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <IconTruck width={28} height={28} strokeWidth={2} style={{ color: "#7A1E3A" }} />
            EnvÃ­os y seguimiento
          </h1>
          <p style={{ margin: 0 }}>Consulta las guÃ­as registradas y abre el rastreo oficial de cada transportadora.</p>
        </div>

        <div className="seller-books" style={{ marginTop: "20px", padding: "20px" }}>
          <label style={{ display: "block", fontWeight: 700, color: "#4b2733", marginBottom: "8px" }}>Buscar envÃ­o</label>
          <input
            value={filtroEnvios}
            onChange={(e) => setFiltroEnvios(e.target.value)}
            placeholder="Compra, guÃ­a, comprador o transportadora"
            style={{ width: "100%", maxWidth: "520px", padding: "11px 13px", border: "1px solid #d9cfd1", borderRadius: "8px", boxSizing: "border-box" }}
          />
        </div>

        {loadingPedidos ? <p style={{ color: "#777", padding: "20px 0" }}>Cargando envÃ­os...</p> : envios.length === 0 ? (
          <div className="empty-state"><p>No hay envÃ­os que coincidan con la bÃºsqueda.</p></div>
        ) : (
          <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
            {envios.map((pedido) => (
              <article key={`${pedido.id_comprador}-${pedido.id_orden}`} className="seller-books" style={{ padding: "20px", borderLeft: "4px solid #7A1E3A" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ display: "block", color: "#4b2733" }}>Compra {pedido.codigo_compra}</strong>
                    <span style={{ color: "#666", fontSize: "0.86rem" }}>Pedido #{pedido.id_orden} Â· {pedido.cliente}</span>
                  </div>
                  <span className="pl-badge pl-badge--entregado">{pedido.envio.estado_envio || "GuÃ­a registrada"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "16px", flexWrap: "wrap", borderTop: "1px solid #eee", marginTop: "16px", paddingTop: "14px" }}>
                  <div>
                    <strong style={{ display: "block" }}>{pedido.envio.empresa_mensajeria}</strong>
                    <span style={{ color: "#666", fontSize: "0.86rem" }}>GuÃ­a: {pedido.envio.numero_guia}</span>
                  </div>
                  <a href={pedido.envio.url_rastreo || pedido.envio.sitio_web} target="_blank" rel="noreferrer" className="btn btn-vinotinto" style={{ width: "auto", padding: "9px 14px", fontSize: "0.82rem" }}>
                    Rastrear con la transportadora
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderVentas = () => (
    <>
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconChartBar width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Registro de Ventas
        </h1>
        <p style={{ margin: 0 }}>Historial detallado de libros vendidos</p>
      </div>

      <div className="seller-books" style={{ marginTop: "20px" }}>
        {loadingVentas && <p style={{ color: "#999", padding: "20px 0" }}>Cargando ventas...</p>}
        {!loadingVentas && ventas.length === 0 && (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
              <IconChartBar width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            </div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px" }}>No hay ventas registradas aÃºn</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>AquÃ­ aparecerÃ¡ el desglose por libro vendido</p>
          </div>
        )}
        {!loadingVentas && ventas.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0dbd4", color: "var(--vinotinto)" }}>
                  <th style={{ padding: "12px", fontWeight: 700 }}>Orden</th>
                  <th style={{ padding: "12px", fontWeight: 700 }}>Fecha</th>
                  <th style={{ padding: "12px", fontWeight: 700 }}>Libro</th>
                  <th style={{ padding: "12px", fontWeight: 700, textAlign: "center" }}>Cant</th>
                  <th style={{ padding: "12px", fontWeight: 700, textAlign: "right" }}>Precio Unit.</th>
                  <th style={{ padding: "12px", fontWeight: 700, textAlign: "right" }}>Total</th>
                  <th style={{ padding: "12px", fontWeight: 700 }}>Comprador</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #f0ebe4" }}>
                    <td style={{ padding: "12px", fontWeight: 600 }}>#{v.id_orden}</td>
                    <td style={{ padding: "12px", fontSize: "0.9rem" }}>
                      {v.fecha ? new Date(v.fecha).toLocaleDateString("es-CO") : "Reciente"}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 600, color: "var(--vinotinto)" }}>{v.titulo}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{v.cantidad}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{formatPrecio(v.precio_libro)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "var(--rojo-suave)" }}>
                      {formatPrecio(v.total)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: 600 }}>{v.cliente}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const renderNotificaciones = () => (
    <div className="notificaciones-container notificaciones-container--embedded">
      <div className="notificaciones-wrapper">
        <div className="notif-header notif-header--embedded">
          <h1>Notificaciones</h1>
          {notificaciones.some((n) => !n.leida) && (
            <button className="btn-marcar-todas" onClick={handleMarcarTodasLeidas}>
              Marcar todas como leÃ­das
            </button>
          )}
        </div>

        <div className="notif-filtros">
          <button className={`filtro ${notificacionesFilter === "todas" ? "active" : ""}`} onClick={() => setNotificacionesFilter("todas")}>
            Todas
          </button>
          <button className={`filtro ${notificacionesFilter === "no_leidas" ? "active" : ""}`} onClick={() => setNotificacionesFilter("no_leidas")}>
            No leÃ­das
          </button>
        </div>

        <div className="notif-lista">
          {notificacionesLoading ? (
            <div className="loading">Cargando...</div>
          ) : notificaciones.length === 0 ? (
            <div className="notif-empty">
              <p>{notificacionesFilter === "no_leidas" ? "No tienes notificaciones sin leer" : "No tienes notificaciones"}</p>
            </div>
          ) : (
            notificaciones.map((notif) => (
              <div key={notif.id_notificacion} className={`notif-item ${notif.leida ? "" : "no-leida"}`} onClick={() => handleClickNotificacion(notif)}>
                <div className="notif-icono">
                  <span>{getIconoTipo(notif.tipo)}</span>
                </div>
                <div className="notif-contenido">
                  <h3>{notif.titulo}</h3>
                  <p>{notif.descripcion}</p>
                  <small>{new Date(notif.fecha_creacion).toLocaleString()}</small>
                </div>
                <div className="notif-acciones">
                  {!notif.leida && (
                    <button className="btn-marcar" onClick={(e) => { e.stopPropagation(); handleMarcarLeida(notif.id_notificacion); }}>
                      âœ“
                    </button>
                  )}
                  <button className="btn-eliminar" onClick={(e) => { e.stopPropagation(); handleEliminar(notif.id_notificacion); }}>
                    âœ•
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

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
        <SeccionCalificacionesVendedor tiendaId={tiendaInfo?.id_tienda} />
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
      case "Soporte tÃ©cnico": return <Soporte />;
      case "Envios":        return renderEnvios();
      case "Clientes":      return renderProximamente("Clientes");
      case "ConfiguraciÃ³n": return renderConfiguracion();
      case "Perfil":        return renderPerfil();
      case "NÃ³mina":        return renderNomina();
      case "Promociones":   return <SeccionOfertas />;
      case "Cupones":       return <SeccionCuponesVendedor tiendaId={tiendaInfo?.id_tienda} />;
      case "Suscripciones": return <SeccionSuscripciones tiendaId={tiendaInfo?.id_tienda} onNavegar={cambiarSeccion} />;
      case "Impulsos":      return <SeccionImpulsos tiendaId={tiendaInfo?.id_tienda} onNavegar={cambiarSeccion} />;
      default:              return renderInicio();
    }
  };

  return (
    <div className="dashboard-container">
      <SellerSidebar
        userName={userName}
        userPhotoUrl={userPhotoUrl}
        activeSide={activeSide}
        setActiveSide={cambiarSeccion}
        handleLogout={handleLogout}
      />

      <button
        type="button"
        className="dashboard-tracking-shortcut"
        onClick={() => cambiarSeccion("Envios")}
        aria-label="Gestionar envÃ­os"
      >
        <IconTruck width={22} height={22} strokeWidth={2} />
        <span>EnvÃ­os</span>
      </button>

      <main className="dashboard-main">{renderContenido()}</main>

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
    </div>
  );
}

