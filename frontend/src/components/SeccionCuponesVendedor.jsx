import { useState, useEffect } from "react";
import { getCuponesTienda, crearCupon, editarCupon, eliminarCupon } from "../services/api";
import { notify } from "./ToastProvider";

export default function SeccionCuponesVendedor({ tiendaId }) {
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
  });

  const cargarCupones = () => {
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
  };

  useEffect(() => {
    if (tiendaId) {
      cargarCupones();
    }
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
    });
    setShowModal(true);
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
      .catch((err) => {
        notify("Error al cambiar estado del cupón", "error");
      });
  };

  return (
    <div className="pl-card" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, color: "var(--gris-carbon)" }}>Mis Cupones de Descuento</h2>
          <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>
            Administra los códigos promocionales exclusivos de tu tienda
          </p>
        </div>
        <button className="btn btn-vinotinto" onClick={handleOpenCreate}>
          + Crear Cupón
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p style={{ color: "#888" }}>Cargando cupones...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px 20px" }}>
          <p style={{ fontWeight: 700, color: "#444" }}>No tienes cupones de descuento aún</p>
          <p style={{ fontSize: "0.85rem", color: "#888" }}>Crea uno para incentivar las ventas en tu tienda</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e0dbd4", color: "var(--vinotinto)" }}>
                <th style={{ padding: "12px", fontWeight: 700 }}>Código</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>Descuento</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>Mín. Compra</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>Usos (Act/Max)</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>Vence</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>Estado</th>
                <th style={{ padding: "12px", fontWeight: 700, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id_cupon} style={{ borderBottom: "1px solid #f0ebe4" }}>
                  <td style={{ padding: "12px", fontWeight: 700, letterSpacing: "0.5px" }}>{coupon.codigo_cupon}</td>
                  <td style={{ padding: "12px" }}>
                    {coupon.tipo_descuento === "porcentaje"
                      ? `${coupon.valor_descuento}%`
                      : `$${Number(coupon.valor_descuento).toLocaleString("es-CO")}`}
                  </td>
                  <td style={{ padding: "12px" }}>
                    ${Number(coupon.minimo_compra).toLocaleString("es-CO")}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {coupon.usos_actuales} / {coupon.usos_maximos || "Ilimitado"}
                  </td>
                  <td style={{ padding: "12px", fontSize: "0.85rem", color: "#666" }}>
                    {coupon.fecha_fin ? new Date(coupon.fecha_fin).toLocaleDateString("es-CO") : "Sin límite"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      onClick={() => handleToggleActivo(coupon)}
                      style={{
                        cursor: "pointer",
                        background: coupon.activo ? "#e8f5e9" : "#ffebee",
                        color: coupon.activo ? "#2e7d32" : "#c62828",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: `1px solid ${coupon.activo ? "#c8e6c9" : "#ffcdd2"}`
                      }}
                    >
                      {coupon.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button
                      onClick={() => handleOpenEdit(coupon)}
                      style={{
                        background: "none", border: "none", color: "#1976d2",
                        fontWeight: 600, marginRight: "12px", cursor: "pointer"
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id_cupon)}
                      style={{
                        background: "none", border: "none", color: "var(--rojo-suave)",
                        fontWeight: 600, cursor: "pointer"
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>{editingCoupon ? "Editar Cupón" : "Crear Nuevo Cupón"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div style={{ display: "grid", gap: "15px" }}>
                <div className="form-group">
                  <label>Código del Cupón *</label>
                  <input
                    type="text"
                    value={form.codigo_cupon}
                    onChange={(e) => setForm({ ...form, codigo_cupon: e.target.value })}
                    placeholder="Ejem: PROMO20"
                    maxLength={20}
                    style={{ textTransform: "uppercase" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div className="form-group">
                    <label>Tipo Descuento *</label>
                    <select
                      value={form.tipo_descuento}
                      onChange={(e) => setForm({ ...form, tipo_descuento: e.target.value })}
                    >
                      <option value="porcentaje">Porcentaje (%)</option>
                      <option value="fijo">Fijo (COP)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valor *</label>
                    <input
                      type="number"
                      value={form.valor_descuento}
                      onChange={(e) => setForm({ ...form, valor_descuento: e.target.value })}
                      placeholder={form.tipo_descuento === "porcentaje" ? "10" : "5000"}
                      min="1"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div className="form-group">
                    <label>Compra Mínima</label>
                    <input
                      type="number"
                      value={form.minimo_compra}
                      onChange={(e) => setForm({ ...form, minimo_compra: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Usos Máximos</label>
                    <input
                      type="number"
                      value={form.usos_maximos}
                      onChange={(e) => setForm({ ...form, usos_maximos: e.target.value })}
                      placeholder="100"
                      min="1"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div className="form-group">
                    <label>Fecha Inicio</label>
                    <input
                      type="datetime-local"
                      value={form.fecha_inicio}
                      onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Fin</label>
                    <input
                      type="datetime-local"
                      value={form.fecha_fin}
                      onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-vinotinto"
                  style={{ flex: 1 }}
                >
                  {editingCoupon ? "Guardar Cambios" : "Crear Cupón"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
