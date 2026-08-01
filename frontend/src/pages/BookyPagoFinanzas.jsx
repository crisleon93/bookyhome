import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { notify } from '../components/ToastProvider';
import {
  IconWallet, IconTrendingUp, IconArrowDown, IconRefresh,
  IconPackage, IconStore, IconBolt, IconChartBar
} from '../components/Icons';

const VINOTINTO = '#7A1E3A';
const VINOTINTO_DARK = '#5e1629';
const BEIGE = '#F4EDE2';
const CARBON = '#2A2A2A';
const GRAY = '#666';
const WHITE = '#FFFFFF';
const BORDER = '#E0DBD4';
const GREEN = '#2e7d32';
const ORANGE = '#e67e22';
const RED = '#c62828';

export default function BookyPagoFinanzas() {
  const [activeTab, setActiveTab] = useState('balance');
  const [balance, setBalance] = useState({});
  const [estadisticas, setEstadisticas] = useState({});
  const [historial, setHistorial] = useState({});
  const [loading, setLoading] = useState(false);
  const [token] = useState(localStorage.getItem('token'));
  
  // Estado para nómina
  const [nomina, setNomina] = useState({});
  const [cuentasBancarias, setCuentasBancarias] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState(null);
  const [selectedCuentaId, setSelectedCuentaId] = useState(null);
  const [loadingCuentasModal, setLoadingCuentasModal] = useState(false);
  const [cuentaExito, setCuentaExito] = useState(null);
  const [mostrarExitoPago, setMostrarExitoPago] = useState(false);

  useEffect(() => {
    cargarBalance();
    cargarEstadisticas();
    cargarHistorial();
    cargarNomina();
  }, []);

  const cargarBalance = async () => {
    try {
      const response = await api.get('/api/v1/bookypago-finanzas/balance');
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error cargando balance:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await api.get('/api/v1/bookypago-finanzas/estadisticas');
      setEstadisticas(response.data.estadisticas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const cargarHistorial = async () => {
    try {
      const response = await api.get('/api/v1/bookypago-finanzas/historial?dias=30');
      setHistorial(response.data.historial);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const cargarNomina = async () => {
    try {
      const response = await api.get('/api/v1/bookypago-finanzas/nomina');
      setNomina(response.data.nomina);
    } catch (error) {
      console.error('Error cargando nómina:', error);
    }
  };

  const cargarCuentasBancarias = async (idVendedor) => {
    try {
      const response = await api.get(`/api/v1/bookypago-finanzas/cuentas-bancarias/${idVendedor}`);
      setCuentasBancarias(prev => ({
        ...prev,
        [idVendedor]: response.data.cuentas
      }));
      return response.data.cuentas;
    } catch (error) {
      console.error('Error cargando cuentas bancarias:', error);
      return [];
    }
  };

  const handleProcesarNomina = async (idVendedor) => {
    setSelectedVendedor(idVendedor);
    setSelectedCuentaId(null);
    setShowPaymentModal(true);
    setLoadingCuentasModal(true);
    try {
      const cuentas = await cargarCuentasBancarias(idVendedor);
      const principal = cuentas.find((c) => c.es_principal) || cuentas[0] || null;
      setSelectedCuentaId(principal?.id_metodo ?? null);
    } finally {
      setLoadingCuentasModal(false);
    }
  };

  const confirmarProcesarNomina = async () => {
    if (!selectedCuentaId) {
      notify('El vendedor no tiene una cuenta bancaria registrada para recibir el pago', 'error');
      return;
    }

    try {
      const response = await api.post(`/api/v1/bookypago-finanzas/nomina/procesar/${selectedVendedor}`, {
        id_metodo: selectedCuentaId,
      });

      if (response.data.ok) {
        setCuentaExito(response.data.cuenta_bancaria || null);
        setShowPaymentModal(false);
        setSelectedVendedor(null);
        setSelectedCuentaId(null);
        setMostrarExitoPago(true);
        cargarNomina();
        cargarBalance();
        cargarHistorial();

        setTimeout(() => {
          setMostrarExitoPago(false);
          setCuentaExito(null);
        }, 5000);
      }
    } catch (error) {
      notify(error.response?.data?.detail || 'Error procesando nómina', 'error');
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: BEIGE, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: WHITE, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                backgroundColor: VINOTINTO, 
                borderRadius: '12px', 
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconWallet width={32} height={32} strokeWidth={2} style={{ color: WHITE }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: CARBON }}>
                  BookyPago Finanzas
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: GRAY }}>
                  Sistema de gestión financiera de BookyHome
                </p>
              </div>
            </div>
            <button 
              onClick={() => { cargarBalance(); cargarEstadisticas(); cargarHistorial(); }}
              style={{
                backgroundColor: VINOTINTO,
                color: WHITE,
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <IconRefresh width={16} height={16} strokeWidth={2} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Balance Principal */}
        <div style={{ 
          backgroundColor: VINOTINTO, 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          color: WHITE,
          backgroundImage: 'linear-gradient(135deg, #7A1E3A 0%, #5e1629 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Balance Actual</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>
                {formatearMoneda(balance.balance || 0)}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Ingresos Totales</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                {formatearMoneda(balance.ingresos_totales || 0)}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Pagos Totales</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                {formatearMoneda(balance.pagos_totales || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          backgroundColor: WHITE, 
          borderRadius: '12px', 
          padding: '8px',
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {[
            { id: 'balance', label: 'Balance', icon: IconWallet },
            { id: 'estadisticas', label: 'Estadísticas', icon: IconChartBar },
            { id: 'historial', label: 'Historial', icon: IconTrendingUp },
            { id: 'nomina', label: 'Nómina', icon: IconStore }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === tab.id ? VINOTINTO : 'transparent',
                color: activeTab === tab.id ? WHITE : CARBON,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon width={18} height={18} strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ backgroundColor: WHITE, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          
          {/* Tab: Balance */}
          {activeTab === 'balance' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: CARBON }}>Detalle Financiero</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Ingresos por Ventas</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: GREEN }}>
                    {formatearMoneda((balance.ingresos_por_tipo?.venta || 0))}
                  </p>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Ingresos por Planes</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: GREEN }}>
                    {formatearMoneda((balance.ingresos_por_tipo?.plan || 0))}
                  </p>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Ingresos por Impulsos</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: GREEN }}>
                    {formatearMoneda((balance.ingresos_por_tipo?.impulso || 0))}
                  </p>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Pagos Pendientes</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: ORANGE }}>
                    {balance.pagos_pendientes || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Estadísticas */}
          {activeTab === 'estadisticas' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: CARBON }}>Estadísticas Financieras</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Ingresos 30 días</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: GREEN }}>
                    {formatearMoneda(estadisticas.ingresos_30_dias || 0)}
                  </p>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Pagos 30 días</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: ORANGE }}>
                    {formatearMoneda(estadisticas.pagos_30_dias || 0)}
                  </p>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Promedio Diario</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: VINOTINTO }}>
                    {formatearMoneda(estadisticas.promedio_diario || 0)}
                  </p>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Ventas Totales</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: CARBON }}>
                    {estadisticas.ventas_totales || 0}
                  </p>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Planes Activos</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: CARBON }}>
                    {estadisticas.planes_activos || 0}
                  </p>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: BEIGE, 
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Impulsos Comprados</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: CARBON }}>
                    {estadisticas.impulsos_comprados || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Historial */}
          {activeTab === 'historial' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: CARBON }}>Historial Financiero (Últimos 30 días)</h3>
              
              <h4 style={{ margin: '0 0 12px 0', color: CARBON }}>Ingresos</h4>
              {historial.ingresos && historial.ingresos.length > 0 ? (
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: CARBON }}>Fecha</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: CARBON }}>Tipo</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: CARBON }}>Monto</th>
                        <th style={{ padding: '12px', textAlign: 'center', color: CARBON }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.ingresos.map((ing) => (
                        <tr key={ing.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ padding: '12px', color: CARBON }}>
                            {new Date(ing.fecha).toLocaleString('es-CO')}
                          </td>
                          <td style={{ padding: '12px', color: CARBON }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {ing.tipo === 'venta' && <IconPackage width={16} height={16} strokeWidth={2} style={{ color: VINOTINTO }} />}
                              {ing.tipo === 'plan' && <IconStore width={16} height={16} strokeWidth={2} style={{ color: VINOTINTO }} />}
                              {ing.tipo === 'impulso' && <IconBolt width={16} height={16} strokeWidth={2} style={{ color: VINOTINTO }} />}
                              {ing.tipo.charAt(0).toUpperCase() + ing.tipo.slice(1)}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: CARBON, fontWeight: 'bold' }}>
                            {formatearMoneda(ing.monto)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: '#e8f5e9',
                              color: GREEN
                            }}>
                              {ing.estado.charAt(0).toUpperCase() + ing.estado.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: GRAY, textAlign: 'center', padding: '20px' }}>No hay ingresos registrados</p>
              )}
              
              <h4 style={{ margin: '0 0 12px 0', color: CARBON }}>Pagos</h4>
              {historial.pagos && historial.pagos.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: CARBON }}>Fecha</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: CARBON }}>Tipo</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: CARBON }}>Monto</th>
                        <th style={{ padding: '12px', textAlign: 'center', color: CARBON }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.pagos.map((pag) => (
                        <tr key={pag.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ padding: '12px', color: CARBON }}>
                            {new Date(pag.fecha).toLocaleString('es-CO')}
                          </td>
                          <td style={{ padding: '12px', color: CARBON }}>
                            {pag.tipo.charAt(0).toUpperCase() + pag.tipo.slice(1)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: CARBON, fontWeight: 'bold' }}>
                            {formatearMoneda(pag.monto)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: '#e8f5e9',
                              color: GREEN
                            }}>
                              {pag.estado.charAt(0).toUpperCase() + pag.estado.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: GRAY, textAlign: 'center', padding: '20px' }}>No hay pagos registrados</p>
              )}
            </div>
          )}

          {/* Tab: Nómina */}
          {activeTab === 'nomina' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: CARBON }}>Nómina de Pagos a Vendedores</h3>
              
              <div style={{ 
                padding: '16px', 
                backgroundColor: BEIGE, 
                borderRadius: '8px',
                marginBottom: '16px',
                border: `1px solid ${BORDER}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Total General Pendiente</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: VINOTINTO }}>
                      {formatearMoneda(nomina.total_general || 0)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: GRAY }}>Total Pagos Pendientes</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: CARBON }}>
                      {nomina.total_pagos || 0}
                    </p>
                  </div>
                </div>
              </div>

              {nomina.vendedores && nomina.vendedores.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {nomina.vendedores.map((vendedor) => (
                    <div key={vendedor.id_vendedor} style={{ 
                      padding: '16px', 
                      backgroundColor: WHITE, 
                      borderRadius: '8px',
                      border: `1px solid ${BORDER}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0, color: CARBON }}>Vendedor ID: {vendedor.id_vendedor}</h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: GRAY }}>
                            {vendedor.pagos.length} pagos pendientes
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: GREEN }}>
                            {formatearMoneda(vendedor.total_pendiente)}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ 
                        maxHeight: '120px', 
                        overflowY: 'auto', 
                        marginBottom: '12px',
                        fontSize: '12px',
                        color: GRAY
                      }}>
                        {vendedor.pagos.map((pago, idx) => (
                          <div key={idx} style={{ 
                            padding: '4px 0', 
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <span>Orden #{pago.id_venta}</span>
                            <span>{formatearMoneda(pago.monto)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => handleProcesarNomina(vendedor.id_vendedor)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: VINOTINTO,
                          color: WHITE,
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px',
                          width: '100%'
                        }}
                      >
                        Procesar Pago a Vendedor
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: GRAY, textAlign: 'center', padding: '20px' }}>
                  No hay pagos pendientes en nómina
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Selección de Cuenta Bancaria */}
      {showPaymentModal && selectedVendedor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: WHITE,
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '550px',
            width: '95%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: CARBON, fontSize: '1.4rem', fontWeight: '700' }}>
                Procesar Pago a Vendedor #{selectedVendedor}
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedVendedor(null);
                  setSelectedCuentaId(null);
                }}
                style={{
                  background: 'none', border: 'none', fontSize: '1.5rem',
                  cursor: 'pointer', color: '#999', padding: '5px',
                  borderRadius: '50%', width: '35px', height: '35px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <p style={{ margin: '0 0 20px 0', color: GRAY, fontSize: '0.95rem' }}>
              Cuenta bancaria registrada por el vendedor para recibir el pago:
            </p>

            {loadingCuentasModal ? (
              <p style={{ color: GRAY, textAlign: 'center', padding: '20px' }}>
                Cargando datos bancarios del vendedor...
              </p>
            ) : cuentasBancarias[selectedVendedor] && cuentasBancarias[selectedVendedor].length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {cuentasBancarias[selectedVendedor].map((cuenta) => {
                  const seleccionada = selectedCuentaId === cuenta.id_metodo;
                  return (
                  <div
                    key={cuenta.id_metodo}
                    onClick={() => setSelectedCuentaId(cuenta.id_metodo)}
                    style={{
                      padding: '16px',
                      border: seleccionada ? `2px solid ${VINOTINTO}` : `1px solid ${BORDER}`,
                      borderRadius: '8px',
                      backgroundColor: seleccionada ? '#fdf7f9' : WHITE,
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: CARBON, marginBottom: '4px', fontSize: '1.05rem' }}>
                          {cuenta.banco}
                        </div>
                        <div style={{ fontSize: '14px', color: GRAY }}>
                          {cuenta.tipo_cuenta} · N.º {cuenta.numero_cuenta}
                        </div>
                        <div style={{ fontSize: '12px', color: GRAY, marginTop: '4px' }}>
                          Titular: {cuenta.nombre_titular}
                          {cuenta.cedula_titular ? ` · CC ${cuenta.cedula_titular}` : ''}
                        </div>
                      </div>
                      {cuenta.es_principal && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: VINOTINTO,
                          color: WHITE,
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          Principal
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#fff8e6',
                border: '1px solid #f0d78c',
                color: '#7a5c00',
                fontSize: '0.9rem',
                marginBottom: '20px'
              }}>
                Este vendedor aún no ha registrado cuentas bancarias en Mi Tienda.
                Debe agregarlas en la sección de métodos de cobro antes de procesar la nómina.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedVendedor(null);
                  setSelectedCuentaId(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  color: CARBON,
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarProcesarNomina}
                disabled={!selectedCuentaId || loadingCuentasModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: VINOTINTO,
                  color: WHITE,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!selectedCuentaId || loadingCuentasModal) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedCuentaId || loadingCuentasModal) ? 0.6 : 1,
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Procesar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito al procesar pago */}
      {mostrarExitoPago && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: WHITE,
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '400px',
            width: '95%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', fontWeight: '700', color: '#16a34a' }}>
                ¡Pago procesado exitosamente!
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.95rem', lineHeight: 1.5 }}>
                El pago al vendedor ha sido procesado correctamente.
                {cuentaExito && (
                  <>
                    <br /><br />
                    <strong>Banco:</strong> {cuentaExito.banco}<br />
                    <strong>Cuenta:</strong> {cuentaExito.tipo_cuenta} · {cuentaExito.numero_cuenta}<br />
                    <strong>Titular:</strong> {cuentaExito.titular}
                  </>
                )}
              </p>
              <button
                onClick={() => setMostrarExitoPago(false)}
                style={{
                  background: '#16a34a',
                  color: WHITE,
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '1rem',
                  marginTop: '20px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#15803d'}
                onMouseLeave={(e) => e.target.style.background = '#16a34a'}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}