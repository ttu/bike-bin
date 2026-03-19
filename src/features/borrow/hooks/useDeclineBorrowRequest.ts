import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { BORROW_REQUESTS_QUERY_KEY } from './useBorrowRequests';
import type { BorrowRequestId, ItemId } from '@/shared/types';

interface DeclineBorrowRequestParams {
  requestId: BorrowRequestId;
  itemId: ItemId;
}

export function useDeclineBorrowRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ requestId, itemId }: DeclineBorrowRequestParams) => {
      if (!user) throw new Error('Must be authenticated');

      // Update request status to Rejected
      const { data: request, error: reqError } = await supabase
        .from('borrow_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (reqError) throw reqError;

      // Restore item status to Stored
      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'stored' })
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
