import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { Rating } from '@/shared/types';
import type { RatingId, UserId, ItemId } from '@/shared/types';
import { RATING_WINDOW_DAYS } from '../utils/ratingWindow';
import type { CreateRatingInput } from '../types';

/**
 * Create a new rating for a user after a completed transaction.
 * Automatically sets `editable_until` to 14 days from now.
 */
export function useCreateRating() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateRatingInput) => {
      const editableUntil = new Date();
      editableUntil.setDate(editableUntil.getDate() + RATING_WINDOW_DAYS);

      const { data, error } = await supabase
        .from('ratings')
        .insert({
          from_user_id: user!.id,
          to_user_id: input.toUserId,
          item_id: input.itemId,
          transaction_type: input.transactionType,
          score: input.score,
          text: input.text,
          editable_until: editableUntil.toISOString(),
        })
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
