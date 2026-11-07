import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ChatSocketProvider } from './src/context/ChatSocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { Image, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Referencia global de navegación
export const navigationRef = React.createRef();

function RootNavigation() {
  const { darkMode, colors } = useAppTheme();
  const navigationTheme = {
    ...DefaultTheme,
    dark: darkMode,
    colors: {
      primary: '#7A1E3A',
      background: colors.page,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: '#e91e63',
    },
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={darkMode ? '#1e1e1e' : '#7A1E3A'}
      />
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

if (Platform.OS !== 'web') {
  Image.prefetch(Image.resolveAssetSource(require('./src/assets/logo.png')).uri);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <ChatSocketProvider>
              <CartProvider>
                <RootNavigation />
              </CartProvider>
            </ChatSocketProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
