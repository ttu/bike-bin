import React from 'react';
import { renderWithProviders } from '@/test/utils';
import Index from '../index';

const mockUseAuth = jest.fn();
const mockUseDemoMode = jest.fn();

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text: RNText } = require('react-native');
  return {
    Redirect: ({ href }: { readonly href: string }) => (
      <RNText testID="redirect-href">{href}</RNText>
    ),
  };
});

jest.mock('@/shared/components/LoadingScreen', () => ({
  LoadingScreen: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text: RNText } = require('react-native');
    return <RNText testID="loading-screen">Loading</RNText>;
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/features/demo', () => {
  return {
    DemoModeProvider: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
    useDemoMode: () => mockUseDemoMode(),
  };
});

describe('app/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDemoMode.mockReturnValue({ isDemoMode: false });
  });

  it('shows loading screen while auth is loading', () => {
    mockUseAuth.mockReturnValue({ isLoading: true, isAuthenticated: false });
    const { getByTestId } = renderWithProviders(<Index />);
    expect(getByTestId('loading-screen')).toBeTruthy();
  });

  it.each([
    {
      scenario: 'demo mode is on',
      isAuthenticated: false,
      isDemoMode: true,
      href: '/(tabs)/inventory',
    },
    {
      scenario: 'not authenticated and not demo',
      isAuthenticated: false,
      isDemoMode: false,
      href: '/(auth)/login',
    },
    {
      scenario: 'authenticated',
      isAuthenticated: true,
      isDemoMode: false,
      href: '/(tabs)/inventory',
    },
  ])('redirects to $href when $scenario', ({ isAuthenticated, isDemoMode, href }) => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated });
    mockUseDemoMode.mockReturnValue({ isDemoMode });
    const { getByTestId } = renderWithProviders(<Index />);
    expect(getByTestId('redirect-href').props.children).toBe(href);
  });
});
