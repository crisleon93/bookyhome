import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getListasDeseos,
  crearListaDeseos,
  eliminarListaDeseos,
  getLibrosListaDeseos,
  agregarLibroListaDeseos,
  eliminarLibroListaDeseos,
  eliminarFavorito,
  getFavoritos,
  getApiBaseUrl,
} from '../services/api';
import { notify } from '../components/ToastProvider';
import { IconFavorites, IconBookOpen, IconTrash, IconPlus } from '../components/Icons';

const IMG_DEFAULT = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';

const categoriaColor = (categoria = '', dark = false) => {
  const texto = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (dark) {
    if (texto.includes('terror')) return { bg: '#1e1530', color: '#b48ce8' };
    if (texto.includes('ciencia') || texto.includes('cientifica')) return { bg: '#0f2e1a', color: '#4ade80' };
    if (texto.includes('romance')) return { bg: '#2e0d1e', color: '#f472b6' };
    if (texto.includes('fantasia')) return { bg: '#0d1a3c', color: '#818cf8' };
    if (texto.includes('historia')) return { bg: '#2a1a08', color: '#fbbf24' };
    if (texto.includes('tecnologia')) return { bg: '#0a2a2e', color: '#22d3ee' };
    if (texto.includes('juvenil')) return { bg: '#2a1e00', color: '#fcd34d' };
    if (texto.includes('infantil')) return { bg: '#0a1e30', color: '#60a5fa' };
    if (texto.includes('aventura')) return { bg: '#2a1500', color: '#fb923c' };
    if (texto.includes('arte')) return { bg: '#1e0a24', color: '#d8b4fe' };
    if (texto.includes('biografia')) return { bg: '#0d1f3c', color: '#7dd3fc' };
    if (texto.includes('educacion')) return { bg: '#0f2e18', color: '#6ee7b7' };
    if (texto.includes('ficcion')) return { bg: '#2e0d0d', color: '#f87171' };
    return { bg: '#2a1a24', color: '#e05a7a' };
  }
  if (texto.includes('terror')) return { bg: '#eee8f7', color: '#603a92' };
  if (texto.includes('ciencia') || texto.includes('cientifica')) return { bg: '#e4f5e9', color: '#1f7a45' };
  if (texto.includes('romance')) return { bg: '#fde8ef', color: '#b4235d' };
  if (texto.includes('fantasia')) return { bg: '#e9edff', color: '#4156a6' };
  if (texto.includes('historia')) return { bg: '#f8eddb', color: '#8c5a1d' };
  if (texto.includes('tecnologia')) return { bg: '#e2f4f6', color: '#137783' };
  if (texto.includes('juvenil')) return { bg: '#fff2d7', color: '#a25d00' };
  if (texto.includes('infantil')) return { bg: '#e4f4ff', color: '#2775a7' };
  if (texto.includes('aventura')) return { bg: '#fff0df', color: '#b85f11' };
  if (texto.includes('arte')) return { bg: '#f4e6f6', color: '#86418f' };
  if (texto.includes('biografia')) return { bg: '#e8eef8', color: '#365d96' };
  if (texto.includes('educacion')) return { bg: '#e8f3e9', color: '#397542' };
  if (texto.includes('ficcion')) return { bg: '#fce4ec', color: '#8b0000' };
  return { bg: '#f4eef0', color: '#7a1e3a' };
};

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

