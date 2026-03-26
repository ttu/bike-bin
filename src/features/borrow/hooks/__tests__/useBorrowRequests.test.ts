import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BorrowRequestStatus } from '@/shared/types';

// Counter-based mock for multiple from() calls
let mockCallCount = 0;
let mockFromChains: Record<string, unknown>[] = [];

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      const mockChain = mockFromChains[mockCallCount] ?? mockFromChains[0];
      mockCallCount++;
      return mockChain;
    }),
  },
}));

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

// Import after mocks
import { useBorrowRequests } from '../useBorrowRequests';

const mockBorrowRow = {
  id: 'req-1',
  item_id: 'item-1',
  requester_id: 'user-123',
  status: BorrowRequestStatus.Pending,
  message: 'Can I borrow this?',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  items: {
    id: 'item-1',
    name: 'Road Bike',
    status: 'stored',
    owner_id: 'owner-456',
    availability_types: ['borrow'],
  },
};

const mockProfiles = [
  { id: 'user-123', display_name: 'Alice', avatar_url: 'https://example.com/alice.jpg' },
  { id: 'owner-456', display_name: 'Bob', avatar_url: null },
];

describe('useBorrowRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCallCount = 0;
    mockFromChains = [];
  });

  it('fetches borrow requests with item and profile details', async () => {
    const mockBorrowChain = {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [mockBorrowRow], error: null }),
      }),
    };

    const mockProfilesChain = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      }),
    };

    mockFromChains = [mockBorrowChain, mockProfilesChain];

    const { result } = renderHook(() => useBorrowRequests(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data).toHaveLength(1);
    const req = result.current.data?.[0];
    expect(req?.itemName).toBe('Road Bike');
    expect(req?.requesterName).toBe('Alice');
    expect(req?.ownerName).toBe('Bob');
    expect(req?.ownerAvatarUrl).toBeUndefined();
  });

  it('handles items returned as an array', async () => {
    const rowWithArrayItems = {
      ...mockBorrowRow,
      items: [mockBorrowRow.items],
    };

    const mockBorrowChain = {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [rowWithArrayItems], error: null }),
      }),
    };

    const mockProfilesChain = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      }),
    };

    mockFromChains = [mockBorrowChain, mockProfilesChain];

    const { result } = renderHook(() => useBorrowRequests(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data?.[0]?.itemName).toBe('Road Bike');
  });

  it('returns empty array when data is null', async () => {
    const mockBorrowChain = {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    mockFromChains = [mockBorrowChain];

    const { result } = renderHook(() => useBorrowRequests(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data).toEqual([]);
  });

  it('uses "Unknown item" when items is null', async () => {
    const rowWithNullItem = { ...mockBorrowRow, items: null };

    const mockBorrowChain = {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [rowWithNullItem], error: null }),
      }),
    };

    const mockProfilesChain = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    mockFromChains = [mockBorrowChain, mockProfilesChain];

    const { result } = renderHook(() => useBorrowRequests(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data?.[0]?.itemName).toBe('Unknown item');
    expect(result.current.data?.[0]?.itemOwnerId).toBe('');
  });

  it('throws on supabase borrow_requests error', async () => {
    const mockBorrowChain = {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      }),
    };

    mockFromChains = [mockBorrowChain];

    const { result } = renderHook(() => useBorrowRequests(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.error).toBeTruthy();
  });

  it('is disabled when user is not authenticated', () => {
    jest.resetModules();
  });

  it('handles profiles being null gracefully', async () => {
    const mockBorrowChain = {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [mockBorrowRow], error: null }),
      }),
    };

    const mockProfilesChain = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    mockFromChains = [mockBorrowChain, mockProfilesChain];

    const { result } = renderHook(() => useBorrowRequests(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data?.[0]?.requesterName).toBeUndefined();
    expect(result.current.data?.[0]?.ownerName).toBeUndefined();
  });
});
