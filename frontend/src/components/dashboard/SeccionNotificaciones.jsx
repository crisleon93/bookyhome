import { useState, useEffect, useCallback, useMemo } from "react";
import {
  IconPackage, IconMessage, IconStar, IconGift,
  IconCreditCard, IconTruck, IconInfo, IconShoppingBag
} from "../Icons";
import { notificacionesService } from "../../services/notificaciones";
import { getOrdenes } from "../../services/api";
import { useNavigate } from "react-router-dom";
import "../../styles/Notificaciones.css";

// ── Opciones de eliminación masiva ────────────────────────────────────────────
const OPCIONES_ELIMINAR = [
  { value: "leidas",  label: "Solo las leídas" },
  { value: "hoy",     label: "De hoy" },
  { value: "semana",  label: "De los últimos 7 días" },
  { value: "mes",     label: "Del último mes" },
  { value: "todas",   label: "Todas las notificaciones" },
];

export default function SeccionNotificaciones() {
  // ── Datos ─────────────────────────────────────────────────────────────────
  const [notificaciones, setNotificaciones]           = useState([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const navigate = useNavigate();

  // ── Filtro de categoría ───────────────────────────────────────────────────
  const [notificacionesFilter, setNotificacionesFilter] = useState("todas");
  const [notificacionesOrden, setNotificacionesOrden] = useState("recientes");

  // ── Paginación ────────────────────────────────────────────────────────────
  const [paginaActual,      setPaginaActual]      = useState(1);
  const [notifPorPagina,    setNotifPorPagina]    = useState(10);

  // ── Eliminación masiva ────────────────────────────────────────────────────
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [deleteFilter,      setDeleteFilter]      = useState("leidas");
  const [eliminando,        setEliminando]        = useState(false);

  // ── Sets de estado local para notificaciones sintéticas ───────────────────
  const [notificacionesLeidasAutomaticas,     setNotificacionesLeidasAutomaticas]
    = useState(new Set());
  const [notificacionesEliminadasAutomaticas, setNotificacionesEliminadasAutomaticas]
    = useState(new Set());

  // ── Generar notificaciones sintéticas desde órdenes ───────────────────────
  const generarNotificacionesOrdenes = useCallback((ordenes = []) => {
    const generadas = [];
    ordenes.forEach((orden) => {
      if (orden.estado === "pendiente") {
        const id = `orden-pendiente-${orden.id_orden}`;
        if (notificacionesEliminadasAutomaticas.has(id)) return;
        generadas.push({
          id_notificacion: id,
          tipo: "pago",
          titulo: "Pago Pendiente",
          descripcion: `Tienes un pago pendiente de ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} para la orden #${orden.id_orden}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: notificacionesLeidasAutomaticas.has(id),
          referencia_id: orden.id_orden,
          es_automatica: true,
        });
      } else if (["completada", "pagada", "pagado", "entregada", "entregado", "enviado", "procesando"].includes(orden.estado)) {
        const esEntregada = ["entregada", "entregado"].includes(orden.estado);
        const esEnviada = ["enviado", "procesando"].includes(orden.estado);
        const id = `orden-estado-${orden.id_orden}`;
        if (notificacionesEliminadasAutomaticas.has(id)) return;
        generadas.push({
          id_notificacion: id,
          tipo: esEntregada || esEnviada ? "entrega" : "pedido",
          titulo: esEntregada ? "Compra entregada" : esEnviada ? "Compra en camino" : "Compra realizada",
          descripcion: esEntregada
            ? `Tu compra #${orden.id_orden} fue entregada correctamente por ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}.`
            : esEnviada
              ? `Tu compra #${orden.id_orden} está en proceso de entrega por ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}.`
              : `Tu compra #${orden.id_orden} fue confirmada por ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}.`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: notificacionesLeidasAutomaticas.has(id),
          referencia_id: orden.id_orden,
          es_automatica: true,
        });
      }
    });
    return generadas;
  }, [notificacionesLeidasAutomaticas, notificacionesEliminadasAutomaticas]);

  // ── Cargar notificaciones API + mezclar sintéticas ────────────────────────
  const cargarNotificaciones = useCallback(async (silent = false) => {
    try {
      if (!silent) setNotificacionesLoading(true);
      const [data, ordenesResponse] = await Promise.all([
        notificacionesService.obtener(false, 200, 0),
        getOrdenes(),
      ]);
      const apiItems       = data.notificaciones || [];
      const ordenes = ordenesResponse.data?.orders || ordenesResponse.data || [];
      const sinteticas     = generarNotificacionesOrdenes(ordenes);
      const idsRefCubiertos = new Set(
        apiItems
          .filter((n) => n.tipo === "pedido" || n.tipo === "pago")
          .map((n) => String(n.referencia_id || n.id_referencia))
      );
      const sinteticasFiltradas = sinteticas.filter(
        (n) => !idsRefCubiertos.has(String(n.referencia_id))
      );
      setNotificaciones([...apiItems, ...sinteticasFiltradas]);
    } catch {
      setNotificaciones([]);
    } finally {
      if (!silent) setNotificacionesLoading(false);
    }
  }, [generarNotificacionesOrdenes]);

  useEffect(() => { cargarNotificaciones(); }, [cargarNotificaciones]);

  // ── Filtro por categoría ──────────────────────────────────────────────────
  const FILTROS = {
    todas:           null,
    no_leidas:       null,
    pedidos_envios:  ["pedido", "entrega", "pago"],
    reclamos:        ["sistema"],
    mensajes:        ["mensaje"],
  };

  const notificacionesFiltradas = useMemo(() => {
    let lista = notificaciones;
    if (notificacionesFilter === "no_leidas") lista = lista.filter((n) => !n.leida);
    const tipos = FILTROS[notificacionesFilter];
    if (tipos) lista = lista.filter((n) => tipos.includes(n.tipo));
    return [...lista].sort((a, b) => {
      const fechaA = new Date(a.fecha_creacion || 0).getTime();
      const fechaB = new Date(b.fecha_creacion || 0).getTime();
      return notificacionesOrden === "antiguas" ? fechaA - fechaB : fechaB - fechaA;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificaciones, notificacionesFilter, notificacionesOrden]);

  // ── Paginación derivada ───────────────────────────────────────────────────
  const totalFiltradas  = notificacionesFiltradas.length;
  const totalPaginas    = Math.max(1, Math.ceil(totalFiltradas / notifPorPagina));
  const paginaSegura    = Math.min(paginaActual, totalPaginas);
  const notifPaginadas  = notificacionesFiltradas.slice(
    (paginaSegura - 1) * notifPorPagina,
    paginaSegura * notifPorPagina
  );

  // ── Acciones individuales ─────────────────────────────────────────────────
  const handleMarcarLeida = async (id) => {
    const notif = notificaciones.find((n) => n.id_notificacion === id);
    if (notif?.es_automatica) {
      setNotificacionesLeidasAutomaticas((prev) => new Set([...prev, id]));
      setNotificaciones((prev) => prev.map((n) => n.id_notificacion === id ? { ...n, leida: true } : n));
    } else {
      try { await notificacionesService.marcarLeida(id); await cargarNotificaciones(true); } catch (error) { console.error("Error marcando notificación como leída:", error); }
    }
  };

  const handleMarcarTodasLeidas = async () => {
    const autoIds = notificaciones.filter((n) => n.es_automatica).map((n) => n.id_notificacion);
    setNotificacionesLeidasAutomaticas((prev) => new Set([...prev, ...autoIds]));
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    try { await notificacionesService.marcarTodasLeidas(); await cargarNotificaciones(true); } catch (error) { console.error("Error marcando notificaciones como leídas:", error); }
  };

  const handleEliminar = async (id) => {
    const notif = notificaciones.find((n) => n.id_notificacion === id);
    if (notif?.es_automatica) {
      setNotificacionesEliminadasAutomaticas((prev) => new Set([...prev, id]));
      setNotificacionesLeidasAutomaticas((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setNotificaciones((prev) => prev.filter((n) => n.id_notificacion !== id));
    } else {
      try { await notificacionesService.eliminar(id); await cargarNotificaciones(true); } catch (error) { console.error("Error eliminando notificación:", error); }
    }
  };

  // ── Eliminación masiva ────────────────────────────────────────────────────
  const handleEliminarVarias = async () => {
    setEliminando(true);
    try {
      await notificacionesService.eliminarVarias(deleteFilter);
      // Para filtros que incluyen sintéticas en memoria, también limpiar el estado local
      if (deleteFilter === "todas") {
        setNotificacionesEliminadasAutomaticas(
          new Set(notificaciones.filter((n) => n.es_automatica).map((n) => n.id_notificacion))
        );
      }
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error eliminando notificaciones:", err);
    } finally {
      setEliminando(false);
      setShowDeleteModal(false);
      setPaginaActual(1);
    }
  };

  // ── Click en notificación ─────────────────────────────────────────────────
  const handleClickNotificacion = async (notif) => {
    if (!notif.leida) await handleMarcarLeida(notif.id_notificacion);
    if (notif.es_automatica || notif.tipo === "pedido" || notif.tipo === "pago") {
      navigate("/?seccion=Mis%20Compras");
    } else if (notif.tipo === "mensaje" && notif.referencia_id) {
      navigate(`/?seccion=Mensajes&sala=${notif.referencia_id}`);
    } else if (notif.tipo === "sistema") {
      navigate("/?seccion=Quejas%20y%20reclamos");
    }
  };

  // ── Icono por tipo ────────────────────────────────────────────────────────
  const getIconoTipo = (tipo) => ({
    mensaje:    <IconMessage     width={22} height={22} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
    resena:     <IconStar        width={22} height={22} strokeWidth={1.5} style={{ color: "#FFA500" }} />,
    oferta:     <IconGift        width={22} height={22} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
    pedido:     <IconShoppingBag width={22} height={22} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
    entrega:    <IconTruck       width={22} height={22} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
    pago:       <IconCreditCard  width={22} height={22} strokeWidth={1.5} style={{ color: "#10b981" }} />,
    sistema:    <IconInfo        width={22} height={22} strokeWidth={1.5} style={{ color: "#666"    }} />,
    devolucion: <IconPackage     width={22} height={22} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
  }[tipo] || <IconShoppingBag width={22} height={22} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="notificaciones-container notificaciones-container--embedded">
      <div className="notificaciones-wrapper">

        {/* ── HEADER ── */}
        <div className="notif-header notif-header--embedded" style={{ flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ margin: 0 }}>Notificaciones</h1>
            {noLeidas > 0 && (
              <span style={{
                background: "#7A1E3A", color: "#fff",
                fontSize: "0.72rem", fontWeight: 800,
                padding: "2px 10px", borderRadius: 20
              }}>
                {noLeidas} sin leer
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {noLeidas > 0 && (
              <button className="btn-marcar-todas" onClick={handleMarcarTodasLeidas}>
                Marcar todas como leídas
              </button>
            )}
            <button
              className="btn-eliminar-mensajes"
              onClick={() => { setDeleteFilter("leidas"); setShowDeleteModal(true); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8,
                background: "#FEF2F2", border: "1.5px solid #FECACA",
                color: "#DC2626", fontSize: "0.82rem", fontWeight: 700,
                cursor: "pointer", transition: "all 0.18s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#DC2626"; }}
            >
              🗑️ Eliminar mensajes
            </button>
          </div>
        </div>

        {/* ── FILTROS DE CATEGORÍA ── */}
        <div className="notif-filtros">
          {[
            { key: "todas",          label: "Todas",              tipos: null },
            { key: "no_leidas",      label: "No leídas",          soloNoLeidas: true },
            { key: "pedidos_envios", label: "Pedidos y envíos",   tipos: ["pedido", "entrega", "pago"] },
            { key: "reclamos",       label: "Reclamos y soporte", tipos: ["sistema"] },
            { key: "mensajes",       label: "Mensajes",           tipos: ["mensaje"] },
          ].map(({ key, label, tipos, soloNoLeidas }) => {
            const count = soloNoLeidas
              ? notificaciones.filter((n) => !n.leida).length
              : tipos
                ? notificaciones.filter((n) => tipos.includes(n.tipo)).length
                : notificaciones.length;
            return (
              <button
                key={key}
                className={`filtro ${notificacionesFilter === key ? "active" : ""}`}
                onClick={() => { setNotificacionesFilter(key); setPaginaActual(1); }}
              >
                {label}
                {count > 0 && <span className="filtro-badge">{count > 99 ? "99+" : count}</span>}
              </button>
            );
          })}
          <label className="notif-orden-control">
            <span aria-hidden="true">🗓️</span>
            <select
              value={notificacionesOrden}
              onChange={(e) => { setNotificacionesOrden(e.target.value); setPaginaActual(1); }}
              aria-label="Ordenar notificaciones"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguas">Más antiguas</option>
            </select>
          </label>
        </div>

        {/* ── LISTA ── */}
        <div className="notif-lista">
          {notificacionesLoading ? (
            <div className="loading">Cargando...</div>
          ) : notifPaginadas.length === 0 ? (
            <div className="notif-empty">
              <p>
                {notificacionesFilter === "no_leidas"
                  ? "No tienes notificaciones sin leer"
                  : "No tienes notificaciones en esta categoría"}
              </p>
            </div>
          ) : (
            notifPaginadas.map((notif) => (
              <div
                key={notif.id_notificacion}
                className={`notif-item ${notif.leida ? "" : "no-leida"}`}
                onClick={() => handleClickNotificacion(notif)}
              >
                <div className="notif-icono"><span>{getIconoTipo(notif.tipo)}</span></div>
                <div className="notif-contenido">
                  <h3>{notif.titulo}</h3>
                  <p>{notif.descripcion || notif.cuerpo}</p>
                  <small>
                    {notif.fecha_creacion
                      ? new Date(notif.fecha_creacion).toLocaleString("es-CO", {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "Ahora"}
                  </small>
                </div>
                <div className="notif-acciones">
                  {!notif.leida && (
                    <button className="btn-marcar" title="Marcar como leída"
                      onClick={(e) => { e.stopPropagation(); handleMarcarLeida(notif.id_notificacion); }}>
                      ✓
                    </button>
                  )}
                  <button className="btn-eliminar" title="Eliminar"
                    onClick={(e) => { e.stopPropagation(); handleEliminar(notif.id_notificacion); }}>
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── PAGINACIÓN ── */}
        {totalFiltradas > notifPorPagina && (
          <div className="mis-libros-pagination-bar">
            <div className="pagination-info">
              Mostrando <strong>{(paginaSegura - 1) * notifPorPagina + 1}–{Math.min(paginaSegura * notifPorPagina, totalFiltradas)}</strong> de <strong>{totalFiltradas}</strong> {totalFiltradas === 1 ? "notificación" : "notificaciones"}
              {totalFiltradas !== notificaciones.length && (
                <span className="pagination-total-note"> (filtradas de {notificaciones.length} totales)</span>
              )}
            </div>

            <div className="pagination-controls">
              <button type="button" className="pagination-btn-nav"
                disabled={paginaSegura <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}>
                ‹ Anterior
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
                  if (num === 1 || num === totalPaginas || Math.abs(num - paginaSegura) <= 1) {
                    return (
                      <button key={num} type="button"
                        className={`pagination-num-btn ${num === paginaSegura ? "active" : ""}`}
                        onClick={() => setPaginaActual(num)}>
                        {num}
                      </button>
                    );
                  } else if (
                    (num === 2 && paginaSegura > 3) ||
                    (num === totalPaginas - 1 && paginaSegura < totalPaginas - 2)
                  ) {
                    return <span key={num} className="pagination-ellipsis">…</span>;
                  }
                  return null;
                })}
              </div>

              <button type="button" className="pagination-btn-nav"
                disabled={paginaSegura >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}>
                Siguiente ›
              </button>
            </div>

            <div className="pagination-per-page">
              <label htmlFor="notif-per-page">Ver:</label>
              <select id="notif-per-page" className="select-per-page"
                value={notifPorPagina}
                onChange={(e) => { setNotifPorPagina(Number(e.target.value)); setPaginaActual(1); }}>
                <option value={5}>5 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
                <option value={50}>50 por pág.</option>
              </select>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL ELIMINAR MENSAJES ── */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div className="notificaciones-delete-modal" style={{
            background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420,
            padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}>
            <h2 className="notificaciones-delete-modal-title" style={{ margin: "0 0 6px", fontSize: "1.15rem", fontWeight: 800, color: "#1F2937" }}>
              🗑️ Eliminar notificaciones
            </h2>
            <p className="notificaciones-delete-modal-description" style={{ margin: "0 0 20px", fontSize: "0.86rem", color: "#6B7280" }}>
              Selecciona qué notificaciones quieres eliminar. Esta acción no se puede deshacer.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {OPCIONES_ELIMINAR.map((op) => (
                <label key={op.value} className={`notificaciones-delete-option ${deleteFilter === op.value ? "selected" : ""}`} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                  border: `1.5px solid ${deleteFilter === op.value ? "#7A1E3A" : "#E5E7EB"}`,
                  background: deleteFilter === op.value ? "#FDF2F4" : "#FAFAF9",
                  transition: "all 0.15s"
                }}>
                  <input
                    type="radio" name="deleteFilter" value={op.value}
                    checked={deleteFilter === op.value}
                    onChange={() => setDeleteFilter(op.value)}
                    style={{ accentColor: "#7A1E3A" }}
                  />
                  <span style={{
                    fontSize: "0.88rem", fontWeight: 600,
                    color: deleteFilter === op.value ? "#7A1E3A" : "#374151"
                  }}>
                    {op.label}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="notificaciones-delete-cancel"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E5E7EB",
                  background: "#F9FAFB", color: "#374151", fontWeight: 700,
                  fontSize: "0.85rem", cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                className="notificaciones-delete-submit"
                onClick={handleEliminarVarias}
                disabled={eliminando}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "none",
                  background: eliminando ? "#e5e7eb" : "#DC2626",
                  color: eliminando ? "#9ca3af" : "#fff",
                  fontWeight: 700, fontSize: "0.85rem",
                  cursor: eliminando ? "not-allowed" : "pointer",
                  transition: "all 0.18s"
                }}
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
