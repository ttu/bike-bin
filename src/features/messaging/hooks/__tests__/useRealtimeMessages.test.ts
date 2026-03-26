import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ConversationId } from '@/shared/types';

const mockSubscribe = jest.fn().mockReturnValue({});
const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = jest.fn().mockReturnValue({ on: mockOn });
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

import { useRealtimeMessages } from '../useRealtimeMessages';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('useRealtimeMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('subscribes to channel for given conversation', () => {
    renderHook(() => useRealtimeMessages('conv-1' as ConversationId), {
      wrapper: createWrapper(),
    });

    expect(mockChannel).toHaveBeenCalledWith('messages:conv-1');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        table: 'messages',
        filter: 'conversation_id=eq.conv-1',
      }),
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('does not subscribe when conversationId is undefined', () => {
    renderHook(() => useRealtimeMessages(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockChannel).not.toHaveBeenCalled();
  });

  it('cleans up channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeMessages('conv-1' as ConversationId), {
      wrapper: createWrapper(),
    });

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
