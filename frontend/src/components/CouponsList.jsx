import { useEffect, useRef, useState } from "react";
import { getCuponesDisponibles } from "../services/api";
import { notify } from "./ToastProvider";

export default function CouponsList({ initialCoupons, darkMode = false }) {
  const [coupons, setCoupons] = useState(initialCoupons ?? []);
  const [loading, setLoading] = useState(initialCoupons === undefined);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [expirationFilter, setExpirationFilter] = useState("todos");
  const carouselRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);

  useEffect(() => {
    if (initialCoupons !== undefined) {
      return undefined;
    }

    getCuponesDisponibles()
      .then((res) => {
        setCoupons(res.data || []);
      })
      .catch((err) => {
        console.error("Error loading coupons:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialCoupons]);

  useEffect(() => {
    if (loading || coupons.length <= 1) return undefined;

    const measure = () => {
      if (trackRef.current) loopWidthRef.current = trackRef.current.scrollWidth / 2;
    };
    measure();
    window.addEventListener("resize", measure);
    let frameId;
    let previousTime;
    const animate = (time) => {
      const carousel = carouselRef.current;
      const track = trackRef.current;
      if (carousel && track) {
        const loopWidth = loopWidthRef.current;
        const elapsed = previousTime ? time - previousTime : 0;
        offsetRef.current += (elapsed / 1000) * 32;
        if (loopWidth > 0 && offsetRef.current >= loopWidth) {
          offsetRef.current -= loopWidth;
        }
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      previousTime = time;
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measure);
    };
  }, [loading, coupons.length]);

  const moveCarousel = (direction) => {
    const carousel = carouselRef.current;
    const track = trackRef.current;
    if (!carousel || !track) return;
    const card = track.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 20 : carousel.clientWidth;
    const loopWidth = track.scrollWidth / 2;
    offsetRef.current += direction * step;
    if (offsetRef.current < 0) offsetRef.current += loopWidth;
    if (offsetRef.current >= loopWidth) offsetRef.current -= loopWidth;
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        notify("Código copiado al portapapeles", "success");
        setTimeout(() => setCopiedCode(null), 2500);
      })
      .catch((err) => {
        console.error("Failed to copy code: ", err);
        notify("Error al copiar el código", "error");
      });
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = `${coupon.codigo_cupon} ${coupon.nombre_tienda || ""}`
      .toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "todos"
      || (filter === "globales" && !coupon.nombre_tienda)
      || (filter === "tienda" && coupon.nombre_tienda)
      || (filter === "fijo" && coupon.tipo_descuento === "fijo")
      || (filter === "porcentaje" && coupon.tipo_descuento !== "fijo");
    const expiration = coupon.fecha_fin ? new Date(coupon.fecha_fin) : null;
    const today = new Date();
    const daysUntilExpiration = expiration ? (expiration - today) / 86400000 : Infinity;
    const matchesExpiration = expirationFilter === "todos"
      || (expirationFilter === "vigentes" && daysUntilExpiration >= 0)
      || (expirationFilter === "proximos" && daysUntilExpiration >= 0 && daysUntilExpiration <= 7);
    return matchesSearch && matchesFilter && matchesExpiration;
  }).sort((a, b) => {
    if (!a.fecha_fin) return 1;
    if (!b.fecha_fin) return -1;
    return new Date(a.fecha_fin) - new Date(b.fecha_fin);
  });

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#888" }}>Cargando cupones disponibles...</p>
      </div>
    );
  }

  return (
    <div className="pl-card" style={{ padding: "1.25rem", marginTop: "1rem", background: darkMode ? "#1e1e1e" : "white", borderColor: darkMode ? "#454545" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: "linear-gradient(135deg, #7A1E3A 0%, #9C2F4A 100%)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5v2"></path>
            <path d="M15 11v2"></path>
            <path d="M15 17v2"></path>
            <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"></path>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <h2 style={{ margin: 0, color: darkMode ? "#ececec" : "var(--gris-carbon)", fontSize: "1.35rem" }}>Cupones de Descuento</h2>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{ border: `1px solid ${darkMode ? "#ff4f83" : "#7A1E3A"}`, background: darkMode ? "#252525" : "white", color: darkMode ? "#ff6b97" : "#7A1E3A", borderRadius: "7px", padding: "6px 12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Ver todos
            </button>
          </div>
          <p style={{ margin: 0, color: darkMode ? "#aaa" : "#888", fontSize: "0.78rem" }}>
            Aprovecha estos códigos especiales en tu próxima compra
          </p>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          <p>No hay cupones disponibles en este momento. ¡Vuelve pronto!</p>
        </div>
      ) : (
        <div
          style={{ position: "relative", padding: "0 42px" }}
        >
          <button
            type="button"
            aria-label="Cupones anteriores"
            onClick={() => moveCarousel(-1)}
            style={{
              position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
              zIndex: 2, width: 34, height: 34, borderRadius: "50%", border: `1px solid ${darkMode ? "#ff4f83" : "#D2C7BC"}`,
              background: darkMode ? "#3a3a3a" : "white", color: darkMode ? "#ff6b97" : "var(--vinotinto)", fontSize: "1.3rem", cursor: "pointer",
              boxShadow: darkMode ? "0 3px 12px rgba(0,0,0,0.55)" : "0 3px 10px rgba(0,0,0,0.12)",
            }}
          >
            ‹
          </button>

          <div
            ref={carouselRef}
            aria-label="Carrusel de cupones disponibles"
            style={{
              overflow: "hidden", padding: "2px 0 8px",
            }}
          >
            <div
              ref={trackRef}
              style={{ display: "flex", gap: "20px", width: "max-content", willChange: "transform" }}
            >
          {[...coupons, ...coupons].map((coupon, index) => {
            const isFijo = coupon.tipo_descuento === "fijo";
            const valFormato = isFijo
              ? `$${Number(coupon.valor_descuento).toLocaleString("es-CO")}`
              : `${Number(coupon.valor_descuento)}%`;

            return (
              <div
                key={`${coupon.id_cupon}-${index}`}
                style={{
                  flex: "0 0 min(245px, calc(100vw - 100px))",
                  background: darkMode ? "linear-gradient(135deg, #252525 0%, #303030 100%)" : "linear-gradient(135deg, #fff 0%, #FAF8F6 100%)",
                  border: `2px dashed ${darkMode ? "#606060" : "#D2C7BC"}`,
                  borderRadius: "16px",
                  padding: "14px",
                  position: "relative",
                  boxShadow: darkMode ? "0 4px 14px rgba(0,0,0,0.28)" : "0 4px 12px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
              >
                {/* Badge de Tienda o Global */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "white",
                    background: coupon.nombre_tienda ? "#E37A24" : "var(--vinotinto)",
                    padding: "3px 10px",
                    borderRadius: "20px"
                  }}>
                    {coupon.nombre_tienda ? `Tienda: ${coupon.nombre_tienda}` : "Global BookyHome"}
                  </span>
                </div>

                <div>
                  <h3 style={{ margin: "0 0 5px", fontSize: "1.6rem", fontWeight: 800, color: darkMode ? "#ff4f83" : "var(--vinotinto)" }}>
                    {valFormato} <span style={{ fontSize: "0.95rem", fontWeight: 500, color: darkMode ? "#c8c8c8" : "#666" }}>Dcto.</span>
                  </h3>

                  {coupon.minimo_compra > 0 && (
                    <p style={{ margin: "0 0 10px", fontSize: "0.8", color: darkMode ? "#c8c8c8" : "#666" }}>
                      Compra mínima: <strong>${Number(coupon.minimo_compra).toLocaleString("es-CO")}</strong>
                    </p>
                  )}

                  {coupon.fecha_fin && (
                    <p style={{ margin: "0 0 15px", fontSize: "0.75rem", color: darkMode ? "#aaa" : "#999" }}>
                      Válido hasta: {new Date(coupon.fecha_fin).toLocaleDateString("es-CO", {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                  )}
                </div>

                {/* Código de Cupón para copiar */}
                <div
                  onClick={() => handleCopy(coupon.codigo_cupon)}
                  style={{
                    background: darkMode ? "#303030" : "#F4EDE6",
                    border: `1px solid ${darkMode ? "#606060" : "#D2C7BC"}`,
                    borderRadius: "8px",
                    padding: "10px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: darkMode ? "#ececec" : "var(--gris-carbon)",
                    letterSpacing: "1.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? "#3b3b3b" : "#EADFD3"}
                  onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? "#303030" : "#F4EDE6"}
                >
                  <span>{coupon.codigo_cupon}</span>
                  {copiedCode === coupon.codigo_cupon ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="green" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          </div>

          <button
            type="button"
            aria-label="Siguientes cupones"
            onClick={() => moveCarousel(1)}
            style={{
              position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
              zIndex: 2, width: 34, height: 34, borderRadius: "50%", border: `1px solid ${darkMode ? "#ff4f83" : "#D2C7BC"}`,
              background: darkMode ? "#3a3a3a" : "white", color: darkMode ? "#ff6b97" : "var(--vinotinto)", fontSize: "1.3rem", cursor: "pointer",
              boxShadow: darkMode ? "0 3px 12px rgba(0,0,0,0.55)" : "0 3px 10px rgba(0,0,0,0.12)",
            }}
          >
            ›
          </button>
        </div>
      )}

      {showAll && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Todos los cupones"
          onClick={(event) => { if (event.target === event.currentTarget) setShowAll(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(30, 15, 20, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div style={{ background: "#fff", width: "min(960px, 100%)", maxHeight: "90vh", overflowY: "auto", borderRadius: "14px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
              <h2 style={{ margin: 0, color: "#2A2A2A" }}>Todos los cupones</h2>
              <button type="button" aria-label="Cerrar" onClick={() => setShowAll(false)} style={{ border: 0, background: "#f5eeee", color: "#7A1E3A", borderRadius: "50%", width: 34, height: 34, fontSize: "1.2rem", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
              <input
                type="search"
                placeholder="Buscar por código o tienda"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{ flex: "1 1 240px", minWidth: 0, padding: "10px 12px", border: "1px solid #D2C7BC", borderRadius: "8px", fontFamily: "inherit" }}
              />
              <select value={filter} onChange={(event) => setFilter(event.target.value)} style={{ padding: "10px 12px", border: "1px solid #D2C7BC", borderRadius: "8px", background: "white", fontFamily: "inherit" }}>
                <option value="todos">Todos</option>
                <option value="globales">Globales</option>
                <option value="tienda">Por tienda</option>
                <option value="fijo">Valor fijo</option>
                <option value="porcentaje">Porcentaje</option>
              </select>
              <select value={expirationFilter} onChange={(event) => setExpirationFilter(event.target.value)} style={{ padding: "10px 12px", border: "1px solid #D2C7BC", borderRadius: "8px", background: "white", fontFamily: "inherit" }}>
                <option value="todos">Cualquier vencimiento</option>
                <option value="vigentes">Vigentes</option>
                <option value="proximos">Vencen en 7 días</option>
              </select>
            </div>

            {filteredCoupons.length === 0 ? (
              <p style={{ textAlign: "center", color: "#888", padding: "30px" }}>No hay cupones que coincidan.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
                {filteredCoupons.map((coupon) => (
                  <div key={`modal-${coupon.id_cupon}`} style={{ border: "1px dashed #D2C7BC", borderRadius: "10px", padding: "14px", background: "#FAF8F6" }}>
                    <span style={{ display: "inline-block", color: "white", background: coupon.nombre_tienda ? "#E37A24" : "#7A1E3A", padding: "3px 8px", borderRadius: "15px", fontSize: "0.7rem", fontWeight: 700 }}>{coupon.nombre_tienda ? `Tienda: ${coupon.nombre_tienda}` : "Global BookyHome"}</span>
                    <h3 style={{ margin: "14px 0 4px", color: "#7A1E3A", fontSize: "1.35rem" }}>{coupon.tipo_descuento === "fijo" ? `$${Number(coupon.valor_descuento).toLocaleString("es-CO")}` : `${Number(coupon.valor_descuento)}%`} <small style={{ color: "#666", fontWeight: 500 }}>Dcto.</small></h3>
                    <p style={{ margin: "0 0 12px", color: "#666", fontSize: "0.8rem" }}>Compra mínima: <strong>${Number(coupon.minimo_compra || 0).toLocaleString("es-CO")}</strong></p>
                    {coupon.fecha_fin && <p style={{ margin: "0 0 12px", color: "#888", fontSize: "0.75rem" }}>Válido hasta: {new Date(coupon.fecha_fin).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</p>}
                    <button type="button" onClick={() => handleCopy(coupon.codigo_cupon)} style={{ width: "100%", padding: "9px", border: "1px solid #D2C7BC", borderRadius: "7px", background: "#F4EDE6", fontWeight: 700, cursor: "pointer" }}>{copiedCode === coupon.codigo_cupon ? "Copiado" : coupon.codigo_cupon}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
