import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import SidebarVendedor from '../components/SidebarVendedor';
import {
  crearCuentaBancariaVendedor,
  eliminarCuentaBancariaVendedor,
  getCuentasBancariasVendedor,
  marcarCuentaPrincipalVendedor,
} from '../services/api';

const PRIMARY = '#7A1E3A';
const BG = '#FAF8F5';
const WHITE = '#FFFFFF';
const BORDER = '#E9E0DD';
const TEXT = '#2A2A2A';
const MUTED = '#6B7280';
const SUCCESS = '#1F9D5A';

const bancos = [
  'Bancolombia',
  'Davivienda',
  'Banco de Bogotá',
  'BBVA Colombia',
  'Scotiabank Colpatria',
  'Banco Popular',
  'Banco GNB Sudameris',
  'Citibank Colombia',
  'HSBC Colombia',
  'Banco Pichincha',
  'Bancoomeva',
  'Banco Falabella',
  'Banco Agrario',
  'Banco WWB',
  'Caja Social',
  'Colpatria',
  'Mibanco',
  'Lulo Bank',
  'Nequi',
  'Daviplata',
  'PSE',
  'Otro',
];

const tiposCuenta = ['Ahorros', 'Corriente', 'Nequi', 'Daviplata'];

export default function MetodosCobroVendedor({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [bankPickerVisible, setBankPickerVisible] = useState(false);

  const [form, setForm] = useState({
    tipo_cuenta: '',
    banco: '',
    numero_cuenta: '',
    nombre_titular: '',
    cedula_titular: '',
    es_principal: false,
  });

  const cargarCuentas = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const idVendedor = user?.sub || user?.id_usuario || user?.id;
      if (!idVendedor) {
        setCuentas([]);
        return;
      }
      const res = await getCuentasBancariasVendedor(idVendedor);
      setCuentas(res?.data?.cuentas || []);
    } catch (e) {
      setCuentas([]);
      setError(e?.response?.data?.detail || 'No se pudieron cargar tus métodos de cobro.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { cargarCuentas(); }, [cargarCuentas]));

  const resetForm = () => {
    setForm({
      tipo_cuenta: '',
      banco: '',
      numero_cuenta: '',
      nombre_titular: '',
      cedula_titular: '',
      es_principal: false,
    });
  };

  const guardarCuenta = async () => {
    if (!form.tipo_cuenta || !form.banco || !form.numero_cuenta || !form.nombre_titular || !form.cedula_titular) {
      Alert.alert('Falta información', 'Completa todos los campos antes de guardar.');
      return;
    }

    const idVendedor = user?.sub || user?.id_usuario || user?.id;
    if (!idVendedor) {
      Alert.alert('Error', 'No se pudo identificar al vendedor.');
      return;
    }

    setProcesando(true);
    try {
      await crearCuentaBancariaVendedor(idVendedor, {
        tipo_cuenta: form.tipo_cuenta,
        banco: form.banco,
        numero_cuenta: form.numero_cuenta,
        nombre_titular: form.nombre_titular,
        cedula_titular: form.cedula_titular,
        es_principal: form.es_principal,
      });
      resetForm();
      setFormVisible(false);
      await cargarCuentas(true);
      Alert.alert('Éxito', 'Método de cobro agregado correctamente.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo guardar el método de cobro.');
    } finally {
      setProcesando(false);
    }
  };

  const marcarPrincipal = async (idCuenta) => {
    const idVendedor = user?.sub || user?.id_usuario || user?.id;
    if (!idVendedor) return;

    try {
      await marcarCuentaPrincipalVendedor(idVendedor, idCuenta);
      await cargarCuentas(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo actualizar la cuenta principal.');
    }
  };

  const eliminarCuenta = async (idCuenta) => {
    const idVendedor = user?.sub || user?.id_usuario || user?.id;
    if (!idVendedor) return;

    Alert.alert('Confirmar', '¿Deseas eliminar este método de cobro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await eliminarCuentaBancariaVendedor(idVendedor, idCuenta);
          await cargarCuentas(true);
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.detail || 'No se pudo eliminar el método de cobro.');
        }
      } },
    ]);
  };

  const principal = cuentas.find((cuenta) => cuenta.es_principal) || cuentas[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton} accessibilityLabel="Abrir menú">
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Métodos de cobro</Text>
          <Text style={styles.headerSubtitle}>Administra las cuentas donde recibirás tus pagos</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Cargando métodos de cobro…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarCuentas(true); }} tintColor={PRIMARY} colors={[PRIMARY]} />}
        >
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>💳 Cuentas bancarias</Text>
            <Text style={styles.bannerText}>Usa una cuenta principal para recibir tus pagos de venta y sácalos de forma segura.</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={() => setFormVisible((v) => !v)}>
            <Text style={styles.primaryButtonText}>{formVisible ? 'Ocultar formulario' : '+ Agregar cuenta'}</Text>
          </TouchableOpacity>

          {formVisible && (
            <View style={styles.formBox}>
              <Text style={styles.sectionTitle}>Agregar nueva cuenta</Text>

              <Text style={styles.label}>Tipo de cuenta</Text>
              <View style={styles.pickerWrap}>
                {tiposCuenta.map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.option, form.tipo_cuenta === tipo && styles.optionSelected]}
                    onPress={() => setForm((prev) => ({ ...prev, tipo_cuenta: tipo }))}
                  >
                    <Text style={[styles.optionText, form.tipo_cuenta === tipo && styles.optionTextSelected]}>{tipo}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Banco</Text>
              <TouchableOpacity
                style={styles.selectField}
                onPress={() => setBankPickerVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectFieldText, !form.banco && styles.placeholderText]}>
                  {form.banco || 'Selecciona el banco'}
                </Text>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Número de cuenta"
                value={form.numero_cuenta}
                onChangeText={(text) => setForm((prev) => ({ ...prev, numero_cuenta: text }))}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Nombre del titular"
                value={form.nombre_titular}
                onChangeText={(text) => setForm((prev) => ({ ...prev, nombre_titular: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Cédula del titular"
                value={form.cedula_titular}
                onChangeText={(text) => setForm((prev) => ({ ...prev, cedula_titular: text }))}
                keyboardType="numeric"
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Marcar como cuenta principal</Text>
                <Switch
                  value={form.es_principal}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, es_principal: value }))}
                  trackColor={{ false: '#d1d5db', true: PRIMARY }}
                  thumbColor={WHITE}
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => { setFormVisible(false); resetForm(); }}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={guardarCuenta} disabled={procesando}>
                  <Text style={styles.primaryButtonText}>{procesando ? 'Guardando...' : 'Guardar cuenta'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {cuentas.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>Aún no tienes métodos de cobro</Text>
              <Text style={styles.emptyText}>Agrega tu primera cuenta bancaria para empezar a recibir tus pagos.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {cuentas.map((cuenta) => (
                <View key={cuenta.id_metodo} style={[styles.card, cuenta.es_principal && styles.cardSelected]}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bank}>{cuenta.banco}</Text>
                      <Text style={styles.meta}>{cuenta.tipo_cuenta}</Text>
                    </View>
                    {cuenta.es_principal && (
                      <View style={styles.principalBadge}>
                        <Text style={styles.principalBadgeText}>Principal</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.accountNumber}>•••• {String(cuenta.numero_cuenta || '').slice(-4)}</Text>
                  <Text style={styles.meta}>Titular: {cuenta.nombre_titular}</Text>
                  <Text style={styles.meta}>Cédula: {cuenta.cedula_titular}</Text>

                  <View style={styles.actionsRow}>
                    {!cuenta.es_principal && (
                      <TouchableOpacity style={styles.acceptButton} onPress={() => marcarPrincipal(cuenta.id_metodo)}>
                        <Text style={styles.acceptButtonText}>Marcar principal</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarCuenta(cuenta.id_metodo)}>
                      <Text style={styles.deleteButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {principal && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Cuenta principal</Text>
              <Text style={styles.summaryText}>{principal.banco} · {principal.tipo_cuenta}</Text>
              <Text style={styles.summaryText}>Final {String(principal.numero_cuenta || '').slice(-4)}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <SidebarVendedor visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={user} navigation={navigation} onSignOut={signOut} />

      {bankPickerVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu banco</Text>
              <TouchableOpacity onPress={() => setBankPickerVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {bancos.map((banco) => (
                <TouchableOpacity
                  key={banco}
                  style={[styles.modalItem, form.banco === banco && styles.modalItemSelected]}
                  onPress={() => {
                    setForm((prev) => ({ ...prev, banco }));
                    setBankPickerVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, form.banco === banco && styles.modalItemTextSelected]}>{banco}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, paddingHorizontal: 18, paddingVertical: 16,
  },
  menuButton: { paddingRight: 10 },
  menuIcon: { color: WHITE, fontSize: 24, fontWeight: '700' },
  headerTitle: { color: WHITE, fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 3 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  banner: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18, marginBottom: 14 },
  bannerTitle: { color: TEXT, fontSize: 18, fontWeight: '800' },
  bannerText: { color: MUTED, fontSize: 12.5, marginTop: 6, lineHeight: 20 },
  primaryButton: {
    backgroundColor: PRIMARY, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  primaryButtonText: { color: WHITE, fontWeight: '800', fontSize: 14 },
  secondaryButton: {
    backgroundColor: '#F3F4F6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  secondaryButtonText: { color: TEXT, fontWeight: '700', fontSize: 14 },
  error: {
    backgroundColor: '#FDECEC', color: '#991B1B', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12.5,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: MUTED, fontSize: 13 },
  formBox: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 16, marginBottom: 18 },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  label: { color: TEXT, fontSize: 12.5, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: TEXT, marginBottom: 10,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  selectFieldText: { color: TEXT, fontSize: 14, fontWeight: '600', flex: 1 },
  placeholderText: { color: MUTED },
  chevron: { color: MUTED, fontSize: 18, fontWeight: '700' },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pickerWrapColumn: { flexDirection: 'column', gap: 8, marginBottom: 8 },
  option: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  optionSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  optionText: { color: TEXT, fontSize: 12.5, fontWeight: '600' },
  optionTextSelected: { color: WHITE },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  switchLabel: { color: TEXT, fontWeight: '600', fontSize: 13 },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 8 },
  list: { gap: 12 },
  card: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 16 },
  cardSelected: { borderColor: PRIMARY, backgroundColor: '#FFF8F8' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bank: { color: TEXT, fontSize: 17, fontWeight: '800' },
  meta: { color: MUTED, fontSize: 12.5, marginTop: 3 },
  principalBadge: { backgroundColor: '#FDECEC', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  principalBadgeText: { color: PRIMARY, fontSize: 10, fontWeight: '800' },
  accountNumber: { color: TEXT, fontSize: 15, fontWeight: '700', marginTop: 4 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  acceptButton: { backgroundColor: '#E7F7EE', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  acceptButtonText: { color: SUCCESS, fontWeight: '700', fontSize: 12 },
  deleteButton: { backgroundColor: '#FEE2E2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  deleteButtonText: { color: '#B91C1C', fontWeight: '700', fontSize: 12 },
  emptyCard: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, paddingVertical: 28, alignItems: 'center', marginTop: 10 },
  emptyIcon: { fontSize: 28 },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '800', marginTop: 8 },
  emptyText: { color: MUTED, fontSize: 12.5, textAlign: 'center', marginTop: 5, paddingHorizontal: 24 },
  summaryCard: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 16, marginTop: 16 },
  summaryTitle: { color: TEXT, fontSize: 14, fontWeight: '800' },
  summaryText: { color: MUTED, fontSize: 12.5, marginTop: 4 },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { color: TEXT, fontSize: 17, fontWeight: '800' },
  modalClose: { color: MUTED, fontSize: 20, fontWeight: '700' },
  modalList: { maxHeight: 420 },
  modalItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },
  modalItemSelected: { backgroundColor: '#FFF8F8' },
  modalItemText: { color: TEXT, fontSize: 14, fontWeight: '600' },
  modalItemTextSelected: { color: PRIMARY, fontWeight: '800' },
});
