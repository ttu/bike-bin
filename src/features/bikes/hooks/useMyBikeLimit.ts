import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';

export function useMyBikeLimit() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bike-row-limit', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_bike_limit');
      if (error) {
        throw error;
      }
      if (data === null || data === undefined) {
        throw new Error('get_my_bike_limit returned empty');
      }
      return data;
    },
    enabled: !!user,
  });
}
