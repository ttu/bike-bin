import { useEffect, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import { MESSAGES_QUERY_KEY } from './useMessages';
import { CONVERSATIONS_QUERY_KEY } from './useConversations';
import { UNREAD_COUNT_QUERY_KEY } from './useUnreadCount';
import { useMarkConversationRead } from './useMarkConversationRead';
import { mapMessageRow } from '../utils/mapMessageRow';
import type { ConversationListItem, MessageWithSender } from '../types';
import type { ConversationId, MessageRow } from '@/shared/types';

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
 * Patches the TanStack Query cache directly (no broad invalidation) so active
 * chats don't refetch on every incoming message.
 */
export function useRealtimeMessages(
  conversationId: ConversationId | undefined,
  { isFocused = false }: UseRealtimeMessagesOptions = {},
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { mutate: markRead } = useMarkConversationRead();

  // Read latest isFocused/markRead inside the channel handler without re-subscribing.
  const isFocusedRef = useRef(isFocused);
  const markReadRef = useRef(markRead);
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);
  useEffect(() => {
    markReadRef.current = markRead;
  }, [markRead]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const userId = user.id;

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
        (payload) => {
          const newMessage = mapMessageRow(payload.new as MessageRow, userId);

          queryClient.setQueryData<InfiniteData<MessageWithSender[]>>(
            [MESSAGES_QUERY_KEY, conversationId],
            (old) => {
              if (!old) return old;
              const alreadyPresent = old.pages.some((page) =>
                page.some((m) => m.id === newMessage.id),
              );
              if (alreadyPresent) return old;
              const [first = [], ...rest] = old.pages;
              return { ...old, pages: [[newMessage, ...first], ...rest] };
            },
          );

          queryClient.setQueryData<ConversationListItem[]>(
            [CONVERSATIONS_QUERY_KEY, userId],
            (old) => {
              if (!old) return old;
              return old.map((conv) =>
                conv.id === conversationId
                  ? {
                      ...conv,
                      lastMessageBody: newMessage.body,
                      lastMessageSenderId: newMessage.senderId,
                      lastMessageAt: newMessage.createdAt,
                      unreadCount:
                        newMessage.isOwn || isFocusedRef.current
                          ? conv.unreadCount
                          : conv.unreadCount + 1,
                    }
                  : conv,
              );
            },
          );

          if (isFocusedRef.current) {
            markReadRef.current(conversationId);
          } else if (!newMessage.isOwn) {
            queryClient
              .invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] })
              .catch(() => undefined);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => undefined);
    };
  }, [conversationId, user, queryClient]);
}
