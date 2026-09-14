import { useCallback, useEffect, useState } from "react";
import { crearQueja, getOrdenes, getQuejas, getApiBaseUrl, cancelarQueja, getMensajesReclamo, enviarMensajeReclamo } from "../services/api";
import { IconCheck, IconAlertTriangle, IconEye, IconBook, IconPackage, IconInfo, IconTruck, IconMessage, IconStore, IconStoreAlt } from "../components/Icons";

const MOTIVO_ICON_MAP = {
  "Libro dañado o defectuoso": <IconBook width={15} height={15} />,
  "Producto incorrecto":       <IconPackage width={15} height={15} />,
  "No coincide con la descripción": <IconInfo width={15} height={15} />,
  "Problema con la entrega":   <IconTruck width={15} height={15} />,
  "Otro":                      <IconMessage width={15} height={15} />,
};

const MOTIVOS = [
  { label: "Libro dañado o defectuoso", icon: <IconBook width={18} height={18} /> },
  { label: "Producto incorrecto",        icon: <IconPackage width={18} height={18} /> },
  { label: "No coincide con la descripción", icon: <IconInfo width={18} height={18} /> },
  { label: "Problema con la entrega",    icon: <IconTruck width={18} height={18} /> },
  { label: "Otro",                       icon: <IconMessage width={18} height={18} /> },
];

const ESTADO_CONFIG = {
  "Resuelto":      { bg: "#dcfce7", color: "#166534", border: "#86efac", dot: "#16a34a" },
  "En revisión":   { bg: "#fff7ed", color: "#9a3412", border: "#fdba74", dot: "#ea580c" },
  "Abierto":       { bg: "#eff6ff", color: "#1e40af", border: "#93c5fd", dot: "#3b82f6" },
  "Cerrado":       { bg: "#f3f4f6", color: "#374151", border: "#d1d5db", dot: "#6b7280" },
  "Rechazado":     { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5", dot: "#ef4444" },
};

const ESTADO_CONFIG_DARK = {
  "Resuelto":    { bg: "#0f2e1a", color: "#4ade80", border: "#16a34a", dot: "#4ade80" },
  "En revisión": { bg: "#2e1a08", color: "#fb923c", border: "#ea580c", dot: "#fb923c" },
  "Abierto":     { bg: "#0d1f3c", color: "#60a5fa", border: "#3b82f6", dot: "#60a5fa" },
  "Cerrado":     { bg: "#1e1e1e", color: "#9ca3af", border: "#4b5563", dot: "#9ca3af" },
  "Rechazado":   { bg: "#2e0d0d", color: "#f87171", border: "#ef4444", dot: "#f87171" },
};

function EstadoBadge({ estado, size = "medium", variant = "default", darkMode = false }) {
  const configs = darkMode ? ESTADO_CONFIG_DARK : ESTADO_CONFIG;
  const cfg = configs[estado] || configs["Cerrado"];
  
  const sizeStyles = {
    small: { padding: "4px 10px", fontSize: "0.78rem", dotSize: 5 },
    medium: { padding: "6px 14px", fontSize: "0.82rem", dotSize: 7 },
    large: { padding: "8px 18px", fontSize: "0.9rem", dotSize: 8 },
  };
  
  const variantStyles = {
    default: {
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      boxShadow: `0 2px 6px ${cfg.dot}22`,
    },
    solid: {
      background: cfg.dot,
      color: "#fff",
      border: `1.5px solid ${cfg.dot}`,
      boxShadow: `0 2px 6px ${cfg.dot}33`,
    },
    outlined: {
      background: "#fff",
      color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
  };
  
  const style = sizeStyles[size] || sizeStyles.medium;
  const varStyle = variantStyles[variant] || variantStyles.default;
  
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: style.padding, borderRadius: 20,
      fontSize: style.fontSize, fontWeight: 700, letterSpacing: "0.01em",
      whiteSpace: "nowrap",
      ...varStyle,
    }}>
      <span style={{ 
        width: style.dotSize, height: style.dotSize, 
        borderRadius: "50%", 
        background: variant === "solid" ? "#fff" : cfg.dot, 
        display: "inline-block" 
      }} />
      {estado}
    </span>
  );
}

