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
});
