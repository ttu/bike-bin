import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { BORROW_REQUESTS_QUERY_KEY } from './useBorrowRequests';
import type { BorrowRequestId, ItemId } from '@/shared/types';

interface AcceptBorrowRequestParams {
  requestId: BorrowRequestId;
  itemId: ItemId;
}

export function useAcceptBorrowRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ requestId, itemId }: AcceptBorrowRequestParams) => {
      if (!user) throw new Error('Must be authenticated');

      // Update request status to Accepted
      const { data: request, error: reqError } = await supabase
        .from('borrow_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (reqError) throw reqError;

      // Update item status to Loaned
      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'loaned' })
        .eq('id', itemId);

      if (itemError) throw itemError;

      return request;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [BORROW_REQUESTS_QUERY_KEY],
      });
      void queryClient.invalidateQueries({
        queryKey: ['items'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['searchItems'],
      });
    },
  });
}
