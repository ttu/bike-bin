import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { MESSAGES_QUERY_KEY } from './useMessages';
import { CONVERSATIONS_QUERY_KEY } from './useConversations';
import type { ConversationId } from '@/shared/types';

interface SendMessageParams {
  conversationId: ConversationId;
  body: string;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, body }: SendMessageParams) => {
      if (!user) throw new Error('Must be authenticated to send messages');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: body.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate messages for this conversation to update the list
      void queryClient.invalidateQueries({
        queryKey: [MESSAGES_QUERY_KEY, variables.conversationId],
      });
      // Invalidate conversations list to update last message preview
      void queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_QUERY_KEY],
      });
    },
  });
}
