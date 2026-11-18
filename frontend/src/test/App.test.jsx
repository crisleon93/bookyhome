import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

const mocks = vi.hoisted(() => ({ getUserRole: vi.fn(() => null) }));

vi.mock('../hooks/useAuth', () => ({ getUserRole: mocks.getUserRole }));

vi.mock('../components/Header', () => ({
  default: ({ variant, hasSidebar }) => <div>Header:{variant}:{String(hasSidebar)}</div>,
}));
vi.mock('../components/Footer', () => ({
  default: ({ hasSidebar }) => <div>Footer:{String(hasSidebar)}</div>,
}));
vi.mock('../components/CookieBanner', () => ({ default: () => <div>Cookies</div> }));
vi.mock('../components/ToastProvider', () => ({ ToastProvider: ({ children }) => children }));
vi.mock('../components/PrivateRoute', async () => {
  const { Outlet } = await import('react-router-dom');
  return { default: () => <Outlet /> };
});

vi.mock('../pages/Home', () => ({ default: () => <div>Home page</div> }));
vi.mock('../pages/Catalogo', () => ({ default: () => <div>Catalogo page</div> }));
vi.mock('../pages/Librerias', () => ({ default: () => <div>Librerias page</div> }));
vi.mock('../pages/PerfilTienda', () => ({ default: () => <div>Perfil tienda page</div> }));
vi.mock('../pages/ResetPassword', () => ({ default: () => <div>Reset password page</div> }));
vi.mock('../pages/MiTienda', () => ({ default: () => <div>Mi tienda page</div> }));
vi.mock('../pages/PublicarLibro', () => ({ default: () => <div>Publicar libro page</div> }));
vi.mock('../pages/AdminDashboard', () => ({ default: () => <div>Admin dashboard page</div> }));
vi.mock('../pages/Historial', () => ({ default: () => <div>Historial page</div> }));
vi.mock('../pages/ListaDeseos', () => ({ default: () => <div>Lista deseos page</div> }));
vi.mock('../pages/Devoluciones', () => ({ default: () => <div>Devoluciones page</div> }));
vi.mock('../pages/BookyPagoFinanzas', () => ({ default: () => <div>Finanzas page</div> }));
vi.mock('../pages/LegalPage', () => ({ default: ({ type }) => <div>Legal {type}</div> }));
vi.mock('../components/AsistenteIA', () => ({ default: () => <div>Assistant</div> }));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    mocks.getUserRole.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('muestra la página pública con encabezado, pie y componentes globales', () => {
    render(<App />);

    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.getByText('Header:white:false')).toBeInTheDocument();
    expect(screen.getByText('Footer:false')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
  });

  it('muestra las páginas públicas y redirige rutas de alias', () => {
    window.history.replaceState({}, '', '/register');
    render(<App />);
    expect(screen.getByText('Home page')).toBeInTheDocument();

    cleanup();
    window.history.replaceState({}, '', '/terminos');
    render(<App />);
    expect(screen.getByText('Legal terminos')).toBeInTheDocument();

    cleanup();
    window.history.replaceState({}, '', '/catalogo');
    render(<App />);
    expect(screen.getByText('Catalogo page')).toBeInTheDocument();
  });

  it('oculta el encabezado y el pie de página en las rutas de administración', () => {
    window.history.replaceState({}, '', '/admin');
    render(<App />);

    expect(screen.getByText('Admin dashboard page')).toBeInTheDocument();
    expect(screen.queryByText(/Header:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Footer:/)).not.toBeInTheDocument();
  });

  it.each([
    ['vendedor', '/mi-tienda'],
    ['admin', '/admin'],
    ['administrador', '/admin'],
    [null, '/'],
  ])('redirige /dashboard para el rol %s', async (role, destination) => {
    mocks.getUserRole.mockReturnValue(role);
    window.history.replaceState({}, '', '/dashboard');
    render(<App />);

    await waitFor(() => {
      if (destination === '/mi-tienda') expect(screen.getByText('Mi tienda page')).toBeInTheDocument();
      else if (destination === '/admin') expect(screen.getByText('Admin dashboard page')).toBeInTheDocument();
      else expect(screen.getByText('Home page')).toBeInTheDocument();
    });
  });

  it('actualiza el estado de autenticación al recibir eventos y limpia listeners e intervalo', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const intervalSpy = vi.spyOn(window, 'setInterval');
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const { unmount } = render(<App />);

    expect(addSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('auth-change', expect.any(Function));
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

    localStorage.setItem('token', 'session');
    act(() => window.dispatchEvent(new Event('storage')));
    expect(screen.getByText('Header:white:true')).toBeInTheDocument();

    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'true');
    act(() => window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: true } })));
    expect(document.documentElement).toHaveClass('dark');

    act(() => window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } })));
    expect(document.documentElement).not.toHaveClass('dark');
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('auth-change', expect.any(Function));
    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalSpy.mock.results[0].value);
  });
});
