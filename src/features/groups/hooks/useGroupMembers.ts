import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { GroupMember } from '@/shared/types';
import type { GroupId, UserId } from '@/shared/types';
import { GroupRole } from '@/shared/types';
import type { GroupMemberWithProfile } from '../types';

/**
 * Fetch all members of a group with their profile info.
 */
export function useGroupMembers(groupId: GroupId) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, user_id, role, joined_at, profiles(display_name, avatar_url)')
        .eq('group_id', groupId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => {
        const profile = row.profiles as unknown as
          | { display_name?: string; avatar_url?: string }
          | undefined;
        return {
          groupId: row.group_id as string as GroupId,
          userId: row.user_id as string as UserId,
          role: row.role as string as GroupMember['role'],
          joinedAt: row.joined_at as string,
          profile: {
            displayName: profile?.display_name,
            avatarUrl: profile?.avatar_url,
          },
        };
      }) as GroupMemberWithProfile[];
    },
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
