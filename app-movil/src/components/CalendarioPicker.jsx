/**
 * CalendarioPicker — Picker de fecha y hora reutilizable
 * Incluye: presets rápidos, calendario mensual navegable y drum-roller AM/PM
 *
 * Props:
 *   label       string   — Etiqueta encima del trigger
 *   value       string   — Valor actual en formato "YYYY-MM-DDTHH:MM"
 *   onChange    fn(str)  — Callback con el nuevo valor en el mismo formato
 *   minDate     string   — Fecha mínima seleccionable (mismo formato)
 *   placeholder string   — Texto cuando no hay valor
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconCalendar } from './Icons';

// ── Paleta ────────────────────────────────────────────────────────────────────
const PRIMARY = '#7A1E3A';
const WHITE   = '#FFFFFF';
const TEXT    = '#1f2937';
const MUTED   = '#6b7280';
const BORDER  = '#e5e7eb';

// ── Constantes drum ───────────────────────────────────────────────────────────
const DRUM_ITEM_H = 44;
const DRUM_VISIBLE = 5;
const DRUM_H = DRUM_ITEM_H * DRUM_VISIBLE;

// ── Constantes calendario ─────────────────────────────────────────────────────
const DIAS_SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isoToDate(iso) {
  if (!iso) return null;
  try { return new Date(iso.replace('T', ' ')); } catch { return null; }
}

function dateToIso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── Drum Roller ───────────────────────────────────────────────────────────────
function DrumRoller({ items, selectedIndex, onSelect, width = 72 }) {
  const scrollRef = useRef(null);
  const lastIdx   = useRef(selectedIndex);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * DRUM_ITEM_H, animated: false });
    lastIdx.current = selectedIndex;
  }, [selectedIndex]);

  const onMomentumEnd = (e) => {
    const idx     = Math.round(e.nativeEvent.contentOffset.y / DRUM_ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (clamped !== lastIdx.current) {
      lastIdx.current = clamped;
      onSelect(clamped);
    }
  };

  const padding = DRUM_ITEM_H * 2;

  return (
    <View style={{ width, height: DRUM_H, overflow: 'hidden' }}>
      <View pointerEvents="none" style={s.drumLines}>
        <View style={s.drumLineTop} />
        <View style={s.drumLineBot} />
      </View>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={DRUM_ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingTop: padding, paddingBottom: padding }}
        scrollEventThrottle={16}
      >
        {items.map((item, i) => {
          const dist       = Math.abs(i - selectedIndex);
          const opacity    = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.2;
          const fontSize   = dist === 0 ? 28 : dist === 1 ? 20 : 15;
          const fontWeight = dist === 0 ? '900' : '500';
          return (
            <TouchableOpacity
              key={i}
              style={[s.drumItem, { height: DRUM_ITEM_H, width }]}
              onPress={() => {
                onSelect(i);
                scrollRef.current?.scrollTo({ y: i * DRUM_ITEM_H, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Text style={[s.drumText, { opacity, fontSize, fontWeight }]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── CalendarioPicker (exportado) ──────────────────────────────────────────────
const HORAS_LIST   = ['12','01','02','03','04','05','06','07','08','09','10','11'];
const MINUTOS_LIST = ['00','05','10','15','20','25','30','35','40','45','50','55'];
const AMPM_LIST    = ['AM','PM'];
const PRESETS = [
  { label: 'Hoy',    dias: 0 },
  { label: 'Mañana', dias: 1 },
  { label: '+7d',    dias: 7 },
  { label: '+15d',   dias: 15 },
  { label: '+30d',   dias: 30 },
];

export default function CalendarioPicker({ label, value, onChange, minDate, placeholder }) {
  const [abierto, setAbierto] = useState(false);

  const initDate = isoToDate(value) || new Date();

  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [selDay,    setSelDay]    = useState(isoToDate(value) ? initDate.getDate() : null);

  const getHoraIdx = (d) => {
    if (!d) return 0;
    const h = d.getHours() % 12;
    return h === 0 ? 0 : Math.max(0, HORAS_LIST.indexOf(String(h).padStart(2, '0')));
  };
  const getMinIdx = (d) => {
    if (!d) return 0;
    const nearest = Math.round(d.getMinutes() / 5) * 5;
    const idx = MINUTOS_LIST.indexOf(String(nearest).padStart(2, '0'));
    return idx >= 0 ? idx : 0;
  };
  const getAmpmIdx = (d) => (!d ? 0 : d.getHours() >= 12 ? 1 : 0);

  const [horaIdx, setHoraIdx] = useState(() => getHoraIdx(isoToDate(value)));
  const [minIdx,  setMinIdx]  = useState(() => getMinIdx(isoToDate(value)));
  const [ampmIdx, setAmpmIdx] = useState(() => getAmpmIdx(isoToDate(value)));

  // Resincronizar si value cambia desde afuera
  useEffect(() => {
    const d = isoToDate(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelDay(d.getDate());
      setHoraIdx(getHoraIdx(d));
      setMinIdx(getMinIdx(d));
      setAmpmIdx(getAmpmIdx(d));
    }
  }, [value]);

  // ── Celdas del calendario ─────────────────────────────────────────────────
  const primerDia = new Date(viewYear, viewMonth, 1).getDay();
  const diasMes   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const diasAnt   = new Date(viewYear, viewMonth, 0).getDate();
  const celdas    = [];
  for (let i = primerDia - 1; i >= 0; i--)
    celdas.push({ dia: diasAnt - i, esMes: false, key: `prev-${i}` });
  for (let d = 1; d <= diasMes; d++)
    celdas.push({ dia: d, esMes: true, key: `cur-${d}` });
  const resto = celdas.length % 7;
  if (resto > 0)
    for (let d = 1; d <= 7 - resto; d++)
      celdas.push({ dia: d, esMes: false, key: `next-${d}` });

  const hoy = new Date();

  const esDiaHabilitado = (dia) => {
    if (!minDate) return true;
    const min   = isoToDate(minDate) || new Date(minDate);
    const fecha = new Date(viewYear, viewMonth, dia);
    return fecha >= new Date(min.getFullYear(), min.getMonth(), min.getDate());
  };

  const aplicarPreset = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelDay(d.getDate());
  };

  const confirmar = () => {
    if (!selDay) return;
    const h12 = parseInt(HORAS_LIST[horaIdx], 10);
    let   h24 = h12 % 12;
    if (ampmIdx === 1) h24 += 12;
    const minVal = parseInt(MINUTOS_LIST[minIdx], 10);
    const d = new Date(viewYear, viewMonth, selDay, h24, minVal, 0);
    onChange(dateToIso(d));
    setAbierto(false);
  };

  const mesAnterior = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const mesSiguiente = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const displayValue = value ? (() => {
    const d = isoToDate(value);
    if (!d) return value;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      + '  ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
  })() : null;

  return (
    <>
      {!!label && <Text style={s.label}>{label}</Text>}
      <TouchableOpacity
        style={[s.trigger, abierto && { borderColor: PRIMARY }]}
        onPress={() => setAbierto(true)}
        activeOpacity={0.7}
      >
        <IconCalendar size={16} color={PRIMARY} />
        <Text style={[s.triggerText, !displayValue && { color: MUTED }]}>
          {displayValue || (placeholder || 'Seleccionar fecha…')}
        </Text>
        <Text style={{ color: PRIMARY, fontSize: 10 }}>▲</Text>
      </TouchableOpacity>

      <Modal
        visible={abierto}
        transparent
        animationType="slide"
        onRequestClose={() => setAbierto(false)}
      >
        <Pressable style={s.overlay} onPress={() => setAbierto(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>

            {/* Presets */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.presetsRow}
            >
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={s.presetBtn}
                  onPress={() => aplicarPreset(p.dias)}
                  activeOpacity={0.7}
                >
                  <Text style={s.presetText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Navegación mes */}
            <View style={s.calNavRow}>
              <TouchableOpacity style={s.calNavBtn} onPress={mesAnterior} activeOpacity={0.7}>
                <Text style={s.calNavArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={s.calMonthTitle}>{MESES[viewMonth]} {viewYear}</Text>
              <TouchableOpacity style={s.calNavBtn} onPress={mesSiguiente} activeOpacity={0.7}>
                <Text style={s.calNavArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Cabecera días semana */}
            <View style={s.calWeekRow}>
              {DIAS_SEMANA.map((d) => (
                <Text key={d} style={s.calWeekDay}>{d}</Text>
              ))}
            </View>

            {/* Cuadrícula días */}
            <View style={s.calGrid}>
              {celdas.map((celda) => {
                const esHoy = celda.esMes
                  && celda.dia === hoy.getDate()
                  && viewMonth === hoy.getMonth()
                  && viewYear  === hoy.getFullYear();
                const esSel = celda.esMes && celda.dia === selDay
                  && viewMonth === (isoToDate(value)?.getMonth() ?? viewMonth)
                  && viewYear  === (isoToDate(value)?.getFullYear() ?? viewYear);
                const esMarcado  = celda.esMes && celda.dia === selDay && !value;
                const activo     = esSel || esMarcado;
                const habilitado = celda.esMes && esDiaHabilitado(celda.dia);
                return (
                  <TouchableOpacity
                    key={celda.key}
                    style={[
                      s.calCell,
                      activo     && s.calCellSel,
                      esHoy && !activo && s.calCellHoy,
                      (!celda.esMes || !habilitado) && s.calCellDis,
                    ]}
                    onPress={() => { if (!celda.esMes || !habilitado) return; setSelDay(celda.dia); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      s.calCellText,
                      activo && s.calCellTextSel,
                      esHoy && !activo && s.calCellTextHoy,
                      (!celda.esMes || !habilitado) && s.calCellTextDis,
                    ]}>
                      {celda.dia}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Drum roller de hora */}
            <View style={s.drumSection}>
              <View style={s.drumRow}>
                <DrumRoller items={HORAS_LIST}   selectedIndex={horaIdx} onSelect={setHoraIdx} width={70} />
                <View style={s.drumSepBox}><Text style={s.drumSepText}>:</Text></View>
                <DrumRoller items={MINUTOS_LIST} selectedIndex={minIdx}  onSelect={setMinIdx}  width={70} />
                <DrumRoller items={AMPM_LIST}    selectedIndex={ampmIdx} onSelect={setAmpmIdx} width={60} />
              </View>
            </View>

            {/* Botón Aceptar */}
            <TouchableOpacity
              style={[s.aceptarBtn, !selDay && { opacity: 0.5 }]}
              onPress={confirmar}
              disabled={!selDay}
              activeOpacity={0.85}
            >
              <Text style={s.aceptarText}>Aceptar ✓</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── Estilos internos ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  label: {
    fontSize: 12, fontWeight: '700', color: '#374151',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7,
  },
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    padding: 12, backgroundColor: '#fafafa',
  },
  triggerText: { flex: 1, fontSize: 14, color: TEXT },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingHorizontal: 16,
    maxHeight: '92%',
  },

  // Presets
  presetsRow: { flexDirection: 'row', gap: 8, paddingVertical: 10, paddingHorizontal: 2 },
  presetBtn: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, backgroundColor: WHITE,
  },
  presetText: { fontSize: 13, fontWeight: '700', color: TEXT },

  // Navegación mes
  calNavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, marginBottom: 4,
  },
  calNavBtn:    { padding: 8 },
  calNavArrow:  { fontSize: 26, color: TEXT, fontWeight: '300', lineHeight: 28 },
  calMonthTitle:{ fontSize: 16, fontWeight: '800', color: TEXT },

  // Cabecera semana
  calWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: MUTED },

  // Cuadrícula
  calGrid:         { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', borderRadius: 100,
  },
  calCellSel:      { backgroundColor: PRIMARY },
  calCellHoy:      { borderWidth: 1.5, borderColor: PRIMARY },
  calCellDis:      { opacity: 0.25 },
  calCellText:     { fontSize: 14, color: TEXT, fontWeight: '500' },
  calCellTextSel:  { color: WHITE, fontWeight: '800' },
  calCellTextHoy:  { color: PRIMARY, fontWeight: '800' },
  calCellTextDis:  { color: MUTED },

  // Drum
  drumSection: {
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingTop: 14, paddingBottom: 4,
  },
  drumRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  drumSepBox: {
    width: 20, height: DRUM_ITEM_H * DRUM_VISIBLE,
    alignItems: 'center', justifyContent: 'center',
  },
  drumSepText: { fontSize: 32, fontWeight: '900', color: TEXT, lineHeight: 36, marginTop: -8 },
  drumItem:    { alignItems: 'center', justifyContent: 'center' },
  drumText:    { color: TEXT, textAlign: 'center' },
  drumLines: {
    position: 'absolute', left: 0, right: 0,
    top: DRUM_ITEM_H * 2, height: DRUM_ITEM_H,
    borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: BORDER,
    zIndex: 10,
  },
  drumLineTop: { position: 'absolute', top: 0,    left: 0, right: 0, height: 1.5, backgroundColor: BORDER },
  drumLineBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: BORDER },

  // Aceptar
  aceptarBtn: {
    marginTop: 14, backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  aceptarText: { color: WHITE, fontWeight: '800', fontSize: 16 },
});
