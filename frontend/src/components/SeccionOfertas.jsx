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
function CustomDateTimePicker({ value, onChange, minDate, label, placeholder, alignRight = false }) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  const parsedDate = value ? new Date(value) : null;
  const [viewDate, setViewDate] = useState(() => parsedDate || new Date());
  
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
          color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em"
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
          border: `1.5px solid ${abierto ? "#7A1E3A" : "#e5e7eb"}`,
          background: "white", cursor: "pointer",
          boxShadow: abierto ? "0 0 0 3px rgba(122,30,58,0.1)" : "none",
          transition: "all 0.15s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "#7A1E3A12", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#7A1E3A"
          }}>
            <IconCalendar width={15} height={15} strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: "0.88rem", fontWeight: value ? 700 : 500,
            color: value ? "#1f2937" : "#9ca3af"
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
          zIndex: 9999, background: "white", borderRadius: "16px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
          border: "1.5px solid #e5e7eb", padding: "16px",
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
                  background: "#f9fafb", border: "1px solid #e5e7eb",
                  color: "#4b5563", fontSize: "0.72rem", fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fdf7f8"; e.currentTarget.style.borderColor = "#7A1E3A"; e.currentTarget.style.color = "#7A1E3A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#4b5563"; }}
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
                border: "1px solid #e5e7eb", background: "white",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: "#374151"
              }}
            >
              ⟨
            </button>
            <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "#1f2937" }}>
              {meses[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{
                width: "28px", height: "28px", borderRadius: "6px",
                border: "1px solid #e5e7eb", background: "white",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: "#374151"
              }}
            >
              ⟩
            </button>
          </div>

          {/* Días de la semana */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: "2px", marginBottom: "6px" }}>
            {diasSemana.map((d) => (
              <span key={d} style={{ fontSize: "0.72rem", fontWeight: 800, color: "#9ca3af" }}>
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
                  fontSize: "0.76rem", color: "#d1d5db"
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
                    background: esSeleccionado ? "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)" : "transparent",
                    color: esSeleccionado ? "white" : disabled ? "#d1d5db" : esHoy ? "#7A1E3A" : "#1f2937",
                    border: esHoy && !esSeleccionado ? "1.5px solid #7A1E3A" : "none",
                    boxShadow: esSeleccionado ? "0 2px 8px rgba(122,30,58,0.3)" : "none",
                    transition: "all 0.1s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!esSeleccionado && !disabled) e.currentTarget.style.background = "#fdf7f8";
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
            background: "#f9fafb", borderRadius: "10px", padding: "10px 12px",
            border: "1px solid #e5e7eb", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "8px", marginBottom: "12px"
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280" }}>
              ⏰ Hora:
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <select
                value={hour}
                onChange={(e) => cambiarHora(e.target.value)}
                style={{
                  padding: "4px 6px", borderRadius: "6px", border: "1px solid #d1d5db",
                  background: "white", fontSize: "0.8rem", fontWeight: 700, outline: "none"
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
                  padding: "4px 6px", borderRadius: "6px", border: "1px solid #d1d5db",
                  background: "white", fontSize: "0.8rem", fontWeight: 700, outline: "none"
                }}
              >
                {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: "1px solid #d1d5db", marginLeft: "4px" }}>
                {["AM", "PM"].map((ap) => (
                  <button
                    key={ap}
                    type="button"
                    onClick={() => cambiarAmPm(ap)}
                    style={{
                      padding: "4px 7px", fontSize: "0.72rem", fontWeight: 800,
                      background: ampm === ap ? "#7A1E3A" : "white",
                      color: ampm === ap ? "white" : "#6b7280",
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
              background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
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
function FormOferta({ libros, ofertaEditar, onGuardado, onCancelar }) {
  const esEdicion = !!ofertaEditar;

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
    border: "1.5px solid #e5e7eb", borderRadius: "10px",
    fontSize: "0.92rem", outline: "none", fontFamily: "inherit",
    background: "#fafafa", color: "#1f2937",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", marginBottom: "7px",
    fontSize: "0.82rem", fontWeight: 700,
    color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em"
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
      background: "white", borderRadius: "16px",
      border: "1.5px solid #e5e7eb",
      boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
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
            onFocus={(e) => { e.target.style.borderColor = "#7A1E3A"; e.target.style.boxShadow = "0 0 0 3px rgba(122,30,58,0.1)"; }}
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
                    border: seleccionado ? "2px solid #7A1E3A" : "1.5px solid #e5e7eb",
                    background: seleccionado ? "#fdf7f8" : "#fafafa",
                    boxShadow: seleccionado ? "0 4px 14px rgba(122,30,58,0.12)" : "none",
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
                    background: seleccionado ? "#7A1E3A" : opc.badgeBg,
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
                      color: seleccionado ? "#7A1E3A" : "#1f2937",
                      marginBottom: "2px"
                    }}>
                      {opc.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.2 }}>
                      {opc.desc}
                    </div>
                  </div>
                  {seleccionado && (
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "#7A1E3A", color: "white",
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
          background: "#fafafa", borderRadius: "14px", border: "1.5px solid #e5e7eb",
          padding: "18px 20px", marginBottom: "22px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
            <IconCalendar width={16} height={16} strokeWidth={2.2} style={{ color: "#7A1E3A" }} />
            <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "#1f2937" }}>
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
            />
            <CustomDateTimePicker
              label="Fecha y hora de fin *"
              value={form.fecha_fin}
              minDate={form.fecha_inicio || fechaMinima}
              placeholder="Seleccionar fin..."
              alignRight={true}
              onChange={(val) => setForm((prev) => ({ ...prev, fecha_fin: val }))}
            />
          </div>
        </div>

        {/* Sección Libros Incluidos (Acordeón desplegable + fotos) */}
        <div style={{
          background: "#fafafa", borderRadius: "14px", border: "1.5px solid #e5e7eb",
          overflow: "hidden", marginBottom: "22px"
        }}>
          {/* Header del acordeón */}
          <div style={{
            padding: "16px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
            background: librosDesplegados ? "#f4f4f5" : "transparent",
            borderBottom: librosDesplegados ? "1.5px solid #e5e7eb" : "none",
            transition: "background 0.15s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: "#7A1E3A18", display: "flex", alignItems: "center",
                justifyContent: "center"
              }}>
                <IconBookOpen width={16} height={16} strokeWidth={2.2} style={{ color: "#7A1E3A" }} />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "#1f2937" }}>
                  Libros incluidos en la oferta
                </span>
                <span style={{
                  marginLeft: "8px",
                  background: form.ids_libros.length > 0 ? "#7A1E3A" : "#e5e7eb",
                  color: form.ids_libros.length > 0 ? "white" : "#6b7280",
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
                      background: "white", border: "1px solid #d1d5db",
                      color: "#374151", fontSize: "0.76rem", fontWeight: 700,
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
                      background: "white", border: "1px solid #d1d5db",
                      color: "#6b7280", fontSize: "0.76rem", fontWeight: 700,
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
                  background: librosDesplegados ? "#7A1E3A" : "white",
                  border: `1.5px solid ${librosDesplegados ? "#7A1E3A" : "#d1d5db"}`,
                  color: librosDesplegados ? "white" : "#374151",
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
                <div style={{ color: "#6b7280", fontSize: "0.84rem" }}>
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
                    border: "1.5px solid #e5e7eb", borderRadius: "8px",
                    fontSize: "0.85rem", background: "white", outline: "none",
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
                      border: `1.5px solid ${sel ? "#7A1E3A" : "#e5e7eb"}`,
                      background: sel ? "#fdf7f8" : "white",
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
                          color: "#1f2937", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>
                          {libro.titulo}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#6b7280" }}>
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
              border: "1.5px solid #e5e7eb", background: "white",
              color: "#374151", fontWeight: 700, cursor: "pointer",
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
function ModalEliminarOferta({ oferta, onClose, onEliminado }) {
  const [cargando, setCargando] = useState(false);
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
          background: "white", borderRadius: "16px", padding: "28px",
          maxWidth: "420px", width: "95%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
        }}
      >
        <div style={{
          width: "56px", height: "56px", borderRadius: "14px",
          background: "#fef2f2", display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: "16px"
        }}>
          <IconTrash width={26} height={26} strokeWidth={2} style={{ color: "#dc2626" }} />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: "1.15rem", color: "#1f2937" }}>Eliminar oferta</h2>
        <p style={{ color: "#6b7280", marginBottom: "6px", fontSize: "0.92rem" }}>
          ¿Eliminar <strong style={{ color: "#1f2937" }}>"{oferta.nombre_oferta}"</strong>?
        </p>
        <p style={{ fontSize: "0.82rem", color: "#9ca3af", marginBottom: "20px" }}>
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
              border: "1.5px solid #e5e7eb", background: "white",
              color: "#374151", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem"
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
function TarjetaOferta({ oferta, onEditar, onEliminar }) {
  const estado = ESTADO_CONFIG[oferta.estado] || ESTADO_CONFIG.vencida;
  const descuento = labelTipo(oferta.tipo_descuento, oferta.valor_descuento);
  const vencida = oferta.estado === "vencida";

  return (
    <div
      style={{
        background: "white", borderRadius: "14px",
        border: `1.5px solid ${estado.cardBorder}`,
        boxShadow: `0 2px 10px ${estado.cardGlow}`,
        overflow: "hidden",
        opacity: vencida ? 0.72 : 1,
        transition: "transform 0.15s, box-shadow 0.15s"
      }}
      onMouseEnter={(e) => {
        if (!vencida) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 6px 20px ${estado.cardGlow.replace("0.08", "0.18")}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = `0 2px 10px ${estado.cardGlow}`;
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
              color: "#1f2937", lineHeight: 1.3,
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
          fontSize: "0.78rem", color: "#6b7280",
          marginBottom: "14px", flexWrap: "nowrap"
        }}>
          <IconCalendar width={13} height={13} strokeWidth={2} style={{ color: "#9ca3af", flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap" }}>{formatFecha(oferta.fecha_inicio)}</span>
          <span style={{ color: "#d1d5db", flexShrink: 0 }}>→</span>
          <span style={{ whiteSpace: "nowrap" }}>{formatFecha(oferta.fecha_fin)}</span>
        </div>

        {/* Fila 3: Libros + Botones */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "12px", borderTop: "1px solid #f3f4f6"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", color: "#9ca3af" }}>
            <IconBookOpen width={13} height={13} strokeWidth={2} style={{ color: "#c4c9d4" }} />
            <span>{oferta.total_libros} libro{oferta.total_libros !== 1 ? "s" : ""}</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => onEditar(oferta)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 12px", borderRadius: "8px",
                background: "#f3f4f6", border: "1px solid #e5e7eb",
                color: "#374151", fontWeight: 700, cursor: "pointer",
                fontSize: "0.78rem", transition: "background 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
            >
              <IconEdit width={12} height={12} strokeWidth={2.2} /> Editar
            </button>
            <button
              onClick={() => onEliminar(oferta)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 12px", borderRadius: "8px",
                background: "#fef2f2", border: "1px solid #fecaca",
                color: "#dc2626", fontWeight: 700, cursor: "pointer",
                fontSize: "0.78rem", transition: "background 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
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
function GrupoOfertas({ titulo, lista, colorAccent, icon, onEditar, onEliminar }) {
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
          <TarjetaOferta key={o.id_oferta} oferta={o} onEditar={onEditar} onEliminar={onEliminar} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  COMPONENTE PRINCIPAL — SeccionOfertas
// ══════════════════════════════════════════════
export default function SeccionOfertas() {
  const [ofertas,        setOfertas]        = useState([]);
  const [libros,         setLibros]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [mostrarForm,    setMostrarForm]    = useState(false);
  const [ofertaEditar,   setOfertaEditar]   = useState(null);
  const [ofertaEliminar, setOfertaEliminar] = useState(null);

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
        background: "white", borderRadius: "16px",
        border: "1.5px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
            <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 900, color: "#1f2937" }}>
              Promociones y descuentos
            </h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280", marginTop: "2px" }}>
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
        />
      )}

      {/* Contenedor principal de ofertas */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        border: "1.5px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
            border: "2px dashed #e5e7eb", borderRadius: "14px",
            padding: "60px 20px", textAlign: "center"
          }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px",
              background: "#fdf7f8", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <IconTag width={30} height={30} strokeWidth={1.8} style={{ color: "#C5425A" }} />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#1f2937", fontSize: "1.05rem" }}>Sin promociones todavía</h3>
            <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: "0.88rem" }}>
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
            />
            <GrupoOfertas
              titulo="Próximas" lista={proximas} colorAccent="#3b82f6"
              onEditar={abrirEditar} onEliminar={setOfertaEliminar}
              icon={<IconCalendar width={14} height={14} strokeWidth={2.5} style={{ color: "#3b82f6" }} />}
            />
            <GrupoOfertas
              titulo="Vencidas" lista={vencidas} colorAccent="#6b7280"
              onEditar={abrirEditar} onEliminar={setOfertaEliminar}
              icon={<IconLock width={14} height={14} strokeWidth={2.5} style={{ color: "#6b7280" }} />}
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
        />
      )}
    </>
  );
}
