import { useState, useEffect, useCallback } from "react";
import { IconCart, IconBookOpen, IconPackage, IconLock, IconCheck } from "../Icons";
import { notify } from "../ToastProvider";
import api, { getCarrito, checkoutCarrito, getOrdenes, getOrden, postPayment, sendConfirmationEmail, cancelOrder, aplicarCupon, getDirecciones } from "../../services/api";
import { useNavigate } from "react-router-dom";

const CartEmptyState = ({ onGoToCatalog }) => (
  <div className="cart-empty-state" style={{ textAlign: "center", padding: "50px 0" }}>
    <div className="cart-empty-icon" style={{ marginBottom: "20px", color: "var(--vinotinto)" }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ margin: "0 auto" }}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    </div>
    <h2 style={{ fontWeight: 700, color: "var(--gris-carbon)" }}>Tu carrito está vacío</h2>
    <p style={{ color: "#666", marginBottom: "20px" }}>Explora el catálogo y encuentra tu próxima lectura favorita.</p>
    <button className="btn btn-vinotinto" onClick={onGoToCatalog} style={{ width: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      Ir al catálogo
    </button>
  </div>
);

export default function SeccionCarrito({ userId }) {
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState('');
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [order, setOrder] = useState(null);
  const [orderId, setOrderId] = useState(null);
  
  const [paymentMethod, setPaymentMethod] = useState("tarjeta");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // Card
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [formErrors, setFormErrors] = useState({});
  
  // States for new payment methods
  const [sucursalCodigo, setSucursalCodigo] = useState("");
  const [sucursalPagoConfirmado, setSucursalPagoConfirmado] = useState(false);
  const [sucursalEsperandoConfirmacion, setSucursalEsperandoConfirmacion] = useState(false);
  const nequiSelected = false;
  const [pseBanco, setPseBanco] = useState("");
  const [pseRedirecting, setPseRedirecting] = useState(false);
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");
  const [paypalError, setPaypalError] = useState("");
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  
  // Modal cancelar orden
  const [ordenACancelar, setOrdenACancelar] = useState(null);
  const [cancelandoOrden, setCancelandoOrden] = useState(false);
  
  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  
  const esOrdenPendiente = (o) => {
    if (!o) return false;
    const est = String(o.estado || o.estado_orden || '').toLowerCase().trim();
    return est === 'pendiente' || est === 'pendiente de pago' || est.startsWith('pend');
  };

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  const loadData = useCallback(() => {
    if (userId) {
      setCartLoading(true);
      Promise.all([getCarrito(), getOrdenes(), getDirecciones()])
        .then(([carritoRes, ordenesRes, direccionesRes]) => {
          setCarrito(carritoRes.data);
          setOrdenes(ordenesRes.data);
          const disponibles = direccionesRes.data || [];
          setDirecciones(disponibles);
          setDireccionSeleccionadaId((actual) => actual || String(disponibles.find((direccion) => direccion.es_principal)?.id_direccion || disponibles[0]?.id_direccion || ''));
        })
        .catch(err => console.error(err))
        .finally(() => setCartLoading(false));
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onGoToCatalog = () => {
    navigate('/?seccion=Catálogo');
  };

  const onCheckout = () => {
    if (!direccionSeleccionadaId) {
      setCheckoutError('Selecciona una dirección de entrega antes de continuar.');
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    checkoutCarrito({ id_direccion: Number(direccionSeleccionadaId) })
      .then((res) => {
        if (res.data?.ok) {
          setOrderId(res.data.order.id_orden);
          setOrder(res.data.order);
          setMostrarCheckout(true);
          getOrden(res.data.order.id_orden)
            .then((orderRes) => setOrder(orderRes.data))
            .catch((err) => console.error(err));
        } else {
          setCheckoutError("No se pudo procesar el pago. Intenta de nuevo.");
        }
      })
      .catch((err) => {
        setCheckoutError(err.response?.data?.detail || "Error al realizar el checkout. Intenta de nuevo.");
      })
      .finally(() => setCheckoutLoading(false));
  };

  const onVolverCarrito = () => {
    setMostrarCheckout(false);
    setOrderId(null);
    setOrder(null);
    setPaymentSuccess(false);
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setFormErrors({});
    
    // Limpiar estados de métodos de pago
    setSucursalCodigo("");
    setSucursalPagoConfirmado(false);
    setSucursalEsperandoConfirmacion(false);
    setPseBanco("");
    setPseRedirecting(false);
    
    loadData();
  };

  const onSetOrdenACancelar = (orden) => {
    setOrdenACancelar(orden);
  };

  const onConfirmarCancelarOrden = async () => {
    if (!ordenACancelar) return;
    setCancelandoOrden(true);
    try {
      await cancelOrder(ordenACancelar.id_orden);
      notify('Orden cancelada exitosamente', 'success');
      setOrdenACancelar(null);
      loadData();
    } catch {
      notify('No se pudo cancelar la orden', 'error');
    } finally {
      setCancelandoOrden(false);
    }
  };

  const generarCodigoPago = () => setSucursalCodigo(Math.random().toString(36).substring(2, 12).toUpperCase());
  const handleNequiRedirect = () => {
    window.location.href = `nequi://pagar?valor=${order?.total}&referencia=${order?.id_orden}`;
    setTimeout(() => { if (!nequiSelected) window.open('https://www.nequi.com.co', '_blank'); }, 2000);
  };
  const handleDaviplataRedirect = () => {
    window.location.href = `daviplata://pagar?valor=${order?.total}&referencia=${order?.id_orden}`;
    setTimeout(() => { if (!nequiSelected) window.open('https://www.daviplata.com', '_blank'); }, 2000);
  };
  const verificarPagoEfecty = () => {
    setTimeout(() => {
      setSucursalPagoConfirmado(true);
      setSucursalEsperandoConfirmacion(false);
      processPaymentApi("Pago en Efecty");
    }, 1200);
  };
  const handleSucursalPago = () => {
    generarCodigoPago();
    setSucursalEsperandoConfirmacion(true);
  };
  const bancosPSE = [
    { codigo: "001", nombre: "Bancolombia" },
    { codigo: "002", nombre: "Banco de Bogotá" },
    { codigo: "003", nombre: "Banco Popular" },
    { codigo: "004", nombre: "BBVA Colombia" },
    { codigo: "005", nombre: "Davivienda" },
    { codigo: "006", nombre: "Banco de Occidente" }
  ];
  const handlePseRedirect = () => {
    if (!pseBanco) { notify("Por favor selecciona un banco", "error"); return; }
    setPseRedirecting(true);
    setTimeout(() => {
      setPseRedirecting(false);
      processPaymentApi("PSE");
    }, 1200);
  };
  const handlePaypalSubmit = (e) => {
    e.preventDefault();
    if (!paypalEmail || !paypalPassword) { setPaypalError("Ingresa tu correo y contraseña"); return; }
    setPaypalError("");
    setPaypalProcessing(true);
    setTimeout(() => {
      setPaypalProcessing(false);
      setShowPaypalModal(false);
      processPaymentApi("PayPal");
    }, 2000);
  };

  const handleValidateCoupon = async (e) => {
    e?.preventDefault();
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Ingresa un código de cupón.");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await api.post("/cupones/validar", {
        codigo: code,
        order_id: Number(orderId),
        total: Number(order?.total || 0)
      });
      const payload = res.data?.data || res.data || {};
      if (payload?.valido === false || payload?.ok === false) {
        setDiscountAmount(0);
        setCouponError("El cupón ingresado no es válido.");
        return;
      }
      setDiscountAmount(Math.max(0, Number(payload.descuento || payload.valor_descuento || 0)));
      setCouponSuccess(payload.mensaje || "Cupón aplicado correctamente.");
    } catch {
      setDiscountAmount(0);
      setCouponError("El cupón ingresado no es válido.");
    } finally {
      setCouponLoading(false);
    }
  };

  const processPaymentApi = async (method) => {
    if (order?.estado && !esOrdenPendiente(order)) {
      setCheckoutError('Esta orden ya no está pendiente de pago. Actualiza tus pedidos para consultar su estado.');
      return;
    }
    setPaymentProcessing(true);
    setCheckoutError("");
    try {
      const baseTotal = Number(order?.total || 0);
      const amountToCharge = Math.max(0, baseTotal - discountAmount);
      const payload = {
        order_id: parseInt(orderId),
        amount: parseFloat(amountToCharge),
        payment_method: method,
        ...(couponCode.trim() ? { coupon_code: couponCode.trim() } : {})
      };
      const res = await postPayment(payload);
      if (res.data && res.data.ok) {
        if (couponCode.trim() && discountAmount > 0) {
          try {
            await aplicarCupon({ codigo: couponCode.trim(), id_orden: parseInt(orderId), total: baseTotal });
          } catch (e) { console.warn(e); }
        }
        try {
          await sendConfirmationEmail(orderId);
        } catch (e) { console.warn(e); }
        
        setMostrarCheckout(false);
        setPaymentSuccess(true);
      } else {
        setCheckoutError("El pago fue rechazado por la pasarela de pagos.");
      }
    } catch (err) {
      setCheckoutError(err.response?.data?.detail || "Ocurrió un error inesperado al procesar tu pago.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const validateCardForm = () => {
    const errors = {};
    const rawCardNumber = cardNumber.replace(/\s/g, "");
    if (rawCardNumber.length !== 16) errors.cardNumber = "Número de tarjeta inválido";
    if (!cardName.trim()) errors.cardName = "Nombre completo es requerido";
    if (cardExpiry.length !== 5) errors.cardExpiry = "Fecha inválida";
    if (cardCvv.length !== 3) errors.cardCvv = "CVV inválido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!validateCardForm()) return;
    setPaymentProcessing(true);
    setTimeout(() => {
      processPaymentApi("Tarjeta de Crédito");
    }, 2000);
  };

  const baseTotal = order ? Number(order.total || 0) : 0;
  const totalToPay = Math.max(0, baseTotal - discountAmount);
  const totalCarrito = carrito.reduce(
    (acc, item) => acc + Number(item.precio_libro || 0) * Number(item.cantidad || 1), 0
  );

  return (
    <>
      <div className="pl-card" style={{ padding: "2.5rem 2rem", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconCart width={28} height={28} strokeWidth={2} style={{ color: '#7A1E3A' }} />
          <h2 style={{ margin: 0 }}>Mi Carrito</h2>
        </div>
      </div>
      
      {cartLoading ? (
        <div className="empty-state"><p>Cargando carrito...</p></div>
      ) : paymentSuccess && !mostrarCheckout ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          <div style={{ marginTop: "0" }}>
            <button onClick={onVolverCarrito} style={{ background: 'var(--vinotinto)', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '6px', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver al carrito
            </button>
            <div style={{ background: "var(--blanco)", padding: "40px", borderRadius: "16px", boxShadow: "var(--sombra-suave)", border: "1px solid #e0dbd4", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fdf0f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h1 style={{ fontWeight: 800, color: "var(--vinotinto)", margin: "0 0 8px", fontSize: "1.8rem" }}>¡Compra Confirmada!</h1>
              <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "28px" }}>
                Tu pago fue procesado exitosamente. Te enviamos un correo con los detalles de tu pedido.
              </p>
              {order && (
                <div style={{ background: "#fcfaf7", padding: "20px", borderRadius: "10px", border: "1px solid #e0dbd4", textAlign: "left", marginBottom: "24px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Resumen de tu orden
                  </p>
                  <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                    {order.items?.map((item) => (
                      <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                        <span style={{ color: "#444" }}>📖 {item.titulo} <span style={{ color: "#999" }}>x{item.cantidad}</span></span>
                        <span style={{ fontWeight: 600 }}>
                          {Number(item.precio_libro * item.cantidad).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid #e0dbd4", paddingTop: "12px", display: "grid", gap: "8px", fontSize: "0.9rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>ID Orden</span>
                      <span style={{ fontWeight: 600 }}>#{order.id_orden}</span>
                    </div>
                    {discountAmount > 0 && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#666" }}>Subtotal</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(baseTotal)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", background: "#f0faf0", padding: "6px 10px", borderRadius: "6px", border: "1px solid #c8e6c9" }}>
                          <span style={{ color: "#2e7d32" }}>🏷️ Cupón {couponCode}</span>
                          <span style={{ color: "#2e7d32", fontWeight: 700 }}>-{formatCurrency(discountAmount)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0dbd4", paddingTop: "10px", marginTop: "4px" }}>
                      <span style={{ fontWeight: 700 }}>Total pagado</span>
                      <span style={{ fontWeight: 800, color: "#C5425A", fontSize: "1.05rem" }}>
                        {formatCurrency(totalToPay)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <button
                className="btn btn-vinotinto"
                onClick={() => navigate('/?seccion=Mis%20Compras')}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 01-8 0"></path>
                </svg>
                Ir a Mis Compras
              </button>
            </div>
          </div>
        </div>
      ) : carrito.length === 0 && ordenes.filter(esOrdenPendiente).length === 0 ? (
        <div className="pl-card" style={{ padding: "40px" }}><CartEmptyState onGoToCatalog={onGoToCatalog} /></div>
      ) : mostrarCheckout ? (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          <div className="pl-card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0" }}>Selecciona tu método de pago</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              {[{id: "tarjeta", label: "Tarjeta"}, {id: "paypal", label: "PayPal"}, {id: "sucursal", label: "Pago en punto autorizado"}, {id: "pse", label: "PSE"}, {id: "nequi", label: "Nequi/Daviplata"}, {id: "transferencia", label: "Transferencia"}].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "8px", minWidth: "120px",
                    border: paymentMethod === method.id ? "2px solid var(--vinotinto)" : "1px solid #ddd",
                    background: paymentMethod === method.id ? "#fdf0f2" : "white",
                    fontWeight: 600, cursor: "pointer", textTransform: "capitalize"
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {paymentMethod === "tarjeta" && (
              <form onSubmit={handleCardSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: 5 }}>Número de Tarjeta</label>
                  <input type="text" value={cardNumber} onChange={e => {
                    let v = e.target.value.replace(/\D/g, "").slice(0,16);
                    setCardNumber(v.match(/.{1,4}/g)?.join(" ") || "");
                  }} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} placeholder="0000 0000 0000 0000" />
                  {formErrors.cardNumber && <p style={{ color: "red", fontSize: 12, margin: 0 }}>{formErrors.cardNumber}</p>}
                </div>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: 5 }}>Vencimiento (MM/AA)</label>
                    <input type="text" value={cardExpiry} onChange={e => {
                      let v = e.target.value.replace(/\D/g, "").slice(0,4);
                      setCardExpiry(v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v);
                    }} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} placeholder="MM/AA" />
                    {formErrors.cardExpiry && <p style={{ color: "red", fontSize: 12, margin: 0 }}>{formErrors.cardExpiry}</p>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: 5 }}>CVV</label>
                    <input type="text" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0,3))} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} placeholder="123" />
                    {formErrors.cardCvv && <p style={{ color: "red", fontSize: 12, margin: 0 }}>{formErrors.cardCvv}</p>}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 5 }}>Nombre del Titular</label>
                  <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} placeholder="Juan Pérez" />
                  {formErrors.cardName && <p style={{ color: "red", fontSize: 12, margin: 0 }}>{formErrors.cardName}</p>}
                </div>
                {checkoutError && <p style={{ color: "red", margin: 0 }}>{checkoutError}</p>}
                <button type="submit" disabled={paymentProcessing} style={{ background: "var(--vinotinto)", color: "white", padding: "15px", borderRadius: "8px", border: "none", fontWeight: 700, fontSize: "1rem", cursor: "pointer", opacity: paymentProcessing ? 0.7 : 1 }}>
                  {paymentProcessing ? "Procesando pago..." : `Pagar ${formatCurrency(totalToPay)}`}
                </button>
              </form>
            )}

            {paymentMethod === "paypal" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: "#666", marginBottom: "25px", fontSize: "0.95rem" }}>
                  Al dar click al botón, abriremos un simulador de pago seguro para que apruebes la transacción desde tu cuenta de PayPal.
                </p>
                <button
                  onClick={() => setShowPaypalModal(true)}
                  className="btn btn-primary"
                  style={{
                    background: "#FFC439", borderColor: "#FFC439", color: "#111", width: "100%", maxWidth: "350px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px", fontWeight: 700
                  }}
                >
                  Pagar con PayPal
                </button>
              </div>
            )}
            
            {paymentMethod === "sucursal" && (
              <div style={{ padding: "20px 0" }}>
                {!sucursalCodigo ? (
                  <>
                    <div style={{ background: "#fcfaf7", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e0dbd4" }}>
                      <h3 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1.1rem" }}>Pago en punto autorizado</h3>
                      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "15px" }}>Generaremos un código único para pagar en un punto Efecty autorizado. La transportadora se asignará después, cuando el vendedor despache tu pedido.</p>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666" }}>Total a pagar:</span>
                        <span style={{ fontWeight: 700, color: "var(--vinotinto)" }}>{formatCurrency(totalToPay)}</span>
                      </div>
                    </div>
                    <button onClick={handleSucursalPago} className="btn btn-vinotinto" style={{ width: "100%" }}>Generar Código de Pago</button>
                  </>
                ) : (
                  <>
                    <div style={{ background: sucursalPagoConfirmado ? "#e8f5e9" : "#e3f2fd", padding: "25px", borderRadius: "8px", marginBottom: "20px", border: `2px solid ${sucursalPagoConfirmado ? "#4caf50" : "#2196f3"}`, textAlign: "center" }}>
                      {sucursalPagoConfirmado ? (
                        <>
                          <h3 style={{ margin: "0 0 10px", color: "#2e7d32", fontSize: "1.2rem" }}>¡Pago Confirmado!</h3>
                          <p style={{ margin: "0 0 10px", color: "#666", fontSize: "0.9rem" }}>Efecty ha confirmado tu pago exitosamente.</p>
                        </>
                      ) : sucursalEsperandoConfirmacion ? (
                        <>
                          <h3 style={{ margin: "0 0 10px", color: "#1976d2", fontSize: "1.2rem" }}>Esperando Confirmación</h3>
                          <p style={{ margin: "0 0 10px", color: "#666", fontSize: "0.9rem" }}>Presenta este código en cualquier punto Efecty:</p>
                          <p style={{ margin: "0", fontSize: "2rem", fontWeight: 800, color: "#1976d2", letterSpacing: "4px" }}>{sucursalCodigo}</p>
                          <p style={{ marginTop: "15px", color: "#666", fontSize: "0.9rem" }}>Esperando confirmación de pago...</p>
                        </>
                      ) : (
                        <>
                          <h3 style={{ margin: "0 0 10px", color: "#2e7d32", fontSize: "1.2rem" }}>¡Código Generado!</h3>
                          <p style={{ margin: "0 0 10px", color: "#666", fontSize: "0.9rem" }}>Presenta este código en Efecty:</p>
                          <p style={{ margin: "0", fontSize: "2rem", fontWeight: 800, color: "#2e7d32", letterSpacing: "4px" }}>{sucursalCodigo}</p>
                        </>
                      )}
                    </div>
                    {!sucursalPagoConfirmado && (
                      <div style={{ display: 'grid', gap: 10 }}>
                        <button onClick={verificarPagoEfecty} className="btn btn-vinotinto" style={{ width: "100%" }}>Ya realicé el pago</button>
                        <button onClick={() => { setSucursalCodigo(""); setSucursalEsperandoConfirmacion(false); }} style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "2px solid var(--vinotinto)", background: "var(--blanco)", color: "var(--vinotinto)", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {paymentMethod === "pse" && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ background: "#fcfaf7", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e0dbd4" }}>
                  <h3 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1.1rem" }}>Pago con PSE</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                    <span style={{ color: "#666" }}>Total a pagar:</span>
                    <span style={{ fontWeight: 700, color: "var(--vinotinto)" }}>{formatCurrency(totalToPay)}</span>
                  </div>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Selecciona tu banco:</label>
                  <select value={pseBanco} onChange={(e) => setPseBanco(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1.5px solid #e0dbd4", outline: "none", fontSize: "0.95rem" }}>
                    <option value="">-- Selecciona un banco --</option>
                    {bancosPSE.map((banco) => (
                      <option key={banco.codigo} value={banco.codigo}>{banco.nombre}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handlePseRedirect} disabled={pseRedirecting || !pseBanco} className="btn btn-vinotinto" style={{ width: "100%", opacity: pseRedirecting || !pseBanco ? 0.7 : 1 }}>
                  {pseRedirecting ? "Confirmando pago..." : "Confirmar pago con PSE"}
                </button>
              </div>
            )}
            
            {paymentMethod === "nequi" && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ background: "#fcfaf7", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e0dbd4" }}>
                  <h3 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1.1rem" }}>Pago con Nequi/Daviplata</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                    <span style={{ color: "#666" }}>Total a pagar:</span>
                    <span style={{ fontWeight: 700, color: "var(--vinotinto)" }}>{formatCurrency(totalToPay)}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gap: "12px" }}>
                  <button onClick={handleNequiRedirect} style={{ padding: "16px", borderRadius: "8px", border: "2px solid #2d7d3a", background: "#fff", color: "#2d7d3a", fontWeight: 700, cursor: "pointer" }}>
                    Pagar con Nequi
                  </button>
                  <button onClick={handleDaviplataRedirect} style={{ padding: "16px", borderRadius: "8px", border: "2px solid #e65100", background: "#fff", color: "#e65100", fontWeight: 700, cursor: "pointer" }}>
                    Pagar con Daviplata
                  </button>
                </div>
              </div>
            )}
            
            {paymentMethod === "transferencia" && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ background: "#fcfaf7", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e0dbd4" }}>
                  <h3 style={{ margin: "0 0 15px", color: "var(--vinotinto)", fontSize: "1.1rem" }}>Transferencia Bancaria</h3>
                  <div style={{ display: "grid", gap: "10px", fontSize: "0.9rem", background: "#fff", padding: "15px", borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#666" }}>Banco:</span><span style={{ fontWeight: 700 }}>Bancolombia</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#666" }}>Tipo de cuenta:</span><span style={{ fontWeight: 700 }}>Ahorros</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#666" }}>Número de cuenta:</span><span style={{ fontWeight: 700 }}>123-456789-0</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#666" }}>Titular:</span><span style={{ fontWeight: 700 }}>BookyHome S.A.S</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0dbd4", paddingTop: "10px", marginTop: "5px" }}>
                      <span style={{ color: "#666" }}>Total a pagar:</span><span style={{ fontWeight: 700, color: "var(--vinotinto)" }}>{formatCurrency(totalToPay)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => processPaymentApi("Transferencia Bancaria")} className="btn btn-vinotinto" style={{ width: "100%" }}>
                  Confirmar Transferencia
                </button>
              </div>
            )}
            
            <button onClick={onVolverCarrito} style={{ background: "none", border: "none", color: "#666", textDecoration: "underline", cursor: "pointer", marginTop: 20 }}>Volver al carrito</button>
          </div>

          {/* PAYPAL SIMULATOR MODAL */}
          {showPaypalModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
              <div style={{ background: "#fff", maxWidth: "450px", width: "100%", borderRadius: "12px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1.5px solid #f0f0f0", paddingBottom: "10px" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#003087" }}>PayPal Sandbox</span>
                  <button onClick={() => setShowPaypalModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", fontWeight: 800, color: "#666" }}>&times;</button>
                </div>
                {paypalError && <p style={{ color: "red", fontSize: "0.85rem", marginBottom: "15px", fontWeight: 600 }}>{paypalError}</p>}
                <form onSubmit={handlePaypalSubmit}>
                  <div style={{ display: "grid", gap: "15px", marginBottom: "25px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Correo electrónico PayPal</label>
                      <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1.5px solid #e0dbd4" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "5px" }}>Contraseña Sandbox</label>
                      <input type="password" value={paypalPassword} onChange={(e) => setPaypalPassword(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1.5px solid #e0dbd4" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="button" onClick={() => setShowPaypalModal(false)} style={{ flex: 1, padding: "12px", background: "#f0f0f0", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                    <button type="submit" disabled={paypalProcessing} style={{ flex: 1, padding: "12px", background: "#0070ba", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer", opacity: paypalProcessing ? 0.7 : 1 }}>
                      {paypalProcessing ? "Validando..." : `Pagar ${formatCurrency(totalToPay)}`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          <div className="pl-card" style={{ padding: "24px", height: "fit-content" }}>
            <h3 style={{ margin: "0 0 20px 0" }}>Resumen de Compra</h3>
            {order?.items?.map(item => (
              <div key={item.id_libro} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "0.9rem" }}>
                <span>{item.titulo} x{item.cantidad}</span>
                <span>{formatCurrency(item.precio_libro * item.cantidad)}</span>
              </div>
            ))}
            <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "20px 0" }} />
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Código de cupón" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
              <button onClick={handleValidateCoupon} disabled={couponLoading} style={{ background: "#444", color: "white", padding: "10px 15px", borderRadius: "8px", border: "none", cursor: "pointer" }}>Aplicar</button>
            </div>
            {couponError && <p style={{ color: "red", fontSize: 13, margin: "-10px 0 10px" }}>{couponError}</p>}
            {couponSuccess && <p style={{ color: "green", fontSize: 13, margin: "-10px 0 10px" }}>{couponSuccess}</p>}
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#666" }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(baseTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "green" }}>
                <span>Descuento</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, marginTop: 10 }}>
              <span>Total</span>
              <span style={{ color: "var(--vinotinto)" }}>{formatCurrency(totalToPay)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          {ordenes.filter(esOrdenPendiente).map((orden) => (
            <div key={orden.id_orden} style={{
              background: "#fff3e0",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #ff9800",
              marginBottom: "15px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <div>
                  <p style={{ margin: "0 0 5px", fontWeight: 700, color: "#ff9800", fontSize: "0.9rem" }}>
                    Orden pendiente de pago
                  </p>
                  <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                    Orden #{orden.id_orden} - {formatCurrency(orden.total)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      setOrderId(orden.id_orden);
                      setOrder(orden);
                      setMostrarCheckout(true);
                    }}
                    className="btn btn-vinotinto"
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", width: "auto",
                      marginTop: 0, padding: "10px 16px", fontSize: "0.85rem", fontWeight: 700, minHeight: "40px",
                      minWidth: "150px", borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap"
                    }}
                  >
                    Continuar Pago
                  </button>
                  <button
                    onClick={() => onSetOrdenACancelar(orden)}
                    className="btn btn-rojo"
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", width: "auto",
                      marginTop: 0, padding: "10px 16px", fontSize: "0.85rem", fontWeight: 700, minHeight: "40px",
                      minWidth: "150px", borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap"
                    }}
                  >
                    Cancelar compra
                  </button>
                </div>
              </div>
            </div>
          ))}
          {carrito.length > 0 && carrito.map((item) => (
            <div key={item.id_libro} style={{ background: "var(--blanco)", border: "1px solid #e0dbd4", borderRadius: "8px", padding: "20px", boxShadow: "var(--sombra-suave)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0", fontWeight: 700, color: "var(--vinotinto)" }}>{item.titulo}</h3>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "0.9rem" }}>Autor: {item.autor_libro}</p>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>Cantidad: {item.cantidad}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 5px 0", color: "#777", fontSize: "0.9rem" }}>Unitario: {formatCurrency(item.precio_libro)}</p>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--gris-carbon)", fontSize: "1.1rem" }}>Total: {formatCurrency(item.precio_libro * item.cantidad)}</p>
              </div>
            </div>
          ))}
          {carrito.length > 0 && (
            <div style={{ marginTop: "30px", borderTop: "2px solid #e0dbd4", paddingTop: "20px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "16px" }}>
              <div style={{ width: '100%', maxWidth: 520, alignSelf: 'stretch' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Dirección de entrega</label>
                <select value={direccionSeleccionadaId} onChange={(event) => setDireccionSeleccionadaId(event.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e0dbd4', background: '#fff' }}>
                  <option value="">Selecciona una dirección</option>
                  {direcciones.map((direccion) => <option key={direccion.id_direccion} value={direccion.id_direccion}>{direccion.alias_direccion || 'Dirección'} — {direccion.direccion}, {direccion.ciudad}</option>)}
                </select>
                {direcciones.length === 0 && <p style={{ color: '#9b1c31', fontSize: 13, margin: '8px 0 0' }}>Aún no tienes direcciones registradas. Agrégala desde “Direcciones”.</p>}
              </div>
              <h2 style={{ fontWeight: 800, margin: 0 }}>Total a pagar: <span style={{ color: "var(--rojo-suave)" }}>{formatCurrency(totalCarrito)}</span></h2>
              {checkoutError && <p style={{ color: "var(--rojo-suave)", fontSize: 14, margin: 0 }}>{checkoutError}</p>}
              <button className="btn btn-vinotinto" onClick={onCheckout} disabled={checkoutLoading} style={{ width: "auto", minWidth: 250 }}>
                {checkoutLoading ? "Procesando..." : "Proceder al Pago"}
              </button>
              <button onClick={onGoToCatalog} style={{ background: "none", border: "1.5px solid var(--vinotinto)", color: "var(--vinotinto)", borderRadius: "8px", padding: "10px 20px", fontWeight: 700, width: "auto", minWidth: 250 }}>Seguir comprando</button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA CANCELAR ORDEN */}
      {ordenACancelar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar cancelación de orden"
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelandoOrden) setOrdenACancelar(null);
          }}
          style={{ zIndex: 1100 }}
        >
          <div
            className="pl-card"
            style={{
              width: "min(440px, 92vw)",
              padding: "28px 24px",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              textAlign: "center",
              position: "relative",
              background: "#fff",
              boxSizing: "border-box",
              animation: "slideUp 0.2s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Cerrar"
              disabled={cancelandoOrden}
              onClick={() => setOrdenACancelar(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "1.3rem",
                color: "#888"
              }}
            >
              &times;
            </button>

            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px"
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: "1.25rem", fontWeight: 800, color: "var(--gris-carbon)" }}>
              ¿Cancelar compra?
            </h3>
            <p style={{ margin: "0 0 8px", color: "#555", fontSize: "0.95rem", lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas cancelar la <strong>Orden #{ordenACancelar.id_orden}</strong>?
            </p>
            <p style={{ margin: "0 0 24px", color: "#888", fontSize: "0.85rem" }}>
              Esta acción anulará el proceso de compra pendiente.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                disabled={cancelandoOrden}
                onClick={() => setOrdenACancelar(null)}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer"
                }}
              >
                No, mantener
              </button>
              <button
                type="button"
                className="btn btn-rojo"
                disabled={cancelandoOrden}
                onClick={onConfirmarCancelarOrden}
                style={{
                  flex: 1,
                  marginTop: 0,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                {cancelandoOrden ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
