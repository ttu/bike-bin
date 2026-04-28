import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMockGroupMember } from '@/test/factories';
import { mockUpdate, mockDelete, mockEq, mockRpc, mockSupabase } from '@/test/supabaseMocks';
import { GroupRole, type GroupId, type UserId } from '@/shared/types';

const mockEq2 = jest.fn();

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));

// Import after mocks
import { useGroupMembers, usePromoteMember, useRemoveMember } from '../useGroupMembers';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useGroupMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches members with profiles for a group via RPC', async () => {
    const member = createMockGroupMember({ role: GroupRole.Admin });
    const mockRow = {
      group_id: member.groupId,
      user_id: member.userId,
      role: member.role,
      joined_at: member.joinedAt,
      display_name: 'Alice',
      avatar_url: 'https://example.com/avatar.jpg',
    };

    mockRpc.mockResolvedValue({ data: [mockRow], error: null });

    const { result } = renderHook(() => useGroupMembers(member.groupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('get_group_members_with_profiles', {
        p_group_id: member.groupId,
      });
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0]?.profile?.displayName).toBe('Alice');
    });
  });

  it('throws on supabase error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('DB error') });

    const { result } = renderHook(() => useGroupMembers('group-1' as GroupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('is disabled when groupId is empty', () => {
    const { result } = renderHook(() => useGroupMembers('' as GroupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('maps null avatar_url to undefined', async () => {
    const mockRow = {
      group_id: 'group-1',
      user_id: 'user-1',
      role: 'Member',
      joined_at: '2026-01-01T00:00:00Z',
      display_name: 'Bob',
      avatar_url: null,
    };

    mockRpc.mockResolvedValue({ data: [mockRow], error: null });

    const { result } = renderHook(() => useGroupMembers('group-1' as GroupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.[0]?.profile?.displayName).toBe('Bob');
    });
    expect(result.current.data?.[0]?.profile?.avatarUrl).toBeUndefined();
  });

  it('returns empty array when data is empty', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useGroupMembers('group-1' as GroupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
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

    const { result } = renderHook(() => usePromoteMember(), {
      wrapper: createQueryClientHookWrapper(),
    });

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

    const { result } = renderHook(() => usePromoteMember(), {
      wrapper: createQueryClientHookWrapper(),
    });

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

    const { result } = renderHook(() => useRemoveMember(), {
      wrapper: createQueryClientHookWrapper(),
    });

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

    const { result } = renderHook(() => useRemoveMember(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        groupId: 'group-1' as GroupId,
        userId: 'user-1' as UserId,
      }),
    ).rejects.toThrow('RLS violation');
  });
});
