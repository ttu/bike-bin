import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { ConversationId } from '@/shared/types';

export const UNREAD_COUNT_QUERY_KEY = 'unread_message_count';

export type UnreadCountByConversation = ReadonlyMap<ConversationId, number>;

async function fetchUnreadCounts(): Promise<UnreadCountByConversation> {
  const { data, error } = await supabase.rpc('unread_message_count');
  if (error) throw error;

  const map = new Map<ConversationId, number>();
  for (const row of data ?? []) {
    map.set(row.conversation_id as ConversationId, Number(row.count));
  }
  return map;
}

function sumCounts(counts: UnreadCountByConversation): number {
  let total = 0;
  for (const n of counts.values()) total += n;
  return total;
}

/**
 * Total unread messages across all the current user's conversations.
 * Realtime invalidation is handled by useRealtimeMessages.
 */
export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [UNREAD_COUNT_QUERY_KEY, user?.id],
    queryFn: fetchUnreadCounts,
    enabled: !!user,
    select: sumCounts,
  });
}

/** Same query as useUnreadCount; exposes the per-conversation breakdown. */
export function useUnreadCountByConversation() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [UNREAD_COUNT_QUERY_KEY, user?.id],
    queryFn: fetchUnreadCounts,
    enabled: !!user,
  });
}
