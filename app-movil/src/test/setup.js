import { vi } from 'vitest';

process.env.EXPO_OS = 'web';

globalThis.__ExpoImportMetaRegistry__ = globalThis.__ExpoImportMetaRegistry__ || {};

vi.mock('expo-local-authentication', () => ({
  authenticateAsync: vi.fn().mockResolvedValue({ success: false }),
  hasHardwareAsync: vi.fn().mockResolvedValue(false),
  isEnrolledAsync: vi.fn().mockResolvedValue(false),
  supportedAuthenticationTypesAsync: vi.fn().mockResolvedValue([]),
}));

vi.mock('expo-clipboard', () => ({
  getStringAsync: vi.fn().mockResolvedValue(''),
  setStringAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

vi.mock('expo-image-picker', () => ({
  MediaType: { Images: 'images' },
  MediaTypeOptions: { Images: 'images' },
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ granted: false }),
  requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ granted: false }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: vi.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

vi.mock('@react-native-community/datetimepicker', () => ({
  default: () => null,
}));


class ExpoEventEmitter {
  addListener() {
    return { remove: () => {} };
  }

  removeAllListeners() {}

  emit() {}

  listenerCount() {
    return 0;
  }
}

if (!globalThis.expo) {
  globalThis.expo = {};
}

if (!globalThis.expo.EventEmitter) {
  globalThis.expo.EventEmitter = ExpoEventEmitter;
}
