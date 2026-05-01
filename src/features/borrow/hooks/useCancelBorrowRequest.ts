import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { invalidateBorrowMutationCaches } from './invalidateBorrowMutationCaches';
import { BorrowRequestStatus, ItemStatus, type BorrowRequestId, type ItemId } from '@/shared/types';

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
        .update({ status: BorrowRequestStatus.Cancelled, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (reqError) throw reqError;

      const { error: itemError } = await supabase
        .from('items')
        .update({ status: ItemStatus.Stored })
        .eq('id', itemId);

      if (itemError) throw itemError;

      return request;
    },
    onSuccess: async () => {
      await invalidateBorrowMutationCaches(queryClient);
    },
  });
}
