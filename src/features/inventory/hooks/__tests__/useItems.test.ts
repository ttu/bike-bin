import { renderHook, waitFor } from '@testing-library/react-native';
import { createMockItemRow } from '@/test/factories';
import { mapItemRow } from '@/shared/utils/mapItemRow';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';
import { useItems, useItem, useCreateItem, useDeleteItem } from '../useItems';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

// Mock supabase
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDeleteFn = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

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
        update: mockUpdate,
        delete: mockDeleteFn,
      };
    }),
  },
}));

// Mock useAuth
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));


describe('useItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches items for current user', async () => {
    const rows = [createMockItemRow(), createMockItemRow()];
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: rows, error: null }),
      }),
    });

    const { result } = renderHook(() => useItems(), { wrapper: createQueryClientHookWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(rows.map((r) => mapItemRow(r)));
    expect(mockEq).toHaveBeenCalledWith('owner_id', 'user-123');
    expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('returns empty array when no items', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: [], error: null }),
      }),
    });

    const { result } = renderHook(() => useItems(), { wrapper: createQueryClientHookWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single item by id', async () => {
    const row = createMockItemRow();
    const itemId = row.id as string as ItemId;
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: row, error: null }),
      }),
    });

    const { result } = renderHook(() => useItem(itemId), { wrapper: createQueryClientHookWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mapItemRow(row));
    expect(mockEq).toHaveBeenCalledWith('id', itemId);
  });
});

describe('useCreateItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts an item via supabase', async () => {
    const row = createMockItemRow();
    mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: row, error: null }),
      }),
    });

    const { result } = renderHook(() => useCreateItem(), { wrapper: createQueryClientHookWrapper() });

    const item = mapItemRow(row);
    await result.current.mutateAsync({
      name: item.name,
      category: item.category,
      condition: item.condition,
      availabilityTypes: item.availabilityTypes,
    });

    expect(mockInsert).toHaveBeenCalled();
  });
});

describe('useDeleteItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes an item that can be deleted', async () => {
    mockDeleteFn.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useDeleteItem(), { wrapper: createQueryClientHookWrapper() });

    await result.current.mutateAsync({
      id: 'item-1' as ItemId,
      status: ItemStatus.Stored,
    });

    expect(mockDeleteFn).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
  });

  it('rejects deletion of loaned items', async () => {
    const { result } = renderHook(() => useDeleteItem(), { wrapper: createQueryClientHookWrapper() });

    await expect(
      result.current.mutateAsync({
        id: 'item-1' as ItemId,
        status: ItemStatus.Loaned,
      }),
    ).rejects.toThrow('Cannot delete');
  });
});
