import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { Item } from '@/shared/types';
import type { BikeId } from '@/shared/types';

export function useMountedParts(bikeId: BikeId) {
  return useQuery({
    queryKey: ['mounted-parts', bikeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('bike_id', bikeId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Item[];
    },
    enabled: !!bikeId,
  });
}
