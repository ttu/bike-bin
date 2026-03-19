import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { LocationId } from '@/shared/types';
import { mapLocationRow as mapRow } from '../utils/mapLocationRow';

/** Query key for user locations */
export const locationsQueryKey = (userId: string | undefined) => ['locations', userId];

/**
 * Fetch all saved locations for the current user.
 * Returns locations ordered by primary first, then by creation date.
 */
export function useLocations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: locationsQueryKey(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!user,
  });
}

/**
 * Fetch a single location by ID.
 */
export function useLocation(id: LocationId | undefined) {
  return useQuery({
    queryKey: ['locations', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return mapRow(data);
    },
    enabled: !!id,
  });
}
