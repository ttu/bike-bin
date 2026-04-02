import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { BORROW_REQUESTS_QUERY_KEY } from './useBorrowRequests';
import type { ItemId } from '@/shared/types';

interface CreateBorrowRequestParams {
  itemId: ItemId;
  message?: string;
}

export function useCreateBorrowRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId, message }: CreateBorrowRequestParams) => {
      if (!user) throw new Error('Must be authenticated to create borrow requests');

      // Create the borrow request
      const { data: request, error: reqError } = await supabase
        .from('borrow_requests')
        .insert({
          item_id: itemId,
          requester_id: user.id,
          message: message?.trim() || null,
        })
        .select()
        .single();

      if (reqError) throw reqError;

      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'reserved' })
        .eq('id', itemId);

      if (itemError) throw itemError;

      return request;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [BORROW_REQUESTS_QUERY_KEY],
      });
      // Invalidate items to reflect Reserved status
      void queryClient.invalidateQueries({
        queryKey: ['items'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['searchItems'],
      });
    },
  });
}
