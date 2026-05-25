import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { resolveConversation } from '../utils/resolveConversation';
import { CONVERSATIONS_QUERY_KEY } from './useConversations';
import type { ConversationId, GroupId, ItemId, UserId } from '@/shared/types';

/**
 * Parameters for creating a conversation about an item.
 *
 * - For **personal items**, pass `otherUserId` (the item owner).
 * - For **group-owned items**, pass `groupId`; all of the group's admins will
 *   be added as participants so the shared inbox model works (any admin can
 *   reply on behalf of the group).
 *
 * Exactly one of `otherUserId` or `groupId` must be provided.
 */
interface CreateConversationParams {
  itemId: ItemId;
  otherUserId?: UserId;
  groupId?: GroupId;
}

interface CreateConversationResult {
  conversationId: ConversationId;
  isExisting: boolean;
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemId,
      otherUserId,
      groupId,
    }: CreateConversationParams): Promise<CreateConversationResult> => {
      if (!user) throw new Error('Must be authenticated to create conversations');
      return resolveConversation({ supabase, itemId, selfId: user.id, otherUserId, groupId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_QUERY_KEY],
      });
    },
  });
}
