import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import type { ConversationListItem } from '../types';
import { fetchConversationsForUser } from '../utils/fetchConversationsForUser';

export const CONVERSATIONS_QUERY_KEY = 'conversations';

export function useConversations() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [CONVERSATIONS_QUERY_KEY, userId],
    queryFn: async (): Promise<ConversationListItem[]> => {
      if (!userId) return [];
      return fetchConversationsForUser(userId);
    },
    enabled: !!userId,
  });
}
