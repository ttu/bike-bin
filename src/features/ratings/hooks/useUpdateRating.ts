import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { mapRatingRow } from '../utils/mapRatingRow';
import type { UpdateRatingInput } from '../types';

/**
 * Update a rating within its editable window.
 * RLS enforces that only the author can update, and only within the window.
 */
export function useUpdateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRatingInput) => {
      const { data, error } = await supabase
        .from('ratings')
        .update({
          score: input.score,
          text: input.text,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return mapRatingRow(data);
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
