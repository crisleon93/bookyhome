// src/pages/Historial.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../hooks/useAuth";
import { historialService } from "../services/historial";
import "../styles/Historial.css";

export default function Historial() {
  const navigate = useNavigate();
  const token = getToken();

  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("todas");
  const [error, setError] = useState(null);

  // ============= CARGAR DATOS =============
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    cargarHistorial();
    cargarEstadisticas();
  }, [token, filter]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const tipo = filter === "todas" ? null : filter;
      const data = await historialService.obtener(tipo, 100, 0);
      setHistorial(data.historial || []);
    } catch (err) {
      console.error("Error:", err);
      setError("Error cargando historial");
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const data = await historialService.obtenerEstadisticas();
      setEstadisticas(data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // ============= ELIMINAR =============
  const handleEliminar = async (id_interaccion) => {
    if (confirm("¿Eliminar del historial?")) {
      try {
        await historialService.eliminar(id_interaccion);
        await cargarHistorial();
      } catch (err) {
        setError("Error eliminando del historial");
      }
    }
  };

  // ============= NAVEGAR =============
  const handleClickLibro = (item) => {
    if (item.id_libro) {
      navigate(`/catalogo/${item.id_libro}`);
    }
  };

  // ============= RENDERIZAR ICONO =============
  const getIconoTipo = (tipo) => {
    const iconos = {
      visualizacion: "👁️",
      compra: "🛒",
      resena: "⭐",
      mensaje: "💬",
      favorito: "❤️",
      carrito: "🛍️",
    };
    return iconos[tipo] || "📌";
  };

  const getTituloTipo = (tipo) => {
    const titulos = {
      visualizacion: "Visto",
      compra: "Comprado",
      resena: "Reseñado",
      mensaje: "Mensaje",
      favorito: "Favorito",
      carrito: "En carrito",
    };
    return titulos[tipo] || tipo;
  };

  // ============= UI =============
  return (
    <div className="historial-container">
      <div className="historial-wrapper">
        {/* HEADER */}
        <div className="hist-header">
          <h1>Mi Historial</h1>
        </div>

        {/* ESTADÍSTICAS */}
        {estadisticas && (
          <div className="hist-estadisticas">
            <div className="stat-card">
              <h3>{estadisticas.total}</h3>
              <p>Total Interacciones</p>
            </div>
            {estadisticas.por_tipo.slice(0, 4).map((stat) => (
              <div key={stat.tipo} className="stat-card">
                <h3>{stat.total}</h3>
                <p>{getTituloTipo(stat.tipo)}</p>
              </div>
            ))}
          </div>
        )}

        {/* FILTROS */}
        <div className="hist-filtros">
          <button
            className={`filtro ${filter === "todas" ? "active" : ""}`}
            onClick={() => setFilter("todas")}
          >
            Todas
          </button>
          <button
            className={`filtro ${filter === "visualizacion" ? "active" : ""}`}
            onClick={() => setFilter("visualizacion")}
          >
            Visualizaciones
          </button>
          <button
            className={`filtro ${filter === "compra" ? "active" : ""}`}
            onClick={() => setFilter("compra")}
          >
            Compras
          </button>
          <button
            className={`filtro ${filter === "resena" ? "active" : ""}`}
            onClick={() => setFilter("resena")}
          >
            Reseñas
          </button>
          <button
            className={`filtro ${filter === "favorito" ? "active" : ""}`}
            onClick={() => setFilter("favorito")}
          >
            Favoritos
          </button>
        </div>

        {/* ERROR */}
        {error && <div className="error-message">{error}</div>}

        {/* LISTA */}
        <div className="hist-lista">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : historial.length === 0 ? (
            <div className="hist-empty">
              <p>No hay interacciones registradas</p>
            </div>
          ) : (
            historial.map((item) => (
              <div
                key={item.id_interaccion}
                className="hist-item"
                onClick={() => handleClickLibro(item)}
              >
                <div className="hist-icono">
                  <span>{getIconoTipo(item.tipo)}</span>
                </div>

                <div className="hist-contenido">
                  <div className="hist-tipo">{getTituloTipo(item.tipo)}</div>
                  {item.nombre_libro && (
                    <h3 className="hist-titulo">{item.nombre_libro}</h3>
                  )}
                  {item.nombre_tienda && (
                    <p className="hist-tienda">📍 {item.nombre_tienda}</p>
                  )}
                  {item.descripcion && (
                    <p className="hist-descripcion">{item.descripcion}</p>
                  )}
                  <small>
                    {new Date(item.fecha_interaccion).toLocaleString()}
                  </small>
                </div>

                <div className="hist-acciones">
                  <button
                    className="btn-eliminar"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(item.id_interaccion);
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
