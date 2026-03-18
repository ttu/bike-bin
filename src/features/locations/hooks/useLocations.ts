import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { SavedLocation } from '@/shared/types';
import type { LocationId } from '@/shared/types';

/** Query key for user locations */
export const locationsQueryKey = (userId: string | undefined) => ['locations', userId];

/** Transforms a Supabase row into the SavedLocation model */
function mapRow(row: Record<string, unknown>): SavedLocation {
  const coords = row.coordinates as { latitude: number; longitude: number } | null;
  return {
    id: row.id as LocationId,
    userId: row.user_id as SavedLocation['userId'],
    label: row.label as string,
    areaName: (row.area_name as string) ?? undefined,
    postcode: (row.postcode as string) ?? undefined,
    coordinates: coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined,
    isPrimary: row.is_primary as boolean,
    createdAt: row.created_at as string,
  };
}

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
