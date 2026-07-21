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

// Read through a getter so each test can flip the build-time flag; login.tsx
// compiles its import to a property access on the module object.
let mockAppleSignInEnabled = false;
jest.mock('@/shared/utils/featureFlags', () => ({
  get isAppleSignInEnabled() {
    return mockAppleSignInEnabled;
  },
}));

jest.mock('@/features/auth', () => ({
  LoginMasthead: jest.requireActual('@/features/auth/components/LoginMasthead/LoginMasthead')
    .LoginMasthead,
  LoginActionPanel: jest.requireActual(
    '@/features/auth/components/LoginActionPanel/LoginActionPanel',
  ).LoginActionPanel,
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
    mockAppleSignInEnabled = false;
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

  it('does not offer Apple sign-in while the flag is off', () => {
    const { queryByLabelText } = renderWithProviders(<LoginScreen />);
    expect(queryByLabelText('Continue with Apple')).toBeNull();
    expect(mockSignInWithApple).not.toHaveBeenCalled();
  });

  it('invokes Apple sign-in when Continue with Apple is pressed', () => {
    mockAppleSignInEnabled = true;
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
