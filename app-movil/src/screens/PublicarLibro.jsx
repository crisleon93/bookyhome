import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getCategorias, publicarLibro, updateLibro, updateStockLibro, crearVariante } from '../services/api';
import BarcodeScanner from '../components/BarcodeScanner';
import { IconCamera } from '../components/Icons';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';

const PRIMARY = '#7A1E3A';
const WHITE   = '#FFFFFF';
const BG      = '#F5F3EF';
const BORDER  = '#E5E0D8';
const TEXT    = '#1A1A1A';
const MUTED   = '#8A8A8A';

const ESTADOS = [
  { value: 'nuevo',             label: 'Nuevo',               desc: 'Sin uso, en perfectas condiciones' },
  { value: 'usado_buen_estado', label: 'Usado — buen estado', desc: 'Usado pero bien conservado' },
  { value: 'usado_regular',     label: 'Usado — estado regular', desc: 'Visible desgaste, funcional' },
];
const TIPOS    = ['Tapa Blanda', 'Tapa Dura', 'Digital'];
const IDIOMAS  = ['Español', 'Inglés', 'Otro'];

const CAT_ICONS = {
  'arte': '🎨', 'aventura': '🗺️', 'biografia': '👤', 'biografía': '👤',
  'ciencia': '🔬', 'comedia': '😄', 'educacion': '🎓', 'educación': '🎓',
  'fantasia': '🧙', 'fantasía': '🧙', 'ficcion': '🔮', 'ficción': '🔮',
  'ficcion cientifica': '🚀', 'ficción científica': '🚀',
  'historia': '🏛️', 'infantil': '🧸', 'ingenieria': '⚙️', 'ingeniería': '⚙️',
  'juvenil': '✨', 'romance': '💕', 'tecnologia': '💻', 'tecnología': '💻',
  'terror': '👻', 'poesia': '📜', 'poesía': '📜', 'filosofia': '🧠', 'filosofía': '🧠',
};
const parseError = (err) => {
  const detail = err?.response?.data?.detail;
  if (!detail) return 'Ocurrió un error inesperado.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join(', ');
  return JSON.stringify(detail);
};

const getCatIcon = (nombre) => CAT_ICONS[nombre?.toLowerCase().trim()] ?? '📖';

