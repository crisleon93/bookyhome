import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';

const ThemeContext = createContext({
  darkMode: false,
  setDarkMode: async () => {},
  colors: {
    page: '#F9F6F1',
    card: '#FFFFFF',
    surface: '#252525',
    text: '#2A2A2A',
    muted: '#666666',
    border: '#E0DBD4',
    inset: '#FAF8F6',
  },
});

export function ThemeProvider({ children }) {
  const [darkMode, setDarkModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode')
      .then((savedMode) => setDarkModeState(savedMode === 'true'))
      .catch((error) => console.warn('No se pudo cargar el tema guardado:', error));
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(darkMode ? 'dark' : 'light');
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
      document.body.style.backgroundColor = darkMode ? '#121212' : '#F9F6F1';
    }
  }, [darkMode]);

  const setDarkMode = async (enabled) => {
    await AsyncStorage.setItem('darkMode', String(enabled));
    setDarkModeState(enabled);
  };

  const colors = useMemo(() => ({
    page: darkMode ? '#121212' : '#F9F6F1',
    card: darkMode ? '#1E1E1E' : '#FFFFFF',
    surface: darkMode ? '#252525' : '#FFFFFF',
    text: darkMode ? '#ECECEC' : '#2A2A2A',
    muted: darkMode ? '#C8C8C8' : '#666666',
    border: darkMode ? '#3A3A3A' : '#E0DBD4',
    inset: darkMode ? '#303030' : '#FAF8F6',
  }), [darkMode]);

  const value = useMemo(() => ({ darkMode, setDarkMode, colors }), [darkMode, colors]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function adaptStyleForTheme(style, darkMode) {
  return darkMode ? mapStyleColors(style) : style;
}

function parseColor(value) {
  const normalized = value.toLowerCase().trim();
  const shortHex = normalized.match(/^#([0-9a-f]{3})$/i);
  const fullHex = normalized.match(/^#([0-9a-f]{6})$/i);
  const rgb = normalized.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/);

  if (shortHex) {
    return {
      channels: shortHex[1].split('').map((channel) => Number.parseInt(channel + channel, 16)),
      alpha: 1,
      format: 'hex',
    };
  }
  if (fullHex) {
    return {
      channels: [0, 2, 4].map((index) => Number.parseInt(fullHex[1].slice(index, index + 2), 16)),
      alpha: 1,
      format: 'hex',
    };
  }
  if (rgb) {
    return {
      channels: rgb.slice(1, 4).map(Number),
      alpha: rgb[4] === undefined ? 1 : Number(rgb[4]),
      format: rgb[4] === undefined ? 'rgb' : 'rgba',
    };
  }
  if (normalized === 'white') return { channels: [255, 255, 255], alpha: 1, format: 'hex' };
  if (normalized === 'black') return { channels: [0, 0, 0], alpha: 1, format: 'hex' };
  return null;
}

function colorLuminance([red, green, blue]) {
  const linear = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function formatColor(channels, format, alpha) {
  const values = channels.map((channel) => Math.round(Math.max(0, Math.min(255, channel))));
  if (format === 'rgba') return `rgba(${values.join(', ')}, ${alpha})`;
  if (format === 'rgb') return `rgb(${values.join(', ')})`;
  return `#${values.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function adaptColor(value, property) {
  if (typeof value !== 'string' || value === 'transparent' || value.startsWith('url(')) return value;
  const parsed = parseColor(value);
  if (!parsed || parsed.alpha < 0.5) return value;

  const propertyName = property.toLowerCase();
  const luminance = colorLuminance(parsed.channels);
  let channels = parsed.channels;

  if (propertyName === 'color' && luminance < 0.42) {
    channels = channels.map((channel) => (channel * 0.35) + (236 * 0.65));
  } else if (propertyName === 'backgroundcolor' && luminance > 0.16) {
    const base = luminance > 0.72 ? 30 : 37;
    const tint = luminance > 0.72 ? 0.08 : 0.18;
    channels = channels.map((channel) => (channel * tint) + (base * (1 - tint)));
  } else if (propertyName.includes('border') && luminance > 0.25) {
    channels = channels.map((channel) => (channel * 0.18) + (58 * 0.82));
  }

  return formatColor(channels, parsed.format, parsed.alpha);
}

function mapStyleColors(style) {
  if (Array.isArray(style)) return style.map(mapStyleColors);
  if (!style || typeof style !== 'object') return style;
  return Object.fromEntries(
    Object.entries(style).map(([property, value]) => {
      if (property.toLowerCase().includes('color')) {
        return [property, adaptColor(value, property)];
      }
      if (value && typeof value === 'object') return [property, mapStyleColors(value)];
      return [property, value];
    }),
  );
}

export function useThemedStyles(styles) {
  const { darkMode } = useAppTheme();
  return useMemo(() => {
    return adaptStyleForTheme(styles, darkMode);
  }, [darkMode, styles]);
}
