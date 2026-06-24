import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/filtros-catalogo.css';

function FiltrosCatalogo({ onFiltrosChange }) {
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria_id: null,
    precio_min: 0,
    precio_max: 1000000,
    calificacion_min: 0,
    disponible: true,
    ordenar_por: 'relevancia'
  });

  const [opciones, setOpciones] = useState({
    categorias: [],
    precio_min: 0,
    precio_max: 1000000,
    opciones_ordenamiento: []
  });

  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    let mounted = true;

    const cargarOpciones = async () => {
      try {
        const response = await api.get('/catalogo/filtros-disponibles');
        if (!mounted) return;
        setOpciones(response.data);
        setFiltros(prev => ({
          ...prev,
          precio_max: response.data.precio_max
        }));
      } catch (error) {
        console.error('Error cargando filtros:', error);
      }
    };

    cargarOpciones();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  const handleLimpiarFiltros = () => {
    const filtrosLimpios = {
      busqueda: '',
      categoria_id: null,
      precio_min: 0,
      precio_max: opciones.precio_max,
      calificacion_min: 0,
      disponible: true,
      ordenar_por: 'relevancia'
    };
    setFiltros(filtrosLimpios);
    onFiltrosChange(filtrosLimpios);
  };

  const filtrosAplicados = Object.entries(filtros).filter(([key, val]) => {
    if (key === 'disponible') return val !== true;
    if (key === 'ordenar_por') return val !== 'relevancia';
    if (key === 'precio_min') return val > opciones.precio_min;
    if (key === 'precio_max') return val < opciones.precio_max;
    if (key === 'calificacion_min') return val > 0;
    return val !== null && val !== '' && val !== 0;
  }).length;

  return (
    <div className="filtros-catalogo">
      <div className="filtros-header">
        <button
          className="btn-toggle-filtros"
          onClick={() => setExpandido(!expandido)}
        >
          🔍 Filtros {filtrosAplicados > 0 && <span className="badge">{filtrosAplicados}</span>}
        </button>
        {filtrosAplicados > 0 && (
          <button
            className="btn-limpiar"
            onClick={handleLimpiarFiltros}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {expandido && (
        <div className="filtros-panel">
          {/* BÚSQUEDA */}
          <div className="filtro-grupo">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Título, autor..."
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              className="input-busqueda"
            />
          </div>

          {/* CATEGORÍA */}
          <div className="filtro-grupo">
            <label>Categoría</label>
            <select
              value={filtros.categoria_id || ''}
              onChange={(e) => handleFiltroChange('categoria_id', e.target.value ? parseInt(e.target.value) : null)}
              className="select-filtro"
            >
              <option value="">Todas las categorías</option>
              {opciones.categorias.map(cat => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre_categoria} ({cat.cantidad_libros})
                </option>
              ))}
            </select>
          </div>

          {/* RANGO DE PRECIO */}
          <div className="filtro-grupo">
            <label>Precio</label>
            <div className="rango-precio">
              <input
                type="number"
                min={opciones.precio_min}
                max={opciones.precio_max}
                value={filtros.precio_min}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (val <= filtros.precio_max) {
                    handleFiltroChange('precio_min', val);
                  }
                }}
                placeholder="Mín"
                className="input-precio"
              />
              <span>-</span>
              <input
                type="number"
                min={opciones.precio_min}
                max={opciones.precio_max}
                value={filtros.precio_max}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || opciones.precio_max;
                  if (val >= filtros.precio_min) {
                    handleFiltroChange('precio_max', val);
                  }
                }}
                placeholder="Máx"
                className="input-precio"
              />
            </div>
            <div className="precio-mostrado">
              ${filtros.precio_min.toLocaleString('es-CO')} - ${filtros.precio_max.toLocaleString('es-CO')}
            </div>
          </div>

          {/* CALIFICACIÓN MÍNIMA */}
          <div className="filtro-grupo">
            <label>Calificación mínima</label>
            <div className="calificacion-filtro">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  className={`star-filter ${filtros.calificacion_min >= i ? 'activa' : ''}`}
                  onClick={() => handleFiltroChange('calificacion_min', i)}
                  title={i === 0 ? 'Todas' : `${i}+ estrellas`}
                >
                  {i === 0 ? 'Todas' : (
                    <>
                      {i}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* DISPONIBILIDAD */}
          <div className="filtro-grupo">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filtros.disponible}
                onChange={(e) => handleFiltroChange('disponible', e.target.checked)}
              />
              Solo libros en stock
            </label>
          </div>

          {/* ORDENAMIENTO */}
          <div className="filtro-grupo">
            <label>Ordenar por</label>
            <select
              value={filtros.ordenar_por}
              onChange={(e) => handleFiltroChange('ordenar_por', e.target.value)}
              className="select-filtro"
            >
              {opciones.opciones_ordenamiento.map(opcion => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>

          {/* BOTÓN APLICAR */}
          <button className="btn-aplicar-filtros" onClick={() => setExpandido(false)}>
            ✓ Aplicar filtros
          </button>
        </div>
      )}
    </div>
  );
}

export default FiltrosCatalogo;
