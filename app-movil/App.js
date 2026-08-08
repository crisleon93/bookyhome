import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ChatSocketProvider } from './src/context/ChatSocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { Image, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Referencia global de navegación
export const navigationRef = React.createRef();

if (Platform.OS !== 'web') {
  Image.prefetch(Image.resolveAssetSource(require('./src/assets/logo.png')).uri);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <ChatSocketProvider>
            <CartProvider>
              <NavigationContainer ref={navigationRef}>
                <AppNavigator />
              </NavigationContainer>
            </CartProvider>
          </ChatSocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
