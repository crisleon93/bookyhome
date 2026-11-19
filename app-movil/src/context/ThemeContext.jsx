import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';
import { AuthContext } from './AuthContext';

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

export function resolveDarkModeForSession(isAuthenticated, savedPreference) {
  return Boolean(isAuthenticated && savedPreference);
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [savedDarkMode, setSavedDarkMode] = useState(null);
  const { token, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    AsyncStorage.getItem('darkMode')
      .then((savedMode) => setSavedDarkMode(savedMode === 'true'))
      .catch((error) => {
        console.warn('No se pudo cargar el tema guardado:', error);
        setSavedDarkMode(false);
      });
  }, []);

  useEffect(() => {
    if (authLoading || savedDarkMode === null) return;
    setDarkModeState(resolveDarkModeForSession(Boolean(token), savedDarkMode));
  }, [authLoading, token, savedDarkMode]);

  useEffect(() => {
    if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(darkMode ? 'dark' : 'light');
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
      document.body.style.backgroundColor = darkMode ? '#121212' : '#F9F6F1';
    }
  }, [darkMode]);

  const setDarkMode = useCallback(async (enabled) => {
    const preference = Boolean(enabled);
    await AsyncStorage.setItem('darkMode', String(preference));
    setSavedDarkMode(preference);
    setDarkModeState(resolveDarkModeForSession(Boolean(token), preference));
  }, [token]);

  const colors = useMemo(() => ({
    page: darkMode ? '#121212' : '#F9F6F1',
    card: darkMode ? '#1E1E1E' : '#FFFFFF',
    surface: darkMode ? '#252525' : '#FFFFFF',
    text: darkMode ? '#E0E0E0' : '#2A2A2A',
    muted: darkMode ? '#C8C8C8' : '#666666',
    border: darkMode ? '#333333' : '#E0DBD4',
    inset: darkMode ? '#2A2A2A' : '#FAF8F6',
  }), [darkMode]);

  const value = useMemo(() => ({ darkMode, setDarkMode, colors }), [darkMode, setDarkMode, colors]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function adaptStyleForTheme(style, darkMode) {
  return darkMode ? mapStyleColors(style) : style;
}

export function createThemeAwareComponent(Component, styleProps = ['style'], colorProps = []) {
  return React.forwardRef(function ThemeAwareComponent(props, ref) {
    const { darkMode } = useAppTheme();
    const themedProps = { ...props };

    styleProps.forEach((prop) => {
      if (themedProps[prop] !== undefined) {
        themedProps[prop] = adaptStyleForTheme(themedProps[prop], darkMode);
      }
    });
    colorProps.forEach((prop) => {
      if (themedProps[prop] !== undefined) {
        const styleProperty = prop.toLowerCase().includes('background') ? 'backgroundColor' : 'color';
        const adaptColor = (color) => adaptStyleForTheme({ [styleProperty]: color }, darkMode)[styleProperty];
        themedProps[prop] = Array.isArray(themedProps[prop])
          ? themedProps[prop].map(adaptColor)
          : adaptColor(themedProps[prop]);
      }
    });

    return <Component {...themedProps} ref={ref} />;
  });
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

const DARK_BACKGROUND_COLORS = {
  '#ffffff': '#1e1e1e',
  '#fff': '#1e1e1e',
  '#f9f6f1': '#1a1a1a',
  '#f4ede2': '#1a1a1a',
  '#faf8f6': '#252525',
  '#fafafa': '#2a2a2a',
  '#d1fae5': '#0d2e23',
  '#dcfce7': '#0f2e1a',
  '#dbeafe': '#0e1d39',
  '#eff6ff': '#0d1f3c',
  '#fef9c3': '#2a1a00',
  '#fef3c7': '#2a1a08',
  '#fffbeb': '#2a1a08',
  '#fff7ed': '#2e1a08',
  '#fee2e2': '#2e0d0d',
  '#fef2f2': '#2e0d0d',
  '#fdf2f4': '#2a1a24',
  '#f7e8ec': '#2a1a24',
  '#fff8f8': '#2a1a24',
  '#fff8f5': '#2a1a08',
  '#f3f4f6': '#2a2a2a',
};

const DARK_TEXT_COLORS = {
  '#2a2a2a': '#e0e0e0',
  '#666666': '#c8c8c8',
  '#065f46': '#a7f3d0',
  '#166534': '#86efac',
  '#047857': '#4ade80',
  '#1e40af': '#bfdbfe',
  '#854d0e': '#fbbf24',
  '#92400e': '#fbbf24',
  '#991b1b': '#fca5a5',
  '#b91c1c': '#fca5a5',
  '#374151': '#e5e7eb',
  '#4b5563': '#d1d5db',
  '#7a1e3a': '#e05a7a',
  '#5a1228': '#e05a7a',
};

const DARK_BORDER_COLORS = {
  '#e0dbd4': '#333333',
  '#6ee7b7': '#1f7a5d',
  '#bbf7d0': '#2a5a3a',
  '#93c5fd': '#3b82f6',
  '#fde047': '#b45309',
  '#fca5a5': '#7f1d1d',
  '#fecaca': '#7f1d1d',
  '#d1d5db': '#374151',
};

function adaptColor(value, property) {
  if (typeof value !== 'string' || value === 'transparent' || value.startsWith('url(')) return value;
  const parsed = parseColor(value);
  if (!parsed || parsed.alpha < 0.5) return value;

  const propertyName = property.toLowerCase();
  const normalized = value.toLowerCase().trim();
  if (propertyName === 'backgroundcolor' && DARK_BACKGROUND_COLORS[normalized]) {
    return DARK_BACKGROUND_COLORS[normalized];
  }
  if (propertyName === 'color' && DARK_TEXT_COLORS[normalized]) {
    return DARK_TEXT_COLORS[normalized];
  }
  if (propertyName.includes('border') && DARK_BORDER_COLORS[normalized]) {
    return DARK_BORDER_COLORS[normalized];
  }

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
