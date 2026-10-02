import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Linking } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  actualizarCostoEnvio, aplicarCupon, getDatosTransferenciaVendedor, getDirecciones,
  getOrderDetails, getApiBaseUrl, notificarLlegadaTienda, processPayment,
  reservarRetiroEnTienda, sendConfirmationEmail, validarCupon,
} from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

function PaymentMethodHeader({ icon, title, description, totalLabel, total, palette }) {
  return (
    <View style={[styles.methodHeader, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <View style={styles.methodHeaderMain}>
        <View style={[styles.methodHeaderIcon, { backgroundColor: palette.iconBackground }]}>
          {icon === 'PSE' ? <View style={styles.pseHeaderMark}><Text style={styles.pseHeaderMarkTitle}>PSE</Text><Text style={styles.pseHeaderMarkSubtitle}>EN LÍNEA</Text></View> : <Text style={styles.methodHeaderEmoji}>{icon}</Text>}
        </View>
        <View style={styles.methodHeaderCopy}>
          <Text style={[styles.methodHeaderTitle, { color: palette.title }]}>{title}</Text>
          <Text style={[styles.methodHeaderDescription, { color: palette.description }]}>{description}</Text>
        </View>
      </View>
      <View style={[styles.methodTotal, { borderColor: palette.border }]}>
        <Text style={[styles.methodTotalLabel, { color: palette.description }]}>{totalLabel}</Text>
        <Text style={styles.methodTotalValue}>{total}</Text>
      </View>
    </View>
  );
}

function PaymentBenefit({ icon, title, description, tint = '#F8FAFC' }) {
  return (
    <View style={styles.methodBenefit}>
      <View style={[styles.methodBenefitIcon, { backgroundColor: tint }]}><Text style={styles.methodBenefitEmoji}>{icon}</Text></View>
      <View style={styles.methodBenefitCopy}>
        <Text style={styles.methodBenefitTitle}>{title}</Text>
        <Text style={styles.methodBenefitDescription}>{description}</Text>
      </View>
    </View>
  );
}

function PaymentSteps({ title, steps, accent = '#475569' }) {
  return (
    <View style={styles.methodInstructions}>
      <Text style={[styles.methodInstructionsTitle, { color: accent }]}>{title}</Text>
      {steps.map((step, index) => (
        <View key={`${index}-${step}`} style={styles.methodStep}>
          <View style={[styles.methodStepNumber, { backgroundColor: index === 0 ? accent : '#64748B' }]}>
            <Text style={styles.methodStepNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.methodStepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Checkout({ route, navigation }) {
  const { orderId } = route.params;
  const { loadCart } = useContext(CartContext);
  const { token } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('domicilio');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const [shippingBreakdown, setShippingBreakdown] = useState([]);
  const [transferSellers, setTransferSellers] = useState([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [pickupPaymentMode, setPickupPaymentMode] = useState(false);

  // Card Inputs
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // PayPal Simulator
  const [paypalModal, setPaypalModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalPassword, setPaypalPassword] = useState('');
  const [paypalProcessing, setPaypalProcessing] = useState(false);

  // Cupón y métodos alternativos (los mismos nombres registrados por la web).
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [pseBanco, setPseBanco] = useState('001');
  const [pseEmail, setPseEmail] = useState('usuario.demo@pse.com.co');
  const [pseTipoCliente, setPseTipoCliente] = useState('natural');
  const [pseDocNumero, setPseDocNumero] = useState('1020304050');
  const [pseOtp, setPseOtp] = useState('982341');
  const [pseStep, setPseStep] = useState(1);
  const [pseModal, setPseModal] = useState(false);
  const [pseError, setPseError] = useState('');
  const [pseProcessing, setPseProcessing] = useState(false);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [reopenPseAfterBankSelect, setReopenPseAfterBankSelect] = useState(false);
  const [sucursalCodigo, setSucursalCodigo] = useState('');

  const shippingCost = Number(order?.costo_envio || 0);
  const subtotal = Number(order?.subtotal ?? (Number(order?.total || 0) - shippingCost));
  const orderTotal = Number(order?.total || 0);
  const totalPagar = Math.max(0, orderTotal - discountAmount);
  const bancosPSE = [
    { codigo: '001', nombre: 'Bancolombia' }, { codigo: '005', nombre: 'Davivienda' },
    { codigo: '007', nombre: 'Nequi' }, { codigo: '002', nombre: 'Banco de Bogotá' },
    { codigo: '004', nombre: 'BBVA Colombia' }, { codigo: '008', nombre: 'Daviplata' },
    { codigo: '009', nombre: 'Scotiabank Colpatria' }, { codigo: '003', nombre: 'Banco Popular' },
    { codigo: '006', nombre: 'Banco de Occidente' }, { codigo: '010', nombre: 'Banco Itaú' },
    { codigo: '011', nombre: 'Lulo Bank' }, { codigo: '012', nombre: 'Nu Colombia (Cuenta Nu)' },
    { codigo: '013', nombre: 'Banco AV Villas' }, { codigo: '014', nombre: 'Banco Caja Social' },
  ];
  const bancosPSEFrecuentes = [
    { codigo: '001', nombre: 'Bancolombia', corto: 'Bancolombia', color: '#FACC15', icono: '●' },
    { codigo: '005', nombre: 'Davivienda', corto: 'Davivienda', color: '#DC2626', icono: '●' },
    { codigo: '007', nombre: 'Nequi', corto: 'Nequi', color: '#7C3AED', icono: '●' },
    { codigo: '002', nombre: 'Banco de Bogotá', corto: 'B. Bogotá', color: '#0284C7', icono: '●' },
    { codigo: '004', nombre: 'BBVA Colombia', corto: 'BBVA', color: '#0284C7', icono: '◆' },
  ];
  const selectedPseBank = bancosPSE.find((bank) => bank.codigo === pseBanco) || bancosPSE[0];
  const isPickup = deliveryMethod === 'retiro_tienda';
  const pickupStoreIds = (order?.desglose_envio || []).map((shipping) => shipping.id_tienda).filter(Boolean);
  const pickupAvailable = new Set(pickupStoreIds).size <= 1;
  const selectedAddress = addresses.find((address) => Number(address.id_direccion) === Number(selectedAddressId));
  const cleanCardNumber = cardNumber.replace(/\s/g, '');
  const cardBrand = /^4/.test(cleanCardNumber) ? 'VISA' : /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleanCardNumber) ? 'MASTERCARD' : /^3[47]/.test(cleanCardNumber) ? 'AMEX' : 'DEBIT / CREDIT';

  const formatCurrency = (value) => Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const actualizarEntrega = async (method) => {
    setDeliveryMethod(method);
    if (method === 'domicilio' && paymentMethod === 'efectivo_tienda') setPaymentMethod('tarjeta');
    if (!orderId || !order) return;
    try {
      const response = await actualizarCostoEnvio(orderId, method);
      if (response.data?.ok) {
        setOrder((current) => ({
          ...current,
          costo_envio: Number(response.data.costo_envio || 0),
          total: Number(response.data.total || 0),
          subtotal: Number(current?.subtotal ?? (Number(current?.total || 0) - Number(current?.costo_envio || 0))),
          tipo_entrega: method,
          desglose_envio: response.data.desglose_envio || [],
        }));
        setShippingBreakdown(response.data.desglose_envio || []);
      }
    } catch (error) {
      Alert.alert('Envío', error.response?.data?.detail || 'No se pudo actualizar el costo de envío.');
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getOrderDetails(orderId);
        let orderData = res.data;
        const orderState = String(orderData.estado || orderData.estado_orden || '').toLowerCase();
        const delivery = orderData.tipo_entrega || 'domicilio';
        if (orderState.startsWith('pend')) {
          try {
            const shippingResponse = await actualizarCostoEnvio(orderId, delivery);
            if (shippingResponse.data?.ok) {
              const freshTotal = Number(shippingResponse.data.total || orderData.total || 0);
              const freshShipping = Number(shippingResponse.data.costo_envio || 0);
              orderData = {
                ...orderData,
                total: freshTotal,
                subtotal: Math.max(0, freshTotal - freshShipping),
                costo_envio: freshShipping,
                tipo_entrega: delivery,
                desglose_envio: shippingResponse.data.desglose_envio || [],
              };
            }
          } catch (shippingError) {
            console.warn('No se pudo actualizar el envío de la orden:', shippingError.message);
          }
        }
        setOrder(orderData);
        setDeliveryMethod(delivery);
        setShippingBreakdown(orderData.desglose_envio || []);
        if (orderData.id_direccion) setSelectedAddressId(orderData.id_direccion);
        if (orderState === 'pagado') {
          setPaymentSuccess(true);
        }
        try {
          const addressResponse = await getDirecciones();
          const availableAddresses = addressResponse.data || [];
          setAddresses(availableAddresses);
          setSelectedAddressId((current) => current || availableAddresses.find((item) => item.es_principal)?.id_direccion || availableAddresses[0]?.id_direccion || null);
        } catch (addressError) {
          console.warn('No se pudieron cargar las direcciones de entrega:', addressError.message);
        }
      } catch (e) {
        console.log('Error loading order', e.message);
        Alert.alert('Error', 'No pudimos obtener la información de tu compra.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (paymentMethod !== 'transferencia' || !orderId) return;
    setTransferLoading(true);
    getDatosTransferenciaVendedor(orderId)
      .then((response) => setTransferSellers(response.data?.vendedores || []))
      .catch(() => setTransferSellers([]))
      .finally(() => setTransferLoading(false));
  }, [paymentMethod, orderId]);

  const handleCardNumberChange = (text) => {
    let formatted = text.replace(/\D/g, '');
    if (formatted.length > 16) formatted = formatted.slice(0, 16);
    // Format: 0000 0000 0000 0000
    const chunks = formatted.match(/.{1,4}/g);
    setCardNumber(chunks ? chunks.join(' ') : formatted);
  };

  const handleExpiryChange = (text) => {
    let formatted = text.replace(/\D/g, '');
    if (formatted.length > 4) formatted = formatted.slice(0, 4);
    if (formatted.length > 2) {
      formatted = `${formatted.slice(0, 2)}/${formatted.slice(2)}`;
    }
    setCardExpiry(formatted);
  };

  const handleCvvChange = (text) => {
    let formatted = text.replace(/\D/g, '');
    if (formatted.length > 3) formatted = formatted.slice(0, 3);
    setCardCvv(formatted);
  };

  const finalizarPago = async (payload) => {
    const res = await processPayment(payload);
    if (!res.data?.ok) {
      throw new Error('El pago no fue aprobado.');
    }

    if (!isPickup) {
      try {
        await sendConfirmationEmail(orderId);
        setEmailConfirmation('Enviamos un correo con los detalles de tu pedido.');
      } catch (error) {
        console.warn('El pago fue aprobado, pero no se pudo enviar el correo:', error.message);
        setEmailConfirmation('Tu pago fue aprobado. No pudimos enviar el correo de confirmación; consulta tu historial de compras.');
      }
    }

    setOrder((current) => ({ ...current, estado: 'pagado', estado_orden: 'pagado', metodo_pago: payload.payment_method }));
    setPaymentSuccess(true);
    await loadCart();
  };

  const aplicarCodigoCupon = async () => {
    const codigo = couponCode.trim();
    if (!codigo) {
      setCouponMessage('Ingresa un código de cupón.');
      return;
    }
    setCouponLoading(true);
    setCouponMessage('');
    try {
      const res = await validarCupon({ codigo, order_id: Number(orderId), total: orderTotal });
      const data = res.data || {};
      if (!data.valido) {
        setDiscountAmount(0);
        setCouponMessage(data.mensaje || 'El cupón no es válido.');
        return;
      }
      setDiscountAmount(Math.max(0, Number(data.descuento || 0)));
      setCouponMessage(data.mensaje || 'Cupón aplicado correctamente.');
    } catch (error) {
      setDiscountAmount(0);
      setCouponMessage(error.response?.data?.detail || 'El cupón no es válido.');
    } finally {
      setCouponLoading(false);
    }
  };

  const confirmarPagoAlternativo = (metodo) => {
    if (!isPickup && !selectedAddressId) {
      Alert.alert('Dirección requerida', 'Selecciona una dirección para el envío a domicilio.');
      return;
    }
    if (isPickup && order?.estado_retiro !== 'habilitado_pago') {
      confirmarReservaRetiro(metodo);
      return;
    }
    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        await enviarPago(metodo);
        await registrarCuponSiAplica();
      } catch (error) {
        Alert.alert('Error', error.response?.data?.detail || error.message || 'No se pudo procesar el pago.');
      } finally {
        setPaymentProcessing(false);
      }
    }, 1200);
  };

  const confirmarReservaRetiro = async (metodo) => {
    setPickupLoading(true);
    try {
      const shippingResponse = await actualizarCostoEnvio(orderId, 'retiro_tienda');
      if (shippingResponse.data?.ok) {
        setOrder((current) => ({ ...current, tipo_entrega: 'retiro_tienda', total: Number(shippingResponse.data.total || current?.total || 0), costo_envio: 0, desglose_envio: shippingResponse.data.desglose_envio || [] }));
      }
      const response = await reservarRetiroEnTienda(orderId, metodo);
      if (!response.data?.ok) throw new Error(response.data?.error || 'No se pudo reservar en la tienda.');
      setOrder((current) => ({
        ...current,
        ...(response.data.order || {}),
        tipo_entrega: 'retiro_tienda',
        estado_retiro: response.data.estado_retiro || 'reservado',
        pin_retiro: response.data.pin_retiro,
        fecha_limite_retiro: response.data.fecha_limite_retiro,
        tienda_retiro: response.data.tienda || current?.tienda_retiro,
        metodo_pago: metodo,
      }));
    } catch (error) {
      Alert.alert('Reserva', error.response?.data?.detail || error.message || 'No se pudo confirmar la reserva.');
    } finally {
      setPickupLoading(false);
    }
  };

  const enviarPago = async (metodo) => {
    let freshTotal = orderTotal;
    const shippingResponse = await actualizarCostoEnvio(orderId, deliveryMethod);
    if (shippingResponse.data?.ok) {
      freshTotal = Number(shippingResponse.data.total || freshTotal);
      setOrder((current) => ({ ...current, total: freshTotal, costo_envio: Number(shippingResponse.data.costo_envio || 0), desglose_envio: shippingResponse.data.desglose_envio || [] }));
      setShippingBreakdown(shippingResponse.data.desglose_envio || []);
    }
    return finalizarPago({
      order_id: Number(orderId),
      amount: Math.max(0, freshTotal - discountAmount),
      payment_method: metodo,
      tipo_entrega: deliveryMethod,
      ...(deliveryMethod === 'domicilio' && selectedAddressId ? { id_direccion: Number(selectedAddressId) } : {}),
      ...(discountAmount > 0 ? { coupon_code: couponCode.trim() } : {}),
    });
  };

  const notificarLlegada = async () => {
    setArrivalLoading(true);
    try {
      await notificarLlegadaTienda(orderId);
      const response = await getOrderDetails(orderId);
      setOrder(response.data);
    } catch (error) {
      Alert.alert('Retiro en tienda', error.response?.data?.detail || 'No se pudo notificar tu llegada.');
    } finally {
      setArrivalLoading(false);
    }
  };

  const registrarCuponSiAplica = async () => {
    if (discountAmount <= 0) return;
    try {
      await aplicarCupon({ codigo: couponCode.trim(), id_orden: Number(orderId), total: orderTotal });
    } catch (error) {
      console.warn('El pago fue aprobado, pero no se pudo registrar el cupón:', error.message);
    }
  };

  const pagarConBilletera = async (billetera) => {
    if (isPickup) {
      confirmarPagoAlternativo(billetera);
      return;
    }
    const scheme = billetera === 'Nequi' ? 'nequi' : 'daviplata';
    const fallbackUrl = billetera === 'Nequi' ? 'https://www.nequi.com.co' : 'https://www.daviplata.com';
    try {
      const url = `${scheme}://pagar?valor=${totalPagar}&referencia=${orderId}`;
      await Linking.openURL(url).catch(() => Linking.openURL(fallbackUrl));
    } finally {
      confirmarPagoAlternativo(billetera);
    }
  };

  const handleCardSubmit = async () => {
    const rawCard = cardNumber.replace(/\s/g, '');
    if (!cardName.trim()) return Alert.alert('Error', 'Ingresa el nombre del titular');
    if (rawCard.length !== 16) return Alert.alert('Error', 'El número de tarjeta debe tener 16 dígitos');
    if (cardExpiry.length !== 5) return Alert.alert('Error', 'Ingresa una fecha de vencimiento válida (MM/AA)');
    if (cardCvv.length !== 3) return Alert.alert('Error', 'El código de seguridad (CVV) debe tener 3 dígitos');

    if (!isPickup && !selectedAddressId) return Alert.alert('Dirección requerida', 'Selecciona una dirección para el envío a domicilio.');
    if (isPickup && order?.estado_retiro !== 'habilitado_pago') return confirmarReservaRetiro('Tarjeta de Crédito');
    setPaymentProcessing(true);
    
    // Simulate transaction processing
    setTimeout(async () => {
      try {
        await enviarPago('Tarjeta de Crédito');
        await registrarCuponSiAplica();
      } catch (e) {
        Alert.alert('Error', e.response?.data?.detail || e.message || 'Ocurrió un error al procesar el pago.');
      } finally {
        setPaymentProcessing(false);
      }
    }, 2000);
  };

  const handlePaypalSubmit = () => {
    if (!paypalEmail.trim() || !paypalPassword.trim()) {
      return Alert.alert('Error', 'Ingresa las credenciales de tu cuenta Sandbox');
    }
    setPaypalProcessing(true);
    setTimeout(async () => {
      try {
        await enviarPago('PayPal');
        await registrarCuponSiAplica();
        setPaypalModal(false);
      } catch (e) {
        Alert.alert('Error', e.response?.data?.detail || 'Error al conectar con PayPal.');
      } finally {
        setPaypalProcessing(false);
      }
    }, 2000);
  };

  const avanzarPse = () => {
    if (!pseBanco) {
      setPseError('Selecciona el banco desde el que realizarás el pago.');
      return;
    }
    if (!pseEmail.includes('@')) {
      setPseError('Ingresa un correo electrónico registrado en PSE.');
      return;
    }
    if (!pseDocNumero.trim()) {
      setPseError('Ingresa el número de documento de identidad.');
      return;
    }
    setPseError('');
    setPseStep(2);
  };

  const abrirSimuladorPse = () => {
    setPseStep(1);
    setPseError('');
    setPseProcessing(false);
    setPseEmail((current) => current || 'usuario.demo@pse.com.co');
    setPseDocNumero((current) => current || '1020304050');
    setPseOtp((current) => current || '982341');
    setPseModal(true);
  };

  const aprobarDebitoPse = async () => {
    if (!pseOtp.trim()) {
      setPseError('Ingresa la clave dinámica de seguridad.');
      return;
    }
    setPseError('');
    setPseProcessing(true);
    setTimeout(async () => {
      try {
        setPseModal(false);
        await confirmarPagoAlternativo('PSE');
      } finally {
        setPseProcessing(false);
      }
    }, 1200);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A1E3A" />
        <Text style={styles.loadingText}>Cargando detalles del pago...</Text>
      </View>
    );
  }

  if (!paymentSuccess && isPickup && order?.estado_retiro && !pickupPaymentMode) {
    const pickupEnabled = order.estado_retiro === 'habilitado_pago';
    const pickupArrived = order.estado_retiro === 'en_tienda';
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.pickupCard}>
          <Text style={styles.pickupEyebrow}>RETIRO EN TIENDA · ORDEN #{order.id_orden_db || order.id_orden || orderId}</Text>
          <Text style={styles.pickupTitle}>{pickupEnabled ? 'Pago habilitado' : pickupArrived ? 'Llegada notificada' : 'Reserva confirmada'}</Text>
          <Text style={styles.methodText}>
            {pickupEnabled ? 'La librería verificó tu llegada. Ya puedes completar el pago.' : pickupArrived ? 'El vendedor está verificando tu PIN y habilitará el pago.' : 'Tus libros están reservados por 48 horas. Preséntate en la librería con este PIN.'}
          </Text>
          <View style={styles.pickupPinBox}>
            <Text style={styles.pickupPinLabel}>PIN DE RETIRO</Text>
            <Text style={styles.pickupPin}>{order.pin_retiro || '----'}</Text>
          </View>
          <View style={styles.pickupDetails}>
            <Text style={styles.pickupDetail}><Text style={styles.detailStrong}>Librería: </Text>{order.tienda_retiro?.nombre_tienda || 'Librería aliada'}</Text>
            <Text style={styles.pickupDetail}><Text style={styles.detailStrong}>Dirección: </Text>{order.tienda_retiro?.direccion || 'Punto de atención presencial'}</Text>
            <Text style={styles.pickupDetail}><Text style={styles.detailStrong}>Teléfono: </Text>{order.tienda_retiro?.telefono || 'Disponible en el local'}</Text>
            <Text style={styles.pickupDetail}><Text style={styles.detailStrong}>Vigencia: </Text>48 horas</Text>
            <Text style={styles.pickupDetail}><Text style={styles.detailStrong}>Método acordado: </Text>{order.metodo_pago || 'Efectivo en Tienda'}</Text>
          </View>
          {pickupEnabled ? (
            <TouchableOpacity style={styles.payBtn} onPress={() => setPickupPaymentMode(true)}>
              <Text style={styles.payBtnText}>Completar pago · {formatCurrency(totalPagar)}</Text>
            </TouchableOpacity>
          ) : pickupArrived ? (
            <View style={styles.pickupWaiting}><Text style={styles.pickupWaitingText}>Esperando confirmación de la librería</Text></View>
          ) : (
            <TouchableOpacity style={styles.arrivalBtn} onPress={notificarLlegada} disabled={arrivalLoading}>
              <Text style={styles.arrivalBtnText}>{arrivalLoading ? 'Notificando...' : 'Ya llegué a la librería'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.backToCart} onPress={() => navigation.navigate('History')}>
            <Text style={styles.backToCartText}>Ir a mis compras</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (paymentSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>¡Pago Exitoso!</Text>
          <Text style={styles.successDesc}>{emailConfirmation || 'Tu compra ha sido procesada de manera segura.'}</Text>
          
          <View style={styles.orderSummaryBox}>
            <Text style={styles.summaryText}><Text style={{ fontWeight: 'bold' }}>Orden:</Text> #{orderId}</Text>
            <Text style={styles.summaryText}><Text style={{ fontWeight: 'bold' }}>Fecha:</Text> {new Date(order.fecha).toLocaleDateString('es-CO')}</Text>
            <Text style={[styles.summaryText, { color: '#C5425A', fontWeight: '700', marginTop: 5 }]}>
              <Text style={{ fontWeight: 'bold' }}>Monto:</Text> {formatCurrency(order.total)}
            </Text>
          </View>

          {order.tipo_entrega === 'retiro_tienda' && !!order.pin_retiro && (
            <View style={styles.successPickupPin}>
              <Text style={styles.pickupPinLabel}>PIN DE RETIRO</Text>
              <Text style={styles.pickupPin}>{order.pin_retiro}</Text>
              <Text style={styles.pickupPinHint}>Preséntalo en {order.tienda_retiro?.nombre_tienda || 'la librería'} para recoger tus libros.</Text>
            </View>
          )}
          
          {order.items && order.items.filter(i => i.variante_label?.includes('Digital') || i.tipo_tapa === 'Digital').length > 0 && (
            <View style={{ marginTop: 20, width: '100%' }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Tus libros digitales:</Text>
              {order.items.filter(i => i.variante_label?.includes('Digital') || i.tipo_tapa === 'Digital').map((item, idx) => (
                <TouchableOpacity 
                  key={`dl-${idx}`}
                  style={[styles.homeBtn, { backgroundColor: '#2e7d32', marginBottom: 10 }]}
                  onPress={() => {
                     const url = `${getApiBaseUrl()}/libros/descargar/${item.id_variante}?token=${token}`;
                     Linking.openURL(url);
                  }}
                >
                  <Text style={styles.homeBtnText}>📥 Descargar {item.titulo}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.homeBtn, { marginTop: order.items?.some(i => i.variante_label?.includes('Digital')) ? 10 : 0 }]} onPress={() => navigation.navigate('PostLogin')}>
            <Text style={styles.homeBtnText}>Volver al Catálogo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {paymentProcessing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#7A1E3A" />
          <Text style={styles.overlayText}>Procesando pago seguro...</Text>
        </View>
      )}

      <View style={styles.checkoutHeader}>
        <View style={styles.checkoutHeadingRow}>
          <View style={styles.checkoutIcon}><Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke="#7A1E3A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Rect x="2" y="5" width="20" height="14" rx="2" /><Line x1="2" y1="10" x2="22" y2="10" /></Svg></View>
          <View style={styles.checkoutHeadingCopy}>
            <Text style={styles.checkoutTitle}>Entrega y Pago</Text>
            <Text style={styles.checkoutSubtitle}>Selecciona tu método de entrega y completa el pago seguro</Text>
          </View>
        </View>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepComplete} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.stepCompleteMark}>✓</Text><Text style={styles.stepCompleteText}>1. Carrito</Text>
          </TouchableOpacity>
          <Text style={styles.stepArrow}>›</Text>
          <View style={styles.stepCurrent}><Text style={styles.stepCurrentMark}>▤</Text><Text style={styles.stepCurrentText}>2. Entrega y Pago</Text></View>
        </View>
        {isPickup && order.estado_retiro === 'habilitado_pago' && pickupPaymentMode && (
          <TouchableOpacity style={styles.pickupBackLink} onPress={() => setPickupPaymentMode(false)}>
            <Text style={styles.manageAddress}>‹ Volver a detalles del retiro</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.orderSummaryCard}>
        <Text style={styles.panelTitle}>Resumen de Compra</Text>
        {order.items?.map((item) => (
          <View key={`${item.id_libro}-${item.id_variante || ''}`} style={styles.summaryItem}>
            <View style={styles.itemDescription}>
              <Text style={styles.itemName}>{item.titulo} x{item.cantidad}</Text>
              {!!(item.variante_label || item.tipo_tapa) && <Text style={styles.itemVariant}>{item.variante_label || item.tipo_tapa}</Text>}
            </View>
            <Text style={styles.itemPrice}>{formatCurrency(Number(item.precio_final || item.precio_libro || 0) * Number(item.cantidad || 1))}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.couponRow}>
          <TextInput
            style={styles.couponInput}
            placeholder="Código de cupón"
            autoCapitalize="characters"
            value={couponCode}
            onChangeText={(value) => { setCouponCode(value); setDiscountAmount(0); setCouponMessage(''); }}
          />
          <TouchableOpacity style={styles.couponApplyButton} onPress={aplicarCodigoCupon} disabled={couponLoading}>
            <Text style={styles.couponApplyText}>{couponLoading ? '...' : 'Aplicar'}</Text>
          </TouchableOpacity>
        </View>
        {!!couponMessage && <Text style={[styles.couponMessage, discountAmount > 0 ? styles.couponSuccess : styles.couponError]}>{couponMessage}</Text>}
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLineLabel}>Subtotal</Text>
          <Text style={styles.summaryLineValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLineLabel}>Envío ({isPickup ? 'Retiro en tienda' : 'Domicilio'})</Text>
          <Text style={[styles.summaryLineValue, shippingCost === 0 && styles.freeShipping]}>{shippingCost > 0 ? formatCurrency(shippingCost) : 'Gratis'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLineLabel}>IVA · Art. 424 E.T.</Text>
          <Text style={styles.freeShipping}>$0 — Exento</Text>
        </View>
        {discountAmount > 0 && <View style={styles.summaryItem}>
          <Text style={styles.discountLabel}>Cupón {couponCode.trim()}</Text>
          <Text style={styles.discountValue}>-{formatCurrency(discountAmount)}</Text>
        </View>}
        <View style={[styles.summaryTotalRow, styles.summaryTotalDivider]}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>{formatCurrency(totalPagar)}</Text>
        </View>
      </View>

      <View style={styles.stepPanel}>
        <View style={styles.stepPanelHeader}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
          <View style={styles.stepPanelCopy}>
            <Text style={styles.panelTitle}>Forma de Entrega</Text>
            <Text style={styles.panelSubtitle}>Elige cómo prefieres recibir tus libros</Text>
          </View>
          <View style={[styles.modeBadge, isPickup ? styles.modeBadgePickup : styles.modeBadgeDelivery]}>
            <Text style={[styles.modeBadgeText, isPickup ? styles.modeBadgePickupText : styles.modeBadgeDeliveryText]}>{isPickup ? '🏬 Retiro en Tienda' : '🚚 Envío a Domicilio'}</Text>
          </View>
        </View>
        <View style={styles.deliveryOptions}>
        <TouchableOpacity style={[styles.deliveryOption, !isPickup && styles.deliveryOptionActive]} onPress={() => actualizarEntrega('domicilio')}>
          <View style={styles.deliveryOptionTop}>
            <Text style={styles.deliveryIcon}>🚚</Text>
            <View style={[styles.deliveryRadio, !isPickup && styles.deliveryRadioSelected]}>{!isPickup && <View style={styles.deliveryRadioDot} />}</View>
          </View>
          <Text style={[styles.deliveryOptionTitle, !isPickup && styles.deliveryOptionTitleActive]}>Envío a Domicilio</Text>
          <Text style={styles.deliveryOptionText}>Recibe tus libros en tu casa u oficina por transportadora certificada.</Text>
          <Text style={[styles.deliveryOptionBadge, !isPickup && styles.deliveryOptionBadgeActive]}>📦 Despacho nacional</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deliveryOption, isPickup && styles.deliveryOptionActive, !pickupAvailable && styles.deliveryOptionDisabled]}
          disabled={!pickupAvailable}
          onPress={() => { setPaymentMethod('efectivo_tienda'); actualizarEntrega('retiro_tienda'); }}
        >
          <View style={styles.deliveryOptionTop}>
            <Text style={styles.deliveryIcon}>🏪</Text>
            <View style={[styles.deliveryRadio, isPickup && styles.deliveryRadioSelected]}>{isPickup && <View style={styles.deliveryRadioDot} />}</View>
          </View>
          <Text style={[styles.deliveryOptionTitle, isPickup && styles.deliveryOptionTitleActive]}>Retiro en Tienda</Text>
          <Text style={styles.deliveryOptionText}>{pickupAvailable ? 'Recoge directamente en el local de la librería vendedora sin esperas.' : 'No disponible: el retiro solo aplica si todos los libros son de la misma librería.'}</Text>
          <Text style={[styles.deliveryOptionBadge, styles.deliveryPickupBadge]}>⚡ Sin costo de envío ($0) • Click & Collect</Text>
        </TouchableOpacity>
      </View>

      {!isPickup && (
        <View style={styles.addressCard}>
          <View style={styles.addressHeading}>
            <Text style={styles.addressTitle}>📍 Dirección de entrega</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Direcciones')}>
              <Text style={styles.manageAddress}>📍 + Gestionar direcciones</Text>
            </TouchableOpacity>
          </View>
          {addresses.length ? <>
            <TouchableOpacity style={styles.addressDropdown} onPress={() => setAddressDropdownOpen((open) => !open)} accessibilityRole="button" accessibilityLabel="Seleccionar dirección de entrega">
              <View style={styles.addressDropdownCopy}>
                <View style={styles.addressDropdownTitleRow}>
                  <Text style={styles.addressOptionTitle}>{selectedAddress?.alias_direccion || 'Selecciona una dirección de entrega'}</Text>
                  {selectedAddress?.es_principal && <Text style={styles.primaryBadge}>Predeterminada</Text>}
                </View>
                {selectedAddress && <Text style={styles.addressOptionText} numberOfLines={2}>{selectedAddress.direccion_completa || selectedAddress.direccion}, {selectedAddress.ciudad}{selectedAddress.departamento ? `, ${selectedAddress.departamento}` : ''}</Text>}
              </View>
              <Text style={styles.dropdownChevron}>{addressDropdownOpen ? '⌃' : '⌄'}</Text>
            </TouchableOpacity>
            {addressDropdownOpen && <View style={styles.addressDropdownMenu}>
              {addresses.map((address) => (
                <TouchableOpacity key={address.id_direccion} style={styles.addressDropdownOption} onPress={() => { setSelectedAddressId(address.id_direccion); setAddressDropdownOpen(false); }}>
                  <View style={styles.addressDropdownTitleRow}>
                    <Text style={styles.addressOptionTitle}>{address.alias_direccion || 'Dirección'}</Text>
                    {address.es_principal && <Text style={styles.primaryBadge}>Predeterminada</Text>}
                  </View>
                  <Text style={styles.addressOptionText}>{address.direccion_completa || address.direccion}, {address.ciudad}{address.departamento ? `, ${address.departamento}` : ''}</Text>
                  {!!address.telefono_contacto && <Text style={styles.addressOptionText}>Tel. {address.telefono_contacto}</Text>}
                </TouchableOpacity>
              ))}
            </View>}
            {selectedAddress && <View style={styles.addressPreview}>
              <View style={styles.addressPreviewCopy}>
                <View style={styles.addressDropdownTitleRow}>
                  <Text style={styles.addressOptionTitle}>{selectedAddress.alias_direccion || 'Dirección de destino'}</Text>
                  {selectedAddress.es_principal && <Text style={styles.primaryBadge}>Predeterminada</Text>}
                </View>
                <Text style={styles.addressOptionText}>
                  {selectedAddress.direccion_completa || selectedAddress.direccion}
                  {selectedAddress.barrio ? `, ${selectedAddress.barrio}` : ''}
                  {selectedAddress.ciudad ? `, ${selectedAddress.ciudad}` : ''}
                  {selectedAddress.departamento ? `, ${selectedAddress.departamento}` : ''}
                  {selectedAddress.telefono_contacto ? ` · 📞 ${selectedAddress.telefono_contacto}` : ''}
                </Text>
              </View>
              <Text style={styles.destinationActiveBadge}>✓ Destino activo</Text>
            </View>}
          </> : <Text style={styles.addressEmpty}>No tienes direcciones registradas. Agrégala para continuar.</Text>}
        </View>
      )}

      {isPickup && <View style={styles.pickupInfoPanel}>
        <View style={styles.pickupInfoHeading}>
          <Text style={styles.pickupInfoTitle}>🏬 Retiro en punto físico habilitado</Text>
          <Text style={styles.pickupCostBadge}>Costo de envío: $0</Text>
        </View>
        <View style={styles.pickupInfoColumns}>
          <View style={styles.pickupInfoColumn}>
            <Text style={styles.pickupInfoLabel}>📍 Lugar de entrega</Text>
            <Text style={styles.pickupInfoText}>{order.tienda_retiro?.nombre_tienda || 'Sede de la librería vendedora'}</Text>
            <Text style={styles.pickupInfoText}>{order.tienda_retiro?.direccion || 'Recibirás la dirección exacta y horario en tu confirmación.'}</Text>
          </View>
          <View style={styles.pickupInfoColumn}>
            <Text style={styles.pickupInfoLabel}>💵 Opciones de pago</Text>
            <Text style={styles.pickupInfoText}>Puedes pagar en efectivo al recoger en caja o pagar por adelantado (Nequi, Tarjeta, PSE, Transferencia).</Text>
          </View>
        </View>
      </View>}
      </View>

      <View style={styles.stepPanel}>
        <View style={styles.stepPanelHeader}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
          <View style={styles.stepPanelCopy}>
            <Text style={styles.panelTitle}>Selecciona tu método de pago</Text>
            <Text style={styles.panelSubtitle}>{isPickup ? 'Métodos disponibles para retiro en librería' : 'Métodos disponibles para entrega a domicilio'}</Text>
          </View>
          <View style={[styles.modeBadge, isPickup ? styles.modeBadgePickup : styles.modeBadgeDelivery]}>
            <Text style={[styles.modeBadgeText, isPickup ? styles.modeBadgePickupText : styles.modeBadgeDeliveryText]}>{isPickup ? '🏬 Modalidad Retiro en Tienda' : '🚚 Modalidad Entrega a Domicilio'}</Text>
          </View>
        </View>
      <View style={styles.tabContainer}>
        {(isPickup ? [
          ['efectivo_tienda', 'Efectivo en Tienda', '💵'], ['billetera', 'Nequi / Daviplata', '📱'], ['tarjeta', 'Tarjeta', '💳'],
          ['pse', 'PSE', '🏦'], ['transferencia', 'Transferencia', '🏛️'],
        ] : [
          ['tarjeta', 'Tarjeta', '💳'], ['pse', 'PSE', '🏦'], ['billetera', 'Nequi / Daviplata', '📱'],
          ['sucursal', 'Punto Efecty', '🏪'], ['transferencia', 'Transferencia', '🏛️'], ['paypal', 'PayPal', '🅿️'],
        ]).map(([id, label, icon]) => (
          <TouchableOpacity key={id} style={[styles.tabButton, paymentMethod === id && styles.tabButtonActive]} onPress={() => setPaymentMethod(id)}>
            <Text style={styles.paymentMethodIcon}>{icon}</Text>
            <Text style={[styles.tabButtonText, paymentMethod === id && styles.tabButtonTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentMethod === 'tarjeta' && <View style={styles.paymentSecurityBanner}>
        <Text style={styles.paymentSecurityIcon}>🛡️</Text>
        <Text style={styles.paymentSecurityText}>Tus datos viajan 100% protegidos bajo cifrado SSL de 256 bits y estrictos estándares PCI-DSS.</Text>
      </View>}

      {paymentMethod === 'tarjeta' ? (
        <View style={styles.cardForm}>
          <LinearGradient colors={['#4A0E1F', '#7A1E3A', '#2B0712']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.paymentCardPreview}>
            <View style={styles.paymentCardTop}>
              <View style={styles.paymentCardChip}><View style={styles.chipLineVertical} /><View style={styles.chipLineHorizontal} /></View>
              <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.2} strokeLinecap="round">
                <Path d="M8.5 16.5a5 5 0 0 1 0-9" /><Path d="M12 19a8.5 8.5 0 0 0 0-14" /><Path d="M15.5 21.5a12 12 0 0 0 0-19" />
              </Svg>
              <View style={styles.paymentCardBrandArea}>
                {cardBrand === 'MASTERCARD' ? <View style={styles.mastercardLogo}><View style={styles.mastercardRed} /><View style={styles.mastercardGold} /></View> : cardBrand === 'AMEX' ? <Text style={styles.amexLogo}>AMEX</Text> : <Text style={styles.paymentCardBrand}>{cardBrand}</Text>}
              </View>
            </View>
            <Text style={styles.paymentCardNumber}>{cardNumber || '•••• •••• •••• ••••'}</Text>
            <View style={styles.paymentCardBottom}>
              <View style={styles.paymentCardHolderWrap}>
                <Text style={styles.paymentCardCaption}>TITULAR DE LA TARJETA</Text>
                <Text style={styles.paymentCardHolder} numberOfLines={1}>{cardName || 'NOMBRE Y APELLIDO'}</Text>
              </View>
              <View style={styles.paymentCardExpiryWrap}>
                <Text style={styles.paymentCardCaption}>VENCE</Text>
                <Text style={styles.paymentCardExpiry}>{cardExpiry || 'MM/AA'}</Text>
              </View>
            </View>
          </LinearGradient>
          <View style={styles.inputGroup}>
            <View style={styles.cardNumberLabelRow}>
              <Text style={styles.label}>Número de Tarjeta</Text>
              <View style={styles.acceptedCardsRow}>
                <Text style={styles.acceptedCardsLabel}>Aceptamos:</Text>
                <Text style={[styles.acceptedCardBadge, styles.visaBadge]}>Visa</Text>
                <Text style={[styles.acceptedCardBadge, styles.mastercardBadge]}>Mastercard</Text>
                <Text style={[styles.acceptedCardBadge, styles.amexBadge]}>Amex</Text>
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Vencimiento (MM/AA)</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                keyboardType="numeric"
                value={cardExpiry}
                onChangeText={handleExpiryChange}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <View style={styles.cardNumberLabelRow}>
                <Text style={styles.label}>Código CVV</Text>
                <Text style={styles.cvvHint}>3 dígitos</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="123"
                keyboardType="numeric"
                secureTextEntry
                value={cardCvv}
                onChangeText={handleCvvChange}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Titular (como aparece en la tarjeta)</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan Pérez"
              value={cardName}
              onChangeText={setCardName}
            />
          </View>

          <TouchableOpacity style={styles.payBtn} onPress={handleCardSubmit}>
            <Text style={styles.payBtnText}>{paymentProcessing ? 'Procesando pago seguro...' : isPickup ? order?.estado_retiro === 'habilitado_pago' ? `Pagar con Tarjeta (${formatCurrency(totalPagar)})` : `Confirmar Reserva y Pagar con Tarjeta (${formatCurrency(totalPagar)})` : `Pagar ${formatCurrency(totalPagar)}`}</Text>
          </TouchableOpacity>
        </View>
      ) : paymentMethod === 'paypal' ? (
        <View style={styles.methodPanel}>
          <PaymentMethodHeader icon="🅿️" title="PayPal Checkout · 🌍 Internacional y Multidivisa" description="Paga con saldo de PayPal, tarjetas internacionales o débito bancario protegido." totalLabel="Total a pagar" total={formatCurrency(totalPagar)} palette={{ background: '#F0F7FF', border: '#BAE6FD', iconBackground: '#003087', title: '#003087', description: '#0284C7' }} />
          <View style={styles.methodBenefits}>
            <PaymentBenefit icon="🛡️" title="Protección al Comprador" description="Tus compras elegibles están 100% protegidas contra fraude o pérdidas." tint="#EFF6FF" />
            <PaymentBenefit icon="🔒" title="Privacidad Financiera" description="No necesitas compartir tus datos bancarios ni de tarjeta con el comercio." tint="#F0FDF4" />
            <PaymentBenefit icon="💳" title="Cualquier Medio" description="Usa saldo PayPal, Visa, Mastercard, AMEX o cuentas bancarias vinculadas." tint="#FEF3C7" />
          </View>
          <PaymentSteps title="¿Cómo funciona el pago con PayPal?" accent="#003087" steps={['Haz clic en el botón oficial de Pagar con PayPal.', 'Se abrirá el portal seguro Sandbox para ingresar tus credenciales.', 'Aprueba la transacción y tu pedido se confirmará inmediatamente.']} />
          <View style={styles.paypalAction}>
            <TouchableOpacity style={styles.paypalBtn} onPress={() => setPaypalModal(true)}>
              <Text style={styles.paypalBtnText}>PayPal · Pagar {formatCurrency(totalPagar)}</Text>
            </TouchableOpacity>
            <Text style={styles.paypalSecurity}>🔒 Conexión cifrada TLS de 256 bits y protección contra fraudes 24/7 de PayPal</Text>
          </View>
        </View>
      ) : null}

      {paymentMethod === 'sucursal' && (
        <View style={styles.methodPanel}>
          <PaymentMethodHeader icon="🏪" title="Puntos de Pago Efecty" description="Paga en efectivo en cualquiera de los más de 10.000 puntos en todo el país." totalLabel="Total a pagar" total={formatCurrency(totalPagar)} palette={{ background: '#FFFDF0', border: '#FDE047', iconBackground: '#FACC15', title: '#713F12', description: '#854D0E' }} />
          {!sucursalCodigo ? <>
            <View style={styles.methodBenefits}>
              <PaymentBenefit icon="📍" title="+10.000 Puntos" description="Presencia en todo el territorio nacional" tint="#FEF9C3" />
              <PaymentBenefit icon="⏳" title="48 Horas de Plazo" description="Tiempo para cancelar en cualquier sede" tint="#FEF9C3" />
              <PaymentBenefit icon="💵" title="Pago en Efectivo" description="Sin necesidad de tarjeta o cuenta bancaria" tint="#FEF9C3" />
            </View>
            <PaymentSteps title="¿Cómo funciona el pago en Efecty?" accent="#A16207" steps={['Haz clic en Generar Código de Pago para obtener tu PIN de recaudo.', 'Acércate a cualquier punto Efecty e indica el convenio de BookyHome junto a tu código.', `Paga en efectivo el valor de ${formatCurrency(totalPagar)} y conserva tu tirilla de comprobante.`]} />
            <TouchableOpacity style={styles.payBtn} onPress={() => setSucursalCodigo(Math.random().toString(36).slice(2, 12).toUpperCase())}>
              <Text style={styles.payBtnText}>Generar Código de Pago Efecty</Text>
            </TouchableOpacity>
          </> : <View style={styles.efectyReceipt}>
            <View style={styles.efectyReceiptHeading}>
              <View><Text style={styles.efectyKicker}>CUPÓN DE PAGO OFICIAL</Text><Text style={styles.efectyTitle}>Efecty · BookyHome</Text></View>
              <Text style={styles.efectyPending}>PENDIENTE DE PAGO</Text>
            </View>
            <View style={styles.efectyReceiptRow}>
              <View style={styles.efectyReceiptCell}><Text style={styles.efectyCellLabel}>Convenio Efecty</Text><Text style={styles.efectyCellValue}>110954</Text></View>
              <View style={styles.efectyReceiptCell}><Text style={styles.efectyCellLabel}>Monto a Pagar</Text><Text style={styles.efectyCellValue}>{formatCurrency(totalPagar)}</Text></View>
            </View>
            <View style={styles.efectyReceiptCell}><Text style={styles.efectyCellLabel}>Vigencia</Text><Text style={[styles.efectyCellValue, { color: '#059669' }]}>48 Horas</Text></View>
            <View style={styles.paymentCode}><Text style={styles.efectyKicker}>Referencia de Pago / PIN</Text><Text style={styles.paymentCodeText}>{sucursalCodigo}</Text><Text style={styles.methodText}>Dicta este número al cajero en el punto Efecty.</Text></View>
            <TouchableOpacity style={styles.greenPayBtn} onPress={() => confirmarPagoAlternativo('Pago en Efecty')}><Text style={styles.payBtnText}>Ya realicé el pago en el punto</Text></TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => setSucursalCodigo('')}><Text style={styles.outlineBtnText}>Generar otro código o Cambiar método</Text></TouchableOpacity>
          </View>}
        </View>
      )}

      {paymentMethod === 'pse' && (
        <View style={styles.methodPanel}>
          <PaymentMethodHeader icon="PSE" title="Pago Seguro en Línea (PSE)" description="Débito directo sin costos adicionales desde tu cuenta bancaria." totalLabel="Total a debitar" total={formatCurrency(totalPagar)} palette={{ background: '#F8FAFC', border: '#BFDBFE', iconBackground: '#1E3A8A', title: '#1E3A8A', description: '#475569' }} />
          <View>
            <View style={styles.pseBankHeading}>
              <Text style={styles.pseSectionTitle}>Bancos frecuentes en Colombia</Text>
              <Text style={styles.pseQuickHint}>Selección rápida con 1 clic</Text>
            </View>
            <View style={styles.pseQuickBanks}>
              {bancosPSEFrecuentes.map((bank) => {
                const isSelected = pseBanco === bank.codigo;
                return (
                  <TouchableOpacity key={bank.codigo} style={[styles.pseQuickBank, isSelected && styles.pseQuickBankActive]} onPress={() => setPseBanco(bank.codigo)}>
                    <Text style={[styles.pseBankSymbol, { color: bank.color }]}>{bank.icono}</Text>
                    <Text numberOfLines={1} style={[styles.pseQuickBankName, isSelected && styles.pseQuickBankNameActive]}>{bank.corto}</Text>
                    {isSelected && <Text style={styles.pseBankCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View>
            <Text style={styles.pseSectionTitle}>O selecciona tu entidad financiera en la lista completa:</Text>
            <TouchableOpacity style={styles.pseDropdown} onPress={() => setBankDropdownOpen(true)} accessibilityRole="button" accessibilityLabel={`Banco seleccionado: ${selectedPseBank.nombre}`}>
              <Text style={styles.pseDropdownIcon}>♙</Text>
              <Text style={styles.pseDropdownName}>{selectedPseBank.nombre}</Text>
              <Text style={styles.pseDropdownChevron}>⌄</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pseInfoPanel}>
            <Text style={styles.pseInfoTitle}>ℹ️  ¿Cómo funciona el pago con PSE?</Text>
            <Text style={styles.pseInfoLine}>1. Al hacer clic en el botón, serás redirigido a la pasarela segura de ACH Colombia y tu banco.</Text>
            <Text style={styles.pseInfoLine}>2. Inicias sesión con tus credenciales bancarias habituales de forma 100% privada.</Text>
            <Text style={styles.pseInfoLine}>3. Autorizas la transacción y tu pedido en BookyHome se confirmará inmediatamente.</Text>
          </View>
          <View style={styles.pseSecurityPanel}>
            <Text style={styles.paymentSecurityIcon}>🛡️</Text>
            <Text style={styles.pseSecurityText}>Transacción avalada y protegida por <Text style={styles.pseSecurityStrong}>ACH Colombia</Text>. Nunca solicitamos contraseñas ni claves de tus cuentas bancarias.</Text>
          </View>
          <TouchableOpacity style={styles.pseLaunchButton} onPress={abrirSimuladorPse} disabled={paymentProcessing}>
            <Text style={styles.pseLaunchIcon}>▣</Text>
            <Text style={styles.pseLaunchText}>{isPickup ? order?.estado_retiro === 'habilitado_pago' ? `Pagar vía PSE con ${selectedPseBank.nombre} (${formatCurrency(totalPagar)})` : `Confirmar Reserva con PSE (${selectedPseBank.nombre})` : `Abrir Simulador PSE con ${selectedPseBank.nombre} (${formatCurrency(totalPagar)})`}</Text>
            <Text style={styles.pseLaunchArrow}>➜</Text>
          </TouchableOpacity>
        </View>
      )}

      {paymentMethod === 'billetera' && (
        <View style={styles.methodPanel}>
          <PaymentMethodHeader icon="📱" title="Billeteras Móviles: Nequi & Daviplata" description="Paga directo desde tu app con notificación push o enlace seguro." totalLabel="Total a transferir" total={formatCurrency(totalPagar)} palette={{ background: '#FDF4FF', border: '#F0ABFC', iconBackground: '#DA0081', title: '#701A75', description: '#4A044E' }} />
          <View style={styles.walletCards}>
            <View style={[styles.walletCard, styles.walletNequi]}>
              <View style={[styles.walletCornerBadge, styles.walletNequiBadge]}><Text style={styles.walletCornerBadgeText}>MÁS POPULAR</Text></View>
              <View style={styles.walletTitleRow}><View style={styles.walletLogoNequi}><Text style={styles.walletLogoText}>N</Text></View><View><Text style={styles.walletTitle}>Nequi</Text><Text style={styles.walletIssuer}>By Bancolombia</Text></View></View>
              <PaymentSteps title="Instrucciones rápidas:" accent="#701A75" steps={isPickup ? order?.estado_retiro === 'habilitado_pago' ? ['El vendedor ha validado tu presencia en la librería.', 'Haz clic en Pagar con Nequi para procesar el cobro seguro.', '¡Recibe tus libros inmediatamente en el punto de atención!'] : ['Haz clic en Confirmar Reserva con Nequi para apartar tu libro.', 'Se generará tu PIN único de retiro y los datos de la librería física.', 'Al llegar al punto físico, muestra tu PIN y paga con Nequi en tienda.'] : ['Haz clic en Pagar con Nequi.', 'Abre tu App Nequi o responde la notificación push.', `Acepta el pago por ${formatCurrency(totalPagar)} y confirma.`]} />
              <TouchableOpacity style={styles.walletActionButton} onPress={() => pagarConBilletera('Nequi')}>
                <LinearGradient colors={['#DA0081', '#200020']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.walletActionGradient}>
                  <Text style={styles.walletActionIcon}>▯</Text><Text style={styles.walletActionText}>Pagar con Nequi</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={[styles.walletCard, styles.walletDaviplata]}>
              <View style={[styles.walletCornerBadge, styles.walletDaviplataBadge]}><Text style={styles.walletCornerBadgeText}>DIRECTO DAVIVIENDA</Text></View>
              <View style={styles.walletTitleRow}><View style={styles.walletLogoDaviplata}><Text style={styles.walletLogoText}>D</Text></View><View><Text style={styles.walletTitle}>Daviplata</Text><Text style={styles.walletIssuer}>By Davivienda</Text></View></View>
              <PaymentSteps title="Instrucciones rápidas:" accent="#991B1B" steps={isPickup ? order?.estado_retiro === 'habilitado_pago' ? ['El vendedor ha validado tu presencia en la librería.', 'Haz clic en Pagar con Daviplata para procesar el cobro seguro.', '¡Recibe tus libros inmediatamente en el punto de atención!'] : ['Haz clic en Confirmar Reserva con Daviplata para apartar tu libro.', 'Se generará tu PIN único de retiro y los datos de la librería física.', 'Al llegar al local físico, muestra tu PIN y realiza la transferencia en Daviplata.'] : ['Haz clic en Pagar con Daviplata.', 'Ingresa con tu número de documento y teléfono.', `Autoriza el débito por ${formatCurrency(totalPagar)} con tu clave.`]} />
              <TouchableOpacity style={styles.walletActionButton} onPress={() => pagarConBilletera('Daviplata')}>
                <LinearGradient colors={['#ED1C24', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.walletActionGradient}>
                  <Text style={styles.walletActionIcon}>▯</Text><Text style={styles.walletActionText}>Pagar con Daviplata</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.paymentSecurityBanner}><Text style={styles.paymentSecurityIcon}>🛡️</Text><Text style={styles.paymentSecurityText}>Operaciones respaldadas directamente por las plataformas bancarias de Bancolombia y Davivienda. Sin comisiones adicionales para el comprador.</Text></View>
        </View>
      )}

      {paymentMethod === 'transferencia' && (
        <View style={styles.methodPanel}>
          <PaymentMethodHeader icon="🏛️" title="Transferencia a Cuenta del Vendedor" description="Transfiere directamente a la cuenta bancaria donde el vendedor recibe sus pagos." totalLabel="Total a transferir" total={formatCurrency(totalPagar)} palette={{ background: '#F8FAFC', border: '#CBD5E1', iconBackground: '#0F172A', title: '#0F172A', description: '#475569' }} />
          {transferLoading ? <ActivityIndicator color="#7A1E3A" /> : transferSellers.length ? transferSellers.map((seller) => {
            const account = seller.cuenta || seller.cuentas?.[0];
            return (
              <View key={seller.id_tienda} style={styles.transferDetails}>
                <View style={styles.transferShopHeading}><Text style={styles.transferShop}>🏪 {seller.nombre_tienda}</Text><Text style={styles.transferVerified}>✓ Vendedor Verificado</Text></View>
                <Text style={styles.methodText}>Titular receptor: <Text style={styles.detailStrong}>{seller.vendedor_nombre || seller.nombre_tienda}</Text></Text>
                {account ? <>
                  <Text style={styles.methodText}>Banco: <Text style={styles.detailStrong}>{account.banco}</Text></Text>
                  <Text style={styles.methodText}>Tipo de cuenta: <Text style={styles.detailStrong}>{account.tipo_cuenta}</Text></Text>
                  <Text style={styles.methodText}>Número: <Text style={styles.detailStrong}>{account.numero_cuenta}</Text></Text>
                  <Text style={styles.methodText}>Titular: <Text style={styles.detailStrong}>{account.nombre_titular}</Text></Text>
                  {!!account.cedula_titular && <Text style={styles.methodText}>Documento: <Text style={styles.detailStrong}>{account.cedula_titular}</Text></Text>}
                </> : <Text style={styles.addressEmpty}>La librería aún no tiene una cuenta registrada.</Text>}
              </View>
            );
          }) : <Text style={styles.addressEmpty}>No encontramos cuentas bancarias para esta orden.</Text>}
          <Text style={styles.transferAmount}>Total a transferir: {formatCurrency(totalPagar)}</Text>
          <TouchableOpacity style={styles.payBtn} onPress={() => confirmarPagoAlternativo('Transferencia Bancaria')}><Text style={styles.payBtnText}>{isPickup && order?.estado_retiro !== 'habilitado_pago' ? 'Confirmar reserva' : 'Confirmar transferencia'}</Text></TouchableOpacity>
        </View>
      )}

      {paymentMethod === 'efectivo_tienda' && isPickup && (
        <View style={styles.methodPanel}>
          <PaymentMethodHeader icon="💵" title="Pagar en Efectivo al Retirar" description="Reserva tus libros ahora y realiza el pago en la caja de la librería al retirar." totalLabel="Monto a abonar en caja" total={formatCurrency(totalPagar)} palette={{ background: '#F0FDF4', border: '#86EFAC', iconBackground: '#16A34A', title: '#14532D', description: '#15803D' }} />
          <View style={styles.methodBenefits}>
            <PaymentBenefit icon="🔖" title="Sin cobro anticipado" description="Tu libro queda reservado sin necesidad de ingresar tarjetas ni transferir." tint="#F0FDF4" />
            <PaymentBenefit icon="👀" title="Inspecciona tu libro" description="Revisa el estado de tu ejemplar en el local antes de realizar el pago en efectivo." tint="#EFF6FF" />
            <PaymentBenefit icon="⚡" title="Entrega inmediata" description="Recibirás la confirmación con el código de retiro para acercarte a la librería." tint="#FEF3C7" />
          </View>
          <PaymentSteps title="¿Cómo funciona el retiro y pago en tienda?" accent="#166534" steps={['Haz clic en Confirmar Reserva para apartar los libros.', `Acércate a la librería con tu ID de Orden #${order.id_orden_db || order.id_orden || orderId}.`, 'Paga en efectivo en el mostrador y retira tu pedido inmediatamente.']} />
          <TouchableOpacity style={styles.greenPayBtn} onPress={() => confirmarPagoAlternativo('Efectivo en Tienda')} disabled={pickupLoading}>
            <Text style={styles.payBtnText}>{pickupLoading ? 'Confirmando reserva...' : 'Confirmar Reserva'}</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.backToCart}>
        <Text style={styles.backToCartText}>←  Volver al carrito</Text>
      </TouchableOpacity>
      </View>

      <Modal visible={bankDropdownOpen} transparent animationType="fade" onRequestClose={() => { setBankDropdownOpen(false); setReopenPseAfterBankSelect(false); }}>
        <View style={styles.bankPickerOverlay}>
          <View style={styles.bankPickerSheet}>
            <View style={styles.bankPickerHeader}>
              <Text style={styles.bankPickerTitle}>Selecciona tu entidad financiera</Text>
              <TouchableOpacity onPress={() => { setBankDropdownOpen(false); setReopenPseAfterBankSelect(false); }}><Text style={styles.bankPickerClose}>×</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.bankPickerList} keyboardShouldPersistTaps="handled">
              {bancosPSE.map((bank) => (
                <TouchableOpacity key={bank.codigo} style={[styles.bankPickerOption, pseBanco === bank.codigo && styles.bankPickerOptionSelected]} onPress={() => { setPseBanco(bank.codigo); setBankDropdownOpen(false); if (reopenPseAfterBankSelect) { setPseModal(true); setReopenPseAfterBankSelect(false); } }}>
                  <Text style={[styles.bankPickerOptionText, pseBanco === bank.codigo && styles.bankPickerOptionTextSelected]}>{bank.nombre}</Text>
                  {pseBanco === bank.codigo && <Text style={styles.bankPickerCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={pseModal} animationType="slide" transparent onRequestClose={() => !pseProcessing && setPseModal(false)}>
        <View style={styles.pseModalOverlay}>
          <View style={styles.pseModalCard}>
            <View style={styles.pseModalHeader}>
              <View style={styles.pseModalBrand}>
                <View style={styles.pseModalLogo}><Text style={styles.pseModalLogoTitle}>PSE</Text><Text style={styles.pseModalLogoSubtitle}>PAGOS</Text></View>
                <View style={styles.pseModalBrandCopy}>
                  <Text style={styles.pseModalTitle}>ACH Colombia · PSE</Text>
                  <Text style={styles.pseModalSubtitle}>Pagos Seguros en Línea · Débito Bancario</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.pseModalClose} onPress={() => setPseModal(false)} disabled={pseProcessing}><Text style={styles.pseModalCloseText}>×</Text></TouchableOpacity>
            </View>

            <View style={styles.pseOrderSummary}>
              <View style={styles.pseOrderCommerce}>
                <Text style={styles.pseOrderLabel}>Comercio Recaudador</Text>
                <Text style={styles.pseOrderMerchant}>BookyHome Libros S.A.S.</Text>
                <Text style={styles.pseOrderReference}>NIT 901.456.789 · Ref #{order.id_orden_db || order.id_orden || orderId}</Text>
              </View>
              <View style={styles.pseOrderTotal}>
                <Text style={styles.pseOrderLabel}>Total a debitar</Text>
                <Text style={styles.pseOrderAmount}>{formatCurrency(totalPagar)}</Text>
              </View>
            </View>

            <View style={styles.pseModalSteps}>
              <View style={[styles.pseModalStepTab, pseStep === 1 && styles.pseModalStepTabActive]}><Text style={[styles.pseModalStepText, pseStep === 1 && styles.pseModalStepTextActive]}>1. Identificación PSE</Text></View>
              <View style={[styles.pseModalStepTab, pseStep === 2 && styles.pseModalStepTabActive]}><Text style={[styles.pseModalStepText, pseStep === 2 && styles.pseModalStepTextActive]}>2. Banca Virtual ({selectedPseBank.nombre})</Text></View>
            </View>

            <ScrollView style={styles.pseModalBody} contentContainerStyle={styles.pseModalBodyContent} keyboardShouldPersistTaps="handled">
              {!!pseError && <Text style={styles.pseModalError}>⚠️  {pseError}</Text>}
              {pseStep === 1 ? <>
                <Text style={styles.pseModalFieldLabel}>Tipo de Cliente</Text>
                <View style={styles.pseClientTypes}>
                  <TouchableOpacity style={[styles.pseClientType, pseTipoCliente === 'natural' && styles.pseClientTypeActive]} onPress={() => setPseTipoCliente('natural')}><Text style={[styles.pseClientTypeText, pseTipoCliente === 'natural' && styles.pseClientTypeTextActive]}>👤 Persona Natural</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.pseClientType, pseTipoCliente === 'juridica' && styles.pseClientTypeActive]} onPress={() => setPseTipoCliente('juridica')}><Text style={[styles.pseClientTypeText, pseTipoCliente === 'juridica' && styles.pseClientTypeTextActive]}>🏢 Persona Jurídica</Text></TouchableOpacity>
                </View>
                <Text style={styles.pseModalFieldLabel}>Entidad Financiera (Banco)</Text>
                <TouchableOpacity style={styles.pseModalBankSelect} onPress={() => { setPseModal(false); setReopenPseAfterBankSelect(true); setBankDropdownOpen(true); }}><Text style={styles.pseModalBankText}>{selectedPseBank.nombre}</Text><Text style={styles.pseDropdownChevron}>⌄</Text></TouchableOpacity>
                <View style={styles.pseModalInputGroup}>
                  <View style={styles.pseModalLabelRow}><Text style={styles.pseModalFieldLabel}>Correo electrónico registrado en PSE</Text><Text style={styles.pseModalUserBadge}>Usuario PSE</Text></View>
                  <TextInput style={styles.pseModalInput} value={pseEmail} onChangeText={setPseEmail} placeholder="ejemplo@correo.com" keyboardType="email-address" autoCapitalize="none" />
                </View>
                <Text style={styles.pseModalFieldLabel}>Número de Documento / C.C.</Text>
                <TextInput style={styles.pseModalInput} value={pseDocNumero} onChangeText={setPseDocNumero} placeholder="1020304050" keyboardType="numeric" />
                <View style={styles.pseDemoBox}>
                  <Text style={styles.pseDemoLabel}>¿Simulación con datos de prueba?</Text>
                  <TouchableOpacity style={styles.pseDemoButton} onPress={() => { setPseEmail('comprador.demo@pse.com.co'); setPseDocNumero('1098765432'); }}><Text style={styles.pseDemoButtonText}>⚡ Autocompletar</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.pseContinueButton} onPress={avanzarPse}><Text style={styles.pseContinueButtonText}>Ir a la Banca Virtual ({selectedPseBank.nombre})  ➜</Text></TouchableOpacity>
              </> : <>
                <View style={[styles.pseVirtualHeader, { backgroundColor: pseBanco === '001' ? '#000000' : pseBanco === '005' ? '#ED1C24' : pseBanco === '007' ? '#200020' : pseBanco === '002' ? '#002A54' : pseBanco === '004' ? '#0B2265' : '#0F172A', borderColor: pseBanco === '001' ? '#FDDA24' : pseBanco === '007' ? '#DA0081' : '#2563EB' }]}>
                  <Text style={styles.pseVirtualBankIcon}>{bancosPSEFrecuentes.find((bank) => bank.codigo === pseBanco)?.icono || '🏦'}</Text>
                  <Text style={styles.pseVirtualTitle}>{pseBanco === '001' ? 'Sucursal Virtual Personas · Bancolombia' : pseBanco === '005' ? 'Portal Transaccional Davivienda' : pseBanco === '007' ? 'Nequi Colombia · Pasarela PSE' : pseBanco === '002' ? 'Portal Virtual Banco de Bogotá' : pseBanco === '004' ? 'BBVA Net Móvil · Pagos PSE' : `Banca Virtual · ${selectedPseBank.nombre}`}</Text>
                  <Text style={styles.pseVirtualSubtitle}>Transacción de Débito Autorizada vía ACH</Text>
                  <Text style={styles.pseVirtualUser}>Usuario autenticado: {pseEmail}</Text>
                </View>
                <View style={styles.pseAccountSummary}>
                  <View style={styles.pseAccountRow}><Text style={styles.pseAccountLabel}>Cuenta origen:</Text><Text style={styles.pseAccountValue}>Cuenta de Ahorros **** 4821</Text></View>
                  <View style={styles.pseAccountRow}><Text style={styles.pseAccountLabel}>Valor a debitar:</Text><Text style={styles.pseAccountAmount}>{formatCurrency(totalPagar)}</Text></View>
                  <View style={styles.pseAccountRow}><Text style={styles.pseAccountLabel}>Costo de transacción:</Text><Text style={styles.pseAccountFree}>$0 (Gratuito)</Text></View>
                </View>
                <View style={styles.pseModalInputGroup}>
                  <View style={styles.pseModalLabelRow}><Text style={styles.pseModalFieldLabel}>Clave Dinámica / Token Virtual de Seguridad</Text><Text style={styles.pseOtpBadge}>Generado en App móvil</Text></View>
                  <TextInput style={styles.pseOtpInput} value={pseOtp} onChangeText={setPseOtp} placeholder="6 dígitos" keyboardType="numeric" maxLength={6} />
                </View>
                <TouchableOpacity style={[styles.pseApproveButton, pseProcessing && styles.disabledButton]} onPress={aprobarDebitoPse} disabled={pseProcessing}>
                  {pseProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.pseApproveButtonText}>✅  Aprobar Débito Bancario ({formatCurrency(totalPagar)})</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.pseModifyButton} onPress={() => setPseStep(1)} disabled={pseProcessing}><Text style={styles.pseModifyButtonText}>← Modificar datos o cambiar de banco</Text></TouchableOpacity>
              </>}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PAYPAL MODAL SIMULATION */}
      <Modal visible={paypalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>PayPal Sandbox</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo PayPal Sandbox</Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@sandbox.paypal.com"
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña Sandbox</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={paypalPassword}
                onChangeText={setPaypalPassword}
              />
            </View>

            {paypalProcessing ? (
              <ActivityIndicator size="small" color="#0070ba" style={{ marginVertical: 15 }} />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setPaypalModal(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handlePaypalSubmit}>
                  <Text style={styles.modalSubmitText}>Confirmar Pago</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8EFF1' },
  content: { padding: 14, paddingBottom: 40, gap: 14 },
  checkoutHeader: { backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: '#E5E7EB', padding: 15, marginBottom: 0, shadowColor: '#23151A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  checkoutHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  checkoutIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FDF2F4', borderWidth: 1, borderColor: '#FBCFE8', alignItems: 'center', justifyContent: 'center' },
  checkoutHeadingCopy: { flex: 1 },
  checkoutTitle: { color: '#111827', fontSize: 19, fontWeight: '900' },
  checkoutSubtitle: { color: '#6B7280', fontSize: 11, lineHeight: 16, fontWeight: '500', marginTop: 3 },
  stepper: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 5, padding: 4, paddingHorizontal: 6, borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F8F9FA', marginTop: 12 },
  stepComplete: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 11 },
  stepCompleteMark: { overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', width: 18, height: 18, borderRadius: 9, backgroundColor: '#FDF2F4', color: '#7A1E3A', fontSize: 11, fontWeight: '900' },
  stepCompleteText: { color: '#7A1E3A', fontSize: 11, fontWeight: '800' },
  stepArrow: { color: '#7A1E3A', fontSize: 18, fontWeight: '900' },
  stepCurrent: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7A1E3A', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 11 },
  stepCurrentMark: { color: '#7A1E3A', backgroundColor: 'rgba(255,255,255,0.88)', overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', width: 17, height: 17, borderRadius: 9, fontSize: 10, fontWeight: '900' },
  stepCurrentText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  backToCart: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#7A1E3A', borderRadius: 6, backgroundColor: '#fff' },
  backToCartText: { color: '#7A1E3A', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#2A2A2A', marginTop: 20, marginBottom: 12 },
  stepPanel: { backgroundColor: '#fff', borderRadius: 13, padding: 15, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#23151A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  stepPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12, marginBottom: 13, flexWrap: 'wrap' },
  stepPanelCopy: { flex: 1, minWidth: 140 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#7A1E3A', alignItems: 'center', justifyContent: 'center', shadowColor: '#7A1E3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  stepNumberText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  panelTitle: { color: '#111827', fontSize: 15, lineHeight: 20, fontWeight: '900' },
  panelSubtitle: { color: '#6B7280', fontSize: 11, lineHeight: 15, marginTop: 2 },
  modeBadge: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, maxWidth: '100%' },
  modeBadgePickup: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  modeBadgeDelivery: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  modeBadgeText: { fontSize: 10, fontWeight: '800', flexShrink: 1 },
  modeBadgePickupText: { color: '#15803D' },
  modeBadgeDeliveryText: { color: '#1E40AF' },
  deliveryOptions: { flexDirection: 'row', gap: 10 },
  deliveryOption: { flex: 1, minHeight: 164, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 11, padding: 12 },
  deliveryOptionActive: { borderColor: '#7A1E3A', borderWidth: 1.5, backgroundColor: '#FFF9FA', shadowColor: '#7A1E3A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 },
  deliveryOptionDisabled: { opacity: 0.5 },
  deliveryOptionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  deliveryIcon: { fontSize: 22, marginBottom: 8 },
  deliveryRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  deliveryRadioSelected: { borderColor: '#7A1E3A', borderWidth: 5 },
  deliveryRadioDot: { width: 0, height: 0 },
  deliveryOptionTitle: { color: '#1F2937', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  deliveryOptionTitleActive: { color: '#7A1E3A' },
  deliveryOptionText: { color: '#475569', fontSize: 10, lineHeight: 14, marginBottom: 8 },
  deliveryOptionBadge: { alignSelf: 'flex-start', color: '#166534', backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 5, overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 3, fontSize: 9, fontWeight: '800' },
  deliveryOptionBadgeActive: { color: '#7A1E3A', backgroundColor: '#FDF2F4', borderColor: '#FBCFE8' },
  deliveryPickupBadge: { color: '#166534', backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
  addressCard: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginTop: 13 },
  addressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  addressTitle: { color: '#334155', fontSize: 13, fontWeight: '800' },
  manageAddress: { color: '#7A1E3A', fontSize: 12, fontWeight: '800' },
  pickupBackLink: { alignSelf: 'flex-start', marginTop: 10 },
  addressDropdown: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 9, paddingVertical: 10, paddingHorizontal: 11 },
  addressDropdownCopy: { flex: 1 },
  addressDropdownTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 3 },
  addressDropdownMenu: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, marginTop: 5, overflow: 'hidden' },
  addressDropdownOption: { padding: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  addressPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, padding: 10, marginTop: 9 },
  addressPreviewCopy: { flex: 1 },
  destinationActiveBadge: { color: '#15803D', backgroundColor: '#DCFCE7', borderRadius: 5, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
  dropdownChevron: { color: '#7A1E3A', fontSize: 19, fontWeight: '900', paddingHorizontal: 2 },
  primaryBadge: { color: '#1D4ED8', backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', fontSize: 9, fontWeight: '800' },
  addressOptionActive: { borderColor: '#7A1E3A', backgroundColor: '#FFF9FA' },
  addressOptionTitle: { color: '#0F172A', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  addressOptionText: { color: '#475569', fontSize: 12, lineHeight: 17 },
  addressEmpty: { color: '#991B1B', backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 12, lineHeight: 17 },
  orderSummaryCard: { backgroundColor: '#fff', borderRadius: 13, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#23151A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 14, color: '#555', flex: 1, marginRight: 10 },
  itemDescription: { flex: 1, marginRight: 10 },
  itemVariant: { color: '#8A7279', fontSize: 11, marginTop: 3 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#2A2A2A' },
  summaryLineLabel: { color: '#666', fontSize: 13, flex: 1 },
  summaryLineValue: { color: '#2A2A2A', fontSize: 13, fontWeight: '700' },
  freeShipping: { color: '#15803D', fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalDivider: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: '#2A2A2A' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#C5425A' },
  couponBox: { backgroundColor: '#FCF5F6', borderWidth: 1, borderColor: '#E8C9D2', borderRadius: 10, padding: 12, marginBottom: 12 },
  couponTitle: { color: '#7A1E3A', fontWeight: '800', fontSize: 13, marginBottom: 8 },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D9B4BF', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#2A2A2A' },
  couponApplyButton: { backgroundColor: '#7A1E3A', borderRadius: 7, justifyContent: 'center', paddingHorizontal: 14 },
  couponApplyText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  couponMessage: { fontSize: 12, marginTop: 8, fontWeight: '600' },
  couponSuccess: { color: '#287A45' },
  couponError: { color: '#B32842' },
  discountLabel: { color: '#287A45', fontSize: 14, fontWeight: '700', flex: 1 },
  discountValue: { color: '#287A45', fontSize: 14, fontWeight: '800' },
  tabContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tabButton: { flexGrow: 1, flexBasis: '30%', minHeight: 56, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 12, borderColor: '#E5E7EB', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  tabButtonActive: { borderColor: '#7A1E3A', backgroundColor: '#FFF5F7', borderWidth: 2, shadowColor: '#7A1E3A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 7, elevation: 2 },
  paymentMethodIcon: { fontSize: 18 },
  tabButtonText: { fontSize: 10, color: '#666', fontWeight: '700', textAlign: 'center' },
  tabButtonTextActive: { color: '#7A1E3A', fontWeight: '800' },
  paymentSecurityBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 10, padding: 11, marginBottom: 15 },
  paymentSecurityIcon: { fontSize: 19, flexShrink: 0 },
  paymentSecurityText: { color: '#166534', fontSize: 11, lineHeight: 16, fontWeight: '600', flex: 1 },
  cardForm: { backgroundColor: 'transparent', borderRadius: 0, padding: 0, borderWidth: 0 },
  paymentCardPreview: { width: '100%', maxWidth: 380, alignSelf: 'center', aspectRatio: 1.586, borderRadius: 18, padding: 18, justifyContent: 'space-between', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#7A1E3A', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6, marginBottom: 12 },
  paymentCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paymentCardBrandArea: { height: 28, minWidth: 74, alignItems: 'flex-end', justifyContent: 'center' },
  mastercardLogo: { flexDirection: 'row', alignItems: 'center' },
  mastercardRed: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#EB001B', opacity: 0.95 },
  mastercardGold: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F79E1B', opacity: 0.95, marginLeft: -10 },
  amexLogo: { backgroundColor: '#006FCF', color: '#fff', paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden', borderRadius: 4, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  paymentCardChip: { width: 42, height: 30, borderRadius: 6, backgroundColor: '#E9B75B', borderWidth: 1, borderColor: '#B7791F', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  chipLineVertical: { position: 'absolute', width: 1, height: '100%', left: '40%', backgroundColor: 'rgba(80,45,10,0.45)' },
  chipLineHorizontal: { position: 'absolute', height: 1, width: '100%', top: '50%', backgroundColor: 'rgba(80,45,10,0.45)' },
  paymentCardBrand: { color: '#fff', fontSize: 13, fontWeight: '900', fontStyle: 'italic' },
  paymentCardNumber: { color: '#fff', fontSize: 17, lineHeight: 23, fontWeight: '700', letterSpacing: 2, fontVariant: ['tabular-nums'], textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  paymentCardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  paymentCardHolderWrap: { flex: 1, paddingRight: 8 },
  paymentCardExpiryWrap: { alignItems: 'flex-end' },
  paymentCardCaption: { color: 'rgba(255,255,255,0.68)', fontSize: 8, fontWeight: '700', marginBottom: 3 },
  paymentCardHolder: { color: '#fff', fontSize: 11, fontWeight: '800' },
  paymentCardExpiry: { color: '#fff', fontSize: 12, fontWeight: '800' },
  acceptedCardsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' },
  acceptedCardsLabel: { color: '#6B7280', fontSize: 10, fontWeight: '700' },
  cardNumberLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  cvvHint: { color: '#6B7280', fontSize: 10 },
  acceptedCardBadge: { overflow: 'hidden', borderRadius: 4, paddingVertical: 2, paddingHorizontal: 5, fontSize: 9, fontWeight: '800' },
  visaBadge: { color: '#1D4ED8', backgroundColor: '#EFF6FF' },
  mastercardBadge: { color: '#B91C1C', backgroundColor: '#FEF2F2' },
  amexBadge: { color: '#15803D', backgroundColor: '#F0FDF4' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#2A2A2A', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e0dbd4', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, fontSize: 15, color: '#2A2A2A', backgroundColor: '#fff' },
  row: { flexDirection: 'row' },
  payBtn: { backgroundColor: '#7A1E3A', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  paypalCard: { backgroundColor: 'transparent', borderRadius: 0, padding: 0, borderWidth: 0, alignItems: 'stretch' },
  paypalText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  paypalBtn: { backgroundColor: '#FFC439', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 6, width: '100%', alignItems: 'center' },
  paypalBtnText: { color: '#111', fontSize: 16, fontWeight: '700' },
  methodPanel: { gap: 14 },
  methodHeader: { borderWidth: 1.5, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  methodHeaderMain: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 190 },
  methodHeaderIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodHeaderEmoji: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  pseHeaderMark: { alignItems: 'center', justifyContent: 'center' },
  pseHeaderMarkTitle: { color: '#fff', fontSize: 12, lineHeight: 13, fontWeight: '900', letterSpacing: 0.5 },
  pseHeaderMarkSubtitle: { color: '#DBEAFE', fontSize: 6, lineHeight: 8, fontWeight: '800' },
  methodHeaderCopy: { flex: 1, minWidth: 120 },
  methodHeaderTitle: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  methodHeaderDescription: { fontSize: 11, lineHeight: 15, marginTop: 3, fontWeight: '500' },
  methodTotal: { backgroundColor: '#fff', borderWidth: 1, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, minWidth: 128, alignItems: 'flex-end' },
  methodTotalLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' },
  methodTotalValue: { color: '#7A1E3A', fontSize: 15, fontWeight: '900', marginTop: 2 },
  methodBenefits: { gap: 9 },
  methodBenefit: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  methodBenefitIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodBenefitEmoji: { fontSize: 17 },
  methodBenefitCopy: { flex: 1 },
  methodBenefitTitle: { color: '#1E293B', fontSize: 12, fontWeight: '800', marginBottom: 3 },
  methodBenefitDescription: { color: '#64748B', fontSize: 11, lineHeight: 15 },
  methodInstructions: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 13, gap: 9 },
  methodInstructionsTitle: { fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  methodStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  methodStepNumber: { width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodStepNumberText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  methodStepText: { flex: 1, color: '#475569', fontSize: 11, lineHeight: 15 },
  methodSectionLabel: { color: '#334155', fontSize: 12, lineHeight: 17, fontWeight: '800', marginBottom: -7 },
  pseBankHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3, marginBottom: 8 },
  pseSectionTitle: { color: '#334155', fontSize: 12, lineHeight: 17, fontWeight: '800', marginBottom: 8 },
  pseQuickHint: { color: '#64748B', fontSize: 9 },
  pseQuickBanks: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pseQuickBank: { flexGrow: 1, flexBasis: '30%', minWidth: 90, minHeight: 42, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  pseQuickBankActive: { backgroundColor: '#FDF2F4', borderColor: '#7A1E3A', shadowColor: '#7A1E3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 2 },
  pseBankSymbol: { fontSize: 16, fontWeight: '900' },
  pseQuickBankName: { flexShrink: 1, color: '#1E293B', fontSize: 10, fontWeight: '700' },
  pseQuickBankNameActive: { color: '#7A1E3A', fontWeight: '900' },
  pseBankCheck: { color: '#7A1E3A', fontSize: 12, fontWeight: '900' },
  pseDropdown: { minHeight: 46, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#7A1E3A', borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#7A1E3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 1 },
  pseDropdownIcon: { color: '#64748B', fontSize: 18 },
  pseDropdownName: { color: '#0F172A', flex: 1, fontSize: 13, fontWeight: '700' },
  pseDropdownChevron: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  pseInfoPanel: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, gap: 5 },
  pseInfoTitle: { color: '#334155', fontSize: 12, fontWeight: '900', marginBottom: 1 },
  pseInfoLine: { color: '#475569', fontSize: 10, lineHeight: 15 },
  pseSecurityPanel: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  pseSecurityText: { flex: 1, color: '#166534', fontSize: 10, lineHeight: 15, fontWeight: '500' },
  pseSecurityStrong: { fontWeight: '900' },
  pseLaunchButton: { minHeight: 54, backgroundColor: '#142F70', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#0F265C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  pseLaunchIcon: { color: '#fff', fontSize: 16, fontWeight: '900' },
  pseLaunchText: { color: '#fff', flexShrink: 1, textAlign: 'center', fontSize: 12, lineHeight: 17, fontWeight: '900' },
  pseLaunchArrow: { color: '#fff', fontSize: 17, fontWeight: '900' },
  bankPickerOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: 20 },
  bankPickerSheet: { maxHeight: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 14, overflow: 'hidden' },
  bankPickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  bankPickerTitle: { color: '#0F172A', fontSize: 15, fontWeight: '900', flex: 1 },
  bankPickerClose: { color: '#64748B', fontSize: 27, lineHeight: 30, paddingHorizontal: 5 },
  bankPickerList: { marginTop: 5 },
  bankPickerOption: { minHeight: 46, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bankPickerOptionSelected: { backgroundColor: '#FDF2F4' },
  bankPickerOptionText: { color: '#334155', fontSize: 13, fontWeight: '600' },
  bankPickerOptionTextSelected: { color: '#7A1E3A', fontWeight: '900' },
  bankPickerCheck: { color: '#7A1E3A', fontSize: 16, fontWeight: '900' },
  pseModalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.72)', justifyContent: 'flex-end', paddingTop: 28 },
  pseModalCard: { height: '94%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  pseModalHeader: { minHeight: 72, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#102A66', borderBottomWidth: 2, borderBottomColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pseModalBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pseModalLogo: { width: 42, height: 42, borderRadius: 22, borderWidth: 2, borderColor: '#F59E0B', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pseModalLogoTitle: { color: '#0B1E48', fontSize: 13, lineHeight: 15, fontWeight: '900', letterSpacing: 1 },
  pseModalLogoSubtitle: { color: '#2563EB', fontSize: 7, fontWeight: '900' },
  pseModalBrandCopy: { flex: 1 },
  pseModalTitle: { color: '#fff', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  pseModalSubtitle: { color: '#CBD5E1', fontSize: 10, lineHeight: 14, marginTop: 2 },
  pseModalClose: { width: 32, height: 32, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  pseModalCloseText: { color: '#fff', fontSize: 22, lineHeight: 24 },
  pseOrderSummary: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pseOrderCommerce: { flex: 1 },
  pseOrderLabel: { color: '#64748B', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  pseOrderMerchant: { color: '#0F172A', fontSize: 12, fontWeight: '900', marginTop: 2 },
  pseOrderReference: { color: '#64748B', fontSize: 9, marginTop: 2 },
  pseOrderTotal: { alignItems: 'flex-end' },
  pseOrderAmount: { color: '#7A1E3A', fontSize: 16, fontWeight: '900', marginTop: 2 },
  pseModalSteps: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  pseModalStepTab: { minHeight: 44, flex: 1, paddingHorizontal: 6, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  pseModalStepTabActive: { borderBottomWidth: 2.5, borderBottomColor: '#1A3E8A', backgroundColor: '#EFF6FF' },
  pseModalStepText: { color: '#94A3B8', fontSize: 9, lineHeight: 13, textAlign: 'center', fontWeight: '700' },
  pseModalStepTextActive: { color: '#1A3E8A', fontWeight: '900' },
  pseModalBody: { flex: 1 },
  pseModalBodyContent: { padding: 16, paddingBottom: 28, gap: 12 },
  pseModalError: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 9, padding: 10, color: '#991B1B', fontSize: 12, fontWeight: '700' },
  pseModalFieldLabel: { color: '#334155', fontSize: 11, fontWeight: '800', marginBottom: 5 },
  pseClientTypes: { flexDirection: 'row', gap: 8 },
  pseClientType: { flex: 1, minHeight: 40, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 6 },
  pseClientTypeActive: { borderColor: '#1A3E8A', backgroundColor: '#EFF6FF' },
  pseClientTypeText: { color: '#475569', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  pseClientTypeTextActive: { color: '#1A3E8A', fontWeight: '900' },
  pseModalBankSelect: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pseModalBankText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  pseModalInputGroup: { gap: 5 },
  pseModalLabelRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  pseModalUserBadge: { color: '#2563EB', fontSize: 9, fontWeight: '700' },
  pseModalInput: { minHeight: 44, width: '100%', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: '#0F172A', fontSize: 13 },
  pseDemoBox: { backgroundColor: '#F0F9FF', borderWidth: 1, borderStyle: 'dashed', borderColor: '#7DD3FC', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  pseDemoLabel: { color: '#0369A1', fontSize: 10, fontWeight: '700' },
  pseDemoButton: { backgroundColor: '#0284C7', paddingVertical: 7, paddingHorizontal: 9, borderRadius: 6 },
  pseDemoButtonText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  pseContinueButton: { minHeight: 48, backgroundColor: '#102A66', borderRadius: 11, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  pseContinueButtonText: { color: '#fff', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  pseVirtualHeader: { borderWidth: 1.5, borderRadius: 13, padding: 13, gap: 5 },
  pseVirtualBankIcon: { fontSize: 20 },
  pseVirtualTitle: { color: '#fff', fontSize: 13, lineHeight: 17, fontWeight: '900' },
  pseVirtualSubtitle: { color: '#FDE68A', fontSize: 10, fontWeight: '700' },
  pseVirtualUser: { color: '#fff', fontSize: 9, lineHeight: 14, marginTop: 5 },
  pseAccountSummary: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 11, padding: 12, gap: 9 },
  pseAccountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  pseAccountLabel: { color: '#64748B', fontSize: 10 },
  pseAccountValue: { color: '#0F172A', fontSize: 10, fontWeight: '800' },
  pseAccountAmount: { color: '#7A1E3A', fontSize: 12, fontWeight: '900' },
  pseAccountFree: { color: '#16A34A', fontSize: 10, fontWeight: '800' },
  pseOtpBadge: { backgroundColor: '#DCFCE7', color: '#15803D', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 8, fontWeight: '800', overflow: 'hidden' },
  pseOtpInput: { minHeight: 48, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, color: '#0F172A', fontSize: 18, fontWeight: '900', letterSpacing: 5, textAlign: 'center' },
  pseApproveButton: { minHeight: 50, backgroundColor: '#15803D', borderRadius: 11, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  pseApproveButtonText: { color: '#fff', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  pseModifyButton: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  pseModifyButtonText: { color: '#64748B', fontSize: 11, fontWeight: '800' },
  paypalAction: { backgroundColor: '#fff', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CBD5E1', borderRadius: 15, padding: 14, alignItems: 'center', gap: 10 },
  paypalSecurity: { color: '#15803D', textAlign: 'center', fontSize: 10, lineHeight: 15, fontWeight: '600' },
  efectyReceipt: { backgroundColor: '#fff', borderWidth: 2, borderStyle: 'dashed', borderColor: '#FCD34D', borderRadius: 15, padding: 13, gap: 12 },
  efectyReceiptHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#E5E7EB', paddingBottom: 10, gap: 7 },
  efectyKicker: { color: '#CA8A04', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  efectyTitle: { color: '#111827', fontSize: 13, fontWeight: '900', marginTop: 2 },
  efectyPending: { color: '#854D0E', backgroundColor: '#FEF9C3', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, fontSize: 8, fontWeight: '900', overflow: 'hidden' },
  efectyReceiptRow: { flexDirection: 'row', gap: 8 },
  efectyReceiptCell: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 9, padding: 9 },
  efectyCellLabel: { color: '#6B7280', fontSize: 8, fontWeight: '700', textTransform: 'uppercase' },
  efectyCellValue: { color: '#1F2937', fontSize: 12, fontWeight: '900', marginTop: 3 },
  greenPayBtn: { backgroundColor: '#15803D', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  walletCards: { gap: 12 },
  walletCard: { backgroundColor: '#fff', borderWidth: 1.5, borderRadius: 15, padding: 13, paddingTop: 25, gap: 12, position: 'relative', overflow: 'hidden' },
  walletNequi: { borderColor: '#E879F9', shadowColor: '#DA0081', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  walletDaviplata: { borderColor: '#FCA5A5', shadowColor: '#ED1C24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  walletCornerBadge: { position: 'absolute', zIndex: 1, top: 0, right: 0, paddingHorizontal: 11, paddingVertical: 4, borderBottomLeftRadius: 9 },
  walletNequiBadge: { backgroundColor: '#DA0081' },
  walletDaviplataBadge: { backgroundColor: '#ED1C24' },
  walletCornerBadgeText: { color: '#fff', fontSize: 9, lineHeight: 12, fontWeight: '900' },
  walletTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  walletLogoNequi: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#200020', alignItems: 'center', justifyContent: 'center' },
  walletLogoDaviplata: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#ED1C24', alignItems: 'center', justifyContent: 'center' },
  walletLogoText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  walletTitle: { color: '#200020', fontSize: 15, fontWeight: '900' },
  walletIssuer: { color: '#86198F', fontSize: 10, fontWeight: '700', marginTop: 1 },
  walletActionButton: { width: '100%', borderRadius: 12, overflow: 'hidden', shadowColor: '#7A1E3A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 8, elevation: 3 },
  walletActionGradient: { minHeight: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  walletActionIcon: { color: '#fff', fontSize: 18, lineHeight: 20, fontWeight: '900' },
  walletActionText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  transferShopHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6, marginBottom: 7 },
  transferVerified: { color: '#166534', backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1, borderRadius: 12, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '900' },
  methodCard: { backgroundColor: 'transparent', borderRadius: 0, padding: 0, borderWidth: 0 },
  methodTitle: { color: '#7A1E3A', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  methodText: { color: '#625B5E', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  paymentCode: { backgroundColor: '#F3E5EA', borderWidth: 1, borderColor: '#7A1E3A', borderRadius: 9, padding: 14, alignItems: 'center', marginVertical: 8 },
  paymentCodeText: { color: '#7A1E3A', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  outlineBtn: { borderWidth: 1.5, borderColor: '#7A1E3A', borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  outlineBtnText: { color: '#7A1E3A', fontSize: 15, fontWeight: '800' },
  bankList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  bankOption: { borderWidth: 1, borderColor: '#E0DBD4', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' },
  bankOptionActive: { borderColor: '#7A1E3A', backgroundColor: '#FBEDEF' },
  bankOptionText: { color: '#625B5E', fontWeight: '600', fontSize: 12 },
  bankOptionTextActive: { color: '#7A1E3A', fontWeight: '800' },
  pseTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pseTypeButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0DBD4', borderRadius: 7, padding: 10, backgroundColor: '#fff' },
  nequiBtn: { borderWidth: 2, borderColor: '#2D7D3A', borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 4, marginBottom: 9 },
  nequiBtnText: { color: '#2D7D3A', fontWeight: '800', fontSize: 15 },
  daviplataBtn: { borderWidth: 2, borderColor: '#E65100', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  daviplataBtnText: { color: '#E65100', fontWeight: '800', fontSize: 15 },
  transferDetails: { backgroundColor: '#FCFAF7', borderRadius: 8, padding: 12, marginBottom: 6 },
  transferShop: { color: '#0F172A', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  transferAmount: { color: '#7A1E3A', fontSize: 15, fontWeight: '900', marginTop: 10 },
  pickupInfoPanel: { marginTop: 13, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  pickupInfoHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
  pickupInfoTitle: { color: '#166534', fontSize: 12, fontWeight: '900', flexShrink: 1 },
  pickupCostBadge: { color: '#15803D', backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7, fontSize: 9, fontWeight: '900' },
  pickupInfoColumns: { flexDirection: 'row', gap: 12 },
  pickupInfoColumn: { flex: 1 },
  pickupInfoLabel: { color: '#1F2937', fontSize: 10, fontWeight: '900', marginBottom: 3 },
  pickupInfoText: { color: '#64748B', fontSize: 10, lineHeight: 14 },
  detailStrong: { color: '#2A2A2A', fontWeight: '800' },
  pickupCard: { backgroundColor: '#fff', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#E0DBD4' },
  pickupEyebrow: { color: '#7A1E3A', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  pickupTitle: { color: '#2A2A2A', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  pickupPinBox: { backgroundColor: '#7A1E3A', borderRadius: 10, padding: 18, alignItems: 'center', marginVertical: 12 },
  pickupPinLabel: { color: '#FDE047', fontSize: 11, fontWeight: '900' },
  pickupPin: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: 8, marginVertical: 4 },
  pickupDetails: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, padding: 12, gap: 8 },
  pickupDetail: { color: '#334155', fontSize: 12, lineHeight: 18 },
  pickupWaiting: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 8, padding: 13, marginTop: 14 },
  pickupWaitingText: { color: '#1E40AF', textAlign: 'center', fontSize: 13, fontWeight: '800' },
  arrivalBtn: { backgroundColor: '#15803D', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  arrivalBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  successPickupPin: { backgroundColor: '#166534', borderRadius: 10, padding: 16, alignItems: 'center', width: '100%', marginBottom: 20 },
  pickupPinHint: { color: '#DCFCE7', textAlign: 'center', fontSize: 12, lineHeight: 17, marginTop: 4 },
  disabledButton: { opacity: 0.5 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 10, justifyContent: 'center', alignItems: 'center' },
  overlayText: { marginTop: 15, fontSize: 16, fontWeight: '700', color: '#2A2A2A' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdfbfa', padding: 20 },
  successCard: { backgroundColor: '#fff', borderRadius: 12, padding: 30, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#e0dbd4' },
  successIcon: { fontSize: 50, color: '#C5425A', fontWeight: 'bold', marginBottom: 15 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#7A1E3A', marginBottom: 8 },
  successDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  orderSummaryBox: { backgroundColor: '#fcfaf7', borderWidth: 1, borderColor: '#e0dbd4', borderRadius: 8, padding: 15, width: '100%', marginBottom: 25 },
  summaryText: { fontSize: 14, color: '#444', marginBottom: 4 },
  homeBtn: { backgroundColor: '#7A1E3A', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 6, width: '100%', alignItems: 'center' },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 8, padding: 24 },
  modalHeader: { fontSize: 18, fontWeight: '800', color: '#003087', marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalCancel: { flex: 1, backgroundColor: '#eee', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  modalCancelText: { color: '#333', fontWeight: '700' },
  modalSubmit: { flex: 1, backgroundColor: '#0070ba', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
});
