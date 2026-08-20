// src/components/Icons.jsx
// Iconos sincronizados con el sitio web (frontend/src/components/Icons.jsx)
import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';

export const IconMenu = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color}/>
    <Line x1="3" y1="6" x2="21" y2="6" stroke={color}/>
    <Line x1="3" y1="18" x2="21" y2="18" stroke={color}/>
  </Svg>
);

// ── Búsqueda ──────────────────────────────────────────────────────────────────
export const IconSearch = ({ size = 20, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" stroke={color}/>
    <Path d="m21 21-4.3-4.3" stroke={color}/>
  </Svg>
);

export const IconFilter = ({ size = 20, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Svg>
);

// ── Usuario ───────────────────────────────────────────────────────────────────
export const IconUser = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke={color}/>
    <Circle cx="12" cy="7" r="4" stroke={color}/>
  </Svg>
);

// ── Agregar usuario ───────────────────────────────────────────────────────────
export const IconUserPlus = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color}/>
    <Circle cx="8.5" cy="7" r="4" stroke={color}/>
    <Line x1="20" y1="8" x2="20" y2="14" stroke={color}/>
    <Line x1="17" y1="11" x2="23" y2="11" stroke={color}/>
  </Svg>
);

// ── Ubicación (top bar) ───────────────────────────────────────────────────────
export const IconLocation = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke={color}/>
    <Circle cx="12" cy="10" r="3" stroke={color}/>
  </Svg>
);

// ── Alerta / Info ───────────────────────────────────────────────────────────────
export const IconAlertTriangle = ({ size = 24, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

// ── Carrito ───────────────────────────────────────────────────────────────────
export const IconCart = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="9" cy="20" r="1" stroke={color}/>
    <Circle cx="17" cy="20" r="1" stroke={color}/>
    <Path d="M3 3h2l2.68 13.39A2 2 0 0 0 9.66 18H18a2 2 0 0 0 2-1.6L22 6H6" stroke={color}/>
  </Svg>
);

// ── Cerrar sesión ─────────────────────────────────────────────────────────────
export const IconLogout = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color}/>
    <Polyline points="16 17 21 12 16 7" stroke={color}/>
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color}/>
  </Svg>
);

