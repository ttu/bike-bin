import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateRating } from '../useCreateRating';
import { useUpdateRating } from '../useUpdateRating';
import { useDeleteRating } from '../useDeleteRating';

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
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

beforeEach(() => jest.clearAllMocks());

describe('useCreateRating', () => {
  it('creates a rating with editable window', async () => {
    const ratingData = {
      id: 'rating-1',
      from_user_id: 'user-123',
      to_user_id: 'user-456',
      item_id: 'item-1',
      transaction_type: 'borrow',
      score: 4,
      text: 'Great!',
      editable_until: '2026-04-04T00:00:00Z',
      created_at: '2026-03-21T00:00:00Z',
      updated_at: '2026-03-21T00:00:00Z',
    };
    mockSingle.mockResolvedValue({ data: ratingData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useCreateRating(), { wrapper: createWrapper() });

    result.current.mutate({
      toUserId: 'user-456' as never,
      itemId: 'item-1' as never,
      transactionType: 'borrow' as never,
      score: 4,
      text: 'Great!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.score).toBe(4);
  });

  it('propagates errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'fail' } });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useCreateRating(), { wrapper: createWrapper() });

    result.current.mutate({
      toUserId: 'user-456' as never,
      transactionType: 'borrow' as never,
      score: 4,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateRating', () => {
  it('updates a rating', async () => {
    const ratingData = {
      id: 'rating-1',
      from_user_id: 'user-123',
      to_user_id: 'user-456',
      transaction_type: 'borrow',
      score: 5,
      text: 'Updated!',
      created_at: '2026-03-21T00:00:00Z',
      updated_at: '2026-03-22T00:00:00Z',
    };
    mockSingle.mockResolvedValue({ data: ratingData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useUpdateRating(), { wrapper: createWrapper() });

    result.current.mutate({
      id: 'rating-1' as never,
      toUserId: 'user-456' as never,
      score: 5,
      text: 'Updated!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.score).toBe(5);
  });
});

describe('useDeleteRating', () => {
  it('deletes a rating', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useDeleteRating(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'rating-1' as never, toUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('propagates errors', async () => {
    mockEq.mockResolvedValue({ error: { message: 'fail' } });
    mockDelete.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useDeleteRating(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'rating-1' as never, toUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
