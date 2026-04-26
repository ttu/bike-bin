import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { LocationId, SavedLocation } from '@/shared/types';
import { geocodePostcode } from '../utils/geocoding';
import { locationsQueryKey } from './useLocations';
import type { CreateLocationInput } from '../types';

/**
 * Create a new saved location.
 * Geocodes the postcode via the Edge Function, then saves to saved_locations.
 * If isPrimary is true, demotes any existing primary location first.
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateLocationInput) => {
      // Geocode the postcode
      const geocoded = await geocodePostcode(input.postcode, input.country);

      // If setting as primary, unset existing primary first
      if (input.isPrimary) {
        await supabase
          .from('saved_locations')
          .update({ is_primary: false })
          .eq('user_id', user!.id)
          .eq('is_primary', true);
      }

      const { data, error } = await supabase
        .from('saved_locations')
        .insert({
          user_id: user!.id,
          label: input.label,
          postcode: input.postcode.trim(),
          area_name: geocoded.areaName,
          coordinates: `POINT(${geocoded.lng} ${geocoded.lat})`,
          is_primary: input.isPrimary ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id as LocationId,
        userId: data.user_id as SavedLocation['userId'],
        label: data.label as string,
        areaName: data.area_name as string,
        postcode: data.postcode as string,
        coordinates: { latitude: geocoded.lat, longitude: geocoded.lng },
        isPrimary: data.is_primary as boolean,
        createdAt: data.created_at as string,
      } satisfies SavedLocation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsQueryKey(user?.id) });
    },
  });
}
