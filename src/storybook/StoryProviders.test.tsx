import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { StoryProviders } from './StoryProviders';
import { useAuth } from '@/features/auth/hooks/useAuth';

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
