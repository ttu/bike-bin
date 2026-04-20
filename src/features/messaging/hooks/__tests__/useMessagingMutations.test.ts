import { renderHook, waitFor } from '@testing-library/react-native';
import {
  mockInsert,
  mockDelete,
  mockSelect,
  mockSingle,
  mockEq,
  mockSupabase,
} from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';

jest.mock('@/shared/utils/randomUuid', () => ({
  randomUuidV4: jest.fn(() => 'conv-new'),
}));
jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

// Import after mocks
import { useSendMessage } from '../useSendMessage';
import { useCreateConversation } from '../useCreateConversation';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

beforeEach(() => jest.clearAllMocks());

describe('useSendMessage', () => {
  it('sends a message', async () => {
    const msgData = { id: 'msg-1', body: 'Hello' };
    mockSingle.mockResolvedValue({ data: msgData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ conversationId: 'conv-1' as never, body: 'Hello' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(msgData);
  });

  it('propagates errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'fail' } });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ conversationId: 'conv-1' as never, body: 'Hello' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateConversation', () => {
  it('returns existing conversation if one exists', async () => {
    // Mock the select for checking existing conversations
    mockEq.mockResolvedValue({
      data: [
        {
          id: 'conv-existing',
          conversation_participants: [{ user_id: 'user-123' }, { user_id: 'user-456' }],
        },
      ],
    });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, otherUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      conversationId: 'conv-existing',
      isExisting: true,
    });
  });

  it('creates a new conversation when none exists', async () => {
    // Mock select for checking existing (none found)
    mockEq.mockResolvedValue({ data: [] });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Conversation insert, then self-participant insert, then other-participant insert
    mockInsert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, otherUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      conversationId: 'conv-new',
      isExisting: false,
    });

    // Verify three inserts: conversation, self-participant (owner), other-participant
    expect(mockInsert).toHaveBeenCalledTimes(3);
    expect(mockInsert).toHaveBeenNthCalledWith(2, {
      conversation_id: 'conv-new',
      user_id: 'user-123',
    });
    expect(mockInsert).toHaveBeenNthCalledWith(3, [
      { conversation_id: 'conv-new', user_id: 'user-456' },
    ]);
  });

  it('rolls back conversation when other-participant insert fails', async () => {
    mockEq.mockResolvedValue({ data: [] });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Conversation insert OK, self-participant OK, other-participant fails
    mockInsert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'RLS violation' } });

    // Rollback: delete participants then delete conversation
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, otherUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it('reuses existing conversation when group admin is a participant', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  {
                    id: 'conv-existing-group',
                    conversation_participants: [{ user_id: 'user-123' }, { user_id: 'admin-1' }],
                  },
                ],
              }),
          }),
        };
      }
      if (table === 'group_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () =>
                Promise.resolve({
                  data: [{ user_id: 'admin-1' }, { user_id: 'admin-2' }],
                  error: null,
                }),
            }),
          }),
        };
      }
      return { select: mockSelect, insert: mockInsert };
    });

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, groupId: 'group-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      conversationId: 'conv-existing-group',
      isExisting: true,
    });
    // Should NOT have created a new conversation
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('creates conversation with all group admins for group items', async () => {
    // Override from() to return table-specific mocks
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
          insert: mockInsert,
        };
      }
      if (table === 'group_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () =>
                Promise.resolve({
                  data: [{ user_id: 'admin-1' }, { user_id: 'admin-2' }],
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'conversation_participants') {
        return { insert: mockInsert };
      }
      return { select: mockSelect, insert: mockInsert };
    });

    mockInsert
      .mockResolvedValueOnce({ error: null }) // conversation
      .mockResolvedValueOnce({ error: null }) // self participant
      .mockResolvedValueOnce({ error: null }); // other participants

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, groupId: 'group-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      conversationId: 'conv-new',
      isExisting: false,
    });

    // Second insert is self, third insert is the other participants (group admins).
    const selfInsertArg = mockInsert.mock.calls[1][0] as { user_id: string };
    expect(selfInsertArg.user_id).toBe('user-123');

    const othersInsertArg = mockInsert.mock.calls[2][0] as Array<{ user_id: string }>;
    const otherIds = othersInsertArg.map((p) => p.user_id);
    expect(otherIds).toContain('admin-1');
    expect(otherIds).toContain('admin-2');
    expect(otherIds).toHaveLength(2);
  });

  it('excludes the current user when they are also a group admin', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
          insert: mockInsert,
        };
      }
      if (table === 'group_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () =>
                Promise.resolve({
                  data: [{ user_id: 'user-123' }, { user_id: 'admin-2' }],
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'conversation_participants') {
        return { insert: mockInsert };
      }
      return { select: mockSelect, insert: mockInsert };
    });

    mockInsert
      .mockResolvedValueOnce({ error: null }) // conversation
      .mockResolvedValueOnce({ error: null }) // self participant
      .mockResolvedValueOnce({ error: null }); // other participants

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, groupId: 'group-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Self insert (call[1]) should be the current user
    const selfInsertArg = mockInsert.mock.calls[1][0] as { user_id: string };
    expect(selfInsertArg.user_id).toBe('user-123');

    // Others insert (call[2]) should only contain admin-2 (user-123 excluded as current user)
    const othersInsertArg = mockInsert.mock.calls[2][0] as Array<{ user_id: string }>;
    const otherIds = othersInsertArg.map((p) => p.user_id);
    expect(otherIds).not.toContain('user-123');
    expect(otherIds).toContain('admin-2');
    expect(otherIds).toHaveLength(1);
  });
});
