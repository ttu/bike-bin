import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createMockItem } from '@/test/factories';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';
import { useItems, useItem, useCreateItem, useDeleteItem } from '../useItems';

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
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDeleteFn,
    })),
  },
}));

// Mock useAuth
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('useItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches items for current user', async () => {
    const items = [createMockItem(), createMockItem()];
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: items, error: null }),
      }),
    });

    const { result } = renderHook(() => useItems(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(items);
    expect(mockEq).toHaveBeenCalledWith('owner_id', 'user-123');
    expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('returns empty array when no items', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: [], error: null }),
      }),
    });

    const { result } = renderHook(() => useItems(), { wrapper: createWrapper() });

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
    const item = createMockItem();
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: item, error: null }),
      }),
    });

    const { result } = renderHook(() => useItem(item.id), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(item);
    expect(mockEq).toHaveBeenCalledWith('id', item.id);
  });
});

describe('useCreateItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts an item via supabase', async () => {
    const newItem = createMockItem();
    mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: newItem, error: null }),
      }),
    });

    const { result } = renderHook(() => useCreateItem(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      name: newItem.name,
      category: newItem.category,
      condition: newItem.condition,
      availabilityTypes: newItem.availabilityTypes,
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

    const { result } = renderHook(() => useDeleteItem(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      id: 'item-1' as ItemId,
      status: ItemStatus.Stored,
    });

    expect(mockDeleteFn).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
  });

  it('rejects deletion of loaned items', async () => {
    const { result } = renderHook(() => useDeleteItem(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({
        id: 'item-1' as ItemId,
        status: ItemStatus.Loaned,
      }),
    ).rejects.toThrow('Cannot delete');
  });
});
