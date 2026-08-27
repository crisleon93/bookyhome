import React, { useContext } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

import Login from '../screens/Login';
import Register from '../screens/Register';
import ForgotPassword from '../screens/ForgotPassword';
import ResetPassword from '../screens/ResetPassword';
import VerifyEmail from '../screens/VerifyEmail';
import Home from '../screens/Home';
import RegisterLibrary from '../screens/RegisterLibrary';

import PostLogin from '../screens/PostLogin';
import Profile from '../screens/Profile';
import History from '../screens/History';
import Notifications from '../screens/Notifications';
import BookDetail from '../screens/BookDetail';
import Cart from '../screens/Cart';
import Checkout from '../screens/Checkout';
import ListaDeseos from '../screens/ListaDeseos';
import Libreria from '../screens/Libreria';
import PublicarLibro from '../screens/PublicarLibro';
import ConfiguracionTienda from '../screens/ConfiguracionTienda';
import PerfilTienda from '../screens/PerfilTienda';
import Messages from '../screens/Messages';
import Chat from '../screens/Chat';
import QuejasReclamos from '../screens/QuejasReclamos';
import Direcciones from '../screens/Direcciones';

import VendedorHome from '../screens/VendedorHome';
import AdminHome from '../screens/AdminHome';
import PedidosVendedor from '../screens/PedidosVendedor';
import VentasVendedor from '../screens/VentasVendedor';
import CalificacionesVendedor from '../screens/CalificacionesVendedor';
import SuscripcionesVendedor from '../screens/SuscripcionesVendedor';
import ImpulsosVendedor from '../screens/ImpulsosVendedor';
import MobileMenuButton from '../components/MobileMenuButton';
import PromocionesVendedor from '../screens/PromocionesVendedor';
import CuponesVendedor from '../screens/CuponesVendedor';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, token, loading, biometricLocked } = useContext(AuthContext);
  const isAuthenticated = Boolean(token || user);
  const isAdmin = user?.rol === 'admin' || user?.rol === 'administrador';

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#7A1E3A" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={!isAuthenticated ? 'Home' : undefined}>
      {!isAuthenticated ? (
        // ─── Rutas públicas ──────────────────────────────────────────────────
        <>
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ headerShown: false }} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmail} options={{ headerShown: false }} />
          <Stack.Screen name="RegisterLibrary" component={RegisterLibrary} options={{ headerShown: false }} />
        </>
      ) : user.rol === 'vendedor' ? (
        // ─── Rutas vendedor ──────────────────────────────────────────────────
        <>
          <Stack.Screen name="VendorHome" component={VendedorHome} options={{ headerShown: false }} />
          <Stack.Screen name="Libreria" component={Libreria} options={{ headerShown: false }} />
          <Stack.Screen name="PublicarLibro" component={PublicarLibro} options={{ headerShown: false }} />
          <Stack.Screen name="VentasVendedor" component={VentasVendedor} options={{ headerShown: false }} />
          <Stack.Screen name="PedidosVendedor" component={PedidosVendedor} options={{ headerShown: false }} />
          <Stack.Screen name="CalificacionesVendedor" component={CalificacionesVendedor} options={{ headerShown: false }} />
          <Stack.Screen name="SuscripcionesVendedor" component={SuscripcionesVendedor} options={{ headerShown: false }} />
          <Stack.Screen name="ImpulsosVendedor" component={ImpulsosVendedor} options={{ headerShown: false }} />
          <Stack.Screen name="PromocionesVendedor" component={PromocionesVendedor} options={{ headerShown: false }} />
          <Stack.Screen name="CuponesVendedor" component={CuponesVendedor} options={{ headerShown: false }} />
          <Stack.Screen name="Direcciones" component={Direcciones} options={{ title: 'Mis direcciones' }} />
          <Stack.Screen name="ConfiguracionTienda" component={ConfiguracionTienda} options={{ headerShown: false }} />
          <Stack.Screen name="PerfilTienda" component={PerfilTienda} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} />
          <Stack.Screen name="Messages" component={Messages} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={Chat} options={{ title: 'Chat' }} />
          <Stack.Screen name="QuejasReclamos" component={QuejasReclamos} options={{ headerShown: false }} />
        </>
      ) : isAdmin ? (
        // ─── Rutas admin ─────────────────────────────────────────────────────
        <>
          <Stack.Screen name="AdminHome" component={AdminHome} options={{ headerShown: false }} />
        </>
      ) : (
        // ─── Rutas comprador ─────────────────────────────────────────────────
        <Stack.Group screenOptions={{
          headerStyle: { backgroundColor: '#7A1E3A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { color: '#FFFFFF' },
          headerLeft: () => <MobileMenuButton tintColor="#FFFFFF" />,
        }}>
          <Stack.Screen name="PostLogin" component={PostLogin} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={Profile} options={{ title: 'Mi Perfil' }} />
          <Stack.Screen name="Direcciones" component={Direcciones} options={{ title: 'Mis direcciones' }} />
          <Stack.Screen
            name="History"
            component={History}
            options={{
              title: 'Mis compras',
              headerStyle: { backgroundColor: '#7A1E3A' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { color: '#FFFFFF' },
              headerLeft: () => <MobileMenuButton tintColor="#FFFFFF" />,
            }}
          />
          <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Notificaciones' }} />
          <Stack.Screen name="BookDetail" component={BookDetail} options={{ title: 'Detalle del libro' }} />
          <Stack.Screen name="Cart" component={Cart} options={{ title: 'Mi Carrito' }} />
          <Stack.Screen name="Checkout" component={Checkout} options={{ title: 'Pago Seguro' }} />
          <Stack.Screen name="ListaDeseos" component={ListaDeseos} options={{ title: 'Lista de Deseos' }} />
          <Stack.Screen name="Libreria" component={Libreria} options={{ title: 'Mi Librería' }} />
          <Stack.Screen name="PublicarLibro" component={PublicarLibro} options={{ title: 'Publicar Libro' }} />
          <Stack.Screen name="ConfiguracionTienda" component={ConfiguracionTienda} options={{ title: 'Configuración de Tienda' }} />
          <Stack.Screen name="PerfilTienda" component={PerfilTienda} options={{ title: 'Perfil de Tienda', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="Messages" component={Messages} options={{ title: 'Mensajes' }} />
          <Stack.Screen name="Chat" component={Chat} options={{ title: 'Chat' }} />
          <Stack.Screen name="QuejasReclamos" component={QuejasReclamos} options={{ title: 'Quejas y reclamos' }} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F6F1',
  },
});
