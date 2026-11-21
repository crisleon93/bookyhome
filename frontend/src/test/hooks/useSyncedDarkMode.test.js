import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import useSyncedDarkMode from '../../hooks/useSyncedDarkMode';

describe('useSyncedDarkMode hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('lee el estado desde localStorage y reacciona a eventos darkModeChange y storage', () => {
    localStorage.setItem('darkMode', 'true');
    const { result } = renderHook(() => useSyncedDarkMode({ source: 'storage' }));
    expect(result.current[0]).toBe(true);

    act(() => {
      localStorage.setItem('darkMode', 'false');
      window.dispatchEvent(new Event('darkModeChange'));
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      localStorage.setItem('darkMode', 'true');
      window.dispatchEvent(new Event('storage'));
    });
    expect(result.current[0]).toBe(true);
  });

  it('lee el estado desde la clase document.documentElement cuando source=document', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useSyncedDarkMode({ source: 'document' }));
    expect(result.current[0]).toBe(true);

    act(() => {
      document.documentElement.classList.remove('dark');
      window.dispatchEvent(new Event('darkModeChange'));
    });
    expect(result.current[0]).toBe(false);
  });
});
