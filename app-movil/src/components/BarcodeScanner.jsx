// src/components/BarcodeScanner.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Modal, ActivityIndicator, Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconClose, IconCamera } from './Icons';

const { width, height } = Dimensions.get('window');
const VINOTINTO = '#7A1E3A';
const WHITE = '#FFFFFF';

export default function BarcodeScanner({ visible, onClose, onBarcodeDetected }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <IconCamera size={60} color={VINOTINTO} />
            <Text style={styles.permissionTitle}>Permiso de cámara requerido</Text>
            <Text style={styles.permissionText}>
              BookyHome necesita acceso a la cámara para escanear códigos de barras de libros.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Conceder permiso</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Validar que sea un ISBN válido (10 o 13 dígitos)
      const cleanedData = data.replace(/[-\s]/g, '').toUpperCase();
      const isValidISBN = /^\d{9}[\dX]$/.test(cleanedData) || /^\d{13}$/.test(cleanedData);

      if (!isValidISBN) {
        Alert.alert(
          'Código no reconocido',
          'Este no parece ser un código ISBN válido. Por favor intenta escanear el código de barras del libro.',
          [
            { text: 'OK', onPress: () => { setScanned(false); setLoading(false); } }
          ]
        );
        return;
      }

      // Llamar al callback con el ISBN detectado
      await onBarcodeDetected(cleanedData);
      
      // Cerrar el escáner después de un escaneo exitoso
      setTimeout(() => {
        onClose();
        setScanned(false);
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('Error procesando código de barras:', error);
      Alert.alert(
        'Error',
        'Hubo un error al procesar el código de barras. Por favor intenta nuevamente.',
        [
          { text: 'OK', onPress: () => { setScanned(false); setLoading(false); } }
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93'],
          }}
        >
          {/* Overlay de guía de escaneo */}
          <View style={styles.overlay}>
            <View style={styles.topOverlay} />
            <View style={styles.middleRow}>
              <View style={styles.sideOverlay} />
              <View style={styles.scanArea}>
                <View style={styles.scanCorner} />
                <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
                <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
                <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
                <Text style={styles.scanText}>
                  {loading ? 'Procesando...' : 'Centra el código de barras aquí'}
                </Text>
                {loading && (
                  <ActivityIndicator size="large" color={VINOTINTO} style={styles.loading} />
                )}
              </View>
              <View style={styles.sideOverlay} />
            </View>
            <View style={styles.bottomOverlay}>
              <Text style={styles.bottomText}>
                Escanea el código de barras de la contraportada del libro
              </Text>
            </View>
          </View>

          {/* Botón de cerrar */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconClose size={24} color={WHITE} />
          </TouchableOpacity>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topOverlay: {
    flex: 1,
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: VINOTINTO,
    borderWidth: 3,
    top: -3,
    left: -3,
  },
  scanCornerTopRight: {
    left: 'auto',
    right: -3,
  },
  scanCornerBottomLeft: {
    top: 'auto',
    bottom: -3,
    left: -3,
  },
  scanCornerBottomRight: {
    top: 'auto',
    bottom: -3,
    left: 'auto',
    right: -3,
  },
  scanText: {
    color: WHITE,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  loading: {
    marginTop: 10,
  },
  bottomOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  bottomText: {
    color: WHITE,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 30,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: WHITE,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: VINOTINTO,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
  },
  permissionButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  cancelButtonText: {
    color: WHITE,
    fontSize: 16,
    textAlign: 'center',
  },
});