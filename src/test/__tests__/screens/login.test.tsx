import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import LoginScreen from '../../../../app/(auth)/login';

const mockSignInWithGoogle = jest.fn();
const mockSignInWithApple = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
    signOut: jest.fn(),
    session: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

jest.mock('expo-router', () => {
  return {
    router: {
      replace: (...args: unknown[]) => mockReplace(...args),
    },
  };
});

describe('Login screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders app title', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Bike Bin')).toBeTruthy();
  });

  it('renders tagline', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('From bikers to bikers.')).toBeTruthy();
  });

  it('renders welcome description', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(
      getByText('Your parts, tools, and builds in one place. Share them when you want.'),
    ).toBeTruthy();
  });

  it('renders Continue with Apple button', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Continue with Apple')).toBeTruthy();
  });

  it('renders Continue with Google button', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Continue with Google')).toBeTruthy();
  });

  it('renders Browse without signing in link', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText(/Browse without signing in/)).toBeTruthy();
  });

  it('tapping Apple sign-in calls signInWithApple', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText('Continue with Apple'));
    expect(mockSignInWithApple).toHaveBeenCalled();
  });

  it('tapping Google sign-in calls signInWithGoogle', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText('Continue with Google'));
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('tapping Browse without signing in navigates to inventory', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText(/Browse without signing in/));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });
});
