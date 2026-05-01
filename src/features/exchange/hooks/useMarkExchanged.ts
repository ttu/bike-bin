import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { invalidateItemAndConversationCaches } from '@/shared/api/queryKeys';
import { ItemStatus, type ItemId } from '@/shared/types';
import type { ExchangeKind } from '../utils/getExchangeDialogConfig';

interface MarkExchangedParams {
  itemId: ItemId;
}

const STATUS_BY_KIND: Record<ExchangeKind, ItemStatus> = {
  donate: ItemStatus.Donated,
  sell: ItemStatus.Sold,
};

export function useMarkExchanged(kind: ExchangeKind) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId }: MarkExchangedParams) => {
      if (!user) throw new Error('Not authenticated');

      const { error: statusError } = await supabase
        .from('items')
        .update({ status: STATUS_BY_KIND[kind] })
        .eq('id', itemId);

      if (statusError) throw statusError;
    },
    onSuccess: async () => {
      await invalidateItemAndConversationCaches(queryClient);
    },
  });
}
