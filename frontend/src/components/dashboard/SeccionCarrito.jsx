import { useState, useEffect, useCallback } from "react";
import { IconCart, IconBookOpen, IconPackage, IconLock, IconCheck } from "../Icons";
import { notify } from "../ToastProvider";
import api, {
  getCarrito,
  removeFromCart,
  checkoutCarrito,
  checkoutDirecto,
  getOrdenes,
  getOrden,
  getDatosTransferenciaVendedor,
  postPayment,
  sendConfirmationEmail,
  cancelOrder,
  aplicarCupon,
  getDirecciones,
  getApiBaseUrl,
  reservarRetiroEnTienda,
  notificarLlegadaTienda,
  actualizarCostoEnvio,
} from "../../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const mapMetodoPagoToId = (metodo) => {
  if (!metodo) return "tarjeta";
  const m = String(metodo).toLowerCase().trim();
  if (m.includes("nequi") || m.includes("daviplata")) return "nequi";
  if (m.includes("efectivo")) return "efectivo_tienda";
  if (m.includes("pse")) return "pse";
  if (m.includes("transferencia") || m.includes("bancari")) return "transferencia";
  if (m.includes("efecty") || m.includes("sucursal")) return "sucursal";
  if (m.includes("paypal")) return "paypal";
  if (m.includes("tarjeta") || m.includes("card") || m.includes("credito") || m.includes("debito")) return "tarjeta";
  return "tarjeta";
};

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

