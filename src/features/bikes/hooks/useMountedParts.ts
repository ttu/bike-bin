import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { BikeId } from '@/shared/types';
import { mapItemRow } from '@/shared/utils/mapItemRow';

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
      return (data ?? []).map((row) => mapItemRow(row));
    },
    enabled: !!bikeId,
  });
}
