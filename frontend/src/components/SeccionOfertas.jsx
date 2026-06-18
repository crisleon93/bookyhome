// src/components/SeccionOfertas.jsx

import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

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

const TIPOS = [
  { value: "porcentaje", label: "Porcentaje (%)" },
  { value: "fijo",       label: "Valor fijo (COP)" },
  { value: "especial",   label: "Especial (2x1)" },
];

const BadgeEstado = ({ estado }) => {
  const map = {
    activa:  { bg: "#d1fae5", color: "#065f46", label: "Activa" },
    proxima: { bg: "#dbeafe", color: "#1e40af", label: "Próxima" },
    vencida: { bg: "#f3f4f6", color: "#6b7280", label: "Vencida" },
  };
  const s = map[estado] || map.vencida;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px",
      borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

// ── Formulario crear / editar oferta ──
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
  const fechaMinima = inputDateTimeNow();

  const toggleLibro = (id) => {
    setForm((f) => ({
      ...f,
      ids_libros: f.ids_libros.includes(id)
        ? f.ids_libros.filter((x) => x !== id)
        : [...f.ids_libros, id],
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
    if (form.ids_libros.length === 0) return setError("Selecciona al menos un libro");

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
        await api.post("/ofertas/", data, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        }
        onGuardado(); 
    } catch (err) {
    console.error("Error completo:", err.response?.data || err.message || err);
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

  return (
    <div style={{ background: "white", borderRadius: "12px", padding: "28px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: "1.15rem", color: "#2a2a2a" }}>
        {esEdicion ? "Editar oferta" : "Nueva oferta"}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        {/* Nombre */}
        <div style={{ gridColumn: "1 / -1" }} className="form-group">
          <label>Nombre de la oferta *</label>
          <input value={form.nombre_oferta} maxLength={100}
            onChange={(e) => setForm({ ...form, nombre_oferta: e.target.value })} />
        </div>

        {/* Tipo descuento */}
        <div className="form-group">
          <label>Tipo de descuento *</label>
          <select value={form.tipo_descuento}
            onChange={(e) => setForm({ ...form, tipo_descuento: e.target.value, valor_descuento: "" })}>
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Valor — oculto para especial */}
        {form.tipo_descuento !== "especial" && (
          <div className="form-group">
            <label>{form.tipo_descuento === "porcentaje" ? "Porcentaje (%) *" : "Valor a descontar (COP) *"}</label>
            <input type="number" min="1" max={form.tipo_descuento === "porcentaje" ? 100 : undefined}
              value={form.valor_descuento}
              onChange={(e) => setForm({ ...form, valor_descuento: e.target.value })} />
          </div>
        )}
        {form.tipo_descuento === "especial" && (
          <div className="form-group">
            <label>Tipo especial</label>
            <input value="2x1 — lleva 2, paga 1" disabled
              style={{ background: "#f5f5f0", color: "#888" }} />
          </div>
        )}

        {/* Fechas */}
        <div className="form-group">
          <label>Fecha inicio *</label>
          <input type="datetime-local" min={fechaMinima} value={form.fecha_inicio}
            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Fecha fin *</label>
          <input type="datetime-local" min={form.fecha_inicio || fechaMinima} value={form.fecha_fin}
            onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
        </div>
      </div>

      {/* Selección de libros */}
      <div className="form-group" style={{ marginBottom: "20px" }}>
        <label style={{ marginBottom: "10px", display: "block" }}>
          Libros incluidos * <span style={{ color: "#aaa", fontWeight: 500 }}>
            ({form.ids_libros.length} seleccionado{form.ids_libros.length !== 1 ? "s" : ""})
          </span>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px",
          maxHeight: "220px", overflowY: "auto", padding: "4px 0" }}>
          {libros.length === 0 && (
            <p style={{ color: "#aaa", fontSize: "0.88rem" }}>No tienes libros publicados</p>
          )}
          {libros.map((libro) => {
            const sel = form.ids_libros.includes(libro.id_libro);
            return (
              // ✅ FIX: quitado onClick del label; el onChange del checkbox maneja el toggle
              <label
                key={libro.id_libro}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
                  border: `1.5px solid ${sel ? "#7A1E3A" : "#e0dbd4"}`,
                  background: sel ? "#fdf7f8" : "white", transition: "all 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => toggleLibro(libro.id_libro)}
                  style={{ accentColor: "#7A1E3A", width: "15px", height: "15px", flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#2a2a2a" }}>
                    {libro.titulo}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#777" }}>
                    {libro.autor_libro} · Stock: {libro.stock}
                  </p>
                </div>
                <span style={{ fontWeight: 700, color: "#7A1E3A", fontSize: "0.88rem", flexShrink: 0 }}>
                    {libro.precio_libro != null ? formatPrecio(libro.precio_libro) : "—"}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fdecea", color: "#c62828", border: "1.5px solid #ef9a9a",
          borderRadius: "8px", padding: "10px 14px", fontSize: "0.88rem",
          fontWeight: 600, marginBottom: "16px" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button className="btn-outline" onClick={onCancelar} disabled={cargando}>Cancelar</button>
        <button className="btn btn-vinotinto btn-header" onClick={guardar} disabled={cargando}>
          {cargando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear oferta"}
        </button>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Eliminar oferta</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: "8px 0 20px" }}>
          <p style={{ color: "#444", marginBottom: "6px" }}>
            ¿Eliminar <strong>"{oferta.nombre_oferta}"</strong>?
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
        api.get("/ofertas/"),
        api.get("/libros/mis-libros"),
      ]);
      setOfertas(resOfertas.data);
      setLibros(resLibros.data);
    } catch {
      // Mantiene el comportamiento anterior: no mostrar error en esta seccion.
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
    } catch (e) {
      console.error("Error al cargar la oferta:", e);
      alert("Error al cargar la oferta para edición");
    }
  };

  const cerrarForm = () => { setMostrarForm(false); setOfertaEditar(null); };

  const onGuardado = () => { cerrarForm(); cargar(); };

  // Agrupar por estado
  const activas  = ofertas.filter((o) => o.estado === "activa");
  const proximas = ofertas.filter((o) => o.estado === "proxima");
  const vencidas = ofertas.filter((o) => o.estado === "vencida");

  const labelTipo = (tipo, valor) => {
    if (tipo === "porcentaje") return `${valor}% off`;
    if (tipo === "fijo")       return `${formatPrecio(valor)} off`;
    if (tipo === "especial")   return "2x1";
    return tipo;
  };

  const renderFila = (oferta) => (
    <div key={oferta.id_oferta} style={{
      display: "flex", alignItems: "center", gap: "16px",
      padding: "16px 0", borderBottom: "1px solid #eee" }}>

      {/* Info principal */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <h4 style={{ margin: 0, fontSize: "0.97rem", color: "#2a2a2a" }}>{oferta.nombre_oferta}</h4>
          <BadgeEstado estado={oferta.estado} />
        </div>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#777" }}>
          {formatFecha(oferta.fecha_inicio)} → {formatFecha(oferta.fecha_fin)}
          {" · "}{oferta.total_libros} libro{oferta.total_libros !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Badge descuento */}
      <span style={{
        background: "#fdf7f8", color: "#7A1E3A",
        border: "1.5px solid #f5c6d0",
        borderRadius: "20px", padding: "4px 12px",
        fontSize: "0.82rem", fontWeight: 800, flexShrink: 0,
      }}>
        {labelTipo(oferta.tipo_descuento, oferta.valor_descuento)}
      </span>

      {/* Acciones */}
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <button className="btn-accion btn-editar" onClick={() => abrirEditar(oferta)}>
          Editar
        </button>
        <button className="btn-accion btn-eliminar-sm" onClick={() => setOfertaEliminar(oferta)}>
          Eliminar
        </button>
      </div>
    </div>
  );

  const renderGrupo = (titulo, lista, emoji) => {
    if (lista.length === 0) return null;
    return (
      <div style={{ marginBottom: "8px" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "#999", margin: "20px 0 4px" }}>
          {emoji} {titulo} ({lista.length})
        </div>
        {lista.map(renderFila)}
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="welcome-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.7rem", marginBottom: "6px" }}>Promociones y descuentos</h1>
          <p style={{ margin: 0 }}>{ofertas.length} oferta{ofertas.length !== 1 ? "s" : ""} creada{ofertas.length !== 1 ? "s" : ""}</p>
        </div>
        {!mostrarForm && (
          <button className="btn btn-vinotinto btn-header" onClick={() => { setOfertaEditar(null); setMostrarForm(true); }}>
            + Nueva oferta
          </button>
        )}
      </div>

      {/* Formulario crear / editar */}
      {mostrarForm && (
        <FormOferta
          libros={libros}
          ofertaEditar={ofertaEditar}
          onGuardado={onGuardado}
          onCancelar={cerrarForm}
        />
      )}

      {/* Lista de ofertas */}
      <div className="seller-books">
        {loading && <p style={{ color: "#999", padding: "20px 0" }}>Cargando...</p>}

        {!loading && ofertas.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏷️</div>
            <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px" }}>
              Aún no tienes promociones creadas
            </p>
            <p style={{ fontSize: "0.85rem", color: "#888" }}>
              Crea tu primera oferta para atraer más compradores
            </p>
          </div>
        )}

        {!loading && ofertas.length > 0 && (
          <>
            {renderGrupo("Activas ahora", activas,  "🟢")}
            {renderGrupo("Próximas",      proximas, "🔵")}
            {renderGrupo("Vencidas",      vencidas, "⚫")}
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
