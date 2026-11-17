import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Appearance: {},
  Platform: { OS: 'web' },
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn(), setItem: vi.fn() },
}));
vi.mock('../context/AuthContext.jsx', async () => {
  const { createContext } = await import('react');
  return { AuthContext: createContext({ token: null, loading: false }) };
});

import { adaptStyleForTheme, resolveDarkModeForSession } from '../context/ThemeContext.jsx';

describe('adaptStyleForTheme', () => {
  it('uses the seller web dark palette for brand accents and status colors', () => {
    const styles = adaptStyleForTheme({
      title: { color: '#7A1E3A' },
      success: { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7', color: '#065F46' },
    }, true);

    expect(styles.title.color).toBe('#e05a7a');
    expect(styles.success).toEqual({
      backgroundColor: '#0d2e23',
      borderColor: '#1f7a5d',
      color: '#a7f3d0',
    });
  });

  it('leaves light-mode styles unchanged', () => {
    const styles = { title: { color: '#7A1E3A' } };

    expect(adaptStyleForTheme(styles, false)).toBe(styles);
  });

  it('keeps the saved preference while disabling dark mode for public sessions', () => {
    expect(resolveDarkModeForSession(false, true)).toBe(false);
    expect(resolveDarkModeForSession(true, true)).toBe(true);
    expect(resolveDarkModeForSession(true, false)).toBe(false);
  });
});
