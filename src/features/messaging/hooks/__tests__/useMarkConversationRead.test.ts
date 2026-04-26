import { renderHook, waitFor } from '@testing-library/react-native';
import type { ConversationId } from '@/shared/types';

const mockRpc = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import { useMarkConversationRead } from '../useMarkConversationRead';
import { UNREAD_COUNT_QUERY_KEY } from '../useUnreadCount';
import {
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';

describe('useMarkConversationRead', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('calls the mark_conversation_read RPC with the conversation id', async () => {
    mockRpc.mockResolvedValue({ error: null });
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useMarkConversationRead(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    result.current.mutate('conv-1' as ConversationId);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('mark_conversation_read', {
      p_conversation_id: 'conv-1',
    });
  });

  it('invalidates the unread count query on success', async () => {
    mockRpc.mockResolvedValue({ error: null });
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMarkConversationRead(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    result.current.mutate('conv-1' as ConversationId);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
  });

  it('surfaces RPC errors', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'boom' } });
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useMarkConversationRead(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    result.current.mutate('conv-1' as ConversationId);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
