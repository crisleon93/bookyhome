import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Linking } from 'react-native';
import { aplicarCupon, getOrderDetails, processPayment, getApiBaseUrl, sendConfirmationEmail, validarCupon } from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

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
  const [pseBanco, setPseBanco] = useState('');
  const [sucursalCodigo, setSucursalCodigo] = useState('');

  const subtotal = Number(order?.total || 0);
  const totalPagar = Math.max(0, subtotal - discountAmount);
  const bancosPSE = ['Bancolombia', 'Banco de Bogotá', 'Banco Popular', 'BBVA Colombia', 'Davivienda', 'Banco de Occidente'];

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getOrderDetails(orderId);
        setOrder(res.data);
        if (res.data.estado === 'pagado') {
          setPaymentSuccess(true);
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

    try {
      await sendConfirmationEmail(orderId);
      setEmailConfirmation('Enviamos un correo con los detalles de tu pedido.');
    } catch (error) {
      console.warn('El pago fue aprobado, pero no se pudo enviar el correo:', error.message);
      setEmailConfirmation('Tu pago fue aprobado. No pudimos enviar el correo de confirmación; consulta tu historial de compras.');
    }

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
      const res = await validarCupon({ codigo, order_id: Number(orderId), total: subtotal });
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
    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        await finalizarPago({
          order_id: Number(orderId),
          amount: totalPagar,
          payment_method: metodo,
          ...(discountAmount > 0 ? { coupon_code: couponCode.trim() } : {}),
        });
        await registrarCuponSiAplica();
      } catch (error) {
        Alert.alert('Error', error.response?.data?.detail || error.message || 'No se pudo procesar el pago.');
      } finally {
        setPaymentProcessing(false);
      }
    }, 1200);
  };

  const registrarCuponSiAplica = async () => {
    if (discountAmount <= 0) return;
    try {
      await aplicarCupon({ codigo: couponCode.trim(), id_orden: Number(orderId), total: subtotal });
    } catch (error) {
      console.warn('El pago fue aprobado, pero no se pudo registrar el cupón:', error.message);
    }
  };

  const pagarConBilletera = async (billetera) => {
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

    setPaymentProcessing(true);
    
    // Simulate transaction processing
    setTimeout(async () => {
      try {
        const payload = {
          order_id: parseInt(orderId),
          amount: parseFloat(order.total),
          payment_method: 'Tarjeta de Crédito',
          ...(discountAmount > 0 ? { coupon_code: couponCode.trim() } : {})
        };
        await finalizarPago(payload);
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
        const payload = {
          order_id: parseInt(orderId),
          amount: parseFloat(order.total),
          payment_method: 'PayPal',
          ...(discountAmount > 0 ? { coupon_code: couponCode.trim() } : {})
        };
        await finalizarPago(payload);
        await registrarCuponSiAplica();
        setPaypalModal(false);
      } catch (e) {
        Alert.alert('Error', e.response?.data?.detail || 'Error al conectar con PayPal.');
      } finally {
        setPaypalProcessing(false);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A1E3A" />
        <Text style={styles.loadingText}>Cargando detalles del pago...</Text>
      </View>
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
              <Text style={{ fontWeight: 'bold' }}>Monto:</Text> ${Number(order.total).toLocaleString('es-CO')} COP
            </Text>
          </View>
          
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

      <Text style={styles.sectionHeader}>Resumen de la orden</Text>
      <View style={styles.orderSummaryCard}>
        {order.items?.map((item) => (
          <View key={item.id_libro} style={styles.summaryItem}>
            <Text style={styles.itemName} numberOfLines={1}>{item.titulo} (x{item.cantidad})</Text>
            <Text style={styles.itemPrice}>${Number(item.precio_libro * item.cantidad).toLocaleString('es-CO')}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.couponBox}>
          <Text style={styles.couponTitle}>Código de cupón</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Ingresa tu cupón"
              autoCapitalize="characters"
              value={couponCode}
              onChangeText={(value) => { setCouponCode(value); setDiscountAmount(0); setCouponMessage(''); }}
            />
            <TouchableOpacity style={styles.couponApplyButton} onPress={aplicarCodigoCupon} disabled={couponLoading}>
              <Text style={styles.couponApplyText}>{couponLoading ? '...' : 'Aplicar'}</Text>
            </TouchableOpacity>
          </View>
          {!!couponMessage && <Text style={[styles.couponMessage, discountAmount > 0 ? styles.couponSuccess : styles.couponError]}>{couponMessage}</Text>}
        </View>
        {discountAmount > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.discountLabel}>Descuento</Text>
            <Text style={styles.discountValue}>-${discountAmount.toLocaleString('es-CO')}</Text>
          </View>
        )}
        <View style={styles.summaryTotalRow}>
          <Text style={styles.summaryTotalLabel}>Total a Pagar</Text>
          <Text style={styles.summaryTotalValue}>${totalPagar.toLocaleString('es-CO')} COP</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Método de Pago</Text>
      <View style={styles.tabContainer}>
        {[
          ['tarjeta', 'Tarjeta'], ['paypal', 'PayPal'], ['sucursal', 'Punto autorizado'],
          ['pse', 'PSE'], ['billetera', 'Nequi/Daviplata'], ['transferencia', 'Transferencia'],
        ].map(([id, label]) => (
          <TouchableOpacity key={id} style={[styles.tabButton, paymentMethod === id && styles.tabButtonActive]} onPress={() => setPaymentMethod(id)}>
            <Text style={[styles.tabButtonText, paymentMethod === id && styles.tabButtonTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentMethod === 'tarjeta' ? (
        <View style={styles.cardForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Titular</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan Pérez"
              value={cardName}
              onChangeText={setCardName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de Tarjeta</Text>
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
              <Text style={styles.label}>Vencimiento</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                keyboardType="numeric"
                value={cardExpiry}
                onChangeText={handleExpiryChange}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>CVV</Text>
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

          <TouchableOpacity style={styles.payBtn} onPress={handleCardSubmit}>
            <Text style={styles.payBtnText}>Confirmar Pago</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.backToCart}>
            <Text style={styles.backToCartText}>Volver al carrito</Text>
          </TouchableOpacity>
        </View>
      ) : paymentMethod === 'paypal' ? (
        <View style={styles.paypalCard}>
          <Text style={styles.paypalText}>Paga cómodamente con tu saldo PayPal o tarjetas vinculadas.</Text>
          <TouchableOpacity 
            style={[styles.paypalBtn]} 
            onPress={() => setPaypalModal(true)}
          >
            <Text style={styles.paypalBtnText}>Pagar con PayPal</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {paymentMethod === 'sucursal' && (
        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>Pago en punto autorizado</Text>
          <Text style={styles.methodText}>Generaremos un código para pagar en un punto Efecty autorizado.</Text>
          {sucursalCodigo ? <View style={styles.paymentCode}><Text style={styles.paymentCodeText}>{sucursalCodigo}</Text></View> : null}
          <TouchableOpacity style={styles.payBtn} onPress={() => setSucursalCodigo(Math.random().toString(36).slice(2, 12).toUpperCase())}>
            <Text style={styles.payBtnText}>{sucursalCodigo ? 'Código generado' : 'Generar código de pago'}</Text>
          </TouchableOpacity>
          {sucursalCodigo ? <TouchableOpacity style={styles.outlineBtn} onPress={() => confirmarPagoAlternativo('Pago en Efecty')}><Text style={styles.outlineBtnText}>Ya realicé el pago</Text></TouchableOpacity> : null}
        </View>
      )}

      {paymentMethod === 'pse' && (
        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>Pago con PSE</Text>
          <Text style={styles.methodText}>Selecciona el banco desde el que realizarás el pago.</Text>
          <View style={styles.bankList}>{bancosPSE.map((banco) => <TouchableOpacity key={banco} style={[styles.bankOption, pseBanco === banco && styles.bankOptionActive]} onPress={() => setPseBanco(banco)}><Text style={[styles.bankOptionText, pseBanco === banco && styles.bankOptionTextActive]}>{banco}</Text></TouchableOpacity>)}</View>
          <TouchableOpacity style={[styles.payBtn, !pseBanco && styles.disabledButton]} disabled={!pseBanco} onPress={() => confirmarPagoAlternativo('PSE')}><Text style={styles.payBtnText}>Confirmar pago con PSE</Text></TouchableOpacity>
        </View>
      )}

      {paymentMethod === 'billetera' && (
        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>Pago con Nequi/Daviplata</Text>
          <Text style={styles.methodText}>Abriremos la billetera seleccionada con el valor y la referencia de tu orden.</Text>
          <TouchableOpacity style={styles.nequiBtn} onPress={() => pagarConBilletera('Nequi')}><Text style={styles.nequiBtnText}>Pagar con Nequi</Text></TouchableOpacity>
          <TouchableOpacity style={styles.daviplataBtn} onPress={() => pagarConBilletera('Daviplata')}><Text style={styles.daviplataBtnText}>Pagar con Daviplata</Text></TouchableOpacity>
        </View>
      )}

      {paymentMethod === 'transferencia' && (
        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>Transferencia bancaria</Text>
          <View style={styles.transferDetails}>
            <Text style={styles.methodText}>Banco: <Text style={styles.detailStrong}>Bancolombia</Text></Text>
            <Text style={styles.methodText}>Tipo: <Text style={styles.detailStrong}>Ahorros</Text></Text>
            <Text style={styles.methodText}>Cuenta: <Text style={styles.detailStrong}>123-456789-0</Text></Text>
            <Text style={styles.methodText}>Titular: <Text style={styles.detailStrong}>BookyHome S.A.S</Text></Text>
          </View>
          <TouchableOpacity style={styles.payBtn} onPress={() => confirmarPagoAlternativo('Transferencia Bancaria')}><Text style={styles.payBtnText}>Confirmar transferencia</Text></TouchableOpacity>
        </View>
      )}

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
  container: { flex: 1, backgroundColor: '#fdfbfa' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  backToCart: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#7A1E3A', borderRadius: 6, backgroundColor: '#fff' },
  backToCartText: { color: '#7A1E3A', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#2A2A2A', marginTop: 20, marginBottom: 12 },
  orderSummaryCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e0dbd4' },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 14, color: '#555', flex: 1, marginRight: 10 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#2A2A2A' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  tabContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tabButton: { width: '31%', minHeight: 48, paddingHorizontal: 7, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 9, borderColor: '#E0DBD4', backgroundColor: '#fff' },
  tabButtonActive: { borderColor: '#7A1E3A', backgroundColor: '#FBEDEF', borderWidth: 2 },
  tabButtonText: { fontSize: 11, color: '#666', fontWeight: '700', textAlign: 'center' },
  tabButtonTextActive: { color: '#7A1E3A', fontWeight: '800' },
  cardForm: { backgroundColor: '#fff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e0dbd4' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#2A2A2A', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e0dbd4', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, fontSize: 15, color: '#2A2A2A', backgroundColor: '#fff' },
  row: { flexDirection: 'row' },
  payBtn: { backgroundColor: '#7A1E3A', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  paypalCard: { backgroundColor: '#fff', borderRadius: 8, padding: 24, borderWidth: 1, borderColor: '#e0dbd4', alignItems: 'center' },
  paypalText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  paypalBtn: { backgroundColor: '#FFC439', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 6, width: '100%', alignItems: 'center' },
  paypalBtnText: { color: '#111', fontSize: 16, fontWeight: '700' },
  methodCard: { backgroundColor: '#fff', borderRadius: 10, padding: 18, borderWidth: 1, borderColor: '#E0DBD4' },
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
  nequiBtn: { borderWidth: 2, borderColor: '#2D7D3A', borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 4, marginBottom: 9 },
  nequiBtnText: { color: '#2D7D3A', fontWeight: '800', fontSize: 15 },
  daviplataBtn: { borderWidth: 2, borderColor: '#E65100', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  daviplataBtnText: { color: '#E65100', fontWeight: '800', fontSize: 15 },
  transferDetails: { backgroundColor: '#FCFAF7', borderRadius: 8, padding: 12, marginBottom: 6 },
  detailStrong: { color: '#2A2A2A', fontWeight: '800' },
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
