import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type {
  GroupId,
  GroupInvitation,
  GroupInvitationId,
  GroupInvitationRow,
  UserId,
} from '@/shared/types';
import { GroupInvitationStatus } from '@/shared/types';

function mapRow(row: GroupInvitationRow): GroupInvitation {
  return {
    id: row.id as GroupInvitationId,
    groupId: row.group_id as GroupId,
    inviteeUserId: row.invitee_user_id as UserId,
    inviterUserId: (row.inviter_user_id ?? undefined) as UserId | undefined,
    status: row.status as GroupInvitationStatus,
    createdAt: row.created_at,
    respondedAt: row.responded_at ?? undefined,
  };
}

/**
 * Pending invitations for a given group (admin view).
 * Joined with invitee display name / avatar for UI.
 */
export interface PendingGroupInvitation extends GroupInvitation {
  invitee: { displayName: string | undefined; avatarUrl: string | undefined };
}

export function usePendingGroupInvitations(groupId: GroupId | undefined) {
  return useQuery({
    queryKey: ['group-invitations', groupId],
    queryFn: async (): Promise<PendingGroupInvitation[]> => {
      const { data, error } = await supabase
        .from('group_invitations')
        .select(
          'id, group_id, invitee_user_id, inviter_user_id, status, created_at, responded_at, profiles:invitee_user_id(display_name, avatar_url)',
        )
        .eq('group_id', groupId as string)
        .eq('status', GroupInvitationStatus.Pending)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((row) => {
        const profile = row.profiles as unknown as
          | { display_name?: string; avatar_url?: string }
          | undefined;
        return {
          ...mapRow(row as unknown as GroupInvitationRow),
          invitee: {
            displayName: profile?.display_name,
            avatarUrl: profile?.avatar_url,
          },
        };
      });
    },
    enabled: !!groupId,
  });
}

/**
 * Pending invitations addressed to the current user (invitee view).
 * Joined with group info + inviter display name for UI.
 */
export interface MyGroupInvitation extends GroupInvitation {
  group: { name: string; isPublic: boolean };
  inviter: { displayName: string | undefined };
}

export function useMyGroupInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-group-invitations', user?.id],
    queryFn: async (): Promise<MyGroupInvitation[]> => {
      const { data, error } = await supabase
        .from('group_invitations')
        .select(
          'id, group_id, invitee_user_id, inviter_user_id, status, created_at, responded_at, groups:group_id(name, is_public), inviter:profiles!group_invitations_inviter_user_id_fkey(display_name)',
        )
        .eq('invitee_user_id', user!.id)
        .eq('status', GroupInvitationStatus.Pending)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((row) => {
        const group = row.groups as unknown as { name: string; is_public: boolean } | undefined;
        const inviter = row.inviter as unknown as { display_name?: string } | undefined;
        return {
          ...mapRow(row as unknown as GroupInvitationRow),
          group: {
            name: group?.name ?? '',
            isPublic: group?.is_public ?? false,
          },
          inviter: { displayName: inviter?.display_name },
        };
      });
    },
    enabled: !!user?.id,
  });
}

/** Admin creates a pending invitation for a given user. */
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: GroupId; userId: UserId }) => {
      const { error } = await supabase.from('group_invitations').insert({
        group_id: groupId,
        invitee_user_id: userId,
        inviter_user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations', groupId] });
    },
  });
}

/** Admin cancels a pending invitation. */
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: GroupInvitationId; groupId: GroupId }) => {
      const { error } = await supabase
        .from('group_invitations')
        .update({
          status: GroupInvitationStatus.Cancelled,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations', groupId] });
    },
  });
}

/**
 * Invitee accepts: calls the atomic RPC which flips status + inserts group_members.
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: GroupInvitationId; groupId: GroupId }) => {
      const { error } = await supabase.rpc('accept_group_invitation', {
        p_invitation_id: invitationId as string,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-group-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
    },
  });
}

/** Invitee rejects a pending invitation. */
export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: GroupInvitationId }) => {
      const { error } = await supabase
        .from('group_invitations')
        .update({
          status: GroupInvitationStatus.Rejected,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-group-invitations'] });
    },
  });
}

/** Admin-only: search profiles eligible to invite into a group. */
export interface InvitableUser {
  id: UserId;
  displayName: string | undefined;
  avatarUrl: string | undefined;
}

export function useSearchInvitableUsers(groupId: GroupId, query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['invitable-users', groupId, trimmed],
    queryFn: async (): Promise<InvitableUser[]> => {
      const { data, error } = await supabase.rpc('search_invitable_users', {
        p_group_id: groupId as string,
        p_query: trimmed,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        id: string;
        display_name: string | null;
        avatar_url: string | null;
      }>;
      return rows.map((row) => ({
        id: row.id as UserId,
        displayName: row.display_name ?? undefined,
        avatarUrl: row.avatar_url ?? undefined,
      }));
    },
    enabled: !!groupId && trimmed.length > 0,
  });
}
