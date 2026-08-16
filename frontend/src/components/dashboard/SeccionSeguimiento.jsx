import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { IconTruck } from "../Icons";
import { confirmarEntrega, getOrdenes } from "../../services/api";

const ordenarPorFecha = (ordenes) => [...ordenes].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
const idVisible = (orden) => orden.id_orden_db || orden.id_orden;
const estilos = {
  esperando: { etiqueta: "Esperando envío", borde: "#d18b21", fondo: "#fff7e6", texto: "#92400e", badge: "#fef3c7" },
  camino: { etiqueta: "En camino", borde: "#2563eb", fondo: "#eff6ff", texto: "#1d4ed8", badge: "#dbeafe" },
  entregado: { etiqueta: "Entregado", borde: "#15803d", fondo: "#ecfdf3", texto: "#166534", badge: "#dcfce7" },
};

function diasEntre(inicio, fin) {
  if (!inicio || !fin) return null;
  const dias = Math.max(0, Math.ceil((new Date(fin) - new Date(inicio)) / 86400000));
  return `${dias} ${dias === 1 ? "día" : "días"}`;
}

function formatearFechaHora(fecha, sinHora = "No registrada") {
  if (!fecha) return sinHora;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return sinHora;
  const incluyeHora = /T|\d{1,2}:\d{2}/.test(String(fecha));
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    ...(incluyeHora ? { timeStyle: "short" } : {}),
  }).format(valor);
}

function origenEnvio(orden) {
  const envio = orden.envio || {};
  if (envio.origen) return envio.origen;
  const tienda = orden.items?.find((item) => item.nombre_tienda)?.nombre_tienda;
  return tienda ? `Tienda ${tienda}` : "Tienda vendedora";
}

function DatoInfo({ etiqueta, valor }) {
  return (
    <div style={{ padding: "13px 14px", border: "1px solid #e5e7eb", borderRadius: "9px", background: "#fafafa", minWidth: 0 }}>
      <span style={{ display: "block", color: "#6b7280", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", marginBottom: "5px" }}>{etiqueta.toUpperCase()}</span>
      <strong style={{ display: "block", color: "#28212a", overflowWrap: "anywhere" }}>{valor}</strong>
    </div>
  );
}

function EventoEntrega({ color, titulo, detalle, fecha }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr)", gap: "11px", alignItems: "start" }}>
      <span aria-hidden="true" style={{ width: "12px", height: "12px", marginTop: "4px", borderRadius: "50%", background: color, boxShadow: `0 0 0 4px ${color}22` }} />
      <div>
        <strong style={{ display: "block", color: "#28212a" }}>{titulo}</strong>
        <span style={{ display: "block", marginTop: "2px", color: "#4b5563", fontSize: "0.9rem" }}>{detalle}</span>
        <span style={{ display: "block", marginTop: "4px", color: "#6b7280", fontSize: "0.82rem" }}>{fecha}</span>
      </div>
    </div>
  );
}

