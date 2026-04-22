import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  mockSelect,
  mockInsert,
  mockUpdate,
  mockEq,
  mockOrder,
  mockRpc,
  mockSupabase,
} from '@/test/supabaseMocks';
import { mockAuthModule } from '@/test/authMocks';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';
import type { GroupId, GroupInvitationId, UserId } from '@/shared/types';

jest.mock('@/shared/api/supabase', () => ({ supabase: mockSupabase }));
jest.mock('@/features/auth', () => mockAuthModule);

import {
  useCreateInvitation,
  useCancelInvitation,
  useAcceptInvitation,
  useRejectInvitation,
  usePendingGroupInvitations,
  useMyGroupInvitations,
  useSearchInvitableUsers,
} from '../useGroupInvitations';

beforeEach(() => jest.clearAllMocks());

describe('useCreateInvitation', () => {
  it('inserts a pending invitation with current user as inviter', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useCreateInvitation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        groupId: 'group-1' as GroupId,
        userId: 'user-2' as UserId,
      });
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('group_invitations');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        group_id: 'group-1',
        invitee_user_id: 'user-2',
        inviter_user_id: expect.any(String),
      }),
    );
  });

  it('propagates insert errors', async () => {
    mockInsert.mockResolvedValue({ error: new Error('dup') });
    const { result } = renderHook(() => useCreateInvitation(), {
      wrapper: createQueryClientHookWrapper(),
    });
    await expect(
      result.current.mutateAsync({
        groupId: 'group-1' as GroupId,
        userId: 'user-2' as UserId,
      }),
    ).rejects.toThrow('dup');
  });
});

describe('useCancelInvitation', () => {
  it('updates status to cancelled', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useCancelInvitation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        invitationId: 'inv-1' as GroupInvitationId,
        groupId: 'group-1' as GroupId,
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
    expect(mockEq).toHaveBeenCalledWith('id', 'inv-1');
  });
});

describe('useAcceptInvitation', () => {
  it('calls the accept RPC with the invitation id', async () => {
    mockRpc.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAcceptInvitation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        invitationId: 'inv-1' as GroupInvitationId,
        groupId: 'group-1' as GroupId,
      });
    });

    expect(mockRpc).toHaveBeenCalledWith('accept_group_invitation', {
      p_invitation_id: 'inv-1',
    });
  });

  it('propagates RPC errors', async () => {
    mockRpc.mockResolvedValue({ error: new Error('not pending') });
    const { result } = renderHook(() => useAcceptInvitation(), {
      wrapper: createQueryClientHookWrapper(),
    });
    await expect(
      result.current.mutateAsync({
        invitationId: 'inv-1' as GroupInvitationId,
        groupId: 'group-1' as GroupId,
      }),
    ).rejects.toThrow('not pending');
  });
});

describe('useRejectInvitation', () => {
  it('updates status to rejected', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useRejectInvitation(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        invitationId: 'inv-1' as GroupInvitationId,
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }));
    expect(mockEq).toHaveBeenCalledWith('id', 'inv-1');
  });
});

describe('usePendingGroupInvitations', () => {
  it('queries group_invitations filtered to pending', async () => {
    const row = {
      id: 'inv-1',
      group_id: 'group-1',
      invitee_user_id: 'user-2',
      inviter_user_id: 'user-1',
      status: 'pending',
      created_at: '2026-04-22T00:00:00Z',
      responded_at: null,
      profiles: { display_name: 'Bob', avatar_url: null },
    };
    const mockEq2 = jest.fn().mockReturnValue({
      order: mockOrder.mockResolvedValue({ data: [row], error: null }),
    });
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({ eq: mockEq2 }),
    });

    const { result } = renderHook(() => usePendingGroupInvitations('group-1' as GroupId), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.invitee.displayName).toBe('Bob');
  });

  it('is disabled when groupId is undefined', () => {
    const { result } = renderHook(() => usePendingGroupInvitations(undefined), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockSelect).not.toHaveBeenCalled();
  });
});

describe('useMyGroupInvitations', () => {
  it('queries group_invitations filtered to current user + pending', async () => {
    const row = {
      id: 'inv-1',
      group_id: 'group-1',
      invitee_user_id: 'user-1',
      inviter_user_id: 'user-2',
      status: 'pending',
      created_at: '2026-04-22T00:00:00Z',
      responded_at: null,
      groups: { name: 'Local Crew', is_public: false },
      inviter: { display_name: 'Alice' },
    };
    const mockEq2 = jest.fn().mockReturnValue({
      order: mockOrder.mockResolvedValue({ data: [row], error: null }),
    });
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({ eq: mockEq2 }),
    });

    const { result } = renderHook(() => useMyGroupInvitations(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.[0]?.group.name).toBe('Local Crew');
    expect(result.current.data?.[0]?.inviter.displayName).toBe('Alice');
  });
});

describe('useSearchInvitableUsers', () => {
  it('calls the search RPC with the trimmed query', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'user-9', display_name: 'Zoe', avatar_url: null }],
      error: null,
    });

    const { result } = renderHook(() => useSearchInvitableUsers('group-1' as GroupId, '  zo '), {
      wrapper: createQueryClientHookWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockRpc).toHaveBeenCalledWith('search_invitable_users', {
      p_group_id: 'group-1',
      p_query: 'zo',
    });
    expect(result.current.data).toEqual([
      { id: 'user-9', displayName: 'Zoe', avatarUrl: undefined },
    ]);
  });

  it('is disabled when query is empty', () => {
    const { result } = renderHook(() => useSearchInvitableUsers('group-1' as GroupId, '   '), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
