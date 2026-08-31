import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  getConfigLibreria, updateConfigLibreria, uploadTiendaImage,
  getLibreria, updateMiTienda, getApiBaseUrl,
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import { IconSettings } from '../components/Icons';

// ── Paleta ────────────────────────────────────────────────────────────────────
const PRIMARY = '#7A1E3A';
const WHITE   = '#FFFFFF';
const BG      = '#FAF8F5';
const BORDER  = '#E0DBD4';
const TEXT    = '#2A2A2A';
const MUTED   = '#777';

// ── Helpers ───────────────────────────────────────────────────────────────────
const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${getApiBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ── Componente de campo ───────────────────────────────────────────────────────
function Campo({ label, hint, children }) {
  return (
    <View style={s.campo}>
      <Text style={s.campoLabel}>{label}</Text>
      {children}
      {hint ? <Text style={s.campoHint}>{hint}</Text> : null}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ConfiguracionTienda({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(''); // mensaje inline éxito/error

  // Datos de tienda básica (nombre, teléfono, dirección)
  const [tiendaForm, setTiendaForm] = useState({
    nombre_tienda: '',
    telefono:      '',
    direccion:     '',
  });

  // Configuración avanzada
  const [config, setConfig] = useState({
    descripcion:           '',
    logo_url:              '',
    banner_url:            '',
    horario_atencion:      '',
    politica_devoluciones: '',
    politica_envios:       '',
    tiempo_despacho_dias:  '2',
    ciudad_origen:         '',
    email_publico:         '',
  });

  const showMsg = (texto) => {
    setMsg(texto);
    setTimeout(() => setMsg(''), 3500);
  };

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const [resTienda, resConfig] = await Promise.all([
          getLibreria().catch(() => ({ data: {} })),
          getConfigLibreria().catch(() => ({ data: {} })),
        ]);
        if (resTienda.data) {
          setTiendaForm({
            nombre_tienda: resTienda.data.nombre_tienda || '',
            telefono:      resTienda.data.telefono      || '',
            direccion:     resTienda.data.direccion     || '',
          });
        }
        if (resConfig.data) {
          setConfig({
            descripcion:           resConfig.data.descripcion           || '',
            logo_url:              resConfig.data.logo_url              || '',
            banner_url:            resConfig.data.banner_url            || '',
            horario_atencion:      resConfig.data.horario_atencion      || '',
            politica_devoluciones: resConfig.data.politica_devoluciones || '',
            politica_envios:       resConfig.data.politica_envios       || '',
            tiempo_despacho_dias:  String(resConfig.data.tiempo_despacho_dias || 2),
            ciudad_origen:         resConfig.data.ciudad_origen         || '',
            email_publico:         resConfig.data.email_publico         || '',
          });
        }
      } catch (e) {
        showMsg('Error al cargar la configuración.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // ── Subir imagen ─────────────────────────────────────────────────────────
  const handlePickImage = async (tipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showMsg('Se necesita acceso a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: tipo === 'banner' ? [16, 9] : [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      await subirImagen(result.assets[0].uri, tipo);
    }
  };

  const subirImagen = async (uri, tipo) => {
    setLoading(true);
    try {
      const ext = uri.split('.').pop() || 'jpg';
      const formData = new FormData();
      formData.append('file', { uri, name: `imagen.${ext}`, type: `image/${ext}` });
      formData.append('tipo', tipo);
      const res = await uploadTiendaImage(formData);
      if (res.data?.url) {
        setConfig(prev => ({
          ...prev,
          [tipo === 'logo' ? 'logo_url' : 'banner_url']: res.data.url,
        }));
        showMsg(`✓ ${tipo === 'logo' ? 'Logo' : 'Banner'} actualizado.`);
      }
    } catch {
      showMsg('Error al subir la imagen.');
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!tiendaForm.nombre_tienda.trim()) {
      showMsg('El nombre de la tienda es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        updateMiTienda(tiendaForm),
        updateConfigLibreria({
          ...config,
          tiempo_despacho_dias: parseInt(config.tiempo_despacho_dias) || 2,
        }),
      ]);
      showMsg('✓ Configuración guardada correctamente.');
    } catch {
      showMsg('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading inicial ───────────────────────────────────────────────────────
  if (loading && !config.descripcion && !tiendaForm.nombre_tienda) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={() => setSidebarVisible(true)} activeOpacity={0.7}>
            <Text style={s.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Configuración de tienda</Text>
        </View>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={WHITE} />
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>Cargando configuración…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => setSidebarVisible(true)} activeOpacity={0.7}>
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Configuración de tienda</Text>
          <Text style={s.headerSub}>Actualiza los datos de tu tienda en BookyHome</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Welcome card ── */}
          <View style={s.welcomeCard}>
            <View style={s.welcomeIconRow}>
              <IconSettings size={22} color={PRIMARY} />
              <Text style={s.welcomeTitle}>Configuración de tienda</Text>
            </View>
            <Text style={s.welcomeSub}>Actualiza los datos de tu tienda en BookyHome</Text>
          </View>

          {/* ── Imágenes: Banner + Logo ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Imágenes de la tienda</Text>

            {/* Banner */}
            <Text style={s.fieldLabel}>Banner de la tienda</Text>
            <TouchableOpacity style={s.bannerBox} onPress={() => handlePickImage('banner')} activeOpacity={0.8}>
              {config.banner_url ? (
                <Image source={{ uri: resolveUrl(config.banner_url) }} style={s.bannerImg} />
              ) : (
                <View style={s.bannerPlaceholder}>
                  <Text style={s.uploadIcon}>🖼️</Text>
                  <Text style={s.uploadText}>Toca para subir el banner (16:9)</Text>
                </View>
              )}
              <View style={s.editOverlay}>
                <Text style={s.editOverlayText}>✏️ Cambiar</Text>
              </View>
            </TouchableOpacity>

            {/* Logo */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Logo de la tienda</Text>
            <View style={s.logoRow}>
              <TouchableOpacity style={s.logoBox} onPress={() => handlePickImage('logo')} activeOpacity={0.8}>
                {config.logo_url ? (
                  <Image source={{ uri: resolveUrl(config.logo_url) }} style={s.logoImg} />
                ) : (
                  <View style={s.logoPlaceholder}>
                    <Text style={{ fontSize: 28 }}>🏪</Text>
                  </View>
                )}
                <View style={s.logoBadge}>
                  <Text style={{ color: WHITE, fontSize: 11, fontWeight: '700' }}>Cambiar</Text>
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.fieldHint}>El logo aparece en tu perfil público y en el panel de vendedor.</Text>
                <Text style={[s.fieldHint, { marginTop: 4 }]}>Tamaño recomendado: 200×200 px</Text>
              </View>
            </View>
          </View>

          {/* ── Información básica de la tienda (nombre, teléfono, dirección) ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Información básica</Text>

            <Campo label="Nombre de la tienda *">
              <TextInput
                style={[s.input, !tiendaForm.nombre_tienda.trim() && saving && s.inputError]}
                value={tiendaForm.nombre_tienda}
                onChangeText={v => setTiendaForm(p => ({ ...p, nombre_tienda: v }))}
                placeholder="Ej: Librería El Sótano"
                placeholderTextColor={MUTED}
              />
            </Campo>

            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Campo label="Teléfono">
                  <TextInput
                    style={s.input}
                    value={tiendaForm.telefono}
                    onChangeText={v => setTiendaForm(p => ({ ...p, telefono: v }))}
                    placeholder="Teléfono de contacto"
                    placeholderTextColor={MUTED}
                    keyboardType="phone-pad"
                  />
                </Campo>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Campo label="Ciudad de origen">
                  <TextInput
                    style={s.input}
                    value={config.ciudad_origen}
                    onChangeText={v => setConfig(p => ({ ...p, ciudad_origen: v }))}
                    placeholder="Ciudad"
                    placeholderTextColor={MUTED}
                  />
                </Campo>
              </View>
            </View>

            <Campo label="Dirección">
              <TextInput
                style={s.input}
                value={tiendaForm.direccion}
                onChangeText={v => setTiendaForm(p => ({ ...p, direccion: v }))}
                placeholder="Dirección de la tienda"
                placeholderTextColor={MUTED}
              />
            </Campo>
          </View>

          {/* ── Información pública ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Información pública</Text>

            <Campo label="Descripción de la tienda">
              <TextInput
                style={[s.input, s.textArea]}
                value={config.descripcion}
                onChangeText={v => setConfig(p => ({ ...p, descripcion: v }))}
                placeholder="Descripción breve de tu tienda…"
                placeholderTextColor={MUTED}
                multiline
                textAlignVertical="top"
              />
            </Campo>

            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Campo label="Email público (contacto)">
                  <TextInput
                    style={s.input}
                    value={config.email_publico}
                    onChangeText={v => setConfig(p => ({ ...p, email_publico: v }))}
                    placeholder="email@tienda.com"
                    placeholderTextColor={MUTED}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Campo>
              </View>
            </View>

            <Campo label="Horario de atención">
              <TextInput
                style={s.input}
                value={config.horario_atencion}
                onChangeText={v => setConfig(p => ({ ...p, horario_atencion: v }))}
                placeholder="Ej: Lun–Vie 9am – 6pm"
                placeholderTextColor={MUTED}
              />
            </Campo>
          </View>

          {/* ── Políticas y logística ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Políticas y logística</Text>

            <Campo label="Días promedio de despacho">
              <TextInput
                style={s.input}
                value={String(config.tiempo_despacho_dias)}
                onChangeText={v => setConfig(p => ({ ...p, tiempo_despacho_dias: v }))}
                keyboardType="numeric"
                placeholder="2"
                placeholderTextColor={MUTED}
              />
            </Campo>

            <Campo label="Política de envíos">
              <TextInput
                style={[s.input, s.textArea]}
                value={config.politica_envios}
                onChangeText={v => setConfig(p => ({ ...p, politica_envios: v }))}
                placeholder="Costos, transportadoras, tiempos estimados…"
                placeholderTextColor={MUTED}
                multiline
                textAlignVertical="top"
              />
            </Campo>

            <Campo label="Política de devoluciones">
              <TextInput
                style={[s.input, s.textArea]}
                value={config.politica_devoluciones}
                onChangeText={v => setConfig(p => ({ ...p, politica_devoluciones: v }))}
                placeholder="Condiciones para devoluciones y garantías…"
                placeholderTextColor={MUTED}
                multiline
                textAlignVertical="top"
              />
            </Campo>
          </View>

          {/* ── Guardar + mensaje inline ── */}
          <TouchableOpacity
            style={[s.saveBtn, (saving || loading) && s.saveBtnDis]}
            onPress={handleSave}
            disabled={saving || loading}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color={WHITE} size="small" />
              : <Text style={s.saveBtnText}>Guardar cambios</Text>
            }
          </TouchableOpacity>

          {/* Mensaje inline (igual que la web) */}
          {!!msg && (
            <View style={[s.msgInline, msg.startsWith('✓') ? s.msgOk : s.msgErr]}>
              <Text style={[s.msgText, { color: msg.startsWith('✓') ? '#166534' : '#991B1B' }]}>
                {msg}
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <SidebarVendedor
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        navigation={navigation}
        onSignOut={signOut}
      />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: PRIMARY },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14 },
  menuBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  menuIcon:   { color: WHITE, fontSize: 20, fontWeight: '700' },
  headerTitle:{ color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },

  // Scroll
  scroll:        { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Welcome card
  welcomeCard:    { backgroundColor: WHITE, borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: BORDER, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 } }) },
  welcomeIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  welcomeTitle:   { fontSize: 18, fontWeight: '800', color: PRIMARY },
  welcomeSub:     { fontSize: 13, color: MUTED },

  // Card genérica
  card:      { backgroundColor: WHITE, borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: BORDER, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 } }) },
  cardTitle: { fontSize: 16, fontWeight: '800', color: PRIMARY, marginBottom: 16 },

  // Campos
  campo:      { marginBottom: 14 },
  campoLabel: { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 6 },
  campoHint:  { fontSize: 11, color: MUTED, marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
  fieldHint:  { fontSize: 12, color: MUTED, lineHeight: 18 },

  input: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14, color: TEXT, backgroundColor: '#FAFAF9',
  },
  inputError: { borderColor: '#DC2626' },
  textArea:   { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  row2:       { flexDirection: 'row' },

  // Banner
  bannerBox:         { height: 130, borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F0EBE5', position: 'relative' },
  bannerImg:         { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  uploadIcon:        { fontSize: 28 },
  uploadText:        { fontSize: 13, color: MUTED, fontWeight: '600', textAlign: 'center' },
  editOverlay:       { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  editOverlayText:   { color: WHITE, fontSize: 12, fontWeight: '700' },

  // Logo
  logoRow:         { flexDirection: 'row', alignItems: 'center' },
  logoBox:         { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 3, borderColor: PRIMARY, backgroundColor: '#E0DBD4', position: 'relative' },
  logoImg:         { width: '100%', height: '100%', resizeMode: 'cover' },
  logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoBadge:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(122,30,58,0.8)', paddingVertical: 3, alignItems: 'center' },

  // Guardar
  saveBtn:    { backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 8, ...Platform.select({ ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 4 } }) },
  saveBtnDis: { opacity: 0.65 },
  saveBtnText:{ color: WHITE, fontSize: 15, fontWeight: '800' },

  // Mensaje inline
  msgInline: { borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1 },
  msgOk:     { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  msgErr:    { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  msgText:   { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
