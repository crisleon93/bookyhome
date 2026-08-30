import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import logo2 from '../assets/logo2.png';
import {
  IconSearch,
  IconUser,
  IconUserPlus,
  IconLocationTopBar as IconLocation,
  IconClose,
  IconArrow,
  IconBookOpen,
  IconFavorites,
  IconCart,
  IconMenu,
  IconMail,
  IconLock,
  IconEyeOpen,
  IconEyeClosed,
  IconBell,
  IconTruck,
  IconMessage,
  IconFilter
} from './Icons';
import { login } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { notify } from './ToastProvider';
import Register from '../pages/Register';
import Libreria from '../pages/Libreria';
import ForgotPassword from '../pages/ForgotPassword';
import { notificacionesService } from '../services/notificaciones';
import { chatService } from '../services/chat';
import api from '../services/api';

function FiltrosHeader({ onApply, initialSearchTerm }) {
  const [filtros, setFiltros] = useState({
    busqueda: initialSearchTerm || '',
    nombre_tienda: '',
    correo_vendedor: '',
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

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('libros');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const cargarOpciones = async () => {
      try {
        const response = await api.get('/catalogo/filtros-disponibles');
        if (!mounted) return;
        
        setOpciones(response.data);
        
        // Solo inicializar una vez
        if (!initialized) {
          setFiltros(prev => ({
            ...prev,
            precio_max: response.data.precio_max,
            busqueda: initialSearchTerm || ''
          }));
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error cargando filtros:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarOpciones();
    return () => {
      mounted = false;
    };
  }, [initialSearchTerm, initialized]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const handleAplicar = () => {
    onApply(filtros);
  };

  const handleLimpiar = () => {
    const filtrosLimpios = {
      busqueda: '',
      nombre_tienda: '',
      correo_vendedor: '',
      categoria_id: null,
      precio_min: 0,
      precio_max: opciones.precio_max,
      calificacion_min: 0,
      disponible: true,
      ordenar_por: 'relevancia'
    };
    setFiltros(filtrosLimpios);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid #e5e0d8', borderTopColor: '#7A1E3A', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Cargando filtros...</p>
      </div>
    );
  }

  const filtrosAplicados = Object.entries(filtros).filter(([key, val]) => {
    if (key === 'disponible') return val !== true;
    if (key === 'ordenar_por') return val !== 'relevancia';
    if (key === 'precio_min') return val > opciones.precio_min;
    if (key === 'precio_max') return val < opciones.precio_max;
    if (key === 'calificacion_min') return val > 0;
    return val !== null && val !== '' && val !== 0;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Tabs de navegación */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '1.5rem',
        background: '#f8f6f4',
        padding: '4px',
        borderRadius: '10px'
      }}>
        <button
          onClick={() => setActiveTab('libros')}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            background: activeTab === 'libros' ? '#7A1E3A' : 'transparent',
            color: activeTab === 'libros' ? '#fff' : '#555',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
          Por Libros
        </button>
        <button
          onClick={() => setActiveTab('vendedores')}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            background: activeTab === 'vendedores' ? '#7A1E3A' : 'transparent',
            color: activeTab === 'vendedores' ? '#fff' : '#555',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4 8 4v14" />
            <path d="M17 21v-8.5a1.5 1.5 0 0 0-3 0V21" />
          </svg>
          Por Vendedores
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {activeTab === 'libros' ? (
          <>
            {/* BÚSQUEDA DE LIBROS */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#7A1E3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
                Búsqueda de Libros
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Título, autor, ISBN..."
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '2px solid #e8e4df',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: '#faf8f6'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7A1E3A';
                    e.target.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e8e4df';
                    e.target.style.background = '#faf8f6';
                  }}
                />
                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
            </div>

            {/* CATEGORÍA */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#7A1E3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                </svg>
                Categoría
              </label>
              <select
                value={filtros.categoria_id || ''}
                onChange={(e) => handleFiltroChange('categoria_id', e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e8e4df',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  backgroundColor: '#faf8f6',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7A1E3A';
                  e.target.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e8e4df';
                  e.target.style.background = '#faf8f6';
                }}
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
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#7A1E3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                Rango de Precio
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
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
                    placeholder="Mínimo"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e8e4df',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: '#faf8f6',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#7A1E3A';
                      e.target.style.background = '#fff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e4df';
                      e.target.style.background = '#faf8f6';
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#999', fontSize: '18px' }}>—</div>
                <div style={{ flex: 1 }}>
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
                    placeholder="Máximo"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e8e4df',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: '#faf8f6',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#7A1E3A';
                      e.target.style.background = '#fff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e4df';
                      e.target.style.background = '#faf8f6';
                    }}
                  />
                </div>
              </div>
              <div style={{ 
                marginTop: '8px', 
                padding: '8px 12px', 
                background: '#f8f6f4', 
                borderRadius: '6px',
                fontSize: '0.85rem', 
                color: '#666',
                textAlign: 'center',
                fontWeight: 500
              }}>
                Rango seleccionado: ${filtros.precio_min.toLocaleString('es-CO')} - ${filtros.precio_max.toLocaleString('es-CO')}
              </div>
            </div>

            {/* CALIFICACIÓN MÍNIMA */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#7A1E3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Calificación Mínima
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => handleFiltroChange('calificacion_min', i)}
                    style={{
                      padding: '10px 16px',
                      border: filtros.calificacion_min >= i ? '2px solid #7A1E3A' : '2px solid #e8e4df',
                      borderRadius: '8px',
                      background: filtros.calificacion_min >= i ? '#7A1E3A' : '#fff',
                      color: filtros.calificacion_min >= i ? '#fff' : '#555',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'inherit'
                    }}
                    title={i === 0 ? 'Todas' : `${i}+ estrellas`}
                  >
                    {i === 0 ? (
                      'Todas'
                    ) : (
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
            <div style={{ 
              padding: '16px', 
              background: '#f8f6f4', 
              borderRadius: '10px',
              border: '2px solid #e8e4df'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#2A2A2A', cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={filtros.disponible}
                  onChange={(e) => handleFiltroChange('disponible', e.target.checked)}
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    cursor: 'pointer',
                    accentColor: '#7A1E3A'
                  }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Solo libros disponibles en stock
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A1E3A" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </span>
              </label>
            </div>
          </>
        ) : (
          <>
            {/* BÚSQUEDA POR TIENDA */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#7A1E3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4 8 4v14" />
                  <path d="M17 21v-8.5a1.5 1.5 0 0 0-3 0V21" />
                </svg>
                Nombre de la Tienda
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Buscar por nombre de librería..."
                  value={filtros.nombre_tienda}
                  onChange={(e) => handleFiltroChange('nombre_tienda', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '2px solid #e8e4df',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: '#faf8f6'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7A1E3A';
                    e.target.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e8e4df';
                    e.target.style.background = '#faf8f6';
                  }}
                />
                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4 8 4v14" />
                  <path d="M17 21v-8.5a1.5 1.5 0 0 0-3 0V21" />
                </svg>
              </div>
            </div>

            {/* BÚSQUEDA POR CORREO */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#7A1E3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Correo del Vendedor
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={filtros.correo_vendedor}
                  onChange={(e) => handleFiltroChange('correo_vendedor', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '2px solid #e8e4df',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: '#faf8f6'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7A1E3A';
                    e.target.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e8e4df';
                    e.target.style.background = '#faf8f6';
                  }}
                />
                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>

            {/* INFO */}
            <div style={{ 
              padding: '12px 16px', 
              background: '#fef9e7', 
              borderRadius: '8px',
              border: '1px solid #f5e6c8',
              fontSize: '0.85rem', 
              color: '#8a6d3b',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Busca vendedores específicos por su nombre de tienda o correo electrónico</span>
            </div>
          </>
        )}

        {/* ORDENAMIENTO (común para ambas tabs) */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#7A1E3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            Ordenar Por
          </label>
          <select
            value={filtros.ordenar_por}
            onChange={(e) => handleFiltroChange('ordenar_por', e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e8e4df',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              backgroundColor: '#faf8f6',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#7A1E3A';
              e.target.style.background = '#fff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e8e4df';
              e.target.style.background = '#faf8f6';
            }}
          >
            {opciones.opciones_ordenamiento.map(opcion => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        {/* INDICADOR DE FILTROS ACTIVOS */}
        {filtrosAplicados > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#e8f5e9',
            borderRadius: '8px',
            border: '1px solid #c8e6c9',
            fontSize: '0.85rem',
            color: '#2e7d32',
            fontWeight: 600
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {filtrosAplicados} filtro{filtrosAplicados !== 1 ? 's' : ''} aplicado{filtrosAplicados !== 1 ? 's' : ''}
          </div>
        )}

        {/* BOTONES */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '0.5rem' }}>
          <button
            onClick={handleLimpiar}
            style={{
              flex: 1,
              padding: '14px 20px',
              border: '2px solid #e8e4df',
              borderRadius: '10px',
              background: '#fff',
              color: '#555',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#7A1E3A';
              e.target.style.color = '#7A1E3A';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#e8e4df';
              e.target.style.color = '#555';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Limpiar Todo
          </button>
          <button
            onClick={handleAplicar}
            style={{
              flex: 1,
              padding: '14px 20px',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7A1E3A 0%, #9a2a4a 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(122, 30, 58, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(122, 30, 58, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(122, 30, 58, 0.3)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalOption({ to, onClick, iconPath, title, desc, onClose }) {
  const content = (
    <>
      <div className="modal-option-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/>
        </svg>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
      <IconArrow />
    </>
  );

  if (onClick) {
    return (
      <button 
        type="button" 
        className="modal-option" 
        onClick={() => { onClick(); if (onClose) onClose(); }}
        style={{ background: 'none', border: '1.5px solid #e5e0d8', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className="modal-option" onClick={onClose}>
      {content}
    </Link>
  );
}

function Header({ variant, hasSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(localStorage.getItem('bookyhome_location') || 'Todo el país (Colombia)');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [libreriaOpen, setLibreriaOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginEmailErr, setLoginEmailErr] = useState('');
  const [loginPassErr, setLoginPassErr] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [noLeidosNotif, setNoLeidosNotif] = useState(0);
  const [noLeidosMensajes, setNoLeidosMensajes] = useState(0);
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isDashboardPage = hasSidebar ||
    location.pathname === '/post-login' ||
    location.pathname.startsWith('/mi-tienda') ||
    location.pathname.startsWith('/vendedor') ||
    location.pathname.startsWith('/perfil') ||
    location.pathname.startsWith('/publicar');

  useEffect(() => {
    if (!loginOpen) {
      setShowPass(false);
      setLoginError('');
      setLoginEmailErr('');
      setLoginPassErr('');
      setLoginForm({ email: '', password: '' });
    }
  }, [loginOpen]);

  useEffect(() => {
    const openLoginModal = () => setLoginOpen(true);
    window.addEventListener('bookyhome:open-login', openLoginModal);
    return () => window.removeEventListener('bookyhome:open-login', openLoginModal);
  }, []);

  useEffect(() => {
    const openRegisterModal = () => setRegisterOpen(true);
    window.addEventListener('bookyhome:open-register', openRegisterModal);
    return () => window.removeEventListener('bookyhome:open-register', openRegisterModal);
  }, []);

  useEffect(() => {
    const openLibraryRegisterModal = () => setLibreriaOpen(true);
    window.addEventListener('bookyhome:open-library-register', openLibraryRegisterModal);
    return () => window.removeEventListener('bookyhome:open-library-register', openLibraryRegisterModal);
  }, []);

  const isSimple = variant === "simple";
  const isWhite = variant === "white" || !variant;

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no permite detectar la ubicación.');
      return;
    }

    setDetectingLocation(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=es&lat=${coords.latitude}&lon=${coords.longitude}`
        );
        if (!response.ok) throw new Error('No se pudo consultar la ubicación');

        const data = await response.json();
        const address = data.address || {};
        const city = address.city || address.town || address.municipality || address.county;
        const locality = address.suburb || address.neighbourhood || address.city_district || address.quarter;
        const detectedLocation = [city, locality].filter(Boolean).join(', ');

        if (!detectedLocation) throw new Error('No encontramos una ciudad válida');

        setSelectedLocation(detectedLocation);
        localStorage.setItem('bookyhome_location', detectedLocation);
        setLocationOpen(false);
        notify(`Ubicación detectada: ${detectedLocation}`, 'success');
      } catch {
        setLocationError('No pudimos convertir tu ubicación en una ciudad.');
      } finally {
        setDetectingLocation(false);
      }
    }, () => {
      setDetectingLocation(false);
      setLocationError('Permite el acceso a tu ubicación para detectarla automáticamente.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  };

  useEffect(() => {
    if (locationOpen && !localStorage.getItem('bookyhome_location')) {
      detectUserLocation();
    }
  }, [locationOpen]);

  const [authState, setAuthState] = useState(() => {
    const t = localStorage.getItem("token");
    if (!t) return { isLoggedIn: false, userRole: null };
    try {
      const decoded = jwtDecode(t);
      return { isLoggedIn: true, userRole: decoded.rol };
    } catch {
      return { isLoggedIn: false, userRole: null };
    }
  });

  const { isLoggedIn, userRole } = authState;

  // Autocompletado de búsqueda
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const syncAuth = () => {
      const t = localStorage.getItem("token");
      if (!t) {
        setAuthState({ isLoggedIn: false, userRole: null });
        return;
      }
      try {
        const decoded = jwtDecode(t);
        setAuthState({ isLoggedIn: true, userRole: decoded.rol });
      } catch {
        setAuthState({ isLoggedIn: false, userRole: null });
      }
    };
    window.addEventListener('auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  // Cargar contadores de notificaciones y mensajes
  useEffect(() => {
    if (!isLoggedIn) return;
    
    let mounted = true;
    const cargarContadores = async () => {
      try {
        const notifData = await notificacionesService.obtener(false, 1, 0);
        if (mounted) setNoLeidosNotif(notifData.no_leidas || 0);

        const salasData = await chatService.getSalas();
        const totalNo = (salasData.salas || []).reduce((acc, s) => acc + (s.no_leidos || 0), 0);
        if (mounted) setNoLeidosMensajes(totalNo);
      } catch (err) {
        console.error('Error contadores header:', err);
      }
    };
    
    cargarContadores();
    const iv = setInterval(cargarContadores, 10000);
    return () => { mounted = false; clearInterval(iv); };
  }, [isLoggedIn]);

  // Autocompletado de búsqueda
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const response = await api.get('/catalogo/autocompletado', {
          params: { q: searchTerm, limite: 8 }
        });
        setSearchSuggestions(response.data.sugerencias || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error buscando sugerencias:', error);
        setSearchSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (sugerencia) => {
    setSearchTerm(sugerencia.titulo);
    setShowSuggestions(false);
    if (isLoggedIn) {
      navigate(`/?seccion=Catálogo&q=${encodeURIComponent(sugerencia.titulo)}`);
    } else {
      navigate(`/catalogo?q=${encodeURIComponent(sugerencia.titulo)}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      if (searchTerm.trim()) {
        navigate(`/?seccion=Catálogo&q=${encodeURIComponent(searchTerm.trim())}`);
      } else {
        navigate('/?seccion=Catálogo');
      }
    } else {
      if (searchTerm.trim()) {
        navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`);
      } else {
        navigate('/catalogo');
      }
    }
  };

  const handleFiltrosApply = (filtros) => {
    const params = new URLSearchParams();

    if (filtros.busqueda) params.append('q', filtros.busqueda);
    if (filtros.nombre_tienda) params.append('nombre_tienda', filtros.nombre_tienda);
    if (filtros.correo_vendedor) params.append('correo_vendedor', filtros.correo_vendedor);
    if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
    if (filtros.precio_min) params.append('precio_min', filtros.precio_min);
    if (filtros.precio_max) params.append('precio_max', filtros.precio_max);
    if (filtros.calificacion_min) params.append('calificacion_min', filtros.calificacion_min);
    if (filtros.disponible) params.append('disponible', 'true');
    params.append('ordenar_por', filtros.ordenar_por);

    setSearchTerm(filtros.busqueda || '');
    setFiltrosOpen(false);

    if (isLoggedIn) {
      params.append('seccion', 'Catálogo');
      navigate(`/?${params.toString()}`);
    } else {
      navigate(`/catalogo?${params.toString()}`);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    setLoginEmailErr('');
    setLoginPassErr('');

    let valid = true;
    if (!loginForm.email.trim()) { setLoginEmailErr('Este campo es obligatorio'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) { setLoginEmailErr('Ingresa un email válido'); valid = false; }
    if (!loginForm.password.trim()) { setLoginPassErr('Este campo es obligatorio'); valid = false; }
    if (!valid) return;

    setLoginLoading(true);
    try {
      const res = await login(loginForm);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      notify('Inicio de sesión correcto', 'success');
      setLoginOpen(false);
      // Disparar evento para que App.jsx detecte el cambio
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: true } }));
      if (decoded.rol === 'vendedor') {
        navigate('/mi-tienda');
      } else if (decoded.rol === 'admin' || decoded.rol === 'administrador') {
        navigate('/admin');
      } else {
        navigate('/'); // Comprador va al Home con sidebar
      }
    } catch (err) {
      const message = err.response?.data?.detail || 'Email o contraseña incorrectos';
      setLoginError(message);
      notify(message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const [headerHovered, setHeaderHovered] = useState(false);
  const leaveTimerRef = useRef(null);

  const handleSensorMouseEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setHeaderHovered(true); // Activación instantánea (0ms)
  };

  const handleHeaderMouseEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setHeaderHovered(true);
  };

  const handleHeaderMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setHeaderHovered(false);
    }, 180);
  };

  // Sincronizar clase en <body> para que el contenido se desplace con el curtain
  useEffect(() => {
    if (isDashboardPage) {
      if (headerHovered) {
        document.body.classList.add('header-curtain-visible');
      } else {
        document.body.classList.remove('header-curtain-visible');
      }
    }
    return () => {
      document.body.classList.remove('header-curtain-visible');
    };
  }, [headerHovered, isDashboardPage]);

  return (
    <>
      {/* Sensor invisible en el borde superior de la pantalla para desplegar el header por hover */}
      {isDashboardPage && (
        <div
          className="header-top-hover-sensor"
          onMouseEnter={handleSensorMouseEnter}
        />
      )}

      <header
        id="main-header"
        onMouseEnter={handleHeaderMouseEnter}
        onMouseLeave={handleHeaderMouseLeave}
        className={`${isSimple ? "header-center" : ""} ${isHome ? "header-vinotinto" : isWhite ? "header-white" : "header-vinotinto"} ${mobileMenuOpen ? "header-menu-open" : ""} ${isDashboardPage ? (headerHovered ? "header-curtain-open" : "header-curtain-closed") : ""}`}
        style={{
          position: isDashboardPage ? 'fixed' : undefined,
          left: isDashboardPage ? 'var(--dashboard-sidebar-width, 250px)' : undefined,
          width: isDashboardPage ? 'calc(100% - var(--dashboard-sidebar-width, 250px))' : undefined,
          zIndex: isDashboardPage ? 1200 : undefined
        }}
      >
        {isHome && (
          <div className="top-bar">
            <div className="layout-container" style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
              <div className="location" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={(e) => { e.stopPropagation(); setLocationOpen(prev => !prev); }}>
                <IconLocation />
                <span>Enviar a: {selectedLocation}</span>
                <span style={{ fontSize: '10px', marginLeft: '6px' }}>▼</span>
              </div>
            </div>
          </div>
        )}
        <div className="layout-container header-container">
          <Link to="/" className="logo-link">
          <img src={isHome ? logo2 : isWhite ? logo : logo2} alt="BookyHome" className="logo-img" />
        </Link>

        <button
          type="button"
          className="header-menu-toggle"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <IconMenu />
        </button>

        {!isSimple && (
          <>
            <div className="search-container">
              <form className="search-wrapper" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Buscar libros..."
                  className="search-bar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  ref={searchInputRef}
                  autoComplete="off"
                />
                <button type="submit" className="search-btn"><IconSearch /></button>
              </form>
              <button
                type="button"
                className="filter-btn"
                onClick={() => setFiltrosOpen(!filtrosOpen)}
                title="Filtros avanzados"
              >
                <IconFilter />
              </button>

              {/* Autocompletado de sugerencias */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions" ref={suggestionsRef}>
                  {loadingSuggestions ? (
                    <div className="suggestion-loading">
                      <div className="suggestion-spinner"></div>
                      <span>Buscando...</span>
                    </div>
                  ) : (
                    searchSuggestions.map((sugerencia) => (
                      <div
                        key={sugerencia.id_libro}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(sugerencia)}
                      >
                        <div className="suggestion-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.3-4.3"/>
                          </svg>
                        </div>
                        <div className="suggestion-content">
                          <div className="suggestion-title">{sugerencia.titulo}</div>
                          <div className="suggestion-author">{sugerencia.autor_libro}</div>
                        </div>
                        <div className="suggestion-price">${sugerencia.precio_libro.toLocaleString('es-CO')}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="header-actions">
              {isLoggedIn ? (
                <>
                  {/* Accesos rápidos para usuarios logueados */}
                  <div className="quick-access">
                    {userRole !== 'vendedor' ? (
                      <>
                        <Link 
                          to="/?seccion=Carrito" 
                          className="quick-access-item"
                          title="Carrito de compras"
                        >
                          <IconCart />
                          <span className="quick-access-label">Carrito</span>
                        </Link>
                        
                        <Link 
                          to="/?seccion=Notificaciones" 
                          className="quick-access-item"
                          title="Notificaciones"
                        >
                          <IconBell />
                          {noLeidosNotif > 0 && (
                            <span className="notification-badge">{noLeidosNotif}</span>
                          )}
                          <span className="quick-access-label">Notificaciones</span>
                        </Link>
                        
                        <Link 
                          to="/?seccion=Mensajes" 
                          className="quick-access-item"
                          title="Mensajes y Chat"
                        >
                          <IconMessage />
                          {noLeidosMensajes > 0 && (
                            <span className="notification-badge">{noLeidosMensajes}</span>
                          )}
                          <span className="quick-access-label">Chat</span>
                        </Link>
                        
                        <Link 
                          to="/?seccion=Seguimiento" 
                          className="quick-access-item"
                          title="Seguimiento de pedidos"
                        >
                          <IconTruck />
                          <span className="quick-access-label">Pedidos</span>
                        </Link>
                        
                        <Link 
                          to="/?seccion=Lista%20de%20Deseos" 
                          className="quick-access-item"
                          title="Lista de deseos"
                        >
                          <IconFavorites />
                          <span className="quick-access-label">Favoritos</span>
                        </Link>
                        
                        <Link
                          to="/?seccion=Mi%20Perfil"
                          className="quick-access-item"
                          title="Mi perfil"
                        >
                          <IconUser />
                          <span className="quick-access-label">Perfil</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link 
                          to="/mi-tienda?seccion=Mis%20Libros" 
                          className="quick-access-item"
                          title="Mis Libros"
                        >
                          <IconBookOpen />
                          <span className="quick-access-label">Libros</span>
                        </Link>

                        <Link 
                          to="/mi-tienda?seccion=Notificaciones" 
                          className="quick-access-item"
                          title="Notificaciones"
                        >
                          <IconBell />
                          {noLeidosNotif > 0 && (
                            <span className="notification-badge">{noLeidosNotif}</span>
                          )}
                          <span className="quick-access-label">Notificaciones</span>
                        </Link>
                        
                        <Link 
                          to="/mi-tienda?seccion=Mensajes" 
                          className="quick-access-item"
                          title="Mensajes y Chat"
                        >
                          <IconMessage />
                          {noLeidosMensajes > 0 && (
                            <span className="notification-badge">{noLeidosMensajes}</span>
                          )}
                          <span className="quick-access-label">Chat</span>
                        </Link>

                        <Link 
                          to="/mi-tienda?seccion=Pedidos" 
                          className="quick-access-item"
                          title="Pedidos y Ventas"
                        >
                          <IconCart />
                          <span className="quick-access-label">Pedidos</span>
                        </Link>

                        <Link 
                          to="/mi-tienda?seccion=Perfil" 
                          className="quick-access-item"
                          title="Mi Tienda y Perfil"
                        >
                          <IconUser />
                          <span className="quick-access-label">Perfil</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {userRole === 'vendedor' && (
                    <Link 
                      to="/mi-tienda?seccion=Envios" 
                      className="header-seller-envios-btn"
                      title="Gestión de envíos"
                    >
                      <IconTruck width={22} height={22} strokeWidth={2} />
                      <span>Envíos</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="user-access"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => setLoginOpen(true)}
                  >
                    <IconUser />
                    <span>Ingresa</span>
                  </button>

                  <button
                    className="user-access"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => setModalOpen(true)}
                  >
                    <IconUserPlus />
                    <span>Crea tu cuenta</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
        </div>
      </header>

      {modalOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal-card">
            <button className="modal-close" aria-label="Cerrar" onClick={() => setModalOpen(false)}>
              <IconClose />
            </button>
            <h2 className="modal-title">Crear cuenta</h2>
            <p className="modal-subtitle">¿Cómo quieres unirte a BookyHome?</p>
            <div className="modal-options">
              <ModalOption
                onClick={() => { setModalOpen(false); setRegisterOpen(true); }}
                iconPath="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z"
                title="Soy comprador"
                desc="Quiero explorar y comprar libros"
              />
              <ModalOption
                onClick={() => { setModalOpen(false); setLibreriaOpen(true); }}
                iconPath="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25h-1.5A2.25 2.25 0 007.5 13.5V21m6 0H7.5m6 0h3.75A2.25 2.25 0 0019.5 18.75V9.375a2.25 2.25 0 00-.659-1.591l-4.5-4.5A2.25 2.25 0 0012.75 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21H7.5"
                title="Tengo una librería"
                desc="Quiero vender mis libros en BookyHome"
              />
            </div>
          </div>
        </div>
      )}

      {loginOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false) }}>
          <div className="modal-card">
            <button className="modal-close" aria-label="Cerrar" onClick={() => setLoginOpen(false)}>
              <IconClose />
            </button>
            <h2 className="modal-title">Iniciar sesión</h2>
            <p className="modal-subtitle">Ingresa con tu cuenta de BookyHome</p>
            {loginError && (
              <span className="error-msg" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
                {loginError}
              </span>
            )}
            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => { setLoginForm({...loginForm, email: e.target.value}); setLoginEmailErr(''); }}
                  className={loginEmailErr ? 'input-error' : ''}
                />
                {loginEmailErr && <span className="error-msg">{loginEmailErr}</span>}
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <div className="password-input">
                  <input
                    type={showPass ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => { setLoginForm({...loginForm, password: e.target.value}); setLoginPassErr(''); }}
                    className={loginPassErr ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <IconEyeOpen /> : <IconEyeClosed />}
                  </button>
                </div>
                {loginPassErr && <span className="error-msg">{loginPassErr}</span>}
              </div>
              <button type="submit" className="btn-primary" disabled={loginLoading}>
                {loginLoading ? 'Iniciando...' : 'Iniciar sesión'}
              </button>
              <div className="form-links">
                <button type="button" onClick={() => { setLoginOpen(false); setForgotPasswordOpen(true); }} className="link-button">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {forgotPasswordOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setForgotPasswordOpen(false) }}>
          <div className="modal-card">
            <button className="modal-close" aria-label="Cerrar" onClick={() => setForgotPasswordOpen(false)}>
              <IconClose />
            </button>
            <h2 className="modal-title">¿Olvidaste tu contraseña?</h2>
            <p className="modal-subtitle">Ingresa tu email y te enviaremos un enlace para restablecerla</p>
            <ForgotPassword isModal={true} onClose={() => setForgotPasswordOpen(false)} />
          </div>
        </div>
      )}

      {registerOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setRegisterOpen(false) }}>
          <div className="modal-box" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setRegisterOpen(false)}>
              <IconClose />
            </button>
            <Register 
              isModal={true} 
              onClose={() => setRegisterOpen(false)} 
              onSuccess={() => {
                setRegisterOpen(false);
                setLoginOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {libreriaOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setLibreriaOpen(false) }}>
          <div className="modal-box" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setLibreriaOpen(false)}>
              <IconClose />
            </button>
            <Libreria 
              isModal={true} 
              onClose={() => setLibreriaOpen(false)} 
              onSuccess={() => {
                setLibreriaOpen(false);
                setLoginOpen(true);
              }}
            />
          </div>
        </div>
      )}
      {ReactDOM.createPortal(
        locationOpen ? (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
            onMouseDown={() => setLocationOpen(false)}
          >
            <div
              style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '380px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', margin: '0 20px' }}
              onMouseDown={e => e.stopPropagation()}
            >
              <button
                onMouseDown={() => setLocationOpen(false)}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#aaa', lineHeight: 1 }}
              >✕</button>
              <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.3rem', fontWeight: 800, color: '#2A2A2A', textAlign: 'center' }}>Elige tu ubicación</h2>
              <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Selecciona dónde quieres recibir tus compras.</p>
              <button
                type="button"
                onClick={detectUserLocation}
                disabled={detectingLocation}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  marginBottom: '10px',
                  border: '1.5px solid #7A1E3A',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#7A1E3A',
                  cursor: detectingLocation ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {detectingLocation ? 'Detectando ubicación...' : 'Usar mi ubicación actual'}
              </button>
              {locationError && (
                <p style={{ color: '#9b1c31', fontSize: '0.78rem', textAlign: 'center', margin: '0 0 10px' }}>
                  {locationError}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Todo el país (Colombia)', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'].map((city) => (
                  <button
                    key={city}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedLocation(city);
                      setLocationOpen(false);
                      localStorage.setItem('bookyhome_location', city);
                      notify(`Ubicación actualizada a ${city}`, 'success');
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      background: selectedLocation === city ? '#F4EDE2' : '#fff',
                      border: selectedLocation === city ? '2px solid #7A1E3A' : '1.5px solid #e5e0d8',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '15px',
                      fontWeight: selectedLocation === city ? 700 : 400,
                      color: '#2A2A2A',
                    }}
                  >
                    {selectedLocation === city && <span style={{ color: '#7A1E3A', marginRight: '8px' }}>✓</span>}
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}

      {ReactDOM.createPortal(
        filtrosOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '20px'
            }}
            onMouseDown={() => setFiltrosOpen(false)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '0',
                width: '100%',
                maxWidth: '500px',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e8e4df',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.2rem', fontWeight: 800, color: '#2A2A2A' }}>Filtros avanzados</h2>
                  <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Refina tu búsqueda de libros</p>
                </div>
                <button
                  onMouseDown={() => setFiltrosOpen(false)}
                  style={{
                    position: 'static',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    color: '#aaa',
                    lineHeight: 1,
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.color = '#666'}
                  onMouseOut={e => e.currentTarget.style.color = '#aaa'}
                >✕</button>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                overflowX: 'hidden'
              }}>
                <FiltrosHeader onApply={handleFiltrosApply} initialSearchTerm={searchTerm} />
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}
    </>
  );
}

export default Header;