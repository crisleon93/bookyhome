// src/components/Icons.jsx
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const STROKE = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };

export const IconSearch = ({ size = 20, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconUser = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconUserPlus = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconLocation = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconCart = ({ size = 22, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconLogout = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconChevronRight = ({ size = 18, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconClose = ({ size = 20, color = '#2A2A2A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 18L18 6M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconShield = ({ size = 24, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconTruck = ({ size = 24, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconBook = ({ size = 24, color = '#7A1E3A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconMail = ({ size = 18, color = '#C5425A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2.25 6.75c0-1.036.84-1.875 1.875-1.875h15.75c1.035 0 1.875.84 1.875 1.875v10.5A1.875 1.875 0 0119.875 19.125H4.125A1.875 1.875 0 012.25 17.25V6.75z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3 6.75l9 6.75 9-6.75" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconLock = ({ size = 18, color = '#C5425A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconEye = ({ size = 18, color = '#aaa' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconEyeOff = ({ size = 18, color = '#aaa' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconGoogle = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 01-2.4 3.62v3h3.87c2.27-2.09 3.59-5.17 3.59-8.81z"/>
    <Path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.12-6.73-4.96H1.27v3.1A12 12 0 0012 24z"/>
    <Path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 010-4.54v-3.1H1.27a12 12 0 000 10.74l4-3.1z"/>
    <Path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.1C6.22 6.89 8.87 4.77 12 4.77z"/>
  </Svg>
);

export const IconPhone = ({ size = 18, color = '#C5425A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.733.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const IconStore = ({ size = 18, color = '#C5425A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25h-1.5A2.25 2.25 0 007.5 13.5V21m6 0H7.5m6 0h3.75A2.25 2.25 0 0019.5 18.75V9.375a2.25 2.25 0 00-.659-1.591l-4.5-4.5A2.25 2.25 0 0012.75 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21H7.5"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);