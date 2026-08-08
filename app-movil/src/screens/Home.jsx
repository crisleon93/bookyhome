// src/screens/Home.jsx
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, ImageBackground, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polygon, Polyline } from 'react-native-svg';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { IconShield, IconTruck, IconBook } from '../components/Icons';

const { width } = Dimensions.get('window');

const VINOTINTO  = '#7A1E3A';
const VINOTINTO2 = '#4B1E2F';
const BEIGE      = '#F0E8DB';
const WHITE      = '#FFFFFF';
const DARK       = '#2A2A2A';
const GRAY       = '#666';

import { LinearGradient } from 'expo-linear-gradient';

const CATEGORIES = [
  { label: 'Ficción',    img: require('../assets/ficcion.png') },
  { label: 'Romance',    img: require('../assets/romance.png') },
  { label: 'Historia',   img: require('../assets/historia.png') },
  { label: 'Ciencia',    img: require('../assets/ciencia.png') },
  { label: 'Poesía',     img: require('../assets/poesia.png') },
  { label: 'Filosofía',  img: require('../assets/filosofia.png') },
  { label: 'Arte',       img: require('../assets/arte.png') },
  { label: 'Biografía',  img: require('../assets/biografia.png') },
  { label: 'Infantil',   img: require('../assets/infantil.png') },
  { label: 'Tecnología', img: require('../assets/tecnologia.png') },
];

const FEATURES = [
  { Icon: IconShield, title: 'Compra Protegida',     desc: 'Tu dinero está seguro. Recibe el producto que esperabas o te devolvemos tu dinero. Sistema de protección integral.' },
  { Icon: IconTruck,  title: 'Envío a Todo el País', desc: 'Envío gratis en compras mayores a $30.000. Seguimiento en tiempo real y entrega garantizada.' },
  { Icon: IconBook,   title: 'Amplio Catálogo',      desc: 'Desde clásicos hasta novedades. Encuentra libros nuevos, usados y de colección de múltiples librerías.' },
];

const STEPS = [
  { num: '1', title: 'Regístrate gratis', desc: 'Crea tu cuenta en minutos y accede a miles de libros de librerías verificadas.',                                      color: VINOTINTO  },
  { num: '2', title: 'Busca y compara',   desc: 'Encuentra tu libro ideal comparando precios, condiciones y reseñas de diferentes vendedores.',                        color: '#C5425A'  },
  { num: '3', title: 'Compra seguro',     desc: 'Paga de forma segura y recibe tu libro en la puerta de tu casa con envío protegido.',                                 color: VINOTINTO  },
];

// ── Stat icons: mismos SVG paths que el sitio web ──────────────────────────

const IconLibro = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2ZM12 6v12M8 10h4M8 14h3"/>
  </Svg>
);

const IconLibreria = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <Path d="M9 22V12h6v10"/>
  </Svg>
);

const IconUsuarios = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <Circle cx="9" cy="7" r="4"/>
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>
);

const IconEstrella = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </Svg>
);

const STATS = [
  { val: '+10,000', lbl: 'Libros disponibles',   Icon: IconLibro,    iconBg: VINOTINTO },
  { val: '+150',    lbl: 'Librerías asociadas',   Icon: IconLibreria, iconBg: '#C5425A' },
  { val: '+50,000', lbl: 'Usuarios activos',      Icon: IconUsuarios, iconBg: VINOTINTO },
  { val: '4.8',     lbl: 'Calificación promedio', Icon: IconEstrella, iconBg: '#C5425A' },
];

const HERO_IMAGE = {
  uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
};

const CARD_W = (width - 48) / 2;

