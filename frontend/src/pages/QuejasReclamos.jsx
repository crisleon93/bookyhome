import { useCallback, useEffect, useState } from "react";
import { crearQueja, getOrdenes, getQuejas, getApiBaseUrl, cancelarQueja } from "../services/api";
import { IconCheck, IconAlertTriangle, IconEye, IconBook, IconPackage, IconInfo, IconTruck, IconMessage, IconStore, IconStoreAlt } from "../components/Icons";

const MOTIVO_ICON_MAP = {
  "Libro danado o defectuoso": <IconBook width={15} height={15} />,
  "Producto incorrecto":       <IconPackage width={15} height={15} />,
  "No coincide con la descripcion": <IconInfo width={15} height={15} />,
  "Problema con la entrega":   <IconTruck width={15} height={15} />,
  "Otro":                      <IconMessage width={15} height={15} />,
};

const MOTIVOS = [
  { label: "Libro danado o defectuoso", icon: <IconBook width={18} height={18} /> },
  { label: "Producto incorrecto",        icon: <IconPackage width={18} height={18} /> },
  { label: "No coincide con la descripcion", icon: <IconInfo width={18} height={18} /> },
  { label: "Problema con la entrega",    icon: <IconTruck width={18} height={18} /> },
  { label: "Otro",                       icon: <IconMessage width={18} height={18} /> },
];

