import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSubscribe = jest.fn().mockReturnValue({});
const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannelObj = { on: mockOn };
const mockChannel = jest.fn().mockReturnValue(mockChannelObj);
const mockRemoveChannel = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

import { useRealtimeNotifications } from '../useRealtimeNotifications';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('useRealtimeNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('subscribes to notification inserts for current user', () => {
    renderHook(() => useRealtimeNotifications(), {
      wrapper: createWrapper(),
    });

    expect(mockChannel).toHaveBeenCalledWith('notifications:user-123');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        table: 'notifications',
        filter: 'user_id=eq.user-123',
      }),
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('cleans up channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeNotifications(), {
      wrapper: createWrapper(),
    });

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
