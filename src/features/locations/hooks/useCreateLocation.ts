import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import { geocodePostcode } from '../utils/geocoding';
import { mapLocationRow } from '../utils/mapLocationRow';
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
      const geocoded = await geocodePostcode(input.postcode, input.country);

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
      return mapLocationRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsQueryKey(user?.id) });
    },
  });
}
