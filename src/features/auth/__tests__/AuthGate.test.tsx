import React from 'react';
import { renderHook, act, render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Text } from 'react-native';
import { lightTheme } from '@/shared/theme';
import { AuthGate, useAuthGate } from '../components/AuthGate/AuthGate';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

let mockIsAuthenticated = false;

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    session: null,
    user: null,
    isLoading: false,
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signOut: jest.fn(),
  }),
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <PaperProvider theme={lightTheme}>{children}</PaperProvider>;
}

describe('AuthGate', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    jest.clearAllMocks();
  });

  it('shows children when authenticated', () => {
    mockIsAuthenticated = true;
    const { getByText } = render(
      <TestWrapper>
        <AuthGate>
          <Text>Protected Content</Text>
        </AuthGate>
      </TestWrapper>,
    );
    expect(getByText('Protected Content')).toBeTruthy();
  });

  it('hides children when not authenticated', () => {
    mockIsAuthenticated = false;
    const { queryByText } = render(
      <TestWrapper>
        <AuthGate>
          <Text>Protected Content</Text>
        </AuthGate>
      </TestWrapper>,
    );
    expect(queryByText('Protected Content')).toBeNull();
  });

  it('shows fallback when not authenticated and fallback provided', () => {
    mockIsAuthenticated = false;
    const { getByText } = render(
      <TestWrapper>
        <AuthGate fallback={<Text>Please sign in</Text>}>
          <Text>Protected Content</Text>
        </AuthGate>
      </TestWrapper>,
    );
    expect(getByText('Please sign in')).toBeTruthy();
  });
});

describe('useAuthGate', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    jest.clearAllMocks();
  });

  it('executes action when authenticated', () => {
    mockIsAuthenticated = true;
    const action = jest.fn();

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.requireAuth(action);
    });

    expect(action).toHaveBeenCalled();
  });

  it('does not execute action when not authenticated', () => {
    mockIsAuthenticated = false;
    const action = jest.fn();

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.requireAuth(action);
    });

    expect(action).not.toHaveBeenCalled();
  });
});
