import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { Rating } from '@/shared/types';
import type { RatingId, UserId, ItemId } from '@/shared/types';
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

      return {
        id: data.id as string as RatingId,
        fromUserId: data.from_user_id as string as UserId,
        toUserId: data.to_user_id as string as UserId,
        itemId: (data.item_id as string as ItemId) ?? undefined,
        transactionType: data.transaction_type as Rating['transactionType'],
        score: data.score as number,
        text: data.text ?? undefined,
        editableUntil: data.editable_until ?? undefined,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      } as Rating;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', variables.toUserId] });
    },
  });
}
