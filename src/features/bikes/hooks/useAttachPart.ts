import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { ItemStatus, type BikeId, type Item, type ItemId } from '@/shared/types';

export function useAttachPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, bikeId }: { itemId: ItemId; bikeId: BikeId }) => {
      const { data, error } = await supabase
        .from('items')
        .update({
          bike_id: bikeId,
          status: ItemStatus.Mounted,
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
