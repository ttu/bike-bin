import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserId } from '@/shared/types';

interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Mutation to update the current user's profile (display_name, avatar_url).
 * Invalidates the profile query on success.
 */
export function useUpdateProfile(userId: UserId | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const updates: Record<string, unknown> = {};
      if (input.displayName !== undefined) {
        updates.display_name = input.displayName;
      }
      if (input.avatarUrl !== undefined) {
        updates.avatar_url = input.avatarUrl;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
