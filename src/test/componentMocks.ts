/**
 * Shared component/library mock factories for screen tests.
 *
 * Usage:
 *   import { mockSafeAreaContext } from '@/test/componentMocks';
 *   jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
 */

// Using require() because jest.mock factories run before imports.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require('react');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { View } = require('react-native');

const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export const mockSafeAreaContext = {
  useSafeAreaInsets: () => mockInsets,
  SafeAreaProvider: View,
  SafeAreaView: View,
  SafeAreaInsetsContext: React.createContext(mockInsets),
  initialWindowMetrics: {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: mockInsets,
  },
};
