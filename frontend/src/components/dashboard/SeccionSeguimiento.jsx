import { useState, useEffect, useCallback } from "react";
import { IconTruck } from "../Icons";
import { getOrdenes } from "../../services/api";

export default function SeccionSeguimiento({ userId }) {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesLoading, setOrdenesLoading] = useState(false);

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
  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconTruck width={28} height={28} strokeWidth={2} style={{ color: "#7A1E3A" }} />
          <div>
            <h2 style={{ margin: 0 }}>Seguimiento de pedidos</h2>
            <p style={{ margin: "5px 0 0", color: "#666", fontSize: "0.9rem" }}>Consulta las guías registradas por tus vendedores.</p>
          </div>
        </div>
      </div>
      {ordenesLoading ? (
        <div className="empty-state"><p>Cargando seguimientos...</p></div>
      ) : ordenes.filter((orden) => orden.envio && orden.estado && ["pagado", "enviado", "entregado"].includes(orden.estado.toLowerCase())).length === 0 ? (
        <div className="empty-state">
          <IconTruck width={42} height={42} strokeWidth={1.7} style={{ color: "#7A1E3A", marginBottom: "12px" }} />
          <p style={{ fontWeight: 700, marginBottom: "5px" }}>Aún no tienes envíos con guía</p>
          <p style={{ color: "#777", fontSize: "0.88rem" }}>Cuando el vendedor registre la guía, podrás verla aquí.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {ordenes.filter((orden) => orden.envio && orden.estado && ["pagado", "enviado", "entregado"].includes(orden.estado.toLowerCase())).map((orden) => (
            <article key={orden.id_orden} className="pl-card" style={{ padding: "20px", borderLeft: "4px solid #7A1E3A" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#f7e8ed", display: "grid", placeItems: "center" }}>
                    <IconTruck width={22} height={22} strokeWidth={2} style={{ color: "#7A1E3A" }} />
                  </span>
                  <div>
                    <strong style={{ display: "block" }}>Pedido #{orden.id_orden}</strong>
                    <span style={{ color: "#666", fontSize: "0.86rem" }}>{orden.envio.empresa_mensajeria}</span>
                  </div>
                </div>
                <span className="pl-badge pl-badge--entregado">{orden.envio.estado_envio || "Guía registrada"}</span>
              </div>
              <div style={{ marginTop: "18px", paddingTop: "15px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <span style={{ display: "block", color: "#777", fontSize: "0.78rem" }}>NÚMERO DE GUÍA</span>
                  <strong style={{ letterSpacing: "0.04em" }}>{orden.envio.numero_guia}</strong>
                </div>
                {(orden.envio.url_rastreo || orden.envio.sitio_web) && <a href={orden.envio.url_rastreo || orden.envio.sitio_web} target="_blank" rel="noreferrer" className="btn btn-vinotinto" style={{ width: "auto", padding: "9px 14px", fontSize: "0.82rem" }}>Ir al rastreo</a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
