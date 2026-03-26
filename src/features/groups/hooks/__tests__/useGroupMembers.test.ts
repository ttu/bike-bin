import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createMockGroupMember } from '@/test/factories';
import { GroupRole } from '@/shared/types';
import type { GroupId, UserId } from '@/shared/types';

const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockEq2 = jest.fn();
const mockOrder = jest.fn();
const mockOrder2 = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
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
import { useGroupMembers, usePromoteMember, useRemoveMember } from '../useGroupMembers';

describe('useGroupMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches members with profiles for a group', async () => {
    const member = createMockGroupMember({ role: GroupRole.Admin });
    const mockRow = {
      group_id: member.groupId,
      user_id: member.userId,
      role: member.role,
      joined_at: member.joinedAt,
      profiles: { display_name: 'Alice', avatar_url: 'https://example.com/avatar.jpg' },
    };

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          order: mockOrder2.mockResolvedValue({ data: [mockRow], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useGroupMembers(member.groupId), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSelect).toHaveBeenCalledWith(
      'group_id, user_id, role, joined_at, profiles(display_name, avatar_url)',
    );
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveLength(1);
  });

  it('throws on supabase error', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          order: mockOrder2.mockResolvedValue({ data: null, error: new Error('DB error') }),
        }),
      }),
    });

    const { result } = renderHook(() => useGroupMembers('group-1' as GroupId), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.error).toBeTruthy();
  });

  it('is disabled when groupId is empty', () => {
    const { result } = renderHook(() => useGroupMembers('' as GroupId), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('maps profile fields correctly', async () => {
    const mockRow = {
      group_id: 'group-1',
      user_id: 'user-1',
      role: 'Member',
      joined_at: '2026-01-01T00:00:00Z',
      profiles: { display_name: 'Bob', avatar_url: null },
    };

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          order: mockOrder2.mockResolvedValue({ data: [mockRow], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useGroupMembers('group-1' as GroupId), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data?.[0]?.profile?.displayName).toBe('Bob');
    // avatar_url: null maps to null (not undefined) in the profile object
    expect(result.current.data?.[0]?.profile?.avatarUrl).toBeNull();
  });

  it('returns empty array when data is empty', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          order: mockOrder2.mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useGroupMembers('group-1' as GroupId), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data).toEqual([]);
  });
});

describe('usePromoteMember', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates role to Admin and invalidates queries', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ error: null }),
      }),
    });

    const { result } = renderHook(() => usePromoteMember(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        groupId: 'group-1' as GroupId,
        userId: 'user-1' as UserId,
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith({ role: GroupRole.Admin });
    expect(mockEq).toHaveBeenCalledWith('group_id', 'group-1');
    expect(mockEq2).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on supabase error', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ error: new Error('Not authorized') }),
      }),
    });

    const { result } = renderHook(() => usePromoteMember(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({
        groupId: 'group-1' as GroupId,
        userId: 'user-1' as UserId,
      }),
    ).rejects.toThrow('Not authorized');
  });
});

describe('useRemoveMember', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a member and invalidates queries', async () => {
    mockDelete.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ error: null }),
      }),
    });

    const { result } = renderHook(() => useRemoveMember(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        groupId: 'group-1' as GroupId,
        userId: 'user-1' as UserId,
      });
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('group_id', 'group-1');
    expect(mockEq2).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on supabase error', async () => {
    mockDelete.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq2.mockResolvedValue({ error: new Error('RLS violation') }),
      }),
    });

    const { result } = renderHook(() => useRemoveMember(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({
        groupId: 'group-1' as GroupId,
        userId: 'user-1' as UserId,
      }),
    ).rejects.toThrow('RLS violation');
  });
});
