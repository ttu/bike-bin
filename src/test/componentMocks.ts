/**
 * Shared component/library mock factories for screen tests.
 *
 * Usage:
 *   jest.mock('react-native-safe-area-context', () => safeAreaContextMock());
 */

/**
 * Creates a react-native-safe-area-context mock module.
 * Identical to the pattern used across all screen tests.
 */
export function safeAreaContextMock(insets = { top: 0, bottom: 0, left: 0, right: 0 }) {
  // Using require() because jest.mock factories run before imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');

  return {
    useSafeAreaInsets: () => insets,
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(insets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets,
    },
  };
}
