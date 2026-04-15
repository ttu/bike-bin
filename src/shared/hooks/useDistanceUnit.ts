import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserId } from '@/shared/types';
import type { DistanceUnit } from '@/shared/types';
import { useAuth } from '@/features/auth';
import { useProfile } from '@/features/profile';

/**
 * Hook to read and update the user's distance unit preference (km/mi).
 * Reads from the profile query; updates via a Supabase mutation.
 * Falls back to 'km' when no profile is loaded.
 */
export function useDistanceUnit() {
  const { user } = useAuth();
  const userId = user?.id as UserId | undefined;
  const { data: profile } = useProfile(userId);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (unit: DistanceUnit) => {
      const { error } = await supabase
        .from('profiles')
        .update({ distance_unit: unit })
        .eq('id', userId!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  const setDistanceUnit = useCallback(
    (unit: DistanceUnit) => {
      mutation.mutate(unit);
    },
    [mutation],
  );

  return {
    distanceUnit: profile?.distanceUnit ?? 'km',
    setDistanceUnit,
  };
}
