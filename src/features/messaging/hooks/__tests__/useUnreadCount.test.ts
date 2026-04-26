import { renderHook, waitFor } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';

const mockRpc = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

import { useUnreadCount, useUnreadCountByConversation } from '../useUnreadCount';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useUnreadCount', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('sums per-conversation counts returned by the RPC', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { conversation_id: 'conv-1', count: 2 },
        { conversation_id: 'conv-2', count: 5 },
      ],
      error: null,
    });

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('unread_message_count');
    expect(result.current.data).toBe(7);
  });

  it('returns 0 when the RPC returns no rows', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it('surfaces RPC errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUnreadCountByConversation', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('exposes the per-conversation map', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { conversation_id: 'conv-1', count: 2 },
        { conversation_id: 'conv-2', count: 5 },
      ],
      error: null,
    });

    const { result } = renderHook(() => useUnreadCountByConversation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.get('conv-1' as never)).toBe(2);
    expect(result.current.data?.get('conv-2' as never)).toBe(5);
  });
});
