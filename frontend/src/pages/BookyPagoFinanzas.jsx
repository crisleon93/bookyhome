import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { notify } from '../components/ToastProvider';
import {
  IconWallet, IconTrendingUp, IconRefresh,
  IconPackage, IconStore, IconBolt, IconChartBar
} from '../components/Icons';

const VINOTINTO      = '#7A1E3A';
const VINOTINTO_DARK = '#5e1629';
const BEIGE          = '#F4EDE2';
const CARBON         = '#2A2A2A';
const GRAY           = '#888';
const WHITE          = '#FFFFFF';
const BORDER         = '#E8E2DB';
const GREEN          = '#16a34a';
const GREEN_BG       = '#f0fdf4';
const GREEN_BORDER   = '#bbf7d0';
const ORANGE         = '#ea580c';
const ORANGE_BG      = '#fff7ed';
const ORANGE_BORDER  = '#fed7aa';
const BLUE           = '#0369a1';
const BLUE_BG        = '#f0f9ff';
const BLUE_BORDER    = '#bae6fd';
const PURPLE         = '#7c3aed';
const PURPLE_BG      = '#f5f3ff';
const PURPLE_BORDER  = '#ddd6fe';

/* ─── helpers ──────────────────────────────────────────────── */
function fmt(v) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(v || 0);
}