// ── Chevron derecho ───────────────────────────────────────────────────────────
export const IconChevronRight = ({ size = 18, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke={color}/>
  </Svg>
);

// ── Cerrar (X) ────────────────────────────────────────────────────────────────
export const IconClose = ({ size = 20, color = '#2A2A2A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 18L18 6M6 6l12 12" stroke={color}/>
  </Svg>
);

// ── Cámara (para escáner de códigos de barras) ─────────────────────────────────
export const IconCamera = ({ size = 24, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color}/>
    <Circle cx="12" cy="13" r="4" stroke={color}/>
  </Svg>
);

// ── Escudo / Compra protegida ─────────────────────────────────────────────────
export const IconShield = ({ size = 24, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color}/>
  </Svg>
);

// ── Camión / Envíos ───────────────────────────────────────────────────────────
export const IconTruck = ({ size = 24, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="1" y="3" width="15" height="13" stroke={color}/>
    <Polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke={color}/>
    <Circle cx="5.5" cy="18.5" r="2.5" stroke={color}/>
    <Circle cx="18.5" cy="18.5" r="2.5" stroke={color}/>
  </Svg>
);

// ── Libro (abierto, para modal "Crear cuenta") ────────────────────────────────
export const IconBook = ({ size = 24, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" stroke={color}/>
  </Svg>
);

// ── Email ─────────────────────────────────────────────────────────────────────
export const IconMail = ({ size = 18, color = '#C5425A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" stroke={color}/>
  </Svg>
);

// ── Candado ───────────────────────────────────────────────────────────────────
export const IconLock = ({ size = 18, color = '#C5425A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16.5 10.5V7.125A4.125 4.125 0 008.25 7.125V10.5M6 10.5h12a1.5 1.5 0 011.5 1.5v7.5A1.5 1.5 0 0118 21H6a1.5 1.5 0 01-1.5-1.5V12A1.5 1.5 0 016 10.5z" stroke={color}/>
  </Svg>
);

// ── Ojo (mostrar contraseña) ──────────────────────────────────────────────────
export const IconEye = ({ size = 18, color = '#aaa' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color}/>
    <Circle cx="12" cy="12" r="3" stroke={color}/>
  </Svg>
);

// ── Ojo cerrado (ocultar contraseña) ──────────────────────────────────────────
export const IconEyeOff = ({ size = 18, color = '#aaa' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke={color}/>
  </Svg>
);

// ── Google ────────────────────────────────────────────────────────────────────
export const IconGoogle = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 01-2.4 3.62v3h3.87c2.27-2.09 3.59-5.17 3.59-8.81z"/>
    <Path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.12-6.73-4.96H1.27v3.1A12 12 0 0012 24z"/>
    <Path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 010-4.54v-3.1H1.27a12 12 0 000 10.74l4-3.1z"/>
    <Path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.1C6.22 6.89 8.87 4.77 12 4.77z"/>
  </Svg>
);

// ── Teléfono ──────────────────────────────────────────────────────────────────
export const IconPhone = ({ size = 18, color = '#C5425A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.554-5.154-3.883-6.707-6.707l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" stroke={color}/>
  </Svg>
);

// ── Tienda ────────────────────────────────────────────────────────────────────
export const IconStore = ({ size = 18, color = '#C5425A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25h-1.5A2.25 2.25 0 007.5 13.5V21m6 0H7.5m6 0h3.75A2.25 2.25 0 0019.5 18.75V9.375a2.25 2.25 0 00-.659-1.591l-4.5-4.5A2.25 2.25 0 0012.75 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21H7.5" stroke={color}/>
  </Svg>
);

// ── Estrella ──────────────────────────────────────────────────────────────────
export const IconStar = ({ size = 22, color = '#7A1E3A', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={filled ? color : 'none'} stroke={color}/>
  </Svg>
);

// ── Campana / Notificaciones ──────────────────────────────────────────────────
export const IconBell = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color}/>
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color}/>
  </Svg>
);

// ── Mensaje / Chat ────────────────────────────────────────────────────────────
export const IconMessage = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color}/>
  </Svg>
);

// ── Calendario ───────────────────────────────────────────────────────────────
export const IconCalendar = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color}/>
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color}/>
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color}/>
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color}/>
  </Svg>
);

// ── Mapa / Pin ────────────────────────────────────────────────────────────────
export const IconMapPin = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" stroke={color}/>
    <Circle cx="12" cy="10" r="3" stroke={color}/>
  </Svg>
);

// ── Favoritos / Corazón ───────────────────────────────────────────────────────
export const IconFavorites = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" stroke={color}/>
  </Svg>
);

// ── Paquete ───────────────────────────────────────────────────────────────────
export const IconPackage = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke={color}/>
  </Svg>
);

// ── Tarjeta de crédito ────────────────────────────────────────────────────────
export const IconCreditCard = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color}/>
    <Line x1="2" y1="10" x2="22" y2="10" stroke={color}/>
  </Svg>
);

// ── Home ──────────────────────────────────────────────────────────────────────
export const IconHome = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1v-5m10-10l2 2m-2-2v10a1 1 0 01-1 1v-5m-6 0a1 1 0 001-1v5" stroke={color}/>
  </Svg>
);

// ── Books (Libros) ────────────────────────────────────────────────────────────
export const IconBooks = ({ size = 18, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color}/>
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" stroke={color}/>
  </Svg>
);

// ── Historial / Reloj ─────────────────────────────────────────────────────────
export const IconHistory = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 3v5h5" stroke={color}/>
    <Path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" stroke={color}/>
    <Path d="M12 7v5l4 2" stroke={color}/>
  </Svg>
);

// ── Burbuja de chat ─────────────────────────────────────────────────────────
export const IconChat = ({ size = 20, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// ── Moneda / Precio ─────────────────────────────────────────────────────────
export const IconDollar = ({ size = 20, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="1" x2="12" y2="23" />
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

