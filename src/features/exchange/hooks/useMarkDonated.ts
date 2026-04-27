import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { SEARCH_ITEMS_QUERY_KEY } from '@/shared/api/queryKeys';
import { ItemStatus, type ItemId } from '@/shared/types';

interface MarkDonatedParams {
  itemId: ItemId;
}

export function useMarkDonated() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId }: MarkDonatedParams) => {
      if (!user) throw new Error('Not authenticated');

      const { error: statusError } = await supabase
        .from('items')
        .update({ status: ItemStatus.Donated })
        .eq('id', itemId);

      if (statusError) throw statusError;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: ['items', variables.itemId] }),
        queryClient.invalidateQueries({ queryKey: SEARCH_ITEMS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['conversation'] }),
      ]);
    },
  });
}
