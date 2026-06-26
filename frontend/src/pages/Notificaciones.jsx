// src/pages/Notificaciones.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../hooks/useAuth";
import { notificacionesService } from "../services/notificaciones";
import "../styles/Notificaciones.css";

export default function Notificaciones({ embedded = false, onOpenReference = null }) {
  const navigate = useNavigate();
  const token = getToken();

  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("todas"); // todas, no_leidas
  const [error, setError] = useState(null);

  // ============= CARGAR NOTIFICACIONES =============
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 5000);
    return () => clearInterval(interval);
  }, [token, filter]);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const soloNoLeidas = filter === "no_leidas";
      const data = await notificacionesService.obtener(soloNoLeidas, 50, 0);
      setNotificaciones(data.notificaciones || []);
    } catch (err) {
      console.error("Error:", err);
      setError("Error cargando notificaciones");
    } finally {
      setLoading(false);
    }
  };

  // ============= ACCIONES =============
  const handleMarcarLeida = async (id_notificacion) => {
    try {
      await notificacionesService.marcarLeida(id_notificacion);
      await cargarNotificaciones();
    } catch (err) {
      setError("Error marcando como leída");
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      await cargarNotificaciones();
    } catch (err) {
      setError("Error marcando todas como leídas");
    }
  };

  const handleEliminar = async (id_notificacion) => {
    if (confirm("¿Eliminar notificación?")) {
      try {
        await notificacionesService.eliminar(id_notificacion);
        await cargarNotificaciones();
      } catch (err) {
        setError("Error eliminando notificación");
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
          navigate(`/chat/${notif.referencia_id}`);
          break;
        case "resena":
          navigate(`/catalogo/${notif.referencia_id}`);
          break;
        case "oferta":
          navigate(`/catalogo/${notif.referencia_id}`);
          break;
        case "pedido":
        case "entrega":
        case "pago":
          navigate("/perfil");
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
      mensaje: "💬",
      resena: "⭐",
      oferta: "🎉",
      pedido: "📦",
      entrega: "🚚",
      pago: "💳",
      sistema: "ℹ️",
    };
    return iconos[tipo] || "🔔";
  };

  // ============= UI =============
  return (
    <div className="notificaciones-container">
      <div className="notificaciones-wrapper">
        {/* HEADER */}
        <div className="notif-header">
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

        {/* ERROR */}
        {error && <div className="error-message">{error}</div>}

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
