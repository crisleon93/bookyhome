// src/pages/MiTienda.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";
import SeccionOfertas from "../components/SeccionOfertas";

/* ================= ICONOS ================= */
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
  </svg>
);
const IconBook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconCart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M10 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
  </svg>
);
const IconPackage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7" />
  </svg>
);
const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconTag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);

const formatPrecio = (valor) =>
  "$" + String(parseInt(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " COP";

const ESTADOS = [
  { value: "nuevo",             label: "Nuevo" },
  { value: "usado_buen_estado", label: "Usado — buen estado" },
  { value: "usado_regular",     label: "Usado — estado regular" },
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

function AlertaStock({ alertas, umbral }) {
  if (!alertas || alertas.length === 0) return null;
  return (
    <div style={{
      background: "#fefce8", border: "1.5px solid #fde68a", borderRadius: "10px",
      padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "12px",
    }}>
      <span style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: "2px" }}>⚠️</span>
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
              {libro.titulo} — {libro.stock === 0 ? "Sin stock" : `${libro.stock} uds`}
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
    if (!form.titulo.trim())            return setError("El título es obligatorio");
    if (!form.autor_libro.trim())       return setError("El autor es obligatorio");
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
          <button className="modal-close" onClick={onClose}>×</button>
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
          {error && <div className="form-error">⚠ {error}</div>}
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
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: "8px 0 20px" }}>
          <p style={{ color: "#444", marginBottom: "6px" }}>
            ¿Estás seguro de que quieres eliminar <strong>"{libro.titulo}"</strong>?
          </p>
          <p style={{ fontSize: "0.85rem", color: "#888" }}>Esta acción no se puede deshacer.</p>
        </div>
        {error && <div className="form-error" style={{ marginBottom: "16px" }}>⚠ {error}</div>}
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
          <button className="modal-close" onClick={onClose}>×</button>
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
        {error && <div className="form-error" style={{ margin: "12px 0" }}>⚠ {error}</div>}
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

/* ================= COMPONENTE PRINCIPAL ================= */
export default function MiTienda() {
  const navigate = useNavigate();
  const [userName,      setUserName]      = useState("");
  const [loading,       setLoading]       = useState(true);
  const [activeSide,    setActiveSide]    = useState("Inicio");
  const [libros,        setLibros]        = useState([]);
  const [loadingLibros, setLoadingLibros] = useState(false);
  const [categorias,    setCategorias]    = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loadingStats,  setLoadingStats]  = useState(false);
  const [topVendidos,   setTopVendidos]   = useState([]);
  const [loadingTop,    setLoadingTop]    = useState(false);
  const [alertasStock,  setAlertasStock]  = useState([]);
  const [stockUmbral,   setStockUmbral]   = useState(3);
  const [tiendaInfo,    setTiendaInfo]    = useState(null);
  const [tiendaForm,    setTiendaForm]    = useState({ nombre_tienda: "", direccion: "", telefono: "" });
  const [tiendaMsg,     setTiendaMsg]     = useState("");

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalStock,    setModalStock]    = useState(null);

  const statsLibros = {
    totalLibros: libros.length,
    stockTotal:  libros.reduce((acc, l) => acc + (l.stock || 0), 0),
    categorias:  [...new Set(libros.map((l) => l.nombre_categoria).filter(Boolean))].length,
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      const payload = jwtDecode(token);
      setUserName(payload.nombre || "Vendedor");
    } catch { setUserName("Vendedor"); }
    finally { setLoading(false); }
  }, [navigate]);

  const cargarLibros = () => {
    setLoadingLibros(true);
    api.get("/libros/mis-libros")
      .then((res) => setLibros(res.data))
      .catch(() => {})
      .finally(() => setLoadingLibros(false));
  };

  useEffect(() => { cargarLibros(); }, []);

  useEffect(() => {
    api.get("/libros/categorias").then((r) => setCategorias(r.data)).catch(() => {});

    setLoadingStats(true);
    api.get("/libros/stats")
      .then((r) => setStats(r.data)).catch(() => setStats(null))
      .finally(() => setLoadingStats(false));

    setLoadingTop(true);
    api.get("/libros/top-vendidos")
      .then((r) => setTopVendidos(r.data)).catch(() => setTopVendidos([]))
      .finally(() => setLoadingTop(false));

    api.get(`/libros/alertas-stock?umbral=${stockUmbral}`)
      .then((r) => setAlertasStock(r.data))
      .catch(() => setAlertasStock([]));

    api.get("/tiendas")
      .then((r) => {
        const miTienda = r.data[0];
        if (miTienda) {
          setTiendaInfo(miTienda);
          setTiendaForm({
            nombre_tienda: miTienda.nombre_tienda,
            direccion: miTienda.direccion,
            telefono: miTienda.telefono,
          });
        }
      })
      .catch(() => {});
  }, [stockUmbral]);

  const cargarAlertas = () => {
    api.get(`/libros/alertas-stock?umbral=${stockUmbral}`).then((r) => setAlertasStock(r.data)).catch(() => {});
  };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const SIDE_LINKS = [
    { name: "Inicio",         icon: <IconHome /> },
    { name: "Mis Libros",     icon: <IconBook /> },
    { name: "Publicar Libro", icon: <IconPlus />, path: "/vendedor/publicar" },
    { name: "Promociones",    icon: <IconTag /> },
    { name: "Ventas",         icon: <IconCart /> },
    { name: "Pedidos",        icon: <IconPackage /> },
    { name: "Clientes",       icon: <IconUser /> },
    { name: "Configuración",  icon: <IconSettings /> },
  ];

  if (loading) return <div style={{ padding: "2rem" }}>Cargando tienda...</div>;

  const renderInicio = () => (
    <>
      <div className="welcome-card">
        <h1>Hola, {userName.split(" ")[0]} 👋</h1>
        <p>Aquí tienes un resumen de tu tienda en BookyHome.</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: 700, color: "#555" }}>
          Avisar stock minimo
          <input
            type="number"
            min="0"
            value={stockUmbral}
            onChange={(e) => setStockUmbral(Math.max(0, Number(e.target.value)))}
            style={{ width: "76px", padding: "7px 9px", border: "1.5px solid #e0dbd4", borderRadius: "6px", fontFamily: "Montserrat, sans-serif" }}
          />
        </label>
      </div>

      <AlertaStock alertas={alertasStock} umbral={stockUmbral} />

      <div className="stats-seccion-label">Tus libros</div>
      <div className="seller-stats">
        <div className="seller-stat-card">
          <h3>Libros publicados</h3>
          <div className="seller-stat-number">{loadingLibros ? "…" : statsLibros.totalLibros}</div>
        </div>
        <div className="seller-stat-card">
          <h3>Unidades en stock</h3>
          <div className="seller-stat-number">{loadingLibros ? "…" : statsLibros.stockTotal}</div>
        </div>
        <div className="seller-stat-card">
          <h3>Categorías activas</h3>
          <div className="seller-stat-number">{loadingLibros ? "…" : statsLibros.categorias}</div>
        </div>
      </div>

      <div className="stats-seccion-label">Tus ventas</div>
      <div className="seller-stats">
        <div className="seller-stat-card seller-stat-card--ventas">
          <h3>Vendido hoy</h3>
          <div className="seller-stat-number">
            {loadingStats ? "…" : stats ? formatPrecio(stats.total_hoy) : "—"}
          </div>
          <span className="stat-sub">{stats ? `${stats.ordenes_hoy} orden(es)` : "Sin datos aún"}</span>
        </div>
        <div className="seller-stat-card seller-stat-card--ventas">
          <h3>Vendido esta semana</h3>
          <div className="seller-stat-number">
            {loadingStats ? "…" : stats ? formatPrecio(stats.total_semana) : "—"}
          </div>
        </div>
        <div className="seller-stat-card seller-stat-card--ventas">
          <h3>Vendido este mes</h3>
          <div className="seller-stat-number">
            {loadingStats ? "…" : stats ? formatPrecio(stats.total_mes) : "—"}
          </div>
          <span className="stat-sub">{stats ? `${stats.ordenes_mes} orden(es)` : "Sin datos aún"}</span>
        </div>
      </div>

      <div className="seller-books">
        <div className="seller-books-header">
          <h2 className="seller-books-title">🏆 Libros más vendidos</h2>
          <button className="btn-ver-todos" onClick={() => setActiveSide("Mis Libros")}>Ver todos →</button>
        </div>
        {loadingTop && <p style={{ color: "#999", padding: "20px 0" }}>Cargando...</p>}
        {!loadingTop && topVendidos.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📊</div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>Aún no hay ventas registradas</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>Cuando se registren ventas, aparecerán aquí los más populares</p>
          </div>
        )}
        {!loadingTop && topVendidos.map((libro, i) => (
          <div key={libro.id_libro} className="book-row">
            <div className="top-rank">#{i + 1}</div>
            <div className="book-cover-mini">
              {libro.imagenes?.[0]
                ? <img src={`http://127.0.0.1:8000${libro.imagenes[0]}`} alt={libro.titulo} />
                : <span>📖</span>}
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
        ))}
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
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📚</div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px" }}>No tienes libros publicados</p>
            <button className="btn btn-vinotinto btn-header" onClick={() => navigate("/vendedor/publicar")}>
              Publicar primer libro
            </button>
          </div>
        )}
        {!loadingLibros && libros.map((libro) => (
          <div key={libro.id_libro} className="book-row">
            <div className="book-cover-mini">
              {libro.imagenes?.[0]
                ? <img src={`http://127.0.0.1:8000${libro.imagenes[0]}`} alt={libro.titulo} />
                : <span>📖</span>}
            </div>
            <div className="book-info" style={{ flex: 1 }}>
              <h4>{libro.titulo}</h4>
              <p>{libro.autor_libro} · {libro.nombre_categoria}</p>
            </div>
            <BadgeEstado estado={libro.estado_libro} />
            <div className="book-price">{formatPrecio(libro.precio_libro)}</div>
            <div style={{
              fontSize: "0.85rem", minWidth: "70px",
              color: libro.stock === 0 ? "#b91c1c" : libro.stock <= 3 ? "#92400e" : "#777",
              fontWeight: libro.stock <= 3 ? 700 : 400,
            }}>
              Stock: <strong>{libro.stock}</strong>
              {libro.stock === 0 && <span style={{ marginLeft: "4px" }}>⚠</span>}
            </div>
            <div className="book-actions">
              <button className="btn-accion btn-stock" onClick={() => setModalStock(libro)}>Stock</button>
              <button className="btn-accion btn-editar" onClick={() => setModalEditar(libro)}>Editar</button>
              <button className="btn-accion btn-eliminar-sm" onClick={() => setModalEliminar(libro)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderConfiguracion = () => (
    <>
      <div className="welcome-card">
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px" }}>⚙️ Perfil del negocio</h1>
        <p style={{ margin: 0 }}>Información de tu tienda en BookyHome</p>
      </div>

      <div className="pl-card" style={{ padding: "2rem", marginTop: "20px" }}>
        {!tiendaInfo ? (
          <p style={{ color: "#888" }}>Cargando información de la tienda...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
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
                Dirección
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
                Teléfono
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

            {tiendaMsg && <p style={{ color: "green", fontWeight: 600 }}>{tiendaMsg}</p>}

            <button
              style={{
                background: "var(--vinotinto)", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", fontWeight: 700,
                fontSize: "0.95rem", cursor: "pointer", fontFamily: "Montserrat, sans-serif"
              }}
              onClick={() => {
                setTiendaMsg("✓ Perfil del negocio actualizado");
                setTimeout(() => setTiendaMsg(""), 3000);
              }}
            >
              Guardar cambios
            </button>
          </div>
        )}
      </div>
    </>
  );

  const renderProximamente = (nombre) => (
    <div className="welcome-card">
      <div className="empty-state" style={{ boxShadow: "none", padding: "60px 20px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🚧</div>
        <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px", fontSize: "1.1rem" }}>{nombre}</p>
        <p style={{ fontSize: "0.87rem", color: "#888" }}>Esta sección estará disponible próximamente</p>
      </div>
    </div>
  );

  const renderContenido = () => {
    switch (activeSide) {
      case "Inicio":        return renderInicio();
      case "Mis Libros":    return renderMisLibros();
      case "Ventas":        return renderProximamente("Ventas");
      case "Pedidos":       return renderProximamente("Pedidos");
      case "Clientes":      return renderProximamente("Clientes");
      case "Configuración": return renderConfiguracion();
      case "Promociones":   return <SeccionOfertas />;
      default:              return renderInicio();
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-user">
          <div className="user-avatar-big">{userName.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="user-name">{userName}</p>
            <p className="user-email">vendedor@bookyhome.com</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {SIDE_LINKS.map((item) => (
            <button key={item.name}
              onClick={() => { setActiveSide(item.name); if (item.path) navigate(item.path); }}
              className={`sidebar-item ${activeSide === item.name ? "active" : ""}`}>
              <span className="sidebar-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="sidebar-logout">Cerrar sesión</button>
      </aside>

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
