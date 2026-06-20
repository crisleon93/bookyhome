import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { notify } from './ToastProvider';
import '../styles/resenas.css';

const IconStar = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#7A1E3A" : "none"} 
       stroke={filled ? "#7A1E3A" : "#ddd"} strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function ResenaLibro({ idLibro, idUsuario }) {
  const [resenas, setResenas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [miResena, setMiResena] = useState(null);
  
  // Form state
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarResenas();
  }, [idLibro]);

  const cargarResenas = async () => {
    try {
      const response = await api.get(`/resenas/libro/${idLibro}`);
      setResenas(response.data.resenas || []);
      setPromedio(response.data.promedio || 0);
      
      // Verificar si usuario ya reseñó
      if (idUsuario && response.data.resenas) {
        const yaReseno = response.data.resenas.find(r => r.id_usuario === idUsuario);
        setMiResena(yaReseno || null);
      }
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarResena = async (e) => {
    e.preventDefault();
    
    if (!calificacion) {
      notify('Por favor selecciona una calificación', 'error');
      return;
    }
    
    if (!comentario.trim()) {
      notify('Por favor escribe un comentario', 'error');
      return;
    }

    setEnviando(true);
    try {
      if (miResena) {
        // Actualizar reseña existente
        await api.put(`/resenas/${miResena.id_resena}`, {
          id_libro: idLibro,
          calificacion,
          comentario
        });
        notify('Reseña actualizada correctamente', 'success');
      } else {
        // Crear nueva reseña
        await api.post('/resenas/crear', {
          id_libro: idLibro,
          calificacion,
          comentario
        });
        notify('¡Gracias por tu reseña!', 'success');
      }
      
      setCalificacion(0);
      setComentario('');
      setMostrarFormulario(false);
      cargarResenas();
    } catch (error) {
      const mensaje = error.response?.data?.detail || 'Error al guardar la reseña';
      notify(mensaje, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminarResena = async (idResena) => {
    if (!window.confirm('¿Eliminar esta reseña?')) return;
    
    try {
      await api.delete(`/resenas/${idResena}`);
      notify('Reseña eliminada', 'success');
      cargarResenas();
    } catch (error) {
      notify('Error al eliminar reseña', 'error');
    }
  };

  if (loading) {
    return <div className="resena-loading">Cargando reseñas...</div>;
  }

  return (
    <div className="resena-container">
      {/* SECCIÓN PROMEDIO */}
      <div className="resena-promedio">
        <div className="promedio-numero">
          <span className="numero">{promedio.toFixed(1)}</span>
          <span className="maxima">/5</span>
        </div>
        <div className="promedio-estrellas">
          {[1, 2, 3, 4, 5].map((i) => (
            <IconStar key={i} filled={i <= Math.round(promedio)} />
          ))}
        </div>
        <p className="total-resenas">{resenas.length} reseña{resenas.length !== 1 ? 's' : ''}</p>
      </div>

      {/* BOTÓN DEJAR RESEÑA */}
      {idUsuario && (
        <button 
          className="btn-resena-crear"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {miResena ? '✏️ Editar mi reseña' : '⭐ Dejar una reseña'}
        </button>
      )}

      {/* FORMULARIO */}
      {mostrarFormulario && (
        <form className="resena-formulario" onSubmit={handleEnviarResena}>
          <div className="form-group">
            <label>Mi calificación:</label>
            <div className="calificacion-selector">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`star-btn ${calificacion >= i ? 'activa' : ''}`}
                  onClick={() => setCalificacion(i)}
                >
                  <IconStar filled={calificacion >= i} />
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Mi comentario (máximo 500 caracteres):</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value.slice(0, 500))}
              placeholder="Comparte tu experiencia con este libro..."
              maxLength={500}
              rows="4"
            />
            <small>{comentario.length}/500</small>
          </div>

          <div className="form-acciones">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={enviando}
            >
              {enviando ? 'Guardando...' : miResena ? 'Actualizar reseña' : 'Publicar reseña'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setMostrarFormulario(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* LISTA DE RESEÑAS */}
      <div className="resena-lista">
        {resenas.length === 0 ? (
          <p className="sin-resenas">Aún no hay reseñas. ¡Sé el primero en comentar!</p>
        ) : (
          resenas.map((resena) => (
            <div key={resena.id_resena} className="resena-item">
              <div className="resena-header">
                <div>
                  <strong>{resena.nombre_usuario}</strong>
                  <div className="resena-estrellas">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <IconStar key={i} filled={i <= resena.calificacion} />
                    ))}
                  </div>
                </div>
                <small className="resena-fecha">
                  {new Date(resena.fecha_resena).toLocaleDateString('es-CO')}
                </small>
              </div>
              <p className="resena-comentario">{resena.comentario}</p>
              
              {/* Botón eliminar si es la mía */}
              {idUsuario === resena.id_usuario && (
                <button
                  className="btn-eliminar-resena"
                  onClick={() => handleEliminarResena(resena.id_resena)}
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ResenaLibro;
