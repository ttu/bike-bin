import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ItemId } from '@/shared/types';
import { ItemStatus, Visibility } from '@/shared/types';
import { supabase } from '@/shared/api/supabase';

let mockCallCount = 0;
let mockFromChains: Record<string, unknown>[] = [];

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      const chain = mockFromChains[mockCallCount] ?? mockFromChains[mockFromChains.length - 1];
      mockCallCount++;
      return chain;
    }),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

jest.mock('@/shared/utils/fetchThumbnailPaths', () => ({
  fetchThumbnailPaths: jest.fn().mockResolvedValue(new Map()),
}));

jest.mock('@/shared/utils/mapItemRow', () => ({
  mapItemRow: jest.fn((row: Record<string, unknown>) => ({ id: row.id, name: row.name })),
  mapItemPhotoRow: jest.fn((row: Record<string, unknown>) => ({
    id: row.id,
    storagePath: row.storage_path,
  })),
}));

import {
  useItems,
  useItem,
  useItemPhotos,
  useCreateItem,
  useUpdateItemStatus,
  useDeleteItem,
} from '../useItems';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

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

    renderHook(() => useItems(), { wrapper: createWrapper() });
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

    renderHook(() => useItem('item-1' as ItemId), { wrapper: createWrapper() });
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

    renderHook(() => useItemPhotos('item-1' as ItemId), { wrapper: createWrapper() });
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

    const { result } = renderHook(() => useCreateItem(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      name: 'Chain',
      category: 'drivetrain',
      condition: 'good',
      availabilityTypes: ['borrow'],
    } as never);

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

    const { result } = renderHook(() => useCreateItem(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      name: 'Chain',
      category: 'drivetrain',
      condition: 'good',
      availabilityTypes: ['borrow'],
      visibility: Visibility.Groups,
      groupIds: ['g1'],
    } as never);

    expect(mockCallCount).toBe(3);
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

    const { result } = renderHook(() => useUpdateItemStatus(), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useDeleteItem(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 'item-1' as ItemId, status: ItemStatus.Stored });

    expect(supabase.from).toHaveBeenCalledWith('items');
  });

  it('throws when deleting item with loaned status', async () => {
    const { result } = renderHook(() => useDeleteItem(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({ id: 'item-1' as ItemId, status: ItemStatus.Loaned }),
    ).rejects.toThrow('Cannot delete');
  });
});
