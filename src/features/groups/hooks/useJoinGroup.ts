import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import { GroupRole, type GroupId } from '@/shared/types';

/**
 * Join a group. For public groups, the user joins directly as a member.
 * For private groups, the user would need an invitation (see useGroupInvitations).
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId: GroupId) => {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user!.id,
        role: GroupRole.Member,
      });

      if (error) throw error;
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['search-groups'] });
    },
  });
}

/**
 * Leave a group.
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId: GroupId) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
    },
  });
}
