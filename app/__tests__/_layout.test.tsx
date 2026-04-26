/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories use require(); deferred require('../_layout') reads EXPO_PUBLIC_STORYBOOK_ENABLED before first load */
import React from 'react';
import type { ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

jest.mock('@sentry/react-native', () => {
  return {
    __esModule: true,
    wrap: (Component: React.ComponentType<Record<string, unknown>>) =>
      function SentryWrapped(props: Record<string, unknown>) {
        return <Component {...props} />;
      },
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('@/shared/api/queryClient', () => ({
  queryClient: {},
}));

jest.mock('@/storybook/shellQueryClient', () => ({
  storybookShellQueryClient: {},
}));

jest.mock('../../.rnstorybook', () => {
  const { View } = require('react-native');
  const StorybookRoot = () => <View testID="storybook-ui-root" />;
  StorybookRoot.displayName = 'StorybookUIRoot';
  return { __esModule: true, default: StorybookRoot };
});

jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/shared/hooks/useThemePreference', () => {
  const { View } = require('react-native');
  return {
    ThemePreferenceProvider: ({ children }: { readonly children: React.ReactNode }) => (
      <View testID="theme-preference">{children}</View>
    ),
    useThemePreference: () => ({ effectiveTheme: 'light' as const }),
  };
});

jest.mock('@/features/auth', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/features/demo', () => ({
  DemoModeProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/shared/components/SnackbarAlerts', () => ({
  SnackbarAlertsProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  return {
    Stack: () => <View testID="expo-stack" />,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({
      children,
      style,
    }: {
      readonly children: React.ReactNode;
      readonly style?: object;
    }) => (
      <View style={style} testID="gesture-root">
        {children}
      </View>
    ),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({
      children,
      onLayout,
    }: {
      readonly children: React.ReactNode;
      readonly onLayout?: () => void;
    }) => (
      <View onLayout={onLayout} testID={onLayout ? 'safe-area-root' : 'safe-area-inner'}>
        {children}
      </View>
    ),
  };
});

/** Re-run `app/_layout` top-level (incl. `storybookEnabled`) without `jest.resetModules()`, which reloads React and breaks hooks in RTL. */
function evictLayoutFromRequireCache(): void {
  const layoutPath = require.resolve('../_layout');
  Reflect.deleteProperty(require.cache as Record<string, NodeModule>, layoutPath);
}

describe('app/_layout', () => {
  const originalStorybookFlag = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED;

  afterAll(() => {
    if (originalStorybookFlag === undefined) {
      Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_STORYBOOK_ENABLED');
    } else {
      process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = originalStorybookFlag;
    }
  });

  it('renders Storybook UI when EXPO_PUBLIC_STORYBOOK_ENABLED is true', () => {
    process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = 'true';
    evictLayoutFromRequireCache();
    const { default: RootLayout } = require('../_layout') as { default: React.ComponentType };
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('storybook-ui-root')).toBeTruthy();
    expect(getByTestId('gesture-root')).toBeTruthy();
  });

  it('hides the splash screen when the root SafeAreaProvider lays out', () => {
    process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = 'true';
    evictLayoutFromRequireCache();
    const { default: RootLayout } = require('../_layout') as { default: React.ComponentType };
    const { getByTestId } = render(<RootLayout />);
    fireEvent(getByTestId('safe-area-root'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 100 } },
    });
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});
