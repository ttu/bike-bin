import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { MESSAGES_QUERY_KEY } from './useMessages';
import { CONVERSATIONS_QUERY_KEY } from './useConversations';
import { UNREAD_COUNT_QUERY_KEY } from './useUnreadCount';
import { useMarkConversationRead } from './useMarkConversationRead';
import type { ConversationId } from '@/shared/types';

interface UseRealtimeMessagesOptions {
  /**
   * When true, an arriving message marks the conversation as read instead of
   * incrementing the unread count. The conversation screen passes the screen's
   * focus state here.
   */
  isFocused?: boolean;
}

/**
 * Subscribe to realtime message inserts for a conversation.
 * Updates the TanStack Query cache when new messages arrive.
 */
export function useRealtimeMessages(
  conversationId: ConversationId | undefined,
  { isFocused = false }: UseRealtimeMessagesOptions = {},
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { mutate: markRead } = useMarkConversationRead();

  // Read the latest isFocused inside the channel handler without re-subscribing.
  const isFocusedRef = useRef(isFocused);
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

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
          const invalidations = [
            queryClient.invalidateQueries({
              queryKey: [MESSAGES_QUERY_KEY, conversationId],
            }),
            queryClient.invalidateQueries({
              queryKey: [CONVERSATIONS_QUERY_KEY, user.id],
            }),
          ];

          if (isFocusedRef.current) {
            markRead(conversationId);
          } else {
            invalidations.push(
              queryClient.invalidateQueries({
                queryKey: [UNREAD_COUNT_QUERY_KEY],
              }),
            );
          }

          Promise.all(invalidations).catch(() => undefined);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => undefined);
    };
  }, [conversationId, user, queryClient, markRead]);
}
