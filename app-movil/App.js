import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ChatSocketProvider } from './src/context/ChatSocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { Image, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';
import BookyChat from './src/components/BookyChat';

// Referencia global de navegación
export const navigationRef = React.createRef();
const SYSTEM_BAR_COLOR = '#7A1E3A';

function RootNavigation() {
  const { darkMode, colors } = useAppTheme();
  const insets = useSafeAreaInsets();
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
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={SYSTEM_BAR_COLOR}
      />
      {Platform.OS === 'android' && (
        <NavigationBar style="dark" />
      )}
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <AppNavigator />
        <BookyChat />
      </NavigationContainer>
      {Platform.OS !== 'web' && (
        <>
          <View
            pointerEvents="none"
            style={[styles.systemBarTop, { height: insets.top }]}
          />
          <View
            pointerEvents="none"
            style={[styles.systemBarBottom, { height: insets.bottom }]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SYSTEM_BAR_COLOR,
  },
  systemBarTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: SYSTEM_BAR_COLOR,
    zIndex: 10,
  },
  systemBarBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SYSTEM_BAR_COLOR,
    zIndex: 10,
  },
});

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
