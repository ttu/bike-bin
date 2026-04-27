import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { SEARCH_ITEMS_QUERY_KEY } from '@/shared/api/queryKeys';
import type { ItemId, UserId, GroupId } from '@/shared/types';

type TransferParams =
  | { itemId: ItemId; toOwnerId: UserId; toGroupId?: never }
  | { itemId: ItemId; toOwnerId?: never; toGroupId: GroupId };

export function useTransferItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: TransferParams) => {
      const { error } = await supabase.rpc('transfer_item_ownership', {
        p_item_id: params.itemId,
        p_to_owner_id: params.toOwnerId ?? null,
        p_to_group_id: params.toGroupId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['group-items'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: SEARCH_ITEMS_QUERY_KEY });
    },
  });
}
