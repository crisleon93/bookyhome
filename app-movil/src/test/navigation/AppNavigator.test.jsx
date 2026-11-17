import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AppNavigator from '../../navigation/AppNavigator';
import { AuthContext } from '../../context/AuthContext';

vi.mock('react-native', () => ({
  ActivityIndicator: () => <span>Loading navigation</span>,
  StyleSheet: { create: (styles) => styles },
  View: ({ children }) => <div>{children}</div>,
}));

vi.mock('@react-navigation/native-stack', async () => {
  const ReactModule = await vi.importActual('react');
  const Container = ({ children, initialRouteName }) => ReactModule.createElement(
    'div',
    { 'data-initial-route': initialRouteName },
    children,
  );
  const Screen = ({ name }) => ReactModule.createElement('span', null, name);
  return {
    createNativeStackNavigator: () => ({
      Navigator: Container,
      Screen,
      Group: Container,
    }),
  };
});

vi.mock('../../context/AuthContext', async () => {
  const { createContext } = await vi.importActual('react');
  return { AuthContext: createContext({}) };
});

vi.mock('../../context/ThemeContext', () => ({
  useAppTheme: () => ({ darkMode: false, colors: { page: '#fff' } }),
}));

vi.mock('../../components/MobileMenuButton', () => ({ default: () => null }));

vi.mock('../../screens/Login', () => ({ default: () => null }));
vi.mock('../../screens/Register', () => ({ default: () => null }));
vi.mock('../../screens/ForgotPassword', () => ({ default: () => null }));
vi.mock('../../screens/ResetPassword', () => ({ default: () => null }));
vi.mock('../../screens/VerifyEmail', () => ({ default: () => null }));
vi.mock('../../screens/Home', () => ({ default: () => null }));
vi.mock('../../screens/RegisterLibrary', () => ({ default: () => null }));
vi.mock('../../screens/Librerias', () => ({ default: () => null }));
vi.mock('../../screens/CatalogoPublico', () => ({ default: () => null }));
vi.mock('../../screens/BookDetailPublico', () => ({ default: () => null }));
vi.mock('../../screens/PostLogin', () => ({ default: () => null }));
vi.mock('../../screens/Catalogo', () => ({ default: () => null }));
vi.mock('../../screens/Profile', () => ({ default: () => null }));
vi.mock('../../screens/ConfiguracionComprador', () => ({ default: () => null }));
vi.mock('../../screens/History', () => ({ default: () => null }));
vi.mock('../../screens/Seguimiento', () => ({ default: () => null }));
vi.mock('../../screens/Notifications', () => ({ default: () => null }));
vi.mock('../../screens/BookDetail', () => ({ default: () => null }));
vi.mock('../../screens/Cart', () => ({ default: () => null }));
vi.mock('../../screens/Checkout', () => ({ default: () => null }));
vi.mock('../../screens/ListaDeseos', () => ({ default: () => null }));
vi.mock('../../screens/Libreria', () => ({ default: () => null }));
vi.mock('../../screens/PublicarLibro', () => ({ default: () => null }));
vi.mock('../../screens/ConfiguracionTienda', () => ({ default: () => null }));
vi.mock('../../screens/PerfilTienda', () => ({ default: () => null }));
vi.mock('../../screens/Messages', () => ({ default: () => null }));
vi.mock('../../screens/Chat', () => ({ default: () => null }));
vi.mock('../../screens/QuejasReclamos', () => ({ default: () => null }));
vi.mock('../../screens/Direcciones', () => ({ default: () => null }));
vi.mock('../../screens/SoporteTecnico', () => ({ default: () => null }));
vi.mock('../../screens/VendedorHome', () => ({ default: () => null }));
vi.mock('../../screens/AdminHome', () => ({ default: () => null }));
vi.mock('../../screens/PedidosVendedor', () => ({ default: () => null }));
vi.mock('../../screens/VentasVendedor', () => ({ default: () => null }));
vi.mock('../../screens/MetodosCobroVendedor', () => ({ default: () => null }));
vi.mock('../../screens/CalificacionesVendedor', () => ({ default: () => null }));
vi.mock('../../screens/SuscripcionesVendedor', () => ({ default: () => null }));
vi.mock('../../screens/ImpulsosVendedor', () => ({ default: () => null }));
vi.mock('../../screens/PromocionesVendedor', () => ({ default: () => null }));
vi.mock('../../screens/CuponesVendedor', () => ({ default: () => null }));

const renderNavigator = (value) => renderToStaticMarkup(
  React.createElement(
    AuthContext.Provider,
    { value },
    React.createElement(AppNavigator),
  ),
);

describe('AppNavigator', () => {
  it('muestra la pantalla de carga mientras se resuelve la sesión', () => {
    expect(renderNavigator({ loading: true, user: null, token: null })).toContain('Loading navigation');
  });

  it('muestra las rutas públicas y selecciona Home cuando no hay sesión', () => {
    const markup = renderNavigator({ loading: false, user: null, token: null });

    expect(markup).toContain('data-initial-route="Home"');
    expect(markup).toContain('Login');
    expect(markup).toContain('Register');
    expect(markup).toContain('CatalogoPublico');
    expect(markup).toContain('PerfilTienda');
    expect(markup).not.toContain('AdminHome');
  });

  it('muestra exclusivamente las rutas del vendedor para el rol vendedor', () => {
    const markup = renderNavigator({ loading: false, user: { rol: ' VENDEDOR ' }, token: 'token' });

    expect(markup).toContain('VendorHome');
    expect(markup).toContain('VentasVendedor');
    expect(markup).toContain('PromocionesVendedor');
    expect(markup).not.toContain('AdminHome');
    expect(markup).not.toContain('PostLogin');
  });

  it.each(['admin', 'administrador'])('muestra la ruta administrativa para %s', (role) => {
    const markup = renderNavigator({ loading: false, user: { rol: role }, token: null });

    expect(markup).toContain('AdminHome');
    expect(markup).not.toContain('VendorHome');
    expect(markup).not.toContain('PostLogin');
  });

  it('muestra las rutas de comprador al autenticarse con token sin rol de vendedor o admin', () => {
    const markup = renderNavigator({ loading: false, user: { rol: 'comprador' }, token: null });

    expect(markup).toContain('PostLogin');
    expect(markup).toContain('Cart');
    expect(markup).toContain('History');
    expect(markup).toContain('SoporteTecnico');
  });

  it('trata el token como sesión autenticada aunque user no esté cargado', () => {
    const markup = renderNavigator({ loading: false, user: null, token: 'token' });

    expect(markup).toContain('PostLogin');
    expect(markup).not.toContain('<span>Login</span>');
  });
});
