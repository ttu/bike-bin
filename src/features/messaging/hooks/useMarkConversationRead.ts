import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { UNREAD_COUNT_QUERY_KEY } from './useUnreadCount';
import type { ConversationId } from '@/shared/types';

/**
 * Marks a conversation as read up to now() for the current user.
 * Backed by the SECURITY DEFINER `mark_conversation_read` RPC, which restricts
 * the write to the caller's own conversation_participants row.
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: ConversationId) => {
      const { error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });
}