export default function ListaDeseos({ embedded = false, onVerLibro, onIrCatalogo }) {
  const navigate = useNavigate();
  const [listas, setListas] = useState([]);
  const [listaSeleccionadaId, setListaSeleccionadaId] = useState(null);
  const [libros, setLibros] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [librosLoading, setLibrosLoading] = useState(false);
  const [error, setError] = useState('');
  const [nuevaListaNombre, setNuevaListaNombre] = useState('');
  const [mostrarFormNuevaLista, setMostrarFormNuevaLista] = useState(false);
  const [hoveredListId, setHoveredListId] = useState(null);
  const [hoveredBookId, setHoveredBookId] = useState(null);
  const [libroParaAgregarId, setLibroParaAgregarId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    const handleDarkModeChange = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handleDarkModeChange);
    window.addEventListener('storage', handleDarkModeChange);
    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange);
      window.removeEventListener('storage', handleDarkModeChange);
    };
  }, []);

  const cargarListas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const favoritosRes = await getFavoritos();
      setFavoritos(favoritosRes.data || []);
      const res = await getListasDeseos();
      const data = res.data || [];
      setListas(data);
      setListaSeleccionadaId((prev) => data.some((lista) => lista.id_lista === prev) ? prev : null);
      if (data.length === 0) setLibros([]);
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
    navigate('/?seccion=Cat%C3%A1logo');
  };

  const handleQuitarLibro = async (idLibro) => {
    if (!mostrandoFavoritos) return handleEliminarLibro(idLibro);
    try {
      await eliminarFavorito(idLibro);
      setFavoritos((actuales) => actuales.filter((libro) => libro.id_libro !== idLibro));
      notify('Libro eliminado de favoritos', 'success');
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      notify(err.response?.data?.detail || 'No se pudo eliminar de favoritos', 'error');
    }
  };

  const handleAgregarLibroALista = async (idLista, idLibro) => {
    try {
      await agregarLibroListaDeseos(idLista, { id_libro: idLibro });
      setLibroParaAgregarId(null);
      notify('Libro agregado a la lista', 'success');
      await cargarListas();
    } catch (err) {
      notify(err.response?.data?.detail || 'No se pudo agregar a la lista', 'error');
    }
  };

  const handleIrCatalogo = () => {
    if (onIrCatalogo) {
      onIrCatalogo();
      return;
    }
    navigate('/?seccion=Cat%C3%A1logo');
  };

  const listaSeleccionada = listas.find((l) => l.id_lista === listaSeleccionadaId);
  const mostrandoFavoritos = !listaSeleccionada;
  const listaActiva = listaSeleccionada || { nombre_lista: 'Mis favoritos' };
  const librosMostrados = mostrandoFavoritos ? favoritos : libros;

  const content = (
    <>
      <div 
        className="pl-card" 
        style={{ 
          padding: '2rem 2.5rem', 
          marginBottom: 28, 
          background: darkMode ? 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)' : 'linear-gradient(135deg, #fff 0%, #faf8f6 100%)',
          border: `2px solid ${darkMode ? '#454545' : '#e8e4df'}`,
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
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: darkMode ? '#ececec' : 'var(--gris-carbon)', letterSpacing: '-0.5px' }}>Lista de Deseos</h2>
              <p style={{ margin: '4px 0 0', color: darkMode ? '#aaa' : '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                Organiza y guarda los libros que te interesan
              </p>
            </div>
          </div>
          {!embedded && (
            <button
              className="btn btn-vinotinto"
              style={{ width: 'auto', padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem' }}
              onClick={() => navigate('/')}
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
          <div className="pl-card" style={{ padding: '24px', borderRadius: '20px', border: `1px solid ${darkMode ? '#454545' : '#e8e4df'}`, background: darkMode ? '#1e1e1e' : undefined, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: darkMode ? '#ececec' : 'var(--gris-carbon)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.3px' }}>Mis listas</h3>
              <button
                className="btn"
                style={{ 
                  padding: '8px 14px', 
                  fontSize: '0.85rem', 
                  width: 'auto', 
                  background: darkMode ? '#2a1a24' : 'rgba(122, 30, 58, 0.08)',
                  color: darkMode ? '#ff4f83' : 'var(--vinotinto)',
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
                onMouseEnter={(e) => { e.currentTarget.style.background = darkMode ? '#422033' : 'rgba(122, 30, 58, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = darkMode ? '#2a1a24' : 'rgba(122, 30, 58, 0.08)'; }}
              >
                <IconPlus width={16} height={16} strokeWidth={2.5} /> Nueva
              </button>
            </div>

            {mostrarFormNuevaLista && (
              <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10, background: darkMode ? '#252525' : '#faf8f6', padding: 14, borderRadius: 12, border: `1px solid ${darkMode ? '#454545' : '#e8e4df'}` }}>
                <input
                  type="text"
                  placeholder="Nombre de la lista"
                  value={nuevaListaNombre}
                  onChange={(e) => setNuevaListaNombre(e.target.value)}
                  style={{ 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: `1.5px solid ${darkMode ? '#606060' : '#e0dbd4'}`, 
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: darkMode ? '#303030' : '#fff',
                    color: darkMode ? '#ececec' : '#1a1a1a',
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
                      border: `1.5px solid ${darkMode ? '#606060' : '#e0dbd4'}`, 
                      color: darkMode ? '#c8c8c8' : '#666', 
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

            <button
              type="button"
              onClick={() => {
                setListaSeleccionadaId(null);
                setLibros([]);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 16px',
                marginBottom: 12,
                background: mostrandoFavoritos ? (darkMode ? '#2a1a24' : '#fbf7f8') : (darkMode ? '#252525' : '#fff'),
                border: mostrandoFavoritos ? `2px solid ${darkMode ? '#ff4f83' : 'var(--vinotinto)'}` : `1.5px solid ${darkMode ? '#606060' : '#e8e4df'}`,
                borderRadius: '12px',
                color: darkMode ? '#ff4f83' : 'var(--vinotinto)',
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                <IconFavorites width={18} height={18} strokeWidth={2} /> Mis favoritos
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(122, 30, 58, 0.1)', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
                {favoritos.length} libro{favoritos.length === 1 ? '' : 's'}
              </span>
            </button>

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
                        border: isActive ? `2px solid ${darkMode ? '#ff4f83' : 'var(--vinotinto)'}` : `1.5px solid ${darkMode ? '#606060' : '#e8e4df'}`,
                        background: isActive ? (darkMode ? '#2a1a24' : '#fbf7f8') : (darkMode ? '#252525' : '#fff'),
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
                        <p style={{ margin: 0, fontWeight: 700, color: isActive ? (darkMode ? '#ff6b97' : 'var(--vinotinto)') : (darkMode ? '#ececec' : '#333'), fontSize: '0.95rem' }}>{lista.nombre_lista}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: darkMode ? '#aaa' : '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: '0.75rem',
                            background: isActive ? 'rgba(122, 30, 58, 0.1)' : (darkMode ? '#303030' : '#f3f0ec'),
                            color: isActive ? (darkMode ? '#ff6b97' : 'var(--vinotinto)') : (darkMode ? '#c8c8c8' : '#666'),
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
              border: `1.5px dashed ${darkMode ? '#606060' : '#e8e4df'}`, 
              background: darkMode ? '#252525' : '#fdfcfb',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <h4 style={{ margin: 0, color: darkMode ? '#ff4f83' : 'var(--vinotinto)', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.2px' }}>💡 Tips de Compra</h4>
            <p style={{ margin: 0, color: darkMode ? '#c8c8c8' : '#666', fontSize: '0.85rem', lineHeight: '1.5', fontWeight: 500 }}>
              Puedes organizar tus listas por géneros, autores favoritos o próximas compras para no perder de vista ninguna lectura.
            </p>
            <div style={{ borderTop: `1.5px solid ${darkMode ? '#454545' : '#e8e4df'}`, paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: darkMode ? '#aaa' : '#888', fontWeight: 700 }}>
              <span>Listas: {listas.length}</span>
              <span>Total libros: {listas.reduce((acc, l) => acc + (l.total_libros || 0), 0)}</span>
            </div>
          </div>
        </div>

        <div className="pl-card" style={{ padding: '28px', borderRadius: '20px', border: `1px solid ${darkMode ? '#454545' : '#e8e4df'}`, background: darkMode ? '#1e1e1e' : undefined, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          {!listaActiva ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', background: darkMode ? '#1e1e1e' : 'transparent', borderRadius: '16px' }}>
              <p style={{ fontSize: '1rem', color: darkMode ? '#c8c8c8' : '#666', marginBottom: 20 }}>Selecciona o crea una lista para ver sus libros</p>
              <button
                className="btn btn-vinotinto btn-catalog"
                onClick={handleIrCatalogo}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: 'auto', padding: '10px 20px', borderRadius: '8px' }}
              >
                <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                Ir al catálogo
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: `2.5px solid ${darkMode ? '#3a3a3a' : '#f3f0ec'}`, paddingBottom: 14 }}>
                <h3 style={{ margin: 0, color: darkMode ? '#ff4f83' : 'var(--vinotinto)', fontWeight: 800, fontSize: '1.3rem' }}>
                  {listaActiva.nombre_lista}
                </h3>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, background: darkMode ? '#2a1a24' : '#f5eaed', color: darkMode ? '#ff6b97' : 'var(--vinotinto)', padding: '4px 12px', borderRadius: '12px' }}>
                  {librosMostrados.length} producto{librosMostrados.length === 1 ? '' : 's'}
                </span>
              </div>

              {librosLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #e8e4df', borderTop: '3px solid var(--vinotinto)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : librosMostrados.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', background: darkMode ? '#1e1e1e' : 'transparent', borderRadius: '16px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <IconBookOpen width={44} height={44} strokeWidth={1.5} style={{ color: darkMode ? '#606060' : '#ccc' }} />
                  </div>
                  <p style={{ fontSize: '0.95rem', color: darkMode ? '#c8c8c8' : '#666', marginBottom: 20 }}>Esta lista está vacía. Agrega libros desde el catálogo.</p>
                  <button
                    className="btn btn-vinotinto btn-catalog"
                    onClick={handleIrCatalogo}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: 'auto', padding: '10px 20px', borderRadius: '8px' }}
                  >
                    <IconBookOpen width={18} height={18} strokeWidth={2} style={{ color: 'white' }} />
                    Explorar catálogo
                  </button>
                </div>
              ) : (
                <div className="wishlist-books-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
                  {librosMostrados.map((libro) => {
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
                          border: `1.5px solid ${darkMode ? '#606060' : '#e8e4df'}`,
                          borderRadius: 16,
                          alignItems: 'center',
                          background: darkMode ? '#252525' : '#fff',
                          boxShadow: isHovered ? '0 8px 24px rgba(122, 30, 58, 0.06)' : 'none',
                          transform: isHovered ? 'translateY(-2px)' : 'none',
                          borderColor: isHovered ? (darkMode ? '#ff4f83' : 'rgba(122, 30, 58, 0.25)') : (darkMode ? '#606060' : '#e8e4df'),
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
                          <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.15rem', color: darkMode ? '#ececec' : '#2A2A2A', letterSpacing: '-0.3px', lineHeight: '1.3' }}>{libro.titulo}</p>
                          <p style={{ margin: '0 0 10px', color: darkMode ? '#c8c8c8' : '#666', fontWeight: 600, fontSize: '0.9rem' }}>{libro.autor_libro}</p>
                          
                          {libro.nombre_categoria && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              background: categoriaColor(libro.nombre_categoria, darkMode).bg, 
                              color: categoriaColor(libro.nombre_categoria, darkMode).color, 
                              padding: '4px 10px', 
                              borderRadius: '20px', 
                              fontWeight: 700,
                              width: 'fit-content',
                              marginBottom: 12
                            }}>
                              {libro.nombre_categoria}
                            </span>
                          )}
                          <p style={{ margin: 0, fontWeight: 800, color: darkMode ? '#ff4f83' : 'var(--vinotinto)', fontSize: '1.2rem' }}>
                            {formatCurrency(libro.precio_libro)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'center', minWidth: '180px' }}>
                          {/* Ver detalle — acción primaria */}
                          <button
                            onClick={() => handleVerDetalle(libro)}
                            style={{ 
                              padding: '11px 16px', fontSize: '0.85rem', width: '100%', margin: 0, 
                              borderRadius: '10px', fontWeight: 700,
                              background: 'var(--vinotinto)', color: '#fff', border: 'none',
                              boxShadow: '0 4px 12px rgba(122,30,58,0.35)',
                              cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                              transition: 'all 0.2s', letterSpacing: '0.01em',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#9B2648'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(122,30,58,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--vinotinto)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(122,30,58,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            Ver detalle
                          </button>

                          {/* Agregar a lista — acción secundaria */}
                          {mostrandoFavoritos && listas.length > 0 && (
                            libroParaAgregarId === libro.id_libro ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, background: darkMode ? '#252525' : '#fafafa', border: `1px solid ${darkMode ? '#3a3a3a' : '#e8e4df'}`, borderRadius: 10 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: darkMode ? '#aaa' : '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agregar a:</span>
                                {listas.map((lista) => (
                                  <button key={lista.id_lista} type="button"
                                    onClick={() => handleAgregarLibroALista(lista.id_lista, libro.id_libro)}
                                    style={{ padding: '7px 10px', background: darkMode ? '#2a1a24' : '#fdf2f4', border: `1px solid ${darkMode ? '#e05a7a' : 'var(--vinotinto)'}`, color: darkMode ? '#e05a7a' : 'var(--vinotinto)', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--vinotinto)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = darkMode ? '#2a1a24' : '#fdf2f4'; e.currentTarget.style.color = darkMode ? '#e05a7a' : 'var(--vinotinto)'; }}
                                  >
                                    {lista.nombre_lista}
                                  </button>
                                ))}
                                <button type="button" onClick={() => setLibroParaAgregarId(null)} style={{ background: 'none', border: 'none', color: darkMode ? '#888' : '#999', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Montserrat, sans-serif', padding: '2px 0' }}>Cancelar</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => setLibroParaAgregarId(libro.id_libro)}
                                style={{ 
                                  padding: '9px 16px', width: '100%', background: darkMode ? '#252525' : '#fff',
                                  border: `1.5px solid ${darkMode ? '#3a3a3a' : '#d1c8c0'}`,
                                  color: darkMode ? '#c8c8c8' : '#555',
                                  borderRadius: '10px', cursor: 'pointer', fontWeight: 600,
                                  fontSize: '0.82rem', fontFamily: 'Montserrat, sans-serif',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = darkMode ? '#e05a7a' : 'var(--vinotinto)'; e.currentTarget.style.color = darkMode ? '#e05a7a' : 'var(--vinotinto)'; e.currentTarget.style.background = darkMode ? '#2a1a24' : '#fdf8f9'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#3a3a3a' : '#d1c8c0'; e.currentTarget.style.color = darkMode ? '#c8c8c8' : '#555'; e.currentTarget.style.background = darkMode ? '#252525' : '#fff'; }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Agregar a lista
                              </button>
                            )
                          )}

                          {/* Quitar — destructivo, sutil hasta el hover */}
                          <button
                            style={{ 
                              padding: '8px 16px', width: '100%', background: 'transparent',
                              border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5d5d5'}`,
                              color: darkMode ? '#888' : '#b0878f',
                              borderRadius: '10px', fontWeight: 600, cursor: 'pointer', 
                              fontSize: '0.8rem', fontFamily: 'Montserrat, sans-serif',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              transition: 'all 0.2s',
                            }}
                            onClick={() => handleQuitarLibro(libro.id_libro)}
                            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? '#2e0d0d' : '#fef2f2'; e.currentTarget.style.borderColor = darkMode ? '#f87171' : '#dc2626'; e.currentTarget.style.color = darkMode ? '#f87171' : '#dc2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = darkMode ? '#3a3a3a' : '#e5d5d5'; e.currentTarget.style.color = darkMode ? '#888' : '#b0878f'; }}
                          >
                            <IconTrash width={13} height={13} /> Quitar
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

