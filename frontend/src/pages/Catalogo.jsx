import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api, { addToCart, removeFromCart, getCarrito, getApiBaseUrl, usuarioPuedeCalificarTienda, crearCalificacionTienda, getCalificacionesTienda, actualizarCalificacionTienda } from '../services/api';
import { notify } from '../components/ToastProvider';
import LibroCard from '../components/LibroCard';
import ResenaLibro from '../components/ResenaLibro';

const categoriaClase = (categoria = '') => {
  const texto = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (texto.includes('terror')) return 'categoria--terror';
  if (texto.includes('ciencia') || texto.includes('cientifica')) return 'categoria--ciencia';
  if (texto.includes('romance')) return 'categoria--romance';
  if (texto.includes('fantasia')) return 'categoria--fantasia';
  if (texto.includes('historia')) return 'categoria--historia';
  if (texto.includes('tecnologia')) return 'categoria--tecnologia';
  if (texto.includes('juvenil')) return 'categoria--juvenil';
  if (texto.includes('infantil')) return 'categoria--infantil';
  if (texto.includes('aventura')) return 'categoria--aventura';
  if (texto.includes('arte')) return 'categoria--arte';
  if (texto.includes('biografia')) return 'categoria--biografia';
  if (texto.includes('educacion')) return 'categoria--educacion';
  return 'categoria--general';
};
import { chatService } from '../services/chat';
import '../styles/catalogo.css';

const resolveImagenUrl = (imagen) => {
  if (!imagen) return null;
  if (/^(https?:|data:|blob:)/i.test(imagen)) return imagen;
  return `${getApiBaseUrl()}${imagen.startsWith('/') ? '' : '/'}${imagen}`;
};

const obtenerIdUsuarioActual = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    return Number(JSON.parse(atob(token.split('.')[1])).sub) || null;
  } catch {
    return null;
  }
};

const CatalogoLoading = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '1.5rem 0' }} aria-hidden="true">
    <div style={{ width: '38%', height: '22px', borderRadius: '8px', background: '#eee7e1' }} />
    <div style={{ width: '100%', height: '180px', borderRadius: '12px', background: '#f5f1ed' }} />
    <div style={{ width: '68%', height: '16px', borderRadius: '8px', background: '#eee7e1' }} />
  </div>
);

