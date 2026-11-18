import { useEffect, useState } from 'react';

const readStoredDarkMode = () => localStorage.getItem('darkMode') === 'true';
const readDocumentDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export default function useSyncedDarkMode({ source = 'storage' } = {}) {
  const readMode = source === 'document' ? readDocumentDarkMode : readStoredDarkMode;
  const [darkMode, setDarkMode] = useState(readMode);

  useEffect(() => {
    const syncDarkMode = () => setDarkMode(readMode());
    window.addEventListener('darkModeChange', syncDarkMode);
    window.addEventListener('storage', syncDarkMode);
    return () => {
      window.removeEventListener('darkModeChange', syncDarkMode);
      window.removeEventListener('storage', syncDarkMode);
    };
  }, [readMode]);

  return [darkMode, setDarkMode];
}
