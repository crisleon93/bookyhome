import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../hooks/useAuth';
import api, { getApiBaseUrl } from '../services/api';
import { notify } from '../components/ToastProvider';
import { tiempoTranscurrido as tiempoTranscurridoAdmin } from '../utils/catalogo';
import BookyPagoFinanzas from './BookyPagoFinanzas';
import SeccionPerfilAdmin from '../components/dashboard/SeccionPerfilAdmin';
import {
  IconLayoutDashboard, IconTrendingUp, IconUser, IconUsers, IconBook, IconStore, IconPackage,
  IconSettings, IconChevronLeft, IconChevronDown, IconMenu, IconLogOut, IconLock, IconUnlock,
  IconCheck, IconBan, IconEye, IconTrash, IconDollar, IconCart, IconTool, IconAlertTriangle, IconWallet,
  IconInfo, IconTruck, IconMessage, IconStoreAlt, IconSearch, IconClose, IconPhone, IconMail,
} from '../components/Icons';

const ESTADO_CONFIG_ADMIN = {
  'Resuelto': {
    bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#16a34a',
    darkBg: 'rgba(22,163,74,0.14)', darkColor: '#86efac', darkBorder: 'rgba(22,163,74,0.45)',
  },
  'En revision': {
    bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c',
    darkBg: 'rgba(234,88,12,0.14)', darkColor: '#fdba74', darkBorder: 'rgba(234,88,12,0.45)',
  },
  'En revisión': {
    bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c',
    darkBg: 'rgba(234,88,12,0.14)', darkColor: '#fdba74', darkBorder: 'rgba(234,88,12,0.45)',
  },
  'Abierto': {
    bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', dot: '#3b82f6',
    darkBg: 'rgba(59,130,246,0.14)', darkColor: '#bfdbfe', darkBorder: 'rgba(59,130,246,0.45)',
  },
  'Cerrado': {
    bg: '#f3f4f6', color: '#374151', border: '#d1d5db', dot: '#6b7280',
    darkBg: 'rgba(107,114,128,0.16)', darkColor: '#e5e7eb', darkBorder: 'rgba(107,114,128,0.45)',
  },
  'Rechazado': {
    bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444',
    darkBg: 'rgba(239,68,68,0.14)', darkColor: '#fecaca', darkBorder: 'rgba(239,68,68,0.45)',
  },
};

const MOTIVO_ICON_MAP_ADMIN = {
  'Libro danado o defectuoso': <IconBook width={14} height={14} />,
  'Producto incorrecto': <IconPackage width={14} height={14} />,
  'No coincide con la descripcion': <IconInfo width={14} height={14} />,
  'Problema con la entrega': <IconTruck width={14} height={14} />,
  'Otro': <IconMessage width={14} height={14} />,
};

const VINOTINTO = '#7A1E3A';
const VINOTINTO_DARK = '#5e1629';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#666';
const WHITE = '#FFFFFF';
const BORDER = '#E0DBD4';
const GREEN = '#2e7d32';
const ORANGE = '#e67e22';
const RED = '#c62828';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconLayoutDashboard },
  { id: 'reportes', label: 'Reportes', Icon: IconTrendingUp },
  { id: 'usuarios', label: 'Usuarios', Icon: IconUser },
  { id: 'libros', label: 'Libros', Icon: IconBook },
  { id: 'tiendas', label: 'Tiendas', Icon: IconStore },
  { id: 'ordenes', label: 'Órdenes', Icon: IconPackage },
  { id: 'finanzas', label: 'Finanzas', Icon: IconWallet },
  { id: 'reclamos', label: 'Quejas y reclamos', Icon: IconAlertTriangle },
  { id: 'soporte', label: 'Soporte técnico', Icon: IconTool },
  { id: 'perfil', label: 'Mi Perfil', Icon: IconSettings },
];

// Ícono de sidebar: tamaño y color fijos, ignora className/defaults de cada ícono
function SidebarIcon(props) {
  const IconComp = props.Icon;
  return (
    <IconComp className="" width={props.size || 20} height={props.size || 20} strokeWidth={2} style={{ color: '#FFFFFF', display: 'block' }} />
  );
}

// ── Componentes auxiliares fuera de AdminDashboard para evitar remontajes al cambiar pestañas ──
const BarraProgreso = React.memo(function BarraProgreso({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#444', textTransform: 'capitalize' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 500 }}>{pct}%</span>
          <span style={{ fontWeight: 800, color, fontSize: '1rem', minWidth: 24, textAlign: 'right' }}>{value}</span>
        </div>
      </div>
      <div style={{ background: '#f0ece9', borderRadius: '20px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: '20px', height: '8px',
          width: `${pct}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 2px 6px ${color}55`,
        }} />
      </div>
    </div>
  );
});

const AvatarUsuario = React.memo(function AvatarUsuario({ usuario, size = 38, fontSize = '0.95rem', border, background, shadow }) {
  const [imgError, setImgError] = useState(false);
  const nombre = usuario?.nombre_usuario || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();
  const rolKey = (usuario?.rol || 'comprador').toLowerCase().trim();
  const defaultBg = rolKey === 'vendedor' ? '#D97706' : rolKey.includes('admin') ? '#7A1E3A' : '#047857';

  const rawFoto = usuario?.foto_perfil || usuario?.foto;
  const fotoUrl = rawFoto && !imgError
    ? (rawFoto.startsWith('http://') || rawFoto.startsWith('https://') ? rawFoto : `${getApiBaseUrl()}/${rawFoto.replace(/^\//, '')}`)
    : null;

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        background: background || `linear-gradient(135deg, ${defaultBg} 0%, ${defaultBg}cc 100%)`,
        color: WHITE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: fontSize,
        flexShrink: 0,
        overflow: 'hidden',
        border: border || 'none',
        boxShadow: shadow || `0 2px 6px ${defaultBg}40`,
        position: 'relative',
      }}
    >
      {fotoUrl ? (
        <img
          src={fotoUrl}
          alt={nombre}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span>{inicial}</span>
      )}
    </div>
  );
});

