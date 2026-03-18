import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createMockLocation } from '@/test/factories';
import type { LocationId } from '@/shared/types';
import { useLocations, useLocation } from '../useLocations';
import { useCreateLocation } from '../useCreateLocation';
import { useDeleteLocation, DeleteLocationError } from '../useDeleteLocation';
import { usePrimaryLocation } from '../usePrimaryLocation';

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
    functions: {
      invoke: jest.fn(),
    },
  },
}));

// Mock useAuth
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));

// Mock geocoding
jest.mock('../../utils/geocoding', () => ({
  geocodePostcode: jest.fn().mockResolvedValue({
    areaName: 'Berlin Mitte',
    lat: 52.52,
    lng: 13.405,
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

describe('useLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches locations for current user ordered by primary first', async () => {
    const locations = [
      createMockLocation({ isPrimary: true }),
      createMockLocation({ isPrimary: false }),
    ];

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: jest.fn().mockReturnValue({
          order: mockOrder.mockResolvedValue({ data: locations, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('returns empty array when no locations', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: jest.fn().mockReturnValue({
          order: mockOrder.mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single location by id', async () => {
    const location = createMockLocation();

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: location, error: null }),
      }),
    });

    const { result } = renderHook(() => useLocation(location.id), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(mockEq).toHaveBeenCalledWith('id', location.id);
  });

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useLocation(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('geocodes and inserts a new location', async () => {
    const newLocation = createMockLocation({ isPrimary: true });

    // Mock the update to unset primary
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    // Mock the insert
    mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: newLocation, error: null }),
      }),
    });

    const { result } = renderHook(() => useCreateLocation(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      postcode: '10115',
      label: 'Home',
      isPrimary: true,
      country: 'de',
    });

    expect(mockInsert).toHaveBeenCalled();
  });
});

describe('useDeleteLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects deletion of last location', async () => {
    // Only 1 location exists
    mockSelect.mockReturnValue({
      eq: mockEq.mockResolvedValue({ count: 1, error: null }),
    });

    const { result } = renderHook(() => useDeleteLocation(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync('loc-1' as LocationId)).rejects.toThrow(
      'Cannot delete your only saved location',
    );
  });

  it('rejects deletion of location with items', async () => {
    // 2 locations exist
    const firstEq = jest.fn().mockResolvedValue({ count: 2, error: null });
    // 1 item references this location
    const secondEq = jest.fn().mockResolvedValue({ count: 1, error: null });

    let callCount = 0;
    mockSelect.mockImplementation(() => ({
      eq: () => {
        callCount++;
        if (callCount === 1) return firstEq();
        return secondEq();
      },
    }));

    const { result } = renderHook(() => useDeleteLocation(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync('loc-1' as LocationId);
    } catch (e) {
      expect(e).toBeInstanceOf(DeleteLocationError);
      expect((e as DeleteLocationError).code).toBe('HAS_ITEMS');
    }
  });
});

describe('usePrimaryLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the primary location', async () => {
    const primary = createMockLocation({ isPrimary: true });

    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: primary, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => usePrimaryLocation(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
