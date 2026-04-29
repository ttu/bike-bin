import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { GroupRole, type GroupId, type GroupMember, type UserId } from '@/shared/types';
import type { GroupMemberWithProfile } from '../types';

/**
 * Fetch all members of a group with their profile info.
 */
type GroupMemberRpcRow = {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function useGroupMembers(groupId: GroupId) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async (): Promise<GroupMemberRpcRow[]> => {
      const { data, error } = await supabase.rpc('get_group_members_with_profiles', {
        p_group_id: groupId,
      });

      if (error) throw error;
      return (data ?? []) as GroupMemberRpcRow[];
    },
    select: (data) =>
      data.map((row) => ({
        groupId: row.group_id as GroupId,
        userId: row.user_id as UserId,
        role: row.role as GroupMember['role'],
        joinedAt: row.joined_at,
        profile: {
          displayName: row.display_name ?? undefined,
          avatarUrl: row.avatar_url ?? undefined,
        },
      })) as GroupMemberWithProfile[],
    enabled: !!groupId,
  });
}

/**
 * Promote a member to admin.
 */
export function usePromoteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: GroupId; userId: UserId }) => {
      const { error } = await supabase
        .from('group_members')
        .update({ role: GroupRole.Admin })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
    },
  });
}

/**
 * Remove a member from a group.
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: GroupId; userId: UserId }) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
