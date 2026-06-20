import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { notify } from '../components/ToastProvider';
import '../styles/perfil-usuario.css';

function PerfilUsuario() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    nombre_usuario: '',
    telefono: '',
  });

  const cargarPerfil = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.get('/perfil/mi-perfil');
      setUsuario(response.data);
      setFormData({
        nombre_usuario: response.data.nombre_usuario,
        telefono: response.data.telefono || '',
      });
    } catch (error) {
      notify('Error al cargar perfil', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const cargarHistorial = useCallback(async () => {
    try {
      const response = await api.get('/perfil/historial/compras');
      setHistorial(response.data.compras || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
    cargarHistorial();
  }, [cargarPerfil, cargarHistorial]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!formData.nombre_usuario.trim()) {
      notify('El nombre es obligatorio', 'error');
      return;
    }

    setGuardando(true);
    try {
      await api.put('/perfil/actualizar', formData);
      notify('Perfil actualizado correctamente', 'success');
      setEditando(false);
      cargarPerfil();
    } catch (error) {
      notify(error.response?.data?.detail || 'Error al guardar perfil', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setEditando(false);
    setFormData({
      nombre_usuario: usuario?.nombre_usuario,
      telefono: usuario?.telefono || '',
    });
  };

  if (loading) {
    return <div className="perfil-loading">Cargando perfil...</div>;
  }

  if (!usuario) {
    return <div className="perfil-error">Error al cargar perfil</div>;
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>Mi Perfil</h1>
        <p className="subtitulo">Gestiona tu información personal y ve tu historial</p>
      </div>

      <div className="perfil-contenido">
        {/* SECCIÓN INFORMACIÓN PERSONAL */}
        <section className="perfil-seccion">
          <div className="seccion-header">
            <h2>Información Personal</h2>
            {!editando && (
              <button 
                className="btn btn-small"
                onClick={() => setEditando(true)}
              >
                ✏️ Editar
              </button>
            )}
          </div>

          {editando ? (
            <form className="perfil-form" onSubmit={handleGuardar}>
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  name="nombre_usuario"
                  value={formData.nombre_usuario}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Tu teléfono"
                />
              </div>

              <div className="form-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={usuario.correo_usuario}
                  disabled
                  className="input-disabled"
                />
                <small>No puedes cambiar tu email. <a href="/reset-password">¿Necesitas ayuda?</a></small>
              </div>

              <div className="form-acciones">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancelar}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="perfil-vista">
              <div className="dato-grupo">
                <label>Nombre:</label>
                <p>{usuario.nombre_usuario}</p>
              </div>
              <div className="dato-grupo">
                <label>Email:</label>
                <p>{usuario.correo_usuario}</p>
              </div>
              <div className="dato-grupo">
                <label>Teléfono:</label>
                <p>{usuario.telefono || 'No registrado'}</p>
              </div>
              <div className="dato-grupo">
                <label>Rol:</label>
                <p className="rol-badge">{usuario.rol === 'vendedor' ? '🏪 Vendedor' : '👤 Comprador'}</p>
              </div>
              <div className="dato-grupo">
                <label>Miembro desde:</label>
                <p>{new Date(usuario.fecha_registro).toLocaleDateString('es-CO')}</p>
              </div>
            </div>
          )}
        </section>

        {/* SECCIÓN MIS COMPRAS */}
        <section className="perfil-seccion">
          <h2>Mis Compras</h2>
          
          {historial.length === 0 ? (
            <div className="sin-compras">
              <p>Aún no tienes compras</p>
              <a href="/catalogo" className="btn btn-primary">Explorar catálogo</a>
            </div>
          ) : (
            <div className="historial-tabla">
              <div className="tabla-header">
                <div className="col-id">Orden</div>
                <div className="col-fecha">Fecha</div>
                <div className="col-productos">Productos</div>
                <div className="col-total">Total</div>
                <div className="col-estado">Estado</div>
              </div>

              {historial.map((compra) => (
                <div key={compra.id_orden} className="tabla-fila">
                  <div className="col-id"># {compra.id_orden}</div>
                  <div className="col-fecha">
                    {new Date(compra.fecha_orden).toLocaleDateString('es-CO')}
                  </div>
                  <div className="col-productos">
                    <small>{compra.cantidad_items} artículo{compra.cantidad_items > 1 ? 's' : ''}</small>
                    <p className="libros-lista">{compra.libros}</p>
                  </div>
                  <div className="col-total">
                    ${compra.total.toLocaleString('es-CO')}
                  </div>
                  <div className="col-estado">
                    <span className={`estado-badge estado-${compra.estado_orden?.toLowerCase().replace(' ', '-')}`}>
                      {compra.estado_orden}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECCIÓN SEGURIDAD */}
        <section className="perfil-seccion">
          <h2>Seguridad</h2>
          <div className="seguridad-opciones">
            <div className="opcion-seguridad">
              <div>
                <h3>Cambiar Contraseña</h3>
                <p>Actualiza tu contraseña regularmente por seguridad</p>
              </div>
              <a href="/forgot-password" className="btn btn-secondary">Cambiar</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PerfilUsuario;