export default function Home({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <Header variant="public" navigation={navigation} showTopBar={true} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO ── */}
        <LinearGradient colors={[VINOTINTO, DARK]} style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>El marketplace que conecta lectores con librerías</Text>
              <Text style={styles.heroSub}>
                Miles de títulos de las mejores librerías independientes del país. Todo en un solo lugar.
              </Text>
              <View style={styles.heroButtons}>
                <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
                  <Text style={styles.heroBtnPrimaryText}>Comenzar a comprar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroBtnSecondary} onPress={() => navigation.navigate('RegisterLibrary')} activeOpacity={0.85}>
                  <Text style={styles.heroBtnSecondaryText}>Vender libros</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.heroImageWrap}>
              <Image source={HERO_IMAGE} style={styles.heroImage} />
            </View>
          </View>
        </LinearGradient>

        {/* ── STATS ── */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {STATS.map((s, i) => (
              <View key={i} style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: s.iconBg }]}>
                  <s.Icon />
                </View>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── POR QUÉ BOOKYHOME ── */}
        <View style={[styles.section, { backgroundColor: BEIGE }]}>
          <Text style={styles.sectionTitle}>¿Por qué elegir BookyHome?</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <f.Icon size={22} color={VINOTINTO} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── CATEGORÍAS ── */}
        <View style={[styles.section, { backgroundColor: WHITE }]}>
          <Text style={styles.sectionTitle}>Explora nuestras categorías</Text>
          <Text style={styles.sectionSub}>Libros para todos los gustos y momentos</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={styles.catCard}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <ImageBackground
                  source={cat.img}
                  style={styles.catCardBg}
                  imageStyle={styles.catCardImg}
                  resizeMode="cover"
                >
                  <View style={styles.catOverlay} />
                  <Text style={styles.catLabel}>{cat.label}</Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.catalogBtn}
            onPress={() => navigation.navigate('Login')} 
            activeOpacity={0.85}
          >
            <Text style={styles.catalogBtnText}>Ver catálogo completo</Text>
          </TouchableOpacity>
        </View>

        {/* ── CÓMO FUNCIONA ── */}
        <View style={[styles.section, { backgroundColor: BEIGE }]}>
          <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
          <View style={styles.stepsRow}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={[styles.stepNumWrap, { backgroundColor: s.color }]}>
                  <Text style={styles.stepNum}>{s.num}</Text>
                </View>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── LIBRERÍA CTA ── */}
        <LinearGradient colors={[VINOTINTO, VINOTINTO2]} style={styles.libCta}>
          <Text style={styles.libCtaTitle}>¿Tienes una librería?</Text>
          <Text style={styles.libCtaSub}>
            Únete a nuestra red de librerías y alcanza a miles de lectores en todo el país.
          </Text>
          <TouchableOpacity style={styles.libCtaBtn} onPress={() => navigation.navigate('RegisterLibrary')} activeOpacity={0.85}>
            <Text style={styles.libCtaBtnText}>Registrar mi librería</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Footer onLinkPress={(link) => console.log('Footer link:', link)} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: VINOTINTO },

  /* Hero */
  hero: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
  heroInner: { gap: 18 },
  heroText: { flex: 1 },
  heroTitle: { color: WHITE, fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: 12 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  heroButtons: { flexDirection: 'column', gap: 12 },
  heroBtnPrimary: { backgroundColor: WHITE, borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  heroBtnPrimaryText: { color: VINOTINTO, fontWeight: '800', fontSize: 15 },
  heroBtnSecondary: { borderWidth: 2, borderColor: WHITE, borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  heroBtnSecondaryText: { color: WHITE, fontWeight: '700', fontSize: 15 },
  heroImageWrap: { borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)' },
  heroImage: { width: '100%', height: 180, resizeMode: 'cover' },

  /* Stats */
  statsSection: {
    backgroundColor: WHITE,
    paddingVertical: 24, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0EBE5',
  },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 16 },
  statItem:       { alignItems: 'center', width: '42%', marginVertical: 12 },
  statIconCircle: { width: 65, height: 65, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statEmoji:      { fontSize: 26 },
  statVal:        { fontSize: 24, fontWeight: '800', color: DARK },
  statLbl:        { fontSize: 13, color: GRAY, marginTop: 4, textAlign: 'center', fontWeight: '500' },

  /* Sections */
  section:      { paddingHorizontal: 16, paddingVertical: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: DARK, textAlign: 'center', marginBottom: 8 },
  sectionSub:   { fontSize: 14, color: GRAY, textAlign: 'center', marginBottom: 24 },

  /* Features */
  featureCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: WHITE, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  featureIconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FCE8EC', justifyContent: 'center', alignItems: 'center' },
  featureTitle:    { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 4 },
  featureDesc:     { fontSize: 12, color: GRAY, lineHeight: 18 },

  /* Categories */
  catGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  catCard:    { width: CARD_W, height: 86, borderRadius: 12, overflow: 'hidden' },
  catCardBg:  { width: '100%', height: '100%', justifyContent: 'flex-end' },
  catCardImg: { borderRadius: 12 },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 12 },
  catLabel:   { color: WHITE, fontWeight: '700', fontSize: 13, padding: 10 },
  catalogBtn: { backgroundColor: VINOTINTO, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 6, alignItems: 'center', alignSelf: 'center', marginTop: 12, marginBottom: 8, width: '100%' },
  catalogBtnText: { color: WHITE, fontWeight: '800', fontSize: 15 },

  /* Steps */
  stepsRow:    { flexDirection: 'row', gap: 12, marginTop: 10 },
  stepItem:    { flex: 1, alignItems: 'center' },
  stepNumWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  stepNum:     { color: WHITE, fontSize: 20, fontWeight: '800' },
  stepTitle:   { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 6, textAlign: 'center' },
  stepDesc:    { fontSize: 11, color: GRAY, lineHeight: 17, textAlign: 'center' },

  /* Librería CTA */
  libCta:        { paddingHorizontal: 24, paddingVertical: 36, alignItems: 'center' },
  libCtaTitle:   { color: WHITE, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  libCtaSub:     { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  libCtaBtn:     { backgroundColor: WHITE, borderRadius: 6, paddingHorizontal: 28, paddingVertical: 14 },
  libCtaBtnText: { color: VINOTINTO, fontWeight: '800', fontSize: 15 },
});