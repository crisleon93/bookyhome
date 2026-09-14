import { useState, useEffect, useCallback, useRef } from "react";
import api, { getApiBaseUrl } from "../services/api";
import { notify } from "./ToastProvider";
import {
  IconTag,
  IconCheck,
  IconLock,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconBookOpen,
  IconAlertTriangle
} from "./Icons";

// ── Helpers ──
const formatPrecio = (v) => {
  if (v == null) return "—";
  return "$" + String(parseInt(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " COP";
};

const formatFecha = (f) => {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const inputDateTimeNow = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const ESTADO_CONFIG = {
  activa:  {
    bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
    color: "#065f46", border: "#6ee7b7",
    icon: "✓", label: "Activa",
    cardBorder: "#10b981", cardGlow: "rgba(16,185,129,0.08)"
  },
  proxima: {
    bg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    color: "#1e40af", border: "#93c5fd",
    icon: "◷", label: "Próxima",
    cardBorder: "#3b82f6", cardGlow: "rgba(59,130,246,0.08)"
  },
  vencida: {
    bg: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
    color: "#6b7280", border: "#d1d5db",
    icon: "✕", label: "Vencida",
    cardBorder: "#d1d5db", cardGlow: "rgba(0,0,0,0.03)"
  },
};

const labelTipo = (tipo, valor) => {
  const t = (tipo || "").toLowerCase();
  if (t === "porcentaje") return { text: `${valor}%`, sub: "dto." };
  if (t === "fijo") return { text: formatPrecio(valor), sub: "dto." };
  if (t === "especial") return { text: "2×1", sub: "especial" };
  return { text: String(valor || tipo), sub: "dto." };
};

// ── Badge ──
const BadgeEstado = ({ estado }) => {
  const s = ESTADO_CONFIG[estado] || ESTADO_CONFIG.vencida;
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      padding: "3px 10px", borderRadius: "20px",
      fontSize: "0.72rem", fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: "4px"
    }}>
      {s.icon} {s.label}
    </span>
  );
};

