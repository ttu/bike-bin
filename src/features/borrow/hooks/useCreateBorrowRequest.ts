import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { invalidateBorrowMutationCaches } from './invalidateBorrowMutationCaches';
import type { ConversationId, GroupId, ItemId, UserId } from '@/shared/types';
import { resolveConversation, CONVERSATIONS_QUERY_KEY } from '@/features/messaging';

export interface CreateBorrowRequestParams {
  itemId: ItemId;
  ownerId?: UserId;
  groupId?: GroupId;
  message?: string;
}

export interface CreateBorrowRequestResult {
  requestId: string;
  conversationId: ConversationId;
}

export function useCreateBorrowRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemId,
      ownerId,
      groupId,
      message,
    }: CreateBorrowRequestParams): Promise<CreateBorrowRequestResult> => {
      if (!user) throw new Error('Must be authenticated to create borrow requests');

      if (!ownerId && !groupId) {
        throw new Error('Either ownerId or groupId must be provided');
      }

      const { data: request, error: reqError } = await supabase
        .from('borrow_requests')
        .insert({
          item_id: itemId,
          requester_id: user.id,
          message: message?.trim() ?? null,
        })
        .select()
        .single();

      if (reqError) throw reqError;

      const conv = await resolveConversation({
        supabase,
        itemId,
        selfId: user.id,
        otherUserId: ownerId,
        groupId,
      });

      return { requestId: (request as { id: string }).id, conversationId: conv.conversationId };
    },
    onSuccess: async () => {
      await invalidateBorrowMutationCaches(queryClient);
      await queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_QUERY_KEY] });
    },
  });
}
