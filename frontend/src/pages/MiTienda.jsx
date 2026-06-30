// src/pages/MiTienda.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api, { getApiBaseUrl } from "../services/api";
import SeccionOfertas from "../components/SeccionOfertas";
import SellerSidebar from "../components/VendedorSidebar";
import Chat from './Chat';
import Notificaciones from './Notificaciones';
import {
  IconBook,
  IconBookOpen,
  IconChartBar,
  IconStar,
  IconSettings,
  IconCheck,
  IconLock,
  IconPackage
} from "../components/Icons";


// ========================
// Utilidades y constantes
// ========================
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
          <button className="modal-close" onClick={onClose}>×</button>
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

/* ================= COMPONENTE PRINCIPAL ================= */
export default function MiTienda() {
  // ========================
  // Estado local principal
  // ========================
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };
  const [userName,      setUserName]      = useState("");
  const [loading,       setLoading]       = useState(true);
  const [activeSide,    setActiveSide]    = useState("Inicio");
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
  const [tiendaForm,    setTiendaForm]    = useState({ nombre_tienda: "", direccion: "", telefono: "" });
  const [tiendaMsg,     setTiendaMsg]     = useState("");

  const [ventas,        setVentas]        = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [pedidos,       setPedidos]       = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

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

  // Si llegamos con un query param `seccion`, abrir esa subsección.
  const location = useLocation();
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const seccion = params.get('seccion');
      if (seccion) setActiveSide(seccion);
    } catch {
      // ignore
    }
  }, [location.search]);

  const cargarLibros = () => {
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
  };

  const cargarPedidos = () => {
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
  };

  const cargarVentas = () => {
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
  };
 
  // ========================
  // Efectos de carga inicial y actualizacion por sección
  // ========================
  useEffect(() => { cargarLibros(); }, []);

  useEffect(() => {
    if (activeSide === "Pedidos") {
      cargarPedidos();
    } else if (activeSide === "Ventas") {
      cargarVentas();
    }
  }, [activeSide]);

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

    api.get("/tiendas/mi-tienda")
      .then((r) => {
        const miTienda = r.data;
        if (miTienda && typeof miTienda === "object") {
          setTiendaInfo(miTienda);
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
  }, [stockUmbral]);

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
        <p>Aquí tienes un panorama claro de tu tienda en BookyHome.</p>
      </div>

      <div className="dashboard-top-grid">
        <div className="dashboard-card summary-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-title">Resumen</p>
              <p className="dashboard-card-subtitle">Estado general de tu tienda</p>
            </div>
            <span className="dashboard-card-tag">HISTÓRICO</span>
          </div>

          <div className="summary-pill-grid">
            <div className="summary-pill">
              <span>Total ventas (COP)</span>
              <strong>{loadingStats ? "…" : stats ? formatPrecio(stats.total_mes) : "$0 COP"}</strong>
            </div>
            <div className="summary-pill">
              <span>Libros publicados</span>
              <strong>{loadingLibros ? "…" : statsLibros.totalLibros}</strong>
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
              <strong>{loadingStats ? '…' : stats ? formatPrecio(stats.total_semana) : '$0 COP'}</strong>
            </div>
            <div className="trend-pill">
              <p>Órdenes este mes</p>
              <strong>{loadingStats ? '…' : stats ? stats.ordenes_mes : '0'}</strong>
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
              <p>Ventas en los últimos 6 días</p>
              <strong>{loadingStats ? '…' : stats ? formatPrecio(stats.total_semana) : '$0 COP'}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card notifications-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-title">Centro de notificaciones</p>
              <p className="dashboard-card-subtitle">Lo más reciente</p>
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
            <strong>{loadingLibros ? '…' : statsLibros.totalLibros}</strong>
            <div>
              <p>Libros publicados</p>
              <small>Tu catálogo activo</small>
            </div>
          </div>
          <div className="notification-item">
            <strong>{loadingTop ? '…' : topVendidos.length}</strong>
            <div>
              <p>Libros en top ventas</p>
              <small>Los más populares</small>
            </div>
          </div>
        </div>
      </div>

      <div className="inventory-alert-card">
        <div>
          <div className="inventory-alert-top">
            <p className="inventory-alert-title">Alertas de inventario</p>
            <p className="inventory-alert-copy">Recibe avisos automáticos cuando el stock de tus libros esté por debajo del umbral.</p>
          </div>
          <div className="inventory-alert-status">
            <span className={alertasStock.length > 0 ? 'inventory-status-warning' : 'inventory-status-ok'} style={{ display: 'flex', alignItems: 'center' }}>
              {alertasStock.length > 0 ? <IconLock width={20} height={20} strokeWidth={2} style={{ color: '#92400e' }} /> : <IconCheck width={20} height={20} strokeWidth={2} style={{ color: 'green' }} />}
            </span>
            <div>
              <p className="inventory-status-title">
                {alertasStock.length > 0 ? 'Hay libros por debajo del umbral' : 'Todo tu inventario está dentro del umbral'}
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
          <small className="inventory-alert-hint">Ajusta cuántas unidades quedan antes de generar una alerta.</small>
        </div>
      </div>

      <AlertaStock alertas={alertasStock} umbral={stockUmbral} />

      <div className="dashboard-card recent-books-card">
        <div className="dashboard-card-header">
          <div>
            <p className="dashboard-card-title">Últimos libros publicados</p>
            <p className="dashboard-card-subtitle">Los tres libros más recientes de tu catálogo</p>
          </div>
          <button className="btn-ver-todos" onClick={() => setActiveSide("Mis Libros")}>Ver todos →</button>
        </div>

        {loadingLibros ? (
          <p style={{ color: "#999", padding: "16px 0" }}>Cargando libros...</p>
        ) : libros.length === 0 ? (
          <div className="empty-state" style={{ padding: "30px 20px" }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "10px" }}>
              <IconBookOpen width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            </div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>No hay libros publicados aún</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>Publica tu primer libro para verlo aquí.</p>
          </div>
        ) : (
          <div className="recent-books-list">
            {libros.slice(0, 3).map((libro) => (
              <div key={libro.id_libro} className="recent-book-item">
                <div className="recent-book-left">
                  <div className="recent-book-cover">
                    {libro.imagenes?.[0] ? (
                      <img src={`${getApiBaseUrl()}${libro.imagenes[0]}`} alt={libro.titulo} />
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
            ))}
          </div>
        )}
      </div>

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
          <h2 className="seller-books-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconStar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Libros más vendidos
          </h2>
          <button className="btn-ver-todos" onClick={() => setActiveSide("Mis Libros")}>Ver todos →</button>
        </div>
        {loadingTop && <p style={{ color: "#999", padding: "20px 0" }}>Cargando...</p>}
        {!loadingTop && topVendidos.length === 0 && (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "10px" }}>
              <IconChartBar width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            </div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>Aún no hay ventas registradas</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>Cuando se registren ventas, aparecerán aquí los más populares</p>
          </div>
        )}
        {!loadingTop && topVendidos.map((libro, i) => (
          <div key={libro.id_libro} className="book-row">
            <div className="top-rank">#{i + 1}</div>
            <div className="book-cover-mini">
              {libro.imagenes?.[0]
                ? <img src={`${getApiBaseUrl()}${libro.imagenes[0]}`} alt={libro.titulo} />
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
              <IconBookOpen width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            </div>
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
                ? <img src={`${getApiBaseUrl()}${libro.imagenes[0]}`} alt={libro.titulo} />
                : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} /></span>}
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
              {libro.stock === 0 && <span style={{ marginLeft: "4px", display: 'flex', alignItems: 'center' }}><IconLock width={16} height={16} strokeWidth={2} style={{ color: '#b91c1c' }} /></span>}
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
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconSettings width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          Perfil del negocio
        </h1>
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
                if (!tiendaForm.nombre_tienda?.trim()) {
                  setTiendaMsg("El nombre de la tienda es obligatorio");
                  return;
                }
                if (tiendaForm.nombre_tienda.trim().length < 3) {
                  setTiendaMsg("El nombre debe tener al menos 3 caracteres");
                  return;
                }
                api.put("/tiendas/mi-tienda", tiendaForm)
                  .then(() => {
                    setTiendaMsg("Perfil del negocio actualizado");
                    setTimeout(() => setTiendaMsg(""), 3000);
                    setTiendaInfo(prev => ({ ...prev, ...tiendaForm }));
                  })
                  .catch((err) => {
                    console.error("Error actualizando tienda:", err);
                    setTiendaMsg("Error al guardar cambios: " + (err.response?.data?.detail || err.message));
                    setTimeout(() => setTiendaMsg(""), 4000);
                  });
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
          <IconLock width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
        </div>
        <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px", fontSize: "1.1rem" }}>{nombre}</p>
        <p style={{ fontSize: "0.87rem", color: "#888" }}>Esta sección estará disponible próximamente</p>
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
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px" }}>Aún no has recibido pedidos</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>Cuando un comprador adquiera tus libros, aparecerán aquí</p>
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
                  <th style={{ padding: "12px", fontWeight: 700, textAlign: "right" }}>Total Tienda</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id_orden} style={{ borderBottom: "1px solid #f0ebe4" }}>
                    <td style={{ padding: "12px", fontWeight: 600 }}>#{pedido.id_orden}</td>
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
                      <span className={`pl-badge pl-badge--${pedido.estado === "pagado" ? "entregado" : "procesando"}`}>
                        {pedido.estado}
                      </span>
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
    </>
  );

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
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px" }}>No hay ventas registradas aún</p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>Aquí aparecerá el desglose por libro vendido</p>
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

  const renderContenido = () => {
    switch (activeSide) {
      case "Inicio":        return renderInicio();
      case "Mensajes":      return <Chat embedded={true} selectedSalaProp={selectedSalaInChat} onSelectSala={(id) => setSelectedSalaInChat(id)} />;
      case "Notificaciones":return <Notificaciones embedded={true} onOpenReference={(notif) => {
                              if (notif.tipo === 'mensaje') {
                                setActiveSide('Mensajes');
                                setSelectedSalaInChat(notif.referencia_id);
                              } else if (notif.tipo === 'resena' || notif.tipo === 'oferta') {
                                // abrir catálogo en sección del vendedor
                                setActiveSide('Promociones');
                              }
                            }} />;
      case "Mis Libros":    return renderMisLibros();
      case "Ventas":        return renderVentas();
      case "Pedidos":       return renderPedidos();
      case "Clientes":      return renderProximamente("Clientes");
      case "Perfil":        return renderConfiguracion();
      case "Promociones":   return <SeccionOfertas />;
      default:              return renderInicio();
    }
  };

  return (
    <div className="dashboard-container">
      <SellerSidebar
        userName={userName}
        activeSide={activeSide}
        setActiveSide={setActiveSide}
        handleLogout={handleLogout}
      />

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