// ── Helper imágenes libros ──
const resolveImageUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${getApiBaseUrl()}${trimmed}`;
  return `${getApiBaseUrl()}/${trimmed}`;
};

const getLibroImageUrl = (libro) => {
  const candidate = libro?.imagen_url || libro?.imagen_principal || libro?.imagen || (Array.isArray(libro?.imagenes) ? libro.imagenes[0] : null);
  if (!candidate) return null;
  const first = typeof candidate === "string" ? candidate.split(",")[0] : candidate;
  return resolveImageUrl(first);
};

// ── Componente Selector Elegante de Fecha y Hora ──
function CustomDateTimePicker({ value, onChange, minDate, label, placeholder, alignRight = false, darkMode = false }) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  const parsedDate = value ? new Date(value) : null;
  const [viewDate, setViewDate] = useState(() => parsedDate || new Date());
  
  const surface = darkMode ? "#1f1f1f" : "#ffffff";
  const surfaceAlt = darkMode ? "#2a2a2a" : "#f9fafb";
  const borderColor = darkMode ? "#3a3a3a" : "#e5e7eb";
  const textColor = darkMode ? "#f3f4f6" : "#1f2937";
  const mutedColor = darkMode ? "#b8b8b8" : "#9ca3af";
  const calendarDayColor = darkMode ? "#f3f4f6" : "#1f2937";
  const calendarDayMuted = darkMode ? "#6b7280" : "#d1d5db";
  const pinkAccent = darkMode ? "#ff4f83" : "#7A1E3A";
  const pinkSoft = darkMode ? "rgba(255, 79, 131, 0.14)" : "rgba(122, 30, 58, 0.10)";

  const getInitialHours12 = () => {
    if (!parsedDate || isNaN(parsedDate.getTime())) return "12";
    const h = parsedDate.getHours();
    const h12 = h % 12 || 12;
    return String(h12).padStart(2, "0");
  };
  const getInitialMinutes = () => {
    if (!parsedDate || isNaN(parsedDate.getTime())) return "00";
    return String(parsedDate.getMinutes()).padStart(2, "0");
  };
  const getInitialAmPm = () => {
    if (!parsedDate || isNaN(parsedDate.getTime())) return "PM";
    return parsedDate.getHours() >= 12 ? "PM" : "AM";
  };

  const [selectedDay, setSelectedDay] = useState(() => parsedDate);
  const [hour, setHour] = useState(getInitialHours12);
  const [minute, setMinute] = useState(getInitialMinutes);
  const [ampm, setAmpm] = useState(getInitialAmPm);

  const sincronizarDesdeValue = () => {
    const d = value ? new Date(value) : null;
    if (d && !isNaN(d.getTime())) {
      setSelectedDay(d);
      setViewDate(d);
      const h = d.getHours();
      setHour(String(h % 12 || 12).padStart(2, "0"));
      setMinute(String(d.getMinutes()).padStart(2, "0"));
      setAmpm(h >= 12 ? "PM" : "AM");
      return;
    }

    setSelectedDay(null);
    setViewDate(new Date());
    setHour("12");
    setMinute("00");
    setAmpm("PM");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [abierto]);

  const emitDate = (dayObj, hStr, mStr, apStr) => {
    if (!dayObj) return;
    let hNum = parseInt(hStr, 10) || 12;
    if (apStr === "PM" && hNum < 12) hNum += 12;
    if (apStr === "AM" && hNum === 12) hNum = 0;
    
    const y = dayObj.getFullYear();
    const m = String(dayObj.getMonth() + 1).padStart(2, "0");
    const d = String(dayObj.getDate()).padStart(2, "0");
    const h = String(hNum).padStart(2, "0");
    const min = String(parseInt(mStr, 10) || 0).padStart(2, "0");
    
    const isoString = `${y}-${m}-${d}T${h}:${min}`;
    onChange(isoString);
  };

  const aplicarPreset = (diasAdicionales) => {
    const base = new Date();
    base.setDate(base.getDate() + diasAdicionales);
    setSelectedDay(base);
    setViewDate(base);
    emitDate(base, hour, minute, ampm);
  };

  const seleccionarDia = (d) => {
    setSelectedDay(d);
    emitDate(d, hour, minute, ampm);
  };

  const cambiarHora = (h) => {
    setHour(h);
    emitDate(selectedDay || new Date(), h, minute, ampm);
  };

  const cambiarMinuto = (m) => {
    setMinute(m);
    emitDate(selectedDay || new Date(), hour, m, ampm);
  };

  const cambiarAmPm = (ap) => {
    setAmpm(ap);
    emitDate(selectedDay || new Date(), hour, minute, ap);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const primerDiaMes = new Date(year, month, 1).getDay();
  const totalDiasMes = new Date(year, month + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(year, month, 0).getDate();

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const diasSemana = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

  const formatDisplay = () => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const fecha = d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
    const hora = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${fecha} · ${hora}`;
  };

  const minDateObj = minDate ? new Date(minDate) : null;
  const esDeshabilitado = (diaNum) => {
    if (!minDateObj) return false;
    const testDate = new Date(year, month, diaNum, 23, 59, 59);
    return testDate < minDateObj;
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {label && (
        <label style={{
          display: "block", marginBottom: "7px",
          fontSize: "0.78rem", fontWeight: 700,
          color: darkMode ? "#f3f4f6" : "#374151", textTransform: "uppercase", letterSpacing: "0.04em"
        }}>
          {label}
        </label>
      )}

      {/* Input / Trigger */}
      <div
        onClick={() => {
          if (!abierto) sincronizarDesdeValue();
          setAbierto(!abierto);
        }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 14px", borderRadius: "10px",
          border: `1.5px solid ${abierto ? pinkAccent : borderColor}`,
          background: surface, cursor: "pointer",
          boxShadow: abierto ? `0 0 0 3px ${pinkSoft}` : "none",
          transition: "all 0.15s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: pinkSoft, display: "flex", alignItems: "center",
            justifyContent: "center", color: pinkAccent
          }}>
            <IconCalendar width={15} height={15} strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: "0.88rem", fontWeight: value ? 700 : 500,
            color: value ? (darkMode ? "#f3f4f6" : "#1f2937") : (darkMode ? "#d1d5db" : "#9ca3af")
          }}>
            {formatDisplay() || placeholder || "Seleccionar fecha y hora..."}
          </span>
        </div>
        <span style={{ fontSize: "0.72rem", color: "#9ca3af", transform: abierto ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          ▼
        </span>
      </div>

      {/* Popup Calendario Elegante */}
      {abierto && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)",
          ...(alignRight ? { right: 0 } : { left: 0 }),
          zIndex: 9999, background: surface, borderRadius: "16px",
          boxShadow: darkMode ? "0 16px 48px rgba(0,0,0,0.45)" : "0 16px 48px rgba(0,0,0,0.22)",
          border: `1.5px solid ${borderColor}`, padding: "16px",
          width: "310px", boxSizing: "border-box"
        }}>
          {/* Presets rápidos */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "10px", marginBottom: "12px", borderBottom: "1px solid #f3f4f6" }}>
            {[
              { label: "Hoy", dias: 0 },
              { label: "Mañana", dias: 1 },
              { label: "+7d", dias: 7 },
              { label: "+15d", dias: 15 },
              { label: "+30d", dias: 30 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => aplicarPreset(p.dias)}
                style={{
                  padding: "4px 8px", borderRadius: "6px",
                  background: darkMode ? "#2a2a2a" : "#f9fafb", border: `1px solid ${borderColor}`,
                  color: darkMode ? "#f3f4f6" : "#4b5563", fontSize: "0.72rem", fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = darkMode ? "#3a3a3a" : "#fdf7f8"; e.currentTarget.style.borderColor = pinkAccent; e.currentTarget.style.color = pinkAccent; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = darkMode ? "#2a2a2a" : "#f9fafb"; e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = darkMode ? "#f3f4f6" : "#4b5563"; }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month / Year header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={{
                width: "28px", height: "28px", borderRadius: "6px",
                border: `1px solid ${borderColor}`, background: surface,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: textColor
              }}
            >
              ⟨
            </button>
            <span style={{ fontWeight: 800, fontSize: "0.92rem", color: textColor }}>
              {meses[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{
                width: "28px", height: "28px", borderRadius: "6px",
                border: `1px solid ${borderColor}`, background: surface,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: textColor
              }}
            >
              ⟩
            </button>
          </div>

          {/* Días de la semana */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: "2px", marginBottom: "6px" }}>
            {diasSemana.map((d) => (
              <span key={d} style={{ fontSize: "0.72rem", fontWeight: 800, color: mutedColor }}>
                {d}
              </span>
            ))}
          </div>

          {/* Grid de días */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "14px" }}>
            {Array.from({ length: primerDiaMes }).map((_, idx) => {
              const diaNum = totalDiasMesAnterior - primerDiaMes + idx + 1;
              return (
                <div key={`prev-${idx}`} style={{
                  height: "30px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.76rem", color: calendarDayMuted
                }}>
                  {diaNum}
                </div>
              );
            })}

            {Array.from({ length: totalDiasMes }).map((_, idx) => {
              const diaNum = idx + 1;
              const esHoy = new Date().toDateString() === new Date(year, month, diaNum).toDateString();
              const esSeleccionado = selectedDay && selectedDay.getFullYear() === year && selectedDay.getMonth() === month && selectedDay.getDate() === diaNum;
              const disabled = esDeshabilitado(diaNum);

              return (
                <div
                  key={diaNum}
                  onClick={() => !disabled && seleccionarDia(new Date(year, month, diaNum))}
                  style={{
                    height: "30px", borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: esSeleccionado || esHoy ? 800 : 500,
                    cursor: disabled ? "not-allowed" : "pointer",
                    background: esSeleccionado ? `linear-gradient(135deg, ${pinkAccent} 0%, ${darkMode ? '#e05a7a' : '#9B2C4E'} 100%)` : "transparent",
                    color: esSeleccionado ? "white" : disabled ? calendarDayMuted : esHoy ? pinkAccent : calendarDayColor,
                    border: esHoy && !esSeleccionado ? `1.5px solid ${pinkAccent}` : "none",
                    boxShadow: esSeleccionado ? `0 2px 8px ${darkMode ? 'rgba(255,79,131,0.35)' : 'rgba(122,30,58,0.22)'}` : "none",
                    transition: "all 0.1s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!esSeleccionado && !disabled) e.currentTarget.style.background = darkMode ? "#2e2e2e" : "#fdf7f8";
                  }}
                  onMouseLeave={(e) => {
                    if (!esSeleccionado && !disabled) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {diaNum}
                </div>
              );
            })}
          </div>

          {/* Selector de Hora */}
          <div style={{
            background: surfaceAlt, borderRadius: "10px", padding: "10px 12px",
            border: `1px solid ${borderColor}`, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "8px", marginBottom: "12px"
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: mutedColor }}>
              ⏰ Hora:
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <select
                value={hour}
                onChange={(e) => cambiarHora(e.target.value)}
                style={{
                  padding: "4px 6px", borderRadius: "6px", border: `1px solid ${borderColor}`,
                  background: surface, color: textColor, fontSize: "0.8rem", fontWeight: 700, outline: "none"
                }}
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span>:</span>
              <select
                value={minute}
                onChange={(e) => cambiarMinuto(e.target.value)}
                style={{
                  padding: "4px 6px", borderRadius: "6px", border: `1px solid ${borderColor}`,
                  background: surface, color: textColor, fontSize: "0.8rem", fontWeight: 700, outline: "none"
                }}
              >
                {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: `1px solid ${borderColor}`, marginLeft: "4px" }}>
                {["AM", "PM"].map((ap) => (
                  <button
                    key={ap}
                    type="button"
                    onClick={() => cambiarAmPm(ap)}
                    style={{
                      padding: "4px 7px", fontSize: "0.72rem", fontWeight: 800,
                      background: ampm === ap ? pinkAccent : surface,
                      color: ampm === ap ? "white" : (darkMode ? "#f3f4f6" : "#6b7280"),
                      border: "none", cursor: "pointer"
                    }}
                  >
                    {ap}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botón Listo */}
          <button
            type="button"
            onClick={() => setAbierto(false)}
            style={{
              width: "100%", padding: "9px", borderRadius: "8px",
              background: `linear-gradient(135deg, ${pinkAccent} 0%, ${darkMode ? '#e05a7a' : '#9B2C4E'} 100%)`,
              color: "white", border: "none", fontWeight: 800,
              fontSize: "0.84rem", cursor: "pointer"
            }}
          >
            Aceptar ✓
          </button>
        </div>
      )}
    </div>
  );
}

// ── Formulario crear / editar ──
function FormOferta({ libros, ofertaEditar, onGuardado, onCancelar, darkMode = false }) {
  const esEdicion = !!ofertaEditar;
  const panelBg = darkMode ? '#1f1f1f' : '#ffffff';
  const panelAlt = darkMode ? '#2a2a2a' : '#fafafa';
  const borderColor = darkMode ? '#3a3a3a' : '#e5e7eb';
  const inputBg = darkMode ? '#222222' : '#fafafa';
  const textColor = darkMode ? '#f3f4f6' : '#1f2937';
  const mutedColor = darkMode ? '#b8b8b8' : '#6b7280';
  const pinkAccent = darkMode ? '#ff4f83' : '#7A1E3A';
  const pinkSoft = darkMode ? 'rgba(255, 79, 131, 0.14)' : 'rgba(122, 30, 58, 0.10)';

  const [form, setForm] = useState({
    nombre_oferta:   ofertaEditar?.nombre_oferta   || "",
    tipo_descuento:  ofertaEditar?.tipo_descuento  || "porcentaje",
    valor_descuento: ofertaEditar?.valor_descuento || "",
    fecha_inicio:    ofertaEditar?.fecha_inicio?.slice(0, 16) || "",
    fecha_fin:       ofertaEditar?.fecha_fin?.slice(0, 16)    || "",
    ids_libros:      ofertaEditar?.libros?.map((l) => l.id_libro) || [],
  });
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState("");
  const [librosDesplegados, setLibrosDesplegados] = useState(false);
  const [busquedaLibro, setBusquedaLibro] = useState("");
  const fechaMinima = inputDateTimeNow();

  const toggleLibro = (id) => {
    setForm((f) => ({
      ...f,
      ids_libros: f.ids_libros.includes(id)
        ? f.ids_libros.filter((x) => x !== id)
        : [...f.ids_libros, id],
    }));
  };

  const seleccionarTodos = () => {
    setForm((f) => ({
      ...f,
      ids_libros: libros.map((l) => l.id_libro),
    }));
  };

  const deseleccionarTodos = () => {
    setForm((f) => ({
      ...f,
      ids_libros: [],
    }));
  };

  const guardar = async () => {
    if (!form.nombre_oferta.trim())  return setError("El nombre es obligatorio");
    if (!form.fecha_inicio)          return setError("La fecha de inicio es obligatoria");
    if (!form.fecha_fin)             return setError("La fecha de fin es obligatoria");
    if (!esEdicion && form.fecha_inicio < fechaMinima)
                                     return setError("No puedes crear promociones con fechas pasadas");
    if (form.fecha_inicio >= form.fecha_fin)
                                     return setError("La fecha de inicio debe ser anterior a la de fin");
    if (form.tipo_descuento !== "especial" && (!form.valor_descuento || Number(form.valor_descuento) <= 0))
                                     return setError("El valor del descuento debe ser mayor a 0");
    if (form.ids_libros.length === 0) return setError("Selecciona al menos un libro para la oferta");

    setCargando(true);
    setError("");
    try {
      const data = new FormData();
      data.append("nombre_oferta",   form.nombre_oferta);
      data.append("tipo_descuento",  form.tipo_descuento);
      data.append("valor_descuento", form.tipo_descuento === "especial" ? 0 : form.valor_descuento);
      data.append("fecha_inicio",    form.fecha_inicio.replace("T", " ") + ":00");
      data.append("fecha_fin",       form.fecha_fin.replace("T", " ")    + ":00");
      data.append("ids_libros",      form.ids_libros.join(","));

      if (esEdicion) {
        await api.put(`/ofertas/${ofertaEditar.id_oferta}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/ofertas", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onGuardado();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg).join(", "));
      } else {
        setError(detail || "Error al guardar la oferta");
      }
    } finally {
      setCargando(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px",
    border: `1.5px solid ${borderColor}`, borderRadius: "10px",
    fontSize: "0.92rem", outline: "none", fontFamily: "inherit",
    background: inputBg, color: textColor,
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", marginBottom: "7px",
    fontSize: "0.82rem", fontWeight: 700,
    color: darkMode ? "#f3f4f6" : "#374151", textTransform: "uppercase", letterSpacing: "0.04em"
  };

  const librosFiltrados = libros.filter((l) => {
    if (!busquedaLibro.trim()) return true;
    const q = busquedaLibro.toLowerCase();
    return (
      l.titulo?.toLowerCase().includes(q) ||
      l.autor_libro?.toLowerCase().includes(q)
    );
  });

  const librosSeleccionadosObjs = libros.filter((l) => form.ids_libros.includes(l.id_libro));

  const opcionesDescuento = [
    {
      tipo: "porcentaje",
      icon: "%",
      label: "Porcentaje (%)",
      desc: "Descuento porcentual sobre el precio",
      badgeColor: "#10b981",
      badgeBg: "#d1fae5",
    },
    {
      tipo: "fijo",
      icon: "$",
      label: "Monto fijo (COP)",
      desc: "Descuento de un valor monetario específico",
      badgeColor: "#3b82f6",
      badgeBg: "#dbeafe",
    },
    {
      tipo: "especial",
      icon: "🎁",
      label: "2×1 Especial",
      desc: "Lleva 2 unidades y paga solo 1",
      badgeColor: "#8b5cf6",
      badgeBg: "#ede9fe",
    },
  ];
  return (
    <div style={{
      background: panelBg, borderRadius: "16px",
      border: `1.5px solid ${borderColor}`,
      boxShadow: darkMode ? "0 8px 30px rgba(0,0,0,0.25)" : "0 8px 30px rgba(0,0,0,0.08)",
      marginBottom: "24px", position: "relative"
    }}>
      {/* Header form */}
      <div style={{
        background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
        borderTopLeftRadius: "15px", borderTopRightRadius: "15px",
        padding: "20px 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "rgba(255,255,255,0.2)", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <IconTag width={20} height={20} strokeWidth={2.2} style={{ color: "white" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: "white", fontSize: "1.15rem", fontWeight: 800 }}>
              {esEdicion ? "Editar oferta" : "Nueva oferta"}
            </h2>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "0.82rem" }}>
              {esEdicion ? "Actualiza los datos de tu promoción" : "Crea una nueva promoción para tus libros"}
            </p>
          </div>
        </div>
        <button onClick={onCancelar} style={{
          background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
          color: "white", width: "34px", height: "34px", borderRadius: "8px",
          cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center",
          justifyContent: "center", transition: "background 0.15s"
        }}>×</button>
      </div>

      <div style={{ padding: "28px" }}>
        {/* Nombre de la oferta */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Nombre de la oferta *</label>
          <input
            style={inputStyle}
            value={form.nombre_oferta}
            maxLength={100}
            placeholder="Ej: Black Friday Literario, Descuento de Verano..."
            onChange={(e) => setForm({ ...form, nombre_oferta: e.target.value })}
            onFocus={(e) => { e.target.style.borderColor = pinkAccent; e.target.style.boxShadow = darkMode ? "0 0 0 3px rgba(255,79,131,0.15)" : "0 0 0 3px rgba(122,30,58,0.10)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Tipo de Descuento (Tarjetas Interactivas) */}
        <div style={{ marginBottom: "22px" }}>
          <label style={labelStyle}>Tipo de descuento *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {opcionesDescuento.map((opc) => {
              const seleccionado = form.tipo_descuento === opc.tipo;
              return (
                <div
                  key={opc.tipo}
                  onClick={() => setForm({ ...form, tipo_descuento: opc.tipo, valor_descuento: "" })}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    border: seleccionado ? `2px solid ${pinkAccent}` : `1.5px solid ${borderColor}`,
                    background: seleccionado ? (darkMode ? "#2a1a24" : "#fdf7f8") : (darkMode ? "#242424" : "#fafafa"),
                    boxShadow: seleccionado ? `0 4px 14px ${darkMode ? 'rgba(255,79,131,0.18)' : 'rgba(122,30,58,0.12)'}` : "none",
                    transition: "all 0.18s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    if (!seleccionado) e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    if (!seleccionado) e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: seleccionado ? pinkAccent : opc.badgeBg,
                    color: seleccionado ? "white" : opc.badgeColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem", fontWeight: 800, flexShrink: 0,
                    transition: "all 0.18s ease"
                  }}>
                    {opc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 800, fontSize: "0.92rem",
                      color: seleccionado ? "#7A1E3A" : textColor,
                      marginBottom: "2px"
                    }}>
                      {opc.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: mutedColor, lineHeight: 1.2 }}>
                      {opc.desc}
                    </div>
                  </div>
                  {seleccionado && (
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: pinkAccent, color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.68rem", fontWeight: 900
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Valor a descontar (si no es especial) */}
        {form.tipo_descuento !== "especial" && (
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>
              {form.tipo_descuento === "porcentaje" ? "Porcentaje de descuento (%) *" : "Monto de descuento (COP) *"}
            </label>
            <div style={{ position: "relative", maxWidth: "340px" }}>
              <input
                type="number"
                min="1"
                max={form.tipo_descuento === "porcentaje" ? 100 : undefined}
                style={{ ...inputStyle, paddingRight: "50px", fontWeight: 700 }}
                value={form.valor_descuento}
                placeholder={form.tipo_descuento === "porcentaje" ? "Ej: 25" : "Ej: 15000"}
                onChange={(e) => setForm({ ...form, valor_descuento: e.target.value })}
                onFocus={(e) => { e.target.style.borderColor = "#7A1E3A"; e.target.style.boxShadow = "0 0 0 3px rgba(122,30,58,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
              <span style={{
                position: "absolute", right: "14px", top: "50%",
                transform: "translateY(-50%)", fontWeight: 800,
                color: "#7A1E3A", fontSize: "0.85rem", pointerEvents: "none"
              }}>
                {form.tipo_descuento === "porcentaje" ? "% DTO" : "COP"}
              </span>
            </div>
          </div>
        )}

        {/* Fechas de vigencia con CustomDateTimePicker */}
        <div style={{
          background: panelAlt, borderRadius: "14px", border: `1.5px solid ${borderColor}`,
          padding: "18px 20px", marginBottom: "22px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: pinkSoft, display: "flex", alignItems: "center",
              justifyContent: "center"
            }}>
              <IconCalendar width={16} height={16} strokeWidth={2.2} style={{ color: pinkAccent }} />
            </div>
            <span style={{ fontSize: "0.86rem", fontWeight: 800, color: textColor }}>
              Vigencia de la promoción
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <CustomDateTimePicker
              label="Fecha y hora de inicio *"
              value={form.fecha_inicio}
              minDate={fechaMinima}
              placeholder="Seleccionar inicio..."
              onChange={(val) => setForm((prev) => ({ ...prev, fecha_inicio: val }))}
              darkMode={darkMode}
            />
            <CustomDateTimePicker
              label="Fecha y hora de fin *"
              value={form.fecha_fin}
              minDate={form.fecha_inicio || fechaMinima}
              placeholder="Seleccionar fin..."
              alignRight={true}
              onChange={(val) => setForm((prev) => ({ ...prev, fecha_fin: val }))}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Sección Libros Incluidos (Acordeón desplegable + fotos) */}
        <div style={{
          background: panelAlt, borderRadius: "14px", border: `1.5px solid ${borderColor}`,
          overflow: "hidden", marginBottom: "22px"
        }}>
          {/* Header del acordeón */}
          <div style={{
            padding: "16px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
            background: librosDesplegados ? (darkMode ? '#2a2a2a' : '#f4f4f5') : 'transparent',
            borderBottom: librosDesplegados ? `1.5px solid ${borderColor}` : 'none',
            transition: "background 0.15s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: pinkSoft, display: "flex", alignItems: "center",
                justifyContent: "center"
              }}>
                <IconBookOpen width={16} height={16} strokeWidth={2.2} style={{ color: pinkAccent }} />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.92rem", color: textColor }}>
                  Libros incluidos en la oferta
                </span>
                <span style={{
                  marginLeft: "8px",
                  background: form.ids_libros.length > 0 ? pinkAccent : (darkMode ? "#3a3a3a" : "#e5e7eb"),
                  color: form.ids_libros.length > 0 ? "white" : (darkMode ? "#d1d5db" : "#6b7280"),
                  padding: "2px 8px", borderRadius: "12px",
                  fontSize: "0.72rem", fontWeight: 800
                }}>
                  {form.ids_libros.length} de {libros.length} seleccionado{form.ids_libros.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {librosDesplegados && (
                <>
                  <button
                    type="button"
                    onClick={seleccionarTodos}
                    style={{
                      padding: "6px 11px", borderRadius: "8px",
                      background: darkMode ? '#2a2a2a' : 'white', border: `1px solid ${borderColor}`,
                      color: textColor, fontSize: "0.76rem", fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Seleccionar todos
                  </button>
                  <button
                    type="button"
                    onClick={deseleccionarTodos}
                    style={{
                      padding: "6px 11px", borderRadius: "8px",
                      background: darkMode ? '#2a2a2a' : 'white', border: `1px solid ${borderColor}`,
                      color: mutedColor, fontSize: "0.76rem", fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Limpiar
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setLibrosDesplegados(!librosDesplegados)}
                style={{
                  padding: "7px 14px", borderRadius: "8px",
                  background: librosDesplegados ? "#7A1E3A" : (darkMode ? '#2a2a2a' : 'white'),
                  border: `1.5px solid ${librosDesplegados ? "#7A1E3A" : borderColor}`,
                  color: librosDesplegados ? "white" : textColor,
                  fontSize: "0.82rem", fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                  transition: "all 0.15s"
                }}
              >
                {librosDesplegados ? "Contraer lista ▲" : "Desplegar libros ▼"}
              </button>
            </div>
          </div>

          {/* Vista previa compacta cuando está contraído */}
          {!librosDesplegados && (
            <div style={{ padding: "14px 20px" }}>
              {form.ids_libros.length === 0 ? (
                <div style={{ color: mutedColor, fontSize: "0.84rem" }}>
                  <span>⚠️ No has seleccionado ningún libro todavía.</span>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {librosSeleccionadosObjs.slice(0, 5).map((l) => {
                      const img = getLibroImageUrl(l);
                      return (
                        <div key={l.id_libro} style={{
                          display: "flex", alignItems: "center", gap: "7px",
                          background: "white", border: "1px solid #e5e7eb",
                          borderRadius: "8px", padding: "4px 8px 4px 5px",
                          maxWidth: "190px"
                        }}>
                          {img ? (
                            <img src={img} alt="" style={{ width: "22px", height: "30px", objectFit: "cover", borderRadius: "3px" }} />
                          ) : (
                            <div style={{ width: "22px", height: "30px", background: "#f3f4f6", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>📖</div>
                          )}
                          <span style={{
                            fontSize: "0.78rem", fontWeight: 700, color: "#1f2937",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                          }}>
                            {l.titulo}
                          </span>
                        </div>
                      );
                    })}
                    {librosSeleccionadosObjs.length > 5 && (
                      <span style={{
                        fontSize: "0.78rem", fontWeight: 800, color: "#7A1E3A",
                        background: "#7A1E3A15", padding: "4px 9px", borderRadius: "8px"
                      }}>
                        +{librosSeleccionadosObjs.length - 5} más
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista completa cuando está desplegado */}
          {librosDesplegados && (
            <div style={{ padding: "16px 20px" }}>
              {/* Buscador de libros */}
              <div style={{ marginBottom: "12px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="Buscar libro por título o autor..."
                  value={busquedaLibro}
                  onChange={(e) => setBusquedaLibro(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px",
                    border: `1.5px solid ${borderColor}`, borderRadius: "8px",
                    fontSize: "0.85rem", background: darkMode ? '#222222' : 'white', color: textColor, outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#7A1E3A"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }}
                />
              </div>

              <div style={{
                display: "flex", flexDirection: "column", gap: "8px",
                maxHeight: "260px", overflowY: "auto", paddingRight: "4px"
              }}>
                {librosFiltrados.length === 0 && (
                  <p style={{ color: "#9ca3af", fontSize: "0.86rem", textAlign: "center", padding: "16px 0" }}>
                    No se encontraron libros
                  </p>
                )}
                {librosFiltrados.map((libro) => {
                  const sel = form.ids_libros.includes(libro.id_libro);
                  const img = getLibroImageUrl(libro);

                  return (
                    <label key={libro.id_libro} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                      border: `1.5px solid ${sel ? "#7A1E3A" : borderColor}`,
                      background: sel ? (darkMode ? "#2a1a24" : "#fdf7f8") : (darkMode ? "#222222" : "white"),
                      transition: "all 0.15s",
                      boxShadow: sel ? "0 2px 8px rgba(122,30,58,0.08)" : "none"
                    }}>
                      <input
                        type="checkbox" checked={sel}
                        onChange={() => toggleLibro(libro.id_libro)}
                        style={{ accentColor: "#7A1E3A", width: "16px", height: "16px", flexShrink: 0 }}
                      />

                      {/* Mini portada del libro */}
                      <div style={{
                        width: "36px", height: "48px", borderRadius: "5px",
                        overflow: "hidden", background: "#f3f4f6", flexShrink: 0,
                        border: "1px solid #e5e7eb", display: "flex",
                        alignItems: "center", justifyContent: "center"
                      }}>
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span style={{ fontSize: "1.1rem" }}>📖</span>
                        )}
                      </div>

                      {/* Info del libro */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0, fontWeight: 700, fontSize: "0.88rem",
                          color: textColor, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>
                          {libro.titulo}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: mutedColor }}>
                          {libro.autor_libro || "Autor no especificado"} · Stock: <strong>{libro.stock}</strong>
                        </p>
                      </div>

                      {/* Precio */}
                      <span style={{ fontWeight: 800, color: "#7A1E3A", fontSize: "0.88rem", flexShrink: 0 }}>
                        {libro.precio_libro != null ? formatPrecio(libro.precio_libro) : "—"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", color: "#dc2626",
            border: "1.5px solid #fca5a5", borderRadius: "10px",
            padding: "12px 16px", fontSize: "0.88rem",
            fontWeight: 600, marginBottom: "18px",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            <IconAlertTriangle width={16} height={16} strokeWidth={2} style={{ color: "#dc2626", flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancelar} disabled={cargando}
            style={{
              padding: "11px 22px", borderRadius: "10px",
              border: `1.5px solid ${borderColor}`, background: darkMode ? '#2a2a2a' : 'white',
              color: textColor, fontWeight: 700, cursor: "pointer",
              fontSize: "0.9rem", transition: "all 0.15s"
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar} disabled={cargando}
            style={{
              padding: "11px 26px", borderRadius: "10px",
              background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
              border: "none", color: "white", fontWeight: 800,
              cursor: cargando ? "not-allowed" : "pointer",
              fontSize: "0.92rem", opacity: cargando ? 0.7 : 1,
              boxShadow: "0 4px 14px rgba(122,30,58,0.25)",
              transition: "all 0.15s"
            }}
          >
            {cargando ? "Guardando…" : esEdicion ? "Guardar cambios" : "✓ Crear oferta"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal confirmar eliminación ──
function ModalEliminarOferta({ oferta, onClose, onEliminado, darkMode = false }) {
  const [cargando, setCargando] = useState(false);
  const panelBg = darkMode ? '#1f1f1f' : '#ffffff';
  const borderColor = darkMode ? '#3a3a3a' : '#e5e7eb';
  const textPrimary = darkMode ? '#f3f4f6' : '#1f2937';
  const textSecondary = darkMode ? '#b8b8b8' : '#6b7280';
  const [error,    setError]    = useState("");

  const confirmar = async () => {
    setCargando(true);
    try {
      await api.delete(`/ofertas/${oferta.id_oferta}`);
      onEliminado();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al eliminar");
      setCargando(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: panelBg, borderRadius: "16px", padding: "28px",
          maxWidth: "420px", width: "95%",
          boxShadow: darkMode ? "0 20px 60px rgba(0,0,0,0.45)" : "0 20px 60px rgba(0,0,0,0.25)",
          border: `1px solid ${borderColor}`
        }}
      >
        <div style={{
          width: "56px", height: "56px", borderRadius: "14px",
          background: "#fef2f2", display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: "16px"
        }}>
          <IconTrash width={26} height={26} strokeWidth={2} style={{ color: "#dc2626" }} />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: "1.15rem", color: textPrimary }}>Eliminar oferta</h2>
        <p style={{ color: textSecondary, marginBottom: "6px", fontSize: "0.92rem" }}>
          ¿Eliminar <strong style={{ color: textPrimary }}>"{oferta.nombre_oferta}"</strong>?
        </p>
        <p style={{ fontSize: "0.82rem", color: darkMode ? '#9ca3af' : '#9ca3af', marginBottom: "20px" }}>
          Esta acción no se puede deshacer.
        </p>
        {error && (
          <div style={{
            background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "16px",
            fontSize: "0.85rem", fontWeight: 600
          }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onClose} disabled={cargando}
            style={{
              flex: 1, padding: "11px", borderRadius: "10px",
              border: `1.5px solid ${borderColor}`, background: darkMode ? '#2a2a2a' : 'white',
              color: textPrimary, fontWeight: 700, cursor: "pointer", fontSize: "0.9rem"
            }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmar} disabled={cargando}
            style={{
              flex: 1, padding: "11px", borderRadius: "10px",
              background: "#dc2626", border: "none", color: "white",
              fontWeight: 700, cursor: cargando ? "not-allowed" : "pointer",
              fontSize: "0.9rem", opacity: cargando ? 0.7 : 1
            }}
          >
            {cargando ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta de oferta ──
function TarjetaOferta({ oferta, onEditar, onEliminar, darkMode = false }) {
  const estado = ESTADO_CONFIG[oferta.estado] || ESTADO_CONFIG.vencida;
  const descuento = labelTipo(oferta.tipo_descuento, oferta.valor_descuento);
  const vencida = oferta.estado === "vencida";
  const cardBg = darkMode ? '#1e1e1e' : '#ffffff';
  const lineColor = darkMode ? '#2f2f2f' : '#f3f4f6';
  const textColor = darkMode ? '#f3f4f6' : '#1f2937';
  const mutedColor = darkMode ? '#b8b8b8' : '#6b7280';

  return (
    <div
      style={{
        background: cardBg, borderRadius: "14px",
        border: `1.5px solid ${darkMode ? '#3a3a3a' : estado.cardBorder}`,
        boxShadow: darkMode ? `0 2px 10px rgba(0,0,0,0.25)` : `0 2px 10px ${estado.cardGlow}`,
        overflow: "hidden",
        opacity: vencida ? 0.9 : 1,
        transition: "transform 0.15s, box-shadow 0.15s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        if (vencida) {
          e.currentTarget.style.boxShadow = darkMode
            ? "0 8px 22px rgba(148,163,184,0.18)"
            : "0 8px 22px rgba(107,114,128,0.22)";
          return;
        }
        e.currentTarget.style.boxShadow = `0 6px 20px ${estado.cardGlow.replace("0.08", "0.18")}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = darkMode
          ? "0 2px 10px rgba(0,0,0,0.25)"
          : `0 2px 10px ${estado.cardGlow}`;
      }}
    >
      {/* Franja superior */}
      <div style={{
        height: "4px",
        background: `linear-gradient(90deg, ${estado.cardBorder}, ${estado.border})`
      }} />

      {/* Cuerpo */}
      <div style={{ padding: "16px 18px" }}>

        {/* Fila 1: Nombre + Badge estado + Badge descuento (derecha) */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: "10px", marginBottom: "10px"
        }}>
          {/* Nombre + estado */}
          <div style={{ minWidth: 0 }}>
            <h4 style={{
              margin: "0 0 5px", fontSize: "0.95rem", fontWeight: 800,
              color: textColor, lineHeight: 1.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {oferta.nombre_oferta}
            </h4>
            <BadgeEstado estado={oferta.estado} />
          </div>

          {/* Badge descuento: top-right */}
          <div style={{
            flexShrink: 0,
            background: estado.bg,
            border: `1.5px solid ${estado.border}`,
            borderRadius: "10px",
            padding: "6px 12px",
            textAlign: "center",
            minWidth: "54px"
          }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: estado.color, lineHeight: 1 }}>
              {descuento.text}
            </div>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: estado.color, opacity: 0.75, marginTop: "2px" }}>
              {descuento.sub}
            </div>
          </div>
        </div>

        {/* Fila 2: Fechas en una sola línea */}
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "0.78rem", color: mutedColor,
          marginBottom: "14px", flexWrap: "nowrap"
        }}>
          <IconCalendar width={13} height={13} strokeWidth={2} style={{ color: darkMode ? '#9ca3af' : '#9ca3af', flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap" }}>{formatFecha(oferta.fecha_inicio)}</span>
          <span style={{ color: "#d1d5db", flexShrink: 0 }}>→</span>
          <span style={{ whiteSpace: "nowrap" }}>{formatFecha(oferta.fecha_fin)}</span>
        </div>

        {/* Fila 3: Libros + Botones */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "12px", borderTop: `1px solid ${lineColor}`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", color: mutedColor }}>
            <IconBookOpen width={13} height={13} strokeWidth={2} style={{ color: "#c4c9d4" }} />
            <span>{oferta.total_libros} libro{oferta.total_libros !== 1 ? "s" : ""}</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => onEditar(oferta)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 12px", borderRadius: "8px",
                background: darkMode ? '#f3f4f6' : '#f8fafc', border: `1px solid ${darkMode ? '#d1d5db' : '#dbe1ea'}`,
                color: '#1f2937', fontWeight: 700, cursor: "pointer",
                fontSize: "0.78rem", transition: "background 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = darkMode ? '#e5e7eb' : '#eef2f7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = darkMode ? '#f3f4f6' : '#f8fafc'; }}
            >
              <IconEdit width={12} height={12} strokeWidth={2.2} /> Editar
            </button>
            <button
              onClick={() => onEliminar(oferta)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 12px", borderRadius: "8px",
                background: darkMode ? '#fff1f5' : '#fff1f5', border: `1px solid ${darkMode ? '#f9a8d4' : '#f9a8d4'}`,
                color: '#be185d', fontWeight: 700, cursor: "pointer",
                fontSize: "0.78rem", transition: "background 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ffe4ef'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff1f5'; }}
            >
              <IconTrash width={12} height={12} strokeWidth={2.2} /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Sección de grupo ──
function GrupoOfertas({ titulo, lista, colorAccent, icon, onEditar, onEliminar, darkMode = false }) {
  if (lista.length === 0) return null;
  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        marginBottom: "14px", paddingBottom: "10px",
        borderBottom: `2px solid ${colorAccent}22`
      }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px",
          background: `${colorAccent}18`, display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>
          {icon}
        </div>
        <span style={{
          fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: colorAccent
        }}>
          {titulo}
        </span>
        <span style={{
          background: `${colorAccent}18`, color: colorAccent,
          borderRadius: "12px", padding: "1px 8px",
          fontSize: "0.75rem", fontWeight: 800
        }}>
          {lista.length}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
        {lista.map((o) => (
          <TarjetaOferta key={o.id_oferta} oferta={o} onEditar={onEditar} onEliminar={onEliminar} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  COMPONENTE PRINCIPAL — SeccionOfertas
// ══════════════════════════════════════════════
export default function SeccionOfertas() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [ofertas, setOfertas] = useState([]);
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [ofertaEditar, setOfertaEditar] = useState(null);
  const [ofertaEliminar, setOfertaEliminar] = useState(null);

  useEffect(() => {
    const syncDarkMode = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', syncDarkMode);
    window.addEventListener('storage', syncDarkMode);
    return () => {
      window.removeEventListener('darkModeChange', syncDarkMode);
      window.removeEventListener('storage', syncDarkMode);
    };
  }, []);

  const cargar = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const [resOfertas, resLibros] = await Promise.all([
        api.get("/ofertas"),
        api.get("/libros/mis-libros"),
      ]);
      setOfertas(resOfertas.data);
      setLibros(resLibros.data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const abrirEditar = async (oferta) => {
    try {
      const res = await api.get(`/ofertas/${oferta.id_oferta}`);
      setOfertaEditar(res.data);
      setMostrarForm(true);
    } catch {
      notify("Error al cargar la oferta para edición", "error");
    }
  };

  const cerrarForm = () => { setMostrarForm(false); setOfertaEditar(null); };
  const onGuardado = () => { cerrarForm(); cargar(); };

  const activas  = ofertas.filter((o) => o.estado === "activa");
  const proximas = ofertas.filter((o) => o.estado === "proxima");
  const vencidas = ofertas.filter((o) => o.estado === "vencida");

  return (
    <>
      {/* Header */}
      <div style={{
        background: darkMode ? "#1e1e1e" : "white", borderRadius: "16px",
        border: `1.5px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}`,
        boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.05)",
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
            <IconTag width={24} height={24} strokeWidth={2.2} style={{ color: "white" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 900, color: darkMode ? "#f3f4f6" : "#1f2937" }}>
              Promociones y descuentos
            </h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: darkMode ? "#b8b8b8" : "#6b7280", marginTop: "2px" }}>
              {activas.length > 0
                ? `${activas.length} activa${activas.length > 1 ? "s" : ""} ahora · ${ofertas.length} en total`
                : `${ofertas.length} oferta${ofertas.length !== 1 ? "s" : ""} creada${ofertas.length !== 1 ? "s" : ""}`
              }
            </p>
          </div>
        </div>

        {/* Stats + botón */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { label: "Activas",  value: activas.length,  color: "#10b981", bg: "#d1fae5" },
            { label: "Próximas", value: proximas.length, color: "#3b82f6", bg: "#dbeafe" },
            { label: "Vencidas", value: vencidas.length, color: "#6b7280", bg: "#f3f4f6" },
          ].map((s) => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: "10px",
              padding: "8px 14px", textAlign: "center", minWidth: "64px"
            }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: s.color, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}

          {!mostrarForm && (
            <button
              onClick={() => { setOfertaEditar(null); setMostrarForm(true); }}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "11px 20px", borderRadius: "12px",
                background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
                border: "none", color: "white", fontWeight: 800,
                cursor: "pointer", fontSize: "0.9rem",
                boxShadow: "0 4px 14px rgba(122,30,58,0.3)",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(122,30,58,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(122,30,58,0.3)"; }}
            >
              <IconPlus width={17} height={17} strokeWidth={2.5} style={{ color: "white" }} />
              Nueva oferta
            </button>
          )}
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <FormOferta
          libros={libros}
          ofertaEditar={ofertaEditar}
          onGuardado={onGuardado}
          onCancelar={cerrarForm}
          darkMode={darkMode}
        />
      )}

      {/* Contenedor principal de ofertas */}
      <div style={{
        background: darkMode ? "#1e1e1e" : "white",
        borderRadius: "16px",
        border: `1.5px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}`,
        boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.05)",
        padding: "24px 28px"
      }}>
        {loading && (
          <div style={{
            padding: "40px", textAlign: "center", color: "#9ca3af"
          }}>
            Cargando promociones…
          </div>
        )}

        {!loading && ofertas.length === 0 && (
          <div style={{
            border: `2px dashed ${darkMode ? "#3a3a3a" : "#e5e7eb"}`, borderRadius: "14px",
            padding: "60px 20px", textAlign: "center", background: darkMode ? "#181818" : "transparent"
          }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px",
              background: "#fdf7f8", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <IconTag width={30} height={30} strokeWidth={1.8} style={{ color: "#C5425A" }} />
            </div>
            <h3 style={{ margin: "0 0 8px", color: darkMode ? "#f3f4f6" : "#1f2937", fontSize: "1.05rem" }}>Sin promociones todavía</h3>
            <p style={{ margin: "0 0 20px", color: darkMode ? "#b8b8b8" : "#6b7280", fontSize: "0.88rem" }}>
              Crea tu primera oferta para atraer más compradores
            </p>
            <button
              onClick={() => { setOfertaEditar(null); setMostrarForm(true); }}
              style={{
                padding: "11px 24px", borderRadius: "12px",
                background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
                border: "none", color: "white", fontWeight: 800,
                cursor: "pointer", fontSize: "0.9rem",
                boxShadow: "0 4px 14px rgba(122,30,58,0.25)"
              }}
            >
              + Crear primera oferta
            </button>
          </div>
        )}

        {!loading && ofertas.length > 0 && (
          <>
            <GrupoOfertas
              titulo="Activas ahora" lista={activas} colorAccent="#10b981"
              onEditar={abrirEditar} onEliminar={setOfertaEliminar}
              icon={<IconCheck width={14} height={14} strokeWidth={2.5} style={{ color: "#10b981" }} />}
              darkMode={darkMode}
            />
            <GrupoOfertas
              titulo="Próximas" lista={proximas} colorAccent="#3b82f6"
              onEditar={abrirEditar} onEliminar={setOfertaEliminar}
              icon={<IconCalendar width={14} height={14} strokeWidth={2.5} style={{ color: "#3b82f6" }} />}
              darkMode={darkMode}
            />
            <GrupoOfertas
              titulo="Vencidas" lista={vencidas} colorAccent="#6b7280"
              onEditar={abrirEditar} onEliminar={setOfertaEliminar}
              icon={<IconLock width={14} height={14} strokeWidth={2.5} style={{ color: "#6b7280" }} />}
              darkMode={darkMode}
            />
          </>
        )}
      </div>

      {/* Modal eliminar */}
      {ofertaEliminar && (
        <ModalEliminarOferta
          oferta={ofertaEliminar}
          onClose={() => setOfertaEliminar(null)}
          onEliminado={() => { setOfertaEliminar(null); cargar(); }}
          darkMode={darkMode}
        />
      )}
    </>
  );
}