export default function PublicarLibro({ navigation, route }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const libro = route?.params?.libro ?? null;
  const modo  = route?.params?.modo  ?? 'nuevo';

  const [form, setForm] = useState({
    titulo:       libro?.titulo            ?? '',
    autor:        libro?.autor_libro       ?? '',
    isbn:         libro?.isbn              ?? '',
    precio:       libro?.precio_libro  != null ? String(libro.precio_libro)  : '',
    stock:        libro?.stock         != null ? String(libro.stock)         : '',
    id_categoria: libro?.id_categoria  != null ? String(libro.id_categoria)  : '',
    estado:       libro?.estado_libro      ?? '',
    descripcion:  libro?.descripcion_libro ?? '',
  });

  const [categorias,           setCategorias]           = useState([]);
  const [imagenes,             setImagenes]             = useState([]);
  const [variantes,            setVariantes]            = useState([]);
  const [cargando,             setCargando]             = useState(false);
  const [loadingCats,          setLoadingCats]          = useState(true);
  const [errores,              setErrores]              = useState({});
  const [barcodeVisible,       setBarcodeVisible]       = useState(false);
  const [catModalVisible,      setCatModalVisible]      = useState(false);
  const [varModalVisible,      setVarModalVisible]      = useState(false);
  const [varForm,              setVarForm]              = useState({
    tipo_tapa: 'Tapa Blanda', idioma: 'Español',
    edicion: '1ra Edición', precio_variante: '', stock_variante: '',
  });

  useEffect(() => {
    if (modo === 'stock') { setLoadingCats(false); return; }
    getCategorias().then(r => setCategorias(r.data || [])).catch(() => {}).finally(() => setLoadingCats(false));
  }, [modo]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  /* ── validaciones ── */
  const validarCompleto = () => {
    const e = {};
    if (!form.titulo.trim())  e.titulo = 'El título es obligatorio';
    if (!form.autor.trim())   e.autor  = 'El autor es obligatorio';
    if (!form.precio || isNaN(form.precio) || parseFloat(form.precio) <= 0)
      e.precio = 'Ingresa un precio válido';
    if (!form.id_categoria)   e.id_categoria = 'Selecciona una categoría';
    if (!form.estado)         e.estado = 'Selecciona el estado del libro';
    if (form.stock === '' || isNaN(form.stock) || parseInt(form.stock) < 0)
      e.stock = 'Ingresa un stock válido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const validarStock = () => {
    const e = {};
    if (form.stock === '' || isNaN(form.stock) || parseInt(form.stock) < 0)
      e.stock = 'Ingresa un stock válido (mínimo 0)';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  /* ── imagen ── */
  const handleAgregarImagen = async () => {
    if (imagenes.length >= 4) return;
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Images, quality: 0.8 });
    if (!result.canceled) setImagenes(prev => [...prev, result.assets[0].uri]);
  };

  /* ── acciones ── */
  const handlePublicar = async () => {
    if (!validarCompleto()) return;
    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('titulo',            form.titulo);
      formData.append('autor_libro',       form.autor);
      formData.append('isbn',              form.isbn || '');
      formData.append('precio_libro',      form.precio);
      formData.append('stock',             form.stock);
      formData.append('id_categoria',      form.id_categoria);
      formData.append('estado_libro',      form.estado);
      formData.append('descripcion_libro', form.descripcion || '');
      imagenes.forEach((uri, i) => formData.append('imagenes', { uri, name: `img_${i}.jpg`, type: 'image/jpeg' }));
      const res = await publicarLibro(formData);
      const id_libro = res?.data?.id_libro;
      if (id_libro && variantes.length > 0) {
        await Promise.all(variantes.map(v => crearVariante(id_libro, v).catch(() => {})));
      }
      navigation.goBack();
    } catch (err) {
      setErrores({ general: parseError(err) });
    } finally {
      setCargando(false);
    }
  };

  const handleEditar = async () => {
    if (!validarCompleto()) return;
    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('titulo',            form.titulo);
      formData.append('autor_libro',       form.autor);
      formData.append('isbn',              form.isbn || '');
      formData.append('precio_libro',      form.precio);
      formData.append('stock',             form.stock);
      formData.append('id_categoria',      form.id_categoria);
      formData.append('estado_libro',      form.estado);
      formData.append('descripcion_libro', form.descripcion);
      await updateLibro(libro.id_libro, formData);
      navigation.goBack();
    } catch (err) {
      setErrores({ general: parseError(err) });
    } finally {
      setCargando(false);
    }
  };

  const handleActualizarStock = async () => {
    if (!validarStock()) return;
    setCargando(true);
    try {
      await updateStockLibro(libro.id_libro, parseInt(form.stock));
      navigation.goBack();
    } catch (err) {
      setErrores({ general: parseError(err) });
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = modo === 'editar' ? handleEditar
                      : modo === 'stock'  ? handleActualizarStock
                      : handlePublicar;

  const titulo_pagina = modo === 'editar' ? 'Editar libro'
                      : modo === 'stock'  ? 'Actualizar stock'
                      : 'Publicar libro';

  const HeaderBar = () => (
    <View style={s.headerBar}>
      <TouchableOpacity onPress={() => setSidebarVisible(true)} style={s.backBtn}>
        <Text style={s.menuIconText}>☰</Text>
      </TouchableOpacity>
      <Text style={s.pageTitle}>{titulo_pagina}</Text>
    </View>
  );

  /* ── loading cats ── */
  if (loadingCats) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY }}>
        <HeaderBar />
        <View style={s.center}><ActivityIndicator size="large" color={PRIMARY} /></View>
      </SafeAreaView>
    );
  }

  /* ════════════════════════════════
     MODO STOCK
  ════════════════════════════════ */
  if (modo === 'stock') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY }}>
        <HeaderBar />
        <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={s.card}>
            <Text style={s.libroNombre} numberOfLines={2}>{libro?.titulo}</Text>
            <Text style={s.libroAutor}>{libro?.autor_libro}</Text>
            <View style={s.stockRow}>
              <View style={s.stockBox}>
                <Text style={s.stockBoxLabel}>Stock actual</Text>
                <Text style={s.stockBoxVal}>{libro?.stock ?? 0}</Text>
                <Text style={s.stockBoxUnit}>unidades</Text>
              </View>
              <Text style={s.stockArrow}>→</Text>
              <View style={[s.stockBox, { backgroundColor: '#FDF0F3', borderColor: '#EAC8D2' }]}>
                <Text style={s.stockBoxLabel}>Nuevo stock</Text>
                <TextInput
                  style={s.stockInput}
                  placeholder="0"
                  placeholderTextColor={MUTED}
                  value={form.stock}
                  onChangeText={v => set('stock', v)}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <Text style={s.stockBoxUnit}>unidades</Text>
              </View>
            </View>
            {errores.stock   && <Text style={s.errorText}>{errores.stock}</Text>}
            {errores.general && <Text style={s.errorText}>{errores.general}</Text>}
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleGuardar} disabled={cargando} activeOpacity={0.85}>
            {cargando ? <ActivityIndicator color={WHITE} /> : <Text style={s.submitBtnText}>📦 Guardar stock</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ════════════════════════════════
     MODO NUEVO / EDITAR
  ════════════════════════════════ */
  const catSeleccionada = categorias.find(c => String(c.id_categoria) === form.id_categoria);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY }}>
      <HeaderBar />
      <ScrollView style={s.container} contentContainerStyle={{ padding: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {errores.general && (
          <View style={s.errorBanner}><Text style={s.errorBannerText}>⚠️ {errores.general}</Text></View>
        )}

        {/* ── Imágenes (solo nuevo) ── */}
        {modo === 'nuevo' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Imágenes del libro</Text>
            <Text style={s.cardSubtitle}>Agrega hasta 4 fotos de la portada</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {imagenes.map((uri, i) => (
                <View key={i} style={s.imgWrap}>
                  <Image source={{ uri }} style={s.imgThumb} />
                  <TouchableOpacity style={s.imgRemove} onPress={() => setImagenes(p => p.filter((_, idx) => idx !== i))}>
                    <Text style={{ color: WHITE, fontSize: 11, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {imagenes.length < 4 && (
                <TouchableOpacity style={s.imgAdd} onPress={handleAgregarImagen} activeOpacity={0.7}>
                  <Text style={{ fontSize: 30, color: PRIMARY }}>+</Text>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Agregar</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* ── Información básica ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Información del libro</Text>

          <Field label="Título *" error={errores.titulo}>
            <TextInput style={[s.input, errores.titulo && s.inputError]}
              placeholder="Título del libro" value={form.titulo} onChangeText={v => set('titulo', v)} />
          </Field>

          <Field label="Autor *" error={errores.autor}>
            <TextInput style={[s.input, errores.autor && s.inputError]}
              placeholder="Nombre del autor" value={form.autor} onChangeText={v => set('autor', v)} />
          </Field>



          <Field label="ISBN (opcional)">
            <View style={s.isbnRow}>
              <TextInput style={[s.input, { flex: 1 }]}
                placeholder="Escanea o ingresa el ISBN" value={form.isbn} onChangeText={v => set('isbn', v)} />
              <TouchableOpacity style={s.scanBtn} onPress={() => setBarcodeVisible(true)} activeOpacity={0.8}>
                <IconCamera size={20} color={PRIMARY} />
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="Descripción (opcional)">
            <TextInput style={[s.input, s.inputMulti]}
              placeholder="Describe brevemente el libro…" value={form.descripcion}
              onChangeText={v => set('descripcion', v)} multiline />
          </Field>
        </View>

        {/* ── Precio y disponibilidad ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Precio y disponibilidad</Text>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Precio (COP) *</Text>
              <View style={s.precioInputWrap}>
                <Text style={s.precioPrefix}>$</Text>
                <TextInput
                  style={[s.precioInput, errores.precio && s.inputError]}
                  placeholder="25000"
                  value={form.precio}
                  onChangeText={v => set('precio', v)}
                  keyboardType="numeric"
                />
              </View>
              {errores.precio
                ? <Text style={s.errorText}>{errores.precio}</Text>
                : <Text style={s.fieldHint}>Precio en pesos que verá el comprador.</Text>
              }
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Unidades disponibles *</Text>
              <TextInput
                style={[s.input, errores.stock && s.inputError]}
                placeholder="1"
                value={form.stock}
                onChangeText={v => set('stock', v)}
                keyboardType="numeric"
              />
              {errores.stock
                ? <Text style={s.errorText}>{errores.stock}</Text>
                : <Text style={s.fieldHint}>Cantidad que tienes lista para vender.</Text>
              }
            </View>
          </View>
        </View>

        {/* ── Categoría ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Categoría *</Text>
          {errores.id_categoria && <Text style={s.errorText}>{errores.id_categoria}</Text>}
          <TouchableOpacity
            style={[s.selector, errores.id_categoria && s.inputError]}
            onPress={() => setCatModalVisible(true)}
            activeOpacity={0.75}
          >
            {catSeleccionada ? (
              <View style={s.selectorInner}>
                <Text style={{ fontSize: 18 }}>{getCatIcon(catSeleccionada.nombre_categoria)}</Text>
                <Text style={s.selectorText}>{catSeleccionada.nombre_categoria}</Text>
              </View>
            ) : (
              <Text style={s.selectorPlaceholder}>Selecciona una categoría…</Text>
            )}
            <Text style={s.selectorArrow}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* ── Estado ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Estado del libro *</Text>
          {errores.estado && <Text style={s.errorText}>{errores.estado}</Text>}
          <View style={s.estadoList}>
            {ESTADOS.map((est, i) => {
              const selected = form.estado === est.value;
              return (
                <TouchableOpacity
                  key={est.value}
                  style={[s.estadoCard, selected && s.estadoCardSelected, i < ESTADOS.length - 1 && s.estadoCardBorder]}
                  onPress={() => set('estado', est.value)}
                  activeOpacity={0.75}
                >
                  <View style={s.estadoRadio}>
                    {selected && <View style={s.estadoRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.estadoLabel, selected && s.estadoLabelSelected]}>{est.label}</Text>
                    <Text style={[s.estadoDesc, selected && s.estadoDescSelected]}>{est.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Formatos y variantes (solo nuevo) ── */}
        {modo === 'nuevo' && (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={s.cardTitle}>Formatos y variantes</Text>
              <Text style={s.optionalTag}>opcional</Text>
            </View>
            <Text style={s.cardSubtitle}>Tapa Blanda, Tapa Dura o Digital con precios distintos</Text>

            {variantes.map((v, i) => (
              <View key={i} style={s.varItem}>
                <View style={{ flex: 1 }}>
                  <Text style={s.varItemTitle}>{v.tipo_tapa} · {v.idioma}</Text>
                  <Text style={s.varItemSub}>{v.edicion} · Stock: {v.stock_variante}</Text>
                </View>
                <Text style={s.varItemPrice}>${Number(v.precio_variante).toLocaleString('es-CO')}</Text>
                <TouchableOpacity onPress={() => setVariantes(prev => prev.filter((_, idx) => idx !== i))} style={{ padding: 6 }}>
                  <Text style={{ color: '#DC2626', fontSize: 15, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={s.varAddBtn} onPress={() => setVarModalVisible(true)} activeOpacity={0.8}>
              <Text style={s.varAddBtnText}>+ Agregar variante</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity style={s.submitBtn} onPress={handleGuardar} disabled={cargando} activeOpacity={0.85}>
          {cargando
            ? <ActivityIndicator color={WHITE} />
            : <Text style={s.submitBtnText}>{modo === 'editar' ? '💾 Guardar cambios' : '📚 Publicar libro'}</Text>
          }
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modal categoría ── */}
      <Modal visible={catModalVisible} transparent animationType="slide" onRequestClose={() => setCatModalVisible(false)}>
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setCatModalVisible(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Selecciona una categoría</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {categorias.map((c, i) => {
                const selected = form.id_categoria === String(c.id_categoria);
                return (
                  <TouchableOpacity
                    key={c.id_categoria}
                    style={[s.sheetOption, i < categorias.length - 1 && s.sheetOptionBorder, selected && s.sheetOptionSelected]}
                    onPress={() => { set('id_categoria', String(c.id_categoria)); setCatModalVisible(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={s.sheetOptionIcon}>{getCatIcon(c.nombre_categoria)}</Text>
                    <Text style={[s.sheetOptionText, selected && s.sheetOptionTextSelected]}>{c.nombre_categoria}</Text>
                    {selected && <Text style={{ color: PRIMARY, fontWeight: '800', fontSize: 16 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal variante ── */}
      <Modal visible={varModalVisible} transparent animationType="slide" onRequestClose={() => setVarModalVisible(false)}>
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setVarModalVisible(false)}>
          <TouchableOpacity activeOpacity={1}>
            <View style={[s.sheet, { paddingHorizontal: 20, paddingBottom: 36 }]}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Nueva variante</Text>

              <Text style={s.fieldLabel}>Tipo</Text>
              <View style={s.chipRow}>
                {TIPOS.map(t => (
                  <TouchableOpacity key={t}
                    style={[s.chip, varForm.tipo_tapa === t && s.chipSelected]}
                    onPress={() => setVarForm(p => ({ ...p, tipo_tapa: t }))}
                  >
                    <Text style={[s.chipText, varForm.tipo_tapa === t && s.chipTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.fieldLabel, { marginTop: 12 }]}>Idioma</Text>
              <View style={s.chipRow}>
                {IDIOMAS.map(t => (
                  <TouchableOpacity key={t}
                    style={[s.chip, varForm.idioma === t && s.chipSelected]}
                    onPress={() => setVarForm(p => ({ ...p, idioma: t }))}
                  >
                    <Text style={[s.chipText, varForm.idioma === t && s.chipTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[s.row2, { marginTop: 12, gap: 10 }]}>
                <Field label="Edición" style={{ flex: 1 }}>
                  <TextInput style={s.input} value={varForm.edicion}
                    onChangeText={v => setVarForm(p => ({ ...p, edicion: v }))} />
                </Field>
                <Field label="Precio COP" style={{ flex: 1 }}>
                  <TextInput style={s.input} value={varForm.precio_variante}
                    onChangeText={v => setVarForm(p => ({ ...p, precio_variante: v }))}
                    keyboardType="numeric" placeholder="0" />
                </Field>
              </View>

              <Field label="Stock">
                <TextInput style={s.input} value={varForm.stock_variante}
                  onChangeText={v => setVarForm(p => ({ ...p, stock_variante: v }))}
                  keyboardType="numeric" placeholder="1" />
              </Field>

              <TouchableOpacity
                style={[s.submitBtn, { marginTop: 4 }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!varForm.precio_variante || !varForm.stock_variante) return;
                  setVariantes(prev => [...prev, {
                    tipo_tapa:      varForm.tipo_tapa,
                    idioma:         varForm.idioma,
                    edicion:        varForm.edicion,
                    precio_variante: Number(varForm.precio_variante),
                    stock_variante:  Number(varForm.stock_variante),
                  }]);
                  setVarForm({ tipo_tapa: 'Tapa Blanda', idioma: 'Español', edicion: '1ra Edición', precio_variante: '', stock_variante: '' });
                  setVarModalVisible(false);
                }}
              >
                <Text style={s.submitBtnText}>Agregar variante</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Barcode ── */}
      <BarcodeScanner
        visible={barcodeVisible}
        onClose={() => setBarcodeVisible(false)}
        onBarcodeDetected={(isbn) => { setBarcodeVisible(false); set('isbn', isbn); }}
      />

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

function Field({ label, error, children, style }) {
  return (
    <View style={[{ marginBottom: 10 }, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },

  /* header */
  headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  backText:     { color: WHITE, fontSize: 28, lineHeight: 32, fontWeight: '300', marginTop: -2 },
  menuIconText: { color: WHITE, fontSize: 20, fontWeight: '700' },
  pageTitle: { fontSize: 18, fontWeight: '800', color: WHITE, flex: 1 },

  /* cards */
  card:         { backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardTitle:    { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  cardSubtitle: { fontSize: 11, color: MUTED, marginBottom: 2 },
  optionalTag:  { fontSize: 11, color: MUTED, fontStyle: 'italic' },

  /* imágenes */
  imgWrap:   { marginRight: 10, position: 'relative' },
  imgThumb:  { width: 80, height: 108, borderRadius: 10 },
  imgRemove: { position: 'absolute', top: 5, right: 5, backgroundColor: PRIMARY, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  imgAdd:    { width: 80, height: 108, borderRadius: 10, borderWidth: 2, borderColor: '#E0C8D0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF7F9' },

  /* fields */
  fieldLabel:  { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 },
  input:       { borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: TEXT, backgroundColor: '#FAFAF9' },
  inputError:  { borderColor: '#DC2626' },
  inputMulti:  { height: 80, textAlignVertical: 'top' },
  row2:        { flexDirection: 'row' },
  isbnRow:     { flexDirection: 'row', gap: 8 },
  scanBtn:     { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F0E8DB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4C4B0' },

  /* errores */
  errorText:       { color: '#DC2626', fontSize: 11, marginTop: 4, fontWeight: '600' },
  errorBanner:     { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#FECACA' },
  errorBannerText: { color: '#991B1B', fontSize: 13, fontWeight: '600' },

  /* precio input con prefijo $ */
  precioInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 10, backgroundColor: '#FAFAF9', overflow: 'hidden' },
  precioPrefix:    { paddingHorizontal: 10, fontSize: 15, color: MUTED, fontWeight: '700', borderRightWidth: 1, borderColor: BORDER, paddingVertical: 10 },
  precioInput:     { flex: 1, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14, color: TEXT },
  fieldHint:       { fontSize: 11, color: PRIMARY, marginTop: 4 },
  selector:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FAFAF9', marginTop: 8 },
  selectorInner:      { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  selectorText:       { fontSize: 14, fontWeight: '700', color: TEXT },
  selectorPlaceholder:{ fontSize: 14, color: MUTED, flex: 1 },
  selectorArrow:      { fontSize: 16, color: MUTED },

  /* estado libro — cards con descripción */
  estadoList:         { marginTop: 10, borderWidth: 1, borderColor: BORDER, borderRadius: 12, overflow: 'hidden' },
  estadoCard:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12, backgroundColor: WHITE },
  estadoCardSelected: { backgroundColor: '#FDF0F3' },
  estadoCardBorder:   { borderBottomWidth: 1, borderBottomColor: BORDER },
  estadoRadio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BORDER, justifyContent: 'center', alignItems: 'center' },
  estadoRadioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
  estadoLabel:        { fontSize: 14, fontWeight: '700', color: TEXT },
  estadoLabelSelected:{ color: PRIMARY },
  estadoDesc:         { fontSize: 12, color: MUTED, marginTop: 2 },
  estadoDescSelected: { color: PRIMARY, opacity: 0.75 },

  /* chips (modal variantes) */
  chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip:             { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER },
  chipSelected:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText:         { fontSize: 13, fontWeight: '600', color: MUTED },
  chipTextSelected: { color: WHITE, fontWeight: '800' },
  varItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: BORDER, gap: 8 },
  varItemTitle:  { fontSize: 13, fontWeight: '700', color: TEXT },
  varItemSub:    { fontSize: 11, color: MUTED, marginTop: 2 },
  varItemPrice:  { fontSize: 13, fontWeight: '800', color: PRIMARY },
  varAddBtn:     { marginTop: 12, borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 10, paddingVertical: 11, alignItems: 'center', borderStyle: 'dashed' },
  varAddBtnText: { fontSize: 14, fontWeight: '700', color: PRIMARY },

  /* stock mode */
  libroNombre:  { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 4 },
  libroAutor:   { fontSize: 13, color: MUTED, marginBottom: 20 },
  stockRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stockBox:     { flex: 1, backgroundColor: '#F8F6F3', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  stockBoxLabel:{ fontSize: 11, color: MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  stockBoxVal:  { fontSize: 32, fontWeight: '900', color: PRIMARY },
  stockBoxUnit: { fontSize: 11, color: MUTED, marginTop: 4 },
  stockArrow:   { paddingHorizontal: 10, fontSize: 20, color: MUTED },
  stockInput:   { fontSize: 32, fontWeight: '900', color: PRIMARY, width: '100%', paddingVertical: 0 },

  /* bottom sheet */
  sheetOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 32 },
  sheetHandle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 14 },
  sheetTitle:         { fontSize: 16, fontWeight: '800', color: TEXT, paddingHorizontal: 20, marginBottom: 8 },
  sheetOption:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  sheetOptionBorder:  { borderBottomWidth: 1, borderBottomColor: BORDER },
  sheetOptionSelected:{ backgroundColor: '#FDF0F3' },
  sheetOptionIcon:    { fontSize: 22, width: 30, textAlign: 'center' },
  sheetOptionText:    { fontSize: 14, color: TEXT, flex: 1, fontWeight: '500' },
  sheetOptionTextSelected: { color: PRIMARY, fontWeight: '700' },

  /* submit */
  submitBtn:     { backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4, elevation: 3, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  submitBtnText: { color: WHITE, fontWeight: '800', fontSize: 16 },
});
