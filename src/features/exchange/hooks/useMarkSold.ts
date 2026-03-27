import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';

interface MarkSoldParams {
  itemId: ItemId;
  buyerId?: string;
}

/**
 * Marks an item as sold: updates item status to 'sold'.
 * Rating window creation is deferred to Phase 12 (Ratings & Reviews)
 * because the ratings table requires a valid score (1–5) on insert.
 */
export function useMarkSold() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId }: MarkSoldParams) => {
      if (!user) throw new Error('Not authenticated');

      // Update item status to sold
      const { error: statusError } = await supabase
        .from('items')
        .update({ status: ItemStatus.Sold })
        .eq('id', itemId);

      if (statusError) throw statusError;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: ['items', variables.itemId] });
      void queryClient.invalidateQueries({ queryKey: ['searchItems'] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}
