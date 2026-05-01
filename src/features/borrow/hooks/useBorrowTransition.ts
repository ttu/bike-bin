import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { invalidateBorrowMutationCaches } from './invalidateBorrowMutationCaches';
import type { BorrowRequestId, BorrowRequestStatus, ItemId, ItemStatus } from '@/shared/types';

interface BorrowTransitionParams {
  requestId: BorrowRequestId;
  itemId: ItemId;
}

interface UseBorrowTransitionOptions {
  newRequestStatus: BorrowRequestStatus;
  newItemStatus: ItemStatus;
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

      // For group-owned items, the `transition_borrow_request` RPC server-side
      // trigger records `auth.uid()` into `borrow_requests.acted_by` — the
      // client does not pass it. Group admin authorization is also enforced
      // server-side (see migration 00005_borrow_requests.sql).
      const { data, error } = await supabase.rpc('transition_borrow_request', {
        p_request_id: requestId,
        p_new_request_status: newRequestStatus,
        p_new_item_status: newItemStatus,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await invalidateBorrowMutationCaches(queryClient, additionalInvalidateKeys);
    },
  });
}
