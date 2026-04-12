import { renderHook, waitFor } from '@testing-library/react-native';
import { mockInsert, mockSelect, mockSingle, mockEq, mockSupabase } from '@/test/supabaseMocks';
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

    // Conversation insert without RETURNING, then participants insert
    mockInsert.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, otherUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      conversationId: 'conv-new',
      isExisting: false,
    });
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

    mockInsert.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, groupId: 'group-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      conversationId: 'conv-new',
      isExisting: false,
    });

    // Second insert is the participants. Verify it included the requester and both admins.
    const participantInsertArg = mockInsert.mock.calls[1][0] as Array<{ user_id: string }>;
    const userIds = participantInsertArg.map((p) => p.user_id);
    expect(userIds).toContain('user-123');
    expect(userIds).toContain('admin-1');
    expect(userIds).toContain('admin-2');
    expect(userIds).toHaveLength(3);
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

    mockInsert.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, groupId: 'group-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const participantInsertArg = mockInsert.mock.calls[1][0] as Array<{ user_id: string }>;
    const userIds = participantInsertArg.map((p) => p.user_id);
    // user-123 appears once (as the requester), not twice
    expect(userIds.filter((id) => id === 'user-123')).toHaveLength(1);
    expect(userIds).toContain('admin-2');
    expect(userIds).toHaveLength(2);
  });
});
