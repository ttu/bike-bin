import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import { mapLocationRow as mapRow } from '../utils/mapLocationRow';

/**
 * Returns the user's primary saved location.
 * Used by search (Phase 6) and item forms to default the pickup location.
 */
export function usePrimaryLocation() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['locations', 'primary', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_primary', true)
        .single();

      if (error) {
        // If no primary location, try to get the first one
        if (error.code === 'PGRST116') {
          const { data: fallback, error: fallbackError } = await supabase
            .from('saved_locations')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (fallbackError) return undefined;
          return mapRow(fallback);
        }
        throw error;
      }

      return mapRow(data);
    },
    enabled: !!user,
  });
}
