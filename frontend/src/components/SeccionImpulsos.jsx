import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const TIPO_BADGE = {
  home: { label: "🏠 Página Principal", color: "#7A1E3A" },
  categoria: { label: "📚 Banner en Categoría", color: "#1a5276" },
  libro_dia: { label: "⭐ Libro del Día", color: "#7d6608" },
  email: { label: "✉️ Email Masivo", color: "#1e8449" },
};

const ESTADO_COLOR = {
  Activo: "#1e8449",
  Finalizado: "#888",
  Cancelado: "#b42318",
};

function formatPrecio(valor) {
  return `$${parseFloat(valor).toLocaleString("es-CO")}`;
}

export default function SeccionImpulsos({ tiendaId, onNavegar, darkMode = false }) {
  const [tipos, setTipos] = useState([]);
  const [misImpulsos, setMisImpulsos] = useState([]);
  const [libros, setLibros] = useState([]);
  const [descuentoPlan, setDescuentoPlan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [libroSeleccionado, setLibroSeleccionado] = useState("");
  const [tab, setTab] = useState("contratar"); // "contratar" | "activos"

  // Sync darkMode from localStorage
  const [localDarkMode, setLocalDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handler = () => setLocalDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChange', handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener('darkModeChange', handler); window.removeEventListener('storage', handler); };
  }, []);

  const effectiveDarkMode = darkMode || localDarkMode;

  // Paleta de colores según modo
  const t = {
    cardBg:               effectiveDarkMode ? '#2a2a2a' : '#fff',
    cardBorder:           effectiveDarkMode ? '1px solid #3a3a3a' : '1px solid #e0dbd4',
    cardSelectedBorder:   effectiveDarkMode ? '3px solid #e05a7a' : '3px solid var(--vinotinto)',
    cardSelectedBg:       effectiveDarkMode ? '#2a1a24' : '#fdf7f9',
    cardShadow:           effectiveDarkMode ? '0 4px 12px rgba(224, 90, 122, 0.15)' : '0 4px 12px rgba(122,30,58,0.15)',
    cardInactiveShadow:   effectiveDarkMode ? '0 1px 4px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
    titleColor:           effectiveDarkMode ? '#ececec' : '#222',
    descColor:            effectiveDarkMode ? '#c8c8c8' : '#666',
    priceColor:           effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    priceStrikeColor:     effectiveDarkMode ? '#666' : '#aaa',
    durationColor:        effectiveDarkMode ? '#999' : '#888',
    badgeBg:              effectiveDarkMode ? '#2a2a2a' : '#f5f5f5',
    welcomeCardBg:        effectiveDarkMode ? '#1f1f1f' : undefined,
    welcomeCardBorder:    effectiveDarkMode ? '#3a3a3a' : undefined,
    welcomeTitle:         effectiveDarkMode ? '#f3f4f6' : undefined,
    welcomeDesc:          effectiveDarkMode ? '#c8c8c8' : undefined,
    iconColor:            effectiveDarkMode ? '#e05a7a' : '#7A1E3A',
    bannerBg:             effectiveDarkMode ? '#2a2a2a' : 'white',
    bannerBorder:         effectiveDarkMode ? '1px solid #3a3a3a' : '1px solid #e0dbd4',
    bannerLeftBorder:     effectiveDarkMode ? '5px solid #e05a7a' : '5px solid var(--vinotinto)',
    bannerTitle:          effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    bannerDesc:           effectiveDarkMode ? '#c8c8c8' : '#555',
    bannerBtnBg:          effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    successBg:            effectiveDarkMode ? '#1a3a2a' : '#d4edda',
    successColor:         effectiveDarkMode ? '#6ae07a' : '#155724',
    errorBg:              effectiveDarkMode ? '#2a1a18' : '#f8d7da',
    errorColor:           effectiveDarkMode ? '#f87171' : '#721c24',
    tabBg:                effectiveDarkMode ? '#2a2a2a' : 'white',
    tabBorderActive:     effectiveDarkMode ? '2px solid #e05a7a' : '2px solid var(--vinotinto)',
    tabBorderInactive:   effectiveDarkMode ? '1px solid #3a3a3a' : '1px solid #e0dbd4',
    tabBgActive:          effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    tabColorActive:       '#fff',
    tabColorInactive:     effectiveDarkMode ? '#c8c8c8' : '#555',
    configBg:             effectiveDarkMode ? '#2a2a2a' : '#f9f8f6',
    configTitle:          effectiveDarkMode ? '#ececec' : '#333',
    configTitleHighlight: effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    labelColor:           effectiveDarkMode ? '#c8c8c8' : '#555',
    selectBg:             effectiveDarkMode ? '#353535' : '#fff',
    selectBorder:         effectiveDarkMode ? '#4a4a4a' : '#ddd',
    selectColor:           effectiveDarkMode ? '#ececec' : '#222',
    btnPrimaryBg:         effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    btnPrimaryColor:      '#fff',
    emptyStateColor:      effectiveDarkMode ? '#666' : '#888',
    activeCardBg:         effectiveDarkMode ? '#2a2a2a' : 'white',
    activeCardBorder:     effectiveDarkMode ? '1px solid #3a3a3a' : '1px solid #e0dbd4',
    activeTitle:          effectiveDarkMode ? '#ececec' : '#333',
    activeDesc:           effectiveDarkMode ? '#c8c8c8' : '#666',
    activeMeta:           effectiveDarkMode ? '#999' : '#888',
    metricBg:             effectiveDarkMode ? '#353535' : '#f9f8f6',
    metricLabel:          effectiveDarkMode ? '#999' : '#888',
    metricValue:          effectiveDarkMode ? '#e05a7a' : 'var(--vinotinto)',
    cancelBtnBg:          effectiveDarkMode ? '#2a1a18' : 'transparent',
    cancelBtnColor:       effectiveDarkMode ? '#f87171' : '#b42318',
    cancelBtnBorder:      effectiveDarkMode ? '#7f2020' : '#b42318',
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [resTipos, resImpulsos, resLibros, resSuscripcion] = await Promise.all([
        api.get("/impulsos/tipos"),
        api.get("/impulsos/mis-impulsos"),
        api.get("/libros/mis-libros"),
        api.get("/herramientas/mi-suscripcion"),
      ]);
      setTipos(resTipos.data || []);
      setMisImpulsos(resImpulsos.data || []);
      setLibros(resLibros.data || []);
      const sus = resSuscripcion.data;
      if (sus?.activa && sus?.suscripcion?.impulsos_con_descuento) {
        setDescuentoPlan(parseFloat(sus.suscripcion.impulsos_con_descuento));
      }
    } catch (err) {
      console.error("Error al cargar datos de impulsos:", err);
      setError("No se pudieron cargar los datos de impulsos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [tiendaId, cargarDatos]);

  const precioConDescuento = (precio) => {
    if (!descuentoPlan) return parseFloat(precio);
    return parseFloat(precio) * (1 - descuentoPlan / 100);
  };

  const handleContratar = async () => {
    if (!tipoSeleccionado) return;
    const tipo = tipos.find((t) => t.id_tipo_impulso === tipoSeleccionado);
    if ((tipo?.tipo === "home" || tipo?.tipo === "libro_dia") && !libroSeleccionado) {
      setError("Este tipo de impulso requiere seleccionar un libro.");
      return;
    }
    setProcesando(true);
    setError("");
    setMensaje("");
    try {
      const payload = { id_tipo_impulso: tipoSeleccionado };
      if (libroSeleccionado) payload.id_libro = parseInt(libroSeleccionado);
      await api.post("/impulsos/contratar", payload);
      setMensaje("¡Impulso contratado con éxito! Tu libro ya tiene mayor visibilidad.");
      setTipoSeleccionado(null);
      setLibroSeleccionado("");
      await cargarDatos();
      setTab("activos");
    } catch (err) {
      setError(err.response?.data?.detail || "Error al contratar el impulso.");
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm("¿Cancelar este impulso? No se reembolsará el monto pagado.")) return;
    setProcesando(true);
    try {
      await api.delete(`/impulsos/${id}`);
      setMensaje("Impulso cancelado correctamente.");
      await cargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cancelar el impulso.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem", color: t.emptyStateColor }}>Cargando impulsos...</div>;

  const impulsosActivos = misImpulsos.filter((i) => i.estado === "Activo");

  return (
    <>
      {/* Header */}
      <div className="welcome-card" style={{ marginBottom: "20px", background: t.welcomeCardBg, borderColor: t.welcomeCardBorder }}>
        <h1 style={{ fontSize: "1.55rem", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px", color: t.welcomeTitle }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
          Impulsos Publicitarios
        </h1>
        <p style={{ margin: 0, color: t.welcomeDesc }}>
          Destaca tus libros en la plataforma y llega a más compradores.
          {descuentoPlan > 0 && (
            <strong style={{ color: t.priceColor, marginLeft: "6px" }}>
              🎉 Tu plan te da un {descuentoPlan}% de descuento en todos los impulsos.
            </strong>
          )}
        </p>
      </div>

      {/* Banner de upgrade si está en plan gratuito */}
      {descuentoPlan === 0 && !loading && (
        <div style={{ marginBottom: "20px", padding: "16px 20px", background: t.bannerBg, borderRadius: "10px", borderLeft: t.bannerLeftBorder, boxShadow: effectiveDarkMode ? "0 2px 10px rgba(224, 90, 122, 0.1)" : "0 2px 10px rgba(122,30,58,0.1)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", justifyContent: "space-between" }}>
          <div>
            <strong style={{ color: t.bannerTitle, fontSize: "0.95rem" }}>💡 Ahorra en cada impulso con un plan de pago</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.83rem", color: t.bannerDesc }}>
              Con el plan <strong>Básico</strong> ahorras 5%, con <strong>Estándar</strong> un 10% y con <strong>Premium</strong> hasta un 20% en todos tus impulsos.
            </p>
          </div>
          {onNavegar && (
            <button
              onClick={() => onNavegar("Suscripciones")}
              style={{ padding: "10px 20px", backgroundColor: t.bannerBtnBg, color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: "0.85rem", whiteSpace: "nowrap" }}
            >
              Ver Planes
            </button>
          )}
        </div>
      )}

      {mensaje && (
        <div style={{ padding: "12px", backgroundColor: t.successBg, color: t.successColor, borderRadius: "8px", marginBottom: "16px", fontWeight: 600 }}>
          {mensaje}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px", backgroundColor: t.errorBg, color: t.errorColor, borderRadius: "8px", marginBottom: "16px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {["contratar", "activos"].map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: tab === tabName ? t.tabBorderActive : t.tabBorderInactive,
              backgroundColor: tab === tabName ? t.tabBgActive : t.tabBg,
              color: tab === tabName ? t.tabColorActive : t.tabColorInactive,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Montserrat, sans-serif",
              fontSize: "0.88rem",
            }}
          >
            {tabName === "contratar" ? "➕ Contratar Impulso" : `⚡ Mis Impulsos Activos (${impulsosActivos.length})`}
          </button>
        ))}
      </div>

      {/* TAB: Contratar */}
      {tab === "contratar" && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
            {tipos.filter((tipo, index, self) =>
              self.findIndex((t) => t.tipo === tipo.tipo) === index
            ).map((tipo) => {
              const badge = TIPO_BADGE[tipo.tipo] || {};
              const precioFinal = precioConDescuento(tipo.precio);
              const seleccionado = tipoSeleccionado === tipo.id_tipo_impulso;
              return (
                <div
                  key={tipo.id_tipo_impulso}
                  onClick={() => { setTipoSeleccionado(tipo.id_tipo_impulso); setLibroSeleccionado(""); setError(""); }}
                  style={{
                    flex: "1 1 220px",
                    maxWidth: "280px",
                    border: seleccionado ? t.cardSelectedBorder : t.cardBorder,
                    borderRadius: "12px",
                    padding: "20px",
                    backgroundColor: seleccionado ? t.cardSelectedBg : t.cardBg,
                    cursor: "pointer",
                    boxShadow: seleccionado ? t.cardShadow : t.cardInactiveShadow,
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: badge.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {badge.label}
                  </span>
                  <h3 style={{ margin: "8px 0 6px 0", fontSize: "1rem", color: t.titleColor }}>{tipo.nombre}</h3>
                  <p style={{ fontSize: "0.82rem", color: t.descColor, margin: "0 0 12px 0", minHeight: "40px" }}>{tipo.descripcion}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: t.priceColor }}>
                      {formatPrecio(precioFinal)}
                    </span>
                    {descuentoPlan > 0 && (
                      <span style={{ fontSize: "0.8rem", color: t.priceStrikeColor, textDecoration: "line-through" }}>
                        {formatPrecio(tipo.precio)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: t.durationColor, marginTop: "4px" }}>
                    ⏱ Duración: {tipo.duracion_dias} {tipo.duracion_dias === 1 ? "día" : "días"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selector de libro si aplica */}
          {tipoSeleccionado && (() => {
            const tipo = tipos.find((t) => t.id_tipo_impulso === tipoSeleccionado);
            const requiereLibro = tipo?.tipo === "home" || tipo?.tipo === "libro_dia";
            return (
              <div style={{ background: t.configBg, borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: t.configTitle }}>
                  Configurar impulso: <span style={{ color: t.configTitleHighlight }}>{tipo?.nombre}</span>
                </h4>
                {requiereLibro && (
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "0.9rem", color: t.labelColor, fontWeight: 600, display: "block", marginBottom: "6px" }}>
                      Selecciona el libro a impulsar *
                    </label>
                    <select
                      value={libroSeleccionado}
                      onChange={(e) => setLibroSeleccionado(e.target.value)}
                      style={{ width: "100%", maxWidth: "400px", padding: "10px", borderRadius: "8px", border: t.selectBorder, background: t.selectBg, color: t.selectColor, fontFamily: "Montserrat, sans-serif", fontSize: "0.9rem" }}
                    >
                      <option value="">— Elige un libro —</option>
                      {libros.map((l) => (
                        <option key={l.id_libro} value={l.id_libro}>{l.titulo}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  disabled={procesando || (requiereLibro && !libroSeleccionado)}
                  onClick={handleContratar}
                  style={{
                    padding: "10px 28px",
                    backgroundColor: t.btnPrimaryBg,
                    color: t.btnPrimaryColor,
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: procesando || (requiereLibro && !libroSeleccionado) ? "not-allowed" : "pointer",
                    opacity: procesando || (requiereLibro && !libroSeleccionado) ? 0.6 : 1,
                    fontFamily: "Montserrat, sans-serif",
                  }}
                >
                  {procesando ? "Procesando..." : `Contratar por ${formatPrecio(precioConDescuento(tipo?.precio || 0))}`}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB: Mis Impulsos */}
      {tab === "activos" && (
        <div>
          {misImpulsos.length === 0 ? (
            <div style={{ textAlign: "center", color: t.emptyStateColor, padding: "40px 0" }}>
              <p style={{ fontSize: "1.1rem" }}>Aún no has contratado ningún impulso.</p>
              <button onClick={() => setTab("contratar")} style={{ marginTop: "12px", padding: "10px 24px", backgroundColor: t.btnPrimaryBg, color: t.btnPrimaryColor, border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}>
                Contratar mi primer Impulso
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {misImpulsos.map((imp) => {
                const badge = TIPO_BADGE[imp.tipo] || {};
                return (
                  <div key={imp.id_impulso} style={{ background: t.activeCardBg, border: t.activeCardBorder, borderRadius: "12px", padding: "20px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ flex: "1 1 220px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: badge.color }}>{badge.label}</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: ESTADO_COLOR[imp.estado] || "#888", background: t.badgeBg, padding: "2px 8px", borderRadius: "20px" }}>
                          {imp.estado}
                        </span>
                      </div>
                      <h4 style={{ margin: "4px 0", color: t.activeTitle }}>{imp.nombre_impulso}</h4>
                      {imp.titulo_libro && <p style={{ margin: "2px 0", fontSize: "0.85rem", color: t.activeDesc }}>📖 {imp.titulo_libro}</p>}
                      <p style={{ margin: "4px 0", fontSize: "0.8rem", color: t.activeMeta }}>
                        {new Date(imp.fecha_inicio).toLocaleDateString("es-CO")} → {new Date(imp.fecha_fin).toLocaleDateString("es-CO")}
                        &nbsp;·&nbsp; Pagado: <strong>{formatPrecio(imp.monto_pagado)}</strong>
                      </p>
                    </div>
                    {/* Métricas */}
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                      {[
                        { label: "Impresiones", valor: imp.impresiones || 0, icon: "👁" },
                        { label: "Clics", valor: imp.clics || 0, icon: "🖱" },
                        { label: "Ventas", valor: imp.ventas_generadas || 0, icon: "🛒" },
                      ].map((m) => (
                        <div key={m.label} style={{ textAlign: "center", background: t.metricBg, borderRadius: "8px", padding: "10px 16px" }}>
                          <div style={{ fontSize: "0.75rem", color: t.metricLabel }}>{m.icon} {m.label}</div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: t.metricValue }}>{m.valor.toLocaleString("es-CO")}</div>
                        </div>
                      ))}
                    </div>
                    {imp.estado === "Activo" && (
                      <button
                        disabled={procesando}
                        onClick={() => handleCancelar(imp.id_impulso)}
                        style={{ padding: "8px 16px", backgroundColor: t.cancelBtnBg, color: t.cancelBtnColor, border: t.cancelBtnBorder, borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.82rem", fontFamily: "Montserrat, sans-serif" }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
