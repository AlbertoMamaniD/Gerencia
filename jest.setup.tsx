/* Configuración global de pruebas. */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Los gráficos SVG no aportan a las pruebas de lógica/UI; se reemplazan por un marcador.
jest.mock('react-native-gifted-charts', () => {
  const { View } = jest.requireActual('react-native');
  return {
    LineChart: () => <View testID="line-chart" />,
    BarChart: () => <View testID="bar-chart" />,
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  AndroidImportance: { HIGH: 4 },
}));

// Los íconos cargan una fuente como asset; en pruebas basta un marcador sin texto.
jest.mock('@expo/vector-icons', () => {
  const { View } = jest.requireActual('react-native');
  const MaterialCommunityIcons = (props: { name: string }) => <View testID={`icon-${props.name}`} />;
  MaterialCommunityIcons.glyphMap = {};
  return { MaterialCommunityIcons };
});

// Reanimated 4 / Worklets: mock mínimo con las APIs que usa la app (sin módulo nativo en Jest).
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const identity = (value: unknown) => value;
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (factory: () => object) => factory(),
    useReducedMotion: () => false,
    withTiming: identity,
    withRepeat: identity,
    cancelAnimation: jest.fn(),
    Easing: { inOut: () => identity, quad: identity },
  };
});

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
