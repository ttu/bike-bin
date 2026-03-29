import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { BorrowRequestId, ItemId } from '@/shared/types';

/** Query key prefix; invalidate all item-specific queries after borrow state changes. */
export const ACCEPTED_BORROW_REQUEST_FOR_ITEM_QUERY_KEY = 'acceptedBorrowRequestForItem' as const;

export function useAcceptedBorrowRequestForItem(
  itemId: ItemId | undefined,
  options: { enabled: boolean },
) {
  return useQuery({
    queryKey: [ACCEPTED_BORROW_REQUEST_FOR_ITEM_QUERY_KEY, itemId],
    queryFn: async (): Promise<BorrowRequestId | null> => {
      if (!itemId) return null;

      const { data, error } = await supabase
        .from('borrow_requests')
        .select('id')
        .eq('item_id', itemId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return data.id as BorrowRequestId;
    },
    enabled: itemId !== undefined && options.enabled,
  });
}
