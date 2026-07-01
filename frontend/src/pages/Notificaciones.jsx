// src/pages/Notificaciones.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../hooks/useAuth";
import { notificacionesService } from "../services/notificaciones";
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

export default function Notificaciones({ onOpenReference = null, embedded = false }) {
  const navigate = useNavigate();
  const token = getToken();

  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("todas");

  // ============= CARGAR NOTIFICACIONES =============
  const cargarNotificaciones = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const soloNoLeidas = filter === "no_leidas";
      const data = await notificacionesService.obtener(soloNoLeidas, 50, 0);
      setNotificaciones(data.notificaciones || []);
    } catch {
      console.error("Error cargando notificaciones");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!token) {
      if (!embedded) navigate("/login");
      return;
    }
    cargarNotificaciones(false);
    const interval = setInterval(() => cargarNotificaciones(true), 5000);
    return () => clearInterval(interval);
  }, [token, filter, cargarNotificaciones, navigate, embedded]);

  // ============= ACCIONES =============
  const handleMarcarLeida = async (id_notificacion) => {
    try {
      await notificacionesService.marcarLeida(id_notificacion);
      await cargarNotificaciones();
    } catch {
      console.error("Error marcando como leída");
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      await cargarNotificaciones();
    } catch {
      console.error("Error marcando todas como leídas");
    }
  };

  const handleEliminar = async (id_notificacion) => {
    if (confirm("¿Eliminar notificación?")) {
      try {
        await notificacionesService.eliminar(id_notificacion);
        await cargarNotificaciones();
      } catch {
        console.error("Error eliminando notificación");
      }
    }
  };

  // ============= NAVEGAR A REFERENCIA =============
  const handleClickNotificacion = (notif) => {
    // Si el componente padre maneja la apertura de referencias (ej. dashboard vendedor), usar callback
    if (onOpenReference) {
      onOpenReference(notif);
    } else {
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
