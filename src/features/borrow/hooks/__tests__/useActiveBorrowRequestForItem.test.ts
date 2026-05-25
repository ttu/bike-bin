import { renderHook, waitFor } from '@testing-library/react-native';
import { BorrowRequestStatus } from '@/shared/types';

const mockFetchPublicProfilesMap = jest.fn();

jest.mock('@/shared/api/fetchPublicProfile', () => ({
  fetchPublicProfilesMap: (...args: unknown[]) => mockFetchPublicProfilesMap(...args),
}));

const mockMaybeSingle = jest.fn();
const mockLimit = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = jest.fn(() => ({ limit: mockLimit }));
const mockIn = jest.fn(() => ({ order: mockOrder }));
const mockEq = jest.fn(() => ({ in: mockIn }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({ select: mockSelect })),
  },
}));

import { useActiveBorrowRequestForItem } from '../useActiveBorrowRequestForItem';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';
import type { ItemId } from '@/shared/types';

const profileMap = () =>
  new Map([
    ['requester-1', { id: 'requester-1', displayName: 'Rita', avatarUrl: undefined }],
    ['owner-1', { id: 'owner-1', displayName: 'Olaf', avatarUrl: undefined }],
  ]);

describe('useActiveBorrowRequestForItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchPublicProfilesMap.mockResolvedValue(profileMap());
  });

  it('returns null when no active request exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(
      () => useActiveBorrowRequestForItem('item-1' as ItemId, { enabled: true }),
      { wrapper: createQueryClientHookWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('returns the active request when one is pending', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'req-1',
        item_id: 'item-1',
        requester_id: 'requester-1',
        status: BorrowRequestStatus.Pending,
        message: null,
        acted_by: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        items: {
          id: 'item-1',
          name: 'Road Bike',
          status: 'stored',
          owner_id: 'owner-1',
          availability_types: ['borrowable'],
        },
      },
      error: null,
    });

    const { result } = renderHook(
      () => useActiveBorrowRequestForItem('item-1' as ItemId, { enabled: true }),
      { wrapper: createQueryClientHookWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('req-1');
    expect(result.current.data?.status).toBe(BorrowRequestStatus.Pending);
    expect(result.current.data?.itemName).toBe('Road Bike');
  });

  it('filters by the live statuses (pending, accepted)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    renderHook(() => useActiveBorrowRequestForItem('item-1' as ItemId, { enabled: true }), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(mockIn).toHaveBeenCalled());
    expect(mockIn).toHaveBeenCalledWith('status', [
      BorrowRequestStatus.Pending,
      BorrowRequestStatus.Accepted,
    ]);
  });

  it('does not fetch when disabled', () => {
    renderHook(() => useActiveBorrowRequestForItem('item-1' as ItemId, { enabled: false }), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });
});
