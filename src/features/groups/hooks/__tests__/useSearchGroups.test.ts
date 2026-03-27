import { renderHook, waitFor } from '@testing-library/react-native';
import { createMockGroup } from '@/test/factories';

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


// Import after mocks
import { useSearchGroups } from '../useSearchGroups';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useSearchGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCallCount = 0;
    mockFromChains = [];
  });

  it('is disabled when query is shorter than 2 characters', () => {
    const { result } = renderHook(() => useSearchGroups('a'), { wrapper: createQueryClientHookWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns empty array when no groups match', async () => {
    // First call: groups query returns empty
    mockFromChains = [
      {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      },
    ];

    const { result } = renderHook(() => useSearchGroups('road'), { wrapper: createQueryClientHookWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('fetches groups with member counts and membership status', async () => {
    const group = createMockGroup({ name: 'Road Cyclists', isPublic: true });
    const groupRow = {
      id: group.id,
      name: group.name,
      description: group.description,
      is_public: true,
      created_at: group.createdAt,
    };

    // Call 1: groups search
    const mockGroupsChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [groupRow], error: null }),
            }),
          }),
        }),
      }),
    };

    // Call 2: group_members count
    const mockCountsChain = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [{ group_id: group.id }, { group_id: group.id }],
          error: null,
        }),
      }),
    };

    // Call 3: user memberships
    const mockMembershipsChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ group_id: group.id }],
            error: null,
          }),
        }),
      }),
    };

    mockFromChains = [mockGroupsChain, mockCountsChain, mockMembershipsChain];

    const { result } = renderHook(() => useSearchGroups('road'), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.memberCount).toBe(2);
    expect(result.current.data?.[0]?.isMember).toBe(true);
  });

  it('marks groups user is not a member of correctly', async () => {
    const group = createMockGroup({ name: 'MTB Club', isPublic: true });
    const groupRow = {
      id: group.id,
      name: group.name,
      description: group.description,
      is_public: true,
      created_at: group.createdAt,
    };

    const mockGroupsChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [groupRow], error: null }),
            }),
          }),
        }),
      }),
    };

    const mockCountsChain = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [{ group_id: group.id }],
          error: null,
        }),
      }),
    };

    const mockMembershipsChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    };

    mockFromChains = [mockGroupsChain, mockCountsChain, mockMembershipsChain];

    const { result } = renderHook(() => useSearchGroups('mtb'), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data?.[0]?.isMember).toBe(false);
    expect(result.current.data?.[0]?.memberCount).toBe(1);
  });

  it('throws when groups query fails', async () => {
    mockFromChains = [
      {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
              }),
            }),
          }),
        }),
      },
    ];

    const { result } = renderHook(() => useSearchGroups('road'), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.error).toBeTruthy();
  });

  it('throws when member counts query fails', async () => {
    const group = createMockGroup({ isPublic: true });
    const groupRow = {
      id: group.id,
      name: group.name,
      description: group.description,
      is_public: true,
      created_at: group.createdAt,
    };

    const mockGroupsChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [groupRow], error: null }),
            }),
          }),
        }),
      }),
    };

    const mockCountsChain = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: null, error: new Error('Count error') }),
      }),
    };

    mockFromChains = [mockGroupsChain, mockCountsChain];

    const { result } = renderHook(() => useSearchGroups('road'), { wrapper: createQueryClientHookWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.error).toBeTruthy();
  });
});
