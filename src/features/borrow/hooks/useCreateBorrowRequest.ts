import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { invalidateBorrowMutationCaches } from './invalidateBorrowMutationCaches';
import { ItemStatus, type ItemId } from '@/shared/types';

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
        .update({ status: ItemStatus.Reserved })
        .eq('id', itemId);

      if (itemError) throw itemError;

      return request;
    },
    onSuccess: async () => {
      await invalidateBorrowMutationCaches(queryClient);
    },
  });
}
