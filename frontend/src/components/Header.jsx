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
      precio_max: opciones.precio_max || 1000000,
      calificacion_min: 0,
      disponible: true,
      ordenar_por: 'relevancia'
    };
    setFiltros(filtrosLimpios);
  };

  const setRangoPreset = (min, max) => {
    setFiltros(prev => ({
      ...prev,
      precio_min: min,
      precio_max: max === null ? (opciones.precio_max || 1000000) : max
    }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
        <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #ede8e1', borderTopColor: 'var(--vinotinto)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ marginTop: '14px', fontSize: '0.88rem', fontWeight: 600 }}>Cargando filtros disponibles...</p>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs segmentados con diseño moderno */}
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        background: '#f2ece4', 
        padding: '5px', 
        borderRadius: '12px',
        marginBottom: '1.25rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('libros')}
          style={{
            flex: 1,
            padding: '9px 14px',
            border: 'none',
            borderRadius: '9px',
            background: activeTab === 'libros' ? '#fff' : 'transparent',
            color: activeTab === 'libros' ? 'var(--vinotinto)' : '#666',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'libros' ? 750 : 550,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: activeTab === 'libros' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
          Por Libros
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendedores')}
          style={{
            flex: 1,
            padding: '9px 14px',
            border: 'none',
            borderRadius: '9px',
            background: activeTab === 'vendedores' ? '#fff' : 'transparent',
            color: activeTab === 'vendedores' ? 'var(--vinotinto)' : '#666',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'vendedores' ? 750 : 550,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: activeTab === 'vendedores' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4 8 4v14" />
            <path d="M17 21v-8.5a1.5 1.5 0 0 0-3 0V21" />
          </svg>
          Por Librerías
        </button>
      </div>

      {/* Contenido scrolleable de filtros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '0.5rem' }}>
        {activeTab === 'libros' ? (
          <>
            {/* Búsqueda por texto */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Búsqueda
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  placeholder="Título, autor o ISBN..."
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.3rem',
                    border: '1.5px solid #e2ded8',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#faf8f5',
                    color: '#2A2A2A',
                    transition: 'all 0.18s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--vinotinto)';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(122, 30, 58, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2ded8';
                    e.target.style.background = '#faf8f5';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Categoría
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={filtros.categoria_id || ''}
                  onChange={(e) => handleFiltroChange('categoria_id', e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    width: '100%',
                    padding: '0.68rem 2.2rem 0.68rem 0.95rem',
                    border: '1.5px solid #e2ded8',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    backgroundColor: '#faf8f5',
                    color: '#2A2A2A',
                    fontWeight: filtros.categoria_id ? 650 : 450,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    appearance: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--vinotinto)';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(122, 30, 58, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2ded8';
                    e.target.style.background = '#faf8f5';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Todas las categorías</option>
                  {opciones.categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria} ({cat.cantidad_libros})
                    </option>
                  ))}
                </select>
                <svg style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Rango de precio */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 750, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rango de Precio
                </label>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--vinotinto)' }}>
                  ${(filtros.precio_min || 0).toLocaleString('es-CO')} - ${(filtros.precio_max || 0).toLocaleString('es-CO')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#999', fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    min={opciones.precio_min}
                    max={opciones.precio_max}
                    value={filtros.precio_min}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (val <= filtros.precio_max) handleFiltroChange('precio_min', val);
                    }}
                    placeholder="Mín"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.6rem 0.55rem 1.6rem',
                      border: '1.5px solid #e2ded8',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: '#faf8f5',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <span style={{ color: '#aaa', fontWeight: 700 }}>—</span>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#999', fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    min={opciones.precio_min}
                    max={opciones.precio_max}
                    value={filtros.precio_max}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || opciones.precio_max;
                      if (val >= filtros.precio_min) handleFiltroChange('precio_max', val);
                    }}
                    placeholder="Máx"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.6rem 0.55rem 1.6rem',
                      border: '1.5px solid #e2ded8',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: '#faf8f5',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Presets rápidos */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {[
                  { label: '< $30k', min: 0, max: 30000 },
                  { label: '$30k - $70k', min: 30000, max: 70000 },
                  { label: '$70k - $120k', min: 70000, max: 120000 },
                  { label: '> $120k', min: 120000, max: null }
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setRangoPreset(preset.min, preset.max)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '14px',
                      border: '1px solid #e5e0d8',
                      background: '#fff',
                      color: '#666',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--vinotinto)'; e.currentTarget.style.color = 'var(--vinotinto)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e5e0d8'; e.currentTarget.style.color = '#666'; }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calificación mínima con estrellas corregidas */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Calificación mínima
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { val: 0, label: 'Todas' },
                  { val: 3, label: '3★ +' },
                  { val: 4, label: '4★ +' },
                  { val: 5, label: '5★' }
                ].map(item => {
                  const isSelected = filtros.calificacion_min === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleFiltroChange('calificacion_min', item.val)}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.5rem',
                        border: isSelected ? '2px solid var(--vinotinto)' : '1.5px solid #e2ded8',
                        borderRadius: '9px',
                        background: isSelected ? 'var(--vinotinto)' : '#fff',
                        color: isSelected ? '#fff' : '#555',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 750 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        boxShadow: isSelected ? '0 2px 6px rgba(122,30,58,0.2)' : 'none'
                      }}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Switch de disponibilidad */}
            <div 
              onClick={() => handleFiltroChange('disponible', !filtros.disponible)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.95rem',
                background: filtros.disponible ? '#fcf8f5' : '#faf8f5',
                borderRadius: '10px',
                border: filtros.disponible ? '1.5px solid #e8dbcf' : '1.5px solid #e8e4df',
                cursor: 'pointer',
                transition: 'all 0.18s'
              }}
            >
              <div>
                <span style={{ fontSize: '0.84rem', fontWeight: 650, color: '#2A2A2A', display: 'block' }}>
                  Solo libros en stock
                </span>
                <span style={{ fontSize: '0.72rem', color: '#888' }}>
                  Ocultar ejemplares agotados
                </span>
              </div>
              <div style={{
                width: '38px',
                height: '22px',
                borderRadius: '11px',
                background: filtros.disponible ? 'var(--vinotinto)' : '#d1cbbf',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: '3px',
                  left: filtros.disponible ? '19px' : '3px',
                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Vendedores tab */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Nombre de la Librería
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre de tienda..."
                value={filtros.nombre_tienda}
                onChange={(e) => handleFiltroChange('nombre_tienda', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.95rem',
                  border: '1.5px solid #e2ded8',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#faf8f5',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Correo del Vendedor
              </label>
              <input
                type="email"
                placeholder="contacto@libreria.com"
                value={filtros.correo_vendedor}
                onChange={(e) => handleFiltroChange('correo_vendedor', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.95rem',
                  border: '1.5px solid #e2ded8',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#faf8f5',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ 
              padding: '0.75rem 0.9rem', 
              background: '#fcf8f0', 
              borderRadius: '9px',
              border: '1px solid #fae8c8',
              fontSize: '0.78rem', 
              color: '#8f6520',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>💡</span>
              <span>Encuentra vendedores específicos por su razón social o email oficial.</span>
            </div>
          </>
        )}

        {/* Ordenamiento */}
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ordenar resultados por
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={filtros.ordenar_por}
              onChange={(e) => handleFiltroChange('ordenar_por', e.target.value)}
              style={{
                width: '100%',
                padding: '0.68rem 2.2rem 0.68rem 0.95rem',
                border: '1.5px solid #e2ded8',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontFamily: 'inherit',
                outline: 'none',
                backgroundColor: '#faf8f5',
                color: '#2A2A2A',
                fontWeight: 600,
                cursor: 'pointer',
                appearance: 'none',
                boxSizing: 'border-box'
              }}
            >
              {opciones.opciones_ordenamiento.map(opcion => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
            <svg style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer fijo con acciones */}
      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '1rem', 
        borderTop: '1px solid #f0ebe4',
        display: 'flex', 
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        {filtrosAplicados > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.76rem',
            color: '#2e7d32',
            fontWeight: 700
          }}>
            <span>✨</span> {filtrosAplicados} {filtrosAplicados === 1 ? 'filtro activo' : 'filtros activos'}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleLimpiar}
            style={{
              padding: '0.75rem 1.1rem',
              border: '1.5px solid #e0dbd4',
              borderRadius: '10px',
              background: '#fff',
              color: '#666',
              fontSize: '0.84rem',
              fontWeight: 650,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--vinotinto)'; e.currentTarget.style.color = 'var(--vinotinto)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.color = '#666'; }}
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={handleAplicar}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--vinotinto) 0%, #9a2a4a 100%)',
              color: '#fff',
              fontSize: '0.88rem',
              fontWeight: 750,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.18s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(122, 30, 58, 0.28)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(122, 30, 58, 0.38)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(122, 30, 58, 0.28)';
            }}
          >
            <span>Aplicar Filtros</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
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
  const [selectedLocation, setSelectedLocation] = useState(localStorage.getItem('bookyhome_location') || 'Colombia');
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
        navigate('/mi-tienda', { replace: true });
      } else if (decoded.rol === 'admin' || decoded.rol === 'administrador') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true }); // Comprador va al Home con sidebar
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
        className={`${isSimple ? "header-center header-simple" : ""} ${isHome ? "header-vinotinto" : isWhite ? "header-white" : "header-vinotinto"} ${mobileMenuOpen ? "header-menu-open" : ""} ${isDashboardPage ? (headerHovered ? "header-curtain-open" : "header-curtain-closed") : ""}`}
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
                <span>Envíos a {selectedLocation === 'Colombia' ? 'Colombia' : `${selectedLocation}, Colombia`}</span>
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
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
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
                    id="login-password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
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
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
            onMouseDown={() => setLocationOpen(false)}
          >
            <div
              style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', position: 'relative', boxShadow: '0 32px 72px rgba(0,0,0,0.28)', margin: '0 16px', overflow: 'hidden', animation: 'legalModalIn 0.22s cubic-bezier(0.22,1,0.36,1) both' }}
              onMouseDown={e => e.stopPropagation()}
            >
              {/* Header vinotinto */}
              <div style={{ background: '#7A1E3A', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>Elige tu ubicación</span>
                </div>
                <button
                  onMouseDown={() => setLocationOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.18s' }}
                >✕</button>
              </div>

              {/* Cuerpo */}
              <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
                <p style={{ color: '#888', fontSize: '0.82rem', margin: '0 0 1rem', textAlign: 'center' }}>Selecciona la ciudad donde quieres recibir tus compras.</p>

                {/* Botón GPS */}
                <button
                  type="button"
                  onClick={detectUserLocation}
                  disabled={detectingLocation}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    marginBottom: '1rem',
                    border: '1.5px solid #7A1E3A',
                    borderRadius: '8px',
                    background: detectingLocation ? '#f9f3f5' : '#fff',
                    color: '#7A1E3A',
                    cursor: detectingLocation ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    transition: 'background 0.18s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                  {detectingLocation ? 'Detectando ubicación...' : 'Usar mi ubicación actual'}
                </button>

                {locationError && (
                  <p style={{ color: '#9b1c31', fontSize: '0.78rem', textAlign: 'center', margin: '-0.5rem 0 0.75rem' }}>
                    {locationError}
                  </p>
                )}

                {/* Separador */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#ede8e3' }} />
                  <span style={{ fontSize: '0.75rem', color: '#bbb', fontWeight: 600, letterSpacing: '0.04em' }}>CIUDADES</span>
                  <div style={{ flex: 1, height: '1px', background: '#ede8e3' }} />
                </div>

                {/* Grid 2 columnas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '2px' }}>
                  {['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Santa Marta', 'Bucaramanga', 'Pereira', 'Manizales', 'Armenia', 'Ibagué', 'Neiva', 'Villavicencio', 'Pasto'].map((city) => {
                    const isSelected = selectedLocation === city;
                    return (
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
                          padding: '10px 12px',
                          textAlign: 'left',
                          background: isSelected ? '#7A1E3A' : '#faf8f6',
                          border: isSelected ? '2px solid #7A1E3A' : '1.5px solid #ede8e3',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '13.5px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#fff' : '#2A2A2A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#fff' : '#bbb'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {city}
                      </button>
                    );
                  })}
                </div>
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
              background: 'rgba(18, 12, 14, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
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
                borderRadius: '20px',
                padding: '0',
                width: '100%',
                maxWidth: '480px',
                position: 'relative',
                boxShadow: '0 25px 70px -10px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #f0ebe4',
                background: '#faf8f5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(122, 30, 58, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--vinotinto)',
                    fontSize: '1.1rem'
                  }}>
                    🌪️
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#2A2A2A', letterSpacing: '-0.01em' }}>Filtros avanzados</h2>
                    <p style={{ margin: 0, color: '#888', fontSize: '0.78rem', fontWeight: 500 }}>Personaliza tu búsqueda de libros y librerías</p>
                  </div>
                </div>
                <button
                  onMouseDown={() => setFiltrosOpen(false)}
                  style={{
                    position: 'static',
                    background: '#f0ebe4',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#666',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                    fontWeight: 'bold'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#e2ded8'; e.currentTarget.style.color = '#2A2A2A'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#f0ebe4'; e.currentTarget.style.color = '#666'; }}
                >✕</button>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.25rem 1.5rem 1.5rem',
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