import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createDireccion, deleteDireccion, getDirecciones, setPrincipalDireccion, updateDireccion } from '../services/api';

const emptyForm = { alias_direccion: '', direccion: '', ciudad: '', departamento: '', codigo_postal: '', es_principal: false };

export default function Direcciones() {
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDirecciones();
      setDirecciones(response.data || []);
    } catch (error) {
      Alert.alert('Direcciones', error.response?.data?.detail || 'No se pudieron cargar tus direcciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cancelar = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const guardar = async () => {
    if (!form.direccion.trim()) {
      Alert.alert('Dirección requerida', 'Ingresa la dirección de envío.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) await updateDireccion(editingId, form);
      else await createDireccion(form);
      cancelar();
      await cargar();
    } catch (error) {
      Alert.alert('No se pudo guardar', error.response?.data?.detail || 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const editar = (direccion) => {
    setEditingId(direccion.id_direccion);
    setShowForm(true);
    setForm({
      alias_direccion: direccion.alias_direccion || '', direccion: direccion.direccion || '', ciudad: direccion.ciudad || '',
      departamento: direccion.departamento || '', codigo_postal: direccion.codigo_postal || '', es_principal: Boolean(direccion.es_principal),
    });
  };

  const eliminar = (direccion) => Alert.alert('Eliminar dirección', `¿Eliminar “${direccion.alias_direccion || 'Dirección'}”?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
      try { await deleteDireccion(direccion.id_direccion); await cargar(); }
      catch (error) { Alert.alert('No se pudo eliminar', error.response?.data?.detail || 'Inténtalo nuevamente.'); }
    } },
  ]);

  const renderDireccion = ({ item }) => (
    <View style={[styles.card, item.es_principal && styles.cardMain]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.alias_direccion || 'Dirección'}</Text>
        {item.es_principal && <Text style={styles.mainBadge}>Principal</Text>}
      </View>
      <Text style={styles.cardText}>{item.direccion}</Text>
      <Text style={styles.cardText}>{[item.ciudad, item.departamento].filter(Boolean).join(', ')}</Text>
      {item.codigo_postal ? <Text style={styles.cardMuted}>CP: {item.codigo_postal}</Text> : null}
      <View style={styles.actions}>
        {!item.es_principal && <TouchableOpacity style={styles.mainBtn} onPress={() => setPrincipalDireccion(item.id_direccion).then(cargar)}><Text style={styles.mainBtnText}>Hacer principal</Text></TouchableOpacity>}
        <TouchableOpacity style={styles.editBtn} onPress={() => editar(item)}><Text style={styles.editBtnText}>Editar</Text></TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => eliminar(item)}><Text style={styles.deleteBtnText}>Eliminar</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={direcciones}
        keyExtractor={(item) => String(item.id_direccion)}
        renderItem={renderDireccion}
        refreshing={loading}
        onRefresh={cargar}
        ListHeaderComponent={<View style={styles.header}><Text style={styles.title}>Mis direcciones</Text><Text style={styles.subtitle}>Gestiona las direcciones que podrás elegir al pagar.</Text>{!showForm && <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}><Text style={styles.addBtnText}>+ Agregar dirección</Text></TouchableOpacity>}</View>}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No tienes direcciones guardadas.</Text> : null}
        ListFooterComponent={showForm ? <View style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? 'Editar dirección' : 'Agregar dirección'}</Text>
          {[['alias_direccion', 'Alias (ej. Casa, Oficina)'], ['direccion', 'Dirección'], ['ciudad', 'Ciudad'], ['departamento', 'Departamento'], ['codigo_postal', 'Código postal']].map(([field, label]) => <View key={field} style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={form[field]} onChangeText={(value) => setForm((current) => ({ ...current, [field]: value }))} /></View>)}
          <View style={styles.switchRow}><Text style={styles.label}>Marcar como dirección principal</Text><Switch value={form.es_principal} onValueChange={(value) => setForm((current) => ({ ...current, es_principal: value }))} trackColor={{ true: '#7A1E3A' }} /></View>
          <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={guardar} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{editingId ? 'Actualizar dirección' : 'Guardar dirección'}</Text>}</TouchableOpacity>
          {editingId && <TouchableOpacity style={styles.cancelBtn} onPress={cancelar}><Text style={styles.cancelText}>Cancelar edición</Text></TouchableOpacity>}
        </View> : null}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#7A1E3A' }, content: { padding: 16, paddingBottom: 36 }, header: { marginBottom: 16 }, title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' }, subtitle: { color: 'rgba(255,255,255,0.75)', marginTop: 5, lineHeight: 20 }, addBtn: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginTop: 16 }, addBtnText: { color: '#7A1E3A', fontWeight: '800' }, empty: { textAlign: 'center', color: '#FFFFFF', paddingVertical: 20 }, card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0DBD4', borderRadius: 12, padding: 15, marginBottom: 12 }, cardMain: { borderColor: '#7A1E3A', borderWidth: 2 }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, cardTitle: { fontWeight: '800', fontSize: 16, color: '#2A2A2A' }, mainBadge: { backgroundColor: '#7A1E3A', color: '#fff', fontSize: 11, fontWeight: '700', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 }, cardText: { color: '#555', marginBottom: 3 }, cardMuted: { color: '#888', fontSize: 12, marginTop: 2 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }, mainBtn: { backgroundColor: '#7A1E3A', padding: 9, borderRadius: 7 }, mainBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 }, editBtn: { backgroundColor: '#8B5A2B', padding: 9, borderRadius: 7 }, editBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 }, deleteBtn: { backgroundColor: '#DC2626', padding: 9, borderRadius: 7 }, deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 }, form: { borderTopWidth: 1, borderColor: '#E0DBD4', marginTop: 12, paddingTop: 22 }, formTitle: { fontSize: 19, fontWeight: '800', color: '#2A2A2A', marginBottom: 16 }, field: { marginBottom: 13 }, label: { color: '#333', fontWeight: '700', fontSize: 13, marginBottom: 6 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0DBD4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, color: '#2A2A2A' }, switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }, saveBtn: { backgroundColor: '#7A1E3A', borderRadius: 9, padding: 14, alignItems: 'center', marginTop: 10 }, saveText: { color: '#fff', fontWeight: '800' }, disabled: { opacity: .65 }, cancelBtn: { alignItems: 'center', padding: 12 }, cancelText: { color: '#7A1E3A', fontWeight: '700' },
});
