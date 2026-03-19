import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserProfile } from '@/shared/types';
import type { UserId } from '@/shared/types';

/**
 * Fetch the current authenticated user's profile from the profiles table.
 */
export function useProfile(userId: UserId | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();

      if (error) throw error;

      return {
        id: data.id as string as UserId,
        displayName: (data.display_name as string) ?? undefined,
        avatarUrl: (data.avatar_url as string) ?? undefined,
        ratingAvg: data.rating_avg as number,
        ratingCount: data.rating_count as number,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      } as UserProfile;
    },
    enabled: !!userId,
  });
}
