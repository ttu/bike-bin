import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateBorrowRequest } from '../useCreateBorrowRequest';
import { useAcceptBorrowRequest } from '../useAcceptBorrowRequest';
import { useCancelBorrowRequest } from '../useCancelBorrowRequest';
import { useDeclineBorrowRequest } from '../useDeclineBorrowRequest';
import { useMarkReturned } from '../useMarkReturned';

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
    })),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

function setupChain(data: unknown = { id: 'req-1' }) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect, error: null, data: null });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
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
    const { result } = renderHook(() => useCreateBorrowRequest(), { wrapper: createWrapper() });

    result.current.mutate({ itemId: 'item-1' as never, message: 'Please!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'req-1' });
  });

  it('propagates errors', async () => {
    setupChainError();
    const { result } = renderHook(() => useCreateBorrowRequest(), { wrapper: createWrapper() });

    result.current.mutate({ itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useAcceptBorrowRequest', () => {
  it('accepts a borrow request', async () => {
    setupChain({ id: 'req-1', status: 'accepted' });
    const { result } = renderHook(() => useAcceptBorrowRequest(), { wrapper: createWrapper() });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useCancelBorrowRequest', () => {
  it('cancels a borrow request', async () => {
    setupChain({ id: 'req-1', status: 'cancelled' });
    const { result } = renderHook(() => useCancelBorrowRequest(), { wrapper: createWrapper() });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeclineBorrowRequest', () => {
  it('declines a borrow request', async () => {
    setupChain({ id: 'req-1', status: 'rejected' });
    const { result } = renderHook(() => useDeclineBorrowRequest(), { wrapper: createWrapper() });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useMarkReturned', () => {
  it('marks a borrow request as returned', async () => {
    setupChain({ id: 'req-1', status: 'returned' });
    const { result } = renderHook(() => useMarkReturned(), { wrapper: createWrapper() });

    result.current.mutate({ requestId: 'req-1' as never, itemId: 'item-1' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
