import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { GroupId } from '@/shared/types';

/**
 * Fetches the aggregate rating (`ratingAvg`, `ratingCount`) for a group.
 *
 * Kept as a standalone hook (rather than a field on `useGroup`) so the group
 * profile / borrow screens can subscribe to rating updates independently from
 * the base group row, and so invalidation after a new rating only re-fetches
 * the aggregate.
 */
export function useGroupRating(groupId: GroupId | undefined) {
  return useQuery({
    queryKey: ['group-rating', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('rating_avg, rating_count')
        .eq('id', groupId!)
        .single();
      if (error) throw error;
      return {
        ratingAvg: data.rating_avg as number,
        ratingCount: data.rating_count as number,
      };
    },
    enabled: !!groupId,
  });
}
