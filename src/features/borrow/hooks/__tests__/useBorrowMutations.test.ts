import { renderHook, waitFor } from '@testing-library/react-native';
import {
  mockInsert,
  mockUpdate,
  mockEq,
  mockSelect,
  mockSingle,
  mockRpc,
} from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
    })),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));
jest.mock('@/features/auth', () => mockAuthModule);

const mockResolveConversation = jest.fn();
jest.mock('@/features/messaging', () => ({
  resolveConversation: (...args: unknown[]) => mockResolveConversation(...args),
  CONVERSATIONS_QUERY_KEY: 'conversations',
}));

// Import after mocks
import { useCreateBorrowRequest } from '../useCreateBorrowRequest';
import { useAcceptBorrowRequest } from '../useAcceptBorrowRequest';
import { useCancelBorrowRequest } from '../useCancelBorrowRequest';
import { useDeclineBorrowRequest } from '../useDeclineBorrowRequest';
import { useMarkReturned } from '../useMarkReturned';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';
import type { ConversationId, ItemId } from '@/shared/types';

const DEFAULT_RPC_DATA = { id: 'req-1' };
const DEFAULT_SUPABASE_ERROR = { message: 'fail' };

function setupChain(data?: unknown) {
  const resolvedData = data === undefined ? DEFAULT_RPC_DATA : data;
  mockSingle.mockResolvedValue({ data: resolvedData, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect, error: null, data: null });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

function setupRpc(data?: unknown) {
  const resolvedData = data === undefined ? DEFAULT_RPC_DATA : data;
  mockRpc.mockResolvedValue({ data: resolvedData, error: null });
}

function setupRpcError(error?: unknown) {
  const resolvedError = error === undefined ? DEFAULT_SUPABASE_ERROR : error;
  mockRpc.mockResolvedValue({ data: null, error: resolvedError });
}

function setupChainError(error?: unknown) {
  const resolvedError = error === undefined ? DEFAULT_SUPABASE_ERROR : error;
  mockSingle.mockResolvedValue({ data: null, error: resolvedError });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

beforeEach(() => jest.clearAllMocks());

describe('useCreateBorrowRequest', () => {
  it('creates a borrow request without changing item status', async () => {
    setupChain({ id: 'req-1' });
    mockResolveConversation.mockResolvedValue({
      conversationId: 'conv-1' as ConversationId,
      isExisting: false,
    });

    const { result } = renderHook(() => useCreateBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({
      itemId: 'item-1' as never,
      ownerId: 'owner-1' as never,
      message: 'Please!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ requestId: 'req-1', conversationId: 'conv-1' });
    // item status must NOT be updated
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns a conversationId pointing at the (item, owner) conversation', async () => {
    setupChain({ id: 'req-2' });
    mockResolveConversation.mockResolvedValue({
      conversationId: 'conv-abc' as ConversationId,
      isExisting: true,
    });

    const { result } = renderHook(() => useCreateBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-2' as never, ownerId: 'owner-2' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.conversationId).toBe('conv-abc');
    expect(mockResolveConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'item-2',
        otherUserId: 'owner-2',
      }),
    );
  });

  it('reuses an existing conversation for the same (item, owner)', async () => {
    setupChain({ id: 'req-3' });
    mockResolveConversation.mockResolvedValue({
      conversationId: 'conv-existing' as ConversationId,
      isExisting: true,
    });

    const { result } = renderHook(() => useCreateBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-3' as never, ownerId: 'owner-3' as never });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.conversationId).toBe('conv-existing');

    // Second call — resolveConversation still returns the same id (isExisting: true)
    setupChain({ id: 'req-4' });
    result.current.mutate({ itemId: 'item-3' as ItemId, ownerId: 'owner-3' as never });
    await waitFor(() => expect(result.current.data?.conversationId).toBe('conv-existing'));
    expect(mockResolveConversation).toHaveBeenCalledTimes(2);
  });

  it('throws when neither ownerId nor groupId provided', async () => {
    setupChain({ id: 'req-1' });

    const { result } = renderHook(() => useCreateBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      message: 'Either ownerId or groupId must be provided',
    });
    // borrow_requests INSERT must not have been called
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('propagates errors from the borrow_requests insert', async () => {
    setupChainError();

    const { result } = renderHook(() => useCreateBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, ownerId: 'owner-1' as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useAcceptBorrowRequest', () => {
  it('accepts a borrow request via RPC', async () => {
    setupRpc({ id: 'req-1', status: 'accepted' });
    const { result } = renderHook(() => useAcceptBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('transition_borrow_request', {
      p_request_id: 'req-1',
      p_new_request_status: 'accepted',
      p_new_item_status: 'loaned',
    });
  });

  it('propagates RPC errors', async () => {
    setupRpcError();
    const { result } = renderHook(() => useAcceptBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCancelBorrowRequest', () => {
  it('cancels a borrow request', async () => {
    setupChain({ id: 'req-1', status: 'cancelled' });
    const { result } = renderHook(() => useCancelBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeclineBorrowRequest', () => {
  it('declines a borrow request via RPC', async () => {
    setupRpc({ id: 'req-1', status: 'rejected' });
    const { result } = renderHook(() => useDeclineBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('transition_borrow_request', {
      p_request_id: 'req-1',
      p_new_request_status: 'rejected',
      p_new_item_status: 'stored',
    });
  });
});

describe('useMarkReturned', () => {
  it('marks a borrow request as returned via RPC', async () => {
    setupRpc({ id: 'req-1', status: 'returned' });
    const { result } = renderHook(() => useMarkReturned(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('transition_borrow_request', {
      p_request_id: 'req-1',
      p_new_request_status: 'returned',
      p_new_item_status: 'stored',
    });
  });
});
