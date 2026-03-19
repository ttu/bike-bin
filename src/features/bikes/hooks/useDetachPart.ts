import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { ItemStatus } from '@/shared/types';
import type { ItemId, BikeId } from '@/shared/types';
import type { Item } from '@/shared/types';

export function useDetachPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: ItemId; bikeId: BikeId }) => {
      const { data, error } = await supabase
        .from('items')
        .update({
          bike_id: null,
          status: ItemStatus.Stored,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as Item;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['mounted-parts', variables.bikeId] });
    },
  });
}
