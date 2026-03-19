import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { GroupRole } from '@/shared/types';
import type { GroupId, UserId } from '@/shared/types';

/**
 * Invite a user to a group (admin-only).
 * Adds the user directly as a member.
 */
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: GroupId; userId: UserId }) => {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: userId,
        role: GroupRole.Member,
      });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
    },
  });
}
