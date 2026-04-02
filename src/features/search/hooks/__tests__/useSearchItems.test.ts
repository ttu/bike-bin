import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { UserId, LocationId } from '@/shared/types';
import { useSearchItems } from '../useSearchItems';
import { DEFAULT_SEARCH_FILTERS } from '../../types';
import type { SearchFilters } from '../../types';

const mockAuth = { isAuthenticated: true };

const mockFetchPublicProfilesMap = jest.fn();

jest.mock('@/shared/api/fetchPublicProfile', () => ({
  fetchPublicProfilesMap: (...args: unknown[]) => mockFetchPublicProfilesMap(...args),
}));

// Mock supabase
const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'current-user-id' } },
        error: null,
      }),
    },
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

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    isAuthenticated: mockAuth.isAuthenticated,
    isLoading: false,
    user: mockAuth.isAuthenticated ? { id: 'current-user-id' } : null,
    session: null,
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signOut: jest.fn(),
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
    quantity: 1,
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
    mockAuth.isAuthenticated = true;
    mockFetchPublicProfilesMap.mockResolvedValue(new Map());

    mockFrom.mockImplementation((table: string) => {
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

  it('does not fetch when user is not authenticated', () => {
    mockAuth.isAuthenticated = false;
    const filters: SearchFilters = { ...DEFAULT_SEARCH_FILTERS, query: 'cassette' };
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
      p_categories: undefined,
      p_conditions: undefined,
      p_limit: 50,
      p_offset: 0,
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Shimano Cassette');
    expect(result.current.data![0].distanceMeters).toBe(1500);
  });

  it('passes category array filter to RPC', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const filters: SearchFilters = {
      ...DEFAULT_SEARCH_FILTERS,
      query: 'chain',
      categories: [ItemCategory.Component, ItemCategory.Tool],
    };

    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'search_nearby_items',
      expect.objectContaining({ p_categories: ['component', 'tool'] }),
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

    mockFetchPublicProfilesMap.mockResolvedValue(
      new Map([
        [
          'owner-abc',
          {
            id: 'owner-abc',
            displayName: 'Alice',
            avatarUrl: 'https://example.com/alice.jpg',
            ratingAvg: 4.5,
            ratingCount: 12,
          },
        ],
      ]),
    );

    mockFrom.mockImplementation((table: string) => {
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

  it('passes through RPC results without client-side own-item filtering (exclusion is a DB contract)', async () => {
    // Contract: the DB excludes own items (owner_id = current user); the hook passes results through unchanged.
    const otherItem = createRpcRow({ id: 'other-item', owner_id: 'other-user-id' });
    mockRpc.mockResolvedValue({ data: [otherItem], error: null });

    const filters: SearchFilters = { ...DEFAULT_SEARCH_FILTERS, query: 'cassette' };
    const { result } = renderHook(() => useSearchItems({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const ids = result.current.data!.map((r) => r.id);
    expect(ids).not.toContain('own-item');
    expect(ids).toContain('other-item');
  });
});
