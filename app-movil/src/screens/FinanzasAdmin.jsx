import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconChartBar, IconPackage, IconRefresh, IconStore, IconTrendingUp, IconWallet } from '../components/Icons';
import {
  getCuentasBancariasVendedor, getFinanzasBalance, getFinanzasEstadisticas,
  getFinanzasHistorial, getFinanzasNomina, procesarNominaVendedor,
} from '../services/api';

const VINOTINTO = '#7A1E3A';
const VINOTINTO_DARK = '#5e1629';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#666';
const WHITE = '#FFFFFF';
const BORDER = '#E0DBD4';
const GREEN = '#2e7d32';
const ORANGE = '#e67e22';

// Misma configuración que BookyPago en web: COP, sin fracciones decimales.
const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(Number(value || 0));
const titleCase = (value) => (value || '').charAt(0).toUpperCase() + (value || '').slice(1);
const dateTime = (value) => value ? new Date(value).toLocaleString('es-CO') : '—';

function FinancialTile({ label, value, color }) {
  return <View style={s.tile}><Text style={s.tileLabel}>{label}</Text><Text style={[s.tileValue, { color }]}>{value}</Text></View>;
}

function Transaction({ item, income }) {
  const type = titleCase(item.tipo);
  return <View style={s.transaction}>
    <View style={[s.typeIcon, { backgroundColor: income ? '#FDF2F4' : '#FFF7ED' }]}>
      {income && item.tipo === 'venta' ? <IconPackage size={16} color={VINOTINTO} /> : income && item.tipo === 'plan' ? <IconStore size={16} color={VINOTINTO} /> : <IconTrendingUp size={16} color={income ? VINOTINTO : ORANGE} />}
    </View>
    <View style={{ flex: 1 }}><Text style={s.transactionTitle}>{type || 'Movimiento'}</Text><Text style={s.transactionDate}>{dateTime(item.fecha)}</Text></View>
    <View style={{ alignItems: 'flex-end' }}><Text style={s.transactionValue}>{money(item.monto)}</Text><View style={s.status}><Text style={s.statusText}>{titleCase(item.estado) || 'Completado'}</Text></View></View>
  </View>;
}

