import { renderHook, waitFor } from '@testing-library/react-native';
import { useSendMessage } from '../useSendMessage';
import { useCreateConversation } from '../useCreateConversation';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockEq = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));


beforeEach(() => jest.clearAllMocks());

describe('useSendMessage', () => {
  it('sends a message', async () => {
    const msgData = { id: 'msg-1', body: 'Hello' };
    mockSingle.mockResolvedValue({ data: msgData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useSendMessage(), { wrapper: createQueryClientHookWrapper() });

    result.current.mutate({ conversationId: 'conv-1' as never, body: 'Hello' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(msgData);
  });

  it('propagates errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'fail' } });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useSendMessage(), { wrapper: createQueryClientHookWrapper() });

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

    const { result } = renderHook(() => useCreateConversation(), { wrapper: createQueryClientHookWrapper() });

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

    // Mock insert for new conversation
    const newConvData = { id: 'conv-new' };
    mockSingle.mockResolvedValue({ data: newConvData, error: null });
    const mockSelectChain = jest.fn().mockReturnValue({ single: mockSingle });
    // First insert (conversation) returns select chain, second (participants) resolves
    mockInsert
      .mockReturnValueOnce({ select: mockSelectChain })
      .mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useCreateConversation(), { wrapper: createQueryClientHookWrapper() });

    result.current.mutate({ itemId: 'item-1' as never, otherUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      conversationId: 'conv-new',
      isExisting: false,
    });
  });
});
