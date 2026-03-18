import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { SavedLocation } from '@/shared/types';
import type { LocationId } from '@/shared/types';

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
