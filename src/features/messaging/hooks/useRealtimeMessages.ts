import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { MESSAGES_QUERY_KEY } from './useMessages';
import { CONVERSATIONS_QUERY_KEY } from './useConversations';
import { UNREAD_COUNT_QUERY_KEY } from './useUnreadCount';
import type { ConversationId } from '@/shared/types';

/**
 * Subscribe to realtime message inserts for a conversation.
 * Automatically updates the TanStack Query cache on new messages.
 */
export function useRealtimeMessages(conversationId: ConversationId | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // Invalidate messages query to refetch
          void queryClient.invalidateQueries({
            queryKey: [MESSAGES_QUERY_KEY, conversationId],
          });
          // Invalidate conversations list to update last message
          void queryClient.invalidateQueries({
            queryKey: [CONVERSATIONS_QUERY_KEY],
          });
          // Invalidate unread count
          void queryClient.invalidateQueries({
            queryKey: [UNREAD_COUNT_QUERY_KEY],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient]);
}
