import '@testing-library/react-native/matchers';

// Avoid loading native WebBrowser / auth-session in Jest (pulls in via auth → OAuth helpers).
// Default mocks must return the same shapes as the Expo APIs when awaited (see signInWithOAuthProvider).
jest.mock('expo-web-browser', () => ({
  __esModule: true,
  openAuthSessionAsync: jest
    .fn()
    .mockResolvedValue({ type: 'success', url: 'https://example.com/callback' }),
  dismissBrowser: jest.fn().mockResolvedValue(undefined),
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
  maybeCompleteAuthSession: jest.fn().mockReturnValue(true),
  warmUpAsync: jest.fn().mockResolvedValue(undefined),
  coolDownAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-auth-session', () => ({
  __esModule: true,
  makeRedirectUri: jest.fn(() => 'exp://localhost'),
}));

// Mock expo-blur
jest.mock('expo-blur', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { BlurView: View };
});

// Mock expo-web-browser (native modules unavailable in jest environment).
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'cancel' })),
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock expo-auth-session used alongside expo-web-browser for OAuth flows.
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'exp://localhost:19000'),
}));

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
