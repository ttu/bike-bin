import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { SavedLocation } from '@/shared/types';
import { geocodePostcode } from '../utils/geocoding';
import { locationsQueryKey } from './useLocations';
import type { UpdateLocationInput } from '../types';

/**
 * Update an existing saved location.
 * Re-geocodes the postcode if it changed.
 * If setting as primary, demotes other locations first.
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateLocationInput) => {
      const updates: Record<string, unknown> = {};

      if (input.label !== undefined) {
        updates.label = input.label;
      }

      // Re-geocode if postcode changed
      if (input.postcode !== undefined) {
        const geocoded = await geocodePostcode(input.postcode, input.country);
        updates.postcode = input.postcode.trim();
        updates.area_name = geocoded.areaName;
        updates.coordinates = `POINT(${geocoded.lng} ${geocoded.lat})`;
      }

      // Handle primary toggle
      if (input.isPrimary !== undefined) {
        if (input.isPrimary) {
          // Unset existing primary
          await supabase
            .from('saved_locations')
            .update({ is_primary: false })
            .eq('user_id', user!.id)
            .eq('is_primary', true);
        }
        updates.is_primary = input.isPrimary;
      }

      const { data, error } = await supabase
        .from('saved_locations')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SavedLocation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsQueryKey(user?.id) });
    },
  });
}
