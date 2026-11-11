import { useThemedStyles } from '../context/ThemeContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { IconAlertTriangle, IconBolt, IconChartBar, IconPackage, IconRefresh, IconStore, IconTrendingUp, IconWallet } from '../components/Icons';
import {
  getFinanzasBalance, getFinanzasEstadisticas, getFinanzasHistorial,
} from '../services/api';

const VINOTINTO = '#7A1E3A';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#666';
const WHITE = '#FFFFFF';
const BORDER = '#E0DBD4';
const GREEN = '#2e7d32';
const BLUE = '#0369A1';
const PURPLE = '#7C3AED';
const GREEN_BG = '#F0FDF4';
const BLUE_BG = '#F0F9FF';
const PURPLE_BG = '#F5F3FF';
const GREEN_BORDER = '#BBF7D0';
const BLUE_BORDER = '#BAE6FD';
const PURPLE_BORDER = '#DDD6FE';
const ORANGE = '#e67e22';

// Misma configuración que BookyPago en web: COP, sin fracciones decimales.
const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(Number(value || 0));
const titleCase = (value) => (value || '').charAt(0).toUpperCase() + (value || '').slice(1);
const dateTime = (value) => value ? new Date(value).toLocaleString('es-CO') : '—';

function FinancialTile({ label, value, color, backgroundColor, borderColor, subtitle }) {
  return (
    <View style={[s.tile, { borderTopColor: color, backgroundColor: backgroundColor || WHITE, borderColor: borderColor || BORDER }]}>
      <Text style={s.tileLabel}>{label}</Text>
      <Text style={[s.tileValue, { color: CARBON }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {subtitle ? <Text style={s.tileSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Transaction({ item, income }) {
  const kindColors = item.tipo === 'venta'
    ? { color: GREEN, bg: GREEN_BG, border: GREEN_BORDER }
    : item.tipo === 'plan'
      ? { color: BLUE, bg: BLUE_BG, border: BLUE_BORDER }
      : item.tipo === 'impulso'
        ? { color: PURPLE, bg: PURPLE_BG, border: PURPLE_BORDER }
        : { color: ORANGE, bg: '#FFF7ED', border: '#FED7AA' };
  return (
    <View style={s.transaction}>
      <View style={[s.typeIcon, { backgroundColor: kindColors.bg }]}>
        {income && item.tipo === 'venta' ? <IconPackage size={16} color={kindColors.color} />
          : income && item.tipo === 'plan' ? <IconStore size={16} color={kindColors.color} />
            : income && item.tipo === 'impulso' ? <IconBolt size={16} color={kindColors.color} />
              : <IconTrendingUp size={16} color={income ? kindColors.color : ORANGE} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.transactionTitle}>{titleCase(item.tipo) || 'Movimiento'}</Text>
        <Text style={s.transactionDate}>{dateTime(item.fecha)}</Text>
        {income && item.monto_venta != null && <Text style={s.transactionDate}>Venta: {money(item.monto_venta)}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.transactionValue, { color: income ? kindColors.color : ORANGE }]}>
          {money(income ? (item.comision ?? item.monto) : item.monto)}
        </Text>
        <View style={[s.status, { backgroundColor: kindColors.bg, borderColor: kindColors.border, borderWidth: 1 }]}>
          <Text style={[s.statusText, { color: kindColors.color }]}>{titleCase(item.estado) || 'Completado'}</Text>
        </View>
      </View>
    </View>
  );
}

function PaginatedTransactions({ items, income, emptyMessage, scrollToListTop }) {
  const [page, setPage] = useState(1);
  const listRef = useRef(null);
  const pageSize = 20;
  const totalPages = Math.ceil(items.length / pageSize);
  const firstItem = (page - 1) * pageSize;
  const visibleItems = items.slice(firstItem, firstItem + pageSize);
  const changePage = (nextPage) => {
    setPage(nextPage);
    requestAnimationFrame(() => scrollToListTop(listRef));
  };

  return (
    <View ref={listRef}>
      {visibleItems.map((item, index) => (
        <Transaction key={`${income ? 'i' : 'p'}-${item.id ?? firstItem + index}`} item={item} income={income} />
      ))}
      {items.length === 0
        ? <Text style={s.empty}>{emptyMessage}</Text>
        : <View style={s.pagination}>
          <Text style={s.paginationSummary}>Mostrando {firstItem + 1}–{Math.min(firstItem + pageSize, items.length)} de {items.length}</Text>
          <View style={s.paginationControls}>
            <TouchableOpacity
              style={[s.pageButton, page === 1 && s.pageButtonDisabled]}
              onPress={() => changePage(Math.max(1, page - 1))}
              disabled={page === 1}
              accessibilityLabel="Página anterior"
            >
              <Text style={[s.pageButtonText, page === 1 && s.pageButtonTextDisabled]}>‹</Text>
            </TouchableOpacity>
            <Text style={s.pageIndicator}>{page} / {totalPages}</Text>
            <TouchableOpacity
              style={[s.pageButton, page === totalPages && s.pageButtonDisabled]}
              onPress={() => changePage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              accessibilityLabel="Página siguiente"
            >
              <Text style={[s.pageButtonText, page === totalPages && s.pageButtonTextDisabled]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>}
    </View>
  );
}

function IncomeBreakdownCard({ label, value, color, backgroundColor, borderColor, subtitle, Icon, featured = false }) {
  return (
    <View style={[s.incomeCard, featured ? s.incomeCardFeatured : s.incomeCardCompact, { backgroundColor, borderColor }]}>
      <View style={s.incomeCardHeader}>
        <View style={[s.incomeIcon, { backgroundColor: WHITE }]}>
          <Icon size={17} color={color} />
        </View>
        <Text style={s.incomeLabel}>{label}</Text>
      </View>
      <Text style={[s.incomeValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={s.incomeSubtitle}>{subtitle}</Text>
    </View>
  );
}

function StatisticsPanel({ statistics, history, balance }) {
  const [filter, setFilter] = useState('todo');
  const [selectedDay, setSelectedDay] = useState(null);
  const options = [
    { id: 'todo', label: 'Todo', color: VINOTINTO, bg: '#FDF2F4', border: '#F5C6D2', value: balance.ingresos_totales, subtitle: 'Total acumulado', Icon: IconChartBar },
    { id: 'venta', label: 'Ventas', color: GREEN, bg: GREEN_BG, border: GREEN_BORDER, value: balance.ingresos_por_tipo?.venta, subtitle: 'Comisiones 15%', Icon: IconPackage },
    { id: 'plan', label: 'Planes', color: BLUE, bg: BLUE_BG, border: BLUE_BORDER, value: balance.ingresos_por_tipo?.plan, subtitle: 'Suscripciones', Icon: IconStore },
    { id: 'impulso', label: 'Impulsos', color: PURPLE, bg: PURPLE_BG, border: PURPLE_BORDER, value: balance.ingresos_por_tipo?.impulso, subtitle: 'Visibilidad paga', Icon: IconBolt },
  ];
  const active = options.find((option) => option.id === filter) || options[0];
  const days = React.useMemo(() => {
    const now = new Date();
    const result = [];
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      result.push({ key, label: date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), value: 0, count: 0 });
    }
    const byDate = Object.fromEntries(result.map((day) => [day.key, day]));
    (history.ingresos || []).forEach((income) => {
      if (filter !== 'todo' && income.tipo !== filter) return;
      const day = byDate[(income.fecha || '').slice(0, 10)];
      if (day) {
        day.value += Number.parseFloat(income.comision ?? income.monto ?? 0);
        day.count += 1;
      }
    });
    return result;
  }, [filter, history]);
  const maxValue = Math.max(...days.map((day) => day.value), 0);
  const points = days.map((day, index) => ({
    ...day,
    x: 34 + (index / Math.max(days.length - 1, 1)) * 310,
    y: 18 + 132 - (day.value / (maxValue || 1)) * 132,
  }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const total = days.reduce((sum, day) => sum + day.value, 0);
  const count = days.reduce((sum, day) => sum + day.count, 0);
  const selected = selectedDay == null ? null : days[selectedDay];
  const axisValue = (value) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${Math.round(value / 1_000)}k` : `${Math.round(value)}`;

  return (
    <View>
      <Text style={s.sectionTitle}>Estadísticas Financieras</Text>
      <Text style={s.panelIntro}>Selecciona una categoría para ver su evolución en los últimos 30 días.</Text>
      <View style={s.statsOptions}>
        {options.map((option) => {
          const isSelected = filter === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[s.statsOption, { backgroundColor: isSelected ? option.bg : WHITE, borderColor: isSelected ? option.color : BORDER }]}
              onPress={() => { setFilter(option.id); setSelectedDay(null); }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={s.statsOptionTop}>
                <Text style={[s.statsOptionLabel, { color: isSelected ? option.color : GRAY }]}>{option.label}</Text>
                <option.Icon size={16} color={option.color} />
              </View>
              <Text style={s.statsOptionValue} numberOfLines={1} adjustsFontSizeToFit>{money(option.value)}</Text>
              <Text style={s.statsOptionSub}>{option.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.chartCard}>
        <View style={s.chartSummary}>
          <View style={{ flex: 1 }}>
            <View style={[s.chartBadge, { backgroundColor: active.bg, borderColor: active.border }]}>
              <Text style={[s.chartBadgeText, { color: active.color }]}>{active.label} · últimos 30 días</Text>
            </View>
            {selected && <Text style={s.selectedDayText}>{selected.label}: {money(selected.value)} · {selected.count} registro(s)</Text>}
          </View>
          <View style={s.chartTotals}>
            <Text style={s.chartTotalLabel}>PERÍODO</Text>
            <Text style={[s.chartTotalValue, { color: active.color }]} numberOfLines={1} adjustsFontSizeToFit>{money(total)}</Text>
            <Text style={s.chartTotalLabel}>{count} registros</Text>
          </View>
        </View>
        <Svg viewBox="0 0 360 188" width="100%" height={190} preserveAspectRatio="none">
          {[0, 0.5, 1].map((ratio) => {
            const y = 18 + 132 * (1 - ratio);
            return (
              <React.Fragment key={ratio}>
                <Line x1="34" y1={y} x2="350" y2={y} stroke="#EDE8E3" strokeDasharray={ratio === 0 ? undefined : '4 4'} />
                <SvgText x="29" y={y + 4} textAnchor="end" fontSize="9" fill="#A8A29E">${axisValue(maxValue * ratio)}</SvgText>
              </React.Fragment>
            );
          })}
          {points.length > 1 && <Path d={`${path} L 344 150 L 34 150 Z`} fill={active.color} fillOpacity={0.08} />}
          {points.length > 1 && <Path d={path} fill="none" stroke={active.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((point, index) => {
            const showLabel = index === 0 || index === points.length - 1 || (index + 1) % 7 === 0;
            return (
              <React.Fragment key={point.key}>
                {point.value > 0 && <Circle cx={point.x} cy={point.y} r="3.5" fill={active.color} stroke={WHITE} strokeWidth="1.5" />}
                {showLabel && <SvgText x={point.x} y="172" textAnchor="middle" fontSize="8" fill="#A8A29E">{point.label}</SvgText>}
              </React.Fragment>
            );
          })}
        </Svg>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayPicker}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={day.key}
              style={[s.dayButton, selectedDay === index && { backgroundColor: active.bg, borderColor: active.color }]}
              onPress={() => setSelectedDay(index)}
              accessibilityLabel={`${day.label}: ${money(day.value)}, ${day.count} registros`}
              accessibilityState={{ selected: selectedDay === index }}
            >
              <Text style={[s.dayButtonText, selectedDay === index && { color: active.color }]}>{day.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={s.chartHint}>Selecciona un día para consultar sus ingresos.</Text>
      </View>

      <Text style={[s.sectionTitle, { marginTop: 18 }]}>Resumen del período</Text>
      <View style={s.grid}>
        <FinancialTile label="Ingresos 30 días" value={money(statistics.ingresos_30_dias)} color={GREEN} backgroundColor={GREEN_BG} borderColor={GREEN_BORDER} />
        <FinancialTile label="Promedio diario" value={money(statistics.promedio_diario)} color={VINOTINTO} backgroundColor="#FDF2F4" borderColor="#F5C6D2" />
        <FinancialTile label="Ventas procesadas" value={statistics.ventas_totales ?? 0} color={GREEN} backgroundColor={GREEN_BG} borderColor={GREEN_BORDER} subtitle="En el período" />
        <FinancialTile label="Planes contratados" value={statistics.planes_activos ?? 0} color={BLUE} backgroundColor={BLUE_BG} borderColor={BLUE_BORDER} subtitle="En el período" />
        <FinancialTile label="Impulsos contratados" value={statistics.impulsos_comprados ?? 0} color={PURPLE} backgroundColor={PURPLE_BG} borderColor={PURPLE_BORDER} subtitle="En el período" />
      </View>
    </View>
  );
}

export default function FinanzasAdmin() {
  const s = useThemedStyles(themeBaseS);
  const financeScrollRef = useRef(null);
  const financeViewportRef = useRef(null);
  const financeScrollOffset = useRef(0);
  const financeViewportY = useRef(0);
  const [tab, setTab] = useState('balance');
  const [balance, setBalance] = useState({});
  const [statistics, setStatistics] = useState({});
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [b, st, h] = await Promise.all([getFinanzasBalance(), getFinanzasEstadisticas(), getFinanzasHistorial()]);
      setBalance(b.data.balance || {});
      setStatistics(st.data.estadisticas || {});
      setHistory(h.data.historial || {});
    } catch (e) { setError(e.response?.data?.detail || 'No fue posible cargar la información financiera.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const scrollToListTop = useCallback((listRef) => {
    const list = listRef.current;
    if (!list || typeof list.measureInWindow !== 'function') return;
    list.measureInWindow((_x, listY) => {
      const targetY = Math.max(0, financeScrollOffset.current + listY - financeViewportY.current);
      financeScrollRef.current?.scrollTo({ y: targetY, animated: true });
    });
  }, []);

  const tabs = [
    { id: 'balance', label: 'Balance', Icon: IconWallet },
    { id: 'estadisticas', label: 'Estadísticas', Icon: IconChartBar },
    { id: 'historial', label: 'Historial', Icon: IconTrendingUp },
    { id: 'comisiones', label: 'Comisiones', Icon: IconStore },
  ];
  return <View style={{ flex: 1 }}>
    <View
      ref={financeViewportRef}
      style={{ flex: 1 }}
      onLayout={() => {
        const viewport = financeViewportRef.current;
        if (viewport && typeof viewport.measureInWindow === 'function') {
          viewport.measureInWindow((_x, y) => { financeViewportY.current = y; });
        }
      }}
    >
      <ScrollView
        ref={financeScrollRef}
        contentContainerStyle={s.content}
        onScroll={(event) => { financeScrollOffset.current = event.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[VINOTINTO]} tintColor={VINOTINTO} />}
      >
      <View style={s.hero}>
        <View style={s.titleRow}>
          <View style={s.wallet}><IconWallet size={26} color={WHITE} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.title}>BookyPago Finanzas</Text>
            <Text style={s.subtitle}>Sistema de gestión financiera de BookyHome</Text>
          </View>
          <TouchableOpacity style={s.refresh} onPress={() => load(true)} accessibilityLabel="Actualizar información financiera">
            <IconRefresh size={17} color={WHITE} />
            <Text style={s.refreshText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.heroDivider} />
        <View style={s.balance}>
          <View style={{ flex: 1 }}>
            <Text style={s.balanceLabel}>Balance Actual</Text>
            <Text style={s.balanceValue} numberOfLines={1} adjustsFontSizeToFit>{money(balance.balance)}</Text>
          </View>
          <View style={s.balanceRight}>
            <Text style={s.balanceLabel}>Ingresos Totales</Text>
            <Text style={[s.balanceMini, { color: '#86EFAC' }]} numberOfLines={1} adjustsFontSizeToFit>{money(balance.ingresos_totales)}</Text>
            <Text style={[s.balanceLabel, { marginTop: 9 }]}>Pagos Totales</Text>
            <Text style={[s.balanceMini, { color: '#FDBA74' }]} numberOfLines={1} adjustsFontSizeToFit>{money(balance.pagos_totales)}</Text>
          </View>
        </View>
      </View>
      {!!error && <View style={s.error}><IconAlertTriangle size={18} color="#991B1B" /><Text style={s.errorText}>{error}</Text><TouchableOpacity onPress={() => load(true)}><Text style={s.retry}>Reintentar</Text></TouchableOpacity></View>}
      <View style={s.tabs}>{tabs.map(({ id, label, Icon }) => <TouchableOpacity key={id} onPress={() => setTab(id)} style={[s.tab, tab === id && s.tabActive]}><Icon size={16} color={tab === id ? WHITE : CARBON} /><Text style={[s.tabText, tab === id && s.tabTextActive]}>{label}</Text></TouchableOpacity>)}</View>
      <View style={s.body}>{loading ? <View style={s.loading}><ActivityIndicator size="large" color={VINOTINTO} /><Text style={s.loadingText}>Cargando información financiera...</Text></View> : <>
        {tab === 'balance' && <>
          <Text style={s.sectionTitle}>Desglose de ingresos</Text>
          <View style={s.incomeBreakdown}>
            <IncomeBreakdownCard label="Comisiones por ventas" value={money(balance.ingresos_por_tipo?.venta)} color={GREEN} backgroundColor={GREEN_BG} borderColor={GREEN_BORDER} subtitle="15% por orden con envío a domicilio" Icon={IconPackage} featured />
            <View style={s.incomeSecondary}>
              <IncomeBreakdownCard label="Cobros por planes" value={money(balance.ingresos_por_tipo?.plan)} color={BLUE} backgroundColor={BLUE_BG} borderColor={BLUE_BORDER} subtitle="Suscripciones de herramientas" Icon={IconStore} />
              <IncomeBreakdownCard label="Cobros por impulsos" value={money(balance.ingresos_por_tipo?.impulso)} color={PURPLE} backgroundColor={PURPLE_BG} borderColor={PURPLE_BORDER} subtitle="Destacados y visibilidad pagada" Icon={IconBolt} />
            </View>
          </View>
          {Number(balance.ingresos_totales) > 0 && <View style={s.distribution}>
            <Text style={s.distributionTitle}>Distribución de ingresos</Text>
            {[
              { label: 'Ventas', value: Number(balance.ingresos_por_tipo?.venta || 0), color: GREEN },
              { label: 'Planes', value: Number(balance.ingresos_por_tipo?.plan || 0), color: BLUE },
              { label: 'Impulsos', value: Number(balance.ingresos_por_tipo?.impulso || 0), color: PURPLE },
            ].map((item) => {
              const percentage = Math.min(100, (item.value / Number(balance.ingresos_totales)) * 100);
              return <View key={item.label} style={s.distributionRow}>
                <View style={s.distributionLabels}>
                  <Text style={s.distributionName}>{item.label}</Text>
                  <Text style={[s.distributionAmount, { color: item.color }]}>{percentage.toFixed(1)}% · {money(item.value)}</Text>
                </View>
                <View style={s.distributionTrack}><View style={[s.distributionFill, { width: `${percentage}%`, backgroundColor: item.color }]} /></View>
              </View>;
            })}
          </View>}
        </>}
        {tab === 'estadisticas' && <StatisticsPanel statistics={statistics} history={history} balance={balance} />}
        {tab === 'historial' && <>
          <Text style={s.sectionTitle}>Historial financiero · Últimos 30 días</Text>
          <Text style={s.subheading}>Ingresos registrados</Text>
          <PaginatedTransactions items={history.ingresos || []} income emptyMessage="No hay ingresos en los últimos 30 días" scrollToListTop={scrollToListTop} />
          <Text style={s.subheading}>Pagos operativos</Text>
          <PaginatedTransactions items={history.pagos || []} emptyMessage="Sin pagos operativos registrados" scrollToListTop={scrollToListTop} />
        </>}
        {tab === 'comisiones' && <>
          <Text style={s.sectionTitle}>Comisiones de BookyHome</Text>
          <Text style={s.panelIntro}>El comprador paga directamente al vendedor. BookyHome cobra su comisión sobre cada transacción: 15% en ventas con envío, y el cobro total en planes e impulsos.</Text>
          <View style={s.commissionSummary}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroMetricLabel}>TOTAL COMISIONES ACUMULADAS</Text>
              <Text style={s.commissionValue} numberOfLines={1} adjustsFontSizeToFit>{money(balance.ingresos_totales)}</Text>
            </View>
            <View style={s.commissionMetric}>
              <Text style={s.heroMetricLabel}>VENTAS PROCESADAS</Text>
              <Text style={s.commissionValue}>{statistics.ventas_totales ?? 0}</Text>
            </View>
          </View>
          <View style={s.grid}>
            <FinancialTile label="Comisiones por ventas" value={money(balance.ingresos_por_tipo?.venta)} color={GREEN} backgroundColor={GREEN_BG} borderColor={GREEN_BORDER} subtitle="15% sobre venta con domicilio" />
            <FinancialTile label="Cobros por planes" value={money(balance.ingresos_por_tipo?.plan)} color={BLUE} backgroundColor={BLUE_BG} borderColor={BLUE_BORDER} subtitle="100% del plan contratado" />
            <FinancialTile label="Cobros por impulsos" value={money(balance.ingresos_por_tipo?.impulso)} color={PURPLE} backgroundColor={PURPLE_BG} borderColor={PURPLE_BORDER} subtitle="100% del impulso contratado" />
          </View>
        </>}
      </>}</View>
      </ScrollView>
    </View>
  </View>;
}

const themeBaseS = StyleSheet.create({
  content: { padding: 14, paddingBottom: 36, backgroundColor: BEIGE },
  hero: { backgroundColor: VINOTINTO, borderRadius: 18, padding: 16, marginBottom: 14, elevation: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wallet: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 11, padding: 9 },
  title: { color: WHITE, fontSize: 17, fontWeight: '800' },
  subtitle: { color: WHITE, opacity: 0.78, fontSize: 10, marginTop: 3 },
  refresh: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 9, padding: 8, alignItems: 'center', gap: 2 },
  refreshText: { color: WHITE, fontSize: 9, fontWeight: '700' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 15 },
  balance: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  balanceLabel: { color: WHITE, fontSize: 10, opacity: 0.78, fontWeight: '600' },
  balanceValue: { color: WHITE, fontSize: 27, fontWeight: '900', marginTop: 5 },
  balanceRight: { alignItems: 'flex-end', maxWidth: '48%' },
  balanceMini: { fontSize: 14, fontWeight: '900', marginTop: 3 },
  error: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: '#991B1B', fontSize: 12, flex: 1 },
  retry: { color: VINOTINTO, fontWeight: '800', fontSize: 12 },
  tabs: { backgroundColor: WHITE, borderRadius: 13, padding: 5, flexDirection: 'row', marginBottom: 14, elevation: 2 },
  tab: { flex: 1, minHeight: 55, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 1 },
  tabActive: { backgroundColor: VINOTINTO },
  tabText: { color: CARBON, fontSize: 8, fontWeight: '700', marginTop: 3, textAlign: 'center' },
  tabTextActive: { color: WHITE },
  body: { backgroundColor: WHITE, borderRadius: 16, padding: 16, elevation: 2, minHeight: 250 },
  loading: { alignItems: 'center', paddingTop: 65 },
  loadingText: { color: GRAY, marginTop: 12, fontSize: 12 },
  sectionTitle: { color: CARBON, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  panelIntro: { color: GRAY, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  tile: { width: '48%', borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, padding: 12, minHeight: 98, justifyContent: 'center' },
  incomeBreakdown: { gap: 10 },
  incomeSecondary: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  incomeCard: { borderRadius: 12, borderWidth: 1.5, padding: 11 },
  incomeCardFeatured: { minHeight: 104 },
  incomeCardCompact: { width: '48%', minHeight: 115 },
  incomeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  incomeIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  incomeLabel: { color: CARBON, fontSize: 10, fontWeight: '800', flex: 1 },
  incomeSubtitle: { color: GRAY, fontSize: 9, lineHeight: 13, marginTop: 5 },
  incomeValue: { fontSize: 15, fontWeight: '900', marginTop: 8 },
  tileLabel: { color: GRAY, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  tileValue: { fontSize: 17, fontWeight: '900', marginTop: 7 },
  tileSubtitle: { color: GRAY, fontSize: 9, lineHeight: 13, marginTop: 5 },
  statsOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 9, marginBottom: 15 },
  statsOption: { width: '48%', borderRadius: 12, borderWidth: 1.5, padding: 11 },
  statsOptionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsOptionLabel: { fontSize: 11, fontWeight: '800' },
  statsOptionValue: { color: CARBON, fontSize: 15, fontWeight: '900', marginTop: 8 },
  statsOptionSub: { color: GRAY, fontSize: 9, marginTop: 4 },
  chartCard: { backgroundColor: '#FAF9F7', borderWidth: 1, borderColor: BORDER, borderRadius: 13, padding: 11 },
  chartSummary: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 5 },
  chartBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  chartBadgeText: { fontSize: 9, fontWeight: '800' },
  selectedDayText: { color: CARBON, fontSize: 10, fontWeight: '700', marginTop: 7 },
  chartTotals: { alignItems: 'flex-end', maxWidth: '52%' },
  chartTotalLabel: { color: GRAY, fontSize: 8, fontWeight: '700' },
  chartTotalValue: { fontSize: 13, fontWeight: '900', marginVertical: 2 },
  dayPicker: { gap: 6, paddingVertical: 4 },
  dayButton: { backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 5 },
  dayButtonText: { color: GRAY, fontSize: 9, fontWeight: '700' },
  chartHint: { color: GRAY, fontSize: 9, textAlign: 'center', marginTop: 1 },
  subheading: { color: CARBON, fontSize: 14, fontWeight: '800', marginTop: 13, marginBottom: 7 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 11, paddingBottom: 5 },
  paginationSummary: { color: GRAY, fontSize: 9, flex: 1 },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageButton: { width: 30, height: 30, borderWidth: 1, borderColor: VINOTINTO, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE },
  pageButtonDisabled: { borderColor: BORDER, backgroundColor: '#F5F5F4' },
  pageButtonText: { color: VINOTINTO, fontSize: 20, fontWeight: '700', lineHeight: 23 },
  pageButtonTextDisabled: { color: '#A8A29E' },
  pageIndicator: { color: CARBON, fontSize: 10, fontWeight: '800', minWidth: 32, textAlign: 'center' },
  transaction: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 11, gap: 9 },
  typeIcon: { padding: 8, borderRadius: 10 },
  transactionTitle: { color: CARBON, fontSize: 12, fontWeight: '800' },
  transactionDate: { color: GRAY, fontSize: 9, marginTop: 3 },
  transactionValue: { fontSize: 12, fontWeight: '800' },
  status: { borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, marginTop: 5 },
  statusText: { fontSize: 9, fontWeight: '700' },
  empty: { color: GRAY, textAlign: 'center', paddingVertical: 22, fontSize: 12 },
  distribution: { backgroundColor: BEIGE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, marginTop: 18 },
  distributionTitle: { color: CARBON, fontSize: 13, fontWeight: '800', marginBottom: 12 },
  distributionRow: { marginBottom: 12 },
  distributionLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginBottom: 5 },
  distributionName: { color: CARBON, fontSize: 10, fontWeight: '700' },
  distributionAmount: { fontSize: 10, fontWeight: '800', textAlign: 'right' },
  distributionTrack: { height: 7, backgroundColor: '#E5E0D9', borderRadius: 10, overflow: 'hidden' },
  distributionFill: { height: '100%', borderRadius: 10 },
  commissionSummary: { backgroundColor: VINOTINTO, borderRadius: 14, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  heroMetricLabel: { color: WHITE, opacity: 0.78, fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
  commissionMetric: { alignItems: 'flex-end' },
  commissionValue: { color: WHITE, fontSize: 20, fontWeight: '900', marginTop: 5 },
});
const s = themeBaseS;
