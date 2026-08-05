import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ChatSocketProvider } from './src/context/ChatSocketContext';
import { Image } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración global de notificaciones para primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Configurar el canal por defecto de Android apenas abre la App
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

Image.prefetch(Image.resolveAssetSource(require('./src/assets/logo.png')).uri);

export default function App() {
  return (
    <AuthProvider>
      <ChatSocketProvider>
        <CartProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </ChatSocketProvider>
    </AuthProvider>
  );
}