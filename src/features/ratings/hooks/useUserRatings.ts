import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserId } from '@/shared/types';
import { mapRatingWithReviewerRow } from '../utils/mapRatingRow';

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

      return (data ?? []).map((row) => mapRatingWithReviewerRow(row));
    },
    enabled: !!userId,
  });
}
