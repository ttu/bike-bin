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

  it('redirects to inventory when demo mode is on', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false });
    mockUseDemoMode.mockReturnValue({ isDemoMode: true });
    const { getByTestId } = renderWithProviders(<Index />);
    expect(getByTestId('redirect-href').props.children).toBe('/(tabs)/inventory');
  });

  it('redirects to login when not authenticated and not demo', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false });
    mockUseDemoMode.mockReturnValue({ isDemoMode: false });
    const { getByTestId } = renderWithProviders(<Index />);
    expect(getByTestId('redirect-href').props.children).toBe('/(auth)/login');
  });

  it('redirects to inventory when authenticated', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: true });
    mockUseDemoMode.mockReturnValue({ isDemoMode: false });
    const { getByTestId } = renderWithProviders(<Index />);
    expect(getByTestId('redirect-href').props.children).toBe('/(tabs)/inventory');
  });
});
