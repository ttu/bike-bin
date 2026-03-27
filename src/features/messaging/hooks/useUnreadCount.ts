import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';

export const UNREAD_COUNT_QUERY_KEY = 'unread_message_count';

/**
 * Returns the total unread message count across all conversations.
 *
 * For MVP, returns 0 — full unread tracking requires a conversation_read_at
 * table (post-MVP enhancement). Real-time updates for the active conversation
 * are handled by useRealtimeMessages, which invalidates this query key when
 * new messages arrive.
 *
 * Note: A previous implementation subscribed to all message inserts without a
 * filter. Supabase postgres_changes does not enforce RLS, so this delivered
 * every message row to every authenticated client. Removed to prevent data leakage.
 */
export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [UNREAD_COUNT_QUERY_KEY, user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      // Full unread tracking is a post-MVP enhancement (requires conversation_read_at table).
      return 0;
    },
    enabled: !!user,
  });
}
