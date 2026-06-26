import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { notify } from '../components/ToastProvider';
import CompradorSidebar from '../components/CompradorSidebar';
import {
  IconChartBar,
  IconBooks,
  IconBook,
  IconStar,
  IconSettings,
  IconFavorites,
  IconLocation
} from '../components/Icons';
import '../styles/perfil-usuario.css';

function PerfilUsuario() {
  // ========================
  // Estado local
  // ========================
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [categoriasFavoritas, setCategoriasFavoritas] = useState([]);
  const [nivelFidelizacion, setNivelFidelizacion] = useState(null);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [userName, setUserName] = useState('');
  const [activeSide, setActiveSide] = useState('Mi Perfil');
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [direccionForm, setDireccionForm] = useState({
    direccion: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    es_principal: false
  });

  const [formData, setFormData] = useState({
    nombre_usuario: '',
    telefono: '',
  });

  // ========================
  // Carga de datos
  // ========================
  const cargarPerfil = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Extraer nombre del token
      try {
        const payload = jwtDecode(token);
        setUserName(payload.nombre || 'Comprador');
      } catch {
        setUserName('Comprador');
      }

      const response = await api.get('/perfil/mi-perfil');
      setUsuario(response.data);
      setFormData({
        nombre_usuario: response.data.nombre_usuario,
        telefono: response.data.telefono || '',
      });
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      notify('Error al cargar perfil', 'error');
      setUsuario({ nombre_usuario: 'Usuario', correo_usuario: '', telefono: '', fecha_registro: new Date() });
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
      setHistorial([]);
    }
  }, []);

  const cargarDirecciones = useCallback(async () => {
    try {
      const response = await api.get('/perfil/direcciones');
      setDirecciones(response.data || []);
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      setDirecciones([]);
    }
  }, []);

  const cargarEstadisticas = useCallback(async () => {
    try {
      const response = await api.get('/perfil/estadisticas');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setEstadisticas({ total_gastado: 0, num_compras: 0, libro_mas_comprado: null });
    }
  }, []);

  const cargarCategoriasFavoritas = useCallback(async () => {
    try {
      const response = await api.get('/perfil/categorias-favoritas');
      setCategoriasFavoritas(response.data || []);
    } catch (error) {
      console.error('Error cargando categorías favoritas:', error);
      // Si no hay endpoint, usar datos de ejemplo
      setCategoriasFavoritas([]);
    }
  }, []);

  const cargarNivelFidelizacion = useCallback(async () => {
    try {
      const response = await api.get('/perfil/nivel-fidelizacion');
      setNivelFidelizacion(response.data);
    } catch (error) {
      console.error('Error cargando nivel de fidelización:', error);
      // Calcular nivel basado en estadísticas
      if (estadisticas && estadisticas.num_compras) {
        const numCompras = estadisticas.num_compras;
        let nivel = 'Bronce';
        let puntos = numCompras * 10;
        let siguienteNivel = null;
        let puntosParaSiguiente = 0;

        if (numCompras >= 50) {
          nivel = 'Oro';
          puntos = numCompras * 15;
        } else if (numCompras >= 20) {
          nivel = 'Plata';
          puntos = numCompras * 12;
          siguienteNivel = 'Oro';
          puntosParaSiguiente = 50 * 15 - puntos;
        } else if (numCompras >= 5) {
          siguienteNivel = 'Plata';
          puntosParaSiguiente = 20 * 12 - puntos;
        } else {
          siguienteNivel = 'Plata';
          puntosParaSiguiente = 5 * 10 - puntos;
        }

        setNivelFidelizacion({
          nivel,
          puntos,
          siguiente_nivel: siguienteNivel,
          puntos_para_siguiente: puntosParaSiguiente
        });
      }
    }
  }, []);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      await cargarPerfil();
      await cargarHistorial();
      await cargarDirecciones();
      await cargarCategoriasFavoritas();
      await cargarEstadisticas();
      await cargarNivelFidelizacion();
    };
    cargarDatosIniciales();
  }, []);

  // ========================
  // Manejadores de formulario
  // ========================
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

  const handleDireccionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDireccionForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGuardarDireccion = async (e) => {
    e.preventDefault();
    if (!direccionForm.direccion.trim() || !direccionForm.ciudad.trim()) {
      notify('La dirección y ciudad son obligatorias', 'error');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/perfil/direcciones', direccionForm);
      notify('Dirección agregada correctamente', 'success');
      setMostrarFormDireccion(false);
      setDireccionForm({
        direccion: '',
        ciudad: '',
        departamento: '',
        codigo_postal: '',
        es_principal: false
      });
      cargarDirecciones();
    } catch (error) {
      notify(error.response?.data?.detail || 'Error al guardar dirección', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarDireccion = async (id) => {
    try {
      await api.delete(`/perfil/direcciones/${id}`);
      notify('Dirección eliminada', 'success');
      cargarDirecciones();
    } catch (error) {
      notify('Error al eliminar dirección', 'error');
    }
  };

  const handleMarcarPrincipal = async (id) => {
    try {
      await api.patch(`/perfil/direcciones/${id}/principal`);
      notify('Dirección principal actualizada', 'success');
      cargarDirecciones();
    } catch (error) {
      notify('Error al actualizar dirección principal', 'error');
    }
  };

  const renderMiPerfil = () => (
    <>
      <div className="welcome-card">
        <h1>Mi Perfil</h1>
        <p className="subtitulo">Gestiona tu información personal y ve tu historial</p>
      </div>

      <div className="perfil-contenido">
        <section className="perfil-seccion">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconChartBar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Estadísticas de Compras
          </h2>
          <div className="estadisticas-grid">
            <div className="estadistica-card">
              <p className="estadistica-label">Total Gastado</p>
              <p className="estadistica-valor">
                ${estadisticas?.total_gastado?.toLocaleString('es-CO') || '0'} COP
              </p>
            </div>
            <div className="estadistica-card">
              <p className="estadistica-label">Número de Compras</p>
              <p className="estadistica-valor">
                {estadisticas?.num_compras || 0}
              </p>
            </div>
            {estadisticas?.libro_mas_comprado && (
              <div className="estadistica-card">
                <p className="estadistica-label">Libro Más Comprado</p>
                <p className="estadistica-valor">
                  {estadisticas.libro_mas_comprado}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="perfil-seccion">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconBooks width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Categorías Favoritas
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Basado en tu historial de compras
          </p>
          {categoriasFavoritas.length > 0 ? (
            <div className="categorias-grid">
              {categoriasFavoritas.map((cat, index) => (
                <div key={index} className="categoria-card">
                  <span className="categoria-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconBook width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                  </span>
                  <p className="categoria-nombre">{cat.nombre}</p>
                  <p className="categoria-conteo">{cat.conteo} compra{cat.conteo > 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                Aún no tienes categorías favoritas. Compra libros para ver tus preferencias aquí.
              </p>
            </div>
          )}
        </section>

        <section className="perfil-seccion">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconStar width={24} height={24} strokeWidth={2} style={{ color: '#7A1E3A' }} />
            Nivel de Fidelización
          </h2>
          <div className="fidelizacion-card">
            <div className="fidelizacion-header">
              <div className={`nivel-badge nivel-${nivelFidelizacion?.nivel?.toLowerCase() || 'bronce'}`}>
                {nivelFidelizacion?.nivel || 'Bronce'}
              </div>
              <div className="puntos-info">
                <p className="puntos-valor">{nivelFidelizacion?.puntos || 0} puntos</p>
                <p className="puntos-label">Puntos acumulados</p>
              </div>
            </div>
            {nivelFidelizacion?.siguiente_nivel ? (
              <div className="progreso-siguiente">
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                  {nivelFidelizacion.puntos_para_siguiente > 0
                    ? `${nivelFidelizacion.puntos_para_siguiente} puntos para ${nivelFidelizacion.siguiente_nivel}`
                    : `¡Ya estás en el nivel más alto!`}
                </p>
                <div className="progreso-bar">
                  <div
                    className="progreso-fill"
                    style={{
                      width: `${Math.min(100, (nivelFidelizacion.puntos / (nivelFidelizacion.puntos + nivelFidelizacion.puntos_para_siguiente)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="progreso-siguiente">
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                  5 puntos para Plata
                </p>
                <div className="progreso-bar">
                  <div className="progreso-fill" style={{ width: '0%' }} />
                </div>
              </div>
            )}
            <div className="beneficios-info">
              <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                💡 Sigue comprando para desbloquear beneficios exclusivos
              </p>
            </div>
          </div>
        </section>

        <section className="perfil-seccion">
          <div className="seccion-header">
            <h2>Información Personal</h2>
            {!editando && (
              <button 
                className="btn btn-small"
                onClick={() => setEditando(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <IconSettings width={16} height={16} strokeWidth={2} style={{ color: '#7A1E3A' }} />
                Editar
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
                  placeholder="Juan Pérez"
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
                  placeholder="3001234567"
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
                <label>Miembro desde:</label>
                <p>{new Date(usuario.fecha_registro).toLocaleDateString('es-CO')}</p>
              </div>
            </div>
          )}
        </section>

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
    </>
  );

  const renderMisCompras = () => (
    <>
      <div className="welcome-card">
        <h1>Mis Compras</h1>
        <p className="subtitulo">Historial de tus compras en BookyHome</p>
      </div>

      <div className="perfil-contenido">
        <section className="perfil-seccion">
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
      </div>
    </>
  );

  const renderFavoritos = () => (
    <div className="welcome-card">
      <div className="empty-state" style={{ boxShadow: "none", padding: "60px 20px" }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
          <IconFavorites width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
        </div>
        <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px", fontSize: "1.1rem" }}>Favoritos</p>
        <p style={{ fontSize: "0.87rem", color: "#888" }}>Esta sección estará disponible próximamente</p>
      </div>
    </div>
  );

  const renderResenas = () => (
    <div className="welcome-card">
      <div className="empty-state" style={{ boxShadow: "none", padding: "60px 20px" }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
          <IconStar width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
        </div>
        <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px", fontSize: "1.1rem" }}>Reseñas</p>
        <p style={{ fontSize: "0.87rem", color: "#888" }}>Esta sección estará disponible próximamente</p>
      </div>
    </div>
  );

  const renderDirecciones = () => (
    <>
      <div className="welcome-card">
        <h1>Direcciones de Envío</h1>
        <p className="subtitulo">Gestiona tus direcciones para envíos rápidos</p>
      </div>

      <div className="perfil-contenido">
        <section className="perfil-seccion">
          <div className="seccion-header">
            <h2>Mis Direcciones</h2>
            <button 
              className="btn btn-small"
              onClick={() => setMostrarFormDireccion(true)}
            >
              + Agregar Dirección
            </button>
          </div>

          {mostrarFormDireccion && (
            <form className="perfil-form" onSubmit={handleGuardarDireccion} style={{ marginBottom: '20px', background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Nueva Dirección</h3>
              <div className="form-group">
                <label>Dirección *</label>
                <input
                  type="text"
                  name="direccion"
                  value={direccionForm.direccion}
                  onChange={handleDireccionChange}
                  placeholder="Calle 123 #45-67"
                  required
                />
              </div>
              <div className="form-group">
                <label>Ciudad *</label>
                <input
                  type="text"
                  name="ciudad"
                  value={direccionForm.ciudad}
                  onChange={handleDireccionChange}
                  placeholder="Bogotá"
                  required
                />
              </div>
              <div className="form-group">
                <label>Departamento</label>
                <input
                  type="text"
                  name="departamento"
                  value={direccionForm.departamento}
                  onChange={handleDireccionChange}
                  placeholder="Cundinamarca"
                />
              </div>
              <div className="form-group">
                <label>Código Postal</label>
                <input
                  type="text"
                  name="codigo_postal"
                  value={direccionForm.codigo_postal}
                  onChange={handleDireccionChange}
                  placeholder="110111"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="es_principal"
                    checked={direccionForm.es_principal}
                    onChange={handleDireccionChange}
                    style={{ width: 'auto' }}
                  />
                  Marcar como dirección principal
                </label>
              </div>
              <div className="form-acciones">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Dirección'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setMostrarFormDireccion(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {direcciones.length === 0 ? (
            <div className="empty-state">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "10px" }}>
                <IconLocation width={40} height={40} strokeWidth={2} style={{ color: '#7A1E3A' }} />
              </div>
              <p style={{ fontWeight: 700, color: "#444", marginBottom: "6px" }}>No tienes direcciones guardadas</p>
              <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "12px" }}>Agrega una dirección para envíos más rápidos</p>
            </div>
          ) : (
            <div className="direcciones-lista">
              {direcciones.map((dir) => (
                <div key={dir.id_direccion} className={`direccion-card ${dir.es_principal ? 'direccion-principal' : ''}`}>
                  <div className="direccion-info">
                    {dir.es_principal && <span className="badge-principal">Principal</span>}
                    <p style={{ margin: '4px 0', fontWeight: 600 }}>{dir.direccion}</p>
                    <p style={{ margin: '2px 0', color: '#666' }}>{dir.ciudad}{dir.departamento ? `, ${dir.departamento}` : ''}</p>
                    {dir.codigo_postal && <p style={{ margin: '2px 0', color: '#888', fontSize: '0.85rem' }}>CP: {dir.codigo_postal}</p>}
                  </div>
                  <div className="direccion-acciones">
                    {!dir.es_principal && (
                      <button 
                        className="btn btn-small"
                        onClick={() => handleMarcarPrincipal(dir.id_direccion)}
                      >
                        Hacer Principal
                      </button>
                    )}
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => handleEliminarDireccion(dir.id_direccion)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );

  const renderConfiguracion = () => (
    <div className="welcome-card">
      <div className="empty-state" style={{ boxShadow: "none", padding: "60px 20px" }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "12px" }}>
          <IconSettings width={48} height={48} strokeWidth={2} style={{ color: '#7A1E3A' }} />
        </div>
        <p style={{ fontWeight: 700, color: "#444", marginBottom: "8px", fontSize: "1.1rem" }}>Configuración</p>
        <p style={{ fontSize: "0.87rem", color: "#888" }}>Esta sección estará disponible próximamente</p>
      </div>
    </div>
  );

  return (
    <>
      {loading ? (
        <div className="perfil-loading">Cargando perfil...</div>
      ) : !usuario ? (
        <div className="perfil-error">Error al cargar perfil</div>
      ) : (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#fafaf9' }}>
          <CompradorSidebar 
            userName={userName}
            userEmail={usuario?.correo_usuario || ''}
            activeSide={activeSide}
            onSelect={setActiveSide}
          />
          
          <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
            {activeSide === 'Mi Perfil' && renderMiPerfil()}
            {activeSide === 'Mis Compras' && renderMisCompras()}
            {activeSide === 'Direcciones' && renderDirecciones()}
            {activeSide === 'Favoritos' && renderFavoritos()}
            {activeSide === 'Reseñas' && renderResenas()}
            {activeSide === 'Configuración' && renderConfiguracion()}
          </main>
        </div>
      )}
    </>
  );
}

export default PerfilUsuario;
