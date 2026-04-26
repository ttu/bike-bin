import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSingle = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: jest.fn(() => ({
      single: (...args: unknown[]) => mockSingle(...args),
    })),
  },
}));

import { usePublicProfile } from '../usePublicProfile';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('usePublicProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads profile via get_public_profile RPC', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'user-456',
        display_name: 'Alex',
        avatar_url: null,
        rating_avg: 4.5,
        rating_count: 2,
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });

    const { result } = renderHook(() => usePublicProfile('user-456'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      id: 'user-456',
      displayName: 'Alex',
      avatarUrl: undefined,
      ratingAvg: 4.5,
      ratingCount: 2,
      createdAt: '2026-01-01T00:00:00Z',
    });
  });
});
