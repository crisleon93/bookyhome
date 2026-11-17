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

vi.mock('@react-native-community/datetimepicker', () => ({
  default: () => null,
}));

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: vi.fn(), goBack: vi.fn(), setOptions: vi.fn() }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: () => {},
}));

vi.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

vi.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
}));

vi.mock('react-native-reanimated', () => ({}));

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
