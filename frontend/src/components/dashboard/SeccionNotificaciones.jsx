import { useState, useEffect, useCallback } from "react";
import { IconPackage, IconMessage, IconStar, IconGift, IconCreditCard, IconTruck, IconInfo } from "../Icons";
import { notificacionesService } from "../../services/notificaciones";
import { getOrdenes } from "../../services/api";
import { useNavigate } from "react-router-dom";

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
      if (orden.estado === 'pendiente') {
        const idNotif = `orden-pendiente-${orden.id_orden}`;
        if (notificacionesEliminadasAutomaticas.has(idNotif)) return;
        const estaLeida = notificacionesLeidasAutomaticas.has(idNotif);
        notificacionesGeneradas.push({
          id_notificacion: idNotif,
          tipo: 'pago',
          titulo: 'Pago Pendiente',
          descripcion: `Tienes un pago pendiente de ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} para la orden #${orden.id_orden}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: estaLeida,
          referencia_id: orden.id_orden,
          es_automatica: true
        });
      } else if (orden.estado === 'completada' || orden.estado === 'pagada' || orden.estado === 'pagado') {
        const idNotif = `orden-completada-${orden.id_orden}`;
        if (notificacionesEliminadasAutomaticas.has(idNotif)) return;
        const estaLeida = notificacionesLeidasAutomaticas.has(idNotif);
        notificacionesGeneradas.push({
          id_notificacion: idNotif,
          tipo: 'pedido',
          titulo: 'Compra Realizada',
          descripcion: `Tu compra #${orden.id_orden} ha sido completada exitosamente por ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: estaLeida,
          referencia_id: orden.id_orden,
          es_automatica: true
        });
      }
    });
    return notificacionesGeneradas;
  }, [ordenes, notificacionesLeidasAutomaticas, notificacionesEliminadasAutomaticas]);

  const cargarNotificaciones = useCallback(async (silent = false) => {
    try {
      if (!silent) setNotificacionesLoading(true);
      const data = await notificacionesService.obtener(false, 50, 0);
      const notificacionesAPI = data.notificaciones || [];
      const notificacionesOrdenes = generarNotificacionesOrdenes();
      const todasNotificaciones = [...notificacionesOrdenes, ...notificacionesAPI];
      if (notificacionesFilter === "no_leidas") {
        setNotificaciones(todasNotificaciones.filter(n => !n.leida));
      } else {
        setNotificaciones(todasNotificaciones);
      }
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
      const notificacionesOrdenes = generarNotificacionesOrdenes();
      if (notificacionesFilter === "no_leidas") {
        setNotificaciones(notificacionesOrdenes.filter(n => !n.leida));
      } else {
        setNotificaciones(notificacionesOrdenes);
      }
    } finally {
      if (!silent) setNotificacionesLoading(false);
    }
  }, [notificacionesFilter, generarNotificacionesOrdenes]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  const onMarcarTodasLeidas = async () => {
    try {
      const automaticasIds = notificaciones.filter(n => n.es_automatica).map(n => n.id_notificacion);
      setNotificacionesLeidasAutomaticas(prev => new Set([...prev, ...automaticasIds]));
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      await notificacionesService.marcarTodasLeidas();
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error marcando todas como leídas:", err);
    }
  };

  const onEliminar = async (id_notificacion) => {
    try {
      const notif = notificaciones.find(n => n.id_notificacion === id_notificacion);
      if (notif?.es_automatica) {
        setNotificacionesEliminadasAutomaticas(prev => new Set([...prev, id_notificacion]));
        setNotificacionesLeidasAutomaticas(prev => {
          const newSet = new Set(prev);
          newSet.delete(id_notificacion);
          return newSet;
        });
        setNotificaciones(prev => prev.filter(n => n.id_notificacion !== id_notificacion));
      } else {
        await notificacionesService.eliminar(id_notificacion);
        await cargarNotificaciones(true);
      }
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    }
  };

  const onHandleClickNotificacion = async (notif) => {
    if (!notif.leida) {
      try {
        if (notif.es_automatica) {
          setNotificacionesLeidasAutomaticas(prev => new Set([...prev, notif.id_notificacion]));
          setNotificaciones(prev => prev.map(n => 
            n.id_notificacion === notif.id_notificacion ? { ...n, leida: true } : n
          ));
        } else {
          await notificacionesService.marcarLeida(notif.id_notificacion);
          await cargarNotificaciones(true);
        }
      } catch (err) {
        console.error("Error marcando como leída:", err);
      }
    }

    if (notif.es_automatica) {
      navigate('/?seccion=Mis%20Compras');
    } else if (notif.tipo === 'mensaje' && notif.referencia_id) {
      navigate(`/?seccion=Mensajes&sala=${notif.referencia_id}`);
    }
  };

  const onSetNotificacionesFilter = setNotificacionesFilter;
  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': '#f59e0b',
      'confirmada': '#3b82f6', 
      'enviada': '#8b5cf6',
      'entregada': '#10b981',
      'cancelada': '#ef4444',
      'completada': '#10b981'
    };
    return colores[estado] || colores['pendiente'];
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      mensaje: <IconMessage width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      resena: <IconStar width={24} height={24} strokeWidth={1.5} style={{ color: '#FFA500' }} />,
      oferta: <IconGift width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      pedido: <IconPackage width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      pago: <IconCreditCard width={24} height={24} strokeWidth={1.5} style={{ color: '#10b981' }} />,
      envio: <IconTruck width={24} height={24} strokeWidth={1.5} style={{ color: '#8b5cf6' }} />,
      default: <IconInfo width={24} height={24} strokeWidth={1.5} style={{ color: '#6b7280' }} />
    };
    return iconos[tipo] || iconos.default;
  };

  return (
    <div className="pl-card" style={{ padding: "2.5rem 2rem", background: "linear-gradient(135deg, #faf8f6 0%, #f5f0eb 100%)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", background: "linear-gradient(135deg, #fff 0%, #faf8f6 100%)", border: "2px solid #e8e4df", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)" }}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "12px", fontSize: "1.8rem", fontWeight: 800, color: "#7A1E3A", letterSpacing: "-0.5px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #7A1E3A 0%, #9C2F4A 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <IconPackage width={24} height={24} strokeWidth={2} style={{ color: 'white' }} />
          </div>
          Notificaciones
        </h2>
        {notificaciones.some((n) => !n.leida) && (
          <button
            onClick={onMarcarTodasLeidas}
            style={{
              background: "linear-gradient(135deg, #7A1E3A 0%, #5e1629 100%)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "12px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(122, 30, 58, 0.2)",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(122, 30, 58, 0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(122, 30, 58, 0.2)";
            }}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "2rem" }}>
        <button
          onClick={() => onSetNotificacionesFilter("todas")}
          style={{
            flex: 1,
            padding: "12px 24px",
            borderRadius: "30px",
            border: "2px solid #e0dbd4",
            background: notificacionesFilter === "todas" ? "linear-gradient(135deg, #7A1E3A 0%, #5e1629 100%)" : "white",
            color: notificacionesFilter === "todas" ? "white" : "#555",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: notificacionesFilter === "todas" ? "0 4px 12px rgba(122, 30, 58, 0.25)" : "0 2px 8px rgba(0, 0, 0, 0.05)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            if (notificacionesFilter !== "todas") {
              e.target.style.borderColor = "#7A1E3A";
              e.target.style.color = "#7A1E3A";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(122, 30, 58, 0.15)";
            }
          }}
          onMouseOut={(e) => {
            if (notificacionesFilter !== "todas") {
              e.target.style.borderColor = "#e0dbd4";
              e.target.style.color = "#555";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
            }
          }}
        >
          Todas
        </button>
        <button
          onClick={() => onSetNotificacionesFilter("no_leidas")}
          style={{
            flex: 1,
            padding: "12px 24px",
            borderRadius: "30px",
            border: "2px solid #e0dbd4",
            background: notificacionesFilter === "no_leidas" ? "linear-gradient(135deg, #7A1E3A 0%, #5e1629 100%)" : "white",
            color: notificacionesFilter === "no_leidas" ? "white" : "#555",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: notificacionesFilter === "no_leidas" ? "0 4px 12px rgba(122, 30, 58, 0.25)" : "0 2px 8px rgba(0, 0, 0, 0.05)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            if (notificacionesFilter !== "no_leidas") {
              e.target.style.borderColor = "#7A1E3A";
              e.target.style.color = "#7A1E3A";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(122, 30, 58, 0.15)";
            }
          }}
          onMouseOut={(e) => {
            if (notificacionesFilter !== "no_leidas") {
              e.target.style.borderColor = "#e0dbd4";
              e.target.style.color = "#555";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
            }
          }}
        >
          No leídas
        </button>
      </div>
      <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "8px", scrollbarWidth: "none", msOverflowStyle: "none", WebkitScrollbar: "none" }} className="notificaciones-scroll-container">
        {notificacionesLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
            <div style={{
              width: "48px",
              height: "48px",
              border: "3px solid #e0dbd4",
              borderTop: "3px solid #7A1E3A",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }} />
            <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>Cargando notificaciones...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: "#888", background: "white", borderRadius: "20px", border: "2px dashed #e0dbd4", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)" }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #faf8f6 0%, #f5f0eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              border: "2px solid #e8e4df"
            }}>
              <IconPackage width={40} height={40} strokeWidth={1.5} style={{ color: '#ccc' }} />
            </div>
            <p style={{ fontSize: "1.1rem", fontWeight: 500, color: "#666" }}>
              {notificacionesFilter === "no_leidas"
                ? "No tienes notificaciones sin leer"
                : "No tienes notificaciones"}
            </p>
          </div>
        ) : (
          notificaciones.map((notif) => (
            <div
              key={notif.id_notificacion}
              onClick={() => onHandleClickNotificacion(notif)}
              style={{
                padding: "24px",
                borderRadius: "16px",
                background: notif.leida ? "white" : "linear-gradient(135deg, #fff8f5 0%, #fff 100%)",
                border: notif.leida ? "1px solid #e8e4df" : "2px solid #e8e4df",
                marginBottom: "16px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                gap: "18px",
                alignItems: "flex-start",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
                position: "relative",
                borderLeft: notif.leida ? "5px solid transparent" : "5px solid #7A1E3A"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
                e.target.style.borderColor = "#d4a574";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.06)";
                e.target.style.borderColor = notif.leida ? "#e8e4df" : "#e8e4df";
              }}
            >
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #faf8f6 0%, #f5f0eb 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "2px solid #e8e4df",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.12)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
              }}>
                {getIconoTipo(notif.tipo)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#2c2c2c",
                  letterSpacing: "-0.3px"
                }}>
                  {notif.titulo}
                </h4>
                <p style={{
                  margin: "0 0 10px 0",
                  fontSize: "0.95rem",
                  color: "#555",
                  lineHeight: "1.5"
                }}>
                  {notif.descripcion}
                </p>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.85rem",
                  color: "#999",
                  fontWeight: 500
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {new Date(notif.fecha_creacion).toLocaleString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                {!notif.leida && (
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#7A1E3A",
                    flexShrink: 0
                  }} />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEliminar(notif.id_notificacion);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                    color: "#dc2626",
                    border: "2px solid #fecaca",
                    padding: "8px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                    width: "38px",
                    height: "38px"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
                    e.target.style.color = "white";
                    e.target.style.borderColor = "#dc2626";
                    e.target.style.transform = "scale(1.1)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)";
                    e.target.style.color = "#dc2626";
                    e.target.style.borderColor = "#fecaca";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
