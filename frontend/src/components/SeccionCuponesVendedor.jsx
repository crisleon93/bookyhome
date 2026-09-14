import { useState, useEffect, useCallback } from "react";
import { getCuponesTienda, crearCupon, editarCupon, eliminarCupon } from "../services/api";
import { notify } from "./ToastProvider";
import {
  IconTag,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconGift,
  IconDollar,
  IconRefresh,
  IconEye,
} from "./Icons";

// ── Helpers de presentación ──
const formatoPrecio = (v) => {
  if (v == null) return "—";
  return "$" + Number(v).toLocaleString("es-CO");
};

const formatoFecha = (f) => {
  if (!f) return "Sin límite";
  const d = new Date(f);
  if (isNaN(d.getTime())) return "Sin límite";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const ESTADOS = {
  activo:   { label: "Activo",   color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", stripe: "#10b981" },
  proximo:  { label: "Próximo",  color: "#1e40af", bg: "#dbeafe", border: "#93c5fd", stripe: "#3b82f6" },
  vencido:  { label: "Vencido",  color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db", stripe: "#9ca3af" },
  inactivo: { label: "Inactivo", color: "#b45309", bg: "#fef3c7", border: "#fcd34d", stripe: "#f59e0b" },
};

const getEstado = (c) => {
  if (!c.activo) return "inactivo";
  const ahora = new Date();
  const fin = c.fecha_fin ? new Date(c.fecha_fin) : null;
  const inicio = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
  if (fin && fin.getTime() < ahora.getTime()) return "vencido";
  if (inicio && inicio.getTime() > ahora.getTime()) return "proximo";
  return "activo";
};

const getDescuento = (c) => {
  if (c.tipo_descuento === "porcentaje") {
    return { texto: String(c.valor_descuento), unidad: "%", sub: "descuento" };
  }
  return { texto: formatoPrecio(c.valor_descuento), unidad: "", sub: "descuento" };
};

// ── Tarjeta de cupón ──
function TarjetaCupon({ coupon, onEditar, onEliminar, onToggle, darkMode = false }) {
  const estado = getEstado(coupon);
  const cfg = ESTADOS[estado];
  const descuento = getDescuento(coupon);
  const usosActuales = coupon.usos_actuales || 0;
  const agotado = coupon.usos_maximos && usosActuales >= coupon.usos_maximos;
  const pct = coupon.usos_maximos
    ? Math.min(100, Math.round((usosActuales / coupon.usos_maximos) * 100))
    : 0;
  const apagado = estado === "vencido" || estado === "inactivo";
  const cardBg = darkMode ? "#262626" : "#ffffff";
  const textColor = darkMode ? "#f3f4f6" : "#1f2937";
  const mutedColor = darkMode ? "#c5c5c5" : "#6b7280";
  const secondaryBg = darkMode ? "rgba(255, 79, 131, 0.1)" : "#fdf7f8";
  const track = darkMode ? "#313131" : "#f3f4f6";

  return (
    <div
      style={{
        background: cardBg, borderRadius: "14px",
        border: `1.5px solid ${darkMode ? "#4a4a4a" : cfg.border}`,
        boxShadow: darkMode ? "0 2px 14px rgba(0,0,0,0.24), inset 0 0 0 1px rgba(255,255,255,0.02)" : "0 2px 10px rgba(0,0,0,0.04)",
        overflow: "hidden",
        opacity: apagado ? 0.92 : 1,
        transition: "transform 0.15s, box-shadow 0.15s"
      }}
      onMouseEnter={(e) => {
        if (!apagado) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)";
      }}
    >
      {/* Franja superior */}
      <div style={{ height: "5px", background: `linear-gradient(90deg, ${cfg.stripe}, ${cfg.border})` }} />

      <div style={{ padding: "18px 18px 14px" }}>
        {/* Fila 1: etiqueta + código + badge descuento */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "14px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "0.68rem", fontWeight: 800, color: darkMode ? "#ffbfd0" : "#7A1E3A",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px"
            }}>
              <IconTag width={13} height={13} strokeWidth={2} style={{ color: darkMode ? "#ff4f83" : "#7A1E3A" }} />
              Código promocional
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "7px 14px", borderRadius: "10px",
              background: secondaryBg,
              border: `1.5px dashed ${darkMode ? "#ff4f83" : cfg.stripe}`,
              boxShadow: darkMode ? "inset 0 0 0 1px rgba(255,79,131,0.08)" : "none",
              fontFamily: "'Courier New', monospace",
              fontSize: "1.02rem", fontWeight: 800, letterSpacing: "1px",
              color: textColor,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: "200px"
            }}>
              {coupon.codigo_cupon}
            </div>
          </div>

          {/* Badge descuento */}
          <div style={{
            flexShrink: 0, textAlign: "center", borderRadius: "12px",
            minWidth: "72px", padding: "8px 12px",
            background: !apagado
              ? "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)"
              : "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)",
            color: "white", boxShadow: "0 3px 10px rgba(0,0,0,0.12)"
          }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap" }}>
              {descuento.texto}{descuento.unidad}
            </div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, opacity: 0.85, marginTop: "3px" }}>
              {descuento.sub}
            </div>
          </div>
        </div>

        {/* Fila 2: estado (clic para alternar) + % usado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "14px" }}>
          <button
            onClick={onToggle}
            title={coupon.activo ? "Haz clic para desactivar" : "Haz clic para activar"}
            style={{
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px",
              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
              padding: "4px 11px", borderRadius: "20px", fontSize: "0.75rem",
              fontWeight: 800, fontFamily: "inherit", transition: "filter 0.15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.95)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            {cfg.label}
          </button>

          {coupon.usos_maximos && (
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: agotado ? "#fca5a5" : mutedColor }}>
              {agotado ? "Agotado" : `${pct}% usado`}
            </span>
          )}
        </div>

        {/* Progreso de usos */}
        {coupon.usos_maximos ? (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ height: "6px", borderRadius: "99px", background: track, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: "99px",
                background: agotado ? "#ef4444" : "linear-gradient(90deg, #7A1E3A, #C5425A)",
                transition: "width 0.4s ease"
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.72rem", color: mutedColor }}>
              <span>{usosActuales} usos realizados</span>
              <span style={{ fontWeight: 800 }}>máx. {coupon.usos_maximos}</span>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "14px", fontSize: "0.78rem", color: mutedColor, display: "flex", alignItems: "center", gap: "6px" }}>
            <span>{usosActuales} usos realizados</span>
            <span style={{ color: darkMode ? "#9ca3af" : "#9ca3af" }}>·</span>
            <span style={{ fontWeight: 700 }}>Usos ilimitados</span>
          </div>
        )}

        {/* Detalles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", borderTop: `1px solid ${darkMode ? "#3a3a3a" : "#f3f4f6"}`, paddingTop: "12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.8rem", color: darkMode ? "#d1d5db" : "#4b5563" }}>
            <IconDollar width={13} height={13} strokeWidth={2} style={{ color: darkMode ? "#ff4f83" : "#c4c9d4", flexShrink: 0 }} />
            <span style={{ lineHeight: 1.3 }}>
              Compra mínima
              <div style={{ fontWeight: 800, color: textColor }}>
                {coupon.minimo_compra > 0 ? formatoPrecio(coupon.minimo_compra) : "Sin mínimo"}
              </div>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.8rem", color: darkMode ? "#d1d5db" : "#4b5563" }}>
            <IconCalendar width={13} height={13} strokeWidth={2} style={{ color: darkMode ? "#ff4f83" : "#c4c9d4", flexShrink: 0 }} />
            <span style={{ lineHeight: 1.3 }}>
              Vigencia
              <div style={{ fontWeight: 800, color: textColor }}>
                {coupon.fecha_fin ? `Hasta ${formatoFecha(coupon.fecha_fin)}` : "Sin límite"}
              </div>
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: "8px", borderTop: `1px solid ${darkMode ? "#3a3a3a" : "#f3f4f6"}`, paddingTop: "12px" }}>
          <button
            onClick={() => onEditar(coupon)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
              padding: "8px 0", borderRadius: "9px", background: darkMode ? "#2a2a2a" : "#f3f4f6",
              border: `1px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}`, color: darkMode ? "#f3f4f6" : "#374151", fontWeight: 700,
              fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = darkMode ? "#323232" : "#e5e7eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = darkMode ? "#2a2a2a" : "#f3f4f6"; }}
          >
            <IconEdit width={13} height={13} strokeWidth={2.2} /> Editar
          </button>
          <button
            onClick={() => onEliminar(coupon)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
              padding: "8px 0", borderRadius: "9px", background: darkMode ? "#2d171d" : "#fef2f2",
              border: `1px solid ${darkMode ? "#5b2b37" : "#fecaca"}`, color: darkMode ? "#fca5a5" : "#dc2626", fontWeight: 700,
              fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = darkMode ? "#3c1f29" : "#fee2e2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = darkMode ? "#2d171d" : "#fef2f2"; }}
          >
            <IconTrash width={13} height={13} strokeWidth={2.2} /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  COMPONENTE PRINCIPAL — SeccionCuponesVendedor
// ══════════════════════════════════════════════
export default function SeccionCuponesVendedor({ tiendaId, darkMode = false }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [form, setForm] = useState({
    codigo_cupon: "",
    tipo_descuento: "porcentaje",
    valor_descuento: "",
    minimo_compra: "",
    usos_maximos: "",
    fecha_inicio: "",
    fecha_fin: "",
    activo: true,
  });

  const cargarCupones = useCallback(() => {
    if (!tiendaId) return;
    setLoading(true);
    getCuponesTienda(tiendaId)
      .then((res) => {
        setCoupons(res.data || []);
      })
      .catch((err) => {
        console.error("Error cargando cupones de tienda:", err);
        notify("Error al cargar cupones de tienda", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tiendaId]);

  useEffect(() => {
    if (!tiendaId) return;
    let activo = true;
    queueMicrotask(() => {
      if (activo) setLoading(true);
    });
    getCuponesTienda(tiendaId)
      .then((res) => { if (activo) setCoupons(res.data || []); })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando cupones:", err);
        notify("Error al cargar cupones de tienda", "error");
      })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [tiendaId]);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm({
      codigo_cupon: "",
      tipo_descuento: "porcentaje",
      valor_descuento: "",
      minimo_compra: "0",
      usos_maximos: "100",
      fecha_inicio: "",
      fecha_fin: "",
      activo: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      codigo_cupon: coupon.codigo_cupon,
      tipo_descuento: coupon.tipo_descuento,
      valor_descuento: String(coupon.valor_descuento),
      minimo_compra: String(coupon.minimo_compra || 0),
      usos_maximos: String(coupon.usos_maximos || 1),
      fecha_inicio: coupon.fecha_inicio ? coupon.fecha_inicio.substring(0, 16) : "",
      fecha_fin: coupon.fecha_fin ? coupon.fecha_fin.substring(0, 16) : "",
      activo: !!coupon.activo,
    });
    setShowModal(true);
  };

  const generarCodigo = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
    for (let i = 0; i < 8; i++) {
      codigo += chars[Math.floor(Math.random() * chars.length)];
    }
    setForm((f) => ({ ...f, codigo_cupon: codigo }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.codigo_cupon.trim()) {
      notify("El código del cupón es obligatorio", "error");
      return;
    }
    if (!form.valor_descuento || Number(form.valor_descuento) <= 0) {
      notify("El valor del descuento debe ser mayor a 0", "error");
      return;
    }

    const payload = {
      codigo_cupon: form.codigo_cupon.toUpperCase(),
      tipo_descuento: form.tipo_descuento,
      valor_descuento: Number(form.valor_descuento),
      minimo_compra: Number(form.minimo_compra || 0),
      usos_maximos: Number(form.usos_maximos || 1),
      fecha_inicio: form.fecha_inicio ? form.fecha_inicio.replace("T", " ") : null,
      fecha_fin: form.fecha_fin ? form.fecha_fin.replace("T", " ") : null,
      activo: form.activo ? 1 : 0,
    };

    if (editingCoupon) {
      editarCupon(editingCoupon.id_cupon, payload)
        .then(() => {
          notify("Cupón actualizado correctamente", "success");
          setShowModal(false);
          cargarCupones();
        })
        .catch((err) => {
          notify(err.response?.data?.detail || "Error al actualizar cupón", "error");
        });
    } else {
      payload.id_tienda = tiendaId;
      crearCupon(payload)
        .then(() => {
          notify("Cupón creado correctamente", "success");
          setShowModal(false);
          cargarCupones();
        })
        .catch((err) => {
          notify(err.response?.data?.detail || "Error al crear cupón", "error");
        });
    }
  };

  const handleDelete = (idCupon) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este cupón?")) {
      eliminarCupon(idCupon)
        .then((res) => {
          notify(res.data?.mensaje || "Cupón eliminado correctamente", "success");
          cargarCupones();
        })
        .catch((err) => {
          notify(err.response?.data?.detail || "Error al eliminar cupón", "error");
        });
    }
  };

  const handleToggleActivo = (coupon) => {
    editarCupon(coupon.id_cupon, { activo: coupon.activo ? 0 : 1 })
      .then(() => {
        notify(`Cupón ${coupon.activo ? "desactivado" : "activado"} correctamente`, "success");
        cargarCupones();
      })
      .catch(() => {
        notify("Error al cambiar estado del cupón", "error");
      });
  };

  const activos = coupons.filter((c) => {
    const st = getEstado(c);
    return st === "activo" || st === "proximo";
  });
  const totalUsos = coupons.reduce((acc, c) => acc + (c.usos_actuales || 0), 0);

  // ── Estilos compartidos del formulario ──
  const labelStyle = {
    display: "block", marginBottom: "7px",
    fontSize: "0.78rem", fontWeight: 700,
    color: darkMode ? "#f3f4f6" : "#374151", textTransform: "uppercase", letterSpacing: "0.04em"
  };
  const inputStyle = {
    width: "100%", padding: "11px 14px",
    border: `1.5px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}`, borderRadius: "10px",
    fontSize: "0.9rem", outline: "none", fontFamily: "inherit",
    background: darkMode ? "#181818" : "#fafafa", color: darkMode ? "#f3f4f6" : "#1f2937",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box"
  };
  const onFocusInput = (e) => {
    e.currentTarget.style.borderColor = darkMode ? "#ff4f83" : "#7A1E3A";
    e.currentTarget.style.boxShadow = darkMode ? "0 0 0 3px rgba(255,79,131,0.15)" : "0 0 0 3px rgba(122,30,58,0.1)";
    e.currentTarget.style.background = darkMode ? "#1f1f1f" : "#fff";
  };
  const onBlurInput = (e) => {
    e.currentTarget.style.borderColor = darkMode ? "#3a3a3a" : "#e5e7eb";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.background = darkMode ? "#181818" : "#fafafa";
  };

  const tiposDescuento = [
    { tipo: "porcentaje", icon: "%", label: "Porcentaje", desc: "Descuento porcentual" },
    { tipo: "fijo", icon: "$", label: "Monto fijo", desc: "Descuento en COP" },
  ];

  const modalBg = darkMode ? "#1f1f1f" : "#ffffff";
  const modalBorder = darkMode ? "#3a3a3a" : "#e5e7eb";
  const modalText = darkMode ? "#f3f4f6" : "#1f2937";
  const modalMuted = darkMode ? "#b8b8b8" : "#6b7280";
  const pinkAccent = darkMode ? "#ff4f83" : "#7A1E3A";
  const pinkSoft = darkMode ? "rgba(255, 79, 131, 0.12)" : "#fdf7f8";

  return (
    <>
      {/* Header */}
      <div style={{
        background: darkMode ? "#1f1f1f" : "white", borderRadius: "16px",
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
              Cupones de descuento
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: darkMode ? "#b8b8b8" : "#6b7280" }}>
              {activos.length > 0
                ? `${activos.length} activo${activos.length > 1 ? "s" : ""} ahora · ${coupons.length} en total`
                : `${coupons.length} cupón${coupons.length !== 1 ? "es" : ""} creado${coupons.length !== 1 ? "s" : ""}`
              }
            </p>
          </div>
        </div>

        {/* Stats + botón */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { label: "Activos", value: activos.length, color: "#10b981", bg: darkMode ? "rgba(16,185,129,0.15)" : "#d1fae5" },
            { label: "Usos", value: totalUsos, color: "#3b82f6", bg: darkMode ? "rgba(59,130,246,0.15)" : "#dbeafe" },
            { label: "Total", value: coupons.length, color: darkMode ? "#ff4f83" : "#7A1E3A", bg: darkMode ? "rgba(255,79,131,0.12)" : "#fbe8ee" },
          ].map((s) => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: "10px",
              padding: "8px 14px", textAlign: "center", minWidth: "58px"
            }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: s.color, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}

          <button
            onClick={handleOpenCreate}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "11px 20px", borderRadius: "12px",
              background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
              border: "none", color: "white", fontWeight: 800,
              cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(122,30,58,0.3)",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(122,30,58,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(122,30,58,0.3)"; }}
          >
            <IconPlus width={17} height={17} strokeWidth={2.5} style={{ color: "white" }} />
            Nuevo cupón
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{
        background: darkMode ? "#1f1f1f" : "white",
        borderRadius: "16px",
        border: `1.5px solid ${darkMode ? "#3a3a3a" : "#e5e7eb"}`,
        boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.22)" : "0 2px 8px rgba(0,0,0,0.05)",
        padding: "24px 28px"
      }}>
        {loading && (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
            Cargando cupones…
          </div>
        )}

        {!loading && coupons.length === 0 && (
          <div style={{ border: `2px dashed ${darkMode ? "#3a3a3a" : "#e5e7eb"}`, borderRadius: "14px", padding: "56px 20px", textAlign: "center" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px",
              background: darkMode ? "rgba(255,79,131,0.12)" : "#fdf7f8", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <IconGift width={30} height={30} strokeWidth={1.8} style={{ color: darkMode ? "#ff4f83" : "#C5425A" }} />
            </div>
            <h3 style={{ margin: "0 0 8px", color: darkMode ? "#f3f4f6" : "#1f2937", fontSize: "1.05rem" }}>Sin cupones todavía</h3>
            <p style={{ margin: "0 0 20px", color: darkMode ? "#b8b8b8" : "#6b7280", fontSize: "0.88rem" }}>
              Crea tu primer cupón de descuento para incentivar las ventas
            </p>
            <button
              onClick={handleOpenCreate}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "11px 24px", borderRadius: "12px",
                background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
                border: "none", color: "white", fontWeight: 800, fontFamily: "inherit",
                cursor: "pointer", fontSize: "0.9rem",
                boxShadow: "0 4px 14px rgba(122,30,58,0.25)"
              }}
            >
              <IconPlus width={16} height={16} strokeWidth={2.5} style={{ color: "white" }} />
              Crear primer cupón
            </button>
          </div>
        )}

        {!loading && coupons.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {coupons.map((coupon) => (
              <TarjetaCupon
                key={coupon.id_cupon}
                coupon={coupon}
                onEditar={handleOpenEdit}
                onEliminar={() => handleDelete(coupon.id_cupon)}
                onToggle={() => handleToggleActivo(coupon)}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)", padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: modalBg, borderRadius: "16px",
              width: "min(880px, 100%)", maxHeight: "94vh",
              overflow: "hidden", boxShadow: darkMode ? "0 24px 70px rgba(0,0,0,0.45)" : "0 24px 70px rgba(36,20,27,0.3)",
              display: "flex", flexDirection: "column", border: `1.5px solid ${modalBorder}`
            }}
          >
            {/* Header con degradado */}
            <div style={{
              background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
              padding: "20px 26px", display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: "12px", flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "11px",
                  background: "rgba(255,255,255,0.2)", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <IconGift width={21} height={21} strokeWidth={2.2} style={{ color: "white" }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: "white", fontSize: "1.1rem", fontWeight: 800 }}>
                    {editingCoupon ? "Editar cupón" : "Nuevo cupón"}
                  </h2>
                  <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>
                    {editingCoupon ? "Actualiza los datos de tu código" : "Crea un código de descuento para tus clientes"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
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

            {/* Cuerpo: dos columnas */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex", gap: "28px", flexWrap: "wrap",
                padding: "26px", overflowY: "auto", flex: 1,
                background: darkMode ? "#121212" : "#ffffff"
              }}
            >
              {/* ── Columna formulario ── */}
              <div style={{ flex: "1 1 380px", minWidth: 0 }}>
                {/* Código */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={labelStyle}>Código del cupón *</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={form.codigo_cupon}
                      onChange={(e) => setForm({ ...form, codigo_cupon: e.target.value })}
                      placeholder="Ejem: PROMO20"
                      maxLength={20}
                      onFocus={onFocusInput}
                      onBlur={onBlurInput}
                      style={{
                        ...inputStyle, textTransform: "uppercase",
                        fontFamily: "'Courier New', monospace",
                        fontSize: "1rem", fontWeight: 800, letterSpacing: "1px", flex: 1
                      }}
                    />
                    <button
                      type="button"
                      onClick={generarCodigo}
                      title="Generar código aleatorio"
                      style={{
                        width: "46px", flexShrink: 0, borderRadius: "10px",
                        background: "#f3f4f6", border: "1.5px solid #e5e7eb",
                        color: "#7A1E3A", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7A1E3A"; e.currentTarget.style.background = "#fdf7f8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f3f4f6"; }}
                    >
                      <IconRefresh width={17} height={17} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>

                {/* Tipo de descuento (tarjetas) */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={labelStyle}>Tipo de descuento *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {tiposDescuento.map((t) => {
                      const seleccionado = form.tipo_descuento === t.tipo;
                      return (
                        <div
                          key={t.tipo}
                          onClick={() => setForm({ ...form, tipo_descuento: t.tipo, valor_descuento: "" })}
                          style={{
                            padding: "13px 15px", borderRadius: "12px", cursor: "pointer",
                            border: seleccionado ? `2px solid ${darkMode ? "#ff4f83" : "#7A1E3A"}` : `1.5px solid ${modalBorder}`,
                            background: seleccionado ? (darkMode ? "#2a1a24" : "#fdf7f8") : (darkMode ? "#1f1f1f" : "#fafafa"),
                            boxShadow: seleccionado ? `0 3px 12px ${darkMode ? "rgba(255,79,131,0.18)" : "rgba(122,30,58,0.1)"}` : "none",
                            transition: "all 0.18s ease",
                            display: "flex", alignItems: "center", gap: "11px"
                          }}
                        >
                          <div style={{
                            width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
                            background: seleccionado ? (darkMode ? "#ff4f83" : "#7A1E3A") : (darkMode ? "#2a2a2a" : "#f3f4f6"),
                            color: seleccionado ? "white" : (darkMode ? "#f3f4f6" : "#6b7280"),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1.05rem", fontWeight: 800
                          }}>
                            {t.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: "0.88rem", color: seleccionado ? (darkMode ? "#ff4f83" : "#7A1E3A") : modalText }}>
                              {t.label}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: modalMuted }}>{t.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Valor */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={labelStyle}>
                    {form.tipo_descuento === "porcentaje" ? "Valor del descuento (%) *" : "Valor del descuento (COP) *"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      value={form.valor_descuento}
                      onChange={(e) => setForm({ ...form, valor_descuento: e.target.value })}
                      placeholder={form.tipo_descuento === "porcentaje" ? "Ej: 20" : "Ej: 10000"}
                      min="1"
                      max={form.tipo_descuento === "porcentaje" ? 100 : undefined}
                      onFocus={onFocusInput}
                      onBlur={onBlurInput}
                      style={{ ...inputStyle, paddingRight: "64px", fontWeight: 700 }}
                    />
                    <span style={{
                      position: "absolute", right: "14px", top: "50%",
                      transform: "translateY(-50%)", fontWeight: 800,
                      color: "#7A1E3A", fontSize: "0.8rem", pointerEvents: "none"
                    }}>
                      {form.tipo_descuento === "porcentaje" ? "% DTO" : "COP"}
                    </span>
                  </div>
                  {/* Accesos rápidos */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "9px" }}>
                    {(form.tipo_descuento === "porcentaje" ? ["10", "15", "20", "25", "30"] : ["5000", "10000", "20000", "50000", "100000"]).map((v) => {
                      const activo = form.valor_descuento === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm({ ...form, valor_descuento: v })}
                          style={{
                            padding: "4px 11px", borderRadius: "8px",
                            background: activo ? "#7A1E3A" : "#f3f4f6",
                            color: activo ? "white" : "#4b5563",
                            border: `1px solid ${activo ? "#7A1E3A" : "#e5e7eb"}`,
                            fontSize: "0.75rem", fontWeight: 800, cursor: "pointer",
                            fontFamily: "inherit", transition: "all 0.15s"
                          }}
                        >
                          {form.tipo_descuento === "porcentaje" ? `${v}%` : formatoPrecio(v)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mínimo + usos */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
                  <div>
                    <label style={labelStyle}>Compra mínima</label>
                    <input
                      type="number"
                      value={form.minimo_compra}
                      onChange={(e) => setForm({ ...form, minimo_compra: e.target.value })}
                      placeholder="0"
                      min="0"
                      onFocus={onFocusInput}
                      onBlur={onBlurInput}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Usos máximos</label>
                    <input
                      type="number"
                      value={form.usos_maximos}
                      onChange={(e) => setForm({ ...form, usos_maximos: e.target.value })}
                      placeholder="100"
                      min="1"
                      onFocus={onFocusInput}
                      onBlur={onBlurInput}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Fechas */}
                <div style={{
                  background: darkMode ? "#181818" : "#fafafa", borderRadius: "12px",
                  border: `1.5px solid ${modalBorder}`, padding: "16px", marginBottom: "18px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "8px",
                      background: pinkSoft, border: `1px solid ${darkMode ? "rgba(255,79,131,0.35)" : "#f7d4de"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: darkMode ? "0 0 0 1px rgba(255,79,131,0.08)" : "none"
                    }}>
                      <IconCalendar width={15} height={15} strokeWidth={2.2} style={{ color: pinkAccent }} />
                    </div>
                    <span style={{ fontSize: "0.84rem", fontWeight: 800, color: modalText }}>
                      Vigencia del cupón
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", minWidth: 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <label style={labelStyle}>Inicio</label>
                      <input
                        type="datetime-local"
                        value={form.fecha_inicio}
                        onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                        style={{ ...inputStyle, minWidth: 0 }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <label style={labelStyle}>Fin</label>
                      <input
                        type="datetime-local"
                        value={form.fecha_fin}
                        onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                        style={{ ...inputStyle, minWidth: 0 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Activo */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderRadius: "12px", border: `1.5px solid ${modalBorder}`,
                  background: form.activo ? (darkMode ? "rgba(16,185,129,0.12)" : "#f0fdf4") : (darkMode ? "#181818" : "#fafafa"),
                  padding: "12px 16px", transition: "background 0.2s"
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.88rem", color: modalText }}>
                      Cupón activo
                    </div>
                    <div style={{ fontSize: "0.76rem", color: modalMuted }}>
                      {form.activo ? "Los clientes podrán usarlo de inmediato" : "Se guardará desactivado (sin uso por clientes)"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, activo: !form.activo })}
                    style={{
                      position: "relative", width: "46px", height: "26px", borderRadius: "99px",
                      background: form.activo ? "#10b981" : "#d1d5db",
                      border: "none", cursor: "pointer", flexShrink: 0,
                      transition: "background 0.2s"
                    }}
                    aria-pressed={form.activo}
                  >
                    <span style={{
                      position: "absolute", top: "3px",
                      left: form.activo ? "23px" : "3px",
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                      transition: "left 0.2s"
                    }} />
                  </button>
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: "12px", marginTop: "22px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: "10px",
                      border: `1.5px solid ${modalBorder}`, background: darkMode ? "#1f1f1f" : "white",
                      color: darkMode ? "#f3f4f6" : "#374151", fontWeight: 700, cursor: "pointer",
                      fontSize: "0.9rem", fontFamily: "inherit"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1, padding: "12px", borderRadius: "10px",
                      background: "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)",
                      border: "none", color: "white", fontWeight: 800, fontFamily: "inherit",
                      cursor: "pointer", fontSize: "0.9rem",
                      boxShadow: "0 4px 14px rgba(122,30,58,0.25)"
                    }}
                  >
                    {editingCoupon ? "Guardar cambios" : "Crear cupón"}
                  </button>
                </div>
              </div>

              {/* ── Columna vista previa ── */}
              <div style={{ flex: "0 1 300px", minWidth: "250px" }}>
                <div style={{
                  position: "sticky", top: 0,
                  background: darkMode ? "#1a1a1a" : "#f8f6f4", borderRadius: "14px",
                  border: `1.5px solid ${modalBorder}`, padding: "18px"
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    fontSize: "0.72rem", fontWeight: 800, color: darkMode ? "#d1d5db" : "#6b7280",
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px"
                  }}>
                    <IconEye width={14} height={14} strokeWidth={2} style={{ color: darkMode ? "#ff4f83" : "#9ca3af" }} />
                    Vista previa
                  </div>

                  {/* Ticket del cupón */}
                  <div style={{
                    background: darkMode ? "#1f1f1f" : "white", borderRadius: "14px",
                    border: `1.5px solid ${modalBorder}`, overflow: "hidden",
                    boxShadow: darkMode ? "0 8px 24px rgba(0,0,0,0.2)" : "0 8px 24px rgba(0,0,0,0.08)"
                  }}>
                    <div style={{
                      height: "6px",
                      background: form.activo
                        ? "linear-gradient(90deg, #10b981, #6ee7b7)"
                        : "linear-gradient(90deg, #f59e0b, #fcd34d)"
                    }} />

                    <div style={{ padding: "22px 20px 16px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{
                        width: "86px", height: "86px", borderRadius: "18px", flexShrink: 0,
                        background: form.activo
                          ? "linear-gradient(135deg, #7A1E3A 0%, #C5425A 100%)"
                          : "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)",
                        color: "white", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.18)"
                      }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 900, lineHeight: 1.05, whiteSpace: "nowrap" }}>
                          {form.valor_descuento ? Math.round(Number(form.valor_descuento)) : "?"}
                          {form.tipo_descuento === "porcentaje" ? "%" : ""}
                        </div>
                        <div style={{ fontSize: "0.6rem", fontWeight: 700, opacity: 0.85, marginTop: "2px" }}>
                          {form.tipo_descuento === "fijo" ? "COP" : "DTO"}
                        </div>
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: "0.62rem", fontWeight: 800, color: "#9ca3af",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px"
                        }}>
                          Código
                        </div>
                        <div style={{
                          display: "inline-flex", alignItems: "center",
                          padding: "7px 13px", borderRadius: "9px",
                          border: `1.5px dashed ${darkMode ? "#ff4f83" : "#7A1E3A"}`, background: darkMode ? "rgba(255,79,131,0.08)" : "#fdf7f8",
                          fontFamily: "'Courier New', monospace",
                          fontSize: "1.05rem", fontWeight: 800, letterSpacing: "2px", color: modalText,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          maxWidth: "100%"
                        }}>
                          {form.codigo_cupon || "CÓDIGO"}
                        </div>
                      </div>
                    </div>

                    {/* Divisor con perforaciones */}
                    <div style={{ position: "relative", height: "0", borderTop: `1.5px dashed ${modalBorder}`, margin: "0 8px" }}>
                      <div style={{
                        position: "absolute", top: "-9px", left: "-18px",
                        width: "18px", height: "18px", borderRadius: "50%",
                        background: darkMode ? "#121212" : "#f8f6f4"
                      }} />
                      <div style={{
                        position: "absolute", top: "-9px", right: "-18px",
                        width: "18px", height: "18px", borderRadius: "50%",
                        background: darkMode ? "#121212" : "#f8f6f4"
                      }} />
                    </div>

                    <div style={{ padding: "16px 20px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "0.64rem", fontWeight: 800, color: darkMode ? "#c5c5c5" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>
                          Compra mínima
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "0.86rem", color: modalText }}>
                          {form.minimo_compra && Number(form.minimo_compra) > 0 ? formatoPrecio(form.minimo_compra) : "Sin mínimo"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.64rem", fontWeight: 800, color: darkMode ? "#c5c5c5" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>
                          Vigencia
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "0.86rem", color: modalText }}>
                          {form.fecha_fin ? `Hasta ${formatoFecha(form.fecha_fin)}` : "Sin límite"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estado preview */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "14px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      background: form.activo ? "#d1fae5" : "#fef3c7",
                      color: form.activo ? "#065f46" : "#b45309",
                      border: `1px solid ${form.activo ? "#6ee7b7" : "#fcd34d"}`,
                      padding: "4px 11px", borderRadius: "20px",
                      fontSize: "0.75rem", fontWeight: 800
                    }}>
                      {form.activo ? "Activado" : "Desactivado"}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}