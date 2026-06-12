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
import { AuthContext } from '../context/AuthContext';
import RegisterLibrary from '../screens/RegisterLibrary';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
          <Stack.Screen name="RegisterLibrary" component={RegisterLibrary} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="PostLogin" component={PostLogin} options={{ headerShown: false }} />
          <Stack.Screen name="BookDetail" component={BookDetail} options={{ title: 'Detalle del libro' }} />
          <Stack.Screen name="Cart" component={Cart} options={{ title: 'Mi Carrito' }} />
          <Stack.Screen name="Checkout" component={Checkout} options={{ title: 'Pago Seguro' }} />
        </>
      )}
    </Stack.Navigator>
  );
}