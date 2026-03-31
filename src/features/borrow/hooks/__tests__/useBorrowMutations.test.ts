import { renderHook, waitFor } from '@testing-library/react-native';
import { useCreateBorrowRequest } from '../useCreateBorrowRequest';
import { useAcceptBorrowRequest } from '../useAcceptBorrowRequest';
import { useCancelBorrowRequest } from '../useCancelBorrowRequest';
import { useDeclineBorrowRequest } from '../useDeclineBorrowRequest';
import { useMarkReturned } from '../useMarkReturned';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
    })),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

function setupChain(data: unknown = { id: 'req-1' }) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect, error: null, data: null });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

function setupRpc(data: unknown = { id: 'req-1' }) {
  mockRpc.mockResolvedValue({ data, error: null });
}

function setupRpcError(error = { message: 'fail' }) {
  mockRpc.mockResolvedValue({ data: null, error });
}

function setupChainError(error = { message: 'fail' }) {
  mockSingle.mockResolvedValue({ data: null, error });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

beforeEach(() => jest.clearAllMocks());

describe('useCreateBorrowRequest', () => {
  it('creates a borrow request and updates item status', async () => {
    setupChain({ id: 'req-1' });
    const { result } = renderHook(() => useCreateBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never, message: 'Please!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'req-1' });
  });

  it('propagates errors', async () => {
    setupChainError();
    const { result } = renderHook(() => useCreateBorrowRequest(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ itemId: 'item-1' as never });

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
