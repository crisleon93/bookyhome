import React from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';

const VINOTINTO = '#7A1E3A';

export default function AuthHeader() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={VINOTINTO} />
      <View style={styles.bar}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: VINOTINTO,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  logo: { width: 40, height: 40 },
});