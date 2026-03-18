import React from 'react';
import { renderWithProviders } from '@/test/utils';
import Index from '../../../../app/index';

const mockRedirect = jest.fn();

jest.mock('expo-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
}));

let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  session: null,
  user: null,
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signOut: jest.fn(),
};

jest.mock('@/features/auth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@/shared/components/LoadingScreen', () => ({
  LoadingScreen: () => null,
}));

describe('Root index route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      isAuthenticated: false,
      isLoading: false,
      session: null,
      user: null,
      signInWithGoogle: jest.fn(),
      signInWithApple: jest.fn(),
      signOut: jest.fn(),
    };
  });

  it('redirects to login when not authenticated', () => {
    renderWithProviders(<Index />);
    expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ href: '/(auth)/login' }));
  });

  it('redirects to inventory tab when authenticated', () => {
    mockAuthState = { ...mockAuthState, isAuthenticated: true };
    renderWithProviders(<Index />);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/(tabs)/inventory' }),
    );
  });

  it('shows loading screen when auth is loading', () => {
    mockAuthState = { ...mockAuthState, isLoading: true };
    renderWithProviders(<Index />);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
