import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { invalidateBorrowMutationCaches } from './invalidateBorrowMutationCaches';
import type { BorrowRequestId, ConversationId, GroupId, ItemId, UserId } from '@/shared/types';
import { resolveConversation, CONVERSATIONS_QUERY_KEY } from '@/features/messaging';

export interface CreateBorrowRequestParams {
  itemId: ItemId;
  ownerId?: UserId;
  groupId?: GroupId;
  message?: string;
}

export interface CreateBorrowRequestResult {
  requestId: BorrowRequestId;
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

      // Resolve the conversation first so a failure here doesn't leave an
      // orphaned borrow_request row. A find-or-create conversation with no
      // messages is a benign no-op if the subsequent insert fails.
      const conv = await resolveConversation({
        supabase,
        itemId,
        selfId: user.id,
        otherUserId: ownerId,
        groupId,
      });

      const trimmedMessage = message?.trim();
      const messageToInsert = trimmedMessage && trimmedMessage.length > 0 ? trimmedMessage : null;

      const { data: request, error: reqError } = await supabase
        .from('borrow_requests')
        .insert({
          item_id: itemId,
          requester_id: user.id,
          message: messageToInsert,
        })
        .select()
        .single();

      if (reqError) throw reqError;

      return {
        requestId: (request as { id: string }).id as BorrowRequestId,
        conversationId: conv.conversationId,
      };
    },
    onSuccess: async () => {
      await invalidateBorrowMutationCaches(queryClient);
      await queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_QUERY_KEY] });
    },
  });
}
