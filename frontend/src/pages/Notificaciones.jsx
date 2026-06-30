// src/pages/Notificaciones.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../hooks/useAuth";
import { notificacionesService } from "../services/notificaciones";
import { getOrdenes } from "../services/api";
import {
  IconMessage,
  IconStar,
  IconGift,
  IconShoppingBag,
  IconTruck,
  IconCreditCard,
  IconInfo
} from "../components/Icons";
import "../styles/Notificaciones.css";

export default function Notificaciones({ embedded = false, onOpenReference = null }) {
  const navigate = useNavigate();
  const token = getToken();

  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("todas"); // todas, no_leidas
  const [ordenes, setOrdenes] = useState([]);
  const [notificacionesLeidasAutomaticas, setNotificacionesLeidasAutomaticas] = useState(new Set());

  // ============= CARGAR NOTIFICACIONES =============
  useEffect(() => {
    if (!token) {
      if (!embedded) navigate("/login");
      return;
    }
    cargarNotificaciones(false);
    cargarOrdenes();
    const interval = setInterval(() => cargarNotificaciones(true), 5000);
    return () => clearInterval(interval);
  }, [token, embedded]);

  // Recargar cuando cambia el filtro
  useEffect(() => {
    if (ordenes.length > 0) {
      cargarNotificaciones(false);
    }
  }, [filter]);

  const cargarOrdenes = async () => {
    try {
      const res = await getOrdenes();
      setOrdenes(res.data || []);
    } catch (err) {
      console.error("Error cargando órdenes:", err);
    }
  };

  const cargarNotificaciones = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Siempre cargar todas las notificaciones de la API, filtrar localmente
      console.log("Cargando notificaciones de la API...");
      const data = await notificacionesService.obtener(false, 50, 0);
      console.log("Respuesta de API:", data);
      const notificacionesAPI = data.notificaciones || [];
      console.log("Notificaciones de API:", notificacionesAPI);
      if (notificacionesAPI.length > 0) {
        console.log("Detalle de primera notificación API:", notificacionesAPI[0]);
      }
      
      // Generar notificaciones automáticas basadas en órdenes (siempre no leídas inicialmente)
      const notificacionesOrdenes = generarNotificacionesOrdenes();
      console.log("Notificaciones automáticas:", notificacionesOrdenes);
      
      // Combinar notificaciones
      const todasNotificaciones = [...notificacionesOrdenes, ...notificacionesAPI];
      console.log("Todas las notificaciones combinadas:", todasNotificaciones);
      
      // Filtrar localmente según el filtro seleccionado
      if (filter === "no_leidas") {
        setNotificaciones(todasNotificaciones.filter(n => !n.leida));
      } else {
        // En "Todas", mostrar todas sin importar estado
        setNotificaciones(todasNotificaciones);
      }
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
      console.error("Detalle del error:", err.response?.data || err.message);
      // En caso de error, al menos mostrar las notificaciones de órdenes
      const notificacionesOrdenes = generarNotificacionesOrdenes();
      if (filter === "no_leidas") {
        setNotificaciones(notificacionesOrdenes.filter(n => !n.leida));
      } else {
        setNotificaciones(notificacionesOrdenes);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const generarNotificacionesOrdenes = () => {
    const notificacionesGeneradas = [];
    console.log("Generando notificaciones automáticas. Set de leídas:", notificacionesLeidasAutomaticas);
    
    ordenes.forEach((orden) => {
      if (orden.estado === 'pendiente') {
        const idNotif = `orden-pendiente-${orden.id_orden}`;
        const estaLeida = notificacionesLeidasAutomaticas.has(idNotif);
        console.log(`Orden ${orden.id_orden} pendiente - ID: ${idNotif}, Leída: ${estaLeida}`);
        notificacionesGeneradas.push({
          id_notificacion: idNotif,
          tipo: 'pago',
          titulo: 'Pago Pendiente',
          descripcion: `Tienes un pago pendiente de ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} para la orden #${orden.id_orden}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: estaLeida, // Respetar estado de lectura
          referencia_id: orden.id_orden,
          es_automatica: true
        });
      } else if (orden.estado === 'completada' || orden.estado === 'pagada' || orden.estado === 'pagado') {
        const idNotif = `orden-completada-${orden.id_orden}`;
        const estaLeida = notificacionesLeidasAutomaticas.has(idNotif);
        console.log(`Orden ${orden.id_orden} completada - ID: ${idNotif}, Leída: ${estaLeida}`);
        notificacionesGeneradas.push({
          id_notificacion: idNotif,
          tipo: 'pedido',
          titulo: 'Compra Realizada',
          descripcion: `Tu compra #${orden.id_orden} ha sido completada exitosamente por ${Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`,
          fecha_creacion: orden.fecha || new Date().toISOString(),
          leida: estaLeida, // Respetar estado de lectura
          referencia_id: orden.id_orden,
          es_automatica: true
        });
      }
    });
    
    console.log("Notificaciones automáticas generadas:", notificacionesGeneradas);
    return notificacionesGeneradas;
  };

  // ============= ACCIONES =============
  const handleMarcarLeida = async (id_notificacion) => {
    try {
      const notif = notificaciones.find(n => n.id_notificacion === id_notificacion);
      if (notif?.es_automatica) {
        // Para notificaciones automáticas, agregar al Set y actualizar estado local
        setNotificacionesLeidasAutomaticas(prev => new Set([...prev, id_notificacion]));
        setNotificaciones(prev => prev.map(n => 
          n.id_notificacion === id_notificacion ? { ...n, leida: true } : n
        ));
      } else {
        await notificacionesService.marcarLeida(id_notificacion);
        await cargarNotificaciones(true);
      }
    } catch (err) {
      console.error("Error marcando como leída:", err);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      // Marcar automáticas localmente
      const automaticasIds = notificaciones.filter(n => n.es_automatica).map(n => n.id_notificacion);
      setNotificacionesLeidasAutomaticas(prev => new Set([...prev, ...automaticasIds]));
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      // Marcar las de la API
      await notificacionesService.marcarTodasLeidas();
      await cargarNotificaciones(true);
    } catch (err) {
      console.error("Error marcando todas como leídas:", err);
    }
  };

  const handleEliminar = async (id_notificacion) => {
    if (confirm("¿Eliminar notificación?")) {
      try {
        const notif = notificaciones.find(n => n.id_notificacion === id_notificacion);
        if (notif?.es_automatica) {
          // Para notificaciones automáticas, eliminar del Set y localmente
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
    }
  };

  // ============= NAVEGAR A REFERENCIA =============
  const handleClickNotificacion = (notif) => {
    // Si el componente padre maneja la apertura de referencias (ej. dashboard vendedor), usar callback
    if (onOpenReference) {
      onOpenReference(notif);
    } else {
      // Para notificaciones automáticas de órdenes
      if (notif.es_automatica) {
        if (notif.tipo === 'pago') {
          // Navegar a Carrito para pagos pendientes
          navigate('/post-login?seccion=Carrito');
        } else if (notif.tipo === 'pedido') {
          // Navegar a Mis Compras para compras completadas
          navigate('/post-login?seccion=Mis Compras');
        }
      } else {
        // Para notificaciones regulares, navegar dentro del dashboard
        switch (notif.tipo) {
          case "mensaje":
            navigate('/post-login?seccion=Mensajes');
            break;
          case "resena":
            navigate('/post-login?seccion=Catálogo');
            break;
          case "oferta":
            navigate('/post-login?seccion=Catálogo');
            break;
          case "pedido":
          case "entrega":
          case "pago":
            navigate('/post-login?seccion=Mis Compras');
            break;
          default:
            break;
        }
      }
    }
    handleMarcarLeida(notif.id_notificacion);
  };

  // ============= RENDERIZAR ICONO =============
  const getIconoTipo = (tipo) => {
    const iconos = {
      mensaje: <IconMessage width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      resena: <IconStar width={24} height={24} strokeWidth={1.5} style={{ color: '#FFA500' }} />,
      oferta: <IconGift width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      pedido: <IconShoppingBag width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      entrega: <IconTruck width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      pago: <IconCreditCard width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />,
      sistema: <IconInfo width={24} height={24} strokeWidth={1.5} style={{ color: '#666' }} />,
    };
    return iconos[tipo] || <IconShoppingBag width={24} height={24} strokeWidth={1.5} style={{ color: '#7A1E3A' }} />;
  };

  // ============= UI =============
  return (
    <div className={`notificaciones-container${embedded ? " notificaciones-container--embedded" : ""}`}>
      <div className="notificaciones-wrapper">
        {/* HEADER */}
        <div className={`notif-header${embedded ? " notif-header--embedded" : ""}`}>
          <h1>Notificaciones</h1>
          {notificaciones.some((n) => !n.leida) && (
            <button
              className="btn-marcar-todas"
              onClick={handleMarcarTodasLeidas}
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* FILTROS */}
        <div className="notif-filtros">
          <button
            className={`filtro ${filter === "todas" ? "active" : ""}`}
            onClick={() => setFilter("todas")}
          >
            Todas
          </button>
          <button
            className={`filtro ${filter === "no_leidas" ? "active" : ""}`}
            onClick={() => setFilter("no_leidas")}
          >
            No leídas
          </button>
        </div>

        {/* LISTA */}
        <div className="notif-lista">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : notificaciones.length === 0 ? (
            <div className="notif-empty">
              <p>
                {filter === "no_leidas"
                  ? "No tienes notificaciones sin leer"
                  : "No tienes notificaciones"}
              </p>
            </div>
          ) : (
            notificaciones.map((notif) => (
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
                  <p>{notif.descripcion}</p>
                  <small>
                    {new Date(notif.fecha_creacion).toLocaleString()}
                  </small>
                </div>

                <div className="notif-acciones">
                  {!notif.leida && (
                    <button
                      className="btn-marcar"
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
