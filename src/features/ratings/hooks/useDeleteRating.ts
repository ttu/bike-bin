import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { DeleteRatingInput } from '../types';

/**
 * Delete a rating. Only the author can delete (enforced by RLS).
 * Deletable anytime, regardless of the editable window.
 */
export function useDeleteRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteRatingInput) => {
      const { error } = await supabase.from('ratings').delete().eq('id', input.id);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      if (variables.toUserId) {
        queryClient.invalidateQueries({ queryKey: ['ratings', variables.toUserId] });
      }
      if (variables.toGroupId) {
        queryClient.invalidateQueries({ queryKey: ['group-rating', variables.toGroupId] });
      }
    },
  });
}
