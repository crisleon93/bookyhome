import { useEffect, useState } from "react";
import { getCuponesDisponibles } from "../services/api";
import { notify } from "./ToastProvider";

export default function CouponsList() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
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
  }, []);

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

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#888" }}>Cargando cupones disponibles...</p>
      </div>
    );
  }

  return (
    <div className="pl-card" style={{ padding: "2rem", marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #7A1E3A 0%, #9C2F4A 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5v2"></path>
            <path d="M15 11v2"></path>
            <path d="M15 17v2"></path>
            <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"></path>
          </svg>
        </div>
        <div>
          <h2 style={{ margin: 0, color: "var(--gris-carbon)" }}>Cupones de Descuento</h2>
          <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>
            Aprovecha estos códigos especiales en tu próxima compra
          </p>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          <p>No hay cupones disponibles en este momento. ¡Vuelve pronto!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {coupons.map((coupon) => {
            const isFijo = coupon.tipo_descuento === "fijo";
            const valFormato = isFijo
              ? `$${Number(coupon.valor_descuento).toLocaleString("es-CO")}`
              : `${Number(coupon.valor_descuento)}%`;

            return (
              <div
                key={coupon.id_cupon}
                style={{
                  background: "linear-gradient(135deg, #fff 0%, #FAF8F6 100%)",
                  border: "2px dashed #D2C7BC",
                  borderRadius: "16px",
                  padding: "20px",
                  position: "relative",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(122, 30, 58, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.03)";
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
                  <h3 style={{ margin: "0 0 5px", fontSize: "1.6rem", fontWeight: 800, color: "var(--vinotinto)" }}>
                    {valFormato} <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "#666" }}>Dcto.</span>
                  </h3>

                  {coupon.minimo_compra > 0 && (
                    <p style={{ margin: "0 0 10px", fontSize: "0.8", color: "#666" }}>
                      Compra mínima: <strong>${Number(coupon.minimo_compra).toLocaleString("es-CO")}</strong>
                    </p>
                  )}

                  {coupon.fecha_fin && (
                    <p style={{ margin: "0 0 15px", fontSize: "0.75rem", color: "#999" }}>
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
                    background: "#F4EDE6",
                    border: "1px solid #D2C7BC",
                    borderRadius: "8px",
                    padding: "10px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: "var(--gris-carbon)",
                    letterSpacing: "1.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#EADFD3"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#F4EDE6"}
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
      )}
    </div>
  );
}
