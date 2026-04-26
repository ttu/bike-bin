import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import LoginScreen from '../login';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

const mockReplace = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignInWithApple = jest.fn();
const mockEnterDemoMode = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('@/shared/utils/env', () => ({
  isPasswordDemoLoginEnabled: false,
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
  }),
}));

jest.mock('@/features/demo', () => {
  return {
    DemoModeProvider: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
    useDemoMode: () => ({
      enterDemoMode: mockEnterDemoMode,
    }),
  };
});

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to inventory when browsing without signing in', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText('Browse without signing in'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('enters demo mode and navigates to inventory', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText('Try the demo'));
    expect(mockEnterDemoMode).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('invokes Apple sign-in when Continue with Apple is pressed', () => {
    const { getByLabelText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByLabelText('Continue with Apple'));
    expect(mockSignInWithApple).toHaveBeenCalled();
  });

  it('invokes Google sign-in when Continue with Google is pressed', () => {
    const { getByLabelText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByLabelText('Continue with Google'));
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });
});
