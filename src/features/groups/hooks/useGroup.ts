import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { GroupId } from '@/shared/types';
import { mapGroupRow } from '../utils/mapGroupRow';

/**
 * Fetch a single group by ID.
 */
export function useGroup(id: GroupId | undefined) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').eq('id', id!).single();

      if (error) throw error;
      return mapGroupRow(data);
    },
    enabled: !!id,
  });
}