function Badge({ tipo }) {
  const cfg = {
    venta:   { label: 'Venta',   bg: GREEN_BG,   color: GREEN,  border: GREEN_BORDER,  icon: <IconPackage width={12} height={12} strokeWidth={2.5} /> },
    plan:    { label: 'Plan',    bg: BLUE_BG,    color: BLUE,   border: BLUE_BORDER,   icon: <IconStore   width={12} height={12} strokeWidth={2.5} /> },
    impulso: { label: 'Impulso', bg: PURPLE_BG,  color: PURPLE, border: PURPLE_BORDER, icon: <IconBolt    width={12} height={12} strokeWidth={2.5} /> },
  }[tipo] || { label: tipo, bg: BEIGE, color: GRAY, border: BORDER, icon: null };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function KpiCard({ label, value, color, colorBg, colorBorder, icon, sub }) {
  return (
    <div style={{
      background: WHITE, borderRadius: 16,
      border: `1.5px solid ${colorBorder || BORDER}`,
      boxShadow: '0 3px 14px rgba(122,30,58,0.07)',
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 10,
      borderTop: `4px solid ${color}`,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: colorBg, display: 'grid', placeItems: 'center',
          color: color, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: CARBON, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.78rem', color: GRAY, fontWeight: 500 }}>{sub}</div>
      )}
    </div>
  );
}

/* ─── EstadisticasTab ───────────────────────────────────────── */
function EstadisticasTab({ estadisticas, historial, balance }) {
  // Opciones seleccionables: todo | venta | plan | impulso
  const [filtro, setFiltro] = React.useState('todo');
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  /* Construir series de los últimos 30 días desde historial.ingresos */
  const serie = React.useMemo(() => {
    const ahora = new Date();
    const dias = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(ahora);
      d.setDate(d.getDate() - i);
      dias.push({
        key:   d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
        valor: 0,
        count: 0,
      });
    }
    const mapa = {};
    dias.forEach(d => { mapa[d.key] = d; });

    const ingresos = historial?.ingresos || [];
    ingresos.forEach(ing => {
      if (filtro !== 'todo' && ing.tipo !== filtro) return;
      const key = (ing.fecha || '').slice(0, 10);
      if (mapa[key]) {
        mapa[key].valor += parseFloat(ing.comision ?? ing.monto ?? 0);
        mapa[key].count += 1;
      }
    });
    return dias;
  }, [historial, filtro]);

  const maxVal = Math.max(...serie.map(d => d.valor), 1);

  /* SVG layout */
  const svgW    = 900;
  const svgH    = 220;
  const padLeft = 70;
  const padRight = 20;
  const padTop  = 20;
  const padBot  = 42;
  const plotW   = svgW - padLeft - padRight;
  const plotH   = svgH - padTop - padBot;
  const nPts    = serie.length;

  const pts = serie.map((d, i) => ({
    x: padLeft + (i / (nPts - 1)) * plotW,
    y: padTop + plotH - (d.valor / maxVal) * plotH,
    ...d,
  }));

  /* Curva suave tipo spline monotona (bezier) */
  function buildPath(points) {
    if (!points.length) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = (points[i - 1].x + points[i].x) / 2;
      const cp1y = points[i - 1].y;
      const cp2x = (points[i - 1].x + points[i].x) / 2;
      const cp2y = points[i].y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  const linePath = buildPath(pts);
  const areaPath = linePath
    + ` L ${pts[pts.length - 1].x} ${padTop + plotH}`
    + ` L ${pts[0].x} ${padTop + plotH} Z`;

  /* Totales del filtro */
  const totalFiltro = serie.reduce((s, d) => s + d.valor, 0);
  const countFiltro = serie.reduce((s, d) => s + d.count, 0);

  const fmtEjeY = (v) => {
    if (v === 0) return { val: '0', suf: '' };
    if (v >= 1_000_000) return { val: (v / 1_000_000).toFixed(1), suf: 'M' };
    if (v >= 1_000)     return { val: Math.round(v / 1_000).toString(), suf: 'k' };
    return { val: Math.round(v).toString(), suf: '' };
  };

  /* Config de cada opción */
  const OPTS = [
    { id: 'todo',    label: 'Todo',     color: VINOTINTO,  colorBg: '#fdf2f4',  colorBorder: '#f5c6d2',  icon: <IconChartBar width={16} height={16} strokeWidth={2.2} />, value: fmt(balance?.ingresos_totales), sub: 'Total acumulado' },
    { id: 'venta',   label: 'Ventas',   color: GREEN,       colorBg: GREEN_BG,   colorBorder: GREEN_BORDER,   icon: <IconPackage width={16} height={16} strokeWidth={2.2} />, value: fmt(balance?.ingresos_por_tipo?.venta), sub: 'Comisiones 15%' },
    { id: 'plan',    label: 'Planes',   color: BLUE,        colorBg: BLUE_BG,    colorBorder: BLUE_BORDER,    icon: <IconStore   width={16} height={16} strokeWidth={2.2} />, value: fmt(balance?.ingresos_por_tipo?.plan),  sub: 'Suscripciones' },
    { id: 'impulso', label: 'Impulsos', color: PURPLE,      colorBg: PURPLE_BG,  colorBorder: PURPLE_BORDER,  icon: <IconBolt    width={16} height={16} strokeWidth={2.2} />, value: fmt(balance?.ingresos_por_tipo?.impulso), sub: 'Visibilidad paga' },
  ];

  const activeCfg = OPTS.find(o => o.id === filtro);

  /* Hover */
  const hItem = hoveredIdx !== null ? pts[hoveredIdx] : null;

  return (
    <div>
      <h3 style={{ margin: '0 0 6px', color: CARBON, fontSize: '1.05rem', fontWeight: 800 }}>
        Estadísticas Financieras
      </h3>
      <p style={{ margin: '0 0 20px', color: GRAY, fontSize: '0.83rem' }}>
        Selecciona una categoría para ver su evolución en los últimos 30 días
      </p>

      {/* ── Selector de categoría ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
        {OPTS.map(opt => {
          const active = filtro === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => { setFiltro(opt.id); setHoveredIdx(null); }}
              style={{
                background: active ? opt.colorBg : WHITE,
                border: `${active ? 2 : 1.5}px solid ${active ? opt.color : BORDER}`,
                borderRadius: 14,
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s',
                boxShadow: active ? `0 4px 16px ${opt.color}22` : '0 1px 4px rgba(0,0,0,0.04)',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{
                  fontSize: '0.73rem', fontWeight: 700, color: active ? opt.color : GRAY,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{opt.label}</span>
                <div style={{ color: opt.color, opacity: active ? 1 : 0.5 }}>{opt.icon}</div>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: CARBON, lineHeight: 1 }}>{opt.value}</div>
              <div style={{ fontSize: '0.73rem', color: GRAY, marginTop: 4 }}>{opt.sub}</div>
            </button>
          );
        })}
      </div>

      {/* ── Gráfica SVG ── */}
      <div style={{
        background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 16,
        padding: '20px 20px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        position: 'relative',
      }}>
        {/* Header de la gráfica */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: activeCfg.colorBg, color: activeCfg.color,
              border: `1px solid ${activeCfg.colorBorder}`,
              borderRadius: 20, padding: '5px 14px', fontSize: '0.8rem', fontWeight: 800,
            }}>
              {activeCfg.icon} {activeCfg.label} · últimos 30 días
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase' }}>Período total</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: activeCfg.color }}>{fmt(totalFiltro)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase' }}>Registros</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: CARBON }}>{countFiltro}</div>
            </div>
          </div>
        </div>

        {/* Tooltip hover */}
        {hItem && (
          <div style={{
            position: 'absolute', top: 68,
            left: Math.min(Math.max(hItem.x / svgW * 100, 10), 80) + '%',
            transform: 'translateX(-50%)',
            background: WHITE, border: `1.5px solid ${activeCfg.color}44`,
            borderRadius: 10, padding: '8px 14px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            pointerEvents: 'none', zIndex: 10,
            minWidth: 130,
          }}>
            <div style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 600, marginBottom: 3 }}>{hItem.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: activeCfg.color }}>{fmt(hItem.valor)}</div>
            <div style={{ fontSize: '0.72rem', color: GRAY }}>{hItem.count} registro{hItem.count !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* SVG chart */}
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ width: '100%', display: 'block', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="finGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor={activeCfg.color} stopOpacity="0.22" />
              <stop offset="80%"  stopColor={activeCfg.color} stopOpacity="0.03" />
              <stop offset="100%" stopColor={activeCfg.color} stopOpacity="0" />
            </linearGradient>
            <filter id="finGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={activeCfg.color} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Líneas guía Y */}
          {[1, 0.5, 0].map((r, i) => {
            const yPos = padTop + plotH - r * plotH;
            const { val, suf } = fmtEjeY(maxVal * r);
            return (
              <g key={i}>
                <line x1={padLeft} y1={yPos} x2={svgW - padRight} y2={yPos}
                  stroke="#ede8e3" strokeDasharray={r === 0 ? 'none' : '4 4'}
                  strokeWidth={r === 0 ? 1.2 : 1} />
                <text x={padLeft - 6} y={yPos + 4} textAnchor="end"
                  fontSize="11" fill="#a8a29e" fontWeight="700" fontFamily="Montserrat,sans-serif">
                  ${val}{suf}
                </text>
              </g>
            );
          })}

          {/* Área rellena */}
          <path d={areaPath} fill="url(#finGrad)" />

          {/* Línea principal */}
          <path d={linePath} fill="none"
            stroke={activeCfg.color} strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            filter="url(#finGlow)" />

          {/* Puntos interactivos */}
          {pts.map((p, i) => {
            const isH = hoveredIdx === i;
            const show = nPts <= 15 || isH || i === 0 || i === nPts - 1 || (i + 1) % 7 === 0;
            return (
              <g key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* zona clickable amplia */}
                <circle cx={p.x} cy={p.y} r={12} fill="transparent" />

                {/* punto visible */}
                {(isH || p.valor > 0) && (
                  <>
                    {isH && (
                      <>
                        <line x1={p.x} y1={padTop} x2={p.x} y2={padTop + plotH}
                          stroke={activeCfg.color} strokeOpacity="0.2"
                          strokeDasharray="3 3" strokeWidth="1.2" />
                        <circle cx={p.x} cy={p.y} r={9} fill={activeCfg.color} opacity="0.15" />
                      </>
                    )}
                    <circle cx={p.x} cy={p.y}
                      r={isH ? 5.5 : 3.5}
                      fill={activeCfg.color}
                      stroke={WHITE} strokeWidth={isH ? 2 : 1.5}
                      style={{ transition: 'all 0.15s' }} />
                  </>
                )}

                {/* Etiqueta eje X */}
                {show && (
                  <text x={p.x} y={padTop + plotH + 18} textAnchor="middle"
                    fontSize={isH ? 11 : 9.5}
                    fontWeight={isH ? 800 : 600}
                    fill={isH ? activeCfg.color : '#a8a29e'}
                    fontFamily="Montserrat,sans-serif">
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.75rem', color: GRAY }}>
          * Pasa el cursor sobre un punto para ver el detalle del día
        </p>
      </div>

      {/* ── KPIs adicionales debajo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginTop: 20 }}>
        <KpiCard label="Ingresos 30 días"     value={fmt(estadisticas.ingresos_30_dias)}    color={GREEN}   colorBg={GREEN_BG}   colorBorder={GREEN_BORDER}   icon={<IconTrendingUp width={18} height={18} strokeWidth={2.2} />} />
        <KpiCard label="Promedio diario"      value={fmt(estadisticas.promedio_diario)}     color={VINOTINTO} colorBg='#fdf2f4' colorBorder='#f5c6d2'        icon={<IconChartBar   width={18} height={18} strokeWidth={2.2} />} />
        <KpiCard label="Ventas procesadas"    value={estadisticas.ventas_totales    ?? 0}  color={GREEN}   colorBg={GREEN_BG}   colorBorder={GREEN_BORDER}   icon={<IconPackage    width={18} height={18} strokeWidth={2.2} />} sub="En el período" />
        <KpiCard label="Planes contratados"   value={estadisticas.planes_activos    ?? 0}  color={BLUE}    colorBg={BLUE_BG}    colorBorder={BLUE_BORDER}    icon={<IconStore      width={18} height={18} strokeWidth={2.2} />} sub="En el período" />
        <KpiCard label="Impulsos contratados" value={estadisticas.impulsos_comprados ?? 0} color={PURPLE}  colorBg={PURPLE_BG}  colorBorder={PURPLE_BORDER}  icon={<IconBolt       width={18} height={18} strokeWidth={2.2} />} sub="En el período" />
      </div>
    </div>
  );
}

/* ─── main component ────────────────────────────────────────── */
export default function BookyPagoFinanzas({ defaultTab = 'balance' }) {
  const [activeTab,      setActiveTab]      = useState(defaultTab);
  const [balance,        setBalance]        = useState({});
  const [estadisticas,   setEstadisticas]   = useState({});
  const [historial,      setHistorial]      = useState({});
  const [, setNomina]                       = useState({});
  const [cuentasBancarias]                  = useState({});
  const [showPaymentModal,  setShowPaymentModal]  = useState(false);
  const [selectedVendedor,  setSelectedVendedor]  = useState(null);
  const [selectedCuentaId,  setSelectedCuentaId]  = useState(null);
  const [cuentaExito,       setCuentaExito]       = useState(null);
  const [mostrarExitoPago,  setMostrarExitoPago]  = useState(false);
  const [cargando,          setCargando]          = useState(false);

  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        api.get('/api/v1/bookypago-finanzas/balance'),
        api.get('/api/v1/bookypago-finanzas/estadisticas'),
        api.get('/api/v1/bookypago-finanzas/historial?dias=30'),
      ]);
      setBalance(r1.data.balance);
      setEstadisticas(r2.data.estadisticas);
      setHistorial(r3.data.historial);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const cargarNomina = async () => {
    try { const r = await api.get('/api/v1/bookypago-finanzas/nomina'); setNomina(r.data.nomina); }
    catch {}
  };

  const confirmarProcesarNomina = async () => {
    if (!selectedCuentaId) { notify('El vendedor no tiene cuenta bancaria registrada', 'error'); return; }
    try {
      const r = await api.post(`/api/v1/bookypago-finanzas/nomina/procesar/${selectedVendedor}`, { id_metodo: selectedCuentaId });
      if (r.data.ok) {
        setCuentaExito(r.data.cuenta_bancaria || null);
        setShowPaymentModal(false); setSelectedVendedor(null); setSelectedCuentaId(null);
        setMostrarExitoPago(true);
        cargarNomina(); cargarTodo();
        setTimeout(() => { setMostrarExitoPago(false); setCuentaExito(null); }, 5000);
      }
    } catch (e) { notify(e.response?.data?.detail || 'Error procesando nómina', 'error'); }
  };

  useEffect(() => { cargarTodo(); }, []);

  const TABS = [
    { id: 'balance',      label: 'Balance',      icon: IconWallet   },
    { id: 'estadisticas', label: 'Estadísticas', icon: IconChartBar },
    { id: 'historial',    label: 'Historial',    icon: IconTrendingUp },
    { id: 'comisiones',   label: 'Comisiones',   icon: IconStore    },
  ];

  /* porcentajes del total para las barras de comisiones */
  const totalIngresos = balance.ingresos_totales || 0;
  const pctVenta   = totalIngresos ? Math.round(((balance.ingresos_por_tipo?.venta   || 0) / totalIngresos) * 100) : 0;
  const pctPlan    = totalIngresos ? Math.round(((balance.ingresos_por_tipo?.plan    || 0) / totalIngresos) * 100) : 0;
  const pctImpulso = totalIngresos ? Math.round(((balance.ingresos_por_tipo?.impulso || 0) / totalIngresos) * 100) : 0;

  return (
    <div style={{ padding: '28px 24px', background: BEIGE, minHeight: '100vh', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── HERO BANNER ──────────────────────────────────────── */}
        <div style={{
          background: `linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO_DARK} 100%)`,
          borderRadius: 20,
          padding: '32px 36px',
          color: WHITE,
          boxShadow: '0 8px 32px rgba(122,30,58,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative circles */}
          <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
          <div style={{ position:'absolute', bottom:-60, right:80, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:20, position:'relative' }}>
            {/* left: título + balance */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.15)', display:'grid', placeItems:'center', backdropFilter:'blur(6px)' }}>
                  <IconWallet width={26} height={26} strokeWidth={2} style={{ color:WHITE }} />
                </div>
                <div>
                  <h1 style={{ margin:0, fontSize:'1.35rem', fontWeight:900, letterSpacing:'-0.02em' }}>BookyPago Finanzas</h1>
                  <p style={{ margin:0, fontSize:'0.8rem', opacity:0.75 }}>Sistema de gestión financiera · BookyHome</p>
                </div>
              </div>

              <p style={{ margin:'0 0 6px', fontSize:'0.82rem', opacity:0.7, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Balance Total BookyHome</p>
              <div style={{ fontSize:'2.6rem', fontWeight:900, lineHeight:1, letterSpacing:'-0.03em' }}>
                {fmt(balance.balance)}
              </div>
              <p style={{ margin:'10px 0 0', fontSize:'0.82rem', opacity:0.65 }}>Comisiones acumuladas desde el inicio</p>
            </div>

            {/* right: mini KPIs + botón */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:16 }}>
              <button
                onClick={cargarTodo}
                disabled={cargando}
                style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  background:'rgba(255,255,255,0.15)', color:WHITE,
                  border:'1.5px solid rgba(255,255,255,0.3)',
                  borderRadius:10, padding:'9px 18px',
                  cursor:'pointer', fontSize:'0.85rem', fontWeight:700,
                  backdropFilter:'blur(6px)', transition:'all 0.2s',
                }}
              >
                <IconRefresh width={15} height={15} strokeWidth={2.5} style={{ animation: cargando ? 'spin 1s linear infinite' : 'none' }} />
                {cargando ? 'Cargando…' : 'Actualizar'}
              </button>

              <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'flex-end' }}>
                {[
                  { label:'Ingresos totales', value: fmt(balance.ingresos_totales), color:'#4ade80' },
                  { label:'Pagos operativos', value: fmt(balance.pagos_totales),   color:'#fbbf24' },
                ].map(k => (
                  <div key={k.label} style={{
                    background:'rgba(255,255,255,0.1)', borderRadius:12,
                    padding:'12px 18px', textAlign:'center', minWidth:130,
                    backdropFilter:'blur(6px)',
                  }}>
                    <div style={{ fontSize:'0.73rem', opacity:0.75, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{k.label}</div>
                    <div style={{ fontSize:'1.15rem', fontWeight:900, color:k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────── */}
        <div style={{
          background: WHITE, borderRadius: 14,
          padding: '6px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          display: 'flex', gap: 4,
          border: `1px solid ${BORDER}`,
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '11px 12px', border: 'none',
                  borderRadius: 10,
                  background: active ? `linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO_DARK} 100%)` : 'transparent',
                  color: active ? WHITE : GRAY,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  fontSize: '0.85rem', fontWeight: active ? 800 : 600,
                  transition: 'all 0.2s',
                  boxShadow: active ? '0 4px 14px rgba(122,30,58,0.3)' : 'none',
                }}
              >
                <tab.icon width={16} height={16} strokeWidth={2.2} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT ──────────────────────────────────────── */}
        <div style={{
          background: WHITE, borderRadius: 20,
          boxShadow: '0 3px 18px rgba(0,0,0,0.07)',
          border: `1px solid ${BORDER}`,
          padding: '28px 30px',
        }}>

          {/* ── Balance ─── */}
          {activeTab === 'balance' && (
            <div>
              <h3 style={{ margin:'0 0 20px', color:CARBON, fontSize:'1.05rem', fontWeight:800 }}>
                Desglose de Ingresos
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                <KpiCard
                  label="Comisiones por Ventas"
                  value={fmt(balance.ingresos_por_tipo?.venta)}
                  color={GREEN} colorBg={GREEN_BG} colorBorder={GREEN_BORDER}
                  icon={<IconPackage width={18} height={18} strokeWidth={2.2} />}
                  sub="15% por orden con envío a domicilio"
                />
                <KpiCard
                  label="Cobros por Planes"
                  value={fmt(balance.ingresos_por_tipo?.plan)}
                  color={BLUE} colorBg={BLUE_BG} colorBorder={BLUE_BORDER}
                  icon={<IconStore width={18} height={18} strokeWidth={2.2} />}
                  sub="Suscripciones de herramientas"
                />
                <KpiCard
                  label="Cobros por Impulsos"
                  value={fmt(balance.ingresos_por_tipo?.impulso)}
                  color={PURPLE} colorBg={PURPLE_BG} colorBorder={PURPLE_BORDER}
                  icon={<IconBolt width={18} height={18} strokeWidth={2.2} />}
                  sub="Destacados y visibilidad pagada"
                />
              </div>

              {/* Barra de distribución */}
              {totalIngresos > 0 && (
                <div style={{ marginTop:28, padding:'20px 22px', background: BEIGE, borderRadius:14, border:`1px solid ${BORDER}` }}>
                  <p style={{ margin:'0 0 14px', fontWeight:700, fontSize:'0.88rem', color:CARBON }}>Distribución de ingresos</p>
                  {[
                    { label:'Ventas',   pct: pctVenta,   color: GREEN,  amount: balance.ingresos_por_tipo?.venta   || 0 },
                    { label:'Planes',   pct: pctPlan,    color: BLUE,   amount: balance.ingresos_por_tipo?.plan    || 0 },
                    { label:'Impulsos', pct: pctImpulso, color: PURPLE, amount: balance.ingresos_por_tipo?.impulso || 0 },
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:'0.82rem', fontWeight:600, color:CARBON }}>{r.label}</span>
                        <span style={{ fontSize:'0.82rem', fontWeight:700, color:r.color }}>{r.pct}% · {fmt(r.amount)}</span>
                      </div>
                      <div style={{ background:'#e5e0d9', borderRadius:20, height:8, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', borderRadius:20,
                          background: `linear-gradient(90deg, ${r.color}, ${r.color}99)`,
                          width:`${r.pct}%`, transition:'width 0.6s cubic-bezier(.4,0,.2,1)',
                          boxShadow:`0 2px 6px ${r.color}44`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Estadísticas ─── */}
          {activeTab === 'estadisticas' && (
            <EstadisticasTab
              estadisticas={estadisticas}
              historial={historial}
              balance={balance}
            />
          )}

          {/* ── Historial ─── */}
          {activeTab === 'historial' && (
            <div>
              <h3 style={{ margin:'0 0 20px', color:CARBON, fontSize:'1.05rem', fontWeight:800 }}>
                Historial Financiero · Últimos 30 días
              </h3>

              <p style={{ margin:'0 0 16px', fontWeight:700, fontSize:'0.9rem', color:CARBON }}>Ingresos registrados</p>
              {historial.ingresos && historial.ingresos.length > 0 ? (
                <div style={{ overflowX:'auto', marginBottom:28 }}>
                  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px' }}>
                    <thead>
                      <tr>
                        {['Fecha','Tipo','Comisión BookyHome','Venta Total','Estado'].map(h => (
                          <th key={h} style={{
                            padding:'10px 14px', textAlign: h === 'Comisión BookyHome' || h === 'Venta Total' ? 'right' : h === 'Estado' ? 'center' : 'left',
                            fontSize:'0.75rem', fontWeight:700, color:GRAY,
                            textTransform:'uppercase', letterSpacing:'0.06em',
                            borderBottom:`2px solid ${BORDER}`, background:WHITE,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historial.ingresos.map((ing, i) => (
                        <tr key={ing.id ?? i} style={{ background: i % 2 === 0 ? WHITE : '#faf8f5' }}>
                          <td style={{ padding:'12px 14px', fontSize:'0.82rem', color:GRAY, whiteSpace:'nowrap' }}>
                            {new Date(ing.fecha).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <Badge tipo={ing.tipo} />
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:800, color:GREEN, fontSize:'0.9rem' }}>
                            {fmt(ing.comision ?? ing.monto)}
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontSize:'0.82rem', color:GRAY }}>
                            {ing.monto_venta != null ? fmt(ing.monto_venta) : '—'}
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'center' }}>
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:5,
                              background:GREEN_BG, color:GREEN, border:`1px solid ${GREEN_BORDER}`,
                              borderRadius:20, padding:'3px 10px', fontSize:'0.73rem', fontWeight:700,
                            }}>
                              <span style={{ width:6, height:6, borderRadius:'50%', background:GREEN, display:'inline-block' }} />
                              {(ing.estado || 'procesado').charAt(0).toUpperCase() + (ing.estado || 'procesado').slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'40px 20px', color:GRAY, background:BEIGE, borderRadius:12, marginBottom:24 }}>
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>📋</div>
                  <p style={{ margin:0, fontWeight:600 }}>No hay ingresos en los últimos 30 días</p>
                </div>
              )}

              <p style={{ margin:'0 0 16px', fontWeight:700, fontSize:'0.9rem', color:CARBON }}>Pagos operativos</p>
              {historial.pagos && historial.pagos.length > 0 ? (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px' }}>
                    <thead>
                      <tr>
                        {['Fecha','Tipo','Monto','Estado'].map(h => (
                          <th key={h} style={{
                            padding:'10px 14px', textAlign: h === 'Monto' ? 'right' : h === 'Estado' ? 'center' : 'left',
                            fontSize:'0.75rem', fontWeight:700, color:GRAY,
                            textTransform:'uppercase', letterSpacing:'0.06em',
                            borderBottom:`2px solid ${BORDER}`,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historial.pagos.map((pag, i) => (
                        <tr key={pag.id ?? i} style={{ background: i % 2 === 0 ? WHITE : '#faf8f5' }}>
                          <td style={{ padding:'12px 14px', fontSize:'0.82rem', color:GRAY, whiteSpace:'nowrap' }}>
                            {new Date(pag.fecha).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}
                          </td>
                          <td style={{ padding:'12px 14px', fontSize:'0.86rem', color:CARBON, fontWeight:600 }}>
                            {pag.tipo.charAt(0).toUpperCase() + pag.tipo.slice(1)}
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:800, color:ORANGE, fontSize:'0.9rem' }}>
                            {fmt(pag.monto)}
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'center' }}>
                            <span style={{
                              background:GREEN_BG, color:GREEN, border:`1px solid ${GREEN_BORDER}`,
                              borderRadius:20, padding:'3px 10px', fontSize:'0.73rem', fontWeight:700,
                            }}>
                              {(pag.estado || '').charAt(0).toUpperCase() + (pag.estado || '').slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'32px 20px', color:GRAY, background:BEIGE, borderRadius:12 }}>
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>✅</div>
                  <p style={{ margin:0, fontWeight:600 }}>Sin pagos operativos registrados</p>
                </div>
              )}
            </div>
          )}

          {/* ── Comisiones ─── */}
          {activeTab === 'comisiones' && (
            <div>
              <h3 style={{ margin:'0 0 6px', color:CARBON, fontSize:'1.05rem', fontWeight:800 }}>Comisiones de BookyHome</h3>
              <p style={{ margin:'0 0 24px', color:GRAY, fontSize:'0.85rem', lineHeight:1.6 }}>
                El comprador paga directamente al vendedor. BookyHome cobra su comisión sobre cada transacción: <strong>15 %</strong> en ventas con envío, cobro total en planes e impulsos.
              </p>

              {/* Resumen grande */}
              <div style={{
                background:`linear-gradient(135deg, ${VINOTINTO} 0%, ${VINOTINTO_DARK} 100%)`,
                borderRadius:16, padding:'24px 28px', color:WHITE, marginBottom:20,
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16,
                boxShadow:'0 6px 24px rgba(122,30,58,0.25)',
              }}>
                <div>
                  <p style={{ margin:'0 0 4px', fontSize:'0.78rem', opacity:0.75, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Total comisiones acumuladas</p>
                  <div style={{ fontSize:'2rem', fontWeight:900 }}>{fmt(balance.ingresos_totales)}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:'0 0 4px', fontSize:'0.78rem', opacity:0.75, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Ventas procesadas</p>
                  <div style={{ fontSize:'2rem', fontWeight:900 }}>{estadisticas.ventas_totales ?? 0}</div>
                </div>
              </div>

              {/* Tarjetas por tipo */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
                {[
                  { label:'Comisiones por Ventas', amount: balance.ingresos_por_tipo?.venta || 0, color:GREEN, colorBg:GREEN_BG, colorBorder:GREEN_BORDER, icon:<IconPackage width={22} height={22} strokeWidth={2} />, sub:'15% s/ venta con domicilio' },
                  { label:'Cobros por Planes',      amount: balance.ingresos_por_tipo?.plan  || 0, color:BLUE,  colorBg:BLUE_BG,  colorBorder:BLUE_BORDER,  icon:<IconStore   width={22} height={22} strokeWidth={2} />, sub:'100% del plan contratado' },
                  { label:'Cobros por Impulsos',    amount: balance.ingresos_por_tipo?.impulso || 0, color:PURPLE, colorBg:PURPLE_BG, colorBorder:PURPLE_BORDER, icon:<IconBolt width={22} height={22} strokeWidth={2} />, sub:'100% del impulso contratado' },
                ].map(c => (
                  <div key={c.label} style={{
                    background:c.colorBg, border:`1.5px solid ${c.colorBorder}`,
                    borderRadius:14, padding:'20px 22px',
                    display:'flex', flexDirection:'column', gap:12,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'0.78rem', fontWeight:700, color:c.color, textTransform:'uppercase', letterSpacing:'0.05em' }}>{c.label}</span>
                      <div style={{ color:c.color }}>{c.icon}</div>
                    </div>
                    <div style={{ fontSize:'1.5rem', fontWeight:900, color:CARBON }}>{fmt(c.amount)}</div>
                    <div style={{ fontSize:'0.75rem', color:GRAY }}>{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL cuenta bancaria ─────────────────────────────── */}
      {showPaymentModal && selectedVendedor && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <div style={{ background:WHITE, borderRadius:20, padding:'30px', maxWidth:540, width:'95%', maxHeight:'80vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, color:CARBON, fontSize:'1.25rem', fontWeight:800 }}>Procesar Pago #{selectedVendedor}</h3>
              <button onClick={() => { setShowPaymentModal(false); setSelectedVendedor(null); setSelectedCuentaId(null); }}
                style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer', color:GRAY, width:34, height:34, borderRadius:'50%', display:'grid', placeItems:'center' }}>×</button>
            </div>
            <p style={{ margin:'0 0 20px', color:GRAY, fontSize:'0.9rem' }}>Cuenta bancaria del vendedor para recibir el pago:</p>
            {cuentasBancarias[selectedVendedor]?.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {cuentasBancarias[selectedVendedor].map(cuenta => {
                  const sel = selectedCuentaId === cuenta.id_metodo;
                  return (
                    <div key={cuenta.id_metodo} onClick={() => setSelectedCuentaId(cuenta.id_metodo)}
                      style={{ padding:16, border:`${sel ? 2 : 1.5}px solid ${sel ? VINOTINTO : BORDER}`, borderRadius:12, background: sel ? '#fdf2f4' : WHITE, cursor:'pointer', transition:'all 0.2s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:800, color:CARBON, marginBottom:3 }}>{cuenta.banco}</div>
                          <div style={{ fontSize:'0.82rem', color:GRAY }}>{cuenta.tipo_cuenta} · N.º {cuenta.numero_cuenta}</div>
                          <div style={{ fontSize:'0.76rem', color:GRAY, marginTop:2 }}>Titular: {cuenta.nombre_titular}{cuenta.cedula_titular ? ` · CC ${cuenta.cedula_titular}` : ''}</div>
                        </div>
                        {cuenta.es_principal && <span style={{ background:VINOTINTO, color:WHITE, borderRadius:20, padding:'3px 10px', fontSize:'0.73rem', fontWeight:700 }}>Principal</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding:16, borderRadius:10, background:'#fff7ed', border:'1px solid #fed7aa', color:'#9a3412', fontSize:'0.88rem', marginBottom:20 }}>
                Este vendedor aún no ha registrado cuentas bancarias.
              </div>
            )}
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => { setShowPaymentModal(false); setSelectedVendedor(null); setSelectedCuentaId(null); }}
                style={{ flex:1, padding:'12px', background:'#f5f5f5', color:CARBON, border:`1px solid ${BORDER}`, borderRadius:10, cursor:'pointer', fontWeight:700 }}>Cancelar</button>
              <button onClick={confirmarProcesarNomina} disabled={!selectedCuentaId}
                style={{ flex:1, padding:'12px', background:VINOTINTO, color:WHITE, border:'none', borderRadius:10, cursor: !selectedCuentaId ? 'not-allowed' : 'pointer', opacity: !selectedCuentaId ? 0.6 : 1, fontWeight:700 }}>Procesar Pago</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL éxito ──────────────────────────────────────── */}
      {mostrarExitoPago && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <div style={{ background:WHITE, borderRadius:20, padding:'36px 30px', maxWidth:380, width:'95%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', textAlign:'center' }}>
            <div style={{ width:70, height:70, borderRadius:'50%', background:'#dcfce7', display:'grid', placeItems:'center', margin:'0 auto 20px' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 style={{ margin:'0 0 10px', fontSize:'1.3rem', fontWeight:800, color:'#16a34a' }}>¡Pago procesado!</h3>
            <p style={{ margin:'0 0 24px', color:GRAY, fontSize:'0.9rem', lineHeight:1.6 }}>
              El pago al vendedor ha sido procesado correctamente.
              {cuentaExito && <><br /><br /><strong>Banco:</strong> {cuentaExito.banco}<br /><strong>Cuenta:</strong> {cuentaExito.tipo_cuenta} · {cuentaExito.numero_cuenta}<br /><strong>Titular:</strong> {cuentaExito.titular}</>}
            </p>
            <button onClick={() => setMostrarExitoPago(false)}
              style={{ background:'#16a34a', color:WHITE, border:'none', padding:'12px 36px', borderRadius:10, fontWeight:800, cursor:'pointer', fontSize:'0.95rem' }}>
              Aceptar
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
