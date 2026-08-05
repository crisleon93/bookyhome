import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/Login';
import Register from '../screens/Register';
import ForgotPassword from '../screens/ForgotPassword';
import Home from '../screens/Home';
import PostLogin from '../screens/PostLogin';
import Cart from '../screens/Cart';
import BookDetail from '../screens/BookDetail';
import Checkout from '../screens/Checkout';
import Profile from '../screens/Profile';
import History from '../screens/History';
import Notifications from '../screens/Notifications';
import { AuthContext } from '../context/AuthContext';
import RegisterLibrary from '../screens/RegisterLibrary';
import ListaDeseos from '../screens/ListaDeseos';
import Libreria from '../screens/Libreria';
import PublicarLibro from '../screens/PublicarLibro';
import MiTienda from '../screens/MiTienda';
import ResetPassword from '../screens/ResetPassword';
import VerifyEmail from '../screens/VerifyEmail';
import VendorHome from '../screens/VendorHome';
import AdminHome from '../screens/AdminHome';
import { AuthContext } from '../context/AuthContext';
import RegisterLibrary from '../screens/RegisterLibrary';
import Chat from '../screens/Chat';
import Messages from '../screens/Messages';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, token, loading } = useContext(AuthContext);
  const isAuthenticated = Boolean(token || user);

  if (loading) return null;

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
          <Stack.Screen name="RegisterLibrary" component={RegisterLibrary} options={{ headerShown: false }} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ headerShown: false }} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmail} options={{ headerShown: false }} />
        </>
      ) : user.rol === 'vendedor' ? (
        <>
          <Stack.Screen name="VendorHome" component={VendorHome} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={Chat} options={{ title: 'Chat' }} />
        </>
      ) : user.rol === 'admin' ? (
        <>
          <Stack.Screen name="AdminHome" component={AdminHome} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="PostLogin" component={PostLogin} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={Profile} options={{ title: 'Mi Perfil' }} />
          <Stack.Screen name="History" component={History} options={{ title: 'Historial de compras' }} />
          <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Notificaciones' }} />
          <Stack.Screen name="BookDetail" component={BookDetail} options={{ title: 'Detalle del libro' }} />
          <Stack.Screen name="Cart" component={Cart} options={{ title: 'Mi Carrito' }} />
          <Stack.Screen name="Checkout" component={Checkout} options={{ title: 'Pago Seguro' }} />
          <Stack.Screen name="ListaDeseos" component={ListaDeseos} options={{ title: 'Lista de Deseos' }} />
          <Stack.Screen name="Libreria" component={Libreria} options={{ title: 'Mi Librería' }} />
          <Stack.Screen name="PublicarLibro" component={PublicarLibro} options={{ title: 'Publicar Libro' }} />
          <Stack.Screen name="MiTienda" component={MiTienda} options={{ headerShown: false }} />
          <Stack.Screen name="Messages" component={Messages} options={{ headerShown: false }} />
          <Stack.Screen name="BookDetail" component={BookDetail} options={{ title: 'Detalle del libro' }} />
          <Stack.Screen name="Cart" component={Cart} options={{ title: 'Mi Carrito' }} />
          <Stack.Screen name="Checkout" component={Checkout} options={{ title: 'Pago Seguro' }} />
          <Stack.Screen name="Chat" component={Chat} options={{ title: 'Chat' }} />
        </>
      )}
    </Stack.Navigator>
  );
}