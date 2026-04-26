import { renderHook, waitFor } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';
import type { ConversationId } from '@/shared/types';

const mockSubscribe = jest.fn().mockReturnValue({});
type Handler = () => void;
let registeredHandler: Handler | undefined;
const mockOn = jest.fn().mockImplementation((_event, _filter, handler: Handler) => {
  registeredHandler = handler;
  return { subscribe: mockSubscribe };
});
const mockChannel = jest.fn().mockReturnValue({ on: mockOn });
const mockRemoveChannel = jest.fn().mockResolvedValue('ok');
const mockRpc = jest.fn().mockResolvedValue({ error: null });

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

import { useRealtimeMessages } from '../useRealtimeMessages';
import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';

describe('useRealtimeMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registeredHandler = undefined;
  });

  it('invalidates message, conversation and unread queries on insert event', () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    renderHook(() => useRealtimeMessages('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    const listener = mockOn.mock.calls[0][2] as () => void;
    listener();

    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  it('swallows invalidate errors when listener fires', async () => {
    const queryClient = createTestQueryClient();
    jest.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(new Error('boom'));

    renderHook(() => useRealtimeMessages('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    const listener = mockOn.mock.calls[0][2] as () => void;
    expect(() => listener()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });

  it('swallows removeChannel errors on unmount', async () => {
    mockRemoveChannel.mockRejectedValueOnce(new Error('boom'));

    const { unmount } = renderHook(() => useRealtimeMessages('conv-1' as ConversationId), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(() => unmount()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });

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

  it('marks the conversation read when a message arrives while focused', async () => {
    renderHook(() => useRealtimeMessages('conv-1' as ConversationId, { isFocused: true }), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(registeredHandler).toBeDefined();
    registeredHandler?.();

    await waitFor(() =>
      expect(mockRpc).toHaveBeenCalledWith('mark_conversation_read', {
        p_conversation_id: 'conv-1',
      }),
    );
  });

  it('does not call mark_conversation_read when not focused', async () => {
    renderHook(() => useRealtimeMessages('conv-1' as ConversationId, { isFocused: false }), {
      wrapper: createQueryClientHookWrapper(),
    });

    registeredHandler?.();

    // Yield a microtask so any pending mutation would have started.
    await Promise.resolve();
    expect(mockRpc).not.toHaveBeenCalledWith('mark_conversation_read', expect.anything());
  });
});
