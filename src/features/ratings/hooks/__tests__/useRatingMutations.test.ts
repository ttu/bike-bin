import { renderHook, waitFor } from '@testing-library/react-native';
import {
  mockInsert,
  mockUpdate,
  mockDelete,
  mockEq,
  mockSelect,
  mockSingle,
  mockSupabase,
} from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

// Import after mocks
import { useCreateRating } from '../useCreateRating';
import { useUpdateRating } from '../useUpdateRating';
import { useDeleteRating } from '../useDeleteRating';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

beforeEach(() => jest.clearAllMocks());

describe('useCreateRating', () => {
  it('creates a user-targeted rating with borrow_request_id', async () => {
    const ratingData = {
      id: 'rating-1',
      from_user_id: 'user-123',
      to_user_id: 'user-456',
      to_group_id: null,
      borrow_request_id: 'br-1',
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

    const { result } = renderHook(() => useCreateRating(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({
      toUserId: 'user-456' as never,
      borrowRequestId: 'br-1' as never,
      itemId: 'item-1' as never,
      transactionType: 'borrow' as never,
      score: 4,
      text: 'Great!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.score).toBe(4);
  });

  it('creates a group-targeted rating', async () => {
    const ratingData = {
      id: 'rating-2',
      from_user_id: 'user-123',
      to_user_id: null,
      to_group_id: 'group-1',
      borrow_request_id: 'br-2',
      item_id: 'item-1',
      transaction_type: 'borrow',
      score: 5,
      text: null,
      editable_until: '2026-04-04T00:00:00Z',
      created_at: '2026-03-21T00:00:00Z',
      updated_at: '2026-03-21T00:00:00Z',
    };
    mockSingle.mockResolvedValue({ data: ratingData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useCreateRating(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({
      toGroupId: 'group-1' as never,
      borrowRequestId: 'br-2' as never,
      itemId: 'item-1' as never,
      transactionType: 'borrow' as never,
      score: 5,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.score).toBe(5);
  });

  it('propagates errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'fail' } });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useCreateRating(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({
      toUserId: 'user-456' as never,
      borrowRequestId: 'br-1' as never,
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

    const { result } = renderHook(() => useUpdateRating(), {
      wrapper: createQueryClientHookWrapper(),
    });

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

    const { result } = renderHook(() => useDeleteRating(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ id: 'rating-1' as never, toUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('propagates errors', async () => {
    mockEq.mockResolvedValue({ error: { message: 'fail' } });
    mockDelete.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useDeleteRating(), {
      wrapper: createQueryClientHookWrapper(),
    });

    result.current.mutate({ id: 'rating-1' as never, toUserId: 'user-456' as never });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
