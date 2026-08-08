import React from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';

const VINOTINTO = '#7A1E3A';

export default function AuthHeader() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={VINOTINTO} translucent={false} />
      <View style={styles.bar}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: VINOTINTO,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 160, height: 51, resizeMode: 'contain' },
});