import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrden, postPayment, sendConfirmationEmail } from "../services/api";

// ── Icons ──────────────────────────────────────────────────────────────────
const IconCreditCard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);

const IconPaypal = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H7.5a2.5 2.5 0 0 0-2.5 2.5v13a1.5 1.5 0 0 0 1.5 1.5h3.5a1.5 1.5 0 0 0 1.5-1.5v-3.5h2.5a4.5 4.5 0 0 0 4.5-4.5V6.5A4.5 4.5 0 0 0 12 2z"></path>
  </svg>
);

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

function Checkout() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("tarjeta"); // 'tarjeta' | 'paypal'
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form states for Credit Card
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // PayPal Simulator State
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");
  const [paypalError, setPaypalError] = useState("");
  const [paypalProcessing, setPaypalProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    getOrden(orderId)
      .then((res) => {
        setOrder(res.data);
        if (res.data.estado === "pagado") {
          setPaymentSuccess(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("No pudimos cargar los detalles de la orden. Verifica la información.");
        setLoading(false);
      });
  }, [orderId]);

  // Card Inputs Formatting
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    // Format in chunks of 4
    let formatted = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted);
    setFormErrors((prev) => ({ ...prev, cardNumber: "" }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
    setFormErrors((prev) => ({ ...prev, cardExpiry: "" }));
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
    setFormErrors((prev) => ({ ...prev, cardCvv: "" }));
  };

  const validateCardForm = () => {
    const errors = {};
    const rawCardNumber = cardNumber.replace(/\s/g, "");
    if (rawCardNumber.length !== 16) {
      errors.cardNumber = "Número de tarjeta inválido (deben ser 16 dígitos)";
    }
    if (!cardName.trim()) {
      errors.cardName = "Nombre completo es requerido";
    }
    if (cardExpiry.length !== 5) {
      errors.cardExpiry = "Fecha inválida (MM/AA)";
    } else {
      const [month] = cardExpiry.split("/");
      const m = parseInt(month, 10);
      if (m < 1 || m > 12) {
        errors.cardExpiry = "Mes inválido";
      }
    }
    if (cardCvv.length !== 3) {
      errors.cardCvv = "CVV inválido (3 dígitos)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const processPaymentApi = async (method) => {
  setPaymentProcessing(true);
  setError("");

  try {
    const payload = {
      order_id: parseInt(orderId),
      amount: parseFloat(order.total),
      payment_method: method
    };

    const res = await postPayment(payload);
    if (res.data && res.data.ok) {
      try {
        await sendConfirmationEmail(orderId);
      } catch (emailErr) {
        console.warn("Correo no enviado:", emailErr);
      }
      setPaymentSuccess(true);
    } else {
      setError("El pago fue rechazado por la pasarela de pagos.");
    }
  } catch (err) {
    console.error(err);
    setError(err.response?.data?.detail || "Ocurrió un error inesperado al procesar tu pago.");
  } finally {
    setPaymentProcessing(false);
  }
};

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!validateCardForm()) return;
    
    // Simulate gateway delay
    setPaymentProcessing(true);
    setTimeout(() => {
      processPaymentApi("Tarjeta de Crédito");
    }, 2000);
  };

  const handlePaypalSubmit = (e) => {
    e.preventDefault();
    if (!paypalEmail || !paypalPassword) {
      setPaypalError("Ingresa tu correo y contraseña");
      return;
    }
    setPaypalError("");
    setPaypalProcessing(true);
    
    setTimeout(() => {
      setPaypalProcessing(false);
      setShowPaypalModal(false);
      processPaymentApi("PayPal");
    }, 2000);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", backgroundColor: "#fdfbfa" }}>
        <p style={{ fontSize: "1.2rem", fontWeight: 600 }}>Cargando detalles de tu orden...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ padding: "40px 8%", minHeight: "60vh", backgroundColor: "#fdfbfa", textAlign: "center" }}>
        <p style={{ fontSize: "1.2rem", color: "red", fontWeight: 600 }}>{error}</p>
        <button className="btn btn-vinotinto" onClick={() => navigate("/post-login?seccion=Carrito")} style={{ display: "inline-block", width: "auto", marginTop: "20px" }}>
          Volver al Carrito
        </button>
      </div>
    );
  }

  if (paymentSuccess) {
  return (
    <div style={{ padding: "50px 8%", minHeight: "70vh", backgroundColor: "#fdfbfa", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{
        background: "var(--blanco)",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "var(--sombra-suave)",
        maxWidth: "540px",
        width: "100%",
        textAlign: "center",
        border: "1px solid #e0dbd4"
      }}>
        {/* Ícono animado */}
        <div style={{
          width: 80, height: 80,
          borderRadius: "50%",
          background: "#fdf0f2",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <IconCheckCircle />
        </div>

        <h1 style={{ fontWeight: 800, color: "var(--vinotinto)", margin: "0 0 8px", fontSize: "1.8rem" }}>
          ¡Compra Confirmada!
        </h1>
        <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "28px" }}>
          Tu pago fue procesado exitosamente. Te enviamos un correo con los detalles de tu pedido.
        </p>

        {/* Detalle de la orden */}
        <div style={{
          background: "#fcfaf7",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e0dbd4",
          textAlign: "left",
          marginBottom: "16px"
        }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Resumen de tu orden
          </p>

          {/* Libros */}
          <div style={{ margin: "12px 0", display: "grid", gap: "8px" }}>
            {order.items?.map((item) => (
              <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#444" }}>📖 {item.titulo} <span style={{ color: "#999" }}>x{item.cantidad}</span></span>
                <span style={{ fontWeight: 600 }}>
                  {Number(item.precio_libro * item.cantidad).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #e0dbd4", paddingTop: "12px", marginTop: "4px", display: "grid", gap: "6px", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>ID Orden</span>
              <span style={{ fontWeight: 600 }}>#{order.id_orden}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>Fecha</span>
              <span style={{ fontWeight: 600 }}>{new Date(order.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>Método de pago</span>
              <span style={{ fontWeight: 600 }}>{order.metodo_pago || "Confirmado digitalmente"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0dbd4", paddingTop: "10px", marginTop: "4px" }}>
              <span style={{ fontWeight: 700 }}>Total pagado</span>
              <span style={{ fontWeight: 800, color: "var(--rojo-suave)", fontSize: "1.05rem" }}>
                {Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Aviso del correo */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "#f0faf5", border: "1px solid #c3e6d4",
          borderRadius: "8px", padding: "12px 16px",
          marginBottom: "28px", fontSize: "0.85rem", color: "#2d6a4f"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Te enviamos un correo de confirmación con los detalles de tu compra.
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <button className="btn btn-vinotinto" onClick={() => navigate("/post-login?seccion=Mis Compras")} style={{ width: "100%" }}>
            Ir a Mis Compras
          </button>
          <button
            onClick={() => navigate("/catalogo")}
            style={{ width: "100%", padding: "12px", background: "transparent", border: "1.5px solid #e0dbd4", borderRadius: "8px", fontWeight: 600, cursor: "pointer", color: "var(--gris-carbon)" }}
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div style={{ padding: "40px 8%", minHeight: "75vh", backgroundColor: "#fdfbfa" }}>
      {paymentProcessing && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(255,255,255,0.9)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            border: "4px solid #f4ede2",
            borderTop: "4px solid var(--vinotinto)",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            animation: "spin 1s linear infinite"
          }}></div>
          <h2 style={{ fontWeight: 800, marginTop: "20px", color: "var(--gris-carbon)" }}>Procesando Pago de forma segura</h2>
          <p style={{ color: "#666" }}>Conectando con la pasarela de pago bancaria...</p>
        </div>
      )}

      <h1 style={{ fontWeight: 800, color: "var(--gris-carbon)", marginBottom: "30px" }}>Finalizar Compra</h1>

      {error && (
        <div style={{
          background: "#fdeced",
          border: "1px solid #f5c2c7",
          color: "#842029",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          fontWeight: 600
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "30px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Payment details */}
        <div style={{
          background: "var(--blanco)",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "var(--sombra-suave)",
          border: "1px solid #e0dbd4"
        }}>
          <h2 style={{ fontWeight: 700, margin: "0 0 20px 0", fontSize: "1.3rem" }}>Método de Pago</h2>

          <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
            <button
              onClick={() => setPaymentMethod("tarjeta")}
              style={{
                flex: 1,
                padding: "15px",
                borderRadius: "8px",
                border: paymentMethod === "tarjeta" ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4",
                background: paymentMethod === "tarjeta" ? "#fbf7f8" : "var(--blanco)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                color: paymentMethod === "tarjeta" ? "var(--vinotinto)" : "var(--gris-carbon)",
                transition: "var(--transition)"
              }}
            >
              <IconCreditCard />
              Tarjeta Crédito/Débito
            </button>

            <button
              onClick={() => setPaymentMethod("paypal")}
              style={{
                flex: 1,
                padding: "15px",
                borderRadius: "8px",
                border: paymentMethod === "paypal" ? "2px solid var(--vinotinto)" : "1px solid #e0dbd4",
                background: paymentMethod === "paypal" ? "#fbf7f8" : "var(--blanco)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                color: paymentMethod === "paypal" ? "var(--vinotinto)" : "var(--gris-carbon)",
                transition: "var(--transition)"
              }}
            >
              <IconPaypal />
              PayPal
            </button>
          </div>

          {paymentMethod === "tarjeta" ? (
            <form onSubmit={handleCardSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Nombre del Titular</label>
                  <input
                    type="text"
                    placeholder="Como aparece en la tarjeta"
                    value={cardName}
                    onChange={(e) => { setCardName(e.target.value); setFormErrors(p => ({ ...p, cardName: "" })); }}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "6px", border: formErrors.cardName ? "1.5px solid red" : "1.5px solid #e0dbd4", outline: "none", fontFamily: "'Montserrat', sans-serif"
                    }}
                  />
                  {formErrors.cardName && <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.cardName}</span>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Número de Tarjeta</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "6px", border: formErrors.cardNumber ? "1.5px solid red" : "1.5px solid #e0dbd4", outline: "none", fontFamily: "'Montserrat', sans-serif"
                    }}
                  />
                  {formErrors.cardNumber && <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.cardNumber}</span>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Vencimiento</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      maxLength={5}
                      style={{
                        width: "100%", padding: "10px", borderRadius: "6px", 
                        border: formErrors.cardExpiry ? "1.5px solid red" : "1.5px solid #e0dbd4", 
                        outline: "none", fontFamily: "'Montserrat', sans-serif"
                      }}
                    />
                    {formErrors.cardExpiry && <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.cardExpiry}</span>}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Cvv (Seguridad)</label>
                    <input
                      type="password"
                      placeholder="123"
                      value={cardCvv}
                      onChange={handleCvvChange}
                      style={{
                        width: "100%", padding: "10px", borderRadius: "6px", border: formErrors.cardCvv ? "1.5px solid red" : "1.5px solid #e0dbd4", outline: "none", fontFamily: "'Montserrat', sans-serif"
                      }}
                    />
                    {formErrors.cardCvv && <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.cardCvv}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "25px 0", color: "#666", fontSize: "0.85rem" }}>
                <IconShield />
                <span>Sus datos bancarios están encriptados y procesados de manera segura.</span>
              </div>

              <button type="submit" className="btn btn-vinotinto" style={{ width: "100%", marginTop: "10px" }}>
                Pagar {Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ color: "#666", marginBottom: "25px", fontSize: "0.95rem" }}>
                Al dar click al botón, abriremos un simulador de pago seguro para que apruebes la transacción desde tu cuenta de PayPal.
              </p>
              <button
                onClick={() => setShowPaypalModal(true)}
                className="btn btn-primary"
                style={{
                  background: "#FFC439",
                  borderColor: "#FFC439",
                  color: "#111",
                  width: "100%",
                  maxWidth: "350px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontWeight: 700
                }}
              >
                <IconPaypal />
                Pagar con PayPal
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Order summary */}
        <div style={{
          background: "var(--beige)",
          padding: "30px",
          borderRadius: "12px",
          border: "1px solid #e0dbd4"
        }}>
          <h2 style={{ fontWeight: 700, margin: "0 0 20px 0", fontSize: "1.3rem", color: "var(--gris-carbon)" }}>Resumen de Orden</h2>

          <div style={{ maxHeight: "300px", overflowY: "auto", display: "grid", gap: "15px", marginBottom: "20px" }}>
            {order.items?.map((item) => (
              <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                <div style={{ maxWidth: "70%" }}>
                  <p style={{ margin: "0", fontWeight: 600 }}>{item.titulo}</p>
                  <p style={{ margin: "2px 0 0 0", color: "#666", fontSize: "0.8rem" }}>Cant: {item.cantidad}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 700 }}>
                    {Number(item.precio_libro * item.cantidad).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1.5px solid #e0dbd4", paddingTop: "20px", display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span>Subtotal</span>
              <span>{Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span>Envío</span>
              <span style={{ color: "green", fontWeight: 600 }}>Gratis</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, marginTop: "10px", borderTop: "1px solid #e0dbd4", paddingTop: "15px" }}>
              <span>Total</span>
              <span style={{ color: "var(--rojo-suave)" }}>
                {Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PAYPAL SIMULATOR MODAL */}
      {showPaypalModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1100,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "15px"
        }}>
          <div style={{
            background: "#fff",
            maxWidth: "450px",
            width: "100%",
            borderRadius: "12px",
            padding: "30px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1.5px solid #f0f0f0", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconPaypal />
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#003087" }}>PayPal Sandbox</span>
              </div>
              <button
                onClick={() => setShowPaypalModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", fontWeight: 800, color: "#666" }}
              >
                &times;
              </button>
            </div>

            {paypalError && (
              <p style={{ color: "red", fontSize: "0.85rem", marginBottom: "15px", fontWeight: 600 }}>{paypalError}</p>
            )}

            <form onSubmit={handlePaypalSubmit}>
              <div style={{ display: "grid", gap: "15px", marginBottom: "25px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Correo electrónico PayPal</label>
                  <input
                    type="email"
                    placeholder="comprador-sandbox@example.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1.5px solid #e0dbd4", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Contraseña Sandbox</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={paypalPassword}
                    onChange={(e) => setPaypalPassword(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1.5px solid #e0dbd4", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowPaypalModal(false)}
                  style={{ flex: 1, padding: "12px", background: "#f0f0f0", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={paypalProcessing}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#0070ba",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    cursor: paypalProcessing ? "not-allowed" : "pointer",
                    opacity: paypalProcessing ? 0.7 : 1
                  }}
                >
                  {paypalProcessing ? "Validando..." : `Pagar ${Number(order.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animation injection for spin */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Checkout;