const ESTADO_CONFIG = {
  "Resuelto":      { bg: "#dcfce7", color: "#166534", border: "#86efac", dot: "#16a34a" },
  "En revision":   { bg: "#fff7ed", color: "#9a3412", border: "#fdba74", dot: "#ea580c" },
  "En revisión":   { bg: "#fff7ed", color: "#9a3412", border: "#fdba74", dot: "#ea580c" },
  "Abierto":       { bg: "#eff6ff", color: "#1e40af", border: "#93c5fd", dot: "#3b82f6" },
  "Cerrado":       { bg: "#f3f4f6", color: "#374151", border: "#d1d5db", dot: "#6b7280" },
  "Rechazado":     { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5", dot: "#ef4444" },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG["Cerrado"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: "5px 12px", borderRadius: 20,
      fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.01em",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
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
  const [showOrdenes, setShowOrdenes] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [cancelando, setCancelando] = useState(null);

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
        .filter((item) => ["Abierto", "En revision"].includes(item.estado))
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
      window.dispatchEvent(new Event("bookyhome-complaint-updated"));
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  const ordenInfo = ordenes.find(o => String(o.id_orden) === String(ordenSeleccionada));

  const getOrdenImagen = (orden) => {
    const item = orden?.items?.[0] || {};
    return item.imagen_url || item.imagen || null;
  };
  const getOrdenTienda = (orden) => {
    return orden?.nombre_tienda || orden?.items?.[0]?.nombre_tienda || "BookyHome";
  };

  return (
    <div style={{ width: "100%", margin: 0, padding: "0 0 2.5rem" }}>

      {/* HERO HEADER */}
      <section style={{
        padding: "2rem",
        marginBottom: 24,
        borderRadius: 20,
        background: "linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)",
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
            Reporta un problema de una compra pagada y adjunta evidencia si la tienes.
          </p>
        </div>
      </section>

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

      {/* FORMULARIO */}
      <form onSubmit={enviar} className="pl-card" style={{
        padding: "2rem", borderRadius: 20,
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        background: "#fff", marginBottom: 24,
      }}>
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #f0f0f0" }}>
          <h2 style={{ margin: 0, color: "#7A1E3A", fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
            Nueva queja o reclamo
          </h2>
          <p style={{ color: "#888", marginBottom: 0, marginTop: 6, fontSize: "0.88rem" }}>
            Solo aparecen compras pagadas de tu cuenta que no tienen una solicitud activa.
          </p>
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 12 }}>...</div>
            Cargando tus compras...
          </div>
        ) : ordenes.length === 0 ? (
          <div style={{
            padding: "40px 24px", textAlign: "center",
            background: "#fafafa", borderRadius: 14, border: "1.5px dashed #e5e7eb",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>??</div>
            <p style={{ margin: 0, color: "#666", fontSize: "0.95rem", fontWeight: 500 }}>
              No tienes compras pagadas disponibles para una nueva solicitud.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>

            <div>
              {/* Trigger colapsable */}
              <button
                type="button"
                onClick={() => setShowOrdenes(v => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 16px",
                  borderRadius: ordenSeleccionada && !showOrdenes ? 10 : (showOrdenes ? "10px 10px 0 0" : 10),
                  border: ordenSeleccionada ? "2px solid #7A1E3A" : "1.5px solid #e5e7eb",
                  background: ordenSeleccionada ? "linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)" : "#fafafa",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {ordenSeleccionada && getOrdenImagen(ordenInfo) ? (
                    <img
                      src={(() => { const u = getOrdenImagen(ordenInfo); return u?.startsWith("http") ? u : `${getApiBaseUrl()}${u}`; })()}
                      alt="libro"
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }}
                    />
                  ) : null}
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: ordenSeleccionada ? "#7A1E3A" : "#374151", letterSpacing: "0.01em" }}>
                    {ordenSeleccionada
                      ? `Orden #${ordenInfo?.id_orden} · ${getOrdenTienda(ordenInfo)} · $${Number(ordenInfo?.total || 0).toLocaleString("es-CO")}`
                      : "COMPRA A RECLAMAR — Haz clic para seleccionar"}
                  </span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                  style={{ width: 18, height: 18, color: "#7A1E3A", transform: showOrdenes ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Lista desplegable */}
              {showOrdenes && (
                <div style={{ border: "1.5px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                  <div style={{ display: "grid", gap: 0, maxHeight: 380, overflowY: "auto" }}>
                    {ordenes.map((orden, idx) => {
                      const img = getOrdenImagen(orden);
                      const tienda = getOrdenTienda(orden);
                      const seleccionada = String(ordenSeleccionada) === String(orden.id_orden);
                      const item0 = orden.items?.[0] || {};
                      const fechaStr = orden.fecha_orden
                        ? new Date(orden.fecha_orden).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
                        : (orden.fecha ? new Date(orden.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—");
                      return (
                        <div
                          key={orden.id_orden}
                          onClick={() => { setOrdenSeleccionada(seleccionada ? "" : String(orden.id_orden)); setShowOrdenes(false); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "12px 16px",
                            borderBottom: idx < ordenes.length - 1 ? "1px solid #f0f0f0" : "none",
                            background: seleccionada ? "linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)" : "#fff",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { if (!seleccionada) e.currentTarget.style.background = "#fdf8f9"; }}
                          onMouseLeave={e => { if (!seleccionada) e.currentTarget.style.background = "#fff"; }}
                        >
                          {img ? (
                            <img src={img.startsWith("http") ? img : `${getApiBaseUrl()}${img}`} alt="libro"
                              style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0, boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }} />
                          ) : (
                            <div style={{ width: 52, height: 52, borderRadius: 8, background: "#f7e9ee", display: "grid", placeItems: "center", fontSize: "1.4rem", flexShrink: 0 }}>📚</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <strong style={{ fontSize: "0.95rem", color: "#111", fontWeight: 700 }}>Orden #{orden.id_orden}</strong>
                              <span style={{ fontSize: "0.73rem", color: "#aaa" }}>{fechaStr}</span>
                            </div>
                            <p style={{ margin: "0 0 3px", fontSize: "0.83rem", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item0.titulo || item0.nombre_libro || "Varios libros"}
                              {orden.items?.length > 1 ? ` +${orden.items.length - 1}` : ""}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.78rem", color: "#888" }}>
                              <strong style={{ color: "#7A1E3A" }}>{tienda}</strong>
                              <span style={{ marginLeft: 10, color: "#333", fontWeight: 700 }}>${Number(orden.total || 0).toLocaleString("es-CO")}</span>
                            </p>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                            {seleccionada && (
                              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#7A1E3A", display: "grid", placeItems: "center" }}>
                                <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 900 }}>✓</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setModalDetalles(orden); }}
                              style={{
                                border: "1px solid #e5e7eb", background: "#fff",
                                color: "#7A1E3A", borderRadius: 7, padding: "4px 10px",
                                fontSize: "0.76rem", fontWeight: 700, cursor: "pointer",
                                fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.15s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#f7e9ee"; e.currentTarget.style.borderColor = "#7A1E3A"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                            >
                              Ver detalles
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: "0.88rem", color: "#374151", marginBottom: 10, letterSpacing: "0.01em" }}>
                MOTIVO DEL RECLAMO
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {MOTIVOS.map((m) => {
                  const activo = motivo === m.label;
                  return (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setMotivo(activo ? "" : m.label)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "11px 14px",
                        borderRadius: 10,
                        border: activo ? "2px solid #7A1E3A" : "1.5px solid #e5e7eb",
                        background: activo ? "linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)" : "#fafafa",
                        cursor: "pointer", fontFamily: "inherit",
                        textAlign: "left",
                        boxShadow: activo ? "0 0 0 3px rgba(122,30,58,0.08)" : "none",
                        transition: "all 0.18s",
                      }}
                      onMouseEnter={e => { if (!activo) { e.currentTarget.style.borderColor = "#c0587a"; e.currentTarget.style.background = "#fdf8f9"; } }}
                      onMouseLeave={e => { if (!activo) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fafafa"; } }}
                    >
                      <span style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: activo ? "#7A1E3A" : "#f7e9ee",
                        color: activo ? "#fff" : "#7A1E3A",
                        display: "grid", placeItems: "center", fontSize: "1rem",
                        transition: "background 0.18s, color 0.18s",
                      }}>
                        {m.icon}
                      </span>
                      <span style={{ fontSize: "0.83rem", fontWeight: activo ? 700 : 500, color: activo ? "#7A1E3A" : "#374151", lineHeight: 1.3 }}>
                        {m.label}
                      </span>
                      <span style={{ 
                        marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", 
                        background: activo ? "#7A1E3A" : "transparent", 
                        display: "grid", placeItems: "center", flexShrink: 0,
                        transition: "background 0.18s"
                      }}>
                        <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 900, opacity: activo ? 1 : 0, transition: "opacity 0.18s" }}>✓</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {motivo === "Otro" && (
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: "0.88rem", color: "#374151", marginBottom: 8, letterSpacing: "0.01em" }}>
                    ESPECIFICA EL MOTIVO
                  </label>
                  <input
                    type="text"
                    value={motivoOtro}
                    onChange={(e) => setMotivoOtro(e.target.value)}
                    placeholder="Escribe el motivo del reclamo..."
                    style={fieldStyle}
                    onFocus={e => { e.target.style.borderColor = "#7A1E3A"; e.target.style.boxShadow = "0 0 0 3px rgba(122,30,58,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: "0.88rem", color: "#374151", marginBottom: 8, letterSpacing: "0.01em" }}>
                EVIDENCIA <span style={{ color: "#aaa", fontWeight: 400 }}>(opcional - JPG, PNG, WEBP)</span>
              </label>
              <label style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px",
                border: "1.5px dashed #d1d5db",
                borderRadius: 10, cursor: "pointer",
                background: "#fafafa",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#7A1E3A"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#d1d5db"}
              >
                <span style={{
                  background: "#f7e9ee", color: "#7A1E3A",
                  borderRadius: 8, padding: "7px 14px", fontSize: "0.82rem", fontWeight: 700, flexShrink: 0,
                }}>
                  Elegir archivo
                </span>
                <span style={{ fontSize: "0.85rem", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {evidencia ? evidencia.name : "Sin archivos seleccionados"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEvidencia}
                  style={{ display: "none" }}
                />
              </label>
              {evidenciaPreview && (
                <div style={{ marginTop: 10 }}>
                  <img src={evidenciaPreview} alt="Vista previa" style={{ maxHeight: 120, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: "0.88rem", color: "#374151", marginBottom: 8, letterSpacing: "0.01em" }}>
                DESCRIPCION DEL PROBLEMA <span style={{ color: "#aaa", fontWeight: 400 }}>(opcional)</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                placeholder="Describe el problema con mas detalle para que el administrador pueda ayudarte mejor..."
                style={{ ...fieldStyle, lineHeight: 1.6, resize: "vertical" }}
                onFocus={e => { e.target.style.borderColor = "#7A1E3A"; e.target.style.boxShadow = "0 0 0 3px rgba(122,30,58,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                disabled={enviando}
                className="btn btn-vinotinto"
                style={{ padding: "13px 32px", borderRadius: 10, fontSize: "0.95rem", fontWeight: 700, boxShadow: "0 4px 14px rgba(122,30,58,0.25)", opacity: enviando ? 0.7 : 1, transition: "all 0.2s" }}
              >
                {enviando ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* MIS QUEJAS */}
      <section className="pl-card" style={{ padding: "2rem", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", background: "#fff" }}>
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: "#7A1E3A", fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
              Mis quejas y reclamos
            </h2>
            {quejas.length > 0 && (
              <span style={{ background: "#fdf2f4", color: "#7A1E3A", border: "1px solid #f0dde4", borderRadius: 20, padding: "3px 12px", fontSize: "0.8rem", fontWeight: 700 }}>
                {quejas.length} solicitud{quejas.length > 1 ? "es" : ""}
              </span>
            )}
          </div>

          {/* Stats chips */}
          {quejas.length > 0 && (() => {
            const counts = quejas.reduce((acc, q) => {
              const k = q.estado || "Otro";
              acc[k] = (acc[k] || 0) + 1;
              return acc;
            }, {});
            return (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {Object.entries(counts).map(([estado, n]) => {
                  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG["Cerrado"];
                  return (
                    <div key={estado} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 20,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      color: cfg.color, fontSize: "0.78rem", fontWeight: 700,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                      {n} {estado}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Filtros */}
          {quejas.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Todos", "Abierto", "En revisión", "Resuelto", "Cerrado", "Rechazado"].filter(f =>
                f === "Todos" || quejas.some(q => q.estado === f)
              ).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltroEstado(f)}
                  style={{
                    padding: "5px 14px", borderRadius: 20, border: "1.5px solid",
                    borderColor: filtroEstado === f ? "#7A1E3A" : "#e5e7eb",
                    background: filtroEstado === f ? "#7A1E3A" : "#fff",
                    color: filtroEstado === f ? "#fff" : "#555",
                    fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.18s",
                  }}
                >{f}</button>
              ))}
            </div>
          )}
        </div>

        {quejas.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>?</div>
            <p style={{ color: "#888", fontSize: "0.95rem", margin: 0 }}>No tienes solicitudes previas.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {quejas.filter(q => filtroEstado === "Todos" || q.estado === filtroEstado).map((queja) => {
              const STEPS = ["Abierto", "En revisión", "Resuelto"];
              const stepIdx = STEPS.indexOf(queja.estado);
              const progreso = stepIdx === -1 ? (queja.estado === "Rechazado" ? -1 : 0) : stepIdx;
              const fecha = queja.fecha_solicitud || queja.fecha_creacion || queja.created_at;
              const fechaStr = fecha
                ? new Date(fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
                : null;
              const tiempoStr = tiempoTranscurrido(fecha);
              const motivoIcon = MOTIVO_ICON_MAP[queja.asunto] || MOTIVO_ICON_MAP["Otro"];
              const tienda = queja.nombre_tienda || queja.tienda || null;
              const imgSrc = queja.imagen_libro
                ? (queja.imagen_libro.startsWith("http") ? queja.imagen_libro : `${getApiBaseUrl()}${queja.imagen_libro}`)
                : null;
              return (
              <article key={queja.id_solicitud} style={{
                borderRadius: 16,
                border: "1.5px solid #f0e8ec",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 2px 12px rgba(122,30,58,0.06)",
              }}>
                {/* Header de la card */}
                <div style={{
                  background: "linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)",
                  padding: "14px 20px",
                  borderBottom: "1.5px solid #f0e8ec",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Imagen del libro o fallback */}
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt="libro"
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid #f0dde4", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                      />
                    ) : (
                      <div style={{
                        width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                        background: "#7A1E3A", color: "#fff",
                        display: "grid", placeItems: "center",
                        fontSize: "0.72rem", fontWeight: 800,
                        letterSpacing: "-0.5px",
                      }}>
                        #{queja.id_solicitud}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: "0.74rem", color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Solicitud #{queja.id_solicitud} · Orden #{queja.id_orden}
                      </p>
                      <strong style={{ fontSize: "0.95rem", color: "#111", fontWeight: 800, display: "block", marginTop: 2 }}>
                        {queja.titulo_libro || "Libro"}
                        {queja.total_items > 1 ? <span style={{ fontWeight: 500, color: "#888", fontSize: "0.82rem" }}> +{queja.total_items - 1} más</span> : null}
                      </strong>
                    </div>
                  </div>
                  <EstadoBadge estado={queja.estado} />
                </div>

                {/* Cuerpo */}
                <div style={{ padding: "16px 20px", display: "grid", gap: 14 }}>

                  {/* Barra de progreso */}
                  {queja.estado !== "Rechazado" && queja.estado !== "Cerrado" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        {["Abierto", "En revisión", "Resuelto"].map((step, i) => {
                          const done = progreso >= i;
                          const current = progreso === i;
                          return (
                            <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: "50%",
                                background: done ? "#7A1E3A" : "#f0e8ec",
                                border: current ? "2px solid #7A1E3A" : "none",
                                display: "grid", placeItems: "center",
                                transition: "all 0.3s",
                              }}>
                                {done && <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 900 }}>✓</span>}
                              </div>
                              <span style={{ fontSize: "0.7rem", marginTop: 4, color: done ? "#7A1E3A" : "#aaa", fontWeight: done ? 700 : 500 }}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: "#f0e8ec", position: "relative" }}>
                        <div style={{
                          position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 4,
                          background: "linear-gradient(90deg, #7A1E3A, #c0587a)",
                          width: progreso === 0 ? "10%" : progreso === 1 ? "55%" : "100%",
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Fila de metadata */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {/* Motivo */}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#fdf2f4", border: "1px solid #f0dde4",
                        borderRadius: 20, padding: "5px 12px",
                        color: "#7A1E3A", fontSize: "0.8rem", fontWeight: 700,
                      }}>
                        <span style={{ color: "#7A1E3A", display: "flex" }}>{motivoIcon}</span>
                        {queja.asunto}
                      </div>

                      {/* Librería */}
                      {tienda && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "#f0f9ff", border: "1px solid #bae6fd",
                          borderRadius: 20, padding: "5px 12px",
                          color: "#0369a1", fontSize: "0.8rem", fontWeight: 700,
                        }}>
                          <IconStoreAlt width={14} height={14} strokeWidth={1.5} />
                          {tienda}
                        </div>
                      )}

                      {/* Fecha */}
                      {fechaStr && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: "#f9fafb", border: "1px solid #e5e7eb",
                          borderRadius: 20, padding: "5px 12px",
                          color: "#6b7280", fontSize: "0.78rem", fontWeight: 600,
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {fechaStr}
                        </div>
                      )}
                    </div>

                    {/* Tiempo transcurrido */}
                    {tiempoStr && (
                      <span style={{ fontSize: "0.75rem", color: "#aaa", fontWeight: 500, flexShrink: 0 }}>
                        {tiempoStr}
                      </span>
                    )}
                  </div>
                  {/* Descripción */}
                  {queja.descripcion && (
                    <div style={{ padding: "12px 14px", background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" }}>
                      <p style={{ margin: 0, color: "#555", lineHeight: 1.65, fontSize: "0.92rem" }}>
                        <span style={{ fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción</span>
                        {queja.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Evidencia */}
                  {queja.evidencia_url && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setVistaEvidencia(`${getApiBaseUrl()}${queja.evidencia_url}`)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 7,
                          border: "1.5px solid #f0dde4",
                          background: "#fff", padding: "8px 16px",
                          color: "#7A1E3A", cursor: "pointer", fontWeight: 700,
                          fontSize: "0.82rem", borderRadius: 8, fontFamily: "inherit",
                          transition: "all 0.2s", boxShadow: "0 1px 4px rgba(122,30,58,0.08)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#fdf2f4"; e.currentTarget.style.borderColor = "#7A1E3A"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#f0dde4"; }}
                      >
                        <IconEye width={15} height={15} strokeWidth={2} /> Ver evidencia adjunta
                      </button>
                    </div>
                  )}

                  {/* Respuesta del admin */}
                  {queja.respuesta && queja.respuesta !== "Cancelado por el usuario" && (
                    <div style={{
                      padding: "14px 16px",
                      background: "linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)",
                      borderRadius: 12, borderLeft: "4px solid #7A1E3A",
                    }}>
                      <p style={{ margin: "0 0 6px", color: "#7A1E3A", display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                        Respuesta del administrador
                      </p>
                      <p style={{ margin: 0, color: "#444", lineHeight: 1.65, fontSize: "0.92rem" }}>{queja.respuesta}</p>
                    </div>
                  )}

                  {/* Botón cancelar */}
                  {queja.estado === "Abierto" && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        disabled={cancelando === queja.id_solicitud}
                        onClick={async () => {
                          if (!window.confirm("\u00bfSeguro que quieres cancelar este reclamo? Esta acción no se puede deshacer.")) return;
                          setCancelando(queja.id_solicitud);
                          try {
                            await cancelarQueja(queja.id_solicitud);
                            await cargar();
                          } catch (err) {
                            alert(err.response?.data?.detail || "No se pudo cancelar.");
                          } finally {
                            setCancelando(null);
                          }
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          border: "1.5px solid #fca5a5",
                          background: "#fff", padding: "7px 16px",
                          color: "#dc2626", cursor: cancelando === queja.id_solicitud ? "not-allowed" : "pointer",
                          fontWeight: 700, fontSize: "0.8rem", borderRadius: 8,
                          fontFamily: "inherit", transition: "all 0.2s",
                          opacity: cancelando === queja.id_solicitud ? 0.6 : 1,
                        }}
                        onMouseEnter={e => { if (cancelando !== queja.id_solicitud) { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#dc2626"; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        {cancelando === queja.id_solicitud ? "Cancelando..." : "Cancelar reclamo"}
                      </button>
                    </div>
                  )}

                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>

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

      {/* MODAL DETALLES DE ORDEN */}
      {modalDetalles && (
        <div
          onClick={() => setModalDetalles(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", position: "relative" }}
          >
            <div style={{ background: "linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)", padding: "20px 24px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "1.15rem", fontWeight: 800 }}>Orden #{modalDetalles.id_orden}</h3>
                <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: "0.82rem" }}>
                  {modalDetalles.fecha_orden
                    ? new Date(modalDetalles.fecha_orden).toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
                    : "Fecha no disponible"}
                </p>
              </div>
              <button onClick={() => setModalDetalles(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 36, height: 36, fontSize: "1rem", cursor: "pointer", display: "grid", placeItems: "center" }}>✕</button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fdf8f9", borderRadius: 12, border: "1px solid #f0dde4", marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f7e9ee", display: "grid", placeItems: "center", fontSize: "1.2rem", flexShrink: 0 }}>🏪</div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tienda vendedora</p>
                  <strong style={{ fontSize: "0.97rem", color: "#7A1E3A" }}>{getOrdenTienda(modalDetalles)}</strong>
                </div>
              </div>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: "0.85rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Libros ({modalDetalles.items?.length || 0})
              </p>
              <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                {(modalDetalles.items || []).map((item, idx) => {
                  const imgItem = item.imagen_url || item.imagen;
                  return (
                    <div key={idx} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" }}>
                      {imgItem ? (
                        <img src={imgItem.startsWith("http") ? imgItem : `${getApiBaseUrl()}${imgItem}`} alt="libro" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 8, background: "#f7e9ee", display: "grid", placeItems: "center", fontSize: "1.4rem", flexShrink: 0 }}>📚</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.92rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.titulo || item.nombre_libro || "Libro"}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>
                          Cant.: <strong>{item.cantidad || 1}</strong>
                          {item.precio && <span style={{ marginLeft: 12 }}>Precio unit.: <strong style={{ color: "#111" }}>${Number(item.precio).toLocaleString("es-CO")}</strong></span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Estado</p>
                  <span style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac", borderRadius: 20, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 700 }}>
                    {modalDetalles.estado_orden || modalDetalles.estado || "pagado"}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Total</p>
                  <strong style={{ fontSize: "1.4rem", color: "#7A1E3A", fontWeight: 800 }}>${Number(modalDetalles.total || 0).toLocaleString("es-CO")}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