export default function SeccionSeguimiento({ userId }) {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesLoading, setOrdenesLoading] = useState(false);
  const [vista, setVista] = useState("esperando");
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [confirmacionPendiente, setConfirmacionPendiente] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const posicionScroll = useRef(0);

  const cargarOrdenes = useCallback(async () => {
    if (!userId) return;
    setOrdenesLoading(true);
    try {
      const res = await getOrdenes();
      setOrdenes(res.data || []);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
    } finally {
      setOrdenesLoading(false);
    }
  }, [userId]);

  useEffect(() => { cargarOrdenes(); }, [cargarOrdenes]);
  useEffect(() => {
    // Refresca los cambios hechos por el vendedor sin exigir que el comprador
    // cierre y vuelva a abrir la sección.
    const intervalo = window.setInterval(cargarOrdenes, 20000);
    const alVolver = () => {
      if (document.visibilityState === "visible") cargarOrdenes();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargarOrdenes]);
  useLayoutEffect(() => {
    if (detalleAbierto) window.scrollTo(0, posicionScroll.current);
  }, [detalleAbierto]);

  const esperando = ordenarPorFecha(ordenes.filter((orden) => /^pagad/.test(String(orden.estado || "").toLowerCase()) && !orden.envio));
  const camino = ordenarPorFecha(ordenes.filter((orden) => /^enviad/.test(String(orden.estado || "").toLowerCase())));
  const entregado = ordenarPorFecha(ordenes.filter((orden) => /^entregad/.test(String(orden.estado || "").toLowerCase())));
  const pedidosPorVista = { esperando, camino, entregado };
  const pedidosActuales = pedidosPorVista[vista];

  const abrirDetalle = (orden) => {
    posicionScroll.current = window.scrollY;
    setDetalleAbierto(orden);
  };

  const confirmarRecepcion = async () => {
    const orden = confirmacionPendiente;
    if (!orden) return;
    setConfirmando(idVisible(orden));
    setConfirmacionPendiente(null);
    try {
      await confirmarEntrega(idVisible(orden));
      setAviso({ tipo: "exito", texto: `Confirmaste la entrega del pedido #${idVisible(orden)}.` });
      await cargarOrdenes();
      setVista("entregado");
    } catch (error) {
      setAviso({ tipo: "error", texto: error.response?.data?.detail || "No se pudo confirmar la entrega. Inténtalo nuevamente." });
    } finally {
      setConfirmando(null);
    }
  };

  const TarjetaPedido = ({ orden, tipo }) => {
    const estilo = estilos[tipo];
    const envio = orden.envio;
    const esEntregado = tipo === "entregado";
    return (
      <article className="pl-card" style={{ padding: "20px", borderLeft: `4px solid ${estilo.borde}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "50%", background: estilo.fondo, display: "grid", placeItems: "center" }}><IconTruck width={22} height={22} strokeWidth={2} style={{ color: estilo.texto }} /></span>
            <div><strong style={{ display: "block" }}>Pedido #{idVisible(orden)}</strong><span style={{ color: "#666", fontSize: "0.86rem" }}>{envio?.empresa_mensajeria || (tipo === "esperando" ? "Pago confirmado" : "Información de envío")}</span></div>
          </div>
          <span style={{ background: estilo.badge, color: estilo.texto, border: `1px solid ${estilo.borde}`, borderRadius: "999px", padding: "4px 10px", fontSize: "0.78rem", fontWeight: 700 }}>{estilo.etiqueta}</span>
        </div>
        <div style={{ marginTop: "18px", paddingTop: "15px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ color: "#666", fontSize: "0.88rem" }}>{tipo === "esperando" ? "El vendedor aún está preparando el envío." : esEntregado ? "Entrega confirmada por el comprador." : "Tu pedido está en ruta."}</span>
          {tipo === "camino" && <button className="btn btn-vinotinto" type="button" disabled={confirmando === idVisible(orden)} onClick={() => setConfirmacionPendiente(orden)} style={{ width: "auto", padding: "9px 14px", fontSize: "0.82rem" }}>{confirmando === idVisible(orden) ? "Confirmando..." : "Confirmar que recibí el pedido"}</button>}
          {tipo !== "esperando" && <button type="button" onClick={() => abrirDetalle(orden)} style={{ width: "auto", padding: "9px 14px", fontSize: "0.82rem", border: `1px solid ${estilo.borde}`, borderRadius: "6px", background: "white", color: estilo.texto, cursor: "pointer", fontWeight: 700 }}>{esEntregado ? "Información de entrega" : "Información del envío"}</button>}
        </div>
      </article>
    );
  };

  const esDetalleEntregado = detalleAbierto && /^entregad/.test(String(detalleAbierto.estado || "").toLowerCase());
  const fechaDespacho = detalleAbierto?.envio?.fecha_despacho_con_hora || detalleAbierto?.envio?.actualizado_en || detalleAbierto?.envio?.fecha_despacho;

  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}><div style={{ display: "flex", alignItems: "center", gap: "12px" }}><IconTruck width={28} height={28} strokeWidth={2} style={{ color: "#7A1E3A" }} /><div><h2 style={{ margin: 0 }}>Seguimiento de pedidos</h2><p style={{ margin: "5px 0 0", color: "#666", fontSize: "0.9rem" }}>Consulta el estado de tus envíos y confirma cuando recibas tu pedido.</p></div></div></div>
      {ordenesLoading ? <div className="empty-state"><p>Cargando seguimientos...</p></div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginBottom: "22px" }}>
            {Object.entries(estilos).map(([clave, estilo]) => <button key={clave} type="button" onClick={() => setVista(clave)} style={{ padding: "12px", borderRadius: "999px", border: `1px solid ${vista === clave ? estilo.borde : "#ded8d6"}`, background: vista === clave ? estilo.borde : "white", color: vista === clave ? "white" : "#4b2733", cursor: "pointer", fontWeight: 700 }}>{estilo.etiqueta} ({pedidosPorVista[clave].length})</button>)}
          </div>
          <div style={{ display: "grid", gap: "14px" }}>
            {pedidosActuales.length === 0 ? <div className="empty-state"><p>No tienes pedidos en “{estilos[vista].etiqueta}”.</p></div> : pedidosActuales.map((orden) => <TarjetaPedido key={idVisible(orden)} orden={orden} tipo={vista} />)}
          </div>
        </>
      )}
      {detalleAbierto && (
        <div role="dialog" aria-modal="true" aria-label={esDetalleEntregado ? "Información de entrega" : "Información del envío"} onClick={() => setDetalleAbierto(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(36, 20, 27, 0.52)", display: "grid", placeItems: "center", padding: "20px" }}>
          <section className="pl-card" onClick={(event) => event.stopPropagation()} style={{ width: "min(560px, 100%)", padding: 0, overflow: "hidden", boxSizing: "border-box", boxShadow: "0 24px 70px rgba(36, 20, 27, 0.24)" }}>
            <header style={{ padding: "24px 26px 20px", background: esDetalleEntregado ? "linear-gradient(135deg, #14532d, #15803d)" : "linear-gradient(135deg, #173f8a, #2563eb)", color: "white", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, letterSpacing: "0.08em", opacity: 0.82 }}>{esDetalleEntregado ? "COMPROBANTE DE ENTREGA" : "DETALLE DEL ENVÍO"}</span>
                <h3 style={{ margin: "6px 0 0", fontSize: "1.35rem" }}>{esDetalleEntregado ? "Pedido entregado" : "Pedido en camino"}</h3>
                <p style={{ margin: "5px 0 0", opacity: 0.86 }}>Pedido #{idVisible(detalleAbierto)}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setDetalleAbierto(null)} style={{ width: "34px", height: "34px", border: "1px solid rgba(255,255,255,.45)", borderRadius: "50%", background: "rgba(255,255,255,.1)", color: "white", fontSize: "1.35rem", lineHeight: 1, cursor: "pointer" }}>×</button>
            </header>
            <div style={{ padding: "24px 26px 26px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                <DatoInfo etiqueta="Transportadora" valor={detalleAbierto.envio?.empresa_mensajeria || "No registrada"} />
                <DatoInfo etiqueta="Número de guía" valor={detalleAbierto.envio?.numero_guia || "No registrada"} />
              </div>
              <div style={{ marginTop: "22px" }}>
                <span style={{ display: "block", color: "#6b7280", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.07em", marginBottom: "12px" }}>MOVIMIENTO DEL PEDIDO</span>
                <div style={{ display: "grid", gap: "14px" }}>
                  <EventoEntrega color="#2563eb" titulo="Enviado desde" detalle={origenEnvio(detalleAbierto)} fecha={formatearFechaHora(fechaDespacho)} />
                  {esDetalleEntregado && <EventoEntrega color="#15803d" titulo="Recibido" detalle="Entrega confirmada por el comprador" fecha={formatearFechaHora(detalleAbierto.fecha_entrega_confirmada)} />}
                </div>
              </div>
              {esDetalleEntregado && <div style={{ marginTop: "20px", padding: "13px 14px", borderRadius: "9px", background: "#ecfdf3", color: "#166534", fontSize: "0.88rem" }}>Tiempo total de entrega: <strong>{diasEntre(fechaDespacho || detalleAbierto.fecha, detalleAbierto.fecha_entrega_confirmada) || "No disponible"}</strong></div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setDetalleAbierto(null)} style={{ padding: "10px 16px", borderRadius: "7px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: 700 }}>Cerrar</button>
                {!esDetalleEntregado && (detalleAbierto.envio?.url_rastreo || detalleAbierto.envio?.sitio_web) && <a href={detalleAbierto.envio.url_rastreo || detalleAbierto.envio.sitio_web} target="_blank" rel="noreferrer" className="btn btn-vinotinto" style={{ width: "auto", padding: "10px 16px", fontSize: "0.84rem" }}>Ver rastreo</a>}
              </div>
            </div>
          </section>
        </div>
      )}
      {confirmacionPendiente && <div role="dialog" aria-modal="true" aria-label="Confirmar entrega" onClick={() => setConfirmacionPendiente(null)} style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(36, 20, 27, 0.45)", display: "grid", placeItems: "center", padding: "20px" }}><div className="pl-card" onClick={(event) => event.stopPropagation()} style={{ width: "min(430px, 100%)", padding: "24px", boxSizing: "border-box" }}><h3 style={{ margin: 0 }}>¿Recibiste tu pedido?</h3><p style={{ color: "#666", lineHeight: 1.5 }}>Al confirmar, el pedido #{idVisible(confirmacionPendiente)} pasará a “Entregado”.</p><div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}><button type="button" onClick={() => setConfirmacionPendiente(null)} style={{ padding: "9px 14px", borderRadius: "6px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}>Cancelar</button><button className="btn btn-vinotinto" type="button" onClick={confirmarRecepcion} style={{ width: "auto", padding: "9px 14px" }}>Sí, confirmar entrega</button></div></div></div>}
      {aviso && <div role="dialog" aria-modal="true" aria-label="Resultado de la entrega" onClick={() => setAviso(null)} style={{ position: "fixed", inset: 0, zIndex: 1002, background: "rgba(36, 20, 27, 0.45)", display: "grid", placeItems: "center", padding: "20px" }}><div className="pl-card" onClick={(event) => event.stopPropagation()} style={{ width: "min(420px, 100%)", padding: "24px", boxSizing: "border-box" }}><h3 style={{ margin: 0, color: aviso.tipo === "exito" ? "#166534" : "#b42318" }}>{aviso.tipo === "exito" ? "Entrega confirmada" : "No fue posible confirmar"}</h3><p style={{ color: "#555", lineHeight: 1.5 }}>{aviso.texto}</p><div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}><button className="btn btn-vinotinto" type="button" onClick={() => setAviso(null)} style={{ width: "auto", padding: "9px 14px" }}>Entendido</button></div></div></div>}
    </>
  );
}
