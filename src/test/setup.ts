import '@testing-library/react-native/matchers';

// Mock react-native-worklets (reanimated dependency)
jest.mock('react-native-worklets', () => ({}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (component: unknown) => component,
      View,
      Image: View,
      ScrollView: View,
    },
    useSharedValue: (init: number) => ({ value: init }),
    useAnimatedStyle: (fn: () => object) => fn(),
    useAnimatedScrollHandler: () => () => {},
    withTiming: (val: number) => val,
    withSpring: (val: number) => val,
    interpolate: (val: number, _input: number[], output: number[]) => output[1] ?? val,
    Easing: { in: (fn: unknown) => fn, out: (fn: unknown) => fn, ease: (v: number) => v },
    FadeInUp: {
      duration: () => ({
        delay: () => ({}),
      }),
    },
    createAnimatedComponent: (component: unknown) => component,
  };
});

// Mock expo-blur
jest.mock('expo-blur', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { BlurView: View };
});

// Global mock for AsyncStorage (used by theme preference, supabase, etc.)
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));
