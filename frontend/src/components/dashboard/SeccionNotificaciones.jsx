import { useState, useEffect, useCallback } from "react";
import {
  IconPackage, IconMessage, IconStar, IconGift,
  IconCreditCard, IconTruck, IconInfo, IconShoppingBag
} from "../Icons";
import { notificacionesService } from "../../services/notificaciones";
import { getOrdenes } from "../../services/api";
import { useNavigate } from "react-router-dom";
import "../../styles/Notificaciones.css";

export default function SeccionNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const [notificacionesFilter, setNotificacionesFilter] = useState("todas");
  const [notificacionesLeidasAutomaticas, setNotificacionesLeidasAutomaticas] = useState(new Set());
  const [notificacionesEliminadasAutomaticas, setNotificacionesEliminadasAutomaticas] = useState(new Set());
  const [ordenes, setOrdenes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getOrdenes()
      .then((res) => setOrdenes(res.data))
      .catch((err) => console.error(err));
  }, []);

  const generarNotificacionesOrdenes = useCallback(() => {
    const notificacionesGeneradas = [];
    ordenes.forEach((orden) => {
      if (orden.estado === "pendiente") {
        const idNotif = `orden-pendiente-${orden.id_orden}`;
        if (notificacionesEliminadasAutomaticas.has(idNotif)) return;
        const estaLeida = notificacionesLeidasAutomaticas.has(idNotif);
        notificacionesGeneradas.push({
          id_notificacion: idNotif,
          tipo: "pago",
          titulo: "Pago Pendiente",
          descripcion: `Tienes un pago pendiente de ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} para la orden #${orden.id_orden}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: estaLeida,
          referencia_id: orden.id_orden,
          es_automatica: true,
        });
      } else if (
        orden.estado === "completada" ||
        orden.estado === "pagada" ||
        orden.estado === "pagado"
      ) {
        const idNotif = `orden-completada-${orden.id_orden}`;
        if (notificacionesEliminadasAutomaticas.has(idNotif)) return;
        const estaLeida = notificacionesLeidasAutomaticas.has(idNotif);
        notificacionesGeneradas.push({
          id_notificacion: idNotif,
          tipo: "pedido",
          titulo: "Compra Realizada",
          descripcion: `Tu compra #${orden.id_orden} ha sido completada exitosamente por ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: estaLeida,
          referencia_id: orden.id_orden,
          es_automatica: true,
        });
      }
    });
    return notificacionesGeneradas;
  }, [ordenes, notificacionesLeidasAutomaticas, notificacionesEliminadasAutomaticas]);

  // Tipos de notificación que corresponden a cada filtro del comprador
  const FILTROS_COMPRADOR = {
    todas:           null,                           // sin filtro
    no_leidas:       null,                           // se filtra por leida=false
    pedidos_envios:  ["pedido", "entrega", "pago"],
    reclamos:        ["sistema"],
    mensajes:        ["mensaje"],
  };

  const aplicarFiltro = (lista) => {
    if (notificacionesFilter === "no_leidas") return lista.filter((n) => !n.leida);
    const tipos = FILTROS_COMPRADOR[notificacionesFilter];
    if (!tipos) return lista; // "todas"
    return lista.filter((n) => tipos.includes(n.tipo));
  };

  const cargarNotificaciones = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setNotificacionesLoading(true);
        const data = await notificacionesService.obtener(false, 50, 0);
        const notificacionesAPI = data.notificaciones || [];
        const notificacionesOrdenes = generarNotificacionesOrdenes();

        // Evitar duplicados entre API y órdenes automáticas
        const idsRefCubiertos = new Set(
          notificacionesAPI
            .filter((n) => n.tipo === "pedido" || n.tipo === "pago")
            .map((n) => String(n.referencia_id || n.id_referencia))
        );
        const ordenesNoRepetidas = notificacionesOrdenes.filter(
          (n) => !idsRefCubiertos.has(String(n.referencia_id))
        );

        const todas = [...notificacionesAPI, ...ordenesNoRepetidas];
        setNotificaciones(todas);
      } catch (err) {
        console.error("Error cargando notificaciones:", err);
        const notificacionesOrdenes = generarNotificacionesOrdenes();
        setNotificaciones(notificacionesOrdenes);
      } finally {
        if (!silent) setNotificacionesLoading(false);
      }
    },
    [generarNotificacionesOrdenes]
  );

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  const handleMarcarLeida = async (id_notificacion) => {
    const notif = notificaciones.find((n) => n.id_notificacion === id_notificacion);
    try {
      if (notif?.es_automatica) {
        setNotificacionesLeidasAutomaticas((prev) => new Set([...prev, id_notificacion]));
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id_notificacion === id_notificacion ? { ...n, leida: true } : n
          )
        );
      } else {
        await notificacionesService.marcarLeida(id_notificacion);
        await cargarNotificaciones(true);
      }
    } catch (err) {
      console.error("Error marcando notificación como leída:", err);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      const automaticasIds = notificaciones
        .filter((n) => n.es_automatica)
        .map((n) => n.id_notificacion);
      setNotificacionesLeidasAutomaticas((prev) => new Set([...prev, ...automaticasIds]));
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      await notificacionesService.marcarTodasLeidas();
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error marcando todas como leídas:", err);
    }
  };

  const handleEliminar = async (id_notificacion) => {
    const notif = notificaciones.find((n) => n.id_notificacion === id_notificacion);
    try {
      if (notif?.es_automatica) {
        setNotificacionesEliminadasAutomaticas((prev) => new Set([...prev, id_notificacion]));
        setNotificacionesLeidasAutomaticas((prev) => {
          const next = new Set(prev);
          next.delete(id_notificacion);
          return next;
        });
        setNotificaciones((prev) => prev.filter((n) => n.id_notificacion !== id_notificacion));
      } else {
        await notificacionesService.eliminar(id_notificacion);
        await cargarNotificaciones(true);
      }
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    }
  };

  const handleClickNotificacion = async (notif) => {
    if (!notif.leida) await handleMarcarLeida(notif.id_notificacion);

    if (notif.es_automatica) {
      navigate("/?seccion=Mis%20Compras");
    } else if (notif.tipo === "mensaje" && notif.referencia_id) {
      navigate(`/?seccion=Mensajes&sala=${notif.referencia_id}`);
    } else if (notif.tipo === "pedido" || notif.tipo === "pago") {
      navigate("/?seccion=Mis%20Compras");
    } else if (notif.tipo === "sistema") {
      navigate("/?seccion=Quejas%20y%20reclamos");
    }
  };

  // ── Icono por tipo ─────────────────────────────────────────────────────────

  const getIconoTipo = (tipo) => {
    const iconos = {
      mensaje:    <IconMessage    width={24} height={24} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
      resena:     <IconStar       width={24} height={24} strokeWidth={1.5} style={{ color: "#FFA500" }} />,
      oferta:     <IconGift       width={24} height={24} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
      pedido:     <IconShoppingBag width={24} height={24} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
      entrega:    <IconTruck      width={24} height={24} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
      pago:       <IconCreditCard  width={24} height={24} strokeWidth={1.5} style={{ color: "#10b981" }} />,
      sistema:    <IconInfo       width={24} height={24} strokeWidth={1.5} style={{ color: "#666"    }} />,
      devolucion: <IconPackage    width={24} height={24} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />,
    };
    return iconos[tipo] || <IconShoppingBag width={24} height={24} strokeWidth={1.5} style={{ color: "#7A1E3A" }} />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="notificaciones-container notificaciones-container--embedded">
      <div className="notificaciones-wrapper">

        {/* Header */}
        <div className="notif-header notif-header--embedded">
          <h1>Notificaciones</h1>
          {notificaciones.some((n) => !n.leida) && (
            <button className="btn-marcar-todas" onClick={handleMarcarTodasLeidas}>
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="notif-filtros">
          {[
            { key: "todas",          label: "Todas",             tipos: null },
            { key: "no_leidas",      label: "No leídas",         tipos: null,                       soloNoLeidas: true },
            { key: "pedidos_envios", label: "Pedidos y envíos",  tipos: ["pedido", "entrega", "pago"] },
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
                onClick={() => setNotificacionesFilter(key)}
              >
                {label}
                {count > 0 && (
                  <span className="filtro-badge">{count > 99 ? "99+" : count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lista */}
        <div className="notif-lista">
          {notificacionesLoading ? (
            <div className="loading">Cargando...</div>
          ) : aplicarFiltro(notificaciones).length === 0 ? (
            <div className="notif-empty">
              <p>
                {notificacionesFilter === "no_leidas"
                  ? "No tienes notificaciones sin leer"
                  : "No tienes notificaciones en esta categoría"}
              </p>
            </div>
          ) : (
            aplicarFiltro(notificaciones).map((notif) => (
              <div
                key={notif.id_notificacion}
                className={`notif-item ${notif.leida ? "" : "no-leida"}`}
                onClick={() => handleClickNotificacion(notif)}
              >
                <div className="notif-icono">
                  <span>{getIconoTipo(notif.tipo)}</span>
                </div>
                <div className="notif-contenido">
                  <h3>{notif.titulo}</h3>
                  <p>{notif.descripcion || notif.cuerpo}</p>
                  <small>
                    {notif.fecha_creacion
                      ? new Date(notif.fecha_creacion).toLocaleString("es-CO", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Ahora"}
                  </small>
                </div>
                <div className="notif-acciones">
                  {!notif.leida && (
                    <button
                      className="btn-marcar"
                      title="Marcar como leída"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarcarLeida(notif.id_notificacion);
                      }}
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="btn-eliminar"
                    title="Eliminar"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(notif.id_notificacion);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
