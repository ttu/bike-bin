import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';

export const UNREAD_COUNT_QUERY_KEY = 'unread_message_count';

/**
 * Returns the total unread message count across all conversations.
 *
 * Implementation note: In a production app, this would use a DB function
 * or a separate read_at tracking table. For MVP, we use a simplified
 * approach based on the latest message timestamp tracking.
 *
 * For now, returns 0 as full unread tracking requires additional
 * DB schema (conversation_read_at table). The hook is wired up
 * for realtime updates so it will work once the backend is extended.
 */
export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [UNREAD_COUNT_QUERY_KEY, user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;

      // Simplified: count conversations with messages not from the current user
      // that were sent after the last time the user viewed the conversation.
      // For MVP, we return 0 — full unread tracking is a post-MVP enhancement.
      return 0;
    },
    enabled: !!user,
  });

  // Subscribe to new messages across all conversations to update count
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Only update if the message is from someone else
          if (payload.new && (payload.new as Record<string, unknown>).sender_id !== user.id) {
            void queryClient.invalidateQueries({
              queryKey: [UNREAD_COUNT_QUERY_KEY],
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}
