import { renderHook, waitFor } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';
import type { ConversationId, MessageId, UserId } from '@/shared/types';
import type { ConversationListItem, MessageWithSender } from '../../types';

const mockSubscribe = jest.fn().mockReturnValue({});
type Handler = (payload: { new: Record<string, unknown> }) => void;
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
import { MESSAGES_QUERY_KEY } from '../useMessages';
import { CONVERSATIONS_QUERY_KEY } from '../useConversations';
import { UNREAD_COUNT_QUERY_KEY } from '../useUnreadCount';
import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';

const CONVERSATION_ID = 'conv-1' as ConversationId;

function makeInsertPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    new: {
      id: 'msg-new',
      conversation_id: 'conv-1',
      sender_id: 'other-user',
      body: 'Hello',
      created_at: '2026-04-28T10:00:00Z',
      ...overrides,
    },
  };
}

describe('useRealtimeMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registeredHandler = undefined;
  });

  it('appends the new message to the messages infinite cache', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([MESSAGES_QUERY_KEY, CONVERSATION_ID], {
      pages: [[]] as MessageWithSender[][],
      pageParams: [undefined],
    });

    renderHook(() => useRealtimeMessages(CONVERSATION_ID), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    registeredHandler?.(makeInsertPayload());

    const data = queryClient.getQueryData([MESSAGES_QUERY_KEY, CONVERSATION_ID]) as {
      pages: MessageWithSender[][];
    };
    expect(data.pages[0]).toHaveLength(1);
    expect(data.pages[0]?.[0]?.id).toBe('msg-new');
    expect(data.pages[0]?.[0]?.body).toBe('Hello');
  });

  it('does not duplicate messages already in the cache (e.g. optimistic add)', () => {
    const existing: MessageWithSender = {
      id: 'msg-new' as MessageId,
      conversationId: CONVERSATION_ID,
      senderId: 'other-user' as UserId,
      body: 'Hello',
      createdAt: '2026-04-28T10:00:00Z',
      isOwn: false,
    };
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([MESSAGES_QUERY_KEY, CONVERSATION_ID], {
      pages: [[existing]],
      pageParams: [undefined],
    });

    renderHook(() => useRealtimeMessages(CONVERSATION_ID), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    registeredHandler?.(makeInsertPayload());

    const data = queryClient.getQueryData([MESSAGES_QUERY_KEY, CONVERSATION_ID]) as {
      pages: MessageWithSender[][];
    };
    expect(data.pages[0]).toHaveLength(1);
  });

  it('updates the conversation list with last message and bumps unread when not focused', () => {
    const conv: ConversationListItem = {
      id: CONVERSATION_ID,
      itemId: undefined,
      itemOwnerId: undefined,
      itemGroupId: undefined,
      groupName: undefined,
      itemName: undefined,
      itemStatus: undefined,
      itemAvailabilityTypes: undefined,
      itemPhotoPath: undefined,
      otherParticipantId: undefined,
      otherParticipantName: undefined,
      otherParticipantAvatarUrl: undefined,
      lastMessageBody: undefined,
      lastMessageSenderId: undefined,
      lastMessageAt: undefined,
      unreadCount: 0,
      createdAt: '2026-04-28T09:00:00Z',
    };
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([CONVERSATIONS_QUERY_KEY, 'user-123'], [conv]);

    renderHook(() => useRealtimeMessages(CONVERSATION_ID, { isFocused: false }), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    registeredHandler?.(makeInsertPayload());

    const list = queryClient.getQueryData([
      CONVERSATIONS_QUERY_KEY,
      'user-123',
    ]) as ConversationListItem[];
    expect(list[0]?.lastMessageBody).toBe('Hello');
    expect(list[0]?.lastMessageAt).toBe('2026-04-28T10:00:00Z');
    expect(list[0]?.unreadCount).toBe(1);
  });

  it('does not bump unread count when focused', () => {
    const conv = {
      id: CONVERSATION_ID,
      unreadCount: 0,
      createdAt: '',
    } as unknown as ConversationListItem;
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([CONVERSATIONS_QUERY_KEY, 'user-123'], [conv]);

    renderHook(() => useRealtimeMessages(CONVERSATION_ID, { isFocused: true }), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    registeredHandler?.(makeInsertPayload());

    const list = queryClient.getQueryData([
      CONVERSATIONS_QUERY_KEY,
      'user-123',
    ]) as ConversationListItem[];
    expect(list[0]?.unreadCount).toBe(0);
  });

  it('does not bump unread count for own messages', () => {
    const conv = {
      id: CONVERSATION_ID,
      unreadCount: 2,
      createdAt: '',
    } as unknown as ConversationListItem;
    const queryClient = createTestQueryClient();
    queryClient.setQueryData([CONVERSATIONS_QUERY_KEY, 'user-123'], [conv]);

    renderHook(() => useRealtimeMessages(CONVERSATION_ID, { isFocused: false }), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    registeredHandler?.(makeInsertPayload({ sender_id: 'user-123' }));

    const list = queryClient.getQueryData([
      CONVERSATIONS_QUERY_KEY,
      'user-123',
    ]) as ConversationListItem[];
    expect(list[0]?.unreadCount).toBe(2);
  });

  it('invalidates global unread count when message arrives unfocused from another user', () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    renderHook(() => useRealtimeMessages(CONVERSATION_ID, { isFocused: false }), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    registeredHandler?.(makeInsertPayload());

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
  });

  it('subscribes to channel for given conversation', () => {
    renderHook(() => useRealtimeMessages(CONVERSATION_ID), {
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
    const { unmount } = renderHook(() => useRealtimeMessages(CONVERSATION_ID), {
      wrapper: createQueryClientHookWrapper(),
    });

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('swallows removeChannel errors on unmount', async () => {
    mockRemoveChannel.mockRejectedValueOnce(new Error('boom'));

    const { unmount } = renderHook(() => useRealtimeMessages(CONVERSATION_ID), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(() => unmount()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });

  it('marks the conversation read when a message arrives while focused', async () => {
    renderHook(() => useRealtimeMessages(CONVERSATION_ID, { isFocused: true }), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(registeredHandler).toBeDefined();
    registeredHandler?.(makeInsertPayload());

    await waitFor(() =>
      expect(mockRpc).toHaveBeenCalledWith('mark_conversation_read', {
        p_conversation_id: 'conv-1',
      }),
    );
  });

  it('does not call mark_conversation_read when not focused', async () => {
    renderHook(() => useRealtimeMessages(CONVERSATION_ID, { isFocused: false }), {
      wrapper: createQueryClientHookWrapper(),
    });

    registeredHandler?.(makeInsertPayload());
    await Promise.resolve();
    expect(mockRpc).not.toHaveBeenCalledWith('mark_conversation_read', expect.anything());
  });
});
