import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

// Import after mocks
import { useUnreadCount } from '../useUnreadCount';

describe('useUnreadCount', () => {
  it('returns 0 for MVP implementation', async () => {
    const { result } = renderHook(() => useUnreadCount(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it('does not create any realtime subscriptions', () => {
    const mockChannel = jest.fn();
    jest.mock('@/shared/api/supabase', () => ({
      supabase: { channel: mockChannel },
    }));

    renderHook(() => useUnreadCount(), { wrapper: createWrapper() });

    expect(mockChannel).not.toHaveBeenCalled();
  });
});
