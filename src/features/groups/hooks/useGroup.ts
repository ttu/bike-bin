import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { Group } from '@/shared/types';
import type { GroupId } from '@/shared/types';

/**
 * Fetch a single group by ID.
 */
export function useGroup(id: GroupId | undefined) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').eq('id', id!).single();

      if (error) throw error;
      return data as Group;
    },
    enabled: !!id,
  });
}
