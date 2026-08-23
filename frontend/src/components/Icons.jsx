import React from 'react';



export const IconSearch = ({ className = "", width = 24, height = 24, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <circle cx="11" cy="11" r="8"/>

    <path d="m21 21-4.3-4.3"/>

  </svg>

);



export const IconUser = ({ className = "", width = 24, height = 24, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>

    <circle cx="12" cy="7" r="4"/>

  </svg>

);



export const IconUserPlus = ({ className = "", width = 24, height = 24, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>

    <circle cx="8.5" cy="7" r="4"/>

    <line x1="20" y1="8" x2="20" y2="14"/>

    <line x1="17" y1="11" x2="23" y2="11"/>

  </svg>

);



export const IconUsers = ({ className = "", width = 24, height = 24, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>

    <circle cx="9" cy="7" r="4"/>

    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>

    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>

  </svg>

);



export const IconMail = ({ className = "", width = 24, height = 24, strokeWidth = 1.8, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"

    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />

  </svg>

);



export const IconLock = ({ className = "", width = 24, height = 24, strokeWidth = 1.8, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"

    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M16.5 10.5V7.125A4.125 4.125 0 008.25 7.125V10.5M6 10.5h12a1.5 1.5 0 011.5 1.5v7.5A1.5 1.5 0 0118 21H6a1.5 1.5 0 01-1.5-1.5V12A1.5 1.5 0 016 10.5z" />

  </svg>

);



export const IconEyeOpen = ({ className = "eye-icon", width = 24, height = 24, strokeWidth = 1.8, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"

    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />

    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />

  </svg>

);



export const IconEyeClosed = ({ className = "eye-icon", width = 24, height = 24, strokeWidth = 1.8, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"

    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />

  </svg>

);



export const IconCheck = ({ className = "", width = 18, height = 18, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

  </svg>

);



export const IconClose = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M6 18L18 6M6 6l12 12" />

  </svg>

);



export const IconLocation = ({ className = "", width = 24, height = 24, strokeWidth = 1.8, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"

    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />

    <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />

  </svg>

);



export const IconLocationTopBar = ({ className = "icon-top-bar", width = 24, height = 24, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>

    <circle cx="12" cy="10" r="3"/>

  </svg>

);



export const IconStore = ({ className = "", width = 24, height = 24, strokeWidth = 1.8, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"

    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25h-1.5A2.25 2.25 0 007.5 13.5V21m6 0H7.5m6 0h3.75A2.25 2.25 0 0019.5 18.75V9.375a2.25 2.25 0 00-.659-1.591l-4.5-4.5A2.25 2.25 0 0012.75 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21H7.5" />

  </svg>

);



export const IconStoreAlt = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 

    strokeWidth={strokeWidth} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />

  </svg>

);



export const IconPhone = ({ className = "", width = 24, height = 24, strokeWidth = 1.8, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"

    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.554-5.154-3.883-6.707-6.707l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />

  </svg>

);



export const IconWallet = ({ className = "", width = 24, height = 24, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v5"/>

    <path d="M3 12v9a2 2 0 002 2h14a2 2 0 002-2v-9"/>

    <path d="M3 12h18"/>

    <path d="M18 12a2 2 0 00-2 2v4a2 2 0 002 2h2v-8h-2z"/>

  </svg>

);



export const IconArrow = ({ className = "modal-arrow", width = 24, height = 24, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"

    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />

  </svg>

);



export const IconBooks = ({ className = "header-nav-icon", width = 18, height = 18, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />

    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />

  </svg>

);



export const IconFavorites = ({ className = "header-nav-icon", width = 18, height = 18, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />

  </svg>

);



export const IconFavoritesAlt = ({ className = "", width = 24, height = 24, strokeWidth = 2.2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364" />

  </svg>

);



export const IconCart = ({ className = "header-nav-icon", width = 18, height = 18, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <circle cx="9" cy="20" r="1" />

    <circle cx="17" cy="20" r="1" />

    <path d="M3 3h2l2.68 13.39A2 2 0 0 0 9.66 18H18a2 2 0 0 0 2-1.6L22 6H6" />

  </svg>

);



export const IconCartAlt = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 

    strokeWidth={strokeWidth} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M10 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />

  </svg>

);



export const IconMenu = ({ className = "", width = 22, height = 22, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M4 6h16M4 12h16M4 18h16" />

  </svg>

);



export const IconHome = ({ className = "", width = 22, height = 22, strokeWidth = 2.2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1v-5m10-10l2 2m-2-2v10a1 1 0 01-1 1v-5m-6 0a1 1 0 001-1v5" />

  </svg>

);



export const IconBook = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 

    strokeWidth={strokeWidth} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />

  </svg>

);



export const IconPlus = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 

    strokeWidth={strokeWidth} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M12 4v16m8-8H4" />

  </svg>

);



export const IconPackage = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 

    strokeWidth={strokeWidth} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />

  </svg>

);



export const IconSettings = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37z" />

    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />

  </svg>

);



export const IconTag = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 

    strokeWidth={strokeWidth} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />

    <path d="M6 6h.008v.008H6V6Z" />

  </svg>

);



/* ===== Iconos que tenías agregados (formato con props para consistencia) ===== */



export const IconChartBar = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <line x1="12" y1="20" x2="12" y2="10"/>

    <line x1="18" y1="20" x2="18" y2="4"/>

    <line x1="6" y1="20" x2="6" y2="16"/>

  </svg>

);



export const IconTrendingUp = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>

    <polyline points="16 7 22 7 22 13"/>

  </svg>

);



export const IconLayoutDashboard = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <rect x="3" y="3" width="7" height="9"/>

    <rect x="14" y="3" width="7" height="5"/>

    <rect x="14" y="12" width="7" height="9"/>

    <rect x="3" y="16" width="7" height="5"/>

  </svg>

);



export const IconChevronLeft = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <polyline points="15 18 9 12 15 6"/>

  </svg>

);



export const IconLogOut = ({ className = "", width = 18, height = 18, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>

    <polyline points="16 17 21 12 16 7"/>

    <line x1="21" y1="12" x2="9" y2="12"/>

  </svg>

);



export const IconUnlock = ({ className = "", width = 14, height = 14, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <rect x="3" y="11" width="18" height="11" rx="2"/>

    <path d="M7 11V7a5 5 0 019.9-1"/>

  </svg>

);



export const IconBan = ({ className = "", width = 14, height = 14, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <circle cx="12" cy="12" r="10"/>

    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>

  </svg>

);



export const IconEye = ({ className = "", width = 14, height = 14, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>

    <circle cx="12" cy="12" r="3"/>

  </svg>

);



export const IconTrash = ({ className = "", width = 14, height = 14, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <polyline points="3 6 5 6 21 6"/>

    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>

  </svg>

);



export const IconDollar = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"

    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <line x1="12" y1="1" x2="12" y2="23"/>

    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>

  </svg>

);



export const IconStar = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    strokeWidth={strokeWidth} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />

  </svg>

);



export const IconMapPin = ({ className = "", width = 22, height = 22, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>

    <circle cx="12" cy="10" r="3"/>

  </svg>

);



// Iconos para notificaciones

export const IconMessage = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />

  </svg>

);



export const IconCreditCard = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <rect x="2" y="5" width="20" height="14" rx="2" />

    <line x1="2" y1="10" x2="22" y2="10" />

  </svg>

);



export const IconTruck = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <rect x="1" y="3" width="15" height="13" />

    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />

    <circle cx="5.5" cy="18.5" r="2.5" />

    <circle cx="18.5" cy="18.5" r="2.5" />

  </svg>

);



export const IconGift = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <polyline points="20 12 20 22 4 22 4 12" />

    <rect x="2" y="7" width="20" height="5" />

    <line x1="12" y1="22" x2="12" y2="7" />

    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />

    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />

  </svg>

);



export const IconInfo = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <circle cx="12" cy="12" r="10" />

    <line x1="12" y1="16" x2="12" y2="12" />

    <line x1="12" y1="8" x2="12.01" y2="8" />

  </svg>

);



export const IconBell = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />

    <path d="M13.73 21a2 2 0 0 1-3.46 0" />

  </svg>

);



export const IconShoppingBag = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />

    <line x1="3" y1="6" x2="21" y2="6" />

    <path d="M16 10a4 4 0 0 1-8 0" />

  </svg>

);



export const IconBookOpen = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />

    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />

    <path d="M12 6v12" />

    <path d="M8 10h4" />

    <path d="M8 14h3" />

  </svg>

);



export const IconTool = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M14.7 6.3a5 5 0 0 0-6.9 6.9L3 18a2.1 2.1 0 1 0 3 3l4.8-4.8a5 5 0 0 0 6.9-6.9l-3.1 3.1-2.6-.5-.5-2.6 3.2-3Z" />

  </svg>

);



export const IconAlertTriangle = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />

    <line x1="12" y1="9" x2="12" y2="13" />

    <line x1="12" y1="17" x2="12.01" y2="17" />

  </svg>

);



export const IconArrowDown = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M12 5v14" />

    <path d="m19 12-7 7-7-7" />

  </svg>

);



export const IconRefresh = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M21 12a9 9 0 1 1-2.64-6.36" />

    <path d="M21 3v6h-6" />

  </svg>

);



export const IconBolt = ({ className = "", width = 20, height = 20, strokeWidth = 2, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />

  </svg>

);



export const IconCalendar = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"

    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>

    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

    <line x1="16" y1="2" x2="16" y2="6" />

    <line x1="8" y1="2" x2="8" y2="6" />

    <line x1="3" y1="10" x2="21" y2="10" />

  </svg>

);

export const IconEdit = ({ className = "", width = 22, height = 22, strokeWidth = 1.5, ...props }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" width={width} height={height} {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);