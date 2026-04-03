import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { MessageWithSender } from '../types';
import type { ConversationId } from '@/shared/types';
import { mapMessageRow } from '../utils/mapMessageRow';

const PAGE_SIZE = 30;

export const MESSAGES_QUERY_KEY = 'messages';

export function useMessages(conversationId: ConversationId | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: [MESSAGES_QUERY_KEY, conversationId],
    queryFn: async ({ pageParam }): Promise<MessageWithSender[]> => {
      if (!userId || !conversationId) return [];

      let query = supabase
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.lt('created_at', pageParam as string);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data ?? []).map((msg) => mapMessageRow(msg, userId!));
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1]?.createdAt;
    },
    enabled: !!userId && !!conversationId,
  });
}