const BookCoverThumbnail = ({ imgUrl, titulo, autor }) => {
  const [hasError, setHasError] = useState(false);

  if (imgUrl && !hasError) {
    return (
      <div style={{
        width: 78,
        height: 104,
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.08)",
        background: "#F3F4F6",
        flexShrink: 0,
        position: "relative"
      }}>
        <img
          src={imgUrl}
          alt={titulo}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Portada estilizada cuando el libro no tiene imagen subida
  const initial = (titulo || 'B').trim().charAt(0).toUpperCase();
  return (
    <div style={{
      width: 78,
      height: 104,
      borderRadius: "8px",
      overflow: "hidden",
      background: "linear-gradient(145deg, #7A1E3A 0%, #4A0E22 100%)",
      color: "#FFF",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "8px 6px",
      boxShadow: "0 4px 14px rgba(122,30,58,0.25), inset 3px 0 6px rgba(0,0,0,0.3)",
      borderLeft: "4px solid rgba(255,255,255,0.28)",
      flexShrink: 0,
      position: "relative"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.58rem", opacity: 0.85, fontWeight: 800, letterSpacing: "0.5px" }}>BKH</span>
        <span style={{ fontSize: "0.72rem" }}>📖</span>
      </div>
      <div style={{ textAlign: "center", margin: "auto 0" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#FDE047", opacity: 0.95 }}>{initial}</div>
        <div style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          lineHeight: 1.15,
          maxHeight: "2.3em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          color: "#FFF",
          marginTop: "2px"
        }}>
          {titulo}
        </div>
      </div>
      <div style={{ fontSize: "0.52rem", color: "#FBCFE8", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", textAlign: "center" }}>
        {autor || "BookyHome"}
      </div>
    </div>
  );
};

export default function SeccionCarrito({ userId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [carrito, setCarrito] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState('');
  const [metodoEntrega, setMetodoEntrega] = useState('domicilio'); // 'domicilio' | 'retiro_tienda'
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState(false);
  const [datosReserva, setDatosReserva] = useState(null);
  const [notificandoLlegada, setNotificandoLlegada] = useState(false);
  const [verificandoEstadoRetiro, setVerificandoEstadoRetiro] = useState(false);
  const [order, setOrder] = useState(null);
  const [orderId, setOrderId] = useState(null);
  // Datos del libro cuando se viene de "Comprar Ahora" (sin orden creada aún)
  const [buyNowData, setBuyNowData] = useState(null);
  
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
  const [, setSucursalEsperandoConfirmacion] = useState(false);
  const nequiSelected = false;
  const [pseBanco, setPseBanco] = useState("001");
  const [, setPseRedirecting] = useState(false);
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");
  const [paypalError, setPaypalError] = useState("");
  const [paypalProcessing, setPaypalProcessing] = useState(false);

  // States for PSE Simulator Modal
  const [showPseModal, setShowPseModal] = useState(false);
  const [pseModalStep, setPseModalStep] = useState(1); // 1: Datos PSE, 2: Banca Virtual
  const [pseEmail, setPseEmail] = useState("usuario.demo@pse.com.co");
  const [pseTipoCliente, setPseTipoCliente] = useState("natural");
  const [pseDocNumero, setPseDocNumero] = useState("1020304050");
  const [pseOtp, setPseOtp] = useState("982341");
  const [pseProcessing, setPseProcessing] = useState(false);
  const [pseError, setPseError] = useState("");

  // Estados para Transferencia Bancaria del Vendedor
  const [datosTransferencia, setDatosTransferencia] = useState([]);
  const [cargandoTransferencia, setCargandoTransferencia] = useState(false);
  const [copiadoCampo, setCopiadoCampo] = useState("");
  
  // Modal cancelar orden
  const [ordenACancelar, setOrdenACancelar] = useState(null);
  const [cancelandoOrden, setCancelandoOrden] = useState(false);
  // Modal detalles orden pendiente
  const [ordenDetalleModal, setOrdenDetalleModal] = useState(null);
  
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

  const idVisible = (orden) => orden?.id_orden_db || orden?.id_orden;

  const [eliminandoId, setEliminandoId] = useState(null);

  const getCartImageUrl = (item) => {
    const raw = item?.imagen || item?.imagen_portada || item?.portada || item?.foto || item?.imagen_url || (Array.isArray(item?.imagenes) ? item.imagenes[0] : null);
    if (!raw) return null;
    if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:'))) return raw;
    if (typeof raw === 'string' && raw.startsWith('/')) return `${getApiBaseUrl()}${raw}`;
    return `${getApiBaseUrl()}/${raw}`;
  };


  const handleEliminarItem = async (idLibro) => {
    setEliminandoId(idLibro);
    try {
      await removeFromCart(idLibro);
      notify("Libro eliminado del carrito", "info");
      loadData();
    } catch {
      notify("No se pudo eliminar el libro", "error");
    } finally {
      setEliminandoId(null);
    }
  };

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

  // Auto-abrir checkout si venimos de "Pagar Ahora" en Mis Compras o link directo
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orderIdParam = searchParams.get('pagarOrden') || location.state?.autoPayOrderId;
    const methodParam = searchParams.get('metodo') || location.state?.autoPayMethod;
    const entregaParam = searchParams.get('entrega') || location.state?.autoPayEntrega;
    const ordenObj = location.state?.ordenObj;

    if (orderIdParam) {
      const targetId = Number(orderIdParam);
      setOrderId(targetId);
      
      if (entregaParam) {
        setMetodoEntrega(entregaParam);
      }
      if (methodParam) {
        setPaymentMethod(mapMetodoPagoToId(methodParam));
      }
      if (ordenObj) {
        setOrder(ordenObj);
        if (ordenObj.tipo_entrega) setMetodoEntrega(ordenObj.tipo_entrega);
        if (ordenObj.metodo_pago) setPaymentMethod(mapMetodoPagoToId(ordenObj.metodo_pago));
      }

      setMostrarCheckout(true);
      setPaymentSuccess(false);
      setReservaConfirmada(false);

      getOrden(targetId)
        .then((res) => {
          if (res.data) {
            const ord = res.data;
            setOrder(ord);
            if (ord.tipo_entrega) {
              setMetodoEntrega(ord.tipo_entrega);
            }
            if (ord.metodo_pago) {
              setPaymentMethod(mapMetodoPagoToId(ord.metodo_pago));
            }
          }
        })
        .catch((err) => {
          console.error("Error al obtener orden para pago:", err);
        });
    }
  }, [location.search, location.state]);

  // Detectar "Comprar Ahora": viene con state.buyNow pero SIN orden creada.
  // Solo cargamos los datos en memoria y abrimos el checkout. La orden se
  // creará en processPaymentApi justo antes de cobrar.
  useEffect(() => {
    const buyNow = location.state?.buyNow;
    if (!buyNow) return;

    setBuyNowData(buyNow);
    // Construir un objeto "orden" temporal para que el checkout muestre precio/título
    setOrder({
      id_orden: null,
      total: Number(buyNow.precio_libro || 0) * Number(buyNow.cantidad || 1),
      tipo_entrega: buyNow.tipo_entrega || 'domicilio',
      estado: 'pendiente',
      items: [{
        id_libro: buyNow.id_libro,
        titulo: buyNow.titulo,
        autor_libro: buyNow.autor_libro,
        imagen: buyNow.imagen,
        cantidad: buyNow.cantidad || 1,
        precio_libro: buyNow.precio_libro,
      }]
    });
    setOrderId(null);
    setMetodoEntrega(buyNow.tipo_entrega || 'domicilio');
    setMostrarCheckout(true);
    setPaymentSuccess(false);
    setReservaConfirmada(false);

    // Limpiar el state de la URL para que no se reactive al recargar
    navigate('/?seccion=Carrito', { replace: true, state: {} });
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const onGoToCatalog = () => {
    navigate('/?seccion=Catálogo');
  };

  const onCheckout = () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    // Crear la orden sin validar dirección/entrega — eso se confirma en Paso 2
    checkoutCarrito({
      id_direccion: null,
      tipo_entrega: 'domicilio'
    })
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
    setBuyNowData(null);
    setPaymentSuccess(false);
    navigate('/?seccion=Carrito', { replace: true });
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setFormErrors({});
    
    // Limpiar estados de métodos de pago
    setSucursalCodigo("");
    setSucursalPagoConfirmado(false);
    setSucursalEsperandoConfirmacion(false);
    setPseBanco("001");
    setPseRedirecting(false);
    setShowPseModal(false);
    setPseProcessing(false);
    setPseModalStep(1);
    setDatosTransferencia([]);
    setCargandoTransferencia(false);
    setCopiadoCampo("");

    // Si veníamos con el param pagarOrden, limpiarlo en la URL
    if (location.search && location.search.includes('pagarOrden')) {
      navigate('/?seccion=Carrito', { replace: true, state: {} });
    }
    
    loadData();
  };

  const onSetOrdenACancelar = (orden) => {
    setOrdenACancelar(orden);
  };

  const onConfirmarCancelarOrden = async () => {
    if (!ordenACancelar) return;
    setCancelandoOrden(true);
    try {
      const idAEnviar = ordenACancelar.id_orden_db || ordenACancelar.id_orden;
      await cancelOrder(idAEnviar, 'Cancelación de orden pendiente');

      notify('Orden cancelada correctamente.', 'info');
      setOrdenACancelar(null);
      loadData();
    } catch (err) {
      notify(err.response?.data?.detail || 'No se pudo cancelar la orden', 'error');
    } finally {
      setCancelandoOrden(false);
    }
  };

  const generarCodigoPago = () => setSucursalCodigo(Math.random().toString(36).substring(2, 12).toUpperCase());
  const handleNequiRedirect = () => {
    if (metodoEntrega === 'retiro_tienda') {
      processPaymentApi("Nequi");
      return;
    }
    window.location.href = `nequi://pagar?valor=${order?.total}&referencia=${order?.id_orden}`;
    setTimeout(() => { if (!nequiSelected) window.open('https://www.nequi.com.co', '_blank'); }, 2000);
  };
  const handleDaviplataRedirect = () => {
    if (metodoEntrega === 'retiro_tienda') {
      processPaymentApi("Daviplata");
      return;
    }
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
    { codigo: "005", nombre: "Davivienda" },
    { codigo: "007", nombre: "Nequi" },
    { codigo: "002", nombre: "Banco de Bogotá" },
    { codigo: "004", nombre: "BBVA Colombia" },
    { codigo: "008", nombre: "Daviplata" },
    { codigo: "009", nombre: "Scotiabank Colpatria" },
    { codigo: "003", nombre: "Banco Popular" },
    { codigo: "006", nombre: "Banco de Occidente" },
    { codigo: "010", nombre: "Banco Itaú" },
    { codigo: "011", nombre: "Lulo Bank" },
    { codigo: "012", nombre: "Nu Colombia (Cuenta Nu)" },
    { codigo: "013", nombre: "Banco AV Villas" },
    { codigo: "014", nombre: "Banco Caja Social" }
  ];
  const handlePseRedirect = () => {
    if (!pseBanco) setPseBanco("001");
    setPseModalStep(1);
    setPseError("");
    setPseProcessing(false);
    if (!pseEmail) setPseEmail("usuario.demo@pse.com.co");
    if (!pseDocNumero) setPseDocNumero("1020304050");
    if (!pseOtp) setPseOtp("982341");
    setShowPseModal(true);
  };

  const handlePseModalNext = (e) => {
    e?.preventDefault();
    if (!pseEmail || !pseEmail.includes("@")) {
      setPseError("Ingresa un correo electrónico registrado en PSE.");
      return;
    }
    if (!pseDocNumero.trim()) {
      setPseError("Ingresa el número de documento de identidad.");
      return;
    }
    setPseError("");
    setPseModalStep(2);
  };

  const handlePseModalSubmit = (e) => {
    e?.preventDefault();
    setPseError("");
    setPseProcessing(true);
    setTimeout(() => {
      setPseProcessing(false);
      setShowPseModal(false);
      processPaymentApi("PSE");
    }, 2000);
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

  // Cargar datos de la cuenta bancaria del vendedor cuando se selecciona Transferencia
  useEffect(() => {
    if (paymentMethod === "transferencia" && (orderId || order?.id_orden || order?.id_orden_db)) {
      const idParaConsulta = orderId || order?.id_orden_db || order?.id_orden;
      setCargandoTransferencia(true);
      getDatosTransferenciaVendedor(idParaConsulta)
        .then((res) => {
          if (res.data?.ok && res.data.vendedores) {
            setDatosTransferencia(res.data.vendedores);
          }
        })
        .catch((err) => {
          console.error("Error al cargar datos bancarios del vendedor:", err);
        })
        .finally(() => setCargandoTransferencia(false));
    }
  }, [paymentMethod, orderId, order]);

  const handleCopiarTexto = (texto, campo) => {
    if (!texto) return;
    try {
      navigator.clipboard.writeText(String(texto).trim());
      setCopiadoCampo(campo);
      setTimeout(() => setCopiadoCampo(""), 2200);
      notify("Copiado al portapapeles", "success");
    } catch {
      notify("No se pudo copiar automáticamente", "error");
    }
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
        // En modo "Comprar Ahora" aún no hay orden creada; enviamos 0 y el
        // backend valida el cupón sin asociarlo a una orden concreta todavía.
        order_id: orderId ? Number(orderId) : 0,
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
    if (order?.estado && !esOrdenPendiente(order) && orderId) {
      setCheckoutError('Esta orden ya no está pendiente de pago. Actualiza tus pedidos para consultar su estado.');
      return;
    }
    setPaymentProcessing(true);
    setCheckoutError("");

    // ── FLUJO "COMPRAR AHORA" ───────────────────────────────────────────────
    // Si llegamos aquí sin orderId (compra directa sin carrito), creamos la
    // orden real justo ahora, cuando el usuario realmente confirma el pago.
    // Así NUNCA queda una orden pendiente si el usuario se arrepiente antes.
    let activeOrderId = orderId;
    if (!activeOrderId && buyNowData) {
      try {
        const res = await checkoutDirecto({
          ...buyNowData,
          tipo_entrega: metodoEntrega,
        });
        if (!res.data?.ok || !res.data?.order) {
          setCheckoutError(res.data?.error || 'No se pudo crear la orden. Intenta de nuevo.');
          setPaymentProcessing(false);
          return;
        }
        const newOrder = res.data.order;
        activeOrderId = newOrder.id_orden_db || newOrder.id_orden;
        setOrderId(activeOrderId);
        setOrder(newOrder);
        setBuyNowData(null);
      } catch (err) {
        setCheckoutError(err.response?.data?.detail || 'Error al crear la orden. Intenta de nuevo.');
        setPaymentProcessing(false);
        return;
      }
    }
    // ── FIN FLUJO "COMPRAR AHORA" ───────────────────────────────────────────

    // Recalcular costo de envío con el tipo_entrega real que eligió el usuario.
    // El checkout del paso 1 siempre crea la orden con 'domicilio' por defecto,
    // pero aquí ya sabemos la elección real (domicilio vs retiro).
    try {
      const resEnvio = await actualizarCostoEnvio(activeOrderId, metodoEntrega);
      if (resEnvio.data?.ok) {
        setOrder(prev => ({
          ...(prev || {}),
          costo_envio: resEnvio.data.costo_envio,
          total: resEnvio.data.total,
        }));
      }
    } catch (e) {
      console.warn("[checkout] No se pudo recalcular costo de envío:", e);
    }

    // FLUJO DE RETIRO EN TIENDA: Si no está aún habilitado para cobro directo en tienda, se crea/confirma la reserva
    if (metodoEntrega === 'retiro_tienda' && order?.estado_retiro !== 'habilitado_pago') {
      try {
        const resReserva = await reservarRetiroEnTienda(parseInt(activeOrderId), method);
        if (resReserva.data && resReserva.data.ok) {
          setReservaConfirmada(true);
          setDatosReserva({
            pin: resReserva.data.pin_retiro,
            estadoRetiro: resReserva.data.estado_retiro || 'reservado',
            fechaLimite: resReserva.data.fecha_limite_retiro,
            tienda: resReserva.data.tienda || order?.tienda_retiro,
            metodoPago: method,
            idOrden: activeOrderId
          });
          setMostrarCheckout(false);
          setPaymentSuccess(true);
          notify("¡Reserva confirmada con éxito! Revisa tu PIN y detalles de retiro.", "success");
          return;
        } else {
          setCheckoutError(resReserva.data?.error || "No se pudo confirmar la reserva en tienda.");
          return;
        }
      } catch (err) {
        setCheckoutError(err.response?.data?.detail || "Ocurrió un error al procesar tu reserva.");
        return;
      } finally {
        setPaymentProcessing(false);
      }
    }

    try {
      const baseTotal = Number(order?.total || 0) || totalCarrito;
      const amountToCharge = Math.max(0, baseTotal - discountAmount);
      const payload = {
        order_id: parseInt(activeOrderId),
        amount: parseFloat(amountToCharge),
        payment_method: method,
        tipo_entrega: metodoEntrega,
        ...(metodoEntrega === 'domicilio' && direccionSeleccionadaId ? { id_direccion: Number(direccionSeleccionadaId) } : {}),
        ...(couponCode.trim() ? { coupon_code: couponCode.trim() } : {})
      };
      const res = await postPayment(payload);
      if (res.data && res.data.ok) {
        if (couponCode.trim() && discountAmount > 0) {
          try {
            await aplicarCupon({ codigo: couponCode.trim(), id_orden: parseInt(activeOrderId), total: baseTotal });
          } catch (e) { console.warn(e); }
        }
        try {
          await sendConfirmationEmail(activeOrderId);
        } catch (e) { console.warn(e); }
        
        // Marcar la orden como pagada en el estado local para que la UI
        // muestre inmediatamente la pantalla de éxito en lugar de la reserva.
        setOrder(prev => ({
          ...(prev || {}),
          estado: 'pagado',
          estado_orden: 'pagado',
          metodo_pago: method
        }));
        setReservaConfirmada(false);
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

  const handleNotificarLlegada = async () => {
    const idOrdenActual = orderId || order?.id_orden_db || order?.id_orden;
    if (!idOrdenActual) return;
    setNotificandoLlegada(true);
    try {
      const res = await notificarLlegadaTienda(idOrdenActual);
      if (res.data?.ok) {
        notify("¡Se notificó tu llegada a la librería con éxito!", "success");
        setDatosReserva(prev => ({ ...(prev || {}), estadoRetiro: 'en_tienda' }));
        if (order) setOrder(prev => ({ ...(prev || {}), estado_retiro: 'en_tienda' }));
      }
    } catch (err) {
      notify(err.response?.data?.detail || "No se pudo notificar tu llegada. Intenta de nuevo.", "error");
    } finally {
      setNotificandoLlegada(false);
    }
  };

  const handleVerificarEstadoRetiro = async () => {
    const idOrdenActual = orderId || order?.id_orden_db || order?.id_orden;
    if (!idOrdenActual) return;
    setVerificandoEstadoRetiro(true);
    try {
      const res = await getOrden(idOrdenActual);
      const ord = res.data;
      if (ord) {
        setOrder(ord);
        if (ord.estado_retiro) {
          setDatosReserva(prev => ({
            ...(prev || {}),
            estadoRetiro: ord.estado_retiro,
            pin: ord.pin_retiro || prev?.pin,
            tienda: ord.tienda_retiro || prev?.tienda
          }));
          if (ord.estado_retiro === 'habilitado_pago') {
            notify("¡El encargado de la librería ha habilitado tu pago!", "success");
          } else if (ord.estado_retiro === 'en_tienda') {
            notify("Tu estado actual: Notificado en tienda.", "info");
          } else {
            notify(`Estado actual: ${ord.estado_retiro}`, "info");
          }
        }
      }
    } catch {
      notify("No se pudo actualizar el estado de la reserva", "error");
    } finally {
      setVerificandoEstadoRetiro(false);
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

  // Desglose de envío e IVA para el resumen del checkout
  // El order devuelto por el backend ya trae subtotal y costo_envio si existen.
  // Si no existen (órdenes antiguas), los inferimos del total.
  const costoEnvioOrden = Number(order?.costo_envio || 0);
  const subtotalOrden   = order
    ? Number(order.subtotal || (order.total - costoEnvioOrden) || 0)
    : 0;
  // En el paso 1 (carrito), mostramos el costo de envío del primer item si está disponible.
  // El carrito no tiene tarifa_envio directamente, pero podemos inferir de los items.
  const costoEnvioCarrito = metodoEntrega === 'retiro_tienda' ? 0 : null; // null = aún no se sabe

  // Detectar si el carrito tiene libros de múltiples tiendas.
  // Si hay más de una tienda distinta, "Retiro en tienda" no aplica
  // porque el usuario no puede recoger en varios locales al mismo tiempo.
  const tiendasEnCarrito = new Set(
    carrito.map((item) => item.id_tienda || item.nombre_tienda || 'sin_tienda')
  );
  const carritoMultiTienda = tiendasEnCarrito.size > 1;

  // Si el carrito cambia a multi-tienda mientras el usuario tiene retiro seleccionado,
  // volvemos automáticamente a domicilio.
  if (carritoMultiTienda && metodoEntrega === 'retiro_tienda') {
    setMetodoEntrega('domicilio');
  }

  return (
    <div style={{ minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", paddingBottom: "24px", flex: 1 }}>
      {/* HEADER PRINCIPAL CON STEPPER */}
      <div className="pl-card" style={{
        padding: "18px 24px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        background: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 2px 12px -2px rgba(0,0,0,0.04)"
      }}>
        {/* Cabecera izquierda */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            background: "linear-gradient(135deg, #FDF2F4 0%, #FCE7EB 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid #FBCFE8",
            boxShadow: "0 2px 8px rgba(122,30,58,0.08)",
            flexShrink: 0
          }}>
            {mostrarCheckout ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A1E3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            ) : (
              <IconCart width={24} height={24} strokeWidth={2.2} style={{ color: '#7A1E3A' }} />
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "1.32rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.01em" }}>
                {mostrarCheckout ? "Entrega y Pago" : "Mi Carrito"}
              </h2>
              {carrito.length > 0 && !mostrarCheckout && (
                <span style={{
                  background: "linear-gradient(135deg, #7A1E3A 0%, #5E1629 100%)",
                  color: "#FFFFFF",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  boxShadow: "0 2px 6px rgba(122,30,58,0.2)"
                }}>
                  {carrito.length} {carrito.length === 1 ? 'libro' : 'libros'}
                </span>
              )}
            </div>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "0.83rem", fontWeight: 500 }}>
              {mostrarCheckout
                ? "Selecciona tu método de entrega y completa el pago seguro"
                : "Revisa tus lecturas seleccionadas antes de proceder al pago seguro"}
            </p>
          </div>
        </div>

        {/* Stepper visual unificado y pulido */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#F8F9FA",
          padding: "4px 6px",
          borderRadius: "32px",
          border: "1px solid #E5E7EB",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)"
        }}>
          {/* Paso 1: Carrito */}
          <div
            onClick={mostrarCheckout ? () => onVolverCarrito() : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "24px",
              background: !mostrarCheckout
                ? "linear-gradient(135deg, #7A1E3A 0%, #902345 100%)"
                : "#FFFFFF",
              border: !mostrarCheckout
                ? "none"
                : "1px solid #E5E7EB",
              color: !mostrarCheckout ? "#FFFFFF" : "#7A1E3A",
              fontWeight: 800,
              fontSize: "0.82rem",
              boxShadow: !mostrarCheckout
                ? "0 2px 8px rgba(122,30,58,0.3)"
                : "0 1px 3px rgba(0,0,0,0.04)",
              cursor: mostrarCheckout ? "pointer" : "default",
              transition: "all 0.2s ease"
            }}
            title={mostrarCheckout ? "Regresar al carrito" : undefined}
          >
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: !mostrarCheckout ? "rgba(255,255,255,0.22)" : "#FDF2F4",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              {mostrarCheckout ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7A1E3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              )}
            </div>
            <span>1. Carrito</span>
          </div>

          {/* Flecha conectora elegante */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 2px",
            color: mostrarCheckout ? "var(--vinotinto)" : "#9CA3AF"
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>

          {/* Paso 2: Entrega y Pago */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 16px",
            borderRadius: "24px",
            background: mostrarCheckout
              ? "linear-gradient(135deg, #7A1E3A 0%, #902345 100%)"
              : "#FFFFFF",
            border: mostrarCheckout
              ? "none"
              : "1px solid #E5E7EB",
            color: mostrarCheckout ? "#FFFFFF" : "#6B7280",
            fontWeight: 800,
            fontSize: "0.82rem",
            boxShadow: mostrarCheckout
              ? "0 2px 8px rgba(122,30,58,0.3)"
              : "0 1px 3px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease"
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: mostrarCheckout ? "rgba(255,255,255,0.22)" : "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={mostrarCheckout ? "#FFFFFF" : "#9CA3AF"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <span>2. Entrega y Pago</span>
          </div>
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
            <div style={{ background: "var(--blanco)", padding: "36px 32px", borderRadius: "16px", boxShadow: "var(--sombra-suave)", border: "1px solid #e0dbd4", textAlign: "center" }}>
              {/* Si la orden ya fue pagada, mostrar pantalla de éxito de pago (NO la reserva) */}
              {(order?.estado === 'pagado' || order?.estado_orden === 'pagado') ? (
                <>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: "3px solid #86EFAC" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div style={{ display: 'inline-block', background: '#DCFCE7', color: '#166534', padding: '4px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    ✓ PAGO CONFIRMADO VÍA {order?.metodo_pago || 'N/A'}
                  </div>
                  <h1 style={{ fontWeight: 900, color: "#166534", margin: "0 0 6px", fontSize: "1.75rem" }}>
                    ¡Pago Realizado Exitosamente!
                  </h1>
                  <p style={{ color: "#4B5563", fontSize: "0.92rem", maxWidth: "560px", margin: "0 auto 20px", lineHeight: 1.45 }}>
                    {order?.tipo_entrega === 'retiro_tienda'
                      ? 'Tu pago ha sido procesado y confirmado con la librería. Ya puedes retirar tus libros en el mostrador mostrando tu orden.'
                      : 'Tu pago fue procesado exitosamente. Te enviamos un correo con los detalles de tu pedido.'}
                  </p>
                  {order?.tipo_entrega === 'retiro_tienda' && order?.pin_retiro && (
                    <div style={{
                      background: "linear-gradient(135deg, #166534 0%, #14532D 100%)",
                      borderRadius: "16px",
                      padding: "20px",
                      color: "#FFFFFF",
                      textAlign: "center",
                      margin: "0 auto 22px",
                      maxWidth: "520px",
                      boxShadow: "0 10px 25px rgba(22, 101, 52, 0.28)",
                      border: "1px solid rgba(255,255,255,0.15)"
                    }}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#FDE047", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "6px" }}>
                        Tu PIN de Retiro
                      </div>
                      <div style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "8px", color: "#FFFFFF" }}>
                        {order?.pin_retiro || datosReserva?.pin || "----"}
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#BBF7D0", opacity: 0.95 }}>
                        Muestra este PIN al recoger tus libros en el mostrador
                      </p>
                    </div>
                  )}
                </>
              ) : (reservaConfirmada || (order?.tipo_entrega === 'retiro_tienda' && order?.estado_retiro !== 'entregado')) ? (
                <>
                  <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "3px solid #BFDBFE" }}>
                    <span style={{ fontSize: "2.4rem" }}>🏪</span>
                  </div>
                  <div style={{ display: 'inline-block', background: '#DBEAFE', color: '#1E40AF', padding: '4px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Click & Collect · Retiro en Tienda
                  </div>
                  <h1 style={{ fontWeight: 900, color: "#1E293B", margin: "0 0 6px", fontSize: "1.75rem" }}>
                    ¡Reserva Confirmada con Éxito!
                  </h1>
                  <p style={{ color: "#64748B", fontSize: "0.92rem", maxWidth: "560px", margin: "0 auto 20px", lineHeight: 1.45 }}>
                    Tus libros han sido apartados en la librería. Dirígete al local físico para recoger tu pedido y completar tu compra.
                  </p>

                  {/* CAJA DESTACADA DE PIN DE RETIRO */}
                  <div style={{
                    background: "linear-gradient(135deg, #7A1E3A 0%, #4A0E22 100%)",
                    borderRadius: "16px",
                    padding: "24px 20px",
                    color: "#FFFFFF",
                    textAlign: "center",
                    margin: "0 auto 22px",
                    maxWidth: "520px",
                    boxShadow: "0 10px 25px rgba(122,30,58,0.28)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    position: "relative"
                  }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#FDE047", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "6px" }}>
                      Tu Código PIN de Retiro
                    </div>
                    <div style={{ fontSize: "3.2rem", fontWeight: 900, letterSpacing: "8px", color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                      {datosReserva?.pin || order?.pin_retiro || "----"}
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#FCE7F3", opacity: 0.95 }}>
                      Presenta este código al llegar a la tienda para validar y retirar tu ejemplar.
                    </p>
                  </div>

                  {/* INFORMACIÓN DE LA LIBRERÍA FÍSICA */}
                  <div style={{
                    background: "#F8FAFC",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: "14px",
                    padding: "18px 22px",
                    textAlign: "left",
                    maxWidth: "520px",
                    margin: "0 auto 22px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0F172A", fontWeight: 800, fontSize: "0.92rem", marginBottom: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "8px" }}>
                      <span>📍</span> Punto de Retiro y Ubicación
                    </div>
                    <div style={{ display: "grid", gap: "10px", fontSize: "0.86rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>Librería:</span>
                        <strong style={{ color: "#1E293B" }}>{datosReserva?.tienda?.nombre_tienda || order?.tienda_retiro?.nombre_tienda || "Librería Aliada"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <span style={{ color: "#64748B", fontWeight: 600, flexShrink: 0 }}>Dirección:</span>
                        <span style={{ color: "#1E293B", fontWeight: 700, textAlign: "right" }}>{datosReserva?.tienda?.direccion || order?.tienda_retiro?.direccion || "Punto de atención presencial"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>Teléfono:</span>
                        <span style={{ color: "#1E293B", fontWeight: 700 }}>{datosReserva?.tienda?.telefono || order?.tienda_retiro?.telefono || "Disponible en local"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>Plazo de reserva:</span>
                        <span style={{ color: "#B45309", fontWeight: 800 }}>⏰ 48 horas vigentes</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>Método acordado:</span>
                        <span style={{ color: "#7A1E3A", fontWeight: 800 }}>{datosReserva?.metodoPago || order?.metodo_pago || "Efectivo en Tienda"}</span>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE DINÁMICO DE ACCIÓN PRESENCIAL */}
                  <div style={{
                    background: (datosReserva?.estadoRetiro || order?.estado_retiro) === 'habilitado_pago' ? '#F0FDF4' : '#FFFBEB',
                    border: (datosReserva?.estadoRetiro || order?.estado_retiro) === 'habilitado_pago' ? '1.5px solid #86EFAC' : '1.5px solid #FDE68A',
                    borderRadius: "14px",
                    padding: "20px",
                    maxWidth: "520px",
                    margin: "0 auto 24px",
                    textAlign: "center"
                  }}>
                    {((datosReserva?.estadoRetiro || order?.estado_retiro) === 'reservado' || !(datosReserva?.estadoRetiro || order?.estado_retiro)) && (
                      <div>
                        <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>🚶‍♂️</div>
                        <h4 style={{ margin: "0 0 6px", color: "#92400E", fontWeight: 800, fontSize: "0.98rem" }}>
                          ¿Ya estás en la librería?
                        </h4>
                        <p style={{ margin: "0 0 16px", fontSize: "0.84rem", color: "#78350F", lineHeight: 1.4 }}>
                          Al llegar al punto físico, presiona el botón para notificar al encargado de la librería de tu presencia.
                        </p>
                        <button
                          onClick={handleNotificarLlegada}
                          disabled={notificandoLlegada}
                          style={{
                            background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "13px 24px",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.94rem",
                            cursor: notificandoLlegada ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <span>📍</span>
                          {notificandoLlegada ? "Notificando llegada..." : "¡Ya llegué a la librería!"}
                        </button>
                      </div>
                    )}

                    {(datosReserva?.estadoRetiro || order?.estado_retiro) === 'en_tienda' && (
                      <div>
                        <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>⏳</div>
                        <h4 style={{ margin: "0 0 6px", color: "#1E40AF", fontWeight: 800, fontSize: "0.98rem" }}>
                          ¡Llegada Notificada al Vendedor!
                        </h4>
                        <p style={{ margin: "0 0 16px", fontSize: "0.84rem", color: "#1E3A8A", lineHeight: 1.4 }}>
                          El encargado de la tienda está verificando tu PIN. Una vez verificado, habilitará tu botón de pago.
                        </p>
                        <button
                          onClick={handleVerificarEstadoRetiro}
                          disabled={verificandoEstadoRetiro}
                          style={{
                            background: "#FFFFFF",
                            color: "#1E40AF",
                            border: "1.5px solid #93C5FD",
                            padding: "10px 18px",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.84rem",
                            cursor: verificandoEstadoRetiro ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <span>🔄</span>
                          {verificandoEstadoRetiro ? "Consultando..." : "Comprobar si ya habilitó el pago"}
                        </button>
                      </div>
                    )}

                    {(datosReserva?.estadoRetiro || order?.estado_retiro) === 'habilitado_pago' && (
                      <div>
                        <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>🎉</div>
                        <h4 style={{ margin: "0 0 6px", color: "#166534", fontWeight: 800, fontSize: "1.05rem" }}>
                          ¡Pago Habilitado por el Vendedor!
                        </h4>
                        <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "#14532D", lineHeight: 1.4 }}>
                          Tu presencia ha sido verificada. Ya puedes completar el pago seguro de tu ejemplar.
                        </p>
                        <button
                          onClick={() => {
                            const metodoElegido = datosReserva?.metodoPago || order?.metodo_pago;
                            if (metodoElegido) {
                              setPaymentMethod(mapMetodoPagoToId(metodoElegido));
                            }
                            setMetodoEntrega(order?.tipo_entrega || 'retiro_tienda');
                            setMostrarCheckout(true);
                            setPaymentSuccess(false);
                          }}
                          style={{
                            background: "linear-gradient(135deg, #7A1E3A 0%, #902345 100%)",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "14px 28px",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.98rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                            boxShadow: "0 4px 16px rgba(122, 30, 58, 0.35)"
                          }}
                        >
                          <span>💳</span>
                          Completar Pago Ahora ({formatCurrency(totalToPay)})
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fdf0f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C5425A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h1 style={{ fontWeight: 800, color: "var(--vinotinto)", margin: "0 0 8px", fontSize: "1.8rem" }}>¡Compra Confirmada!</h1>
                  <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "20px" }}>
                    Tu pago fue procesado exitosamente. Te enviamos un correo con los detalles de tu pedido.
                  </p>
                </>
              )}

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
                      <span style={{ fontWeight: 600 }}>#{idVisible(order)}</span>
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
      ) : (!mostrarCheckout && carrito.length === 0 && ordenes.filter(esOrdenPendiente).length === 0) ? (
        <div className="pl-card" style={{ padding: "40px" }}><CartEmptyState onGoToCatalog={onGoToCatalog} /></div>
      ) : mostrarCheckout ? (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Paso 2 — Tarjeta 1: Forma de Entrega */}
          <div className="pl-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1.5px solid #F3F4F6", paddingBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--vinotinto)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  boxShadow: "0 2px 6px rgba(122, 30, 58, 0.25)",
                  flexShrink: 0
                }}>
                  1
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.08rem", fontWeight: 800, color: "#111827" }}>
                    Forma de Entrega
                  </h3>
                  <span style={{ fontSize: "0.76rem", color: "#6B7280", fontWeight: 500 }}>
                    Elige cómo prefieres recibir tus libros
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: "0.76rem",
                fontWeight: 700,
                color: metodoEntrega === 'domicilio' ? '#1E40AF' : '#15803D',
                background: metodoEntrega === 'domicilio' ? '#EFF6FF' : '#DCFCE7',
                border: `1px solid ${metodoEntrega === 'domicilio' ? '#BFDBFE' : '#86EFAC'}`,
                padding: "4px 12px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>{metodoEntrega === 'domicilio' ? '🚚' : '🏪'}</span>
                <span>{metodoEntrega === 'domicilio' ? 'Envío a Domicilio' : 'Retiro en Tienda'}</span>
              </span>
            </div>

            {/* Selector de 2 Opciones de Entrega */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "18px" }}>
              {/* Tarjeta Envío a Domicilio */}
              <button
                type="button"
                onClick={() => {
                  setMetodoEntrega('domicilio');
                  if (paymentMethod === 'efectivo_tienda') setPaymentMethod('tarjeta');
                }}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "16px",
                  borderRadius: "14px",
                  border: `2px solid ${metodoEntrega === 'domicilio' ? 'var(--vinotinto)' : '#E5E7EB'}`,
                  background: metodoEntrega === 'domicilio' ? 'linear-gradient(135deg, #FFF9FA 0%, #FFFFFF 100%)' : '#FFFFFF',
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: metodoEntrega === 'domicilio' ? "0 4px 14px rgba(122, 30, 58, 0.10)" : "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "10px" }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    background: metodoEntrega === 'domicilio' ? "#FCE7F3" : "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem"
                  }}>
                    🚚
                  </div>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `2px solid ${metodoEntrega === 'domicilio' ? 'var(--vinotinto)' : '#D1D5DB'}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: metodoEntrega === 'domicilio' ? "var(--vinotinto)" : "#FFFFFF"
                  }}>
                    {metodoEntrega === 'domicilio' && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF" }} />
                    )}
                  </div>
                </div>

                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: metodoEntrega === 'domicilio' ? 'var(--vinotinto)' : '#1F2937', marginBottom: "4px" }}>
                  Envío a Domicilio
                </span>
                <span style={{ fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.35, marginBottom: "12px" }}>
                  Recibe tus libros en tu casa u oficina por transportadora certificada.
                </span>

                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: metodoEntrega === 'domicilio' ? "#FDF2F4" : "#F3F4F6",
                  color: metodoEntrega === 'domicilio' ? "var(--vinotinto)" : "#6B7280",
                  border: `1px solid ${metodoEntrega === 'domicilio' ? '#FBCFE8' : '#E5E7EB'}`
                }}>
                  📦 Despacho nacional
                </span>
              </button>

              {/* Tarjeta Retiro en Tienda */}
              {carritoMultiTienda ? (
                /* Aviso: múltiples tiendas → retiro no disponible */
                <div style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "16px",
                  borderRadius: "14px",
                  border: "2px dashed #E5E7EB",
                  background: "#F9FAFB",
                  textAlign: "left",
                  opacity: 0.75,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "10px" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "10px",
                      background: "#F3F4F6", display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: "1.3rem"
                    }}>
                      🏪
                    </div>
                    <span style={{
                      fontSize: "0.68rem", fontWeight: 700,
                      background: "#FEF3C7", color: "#92400E",
                      border: "1px solid #FDE68A",
                      padding: "3px 8px", borderRadius: "6px"
                    }}>
                      No disponible
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#9CA3AF", marginBottom: "6px" }}>
                    Retiro en Tienda
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#9CA3AF", lineHeight: 1.4 }}>
                    Tu carrito tiene libros de <strong>{tiendasEnCarrito.size} librerías distintas</strong>. El retiro en tienda solo está disponible cuando todos los libros son de la misma librería.
                  </span>
                </div>
              ) : (
              <button
                type="button"
                onClick={() => {
                  setMetodoEntrega('retiro_tienda');
                  setPaymentMethod('efectivo_tienda');
                }}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "16px",
                  borderRadius: "14px",
                  border: `2px solid ${metodoEntrega === 'retiro_tienda' ? 'var(--vinotinto)' : '#E5E7EB'}`,
                  background: metodoEntrega === 'retiro_tienda' ? 'linear-gradient(135deg, #FFF9FA 0%, #FFFFFF 100%)' : '#FFFFFF',
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: metodoEntrega === 'retiro_tienda' ? "0 4px 14px rgba(122, 30, 58, 0.10)" : "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "10px" }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    background: metodoEntrega === 'retiro_tienda' ? "#DCFCE7" : "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem"
                  }}>
                    🏪
                  </div>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `2px solid ${metodoEntrega === 'retiro_tienda' ? 'var(--vinotinto)' : '#D1D5DB'}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: metodoEntrega === 'retiro_tienda' ? "var(--vinotinto)" : "#FFFFFF"
                  }}>
                    {metodoEntrega === 'retiro_tienda' && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF" }} />
                    )}
                  </div>
                </div>

                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: metodoEntrega === 'retiro_tienda' ? 'var(--vinotinto)' : '#1F2937', marginBottom: "4px" }}>
                  Retiro en Tienda
                </span>
                <span style={{ fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.35, marginBottom: "12px" }}>
                  Recoge directamente en el local de la librería vendedora sin esperas.
                </span>

                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: "#DCFCE7",
                  color: "#166534",
                  border: "1px solid #BBF7D0"
                }}>
                  ⚡ Sin costo de envío ($0) • Click & Collect
                </span>
              </button>
              )}
            </div>

            {/* Detalle complementario según el modo seleccionado */}
            {metodoEntrega === 'domicilio' ? (
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <label style={{ fontWeight: 800, fontSize: "0.85rem", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>📍</span>
                    <span>Dirección de entrega de tu pedido:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/?seccion=Direcciones')}
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #FBCFE8",
                      color: "var(--vinotinto)",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      padding: "5px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                    }}
                  >
                    <span>📍</span>
                    <span>+ Gestionar direcciones</span>
                  </button>
                </div>

                <div style={{ position: "relative", marginBottom: direccionSeleccionadaId ? "12px" : "0" }}>
                  <select
                    value={direccionSeleccionadaId}
                    onChange={(event) => setDireccionSeleccionadaId(event.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      background: "#FFFFFF",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "#1E293B",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Selecciona una dirección de entrega...</option>
                    {direcciones.map((d) => (
                      <option key={d.id_direccion} value={d.id_direccion}>
                        {d.alias_direccion || 'Dirección'} — {d.direccion_completa || d.direccion}, {d.ciudad}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Previsualización de la dirección seleccionada */}
                {(() => {
                  const selectedDir = direcciones.find(d => String(d.id_direccion) === String(direccionSeleccionadaId));
                  if (!selectedDir) return null;
                  return (
                    <div style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap"
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0F172A" }}>
                            {selectedDir.alias_direccion || "Dirección de destino"}
                          </span>
                          {selectedDir.es_principal && (
                            <span style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: "0.68rem", fontWeight: 700, padding: "1px 6px", borderRadius: "4px" }}>
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569" }}>
                          {selectedDir.direccion_completa || selectedDir.direccion} • {selectedDir.ciudad}{selectedDir.departamento ? `, ${selectedDir.departamento}` : ''}
                          {selectedDir.telefono_contacto && ` • 📞 ${selectedDir.telefono_contacto}`}
                        </p>
                      </div>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "3px 8px", borderRadius: "6px" }}>
                        ✓ Destino activo
                      </span>
                    </div>
                  );
                })()}

                {direcciones.length === 0 && (
                  <div style={{
                    marginTop: "10px",
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#991B1B",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px"
                  }}>
                    <span>⚠️ No tienes direcciones registradas para recibir tu pedido.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/?seccion=Direcciones')}
                      style={{
                        background: "#DC2626",
                        color: "#FFF",
                        border: "none",
                        borderRadius: "6px",
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Agregar ahora
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)",
                border: "1.5px solid #86EFAC",
                borderRadius: "14px",
                padding: "16px 20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.2rem" }}>🏪</span>
                    <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "#166534" }}>
                      Retiro en punto físico habilitado
                    </span>
                  </div>
                  <span style={{
                    background: "#DCFCE7",
                    color: "#15803D",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid #BBF7D0"
                  }}>
                    Costo de envío: $0
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "1rem" }}>📍</span>
                    <div>
                      <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F2937" }}>Lugar de entrega:</span>
                      <span style={{ display: "block", fontSize: "0.76rem", color: "#4B5563", lineHeight: 1.35 }}>
                        Sede de la librería vendedora. Recibirás la dirección exacta y horario en tu confirmación.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "1rem" }}>💵</span>
                    <div>
                      <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F2937" }}>Opciones de pago:</span>
                      <span style={{ display: "block", fontSize: "0.76rem", color: "#4B5563", lineHeight: 1.35 }}>
                        Puedes pagar en <strong>efectivo al recoger</strong> en caja o pagar por adelantado (Nequi, Tarjeta, PSE, Transferencia).
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Paso 2 — Tarjeta 2: Método de pago */}
          <div className="pl-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1.5px solid #F3F4F6", paddingBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--vinotinto)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  boxShadow: "0 2px 6px rgba(122, 30, 58, 0.25)",
                  flexShrink: 0
                }}>
                  2
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.08rem", fontWeight: 800, color: "#111827" }}>
                    Selecciona tu método de pago
                  </h3>
                  <span style={{ fontSize: "0.76rem", color: "#6B7280", fontWeight: 500 }}>
                    {metodoEntrega === 'retiro_tienda' ? 'Métodos disponibles para retiro en librería' : 'Métodos disponibles para entrega a domicilio'}
                  </span>
                </div>
              </div>

              <span style={{
                fontSize: "0.76rem",
                fontWeight: 700,
                color: metodoEntrega === 'retiro_tienda' ? '#15803D' : '#1E40AF',
                background: metodoEntrega === 'retiro_tienda' ? '#DCFCE7' : '#EFF6FF',
                border: `1px solid ${metodoEntrega === 'retiro_tienda' ? '#86EFAC' : '#BFDBFE'}`,
                padding: "4px 12px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <span>{metodoEntrega === 'retiro_tienda' ? '🏪' : '🚚'}</span>
                <span>{metodoEntrega === 'retiro_tienda' ? 'Modalidad Retiro en Tienda' : 'Modalidad Entrega a Domicilio'}</span>
              </span>
            </div>

            {/* Selector de métodos ordenado en grilla balanceada */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px",
              marginBottom: "24px"
            }}>
              {(metodoEntrega === 'retiro_tienda' ? [
                { id: "efectivo_tienda", label: "Efectivo en Tienda", icon: "💵" },
                { id: "nequi", label: "Nequi / Daviplata", icon: "📱" },
                { id: "tarjeta", label: "Tarjeta", icon: "💳" },
                { id: "pse", label: "PSE", icon: "🏦" },
                { id: "transferencia", label: "Transferencia", icon: "🏛️" }
              ] : [
                { id: "tarjeta", label: "Tarjeta", icon: "💳" },
                { id: "pse", label: "PSE", icon: "🏦" },
                { id: "nequi", label: "Nequi / Daviplata", icon: "📱" },
                { id: "sucursal", label: "Punto Efecty", icon: "🏪" },
                { id: "transferencia", label: "Transferencia", icon: "🏛️" },
                { id: "paypal", label: "PayPal", icon: "🅿️" }
              ]).map(method => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      minHeight: "56px",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid var(--vinotinto)" : "1.5px solid #E5E7EB",
                      background: isSelected ? "linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%)" : "#FFFFFF",
                      color: isSelected ? "var(--vinotinto)" : "#374151",
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: "0.86rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 4px 12px rgba(122, 30, 58, 0.12)" : "0 1px 2px rgba(0,0,0,0.02)",
                      transform: isSelected ? "translateY(-1px)" : "none"
                    }}
                  >
                    <span style={{ fontSize: "1.15rem" }}>{method.icon}</span>
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SECCIÓN PAGO EN EFECTIVO EN TIENDA */}
            {paymentMethod === "efectivo_tienda" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Banner Cabecera Efectivo en Tienda */}
                <div style={{
                  background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
                  border: "1.5px solid #86EFAC",
                  borderRadius: "16px",
                  padding: "20px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                  boxShadow: "0 2px 10px rgba(22, 101, 52, 0.06)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: 50,
                      height: 50,
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.4rem",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
                      flexShrink: 0
                    }}>
                      💵
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#14532D" }}>
                          Pagar en Efectivo al Retirar
                        </h4>
                        <span style={{
                          background: "#DCFCE7",
                          color: "#166534",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          border: "1px solid #BBF7D0"
                        }}>
                          Sin pago en línea
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#15803D", fontWeight: 500 }}>
                        Reserva tus libros ahora y realiza el pago en la caja de la librería al retirar.
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", background: "#FFFFFF", padding: "8px 16px", borderRadius: "12px", border: "1px solid #BBF7D0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534", textTransform: "uppercase", display: "block" }}>
                      Monto a abonar en caja
                    </span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--vinotinto)" }}>
                      {formatCurrency(totalToPay)}
                    </span>
                  </div>
                </div>

                {/* 3 Tarjetas de Ventajas */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                      🔖
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>
                        Sin cobro anticipado
                      </span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", lineHeight: 1.35 }}>
                        Tu libro queda reservado sin necesidad de ingresar tarjetas ni transferir.
                      </span>
                    </div>
                  </div>

                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                      👀
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>
                        Inspecciona tu libro
                      </span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", lineHeight: 1.35 }}>
                        Revisa el estado de tu ejemplar en el local antes de realizar el pago en efectivo.
                      </span>
                    </div>
                  </div>

                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                      ⚡
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>
                        Entrega inmediata
                      </span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", lineHeight: 1.35 }}>
                        Recibirás la confirmación con el código de retiro para acercarte a la librería.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Guía en 3 Pasos */}
                <div style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 20px"
                }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "12px" }}>
                    ¿Cómo funciona el retiro y pago en tienda?
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#16A34A", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                        1
                      </div>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                        Haz clic en <strong>Confirmar Reserva</strong> para apartar los libros.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#0284C7", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                        2
                      </div>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                        Acércate a la librería con tu <strong>ID de Orden #{idVisible(order)}</strong>.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#0D9488", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                        3
                      </div>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                        Paga en efectivo en el mostrador y retira tu pedido inmediatamente.
                      </p>
                    </div>
                  </div>
                </div>

                {checkoutError && (
                  <div style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#991B1B",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span>⚠️</span>
                    <span>{checkoutError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => processPaymentApi("Efectivo en Tienda")}
                  disabled={paymentProcessing}
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    borderRadius: "12px",
                    background: paymentProcessing ? "#94A3B8" : "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "1.02rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    cursor: paymentProcessing ? "not-allowed" : "pointer",
                    boxShadow: paymentProcessing ? "none" : "0 4px 14px rgba(22, 163, 74, 0.25)",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!paymentProcessing) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 18px rgba(22, 163, 74, 0.35)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!paymentProcessing) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(22, 163, 74, 0.25)";
                    }
                  }}
                >
                  {paymentProcessing ? (
                    <>
                      <span style={{
                        width: 18,
                        height: 18,
                        border: "2px solid #FFFFFF",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite"
                      }}></span>
                      <span>{order?.estado_retiro === 'habilitado_pago' ? "Procesando pago..." : "Confirmando reserva en tienda..."}</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>
                        {order?.estado_retiro === 'habilitado_pago'
                          ? `Pagar en Efectivo en Tienda (${formatCurrency(totalToPay)})`
                          : `Confirmar Reserva y Pagar en Efectivo (${formatCurrency(totalToPay)})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}



            {paymentMethod === "tarjeta" && (() => {
              const cleanNum = (cardNumber || "").replace(/\s/g, "");
              const isVisa = /^4/.test(cleanNum);
              const isMastercard = /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleanNum);
              const isAmex = /^3[47]/.test(cleanNum);

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                  {/* Vista previa 3D de la tarjeta interactiva */}
                  <div style={{
                    width: "100%",
                    maxWidth: "380px",
                    margin: "0 auto",
                    aspectRatio: "1.586",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #4A0E1F 0%, #7A1E3A 55%, #2B0712 100%)",
                    padding: "22px 24px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "#FFFFFF",
                    boxShadow: "0 16px 32px -6px rgba(122, 30, 58, 0.45), 0 4px 12px rgba(0, 0, 0, 0.15)",
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}>
                    {/* Brillo de luz reflectante */}
                    <div style={{
                      position: "absolute",
                      top: "-40%",
                      right: "-20%",
                      width: "260px",
                      height: "260px",
                      background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
                      pointerEvents: "none"
                    }} />

                    {/* Fila superior: Chip EMV + Marca */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Chip metálico */}
                        <div style={{
                          width: 42,
                          height: 30,
                          borderRadius: "6px",
                          background: "linear-gradient(135deg, #FDE68A 0%, #D97706 60%, #B45309 100%)",
                          border: "1px solid #78350F",
                          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4)",
                          position: "relative"
                        }}>
                          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(0,0,0,0.25)" }} />
                          <div style={{ position: "absolute", left: "40%", top: 0, bottom: 0, width: "1px", background: "rgba(0,0,0,0.25)" }} />
                        </div>
                        {/* Ícono de contactless / proximidad */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M8.5 16.5a5 5 0 0 1 0-9"/>
                          <path d="M12 19a8.5 8.5 0 0 0 0-14"/>
                          <path d="M15.5 21.5a12 12 0 0 0 0-19"/>
                        </svg>
                      </div>

                      {/* Logotipo de la franquicia */}
                      <div style={{ height: "28px", display: "flex", alignItems: "center" }}>
                        {isVisa ? (
                          <span style={{ fontSize: "1.3rem", fontWeight: 900, fontStyle: "italic", letterSpacing: "1px", color: "#FFFFFF" }}>
                            VISA
                          </span>
                        ) : isMastercard ? (
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#EB001B", opacity: 0.95 }} />
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#F79E1B", marginLeft: -10, opacity: 0.95 }} />
                          </div>
                        ) : isAmex ? (
                          <span style={{ fontSize: "0.85rem", fontWeight: 900, letterSpacing: "1px", background: "#006FCF", padding: "3px 8px", borderRadius: "4px" }}>
                            AMEX
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "1.5px", background: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase" }}>
                            DEBIT / CREDIT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Centro: Número de tarjeta */}
                    <div style={{ position: "relative", zIndex: 1, margin: "14px 0" }}>
                      <div style={{
                        fontSize: "1.22rem",
                        fontWeight: 700,
                        letterSpacing: "3.5px",
                        fontFamily: "'Courier New', Courier, monospace",
                        color: "#FFFFFF",
                        textShadow: "0 2px 4px rgba(0,0,0,0.4)",
                        wordSpacing: "6px"
                      }}>
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>
                    </div>

                    {/* Fila inferior: Titular y Expiración */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
                      <div style={{ minWidth: 0, flex: 1, paddingRight: "14px" }}>
                        <span style={{ display: "block", fontSize: "0.62rem", letterSpacing: "1.2px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: "2px" }}>
                          Titular de la Tarjeta
                        </span>
                        <span style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cardName || "NOMBRE Y APELLIDO"}
                        </span>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <span style={{ display: "block", fontSize: "0.62rem", letterSpacing: "1.2px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: "2px" }}>
                          Vence
                        </span>
                        <span style={{ display: "block", fontSize: "0.86rem", fontWeight: 700, letterSpacing: "1px", fontFamily: "'Courier New', Courier, monospace" }}>
                          {cardExpiry || "MM/AA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Formulario con campos estilizados e iconos */}
                  <form onSubmit={handleCardSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Campo Número de Tarjeta */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label style={{ fontWeight: 700, fontSize: "0.84rem", color: "#374151" }}>
                          Número de Tarjeta
                        </label>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6B7280" }}>Aceptamos:</span>
                          <span style={{ fontSize: "0.7rem", background: "#EFF6FF", color: "#1D4ED8", padding: "1px 6px", borderRadius: "4px", fontWeight: 800 }}>Visa</span>
                          <span style={{ fontSize: "0.7rem", background: "#FEF2F2", color: "#B91C1C", padding: "1px 6px", borderRadius: "4px", fontWeight: 800 }}>Mastercard</span>
                          <span style={{ fontSize: "0.7rem", background: "#F0FDF4", color: "#15803D", padding: "1px 6px", borderRadius: "4px", fontWeight: 800 }}>Amex</span>
                        </div>
                      </div>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <span style={{ position: "absolute", left: "14px", color: "#9CA3AF", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g, "").slice(0,16);
                            setCardNumber(v.match(/.{1,4}/g)?.join(" ") || "");
                          }}
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            borderRadius: "10px",
                            border: `1.5px solid ${formErrors.cardNumber ? '#EF4444' : '#E5E7EB'}`,
                            fontSize: "0.92rem",
                            outline: "none",
                            background: "#FAFAFA",
                            transition: "all 0.15s ease",
                            letterSpacing: "1.5px",
                            fontWeight: 600
                          }}
                          onFocus={e => {
                            e.target.style.background = "#FFFFFF";
                            e.target.style.borderColor = "var(--vinotinto)";
                            e.target.style.boxShadow = "0 0 0 3px rgba(122,30,58,0.12)";
                          }}
                          onBlur={e => {
                            e.target.style.background = "#FAFAFA";
                            e.target.style.borderColor = formErrors.cardNumber ? '#EF4444' : '#E5E7EB';
                            e.target.style.boxShadow = "none";
                          }}
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                      {formErrors.cardNumber && <p style={{ color: "#DC2626", fontSize: "0.78rem", margin: "4px 0 0", fontWeight: 600 }}>⚠️ {formErrors.cardNumber}</p>}
                    </div>

                    {/* Fila: Vencimiento y CVV */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      {/* Vencimiento */}
                      <div>
                        <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "0.84rem", color: "#374151" }}>
                          Vencimiento (MM/AA)
                        </label>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <span style={{ position: "absolute", left: "14px", color: "#9CA3AF", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                          </span>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={e => {
                              let v = e.target.value.replace(/\D/g, "").slice(0,4);
                              setCardExpiry(v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v);
                            }}
                            style={{
                              width: "100%",
                              padding: "12px 14px 12px 42px",
                              borderRadius: "10px",
                              border: `1.5px solid ${formErrors.cardExpiry ? '#EF4444' : '#E5E7EB'}`,
                              fontSize: "0.92rem",
                              outline: "none",
                              background: "#FAFAFA",
                              transition: "all 0.15s ease",
                              fontWeight: 600
                            }}
                            onFocus={e => {
                              e.target.style.background = "#FFFFFF";
                              e.target.style.borderColor = "var(--vinotinto)";
                              e.target.style.boxShadow = "0 0 0 3px rgba(122,30,58,0.12)";
                            }}
                            onBlur={e => {
                              e.target.style.background = "#FAFAFA";
                              e.target.style.borderColor = formErrors.cardExpiry ? '#EF4444' : '#E5E7EB';
                              e.target.style.boxShadow = "none";
                            }}
                            placeholder="MM/AA"
                          />
                        </div>
                        {formErrors.cardExpiry && <p style={{ color: "#DC2626", fontSize: "0.78rem", margin: "4px 0 0", fontWeight: 600 }}>⚠️ {formErrors.cardExpiry}</p>}
                      </div>

                      {/* CVV */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <label style={{ fontWeight: 700, fontSize: "0.84rem", color: "#374151" }}>
                            Código CVV
                          </label>
                          <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>3 dígitos</span>
                        </div>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <span style={{ position: "absolute", left: "14px", color: "#9CA3AF", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          </span>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0,4))}
                            style={{
                              width: "100%",
                              padding: "12px 14px 12px 42px",
                              borderRadius: "10px",
                              border: `1.5px solid ${formErrors.cardCvv ? '#EF4444' : '#E5E7EB'}`,
                              fontSize: "0.92rem",
                              outline: "none",
                              background: "#FAFAFA",
                              transition: "all 0.15s ease",
                              fontWeight: 600
                            }}
                            onFocus={e => {
                              e.target.style.background = "#FFFFFF";
                              e.target.style.borderColor = "var(--vinotinto)";
                              e.target.style.boxShadow = "0 0 0 3px rgba(122,30,58,0.12)";
                            }}
                            onBlur={e => {
                              e.target.style.background = "#FAFAFA";
                              e.target.style.borderColor = formErrors.cardCvv ? '#EF4444' : '#E5E7EB';
                              e.target.style.boxShadow = "none";
                            }}
                            placeholder="123"
                          />
                        </div>
                        {formErrors.cardCvv && <p style={{ color: "#DC2626", fontSize: "0.78rem", margin: "4px 0 0", fontWeight: 600 }}>⚠️ {formErrors.cardCvv}</p>}
                      </div>
                    </div>

                    {/* Campo Nombre del Titular */}
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "0.84rem", color: "#374151" }}>
                        Nombre del Titular (como aparece en la tarjeta)
                      </label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <span style={{ position: "absolute", left: "14px", color: "#9CA3AF", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            borderRadius: "10px",
                            border: `1.5px solid ${formErrors.cardName ? '#EF4444' : '#E5E7EB'}`,
                            fontSize: "0.92rem",
                            outline: "none",
                            background: "#FAFAFA",
                            transition: "all 0.15s ease",
                            fontWeight: 600
                          }}
                          onFocus={e => {
                            e.target.style.background = "#FFFFFF";
                            e.target.style.borderColor = "var(--vinotinto)";
                            e.target.style.boxShadow = "0 0 0 3px rgba(122,30,58,0.12)";
                          }}
                          onBlur={e => {
                            e.target.style.background = "#FAFAFA";
                            e.target.style.borderColor = formErrors.cardName ? '#EF4444' : '#E5E7EB';
                            e.target.style.boxShadow = "none";
                          }}
                          placeholder="Juan Pérez"
                        />
                      </div>
                      {formErrors.cardName && <p style={{ color: "#DC2626", fontSize: "0.78rem", margin: "4px 0 0", fontWeight: 600 }}>⚠️ {formErrors.cardName}</p>}
                    </div>

                    {/* Insignia de seguridad y cifrado */}
                    <div style={{
                      background: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>🛡️</span>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#166534", lineHeight: 1.35, fontWeight: 500 }}>
                        Tus datos viajan 100% protegidos bajo cifrado SSL de 256 bits y estrictos estándares PCI-DSS.
                      </p>
                    </div>

                    {checkoutError && (
                      <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "10px 14px", color: "#DC2626", fontSize: "0.84rem", fontWeight: 600 }}>
                        ⚠️ {checkoutError}
                      </div>
                    )}

                    {/* Botón de pago prémium */}
                    <button
                      type="submit"
                      disabled={paymentProcessing}
                      style={{
                        background: "linear-gradient(135deg, #7A1E3A 0%, #902345 100%)",
                        color: "#FFFFFF",
                        padding: "16px",
                        borderRadius: "12px",
                        border: "none",
                        fontWeight: 800,
                        fontSize: "1.02rem",
                        cursor: paymentProcessing ? "not-allowed" : "pointer",
                        opacity: paymentProcessing ? 0.75 : 1,
                        boxShadow: "0 4px 16px rgba(122, 30, 58, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        if (!paymentProcessing) {
                          e.currentTarget.style.filter = "brightness(1.08)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.filter = "brightness(1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <span>
                        {paymentProcessing
                          ? (metodoEntrega === 'retiro_tienda'
                              ? (order?.estado_retiro === 'habilitado_pago' ? "Procesando pago seguro..." : "Confirmando reserva y procesando pago...")
                              : "Procesando pago seguro...")
                          : (metodoEntrega === 'retiro_tienda'
                              ? (order?.estado_retiro === 'habilitado_pago'
                                  ? `Pagar con Tarjeta (${formatCurrency(totalToPay)})`
                                  : `Confirmar Reserva y Pagar con Tarjeta (${formatCurrency(totalToPay)})`)
                              : `Pagar ${formatCurrency(totalToPay)}`)}
                      </span>
                    </button>
                  </form>
                </div>
              );
            })()}

            {paymentMethod === "paypal" && (() => {
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Banner Cabecera PayPal */}
                  <div style={{
                    background: "linear-gradient(135deg, #F0F7FF 0%, #E6F2FE 100%)",
                    border: "1.5px solid #BAE6FD",
                    borderRadius: "16px",
                    padding: "20px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 10px rgba(0, 112, 186, 0.06)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {/* Logo PayPal emblemático */}
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #003087 0%, #0079C1 100%)",
                        border: "1.5px solid #002568",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0, 48, 135, 0.25)",
                        flexShrink: 0
                      }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                          <path d="M7.076 21.337H3.502a.604.604 0 0 1-.597-.689L5.753 3.633a.605.605 0 0 1 .597-.508h6.815c3.082 0 5.485 1.542 5.097 5.068-.372 3.376-2.587 5.253-5.836 5.253h-2.14l-1.077 6.843a.605.605 0 0 1-.597.512z" fill="#0079C1" opacity="0.3" />
                          <path d="M18.73 7.82c-.372 3.376-2.587 5.253-5.836 5.253h-2.14l-1.077 6.843a.605.605 0 0 1-.597.512H5.502a.604.604 0 0 1-.597-.689L6.5 10.5h3.815c3.082 0 5.485-1.542 5.097-5.068.047-.417.065-.81.054-1.182 1.94.57 3.498 1.83 3.264 3.57z" fill="#00457C" opacity="0.4" />
                          <path d="M9.638 12.074h2.14c3.249 0 5.464-1.877 5.836-5.253.388-3.526-2.015-5.068-5.097-5.068H5.702a.605.605 0 0 0-.597.508L2.257 19.278a.604.604 0 0 0 .597.689h3.694l.922-5.85a1.21 1.21 0 0 1 1.194-1.018l.974-.025z" fill="#FFFFFF" />
                          <path d="M10.715 5.223h3.24c2.25 0 3.99 1.125 3.708 3.694-.287 2.607-1.996 4.056-4.505 4.056H11.23l-1.01 6.417a.605.605 0 0 1-.597.512H6.945l2.752-13.66a1.02 1.02 0 0 1 1.018-.019z" fill="#0079C1" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#003087" }}>
                            PayPal Checkout
                          </h4>
                          <span style={{
                            background: "#E0F2FE",
                            color: "#0369A1",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            border: "1px solid #BAE6FD"
                          }}>
                            🌍 Internacional y Multidivisa
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#0284C7", fontWeight: 500 }}>
                          Paga con saldo de PayPal, tarjetas internacionales o débito bancario protegido.
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", background: "#FFFFFF", padding: "8px 16px", borderRadius: "12px", border: "1px solid #BAE6FD", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0079C1", textTransform: "uppercase", display: "block" }}>
                        Total a pagar
                      </span>
                      <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--vinotinto)" }}>
                        {formatCurrency(totalToPay)}
                      </span>
                    </div>
                  </div>

                  {/* 3 Tarjetas de Ventajas / Garantías */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        🛡️
                      </div>
                      <div>
                        <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>
                          Protección al Comprador
                        </span>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", lineHeight: 1.35 }}>
                          Tus compras elegibles están 100% protegidas contra fraude o pérdidas.
                        </span>
                      </div>
                    </div>

                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        🔒
                      </div>
                      <div>
                        <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>
                          Privacidad Financiera
                        </span>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", lineHeight: 1.35 }}>
                          No necesitas compartir tus datos bancarios ni de tarjeta con el comercio.
                        </span>
                      </div>
                    </div>

                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        💳
                      </div>
                      <div>
                        <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>
                          Cualquier Medio
                        </span>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", lineHeight: 1.35 }}>
                          Usa saldo PayPal, Visa, Mastercard, AMEX o cuentas bancarias vinculadas.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Guía en 3 Pasos */}
                  <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    padding: "16px 20px"
                  }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "12px" }}>
                      ¿Cómo funciona el pago con PayPal?
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#003087", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                          1
                        </div>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                          Haz clic en el botón oficial de <strong>Pagar con PayPal</strong>.
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#0079C1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                          2
                        </div>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                          Se abrirá el portal seguro Sandbox para ingresar tus credenciales.
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#10B981", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                          3
                        </div>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                          Aprueba la transacción y tu pedido se confirmará inmediatamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sección Botón de Pago PayPal Oficial */}
                  <div style={{
                    background: "#FFFFFF",
                    border: "1.5px dashed #CBD5E1",
                    borderRadius: "16px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "14px",
                    textAlign: "center"
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowPaypalModal(true)}
                      style={{
                        background: "linear-gradient(180deg, #FFC439 0%, #F4B41A 100%)",
                        border: "1.5px solid #E0A015",
                        color: "#001435",
                        width: "100%",
                        maxWidth: "420px",
                        padding: "14px 28px",
                        borderRadius: "28px",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: "1.05rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        boxShadow: "0 4px 15px rgba(244, 180, 26, 0.4)",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(244, 180, 26, 0.55)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(244, 180, 26, 0.4)";
                      }}
                    >
                      <span style={{ fontStyle: "italic", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.5px" }}>
                        <span style={{ color: "#003087" }}>Pay</span><span style={{ color: "#0079C1" }}>Pal</span>
                      </span>
                      <span style={{ color: "#001435", fontWeight: 700, fontSize: "0.95rem" }}>
                        — Pagar {formatCurrency(totalToPay)}
                      </span>
                    </button>

                    {/* Chips de métodos aceptados por PayPal */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>Métodos vinculables:</span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#F1F5F9", color: "#334155", padding: "2px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>Saldo PayPal</span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: "6px", border: "1px solid #DBEAFE" }}>VISA</span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#FFF7ED", color: "#C2410C", padding: "2px 8px", borderRadius: "6px", border: "1px solid #FFEDD5" }}>Mastercard</span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#ECFDF5", color: "#047857", padding: "2px 8px", borderRadius: "6px", border: "1px solid #D1FAE5" }}>Amex</span>
                    </div>

                    {/* Badge de Seguridad */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#15803D",
                      fontSize: "0.75rem",
                      fontWeight: 600
                    }}>
                      <span>🔒</span>
                      <span>Conexión cifrada TLS de 256 bits y protección contra fraudes 24/7 de PayPal</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {paymentMethod === "sucursal" && (() => {
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Banner Cabecera Efecty */}
                  <div style={{
                    background: "linear-gradient(135deg, #FFFDF0 0%, #FEF9C3 100%)",
                    border: "1.5px solid #FDE047",
                    borderRadius: "16px",
                    padding: "20px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 10px rgba(234, 179, 8, 0.08)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {/* Logo Efecty emblemático */}
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #FACC15 0%, #EAB308 100%)",
                        border: "1.5px solid #CA8A04",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 3px 10px rgba(202, 138, 4, 0.25)",
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: "1.4rem" }}>🏪</span>
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "#713F12", display: "flex", alignItems: "center", gap: "8px" }}>
                          Puntos de Pago Efecty
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#854D0E", fontWeight: 500 }}>
                          Paga en efectivo en cualquiera de los más de 10.000 puntos en todo el país.
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", background: "#FFFFFF", padding: "8px 16px", borderRadius: "12px", border: "1px solid #FEF08A", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#A16207", textTransform: "uppercase", display: "block" }}>
                        Total a pagar
                      </span>
                      <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--vinotinto)" }}>
                        {formatCurrency(totalToPay)}
                      </span>
                    </div>
                  </div>

                  {!sucursalCodigo ? (
                    <>
                      {/* Ventajas y Cobertura de Efecty */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "1.4rem" }}>📍</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.86rem", color: "#1F2937" }}>+10.000 Puntos</p>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "#6B7280" }}>Presencia en todo el territorio nacional</p>
                          </div>
                        </div>

                        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "1.4rem" }}>⏳</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.86rem", color: "#1F2937" }}>48 Horas de Plazo</p>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "#6B7280" }}>Tiempo para cancelar en cualquier sede</p>
                          </div>
                        </div>

                        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "1.4rem" }}>💵</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.86rem", color: "#1F2937" }}>Pago en Efectivo</p>
                            <p style={{ margin: 0, fontSize: "0.74rem", color: "#6B7280" }}>Sin necesidad de tarjeta o cuenta bancaria</p>
                          </div>
                        </div>
                      </div>

                      {/* Guía en 3 pasos */}
                      <div style={{
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: "14px",
                        padding: "16px 20px"
                      }}>
                        <p style={{ margin: "0 0 10px", fontSize: "0.84rem", fontWeight: 700, color: "#374151" }}>
                          ¿Cómo funciona el pago en Efecty?
                        </p>
                        <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "0.8rem", color: "#4B5563", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: "6px" }}>
                          <li>Haz clic en <strong>Generar Código de Pago</strong> para obtener tu PIN de recaudo.</li>
                          <li>Acércate a cualquier punto Efecty e indica el convenio de <strong>BookyHome</strong> junto a tu código.</li>
                          <li>Paga en efectivo el valor de <strong>{formatCurrency(totalToPay)}</strong> y conserva tu tirilla de comprobante.</li>
                        </ol>
                      </div>

                      {/* Botón Generar Código */}
                      <button
                        type="button"
                        onClick={handleSucursalPago}
                        style={{
                          width: "100%",
                          padding: "16px",
                          borderRadius: "12px",
                          border: "none",
                          background: "linear-gradient(135deg, #7A1E3A 0%, #902345 100%)",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          fontSize: "1.02rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          boxShadow: "0 4px 16px rgba(122, 30, 58, 0.35)",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.filter = "brightness(1.08)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.filter = "brightness(1)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <span>Generar Código de Pago Efecty</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Talonario / Recibo Digital de Pago Efecty */}
                      <div style={{
                        background: "#FFFFFF",
                        border: "2px dashed #FCD34D",
                        borderRadius: "16px",
                        padding: "24px 26px",
                        boxShadow: "0 8px 24px -4px rgba(234, 179, 8, 0.15)",
                        position: "relative"
                      }}>
                        {/* Cabecera del Recibo */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px dashed #E5E7EB", paddingBottom: "14px", marginBottom: "16px" }}>
                          <div>
                            <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "1px", color: "#CA8A04", textTransform: "uppercase" }}>
                              CUPÓN DE PAGO OFICIAL
                            </span>
                            <h4 style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 900, color: "#111827" }}>
                              Efecty · BookyHome
                            </h4>
                          </div>
                          <span style={{
                            background: sucursalPagoConfirmado ? "#DCFCE7" : "#FEF9C3",
                            color: sucursalPagoConfirmado ? "#15803D" : "#854D0E",
                            fontSize: "0.76rem",
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: "20px"
                          }}>
                            {sucursalPagoConfirmado ? "PAGADO" : "PENDIENTE DE PAGO"}
                          </span>
                        </div>

                        {/* Datos del Recibo en Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                          <div style={{ background: "#F9FAFB", padding: "12px", borderRadius: "10px", border: "1px solid #F3F4F6" }}>
                            <span style={{ display: "block", fontSize: "0.72rem", color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Convenio Efecty</span>
                            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 800, color: "#1F2937", marginTop: "2px" }}>110954</span>
                          </div>

                          <div style={{ background: "#F9FAFB", padding: "12px", borderRadius: "10px", border: "1px solid #F3F4F6" }}>
                            <span style={{ display: "block", fontSize: "0.72rem", color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Monto a Pagar</span>
                            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 900, color: "var(--vinotinto)", marginTop: "2px" }}>{formatCurrency(totalToPay)}</span>
                          </div>

                          <div style={{ background: "#F9FAFB", padding: "12px", borderRadius: "10px", border: "1px solid #F3F4F6" }}>
                            <span style={{ display: "block", fontSize: "0.72rem", color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Vigencia</span>
                            <span style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#059669", marginTop: "4px" }}>48 Horas</span>
                          </div>
                        </div>

                        {/* PIN / Código Destacado */}
                        <div style={{
                          background: "linear-gradient(135deg, #FFFBEB 0%, #FEF08A 100%)",
                          border: "1.5px solid #FACC15",
                          borderRadius: "14px",
                          padding: "18px 20px",
                          textAlign: "center",
                          marginBottom: "16px"
                        }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#854D0E", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                            Referencia de Pago / PIN
                          </span>
                          <div style={{
                            fontSize: "2rem",
                            fontWeight: 900,
                            letterSpacing: "6px",
                            fontFamily: "'Courier New', Courier, monospace",
                            color: "#713F12"
                          }}>
                            {sucursalCodigo}
                          </div>
                          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#A16207" }}>
                            Dicta este número al cajero en el punto Efecty.
                          </p>
                        </div>

                        {/* Código de barras decorativo */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", opacity: 0.5 }}>
                          <svg width="240" height="36" viewBox="0 0 240 36" fill="none">
                            {[4, 10, 16, 20, 26, 34, 40, 48, 52, 60, 68, 74, 82, 90, 96, 104, 112, 118, 126, 134, 140, 148, 156, 162, 170, 178, 184, 192, 200, 208, 214, 222, 230].map((x, i) => (
                              <rect key={x} x={x} y={0} width={i % 2 === 0 ? 3 : 2} height={36} fill="#111827" />
                            ))}
                          </svg>
                        </div>
                      </div>

                      {/* Estado del pago */}
                      {sucursalPagoConfirmado ? (
                        <div style={{ background: "#DCFCE7", border: "1.5px solid #86EFAC", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", color: "#14532D" }}>
                          <span style={{ fontSize: "1.4rem" }}>🎉</span>
                          <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem" }}>¡Pago Confirmado en Efecty!</p>
                            <p style={{ margin: 0, fontSize: "0.82rem" }}>Hemos recibido la confirmación de la sucursal. Tu orden está en preparación.</p>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={verificarPagoEfecty}
                            style={{
                              width: "100%",
                              padding: "15px",
                              borderRadius: "12px",
                              border: "none",
                              background: "linear-gradient(135deg, #15803D 0%, #166534 100%)",
                              color: "#FFFFFF",
                              fontWeight: 800,
                              fontSize: "1rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              boxShadow: "0 4px 14px rgba(22, 101, 52, 0.3)",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.filter = "brightness(1.1)";
                              e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.filter = "brightness(1)";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Ya realicé el pago en el punto</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setSucursalCodigo(""); setSucursalEsperandoConfirmacion(false); }}
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "10px",
                              border: "1.5px solid #E5E7EB",
                              background: "#FFFFFF",
                              color: "#4B5563",
                              fontWeight: 700,
                              fontSize: "0.88rem",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            Generar otro código o Cambiar método
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
            
            {paymentMethod === "pse" && (() => {
              const popularBanks = [
                { codigo: "001", nombre: "Bancolombia", icon: "🟡", short: "Bancolombia" },
                { codigo: "005", nombre: "Davivienda", icon: "🔴", short: "Davivienda" },
                { codigo: "007", nombre: "Nequi", icon: "🟣", short: "Nequi" },
                { codigo: "002", nombre: "Banco de Bogotá", icon: "🔵", short: "B. Bogotá" },
                { codigo: "004", nombre: "BBVA Colombia", icon: "🔷", short: "BBVA" }
              ];
              const selectedBankObj = bancosPSE.find(b => b.codigo === pseBanco);

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Tarjeta Informativa PSE con Branding */}
                  <div style={{
                    background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
                    border: "1.5px solid #BFDBFE",
                    borderRadius: "16px",
                    padding: "20px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 10px rgba(59, 130, 246, 0.06)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {/* Emblema PSE */}
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        boxShadow: "0 3px 10px rgba(37, 99, 235, 0.3)",
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: "0.92rem", fontWeight: 900, letterSpacing: "1px", lineHeight: 1 }}>PSE</span>
                        <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.5px", opacity: 0.9 }}>EN LÍNEA</span>
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "#1E3A8A", display: "flex", alignItems: "center", gap: "8px" }}>
                          Pago Seguro en Línea (PSE)
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", fontWeight: 500 }}>
                          Débito directo sin costos adicionales desde tu cuenta bancaria.
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", background: "#FFFFFF", padding: "8px 16px", borderRadius: "12px", border: "1px solid #DBEAFE", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                        Total a debitar
                      </span>
                      <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--vinotinto)" }}>
                        {formatCurrency(totalToPay)}
                      </span>
                    </div>
                  </div>

                  {/* Acceso Rápido: Bancos más utilizados */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                        Bancos frecuentes en Colombia
                      </label>
                      <span style={{ fontSize: "0.74rem", color: "#64748B" }}>Selección rápida con 1 clic</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                      {popularBanks.map((b) => {
                        const isSelected = pseBanco === b.codigo;
                        return (
                          <button
                            key={b.codigo}
                            type="button"
                            onClick={() => setPseBanco(b.codigo)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 14px",
                              borderRadius: "10px",
                              border: `1.5px solid ${isSelected ? 'var(--vinotinto)' : '#E2E8F0'}`,
                              background: isSelected ? "#FDF2F4" : "#FFFFFF",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: isSelected ? "0 2px 8px rgba(122,30,58,0.18)" : "0 1px 2px rgba(0,0,0,0.02)",
                              textAlign: "left"
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = "#CBD5E1";
                                e.currentTarget.style.background = "#F8FAFC";
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = "#E2E8F0";
                                e.currentTarget.style.background = "#FFFFFF";
                              }
                            }}
                          >
                            <span style={{ fontSize: "1.1rem" }}>{b.icon}</span>
                            <span style={{ fontSize: "0.82rem", fontWeight: isSelected ? 800 : 600, color: isSelected ? "var(--vinotinto)" : "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {b.short}
                            </span>
                            {isSelected && (
                              <span style={{ marginLeft: "auto", color: "var(--vinotinto)", fontSize: "0.8rem", fontWeight: 900 }}>
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector Completo de Bancos */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                      O selecciona tu entidad financiera en la lista completa:
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: "14px", color: "#64748B", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v4"/><path d="M12 14v4"/><path d="M16 14v4"/>
                        </svg>
                      </span>
                      <select
                        value={pseBanco}
                        onChange={(e) => setPseBanco(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 42px",
                          borderRadius: "10px",
                          border: `1.5px solid ${pseBanco ? 'var(--vinotinto)' : '#CBD5E1'}`,
                          outline: "none",
                          fontSize: "0.92rem",
                          fontWeight: 600,
                          background: "#FFFFFF",
                          color: pseBanco ? "#0F172A" : "#64748B",
                          cursor: "pointer",
                          boxShadow: pseBanco ? "0 0 0 3px rgba(122,30,58,0.08)" : "none",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <option value="">-- Selecciona tu banco --</option>
                        {bancosPSE.map((banco) => (
                          <option key={banco.codigo} value={banco.codigo}>{banco.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Banner de Información y Pasos PSE */}
                  <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155", fontWeight: 700, fontSize: "0.84rem" }}>
                      <span>ℹ️</span> ¿Cómo funciona el pago con PSE?
                    </div>
                    <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "0.8rem", color: "#475569", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <li>Al hacer clic en el botón, serás redirigido a la pasarela segura de ACH Colombia y tu banco.</li>
                      <li>Inicias sesión con tus credenciales bancarias habituales de forma 100% privada.</li>
                      <li>Autorizas la transacción y tu pedido en BookyHome se confirmará inmediatamente.</li>
                    </ol>
                  </div>

                  {/* Insignia de Seguridad ACH Colombia */}
                  <div style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>🛡️</span>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#166534", lineHeight: 1.35, fontWeight: 500 }}>
                      Transacción avalada y protegida por <strong>ACH Colombia</strong>. Nunca solicitamos contraseñas ni claves de tus cuentas bancarias.
                    </p>
                  </div>

                  {/* Botón de Confirmación y Redirección */}
                  <button
                    type="button"
                    onClick={handlePseRedirect}
                    disabled={paymentProcessing}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "1.02rem",
                      cursor: paymentProcessing ? "not-allowed" : "pointer",
                      background: "linear-gradient(135deg, #0F265C 0%, #1A3B8B 100%)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      boxShadow: "0 4px 16px rgba(15, 38, 92, 0.35)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => {
                      if (!paymentProcessing) {
                        e.currentTarget.style.filter = "brightness(1.12)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!paymentProcessing) {
                        e.currentTarget.style.filter = "brightness(1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    <span>
                      {metodoEntrega === 'retiro_tienda'
                        ? (order?.estado_retiro === 'habilitado_pago'
                            ? `Pagar vía PSE con ${selectedBankObj?.nombre || 'Bancolombia'} (${formatCurrency(totalToPay)})`
                            : `Confirmar Reserva con PSE (${selectedBankObj?.nombre || 'Bancolombia'})`)
                        : `Abrir Simulador PSE con ${selectedBankObj?.nombre || 'Bancolombia'} (${formatCurrency(totalToPay)})`}
                    </span>
                    <span style={{ fontSize: "1.1rem" }}>➔</span>
                  </button>
                </div>
              );
            })()}
            
            {paymentMethod === "nequi" && (() => {
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Banner Cabecera Billeteras Digitales */}
                  <div style={{
                    background: "linear-gradient(135deg, #FDF4FF 0%, #FFF1F2 100%)",
                    border: "1.5px solid #F0ABFC",
                    borderRadius: "16px",
                    padding: "20px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 10px rgba(217, 70, 239, 0.06)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {/* Emblema combinado */}
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #200020 0%, #DA0081 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 3px 10px rgba(218, 0, 129, 0.3)",
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: "1.4rem" }}>📱</span>
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "#701A75", display: "flex", alignItems: "center", gap: "8px" }}>
                          Billeteras Móviles: Nequi & Daviplata
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#4A044E", fontWeight: 500 }}>
                          Paga directo desde tu app con notificación push o enlace seguro.
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", background: "#FFFFFF", padding: "8px 16px", borderRadius: "12px", border: "1px solid #F5D0FE", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#86198F", textTransform: "uppercase", display: "block" }}>
                        Total a transferir
                      </span>
                      <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--vinotinto)" }}>
                        {formatCurrency(totalToPay)}
                      </span>
                    </div>
                  </div>

                  {/* 2 Tarjetas Especializadas: Nequi vs Daviplata */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
                    {/* Opción 1: Nequi */}
                    <div style={{
                      background: "#FFFFFF",
                      border: "2px solid #E879F9",
                      borderRadius: "16px",
                      padding: "22px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 4px 16px -2px rgba(218, 0, 129, 0.12)",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "linear-gradient(135deg, #DA0081 0%, #200020 100%)",
                        color: "#FFFFFF",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        padding: "4px 12px",
                        borderBottomLeftRadius: "10px",
                        letterSpacing: "0.5px"
                      }}>
                        MÁS POPULAR
                      </div>

                      <div>
                        {/* Cabecera Nequi */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            background: "#200020",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#DA0081",
                            fontWeight: 900,
                            fontSize: "1.1rem"
                          }}>
                            N
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#200020" }}>Nequi</h4>
                            <span style={{ fontSize: "0.74rem", color: "#86198F", fontWeight: 600 }}>By Bancolombia</span>
                          </div>
                        </div>

                        {/* Pasos Nequi */}
                        <div style={{ background: "#FDF4FF", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
                          <p style={{ margin: "0 0 8px", fontSize: "0.76rem", fontWeight: 700, color: "#701A75", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            Instrucciones rápidas:
                          </p>
                          {metodoEntrega === 'retiro_tienda' ? (
                            order?.estado_retiro === 'habilitado_pago' ? (
                              <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", color: "#4A044E", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "4px" }}>
                                <li>El vendedor ha validado tu presencia en la librería.</li>
                                <li>Haz clic en <strong>Pagar con Nequi</strong> para procesar el cobro seguro.</li>
                                <li>¡Recibe tus libros inmediatamente en el punto de atención!</li>
                              </ol>
                            ) : (
                              <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", color: "#4A044E", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "4px" }}>
                                <li>Haz clic en <strong>Confirmar Reserva con Nequi</strong> para apartar tu libro.</li>
                                <li>Se generará tu <strong>PIN único de retiro</strong> y los datos de la librería física.</li>
                                <li>Al llegar al punto físico, muestra tu PIN y paga con Nequi en tienda.</li>
                              </ol>
                            )
                          ) : (
                            <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", color: "#4A044E", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "4px" }}>
                              <li>Haz clic en <strong>Pagar con Nequi</strong>.</li>
                              <li>Abre tu App Nequi o responde la notificación push.</li>
                              <li>Acepta el pago por <strong>{formatCurrency(totalToPay)}</strong> y confirma.</li>
                            </ol>
                          )}
                        </div>
                      </div>

                      {/* Botón Nequi */}
                      <button
                        type="button"
                        onClick={handleNequiRedirect}
                        disabled={paymentProcessing}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "12px",
                          border: "none",
                          background: paymentProcessing ? "#9CA3AF" : "linear-gradient(135deg, #DA0081 0%, #200020 100%)",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          cursor: paymentProcessing ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: "0 4px 14px rgba(218, 0, 129, 0.35)",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={e => {
                          if (!paymentProcessing) {
                            e.currentTarget.style.filter = "brightness(1.1)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!paymentProcessing) {
                            e.currentTarget.style.filter = "brightness(1)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                        </svg>
                        <span>
                          {paymentProcessing
                            ? (order?.estado_retiro === 'habilitado_pago' ? "Procesando pago..." : "Confirmando reserva...")
                            : metodoEntrega === 'retiro_tienda'
                            ? (order?.estado_retiro === 'habilitado_pago'
                                ? `Pagar con Nequi (${formatCurrency(totalToPay)})`
                                : `Confirmar Reserva con Nequi (${formatCurrency(totalToPay)})`)
                            : "Pagar con Nequi"}
                        </span>
                      </button>
                    </div>

                    {/* Opción 2: Daviplata */}
                    <div style={{
                      background: "#FFFFFF",
                      border: "2px solid #FCA5A5",
                      borderRadius: "16px",
                      padding: "22px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 4px 16px -2px rgba(237, 28, 36, 0.12)",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "linear-gradient(135deg, #ED1C24 0%, #B91C1C 100%)",
                        color: "#FFFFFF",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        padding: "4px 12px",
                        borderBottomLeftRadius: "10px",
                        letterSpacing: "0.5px"
                      }}>
                        DIRECTO DAVIVIENDA
                      </div>

                      <div>
                        {/* Cabecera Daviplata */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            background: "#ED1C24",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            fontWeight: 900,
                            fontSize: "1.1rem"
                          }}>
                            D
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>Daviplata</h4>
                            <span style={{ fontSize: "0.74rem", color: "#DC2626", fontWeight: 600 }}>By Davivienda</span>
                          </div>
                        </div>

                        {/* Pasos Daviplata */}
                        <div style={{ background: "#FEF2F2", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
                          <p style={{ margin: "0 0 8px", fontSize: "0.76rem", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            Instrucciones rápidas:
                          </p>
                          {metodoEntrega === 'retiro_tienda' ? (
                            order?.estado_retiro === 'habilitado_pago' ? (
                              <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", color: "#7F1D1D", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "4px" }}>
                                <li>El vendedor ha validado tu presencia en la librería.</li>
                                <li>Haz clic en <strong>Pagar con Daviplata</strong> para procesar el cobro seguro.</li>
                                <li>¡Recibe tus libros inmediatamente en el punto de atención!</li>
                              </ol>
                            ) : (
                              <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", color: "#7F1D1D", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "4px" }}>
                                <li>Haz clic en <strong>Confirmar Reserva con Daviplata</strong> para apartar tu libro.</li>
                                <li>Se generará tu <strong>PIN único de retiro</strong> y los datos de la librería física.</li>
                                <li>Al llegar al local físico, muestra tu PIN y realiza la transferencia en Daviplata.</li>
                              </ol>
                            )
                          ) : (
                            <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", color: "#7F1D1D", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "4px" }}>
                              <li>Haz clic en <strong>Pagar con Daviplata</strong>.</li>
                              <li>Ingresa con tu número de documento y teléfono.</li>
                              <li>Autoriza el débito por <strong>{formatCurrency(totalToPay)}</strong> con tu clave.</li>
                            </ol>
                          )}
                        </div>
                      </div>

                      {/* Botón Daviplata */}
                      <button
                        type="button"
                        onClick={handleDaviplataRedirect}
                        disabled={paymentProcessing}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "12px",
                          border: "none",
                          background: paymentProcessing ? "#9CA3AF" : "linear-gradient(135deg, #ED1C24 0%, #B91C1C 100%)",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          cursor: paymentProcessing ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: "0 4px 14px rgba(237, 28, 36, 0.35)",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={e => {
                          if (!paymentProcessing) {
                            e.currentTarget.style.filter = "brightness(1.1)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!paymentProcessing) {
                            e.currentTarget.style.filter = "brightness(1)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                        </svg>
                        <span>
                          {paymentProcessing
                            ? (order?.estado_retiro === 'habilitado_pago' ? "Procesando pago..." : "Confirmando reserva...")
                            : metodoEntrega === 'retiro_tienda'
                            ? (order?.estado_retiro === 'habilitado_pago'
                                ? `Pagar con Daviplata (${formatCurrency(totalToPay)})`
                                : `Confirmar Reserva con Daviplata (${formatCurrency(totalToPay)})`)
                            : "Pagar con Daviplata"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Insignia de Seguridad Billeteras Móviles */}
                  <div style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>🛡️</span>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#166534", lineHeight: 1.35, fontWeight: 500 }}>
                      Operaciones respaldadas directamente por las plataformas bancarias de Bancolombia y Davivienda. Sin comisiones adicionales para el comprador.
                    </p>
                  </div>
                </div>
              );
            })()}
            
            {paymentMethod === "transferencia" && (() => {
              const hayDatosVendedor = (datosTransferencia || []).length > 0;

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Banner Cabecera de Transferencia */}
                  <div style={{
                    background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
                    border: "1.5px solid #CBD5E1",
                    borderRadius: "16px",
                    padding: "20px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 3px 10px rgba(15, 23, 42, 0.25)",
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: "1.4rem" }}>🏛️</span>
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                          Transferencia a Cuenta del Vendedor
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", fontWeight: 500 }}>
                          Transfiere directamente a la cuenta bancaria donde el vendedor recibe sus pagos.
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", background: "#FFFFFF", padding: "8px 16px", borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                        Total a transferir
                      </span>
                      <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--vinotinto)" }}>
                        {formatCurrency(totalToPay)}
                      </span>
                    </div>
                  </div>

                  {/* Estado de Carga */}
                  {cargandoTransferencia ? (
                    <div style={{
                      background: "#FFFFFF",
                      border: "1.5px dashed #CBD5E1",
                      borderRadius: "16px",
                      padding: "36px 20px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        border: "3px solid #E2E8F0",
                        borderTop: "3px solid var(--vinotinto)",
                        borderRadius: "50%",
                        animation: "spin 0.9s linear infinite"
                      }} />
                      <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#334155" }}>
                        Cargando cuenta bancaria del vendedor...
                      </p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748B" }}>
                        Consultando los métodos de cobro oficiales asociados a la tienda.
                      </p>
                    </div>
                  ) : hayDatosVendedor ? (
                    /* Tarjeta(s) del vendedor encontrada(s) */
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      {datosTransferencia.map((vendedor, index) => {
                        const cuenta = vendedor.cuenta || (vendedor.cuentas && vendedor.cuentas[0]);
                        const tieneCuentaActiva = vendedor.tiene_cuenta && cuenta;

                        return (
                          <div
                            key={vendedor.id_tienda || index}
                            style={{
                              background: "#FFFFFF",
                              border: "1.5px solid #E2E8F0",
                              borderRadius: "16px",
                              padding: "22px",
                              boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.06)",
                              position: "relative"
                            }}
                          >
                            {/* Cabecera del Vendedor / Tienda */}
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderBottom: "1.5px solid #F1F5F9",
                              paddingBottom: "14px",
                              marginBottom: "16px",
                              flexWrap: "wrap",
                              gap: "10px"
                            }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "1.1rem" }}>🏪</span>
                                  <span style={{ fontSize: "0.98rem", fontWeight: 800, color: "#0F172A" }}>
                                    {vendedor.nombre_tienda}
                                  </span>
                                  <span style={{
                                    background: "#F0FDF4",
                                    color: "#166534",
                                    fontSize: "0.7rem",
                                    fontWeight: 800,
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    border: "1px solid #BBF7D0",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Vendedor Verificado
                                  </span>
                                </div>
                                <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "#64748B" }}>
                                  Titular receptor: <strong>{vendedor.vendedor_nombre}</strong>
                                </p>
                              </div>

                              {tieneCuentaActiva && (
                                <div style={{
                                  background: "#FEF3C7",
                                  border: "1px solid #FDE68A",
                                  padding: "4px 12px",
                                  borderRadius: "20px",
                                  fontSize: "0.76rem",
                                  fontWeight: 800,
                                  color: "#92400E",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px"
                                }}>
                                  <span>🏦</span>
                                  <span>{cuenta.banco}</span>
                                </div>
                              )}
                            </div>

                            {tieneCuentaActiva ? (
                              <>
                                {/* Tarjeta Digital Bancaria Estilo Libreta */}
                                <div style={{
                                  background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                                  borderRadius: "14px",
                                  padding: "20px 22px",
                                  color: "#FFFFFF",
                                  boxShadow: "0 6px 20px -3px rgba(15, 23, 42, 0.35)",
                                  position: "relative",
                                  overflow: "hidden",
                                  marginBottom: "18px"
                                }}>
                                  {/* Marca de agua decorativa */}
                                  <div style={{
                                    position: "absolute",
                                    top: "-15px",
                                    right: "-15px",
                                    fontSize: "5.5rem",
                                    opacity: 0.05,
                                    pointerEvents: "none"
                                  }}>
                                    🏛️
                                  </div>

                                  {/* Encabezado de la tarjeta bancaria */}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <div style={{ width: 32, height: 22, borderRadius: "4px", background: "linear-gradient(135deg, #FDE047 0%, #EAB308 100%)", opacity: 0.9 }} />
                                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#94A3B8", letterSpacing: "1px", textTransform: "uppercase" }}>
                                        CUENTA DE RECAUDO
                                      </span>
                                    </div>
                                    <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#FDE047", letterSpacing: "0.5px" }}>
                                      {cuenta.banco}
                                    </span>
                                  </div>

                                  {/* Número de cuenta con botón de copiar destacado */}
                                  <div style={{ marginBottom: "16px" }}>
                                    <span style={{ fontSize: "0.72rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>
                                      Número de cuenta ({cuenta.tipo_cuenta})
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                                      <span style={{
                                        fontSize: "1.45rem",
                                        fontWeight: 900,
                                        letterSpacing: "3px",
                                        fontFamily: "'Courier New', Courier, monospace",
                                        color: "#FFFFFF"
                                      }}>
                                        {cuenta.numero_cuenta}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopiarTexto(cuenta.numero_cuenta, `cuenta_${vendedor.id_tienda}`)}
                                        style={{
                                          background: copiadoCampo === `cuenta_${vendedor.id_tienda}` ? "#16A34A" : "rgba(255, 255, 255, 0.15)",
                                          border: "1px solid rgba(255, 255, 255, 0.25)",
                                          color: "#FFFFFF",
                                          padding: "6px 14px",
                                          borderRadius: "8px",
                                          fontSize: "0.76rem",
                                          fontWeight: 800,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          transition: "all 0.15s ease"
                                        }}
                                      >
                                        {copiadoCampo === `cuenta_${vendedor.id_tienda}` ? (
                                          <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            <span>¡Copiado!</span>
                                          </>
                                        ) : (
                                          <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                            <span>Copiar número</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Fila con Titular y Documento */}
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "12px" }}>
                                    <div>
                                      <span style={{ fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase", display: "block" }}>
                                        Titular de la cuenta
                                      </span>
                                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#F8FAFC", display: "block", marginTop: "2px" }}>
                                        {cuenta.nombre_titular || vendedor.vendedor_nombre}
                                      </span>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase", display: "block" }}>
                                        Identificación / Cédula
                                      </span>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                                        <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#F8FAFC" }}>
                                          {cuenta.cedula_titular || "No registrada"}
                                        </span>
                                        {cuenta.cedula_titular && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopiarTexto(cuenta.cedula_titular, `cedula_${vendedor.id_tienda}`)}
                                            style={{
                                              background: "transparent",
                                              border: "none",
                                              color: copiadoCampo === `cedula_${vendedor.id_tienda}` ? "#4ADE80" : "#94A3B8",
                                              cursor: "pointer",
                                              fontSize: "0.72rem",
                                              padding: 0,
                                              fontWeight: 700
                                            }}
                                            title="Copiar cédula"
                                          >
                                            {copiadoCampo === `cedula_${vendedor.id_tienda}` ? "✓" : "📋"}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Grilla de Datos Clave para la Transferencia */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                                  <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                                      Monto exacto
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                                      <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--vinotinto)" }}>
                                        {formatCurrency(totalToPay)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopiarTexto(totalToPay, `monto_${vendedor.id_tienda}`)}
                                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}
                                      >
                                        {copiadoCampo === `monto_${vendedor.id_tienda}` ? "✓ Copiado" : "Copiar"}
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                                      Referencia sugerida
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1E293B", fontFamily: "monospace" }}>
                                        ORDEN #{idVisible(order)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopiarTexto(`ORDEN-${idVisible(order)}`, `ref_${vendedor.id_tienda}`)}
                                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}
                                      >
                                        {copiadoCampo === `ref_${vendedor.id_tienda}` ? "✓ Copiado" : "Copiar"}
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                                      Tipo de cuenta
                                    </span>
                                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A", display: "block", marginTop: "4px" }}>
                                      {cuenta.tipo_cuenta} ({cuenta.banco})
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* Si la tienda aún no registra cuenta en la BD */
                              <div style={{
                                background: "#FFFBEB",
                                border: "1px solid #FCD34D",
                                borderRadius: "12px",
                                padding: "16px",
                                marginBottom: "16px",
                                color: "#92400E"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "0.92rem", marginBottom: "4px" }}>
                                  <span>⚠️</span> Cuenta directa en configuración
                                </div>
                                <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.45 }}>
                                  La librería <strong>{vendedor.nombre_tienda}</strong> está actualizando sus datos de cuenta. Puedes confirmar la orden y coordinar la transferencia directa con el vendedor o transferir a la cuenta de custodia BookyHome:
                                </p>
                                <div style={{ marginTop: "10px", fontSize: "0.82rem", fontWeight: 700, color: "#78350F" }}>
                                  Bancolombia Ahorros #123-456789-01 · Titular: BookyHome S.A.S (NIT 901.456.789)
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Fallback General de Seguridad si aún no ha cargado datos */
                    <div style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #E2E8F0",
                      borderRadius: "16px",
                      padding: "22px",
                      boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.06)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                        <span style={{ fontSize: "1.2rem" }}>🏛️</span>
                        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>
                          Cuenta Oficial de Recaudo
                        </h4>
                      </div>
                      <div style={{
                        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                        borderRadius: "14px",
                        padding: "18px 20px",
                        color: "#FFFFFF",
                        marginBottom: "16px"
                      }}>
                        <span style={{ fontSize: "0.72rem", color: "#94A3B8", textTransform: "uppercase", display: "block" }}>
                          Bancolombia · Cuenta de Ahorros
                        </span>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          <span style={{ fontSize: "1.35rem", fontWeight: 900, fontFamily: "monospace", letterSpacing: "2px" }}>
                            123-456789-01
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopiarTexto("123-456789-01", "cuenta_fallback")}
                            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#FFF", padding: "5px 12px", borderRadius: "6px", fontSize: "0.74rem", cursor: "pointer" }}
                          >
                            {copiadoCampo === "cuenta_fallback" ? "¡Copiado!" : "Copiar"}
                          </button>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", marginTop: "12px", paddingTop: "10px", fontSize: "0.82rem", color: "#E2E8F0" }}>
                          Titular: <strong>BookyHome S.A.S</strong> · NIT: 901.456.789
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Guía en 3 Pasos para el Comprador */}
                  <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    padding: "16px 20px"
                  }}>
                    <p style={{ margin: "0 0 10px", fontSize: "0.84rem", fontWeight: 700, color: "#1E293B" }}>
                      ¿Cómo completar tu pago por transferencia?
                    </p>
                    <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "0.8rem", color: "#475569", lineHeight: 1.55, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li>Ingresa a la app o portal web de tu banco o billetera móvil.</li>
                      <li>Transfiere el valor exacto de <strong>{formatCurrency(totalToPay)}</strong> a la cuenta indicada arriba del vendedor.</li>
                      <li>Haz clic en <strong>Confirmar Transferencia Realizada</strong>. El vendedor validará tu comprobante y despachará tu orden.</li>
                    </ol>
                  </div>

                  {/* Insignia de Protección al Comprador */}
                  <div style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>🛡️</span>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#166534", lineHeight: 1.4, fontWeight: 500 }}>
                      <strong>Garantía BookyHome:</strong> Tu pago está vinculado a tu orden. El vendedor verificará el ingreso en su cuenta bancaria registrada para proceder con la entrega de tus libros.
                    </p>
                  </div>

                  {/* Botón de Confirmación de Pago */}
                  <button
                    type="button"
                    onClick={() => processPaymentApi("Transferencia Bancaria")}
                    disabled={paymentProcessing}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "none",
                      background: paymentProcessing ? "#9CA3AF" : "linear-gradient(135deg, #7A1E3A 0%, #902345 100%)",
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: "1.02rem",
                      cursor: paymentProcessing ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      boxShadow: "0 4px 16px rgba(122, 30, 58, 0.35)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => {
                      if (!paymentProcessing) {
                        e.currentTarget.style.filter = "brightness(1.08)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!paymentProcessing) {
                        e.currentTarget.style.filter = "brightness(1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {paymentProcessing ? (
                      <span>{metodoEntrega === 'retiro_tienda' && order?.estado_retiro !== 'habilitado_pago' ? "Confirmando reserva y transferencia..." : "Procesando confirmación..."}</span>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>
                          {metodoEntrega === 'retiro_tienda'
                            ? (order?.estado_retiro === 'habilitado_pago'
                                ? `Confirmar Pago por Transferencia (${formatCurrency(totalToPay)})`
                                : `Confirmar Reserva y Registrar Transferencia (${formatCurrency(totalToPay)})`)
                            : "Confirmar Transferencia Realizada"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
            
            <button
              type="button"
              onClick={onVolverCarrito}
              style={{
                background: "#F9FAFB",
                border: "1.5px solid #D1D5DB",
                color: "#374151",
                fontSize: "0.88rem",
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: "10px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "20px",
                transition: "all 0.15s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}
            >
              <span>←</span>
              <span>Volver al carrito</span>
            </button>
          </div>

          {/* PAYPAL SIMULATOR MODAL */}
          {showPaypalModal && (
            <div style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 1100,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "16px"
            }}>
              <div style={{
                background: "#FFFFFF",
                maxWidth: "460px",
                width: "100%",
                borderRadius: "20px",
                boxShadow: "0 25px 50px -12px rgba(0, 48, 135, 0.25), 0 0 0 1px rgba(0,0,0,0.06)",
                overflow: "hidden",
                animation: "fadeIn 0.2s ease-out"
              }}>
                {/* Cabecera Modal PayPal */}
                <div style={{
                  padding: "20px 24px 16px",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#FFFFFF"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontStyle: "italic", fontWeight: 900, fontSize: "1.5rem", letterSpacing: "-0.5px" }}>
                      <span style={{ color: "#003087" }}>Pay</span><span style={{ color: "#0079C1" }}>Pal</span>
                    </span>
                    <span style={{
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #BFDBFE",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Sandbox
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPaypalModal(false)}
                    style={{
                      background: "#F8FAFC",
                      border: "none",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      fontWeight: 700,
                      color: "#64748B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F1F5F9";
                      e.currentTarget.style.color = "#0F172A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F8FAFC";
                      e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ padding: "22px 24px" }}>
                  {/* Resumen del Pago */}
                  <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    marginBottom: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", fontWeight: 600 }}>Pagar a</span>
                      <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1E293B" }}>BookyHome Libros</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block", fontWeight: 600 }}>Importe total</span>
                      <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#003087" }}>{formatCurrency(totalToPay)}</span>
                    </div>
                  </div>

                  {/* Banner de ayuda Sandbox con botón de autocompletado */}
                  <div style={{
                    background: "#EFF6FF",
                    border: "1px solid #DBEAFE",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    marginBottom: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap"
                  }}>
                    <span style={{ fontSize: "0.76rem", color: "#1E40AF", lineHeight: 1.3 }}>
                      🧪 <strong>Simulador Sandbox:</strong> Usa credenciales de prueba para autorizar el débito.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPaypalEmail("comprador.sandbox@bookyhome.com");
                        setPaypalPassword("SandboxPass123*");
                        if (paypalError) setPaypalError("");
                      }}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #93C5FD",
                        color: "#1D4ED8",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F0F7FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#FFFFFF"}
                    >
                      ⚡ Llenar datos de prueba
                    </button>
                  </div>

                  {paypalError && (
                    <div style={{
                      background: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      color: "#991B1B",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span>⚠️</span>
                      <span>{paypalError}</span>
                    </div>
                  )}

                  <form onSubmit={handlePaypalSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                        <span>✉️</span>
                        <span>Correo electrónico de PayPal</span>
                      </label>
                      <input
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => {
                          setPaypalEmail(e.target.value);
                          if (paypalError) setPaypalError("");
                        }}
                        placeholder="tu-cuenta@ejemplo.com"
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: "10px",
                          border: "1.5px solid #CBD5E1",
                          fontSize: "0.9rem",
                          outline: "none",
                          boxSizing: "border-box",
                          transition: "border-color 0.2s ease"
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#0070BA";
                          e.target.style.boxShadow = "0 0 0 3px rgba(0, 112, 186, 0.12)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#CBD5E1";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                        <span>🔒</span>
                        <span>Contraseña Sandbox</span>
                      </label>
                      <input
                        type="password"
                        value={paypalPassword}
                        onChange={(e) => {
                          setPaypalPassword(e.target.value);
                          if (paypalError) setPaypalError("");
                        }}
                        placeholder="••••••••••••"
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: "10px",
                          border: "1.5px solid #CBD5E1",
                          fontSize: "0.9rem",
                          outline: "none",
                          boxSizing: "border-box",
                          transition: "border-color 0.2s ease"
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#0070BA";
                          e.target.style.boxShadow = "0 0 0 3px rgba(0, 112, 186, 0.12)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#CBD5E1";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                      <button
                        type="submit"
                        disabled={paypalProcessing}
                        style={{
                          width: "100%",
                          padding: "13px 20px",
                          background: paypalProcessing ? "#94A3B8" : "linear-gradient(135deg, #0070BA 0%, #003087 100%)",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "28px",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          cursor: paypalProcessing ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: paypalProcessing ? "none" : "0 4px 14px rgba(0, 112, 186, 0.35)",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          if (!paypalProcessing) {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 112, 186, 0.45)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!paypalProcessing) {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 14px rgba(0, 112, 186, 0.35)";
                          }
                        }}
                      >
                        {paypalProcessing ? (
                          <>
                            <span style={{
                              width: 16,
                              height: 16,
                              border: "2px solid #FFFFFF",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              display: "inline-block",
                              animation: "spin 0.8s linear infinite"
                            }}></span>
                            <span>Procesando pago en PayPal...</span>
                          </>
                        ) : (
                          <>
                            <span>Autorizar pago de {formatCurrency(totalToPay)}</span>
                            <span>➔</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPaypalModal(false)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#64748B",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "6px",
                          textAlign: "center",
                          transition: "color 0.15s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#0F172A"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#64748B"}
                      >
                        Cancelar y regresar al carrito
                      </button>
                    </div>
                  </form>

                  {/* Microcopy de Seguridad */}
                  <div style={{
                    marginTop: "16px",
                    paddingTop: "14px",
                    borderTop: "1px solid #F1F5F9",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}>
                    <span style={{ fontSize: "0.75rem" }}>🛡️</span>
                    <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                      Tus transacciones están respaldadas por la Protección al Comprador de PayPal.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PSE SIMULATOR MODAL */}
          {showPseModal && (() => {
            const bancoActualObj = bancosPSE.find(b => b.codigo === pseBanco) || bancosPSE[0];
            const bankThemes = {
              "001": { name: "Bancolombia", bg: "#000000", accent: "#FDDA24", textColor: "#FFFFFF", header: "Sucursal Virtual Personas · Bancolombia", icon: "🟡" },
              "005": { name: "Davivienda", bg: "#ED1C24", accent: "#FFFFFF", textColor: "#FFFFFF", header: "Portal Transaccional Davivienda", icon: "🔴" },
              "007": { name: "Nequi", bg: "#200020", accent: "#DA0081", textColor: "#FFFFFF", header: "Nequi Colombia · Pasarela PSE", icon: "🟣" },
              "002": { name: "Banco de Bogotá", bg: "#002A54", accent: "#0072CE", textColor: "#FFFFFF", header: "Portal Virtual Banco de Bogotá", icon: "🔵" },
              "004": { name: "BBVA Colombia", bg: "#0B2265", accent: "#00A9E0", textColor: "#FFFFFF", header: "BBVA Net Móvil · Pagos PSE", icon: "🔷" }
            };
            const currentTheme = bankThemes[pseBanco] || { name: bancoActualObj.nombre, bg: "#0F172A", accent: "#2563EB", textColor: "#FFFFFF", header: `Banca Virtual · ${bancoActualObj.nombre}`, icon: "🏦" };

            return (
              <div style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.72)",
                backdropFilter: "blur(6px)",
                zIndex: 1100,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "16px"
              }}>
                <div style={{
                  background: "#FFFFFF",
                  maxWidth: "500px",
                  width: "100%",
                  borderRadius: "20px",
                  boxShadow: "0 25px 60px -12px rgba(15, 38, 92, 0.35), 0 0 0 1px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  animation: "fadeIn 0.2s ease-out"
                }}>
                  {/* Cabecera PSE Oficial ACH Colombia */}
                  <div style={{
                    padding: "18px 24px",
                    background: "linear-gradient(135deg, #0B1E48 0%, #1A3E8A 100%)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#FFFFFF",
                    borderBottom: "2px solid #F59E0B"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {/* Logo Emblema PSE */}
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                        border: "2px solid #F59E0B",
                        flexShrink: 0
                      }}>
                        <span style={{ fontWeight: 900, color: "#0B1E48", fontSize: "0.85rem", letterSpacing: "1px", lineHeight: 1 }}>PSE</span>
                        <span style={{ fontSize: "0.42rem", color: "#2563EB", fontWeight: 800 }}>PAGOS</span>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF" }}>
                            ACH Colombia · PSE
                          </h4>
                          <span style={{
                            background: "rgba(245, 158, 11, 0.25)",
                            color: "#FDE68A",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "4px",
                            border: "1px solid #F59E0B"
                          }}>
                            SIMULADOR OFICIAL
                          </span>
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: "0.74rem", color: "#CBD5E1" }}>
                          Pagos Seguros en Línea · Débito Bancario
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => !pseProcessing && setShowPseModal(false)}
                      disabled={pseProcessing}
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "none",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        fontSize: "1.2rem",
                        cursor: pseProcessing ? "not-allowed" : "pointer",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => { if (!pseProcessing) e.currentTarget.style.background = "rgba(255,255,255,0.28)"; }}
                      onMouseLeave={(e) => { if (!pseProcessing) e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                    >
                      &times;
                    </button>
                  </div>

                  {/* Resumen de la Orden a pagar */}
                  <div style={{
                    padding: "16px 24px 14px",
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                        Comercio Recaudador
                      </span>
                      <strong style={{ fontSize: "0.92rem", color: "#0F172A" }}>BookyHome Libros S.A.S.</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>NIT 901.456.789 · Ref #{idVisible(order) || orderId}</span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                        Total a debitar
                      </span>
                      <strong style={{ fontSize: "1.25rem", color: "var(--vinotinto)", fontWeight: 900 }}>
                        {formatCurrency(totalToPay)}
                      </strong>
                    </div>
                  </div>

                  {/* Indicador de pasos 1 y 2 */}
                  <div style={{
                    display: "flex",
                    borderBottom: "1px solid #E2E8F0",
                    background: "#FFFFFF"
                  }}>
                    <div style={{
                      flex: 1,
                      padding: "10px 16px",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      borderBottom: pseModalStep === 1 ? "2.5px solid #1A3E8A" : "none",
                      color: pseModalStep === 1 ? "#1A3E8A" : "#94A3B8",
                      background: pseModalStep === 1 ? "#EFF6FF" : "#FFFFFF"
                    }}>
                      1. Identificación PSE
                    </div>
                    <div style={{
                      flex: 1,
                      padding: "10px 16px",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      borderBottom: pseModalStep === 2 ? "2.5px solid #1A3E8A" : "none",
                      color: pseModalStep === 2 ? "#1A3E8A" : "#94A3B8",
                      background: pseModalStep === 2 ? "#EFF6FF" : "#FFFFFF"
                    }}>
                      2. Banca Virtual ({bancoActualObj.nombre})
                    </div>
                  </div>

                  {/* Contenido según el paso */}
                  <div style={{ padding: "20px 24px" }}>
                    {pseError && (
                      <div style={{
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        marginBottom: "16px",
                        color: "#991B1B",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span>⚠️</span>
                        <span>{pseError}</span>
                      </div>
                    )}

                    {pseModalStep === 1 && (
                      <form onSubmit={handlePseModalNext} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Selector Tipo de Cliente */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Tipo de Cliente
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {[
                              { id: "natural", label: "👤 Persona Natural" },
                              { id: "juridica", label: "🏢 Persona Jurídica" }
                            ].map((tipo) => (
                              <button
                                key={tipo.id}
                                type="button"
                                onClick={() => setPseTipoCliente(tipo.id)}
                                style={{
                                  padding: "9px",
                                  borderRadius: "8px",
                                  border: `1.5px solid ${pseTipoCliente === tipo.id ? '#1A3E8A' : '#CBD5E1'}`,
                                  background: pseTipoCliente === tipo.id ? '#EFF6FF' : '#FFFFFF',
                                  color: pseTipoCliente === tipo.id ? '#1A3E8A' : '#475569',
                                  fontWeight: pseTipoCliente === tipo.id ? 800 : 600,
                                  fontSize: "0.84rem",
                                  cursor: "pointer"
                                }}
                              >
                                {tipo.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Banco Seleccionado */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Entidad Financiera (Banco)
                          </label>
                          <select
                            value={pseBanco}
                            onChange={(e) => setPseBanco(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "10px",
                              border: "1.5px solid #CBD5E1",
                              fontSize: "0.88rem",
                              fontWeight: 600,
                              background: "#FFFFFF",
                              color: "#0F172A",
                              outline: "none"
                            }}
                          >
                            {bancosPSE.map((b) => (
                              <option key={b.codigo} value={b.codigo}>{b.nombre}</option>
                            ))}
                          </select>
                        </div>

                        {/* Correo Electrónico Registrado en PSE */}
                        <div>
                          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            <span>Correo electrónico registrado en PSE</span>
                            <span style={{ fontSize: "0.72rem", color: "#2563EB", fontWeight: 600 }}>Usuario PSE</span>
                          </label>
                          <input
                            type="email"
                            value={pseEmail}
                            onChange={(e) => setPseEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: "10px",
                              border: "1.5px solid #CBD5E1",
                              fontSize: "0.9rem",
                              outline: "none",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        {/* Documento de Identidad */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Número de Documento / C.C.
                          </label>
                          <input
                            type="text"
                            value={pseDocNumero}
                            onChange={(e) => setPseDocNumero(e.target.value)}
                            placeholder="1020304050"
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: "10px",
                              border: "1.5px solid #CBD5E1",
                              fontSize: "0.9rem",
                              outline: "none",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        {/* Botón rápido para demo */}
                        <div style={{
                          background: "#F0F9FF",
                          border: "1px dashed #7DD3FC",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span style={{ fontSize: "0.75rem", color: "#0369A1", fontWeight: 600 }}>
                            ¿Simulación con datos de prueba?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPseEmail("comprador.demo@pse.com.co");
                              setPseDocNumero("1098765432");
                              notify("Datos demo autocompletados", "info");
                            }}
                            style={{
                              background: "#0284C7",
                              color: "#FFFFFF",
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            ⚡ Autocompletar
                          </button>
                        </div>

                        {/* Botón Siguiente */}
                        <button
                          type="submit"
                          style={{
                            marginTop: "8px",
                            padding: "14px",
                            borderRadius: "12px",
                            border: "none",
                            background: "linear-gradient(135deg, #0B1E48 0%, #1A3E8A 100%)",
                            color: "#FFFFFF",
                            fontWeight: 800,
                            fontSize: "0.98rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 4px 14px rgba(11, 30, 72, 0.3)"
                          }}
                        >
                          <span>Ir a la Banca Virtual ({bancoActualObj.nombre})</span>
                          <span>➔</span>
                        </button>
                      </form>
                    )}

                    {pseModalStep === 2 && (
                      <form onSubmit={handlePseModalSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Cabecera del Banco Virtual */}
                        <div style={{
                          background: currentTheme.bg,
                          color: currentTheme.textColor,
                          borderRadius: "14px",
                          padding: "16px 18px",
                          border: `1.5px solid ${currentTheme.accent}`,
                          boxShadow: "0 4px 14px rgba(0,0,0,0.12)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "1.3rem" }}>{currentTheme.icon}</span>
                            <div>
                              <h5 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: currentTheme.textColor }}>
                                {currentTheme.header}
                              </h5>
                              <span style={{ fontSize: "0.72rem", color: currentTheme.accent, fontWeight: 700 }}>
                                Transacción de Débito Autorizada vía ACH
                              </span>
                            </div>
                          </div>
                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                            <span style={{ opacity: 0.85 }}>Usuario autenticado:</span>
                            <strong>{pseEmail}</strong>
                          </div>
                        </div>

                        {/* Detalle de cuenta a debitar */}
                        <div style={{
                          background: "#F8FAFC",
                          border: "1.5px solid #E2E8F0",
                          borderRadius: "12px",
                          padding: "14px 16px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.82rem" }}>
                            <span style={{ color: "#64748B" }}>Cuenta origen:</span>
                            <span style={{ fontWeight: 700, color: "#0F172A" }}>Cuenta de Ahorros **** 4821</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.82rem" }}>
                            <span style={{ color: "#64748B" }}>Valor a debitar:</span>
                            <span style={{ fontWeight: 900, color: "var(--vinotinto)", fontSize: "0.95rem" }}>{formatCurrency(totalToPay)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                            <span style={{ color: "#64748B" }}>Costo de transacción:</span>
                            <span style={{ fontWeight: 700, color: "#16A34A" }}>$0 (Gratuito)</span>
                          </div>
                        </div>

                        {/* Clave dinámica simulada */}
                        <div>
                          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            <span>Clave Dinámica / Token Virtual de Seguridad</span>
                            <span style={{ background: "#DCFCE7", color: "#15803D", padding: "1px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                              Generado en App móvil
                            </span>
                          </label>
                          <input
                            type="text"
                            value={pseOtp}
                            onChange={(e) => setPseOtp(e.target.value)}
                            placeholder="6 dígitos"
                            maxLength={6}
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              borderRadius: "10px",
                              border: "1.5px solid #CBD5E1",
                              fontSize: "1.1rem",
                              fontWeight: 800,
                              letterSpacing: "4px",
                              textAlign: "center",
                              outline: "none",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        {/* Botón de Aprobación Final */}
                        <button
                          type="submit"
                          disabled={pseProcessing}
                          style={{
                            marginTop: "6px",
                            padding: "15px",
                            borderRadius: "12px",
                            border: "none",
                            background: pseProcessing
                              ? "#94A3B8"
                              : "linear-gradient(135deg, #15803D 0%, #166534 100%)",
                            color: "#FFFFFF",
                            fontWeight: 800,
                            fontSize: "1rem",
                            cursor: pseProcessing ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            boxShadow: pseProcessing ? "none" : "0 4px 16px rgba(22, 101, 52, 0.35)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          {pseProcessing ? (
                            <>
                              <span style={{
                                width: 18,
                                height: 18,
                                border: "2px solid #FFFFFF",
                                borderTopColor: "transparent",
                                borderRadius: "50%",
                                display: "inline-block",
                                animation: "spin 0.8s linear infinite"
                              }}></span>
                              <span>Validando débito con ACH Colombia...</span>
                            </>
                          ) : (
                            <>
                              <span>✅</span>
                              <span>Aprobar Débito Bancario ({formatCurrency(totalToPay)})</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={pseProcessing}
                          onClick={() => setPseModalStep(1)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748B",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "4px",
                            textAlign: "center"
                          }}
                        >
                          ← Modificar datos o cambiar de banco
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          </div>{/* Fin columna izquierda Paso 2 */}
          
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
              <span style={{ fontWeight: 600 }}>{formatCurrency(subtotalOrden || baseTotal)}</span>
            </div>

            {/* Costo de envío */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#666" }}>Envío {metodoEntrega === 'retiro_tienda' ? '(Retiro en tienda)' : '(Domicilio)'}</span>
              {costoEnvioOrden > 0 ? (
                <span style={{ fontWeight: 600 }}>{formatCurrency(costoEnvioOrden)}</span>
              ) : (
                <span style={{ fontWeight: 700, color: "#059669" }}>Gratis</span>
              )}
            </div>

            {/* IVA: libros exentos por ley colombiana Art. 424 E.T. */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#666" }}>
                IVA
                <span style={{ marginLeft: 6, fontSize: "0.74rem", color: "#9CA3AF", fontWeight: 400 }}>Art. 424 E.T.</span>
              </span>
              <span style={{ fontWeight: 700, color: "#059669" }}>$0 — Exento</span>
            </div>

            <div style={{ height: 1, background: "#E5E7EB", margin: "12px 0" }} />

            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "green" }}>
                <span>Descuento cupón</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Mostrar únicamente la orden pendiente más reciente para no saturar la vista */}
          {ordenes.filter(esOrdenPendiente).slice(0, 1).map((orden) => (
            <div key={orden.id_orden}>
              {/* Banner orden pendiente compacto y elegante */}
              <div style={{
                background: "linear-gradient(135deg, #FFFDF8 0%, #FEF9EE 50%, #FEF3C7 100%)",
                borderRadius: "16px",
                border: "1.5px solid #FDE68A",
                borderLeft: "5px solid #F59E0B",
                padding: "16px 22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                boxShadow: "0 4px 16px -2px rgba(245, 158, 11, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.03)"
              }}>
                {/* Lado izquierdo: Ícono + detalles */}
                <div style={{ display: "flex", gap: "14px", alignItems: "center", minWidth: "260px", flex: "1 1 auto" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
                    background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1.5px solid #FCD34D",
                    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)"
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, color: "#78350F", fontSize: "0.98rem" }}>
                        Tienes una orden pendiente de pago
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{
                        background: "#FFFFFF", border: "1px solid #FCD34D", color: "#B45309",
                        fontSize: "0.76rem", fontWeight: 800, padding: "2px 10px", borderRadius: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                      }}>
                        Orden #{idVisible(orden)}
                      </span>
                      <span style={{
                        background: "linear-gradient(135deg, #7A1E3A 0%, #5E1629 100%)", color: "#FFFFFF",
                        fontSize: "0.80rem", fontWeight: 800, padding: "2px 10px", borderRadius: "12px",
                        boxShadow: "0 2px 6px rgba(122, 30, 58, 0.25)"
                      }}>
                        {formatCurrency(orden.total)}
                      </span>
                      <span style={{ color: "#78716C", fontSize: "0.78rem", fontWeight: 600 }}>
                        • {orden.items?.length || 0} producto(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado derecho: Acciones en fila uniforme */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexShrink: 0,
                  flexWrap: "nowrap"
                }}>
                  {/* Ver detalles */}
                  <button
                    onClick={() => setOrdenDetalleModal(orden)}
                    style={{
                      height: "38px", padding: "0 16px", fontSize: "0.84rem", fontWeight: 700,
                      borderRadius: "10px", cursor: "pointer", whiteSpace: "nowrap",
                      background: "#FFFFFF", border: "1.5px solid #FCD34D", color: "#B45309",
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      transition: "all 0.15s ease", boxSizing: "border-box",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FEF3C7";
                      e.currentTarget.style.borderColor = "#F59E0B";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.borderColor = "#FCD34D";
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    Ver detalles
                  </button>

                  {/* Continuar al Pago (Sólido Vinotinto) */}
                  <button
                    onClick={() => {
                      setOrderId(idVisible(orden));
                      setOrder(orden);
                      if (orden.metodo_pago) {
                        setPaymentMethod(mapMetodoPagoToId(orden.metodo_pago));
                      }
                      if (orden.tipo_entrega) {
                        setMetodoEntrega(orden.tipo_entrega);
                      }
                      setMostrarCheckout(true);
                    }}
                    style={{
                      height: "38px", padding: "0 18px", fontSize: "0.84rem", fontWeight: 800,
                      borderRadius: "10px", cursor: "pointer", whiteSpace: "nowrap",
                      background: "linear-gradient(135deg, #7A1E3A 0%, #902345 100%)",
                      color: "#FFFFFF", border: "none",
                      display: "inline-flex", alignItems: "center", gap: "7px",
                      boxShadow: "0 3px 12px rgba(122, 30, 58, 0.3)", boxSizing: "border-box",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = "brightness(1.1)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = "brightness(1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Continuar al Pago
                  </button>

                  {/* Cancelar (Outline Rojo) */}
                  <button
                    onClick={() => onSetOrdenACancelar(orden)}
                    style={{
                      height: "38px", padding: "0 14px", fontSize: "0.84rem", fontWeight: 700,
                      borderRadius: "10px", cursor: "pointer", whiteSpace: "nowrap",
                      background: "#FFFFFF", border: "1.5px solid #FECACA", color: "#DC2626",
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      transition: "all 0.15s ease", boxSizing: "border-box",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FEF2F2";
                      e.currentTarget.style.borderColor = "#F87171";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.borderColor = "#FECACA";
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Grilla Principal del Carrito: 2 Columnas */}
          {carrito.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.65fr) minmax(340px, 1fr)",
              gap: "24px",
              alignItems: "stretch",
              flex: 1
            }}>
              {/* COLUMNA IZQUIERDA: Libros y Garantías */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
                
                {/* 1. Tarjeta Lista de Libros */}
                <div className="pl-card" style={{
                  padding: "24px",
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 20px -2px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1.5px solid #F3F4F6", paddingBottom: "14px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>📚</span> Libros en tu Carrito
                      </h3>
                      <p style={{ margin: "3px 0 0", color: "#6B7280", fontSize: "0.82rem" }}>
                        Verifica tus ejemplares antes de continuar
                      </p>
                    </div>
                    <button
                      onClick={onGoToCatalog}
                      style={{
                        background: "#FDF2F4",
                        border: "1px solid #FBCFE8",
                        color: "var(--vinotinto)",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span>+</span> Agregar más libros
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                    {carrito.map((item) => {
                      const imgUrl = getCartImageUrl(item);
                      const isDeleting = eliminandoId === item.id_libro;
                      return (
                        <div
                          key={item.id_libro}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "84px 1fr auto",
                            gap: "20px",
                            alignItems: "center",
                            padding: "18px 20px",
                            background: "#FAFAF9",
                            borderRadius: "14px",
                            border: "1px solid #E5E7EB",
                            transition: "all 0.2s ease"
                          }}
                        >
                          {/* Portada miniatura con fallback elegante */}
                          <BookCoverThumbnail imgUrl={imgUrl} titulo={item.titulo} autor={item.autor_libro} />

                          {/* Info libro */}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                              <span style={{
                                background: "#DCFCE7",
                                color: "#15803D",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <span>🟢</span> En stock · Entrega disponible
                              </span>
                            </div>
                            <h4 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", fontWeight: 800, color: "#111827", overflowWrap: "anywhere", lineHeight: 1.3 }}>
                              {item.titulo}
                            </h4>
                            <p style={{ margin: "0 0 10px 0", fontSize: "0.86rem", color: "#6B7280", fontWeight: 600 }}>
                              {item.autor_libro ? `✍️ ${item.autor_libro}` : "Segunda mano / Editorial"}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: 700, background: "#FFFFFF", color: "#374151", padding: "4px 10px", borderRadius: "6px", border: "1px solid #D1D5DB" }}>
                                Cantidad: <strong>{item.cantidad}</strong>
                              </span>
                              <span style={{ fontSize: "0.84rem", color: "#6B7280" }}>
                                Unitario: <strong>{formatCurrency(item.precio_libro)}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Precio y Acción Eliminar */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                            <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--vinotinto)", whiteSpace: "nowrap" }}>
                              {formatCurrency(item.precio_libro * item.cantidad)}
                            </span>
                            <button
                              onClick={() => handleEliminarItem(item.id_libro)}
                              disabled={isDeleting}
                              style={{
                                background: "#FFFFFF",
                                border: "1.5px solid #FCA5A5",
                                color: "#DC2626",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                cursor: isDeleting ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.15s"
                              }}
                              title="Eliminar del carrito"
                            >
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              {isDeleting ? "..." : "Quitar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Tarjeta Beneficios y Garantías BookyHome (equilibrio visual y confianza) */}
                <div className="pl-card" style={{
                  padding: "20px 24px",
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
                  marginTop: "auto"
                }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: "0.98rem", fontWeight: 800, color: "#1F2937", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🛡️</span> Beneficios y Garantía de tu Compra
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#F9FAFB", padding: "14px", borderRadius: "10px", border: "1px solid #F3F4F6" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        🚚
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.86rem", color: "#111827" }}>Envío o Retiro</p>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.35 }}>A domicilio por transportadora o gratis en el punto del vendedor.</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#F9FAFB", padding: "14px", borderRadius: "10px", border: "1px solid #F3F4F6" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "8px", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        🔒
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.86rem", color: "#111827" }}>Pago 100% Seguro</p>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.35 }}>Cifrado SSL de 256 bits con Tarjetas, PSE, Nequi o Efecty.</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#F9FAFB", padding: "14px", borderRadius: "10px", border: "1px solid #F3F4F6" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "8px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        ✨
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.86rem", color: "#111827" }}>Compra Protegida</p>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.35 }}>Garantía directa de entrega y mediación ante inconvenientes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>{/* Fin columna izquierda Paso 1 */}


              {/* COLUMNA DERECHA: Resumen de Pedido y Checkout */}
              <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div className="pl-card" style={{
                  padding: "26px",
                  borderRadius: "16px",
                  background: "#FFFFFF",
                  border: "1.5px solid #E5E7EB",
                  boxShadow: "0 4px 20px -2px rgba(0,0,0,0.06)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxSizing: "border-box"
                }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: 800, color: "#111827", borderBottom: "1.5px solid #F3F4F6", paddingBottom: "14px" }}>
                    Resumen del Pedido
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", fontSize: "0.92rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#4B5563" }}>
                      <span>Subtotal ({carrito.length} {carrito.length === 1 ? 'libro' : 'libros'})</span>
                      <span style={{ fontWeight: 700, color: "#111827" }}>{formatCurrency(totalCarrito)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#4B5563", alignItems: "center" }}>
                      <span>Envío</span>
                      {costoEnvioCarrito === 0 ? (
                        <span style={{ fontWeight: 700, color: "#059669", fontSize: "0.78rem", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px" }}>
                          🏪 Gratis (Retiro)
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700, color: "#6B7280", fontSize: "0.78rem", background: "#F3F4F6", padding: "2px 8px", borderRadius: "6px" }}>
                          Se calcula al confirmar
                        </span>
                      )}
                    </div>
                    {/* IVA: libros exentos por Estatuto Tributario Art. 424 */}
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#9CA3AF", fontSize: "0.82rem" }}>
                      <span>IVA</span>
                      <span style={{ fontWeight: 600, color: "#059669" }}>$0 — Libros exentos</span>
                    </div>
                  </div>

                  {/* Total destacado */}
                  <div style={{
                    background: "linear-gradient(135deg, #FDF2F4 0%, #FCE7EB 100%)",
                    border: "1.5px solid #FBCFE8",
                    borderRadius: "12px",
                    padding: "16px 18px",
                    marginBottom: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "2px" }}>Total estimado</span>
                      <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 600 }}>IVA $0 · Libros exentos (Art. 424 E.T.)</span>
                    </div>
                    <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--vinotinto)", lineHeight: 1 }}>
                      {formatCurrency(totalCarrito)}
                    </span>
                  </div>

                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "12px 14px", marginBottom: "18px", fontSize: "0.82rem", color: "#166534", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>💡</span>
                    <span style={{ lineHeight: 1.4 }}>En el siguiente paso podrás elegir entre <strong>Envío a domicilio</strong> o <strong>Retiro en Tienda gratis</strong> y tu medio de pago.</span>
                  </div>

                  {checkoutError && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "10px", color: "#DC2626", fontSize: "0.84rem", fontWeight: 600, marginBottom: "14px" }}>
                      ⚠️ {checkoutError}
                    </div>
                  )}

                  <button
                    className="btn btn-vinotinto"
                    onClick={onCheckout}
                    disabled={checkoutLoading}
                    style={{
                      width: "100%",
                      padding: "15px",
                      fontSize: "1rem",
                      fontWeight: 800,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      cursor: checkoutLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(122,30,58,0.28)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>{checkoutLoading ? "Procesando..." : "Continuar con el pago"}</span>
                    {!checkoutLoading && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={onGoToCatalog}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      background: "#F9FAFB",
                      border: "1.5px solid #E5E7EB",
                      color: "#374151",
                      borderRadius: "12px",
                      padding: "11px",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <span>📖</span> Seguir comprando
                  </button>

                  {/* Métodos de pago aceptados — alineados al fondo */}
                  <div style={{ marginTop: "auto", paddingTop: "18px", borderTop: "1px solid #F3F4F6" }}>
                    <p style={{ margin: "0 0 10px", fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>
                      Métodos aceptados
                    </p>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                      {[
                        { label: "Tarjeta", icon: "💳" },
                        { label: "PSE", icon: "🏦" },
                        { label: "Nequi", icon: "📱" },
                        { label: "Efecty", icon: "🏪" },
                      ].map(m => (
                        <span key={m.label} style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          background: "#F9FAFB", border: "1px solid #E5E7EB",
                          borderRadius: "8px", padding: "4px 10px",
                          fontSize: "0.73rem", fontWeight: 700, color: "#374151"
                        }}>
                          {m.icon} {m.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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
              ¿Estás seguro de que deseas cancelar la <strong>Orden #{idVisible(ordenACancelar)}</strong>?
            </p>
            <p style={{ margin: "0 0 24px", color: "#888", fontSize: "0.85rem" }}>
              Esta acción anulará la orden pendiente de pago.
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
      {/* MODAL DETALLES ORDEN PENDIENTE */}
      {ordenDetalleModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detalles de orden pendiente"
          className="modal-overlay open"
          onClick={(e) => { if (e.target === e.currentTarget) setOrdenDetalleModal(null); }}
          style={{ zIndex: 1100 }}
        >
          <div
            style={{
              width: "min(560px, 94vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: "18px",
              background: "#FFFFFF",
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              position: "relative",
              animation: "slideUp 0.22s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1.5px solid #F3F4F6",
              display: "flex", alignItems: "center", gap: "12px"
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
                background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid #FCD34D"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                  Orden #{idVisible(ordenDetalleModal)}
                </h3>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#9CA3AF", fontWeight: 500 }}>
                  Pendiente de pago · {ordenDetalleModal.items?.length || 0} producto(s)
                </p>
              </div>
              <span style={{
                background: "var(--vinotinto)", color: "#FFF",
                fontSize: "0.82rem", fontWeight: 800, padding: "4px 12px",
                borderRadius: "20px", whiteSpace: "nowrap"
              }}>
                {formatCurrency(ordenDetalleModal.total)}
              </span>
              <button
                onClick={() => setOrdenDetalleModal(null)}
                style={{
                  background: "#F3F4F6", border: "none", borderRadius: "8px",
                  width: 32, height: 32, cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#6B7280", fontSize: "1.1rem", fontWeight: 800,
                  marginLeft: "4px"
                }}
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>

            {/* Lista de ítems con portada */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {(ordenDetalleModal.items || []).map((item) => (
                <div
                  key={item.id_libro}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "78px 1fr auto",
                    gap: "16px",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "#FAFAF9",
                    borderRadius: "12px",
                    border: "1px solid #F3F4F6"
                  }}
                >
                  <BookCoverThumbnail
                    imgUrl={getCartImageUrl(item)}
                    titulo={item.titulo}
                    autor={item.autor_libro}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#111827", fontSize: "0.95rem", overflowWrap: "anywhere", lineHeight: 1.3 }}>
                      {item.titulo}
                    </p>
                    <p style={{ margin: "0 0 8px", color: "#9CA3AF", fontSize: "0.82rem" }}>
                      {item.autor_libro || "Segunda mano"}
                    </p>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      background: "#F3F4F6", color: "#6B7280",
                      fontSize: "0.74rem", fontWeight: 700,
                      padding: "3px 9px", borderRadius: "6px"
                    }}>
                      Cant: {item.cantidad}
                    </span>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.76rem", color: "#9CA3AF", display: "block", marginBottom: "2px" }}>
                      c/u {formatCurrency(item.precio_libro)}
                    </span>
                    <span style={{ fontWeight: 900, color: "var(--vinotinto)", fontSize: "1.02rem", whiteSpace: "nowrap" }}>
                      {formatCurrency(item.precio_libro * item.cantidad)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer del modal */}
            <div style={{
              padding: "16px 24px 22px",
              borderTop: "1px solid #F3F4F6",
              display: "flex", gap: "10px", justifyContent: "flex-end"
            }}>
              <button
                onClick={() => setOrdenDetalleModal(null)}
                style={{
                  height: "38px", padding: "0 18px", fontSize: "0.88rem", fontWeight: 700,
                  borderRadius: "10px", cursor: "pointer",
                  background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#374151",
                  display: "inline-flex", alignItems: "center", boxSizing: "border-box"
                }}
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setOrderId(idVisible(ordenDetalleModal));
                  setOrder(ordenDetalleModal);
                  if (ordenDetalleModal.metodo_pago) {
                    setPaymentMethod(mapMetodoPagoToId(ordenDetalleModal.metodo_pago));
                  }
                  if (ordenDetalleModal.tipo_entrega) {
                    setMetodoEntrega(ordenDetalleModal.tipo_entrega);
                  }
                  setOrdenDetalleModal(null);
                  setMostrarCheckout(true);
                }}
                style={{
                  height: "38px", padding: "0 18px", fontSize: "0.88rem", fontWeight: 800,
                  borderRadius: "10px", cursor: "pointer",
                  background: "linear-gradient(135deg, #7A1E3A 0%, #902345 100%)",
                  color: "#FFFFFF", border: "none",
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  boxShadow: "0 3px 10px rgba(122,30,58,0.25)", boxSizing: "border-box"
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Continuar al Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

