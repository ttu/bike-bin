import { renderHook } from '@testing-library/react-native';
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
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';


describe('useRealtimeMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('subscribes to channel for given conversation', () => {
    renderHook(() => useRealtimeMessages('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapper(),
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
      wrapper: createQueryClientHookWrapper(),
    });

    expect(mockChannel).not.toHaveBeenCalled();
  });

  it('cleans up channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeMessages('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapper(),
    });

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
