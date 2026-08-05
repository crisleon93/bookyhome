import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api'; // Tu instancia de Axios para conectar al backend

// Configurar comportamiento de la notificación en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registrarPushToken() {
  try {
    // 1. Canal por defecto para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // 2. Pedir permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permisos de notificaciones denegados.');
      return null;
    }

    // 3. Obtener el projectId
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error('No se encontró projectId en app.json');
      return null;
    }

    // 4. Obtener Expo Push Token
    const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = pushTokenData.data;
    console.log('Push Token obtenido:', pushToken);

    // 5. Enviar token al backend FastAPI
    if (pushToken) {
      await api.post('/notificaciones/guardar-token', { token: pushToken });
      console.log('Push Token enviado correctamente al backend');
    }

    return pushToken;
  } catch (error) {
    console.error('Error registrando Push Token:', error);
    return null;
  }
}