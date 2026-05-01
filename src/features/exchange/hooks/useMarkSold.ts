import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { invalidateItemAndConversationCaches } from '@/shared/api/queryKeys';
import { ItemStatus, type ItemId } from '@/shared/types';

interface MarkSoldParams {
  itemId: ItemId;
}

export function useMarkSold() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId }: MarkSoldParams) => {
      if (!user) throw new Error('Not authenticated');

      const { error: statusError } = await supabase
        .from('items')
        .update({ status: ItemStatus.Sold })
        .eq('id', itemId);

      if (statusError) throw statusError;
    },
    onSuccess: async () => {
      await invalidateItemAndConversationCaches(queryClient);
    },
  });
}
