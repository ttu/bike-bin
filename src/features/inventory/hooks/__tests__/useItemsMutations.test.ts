import { renderHook } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';
import type { GroupId, ItemId, Item, ItemRow, ItemPhotoRow } from '@/shared/types';
import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  ItemStatus,
  Visibility,
} from '@/shared/types';
import { supabase } from '@/shared/api/supabase';

let mockCallCount = 0;
let mockFromChains: Record<string, unknown>[] = [];

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      const chain = mockFromChains[mockCallCount] ?? mockFromChains.at(-1);
      mockCallCount++;
      return chain;
    }),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

jest.mock('@/shared/utils/fetchFirstPhotoPaths', () => ({
  fetchFirstPhotoPaths: jest.fn().mockResolvedValue(new Map()),
}));

jest.mock('@/shared/utils/mapItemRow', () => ({
  mapItemRow: jest.fn((row: ItemRow) => ({
    id: row.id,
    name: row.name,
    age: row.age ?? undefined,
  })),
  mapItemPhotoRow: jest.fn((row: ItemPhotoRow) => ({
    id: row.id,
    storagePath: row.storage_path,
  })),
}));

import {
  createQueryClientHookWrapper,
  createQueryClientHookWrapperWithClient,
  createTestQueryClient,
} from '@/test/queryTestUtils';
import {
  useItems,
  useItem,
  useItemPhotos,
  useCreateItem,
  useUpdateItem,
  useUpdateItemStatus,
  useDeleteItem,
} from '../useItems';

beforeEach(() => {
  jest.clearAllMocks();
  mockCallCount = 0;
  mockFromChains = [];
});

describe('useItems', () => {
  it('fetches items for the current user', async () => {
    mockFromChains = [
      {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'item-1', name: 'Pedals' }],
              error: null,
            }),
          }),
        }),
      },
    ];

    renderHook(() => useItems(), { wrapper: createQueryClientHookWrapper() });
    await new Promise((r) => setTimeout(r, 100));

    expect(supabase.from).toHaveBeenCalledWith('items');
  });
});

describe('useItem', () => {
  it('fetches single item by ID', async () => {
    mockFromChains = [
      {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'item-1', name: 'Pedals' },
              error: null,
            }),
          }),
        }),
      },
    ];

    renderHook(() => useItem('item-1' as ItemId), { wrapper: createQueryClientHookWrapper() });
    await new Promise((r) => setTimeout(r, 100));

    expect(supabase.from).toHaveBeenCalledWith('items');
  });
});

describe('useItemPhotos', () => {
  it('fetches photos for an item', async () => {
    mockFromChains = [
      {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'p1', storage_path: 'path.jpg' }],
              error: null,
            }),
          }),
        }),
      },
    ];

    renderHook(() => useItemPhotos('item-1' as ItemId), {
      wrapper: createQueryClientHookWrapper(),
    });
    await new Promise((r) => setTimeout(r, 100));

    expect(supabase.from).toHaveBeenCalledWith('item_photos');
  });
});

describe('useCreateItem', () => {
  it('creates an item', async () => {
    mockFromChains = [
      {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'item-new', name: 'Chain' },
              error: null,
            }),
          }),
        }),
      },
    ];

    const { result } = renderHook(() => useCreateItem(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({
      name: 'Chain',
      category: ItemCategory.Component,
      subcategory: 'drivetrain',
      condition: ItemCondition.Good,
      availabilityTypes: [AvailabilityType.Borrowable],
    });

    expect(supabase.from).toHaveBeenCalledWith('items');
  });

  it('syncs item groups when visibility is groups', async () => {
    mockFromChains = [
      {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'item-new', name: 'Chain' },
              error: null,
            }),
          }),
        }),
      },
      {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      },
      {
        insert: jest.fn().mockResolvedValue({ error: null }),
      },
    ];

    const { result } = renderHook(() => useCreateItem(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({
      name: 'Chain',
      category: ItemCategory.Component,
      subcategory: 'drivetrain',
      condition: ItemCondition.Good,
      availabilityTypes: [AvailabilityType.Borrowable],
      visibility: Visibility.Groups,
      groupIds: ['g1' as GroupId],
    });

    expect(mockCallCount).toBe(3);
  });
});

describe('useUpdateItem', () => {
  it('writes the updated item into the item detail query cache on success', async () => {
    mockFromChains = [
      {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'item-1',
                  name: 'Pedals',
                  age: '1_to_2_years',
                },
                error: null,
              }),
            }),
          }),
        }),
      },
      {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      },
    ];

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['items', 'item-1' as ItemId], {
      id: 'item-1',
      name: 'Pedals',
      age: 'less_than_6_months',
      thumbnailStoragePath: 'items/u1/item-1/thumb.jpg',
    } as unknown as Item);

    const { result } = renderHook(() => useUpdateItem(), {
      wrapper: createQueryClientHookWrapperWithClient(queryClient),
    });

    await result.current.mutateAsync({
      id: 'item-1' as ItemId,
      name: 'Pedals',
      category: ItemCategory.Component,
      subcategory: 'drivetrain',
      condition: ItemCondition.Good,
      availabilityTypes: [AvailabilityType.Private],
      visibility: Visibility.Private,
      age: '1_to_2_years',
      tags: [],
    });

    const cached = queryClient.getQueryData<Item>(['items', 'item-1' as ItemId]);
    expect(cached).toMatchObject({
      id: 'item-1',
      name: 'Pedals',
      age: '1_to_2_years',
      thumbnailStoragePath: 'items/u1/item-1/thumb.jpg',
    });
  });
});

describe('useUpdateItemStatus', () => {
  it('updates item status', async () => {
    mockFromChains = [
      {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'item-1', name: 'Pedals', status: 'listed' },
                error: null,
              }),
            }),
          }),
        }),
      },
    ];

    const { result } = renderHook(() => useUpdateItemStatus(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({ id: 'item-1' as ItemId, status: ItemStatus.Archived });

    expect(supabase.from).toHaveBeenCalledWith('items');
  });
});

describe('useDeleteItem', () => {
  it('deletes item with stored status', async () => {
    mockFromChains = [
      {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      },
    ];

    const { result } = renderHook(() => useDeleteItem(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await result.current.mutateAsync({ id: 'item-1' as ItemId, status: ItemStatus.Stored });

    expect(supabase.from).toHaveBeenCalledWith('items');
  });

  it('throws when deleting item with loaned status', async () => {
    const { result } = renderHook(() => useDeleteItem(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({ id: 'item-1' as ItemId, status: ItemStatus.Loaned }),
    ).rejects.toThrow('Cannot delete');
  });
});
