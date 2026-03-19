import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { Rating, UserProfile } from '@/shared/types';
import type { RatingId, UserId, ItemId } from '@/shared/types';

export type RatingWithReviewer = Rating & {
  reviewer: Pick<UserProfile, 'displayName' | 'avatarUrl'>;
};

/**
 * Fetch all ratings for a user's public profile, ordered newest first.
 * Includes reviewer display name and avatar via profiles join.
 */
export function useUserRatings(userId: UserId) {
  return useQuery({
    queryKey: ['ratings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ratings')
        .select('*, profiles!ratings_from_user_id_fkey(display_name, avatar_url)')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => {
        const profile = row.profiles as unknown as
          | { display_name?: string; avatar_url?: string }
          | undefined;
        return {
          id: row.id as string as RatingId,
          fromUserId: row.from_user_id as string as UserId,
          toUserId: row.to_user_id as string as UserId,
          itemId: (row.item_id as string as ItemId) ?? undefined,
          transactionType: row.transaction_type as Rating['transactionType'],
          score: row.score as number,
          text: row.text ?? undefined,
          editableUntil: row.editable_until ?? undefined,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          reviewer: {
            displayName: profile?.display_name,
            avatarUrl: profile?.avatar_url,
          },
        } as RatingWithReviewer;
      });
    },
    enabled: !!userId,
  });
}