const CardReclamoAdmin = React.memo(function CardReclamoAdmin({ reclamo, onAbrirChat, onAbrirModal, onVerEvidencia, darkMode = false }) {
  const [expandido, setExpandido] = useState(false);
  const cfg = ESTADO_CONFIG_ADMIN[reclamo.estado] || ESTADO_CONFIG_ADMIN['Cerrado'];
  const motivoIcon = MOTIVO_ICON_MAP_ADMIN[reclamo.asunto] || MOTIVO_ICON_MAP_ADMIN['Otro'];
  const fechaStr = reclamo.fecha_creacion
    ? new Date(reclamo.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const tiempoStr = tiempoTranscurridoAdmin(reclamo.fecha_creacion);
  const imgSrc = reclamo.imagen_libro
    ? (reclamo.imagen_libro.startsWith('http') ? reclamo.imagen_libro : `${getApiBaseUrl()}${reclamo.imagen_libro}`)
    : null;

  return (
    <article
      style={{
        background: darkMode ? '#1e1e1e' : WHITE,
        border: `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 3px 14px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* HEADER BANNER - CLICKABLE PARA DESPLEGAR / ENCOGER */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expandido}
        onClick={() => setExpandido(prev => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpandido(prev => !prev);
          }
        }}
        style={{
          background: darkMode ? '#1e1e1e' : 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
          padding: '16px 20px',
          borderBottom: expandido ? `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="Libro"
              style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
          ) : (
            <div style={{
              width: 50, height: 50, borderRadius: 10, flexShrink: 0,
              background: VINOTINTO, color: WHITE,
              display: 'grid', placeItems: 'center',
              fontSize: '0.78rem', fontWeight: 800,
              boxShadow: '0 2px 8px rgba(122,30,58,0.2)',
            }}>
              #{reclamo.numero || reclamo.id_solicitud}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{ fontSize: '0.78rem', color: darkMode ? '#b8b8b8' : '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Reclamo #{reclamo.numero || reclamo.id_solicitud}
              </span>
              {reclamo.id_orden && (
                <span style={{ background: darkMode ? 'rgba(224,90,122,0.2)' : '#f7e9ee', color: darkMode ? '#e05a7a' : VINOTINTO, padding: '2px 8px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700 }}>
                  Orden #{reclamo.id_orden}
                </span>
              )}
            </div>
            <strong style={{ fontSize: '1rem', color: darkMode ? '#f3f4f6' : CARBON, display: 'block' }}>
              {reclamo.titulo_libro || `Orden #${reclamo.id_orden || reclamo.id_solicitud}`}
              {reclamo.total_items > 1 && (
                <span style={{ fontWeight: 500, color: darkMode ? '#c8c8c8' : GRAY, fontSize: '0.85rem' }}> +{reclamo.total_items - 1} más</span>
              )}
            </strong>
            <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: darkMode ? '#c8c8c8' : GRAY }}>
              Comprador: <strong style={{ color: darkMode ? '#f3f4f6' : CARBON }}>{reclamo.comprador}</strong>
              {reclamo.correo_comprador ? ` (${reclamo.correo_comprador})` : ''} · Tienda: <strong style={{ color: darkMode ? '#e05a7a' : VINOTINTO }}>{reclamo.nombre_tienda || 'BookyHome'}</strong>
            </p>
          </div>
        </div>

        {/* Status Badge + Botón Desplegar/Recoger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: darkMode ? cfg.darkBg : cfg.bg,
            color: darkMode ? cfg.darkColor : cfg.color,
            border: `1px solid ${darkMode ? cfg.darkBorder : cfg.border}`,
            padding: '6px 14px', borderRadius: 20,
            fontSize: '0.82rem', fontWeight: 800,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
            {reclamo.estado}
          </div>

          <span
            aria-hidden="true"
            style={{
              background: expandido
                ? (darkMode ? 'rgba(224,90,122,0.15)' : '#fdf2f4')
                : (darkMode ? '#1e1e1e' : WHITE),
              border: `1.5px solid ${expandido ? (darkMode ? '#e05a7a' : VINOTINTO) : (darkMode ? '#3a3a3a' : BORDER)}`,
              color: expandido ? (darkMode ? '#e05a7a' : VINOTINTO) : (darkMode ? '#f3f4f6' : CARBON),
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <span>{expandido ? 'Recoger' : 'Desplegar'}</span>
            <IconChevronDown
              width={16}
              height={16}
              style={{
                transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
              }}
            />
          </span>
        </div>
      </div>

      {/* BODY CONTENT - SOLO VISIBLE SI ESTÁ DESPLEGADO */}
      {expandido && (
        <div style={{ padding: '20px', display: 'grid', gap: 16 }}>
          {/* Metadata Tags Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {/* Motivo Chip */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: darkMode ? 'rgba(224,90,122,0.15)' : '#fdf2f4', border: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4',
                borderRadius: 20, padding: '5px 12px',
                color: darkMode ? '#e05a7a' : VINOTINTO, fontSize: '0.82rem', fontWeight: 700,
              }}>
                {motivoIcon}
                {reclamo.asunto}
              </div>

              {/* Tienda Chip */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: darkMode ? 'rgba(59,130,246,0.15)' : '#f0f9ff', border: darkMode ? '1px solid #3a3a3a' : '1px solid #bae6fd',
                borderRadius: 20, padding: '5px 12px',
                color: '#0369a1', fontSize: '0.82rem', fontWeight: 700,
              }}>
                <IconStoreAlt width={14} height={14} strokeWidth={1.5} />
                {reclamo.nombre_tienda || 'BookyHome'}
              </div>

              {/* Total Orden */}
              {reclamo.total_orden && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: darkMode ? 'rgba(16,185,129,0.15)' : '#f0fdf4', border: darkMode ? '1px solid #3a3a3a' : '1px solid #bbf7d0',
                  borderRadius: 20, padding: '5px 12px',
                  color: darkMode ? '#34d399' : '#166534', fontSize: '0.82rem', fontWeight: 700,
                }}>
                  <IconDollar width={13} height={13} strokeWidth={2} />
                  ${Number(reclamo.total_orden).toLocaleString('es-CO')}
                </div>
              )}

              {/* Fecha */}
              {fechaStr && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: darkMode ? '#252525' : '#fafafa', border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                  borderRadius: 20, padding: '5px 12px',
                  color: darkMode ? '#c8c8c8' : GRAY, fontSize: '0.8rem', fontWeight: 600,
                }}>
                  📅 {fechaStr}
                </div>
              )}
            </div>

            {tiempoStr && (
              <span style={{ fontSize: '0.78rem', color: darkMode ? '#b8b8b8' : '#999', fontWeight: 600 }}>
                {tiempoStr}
              </span>
            )}
          </div>

          {/* Customer Description */}
          {reclamo.descripcion && (
            <div style={{ background: darkMode ? '#252525' : '#fafafa', border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.78rem', fontWeight: 700, color: darkMode ? '#c8c8c8' : GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Detalle del reclamo por el cliente:
              </p>
              <p style={{ margin: 0, color: darkMode ? '#f3f4f6' : CARBON, fontSize: '0.94rem', lineHeight: 1.6 }}>
                {reclamo.descripcion}
              </p>
            </div>
          )}

          {/* Evidencia Adjunta */}
          {reclamo.evidencia_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: darkMode ? 'rgba(224,90,122,0.15)' : '#fdf8f9', border: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4', borderRadius: 12, padding: '12px 16px' }}>
              <img
                src={`${getApiBaseUrl()}${reclamo.evidencia_url}`}
                alt="Evidencia thumbnail"
                onClick={() => onVerEvidencia(`${getApiBaseUrl()}${reclamo.evidencia_url}`)}
                style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
              />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.88rem', color: darkMode ? '#e05a7a' : VINOTINTO, display: 'block' }}>Evidencia gráfica adjunta</strong>
                <span style={{ fontSize: '0.8rem', color: darkMode ? '#c8c8c8' : GRAY }}>Haz clic para ampliar la imagen adjunta por el usuario.</span>
              </div>
              <button
                onClick={() => onVerEvidencia(`${getApiBaseUrl()}${reclamo.evidencia_url}`)}
                className="btn-reclamo-evidencia"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                }}
              >
                <IconEye width={15} height={15} /> Ver evidencia
              </button>
            </div>
          )}

          {/* Admin Previous Response */}
          {reclamo.respuesta && (
            <div style={{
              padding: '14px 18px',
              background: darkMode ? '#252525' : 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
              borderRadius: 12,
              borderLeft: `4px solid ${VINOTINTO}`,
              borderTop: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4',
              borderRight: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4',
              borderBottom: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4',
            }}>
              <strong style={{ color: darkMode ? '#e05a7a' : VINOTINTO, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                <IconMessage width={15} height={15} /> Respuesta actual del administrador:
              </strong>
              <p style={{ margin: 0, color: darkMode ? '#c8c8c8' : '#444', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {reclamo.respuesta}
              </p>
            </div>
          )}

          {/* ACTION FOOTER BUTTONS */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 16,
            borderTop: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`,
          }}>
            {/* Botón de Contacto / Chat con la tienda */}
            <button
              onClick={() => onAbrirChat(reclamo)}
              className="btn-reclamo-chat"
              style={{
                borderRadius: 10,
                padding: '10px 18px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(122,30,58,0.06)',
              }}
            >
              <IconStoreAlt width={17} height={17} strokeWidth={1.8} />
              Contactar / Chat con la tienda
            </button>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => onAbrirModal(reclamo, 'En revisión')}
                className="btn-reclamo-revision"
                style={{
                  borderRadius: 10,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IconTool width={16} height={16} />
                Marcar En revisión
              </button>

              <button
                onClick={() => onAbrirModal(reclamo, 'Rechazado')}
                className="btn-reclamo-rechazar"
                style={{
                  borderRadius: 10,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IconBan width={16} height={16} />
                Rechazar reclamo
              </button>

              <button
                onClick={() => onAbrirModal(reclamo, 'Resuelto')}
                className="btn-reclamo-resolver"
                style={{
                  borderRadius: 10,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(122,30,58,0.2)',
                }}
              >
                <IconCheck width={16} height={16} strokeWidth={2.5} />
                Resolver reclamo
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
});

const CardSoporteAdmin = React.memo(function CardSoporteAdmin({ ticket, onAbrirModal, darkMode = false }) {
  const estadoCfg = ESTADO_CONFIG_ADMIN[ticket.estado] || ESTADO_CONFIG_ADMIN['Cerrado'];
  const fechaStr = ticket.fecha_creacion
    ? new Date(ticket.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const fotoUrl = ticket.foto_comprador
    ? (ticket.foto_comprador.startsWith('http') ? ticket.foto_comprador : `${getApiBaseUrl()}/${ticket.foto_comprador.replace(/^\//, '')}`)
    : null;

  return (
    <article
      className="admin-soporte-card"
      style={{
        borderRadius: 16,
        border: darkMode ? '1.5px solid #3a3a3a' : '1.5px solid #eee3e9',
        borderLeft: `6px solid ${estadoCfg.dot}`,
        overflow: 'hidden',
        background: darkMode ? '#1e1e1e' : WHITE,
        boxShadow: '0 3px 14px rgba(122,30,58,0.09)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
    >
      {/* Header de la card */}
      <div
        style={{
          background: darkMode ? '#1e1e1e' : 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
          padding: '16px 20px',
          borderBottom: darkMode ? '1.5px solid #3a3a3a' : '1.5px solid #f0e8ec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{
            position: 'relative',
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)', color: WHITE,
            display: 'grid', placeItems: 'center',
            fontSize: '0.85rem', fontWeight: 800,
            border: '2px solid #fff',
            boxShadow: '0 0 0 1.5px #ecdce3, 0 4px 12px rgba(122,30,58,0.22)',
          }}>
            {(ticket.comprador || '?').charAt(0).toUpperCase()}
            {fotoUrl && (
              <img
                src={fotoUrl}
                alt={ticket.comprador || 'Usuario'}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)', color: WHITE,
                borderRadius: 7, padding: '3px 11px',
                fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.04em',
                boxShadow: '0 2px 8px rgba(122,30,58,0.3)',
                whiteSpace: 'nowrap',
              }}>
                TICKET #{ticket.numero || ticket.id_solicitud}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: darkMode ? '#1e1e1e' : WHITE, border: darkMode ? '1.5px solid #3a3a3a' : '1.5px solid #ecdce3', color: darkMode ? '#e05a7a' : VINOTINTO,
                borderRadius: 7, padding: '2px 10px',
                fontSize: '0.73rem', fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>
                <IconUser width={12} height={12} strokeWidth={2} />
                {(ticket.rol_usuario || '').toLowerCase() === 'vendedor' ? 'Vendedor' : 'Comprador'}
              </span>
            </div>
            <strong style={{ fontSize: '1rem', color: darkMode ? '#f3f4f6' : CARBON, fontWeight: 800, display: 'block', lineHeight: 1.35 }}>
              {ticket.comprador}
            </strong>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: darkMode ? estadoCfg.darkBg : estadoCfg.bg,
            color: darkMode ? estadoCfg.darkColor : estadoCfg.color,
            border: `1px solid ${darkMode ? estadoCfg.darkBorder : estadoCfg.border}`,
            padding: '5px 12px', borderRadius: 20,
            fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: estadoCfg.dot, display: 'inline-block' }} />
            {ticket.estado}
          </span>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '16px 20px', display: 'grid', gap: 14 }}>
        {/* Metadata */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: darkMode ? 'rgba(224,90,122,0.15)' : '#fdf2f4', border: darkMode ? '1px solid #3a3a3a' : '1px solid #f0dde4',
            borderRadius: 20, padding: '5px 12px',
            color: darkMode ? '#e05a7a' : VINOTINTO, fontSize: '0.8rem', fontWeight: 700,
          }}>
            <IconTool width={13} height={13} />
            {ticket.categoria || 'Soporte'}
          </div>
          {ticket.correo_comprador && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: darkMode ? 'rgba(59,130,246,0.15)' : '#f0f9ff', border: darkMode ? '1px solid #3a3a3a' : '1px solid #bae6fd',
              borderRadius: 20, padding: '5px 12px',
              color: '#0369a1', fontSize: '0.78rem', fontWeight: 600,
            }}>
              <IconMail width={13} height={13} />
              {ticket.correo_comprador}
            </div>
          )}
          {fechaStr && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: darkMode ? '#252525' : '#f9fafb', border: darkMode ? '1px solid #3a3a3a' : '1px solid #e5e7eb',
              borderRadius: 20, padding: '5px 12px',
              color: '#6b7280', fontSize: '0.78rem', fontWeight: 600,
            }}>
              📅 {fechaStr}
            </div>
          )}
        </div>

        {/* Asunto y descripción */}
        <div style={{ padding: '12px 14px', background: darkMode ? '#252525' : '#fafafa', borderRadius: 10, border: darkMode ? '1px solid #3a3a3a' : '1px solid #f0f0f0' }}>
          <p style={{ margin: 0, color: darkMode ? '#c8c8c8' : '#555', lineHeight: 1.65, fontSize: '0.92rem' }}>
            <span style={{ fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON, display: 'block', marginBottom: 4, fontSize: '0.82rem' }}>
              {ticket.asunto}
            </span>
            {ticket.descripcion}
          </p>
        </div>

        {/* Respuesta del admin */}
        {ticket.respuesta && (
          <div style={{
            padding: '14px 16px',
            background: darkMode ? '#252525' : 'linear-gradient(135deg, #fdf8f9 0%, #f9f0f3 100%)',
            borderRadius: 12, borderLeft: '4px solid #7A1E3A',
          }}>
            <p style={{ margin: '0 0 6px', color: darkMode ? '#e05a7a' : VINOTINTO, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <IconMessage width={14} height={14} />
              Respuesta del administrador
            </p>
            <p style={{ margin: 0, color: darkMode ? '#c8c8c8' : '#444', lineHeight: 1.65, fontSize: '0.92rem' }}>{ticket.respuesta}</p>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
          <button
            onClick={() => onAbrirModal(ticket, 'En revisión')}
            className="btn-soporte-revision"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              border: darkMode ? '1.5px solid #3a3a3a' : '1.5px solid #fdba74', background: darkMode ? '#1e1e1e' : WHITE, color: darkMode ? '#fb923c' : '#c2410c',
              borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem',
            }}
          >
            <IconEye width={15} height={15} />
            Marcar en revisión
          </button>
          <button
            onClick={() => onAbrirModal(ticket, 'Rechazado')}
            className="btn-soporte-rechazar"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              border: darkMode ? '1.5px solid #3a3a3a' : '1.5px solid #fca5a5', background: darkMode ? 'rgba(220,38,38,0.15)' : '#fef2f2', color: darkMode ? '#fca5a5' : '#dc2626',
              borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem',
            }}
          >
            <IconBan width={15} height={15} />
            Rechazar ticket
          </button>
          <button
            onClick={() => onAbrirModal(ticket, 'Resuelto')}
            className="btn-soporte-resolver"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              border: 'none',
              background: `linear-gradient(135deg, ${VINOTINTO} 0%, #9b2c4e 100%)`,
              color: WHITE, borderRadius: 8, padding: '10px 22px', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(122,30,58,0.25)',
            }}
          >
            <IconCheck width={15} height={15} strokeWidth={2.5} />
            Resolver y notificar
          </button>
        </div>
      </div>
    </article>
  );
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode_admin') === 'true');

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode_admin') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleDarkChange = (e) => {
      if (e?.detail?.role && e.detail.role !== 'admin') return;
      const mode = localStorage.getItem('darkMode_admin') === 'true';
      setDarkMode(mode);
      if (mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    window.addEventListener('darkModeChange', handleDarkChange);
    window.addEventListener('storage', handleDarkChange);
    return () => {
      window.removeEventListener('darkModeChange', handleDarkChange);
      window.removeEventListener('storage', handleDarkChange);
    };
  }, []);

  const [stats, setStats] = useState({ usuarios: 0, libros: 0, ordenes: 0, tiendas: 0 });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [reclamos, setReclamos] = useState([]);
  const [soporte, setSoporte] = useState([]);
  const [vistaSoporte, setVistaSoporte] = useState('compradores');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReclamo, setModalReclamo] = useState(null);
  const [modalRespuesta, setModalRespuesta] = useState('');
  const [evidenciaPreview, setEvidenciaPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [paginaLibros, setPaginaLibros] = useState(1);
  const [paginaTiendas, setPaginaTiendas] = useState(1);
  const [paginaReclamos, setPaginaReclamos] = useState(1);
  const [paginaSoporte, setPaginaSoporte] = useState(1);
  const [filtroEstadoReclamos, setFiltroEstadoReclamos] = useState('Todos');
  const [busquedaReclamos, setBusquedaReclamos] = useState('');
  const [chatModalReclamo, setChatModalReclamo] = useState(null);
  const [chatEnvio, setChatEnvio] = useState(null);
  const [dropdownTiendaAbierto, setDropdownTiendaAbierto] = useState(null);
  const [modalConfirmEstado, setModalConfirmEstado] = useState(null); // { idTienda, nuevoEstado, nombreTienda }
  const [motivoSuspension, setMotivoSuspension] = useState('');
  const [errorMotivoSuspension, setErrorMotivoSuspension] = useState('');
  const [guardandoEstadoTienda, setGuardandoEstadoTienda] = useState(false);
  const [busquedaTiendas, setBusquedaTiendas] = useState('');
  const [filtroEstadoTienda, setFiltroEstadoTienda] = useState('todos');
  const [busquedaOrdenes, setBusquedaOrdenes] = useState('');
  const [filtroEstadoOrden, setFiltroEstadoOrden] = useState('todos');
  const [paginaOrdenes, setPaginaOrdenes] = useState(1);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState('todos');
  const [modalConfirmBloqueo, setModalConfirmBloqueo] = useState(null); // { usuario, bloqueado }
  const [modalDetalleUsuario, setModalDetalleUsuario] = useState(null);
  const [bloqueandoUsuario, setBloqueandoUsuario] = useState(false);
  const [copiadoId, setCopiadoId] = useState(null);
  const [modalDetalleOrden, setModalDetalleOrden] = useState(null);
  const [itemsDetalleOrden, setItemsDetalleOrden] = useState([]);
  const [cargandoItemsOrden, setCargandoItemsOrden] = useState(false);

  const abrirDetalleOrden = async (orden) => {
    setModalDetalleOrden(orden);
    setCargandoItemsOrden(true);
    try {
      const res = await api.get(`/api/v1/admin/orders/${orden.id_orden}/items`);
      setItemsDetalleOrden(res.data || []);
    } catch (err) {
      console.error('Error cargando items de la orden:', err);
      setItemsDetalleOrden([]);
    } finally {
      setCargandoItemsOrden(false);
    }
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!dropdownTiendaAbierto) return;
    const cerrar = () => setDropdownTiendaAbierto(null);
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, [dropdownTiendaAbierto]);
  const [chatMensajes, setChatMensajes] = useState([]);
  const [chatNuevoMensaje, setChatNuevoMensaje] = useState('');
  const [cargandoChat, setCargandoChat] = useState(false);
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [perfilSidebar, setPerfilSidebar] = useState({ nombre: '', correo: '', foto: null, bannerUrl: null, bannerColor: '#7A1E3A' });

  useEffect(() => {
    const cargarPerfilSidebar = async () => {
      try {
        const res = await api.get('/perfil/mi-perfil');
        if (!res.data) return;
        const base = getApiBaseUrl();
        setPerfilSidebar({
          nombre: res.data.nombre_usuario || 'Administrador',
          correo: res.data.correo_usuario || '',
          foto: res.data.foto_perfil ? `${base}/${res.data.foto_perfil.replace(/^\//, '')}` : null,
          bannerUrl: res.data.banner_perfil ? `${base}/${res.data.banner_perfil.replace(/^\//, '')}` : null,
          bannerColor: res.data.banner_perfil ? null : (res.data.banner_color || '#7A1E3A'),
        });
      } catch (error) {
        console.error('Error cargando perfil del sidebar:', error);
      }
    };
    void cargarPerfilSidebar();

    const handlePhotoUpdate = (e) => {
      if (e.detail?.url) setPerfilSidebar(p => ({ ...p, foto: e.detail.url }));
    };
    const handleBannerUpdate = (e) => {
      if (e.detail?.bannerUrl) setPerfilSidebar(p => ({ ...p, bannerUrl: e.detail.bannerUrl, bannerColor: null }));
      else if (e.detail?.bannerColor) setPerfilSidebar(p => ({ ...p, bannerColor: e.detail.bannerColor, bannerUrl: null }));
    };
    window.addEventListener('profile-photo-updated', handlePhotoUpdate);
    window.addEventListener('profile-banner-updated', handleBannerUpdate);
    return () => {
      window.removeEventListener('profile-photo-updated', handlePhotoUpdate);
      window.removeEventListener('profile-banner-updated', handleBannerUpdate);
    };
  }, []);

  const abrirChatReclamo = async (reclamo) => {
    setChatModalReclamo(reclamo);
    setChatEnvio(null);
    setCargandoChat(true);
    try {
      const res = await api.get(`/quejas/${reclamo.id_solicitud}/mensajes`);
      setChatMensajes(res.data || []);
    } catch { setChatMensajes([]); }
    if (reclamo.id_orden) {
      try {
        const resEnvio = await api.get(`/envios/orden/${reclamo.id_orden}`);
        setChatEnvio(resEnvio.data?.envio || null);
      } catch { setChatEnvio(null); }
    }
    setCargandoChat(false);
  };

  const enviarMensajeChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatNuevoMensaje.trim() || !chatModalReclamo) return;
    setEnviandoMensaje(true);
    try {
      await api.post(`/quejas/${chatModalReclamo.id_solicitud}/mensajes`, { mensaje: chatNuevoMensaje.trim() });
      setChatNuevoMensaje('');
      const res = await api.get(`/quejas/${chatModalReclamo.id_solicitud}/mensajes`);
      setChatMensajes(res.data || []);
      notify('Mensaje enviado a la tienda y comprador', 'success');
      void cargarReclamos();
    } catch (err) {
      notify(err.response?.data?.detail || 'No se pudo enviar el mensaje', 'error');
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const handleAbrirChat = useCallback((reclamo) => {
    void abrirChatReclamo(reclamo);
  }, []);

  const handleAbrirModal = useCallback((reclamo, estado) => {
    abrirModal(reclamo, estado);
  }, []);

  const handleVerEvidencia = useCallback((url) => {
    setEvidenciaPreview(url);
  }, []);

  const registrosPorPagina = 10;

  const cargarSolicitudes = useCallback(async () => {
    try {
      const res = await api.get('/quejas/admin/todas');
      const data = res.data || [];
      setReclamos(data);
      setSoporte(data);
    } catch (error) {
      console.error('Error cargando solicitudes admin:', error);
    }
  }, []);

  const cargarReclamos = cargarSolicitudes;
  const cargarSoporte = cargarSolicitudes;

  // Sincronización en segundo plano sin interrumpir ni recargar al cambiar secciones
  useEffect(() => {
    const refrescar = () => {
      void cargarSolicitudes();
    };
    window.addEventListener('bookyhome-complaint-updated', refrescar);
    const intervalId = window.setInterval(refrescar, 10000);
    return () => {
      window.removeEventListener('bookyhome-complaint-updated', refrescar);
      window.clearInterval(intervalId);
    };
  }, [cargarSolicitudes]);

  // Recargar solicitudes inmediatamente al entrar a reclamos o soporte
  useEffect(() => {
    if (activeSection === 'reclamos' || activeSection === 'soporte') {
      void cargarSolicitudes();
    }
  }, [activeSection, cargarSolicitudes]);

  const abrirModal = (reclamo, estado) => {
    if (!reclamo) return;
    setModalReclamo({ ...reclamo, estado: estado || 'Resuelto' });
    setModalRespuesta(reclamo.respuesta || '');
    setModalOpen(true);
  };

  const resolverReclamo = async () => {
    if (!modalReclamo?.id_solicitud) {
      notify('No se ha seleccionado ninguna solicitud', 'error');
      return;
    }
    const respuesta = modalRespuesta?.trim() || '';
    if (respuesta.length < 3) {
      notify('La respuesta debe tener al menos 3 caracteres', 'error');
      return;
    }
    try {
      const estadoFinal = modalReclamo.estado || 'Resuelto';
      await api.patch(`/quejas/admin/${modalReclamo.id_solicitud}`, {
        estado: estadoFinal,
        respuesta
      });
      notify('Solicitud actualizada y usuario notificado', 'success');
      setModalOpen(false);
      setModalReclamo(null);
      setModalRespuesta('');
      void cargarSolicitudes();
    } catch (error) {
      notify(error.response?.data?.detail || error.message || 'No se pudo resolver la solicitud', 'error');
    }
  };

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'admin') {
      void navigate('/');
      return;
    }

    const cargarDatos = async () => {
      try {
        const [usuariosRes, librosRes, ordenesRes, tiendasRes, quejasRes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/api/stored/libros', { params: { admin: true } }),
          api.get('/api/v1/admin/orders'),
          api.get('/tiendas'),
          api.get('/quejas/admin/todas'),
        ]);
        const usrData = usuariosRes.data || [];
        const libData = librosRes.data || [];
        const ordData = ordenesRes.data || [];
        const tieData = tiendasRes.data || [];
        const quejasData = quejasRes.data || [];

        setUsuarios(usrData);
        setLibros(libData);
        setOrdenes(ordData);
        setTiendas(tieData);
        setReclamos(quejasData);
        setSoporte(quejasData);
        setStats({
          usuarios: usrData.length,
          libros: libData.length,
          ordenes: ordData.length,
          tiendas: tieData.length,
        });
      } catch (error) {
        console.error('Error cargando datos admin:', error);
        notify('Error cargando datos del panel. Verifica la consola.', 'error');
      } finally {
        setLoading(false);
      }
    };

    void cargarDatos();
  }, [navigate]);

  const ocultarLibro = async (idLibro, estadoOcultoActual) => {
    try {
      const token = localStorage.getItem('token');
      const nuevoEstadoBooleano = estadoOcultoActual === 1 ? false : true;

      await api.patch(`/libros/${idLibro}/ocultar`,
        { oculto: nuevoEstadoBooleano },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLibros((librosActuales) =>
        librosActuales.map((l) =>
          l.id_libro === idLibro ? { ...l, oculto: nuevoEstadoBooleano ? 1 : 0 } : l
        )
      );

      notify('Visibilidad del libro actualizada', 'success');
    } catch (error) {
      console.error("Error en ocultar:", error);
      notify('Error al cambiar la visibilidad del libro', 'error');
    }
  };

  const eliminarLibro = async (id_libro) => {
    if (!window.confirm('¿Seguro que quieres eliminar este libro?')) return;
    try {
      const token = localStorage.getItem('token');

      const res = await api.delete(`/libros/${id_libro}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.modo === 'ocultado') {
        setLibros(libros.map((l) =>
          l.id_libro === id_libro ? { ...l, oculto: 1 } : l
        ));
        notify(res.data.mensaje || 'El libro tiene compras registradas, se ocultó en vez de eliminarse', 'info');
      } else {
        setLibros(libros.filter((l) => l.id_libro !== id_libro));
        setStats((prev) => ({ ...prev, libros: prev.libros - 1 }));
        notify('Libro eliminado con éxito', 'success');
      }
    } catch (error) {
      console.error("Error en eliminar:", error);
      const mensajeError = error.response?.data?.detail || 'Error al eliminar el libro';
      notify(mensajeError, 'error');
    }
  };

  const MOTIVOS_SUSPENSION_PREDEFINIDOS = [
    'Incumplimiento de las políticas y términos de servicio de la plataforma.',
    'Publicaciones de libros no autorizadas, fraudulentas o piratería.',
    'Reclamos reiterados de compradores sin respuesta ni solución.',
    'Sospecha de actividad irregular, fraude o suplantación de identidad.',
    'Información de contacto, ubicación o documentos de tienda inválidos.',
  ];

  const ESTADOS_TIENDA = [
    { value: 'activa',     label: 'Activa',         color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
    { value: 'pendiente',  label: 'Pendiente',       color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    { value: 'vacaciones', label: 'En Vacaciones',   color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    { value: 'suspendida', label: 'Suspendida',       color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
    { value: 'inactiva',   label: 'Inactiva',         color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  ];

  const manejarEstadoTienda = (idTienda, nuevoEstado, nombreTienda) => {
    setDropdownTiendaAbierto(null);
    setMotivoSuspension('');
    setErrorMotivoSuspension('');
    setModalConfirmEstado({ idTienda, nuevoEstado, nombreTienda });
  };

  const confirmarCambioEstado = async () => {
    if (!modalConfirmEstado) return;
    const { idTienda, nuevoEstado } = modalConfirmEstado;
    const cfg = ESTADOS_TIENDA.find(e => e.value === nuevoEstado);

    if (nuevoEstado === 'suspendida' && !motivoSuspension.trim()) {
      setErrorMotivoSuspension('Debes ingresar o seleccionar un motivo para suspender la librería.');
      return;
    }

    setGuardandoEstadoTienda(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { estado: nuevoEstado };
      if (nuevoEstado === 'suspendida') {
        payload.motivo = motivoSuspension.trim();
      }

      await api.patch(`/tiendas/${idTienda}/estado`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTiendas((prev) =>
        prev.map((t) =>
          t.id_tienda === idTienda ? { ...t, estado_tienda: nuevoEstado } : t
        )
      );

      if (nuevoEstado === 'suspendida') {
        notify('Librería suspendida y notificación enviada al chat del vendedor', 'success');
      } else {
        notify(`Librería actualizada a: ${cfg?.label || nuevoEstado}`, 'success');
      }
      setModalConfirmEstado(null);
    } catch (error) {
      notify(error.response?.data?.detail || 'Error al cambiar el estado', 'error');
    } finally {
      setGuardandoEstadoTienda(false);
    }
  };

  const abrirModalBloqueo = (usuario) => {
    const esBloqueado = (usuario.estado_usuario || '').toLowerCase() === 'bloqueado';
    setModalConfirmBloqueo({ usuario, bloqueado: !esBloqueado });
  };

  const ejecutarBloqueoUsuario = async () => {
    if (!modalConfirmBloqueo) return;
    const { usuario, bloqueado } = modalConfirmBloqueo;
    setBloqueandoUsuario(true);
    try {
      await api.patch(`/usuarios/${usuario.id_usuario}/bloquear`, { bloqueado });
      const nuevoEstado = bloqueado ? 'Bloqueado' : 'Activo';
      setUsuarios((prev) =>
        prev.map((us) =>
          us.id_usuario === usuario.id_usuario
            ? { ...us, estado_usuario: nuevoEstado }
            : us
        )
      );
      if (modalDetalleUsuario && modalDetalleUsuario.id_usuario === usuario.id_usuario) {
        setModalDetalleUsuario((prev) => ({ ...prev, estado_usuario: nuevoEstado }));
      }
      notify(
        bloqueado
          ? `Usuario "${usuario.nombre_usuario}" bloqueado exitosamente.`
          : `Usuario "${usuario.nombre_usuario}" reactivado exitosamente.`,
        'success'
      );
      setModalConfirmBloqueo(null);
    } catch (err) {
      console.error(err);
      notify('Error al cambiar el estado del usuario', 'error');
    } finally {
      setBloqueandoUsuario(false);
    }
  };

  const copiarTexto = (texto, id) => {
    if (!texto) return;
    void navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    notify('Correo copiado al portapapeles', 'info');
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const categoriaCount = useMemo(() => {
    return libros.reduce((acc, l) => {
      const cat = l.nombre_categoria || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
  }, [libros]);

  const hoyStr = useMemo(() => new Date().toLocaleDateString('es-CO'), []);

  const ordenesHoy = useMemo(() => {
    return ordenes.filter((o) => {
      if (!o.fecha) return false;
      return new Date(o.fecha).toLocaleDateString('es-CO') === hoyStr;
    }).length;
  }, [ordenes, hoyStr]);

  const { compradoresCount, vendedoresCount, adminsCount } = useMemo(() => {
    let comp = 0, vend = 0, adm = 0;
    for (const u of usuarios) {
      const r = (u.rol || '').toLowerCase();
      if (r === 'admin' || r === 'administrador') adm++;
      else if (r.includes('vend')) vend++;
      else comp++;
    }
    return { compradoresCount: comp, vendedoresCount: vend, adminsCount: adm };
  }, [usuarios]);

  const { tiendasActivasCount, tiendasPendientesCount, tiendasSuspendidasCount } = useMemo(() => {
    let act = 0, pend = 0, susp = 0;
    for (const t of tiendas) {
      const e = (t.estado_tienda || '').toLowerCase().trim();
      if (['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes(e)) act++;
      else if (['pendiente', 'en revision', 'en revisión', 'por revisar'].includes(e)) pend++;
      else if (['suspendida', 'suspendido', 'inactiva', 'inactivo', 'pausada', 'pausado'].includes(e)) susp++;
    }
    return { tiendasActivasCount: act, tiendasPendientesCount: pend, tiendasSuspendidasCount: susp };
  }, [tiendas]);

  const librosActivosCount = useMemo(() => libros.filter(l => !l.oculto).length, [libros]);
  const totalCategorias = useMemo(() => Object.keys(categoriaCount).length, [categoriaCount]);

  const { reclamosPendientes, reclamosPendientesCount, soportePendientesCountDash } = useMemo(() => {
    const estaPendiente = (estado) => ['abierto', 'en revision', 'en revisión'].includes((estado || '').toLowerCase().trim());
    const esReclamo = (tipo) => ['reclamo', 'queja', 'quejas'].includes((tipo || '').toLowerCase().trim());
    const recPend = reclamos.filter(r => esReclamo(r.tipo_solicitud) && estaPendiente(r.estado));
    const sopPend = reclamos.filter(r => !esReclamo(r.tipo_solicitud) && estaPendiente(r.estado)).length;
    return {
      reclamosPendientes: recPend,
      reclamosPendientesCount: recPend.length,
      soportePendientesCountDash: sopPend
    };
  }, [reclamos]);

  const ordenesCompletadas = useMemo(() => {
    return ordenes.filter(o => ['completada', 'entregado', 'entregada', 'finalizada'].includes((o.estado || o.estado_orden || '').toLowerCase())).length;
  }, [ordenes]);

  const getIniciales = (nombre) => {
    if (!nombre) return 'US';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  };

  const getRolBadgeProps = (rol) => {
    const r = (rol || '').toLowerCase();
    if (r === 'admin' || r === 'administrador') {
      return {
        bg: '#FDF2F4',
        color: VINOTINTO,
        border: '#F8D2DA',
        label: 'Administrador',
        avatarGradient: 'linear-gradient(135deg, #7A1E3A 0%, #a32d52 100%)',
      };
    }
    if (r === 'vendedor') {
      return {
        bg: '#FFFBEB',
        color: '#B45309',
        border: '#FDE68A',
        label: 'Vendedor',
        avatarGradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
      };
    }
    return {
      bg: '#ECFDF5',
      color: '#047857',
      border: '#A7F3D0',
      label: 'Comprador',
      avatarGradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    };
  };

  const getEstadoTiendaBadgeProps = (estado) => {
    const e = (estado || '').toLowerCase().trim();
    if (['activa', 'activo', 'habilitada', 'habilitado', 'aprobada', 'aprobado'].includes(e)) {
      return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981', label: 'Activa' };
    }
    if (['pendiente', 'en revision', 'en revisión', 'por revisar'].includes(e)) {
      return { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B', label: 'Pendiente' };
    }
    if (['pausada', 'pausado', 'vacaciones', 'en vacaciones'].includes(e)) {
      return { bg: '#FFF7ED', color: '#C2410C', border: '#FDBA74', dot: '#EA580C', label: 'En Vacaciones' };
    }
    if (['suspendida', 'suspendido'].includes(e)) {
      return { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444', label: 'Suspendida' };
    }
    return { bg: '#FDF2F4', color: '#7A1E3A', border: '#F8D2DA', dot: '#9B2C4E', label: 'Inactiva' };
  };

  const sectionTitles = {
    dashboard: 'Dashboard Global',
    reportes: 'Sistema de Reportes',
    usuarios: 'Gestión de Usuarios',
    libros: 'Gestión de Libros',
    tiendas: 'Gestión de Tiendas',
    ordenes: 'Gestión de Órdenes',
    finanzas: 'BookyPago Finanzas',
    reclamos: 'Quejas y Reclamos',
    soporte: 'Soporte Técnico',
  };
  const ActiveIcon = NAV_ITEMS.find((i) => i.id === activeSection)?.Icon;
  const reclamosClientes = useMemo(() => reclamos.filter((item) => item.tipo_solicitud === 'reclamo'), [reclamos]);
  const soporteCompradores = useMemo(() => soporte.filter((item) => item.tipo_solicitud === 'soporte' && (item.rol_usuario || '').toLowerCase() === 'comprador'), [soporte]);
  const soporteVendedores = useMemo(() => soporte.filter((item) => item.tipo_solicitud === 'soporte' && (item.rol_usuario || '').toLowerCase() === 'vendedor'), [soporte]);
  const soporteMostrado = vistaSoporte === 'compradores' ? soporteCompradores : soporteVendedores;

  // USUARIOS MEMOIZADOS
  const usuariosFiltrados = useMemo(() => {
    const q = (busquedaUsuarios || '').toLowerCase().trim();
    return usuarios.filter((u) => {
      const r = (u.rol || '').toLowerCase();
      const cumpleRol =
        filtroRol === 'todos' ||
        (filtroRol === 'admin' && (r === 'admin' || r === 'administrador')) ||
        (filtroRol === 'vendedor' && r.includes('vend')) ||
        (filtroRol === 'comprador' && r.includes('comp'));

      const estado = (u.estado_usuario || 'Activo').toLowerCase();
      const cumpleEstado =
        filtroEstadoUsuario === 'todos' ||
        (filtroEstadoUsuario === 'Activo' && estado === 'activo') ||
        (filtroEstadoUsuario === 'Bloqueado' && estado === 'bloqueado');

      const cumpleBusqueda =
        !q ||
        (u.nombre_usuario || '').toLowerCase().includes(q) ||
        (u.correo_usuario || '').toLowerCase().includes(q) ||
        String(u.id_usuario).includes(q) ||
        (u.telefono || '').toLowerCase().includes(q);

      return cumpleRol && cumpleEstado && cumpleBusqueda;
    });
  }, [usuarios, filtroRol, filtroEstadoUsuario, busquedaUsuarios]);

  const totalPaginasUsuarios = useMemo(() => {
    return Math.ceil(usuariosFiltrados.length / registrosPorPagina) || 1;
  }, [usuariosFiltrados.length]);

  const usuariosPaginados = useMemo(() => {
    return usuariosFiltrados.slice(
      (paginaUsuarios - 1) * registrosPorPagina,
      paginaUsuarios * registrosPorPagina
    );
  }, [usuariosFiltrados, paginaUsuarios]);

  // LIBROS MEMOIZADOS
  const librosFiltrados = useMemo(() => {
    return libros.filter(
      l => filtroCategoria === 'todas' || l.nombre_categoria === filtroCategoria
    );
  }, [libros, filtroCategoria]);

  const totalPaginasLibros = useMemo(() => {
    return Math.ceil(librosFiltrados.length / registrosPorPagina) || 1;
  }, [librosFiltrados.length]);

  const librosPaginados = useMemo(() => {
    return librosFiltrados.slice(
      (paginaLibros - 1) * registrosPorPagina,
      paginaLibros * registrosPorPagina
    );
  }, [librosFiltrados, paginaLibros]);

  // TIENDAS MEMOIZADAS (con búsqueda y filtro)
  const tiendasFiltradas = useMemo(() => {
    const q = (busquedaTiendas || '').toLowerCase().trim();
    return tiendas.filter((t) => {
      const cumpleEstado = filtroEstadoTienda === 'todos' || (t.estado_tienda || '').toLowerCase() === filtroEstadoTienda;
      if (!q) return cumpleEstado;
      const matchTexto =
        (t.nombre_tienda || '').toLowerCase().includes(q) ||
        (t.direccion || '').toLowerCase().includes(q) ||
        (t.telefono || '').toLowerCase().includes(q) ||
        String(t.id_tienda || '').includes(q);
      return cumpleEstado && matchTexto;
    });
  }, [tiendas, busquedaTiendas, filtroEstadoTienda]);

  const totalPaginasTiendas = useMemo(() => {
    return Math.ceil(tiendasFiltradas.length / registrosPorPagina) || 1;
  }, [tiendasFiltradas.length]);

  const tiendasPaginadas = useMemo(() => {
    return tiendasFiltradas.slice(
      (paginaTiendas - 1) * registrosPorPagina,
      paginaTiendas * registrosPorPagina
    );
  }, [tiendasFiltradas, paginaTiendas]);

  // RECLAMOS MEMOIZADOS
  const reclamosFiltrados = useMemo(() => {
    const q = (busquedaReclamos || '').toLowerCase().trim();
    return reclamosClientes.filter((r) => {
      const matchEstado = filtroEstadoReclamos === 'Todos' || r.estado === filtroEstadoReclamos;
      if (!q) return matchEstado;
      const matchTexto =
        (r.comprador || '').toLowerCase().includes(q) ||
        (r.nombre_tienda || '').toLowerCase().includes(q) ||
        (r.asunto || '').toLowerCase().includes(q) ||
        (r.descripcion || '').toLowerCase().includes(q) ||
        String(r.id_solicitud || '').includes(q) ||
        String(r.id_orden || '').includes(q) ||
        (r.titulo_libro || '').toLowerCase().includes(q);
      return matchEstado && matchTexto;
    });
  }, [reclamosClientes, filtroEstadoReclamos, busquedaReclamos]);

  const conteoReclamosPorEstado = useMemo(() => {
    let abiertos = 0, enRevision = 0, resueltos = 0, rechazados = 0;
    for (const r of reclamosClientes) {
      if (r.estado === 'Abierto') abiertos++;
      else if (r.estado === 'En revisión' || r.estado === 'En revision') enRevision++;
      else if (r.estado === 'Resuelto') resueltos++;
      else if (r.estado === 'Rechazado') rechazados++;
    }
    return {
      Todos: reclamosClientes.length,
      Abierto: abiertos,
      'En revisión': enRevision,
      Resuelto: resueltos,
      Rechazado: rechazados,
    };
  }, [reclamosClientes]);

  const totalPaginasReclamos = useMemo(() => {
    return Math.ceil(reclamosFiltrados.length / registrosPorPagina) || 1;
  }, [reclamosFiltrados.length]);

  const reclamosPaginados = useMemo(() => {
    return reclamosFiltrados.slice(
      (paginaReclamos - 1) * registrosPorPagina,
      paginaReclamos * registrosPorPagina
    );
  }, [reclamosFiltrados, paginaReclamos]);

  // SOPORTE MEMOIZADO Y PAGINADO
  const totalPaginasSoporte = useMemo(() => {
    return Math.ceil(soporteMostrado.length / registrosPorPagina) || 1;
  }, [soporteMostrado.length]);

  const soportePaginado = useMemo(() => {
    return soporteMostrado.slice(
      (paginaSoporte - 1) * registrosPorPagina,
      paginaSoporte * registrosPorPagina
    );
  }, [soporteMostrado, paginaSoporte]);

  // ÓRDENES MEMOIZADAS (con búsqueda y filtro)
  const ESTADOS_ORDEN = useMemo(() => [
    { value: 'pagada', label: 'Pagada', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', darkColor: '#6ee7b7' },
    { value: 'entregada', label: 'Entregada', color: '#2563EB', bg: '#eff6ff', border: '#bfdbfe', darkColor: '#93c5fd' },
    { value: 'enviada', label: 'Enviada', color: '#ea580c', bg: '#fff7ed', border: '#fdba74', darkColor: '#fdba74' },
    { value: 'cancelada', label: 'Cancelada', color: '#B91C1C', bg: '#fef2f2', border: '#fecaca', darkColor: '#fca5a5' },
  ], []);

  // Devuelve la configuración de color de un estado de orden aceptando sus
  // variantes (pagado/pagada, enviado/enviada, entregado/entregada, etc.).
  const configEstadoOrden = (raw) => {
    const norm = String(raw || '').toLowerCase().trim();
    const alias = norm.includes('pagad') ? 'pagada'
      : norm.includes('entreg') || norm.includes('complet') || norm.includes('finaliz') ? 'entregada'
        : norm.includes('enviad') ? 'enviada'
          : norm.includes('cancel') ? 'cancelada'
            : null;
    return ESTADOS_ORDEN.find(e => e.value === alias)
      || { color: '#6b7280', bg: darkMode ? '#262626' : '#f9fafb', border: darkMode ? '#3a3a3a' : '#e5e7eb', darkColor: '#e5e7eb' };
  };

  const ordenesFiltradas = useMemo(() => {
    const q = (busquedaOrdenes || '').toLowerCase().trim();
    return ordenes.filter((o) => {
      const estadoNorm = (o.estado || o.estado_orden || '').toLowerCase().trim();
      const cumpleEstado = filtroEstadoOrden === 'todos' || estadoNorm === filtroEstadoOrden
        || ((filtroEstadoOrden === 'enviada' || filtroEstadoOrden === 'enviado') && (estadoNorm === 'enviado' || estadoNorm === 'enviada'))
        || ((filtroEstadoOrden === 'entregada' || filtroEstadoOrden === 'entregado') && (estadoNorm === 'entregada' || estadoNorm === 'entregado'))
        || ((filtroEstadoOrden === 'pagada' || filtroEstadoOrden === 'pagado') && (estadoNorm === 'pagado' || estadoNorm === 'pagada'))
        || ((filtroEstadoOrden === 'cancelada' || filtroEstadoOrden === 'cancelado') && (estadoNorm === 'cancelada' || estadoNorm === 'cancelado'))
        || (filtroEstadoOrden === 'completada' && (estadoNorm === 'completada' || estadoNorm === 'finalizada'));
      if (!q) return cumpleEstado;
      const matchTexto =
        String(o.id_orden || '').includes(q) ||
        estadoNorm.includes(q) ||
        String(o.total || '').includes(q) ||
        (o.comprador || o.nombre_usuario || '').toLowerCase().includes(q) ||
        (o.email_comprador || o.email_usuario || '').toLowerCase().includes(q) ||
        (o.vendedor_tienda || o.tienda || o.vendedor || '').toLowerCase().includes(q) ||
        (o.metodo_pago || '').toLowerCase().includes(q);
      return cumpleEstado && matchTexto;
    });
  }, [ordenes, busquedaOrdenes, filtroEstadoOrden]);

  const totalPaginasOrdenes = useMemo(() => Math.ceil(ordenesFiltradas.length / registrosPorPagina) || 1, [ordenesFiltradas.length]);

  const ordenesPaginadas = useMemo(() => {
    return ordenesFiltradas.slice(
      (paginaOrdenes - 1) * registrosPorPagina,
      paginaOrdenes * registrosPorPagina
    );
  }, [ordenesFiltradas, paginaOrdenes]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Montserrat', sans-serif" }}>
        Cargando panel admin...
      </div>
    );
  }

  return (
    <div
      className="admin-dashboard-container"
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Montserrat', sans-serif",
        background: darkMode ? '#121212' : BEIGE
      }}
    >

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}
        style={{
          width: sidebarOpen ? '250px' : '76px',
          background: VINOTINTO, color: WHITE,
          padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: '6px',
          boxSizing: 'border-box',
          transition: 'width 0.25s ease', flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        }}>
        {sidebarOpen ? (
          /* ── Sidebar ABIERTO: banner como fondo, avatar + info encima ── */
          <div style={{
            margin: '-24px -14px 16px -14px',
            background: perfilSidebar.bannerUrl
              ? `url(${perfilSidebar.bannerUrl}) center/cover no-repeat`
              : (perfilSidebar.bannerColor || '#7A1E3A'),
            padding: '12px 14px 12px 24px',
            position: 'relative',
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                {perfilSidebar.foto ? (
                  <img src={perfilSidebar.foto} alt="Foto de perfil" style={{
                    width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: WHITE, textTransform: 'uppercase', fontSize: '1rem',
                  }}>
                    {(perfilSidebar.nombre || 'A').charAt(0)}
                  </div>
                )}
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                    color: WHITE, width: '26px', height: '26px', borderRadius: '6px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Contraer menú"
                >
                  <SidebarIcon Icon={IconChevronLeft} size={15} />
                </button>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: WHITE, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{perfilSidebar.nombre || 'Administrador'}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfilSidebar.correo}</div>
            </div>
          </div>
        ) : (
          /* ── Sidebar CERRADO: banner de fondo + hamburguesa + avatar ── */
          <div style={{
            margin: '-24px -14px 20px -14px',
            background: perfilSidebar.bannerUrl
              ? `url(${perfilSidebar.bannerUrl}) center/cover no-repeat`
              : (perfilSidebar.bannerColor || '#7A1E3A'),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: 'calc(100% + 28px)',
            padding: '12px 0',
            gap: '8px',
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.2)',
                color: WHITE, width: '34px', height: '34px', borderRadius: '8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
              title="Expandir menú"
            >
              <SidebarIcon Icon={IconMenu} size={20} />
            </button>
            {perfilSidebar.foto ? (
              <img src={perfilSidebar.foto} alt="Foto de perfil" style={{
                width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.35)',
              }} />
            ) : (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: WHITE, textTransform: 'uppercase', fontSize: '1rem',
              }}>
                {(perfilSidebar.nombre || 'A').charAt(0)}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="sidebar-nav-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  background: active ? 'rgba(255,255,255,0.18)' : 'none',
                  border: 'none', color: '#FFFFFF',
                  padding: sidebarOpen ? '12px 14px' : '12px',
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                  fontWeight: 600, fontSize: '0.9rem', flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  gap: '12px', fontFamily: "'Montserrat', sans-serif",
                  transition: 'background 0.15s ease',
                }}
              >
                <span style={{ display: 'flex', flexShrink: 0, color: '#FFFFFF' }}>
                  <SidebarIcon Icon={item.Icon} size={20} />
                </span>
                {sidebarOpen && <span style={{ color: '#FFFFFF' }}>{item.label}</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('token');
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
            window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } }));
            void navigate('/');
          }}
          title={!sidebarOpen ? 'Cerrar sesión' : undefined}
          style={{
            marginTop: 'auto', background: 'none',
            border: '1.5px solid rgba(255,255,255,0.35)', color: WHITE,
            padding: sidebarOpen ? '11px 14px' : '11px',
            borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
            display: 'flex', alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            gap: '10px', fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem',
          }}
        >
          <SidebarIcon Icon={IconLogOut} size={18} />
          {sidebarOpen && <span style={{ color: '#FFFFFF' }}>Cerrar sesión</span>}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '40px', background: darkMode ? '#121212' : BEIGE, overflowX: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
          {ActiveIcon && (
            <div style={{
              width: '46px', height: '46px', borderRadius: '12px',
              background: darkMode ? '#2a141e' : '#F5EAED', color: darkMode ? '#e05a7a' : VINOTINTO,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ActiveIcon className="" width={24} height={24} style={{ color: darkMode ? '#e05a7a' : VINOTINTO }} />
            </div>
          )}
          <h1 style={{ margin: 0, color: darkMode ? '#e05a7a' : VINOTINTO, fontSize: '1.7rem', fontWeight: 800 }}>
            {sectionTitles[activeSection]}
          </h1>
        </div>

        {/* DASHBOARD REESTRUCTURADO Y PREMIUM */}
        {activeSection === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ALERTA DE ATENCIÓN PRIORITARIA */}
            {(reclamosPendientesCount > 0 || soportePendientesCountDash > 0) && (
              <div style={{
                background: darkMode ? '#2d1a08' : '#FFFBEB',
                border: darkMode ? '1.5px solid #78350f' : '1.5px solid #FCD34D',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: darkMode ? '0 4px 14px rgba(0, 0, 0, 0.4)' : '0 4px 14px rgba(245, 158, 11, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: darkMode ? '#451a03' : '#FEF3C7', color: darkMode ? '#fbbf24' : '#D97706',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <IconAlertTriangle width={22} height={22} style={{ color: darkMode ? '#fbbf24' : '#D97706' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: darkMode ? '#fef3c7' : '#92400E', fontSize: '0.96rem' }}>
                      Atención requerida del Administrador
                    </div>
                    <div style={{ color: darkMode ? '#fde68a' : '#B45309', fontSize: '0.86rem', marginTop: '2px' }}>
                      {reclamosPendientesCount > 0 && `Tienes ${reclamosPendientesCount} queja(s) o reclamo(s) abierta(s) para responder. `}
                      {soportePendientesCountDash > 0 && `Hay ${soportePendientesCountDash} ticket(s) de soporte técnico sin resolver. `}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {reclamosPendientesCount > 0 && (
                    <button
                      onClick={() => setActiveSection('reclamos')}
                      style={{
                        background: '#D97706', color: WHITE, border: 'none',
                        padding: '8px 16px', borderRadius: '8px', fontWeight: 700,
                        fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      Resolver Reclamos →
                    </button>
                  )}
                  {soportePendientesCountDash > 0 && (
                    <button
                      onClick={() => setActiveSection('soporte')}
                      style={{
                        background: '#2563eb', color: WHITE, border: 'none',
                        padding: '8px 16px', borderRadius: '8px', fontWeight: 700,
                        fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      Atender Soporte →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. GRID DE 4 TARJETAS KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>

              {/* KPI 1: USUARIOS */}
              <button
                type="button"
                onClick={() => setActiveSection('usuarios')}
                className="admin-kpi-card"
                style={{
                  background: darkMode ? '#1e1e1e' : WHITE,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
                  border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  font: 'inherit',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: darkMode ? 'rgba(224, 90, 122, 0.15)' : '#FDF2F4', color: darkMode ? '#fb7185' : VINOTINTO,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(122, 30, 58, 0.1)'
                  }}>
                    <IconUsers width={24} height={24} style={{ color: darkMode ? '#fb7185' : VINOTINTO }} />
                  </div>
                  <span style={{
                    background: darkMode ? 'rgba(224, 90, 122, 0.15)' : '#FDF2F4', color: darkMode ? '#fb7185' : VINOTINTO,
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${darkMode ? 'rgba(224, 90, 122, 0.3)' : '#F8D2DA'}`
                  }}>
                    Ecosistema
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: darkMode ? '#fb7185' : VINOTINTO, lineHeight: 1 }}>
                    {stats.usuarios}
                  </div>
                  <div style={{ color: darkMode ? '#f3f4f6' : CARBON, fontWeight: 700, fontSize: '0.95rem', marginTop: '6px' }}>
                    Usuarios Totales
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${darkMode ? '#333333' : '#F4EDE2'}`, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', color: darkMode ? '#34d399' : '#047857', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {compradoresCount} compradores
                  </span>
                  <span style={{ background: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB', color: darkMode ? '#fbbf24' : '#B45309', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {vendedoresCount} vendedores
                  </span>
                </div>
              </button>

              {/* KPI 2: LIBROS */}
              <button
                type="button"
                onClick={() => setActiveSection('libros')}
                className="admin-kpi-card"
                style={{
                  background: darkMode ? '#1e1e1e' : WHITE,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
                  border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  font: 'inherit',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: darkMode ? 'rgba(168, 85, 247, 0.15)' : '#F3E8FF', color: darkMode ? '#c084fc' : '#7E22CE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(126, 34, 206, 0.1)'
                  }}>
                    <IconBook width={24} height={24} style={{ color: darkMode ? '#c084fc' : '#7E22CE' }} />
                  </div>
                  <span style={{
                    background: darkMode ? 'rgba(168, 85, 247, 0.15)' : '#F3E8FF', color: darkMode ? '#c084fc' : '#7E22CE',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${darkMode ? 'rgba(168, 85, 247, 0.3)' : '#E9D5FF'}`
                  }}>
                    Catálogo
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: darkMode ? '#c084fc' : '#581C87', lineHeight: 1 }}>
                    {stats.libros}
                  </div>
                  <div style={{ color: darkMode ? '#f3f4f6' : CARBON, fontWeight: 700, fontSize: '0.95rem', marginTop: '6px' }}>
                    Libros Publicados
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${darkMode ? '#333333' : '#F4EDE2'}`, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: darkMode ? 'rgba(168, 85, 247, 0.15)' : '#FAF5FF', color: darkMode ? '#d8b4fe' : '#6B21A8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {librosActivosCount} disponibles
                  </span>
                  <span style={{ background: darkMode ? 'rgba(156, 163, 175, 0.15)' : '#F3F4F6', color: darkMode ? '#9ca3af' : '#4B5563', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {totalCategorias} categorías
                  </span>
                </div>
              </button>

              {/* KPI 3: TIENDAS */}
              <button
                type="button"
                onClick={() => setActiveSection('tiendas')}
                className="admin-kpi-card"
                style={{
                  background: darkMode ? '#1e1e1e' : WHITE,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
                  border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  font: 'inherit',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', color: darkMode ? '#34d399' : '#047857',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(4, 120, 87, 0.1)'
                  }}>
                    <IconStore width={24} height={24} style={{ color: darkMode ? '#34d399' : '#047857' }} />
                  </div>
                  <span style={{
                    background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', color: darkMode ? '#34d399' : '#047857',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'}`
                  }}>
                    {tiendasActivasCount} Activas
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: darkMode ? '#34d399' : '#064E3B', lineHeight: 1 }}>
                    {stats.tiendas}
                  </div>
                  <div style={{ color: darkMode ? '#f3f4f6' : CARBON, fontWeight: 700, fontSize: '0.95rem', marginTop: '6px' }}>
                    Librerías & Tiendas
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${darkMode ? '#333333' : '#F4EDE2'}`, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', color: darkMode ? '#34d399' : '#047857', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {tiendasActivasCount} verificadas
                  </span>
                  {tiendasPendientesCount > 0 ? (
                    <span style={{ background: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', color: darkMode ? '#fbbf24' : '#B45309', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {tiendasPendientesCount} pendientes
                    </span>
                  ) : (
                    <span style={{ background: darkMode ? 'rgba(156, 163, 175, 0.15)' : '#F3F4F6', color: darkMode ? '#9ca3af' : '#4B5563', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Al día
                    </span>
                  )}
                </div>
              </button>

              {/* KPI 4: ÓRDENES & TRANSACCIONES */}
              <button
                type="button"
                onClick={() => setActiveSection('ordenes')}
                className="admin-kpi-card"
                style={{
                  background: darkMode ? '#1e1e1e' : WHITE,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
                  border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  font: 'inherit',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', color: darkMode ? '#60a5fa' : '#1D4ED8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.1)'
                  }}>
                    <IconPackage width={24} height={24} style={{ color: darkMode ? '#60a5fa' : '#1D4ED8' }} />
                  </div>
                  <span style={{
                    background: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', color: darkMode ? '#60a5fa' : '#1D4ED8',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE'}`
                  }}>
                    Transacciones
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: darkMode ? '#60a5fa' : '#1E3A8A', lineHeight: 1 }}>
                    {stats.ordenes}
                  </div>
                  <div style={{ color: darkMode ? '#f3f4f6' : CARBON, fontWeight: 700, fontSize: '0.95rem', marginTop: '6px' }}>
                    Órdenes Procesadas
                  </div>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${darkMode ? '#333333' : '#F4EDE2'}`, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', color: darkMode ? '#60a5fa' : '#1D4ED8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {ordenesHoy} creadas hoy
                  </span>
                  <span style={{ background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', color: darkMode ? '#34d399' : '#047857', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {ordenesCompletadas} entregadas
                  </span>
                </div>
              </button>

            </div>

            {/* 3. RESUMEN ANALÍTICO Y DISTRIBUCIÓN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

              {/* Distribución de la Comunidad */}
              <div style={{
                background: darkMode ? '#1e1e1e' : WHITE,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${darkMode ? '#333333' : BORDER}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: darkMode ? '#e05a7a' : VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: 800 }}>
                    <IconUsers width={20} height={20} style={{ color: darkMode ? '#e05a7a' : VINOTINTO }} />
                    Distribución de la Comunidad
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600 }}>
                    {stats.usuarios} miembros en total
                  </span>
                </div>

                {/* Roles Progress and percentages */}
                {[
                  { label: 'Compradores', count: compradoresCount, color: '#10B981', bg: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', border: darkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' },
                  { label: 'Vendedores / Librerías', count: vendedoresCount, color: '#F59E0B', bg: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB', border: darkMode ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A' },
                  { label: 'Administradores', count: adminsCount, color: darkMode ? '#fb7185' : VINOTINTO, bg: darkMode ? 'rgba(224, 90, 122, 0.15)' : '#FDF2F4', border: darkMode ? 'rgba(224, 90, 122, 0.3)' : '#F8D2DA' },
                ].map((item) => {
                  const pct = stats.usuarios > 0 ? Math.round((item.count / stats.usuarios) * 100) : 0;
                  return (
                    <div key={item.label} style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: darkMode ? '#f3f4f6' : CARBON }}>{item.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.82rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600 }}>{item.count} usuarios</span>
                          <span style={{ background: item.bg, color: item.color, border: `1px solid ${item.border}`, padding: '2px 8px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div style={{ background: darkMode ? '#2d2d2d' : '#F3F4F6', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                          background: item.color,
                          height: '100%',
                          borderRadius: '10px',
                          width: `${pct}%`,
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Categorías Principales y Salud Operativa */}
              <div style={{
                background: darkMode ? '#1e1e1e' : WHITE,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: darkMode ? '#e05a7a' : VINOTINTO, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: 800 }}>
                      <IconBook width={20} height={20} style={{ color: darkMode ? '#e05a7a' : VINOTINTO }} />
                      Categorías más Populares
                    </h3>
                    <button
                      onClick={() => setActiveSection('libros')}
                      style={{ background: 'none', border: 'none', color: darkMode ? '#fb7185' : VINOTINTO, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Explorar catálogo →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {Object.entries(categoriaCount).slice(0, 6).map(([cat, count]) => (
                      <div
                        key={cat}
                        style={{
                          background: darkMode ? '#282828' : '#F9F6F0',
                          border: `1px solid ${darkMode ? '#3a3a3a' : '#EAE4D9'}`,
                          padding: '6px 12px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.82rem',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON }}>{cat}</span>
                        <span style={{ background: darkMode ? '#e05a7a' : VINOTINTO, color: WHITE, padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                          {count}
                        </span>
                      </div>
                    ))}
                    {Object.keys(categoriaCount).length === 0 && (
                      <div style={{ color: darkMode ? '#9ca3af' : GRAY, fontSize: '0.85rem' }}>No hay libros categorizados aún.</div>
                    )}
                  </div>
                </div>

                {/* Estado Operativo de Tiendas */}
                <div style={{ background: darkMode ? '#252525' : '#FAF8F5', borderRadius: '12px', padding: '14px 18px', border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}` }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estado Operativo de Librerías</span>
                    <span style={{ color: darkMode ? '#34d399' : GREEN, fontWeight: 800 }}>{tiendasActivasCount} de {stats.tiendas} operando</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: darkMode ? '#34d399' : '#166534', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                      {tiendasActivasCount} Activas
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: darkMode ? '#fbbf24' : '#9a3412', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c' }} />
                      {tiendasPendientesCount} Pendientes
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: darkMode ? '#f87171' : '#991b1b', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                      {tiendasSuspendidasCount} Suspendidas
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 4. GRID DE TABLAS DE MONITOREO DIRECTO CON AVATARES Y ACCIONES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>

              {/* Card Tabla: Últimos Usuarios */}
              <div style={{
                background: darkMode ? '#1e1e1e' : WHITE,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: darkMode ? 'rgba(224, 90, 122, 0.15)' : '#FDF2F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconUser width={18} height={18} style={{ color: darkMode ? '#fb7185' : VINOTINTO }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: darkMode ? '#e05a7a' : VINOTINTO, fontSize: '1.05rem', fontWeight: 800 }}>
                        Últimos Usuarios Registrados
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 500 }}>Nuevos registros en la plataforma</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('usuarios')}
                    style={{
                      background: darkMode ? '#282828' : '#FAF5EE',
                      border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                      color: darkMode ? '#fb7185' : VINOTINTO,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Ver todos ({stats.usuarios}) →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${darkMode ? '#333333' : '#F4EDE2'}`, color: darkMode ? '#9ca3af' : GRAY, textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '10px 8px' }}>Usuario</th>
                        <th style={{ padding: '10px 8px' }}>Correo</th>
                        <th style={{ padding: '10px 8px' }}>Rol</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...usuarios].reverse().slice(0, 5).map((u) => {
                        const rolProps = getRolBadgeProps(u.rol);
                        const isBloqueado = u.estado_usuario === 'Bloqueado';
                        return (
                          <tr key={u.id_usuario} className="admin-table-row" style={{ borderBottom: `1px solid ${darkMode ? '#282828' : '#FAF7F2'}` }}>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '50%',
                                  background: rolProps.avatarGradient,
                                  color: WHITE,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                }}>
                                  {getIniciales(u.nombre_usuario)}
                                </div>
                                <span style={{ fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON }}>
                                  {u.nombre_usuario}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', color: darkMode ? '#9ca3af' : '#555', fontSize: '0.82rem' }}>
                              {u.correo_usuario}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{
                                background: darkMode ? 'rgba(255,255,255,0.08)' : rolProps.bg,
                                color: darkMode ? '#f3f4f6' : rolProps.color,
                                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : rolProps.border}`,
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'capitalize'
                              }}>
                                {u.rol}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: isBloqueado ? (darkMode ? '#f87171' : RED) : (darkMode ? '#34d399' : GREEN),
                                background: isBloqueado
                                  ? (darkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2')
                                  : (darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5'),
                                padding: '2px 8px',
                                borderRadius: '10px',
                                border: `1px solid ${isBloqueado
                                  ? (darkMode ? 'rgba(239, 68, 68, 0.3)' : '#FECACA')
                                  : (darkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0')}`
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isBloqueado ? (darkMode ? '#f87171' : RED) : (darkMode ? '#34d399' : GREEN) }} />
                                {isBloqueado ? 'Bloqueado' : 'Activo'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {usuarios.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#9ca3af' : GRAY }}>No hay usuarios registrados aún.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Tabla: Últimas Tiendas */}
              <div style={{
                background: darkMode ? '#1e1e1e' : WHITE,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconStore width={18} height={18} style={{ color: darkMode ? '#34d399' : '#047857' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: darkMode ? '#e05a7a' : VINOTINTO, fontSize: '1.05rem', fontWeight: 800 }}>
                        Últimas Tiendas Creadas
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 500 }}>Librerías y vendedores asociados</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('tiendas')}
                    style={{
                      background: darkMode ? '#282828' : '#FAF5EE',
                      border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                      color: darkMode ? '#fb7185' : VINOTINTO,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Gestionar todas ({stats.tiendas}) →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${darkMode ? '#333333' : '#F4EDE2'}`, color: darkMode ? '#9ca3af' : GRAY, textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '10px 8px' }}>Librería</th>
                        <th style={{ padding: '10px 8px' }}>Teléfono</th>
                        <th style={{ padding: '10px 8px' }}>Registro</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tiendas].reverse().slice(0, 5).map((t) => {
                        const badgeProps = getEstadoTiendaBadgeProps(t.estado_tienda);
                        return (
                          <tr key={t.id_tienda} className="admin-table-row" style={{ borderBottom: `1px solid ${darkMode ? '#282828' : '#FAF7F2'}` }}>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '8px',
                                  background: darkMode ? 'rgba(224, 90, 122, 0.15)' : '#FDF2F4', color: darkMode ? '#fb7185' : VINOTINTO,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
                                }}>
                                  <IconStore width={16} height={16} style={{ color: darkMode ? '#fb7185' : VINOTINTO }} />
                                </div>
                                <span style={{ fontWeight: 700, color: darkMode ? '#f3f4f6' : VINOTINTO }}>
                                  {t.nombre_tienda}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', color: darkMode ? '#9ca3af' : '#555', fontSize: '0.82rem' }}>
                              {t.telefono ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <IconPhone width={13} height={13} style={{ color: darkMode ? '#9ca3af' : GRAY }} />
                                  {t.telefono}
                                </span>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', color: darkMode ? '#9ca3af' : GRAY, fontSize: '0.82rem' }}>
                              {t.fecha_creacion
                                ? new Date(t.fecha_creacion).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                                : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <span style={{
                                background: darkMode ? 'rgba(16, 185, 129, 0.15)' : badgeProps.bg,
                                color: darkMode ? '#34d399' : badgeProps.color,
                                border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.3)' : badgeProps.border}`,
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: darkMode ? '#34d399' : badgeProps.dot }} />
                                {badgeProps.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {tiendas.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#9ca3af' : GRAY }}>No hay tiendas registradas aún.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* REPORTES */}
        {/* REPORTES */}
        {activeSection === 'reportes' && (() => {
          // ── Helper Categorías ──
          const getCategoriaTheme = (catName) => {
            const texto = (catName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (texto.includes('ficcion') && !texto.includes('cientifica')) return { color: '#B91C1C', darkColor: '#f87171', bg: '#FEF2F2', border: '#FECACA', icon: '📖' };
            if (texto.includes('fantasia')) return { color: '#4338CA', darkColor: '#818cf8', bg: '#EEF2FF', border: '#C7D2FE', icon: '🧙' };
            if (texto.includes('terror')) return { color: '#6B21A8', darkColor: '#c084fc', bg: '#FAF5FF', border: '#E9D5FF', icon: '👻' };
            if (texto.includes('juvenil')) return { color: '#D97706', darkColor: '#fbbf24', bg: '#FFFBEB', border: '#FDE68A', icon: '🎒' };
            if (texto.includes('ciencia') || texto.includes('cientifica')) return { color: '#047857', darkColor: '#34d399', bg: '#ECFDF5', border: '#A7F3D0', icon: '🔬' };
            if (texto.includes('romance')) return { color: '#DB2777', darkColor: '#f472b6', bg: '#FDF2F8', border: '#FBCFE8', icon: '💖' };
            if (texto.includes('aventura')) return { color: '#EA580C', darkColor: '#fb923c', bg: '#FFF7ED', border: '#FFEDD5', icon: '🗺️' };
            if (texto.includes('historia')) return { color: '#92400E', darkColor: '#fbbf24', bg: '#FEF3C7', border: '#FDE68A', icon: '🏛️' };
            if (texto.includes('tecnologia')) return { color: '#0E7490', darkColor: '#22d3ee', bg: '#ECFEFF', border: '#A5F3FC', icon: '💻' };
            if (texto.includes('infantil')) return { color: '#0284C7', darkColor: '#38bdf8', bg: '#F0F9FF', border: '#BAE6FD', icon: '🧸' };
            if (texto.includes('arte')) return { color: '#9333EA', darkColor: '#c084fc', bg: '#FAF5FF', border: '#F3E8FF', icon: '🎨' };
            if (texto.includes('biografia')) return { color: '#1E40AF', darkColor: '#60a5fa', bg: '#EFF6FF', border: '#BFDBFE', icon: '👤' };
            if (texto.includes('educacion')) return { color: '#15803D', darkColor: '#4ade80', bg: '#F0FDF4', border: '#BBF7D0', icon: '🎓' };
            if (texto.includes('poesia')) return { color: '#BE185D', darkColor: '#f472b6', bg: '#FDF2F8', border: '#FCE7F3', icon: '✍️' };
            if (texto.includes('filosofia')) return { color: '#475569', darkColor: '#94a3b8', bg: '#F8FAFC', border: '#E2E8F0', icon: '🧠' };
            return { color: '#7A1E3A', darkColor: '#fb7185', bg: '#FDF2F4', border: '#F8D2DA', icon: '📚' };
          };

          // ── Normalización de Órdenes ──
          const ordenesNormalizadas = ordenes.reduce((acc, o) => {
            const e = (o.estado || '').toLowerCase().trim();
            let key = 'pendiente';
            if (['pagado', 'pagada', 'pago confirmado', 'aprobada', 'aprobado'].includes(e)) key = 'pagada';
            else if (['entregado', 'entregada', 'completada', 'finalizada'].includes(e)) key = 'entregada';
            else if (['enviado', 'enviada', 'despachado', 'en camino'].includes(e)) key = 'enviada';
            else if (['procesando', 'en proceso', 'preparando'].includes(e)) key = 'procesando';
            else if (['cancelado', 'cancelada', 'anulado', 'rechazada'].includes(e)) key = 'cancelada';
            else if (['pendiente', 'pendiente de pago', 'por pagar'].includes(e)) key = 'pendiente';

            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});

          const ordenesConfig = [
            { key: 'pagada', label: 'Pagadas / Preparación', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '💳', desc: 'Pago confirmado por BookyPago' },
            { key: 'entregada', label: 'Entregadas con éxito', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0', icon: '✅', desc: 'Recibidas por el comprador' },
            { key: 'enviada', label: 'En Camino / Enviadas', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', icon: '🚚', desc: 'Con número de guía activo' },
            { key: 'procesando', label: 'En Proceso', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '⚙️', desc: 'En alistamiento por la tienda' },
            { key: 'pendiente', label: 'Pendientes de Pago', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', icon: '⏳', desc: 'Esperando confirmación' },
            { key: 'cancelada', label: 'Canceladas', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '❌', desc: 'Canceladas o no concretadas' },
          ];

          // ── Normalización de Tiendas ──
          const tiendasNormalizadas = tiendas.reduce((acc, t) => {
            const e = (t.estado_tienda || '').toLowerCase().trim();
            let key = 'inactiva';
            if (['activa', 'activo', 'habilitada', 'aprobada'].includes(e)) key = 'activa';
            else if (['vacaciones', 'en vacaciones', 'pausada', 'pausado'].includes(e)) key = 'vacaciones';
            else if (['pendiente', 'en revision', 'en revisión', 'por revisar'].includes(e)) key = 'pendiente';
            else if (['suspendida', 'suspendido'].includes(e)) key = 'suspendida';
            else key = 'inactiva';

            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});

          const tiendasConfig = [
            { key: 'activa', label: 'Activas / Operativas', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0', icon: '🟢', desc: 'Visibles en el catálogo y vendiendo' },
            { key: 'vacaciones', label: 'En Vacaciones', color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5', icon: '🏖️', desc: 'En pausa temporal programada' },
            { key: 'pendiente', label: 'Pendientes de Revisión', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '🕐', desc: 'Esperando validación de admin' },
            { key: 'suspendida', label: 'Suspendidas', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '🚫', desc: 'Sancionadas por incumplimiento' },
            { key: 'inactiva', label: 'Inactivas', color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA', icon: '⭕', desc: 'Deshabilitadas del sistema' },
          ];

          // ── Roles ──
          const rolesConfig = [
            { key: 'comprador', label: 'Compradores', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0', icon: '🛒', desc: 'Usuarios lectores y clientes' },
            { key: 'vendedor', label: 'Vendedores', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '🏪', desc: 'Librerías y tiendas asociadas' },
            { key: 'administrador', label: 'Administradores', color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA', icon: '🛡️', desc: 'Gestión total de la plataforma' },
          ];

          const rolesNormalizados = usuarios.reduce((acc, u) => {
            const r = (u.rol || '').toLowerCase().trim();
            if (r.includes('admin')) acc['administrador'] = (acc['administrador'] || 0) + 1;
            else if (r.includes('vend')) acc['vendedor'] = (acc['vendedor'] || 0) + 1;
            else acc['comprador'] = (acc['comprador'] || 0) + 1;
            return acc;
          }, {});

          // Ranking categorías
          const categoriasOrdenadas = Object.entries(categoriaCount).sort((a, b) => b[1] - a[1]);
          const topCategorias = categoriasOrdenadas.slice(0, 8);

          return (
            <>
              {/* ── 4 KPI CARDS SUPERIORES ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '28px' }}>
                {[
                  {
                    title: 'Órdenes',
                    value: stats.ordenes,
                    badge: `${ordenesHoy} hoy`,
                    sub: 'Flujo total de compras',
                    Icon: IconCart,
                    color: '#1E40AF',
                    bg: '#EFF6FF',
                    border: '#BFDBFE',
                  },
                  {
                    title: 'Libros Activos',
                    value: stats.libros,
                    badge: `${totalCategorias} géneros`,
                    sub: 'Catálogo publicado',
                    Icon: IconBook,
                    color: '#6D28D9',
                    bg: '#F5F3FF',
                    border: '#DDD6FE',
                  },
                  {
                    title: 'Librerías',
                    value: stats.tiendas,
                    badge: `${tiendasActivasCount} activas`,
                    sub: `${Math.round((tiendasActivasCount / (stats.tiendas || 1)) * 100)}% operativas`,
                    Icon: IconStore,
                    color: '#047857',
                    bg: '#ECFDF5',
                    border: '#A7F3D0',
                  },
                  {
                    title: 'Usuarios',
                    value: stats.usuarios,
                    badge: `${vendedoresCount} vendedores`,
                    sub: `${compradoresCount} compradores`,
                    Icon: IconUsers,
                    color: '#7A1E3A',
                    bg: '#FDF2F4',
                    border: '#F8D2DA',
                  },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: darkMode ? '#1e1e1e' : WHITE,
                      borderRadius: '16px',
                      padding: '20px 22px',
                      border: `1px solid ${darkMode ? '#333333' : s.border}`,
                      boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: s.color }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: darkMode ? '#9ca3af' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {s.title}
                      </span>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: darkMode ? `${s.color}22` : s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <s.Icon width={18} height={18} style={{ color: s.color }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: '2.1rem', fontWeight: 900, color: darkMode ? '#f3f4f6' : CARBON, lineHeight: 1 }}>{s.value}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color, background: darkMode ? `${s.color}22` : s.bg, border: `1px solid ${darkMode ? `${s.color}44` : s.border}`, padding: '2px 8px', borderRadius: 12 }}>
                        {s.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 500 }}>{s.sub}</span>
                  </div>
                ))}
              </div>

              {/* ── GRID PRINCIPAL 2x2 DE REPORTES ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* 1. USUARIOS POR ROL */}
                <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: '18px', padding: '26px', boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${darkMode ? '#333333' : BORDER}`, display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${darkMode ? '#333333' : BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: darkMode ? '#7a1e3a33' : '#FDF2F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconUsers width={20} height={20} style={{ color: darkMode ? '#fb7185' : VINOTINTO }} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: darkMode ? '#fb7185' : VINOTINTO, fontSize: '1.05rem', fontWeight: 800 }}>Usuarios por Rol</h3>
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 500 }}>Composición de la comunidad BookyHome</span>
                      </div>
                    </div>
                    <span style={{ background: darkMode ? '#7a1e3a33' : '#FDF2F4', color: darkMode ? '#fb7185' : VINOTINTO, fontSize: '0.8rem', fontWeight: 800, padding: '5px 12px', borderRadius: 20, border: `1px solid ${darkMode ? '#7a1e3a55' : '#F8D2DA'}` }}>
                      {stats.usuarios} Total
                    </span>
                  </div>

                  {/* Mini KPI Cards de Roles */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                    {rolesConfig.map((r) => {
                      const count = rolesNormalizados[r.key] || 0;
                      const pct = stats.usuarios > 0 ? Math.round((count / stats.usuarios) * 100) : 0;
                      return (
                        <div key={r.key} style={{ background: darkMode ? `${r.color}22` : r.bg, border: `1.5px solid ${darkMode ? `${r.color}44` : r.border}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>{r.icon}</div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: r.color, lineHeight: 1.1 }}>{count}</div>
                          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: r.color, marginTop: 4 }}>{r.label}</div>
                          <div style={{ fontSize: '0.7rem', color: darkMode ? '#9ca3af' : '#6B7280', fontWeight: 600 }}>{pct}% del total</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barra compuesta continua */}
                  <div style={{ height: 10, borderRadius: 20, overflow: 'hidden', display: 'flex', marginBottom: 22, background: darkMode ? '#2d2d2d' : '#F3F4F6' }}>
                    {rolesConfig.map((r) => {
                      const count = rolesNormalizados[r.key] || 0;
                      const pct = stats.usuarios > 0 ? (count / stats.usuarios) * 100 : 0;
                      return (
                        <div
                          key={r.key}
                          title={`${r.label}: ${count} (${Math.round(pct)}%)`}
                          style={{
                            width: `${pct}%`,
                            background: r.color,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Lista detallada de roles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {rolesConfig.map((r) => {
                      const count = rolesNormalizados[r.key] || 0;
                      const pct = stats.usuarios > 0 ? Math.round((count / stats.usuarios) * 100) : 0;
                      return (
                        <div key={r.key} style={{ background: darkMode ? '#252525' : '#FAFAF9', borderRadius: 12, padding: '12px 16px', border: `1px solid ${darkMode ? '#333333' : '#F0ECE6'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '1.05rem' }}>{r.icon}</span>
                              <div>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: darkMode ? '#f3f4f6' : CARBON }}>{r.label}</span>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9CA3AF' }}>{r.desc}</p>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: r.color }}>{count}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: darkMode ? '#9ca3af' : '#6B7280', marginLeft: 6 }}>({pct}%)</span>
                            </div>
                          </div>
                          <div style={{ background: darkMode ? '#2d2d2d' : '#E5E7EB', borderRadius: 10, height: 8, overflow: 'hidden' }}>
                            <div
                              style={{
                                background: `linear-gradient(90deg, ${r.color}, ${r.color}cc)`,
                                width: `${pct}%`,
                                height: 8,
                                borderRadius: 10,
                                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. LIBROS POR CATEGORÍA */}
                <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: '18px', padding: '26px', boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${darkMode ? '#333333' : BORDER}`, display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${darkMode ? '#333333' : BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: darkMode ? '#6D28D933' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconBook width={20} height={20} style={{ color: darkMode ? '#c084fc' : '#6D28D9' }} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: darkMode ? '#c084fc' : '#6D28D9', fontSize: '1.05rem', fontWeight: 800 }}>Libros por Categoría</h3>
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 500 }}>Ranking de géneros en el catálogo</span>
                      </div>
                    </div>
                    <span style={{ background: darkMode ? '#6D28D933' : '#F5F3FF', color: darkMode ? '#c084fc' : '#6D28D9', fontSize: '0.8rem', fontWeight: 800, padding: '5px 12px', borderRadius: 20, border: `1px solid ${darkMode ? '#6D28D955' : '#DDD6FE'}` }}>
                      {stats.libros} Libros
                    </span>
                  </div>

                  {/* Top 3 Podio */}
                  {topCategorias.length >= 3 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                      {topCategorias.slice(0, 3).map(([cat, count], idx) => {
                        const medals = ['🥇 1º', '🥈 2º', '🥉 3º'];
                        const theme = getCategoriaTheme(cat);
                        const color = darkMode ? theme.darkColor : theme.color;
                        const pct = stats.libros > 0 ? Math.round((count / stats.libros) * 100) : 0;
                        return (
                          <div key={idx} style={{ background: darkMode ? `${color}22` : theme.bg, border: `1.5px solid ${darkMode ? `${color}44` : theme.border}`, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: color, textTransform: 'uppercase', marginBottom: 2 }}>
                              {medals[idx]}
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: color, lineHeight: 1.1 }}>{count}</div>
                            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {theme.icon} {cat}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: color, fontWeight: 600 }}>{pct}% catálogo</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Lista de categorías ranking */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {topCategorias.map(([cat, count], idx) => {
                      const theme = getCategoriaTheme(cat);
                      const color = darkMode ? theme.darkColor : theme.color;
                      const pct = stats.libros > 0 ? Math.round((count / stats.libros) * 100) : 0;
                      return (
                        <div key={`cat-${cat}-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9CA3AF', width: 22 }}>
                                #{idx + 1}
                              </span>
                              <span style={{
                                background: darkMode ? `${color}22` : theme.bg,
                                color: color,
                                border: `1px solid ${darkMode ? `${color}44` : theme.border}`,
                                padding: '3px 10px',
                                borderRadius: 16,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                              }}>
                                <span>{theme.icon}</span>
                                <span>{cat}</span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>{pct}%</span>
                              <span style={{ fontWeight: 900, color: color, fontSize: '0.92rem', minWidth: 26, textAlign: 'right' }}>
                                {count}
                              </span>
                            </div>
                          </div>
                          <div style={{ background: darkMode ? '#2d2d2d' : '#F3F4F6', borderRadius: 20, height: 7, overflow: 'hidden' }}>
                            <div
                              style={{
                                background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                                borderRadius: 20,
                                height: 7,
                                width: `${pct}%`,
                                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px dashed ${darkMode ? '#333333' : BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>✨ Total de {totalCategorias} categorías en plataforma</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: darkMode ? '#c084fc' : '#6D28D9' }}>{stats.libros} ejemplares</span>
                  </div>
                </div>

                {/* 3. TIENDAS POR ESTADO */}
                <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: '18px', padding: '26px', boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${darkMode ? '#333333' : BORDER}`, display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${darkMode ? '#333333' : BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: darkMode ? '#04785733' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconStore width={20} height={20} style={{ color: darkMode ? '#34d399' : '#047857' }} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: darkMode ? '#34d399' : '#047857', fontSize: '1.05rem', fontWeight: 800 }}>Tiendas por Estado</h3>
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 500 }}>Salud y disponibilidad de librerías</span>
                      </div>
                    </div>
                    <span style={{ background: darkMode ? '#04785733' : '#ECFDF5', color: darkMode ? '#34d399' : '#047857', fontSize: '0.8rem', fontWeight: 800, padding: '5px 12px', borderRadius: 20, border: `1px solid ${darkMode ? '#04785755' : '#A7F3D0'}` }}>
                      {stats.tiendas} Librerías
                    </span>
                  </div>

                  {/* Banner de Operatividad */}
                  <div style={{
                    background: darkMode ? '#04785722' : '#F0FDF4',
                    border: `1.5px solid ${darkMode ? '#04785744' : '#BBF7D0'}`,
                    borderRadius: 14,
                    padding: '14px 16px',
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#047857', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 900 }}>
                        ✓
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: darkMode ? '#34d399' : '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tasa de Operatividad</p>
                        <p style={{ margin: 0, fontSize: '0.86rem', color: darkMode ? '#a7f3d0' : '#166534', fontWeight: 600 }}>
                          <strong>{tiendasActivasCount} de {stats.tiendas}</strong> librerías activas vendiendo
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: darkMode ? '#34d399' : '#047857' }}>
                        {Math.round((tiendasActivasCount / (stats.tiendas || 1)) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Barra compuesta continua */}
                  <div style={{ height: 10, borderRadius: 20, overflow: 'hidden', display: 'flex', marginBottom: 20, background: darkMode ? '#2d2d2d' : '#F3F4F6' }}>
                    {tiendasConfig.map((t) => {
                      const count = tiendasNormalizadas[t.key] || 0;
                      const pct = stats.tiendas > 0 ? (count / stats.tiendas) * 100 : 0;
                      if (count === 0) return null;
                      return (
                        <div
                          key={t.key}
                          title={`${t.label}: ${count} (${Math.round(pct)}%)`}
                          style={{
                            width: `${pct}%`,
                            background: t.color,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Lista detallada de estados */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tiendasConfig.map((t) => {
                      const count = tiendasNormalizadas[t.key] || 0;
                      const pct = stats.tiendas > 0 ? Math.round((count / stats.tiendas) * 100) : 0;
                      return (
                        <div key={t.key} style={{ background: darkMode ? '#252525' : '#FAFAF9', borderRadius: 12, padding: '10px 14px', border: `1px solid ${darkMode ? '#333333' : '#F0ECE6'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '1rem' }}>{t.icon}</span>
                              <div>
                                <span style={{ fontWeight: 800, fontSize: '0.86rem', color: darkMode ? '#f3f4f6' : CARBON }}>{t.label}</span>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9CA3AF' }}>{t.desc}</p>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 900, color: t.color }}>{count}</span>
                              <span style={{ fontSize: '0.73rem', fontWeight: 700, color: darkMode ? '#9ca3af' : '#6B7280', marginLeft: 6 }}>({pct}%)</span>
                            </div>
                          </div>
                          <div style={{ background: darkMode ? '#2d2d2d' : '#E5E7EB', borderRadius: 10, height: 7, overflow: 'hidden' }}>
                            <div
                              style={{
                                background: `linear-gradient(90deg, ${t.color}, ${t.color}cc)`,
                                width: `${pct}%`,
                                height: 7,
                                borderRadius: 10,
                                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. ÓRDENES POR ESTADO (NORMALIZADO) */}
                <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: '18px', padding: '26px', boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${darkMode ? '#333333' : BORDER}`, display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${darkMode ? '#333333' : BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: darkMode ? '#1E40AF33' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconPackage width={20} height={20} style={{ color: darkMode ? '#60a5fa' : '#1E40AF' }} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: darkMode ? '#60a5fa' : '#1E40AF', fontSize: '1.05rem', fontWeight: 800 }}>Órdenes por Estado</h3>
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 500 }}>Pipeline y ciclo de vida de pedidos</span>
                      </div>
                    </div>
                    <span style={{ background: darkMode ? '#1E40AF33' : '#EFF6FF', color: darkMode ? '#60a5fa' : '#1E40AF', fontSize: '0.8rem', fontWeight: 800, padding: '5px 12px', borderRadius: 20, border: `1px solid ${darkMode ? '#1E40AF55' : '#BFDBFE'}` }}>
                      {stats.ordenes} Órdenes
                    </span>
                  </div>

                  {/* Resumen del Pipeline */}
                  <div style={{
                    background: darkMode ? '#1E40AF22' : '#F8FAFC',
                    border: `1.5px solid ${darkMode ? '#1E40AF44' : '#E2E8F0'}`,
                    borderRadius: 14,
                    padding: '12px 16px',
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: darkMode ? '#93c5fd' : '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Tasa de Efectividad
                      </span>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: darkMode ? '#d1d5db' : '#334155', fontWeight: 600 }}>
                        {((ordenesNormalizadas['entregada'] || 0) + (ordenesNormalizadas['pagada'] || 0) + (ordenesNormalizadas['enviada'] || 0))} órdenes procesadas con éxito
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: darkMode ? '#60a5fa' : '#1E40AF' }}>
                        {Math.round((((ordenesNormalizadas['entregada'] || 0) + (ordenesNormalizadas['pagada'] || 0) + (ordenesNormalizadas['enviada'] || 0)) / (stats.ordenes || 1)) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Barra compuesta continua del pipeline */}
                  <div style={{ height: 10, borderRadius: 20, overflow: 'hidden', display: 'flex', marginBottom: 20, background: darkMode ? '#2d2d2d' : '#F3F4F6' }}>
                    {ordenesConfig.map((o) => {
                      const count = ordenesNormalizadas[o.key] || 0;
                      const pct = stats.ordenes > 0 ? (count / stats.ordenes) * 100 : 0;
                      if (count === 0) return null;
                      return (
                        <div
                          key={o.key}
                          title={`${o.label}: ${count} (${Math.round(pct)}%)`}
                          style={{
                            width: `${pct}%`,
                            background: o.color,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Lista de estados de órdenes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ordenesConfig.map((o) => {
                      const count = ordenesNormalizadas[o.key] || 0;
                      const pct = stats.ordenes > 0 ? Math.round((count / stats.ordenes) * 100) : 0;
                      return (
                        <div key={o.key} style={{ background: darkMode ? '#252525' : '#FAFAF9', borderRadius: 12, padding: '10px 14px', border: `1px solid ${darkMode ? '#333333' : '#F0ECE6'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '1rem' }}>{o.icon}</span>
                              <div>
                                <span style={{ fontWeight: 800, fontSize: '0.86rem', color: darkMode ? '#f3f4f6' : CARBON }}>{o.label}</span>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9CA3AF' }}>{o.desc}</p>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 900, color: o.color }}>{count}</span>
                              <span style={{ fontSize: '0.73rem', fontWeight: 700, color: darkMode ? '#9ca3af' : '#6B7280', marginLeft: 6 }}>({pct}%)</span>
                            </div>
                          </div>
                          <div style={{ background: darkMode ? '#2d2d2d' : '#E5E7EB', borderRadius: 10, height: 7, overflow: 'hidden' }}>
                            <div
                              style={{
                                background: `linear-gradient(90deg, ${o.color}, ${o.color}cc)`,
                                width: `${pct}%`,
                                height: 7,
                                borderRadius: 10,
                                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </>
          );
        })()}

        {/* USUARIOS */}
        {activeSection === 'usuarios' && (() => {
          const totalUsr = usuarios.length || 1;
          const compradoresList = usuarios.filter((u) => (u.rol || '').toLowerCase().includes('comp'));
          const vendedoresList = usuarios.filter((u) => (u.rol || '').toLowerCase().includes('vend'));
          const adminsList = usuarios.filter((u) => (u.rol || '').toLowerCase().includes('admin'));
          const activosList = usuarios.filter((u) => (u.estado_usuario || 'Activo').toLowerCase() === 'activo');
          const bloqueadosList = usuarios.filter((u) => (u.estado_usuario || '').toLowerCase() === 'bloqueado');

          const roleThemes = {
            comprador: { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0', icon: '🛒', label: 'Comprador' },
            vendedor: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '🏪', label: 'Vendedor' },
            admin: { color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA', icon: '🛡️', label: 'Administrador' },
            administrador: { color: '#7A1E3A', bg: '#FDF2F4', border: '#F8D2DA', icon: '🛡️', label: 'Administrador' },
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* ── 4 KPI CARDS DE USUARIOS ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
                {[
                  {
                    title: 'Total Usuarios',
                    value: usuarios.length,
                    badge: `${activosList.length} activos`,
                    sub: 'Comunidad registrada',
                    Icon: IconUsers,
                    color: '#7A1E3A',
                    bg: '#FDF2F4',
                    border: '#F8D2DA',
                  },
                  {
                    title: 'Compradores',
                    value: compradoresList.length,
                    badge: `${Math.round((compradoresList.length / totalUsr) * 100)}% del total`,
                    sub: 'Lectores y clientes',
                    Icon: IconCart,
                    color: '#047857',
                    bg: '#ECFDF5',
                    border: '#A7F3D0',
                  },
                  {
                    title: 'Vendedores',
                    value: vendedoresList.length,
                    badge: `${Math.round((vendedoresList.length / totalUsr) * 100)}% del total`,
                    sub: `${tiendasActivasCount} tiendas asociadas`,
                    Icon: IconStore,
                    color: '#D97706',
                    bg: '#FFFBEB',
                    border: '#FDE68A',
                  },
                  {
                    title: 'Bloqueados',
                    value: bloqueadosList.length,
                    badge: bloqueadosList.length > 0 ? 'Sancionados' : 'Sin bloqueos',
                    sub: bloqueadosList.length > 0 ? 'Acceso revocado' : 'Todo operativo',
                    Icon: IconLock,
                    color: bloqueadosList.length > 0 ? '#DC2626' : '#6B7280',
                    bg: bloqueadosList.length > 0 ? '#FEF2F2' : '#F3F4F6',
                    border: bloqueadosList.length > 0 ? '#FECACA' : '#E5E7EB',
                  },
                ].map((k, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: darkMode ? '#1e1e1e' : WHITE,
                      borderRadius: '16px',
                      padding: '20px 22px',
                      border: `1px solid ${darkMode ? '#333333' : k.border}`,
                      boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: k.color }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: darkMode ? '#9ca3af' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {k.title}
                      </span>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: darkMode ? `${k.color}22` : k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <k.Icon width={18} height={18} style={{ color: k.color }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: '2.1rem', fontWeight: 900, color: darkMode ? '#f3f4f6' : CARBON, lineHeight: 1 }}>{k.value}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: k.color, background: darkMode ? `${k.color}22` : k.bg, border: `1px solid ${darkMode ? `${k.color}44` : k.border}`, padding: '2px 8px', borderRadius: 12 }}>
                        {k.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 500 }}>{k.sub}</span>
                  </div>
                ))}
              </div>

              {/* ── BARRA DE CONTROLES, BÚSQUEDA Y FILTROS ── */}
              <div style={{
                background: darkMode ? '#1e1e1e' : WHITE,
                borderRadius: '18px',
                padding: '20px 24px',
                border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                boxShadow: darkMode ? '0 4px 18px rgba(0,0,0,0.3)' : '0 4px 18px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>

                  {/* Buscador en vivo */}
                  <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 440 }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                      <IconSearch width={18} height={18} />
                    </div>
                    <input
                      type="text"
                      value={busquedaUsuarios}
                      onChange={(e) => {
                        setBusquedaUsuarios(e.target.value);
                        setPaginaUsuarios(1);
                      }}
                      placeholder="Buscar por nombre, correo, teléfono o ID..."
                      style={{
                        width: '100%',
                        padding: '11px 40px 11px 42px',
                        borderRadius: 12,
                        border: `1.5px solid ${darkMode ? '#444' : BORDER}`,
                        fontSize: '0.88rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        background: darkMode ? '#2a2a2a' : '#FAFAF9',
                        color: darkMode ? '#f3f4f6' : CARBON,
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = darkMode ? '#fb7185' : VINOTINTO; e.target.style.background = darkMode ? '#333' : WHITE; }}
                      onBlur={(e) => { e.target.style.borderColor = darkMode ? '#444' : BORDER; e.target.style.background = darkMode ? '#2a2a2a' : '#FAFAF9'; }}
                    />
                    {busquedaUsuarios && (
                      <button
                        onClick={() => { setBusquedaUsuarios(''); setPaginaUsuarios(1); }}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          padding: 4
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filtro por Estado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label htmlFor="admin-user-status-filter" style={{ fontSize: '0.82rem', fontWeight: 700, color: darkMode ? '#d1d5db' : '#4B5563' }}>Estado:</label>
                    <select
                      id="admin-user-status-filter"
                      value={filtroEstadoUsuario}
                      onChange={(e) => {
                        setFiltroEstadoUsuario(e.target.value);
                        setPaginaUsuarios(1);
                      }}
                      style={{
                        padding: '9px 14px',
                        borderRadius: 10,
                        border: `1.5px solid ${darkMode ? '#444' : BORDER}`,
                        background: darkMode ? '#2a2a2a' : WHITE,
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: darkMode ? '#f3f4f6' : CARBON,
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    >
                      <option value="todos">Todos los estados ({usuarios.length})</option>
                      <option value="Activo">🟢 Solo Activos ({activosList.length})</option>
                      <option value="Bloqueado">🔒 Solo Bloqueados ({bloqueadosList.length})</option>
                    </select>

                    {(busquedaUsuarios || filtroRol !== 'todos' || filtroEstadoUsuario !== 'todos') && (
                      <button
                        onClick={() => {
                          setBusquedaUsuarios('');
                          setFiltroRol('todos');
                          setFiltroEstadoUsuario('todos');
                          setPaginaUsuarios(1);
                        }}
                        style={{
                          background: darkMode ? '#333' : '#F3F4F6',
                          color: darkMode ? '#d1d5db' : '#4B5563',
                          border: 'none',
                          padding: '9px 14px',
                          borderRadius: 10,
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'background 0.2s',
                        }}
                      >
                        ↺ Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs de Filtro por Rol */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 6, borderTop: `1px solid ${darkMode ? '#333333' : BORDER}` }}>
                  {[
                    { key: 'todos', label: 'Todos', count: usuarios.length, icon: '👥' },
                    { key: 'comprador', label: 'Compradores', count: compradoresList.length, icon: '🛒' },
                    { key: 'vendedor', label: 'Vendedores', count: vendedoresList.length, icon: '🏪' },
                    { key: 'admin', label: 'Administradores', count: adminsList.length, icon: '🛡️' },
                  ].map((tab) => {
                    const activo = filtroRol === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setFiltroRol(tab.key);
                          setPaginaUsuarios(1);
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 20,
                          border: activo ? `1.5px solid ${VINOTINTO}` : `1.5px solid ${darkMode ? '#444' : BORDER}`,
                          background: activo ? VINOTINTO : darkMode ? '#2a2a2a' : '#FAFAF9',
                          color: activo ? WHITE : darkMode ? '#d1d5db' : '#4B5563',
                          fontSize: '0.82rem',
                          fontWeight: activo ? 800 : 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.18s ease',
                          fontFamily: 'inherit',
                          boxShadow: activo ? '0 2px 8px rgba(122,30,58,0.25)' : 'none',
                        }}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        <span style={{
                          background: activo ? 'rgba(255,255,255,0.25)' : darkMode ? '#444' : '#E5E7EB',
                          color: activo ? WHITE : darkMode ? '#d1d5db' : '#374151',
                          padding: '1px 7px',
                          borderRadius: 10,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          marginLeft: 2
                        }}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── TABLA DE USUARIOS ── */}
              <div style={{
                background: darkMode ? '#1e1e1e' : WHITE,
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
                border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 850 }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #7A1E3A 0%, #5E1629 100%)', color: WHITE }}>
                        <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', width: 70 }}>#ID</th>
                        <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Usuario</th>
                        <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contacto</th>
                        <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rol</th>
                        <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado</th>
                        <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: '#6B7280' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔍</div>
                            <h4 style={{ margin: '0 0 6px', color: darkMode ? '#f3f4f6' : CARBON, fontSize: '1.05rem', fontWeight: 800 }}>No se encontraron usuarios</h4>
                            <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: '#9CA3AF' }}>Intenta ajustar el término de búsqueda o cambiar los filtros seleccionados.</p>
                            <button
                              onClick={() => { setBusquedaUsuarios(''); setFiltroRol('todos'); setFiltroEstadoUsuario('todos'); }}
                              style={{
                                background: VINOTINTO,
                                color: WHITE,
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: 10,
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit'
                              }}
                            >
                              Restablecer Filtros
                            </button>
                          </td>
                        </tr>
                      ) : (
                        usuariosPaginados.map((u, i) => {
                          const esBloqueado = (u.estado_usuario || '').toLowerCase() === 'bloqueado';
                          const rolKey = (u.rol || 'comprador').toLowerCase().trim();
                          const rTheme = roleThemes[rolKey] || roleThemes.comprador;

                          return (
                            <tr
                              key={u.id_usuario}
                              style={{
                                background: esBloqueado ? (darkMode ? '#7f1d1d33' : '#FEF2F2') : i % 2 === 0 ? (darkMode ? '#252525' : '#FAFAF9') : (darkMode ? '#1e1e1e' : WHITE),
                                borderBottom: `1px solid ${darkMode ? '#333333' : BORDER}`,
                                transition: 'background 0.15s ease',
                              }}
                            >
                              {/* ID */}
                              <td style={{ padding: '14px 20px' }}>
                                <span style={{
                                  background: darkMode ? '#333' : '#F3F4F6',
                                  color: darkMode ? '#d1d5db' : '#4B5563',
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  padding: '3px 8px',
                                  borderRadius: 8,
                                  border: `1px solid ${darkMode ? '#444' : '#E5E7EB'}`
                                }}>
                                  #{u.id_usuario}
                                </span>
                              </td>

                              {/* Usuario y Avatar */}
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <AvatarUsuario usuario={u} size={40} fontSize="0.95rem" />
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: darkMode ? '#f3f4f6' : CARBON, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span>{u.nombre_usuario}</span>
                                      {u.email_verificado ? (
                                        <span title="Correo verificado" style={{ color: '#047857', fontSize: '0.8rem' }}>✓</span>
                                      ) : null}
                                    </div>
                                    <span style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 500 }}>
                                      {u.fecha_registro ? `Reg: ${u.fecha_registro}` : `Usuario #${u.id_usuario}`}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Correo y Teléfono */}
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <IconMail width={14} height={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', color: darkMode ? '#d1d5db' : '#374151', fontWeight: 600 }}>{u.correo_usuario}</span>
                                    <button
                                      onClick={() => copiarTexto(u.correo_usuario, u.id_usuario)}
                                      title="Copiar correo"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: copiadoId === u.id_usuario ? '#047857' : '#9CA3AF',
                                        cursor: 'pointer',
                                        padding: 2,
                                        fontSize: '0.75rem',
                                        display: 'inline-flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      {copiadoId === u.id_usuario ? '✓' : '📋'}
                                    </button>
                                  </div>
                                  {u.telefono && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#9CA3AF' }}>
                                      <IconPhone width={12} height={12} />
                                      <span>{u.telefono}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Rol */}
                              <td style={{ padding: '14px 20px' }}>
                                <span style={{
                                  background: rTheme.bg,
                                  color: rTheme.color,
                                  border: `1.5px solid ${rTheme.border}`,
                                  padding: '4px 11px',
                                  borderRadius: 20,
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}>
                                  <span>{rTheme.icon}</span>
                                  <span>{rTheme.label}</span>
                                </span>
                              </td>

                              {/* Estado */}
                              <td style={{ padding: '14px 20px' }}>
                                {esBloqueado ? (
                                  <span style={{
                                    background: '#FEF2F2',
                                    color: '#B91C1C',
                                    border: '1.5px solid #FECACA',
                                    padding: '4px 11px',
                                    borderRadius: 20,
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5
                                  }}>
                                    <IconLock width={13} height={13} style={{ color: '#B91C1C' }} />
                                    <span>Bloqueado</span>
                                  </span>
                                ) : (
                                  <span style={{
                                    background: '#ECFDF5',
                                    color: '#047857',
                                    border: '1.5px solid #A7F3D0',
                                    padding: '4px 11px',
                                    borderRadius: 20,
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6
                                  }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 0 2px #A7F3D0' }} />
                                    <span>Activo</span>
                                  </span>
                                )}
                              </td>

                              {/* Acciones */}
                              <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>

                                  {/* Botón Ver Ficha / Detalle */}
                                  <button
                                    onClick={() => setModalDetalleUsuario(u)}
                                    title="Ver detalles del usuario"
                                    style={{
                                      background: darkMode ? '#333' : '#F3F4F6',
                                      color: darkMode ? '#d1d5db' : '#374151',
                                      border: `1px solid ${darkMode ? '#444' : '#E5E7EB'}`,
                                      padding: '7px 12px',
                                      borderRadius: 8,
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                      fontSize: '0.78rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      fontFamily: 'inherit',
                                      transition: 'background 0.15s'
                                    }}
                                  >
                                    <IconEye width={14} height={14} />
                                    <span>Ficha</span>
                                  </button>

                                  {/* Botón Bloquear / Desbloquear */}
                                  <button
                                    onClick={() => abrirModalBloqueo(u)}
                                    style={{
                                      background: esBloqueado ? '#047857' : '#DC2626',
                                      color: WHITE,
                                      border: 'none',
                                      padding: '7px 13px',
                                      borderRadius: 8,
                                      cursor: 'pointer',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      fontSize: '0.78rem',
                                      fontFamily: 'inherit',
                                      boxShadow: `0 2px 6px ${esBloqueado ? '#04785740' : '#DC262640'}`,
                                      transition: 'transform 0.15s'
                                    }}
                                  >
                                    {esBloqueado ? (
                                      <>
                                        <IconUnlock width={13} height={13} style={{ color: WHITE }} />
                                        <span>Desbloquear</span>
                                      </>
                                    ) : (
                                      <>
                                        <IconLock width={13} height={13} style={{ color: WHITE }} />
                                        <span>Bloquear</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── FOOTER Y PAGINACIÓN ── */}
                <div style={{
                  padding: '16px 24px',
                  background: darkMode ? '#252525' : '#FAFAF9',
                  borderTop: `1px solid ${darkMode ? '#333333' : BORDER}`,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                  <span style={{ fontSize: '0.82rem', color: darkMode ? '#9ca3af' : '#6B7280', fontWeight: 600 }}>
                    Mostrando{' '}
                    <strong>
                      {usuariosFiltrados.length === 0 ? 0 : (paginaUsuarios - 1) * registrosPorPagina + 1}
                      -
                      {Math.min(paginaUsuarios * registrosPorPagina, usuariosFiltrados.length)}
                    </strong>{' '}
                    de <strong>{usuariosFiltrados.length}</strong> usuarios filtrados (Total: {usuarios.length})
                  </span>

                  {totalPaginasUsuarios > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => setPaginaUsuarios(prev => Math.max(prev - 1, 1))}
                        disabled={paginaUsuarios === 1}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          border: `1.5px solid ${darkMode ? '#444' : BORDER}`,
                          background: paginaUsuarios === 1 ? (darkMode ? '#333' : '#F3F4F6') : (darkMode ? '#2a2a2a' : WHITE),
                          color: paginaUsuarios === 1 ? '#9CA3AF' : (darkMode ? '#f3f4f6' : CARBON),
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: paginaUsuarios === 1 ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        ← Anterior
                      </button>

                      {Array.from({ length: totalPaginasUsuarios }, (_, idx) => idx + 1).map((pg) => {
                        const esActual = paginaUsuarios === pg;
                        return (
                          <button
                            key={pg}
                            onClick={() => setPaginaUsuarios(pg)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              border: esActual ? 'none' : `1px solid ${darkMode ? '#444' : BORDER}`,
                              background: esActual ? VINOTINTO : (darkMode ? '#2a2a2a' : WHITE),
                              color: esActual ? WHITE : (darkMode ? '#f3f4f6' : CARBON),
                              fontSize: '0.82rem',
                              fontWeight: esActual ? 800 : 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'inherit'
                            }}
                          >
                            {pg}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setPaginaUsuarios(prev => Math.min(prev + 1, totalPaginasUsuarios))}
                        disabled={paginaUsuarios === totalPaginasUsuarios}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          border: `1.5px solid ${darkMode ? '#444' : BORDER}`,
                          background: paginaUsuarios === totalPaginasUsuarios ? (darkMode ? '#333' : '#F3F4F6') : (darkMode ? '#2a2a2a' : WHITE),
                          color: paginaUsuarios === totalPaginasUsuarios ? '#9CA3AF' : (darkMode ? '#f3f4f6' : CARBON),
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: paginaUsuarios === totalPaginasUsuarios ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* LIBROS */}
        {activeSection === 'libros' && (
          <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: '14px', overflow: 'hidden', boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${darkMode ? '#333333' : BORDER}`, padding: '16px' }}>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="admin-book-category-filter" style={{ fontWeight: 600, fontSize: '0.9rem', color: darkMode ? '#d1d5db' : '#555' }}>Filtrar por Categoría:</label>
              <select
                id="admin-book-category-filter"
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value);
                  setPaginaLibros(1);
                }}
                style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#444' : '#FAF8F5'}`, background: darkMode ? '#2a2a2a' : WHITE, color: darkMode ? '#f3f4f6' : CARBON, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
              >
                <option value="todas">Todas las Categorías</option>
                {[
                  "Arte", "Aventura", "Biografia", "Ciencia", "Comedia",
                  "Educacion", "Fantasia", "Ficcion", "Historia", "Infantil",
                  "Ingenieria", "Juvenil", "Romance", "Tecnologia", "Terror"
                ].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: VINOTINTO, color: WHITE }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Título</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Autor</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Tienda</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Precio</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Categoría</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {librosPaginados.map((l, i) => (
                  <tr key={l.id_libro} style={{
                    background: l.oculto ? (darkMode ? '#7f1d1d33' : '#fff3f3') : i % 2 === 0 ? (darkMode ? '#252525' : '#fafafa') : (darkMode ? '#1e1e1e' : WHITE),
                    opacity: l.oculto ? 0.7 : 1,
                    borderBottom: `1px solid ${darkMode ? '#333333' : '#FAF8F5'}`
                  }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: darkMode ? '#f3f4f6' : CARBON }}>{l.titulo}</td>
                    <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#555' }}>{l.autor_libro}</td>
                    <td style={{ padding: '12px 16px', color: darkMode ? '#fb7185' : '#7A1E3A', fontWeight: 600 }}>{l.nombre_tienda || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: darkMode ? '#f3f4f6' : CARBON }}>${Number(l.precio_libro).toLocaleString('es-CO')}</td>

                    <td style={{ padding: '12px 16px', color: darkMode ? '#9ca3af' : '#666', fontSize: '0.85rem', fontWeight: 500 }}>
                      {l.nombre_categoria || 'Sin categoría'}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: l.oculto ? RED : GREEN,
                        color: WHITE, padding: '4px 10px', borderRadius: '20px',
                        fontSize: '0.8rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                      }}>
                        {l.oculto
                          ? <IconBan className="" width={14} height={14} style={{ color: WHITE }} />
                          : <IconCheck className="" width={14} height={14} style={{ color: WHITE }} />}
                        {l.oculto ? 'Oculto' : 'Visible'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => ocultarLibro(l.id_libro, l.oculto)}
                        style={{
                          background: (l.oculto === 1 || l.oculto === true || l.oculto == "1") ? '#6c757d' : VINOTINTO,
                          color: WHITE,
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          opacity: (l.oculto === 1 || l.oculto === true || l.oculto == "1") ? 0.6 : 1
                        }}
                      >
                        {(l.oculto === 1 || l.oculto === true || l.oculto == "1") ? 'Mostrar' : 'Ocultar'}
                      </button>
                      <button onClick={() => eliminarLibro(l.id_libro)} style={{
                        background: RED, color: WHITE, border: 'none',
                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                      }}>
                        <IconTrash className="" width={14} height={14} style={{ color: WHITE }} /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {librosFiltrados.length > registrosPorPagina && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px'
                }}
              >
                <span>
                  Mostrando {(paginaLibros - 1) * registrosPorPagina + 1}-{Math.min(paginaLibros * registrosPorPagina, librosFiltrados.length)} de {librosFiltrados.length} libros
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPaginaLibros(paginaLibros - 1)}
                    disabled={paginaLibros === 1}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: paginaLibros === 1 ? (darkMode ? '#333' : '#ccc') : VINOTINTO,
                      color: WHITE,
                      cursor: 'pointer'
                    }}
                  >
                    Anterior
                  </button>

                  <span style={{ padding: '8px 12px', fontWeight: 600, color: darkMode ? '#f3f4f6' : CARBON }}>
                    {paginaLibros} / {totalPaginasLibros}
                  </span>

                  <button
                    onClick={() => setPaginaLibros(paginaLibros + 1)}
                    disabled={paginaLibros === totalPaginasLibros}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background:
                        paginaLibros === totalPaginasLibros
                          ? (darkMode ? '#333' : '#ccc')
                          : VINOTINTO,
                      color: WHITE,
                      cursor: 'pointer'
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TIENDAS */}
        {activeSection === 'tiendas' && (
          <div style={{ display: 'grid', gap: 20 }}>

            {/* KPI Cards de tiendas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              {[
                { label: 'Total', value: tiendas.length, color: darkMode ? '#fb7185' : VINOTINTO, bg: darkMode ? 'rgba(251, 113, 133, 0.15)' : '#fdf2f4', border: darkMode ? 'rgba(251, 113, 133, 0.3)' : '#f0dde4', icon: <IconStore width={22} height={22} /> },
                { label: 'Activas', value: tiendas.filter(t => (t.estado_tienda || '').toLowerCase() === 'activa').length, color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', icon: <IconCheck width={22} height={22} strokeWidth={2.5} /> },
                { label: 'Pendientes', value: tiendas.filter(t => (t.estado_tienda || '').toLowerCase() === 'pendiente').length, color: '#B45309', bg: '#fffbeb', border: '#fde68a', icon: <IconAlertTriangle width={22} height={22} strokeWidth={2} /> },
                { label: 'Suspendidas', value: tiendas.filter(t => (t.estado_tienda || '').toLowerCase() === 'suspendida').length, color: '#B91C1C', bg: '#fef2f2', border: '#fecaca', icon: <IconBan width={22} height={22} /> },
              ].map((kpi) => (
                <div key={kpi.label} style={{
                  background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 14, padding: '16px 18px',
                  border: `1px solid ${darkMode ? '#333333' : BORDER}`, boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: darkMode ? `${kpi.color}22` : kpi.bg, color: kpi.color,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    border: `1px solid ${darkMode ? `${kpi.color}44` : kpi.border}`,
                  }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
                    <h3 style={{ margin: '2px 0 0', fontSize: '1.6rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Barra de búsqueda y filtros */}
            <div style={{
              background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 14, padding: '14px 18px',
              border: `1px solid ${darkMode ? '#333333' : BORDER}`, boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            }}>
              {/* Búsqueda */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, flex: 1,
                minWidth: 240, background: darkMode ? '#2a2a2a' : '#fafafa',
                border: `1px solid ${darkMode ? '#444' : BORDER}`, borderRadius: 10, padding: '8px 14px',
              }}>
                <IconSearch width={17} height={17} style={{ color: darkMode ? '#9ca3af' : GRAY }} />
                <input
                  type="text"
                  value={busquedaTiendas}
                  onChange={(e) => { setBusquedaTiendas(e.target.value); setPaginaTiendas(1); }}
                  placeholder="Buscar por nombre, dirección, teléfono o ID..."
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.88rem', fontFamily: 'inherit', color: darkMode ? '#f3f4f6' : CARBON }}
                />
                {busquedaTiendas && (
                  <button onClick={() => { setBusquedaTiendas(''); setPaginaTiendas(1); }} style={{ border: 0, background: 'none', cursor: 'pointer', color: darkMode ? '#9ca3af' : GRAY, padding: 0 }}>
                    <IconClose width={15} height={15} />
                  </button>
                )}
              </div>

              {/* Filtros de estado */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { value: 'todos', label: 'Todas', color: darkMode ? '#fb7185' : VINOTINTO, bg: darkMode ? 'rgba(251, 113, 133, 0.15)' : '#fdf2f4', border: darkMode ? 'rgba(251, 113, 133, 0.3)' : '#f0dde4' },
                  ...ESTADOS_TIENDA,
                ].map((est) => {
                  const activo = filtroEstadoTienda === est.value;
                  const itemColor = darkMode && est.color === VINOTINTO ? '#fb7185' : est.color;
                  const activeBg = darkMode ? `${itemColor}25` : (est.bg || '#fdf2f4');
                  return (
                    <button
                      key={est.value}
                      onClick={() => { setFiltroEstadoTienda(est.value); setPaginaTiendas(1); }}
                      style={{
                        padding: '6px 0', borderRadius: 20, cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: 118,
                        border: activo ? `1.5px solid ${itemColor}` : `1px solid ${darkMode ? '#444' : BORDER}`,
                        background: activo ? activeBg : (darkMode ? '#2a2a2a' : WHITE),
                        color: est.value === 'todos' ? (activo ? itemColor : (darkMode ? '#d1d5db' : GRAY)) : itemColor,
                        boxShadow: activo ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {est.value !== 'todos' && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: itemColor, display: 'inline-block', flexShrink: 0 }} />
                      )}
                      {est.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabla rediseñada */}
            <div style={{
              background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, overflow: 'hidden',
              boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)', border: `1px solid ${darkMode ? '#333333' : BORDER}`,
            }}>
              {/* Cabecera */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr 1.4fr 140px 130px 140px 160px',
                background: `linear-gradient(135deg, ${VINOTINTO} 0%, #9b2c4e 100%)`,
                padding: '0 8px',
              }}>
                {['#', 'Nombre de la tienda', 'Dirección', 'Teléfono', 'Registro', 'Estado', 'Acciones'].map((h, i) => (
                  <div key={h} style={{
                    padding: '14px 12px',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.76rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: i === 6 ? 'center' : 'left',
                  }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Filas */}
              {tiendasFiltradas.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: darkMode ? '#9ca3af' : GRAY }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🏪</div>
                  <p style={{ margin: 0, fontWeight: 600, color: darkMode ? '#f3f4f6' : CARBON, fontSize: '1rem' }}>No se encontraron tiendas</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: darkMode ? '#9ca3af' : GRAY }}>Prueba cambiando el filtro o el término de búsqueda.</p>
                </div>
              ) : (
                tiendasPaginadas.map((t, i) => {
                  const estadoActual = (t.estado_tienda || '').toLowerCase();
                  const cfg = ESTADOS_TIENDA.find(e => e.value === estadoActual) || ESTADOS_TIENDA[4];
                  const abierto = dropdownTiendaAbierto === t.id_tienda;
                  const fechaFormateada = t.fecha_creacion
                    ? new Date(t.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  const inicial = (t.nombre_tienda || '?').charAt(0).toUpperCase();

                  return (
                    <div
                      key={t.id_tienda}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '56px 1fr 1.4fr 140px 130px 140px 160px',
                        padding: '0 8px',
                        borderBottom: i < tiendasPaginadas.length - 1 ? `1px solid ${darkMode ? '#333333' : BORDER}` : 'none',
                        background: i % 2 === 0 ? (darkMode ? '#1e1e1e' : WHITE) : (darkMode ? '#252525' : '#fdfcfc'),
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#2a2a2a' : '#fdf8f9'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? (darkMode ? '#1e1e1e' : WHITE) : (darkMode ? '#252525' : '#fdfcfc')}
                    >
                      {/* ID */}
                      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 700, color: darkMode ? '#9ca3af' : GRAY,
                          background: darkMode ? '#333' : '#f5f5f5', borderRadius: 6, padding: '3px 7px',
                        }}>
                          #{t.id_tienda}
                        </span>
                      </div>

                      {/* Nombre */}
                      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: `linear-gradient(135deg, ${VINOTINTO} 0%, #9b2c4e 100%)`,
                          color: WHITE, display: 'grid', placeItems: 'center',
                          fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 2px 8px rgba(122,30,58,0.2)',
                        }}>
                          {inicial}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.nombre_tienda || '—'}
                          </p>
                          {t.correo_tienda && (
                            <p style={{ margin: '1px 0 0', fontSize: '0.76rem', color: darkMode ? '#9ca3af' : GRAY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.correo_tienda}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dirección */}
                      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.84rem', color: darkMode ? '#d1d5db' : '#555', lineHeight: 1.4 }}>
                          {t.direccion || '—'}
                        </span>
                      </div>

                      {/* Teléfono */}
                      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.84rem', color: darkMode ? '#d1d5db' : '#555', fontFamily: 'monospace' }}>
                          {t.telefono || '—'}
                        </span>
                      </div>

                      {/* Fecha registro */}
                      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600 }}>
                          {fechaFormateada}
                        </span>
                      </div>

                      {/* Estado (badge) */}
                      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          background: darkMode ? `${cfg.color}22` : cfg.bg, color: cfg.color, border: `1px solid ${darkMode ? `${cfg.color}44` : cfg.border}`,
                          padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                        }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Acciones (dropdown) */}
                      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDropdownTiendaAbierto(abierto ? null : t.id_tienda); }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 7,
                              background: darkMode ? `${cfg.color}22` : cfg.bg, color: cfg.color,
                              border: `1.5px solid ${darkMode ? `${cfg.color}44` : cfg.border}`,
                              padding: '7px 13px', borderRadius: 20,
                              fontSize: '0.8rem', fontWeight: 700,
                              cursor: 'pointer', fontFamily: 'inherit',
                              whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                              transition: 'all 0.15s',
                            }}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                            {cfg.label}
                            <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>▾</span>
                          </button>

                          {abierto && (
                            <div style={{
                              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                              background: darkMode ? '#252525' : WHITE, border: `1px solid ${darkMode ? '#444' : BORDER}`,
                              borderRadius: 14, boxShadow: darkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.14)',
                              zIndex: 1000, minWidth: 170, overflow: 'hidden',
                            }}>
                              <div style={{ padding: '8px 14px 6px', borderBottom: `1px solid ${darkMode ? '#333' : BORDER}`, marginBottom: 4 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: darkMode ? '#9ca3af' : GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Cambiar estado
                                </span>
                              </div>
                              {ESTADOS_TIENDA.map(est => (
                                <button
                                  key={est.value}
                                  onClick={() => {
                                    setDropdownTiendaAbierto(null);
                                    if (est.value !== estadoActual) manejarEstadoTienda(t.id_tienda, est.value, t.nombre_tienda);
                                  }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    width: '100%', padding: '9px 14px',
                                    background: est.value === estadoActual ? (darkMode ? `${est.color}22` : est.bg) : 'transparent',
                                    border: 'none', cursor: est.value === estadoActual ? 'default' : 'pointer',
                                    fontFamily: 'inherit', fontSize: '0.84rem',
                                    fontWeight: est.value === estadoActual ? 700 : 500,
                                    color: est.value === estadoActual ? est.color : (darkMode ? '#f3f4f6' : CARBON),
                                    textAlign: 'left', transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={e => { if (est.value !== estadoActual) e.currentTarget.style.background = darkMode ? '#333' : est.bg; }}
                                  onMouseLeave={e => { if (est.value !== estadoActual) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: est.color, flexShrink: 0 }} />
                                  <span>{est.label}</span>
                                  {est.value === estadoActual && <span style={{ marginLeft: 'auto', color: est.color, fontSize: '0.75rem' }}>✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Paginación */}
            {tiendasFiltradas.length > registrosPorPagina && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: darkMode ? '#252525' : WHITE, borderRadius: 14, padding: '12px 20px',
                border: `1px solid ${darkMode ? '#333333' : BORDER}`, boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
                flexWrap: 'wrap', gap: 10,
              }}>
                <span style={{ fontSize: '0.84rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600 }}>
                  Mostrando {(paginaTiendas - 1) * registrosPorPagina + 1}–{Math.min(paginaTiendas * registrosPorPagina, tiendasFiltradas.length)} de {tiendasFiltradas.length} tiendas
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setPaginaTiendas(prev => Math.max(prev - 1, 1))}
                    disabled={paginaTiendas === 1}
                    style={{
                      padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: paginaTiendas === 1 ? 'not-allowed' : 'pointer',
                      border: `1.5px solid ${darkMode ? '#444' : BORDER}`, background: paginaTiendas === 1 ? (darkMode ? '#333' : '#F3F4F6') : (darkMode ? '#2a2a2a' : WHITE),
                      color: paginaTiendas === 1 ? '#9CA3AF' : (darkMode ? '#f3f4f6' : CARBON), fontFamily: 'inherit',
                    }}
                  >
                    ← Anterior
                  </button>
                  <span style={{
                    padding: '7px 16px', borderRadius: 8, fontWeight: 800, fontSize: '0.82rem',
                    background: VINOTINTO, color: WHITE,
                  }}>
                    {paginaTiendas} / {totalPaginasTiendas}
                  </span>
                  <button
                    onClick={() => setPaginaTiendas(prev => Math.min(prev + 1, totalPaginasTiendas))}
                    disabled={paginaTiendas === totalPaginasTiendas}
                    style={{
                      padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: paginaTiendas === totalPaginasTiendas ? 'not-allowed' : 'pointer',
                      border: `1.5px solid ${darkMode ? '#444' : BORDER}`, background: paginaTiendas === totalPaginasTiendas ? (darkMode ? '#333' : '#F3F4F6') : (darkMode ? '#2a2a2a' : WHITE),
                      color: paginaTiendas === totalPaginasTiendas ? '#9CA3AF' : (darkMode ? '#f3f4f6' : CARBON), fontFamily: 'inherit',
                    }}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUEJAS Y RECLAMOS */}
        {activeSection === 'reclamos' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* STATS HEADER CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, padding: '20px', border: darkMode ? '1.5px solid rgba(224,90,122,0.38)' : '1.5px solid #F8D2DA', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: darkMode ? 'rgba(224,90,122,0.15)' : '#fdf2f4', display: 'grid', placeItems: 'center', color: darkMode ? '#e05a7a' : VINOTINTO }}>
                  <IconAlertTriangle width={24} height={24} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: darkMode ? '#c8c8c8' : GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Reclamos</p>
                  <h3 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: darkMode ? '#f3f4f6' : CARBON }}>{conteoReclamosPorEstado.Todos}</h3>
                </div>
              </div>

              <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, padding: '20px', border: darkMode ? '1.5px solid rgba(147,197,253,0.35)' : '1.5px solid #93c5fd', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: darkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff', display: 'grid', placeItems: 'center', color: darkMode ? '#93c5fd' : '#1e40af' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>!</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: darkMode ? '#93c5fd' : '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abiertos</p>
                  <h3 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: darkMode ? '#93c5fd' : '#1e40af' }}>{conteoReclamosPorEstado.Abierto}</h3>
                </div>
              </div>

              <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, padding: '20px', border: darkMode ? '1.5px solid rgba(251,146,60,0.38)' : '1.5px solid #fdba74', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: darkMode ? 'rgba(234,88,12,0.15)' : '#fff7ed', display: 'grid', placeItems: 'center', color: darkMode ? '#fb923c' : '#ea580c' }}>
                  <IconTool width={24} height={24} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: darkMode ? '#fb923c' : '#ea580c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En Revisión</p>
                  <h3 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: darkMode ? '#fb923c' : '#ea580c' }}>{conteoReclamosPorEstado['En revisión']}</h3>
                </div>
              </div>

              <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, padding: '20px', border: darkMode ? '1.5px solid rgba(52,211,153,0.38)' : '1.5px solid #a7f3d0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: darkMode ? 'rgba(16,185,129,0.15)' : '#dcfce7', display: 'grid', placeItems: 'center', color: '#16a34a' }}>
                  <IconCheck width={24} height={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: darkMode ? '#34d399' : '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resueltos</p>
                  <h3 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: darkMode ? '#34d399' : '#166534' }}>{conteoReclamosPorEstado.Resuelto}</h3>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, padding: '16px 20px', border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, background: darkMode ? '#252525' : '#fafafa', border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`, borderRadius: 10, padding: '8px 14px' }}>
                <IconSearch width={18} height={18} style={{ color: darkMode ? '#c8c8c8' : GRAY }} />
                <input
                  type="text"
                  value={busquedaReclamos}
                  onChange={(e) => {
                    setBusquedaReclamos(e.target.value);
                    setPaginaReclamos(1);
                  }}
                  placeholder="Buscar por comprador, tienda, orden o ID..."
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit', color: darkMode ? '#f3f4f6' : CARBON }}
                />
                {busquedaReclamos && (
                  <button onClick={() => { setBusquedaReclamos(''); setPaginaReclamos(1); }} style={{ border: 0, background: 'none', cursor: 'pointer', color: darkMode ? '#c8c8c8' : GRAY, padding: 0 }}>
                    <IconClose width={16} height={16} />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { id: 'Todos', label: 'Todos', activeBg: VINOTINTO, activeBorder: VINOTINTO, inactiveBg: '#fdf8f9', inactiveBorder: '#f0dde4', inactiveColor: VINOTINTO, dot: VINOTINTO },
                  { id: 'Abierto', label: 'Abierto', activeBg: '#2563eb', activeBorder: '#2563eb', inactiveBg: '#eff6ff', inactiveBorder: '#bfdbfe', inactiveColor: '#1e40af', dot: '#3b82f6' },
                  { id: 'En revisión', label: 'En revisión', activeBg: '#ea580c', activeBorder: '#ea580c', inactiveBg: '#fff7ed', inactiveBorder: '#fed7aa', inactiveColor: '#c2410c', dot: '#ea580c' },
                  { id: 'Resuelto', label: 'Resuelto', activeBg: '#16a34a', activeBorder: '#16a34a', inactiveBg: '#f0fdf4', inactiveBorder: '#bbf7d0', inactiveColor: '#15803d', dot: '#16a34a' },
                  { id: 'Rechazado', label: 'Rechazado', activeBg: '#dc2626', activeBorder: '#dc2626', inactiveBg: '#fef2f2', inactiveBorder: '#fecaca', inactiveColor: '#b91c1c', dot: '#ef4444' },
                ].map((p) => {
                  const activo = filtroEstadoReclamos === p.id;
                  const count = conteoReclamosPorEstado[p.id] || 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setFiltroEstadoReclamos(p.id);
                        setPaginaReclamos(1);
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 20,
                        border: `1.5px solid ${activo
                          ? (darkMode ? 'rgba(255,255,255,0.45)' : p.activeBorder)
                          : (darkMode ? 'rgba(255,255,255,0.14)' : p.inactiveBorder)}`,
                        background: activo
                          ? (darkMode ? 'rgba(255,255,255,0.16)' : p.activeBg)
                          : (darkMode ? 'rgba(255,255,255,0.04)' : p.inactiveBg),
                        color: activo ? WHITE : (darkMode ? '#d4d4d8' : p.inactiveColor),
                        fontWeight: 700,
                        fontSize: '0.83rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        boxShadow: activo ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: activo ? (darkMode ? p.dot : WHITE) : p.dot,
                        display: 'inline-block',
                      }} />
                      {p.label}
                      <span style={{
                        padding: '2px 7px',
                        borderRadius: 10,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: activo
                          ? (darkMode ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.25)')
                          : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                        color: activo ? WHITE : (darkMode ? '#d4d4d8' : p.inactiveColor),
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LIST OF COMPLAINTS */}
            {reclamosFiltrados.length === 0 ? (
              <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: darkMode ? '#c8c8c8' : GRAY, border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: darkMode ? '#f3f4f6' : CARBON }}>No hay quejas ni reclamos que coincidan con la búsqueda.</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: darkMode ? '#c8c8c8' : GRAY }}>Prueba cambiando el filtro o término de búsqueda.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {reclamosPaginados.map((reclamo) => (
                    <CardReclamoAdmin
                      key={reclamo.id_solicitud}
                      reclamo={reclamo}
                      onAbrirChat={handleAbrirChat}
                      onAbrirModal={handleAbrirModal}
                      onVerEvidencia={handleVerEvidencia}
                      darkMode={darkMode}
                    />
                  ))}
                </div>

                {/* PAGINACIÓN DE RECLAMOS */}
                {reclamosFiltrados.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: darkMode ? '#1e1e1e' : WHITE,
                    borderRadius: 14,
                    padding: '12px 20px',
                    border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}>
                    <span style={{ fontSize: '0.84rem', color: darkMode ? '#c8c8c8' : GRAY, fontWeight: 600 }}>
                      Mostrando {((paginaReclamos - 1) * registrosPorPagina) + 1}–{Math.min(paginaReclamos * registrosPorPagina, reclamosFiltrados.length)} de {reclamosFiltrados.length} reclamos
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => setPaginaReclamos(prev => Math.max(prev - 1, 1))}
                        disabled={paginaReclamos === 1}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 8,
                          border: `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                          background: paginaReclamos === 1 ? (darkMode ? '#2d2d2d' : '#F3F4F6') : (darkMode ? '#1e1e1e' : WHITE),
                          color: paginaReclamos === 1 ? (darkMode ? '#6b7280' : '#9CA3AF') : (darkMode ? '#f3f4f6' : CARBON),
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: paginaReclamos === 1 ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        ← Anterior
                      </button>

                      <span style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        background: VINOTINTO,
                        color: WHITE,
                      }}>
                        {paginaReclamos} / {totalPaginasReclamos}
                      </span>

                      <button
                        onClick={() => setPaginaReclamos(prev => Math.min(prev + 1, totalPaginasReclamos))}
                        disabled={paginaReclamos === totalPaginasReclamos}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 8,
                          border: `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                          background: paginaReclamos === totalPaginasReclamos ? (darkMode ? '#2d2d2d' : '#F3F4F6') : (darkMode ? '#1e1e1e' : WHITE),
                          color: paginaReclamos === totalPaginasReclamos ? (darkMode ? '#6b7280' : '#9CA3AF') : (darkMode ? '#f3f4f6' : CARBON),
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: paginaReclamos === totalPaginasReclamos ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* SOPORTE TÉCNICO */}
        {activeSection === 'soporte' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              {[
                { id: 'compradores', label: 'Soporte · Compradores', count: soporteCompradores.length },
                { id: 'vendedores', label: 'Soporte · Vendedores', count: soporteVendedores.length },
              ].map((v) => {
                const activo = vistaSoporte === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVistaSoporte(v.id);
                      setPaginaSoporte(1);
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      border: activo ? `2px solid ${VINOTINTO}` : `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                      background: activo ? `linear-gradient(135deg, ${VINOTINTO} 0%, #9b2c4e 100%)` : (darkMode ? '#1e1e1e' : WHITE),
                      color: activo ? WHITE : (darkMode ? '#e05a7a' : VINOTINTO),
                      borderRadius: 999, padding: '10px 20px', cursor: 'pointer',
                      fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
                      boxShadow: activo ? '0 4px 14px rgba(122,30,58,0.25)' : 'none',
                    }}
                  >
                    <IconTool width={16} height={16} strokeWidth={2} />
                    {v.label}
                    <span style={{
                      background: activo ? 'rgba(255,255,255,0.25)' : (darkMode ? 'rgba(224,90,122,0.2)' : '#f7e9ee'),
                      color: activo ? WHITE : (darkMode ? '#f0a8bd' : VINOTINTO),
                      borderRadius: 999, padding: '1px 9px', fontSize: '0.78rem', fontWeight: 800,
                    }}>
                      {v.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {soporteMostrado.length === 0 ? (
              <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1.5px dashed #eee3e9' }}>
                <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%', background: darkMode ? 'rgba(224,90,122,0.15)' : '#fdf2f4', display: 'grid', placeItems: 'center' }}>
                  <IconTool width={26} height={26} style={{ color: darkMode ? '#e05a7a' : VINOTINTO }} />
                </div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON }}>No hay tickets de soporte</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: darkMode ? '#c8c8c8' : GRAY }}>
                  No hay tickets pendientes para {vistaSoporte === 'compradores' ? 'compradores' : 'vendedores'}.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="admin-soporte-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '16px',
                    alignItems: 'start',
                  }}
                >
                  {soportePaginado.map((ticket) => (
                    <CardSoporteAdmin
                      key={ticket.id_solicitud}
                      ticket={ticket}
                      onAbrirModal={handleAbrirModal}
                      darkMode={darkMode}
                    />
                  ))}
                </div>

                {/* PAGINACIÓN DE SOPORTE */}
                {soporteMostrado.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: darkMode ? '#1e1e1e' : WHITE,
                    borderRadius: 14,
                    padding: '12px 20px',
                    border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}>
                    <span style={{ fontSize: '0.84rem', color: darkMode ? '#c8c8c8' : GRAY, fontWeight: 600 }}>
                      Mostrando {((paginaSoporte - 1) * registrosPorPagina) + 1}–{Math.min(paginaSoporte * registrosPorPagina, soporteMostrado.length)} de {soporteMostrado.length} tickets
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => setPaginaSoporte(prev => Math.max(prev - 1, 1))}
                        disabled={paginaSoporte === 1}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 8,
                          border: `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                          background: paginaSoporte === 1 ? (darkMode ? '#2d2d2d' : '#F3F4F6') : (darkMode ? '#1e1e1e' : WHITE),
                          color: paginaSoporte === 1 ? (darkMode ? '#6b7280' : '#9CA3AF') : (darkMode ? '#f3f4f6' : CARBON),
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: paginaSoporte === 1 ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        ← Anterior
                      </button>

                      <span style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        background: VINOTINTO,
                        color: WHITE,
                      }}>
                        {paginaSoporte} / {totalPaginasSoporte}
                      </span>

                      <button
                        onClick={() => setPaginaSoporte(prev => Math.min(prev + 1, totalPaginasSoporte))}
                        disabled={paginaSoporte === totalPaginasSoporte}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 8,
                          border: `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                          background: paginaSoporte === totalPaginasSoporte ? (darkMode ? '#2d2d2d' : '#F3F4F6') : (darkMode ? '#1e1e1e' : WHITE),
                          color: paginaSoporte === totalPaginasSoporte ? (darkMode ? '#6b7280' : '#9CA3AF') : (darkMode ? '#f3f4f6' : CARBON),
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: paginaSoporte === totalPaginasSoporte ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ÓRDENES */}
        {activeSection === 'ordenes' && (
          <div style={{ display: 'grid', gap: 20 }}>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14 }}>
              {[
                { label: 'Total órdenes', value: ordenes.length, color: darkMode ? '#fb7185' : VINOTINTO, bg: darkMode ? 'rgba(251, 113, 133, 0.15)' : '#fdf2f4', border: darkMode ? 'rgba(251, 113, 133, 0.3)' : '#f0dde4', icon: <IconPackage width={22} height={22} /> },
                { label: 'Pagadas', value: ordenes.filter(o => ['pagado', 'pagada'].includes((o.estado || o.estado_orden || '').toLowerCase())).length, color: darkMode ? '#34d399' : '#047857', bg: darkMode ? 'rgba(52, 211, 153, 0.15)' : '#ecfdf5', border: darkMode ? 'rgba(52, 211, 153, 0.3)' : '#a7f3d0', icon: <IconDollar width={22} height={22} /> },
                { label: 'Entregadas', value: ordenes.filter(o => ['entregada', 'entregado', 'completada', 'finalizada'].includes((o.estado || o.estado_orden || '').toLowerCase())).length, color: darkMode ? '#60a5fa' : '#2563EB', bg: darkMode ? 'rgba(96, 165, 250, 0.15)' : '#eff6ff', border: darkMode ? 'rgba(96, 165, 250, 0.3)' : '#bfdbfe', icon: <IconCheck width={22} height={22} strokeWidth={2.5} /> },
                { label: 'Enviadas', value: ordenes.filter(o => ['enviada', 'enviado'].includes((o.estado || o.estado_orden || '').toLowerCase())).length, color: darkMode ? '#fb923c' : '#ea580c', bg: darkMode ? 'rgba(251, 146, 60, 0.15)' : '#fff7ed', border: darkMode ? 'rgba(251, 146, 60, 0.3)' : '#fdba74', icon: <IconTruck width={22} height={22} /> },
                { label: 'Canceladas', value: ordenes.filter(o => ['cancelada', 'cancelado'].includes((o.estado || o.estado_orden || '').toLowerCase())).length, color: darkMode ? '#f87171' : '#B91C1C', bg: darkMode ? 'rgba(248, 113, 113, 0.15)' : '#fef2f2', border: darkMode ? 'rgba(248, 113, 113, 0.3)' : '#fecaca', icon: <IconBan width={22} height={22} /> },
              ].map((kpi) => (
                <div key={kpi.label} style={{
                  background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 14, padding: '16px 18px',
                  border: `1px solid ${kpi.border}`, boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.bg, color: kpi.color, display: 'grid', placeItems: 'center', flexShrink: 0, border: `1px solid ${kpi.border}` }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.73rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
                    <h3 style={{ margin: '2px 0 0', fontSize: '1.5rem', fontWeight: 800, color: kpi.color }}>{kpi.value.toLocaleString('es-CO')}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Barra de búsqueda y filtros */}
            <div style={{
              background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 14, padding: '14px 18px',
              border: `1px solid ${darkMode ? '#333333' : BORDER}`, boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240,
                background: darkMode ? '#262626' : '#fafafa', border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`, borderRadius: 10, padding: '8px 14px',
              }}>
                <IconSearch width={17} height={17} style={{ color: darkMode ? '#9ca3af' : GRAY }} />
                <input
                  type="text"
                  value={busquedaOrdenes}
                  onChange={(e) => { setBusquedaOrdenes(e.target.value); setPaginaOrdenes(1); }}
                  placeholder="Buscar por ID orden o estado..."
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.88rem', fontFamily: 'inherit', color: darkMode ? '#f3f4f6' : CARBON }}
                />
                {busquedaOrdenes && (
                  <button onClick={() => { setBusquedaOrdenes(''); setPaginaOrdenes(1); }} style={{ border: 0, background: 'none', cursor: 'pointer', color: darkMode ? '#9ca3af' : GRAY, padding: 0 }}>
                    <IconClose width={15} height={15} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                {[{ value: 'todos', label: 'Todas', color: darkMode ? '#fb7185' : VINOTINTO, bg: darkMode ? 'rgba(251, 113, 133, 0.15)' : '#fdf2f4', border: darkMode ? 'rgba(251, 113, 133, 0.3)' : '#f0dde4' }, ...ESTADOS_ORDEN].map((est) => {
                  const activo = filtroEstadoOrden === est.value;
                  const itemColor = darkMode && est.color === VINOTINTO ? '#fb7185' : (darkMode && est.color === '#2563EB' ? '#60a5fa' : est.color);
                  const activeBg = darkMode ? `${itemColor}25` : est.bg;
                  return (
                    <button key={est.value} onClick={() => { setFiltroEstadoOrden(est.value); setPaginaOrdenes(1); }} style={{
                      padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: '0.79rem', fontFamily: 'inherit',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      border: activo
                        ? (darkMode ? '1.5px solid rgba(255,255,255,0.45)' : `1.5px solid ${itemColor}`)
                        : `1px solid ${darkMode ? 'rgba(255,255,255,0.14)' : BORDER}`,
                      background: activo
                        ? (darkMode ? 'rgba(255,255,255,0.16)' : activeBg)
                        : (darkMode ? 'rgba(255,255,255,0.04)' : WHITE),
                      color: darkMode
                        ? (activo ? '#ffffff' : '#d4d4d8')
                        : (est.value === 'todos' ? (activo ? itemColor : GRAY) : itemColor),
                      boxShadow: activo ? '0 2px 8px rgba(0,0,0,0.12)' : 'none', transition: 'all 0.15s',
                    }}>
                      {est.value !== 'todos' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: itemColor, display: 'inline-block' }} />}
                      {est.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabla con columnas reales */}
            <div style={{ background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 16, overflow: 'hidden', boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)', border: `1px solid ${darkMode ? '#333333' : BORDER}` }}>
              {ordenesFiltradas.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: darkMode ? '#9ca3af' : GRAY }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>📦</div>
                  <p style={{ margin: 0, fontWeight: 600, color: darkMode ? '#f3f4f6' : CARBON, fontSize: '1rem' }}>No se encontraron órdenes</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: darkMode ? '#9ca3af' : GRAY }}>Prueba cambiando el filtro o el término de búsqueda.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: `linear-gradient(135deg, ${VINOTINTO} 0%, #9b2c4e 100%)` }}>
                      <th style={{ padding: '15px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.95)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '10%' }}>ID Orden</th>
                      <th style={{ padding: '15px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.95)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '24%' }}>Comprador</th>
                      <th style={{ padding: '15px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.95)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '22%' }}>Librería / Vendedor</th>
                      <th style={{ padding: '15px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.95)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '13%' }}>Estado</th>
                      <th style={{ padding: '15px 14px', textAlign: 'right', color: 'rgba(255,255,255,0.95)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '12%' }}>Total</th>
                      <th style={{ padding: '15px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.95)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '10%' }}>Fecha</th>
                      <th style={{ padding: '15px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.95)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '9%' }}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesPaginadas.map((o, i) => {
                      const estadoNorm = (o.estado || o.estado_orden || '').toLowerCase();
                      const cfgEstado = configEstadoOrden(o.estado || o.estado_orden);
                      const fechaStr = o.fecha || o.fecha_orden
                        ? new Date(o.fecha || o.fecha_orden).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—';
                      const rowBg = i % 2 === 0 ? (darkMode ? '#1e1e1e' : WHITE) : (darkMode ? '#252525' : '#fdfcfc');
                      const rowHoverBg = darkMode ? '#2d2d2d' : '#fdf8f9';
                      const nombreComp = o.comprador || o.nombre_usuario || `Usuario #${o.id_usuario}`;
                      const emailComp = o.email_comprador || o.email_usuario || '';
                      const nombreTienda = o.vendedor_tienda || o.tienda || o.vendedor || 'Librería BookyHome';
                      return (
                        <tr
                          key={`${o.id_orden}-${i}`}
                          style={{ background: rowBg, borderBottom: `1px solid ${darkMode ? '#333333' : BORDER}`, transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = rowHoverBg}
                          onMouseLeave={e => e.currentTarget.style.background = rowBg}
                        >
                          <td style={{ padding: '14px 14px', verticalAlign: 'middle', textAlign: 'left' }}>
                            <span style={{
                              fontSize: '0.84rem', fontWeight: 800,
                              color: darkMode ? '#fca5a5' : VINOTINTO,
                              background: darkMode ? 'rgba(122, 30, 58, 0.35)' : '#fdf2f4',
                              borderRadius: 8, padding: '5px 10px',
                              border: `1px solid ${darkMode ? 'rgba(122, 30, 58, 0.6)' : '#f0dde4'}`,
                              display: 'inline-block',
                            }}>
                              #{o.id_orden}
                            </span>
                          </td>
                          <td style={{ padding: '14px 14px', verticalAlign: 'middle', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <AvatarUsuario
                                usuario={{ nombre_usuario: nombreComp, foto_perfil: o.foto_comprador, rol: 'comprador' }}
                                size={34}
                                fontSize="0.82rem"
                              />
                              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: darkMode ? '#f3f4f6' : CARBON, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {nombreComp}
                                </div>
                                {emailComp && (
                                  <div style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {emailComp}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 14px', verticalAlign: 'middle', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {o.foto_vendedor ? (
                                <AvatarUsuario
                                  usuario={{ nombre_usuario: nombreTienda, foto_perfil: o.foto_vendedor, rol: 'vendedor' }}
                                  size={34}
                                  fontSize="0.82rem"
                                />
                              ) : (
                                <div style={{
                                  width: 34, height: 34, minWidth: 34, borderRadius: '50%',
                                  background: darkMode ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
                                  color: darkMode ? '#38bdf8' : '#0284c7',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.95rem', fontWeight: 800, flexShrink: 0,
                                  border: `1px solid ${darkMode ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd'}`,
                                }}>
                                  🏪
                                </div>
                              )}
                              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: darkMode ? '#38bdf8' : '#0369a1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {nombreTienda}
                                </div>
                                {o.telefono_tienda && (
                                  <div style={{ fontSize: '0.72rem', color: darkMode ? '#9ca3af' : GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    📞 {o.telefono_tienda}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{
                              background: darkMode ? `${cfgEstado.color}20` : cfgEstado.bg,
                              color: darkMode ? (cfgEstado.darkColor || '#e5e7eb') : cfgEstado.color,
                              border: `1px solid ${darkMode ? `${cfgEstado.color}55` : cfgEstado.border}`,
                              padding: '5px 12px', borderRadius: 20,
                              fontSize: '0.78rem', fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfgEstado.color, flexShrink: 0 }} />
                              {cfgEstado.label || o.estado || o.estado_orden}
                            </span>
                          </td>
                          <td style={{ padding: '14px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: darkMode ? '#f3f4f6' : CARBON }}>
                              ${Number(o.total || 0).toLocaleString('es-CO')}
                            </span>
                            {o.metodo_pago && (
                              <div style={{ fontSize: '0.72rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 500 }}>
                                {o.metodo_pago}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.82rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600 }}>
                              {fechaStr}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => abrirDetalleOrden(o)}
                              title="Ver detalles de la orden y seguimiento"
                              style={{
                                background: darkMode ? 'rgba(251, 113, 133, 0.12)' : '#fdf2f4',
                                border: `1px solid ${darkMode ? 'rgba(251, 113, 133, 0.35)' : '#f8d2da'}`,
                                color: darkMode ? '#fb7185' : VINOTINTO,
                                padding: '6px 11px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = darkMode ? 'rgba(251, 113, 133, 0.25)' : '#fae3e8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = darkMode ? 'rgba(251, 113, 133, 0.12)' : '#fdf2f4';
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              Detalles
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación */}
            {ordenesFiltradas.length > registrosPorPagina && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 14, padding: '12px 20px',
                border: `1px solid ${darkMode ? '#333333' : BORDER}`, boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
                flexWrap: 'wrap', gap: 10,
              }}>
                <span style={{ fontSize: '0.84rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600 }}>
                  Mostrando {(paginaOrdenes - 1) * registrosPorPagina + 1}–{Math.min(paginaOrdenes * registrosPorPagina, ordenesFiltradas.length)} de {ordenesFiltradas.length} órdenes
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setPaginaOrdenes(prev => Math.max(prev - 1, 1))} disabled={paginaOrdenes === 1}
                    style={{
                      padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
                      cursor: paginaOrdenes === 1 ? 'not-allowed' : 'pointer',
                      border: `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                      background: paginaOrdenes === 1 ? (darkMode ? '#2d2d2d' : '#F3F4F6') : (darkMode ? '#262626' : WHITE),
                      color: paginaOrdenes === 1 ? (darkMode ? '#52525b' : '#9CA3AF') : (darkMode ? '#f3f4f6' : CARBON),
                      fontFamily: 'inherit',
                    }}>
                    ← Anterior
                  </button>
                  <span style={{ padding: '7px 16px', borderRadius: 8, fontWeight: 800, fontSize: '0.82rem', background: VINOTINTO, color: WHITE }}>
                    {paginaOrdenes} / {totalPaginasOrdenes}
                  </span>
                  <button onClick={() => setPaginaOrdenes(prev => Math.min(prev + 1, totalPaginasOrdenes))} disabled={paginaOrdenes === totalPaginasOrdenes}
                    style={{
                      padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
                      cursor: paginaOrdenes === totalPaginasOrdenes ? 'not-allowed' : 'pointer',
                      border: `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                      background: paginaOrdenes === totalPaginasOrdenes ? (darkMode ? '#2d2d2d' : '#F3F4F6') : (darkMode ? '#262626' : WHITE),
                      color: paginaOrdenes === totalPaginasOrdenes ? (darkMode ? '#52525b' : '#9CA3AF') : (darkMode ? '#f3f4f6' : CARBON),
                      fontFamily: 'inherit',
                    }}>
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalle y Seguimiento de la Orden */}
        {modalDetalleOrden && (() => {
          const ord = modalDetalleOrden;
          const fechaStr = ord.fecha || ord.fecha_orden
            ? new Date(ord.fecha || ord.fecha_orden).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '—';
          const esRetiro = (ord.tipo_entrega || '').toLowerCase() === 'retiro_tienda';
          const cfgEstadoModal = configEstadoOrden(ord.estado || ord.estado_orden);

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Detalles de la Orden #${ord.id_orden}`}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                zIndex: 4500,
                display: 'grid',
                placeItems: 'center',
                padding: 20,
                overflowY: 'auto',
              }}
            >
              <button
                type="button"
                aria-label="Cerrar detalles de la orden"
                onClick={() => setModalDetalleOrden(null)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'default' }}
              />
              <div
                style={{
                  background: darkMode ? '#1e1e1e' : WHITE,
                  borderRadius: 20,
                  width: '100%',
                  maxWidth: 780,
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                  border: `1px solid ${darkMode ? '#333333' : BORDER}`,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #7A1E3A 0%, #5E1629 100%)',
                  padding: '20px 24px',
                  color: WHITE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: WHITE }}>
                        Orden #{ord.id_orden}
                      </h3>
                      <span style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: WHITE,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}>
                        {ord.estado || ord.estado_orden}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
                      Registrada el {fechaStr} · Método de pago: {ord.metodo_pago || 'Transferencia'}
                    </p>
                  </div>
                  <button
                    onClick={() => setModalDetalleOrden(null)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: WHITE,
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Scrollable Body */}
                <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Tarjeta de Envío / Guía de Seguimiento */}
                  <div style={{
                    background: darkMode ? '#262626' : '#f9fafb',
                    border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
                    borderRadius: 14,
                    padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.2rem' }}>📦</span>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: darkMode ? '#f3f4f6' : CARBON }}>
                          {esRetiro ? 'Retiro en Tienda / Punto Físico' : 'Información de Envío y Guía de Transporte'}
                        </span>
                      </div>
                      {ord.numero_guia && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: darkMode ? '#fb7185' : VINOTINTO,
                            background: darkMode ? 'rgba(251, 113, 133, 0.15)' : '#fdf2f4',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontFamily: 'monospace',
                          }}>
                            Guía: {ord.numero_guia}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(ord.numero_guia);
                              setCopiadoId(`guia_${ord.numero_guia}`);
                              notify('Número de guía copiado', 'info');
                              setTimeout(() => setCopiadoId(null), 2000);
                            }}
                            style={{
                              background: darkMode ? '#333' : '#fff',
                              border: `1px solid ${darkMode ? '#444' : BORDER}`,
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: darkMode ? '#e5e7eb' : CARBON,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            {copiadoId === `guia_${ord.numero_guia}` ? '✓ Copiado' : 'Copiar'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      <div>
                        <span style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                          Empresa / Operador
                        </span>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON }}>
                          🚚 {ord.empresa_mensajeria || (esRetiro ? 'Retiro directo' : 'BookyHome Envíos')}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                          Estado del Pedido
                        </span>
                        <span style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: darkMode ? cfgEstadoModal.darkColor : cfgEstadoModal.color,
                        }}>
                          ● {ord.estado || ord.estado_orden || 'En proceso'}
                        </span>
                        {ord.estado_envio && (
                          <span style={{ display: 'block', marginTop: 2, fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY }}>
                            Envío: {ord.estado_envio}
                          </span>
                        )}
                      </div>

                      {ord.fecha_despacho && (
                        <div>
                          <span style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                            Fecha de Despacho
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: darkMode ? '#e5e7eb' : CARBON }}>
                            {ord.fecha_despacho}
                          </span>
                        </div>
                      )}

                      {ord.fecha_estimada_entrega && (
                        <div>
                          <span style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                            Entrega Estimada
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: darkMode ? '#e5e7eb' : CARBON }}>
                            {ord.fecha_estimada_entrega}
                          </span>
                        </div>
                      )}

                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                          Destino / Dirección de Entrega
                        </span>
                        <span style={{ fontSize: '0.86rem', fontWeight: 600, color: darkMode ? '#f3f4f6' : CARBON }}>
                          📍 {ord.direccion_completa ? `${ord.direccion_completa}${ord.ciudad_destino ? `, ${ord.ciudad_destino}` : ''}${ord.departamento_destino ? ` (${ord.departamento_destino})` : ''}` : (esRetiro ? 'Retiro en punto de venta de la librería' : 'Dirección estándar registrada')}
                        </span>
                        {esRetiro && ord.pin_retiro && (
                          <div style={{ marginTop: 6, fontSize: '0.82rem', color: darkMode ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>
                            🔑 PIN de Retiro: {ord.pin_retiro} {ord.estado_retiro ? `(${ord.estado_retiro})` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comprador y Vendedor en dos columnas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    {/* Comprador */}
                    <div style={{
                      background: darkMode ? '#262626' : '#f9fafb',
                      border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
                      borderRadius: 14,
                      padding: '14px 16px',
                    }}>
                      <span style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                        👤 Comprador
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <AvatarUsuario
                          usuario={{ nombre_usuario: ord.comprador || ord.nombre_usuario, foto_perfil: ord.foto_comprador, rol: 'comprador' }}
                          size={44}
                          fontSize="1.1rem"
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: darkMode ? '#f3f4f6' : CARBON, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ord.comprador || ord.nombre_usuario || `Usuario #${ord.id_usuario}`}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: darkMode ? '#9ca3af' : GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ✉️ {ord.email_comprador || ord.email_usuario || 'Sin correo registrado'}
                          </div>
                          {ord.telefono_comprador && (
                            <div style={{ fontSize: '0.78rem', color: darkMode ? '#9ca3af' : GRAY }}>
                              📞 {ord.telefono_comprador}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vendedor / Tienda */}
                    <div style={{
                      background: darkMode ? '#262626' : '#f9fafb',
                      border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
                      borderRadius: 14,
                      padding: '14px 16px',
                    }}>
                      <span style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                        🏪 Librería / Vendedor
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {ord.foto_vendedor ? (
                          <AvatarUsuario
                            usuario={{ nombre_usuario: ord.vendedor_tienda || ord.tienda, foto_perfil: ord.foto_vendedor, rol: 'vendedor' }}
                            size={44}
                            fontSize="1.1rem"
                          />
                        ) : (
                          <div style={{
                            width: 44, height: 44, minWidth: 44, borderRadius: '50%',
                            background: darkMode ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
                            color: darkMode ? '#38bdf8' : '#0284c7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.25rem', fontWeight: 800, flexShrink: 0,
                            border: `1px solid ${darkMode ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd'}`,
                          }}>
                            🏪
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: darkMode ? '#38bdf8' : '#0369a1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ord.vendedor_tienda || ord.tienda || ord.vendedor || 'Librería BookyHome'}
                          </div>
                          {ord.telefono_tienda && (
                            <div style={{ fontSize: '0.78rem', color: darkMode ? '#9ca3af' : GRAY }}>
                              📞 {ord.telefono_tienda}
                            </div>
                          )}
                          <div style={{ fontSize: '0.74rem', color: darkMode ? '#9ca3af' : GRAY }}>
                            Vendedor oficial de la plataforma
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Libros / Items de la Orden */}
                  <div style={{
                    background: darkMode ? '#262626' : '#f9fafb',
                    border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
                    borderRadius: 14,
                    padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: darkMode ? '#f3f4f6' : CARBON }}>
                        📚 Libros en esta Orden ({itemsDetalleOrden.length || ord.total_items || 1})
                      </span>
                    </div>

                    {cargandoItemsOrden ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: darkMode ? '#9ca3af' : GRAY, fontSize: '0.86rem' }}>
                        <div style={{ display: 'inline-block', width: 22, height: 22, border: `2.5px solid ${darkMode ? '#444' : '#e5e7eb'}`, borderTopColor: VINOTINTO, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 8 }} />
                        <div>Cargando detalle de libros...</div>
                      </div>
                    ) : itemsDetalleOrden.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {itemsDetalleOrden.map((it, idx) => (
                          <div
                            key={it.id_detalle || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 12px',
                              background: darkMode ? '#1e1e1e' : WHITE,
                              borderRadius: 10,
                              border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                            }}
                          >
                            {it.imagen_portada ? (
                              <img
                                src={it.imagen_portada}
                                alt={it.titulo}
                                style={{ width: 38, height: 52, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: 38, height: 52, borderRadius: 4, background: darkMode ? '#333' : '#eee', display: 'grid', placeItems: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                📖
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: darkMode ? '#f3f4f6' : CARBON, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {it.titulo || `Libro #${it.id_libro}`}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: darkMode ? '#9ca3af' : GRAY }}>
                                {it.autor_libro || 'Autor no especificado'} {it.isbn ? `· ISBN: ${it.isbn}` : ''}
                              </div>
                              {it.nombre_tienda && (
                                <div style={{ fontSize: '0.72rem', color: darkMode ? '#38bdf8' : '#0369a1', fontWeight: 600 }}>
                                  Vendido por: {it.nombre_tienda}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '0.78rem', color: darkMode ? '#9ca3af' : GRAY }}>
                                {it.cantidad} {it.cantidad === 1 ? 'unidad' : 'unidades'} × ${Number(it.precio_unitario || 0).toLocaleString('es-CO')}
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: darkMode ? '#f3f4f6' : CARBON }}>
                                ${Number(it.precio_final || (it.cantidad * it.precio_unitario) || 0).toLocaleString('es-CO')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: darkMode ? '#9ca3af' : GRAY, fontSize: '0.84rem' }}>
                        Orden estándar de 1 o más ejemplares.
                      </div>
                    )}
                  </div>

                  {/* Resumen Financiero */}
                  <div style={{
                    background: darkMode ? '#262626' : '#f9fafb',
                    border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
                    borderRadius: 14,
                    padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', color: darkMode ? '#9ca3af' : GRAY }}>Costo de envío:</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: darkMode ? '#e5e7eb' : CARBON }}>
                        ${Number(ord.costo_envio || 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', color: darkMode ? '#9ca3af' : GRAY }}>Método de pago:</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: darkMode ? '#e5e7eb' : CARBON }}>
                        💳 {ord.metodo_pago || 'Transferencia'}
                      </span>
                    </div>
                    <div style={{ height: 1, background: darkMode ? '#3a3a3a' : BORDER, margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: darkMode ? '#f3f4f6' : CARBON }}>Total de la Orden:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: darkMode ? '#fb7185' : VINOTINTO }}>
                        ${Number(ord.total || 0).toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div style={{
                  padding: '14px 24px',
                  background: darkMode ? '#262626' : '#fafafa',
                  borderTop: `1px solid ${darkMode ? '#333333' : BORDER}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  flexShrink: 0,
                }}>
                  <button
                    type="button"
                    onClick={() => setModalDetalleOrden(null)}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 10,
                      border: `1.5px solid ${darkMode ? '#444' : BORDER}`,
                      background: darkMode ? '#1e1e1e' : WHITE,
                      color: darkMode ? '#e5e7eb' : CARBON,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {evidenciaPreview && (
          <div role="dialog" aria-modal="true" aria-label="Evidencia del reclamo" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 3000, display: 'grid', placeItems: 'center', padding: 24 }}>
            <button type="button" aria-label="Cerrar evidencia del reclamo" onClick={() => setEvidenciaPreview(null)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'default' }} />
            <img src={evidenciaPreview} alt="Evidencia del reclamo" style={{ position: 'relative', zIndex: 1, maxWidth: '90vw', maxHeight: '85vh', borderRadius: 10, background: darkMode ? '#1e1e1e' : WHITE }} />
          </div>
        )}

        {/* Modal para respuesta */}
        {modalOpen && modalReclamo && (
          <div role="dialog" aria-modal="true" aria-labelledby="complaint-response-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'grid', placeItems: 'center', padding: 24 }}>
            <button type="button" aria-label="Cerrar respuesta del reclamo" onClick={() => { setModalOpen(false); setModalReclamo(null); }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'default' }} />
            <div style={{ position: 'relative', zIndex: 1, background: darkMode ? '#1e1e1e' : WHITE, borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 id="complaint-response-title" style={{ margin: 0, color: modalReclamo?.estado === 'Rechazado' ? '#dc2626' : modalReclamo?.estado === 'En revisión' ? '#ea580c' : VINOTINTO, fontSize: '1.35rem', fontWeight: 800 }}>
                  {modalReclamo?.estado === 'En revisión'
                    ? 'Marcar como En revisión'
                    : modalReclamo?.estado === 'Rechazado'
                      ? 'Rechazar solicitud'
                      : 'Resolver y notificar al usuario'}
                </h2>
                <button onClick={() => { setModalOpen(false); setModalReclamo(null); }} style={{ border: 0, background: darkMode ? '#2d2d2d' : '#f5f5f5', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: darkMode ? '#c8c8c8' : GRAY, display: 'grid', placeItems: 'center' }}>
                  <IconClose width={16} height={16} />
                </button>
              </div>

              <div style={{ background: darkMode ? '#252525' : '#fafafa', border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ margin: 0, color: darkMode ? '#f3f4f6' : CARBON, fontSize: '0.88rem', fontWeight: 600 }}>
                  {modalReclamo?.tipo_solicitud === 'soporte' ? 'Ticket de Soporte' : 'Reclamo'} #{modalReclamo?.numero || modalReclamo?.id_solicitud}
                  {modalReclamo?.id_orden ? ` · Orden #${modalReclamo.id_orden}` : ''}
                </p>
                <p style={{ margin: '2px 0 0', color: darkMode ? '#c8c8c8' : GRAY, fontSize: '0.82rem' }}>
                  Usuario: <strong style={{ color: darkMode ? '#f3f4f6' : CARBON }}>{modalReclamo?.comprador}</strong>
                </p>
              </div>

              <label htmlFor="complaint-response" style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: darkMode ? '#f3f4f6' : CARBON, fontSize: '0.9rem' }}>
                Respuesta o resolución para el usuario:
              </label>
              <textarea
                id="complaint-response"
                value={modalRespuesta}
                onChange={(e) => setModalRespuesta(e.target.value)}
                placeholder="Escribe aquí la respuesta o solución que recibirá el usuario por correo y en su panel..."
                rows={5}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 10,
                  border: `1.5px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                  fontSize: '0.95rem',
                  fontFamily: "'Montserrat', sans-serif",
                  resize: 'vertical',
                  marginBottom: 20,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  background: darkMode ? '#252525' : WHITE,
                  color: darkMode ? '#f3f4f6' : CARBON,
                }}
                onFocus={e => e.target.style.borderColor = VINOTINTO}
                onBlur={e => e.target.style.borderColor = darkMode ? '#3a3a3a' : BORDER}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setModalOpen(false); setModalReclamo(null); }}
                  style={{
                    padding: '11px 22px',
                    borderRadius: 10,
                    border: `1px solid ${darkMode ? '#3a3a3a' : BORDER}`,
                    background: darkMode ? '#1e1e1e' : WHITE,
                    color: darkMode ? '#c8c8c8' : GRAY,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    transition: 'all 0.2s',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={resolverReclamo}
                  style={{
                    padding: '11px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: modalReclamo?.estado === 'Rechazado' ? '#dc2626' : modalReclamo?.estado === 'En revisión' ? '#ea580c' : VINOTINTO,
                    color: WHITE,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s',
                  }}
                >
                  {modalReclamo?.estado === 'En revisión'
                    ? 'Confirmar En revisión'
                    : modalReclamo?.estado === 'Rechazado'
                      ? 'Confirmar Rechazo'
                      : 'Resolver y notificar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FINANZAS - BOOKYPAGO */}
        {activeSection === 'finanzas' && (
          <BookyPagoFinanzas darkMode={darkMode} />
        )}

        {activeSection === 'perfil' && (
          <SeccionPerfilAdmin
            stats={stats}
            gestionProp={{
              reclamos: reclamosClientes.length,
              soporte: soporte.filter(s => s.tipo_solicitud !== 'reclamo').length,
              resueltos: reclamos.filter(s => s.estado === 'Resuelto').length,
              pendientes: reclamos.filter(s => ['Abierto', 'En revisión', 'En revision'].includes(s.estado)).length,
            }}
          />
        )}

        {/* MODAL CONFIRMAR CAMBIO DE ESTADO DE TIENDA */}
        {modalConfirmEstado && (() => {
          const cfg = ESTADOS_TIENDA.find(e => e.value === modalConfirmEstado.nuevoEstado) || ESTADOS_TIENDA[4];
          const esSuspension = modalConfirmEstado.nuevoEstado === 'suspendida';
          const mensajes = {
            activa: { icon: '✅', desc: 'La librería quedará activa y visible para los compradores.' },
            pendiente: { icon: '🕐', desc: 'La librería quedará en revisión y no podrá operar hasta ser aprobada.' },
            vacaciones: { icon: '🏖️', desc: 'La librería entrará en modo vacaciones y sus productos no estarán disponibles temporalmente.' },
            suspendida: { icon: '🚫', desc: 'La librería será suspendida por incumplimiento. No podrá vender ni recibir pedidos en la plataforma.' },
            inactiva: { icon: '⭕', desc: 'La librería quedará marcada como inactiva.' },
          };
          const info = mensajes[modalConfirmEstado.nuevoEstado] || { icon: '🔄', desc: `Cambiar estado a ${cfg.label}.` };

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Confirmar cambio de estado de tienda"
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 5000, display: 'grid', placeItems: 'center', padding: 20 }}
            >
              <button
                type="button"
                aria-label="Cerrar confirmación de estado"
                disabled={guardandoEstadoTienda}
                onClick={() => setModalConfirmEstado(null)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'default' }}
              />
              <div
                style={{
                  background: darkMode ? '#1e1e1e' : WHITE,
                  borderRadius: 20,
                  width: '100%',
                  maxWidth: esSuspension ? 540 : 430,
                  maxHeight: '92vh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: darkMode ? '0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(0,0,0,0.28)',
                  animation: 'fadeIn 0.2s ease',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Header con color del estado */}
                <div style={{
                  background: esSuspension
                    ? 'linear-gradient(135deg, #B91C1C 0%, #7A1E3A 100%)'
                    : `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.color}cc 100%)`,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  flexShrink: 0
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)'
                  }}>
                    {info.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {esSuspension ? 'Acción Disciplinaria' : 'Cambiar estado'}
                    </p>
                    <h3 style={{ margin: 0, color: WHITE, fontSize: '1.2rem', fontWeight: 800 }}>
                      {esSuspension ? 'Suspender Librería' : `Marcar como ${cfg.label}`}
                    </h3>
                  </div>
                </div>

                {/* Cuerpo con scroll si es necesario */}
                <div style={{ padding: '22px 24px', overflowY: 'auto' }}>
                  {/* Tienda afectada */}
                  <div style={{
                    background: darkMode ? `${cfg.color}22` : cfg.bg,
                    border: `1.5px solid ${darkMode ? `${cfg.color}44` : cfg.border}`,
                    borderRadius: 14,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <IconStore width={20} height={20} style={{ color: cfg.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: cfg.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Librería a modificar</p>
                        <p style={{ margin: 0, fontSize: '1rem', color: cfg.color, fontWeight: 800 }}>{modalConfirmEstado.nombreTienda || `ID #${modalConfirmEstado.idTienda}`}</p>
                      </div>
                    </div>
                    <span style={{
                      background: cfg.color,
                      color: WHITE,
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      ID #{modalConfirmEstado.idTienda}
                    </span>
                  </div>

                  {/* Descripción general */}
                  <p style={{ margin: '0 0 16px', color: darkMode ? '#d1d5db' : '#4B5563', fontSize: '0.88rem', lineHeight: 1.55 }}>
                    {info.desc}
                  </p>

                  {/* SECCIÓN ESPECIAL PARA SUSPENSIÓN CON MOTIVO */}
                  {esSuspension && (
                    <div style={{ marginBottom: 16 }}>
                      {/* Alerta explicativa */}
                      <div style={{
                        background: darkMode ? '#78350f33' : '#FFFBEB',
                        border: `1px solid ${darkMode ? '#b4530944' : '#FDE68A'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        marginBottom: 14,
                        fontSize: '0.82rem',
                        color: darkMode ? '#fde68a' : '#92400E',
                        display: 'flex',
                        gap: 8,
                        lineHeight: 1.45
                      }}>
                        <span style={{ fontSize: '1rem', flexShrink: 0 }}>💬</span>
                        <div>
                          <strong>Notificación formal al vendedor:</strong> El motivo ingresado se enviará inmediatamente como mensaje en la sección de <strong>Chat</strong> del vendedor para que conozca la razón y pueda comunicarse con administración.
                        </div>
                      </div>

                      {/* Motivos frecuentes / Chips */}
                      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color: darkMode ? '#d1d5db' : '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Motivos frecuentes (haz clic para seleccionar):
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {MOTIVOS_SUSPENSION_PREDEFINIDOS.map((motivo, idx) => {
                          const seleccionado = motivoSuspension === motivo;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setMotivoSuspension(motivo);
                                setErrorMotivoSuspension('');
                              }}
                              style={{
                                background: seleccionado ? '#B91C1C' : (darkMode ? '#2a2a2a' : '#F3F4F6'),
                                color: seleccionado ? WHITE : (darkMode ? '#d1d5db' : '#374151'),
                                border: seleccionado ? '1px solid #B91C1C' : `1px solid ${darkMode ? '#444' : '#E5E7EB'}`,
                                borderRadius: 8,
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                fontWeight: seleccionado ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'left',
                                fontFamily: 'inherit'
                              }}
                            >
                              {seleccionado ? '✓ ' : '+ '}{motivo}
                            </button>
                          );
                        })}
                      </div>

                      {/* Campo de texto para el motivo */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label htmlFor="store-suspension-reason" style={{ fontSize: '0.8rem', fontWeight: 700, color: darkMode ? '#f3f4f6' : '#1F2937' }}>
                          Explicación detallada del motivo *
                        </label>
                        <span style={{ fontSize: '0.72rem', color: motivoSuspension.length > 400 ? '#DC2626' : '#9CA3AF', fontWeight: 600 }}>
                          {motivoSuspension.length} / 450
                        </span>
                      </div>

                      <textarea
                        id="store-suspension-reason"
                        value={motivoSuspension}
                        onChange={(e) => {
                          setMotivoSuspension(e.target.value);
                          if (e.target.value.trim()) setErrorMotivoSuspension('');
                        }}
                        placeholder="Escribe detalladamente las razones por las cuales se suspende la librería..."
                        rows={4}
                        maxLength={450}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: errorMotivoSuspension ? '1.5px solid #EF4444' : `1.5px solid ${darkMode ? '#444' : '#D1D5DB'}`,
                          fontSize: '0.86rem',
                          fontFamily: 'inherit',
                          lineHeight: 1.45,
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: darkMode ? '#2a2a2a' : '#FAFAFA',
                          color: darkMode ? '#f3f4f6' : CARBON,
                          resize: 'vertical',
                          minHeight: 85
                        }}
                      />

                      {errorMotivoSuspension && (
                        <p style={{ margin: '6px 0 0', color: '#DC2626', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>⚠️</span> {errorMotivoSuspension}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button
                      type="button"
                      disabled={guardandoEstadoTienda}
                      onClick={() => setModalConfirmEstado(null)}
                      style={{
                        flex: 1,
                        padding: '11px 0',
                        borderRadius: 10,
                        border: `1.5px solid ${darkMode ? '#444' : BORDER}`,
                        background: darkMode ? '#2a2a2a' : WHITE,
                        color: darkMode ? '#d1d5db' : '#4B5563',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: guardandoEstadoTienda ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={guardandoEstadoTienda}
                      onClick={confirmarCambioEstado}
                      style={{
                        flex: esSuspension ? 1.5 : 1,
                        padding: '11px 0',
                        borderRadius: 10,
                        border: 'none',
                        background: esSuspension ? '#B91C1C' : cfg.color,
                        color: WHITE,
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: guardandoEstadoTienda ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: `0 4px 14px ${esSuspension ? '#B91C1C55' : cfg.color + '55'}`,
                        opacity: guardandoEstadoTienda ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      {guardandoEstadoTienda
                        ? 'Procesando...'
                        : esSuspension
                          ? '🚫 Suspender y Notificar'
                          : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL DE CONFIRMACIÓN DE BLOQUEO / DESBLOQUEO DE USUARIO */}
        {modalConfirmBloqueo && (() => {
          const { usuario, bloqueado } = modalConfirmBloqueo;

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={bloqueado ? 'Confirmar bloqueo de usuario' : 'Confirmar reactivación de usuario'}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                zIndex: 4600,
                display: 'grid',
                placeItems: 'center',
                padding: 20
              }}
            >
              <button
                type="button"
                aria-label="Cerrar confirmación de usuario"
                disabled={bloqueandoUsuario}
                onClick={() => setModalConfirmBloqueo(null)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'default' }}
              />
              <div
                style={{
                  background: WHITE,
                  borderRadius: 20,
                  width: '100%',
                  maxWidth: 480,
                  overflow: 'hidden',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                  border: `1px solid ${bloqueado ? '#FECACA' : '#A7F3D0'}`,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Header Modal */}
                <div style={{
                  background: bloqueado ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' : 'linear-gradient(135deg, #047857 0%, #065F46 100%)',
                  padding: '18px 24px',
                  color: WHITE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {bloqueado ? '🔒' : '🔓'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: WHITE }}>
                        {bloqueado ? 'Bloquear Acceso a Usuario' : 'Restaurar Acceso a Usuario'}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)' }}>
                        Confirmación de seguridad administrativa
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (!bloqueandoUsuario) setModalConfirmBloqueo(null); }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: WHITE,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>
                  {/* Tarjeta de usuario afectado */}
                  <div style={{
                    background: '#FAFAF9',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14,
                    padding: '14px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <AvatarUsuario usuario={usuario} size={46} fontSize="1.15rem" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '0.96rem', color: CARBON }}>{usuario.nombre_usuario}</strong>
                        <span style={{ fontSize: '0.72rem', background: '#E5E7EB', color: '#4B5563', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>
                          ID #{usuario.id_usuario}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {usuario.correo_usuario} · <span style={{ textTransform: 'capitalize' }}>{usuario.rol}</span>
                      </p>
                    </div>
                  </div>

                  {/* Advertencia / Explicación */}
                  <div style={{
                    background: bloqueado ? '#FEF2F2' : '#F0FDF4',
                    border: `1.5px solid ${bloqueado ? '#FECACA' : '#BBF7D0'}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 20
                  }}>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: bloqueado ? '#991B1B' : '#166534', lineHeight: 1.45, fontWeight: 500 }}>
                      {bloqueado
                        ? '⚠️ Al bloquear a este usuario, se cerrará su sesión de inmediato y se le impedirá ingresar a la plataforma, comprar o administrar su tienda hasta que sea reactivado.'
                        : '✅ Al restaurar el acceso, el usuario podrá volver a iniciar sesión y utilizar todas las funciones de BookyHome según su rol.'}
                    </p>
                  </div>

                  {/* Botones */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      disabled={bloqueandoUsuario}
                      onClick={() => setModalConfirmBloqueo(null)}
                      style={{
                        flex: 1,
                        padding: '11px 0',
                        borderRadius: 10,
                        border: `1.5px solid ${BORDER}`,
                        background: WHITE,
                        color: '#4B5563',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: bloqueandoUsuario ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={bloqueandoUsuario}
                      onClick={ejecutarBloqueoUsuario}
                      style={{
                        flex: 1.2,
                        padding: '11px 0',
                        borderRadius: 10,
                        border: 'none',
                        background: bloqueado ? '#DC2626' : '#047857',
                        color: WHITE,
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: bloqueandoUsuario ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: `0 4px 14px ${bloqueado ? '#DC262655' : '#04785755'}`,
                        opacity: bloqueandoUsuario ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      {bloqueandoUsuario ? (
                        'Procesando...'
                      ) : bloqueado ? (
                        <>
                          <IconLock width={15} height={15} style={{ color: WHITE }} />
                          <span>Confirmar Bloqueo</span>
                        </>
                      ) : (
                        <>
                          <IconUnlock width={15} height={15} style={{ color: WHITE }} />
                          <span>Confirmar Reactivación</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL DE FICHA / DETALLE DE USUARIO */}
        {modalDetalleUsuario && (() => {
          const u = modalDetalleUsuario;
          const esBloqueado = (u.estado_usuario || '').toLowerCase() === 'bloqueado';
          const rolKey = (u.rol || 'comprador').toLowerCase().trim();
          const tiendaVinculada = tiendas.find(t => Number(t.id_usuario) === Number(u.id_usuario));

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Detalles del usuario ${u.nombre_usuario || ''}`}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                zIndex: 4550,
                display: 'grid',
                placeItems: 'center',
                padding: 20
              }}
            >
              <button
                type="button"
                aria-label="Cerrar detalles de usuario"
                onClick={() => setModalDetalleUsuario(null)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'default' }}
              />
              <div
                style={{
                  background: WHITE,
                  borderRadius: 20,
                  width: '100%',
                  maxWidth: 520,
                  overflow: 'hidden',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                  border: `1px solid ${BORDER}`,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #7A1E3A 0%, #5E1629 100%)',
                  padding: '20px 24px',
                  color: WHITE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <AvatarUsuario
                      usuario={u}
                      size={52}
                      fontSize="1.35rem"
                      border="2.5px solid rgba(255,255,255,0.7)"
                      shadow="0 4px 14px rgba(0,0,0,0.25)"
                    />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: WHITE }}>
                        {u.nombre_usuario}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
                        Ficha de Usuario · ID #{u.id_usuario}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalDetalleUsuario(null)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: WHITE,
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Grid de Estado y Rol */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#FAFAF9', padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>Rol de Cuenta</span>
                      <div style={{ marginTop: 4, fontWeight: 800, fontSize: '0.95rem', color: CARBON, textTransform: 'capitalize' }}>
                        {rolKey === 'vendedor' ? '🏪 Vendedor' : rolKey.includes('admin') ? '🛡️ Administrador' : '🛒 Comprador'}
                      </div>
                    </div>

                    <div style={{ background: '#FAFAF9', padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>Estado Actual</span>
                      <div style={{ marginTop: 4, fontWeight: 800, fontSize: '0.95rem', color: esBloqueado ? '#DC2626' : '#047857' }}>
                        {esBloqueado ? '🔒 Bloqueado' : '🟢 Activo'}
                      </div>
                    </div>
                  </div>

                  {/* Datos de Contacto */}
                  <div style={{ background: '#FAFAF9', borderRadius: 14, padding: '16px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: '0.74rem', color: '#6B7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Información de Contacto y Cuenta
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: '#6B7280' }}>Correo Electrónico:</span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: CARBON }}>{u.correo_usuario}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: '#6B7280' }}>Teléfono:</span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: CARBON }}>{u.telefono || 'No registrado'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: '#6B7280' }}>Fecha de Registro:</span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: CARBON }}>{u.fecha_registro || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: '#6B7280' }}>Verificación Email:</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: u.email_verificado ? '#047857' : '#D97706' }}>
                        {u.email_verificado ? '✓ Verificado' : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Tienda Vinculada (si es vendedor) */}
                  {tiendaVinculada && (
                    <div style={{ background: '#ECFDF5', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #A7F3D0' }}>
                      <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase' }}>
                        🏪 Librería Vinculada
                      </span>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: '0.94rem', color: '#065F46' }}>{tiendaVinculada.nombre_tienda}</strong>
                          <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#047857' }}>ID Tienda: #{tiendaVinculada.id_tienda}</p>
                        </div>
                        <span style={{
                          background: tiendaVinculada.estado_tienda === 'activa' ? '#047857' : '#DC2626',
                          color: WHITE,
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          textTransform: 'capitalize'
                        }}>
                          {tiendaVinculada.estado_tienda || 'Activa'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Acciones del Footer */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      onClick={() => setModalDetalleUsuario(null)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: `1.5px solid ${BORDER}`,
                        background: WHITE,
                        color: '#4B5563',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={() => {
                        const targetUser = u;
                        setModalDetalleUsuario(null);
                        abrirModalBloqueo(targetUser);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: 'none',
                        background: esBloqueado ? '#047857' : '#DC2626',
                        color: WHITE,
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: `0 4px 12px ${esBloqueado ? '#04785740' : '#DC262640'}`
                      }}
                    >
                      {esBloqueado ? '🔓 Desbloquear' : '🔒 Bloquear'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL DE CHAT Y CONTACTO CON LA TIENDA */}
        {chatModalReclamo && (
          <div role="dialog" aria-modal="true" aria-label="Chat y contacto con la tienda" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 4500, display: 'grid', placeItems: 'center', padding: 20 }}>
            <button type="button" aria-label="Cerrar chat con la tienda" onClick={() => { setChatModalReclamo(null); setChatEnvio(null); }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'default' }} />
            <div style={{ position: 'relative', zIndex: 1, background: WHITE, borderRadius: 20, width: '100%', maxWidth: 650, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
              {/* MODAL HEADER */}
              <div style={{ background: 'linear-gradient(135deg, #7A1E3A 0%, #9b2c4e 100%)', padding: '18px 24px', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
                    <IconStoreAlt width={24} height={24} style={{ color: WHITE }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: WHITE }}>
                      {chatModalReclamo.nombre_tienda || 'Tienda / Librería'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
                      Reclamo #{chatModalReclamo.id_solicitud} · Orden #{chatModalReclamo.id_orden}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setChatModalReclamo(null); setChatEnvio(null); }}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: WHITE, width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '1rem', fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>

              {/* INFO DE CONTACTO DIRECTO */}
              <div style={{ padding: '14px 24px', background: '#fdf8f9', borderBottom: `1px solid ${BORDER}`, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.84rem' }}>
                  {chatModalReclamo.nombre_vendedor && (
                    <span style={{ color: CARBON }}>
                      Vendedor: <strong style={{ color: VINOTINTO }}>{chatModalReclamo.nombre_vendedor}</strong>
                    </span>
                  )}
                  {chatModalReclamo.correo_vendedor && (
                    <a
                      href={`mailto:${chatModalReclamo.correo_vendedor}?subject=Consulta Reclamo #${chatModalReclamo.id_solicitud} - BookyHome`}
                      style={{ color: '#0369a1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600 }}
                    >
                      <IconMail width={15} height={15} />
                      {chatModalReclamo.correo_vendedor}
                    </a>
                  )}
                  {chatModalReclamo.telefono_tienda && (
                    <a
                      href={`https://wa.me/${chatModalReclamo.telefono_tienda.replace(/\D/g, '')}?text=Hola,%20te%20escribo%20desde%20la%20administracion%20de%20BookyHome%20respecto%20al%20reclamo%20%23${chatModalReclamo.id_solicitud}%20de%20la%20orden%20%23${chatModalReclamo.id_orden}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}
                    >
                      <IconPhone width={15} height={15} />
                      {chatModalReclamo.telefono_tienda} (WhatsApp)
                    </a>
                  )}
                </div>
              </div>

              {/* DETALLE DEL CASO */}
              <div style={{ padding: '12px 24px', background: '#fafafa', borderBottom: `1px solid ${BORDER}`, fontSize: '0.85rem' }}>
                <strong style={{ color: GRAY, textTransform: 'uppercase', fontSize: '0.74rem', letterSpacing: '0.05em' }}>Motivo reclamado por {chatModalReclamo.comprador}:</strong>
                <p style={{ margin: '4px 0 0', color: CARBON, fontWeight: 600 }}>
                  "{chatModalReclamo.asunto}" — <span style={{ fontWeight: 400, color: '#555' }}>{chatModalReclamo.descripcion}</span>
                </p>
              </div>

              {/* EVIDENCIA DE ENVÍO — solo si hay guía registrada para esta orden */}
              {chatEnvio && (
                <div style={{ padding: '12px 24px', background: '#f0f9ff', borderBottom: `1px solid #bae6fd`, fontSize: '0.85rem' }}>
                  <strong style={{ color: '#0369a1', textTransform: 'uppercase', fontSize: '0.74rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🚚 Evidencia de envío registrada
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', marginTop: 8 }}>
                    <span style={{ color: CARBON }}>
                      Transportadora: <strong>{chatEnvio.empresa_mensajeria}</strong>
                    </span>
                    <span style={{ color: CARBON }}>
                      Guía: <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{chatEnvio.numero_guia}</strong>
                    </span>
                    {chatEnvio.fecha_despacho && (
                      <span style={{ color: CARBON }}>
                        Despachado: <strong>{new Date(chatEnvio.fecha_despacho).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      </span>
                    )}
                    <span style={{ color: chatEnvio.estado_envio?.includes('automático') ? '#7A1E3A' : '#16a34a', fontWeight: 700 }}>
                      Estado: {chatEnvio.estado_envio || 'Guía registrada'}
                    </span>
                  </div>
                  {(chatEnvio.url_rastreo || chatEnvio.sitio_web) && (
                    <a
                      href={chatEnvio.url_rastreo || chatEnvio.sitio_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, color: '#0369a1', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}
                    >
                      🔗 Rastrear en {chatEnvio.empresa_mensajeria}
                    </a>
                  )}
                </div>
              )}

              {/* TIMELINE DE MENSAJES */}
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 220, maxHeight: 320, background: '#fcfcfc' }}>
                {cargandoChat ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: GRAY }}>Cargando conversación...</div>
                ) : chatMensajes.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: GRAY }}>
                    <div style={{ fontSize: '2rem', marginBottom: 6 }}>💬</div>
                    <p style={{ margin: 0, fontWeight: 600, color: CARBON, fontSize: '0.92rem' }}>Aún no hay mensajes en este reclamo.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Escribe un mensaje abajo para comunicarte con la tienda y el comprador.</p>
                  </div>
                ) : (
                  chatMensajes.map((m) => {
                    const esAdmin = (m.rol || '').toLowerCase() === 'admin' || (m.rol || '').toLowerCase() === 'administrador';
                    const esVendedor = (m.rol || '').toLowerCase() === 'vendedor';

                    return (
                      <div
                        key={m.id_mensaje}
                        style={{
                          alignSelf: esAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          background: esAdmin ? '#fdf2f4' : esVendedor ? '#fff7ed' : '#ffffff',
                          border: `1.5px solid ${esAdmin ? '#f0dde4' : esVendedor ? '#fed7aa' : '#e5e7eb'}`,
                          borderRadius: 14,
                          padding: '10px 14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <strong style={{ fontSize: '0.84rem', color: esAdmin ? VINOTINTO : esVendedor ? '#ea580c' : '#2563eb' }}>
                            {m.nombre_usuario}
                          </strong>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: 10,
                            background: esAdmin ? VINOTINTO : esVendedor ? '#ea580c' : '#2563eb',
                            color: WHITE,
                            fontWeight: 700,
                          }}>
                            {esAdmin ? 'Administrador' : esVendedor ? 'Librería' : 'Comprador'}
                          </span>
                          {m.fecha_creacion && (
                            <span style={{ fontSize: '0.72rem', color: '#aaa', marginLeft: 'auto' }}>
                              {new Date(m.fecha_creacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: CARBON, fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {m.mensaje}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* INPUT FORM PARA ENVIAR MENSAJE */}
              <form onSubmit={enviarMensajeChat} style={{ padding: '16px 24px', background: WHITE, borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={chatNuevoMensaje}
                  onChange={(e) => setChatNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje o indicación para la tienda y el cliente..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${BORDER}`,
                    outline: 'none',
                    fontSize: '0.92rem',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = VINOTINTO}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
                <button
                  type="submit"
                  disabled={enviandoMensaje || !chatNuevoMensaje.trim()}
                  style={{
                    background: VINOTINTO,
                    color: WHITE,
                    border: 'none',
                    borderRadius: 10,
                    padding: '0 20px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: enviandoMensaje || !chatNuevoMensaje.trim() ? 'not-allowed' : 'pointer',
                    opacity: enviandoMensaje || !chatNuevoMensaje.trim() ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <IconMessage width={16} height={16} />
                  {enviandoMensaje ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