const fieldStyle = {
  padding: "13px 16px",
  borderRadius: 10,
  border: "1.5px solid #e5e7eb",
  fontSize: "0.95rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  color: "#1a1a1a",
  background: "#fff",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export default function QuejasReclamos() {
  const [ordenes, setOrdenes] = useState([]);
  const [quejas, setQuejas] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState("");
  const [motivo, setMotivo] = useState("");
  const [motivoOtro, setMotivoOtro] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [evidencia, setEvidencia] = useState(null);
  const [evidenciaPreview, setEvidenciaPreview] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [vistaEvidencia, setVistaEvidencia] = useState(null);
  const [modalDetalles, setModalDetalles] = useState(null);
  const [vistaPrincipal, setVistaPrincipal] = useState("nueva"); // "nueva" o "historial"
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [paginaReclamos, setPaginaReclamos] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(5);
  const [cancelando, setCancelando] = useState(null);
  const [mensajesChat, setMensajesChat] = useState({});      // { id_solicitud: [] }
  const [mensajeChatInput, setMensajeChatInput] = useState({}); // { id_solicitud: "" }
  const [enviandoMensaje, setEnviandoMensaje] = useState(null);
  const [chatAbierto, setChatAbierto] = useState(null);      // id_solicitud activo
  const [tarjetaColapsada, setTarjetaColapsada] = useState({}); // { id_solicitud: boolean }

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener('darkModeChange', handler); window.removeEventListener('storage', handler); };
  }, []);

  // Paleta de colores según modo
  const t = {
    cardBg:            darkMode ? '#1e1e1e' : '#fff',
    subCardBg:         darkMode ? '#303030' : '#fafafa',
    subCardBorder:     darkMode ? '1px solid #3a3a3a' : '1px solid #e5e7eb',
    subCardVinoBg:     darkMode ? '#2a2a2a' : '#fdf8f9',
    subCardVinoBorder: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4',
    inputBg:           darkMode ? '#2a2a2a' : '#fff',
    inputBorder:       darkMode ? '#3a3a3a' : '#e5e7eb',
    inputColor:        darkMode ? '#ececec' : '#1a1a1a',
    textPrimary:       darkMode ? '#ececec' : '#111',
    textSecondary:     darkMode ? '#c8c8c8' : '#374151',
    textMuted:         darkMode ? '#999' : '#6b7280',
    tabsBg:            darkMode ? '#2a2a2a' : '#f3f4f6',
    tabActiveBg:       darkMode ? '#3a3a3a' : '#fff',
    tabActiveColor:    darkMode ? '#e05a7a' : '#7A1E3A',
    tabInactiveColor:  darkMode ? '#aaa' : '#6b7280',
    divider:           darkMode ? '#333' : '#f0f0f0',
    catBtnBg:          darkMode ? '#2a2a2a' : '#fff',
    catBtnBorder:      darkMode ? '#3a3a3a' : '#e5e7eb',
    catBtnIconBg:      darkMode ? '#2a2a2a' : '#f7e9ee',
    ticketCardBg:      darkMode ? '#252525' : '#fff',
    ticketHeaderBg:    darkMode ? '#2a2a2a' : '#fdf8f9',
    ticketHeaderBorder:darkMode ? '#383838' : '#f0e8ec',
    paginaBtnBg:       darkMode ? '#2a2a2a' : '#fff',
    paginaBtnBorder:   darkMode ? '#3a3a3a' : '#e5e7eb',
    paginaBtnColor:    darkMode ? '#c8c8c8' : '#374151',
    selectBg:          darkMode ? '#2a2a2a' : '#fff',
    vinoLabel:         darkMode ? '#e05a7a' : '#7A1E3A',
    tiendaBg:          darkMode ? '#0d1f3c' : '#f0f9ff',
    tiendaBorder:      darkMode ? '#1e3a5f' : '#bae6fd',
    tiendaColor:       darkMode ? '#60a5fa' : '#0369a1',
    motivoBg:          darkMode ? '#2a2a2a' : '#fdf2f4',
    motivoBorder:      darkMode ? '#444' : '#f0dde4',
    motivoColor:       darkMode ? '#e05a7a' : '#7A1E3A',
    cancelBtnBg:       darkMode ? '#2a1010' : '#fff',
    cancelBtnBorder:   darkMode ? '#7f2020' : '#fca5a5',
    cancelBtnColor:    darkMode ? '#f87171' : '#dc2626',
    chatBg:            darkMode ? '#1a1a1a' : '#fafafa',
    chatInputBg:       darkMode ? '#2a2a2a' : '#fafafa',
    chatInputBorder:   darkMode ? '#3a3a3a' : '#e5e7eb',
    chatMsgAdminBg:    darkMode ? '#0d1f3c' : '#e0f2fe',
    chatMsgAdminBorder:darkMode ? '#1e3a5f' : '#bae6fd',
    chatMsgAdminColor: darkMode ? '#60a5fa' : '#1a1a1a',
    modalBg:           darkMode ? '#1e1e1e' : '#fff',
    modalItemBg:       darkMode ? '#2a2a2a' : '#fafafa',
    modalItemBorder:   darkMode ? '#3a3a3a' : '#f0f0f0',
    modalDivider:      darkMode ? '#333' : '#f0f0f0',
    emptyBg:           darkMode ? '#252525' : '#fafafa',
    emptyBorder:       darkMode ? '#3a3a3a' : '#e5e7eb',
  };

  const EC = darkMode ? ESTADO_CONFIG_DARK : ESTADO_CONFIG;

  function tiempoTranscurrido(fechaStr) {
    if (!fechaStr) return null;
    const diff = Date.now() - new Date(fechaStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  }

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [ordenesRes, quejasRes] = await Promise.all([getOrdenes(), getQuejas()]);
      const solicitudes = quejasRes.data || [];
      const ordenesConSolicitudActiva = new Set(solicitudes
        .filter((item) => ["Abierto", "En revisión"].includes(item.estado))
        .map((item) => Number(item.id_orden)));
      setOrdenes((ordenesRes.data || []).filter((orden) =>
        orden.estado === "pagado" && !ordenesConSolicitudActiva.has(Number(orden.id_orden))
      ));
      setQuejas(solicitudes);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudieron cargar tus compras y reclamos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleEvidencia = (e) => {
    const file = e.target.files?.[0] || null;
    setEvidencia(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEvidenciaPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setEvidenciaPreview(null);
    }
  };

  const enviar = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");
    if (!ordenSeleccionada || !motivo) {
      setError("Selecciona una compra y un motivo.");
      return;
    }
    if (motivo === "Otro" && !motivoOtro.trim()) {
      setError("Por favor especifica el motivo del reclamo.");
      return;
    }
    const finalMotivo = motivo === "Otro" ? motivoOtro.trim() : motivo;
    const data = new FormData();
    data.append("id_orden", ordenSeleccionada);
    data.append("motivo", finalMotivo);
    data.append("descripcion", descripcion.trim() || finalMotivo);
    if (evidencia) data.append("evidencia", evidencia);
    setEnviando(true);
    try {
      await crearQueja(data);
      setOrdenSeleccionada("");
      setMotivo("");
      setMotivoOtro("");
      setDescripcion("");
      setEvidencia(null);
      setEvidenciaPreview(null);
      setMensaje("Solicitud enviada. El administrador revisara tu caso.");
      await cargar();
      setVistaPrincipal("historial"); // Cambiar a la vista de historial
      window.dispatchEvent(new Event("bookyhome-complaint-updated"));
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  const ordenInfo = ordenes.find(o => String(o.id_orden) === String(ordenSeleccionada));

  const reclamosFiltrados = quejas.filter(q => filtroEstado === "Todos" || q.estado === filtroEstado);
  const totalPaginasReclamos = Math.max(1, Math.ceil(reclamosFiltrados.length / itemsPorPagina));
  const paginaActualReclamos = Math.min(paginaReclamos, totalPaginasReclamos);
  const reclamosVisibles = reclamosFiltrados.slice((paginaActualReclamos - 1) * itemsPorPagina, paginaActualReclamos * itemsPorPagina);

  const getOrdenTienda = (orden) => {
    return orden?.nombre_tienda || orden?.items?.[0]?.nombre_tienda || "BookyHome";
  };

  const abrirChat = async (id_solicitud) => {
    if (chatAbierto === id_solicitud) { setChatAbierto(null); return; }
    setChatAbierto(id_solicitud);
    if (!mensajesChat[id_solicitud]) {
      try {
        const res = await getMensajesReclamo(id_solicitud);
        setMensajesChat(prev => ({ ...prev, [id_solicitud]: res.data || [] }));
      } catch { setMensajesChat(prev => ({ ...prev, [id_solicitud]: [] })); }
    }
  };

  const handleEnviarMensaje = async (id_solicitud) => {
    const texto = (mensajeChatInput[id_solicitud] || "").trim();
    if (!texto) return;
    setEnviandoMensaje(id_solicitud);
    try {
      await enviarMensajeReclamo(id_solicitud, texto);
      setMensajeChatInput(prev => ({ ...prev, [id_solicitud]: "" }));
      const res = await getMensajesReclamo(id_solicitud);
      setMensajesChat(prev => ({ ...prev, [id_solicitud]: res.data || [] }));
    } catch { /* silencioso */ }
    finally { setEnviandoMensaje(null); }
  };

  return (
    <div style={{ width: "100%", margin: 0, padding: "0 0 2.5rem", background: t.bg }}>

      {/* HERO HEADER */}
      <section style={{
        padding: "2rem",
        marginBottom: 24,
        borderRadius: 20,
        background: "linear-gradient(135deg, #7A1E3A 0%, #8e2640 100%)",
        boxShadow: "0 8px 32px rgba(122,30,58,0.2)",
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <span style={{
          width: 64, height: 64, borderRadius: 18,
          background: "rgba(255,255,255,0.15)",
          display: "grid", placeItems: "center", flexShrink: 0,
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          <IconAlertTriangle width={32} height={32} strokeWidth={1.5} style={{ color: "#fff" }} />
        </span>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.7rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            Quejas y reclamos
          </h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            {vistaPrincipal === "nueva" 
              ? "Reporta un problema de una compra pagada y adjunta evidencia si la tienes."
              : "Consulta el estado de tus solicitudes anteriores."}
          </p>
        </div>
      </section>

      {/* TABS DE NAVEGACIÓN */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 4, background: t.tabsBg, padding: 4, borderRadius: 12 }}>
          <button type="button" onClick={() => setVistaPrincipal("nueva")} style={{
            flex: 1, padding: "12px 20px", border: "none",
            background: vistaPrincipal === "nueva" ? t.tabActiveBg : "transparent",
            color: vistaPrincipal === "nueva" ? t.tabActiveColor : t.tabInactiveColor,
            fontSize: "0.95rem", fontWeight: vistaPrincipal === "nueva" ? 700 : 500,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", borderRadius: 8,
            boxShadow: vistaPrincipal === "nueva" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          }}>Nueva queja o reclamo</button>
          <button type="button" onClick={() => setVistaPrincipal("historial")} style={{
            flex: 1, padding: "12px 20px", border: "none",
            background: vistaPrincipal === "historial" ? t.tabActiveBg : "transparent",
            color: vistaPrincipal === "historial" ? t.tabActiveColor : t.tabInactiveColor,
            fontSize: "0.95rem", fontWeight: vistaPrincipal === "historial" ? 700 : 500,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", borderRadius: 8,
            boxShadow: vistaPrincipal === "historial" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
          }}>Mis quejas y reclamos</button>
        </div>
      </div>

      {/* ALERTAS */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b",
          borderRadius: 12, padding: "14px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12, fontSize: "0.92rem",
          boxShadow: "0 2px 8px rgba(220,38,38,0.08)",
        }}>
          <IconAlertTriangle width={20} height={20} /> {error}
        </div>
      )}
      {mensaje && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #86efac", color: "#166534",
          borderRadius: 12, padding: "14px 20px", marginBottom: 20,
          display: "flex", gap: 12, alignItems: "center", fontSize: "0.92rem",
          boxShadow: "0 2px 8px rgba(22,163,74,0.08)",
        }}>
          <IconCheck width={20} /> {mensaje}
        </div>
      )}

      {/* FORMULARIO - Solo muestra cuando vistaPrincipal es "nueva" */}
      {vistaPrincipal === "nueva" && (
      <form onSubmit={enviar} className="pl-card" style={{
        padding: "1.5rem", borderRadius: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        background: t.cardBg,
      }}>
        {cargando ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: t.textMuted }}>
            <div style={{ fontSize: "1.2rem", marginBottom: 8 }}>...</div>
            Cargando compras...
          </div>
        ) : ordenes.length === 0 ? (
          <div style={{
            padding: "32px 20px", textAlign: "center",
            background: t.emptyBg, borderRadius: 10, border: `1.5px dashed ${t.emptyBorder}`,
          }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>📦</div>
            <p style={{ margin: 0, color: t.textMuted, fontSize: "0.85rem", fontWeight: 500 }}>
              No hay compras disponibles
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {/* Grupo: Selección de compra */}
            <div style={{ display: "grid", gap: 12, padding: "12px", background: t.subCardVinoBg, borderRadius: 8, border: t.subCardVinoBorder }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "1rem" }}>📦</span>
                <strong style={{ color: t.vinoLabel, fontSize: "0.8rem" }}>Selecciona tu compra</strong>
              </div>
              <select
                value={ordenSeleccionada}
                onChange={(e) => setOrdenSeleccionada(e.target.value)}
                style={{
                  ...fieldStyle,
                  padding: "10px 12px", fontSize: "0.85rem",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237A1E3A' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "14px",
                  paddingRight: "32px", cursor: "pointer",
                  background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.inputColor,
                }}
              >
                <option value="">Selecciona una compra...</option>
                {ordenes.map((orden) => {
                  const tienda = getOrdenTienda(orden);
                  const item0 = orden.items?.[0] || {};
                  const fechaStr = orden.fecha_orden
                    ? new Date(orden.fecha_orden).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
                    : (orden.fecha ? new Date(orden.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—");
                  return (
                    <option key={orden.id_orden} value={orden.id_orden}>
                      #{orden.id_orden} · {item0.titulo || item0.nombre_libro || "Varios"} · {tienda} · ${Number(orden.total || 0).toLocaleString("es-CO")} · {fechaStr}
                    </option>
                  );
                })}
              </select>
              {ordenSeleccionada && (
                <button type="button" onClick={() => setModalDetalles(ordenInfo)} style={{
                  padding: "6px 10px", fontSize: "0.75rem",
                  border: `1px solid ${t.inputBorder}`,
                  background: t.catBtnBg, color: t.vinoLabel,
                  borderRadius: 6, cursor: "pointer", fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = t.subCardVinoBg; e.currentTarget.style.borderColor = "#7A1E3A"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = t.catBtnBg; e.currentTarget.style.borderColor = t.inputBorder; }}
                >Ver detalles</button>
              )}
            </div>

            {/* Grupo: Motivo y detalles */}
            <div style={{ display: "grid", gap: 12, padding: "12px", background: t.subCardBg, borderRadius: 8, border: t.subCardBorder }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "1rem" }}>📝</span>
                <strong style={{ color: t.textSecondary, fontSize: "0.8rem" }}>Describe el problema</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                {MOTIVOS.map((m) => {
                  const activo = motivo === m.label;
                  return (
                    <button key={m.label} type="button" onClick={() => setMotivo(activo ? "" : m.label)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6,
                      border: activo ? "2px solid #7A1E3A" : `1px solid ${t.catBtnBorder}`,
                      background: activo ? (darkMode ? "#3a1a24" : "#fdf8f9") : t.catBtnBg,
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      boxShadow: activo ? "0 0 0 2px rgba(122,30,58,0.08)" : "none",
                      transition: "all 0.15s",
                    }}
                      onMouseEnter={e => { if (!activo) { e.currentTarget.style.borderColor = "#c0587a"; e.currentTarget.style.background = darkMode ? "#2d1520" : "#fdf8f9"; } }}
                      onMouseLeave={e => { if (!activo) { e.currentTarget.style.borderColor = t.catBtnBorder; e.currentTarget.style.background = t.catBtnBg; } }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                        background: activo ? "#7A1E3A" : t.catBtnIconBg,
                        color: activo ? "#fff" : "#e05a7a",
                        display: "grid", placeItems: "center", fontSize: "0.9rem",
                        transition: "background 0.15s, color 0.15s",
                      }}>{m.icon}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: activo ? 700 : 500, color: activo ? (darkMode ? "#e05a7a" : "#7A1E3A") : t.textSecondary, lineHeight: 1.2 }}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {motivo === "Otro" && (
                <input type="text" value={motivoOtro} onChange={(e) => setMotivoOtro(e.target.value)}
                  placeholder="Especifica el motivo..."
                  style={{ ...fieldStyle, padding: "10px 12px", fontSize: "0.85rem", background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.inputColor }}
                  onFocus={e => { e.target.style.borderColor = "#7A1E3A"; e.target.style.boxShadow = "0 0 0 2px rgba(122,30,58,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none"; }}
                />
              )}

              <div style={{ display: "grid", gap: 8 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.75rem", color: t.textSecondary, marginBottom: 4 }}>
                  Evidencia <span style={{ color: t.textMuted, fontWeight: 400 }}>(opcional)</span>
                </label>
                <label style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", border: `1.5px dashed ${darkMode ? "#4a4a4a" : "#d1d5db"}`,
                  borderRadius: 6, cursor: "pointer", background: t.inputBg, transition: "border-color 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#7A1E3A"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = darkMode ? "#4a4a4a" : "#d1d5db"}
                >
                  <span style={{ background: t.catBtnIconBg, color: t.vinoLabel, borderRadius: 4, padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0 }}>
                    Elegir
                  </span>
                  <span style={{ fontSize: "0.8rem", color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {evidencia ? evidencia.name : "Sin archivo"}
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEvidencia} style={{ display: "none" }} />
                </label>
                {evidenciaPreview && (
                  <img src={evidenciaPreview} alt="Vista previa" style={{ maxHeight: 80, borderRadius: 6, border: `1px solid ${t.inputBorder}` }} />
                )}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.75rem", color: t.textSecondary, marginBottom: 4 }}>
                  Descripción <span style={{ color: t.textMuted, fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  rows={3} placeholder="Describe el problema..."
                  style={{ ...fieldStyle, padding: "10px 12px", fontSize: "0.85rem", lineHeight: 1.4, resize: "vertical", background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.inputColor }}
                  onFocus={e => { e.target.style.borderColor = "#7A1E3A"; e.target.style.boxShadow = "0 0 0 2px rgba(122,30,58,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 48 }}>
              <button disabled={enviando} className="btn btn-vinotinto"
                style={{ padding: "10px 24px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 2px 8px rgba(122,30,58,0.2)", opacity: enviando ? 0.7 : 1, transition: "all 0.2s" }}>
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </form>
      )}

      {/* MIS QUEJAS - Solo muestra cuando vistaPrincipal es "historial" */}
      {vistaPrincipal === "historial" && (
      <section className="pl-card" style={{ padding: "1.5rem", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", background: t.cardBg }}>
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${t.divider}` }}>
          {quejas.length > 0 && (() => {
            const counts = quejas.reduce((acc, q) => { const k = q.estado || "Otro"; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
            return (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["Todos", "Abierto", "En revisión", "Resuelto", "Rechazado"].map(f => {
                  const activo = filtroEstado === f;
                  const cfg = f === "Todos"
                    ? { dot: darkMode ? "#e05a7a" : "#7A1E3A", color: darkMode ? "#e05a7a" : "#7A1E3A", bg: darkMode ? "#3a1a24" : "#fdf2f4", border: darkMode ? "#e05a7a" : "#7A1E3A" }
                    : (EC[f] || EC["Cerrado"]);
                  const count = f === "Todos" ? quejas.length : (counts[f] || 0);
                  return (
                    <button key={f} type="button" onClick={() => { setFiltroEstado(f); setPaginaReclamos(1); }} style={{
                      padding: "4px 12px", border: "none",
                      background: activo ? cfg.dot : "transparent",
                      color: activo ? "#fff" : cfg.color,
                      fontSize: "0.85rem", fontWeight: activo ? 600 : 400, cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s", borderRadius: 4,
                    }}
                      onMouseEnter={e => { if (!activo) e.currentTarget.style.background = cfg.bg; }}
                      onMouseLeave={e => { if (!activo) e.currentTarget.style.background = "transparent"; }}
                    >
                      {f} {count > 0 && <span style={{ opacity: 0.7, marginLeft: 2 }}>({count})</span>}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {quejas.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>📦</div>
            <p style={{ color: t.textMuted, fontSize: "0.85rem", margin: 0 }}>No hay solicitudes</p>
          </div>
        ) : reclamosFiltrados.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <p style={{ color: t.textMuted, fontSize: "0.85rem", margin: 0 }}>No hay solicitudes con este estado</p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gap: 16 }}>
              {reclamosVisibles.map((queja) => {
                const STEPS = ["Abierto", "En revisión", "Resuelto"];
                const stepIdx = STEPS.indexOf(queja.estado);
                const progreso = stepIdx === -1 ? (queja.estado === "Rechazado" ? -1 : 0) : stepIdx;
                const fecha = queja.fecha_solicitud || queja.fecha_creacion || queja.created_at;
                const fechaStr = fecha ? new Date(fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : null;
                const tiempoStr = tiempoTranscurrido(fecha);
                const motivoIcon = MOTIVO_ICON_MAP[queja.asunto] || MOTIVO_ICON_MAP["Otro"];
                const tienda = queja.nombre_tienda || queja.tienda || null;
                const imgSrc = queja.imagen_libro
                  ? (queja.imagen_libro.startsWith("http") ? queja.imagen_libro : `${getApiBaseUrl()}${queja.imagen_libro}`)
                  : null;
                const estadoCfg = EC[queja.estado] || EC["Cerrado"];
                return (
                <article key={queja.id_solicitud} style={{
                  borderRadius: 16,
                  border: `1px solid ${estadoCfg.border}33`,
                  borderLeft: `4px solid ${estadoCfg.dot}`,
                  overflow: "hidden",
                  background: t.ticketCardBg,
                  boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease", position: "relative",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = darkMode ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = darkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                {/* Header de la card */}
                <div style={{
                  background: t.ticketHeaderBg,
                  padding: tarjetaColapsada[queja.id_solicitud] ? "10px 16px" : "12px 16px",
                  borderBottom: tarjetaColapsada[queja.id_solicitud] ? "none" : `1px solid ${t.ticketHeaderBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer",
                }}
                  onClick={() => setTarjetaColapsada(prev => ({ ...prev, [queja.id_solicitud]: !prev[queja.id_solicitud] }))}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    {imgSrc ? (
                      <img src={imgSrc} alt="libro" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: `2px solid ${darkMode ? "#3a3a3a" : "#fff"}`, boxShadow: "0 2px 8px rgba(122,30,58,0.15)" }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0, background: "#7A1E3A", color: "#fff", display: "grid", placeItems: "center", fontSize: "0.7rem", fontWeight: 800, boxShadow: "0 2px 8px rgba(122,30,58,0.2)" }}>
                        #{queja.numero || queja.id_solicitud}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                        <span style={{ background: "#7A1E3A", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                          #{queja.numero || queja.id_solicitud}
                        </span>
                        {queja.id_orden && (
                          <span style={{ fontSize: "0.7rem", color: t.vinoLabel, fontWeight: 600, whiteSpace: "nowrap" }}>
                            · #{queja.id_orden}
                          </span>
                        )}
                      </div>
                      <strong style={{ fontSize: "0.9rem", color: t.textPrimary, fontWeight: 800, display: "block", lineHeight: 1.2 }}>
                        {queja.titulo_libro || "Libro"}
                        {queja.total_items > 1 ? <span style={{ fontWeight: 600, color: t.textMuted, fontSize: "0.75rem" }}> +{queja.total_items - 1} más</span> : null}
                      </strong>
                      {tarjetaColapsada[queja.id_solicitud] && (
                        <div style={{ fontSize: "0.7rem", color: t.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ display: "flex", transform: "scale(0.8)" }}>{motivoIcon}</span>
                          {queja.asunto}
                          {tiempoStr && <span style={{ color: t.textMuted, marginLeft: 4 }}>· {tiempoStr}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <EstadoBadge estado={queja.estado} size="small" variant="solid" darkMode={darkMode} />
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setTarjetaColapsada(prev => ({ ...prev, [queja.id_solicitud]: !prev[queja.id_solicitud] })); }}
                      style={{ background: "transparent", border: "none", color: t.vinoLabel, cursor: "pointer", padding: 2, borderRadius: 4, transition: "transform 0.2s", transform: tarjetaColapsada[queja.id_solicitud] ? "rotate(-90deg)" : "rotate(0deg)" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                  </div>
                </div>

                {/* Cuerpo */}
                {!tarjetaColapsada[queja.id_solicitud] && (
                  <div style={{ padding: "12px 16px", display: "grid", gap: 10 }}>

                  {/* Barra de progreso */}
                  {queja.estado !== "Rechazado" && queja.estado !== "Cerrado" && (
                    <div style={{ padding: "8px 12px", background: t.subCardBg, borderRadius: 6, border: t.subCardBorder, width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        {["Abierto", "En revisión", "Resuelto"].map((step, i) => {
                          const done = progreso >= i;
                          const current = progreso === i;
                          return (
                            <div key={step} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", background: done ? estadoCfg.dot : (darkMode ? "#444" : "#e5e7eb"), border: current ? `2px solid ${estadoCfg.dot}` : "none", display: "grid", placeItems: "center", transition: "all 0.3s", flexShrink: 0 }}>
                                {done && <span style={{ color: "#fff", fontSize: "0.55rem", fontWeight: 900 }}>✓</span>}
                              </div>
                              <span style={{ fontSize: "0.7rem", color: done ? estadoCfg.color : t.textMuted, fontWeight: done ? 600 : 400 }}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: darkMode ? "#444" : "#e5e7eb", position: "relative" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 2, background: estadoCfg.dot, boxShadow: `0 0 4px ${estadoCfg.dot}66`, width: progreso === 0 ? "0%" : progreso === 1 ? "50%" : "100%", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: "0.75rem" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: t.motivoBg, border: `1px solid ${t.motivoBorder}`, borderRadius: 4, padding: "3px 8px", color: t.motivoColor, fontSize: "0.7rem", fontWeight: 600 }}>
                      <span style={{ display: "flex", transform: "scale(0.8)" }}>{motivoIcon}</span>
                      {queja.asunto}
                    </div>
                    {tienda && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: t.tiendaBg, border: `1px solid ${t.tiendaBorder}`, borderRadius: 4, padding: "3px 8px", color: t.tiendaColor, fontSize: "0.7rem", fontWeight: 600 }}>
                        <IconStoreAlt width={12} height={12} strokeWidth={1.5} />
                        {tienda}
                      </div>
                    )}
                    {fechaStr && <span style={{ color: t.textMuted, fontSize: "0.7rem" }}>{fechaStr}</span>}
                    {tiempoStr && <span style={{ color: t.textMuted, fontSize: "0.65rem", marginLeft: "auto" }}>{tiempoStr}</span>}
                  </div>

                  {/* Descripción */}
                  {queja.descripcion && (
                    <div style={{ padding: "8px 10px", background: t.subCardBg, borderRadius: 6, border: t.subCardBorder }}>
                      <p style={{ margin: 0, color: t.textSecondary, lineHeight: 1.4, fontSize: "0.85rem" }}>{queja.descripcion}</p>
                    </div>
                  )}

                  {/* Evidencia */}
                  {queja.evidencia_url && (
                    <button type="button" onClick={() => setVistaEvidencia(`${getApiBaseUrl()}${queja.evidencia_url}`)} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      border: `1px solid ${t.motivoBorder}`, background: t.motivoBg,
                      padding: "4px 10px", color: t.vinoLabel, cursor: "pointer",
                      fontWeight: 600, fontSize: "0.7rem", borderRadius: 4, fontFamily: "inherit", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#7A1E3A"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = t.motivoBorder; }}
                    >
                      <IconEye width={12} height={12} strokeWidth={2} /> Ver evidencia
                    </button>
                  )}

                  {/* Respuesta del admin */}
                  {queja.respuesta && queja.respuesta !== "Cancelado por el usuario" && (
                    <div style={{ padding: "8px 10px", background: t.subCardVinoBg, borderRadius: 6, borderLeft: "2px solid #7A1E3A" }}>
                      <p style={{ margin: 0, color: t.textSecondary, lineHeight: 1.4, fontSize: "0.8rem" }}>
                        <span style={{ color: t.vinoLabel, fontWeight: 700, fontSize: "0.7rem" }}>Admin: </span>
                        {queja.respuesta}
                      </p>
                    </div>
                  )}

                  {/* Chat */}
                  {queja.estado !== "Cerrado" && queja.estado !== "Resuelto" && queja.estado !== "Rechazado" && (
                    <div>
                      <button type="button" onClick={() => abrirChat(queja.id_solicitud)} style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        border: `1px solid ${darkMode ? "#3a3a3a" : "#e0dbd4"}`,
                        background: chatAbierto === queja.id_solicitud ? t.subCardVinoBg : t.catBtnBg,
                        padding: "6px 10px", color: t.vinoLabel, cursor: "pointer",
                        fontWeight: 600, fontSize: "0.7rem", borderRadius: 6, fontFamily: "inherit", transition: "all 0.2s",
                      }}>
                        <IconMessage width={12} height={12} />
                        {chatAbierto === queja.id_solicitud ? "Ocultar chat" : "Chat"}
                      </button>

                      {chatAbierto === queja.id_solicitud && (
                        <div style={{ marginTop: 10, border: `1px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}`, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                          <div style={{ padding: "8px 12px", background: "#7A1E3A", display: "flex", alignItems: "center", gap: 6 }}>
                            <IconMessage width={14} height={14} style={{ color: "#fff" }} />
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.75rem" }}>Chat · #{queja.id_solicitud}</span>
                          </div>
                          <div style={{ maxHeight: 280, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8, background: t.chatBg }}>
                            {!mensajesChat[queja.id_solicitud] ? (
                              <p style={{ color: t.textMuted, fontSize: "0.75rem", textAlign: "center", margin: "16px 0" }}>Cargando...</p>
                            ) : mensajesChat[queja.id_solicitud].length === 0 ? (
                              <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <p style={{ color: t.textMuted, fontSize: "0.75rem", margin: 0 }}>Sin mensajes aún</p>
                              </div>
                            ) : (
                              mensajesChat[queja.id_solicitud].map((m, i) => {
                                const esComprador = m.rol === "usuario" || m.rol === "comprador";
                                const esAdmin = m.rol === "admin" || m.rol === "administrador";
                                const hora = m.creado_en ? new Date(m.creado_en).toLocaleString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "";
                                return (
                                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: esComprador ? "flex-end" : "flex-start", gap: 2 }}>
                                    <div style={{
                                      maxWidth: "80%", padding: "8px 12px", borderRadius: 12,
                                      background: esComprador ? "#7A1E3A" : esAdmin ? t.chatMsgAdminBg : t.subCardBg,
                                      color: esComprador ? "#fff" : esAdmin ? t.chatMsgAdminColor : t.textSecondary,
                                      fontSize: "0.8rem", lineHeight: 1.4,
                                      border: esAdmin ? `1px solid ${t.chatMsgAdminBorder}` : esComprador ? "none" : t.subCardBorder,
                                    }}>
                                      <p style={{ margin: 0 }}>{m.mensaje}</p>
                                    </div>
                                    {hora && <span style={{ fontSize: "0.65rem", color: t.textMuted }}>{hora}</span>}
                                  </div>
                                );
                              })
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderTop: `1px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}`, background: t.chatInputBg, alignItems: "center" }}>
                            <input
                              value={mensajeChatInput[queja.id_solicitud] || ""}
                              onChange={e => setMensajeChatInput(prev => ({ ...prev, [queja.id_solicitud]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviarMensaje(queja.id_solicitud); } }}
                              placeholder="Escribe..."
                              style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${t.chatInputBorder}`, fontSize: "0.8rem", fontFamily: "inherit", outline: "none", background: t.inputBg, color: t.inputColor, transition: "border-color 0.2s" }}
                              onFocus={e => e.target.style.borderColor = "#7A1E3A"}
                              onBlur={e => e.target.style.borderColor = t.chatInputBorder}
                            />
                            <button onClick={() => handleEnviarMensaje(queja.id_solicitud)}
                              disabled={enviandoMensaje === queja.id_solicitud || !mensajeChatInput[queja.id_solicitud]?.trim()}
                              style={{
                                padding: "6px 12px", background: (enviandoMensaje === queja.id_solicitud || !mensajeChatInput[queja.id_solicitud]?.trim()) ? (darkMode ? "#3a2a2e" : "#d1c0c5") : "#7A1E3A",
                                color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: "0.75rem",
                                cursor: (enviandoMensaje === queja.id_solicitud || !mensajeChatInput[queja.id_solicitud]?.trim()) ? "not-allowed" : "pointer",
                                fontFamily: "inherit", transition: "background 0.2s", whiteSpace: "nowrap",
                              }}>
                              {enviandoMensaje === queja.id_solicitud ? "..." : "→"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancelar */}
                  {queja.estado === "Abierto" && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="button" disabled={cancelando === queja.id_solicitud}
                        onClick={async () => {
                          if (!window.confirm("¿Seguro que quieres cancelar este reclamo? Esta acción no se puede deshacer.")) return;
                          setCancelando(queja.id_solicitud);
                          try { await cancelarQueja(queja.id_solicitud); await cargar(); }
                          catch (err) { alert(err.response?.data?.detail || "No se pudo cancelar."); }
                          finally { setCancelando(null); }
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          border: `1px solid ${t.cancelBtnBorder}`, background: t.cancelBtnBg,
                          padding: "6px 12px", color: t.cancelBtnColor,
                          cursor: cancelando === queja.id_solicitud ? "not-allowed" : "pointer",
                          fontWeight: 600, fontSize: "0.75rem", borderRadius: 6,
                          fontFamily: "inherit", transition: "all 0.2s",
                          opacity: cancelando === queja.id_solicitud ? 0.6 : 1,
                        }}
                        onMouseEnter={e => { if (cancelando !== queja.id_solicitud) { e.currentTarget.style.background = darkMode ? "#3a1010" : "#fef2f2"; e.currentTarget.style.borderColor = t.cancelBtnColor; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = t.cancelBtnBg; e.currentTarget.style.borderColor = t.cancelBtnBorder; }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        {cancelando === queja.id_solicitud ? "Cancelando..." : "Cancelar"}
                      </button>
                    </div>
                  )}

                </div>
                )}
              </article>
              );
            })}
          </div>

          {reclamosFiltrados.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${t.divider}`, flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: "0.75rem", color: t.textMuted, fontWeight: 500 }}>
                {(paginaActualReclamos - 1) * itemsPorPagina + 1}-{Math.min(paginaActualReclamos * itemsPorPagina, reclamosFiltrados.length)} de {reclamosFiltrados.length}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button type="button" disabled={paginaActualReclamos === 1} onClick={() => setPaginaReclamos(paginaActualReclamos - 1)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${t.paginaBtnBorder}`, background: t.paginaBtnBg, color: paginaActualReclamos === 1 ? t.textMuted : t.paginaBtnColor, fontSize: "0.75rem", fontWeight: 600, cursor: paginaActualReclamos === 1 ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.18s" }}>‹</button>
                {(() => {
                  const maxVisible = 5;
                  let startPage = Math.max(1, paginaActualReclamos - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPaginasReclamos, startPage + maxVisible - 1);
                  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
                  const pages = [];
                  for (let i = startPage; i <= endPage; i++) pages.push(i);
                  return pages.map((page) => (
                    <button key={page} type="button" onClick={() => setPaginaReclamos(page)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid", borderColor: paginaActualReclamos === page ? "#7A1E3A" : t.paginaBtnBorder, background: paginaActualReclamos === page ? "#7A1E3A" : t.paginaBtnBg, color: paginaActualReclamos === page ? "#fff" : t.paginaBtnColor, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}>{page}</button>
                  ));
                })()}
                <button type="button" disabled={paginaActualReclamos === totalPaginasReclamos} onClick={() => setPaginaReclamos(paginaActualReclamos + 1)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${t.paginaBtnBorder}`, background: t.paginaBtnBg, color: paginaActualReclamos === totalPaginasReclamos ? t.textMuted : t.paginaBtnColor, fontSize: "0.75rem", fontWeight: 600, cursor: paginaActualReclamos === totalPaginasReclamos ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.18s" }}>›</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <select value={itemsPorPagina} onChange={(e) => { setItemsPorPagina(Number(e.target.value)); setPaginaReclamos(1); }} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${t.paginaBtnBorder}`, background: t.selectBg, color: t.paginaBtnColor, fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
            </div>
          )}
        </>
        )}
      </section>
      )}
      {vistaEvidencia && (
        <div
          onClick={() => setVistaEvidencia(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 32 }}
        >
          <img
            onClick={(e) => e.stopPropagation()}
            src={vistaEvidencia}
            alt="Evidencia"
            style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 16, boxShadow: "0 8px 48px rgba(0,0,0,0.4)" }}
          />
          <button
            onClick={() => setVistaEvidencia(null)}
            style={{ position: "fixed", top: 20, right: 24, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: "1.2rem", cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            X
          </button>
        </div>
      )}

      {modalDetalles && (
        <div onClick={() => setModalDetalles(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.modalBg, borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", position: "relative" }}>
            <div style={{ background: "#7A1E3A", padding: "20px 24px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "1.15rem", fontWeight: 800 }}>Orden #{modalDetalles.id_orden}</h3>
                <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: "0.82rem" }}>
                  {modalDetalles.fecha_orden ? new Date(modalDetalles.fecha_orden).toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "Fecha no disponible"}
                </p>
              </div>
              <button onClick={() => setModalDetalles(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 36, height: 36, fontSize: "1rem", cursor: "pointer", display: "grid", placeItems: "center" }}>✕</button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: t.subCardVinoBg, borderRadius: 12, border: t.subCardVinoBorder, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: t.catBtnIconBg, display: "grid", placeItems: "center", fontSize: "1.2rem", flexShrink: 0 }}>🏪</div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tienda vendedora</p>
                  <strong style={{ fontSize: "0.97rem", color: t.vinoLabel }}>{getOrdenTienda(modalDetalles)}</strong>
                </div>
              </div>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: "0.85rem", color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Libros ({modalDetalles.items?.length || 0})
              </p>
              <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                {(modalDetalles.items || []).map((item, idx) => {
                  const imgItem = item.imagen_url || item.imagen;
                  return (
                    <div key={idx} style={{ display: "flex", gap: 12, padding: "12px 14px", background: t.modalItemBg, borderRadius: 10, border: `1px solid ${t.modalItemBorder}` }}>
                      {imgItem ? (
                        <img src={imgItem.startsWith("http") ? imgItem : `${getApiBaseUrl()}${imgItem}`} alt="libro" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 8, background: t.catBtnIconBg, display: "grid", placeItems: "center", fontSize: "1.4rem", flexShrink: 0 }}>📚</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.92rem", color: t.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.titulo || item.nombre_libro || "Libro"}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: t.textMuted }}>
                          Cant.: <strong style={{ color: t.textSecondary }}>{item.cantidad || 1}</strong>
                          {item.precio && <span style={{ marginLeft: 12 }}>Precio unit.: <strong style={{ color: t.textPrimary }}>${Number(item.precio).toLocaleString("es-CO")}</strong></span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: `1px solid ${t.modalDivider}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Estado</p>
                  <span style={{ background: darkMode ? "#0f2e1a" : "#dcfce7", color: darkMode ? "#4ade80" : "#166534", border: darkMode ? "1px solid #16a34a" : "1px solid #86efac", borderRadius: 20, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 700 }}>
                    {modalDetalles.estado_orden || modalDetalles.estado || "pagado"}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Total</p>
                  <strong style={{ fontSize: "1.4rem", color: t.vinoLabel, fontWeight: 800 }}>${Number(modalDetalles.total || 0).toLocaleString("es-CO")}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
