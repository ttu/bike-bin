import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserId } from '@/shared/types';
import type { PublicProfile } from '../types';

export function usePublicProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: async (): Promise<PublicProfile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, rating_avg, rating_count, created_at')
        .eq('id', userId!)
        .single();

      if (error) throw error;

      return {
        id: data.id as string as UserId,
        displayName: (data.display_name as string) ?? undefined,
        avatarUrl: (data.avatar_url as string) ?? undefined,
        ratingAvg: (data.rating_avg as number) ?? 0,
        ratingCount: (data.rating_count as number) ?? 0,
        createdAt: data.created_at as string,
      };
    },
    enabled: !!userId,
  });
}
