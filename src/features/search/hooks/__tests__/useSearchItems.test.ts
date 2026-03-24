import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { UserId, LocationId } from '@/shared/types';
import { useSearchItems } from '../useSearchItems';
import { DEFAULT_SEARCH_FILTERS } from '../../types';
import type { SearchFilters } from '../../types';

// Mock supabase
const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock usePrimaryLocation
const mockPrimaryLocation = {
  id: 'loc-1' as LocationId,
  userId: 'user-1' as UserId,
  label: 'Home',
  areaName: 'Berlin Mitte',
  postcode: '10115',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  isPrimary: true,
  createdAt: '2026-01-01T00:00:00Z',
};

jest.mock('@/features/locations', () => ({
  usePrimaryLocation: () => ({
    data: mockPrimaryLocation,
    isLoading: false,
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

function createRpcRow(overrides?: Record<string, unknown>) {
  return {
    id: 'item-1',
    owner_id: 'owner-1',
    name: 'Shimano Cassette',
    category: ItemCategory.Component,
    brand: 'Shimano',
    model: '105 R7000',
    description: 'Good cassette',
    condition: ItemCondition.Good,
    status: 'stored',
    availability_types: [AvailabilityType.Borrowable],
    price: null,
    deposit: null,
    borrow_duration: null,
    visibility: 'all',
    pickup_location_id: 'loc-2',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    distance_meters: 1500,
    ...overrides,
  };
}

describe('useSearchItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: profiles fetch returns empty
    mockFrom.mockImplementation((table: string) => {
      if (table === 'public_profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      if (table === 'saved_locations') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      if (table === 'item_photos') {
        return {
          select: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      return { select: mockSelect };
    });
  });

  it('does not fetch when query is empty', () => {
    const filters: SearchFilters = { ...DEFAULT_SEARCH_FILTERS, query: '' };
    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('fetches search results when query is provided', async () => {
    const row = createRpcRow();
    mockRpc.mockResolvedValue({ data: [row], error: null });

    const filters: SearchFilters = { ...DEFAULT_SEARCH_FILTERS, query: 'cassette' };
    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockRpc).toHaveBeenCalledWith('search_nearby_items', {
      query: 'cassette',
      lat: 52.52,
      lng: 13.405,
      max_distance_meters: 25000,
      p_category: undefined,
      p_condition: undefined,
      p_limit: 50,
      p_offset: 0,
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Shimano Cassette');
    expect(result.current.data![0].distanceMeters).toBe(1500);
  });

  it('passes single category filter to RPC', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const filters: SearchFilters = {
      ...DEFAULT_SEARCH_FILTERS,
      query: 'chain',
      categories: [ItemCategory.Component],
    };

    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'search_nearby_items',
      expect.objectContaining({ p_category: 'component' }),
    );
  });

  it('filters by offer type client-side', async () => {
    const borrowable = createRpcRow({
      id: 'item-1',
      availability_types: [AvailabilityType.Borrowable],
    });
    const sellable = createRpcRow({
      id: 'item-2',
      owner_id: 'owner-1',
      availability_types: [AvailabilityType.Sellable],
      price: 50,
    });
    mockRpc.mockResolvedValue({ data: [borrowable, sellable], error: null });

    const filters: SearchFilters = {
      ...DEFAULT_SEARCH_FILTERS,
      query: 'part',
      offerTypes: [AvailabilityType.Borrowable],
    };

    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe('item-1');
  });

  it('applies price range filter client-side', async () => {
    const cheap = createRpcRow({
      id: 'item-1',
      availability_types: [AvailabilityType.Sellable],
      price: 10,
    });
    const expensive = createRpcRow({
      id: 'item-2',
      owner_id: 'owner-1',
      availability_types: [AvailabilityType.Sellable],
      price: 200,
    });
    mockRpc.mockResolvedValue({ data: [cheap, expensive], error: null });

    const filters: SearchFilters = {
      ...DEFAULT_SEARCH_FILTERS,
      query: 'part',
      priceMax: 50,
    };

    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].price).toBe(10);
  });

  it('sorts by newest when sortBy is newest', async () => {
    const older = createRpcRow({
      id: 'item-1',
      created_at: '2026-01-01T00:00:00Z',
      distance_meters: 100,
    });
    const newer = createRpcRow({
      id: 'item-2',
      owner_id: 'owner-1',
      created_at: '2026-03-01T00:00:00Z',
      distance_meters: 5000,
    });
    mockRpc.mockResolvedValue({ data: [older, newer], error: null });

    const filters: SearchFilters = {
      ...DEFAULT_SEARCH_FILTERS,
      query: 'part',
      sortBy: 'newest',
    };

    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data![0].id).toBe('item-2');
    expect(result.current.data![1].id).toBe('item-1');
  });

  it('enriches results with owner profile data', async () => {
    const row = createRpcRow({ owner_id: 'owner-abc' });
    mockRpc.mockResolvedValue({ data: [row], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'public_profiles') {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [
                  {
                    id: 'owner-abc',
                    display_name: 'Alice',
                    avatar_url: 'https://example.com/alice.jpg',
                    rating_avg: 4.5,
                    rating_count: 12,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'saved_locations') {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [{ id: 'loc-2', area_name: 'Kreuzberg' }],
                error: null,
              }),
          }),
        };
      }
      if (table === 'item_photos') {
        return {
          select: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      return { select: mockSelect };
    });

    const filters: SearchFilters = { ...DEFAULT_SEARCH_FILTERS, query: 'cassette' };
    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const item = result.current.data![0];
    expect(item.ownerDisplayName).toBe('Alice');
    expect(item.ownerAvatarUrl).toBe('https://example.com/alice.jpg');
    expect(item.ownerRatingAvg).toBe(4.5);
    expect(item.ownerRatingCount).toBe(12);
    expect(item.areaName).toBe('Kreuzberg');
  });

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const filters: SearchFilters = { ...DEFAULT_SEARCH_FILTERS, query: 'fail' };
    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('respects enabled flag', () => {
    const filters: SearchFilters = { ...DEFAULT_SEARCH_FILTERS, query: 'test' };
    const { result } = renderHook(() => useSearchItems({ filters, enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
