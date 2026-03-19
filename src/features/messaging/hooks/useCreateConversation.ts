import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { CONVERSATIONS_QUERY_KEY } from './useConversations';
import type { ConversationId, ItemId, UserId } from '@/shared/types';

interface CreateConversationParams {
  itemId: ItemId;
  otherUserId: UserId;
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
    }: CreateConversationParams): Promise<CreateConversationResult> => {
      if (!user) throw new Error('Must be authenticated to create conversations');

      // Check if a conversation already exists for this item + participant pair
      const { data: existing } = await supabase
        .from('conversations')
        .select(
          `
          id,
          conversation_participants!inner (user_id)
        `,
        )
        .eq('item_id', itemId);

      if (existing) {
        for (const conv of existing) {
          const participants = conv.conversation_participants as { user_id: string }[] | undefined;
          const participantIds = participants?.map((p) => p.user_id) ?? [];
          if (participantIds.includes(user.id) && participantIds.includes(otherUserId)) {
            return {
              conversationId: conv.id as ConversationId,
              isExisting: true,
            };
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ item_id: itemId })
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: partError } = await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);

      if (partError) throw partError;

      return {
        conversationId: newConv.id as ConversationId,
        isExisting: false,
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_QUERY_KEY],
      });
    },
  });
}