export default function FinanzasAdmin() {
  const [tab, setTab] = useState('balance');
  const [balance, setBalance] = useState({});
  const [statistics, setStatistics] = useState({});
  const [history, setHistory] = useState({});
  const [payroll, setPayroll] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [b, st, h, n] = await Promise.all([getFinanzasBalance(), getFinanzasEstadisticas(), getFinanzasHistorial(), getFinanzasNomina()]);
      setBalance(b.data.balance || {}); setStatistics(st.data.estadisticas || {}); setHistory(h.data.historial || {}); setPayroll(n.data.nomina || {});
    } catch (e) { setError(e.response?.data?.detail || 'No fue posible cargar la información financiera.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openPayment = async (vendor) => {
    setPayment(vendor); setAccounts([]); setSelectedAccount(null); setLoadingAccounts(true);
    try { const response = await getCuentasBancariasVendedor(vendor.id_vendedor); const list = response.data.cuentas || []; setAccounts(list); setSelectedAccount((list.find((a) => a.es_principal) || list[0])?.id_metodo || null); }
    catch { setError('No fue posible cargar las cuentas bancarias del vendedor.'); }
    finally { setLoadingAccounts(false); }
  };
  const confirmPayment = async () => {
    if (!selectedAccount) return;
    setProcessing(true);
    try { const response = await procesarNominaVendedor(payment.id_vendedor, selectedAccount); setSuccess(response.data.cuenta_bancaria || {}); setPayment(null); await load(true); }
    catch (e) { setError(e.response?.data?.detail || 'Error procesando nómina.'); setPayment(null); }
    finally { setProcessing(false); }
  };
  const tabs = [{ id: 'balance', label: 'Balance', Icon: IconWallet }, { id: 'estadisticas', label: 'Estadísticas', Icon: IconChartBar }, { id: 'historial', label: 'Historial', Icon: IconTrendingUp }, { id: 'nomina', label: 'Nómina', Icon: IconStore }];
  return <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[VINOTINTO]} tintColor={VINOTINTO} />}>
      <View style={s.titleCard}><View style={s.titleRow}><View style={s.wallet}><IconWallet size={29} color={WHITE} /></View><View style={{ flex: 1 }}><Text style={s.title}>BookyPago Finanzas</Text><Text style={s.subtitle}>Sistema de gestión financiera de BookyHome</Text></View><TouchableOpacity style={s.refresh} onPress={() => load(true)} accessibilityLabel="Actualizar información financiera"><IconRefresh size={17} color={WHITE} /><Text style={s.refreshText}>Actualizar</Text></TouchableOpacity></View></View>
      <View style={s.balance}><View><Text style={s.balanceLabel}>Balance Actual</Text><Text style={s.balanceValue}>{money(balance.balance)}</Text></View><View style={s.balanceRight}><Text style={s.balanceLabel}>Ingresos Totales</Text><Text style={[s.balanceMini, { color: '#4caf50' }]}>{money(balance.ingresos_totales)}</Text><Text style={[s.balanceLabel, { marginTop: 9 }]}>Pagos Totales</Text><Text style={[s.balanceMini, { color: '#ff9800' }]}>{money(balance.pagos_totales)}</Text></View></View>
      {!!error && <View style={s.error}><Text style={s.errorText}>{error}</Text><TouchableOpacity onPress={() => load(true)}><Text style={s.retry}>Reintentar</Text></TouchableOpacity></View>}
      <View style={s.tabs}>{tabs.map(({ id, label, Icon }) => <TouchableOpacity key={id} onPress={() => setTab(id)} style={[s.tab, tab === id && s.tabActive]}><Icon size={16} color={tab === id ? WHITE : CARBON} /><Text style={[s.tabText, tab === id && s.tabTextActive]}>{label}</Text></TouchableOpacity>)}</View>
      <View style={s.body}>{loading ? <View style={s.loading}><ActivityIndicator size="large" color={VINOTINTO} /><Text style={s.loadingText}>Cargando información financiera...</Text></View> : <>
        {tab === 'balance' && <><Text style={s.sectionTitle}>Detalle Financiero</Text><View style={s.grid}><FinancialTile label="Ingresos por Ventas" value={money(balance.ingresos_por_tipo?.venta)} color={GREEN} /><FinancialTile label="Ingresos por Planes" value={money(balance.ingresos_por_tipo?.plan)} color={GREEN} /><FinancialTile label="Ingresos por Impulsos" value={money(balance.ingresos_por_tipo?.impulso)} color={GREEN} /><FinancialTile label="Pagos Pendientes" value={balance.pagos_pendientes || 0} color={ORANGE} /></View></>}
        {tab === 'estadisticas' && <><Text style={s.sectionTitle}>Estadísticas Financieras</Text><View style={s.grid}><FinancialTile label="Ingresos 30 días" value={money(statistics.ingresos_30_dias)} color={GREEN} /><FinancialTile label="Pagos 30 días" value={money(statistics.pagos_30_dias)} color={ORANGE} /><FinancialTile label="Promedio Diario" value={money(statistics.promedio_diario)} color={VINOTINTO} /><FinancialTile label="Ventas Totales" value={statistics.ventas_totales || 0} color={CARBON} /><FinancialTile label="Planes Activos" value={statistics.planes_activos || 0} color={CARBON} /><FinancialTile label="Impulsos Comprados" value={statistics.impulsos_comprados || 0} color={CARBON} /></View></>}
        {tab === 'historial' && <><Text style={s.sectionTitle}>Historial Financiero (Últimos 30 días)</Text><Text style={s.subheading}>Ingresos</Text>{history.ingresos?.length ? history.ingresos.map((item) => <Transaction key={`i-${item.id}`} item={item} income />) : <Text style={s.empty}>No hay ingresos registrados</Text>}<Text style={s.subheading}>Pagos</Text>{history.pagos?.length ? history.pagos.map((item) => <Transaction key={`p-${item.id}`} item={item} />) : <Text style={s.empty}>No hay pagos registrados</Text>}</>}
        {tab === 'nomina' && <><Text style={s.sectionTitle}>Nómina de Pagos a Vendedores</Text><View style={s.payrollSummary}><View><Text style={s.tileLabel}>Total General Pendiente</Text><Text style={[s.tileValue, { color: VINOTINTO }]}>{money(payroll.total_general)}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={s.tileLabel}>Vendedores con Pagos Pendientes</Text><Text style={[s.tileValue, { color: CARBON }]}>{payroll.total_vendedores || 0}</Text></View></View>{payroll.vendedores?.length ? payroll.vendedores.map((vendor) => { const open = expandedVendor === vendor.id_vendedor; const paymentCount = vendor.pagos?.length || 0; return <View key={vendor.id_vendedor} style={s.vendor}><View style={s.vendorTop}><View><Text style={s.vendorName}>Vendedor ID: {vendor.id_vendedor}</Text><Text style={s.vendorSub}>{paymentCount} pagos pendientes</Text></View><Text style={s.vendorTotal}>{money(vendor.total_pendiente)}</Text></View><TouchableOpacity style={s.ordersToggle} onPress={() => setExpandedVendor(open ? null : vendor.id_vendedor)} accessibilityLabel={`${open ? 'Ocultar' : 'Ver'} órdenes pendientes del vendedor`}><Text style={s.ordersToggleText}>{open ? '⌃ Ocultar órdenes' : `⌄ Ver ${paymentCount} órdenes pendientes`}</Text></TouchableOpacity>{open && <ScrollView style={s.ordersList} nestedScrollEnabled showsVerticalScrollIndicator><Text style={s.scrollHint}>Desliza para ver las órdenes</Text>{vendor.pagos?.map((p, index) => <View key={index} style={s.order}><Text style={s.orderText}>Orden #{p.id_venta}</Text><Text style={s.orderText}>{money(p.monto)}</Text></View>)}</ScrollView>}<TouchableOpacity style={s.payButton} onPress={() => openPayment(vendor)}><Text style={s.payButtonText}>Procesar Pago a Vendedor</Text></TouchableOpacity></View>; }) : <Text style={s.empty}>No hay pagos pendientes en nómina</Text>}</>}
      </>}</View>
    </ScrollView>
    <Modal visible={!!payment} transparent animationType="fade" onRequestClose={() => !processing && setPayment(null)}><View style={s.overlay}><View style={s.modal}><Text style={s.modalTitle}>Procesar Pago a Vendedor #{payment?.id_vendedor}</Text><Text style={s.modalIntro}>Cuenta bancaria registrada por el vendedor para recibir el pago:</Text>{loadingAccounts ? <ActivityIndicator color={VINOTINTO} style={{ marginVertical: 25 }} /> : accounts.length ? <ScrollView style={{ maxHeight: 300 }}>{accounts.map((account) => { const chosen = selectedAccount === account.id_metodo; return <TouchableOpacity key={account.id_metodo} style={[s.account, chosen && s.accountSelected]} onPress={() => setSelectedAccount(account.id_metodo)}><Text style={s.accountBank}>{account.banco}</Text><Text style={s.accountText}>{account.tipo_cuenta} · N.º {account.numero_cuenta}</Text><Text style={s.accountText}>Titular: {account.nombre_titular}{account.cedula_titular ? ` · CC ${account.cedula_titular}` : ''}</Text>{account.es_principal && <Text style={s.principal}>Principal</Text>}</TouchableOpacity>; })}</ScrollView> : <View style={s.notice}><Text style={s.noticeText}>Este vendedor aún no ha registrado cuentas bancarias en Mi Tienda. Debe agregarlas en la sección de métodos de cobro antes de procesar la nómina.</Text></View>}<View style={s.modalActions}><TouchableOpacity style={s.cancel} onPress={() => setPayment(null)} disabled={processing}><Text style={s.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={[s.confirm, (!selectedAccount || processing) && { opacity: 0.6 }]} onPress={confirmPayment} disabled={!selectedAccount || processing}><Text style={s.confirmText}>{processing ? 'Procesando...' : 'Procesar Pago'}</Text></TouchableOpacity></View></View></View></Modal>
    <Modal visible={!!success} transparent animationType="fade" onRequestClose={() => setSuccess(null)}><View style={s.overlay}><View style={s.success}><Text style={s.successIcon}>✓</Text><Text style={s.successTitle}>¡Pago procesado exitosamente!</Text><Text style={s.successText}>El pago al vendedor ha sido procesado correctamente.{success?.banco ? `\n\nBanco: ${success.banco}\nCuenta: ${success.tipo_cuenta} · ${success.numero_cuenta}\nTitular: ${success.titular}` : ''}</Text><TouchableOpacity style={s.accept} onPress={() => setSuccess(null)}><Text style={s.confirmText}>Aceptar</Text></TouchableOpacity></View></View></Modal>
  </View>;
}

const s = StyleSheet.create({
  content: { padding: 14, paddingBottom: 36, backgroundColor: BEIGE }, titleCard: { backgroundColor: WHITE, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, wallet: { backgroundColor: VINOTINTO, borderRadius: 12, padding: 11 }, title: { color: CARBON, fontSize: 18, fontWeight: '800' }, subtitle: { color: GRAY, fontSize: 11, marginTop: 2 }, refresh: { backgroundColor: VINOTINTO, borderRadius: 8, padding: 9, alignItems: 'center', gap: 2 }, refreshText: { color: WHITE, fontSize: 9, fontWeight: '700' }, balance: { backgroundColor: VINOTINTO, borderRadius: 12, padding: 18, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', minHeight: 138 }, balanceLabel: { color: WHITE, fontSize: 11, opacity: 0.9 }, balanceValue: { color: WHITE, fontSize: 27, fontWeight: '900', marginTop: 6 }, balanceRight: { alignItems: 'flex-end' }, balanceMini: { fontSize: 16, fontWeight: '900', marginTop: 4 }, error: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }, errorText: { color: '#991B1B', fontSize: 12, flex: 1 }, retry: { color: VINOTINTO, fontWeight: '800', fontSize: 12 }, tabs: { backgroundColor: WHITE, borderRadius: 12, padding: 5, flexDirection: 'row', marginBottom: 14, elevation: 2 }, tab: { flex: 1, minHeight: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }, tabActive: { backgroundColor: VINOTINTO }, tabText: { color: CARBON, fontSize: 9, fontWeight: '700', marginTop: 2 }, tabTextActive: { color: WHITE }, body: { backgroundColor: WHITE, borderRadius: 12, padding: 16, elevation: 2, minHeight: 250 }, loading: { alignItems: 'center', paddingTop: 65 }, loadingText: { color: GRAY, marginTop: 12, fontSize: 12 }, sectionTitle: { color: CARBON, fontSize: 16, fontWeight: '800', marginBottom: 14 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tile: { width: '48%', backgroundColor: BEIGE, borderRadius: 8, borderWidth: 1, borderColor: BORDER, padding: 12, minHeight: 84, justifyContent: 'center' }, tileLabel: { color: GRAY, fontSize: 10 }, tileValue: { fontSize: 17, fontWeight: '900', marginTop: 7 }, subheading: { color: CARBON, fontSize: 14, fontWeight: '800', marginTop: 6, marginBottom: 9 }, transaction: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 10, gap: 8 }, typeIcon: { padding: 7, borderRadius: 9 }, transactionTitle: { color: CARBON, fontSize: 12, fontWeight: '800' }, transactionDate: { color: GRAY, fontSize: 10, marginTop: 2 }, transactionValue: { color: CARBON, fontSize: 12, fontWeight: '800' }, status: { backgroundColor: '#e8f5e9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }, statusText: { color: GREEN, fontSize: 9, fontWeight: '700' }, empty: { color: GRAY, textAlign: 'center', paddingVertical: 20, fontSize: 12 }, payrollSummary: { backgroundColor: BEIGE, borderColor: BORDER, borderWidth: 1, borderRadius: 8, padding: 14, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }, vendor: { borderWidth: 1, borderColor: BORDER, borderRadius: 9, padding: 13, marginBottom: 12 }, vendorTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }, vendorName: { color: CARBON, fontWeight: '800', fontSize: 13 }, vendorSub: { color: GRAY, fontSize: 11, marginTop: 2 }, vendorTotal: { color: GREEN, fontWeight: '900', fontSize: 15 }, ordersToggle: { backgroundColor: '#F4EDE2', borderWidth: 1, borderColor: BORDER, borderRadius: 7, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center' }, ordersToggleText: { color: VINOTINTO, fontSize: 11, fontWeight: '800' }, ordersList: { maxHeight: 120, marginTop: 8, borderTopWidth: 1, borderTopColor: BORDER }, scrollHint: { color: GRAY, fontSize: 9, textAlign: 'center', paddingTop: 6 }, order: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' }, orderText: { color: GRAY, fontSize: 11 }, payButton: { backgroundColor: VINOTINTO, borderRadius: 6, padding: 10, alignItems: 'center', marginTop: 11 }, payButtonText: { color: WHITE, fontSize: 12, fontWeight: '700' }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'center', padding: 20 }, modal: { backgroundColor: WHITE, borderRadius: 16, padding: 20, maxHeight: '80%' }, modalTitle: { color: CARBON, fontSize: 17, fontWeight: '800' }, modalIntro: { color: GRAY, fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 16 }, account: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 13, marginBottom: 10 }, accountSelected: { borderWidth: 2, borderColor: VINOTINTO, backgroundColor: '#fdf7f9' }, accountBank: { color: CARBON, fontSize: 14, fontWeight: '800', marginBottom: 4 }, accountText: { color: GRAY, fontSize: 11, marginTop: 2 }, principal: { alignSelf: 'flex-start', backgroundColor: VINOTINTO, color: WHITE, fontSize: 9, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginTop: 7 }, notice: { backgroundColor: '#fff8e6', borderColor: '#f0d78c', borderWidth: 1, borderRadius: 8, padding: 13 }, noticeText: { color: '#7a5c00', fontSize: 12, lineHeight: 18 }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 }, cancel: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center' }, cancelText: { color: CARBON, fontWeight: '700' }, confirm: { flex: 1, backgroundColor: VINOTINTO, padding: 12, borderRadius: 8, alignItems: 'center' }, confirmText: { color: WHITE, fontWeight: '800' }, success: { backgroundColor: WHITE, borderRadius: 16, padding: 28, alignItems: 'center' }, successIcon: { width: 65, height: 65, borderRadius: 33, backgroundColor: '#dcfce7', color: '#16a34a', fontSize: 38, fontWeight: '900', textAlign: 'center', paddingTop: 8 }, successTitle: { color: '#16a34a', fontSize: 18, fontWeight: '800', marginTop: 16 }, successText: { color: GRAY, textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 10 }, accept: { backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 30, paddingVertical: 12, marginTop: 18 },
});
