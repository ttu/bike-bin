import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { BORROW_REQUESTS_QUERY_KEY } from './useBorrowRequests';
import type { BorrowRequestId, ItemId } from '@/shared/types';

interface BorrowTransitionParams {
  requestId: BorrowRequestId;
  itemId: ItemId;
}

interface UseBorrowTransitionOptions {
  newRequestStatus: string;
  newItemStatus: string;
  additionalInvalidateKeys?: string[];
}

export function useBorrowTransition({
  newRequestStatus,
  newItemStatus,
  additionalInvalidateKeys = [],
}: UseBorrowTransitionOptions) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ requestId }: BorrowTransitionParams) => {
      if (!user) throw new Error('Must be authenticated');

      const { data, error } = await supabase.rpc('transition_borrow_request', {
        p_request_id: requestId,
        p_new_request_status: newRequestStatus,
        p_new_item_status: newItemStatus,
      });

      if (error) throw error;
      return data;
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
      for (const key of additionalInvalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
