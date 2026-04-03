import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { UserId } from '@/shared/types';
import { mapProfileRow } from '../utils/mapProfileRow';

/**
 * Fetch the current authenticated user's profile from the profiles table.
 */
export function useProfile(userId: UserId | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();

      if (error) throw error;

      return mapProfileRow(data);
    },
    enabled: !!userId,
  });
}
