// src/screens/AdminHome.jsx
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

const PRIMARY = '#7A1E3A';
const BG = '#F9F6F1';
const WHITE = '#FFFFFF';

export default function AdminHome() {
  const { user, signOut } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administrador</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.greeting}>Hola, {user?.nombre || 'admin'} 👋</Text>
        <Text style={styles.placeholder}>
          Aquí irá el dashboard del administrador: gestión de usuarios,
          bloqueo de cuentas, moderación de tiendas, reportes, etc.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#7A1E3A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { color: WHITE, fontSize: 18, fontWeight: '800' },
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  signOutText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  content: { padding: 20 },
  greeting: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  placeholder: { fontSize: 14, color: '#666', lineHeight: 20 },
});