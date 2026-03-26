import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMarkNotificationRead } from '../useMarkNotificationRead';

const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  },
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

beforeEach(() => jest.clearAllMocks());

describe('useMarkNotificationRead', () => {
  it('marks a notification as read', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('notif-1' as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('propagates errors', async () => {
    mockEq.mockResolvedValue({ error: { message: 'fail' } });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('notif-1' as never);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
