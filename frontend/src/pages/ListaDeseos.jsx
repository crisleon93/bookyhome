import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getListasDeseos,
  crearListaDeseos,
  eliminarListaDeseos,
  getLibrosListaDeseos,
  eliminarLibroListaDeseos,
  getApiBaseUrl,
} from '../services/api';
import { notify } from '../components/ToastProvider';
import { IconFavorites, IconBookOpen, IconTrash, IconPlus } from '../components/Icons';

const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

const resolveImageUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `${getApiBaseUrl()}${trimmed}`;
  return `${getApiBaseUrl()}/${trimmed}`;
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

export default function ListaDeseos({ embedded = false, onVerLibro }) {
  const navigate = useNavigate();
  const [listas, setListas] = useState([]);
  const [listaSeleccionadaId, setListaSeleccionadaId] = useState(null);
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [librosLoading, setLibrosLoading] = useState(false);
  const [error, setError] = useState('');
  const [nuevaListaNombre, setNuevaListaNombre] = useState('');
  const [mostrarFormNuevaLista, setMostrarFormNuevaLista] = useState(false);
  const [hoveredListId, setHoveredListId] = useState(null);
  const [hoveredBookId, setHoveredBookId] = useState(null);

  const cargarListas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getListasDeseos();
      const data = res.data || [];
      setListas(data);
      if (data.length > 0) {
        setListaSeleccionadaId((prev) => prev ?? data[0].id_lista);
      } else {
        setListaSeleccionadaId(null);
        setLibros([]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar las listas');
      setListas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarLibros = useCallback(async (idLista) => {
    if (!idLista) {
      setLibros([]);
      return;
    }
    setLibrosLoading(true);
    try {
      const res = await getLibrosListaDeseos(idLista);
      setLibros(res.data || []);
    } catch (err) {
      console.error(err);
      setLibros([]);
    } finally {
      setLibrosLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    cargarListas();
  }, [cargarListas, navigate]);

  useEffect(() => {
    if (listaSeleccionadaId) {
      cargarLibros(listaSeleccionadaId);
    }
  }, [listaSeleccionadaId, cargarLibros]);

  const handleCrearLista = async () => {
    const nombre = nuevaListaNombre.trim();
    if (!nombre) {
      setError('El nombre de la lista es obligatorio');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await crearListaDeseos({ nombre_lista: nombre, publica: false });
      setNuevaListaNombre('');
      setMostrarFormNuevaLista(false);
      await cargarListas();
      if (res.data?.id_lista) setListaSeleccionadaId(res.data.id_lista);
      notify('Lista creada', 'success');
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo crear la lista');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarLista = async (idLista) => {
    if (!window.confirm('¿Eliminar esta lista de deseos?')) return;
    setLoading(true);
    try {
      await eliminarListaDeseos(idLista);
      if (listaSeleccionadaId === idLista) {
        setListaSeleccionadaId(null);
        setLibros([]);
      }
      await cargarListas();
      notify('Lista eliminada', 'success');
    } catch (err) {
      notify(err.response?.data?.detail || 'No se pudo eliminar la lista', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarLibro = async (idLibro) => {
    if (!listaSeleccionadaId) return;
    try {
      await eliminarLibroListaDeseos(listaSeleccionadaId, idLibro);
      await cargarLibros(listaSeleccionadaId);
      await cargarListas();
      notify('Libro eliminado de la lista', 'success');
    } catch (err) {
      notify(err.response?.data?.detail || 'No se pudo eliminar el libro', 'error');
    }
  };

  const handleVerDetalle = (libro) => {
    if (onVerLibro) {
      onVerLibro(libro);
      return;
    }
    navigate('/post-login?seccion=Cat%C3%A1logo');
  };

  const listaActiva = listas.find((l) => l.id_lista === listaSeleccionadaId);

  const content = (
    <>
      <div 
        className="pl-card" 
        style={{ 
          padding: '2rem 2.5rem', 
          marginBottom: 28, 
          background: 'linear-gradient(135deg, #fff 0%, #faf8f6 100%)',
          border: '2px solid #e8e4df',
          borderRadius: '20px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #7A1E3A 0%, #9C2F4A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(122, 30, 90, 0.2)'
            }}>
              <IconFavorites width={24} height={24} strokeWidth={2} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--gris-carbon)', letterSpacing: '-0.5px' }}>Lista de Deseos</h2>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                Organiza y guarda los libros que te interesan
              </p>
            </div>
          </div>
          {!embedded && (
            <button
              className="btn btn-vinotinto"
              style={{ width: 'auto', padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem' }}
              onClick={() => navigate('/post-login')}
            >
              Volver al panel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 12, padding: 16, marginBottom: 20, color: '#991b1b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: 28, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="pl-card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid #e8e4df', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: 'var(--gris-carbon)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.3px' }}>Mis listas</h3>
              <button
                className="btn"
                style={{ 
                  padding: '8px 14px', 
                  fontSize: '0.85rem', 
                  width: 'auto', 
                  background: 'rgba(122, 30, 58, 0.08)',
                  color: 'var(--vinotinto)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setMostrarFormNuevaLista((v) => !v)}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(122, 30, 58, 0.15)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(122, 30, 58, 0.08)'; }}
              >
                <IconPlus width={16} height={16} strokeWidth={2.5} /> Nueva
              </button>
            </div>

            {mostrarFormNuevaLista && (
              <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10, background: '#faf8f6', padding: 14, borderRadius: 12, border: '1px solid #e8e4df' }}>
                <input
                  type="text"
                  placeholder="Nombre de la lista"
                  value={nuevaListaNombre}
                  onChange={(e) => setNuevaListaNombre(e.target.value)}
                  style={{ 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1.5px solid #e0dbd4', 
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#fff',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--vinotinto)'}
                  onBlur={(e) => e.target.style.borderColor = '#e0dbd4'}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-vinotinto" 
                    onClick={handleCrearLista} 
                    disabled={loading} 
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', margin: 0, borderRadius: '8px' }}
                  >
                    {loading ? 'Creando...' : 'Crear'}
                  </button>
                  <button 
                    onClick={() => setMostrarFormNuevaLista(false)} 
                    style={{ 
                      padding: '8px 12px', 
                      fontSize: '0.85rem', 
                      background: 'none', 
                      border: '1.5px solid #e0dbd4', 
                      color: '#666', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loading && listas.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div style={{ width: 24, height: 24, border: '2px solid #e8e4df', borderTop: '2px solid var(--vinotinto)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              </div>
            ) : listas.length === 0 ? (
              <p style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                No tienes listas aún. Crea una para empezar.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {listas.map((lista) => {
                  const isActive = listaSeleccionadaId === lista.id_lista;
                  const isHovered = hoveredListId === lista.id_lista;
                  return (
                    <div
                      key={lista.id_lista}
                      onMouseEnter={() => setHoveredListId(lista.id_lista)}
                      onMouseLeave={() => setHoveredListId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: isActive ? '2px solid var(--vinotinto)' : '1.5px solid #e8e4df',
                        background: isActive ? '#fbf7f8' : '#fff',
                        cursor: 'pointer',
                        transform: isHovered && !isActive ? 'translateX(4px)' : 'none',
                        boxShadow: isActive ? '0 4px 12px rgba(122, 30, 58, 0.08)' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setListaSeleccionadaId(lista.id_lista)}
                        style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                      >
                        <p style={{ margin: 0, fontWeight: 700, color: isActive ? 'var(--vinotinto)' : '#333', fontSize: '0.95rem' }}>{lista.nombre_lista}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: '0.75rem',
                            background: isActive ? 'rgba(122, 30, 58, 0.1)' : '#f3f0ec',
                            color: isActive ? 'var(--vinotinto)' : '#666',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 700
                          }}>
                            {lista.total_libros || 0} libro{(lista.total_libros || 0) === 1 ? '' : 's'}
                          </span>
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarLista(lista.id_lista)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: isHovered ? '#dc2626' : '#bbb', 
                          cursor: 'pointer', 
                          padding: 6,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="Eliminar lista"
                      >
                        <IconTrash width={16} height={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div 
            style={{ 
              padding: '20px 24px', 
              borderRadius: '20px', 
              border: '1.5px dashed #e8e4df', 
              background: '#fdfcfb',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <h4 style={{ margin: 0, color: 'var(--vinotinto)', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.2px' }}>💡 Tips de Compra</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 500 }}>
              Puedes organizar tus listas por géneros, autores favoritos o próximas compras para no perder de vista ninguna lectura.
            </p>
            <div style={{ borderTop: '1.5px solid #e8e4df', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888', fontWeight: 700 }}>
              <span>Listas: {listas.length}</span>
              <span>Total libros: {listas.reduce((acc, l) => acc + (l.total_libros || 0), 0)}</span>
            </div>
          </div>
        </div>

        <div className="pl-card" style={{ padding: '28px', borderRadius: '20px', border: '1px solid #e8e4df', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          {!listaActiva ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', color: '#666', marginBottom: 20 }}>Selecciona o crea una lista para ver sus libros</p>
              <button
                className="btn btn-vinotinto btn-catalog"
                onClick={() => navigate('/post-login?seccion=Cat%C3%A1logo')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: 'auto', padding: '10px 20px', borderRadius: '8px' }}
              >
                <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                Ir al catálogo
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2.5px solid #f3f0ec', paddingBottom: 14 }}>
                <h3 style={{ margin: 0, color: 'var(--vinotinto)', fontWeight: 800, fontSize: '1.3rem' }}>
                  {listaActiva.nombre_lista}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, background: '#f5eaed', color: 'var(--vinotinto)', padding: '4px 12px', borderRadius: '12px' }}>
                  {libros.length} producto{libros.length === 1 ? '' : 's'}
                </span>
              </div>

              {librosLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #e8e4df', borderTop: '3px solid var(--vinotinto)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : libros.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div style={{ marginBottom: 16 }}>
                    <IconBookOpen width={44} height={44} strokeWidth={1.5} style={{ color: '#ccc' }} />
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: 20 }}>Esta lista está vacía. Agrega libros desde el catálogo.</p>
                  <button
                    className="btn btn-vinotinto btn-catalog"
                    onClick={() => navigate('/post-login?seccion=Cat%C3%A1logo')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: 'auto', padding: '10px 20px', borderRadius: '8px' }}
                  >
                    <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                    Explorar catálogo
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {libros.map((libro) => {
                    const isHovered = hoveredBookId === libro.id_libro;
                    return (
                      <div
                        key={libro.id_libro}
                        onMouseEnter={() => setHoveredBookId(libro.id_libro)}
                        onMouseLeave={() => setHoveredBookId(null)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '110px 1fr auto',
                          gap: 20,
                          padding: 20,
                          border: '1.5px solid #e8e4df',
                          borderRadius: 16,
                          alignItems: 'center',
                          background: '#fff',
                          boxShadow: isHovered ? '0 8px 24px rgba(122, 30, 58, 0.06)' : 'none',
                          transform: isHovered ? 'translateY(-2px)' : 'none',
                          borderColor: isHovered ? 'rgba(122, 30, 58, 0.25)' : '#e8e4df',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        }}
                      >
                        <img
                          src={resolveImageUrl(libro.imagen_url) || IMG_DEFAULT}
                          alt={libro.titulo}
                          style={{ 
                            width: '100%', 
                            height: 140, 
                            objectFit: 'cover', 
                            borderRadius: 10,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.06)' 
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.15rem', color: '#2A2A2A', letterSpacing: '-0.3px', lineHeight: '1.3' }}>{libro.titulo}</p>
                          <p style={{ margin: '0 0 10px', color: '#666', fontWeight: 600, fontSize: '0.9rem' }}>{libro.autor_libro}</p>
                          
                          {libro.nombre_categoria && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              background: '#fce4ec', 
                              color: '#8b0000', 
                              padding: '4px 10px', 
                              borderRadius: '20px', 
                              fontWeight: 700,
                              width: 'fit-content',
                              marginBottom: 12
                            }}>
                              {libro.nombre_categoria}
                            </span>
                          )}
                          <p style={{ margin: 0, fontWeight: 800, color: 'var(--vinotinto)', fontSize: '1.2rem' }}>
                            {formatCurrency(libro.precio_libro)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'center', minWidth: '130px' }}>
                          <button
                            className="btn btn-vinotinto"
                            style={{ 
                              padding: '10px 16px', 
                              fontSize: '0.85rem', 
                              width: '100%', 
                              margin: 0, 
                              borderRadius: '8px',
                              fontWeight: 700,
                              boxShadow: '0 2px 6px rgba(122, 30, 58, 0.15)'
                            }}
                            onClick={() => handleVerDetalle(libro)}
                          >
                            Ver detalle
                          </button>
                          <button
                            style={{ 
                              background: 'none', 
                              border: '1.5px solid #dc2626', 
                              color: '#dc2626', 
                              borderRadius: '8px', 
                              padding: '10px 16px', 
                              fontWeight: 700, 
                              cursor: 'pointer', 
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleEliminarLibro(libro.id_libro)}
                            onMouseEnter={(e) => { e.target.style.background = '#fef2f2'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'none'; }}
                          >
                            <IconTrash width={14} height={14} /> Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );

  if (embedded) return content;

  return (
    <main className="auth-main" style={{ alignItems: 'flex-start', paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        {content}
      </div>
    </main>
  );
}