const Catalogo = ({ libroInicial = null, onLibroInicialConsumido }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalLibros, setTotalLibros] = useState(0);
  const [addingId, setAddingId] = useState(null);
  const [addedToCartIds, setAddedToCartIds] = useState(new Set());
  const [libroSeleccionado, setLibroSeleccionado] = useState(null);
  const [imagenActiva, setImagenActiva] = useState(null);
  const [zoomActivo, setZoomActivo] = useState(false);
  const [zoomPosicion, setZoomPosicion] = useState({ x: 50, y: 50 });
  const [mostrarDetalles, setMostrarDetalles] = useState(() => !!searchParams.get('libro'));
  const [contactando, setContactando] = useState(false);
  const [mostrarCalificacionTienda, setMostrarCalificacionTienda] = useState(false);
  const [puedeCalificar, setPuedeCalificar] = useState(false);
  const [calificacionEnviada, setCalificacionEnviada] = useState(false);
  const [calificacionExistente, setCalificacionExistente] = useState(null);
  const [calificacionesTienda, setCalificacionesTienda] = useState([]);
  const [filtroOpinionesTienda, setFiltroOpinionesTienda] = useState('todas');
  const [paginaOpinionesTienda, setPaginaOpinionesTienda] = useState(1);
  const [calificacionForm, setCalificacionForm] = useState({ calificacion: 5, comentario: '' });
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false);
  const ultimaBusquedaRef = React.useRef(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener('darkModeChange', handler); window.removeEventListener('storage', handler); };
  }, []);

  // Colores reutilizables
  const dm = {
    sectionBg:    darkMode ? '#1e1e1e' : '#faf8f6',
    cardBg:       darkMode ? '#252525' : 'white',
    cardBorder:   darkMode ? '#333' : '#e0e0e0',
    textPrimary:  darkMode ? '#ececec' : '#2c2c2c',
    textSecondary:darkMode ? '#c8c8c8' : '#555',
    textMuted:    darkMode ? '#999' : '#666',
    inputBorder:  darkMode ? '#3a3a3a' : '#ddd',
    inputBg:      darkMode ? '#2a2a2a' : 'white',
    inputColor:   darkMode ? '#ececec' : 'inherit',
  };

  const [filtros, setFiltros] = useState({
    q: searchParams.get('q') || '',
    nombre_tienda: searchParams.get('nombre_tienda') || '',
    correo_vendedor: searchParams.get('correo_vendedor') || '',
    categoria_id: null,
    precio_min: 0,
    precio_max: 1000000,
    calificacion_min: 0,
    disponible: true,
    ordenar_por: 'relevancia',
    categoria_nombre: searchParams.get('categoria') || null
  });

  // Actualizar filtros cuando cambian los searchParams (ignorar cambio de ?libro=)
  const prevFiltroParams = React.useRef('');
  useEffect(() => {
    // Construir una clave solo con los params de filtro (ignorando ?libro=)
    const filtroKey = [
      searchParams.get('q') || '',
      searchParams.get('nombre_tienda') || '',
      searchParams.get('correo_vendedor') || '',
      searchParams.get('categoria_id') || '',
      searchParams.get('precio_min') || '',
      searchParams.get('precio_max') || '',
      searchParams.get('calificacion_min') || '',
      searchParams.get('disponible') || '',
      searchParams.get('ordenar_por') || '',
      searchParams.get('categoria') || '',
    ].join('|');

    if (filtroKey === prevFiltroParams.current) return;
    prevFiltroParams.current = filtroKey;

    setFiltros({
      q: searchParams.get('q') || '',
      nombre_tienda: searchParams.get('nombre_tienda') || '',
      correo_vendedor: searchParams.get('correo_vendedor') || '',
      categoria_id: searchParams.get('categoria_id') ? parseInt(searchParams.get('categoria_id')) : null,
      precio_min: searchParams.get('precio_min') ? parseInt(searchParams.get('precio_min')) : 0,
      precio_max: searchParams.get('precio_max') ? parseInt(searchParams.get('precio_max')) : 1000000,
      calificacion_min: searchParams.get('calificacion_min') ? parseInt(searchParams.get('calificacion_min')) : 0,
      disponible: searchParams.get('disponible') === 'true',
      ordenar_por: searchParams.get('ordenar_por') || 'relevancia',
      categoria_nombre: searchParams.get('categoria') || null
    });
    setPagina(1); // Resetear a la primera página cuando cambian los filtros
  }, [searchParams]);

  // Fetch del detalle del libro cuando cambia la URL ?libro=ID, incluso sin recargar la página.
  useEffect(() => {
    const libroId = searchParams.get('libro');
    if (!libroId) return;

    api.get(`/catalogo/libro/${libroId}`)
      .then(res => {
        if (res.data) {
          setLibroSeleccionado(res.data);
          setImagenActiva(null);
          setZoomActivo(false);
          setMostrarDetalles(true);
        }
      })
      .catch(() => {
        setMostrarDetalles(false);
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete('libro');
          return next;
        }, { replace: true });
      });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!libroInicial) return;
    setLibroSeleccionado(libroInicial);
    setImagenActiva(null);
    setMostrarDetalles(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onLibroInicialConsumido?.();
  }, [libroInicial, onLibroInicialConsumido]);

  useEffect(() => {
    ultimaBusquedaRef.current = null;
  }, [searchParams]);

  const cargarLibros = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.q) params.append('q', filtros.q);
      if (filtros.nombre_tienda) params.append('nombre_tienda', filtros.nombre_tienda);
      if (filtros.correo_vendedor) params.append('correo_vendedor', filtros.correo_vendedor);
      if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
      if (filtros.categoria_nombre && !filtros.categoria_id) params.append('categoria', filtros.categoria_nombre);
      if (filtros.precio_min) params.append('precio_min', filtros.precio_min);
      if (filtros.precio_max) params.append('precio_max', filtros.precio_max);
      if (filtros.calificacion_min) params.append('calificacion_min', filtros.calificacion_min);
      if (filtros.disponible) params.append('disponible', 'true');
      params.append('ordenar_por', filtros.ordenar_por);
      params.append('pagina', pagina);
      params.append('limite', 24);

      const claveBusqueda = params.toString();
      if (ultimaBusquedaRef.current === claveBusqueda) return;
      ultimaBusquedaRef.current = claveBusqueda;
      setLoading(true);

      const response = await api.get(`/catalogo/busqueda-avanzada?${params}`);
      setLibros(response.data.libros || []);
      setTotalPaginas(response.data.total_paginas || 1);
      setTotalLibros(response.data.total || 0);
      setPagina(response.data.pagina || 1);
    } catch (error) {
      ultimaBusquedaRef.current = null;
      console.error('Error al cargar catálogo:', error);
    } finally {
      setLoading(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    cargarLibros();
  }, [cargarLibros]);
  
  // Registrar impresiones de libros impulsados visibles
  useEffect(() => {
    if (!libros || libros.length === 0) return;
    
    const impulsados = libros.filter(l => l.id_impulso && l.es_impulsado);
    if (impulsados.length === 0) return;
    
    // Registrar impresión una sola vez por cada libro impulsado visible
    const registradas = new Set();
    impulsados.forEach(libro => {
      if (!registradas.has(libro.id_impulso)) {
        api.post(`/impulsos/${libro.id_impulso}/impresion`).catch(() => {});
        registradas.add(libro.id_impulso);
      }
    });
  }, [libros]);

  // Sincronizar addedToCartIds con el carrito del backend al montar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    getCarrito()
      .then(res => {
        const items = res.data || [];
        if (items.length > 0) {
          setAddedToCartIds(new Set(items.map(i => i.id_libro)));
        }
      })
      .catch(() => {});
  }, []);

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
        id_tienda: libro.id_tienda || null,
        nombre_tienda: libro.nombre_tienda || '',
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

  const handleComprarAhora = (libro) => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('Debes iniciar sesión para comprar', 'error');
      navigate('/login');
      return;
    }
    if (libro.stock === 0) {
      notify('Este libro se encuentra agotado', 'error');
      return;
    }

    // NO creamos orden aquí. Solo navegamos al carrito con los datos del libro
    // en el state. La orden se crea únicamente cuando el usuario confirme el pago.
    navigate('/?seccion=Carrito', {
      state: {
        buyNow: {
          id_libro: libro.id_libro,
          cantidad: 1,
          precio_libro: Number(libro.precio_libro ?? libro.precio ?? 0),
          titulo: libro.titulo,
          autor_libro: libro.autor_libro || libro.autor || '',
          imagen: libro.imagen_url || libro.imagen_principal || null,
          tipo_entrega: 'domicilio'
        }
      }
    });
  };
  const handleVerDetalles = (libro) => {
    // Registrar clic si el libro tiene impulso activo
    if (libro.id_impulso) {
      api.post(`/impulsos/${libro.id_impulso}/clic`).catch(() => {});
    }
    
    setLibroSeleccionado(libro);
    setImagenActiva(null);
    setZoomActivo(false);
    setMostrarDetalles(true);
    // Sincronizar con la URL para que el reload funcione
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('libro', libro.id_libro);
      return next;
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setImagenActiva(null);
    setZoomActivo(false);
  }, [libroSeleccionado?.id_libro]);

  const handleVolverCatalogo = () => {
    setMostrarDetalles(false);
    setLibroSeleccionado(null);
    // Limpiar el param ?libro= de la URL
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('libro');
      return next;
    }, { replace: true });
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
      navigate(`/?seccion=Mensajes&sala=${idSala}`);
    } catch (error) {
      console.error('Error al crear sala de chat:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'No se pudo iniciar el chat. Intenta nuevamente.';
      notify(errorMsg, 'error');
    } finally {
      setContactando(false);
    }
  };

  const handleEnviarCalificacion = async () => {
    if (!libroSeleccionado?.id_tienda) return;

    setEnviandoCalificacion(true);
    try {
      if (calificacionExistente) {
        // Actualizar calificación existente
        await actualizarCalificacionTienda(calificacionExistente.id_calificacion, {
          id_tienda: libroSeleccionado.id_tienda,
          calificacion: calificacionForm.calificacion,
          comentario: calificacionForm.comentario
        });
        notify('¡Calificación actualizada!', 'success');
        
        // Actualizar la calificación existente con los nuevos datos
        setCalificacionExistente({
          ...calificacionExistente,
          calificacion: calificacionForm.calificacion,
          comentario: calificacionForm.comentario
        });
      } else {
        // Crear nueva calificación
        const response = await crearCalificacionTienda({
          id_tienda: libroSeleccionado.id_tienda,
          calificacion: calificacionForm.calificacion,
          comentario: calificacionForm.comentario
        });
        notify('¡Gracias por calificar la tienda!', 'success');
        
        // Crear el objeto de calificación existente con los datos del servidor o simulados
        setCalificacionExistente({
          id_calificacion: response.data?.id_calificacion || Date.now(), // ID del servidor o temporal
          calificacion: calificacionForm.calificacion,
          comentario: calificacionForm.comentario,
          fecha_calificacion: new Date().toISOString()
        });
      }
      
      setCalificacionEnviada(true);
      setMostrarCalificacionTienda(false);
      const calificacionesActualizadas = await getCalificacionesTienda(libroSeleccionado.id_tienda);
      setCalificacionesTienda(calificacionesActualizadas.data?.calificaciones || []);
      // NO cambiar puedeCalificar para que siga mostrando la sección
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'No se pudo enviar la calificación';
      notify(errorMsg, 'error');
    } finally {
      setEnviandoCalificacion(false);
    }
  };

  // Verificar si el usuario puede calificar cuando se selecciona un libro
  useEffect(() => {
    if (!libroSeleccionado?.id_tienda) return;
    
    const verificarPermiso = async () => {
      try {
        const calificacionesResponse = await getCalificacionesTienda(libroSeleccionado.id_tienda);
        setCalificacionesTienda(calificacionesResponse.data?.calificaciones || []);
      } catch (error) {
        console.error('Error cargando opiniones de la tienda:', error);
        setCalificacionesTienda([]);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setPuedeCalificar(false);
        setCalificacionEnviada(false);
        setCalificacionExistente(null);
        return;
      }

      try {
        const response = await usuarioPuedeCalificarTienda(libroSeleccionado.id_tienda);
        setPuedeCalificar(response.data?.puede_calificar || false);
        
        // Si ya calificó, cargar su calificación existente
        if (response.data?.ya_califico) {
          // Cargar las calificaciones de la tienda para encontrar la del usuario
          const calificacionesResponse = await getCalificacionesTienda(libroSeleccionado.id_tienda);
          const tokenDecoded = JSON.parse(atob(token.split('.')[1]));
          const userId = parseInt(tokenDecoded.sub); // Convertir a número
          const miCalificacion = calificacionesResponse.data.calificaciones?.find(c => {
            return c.id_usuario === userId;
          });
          if (miCalificacion) {
            setCalificacionExistente(miCalificacion);
            setCalificacionForm({
              calificacion: miCalificacion.calificacion,
              comentario: miCalificacion.comentario
            });
            setCalificacionEnviada(true);
          }
        } else {
          setCalificacionEnviada(false);
          setCalificacionExistente(null);
          setCalificacionForm({ calificacion: 5, comentario: '' });
        }
      } catch (error) {
        console.error('Error verificando permiso:', error);
        setPuedeCalificar(false);
        setCalificacionEnviada(false);
      }
    };

    verificarPermiso();
  }, [libroSeleccionado?.id_tienda]);

  const librosRelacionados = libros.filter((libro) => libro.id_libro !== libroSeleccionado?.id_libro);
  const opinionesFiltradas = calificacionesTienda.filter((opinion) => (
    filtroOpinionesTienda === 'todas' || Number(opinion.calificacion) === Number(filtroOpinionesTienda)
  ));
  const opinionesPorPagina = 8;
  const totalPaginasOpiniones = Math.max(1, Math.ceil(opinionesFiltradas.length / opinionesPorPagina));
  const opinionesVisibles = opinionesFiltradas.slice(
    (paginaOpinionesTienda - 1) * opinionesPorPagina,
    paginaOpinionesTienda * opinionesPorPagina
  );
  const librosRelacionadosRef = React.useRef(null);
  const librosRelacionadosTrackRef = React.useRef(null);
  const librosRelacionadosOffsetRef = React.useRef(0);
  const librosRelacionadosLoopRef = React.useRef(0);

  useEffect(() => {
    setPaginaOpinionesTienda(1);
  }, [libroSeleccionado?.id_tienda, filtroOpinionesTienda]);

  useEffect(() => {
    if (librosRelacionados.length <= 1) return undefined;

    const medirCarrusel = () => {
      if (librosRelacionadosTrackRef.current) {
        librosRelacionadosLoopRef.current = librosRelacionadosTrackRef.current.scrollWidth / 2;
      }
    };

    medirCarrusel();
    window.addEventListener('resize', medirCarrusel);

    let frameId;
    let previousTime;
    const animar = (time) => {
      const track = librosRelacionadosTrackRef.current;
      const loopWidth = librosRelacionadosLoopRef.current;
      if (track && loopWidth > 0) {
        const elapsed = previousTime ? time - previousTime : 0;
        librosRelacionadosOffsetRef.current += (elapsed / 1000) * 28;
        if (librosRelacionadosOffsetRef.current >= loopWidth) {
          librosRelacionadosOffsetRef.current -= loopWidth;
        }
        track.style.transform = `translate3d(${-librosRelacionadosOffsetRef.current}px, 0, 0)`;
      }
      previousTime = time;
      frameId = window.requestAnimationFrame(animar);
    };

    frameId = window.requestAnimationFrame(animar);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', medirCarrusel);
    };
  }, [librosRelacionados.length]);

  const desplazarRelacionados = (direccion) => {
    const track = librosRelacionadosTrackRef.current;
    const loopWidth = librosRelacionadosLoopRef.current;
    if (!track || !loopWidth) return;
    const paso = (track.firstElementChild?.getBoundingClientRect().width || 220) + 16;
    librosRelacionadosOffsetRef.current += direccion * paso;
    if (librosRelacionadosOffsetRef.current < 0) librosRelacionadosOffsetRef.current += loopWidth;
    if (librosRelacionadosOffsetRef.current >= loopWidth) librosRelacionadosOffsetRef.current -= loopWidth;
    track.style.transform = `translate3d(${-librosRelacionadosOffsetRef.current}px, 0, 0)`;
  };

  return (
    <main className={`layout-container catalogo-main${mostrarDetalles ? ' catalogo-main--detail' : ''}`}>
      <h1 className="catalogo-heading" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        {mostrarDetalles ? 'Detalle del libro' : 'Catálogo de libros'}
      </h1>

      {/* RESULTADOS */}
      {loading || (mostrarDetalles && !libroSeleccionado) ? (
        <CatalogoLoading />
      ) : mostrarDetalles && libroSeleccionado ? (
        <div className="detalle-libro-inline">
          <button
            className="detalle-back-button"
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

          <div className="detalle-hero" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(360px, 400px) 1fr',
            gap: '36px',
            marginBottom: '32px',
            alignItems: 'stretch'
          }}>
            <div className="detalle-gallery">
              <div
                className={`detalle-cover ${zoomActivo ? 'detalle-cover--zoom' : ''}`}
                onMouseEnter={() => setZoomActivo(true)}
                onMouseLeave={() => setZoomActivo(false)}
                onMouseMove={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setZoomPosicion({
                    x: ((event.clientX - bounds.left) / bounds.width) * 100,
                    y: ((event.clientY - bounds.top) / bounds.height) * 100,
                  });
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '380px',
                  maxHeight: '440px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  background: '#f8f5f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <img
                  className="detalle-gallery-image"
                  src={resolveImagenUrl(imagenActiva || libroSeleccionado.imagen_url || libroSeleccionado.imagen_principal || libroSeleccionado.imagen) || (libroSeleccionado.isbn ? `https://books.google.com/books/content?vid=ISBN${libroSeleccionado.isbn}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api` : 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80')}
                  alt={libroSeleccionado.titulo}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transform: zoomActivo ? 'scale(2.1)' : 'scale(1)',
                    transformOrigin: `${zoomPosicion.x}% ${zoomPosicion.y}%`,
                    transition: zoomActivo ? 'transform 0.12s ease-out' : 'transform 0.2s ease-out',
                  }}
                  onError={(e) => {
                    const t = e.target;
                    const isbn = libroSeleccionado.isbn || '';
                    const gbUrl = isbn ? `https://books.google.com/books/content?vid=ISBN${isbn}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api` : null;
                    if (gbUrl && t.src !== gbUrl) { t.src = gbUrl; return; }
                    t.src = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';
                  }}
                />
                {zoomActivo && <span className="detalle-zoom-hint">Mueve el cursor para explorar</span>}
              </div>
              {(() => {
                const imagenes = Array.isArray(libroSeleccionado.imagenes)
                  ? libroSeleccionado.imagenes
                  : typeof libroSeleccionado.imagenes === 'string'
                    ? libroSeleccionado.imagenes.split(',')
                    : [];
                const imagenesGaleria = imagenes.filter(Boolean);
                return imagenesGaleria.length > 1 ? (
                  <div className="detalle-thumbnails" aria-label="Galería de imágenes del libro">
                    {imagenesGaleria.map((imagen, index) => (
                      <button
                        key={`${imagen}-${index}`}
                        type="button"
                        className={`detalle-thumbnail ${imagen === (imagenActiva || imagenesGaleria[0]) ? 'detalle-thumbnail--active' : ''}`}
                        onClick={() => {
                          setImagenActiva(imagen);
                          setZoomActivo(false);
                        }}
                        aria-label={`Ver imagen ${index + 1}`}
                      >
                        <img src={resolveImagenUrl(imagen)} alt="" />
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
            <div className="detalle-summary">
              <div className="detalle-summary-left">
              {libroSeleccionado.nombre_categoria && (
                <span className={`categoria-badge ${categoriaClase(libroSeleccionado.nombre_categoria)}`} style={{ marginBottom: '12px' }}>
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
                <span style={{ fontSize: '0.85rem', color: '#999' }}>• {Number(libroSeleccionado.total_resenas || 0)} reseñas</span>
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

              <p className="detalle-price">${Number(libroSeleccionado.precio_libro || libroSeleccionado.precio || 0).toLocaleString('es-CO')}</p>
              </div>

              <div className="detalle-price-and-info">
                <div className="detalle-purchase-info" aria-label="Información de compra">
                  <div className="detalle-purchase-info__item">
                    <span className="detalle-purchase-info__icon">✓</span>
                    <div>
                      <strong>{Number(libroSeleccionado.stock || 0) > 0 ? `En stock: ${libroSeleccionado.stock} disponibles` : 'Agotado'}</strong>
                      <span>Disponibilidad actual</span>
                    </div>
                  </div>
                  <div className="detalle-purchase-info__item">
                    <span className="detalle-purchase-info__icon">↗</span>
                    <div>
                      <strong>Despacho en {libroSeleccionado.tiempo_despacho_dias || 2} días hábiles</strong>
                      <span>{libroSeleccionado.politica_envios || 'Envío gestionado por la librería'}</span>
                    </div>
                  </div>
                  <div className="detalle-purchase-info__item">
                    <span className="detalle-purchase-info__icon">$</span>
                    <div>
                      <strong>{Number(libroSeleccionado.costo_envio_tienda || 0) > 0
                        ? `Envío: $${Number(libroSeleccionado.costo_envio_tienda).toLocaleString('es-CO')}`
                        : 'Envío gratis'}</strong>
                      <span>Tarifa definida por la tienda</span>
                    </div>
                  </div>
                  <div className="detalle-purchase-info__item">
                    <span className="detalle-purchase-info__icon">↺</span>
                    <div>
                      <strong>Pago seguro en BookyHome</strong>
                      <span>{libroSeleccionado.politica_devoluciones || 'Consulta la política de devoluciones con la librería'}</span>
                    </div>
                  </div>
                </div>
              </div>

                <div className="detalle-hero-actions">
                {/* Botón Comprar ahora */}
                <button
                  className="detalle-primary-action"
                  onClick={() => handleComprarAhora(libroSeleccionado)}
                  disabled={libroSeleccionado.stock === 0}
                  style={{
                    flex: '1 1 170px',
                    minWidth: '160px',
                    background: 'linear-gradient(135deg, var(--vinotinto, #7A1E3A) 0%, #9B2449 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 22px',
                    borderRadius: '8px',
                    cursor: libroSeleccionado.stock === 0 ? 'not-allowed' : 'pointer',
                    opacity: libroSeleccionado.stock === 0 ? 0.65 : 1,
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(122, 30, 58, 0.28)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (libroSeleccionado.stock !== 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(122, 30, 58, 0.38)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(122, 30, 58, 0.28)';
                  }}
                >
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    {libroSeleccionado.stock === 0 ? 'Sin stock' : 'Comprar ahora'}
                  </>
                </button>

                {/* Botón Agregar al carrito */}
                <button
                  className="detalle-cart-action"
                  onClick={() => addedToCartIds.has(libroSeleccionado.id_libro) ? handleRemoveFromCart(libroSeleccionado) : handleAddToCart(libroSeleccionado)}
                  disabled={addingId === libroSeleccionado.id_libro || libroSeleccionado.stock === 0}
                  style={{
                    flex: '1 1 170px',
                    minWidth: '160px',
                    background: addedToCartIds.has(libroSeleccionado.id_libro) ? '#fee2e2' : '#fdf2f4',
                    color: addedToCartIds.has(libroSeleccionado.id_libro) ? '#dc2626' : 'var(--vinotinto, #7A1E3A)',
                    border: `2px solid ${addedToCartIds.has(libroSeleccionado.id_libro) ? '#dc2626' : 'var(--vinotinto, #7A1E3A)'}`,
                    padding: '16px 22px',
                    borderRadius: '8px',
                    cursor: addingId === libroSeleccionado.id_libro || libroSeleccionado.stock === 0 ? 'not-allowed' : 'pointer',
                    opacity: addingId === libroSeleccionado.id_libro || libroSeleccionado.stock === 0 ? 0.65 : 1,
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (addingId !== libroSeleccionado.id_libro && libroSeleccionado.stock !== 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {libroSeleccionado.stock === 0 ? 'Sin stock' : addingId === libroSeleccionado.id_libro ? 'Procesando…' : addedToCartIds.has(libroSeleccionado.id_libro) ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Eliminar de carrito
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      Agregar al carrito
                    </>
                  )}
                </button>

                {/* Botón Contactar librería */}
                <button
                  className="detalle-contact-action"
                  onClick={handleContactar}
                  disabled={contactando}
                  style={{
                    flex: '1 1 170px',
                    minWidth: '160px',
                    background: 'white',
                    color: '#4b5563',
                    border: '2px solid #d1d5db',
                    padding: '16px 22px',
                    borderRadius: '8px',
                    cursor: contactando ? 'not-allowed' : 'pointer',
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: contactando ? 0.65 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!contactando) {
                      e.currentTarget.style.borderColor = 'var(--vinotinto, #7A1E3A)';
                      e.currentTarget.style.color = 'var(--vinotinto, #7A1E3A)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.color = '#4b5563';
                    e.currentTarget.style.transform = 'translateY(0)';
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
          <div className="detalle-content-section detalle-description-section" style={{ marginBottom: '32px', padding: '24px', background: dm.sectionBg, borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: dm.textPrimary }}>Descripción del producto</h3>
            {libroSeleccionado.descripcion_libro ? (
              <p style={{ fontSize: '1rem', color: dm.textSecondary, lineHeight: '1.8', margin: 0 }}>{libroSeleccionado.descripcion_libro}</p>
            ) : (
              <div style={{ fontSize: '1rem', color: dm.textSecondary, lineHeight: '1.8' }}>
                <p style={{ margin: '0 0 12px 0' }}>Este libro es una excelente adición a tu colección. Escrito por {libroSeleccionado.autor_libro || libroSeleccionado.autor || 'un autor reconocido'}, ofrece una narrativa cautivadora que te mantendrá enganchado desde la primera página hasta la última.</p>
                <p style={{ margin: '0 0 12px 0' }}>Formato: Tapa blanda | Páginas: {Math.floor(Math.random() * 200) + 200} | Idioma: Español | Editorial: {libroSeleccionado.nombre_tienda || 'Editorial destacada'}</p>
                <p style={{ margin: '0 0 12px 0' }}>Dimensiones: 15cm x 23cm x 2cm | Peso: {Math.floor(Math.random() * 300) + 200}g | ISBN: {Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
                <p style={{ margin: 0 }}>Ideal para lectores que disfrutan del género de {libroSeleccionado.nombre_categoria || 'ficción'} y buscan una experiencia de lectura enriquecedora y entretenida.</p>
              </div>
            )}
          </div>

          {libroSeleccionado.id_tienda && (puedeCalificar || calificacionEnviada || calificacionExistente) && (
            <div style={{ marginBottom: '32px', padding: '24px', background: dm.sectionBg, borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: dm.textPrimary }}>Opiniones de la tienda</h3>
              {libroSeleccionado.calificacion_tienda > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} width="20" height="20" viewBox="0 0 24 24" fill={star <= Math.round(libroSeleccionado.calificacion_tienda) ? '#ffc107' : (darkMode ? '#444' : '#e0e0e0')} stroke="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <span style={{ fontSize: '1rem', color: dm.textMuted, fontWeight: '600' }}>{libroSeleccionado.calificacion_tienda.toFixed(1)}</span>
                  {libroSeleccionado.total_opiniones_tienda > 0 && (
                    <span style={{ fontSize: '0.9rem', color: dm.textMuted }}>({libroSeleccionado.total_opiniones_tienda} {libroSeleccionado.total_opiniones_tienda === 1 ? 'opinión' : 'opiniones'})</span>
                  )}
                </div>
              )}
              {(calificacionEnviada || calificacionExistente) && !mostrarCalificacionTienda ? (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ padding: '14px 16px', background: dm.cardBg, border: `1px solid ${dm.cardBorder}`, borderRadius: '8px' }}>
                    <strong style={{ color: dm.textPrimary, fontSize: '0.9rem' }}>Tu opinión</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= (calificacionExistente?.calificacion || calificacionForm.calificacion) ? '#ffc107' : (darkMode ? '#444' : '#e0e0e0')} stroke="none">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                      <span style={{ color: dm.textMuted, fontSize: '0.85rem' }}>{calificacionExistente?.calificacion || calificacionForm.calificacion}/5</span>
                    </div>
                    {(calificacionExistente?.comentario || calificacionForm.comentario) && (
                      <p style={{ margin: '8px 0 0', color: dm.textSecondary, fontSize: '0.9rem', lineHeight: '1.5' }}>
                        “{calificacionExistente?.comentario || calificacionForm.comentario}”
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => { setCalificacionEnviada(false); setMostrarCalificacionTienda(true); if (calificacionExistente) setCalificacionForm({ calificacion: calificacionExistente.calificacion, comentario: calificacionExistente.comentario }); }}
                    style={{ background: dm.cardBg, color: dm.textPrimary, border: `1px solid ${dm.inputBorder}`, padding: '9px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                    Editar calificación
                  </button>
                  </div>
                </div>
              ) : (!mostrarCalificacionTienda && !calificacionExistente && !calificacionEnviada) ? (
                <button onClick={() => setMostrarCalificacionTienda(true)} style={{ background: 'var(--vinotinto)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'all 0.2s ease' }}>
                  Calificar esta tienda
                </button>
              ) : mostrarCalificacionTienda ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: dm.textPrimary, marginBottom: '8px' }}>Tu calificación:</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setCalificacionForm({ ...calificacionForm, calificacion: star })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill={star <= calificacionForm.calificacion ? '#ffc107' : (darkMode ? '#444' : '#e0e0e0')} stroke="none" style={{ transition: 'all 0.2s ease' }}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: dm.textPrimary, marginBottom: '8px' }}>Comentario (opcional):</label>
                    <textarea value={calificacionForm.comentario} onChange={(e) => setCalificacionForm({ ...calificacionForm, comentario: e.target.value })}
                      placeholder="Comparte tu experiencia con esta tienda..."
                      style={{ width: '100%', padding: '12px', border: `1px solid ${dm.inputBorder}`, borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px', background: dm.inputBg, color: dm.inputColor }}
                      maxLength={500} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleEnviarCalificacion} disabled={enviandoCalificacion} style={{ flex: 1, background: 'var(--vinotinto)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: enviandoCalificacion ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '600', opacity: enviandoCalificacion ? 0.65 : 1 }}>
                      {enviandoCalificacion ? 'Enviando...' : 'Enviar calificación'}
                    </button>
                    <button onClick={() => { setMostrarCalificacionTienda(false); setCalificacionForm({ calificacion: 5, comentario: '' }); }}
                      style={{ flex: 1, background: dm.cardBg, color: dm.textMuted, border: `2px solid ${dm.inputBorder}`, padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
              {calificacionesTienda.length > 0 && (
                <div style={{ marginTop: '24px', borderTop: `1px solid ${dm.cardBorder}`, paddingTop: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: dm.textPrimary, fontSize: '1rem' }}>Opiniones de clientes</h4>
                    <select value={filtroOpinionesTienda} onChange={(e) => setFiltroOpinionesTienda(e.target.value)}
                      aria-label="Filtrar opiniones por estrellas"
                      style={{ padding: '7px 10px', border: `1px solid ${dm.inputBorder}`, borderRadius: '7px', background: dm.cardBg, color: dm.textPrimary }}>
                      <option value="todas">Todas las estrellas</option>
                      {[5, 4, 3, 2, 1].map((estrellas) => <option key={estrellas} value={estrellas}>{estrellas} estrellas</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {opinionesVisibles.map((opinion) => (
                      <div key={opinion.id_calificacion} style={{ padding: '12px 14px', background: dm.cardBg, border: `1px solid ${dm.cardBorder}`, borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                          <strong style={{ color: dm.textPrimary, fontSize: '0.9rem' }}>{opinion.nombre_usuario}</strong>
                          <span style={{ color: dm.textMuted, fontSize: '0.8rem' }}>{opinion.calificacion}/5</span>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', margin: '5px 0' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} style={{ color: star <= opinion.calificacion ? '#ffc107' : dm.cardBorder }}>★</span>
                          ))}
                        </div>
                        {opinion.comentario && <p style={{ margin: 0, color: dm.textSecondary, fontSize: '0.88rem' }}>{opinion.comentario}</p>}
                      </div>
                    ))}
                  </div>
                  {opinionesFiltradas.length === 0 ? (
                    <p style={{ margin: '14px 0 0', color: dm.textMuted, textAlign: 'center' }}>No hay opiniones con ese filtro.</p>
                  ) : totalPaginasOpiniones > 1 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                      <button type="button" disabled={paginaOpinionesTienda === 1} onClick={() => setPaginaOpinionesTienda((pagina) => pagina - 1)}
                        style={{ padding: '7px 12px', border: `1px solid ${dm.inputBorder}`, borderRadius: '7px', background: dm.cardBg, color: dm.textPrimary, cursor: paginaOpinionesTienda === 1 ? 'not-allowed' : 'pointer', opacity: paginaOpinionesTienda === 1 ? 0.5 : 1 }}>
                        Anterior
                      </button>
                      <span style={{ color: dm.textMuted, fontSize: '0.85rem' }}>Página {paginaOpinionesTienda} de {totalPaginasOpiniones}</span>
                      <button type="button" disabled={paginaOpinionesTienda === totalPaginasOpiniones} onClick={() => setPaginaOpinionesTienda((pagina) => pagina + 1)}
                        style={{ padding: '7px 12px', border: `1px solid ${dm.inputBorder}`, borderRadius: '7px', background: dm.cardBg, color: dm.textPrimary, cursor: paginaOpinionesTienda === totalPaginasOpiniones ? 'not-allowed' : 'pointer', opacity: paginaOpinionesTienda === totalPaginasOpiniones ? 0.5 : 1 }}>
                        Siguiente
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Reseñas */}
          <div className="detalle-content-section detalle-reviews-section" style={{
            marginBottom: '32px',
            padding: '24px',
            background: dm.sectionBg,
            borderRadius: '12px',
            border: `1px solid ${dm.cardBorder}`,
            boxShadow: '0 6px 18px rgba(66, 32, 42, 0.05)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: dm.textPrimary }}>Reseñas del libro</h3>
            <ResenaLibro
              idLibro={libroSeleccionado.id_libro}
              idUsuario={obtenerIdUsuarioActual()}
            />
          </div>

          {/* Características */}
          <div className="detalle-content-section detalle-features-section" style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: dm.textPrimary }}>Características</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Autor', value: libroSeleccionado.autor_libro || libroSeleccionado.autor || 'N/A' },
                { label: 'Categoría', value: libroSeleccionado.nombre_categoria || 'N/A' },
                { label: 'Stock', value: libroSeleccionado.stock > 0 ? `${libroSeleccionado.stock} disponibles` : 'Agotado', valueColor: libroSeleccionado.stock > 0 ? (darkMode ? '#4ade80' : '#4caf50') : (darkMode ? '#f87171' : '#e53935') },
                { label: 'Tienda', value: libroSeleccionado.nombre_tienda || 'N/A' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px', background: dm.cardBg, borderRadius: '8px', border: `1px solid ${dm.cardBorder}` }}>
                  <p style={{ fontSize: '0.85rem', color: dm.textMuted, margin: '0 0 4px 0' }}>{item.label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: item.valueColor || dm.textPrimary, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="detalle-content-section detalle-faq-section" style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: dm.textPrimary }}>Preguntas frecuentes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { q: '¿Cuál es el estado del libro?', a: 'Todos los libros en nuestro catálogo son nuevos o en excelente estado, garantizando su calidad.' },
                { q: '¿Cuánto tiempo tarda el envío?', a: 'El tiempo de envío varía según la ubicación. Generalmente entre 2-5 días hábiles.' },
                { q: '¿Tienen garantía de devolución?', a: 'Sí, ofrecemos garantía de devolución de 15 días si el producto no cumple con sus expectativas.' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px', background: dm.cardBg, borderRadius: '8px', border: `1px solid ${dm.cardBorder}` }}>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: dm.textPrimary, margin: '0 0 8px 0' }}>{item.q}</p>
                  <p style={{ fontSize: '0.95rem', color: dm.textSecondary, margin: 0 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sobre el autor */}
          <div style={{ marginBottom: '32px', padding: '24px', background: dm.cardBg, borderRadius: '12px', border: `1px solid ${dm.cardBorder}` }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: dm.textPrimary }}>Sobre el autor</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: darkMode ? '#2a1a24' : 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '700', color: darkMode ? '#e05a7a' : '#8b0000', flexShrink: 0 }}>
                {(libroSeleccionado.autor_libro || libroSeleccionado.autor || 'A')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '1.2rem', fontWeight: '700', color: dm.textPrimary, margin: '0 0 8px 0' }}>{libroSeleccionado.autor_libro || libroSeleccionado.autor || 'Autor destacado'}</p>
                <p style={{ fontSize: '0.95rem', color: dm.textSecondary, lineHeight: '1.6', margin: 0 }}>Autor reconocido en el género de {libroSeleccionado.nombre_categoria || 'ficción'} con múltiples best-sellers. Sus obras han sido traducidas a varios idiomas y han recibido premios literarios internacionales.</p>
              </div>
            </div>
          </div>

          {/* Información de envío */}
          <div style={{ marginBottom: '32px', padding: '24px', background: darkMode ? '#0f2e18' : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', borderRadius: '12px', border: darkMode ? '1px solid #16a34a' : 'none' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: darkMode ? '#4ade80' : '#2c2c2c' }}>Información de envío</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { icon: 'truck', label: 'Envío gratis', sub: 'En compras mayores a $50.000' },
                { icon: 'clock', label: 'Entrega rápida', sub: '2-5 días hábiles' },
                { icon: 'shield', label: 'Pago seguro', sub: '100% protegido' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#4ade80' : '#4caf50'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon === 'truck' && <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>}
                    {item.icon === 'clock' && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                    {item.icon === 'shield' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                  </svg>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', color: darkMode ? '#ececec' : '#2c2c2c', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '0.8rem', color: darkMode ? '#999' : '#666', margin: 0 }}>{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Libros relacionados */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 16px 0', color: dm.textPrimary }}>Libros relacionados</h3>
            <div style={{ position: 'relative', padding: '0 44px' }}>
              <button type="button" aria-label="Ver libros relacionados anteriores" onClick={() => desplazarRelacionados(-1)} style={{ position: 'absolute', zIndex: 2, left: 0, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: `1px solid ${dm.cardBorder}`, background: dm.cardBg, color: dm.textPrimary, cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 3px 10px rgba(0,0,0,0.25)' }}>‹</button>
              <div ref={librosRelacionadosRef} style={{ overflow: 'hidden', padding: '2px 2px 12px' }}>
              <div ref={librosRelacionadosTrackRef} style={{ display: 'flex', gap: '16px', width: 'max-content', willChange: 'transform' }}>
                {[...librosRelacionados, ...librosRelacionados].map((libro, index) => (
                  <div key={`${libro.id_libro}-${index}`} style={{ flex: '0 0 220px' }}>
                    <LibroCard libro={libro} onVerDetalles={handleVerDetalles} />
                  </div>
                ))}
              </div>
              </div>
              <button type="button" aria-label="Ver más libros relacionados" onClick={() => desplazarRelacionados(1)} style={{ position: 'absolute', zIndex: 2, right: 0, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: `1px solid ${dm.cardBorder}`, background: dm.cardBg, color: dm.textPrimary, cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 3px 10px rgba(0,0,0,0.25)' }}>›</button>
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
            onClick={() => navigate('/?seccion=Catálogo')}
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
            <div className="catalogo-pagination">
              <div className="pagination-info">
                Mostrando <strong>{(pagina - 1) * 24 + 1}–{Math.min(pagina * 24, totalLibros)}</strong> de <strong>{totalLibros}</strong> {totalLibros === 1 ? 'libro' : 'libros'}
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn-nav"
                  disabled={pagina <= 1}
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                >
                  ‹ Anterior
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map((num) => {
                    if (num === 1 || num === totalPaginas || Math.abs(num - pagina) <= 1) {
                      return (
                        <button
                          key={num}
                          type="button"
                          className={`pagination-num-btn ${num === pagina ? 'active' : ''}`}
                          onClick={() => setPagina(num)}
                        >
                          {num}
                        </button>
                      );
                    } else if (
                      (num === 2 && pagina > 3) ||
                      (num === totalPaginas - 1 && pagina < totalPaginas - 2)
                    ) {
                      return <span key={num} className="pagination-ellipsis">…</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  className="pagination-btn-nav"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Catalogo;
