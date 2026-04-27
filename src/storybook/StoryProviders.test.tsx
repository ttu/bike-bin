import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { StoryProviders } from './StoryProviders';
import { useAuth } from '@/features/auth';

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const actual = jest.requireActual<typeof import('react-native-safe-area-context')>(
    'react-native-safe-area-context',
  );
  return {
    ...actual,
    SafeAreaProvider: ({ children }: { readonly children: React.ReactNode }) =>
      React.createElement(
        actual.SafeAreaProvider,
        {
          initialMetrics: {
            frame: { x: 0, y: 0, width: 390, height: 844 },
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
          },
        },
        children,
      ),
  };
});

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

function AuthProbe() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <Text>loading</Text>;
  }
  return <Text>{isAuthenticated ? 'authenticated' : 'guest'}</Text>;
}

describe('StoryProviders', () => {
  it('wraps stories with AuthProvider (guest when no session)', async () => {
    const screen = render(
      <StoryProviders>
        <AuthProbe />
      </StoryProviders>,
    );

    expect(screen.getByText('loading')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('guest')).toBeTruthy();
    });
  });
});
