import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getUsuarios, getCarrito, checkoutCarrito } from "../services/api";
import DashboardSidebar from "../components/DashboardSidebar";

const IconCartBig = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth="1.8" 
    style={{ width: "36px", height: "36px", minWidth: "36px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

// ── Estado vacío del carrito ──
const CartEmptyState = ({ onGoToCatalog }) => (
  <div className="cart-empty-state">
    <div className="cart-empty-icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth="1.5" width="36" height="36">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    </div>
    <h2>Tu carrito está vacío</h2>
    <p>Explora el catálogo y encuentra tu próxima lectura favorita.</p>
    <button className="btn btn-vinotinto btn-catalog" onClick={onGoToCatalog}>
      📚 Ir al catálogo
    </button>
  </div>
);

export default function PostLogin() {
  const [userName, setUserName]     = useState("");
  const [userEmail, setUserEmail]   = useState("");
  const [userId, setUserId]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeSide, setActiveSide] = useState("Inicio");

  const [carrito, setCarrito]               = useState([]);
  const [cartLoading, setCartLoading]       = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError]   = useState(null);   // ← nuevo

  const navigate = useNavigate();

  // Decodificar token y cargar datos de usuario
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    try {
      const payload = jwtDecode(token);
      setUserName(payload.nombre || "Usuario");
      const id = parseInt(payload.sub);
      setUserId(id);

      getUsuarios()
        .then((res) => {
          const usuario = res.data.find((u) => u.id_usuario === id);
          if (usuario) setUserEmail(usuario.correo_usuario);
        })
        .catch((err) => console.error(err));
    } catch (error) {
      console.error("Error al decodificar token:", error);
      setUserName("Usuario");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Cargar carrito cuando se selecciona la sección
  useEffect(() => {
    if (activeSide === "Carrito" && userId) {
      setCartLoading(true);
      setCheckoutError(null);
      getCarrito(userId)
        .then((res) => setCarrito(res.data))
        .catch((err) => console.error(err))
        .finally(() => setCartLoading(false));
    }
  }, [activeSide, userId]);

  const handleCheckout = () => {
    setCheckoutLoading(true);
    setCheckoutError(null);

    checkoutCarrito()
      .then((res) => {
        if (res.data?.ok) {
          navigate(`/checkout/${res.data.order.id_orden}`);
        } else {
          setCheckoutError("No se pudo procesar el pago. Intenta de nuevo.");
        }
      })
      .catch((err) => {
        console.error(err);
        setCheckoutError(
          err.response?.data?.detail || "Error al realizar el checkout. Intenta de nuevo."
        );
      })
      .finally(() => setCheckoutLoading(false));
  };

  // Navegar al catálogo (ajusta la ruta si cambia)
  const handleGoToCatalog = () => navigate("/catalogo");

  const totalCarrito = carrito.reduce(
    (acc, item) => acc + Number(item.precio_libro || 0) * Number(item.cantidad || 1),
    0
  );

  if (loading) return <div className="auth-main">Cargando dashboard...</div>;

  return (
    <div className="dashboard-container">
      <DashboardSidebar
        userName={userName}
        userEmail={userEmail}
        activeSide={activeSide}
        onSelect={setActiveSide}
      />

      <main className="dashboard-main">

        {/* ── INICIO ── */}
        {activeSide === "Inicio" && (
          <>
            <div className="welcome-card">
              <h1>Bienvenido de nuevo, {userName.split(" ")[0]} 👋</h1>
              <p>Esta es tu área personal de BookyHome.</p>
            </div>
            <div className="empty-state">
              <p>Próximamente aparecerán tus recomendaciones y novedades</p>
            </div>
          </>
        )}

        {/* ── CARRITO ── */}
        {activeSide === "Carrito" && (
          <>
            <div className="pl-card" style={{ padding: "2.5rem 2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <IconCartBig />
                <h2 style={{ margin: 0 }}>Mi Carrito</h2>
              </div>
            </div>

            {cartLoading ? (
              <div className="empty-state"><p>Cargando carrito...</p></div>

            ) : carrito.length === 0 ? (
              // ── Estado vacío con CTA al catálogo ──
              <CartEmptyState onGoToCatalog={handleGoToCatalog} />

            ) : (
              <div className="pl-card">
                {carrito.map((item) => (
                  <div key={item.id_libro} className="pl-order-row">
                    <div className="pl-order-left">
                      <span className="pl-order-emoji">📖</span>
                      <div>
                        <p className="pl-order-title">{item.titulo}</p>
                        <p className="pl-order-meta">
                          {item.autor_libro} · Cantidad: {item.cantidad}
                        </p>
                      </div>
                    </div>
                    <div className="pl-order-right">
                      <span className="pl-order-price">
                        {Number(
                          (item.precio_libro || 0) * (item.cantidad || 1)
                        ).toLocaleString("es-CO", {
                          style: "currency", currency: "COP", maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* ── Total + error + botón de pago ── */}
                <div style={{
                  marginTop: 20, paddingTop: 20, borderTop: "2px solid #e0dbd4",
                  display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16,
                }}>
                  <h2 style={{ fontWeight: 800, margin: 0 }}>
                    Total a pagar:{" "}
                    <span style={{ color: "var(--rojo-suave)" }}>
                      {totalCarrito.toLocaleString("es-CO", {
                        style: "currency", currency: "COP", maximumFractionDigits: 0,
                      })}
                    </span>
                  </h2>

                  {/* Mensaje de error del checkout */}
                  {checkoutError && (
                    <p style={{
                      color: "var(--rojo-suave)", fontSize: 14,
                      margin: 0, textAlign: "right",
                    }}>
                      ⚠️ {checkoutError}
                    </p>
                  )}

                  <button
                    className="btn btn-vinotinto"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    style={{
                      width: "auto", minWidth: 250,
                      cursor: checkoutLoading ? "not-allowed" : "pointer",
                      opacity: checkoutLoading ? 0.7 : 1,
                    }}
                  >
                    {checkoutLoading ? "Procesando..." : "💳 Proceder al Pago"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── OTRAS SECCIONES ── */}
        {!["Inicio", "Carrito"].includes(activeSide) && (
          <div className="welcome-card">
            <h1>{activeSide}</h1>
            <p>Esta sección estará disponible próximamente.</p>
          </div>
        )}

      </main>
    </div>
  );
}