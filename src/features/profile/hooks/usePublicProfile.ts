import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserId } from '@/shared/types';
import type { PublicProfile } from '../types';

export function usePublicProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: async (): Promise<PublicProfile> => {
      const { data, error } = await supabase
        .rpc('get_public_profile', { p_user_id: userId! })
        .single();

      if (error) throw error;

      const row = data as Record<string, unknown>;
      return {
        id: row.id as string as UserId,
        displayName: (row.display_name as string) ?? undefined,
        avatarUrl: (row.avatar_url as string) ?? undefined,
        ratingAvg: (row.rating_avg as number) ?? 0,
        ratingCount: (row.rating_count as number) ?? 0,
        createdAt: row.created_at as string,
      };
    },
    enabled: !!userId,
  });
}
