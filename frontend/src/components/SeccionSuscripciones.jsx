import { useState, useEffect } from "react";
import api from "../services/api";

const fechaLocalISO = (fecha) => [
  fecha.getFullYear(),
  String(fecha.getMonth() + 1).padStart(2, "0"),
  String(fecha.getDate()).padStart(2, "0"),
].join("-");

const formatoFecha = (fecha) => {
  if (!fecha) return "No disponible";
  return new Date(`${String(fecha).slice(0, 10)}T12:00:00`).toLocaleDateString("es-CO");
};

export default function SeccionSuscripciones({ tiendaId, onNavegar, darkMode = false }) {
  const [planes, setPlanes] = useState([]);
  const [miSuscripcion, setMiSuscripcion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Sync darkMode from localStorage
  const [localDarkMode, setLocalDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setLocalDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener('darkModeChange', handler); window.removeEventListener('storage', handler); };
  }, []);

  const effectiveDarkMode = darkMode || localDarkMode;

  // Paleta de colores según modo
  const t = {
    cardBg:            effectiveDarkMode ? '#2a2a2a' : '#fff',
    cardBorder:        effectiveDarkMode ? '1px solid #3a3a3a' : '1px solid #e0dbd4',
    cardActiveBorder:   effectiveDarkMode ? '3px solid #e05a7a' : '3px solid var(--vinotinto)',
    cardShadow:        effectiveDarkMode ? '0 4px 15px rgba(224, 90, 122, 0.15)' : '0 4px 15px rgba(122, 30, 58, 0.15)',
    cardInactiveShadow: effectiveDarkMode ? '0 2px 5px rgba(0,0,0,0.15)' : '0 2px 5px rgba(0,0,0,0.05)',
    titleColor:        effectiveDarkMode ? '#ececec' : '#333',
    descColor:         effectiveDarkMode ? '#c8c8c8' : '#666',
    priceColor:        effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    pricePeriodColor:  effectiveDarkMode ? '#c8c8c8' : '#888',
    divider:           effectiveDarkMode ? '#333' : '#eee',
    sectionTitle:      effectiveDarkMode ? '#c8c8c8' : '#444',
    featureColor:      effectiveDarkMode ? '#c8c8c8' : '#555',
    featureIcon:       effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    activeBadgeBg:     effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    activeBadgeText:   '#fff',
    cancelBtnBg:       effectiveDarkMode ? '#2a1a18' : 'transparent',
    cancelBtnColor:    effectiveDarkMode ? '#f87171' : '#b42318',
    cancelBtnBorder:   effectiveDarkMode ? '#7f2020' : '#b42318',
    disabledBtnBg:     effectiveDarkMode ? '#2a2a2a' : '#f5f5f5',
    disabledBtnColor:  effectiveDarkMode ? '#666' : '#aaa',
    disabledBtnBorder: effectiveDarkMode ? '#444' : '#ddd',
    subscribeBtnBg:    effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    detailsBg:         effectiveDarkMode ? '#2a2a2a' : '#f9f8f6',
    detailsBorder:     effectiveDarkMode ? '1px solid #3a3a3a' : '1px solid #e0dbd4',
    detailsTitle:      effectiveDarkMode ? '#ececec' : '#333',
    detailsColor:      effectiveDarkMode ? '#c8c8c8' : '#555',
    infoBg:            effectiveDarkMode ? '#2a2a2a' : 'white',
    infoBorder:        effectiveDarkMode ? '1px solid #3a3a3a' : '1px solid #e0dbd4',
    infoLeftBorder:    effectiveDarkMode ? '5px solid #e05a7a' : '5px solid var(--vinotinto)',
    infoTitle:         effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    infoColor:         effectiveDarkMode ? '#c8c8c8' : '#555',
    infoBtnBg:         effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    welcomeCardBg:     effectiveDarkMode ? '#1f1f1f' : undefined,
    welcomeCardBorder: effectiveDarkMode ? '#3a3a3a' : undefined,
    welcomeTitle:      effectiveDarkMode ? '#f3f4f6' : undefined,
    welcomeDesc:       effectiveDarkMode ? '#c8c8c8' : undefined,
    iconColor:         effectiveDarkMode ? '#e05a7a' : '#7A1E3A',
    successBg:         effectiveDarkMode ? '#1a3a2a' : '#d4edda',
    successColor:      effectiveDarkMode ? '#6ae07a' : '#155724',
    errorBg:           effectiveDarkMode ? '#2a1a18' : '#f8d7da',
    errorColor:        effectiveDarkMode ? '#f87171' : '#721c24',
  };

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
      const fechaInicio = fechaLocalISO(hoy);
      const fin = new Date();
      fin.setMonth(hoy.getMonth() + 1); // 1 mes de duración
      const fechaFin = fechaLocalISO(fin);

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
    return <div style={{ padding: "2rem", color: t.textSecondary }}>Cargando planes y suscripción...</div>;
  }

  const suscripcionActiva = miSuscripcion && miSuscripcion.activa ? miSuscripcion.suscripcion : null;
  const idPlanActivo = suscripcionActiva ? suscripcionActiva.id_plan : 1; // 1 = Gratuito por defecto

  return (
    <>
      <div className="welcome-card" style={{ marginBottom: "20px", background: t.welcomeCardBg, borderColor: t.welcomeCardBorder }}>
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px", color: t.welcomeTitle }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          Suscripciones de Herramientas
        </h1>
        <p style={{ margin: 0, color: t.welcomeDesc }}>Mejora tu tienda con herramientas y estadísticas avanzadas para vender más</p>
      </div>

      {mensaje && (
        <div style={{ padding: "12px", backgroundColor: t.successBg, color: t.successColor, borderRadius: "8px", marginBottom: "20px", fontWeight: 600 }}>
          {mensaje}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px", backgroundColor: t.errorBg, color: t.errorColor, borderRadius: "8px", marginBottom: "20px", fontWeight: 600 }}>
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
                border: esPlanActivo ? t.cardActiveBorder : t.cardBorder,
                borderRadius: "12px",
                padding: "24px",
                backgroundColor: t.cardBg,
                boxShadow: esPlanActivo ? t.cardShadow : t.cardInactiveShadow,
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
                    backgroundColor: t.activeBadgeBg,
                    color: t.activeBadgeText,
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

              <h2 style={{ fontSize: "1.3rem", margin: "0 0 8px 0", color: t.titleColor }}>{plan.nombre_plan}</h2>
              <p style={{ color: t.descColor, fontSize: "0.9rem", minHeight: "60px", margin: "0 0 16px 0" }}>{plan.descripcion}</p>

              <div style={{ fontSize: "2rem", fontWeight: 800, color: t.priceColor, margin: "0 0 20px 0" }}>
                ${parseFloat(plan.precio_mensual).toLocaleString("es-CO")}
                <span style={{ fontSize: "0.9rem", fontWeight: 400, color: t.pricePeriodColor }}> / mes</span>
              </div>

              <div style={{ borderTop: t.divider, paddingTop: "16px", flexGrow: 1, marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: t.sectionTitle }}>Lo que incluye:</h4>
                <ul style={{ listStyleType: "none", paddingLeft: 0, margin: 0, fontSize: "0.85rem", color: t.featureColor, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ color: t.featureIcon }}>✓</span>
                    <div>
                      <strong>Historial de datos:</strong> {plan.historial_meses} {plan.historial_meses === 1 ? "mes" : "meses"} de registro de ventas.
                    </div>
                  </li>
                  {plan.estadisticas_basicas ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: t.featureIcon }}>✓</span>
                      <div>
                        <strong>Métricas Básicas:</strong> Resumen mensual de ventas totales e ingresos directos.
                      </div>
                    </li>
                  ) : null}
                  {plan.estadisticas_avanzadas ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: t.featureIcon }}>✓</span>
                      <div>
                        <strong>Métricas Avanzadas:</strong> Gráficos interactivos de visitas, tasas de conversión e ingresos históricos.
                      </div>
                    </li>
                  ) : null}
                  {plan.exportar_reportes ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: t.featureIcon }}>✓</span>
                      <div>
                        <strong>Reportes Contables:</strong> Exportación de reportes de ventas listos en formato Excel y PDF.
                      </div>
                    </li>
                  ) : null}
                  {plan.soporte_prioritario ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: t.featureIcon }}>✓</span>
                      <div>
                        <strong>Soporte Prioritario:</strong> Canal de atención y resolución de dudas prioritario en menos de 2h.
                      </div>
                    </li>
                  ) : null}
                  {parseFloat(plan.impulsos_con_descuento) > 0 ? (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: t.featureIcon }}>✓</span>
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
                      backgroundColor: t.cancelBtnBg,
                      color: t.cancelBtnColor,
                      border: t.cancelBtnBorder,
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
                      backgroundColor: t.disabledBtnBg,
                      color: t.disabledBtnColor,
                      border: t.disabledBtnBorder,
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
                    backgroundColor: t.subscribeBtnBg,
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
        <div style={{ marginTop: "32px", padding: "20px", backgroundColor: t.detailsBg, borderRadius: "12px", border: t.detailsBorder }}>
          <h3 style={{ margin: "0 0 12px 0", color: t.detailsTitle }}>Detalles de tu Suscripción Activa</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", fontSize: "0.9rem", color: t.detailsColor }}>
            <div>Fecha de inicio: <strong>{formatoFecha(suscripcionActiva.fecha_inicio)}</strong></div>
            <div>Fecha de vencimiento: <strong>{formatoFecha(suscripcionActiva.fecha_fin)}</strong></div>
            <div>Método de pago: <strong>{suscripcionActiva.metodo_pago}</strong></div>
            <div>Monto cobrado: <strong>${parseFloat(suscripcionActiva.monto_pagado).toLocaleString("es-CO")}</strong></div>
          </div>
        </div>
      )}

      {/* Puente hacia Impulsos */}
      <div style={{ marginTop: "32px", padding: "20px 24px", background: t.infoBg, borderRadius: "12px", borderLeft: t.infoLeftBorder, boxShadow: effectiveDarkMode ? "0 2px 10px rgba(224, 90, 122, 0.1)" : "0 2px 10px rgba(122,30,58,0.1)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
        <div style={{ flex: "1 1 260px" }}>
          <h3 style={{ margin: "0 0 6px 0", color: t.infoTitle, display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}>
            <span>⚡</span> ¿Para qué sirve el descuento en Impulsos?
          </h3>
          <p style={{ margin: 0, fontSize: "0.88rem", color: t.infoColor, lineHeight: "1.6" }}>
            Los <strong>Impulsos</strong> son espacios publicitarios dentro de BookyHome: destaca tu libro en la página principal, aparece como banner en categorías o llega por email a miles de compradores. Tu plan te da ese descuento de forma automática en cada compra.
          </p>
        </div>
        {onNavegar && (
          <button
            onClick={() => onNavegar("Impulsos")}
            style={{ padding: "12px 24px", backgroundColor: t.infoBtnBg, color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "Montserrat, sans-serif", whiteSpace: "nowrap", fontSize: "0.9rem" }}
          >
            🚀 Ver y contratar Impulsos
          </button>
        )}
      </div>
    </>
  );
}
