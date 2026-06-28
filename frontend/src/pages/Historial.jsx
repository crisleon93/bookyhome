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
      visualizacion: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      compra: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
      resena: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
      mensaje: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      ),
      favorito: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ),
      carrito: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
    };
    return iconos[tipo] || (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="17" x2="12" y2="22"></line>
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
      </svg>
    );
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
                    <p className="hist-tienda">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {item.nombre_tienda}
                    </p>
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
