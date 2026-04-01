import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { ItemStatus } from '@/shared/types';
import type { ItemId } from '@/shared/types';

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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: ['items', variables.itemId] });
      void queryClient.invalidateQueries({ queryKey: ['searchItems'] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}
