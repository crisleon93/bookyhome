import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { IconTruck } from "../Icons";
import { cancelOrder, confirmarEntrega, getOrdenes } from "../../services/api";

const ordenarPorFecha = (ordenes) => [...ordenes].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
const idVisible = (orden) => orden.id_orden_db || orden.id_orden;
const urlRastreo = (envio) => {
  if (!envio) return null;
  if (String(envio.empresa_mensajeria || "").toLowerCase().includes("interrapid")) {
    return "https://www.interrapidisimo.com";
  }
  return envio.url_rastreo || envio.sitio_web || null;
};
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
    <div className="seguimiento-dato-info" style={{ padding: "16px 18px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#fafafa", minWidth: 0 }}>
      <span style={{ display: "block", color: "#6b7280", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "6px" }}>{etiqueta.toUpperCase()}</span>
      <strong style={{ display: "block", color: "#1a1a1a", overflowWrap: "anywhere", fontSize: "0.95rem" }}>{valor}</strong>
    </div>
  );
}

function EventoEntrega({ color, titulo, detalle, fecha }) {
  return (
    <div className="seguimiento-evento" style={{ display: "grid", gridTemplateColumns: "20px minmax(0, 1fr)", gap: "14px", alignItems: "start" }}>
      <span aria-hidden="true" style={{ width: "14px", height: "14px", marginTop: "4px", borderRadius: "50%", background: color, boxShadow: `0 0 0 4px ${color}22` }} />
      <div>
        <strong style={{ display: "block", color: "#1a1a1a", fontSize: "0.98rem" }}>{titulo}</strong>
        <span style={{ display: "block", marginTop: "4px", color: "#4b5563", fontSize: "0.94rem", lineHeight: 1.5 }}>{detalle}</span>
        <span style={{ display: "block", marginTop: "6px", color: "#6b7280", fontSize: "0.86rem" }}>{fecha}</span>
      </div>
    </div>
  );
}

