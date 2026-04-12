import { renderHook, waitFor } from '@testing-library/react-native';
import { createMockItemRow } from '@/test/factories';
import { mockSelect, mockInsert, mockEq, mockOrder, mockSingle } from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';
import { mapItemRow } from '@/shared/utils/mapItemRow';
import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { GroupId } from '@/shared/types';
import { useGroupItems, useCreateGroupItem } from '../useGroupItems';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'item_photos') {
        return {
          select: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      return {
        select: mockSelect,
        insert: mockInsert,
      };
    }),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

const GROUP_ID = 'group-1' as GroupId;

describe('useGroupItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches items for the given group', async () => {
    const rows = [
      createMockItemRow({ owner_id: null, group_id: GROUP_ID, created_by: 'user-123' }),
      createMockItemRow({ owner_id: null, group_id: GROUP_ID, created_by: 'user-123' }),
    ];
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: rows, error: null }),
      }),
    });

    const { result } = renderHook(() => useGroupItems(GROUP_ID), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(rows.map((r) => mapItemRow(r)));
    expect(mockEq).toHaveBeenCalledWith('group_id', GROUP_ID);
    expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('does not fetch when groupId is undefined', async () => {
    const { result } = renderHook(() => useGroupItems(undefined), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSelect).not.toHaveBeenCalled();
  });
});

describe('useCreateGroupItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a group-owned item with owner_id null and created_by user id', async () => {
    const row = createMockItemRow({
      owner_id: null,
      group_id: GROUP_ID,
      created_by: 'user-123',
    });
    mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: row, error: null }),
      }),
    });

    const { result } = renderHook(() => useCreateGroupItem(GROUP_ID), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({
      name: 'Shared Pump',
      category: ItemCategory.Tool,
      condition: ItemCondition.Good,
      availabilityTypes: [AvailabilityType.Borrowable],
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.owner_id).toBeNull();
    expect(insertArg.group_id).toBe(GROUP_ID);
    expect(insertArg.created_by).toBe('user-123');
    expect(insertArg.visibility).toBe('groups');
  });

  it('honors explicit visibility override from form data', async () => {
    const row = createMockItemRow({
      owner_id: null,
      group_id: GROUP_ID,
      created_by: 'user-123',
    });
    mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: row, error: null }),
      }),
    });

    const { result } = renderHook(() => useCreateGroupItem(GROUP_ID), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({
      name: 'Shared Pump',
      category: ItemCategory.Tool,
      condition: ItemCondition.Good,
      availabilityTypes: [AvailabilityType.Borrowable],
      visibility: 'all',
    });

    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.visibility).toBe('all');
  });
});
