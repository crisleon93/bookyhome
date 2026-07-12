// src/components/Footer.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CARBON = '#2A2A2A';
const WHITE  = '#FFFFFF';
const VINOTINTO = '#7A1E3A';

const COLUMNS = [
  {
    title: 'BookyHome',
    links: ['Acerca de nosotros', 'Contacto', 'Términos y condiciones', 'Política de privacidad'],
  },
  {
    title: 'Comprar',
    links: ['Explorar catálogo', 'Cómo comprar', 'Envíos y entregas', 'Devoluciones'],
  },
  {
    title: 'Vender',
    links: ['Vender en BookyHome', 'Planes y tarifas', 'Centro de vendedores', 'FAQ vendedores'],
  },
  {
    title: 'Mi Cuenta',
    links: ['Iniciar sesión / Registro', 'Mis compras', 'Mis favoritos', 'Ayuda y Soporte'],
  },
];

export default function Footer({ onLinkPress }) {
  return (
    <View style={styles.footer}>

      {/* Columnas */}
      <View style={styles.grid}>
        {COLUMNS.map((col, i) => (
          <View key={i} style={styles.column}>
            <Text style={styles.colTitle}>{col.title}</Text>
            {col.links.map((link, j) => (
              <TouchableOpacity key={j} onPress={() => onLinkPress?.(link)} activeOpacity={0.7}>
                <Text style={styles.colLink}>{link}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Copyright */}
      <Text style={styles.copyright}>© 2025 BookyHome · Todos los derechos reservados.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer:    { backgroundColor: CARBON, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 20 },
  column:    { minWidth: '42%', flex: 1 },
  colTitle:  { color: WHITE, fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  colLink:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 7, lineHeight: 18 },
  divider:   { height: 1, backgroundColor: '#444', marginBottom: 16 },
  copyright: { color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center' },
});