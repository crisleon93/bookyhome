import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { getOrderDetails, processPayment } from '../services/api';
import { CartContext } from '../context/CartContext';

export default function Checkout({ route, navigation }) {
  const { orderId } = route.params;
  const { loadCart } = useContext(CartContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('tarjeta'); // 'tarjeta' | 'paypal'
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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
          payment_method: 'Tarjeta de Crédito'
        };
        const res = await processPayment(payload);
        if (res.data && res.data.ok) {
          setPaymentSuccess(true);
          await loadCart(); // Refresh cart
        } else {
          Alert.alert('Error', 'El pago fue rechazado por la pasarela.');
        }
      } catch (e) {
        Alert.alert('Error', e.response?.data?.detail || 'Ocurrió un error al procesar el pago.');
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
          payment_method: 'PayPal'
        };
        const res = await processPayment(payload);
        if (res.data && res.data.ok) {
          setPaypalModal(false);
          setPaymentSuccess(true);
          await loadCart(); // Refresh cart
        } else {
          Alert.alert('Error', 'El pago no fue aprobado.');
        }
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
          <Text style={styles.successDesc}>Tu compra ha sido procesada de manera segura.</Text>
          
          <View style={styles.orderSummaryBox}>
            <Text style={styles.summaryText}><Text style={{ fontWeight: 'bold' }}>Orden:</Text> #{orderId}</Text>
            <Text style={styles.summaryText}><Text style={{ fontWeight: 'bold' }}>Fecha:</Text> {new Date(order.fecha).toLocaleDateString('es-CO')}</Text>
            <Text style={[styles.summaryText, { color: '#C5425A', fontWeight: '700', marginTop: 5 }]}>
              <Text style={{ fontWeight: 'bold' }}>Monto:</Text> ${Number(order.total).toLocaleString('es-CO')} COP
            </Text>
          </View>

          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
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
        <View style={styles.summaryTotalRow}>
          <Text style={styles.summaryTotalLabel}>Total a Pagar</Text>
          <Text style={styles.summaryTotalValue}>${Number(order.total).toLocaleString('es-CO')} COP</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Método de Pago</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, paymentMethod === 'tarjeta' && styles.tabButtonActive]}
          onPress={() => setPaymentMethod('tarjeta')}
        >
          <Text style={[styles.tabButtonText, paymentMethod === 'tarjeta' && styles.tabButtonTextActive]}>Tarjeta de Crédito</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, paymentMethod === 'paypal' && styles.tabButtonActive]}
          onPress={() => setPaymentMethod('paypal')}
        >
          <Text style={[styles.tabButtonText, paymentMethod === 'paypal' && styles.tabButtonTextActive]}>PayPal</Text>
        </TouchableOpacity>
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
        </View>
      ) : (
        <View style={styles.paypalCard}>
          <Text style={styles.paypalText}>Paga cómodamente con tu saldo PayPal o tarjetas vinculadas.</Text>
          <TouchableOpacity 
            style={[styles.paypalBtn]} 
            onPress={() => setPaypalModal(true)}
          >
            <Text style={styles.paypalBtnText}>Pagar con PayPal</Text>
          </TouchableOpacity>
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
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#2A2A2A', marginTop: 20, marginBottom: 12 },
  orderSummaryCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e0dbd4' },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 14, color: '#555', flex: 1, marginRight: 10 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#2A2A2A' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: '#2A2A2A' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#C5425A' },
  tabContainer: { flexDirection: 'row', marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: '#e0dbd4' },
  tabButtonActive: { borderColor: '#7A1E3A' },
  tabButtonText: { fontSize: 14, color: '#666', fontWeight: '600' },
  tabButtonTextActive: { color: '#7A1E3A', fontWeight: '700' },
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
