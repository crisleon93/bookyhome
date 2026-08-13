import { useState, useEffect, useCallback } from "react";
import { IconPackage, IconCheck, IconLock } from "../Icons";
import { getOrdenes, getOrden, sendConfirmationEmail } from "../../services/api";
import { notify } from "../ToastProvider";

export default function SeccionMisCompras({ userId }) {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesLoading, setOrdenesLoading] = useState(false);

  // Baucher states
  const [mostrarBaucher, setMostrarBaucher] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [baucherLoading, setBaucherLoading] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const cargarOrdenes = useCallback(async () => {
    if (!userId) return;
    setOrdenesLoading(true);
    try {
      const res = await getOrdenes();
      setOrdenes(res.data || []);
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setOrdenesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);

  const handleVerBaucher = async (orden) => {
    setBaucherLoading(true);
    setOrdenSeleccionada(orden);
    setMostrarBaucher(true);
    try {
      const res = await getOrden(orden.id_orden);
      setOrdenSeleccionada(res.data);
    } catch (err) {
      console.error('Error al cargar detalles de orden:', err);
      notify('No se pudo cargar los detalles de la orden', 'error');
    } finally {
      setBaucherLoading(false);
    }
  };

  const handleCerrarBaucher = () => {
    setMostrarBaucher(false);
    setOrdenSeleccionada(null);
  };

  const handleEnviarEmail = async () => {
    if (!ordenSeleccionada) return;
    setEnviandoEmail(true);
    try {
      await sendConfirmationEmail(ordenSeleccionada.id_orden);
      notify('Correo de confirmación enviado', 'success');
    } catch (err) {
      notify('No se pudo enviar el correo', 'error');
    } finally {
      setEnviandoEmail(false);
    }
  };

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      style: "currency", currency: "COP", maximumFractionDigits: 0
    });

  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconPackage width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0 }}>Mis Compras</h2>
        </div>
      </div>

      {ordenesLoading ? (
        <div className="empty-state"><p>Cargando tus compras...</p></div>
      ) : ordenes.length === 0 ? (
        <div className="empty-state"><p>Aún no tienes compras realizadas</p></div>
      ) : (
        <div className="pl-card">
          {ordenes.map((orden) => (
            <div key={orden.id_orden} className="pl-order-row">
              <div className="pl-order-left">
                <span className="pl-order-emoji" style={{ display: 'flex', alignItems: 'center' }}>
                  {orden.estado === "pagado"
                    ? <IconCheck width={20} height={20} strokeWidth={2} style={{ color: 'green' }} />
                    : <IconLock width={20} height={20} strokeWidth={2} style={{ color: '#7A1E3A' }} />}
                </span>
                <div>
                  <p className="pl-order-title">Orden #{orden.id_orden}</p>
                  <p className="pl-order-meta">
                    {orden.fecha ? new Date(orden.fecha).toLocaleDateString("es-CO") : ""}
                    {" · "}{orden.items?.length || 0} producto{orden.items?.length === 1 ? "" : "s"}
                    {" · "}
                    <span className={`pl-badge pl-badge--${orden.estado === "pagado" ? "entregado" : "procesando"}`}>
                      {orden.estado}
                    </span>
                  </p>
                </div>
              </div>
              <div className="pl-order-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="pl-order-price">
                  {formatCurrency(orden.total)}
                </span>
                {orden.estado === "pagado" && (
                  <button
                    onClick={() => handleVerBaucher(orden)}
                    className="btn btn-vinotinto"
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      background: "var(--vinotinto)",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Ver Baucher
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL BAUCHER ── */}
      {mostrarBaucher && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)", zIndex: 2000,
            display: "flex", justifyContent: "center", alignItems: "center",
            padding: "20px"
          }}
          onClick={handleCerrarBaucher}
        >
          <div
            className="baucher-modal"
            style={{
              background: "var(--blanco, #fff)",
              maxWidth: "600px", width: "100%",
              borderRadius: "16px", padding: "40px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxHeight: "90vh", overflowY: "auto",
              scrollbarWidth: "none", msOverflowStyle: "none"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {baucherLoading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid #7A1E3A",
                  borderRadius: "50%", width: "50px", height: "50px",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 20px"
                }} />
                <p style={{ color: "#666" }}>Cargando baucher...</p>
              </div>
            ) : ordenSeleccionada ? (
              <>
                {/* Header */}
                <div style={{ borderBottom: "2px solid #e0dbd4", paddingBottom: "20px", marginBottom: "20px", textAlign: "center" }}>
                  <div style={{
                    width: "70px", height: "70px", borderRadius: "50%",
                    background: "#fdf0f2", display: "flex",
                    alignItems: "center", justifyContent: "center", margin: "0 auto 15px"
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h2 style={{ fontWeight: 800, color: "#7A1E3A", margin: "0 0 8px", fontSize: "1.6rem" }}>
                    ¡Compra Exitosa!
                  </h2>
                  <p style={{ color: "#666", margin: 0, fontSize: "0.95rem" }}>
                    Gracias por tu compra en BookyHome
                  </p>
                </div>

                {/* Info de la orden */}
                <div style={{ background: "#fcfaf7", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #e0dbd4" }}>
                  <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Número de Orden</span>
                      <span style={{ fontWeight: 700 }}>#{ordenSeleccionada.id_orden}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Fecha</span>
                      <span style={{ fontWeight: 600 }}>
                        {ordenSeleccionada.fecha
                          ? new Date(ordenSeleccionada.fecha).toLocaleDateString("es-CO", {
                              year: 'numeric', month: 'long', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })
                          : '—'}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Método de Pago</span>
                      <span style={{ fontWeight: 600 }}>
                        {ordenSeleccionada.metodo_pago || "Tarjeta de Crédito"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666", fontSize: "0.9rem" }}>Estado</span>
                      <span style={{
                        fontWeight: 700, color: "green",
                        background: "#e8f5e9", padding: "4px 12px",
                        borderRadius: "20px", fontSize: "0.85rem"
                      }}>
                        {ordenSeleccionada.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontWeight: 700, color: "#2a2a2a", margin: "0 0 15px", fontSize: "1.1rem" }}>
                    Productos Comprados
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {ordenSeleccionada.items?.length > 0 ? (
                      ordenSeleccionada.items.map((item) => (
                        <div key={item.id_libro} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "12px", background: "#faf8f6",
                          borderRadius: "8px", border: "1px solid #e0dbd4"
                        }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{item.titulo}</p>
                            <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                              {item.autor_libro} · Cantidad: {item.cantidad}
                            </p>
                          </div>
                          <span style={{ fontWeight: 700, color: "#7A1E3A", fontSize: "1rem" }}>
                            {formatCurrency(item.precio_libro * item.cantidad)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#888", fontSize: "0.9rem" }}>No hay detalle de productos disponible.</p>
                    )}
                  </div>
                </div>

                {/* Totales */}
                <div style={{ borderTop: "2px solid #e0dbd4", paddingTop: "20px", marginTop: "20px", display: "grid", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                    <span style={{ color: "#666" }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(ordenSeleccionada.total)}</span>
                  </div>
                  {ordenSeleccionada.cupon_aplicado && ordenSeleccionada.total_con_descuento != null && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", fontSize: "0.95rem",
                      background: "#f0faf0", padding: "8px 12px", borderRadius: "8px",
                      border: "1px solid #c8e6c9"
                    }}>
                      <span style={{ color: "#2e7d32", display: "flex", alignItems: "center", gap: "6px" }}>
                        🏷️ Cupón <strong>{ordenSeleccionada.cupon_aplicado}</strong>
                      </span>
                      <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                        -{formatCurrency(ordenSeleccionada.total - ordenSeleccionada.total_con_descuento)}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.3rem", fontWeight: 800 }}>
                    <span style={{ color: "#2a2a2a" }}>Total Pagado</span>
                    <span style={{ color: "#C5425A", fontSize: "1.5rem" }}>
                      {formatCurrency(ordenSeleccionada.total_con_descuento ?? ordenSeleccionada.total)}
                    </span>
                  </div>
                </div>

                {/* Botones */}
                <div style={{ display: "flex", gap: "12px", marginTop: "30px", flexWrap: "wrap" }}>
                  <button
                    onClick={handleCerrarBaucher}
                    style={{
                      flex: 1, minWidth: "120px", padding: "14px", borderRadius: "8px",
                      border: "2px solid #7A1E3A", background: "#fff",
                      color: "#7A1E3A", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer"
                    }}
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={handleEnviarEmail}
                    disabled={enviandoEmail}
                    style={{
                      flex: 1, minWidth: "120px", padding: "14px", borderRadius: "8px",
                      border: "none", background: "#2e7d32",
                      color: "white", fontWeight: 700, fontSize: "0.95rem",
                      cursor: enviandoEmail ? "not-allowed" : "pointer",
                      opacity: enviandoEmail ? 0.7 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {enviandoEmail ? "Enviando..." : "Enviar por correo"}
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{
                      flex: 1, minWidth: "120px", padding: "14px", borderRadius: "8px",
                      border: "none", background: "#7A1E3A",
                      color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Imprimir
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
      <style>{`
        .baucher-modal::-webkit-scrollbar { display: none; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
