import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { LocationId } from '@/shared/types';
import { locationsQueryKey } from './useLocations';

export class DeleteLocationError extends Error {
  constructor(
    message: string,
    public readonly code: 'LAST_LOCATION' | 'HAS_ITEMS' | 'DELETE_FAILED',
  ) {
    super(message);
    this.name = 'DeleteLocationError';
  }
}

/**
 * Delete a saved location.
 * Blocked if it's the user's only location or if items reference it.
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: LocationId) => {
      // Check if this is the only location
      const { count: locationCount } = await supabase
        .from('saved_locations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if ((locationCount ?? 0) <= 1) {
        throw new DeleteLocationError('Cannot delete your only saved location', 'LAST_LOCATION');
      }

      // Check if items reference this location
      const { count: itemCount } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('pickup_location_id', id);

      if ((itemCount ?? 0) > 0) {
        throw new DeleteLocationError(
          'Cannot delete a location that is used by items. Reassign items first.',
          'HAS_ITEMS',
        );
      }

      const { error } = await supabase.from('saved_locations').delete().eq('id', id);

      if (error) {
        throw new DeleteLocationError(error.message, 'DELETE_FAILED');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsQueryKey(user?.id) });
    },
  });
}
