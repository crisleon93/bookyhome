import { useState, useEffect } from "react";
import api from "../services/api";

export default function SeccionSuscripciones({ tiendaId, onNavegar }) {
  const [planes, setPlanes] = useState([]);
  const [miSuscripcion, setMiSuscripcion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [tiendaId]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const [resPlanes, resMiSuscripcion] = await Promise.all([
        api.get("/herramientas/planes"),
        api.get("/herramientas/mi-suscripcion")
      ]);
      setPlanes(resPlanes.data || []);
      setMiSuscripcion(resMiSuscripcion.data || null);
    } catch (err) {
      console.error("Error al cargar datos de suscripciones:", err);
      setError("No se pudieron cargar los datos de los planes y tu suscripción.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuscribir = async (idPlan) => {
    setProcesando(true);
    setError("");
    setMensaje("");
    try {
      const hoy = new Date();
      const fechaInicio = hoy.toISOString().split("T")[0];
      const fin = new Date();
      fin.setMonth(hoy.getMonth() + 1); // 1 mes de duración
      const fechaFin = fin.toISOString().split("T")[0];

      const payload = {
        id_plan: idPlan,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        metodo_pago: "Simulación de Pago",
        monto_pagado: idPlan === 1 ? 0 : 29000.00
      };

      await api.post("/herramientas/suscribir", payload);
      setMensaje("¡Suscripción actualizada con éxito!");
      await cargarDatos();
    } catch (err) {
      console.error("Error al suscribirse:", err);
      setError(err.response?.data?.detail || "Error al procesar la suscripción.");
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar tu suscripción activa? Volverás al plan Gratuito.")) {
      return;
    }
    setProcesando(true);
    setError("");
    setMensaje("");
    try {
      await api.delete("/herramientas/cancelar");
      setMensaje("Suscripción cancelada correctamente.");
      await cargarDatos();
    } catch (err) {
      console.error("Error al cancelar:", err);
      setError(err.response?.data?.detail || "Error al cancelar la suscripción.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", color: "#888" }}>Cargando planes y suscripción...</div>;
  }

  const suscripcionActiva = miSuscripcion && miSuscripcion.activa ? miSuscripcion.suscripcion : null;
  const idPlanActivo = suscripcionActiva ? suscripcionActiva.id_plan : 1; // 1 = Gratuito por defecto

  return (
    <>
      <div className="welcome-card" style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A1E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          Suscripciones de Herramientas
        </h1>
        <p style={{ margin: 0 }}>Mejora tu tienda con herramientas y estadísticas avanzadas para vender más</p>
      </div>

      {mensaje && (
        <div style={{ padding: "12px", backgroundColor: "#d4edda", color: "#155724", borderRadius: "8px", marginBottom: "20px", fontWeight: 600 }}>
          {mensaje}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#f8d7da", color: "#721c24", borderRadius: "8px", marginBottom: "20px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "20px" }}>
        {planes.map((plan) => {
          const esPlanActivo = plan.id_plan === idPlanActivo;
          return (
            <div
              key={plan.id_plan}
              style={{
                flex: "1 1 300px",
                maxWidth: "400px",
                border: esPlanActivo ? "3px solid var(--vinotinto)" : "1px solid #e0dbd4",
                borderRadius: "12px",
                padding: "24px",
                backgroundColor: "white",
                boxShadow: esPlanActivo ? "0 4px 15px rgba(122, 30, 58, 0.15)" : "0 2px 5px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
            >
              {esPlanActivo && (
                <span
                  style={{
                    position: "absolute",
                    top: "-12px",
                    right: "20px",
                    backgroundColor: "var(--vinotinto)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase"
                  }}
                >
                  Plan Activo
                </span>
              )}

              <h2 style={{ fontSize: "1.3rem", margin: "0 0 8px 0", color: "#333" }}>{plan.nombre_plan}</h2>
              <p style={{ color: "#666", fontSize: "0.9rem", minHeight: "60px", margin: "0 0 16px 0" }}>{plan.descripcion}</p>
              
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--vinotinto)", margin: "0 0 20px 0" }}>
                ${parseFloat(plan.precio_mensual).toLocaleString("es-CO")}
                <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#888" }}> / mes</span>
              </div>

              <div style={{ borderTop: "1px solid #eee", paddingTop: "16px", flexGrow: 1, marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#444" }}>Lo que incluye:</h4>
                <ul style={{ listStyleType: "none", paddingLeft: 0, margin: 0, fontSize: "0.85rem", color: "#555", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ color: "var(--vinotinto)" }}>✓</span>
                    <div>
                      <strong>Historial de datos:</strong> {plan.historial_meses} {plan.historial_meses === 1 ? "mes" : "meses"} de registro de ventas.
                    </div>
                  </li>
                  {plan.estadisticas_basicas ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: "var(--vinotinto)" }}>✓</span>
                      <div>
                        <strong>Métricas Básicas:</strong> Resumen mensual de ventas totales e ingresos directos.
                      </div>
                    </li>
                  ) : null}
                  {plan.estadisticas_avanzadas ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: "var(--vinotinto)" }}>✓</span>
                      <div>
                        <strong>Métricas Avanzadas:</strong> Gráficos interactivos de visitas, tasas de conversión e ingresos históricos.
                      </div>
                    </li>
                  ) : null}
                  {plan.exportar_reportes ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: "var(--vinotinto)" }}>✓</span>
                      <div>
                        <strong>Reportes Contables:</strong> Exportación de reportes de ventas listos en formato Excel y PDF.
                      </div>
                    </li>
                  ) : null}
                  {plan.soporte_prioritario ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: "var(--vinotinto)" }}>✓</span>
                      <div>
                        <strong>Soporte Prioritario:</strong> Canal de atención y resolución de dudas prioritario en menos de 2h.
                      </div>
                    </li>
                  ) : null}
                  {parseFloat(plan.impulsos_con_descuento) > 0 ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: "var(--vinotinto)" }}>✓</span>
                      <div>
                        <strong>Impulsos Destacados:</strong> {parseFloat(plan.impulsos_con_descuento)}% de descuento al pagar para posicionar tus libros arriba en el catálogo.
                      </div>
                    </li>
                  ) : null}
                </ul>
              </div>

              {esPlanActivo ? (
                plan.id_plan !== 1 ? (
                  <button
                    disabled={procesando}
                    onClick={handleCancelar}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      backgroundColor: "transparent",
                      color: "#b42318",
                      border: "1px solid #b42318",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "Montserrat, sans-serif"
                    }}
                  >
                    Cancelar Suscripción
                  </button>
                ) : (
                  <button
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      backgroundColor: "#f5f5f5",
                      color: "#aaa",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "not-allowed",
                      fontFamily: "Montserrat, sans-serif"
                    }}
                  >
                    Plan Base Predeterminado
                  </button>
                )
              ) : (
                <button
                  disabled={procesando}
                  onClick={() => handleSuscribir(plan.id_plan)}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    backgroundColor: "var(--vinotinto)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Montserrat, sans-serif"
                  }}
                >
                  Cambiar a este Plan
                </button>
              )}
            </div>
          );
        })}
      </div>

      {suscripcionActiva && (
        <div style={{ marginTop: "32px", padding: "20px", backgroundColor: "#f9f8f6", borderRadius: "12px", border: "1px solid #e0dbd4" }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>Detalles de tu Suscripción Activa</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", fontSize: "0.9rem", color: "#555" }}>
            <div>Fecha de inicio: <strong>{new Date(suscripcionActiva.fecha_inicio).toLocaleDateString("es-CO")}</strong></div>
            <div>Fecha de vencimiento: <strong>{new Date(suscripcionActiva.fecha_fin).toLocaleDateString("es-CO")}</strong></div>
            <div>Método de pago: <strong>{suscripcionActiva.metodo_pago}</strong></div>
            <div>Monto cobrado: <strong>${parseFloat(suscripcionActiva.monto_pagado).toLocaleString("es-CO")}</strong></div>
          </div>
        </div>
      )}

      {/* Puente hacia Impulsos */}
      <div style={{ marginTop: "32px", padding: "20px 24px", background: "white", borderRadius: "12px", borderLeft: "5px solid var(--vinotinto)", boxShadow: "0 2px 10px rgba(122,30,58,0.1)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
        <div style={{ flex: "1 1 260px" }}>
          <h3 style={{ margin: "0 0 6px 0", color: "var(--vinotinto)", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}>
            <span>⚡</span> ¿Para qué sirve el descuento en Impulsos?
          </h3>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#555", lineHeight: "1.6" }}>
            Los <strong>Impulsos</strong> son espacios publicitarios dentro de BookyHome: destaca tu libro en la página principal, aparece como banner en categorías o llega por email a miles de compradores. Tu plan te da ese descuento de forma automática en cada compra.
          </p>
        </div>
        {onNavegar && (
          <button
            onClick={() => onNavegar("Impulsos")}
            style={{ padding: "12px 24px", backgroundColor: "var(--vinotinto)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "Montserrat, sans-serif", whiteSpace: "nowrap", fontSize: "0.9rem" }}
          >
            🚀 Ver y contratar Impulsos
          </button>
        )}
      </div>
    </>
  );
}
