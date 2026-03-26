import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();
let mockInsertCallback: ((payload: Record<string, unknown>) => void) | undefined;

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })),
    channel: jest.fn(() => ({
      on: (
        _event: unknown,
        _filter: unknown,
        callback: (payload: Record<string, unknown>) => void,
      ) => {
        mockInsertCallback = callback;
        return { subscribe: mockSubscribe.mockReturnValue({}) };
      },
    })),
    removeChannel: jest.fn(),
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

beforeEach(() => {
  jest.clearAllMocks();
  mockInsertCallback = undefined;

  // Re-wire mockOn and mockRemoveChannel to the mocked supabase after clearAllMocks
  const { supabase } = jest.requireMock('@/shared/api/supabase') as {
    supabase: {
      channel: jest.Mock;
      removeChannel: jest.Mock;
      on: jest.Mock;
    };
  };

  (supabase.channel as jest.Mock).mockImplementation(() => ({
    on: (
      _event: unknown,
      _filter: unknown,
      callback: (payload: Record<string, unknown>) => void,
    ) => {
      mockInsertCallback = callback;
      return { subscribe: mockSubscribe.mockReturnValue({}) };
    },
  }));

  (supabase.removeChannel as jest.Mock).mockImplementation(mockRemoveChannel);
});

describe('useUnreadCount', () => {
  it('returns 0 for MVP implementation', async () => {
    const { result } = renderHook(() => useUnreadCount(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it('subscribes to the unread-messages realtime channel', async () => {
    const { supabase } = jest.requireMock('@/shared/api/supabase') as {
      supabase: { channel: jest.Mock };
    };

    renderHook(() => useUnreadCount(), { wrapper: createWrapper() });

    await waitFor(() => expect(supabase.channel).toHaveBeenCalledWith('unread-messages'));
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('unsubscribes when unmounted', async () => {
    const { supabase } = jest.requireMock('@/shared/api/supabase') as {
      supabase: { removeChannel: jest.Mock };
    };

    const { unmount } = renderHook(() => useUnreadCount(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it('invalidates query when a message from another user is inserted', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    }

    renderHook(() => useUnreadCount(), { wrapper: Wrapper });

    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    // Simulate a message INSERT from another user
    act(() => {
      mockInsertCallback?.({ new: { sender_id: 'user-456' } });
    });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['unread_message_count'] }),
    );
  });

  it('does not invalidate query when the message is from the current user', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    }

    renderHook(() => useUnreadCount(), { wrapper: Wrapper });

    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    // Reset spy call count after query setup
    invalidateSpy.mockClear();

    // Simulate a message INSERT from the current user (user-123)
    act(() => {
      mockInsertCallback?.({ new: { sender_id: 'user-123' } });
    });

    // Small delay to ensure no async invalidation fires
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
