import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { Rating } from '@/shared/types';
import { mapRatingRow } from '../utils/mapRatingRow';
import type { CreateRatingInput } from '../types';

/**
 * Create a new rating for a user or group after a completed transaction.
 * `editable_until` is set server-side by a BEFORE INSERT trigger.
 */
export function useCreateRating() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateRatingInput): Promise<Rating> => {
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          from_user_id: user!.id,
          to_user_id: input.toUserId ?? null,
          to_group_id: input.toGroupId ?? null,
          borrow_request_id: input.borrowRequestId,
          item_id: input.itemId,
          transaction_type: input.transactionType,
          score: input.score,
          text: input.text,
        })
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
        queryClient.invalidateQueries({ queryKey: ['ratings', 'group', variables.toGroupId] });
      }
    },
  });
}
