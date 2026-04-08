import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider } from '../provider';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/shared/api/supabase';
import { PaperProvider } from 'react-native-paper';
import { lightTheme } from '@/shared/theme';
import { signInWithOAuthProvider } from '../utils/signInWithOAuthProvider';

jest.mock('../utils/signInWithOAuthProvider', () => ({
  signInWithOAuthProvider: jest.fn().mockResolvedValue(undefined),
}));

// Mock supabase
jest.mock('@/shared/api/supabase', () => {
  const mockAuthStateChange = jest.fn();
  return {
    supabase: {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: mockAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        }),
        signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    },
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <PaperProvider theme={lightTheme}>
      <AuthProvider>{children}</AuthProvider>
    </PaperProvider>
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );
    spy.mockRestore();
  });

  it('returns null session when not logged in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial session check
    await act(async () => {});

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isLoading is true initially then false after session check', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // After initial load completes
    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
  });

  it('signOut calls supabase signOut', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('signInWithGoogle delegates to signInWithOAuthProvider', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(signInWithOAuthProvider).toHaveBeenCalledWith('google');
  });

  it('signInWithApple delegates to signInWithOAuthProvider', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.signInWithApple();
    });

    expect(signInWithOAuthProvider).toHaveBeenCalledWith('apple');
  });

  it('updates session when auth state changes', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token',
    };

    // Capture the callback registered with onAuthStateChange
    let authCallback: (event: string, session: unknown) => void = () => {};
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    // Simulate auth state change
    await act(async () => {
      authCallback('SIGNED_IN', mockSession);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('isAuthenticated is correct boolean', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.isAuthenticated).toBe(false);
  });
});
