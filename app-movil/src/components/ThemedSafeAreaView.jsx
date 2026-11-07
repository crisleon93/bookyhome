import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';

export default function ThemedSafeAreaView({ style, ...props }) {
  const { colors } = useAppTheme();
  return <SafeAreaView {...props} style={[style, { backgroundColor: colors.page }]} />;
}