export default function SeccionSeguimiento({ userId }) {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesLoading, setOrdenesLoading] = useState(true); // true desde el inicio para evitar flash
  const [vista, setVista] = useState("esperando");
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [confirmacionPendiente, setConfirmacionPendiente] = useState(null);
  const [cancelacionPendiente, setCancelacionPendiente] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [confirmando, setConfirmando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(8);
  const posicionScroll = useRef(0);

  const cargarOrdenes = useCallback(async (mostrarSpinner = true) => {
    if (!userId) return;
    if (mostrarSpinner) setOrdenesLoading(true);
    try {
      const res = await getOrdenes();
      // Una sola actualización de estado para evitar renders intermedios
      // donde los datos ya llegaron pero el spinner aún no se apagó
      setOrdenes(res.data || []);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
      if (mostrarSpinner) setOrdenes([]);
    } finally {
      if (mostrarSpinner) setOrdenesLoading(false);
    }
  }, [userId]);

  useEffect(() => { cargarOrdenes(); }, [cargarOrdenes]);
  useEffect(() => {
    // Refresca los cambios hechos por el vendedor sin exigir que el comprador
    // cierre y vuelva a abrir la sección.
    // Se pasa false para no mostrar spinner en actualizaciones silenciosas
    // y evitar el flash de "todos los pedidos sin filtrar".
    const intervalo = window.setInterval(() => cargarOrdenes(false), 20000);
    const alVolver = () => {
      if (document.visibilityState === "visible") cargarOrdenes(false);
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

  const esperando = ordenarPorFecha(ordenes.filter((orden) => {
    const est = String(orden.estado || "").toLowerCase().trim();
    // Estado explícito de envío/entregado toma prioridad sobre cualquier otra condición
    if (/^enviad/.test(est) || /^entregad/.test(est)) return false;
    if (/^cancelad/.test(est)) return false;
    if (/^pend/.test(est)) return false;
    // "pagado/pagada" SIN envío con guía → esperando
    if (/^pagad/.test(est)) {
      const tieneGuia = orden.envio && orden.envio.numero_guia;
      return !tieneGuia;
    }
    return false;
  }));

  const camino = ordenarPorFecha(ordenes.filter((orden) => {
    const est = String(orden.estado || "").toLowerCase().trim();
    if (/^enviad/.test(est)) return true;
    // pagado CON guía de envío registrada también va a "En camino"
    if (/^pagad/.test(est) && orden.envio && orden.envio.numero_guia) return true;
    return false;
  }));

  const entregado = ordenarPorFecha(ordenes.filter((orden) =>
    /^entregad/.test(String(orden.estado || "").toLowerCase().trim())
  ));
  const pedidosPorVista = { esperando, camino, entregado };
  const pedidosActuales = pedidosPorVista[vista];

  // Paginación
  const totalPaginas = Math.ceil(pedidosActuales.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const pedidosPaginados = pedidosActuales.slice(indiceInicio, indiceFin);

  // Resetear página cuando cambia la vista
  useEffect(() => {
    setPaginaActual(1);
  }, [vista]);

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

  const cancelarPedido = async () => {
    const orden = cancelacionPendiente;
    const motivo = motivoCancelacion.trim();
    if (!orden || motivo.length < 5) return;
    setCancelando(true);
    try {
      await cancelOrder(idVisible(orden), motivo);
      setCancelacionPendiente(null);
      setMotivoCancelacion('');
      setAviso({ tipo: "exito", texto: `El pedido #${idVisible(orden)} fue cancelado.` });
      await cargarOrdenes();
      setVista("esperando");
    } catch (error) {
      setAviso({ tipo: "error", texto: error.response?.data?.detail || "No se pudo cancelar el pedido." });
    } finally {
      setCancelando(false);
    }
  };

  const TarjetaPedido = ({ orden, tipo }) => {
    const estilo = estilos[tipo];
    const envio = orden.envio;
    const esEntregado = tipo === "entregado";
    return (
      <article className={`pl-card seguimiento-card seguimiento-card--${tipo}`} style={{ padding: "24px", border: `1px solid ${estilo.borde}33`, borderRadius: "16px", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: "all 0.3s ease", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: estilo.borde }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
            <span style={{ width: "52px", height: "52px", borderRadius: "14px", background: estilo.fondo, display: "grid", placeItems: "center", flexShrink: 0, boxShadow: `0 2px 8px ${estilo.borde}22` }}><IconTruck width={26} height={26} strokeWidth={2} style={{ color: estilo.texto }} /></span>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: "1.1rem", color: "#1a1a1a", marginBottom: "6px", fontWeight: 700 }}>Pedido #{idVisible(orden)}</strong>
              <span className="seguimiento-card-subtitle" style={{ color: "#4b5563", fontSize: "0.95rem", display: "block", fontWeight: 500 }}>{envio?.empresa_mensajeria || (tipo === "esperando" ? "Pago confirmado" : "Información de envío")}</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "22px", paddingTop: "20px", borderTop: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span className="seguimiento-card-description" style={{ color: "#4b5563", fontSize: "0.96rem", lineHeight: 1.6, fontWeight: 500 }}>{tipo === "esperando" ? "El vendedor aún está preparando el envío." : esEntregado ? "Entrega confirmada por el comprador." : "Tu pedido está en ruta."}</span>
          {tipo === "camino" && <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <button className="seguimiento-confirm-button" type="button" disabled={confirmando === idVisible(orden) || cancelando} onClick={() => setConfirmacionPendiente(orden)} style={{ width: "100%", padding: "12px 16px", fontSize: "0.9rem", border: "1px solid #7A1E3A", borderRadius: "10px", background: "white", color: "#7A1E3A", cursor: "pointer", fontWeight: 600, transition: "all 0.2s", whiteSpace: "nowrap", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>{confirmando === idVisible(orden) ? "Confirmando..." : "Confirmar que recibí el pedido"}</button>
            <button type="button" disabled={cancelando} onClick={() => { setCancelacionPendiente(orden); setMotivoCancelacion(''); }} style={{ width: "100%", padding: "12px 16px", fontSize: "0.9rem", border: "1px solid #fecaca", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontWeight: 600, transition: "all 0.2s", whiteSpace: "nowrap", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>Cancelar pedido</button>
            <button className="seguimiento-info-button" type="button" onClick={() => abrirDetalle(orden)} style={{ width: "100%", padding: "12px 16px", fontSize: "0.9rem", border: `1px solid ${estilo.borde}`, borderRadius: "10px", background: "white", color: estilo.texto, cursor: "pointer", fontWeight: 600, transition: "all 0.2s", whiteSpace: "nowrap", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>Información del envío</button>
          </div>}
          {tipo === "entregado" && <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
            <button className="seguimiento-info-button" type="button" onClick={() => abrirDetalle(orden)} style={{ width: "100%", padding: "12px 16px", fontSize: "0.9rem", border: `1px solid ${estilo.borde}`, borderRadius: "10px", background: "white", color: estilo.texto, cursor: "pointer", fontWeight: 600, transition: "all 0.2s", whiteSpace: "nowrap", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>Información de entrega</button>
          </div>}
        </div>
      </article>
    );
  };

  const esDetalleEntregado = detalleAbierto && /^entregad/.test(String(detalleAbierto.estado || "").toLowerCase());
  const fechaDespacho = detalleAbierto?.envio?.fecha_despacho_con_hora || detalleAbierto?.envio?.actualizado_en || detalleAbierto?.envio?.fecha_despacho;

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cambiarItemsPorPagina = (nuevoItems) => {
    setItemsPorPagina(nuevoItems);
    setPaginaActual(1);
  };

  const obtenerPaginasVisibles = () => {
    const paginas = [];
    const maxPaginasVisibles = 5;
    let inicioPagina = Math.max(1, paginaActual - Math.floor(maxPaginasVisibles / 2));
    let finPagina = Math.min(totalPaginas, inicioPagina + maxPaginasVisibles - 1);

    if (finPagina - inicioPagina + 1 < maxPaginasVisibles) {
      inicioPagina = Math.max(1, finPagina - maxPaginasVisibles + 1);
    }

    for (let i = inicioPagina; i <= finPagina; i++) {
      paginas.push(i);
    }

    return paginas;
  };

  return (
    <>
      <div className="pl-card seguimiento-header" style={{ padding: "2.2rem 2rem", marginBottom: 28, borderRadius: "16px" }}><div style={{ display: "flex", alignItems: "center", gap: "16px" }}><IconTruck className="seguimiento-header-icon" width={32} height={32} strokeWidth={2} style={{ color: "#7A1E3A" }} /><div><h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1a1a1a" }}>Seguimiento de pedidos</h2><p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.5 }}>Consulta el estado de tus envíos y confirma cuando recibas tu pedido.</p></div></div></div>
      {ordenesLoading ? <div className="empty-state"><p>Cargando seguimientos...</p></div> : (
        <>
          <div className="seguimiento-tabs" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {Object.entries(estilos).map(([clave, estilo]) => <button className={`seguimiento-tab ${vista === clave ? "active" : ""}`} key={clave} type="button" onClick={() => setVista(clave)} style={{ padding: "14px 16px", borderRadius: "12px", border: `2px solid ${vista === clave ? estilo.borde : "#e5e7eb"}`, background: vista === clave ? estilo.borde : "white", color: vista === clave ? "white" : "#374151", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", transition: "all 0.2s", boxShadow: vista === clave ? `0 4px 12px ${estilo.borde}22` : "none" }}>{estilo.etiqueta} ({pedidosPorVista[clave].length})</button>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {pedidosActuales.length === 0 ? <div className="empty-state"><p>No tienes pedidos en “{estilos[vista].etiqueta}”.</p></div> : pedidosPaginados.map((orden) => <TarjetaPedido key={idVisible(orden)} orden={orden} tipo={vista} />)}
          </div>
          {pedidosActuales.length > 0 && (
            <div className="seguimiento-pagination" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", padding: "16px 20px", background: "#fafafa", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Mostrando {indiceInicio + 1}-{Math.min(indiceFin, pedidosActuales.length)} de {pedidosActuales.length} pedidos
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "white",
                    color: paginaActual === 1 ? "#9ca3af" : "#374151",
                    cursor: paginaActual === 1 ? "not-allowed" : "pointer",
                    fontSize: "0.87rem",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                >
                  Anterior
                </button>
                <div style={{ display: "flex", gap: "4px" }}>
                  {obtenerPaginasVisibles().map((pagina) => (
                    <button
                      key={pagina}
                      type="button"
                      onClick={() => cambiarPagina(pagina)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: pagina === paginaActual ? "1px solid #7A1E3A" : "1px solid #d1d5db",
                        background: pagina === paginaActual ? "#7A1E3A" : "white",
                        color: pagina === paginaActual ? "white" : "#374151",
                        cursor: "pointer",
                        fontSize: "0.87rem",
                        fontWeight: 600,
                        transition: "all 0.2s"
                      }}
                    >
                      {pagina}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "white",
                    color: paginaActual === totalPaginas ? "#9ca3af" : "#374151",
                    cursor: paginaActual === totalPaginas ? "not-allowed" : "pointer",
                    fontSize: "0.87rem",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                >
                  Siguiente
                </button>
              </div>
              <select
                value={itemsPorPagina}
                onChange={(e) => cambiarItemsPorPagina(Number(e.target.value))}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#374151",
                  fontSize: "0.87rem",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                <option value={8}>8 por pág.</option>
                <option value={12}>12 por pág.</option>
                <option value={16}>16 por pág.</option>
                <option value={20}>20 por pág.</option>
              </select>
            </div>
          )}
        </>
      )}
      {detalleAbierto && (
        <div role="dialog" aria-modal="true" aria-label={esDetalleEntregado ? "Información de entrega" : "Información del envío"} onClick={() => setDetalleAbierto(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(36, 20, 27, 0.52)", display: "grid", placeItems: "center", padding: "20px" }}>
          <section className="pl-card seguimiento-detail-modal" onClick={(event) => event.stopPropagation()} style={{ width: "min(580px, 100%)", padding: 0, overflow: "hidden", boxSizing: "border-box", boxShadow: "0 24px 70px rgba(36, 20, 27, 0.24)", borderRadius: "16px" }}>
            <header style={{ padding: "28px 30px 24px", background: esDetalleEntregado ? "linear-gradient(135deg, #14532d, #15803d)" : "linear-gradient(135deg, #173f8a, #2563eb)", color: "white", display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", opacity: 0.9 }}>{esDetalleEntregado ? "COMPROBANTE DE ENTREGA" : "DETALLE DEL ENVÍO"}</span>
                <h3 style={{ margin: "8px 0 0", fontSize: "1.45rem" }}>{esDetalleEntregado ? "Pedido entregado" : "Pedido en camino"}</h3>
                <p style={{ margin: "6px 0 0", opacity: 0.9, fontSize: "0.95rem" }}>Pedido #{idVisible(detalleAbierto)}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setDetalleAbierto(null)} style={{ width: "38px", height: "38px", border: "1px solid rgba(255,255,255,.45)", borderRadius: "50%", background: "rgba(255,255,255,.1)", color: "white", fontSize: "1.45rem", lineHeight: 1, cursor: "pointer", transition: "all 0.2s" }}>×</button>
            </header>
            <div className="seguimiento-detail-body" style={{ padding: "28px 30px 30px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                <DatoInfo etiqueta="Transportadora" valor={detalleAbierto.envio?.empresa_mensajeria || "No registrada"} />
                <DatoInfo etiqueta="Número de guía" valor={detalleAbierto.envio?.numero_guia || "No registrada"} />
              </div>
              <div style={{ marginTop: "26px" }}>
                <span style={{ display: "block", color: "#6b7280", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "14px" }}>MOVIMIENTO DEL PEDIDO</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  <EventoEntrega color="#2563eb" titulo="Enviado desde" detalle={origenEnvio(detalleAbierto)} fecha={formatearFechaHora(fechaDespacho)} />
                  {esDetalleEntregado && <EventoEntrega color="#15803d" titulo="Recibido" detalle="Entrega confirmada por el comprador" fecha={formatearFechaHora(detalleAbierto.fecha_entrega_confirmada)} />}
                </div>
              </div>
              {esDetalleEntregado && <div className="seguimiento-delivery-time" style={{ marginTop: "24px", padding: "16px 18px", borderRadius: "12px", background: "#ecfdf3", color: "#166534", fontSize: "0.94rem", lineHeight: 1.5 }}>Tiempo total de entrega: <strong>{diasEntre(fechaDespacho || detalleAbierto.fecha, detalleAbierto.fecha_entrega_confirmada) || "No disponible"}</strong></div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
                <button className="seguimiento-detail-close" type="button" onClick={() => setDetalleAbierto(null)} style={{ padding: "12px 18px", borderRadius: "8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", transition: "all 0.2s" }}>Cerrar</button>
                {!esDetalleEntregado && urlRastreo(detalleAbierto.envio) && <a href={urlRastreo(detalleAbierto.envio)} target="_blank" rel="noreferrer" className="btn btn-vinotinto seguimiento-track-button" style={{ width: "auto", padding: "12px 18px", fontSize: "0.95rem", borderRadius: "8px" }}>Ver rastreo</a>}
              </div>
            </div>
          </section>
        </div>
      )}
      {confirmacionPendiente && <div role="dialog" aria-modal="true" aria-label="Confirmar entrega" onClick={() => setConfirmacionPendiente(null)} style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(36, 20, 27, 0.45)", display: "grid", placeItems: "center", padding: "20px" }}><div className="pl-card" onClick={(event) => event.stopPropagation()} style={{ width: "min(460px, 100%)", padding: "28px", boxSizing: "border-box", borderRadius: "16px" }}><h3 style={{ margin: 0 }}>¿Recibiste tu pedido?</h3><p style={{ color: "#666", lineHeight: 1.5 }}>Al confirmar, el pedido #{idVisible(confirmacionPendiente)} pasará a “Entregado”.</p><div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}><button type="button" onClick={() => setConfirmacionPendiente(null)} style={{ padding: "9px 14px", borderRadius: "6px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}>Cancelar</button><button className="btn btn-vinotinto" type="button" onClick={confirmarRecepcion} style={{ width: "auto", padding: "9px 14px" }}>Sí, confirmar entrega</button></div></div></div>}
      {cancelacionPendiente && <div role="dialog" aria-modal="true" aria-label="Cancelar pedido" onClick={() => !cancelando && setCancelacionPendiente(null)} style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(36, 20, 27, 0.45)", display: "grid", placeItems: "center", padding: "20px" }}><div className="pl-card" onClick={(event) => event.stopPropagation()} style={{ width: "min(500px, 100%)", padding: "28px", boxSizing: "border-box", borderRadius: "16px" }}><h3 style={{ margin: 0, color: "#b42318" }}>Cancelar pedido #{idVisible(cancelacionPendiente)}</h3><p style={{ color: "#666", lineHeight: 1.5 }}>Indica el motivo de la cancelación. Esta acción actualizará el pedido para el comprador y el vendedor.</p><label htmlFor="motivo-cancelacion" style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Motivo</label><textarea id="motivo-cancelacion" value={motivoCancelacion} onChange={(event) => setMotivoCancelacion(event.target.value)} placeholder="Ej. Ya no necesito el pedido" maxLength={500} rows={4} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "10px", border: "1px solid #d1d5db", borderRadius: "7px", fontFamily: "inherit" }} /><div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}><button type="button" onClick={() => setCancelacionPendiente(null)} disabled={cancelando} style={{ padding: "9px 14px", borderRadius: "6px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}>Volver</button><button type="button" onClick={cancelarPedido} disabled={cancelando || motivoCancelacion.trim().length < 5} style={{ padding: "9px 14px", borderRadius: "6px", border: "none", background: "#b42318", color: "white", cursor: "pointer", fontWeight: 700, opacity: cancelando || motivoCancelacion.trim().length < 5 ? 0.55 : 1 }}>{cancelando ? "Cancelando..." : "Confirmar cancelación"}</button></div></div></div>}
      {aviso && <div role="dialog" aria-modal="true" aria-label="Resultado de la entrega" onClick={() => setAviso(null)} style={{ position: "fixed", inset: 0, zIndex: 1002, background: "rgba(36, 20, 27, 0.45)", display: "grid", placeItems: "center", padding: "20px" }}><div className="pl-card" onClick={(event) => event.stopPropagation()} style={{ width: "min(420px, 100%)", padding: "24px", boxSizing: "border-box" }}><h3 style={{ margin: 0, color: aviso.tipo === "exito" ? "#166534" : "#b42318" }}>{aviso.tipo === "exito" ? "Entrega confirmada" : "No fue posible confirmar"}</h3><p style={{ color: "#555", lineHeight: 1.5 }}>{aviso.texto}</p><div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}><button className="btn btn-vinotinto" type="button" onClick={() => setAviso(null)} style={{ width: "auto", padding: "9px 14px" }}>Entendido</button></div></div></div>}
    </>
  );
}
