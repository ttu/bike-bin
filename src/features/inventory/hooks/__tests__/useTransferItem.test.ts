import { renderHook, waitFor } from '@testing-library/react-native';
import { mockRpc } from '@/test/supabaseMocks';
import type { ItemId, UserId, GroupId } from '@/shared/types';
import { useTransferItem } from '../useTransferItem';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

const mockInvalidateQueries = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

const ITEM_ID = 'item-1' as ItemId;
const USER_ID = 'user-2' as UserId;
const GROUP_ID = 'group-1' as GroupId;

describe('useTransferItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls transfer_item_ownership RPC with target owner', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useTransferItem(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({ itemId: ITEM_ID, toOwnerId: USER_ID });

    expect(mockRpc).toHaveBeenCalledWith('transfer_item_ownership', {
      p_item_id: ITEM_ID,
      p_to_owner_id: USER_ID,
      p_to_group_id: null,
    });
  });

  it('calls transfer_item_ownership RPC with target group', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useTransferItem(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({ itemId: ITEM_ID, toGroupId: GROUP_ID });

    expect(mockRpc).toHaveBeenCalledWith('transfer_item_ownership', {
      p_item_id: ITEM_ID,
      p_to_owner_id: null,
      p_to_group_id: GROUP_ID,
    });
  });

  it('invalidates items, group-items, and conversations queries on success', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useTransferItem(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({ itemId: ITEM_ID, toGroupId: GROUP_ID });

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['items'] });
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['group-items'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['conversations'] });
  });

  it('throws when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'forbidden' } });

    const { result } = renderHook(() => useTransferItem(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({ itemId: ITEM_ID, toOwnerId: USER_ID }),
    ).rejects.toEqual({ message: 'forbidden' });
  });
});
