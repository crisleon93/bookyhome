import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api, { addToCart, removeFromCart } from '../services/api';
import { notify } from '../components/ToastProvider';
import FiltrosCatalogo from '../components/FiltrosCatalogo';
import LibroCard from '../components/LibroCard';
import { chatService } from '../services/chat';
import '../styles/catalogo.css';


const Catalogo = ({ libroInicial = null, onLibroInicialConsumido }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [addingId, setAddingId] = useState(null);
  const [addedToCartIds, setAddedToCartIds] = useState(new Set());
  const [libroSeleccionado, setLibroSeleccionado] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [contactando, setContactando] = useState(false);

  const [filtros, setFiltros] = useState({
    q: searchParams.get('q') || '',
    categoria_id: null,
    precio_min: 0,
    precio_max: 1000000,
    calificacion_min: 0,
    disponible: true,
    ordenar_por: 'relevancia'
  });

  useEffect(() => {
    if (!libroInicial) return;
    setLibroSeleccionado(libroInicial);
    setMostrarDetalles(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onLibroInicialConsumido?.();
  }, [libroInicial, onLibroInicialConsumido]);

  const cargarLibros = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.q) params.append('q', filtros.q);
      if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
      if (filtros.precio_min) params.append('precio_min', filtros.precio_min);
      if (filtros.precio_max) params.append('precio_max', filtros.precio_max);
      if (filtros.calificacion_min) params.append('calificacion_min', filtros.calificacion_min);
      if (filtros.disponible) params.append('disponible', 'true');
      params.append('ordenar_por', filtros.ordenar_por);
      params.append('pagina', pagina);
      params.append('limite', 20);

      const response = await api.get(`/catalogo/busqueda-avanzada?${params}`);
      setLibros(response.data.libros || []);
      setTotalPaginas(response.data.total_paginas || 1);
      setPagina(response.data.pagina || 1);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setLoading(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    cargarLibros();
  }, [cargarLibros]);

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setPagina(1);
  };

  const handleAddToCart = async (libro) => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('Debes iniciar sesión para agregar al carrito', 'error');
      return;
    }
    setAddingId(libro.id_libro);
    try {
      await addToCart({
        id_libro: libro.id_libro,
        cantidad: 1,
        titulo: libro.titulo,
        autor_libro: libro.autor_libro,
        precio_libro: libro.precio_libro,
        imagen: libro.imagen_url || null,
      });
      notify('AGREGADO AL CARRITO', 'success');
      window.dispatchEvent(new Event('cart-updated'));
      setAddedToCartIds(prev => new Set(prev).add(libro.id_libro));
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo agregar al carrito';
      notify(msg, 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveFromCart = async (libro) => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('Debes iniciar sesión', 'error');
      return;
    }
    setAddingId(libro.id_libro);
    try {
      await removeFromCart(libro.id_libro);
      setAddedToCartIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(libro.id_libro);
        return newSet;
      });
      notify('Eliminado del carrito', 'success');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo eliminar del carrito';
      notify(msg, 'error');
    } finally {
      setAddingId(null);
    }
  };
  const handleVerDetalles = (libro) => {
    setLibroSeleccionado(libro);
    setMostrarDetalles(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVolverCatalogo = () => {
    setMostrarDetalles(false);
    setLibroSeleccionado(null);
  };

  const handleContactar = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('Debes iniciar sesión para contactar al vendedor', 'error');
      navigate('/login');
      return;
    }

    if (!libroSeleccionado?.id_tienda) {
      notify('No se puede identificar la tienda del vendedor', 'error');
      return;
    }

    setContactando(true);
    try {
      // Crear o obtener sala de chat con la tienda
      const response = await chatService.crearSala(libroSeleccionado.id_tienda);
      const idSala = response.id_sala;
      
      if (!idSala) {
        throw new Error('No se recibió id_sala del servidor');
      }

      // Navegar a PostLogin con la sección Mensajes y el id_sala seleccionado
      navigate(`/post-login?seccion=Mensajes&sala=${idSala}`);
    } catch (error) {
      console.error('Error al crear sala de chat:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'No se pudo iniciar el chat. Intenta nuevamente.';
      notify(errorMsg, 'error');
    } finally {
      setContactando(false);
    }
  };

  return (
    <main className="layout-container catalogo-main">
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        Catálogo de libros
      </h1>

      {/* FILTROS AVANZADOS */}
      {!mostrarDetalles && (
        <FiltrosCatalogo
          onFiltrosChange={handleFiltrosChange}
          filtrosActivos={filtros}
        />
      )}

      {/* RESULTADOS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          Cargando libros...
        </div>
      ) : mostrarDetalles && libroSeleccionado ? (
        <div className="detalle-libro-inline">
          <button
            onClick={handleVolverCatalogo}
            style={{
              background: 'var(--vinotinto)',
              color: 'white',
              border: 'none',
              padding: '0.7rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al catálogo
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', marginBottom: '32px' }}>
            <div>
              <img
                src={libroSeleccionado.imagen_url || libroSeleccionado.imagen_principal || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'}
                alt={libroSeleccionado.titulo}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </div>
            <div>
              {libroSeleccionado.nombre_categoria && (
                <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '20px', background: '#fce4ec', color: '#8b0000', fontSize: '0.8rem', fontWeight: '700', marginBottom: '12px' }}>
                  {libroSeleccionado.nombre_categoria}
                </span>
              )}
              <h2 style={{ fontSize: '2.2rem', fontWeight: '700', margin: '0 0 8px 0', lineHeight: '1.2', color: '#2c2c2c' }}>{libroSeleccionado.titulo}</h2>
              <p style={{ fontSize: '1.2rem', color: '#666', fontWeight: '600', margin: '0 0 16px 0' }}>{libroSeleccionado.autor_libro || libroSeleccionado.autor || 'Autor no disponible'}</p>
              
              {/* Calificación */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} width="20" height="20" viewBox="0 0 24 24" fill={star <= (libroSeleccionado.calificacion || 4) ? '#ffc107' : '#e0e0e0'} stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>({libroSeleccionado.calificacion || 4}.0)</span>
                <span style={{ fontSize: '0.85rem', color: '#999' }}>• {Math.floor(Math.random() * 100) + 10} reseñas</span>
              </div>

              {libroSeleccionado.nombre_tienda && (
                <p style={{ fontSize: '0.95rem', color: '#777', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {libroSeleccionado.nombre_tienda}
                </p>
              )}

              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#8b0000', margin: '16px 0' }}>${Number(libroSeleccionado.precio_libro || libroSeleccionado.precio || 0).toLocaleString('es-CO')}</p>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => addedToCartIds.has(libroSeleccionado.id_libro) ? handleRemoveFromCart(libroSeleccionado) : handleAddToCart(libroSeleccionado)}
                  disabled={addingId === libroSeleccionado.id_libro || libroSeleccionado.stock === 0}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    background: addedToCartIds.has(libroSeleccionado.id_libro) ? '#e53935' : 'var(--vinotinto, #8b0000)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    cursor: addingId === libroSeleccionado.id_libro || libroSeleccionado.stock === 0 ? 'not-allowed' : 'pointer',
                    opacity: addingId === libroSeleccionado.id_libro || libroSeleccionado.stock === 0 ? 0.65 : 1,
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {libroSeleccionado.stock === 0 ? 'Sin stock' : addingId === libroSeleccionado.id_libro ? 'Procesando…' : addedToCartIds.has(libroSeleccionado.id_libro) ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Eliminar de carrito
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      Agregar al carrito
                    </>
                  )}
                </button>
                <button
                  onClick={handleContactar}
                  disabled={contactando}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    background: 'white',
                    color: 'var(--vinotinto, #8b0000)',
                    border: '2px solid var(--vinotinto, #8b0000)',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    cursor: contactando ? 'not-allowed' : 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: contactando ? 0.65 : 1
                  }}
                >
                  {contactando ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                      Contactar librería
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Descripción del producto */}
          <div style={{ marginBottom: '32px', padding: '24px', background: '#faf8f6', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: '#2c2c2c' }}>Descripción del producto</h3>
            {libroSeleccionado.descripcion_libro ? (
              <p style={{ fontSize: '1rem', color: '#555', lineHeight: '1.8', margin: 0 }}>{libroSeleccionado.descripcion_libro}</p>
            ) : (
              <div style={{ fontSize: '1rem', color: '#555', lineHeight: '1.8' }}>
                <p style={{ margin: '0 0 12px 0' }}>Este libro es una excelente adición a tu colección. Escrito por {libroSeleccionado.autor_libro || libroSeleccionado.autor || 'un autor reconocido'}， ofrece una narrativa cautivadora que te mantendrá enganchado desde la primera página hasta la última.</p>
                <p style={{ margin: '0 0 12px 0' }}>Formato: Tapa blanda | Páginas: {Math.floor(Math.random() * 200) + 200} | Idioma: Español | Editorial: {libroSeleccionado.nombre_tienda || 'Editorial destacada'}</p>
                <p style={{ margin: '0 0 12px 0' }}>Dimensiones: 15cm x 23cm x 2cm | Peso: {Math.floor(Math.random() * 300) + 200}g | ISBN: {Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
                <p style={{ margin: 0 }}>Ideal para lectores que disfrutan del género de {libroSeleccionado.nombre_categoria || 'ficción'} y buscan una experiencia de lectura enriquecedora y entretenida.</p>
              </div>
            )}
          </div>

          {/* Reseñas */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: '#2c2c2c' }}>Reseñas de clientes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#8b0000' }}>
                    M
                  </div>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>María García</p>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill="#ffc107" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#999', marginLeft: 'auto' }}>Hace 3 días</span>
                </div>
                <p style={{ fontSize: '0.95rem', color: '#555', margin: 0, lineHeight: '1.6' }}>Excelente libro， llegó en perfecto estado y el envío fue muy rápido. La historia es cautivadora y la calidad del papel es excelente. ¡Totalmente recomendado!</p>
              </div>
              <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#1976d2' }}>
                    C
                  </div>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>Carlos Rodríguez</p>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4].map((star) => (
                        <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill="#ffc107" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#e0e0e0" stroke="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#999', marginLeft: 'auto' }}>Hace 1 semana</span>
                </div>
                <p style={{ fontSize: '0.95rem', color: '#555', margin: 0, lineHeight: '1.6' }}>Buen libro en general， aunque esperaba más profundidad en los personajes. La calidad del material es buena y el precio está acorde al producto.</p>
              </div>
              <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#f57c00' }}>
                    A
                  </div>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>Ana Martínez</p>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill="#ffc107" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#999', marginLeft: 'auto' }}>Hace 2 semanas</span>
                </div>
                <p style={{ fontSize: '0.95rem', color: '#555', margin: 0, lineHeight: '1.6' }}>Increíble！ No pude dejar de leerlo. La trama es original y los personajes están muy bien desarrollados. Definitivamente compraré más libros de este autor.</p>
              </div>
            </div>
          </div>

          {/* Características */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: '#2c2c2c' }}>Características</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '0.85rem', color: '#999', margin: '0 0 4px 0' }}>Autor</p>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>{libroSeleccionado.autor_libro || libroSeleccionado.autor || 'N/A'}</p>
              </div>
              <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '0.85rem', color: '#999', margin: '0 0 4px 0' }}>Categoría</p>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>{libroSeleccionado.nombre_categoria || 'N/A'}</p>
              </div>
              <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '0.85rem', color: '#999', margin: '0 0 4px 0' }}>Stock</p>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: libroSeleccionado.stock > 0 ? '#4caf50' : '#e53935', margin: 0 }}>{libroSeleccionado.stock > 0 ? `${libroSeleccionado.stock} disponibles` : 'Agotado'}</p>
              </div>
              <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '0.85rem', color: '#999', margin: '0 0 4px 0' }}>Tienda</p>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>{libroSeleccionado.nombre_tienda || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Preguntas frecuentes */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: '#2c2c2c' }}>Preguntas frecuentes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: '0 0 8px 0' }}>¿Cuál es el estado del libro?</p>
                <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>Todos los libros en nuestro catálogo son nuevos o en excelente estado， garantizando su calidad.</p>
              </div>
              <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: '0 0 8px 0' }}>¿Cuánto tiempo tarda el envío?</p>
                <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>El tiempo de envío varía según la ubicación. Generalmente entre 2-5 días hábiles.</p>
              </div>
              <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#2c2c2c', margin: '0 0 8px 0' }}>¿Tienen garantía de devolución?</p>
                <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>Sí， ofrecemos garantía de devolución de 15 días si el producto no cumple con sus expectativas.</p>
              </div>
            </div>
          </div>

          {/* Información del autor */}
          <div style={{ marginBottom: '32px', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: '#2c2c2c' }}>Sobre el autor</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '700', color: '#8b0000', flexShrink: 0 }}>
                {(libroSeleccionado.autor_libro || libroSeleccionado.autor || 'A')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2c2c2c', margin: '0 0 8px 0' }}>{libroSeleccionado.autor_libro || libroSeleccionado.autor || 'Autor destacado'}</p>
                <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.6', margin: 0 }}>Autor reconocido en el género de {libroSeleccionado.nombre_categoria || 'ficción'} con múltiples best-sellers. Sus obras han sido traducidas a varios idiomas y han recibido premios literarios internacionales. Conocido por su estilo narrativo único y personajes memorables que cautivan a lectores de todas las edades.</p>
              </div>
            </div>
          </div>

          {/* Información de envío */}
          <div style={{ marginBottom: '32px', padding: '24px', background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: '#2c2c2c' }}>Información de envío</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>Envío gratis</p>
                  <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>En compras mayores a $50.000</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>Entrega rápida</p>
                  <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>2-5 días hábiles</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c2c2c', margin: 0 }}>Pago seguro</p>
                  <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>100% protegido</p>
                </div>
              </div>
            </div>
          </div>

          {/* Libros relacionados */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: '#2c2c2c' }}>Libros relacionados</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {libros.slice(0, 4).map((libro) => (
                <div 
                  key={libro.id_libro}
                  onClick={() => handleVerDetalles(libro)}
                  style={{ 
                    cursor: 'pointer',
                    padding: '16px', 
                    background: 'white', 
                    borderRadius: '12px', 
                    border: '1px solid #e0e0e0',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img
                    src={libro.imagen_url || libro.imagen_principal || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'}
                    alt={libro.titulo}
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                  />
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c2c2c', margin: '0 0 4px 0', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{libro.titulo}</p>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>{libro.autor_libro || libro.autor || 'Autor'}</p>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#8b0000', margin: '8px 0 0' }}>${Number(libro.precio_libro || libro.precio || 0).toLocaleString('es-CO')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : libros.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: '#faf8f6',
          borderRadius: '12px',
          color: '#999'
        }}>
          <p>No se encontraron libros con los filtros seleccionados</p>
          <button
            onClick={() => handleFiltrosChange({
              q: '',
              categoria_id: null,
              precio_min: 0,
              precio_max: 1000000,
              calificacion_min: 0,
              disponible: true,
              ordenar_por: 'relevancia'
            })}
            style={{
              background: 'var(--vinotinto)',
              color: 'white',
              border: 'none',
              padding: '0.7rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="catalogo-grid">
            {libros.map((libro) => (
              <LibroCard
                key={libro.id_libro}
                libro={libro}
                onVerDetalles={handleVerDetalles}
              />
            ))}
          </div>

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="paginacion">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}
                className="btn-paginacion"
              >
                ← Anterior
              </button>
              <span className="pagina-info">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(pagina + 1)}
                className="btn-paginacion"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Catalogo;