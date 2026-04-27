import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { SEARCH_ITEMS_QUERY_KEY } from '@/shared/api/queryKeys';
import { BORROW_REQUESTS_QUERY_KEY } from './useBorrowRequests';
import type { BorrowRequestId, ItemId } from '@/shared/types';

interface CancelBorrowRequestParams {
  requestId: BorrowRequestId;
  itemId: ItemId;
}

export function useCancelBorrowRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ requestId, itemId }: CancelBorrowRequestParams) => {
      if (!user) throw new Error('Must be authenticated');

      const { data: request, error: reqError } = await supabase
        .from('borrow_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (reqError) throw reqError;

      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'stored' })
        .eq('id', itemId);

      if (itemError) throw itemError;

      return request;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [BORROW_REQUESTS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: SEARCH_ITEMS_QUERY_KEY }),
      ]);
    },
  });
}
